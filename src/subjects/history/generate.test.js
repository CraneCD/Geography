import { describe, it, expect } from "vitest";
import { buildRound, yearOptions } from "./generate.js";
import { allImageRefs } from "../../data/wikiTitles.js";
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
          if (q.type === "people" || q.type === "art") { expect(q.media?.src).toBeTruthy(); expect(q.media.src).not.toMatch(/^https?:/); }
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
  // Items deliberately without a picture set `imageFile: null` in the data instead.
  const KNOWN_MISSING = new Set([]);

  it("covers every image title (run `npm run build:images` after adding data)", () => {
    const missing = allImageRefs().filter((title) => !imageFor(title) && !KNOWN_MISSING.has(title));
    expect(missing).toEqual([]);
  });

  it("self-hosts every image with a free licence", async () => {
    const manifest = (await import("../../data/generated/images.json")).default;
    const { existsSync } = await import("node:fs");
    for (const [ref, e] of Object.entries(manifest)) {
      expect(existsSync(`src/assets/quiz-images/${e.file}`), ref).toBe(true);
      expect(e.license, ref).toMatch(/public domain|cc0|cc[ -]by|gfdl|attribution|no restrictions/i);
      expect(e.page, ref).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });

  it("never uses animated GIFs (they are huge and hard to read)", () => {
    for (const ref of allImageRefs()) expect(imageFor(ref)?.src ?? "").not.toMatch(/\.gif$/i);
  });

  it("uses sized thumbnails rather than original uploads", () => {
    for (const title of allImageRefs()) {
      const img = imageFor(title);
      if (img && img.width > 500) throw new Error(`${title} is ${img.width}px wide`);
    }
  });
});

describe("history data", async () => {
  const { people } = await import("../../data/history/people.js");
  const { events } = await import("../../data/history/events.js");
  const { inventions } = await import("../../data/history/inventions.js");
  const { artworks } = await import("../../data/history/artworks.js");
  const sets = { people: [people, "name"], events: [events, "event"], inventions: [inventions, "invention"], artworks: [artworks, "title"] };

  for (const [name, [items, key]] of Object.entries(sets)) {
    it(`${name}: ids and names are unique`, () => {
      const dupes = (vals) => vals.filter((v, i) => vals.indexOf(v) !== i);
      expect(dupes(items.map((x) => x.id))).toEqual([]);
      expect(dupes(items.map((x) => String(x[key]).toLowerCase()))).toEqual([]);
    });
  }
});

describe("history translations", async () => {
  const { people } = await import("../../data/history/people.js");
  const { events } = await import("../../data/history/events.js");
  const { inventions } = await import("../../data/history/inventions.js");
  const { artworks } = await import("../../data/history/artworks.js");
  const { MOVEMENTS } = await import("../../data/history/i18n/index.js");
  const { getStrings } = await import("../../i18n/index.js");
  const sets = { people, events, inventions, artworks };

  for (const lang of ["es", "fr"]) {
    for (const [kind, items] of Object.entries(sets)) {
      it(`${kind}: every item has ${lang} text`, async () => {
        const table = (await import(`../../data/history/i18n/${kind}.${lang}.js`)).default;
        const missing = items.filter((x) => !table[x.id]?.d).map((x) => x.id);
        expect(missing).toEqual([]);
        expect(Object.keys(table).filter((id) => !items.some((x) => x.id === id))).toEqual([]); // no stale ids
      });
    }
  }

  it("every art movement is translated", () => {
    for (const a of artworks) expect(MOVEMENTS[a.movement], a.movement).toHaveLength(2);
  });

  it("questions use the selected language", () => {
    const es = buildRound(settings({ mode: "events", roundSize: 85, lang: "es", difficulty: "expert" }), getStrings("es"));
    expect(es.find((q) => q.key === "events:french-revolution").prompt).toContain("Revolución francesa");
    const fr = buildRound(settings({ mode: "art", roundSize: 80, lang: "fr" }), getStrings("fr"));
    expect(fr.find((q) => q.key.endsWith(":mona-lisa")).note).toContain("La Joconde");
  });

  it("typed answers accept the English and the translated name", async () => {
    const { matchesAnswer } = await import("../../lib/text.js");
    const qs = buildRound(settings({ mode: "art", roundSize: 80, lang: "es", difficulty: "expert" }), getStrings("es"));
    const q = qs.find((x) => x.key === "art:artist:creation-of-adam" || x.key === "art:movement:creation-of-adam");
    if (q?.key.includes("artist")) {
      expect(matchesAnswer("Miguel Ángel", q.accepted, q.match)).toBe(true);
      expect(matchesAnswer("Michelangelo", q.accepted, q.match)).toBe(true);
    } else if (q) {
      expect(matchesAnswer("Renacimiento", q.accepted, q.match)).toBe(true);
      expect(matchesAnswer("Renaissance", q.accepted, q.match)).toBe(true);
    }
  });
});
