// Builds src/data/generated/calibration.json from collected answer statistics.
//
//   npm run build:calibration -- stats1.json [stats2.json …]
//
// Each input is either
//   - events posted by the app ({ v: 1, events: [{ k, d, c, ms }] }, or an array of those), or
//   - aggregated counts ({ key: [answered, correct] }, e.g. the app's localStorage "quiz:stats:v1").
// Keys with fewer than MIN_ANSWERS answers are left out, so a handful of players can't skew it.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_ANSWERS = 30;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const totals = {};
const add = (k, n, c) => { const t = (totals[k] ??= [0, 0]); t[0] += n; t[1] += c; };

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: npm run build:calibration -- <stats.json> [...]");
  process.exit(1);
}
for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const batches = Array.isArray(data) ? data : [data];
  for (const b of batches) {
    if (Array.isArray(b?.events)) for (const e of b.events) add(e.k, 1, e.c ? 1 : 0);
    else for (const [k, v] of Object.entries(b ?? {})) if (Array.isArray(v)) add(k, v[0], v[1]);
  }
}

const out = {};
for (const [k, [n, c]] of Object.entries(totals).sort()) {
  if (n >= MIN_ANSWERS) out[k] = { n, acc: Math.round((c / n) * 100) / 100 };
}
writeFileSync(join(root, "src/data/generated/calibration.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`${Object.keys(out).length} questions calibrated (of ${Object.keys(totals).length} seen; min ${MIN_ANSWERS} answers)`);
