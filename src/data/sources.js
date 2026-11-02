// "Learn more" links: the item's Wikipedia article in the player's language when we know it
// (src/data/generated/sources.json, from Wikidata), otherwise a Wikipedia search for its name,
// which jumps straight to the article on an exact title match.
import sources from "./generated/sources.json";

const wiki = (lang, title) => `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
const search = (lang, q) => `https://${lang}.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`;

export function learnMoreUrl({ wikiTitle, name }, lang = "en") {
  if (wikiTitle && lang === "en") return wiki("en", wikiTitle);
  const localTitle = wikiTitle ? sources[wikiTitle]?.[lang] : null;
  if (localTitle) return wiki(lang, localTitle);
  return search(lang, name);
}

/**
 * Name of a place or thing in the player's language: a hand-checked `names[lang]`, else the
 * title of its Wikipedia article in that language (without "(river)"-style qualifiers), else English.
 */
export function localTitle({ wikiTitle, name, names }, lang = "en") {
  if (lang === "en") return name;
  if (names?.[lang]) return names[lang];
  const title = wikiTitle ? sources[wikiTitle]?.[lang] : null;
  return title ? title.replace(/\s*\([^)]*\)$/, "") : name;
}
