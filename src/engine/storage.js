// ═══════════════════════════════════════════════════════════════
// SAFE STORAGE — versioned, migration-aware, failure-visible
// ═══════════════════════════════════════════════════════════════
// Design (see UPGRADE_PLAN.md, data preservation guarantee):
//   - Live data lives under versioned keys: "parkwod:v1:<name>", wrapped
//     as { v: 1, data } so future schema changes can migrate explicitly.
//   - Migration COPIES legacy keys to v1 keys and leaves the originals
//     untouched — a frozen snapshot. Rolling back to an older build finds
//     its data exactly where it left it.
//   - Save failures (quota, private mode) are never silent: a
//     "parkwod:storage-error" window event fires so the UI can warn.

export const SCHEMA_VERSION = 1;

// name -> legacy key (pre-v1 storage locations)
export const LEGACY_KEYS = {
  logs: "parkwod-logs",
  diffOverrides: "parkwod-diff-overrides",
  customizations: "parkwod_customizations",
  settings: "parkwod:settings",
  favourites: "parkwod:favourites",
};

export const v1Key = (name) => `parkwod:v1:${name}`;

// storage is injectable for tests; defaults to window.localStorage
function store(injected) {
  return injected || (typeof localStorage !== "undefined" ? localStorage : null);
}

export function loadData(name, fallback, injectedStore) {
  const s = store(injectedStore);
  if (!s) return fallback;
  try {
    const raw = s.getItem(v1Key(name));
    if (raw !== null) {
      const wrapped = JSON.parse(raw);
      if (wrapped && typeof wrapped === "object" && "v" in wrapped) return wrapped.data;
      return wrapped; // defensive: unwrapped value under v1 key
    }
    // No v1 data — fall back to the legacy key (pre-migration reads)
    const legacyKey = LEGACY_KEYS[name];
    if (legacyKey) {
      const legacyRaw = s.getItem(legacyKey);
      if (legacyRaw !== null) return JSON.parse(legacyRaw);
    }
    return fallback;
  } catch (e) {
    return fallback;
  }
}

export function saveData(name, value, injectedStore) {
  const s = store(injectedStore);
  if (!s) return false;
  try {
    s.setItem(v1Key(name), JSON.stringify({ v: SCHEMA_VERSION, data: value }));
    return true;
  } catch (e) {
    // Quota exceeded / storage blocked — make it visible, never silent
    try {
      window.dispatchEvent(new CustomEvent("parkwod:storage-error", { detail: { name, error: String(e) } }));
    } catch {}
    return false;
  }
}

export function removeData(name, injectedStore) {
  const s = store(injectedStore);
  if (!s) return;
  try { s.removeItem(v1Key(name)); } catch {}
}

// Copy legacy keys to v1 keys (originals untouched). Idempotent: skips any
// name that already has v1 data. Returns the names migrated this run.
export function migrateIfNeeded(injectedStore) {
  const s = store(injectedStore);
  if (!s) return [];
  const migrated = [];
  for (const [name, legacyKey] of Object.entries(LEGACY_KEYS)) {
    try {
      if (s.getItem(v1Key(name)) !== null) continue;   // already migrated
      const legacyRaw = s.getItem(legacyKey);
      if (legacyRaw === null) continue;                 // nothing to migrate
      const value = JSON.parse(legacyRaw);
      s.setItem(v1Key(name), JSON.stringify({ v: SCHEMA_VERSION, data: value }));
      migrated.push(name);
    } catch (e) { /* unreadable legacy value — leave it for manual recovery */ }
  }
  return migrated;
}

// Snapshot of all live data for backup export
export function buildBackup(appVersion, injectedStore) {
  return {
    exportDate: new Date().toISOString(),
    version: appVersion,
    schemaVersion: SCHEMA_VERSION,
    logs: loadData("logs", [], injectedStore),
    diffOverrides: loadData("diffOverrides", {}, injectedStore),
    customizations: loadData("customizations", {}, injectedStore),
    settings: loadData("settings", {}, injectedStore),
    favourites: loadData("favourites", [], injectedStore),
  };
}
