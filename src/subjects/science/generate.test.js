import { describe, it, expect } from "vitest";
import { buildRound, SCIENCE_MODES } from "./generate.js";
import { ANIMALS } from "../../data/science/animals.js";
import { SPACE_OBJECTS } from "../../data/science/space.js";
import { getStrings } from "../../i18n/index.js";
import { DIFFICULTIES, t, assertChoice, positionShares, many } from "../../test/helpers.js";

const settings = (over) => ({ difficulty: "medium", roundSize: 10, lang: "en", ...over });

describe("science rounds", () => {
  for (const mode of [...SCIENCE_MODES, "science-mixed"]) {
    for (const difficulty of DIFFICULTIES) {
      it(`${mode} · ${difficulty}: no repeats, well-formed`, () => {
        const qs = buildRound(settings({ mode, difficulty, roundSize: 20 }), t);
        expect(qs.length).toBeGreaterThan(0);
        expect(new Set(qs.map((q) => q.key)).size).toBe(qs.length);
        for (const q of qs) {
          if (q.kind === "choice") assertChoice(expect, q);
          if (q.kind === "text") expect(q.accepted.length).toBeGreaterThan(0);
          if (difficulty === "expert" && /photo|body/.test(mode)) expect(q.kind).toBe("text");
          if (/photo|body/.test(q.type)) expect(q.media?.src).toMatch(/^https:\/\//);
        }
      });
    }
  }

  it("compare questions mark the larger value as correct", () => {
    const all = Object.fromEntries([...ANIMALS, ...SPACE_OBJECTS].map((x) => [x.id, x]));
    for (const mode of ["animals-compare", "space-compare"]) {
      for (const d of DIFFICULTIES) {
        for (const q of buildRound(settings({ mode, difficulty: d, roundSize: 20 }), t)) {
          const metric = q.key.split(":")[1];
          const [a, b] = q.items.map((i) => all[i.id][metric]);
          expect(q.correctId).toBe(a > b ? q.items[0].id : q.items[1].id);
        }
      }
    }
  });

  it("answer position is uniform", () => {
    const qs = many(60, () => buildRound(settings({ mode: "animals-photo" }), t));
    for (const share of positionShares(qs)) expect(share).toBeGreaterThan(0.15);
  });

  it("names are translated", () => {
    const qs = buildRound(settings({ mode: "space-photo", difficulty: "easy", roundSize: 20 }), getStrings("es"));
    const labels = qs.flatMap((q) => q.options.map((o) => o.label));
    expect(labels).toContain("Tierra");
    expect(qs[0].prompt).toBe(getStrings("es").sci.spacePrompt);
  });
});
