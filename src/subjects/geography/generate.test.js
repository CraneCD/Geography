import { describe, it, expect } from "vitest";
import {
  buildRound, countryDistractors, officialLanguages, hasShape, MIXABLE_MODES, population, area,
  landNeighbours, currenciesOf, capitalName,
} from "./generate.js";
import { countries } from "../../data/countries.js";
import { flagSrc } from "./flags.js";
import worldMap from "../../data/generated/worldMap.json";
import { DIFFICULTIES, REGIONS, t, many, assertChoice, positionShares } from "../../test/helpers.js";

const settings = (over) => ({ region: "All", difficulty: "medium", roundSize: 10, lang: "en", ...over });

describe("geography data", () => {
  it("every country has a bundled flag (run `npm run build:flags` after adding one)", () => {
    expect(countries.filter((c) => !flagSrc(c.code)).map((c) => c.code)).toEqual([]);
  });

  it("every country can be shown on the locate map", () => {
    const missing = countries.filter((c) => !worldMap.countries[c.code] && !worldMap.points[c.code]).map((c) => c.code);
    expect(missing).toEqual([]);
  });

  it("every country has an outline shape (microstates from the higher-resolution atlases)", () => {
    expect(countries.filter((c) => !hasShape(c.code)).map((c) => c.code)).toEqual([]);
    // Regression: zero-padded TopoJSON ids once dropped these countries.
    for (const code of ["AR", "AU", "BR", "AT", "BE", "BO", "AF", "DZ"]) expect(hasShape(code)).toBe(true);
  });
});

describe("multiple-choice rounds", () => {
  for (const mode of ["flags", "capitals", "shapes", "languages"]) {
    for (const region of REGIONS) {
      for (const difficulty of ["easy", "medium", "hard"]) {
        it(`${mode} · ${region} · ${difficulty}: 4 unique options including the answer`, () => {
          const qs = many(5, () => buildRound(settings({ mode, region, difficulty }), t));
          expect(qs.length).toBeGreaterThan(0);
          for (const q of qs) assertChoice(expect, q);
        });
      }
    }
  }

  it("expert mode asks for typed answers", () => {
    for (const mode of ["flags", "capitals", "shapes", "languages"]) {
      for (const q of buildRound(settings({ mode, difficulty: "expert" }), t)) {
        expect(q.kind).toBe("text");
        expect(q.accepted.length).toBeGreaterThan(0);
      }
    }
  });

  it("the correct answer position is uniformly distributed", () => {
    const qs = many(200, () => buildRound(settings({ mode: "flags" }), t));
    for (const share of positionShares(qs)) {
      expect(share).toBeGreaterThan(0.18);
      expect(share).toBeLessThan(0.32);
    }
  });

  it("harder difficulties use more same-region distractors", () => {
    const rate = (difficulty) => {
      let same = 0, total = 0;
      for (let i = 0; i < 500; i++) {
        const c = countries[i % countries.length];
        for (const d of countryDistractors(c, difficulty)) { total++; if (d.region === c.region) same++; }
      }
      return same / total;
    };
    const easy = rate("easy"), medium = rate("medium"), hard = rate("hard");
    expect(easy).toBe(0);
    expect(medium).toBeGreaterThan(0.3);
    expect(medium).toBeLessThan(0.7);
    expect(hard).toBeGreaterThan(0.95);
  });

  it("never offers another official language of the same country as a wrong answer", () => {
    for (let i = 0; i < 40; i++) {
      for (const q of buildRound(settings({ mode: "languages", roundSize: 20, difficulty: "hard" }), t)) {
        const code = q.key.split(":")[1];
        const official = new Set(officialLanguages(code));
        for (const o of q.options) if (o.id !== q.correctId) expect(official.has(o.id)).toBe(false);
      }
    }
  });
});

describe("round sizes", () => {
  for (const mode of [...MIXABLE_MODES, "mixed"]) {
    it(`${mode}: a full 20-question round for "All"`, () => {
      const qs = buildRound(settings({ mode, roundSize: 20, mixedModes: MIXABLE_MODES }), t);
      expect(qs).toHaveLength(20);
      expect(new Set(qs.map((q) => q.key)).size).toBe(20);
    });
  }
});

describe("population / area comparisons", () => {
  for (const type of ["population", "area"]) {
    for (const difficulty of DIFFICULTIES) {
      it(`${type} · ${difficulty}: the larger value is the correct answer`, () => {
        for (const q of buildRound(settings({ mode: type, difficulty, roundSize: 20 }), t)) {
          const [a, b] = q.items.map((i) => (type === "population" ? population(i.id).value : area(i.id)));
          expect(a).not.toBe(b);
          expect(q.correctId).toBe(a > b ? q.items[0].id : q.items[1].id);
        }
      });
    }
  }
});

describe("localisation", () => {
  it("uses translated country names", async () => {
    const { getStrings } = await import("../../i18n/index.js");
    const q = buildRound(settings({ mode: "capitals", lang: "es", region: "Europe", difficulty: "expert", roundSize: 50 }), getStrings("es"))
      .find((x) => x.key === "capitals:DE");
    expect(q.prompt).toContain("Alemania");
  });
});

describe("neighbours and currencies", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    it(`neighbours · ${difficulty}: exactly one option borders the country`, () => {
      for (const q of buildRound(settings({ mode: "neighbours", difficulty, roundSize: 20 }), t)) {
        const code = q.key.split(":")[1];
        const borders = new Set(landNeighbours(code));
        expect(q.options.filter((o) => borders.has(o.id)).map((o) => o.id)).toEqual([q.correctId]);
      }
    });
    it(`currencies · ${difficulty}: no other option is also used by the country`, () => {
      for (const q of buildRound(settings({ mode: "currencies", difficulty, roundSize: 20 }), t)) {
        const own = new Set(currenciesOf(q.key.split(":")[1]));
        expect(q.options.filter((o) => own.has(o.id)).map((o) => o.id)).toEqual([q.correctId]);
      }
    });
  }

  it("land borders are symmetric and never include the country itself", () => {
    for (const c of countries) for (const n of landNeighbours(c.code)) {
      expect(n).not.toBe(c.code);
      expect(landNeighbours(n)).toContain(c.code);
    }
    expect(landNeighbours("ES")).toEqual(["AD", "FR", "PT"]);
    expect(landNeighbours("JP")).toEqual([]);
  });

  it("every wrong option explains itself", () => {
    for (const mode of ["flags", "capitals", "shapes", "languages", "neighbours", "currencies"]) {
      for (const q of buildRound(settings({ mode, roundSize: 10 }), t)) {
        expect(q.note, mode).toBeTruthy();
        for (const o of q.options) expect(o.whyNot?.text, `${mode} ${o.id}`).toBeTruthy();
      }
    }
  });
});

describe("refreshed facts", () => {
  it("every country has a dated population, an area, a currency and capital names", () => {
    for (const c of countries) {
      expect(population(c.code).value, c.code).toBeGreaterThan(0);
      expect(area(c.code), c.code).toBeGreaterThan(0);
      expect(currenciesOf(c.code).length, c.code).toBeGreaterThan(0);
      for (const lang of ["en", "es", "fr"]) expect(capitalName(c, lang), c.code).toBeTruthy();
    }
    expect(capitalName({ code: "CN", capital: "Beijing" }, "es")).toBe("Pekín");
  });
});
