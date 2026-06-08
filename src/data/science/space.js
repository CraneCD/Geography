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
];
