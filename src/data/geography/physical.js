// Rivers, mountains, deserts, lakes and waterfalls.
// `countries`: every country the feature is in or flows through (ISO 3166-1 alpha-2); any of
// them is a correct answer and none is ever offered as a wrong one.
// `value`: length (rivers, km), height (mountains and waterfalls, m) or area (deserts and lakes, km²).
// River lengths vary between sources; superlative questions only compare clearly different values.
// es/fr names come from the matching Wikipedia article titles (src/data/generated/sources.json).
export const FEATURES = [
  // Rivers (length, km)
  { id: "nile", kind: "river", name: "Nile", wikiTitle: "Nile", value: 6650, countries: ["EG", "SD", "SS", "UG", "ET", "TZ", "KE", "RW", "BI", "CD"] },
  { id: "amazon", kind: "river", name: "Amazon", wikiTitle: "Amazon River", value: 6400, countries: ["BR", "PE", "CO"] },
  { id: "yangtze", kind: "river", name: "Yangtze", wikiTitle: "Yangtze", value: 6300, countries: ["CN"] },
  { id: "mississippi", kind: "river", name: "Mississippi", wikiTitle: "Mississippi River", value: 3730, countries: ["US"] },
  { id: "yellow", kind: "river", name: "Yellow River", wikiTitle: "Yellow River", value: 5464, countries: ["CN"] },
  { id: "congo", kind: "river", name: "Congo", wikiTitle: "Congo River", value: 4700, countries: ["CD", "CG", "CF", "AO", "ZM"] },
  { id: "parana", kind: "river", name: "Paraná", wikiTitle: "Paraná River", value: 4880, countries: ["BR", "PY", "AR"] },
  { id: "mekong", kind: "river", name: "Mekong", wikiTitle: "Mekong", value: 4350, countries: ["CN", "MM", "LA", "TH", "KH", "VN"] },
  { id: "niger", kind: "river", name: "Niger", wikiTitle: "Niger River", value: 4180, countries: ["GN", "ML", "NE", "BJ", "NG"] },
  { id: "volga", kind: "river", name: "Volga", wikiTitle: "Volga", value: 3530, countries: ["RU"] },
  { id: "indus", kind: "river", name: "Indus", wikiTitle: "Indus River", value: 3180, countries: ["CN", "IN", "PK"] },
  { id: "rio_grande", kind: "river", name: "Rio Grande", wikiTitle: "Rio Grande", value: 3051, countries: ["US", "MX"] },
  { id: "danube", kind: "river", name: "Danube", wikiTitle: "Danube", value: 2850, countries: ["DE", "AT", "SK", "HU", "HR", "RS", "RO", "BG", "MD", "UA"] },
  { id: "euphrates", kind: "river", name: "Euphrates", wikiTitle: "Euphrates", value: 2800, countries: ["TR", "SY", "IQ"] },
  { id: "zambezi", kind: "river", name: "Zambezi", wikiTitle: "Zambezi", value: 2574, countries: ["ZM", "AO", "NA", "BW", "ZW", "MZ"] },
  { id: "ganges", kind: "river", name: "Ganges", wikiTitle: "Ganges", value: 2525, countries: ["IN", "BD"] },
  { id: "murray", kind: "river", name: "Murray", wikiTitle: "Murray River", value: 2508, countries: ["AU"] },
  { id: "orinoco", kind: "river", name: "Orinoco", wikiTitle: "Orinoco", value: 2140, countries: ["VE", "CO"] },
  { id: "mackenzie", kind: "river", name: "Mackenzie", wikiTitle: "Mackenzie River", value: 1738, countries: ["CA"] },
  { id: "rhine", kind: "river", name: "Rhine", wikiTitle: "Rhine", value: 1230, countries: ["CH", "LI", "AT", "DE", "FR", "NL"] },
  { id: "seine", kind: "river", name: "Seine", wikiTitle: "Seine", value: 777, countries: ["FR"] },
  { id: "thames", kind: "river", name: "Thames", wikiTitle: "River Thames", value: 346, countries: ["GB"] },

  // Mountains (height, m)
  { id: "everest", kind: "mountain", name: "Mount Everest", wikiTitle: "Mount Everest", value: 8849, countries: ["NP", "CN"] },
  { id: "k2", kind: "mountain", name: "K2", wikiTitle: "K2", value: 8611, countries: ["PK", "CN"] },
  { id: "kangchenjunga", kind: "mountain", name: "Kangchenjunga", wikiTitle: "Kangchenjunga", value: 8586, countries: ["NP", "IN"] },
  { id: "aconcagua", kind: "mountain", name: "Aconcagua", wikiTitle: "Aconcagua", value: 6961, countries: ["AR"] },
  { id: "huascaran", kind: "mountain", name: "Huascarán", wikiTitle: "Huascarán", value: 6768, countries: ["PE"] },
  { id: "chimborazo", kind: "mountain", name: "Chimborazo", wikiTitle: "Chimborazo", value: 6263, countries: ["EC"] },
  { id: "denali", names: { es: "Denali", fr: "Denali" }, kind: "mountain", name: "Denali", wikiTitle: "Denali", value: 6190, countries: ["US"] },
  { id: "kilimanjaro", kind: "mountain", name: "Kilimanjaro", wikiTitle: "Mount Kilimanjaro", value: 5895, countries: ["TZ"] },
  { id: "elbrus", kind: "mountain", name: "Mount Elbrus", wikiTitle: "Mount Elbrus", value: 5642, countries: ["RU"] },
  { id: "orizaba", names: { es: "Pico de Orizaba", fr: "Pic d'Orizaba" }, kind: "mountain", name: "Pico de Orizaba", wikiTitle: "Pico de Orizaba", value: 5636, countries: ["MX"] },
  { id: "damavand", kind: "mountain", name: "Mount Damavand", wikiTitle: "Mount Damavand", value: 5610, countries: ["IR"] },
  { id: "mount_kenya", kind: "mountain", name: "Mount Kenya", wikiTitle: "Mount Kenya", value: 5199, countries: ["KE"] },
  { id: "ararat", kind: "mountain", name: "Mount Ararat", wikiTitle: "Mount Ararat", value: 5137, countries: ["TR"] },
  { id: "mont_blanc", kind: "mountain", name: "Mont Blanc", wikiTitle: "Mont Blanc", value: 4806, countries: ["FR", "IT"] },
  { id: "ras_dashen", kind: "mountain", name: "Ras Dashen", wikiTitle: "Ras Dashen", value: 4550, countries: ["ET"] },
  { id: "matterhorn", kind: "mountain", name: "Matterhorn", wikiTitle: "Matterhorn", value: 4478, countries: ["CH", "IT"] },
  { id: "toubkal", kind: "mountain", name: "Toubkal", wikiTitle: "Toubkal", value: 4167, countries: ["MA"] },
  { id: "kinabalu", kind: "mountain", name: "Mount Kinabalu", wikiTitle: "Mount Kinabalu", value: 4095, countries: ["MY"] },
  { id: "fuji", kind: "mountain", name: "Mount Fuji", wikiTitle: "Mount Fuji", value: 3776, countries: ["JP"] },
  { id: "aoraki", kind: "mountain", name: "Aoraki / Mount Cook", wikiTitle: "Aoraki / Mount Cook", value: 3724, countries: ["NZ"] },
  { id: "teide", kind: "mountain", name: "Teide", wikiTitle: "Teide", value: 3715, countries: ["ES"] },
  { id: "olympus", kind: "mountain", name: "Mount Olympus", wikiTitle: "Mount Olympus", value: 2918, countries: ["GR"] },
  { id: "kosciuszko", kind: "mountain", name: "Mount Kosciuszko", wikiTitle: "Mount Kosciuszko", value: 2228, countries: ["AU"] },

  // Deserts (area, km²)
  { id: "sahara", kind: "desert", name: "Sahara", wikiTitle: "Sahara", value: 9200000, countries: ["DZ", "EG", "LY", "ML", "MR", "MA", "NE", "SD", "TN", "TD"] },
  { id: "arabian", kind: "desert", name: "Arabian Desert", wikiTitle: "Arabian Desert", value: 2330000, countries: ["SA", "YE", "OM", "AE", "QA", "KW", "JO", "IQ"] },
  { id: "gobi", kind: "desert", name: "Gobi Desert", wikiTitle: "Gobi Desert", value: 1295000, countries: ["CN", "MN"] },
  { id: "kalahari", kind: "desert", name: "Kalahari Desert", wikiTitle: "Kalahari Desert", value: 900000, countries: ["BW", "NA", "ZA"] },
  { id: "patagonian", names: { es: "Desierto patagónico", fr: "Désert de Patagonie" }, kind: "desert", name: "Patagonian Desert", wikiTitle: "Patagonian Desert", value: 673000, countries: ["AR", "CL"] },
  { id: "great_victoria", kind: "desert", name: "Great Victoria Desert", wikiTitle: "Great Victoria Desert", value: 348750, countries: ["AU"] },
  { id: "taklamakan", kind: "desert", name: "Taklamakan Desert", wikiTitle: "Taklamakan Desert", value: 337000, countries: ["CN"] },
  { id: "sonoran", kind: "desert", name: "Sonoran Desert", wikiTitle: "Sonoran Desert", value: 260000, countries: ["US", "MX"] },
  { id: "thar", kind: "desert", name: "Thar Desert", wikiTitle: "Thar Desert", value: 200000, countries: ["IN", "PK"] },
  { id: "atacama", kind: "desert", name: "Atacama Desert", wikiTitle: "Atacama Desert", value: 105000, countries: ["CL", "PE"] },
  { id: "namib", kind: "desert", name: "Namib", wikiTitle: "Namib", value: 81000, countries: ["NA", "AO", "ZA"] },

  // Lakes (area, km²)
  { id: "caspian", kind: "lake", name: "Caspian Sea", wikiTitle: "Caspian Sea", value: 371000, countries: ["RU", "KZ", "TM", "IR", "AZ"] },
  { id: "superior", kind: "lake", name: "Lake Superior", wikiTitle: "Lake Superior", value: 82100, countries: ["US", "CA"] },
  { id: "victoria", kind: "lake", name: "Lake Victoria", wikiTitle: "Lake Victoria", value: 59947, countries: ["UG", "KE", "TZ"] },
  { id: "tanganyika", kind: "lake", name: "Lake Tanganyika", wikiTitle: "Lake Tanganyika", value: 32900, countries: ["TZ", "CD", "BI", "ZM"] },
  { id: "baikal", kind: "lake", name: "Lake Baikal", wikiTitle: "Lake Baikal", value: 31500, countries: ["RU"] },
  { id: "great_bear", kind: "lake", name: "Great Bear Lake", wikiTitle: "Great Bear Lake", value: 31153, countries: ["CA"] },
  { id: "malawi", kind: "lake", name: "Lake Malawi", wikiTitle: "Lake Malawi", value: 29600, countries: ["MW", "MZ", "TZ"] },
  { id: "balkhash", kind: "lake", name: "Lake Balkhash", wikiTitle: "Lake Balkhash", value: 16400, countries: ["KZ"] },
  { id: "titicaca", kind: "lake", name: "Lake Titicaca", wikiTitle: "Lake Titicaca", value: 8372, countries: ["PE", "BO"] },
  { id: "nicaragua", names: { es: "Lago de Nicaragua", fr: "Lac Nicaragua" }, kind: "lake", name: "Lake Nicaragua", wikiTitle: "Lake Nicaragua", value: 8264, countries: ["NI"] },
  { id: "vanern", kind: "lake", name: "Vänern", wikiTitle: "Vänern", value: 5650, countries: ["SE"] },
  { id: "geneva", kind: "lake", name: "Lake Geneva", wikiTitle: "Lake Geneva", value: 580, countries: ["CH", "FR"] },

  // Waterfalls (height, m)
  { id: "angel", kind: "waterfall", name: "Angel Falls", wikiTitle: "Angel Falls", value: 979, countries: ["VE"] },
  { id: "tugela", kind: "waterfall", name: "Tugela Falls", wikiTitle: "Tugela Falls", value: 948, countries: ["ZA"] },
  { id: "yosemite", kind: "waterfall", name: "Yosemite Falls", wikiTitle: "Yosemite Falls", value: 739, countries: ["US"] },
  { id: "kaieteur", kind: "waterfall", name: "Kaieteur Falls", wikiTitle: "Kaieteur Falls", value: 226, countries: ["GY"] },
  { id: "victoria_falls", kind: "waterfall", name: "Victoria Falls", wikiTitle: "Victoria Falls", value: 108, countries: ["ZM", "ZW"] },
  { id: "iguazu", kind: "waterfall", name: "Iguazu Falls", wikiTitle: "Iguazu Falls", value: 82, countries: ["AR", "BR"] },
  { id: "niagara", kind: "waterfall", name: "Niagara Falls", wikiTitle: "Niagara Falls", value: 51, countries: ["CA", "US"] },
  { id: "gullfoss", kind: "waterfall", name: "Gullfoss", wikiTitle: "Gullfoss", value: 32, countries: ["IS"] },
];

export const FEATURE_KINDS = ["river", "mountain", "desert", "lake", "waterfall"];
