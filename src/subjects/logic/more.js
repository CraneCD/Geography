// Logic & Numbers: everyday maths modes — clocks, Roman numerals, unit conversion,
// word problems (money, speed, probability) and ordering puzzles. Every multiple-choice
// distractor is a typical mistake and carries a "why not" note.
import { randInt, shuffle, pickOne } from "../../lib/random.js";
import { parseNumber, roundTo } from "../../lib/format.js";

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

let seq = 0;
const key = (type) => `${type}:x${++seq}`;
const fmt = (x, lang) => Number(x).toLocaleString(lang ?? "en", { maximumFractionDigits: 3, useGrouping: false });

/** Four options: the correct one plus the first three distinct wrong ones (then `fill`). */
function choice(base, correct, wrongs, fill) {
  const seen = new Set([correct.id]);
  const picked = [];
  const add = (w) => {
    if (picked.length < 3 && w && !seen.has(w.id)) { seen.add(w.id); picked.push(w); }
  };
  wrongs.forEach(add);
  for (let i = 0; picked.length < 3 && i < 50; i++) add(fill());
  return { ...base, kind: "choice", options: shuffle([correct, ...picked]), correctId: correct.id, correctLabel: correct.label };
}

function numeric(base, answer, label, t, { strip = /[^\d.,/−-]/g } = {}) {
  return {
    ...base, kind: "text", inputMode: "numeric", placeholder: t.logic.typeNumber, correctLabel: label,
    check: (input) => {
      const v = parseNumber(String(input).replace(strip, ""));
      return Number.isFinite(v) && Math.abs(v - answer) < 1e-6;
    },
  };
}

// ── Clocks ─────────────────────────────────────────────────────────────────
const wrap12 = (h) => ((((h - 1) % 12) + 12) % 12) + 1;
export const clockLabel = (h, m) => `${wrap12(h)}:${String(m).padStart(2, "0")}`;

