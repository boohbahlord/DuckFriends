/* ---------- Quacky Zombies' pictures (in the game's style; the owner OK'd them) ----------
   The zombie duck (a darker green rubber duck with X eyes, now and then in a hat or an outfit, a little bigger or
   fatter), the extra candles on the floor, the boards over the doors, the holes and the top of the deck's stairs, and the
   flashlight's icon on the weapons bar (the bow and its arrow are Mad God Justin's: mgjart.js); a weapon as an orb in its
   slot's color, and the pictures on Justin's Butler's upgrades. Preview: tools/l4dd-art.html */
import { duckSVG } from "./duck.js";
import { svgDataURL } from "./hangout/art.js";
import { zombieLook, kindOf } from "./l4ddrules.js";
import { specialById } from "./specials.js";
import { GUNS } from "./l4ddguns.js";
import { FIREBALL } from "./mgjart.js";

const INK = "#1c1c28";

/* a zombie's picture, made once for each look (the same look is the same picture): 64 px wide, its shadow under it */
const LOOKS = new Map();
export function zombieURL(l) {
  const k = [l[3], l[4], l[5], l[6], l[7]].join();
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
  const k = [l[3], l[4], l[5], l[6], l[7]].join();
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
   a hole in a side wall (axis 'y', a thin strip from above): a ragged dark gap in the strip, the planks down along it, over the gap;
   a hole in the south wall (axis 'x', a low strip): the same, its planks along it seen front on;
   the top of the deck's stairs: a low barricade between two posts, its planks one over another */
const PLANK = "#9a6a3a",
  PLANK_D = "#6e4622",
  NAIL = "#3a3a44";
const plank = (x, y, w, h, r) =>
  `<g transform="rotate(${r.toFixed(1)} ${(x + w / 2).toFixed(1)} ${(y + h / 2).toFixed(1)})"><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2.4" fill="${PLANK}" stroke="${INK}" stroke-width="1.3"/><path d="M${(x + 4).toFixed(1)} ${(y + h * 0.38).toFixed(1)}h${(w - 8).toFixed(1)}" stroke="${PLANK_D}" stroke-width="1" opacity=".7"/><circle cx="${(x + 4.5).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="1.4" fill="${NAIL}"/><circle cx="${(x + w - 4.5).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="1.4" fill="${NAIL}"/></g>`;
const TILT = [-7, 6, -4, 8, -6]; // (each board a little crooked, always the same way)
/* a side wall's boards, in the order they go up: where each one's middle sits across the gap (from the wall's line,
   + into the room), how much it leans and how much longer or shorter it runs (always the same). From inside only the
   wall's inner half shows (outside the cabin is black), so the first three cover that from edge to edge, the outer one
   running on under the black and the inner one a little out past the wall; the last two lie a little diagonal over them */
const SIDE = [
  { x: 6, r: 0, l: 0 },
  { x: 1, r: 0, l: 6 },
  { x: 11, r: 0, l: -4 },
  { x: 5, r: 7, l: 8 },
  { x: 8, r: -8, l: 2 },
];
/* a plank running down a side wall's strip, over its gap: w across, h long, centred on (x, y), leaning r degrees; its
   grain runs along it and a nail sits near each end */
const plankDown = (x, y, w, h, r) => {
  const l = x - w / 2,
    t = y - h / 2;
  return `<g transform="rotate(${r.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${l.toFixed(1)}" y="${t.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2.4" fill="${PLANK}" stroke="${INK}" stroke-width="1.3"/><path d="M${(l + w * 0.38).toFixed(1)} ${(t + 4).toFixed(1)}v${(h - 8).toFixed(1)}" stroke="${PLANK_D}" stroke-width="1" opacity=".7"/><circle cx="${x.toFixed(1)}" cy="${(t + 4.5).toFixed(1)}" r="1.4" fill="${NAIL}"/><circle cx="${x.toFixed(1)}" cy="${(t + h - 4.5).toFixed(1)}" r="1.4" fill="${NAIL}"/></g>`;
};
/* which way is in from an opening's wall: +1 (east or south of it) or -1 */
const inward = (o) =>
  Math.sign(o.axis === "y" ? o.in[0] - o.x : o.in[1] - o.y) || 1;
export function boardsBox(o) {
  if (o.kind === "door") return { l: -52, t: -132, w: 104, h: 140 };
  if (o.kind === "stairs") return { l: -110, t: -70, w: 220, h: 84 };
  const k = inward(o);
  if (o.axis === "y")
    return { l: -26, t: -o.half - 18, w: 52, h: 2 * o.half + 36 };
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
       strip, its broken ends zigzagging */
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
    /* the boards run along their own wall, down the strip, over the gap: longer than it, so they're nailed to the wall
       above and below it, and together a little wider than the strip, so the gap is covered from edge to edge */
    for (let k = 0; k < n; k++) {
      const b = SIDE[k];
      parts.push(
        plankDown(b.x * dir, b.l / 2, 11, 2 * o.half + 24 + b.l, b.r * dir),
      );
    }
  } else {
    /* a hole in the south wall: a ragged dark patch along its strip */
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
    /* the boards, seen front on like the wall's face: planks along the wall across the gap, one above another, a
       little crooked in the face's own plane like the front door's */
    for (let k = 0; k < n; k++)
      parts.push(
        plank(-o.half - 10, 1 - k * 7.5, 2 * o.half + 20, 9, TILT[k] / 3),
      );
  }
  return `<svg viewBox="${b.l} ${b.t} ${b.w} ${b.h}" width="${b.w}" height="${b.h}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}

/* the weapons bar's icons (square) */
export const ICONS = {
  flashlight: (on) =>
    `<svg viewBox="0 0 30 30">${on ? '<path d="M17 8L29 2V28L17 22Z" fill="#fff4c2" opacity=".55"/>' : ""}<rect x="2" y="11" width="11" height="8" rx="2" fill="#3b3f4a" stroke="${INK}" stroke-width="1.3"/><path d="M13 9.4L18 7.6V22.4L13 20.6Z" fill="#6b7280" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><rect x="5" y="13.4" width="4" height="3.2" rx="1" fill="${on ? "#ffd23f" : "#8a8f99"}" stroke="${INK}" stroke-width=".8"/>${on ? "" : `<path d="M4 5L26 26" stroke="#ff3d6e" stroke-width="2.6" stroke-linecap="round"/>`}</svg>`,
};

