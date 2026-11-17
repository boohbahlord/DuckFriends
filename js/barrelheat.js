/* ---------- a hot barrel (the owner, Nov 17) ----------
   Guns that fire fast and long (the LMG, the chain gun) heat up as they keep firing: the end of the barrel glows,
   dull red, then red, then orange, hotter and hotter, and cools down slowly once they stop. Every duck's, as each shot
   is seen (game.js calls heatUp next to its kick). The glow is a soft round light at the barrel's end, its color the
   laser gun's hot metal (laserart.js hotColor). */
import { hotColor } from "./laserart.js";

/* how long each gun fires before its barrel is as hot as it gets (s), and how fast it cools. The heat goes by the time
   it keeps firing, not by its shots counted (a slow screen sees only some of them) */
const HOT = { lmg: 4, chaingun: 4 };
const GAP = 0.6; // (s: a longer wait between two shots seen is a pause, not firing)
const COOL = 0.22, // (heat lost a second)
  SHOW = 0.15; // (below this, no glow)
const HEAT = new Map(); // duck id → { h, t }

const heatOf = (id, now) => {
  const o = HEAT.get(id);
  if (!o) return 0;
  const h = Math.max(0, o.h - ((now - o.t) / 1000) * COOL);
  if (!h) HEAT.delete(id);
  return h;
};
/* a shot from duck id's gun */
export function heatUp(id, gun) {
  if (!HOT[gun]) return;
  const now = performance.now(),
    o = HEAT.get(id),
    dt = o && o.gun === gun ? Math.min(GAP, (now - o.t) / 1000) : 0.1;
  HEAT.set(id, {
    h: Math.min(1, heatOf(id, now) + dt / HOT[gun] + dt * COOL),
    t: now,
    gun,
  }); // (the cooling since the last shot is given back: firing, it only heats)
}
/* every frame: a glow at each hot barrel's end. held: duck id → its weapon in hand (game.js; _tip, the chain gun's
   barrel end, or _end), fxl: the layer they're in, size: a duck's size */
const GLOW = new Map(); // duck id → its glow
export function heatDraw(held, fxl, size) {
  const now = performance.now();
  for (const [id, g] of GLOW)
    if (!held.has(id) || g.parentNode !== fxl) {
      g.remove();
      GLOW.delete(id);
    }
  for (const [id, h] of held) {
    const o = HEAT.get(id),
      heat =
        o && h.parentNode === fxl && h.dataset.w === o.gun
          ? heatOf(id, now)
          : 0,
      at = h._tip || h._end;
    let g = GLOW.get(id);
    if (heat < SHOW || !at) {
      if (g) g.hidden = true;
      continue;
    }
    if (!g) {
      g = document.createElement("div");
      g.className = "barrel-heat";
      fxl.append(g);
      GLOW.set(id, g);
    }
    g.hidden = false;
    const r = size * (0.08 + 0.1 * heat);
    g.style.cssText = `transform:translate(${at[0].toFixed(1)}px,${at[1].toFixed(1)}px);width:${(r * 2).toFixed(1)}px;height:${(r * 2).toFixed(1)}px;--c:${hotColor(heat)};opacity:${Math.min(1, (heat - SHOW) * 2.2).toFixed(2)}`;
  }
}
