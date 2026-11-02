// ═══════════════════════════════════════════════════════════════
// TIMER CORE — timestamp-based clock (pure functions, fully testable)
// ═══════════════════════════════════════════════════════════════
// The clock derives elapsed time from wall-clock timestamps instead of
// counting interval ticks. Mobile browsers throttle or suspend timers when
// the screen locks or the app is backgrounded — a tick-counting timer
// silently falls behind real time. A timestamp-based timer is always
// correct the moment it is next read.
//
// State shape: { startedAt, pausedAt, pausedTotal }
//   startedAt   — wall-clock ms when first started (null = never started)
//   pausedAt    — wall-clock ms when paused (null = not paused)
//   pausedTotal — accumulated ms spent paused

export function createTimerState() {
  return { startedAt: null, pausedAt: null, pausedTotal: 0 };
}

export function timerStart(state, now) {
  if (state.startedAt === null) return { startedAt: now, pausedAt: null, pausedTotal: 0 };
  if (state.pausedAt !== null) {
    return { ...state, pausedAt: null, pausedTotal: state.pausedTotal + (now - state.pausedAt) };
  }
  return state; // already running
}

export function timerPause(state, now) {
  if (state.startedAt === null || state.pausedAt !== null) return state;
  return { ...state, pausedAt: now };
}

export function timerIsRunning(state) {
  return state.startedAt !== null && state.pausedAt === null;
}

// Whole seconds elapsed, excluding paused time. Never negative.
export function computeElapsed(state, now) {
  if (state.startedAt === null) return 0;
  const end = state.pausedAt !== null ? state.pausedAt : now;
  return Math.max(0, Math.floor((end - state.startedAt - state.pausedTotal) / 1000));
}

// ── Boundary crossing ──
// After a clock jump (phone unlock), elapsed may advance many seconds in one
// update. Equality checks like `elapsed % 60 === 0` would skip the boundary.
// crossedBoundary answers: "does a boundary of the form offset + k*step
// (k >= 0) lie in the interval (prev, elapsed]?" — firing exactly once per
// crossing, and only once even when several boundaries were jumped over
// (events announce the CURRENT position, they don't replay history).
export function crossedBoundary(prev, elapsed, step, offset = 0) {
  if (elapsed <= prev || step <= 0 || elapsed < offset) return false;
  const lastBoundary = Math.floor((elapsed - offset) / step) * step + offset;
  return lastBoundary > prev;
}

// ── Programmed duration ──
// How long a timer config is MEANT to run, or null for clocks that have no
// natural end (stopwatch counts up; death-by runs until you fail).
//
// The clock itself never stops — overtime on an AMRAP is useful information,
// and a finished circuit still wants its elapsed time recorded. What this
// enables is switching the CUES off at the end: without it a circuit's
// position maths wraps straight into a phantom extra round and keeps beeping
// and calling exercises while the display already reads COMPLETE.
//
// Circuits, tabatas and fight-gone-bad blocks are built from repeating
// work+rest cycles, so their full cycle count ends on a rest. That last rest
// is a recovery nobody takes — the block is over the moment the final work
// period ends — so it is trimmed here, in one place. Stored circuit
// `totalSeconds` keeps counting it (the data convention); this is the end the
// clock and the displays actually use.
export function timerDuration(cfg) {
  if (!cfg) return null;
  const positive = (n) => (typeof n === "number" && n > 0 ? n : null);
  const trimRest = (total, rest) => (total > rest && rest > 0 ? total - rest : total);
  switch (cfg.type) {
    case "countdown":
    case "emom":
      return positive(cfg.totalSeconds);
    case "circuit":
      return positive(trimRest(cfg.totalSeconds, cfg.restSeconds || 0));
    case "tabata":
      return positive(trimRest((cfg.workSeconds + cfg.restSeconds) * cfg.rounds * (cfg.stations || 1), cfg.restSeconds));
    case "fgb":
      return positive(trimRest((cfg.stationSeconds * cfg.stations + cfg.restSeconds) * cfg.rounds, cfg.restSeconds));
    default:
      return null; // stopwatch, deathby — open-ended by design
  }
}

