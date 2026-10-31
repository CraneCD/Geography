import { getStrings } from "../i18n/index.js";

export const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
export const REGIONS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"];
export const t = getStrings("en");

/** Run `fn` n times and flatten the results. */
export function many(n, fn) {
  return Array.from({ length: n }, fn).flat();
}

/** Asserts the shape every multiple-choice question must have. */
export function assertChoice(expect, q, size = 4) {
  expect(q.kind).toBe("choice");
  expect(q.options).toHaveLength(size);
  expect(new Set(q.options.map((o) => o.id)).size).toBe(size);
  expect(new Set(q.options.map((o) => o.label)).size).toBe(size);
  expect(q.options.map((o) => o.id)).toContain(q.correctId);
  for (const o of q.options) {
    expect(String(o.label)).not.toMatch(/undefined|null|NaN|Unknown/);
  }
}

/** Fraction of questions whose correct answer sits at each option index. */
export function positionShares(questions) {
  const counts = [0, 0, 0, 0];
  for (const q of questions) counts[q.options.findIndex((o) => o.id === q.correctId)]++;
  return counts.map((c) => c / questions.length);
}
