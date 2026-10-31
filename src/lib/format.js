// Display helpers.

export function formatYear(y, t) {
  if (y == null) return "?";
  if (y < 0) return t ? t.yearBC(Math.abs(y)) : `${Math.abs(y)} BC`;
  return String(y);
}

/** Parse "287 BC", "287BC", "-287", "1969" → number (BC negative). */
export function parseYear(input) {
  const s = String(input).trim().toLowerCase().replace(/\s+/g, " ");
  const bc = s.match(/^(\d+)\s*(bc|bce|a\.?\s*c\.?|av\.?\s*j\.?-?c\.?)$/);
  if (bc) return -parseInt(bc[1], 10);
  const ad = s.match(/^(-?\d+)\s*(ad|ce|d\.?\s*c\.?|ap\.?\s*j\.?-?c\.?)?$/);
  return ad ? parseInt(ad[1], 10) : NaN;
}

/** Math minus sign, used everywhere a negative number is printed in an expression. */
export function num(n) {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

/** "+ 5" / "− 5" for a signed term following another term. */
export function signedTerm(n) {
  return n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`;
}

/** "3x", "x", "−x", "−4x" */
export function coefX(a) {
  if (a === 1) return "x";
  if (a === -1) return "−x";
  return `${num(a)}x`;
}

/** Round to at most `dp` decimal places, removing float noise. */
export function roundTo(n, dp = 2) {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function formatNumber(n, lang = "en") {
  return Number(n).toLocaleString(lang);
}
