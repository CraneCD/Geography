import { countries, getByRegion } from "../data/countries";

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

  return null;
}

export function buildRound({ mode, region, difficulty, count = 10 }) {
  const pool = getByRegion(region);
  const shuffled = shuffle(pool);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  const types = ["flags", "capitals", "locate", "shapes"];

  return selected.map((country) => {
    let type;
    if (mode === "mixed") {
      type = types[Math.floor(Math.random() * types.length)];
    } else {
      type = mode;
    }
    return buildQuestion(type, country, pool, difficulty);
  });
}

export function flagUrl(code) {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}
