// Tests for the STORED workout block structure (src/data/blocks.js) — the
// declared source of truth that timers and voice read at runtime.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WORKOUT_BLOCKS, CORRECTED_SECTIONS } from "../src/data/blocks.js";
import { RAW_DATA } from "../src/data/workouts.js";
import { parseBlocks } from "../src/engine/blocks.js";

// Sections whose stored blocks are declared corrections (CORRECTIONS in
// tools/generate-blocks.mjs) — exempt from parser equivalence. The generator
// emits this, so a new correction can never silently break the test.
const isCorrected = (id, field) => (CORRECTED_SECTIONS[id] || []).includes(field);

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

test("parser equivalence: non-corrected stored blocks match a fresh parse", () => {
  // Guards against editing workout text without regenerating blocks.
  for (const w of RAW_DATA) {
    if (!isCorrected(w.id, "workout"))
      assert.deepEqual(WORKOUT_BLOCKS[w.id].workout, parseBlocks(w.workout), `#${w.id} stored workout blocks drifted from text`);
    if (w.core && w.core.trim() && !isCorrected(w.id, "core"))
      assert.deepEqual(WORKOUT_BLOCKS[w.id].core, parseBlocks(w.core), `#${w.id} stored core blocks drifted`);
  }
});

test("splitting a workout never loses or reorders its prose", () => {
  // A declared split slices the text into blocks. Concatenating the blocks back
  // together must reproduce the original lines exactly — a bad split index
  // would otherwise silently drop a line from the app.
  for (const w of RAW_DATA) {
    for (const [field, text] of [["workout", w.workout], ["core", w.core]]) {
      if (!text || !text.trim()) continue;
      const stored = WORKOUT_BLOCKS[w.id][field];
      if (!stored) continue;
      const rejoined = stored.map(b => b.content).join("\n");
      const original = text.split("\n").filter(l => l.trim()).join("\n");
      assert.equal(rejoined, original, `#${w.id} ${field} blocks do not reassemble to the original text`);
    }
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

// ── pinned splits (reported July 2026) ──
// These sessions each fuse two or three distinct parts into one block of
// prose. Each part must get its own phase so it gets its own clock.

test("#197: tempo work and the lap/swing rounds are separate phases", () => {
  const b = WORKOUT_BLOCKS[197].workout;
  assert.equal(b.length, 2);
  assert.match(b[0].content, /^Tempo work/);
  assert.match(b[1].content, /^4 rounds - 1 lap run/);
});

test("#197: core runs 6 min — side plank counted on both sides", () => {
  const t = WORKOUT_BLOCKS[197].core[0].timer;
  assert.equal(t.totalSeconds, 360);
  assert.equal(t.exercises.length, 4);
});

test("#20: the laps and the 4-round circuit are separate phases", () => {
  const b = WORKOUT_BLOCKS[20].workout;
  assert.equal(b.length, 2);
  assert.match(b[0].content, /^4 Laps/);
  assert.match(b[1].content, /^4 Rounds of the following circuit/);
});

test("#36: run ladder, timed pair circuit, and DB rounds are three phases", () => {
  const b = WORKOUT_BLOCKS[36].workout;
  assert.equal(b.length, 3);
  assert.match(b[0].content, /^400M, 20SQ/);
  assert.match(b[2].content, /^5 Rounds/);

  const t = b[1].timer;
  assert.equal(t.type, "circuit");
  assert.equal(t.exerciseSeconds, 30);
  assert.equal(t.restSeconds, 30);
  assert.equal(t.restEvery, 2, "30s rest lands after each pair, not after all twelve");
  assert.equal(t.exercises.length, 12);
  assert.equal(t.totalSeconds, 12 * 30 + 6 * 30, "9 min");
});

test("no stored timer claims an implausible duration", () => {
  // "400M run" once parsed as 400 minutes, giving circuits of 40+ hours.
  for (const w of RAW_DATA) {
    for (const b of [...WORKOUT_BLOCKS[w.id].workout, ...(WORKOUT_BLOCKS[w.id].core || [])]) {
      if (b.timer.totalSeconds)
        assert.ok(b.timer.totalSeconds <= 3600, `#${w.id} timer runs ${Math.round(b.timer.totalSeconds / 60)} min`);
    }
  }
});
