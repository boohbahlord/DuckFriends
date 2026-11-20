/* ---------- Euclid's Squares (id: euclid) ----------
   A mosaic of squares from Euclid's algorithm, the owner's idea after the picture in notes/ref/mosaic-map-inspiration.png:
   a rectangle gets the biggest square that fits (as many times as it fits), and the strip left over gets the same rule,
   around and around like a spiral, until nothing is left. Near the three points, a square is cut a tiny bit off center
   into two rectangles, and each of those gets the same rule again, so the squares keep shrinking into those points.
   Bright reds, oranges, yellows, blues, purples, greens, white, grey and brown, each square edged by a thin dark line.
   The world (a computer's 1366 × 768 page) is one rectangle; the colors come from where each square sits, so everyone
   sees the same picture. Drawn once by code straight in the world's pixels (two px to a pixel), each square's line one
   pixel; a narrower screen (a phone) sees the slice round the points (js/pxmap.js).
   With the endless zoom (the Zoom entry of Vote Maps and Random, or the map's Zoom setting), the camera keeps going
   into the first point, forever: the tiny squares grow, and new ones keep showing up inside them (zoomer below). */

import { mountWorld } from "./pxmap.js";

/* the world: its size in px, two px to each of its pixels */
const WORLD = { W: 1366, H: 768, G: 2 };

/* the three points the squares shrink into, as parts of the page's width and height (as in the owner's picture) */
const POINTS = [
  [0.53, 0.4],
  [0.82, 0.38],
  [0.75, 0.5],
];
/* a square is cut again while it is bigger than this many times its distance from the nearest point */
const CLOSE = 0.85;
/* how far off center a cut goes: the first part of the square is this much of it (so each part's sides are a tiny bit
   off from a whole number of squares, and Euclid's rule makes rows of smaller ones) */
const CUTS = [5 / 9, 4 / 7, 6 / 11, 7 / 12, 8 / 13];
/* the smallest square that is still cut, in px */
const SMALLEST = 2.4;

/* the colors, picked from the owner's picture, each with how often it comes up */
const COLORS = [
  ["#0075ff", 9], // blue
  ["#36a7d3", 8], // steel blue
  ["#2ab9fd", 8], // sky blue
  ["#ff3e15", 7], // red
  ["#ff3246", 4], // crimson
  ["#ffc100", 6], // yellow
  ["#ff8e01", 5], // orange
  ["#01be24", 5], // green
  ["#c257ff", 5], // purple
  ["#4c56ff", 4], // indigo
  ["#02bdd0", 3], // teal
  ["#fffdff", 4], // white
  ["#5e5e5e", 4], // grey
  ["#aa7c4a", 4], // brown
];
const BAG = COLORS.flatMap(([c, n]) => Array(n).fill(c));
const LINE = "#16161c";

/* every square of the tiling of a W by H page: [x, y, side] */
export function euclidSquares(W, H) {
  const pts = POINTS.map(([px, py]) => [px * W, py * H]),
    out = [];
  /* how far the nearest point is from the square (0 inside it) */
  const gap = (x, y, s) => {
    let d = Infinity;
    for (const [px, py] of pts)
      d = Math.min(
        d,
        Math.hypot(
          Math.max(x - px, 0, px - x - s),
          Math.max(y - py, 0, py - y - s),
        ),
      );
    return d;
  };
  const square = (x, y, s, depth) => {
    if (s < SMALLEST || s <= gap(x, y, s) * CLOSE || depth > 60) {
      out.push([x, y, s]);
      return;
    }
    // a tiny bit off center, across or down (which one, and how far off, from where it sits)
    const k = Math.floor(x * 7 + y * 13) + depth,
      t = CUTS[k % CUTS.length];
    if (k & 1) {
      rule(x, y, s, s * t, depth + 1);
      rule(x, y + s * t, s, s * (1 - t), depth + 1);
    } else {
      rule(x, y, s * t, s, depth + 1);
      rule(x + s * t, y, s * (1 - t), s, depth + 1);
    }
  };
  /* Euclid's rule on a rectangle: the biggest square, as many times as it fits along the long side, then the same on
     what's left; the squares go at one end, then at the other, so they wind inward */
  const rule = (x, y, w, h, depth) => {
    for (let turn = 0; w > 0.4 && h > 0.4 && turn < 400; turn++) {
      const wide = w >= h,
        s = wide ? h : w,
        n = Math.floor((wide ? w : h) / s + 1e-7),
        far = turn & 2; // (turns 0 and 1 start from the left and the top, 2 and 3 from the right and the bottom)
      for (let i = 0; i < n; i++) {
        const at = far ? (wide ? w : h) - (i + 1) * s : i * s;
        square(wide ? x + at : x, wide ? y : y + at, s, depth);
      }
      if (wide) {
        if (!far) x += n * s;
        w -= n * s;
      } else {
        if (!far) y += n * s;
        h -= n * s;
      }
    }
  };
  rule(0, 0, W, H, 0);
  return out;
}

