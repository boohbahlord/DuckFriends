/* ---------- a pool of blood: the one under every duck that dies, Justin and Downpour's dead ----------
   The owner's, Nov 17 18:05Z: "on death a blood pool spreads"; Nov 18 10:38Z: "every player duck that dies in any game
   mode has a puddle of blood start to spill out beneath their duck like justin's". One picture for all of them
   (game.js .gduck-pool, l4dd.js .l4-jpool, hangout/characters.js Justin's), made into pixels once for each size it shows
   (pixel.js pxSVG) while the game loads (warmPool). Before, each was a drawing pxdom.js made into pixels the moment a
   duck fell, mid-game (the owner's, Nov 20 20:46Z: "pop-ins") */
import { JUSTIN_POOL } from "./hangout/stationart.js";
import { pxSVG, rasterReady, pixelOn } from "./pixel.js";
import { hashText } from "./pxdom.js";

export const JPOOL = { ms: 6000 }; // (how long it takes to spread)
// (its shapes: stationart.js JUSTIN_POOL, the trooper in the gas station lies in the same)
const POOL = `<svg viewBox="-60 -26 120 52" xmlns="http://www.w3.org/2000/svg" width="120" height="52">${JUSTIN_POOL}</svg>`;

/* the pool under duck element d while `on` (it's dead, and bleeds), its body lying (x, y) css px from its feet: growing
   over JPOOL.ms from when it fell, gone when it's up again. A duck `size` css px (css .gduck-pool: 1.875 ducks wide) */
export function poolUnder(d, on, now, size, x, y) {
  if (!on) {
    if (d._pool) {
      d._pool.remove();
      d._pool = null;
    }
    return;
  }
  if (!d._pool) {
    d._pool = document.createElement("span");
    d._pool.className = "gduck-pool";
    d._pool.setAttribute("aria-hidden", "true");
    d._pool.innerHTML = poolHTML(size * 1.875);
    d.prepend(d._pool);
    d._poolAt = now;
    d._poolK = "";
  }
  const k = Math.min(1, (now - d._poolAt) / JPOOL.ms),
    grow = 0.15 + 0.85 * (1 - (1 - k) * (1 - k)),
    pk = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${grow.toFixed(3)})`;
  if (d._poolK !== pk) {
    d._poolK = pk;
    d._pool.style.transform = pk;
  }
}
/* the pool, w css px wide (its height from its own: 52 / 120) */
export const poolHTML = (w) => pxSVG(POOL, w);
/* the pool at w css px made into pixels now (while a game loads: pixel.js holds its loading screen) */
const warm = new Set();
export function warmPool(w) {
  if (!pixelOn() || warm.has(w)) return;
  warm.add(w);
  rasterReady("s" + hashText(POOL), POOL, w, (w * 52) / 120); // (pxSVG's key)
}
