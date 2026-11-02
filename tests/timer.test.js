// Tests for the timestamp-based timer core — including the clock-jump
// scenarios that motivated Phase 1 (mobile browsers suspending intervals).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTimerState, timerStart, timerPause, timerIsRunning,
  computeElapsed, crossedBoundary, circuitPosition, circuitSegmentKey, timerDuration, tabataPosition, deathByTargets,
} from "../src/engine/timer.js";

const T0 = 1_000_000_000_000; // arbitrary wall-clock origin

// the fields a circuit display actually reads
const pick = p => ({ roundIdx: p.roundIdx, exIdx: p.exIdx, isRest: p.isRest, secsLeft: p.secsLeft });

test("fresh timer: not running, elapsed 0", () => {
  const s = createTimerState();
  assert.equal(timerIsRunning(s), false);
  assert.equal(computeElapsed(s, T0), 0);
});

test("start then read: elapsed tracks wall clock", () => {
  const s = timerStart(createTimerState(), T0);
  assert.equal(timerIsRunning(s), true);
  assert.equal(computeElapsed(s, T0 + 1000), 1);
  assert.equal(computeElapsed(s, T0 + 59_999), 59);
  assert.equal(computeElapsed(s, T0 + 60_000), 60);
});

test("CLOCK JUMP: interval suspended for 2 minutes — elapsed still correct", () => {
  // This is the core Phase 1 guarantee: no ticks fired for 120s, but the
  // next read gives the true elapsed time.
  const s = timerStart(createTimerState(), T0);
  assert.equal(computeElapsed(s, T0 + 5_000), 5);       // last tick before lock
  assert.equal(computeElapsed(s, T0 + 125_000), 125);   // first read after unlock
});

test("pause freezes elapsed regardless of wall clock", () => {
  let s = timerStart(createTimerState(), T0);
  s = timerPause(s, T0 + 10_000);
  assert.equal(timerIsRunning(s), false);
  assert.equal(computeElapsed(s, T0 + 10_000), 10);
  assert.equal(computeElapsed(s, T0 + 500_000), 10); // long pause: still 10
});

test("resume after pause excludes paused time", () => {
  let s = timerStart(createTimerState(), T0);
  s = timerPause(s, T0 + 10_000);        // ran 10s
  s = timerStart(s, T0 + 70_000);        // paused 60s
  assert.equal(timerIsRunning(s), true);
  assert.equal(computeElapsed(s, T0 + 75_000), 15); // 10 + 5, not 75
});

test("multiple pause/resume cycles accumulate correctly", () => {
  let s = timerStart(createTimerState(), T0);
  s = timerPause(s, T0 + 5_000);
  s = timerStart(s, T0 + 15_000);   // +10s paused
  s = timerPause(s, T0 + 20_000);   // ran 5 more (10 total)
  s = timerStart(s, T0 + 50_000);   // +30s paused
  assert.equal(computeElapsed(s, T0 + 60_000), 20); // 5 + 5 + 10
});

test("pause while phone locked, then read much later: still frozen", () => {
  let s = timerStart(createTimerState(), T0);
  s = timerPause(s, T0 + 30_000);
  // hours later
  assert.equal(computeElapsed(s, T0 + 7_200_000), 30);
});

test("start is idempotent while running; pause is idempotent while paused", () => {
  let s = timerStart(createTimerState(), T0);
  const again = timerStart(s, T0 + 5_000);
  assert.deepEqual(again, s);
  s = timerPause(s, T0 + 10_000);
  assert.deepEqual(timerPause(s, T0 + 20_000), s);
});

// ── crossedBoundary: the crossing-safe event trigger ──

test("crossedBoundary: normal 1s ticking fires exactly at boundaries", () => {
  // minute boundary (step 60, offset 60 excludes t=0)
  assert.equal(crossedBoundary(59, 60, 60, 60), true);
  assert.equal(crossedBoundary(60, 61, 60, 60), false);
  assert.equal(crossedBoundary(118, 119, 60, 60), false);
  assert.equal(crossedBoundary(119, 120, 60, 60), true);
});

