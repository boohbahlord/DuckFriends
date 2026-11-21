/* ---------- loose bricks, drawn as pixels (Downpour's smashed walls: stationart.js) ----------
   The owner's, Nov 19 23:41Z: "Bricks with 3D shapes. They're basically long squared cubes ... rectangular prisms ...
   maybe some chipped at the corners or cracks in them. Soft, faint cracks, not harsh, black contrast cracks ... Bricks
   lay in whatever direction they want, and not just in one direction ... Do not try and overlap the bricks on one
   another. Try and have them be at different proportions away from each other", and "everything pixels now ... You do
   the pixels first". So no shapes here that are made into pixels after: each brick is a box (a whole block of the
   wall, a half, or a broken chunk) put down at its own turn and on its own side, and drawn straight into the world's
   pixels (one pixel to ART world px), the way the world shows a thing: its top, and under it the faces that look
   south, nearer ones over farther ones pixel by pixel. A brick dropped where others already lie rests on the highest
   under it, so a heap stacks up by itself. Only the game's colours (pixelpalette.js), the wall's own: its cream face,
   the grey-green of its mortar and the grey of its cut concrete; the ink round each brick, and its small shadow.
   The plan's numbers here are pixels; x east, y south, z up. A point (x, y, z) is at (x, y - z) on the screen. */

import { ART } from "./pxworld.js";

const INK = "#1d1e29",
  TOP = "#d0cfa2", // (its top: the wall's face colour)
  SIDE = "#9eb3a1", // (a face toward the south-west, and a chip or a crack: a shade under the top)
  DARK = "#849097", // (a face toward the south-east)
  SHADOW = "#111026"; // (half see-through)
/* a brick: [long, wide, high], always a brick's shape, about 2 long to 1 wide to 0.6 high (Joseph's critique, Nov 20:
   "Most rubble pieces read as cubes or chunks, not bricks"), so lying flat its long side shows, and standing up its end
   shows small. A whole one, near a block of the wall (its face 64 × 12 world px: stationart.js SKINS.gs), and smaller */
const SIZES = {
  whole: [26, 13, 8],
  half: [20, 10, 6],
  chunk: [14, 7, 5],
  fascia: [26, 8, 3], // (pieces of the roof that came down with the wall: a length of the sign's red band,
  strip: [40, 5, 2], // a long strip of it, bent, lying across the bricks,
  slab: [12, 9, 5], // and a chunk of the roof's grey slab)
};
/* each one's top, its face toward the south-west and its face toward the south-east, in the game's colours */
const MATS = {
  brick: [TOP, SIDE, DARK],
  red: ["#c7282a", "#99163b", "#820a17"],
  slab: ["#849097", "#565d77", "#414d59"],
};
const rnd = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; // (the same "random" every time)

/* a brick: its middle (x, y), its turn a, which way it lies (bed: on its broad side; edge: on its long narrow side;
   end: standing up), its size; its footprint's corners and its height */
function brick(x, y, a, size, lie, r) {
  const [L, W, H] = SIZES[size];
  const [fl, fw, fh] =
    lie === "edge" ? [L, H, W] : lie === "end" ? [W, H, L] : [L, W, H];
  const ux = Math.cos(a),
    uy = Math.sin(a),
    vx = -uy,
    vy = ux,
    foot = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([i, j]) => [
      x + (ux * fl * i) / 2 + (vx * fw * j) / 2,
      y + (uy * fl * i) / 2 + (vy * fw * j) / 2,
    ]);
  const mat =
    size === "fascia" || size === "strip"
      ? "red"
      : size === "slab"
        ? "slab"
        : "brick";
  return { x, y, a, size, foot, h: fh, z: 0, mat };
}

/* is (px, py) inside a convex polygon (either way round) */
function inside(poly, px, py) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i],
      [x1, y1] = poly[(i + 1) % poly.length],
      c = (x1 - x0) * (py - y0) - (y1 - y0) * (px - x0);
    if (c === 0) continue;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}
