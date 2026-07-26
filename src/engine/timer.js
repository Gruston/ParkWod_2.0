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
