// Precomputes all map geometry used by the Geography subject so the browser
// never has to load TopoJSON or run d3 projections at runtime.
//
//   npm run build:geo
//
// Outputs (committed to the repo):
//   src/data/generated/shapes.json    – per-country outline, fitted to a 400×300 box
//   src/data/generated/worldMap.json  – world map paths + microstate points (960×500)
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import { geoPath, geoMercator, geoNaturalEarth1, geoCentroid } from "d3-geo";
import { countries } from "../src/data/countries.js";
import { ALPHA2_TO_NUMERIC } from "../src/data/countryIds.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const topology = JSON.parse(
  readFileSync(join(root, "node_modules/world-atlas/countries-110m.json"), "utf8"),
);
const features = feature(topology, topology.objects.countries).features;

// world-atlas zero-pads ids ("032"); our table does not ("32"). Compare numerically.
const byNumericId = new Map(features.map((f) => [Number(f.id), f]));
const featureFor = (alpha2) => {
  const id = ALPHA2_TO_NUMERIC[alpha2];
  return id == null ? undefined : byNumericId.get(Number(id));
};

const DIGITS = 1;

// ── Shapes ────────────────────────────────────────────────────────────────
const SHAPE_W = 400, SHAPE_H = 300, PAD = 24;
const shapes = {};
for (const c of countries) {
  const f = featureFor(c.code);
  if (!f) continue;
  // Rotate so the country is centred: keeps antimeridian countries (Fiji, Russia) in one piece.
  const [lng] = geoCentroid(f);
  const projection = geoMercator()
    .rotate([-lng, 0])
    .fitExtent([[PAD, PAD], [SHAPE_W - PAD, SHAPE_H - PAD]], f);
  shapes[c.code] = geoPath(projection).digits(DIGITS)(f);
}

// ── World map ─────────────────────────────────────────────────────────────
const MAP_W = 960, MAP_H = 500;
const world = geoNaturalEarth1().fitSize([MAP_W, MAP_H], { type: "Sphere" });
const path = geoPath(world).digits(DIGITS);
const round = (n) => Math.round(n * 10) / 10;

const usedIds = new Set();
const mapCountries = {};
const points = {};
for (const c of countries) {
  const f = featureFor(c.code);
  if (f) {
    usedIds.add(Number(f.id));
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    mapCountries[c.code] = { d: path(f), bbox: [x0, y0, x1, y1].map(round) };
  } else {
    // Microstates are not in the 110m atlas: render them as tappable points.
    const p = world([c.lng, c.lat]);
    if (p) points[c.code] = p.map(round);
  }
}
// Land that is not one of our quiz countries (Greenland, Antarctica, W. Sahara, …)
const other = features
  .filter((f) => !usedIds.has(Number(f.id)))
  .map((f) => path(f))
  .filter(Boolean);

const outDir = join(root, "src/data/generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "shapes.json"), JSON.stringify(shapes));
writeFileSync(
  join(outDir, "worldMap.json"),
  JSON.stringify({ width: MAP_W, height: MAP_H, countries: mapCountries, points, other }),
);

// Project a [lng, lat] box for region framing in the browser (no d3 at runtime).
const REGION_EXTENTS = {
  Africa: [-20, -36, 55, 38],
  Americas: [-170, -57, -30, 75],
  Asia: [25, -12, 150, 56],
  Europe: [-25, 34, 45, 71],
  Oceania: [110, -50, 180, 10],
};
const regionViews = {};
for (const [region, [w, s, e, n]] of Object.entries(REGION_EXTENTS)) {
  const corners = [[w, s], [w, n], [e, s], [e, n], [(w + e) / 2, n], [(w + e) / 2, s]].map((p) => world(p));
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  regionViews[region] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round);
}
writeFileSync(join(outDir, "regionViews.json"), JSON.stringify(regionViews));

console.log(
  `shapes: ${Object.keys(shapes).length}, map countries: ${Object.keys(mapCountries).length}, ` +
    `points: ${Object.keys(points).length}, other land: ${other.length}`,
);