/* do two convex polygons come within gap of each other (their corners tested against the other grown by gap) */
function near(p, q, gap) {
  const grow = (poly) => {
    const cx = poly.reduce((s, v) => s + v[0], 0) / poly.length,
      cy = poly.reduce((s, v) => s + v[1], 0) / poly.length;
    return poly.map(([x, y]) => {
      const d = Math.hypot(x - cx, y - cy) || 1;
      return [x + ((x - cx) / d) * gap, y + ((y - cy) / d) * gap];
    });
  };
  const P = grow(p),
    Q = grow(q);
  const pts = (poly) =>
    poly.flatMap((v, i) => {
      const u = poly[(i + 1) % poly.length];
      return [0, 0.2, 0.4, 0.6, 0.8].map((f) => [
        v[0] + (u[0] - v[0]) * f,
        v[1] + (u[1] - v[1]) * f,
      ]);
    }); // (along each edge: two that cross have one inside the other)
  return (
    pts(P).some(([x, y]) => inside(Q, x, y)) ||
    pts(Q).some(([x, y]) => inside(P, x, y))
  );
}

/* the drawing: w × h pixels, its bricks (each one's z set by where it lands), crumbs [[x, y, colour]]; up: how far its
   picture reaches above its box's top, in pixels (a heap's height) */
