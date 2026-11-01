import { people } from "../../data/history/people.js";
import { events } from "../../data/history/events.js";
import { inventions } from "../../data/history/inventions.js";
import { artworks } from "../../data/history/artworks.js";
import { hasImage, imageMedia } from "../../data/images.js";
import { shuffle, randInt, pickOne, pickDistractors, cycler } from "../../lib/random.js";
import { formatYear, parseYear } from "../../lib/format.js";
import { historyText, movementName, artistName, spellingsOf, ARTISTS, MOVEMENTS } from "../../data/history/i18n/index.js";

export const HISTORY_MODES = ["people", "who-first", "events", "inventions", "art"];
const CURRENT_YEAR = new Date().getFullYear();

const portraitPeople = people.filter(hasImage);
const pictureArtworks = artworks.filter(hasImage);

/** Distractors by "category": easy = other categories, medium = 1 same, hard = all same. */
function tieredDistractors(correct, all, { sameAs, keyOf, difficulty }) {
  const others = all.filter((x) => keyOf(x) !== keyOf(correct));
  const same = others.filter((x) => sameAs(x, correct));
  const diff = others.filter((x) => !sameAs(x, correct));
  const tiers =
    difficulty === "easy" ? [{ items: diff, take: 3 }]
    : difficulty === "medium" ? [{ items: same, take: 1 }, { items: diff, take: 3 }]
    : [{ items: same, take: 3 }];
  return pickDistractors({ correctKey: keyOf(correct), tiers, fallback: others, keyOf });
}

/**
 * Four year options evenly spaced by `step`, with the correct year at a
 * uniformly random position, never in the future and never "year 0".
 */
export function yearOptions(year, difficulty) {
  const step = { easy: 50, medium: 15, hard: 5 }[difficulty] ?? 5;
  const valid = (y) => y !== 0 && y <= CURRENT_YEAR;
  const positions = shuffle([0, 1, 2, 3]);
  for (const k of positions) {
    const opts = [0, 1, 2, 3].map((i) => year + (i - k) * step);
    if (opts.every(valid)) return opts;
  }
  // Very recent events: fall back to earlier years only.
  return [0, 1, 2, 3].map((i) => year - i * step).map((y) => (y === 0 ? -1 : y));
}

function yearQuestion(base, year, difficulty, t) {
  if (difficulty === "expert") {
    return {
      ...base, kind: "text", placeholder: t.hist.typeYear,
      check: (input) => parseYear(input) === year,
    };
  }
  const opts = yearOptions(year, difficulty).map((y) => ({ id: String(y), label: formatYear(y, t.hist) }));
  return { ...base, kind: "choice", options: shuffle(opts), correctId: String(year) };
}

function nameQuestion(base, correctLabel, distractorLabels, difficulty, placeholder, { surname = true, accepted } = {}) {
  if (difficulty === "expert") {
    return { ...base, kind: "text", accepted: accepted ?? [correctLabel], match: { surname }, placeholder };
  }
  const opts = [correctLabel, ...distractorLabels].map((l) => ({ id: l, label: l }));
  return { ...base, kind: "choice", options: shuffle(opts), correctId: correctLabel };
}

// ── Builders ───────────────────────────────────────────────────────────────
const L = (t) => t.lang ?? "en";

function buildPeople(person, difficulty, t) {
  const lang = L(t);
  const nameOf = (p) => historyText("people", p, lang).name;
  const { name, d } = historyText("people", person, lang);
  const wrong = tieredDistractors(person, portraitPeople, {
    sameAs: (a, b) => a.field === b.field, keyOf: nameOf, difficulty,
  }).map(nameOf);
  const died = person.died ?? "";
  return nameQuestion(
    {
      key: `people:${person.id}`, type: "people", prompt: t.hist.whoIsThis,
      media: imageMedia(person, "?"), correctLabel: name,
      note: `${name} (${formatYear(person.born, t.hist)}–${died === "" ? "" : formatYear(died, t.hist)}): ${d}`,
      review: { title: t.hist.whoIsThis },
    },
    name, wrong, difficulty, t.hist.typeName, { accepted: [...new Set([name, person.name])] },
  );
}

const MIN_GAP = { easy: 150, medium: 40, hard: 10, expert: 3 };

function whoFirstItem(item, t) {
  const lang = L(t);
  return item.event
    ? { id: `e:${item.id}`, label: historyText("events", item, lang).name, year: item.year }
    : { id: `p:${item.id}`, label: t.hist.born(historyText("people", item, lang).name), year: item.born };
}

function buildWhoFirst(a, b, t) {
  const [x, y] = shuffle([whoFirstItem(a, t), whoFirstItem(b, t)]);
  const first = x.year < y.year ? x : y;
  return {
    key: `who-first:${x.id}-${y.id}`, type: "who-first", kind: "compare", prompt: t.hist.whichFirst,
    items: [x, y].map((i) => ({ id: i.id, label: i.label, value: formatYear(i.year, t.hist) })),
    correctId: first.id,
    verdicts: { correct: t.earlier, other: t.later },
    correctLabel: first.label,
    review: { title: `${x.label} ${t.vs} ${y.label}` },
  };
}

