/* ---------- the pixel look's colors (owner, Nov 16) ----------
   One set of colors for the whole game: every picture made into pixels (pixel.js) takes the nearest of these, so a duck,
   a gun and a map share the same colors. Built from pictures of the game by tools/pixel-palette.mjs (with image-q); the
   list between the markers is its output. No dithering: flat colors, as in the samples the owner picked. */

export const PALETTE = [
  /* PALETTE START */
  "#fc8c98",
  "#d18b91",
  "#aa8e8d",
  "#d27962",
  "#ac7561",
  "#e7583e",
  "#f7510d",
  "#ba4e44",
  "#ee2e64",
  "#a24337",
  "#f92726",
  "#8d3d24",
  "#c7282a",
  "#bb204b",
  "#513530",
  "#99163b",
  "#89132c",
  "#820a17",
  "#1d100e",
  "#4c0110",
  "#fcdb4e",
  "#fed618",
  "#fcbe94",
  "#e1c215",
  "#d0bf43",
  "#fba229",
  "#c9a11e",
  "#fe8508",
  "#ea8537",
  "#b58d1e",
  "#db7804",
  "#d07528",
  "#ae7838",
  "#9d7915",
  "#8a7815",
  "#c45615",
  "#975421",
  "#775915",
  "#805031",
  "#773b11",
  "#5e3215",
  "#453219",
  "#381e10",
  "#f7f8f3",
  "#fcf289",
  "#d0cfa2",
  "#94ca4d",
  "#b4b24e",
  "#9fbe05",
  "#899317",
  "#788b59",
  "#808b3e",
  "#7c7b03",
  "#534f1a",
  "#b7fb9b",
  "#95ec82",
  "#82ea20",
  "#20e407",
  "#77b838",
  "#42bd28",
  "#5ab05c",
  "#1faa10",
  "#538f28",
  "#3d813f",
  "#358226",
  "#247a14",
  "#1f6d20",
  "#106406",
  "#9eb3a1",
  "#30d399",
  "#14bd84",
  "#1ac13c",
  "#259f6f",
  "#559075",
  "#4d7e59",
  "#1d7d30",
  "#1b4c24",
  "#1c3d22",
  "#162c1f",
  "#7dd4f7",
  "#599ca6",
  "#108c8f",
  "#353636",
  "#16aafc",
  "#849097",
  "#3f95db",
  "#1685dc",
  "#4366c3",
  "#565d77",
  "#28638f",
  "#3a55b5",
  "#0d60a4",
  "#414d59",
  "#025697",
  "#035077",
  "#143b64",
  "#1f2757",
  "#171d3a",
  "#111417",
  "#9579d7",
  "#a056f6",
  "#8448cc",
  "#6b4da5",
  "#433e99",
  "#492d7b",
  "#3c3264",
  "#3b1e6c",
  "#27253b",
  "#1d1e29",
  "#171336",
  "#111026",
  "#d6ccd8",
  "#766d7c",
  "#805381",
  "#58366a",
  "#532367",
  "#0d0a0e",
  "#fd71b5",
  "#d36087",
  "#9f537e",
  "#a04064",
  "#7c4a64",
  "#922a5f",
  "#720e3f",
  "#3f162c",
  "#59052e",
  "#ffffff",
  "#101016",
  /* PALETTE END */
];

const SAT = 1.25; // (a little more color first: flat pixel colors read duller than the soft shading they replace)
const RGB = PALETTE.map((h) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
);
/* the nearest color for each 5-bit-per-channel color, found the first time it's needed (32,768 at most) */
const NEAR = new Int16Array(32768).fill(-1);

function nearest(r, g, b) {
  const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  let i = NEAR[k];
  if (i >= 0) return i;
  let best = Infinity;
  for (let j = 0; j < RGB.length; j++) {
    const [pr, pg, pb] = RGB[j],
      dr = pr - r,
      dg = pg - g,
      db = pb - b,
      d = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
    if (d < best) {
      best = d;
      i = j;
    }
  }
  NEAR[k] = i;
  return i;
}

/* every pixel of a small picture to the palette, in place. See-through goes to three steps (none, half, all), so edges
   stay hard but a soft shadow stays a shadow */
export function applyPalette(img) {
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const a = d[p + 3];
    if (a < 64) {
      d[p + 3] = 0;
      continue;
    }
    d[p + 3] = a < 192 ? 128 : 255;
    const r = d[p],
      g = d[p + 1],
      b = d[p + 2],
      l = 0.299 * r + 0.587 * g + 0.114 * b,
      c = (v) => Math.max(0, Math.min(255, l + (v - l) * SAT)),
      [nr, ng, nb] = RGB[nearest(c(r), c(g), c(b))];
    d[p] = nr;
    d[p + 1] = ng;
    d[p + 2] = nb;
  }
  return img;
}
