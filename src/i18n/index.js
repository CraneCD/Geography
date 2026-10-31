import en from "./en.js";
import es from "./es.js";
import fr from "./fr.js";

export const LANGUAGES = [
  { code: "en", label: en.langName },
  { code: "es", label: es.langName },
  { code: "fr", label: fr.langName },
];

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Deep-merge `override` onto `base` so any missing key falls back to English. */
function withFallback(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = isPlainObject(v) && isPlainObject(base[k]) ? withFallback(base[k], v) : v;
  }
  return out;
}

const cache = { en: { ...en, lang: "en" } };

/** Returns the string table for `lang` (English fallback for missing keys). */
export function getStrings(lang) {
  if (!cache[lang]) {
    const table = { es, fr }[lang];
    cache[lang] = table ? { ...withFallback(en, table), lang } : cache.en;
  }
  return cache[lang];
}
