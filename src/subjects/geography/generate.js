import { countries, regions } from "../../data/countries.js";
import { countriesExtra } from "../../data/countriesExtra.js";
import { countryTranslations } from "../../data/countryTranslations.js";
import { OFFICIAL_LANGUAGES, languageName, languageSpellings } from "../../data/languages.js";
import shapes from "../../data/generated/shapes.json";
import { shuffle, randInt, pickDistractors, cycler } from "../../lib/random.js";
import { flagSrc } from "./flags.js";

export { regions };

import { MIXABLE_MODES } from "../catalog.js";

export { MIXABLE_MODES };
export const COMPARE_MODES = ["population", "area"];

// Extra spellings accepted in typed answers (any UI language).
const COUNTRY_ALIASES = {
  US: ["USA", "US", "America", "United States of America", "EEUU", "EE UU", "Etats Unis"],
  GB: ["UK", "Great Britain", "Britain"],
  CD: ["DRC", "Democratic Republic of the Congo", "Congo Kinshasa", "RDC", "RD Congo"],
  CG: ["Republic of the Congo", "Congo Brazzaville"],
  CZ: ["Czechia", "Chequia", "Tchéquie"],
  RU: ["Russian Federation"],
  CI: ["Ivory Coast", "Cote d'Ivoire"],
  MM: ["Burma", "Birmania", "Birmanie"],
  SZ: ["Swaziland", "Suazilandia"],
  CV: ["Cape Verde", "Cabo Verde", "Cap Vert"],
  TL: ["East Timor", "Timor Oriental", "Timor Leste"],
  NL: ["Holland", "Holanda", "Hollande"],
  TR: ["Türkiye", "Turkiye"],
  KR: ["Korea", "Republic of Korea"],
  KP: ["DPRK"],
  MK: ["Macedonia"],
  VA: ["Holy See", "Vatican"],
  FM: ["Federated States of Micronesia"],
};

const CAPITAL_ALIASES = {
  US: ["Washington", "Washington DC"],
  UA: ["Kiev"],
  IN: ["Delhi"],
  BO: ["La Paz"],
  MY: ["Putrajaya"],
  NL: ["The Hague"],
  ZA: ["Pretoria", "Cape Town", "Bloemfontein"],
  LK: ["Colombo", "Sri Jayawardenepura Kotte"],
  BN: ["Bandar Seri Begawan"],
};

export function localName(country, lang) {
  return countryTranslations[country.code]?.[lang] ?? country.name;
}

function countrySpellings(country) {
  const t = countryTranslations[country.code] ?? {};
  return [country.name, t.es, t.fr, ...(COUNTRY_ALIASES[country.code] ?? [])].filter(Boolean);
}

export function officialLanguages(code) {
  const primary = countriesExtra[code]?.language;
  return [...new Set([primary, ...(OFFICIAL_LANGUAGES[code] ?? [])].filter(Boolean))];
}

export function hasShape(code) {
  return Boolean(shapes[code]);
}

export function poolFor(region) {
  return !region || region === "All" ? countries : countries.filter((c) => c.region === region);
}

const ALL_COUNTRY_SPELLINGS = countries.flatMap(countrySpellings);
const ALL_CAPITALS = countries.map((c) => c.capital);
const ALL_LANGUAGES = [...new Set(Object.values(countriesExtra).map((x) => x.language))];

/**
 * Distractor countries for `correct`, drawn from the whole world so that a
 * region filter only limits which countries are *asked*, never the option count.
 *   easy   – 3 from other regions (clearly different)
 *   medium – 1–2 from the same region, the rest from elsewhere
 *   hard   – 3 from the same region
 */
export function countryDistractors(correct, difficulty, { eligible = () => true, keyOf = (c) => c.code } = {}) {
  const others = countries.filter((c) => c.code !== correct.code && eligible(c));
  const same = others.filter((c) => c.region === correct.region);
  const far = others.filter((c) => c.region !== correct.region);
  const tiers =
    difficulty === "easy" ? [{ items: far, take: 3 }]
    : difficulty === "medium" ? [{ items: same, take: randInt(1, 2) }, { items: far, take: 3 }]
    : [{ items: same, take: 3 }];
  return pickDistractors({ correctKey: keyOf(correct), tiers, fallback: others, keyOf });
}

function choice(options, correctId) {
  return { kind: "choice", options: shuffle(options), correctId };
}

