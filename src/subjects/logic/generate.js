import { randInt, shuffle, pickOne } from "../../lib/random.js";
import { num, signedTerm, coefX, roundTo, parseNumber } from "../../lib/format.js";
import { generateClock, generateRoman, generateUnits, generateWordProblem, generatePuzzle } from "./more.js";

export { parseNumber };

export const LOGIC_MODES = ["arithmetic", "fractions", "sequences", "angle", "algebra", "clocks", "roman", "units", "word-problems", "puzzles"];

// ── Helpers ────────────────────────────────────────────────────────────────
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function simplifyFraction(n, d) {
  const g = gcd(n, d) || 1;
  let sn = n / g;
  let sd = d / g;
  if (sd < 0) { sn = -sn; sd = -sd; }
  return [sn, sd];
}

function fractionString(n, d) {
  const [sn, sd] = simplifyFraction(n, d);
  return sd === 1 ? String(sn) : `${sn}/${sd}`;
}

const numericCheck = (answer) => (input) => {
  const v = parseNumber(input);
  return Number.isFinite(v) && Math.abs(v - answer) < 1e-6;
};

function numericQuestion(base, answer, t, extra = {}) {
  return {
    ...base, kind: "text", inputMode: "numeric", placeholder: t.logic.typeNumber,
    correctLabel: num(answer), check: numericCheck(answer), ...extra,
  };
}

let seq = 0;
const key = (type) => `${type}:${++seq}`;

// ── Arithmetic ─────────────────────────────────────────────────────────────
const RANGES = {
  easy: { add: [1, 9], mul: [2, 5], quot: [2, 5] },
  medium: { add: [10, 99], mul: [2, 9], quot: [2, 9] },
  hard: { add: [100, 999], mul: [6, 25], quot: [3, 25] },
  expert: { add: [100, 9999], mul: [11, 99], quot: [6, 40] },
};

export function generateArithmetic(difficulty, t) {
  const r = RANGES[difficulty] ?? RANGES.medium;
  const base = { key: key("arithmetic"), type: "arithmetic" };

  // Expert: two-step expression respecting operator precedence, a ± b × c or a ± b ÷ c.
  if (difficulty === "expert" && Math.random() < 0.4) {
    const op2 = pickOne(["×", "÷"]);
    const c = randInt(2, 12);
    const b = op2 === "×" ? randInt(2, 30) : c * randInt(2, 30);
    const part = op2 === "×" ? b * c : b / c;
    const a = randInt(10, 999);
    const op1 = a >= part && Math.random() < 0.5 ? "−" : "+";
    const answer = op1 === "+" ? a + part : a - part;
    return numericQuestion(
      { ...base, prompt: t.logic.compute, expression: `${a} ${op1} ${b} ${op2} ${c} = ?`,
        explanation: t.logic.explThen(`${b} ${op2} ${c} = ${part}`, `${a} ${op1} ${part} = ${answer}`) },
      answer, t,
    );
  }

  const ops = difficulty === "easy" ? ["+", "−"] : ["+", "−", "×", "÷"];
  const op = pickOne(ops);
  let a, b, answer;
  if (op === "+") {
    a = randInt(...r.add); b = randInt(...r.add); answer = a + b;
  } else if (op === "−") {
    a = randInt(...r.add); b = randInt(...r.add);
    if (a === b) a += randInt(1, 9);
    if (a < b) [a, b] = [b, a];
    answer = a - b;
  } else if (op === "×") {
    a = randInt(...r.mul); b = randInt(...r.mul); answer = a * b;
  } else {
    // Divisor and quotient drawn independently from the same range → every quotient equally likely.
    b = randInt(...r.mul);
    answer = randInt(...r.quot);
    a = b * answer;
  }
  return numericQuestion(
    { ...base, prompt: t.logic.compute, expression: `${a} ${op} ${b} = ?`, explanation: `${a} ${op} ${b} = ${answer}` },
    answer, t,
  );
}

