/* ---------- Duck Cabin's props, drawn: art.js's drawings put where layout.js says ----------
   Three lists, all in "screen-world" px (world px with heights already taken off: a thing at world (x, y) standing on
   height z draws at (x, y − z)), so a box here is where a drawing goes before the camera moves and scales it:

   GROUND() the flat, still pieces under everything: the grass, the darker slope, the downhill, the forest floor, the dirt
            path, the soccer field's lines, the pavers, the pool's water and its lane rope, the cabin's floors and rugs,
            the deck's boards and its stairs' steps, the shadows of the trees and the jeep, the forest past the ring in
            the north, west and east. { svg, x, y, w, h } (or raw: SVG in screen-world px). world.js paints them once
            into tiles of a canvas (cheap to move) and lays the night's light pools over them every frame.
   DRAW     kind → (prop) → its parts: the drawings that stand up, each its own element sorted with the ducks by its own
            foot (key), so one prop can be a back part and a front part (the couch's seat behind a sitting duck, its
            backrest in front). A part: { svg, box: { l, t, w, h }, key, layer ('floor': under every duck), fade (turns
            see-through while it hides a duck), hit (the box that counts for that), img (a still picture: drawn once by the
            browser, cheap to move; no hooks, nothing moves inside it), part ('back' | 'front') }. svg may be a function
            (made when the part first comes into view). A kind may also return a plain SVG string: one part filling
            the prop's own box (the old placeholder way). An empty list draws nothing (the prop still blocks walking).
   DECOR()  parts no prop owns: the forest past the ring in the south (in front of everything), the deck's railing and
            lattice, the chimney's smoke, the pool's moving light. { ...part, only: 'in' | 'out', cls, style }.
   (Both are made the first time the cabin opens: the game's other modes never pay for them.)

   Interactive props keep their ids and their parts stay inline SVG, so the activities find them (ctx.world.propEl(id)
   is the front or only part; propEls(id) all of them); their glowing bits carry class "lit" (a lamp switched off dims
   them: .hp.off .lit) and the glow around a lamp "lit-glow" (it goes out). */
import * as A from "./art.js";
import * as L from "./layout.js";
import { downpourGround, dpGroundColor } from "./dpground.js";
import * as GS from "./stationmap.js";
import * as SA from "./stationart.js";
import { floorBricks, heapBricks } from "./bricks.js";
import { ART } from "./pxworld.js";

const C = L.CABIN,
  T = 12,
  n1 = (v) => Math.round(v * 10) / 10;
const hash = (s) => {
  let h = 7;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((h >>> 0) % 1000) / 1000;
};
const part = (svg, l, t, w, h, key, o = {}) => ({
  svg,
  box: { l, t, w, h },
  key,
  ...o,
});
/* a pair from art.js (its box w × h) put with its box's left at l and its bottom at screen-world b; keys: the world y of
   each foot (back: null = flat, into the ground instead), or given */
function pairParts(
  pr,
  l,
  b,
  w,
  h,
  { backKey, frontKey, s = 1, z = 0, fade = false, hit } = {},
) {
  const t = b - h * s,
    out = [];
  if (pr.backFoot != null || backKey != null)
    out.push(
      part(pr.back, l, t, w * s, h * s, backKey ?? t + pr.backFoot * s + z, {
        part: "back",
      }),
    );
  out.push(
    part(pr.front, l, t, w * s, h * s, frontKey ?? t + pr.frontFoot * s + z, {
      part: "front",
      fade,
      hit,
    }),
  );
  return out;
}
const lit = (svg, glow = []) =>
  svg.replace(
    /<(circle|ellipse|path|rect)([^>]*?)fill="([^"]+)"/g,
    (m, tag, a, f) =>
      f.startsWith("url(")
        ? `<${tag} class="lit lit-glow"${a}fill="${f}"`
        : glow.includes(f)
          ? `<${tag} class="lit"${a}fill="${f}"`
          : m,
  );
const still = (svg) =>
  svg.replace(/ class="hg-(?:flicker|twinkle|shimmer|smoke|spark)"/g, "");
const calm = (svg) => svg.replace(/<rect [^>]*class="hg-shimmer"[^>]*\/>/g, ""); // (the pool without its light on the water: DECOR moves that)

/* ---------- the walls: log walls cut away inside; outside, the cabin's own drawing covers them ---------- */
let WALLS = [],
  wallsRev = -1;
const walls = () => {
  if (wallsRev !== L.layoutRev()) {
    wallsRev = L.layoutRev();
    WALLS = L.PROPS.filter((p) => p.kind === "wall");
  }
  return WALLS;
}; // (the room's mode's: Quacky Zombies' cabin has walls of its own)
const NORTH_WINDOWS = [
  [2470, 2590],
  [2820, 2960],
]; // the north wall's windows (world x), looking out at the grass: either side of the TV's place
/* Downpour's walls: which building's (the gas station's blocks or the chapel's clapboard), and its shop windows */
const skinOf = (p) => (p.y < GS.ROAD.y0 ? "gs" : "ch");
const glassOn = (p) =>
  (p.glass || [])
    .map(([a, b]) => [Math.max(a, p.x) - p.x, Math.min(b, p.x + p.w) - p.x])
    .filter(([a, b]) => b - a > 30);
