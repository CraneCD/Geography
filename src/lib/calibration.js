// Difficulty calibration from measured accuracy (src/data/generated/calibration.json,
// built by scripts/calibrate.mjs). Until enough answers are collected the file is empty
// and every function here is a no-op.
import data from "../data/generated/calibration.json";

const EASY_MIN = 0.75; // Easy rounds prefer questions most people get right…
const HARD_MAX = 0.55; // …Hard rounds prefer ones most people miss.
const MIN_POOL = 12;

/** Measured share of correct answers for a stats key, or null when unknown. */
export function accuracy(key, table = data) {
  return table[key]?.acc ?? null;
}

/**
 * Narrows a pool to items whose measured accuracy suits the difficulty. Items without data
 * stay in; if too few items would remain, the pool is returned unchanged.
 */
export function calibrate(items, keyOf, difficulty, table = data) {
  if (difficulty !== "easy" && difficulty !== "hard") return items;
  const fits = items.filter((x) => {
    const acc = accuracy(keyOf(x), table);
    if (acc == null) return true;
    return difficulty === "easy" ? acc >= EASY_MIN : acc <= HARD_MAX;
  });
  return fits.length >= Math.min(MIN_POOL, Math.ceil(items.length / 2)) ? fits : items;
}