function draw(w, h, bricks, crumbs, up, r) {
  const W = w,
    H = h + up,
    depth = new Float32Array(W * H).fill(-1e9),
    who = new Int32Array(W * H).fill(-1),
    col = new Array(W * H).fill(null),
    /* every pixel in the box round some points (xs, ys), row by row: fn(px, py) */
    eachPixel = (xs, ys, fn) => {
      for (
        let py = Math.max(0, Math.floor(Math.min(...ys)));
        py < Math.min(H, Math.ceil(Math.max(...ys)));
        py++
      )
        for (
          let px = Math.max(0, Math.floor(Math.min(...xs)));
          px < Math.min(W, Math.ceil(Math.max(...xs)));
          px++
        )
          fn(px, py);
    };
  bricks.forEach((b, id) => {
    const z0 = b.z,
      z1 = b.z + b.h,
      faces = [
        { poly: b.foot.map(([x, y]) => [x, y - z1 + up]), top: z1 }, // (its top)
      ];
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = b.foot[i],
        [x1, y1] = b.foot[(i + 1) % 4],
        cx = b.foot.reduce((s, v) => s + v[0], 0) / 4,
        cy = b.foot.reduce((s, v) => s + v[1], 0) / 4;
      let nx = y1 - y0,
        ny = -(x1 - x0);
      const len = Math.hypot(nx, ny);
      nx /= len;
      ny /= len;
      if (nx * ((x0 + x1) / 2 - cx) + ny * ((y0 + y1) / 2 - cy) < 0) {
        nx = -nx;
        ny = -ny;
      } // (outward)
      if (ny <= 0.02) continue; // (a face looking north: unseen)
      faces.push({
        poly: [
          [x0, y0 - z1 + up],
          [x1, y1 - z1 + up],
          [x1, y1 - z0 + up],
          [x0, y0 - z0 + up],
        ],
        n: [nx, ny],
        c: nx * x0 + ny * y0,
      });
    }
    for (const f of faces) {
      const xs = f.poly.map((v) => v[0]),
        ys = f.poly.map((v) => v[1]);
      eachPixel(xs, ys, (px, py) => {
        const sx = px + 0.5,
          sy = py + 0.5;
        if (!inside(f.poly, sx, sy)) return;
        /* how near the eye: y + z along the ray through this pixel (the world is seen from the south and above) */
        let t;
        if (f.top != null) t = f.top;
        else t = (f.c - f.n[0] * sx - f.n[1] * (sy - up)) / f.n[1];
        const d = sy + 2 * t,
          k = py * W + px;
        if (d <= depth[k]) return;
        depth[k] = d;
        who[k] = id;
        const M = MATS[b.mat];
        col[k] =
          f.top != null
            ? M[0]
            : f.n[0] > 0.45
              ? M[2]
              : M[1]; /* (lit from the west: a face turned east is darker) */
      });
    }
  });
  /* chips and cracks on the tops: a corner knocked off shows the brick's inside; a crack, a faint line a shade under */
  bricks.forEach((b, id) => {
    if (b.chip != null) {
      const [cx, cy] = b.foot[b.chip];
      for (let py = 0; py < H; py++)
        for (let px = 0; px < W; px++) {
          const k = py * W + px;
          if (who[k] !== id || col[k] !== MATS[b.mat][0]) continue;
          if (Math.hypot(px + 0.5 - cx, py + 0.5 + b.z + b.h - up - cy) < 2.6)
            col[k] = MATS[b.mat][1];
        }
    }
    if (b.crack) {
      const [ax, ay] = b.foot[b.crack[0]],
        [bx, by] = b.foot[(b.crack[0] + 1) % 4],
        f = 0.3 + b.crack[1] * 0.4,
        sx = ax + (bx - ax) * f,
        sy = ay + (by - ay) * f - b.z - b.h + up,
        mx = b.x - sx,
        my = b.y - b.z - b.h + up - sy;
      for (let s = 0; s <= 1; s += 0.08) {
        const px = Math.floor(sx + mx * s * 0.9 + Math.sin(s * 6) * 0.6),
          py = Math.floor(sy + my * s * 0.9),
          k = py * W + px;
        if (px >= 0 && py >= 0 && px < W && py < H && who[k] === id)
          if (col[k] === MATS[b.mat][0]) col[k] = MATS[b.mat][1];
      }
    }
  });
  /* the ink round each brick: on the empty pixels round it, and on a brick behind where one in front meets it */
  const out = col.slice();
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const k = py * W + px;
      if (who[k] < 0) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const qx = px + dx,
          qy = py + dy;
        if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
        const q = qy * W + qx;
        if (who[q] < 0 || (who[q] !== who[k] && depth[q] < depth[k]))
          out[q] = INK;
      }
    }
  /* each one's shadow on the floor, the way the ducks' falls (css .gduck-shadow): right under it, a little wider than it
     and a little to the south, so it sits on the ground */
  const shade = new Array(W * H).fill(false);
  for (const b of bricks) {
    if (b.z > 0) continue; // (one lying on others: its shadow falls on them, under it)
    const cx = b.foot.reduce((t, v) => t + v[0], 0) / 4,
      cy = b.foot.reduce((t, v) => t + v[1], 0) / 4,
      grown = b.foot.map(([x, y]) => {
        const d = Math.hypot(x - cx, y - cy) || 1;
        return [x + ((x - cx) / d) * 2.2, y + ((y - cy) / d) * 2.2 + 1.5];
      }),
      xs = grown.map((v) => v[0]),
      ys = grown.map((v) => v[1] + up);
    eachPixel(xs, ys, (px, py) => {
      if (!out[py * W + px] && inside(grown, px + 0.5, py + 0.5 - up))
        shade[py * W + px] = true;
    });
  }
  for (const [x, y, c] of crumbs) {
    const px = Math.floor(x),
      py = Math.floor(y + up);
    if (px >= 0 && py >= 0 && px < W && py < H && !out[py * W + px])
      out[py * W + px] = c;
  }
  /* as rects, a run of one colour along each row at a time, each pixel ART world px */
  let s = "";
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; ) {
      const k = py * W + px,
        c = out[k] || (shade[k] ? SHADOW : null);
      let n = 1;
      while (px + n < W && (out[k + n] || (shade[k + n] ? SHADOW : null)) === c)
        n++;
      if (c)
        s += `<rect x="${px * ART}" y="${(py - up) * ART}" width="${n * ART}" height="${ART}" fill="${c}"${c === SHADOW && !out[k] ? ' fill-opacity=".6"' : ""}/>`;
      px += n;
    }
  return s;
}