// ── Fractions & percentages ────────────────────────────────────────────────
export function generateFraction(difficulty, t, variant = pickOne(["percentage", "simplify", "compare"])) {
  if (variant === "percentage") {
    let percent, base;
    if (difficulty === "easy") { percent = randInt(1, 9) * 10; base = randInt(1, 10) * 10; }
    else if (difficulty === "medium") { percent = randInt(1, 19) * 5; base = randInt(1, 20) * 4; }
    else if (difficulty === "hard") { percent = randInt(1, 99); base = randInt(2, 200); }
    else { percent = randInt(101, 400); base = randInt(2, 500); }
    // percent and base are integers, so the exact answer has at most 2 decimals.
    const answer = roundTo((percent * base) / 100, 2);
    return numericQuestion(
      { key: key("fractions"), type: "fractions", variant, prompt: t.logic.percentOf(percent, base),
        explanation: t.logic.explPercent(percent, base, answer) },
      answer, t,
    );
  }

  if (variant === "simplify") {
    const maxD = { easy: 12, medium: 30, hard: 60, expert: 120 }[difficulty] ?? 30;
    let n, d;
    do {
      d = randInt(4, maxD);
      n = randInt(2, d - 1);
    } while (gcd(n, d) === 1);
    const [sn, sd] = simplifyFraction(n, d);
    const answer = sd === 1 ? String(sn) : `${sn}/${sd}`;
    return {
      key: key("fractions"), type: "fractions", variant, kind: "text", inputMode: "fraction",
      prompt: t.logic.simplify(`${n}/${d}`), placeholder: t.logic.typeFraction, correctLabel: answer,
      // Must be in lowest terms: 2/4 is not an acceptable answer for "simplify 4/8".
      check: (input) => String(input).replace(/\s+/g, "") === answer,
      explanation: t.logic.explSimplify(n, d, gcd(n, d), answer),
    };
  }

  const maxD = { easy: 8, medium: 16, hard: 30, expert: 50 }[difficulty] ?? 16;
  let n1, d1, n2, d2;
  do {
    d1 = randInt(2, maxD); n1 = randInt(1, d1 - 1);
    d2 = randInt(2, maxD); n2 = randInt(1, d2 - 1);
  } while (n1 * d2 === n2 * d1);
  const a = fractionString(n1, d1);
  const b = fractionString(n2, d2);
  const larger = n1 / d1 > n2 / d2 ? a : b;
  return {
    key: key("fractions"), type: "fractions", variant: "compare", kind: "choice",
    prompt: t.logic.whichLarger(a, b),
    options: [{ id: a, label: a, v: n1 / d1 }, { id: b, label: b, v: n2 / d2 }].map((o, _, all) => {
      const other = all.find((x) => x !== o);
      return { id: o.id, label: o.label, whyNot: o.id === larger ? undefined : { text: t.logic.isSmaller(o.label, o.v.toFixed(3), other.label, other.v.toFixed(3)) } };
    }),
    correctId: larger, correctLabel: larger,
    explanation: t.logic.explCompare(a, (n1 / d1).toFixed(3), b, (n2 / d2).toFixed(3), larger),
  };
}

// ── Sequences ──────────────────────────────────────────────────────────────
function buildSequence(rule, difficulty, t) {
  if (rule === "arithmetic") {
    const maxStart = { easy: 10, medium: 50 }[difficulty] ?? 200;
    const maxStep = { easy: 5, medium: 15 }[difficulty] ?? 50;
    const step = randInt(1, maxStep) * (difficulty !== "easy" && Math.random() < 0.3 ? -1 : 1);
    const start = step < 0 ? randInt(6 * -step, 6 * -step + maxStart) : randInt(1, maxStart);
    const terms = Array.from({ length: 6 }, (_, i) => start + i * step);
    return { terms, explanation: t.logic.seqArith(step) };
  }
  if (rule === "geometric") {
    const start = randInt(1, difficulty === "easy" ? 3 : 5);
    const ratio = randInt(2, { easy: 3, medium: 4 }[difficulty] ?? 5);
    return { terms: Array.from({ length: 6 }, (_, i) => start * ratio ** i), explanation: t.logic.seqGeo(ratio) };
  }
  if (rule === "alternating") {
    const a0 = randInt(1, 20), b0 = randInt(1, 20);
    const sa = randInt(1, 10), sb = randInt(1, 10);
    return { terms: [a0, b0, a0 + sa, b0 + sb, a0 + 2 * sa, b0 + 2 * sb], explanation: t.logic.seqAlt(sa, sb) };
  }
  const terms = [randInt(1, 5), randInt(1, 5)];
  while (terms.length < 6) terms.push(terms.at(-1) + terms.at(-2));
  return { terms, explanation: t.logic.seqFib(terms[3], terms[4], terms[5]) };
}

export function generateSequence(difficulty, t) {
  const rules = ["arithmetic", "geometric", "alternating"];
  if (difficulty !== "easy") rules.push("fibonacci");
  const { terms, explanation } = buildSequence(pickOne(rules), difficulty, t);
  const answer = terms[5];
  const base = {
    key: key("sequences"), type: "sequences", prompt: t.logic.nextTerm,
    media: { kind: "sequence", terms: terms.slice(0, 5) }, explanation,
  };
  if (difficulty === "easy") {
    const wrong = shuffle([1, 2, 3, 4, 5, -1, -2, -3, -4])
      .map((o) => answer + o)
      .filter((v) => v > 0)
      .slice(0, 3);
    const opts = [answer, ...wrong].map((v) => ({
      id: String(v), label: String(v), whyNot: v === answer ? undefined : { text: t.logic.offBy(Math.abs(v - answer), v > answer) },
    }));
    return { ...base, kind: "choice", options: shuffle(opts), correctId: String(answer), correctLabel: String(answer) };
  }
  return numericQuestion(base, answer, t);
}