function build(type, country, settings, t) {
  const { difficulty, lang } = settings;
  const expert = difficulty === "expert";
  const name = localName(country, lang);
  const base = { key: `${type}:${country.code}`, type, correctLabel: name };

  if (type === "flags") {
    const media = { kind: "flag", src: flagSrc(country.code), alt: "" };
    const review = { title: t.geo.flagOf(name), flag: media.src };
    if (expert) {
      return {
        ...base, kind: "text", prompt: t.geo.flagPrompt, media, review,
        accepted: countrySpellings(country), match: { exclude: ALL_COUNTRY_SPELLINGS },
        placeholder: t.geo.typeCountry,
      };
    }
    const opts = [country, ...countryDistractors(country, difficulty)].map((c) => ({ id: c.code, label: localName(c, lang) }));
    return { ...base, ...choice(opts, country.code), prompt: t.geo.flagPrompt, media, review };
  }

  if (type === "capitals") {
    const media = { kind: "flagThumb", src: flagSrc(country.code), alt: t.geo.flagOf(name) };
    const review = { title: t.geo.capitalOf(name), flag: media.src };
    const common = { ...base, correctLabel: country.capital, prompt: t.geo.capitalPrompt(name), media, review };
    if (expert) {
      return {
        ...common, kind: "text",
        accepted: [country.capital, ...(CAPITAL_ALIASES[country.code] ?? [])],
        match: { exclude: ALL_CAPITALS }, placeholder: t.geo.typeCapital,
      };
    }
    const opts = [country, ...countryDistractors(country, difficulty, { keyOf: (c) => c.capital })]
      .map((c) => ({ id: c.code, label: c.capital }));
    return { ...common, ...choice(opts, country.code) };
  }

  if (type === "shapes") {
    const media = { kind: "shape", d: shapes[country.code] };
    const review = { title: t.geo.shapeOf(name), shape: media.d };
    if (expert) {
      return {
        ...base, kind: "text", prompt: t.geo.shapePrompt, media, review,
        accepted: countrySpellings(country), match: { exclude: ALL_COUNTRY_SPELLINGS },
        placeholder: t.geo.typeCountry,
      };
    }
    const opts = [country, ...countryDistractors(country, difficulty, { eligible: (c) => hasShape(c.code) })]
      .map((c) => ({ id: c.code, label: localName(c, lang) }));
    return { ...base, ...choice(opts, country.code), prompt: t.geo.shapePrompt, media, review };
  }

  if (type === "locate") {
    return {
      ...base, kind: "locate", prompt: t.geo.locatePrompt(name), code: country.code,
      region: settings.region, review: { title: t.geo.locatePrompt(name) },
    };
  }

  if (type === "languages") {
    const official = officialLanguages(country.code);
    if (!official.length) return null;
    const primary = official[0];
    const media = { kind: "flagThumb", src: flagSrc(country.code), alt: t.geo.flagOf(name) };
    const note = official.length > 1 ? t.geo.officialLanguages(official.map((l) => languageName(l, lang)).join(", ")) : null;
    const common = {
      ...base, correctLabel: languageName(primary, lang), prompt: t.geo.languagePrompt(name), media, note,
      review: { title: t.geo.languageOf(name), flag: media.src },
    };
    if (expert) {
      return {
        ...common, kind: "text", accepted: official.flatMap(languageSpellings),
        match: { exclude: ALL_LANGUAGES.flatMap(languageSpellings) }, placeholder: t.geo.typeLanguage,
      };
    }
    const officialSet = new Set(official);
    const notOfficial = (l) => !officialSet.has(l);
    const neighbourLangs = countries
      .filter((c) => c.region === country.region)
      .map((c) => countriesExtra[c.code]?.language)
      .filter((l) => l && notOfficial(l));
    const anyLangs = ALL_LANGUAGES.filter(notOfficial);
    const tiers = difficulty === "easy" ? [{ items: anyLangs }] : [{ items: neighbourLangs }];
    const wrong = pickDistractors({ correctKey: primary, tiers, fallback: anyLangs });
    const opts = [primary, ...wrong].map((l) => ({ id: l, label: languageName(l, lang) }));
    return { ...common, ...choice(opts, primary) };
  }
  return null;
}

// ── Population / area comparison ───────────────────────────────────────────
const RATIO_BANDS = {
  easy: [3, Infinity], // one is at least 3× the other
  medium: [1.5, 6],
  hard: [1.05, 2], // close calls
  expert: [1.05, 1.6],
};

