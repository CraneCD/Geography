// Spanish / French names for science items: [es, fr]. English comes from the data files.
export const ANIMAL_NAMES = {
  lion: ["León", "Lion"],
  blue_whale: ["Ballena azul", "Baleine bleue"],
  cheetah: ["Guepardo", "Guépard"],
  african_elephant: ["Elefante africano", "Éléphant d'Afrique"],
  giraffe: ["Jirafa", "Girafe"],
  grizzly_bear: ["Oso grizzly", "Grizzly"],
  gray_wolf: ["Lobo gris", "Loup gris"],
  bottlenose_dolphin: ["Delfín mular", "Grand dauphin"],
  komodo_dragon: ["Dragón de Komodo", "Dragon de Komodo"],
  saltwater_crocodile: ["Cocodrilo de agua salada", "Crocodile marin"],
  golden_eagle: ["Águila real", "Aigle royal"],
  emperor_penguin: ["Pingüino emperador", "Manchot empereur"],
  peregrine_falcon: ["Halcón peregrino", "Faucon pèlerin"],
  ostrich: ["Avestruz", "Autruche"],
  great_white_shark: ["Tiburón blanco", "Grand requin blanc"],
  giant_pacific_octopus: ["Pulpo gigante del Pacífico", "Pieuvre géante du Pacifique"],
  green_anaconda: ["Anaconda verde", "Anaconda vert"],
  monarch_butterfly: ["Mariposa monarca", "Monarque"],
  honeybee: ["Abeja melífera", "Abeille domestique"],
  giant_panda: ["Panda gigante", "Panda géant"],
  platypus: ["Ornitorrinco", "Ornithorynque"],
  african_wild_dog: ["Licaón", "Lycaon"],
  hummingbird: ["Colibrí garganta de rubí", "Colibri à gorge rubis"],
  axolotl: ["Ajolote", "Axolotl"],
  snow_leopard: ["Leopardo de las nieves", "Panthère des neiges"],
  mantis_shrimp: ["Camarón mantis", "Crevette-mante"],
  vampire_bat: ["Murciélago vampiro", "Vampire commun"],
  leatherback_sea_turtle: ["Tortuga laúd", "Tortue luth"],
  wolverine: ["Glotón", "Glouton"],
  electric_eel: ["Anguila eléctrica", "Anguille électrique"],
  clownfish: ["Pez payaso", "Poisson-clown"],
  chimpanzee: ["Chimpancé", "Chimpanzé"],
  tarantula: ["Tarántula Goliat", "Mygale de Leblond"],
  narwhal: ["Narval", "Narval"],
  bombardier_beetle: ["Escarabajo bombardero", "Scarabée bombardier"],
  manta_ray: ["Mantarraya gigante", "Raie manta géante"],
  arctic_fox: ["Zorro ártico", "Renard polaire"],
  mimic_octopus: ["Pulpo mimo", "Poulpe mimétique"],
  horseshoe_crab: ["Cangrejo herradura", "Limule"],
  capybara: ["Capibara", "Capybara"],
};

export const SPACE_NAMES = {
  mercury: ["Mercurio", "Mercure"],
  venus: ["Venus", "Vénus"],
  earth: ["Tierra", "Terre"],
  mars: ["Marte", "Mars"],
  jupiter: ["Júpiter", "Jupiter"],
  saturn: ["Saturno", "Saturne"],
  uranus: ["Urano", "Uranus"],
  neptune: ["Neptuno", "Neptune"],
  moon: ["Luna", "Lune"],
  io: ["Ío", "Io"],
  europa: ["Europa", "Europe"],
  ganymede: ["Ganímedes", "Ganymède"],
  titan: ["Titán", "Titan"],
};

export const BODY_NAMES = {
  Brain: ["Cerebro", "Cerveau"],
  Heart: ["Corazón", "Cœur"],
  Lung: ["Pulmón", "Poumon"],
  Liver: ["Hígado", "Foie"],
  Stomach: ["Estómago", "Estomac"],
  Kidney: ["Riñón", "Rein"],
  "Large Intestine": ["Intestino grueso", "Gros intestin"],
  "Small Intestine": ["Intestino delgado", "Intestin grêle"],
  Pancreas: ["Páncreas", "Pancréas"],
  Spleen: ["Bazo", "Rate"],
  Skull: ["Cráneo", "Crâne"],
  Clavicle: ["Clavícula", "Clavicule"],
  Sternum: ["Esternón", "Sternum"],
  Humerus: ["Húmero", "Humérus"],
  Radius: ["Radio", "Radius"],
  Ulna: ["Cúbito", "Cubitus"],
  Pelvis: ["Pelvis", "Bassin"],
  Femur: ["Fémur", "Fémur"],
  Tibia: ["Tibia", "Tibia"],
  Fibula: ["Peroné", "Fibula"],
};

export const ELEMENT_NAMES = {
  H: ["Hidrógeno", "Hydrogène"], He: ["Helio", "Hélium"], Li: ["Litio", "Lithium"],
  Be: ["Berilio", "Béryllium"], B: ["Boro", "Bore"], C: ["Carbono", "Carbone"],
  N: ["Nitrógeno", "Azote"], O: ["Oxígeno", "Oxygène"], F: ["Flúor", "Fluor"],
  Ne: ["Neón", "Néon"], Na: ["Sodio", "Sodium"], Mg: ["Magnesio", "Magnésium"],
  Al: ["Aluminio", "Aluminium"], Si: ["Silicio", "Silicium"], P: ["Fósforo", "Phosphore"],
  S: ["Azufre", "Soufre"], Cl: ["Cloro", "Chlore"], Ar: ["Argón", "Argon"],
  K: ["Potasio", "Potassium"], Ca: ["Calcio", "Calcium"], Sc: ["Escandio", "Scandium"],
  Ti: ["Titanio", "Titane"], V: ["Vanadio", "Vanadium"], Cr: ["Cromo", "Chrome"],
  Mn: ["Manganeso", "Manganèse"], Fe: ["Hierro", "Fer"], Co: ["Cobalto", "Cobalt"],
  Ni: ["Níquel", "Nickel"], Cu: ["Cobre", "Cuivre"], Zn: ["Zinc", "Zinc"],
  Ga: ["Galio", "Gallium"], Ge: ["Germanio", "Germanium"], As: ["Arsénico", "Arsenic"],
  Se: ["Selenio", "Sélénium"], Br: ["Bromo", "Brome"], Kr: ["Kriptón", "Krypton"],
};

const IDX = { es: 0, fr: 1 };

/** Localized name with English fallback. */
export function localize(table, key, english, lang) {
  const i = IDX[lang];
  return i == null ? english : table[key]?.[i] ?? english;
}

/** All spellings (English + translations) for typed answers. */
export function spellings(table, key, english) {
  return [english, ...(table[key] ?? [])];
}