// ── Angle ──────────────────────────────────────────────────────────────────
export function generateAngle(difficulty, t) {
  const degrees =
    difficulty === "easy" ? randInt(2, 34) * 5
    : difficulty === "medium" ? randInt(1, 35) * 5
    : randInt(5, 355);
  const tolerance = { easy: 8, medium: 5, hard: 3, expert: 2 }[difficulty] ?? 5;
  return {
    key: key("angle"), type: "angle", kind: "angle", prompt: t.logic.anglePrompt,
    degrees, tolerance, correctLabel: `${degrees}°`, explanation: t.logic.angleKind(degrees),
  };
}

/** Angles are measured counter-clockwise from the base ray (0–359°): no wrap-around. */
export function angleCorrect(guess, degrees, tolerance) {
  return Math.abs(guess - degrees) <= tolerance;
}

// ── Algebra ────────────────────────────────────────────────────────────────
function eq(lhs, rhs) {
  return `${lhs} = ${rhs}`;
}
/** "ax + b" with b omitted when 0. */
function linear(a, b) {
  return b === 0 ? coefX(a) : `${coefX(a)} ${signedTerm(b)}`;
}

export function generateAlgebra(difficulty, t) {
  const x = randInt(-12, 12) || 7;
  let prompt, steps;

  if (difficulty === "easy") {
    const form = randInt(0, 2);
    if (form === 0) {
      const a = randInt(1, 20) * pickOne([1, -1]);
      const b = x + a;
      prompt = eq(linear(1, a), num(b));
      steps = [eq("x", `${num(b)} ${signedTerm(-a)}`), eq("x", num(x))];
    } else if (form === 1) {
      const a = randInt(2, 10);
      prompt = eq(coefX(a), num(a * x));
      steps = [eq("x", `${num(a * x)} ÷ ${a}`), eq("x", num(x))];
    } else {
      const a = randInt(2, 6);
      const q = randInt(-10, 10) || 3;
      const xv = q * a;
      return algebraQuestion(eq(`x ÷ ${a}`, num(q)), [eq("x", `${num(q)} × ${a}`), eq("x", num(xv))], xv, t);
    }
  } else if (difficulty === "medium") {
    const a = randInt(2, 10) * pickOne([1, 1, -1]);
    const b = randInt(1, 15) * pickOne([1, -1]);
    const c = a * x + b;
    prompt = eq(linear(a, b), num(c));
    steps = [eq(coefX(a), `${num(c)} ${signedTerm(-b)}`), eq(coefX(a), num(c - b)), eq("x", num(x))];
  } else if (difficulty === "hard") {
    let a, c;
    do { a = randInt(1, 10); c = randInt(1, 10); } while (a === c);
    const b = randInt(-15, 15);
    const d = (a - c) * x + b;
    prompt = eq(linear(a, b), linear(c, d));
    steps = [eq(coefX(a - c), `${num(d)} ${signedTerm(-b)}`), eq(coefX(a - c), num(d - b)), eq("x", num(x))];
  } else {
    // a(x + b) = cx + d
    let a, c;
    do { a = randInt(2, 8); c = randInt(1, 8); } while (a === c);
    const b = randInt(-10, 10) || 4;
    const d = (a - c) * x + a * b;
    prompt = eq(`${a}(${linear(1, b)})`, linear(c, d));
    steps = [
      eq(linear(a, a * b), linear(c, d)),
      eq(coefX(a - c), `${num(d)} ${signedTerm(-a * b)}`),
      eq(coefX(a - c), num(d - a * b)),
      eq("x", num(x)),
    ];
  }
  return algebraQuestion(prompt, steps, x, t);
}

function algebraQuestion(expression, steps, answer, t) {
  return numericQuestion(
    { key: key("algebra"), type: "algebra", prompt: t.logic.solve, expression, steps },
    answer, t,
  );
}

// ── Round builder ──────────────────────────────────────────────────────────
const GENERATORS = {
  arithmetic: generateArithmetic,
  fractions: generateFraction,
  sequences: generateSequence,
  angle: generateAngle,
  algebra: generateAlgebra,
  clocks: generateClock,
  roman: generateRoman,
  units: generateUnits,
  "word-problems": generateWordProblem,
  puzzles: generatePuzzle,
};

export function buildRound(settings, t) {
  const { mode, difficulty = "medium", roundSize: count = 10 } = settings;
  const out = [];
  const seen = new Set();
  for (let attempts = 0; out.length < count && attempts < count * 10; attempts++) {
    const type = mode === "logic-mixed" ? pickOne(LOGIC_MODES) : mode;
    const gen = GENERATORS[type];
    if (!gen) throw new Error(`Unknown logic mode: "${type}"`);
    const q = gen(difficulty, t);
    const m = q.media ?? {};
    const sig = [q.prompt, q.expression, q.degrees, m.terms?.join(","), m.h != null && `${m.h}:${m.m}`, m.lines?.join("|")].join("¦");
    if (seen.has(sig)) continue; // no duplicate questions within a round
    seen.add(sig);
    out.push(q);
  }
  return out;
}
