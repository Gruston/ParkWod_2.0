// Tests for local calendar dates.
//
// Reported September 2026: sessions done in the morning were filed against the
// previous day, sessions done later the same day were filed correctly. The
// cause was storing new Date().toISOString().slice(0,10) — the UTC date — from
// a UTC+10/+11 device, so anything before 10am local had already "happened"
// the day before as far as the log was concerned.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toLocalDate, localDateKey, localDateKeyOffset, daysBetweenLocal,
} from "../src/engine/dates.js";

test("a bare calendar day parses at LOCAL midnight, not UTC midnight", () => {
  const d = toLocalDate("2026-09-15");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 8); // September
  assert.equal(d.getDate(), 15);
  assert.equal(d.getHours(), 0);
  // The platform default would give UTC midnight, which is a different instant
  // anywhere but UTC — that difference is the whole bug.
  if (d.getTimezoneOffset() !== 0) {
    assert.notEqual(d.getTime(), new Date("2026-09-15").getTime());
  }
});

test("REGRESSION: an early-morning instant keys to TODAY, not yesterday", () => {
  // 7:30am local on 15 Sep. In AEST this is 21:30 UTC on 14 Sep, and the old
  // toISOString().slice(0,10) returned "2026-09-14" for exactly this moment.
  const morning = new Date(2026, 8, 15, 7, 30, 0);
  assert.equal(localDateKey(morning), "2026-09-15");
});

test("late evening keys to the same local day", () => {
  assert.equal(localDateKey(new Date(2026, 8, 15, 23, 45, 0)), "2026-09-15");
});

test("every hour of a local day keys to that same day", () => {
  for (let h = 0; h < 24; h++) {
    assert.equal(localDateKey(new Date(2026, 8, 15, h, 30, 0)), "2026-09-15", `hour ${h}`);
  }
});

test("a stored date round-trips through the key unchanged", () => {
  for (const day of ["2026-01-01", "2026-02-28", "2026-09-15", "2026-12-31"]) {
    assert.equal(localDateKey(day), day);
  }
});

test("keys are zero-padded so they sort lexicographically", () => {
  assert.equal(localDateKey(new Date(2026, 0, 5)), "2026-01-05");
  const days = ["2026-10-01", "2026-02-03", "2026-02-10"].map(localDateKey).sort();
  assert.deepEqual(days, ["2026-02-03", "2026-02-10", "2026-10-01"]);
});

test("unparseable input gives an empty key, never 'NaN-NaN-NaN'", () => {
  assert.equal(localDateKey("not a date"), "");
  assert.equal(localDateKeyOffset("not a date", -1), "");
  assert.equal(daysBetweenLocal("not a date", new Date()), 0);
});

test("offset steps whole calendar days, including across month and year ends", () => {
  assert.equal(localDateKeyOffset("2026-09-15", -1), "2026-09-14");
  assert.equal(localDateKeyOffset("2026-09-01", -1), "2026-08-31");
  assert.equal(localDateKeyOffset("2026-01-01", -1), "2025-12-31");
  assert.equal(localDateKeyOffset("2026-12-31", 1), "2027-01-01");
  assert.equal(localDateKeyOffset("2028-03-01", -1), "2028-02-29"); // leap year
});

test("walking 400 days back never skips or repeats a day (DST-proof)", () => {
  // Stepping by a fixed 86 400 000 ms would land on the same local day twice
  // (or skip one) at each DST transition, silently breaking a streak.
  const seen = new Set();
  let key = "2027-01-01";
  for (let i = 0; i < 400; i++) {
    assert.ok(!seen.has(key), `repeated ${key} after ${i} steps`);
    seen.add(key);
    const next = localDateKeyOffset(key, -1);
    assert.equal(localDateKeyOffset(next, 1), key, `step back/forward disagreed at ${key}`);
    key = next;
  }
  assert.equal(seen.size, 400);
});

test("daysBetweenLocal counts date boundaries, not 24-hour blocks", () => {
  // Logged 9pm yesterday, read at 7am today: ten hours apart, but one day.
  const lastNight = new Date(2026, 8, 14, 21, 0, 0);
  const thisMorning = new Date(2026, 8, 15, 7, 0, 0);
  assert.equal(daysBetweenLocal(lastNight, thisMorning), 1);
  // Same day, twelve hours apart: still today.
  assert.equal(daysBetweenLocal(new Date(2026, 8, 15, 7, 0), new Date(2026, 8, 15, 19, 0)), 0);
  assert.equal(daysBetweenLocal("2026-09-01", "2026-09-15"), 14);
  assert.equal(daysBetweenLocal("2026-09-15", "2026-09-15"), 0);
});

test("a streak walk over real log dates finds the run ending today", () => {
  const today = localDateKey(new Date(2026, 8, 15, 6, 0)); // early morning
  const logs = [-0, -1, -2, -4].map(n => localDateKeyOffset(today, n));
  const days = new Set(logs);
  let streak = 0, key = today;
  while (days.has(key)) { streak++; key = localDateKeyOffset(key, -1); }
  assert.equal(streak, 3, "15th, 14th, 13th — the 11th is not consecutive");
});
