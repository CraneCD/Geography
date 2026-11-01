// Lightweight subject metadata (kept in the main bundle). Each subject's
// generators, data, and custom views are lazy-loaded via `load()`.

export const MIXABLE_MODES = ["flags", "capitals", "locate", "shapes", "languages", "neighbours", "currencies", "population", "area"];

export const SUBJECTS = [
  {
    id: "geography",
    modes: [...MIXABLE_MODES, "mixed"],
    options: ["region", "mixedModes"],
    load: () => import("./geography/index.jsx"),
  },
  {
    id: "history",
    modes: ["people", "who-first", "events", "inventions", "art", "history-mixed"],
    options: [],
    load: () => import("./history/index.js"),
  },
  {
    id: "logic",
    modes: ["arithmetic", "fractions", "sequences", "angle", "algebra", "clocks", "roman", "units", "word-problems", "puzzles", "logic-mixed"],
    options: [],
    load: () => import("./logic/index.jsx"),
  },
  {
    id: "science",
    modes: ["animals-photo", "animals-compare", "animal-traits", "elements", "body", "body-systems", "space-photo", "space-compare", "space-missions", "science-mixed"],
    options: [],
    load: () => import("./science/index.js"),
  },
];

export const findSubject = (id) => SUBJECTS.find((s) => s.id === id) ?? null;
