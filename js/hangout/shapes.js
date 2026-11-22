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
import * as GS from "./stationmap.js";
import * as SA from "./stationart.js";
import { floorBricks } from "./bricks.js";
import { ART } from "./pxworld.js";

import { plankArt } from "./plank.js";

import { C, T, lit, pairParts, part } from "./shapesbase.js";

import {
  cabinSVG,
  glassOn,
  railParts,
  skinOf,
  treeBox,
  treeURL,
  tvParts,
  wallParts,
  walls,
} from "./shapeswalls.js";

export { cabinSVG, tvScreenStrip } from "./shapeswalls.js";
export { DECOR, GROUND, groundColor } from "./shapesground.js";

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
const seedOf = (p) => GS.seedAt(p.x, p.y);
/* Downpour's trees: which one grows where is the map's (stationmap.js swampPick, from the tree's id, as its size); each
   drawing is made once */
const SWAMP_URL = {};
function swampTree(id) {
  const { kind, v, flip, seed } = GS.swampPick(id),
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
  plank: (p) => gsPart(p, () => plankArt(p, GS.K)),
  car: (p) => {
    const up = p.hood ? 110 * GS.K : 0,
      k = p.seed ?? seedOf(p); // (a pushed car keeps its look: layout.js carAt)
    return (p.drawn = gsPart(
      p,
      () =>
        SK.carSVG({
          w: p.w,
          d: p.d,
          h: p.h,
          seed: k,
          east: p.east ?? GS.carEast(p.x, p.y, p.hood),
          hood: !!p.hood,
          up,
          smash: p.smash || "",
          dead: p.dead || "",
        }),
      { up },
    ));
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
      () => floorBricks({ w: p.w, d: p.d, seed: Math.round(p.x + p.y) }),
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
    const s = L.JEEP.s,
      pr = A.jeep({ facing: "e" });
    return [
      part(
        pr.front,
        p.x + L.JEEP.left,
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
      const t = swampTree(p.id),
        k = GS.treeK(p.big),
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
