/* ---------- the rainbow skin (owner, Nov 17) ----------
   "the skin has a literal rainbow across its skin, and the rainbow revolves, like each color changes into the next in
   accordance to a rainbow ... every color of the rainbow kind of has blurred lines where the colors kind of naturally
   transition into each other, like a natural rainbow, not having stark, blocks of colors". So: the rainbow's seven
   colors in bands slanting across the skin, each blending softly into the next, and the whole rainbow moving on slowly
   so every spot turns into the next color in the rainbow's order, round and round (one turn every RB_MS). Dat Boi's
   rainbow rank wears it (datboi.js), and so can any duck, as a skin of its own (duck.js, metal "rainbow").
   It's gradients in the drawing (rbGrad), one rainbow for the whole drawing so the bands run on from the body to the
   head (and his unicycle). Every drawing shows as pixels (the pixel look), so it's made into RB_N pictures, one per step
   of a turn, in one tall picture (rbSprite) shown one step at a time by css (pixel.js pxSVG, pxdom.js, css .rbsp; a
   drawing's own SMIL animation didn't move once it was put on the page, in Chromium). Animations off: it stands still. */
/* a color toward white (to 255) or black (to 0) by t (duck.js' mix: here too, so neither file needs the other) */
const mix = (hex, to, t) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    "#" +
    [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) =>
        Math.round(v + (to - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
};

export const RB_MS = 6000; // one turn of the rainbow: each spot goes through every color in this time
export const RB_N = 24; // the pixel look's steps in a turn
const P = 84; // the rainbow's width across its bands (the 120 box's units): a whole rainbow fits across a duck
const TILT = -35.5; // the bands' slant (and a mark only these gradients carry: rbFrame finds them by it)
const COLORS = [
  "#ff2b2b", // red
  "#ff8c1a", // orange
  "#ffe135", // yellow
  "#3ed64a", // green
  "#2f8dff", // blue
  "#5a3fd8", // indigo
  "#b24cff", // violet
];

/* the rainbow as a gradient, gid its id; k: lighter (0 … 1) or darker (-1 … 0) for the light, the shade and the edge */
export function rbGrad(gid, k = 0) {
  const cs = COLORS.map((c) =>
      k > 0 ? mix(c, 255, k) : k < 0 ? mix(c, 0, -k) : c,
    ),
    stops = [...cs, cs[0]]
      .map(
        (c, i) =>
          `<stop offset="${(i / COLORS.length).toFixed(4)}" stop-color="${c}"/>`,
      )
      .join("");
  return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${P}" y2="0" spreadMethod="repeat" gradientTransform="rotate(${TILT}) translate(0 0)">${stops}</linearGradient>`;
}
/* the soft ball of light a plain duck has (light in the middle, darker at its edges), laid over the rainbow so the skin
   stays round */
export const rbShade = (gid, cx, cy) =>
  `<radialGradient id="${gid}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>`;

/* does this drawing wear the rainbow? */
export const hasRb = (text) => text.includes(`rotate(${TILT}) translate(`);

/* the drawing at step k of RB_N: its rainbow moved on that far, standing still */
const TR = new RegExp(
  `rotate\\(${String(TILT).replace(".", "\\.")}\\) translate\\([-\\d.]+ 0\\)`,
  "g",
);
export function rbFrame(text, k) {
  const at = ((-P * k) / RB_N).toFixed(2);
  return text.replace(TR, `rotate(${TILT}) translate(${at} 0)`);
}

/* every step of a turn in one tall picture, W × H each (the drawing's own size), top to bottom. Each step's ids made
   its own, so its rainbow is its own */
export function rbSprite(text, W, H) {
  const i = text.indexOf(">"),
    one =
      text.slice(0, i).replace(/\s(?:width|height|x|y)="[^"]*"/g, "") +
      text.slice(i);
  let out = "";
  for (let k = 0; k < RB_N; k++)
    out += rbFrame(one, k)
      .replace(/\bid="([^"]+)"/g, `id="$1-${k}"`)
      .replace(
        /url\((&quot;|["']?)#([^)"'&]+)\1\)/g,
        (m, q, n) => `url(${q}#${n}-${k}${q})`,
      )
      .replace(/href="#([^"]+)"/g, `href="#$1-${k}"`)
      .replace(/^<svg\b/, `<svg x="0" y="${k * H}" width="${W}" height="${H}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H * RB_N}" viewBox="0 0 ${W} ${H * RB_N}">${out}</svg>`;
}
