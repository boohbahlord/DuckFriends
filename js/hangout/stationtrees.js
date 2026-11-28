/* ---------- Downpour's drawings: the swamp's trees ----------
   Moved out of stationart.js to keep that file small (a pure move; the owner's, Nov 22). */
import { CROWN_LIFT, SWAMP_CROWN, SWAMP_TRUNK, rnd } from "./stationmap.js";

import { F, O, R, ln, n1, uid, wrap } from "./stationbase.js";

/* ---------- the swamp's trees and the fallen tree ---------- */
/* The swamp's trees (the owner's pick, Nov 17: A, B and D, three of each, no drapes): a bald cypress, a live oak and a
   willow, about 3 ducks tall, each with one ink outline round it and three flat bands of leaves, colours from the pixel
   palette. swampTreeSVG(kind, v, seed, flip) gives { svg, w, h, foot }: the tree in w × h, its trunk's foot at
   (w/2, h − foot) */
const TINK = "#0f0f17"; // (the trees' ink: a little darker than the ducks', so they stand out of the dark grass)
const tWrap = (w, h, s, flip) =>
  `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${flip ? `<g transform="translate(${w} 0) scale(-1 1)">${s}</g>` : s}</svg>`;
/* the night swamp's colours */
const TC = {
  shade: "#162c1f", // (a crown's underside)
  leaf: "#1b4c24", // (its body)
  lit: "#1d7d30", // (the clumps the moon hits)
  rim: "#559075", // (wet leaves catching light: a few)
  bark: "#453219",
  barkD: "#381e10",
  barkHi: "#5e3215",
};

/* a rough blob round (cx, cy): n points, each its own distance out, joined by a smooth closed curve */
function tBlob(cx, cy, rx, ry, r, rough = 0.2, n = 18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2,
      k = 1 + (r() - 0.5) * 2 * rough;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n],
      p1 = pts[i],
      p2 = pts[(i + 1) % n],
      p3 = pts[(i + 2) % n];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}

/* a crown from a few clumps [cx, cy, rx, ry]: one outlined silhouette for all of them, then each clump's body, then
   the moonlight on its top-left, then a few wet glints. Three flat bands, no circles stacked on circles. */
function tCrown(clumps, r, lit0 = TC.lit) {
  let ink = "",
    shade = "",
    body = "",
    lit = "",
    glint = "";
  for (const [cx, cy, rx, ry] of clumps) {
    const d = tBlob(cx, cy, rx, ry, r);
    ink += `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/>`;
    shade += `<path d="${d}" fill="${TC.shade}"/>`;
    body += `<path d="${tBlob(cx - rx * 0.04, cy - ry * 0.14, rx * 0.86, ry * 0.72, r, 0.24)}" fill="${TC.leaf}"/>`;
    if (rx < 14) continue; // (a small leaf tip: its body only)
    lit += `<path d="${tBlob(cx - rx * 0.24, cy - ry * 0.4, rx * 0.46, ry * 0.3, r, 0.3, 12)}" fill="${lit0}"/>`;
    for (let i = 0; i < 2; i++)
      glint += `<rect x="${n1(cx - rx * 0.55 + r() * rx * 0.6)}" y="${n1(cy - ry * 0.62 + r() * ry * 0.3)}" width="4" height="3" fill="${TC.rim}"/>`;
  }
  return ink + shade + body + lit + glint;
}

/* a limb: an ink line under a bark line */
const tLimb = (d, w, col = TC.bark) =>
  `<path d="${d}" fill="none" stroke="${TINK}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const tShadow = (cx, b, rx) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(b)}" rx="${n1(rx)}" ry="${n1(rx * 0.3)}" fill="#05070a" opacity=".55"/>`;

