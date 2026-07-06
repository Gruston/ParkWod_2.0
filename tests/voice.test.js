// Regression tests for voice notation normalisation.
// These pin the fixes from June 2026: "40s", compound words, "*", "Nm", arrows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseNotation, expandAbbreviations, speakDuration } from "../src/engine/voice.js";

const cases = [
  // seconds notation
  ["40s Plank", "40 seconds Plank"],
  ["3s squat hold", "3 seconds squat hold"],
  ["30s work 20s rest", "30 seconds work 20 seconds rest"],
  // compound exercise words
  ["15 Situps", "15 Sit ups"],
  ["10 Pushups", "10 Push ups"],
  ["12 stepups", "12 step ups"],
  // multiplier asterisk
  ["10 Crunch *3", "10 Crunch times 3"],
  ["6 * 400M w 30s Deadhang", "6 times 400 metres w 30 seconds Deadhang"],
  // metres vs minutes context rule
  ["Run 400m", "Run 400 metres"],
  ["30m AMRAP", "30 minutes AMRAP"],
  ["1m rest", "1 minute rest"],
  ["2m Plank, 30 situps, 1m plank", "2 minutes Plank, 30 sit ups, 1 minute plank"],
  ["15M High Knee", "15 metres High Knee"],
  // arrows
  ["Downdog -> Bear -> Pushup", "Downdog then Bear then Push up"],
];

for (const [input, expected] of cases) {
  test(`normaliseNotation: "${input}"`, () => {
    assert.equal(normaliseNotation(input), expected);
  });
}

test("expandAbbreviations: KB/DB/EMOTM", () => {
  assert.equal(expandAbbreviations("10 KB Swings"), "10 kettlebell Swings");
  assert.equal(expandAbbreviations("12 DB Lunge"), "12 dumbbell Lunge");
  assert.match(expandAbbreviations("EMOTM 10 squats"), /e-mom/);
});

test("expandAbbreviations: strips leading rep multiplier", () => {
  assert.equal(expandAbbreviations("3 x Burpees"), "Burpees");
});

test("speakDuration: natural phrasing", () => {
  assert.equal(speakDuration(600), "10 minutes");
  assert.equal(speakDuration(60), "1 minute");
  assert.equal(speakDuration(750), "12 and a half minutes");
  assert.equal(speakDuration(45), "45 seconds");
  assert.equal(speakDuration(200), "3 minutes 20 seconds");
});
