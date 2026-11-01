import { ANIMALS } from "../../data/science/animals.js";
import { ELEMENTS, COMMON_ELEMENTS } from "../../data/science/elements.js";
import { SPACE_OBJECTS } from "../../data/science/space.js";
import { BODY_REGIONS } from "../../data/science/body.js";
import { ANIMAL_NAMES, SPACE_NAMES, BODY_NAMES, ELEMENT_NAMES, localize, spellings } from "../../data/science/names.js";
import { hasImage, imageMedia } from "../../data/images.js";
import { factFor } from "../../data/science/facts.js";
import { learnMoreUrl } from "../../data/sources.js";
import { ELEMENT_STATE } from "../../data/science/traits.js";
import { PLANTS } from "../../data/science/plants.js";
import { traitsRound, systemsRound, missionsRound } from "./more.js";
import { shuffle, randInt, pickOne, pickDistractors } from "../../lib/random.js";

export const SCIENCE_MODES = [
  "animals-photo", "animals-compare", "animal-traits", "plants", "elements", "body", "body-systems", "space-photo", "space-compare", "space-missions",
];

// ── Shared helpers ─────────────────────────────────────────────────────────
/** `wrong`: labels, or { label, whyNot } explaining why that pick is wrong. */
function choiceOrText({ base, correct, wrong, expert, accepted, exclude, placeholder }) {
  if (expert) {
    return { ...base, kind: "text", accepted, match: { exclude }, placeholder };
  }
  const opts = [{ id: correct, label: correct }, ...wrong.map((w) => (typeof w === "string" ? { id: w, label: w } : { id: w.label, ...w }))];
  return { ...base, kind: "choice", options: shuffle(opts), correctId: correct };
}

// ── Photo identification (animals / space / body) ──────────────────────────
const animalName = (a, lang) => localize(ANIMAL_NAMES, a.id, a.name, lang);
const spaceName = (o, lang) => localize(SPACE_NAMES, o.id, o.name, lang);
const bodyName = (r, lang) => localize(BODY_NAMES, r.photoName ?? r.name, r.photoName ?? r.name, lang);

const LANG_IDX = { en: 0, es: 1, fr: 2 };

const PHOTO = {
  "animals-photo": {
    items: () => ANIMALS.filter(hasImage),
    pool(difficulty, items) {
      // Data is ordered roughly from familiar to obscure.
      const half = Math.ceil(items.length / 2);
      if (difficulty === "easy") return items.slice(0, half);
      if (difficulty === "hard") return items.slice(half - 4);
      return items;
    },
    name: animalName,
    accepted: (a) => spellings(ANIMAL_NAMES, a.id, a.name),
    promptKey: "animalPrompt",
    placeholderKey: "typeAnimal",
    note: (a, lang) => factFor(a, lang),
  },
  plants: {
    items: () => PLANTS.filter(hasImage),
    pool(difficulty, items) {
      // Data is ordered roughly from familiar to unusual.
      const half = Math.ceil(items.length / 2);
      if (difficulty === "easy") return items.slice(0, half);
      if (difficulty === "hard") return items.slice(half - 4);
      return items;
    },
    name: (p, lang) => p.name[LANG_IDX[lang] ?? 0],
    accepted: (p) => p.name,
    promptKey: "plantPrompt",
    placeholderKey: "typePlant",
    note: (p, lang) => p.fact[LANG_IDX[lang] ?? 0],
  },
  "space-photo": {
    items: () => SPACE_OBJECTS.filter(hasImage),
    pool(difficulty, items) {
      if (difficulty === "easy") return items.filter((o) => o.type === "planet");
      return items;
    },
    name: spaceName,
    accepted: (o) => spellings(SPACE_NAMES, o.id, o.name),
    promptKey: "spacePrompt",
    placeholderKey: "typeObject",
    note: (o, lang) => factFor(o, lang),
  },
  body: {
    items: () => dedupeBy(BODY_REGIONS.filter(hasImage), (r) => r.photoName ?? r.name),
    pool(difficulty, items) {
      if (difficulty === "easy") return items.filter((r) => r.dataset === "organs");
      if (difficulty === "hard") return items.filter((r) => r.dataset === "bones");
      return items;
    },
    name: bodyName,
    accepted: (r) => spellings(BODY_NAMES, r.photoName ?? r.name, r.photoName ?? r.name),
    promptKey: "bodyPrompt",
    placeholderKey: "typeBodyPart",
    note: (r, lang) => factFor(r, lang),
    // Distractors from the same dataset (organs vs bones) keep it fair.
    sameGroup: (a, b) => a.dataset === b.dataset,
  },
};

