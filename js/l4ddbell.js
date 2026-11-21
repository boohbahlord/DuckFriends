/* ---------- Downpour: the church bell and the roof's flare, as each round starts (the owner's, Nov 17 12:28Z) ----------
   One mechanic of Downpour's (l4dd.js draws them each frame there, and its dark lights the flare's glow: flareOn)
   The bell swings to its own strikes (l4ddsfx.js bellStrikes: when each sounds): out to one side on a strike, through
   the middle and out to the other on the next, settling after the last. Its drawing is one of BELL_ANGLES, the nearest */
import { BELL_ANGLES, BELL_REST } from "./hangout/stationart.js";
import { FLARE, STATION } from "./hangout/stationmap.js";
import { bellStrikes } from "./l4ddsfx.js";
import { gridPx } from "./pixel.js";
import { fxSparks, fxSteam } from "./fx.js";

const SWING = 30, // degrees out at a strike
  SWING_IN = 0.6, // strikes' gaps it takes to swing all the way out
  SWING_OUT = 1.2; // how fast it settles after the last (larger: sooner)
let bellEl = null,
  bellLook = 0;
export function bellSwing(ctx, now) {
  if (!bellEl || !bellEl.isConnected) {
    if (now - bellLook < 500) return; // (only made while the tower is near the view: world.js)
    bellLook = now;
    bellEl = ctx.world.board.querySelector('.hp-tower[data-part="bell"]');
    if (!bellEl) return;
  }
  const t = bellStrikes();
  let a = 0;
  if (t) {
    const gap = (t[t.length - 1] - t[0]) / (t.length - 1),
      u = (now - t[0]) / gap,
      last = t.length - 1,
      k =
        u < 0
          ? 0
          : u < SWING_IN
            ? u / SWING_IN
            : u <= last
              ? 1
              : Math.exp(-(u - last) * SWING_OUT);
    if (k > 0.03) a = SWING * k * Math.cos(Math.PI * u); // (a strike at every whole u: out at one side or the other)
  }
  let best = BELL_REST;
  BELL_ANGLES.forEach((v, i) => {
    if (Math.abs(v - a) < Math.abs(BELL_ANGLES[best] - a)) best = i;
  });
  ctx.world.frameOf(bellEl, best);
}
/* the dead soldier's flare on the gas station's roof lights as the bell starts and burns red a while: a glow, sparks
   and smoke (the light it throws: paint) */
const FLARE_MS = 14000;
let flareEl = null,
  fxAt = 0;
export const flareOn = (now) => {
  const t = bellStrikes();
  return !!t && now >= t[0] && now < t[0] + FLARE_MS;
};
/* the flare's red glow, n pixels across, drawn pixel by pixel: white hot in the middle, red, then a dark red fading
   out (as css's radial-gradient drew it, to its farthest corner); made once for each size */
const FLICK = [0.9, 0.975, 1.05, 0.975],
  FLARE_INK = [
    [0, 255, 236, 220, 0.95],
    [0.05, 255, 236, 220, 0.95],
    [0.13, 255, 52, 36, 0.75],
    [0.38, 210, 10, 10, 0.28],
    [0.68, 210, 10, 10, 0],
  ],
  flarePics = new Map();
function flarePic(n) {
  if (flarePics.has(n)) return flarePics.get(n);
  const c = document.createElement("canvas");
  c.width = c.height = n;
  c.className = "l4-flare-px";
  const x = c.getContext("2d"),
    img = x.createImageData(n, n),
    d = img.data,
    h = n / 2;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const f = Math.hypot(i + 0.5 - h, j + 0.5 - h) / (h * Math.SQRT2);
      let k = 1;
      while (k < FLARE_INK.length - 1 && f > FLARE_INK[k][0]) k++;
      const A = FLARE_INK[k - 1],
        B = FLARE_INK[k],
        t = Math.min(1, Math.max(0, (f - A[0]) / (B[0] - A[0] || 1))),
        a = A[4] + (B[4] - A[4]) * t,
        o = (j * n + i) * 4;
      if (a <= 0) continue;
      for (let q = 1; q < 4; q++)
        d[o + q - 1] = (A[q] * A[4] + (B[q] * B[4] - A[q] * A[4]) * t) / a; // (mixed as css mixes them: by how much is there)
      d[o + 3] = a * 255;
    }
  x.putImageData(img, 0, 0);
  if (flarePics.size > 40) flarePics.clear();
  flarePics.set(n, c);
  return c;
}
export function flareDraw(ctx, now, layer) {
  const Wd = ctx.world,
    on = !Wd.inside && flareOn(now);
  if (!on) {
    if (flareEl && !flareEl.hidden) flareEl.hidden = true;
    return;
  }
  if (!flareEl || !flareEl.isConnected) {
    flareEl = document.createElement("div");
    flareEl.className = "l4-flare";
    flareEl.setAttribute("aria-hidden", "true");
    layer.append(flareEl);
  }
  if (flareEl.hidden) flareEl.hidden = false;
  const p = Wd.toScreen(FLARE.x, FLARE.y, STATION.wall + 4),
    left = (now - bellStrikes()[0]) / FLARE_MS; // (0 lit … 1 out)
  flareEl.style.transform = Wd.boxTr(p.left, p.top);
  /* its glow, flickering a little bigger and smaller each 60 ms, as pixels of the grid's size */
  const g = gridPx() || 2,
    n = Math.max(
      2,
      Math.round((160 * Wd.sc * FLICK[Math.floor(now / 60) % 4]) / g),
    ),
    pic = flarePic(n);
  if (flareEl.firstChild !== pic) {
    flareEl.replaceChildren(pic);
    pic.style.cssText = `left:${(-n * g) / 2}px;top:${(-n * g) / 2}px;width:${n * g}px;height:${n * g}px`;
  }
  flareEl.style.setProperty(
    "--f",
    (left > 0.85 ? (1 - left) / 0.15 : 1).toFixed(2),
  ); // (dying down at the end)
  flareEl.style.zIndex = Math.round(STATION.y1) + 60; // (over the roof it lies on: world.js gives the roof its south edge, and a little)
  if (now - fxAt > 70 && left < 0.92) {
    fxAt = now;
    fxSparks(p.left, p.top, 2 * Wd.sc, 1);
    if (Math.random() < 0.35) fxSteam(p.left, p.top - 6 * Wd.sc);
  }
}
/* a new board: the bell and the flare found and made again on it */
export function bellReset() {
  bellEl = flareEl = null;
}