/* a weapon's picture: the specials' bar's (the knife, the pistol, the bow …), the new guns' own (l4ddguns.js), and the
   fireball's (Mad God Justin's) */
export const weaponIcon = (w) =>
  (GUNS[w] && GUNS[w].icon) ||
  (w === "fireball" ? FIREBALL : (specialById(w) || {}).icon || "");
/* a weapon as an orb, glowing in its slot's color (css: .l4orb, blue melee, red ranged, purple special, white grenades) */
export const orbHTML = (w) =>
  `<span class="l4orb k-${kindOf(w) || "special"}"><i>${weaponIcon(w)}</i></span>`;
/* Justin's Butler's upgrades: accuracy (a crosshair), attack speed (a lightning bolt), max HP (a green heart), speed
   (a running arrow), faster reload (a bullet in a turning arrow) */
export const UP_ICONS = {
  acc: `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="10" fill="#f4f4f0" stroke="${INK}" stroke-width="1.6"/><circle cx="15" cy="15" r="6.2" fill="#e8424d" stroke="${INK}" stroke-width="1.3"/><circle cx="15" cy="15" r="2.4" fill="#f4f4f0" stroke="${INK}" stroke-width="1"/><path d="M15 1.5V8M15 22V28.5M1.5 15H8M22 15H28.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  as: `<svg viewBox="0 0 30 30"><path d="M18 2L6 17H14L11 28L24 12H16Z" fill="#ffd23f" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 5.5L10.5 13" stroke="#fff6c8" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  hp: `<svg viewBox="0 0 30 30"><path d="M15 26C6 19 2.5 14.5 2.5 9.8 2.5 6.2 5.3 3.5 8.8 3.5 11.6 3.5 13.7 5.1 15 7.4 16.3 5.1 18.4 3.5 21.2 3.5 24.7 3.5 27.5 6.2 27.5 9.8 27.5 14.5 24 19 15 26Z" fill="#1fb85c" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 10V19M10.5 14.5H19.5" stroke="#f4f4f0" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  sp: `<svg viewBox="0 0 30 30"><path d="M3 9H11M1.5 15H9M3 21H11" stroke="#9cc2ff" stroke-width="2.2" stroke-linecap="round"/><path d="M12 6L21 15L12 24M18 6L27 15L18 24" fill="none" stroke="#3d7be0" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  rl: `<svg viewBox="0 0 30 30"><path d="M24.5 11A10.5 10.5 0 1 0 25 19" fill="none" stroke="#c9a24a" stroke-width="2.6" stroke-linecap="round"/><path d="M26.5 5.5L25.2 12.2L18.8 10.2" fill="none" stroke="#c9a24a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11H16A4 4 0 0 1 16 19H12Z" fill="#e0a43a" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><rect x="9" y="11" width="3.6" height="8" rx="1" fill="#c98a3a" stroke="${INK}" stroke-width="1.3"/></svg>`,
};