/* a trunk from its foot (cx, b) up to y top: flared at the foot (flare × its width), a dark side and a lit side */
function tTrunk(
  cx,
  b,
  top,
  w0,
  w1,
  flare,
  col = [TC.bark, TC.barkD, TC.barkHi],
) {
  const [c, cd, ch] = col,
    m = b - (b - top) * 0.3;
  const d = `M${n1(cx - w0 * flare)} ${b}C${n1(cx - w0)} ${b - 3} ${n1(cx - w0 * 0.8)} ${n1(m + 10)} ${n1(cx - w1)} ${n1(m)}L${n1(cx - w1 * 0.8)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const dr = `M${n1(cx + w0 * 0.15)} ${b}C${n1(cx + w0 * 0.4)} ${n1(m + 10)} ${n1(cx + w1 * 0.2)} ${n1(m)} ${n1(cx + w1 * 0.15)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const lt = `M${n1(cx - w0 * 0.75)} ${b - 4}C${n1(cx - w0 * 0.6)} ${n1(m + 8)} ${n1(cx - w1 * 0.6)} ${n1(m)} ${n1(cx - w1 * 0.55)} ${top + 4}`;
  return `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/><path d="${d}" fill="${c}"/><path d="${dr}" fill="${cd}"/><path d="${lt}" fill="none" stroke="${ch}" stroke-width="4" stroke-linecap="round"/>`;
}
const tKnee = (x, b, k) =>
  `<path d="M${n1(x - 7 * k)} ${b + 1}Q${n1(x - 3 * k)} ${n1(b - 15 * k)} ${n1(x)} ${n1(b - 16 * k)}Q${n1(x + 3 * k)} ${n1(b - 15 * k)} ${n1(x + 7 * k)} ${b + 1}Z" fill="${TC.bark}" stroke="${TINK}" stroke-width="3" stroke-linejoin="round"/><path d="M${n1(x - 3 * k)} ${n1(b - 8 * k)}L${n1(x - 1)} ${n1(b - 13 * k)}" stroke="${TC.barkHi}" stroke-width="3"/>`;

/* A: a bald cypress. Tall and thin, its foot flared wide with knees round it; flat pads of leaves stepping up the
   trunk, gaps between them. About 3.5 ducks tall. v: 0 three pads, 1 two pads high on a long bare trunk, 2 young and
   narrow with four small pads */
const CYPRESS = [
  {
    w: 150,
    top: 26,
    pads: [
      [6, 34, 44, 15],
      [-14, 80, 60, 18],
      [14, 126, 54, 17],
    ],
  },
  {
    w: 150,
    top: 22,
    pads: [
      [-10, 40, 56, 17],
      [16, 90, 50, 16],
    ],
  },
  {
    w: 120,
    top: 20,
    pads: [
      [4, 32, 30, 11],
      [-8, 62, 38, 13],
      [8, 96, 42, 13],
      [-4, 130, 44, 14],
    ],
  },
];
function cypress(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 13 + 1),
    { w, top, pads } = CYPRESS[v],
    h = 230,
    foot = 14,
    cx = w / 2,
    b = h - foot,
    k = w / 150;
  let s = tShadow(cx, b, 50 * k);
  s +=
    tKnee(cx - 44 * k, b, 0.9) +
    tKnee(cx + 40 * k, b, 1.1) +
    tKnee(cx - 28 * k, b + 6, 0.6) +
    tKnee(cx + 22 * k, b + 7, 0.7);
  s += tTrunk(cx, b, top, 15 * k, 6, 2.3);
  for (const [dx, y] of pads)
    s += tLimb(
      `M${cx} ${y + 10}Q${n1(cx + dx / 2)} ${y + 6} ${n1(cx + dx)} ${y + 2}`,
      4,
    );
  for (const [dx, y, rx, ry] of pads) {
    const x = cx + dx;
    s += tCrown(
      [
        [x - rx * 0.45, y + 2, rx * 0.58, ry],
        [x + rx * 0.4, y + 1, rx * 0.6, ry * 0.95],
        [x, y - ry * 0.25, rx * 0.62, ry * 1.05],
      ],
      r,
    );
  }
  s += tCrown([[cx + 2, top - 8, 20 * k, 11]], r); // (the top tuft)
  return { svg: tWrap(w, h, s, flip), w, h, foot };
}

/* B: a live oak. Short and thick, its great limbs reaching out low under one broad lumpy crown. About 2.8 ducks tall:
   the big one, used sparingly. v: 0 even, 1 leaning one way (its long limb that way), 2 smaller, a taller dome */
