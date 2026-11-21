/* ---------- Quacky Zombies' pictures (in the game's style; the owner OK'd them) ----------
   The zombie duck (a darker green rubber duck with X eyes, now and then in a hat or an outfit, a little bigger or
   fatter), the boards over the doors, the holes and the top of the deck's stairs, and the
   flashlight's icon on the weapons bar (the bow and its arrow are Mad God Justin's: mgjart.js); a weapon as an orb in its
   slot's color, and the pictures on Justin's Butler's upgrades. Preview: tools/l4dd-art.html */
import { GOLD_CHAIR, GUNS } from "./gunart.js";
import { duckSVG } from "./duck.js";
import {
  BLOOD,
  BLOOD_D,
  BLOOD_L,
  place,
  CUT,
  BRUISE,
  bleeding,
  hitsOf,
} from "./wounds.js";
import { svgDataURL } from "./hangout/art.js";
import { zombieLook, tintOf } from "./l4ddrules.js";
import { kindOf } from "./guns.js";
import { specialById, pistolIcon } from "./specials.js";
import { justinSVG } from "./hangout/npcart.js";

const INK = "#1c1c28";

/* ---------- the zombies' scars, cuts and rot (owner 2026-11-04 03:16Z: random on each zombie) ----------
   Each mark sits on one spot of the duck, so two never pile up: on the head (the crown, the back of the head, the
   cheek, around an eye, the neck) or on the body (the chest, low on the chest, the belly, by the tail). The body's are
   under the clothes. Simple flat shapes with a dark edge, like the rest of the game. In the 120 box (duck.js). */
const SCAR = "#b9a691", // a healed welt
  SEAM = "#2a1d1a", // its stitches
  ROT = "#8c9a3a", // sickly yellow-green
  ROT_D = "#5a5622",
  ROT_S = "#33300f";
