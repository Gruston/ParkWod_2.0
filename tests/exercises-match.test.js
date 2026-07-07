// Tests for the shared exercise matcher + variation parser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveExerciseKey, describePhrase, findExercisesInText } from "../src/engine/exercises-match.js";

test("base movements resolve to their key", () => {
  assert.equal(resolveExerciseKey("20 squats"), "squats");
  assert.equal(resolveExerciseKey("versa runner"), "versa runner");
  assert.equal(resolveExerciseKey("renegade rows"), "renegade rows");
});

test("wrong mappings fixed: plank pull through is its own entry, not plank", () => {
  assert.equal(resolveExerciseKey("plank pull through"), "plank pull through");
  assert.notEqual(resolveExerciseKey("plank pull through"), "planks");
});

test("'X w Y' parses as a variation of the base with the modifier named", () => {
  const cases = [
    ["sumo squat w bounce", "sumo squats", "bounce"],
    ["db lunge w twist", "lunges", "twist"],
    ["squat w knee to elbow", "squats", "knee to elbow"],
    ["pushup w arm raise", "push-ups", "arm raise"],
    ["plank w alternating leg lift", "planks", "alternating leg lift"],
  ];
  for (const [phrase, base, mod] of cases) {
    const d = describePhrase(phrase);
    assert.equal(d.kind, "variation", `${phrase} should be a variation`);
    assert.equal(d.primaryKey, base, `${phrase} base`);
    assert.equal(d.modifier, mod, `${phrase} modifier`);
  }
});

test("'X to Y' movement pairs parse as a compound of two bases", () => {
  const d = describePhrase("6 mountain climber to thruster");
  assert.equal(d.kind, "compound");
  assert.equal(d.primaryKey, "mountain climbers");
  assert.equal(d.secondKey, "thrusters");
});

test("named compounds with a dedicated entry stay whole, not split", () => {
  for (const phrase of ["burpee to deadlift", "plank to down dog"]) {
    const d = describePhrase(phrase);
    assert.equal(d.kind, "base", `${phrase} should be one movement`);
    assert.equal(d.primaryKey, phrase);
  }
});

test("'X to failure' is intensity, not a compound", () => {
  const d = describePhrase("pushups to failure");
  assert.equal(d.kind, "base");
  assert.equal(d.primaryKey, "push-ups");
});

test("findExercisesInText returns the real movements, in order", () => {
  const found = findExercisesInText("30s Boxing, 30s Versa runner, 30s Squats w knee lift, 30s rest");
  assert.deepEqual(found, ["boxing", "versa runner", "squats"]);
  assert.ok(!found.includes("running"), "versa runner must not be tagged as running");
});
