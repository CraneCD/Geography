// Every question should teach: an explanation after answering, and for multiple choice a
// reason why each wrong option is wrong. Covers all subjects and languages.
import { describe, it, expect } from "vitest";
import { getStrings } from "../i18n/index.js";
import { buildRound as geo } from "../subjects/geography/generate.js";
import { buildRound as hist } from "../subjects/history/generate.js";
import { buildRound as sci } from "../subjects/science/generate.js";

const ROUNDS = {
  geography: [geo, ["mixed"]],
  history: [hist, ["history-mixed", "who-first"]],
  science: [sci, ["science-mixed", "elements", "animals-compare", "space-compare"]],
};

describe("explanations", () => {
  for (const lang of ["en", "es", "fr"]) {
    const t = { ...getStrings(lang), lang };
    for (const [subject, [build, modes]] of Object.entries(ROUNDS)) {
      for (const mode of modes) {
        it(`${subject} · ${mode} · ${lang}`, () => {
          for (let i = 0; i < 5; i++) {
            for (const q of build({ mode, difficulty: "medium", roundSize: 20, lang }, t)) {
              const explained = q.note || q.explanation || q.steps;
              expect(explained, q.key).toBeTruthy();
              expect(String(q.note ?? "")).not.toMatch(/undefined|NaN|\[object/);
              if (q.kind !== "choice") continue;
              for (const o of q.options.filter((o) => o.id !== q.correctId)) {
                expect(o.whyNot?.text, `${q.key} → ${o.label}`).toBeTruthy();
                expect(o.whyNot.text).not.toMatch(/undefined|NaN|\[object/);
              }
            }
          }
        });
      }
    }
  }

  it("links to a Wikipedia article in the player's language", () => {
    const t = { ...getStrings("fr"), lang: "fr" };
    const qs = hist({ mode: "people", difficulty: "medium", roundSize: 10, lang: "fr" }, t);
    for (const q of qs) expect(q.source).toMatch(/^https:\/\/fr\.wikipedia\.org\//);
    const els = sci({ mode: "elements", difficulty: "easy", roundSize: 10, lang: "en" }, { ...getStrings("en"), lang: "en" });
    for (const q of els) expect(q.source).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\//);
  });
});