const OAK = [
  {
    w: 244,
    clumps: [
      [-82, 78, 38, 24],
      [-44, 54, 50, 34],
      [4, 40, 58, 36],
      [50, 52, 50, 32],
      [86, 76, 36, 24],
      [0, 74, 76, 26],
    ],
    limbs: [
      [-6, 118, -50, 104, -92, 98, 10],
      [6, 112, 52, 98, 90, 96, 9],
    ],
  },
  {
    w: 244,
    clumps: [
      [-62, 82, 34, 22],
      [-30, 58, 44, 30],
      [16, 42, 56, 36],
      [62, 54, 50, 32],
      [96, 80, 30, 22],
      [20, 76, 74, 26],
    ],
    limbs: [
      [-6, 118, -36, 108, -66, 100, 9],
      [6, 110, 60, 96, 100, 98, 11],
    ],
  },
  {
    w: 200,
    clumps: [
      [-56, 82, 34, 24],
      [-26, 56, 44, 34],
      [8, 38, 50, 38],
      [44, 62, 42, 30],
      [0, 82, 58, 24],
    ],
    limbs: [
      [-6, 120, -36, 112, -64, 102, 8],
      [6, 116, 32, 104, 56, 100, 8],
    ],
  },
];
function oak(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 17 + 3),
    { w, clumps, limbs } = OAK[v],
    h = 184,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = tShadow(cx, b, w / 3);
  s += tCrown(
    clumps.map(([dx, y, rx, ry]) => [cx + dx, y, rx, ry]),
    r,
  );
  for (const [x0, y0, qx, qy, x1, y1, lw] of limbs)
    s += tLimb(`M${cx + x0} ${y0}Q${cx + qx} ${qy} ${cx + x1} ${y1}`, lw);
  s += tTrunk(cx, b, 92, w > 220 ? 22 : 19, w > 220 ? 15 : 13, 1.55);
  return { svg: tWrap(w, h, s, flip), w, h, foot };
}

/* D: a willow with no drapes: a round head on a short trunk, its sides drooping low, the trunk showing under it.
   About 3 ducks tall. v: 0 wide and drooping, 1 taller and narrower, 2 two trunks from one foot */
const WILLOW = [
  {
    w: 200,
    clumps: [
      [-62, 98, 32, 28],
      [-32, 64, 46, 36],
      [0, 44, 52, 38],
      [32, 62, 46, 36],
      [62, 96, 32, 28],
      [0, 86, 56, 28],
    ],
    trunks: [[4, 13]],
  },
  {
    w: 170,
    clumps: [
      [-48, 96, 28, 28],
      [-24, 58, 40, 36],
      [2, 34, 44, 34],
      [26, 56, 40, 36],
      [50, 92, 28, 28],
      [0, 80, 48, 30],
    ],
    trunks: [[2, 12]],
  },
  {
    w: 210,
    clumps: [
      [-68, 92, 30, 26],
      [-40, 62, 42, 34],
      [-6, 46, 46, 36],
      [30, 52, 46, 36],
      [64, 86, 32, 28],
      [0, 84, 62, 28],
    ],
    trunks: [
      [-14, 10],
      [18, 9],
    ],
  },
];
function willow(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 23 + 7),
    { w, clumps, trunks } = WILLOW[v],
    h = 200,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = tShadow(cx, b, w / 3);
  for (const [dx, tw] of trunks)
    s += tTrunk(cx + dx, b, 80, tw, tw * 0.62, 1.7);
  /* the droop: small round leaf tips all along the bottom of its sides, so it weeps without a single strand */
  const C2 = clumps.map(([dx, y, rx, ry]) => [cx + dx, y, rx, ry]),
    tips = [];
  for (const [x, y, rx, ry] of C2.slice(0, -1))
    if (y > 80)
      for (let i = -1; i <= 1; i++)
        tips.push([
          x + i * rx * (0.5 + r() * 0.15),
          y + ry * (0.8 - Math.abs(i) * 0.25) + r() * 6,
          8 + r() * 4,
          10 + r() * 6,
        ]);
  s += tCrown([...C2, ...tips], r, "#358226"); // (a willow's leaves a little yellower than the rest)
  return { svg: tWrap(w, h, s, flip), w, h, foot };
}