/* the heap of blocks at the foot of Downpour's smashed corner (world px): its floor w × d, and how high it may reach */
const HEAP = { w: 180, d: 64, up: 34 };
function wallParts(p) {
  if (p.only === "out" && !p.map) return []; // (the south wall outside: part of the cabin's drawing)
  const z = p.z || 0,
    t = p.y - z - p.h;
  if (p.w >= p.d) {
    // east-west: the cut top, then its face looking south
    const windows =
      p.side === "n" && !p.map
        ? NORTH_WINDOWS.filter(([a, b]) => a > p.x && b < p.x + p.w).map(
            ([a, b]) => [a - p.x, b - p.x],
          )
        : [];
    return [
      part(
        () =>
          p.map
            ? SA.gsWallX({
                w: p.w,
                wallH: p.h,
                t: p.d,
                skin: skinOf(p),
                glass: glassOn(p),
                brokenW: GS.brokenCorner(p) ? Math.round(p.x + p.y) : 0,
              })
            : A.logWall({ w: p.w, wallH: p.h, t: p.d, windows }),
        p.x,
        t,
        p.w,
        p.d + p.h,
        p.key,
        { fade: p.fade, only: p.map ? p.only : "in" }, // (Downpour's walls show from outside too: its buildings have no drawing of their own yet)
      ),
      /* its smashed west end's blocks, in a heap at its foot outside (the owner's, Nov 19 23:41Z: "the bricks laying on
         top of one another on the parts where it's broken. It's laying in any which way in a stack on the right side
         of that corner") */
      ...(p.map && GS.brokenCorner(p)
        ? [
            part(
              () =>
                heapBricks({
                  w: HEAP.w,
                  d: HEAP.d,
                  up: HEAP.up,
                  seed: Math.round(p.x + p.y) + 7,
                  roof: true,
                }),
              p.x - 10,
              p.y + p.d - HEAP.up,
              HEAP.w,
              HEAP.d + HEAP.up,
              p.y + p.d + HEAP.d * 0.6,
              { only: p.only },
            ),
          ]
        : []),
    ];
  }
  /* north-south: a run of pieces; only the run's south end shows its log ends, the rest is the cut top */
  const b = p.y + p.d - 12,
    end = !walls().some(
      (q) =>
        q !== p &&
        q.x === p.x &&
        q.w < q.d &&
        Math.abs(q.y + 12 - b) < 1 &&
        (q.only || "") === (p.only || ""),
    );
  const gap = L.OPENINGS.some(
    (d) => Math.abs(d.at - (p.x + p.w / 2)) < 2 && Math.abs(d.a - b) < 2,
  ); // (at an open doorway)
  /* Downpour: its south end at a hole smashed through it (never a doorway): that end broken (stationart.js
     gsWallYBroken) */
  const smashed =
    p.map &&
    GS.WALK_HOLES.some(
      (o) =>
        o.axis === "y" &&
        Math.abs(o.at - (p.x + p.w / 2)) < 2 &&
        Math.abs(o.a - (p.y + p.d)) < 2,
    ); // (each piece reaches T past its end: to the hole's edge)
  const into = (q) =>
    q.w > q.d &&
    (q.only || "in") === (p.only || "in") &&
    Math.abs(q.y + 12 - b) < 2 &&
    q.x <= p.x + 1 &&
    q.x + q.w >= p.x + p.w - 1; // (at a corner the east-west wall starts or ends with it)
  const tee = walls().some(into),
    low = !tee && L.PROPS.some((q) => q.kind === "stub" && into(q)); // (into an east-west wall: hidden behind its face; over the south wall's low line: its end shows)
  /* a run that starts at an east-west wall: its top starts at that wall's top's front edge (the east-west wall's top runs
     on over the corner; nothing sticks out over it) */
  const head = walls().some(
    (q) =>
      q.w > q.d &&
      q.only !== "out" &&
      Math.abs(q.y - p.y) < 1 &&
      q.x <= p.x &&
      q.x + q.w >= p.x + p.w,
  )
    ? 24
    : 0;
  /* a run that starts at a doorway (its north end at an opening's south side): its top starts where its foot does, not
     its height up the screen over the opening, so the opening shows as wide as the gap a duck walks through and a duck
     in it is never behind the wall (the top-down way: the doorway is where it looks to be) */
  const cut = L.OPENINGS.some(
    (q) =>
      Math.abs(q.at - (p.x + p.w / 2)) < 2 && Math.abs(q.b - (p.y + 12)) < 2,
  )
    ? p.h
    : 0;
  const o = head || cut ? 0 : -12,
    d = p.d - head - cut;
  if (cut && tee && d <= 2 * 12 + 1) return []; // (all of it under the east-west wall's top it runs into)
  /* its south end showing (free, at a doorway, over the low line): the end down to the floor; at a doorway and over the
     low line, the wall's own wood (no log ends) */
  if (end && !tee)
    return [
      part(
        () =>
          p.map
            ? SA.gsWallY({
                w: p.w,
                h: d + p.h,
                wallH: p.h,
                skin: skinOf(p),
                plain: gap || low,
                open: o < 0,
                broken: smashed ? Math.round(p.x + b) : 0,
              })
            : A.logWall({
                axis: "y",
                w: p.w,
                t: p.w,
                h: d + p.h,
                wallH: p.h,
                plain: gap || low,
                open: o < 0,
              }),
        p.x,
        t + head + cut,
        p.w,
        d + p.h,
        p.key,
        { fade: p.fade, only: p.map ? p.only : "in" },
      ),
    ];
  const top = () =>
    p.map
      ? SA.gsWallTop(p.w, d, o, cut, skinOf(p))
      : `<svg class="hg hg-wall" viewBox="0 0 ${p.w} ${d}" width="${p.w}" height="${d}" overflow="visible" aria-hidden="true"><rect x="0" y="${o}" width="${p.w}" height="${d - o}" fill="#c98a52"/><path d="M${p.w * 0.4} ${o < 0 ? o : 3}V${d}" stroke="#e8b27a" stroke-width="3" opacity=".7"/><path d="M0 ${o}V${d}M${p.w} ${o}V${d}${cut ? `M0 0H${p.w}` : ""}" stroke="#1c1c28" stroke-width="2.6"/></svg>`;
  return [
    part(top, p.x, t + head + cut, p.w, d, p.key, {
      fade: p.fade,
      only: p.map ? p.only : "in",
    }),
  ];
}

/* ---------- the railings of the deck's stairs (the deck's own are in its drawing): orange wood, posts and balusters ---------- */
function railParts(p) {
  const onDeck =
    (p.w < p.d && Math.abs(p.x + 6 - L.DECK.x0) < 2) ||
    (p.w > p.d && Math.abs(p.y + 6 - L.DECK.y1) < 2 && p.x < L.DECK.x1);
  if (onDeck) return [];
  const H = L.DECK.rail || 40;
  if (p.w < p.d) {
    // north-south, down the stairs: seen edge-on, a sloped bar on its posts
    const S = L.STAIRS,
      sx = Math.min(S.x1 - 1, Math.max(S.x0 + 1, p.x + 6)),
      a = p.y,
      b = p.y + p.d,
      za = L.heightAt(sx, a + 1),
      zb = L.heightAt(sx, b - 1);
    const t = a - za - H - 8,
      h = b - zb - t,
      w = 16;
    const foot =
      b >= S.y1 - 1
        ? `<rect x="-1" y="${n1(h - 13)}" width="18" height="14" fill="#a65a2c" stroke="#1c1c28" stroke-width="2"/>`
        : ""; // (at the stairs' bottom: a block it stands on)
    const svg = () =>
      `<svg class="hg hg-rail" viewBox="0 0 ${w} ${n1(h)}" width="${w}" height="${n1(h)}" overflow="visible" aria-hidden="true"><rect x="3" y="4" width="10" height="${n1(h - 4)}" fill="#d98a4a" stroke="#1c1c28" stroke-width="2.2"/><rect x="6" y="6" width="3" height="${n1(h - 10)}" fill="#f0b070" opacity=".5"/><rect x="0" y="0" width="16" height="12" fill="#a65a2c" stroke="#1c1c28" stroke-width="2"/>${foot}</svg>`;
    return [part(svg, p.x - 2, t, w, h, p.key)];
  }
  /* east-west: balusters under a top rail, posts at the ends */
  const z = p.z,
    w = p.w,
    t = p.y + p.d / 2 - z - H - 8,
    h = H + 14;
  let bal = "";
  for (let x = 12; x < w - 8; x += 20) bal += `M${x} 10V${h - 4}`;
  const svg = () =>
    `<svg class="hg hg-rail" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true"><path d="${bal}" stroke="#1c1c28" stroke-width="8"/><path d="${bal}" stroke="#d07a35" stroke-width="4.5"/><rect x="0" y="${h - 10}" width="${w}" height="7" fill="#b8672c" stroke="#1c1c28" stroke-width="1.8"/><rect x="0" y="2" width="14" height="${h - 2}" fill="#c06d30" stroke="#1c1c28" stroke-width="2.2"/><rect x="${w - 14}" y="2" width="14" height="${h - 2}" fill="#c06d30" stroke="#1c1c28" stroke-width="2.2"/><rect x="-4" y="-4" width="${w + 8}" height="8" fill="#e8a060" stroke="#1c1c28" stroke-width="2.2"/><rect x="-4" y="4" width="${w + 8}" height="6" fill="#a65a2c" stroke="#1c1c28" stroke-width="1.8"/></svg>`;
  return [part(svg, p.x, t, w, h, p.key)];
}

/* ---------- the TV: in upright strips, as the stage (stage.js) ----------
   It stands across the diagonal, so one depth can't be right for all of it: each strip of its picture is sorted by the
   stand's front edge in it (and half a duck's width either side), a duck in front of the stand covers it, one behind it
   is covered. One strip holds the whole screen (part 'screen': tv.js puts the channels in it). */
const TV_EXT = 14;
export const tvScreenStrip = () => {
  const sc = A.tvScreen();
  return [Math.floor(sc.x - 3), Math.ceil(sc.x + sc.w * Math.SQRT1_2 + 3)];
}; // (in the TV's box)
function tvParts(p) {
  const l = L.TV.cx - 70,
    t = L.TV.cy + 62 - p.z - 240,
    [x0, x1] = tvScreenStrip();
  const cuts = [0, x0 / 3, (x0 * 2) / 3, x0, x1, (x1 + 140) / 2, 140].map(
    Math.round,
  );
  const pic = A.tvSet(),
    hit = { l: l + 10, t: t + 45, r: l + 130, b: t + 237 }; // (the stand and the set, not the ears: a duck hidden behind them sees through the whole TV)
  return cuts.slice(1).map((b0, i) => {
    const a = cuts[i],
      b = Math.min(140, b0 + 1),
      key = Math.floor(
        Math.min(L.tvFront(l + a - TV_EXT), L.tvFront(l + b0 + TV_EXT)),
      ); // (each a unit wider than its cut: no seam shows between them)
    const win = () =>
      pic
        .replace(
          /viewBox="0 0 140 240" width="140"/,
          `viewBox="${a} 0 ${b - a} 240" width="${b - a}"`,
        )
        .replace('overflow="visible"', 'overflow="hidden"');
    return part(win, l + a, t, b - a, 240, key, {
      img: true,
      fade: true,
      hit,
      ...(b > b0 ? { cls: "tv-seam" } : {}),
      ...(a === x0 ? { part: "screen" } : {}),
    });
  });
}

