import { countries, getByRegion } from "../data/countries";
import { countryPaths } from "../data/countryPaths";
import { countriesExtra } from "../data/countriesExtra";

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build N plausible distractors for a correct answer.
 * Biases toward same region at Easy/Medium difficulty.
 */
export function getDistractors(correct, pool, count, difficulty) {
  const sameRegion = pool.filter((c) => c.code !== correct.code && c.region === correct.region);
  const otherRegion = pool.filter((c) => c.code !== correct.code && c.region !== correct.region);

  let candidates;
  if (difficulty === "easy") {
    // Different region so flags/capitals look more distinct
    candidates = shuffle(otherRegion);
  } else if (difficulty === "medium") {
    candidates = shuffle([...sameRegion.slice(0, Math.ceil(count / 2)), ...otherRegion]);
  } else {
    // Hard: same region distractors
    candidates = shuffle([...sameRegion, ...otherRegion]);
  }

  return candidates.slice(0, count);
}

export function buildQuestion(type, country, pool, difficulty) {
  const distractors = getDistractors(country, pool, 3, difficulty);
  const options = shuffle([country, ...distractors]);

  if (type === "flags") {
    return {
      type,
      prompt: "Which country does this flag belong to?",
      flagCode: country.code,
      correct: country,
      options,
      answerKey: "name",
    };
  }

  if (type === "capitals") {
    return {
      type,
      prompt: `What is the capital of ${country.name}?`,
      flagCode: country.code,
      correct: country,
      options,
      answerKey: "capital",
    };
  }

  if (type === "locate") {
    return {
      type,
      prompt: `Find ${country.name} on the map`,
      correct: country,
      options: null,
    };
  }

  if (type === "shapes") {
    return {
      type,
      prompt: "Which country has this shape?",
      correct: country,
      options,
    };
  }

  if (type === "languages") {
    const extra = countriesExtra[country.code];
    if (!extra) return null;
    const correctLang = extra.language;
    // Build language distractors from same pool
    const otherLangs = [...new Set(
      distractors
        .map((c) => countriesExtra[c.code]?.language)
        .filter((l) => l && l !== correctLang)
    )].slice(0, 3);
    while (otherLangs.length < 3) {
      // fallback: pick from all countries
      const fallbacks = ["Spanish", "French", "Arabic", "English", "Mandarin", "Portuguese", "Russian", "Hindi", "Bengali", "German"];
      const fb = fallbacks.find((l) => l !== correctLang && !otherLangs.includes(l));
      if (fb) otherLangs.push(fb);
      else break;
    }
    const langOptions = shuffle([correctLang, ...otherLangs]);
    return {
      type,
      prompt: `What is an official language of ${country.name}?`,
      flagCode: country.code,
      correct: { ...country, language: correctLang },
      options: langOptions,
    };
  }

  return null;
}

export function buildCompareQuestion(type, left, right) {
  const label = type === "population" ? "population" : "area";
  return {
    type,
    prompt: `Which country has the larger ${label}?`,
    left,
    right,
  };
}

export function buildRound({ mode, region, difficulty, count = 10, mixedModes }) {
  const fullPool = getByRegion(region);
  // Shapes and Locate both require a topology entry (110m resolution excludes small islands)
  const topoPool = fullPool.filter((c) => !!countryPaths[c.code]);
  const shapesPool = topoPool;
  const locatePool = topoPool;
  // Languages/compare require extra data
  const extraPool = fullPool.filter((c) => !!countriesExtra[c.code]);

  const COUNTRY_TYPES = ["flags", "capitals", "locate", "shapes", "languages"];
  const COMPARE_TYPES = ["population", "area"];
  const ALL_TYPES = [...COUNTRY_TYPES, ...COMPARE_TYPES];

  if (mode === "shapes") {
    const selected = shuffle(shapesPool).slice(0, Math.min(count, shapesPool.length));
    return selected.map((country) =>
      buildQuestion("shapes", country, shapesPool, difficulty)
    );
  }

  if (mode === "locate") {
    const selected = shuffle(locatePool).slice(0, Math.min(count, locatePool.length));
    return selected.map((country) =>
      buildQuestion("locate", country, locatePool, difficulty)
    );
  }

  if (mode === "languages") {
    const selected = shuffle(extraPool).slice(0, Math.min(count, extraPool.length));
    return selected.map((country) =>
      buildQuestion("languages", country, extraPool, difficulty)
    ).filter(Boolean);
  }

  if (mode === "population" || mode === "area") {
    const enriched = extraPool.map((c) => ({ ...c, ...countriesExtra[c.code] }));
    const selected = shuffle(enriched);
    const pairs = [];
    for (let i = 0; i + 1 < selected.length && pairs.length < count; i += 2) {
      pairs.push(buildCompareQuestion(mode, selected[i], selected[i + 1]));
    }
    return pairs;
  }

  if (mode === "mixed") {
    // mixedModes defaults to all types if not specified
    const activeModes = mixedModes && mixedModes.length > 0 ? mixedModes : ALL_TYPES;
    const activeCountryTypes = activeModes.filter((t) => COUNTRY_TYPES.includes(t));
    const activeCompareTypes = activeModes.filter((t) => COMPARE_TYPES.includes(t));

    // Assign a random type to each slot
    const slots = Array.from({ length: count }, () =>
      activeModes[Math.floor(Math.random() * activeModes.length)]
    );

    // Build country-based questions
    const enrichedPool = extraPool.map((c) => ({ ...c, ...countriesExtra[c.code] }));
    const countrySlots = slots.filter((t) => COUNTRY_TYPES.includes(t));
    const compareSlots = slots.filter((t) => COMPARE_TYPES.includes(t));

    const countrySelected = shuffle(fullPool).slice(0, Math.min(countrySlots.length, fullPool.length));
    const compareSelected = shuffle(enrichedPool);

    let ci = 0; // country index
    let pi = 0; // compare pair index

    return slots.map((type) => {
      if (COUNTRY_TYPES.includes(type)) {
        const country = countrySelected[ci % countrySelected.length];
        ci++;
        // For types that need filtered pools, fall back to flags if country not in pool
        if ((type === "shapes" || type === "locate") && !countryPaths[country.code]) {
          return buildQuestion("flags", country, fullPool, difficulty);
        }
        if (type === "languages" && !countriesExtra[country.code]) {
          return buildQuestion("flags", country, fullPool, difficulty);
        }
        const pool = type === "shapes" ? shapesPool
          : type === "locate" ? locatePool
          : type === "languages" ? extraPool
          : fullPool;
        return buildQuestion(type, country, pool, difficulty);
      } else {
        // compare type
        const a = compareSelected[(pi * 2) % compareSelected.length];
        const b = compareSelected[(pi * 2 + 1) % compareSelected.length] ?? compareSelected[0];
        pi++;
        return buildCompareQuestion(type, a, b);
      }
    }).filter(Boolean);
  }

  const selected = shuffle(fullPool).slice(0, Math.min(count, fullPool.length));
  return selected.map((country) => buildQuestion(mode, country, fullPool, difficulty));
}

export function flagUrl(code) {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}
