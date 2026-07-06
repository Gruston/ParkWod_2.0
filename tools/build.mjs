// PARK WOD build: src/ -> static files served by GitHub Pages.
//   node tools/build.mjs          (or: npm run build)
// Outputs:
//   app.js     — transpiled application (from src/app.jsx)
//   index.html — copy of src/shell.html
import { build } from "esbuild";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Version stamp: package.json version + build time (AEST), e.g. "3.0.0 · 15 Jun 14:32"
// Build time (not git hash) because app.js is built before the commit exists.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const stamp = new Intl.DateTimeFormat("en-AU", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  hour12: false, timeZone: "Australia/Sydney",
}).format(new Date());
const APP_VERSION = `${pkg.version} · ${stamp}`;

await build({
  entryPoints: [join(root, "src", "app.jsx")],
  outfile: join(root, "app.js"),
  bundle: true,               // bundles React from node_modules — no CDN dependency
  jsx: "transform",           // React.createElement (classic runtime)
  define: { "process.env.NODE_ENV": '"production"', "__APP_VERSION__": JSON.stringify(APP_VERSION) },
  minify: true,
  target: "es2020",
  charset: "utf8",
  logLevel: "warning",
});

writeFileSync(join(root, "index.html"), readFileSync(join(root, "src", "shell.html"), "utf8"));

const kb = f => (statSync(join(root, f)).size / 1024).toFixed(0) + " KB";
console.log(`built: app.js ${kb("app.js")}, index.html ${kb("index.html")}`);
