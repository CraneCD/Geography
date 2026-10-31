// Flags are bundled locally (served as static SVG assets), so the quiz does not
// depend on a third-party flag CDN and works offline after the first load.
const files = import.meta.glob("/node_modules/country-flag-icons/3x2/*.svg", {
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
