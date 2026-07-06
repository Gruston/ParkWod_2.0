// One-off Phase 0 extraction: mechanically split index.html into
//   src/app.jsx    — the JSX application code (unchanged, byte-for-byte)
//   src/shell.html — the HTML shell that loads the built app.js
// No logic changes. Run once:  node tools/extract-phase0.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

const OPEN = '<script type="text/babel">';
const start = html.indexOf(OPEN);
if (start === -1) throw new Error("babel script tag not found");
const bodyStart = start + OPEN.length;
const end = html.indexOf("</script>", bodyStart);
if (end === -1) throw new Error("closing script tag not found");

// 1. The application code, exactly as-is
const appCode = html.slice(bodyStart, end);

// 2. The shell: everything before the babel tag + everything after its close,
//    with the babel-standalone CDN script removed and app.js referenced instead.
let before = html.slice(0, start);
before = before.replace(/^\s*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone[^\n]*\n/m, "");
const after = html.slice(end + "</script>".length);
const shell = before + '<script src="app.js"></script>' + after;

mkdirSync(join(root, "src"), { recursive: true });
writeFileSync(join(root, "src", "app.jsx"), appCode, "utf8");
writeFileSync(join(root, "src", "shell.html"), shell, "utf8");

console.log(`app.jsx:    ${appCode.length} chars`);
console.log(`shell.html: ${shell.length} chars`);
console.log("Verify: appCode contains no <script or </script:",
  !appCode.includes("<script") && !appCode.includes("</" + "script"));