/* a stitched welt along points, with a stitch across it at each inner point */
const stitched = (pts, w = 3.4) => {
  const d = "M" + pts.map((p) => p.join(" ")).join("L");
  let st = "";
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1],
      [bx, by] = pts[i + 1],
      len = Math.hypot(bx - ax, by - ay) || 1,
      nx = (-(by - ay) / len) * 2.8,
      ny = ((bx - ax) / len) * 2.8,
      [x, y] = pts[i];
    st += `M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}L${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}`;
  }
  return `<path d="${d}" stroke="${SCAR}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${d}" stroke="${SEAM}" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${st}" stroke="${SEAM}" stroke-width="1.1" stroke-linecap="round"/>`;
};
/* a rotten patch: the blob, a darker middle and a few dark specks */
const rot = (blob, mid, specks) =>
  `<path d="${blob}" fill="${ROT}" stroke="${ROT_D}" stroke-width="1"/>
<path d="${mid}" fill="${ROT_D}" opacity=".85"/>
${specks.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ROT_S}"/>`).join("")}`;
/* bigger about a point, so a mark still reads on a 64 px zombie */
const grow = (svg, cx, cy, k) =>
  `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${svg}</g>`;
/* the owner liked the cuts, the bleeding cuts, the bruises, the bites and the torn holes best (2026-11-04 04:01Z), so
   those come in many places: their shapes, each around 0 0 */
const BITE = `<ellipse rx="10" ry="6.4" fill="${BLOOD}" opacity=".45"/>
${[
  [-7.4, -2, -40],
  [-3.2, -4.6, -15],
  [2, -5, 10],
  [6.8, -3, 35],
  [-6.8, 2.6, 40],
  [-2.4, 4.8, 15],
  [2.6, 5, -10],
  [7, 2.8, -35],
]
  .map(
    ([x, y, a]) =>
      `<ellipse cx="${x}" cy="${y}" rx="1.1" ry="1.9" fill="${BLOOD_D}" transform="rotate(${a} ${x} ${y})"/>`,
  )
  .join("")}`;
const HOLE = `<path d="M-6.6 .4L-3.2 -4.4L-.2 -1.4L3 -5L6.8 -.4L5.2 4L.8 6.2L-3.6 5.2Z" fill="#1d140e" stroke="#20361a" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M-3 1.4Q.4 -1 4 1.2" stroke="#3a2a1a" stroke-width="1" fill="none"/>
<path d="M-.2 -1.4L1.4 -6.6L3 -5Z" fill="#5d8f4c" stroke="#20361a" stroke-width=".8" stroke-linejoin="round"/>`;
const MANY = {
  cutTop: [
    "head",
    "crown",
    "Cut (top of the head)",
    place(CUT, 64, 26, -38, 1.2),
  ],
  bleedNape: [
    "head",
    "nape",
    "Bleeding cut (back of the head)",
    bleeding(60, 44, 72, 1.05),
  ],
  bruiseNape: [
    "head",
    "nape",
    "Bruise (back of the head)",
    place(BRUISE, 62, 42, 0, 0.95),
  ],
  biteNape: [
    "head",
    "nape",
    "Bite (back of the head)",
    place(BITE, 62, 42, 80, 0.95),
  ],
  holeTop: [
    "head",
    "crown",
    "Torn hole (top of the head)",
    place(HOLE, 59, 33, -30, 1.05),
  ],
  cutChest: ["body", "chest", "Cut (chest)", place(CUT, 90, 75, -60, 1.5)],
  bleedChest: [
    "body",
    "chest",
    "Bleeding cut (chest)",
    bleeding(90, 74, -25, 1.4, 2),
  ],
  bruiseChest: [
    "body",
    "chest",
    "Bruise (chest)",
    place(BRUISE, 90, 76, 0, 1.3),
  ],
  biteChest: ["body", "chest", "Bite (chest)", place(BITE, 91, 76, -70, 1.35)],
  bleedBelly: [
    "body",
    "belly",
    "Bleeding cut (belly)",
    bleeding(64, 93, -32, 1.2),
  ],
  bruiseBelly: [
    "body",
    "belly",
    "Bruise (belly)",
    place(BRUISE, 66, 97, 0, 1.4),
  ],
  holeBelly: [
    "body",
    "belly",
    "Torn hole (belly)",
    place(HOLE, 60, 97, 10, 1.45),
  ],
  cutTail: ["body", "tail", "Cut (tail)", place(CUT, 22, 63, 45, 1.3)],
  bruiseTail: ["body", "tail", "Bruise (tail)", place(BRUISE, 22, 64, 0, 1.1)],
  biteTail: ["body", "tail", "Bite (tail)", place(BITE, 22, 64, 30, 1.2)],
  holeTail: ["body", "tail", "Torn hole (tail)", place(HOLE, 22, 63, 20, 1.3)],
};
export const WOUNDS = {
  // the head
  scar: {
    on: "head",
    spot: "crown",
    name: "Stitched scar",
    svg: stitched(
      [
        [55, 42],
        [58.6, 35.6],
        [62.6, 30.2],
        [67.4, 25.8],
        [72.6, 22.4],
        [78.4, 20.4],
      ],
      4.4,
    ),
  },
  crack: {
    on: "head",
    spot: "crown",
    name: "Cracked",
    svg: `<path d="M55.4 23.6L62.4 29.4L58.6 35.4L64.6 42M62.4 29.4L69.6 28L72.4 33.4M58.6 35.4L53.6 37.6M69.6 28L71.4 22.4" stroke="#17240f" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M63.4 30.6L68.8 29.6M60.2 35.6L64.6 40.6" stroke="#8fc46e" stroke-width=".8" stroke-linecap="round" opacity=".75"/>`,
  },
  rotHead: {
    on: "head",
    spot: "nape",
    name: "Rot (head)",
    svg: grow(
      rot(
        "M54 37C58 32.5 66 33.5 68 38.6C70.6 43 69 50 63 52C57 54 52.6 50 53 45C53 42 52.4 39.4 54 37Z",
        "M57.6 40.4C60.6 38 64.6 39.6 64.8 43.4C65 47 61.6 48.6 58.8 47.6C56.4 46.6 55.6 42.4 57.6 40.4Z",
        [
          [60.4, 41.4, 1.3],
          [63.8, 47.6, 1],
          [56.6, 47, 0.9],
          [66, 40.6, 0.7],
        ],
      ),
      61,
      43,
      1.35,
    ),
  },
  cut: {
    on: "head",
    spot: "cheek",
    name: "Cut",
    svg: grow(
      `<path d="M77 53.4Q86 46.6 95.4 47.6Q87 51.8 77 53.4Z" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width="1" stroke-linejoin="round"/>
<path d="M80.4 51.8Q86 48.8 92 48.4" stroke="${BLOOD_L}" stroke-width=".9" fill="none" stroke-linecap="round"/>`,
      86,
      50,
      1.45,
    ),
  },
  cutDrip: {
    on: "head",
    spot: "cheek",
    name: "Bleeding cut",
    svg: grow(
      `<path d="M84.4 50.4C84.6 53 83.8 55.6 83.8 57.4a2 2 0 0 0 4 0C87.8 55.6 87 53 87 49.6Z" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width=".8"/>
<path d="M77 53.4Q86 46.6 95.4 47.6Q87 51.8 77 53.4Z" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width="1" stroke-linejoin="round"/>
<path d="M80.4 51.8Q86 48.8 92 48.4" stroke="${BLOOD_L}" stroke-width=".9" fill="none" stroke-linecap="round"/>`,
      86,
      51,
      1.45,
    ),
  },
  bruise: {
    on: "head",
    spot: "eye",
    name: "Bruised eye",
    svg: grow(
      `<circle cx="82" cy="34" r="8.8" fill="#6b1f5c" opacity=".5"/><circle cx="82" cy="34" r="6.2" fill="#3a0f34" opacity=".4"/>`,
      82,
      34,
      1.15,
    ),
  },
  neck: {
    on: "head",
    spot: "neck",
    name: "Sewn-on head",
    svg: grow(
      stitched(
        [
          [58, 58.6],
          [63, 60.6],
          [69, 61.8],
          [75, 62.4],
          [81, 62],
          [87, 60.6],
          [92, 58.4],
        ],
        3,
      ),
      75,
      60.5,
      1.05,
    ),
  },
  // the body (under the clothes)
  rotChest: {
    on: "body",
    spot: "chest",
    name: "Rot (chest)",
    svg: grow(
      rot(
        "M84 68C88 63.4 97 64 99 70C101 76 98 83 92 84C86 85 82 80 83 75C83 72 82 70 84 68Z",
        "M87.4 70.4C90 68 94.6 69 95.4 72.6C96.2 76.4 93.4 79.6 90.4 79.4C87.4 79.2 85.6 76.4 86 73.4Z",
        [
          [89.4, 72.6, 1.3],
          [93.6, 77.6, 1],
          [96.6, 70.4, 0.8],
          [86.6, 79.6, 0.8],
        ],
      ),
      91,
      74,
      1.4,
    ),
  },
  hole: {
    on: "body",
    spot: "low",
    name: "Torn hole",
    svg: grow(
      `<path d="M83 91.4L86.4 86.6L89.4 89.6L92.6 86L96.4 90.6L94.8 95L90.4 97.2L86 96.2Z" fill="#1d140e" stroke="#20361a" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M86.6 92.4Q90 90 93.6 92.2" stroke="#3a2a1a" stroke-width="1" fill="none"/>
<path d="M89.4 89.6L91 84.4L92.6 86Z" fill="#5d8f4c" stroke="#20361a" stroke-width=".8" stroke-linejoin="round"/>`,
      89.6,
      91,
      1.6,
    ),
  },
  claws: {
    on: "body",
    spot: "belly",
    name: "Claw marks",
    svg: grow(
      `<path d="M62 92.4L71.6 102.6M68.4 89.6L78.4 100.4M75 87.4L84.6 97.6" stroke="${BLOOD}" stroke-width="2.8" stroke-linecap="round"/>
<path d="M62 92.4L71.6 102.6M68.4 89.6L78.4 100.4M75 87.4L84.6 97.6" stroke="${BLOOD_L}" stroke-width=".8" stroke-linecap="round" opacity=".9"/>`,
      73,
      95,
      1.3,
    ),
  },
  bite: {
    on: "body",
    spot: "rump",
    name: "Bite",
    svg: grow(
      `<ellipse cx="38" cy="93.4" rx="10" ry="6.4" fill="${BLOOD}" opacity=".45"/>
${[
  [30.6, 91.4, -40],
  [34.8, 88.8, -15],
  [40, 88.4, 10],
  [44.8, 90.4, 35],
  [31.2, 96, 40],
  [35.6, 98.2, 15],
  [40.6, 98.4, -10],
  [45, 96.2, -35],
]
  .map(
    ([x, y, a]) =>
      `<ellipse cx="${x}" cy="${y}" rx="1.1" ry="1.9" fill="${BLOOD_D}" transform="rotate(${a} ${x} ${y})"/>`,
  )
  .join("")}`,
      38,
      93.4,
      1.45,
    ),
  },
  rotTail: {
    on: "body",
    spot: "tail",
    name: "Rot (tail)",
    svg: grow(
      rot(
        "M15.6 55C20.6 55 27.4 58.6 30.4 63C33 67.6 29.6 73.4 24 72.8C18.6 72.2 14.6 67.4 14.4 61.6C14.4 58.6 14.4 56.4 15.6 55Z",
        "M19 60C21.6 59.4 25.6 61.4 26.4 64.6C27.2 67.6 24.6 69.6 22 69C19.4 68.4 17.6 65.6 17.8 63Z",
        [
          [21, 62.6, 1.2],
          [24.6, 67.4, 0.9],
          [17.4, 66.6, 0.8],
        ],
      ),
      23,
      64,
      1.4,
    ),
  },
  stitchX: {
    on: "body",
    spot: "tail",
    name: "Stitched X",
    svg: grow(
      stitched([
        [18, 58],
        [23, 63.6],
        [28, 69.2],
        [32, 73.6],
      ]) +
        stitched([
          [31, 57.6],
          [25.6, 64.6],
          [20.4, 71.4],
        ]),
      25,
      65.6,
      1.35,
    ),
  },
};
for (const [id, [on, spot, name, svg]] of Object.entries(MANY))
  WOUNDS[id] = { on, spot, name, svg };
