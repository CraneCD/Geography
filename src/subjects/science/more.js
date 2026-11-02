// Science & Nature: animal traits, body systems and space missions. Every wrong option
// says why it is wrong (an example of what it really is).
import { ANIMALS } from "../../data/science/animals.js";
import { BODY_REGIONS } from "../../data/science/body.js";
import { ANIMAL_NAMES, localize } from "../../data/science/names.js";
import { ANIMAL_TRAITS, GROUPS, DIETS, HABITATS, BODY_PARTS, SYSTEMS, MISSIONS, MISSION_TARGETS, AGENCIES } from "../../data/science/traits.js";
import { factFor } from "../../data/science/facts.js";
import { hasImage, imageMedia } from "../../data/images.js";
import { learnMoreUrl } from "../../data/sources.js";
import { shuffle, pickOne } from "../../lib/random.js";

const IDX = { en: 0, es: 1, fr: 2 };
const idx = (lang) => IDX[lang] ?? 0;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (items, lang) => new Intl.ListFormat(lang ?? "en", { type: "conjunction" }).format(items);

/** Correct option + three distinct wrong ones from `pool` (ids), each with a why-not text. */
function options(correctId, label, pool, whyNot) {
  const wrong = shuffle(pool.filter((id) => id !== correctId)).slice(0, 3);
  return shuffle([correctId, ...wrong]).map((id) => ({
    id, label: label(id), whyNot: id === correctId ? undefined : { text: whyNot(id) },
  }));
}

// ── Animal traits ──────────────────────────────────────────────────────────
const animalName = (a, lang) => localize(ANIMAL_NAMES, a.id, a.name, lang);
const TRAIT_ANIMALS = ANIMALS.filter((a) => ANIMAL_TRAITS[a.id]);

function examples(lang, test, except) {
  return shuffle(TRAIT_ANIMALS.filter((a) => a !== except && test(ANIMAL_TRAITS[a.id]))).slice(0, 2).map((a) => animalName(a, lang));
}

function buildTrait(animal, variant, t) {
  const lang = t.lang;
  const tr = ANIMAL_TRAITS[animal.id];
  const name = animalName(animal, lang);
  const s = t.sci;
  const card = [name, tr.group && s.groups[tr.group], tr.diet && s.diets[tr.diet], tr.habitats && s.habitats[tr.habitats[0]]]
    .filter(Boolean).join(" · ") + ".";
  const base = {
    key: `animal-traits:${variant}:${animal.id}`, type: "animal-traits", kind: "choice",
    media: imageMedia(animal, name), source: learnMoreUrl({ wikiTitle: animal.wikiTitle, name }, lang),
    review: { title: name },
  };
  const withExamples = (phrase, test) => {
    const ex = examples(lang, test, animal);
    return ex.length ? phrase(list(ex, lang)) : "";
  };

  if (variant === "group") {
    return {
      ...base, prompt: s.groupPrompt(name), correctId: tr.group, correctLabel: s.groups[tr.group],
      options: options(tr.group, (g) => s.groups[g], GROUPS, (g) => s.groupInfo[g]),
      note: `${card} ${s.groupInfo[tr.group]}`,
    };
  }
  if (variant === "diet") {
    return {
      ...base, prompt: s.dietPrompt(name), correctId: tr.diet, correctLabel: s.diets[tr.diet],
      options: options(tr.diet, (d) => s.diets[d], DIETS, (d) => withExamples(s.dietWhyNot, (x) => x.diet === d)),
      note: [card, factFor(animal, lang)].filter(Boolean).join(" "),
    };
  }
  const right = tr.habitats[0];
  return {
    ...base, prompt: s.habitatPrompt(name), correctId: right, correctLabel: s.habitats[right],
    options: options(right, (h) => s.habitats[h], HABITATS.filter((h) => h === right || !tr.habitats.includes(h)),
      (h) => withExamples(s.habitatWhyNot, (x) => x.habitats?.includes(h))),
    note: [card, factFor(animal, lang)].filter(Boolean).join(" "),
  };
}

export function traitsRound(difficulty, count, t) {
  const variants = difficulty === "easy" ? ["group", "diet"] : ["group", "diet", "habitat"];
  const out = [];
  for (const animal of shuffle(TRAIT_ANIMALS)) {
    if (out.length >= count) break;
    const tr = ANIMAL_TRAITS[animal.id];
    const usable = variants.filter((v) => (v === "group" ? tr.group : v === "diet" ? tr.diet : tr.habitats));
    if (usable.length) out.push(buildTrait(animal, pickOne(usable), t));
  }
  return out;
}

