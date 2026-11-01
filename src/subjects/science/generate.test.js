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
          if (difficulty === "expert" && /photo|^body$/.test(mode)) expect(q.kind).toBe("text");
          if (/photo|^body$/.test(q.type)) { expect(q.media?.src).toBeTruthy(); expect(q.media.src).not.toMatch(/^https?:/); }
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

describe("elements", async () => {
  const { ELEMENTS } = await import("../../data/science/elements.js");
  const { ELEMENT_NAMES } = await import("../../data/science/names.js");
  const { elementPool } = await import("./generate.js");

  it("covers the whole periodic table with translations", () => {
    expect(ELEMENTS.map((e) => e.atomicNumber)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118);
    for (const e of ELEMENTS) expect(ELEMENT_NAMES[e.symbol]).toHaveLength(2);
  });

  it("keeps Easy to familiar elements and uses all of them on Hard", () => {
    const easy = elementPool("easy").map((e) => e.symbol);
    expect(easy).toEqual(expect.arrayContaining(["H", "O", "Ca", "Fe", "Au", "U"]));
    expect(easy).not.toContain("La");
    expect(easy).not.toContain("Og");
    expect(easy.length).toBeLessThan(40);
    expect(elementPool("hard")).toHaveLength(118);
  });

  it("never asks for the group of an f-block element", () => {
    for (let i = 0; i < 30; i++) {
      for (const q of buildRound(settings({ mode: "elements", difficulty: "medium", roundSize: 20 }), t)) {
        expect(q.correctLabel).not.toMatch(/null|undefined/);
      }
    }
  });
});

describe("science translations", async () => {
  const { FACTS } = await import("../../data/science/facts.js");
  const { ANIMAL_NAMES, SPACE_NAMES, BODY_NAMES } = await import("../../data/science/names.js");
  const { BODY_REGIONS } = await import("../../data/science/body.js");

  it("every animal, space object and body part has translated names and facts", () => {
    for (const a of ANIMALS) { expect(FACTS[a.id], a.id).toHaveLength(2); expect(ANIMAL_NAMES[a.id], a.id).toHaveLength(2); }
    for (const o of SPACE_OBJECTS) { expect(FACTS[o.id], o.id).toHaveLength(2); expect(SPACE_NAMES[o.id], o.id).toHaveLength(2); }
    for (const r of BODY_REGIONS) { expect(FACTS[r.id], r.id).toHaveLength(2); expect(BODY_NAMES[r.photoName ?? r.name], r.id).toHaveLength(2); }
  });

  it("facts appear in the selected language", () => {
    const qs = buildRound(settings({ mode: "space-photo", difficulty: "medium", roundSize: 20 }), getStrings("fr"));
    expect(qs.find((q) => q.key === "space-photo:earth").note).toContain("seule planète");
  });
});

describe("traits, systems and missions data", () => {
  it("covers every animal and only uses known labels", async () => {
    const { ANIMAL_TRAITS, GROUPS, DIETS, HABITATS, BODY_PARTS, SYSTEMS, MISSIONS, MISSION_TARGETS, AGENCIES } = await import("../../data/science/traits.js");
    const { BODY_REGIONS } = await import("../../data/science/body.js");
    for (const a of ANIMALS) {
      const tr = ANIMAL_TRAITS[a.id];
      expect(tr, a.id).toBeTruthy();
      if (tr.group) expect(GROUPS).toContain(tr.group);
      if (tr.diet) expect(DIETS).toContain(tr.diet);
      for (const h of tr.habitats ?? []) expect(HABITATS).toContain(h);
    }
    for (const p of BODY_PARTS) {
      for (const s of p.systems) expect(SYSTEMS).toContain(s);
      if (p.region) expect(BODY_REGIONS.some((r) => r.id === p.region)).toBe(true);
      expect(p.name).toHaveLength(3);
    }
    for (const m of MISSIONS) {
      for (const x of m.targets ?? []) expect(MISSION_TARGETS).toContain(x);
      for (const x of m.agency) expect(AGENCIES).toContain(x);
      expect(m.d).toHaveLength(3);
    }
  });

  it("never offers another fair answer as a wrong option", () => {
    for (const mode of ["animal-traits", "body-systems", "space-missions"]) {
      for (let i = 0; i < 20; i++) {
        for (const q of buildRound(settings({ mode, difficulty: "hard", roundSize: 20 }), t)) {
          assertChoice(expect, q);
          expect(q.note).toBeTruthy();
        }
      }
    }
  });

  it("asks which elements are gases or liquids with solid distractors", () => {
    const qs = many(30, () => buildRound(settings({ mode: "elements", difficulty: "medium", roundSize: 20 }), t)).filter((q) => q.prompt === t.sci.stateGas);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(["H", "He", "N", "O", "F", "Ne", "Cl", "Ar", "Kr", "Xe", "Rn"]).toContain(q.correctId);
      for (const o of q.options) if (o.id !== q.correctId) expect(o.whyNot.text).toMatch(/solid/);
    }
  });
});
