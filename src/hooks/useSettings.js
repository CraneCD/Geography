import { useState, useCallback } from "react";
import { load, save } from "../lib/storage.js";
import { MIXABLE_MODES } from "../subjects/catalog.js";

export const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
export const ROUND_SIZES = [5, 10, 15, 20];
export const TIMER_OPTIONS = [null, 10, 20, 30, 60];
export const REGIONS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"];
const LANGS = ["en", "es", "fr"];

function browserLang() {
  const nav = globalThis.navigator?.language?.slice(0, 2);
  return LANGS.includes(nav) ? nav : "en";
}

export const DEFAULT_SETTINGS = {
  lang: "en",
  region: "All",
  difficulty: "medium",
  roundSize: 10,
  timer: null,
  practice: false,
  mixedModes: MIXABLE_MODES,
};

/** Merge stored settings onto defaults, discarding anything invalid. */
export function sanitize(raw) {
  const s = { ...DEFAULT_SETTINGS, lang: browserLang() };
  if (!raw || typeof raw !== "object") return s;
  if (LANGS.includes(raw.lang)) s.lang = raw.lang;
  if (REGIONS.includes(raw.region)) s.region = raw.region;
  if (DIFFICULTIES.includes(raw.difficulty)) s.difficulty = raw.difficulty;
  if (ROUND_SIZES.includes(raw.roundSize)) s.roundSize = raw.roundSize;
  if (TIMER_OPTIONS.includes(raw.timer)) s.timer = raw.timer;
  if (typeof raw.practice === "boolean") s.practice = raw.practice;
  if (Array.isArray(raw.mixedModes)) {
    const valid = raw.mixedModes.filter((m) => MIXABLE_MODES.includes(m));
    if (valid.length >= 2) s.mixedModes = valid;
  }
  return s;
}

export function useSettings() {
  const [settings, setSettings] = useState(() => sanitize(load("settings", null)));
  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = sanitize({ ...prev, ...patch });
      save("settings", next);
      return next;
    });
  }, []);
  return [settings, update];
}