test("crossedBoundary: fires once when a jump skips several boundaries", () => {
  // jumped from 50s to 190s — crossed 60, 120, 180 but should fire once
  assert.equal(crossedBoundary(50, 190, 60, 60), true);
  // and not fire again on the next normal tick
  assert.equal(crossedBoundary(190, 191, 60, 60), false);
});

test("crossedBoundary: offset boundaries (tabata rest at work-seconds mark)", () => {
  const cycleLen = 60, work = 40; // 40s work / 20s rest
  assert.equal(crossedBoundary(39, 40, cycleLen, work), true);   // rest starts
  assert.equal(crossedBoundary(40, 41, cycleLen, work), false);
  assert.equal(crossedBoundary(99, 100, cycleLen, work), true);  // next cycle's rest
  assert.equal(crossedBoundary(30, 45, cycleLen, work), true);   // jump over boundary
  assert.equal(crossedBoundary(41, 45, cycleLen, work), false);  // jump within rest
});

test("crossedBoundary: never fires before the first boundary or backwards", () => {
  assert.equal(crossedBoundary(0, 30, 60, 60), false);
  assert.equal(crossedBoundary(30, 30, 60, 60), false);
  assert.equal(crossedBoundary(60, 50, 60, 60), false); // non-monotonic guard
});

// ── circuitPosition ──
// A circuit runs equal-length timed exercises for N rounds, resting once per
// round — or, with restEvery, after every N exercises.

const CIRCUIT = { exerciseSeconds: 30, restSeconds: 30, rounds: 3, exercises: ["A", "B", "C"] };

test("circuitPosition: walks exercises then rests once per round", () => {
  const at = e => circuitPosition(CIRCUIT, e);
  assert.deepEqual(pick(at(0)), { roundIdx: 0, exIdx: 0, isRest: false, secsLeft: 30 });
  assert.deepEqual(pick(at(29)), { roundIdx: 0, exIdx: 0, isRest: false, secsLeft: 1 });
  assert.deepEqual(pick(at(30)), { roundIdx: 0, exIdx: 1, isRest: false, secsLeft: 30 });
  assert.deepEqual(pick(at(60)), { roundIdx: 0, exIdx: 2, isRest: false, secsLeft: 30 });
  // 90s of work, then the round's single rest
  assert.deepEqual(pick(at(90)), { roundIdx: 0, exIdx: 2, isRest: true, secsLeft: 30 });
  assert.deepEqual(pick(at(119)), { roundIdx: 0, exIdx: 2, isRest: true, secsLeft: 1 });
  // round 2 starts at 120s
  assert.deepEqual(pick(at(120)), { roundIdx: 1, exIdx: 0, isRest: false, secsLeft: 30 });
});

const PAIRS = { exerciseSeconds: 30, restSeconds: 30, restEvery: 2, rounds: 1,
                exercises: ["A", "B", "C", "D", "E", "F"] };

test("circuitPosition: restEvery rests after each pair, mid-round", () => {
  const at = e => circuitPosition(PAIRS, e);
  assert.deepEqual(pick(at(0)),  { roundIdx: 0, exIdx: 0, isRest: false, secsLeft: 30 });
  assert.deepEqual(pick(at(30)), { roundIdx: 0, exIdx: 1, isRest: false, secsLeft: 30 });
  // rest after the first pair, NOT after the whole list
  assert.deepEqual(pick(at(60)), { roundIdx: 0, exIdx: 1, isRest: true, secsLeft: 30 });
  assert.deepEqual(pick(at(90)), { roundIdx: 0, exIdx: 2, isRest: false, secsLeft: 30 });
  assert.deepEqual(pick(at(150)), { roundIdx: 0, exIdx: 3, isRest: true, secsLeft: 30 });
  assert.deepEqual(pick(at(180)), { roundIdx: 0, exIdx: 4, isRest: false, secsLeft: 30 });
  // 6 exercises + 3 rests = 270s; the round ends exactly there
  assert.deepEqual(pick(at(240)), { roundIdx: 0, exIdx: 5, isRest: true, secsLeft: 30 });
  assert.equal(circuitPosition(PAIRS, 270).roundIdx, 1);
});

