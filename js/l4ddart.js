/* ---------- Left 4 Dead Ducks' pictures (placeholders in the game's style, for the owner to OK) ----------
   The zombie duck (a darker green rubber duck with X eyes, now and then in a hat or an outfit, a little bigger or
   fatter), the extra candles on the floor, the boards over the doors, the holes and the top of the deck's stairs, the
   bow in hand and its arrow, and the icons on the weapons bar. Preview: tools/l4dd-art.html */
import { duckSVG } from "./duck.js";
import { svgDataURL } from "./hangout/art.js";
import { zombieLook } from "./l4ddrules.js";

const INK = "#1c1c28";

/* a zombie's picture, made once for each look (the same look is the same picture): 64 px wide, its shadow under it */
const LOOKS = new Map();
export function zombieURL(l) {
  const k = [l[3], l[4], l[5], l[6]].join();
  if (!LOOKS.has(k))
    LOOKS.set(
      k,
      svgDataURL(
        duckSVG(zombieLook(l), { size: 64, shadow: true, dead: true }),
      ),
    );
  return LOOKS.get(k);
}
/* its box: 64 wide, as tall as its drawing (a hat makes it taller); feet 10 units over the bottom, as a duck's */
const BOXES = new Map();
export function zombieBox(l) {
  const k = [l[3], l[4], l[5], l[6]].join();
  if (!BOXES.has(k)) {
    const v = duckSVG(zombieLook(l), { size: 64, dead: true })
      .match(/viewBox="([^"]+)"/)[1]
      .split(" ")
      .map(Number);
    BOXES.set(k, {
      w: 64,
      h: (64 * v[3]) / v[2],
      feet: (64 * (v[1] + v[3] - 10)) / v[2] - (64 * v[1]) / v[2],
    });
  }
  return BOXES.get(k);
}

/* a candle on the floor: a stubby wax candle on a little brass dish, its flame (the class hg-flame flickers with the
   lamps' clock) */
export const CANDLE_BOX = { w: 30, h: 46 };
export const CANDLE = `<svg viewBox="0 0 30 46" width="30" height="46" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="15" cy="41" rx="13" ry="4.4" fill="#000" opacity=".28"/>
<ellipse cx="15" cy="39" rx="12" ry="4" fill="#c99a3c" stroke="${INK}" stroke-width="1.2"/>
<path d="M9 22v15.6q6 2.4 12 0V22Z" fill="#f4ecd8" stroke="${INK}" stroke-width="1.2"/>
<ellipse cx="15" cy="22" rx="6" ry="2.2" fill="#fffaf0" stroke="${INK}" stroke-width="1.1"/>
<path d="M11.4 24.4v6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
<path d="M15 21.6v-2.4" stroke="${INK}" stroke-width="1"/>
<path class="l4-flame" d="M15 6q5 6.4 0 13.6q-5-7.2 0-13.6Z" fill="#ffb347" stroke="#c7621c" stroke-width=".8"/>
<path d="M15 11q2 3.4 0 6.6q-2-3.2 0-6.6Z" fill="#fff4c2"/></svg>`;

/* the boards over an opening, n of them (0 … 5), in world px around the opening's spot:
   a door (the front door, in the tall north wall): planks across its doorway, one over another up the door;
   a hole in a side wall (axis 'y', a thin strip from above): a ragged dark gap in the strip, the planks across it;
   a hole in the south wall (axis 'x', a low strip): the same, along it;
   the top of the deck's stairs: a low barricade between two posts, its planks one over another */
const PLANK = "#9a6a3a",
  PLANK_D = "#6e4622",
  NAIL = "#3a3a44";
const plank = (x, y, w, h, r) =>
  `<g transform="rotate(${r.toFixed(1)} ${(x + w / 2).toFixed(1)} ${(y + h / 2).toFixed(1)})"><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2.4" fill="${PLANK}" stroke="${INK}" stroke-width="1.3"/><path d="M${(x + 4).toFixed(1)} ${(y + h * 0.38).toFixed(1)}h${(w - 8).toFixed(1)}" stroke="${PLANK_D}" stroke-width="1" opacity=".7"/><circle cx="${(x + 4.5).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="1.4" fill="${NAIL}"/><circle cx="${(x + w - 4.5).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="1.4" fill="${NAIL}"/></g>`;
const TILT = [-7, 6, -4, 8, -6]; // (each board a little crooked, always the same way)
/* which way is in from an opening's wall: +1 (east or south of it) or -1 */
const inward = (o) =>
  Math.sign(o.axis === "y" ? o.in[0] - o.x : o.in[1] - o.y) || 1;