function dedupeBy(items, keyOf) {
  const seen = new Set();
  return items.filter((x) => (seen.has(keyOf(x)) ? false : seen.add(keyOf(x))));
}

function buildPhoto(mode, item, items, difficulty, t) {
  const cfg = PHOTO[mode];
  const lang = t.lang;
  const name = cfg.name(item, lang);
  const others = items.filter((x) => cfg.name(x, lang) !== name);
  const near = cfg.sameGroup ? others.filter((x) => cfg.sameGroup(x, item)) : others;
  const wrong = pickDistractors({ correctKey: name, tiers: [{ items: near }], fallback: others, keyOf: (x) => cfg.name(x, lang) })
    .map((x) => ({ label: cfg.name(x, lang), whyNot: { text: cfg.note(x, lang) ?? "", media: imageMedia(x, cfg.name(x, lang)) } }));
  return choiceOrText({
    base: {
      key: `${mode}:${item.id}`, type: mode, prompt: t.sci[cfg.promptKey],
      media: imageMedia(item, "?"), correctLabel: name, note: cfg.note(item, lang),
      source: learnMoreUrl({ wikiTitle: item.wikiTitle, name }, lang),
      review: { title: t.sci[cfg.promptKey] },
    },
    correct: name, wrong, expert: difficulty === "expert",
    accepted: cfg.accepted(item), exclude: items.flatMap(cfg.accepted), placeholder: t.sci[cfg.placeholderKey],
  });
}

function photoRound(mode, difficulty, count, t) {
  const cfg = PHOTO[mode];
  const items = cfg.items();
  // Sample without replacement: no repeats within a round.
  return shuffle(cfg.pool(difficulty, items)).slice(0, count).map((item) => buildPhoto(mode, item, items, difficulty, t));
}

// ── Comparisons (animals / space) ──────────────────────────────────────────
const COMPARE = {
  "animals-compare": {
    items: ANIMALS,
    metrics: { easy: ["weight_kg"], medium: ["weight_kg", "speed_kph"], hard: ["weight_kg", "speed_kph", "lifespan_years"] },
    name: animalName,
  },
  "space-compare": {
    items: SPACE_OBJECTS,
    metrics: { easy: ["diameter_km"], medium: ["diameter_km", "distanceFromSun_AU"], hard: ["diameter_km", "distanceFromSun_AU"] },
    name: spaceName,
  },
};

// Ratio bands: easy pairs are obviously different, hard pairs are close calls.
const BANDS = { easy: [3, Infinity], medium: [1.3, Infinity], hard: [1, 3], expert: [1, 1.8] };

function formatValue(v, lang) {
  const dp = v < 1 ? 4 : v < 10 ? 2 : 0;
  return v.toLocaleString(lang, { maximumFractionDigits: dp });
}

function buildCompare(mode, metric, a, b, t) {
  const cfg = COMPARE[mode];
  const lang = t.lang;
  const unit = t.sci.units[metric];
  const winner = a[metric] > b[metric] ? a : b;
  const loser = winner === a ? b : a;
  const ratio = winner[metric] / loser[metric];
  const x = ratio.toLocaleString(lang, { maximumFractionDigits: ratio < 10 ? 1 : 0 });
  return {
    key: `${mode}:${metric}:${[a.id, b.id].sort().join("-")}`,
    type: mode, kind: "compare", prompt: t.sci.metrics[metric],
    items: [a, b].map((x) => ({
      id: x.id, label: cfg.name(x, lang), value: `${formatValue(x[metric], lang)} ${unit}`,
      media: imageMedia(x, cfg.name(x, lang)),
    })),
    correctId: winner.id,
    verdicts: { correct: t.higher, other: t.lower },
    correctLabel: cfg.name(winner, lang),
    note: t.sci.ratioNote[metric](cfg.name(winner, lang), x, cfg.name(loser, lang)),
    review: { title: `${t.sci.metrics[metric]} ${cfg.name(a, lang)} ${t.vs} ${cfg.name(b, lang)}` },
  };
}

