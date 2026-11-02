import { describe, it, expect } from "vitest";
import { reducer, fresh, scoreOf, autoAdvanceDelay } from "./useQuizSession.js";

const q = (key, extra) => ({ key, kind: "choice", options: [{ id: "a" }, { id: "b" }], correctId: "a", ...extra });

describe("quiz session reducer", () => {
  it("records exactly one answer per question (timer expiry after a click is ignored)", () => {
    let s = fresh([q("1"), q("2")]);
    s = reducer(s, { type: "answer", correct: true, givenId: "a" });
    s = reducer(s, { type: "answer", correct: false, timedOut: true }); // late timer
    s = reducer(s, { type: "answer", correct: false, givenId: "b" }); // double click
    expect(s.results).toHaveLength(1);
    expect(s.answer.correct).toBe(true);
  });

  it("advances only after an answer, and finishes after the last question", () => {
    let s = fresh([q("1"), q("2")]);
    s = reducer(s, { type: "next" });
    expect(s.idx).toBe(0);
    s = reducer(reducer(s, { type: "answer", correct: true }), { type: "next" });
    expect(s.idx).toBe(1);
    s = reducer(reducer(s, { type: "answer", correct: false }), { type: "next", newBest: true });
    expect(s.done).toBe(true);
    expect(s.newBest).toBe(true);
    expect(scoreOf(s.results)).toEqual({ correct: 1, total: 2 });
  });

  it("practice mode re-queues misses until answered, scoring first attempts only", () => {
    let s = fresh([q("1")]);
    s = reducer(s, { type: "answer", correct: false, practice: true });
    expect(s.questions).toHaveLength(2);
    expect(s.questions[1].isRetry).toBe(true);
    s = reducer(s, { type: "next" });
    s = reducer(s, { type: "answer", correct: true, practice: true });
    s = reducer(s, { type: "next" });
    expect(s.done).toBe(true);
    expect(scoreOf(s.results)).toEqual({ correct: 0, total: 1 });
  });

  it("auto-advances correct choices only; wrong answers wait so the explanation can be read", () => {
    expect(autoAdvanceDelay(q("1"), { correct: true })).toBeGreaterThan(0);
    expect(autoAdvanceDelay(q("1", { note: "fact" }), { correct: true })).toBeGreaterThan(autoAdvanceDelay(q("1"), { correct: true }));
    expect(autoAdvanceDelay(q("1", { note: "fact" }), { correct: false })).toBeNull();
    expect(autoAdvanceDelay(q("1"), { correct: false })).toBeNull();
    expect(autoAdvanceDelay(q("1", { steps: ["a"] }), { correct: true })).toBeNull();
    expect(autoAdvanceDelay({ kind: "text" }, { correct: true })).toBeNull();
    expect(autoAdvanceDelay({ kind: "locate" }, { correct: true })).toBeNull();
  });
});
