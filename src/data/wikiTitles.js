// Every image the quiz shows, as a manifest key:
//   "File:<name>"  – a specific Wikimedia Commons file chosen by hand (`imageFile` on an item)
//   "<wikiTitle>"  – otherwise, the lead image of that English Wikipedia article
// Used by scripts/resolve-images.mjs and by the manifest-coverage test.
import { people } from "./history/people.js";
import { artworks } from "./history/artworks.js";
import { ANIMALS } from "./science/animals.js";
import { BODY_REGIONS } from "./science/body.js";
import { SPACE_OBJECTS } from "./science/space.js";
import { PLANTS } from "./science/plants.js";
import { LANDMARKS } from "./geography/landmarks.js";

const ALL = () => [people, artworks, ANIMALS, BODY_REGIONS, SPACE_OBJECTS, PLANTS, LANDMARKS].flat();

export function imageRef(item) {
  // `imageFile: null` deliberately opts out of the lead image (it leaks the answer).
  if (item && "imageFile" in item) return item.imageFile ? `File:${item.imageFile}` : null;
  return item?.wikiTitle ?? null;
}

export function allImageRefs() {
  const refs = ALL().map(imageRef).filter(Boolean);
  return [...new Set(refs)].sort();
}

/**
 * Per-image edits that hide giveaway text (signatures, name tags, inscriptions):
 *   imageEdit: { crop: [top, right, bottom, left], blur: [[x0, y0, x1, y1], …] }
 * Fractions of the image; blur boxes are relative to the cropped image.
 */
export function imageEdits() {
  const out = {};
  for (const item of ALL()) {
    const ref = imageRef(item);
    if (ref && item.imageEdit) out[ref] = item.imageEdit;
  }
  return out;
}