/* ---------- trees: a few drawings, each kept as a picture and used again and again ---------- */
const TREE_PICK = [
  ["pine", 0.3],
  ["fir", 0.25],
  ["spruce", 0.2],
  ["oak", 0.15],
  ["birch", 0.1],
];
const treeKind = (id) => {
  let k = hash(id + "k");
  for (const [kind, f] of TREE_PICK) {
    if (k < f) return kind;
    k -= f;
  }
  return "pine";
};
const TREE_URL = {};
const treeURL = (kind) =>
  TREE_URL[kind] || (TREE_URL[kind] = A.svgDataURL(A.tree({ kind }).front));
const TREE_SCALE = 1.25;
function treeBox(p) {
  const kind = treeKind(p.id),
    [w0, h0] = A.TREE_KINDS[kind],
    s = (p.size || 1) * TREE_SCALE,
    w = w0 * s,
    h = h0 * s;
  const cx = p.x + 18,
    cy = p.y + 12,
    sy = cy - p.z;
  return { kind, cx, sy, w, h, l: cx - w / 2, t: sy - (h0 - 8) * s };
}

/* the cabin from outside (dark: the power's out, power.js shows this one instead) */
export const cabinSVG = (dark = false) => {
  const w = C.x1 - C.x0,
    d = C.y1 - C.y0;
  return A.cabinOutside({
    w,
    d,
    h: d + 290,
    wallH: C.wall,
    windows: [1550, 2080, 3300, 3700, 4080].map((x) => x - C.x0),
    holes: L.HOLES.filter((o) => o.out).map((o) => [o.a - C.x0, o.b - C.x0]), // (Quacky Zombies')
    backDoor: L.DOORS.back.x - C.x0,
    frontDoor: L.DOORS.front.x - C.x0,
    chimney: 2300 - C.x0,
    dark,
  });
};

/* ---------- the props, kind by kind ---------- */
const at = (p, w, h, foot = h, cx = p.x + p.w / 2) => ({
  l: cx - w / 2,
  t: p.y + p.d - p.z - foot,
}); // a box whose foot (y = foot in it) is the prop's front, centered on it
const one = (p, svg, w, h, foot = h, o = {}) => {
  const b = at(p, w, h, foot, o.cx);
  return [part(svg, b.l, b.t, w, h, o.key ?? p.key, o)];
};
const COUCH = { couch1: "#a8382c", couch2: "#3d6e4f" };
/* Downpour's things (stationart.js): each drawn into its box, w × (d + h), from its top's back edge (as plainBox) */
const gsPart = (p, svg, o = {}) => [
  part(
    svg,
    p.x - (o.left || 0),
    p.y - p.z - p.h - (o.up || 0),
    o.w || p.w,
    p.d + p.h + (o.up || 0),
    p.key,
    { fade: true, ...o.opt },
  ),
];
const seedOf = (p) => Math.abs(Math.round(p.x / 7 + p.y / 13)) + 1;
/* Downpour's trees: about 3 cypresses to 3 willows to 2 oaks, each in one of its three looks, two seeds, and mirrored
   half the time, all picked from the tree's id so every device grows the same forest. Each drawing is made once */
const SWAMP_MIX = [
    "cypress",
    "cypress",
    "cypress",
    "willow",
    "willow",
    "willow",
    "oak",
    "oak",
  ],
  SWAMP_URL = {};
function swampTree(h) {
  const kind = SWAMP_MIX[Math.floor(h * SWAMP_MIX.length)],
    v = Math.floor(((h * 97) % 1) * 3),
    flip = (h * 991) % 1 < 0.5,
    seed = 1 + Math.floor(((h * 7919) % 1) * 2),
    key = kind + v + seed + flip;
  if (!SWAMP_URL[key]) {
    const shade = SA.swampShadeSVG(kind, v, seed, flip),
      trunk = SA.swampTrunkSVG(kind, v, seed, flip),
      crown = SA.swampCrownSVG(kind, v, seed, flip);
    SWAMP_URL[key] = {
      shade,
      trunk,
      crown,
      shadeURL: A.svgDataURL(shade.svg),
      trunkURL: A.svgDataURL(trunk.svg),
      crownURL: A.svgDataURL(crown.svg),
    };
  }
  return SWAMP_URL[key];
}
/* Downpour's things are drawn as the floor plan has them, then shown at K of that size (stationmap.js K: the owner's,
   Nov 17, the whole map at 60%), so each looks just as it did, only smaller. SK: stationart.js' drawings that way */
const PLAN = new Set(["w", "d", "h", "edge", "cable", "up", "half", "z"]),
  PLAN_AT = new Set(["x0", "y0", "x1", "y1"]);
const atK =
  (fn) =>
  (o = {}) => {
    const q = {};
    for (const [a, v] of Object.entries(o))
      q[a] =
        typeof v === "number" && (PLAN.has(a) || PLAN_AT.has(a)) ? v / GS.K : v;
    return fn(q).replace(
      /^(<svg[^>]*?) width="([\d.]+)" height="([\d.]+)"/,
      (m, a, w, h) =>
        `${a} width="${+(w * GS.K).toFixed(2)}" height="${+(h * GS.K).toFixed(2)}"`,
    );
  };
