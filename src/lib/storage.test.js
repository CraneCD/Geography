import { describe, it, expect, beforeEach } from "vitest";
import { recordActivity, getActivity, recordBest, getSubjectBest } from "./storage.js";

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
});

const day = (s) => new Date(`${s}T12:00:00`);

describe("activity streak", () => {
  it("counts consecutive days, including yesterday if today is not played yet", () => {
    recordActivity(10, day("2026-10-28"));
    recordActivity(5, day("2026-10-29"));
    recordActivity(5, day("2026-10-30"));
    expect(getActivity(day("2026-10-30"))).toEqual({ streak: 3, answered: 20 });
    expect(getActivity(day("2026-10-31")).streak).toBe(3); // not played yet today
    expect(getActivity(day("2026-11-01")).streak).toBe(0); // missed a day
  });

  it("does not double-count several rounds on the same day", () => {
    recordActivity(10, day("2026-10-30"));
    recordActivity(10, day("2026-10-30"));
    expect(getActivity(day("2026-10-30"))).toEqual({ streak: 1, answered: 20 });
  });
});

describe("subject best", () => {
  it("is the best percentage across the subject's modes", () => {
    recordBest("geography", "flags", "medium", 7, 10);
    recordBest("geography", "capitals", "medium", 9, 10);
    recordBest("geography", "capitals", "hard", 10, 10);
    expect(getSubjectBest("geography", ["flags", "capitals", "locate"], "medium")).toBe(90);
    expect(getSubjectBest("history", ["people"], "medium")).toBeNull();
  });
});
