import { describe, it, expect, beforeEach } from "vitest";
import { recordAnswer, localStats, statsKey } from "./stats.js";
import { calibrate, accuracy } from "./calibration.js";

describe("answer statistics", () => {
  beforeEach(() => {
    const store = {};
    globalThis.localStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it("aggregates answers per question and skips practice retries", () => {
    const q = { key: "flags:FR", type: "flags" };
    recordAnswer({ subject: "geography", difficulty: "easy", question: q, correct: true, ms: 900 });
    recordAnswer({ subject: "geography", difficulty: "easy", question: q, correct: false, ms: 1500 });
    recordAnswer({ subject: "geography", difficulty: "easy", question: { ...q, isRetry: true }, correct: true });
    expect(localStats()).toEqual({ "geography:flags:FR": [2, 1] });
  });

  it("counts generated logic questions by type", () => {
    expect(statsKey("logic", { key: "arithmetic:42", type: "arithmetic" })).toBe("logic:arithmetic");
    expect(statsKey("history", { key: "people:curie" })).toBe("history:people:curie");
  });
});

describe("difficulty calibration", () => {
  const table = { "a": { n: 50, acc: 0.95 }, "b": { n: 50, acc: 0.3 }, "c": { n: 40, acc: 0.6 } };
  const items = ["a", "b", "c", "d"];

  it("keeps easy items for Easy and hard ones for Hard, and unknown items in both", () => {
    expect(calibrate(items, (x) => x, "easy", table)).toEqual(["a", "d"]);
    expect(calibrate(items, (x) => x, "hard", table)).toEqual(["b", "d"]);
    expect(calibrate(items, (x) => x, "medium", table)).toEqual(items);
    expect(accuracy("z", table)).toBeNull();
  });

  it("never shrinks a large pool below a playable size", () => {
    const many = Array.from({ length: 40 }, (_, i) => `k${i}`);
    const hardOnly = Object.fromEntries(many.map((k, i) => [k, { n: 50, acc: i < 3 ? 0.9 : 0.2 }]));
    expect(calibrate(many, (x) => x, "easy", hardOnly)).toEqual(many);
  });
});
