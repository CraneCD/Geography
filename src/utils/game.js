import { getByRegion } from "../data/countries";
import { countryPaths } from "../data/countryPaths";
import { countriesExtra } from "../data/countriesExtra";
import { countryTranslations } from "../data/countryTranslations";
import { strings } from "../i18n/strings.jsx";
import { shuffle } from "./shuffle";

export { shuffle };

// Return a country object with its name translated to the given language
function translate(country, lang) {
  if (!lang || lang === "en") return country;
  const t = countryTranslations[country.code];
  if (!t || !t[lang]) return country;
  return { ...country, name: t[lang] };
}

function translatePool(pool, lang) {
  if (!lang || lang === "en") return pool;
  return pool.map((c) => translate(c, lang));
}

// Cache each pool's countries grouped by region so repeated getDistractors
// calls within a round don't re-filter the whole pool per question.
const regionGroupsCache = new WeakMap();

function getRegionGroups(pool) {
  let groups = regionGroupsCache.get(pool);
  if (!groups) {
    groups = new Map();
    for (const c of pool) {
      const list = groups.get(c.region);
      if (list) list.push(c);
      else groups.set(c.region, [c]);
    }
    regionGroupsCache.set(pool, groups);
  }
  return groups;
}

export function getDistractors(correct, pool, count, difficulty) {
  const groups = getRegionGroups(pool);
  const sameRegion = (groups.get(correct.region) ?? []).filter((c) => c.code !== correct.code);
  const otherRegion = [];
  for (const [region, list] of groups) {
    if (region !== correct.region) otherRegion.push(...list);
  }

  let candidates;
  if (difficulty === "easy") {
    candidates = shuffle(otherRegion);
  } else if (difficulty === "medium") {
    candidates = shuffle([...sameRegion.slice(0, Math.ceil(count / 2)), ...otherRegion]);
  } else {
    candidates = shuffle([...sameRegion, ...otherRegion]);
  }

  return candidates.slice(0, count);
}

export function buildQuestion(type, country, pool, difficulty, lang = "en") {
  const s = strings[lang] ?? strings.en;
  const distractors = getDistractors(country, pool, 3, difficulty);
  const options = shuffle([country, ...distractors]);

  if (type === "flags") {
    return {
      type,
      prompt: s.flagPrompt,
      flagCode: country.code,
      correct: country,
      options,
      answerKey: "name",
    };
  }

  if (type === "capitals") {
    return {
      type,
      prompt: s.capitalPrompt(country.name),
      flagCode: country.code,
      correct: country,
      options,
      answerKey: "capital",
    };
  }

  if (type === "locate") {
    return {
      type,
      prompt: s.locatePrompt(country.name),
      correct: country,
      options: null,
    };
  }

  if (type === "shapes") {
    return {
      type,
      prompt: s.shapePrompt,
      correct: country,
      options,
    };
  }

  if (type === "languages") {
    const extra = countriesExtra[country.code];
    if (!extra) return null;
    const correctLang = extra.language;
    const otherLangs = [...new Set(
      distractors
        .map((c) => countriesExtra[c.code]?.language)
        .filter((l) => l && l !== correctLang)
    )].slice(0, 3);
    while (otherLangs.length < 3) {
      const fallbacks = ["Spanish", "French", "Arabic", "English", "Mandarin", "Portuguese", "Russian", "Hindi", "Bengali", "German"];
      const fb = fallbacks.find((l) => l !== correctLang && !otherLangs.includes(l));
      if (fb) otherLangs.push(fb);
      else break;
    }
    const langOptions = shuffle([correctLang, ...otherLangs]);
    return {
      type,
      prompt: s.languagePrompt(country.name),
      flagCode: country.code,
      correct: { ...country, language: correctLang },
      options: langOptions,
    };
  }

  return null;
}

export function buildCompareQuestion(type, left, right, lang = "en") {
  const s = strings[lang] ?? strings.en;
  return {
    type,
    prompt: type === "population" ? s.populationPrompt : s.areaPrompt,
    left,
    right,
  };
}