const SK = Object.fromEntries(
  [
    "pumpSVG",
    "carSVG",
    "generatorSVG",
    "fenceSVG",
    "fenceXSVG",
    "pewSVG",
    "altarSVG",
    "towerSVG",
    "canopySVG",
    "fallenSVG",
    "roofSVG",
    "shelfSVG",
    "counterSVG",
    "bellSVG",
    "corpseSVG",
    "ladderSVG",
    "leanLadderSVG",
  ].map((n) => [n, atK(SA[n])]),
);
const GS_DRAW = {
  pump: (p) => gsPart(p, () => SK.pumpSVG({ w: p.w, d: p.d, h: p.h })),
  car: (p) => {
    const up = p.hood ? 110 * GS.K : 0,
      k = seedOf(p);
    return gsPart(
      p,
      () =>
        SK.carSVG({
          w: p.w,
          d: p.d,
          h: p.h,
          seed: k,
          east: p.hood ? false : k % 2 === 0, // (the hood-up car faces west: its hood where E uses it)
          hood: !!p.hood,
          up,
          smash: p.smash || "",
          dead: p.dead || "",
        }),
      { up },
    );
  },
  generator: (p) => {
    const cable = 20 * GS.K; // (to the power box, just east of it)
    return gsPart(p, () => SK.generatorSVG({ w: p.w, d: p.d, h: p.h, cable }), {
      w: p.w + cable,
    });
  },
  fence: (p) => {
    const t = SA.fenceLean(p, L.W), // (its top leans out, toward the map's edge: stationart.js)
      lean = Math.abs(t),
      mid = p.x + p.w / 2; // (its line)
    return gsPart(
      p,
      () =>
        SK.fenceSVG({
          d: p.d,
          h: p.h,
          lean,
          dir: Math.sign(t),
          seed: seedOf(p),
        }),
      { left: p.x - mid + (t > 0 ? 4 : lean + 4), w: lean + 8 },
    );
  },
  fencex: (p) =>
    gsPart(p, () => SK.fenceXSVG({ w: p.w, d: p.d, h: p.h, seed: seedOf(p) })), // (the map's north and south sides: stationart.js)
  pew: (p) =>
    gsPart(p, () => SK.pewSVG({ w: p.w, d: p.d, h: p.h, broken: p.broken })),
  altar: (p) => gsPart(p, () => SK.altarSVG({ w: p.w, d: p.d, h: p.h })),
  /* the bell tower, and its bell apart from it so it can swing to the bell's sound (l4dd.js bellSwing: frames, one
     drawing for each step of its swing) */
  tower: (p) => {
    const [bw, bh] = SA.BELL_BOX,
      [px, py] = SA.BELL_PIVOT,
      k = GS.K,
      top = p.y - p.z - p.h, // (the tower's drawing's top: gsPart)
      bx = p.x + p.w / 2 - px * k,
      by = top + p.d + 80 * k - py * k, // (its pivot under the belfry's beam: stationart.js towerSVG)
      frame = (i) => SK.bellSVG({ a: SA.BELL_ANGLES[i] });
    return [
      ...gsPart(p, () => SK.towerSVG({ w: p.w, d: p.d, h: p.h, bell: false })),
      part(frame(SA.BELL_REST), bx, by, bw * k, bh * k, p.key + 1, {
        img: true,
        part: "bell",
        frames: frame,
        nframes: SA.BELL_ANGLES.length, // (each step made into pixels ahead of time: pxworld.js)
      }),
    ];
  },
  ladder: (p) =>
    gsPart(p, () => SK.ladderSVG({ w: p.w, h: p.d + p.h }), {
      opt: { fade: false }, // (it stays while a duck climbs it, seen between its rungs)
    }),
  /* the ladder leaning on the canopy (stationmap.js PUMP_LADDER): its rails and rungs at its own depth, its hoops over
     the canopy's roof (p.hoopKey: the canopy's depth, just past it) */
  leanladder: (p) => [
    ...gsPart(p, () => SK.leanLadderSVG({ w: p.w, d: p.d, h: p.h, z: p.zt }), {
      opt: { fade: false },
    }),
    part(
      () =>
        SK.leanLadderSVG({ w: p.w, d: p.d, h: p.h, z: p.zt, only: "hoops" }),
      p.x,
      p.y - p.z - p.h,
      p.w,
      p.d + p.h,
      p.hoopKey,
      { fade: false },
    ),
  ],
  corpse: (p) =>
    p.who === "trooper"
      ? ["pool", "body"].flatMap((only) =>
          gsPart(
            p,
            () => SK.corpseSVG({ w: p.w, d: p.d + p.h, kind: p.who, only }),
            {
              opt: {
                fade: false,
                layer: "floor",
                ...(only === "body" ? { cls: "gs-trooper" } : {}),
              },
            },
          ),
        ) // (his body goes from round 12, his pool stays: l4ddrules.js troopTick, l4dd.js)
      : gsPart(p, () => SK.corpseSVG({ w: p.w, d: p.d + p.h, kind: p.who }), {
          opt: { fade: false, layer: "floor" }, // (on the floor, under every duck: the owner's, Nov 19 10:22Z)
        }),
  canopy: (p) => [
    part(
      () => SK.canopySVG({ w: p.w, d: p.d, edge: 40 * GS.K }),
      p.x,
      p.y - p.z,
      p.w,
      p.d + 40 * GS.K,
      p.key,
      {
        fade: true,
        only: "out", // (from inside the shop, through the front door's hole, the way out shows, not the canopy's top: the owner's, Nov 17 05:46Z)
        hit: { l: p.x, t: p.y - p.z, r: p.x + p.w, b: p.y + p.d }, // (see-through while anyone is under it, so the pumps and the shop's front show)
      },
    ),
  ],
  fallen: (p) => {
    const F = p.fallen,
      pad = 90 * GS.K,
      b = {
        l: p.x - pad,
        t: p.y - p.z - p.h - pad,
        w: p.w + 2 * pad,
        h: p.d + p.h + 2 * pad,
      };
    return [
      part(
        () =>
          SK.fallenSVG({
            w: b.w,
            h: b.h,
            x0: F.x0 - b.l,
            y0: F.y0 - p.z - b.t,
            x1: F.x1 - b.l,
            y1: F.y1 - p.z - b.t,
            half: F.half,
            z: F.h / 2,
          }),
        b.l,
        b.t,
        b.w,
        b.h,
        p.key,
        { fade: true },
      ),
    ];
  },
};
/* where the gas station's broken south wall stands full height again, from the roof's west edge (b: the roof's box), so
   the roof's broken corner reaches that far (stationmap.js roofCap) */
