// Tests for the timestamp-based timer core — including the clock-jump
// scenarios that motivated Phase 1 (mobile browsers suspending intervals).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTimerState, timerStart, timerPause, timerIsRunning,
  computeElapsed, crossedBoundary, circuitPosition, circuitSegmentKey,
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