function compareRound(mode, difficulty, count, t) {
  const cfg = COMPARE[mode];
  const metrics = cfg.metrics[difficulty] ?? cfg.metrics.hard;
  const [lo, hi] = BANDS[difficulty] ?? BANDS.medium;
  const out = [];
  const keys = new Set();
  for (let attempts = 0; out.length < count && attempts < count * 30; attempts++) {
    const metric = pickOne(metrics);
    const pool = cfg.items.filter((x) => x[metric] > 0);
    const a = pickOne(pool);
    const partners = pool.filter((b) => {
      if (b === a || b[metric] === a[metric]) return false;
      const r = Math.max(a[metric], b[metric]) / Math.min(a[metric], b[metric]);
      return r >= lo && r <= hi;
    });
    if (!partners.length) continue;
    const q = buildCompare(mode, metric, ...shuffle([a, pickOne(partners)]), t);
    if (keys.has(q.key)) continue;
    keys.add(q.key);
    out.push(q);
  }
  return out;
}

// ── Elements ───────────────────────────────────────────────────────────────
const VARIANTS = {
  easy: ["symbol-to-name"],
  medium: ["name-to-number", "symbol-to-group", "symbol-to-name", "state"],
  hard: ["number-to-symbol", "category-to-element", "name-to-number", "state"],
  expert: ["name-to-symbol", "symbol-to-name", "number-to-symbol"],
};

const elementName = (e, lang) => localize(ELEMENT_NAMES, e.symbol, e.name, lang);
// Alternative English spellings accepted in typed answers.
const ELEMENT_ALIASES = { Al: ["Aluminum"], Cs: ["Cesium"], S: ["Sulphur"] };
const elementSpellings = (e) => [...spellings(ELEMENT_NAMES, e.symbol, e.name), ...(ELEMENT_ALIASES[e.symbol] ?? [])];

/** Elements asked at each difficulty: familiar ones first, the whole table on Hard. */
export function elementPool(difficulty) {
  if (difficulty === "easy") return ELEMENTS.filter((e) => e.atomicNumber <= 20 || COMMON_ELEMENTS.has(e.symbol));
  if (difficulty === "medium") return ELEMENTS.filter((e) => e.atomicNumber <= 56 || COMMON_ELEMENTS.has(e.symbol));
  return ELEMENTS;
}

const stateOf = (e) => (ELEMENT_STATE.gas.includes(e.symbol) ? "gas" : ELEMENT_STATE.liquid.includes(e.symbol) ? "liquid" : "solid");
const NOT_SOLID = ELEMENTS.filter((e) => stateOf(e) !== "solid");
const categoryOf = (e, t) => t.sci.categories[e.category] ?? e.category;
const elementCard = (e, t) => t.sci.elementCard({
  name: elementName(e, t.lang), symbol: e.symbol, number: e.atomicNumber, category: categoryOf(e, t), group: e.group,
});
const brief = (e, t) => ({ text: t.sci.elementBrief({ name: elementName(e, t.lang), symbol: e.symbol, number: e.atomicNumber }) });
const bySymbol = new Map(ELEMENTS.map((e) => [e.symbol, e]));
const byNumber = new Map(ELEMENTS.map((e) => [e.atomicNumber, e]));
// English article titles that are not simply the element's name.
const ELEMENT_ARTICLES = { Hg: "Mercury_(element)" };

