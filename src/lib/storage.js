// localStorage that never throws (private mode, disabled storage, SSR/tests).
const PREFIX = "quiz:";

export function load(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: settings simply won't persist */
  }
}

const bestKey = (subject, mode, difficulty) => `best:${subject}:${mode}:${difficulty}`;

export function getBest(subject, mode, difficulty) {
  return load(bestKey(subject, mode, difficulty), null);
}

/** Records a score; returns true if it is a new personal best. */
export function recordBest(subject, mode, difficulty, correct, total) {
  if (!total) return false;
  const pct = Math.round((correct / total) * 100);
  const prev = getBest(subject, mode, difficulty);
  if (prev && (prev.pct > pct || (prev.pct === pct && prev.correct >= correct))) return false;
  save(bestKey(subject, mode, difficulty), { pct, correct, total });
  return true;
}