export const SWAMP_KINDS = { cypress, oak, willow };
export const swampTreeSVG = (kind = "cypress", v = 0, seed = 1, flip = false) =>
  SWAMP_KINDS[kind](seed, v, flip);
/* ---------- the swamp's big trees, seen from above (the owner's, Nov 17 03:34Z) ----------
   Trees much bigger than ducks: the trunk's foot about one duck across, the leaves about 4 to 5 ducks across, a roof
   over whoever walks under them (the owner's sketch). Cypress, oak and willow, three looks each, no drapes. Three pieces,
   each { svg, w, h, ax, ay } in world px (a duck is 64), (ax, ay) the point on the trunk's foot:
   - swampShadeSVG: the leaves' shade on the ground (the ground layer)
   - swampTrunkSVG: the trunk, its roots and its limbs, sorted with the ducks by its foot; base: its foot's width
   - swampCrownSVG: the leaves from above, over everything, faded while a duck is under them
   flip mirrors all three the same way. */
/* each kind's shape: its clumps (a ring of them and some inside), its leaf points round the edge, its trunk */
const BIG = {
  /* a cypress: feathery, in rings that step up to its middle, fine needles all round */
  cypress: {
    look: "tiers",
    ring: 12,
    inner: 7,
    clump: 0.14,
    points: 34,
    pointLen: 0.12,
    pointW: 0.045,
    trunk: SWAMP_TRUNK.cypress.w,
    flare: SWAMP_TRUNK.cypress.flare,
    limbs: 6,
    lit: TC.lit,
  },
  /* an oak: a few great lumps of leaves, a few broad points (the owner's sketch) */
  oak: {
    look: "cloud",
    ring: 6,
    inner: 3,
    clump: 0.27,
    points: 6,
    pointLen: 0.2,
    pointW: 0.2,
    trunk: SWAMP_TRUNK.oak.w,
    flare: SWAMP_TRUNK.oak.flare,
    limbs: 5,
    lit: TC.lit,
  },
  /* a willow: round, its fronds running out from the middle to long thin tips all round */
  willow: {
    look: "fronds",
    ring: 12,
    inner: 3,
    clump: 0.17,
    points: 44,
    pointLen: 0.2,
    pointW: 0.04,
    trunk: SWAMP_TRUNK.willow.w,
    flare: SWAMP_TRUNK.willow.flare,
    limbs: 7,
    lit: "#358226",
  },
};
/* the crown's plan (the same for its shade): clumps and points round (0, 0), the crown's middle */
function bigPlan(kind, v, seed) {
  const r = rnd(seed * 37 + v * 11 + kind.length * 5),
    K = BIG[kind],
    { w, h } = SWAMP_CROWN[kind][v],
    hx = w / 2,
    hy = h / 2,
    lean = v === 1 ? 0.12 : 0, // (the second look leans its leaves one way)
    clumps = [],
    points = [];
  for (let i = 0; i < K.ring; i++) {
    const a = ((i + r() * 0.5) / K.ring) * Math.PI * 2,
      out = 0.62 + (r() - 0.5) * 0.12,
      rx = hx * K.clump * 2 * (0.85 + r() * 0.3),
      x =
        Math.cos(a) * (hx - rx * 0.9) * (out / 0.62) * 0.98 +
        lean * hx * (1 + Math.cos(a)) * 0.5,
      y = Math.sin(a) * (hy - rx * 0.8 * (h / w)) * (out / 0.62) * 0.98;
    clumps.push([x, y, rx, rx * (h / w) * 1.05]);
  }
  for (let i = 0; i < K.inner; i++) {
    const a = ((i + r()) / K.inner) * Math.PI * 2,
      rx = hx * K.clump * 2.2 * (0.85 + r() * 0.3);
    clumps.push([
      Math.cos(a) * hx * 0.26 + lean * hx * 0.5,
      Math.sin(a) * hy * 0.26 - hy * 0.05,
      rx,
      rx * (h / w),
    ]);
  }
  clumps.push([
    lean * hx * 0.5 - hx * 0.06,
    -hy * 0.12,
    hx * K.clump * 2.1,
    hy * K.clump * 2.1,
  ]); // (the top, highest)
  for (let i = 0; i < K.points; i++) {
    const a = ((i + r() * 0.6) / K.points) * Math.PI * 2,
      len = K.pointLen * (0.6 + r() * 0.8),
      wid = K.pointW * (0.7 + r() * 0.6);
    // (a point: its two corners just inside the edge, its tip out past it)
    const at = (k, da) => [
      Math.cos(a + da) * hx * k + lean * hx * (1 + Math.cos(a)) * 0.5,
      Math.sin(a + da) * hy * k,
    ];
    points.push([
      at(0.86, -wid),
      at(1 + len, (r() - 0.5) * 0.05),
      at(0.86, wid),
    ]);
  }
  return { r, K, w, h, clumps, points };
}
const ptsPath = (P, dx, dy) =>
  "M" + P.map(([x, y]) => `${n1(x + dx)} ${n1(y + dy)}`).join("L") + "Z";