const WOUND_IDS = Object.keys(WOUNDS);
/* a zombie's marks, the same on every screen: from its number, 1 to 3 marks, never two on one spot; a zombie in clothes
   gets only the head's (the body's would be hidden) */
function woundsOf(n, clothed = false) {
  let x = (Math.imul((n | 0) + 1, 2654435761) ^ 0x5bd1e995) >>> 0;
  const rnd = () => {
    x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return x / 4294967296;
  };
  const r = rnd(),
    count = r < 0.3 ? 1 : r < 0.75 ? 2 : 3,
    out = [],
    used = new Set();
  for (let tries = 0; out.length < count && tries < 40; tries++) {
    const id = WOUND_IDS[Math.floor(rnd() * WOUND_IDS.length)];
    if (clothed && WOUNDS[id].on !== "head") continue;
    if (used.has(WOUNDS[id].spot)) continue;
    used.add(WOUNDS[id].spot);
    out.push(id);
  }
  return out.sort();
}
/* the marks as duckSVG's skin: a list for each part, a mark to each (the ducks' part sheets make each one on its own) */
const woundSkin = (ids) => ({
  head: ids
    .filter((id) => WOUNDS[id].on === "head")
    .map((id) => WOUNDS[id].svg),
  body: ids
    .filter((id) => WOUNDS[id].on === "body")
    .map((id) => WOUNDS[id].svg),
});

