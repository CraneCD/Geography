import { countries, regions } from "../../data/countries.js";
import { countriesExtra } from "../../data/countriesExtra.js";
import { countryTranslations } from "../../data/countryTranslations.js";
import { OFFICIAL_LANGUAGES, languageName, languageSpellings } from "../../data/languages.js";
import shapes from "../../data/generated/shapes.json";
import landBorders from "../../data/generated/landBorders.json";
import countryFacts from "../../data/generated/countryFacts.json";
import { learnMoreUrl } from "../../data/sources.js";
import { shuffle, randInt, pickDistractors, cycler } from "../../lib/random.js";
import { flagSrc } from "./flags.js";
import { MIXABLE_MODES } from "../catalog.js";

export { regions, MIXABLE_MODES };
export const COMPARE_MODES = ["population", "area"];

const FACTS = countryFacts.countries;

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
  KI: ["South Tarawa"],
  IS: ["Reykjavík"],
  GQ: ["Ciudad de la Paz"],
};

// ── Localised names ────────────────────────────────────────────────────────
export function localName(country, lang) {
  return countryTranslations[country.code]?.[lang] ?? country.name;
}

/** Capital in the player's language (official Spanish/French names from Wikidata). */
export function capitalName(country, lang) {
  return FACTS[country.code]?.capital?.[lang] ?? country.capital;
}

const currencyNames = {};
/** Localised currency name from the browser's own ICU data, e.g. EUR → "euro". */
export function currencyName(code, lang) {
  currencyNames[lang] ??= new Intl.DisplayNames([lang], { type: "currency" });
  const name = currencyNames[lang].of(code) ?? code;
  return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
}

export function countrySpellings(country) {
  const t = countryTranslations[country.code] ?? {};
  return [country.name, t.es, t.fr, ...(COUNTRY_ALIASES[country.code] ?? [])].filter(Boolean);
}

function capitalSpellings(country) {
  const f = FACTS[country.code]?.capital ?? {};
  return [...new Set([country.capital, f.es, f.fr, ...(CAPITAL_ALIASES[country.code] ?? [])].filter(Boolean))];
}

// ── Data helpers ───────────────────────────────────────────────────────────
export function officialLanguages(code) {
  const primary = countriesExtra[code]?.language;
  return [...new Set([primary, ...(OFFICIAL_LANGUAGES[code] ?? [])].filter(Boolean))];
}

export const hasShape = (code) => Boolean(shapes[code]);
export const landNeighbours = (code) => landBorders[code] ?? [];
export const currenciesOf = (code) => FACTS[code]?.currencies ?? [];
/** Population (people) and area (km²) from the Wikidata refresh, with the population's year. */
export const population = (code) => FACTS[code]?.population ?? { value: countriesExtra[code].population * 1e6, year: null };
export const area = (code) => FACTS[code]?.area_km2 ?? countriesExtra[code].area;

export function poolFor(region) {
  return !region || region === "All" ? countries : countries.filter((c) => c.region === region);
}

const byCode = Object.fromEntries(countries.map((c) => [c.code, c]));
export const ALL_COUNTRY_SPELLINGS = countries.flatMap(countrySpellings);
const ALL_CAPITALS = countries.flatMap(capitalSpellings);
const ALL_LANGUAGES = [...new Set(Object.values(countriesExtra).map((x) => x.language))];
const ALL_CURRENCIES = [...new Set(countries.flatMap((c) => currenciesOf(c.code)))];

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

const listOf = (items, lang, max = 6) => {
  const fmt = new Intl.ListFormat(lang, { style: "long", type: "conjunction" });
  return items.length > max ? fmt.format([...items.slice(0, max), "…"]).replace(/,? (and|y|et) …$/, "…") : fmt.format(items);
};

function formatPeople(n, t, lang) {
  const m = n / 1e6;
  const fmt = (x, dp) => x.toLocaleString(lang, { maximumFractionDigits: dp });
  if (m >= 1000) return t.geo.billions(fmt(m / 1000, 2));
  if (m >= 1) return t.geo.millions(fmt(m, 1));
  return t.geo.thousands(fmt(Math.round(n / 1000), 0));
}

/** One-line fact card used as the explanation after most country questions. */
function countryCard(country, t, lang) {
  const pop = population(country.code);
  return t.geo.countryCard({
    country: localName(country, lang),
    capital: capitalName(country, lang),
    region: t.regions[country.region],
    population: formatPeople(pop.value, t, lang) + (pop.year ? ` (${pop.year})` : ""),
  });
}

