// Every Wikipedia title that the quiz shows an image for. Used by
// scripts/resolve-images.mjs and by the manifest-coverage test.
import { people } from "./history/people.js";
import { artworks } from "./history/artworks.js";
import { ANIMALS } from "./science/animals.js";
import { BODY_REGIONS } from "./science/body.js";
import { SPACE_OBJECTS } from "./science/space.js";

export function allWikiTitles() {
  const titles = [people, artworks, ANIMALS, BODY_REGIONS, SPACE_OBJECTS]
    .flat()
    .map((item) => item.wikiTitle)
    .filter(Boolean);
  return [...new Set(titles)].sort();
}