/* a zombie's picture, made once for each look, marks and wounds (the same ones are the same picture): 64 px wide, its
   shadow under it; n is its number, which picks its marks; hits, its wounds from hits (s.hang.zw) */
const LOOKS = new Map();
export function zombieURL(l, n = 0, hits = "") {
  const w = woundsOf(n, l[6] >= 0),
    k = [l[3], l[4], l[5], l[6], l[7], l[8], w.join("+"), hits].join();
  if (!LOOKS.has(k)) {
    if (LOOKS.size > 600) LOOKS.clear(); // (wounds make many pictures: I keep only the newest few hundred)
    const sk = woundSkin(w),
      h = hitsOf(hits);
    LOOKS.set(
      k,
      svgDataURL(
        duckSVG(zombieLook(l), {
          size: 64,
          shadow: true,
          dead: true,
          skin: { body: sk.body, head: [...sk.head, ...h.inner], out: h.out },
          gone: h.gone,
        }),
      ),
    );
  }
  return LOOKS.get(k);
}
/* the gore layer (Adam's job, Nov 21: zombie pictures that cost nothing for their wounds): a wounded zombie as its parts
   (duck.js data-dk, as zombieURL's drawing carries them) without making its drawing: its unwounded look's, read once,
   with the wounds' marks added. l4dd.js draws it from the part sheets straight onto its own canvas, so a new wound makes
   no new drawing and no new picture file. null: no parts for it (made whole) */