/** Pairs with a clear (difficulty-dependent) gap and never a tie. */
function whoFirstPair(pool, difficulty, nextItem) {
  const gap = MIN_GAP[difficulty] ?? MIN_GAP.medium;
  const yearOf = (i) => i.year ?? i.born;
  const a = nextItem();
  const candidates = pool.filter((b) => b !== a && Math.abs(yearOf(b) - yearOf(a)) >= gap);
  // Hard/expert: prefer the closest valid gaps so the question is actually hard.
  if ((difficulty === "hard" || difficulty === "expert") && candidates.length) {
    const sorted = [...candidates].sort((p, q) => Math.abs(yearOf(p) - yearOf(a)) - Math.abs(yearOf(q) - yearOf(a)));
    return [a, pickOne(sorted.slice(0, 8))];
  }
  return [a, pickOne(candidates.length ? candidates : pool.filter((b) => yearOf(b) !== yearOf(a)))];
}

function buildEvent(event, difficulty, t) {
  const { name, d } = historyText("events", event, L(t));
  return yearQuestion(
    {
      key: `events:${event.id}`, type: "events", prompt: t.hist.whenHappened(name),
      correctLabel: formatYear(event.year, t.hist), note: d,
      review: { title: name },
    },
    event.year, difficulty, t,
  );
}

function buildInvention(inv, difficulty, variant, t) {
  const lang = L(t);
  const { name, d, inventor } = historyText("inventions", inv, lang);
  if (variant === "inventor") {
    const inventorOf = (i) => historyText("inventions", i, lang).inventor;
    const wrong = tieredDistractors(inv, inventions, {
      sameAs: (a, b) => a.field === b.field, keyOf: inventorOf, difficulty,
    }).map(inventorOf);
    return nameQuestion(
      {
        key: `inventions:inventor:${inv.id}`, type: "inventions", prompt: t.hist.whoInvented(name),
        correctLabel: inventor, note: `${name} (${formatYear(inv.year, t.hist)}): ${d}`,
        review: { title: t.hist.whoInvented(name) },
      },
      inventor, wrong, difficulty, t.hist.typeInventor, { accepted: [...new Set([inventor, inv.inventor])] },
    );
  }
  return yearQuestion(
    {
      key: `inventions:year:${inv.id}`, type: "inventions", prompt: t.hist.whenInvented(name),
      correctLabel: formatYear(inv.year, t.hist), note: `${name} — ${inventor}. ${d}`,
      review: { title: t.hist.whenInvented(name) },
    },
    inv.year, difficulty, t,
  );
}

function buildArt(art, difficulty, variant, t) {
  const lang = L(t);
  const { name: title, d } = historyText("artworks", art, lang);
  const artist = artistName(art.artist, lang);
  const movement = movementName(art.movement, lang);
  const quoted = lang === "fr" ? `« ${title} »` : lang === "es" ? `«${title}»` : `“${title}”`;
  const note = `${quoted} — ${artist} (${formatYear(art.year, t.hist)}), ${movement}. ${d}`;
  const media = imageMedia(art, "?");
  if (variant === "artist") {
    const wrong = tieredDistractors(art, artworks, {
      sameAs: (a, b) => a.movement === b.movement, keyOf: (a) => a.artist, difficulty,
    }).map((a) => artistName(a.artist, lang));
    return nameQuestion(
      { key: `art:artist:${art.id}`, type: "art", prompt: t.hist.whoCreated, media, correctLabel: artist, note, review: { title } },
      artist, wrong, difficulty, t.hist.typeArtist, { accepted: spellingsOf(ARTISTS, art.artist) },
    );
  }
  const movements = [...new Set(artworks.map((a) => a.movement))];
  const wrong = pickDistractors({ correctKey: art.movement, tiers: [{ items: movements }] }).map((m) => movementName(m, lang));
  return nameQuestion(
    { key: `art:movement:${art.id}`, type: "art", prompt: t.hist.whatMovement, media, correctLabel: movement, note, review: { title } },
    movement, wrong, difficulty, t.hist.typeMovement, { surname: false, accepted: spellingsOf(MOVEMENTS, art.movement) },
  );
}

// ── Round builder ──────────────────────────────────────────────────────────
export function buildRound(settings, t) {
  const { mode, difficulty = "medium", roundSize: count = 10 } = settings;
  const variant = () => (Math.random() < 0.5 ? "a" : "b");

  const whoFirstPool = [...people, ...events];
  const next = {
    people: cycler(portraitPeople),
    events: cycler(events),
    inventions: cycler(inventions),
    art: cycler(pictureArtworks),
    "who-first": cycler(whoFirstPool),
  };
  const builders = {
    people: () => buildPeople(next.people(), difficulty, t),
    events: () => buildEvent(next.events(), difficulty, t),
    inventions: () => buildInvention(next.inventions(), difficulty, variant() === "a" ? "inventor" : "year", t),
    art: () => buildArt(next.art(), difficulty, variant() === "a" ? "artist" : "movement", t),
    "who-first": () => buildWhoFirst(...whoFirstPair(whoFirstPool, difficulty, next["who-first"]), t),
  };
  const poolSize = {
    people: portraitPeople.length, events: events.length, inventions: inventions.length,
    art: pictureArtworks.length, "who-first": Infinity,
  };

  const out = [];
  const keys = new Set();
  const types = mode === "history-mixed" ? null : [mode];
  if (types && !builders[mode]) return [];
  const limit = types ? Math.min(count, poolSize[mode]) : count;
  for (let attempts = 0; out.length < limit && attempts < limit * 5; attempts++) {
    const type = types ? mode : HISTORY_MODES[randInt(0, HISTORY_MODES.length - 1)];
    const q = builders[type]();
    if (!q || keys.has(q.key)) continue;
    keys.add(q.key);
    out.push(q);
  }
  return out;
}