const capOf = (b) => GS.roofCap(L.PROPS, b.l);
export const DRAW = {
  ...GS_DRAW,
  wall: wallParts,
  stub: (p) => [
    part(
      () =>
        p.map
          ? SA.gsWallX({
              w: p.w,
              wallH: p.h,
              t: p.d,
              skin: skinOf(p),
              brokenW: p.broken ? Math.round(p.x + p.y) : 0, // (its west end smashed: stationmap.js)
            })
          : A.logWall({ w: p.w, wallH: p.h, t: p.d }),
      p.x,
      p.y - p.h,
      p.w,
      p.d + p.h,
      p.key,
    ),
  ],
  doorway: () => [],
  /* the rubble out of a smashed north-south wall, flat on the floor under everyone (stationmap.js) */
  rubble: (p) => [
    part(
      () =>
        floorBricks({
          w: p.w,
          d: p.d,
          seed: Math.round(p.x + p.y),
        }),
      p.x,
      p.y,
      p.w,
      p.d,
      p.y,
      { layer: "floor" },
    ),
  ],
  /* Quacky Zombies' holes (layout.js' L4_HOLES): the wall's own drawing over the gap with the hole broken through it,
     sorted just in front of the wall pieces either side (it covers their ends, whichever came into view first) */
  hole(p) {
    const o = p.hole,
      seed = Math.round(o.a + o.at);
    if (o.axis === "x") {
      /* an east-west wall's face, the logs over the hole left whole; the low line by the deck, only its broken ends.
         Downpour: a south wall from outside broken up to under the sign's band, its glass either side smashed with it */
      const h = p.d + p.h,
        low = p.low || (o.out && !p.map),
        svg = p.map
          ? SA.gsWallX({
              w: p.w,
              wallH: p.h,
              t: p.d,
              skin: skinOf(p),
              glass: glassOn(p),
              seamless: true,
            })
          : A.logWall({ w: p.w, wallH: p.h, t: p.d, seamless: true }),
        cut = low
          ? A.holeCut(T + 2, p.w - T - 2, -30, h + 30, seed, 6)
          : A.holeCut(
              T + 2,
              p.w - T - 2,
              p.d + (p.only === "out" ? p.h * 0.3 : 30),
              h + 30,
              seed,
              7,
            );
      return [
        part(
          () => A.holed(svg, p.w, h, [cut]),
          p.x,
          p.y - p.h,
          p.w,
          h,
          p.key + 1,
          {
            fade: p.fade,
            only: p.map ? p.only : "in", // (Downpour's north wall: from both sides, as the wall)
          },
        ),
      ];
    }
    /* a north-south wall: from above, a gap in its strip; the piece north of it ends in splinters hanging over the gap,
       the one south of it starts with them sticking up, each sorted with its own piece */
    const south = walls().find(
      (q) => q.x === p.x && Math.abs(q.y + T - o.b) < 1,
    );
    const sp = p.map
      ? SA.SPLINTER[skinOf(p)]
      : ["#c98a52", "#b97a44", "#6e3a1a"];
    const big = p.map ? 2 : 1; // (Downpour's: a big broken end, a smashed wall, not a doorway: the owner's, Nov 19 19:58Z)
    const jag = (up) =>
      `<svg class="hg hg-wall" viewBox="0 0 24 20" width="${24 * big}" height="${20 * big}" overflow="visible" aria-hidden="true"><path d="${up ? `M0 20V12L4 6L8 11L12 4L16 9L20 5L24 11V20Z` : `M0 0V9L4 15L8 10L12 17L16 11L20 16L24 9V0Z`}" fill="${up ? sp[0] : sp[1]}" stroke="#1c1c28" stroke-width="2.4" stroke-linejoin="round"/><path d="${up ? "M3 14L7 9M14 10L18 8" : "M4 6L8 10M15 5L19 11"}" stroke="${sp[2]}" stroke-width="2" stroke-linecap="round"/></svg>`;
    const sx = p.x - 12 * (big - 1); // (centered on the wall's line)
    /* Downpour's walk-through holes: the walls' own ends are broken (wallParts' smashed, the south wall's brokenW), no
       splinters stuck on (the owner's, Nov 19 22:41Z: "They're not the same dimensions as the wall") */
    if (p.map && !p.boarded) return [];
    return [
      part(
        () => jag(false),
        sx,
        o.a + T - 8 * big,
        24 * big,
        20 * big,
        o.a + T + 1,
        {
          only: "in",
        },
      ),
      part(
        () => jag(true),
        sx,
        o.b - T - 14 * big,
        24 * big,
        20 * big,
        (south ? south.key : o.b + T) + 1,
        {
          only: "in",
        },
      ),
    ];
  },
  /* a door (layout.js' DOORWAYS: the front door, the back door): both are art.js' cabinDoor, as big as layout.js' DOOR,
     in an opening as wide as its frame. A shut part and open ones; doors.js shows one or the other ("open" on the prop).
     Open, it has turned 60° on its hinge (the opening's west side) toward the viewer: the front door into the room, the
     back door out onto the deck. */
  door(p) {
    const d = p.door,
      D = L.DOOR,
      gx = (d.a + d.b) / 2,
      fw = d.b - d.a,
      bw = fw + 8,
      bh = D.h + D.frame,
      swing = D.w * Math.sin(Math.PI / 3);
    const ajar = (foot, night, o) =>
      part(
        () => A.doorAjar({ len: D.w, h: D.h, ang: 60, night }),
        gx - D.w / 2,
        foot - D.h,
        D.w / 2,
        D.h + swing,
        foot + swing,
        { ...o, cls: "door-open", fade: true },
      ); // (see-through over a duck in the doorway)
    const o = { only: "in" };
    /* I want each door to show through its wall from the other side: the other side's drawing of it, see-through, in
       front of everything there (the roof outside, the low wall inside), fainter still while a duck is behind it */
    const ghost = (pts, only) =>
      pts.map((pt) => ({
        ...pt,
        only,
        key: L.ROOF_KEY + 3,
        cls: pt.cls + " door-ghost",
        fade: true,
        hit: undefined,
        style: only === "in" ? "z-index:20001" : "",
      })); // (inside, over the black outside, where the open door swings)
    if (d.id === "door-front") {
      // in the north wall, seen from inside: the wall's logs over its frame, its foot at the wall's face; its window shows the night outside
      const foot = d.at + T;
      return [
        part(
          () =>
            A.logWall({
              w: fw + 12,
              wallH: C.wall - bh,
              t: 2 * T,
              rowsH: 2 * T + C.wall,
              seamless: true,
            }),
          d.a - 6,
          d.at - T - C.wall,
          fw + 12,
          2 * T + C.wall - bh,
          d.at + T + 1,
          o,
        ), // (over the wall pieces' ends either side, sorted just in front of them, so the wall reads solid above the door)
        part(
          () => A.cabinDoor({ night: true }),
          gx - bw / 2,
          foot - bh,
          bw,
          bh,
          d.at + 6,
          { ...o, cls: "door-shut" },
        ),
        part(
          () => A.cabinDoor({ night: true, open: true }),
          gx - bw / 2,
          foot - bh,
          bw,
          bh,
          d.at - T,
          { ...o, cls: "door-open" },
        ), // (behind a duck in the doorway)
        ajar(foot, true, o),
        /* (from outside: the door as it looks from inside, in the same place, see-through, frame and all) */
        ...ghost(
          [
            part(
              () => A.cabinDoor({ night: true }),
              gx - bw / 2,
              foot - bh,
              bw,
              bh,
              0,
              { cls: "door-shut" },
            ),
            part(
              () => A.cabinDoor({ night: true, open: true }),
              gx - bw / 2,
              foot - bh,
              bw,
              bh,
              0,
              { cls: "door-open" },
            ),
            ajar(foot, true, {}),
          ],
          "out",
        ),
      ];
    }
    /* the back door: inside, shut, a plank in the low wall's line (open, it has swung out onto the deck); outside, the
       cabin's own drawing shows it shut; open, the lit doorway in its frame and the door swung out */
    return [
      part(
        () =>
          A.logWall({ w: fw, wallH: 14, t: 2 * T }).replace(
            /#c98a52/g,
            "#d9a066",
          ),
        d.a,
        d.at - T - 14,
        fw,
        2 * T + 14,
        d.at + 6,
        { ...o, cls: "door-shut" },
      ),
      part(
        () => A.cabinDoor({ open: true }),
        gx - bw / 2,
        d.at - bh,
        bw,
        bh,
        L.ROOF_KEY + 1,
        { only: "out", cls: "door-open door-lit" },
      ),
      ajar(d.at, false, { only: "out" }),
      /* (from inside: the door as it looks from outside, in the same place, see-through, frame and all) */
      ...ghost(
        [
          part(() => A.cabinDoor(), gx - bw / 2, d.at - bh, bw, bh, 0, {
            cls: "door-shut",
          }),
          part(
            () => A.cabinDoor({ open: true }),
            gx - bw / 2,
            d.at - bh,
            bw,
            bh,
            0,
            { cls: "door-open" },
          ),
          ajar(d.at, false, {}),
        ],
        "in",
      ),
    ];
  },
  /* Downpour's roofs, from outside: their tops only, the walls' faces under them */
  gsroof(p) {
    const b = p.box;
    return [
      part(
        () =>
          SK.roofSVG({
            w: b.w,
            d: b.h - p.bldg.wall,
            kind: p.bldg === GS.STATION ? "gs" : "ch",
            soldier: p.soldier && p.soldier.map((v) => v / GS.K), // (its own numbers are the plan's)
            px: ART / GS.K,
            holes:
              p.holes &&
              p.holes.map((h) =>
                [...h, ...(h[4] ? [capOf(b)] : [])].map((v) =>
                  typeof v === "number" ? v / GS.K : v,
                ),
              ), // (a corner's "sw" as it is, and where the wall under it stands whole again: capOf)
          }), // (its walls' faces show under it: stationart.js)
        b.l,
        b.t,
        b.w,
        b.h - p.bldg.wall,
        p.key,
        { fade: true, only: "out" },
      ),
    ];
  },
  roof() {
    // the cabin from outside: roof, log walls, lit windows, the chimney, the gable's triangle window, the porch
    const h = C.y1 - C.y0 + 290;
    return [
      part(() => cabinSVG(), C.x0, C.y1 - h, C.x1 - C.x0, h, C.y1 + 15, {
        img: true,
        fade: true,
        hit: { l: C.x0 - 10, t: C.y0 - C.wall - 60, r: C.x1 + 10, b: C.y1 },
      }),
    ];
  },
  fireplace(p) {
    const wallH = 228,
      h = 72 + wallH,
      b = p.y + p.d;
    return pairParts(A.fireplace({ w: p.w, wallH }), p.x, b, p.w, h);
  },
  rug: () => [], // (in the ground)
  couch(p) {
    const h = 174,
      b = p.y + p.d;
    return pairParts(
      A.couch({
        w: p.w,
        h,
        seats: p.seats || 3,
        color: COUCH[p.id] || "#a8382c",
        facing: "n",
        throwOn: p.id !== "couch2",
      }),
      p.x,
      b,
      p.w,
      h,
    );
  },
  lamp(p) {
    if (p.end)
      return one(
        p,
        () => lit(A.endTable({ w: 76, h: 170 }), ["#ffcf73", "#fff0c2"]),
        76,
        170,
      ); // (the end table by the couches, its lamp on it)
    if (p.h >= 140)
      return one(
        p,
        () => lit(A.floorLamp({ w: 70, h: 170 }), ["#ffcf73", "#fff0c2"]),
        70,
        170,
        164,
      );
    return one(
      p,
      () => lit(A.nightstand({ w: 48, h: 140 }), ["#ffcf73", "#fff0c2"]),
      48,
      140,
      140,
    );
  },
  piano(p) {
    const h = 240;
    return pairParts(A.pianoBody({ w: p.w, h }), p.x, p.y + p.d, p.w, h);
  },
  /* (the stage, its stairs and the mic: stage.js draws them, in strips) */
  chalkfloor: (p) => [
    part(() => A.chalkFloor({ w: p.w, h: p.d }), p.x, p.y, p.w, p.d, p.key, {
      layer: "floor",
    }),
  ],
  chalk: (p) => [
    part(() => A.chalkTile({ w: p.w, h: p.d }), p.x, p.y, p.w, p.d, p.key, {
      layer: "floor",
    }),
  ],
  eraser: (p) => [
    part(() => A.eraserTile({ w: p.w, h: p.d }), p.x, p.y, p.w, p.d, p.key, {
      layer: "floor",
    }),
  ],
  wipe: (p) => [
    part(() => A.wipeTile({ w: p.w, h: p.d }), p.x, p.y, p.w, p.d, p.key, {
      layer: "floor",
    }),
  ],
  book: (p) => one(p, () => A.bookStand({ w: 76, h: 136 }), 76, 136),
  coffee: (p) =>
    one(p, () => A.coffeeTable({ w: p.w, d: p.d, z: p.h }), p.w, p.d + p.h),
  tv: tvParts,
  shelf: (p) =>
    p.map
      ? gsPart(p, () =>
          SK.shelfSVG({
            w: p.w,
            d: p.d,
            h: p.h,
            empty: p.empty,
            seed: seedOf(p),
          }),
        ) // (Downpour's store shelves)
      : one(p, () => A.bookshelf({ w: p.w, h: 140 }), p.w, 140),
  picture: (p) =>
    one(p, () => A.picture({ w: p.w, h: p.h, kind: p.art }), p.w, p.h),
  clock: (p) => one(p, () => A.wallClock({ r: p.w / 2 }), p.w, p.w),
  coatrack: (p) => one(p, () => A.coatRack(), 50, 170),
  boots: (p) => one(p, () => A.boots(), 54, 44),
  mat: (p) => [
    part(() => A.doorMat({ w: p.w, h: p.d }), p.x, p.y, p.w, p.d, p.key, {
      layer: "floor",
    }),
  ],
  plant: (p) => one(p, () => A.pottedPlant(), 60, 100),
  counter: (p) =>
    p.map
      ? gsPart(p, () => SK.counterSVG({ w: p.w, d: p.d, h: p.h })) // (Downpour's shop counter)
      : one(
          p,
          () =>
            A.counter({ w: p.w, sink: p.x > 3800 ? 130 : null, upper: true }),
          p.w,
          240,
        ),
  stove: (p) => one(p, () => A.stove({ w: p.w, h: 150 }), p.w, 150),
  fridge: (p) => one(p, () => A.fridge({ w: 104, h: 196 }), 104, 196),
  table: (p) =>
    pairParts(
      A.kitchenTable({ w: p.w, h: 240 }),
      p.x,
      p.y + p.d - p.z + 10,
      p.w,
      240,
      { backKey: p.y - 25, frontKey: p.key ?? p.y + p.d },
    ), // (the chairs behind a duck sitting on one: seats.js)
  tub: (p) => one(p, () => A.tub({ w: p.w, h: 130 }), p.w, 130),
  sink: (p) => one(p, () => A.sink({ w: 70, h: 196 }), 70, 196),
  toilet: (p) => one(p, () => A.toilet({ w: p.w, h: 130 }), p.w, 130),
  bed: (p) =>
    one(
      p,
      () =>
        A.bed({
          w: p.w,
          h: 290,
          colors:
            p.id === "bed1"
              ? undefined
              : ["#9b5de5", "#e0b04a", "#3e6d8c", "#c4573a"],
        }),
      p.w,
      290,
    ),
  rail: railParts,
  rocker: (p) =>
    one(
      p,
      () =>
        A.rockingChair({
          w: 70,
          h: 100,
          facing: p.id === "rocker1" ? "e" : "w",
        }),
      70,
      100,
      96,
    ),
  "deck-table": (p) => one(p, () => A.smallTable({ w: 60, h: 130 }), 60, 130),
  /* the blackjack table and its stools (layout.js' BJ): each drawing's floor under its middle on the footprint's middle */
  bjtable: (p) => {
    const { r, h, a } = L.BJ;
    return one(
      p,
      () => A.roundCardTable({ r, h, seats: a }),
      2 * r + 20,
      2 * r + h + 18,
      r + 8 + h + p.d / 2,
    );
  },
  stool: (p) => {
    const { st, sh } = L.BJ;
    return one(
      p,
      () =>
        A.stool({
          r: st,
          h: sh,
          color: p.kind === "dealerstool" ? "#2b2b33" : A.CHIPS[p.n % 4],
        }),
      2 * st + 8,
      2 * st + sh + 8,
      st + 4 + sh + p.d / 2,
    );
  },
  dealerstool: (p) => DRAW.stool(p), // (the Butler's: black)
  jeep(p) {
    // the red jeep facing the cabin (east); its shadow is in the ground
    const s = 1.1,
      pr = A.jeep({ facing: "e" });
    return [
      part(
        pr.front,
        p.x - 4,
        p.y + p.d - p.z - 214 * s,
        292 * s,
        214 * s,
        p.key,
        { part: "front" },
      ),
    ];
  },
  post(p) {
    // a lamppost: its pool of light is the ground's (it flickers there)
    const cx = p.x + p.w / 2,
      fy = p.y + p.d - p.z,
      w = 140,
      h = 230;
    return [
      part(
        () => A.lamppost({ w, h }).front,
        cx - w / 2,
        fy - (h - 14),
        w,
        h,
        p.key,
        { fade: true, hit: { l: cx - 18, t: fy - 216, r: cx + 18, b: fy } },
      ),
    ];
  },
  powerbox: (p) =>
    one(p, () => A.powerBox({ w: 80, h: 214 }), 80, 214, 206, {
      cx: L.POWER.x + 6,
    }), // (its post over the prop's middle)
  campfire(p) {
    // the ring around the light's middle
    const w = 150,
      h = 260,
      cx = p.x + p.w / 2,
      cy = p.light.y - p.z;
    return [
      part(
        () => A.campfire({ w, h }),
        cx - w / 2,
        cy - (h - w / 2),
        w,
        h,
        p.key,
      ),
    ];
  },
  log: (p) => one(p, () => A.logSeat({ w: p.w, h: 79, axis: "x" }), p.w, 79),
  trampoline(p) {
    const z = 30,
      h = p.d + z;
    return pairParts(
      A.trampoline({ w: p.w, d: p.d, z }),
      p.x,
      p.y + p.d - p.z,
      p.w,
      h,
      { backKey: p.y, frontKey: p.y + p.d },
    );
  },
  goal(p) {
    // the net: its mouth (the posts) on the field's goal line, the net running back east
    const d = 500,
      z = 110,
      w = 120,
      y0 = p.y + 10,
      b = y0 + d - p.z,
      h = d + z;
    return pairParts(A.soccerNet({ w, d, z, backZ: 70 }), p.x + 10, b, w, h, {
      backKey: y0,
      frontKey: y0 + d,
      fade: true,
      hit: { l: p.x, t: b - h, r: p.x + w + 20, b: b - 20 },
    });
  },
  goalpart: () => [],
  tree(p) {
    if (p.map) {
      /* Downpour's: a swamp tree standing where stationmap.js put it, in three pieces (the owner's, Nov 17 03:34Z): its
         shade on the ground, its trunk sorted with the ducks by its foot, and its crown over everyone under it like a
         roof (world.js: see-through while a duck is under it). Their sizes are the world's own (a duck is 64), not K's;
         a bigger tree (big) a little bigger. Only from outside: from inside a building no leaf or trunk shows over its
         rooms (the owner's, Nov 17 05:46Z) */
      const t = swampTree(hash(p.id + "k")),
        k = 0.9 + (p.big - 0.85) * 0.6,
        fx = p.x + p.w / 2,
        fy = p.y + p.d / 2 - p.z,
        put = (q, url) => {
          const w = q.w * k,
            h = q.h * k;
          return { l: fx - q.ax * k, t: fy - q.ay * k, w, h, url };
        },
        sh = put(t.shade, t.shadeURL),
        tr = put(t.trunk, t.trunkURL),
        cr = put(t.crown, t.crownURL);
      return [
        part(sh.url, sh.l, sh.t, sh.w, sh.h, p.key, {
          img: true,
          url: true,
          layer: "floor",
          part: "shade",
          only: "out",
        }),
        part(tr.url, tr.l, tr.t, tr.w, tr.h, p.key, {
          img: true,
          url: true,
          fade: true,
          part: "trunk",
          only: "out",
          hit: {
            l: tr.l + tr.w * 0.25,
            t: tr.t,
            r: tr.l + tr.w * 0.75,
            b: fy - 10,
          },
        }),
        part(cr.url, cr.l, cr.t, cr.w, cr.h, p.key, {
          img: true,
          url: true,
          layer: "crown",
          part: "crown",
          only: "out",
          hit: {
            l: cr.l + cr.w * 0.12,
            t: cr.t + cr.h * 0.12,
            r: cr.l + cr.w * 0.88,
            b: cr.t + cr.h * 0.88,
          },
        }),
      ];
    }
    const b = treeBox(p);
    return [
      part(treeURL(b.kind), b.l, b.t, b.w, b.h, p.key, {
        img: true,
        fade: true,
        url: true,
        hit: { l: b.l + b.w * 0.14, t: b.t, r: b.l + b.w * 0.86, b: b.sy - 10 },
      }),
    ];
  },
};

