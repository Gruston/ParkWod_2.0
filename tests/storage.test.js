// Tests for the versioned storage layer — migration safety is the core of
// the Phase 3 data preservation guarantee.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA_VERSION, LEGACY_KEYS, v1Key,
  loadData, saveData, removeData, migrateIfNeeded, buildBackup,
} from "../src/engine/storage.js";

// Minimal in-memory localStorage stand-in
function fakeStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

test("save wraps with schema version; load unwraps", () => {
  const s = fakeStore();
  assert.equal(saveData("logs", [{ id: 1 }], s), true);
  assert.deepEqual(JSON.parse(s.getItem(v1Key("logs"))), { v: SCHEMA_VERSION, data: [{ id: 1 }] });
  assert.deepEqual(loadData("logs", [], s), [{ id: 1 }]);
});

test("load falls back to legacy key when v1 missing (pre-migration read)", () => {
  const s = fakeStore({ [LEGACY_KEYS.logs]: JSON.stringify([{ id: 7 }]) });
  assert.deepEqual(loadData("logs", [], s), [{ id: 7 }]);
});

test("load prefers v1 over legacy once both exist", () => {
  const s = fakeStore({ [LEGACY_KEYS.logs]: JSON.stringify([{ id: 7 }]) });
  saveData("logs", [{ id: 8 }], s);
  assert.deepEqual(loadData("logs", [], s), [{ id: 8 }]);
});

test("load returns fallback for missing or corrupt data", () => {
  const s = fakeStore({ [v1Key("settings")]: "{corrupt json" });
  assert.deepEqual(loadData("settings", { a: 1 }, s), { a: 1 });
  assert.deepEqual(loadData("favourites", [], s), []);
});

test("MIGRATION: copies legacy to v1, leaves originals untouched", () => {
  const legacyLogs = JSON.stringify([{ id: 1, result: "10 rounds" }]);
  const legacySettings = JSON.stringify({ fontSize: "large" });
  const s = fakeStore({
    [LEGACY_KEYS.logs]: legacyLogs,
    [LEGACY_KEYS.settings]: legacySettings,
  });
  const migrated = migrateIfNeeded(s);
  assert.deepEqual(migrated.sort(), ["logs", "settings"]);
  // v1 copies exist and carry the same data
  assert.deepEqual(loadData("logs", [], s), [{ id: 1, result: "10 rounds" }]);
  assert.deepEqual(loadData("settings", {}, s), { fontSize: "large" });
  // legacy originals are byte-identical — rollback safe
  assert.equal(s.getItem(LEGACY_KEYS.logs), legacyLogs);
  assert.equal(s.getItem(LEGACY_KEYS.settings), legacySettings);
});

test("MIGRATION: idempotent — second run migrates nothing", () => {
  const s = fakeStore({ [LEGACY_KEYS.logs]: JSON.stringify([1, 2]) });
  assert.equal(migrateIfNeeded(s).length, 1);
  assert.equal(migrateIfNeeded(s).length, 0);
});

test("MIGRATION: v1 data is never overwritten by a re-run", () => {
  const s = fakeStore({ [LEGACY_KEYS.logs]: JSON.stringify([1]) });
  migrateIfNeeded(s);
  saveData("logs", [1, 2, 3], s); // user logged more workouts post-migration
  migrateIfNeeded(s);             // e.g. app restarted
  assert.deepEqual(loadData("logs", [], s), [1, 2, 3]);
});

test("MIGRATION: corrupt legacy value is skipped, others still migrate", () => {
  const s = fakeStore({
    [LEGACY_KEYS.logs]: "{not json",
    [LEGACY_KEYS.favourites]: JSON.stringify([3, 5]),
  });
  const migrated = migrateIfNeeded(s);
  assert.deepEqual(migrated, ["favourites"]);
  assert.equal(s.getItem(LEGACY_KEYS.logs), "{not json"); // untouched for manual recovery
});

test("saveData returns false when storage throws (quota)", () => {
  const s = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => {} };
  assert.equal(saveData("logs", [1], s), false);
});

test("buildBackup snapshots all five stores", () => {
  const s = fakeStore();
  saveData("logs", [{ id: 1 }], s);
  saveData("favourites", [4], s);
  const b = buildBackup("3.0.0-test", s);
  assert.equal(b.version, "3.0.0-test");
  assert.equal(b.schemaVersion, SCHEMA_VERSION);
  assert.deepEqual(b.logs, [{ id: 1 }]);
  assert.deepEqual(b.favourites, [4]);
  assert.deepEqual(b.customizations, {});
});

test("removeData clears only the v1 key", () => {
  const s = fakeStore({ [LEGACY_KEYS.logs]: "[1]" });
  saveData("logs", [2], s);
  removeData("logs", s);
  assert.equal(s.getItem(v1Key("logs")), null);
  assert.equal(s.getItem(LEGACY_KEYS.logs), "[1]");
});