test("circuitPosition: restEvery equal to the list length is the plain circuit", () => {
  const explicit = { ...CIRCUIT, restEvery: 3 };
  for (const e of [0, 29, 30, 60, 90, 119, 120, 200, 359]) {
    assert.deepEqual(circuitPosition(explicit, e), circuitPosition(CIRCUIT, e), `elapsed ${e}`);
  }
});

test("circuitPosition: handles a trailing odd exercise", () => {
  const odd = { exerciseSeconds: 30, restSeconds: 30, restEvery: 2, rounds: 1, exercises: ["A", "B", "C"] };
  assert.deepEqual(pick(circuitPosition(odd, 60)), { roundIdx: 0, exIdx: 1, isRest: true, secsLeft: 30 });
  assert.deepEqual(pick(circuitPosition(odd, 90)), { roundIdx: 0, exIdx: 2, isRest: false, secsLeft: 30 });
  // the short final group still gets its rest, then the round rolls over
  assert.deepEqual(pick(circuitPosition(odd, 120)), { roundIdx: 0, exIdx: 2, isRest: true, secsLeft: 30 });
  assert.equal(circuitPosition(odd, 150).roundIdx, 1);
});

test("circuitSegmentKey: changes exactly once per exercise and per rest", () => {
  const keys = [];
  for (let e = 0; e < 270; e++) keys.push(circuitSegmentKey(PAIRS, e));
  const transitions = keys.filter((k, i) => i === 0 || k !== keys[i - 1]);
  // 6 exercises + 3 rests in one round
  assert.equal(transitions.length, 9);
  assert.equal(new Set(transitions).size, 9);
});

// ── timerDuration ──
// Reported September 2026: "when the core workouts finish the rounds the timer
// continues". The position maths has no notion of an end — a finished circuit
// wraps straight into a phantom extra round — so the cue layer needs to be
// told where the programmed work stops.

test("timerDuration: bounded clocks report their programmed length", () => {
  assert.equal(timerDuration({ type: "countdown", totalSeconds: 1200 }), 1200);
  assert.equal(timerDuration({ type: "emom", totalSeconds: 960, totalMinutes: 16 }), 960);
  assert.equal(timerDuration({ type: "circuit", totalSeconds: 300 }), 300);
  // 8 stations x 2 rounds x (40 + 20) = 16 minutes, minus the rest nobody takes after the last work period
  assert.equal(timerDuration({ type: "tabata", workSeconds: 40, restSeconds: 20, rounds: 2, stations: 8 }), 940);
  assert.equal(timerDuration({ type: "fgb", stationSeconds: 60, stations: 5, restSeconds: 60, rounds: 3 }), 1020);
});

test("timerDuration: a circuit ends when its last work period does, not after a trailing rest", () => {
  // 3 rounds x (4 x 30s work + 60s rest) = 540 stored; the final 60s rest is not run
  assert.equal(timerDuration({ type: "circuit", exerciseSeconds: 30, restSeconds: 60, rounds: 3, exercises: ["a", "b", "c", "d"], totalSeconds: 540 }), 480);
  // "1 min plank *3 (30s rest)": 3 x (60 + 30) = 270 stored, 240 run
  assert.equal(timerDuration({ type: "circuit", exerciseSeconds: 60, restSeconds: 30, rounds: 3, exercises: ["plank"], totalSeconds: 270 }), 240);
  // no rest, nothing to trim
  assert.equal(timerDuration({ type: "circuit", exerciseSeconds: 30, restSeconds: 0, rounds: 2, exercises: ["a", "b"], totalSeconds: 120 }), 120);
});

test("deathByTargets: each move climbs from its own starting count", () => {
  const cfg = { type: "deathby", moves: [{ name: "KB Swings", start: 3, add: 1 }, { name: "Goblet Squats", start: 1, add: 1 }] };
  assert.deepEqual(deathByTargets(cfg, 1), [{ name: "KB Swings", reps: 3 }, { name: "Goblet Squats", reps: 1 }]);
  assert.deepEqual(deathByTargets(cfg, 6), [{ name: "KB Swings", reps: 8 }, { name: "Goblet Squats", reps: 6 }]);
  assert.equal(deathByTargets({ type: "deathby" }, 4), null, "no declared moves -> generic display");
});

// ── tabata ordering ──

