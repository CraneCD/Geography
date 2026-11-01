import { describe, it, expect } from "vitest";
import { matchesAnswer, normalize } from "./text.js";
import { parseYear, signedTerm, coefX, roundTo } from "./format.js";
import { pickDistractors } from "./random.js";
import en from "../i18n/en.js";
import es from "../i18n/es.js";
import fr from "../i18n/fr.js";

describe("matchesAnswer", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalize("Côte d'Ivoire")).toBe("cote d ivoire");
    expect(matchesAnswer("cote d'ivoire", ["Côte d'Ivoire"])).toBe(true);
    expect(matchesAnswer("  BRASILIA ", ["Brasília"])).toBe(true);
  });

  it("tolerates small typos on longer answers only", () => {
    expect(matchesAnswer("Argentin", ["Argentina"])).toBe(true);
    expect(matchesAnswer("Iraq", ["Iran"])).toBe(false);
  });

  it("never accepts a different valid answer as a typo", () => {
    const all = ["Gambia", "Zambia", "Niger", "Nigeria"];
    expect(matchesAnswer("Zambia", ["Gambia"], { exclude: all })).toBe(false);
    expect(matchesAnswer("Gambai", ["Gambia"], { exclude: all })).toBe(true);
  });

  it("accepts surnames when asked to", () => {
    expect(matchesAnswer("Einstein", ["Albert Einstein"], { surname: true })).toBe(true);
    expect(matchesAnswer("Einstein", ["Albert Einstein"])).toBe(false);
    expect(matchesAnswer("da vinci", ["Leonardo da Vinci"], { surname: true })).toBe(false);
    expect(matchesAnswer("Leonardo da Vinci", ["Leonardo da Vinci"], { surname: true })).toBe(true);
  });
});

describe("format helpers", () => {
  it("parses years with era markers", () => {
    expect(parseYear("44 BC")).toBe(-44);
    expect(parseYear("44 a. C.")).toBe(-44);
    expect(parseYear("44 av. J.-C.")).toBe(-44);
    expect(parseYear("1969")).toBe(1969);
  });

  it("formats signed terms", () => {
    expect(signedTerm(-5)).toBe("− 5");
    expect(coefX(1)).toBe("x");
    expect(coefX(-1)).toBe("−x");
    expect(roundTo(0.98 * 58)).toBe(56.84);
  });
});

describe("pickDistractors", () => {
  it("always fills the requested count from fallbacks", () => {
    const out = pickDistractors({ correctKey: "a", tiers: [{ items: ["a", "b"] }], fallback: ["c", "d", "e"] });
    expect(out).toHaveLength(3);
    expect(out).not.toContain("a");
  });
});

/** Collect "a.b.c" key paths with the type of each leaf. */
function shape(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? shape(v, `${prefix}${k}.`) : [`${prefix}${k}:${typeof v}`],
  );
}

describe("translations", () => {
  const ref = new Set(shape(en));
  for (const [name, table] of Object.entries({ es, fr })) {
    it(`${name} defines every English key with the same type`, () => {
      const keys = new Set(shape(table));
      expect([...ref].filter((k) => !keys.has(k))).toEqual([]);
    });
  }
});
