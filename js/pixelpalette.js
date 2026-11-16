/* ---------- the pixel look's colors (owner, Nov 16) ----------
   One set of colors for the whole game: every picture made into pixels (pixel.js) takes the nearest of these, so a duck,
   a gun and a map share the same colors. Built from pictures of the game by tools/pixel-palette.mjs (with image-q); the
   list between the markers is its output. No dithering: flat colors, as in the samples the owner picked. */

export const PALETTE = [
  /* PALETTE START */
  "#e58687",
  "#b08d91",
  "#f25d5a",
  "#c54f45",
  "#a75368",
  "#f92c32",
  "#943f33",
  "#cd282a",
  "#c02246",
  "#a01a38",
  "#5f2c31",
  "#861126",
  "#482416",
  "#1d100e",
  "#fcea9e",
  "#fcdc52",
  "#fdd21c",
  "#f8ba99",
  "#ebbc1e",
  "#fc9f31",
  "#d4a91d",
  "#cc934f",
  "#be981c",
  "#fd850d",
  "#ae861f",
  "#d87525",
  "#ae785b",
  "#f96423",
  "#987516",
  "#ce5e19",
  "#995a2d",
  "#9b541c",
  "#795c2c",
  "#8a431f",
  "#594a22",
  "#743e19",
  "#453c20",
  "#5e3214",
  "#321b0f",
  "#f7f8f4",
  "#fdf504",
  "#c7c5a3",
  "#b1d331",
  "#9fbf0b",
  "#ada852",
  "#8fa20b",
  "#769350",
  "#8a8e1a",
  "#877c0f",
  "#486d1a",
  "#9dee82",
  "#83eb1e",
  "#73d963",
  "#21e405",
  "#4ac32b",
  "#2db61c",
  "#469d3a",
  "#1f9e14",
  "#4a884a",
  "#587d39",
  "#3b7e3a",
  "#196e17",
  "#374330",
  "#8cb29a",
  "#51be61",
  "#43645a",
  "#1f712a",
  "#193e1f",
  "#76cef1",
  "#4693b0",
  "#5a857b",
  "#0f9585",
  "#213631",
  "#13211d",
  "#b1ceeb",
  "#19a9fd",
  "#80889e",
  "#3d8fde",
  "#1788de",
  "#5d6eb5",
  "#1377b6",
  "#5a5f7a",
  "#3d60c5",
  "#0b6692",
  "#165ea5",
  "#02559c",
  "#40475e",
  "#084f86",
  "#133b66",
  "#1d2f53",
  "#181d3a",
  "#121417",
  "#9872cc",
  "#a055f9",
  "#7c57b0",
  "#8549ce",
  "#653f9b",
  "#3d47a2",
  "#55327a",
  "#462f7c",
  "#3f2e64",
  "#462471",
  "#391d6b",
  "#25253a",
  "#261f53",
  "#1d1d2a",
  "#1a1439",
  "#11122d",
  "#121020",
  "#ebc1ec",
  "#b784e0",
  "#5c3a65",
  "#332d36",
  "#0d0a0e",
  "#d5cfd1",
  "#fd73b5",
  "#d4608b",
  "#8b5881",
  "#7e4c69",
  "#a32d66",
  "#862860",
  "#8e1138",
  "#740e3f",
  "#3d162b",
  "#5f0536",
  "#540626",
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
