// Geography: Landmarks (photos) and Rivers & Mountains (physical features).
// Wrong countries are always ones that have a landmark/feature of their own, so the
// "why not" note can say what is really there.
import { LANDMARKS } from "../../data/geography/landmarks.js";
import { FEATURES } from "../../data/geography/physical.js";
import { countries } from "../../data/countries.js";
import { hasImage, imageMedia } from "../../data/images.js";
import { learnMoreUrl, localTitle } from "../../data/sources.js";
import { shuffle, pickDistractors } from "../../lib/random.js";
import { localName, poolFor, countryDistractors, countrySpellings, ALL_COUNTRY_SPELLINGS } from "./generate.js";

export const FEATURE_MODES = ["landmarks", "physical"];

const byCode = Object.fromEntries(countries.map((c) => [c.code, c]));
const list = (items, lang) => new Intl.ListFormat(lang ?? "en", { type: "conjunction" }).format(items);

const SOURCES = {
  landmarks: LANDMARKS.filter(hasImage),
  physical: FEATURES,
};
/** Items located (at least partly) in each country. */
const itemsIn = (mode, code) => SOURCES[mode].filter((x) => x.countries.includes(code));

function countryOptions(item, mode, difficulty, t, lang, nameOf) {
  const correct = byCode[item.countries[0]];
  const wrong = countryDistractors(correct, difficulty, {
    // Never another fair answer, and only countries we can say something about.
    eligible: (c) => !item.countries.includes(c.code) && itemsIn(mode, c.code).length > 0,
  });
  const whyNot = (c) => ({
    text: (mode === "landmarks" ? t.geo.landmarksIn : t.geo.featuresIn)(
      localName(c, lang),
      list(itemsIn(mode, c.code).slice(0, 3).map((x) => nameOf(x)), lang),
    ),
  });
  return shuffle([
    { id: correct.code, label: localName(correct, lang) },
    ...wrong.map((c) => ({ id: c.code, label: localName(c, lang), whyNot: whyNot(c) })),
  ]);
}

// ── Landmarks ──────────────────────────────────────────────────────────────
function buildLandmark(item, variant, difficulty, t) {
  const lang = t.lang;
  const nameOf = (x) => localTitle(x, lang);
  const name = nameOf(item);
  const where = list(item.countries.map((c) => localName(byCode[c], lang)), lang);
  const base = {
    type: "landmarks", media: imageMedia(item, "?"), note: t.geo.landmarkCard(name, where),
    source: learnMoreUrl({ wikiTitle: item.wikiTitle, name }, lang), review: { title: name },
  };
  if (variant === "name") {
    const wrong = pickDistractors({
      correctKey: item.id, keyOf: (x) => x.id,
      // Hard: other landmarks from the same continent.
      tiers: [{ items: SOURCES.landmarks.filter((x) => difficulty !== "hard" || byCode[x.countries[0]].region === byCode[item.countries[0]].region) }],
      fallback: SOURCES.landmarks,
    });
    return {
      ...base, key: `landmarks:name:${item.id}`, kind: "choice", prompt: t.geo.landmarkNamePrompt, correctId: item.id, correctLabel: name,
      options: shuffle([item, ...wrong].map((x) => ({
        id: x.id, label: nameOf(x),
        whyNot: x === item ? undefined : { text: t.geo.landmarkCard(nameOf(x), list(x.countries.map((c) => localName(byCode[c], lang)), lang)) },
      }))),
    };
  }
  const q = { ...base, key: `landmarks:country:${item.id}`, prompt: t.geo.landmarkCountryPrompt, correctLabel: where };
  if (difficulty === "expert") {
    return {
      ...q, kind: "text", placeholder: t.geo.typeCountry,
      accepted: item.countries.flatMap((c) => countrySpellings(byCode[c])), match: { exclude: ALL_COUNTRY_SPELLINGS },
    };
  }
  const options = countryOptions(item, "landmarks", difficulty, t, lang, nameOf);
  return { ...q, kind: "choice", options, correctId: item.countries[0], correctLabel: localName(byCode[item.countries[0]], lang) };
}

