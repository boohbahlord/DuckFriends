/* ---------- Euclid's Squares (id: euclid) ----------
   A mosaic of squares from Euclid's algorithm, the owner's idea after the picture in notes/ref/mosaic-map-inspiration.png:
   a rectangle gets the biggest square that fits (as many times as it fits), and the strip left over gets the same rule,
   around and around like a spiral, until nothing is left. Near the three points, a square is cut a tiny bit off center
   into two rectangles, and each of those gets the same rule again, so the squares keep shrinking into those points.
   Bright reds, oranges, yellows, blues, purples, greens, white, grey and brown, each square edged by a thin dark line.
   The whole page is one rectangle, so every screen gets its own tiling by the same rule; the colors come from where
   each square sits, so the same screen always shows the same picture. Drawn once on a canvas whenever the page
   changes size. */

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

/* draws the tiling of a W by H page onto a canvas k times as big (k: the screen's pixels for each px) */
function paint(cv, W, H, k) {
  const g = cv.getContext("2d"),
    all = euclidSquares(W, H);
  g.setTransform(k, 0, 0, k, 0, 0);
  g.fillStyle = LINE;
  g.fillRect(0, 0, W, H);
  /* each square inside its line: the line is 1 px (half on each side), so a square shows only what's inside it */
  const lw = Math.max(1 / k, 1);
  for (const [x, y, s] of all) {
    const inner = s - lw;
    if (inner <= 0.25) continue; // (a square that small is all line)
    g.fillStyle = colorAt(x, y, s);
    g.fillRect(x + lw / 2, y + lw / 2, inner, inner);
  }
  return all.length;
}

/* the map: its canvas over the whole page, drawn again when the page changes size */
export function euclidScene(layer) {
  const sc = document.createElement("div"),
    html = document.documentElement;
  sc.className = "scene euclid";
  layer.append(sc);
  let drawn = "",
    timer = 0;
  const draw = () => {
    const W = layer.clientWidth,
      H = layer.clientHeight;
    if (!W || !H) return;
    const lite = html.classList.contains("low"),
      k = Math.min(lite ? 1 : 2, devicePixelRatio || 1),
      key = W + "x" + H + "@" + k;
    if (key === drawn) return;
    drawn = key;
    const cv = document.createElement("canvas");
    cv.width = Math.round(W * k);
    cv.height = Math.round(H * k);
    cv.className = "eu-pic";
    paint(cv, W, H, k);
    const old = sc.querySelector("canvas.eu-pic");
    sc.prepend(cv);
    if (old) old.remove();
  };
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(draw, drawn ? 200 : 0);
  });
  ro.observe(layer);
  draw();
  return {
    update() {},
    destroy() {
      clearTimeout(timer);
      ro.disconnect();
      sc.remove();
    },
  };
}

/* the small picture for the Map window and the lobby's picture: the real drawing, 16 : 9, made once */
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
export const euclidMini = () =>
  `<img src="${euclidMiniURL()}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`;
