/* ---------- Duck Cabin's props, drawn: walls, railings, the TV, the trees ----------
   Moved out of shapes.js to keep that file small (a pure move; the owner's, Nov 22). */
import * as A from "./art.js";
import * as L from "./layout.js";
import * as GS from "./stationmap.js";
import * as SA from "./stationart.js";
import { heapBricks } from "./bricks.js";

import { C, hash, n1, part } from "./shapesbase.js";

/* ---------- the walls: log walls cut away inside; outside, the cabin's own drawing covers them ---------- */
let WALLS = [],
  wallsRev = -1;
export const walls = () => {
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
export const skinOf = (p) => (p.y < GS.ROAD.y0 ? "gs" : "ch");
export const glassOn = (p) =>
  (p.glass || [])
    .map(([a, b]) => [Math.max(a, p.x) - p.x, Math.min(b, p.x + p.w) - p.x])
    .filter(([a, b]) => b - a > 30);
/* the heap of blocks at the foot of Downpour's smashed corner (world px): its floor w × d, and how high it may reach */
const HEAP = { w: 180, d: 64, up: 34 };
export function wallParts(p) {
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
export function railParts(p) {
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
export function tvParts(p) {
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
export const treeURL = (kind) =>
  TREE_URL[kind] || (TREE_URL[kind] = A.svgDataURL(A.tree({ kind }).front));
const TREE_SCALE = 1.25;
export function treeBox(p) {
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
