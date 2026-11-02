// Geography: US states — find the highlighted state, name it from its outline, or name its capital.
import { US_STATES } from "../../data/geography/usStates.js";
import usMap from "../../data/generated/usMap.json";
import usShapes from "../../data/generated/usShapes.json";
import { learnMoreUrl } from "../../data/sources.js";
import { shuffle, pickDistractors } from "../../lib/random.js";

export const stateName = (s, lang) => s[lang] ?? s.name;
// English Wikipedia titles that are not just the state's name.
const ARTICLES = { GA: "Georgia (U.S. state)", NY: "New York (state)", WA: "Washington (state)" };
export const stateArticle = (s) => ARTICLES[s.code] ?? s.name;
const spellings = (s) => [...new Set([s.name, s.es, s.fr].filter(Boolean))];
const ALL_NAMES = US_STATES.flatMap(spellings);
const ALL_CAPITALS = US_STATES.map((s) => s.capital);

/** Easy: states from other regions; hard: the same region (neighbours look alike). */
function distractors(state, difficulty) {
  const others = US_STATES.filter((s) => s !== state);
  const same = others.filter((s) => s.region === state.region);
  const far = others.filter((s) => s.region !== state.region);
  const tiers = difficulty === "easy" ? [{ items: far }] : difficulty === "medium" ? [{ items: same, take: 1 }, { items: far }] : [{ items: same }];
  return pickDistractors({ correctKey: state.code, tiers, fallback: others, keyOf: (s) => s.code });
}

function build(state, variant, difficulty, t) {
  const lang = t.lang;
  const name = stateName(state, lang);
  const base = {
    key: `us-states:${variant}:${state.code}`, type: "us-states",
    note: t.geo.stateCard(name, state.capital), source: learnMoreUrl({ wikiTitle: stateArticle(state), name }, lang),
    review: { title: name },
  };
  const expert = difficulty === "expert";

  if (variant === "capital") {
    const q = { ...base, prompt: t.geo.capitalPrompt(name), correctLabel: state.capital };
    if (expert) return { ...q, kind: "text", accepted: [state.capital], match: { exclude: ALL_CAPITALS }, placeholder: t.geo.typeCapital };
    const wrong = distractors(state, difficulty);
    return {
      ...q, kind: "choice", correctId: state.code,
      options: shuffle([state, ...wrong].map((s) => ({
        id: s.code, label: s.capital,
        whyNot: s === state ? undefined : { text: t.geo.capitalIs(s.capital, stateName(s, lang)) },
      }))),
    };
  }

  const media = variant === "map"
    ? { kind: "usmap", width: usMap.width, height: usMap.height, paths: usMap.states, highlight: state.code, marker: usMap.markers[state.code] }
    : { kind: "shape", d: usShapes[state.code] };
  const q = { ...base, prompt: variant === "map" ? t.geo.whichStateHighlighted : t.geo.whichStateShape, media, correctLabel: name };
  if (expert) return { ...q, kind: "text", accepted: spellings(state), match: { exclude: ALL_NAMES }, placeholder: t.geo.typeState };
  const wrong = distractors(state, difficulty);
  return {
    ...q, kind: "choice", correctId: state.code,
    options: shuffle([state, ...wrong].map((s) => ({
      id: s.code, label: stateName(s, lang),
      whyNot: s === state ? undefined : { text: t.geo.thisIsShapeOf(stateName(s, lang)), media: { kind: "shape", d: usShapes[s.code] } },
    }))),
  };
}

export function usStatesRound(settings, t) {
  const { difficulty = "medium", roundSize: count = 10 } = settings;
  const variants = difficulty === "easy" ? ["map", "capital"] : ["map", "shape", "capital"];
  return shuffle(US_STATES).slice(0, count).map((s, i) => build(s, variants[i % variants.length], difficulty, t));
}
