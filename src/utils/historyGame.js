import { people } from "../data/history/people";
import { events } from "../data/history/events";
import { inventions } from "../data/history/inventions";
import { artworks } from "../data/history/artworks";
import { shuffle } from "./game";

// ── Distractor helpers ──────────────────────────────────────────────────────

function getPeopleDistractors(correct, count, difficulty) {
  const sameField = people.filter((p) => p.id !== correct.id && p.field === correct.field);
  const otherField = people.filter((p) => p.id !== correct.id && p.field !== correct.field);
  const pool = difficulty === "easy"
    ? shuffle(otherField)
    : difficulty === "medium"
    ? shuffle([...sameField.slice(0, Math.ceil(count / 2)), ...otherField])
    : shuffle([...sameField, ...otherField]);
  return pool.slice(0, count);
}

function getArtworkDistractors(correct, count, difficulty) {
  const same = artworks.filter((a) => a.id !== correct.id && a.movement === correct.movement);
  const other = artworks.filter((a) => a.id !== correct.id && a.movement !== correct.movement);
  const pool = difficulty === "hard"
    ? shuffle([...same, ...other])
    : shuffle([...same.slice(0, 1), ...other]);
  return pool.slice(0, count);
}

function getInventionDistractors(correct, count, difficulty) {
  const same = inventions.filter((i) => i.id !== correct.id && i.field === correct.field);
  const other = inventions.filter((i) => i.id !== correct.id && i.field !== correct.field);
  const pool = difficulty === "hard"
    ? shuffle([...same, ...other])
    : shuffle([...same.slice(0, 1), ...other]);
  return pool.slice(0, count);
}

// Year options for events quiz — spread depends on difficulty
function getEventYearOptions(correct, difficulty) {
  const year = correct.year;
  let spread, step;
  if (difficulty === "easy") { spread = 200; step = 50; }
  else if (difficulty === "medium") { spread = 50; step = 15; }
  else { spread = 20; step = 5; }

  const options = new Set([year]);
  const directions = [-1, 1, -2, 2, -3, 3];
  for (const d of directions) {
    const candidate = year + d * step;
    // Don't cross BC/AD boundary awkwardly
    if (options.size < 4) options.add(candidate);
  }
  return shuffle([...options]).slice(0, 4);
}

// ── Question builders ───────────────────────────────────────────────────────

function buildPeopleQuestion(person, difficulty) {
  const distractors = getPeopleDistractors(person, 3, difficulty);
  const options = shuffle([person, ...distractors]);
  return {
    type: "people",
    prompt: "Who is this person?",
    wikiTitle: person.wikiTitle,
    correct: person,
    options,
    description: `${person.name} (${person.born}–${person.died ?? "present"}): ${person.description}`,
  };
}

function buildWhoFirstQuestion(itemA, itemB) {
  const yearA = itemA.born ?? itemA.year;
  const yearB = itemB.born ?? itemB.year;
  return {
    type: "who-first",
    prompt: "Which came first?",
    left: { ...itemA, year: yearA, displayName: itemA.name ?? itemA.event },
    right: { ...itemB, year: yearB, displayName: itemB.name ?? itemB.event },
  };
}

function buildEventQuestion(event, difficulty) {
  const yearOptions = getEventYearOptions(event, difficulty);
  return {
    type: "events",
    prompt: event.event,
    description: event.description,
    correct: event,
    options: yearOptions,
    answerKey: "year",
    category: event.category,
  };
}

function buildInventionQuestion(invention, difficulty, variant = "inventor") {
  if (variant === "inventor") {
    const distractors = getInventionDistractors(invention, 3, difficulty);
    const inventorOptions = shuffle([invention, ...distractors]).map((i) => i.inventor);
    // Deduplicate (rare but possible)
    const unique = [...new Set(inventorOptions)].slice(0, 4);
    while (unique.length < 4) unique.push("Unknown"); // safety
    return {
      type: "inventions",
      variant: "inventor",
      prompt: `Who invented the ${invention.invention}?`,
      description: `${invention.invention} (${invention.year}): ${invention.description}`,
      correct: invention,
      options: unique,
      answerKey: "inventor",
    };
  } else {
    // variant: "year"
    const yearOptions = getEventYearOptions({ year: invention.year }, difficulty);
    return {
      type: "inventions",
      variant: "year",
      prompt: `When was the ${invention.invention} invented?`,
      description: `${invention.invention}: ${invention.description} Invented by ${invention.inventor}.`,
      correct: invention,
      options: yearOptions,
      answerKey: "year",
    };
  }
}

