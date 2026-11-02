// Refreshes country facts from Wikidata and verifies history dates.
//
//   npm run build:facts
//
// Writes (committed):
//   src/data/generated/countryFacts.json  population (+ year), area, capital (en/es/fr) and
//                                         currencies (ISO 4217)
//   src/data/generated/sources.json       Wikidata id + es/fr Wikipedia titles for every
//                                         wikiTitle used in the quiz (for "learn more" links)
//   npm run build:facts -- --sources-only   (skip country facts)
// Prints mismatches between our people's birth/death years and Wikidata.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { countries } from "../src/data/countries.js";
import { countriesExtra } from "../src/data/countriesExtra.js";
import { people } from "../src/data/history/people.js";
import { artworks } from "../src/data/history/artworks.js";
import { ANIMALS } from "../src/data/science/animals.js";
import { SPACE_OBJECTS } from "../src/data/science/space.js";
import { BODY_REGIONS } from "../src/data/science/body.js";
import { ELEMENTS } from "../src/data/science/elements.js";
import { PLANTS } from "../src/data/science/plants.js";
import { MISSIONS } from "../src/data/science/traits.js";
import { LANDMARKS } from "../src/data/geography/landmarks.js";
import { FEATURES } from "../src/data/geography/physical.js";
import { US_STATES } from "../src/data/geography/usStates.js";

const US_ARTICLES = { GA: "Georgia (U.S. state)", NY: "New York (state)", WA: "Washington (state)" }; // keep in sync with src/subjects/geography/usStates.js
const usTitles = US_STATES.map((s) => ({ wikiTitle: US_ARTICLES[s.code] ?? s.name }));

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = "QuizSite/1.0 (build-time fact refresh; https://github.com/cranecd/geography)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sparql(query) {
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/sparql-results+json" } });
    if (res.status === 429 || res.status >= 500) { await sleep(5000 * 2 ** attempt); continue; }
    if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return data.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
  }
  throw new Error("SPARQL rate limited");
}

const isoValues = countries.map((c) => `"${c.code}"`).join(" ");
const country = `VALUES ?iso { ${isoValues} } ?c wdt:P297 ?iso . FILTER NOT EXISTS { ?c wdt:P31 wd:Q3024240 }`; // skip historical countries