/* ---------- the ground ---------- */
const LO = -L.SLOPE.low; // how much lower the downhill draws (240)
const LOWY = L.SLOPE.y1 + LO; // where the downhill starts on the screen
const X0 = -260,
  X1 = L.W + 260,
  Y0 = -460,
  Y1 = L.H + LO + 260;
const piece = (svg, x, y, w, h) => ({ svg, x, y, w, h });
/* a patch of forest floor that fades into the grass toward `to` ('n' | 's' | 'e' | 'w': the open side) */
let fid = 0;
function forestFloor(w, h, to) {
  const id = "hgff" + ++fid,
    [x1, y1, x2, y2] = {
      s: [0, 0, 0, 1],
      n: [0, 1, 0, 0],
      e: [0, 0, 1, 0],
      w: [1, 0, 0, 0],
    }[to];
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible"><defs><linearGradient id="${id}g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}m"><rect width="${w}" height="${h}" fill="url(#${id}g)"/></mask></defs><g mask="url(#${id}m)">${A.ground({ w, h, kind: "forest", seed: fid })}<rect width="${w}" height="${h}" fill="#050d09" opacity=".35"/></g></svg>`;
}
/* a dark stone footing under the cabin's south wall, where the ground falls away from it */
function footing(w, h) {
  let s = `<rect width="${w}" height="${h}" fill="#3a3c44" stroke="#1c1c28" stroke-width="3"/>`;
  for (let y = 3, r = 0; y < h - 4; y += 19, r++)
    for (let x = 3 - (r % 2) * 22, i = 0; x < w - 4; x += 46, i++)
      s += `<rect x="${Math.max(3, x)}" y="${y}" width="${Math.min(42, w - 3 - Math.max(3, x))}" height="${Math.min(16, h - 3 - y)}" rx="4" fill="${["#6c717b", "#7e838d", "#75706a"][(i + r) % 3]}"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${s}<rect width="${w}" height="${h}" fill="#000" opacity=".25"/></svg>`;
}
function groundPieces() {
  const G = [];
  /* the three grounds: the highground's grass, the darker slope, the downhill */
  G.push(
    piece(
      A.ground({ w: X1 - X0, h: L.SLOPE.y0 - Y0, kind: "grass", seed: 2 }),
      X0,
      Y0,
      X1 - X0,
      L.SLOPE.y0 - Y0,
    ),
  );
  G.push(
    piece(
      A.ground({ w: X1 - X0, h: LOWY - L.SLOPE.y0, kind: "slope", seed: 3 }),
      X0,
      L.SLOPE.y0,
      X1 - X0,
      LOWY - L.SLOPE.y0,
    ),
  );
  G.push(
    piece(
      A.ground({ w: X1 - X0, h: Y1 - LOWY, kind: "downhill", seed: 4 }),
      X0,
      LOWY,
      X1 - X0,
      Y1 - LOWY,
    ),
  );
  /* the forest floor, thick at the edges */
  const B = 360;
  G.push(piece(forestFloor(X1 - X0, B - Y0, "s"), X0, Y0, X1 - X0, B - Y0));
  G.push(
    piece(
      forestFloor(X1 - X0, Y1 - (L.H + LO - B), "n"),
      X0,
      L.H + LO - B,
      X1 - X0,
      Y1 - (L.H + LO - B),
    ),
  );
  G.push(piece(forestFloor(B - X0, Y1 - Y0, "e"), X0, Y0, B - X0, Y1 - Y0));
  G.push(
    piece(
      forestFloor(X1 - (L.W - B), Y1 - Y0, "w"),
      L.W - B,
      Y0,
      X1 - (L.W - B),
      Y1 - Y0,
    ),
  );
  /* the dirt path from the forest to the front door */
  const P = L.PATH,
    pw = P.y1 - P.y0,
    ph = pw + 80,
    py = (P.y0 + P.y1) / 2;
  G.push(
    piece(
      A.dirtPath({
        w: P.x1 + 100,
        h: ph,
        pts: [
          [0, ph / 2],
          [P.x1 + 100 - 75 - 40, ph / 2],
        ],
        width: pw,
      }),
      -100,
      py - ph / 2,
      P.x1 + 100,
      ph,
    ),
  );
  /* the soccer field's lines: its east goal line through the net's mouth, centered on the net */
  const goal = L.PROPS.find((p) => p.kind === "goal"),
    fx1 = goal ? goal.x + 10 + 30 : L.FIELD.x1,
    fcy = goal ? goal.y + 10 + 250 : (L.FIELD.y0 + L.FIELD.y1) / 2,
    fh = 1300,
    fw = fx1 - L.FIELD.x0;
  G.push(
    piece(A.soccerField({ w: fw, h: fh }), L.FIELD.x0, fcy - fh / 2, fw, fh),
  );
  /* the pool: pavers round it, then its coping, water and lights, the lane rope */
  const PL = L.POOL,
    c = 30;
  G.push(
    piece(
      A.ground({
        w: PL.x1 - PL.x0 + 200,
        h: PL.y1 - PL.y0 + 160,
        kind: "pavers",
        seed: 5,
      }),
      PL.x0 - 100,
      PL.y0 - 80 + LO,
      PL.x1 - PL.x0 + 200,
      PL.y1 - PL.y0 + 160,
    ),
  );
  const pw0 = PL.x1 - PL.x0 + 2 * c,
    pd0 = PL.y1 - PL.y0 + 2 * c;
  G.push(
    piece(
      still(
        calm(
          A.pool({ w: pw0, d: pd0, depth: L.SLOPE.low - PL.h, c, lights: 5 })
            .back,
        ),
      ),
      PL.x0 - c,
      PL.y0 - c + LO,
      pw0,
      pd0,
    ),
  );
  const ry0 = PL.y0 + LO + (L.SLOPE.low - PL.h),
    ry1 = PL.y1 + LO;
  G.push(
    piece(
      A.laneRope({ w: 22, h: ry1 - ry0 }),
      PL.rope - 11,
      ry0,
      22,
      ry1 - ry0,
    ),
  );
  /* the cabin: its stone footing on the slope, the floors (wood; the kitchen's tiles, the bathroom's), the rugs */
  const fz = -L.terrainAt(C.y1);
  G.push(
    piece(
      footing(L.DECK.x0 - C.x0 + 24, fz + 6),
      C.x0 - 12,
      C.y1 - 2,
      L.DECK.x0 - C.x0 + 24,
      fz + 6,
    ),
  );
  G.push(
    piece(
      A.ground({ w: C.x1 - C.x0, h: C.y1 - C.y0, kind: "wood", seed: 6 }),
      C.x0,
      C.y0,
      C.x1 - C.x0,
      C.y1 - C.y0,
    ),
  );
  G.push(
    piece(
      A.ground({ w: C.x1 - 3500, h: 1100 - C.y0, kind: "tile" }),
      3500,
      C.y0,
      C.x1 - 3500,
      1100 - C.y0,
    ),
  );
  G.push(
    piece(A.ground({ w: 400, h: 350, kind: "bath" }), 3500, 1100, 400, 350),
  );
  const RUG = {
    rug1: { kind: "oval" },
    rug2: { kind: "rect" },
    rug3: {
      kind: "rect",
      colors: ["#3e6d8c", "#e0b04a", "#a8402e", "#1c1c28"],
    },
  };
  for (const p of L.PROPS.filter((q) => q.kind === "rug"))
    G.push(
      piece(
        A.rug({ w: p.w, h: p.d, ...(RUG[p.id] || {}) }),
        p.x,
        p.y,
        p.w,
        p.d,
      ),
    );
  /* the deck's boards (and its west railing), the stairs' landing, treads and risers */
  const D = L.DECK,
    S = L.STAIRS,
    rail = 40,
    drop = -L.terrainAt(D.y1);
  G.push(
    piece(
      A.deck({
        w: D.x1 - D.x0,
        d: D.y1 - D.y0,
        rail,
        drop,
        gapE: [0, D.y1 - D.y0],
        lights: [],
      }).back,
      D.x0,
      D.y0 - rail,
      D.x1 - D.x0,
      D.y1 - D.y0 + rail + drop,
    ),
  );
  G.push(
    piece(
      A.deckStairs({
        w: S.x1 - S.x0,
        d: S.y1 - S.y0,
        rise: LO,
        steps: S.n,
        landing: S.land - S.y0,
        rail,
      }).back,
      S.x0,
      S.y0 - rail,
      S.x1 - S.x0,
      S.y1 - S.y0 + rail + LO,
    ),
  );
  /* shadows: the trees', the jeep's */
  for (const p of L.PROPS.filter((q) => q.kind === "tree")) {
    const b = treeBox(p),
      rx = b.w * 0.38,
      ry = b.w * 0.14;
    G.push({
      raw: `<ellipse cx="${n1(b.cx)}" cy="${n1(b.sy - 4)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="#000" opacity=".33"/>`,
      x: b.cx - rx,
      y: b.sy - 4 - ry,
      w: 2 * rx,
      h: 2 * ry,
    });
  }
  const jp = L.PROPS.find((p) => p.kind === "jeep");
  if (jp)
    G.push(
      piece(
        A.jeep({ facing: "e" }).back,
        jp.x - 4,
        jp.y + jp.d - jp.z - 214 * 1.1,
        292 * 1.1,
        214 * 1.1,
      ),
    );
  /* the forest past the ring of trees, behind everything: north, west and east, in small pieces (a tile paints the few
     it touches) */
  for (let x = X0, k = 0; x < X1; x += 256, k++)
    G.push(
      piece(
        A.forest({ w: 256, h: 420, top: 300, seed: 100 + k, floor: false }),
        x,
        -60 - 314,
        256,
        420,
      ),
    );
  for (let y = Y0 + 140, k = 0; y < Y1; y += 256, k++)
    for (const x of [-235, L.W - 25])
      G.push(
        piece(
          A.forest({
            w: 260,
            h: 556,
            top: 300,
            seed: 200 + k + x,
            density: 0.9,
            floor: false,
          }),
          x,
          y - 300,
          260,
          556,
        ),
      );
  return G;
}
let ground = null,
  dpGround = null;
