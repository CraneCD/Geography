// Draws the label-free anatomy illustrations used where no suitable free photo
// exists (Human Body quiz). One shared torso diagram; each file highlights one organ.
//
//   npm run build:illustrations
//
// Output: src/assets/illustrations/<organ>.svg  (committed)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/assets/illustrations");
mkdirSync(outDir, { recursive: true });

// Anterior view: the person's right side is on the viewer's left.
const TORSO =
  "M175 0 L175 35 C140 45 70 50 45 80 C30 100 55 140 72 170 C80 230 92 300 98 360 " +
  "C95 400 82 440 80 520 L320 520 C318 440 305 400 302 360 C308 300 320 230 328 170 " +
  "C345 140 370 100 355 80 C330 50 260 45 225 35 L225 0 Z";

const ORGANS = {
  lungRight: "M84 206 C74 150 96 96 150 86 C174 86 182 112 180 200 C160 210 110 214 84 206 Z",
  lungLeft: "M316 206 C326 150 304 96 250 86 C226 86 220 112 222 196 C232 186 290 200 316 206 Z",
  heart: "M196 128 C214 116 248 128 250 154 C252 180 232 198 214 204 C200 196 186 180 186 160 C186 146 188 134 196 128 Z",
  liver: "M104 216 C130 196 214 196 246 214 C252 226 236 240 206 248 C170 262 130 276 112 268 C100 256 97 232 104 216 Z",
  stomach:
    "M238 212 C264 198 302 204 307 232 C313 266 296 302 262 306 C238 308 220 298 212 284 " +
    "C224 280 240 284 254 276 C272 266 276 244 262 232 C252 224 242 226 234 226 Z",
  spleen: "M302 220 C320 214 333 236 328 263 C324 282 311 290 300 280 C307 260 307 240 302 220 Z",
  pancreas:
    "M176 290 C174 277 191 270 205 277 C230 284 260 271 290 264 C300 262 302 274 293 279 " +
    "C263 290 232 300 206 303 C191 306 178 301 176 290 Z",
  kidneyRight: "M150 296 C172 296 179 318 171 325 C165 329 165 337 171 341 C179 349 171 364 150 364 C129 364 123 344 123 330 C123 311 131 296 150 296 Z",
  kidneyLeft: "M250 284 C228 284 221 306 229 313 C235 317 235 325 229 329 C221 337 229 352 250 352 C271 352 277 332 277 318 C277 299 269 284 250 284 Z",
};

const TARGETS = {
  kidney: ["kidneyRight", "kidneyLeft"],
  stomach: ["stomach"],
  pancreas: ["pancreas"],
  spleen: ["spleen"],
};

// Draw order: deeper organs first so the front ones overlap them.
const ORDER = ["kidneyRight", "kidneyLeft", "pancreas", "spleen", "lungRight", "lungLeft", "heart", "liver", "stomach"];

function svg(target) {
  const highlighted = new Set(TARGETS[target]);
  const organ = (key) =>
    highlighted.has(key)
      ? `<path d="${ORGANS[key]}" fill="#D9483B" stroke="#7E241B" stroke-width="2.5" stroke-linejoin="round"/>`
      : `<path d="${ORGANS[key]}" fill="#EADBCB" stroke="#9C8B7A" stroke-width="1.5" stroke-linejoin="round"/>`;
  // Highlighted organs are drawn last so they are never hidden behind others.
  const order = [...ORDER.filter((k) => !highlighted.has(k)), ...ORDER.filter((k) => highlighted.has(k))];
  const ribs = [130, 155, 180, 205]
    .map((y) => `<path d="M200 ${y - 20} C160 ${y - 10} 110 ${y} 92 ${y + 22} M200 ${y - 20} C240 ${y - 10} 290 ${y} 308 ${y + 22}" fill="none" stroke="#D3C3B2" stroke-width="2"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="400" height="520">
<rect width="400" height="520" fill="#FFFFFF"/>
<path d="${TORSO}" fill="#F6EDE3" stroke="#1B2A4A" stroke-width="3" stroke-linejoin="round"/>
${ribs}
<rect x="192" y="210" width="16" height="250" rx="8" fill="#E7DCCF" stroke="#C9B9A7" stroke-width="1.5"/>
${order.map(organ).join("\n")}
</svg>
`;
}

for (const target of Object.keys(TARGETS)) {
  writeFileSync(join(outDir, `${target}.svg`), svg(target));
}
console.log(`wrote ${Object.keys(TARGETS).length} illustrations to ${outDir}`);