/* lay the bricks: each one tried at a spot pick() gives, kept if it stays gap pixels clear of all the ones on the floor
   (stack: dropped onto whatever is under it instead). hm: the heights the bricks reach, a pixel at a time */
function lay(
  w,
  h,
  n,
  pick,
  r,
  {
    stack = false,
    tries = 60,
    high = 99,
    low = 0,
    st = { hm: new Float32Array(w * h), bricks: [] },
  } = {},
) {
  const { hm, bricks } = st,
    mine = [];
  for (let i = 0; i < n; i++)
    for (let t = 0; t < tries; t++) {
      const { x, y, size, lie, gap } = pick(i, t);
      const b = brick(x, y, r() * Math.PI, size, lie, r);
      if (
        b.foot.some(([fx, fy]) => fx < 1 || fy < 1 || fx > w - 2 || fy > h - 2)
      )
        continue;
      if (!stack && bricks.some((o) => near(o.foot, b.foot, gap))) continue;
      /* where it lands: on the highest thing under it */
      let z = 0;
      const cells = [];
      for (let py = 0; py < h; py++)
        for (let px = 0; px < w; px++)
          if (inside(b.foot, px + 0.5, py + 0.5)) {
            cells.push(py * w + px);
            z = Math.max(z, hm[py * w + px]);
          }
      if (!cells.length || z > high || z < low) continue; // (high: a heap, not a tower; low: on top of others)
      /* it rests on what's under it: most of it, not a bridge over two others (a table of bricks) */
      if (
        z > 0 &&
        cells.filter((k) => hm[k] >= z - 1.5).length < cells.length * 0.55
      )
        continue;
      b.z = z;
      for (const k of cells) hm[k] = z + b.h;
      if (r() < 0.35) b.chip = Math.floor(r() * 4);
      if (b.mat === "brick" && b.size !== "chunk" && r() < 0.3)
        b.crack = [Math.floor(r() * 4), r()];
      bricks.push(b);
      mine.push(b);
      break;
    }
  return mine;
}
const sizeOf = (r) => {
  const u = r();
  return u < 0.45 ? "whole" : u < 0.8 ? "half" : "chunk";
};
const crumbsOf = (r, n, at) =>
  Array.from({ length: n }, () => [...at(), r() < 0.6 ? SIDE : DARK]);

/* the rubble out of a smashed north-south wall: w × d world px on the floor, the wall's line down its middle. On the
   ground in front of the hole, west of the wall's line (outside, where it was knocked out to: Joseph's critique, Nov 20,
   "The heap belongs on the ground in front of the hole, west of the strip, and it should spread out and get lower moving
   away, not stand up in a line"): thick by the line, thinning out going west, a few strays farther. None inside: seen
   through the roof's broken corner, they read as lying on the wall. Never one on top of another out on the floor */
export function floorBricks({ w, d, seed = 1 }) {
  const r = rnd(seed),
    pw = Math.round(w / ART),
    ph = Math.round(d / ART),
    mid = pw / 2,
    up = 6,
    clear = 9; // (the wall's line, half its width and a little: nothing lies on it)
  const n = Math.round((pw * ph) / 1300),
    away = () => Math.abs(r() + r() - 1), // (0 by the line most often, up to 1)
    floor = lay(
      pw,
      ph,
      n,
      () => ({
        x: mid - clear - 6 - away() * (mid - clear - 14),
        y: 10 + r() * (ph - 18),
        size: sizeOf(r),
        lie: r() < 0.85 ? "bed" : "edge",
        gap: 3 + r() * 7,
      }),
      r,
    );
  /* a low heap by the wall's line, in the middle of the way through, where most of them fell: dropped onto each other */
  const heap = lay(
    pw,
    ph,
    5,
    () => ({
      x: mid - clear - 10 - r() * 18,
      y: ph * (0.3 + r() * 0.4),
      size: sizeOf(r),
      lie: "bed",
      gap: 0,
    }),
    r,
    { stack: true, high: 6 },
  ).filter((b) => !floor.some((o) => near(o.foot, b.foot, 1)) || b.z > 0);
  const all = [...floor, ...heap],
    crumbs = crumbsOf(r, Math.round(n * 1.6), () => [
      mid - clear - away() * pw * 0.4,
      4 + r() * (ph - 8),
    ]);
  return `<svg class="hg" viewBox="0 0 ${w} ${d}" width="${w}" height="${d}" overflow="visible" aria-hidden="true">${draw(pw, ph, all, crumbs, up, r)}</svg>`;
}