function formatPopulation(m, t, lang) {
  const fmt = (n, dp) => n.toLocaleString(lang, { maximumFractionDigits: dp });
  if (m >= 1000) return t.geo.billions(fmt(m / 1000, 2));
  if (m >= 1) return t.geo.millions(fmt(m, 1));
  return t.geo.thousands(fmt(Math.round(m * 1000), 0));
}

function buildCompare(type, a, b, settings, t) {
  const { lang } = settings;
  const value = (c) => countriesExtra[c.code][type];
  const label = (c) => (type === "population" ? formatPopulation(value(c), t, lang) : `${Math.round(value(c)).toLocaleString(lang)} km²`);
  const winner = value(a) > value(b) ? a : b;
  return {
    key: `${type}:${a.code}-${b.code}`,
    type,
    kind: "compare",
    prompt: type === "population" ? t.geo.populationPrompt : t.geo.areaPrompt,
    items: [a, b].map((c) => ({
      id: c.code, label: localName(c, lang), value: label(c),
      media: { kind: "flag", src: flagSrc(c.code), alt: t.geo.flagOf(localName(c, lang)) },
    })),
    correctId: winner.code,
    verdicts: { correct: t.higher, other: t.lower },
    correctLabel: localName(winner, lang),
    review: { title: `${localName(a, lang)} ${t.vs} ${localName(b, lang)}` },
  };
}

/** Pick a partner for `a` whose ratio falls in the difficulty band (best effort). */
function comparePartner(a, pool, type, difficulty, used) {
  const [lo, hi] = RATIO_BANDS[difficulty] ?? RATIO_BANDS.medium;
  const va = countriesExtra[a.code][type];
  const candidates = pool.filter((b) => b.code !== a.code && !used.has(b.code) && countriesExtra[b.code][type] !== va);
  const inBand = candidates.filter((b) => {
    const vb = countriesExtra[b.code][type];
    const r = Math.max(va, vb) / Math.min(va, vb);
    return r >= lo && r <= hi;
  });
  return shuffle(inBand.length ? inBand : candidates)[0];
}

function compareRound(type, pool, count, settings, t) {
  const used = new Set();
  const out = [];
  for (const a of shuffle(pool)) {
    if (out.length >= count) break;
    if (used.has(a.code)) continue;
    const b = comparePartner(a, pool, type, settings.difficulty, used);
    if (!b) continue;
    used.add(a.code).add(b.code);
    out.push(buildCompare(type, ...shuffle([a, b]), settings, t));
  }
  return out;
}

// ── Round builder ──────────────────────────────────────────────────────────
function eligibleFor(type) {
  if (type === "shapes") return (c) => hasShape(c.code);
  // Every country is on the locate map (outline or microstate point); see generate.test.js.
  if (type === "languages") return (c) => officialLanguages(c.code).length > 0;
  if (COMPARE_MODES.includes(type)) return (c) => Boolean(countriesExtra[c.code]?.[type]);
  return () => true;
}

export function buildRound(settings, t) {
  const { mode, region, roundSize: count = 10 } = settings;
  const pool = poolFor(region);

  if (COMPARE_MODES.includes(mode)) {
    return compareRound(mode, pool.filter(eligibleFor(mode)), count, settings, t);
  }

  if (mode !== "mixed") {
    const eligible = pool.filter(eligibleFor(mode));
    return shuffle(eligible).slice(0, count).map((c) => build(mode, c, settings, t)).filter(Boolean);
  }

  const active = (settings.mixedModes ?? []).filter((m) => MIXABLE_MODES.includes(m));
  const modes = active.length ? active : MIXABLE_MODES;
  const nextCountry = cycler(pool);
  const asked = new Set();
  const out = [];
  for (let i = 0; i < count; i++) {
    const type = modes[randInt(0, modes.length - 1)];
    if (COMPARE_MODES.includes(type)) {
      const eligible = pool.filter(eligibleFor(type));
      const [q] = compareRound(type, eligible, 1, settings, t);
      if (q) out.push(q);
      continue;
    }
    // Find a not-yet-asked country this question type supports.
    const ok = eligibleFor(type);
    let country = null;
    for (let tries = 0; tries < pool.length * 2 && !country; tries++) {
      const c = nextCountry();
      if (ok(c) && !asked.has(`${type}:${c.code}`)) country = c;
    }
    if (!country) continue;
    asked.add(`${type}:${country.code}`);
    const q = build(type, country, settings, t);
    if (q) out.push(q);
  }
  return out;
}