// ── Countries ──────────────────────────────────────────────────────────────
if (!process.argv.includes("--sources-only")) {
const facts = Object.fromEntries(countries.map((c) => [c.code, { currencies: [] }]));

// Statement ranks: prefer "preferred", then "normal"; ignore "deprecated".
const RANK = { "http://wikiba.se/ontology#PreferredRank": 2, "http://wikiba.se/ontology#NormalRank": 1 };
const thisYear = new Date().getFullYear();
const pick = (rows) =>
  rows
    .filter((r) => RANK[r.rank])
    .sort((a, b) => RANK[b.rank] - RANK[a.rank] || b.year - a.year)[0];

const flagged = [];
// Guard rail: a refreshed value more than 35% away from our reviewed figure is flagged for a
// human instead of silently replacing it (Wikidata sometimes holds projections or disputed claims).
function guarded(iso, field, fresh, curated) {
  if (fresh == null) return null;
  const ratio = fresh / curated;
  if (ratio > 1.35 || ratio < 0.74) {
    flagged.push(`${iso} ${field}: Wikidata ${fresh} vs ours ${curated} — kept ours`);
    return null;
  }
  return fresh;
}

const pops = await sparql(`SELECT ?iso ?pop ?t ?rank WHERE { ${country} ?c p:P1082 ?s . ?s ps:P1082 ?pop ; wikibase:rank ?rank . OPTIONAL { ?s pq:P585 ?t } }`);
const popRows = {};
for (const { iso, pop, t, rank } of pops) {
  const year = t ? Number(t.slice(0, 4)) : 0;
  if (year <= thisYear) (popRows[iso] ??= []).push({ value: Number(pop), year, rank });
}
for (const c of countries) {
  const best = pick(popRows[c.code] ?? []);
  const curated = countriesExtra[c.code].population * 1e6;
  const value = guarded(c.code, "population", best?.value, curated);
  facts[c.code].population = value ? { value, year: best.year || null } : { value: curated, year: null };
}
await sleep(1500);

const areas = await sparql(`SELECT ?iso ?m2 ?rank WHERE { ${country} ?c p:P2046 ?s . ?s psn:P2046/wikibase:quantityAmount ?m2 ; wikibase:rank ?rank . }`);
const areaRows = {};
for (const { iso, m2, rank } of areas) (areaRows[iso] ??= []).push({ value: Math.round(Number(m2) / 1e6), year: 0, rank });
for (const c of countries) {
  const curated = countriesExtra[c.code].area;
  // Among the best-ranked statements, take the one closest to our reviewed figure.
  const rows = (areaRows[c.code] ?? []).filter((r) => RANK[r.rank] && r.value > 0);
  const top = Math.max(0, ...rows.map((r) => RANK[r.rank]));
  const best = rows.filter((r) => RANK[r.rank] === top).sort((a, b) => Math.abs(a.value - curated) - Math.abs(b.value - curated))[0];
  facts[c.code].area_km2 = guarded(c.code, "area", best?.value, curated) ?? curated;
}
await sleep(1500);

const caps = await sparql(`SELECT ?iso ?en ?es ?fr WHERE { ${country} ?c wdt:P36 ?cap .
  ?cap rdfs:label ?en FILTER(LANG(?en) = "en")
  OPTIONAL { ?cap rdfs:label ?es FILTER(LANG(?es) = "es") }
  OPTIONAL { ?cap rdfs:label ?fr FILTER(LANG(?fr) = "fr") } }`);
const norm = (x) => x.normalize("NFD").replace(/[\u0300-\u036fʻ']/g, "").replace(/^(st\.?|saint)\s/i, "saint ").replace(/\s+(city|district)$/i, "").toLowerCase().trim();
const wdCaps = {};
for (const row of caps) (wdCaps[row.iso] ??= []).push(row);
for (const c of countries) {
  const options = wdCaps[c.code] ?? [];
  const match = options.find((o) => norm(o.en) === norm(c.capital) || norm(o.en).includes(norm(c.capital)) || norm(c.capital).includes(norm(o.en)));
  facts[c.code].capital = match ? { en: c.capital, es: match.es ?? c.capital, fr: match.fr ?? c.capital } : { en: c.capital, es: null, fr: null };
  if (!match) flagged.push(`${c.code} capital: ours "${c.capital}", Wikidata ${options.map((o) => `"${o.en}"`).join(" / ") || "none"}`);
}
delete facts.__unused;
await sleep(1500);

// Current currencies only: skip ended (P582) or deprecated statements, and anything that is not
// a valid ISO 4217 alphabetic code the browser can name.
const curs = await sparql(`SELECT ?iso ?code WHERE { ${country} ?c p:P38 ?st . ?st ps:P38 ?cur ; wikibase:rank ?r .
  FILTER(?r != wikibase:DeprecatedRank) FILTER NOT EXISTS { ?st pq:P582 ?end } ?cur wdt:P498 ?code . }`);
const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
for (const { iso, code } of curs) {
  if (!/^[A-Z]{3}$/.test(code) || currencyNames.of(code) === code) continue;
  if (!facts[iso].currencies.includes(code)) facts[iso].currencies.push(code);
}
await sleep(1500);

// Reviewed by hand: Wikidata lists units of account, overseas-territory and obsolete currencies here.
const CURRENCY_OVERRIDES = {
  CL: ["CLP"], // CLF is a unit of account
  FR: ["EUR"], // XPF is used in overseas territories
  LT: ["EUR"], // LTT (talonas) is obsolete
  NL: ["EUR"], // AWG/XCG/USD belong to the Caribbean parts of the Kingdom
  PL: ["PLN"], // PLZ is the pre-1995 złoty
  ZW: ["USD", "ZWG"], // multi-currency basket and obsolete Zimbabwe dollars removed
};
for (const [iso, codes] of Object.entries(CURRENCY_OVERRIDES)) facts[iso].currencies = codes;

// Land borders come from the map geometry (scripts/build-geo.mjs): Wikidata's "shares border
// with" also lists maritime borders, which would make neighbour questions misleading.
for (const f of Object.values(facts)) { delete f.neighbours; f.currencies.sort(); }

const retrieved = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(root, "src/data/generated/countryFacts.json"),
  JSON.stringify({ source: "Wikidata", retrieved, countries: facts }, null, 1) + "\n",
);

const missing = Object.entries(facts).filter(([, f]) => !f.currencies.length);
console.log(`countries: ${Object.keys(facts).length}, without currency: ${missing.map(([k]) => k).join(" ") || "none"}`);
console.log(flagged.length ? `Needs a human look:\n  ${flagged.join("\n  ")}` : "No flagged values.");
}

// ── Sources: Wikidata id + es/fr article titles ────────────────────────────
// Keep in sync with ELEMENT_ARTICLES in src/subjects/science/generate.js.
const elementTitles = ELEMENTS.map((e) => ({ wikiTitle: e.symbol === "Hg" ? "Mercury_(element)" : e.name }));
const titles = [...new Set([people, artworks, ANIMALS, SPACE_OBJECTS, BODY_REGIONS, elementTitles, PLANTS, MISSIONS, LANDMARKS, FEATURES, usTitles].flat().map((x) => x.wikiTitle).filter(Boolean))];
const sources = {};
for (let i = 0; i < titles.length; i += 60) {
  const batch = titles.slice(i, i + 60);
  const values = batch.map((t) => `"${t.replace(/_/g, " ").replace(/"/g, '\\"')}"@en`).join(" ");
  const rows = await sparql(`SELECT ?name ?item ?es ?fr WHERE {
    VALUES ?name { ${values} }
    ?en schema:name ?name ; schema:isPartOf <https://en.wikipedia.org/> ; schema:about ?item .
    OPTIONAL { ?esA schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> ; schema:name ?es . }
    OPTIONAL { ?frA schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> ; schema:name ?fr . } }`);
  for (const { name, item, es, fr } of rows) {
    const key = batch.find((t) => t.replace(/_/g, " ") === name);
    sources[key] = { qid: item.split("/").pop(), es: es ?? null, fr: fr ?? null };
  }
  await sleep(1500);
}
writeFileSync(join(root, "src/data/generated/sources.json"), JSON.stringify(sources, null, 1) + "\n");
console.log(`sources: ${Object.keys(sources).length}/${titles.length} titles matched`);

// ── Verify people's dates ──────────────────────────────────────────────────
const qids = people.map((p) => sources[p.wikiTitle]?.qid).filter(Boolean);
const dates = await sparql(`SELECT ?item ?b ?d WHERE { VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
  OPTIONAL { ?item wdt:P569 ?b } OPTIONAL { ?item wdt:P570 ?d } }`);
const yearOf = (iso) => (iso ? Number(iso.match(/^(-?\d+)/)[1]) : null);
const byQid = {};
for (const { item, b, d } of dates) {
  const q = item.split("/").pop();
  (byQid[q] ??= { born: new Set(), died: new Set() });
  if (b) byQid[q].born.add(yearOf(b));
  if (d) byQid[q].died.add(yearOf(d));
}
const report = [];
for (const p of people) {
  const w = byQid[sources[p.wikiTitle]?.qid];
  if (!w) { report.push(`${p.id}: not found on Wikidata`); continue; }
  // Wikidata writes 1 BC as 0 (astronomical numbering); our data uses -1.
  const match = (ours, set) => !set.size || [...set].some((y) => y === ours || (ours < 0 && y === ours + 1));
  if (!match(p.born, w.born)) report.push(`${p.id}: born ${p.born}, Wikidata ${[...w.born].join("/")}`);
  if (p.died != null && !match(p.died, w.died)) report.push(`${p.id}: died ${p.died}, Wikidata ${[...w.died].join("/")}`);
}
console.log(report.length ? `Date mismatches:\n  ${report.join("\n  ")}` : "All people's dates match Wikidata.");