const DKS = new Map();
const unq = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
export function zombieDK(l, n = 0, hits = "") {
  const base = zombieURL(l, n, "");
  let b = DKS.get(base);
  if (b === undefined) {
    if (DKS.size > 600) DKS.clear(); // (as LOOKS)
    const t = decodeURIComponent(base.slice(base.indexOf(",") + 1)),
      m = /\sdata-dk="([^"]*)"/.exec(t.slice(0, t.indexOf(">") + 1));
    DKS.set(base, (b = m ? JSON.parse(unq(m[1])) : null));
  }
  if (!b) return null;
  const h = hitsOf(hits);
  return {
    ...b,
    gone: h.gone,
    sk: {
      body: b.sk.body,
      head: [...b.sk.head, ...h.inner].filter(Boolean),
      out: h.out.filter(Boolean),
    },
  };
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

const GOLD_CHAIR_ICON = GOLD_CHAIR.replace("<svg ", '<svg class="sp-chair" ');
/* a weapon's picture: the specials' bar's (the knife, the pistol, the bow …), and the new guns' own (gunart.js) */
/* Survival's defibrillator: a red case with a green heartbeat on its screen and a yellow bolt, its two paddles on
   curly cords in front */
const DEFIB_ICON = `<svg viewBox="0 0 48 40" aria-hidden="true">
<path d="M14 27Q11 31 13 33M34 27Q37 31 35 33" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M14 27Q11 31 13 33M34 27Q37 31 35 33" fill="none" stroke="#4a4e5c" stroke-width="1.6" stroke-linecap="round"/>
<rect x="8" y="3" width="32" height="25" rx="5" fill="#e8424d" stroke="${INK}" stroke-width="2"/>
<path d="M8.6 22H39.4V23Q39.4 27.4 35 27.4H13Q8.6 27.4 8.6 23Z" fill="#b92f3b"/>
<rect x="12.5" y="7" width="23" height="11" rx="2" fill="#16261e" stroke="${INK}" stroke-width="1.3"/>
<path d="M14.4 12.6H19.4L21 9.4L23.4 16L25.6 11L27 12.6H33.6" fill="none" stroke="#5bf08a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25.4 19.4L22 23.6H24.6L22.8 26.6L26.8 22.2H24.2Z" fill="#ffd23f" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
<path d="M12 6.4Q12 5.4 13.4 5.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>
<g stroke="${INK}" stroke-width="1.6"><rect x="3" y="31" width="15" height="7" rx="3" fill="#d6dbe5"/><rect x="30" y="31" width="15" height="7" rx="3" fill="#d6dbe5"/><rect x="7.5" y="28.6" width="6" height="3.4" rx="1.2" fill="#4a4e5c"/><rect x="34.5" y="28.6" width="6" height="3.4" rx="1.2" fill="#4a4e5c"/></g>
<path d="M5 35.4H16M32 35.4H43" stroke="#9aa1b0" stroke-width="1.2" stroke-linecap="round"/></svg>`;
export const weaponIcon = (w, duck) =>
  (w === "defib" && DEFIB_ICON) ||
  (w === "handgun" && pistolIcon(duck)) ||
  (w === "chair" && GOLD_CHAIR_ICON) || // (here the chair is golden: the owner's, Nov 18 12:19Z) // (the pistol: as the one in my duck's hand, in my colors; the owner's, Nov 17)
  (GUNS[w] && GUNS[w].icon) ||
  (specialById(w) || {}).icon ||
  "";