export function buildRound({ mode, region, difficulty, count = 10, mixedModes, lang = "en" }) {
  const rawPool = getByRegion(region);
  // Apply translations to country names throughout
  const fullPool = translatePool(rawPool, lang);
  const topoPool = fullPool.filter((c) => !!countryPaths[c.code]);
  const shapesPool = topoPool;
  const locatePool = topoPool;
  const extraPool = fullPool.filter((c) => !!countriesExtra[c.code]);

  const COUNTRY_TYPES = ["flags", "capitals", "locate", "shapes", "languages"];
  const COMPARE_TYPES = ["population", "area"];
  const ALL_TYPES = [...COUNTRY_TYPES, ...COMPARE_TYPES];

  if (mode === "shapes") {
    const selected = shuffle(shapesPool).slice(0, Math.min(count, shapesPool.length));
    return selected.map((country) => buildQuestion("shapes", country, shapesPool, difficulty, lang));
  }

  if (mode === "locate") {
    const selected = shuffle(locatePool).slice(0, Math.min(count, locatePool.length));
    return selected.map((country) => buildQuestion("locate", country, locatePool, difficulty, lang));
  }

  if (mode === "languages") {
    const selected = shuffle(extraPool).slice(0, Math.min(count, extraPool.length));
    return selected.map((country) =>
      buildQuestion("languages", country, extraPool, difficulty, lang)
    ).filter(Boolean);
  }

  if (mode === "population" || mode === "area") {
    const enriched = extraPool.map((c) => ({ ...c, ...countriesExtra[c.code] }));
    const selected = shuffle(enriched);
    const pairs = [];
    for (let i = 0; i + 1 < selected.length && pairs.length < count; i += 2) {
      pairs.push(buildCompareQuestion(mode, selected[i], selected[i + 1], lang));
    }
    return pairs;
  }

  if (mode === "mixed") {
    const activeModes = mixedModes && mixedModes.length > 0 ? mixedModes : ALL_TYPES;
    const slots = Array.from({ length: count }, () =>
      activeModes[Math.floor(Math.random() * activeModes.length)]
    );
    const countrySlots = slots.filter((t) => COUNTRY_TYPES.includes(t));
    const countrySelected = shuffle(fullPool).slice(0, Math.min(countrySlots.length, fullPool.length));
    // Only build the enriched compare pool if the round actually drew compare slots
    const hasCompareSlots = countrySlots.length < slots.length;
    const compareSelected = hasCompareSlots
      ? shuffle(extraPool.map((c) => ({ ...c, ...countriesExtra[c.code] })))
      : [];
    let ci = 0;
    let pi = 0;
    return slots.map((type) => {
      if (COUNTRY_TYPES.includes(type)) {
        const country = countrySelected[ci % countrySelected.length];
        ci++;
        if ((type === "shapes" || type === "locate") && !countryPaths[country.code]) {
          return buildQuestion("flags", country, fullPool, difficulty, lang);
        }
        if (type === "languages" && !countriesExtra[country.code]) {
          return buildQuestion("flags", country, fullPool, difficulty, lang);
        }
        const pool = type === "shapes" ? shapesPool
          : type === "locate" ? locatePool
          : type === "languages" ? extraPool
          : fullPool;
        return buildQuestion(type, country, pool, difficulty, lang);
      } else {
        const a = compareSelected[(pi * 2) % compareSelected.length];
        const b = compareSelected[(pi * 2 + 1) % compareSelected.length] ?? compareSelected[0];
        pi++;
        return buildCompareQuestion(type, a, b, lang);
      }
    }).filter(Boolean);
  }

  const selected = shuffle(fullPool).slice(0, Math.min(count, fullPool.length));
  return selected.map((country) => buildQuestion(mode, country, fullPool, difficulty, lang));
}

export function flagUrl(code) {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}
