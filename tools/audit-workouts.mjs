// Comprehensive audit for PARK WOD — scans ALL workouts across every dimension,
// not just notation. Run:  node tools/audit-workouts.mjs
//
// It self-extracts RAW_DATA, EXERCISE_INFO and VOICE_ABBREVIATIONS from index.html
// and mirrors the app's normaliseNotation() so it doubles as a voice regression check.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

// ── extract data structures ──
const data = JSON.parse(html.match(/RAW_DATA\s*=\s*(\[[\s\S]*?\]);/)[1]);

const exInfoBlock = html.slice(html.indexOf("EXERCISE_INFO"));
const exKeys = new Set();
const exNames = new Set();
for (const m of exInfoBlock.matchAll(/"([^"]+)":\s*\{\s*name:\s*"([^"]*)"(?:,\s*aka:\s*"([^"]*)")?/g)) {
  exKeys.add(m[1].toLowerCase());
  exNames.add(m[2].toLowerCase());
  if (m[3]) m[3].split(",").forEach(a => a.trim() && exNames.add(a.trim().toLowerCase()));
  if (exKeys.size > 0 && m.index > exInfoBlock.indexOf("function")) break;
}
const abbr = new Set();
for (const m of html.match(/VOICE_ABBREVIATIONS\s*=\s*\{([\s\S]*?)\};/)[1].matchAll(/"([^"]+)"\s*:/g)) abbr.add(m[1].toLowerCase());

// ── mirror of app normaliseNotation() ──
function normaliseNotation(text) {
  let s = text;
  s = s.replace(/\s*\*\s*/g, " times ");
  s = s.replace(/\s*(?:->|→)\s*/g, " then ");
  s = s.replace(/\b(sit|push|pull|chin|step|press)-?(ups?)\b/gi, "$1 $2");
  s = s.replace(/\b(\d+)\s*s\b/gi, (mt, n) => `${n} second${n === "1" ? "" : "s"}`);
  const minuteContext = /\b(AMRAP|EMOM|CLOCK|CAP)\b/i.test(s);
  s = s.replace(/\b(\d+)\s*m\b(\s+(?:rest|plank|hold|hang|wall\s*sit))?/gi, (mt, n, tail) =>
    `${n} ${(minuteContext || tail) ? "minute" : "metre"}${n === "1" ? "" : "s"}${tail || ""}`);
  return s;
}

const body = w => [w.warmup, w.workout, w.core].filter(Boolean).join("\n");
const findings = {}; // category -> [{id, detail}]
const add = (cat, id, detail) => (findings[cat] ??= []).push({ id, detail });

// known abbreviations the TTS mangles (uppercase / mixed shorthand) not in the dictionary
const KNOWN_OK = new Set(["L", "R", "I", "II", "III", "IV", "V", "AMRAP", "EMOM", "DB", "KB", "RDL", "TGU", "JJ"]);
// ordinary English words that appear in caps in the data — not abbreviations, read fine
const COMMON_WORDS = new Set(["THEN", "UP", "DOWN", "SLOW", "FAST", "AB", "ABS", "WITH", "AND", "OR", "EACH", "REST", "WORK", "ROUND", "ROUNDS", "MIN", "SEC", "REPS", "SETS"]);

