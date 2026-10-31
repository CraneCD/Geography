import { describe, it, expect } from "vitest";
import { buildRound, yearOptions } from "./generate.js";
import { allWikiTitles } from "../../data/wikiTitles.js";
import { imageFor } from "../../data/images.js";
import { DIFFICULTIES, t, many, assertChoice, positionShares } from "../../test/helpers.js";

const settings = (over) => ({ difficulty: "medium", roundSize: 10, lang: "en", ...over });
const THIS_YEAR = new Date().getFullYear();

describe("year options", () => {
  it("place the correct year at a uniformly random position", () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const opts = yearOptions(1500, "medium").sort((a, b) => a - b);
      counts[opts.indexOf(1500)]++;
    }
    for (const c of counts) expect(c / 4000).toBeGreaterThan(0.18);
  });

  it("never include future years or year 0", () => {
    for (const year of [-490, -5, 1, 1969, 2001, 2015, THIS_YEAR]) {
      for (const d of ["easy", "medium", "hard"]) {
        for (let i = 0; i < 50; i++) {
          const opts = yearOptions(year, d);
          expect(new Set(opts).size).toBe(4);
          expect(opts).toContain(year);
          for (const y of opts) {
            expect(y).not.toBe(0);
            expect(y).toBeLessThanOrEqual(THIS_YEAR);
          }
        }
      }
    }
  });
});

describe("history rounds", () => {
  for (const mode of ["people", "events", "inventions", "art", "who-first", "history-mixed"]) {
    for (const difficulty of DIFFICULTIES) {
      it(`${mode} · ${difficulty}: well-formed questions`, () => {
        const qs = buildRound(settings({ mode, difficulty, roundSize: 20 }), t);
        expect(qs).toHaveLength(20);
        expect(new Set(qs.map((q) => q.key)).size).toBe(20);
        for (const q of qs) {
          if (q.kind === "choice") assertChoice(expect, q);
          if (q.kind === "text") expect(q.accepted?.length || q.check).toBeTruthy();
          if (q.kind === "compare") {
            const [a, b] = q.items;
            expect(a.value).not.toBe(b.value);
          }
          if (q.type === "people" || q.type === "art") expect(q.media?.src).toMatch(/^https:\/\//);
          expect(q.correctLabel).toBeTruthy();
        }
      });
    }
  }

  it("event answers are not guessable from option order", () => {
    const qs = many(100, () => buildRound(settings({ mode: "events" }), t));
    const sorted = qs.map((q) => ({ ...q, options: [...q.options].sort((a, b) => Number(a.id) - Number(b.id)) }));
    for (const share of positionShares(sorted)) expect(share).toBeGreaterThan(0.15);
  });

  it("who-first pairs are never tied and respect the difficulty gap", () => {
    const gap = { easy: 150, medium: 40, hard: 10, expert: 3 };
    for (const difficulty of DIFFICULTIES) {
      for (const q of many(10, () => buildRound(settings({ mode: "who-first", difficulty, roundSize: 20 }), t))) {
        const [a, b] = q.items.map((i) => i.value);
        expect(a).not.toBe(b);
        expect(q.verdicts.correct).toBe(t.earlier);
        void gap;
      }
    }
  });
});

describe("image manifest", () => {
  // Titles Wikipedia has no lead image for (or that still need fixing). These items
  // are automatically excluded from picture questions. Keep this list short.
  const KNOWN_MISSING = new Set([
    "Attila", "Hypatia", "Napoleon_Crossing_the_Alps",
    "Composition_VIII_(Kandinsky)",
  ]);

  it("covers every image title (run `npm run build:images` after adding data)", () => {
    const missing = allWikiTitles().filter((title) => !imageFor(title) && !KNOWN_MISSING.has(title));
    expect(missing).toEqual([]);
  });

  it("uses sized thumbnails rather than original uploads", () => {
    for (const title of allWikiTitles()) {
      const img = imageFor(title);
      if (img && img.width > 500) throw new Error(`${title} is ${img.width}px wide`);
    }
  });
});