/* a weapon as an orb, glowing in its own color (l4ddrules.js tintOf) or else its slot's (css: .l4orb, blue melee, red
   ranged, purple special, white grenades) */
export const orbHTML = (w) =>
  `<span class="l4orb k-${kindOf(w) || "special"}${tintOf(w) ? " " + tintOf(w) : ""}"><i>${w === "justin" ? justinSVG({ size: 30, shadow: false }) : weaponIcon(w)}</i></span>`; // (the fireplace's 1 in 100: Justin himself)
/* Justin's Butler's upgrades: accuracy (a crosshair), attack speed (a lightning bolt), max HP (a green heart), speed
   (a running arrow), faster reload (a bullet in a turning arrow) */
export const UP_ICONS = {
  acc: `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="10" fill="#f4f4f0" stroke="${INK}" stroke-width="1.6"/><circle cx="15" cy="15" r="6.2" fill="#e8424d" stroke="${INK}" stroke-width="1.3"/><circle cx="15" cy="15" r="2.4" fill="#f4f4f0" stroke="${INK}" stroke-width="1"/><path d="M15 1.5V8M15 22V28.5M1.5 15H8M22 15H28.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  as: `<svg viewBox="0 0 30 30"><path d="M18 2L6 17H14L11 28L24 12H16Z" fill="#ffd23f" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 5.5L10.5 13" stroke="#fff6c8" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  hp: `<svg viewBox="0 0 30 30"><path d="M15 26C6 19 2.5 14.5 2.5 9.8 2.5 6.2 5.3 3.5 8.8 3.5 11.6 3.5 13.7 5.1 15 7.4 16.3 5.1 18.4 3.5 21.2 3.5 24.7 3.5 27.5 6.2 27.5 9.8 27.5 14.5 24 19 15 26Z" fill="#1fb85c" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 10V19M10.5 14.5H19.5" stroke="#f4f4f0" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  sp: `<svg viewBox="0 0 30 30"><path d="M3 9H11M1.5 15H9M3 21H11" stroke="#9cc2ff" stroke-width="2.2" stroke-linecap="round"/><path d="M12 6L21 15L12 24M18 6L27 15L18 24" fill="none" stroke="#3d7be0" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  rl: `<svg viewBox="0 0 30 30"><path d="M24.5 11A10.5 10.5 0 1 0 25 19" fill="none" stroke="#c9a24a" stroke-width="2.6" stroke-linecap="round"/><path d="M26.5 5.5L25.2 12.2L18.8 10.2" fill="none" stroke="#c9a24a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11H16A4 4 0 0 1 16 19H12Z" fill="#e0a43a" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><rect x="9" y="11" width="3.6" height="8" rx="1" fill="#c98a3a" stroke="${INK}" stroke-width="1.3"/></svg>`,
  qr: `<svg viewBox="0 0 30 30"><rect x="12.5" y="1.8" width="5" height="3.6" rx="1" fill="#c9cdd6" stroke="${INK}" stroke-width="1.3"/><path d="M23.2 6.6L25.6 4.2" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><circle cx="15" cy="17" r="11" fill="#f4f4f0" stroke="${INK}" stroke-width="1.6"/><path d="M15 11.2V22.8M9.2 17H20.8" stroke="#e8424d" stroke-width="4" stroke-linecap="round"/><path d="M15 7.5A9.5 9.5 0 0 1 24.5 17" fill="none" stroke="#3d7be0" stroke-width="2" stroke-linecap="round"/></svg>`, // (Quick Revive: a stopwatch with a red cross)
};
