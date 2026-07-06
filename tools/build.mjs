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

await build({
  entryPoints: [join(root, "src", "app.jsx")],
  outfile: join(root, "app.js"),
  bundle: true,
  jsx: "transform",           // React.createElement — React provided as global (CDN)
  target: "es2020",
  charset: "utf8",
  logLevel: "warning",
});

writeFileSync(join(root, "index.html"), readFileSync(join(root, "src", "shell.html"), "utf8"));

const kb = f => (statSync(join(root, f)).size / 1024).toFixed(0) + " KB";
console.log(`built: app.js ${kb("app.js")}, index.html ${kb("index.html")}`);
