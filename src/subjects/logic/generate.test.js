import { describe, it, expect } from "vitest";
import {
  buildRound, generateArithmetic, generateFraction, generateAlgebra, generateAngle, angleCorrect, parseNumber, LOGIC_MODES,
} from "./generate.js";
import { getStrings } from "../../i18n/index.js";
import { DIFFICULTIES, t, assertChoice } from "../../test/helpers.js";

const N = 400;

describe("logic rounds", () => {
  for (const mode of [...LOGIC_MODES, "logic-mixed"]) {
    for (const difficulty of DIFFICULTIES) {
      it(`${mode} · ${difficulty}: full round, no duplicates, no broken text`, () => {
        for (const lang of ["en", "es", "fr"]) {
          const qs = buildRound({ mode, difficulty, roundSize: 20 }, getStrings(lang));
          expect(qs).toHaveLength(20);
          for (const q of qs) {
            const text = [q.prompt, q.expression, q.explanation, q.correctLabel, ...(q.steps ?? [])].join(" | ");
            expect(text).not.toMatch(/undefined|NaN|null/);
            expect(text).not.toMatch(/[+−-] [−-]\d/); // "+ -5", "− −3"
            expect(text).not.toMatch(/(^|[^\d.])1x/); // "1x" instead of "x"
            if (q.kind === "choice") assertChoice(expect, q, q.options.length);
            if (q.kind === "text") expect(q.check(q.correctLabel)).toBe(true);
          }
        }
      });
    }
  }
});

describe("arithmetic", () => {
  it("medium division answers are spread over 2–9 (not almost always 2)", () => {
    const counts = {};
    let divisions = 0;
    for (let i = 0; i < 6000; i++) {
      const q = generateArithmetic("medium", t);
      if (!q.expression.includes("÷")) continue;
      divisions++;
      counts[q.correctLabel] = (counts[q.correctLabel] ?? 0) + 1;
    }
    for (let v = 2; v <= 9; v++) expect(counts[v] / divisions).toBeGreaterThan(0.06);
  });

  it("expert answers are never negative", () => {
    for (let i = 0; i < N; i++) expect(parseNumber(generateArithmetic("expert", t).correctLabel)).toBeGreaterThanOrEqual(0);
  });
});

describe("fractions & percentages", () => {
  it("percentage answers have at most two decimals (no float noise)", () => {
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < N; i++) {
        const q = generateFraction(d, t, "percentage");
        expect(q.correctLabel).toMatch(/^\d+(\.\d{1,2})?$/);
        expect(q.check(q.correctLabel)).toBe(true);
        expect(q.check(q.correctLabel.replace(".", ","))).toBe(true); // decimal comma
      }
    }
  });

  it("simplify requires lowest terms", () => {
    for (let i = 0; i < N; i++) {
      const q = generateFraction("medium", t, "simplify");
      const [n, d] = q.prompt.match(/(\d+)\/(\d+)/).slice(1).map(Number);
      expect(q.check(q.correctLabel)).toBe(true);
      expect(q.check(`${n}/${d}`)).toBe(false);
    }
  });
});

describe("algebra", () => {
  it("the stated answer solves the equation", () => {
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < N; i++) {
        const q = generateAlgebra(d, t);
        const x = parseNumber(q.correctLabel);
        const toJs = (side) => side
          .replace(/−/g, "-").replace(/÷/g, "/").replace(/×/g, "*")
          .replace(/(\d)x/g, "$1*x").replace(/(\d)\(/g, "$1*(");
        const [lhs, rhs] = q.expression.split("=").map(toJs);
        const f = new Function("x", `return [${lhs}, ${rhs}]`);
        const [l, r] = f(x);
        expect(Math.abs(l - r)).toBeLessThan(1e-9);
      }
    }
  });
});

describe("angle", () => {
  it("does not wrap around: a 355° reflex angle is not a 5° angle", () => {
    expect(angleCorrect(5, 355, 3)).toBe(false);
    expect(angleCorrect(353, 355, 3)).toBe(true);
    for (let i = 0; i < N; i++) {
      const q = generateAngle("hard", t);
      expect(q.degrees).toBeGreaterThan(0);
      expect(q.degrees).toBeLessThan(360);
    }
  });
});

describe("everyday maths modes", () => {
  it("Roman numerals round-trip and reject non-canonical forms", async () => {
    const { toRoman, fromRoman } = await import("./more.js");
    for (let n = 1; n < 4000; n++) expect(fromRoman(toRoman(n))).toBe(n);
    expect(toRoman(1994)).toBe("MCMXCIV");
    expect(fromRoman("IIII")).toBeNaN();
    expect(fromRoman("mmxxvi")).toBe(2026);
  });

  it("parses clock times on a 12-hour dial", async () => {
    const { parseClock, clockLabel } = await import("./more.js");
    expect(parseClock("3:05")).toEqual({ h: 3, m: 5 });
    expect(parseClock("15.05")).toEqual({ h: 3, m: 5 });
    expect(parseClock("0:30")).toEqual({ h: 12, m: 30 });
    expect(parseClock("3:5")).toBeNull();
    expect(clockLabel(13, 0)).toBe("1:00");
  });

  it("every wrong option is explained and none equals the answer", () => {
    for (const mode of ["clocks", "roman", "units", "word-problems", "puzzles"]) {
      for (const difficulty of ["easy", "medium"]) {
        for (const q of buildRound({ mode, difficulty, roundSize: 20 }, t)) {
          expect(q.explanation || q.steps).toBeTruthy();
          for (const o of q.options.filter((o) => o.id !== q.correctId)) {
            expect(o.whyNot?.text, `${q.key} ${o.label}`).toBeTruthy();
            expect(o.label).not.toBe(q.correctLabel);
          }
        }
      }
    }
  });

  it("puzzle answers follow from the clues alone", () => {
    for (let i = 0; i < 300; i++) {
      const q = buildRound({ mode: "puzzles", difficulty: "hard", roundSize: 1 }, t)[0];
      // Rebuild the order from the clues: "A is taller/older/runs faster than B" means A before B.
      const above = new Map();
      for (const line of q.media.lines) {
        const m = line.match(/^(\w+) (?:is|runs) (\w+) than (\w+)\.$/);
        const [, a, cmp, b] = m;
        const more = ["taller", "older", "faster"].includes(cmp);
        const [hi, lo] = more ? [a, b] : [b, a];
        above.set(lo, hi);
      }
      const names = new Set([...above.keys(), ...above.values()]);
      const top = [...names].find((n) => !above.has(n));
      const bottom = [...names].find((n) => ![...above.values()].includes(n));
      const asksMost = /tallest|oldest|fastest/.test(q.prompt);
      expect(q.correctId).toBe(asksMost ? top : bottom);
    }
  });
});
