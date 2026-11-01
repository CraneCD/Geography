import { ANIMALS } from "../../data/science/animals.js";
import { ELEMENTS, COMMON_ELEMENTS } from "../../data/science/elements.js";
import { SPACE_OBJECTS } from "../../data/science/space.js";
import { BODY_REGIONS } from "../../data/science/body.js";
import { ANIMAL_NAMES, SPACE_NAMES, BODY_NAMES, ELEMENT_NAMES, localize, spellings } from "../../data/science/names.js";
import { hasImage, imageMedia } from "../../data/images.js";
import { shuffle, randInt, pickOne, pickDistractors } from "../../lib/random.js";

export const SCIENCE_MODES = ["animals-photo", "animals-compare", "elements", "body", "space-photo", "space-compare"];

// ── Shared helpers ─────────────────────────────────────────────────────────
function choiceOrText({ base, correct, wrong, expert, accepted, exclude, placeholder }) {
  if (expert) {
    return { ...base, kind: "text", accepted, match: { exclude }, placeholder };
  }
  const opts = [correct, ...wrong].map((label) => ({ id: label, label }));
  return { ...base, kind: "choice", options: shuffle(opts), correctId: correct };
}

// ── Photo identification (animals / space / body) ──────────────────────────
const animalName = (a, lang) => localize(ANIMAL_NAMES, a.id, a.name, lang);
const spaceName = (o, lang) => localize(SPACE_NAMES, o.id, o.name, lang);
const bodyName = (r, lang) => localize(BODY_NAMES, r.photoName ?? r.name, r.photoName ?? r.name, lang);

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
    note: (a) => a.fact,
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
    note: (o) => o.fact,
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
    note: (r) => r.fact,
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
    .map((x) => cfg.name(x, lang));
  return choiceOrText({
    base: {
      key: `${mode}:${item.id}`, type: mode, prompt: t.sci[cfg.promptKey],
      media: imageMedia(item, "?"), correctLabel: name, note: cfg.note(item),
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
  medium: ["name-to-number", "symbol-to-group", "symbol-to-name"],
  hard: ["number-to-symbol", "category-to-element", "name-to-number"],
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

export function buildElement(element, variant, difficulty, t) {
  const lang = t.lang;
  const name = elementName(element, lang);
  const expert = difficulty === "expert";
  const others = ELEMENTS.filter((e) => e.symbol !== element.symbol);
  const base = { key: `elements:${variant}:${element.symbol}`, type: "elements", review: {} };
  const cell = (show) => ({ kind: "element", number: show.number ? element.atomicNumber : null, symbol: show.symbol ? element.symbol : null });

  switch (variant) {
    case "symbol-to-name": {
      const wrong = pickDistractors({ correctKey: name, tiers: [{ items: others.map((e) => elementName(e, lang)) }] });
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
        options: shuffle([n, ...wrong].map((x) => ({ id: String(x), label: String(x) }))), correctId: String(n),
        review: { title: t.sci.nameToNumber(name) },
      };
    }
    case "symbol-to-group": {
      // Lanthanides and actinides have no group number: ask for the atomic number instead.
      if (element.group == null) return buildElement(element, "name-to-number", difficulty, t);
      const g = element.group;
      const groups = [...new Set(ELEMENTS.map((e) => e.group).filter((x) => x != null))];
      const wrong = pickDistractors({ correctKey: g, tiers: [{ items: groups }] });
      return {
        ...base, kind: "choice", prompt: t.sci.symbolToGroup(element.symbol), media: cell({ symbol: true, number: true }),
        correctLabel: t.sci.groupLabel(g), correctId: String(g),
        options: shuffle([g, ...wrong].map((x) => ({ id: String(x), label: t.sci.groupLabel(x) }))),
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
        options: shuffle([element.symbol, ...wrong].map((s) => ({ id: s, label: s }))),
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
        options: shuffle([element, ...wrongEls].map((e) => ({ id: e.symbol, label: elementName(e, lang) }))),
        review: { title: t.sci.categoryToElement(category) },
      };
    }
    default:
      return buildElement(element, "symbol-to-name", difficulty, t);
  }
}

function elementsRound(difficulty, count, t) {
  const variants = VARIANTS[difficulty] ?? VARIANTS.medium;
  return shuffle(elementPool(difficulty)).slice(0, count).map((el, i) => buildElement(el, variants[i % variants.length], difficulty, t));
}

// ── Round builder ──────────────────────────────────────────────────────────
function roundFor(mode, difficulty, count, t) {
  if (PHOTO[mode]) return photoRound(mode, difficulty, count, t);
  if (COMPARE[mode]) return compareRound(mode, difficulty, count, t);
  if (mode === "elements") return elementsRound(difficulty, count, t);
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
