// Self-hosts every picture the quiz shows.
//
//   npm run build:images            # download new images + fill in missing licence data
//   npm run build:images -- --all   # re-download everything
//
// For each image ref (see src/data/wikiTitles.js):
//   1. find its Wikimedia Commons file (a hand-picked `imageFile`, or the
//      lead image of the English Wikipedia article),
//   2. download it from upload.wikimedia.org and save a 500 px WebP in
//      src/assets/quiz-images/ (progress is saved after every image),
//   3. read licence + author from the Commons API; anything that is not freely
//      licensed (public domain, CC0, CC BY, CC BY-SA, GFDL) is removed again.
//
// The app serves every image itself; nothing is fetched from Wikimedia at runtime.
// Wikimedia rate-limits aggressively, so every step retries and the script is safe to re-run.
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { allImageRefs, imageEdits } from "../src/data/wikiTitles.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src/data/generated/images.json");
const imgDir = join(root, "src/assets/quiz-images");
const WIDTH = 500;
const UA = "QuizSite/1.0 (build-time image fetcher; https://github.com/cranecd/geography)";
const FREE = /^(public domain|pd\b|cc0|cc[ -]by|gfdl|attribution|no restrictions|copyrighted free use)/i;

const refreshAll = process.argv.includes("--all");
const manifest = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
mkdirSync(imgDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const save = () => {
  const refs = new Set(allImageRefs());
  const sorted = Object.fromEntries(Object.keys(manifest).filter((r) => refs.has(r)).sort().map((r) => [r, manifest[r]]));
  writeFileSync(outFile, JSON.stringify(sorted, null, 1) + "\n");
};

async function fetchRetry(url, { tries = 8, json = false } = {}) {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 404) return { status: 404 };
      if (res.status === 429 || res.status >= 500) { await sleep(Math.min(120000, 5000 * 2 ** attempt)); continue; }
      if (!res.ok) return { status: res.status };
      if (json) {
        const text = await res.text();
        if (!text.startsWith("{")) { await sleep(Math.min(120000, 5000 * 2 ** attempt)); continue; }
        return { status: 200, data: JSON.parse(text) };
      }
      return { status: 200, data: Buffer.from(await res.arrayBuffer()) };
    } catch {
      await sleep(5000 * 2 ** attempt);
    }
  }
  return { status: 429 };
}

const underscored = (name) => name.replace(/ /g, "_");
function uploadUrls(name) {
  const file = underscored(name);
  const h = createHash("md5").update(file).digest("hex");
  const enc = encodeURIComponent(file);
  const thumbName = /\.svg$/i.test(file) ? `${enc}.png` : /\.tiff?$/i.test(file) ? `lossy-page1-${enc}.jpg` : enc;
  return [
    `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.slice(0, 2)}/${enc}/${WIDTH}px-${thumbName}`,
    `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h.slice(0, 2)}/${enc}`,
  ];
}

