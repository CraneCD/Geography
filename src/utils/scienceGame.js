import { ANIMALS } from "../data/science/animals";
import { ELEMENTS } from "../data/science/elements";
import { SPACE_OBJECTS } from "../data/science/space";
import { BODY_REGIONS } from "../data/science/body";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n, exclude = []) {
  const excludeSet = new Set(exclude);
  const pool = arr.filter((x) => !excludeSet.has(x));
  return fisherYates(pool).slice(0, n);
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleChoices(correct, distractors) {
  return fisherYates([correct, ...distractors]);
}

// ---------------------------------------------------------------------------
// Animals-photo
// ---------------------------------------------------------------------------

function buildAnimalPhotoQuestion(animal, allAnimals) {
  const distractors = pickRandom(
    allAnimals.map((a) => a.name),
    3,
    [animal.name]
  );
  return {
    type: "animals-photo",
    wikiTitle: animal.wikiTitle,
    prompt: "What animal is this?",
    correct: { id: animal.id, name: animal.name },
    choices: shuffleChoices(animal.name, distractors),
  };
}

function buildAnimalsPhotoRound(difficulty, count) {
  // For easy, prefer animals that are common (we just use all and rely on data ordering).
  // For hard, prefer the latter half (more obscure).
  let pool = [...ANIMALS].filter((a) => a.wikiTitle);
  if (difficulty === "easy") pool = pool.slice(0, Math.ceil(pool.length / 2));
  else if (difficulty === "hard") pool = pool.slice(Math.floor(pool.length / 2));

  const selected = fisherYates(pool).slice(0, count);
  return selected.map((animal) => buildAnimalPhotoQuestion(animal, ANIMALS));
}

// ---------------------------------------------------------------------------
// Animals-compare
// ---------------------------------------------------------------------------

const COMPARE_METRICS = [
  { key: "weight_kg", label: "heavier" },
  { key: "speed_kph", label: "faster" },
  { key: "lifespan_years", label: "longer-lived" },
];

function buildAnimalsCompareQuestion(a, b, metric) {
  const valueA = a[metric.key];
  const valueB = b[metric.key];
  const correct = valueA > valueB ? "A" : "B";
  return {
    type: "animals-compare",
    metric: metric.key,
    metricLabel: metric.label,
    animalA: { id: a.id, name: a.name, wikiTitle: a.wikiTitle, value: valueA },
    animalB: { id: b.id, name: b.name, wikiTitle: b.wikiTitle, value: valueB },
    correct,
    prompt: `Which is ${metric.label}?`,
  };
}

function buildAnimalsCompareRound(difficulty, count) {
  const metrics =
    difficulty === "easy"
      ? [COMPARE_METRICS[0]]
      : difficulty === "hard"
      ? COMPARE_METRICS
      : COMPARE_METRICS.slice(0, 2);

  const questions = [];
  const shuffled = fisherYates(ANIMALS);
  let attempts = 0;

  while (questions.length < count && attempts < count * 10) {
    attempts++;
    const metric = pickOne(metrics);
    const pool = shuffled.filter(
      (a) => a[metric.key] != null && a[metric.key] > 0
    );
    if (pool.length < 2) continue;
    const [a, b] = fisherYates(pool).slice(0, 2);
    if (a[metric.key] === b[metric.key]) continue;
    questions.push(buildAnimalsCompareQuestion(a, b, metric));
  }
  return questions;
}

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

const ELEMENT_VARIANTS_BY_DIFFICULTY = {
  easy: ["symbol-to-name"],
  medium: ["name-to-number", "symbol-to-group"],
  hard: ["number-to-symbol", "category-to-element"],
};

function buildElementQuestion(element, allElements, variant) {
  switch (variant) {
    case "symbol-to-name": {
      const distractors = pickRandom(
        allElements.map((e) => e.name),
        3,
        [element.name]
      );
      const choices = shuffleChoices(element.name, distractors);
      return {
        type: "elements",
        variant,
        prompt: `The element symbol "${element.symbol}" belongs to which element?`,
        choices,
        answer: element.name,
      };
    }
    case "name-to-number": {
      const distractors = pickRandom(
        allElements.map((e) => String(e.atomicNumber)),
        3,
        [String(element.atomicNumber)]
      );
      const choices = shuffleChoices(String(element.atomicNumber), distractors);
      return {
        type: "elements",
        variant,
        prompt: `What is the atomic number of ${element.name}?`,
        choices,
        answer: String(element.atomicNumber),
      };
    }
    case "symbol-to-group": {
      const distractors = pickRandom(
        [...new Set(allElements.map((e) => String(e.group)).filter(Boolean))],
        3,
        [String(element.group)]
      );
      const choices = shuffleChoices(String(element.group), distractors);
      return {
        type: "elements",
        variant,
        prompt: `Which group does the element "${element.symbol}" belong to?`,
        choices,
        answer: String(element.group),
      };
    }
    case "number-to-symbol": {
      const distractors = pickRandom(
        allElements.map((e) => e.symbol),
        3,
        [element.symbol]
      );
      const choices = shuffleChoices(element.symbol, distractors);
      return {
        type: "elements",
        variant,
        prompt: `What is the symbol for the element with atomic number ${element.atomicNumber}?`,
        choices,
        answer: element.symbol,
      };
    }
    case "category-to-element": {
      const sameCategory = allElements.filter(
        (e) => e.category === element.category && e.atomicNumber !== element.atomicNumber
      );
      const distractors = pickRandom(
        allElements
          .filter((e) => e.category !== element.category)
          .map((e) => e.name),
        3,
        [element.name]
      );
      const choices = shuffleChoices(element.name, distractors);
      return {
        type: "elements",
        variant,
        prompt: `Which element belongs to the category "${element.category}"?`,
        choices,
        answer: element.name,
      };
    }
    default:
      return buildElementQuestion(element, allElements, "symbol-to-name");
  }
}

function buildElementsRound(difficulty, count) {
  const variants =
    ELEMENT_VARIANTS_BY_DIFFICULTY[difficulty] ||
    ELEMENT_VARIANTS_BY_DIFFICULTY["medium"];

  const selected = fisherYates(ELEMENTS).slice(0, count);
  return selected.map((element, i) => {
    const variant = variants[i % variants.length];
    return buildElementQuestion(element, ELEMENTS, variant);
  });
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

function buildBodyQuestion(region, pool) {
  const distractors = pickRandom(
    pool.map((r) => r.photoName ?? r.name),
    3,
    [region.photoName ?? region.name]
  );
  return {
    type: "body",
    wikiTitle: region.wikiTitle,
    prompt: "What body part is shown?",
    correct: { id: region.id, name: region.photoName ?? region.name, fact: region.fact },
    choices: shuffleChoices(region.photoName ?? region.name, distractors),
  };
}

function buildBodyRound(difficulty, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    let ds;
    if (difficulty === "easy") ds = "organs";
    else if (difficulty === "hard") ds = "bones";
    else ds = i % 2 === 0 ? "organs" : "bones";

    const pool = BODY_REGIONS.filter((r) => r.dataset === ds);
    if (pool.length === 0) continue;
    const region = pickOne(pool);
    questions.push(buildBodyQuestion(region, pool));
  }
  return questions;
}

// ---------------------------------------------------------------------------
// Space-photo
// ---------------------------------------------------------------------------

function buildSpacePhotoQuestion(obj, allObjects) {
  const distractors = pickRandom(
    allObjects.map((o) => o.name),
    3,
    [obj.name]
  );
  return {
    type: "space-photo",
    wikiTitle: obj.wikiTitle,
    prompt: "What is this celestial body?",
    correct: { id: obj.id, name: obj.name },
    choices: shuffleChoices(obj.name, distractors),
  };
}

function buildSpacePhotoRound(difficulty, count) {
  let pool = [...SPACE_OBJECTS].filter((o) => o.wikiTitle);
  if (difficulty === "easy") {
    pool = pool.filter((o) => o.type === "planet");
  } else if (difficulty === "hard") {
    pool = pool.filter((o) => o.type !== "planet");
  }
  const selected = fisherYates(pool).slice(0, count);
  return selected.map((obj) => buildSpacePhotoQuestion(obj, SPACE_OBJECTS));
}

// ---------------------------------------------------------------------------
// Space-compare
// ---------------------------------------------------------------------------

const SPACE_METRICS = [
  { key: "diameter_km", label: "larger" },
  { key: "distanceFromSun_AU", label: "farther from the Sun" },
];

function buildSpaceCompareQuestion(a, b, metric) {
  const valueA = a[metric.key];
  const valueB = b[metric.key];
  const correct = valueA > valueB ? "A" : "B";
  return {
    type: "space-compare",
    metric: metric.key,
    metricLabel: metric.label,
    objectA: { id: a.id, name: a.name, wikiTitle: a.wikiTitle, value: valueA },
    objectB: { id: b.id, name: b.name, wikiTitle: b.wikiTitle, value: valueB },
    correct,
    prompt: `Which is ${metric.label}?`,
  };
}

function buildSpaceCompareRound(difficulty, count) {
  const metrics =
    difficulty === "easy"
      ? [SPACE_METRICS[0]]
      : SPACE_METRICS;

  const questions = [];
  const shuffled = fisherYates(SPACE_OBJECTS);
  let attempts = 0;

  while (questions.length < count && attempts < count * 10) {
    attempts++;
    const metric = pickOne(metrics);
    const pool = shuffled.filter(
      (o) => o[metric.key] != null && o[metric.key] > 0
    );
    if (pool.length < 2) continue;
    const [a, b] = fisherYates(pool).slice(0, 2);
    if (a[metric.key] === b[metric.key]) continue;
    questions.push(buildSpaceCompareQuestion(a, b, metric));
  }
  return questions;
}

// ---------------------------------------------------------------------------
// Science-mixed
// ---------------------------------------------------------------------------

const PURE_MODES = [
  "animals-photo",
  "animals-compare",
  "elements",
  "body",
  "space-photo",
  "space-compare",
];

function buildMixedRound(difficulty, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const mode = pickOne(PURE_MODES);
    const q = buildScienceRound({ mode, difficulty, count: 1 });
    if (q.length > 0) questions.push(q[0]);
  }
  return questions;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildScienceRound({ mode, difficulty = "medium", count = 5, lang = "en" }) {
  switch (mode) {
    case "animals-photo":
      return buildAnimalsPhotoRound(difficulty, count);
    case "animals-compare":
      return buildAnimalsCompareRound(difficulty, count);
    case "elements":
      return buildElementsRound(difficulty, count);
    case "body":
      return buildBodyRound(difficulty, count);
    case "space-photo":
      return buildSpacePhotoRound(difficulty, count);
    case "space-compare":
      return buildSpaceCompareRound(difficulty, count);
    case "science-mixed":
      return buildMixedRound(difficulty, count);
    default:
      console.warn(`[scienceGame] Unknown mode "${mode}", falling back to science-mixed`);
      return buildMixedRound(difficulty, count);
  }
}