/** Every element question explains the element and links to its article. */
export function buildElement(element, variant, difficulty, t) {
  const q = elementQuestion(element, variant, difficulty, t);
  return {
    ...q,
    note: elementCard(element, t),
    source: learnMoreUrl({ wikiTitle: ELEMENT_ARTICLES[element.symbol] ?? element.name, name: elementName(element, t.lang) }, t.lang),
  };
}

function elementQuestion(element, variant, difficulty, t) {
  const lang = t.lang;
  const name = elementName(element, lang);
  const expert = difficulty === "expert";
  const others = ELEMENTS.filter((e) => e.symbol !== element.symbol);
  const base = { key: `elements:${variant}:${element.symbol}`, type: "elements", review: {} };
  const cell = (show) => ({ kind: "element", number: show.number ? element.atomicNumber : null, symbol: show.symbol ? element.symbol : null });

  switch (variant) {
    case "symbol-to-name": {
      const wrong = pickDistractors({ correctKey: name, tiers: [{ items: others }], keyOf: (e) => elementName(e, lang) })
        .map((e) => ({ label: elementName(e, lang), whyNot: brief(e, t) }));
      return choiceOrText({
        base: { ...base, prompt: t.sci.symbolToName(element.symbol), media: cell({ symbol: true }), correctLabel: name, review: { title: t.sci.symbolToName(element.symbol) } },
        correct: name, wrong, expert,
        accepted: elementSpellings(element),
        exclude: ELEMENTS.flatMap(elementSpellings),
        placeholder: t.sci.typeElement,
      });
    }
    case "name-to-number": {
      const n = element.atomicNumber;
      const near = others.map((e) => e.atomicNumber).filter((x) => Math.abs(x - n) <= 6);
      const wrong = pickDistractors({ correctKey: n, tiers: [{ items: near }], fallback: others.map((e) => e.atomicNumber) });
      return {
        ...base, kind: "choice", prompt: t.sci.nameToNumber(name), correctLabel: String(n),
        options: shuffle([n, ...wrong].map((x) => ({ id: String(x), label: String(x), whyNot: x === n ? undefined : brief(byNumber.get(x), t) }))), correctId: String(n),
        review: { title: t.sci.nameToNumber(name) },
      };
    }
    case "symbol-to-group": {
      // Lanthanides and actinides have no group number: ask for the atomic number instead.
      if (element.group == null) return elementQuestion(element, "name-to-number", difficulty, t);
      const g = element.group;
      const groups = [...new Set(ELEMENTS.map((e) => e.group).filter((x) => x != null))];
      const wrong = pickDistractors({ correctKey: g, tiers: [{ items: groups }] });
      return {
        ...base, kind: "choice", prompt: t.sci.symbolToGroup(element.symbol), media: cell({ symbol: true, number: true }),
        correctLabel: t.sci.groupLabel(g), correctId: String(g),
        options: shuffle([g, ...wrong].map((x) => ({
          id: String(x), label: t.sci.groupLabel(x),
          whyNot: x === g ? undefined : {
            text: t.sci.groupMembers(x, new Intl.ListFormat(lang, { type: "conjunction" }).format(
              ELEMENTS.filter((e) => e.group === x).slice(0, 3).map((e) => `${elementName(e, lang)} (${e.symbol})`))),
          },
        }))),
        review: { title: t.sci.symbolToGroup(element.symbol) },
      };
    }
    case "number-to-symbol":
    case "name-to-symbol": {
      const prompt = variant === "number-to-symbol" ? t.sci.numberToSymbol(element.atomicNumber) : t.sci.nameToSymbol(name);
      if (expert) {
        return {
          ...base, kind: "text", prompt, correctLabel: element.symbol, placeholder: t.sci.typeSymbol,
          // Symbols are case-sensitive in chemistry, but accept any case for typing comfort.
          accepted: [element.symbol], match: { fuzzy: false },
          media: variant === "number-to-symbol" ? cell({ number: true }) : undefined,
          review: { title: prompt },
        };
      }
      const wrong = pickDistractors({ correctKey: element.symbol, tiers: [{ items: others.map((e) => e.symbol) }] });
      return {
        ...base, kind: "choice", prompt, correctLabel: element.symbol, correctId: element.symbol,
        media: variant === "number-to-symbol" ? cell({ number: true }) : undefined,
        options: shuffle([element.symbol, ...wrong].map((s) => ({ id: s, label: s, whyNot: s === element.symbol ? undefined : brief(bySymbol.get(s), t) }))),
        review: { title: prompt },
      };
    }
    case "category-to-element": {
      const category = t.sci.categories[element.category] ?? element.category;
      const wrongEls = pickDistractors({
        correctKey: element.symbol,
        tiers: [{ items: others.filter((e) => e.category !== element.category) }],
        keyOf: (e) => e.symbol,
      });
      return {
        ...base, kind: "choice", prompt: t.sci.categoryToElement(category), correctLabel: name, correctId: element.symbol,
        options: shuffle([element, ...wrongEls].map((e) => ({
          id: e.symbol, label: elementName(e, lang),
          whyNot: e === element ? undefined : { text: t.sci.isCategory(elementName(e, lang), categoryOf(e, t)) },
        }))),
        review: { title: t.sci.categoryToElement(category) },
      };
    }
    case "state": {
      const state = stateOf(element);
      if (state === "solid") return elementQuestion(element, "symbol-to-name", difficulty, t);
      const familiar = elementPool("medium");
      // "Which is a gas?" → solids as distractors; "which is a liquid?" → solids and gases.
      const wrongEls = pickDistractors({
        correctKey: element.symbol, keyOf: (e) => e.symbol,
        tiers: [{ items: familiar.filter((e) => (state === "gas" ? stateOf(e) === "solid" : stateOf(e) !== "liquid")) }],
      });
      const prompt = state === "gas" ? t.sci.stateGas : t.sci.stateLiquid;
      return {
        ...base, kind: "choice", prompt, correctLabel: name, correctId: element.symbol,
        options: shuffle([element, ...wrongEls].map((e) => ({
          id: e.symbol, label: elementName(e, lang),
          whyNot: e === element ? undefined : { text: t.sci.stateIs(elementName(e, lang), t.sci.states[stateOf(e)]) },
        }))),
        review: { title: prompt },
      };
    }
    default:
      return elementQuestion(element, "symbol-to-name", difficulty, t);
  }
}

