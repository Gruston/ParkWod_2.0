// One-off Phase 0b split: extract pure-logic modules from src/app.jsx.
// Line ranges verified self-contained (no external identifier references).
// Run once:  node tools/split-phase0b.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const lines = readFileSync(join(src, "app.jsx"), "utf8").split("\n");

// [startLine, endLine] inclusive, 1-indexed — verified against current app.jsx
const MODULES = [
  { file: "engine/blocks.js", start: 676, end: 1098,
    exports: ["parseBlocks", "detectBlockTimer"] },
  { file: "engine/voice.js", start: 234, end: 305,
    exports: ["VOICE_ABBREVIATIONS", "normaliseNotation", "expandAbbreviations", "speakText", "cancelSpeech"] },
  { file: "data/workouts.js", start: 191, end: 204,
    exports: ["RAW_DATA", "DIFFICULTY_COLORS", "EQUIPMENT_ICONS", "ALL_EQUIPMENT", "ALL_RATINGS", "ALL_FORMATS", "ALL_FOCUSES", "ALL_MOVEMENTS", "ALL_WORKOUT_MOVEMENTS"] },
  { file: "data/exercises.js", start: 92, end: 190,
    exports: ["CATEGORY_PATTERNS", "EXERCISE_INFO"] },
];

// Sanity-guard each range against expected first content before cutting
const GUARDS = { 676: "═══", 234: "═══", 191: "═══", 92: "// CSS gradient" };
for (const m of MODULES) {
  const first = lines[m.start - 1];
  if (!first.includes(GUARDS[m.start])) throw new Error(`Guard failed at line ${m.start}: "${first.slice(0, 60)}"`);
}

mkdirSync(join(src, "engine"), { recursive: true });
mkdirSync(join(src, "data"), { recursive: true });

// Cut in descending start order so line numbers stay valid
let work = [...lines];
const importLines = [];
for (const m of MODULES) {
  const body = work.slice(m.start - 1, m.end).join("\n");
  writeFileSync(join(src, m.file),
    body + `\n\nexport { ${m.exports.join(", ")} };\n`, "utf8");
  work.splice(m.start - 1, m.end - m.start + 1);
  importLines.unshift(`import { ${m.exports.join(", ")} } from "./${m.file}";`);
}

const header = [
  `import * as React from "react";`,
  `import * as ReactDOM from "react-dom/client";`,
  ...importLines,
  "",
].join("\n");
writeFileSync(join(src, "app.jsx"), header + work.join("\n"), "utf8");

console.log("Split complete:");
for (const m of MODULES) console.log(`  src/${m.file}  (lines ${m.start}-${m.end}, exports: ${m.exports.length})`);
console.log(`  src/app.jsx now ${work.length + 5} lines`);