export const GROUND = () =>
  L.layoutVariant() === "l4gs"
    ? dpGround || (dpGround = downpourGround()) // (dpground.js)
    : ground || (ground = groundPieces());
/* the ground's plain colors (before its tiles are painted): by screen-world y */
export const groundColor = (y) =>
  L.layoutVariant() === "l4gs"
    ? dpGroundColor(y)
    : y < L.SLOPE.y0
      ? "#24503d"
      : y < LOWY
        ? "#1a3a2e"
        : "#1f4636";

/* ---------- decor: what no prop owns ---------- */
function decor() {
  const out = [];
  /* the forest past the ring of trees in the south: in front of everything (nobody gets near enough to be behind it) */
  for (let x = X0, k = 0; x < X1; x += 512, k++)
    out.push(
      part(
        () =>
          A.forest({ w: 512, h: 420, top: 300, seed: 300 + k, floor: false }),
        x,
        L.H + LO + 120 - 314,
        512,
        420,
        99999,
        { img: true },
      ),
    );
  /* the deck: its railing on the south side, the lattice under it down to the slope */
  const D = L.DECK,
    rail = 40,
    drop = -L.terrainAt(D.y1),
    dk = A.deck({
      w: D.x1 - D.x0,
      d: D.y1 - D.y0,
      rail,
      drop,
      gapE: [0, D.y1 - D.y0],
      lights: [],
      bulbs: false,
    });
  out.push(
    part(
      dk.front,
      D.x0,
      D.y0 - rail,
      D.x1 - D.x0,
      D.y1 - D.y0 + rail + drop,
      D.y1,
      { img: true, part: "front", only: "out" },
    ),
  );
  /* its string lights, apart from the picture: they twinkle, and now and then stutter (flicker.js) */
  out.push(
    part(
      A.deckBulbs({ w: D.x1 - D.x0, d: D.y1 - D.y0, rail, drop }),
      D.x0,
      D.y0 - rail,
      D.x1 - D.x0,
      D.y1 - D.y0 + rail + drop,
      D.y1 + 1,
      { only: "out", cls: "hg-porch" },
    ),
  );
  /* the chimney's smoke over the cabin (outside) */
  out.push(
    part(
      `<svg class="hg" viewBox="0 0 80 60" width="80" height="60" overflow="visible" aria-hidden="true"><g class="hg-smoke" style="animation-delay:-1s"><circle cx="46" cy="44" r="20" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-3.4s"><circle cx="36" cy="44" r="16" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-5.6s"><circle cx="42" cy="44" r="18" fill="#c9cfdb"/></g></svg>`,
      2300 - 40,
      C.y0 + A.CHIMNEY.d0 - A.chimneyTop(C.wall) - 56,
      80,
      60,
      C.y1 + 16,
      { only: "out" },
    ),
  );
  /* the pool's light moving on the water (the whole picture fades in and out: cheap) */
  const PL = L.POOL,
    wy = PL.y0 + LO + (L.SLOPE.low - PL.h),
    ww = PL.x1 - PL.x0,
    wh = PL.y1 + LO - wy;
  for (const [k, sz, dl] of [
    ["a", 140, 0],
    ["b", 180, 1.8],
  ]) {
    const pat =
      k === "a"
        ? `<path d="M0 20Q35 4 70 20T140 20M0 55Q35 40 70 55T140 55M20 0Q30 35 15 70M95 0Q110 35 90 70" stroke="#c8fbff" stroke-width="2.2" fill="none" opacity=".35"/>`
        : `<path d="M0 30Q45 10 90 30T180 30M0 75Q45 55 90 75T180 75M50 0Q65 45 45 90" stroke="#e2fdff" stroke-width="1.8" fill="none" opacity=".3"/>`;
    out.push(
      part(
        `<svg class="hg" viewBox="0 0 ${ww} ${wh}" width="${ww}" height="${wh}" aria-hidden="true"><defs><pattern id="hgpw${k}" width="${sz}" height="${sz / 2}" patternUnits="userSpaceOnUse"${k === "b" ? ' patternTransform="translate(40 20)"' : ""}>${pat}</pattern></defs><rect width="${ww}" height="${wh}" fill="url(#hgpw${k})"/></svg>`,
        PL.x0,
        wy,
        ww,
        wh,
        0,
        {
          layer: "floor",
          cls: "hang-shimmer",
          style: `animation-delay:-${dl}s`,
        },
      ),
    );
  }
  return out;
}
let deco = null;
export const DECOR = () =>
  L.layoutVariant() === "l4gs" ? [] : deco || (deco = decor()); // (Downpour: none yet)
