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
const WALLS = L.PROPS.filter((p) => p.kind === "wall");
const NORTH_WINDOWS = [
  [2470, 2590],
  [2820, 2960],
]; // the north wall's windows (world x), looking out at the grass: either side of the TV's place
function wallParts(p) {
  if (p.only === "out") return []; // (the south wall outside: part of the cabin's drawing)
  const z = p.z || 0,
    t = p.y - z - p.h;
  if (p.w >= p.d) {
    // east-west: the cut top, then its face looking south
    const windows =
      p.side === "n"
        ? NORTH_WINDOWS.filter(([a, b]) => a > p.x && b < p.x + p.w).map(
            ([a, b]) => [a - p.x, b - p.x],
          )
        : [];
    return [
      part(
        () => A.logWall({ w: p.w, wallH: p.h, t: p.d, windows }),
        p.x,
        t,
        p.w,
        p.d + p.h,
        p.key,
        { fade: p.fade, only: "in" },
      ),
    ];
  }
  /* north-south: a run of pieces; only the run's south end shows its log ends, the rest is the cut top */
  const b = p.y + p.d - 12,
    end = !WALLS.some(
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
  const into = (q) =>
    q.w > q.d &&
    (q.only || "in") === (p.only || "in") &&
    Math.abs(q.y + 12 - b) < 2 &&
    q.x <= p.x + 1 &&
    q.x + q.w >= p.x + p.w - 1; // (at a corner the east-west wall starts or ends with it)
  const tee = WALLS.some(into),
    low = !tee && L.PROPS.some((q) => q.kind === "stub" && into(q)); // (into an east-west wall: hidden behind its face; over the south wall's low line: its end shows)
  /* a run that starts at an east-west wall: its top starts at that wall's top's front edge (the east-west wall's top runs
     on over the corner; nothing sticks out over it) */
  const head = WALLS.some(
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
          A.logWall({
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
        { fade: p.fade, only: "in" },
      ),
    ];
  const top = () =>
    `<svg class="hg hg-wall" viewBox="0 0 ${p.w} ${d}" width="${p.w}" height="${d}" overflow="visible" aria-hidden="true"><rect x="0" y="${o}" width="${p.w}" height="${d - o}" fill="#c98a52"/><path d="M${p.w * 0.4} ${o < 0 ? o : 3}V${d}" stroke="#e8b27a" stroke-width="3" opacity=".7"/><path d="M0 ${o}V${d}M${p.w} ${o}V${d}${cut ? `M0 0H${p.w}` : ""}" stroke="#1c1c28" stroke-width="2.6"/></svg>`;
  return [
    part(top, p.x, t + head + cut, p.w, d, p.key, { fade: p.fade, only: "in" }),
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
export const DRAW = {
  wall: wallParts,
  stub: (p) => [
    part(
      () => A.logWall({ w: p.w, wallH: p.h, t: p.d }),
      p.x,
      p.y - p.h,
      p.w,
      p.d + p.h,
      p.key,
    ),
  ],
  doorway: () => [],
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
              w: fw,
              wallH: C.wall - bh,
              t: 2 * T,
              rowsH: 2 * T + C.wall,
            }),
          d.a,
          d.at - T - C.wall,
          fw,
          2 * T + C.wall - bh,
          d.at + 6,
          o,
        ),
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
  shelf: (p) => one(p, () => A.bookshelf({ w: p.w, h: 140 }), p.w, 140),
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
    one(
      p,
      () => A.counter({ w: p.w, sink: p.x > 3800 ? 130 : null, upper: true }),
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
let ground = null;
export const GROUND = () => ground || (ground = groundPieces());
/* the ground's plain colors (before its tiles are painted): by screen-world y */
export const groundColor = (y) =>
  y < L.SLOPE.y0 ? "#24503d" : y < LOWY ? "#1a3a2e" : "#1f4636";

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
export const DECOR = () => deco || (deco = decor());
