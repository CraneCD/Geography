// Resolves every `wikiTitle` used by the quiz data to a fixed, sized thumbnail
// URL so the app never calls the Wikipedia API at runtime.
//
//   npm run build:images            # resolve missing titles only
//   npm run build:images -- --all   # re-resolve everything
//
// Output: src/data/generated/images.json
//   { [wikiTitle]: { src, width, height, page } }
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { allImageRefs } from "../src/data/wikiTitles.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src/data/generated/images.json");
const TARGET_WIDTH = 500; // a standard Wikimedia thumbnail bucket
// Thumbnail URLs end in ".../330px-File.jpg" or ".../lossy-page1-330px-File.tif.jpg".
const THUMB_SIZE = /(\/(?:lossy-page\d+-)?)\d+px-/;
const UA = "QuizSite/1.0 (build-time image resolver; https://github.com/cranecd/geography)";

const refreshAll = process.argv.includes("--all");
const manifest = existsSync(outFile) && !refreshAll ? JSON.parse(readFileSync(outFile, "utf8")) : {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A specific Commons file: ask the Commons API for a TARGET_WIDTH thumbnail. */
async function resolveFile(ref) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query", format: "json", titles: ref, prop: "imageinfo",
    iiprop: "url|size", iiurlwidth: String(TARGET_WIDTH),
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 429) { await sleep(5000 * 2 ** attempt); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const page = Object.values((await res.json()).query?.pages ?? {})[0];
    const info = page?.imageinfo?.[0];
    if (!info) return null;
    const small = info.width <= TARGET_WIDTH;
    return {
      src: small ? info.url : info.thumburl,
      width: small ? info.width : info.thumbwidth,
      height: small ? info.height : info.thumbheight,
      page: info.descriptionurl,
    };
  }
  throw new Error("rate limited");
}

async function resolve(title) {
  if (title.startsWith("File:")) return resolveFile(title);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 429) { await sleep(2000 * 2 ** attempt); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const page = data?.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const orig = data.originalimage;
    const thumb = data.thumbnail;
    if (!orig && !thumb) return null;
    const clean = (u) => u.split("?")[0];
    // Prefer a resized thumbnail; only fall back to the original when it is already small.
    if (thumb && orig && orig.width > TARGET_WIDTH && THUMB_SIZE.test(thumb.source)) {
      const ratio = orig.height / orig.width;
      return {
        src: clean(thumb.source).replace(THUMB_SIZE, `$1${TARGET_WIDTH}px-`),
        width: TARGET_WIDTH,
        height: Math.round(TARGET_WIDTH * ratio),
        page,
      };
    }
    const img = orig ?? thumb;
    return { src: clean(img.source), width: img.width, height: img.height, page };
  }
  throw new Error("rate limited");
}

const titles = allImageRefs();
const todo = titles.filter((t) => !manifest[t]);
console.log(`${titles.length} titles, ${todo.length} to resolve`);
const failures = [];
for (const title of todo) {
  try {
    const entry = await resolve(title);
    // Animated GIFs are multi-megabyte and unreadable as quiz pictures: pick a still via `imageFile`.
    if (entry && /\.gif$/i.test(entry.src)) failures.push(`${title}: animated GIF, set imageFile on the item`);
    else if (entry) manifest[title] = entry;
    else failures.push(`${title}: no image`);
  } catch (e) {
    failures.push(`${title}: ${e.message}`);
  }
  await sleep(Number(process.env.IMG_DELAY ?? 400));
}
// Drop titles no longer referenced, keep output sorted for stable diffs.
const sorted = Object.fromEntries(
  Object.keys(manifest).filter((t) => titles.includes(t)).sort().map((t) => [t, manifest[t]]),
);
writeFileSync(outFile, JSON.stringify(sorted, null, 1) + "\n");
console.log(`wrote ${Object.keys(sorted).length} entries`);
if (failures.length) {
  console.warn(`Unresolved (${failures.length}):\n  ` + failures.join("\n  "));
  process.exitCode = 1;
}
