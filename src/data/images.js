// Image lookup backed by the build-time manifest (scripts/resolve-images.mjs).
// Only items with a resolved image are used for picture questions.
import manifest from "./generated/images.json";
import { imageRef } from "./wikiTitles.js";

/** Manifest entry for an item (or a raw manifest key). */
export function imageFor(itemOrRef) {
  const ref = typeof itemOrRef === "string" ? itemOrRef : imageRef(itemOrRef);
  return ref ? manifest[ref] ?? null : null;
}

export function hasImage(item) {
  return Boolean(imageFor(item));
}

export function imageMedia(item, alt) {
  const img = imageFor(item);
  return img ? { kind: "image", src: img.src, width: img.width, height: img.height, page: img.page, alt } : null;
}
