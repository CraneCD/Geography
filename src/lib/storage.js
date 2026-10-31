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

// ── Activity: daily streak and total questions answered ───────────────────
function dayKey(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Record a finished round (call from an event handler, not during render). */
export function recordActivity(answered, now = new Date()) {
  const prev = load("activity", { days: [], answered: 0 });
  const days = [...new Set([...(prev.days ?? []), dayKey(now)])].sort().slice(-90);
  save("activity", { days, answered: (prev.answered ?? 0) + answered });
}

/** Consecutive days played, counting back from today (or yesterday if not yet played today). */
export function getActivity(now = new Date()) {
  const { days = [], answered = 0 } = load("activity", { days: [], answered: 0 });
  const played = new Set(days);
  const cursor = new Date(now);
  if (!played.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (played.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, answered };
}

/** Best percentage across a subject's modes at one difficulty, or null. */
export function getSubjectBest(subjectId, modes, difficulty) {
  const pcts = modes.map((m) => getBest(subjectId, m, difficulty)?.pct).filter((p) => p != null);
  return pcts.length ? Math.max(...pcts) : null;
}
