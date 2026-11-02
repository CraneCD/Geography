export const SPACE_OBJECTS = [
  // Planets
  { id: "mercury", name: "Mercury", wikiTitle: "Mercury (planet)", type: "planet", diameter_km: 4879,   distanceFromSun_AU: 0.39, moons: 0,   fact: "The smallest planet and closest to the Sun, with extreme temperature swings." },
  { id: "venus",   name: "Venus",   wikiTitle: "Venus",            type: "planet", diameter_km: 12104,  distanceFromSun_AU: 0.72, moons: 0,   fact: "The hottest planet in the solar system despite not being closest to the Sun." },
  { id: "earth",   name: "Earth",   wikiTitle: "Earth",            type: "planet", diameter_km: 12742,  distanceFromSun_AU: 1.00, moons: 1,   fact: "The only planet known to harbour life, with liquid water on its surface." },
  { id: "mars",    name: "Mars",    wikiTitle: "Mars",             type: "planet", diameter_km: 6779,   distanceFromSun_AU: 1.52, moons: 2,   fact: "Home to Olympus Mons, the tallest volcano in the solar system." },
  { id: "jupiter", name: "Jupiter", wikiTitle: "Jupiter",          type: "planet", diameter_km: 139820, distanceFromSun_AU: 5.20, moons: 95,  fact: "The Great Red Spot is a storm that has raged for over 350 years." },
  { id: "saturn",  name: "Saturn",  wikiTitle: "Saturn",           type: "planet", diameter_km: 116460, distanceFromSun_AU: 9.58, moons: 146, fact: "Its rings are made mostly of ice and rock, spanning up to 282,000 km." },
  { id: "uranus",  name: "Uranus",  wikiTitle: "Uranus",           type: "planet", diameter_km: 50724,  distanceFromSun_AU: 19.22, moons: 27, fact: "Rotates on its side with an axial tilt of about 98 degrees." },
  { id: "neptune", name: "Neptune", wikiTitle: "Neptune",          type: "planet", diameter_km: 49244,  distanceFromSun_AU: 30.05, moons: 16, fact: "Has the strongest sustained winds in the solar system, reaching 2,100 km/h." },

  // Moons
  { id: "moon",     name: "Moon",     wikiTitle: "Moon",     type: "moon", diameter_km: 3474,  distanceFromPlanet_km: 384400, planet: "Earth",   fact: "The only celestial body beyond Earth where humans have set foot." },
  { id: "io",       name: "Io",       wikiTitle: "Io (moon)", type: "moon", diameter_km: 3643,  distanceFromPlanet_km: 421800, planet: "Jupiter", fact: "The most volcanically active body in the solar system." },
  { id: "europa",   name: "Europa",   wikiTitle: "Europa (moon)", type: "moon", diameter_km: 3122,  distanceFromPlanet_km: 671100, planet: "Jupiter", fact: "Thought to harbour a vast liquid ocean beneath its icy crust." },
  { id: "ganymede", name: "Ganymede", wikiTitle: "Ganymede (moon)", type: "moon", diameter_km: 5268,  distanceFromPlanet_km: 1070400, planet: "Jupiter", fact: "The largest moon in the solar system, even bigger than Mercury." },
  { id: "titan",    name: "Titan",    wikiTitle: "Titan (moon)", type: "moon", diameter_km: 5149,  distanceFromPlanet_km: 1221870, planet: "Saturn",  fact: "The only moon with a dense atmosphere and liquid lakes on its surface." },
  { id: "callisto", name: "Callisto", wikiTitle: "Callisto (moon)", type: "moon", diameter_km: 4821, distanceFromPlanet_km: 1882700, planet: "Jupiter", fact: "The most heavily cratered object in the solar system." },
  { id: "enceladus", name: "Enceladus", wikiTitle: "Enceladus", type: "moon", diameter_km: 504, distanceFromPlanet_km: 237948, planet: "Saturn", fact: "Shoots geysers of water ice into space from an ocean under its crust." },
  { id: "triton", name: "Triton", wikiTitle: "Triton (moon)", type: "moon", diameter_km: 2707, distanceFromPlanet_km: 354759, planet: "Neptune", fact: "Orbits backwards, against Neptune's spin — it was probably captured." },
  { id: "phobos", name: "Phobos", wikiTitle: "Phobos (moon)", type: "moon", diameter_km: 22.5, distanceFromPlanet_km: 9376, planet: "Mars", fact: "A potato-shaped moon slowly spiralling in towards Mars." },
  { id: "charon", name: "Charon", wikiTitle: "Charon (moon)", type: "moon", diameter_km: 1212, distanceFromPlanet_km: 19591, planet: "Pluto", fact: "Half as wide as Pluto: the two orbit a point in the space between them." },
  // Dwarf planets
  { id: "pluto", name: "Pluto", wikiTitle: "Pluto", type: "dwarf", diameter_km: 2377, distanceFromSun_AU: 39.5, moons: 5, fact: "Reclassified as a dwarf planet in 2006; has a heart-shaped plain of nitrogen ice." },
  { id: "ceres", name: "Ceres", wikiTitle: "Ceres (dwarf planet)", type: "dwarf", diameter_km: 940, distanceFromSun_AU: 2.77, moons: 0, fact: "The largest object in the asteroid belt and the only dwarf planet in the inner solar system." },
  { id: "eris", name: "Eris", wikiTitle: "Eris (dwarf planet)", imageFile: null, type: "dwarf", diameter_km: 2326, distanceFromSun_AU: 67.7, moons: 1, fact: "Its discovery in 2005 led astronomers to define what a planet is." },
  { id: "haumea", name: "Haumea", wikiTitle: "Haumea", imageFile: null, type: "dwarf", diameter_km: 1632, distanceFromSun_AU: 43.1, moons: 2, fact: "Spins so fast (once every 4 hours) that it is stretched into an egg shape." },
  { id: "makemake", name: "Makemake", wikiTitle: "Makemake", imageFile: null, type: "dwarf", diameter_km: 1430, distanceFromSun_AU: 45.7, moons: 1, fact: "Named after the creator god of the Rapa Nui people of Easter Island." },
  // Star
  { id: "sun", name: "Sun", wikiTitle: "Sun", type: "star", diameter_km: 1392700, distanceFromSun_AU: 0, moons: 0, fact: "Holds 99.8% of all the mass in the solar system." },
];
