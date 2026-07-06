// Tests for the workout builder compile engine — declared structure in,
// runtime-ready workout object out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileWorkout, validateDraft, deriveMovements, newDraft, newBlock } from "../src/engine/builder.js";

const draftWith = (blocks, extra = {}) => ({ ...newDraft(), name: "Test WOD", blocks, ...extra });
const ex = (reps, name) => ({ reps, name });

test("AMRAP block compiles to countdown timer with correct seconds", () => {
  const w = compileWorkout(draftWith([{ ...newBlock("amrap"), minutes: 20, exercises: [ex(10, "Push-ups"), ex(15, "Squats")] }]), "c1");
  const t = w.blocks.workout[0].timer;
  assert.equal(t.type, "countdown");
  assert.equal(t.totalSeconds, 1200);
  assert.equal(w.format, "AMRAP");
  assert.match(w.workout, /20 Min AMRAP: 10 Push-ups, 15 Squats/);
});

test("EMOM block: exercises list drives the per-minute timer", () => {
  const w = compileWorkout(draftWith([{ ...newBlock("emom"), minutes: 12, exercises: [ex(12, "KB Swings"), ex(10, "Burpees")] }]), "c1");
  const t = w.blocks.workout[0].timer;
  assert.equal(t.type, "emom");
  assert.equal(t.totalMinutes, 12);
  assert.deepEqual(t.exercises, ["12 KB Swings", "10 Burpees"]);
  assert.match(w.workout, /Min 1: 12 KB Swings/);
});

test("Tabata block: stations match exercise count", () => {
  const w = compileWorkout(draftWith([{ ...newBlock("tabata"), workSeconds: 40, restSeconds: 20, rounds: 3, exercises: [ex("", "Plank"), ex("", "Crunches"), ex("", "Flutter Kicks")] }]), "c1");
  const t = w.blocks.workout[0].timer;
  assert.equal(t.type, "tabata");
  assert.equal(t.stations, 3);
  assert.equal(t.workSeconds, 40);
  assert.equal(t.exercises.length, 3);
});

test("For Time with cap compiles capSeconds; without cap it is null", () => {
  const capped = compileWorkout(draftWith([{ ...newBlock("fortime"), capMinutes: 20, exercises: [ex(50, "Burpees")] }]), "c1");
  assert.equal(capped.blocks.workout[0].timer.capSeconds, 1200);
  const open = compileWorkout(draftWith([{ ...newBlock("fortime"), exercises: [ex(50, "Burpees")] }]), "c1");
  assert.equal(open.blocks.workout[0].timer.capSeconds, null);
});

test("Circuit: totalSeconds = rounds * (exercises*work + rest)", () => {
  const w = compileWorkout(draftWith([{ ...newBlock("circuit"), exerciseSeconds: 30, restSeconds: 60, rounds: 3, exercises: [ex("", "A"), ex("", "B"), ex("", "C"), ex("", "D")] }]), "c1");
  const t = w.blocks.workout[0].timer;
  assert.equal(t.totalSeconds, 3 * (4 * 30 + 60));
});

test("multi-block workout gets MIXED format; single keeps its own", () => {
  const multi = compileWorkout(draftWith([
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] },
    { ...newBlock("rounds"), rounds: 3, exercises: [ex(10, "Squats")] },
  ]), "c1");
  assert.equal(multi.format, "MIXED");
  assert.equal(multi.blocks.workout.length, 2);
});

test("core blocks compile into blocks.core and core text", () => {
  const w = compileWorkout(draftWith(
    [{ ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] }],
    { coreBlocks: [{ ...newBlock("tabata"), workSeconds: 30, restSeconds: 15, rounds: 2, exercises: [ex("", "Plank"), ex("", "V-Ups")] }] }
  ), "c1");
  assert.equal(w.blocks.core.length, 1);
  assert.equal(w.blocks.core[0].timer.type, "tabata");
  assert.match(w.core, /Tabata 30\/15/);
});

test("movements derived from encyclopedia matches (info modals + injury filter)", () => {
  const m = deriveMovements(["10 Push-ups", "15 Goblet Squats", "12 KB Swings", "made-up-move"]);
  assert.ok(m.includes("push-ups"));
  assert.ok(m.includes("squats"));
  assert.ok(m.includes("kb swings"));
});

test("validation: name, blocks, per-format fields, exercises, emom overflow", () => {
  assert.ok(validateDraft({ ...newDraft() }).some(p => /name/i.test(p)));
  assert.ok(validateDraft({ ...newDraft(), name: "x" }).some(p => /at least one workout block/i.test(p)));
  const noMins = draftWith([{ ...newBlock("amrap"), exercises: [ex(5, "Burpees")] }]);
  assert.ok(validateDraft(noMins).some(p => /minutes/i.test(p)));
  const noEx = draftWith([{ ...newBlock("amrap"), minutes: 10 }]);
  assert.ok(validateDraft(noEx).some(p => /exercise/i.test(p)));
  const overflow = draftWith([{ ...newBlock("emom"), minutes: 2, exercises: [ex(1, "A"), ex(1, "B"), ex(1, "C")] }]);
  assert.ok(validateDraft(overflow).some(p => /more exercises than minutes/i.test(p)));
  const good = draftWith([{ ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] }]);
  assert.equal(validateDraft(good).length, 0);
});

test("draft round-trip: stored draft recompiles identically", () => {
  const draft = draftWith([{ ...newBlock("emom"), minutes: 10, exercises: [ex(10, "KB Swings"), ex(8, "Burpees")] }]);
  const w1 = compileWorkout(draft, "c1");
  const w2 = compileWorkout(w1.draft, "c1");
  assert.deepEqual(w1, w2);
});

test("duration estimate is sane and card-friendly", () => {
  const w = compileWorkout(draftWith([{ ...newBlock("amrap"), minutes: 20, exercises: [ex(5, "Burpees")] }], { warmup: "2 laps" }), "c1");
  assert.ok(w.duration >= 20 && w.duration <= 35);
  assert.equal(w.duration % 5, 0);
});
