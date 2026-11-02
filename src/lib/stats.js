// Per-question answer statistics, kept privacy-friendly:
//   - always: aggregated counts in this browser's localStorage ({ key: [answered, correct] });
//   - only if the site is built with VITE_STATS_ENDPOINT set and the browser does not send
//     Do Not Track: anonymous events { k, d, c, ms } (question key, difficulty, correct, time)
//     batched with navigator.sendBeacon. No user id, cookies, or free-text answers are sent.
// scripts/calibrate.mjs turns collected stats into src/data/generated/calibration.json.
import { load, save } from "./storage.js";

const KEY = "stats:v1";
const MAX_KEYS = 5000;
const BATCH = 10;
const ENDPOINT = import.meta.env?.VITE_STATS_ENDPOINT || null;
let queue = [];

/** Stable key for a question, or null when it should not be counted (practice retries). */
export function statsKey(subject, question) {
  if (!question || question.isRetry) return null;
  // Logic questions are generated on the fly: only the question type is meaningful.
  if (subject === "logic") return `logic:${question.type}`;
  return `${subject}:${question.key}`;
}

function remoteEnabled() {
  if (!ENDPOINT || typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  return navigator.doNotTrack !== "1" && globalThis.doNotTrack !== "1";
}

export function flushStats() {
  if (!queue.length || !remoteEnabled()) { queue = []; return; }
  const body = JSON.stringify({ v: 1, events: queue });
  queue = [];
  try { navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" })); } catch { /* best effort */ }
}

export function recordAnswer({ subject, difficulty, question, correct, ms }) {
  const key = statsKey(subject, question);
  if (!key) return;
  const all = load(KEY, {});
  const entry = all[key] ?? [0, 0];
  entry[0] += 1;
  if (correct) entry[1] += 1;
  all[key] = entry;
  const keys = Object.keys(all);
  if (keys.length > MAX_KEYS) for (const k of keys.slice(0, keys.length - MAX_KEYS)) delete all[k];
  save(KEY, all);

  if (remoteEnabled()) {
    queue.push({ k: key, d: difficulty, c: correct ? 1 : 0, ms: Math.round(ms ?? 0) });
    if (queue.length >= BATCH) flushStats();
  }
}

/** This browser's aggregated stats: { key: [answered, correct] }. */
export function localStats() {
  return load(KEY, {});
}

if (typeof window !== "undefined") window.addEventListener("pagehide", flushStats);