export function boardsBox(o) {
  if (o.kind === "door") return { l: -52, t: -132, w: 104, h: 140 };
  if (o.kind === "stairs") return { l: -110, t: -70, w: 220, h: 84 };
  const k = inward(o);
  if (o.axis === "y")
    return { l: k > 0 ? -18 : -48, t: -o.half - 14, w: 66, h: 2 * o.half + 28 };
  return { l: -o.half - 14, t: -40, w: 2 * o.half + 28, h: 58 };
}
export function boardsSVG(o, n) {
  const b = boardsBox(o),
    parts = [];
  if (o.kind === "door") {
    for (let k = 0; k < n; k++)
      parts.push(plank(-50, -24 - k * 21, 100, 15, TILT[k]));
  } else if (o.kind === "stairs") {
    parts.push(
      `<rect x="-104" y="-62" width="12" height="70" rx="3" fill="${PLANK_D}" stroke="${INK}" stroke-width="1.3"/><rect x="92" y="-62" width="12" height="70" rx="3" fill="${PLANK_D}" stroke="${INK}" stroke-width="1.3"/>`,
    );
    for (let k = 0; k < n; k++)
      parts.push(plank(-100, -8 - k * 12, 200, 11, TILT[k] / 4));
  } else if (o.axis === "y") {
    /* a hole in a side wall: from above the wall is a thin strip (24 wide), so the hole is a ragged dark gap in the
       strip, its broken ends zigzagging, and the boards nailed across it on the inside lie out into the room */
    const dir = inward(o),
      JAG = [0, 7, 3, 9, 4, 8, 2, 6],
      top = [],
      bottom = [];
    for (let k = 0; k <= 7; k++) {
      const a = -13 + (26 * k) / 7;
      top.push([a, -o.half + JAG[k]]);
      bottom.push([a, o.half - JAG[(k + 3) % 8]]);
    }
    const pts = [...top, ...bottom.reverse()].map(
      ([a, c]) => `${a.toFixed(1)} ${c.toFixed(1)}`,
    );
    parts.push(
      `<path d="M${pts.join("L")}Z" fill="#05060c" stroke="#4a2c14" stroke-width="2.4" stroke-linejoin="round"/>`,
    );
    const gap = (2 * o.half - 8) / 5;
    for (let k = 0; k < n; k++) {
      const c = -o.half + 4 + gap * (k + 0.5);
      parts.push(plank(dir > 0 ? -12 : -44, c - 6.5, 56, 13, TILT[k] * dir));
    }
  } else {
    /* a hole in the south wall: a ragged dark patch along its strip, the boards up across it */
    const JAG = [9, 12, 7, 11, 8, 13, 9, 10, 12, 8],
      side = [],
      back = [];
    for (
      let k = 0, u = -o.half;
      u <= o.half + 0.1;
      k++, u += (2 * o.half) / 9
    ) {
      side.push([-JAG[k % 10], u]);
      back.push([JAG[(k + 4) % 10], u]);
    }
    const pts = [...side, ...back.reverse()].map(
      ([a, c]) => `${c.toFixed(1)} ${a - 4}`,
    );
    parts.push(
      `<path d="M${pts.join("L")}Z" fill="#05060c" stroke="#2a1a0e" stroke-width="2" stroke-linejoin="round"/>`,
    );
    const gap = (2 * o.half - 8) / 5;
    for (let k = 0; k < n; k++) {
      const c = -o.half + 4 + gap * (k + 0.5);
      parts.push(plank(c - 6, -34, 12, 44, TILT[k] * 1.6));
    }
  }
  return `<svg viewBox="${b.l} ${b.t} ${b.w} ${b.h}" width="${b.w}" height="${b.h}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}

/* the bow in hand, as the pistol is drawn (40 × 24, pointing right): a curved wooden bow, its string, an arrow on it */
export const BOW = `<svg viewBox="0 0 40 24"><path d="M14 1.4Q25 12 14 22.6" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/><path d="M14 1.4Q25 12 14 22.6" fill="none" stroke="#a8692e" stroke-width="2.4" stroke-linecap="round"/><path d="M14 1.4L9 12L14 22.6" fill="none" stroke="#f4ecd8" stroke-width=".9"/><path d="M9 12H36" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M9 12H36" stroke="#d9b98a" stroke-width="1"/><path d="M33 9.4L39 12L33 14.6Z" fill="#b8c2cc" stroke="${INK}" stroke-width="1"/><path d="M8 12l-3-3h4.4l2 3-2 3H5Z" fill="#e8424d" stroke="${INK}" stroke-width=".8"/></svg>`;
/* an arrow in flight (24 × 10, pointing right, as the bullet) */
export const ARROW = `<svg viewBox="0 0 24 10"><path d="M2 5H20" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M2 5H20" stroke="#d9b98a" stroke-width="1.1"/><path d="M18 2.2L23.6 5L18 7.8Z" fill="#b8c2cc" stroke="${INK}" stroke-width=".9"/><path d="M1 2.4L5 5L1 7.6M3.6 2.4L7.6 5L3.6 7.6" fill="none" stroke="#e8424d" stroke-width="1.3"/></svg>`;

/* the weapons bar's icons (square) */
export const ICONS = {
  bow: `<svg viewBox="0 0 30 30"><path d="M11 2Q27 15 11 28" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M11 2Q27 15 11 28" fill="none" stroke="#a8692e" stroke-width="3" stroke-linecap="round"/><path d="M11 2L5 15L11 28" fill="none" stroke="#f4ecd8" stroke-width="1"/><path d="M5 15H27" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M5 15H27" stroke="#d9b98a" stroke-width="1.2"/><path d="M24 11.6L29.4 15L24 18.4Z" fill="#b8c2cc" stroke="${INK}" stroke-width="1"/></svg>`,
  flashlight: (on) =>
    `<svg viewBox="0 0 30 30">${on ? '<path d="M17 8L29 2V28L17 22Z" fill="#fff4c2" opacity=".55"/>' : ""}<rect x="2" y="11" width="11" height="8" rx="2" fill="#3b3f4a" stroke="${INK}" stroke-width="1.3"/><path d="M13 9.4L18 7.6V22.4L13 20.6Z" fill="#6b7280" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><rect x="5" y="13.4" width="4" height="3.2" rx="1" fill="${on ? "#ffd23f" : "#8a8f99"}" stroke="${INK}" stroke-width=".8"/>${on ? "" : `<path d="M4 5L26 26" stroke="#ff3d6e" stroke-width="2.6" stroke-linecap="round"/>`}</svg>`,
};