// ── Question builders ──────────────────────────────────────────────────────
function build(type, country, settings, t) {
  const { difficulty, lang } = settings;
  const expert = difficulty === "expert";
  const name = localName(country, lang);
  const base = {
    key: `${type}:${country.code}`, type, correctLabel: name,
    source: learnMoreUrl({ name }, lang),
  };

  if (type === "flags") {
    const media = { kind: "flag", src: flagSrc(country.code), alt: "" };
    const common = { ...base, prompt: t.geo.flagPrompt, media, note: countryCard(country, t, lang), review: { title: t.geo.flagOf(name), flag: media.src } };
    if (expert) {
      return { ...common, kind: "text", accepted: countrySpellings(country), match: { exclude: ALL_COUNTRY_SPELLINGS }, placeholder: t.geo.typeCountry };
    }
    const opts = [country, ...countryDistractors(country, difficulty)].map((c) => ({
      id: c.code, label: localName(c, lang),
      whyNot: { text: t.geo.thisIsFlagOf(localName(c, lang)), media: { kind: "flag", src: flagSrc(c.code) } },
    }));
    return { ...common, ...choice(opts, country.code) };
  }

  if (type === "capitals") {
    const capital = capitalName(country, lang);
    const media = { kind: "flagThumb", src: flagSrc(country.code), alt: t.geo.flagOf(name) };
    const common = {
      ...base, correctLabel: capital, prompt: t.geo.capitalPrompt(name), media,
      note: countryCard(country, t, lang), review: { title: t.geo.capitalOf(name), flag: media.src },
    };
    if (expert) {
      return { ...common, kind: "text", accepted: capitalSpellings(country), match: { exclude: ALL_CAPITALS }, placeholder: t.geo.typeCapital };
    }
    const opts = [country, ...countryDistractors(country, difficulty, { keyOf: (c) => c.capital })].map((c) => ({
      id: c.code, label: capitalName(c, lang),
      whyNot: { text: t.geo.capitalIs(capitalName(c, lang), localName(c, lang)) },
    }));
    return { ...common, ...choice(opts, country.code) };
  }

  if (type === "shapes") {
    const media = { kind: "shape", d: shapes[country.code] };
    const common = { ...base, prompt: t.geo.shapePrompt, media, note: countryCard(country, t, lang), review: { title: t.geo.shapeOf(name), shape: media.d } };
    if (expert) {
      return { ...common, kind: "text", accepted: countrySpellings(country), match: { exclude: ALL_COUNTRY_SPELLINGS }, placeholder: t.geo.typeCountry };
    }
    const opts = [country, ...countryDistractors(country, difficulty, { eligible: (c) => hasShape(c.code) })].map((c) => ({
      id: c.code, label: localName(c, lang),
      whyNot: { text: t.geo.thisIsShapeOf(localName(c, lang)), media: { kind: "shape", d: shapes[c.code] } },
    }));
    return { ...common, ...choice(opts, country.code) };
  }

  if (type === "locate") {
    return {
      ...base, kind: "locate", prompt: t.geo.locatePrompt(name), code: country.code,
      region: settings.region, note: countryCard(country, t, lang), review: { title: t.geo.locatePrompt(name) },
    };
  }

  if (type === "languages") {
    const official = officialLanguages(country.code);
    if (!official.length) return null;
    const primary = official[0];
    const media = { kind: "flagThumb", src: flagSrc(country.code), alt: t.geo.flagOf(name) };
    const note = t.geo.officialLanguages(listOf(official.map((l) => languageName(l, lang)), lang));
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
    const spokenIn = (l) => countries.filter((c) => officialLanguages(c.code).includes(l)).map((c) => localName(c, lang));
    const opts = [primary, ...wrong].map((l) => ({
      id: l, label: languageName(l, lang),
      whyNot: { text: t.geo.languageSpokenIn(languageName(l, lang), listOf(spokenIn(l), lang, 4)) },
    }));
    return { ...common, ...choice(opts, primary) };
  }

  if (type === "neighbours") {
    const borders = landNeighbours(country.code);
    if (!borders.length) return null;
    const answer = byCode[shuffle(borders)[0]];
    const bordering = new Set(borders);
    const eligible = (c) => !bordering.has(c.code);
    // Hard: nearby countries that still don't touch; easy: anywhere else.
    const wrong = countryDistractors(country, difficulty === "easy" ? "easy" : "hard", { eligible }).filter((c) => c.code !== answer.code);
    const neighbourNames = borders.map((code) => localName(byCode[code], lang));
    const common = {
      ...base, correctLabel: localName(answer, lang), prompt: t.geo.neighbourPrompt(name),
      media: { kind: "flagThumb", src: flagSrc(country.code), alt: t.geo.flagOf(name) },
      note: t.geo.bordersList(name, listOf(neighbourNames, lang, 10)),
      review: { title: t.geo.neighbourPrompt(name), flag: flagSrc(country.code) },
    };
    if (expert) {
      return {
        ...common, kind: "text", correctLabel: listOf(neighbourNames, lang, 10),
        accepted: borders.flatMap((code) => countrySpellings(byCode[code])), match: { exclude: ALL_COUNTRY_SPELLINGS },
        placeholder: t.geo.typeCountry,
      };
    }
    const whyNot = (c) => {
      const theirs = landNeighbours(c.code).map((code) => localName(byCode[code], lang));
      return { text: theirs.length ? t.geo.doesNotBorder(localName(c, lang), name, listOf(theirs, lang, 6)) : t.geo.noLandBorders(localName(c, lang)) };
    };
    const opts = [answer, ...wrong.slice(0, 3)].map((c) => ({ id: c.code, label: localName(c, lang), whyNot: whyNot(c) }));
    return { ...common, ...choice(opts, answer.code) };
  }

  if (type === "currencies") {
    const own = currenciesOf(country.code);
    if (!own.length) return null;
    const answer = shuffle(own)[0];
    const usedIn = (code) => countries.filter((c) => currenciesOf(c.code).includes(code)).map((c) => localName(c, lang));
    const common = {
      ...base, correctLabel: currencyName(answer, lang), prompt: t.geo.currencyPrompt(name),
      media: { kind: "flagThumb", src: flagSrc(country.code), alt: t.geo.flagOf(name) },
      note: t.geo.currencyIs(name, listOf(own.map((c) => `${currencyName(c, lang)} (${c})`), lang)),
      review: { title: t.geo.currencyPrompt(name), flag: flagSrc(country.code) },
    };
    if (expert) {
      const spell = (code) => [code, currencyName(code, "en"), currencyName(code, "es"), currencyName(code, "fr")];
      return {
        ...common, kind: "text", accepted: own.flatMap(spell),
        match: { exclude: ALL_CURRENCIES.flatMap(spell) }, placeholder: t.geo.typeCurrency,
      };
    }
    const ownSet = new Set(own);
    const regional = [...new Set(countries.filter((c) => c.region === country.region).flatMap((c) => currenciesOf(c.code)))].filter((c) => !ownSet.has(c));
    const anywhere = ALL_CURRENCIES.filter((c) => !ownSet.has(c));
    const wrong = pickDistractors({ correctKey: answer, tiers: [{ items: difficulty === "easy" ? anywhere : regional }], fallback: anywhere });
    const opts = [answer, ...wrong].map((code) => ({
      id: code, label: currencyName(code, lang),
      whyNot: { text: t.geo.currencyUsedIn(currencyName(code, lang), listOf(usedIn(code), lang, 4)) },
    }));
    return { ...common, ...choice(opts, answer) };
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

const metric = (type, code) => (type === "population" ? population(code).value : area(code));

function buildCompare(type, a, b, settings, t) {
  const { lang } = settings;
  const label = (c) =>
    type === "population"
      ? formatPeople(metric(type, c.code), t, lang) + (population(c.code).year ? ` (${population(c.code).year})` : "")
      : `${Math.round(metric(type, c.code)).toLocaleString(lang)} km²`;
  const [winner, loser] = metric(type, a.code) > metric(type, b.code) ? [a, b] : [b, a];
  const ratio = metric(type, winner.code) / metric(type, loser.code);
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
    note: t.geo.timesMore(localName(winner, lang), localName(loser, lang), ratio.toLocaleString(lang, { maximumFractionDigits: ratio < 10 ? 1 : 0 }), type),
    source: type === "population" ? "https://www.wikidata.org/wiki/Property:P1082" : "https://www.wikidata.org/wiki/Property:P2046",
    review: { title: `${localName(a, lang)} ${t.vs} ${localName(b, lang)}` },
  };
}

/** Pick a partner for `a` whose ratio falls in the difficulty band (best effort). */
function comparePartner(a, pool, type, difficulty, used) {
  const [lo, hi] = RATIO_BANDS[difficulty] ?? RATIO_BANDS.medium;
  const va = metric(type, a.code);
  const candidates = pool.filter((b) => b.code !== a.code && !used.has(b.code) && metric(type, b.code) !== va);
  const inBand = candidates.filter((b) => {
    const vb = metric(type, b.code);
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
  if (type === "neighbours") return (c) => landNeighbours(c.code).length > 0;
  if (type === "currencies") return (c) => currenciesOf(c.code).length > 0;
  if (COMPARE_MODES.includes(type)) return (c) => metric(type, c.code) > 0;
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
