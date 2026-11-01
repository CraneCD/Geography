// Accurate flags (public domain, from Wikimedia via flagcdn.com) bundled as local SVG
// files by scripts/fetch-flags.mjs. Each flag is its own asset, fetched only when shown.
const files = import.meta.glob("/src/assets/flags/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const byCode = {};
for (const [path, url] of Object.entries(files)) {
  const code = path.slice(path.lastIndexOf("/") + 1, -4);
  byCode[code] = url;
}

export function flagSrc(code) {
  return byCode[code] ?? null;
}