function buildArtQuestion(artwork, difficulty, variant = "artist") {
  if (variant === "artist") {
    const distractors = getArtworkDistractors(artwork, 3, difficulty);
    const artistOptions = shuffle([artwork, ...distractors]).map((a) => a.artist);
    const unique = [...new Set(artistOptions)].slice(0, 4);
    while (unique.length < 4) unique.push("Unknown");
    return {
      type: "art",
      variant: "artist",
      prompt: "Who created this artwork?",
      wikiTitle: artwork.wikiTitle,
      description: `"${artwork.title}" by ${artwork.artist} (${artwork.year}) — ${artwork.movement}. ${artwork.description}`,
      correct: artwork,
      options: unique,
      answerKey: "artist",
    };
  } else {
    // variant: "movement"
    const movements = [...new Set(artworks.map((a) => a.movement))];
    const otherMovements = shuffle(movements.filter((m) => m !== artwork.movement));
    const movementOptions = shuffle([artwork.movement, ...otherMovements.slice(0, 3)]);
    return {
      type: "art",
      variant: "movement",
      prompt: "What artistic movement is this?",
      wikiTitle: artwork.wikiTitle,
      description: `"${artwork.title}" by ${artwork.artist} (${artwork.year}) — ${artwork.movement}. ${artwork.description}`,
      correct: artwork,
      options: movementOptions,
      answerKey: "movement",
    };
  }
}

// ── Round builder ───────────────────────────────────────────────────────────

const ALL_HISTORY_MODES = ["people", "who-first", "events", "inventions", "art"];

export function buildHistoryRound({ mode, difficulty = "medium", count = 10 }) {
  if (mode === "people") {
    return shuffle(people).slice(0, count).map((p) => buildPeopleQuestion(p, difficulty));
  }

  if (mode === "who-first") {
    const pool = shuffle([...people, ...events.map((e) => ({ ...e, name: e.event }))]);
    const questions = [];
    for (let i = 0; i + 1 < pool.length && questions.length < count; i += 2) {
      questions.push(buildWhoFirstQuestion(pool[i], pool[i + 1]));
    }
    return questions;
  }

  if (mode === "events") {
    return shuffle(events).slice(0, count).map((e) => buildEventQuestion(e, difficulty));
  }

  if (mode === "inventions") {
    return shuffle(inventions).slice(0, count).map((inv, i) =>
      buildInventionQuestion(inv, difficulty, i % 2 === 0 ? "inventor" : "year")
    );
  }

  if (mode === "art") {
    return shuffle(artworks).slice(0, count).map((a, i) =>
      buildArtQuestion(a, difficulty, i % 2 === 0 ? "artist" : "movement")
    );
  }

  if (mode === "history-mixed") {
    const slots = Array.from({ length: count }, () =>
      ALL_HISTORY_MODES[Math.floor(Math.random() * ALL_HISTORY_MODES.length)]
    );
    const pPool = shuffle(people);
    const ePool = shuffle(events);
    const invPool = shuffle(inventions);
    const aPool = shuffle(artworks);
    let pi = 0, ei = 0, ii = 0, ai = 0;
    return slots.map((type) => {
      if (type === "people") return buildPeopleQuestion(pPool[pi++ % pPool.length], difficulty);
      if (type === "who-first") {
        const a = pPool[pi++ % pPool.length];
        const b = ePool[ei++ % ePool.length];
        return buildWhoFirstQuestion(a, { ...b, name: b.event });
      }
      if (type === "events") return buildEventQuestion(ePool[ei++ % ePool.length], difficulty);
      if (type === "inventions") return buildInventionQuestion(invPool[ii++ % invPool.length], difficulty, ii % 2 === 0 ? "inventor" : "year");
      if (type === "art") return buildArtQuestion(aPool[ai++ % aPool.length], difficulty, ai % 2 === 0 ? "artist" : "movement");
      return null;
    }).filter(Boolean);
  }

  return [];
}
