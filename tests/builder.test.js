// Tests for the workout builder compile engine — declared structure in,
// runtime-ready workout object out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileWorkout, validateDraft, deriveMovements, newDraft, newBlock, draftFromWorkout, quickTimerWorkout } from "../src/engine/builder.js";
import { WORKOUT_BLOCKS } from "../src/data/blocks.js";
import { RAW_DATA } from "../src/data/workouts.js";

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

test("Rest block: countdown timer, no exercises required", () => {
  const draft = draftWith([
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] },
    { ...newBlock("rest"), restSeconds: 120 },
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(10, "Squats")] },
  ]);
  assert.equal(validateDraft(draft).length, 0); // rest needs no exercises
  const w = compileWorkout(draft, "c1");
  const restTimer = w.blocks.workout[1].timer;
  assert.equal(restTimer.type, "countdown");
  assert.equal(restTimer.totalSeconds, 120);
  assert.equal(restTimer.label, "Rest 2 min");
  assert.match(w.workout, /Rest 2 min/);
});

test("Rest blocks don't affect format: AMRAP + rest + AMRAP is still AMRAP", () => {
  const w = compileWorkout(draftWith([
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] },
    { ...newBlock("rest"), restSeconds: 60 },
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(10, "Squats")] },
  ]), "c1");
  assert.equal(w.format, "AMRAP");
  const mixed = compileWorkout(draftWith([
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] },
    { ...newBlock("rounds"), rounds: 3, exercises: [ex(10, "Squats")] },
  ]), "c1");
  assert.equal(mixed.format, "MIXED");
});

test("Rest block validation: needs a duration", () => {
  const bad = draftWith([{ ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] }, { ...newBlock("rest"), restSeconds: "" }]);
  assert.ok(validateDraft(bad).some(p => /rest seconds/i.test(p)));
});

// ── Duplicate & edit: draftFromWorkout ──
const libWorkout = (id) => RAW_DATA.find(w => w.id === id);
const dupDraft = (id) => draftFromWorkout(libWorkout(id), WORKOUT_BLOCKS[id].workout, WORKOUT_BLOCKS[id].core || []);

test("duplicate #93: two 15-min EMOM blocks import complete", () => {
  const d = dupDraft(93);
  assert.equal(d.name, "WOD #93 (copy)");
  assert.equal(d.blocks.length, 2);
  for (const b of d.blocks) {
    assert.equal(b.kind, "emom");
    assert.equal(Number(b.minutes), 15);
    assert.equal(b.exercises.length, 5);
    assert.ok(b.exercises.every(e => e.name));
  }
  assert.equal(d.warmup, libWorkout(93).warmup);
  // fill nothing — an imported structured workout should validate as-is
  assert.deepEqual(validateDraft(d), []);
});

test("duplicate #44: tabata imports work/rest/rounds and stations", () => {
  const d = dupDraft(44);
  const t = d.blocks[0];
  assert.equal(t.kind, "tabata");
  assert.equal(Number(t.workSeconds), 40);
  assert.equal(Number(t.restSeconds), 20);
  assert.equal(t.exercises.length, 10);
});

test("duplicate #1: AMRAP imports minutes and comma-list exercises", () => {
  const d = dupDraft(1);
  const a = d.blocks.find(b => b.kind === "amrap");
  assert.ok(a, "expected an amrap block");
  assert.equal(Number(a.minutes), 25);
  assert.ok(a.exercises.length >= 3);
  assert.ok(a.exercises.some(e => /KB swings/i.test(e.name) && e.reps === "20"));
});

test("duplicate prose rounds workout: refText attached, rounds guessed", () => {
  const d = dupDraft(60); // "6 rounds - 400M - 5 V-Ups..." stopwatch block
  const r = d.blocks[0];
  assert.equal(r.kind, "rounds");
  assert.equal(r.rounds, "6");
  assert.ok(r.refText && r.refText.includes("6 rounds"));
});

test("duplicate a custom workout: exact draft copy with (copy) suffix", () => {
  const draft = { ...newDraft(), name: "My EMOM", blocks: [{ ...newBlock("emom"), minutes: 10, exercises: [ex(10, "KB Swings")] }] };
  const w = compileWorkout(draft, "c1");
  const d = draftFromWorkout(w, null, null);
  assert.equal(d.name, "My EMOM (copy)");
  assert.deepEqual(d.blocks, draft.blocks);
});

test("duplicated rest blocks import as rest, not amrap", () => {
  const draft = { ...newDraft(), name: "x", blocks: [
    { ...newBlock("amrap"), minutes: 10, exercises: [ex(5, "Burpees")] },
    { ...newBlock("rest"), restSeconds: 90 },
  ] };
  const w = compileWorkout(draft, "c1");
  // simulate a duplicate of a NON-custom workout with these declared blocks
  const d = draftFromWorkout({ ...w, custom: false, draft: undefined }, w.blocks.workout, []);
  assert.equal(d.blocks[1].kind, "rest");
  assert.equal(Number(d.blocks[1].restSeconds), 90);
});

// ── Quick Timer synthetic workouts ──

test("quick timer: countdown/emom/tabata/stopwatch produce runtime-ready timers", () => {
  const cd = quickTimerWorkout({ kind: "amrap", minutes: 20 });
  assert.equal(cd.id, "timer");
  assert.equal(cd.synthetic, true);
  assert.equal(cd.blocks.workout[0].timer.type, "countdown");
  assert.equal(cd.blocks.workout[0].timer.totalSeconds, 1200);

  const em = quickTimerWorkout({ kind: "emom", minutes: 12 });
  assert.equal(em.blocks.workout[0].timer.totalMinutes, 12);
  assert.equal(em.format, "EMOM");

  const tb = quickTimerWorkout({ kind: "tabata", workSeconds: 20, restSeconds: 10, rounds: 8 });
  assert.equal(tb.blocks.workout[0].timer.stations, 1); // single-station: no zero-division
  assert.equal(tb.blocks.workout[0].timer.rounds, 8);

  const sw = quickTimerWorkout({ kind: "stopwatch", capMinutes: 15 });
  assert.equal(sw.blocks.workout[0].timer.capSeconds, 900);
  const open = quickTimerWorkout({ kind: "stopwatch", capMinutes: 0 });
  assert.equal(open.blocks.workout[0].timer.capSeconds, null);
});

test("quick timer circuit: generic stations and correct total", () => {
  const c = quickTimerWorkout({ kind: "circuit", exerciseSeconds: 30, stations: 4, restSeconds: 60, rounds: 3 });
  const t = c.blocks.workout[0].timer;
  assert.equal(t.exercises.length, 4);
  assert.equal(t.exercises[0], "Exercise 1");
  assert.equal(t.totalSeconds, 3 * (4 * 30 + 60));
});

test("duration estimate is sane and card-friendly", () => {
  const w = compileWorkout(draftWith([{ ...newBlock("amrap"), minutes: 20, exercises: [ex(5, "Burpees")] }], { warmup: "2 laps" }), "c1");
  assert.ok(w.duration >= 20 && w.duration <= 35);
  assert.equal(w.duration % 5, 0);
});