const BIG_PAD = 30; // (room round the crown for its points and its ink)
const crownLift = (h) => Math.round(h * CROWN_LIFT); // (how far above the trunk's foot the crown's middle shows)
const pieceOut = (W, H, s, ax, ay, flip) => ({
  svg: tWrap(W, H, s, flip),
  w: W,
  h: H,
  ax: flip ? W - ax : ax,
  ay,
});

/* the leaves from above: one ink outline round every clump and point, the deep leaves, each clump's body, the moon
   on the top-left of each, a few wet glints */
export function swampCrownSVG(kind = "cypress", v = 0, seed = 1, flip = false) {
  const { r, K, w, h, clumps, points } = bigPlan(kind, v, seed),
    W = w + BIG_PAD * 2,
    H = h + BIG_PAD * 2,
    cx = W / 2,
    cy = H / 2;
  let ink = "",
    deep = "",
    body = "",
    lit = "",
    glint = "";
  for (const P of points) {
    const d = ptsPath(P, cx, cy);
    ink += `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/>`;
    deep += `<path d="${d}" fill="${TC.shade}"/>`;
  }
  clumps.forEach(([x, y, rx, ry], i) => {
    const d = tBlob(cx + x, cy + y, rx, ry, r),
      ring = i < K.ring ? 0 : i < clumps.length - 1 ? 1 : 2; // (the outer ring, the inner one, the top)
    ink += `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/>`;
    deep += `<path d="${d}" fill="${TC.shade}"/>`;
    body += `<path d="${tBlob(cx + x - rx * 0.06, cy + y - ry * 0.1, rx * 0.82, ry * 0.78, r, 0.24)}" fill="${TC.leaf}"/>`;
    if (K.look === "fronds") return; // (a willow's light runs down its fronds instead)
    if (K.look === "tiers" && ring === 0 && r() < 0.5) return; // (a cypress's outer ring mostly in the dark)
    const k = K.look === "tiers" ? 0.34 + ring * 0.08 : 0.44;
    lit += `<path d="${tBlob(cx + x - rx * 0.26, cy + y - ry * 0.3, rx * k, ry * k * 0.8, r, 0.3, 12)}" fill="${K.look === "tiers" && ring === 2 ? TC.rim : K.lit}"/>`;
    if (r() < 0.5)
      glint += `<rect x="${n1(cx + x - rx * 0.5 + r() * rx * 0.5)}" y="${n1(cy + y - ry * 0.55 + r() * ry * 0.3)}" width="4" height="3" fill="${TC.rim}"/>`;
  });
  if (K.look === "fronds")
    /* a willow: its fronds from the middle out, lit on the moon's side, dark on the other */
    for (let i = 0; i < 22; i++) {
      const a = ((i + r() * 0.8) / 22) * Math.PI * 2,
        c = Math.cos(a),
        sn = Math.sin(a),
        k0 = 0.12 + r() * 0.3,
        k1 = 0.6 + r() * 0.3,
        side = -(c + sn) / 1.4; // (1 facing the moon, up and left; −1 away)
      if (side < -0.5 && r() < 0.6) continue; // (the far side mostly plain)
      const bend = (r() - 0.5) * 0.5,
        km = (k0 + k1) / 2,
        P = (k, da = 0) =>
          `${n1(cx + Math.cos(a + da) * (w / 2) * k)} ${n1(cy + Math.sin(a + da) * (h / 2) * k)}`;
      lit += `<path d="M${P(k0)}Q${P(km, bend)} ${P(k1, bend * 0.6)}" fill="none" stroke="${side > -0.2 ? K.lit : TC.shade}" stroke-width="${side > 0.4 ? 6 : 4}" stroke-linecap="round"/>`;
    }
  return pieceOut(
    W,
    H,
    ink + deep + body + lit + glint,
    cx,
    cy + crownLift(h),
    flip,
  );
}

