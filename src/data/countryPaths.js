import { feature } from "topojson-client";
import { geoPath, geoMercator } from "d3-geo";
import topology from "world-atlas/countries-110m.json";
import { ALPHA2_TO_NUMERIC } from "./countryIds";

const W = 400;
const H = 300;
const PAD = 24;

const allFeatures = feature(topology, topology.objects.countries).features;
const featuresById = new Map(allFeatures.map((feat) => [String(feat.id), feat]));

// Pre-compute every country's SVG path string at module init — instant lookup at quiz time
export const countryPaths = {};

for (const [alpha2, numericId] of Object.entries(ALPHA2_TO_NUMERIC)) {
  const f = featuresById.get(numericId);
  if (!f) continue;
  const projection = geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], f);
  countryPaths[alpha2] = geoPath().projection(projection)(f);
}
