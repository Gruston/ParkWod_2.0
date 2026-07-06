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