function elementsRound(difficulty, count, t) {
  const variants = VARIANTS[difficulty] ?? VARIANTS.medium;
  const states = shuffle(NOT_SOLID);
  return shuffle(elementPool(difficulty)).slice(0, count).map((el, i) => {
    const variant = variants[i % variants.length];
    // The state question needs a gas or liquid as its answer.
    return buildElement(variant === "state" ? states.pop() ?? el : el, variant, difficulty, t);
  });
}

// ── Round builder ──────────────────────────────────────────────────────────
function roundFor(mode, difficulty, count, t) {
  if (PHOTO[mode]) return photoRound(mode, difficulty, count, t);
  if (COMPARE[mode]) return compareRound(mode, difficulty, count, t);
  if (mode === "elements") return elementsRound(difficulty, count, t);
  if (mode === "animal-traits") return traitsRound(difficulty, count, t);
  if (mode === "body-systems") return systemsRound(difficulty, count, t);
  if (mode === "space-missions") return missionsRound(difficulty, count, t);
  return [];
}

export function buildRound(settings, t) {
  const { mode, difficulty = "medium", roundSize: count = 10 } = settings;
  if (mode !== "science-mixed") return roundFor(mode, difficulty, count, t);

  // Mixed: draw a full round per sub-mode up front, then interleave without duplicates.
  const perMode = Object.fromEntries(SCIENCE_MODES.map((m) => [m, roundFor(m, difficulty, count, t)]));
  const out = [];
  for (let attempts = 0; out.length < count && attempts < count * 4; attempts++) {
    const mode = SCIENCE_MODES[randInt(0, SCIENCE_MODES.length - 1)];
    const q = perMode[mode].pop();
    if (q) out.push(q);
  }
  return out;
}