/* the heap at the foot of a wall's broken end, seen from the south (the gas station's south-west corner): w × d world px
   of floor in front of the wall, the wall's broken end at its west (left) edge. Bricks dropped any which way, onto each
   other: high by the wall's end, lower and looser going east and south, a few strays. All of them on the ground south of
   the wall's foot (Joseph's critique, Nov 20: drawn over the wall's face, they "look like they float"), and low. up: how
   far above the box's top the heap may reach (world px) */
export function heapBricks({ w, d, seed = 1, up = 40, roof = false }) {
  const r = rnd(seed),
    pw = Math.round(w / ART),
    ph = Math.round(d / ART),
    pu = Math.round(up / ART),
    st = { hm: new Float32Array(pw * ph), bricks: [] },
    at = (spread) => ({
      x: 4 + Math.abs(r() + r() - 1) * pw * spread,
      y: 9 + r() * (ph - 14) * Math.min(0.85, spread + 0.15),
    });
  /* the floor under the break first, then a layer dropped onto those, then a last few on top: most of them lying flat */
  const heap = [
    ...lay(
      pw,
      ph,
      12,
      () => ({
        ...at(0.7),
        size: r() < 0.55 ? "whole" : r() < 0.85 ? "half" : "chunk",
        lie: r() < 0.9 ? "bed" : "edge",
        gap: 0.6,
      }),
      r,
      { st },
    ),
    ...lay(
      pw,
      ph,
      7,
      () => ({
        ...at(0.45),
        size: r() < 0.5 ? "whole" : r() < 0.8 ? "half" : "chunk",
        lie: "bed",
      }),
      r,
      { st, stack: true, low: 1, high: 8 },
    ),
    ...lay(
      pw,
      ph,
      3,
      () => ({
        ...at(0.25),
        size: r() < 0.5 ? "half" : "chunk",
        lie: "bed",
      }),
      r,
      { st, stack: true, low: 5, high: 11 },
    ),
  ];
  /* roof: the roof over the wall's end came down too (the owner's, Nov 20 18:51Z): a few lengths of its red band and
     chunks of its grey slab among the bricks, and a long red strip of the band lying across them */
  if (roof)
    heap.push(
      ...lay(
        pw,
        ph,
        3,
        (i) => ({
          ...at(0.85),
          size: i < 1 ? "fascia" : "slab",
          lie: "bed",
        }),
        r,
        { st, stack: true, high: 16, tries: 400 },
      ),
      ...lay(pw, ph, 1, () => ({ ...at(0.35), size: "strip", lie: "bed" }), r, {
        st,
        stack: true,
        low: 2,
        high: 14,
        tries: 300,
      }),
    );
  const strays = lay(
    pw,
    ph,
    4,
    () => ({
      x: pw * (0.45 + r() * 0.5),
      y: 4 + r() * (ph - 8),
      size: r() < 0.5 ? "half" : "chunk",
      lie: "bed",
      gap: 3,
    }),
    r,
  ).filter((b) => !heap.some((o) => near(o.foot, b.foot, 2)));
  const crumbs = crumbsOf(r, 14, () => [r() * pw * 0.8, 2 + r() * (ph - 4)]);
  return `<svg class="hg" viewBox="0 ${-up} ${w} ${d + up}" width="${w}" height="${d + up}" overflow="visible" aria-hidden="true">${draw(pw, ph, [...heap, ...strays], crumbs, pu, r)}</svg>`;
}
