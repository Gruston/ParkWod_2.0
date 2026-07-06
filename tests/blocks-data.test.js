// Tests for the STORED workout block structure (src/data/blocks.js) — the
// declared source of truth that timers and voice read at runtime.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WORKOUT_BLOCKS } from "../src/data/blocks.js";
import { RAW_DATA } from "../src/data/workouts.js";
import { parseBlocks } from "../src/engine/blocks.js";

// Workouts whose stored blocks were hand-corrected (declared overrides in
// tools/generate-blocks.mjs) — exempt from parser equivalence.
const OVERRIDDEN = new Set([35, 71, 80, 97]);

test("every workout has stored blocks", () => {
  for (const w of RAW_DATA) {
    const e = WORKOUT_BLOCKS[w.id];
    assert.ok(e && Array.isArray(e.workout) && e.workout.length >= 1, `#${w.id} missing stored workout blocks`);
    if (w.core && w.core.trim()) assert.ok(Array.isArray(e.core) && e.core.length >= 1, `#${w.id} has core text but no stored core blocks`);
  }
});

test("structural sanity: timed blocks carry the parameters their timers need", () => {
  for (const w of RAW_DATA) {
    for (const b of [...WORKOUT_BLOCKS[w.id].workout, ...(WORKOUT_BLOCKS[w.id].core || [])]) {
      const t = b.timer;
      assert.ok(t && t.type, `#${w.id} block missing timer.type`);
      if (t.type === "countdown") assert.ok(t.totalSeconds > 0, `#${w.id} countdown without duration`);
      if (t.type === "emom") assert.ok(t.totalMinutes > 0, `#${w.id} emom without minutes`);
      if (t.type === "tabata") assert.ok(t.workSeconds > 0 && t.restSeconds >= 0, `#${w.id} tabata without work/rest`);
      if (["emom", "tabata", "circuit", "fgb"].includes(t.type) && t.exercises !== null && t.exercises !== undefined)
        assert.ok(Array.isArray(t.exercises) && t.exercises.length > 0, `#${w.id} ${t.type} with empty exercise array`);
    }
  }
});

test("no timed-format block is left without an exercise list", () => {
  // The June 2026 review fixed all of these; this pins that they stay fixed.
  for (const w of RAW_DATA) {
    for (const b of WORKOUT_BLOCKS[w.id].workout) {
      const t = b.timer;
      if (["emom", "tabata"].includes(t.type)) {
        assert.ok(Array.isArray(t.exercises) && t.exercises.length > 0,
          `#${w.id} ${t.type} block has no exercises (voice can't announce)`);
      }
    }
  }
});

test("parser equivalence: non-overridden stored blocks match a fresh parse", () => {
  // Guards against editing workout text without regenerating blocks.
  for (const w of RAW_DATA) {
    if (OVERRIDDEN.has(w.id)) continue;
    assert.deepEqual(WORKOUT_BLOCKS[w.id].workout, parseBlocks(w.workout), `#${w.id} stored workout blocks drifted from text`);
    if (w.core && w.core.trim()) assert.deepEqual(WORKOUT_BLOCKS[w.id].core, parseBlocks(w.core), `#${w.id} stored core blocks drifted`);
  }
});

// ── pinned interpretations for known workouts ──

test("#44: stored tabata 40/20", () => {
  const t = WORKOUT_BLOCKS[44].workout[0].timer;
  assert.equal(t.type, "tabata");
  assert.equal(t.workSeconds, 40);
  assert.equal(t.restSeconds, 20);
});

test("#93: stored dual 15-min EMOMs with 5 exercises each", () => {
  const blocks = WORKOUT_BLOCKS[93].workout;
  assert.equal(blocks.length, 2);
  for (const b of blocks) {
    assert.equal(b.timer.type, "emom");
    assert.equal(b.timer.totalMinutes, 15);
    assert.equal(b.timer.exercises.length, 5);
  }
});

test("#35 override: 12-min EMOM with 4 exercises + 20-min AMRAP", () => {
  const [emom, amrap] = WORKOUT_BLOCKS[35].workout.map(b => b.timer);
  assert.equal(emom.type, "emom");
  assert.equal(emom.totalMinutes, 12);
  assert.equal(emom.exercises.length, 4);
  assert.equal(amrap.type, "countdown");
  assert.equal(amrap.totalSeconds, 1200);
});

test("#80 override: tabata has 5 stations matching its 5 listed exercises", () => {
  const tab = WORKOUT_BLOCKS[80].workout[1].timer;
  assert.equal(tab.stations, 5);
  assert.equal(tab.exercises.length, 5);
});

test("#97 override: 5 rounds of 5 stations = 25-minute EMOM", () => {
  const t = WORKOUT_BLOCKS[97].workout[0].timer;
  assert.equal(t.totalMinutes, 25);
  assert.equal(t.exercises.length, 5);
});

test("format labels corrected: no TABATA-labelled workout lacks a tabata block", () => {
  for (const w of RAW_DATA.filter(x => (x.format || "").toUpperCase() === "TABATA")) {
    const kinds = WORKOUT_BLOCKS[w.id].workout.map(b => b.timer.type);
    assert.ok(kinds.includes("tabata"), `#${w.id} labelled TABATA but blocks are ${kinds.join(",")}`);
  }
});