// ── Body systems ───────────────────────────────────────────────────────────
const regionById = new Map(BODY_REGIONS.map((r) => [r.id, r]));

function buildSystem(part, variant, t) {
  const lang = t.lang;
  const s = t.sci;
  const partName = (p) => p.name[idx(lang)];
  const sys = (id) => s.systems[id];
  const card = (p) => s.systemCard(partName(p), sys(p.systems[0]), s.systemInfo[p.systems[0]]);
  const examplesIn = (id, except) => list(
    shuffle(BODY_PARTS.filter((p) => p !== except && p.systems.includes(id))).slice(0, 2).map((p) => partName(p).toLowerCase()),
    lang,
  );

  if (variant === "system-of") {
    const right = part.systems[0];
    const region = part.region && regionById.get(part.region);
    return {
      key: `body-systems:of:${part.id}`, type: "body-systems", kind: "choice",
      prompt: s.systemPrompt(partName(part)), correctId: right, correctLabel: cap(sys(right)),
      media: region && hasImage(region) ? imageMedia(region, partName(part)) : undefined,
      options: options(right, (id) => cap(sys(id)), SYSTEMS.filter((id) => id === right || !part.systems.includes(id)),
        (id) => s.systemExamples(sys(id), s.systemInfo[id], examplesIn(id, part))),
      note: card(part),
      review: { title: partName(part) },
    };
  }
  // "Which of these is part of the X system?"
  const system = part.systems[0];
  const wrong = shuffle(BODY_PARTS.filter((p) => !p.systems.includes(system))).slice(0, 3);
  return {
    key: `body-systems:part:${part.id}`, type: "body-systems", kind: "choice",
    prompt: s.partPrompt(sys(system)), correctId: part.id, correctLabel: partName(part),
    options: shuffle([part, ...wrong]).map((p) => ({ id: p.id, label: partName(p), whyNot: p === part ? undefined : { text: card(p) } })),
    note: card(part),
    review: { title: s.partPrompt(sys(system)) },
  };
}

export function systemsRound(difficulty, count, t) {
  // Easy: only the familiar organs that have a picture.
  const pool = difficulty === "easy" ? BODY_PARTS.filter((p) => p.region) : BODY_PARTS;
  return shuffle(pool).slice(0, count).map((p, i) => buildSystem(p, difficulty === "easy" || i % 2 ? "system-of" : "part-in", t));
}

// ── Space missions ─────────────────────────────────────────────────────────
function buildMission(m, variant, t) {
  const lang = t.lang;
  const s = t.sci;
  const base = {
    type: "space-missions", kind: "choice",
    note: `${m.name} (${m.year}): ${m.d[idx(lang)]}`, source: learnMoreUrl({ wikiTitle: m.wikiTitle, name: m.name }, lang),
    review: { title: m.name },
  };
  if (variant === "target") {
    const right = m.targets[0];
    return {
      ...base, key: `space-missions:target:${m.id}`, prompt: s.missionTarget(m.name), correctId: right, correctLabel: s.targets[right],
      options: options(right, (x) => s.targets[x], MISSION_TARGETS.filter((x) => x === right || !m.targets.includes(x)), (x) => {
        const other = MISSIONS.find((o) => o.targets?.[0] === x);
        return other ? s.visitedBy(s.targets[x], other.name, other.year) : s.notVisited(s.targets[x]);
      }),
    };
  }
  const right = m.agency[0];
  return {
    ...base, key: `space-missions:agency:${m.id}`, prompt: s.missionAgency(m.name), correctId: right, correctLabel: s.agencies[right],
    options: options(right, (x) => s.agencies[x], AGENCIES.filter((x) => x === right || !m.agency.includes(x)), (x) => {
      const other = pickOne(MISSIONS.filter((o) => o.agency.includes(x)));
      return s.launchedBy(s.agencies[x], other.name, other.year);
    }),
  };
}

export function missionsRound(difficulty, count, t) {
  return shuffle(MISSIONS).slice(0, count).map((m, i) => buildMission(m, m.targets && i % 2 === 0 ? "target" : "agency", t));
}
