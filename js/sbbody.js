/* ---------- Sandbox: an NPC's body, where it can be hit (the owner's, Nov 19 15:47Z) ----------
   "The hitbox of the cropped image is it's image, not the parts that dont exist": an NPC is hit only where its picture
   shows. A cropped picture only where it is, a picture with its background erased only on what's left, a duck or a
   zombie only on its drawing (never its shadow). Each picture's shape is made once (which of its squares show, SQ to a
   duck's width) and every hit on a Sandbox NPC is tested against it, at the NPC's size (its spawn's Size, o.sz), its
   Seriat hitbox (o.hb, sbnumberat.js) and turned the way it faces (o.f). Until its shape is made, its whole box counts.
   Its shape stands up from its feet, as it's drawn: in duck widths, u across and v down the screen. du turns those into
   the place's own units (the board's shares, or the world's px): [a, b, c, d], one duck width across the screen is
   (a, b) there and one down is (c, d). On the board that's as the one who hits sees it (each screen sends its own:
   game.js sendDu, s.sb.du); on Duck Cabin and the zombie maps a duck width is 64 of the world's px everywhere. */
import { npcBox, npcPics, npcShape } from "./sbnpcart.js";

const SQ = 24, // squares to a duck's width
  FAR = 8; // (duck widths: nothing reaches farther, so nothing farther is looked at)
const SHAPES = new Map(); // key -> { mw, mh, a (1: that square shows), b (a, a square wider each way: a shot's width), pts } or 0 while made

/* a picture's shape, mw × mh squares (drawn as its box shows it: stretched to it) */
function make(k, url, mw, mh) {
  SHAPES.set(k, 0);
  if (typeof Image === "undefined" || !url) return;
  const img = new Image();
  img.src = url;
  img
    .decode()
    .then(() => {
      const c = document.createElement("canvas");
      c.width = mw;
      c.height = mh;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(img, 0, 0, mw, mh);
      const d = x.getImageData(0, 0, mw, mh).data,
        a = new Uint8Array(mw * mh),
        b = new Uint8Array(mw * mh),
        pts = [];
      for (let j = 0; j < mh; j++)
        for (let i = 0; i < mw; i++)
          if (d[(j * mw + i) * 4 + 3] > 100) {
            a[j * mw + i] = 1;
            pts.push((i + 0.5) / mw, (j + 0.5) / mh); // (its middle, in shares of the box)
            for (let y = Math.max(0, j - 1); y <= Math.min(mh - 1, j + 1); y++)
              for (
                let q = Math.max(0, i - 1);
                q <= Math.min(mw - 1, i + 1);
                q++
              )
                b[y * mw + q] = 1;
          }
      if (SHAPES.size > 400) SHAPES.clear(); // (pictures change: only the newest few hundred kept)
      SHAPES.set(k, { mw, mh, a, b, pts: Float32Array.from(pts) });
    })
    .catch(() => SHAPES.delete(k)); // (tried again at the next hit)
}

/* a body: its box w × h in duck widths, feet down from its top, the way it faces (f), its shape sh ({ k, url() }) made
   mw × mh squares (null: not made yet) */
function bodyFrom(sh, w, h, feet, f, mw, mh) {
  const m = SHAPES.get(sh.k);
  if (m === undefined) make(sh.k, sh.url(), Math.max(1, mw), Math.max(1, mh));
  return { w, h, feet, f: f < 0 ? -1 : 1, m: m || null };
}
/* o's body now: its box in duck widths round its feet, the way it faces, its shape (null: not made yet) */
export function bodyOf(s, o) {
  if (s && s.sbpic) npcPics(s.sbpic);
  const box = npcBox(o),
    k = ((o.sz || 1) * (o.hb || 1)) / 64;
  return bodyFrom(
    npcShape(o),
    box.w * k,
    box.h * k,
    box.feet * k,
    o.f,
    Math.round((box.w / 64) * SQ),
    Math.round((box.h / 64) * SQ),
  );
}
/* the square of its box under (u, v), as [i, j], or null when (u, v) is off its box */
function cell(B, u, v) {
  const x = (B.f < 0 ? -u : u) + B.w / 2,
    y = v + B.feet;
  if (x < 0 || y < 0 || x >= B.w || y >= B.h) return null;
  return B.m
    ? [Math.floor((x / B.w) * B.m.mw), Math.floor((y / B.h) * B.m.mh)]
    : [0, 0];
}
/* does (u, v) land on it (wide: the shape a square wider, a shot's) */
function on(B, u, v, wide) {
  const c = cell(B, u, v);
  if (!c) return false;
  if (!B.m) return true;
  return (wide ? B.m.b : B.m.a)[c[1] * B.m.mw + c[0]] === 1;
}
/* the point of it nearest (u, v) that shows, [u, v], or null when it's out of reach */
function nearest(B, u, v) {
  const x0 = -B.w / 2,
    y0 = -B.feet,
    out = Math.hypot(
      Math.max(x0 - u, 0, u - (x0 + B.w)),
      Math.max(y0 - v, 0, v - (y0 + B.h)),
    );
  if (out > FAR) return null;
  if (!B.m)
    return [
      Math.min(x0 + B.w, Math.max(x0, u)),
      Math.min(y0 + B.h, Math.max(y0, v)),
    ];
  const P = B.m.pts;
  let best = null,
    bd = Infinity;
  for (let i = 0; i < P.length; i += 2) {
    const pu = (P[i] * B.w - B.w / 2) * B.f,
      pv = P[i + 1] * B.h - B.feet,
      d = (pu - u) * (pu - u) + (pv - v) * (pv - v);
    if (d < bd) {
      bd = d;
      best = [pu, pv];
    }
  }
  return best;
}
/* where along the line from (u0, v0) to (u1, v1) it first meets it, 0 … 1, or -1: only the part of the line over its
   box (a square wider), in steps of half a square */
