// Regression tests for the block parser / timer detection, pinned against
// REAL workouts from the library so data and engine can't drift apart.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBlocks, detectBlockTimer } from "../src/engine/blocks.js";
import { RAW_DATA } from "../src/data/workouts.js";

const byId = id => RAW_DATA.find(w => w.id === id);

test("workout data integrity: 208 workouts, unique ids", () => {
  assert.equal(RAW_DATA.length, 208);
  assert.equal(new Set(RAW_DATA.map(w => w.id)).size, 208);
});

test("#44: tabata-style 40s/20s work-rest interval detected", () => {
  const blocks = parseBlocks(byId(44).workout);
  const timer = blocks[0].timer;
  assert.equal(timer.type, "tabata");
  assert.equal(timer.workSeconds, 40);
  assert.equal(timer.restSeconds, 20);
});

test("#44: warmup field populated (not buried in workout)", () => {
  assert.match(byId(44).warmup, /2 Laps/);
  assert.doesNotMatch(byId(44).workout, /2 Laps - 10 Squat/);
});

test("#93: EMOM workout splits into two EMOM blocks", () => {
  const blocks = parseBlocks(byId(93).workout);
  assert.equal(blocks.length, 2);
  for (const b of blocks) assert.equal(b.timer.type, "emom");
  assert.equal(blocks[0].timer.totalMinutes, 15);
});

test("#17: buried core moved to core field", () => {
  assert.match(byId(17).core, /Plank Jacks/);
  assert.doesNotMatch(byId(17).workout, /Core:/);
});

test("AMRAP workout gets countdown timer with correct minutes", () => {
  const w = RAW_DATA.find(x => x.format === "AMRAP" && /^\s*\d+\s*Min AMRAP/im.test(x.workout));
  const blocks = parseBlocks(w.workout);
  const amrapBlock = blocks.find(b => b.timer.type === "countdown");
  assert.ok(amrapBlock, "expected a countdown block for AMRAP");
  assert.ok(amrapBlock.timer.totalSeconds > 0);
});

test("Death By EMOM detected", () => {
  const w = RAW_DATA.find(x => x.format === "DEATH BY EMOM");
  const blocks = parseBlocks(w.workout);
  assert.ok(blocks.some(b => b.timer.type === "deathby" || b.timer.type === "emom"),
    `expected deathby/emom, got: ${blocks.map(b => b.timer.type).join(",")}`);
});

test("every workout parses without throwing and yields at least one block", () => {
  for (const w of RAW_DATA) {
    const blocks = parseBlocks(w.workout);
    assert.ok(blocks.length >= 1, `#${w.id} produced no blocks`);
    for (const b of blocks) assert.ok(b.timer && b.timer.type, `#${w.id} block missing timer`);
  }
});

// ── metres vs minutes ──
// "400M run" is a distance. Read as 400 MINUTES it produced circuits running
// for forty hours across ~20 workouts.

test("a bare 'm' after a large number is metres, not minutes", () => {
  const t = detectBlockTimer("6 * 400M w 30s Deadhang");
  assert.equal(t.type, "stopwatch", "a 400m interval run is not a timed circuit");
});

test("rounds of reps ending in a run stay a stopwatch", () => {
  const t = detectBlockTimer("6 rounds - 30s rest\n10 KB Swings, 3 KB Turkish Get-Up ea side, 400M run");
  assert.equal(t.type, "stopwatch");
});

test("a bare 'm' after a small number is still minutes", () => {
  const t = detectBlockTimer("3 rounds - 1m plank, 30s rest");
  assert.equal(t.type, "circuit");
  assert.equal(t.exerciseSeconds, 60);
});

// ── "ea side" is two timed efforts ──

test("#197 core: side plank each side gets a period per side", () => {
  const t = parseBlocks(byId(197).core)[0].timer;
  assert.equal(t.type, "circuit");
  assert.deepEqual(t.exercises, ["Plank", "Side Plank (L)", "Side Plank (R)", "Hollow Hold"]);
  assert.equal(t.totalSeconds, 3 * 4 * 30, "3 rounds x 4 x 30s = 6 min, not 4.5");
});

test("rep-based 'ea side' items are not split (only timed ones are)", () => {
  const t = detectBlockTimer("3 rounds - 30s Plank, 12 KB Rows ea arm");
  assert.deepEqual(t.exercises, ["Plank"]);
});

// ── "40s/20s" with unit letters ──

test("interval written with unit letters is still a tabata", () => {
  const t = detectBlockTimer("3 Rounds (40s/20s) - Thrusters, Skull Crushers, DB Rows");
  assert.equal(t.type, "tabata");
  assert.equal(t.workSeconds, 40);
  assert.equal(t.restSeconds, 20);
});