/** Commons file name for a ref, reusing previously resolved names. */
async function commonsFileFor(ref) {
  if (ref.startsWith("File:")) return ref.slice(5).replace(/_/g, " ");
  if (manifest[ref]?.commonsFile) return manifest[ref].commonsFile;
  const known = manifest[ref]?.src;
  if (known) {
    if (!known.includes("/wikipedia/commons/")) return { nonFree: true };
    return fileNameFromUrl(known);
  }
  const { status, data } = await fetchRetry(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ref)}`, { json: true });
  if (status !== 200) throw new Error(`summary HTTP ${status}`);
  const src = data?.originalimage?.source;
  if (!src) return null;
  if (!src.includes("/wikipedia/commons/")) return { nonFree: true };
  return fileNameFromUrl(src);
}

/** "…/commons/a/ab/File.jpg" or "…/commons/thumb/a/ab/File.jpg/3840px-File.jpg" → "File.jpg" */
function fileNameFromUrl(url) {
  const parts = url.split("?")[0].split("/wikipedia/commons/")[1].split("/");
  return decodeURIComponent(parts[0] === "thumb" ? parts[3] : parts[2]).replace(/_/g, " ");
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 80);

/** Crop margins and blur boxes (fractions) that hide giveaway text. */
async function applyEdit(raw, edit) {
  if (!edit) return raw;
  let img = sharp(raw, { limitInputPixels: false }).rotate();
  const { width: W, height: H } = await img.metadata();
  const [t = 0, r = 0, b = 0, l = 0] = edit.crop ?? [];
  const box = { left: Math.round(l * W), top: Math.round(t * H), width: Math.round((1 - l - r) * W), height: Math.round((1 - t - b) * H) };
  let buf = await img.extract(box).toBuffer();
  for (const [x0, y0, x1, y1] of edit.blur ?? []) {
    const region = { left: Math.round(x0 * box.width), top: Math.round(y0 * box.height), width: Math.round((x1 - x0) * box.width), height: Math.round((y1 - y0) * box.height) };
    const sigma = Math.max(6, Math.round(Math.min(region.width, region.height) / 4));
    const patch = await sharp(buf).extract(region).blur(sigma).toBuffer();
    buf = await sharp(buf).composite([{ input: patch, left: region.left, top: region.top }]).toBuffer();
  }
  return buf;
}

// ── 1 + 2. Resolve and download ───────────────────────────────────────────
const refs = allImageRefs();
const edits = imageEdits();
for (const ref of refs) {
  const entry = manifest[ref];
  const editChanged = JSON.stringify(entry?.edit ?? null) !== JSON.stringify(edits[ref] ?? null);
  if (!refreshAll && !editChanged && entry?.file && existsSync(join(imgDir, entry.file))) continue;
  let file;
  try {
    file = await commonsFileFor(ref);
  } catch (e) {
    failures.push(`${ref}: ${e.message}`);
    continue;
  }
  if (!file) { failures.push(`${ref}: the article has no image`); delete manifest[ref]; continue; }
  if (typeof file === "object") { failures.push(`${ref}: non-free image on en.wikipedia — choose a free Commons file via imageFile`); delete manifest[ref]; continue; }
  if (/\.gif$/i.test(file)) { failures.push(`${ref}: animated GIF — set imageFile on the item`); delete manifest[ref]; continue; }

  let raw = null;
  for (const url of uploadUrls(file)) {
    const res = await fetchRetry(url, { tries: 6 });
    if (res.status === 200) { raw = res.data; break; }
  }
  if (!raw) { failures.push(`${ref}: download failed (${file})`); continue; }
  try {
    const name = `${slug(ref.replace(/^File:/, ""))}.webp`;
    const edited = await applyEdit(raw, edits[ref]);
    const out = await sharp(edited, { limitInputPixels: false })
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    writeFileSync(join(imgDir, name), out.data);
    manifest[ref] = {
      file: name, width: out.info.width, height: out.info.height, commonsFile: file,
      page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(underscored(file))}`,
      author: entry?.author ?? null, license: entry?.license ?? null, licenseUrl: entry?.licenseUrl ?? null,
      ...(edits[ref] ? { edit: edits[ref] } : {}),
    };
    save();
    process.stdout.write(".");
  } catch (e) {
    failures.push(`${ref}: could not convert (${e.message})`);
  }
  await sleep(800);
}
process.stdout.write("\n");

// ── 3. Licence + author, 50 files per API request ─────────────────────────
const strip = (html) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const needMeta = Object.entries(manifest).filter(([, e]) => e.file && !e.license);
for (let i = 0; i < needMeta.length; i += 50) {
  const batch = needMeta.slice(i, i + 50);
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query", format: "json", prop: "imageinfo", iiprop: "extmetadata",
    titles: batch.map(([, e]) => `File:${e.commonsFile}`).join("|"),
  });
  const { status, data } = await fetchRetry(url, { tries: 12, json: true });
  if (status !== 200) { failures.push(`licence lookup rate-limited for ${batch.length} files — re-run later`); continue; }
  const norm = Object.fromEntries((data.query.normalized ?? []).map((n) => [n.to, n.from]));
  const byFile = {};
  for (const page of Object.values(data.query.pages ?? {})) {
    const asked = (norm[page.title] ?? page.title).replace(/^File:/, "").replace(/_/g, " ");
    byFile[asked] = page.imageinfo?.[0]?.extmetadata ?? null;
  }
  for (const [ref, e] of batch) {
    const meta = byFile[e.commonsFile];
    if (!meta) { failures.push(`${ref}: no licence information`); continue; }
    const license = strip(meta.LicenseShortName?.value) || "Unknown";
    if (!FREE.test(license)) {
      failures.push(`${ref}: licence "${license}" is not free — removed`);
      unlinkSync(join(imgDir, e.file));
      delete manifest[ref];
      continue;
    }
    e.license = license;
    e.licenseUrl = meta.LicenseUrl?.value ?? null;
    e.author = strip(meta.Artist?.value).slice(0, 80) || null;
  }
  save();
  await sleep(2000);
}

save();
console.log(`${Object.keys(manifest).length} images self-hosted`);
if (failures.length) {
  console.warn(`Needs attention (${failures.length}):\n  ` + failures.join("\n  "));
  process.exitCode = 1;
}