// ── Death By ──
// Every minute the reps go up until you can't finish inside the minute. A
// plain "death by burpees" starts at 1 and adds 1, so minute N is N reps — but
// the library's versions mix moves and start at different counts ("start with
// 3 KB Swings + 1 Goblet SQ, add 1 of each"). `moves` declares them:
// [{ name, start, add }], and minute N asks for start + (N - 1) * add of each.
// Returns null when the block carries no declared moves (the display then
// falls back to the generic "N reps").
export function deathByTargets(cfg, minute) {
  if (!cfg || !Array.isArray(cfg.moves) || cfg.moves.length === 0) return null;
  return cfg.moves.map(m => ({ name: m.name, reps: m.start + (minute - 1) * (m.add ?? 1) }));
}

// ── Tabata position ──
// A tabata is `rounds × stations` work/rest cycles. Two orderings exist:
//   blocks (default)  — every round of station 1, then station 2, … ("8 rounds
//                       per exercise", "4 rounds Plank, 4 rounds Situps").
//   rotate            — one cycle of each station in turn, then back to the
//                       first for the next round ("4 Rounds (40s on/20s off)"
//                       over a list of exercises). Four straight minutes of
//                       40s push-ups is not a workout, it's a failure.
// `nextStationIdx` is the station the following cycle works (null once the
// last cycle is under way), so displays and voice can ask "who's next?"
// without knowing which ordering is in play.
export function tabataPosition(cfg, elapsed) {
  const cycleLen = cfg.workSeconds + cfg.restSeconds;
  const rounds = cfg.rounds;
  const stations = cfg.stations || 1;
  const totalCycles = rounds * stations;
  const cycle = Math.floor(elapsed / cycleLen);
  const withinCycle = elapsed % cycleLen;
  const stationAt = (c) => (cfg.rotate ? c % stations : Math.floor(c / rounds));
  const roundAt = (c) => (cfg.rotate ? Math.floor(c / stations) : c % rounds) + 1;
  const isWork = withinCycle < cfg.workSeconds;
  return {
    cycleLen, totalCycles, cycle, withinCycle, isWork,
    secsLeft: isWork ? cfg.workSeconds - withinCycle : cycleLen - withinCycle,
    // finished when the final WORK period ends, not after its trailing rest
    done: elapsed >= timerDuration({ ...cfg, type: "tabata" }),
    stationIdx: stationAt(cycle),
    round: roundAt(cycle),
    nextStationIdx: cycle + 1 < totalCycles ? stationAt(cycle + 1) : null,
  };
}

// ── Circuit position ──
// A circuit runs a list of equal-length timed exercises for N rounds. By
// default the rest period comes once per round, after the whole list. An
// optional `restEvery: k` moves rest to fire after every k exercises — the
// "30s per exercise, 30s rest after each pair" park-workout pattern. With
// restEvery absent (or equal to the list length) this reduces exactly to the
// original one-rest-per-round maths, so existing circuits are unaffected.
//
// Returns the position at `elapsed`: which round, which exercise, whether the
// clock is in a rest period, and seconds left in the current period.
export function circuitPosition(cfg, elapsed) {
  const numEx = cfg.exercises ? cfg.exercises.length : 1;
  const exSec = cfg.exerciseSeconds;
  const rest = cfg.restSeconds || 0;
  const groupSize = Math.min(cfg.restEvery || numEx, numEx);
  const numGroups = Math.ceil(numEx / groupSize);
  const segLen = groupSize * exSec + rest;      // a full work-group plus its rest
  const roundLen = numEx * exSec + numGroups * rest;

  const roundIdx = Math.floor(elapsed / roundLen);
  const withinRound = elapsed % roundLen;
  // Every group but the last is full, so integer division lands correctly; the
  // clamp covers a short final group.
  const groupIdx = Math.min(Math.floor(withinRound / segLen), numGroups - 1);
  const withinSeg = withinRound - groupIdx * segLen;
  const groupEx = Math.min(groupSize, numEx - groupIdx * groupSize);
  const workLen = groupEx * exSec;

  const isRest = withinSeg >= workLen;
  const exIdx = groupIdx * groupSize + (isRest ? groupEx - 1 : Math.floor(withinSeg / exSec));
  const secsLeft = isRest ? (workLen + rest - withinSeg) : (exSec - (withinSeg % exSec));

  return { roundIdx, groupIdx, exIdx, isRest, secsLeft, roundLen, numEx };
}

// Identity of the segment the clock is sitting in. Compare across two elapsed
// values to detect "we just moved into a new exercise / rest period" in a way
// that survives clock jumps.
export function circuitSegmentKey(cfg, elapsed) {
  const p = circuitPosition(cfg, elapsed);
  return `${p.roundIdx}:${p.isRest ? "rest" + p.groupIdx : "ex" + p.exIdx}`;
}
