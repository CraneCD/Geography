import { describe, it, expect } from "vitest";
import { featureRound } from "./features.js";
import { LANDMARKS } from "../../data/geography/landmarks.js";
import { FEATURES, FEATURE_KINDS } from "../../data/geography/physical.js";
import { countries } from "../../data/countries.js";
import { getStrings } from "../../i18n/index.js";
import { DIFFICULTIES, REGIONS, assertChoice } from "../../test/helpers.js";

const codes = new Set(countries.map((c) => c.code));

describe("landmarks and physical features data", () => {
  it("only uses known countries and kinds", () => {
    for (const x of [...LANDMARKS, ...FEATURES]) {
      expect(x.countries.length, x.id).toBeGreaterThan(0);
      for (const c of x.countries) expect(codes.has(c), `${x.id}: ${c}`).toBe(true);
    }
    for (const f of FEATURES) {
      expect(FEATURE_KINDS).toContain(f.kind);
      expect(f.value).toBeGreaterThan(0);
    }
  });
});

describe("landmarks and physical rounds", () => {
  for (const lang of ["en", "es", "fr"]) {
    const t = { ...getStrings(lang), lang };
    for (const mode of ["landmarks", "physical"]) {
      for (const difficulty of DIFFICULTIES) {
        it(`${mode} · ${difficulty} · ${lang}`, () => {
          for (const region of REGIONS) {
            const qs = featureRound({ mode, difficulty, region, roundSize: 20, lang }, t);
            expect(qs.length, region).toBeGreaterThan(0);
            expect(new Set(qs.map((q) => q.key)).size).toBe(qs.length);
            for (const q of qs) {
              expect(q.note).toBeTruthy();
              expect([q.prompt, q.note, q.correctLabel].join(" ")).not.toMatch(/undefined|NaN/);
              if (q.kind === "choice") {
                assertChoice(expect, q);
                for (const o of q.options.filter((o) => o.id !== q.correctId)) expect(o.whyNot?.text).toBeTruthy();
              } else {
                expect(q.accepted.length).toBeGreaterThan(0);
              }
            }
          }
        });
      }
    }
  }

  it("never offers another country the feature is in as a wrong answer", () => {
    const t = { ...getStrings("en"), lang: "en" };
    for (let i = 0; i < 30; i++) {
      for (const q of featureRound({ mode: "physical", difficulty: "hard", region: "All", roundSize: 40, lang: "en" }, t)) {
        if (!q.key.startsWith("physical:country:")) continue;
        const f = FEATURES.find((x) => q.key.endsWith(`:${x.id}`));
        for (const o of q.options) if (o.id !== q.correctId) expect(f.countries).not.toContain(o.id);
      }
    }
  });

  it("superlative questions have a clear winner", () => {
    const t = { ...getStrings("en"), lang: "en" };
    for (let i = 0; i < 30; i++) {
      for (const q of featureRound({ mode: "physical", difficulty: "hard", region: "All", roundSize: 40, lang: "en" }, t)) {
        if (!q.key.startsWith("physical:top:")) continue;
        const vals = q.options.map((o) => FEATURES.find((f) => f.id === o.id).value).sort((a, b) => b - a);
        expect(vals[0] / vals[1]).toBeGreaterThanOrEqual(1.1);
        expect(FEATURES.find((f) => f.id === q.correctId).value).toBe(vals[0]);
      }
    }
  });
});