/* the leaves' shade on the ground: the crown's shape, a little smaller, flat and dark, mostly under the leaves, peeking
   out down and right of them (the moon is up and left) */
export function swampShadeSVG(kind = "cypress", v = 0, seed = 1, flip = false) {
  const { r, w, h, clumps, points } = bigPlan(kind, v, seed),
    W = w + BIG_PAD * 2,
    H = h + BIG_PAD * 2,
    cx = W / 2,
    cy = H / 2;
  let s = "";
  for (const P of points) s += `<path d="${ptsPath(P, cx, cy)}"/>`;
  for (const [x, y, rx, ry] of clumps)
    s += `<path d="${tBlob(cx + x, cy + y, rx, ry, r)}"/>`;
  return pieceOut(
    W,
    H,
    `<g fill="#05070a" opacity=".38" transform="translate(${n1(cx)} ${n1(cy)}) scale(.86) translate(${n1(-cx)} ${n1(-cy)})">${s}</g>`,
    cx - 16,
    cy + crownLift(h) * 0.45,
    flip,
  );
}

/* the trunk at the map's slant: its foot flared on the ground with roots running off it (a cypress's knees round it),
   the trunk up to where the leaves start, its limbs spreading out under them. Hidden under the leaves till they fade */
export function swampTrunkSVG(kind = "cypress", v = 0, seed = 1, flip = false) {
  const { K, w, h } = bigPlan(kind, v, seed),
    r = rnd(seed * 41 + v * 13 + kind.length),
    lift = crownLift(h),
    up = lift + 26, // (the trunk's height on screen, to the crown's middle and a little past)
    W = w + BIG_PAD * 2,
    H = up + h * 0.5 + 40,
    cx = W / 2,
    b = H - 24,
    top = b - up,
    tw = K.trunk / 2;
  let s = `<ellipse cx="${cx}" cy="${b}" rx="${n1(tw * K.flare * 1.3)}" ry="${n1(tw * K.flare * 0.45)}" fill="#05070a" opacity=".5"/>`;
  /* roots: tapered, along the ground away from the foot */
  let roots = "";
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (-0.05 + (i / 5) * 1.1) + (r() - 0.5) * 0.3,
      len = tw * (1.6 + r() * 1.2),
      x0 = cx + Math.cos(a) * tw * 0.8,
      y0 = b + Math.sin(a) * tw * 0.25,
      x1 = cx + Math.cos(a) * len * 1.3,
      y1 = b + Math.sin(a) * len * 0.45;
    const hw = tw * 0.32,
      nx = -Math.sin(a) * hw,
      ny = Math.cos(a) * hw * 0.9;
    roots += `<path d="M${n1(x0 + nx)} ${n1(y0 + ny)}Q${n1((x0 + x1) / 2 + nx * 0.5)} ${n1((y0 + y1) / 2 + ny * 0.5 - 3)} ${n1(x1)} ${n1(y1)}Q${n1((x0 + x1) / 2 - nx * 0.5)} ${n1((y0 + y1) / 2 - ny * 0.5)} ${n1(x0 - nx)} ${n1(y0 - ny)}Z"/>`;
  }
  s += `<g fill="${TC.bark}" stroke="${TINK}" stroke-width="3" stroke-linejoin="round">${roots}</g>`;
  if (kind === "cypress")
    for (const [dx, dy, k] of [
      [-1.9, 0.5, 0.9],
      [2.0, 0.3, 1.1],
      [-1.2, 1.1, 0.7],
      [1.4, 1.2, 0.8],
      [0.2, 1.5, 0.6],
    ])
      s += tKnee(cx + dx * tw * 1.4, b + dy * tw * 0.5, k * 1.2);
  /* the limbs: from the trunk's top out and up under the leaves (never down across the trunk), thinner as they go,
     each with a twig off it */
  s += tTrunk(cx, b, top, tw, tw * 0.78, K.flare);
  for (let i = 0; i < K.limbs; i++) {
    const a = -Math.PI * (0.06 + ((i + 0.2 + r() * 0.6) / K.limbs) * 0.88),
      len = (w / 2) * (0.6 + r() * 0.25),
      sy = (h / w) * 0.8,
      at = (k, da = 0) => [
        cx + Math.cos(a + da) * len * k,
        top + 4 + Math.sin(a + da) * len * k * sy,
      ],
      [mx, my] = at(0.5, 0.12 * (r() - 0.5)),
      [ex, ey] = at(1, 0.2 * (r() - 0.5)),
      [tx, ty] = at(0.82, (r() < 0.5 ? -1 : 1) * 0.35);
    s += tLimb(`M${cx} ${top + 6}L${n1(mx)} ${n1(my)}`, Math.max(6, tw * 0.5));
    s += tLimb(
      `M${n1(mx)} ${n1(my)}L${n1(ex)} ${n1(ey)}`,
      Math.max(4, tw * 0.28),
    );
    s += tLimb(`M${n1(mx)} ${n1(my)}L${n1(tx)} ${n1(ty)}`, 3);
  }
  return {
    ...pieceOut(W, H, s, cx, b, flip),
    base: Math.round(K.trunk * 1.25),
  }; // (about a duck: what blocks)
}