/* a square's color, from where it sits (the same square is always the same color) */
const colorAt = (x, y, s) => {
  let h =
    (Math.imul(Math.round(x * 4) + 7919, 73856093) ^
      Math.imul(Math.round(y * 4) + 104729, 19349663) ^
      Math.imul(Math.round(s * 4) + 1, 83492791)) >>>
    0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  return BAG[h % BAG.length];
};

/* a square inside its line, on whole pixels (k: pixels for each px): its line is the pixel along its left and its top,
   the next squares' lines are its right and its bottom; false if it's all line */
function cell(g, x, y, s, k) {
  const a = Math.round(x * k),
    b = Math.round(y * k),
    w = Math.round((x + s) * k) - a - 1,
    h = Math.round((y + s) * k) - b - 1;
  if (w < 1 || h < 1) return false;
  g.fillRect(a + 1, b + 1, w, h);
  return true;
}

/* draws the tiling of a W by H page onto a canvas k times as big (k: its pixels for each px) */
function paint(cv, W, H, k) {
  const g = cv.getContext("2d"),
    all = euclidSquares(W, H);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = LINE;
  g.fillRect(0, 0, cv.width, cv.height);
  for (const [x, y, s] of all) {
    g.fillStyle = colorAt(x, y, s);
    cell(g, x, y, s, k);
  }
  return all.length;
}

/* ---------- the endless zoom ----------
   The camera goes into the first point, twice as close every ZOOM_TIME seconds, and never stops. Every frame the tiling
   is made again, by the same rule, but only for what's on screen, and a square is cut until it's LEAF px on screen
   (not on the page), so the squares keep coming. Positions are kept from the first point (so they stay exact however
   close we get), and every few steps in, the units grow by a power of 2 (exact: the same squares, the same colors) and
   only the squares still on screen are kept, so a game that zooms for hours costs the same as one that just started. */
const ZOOM_TIME = 5; // seconds to get twice as close
const LEAF = 1.6; // px on screen: a square smaller than this isn't cut

/* a number from two whole numbers and a depth, for the squares too small to sit on the page's own px */
const mix = (a, b, d) => {
  let h =
    (Math.imul(a + 7919, 73856093) ^
      Math.imul(b + 104729, 19349663) ^
      Math.imul(d + 1, 83492791)) >>>
    0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
};

/* the zoom for a W by H page: draw(g, Zs, k) draws it Zs times as close (in the current units), and closer(m) makes the
   units 2^m times smaller once Zs gets big */