/** Accepts "3:45", "3.45", "3h45", "15:45" (12-hour clock: 15:45 = 3:45). */
export function parseClock(input) {
  const m = String(input).trim().toLowerCase().match(/^(\d{1,2})\s*[:.h]\s*(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h > 24 || min > 59 ? null : { h: wrap12(h === 0 ? 12 : h), m: min };
}

export function generateClock(difficulty, t) {
  const h = randInt(1, 12);
  const m = difficulty === "easy" ? pickOne([0, 30]) : difficulty === "medium" ? randInt(0, 11) * 5 : randInt(0, 59);
  const base = { key: key("clocks"), type: "clocks", media: { kind: "clock", h, m } };
  const read = m === 0 ? t.logic.explOclock(h) : m % 5 === 0 ? t.logic.explClock(h, m / 5, m) : t.logic.explClockAny(h, m);

  if (difficulty === "expert") {
    const k = randInt(2, 30) * 5 + pickOne([0, 0, 3, 7]);
    const end = h * 60 + m + k;
    const eh = wrap12(Math.floor(end / 60)), em = end % 60;
    return {
      ...base, kind: "text", prompt: t.logic.clockLater(k), placeholder: t.logic.typeTime,
      correctLabel: clockLabel(eh, em),
      check: (input) => { const p = parseClock(input); return !!p && p.h === eh && p.m === em; },
      steps: [read, t.logic.explClockLater(clockLabel(h, m), k, clockLabel(eh, em))],
    };
  }

  const opt = (hh, mm, text) => ({ id: clockLabel(hh, mm), label: clockLabel(hh, mm), whyNot: { text } });
  const wrongs = [];
  // Swapped hands: reading the long hand as the hour.
  const sh = m === 0 ? 12 : Math.round(m / 5) || 12;
  wrongs.push(opt(sh, (h % 12) * 5, t.logic.clockSwapped));
  // Hour off by one (the short hand sits between two numbers).
  wrongs.push(opt(m >= 30 ? h + 1 : h - 1, m, m === 0 ? t.logic.clockShortAt(h) : t.logic.clockHour(h, wrap12(h + 1))));
  // Long hand pointing at 4 read as "4 minutes".
  if (m % 5 === 0 && m >= 10) wrongs.push(opt(h, m / 5, t.logic.clockMinuteNumber(m / 5, m)));
  const step = { easy: 15, medium: 5 }[difficulty] ?? randInt(1, 3);
  for (const d of shuffle([step, -step])) if (m + d >= 0 && m + d < 60) wrongs.push(opt(h, m + d, m === 0 ? t.logic.clockAtTwelve : t.logic.clockMinutes(m)));
  return choice(
    { ...base, prompt: t.logic.clockPrompt, explanation: read },
    { id: clockLabel(h, m), label: clockLabel(h, m) }, shuffle(wrongs),
    () => opt(randInt(1, 12), difficulty === "easy" ? pickOne([0, 30]) : randInt(0, 11) * 5, t.logic.clockIs(clockLabel(h, m))),
  );
}

// ── Roman numerals ─────────────────────────────────────────────────────────
const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const ADDITIVE = ROMAN.filter(([, s]) => s.length === 1);
const VALUE = Object.fromEntries(ADDITIVE.map(([v, s]) => [s, v]));

function romanParts(n, table = ROMAN) {
  const parts = [];
  for (const [v, s] of table) while (n >= v) { parts.push([s, v]); n -= v; }
  return parts;
}
/** "XXX (30)" instead of "X (10) + X (10) + X (10)" in explanations. */
function groupedParts(n) {
  const groups = [];
  for (const [s, v] of romanParts(n)) {
    const last = groups.at(-1);
    // Only runs of one repeated symbol (III, XX, MMM) are merged; IX, XC… stay separate.
    if (last && s.length === 1 && last[0].replaceAll(s, "") === "") { last[0] += s; last[1] += v; }
    else groups.push([s, v]);
  }
  return groups;
}
export const toRoman = (n) => romanParts(n).map(([s]) => s).join("");
const additiveRoman = (n) => romanParts(n, ADDITIVE).map(([s]) => s).join("");
/** Strict: only canonical numerals are valid (IIII → NaN). */
export function fromRoman(s) {
  const str = String(s).trim().toUpperCase();
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const v = VALUE[str[i]], next = VALUE[str[i + 1]] ?? 0;
    if (!v) return NaN;
    total += v < next ? -v : v;
  }
  return total > 0 && toRoman(total) === str ? total : NaN;
}
/** Adding every symbol, ignoring the subtraction rule (IX → 11). */
const naiveRead = (s) => [...s].reduce((a, c) => a + VALUE[c], 0);

const ROMAN_RANGE = { easy: [1, 20], medium: [20, 100], hard: [100, 3999], expert: [1, 3999] };

export function generateRoman(difficulty, t) {
  const [lo, hi] = ROMAN_RANGE[difficulty] ?? ROMAN_RANGE.medium;
  const n = randInt(lo, hi);
  const numeral = toRoman(n);
  const explanation = t.logic.explRoman(numeral, groupedParts(n).map(([s, v]) => `${s} (${v})`).join(" + "), n);
  const toNumber = Math.random() < 0.5;
  const base = { key: key("roman"), type: "roman", explanation };
  const near = () => Math.max(1, n + pickOne([-1, 1, -2, 2, -5, 5, -10, 10, -50, 50, -100, 100].filter((d) => Math.abs(d) < hi)));

  if (toNumber) {
    const q = { ...base, prompt: t.logic.romanToNumber, expression: numeral };
    if (difficulty === "expert") return numeric(q, n, String(n), t);
    const wrongs = [];
    const naive = naiveRead(numeral);
    if (naive !== n) wrongs.push({ id: String(naive), label: String(naive), whyNot: { text: t.logic.romanSubtract } });
    const fill = () => { const x = near(); return { id: String(x), label: String(x), whyNot: { text: t.logic.romanIsNumber(toRoman(x), x) } }; };
    return choice(q, { id: String(n), label: String(n) }, wrongs, fill);
  }

  const q = { ...base, prompt: t.logic.numberToRoman(n) };
  if (difficulty === "expert") {
    return {
      ...q, kind: "text", placeholder: t.logic.typeRoman, correctLabel: numeral,
      check: (input) => String(input).trim().toUpperCase() === numeral,
    };
  }
  const wrongs = [];
  const additive = additiveRoman(n);
  if (additive !== numeral) wrongs.push({ id: additive, label: additive, whyNot: { text: t.logic.romanSubtractive } });
  const fill = () => { const x = near(); return { id: toRoman(x), label: toRoman(x), whyNot: { text: t.logic.romanIsNumber(toRoman(x), x) } }; };
  return choice(q, { id: numeral, label: numeral }, wrongs, fill);
}

// ── Unit conversion ────────────────────────────────────────────────────────
const CONVERSIONS = [
  ["km", "m", 1000], ["m", "cm", 100], ["cm", "mm", 10], ["m", "mm", 1000], ["kg", "g", 1000],
  ["t", "kg", 1000], ["L", "mL", 1000], ["h", "min", 60], ["min", "s", 60], ["d", "h", 24],
];
const TWO_STEP = [["h", "s", 3600], ["km", "cm", 100000], ["d", "min", 1440], ["kg", "mg", 1000000]];
// Plausible wrong factors: metric units get confused with each other, time units likewise.
const isTime = (u) => ["h", "min", "s", "d"].includes(u);
const FACTORS = { metric: [10, 100, 1000, 10000], time: [60, 24, 100, 3600] };

export function generateUnits(difficulty, t) {
  const lang = t.lang;
  const unit = (u) => t.logic.unitNames?.[u] ?? u;
  const base = { key: key("units"), type: "units", prompt: t.logic.convertPrompt };

  if (difficulty === "expert" && Math.random() < 0.3) {
    const c = randInt(-8, 20) * 5;
    const f = c * 9 / 5 + 32;
    return numeric(
      { ...base, expression: `${fmt(c, lang)} °C = ? °F`, explanation: t.logic.explFahrenheit(fmt(c, lang), fmt(f, lang)) },
      f, fmt(f, lang), t,
    );
  }

  const [from, to, factor] = pickOne(difficulty === "expert" ? TWO_STEP : CONVERSIONS);
  // Easy: big → small unit only (multiply). Otherwise either direction.
  const down = difficulty === "easy" || Math.random() < 0.5;
  let value;
  if (difficulty === "easy") value = randInt(1, 12);
  else if (difficulty === "medium") value = down ? randInt(1, 20) : randInt(1, 20) * factor;
  else value = down ? randInt(1, 99) / 10 : randInt(1, 99) * factor / 10;
  value = roundTo(value, 3);
  const [a, b] = down ? [from, to] : [to, from];
  const answer = roundTo(down ? value * factor : value / factor, 6);
  const q = {
    ...base, expression: `${fmt(value, lang)} ${unit(a)} = ? ${unit(b)}`,
    explanation: t.logic.explConvert(unit(from), factor, unit(to), fmt(value, lang), fmt(answer, lang), down, unit(a), unit(b)),
  };
  if (difficulty === "hard" || difficulty === "expert") return numeric(q, answer, fmt(answer, lang), t);

  const opt = (x, text) => ({ id: String(roundTo(x, 6)), label: fmt(x, lang), whyNot: { text } });
  const wrongs = [opt(down ? value / factor : value * factor, down ? t.logic.unitSmaller : t.logic.unitBigger)];
  for (const f of shuffle(FACTORS[isTime(from) ? "time" : "metric"].filter((f) => f !== factor))) {
    wrongs.push(opt(down ? value * f : value / f, t.logic.unitFactor(unit(from), factor, unit(to))));
  }
  return choice(q, { id: String(answer), label: fmt(answer, lang) }, wrongs, () => opt(answer + randInt(1, 9), t.logic.unitFactor(unit(from), factor, unit(to))));
}

// ── Word problems ──────────────────────────────────────────────────────────
const NAMES = ["Ana", "Ben", "Chen", "Dara", "Eli", "Femi", "Gia", "Hugo", "Ines", "Kofi", "Lena", "Omar", "Priya", "Sami", "Yuki", "Zoe"];

const fraction = (n, d) => {
  const g = gcd(n, d) || 1;
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};

const WORD = {
  change(lvl, t) {
    const name = pickOne(NAMES);
    const n = randInt(lvl === 0 ? 1 : 2, [3, 5, 8][lvl]);
    const p = lvl === 0 ? randInt(1, 3) : lvl === 1 ? randInt(2, 8) / 2 : randInt(20, 180) / 20;
    const cost = roundTo(n * p);
    const bill = [5, 10, 20, 50, 100].find((b) => b > cost);
    const ans = roundTo(bill - cost);
    const $ = t.logic.money;
    return {
      prompt: t.logic.wpChange(name, n, $(p), $(bill)), answer: ans, money: true,
      steps: [`${n} × ${$(p)} = ${$(cost)}`, `${$(bill)} − ${$(cost)} = ${$(ans)}`],
      wrongs: [
        [cost, t.logic.wpForgotChange($(bill))],
        n > 1 && [roundTo(bill - p), t.logic.wpForgotQty(name, n)],
        [roundTo(ans + 1), t.logic.wpCheck(`${$(bill)} − ${$(cost)}`)],
        [roundTo(Math.max(0.5, ans - 1)), t.logic.wpCheck(`${$(bill)} − ${$(cost)}`)],
      ],
    };
  },
  unitPrice(lvl, t) {
    const n = randInt(2, [5, 9, 12][lvl]);
    const each = lvl === 0 ? randInt(1, 5) : randInt(2, 30) / 2;
    const total = roundTo(n * each);
    const $ = t.logic.money;
    return {
      prompt: t.logic.wpUnitPrice(n, $(total)), answer: each, money: true,
      steps: [`${$(total)} ÷ ${n} = ${$(each)}`],
      wrongs: [
        [roundTo(total - n), t.logic.wpDivide],
        [roundTo(total * n), t.logic.wpDivide],
        [roundTo(each + 1), t.logic.wpCheck(`${$(total)} ÷ ${n}`)],
        [roundTo(Math.max(0.5, each - 0.5)), t.logic.wpCheck(`${$(total)} ÷ ${n}`)],
      ],
    };
  },
  discount(lvl, t) {
    const price = randInt(2, [10, 20, 40][lvl]) * 5;
    const d = lvl === 0 ? pickOne([10, 20, 25, 50]) : randInt(1, [8, 16, 18][lvl]) * 5;
    const off = roundTo((price * d) / 100);
    const ans = roundTo(price - off);
    const $ = t.logic.money;
    return {
      prompt: t.logic.wpDiscount($(price), d), answer: ans, money: true,
      steps: [`${d}% × ${$(price)} = ${$(off)}`, `${$(price)} − ${$(off)} = ${$(ans)}`],
      wrongs: [
        [off, t.logic.wpDiscountItself],
        d !== off && [price - d, t.logic.wpPercentNotUnits(d)],
        [roundTo(price + off), t.logic.wpAddedDiscount],
      ],
    };
  },
  speed(lvl, t) {
    const v = randInt(3, 24) * 5;
    const minutes = lvl === 0 ? randInt(1, 4) * 60 : lvl === 1 ? pickOne([30, 60, 90, 120, 150, 180]) : pickOne([15, 20, 40, 45, 75, 90, 100]);
    const d = roundTo((v * minutes) / 60);
    const hours = roundTo(minutes / 60, 4);
    const time = minutes % 60 === 0 ? t.logic.hours(minutes / 60) : t.logic.minutes(minutes);
    return {
      prompt: t.logic.wpSpeed(d, time), answer: v,
      steps: [minutes % 60 === 0 ? null : t.logic.minutesToHours(minutes, roundTo(hours, 3)), `${d} km ÷ ${roundTo(hours, 3)} h = ${v} km/h`].filter(Boolean),
      wrongs: [
        [roundTo(d * hours), t.logic.wpSpeedFormula],
        minutes % 60 !== 0 && [roundTo(d / minutes), t.logic.wpSpeedMinutes],
        [v + 5, t.logic.wpCheck(`${d} ÷ ${roundTo(hours, 3)}`)],
        [v - 5, t.logic.wpCheck(`${d} ÷ ${roundTo(hours, 3)}`)],
      ],
    };
  },
  dice(lvl, t) {
    const k = randInt(1, 5);
    const fav = 6 - k;
    return {
      prompt: t.logic.wpDice(k), answer: fav / 6, label: fraction(fav, 6), fraction: true,
      steps: [t.logic.wpOutcomes(Array.from({ length: fav }, (_, i) => k + 1 + i).join(", "), fav), fraction(fav, 6) === `${fav}/6` ? null : `${fav}/6 = ${fraction(fav, 6)}`].filter(Boolean),
      wrongs: [
        [fraction(fav + 1, 6), t.logic.wpStrict(k)],
        [fraction(k, 6), t.logic.wpComplement(k)],
        fav > 1 && [fraction(1, 6), t.logic.wpOutcomes(Array.from({ length: fav }, (_, i) => k + 1 + i).join(", "), fav)],
        [fraction(1, 2), t.logic.wpOutcomes(Array.from({ length: fav }, (_, i) => k + 1 + i).join(", "), fav)],
      ],
    };
  },
  marbles(lvl, t) {
    let r, b;
    do { r = randInt(1, [5, 9, 15][lvl]); b = randInt(1, [5, 9, 15][lvl]); } while (r === b);
    return {
      prompt: t.logic.wpMarbles(r, b), answer: r / (r + b), label: fraction(r, r + b), fraction: true,
      steps: [`${r} + ${b} = ${r + b}`, `${r}/${r + b}${fraction(r, r + b) === `${r}/${r + b}` ? "" : ` = ${fraction(r, r + b)}`}`],
      wrongs: [
        [fraction(r, b), t.logic.wpTotal(r + b)],
        [fraction(b, r + b), t.logic.wpOtherColour],
        [fraction(1, 2), t.logic.wpNotEqual],
      ],
    };
  },
};
const WORD_KINDS = { easy: ["change", "unitPrice", "dice"], medium: Object.keys(WORD), hard: Object.keys(WORD), expert: Object.keys(WORD) };

export function generateWordProblem(difficulty, t, kind = pickOne(WORD_KINDS[difficulty] ?? WORD_KINDS.medium)) {
  const lvl = { easy: 0, medium: 1 }[difficulty] ?? 2;
  const p = WORD[kind](lvl, t);
  const label = (x) => (typeof x === "string" ? x : p.money ? t.logic.money(x) : String(x));
  const base = { key: key("word-problems"), type: "word-problems", variant: kind, prompt: p.prompt, steps: p.steps };
  const correct = p.label ?? label(p.answer);
  if (difficulty === "hard" || difficulty === "expert") {
    const q = numeric(base, p.answer, correct, t);
    return p.fraction ? { ...q, inputMode: "fraction", placeholder: t.logic.typeFraction } : q;
  }
  const wrongs = p.wrongs.filter(Boolean)
    .filter(([x]) => typeof x === "string" || (x > 0 && Math.abs(x - p.answer) > 1e-9))
    .map(([x, text]) => ({ id: label(x), label: label(x), whyNot: { text } }));
  const fill = () => {
    const x = p.fraction ? fraction(randInt(1, 5), 6) : roundTo(p.answer + randInt(1, 6) * (p.money ? 0.5 : 1));
    return { id: label(x), label: label(x), whyNot: { text: t.logic.wpCheck(p.steps.at(-1)) } };
  };
  return choice(base, { id: correct, label: correct }, wrongs, fill);
}

// ── Ordering puzzles ───────────────────────────────────────────────────────
const RELATIONS = ["tall", "old", "fast"];

export function generatePuzzle(difficulty, t) {
  const n = { easy: 3, medium: 4 }[difficulty] ?? 5;
  const rel = t.logic.rel[pickOne(RELATIONS)];
  const order = shuffle(NAMES).slice(0, n); // order[0] is the "most"
  const lines = shuffle(order.slice(0, -1).map((a, i) => {
    const b = order[i + 1];
    // Mix "taller" and "shorter" phrasing so the chain has to be reasoned out.
    return Math.random() < 0.5 ? rel.more(a, b) : rel.less(b, a);
  }));
  const ask = difficulty === "expert" ? "second" : pickOne(["most", "least"]);
  const answer = ask === "most" ? order[0] : ask === "least" ? order[n - 1] : order[1];
  const explanation = rel.order(order.join(" › "));
  const whyNot = (x) => {
    const i = order.indexOf(x);
    if (ask === "most") return rel.more(order[i - 1], x);
    if (ask === "least") return rel.more(x, order[i + 1]);
    return explanation;
  };
  const others = shuffle(order.filter((x) => x !== answer)).slice(0, 3);
  return {
    key: key("puzzles"), type: "puzzles", kind: "choice", prompt: rel[ask],
    media: { kind: "statements", lines }, explanation,
    options: shuffle([answer, ...others]).map((x) => ({ id: x, label: x, whyNot: x === answer ? undefined : { text: whyNot(x) } })),
    correctId: answer, correctLabel: answer,
  };
}
