// Tests for the timestamp-based timer core — including the clock-jump
// scenarios that motivated Phase 1 (mobile browsers suspending intervals).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTimerState, timerStart, timerPause, timerIsRunning,
  computeElapsed, crossedBoundary,
} from "../src/engine/timer.js";

const T0 = 1_000_000_000_000; // arbitrary wall-clock origin

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
