// Downloads accurate flag SVGs (public domain, sourced from Wikimedia via flagcdn.com)
// for every country in the quiz into src/assets/flags/. Run once when countries change:
//
//   npm run build:flags
//
// Flags are committed and served as local static files, so the app needs no flag CDN.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { countries } from "../src/data/countries.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/assets/flags");
mkdirSync(outDir, { recursive: true });
const force = process.argv.includes("--all");
const failures = [];

for (const { code } of countries) {
  const file = join(outDir, `${code}.svg`);
  if (existsSync(file) && !force) continue;
  const res = await fetch(`https://flagcdn.com/${code.toLowerCase()}.svg`);
  const body = res.ok ? await res.text() : "";
  if (!body.includes("<svg")) {
    failures.push(`${code}: HTTP ${res.status}`);
    continue;
  }
  writeFileSync(file, body);
  await new Promise((r) => setTimeout(r, 100));
}
console.log(`flags in ${outDir}; failures: ${failures.length ? failures.join(", ") : "none"}`);
if (failures.length) process.exitCode = 1;