/* the fallen tree across the road's east end: a log from (x0, y0) to (x1, y1) in a box w × h, `half` thick each side
   and lying `z` high at its middle; its broken crown at the north end (no roots, no moss: the owner's, Nov 28 04:58Z) */
export function fallenSVG({ w, h, x0, y0, x1, y1, half = 55, z = 30 }) {
  const id = uid(),
    dx = x1 - x0,
    dy = y1 - y0,
    len = Math.hypot(dx, dy),
    a = (Math.atan2(dy, dx) * 180) / Math.PI;
  const defs = F`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#805031"/><stop offset=".5" stop-color="#5e3215"/><stop offset="1" stop-color="#381e10"/></linearGradient>`;
  // drawn along x in its own frame (0 … len, −half … half), then turned onto its line and lifted z
  let g = R(
    0,
    -half,
    len,
    2 * half,
    `url(#${id})`,
    `rx="${half * 0.9}" ${ln(3)}`,
  );
  const r = rnd(7);
  for (let x = 30; x < len - 30; x += 26 + r() * 18)
    g += F`<path d="M${x} ${-half * 0.8}Q${x + 10} 0 ${x - 4} ${half * 0.8}" stroke="#381e10" stroke-width="3" fill="none"/>`;
  // a broken crown at the near end, a few snapped branches
  g += F`<path d="M8 ${-half * 0.7}l-22 -16l10 22l-24 0l22 14l-20 18l26 -8" fill="#ae7838" ${ln(2)}/>`;
  for (const [x, k] of [
    [len * 0.3, -1],
    [len * 0.55, 1],
    [len * 0.75, -1],
  ])
    g += F`<path d="M${x} ${k * half * 0.6}l18 ${k * 40}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${x} ${k * half * 0.6}l18 ${k * 40}" stroke="#5e3215" stroke-width="6" stroke-linecap="round"/>`;
  const s =
    F`<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#000" stroke-width="${2 * half}" stroke-linecap="round" opacity=".3"/>` +
    F`<g transform="translate(${x0} ${y0 - z}) rotate(${a})">${g}</g>`;
  return wrap(w, h, s, defs);
}
