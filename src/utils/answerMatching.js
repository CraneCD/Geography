// Shared free-text answer matching for expert/type-in modes.

export function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Aliases accepted in any language
const ALIASES = {
  "united states": ["usa", "us", "america", "united states of america", "estados unidos", "etats unis", "états unis"],
  "estados unidos": ["usa", "us", "united states", "america", "estados unidos de america"],
  "états-unis": ["usa", "us", "united states", "etats unis", "états unis"],
  "united kingdom": ["uk", "great britain", "britain", "reino unido", "royaume uni"],
  "reino unido": ["uk", "great britain", "britain", "united kingdom", "royaume uni"],
  "royaume-uni": ["uk", "great britain", "united kingdom", "royaume uni"],
  "democratic republic of the congo": ["drc", "dr congo", "congo kinshasa"],
  "república democrática del congo": ["drc", "dr congo", "congo kinshasa", "rd congo"],
  "république démocratique du congo": ["rdc", "dr congo", "congo kinshasa"],
  "czech republic": ["czechia", "república checa", "republique tcheque"],
  "república checa": ["czechia", "czech republic"],
  "république tchèque": ["czechia", "czech republic", "republique tcheque"],
  "russia": ["russian federation", "rusia", "russie"],
  "rusia": ["russia", "russian federation", "russie"],
  "russie": ["russia", "rusia", "russian federation"],
};

// Keyed by normalized answer so lookups work for accented/translated names too
const NORMALIZED_ALIASES = new Map(
  Object.entries(ALIASES).map(([key, list]) => [normalize(key), list.map(normalize)])
);

export function isCorrect(input, answer) {
  const n = normalize(input);
  const a = normalize(answer);
  if (n === a) return true;
  return (NORMALIZED_ALIASES.get(a) ?? []).includes(n);
}
