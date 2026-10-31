// Typed-answer matching shared by every "expert" question.

export function normalize(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Edit distance where an adjacent swap ("teh" → "the") counts as one edit (optimal string alignment). */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Allowed typos for an answer of this length. */
function tolerance(len) {
  if (len >= 10) return 2;
  if (len >= 5) return 1;
  return 0;
}

const STOP_PREFIXES = /^(the|el|la|los|las|le|les|l)\s+/;

/**
 * True if `input` matches any of `accepted`, ignoring case, accents,
 * punctuation, a leading article, and small typos.
 * With `surname: true`, the last word of a multi-word answer is also accepted
 * ("Einstein" for "Albert Einstein").
 * `exclude` lists other valid answers (e.g. every country name): an input that
 * exactly matches one of them is never accepted as a typo ("Zambia" ≠ "Gambia").
 */
export function matchesAnswer(input, accepted, { fuzzy = true, surname = false, exclude = [] } = {}) {
  const n = normalize(input).replace(STOP_PREFIXES, "");
  if (!n) return false;
  const exact = accepted.some((a) => normalize(a).replace(STOP_PREFIXES, "") === n);
  if (exact) return true;
  if (exclude.some((x) => normalize(x).replace(STOP_PREFIXES, "") === n)) return false;
  for (const answer of accepted) {
    const a = normalize(answer).replace(STOP_PREFIXES, "");
    if (!a) continue;
    if (n === a) return true;
    if (fuzzy && levenshtein(n, a) <= tolerance(a.length)) return true;
    if (surname) {
      const words = a.split(" ");
      const last = words[words.length - 1];
      if (words.length > 1 && last.length >= 4) {
        if (n === last || (fuzzy && levenshtein(n, last) <= tolerance(last.length))) return true;
      }
    }
  }
  return false;
}
