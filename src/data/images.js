// Image lookup backed by the build-time manifest (scripts/resolve-images.mjs).
// Every picture is self-hosted from src/assets/quiz-images/ (no runtime Wikimedia calls);
// only items with a resolved, freely licensed image are used for picture questions.
import manifest from "./generated/images.json";
import { imageRef } from "./wikiTitles.js";

const files = import.meta.glob("/src/assets/quiz-images/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const urlByFile = {};
for (const [path, url] of Object.entries(files)) urlByFile[path.slice(path.lastIndexOf("/") + 1)] = url;

// Our own label-free drawings (scripts/build-illustrations.mjs), used where no free photo works.
const drawings = import.meta.glob("/src/assets/illustrations/*.svg", { eager: true, query: "?url", import: "default" });
const illustrationUrl = {};
for (const [path, url] of Object.entries(drawings)) illustrationUrl[path.slice(path.lastIndexOf("/") + 1, -4)] = url;

/** Manifest entry for an item (or a raw manifest key), with its served `src`. */
export function imageFor(itemOrRef) {
  if (itemOrRef?.illustration && illustrationUrl[itemOrRef.illustration]) {
    return { src: illustrationUrl[itemOrRef.illustration], width: 400, height: 520, page: null, author: null, license: null };
  }
  const ref = typeof itemOrRef === "string" ? itemOrRef : imageRef(itemOrRef);
  const entry = ref ? manifest[ref] : null;
  const src = entry && urlByFile[entry.file];
  return src ? { ...entry, src } : null;
}

export function hasImage(item) {
  return Boolean(imageFor(item));
}

export function imageMedia(item, alt) {
  const img = imageFor(item);
  if (!img) return null;
  return {
    kind: "image", src: img.src, width: img.width, height: img.height, alt,
    page: img.page, credit: { author: img.author, license: img.license, licenseUrl: img.licenseUrl },
  };
}