test("tabataPosition: block order works every round of a station before moving on", () => {
  const cfg = { workSeconds: 40, restSeconds: 20, rounds: 4, stations: 2 };
  const at = (cycle) => tabataPosition(cfg, cycle * 60);
  assert.deepEqual([0, 1, 2, 3].map(c => at(c).stationIdx), [0, 0, 0, 0]);
  assert.deepEqual([0, 1, 2, 3].map(c => at(c).round), [1, 2, 3, 4]);
  assert.equal(at(4).stationIdx, 1);
  assert.equal(at(4).round, 1);
  assert.equal(at(3).nextStationIdx, 1);   // last round of station 0 -> next is station 1
  assert.equal(at(1).nextStationIdx, 0);   // mid-station: same station again
});

test("tabataPosition: rotate goes through every exercise, then back to the first", () => {
  // #206 shape: 8 exercises x 4 rounds, 40s on / 20s off
  const cfg = { workSeconds: 40, restSeconds: 20, rounds: 4, stations: 8, rotate: true };
  const at = (cycle) => tabataPosition(cfg, cycle * 60);
  assert.deepEqual([0, 1, 2, 7].map(c => at(c).stationIdx), [0, 1, 2, 7]);
  assert.equal(at(8).stationIdx, 0);        // back to exercise 1 ...
  assert.equal(at(8).round, 2);             // ... for round 2
  assert.equal(at(7).round, 1);
  assert.equal(at(31).stationIdx, 7);       // last cycle
  assert.equal(at(31).round, 4);
  assert.equal(at(7).nextStationIdx, 0);    // wraps into the next round
  assert.equal(at(31).nextStationIdx, null); // nothing after the final cycle
  // no exercise is ever worked twice in a row
  for (let c = 0; c < 31; c++) assert.notEqual(at(c).stationIdx, at(c + 1).stationIdx);
});

test("tabataPosition: work/rest phase and finish line", () => {
  const cfg = { type: "tabata", workSeconds: 40, restSeconds: 20, rounds: 2, stations: 3, rotate: true };
  assert.deepEqual(
    (({ isWork, secsLeft }) => ({ isWork, secsLeft }))(tabataPosition(cfg, 100)),
    { isWork: false, secsLeft: 20 },   // 40s into cycle 2 of 60s: resting, 20s to go
  );
  assert.equal(tabataPosition(cfg, 70).secsLeft, 30);  // 10s into work, 30s left
  // 3 stations x 2 rounds x 60s = 360, but the block is over when the last 40s of work ends
  assert.equal(tabataPosition(cfg, 339).done, false);
  assert.equal(tabataPosition(cfg, 340).done, true);
  assert.equal(timerDuration(cfg), 340);
});

test("timerDuration: open-ended clocks report null", () => {
  assert.equal(timerDuration({ type: "stopwatch", label: "Rounds" }), null);
  assert.equal(timerDuration({ type: "deathby" }), null);
  assert.equal(timerDuration(null), null);
  assert.equal(timerDuration(undefined), null);
});

test("timerDuration: a missing or zero length reads as open-ended, not as 0", () => {
  // A config with no duration must not be treated as "already finished",
  // which would silence every cue from the first tick.
  assert.equal(timerDuration({ type: "countdown" }), null);
  assert.equal(timerDuration({ type: "circuit", totalSeconds: 0 }), null);
});

test("REGRESSION: a finished circuit wraps into a phantom round the cues must not follow", () => {
  // #139's core: 5 exercises x 30s x 2 rounds = 300s. The position maths keeps
  // going past that, which is exactly why the duration has to gate the cues.
  const cfg = { type: "circuit", exerciseSeconds: 30, restSeconds: 0, rounds: 2,
    exercises: ["Plank", "Side Plank (L)", "Side Plank (R)", "Hollow Hold", "Flutter Kicks"],
    totalSeconds: 300 };
  assert.equal(timerDuration(cfg), 300);
  assert.equal(circuitPosition(cfg, 299).roundIdx, 1, "last second of the final round");
  assert.equal(circuitPosition(cfg, 300).roundIdx, 2, "position alone would start a round 3");
  assert.equal(circuitPosition(cfg, 300).exIdx, 0);
});
