// Image lookup backed by the build-time manifest (scripts/resolve-images.mjs).
// Only items with a resolved image are used for picture questions.
import manifest from "./generated/images.json";

export function imageFor(wikiTitle) {
  return wikiTitle ? manifest[wikiTitle] ?? null : null;
}

export function hasImage(item) {
  return Boolean(imageFor(item?.wikiTitle));
}

export function imageMedia(item, alt) {
  const img = imageFor(item.wikiTitle);
  return img ? { kind: "image", src: img.src, width: img.width, height: img.height, page: img.page, alt } : null;
}
