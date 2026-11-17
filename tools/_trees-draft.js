/* Downpour's trees, third try: the owner picked A, B and D, with no drapes (Nov 17) (drafts for the owner to pick from; not in the game yet). Each returns
   { svg, w, h, foot }: the tree drawn into w × h, its trunk's foot at (w/2, h − foot). Colours from the pixel palette,
   flat bands only, so the pixel look keeps them. I want them about 3 ducks tall, not 5, with one strong silhouette each. */
const O = "#0f0f17"; // (ink)
const n1 = (v) => Math.round(v * 10) / 10;
const rnd = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const wrap = (w, h, s, flip) =>
  `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${flip ? `<g transform="translate(${w} 0) scale(-1 1)">${s}</g>` : s}</svg>`;

/* the night swamp's colours */
const C = {
  shade: "#162c1f", // (a crown's underside)
  leaf: "#1b4c24", // (its body)
  lit: "#1d7d30", // (the clumps the moon hits)
  rim: "#559075", // (wet leaves catching light: a few)
  moss: "#788b59",
  mossD: "#4d7e59",
  mossHi: "#9eb3a1",
  bark: "#453219",
  barkD: "#381e10",
  barkHi: "#5e3215",
  bone: "#849097", // (a dead tree's bleached wood)
  boneD: "#414d59",
  boneHi: "#9eb3a1",
};

/* a rough blob round (cx, cy): n points, each its own distance out, joined by a smooth closed curve */
function blob(cx, cy, rx, ry, r, rough = 0.2, n = 18) {
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
function crown(clumps, r, lit0 = C.lit) {
  let ink = "",
    shade = "",
    body = "",
    lit = "",
    glint = "";
  for (const [cx, cy, rx, ry] of clumps) {
    const d = blob(cx, cy, rx, ry, r);
    ink += `<path d="${d}" fill="${O}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`;
    shade += `<path d="${d}" fill="${C.shade}"/>`;
    body += `<path d="${blob(cx - rx * 0.04, cy - ry * 0.14, rx * 0.86, ry * 0.72, r, 0.24)}" fill="${C.leaf}"/>`;
    if (rx < 14) continue; // (a small leaf tip: its body only)
    lit += `<path d="${blob(cx - rx * 0.24, cy - ry * 0.4, rx * 0.46, ry * 0.3, r, 0.3, 12)}" fill="${lit0}"/>`;
    for (let i = 0; i < 2; i++)
      glint += `<rect x="${n1(cx - rx * 0.55 + r() * rx * 0.6)}" y="${n1(cy - ry * 0.62 + r() * ry * 0.3)}" width="4" height="3" fill="${C.rim}"/>`;
  }
  return ink + shade + body + lit + glint;
}

/* a limb: an ink line under a bark line */
const limb = (d, w, col = C.bark) =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shadow = (cx, b, rx) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(b)}" rx="${n1(rx)}" ry="${n1(rx * 0.3)}" fill="#05070a" opacity=".55"/>`;

/* a trunk from its foot (cx, b) up to y top: flared at the foot (flare × its width), a dark side and a lit side */
function trunk(cx, b, top, w0, w1, flare, col = [C.bark, C.barkD, C.barkHi]) {
  const [c, cd, ch] = col,
    m = b - (b - top) * 0.3;
  const d = `M${n1(cx - w0 * flare)} ${b}C${n1(cx - w0)} ${b - 3} ${n1(cx - w0 * 0.8)} ${n1(m + 10)} ${n1(cx - w1)} ${n1(m)}L${n1(cx - w1 * 0.8)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const dr = `M${n1(cx + w0 * 0.15)} ${b}C${n1(cx + w0 * 0.4)} ${n1(m + 10)} ${n1(cx + w1 * 0.2)} ${n1(m)} ${n1(cx + w1 * 0.15)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const lt = `M${n1(cx - w0 * 0.75)} ${b - 4}C${n1(cx - w0 * 0.6)} ${n1(m + 8)} ${n1(cx - w1 * 0.6)} ${n1(m)} ${n1(cx - w1 * 0.55)} ${top + 4}`;
  return `<path d="${d}" fill="${O}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><path d="${d}" fill="${c}"/><path d="${dr}" fill="${cd}"/><path d="${lt}" fill="none" stroke="${ch}" stroke-width="4" stroke-linecap="round"/>`;
}
const knee = (x, b, k) =>
  `<path d="M${n1(x - 7 * k)} ${b + 1}Q${n1(x - 3 * k)} ${n1(b - 15 * k)} ${n1(x)} ${n1(b - 16 * k)}Q${n1(x + 3 * k)} ${n1(b - 15 * k)} ${n1(x + 7 * k)} ${b + 1}Z" fill="${C.bark}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${n1(x - 3 * k)} ${n1(b - 8 * k)}L${n1(x - 1)} ${n1(b - 13 * k)}" stroke="${C.barkHi}" stroke-width="3"/>`;

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
export function cypress(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 13 + 1),
    { w, top, pads } = CYPRESS[v],
    h = 230,
    foot = 14,
    cx = w / 2,
    b = h - foot,
    k = w / 150;
  let s = shadow(cx, b, 50 * k);
  s +=
    knee(cx - 44 * k, b, 0.9) +
    knee(cx + 40 * k, b, 1.1) +
    knee(cx - 28 * k, b + 6, 0.6) +
    knee(cx + 22 * k, b + 7, 0.7);
  s += trunk(cx, b, top, 15 * k, 6, 2.3);
  for (const [dx, y] of pads)
    s += limb(
      `M${cx} ${y + 10}Q${n1(cx + dx / 2)} ${y + 6} ${n1(cx + dx)} ${y + 2}`,
      4,
    );
  for (const [dx, y, rx, ry] of pads) {
    const x = cx + dx;
    s += crown(
      [
        [x - rx * 0.45, y + 2, rx * 0.58, ry],
        [x + rx * 0.4, y + 1, rx * 0.6, ry * 0.95],
        [x, y - ry * 0.25, rx * 0.62, ry * 1.05],
      ],
      r,
    );
  }
  s += crown([[cx + 2, top - 8, 20 * k, 11]], r); // (the top tuft)
  return { svg: wrap(w, h, s, flip), w, h, foot };
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
export function oak(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 17 + 3),
    { w, clumps, limbs } = OAK[v],
    h = 184,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = shadow(cx, b, w / 3);
  s += crown(
    clumps.map(([dx, y, rx, ry]) => [cx + dx, y, rx, ry]),
    r,
  );
  for (const [x0, y0, qx, qy, x1, y1, lw] of limbs)
    s += limb(`M${cx + x0} ${y0}Q${cx + qx} ${qy} ${cx + x1} ${y1}`, lw);
  s += trunk(cx, b, 92, w > 220 ? 22 : 19, w > 220 ? 15 : 13, 1.55);
  return { svg: wrap(w, h, s, flip), w, h, foot };
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
export function willow(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 23 + 7),
    { w, clumps, trunks } = WILLOW[v],
    h = 200,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = shadow(cx, b, w / 3);
  for (const [dx, tw] of trunks) s += trunk(cx + dx, b, 80, tw, tw * 0.62, 1.7);
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
  s += crown([...C2, ...tips], r, "#358226"); // (a willow's leaves a little yellower than the rest)
  return { svg: wrap(w, h, s, flip), w, h, foot };
}