function zoomer(W, H) {
  const fx = POINTS[0][0] * W,
    fy = POINTS[0][1] * H,
    others = POINTS.slice(1).map(([px, py]) => [px * W - fx, py * H - fy]);
  let E = 0; // (2^E units make one px of the page as it was at the start)
  /* how far the nearest point is (the first point sits at 0, 0) */
  const gap = (x, y, s) => {
    let d = Math.hypot(Math.max(x, 0, -x - s), Math.max(y, 0, -y - s));
    if (E < 60) {
      const f = 2 ** E;
      for (const [px, py] of others)
        d = Math.min(
          d,
          Math.hypot(
            Math.max(x - px * f, 0, px * f - x - s),
            Math.max(y - py * f, 0, py * f - y - s),
          ),
        );
    }
    return d;
  };
  /* a square as big as a page's px or bigger chooses its cut and color by where it sits on the page, as on the still
     map; a smaller one by where it sits in its own sizes from the point, and how deep it is */
  const onPage = (s) => s * 2 ** -E >= 1;
  const pick = (x, y, s, d) => {
    const u = 2 ** -E;
    return onPage(s)
      ? Math.floor((x * u + fx) * 7 + (y * u + fy) * 13) + d
      : (mix(Math.round((x / s) * 64), Math.round((y / s) * 64), d) % 997) + d;
  };
  const color = (x, y, s, d) => {
    const u = 2 ** -E;
    return onPage(s)
      ? colorAt(x * u + fx, y * u + fy, s * u)
      : BAG[
          mix(Math.round((x / s) * 16), Math.round((y / s) * 16), d) %
            BAG.length
        ];
  };
  /* Euclid's rule on a rectangle, all the way to its end (squares into out) */
  const rule = (x, y, w, h, d, out) => {
    const tiny = Math.max(w, h) * 1e-9;
    for (let turn = 0; w > tiny && h > tiny && turn < 400; turn++) {
      const wide = w >= h,
        s = wide ? h : w,
        n = Math.floor((wide ? w : h) / s + 1e-7),
        far = turn & 2;
      if (n > 4096) break; // (never: the rectangles here end in a few turns)
      for (let i = 0; i < n; i++) {
        const at = far ? (wide ? w : h) - (i + 1) * s : i * s;
        out.push([wide ? x + at : x, wide ? y : y + at, s, d]);
      }
      if (wide) {
        if (!far) x += n * s;
        w -= n * s;
      } else {
        if (!far) y += n * s;
        h -= n * s;
      }
    }
  };
  const kids = ([x, y, s, d]) => {
    const k = pick(x, y, s, d),
      t = CUTS[k % CUTS.length],
      out = [];
    if (k & 1) {
      rule(x, y, s, s * t, d + 1, out);
      rule(x, y + s * t, s, s * (1 - t), d + 1, out);
    } else {
      rule(x, y, s * t, s, d + 1, out);
      rule(x + s * t, y, s * (1 - t), s, d + 1, out);
    }
    return out;
  };
  const cut = ([x, y, s], Zs) => s * Zs >= LEAF && s > gap(x, y, s) * CLOSE;
  /* what the screen shows at Zs, in units: [left, top, right, bottom] */
  const view = (Zs) => [-fx / Zs, -fy / Zs, (W - fx) / Zs, (H - fy) / Zs];
  const seen = ([x, y, s], [l, t, r, b]) =>
    x < r && y < b && x + s > l && y + s > t;
  let roots = [];
  rule(-fx, -fy, W, H, 0, roots);
  return {
    draw(g, Zs, k) {
      const v = view(Zs);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.fillStyle = LINE;
      g.fillRect(0, 0, W * k, H * k);
      const visit = (q) => {
        if (!seen(q, v)) return;
        if (cut(q, Zs)) {
          for (const c of kids(q)) visit(c);
          return;
        }
        const [x, y, s, d] = q,
          inner = s * Zs * k - 1;
        if (inner < 1) return;
        g.globalAlpha = inner < 3 ? inner / 3 : 1; // (the smallest fade in as they grow)
        g.fillStyle = color(x, y, s, d);
        cell(g, fx + x * Zs, fy + y * Zs, s * Zs, k);
      };
      for (const q of roots) visit(q);
      g.globalAlpha = 1;
    },
    closer(m, Zs) {
      const f = 2 ** m,
        v = view(Zs),
        keep = [],
        big = 2 * Math.max(W, H);
      E += m;
      const open = (q) => {
        if (!seen(q, v)) return; // (the screen only gets smaller in units: what's off it now stays off)
        if (q[2] * Zs > big && cut(q, Zs)) kids(q).forEach(open);
        else keep.push(q);
      };
      roots.forEach(([x, y, s, d]) => open([x * f, y * f, s * f, d]));
      roots = keep;
    },
  };
}

/* the map: a canvas of the world's pixels; with the zoom (s.mapZoomed, set by rules.js when the game starts), drawn
   again every frame, closer and closer (still, with "Less motion", it stays the still map; with "Low graphics", fewer
   frames) */
export function euclidScene(layer, s) {
  const sc = document.createElement("div"),
    html = document.documentElement,
    zooms = !!(s && s.mapZoomed),
    { W, H, G } = WORLD,
    k = 1 / G;
  sc.className = "scene euclid" + (zooms ? " zoom" : "");
  layer.append(sc);
  const w = mountWorld(sc, WORLD, {
      fx: zooms ? POINTS[0][0] : 0.64,
      fy: zooms ? POINTS[0][1] : 0.5,
    }), // (a phone: the slice round the points, or round the one the zoom goes into)
    cv = document.createElement("canvas");
  layer.classList.add("px-own"); // (pixels already: the filter leaves it)
  cv.className = "eu-px";
  cv.width = W * k;
  cv.height = H * k;
  w.stage.append(cv);
  paint(cv, W, H, k);
  const z = zooms ? zoomer(W, H) : null;
  let L = 0, // (how many times twice as close we are)
    E = 0, // (the units' power of 2 so far)
    last = 0,
    shown = 0;
  return {
    update() {
      if (!z || html.classList.contains("still")) return;
      const t = performance.now(),
        lite = html.classList.contains("low");
      if (t - shown < (lite ? 66 : 33)) return; // (30 frames a second, 15 with Low graphics)
      L += Math.min(t - (last || t), 100) / 1000 / ZOOM_TIME; // (a hidden tab picks up where it was)
      last = shown = t;
      if (L - E >= 8) {
        const m = Math.floor(L - E);
        E += m;
        z.closer(m, 2 ** (L - E));
      }
      z.draw(cv.getContext("2d"), 2 ** (L - E), k);
    },
    destroy() {
      w.destroy();
      layer.classList.remove("px-own");
      sc.remove();
    },
  };
}

/* the real drawing, 16 : 9, made once: for the map's picture files only (tools/pixel-src/backdrops.js) */
let mini = "";
export function euclidMiniURL() {
  if (!mini) {
    const cv = document.createElement("canvas");
    cv.width = 960;
    cv.height = 540;
    paint(cv, 480, 270, 2);
    mini = cv.toDataURL("image/png");
  }
  return mini;
}
