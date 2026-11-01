// Spanish / French text for the History & Culture content. English stays in the data files;
// these tables are keyed by id (or by the English term) and fall back to English when missing.
import peopleEs from "./people.es.js";
import peopleFr from "./people.fr.js";
import eventsEs from "./events.es.js";
import eventsFr from "./events.fr.js";
import inventionsEs from "./inventions.es.js";
import inventionsFr from "./inventions.fr.js";
import artworksEs from "./artworks.es.js";
import artworksFr from "./artworks.fr.js";

const TABLES = {
  es: { people: peopleEs, events: eventsEs, inventions: inventionsEs, artworks: artworksEs },
  fr: { people: peopleFr, events: eventsFr, inventions: inventionsFr, artworks: artworksFr },
};

// [es, fr]
export const MOVEMENTS = {
  Renaissance: ["Renacimiento", "Renaissance"],
  "Northern Renaissance": ["Renacimiento nórdico", "Renaissance nordique"],
  "Dutch Golden Age": ["Siglo de Oro neerlandés", "Siècle d'or néerlandais"],
  Baroque: ["Barroco", "Baroque"],
  Neoclassicism: ["Neoclasicismo", "Néoclassicisme"],
  Romanticism: ["Romanticismo", "Romantisme"],
  "Pre-Raphaelite": ["Prerrafaelismo", "Préraphaélisme"],
  Realism: ["Realismo", "Réalisme"],
  Impressionism: ["Impresionismo", "Impressionnisme"],
  "Post-Impressionism": ["Postimpresionismo", "Postimpressionnisme"],
  Symbolism: ["Simbolismo", "Symbolisme"],
  Expressionism: ["Expresionismo", "Expressionnisme"],
  Fauvism: ["Fauvismo", "Fauvisme"],
  Cubism: ["Cubismo", "Cubisme"],
  Modernism: ["Modernismo", "Modernisme"],
  Surrealism: ["Surrealismo", "Surréalisme"],
  "Naïve Art": ["Arte naíf", "Art naïf"],
  Regionalism: ["Regionalismo", "Régionalisme"],
  "Ukiyo-e": ["Ukiyo-e", "Ukiyo-e"],
  Rococo: ["Rococó", "Rococo"],
  "Academic art": ["Academicismo", "Art académique"],
  "Chinese landscape painting": ["Pintura china de paisaje", "Peinture de paysage chinoise"],
  "Japanese ink painting": ["Pintura japonesa a tinta", "Peinture japonaise à l'encre"],
  "Mughal painting": ["Pintura mogol", "Peinture moghole"],
  "Persian miniature": ["Miniatura persa", "Miniature persane"],
};

// Artists whose usual name differs in Spanish or French. [es, fr]
export const ARTISTS = {
  "Leonardo da Vinci": ["Leonardo da Vinci", "Léonard de Vinci"],
  Michelangelo: ["Miguel Ángel", "Michel-Ange"],
  Raphael: ["Rafael", "Raphaël"],
  Titian: ["Tiziano", "Titien"],
  Caravaggio: ["Caravaggio", "Le Caravage"],
  "Hieronymus Bosch": ["El Bosco", "Jérôme Bosch"],
  "Pieter Bruegel the Elder": ["Pieter Brueghel el Viejo", "Pieter Brueghel l'Ancien"],
  "Hans Holbein the Younger": ["Hans Holbein el Joven", "Hans Holbein le Jeune"],
  "Albrecht Dürer": ["Alberto Durero", "Albrecht Dürer"],
};

const IDX = { es: 0, fr: 1 };

/** Localised text for a history item: { name, d, inventor } with English fallback. */
export function historyText(kind, item, lang) {
  const t = TABLES[lang]?.[kind]?.[item.id] ?? {};
  const englishName = item.name ?? item.event ?? item.invention ?? item.title;
  return {
    name: t.name ?? englishName,
    d: t.d ?? item.description,
    inventor: t.inventor ?? item.inventor,
  };
}

const pick = (table, english, lang) => (IDX[lang] == null ? english : table[english]?.[IDX[lang]] ?? english);
export const movementName = (english, lang) => pick(MOVEMENTS, english, lang);
export const artistName = (english, lang) => pick(ARTISTS, english, lang);

/** Every accepted spelling (English + translations) for typed answers. */
export function spellingsOf(table, english) {
  return [english, ...(table[english] ?? [])];
}