function along(B, u0, v0, u1, v1) {
  const sq = B.m ? B.w / B.m.mw : B.w / SQ,
    du = u1 - u0,
    dv = v1 - v0;
  let ta = 0,
    tb = 1;
  for (const [p, q] of [
    [-du, u0 - (-B.w / 2 - sq)],
    [du, B.w / 2 + sq - u0],
    [-dv, v0 - (-B.feet - sq)],
    [dv, B.h - B.feet + sq - v0],
  ]) {
    if (p === 0) {
      if (q < 0) return -1; // (beside it all the way)
    } else {
      const r = q / p;
      if (p < 0) ta = Math.max(ta, r);
      else tb = Math.min(tb, r);
    }
  }
  if (ta > tb) return -1;
  const n = Math.min(
    2000,
    Math.ceil((Math.hypot(du, dv) * (tb - ta)) / (sq / 2)) + 1,
  );
  for (let i = 0; i <= n; i++) {
    const t = ta + ((tb - ta) * i) / n;
    if (on(B, u0 + du * t, v0 + dv * t, true)) return t;
  }
  return -1;
}

/* ---------- in the place's own units ---------- */
/* a duck width on the board when the one who hits hasn't said (a computer's screen): game.js sendDu */
export const DU_BOARD = [0.077, 0, 0, 0.2];
/* … and in Duck Cabin's and the zombie maps' world, px */
export const DU_WORLD = [64, 0, 0, 64];
/* duck widths from o's feet to (x, y) */
function toBody(o, x, y, du) {
  const [a, b, c, d] = du,
    det = a * d - b * c || 1,
    dx = x - o.x,
    dy = y - o.y;
  return [(d * dx - c * dy) / det, (a * dy - b * dx) / det];
}
const fromBody = (o, u, v, du) => ({
  x: o.x + du[0] * u + du[2] * v,
  y: o.y + du[1] * u + du[3] * v,
});
/* o as something to hit: at(x, y) its nearest point that shows (to test reach from there), or null out of reach;
   line(x0, y0, x1, y1) where a shot along it meets it (0 … 1), or -1. up: how high over the ground (x, y) the hit
   really is, in duck widths (a swing from the hand, a shot at the height it flies: as the screens draw them), so a
   picture that only shows up high is hit up high */
export function npcBody(s, o, du) {
  let B = null;
  return target(o, () => B || (B = bodyOf(s, o)), du); // (worked out once it's asked: most aren't)
}
/* a player whose own picture is a cut-out (a cropped picture, or one erased before it was uploaded: Customize, duck.js
   cut): hit only where it shows, as an NPC's picture is (the owner's, Nov 20: "a custom image upload is made for an
   enemy target, right? In which cropped images can also be used for players' custom avatars"). p: where it stands, and
   the way it faces (p.f: rules.js move); url: its picture; big: its size (duck.js duckBig). Its picture is drawn in the
   duck's square as duck.js draws it: 92 of the duck's 120 across, its top 10 down, its feet at 110; z: how much bigger
   a thin or sparse one is drawn (duck.js picGrow), its bottom where it was */
const PIC = { w: 92 / 120, h: 92 / 120, feet: 100 / 120 };
const KEYS = new Map();
export function picBody(p, url, big, du, z = 1) {
  let k = KEYS.get(url);
  if (!k) {
    let h = 0;
    for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0;
    k = "p" + (h >>> 0).toString(36) + url.length;
    if (KEYS.size > 200) KEYS.clear();
    KEYS.set(url, k);
  }
  let B = null;
  return target(
    p,
    () =>
      B ||
      (B = bodyFrom(
        { k, url: () => url },
        PIC.w * big * z,
        PIC.h * big * z,
        (PIC.h * z + PIC.feet - PIC.h) * big,
        p.f,
        Math.round(PIC.w * SQ),
        Math.round(PIC.h * SQ),
      )),
    du,
  );
}
/* a duck width in the rules' own units, from their duck's room [rx, ry] (rules.js: a hit's reach, 1 of it), as the
   board's DU_BOARD is to its [0.03, 0.08] */
export const duOfRoom = (rx, ry) => [rx * (0.077 / 0.03), 0, 0, ry * 2.5];
/* something to hit at o (its feet), body() its body */
function target(o, body, du) {
  return {
    at(x, y, up = 0) {
      const [u, v] = toBody(o, x, y, du),
        p = nearest(body(), u, v - up);
      return p && fromBody(o, p[0], p[1] + up, du); // (put back down by as much: the distance is the hand's)
    },
    line(x0, y0, x1, y1, up = 0) {
      const [u0, v0] = toBody(o, x0, y0, du),
        [u1, v1] = toBody(o, x1, y1, du);
      return along(body(), u0, v0 - up, u1, v1 - up);
    },
  };
}
/* the board's duck width for player id (what their screen sent), or a computer's */
export const duOf = (s, id) =>
  (s && s.sb && s.sb.du && s.sb.du[id]) || DU_BOARD;