for (const w of data) {
  const txt = body(w);
  const lines = txt.split("\n");

  // ── 1. VOICE: only flag notation that survives the app's normalisation ──
  const norm = normaliseNotation(txt);
  if (/\*/.test(norm)) add("voice:asterisk-unhandled", w.id, norm.split("\n").find(l => /\*/.test(l))?.trim());
  if (/->|→/.test(norm)) add("voice:arrow-unhandled", w.id, "");
  if (/[@]/.test(norm)) add("voice:at-symbol", w.id, norm.split("\n").find(l => /@/.test(l))?.trim());
  // uppercase shorthand tokens not covered by dictionary or exercise names
  const upTokens = new Set();
  for (const t of norm.match(/\b[A-Z][A-Z0-9]{1,5}\b/g) || []) {
    const low = t.toLowerCase();
    if (KNOWN_OK.has(t) || COMMON_WORDS.has(t) || abbr.has(low) || exKeys.has(low) || exNames.has(low)) continue;
    if (/^\d/.test(low)) continue;
    upTokens.add(t);
  }
  if (upTokens.size) add("voice:unknown-abbreviation", w.id, [...upTokens].join(", "));

  // ── 2. FORMAT vs text consistency ──
  const f = (w.format || "").toUpperCase();
  const t = txt.toUpperCase();
  if (f === "EMOM" && !/EMOM|EVERY MIN|MIN \d|MINUTE/.test(t)) add("format:emom-no-emom-text", w.id, w.format);
  if (f === "AMRAP" && !/AMRAP/.test(t)) add("format:amrap-no-amrap-text", w.id, w.format);
  if (f === "TABATA" && !/TABATA|\d+\s*[/\\]\s*\d+|SEC?\s*ON/.test(t)) add("format:tabata-no-workrest", w.id, w.format);
  if (f === "DEATH BY EMOM" && !/DEATH BY|ADD.*REP|\+1/.test(t)) add("format:deathby-unclear", w.id, w.format);
  if (f === "MIXED") add("format:mixed-catchall", w.id, "MIXED — timer detection relies on per-line parsing");

  // ── 3. STRUCTURE: content in the wrong field ──
  if (!w.warmup && /\b(lap|laps|jog|warm[- ]?up|arm circle|mobility|dynamic stretch|leg swing)\b/i.test(w.workout || ""))
    add("structure:buried-warmup", w.id, lines[0]?.trim());
  if (!w.core && /\b(core|abs?|plank|sit-?ups?|crunch|hollow|russian twist|leg raise|flutter)\b/i.test(w.workout || "") &&
      /\bcore\b|\bfinisher\b|\babs?\b/i.test(w.workout || ""))
    add("structure:possible-buried-core", w.id, "workout mentions a core/abs/finisher section");
  // Workouts legitimately have structured warmups ("2 rounds - 30 JJ..."), so only
  // flag a warmup that is both long AND uses strong full-workout markers.
  if (w.warmup && w.warmup.length > 180 && /\bAMRAP\b|\bEMOM\b|FOR TIME/i.test(w.warmup))
    add("structure:workout-in-warmup", w.id, w.warmup.slice(0, 70) + "...");

  // ── 4. EXERCISE COVERAGE: movements not in the dictionary (no info modal / no highlight) ──
  const missing = (w.movements || []).filter(mv => {
    const k = mv.toLowerCase().trim();
    return !exKeys.has(k) && !exNames.has(k);
  });
  if (missing.length) add("coverage:movements-without-info", w.id, missing.join(", "));
  // NOTE: wm is intentionally a subset of movements (core/cardio dropped for injury
  // filtering), so a movements!=wm difference is by design and is NOT flagged.

  // ── 5. DATA QUALITY ──
  if (!w.workout || !w.workout.trim()) add("data:empty-workout", w.id, "");
  if (typeof w.duration !== "number" || w.duration < 5 || w.duration > 90) add("data:duration-outlier", w.id, String(w.duration));
}

// ── report ──
console.log("PARK WOD — full workout audit");
console.log(`${data.length} workouts | ${exKeys.size} exercises in dictionary | ${abbr.size} voice abbreviations\n`);
const order = Object.keys(findings).sort();
for (const cat of order) {
  const items = findings[cat];
  console.log(`\n### ${cat}  (${items.length})`);
  for (const it of items.slice(0, 40)) console.log(`  #${it.id}  ${it.detail ?? ""}`);
  if (items.length > 40) console.log(`  ... +${items.length - 40} more`);
}
console.log("\n— totals —");
for (const cat of order) console.log(`${String(findings[cat].length).padStart(4)}  ${cat}`);
