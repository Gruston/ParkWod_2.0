// Verifies timer detection for workouts by running the REAL parseBlocks /
// detectBlockTimer source extracted straight from index.html (no copy drift).
//   node tools/test-timers.mjs            # all MIXED-format workouts
//   node tools/test-timers.mjs 17 44 89   # specific ids
//   node tools/test-timers.mjs --all      # every workout

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

const data = JSON.parse(html.match(/RAW_DATA\s*=\s*(\[[\s\S]*?\]);/)[1]);

// pull the two timer functions verbatim and evaluate them
const start = html.indexOf("function parseBlocks(text)");
const end = html.indexOf("// TIMER HOOK");
const src = html.slice(start, end).replace(/\/\/.*$/gm, ""); // strip line comments (keep code)
const factory = new Function(src + "\nreturn { parseBlocks, detectBlockTimer };");
const { parseBlocks } = factory();

const args = process.argv.slice(2);
const csv = args.includes("--csv");
let targets;
if (args.includes("--all") || csv) targets = data;
else if (args.filter(a => !a.startsWith("--")).length) targets = data.filter(w => args.includes(String(w.id)));
else targets = data.filter(w => (w.format || "").toUpperCase() === "MIXED");

if (csv) {
  // machine-readable: id|field|index|timerType  — for before/after regression diffs
  for (const w of targets) {
    for (const [field, txt] of [["warmup", w.warmup], ["workout", w.workout], ["core", w.core]]) {
      if (!txt || !txt.trim()) continue;
      parseBlocks(txt).forEach((b, i) => console.log(`${w.id}|${field}|${i}|${b.timer?.type}`));
    }
  }
  process.exit(0);
}

let warnings = 0;
for (const w of targets) {
  console.log(`\n#${w.id}  [${w.format}]  focus=${w.focus}`);
  for (const [field, txt] of [["warmup", w.warmup], ["workout", w.workout], ["core", w.core]]) {
    if (!txt || !txt.trim()) continue;
    const blocks = parseBlocks(txt);
    blocks.forEach((b, i) => {
      const t = b.timer || {};
      const first = b.content.split("\n")[0].slice(0, 58);
      // a block is "suspicious" if it defaults to a bare stopwatch but its text
      // clearly implies timed intervals (30s / EMOM / AMRAP / tabata / rounds-each)
      const impliesTimed = /\b\d+\s*s\b|\bEMOM\b|\bAMRAP\b|TABATA|\d+\s*[/\\]\s*\d+|1\s*MIN\s*(EACH|PER)/i.test(b.content);
      const bareStopwatch = t.type === "stopwatch" && !t.capSeconds;
      const flag = (impliesTimed && bareStopwatch) ? "  ⚠ timed text but stopwatch" : "";
      if (flag) warnings++;
      console.log(`   ${field}[${i}] -> ${String(t.type).padEnd(10)} ${t.label || ""}${flag}`);
      console.log(`            "${first}"`);
    });
  }
}
console.log(`\n${targets.length} workout(s) checked, ${warnings} block(s) flagged for review.`);