// ── Rivers, mountains, deserts, lakes, waterfalls ───────────────────────────
const UNITS = { river: "km", mountain: "m", desert: "km²", lake: "km²", waterfall: "m" };
const valueLabel = (f, lang) => `${f.value.toLocaleString(lang)} ${UNITS[f.kind]}`;

function buildFeature(item, difficulty, t) {
  const lang = t.lang;
  const nameOf = (x) => localTitle(x, lang);
  const name = nameOf(item);
  const where = list(item.countries.map((c) => localName(byCode[c], lang)), lang);
  const base = {
    type: "physical", note: t.geo.featureCard(name, valueLabel(item, lang), where),
    source: learnMoreUrl({ wikiTitle: item.wikiTitle, name }, lang), review: { title: name },
  };
  const q = { ...base, key: `physical:country:${item.id}`, prompt: t.geo.featurePrompt[item.kind](name), correctLabel: where };
  if (difficulty === "expert") {
    return {
      ...q, kind: "text", placeholder: t.geo.typeCountry,
      accepted: item.countries.flatMap((c) => countrySpellings(byCode[c])), match: { exclude: ALL_COUNTRY_SPELLINGS },
    };
  }
  const options = countryOptions(item, "physical", difficulty, t, lang, nameOf);
  return { ...q, kind: "choice", options, correctId: item.countries[0], correctLabel: localName(byCode[item.countries[0]], lang) };
}

/** "Which of these rivers is the longest?" — four of a kind whose values are clearly apart. */
function buildSuperlative(kind, difficulty, t, used) {
  const lang = t.lang;
  const minRatio = difficulty === "hard" ? 1.1 : 1.3;
  const pool = shuffle(FEATURES.filter((f) => f.kind === kind));
  const picked = [];
  for (const f of pool) {
    if (picked.length === 4) break;
    if (picked.every((p) => Math.max(p.value, f.value) / Math.min(p.value, f.value) >= minRatio)) picked.push(f);
  }
  if (picked.length < 4) return null;
  const top = picked.reduce((a, b) => (b.value > a.value ? b : a));
  const key = `physical:top:${picked.map((f) => f.id).sort().join("-")}`;
  if (used.has(key)) return null;
  const nameOf = (x) => localTitle(x, lang);
  const sorted = [...picked].sort((a, b) => b.value - a.value);
  return {
    key, type: "physical", kind: "choice", prompt: t.geo.superlative[kind], correctId: top.id, correctLabel: nameOf(top),
    options: shuffle(picked).map((f) => ({ id: f.id, label: nameOf(f), whyNot: f === top ? undefined : { text: `${nameOf(f)}: ${valueLabel(f, lang)}.` } })),
    note: sorted.map((f) => `${nameOf(f)} ${valueLabel(f, lang)}`).join(" · "),
    source: learnMoreUrl({ wikiTitle: top.wikiTitle, name: nameOf(top) }, lang),
    review: { title: t.geo.superlative[kind] },
  };
}

// ── Round builder ──────────────────────────────────────────────────────────
export function featureRound(settings, t) {
  const { mode, region, difficulty = "medium", roundSize: count = 10 } = settings;
  const inRegion = new Set(poolFor(region).map((c) => c.code));
  const items = shuffle(SOURCES[mode].filter((x) => x.countries.some((c) => inRegion.has(c))));
  const out = [];
  const used = new Set();
  for (const [i, item] of items.entries()) {
    if (out.length >= count) break;
    let q;
    if (mode === "landmarks") {
      const variant = difficulty === "easy" || difficulty === "expert" || i % 2 ? "country" : "name";
      q = buildLandmark(item, variant, difficulty, t);
    } else if ((difficulty === "medium" || difficulty === "hard") && i % 3 === 2 && region === "All") {
      // Superlatives compare features worldwide, so only when no region filter is set.
      q = buildSuperlative(item.kind, difficulty, t, used) ?? buildFeature(item, difficulty, t);
    } else {
      q = buildFeature(item, difficulty, t);
    }
    if (used.has(q.key)) continue;
    used.add(q.key);
    out.push(q);
  }
  return out;
}

