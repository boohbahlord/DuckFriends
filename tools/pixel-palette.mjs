/* ---------- the pixel look's palette (owner, Nov 16) ----------
   I build the game's one set of colors from pictures of the game itself (every map, the menus, ducks, zombies, Justin),
   with image-q (MIT, https://github.com/ibezkrovnyi/image-quantization) doing the choosing, then write it into
   js/pixelpalette.js. Run it again when a new map or a lot of new art comes in.

   Usage, from a scratch folder that has the two libraries (they are not part of the game):
     npm i image-q@4.0.0 pngjs@7
     node /path/to/DuckFriends/tools/pixel-palette.mjs shot1.png shot2.png ...
   The pictures: the game's screens with their words hidden (the words keep their own colors). */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.cwd(), "here.js")); // (the libraries come from the folder I run it in)
const iq = require("image-q");
const { PNG } = require("pngjs");

const COLORS = 128; // (32 to a duck: the owner's pick; white and the darkest ink are two of them)
const SAT = 1.25; // (a little more color first, as in the samples: flat pixel colors read duller than soft shading)
const STEP = 3; // (every third pixel each way is plenty to find the colors)
const OUT = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../js/pixelpalette.js",
);

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Give it the game's pictures (png).");
  process.exit(1);
}
const px = [];
for (const f of files) {
  const { width, height, data } = PNG.sync.read(readFileSync(f));
  for (let y = 0; y < height; y += STEP)
    for (let x = 0; x < width; x += STEP) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]],
        l = 0.299 * r + 0.587 * g + 0.114 * b,
        c = (v) => Math.max(0, Math.min(255, Math.round(l + (v - l) * SAT)));
      px.push(c(r), c(g), c(b), 255);
    }
}
const pc = iq.utils.PointContainer.fromUint8Array(
  Uint8Array.from(px),
  px.length / 4,
  1,
);
const pal = iq.buildPaletteSync([pc], {
  colors: COLORS - 2,
  paletteQuantization: "wuquant",
  colorDistanceFormula: "euclidean-bt709",
});
const list = pal
  .getPointContainer()
  .getPointArray()
  .map((p) => [p.r, p.g, p.b]);
list.push([255, 255, 255], [16, 16, 22]);
const hex = list.map(
  ([r, g, b]) =>
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""),
);
const src = readFileSync(OUT, "utf8").replace(
  /\/\* PALETTE START \*\/[\s\S]*?\/\* PALETTE END \*\//,
  `/* PALETTE START */\n${hex.map((h) => `  "${h}",`).join("\n")}\n  /* PALETTE END */`,
);
writeFileSync(OUT, src);
console.log(
  `${hex.length} colors from ${files.length} pictures, written to js/pixelpalette.js`,
);
