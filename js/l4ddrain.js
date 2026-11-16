/* ---------- Downpour's rain (Dead Ducks Arcade's second map) ----------
   The owner's map is night in heavy rain. One canvas over the board, just over the dark (so the rain shows faintly
   everywhere, brighter in a flashlight's or a lamp's light, as rain does), under the HUD:
     - streaks falling, slanted with the wind, as many as the screen is wide;
     - drops landing: a short ring on the ground, wider and slower on the water (the flood over the road, puddles);
     - ripples round everyone wading in the flood (my duck, the others, the zombies), as they move.
   Inside the gas station or the chapel there is no rain, only its sound later. Low graphics or Data saving: a third
   of the drops; Animations off (html.still): none. I want it cheap: a few hundred short lines a frame, no images. */
import { low } from "./gfx.js";
import { inShallow, inDeep, CANOPY } from "./hangout/stationmap.js";

let cv = null,
  g = null,
  drops = [],
  rings = [],
  wades = new Map(), // who → [x, y] where its last ripple was
  last = 0,
  wasW = 0;
const WIND = 0.22; // the slant: across for each px down
const FALL = 1500; // css px a second (about; each drop a little faster or slower)

export function rainMount(board) {
  cv = document.createElement("canvas");
  cv.className = "l4-rain";
  cv.setAttribute("aria-hidden", "true");
  board.querySelector(".l4-dark")?.after(cv) || board.append(cv);
  g = cv.getContext("2d");
  drops = [];
  rings = [];
  wades.clear();
  last = 0;
  wasW = 0;
}
export function rainUnmount() {
  cv?.remove();
  cv = g = null;
  drops = [];
  rings = [];
  wades.clear();
}
/* every frame from l4dd.js: who: [[id, x, y]] in world px (ducks and zombies on the ground), on: it's Downpour */
export function rainDraw(now, ctx, who, on) {
  if (!cv) return;
  const Wd = ctx.world,
    still = document.documentElement.classList.contains("still");
  if (!on || still || Wd.inside || !Wd.vw) {
    if (!cv.hidden) cv.hidden = true;
    last = now;
    return;
  }
  if (cv.hidden) cv.hidden = false;
  const w = Wd.vw,
    h = Wd.vh,
    dpr = Math.min(1.5, devicePixelRatio || 1);
  if (w !== wasW || cv.height !== Math.round(h * dpr)) {
    wasW = w;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
  }
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
  last = now;
  /* the streaks: as many as the screen is wide, a third with Low graphics */
  const want = Math.round((w / 6) * (low() ? 0.35 : 1));
  while (drops.length < want)
    drops.push(
      newDrop(w, h, drops.length < want / 2 ? Math.random() * h : -20),
    );
  if (drops.length > want) drops.length = want;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.lineCap = "round";
  g.strokeStyle = "rgba(190,210,235,0.32)";
  g.lineWidth = 1.2;
  g.beginPath();
  for (const d of drops) {
    d.y += d.v * dt;
    d.x += d.v * WIND * dt;
    if (d.y > d.end) {
      // landed: a ring where it hit (the ground under that spot of the screen)
      if (Math.random() < (low() ? 0.15 : 0.35)) splash(d.x, d.end, Wd, now);
      Object.assign(d, newDrop(w, h, -20 - Math.random() * 60));
      continue;
    }
    g.moveTo(d.x, d.y);
    g.lineTo(d.x - d.l * WIND, d.y - d.l);
  }
  g.stroke();
  /* ripples round whoever wades through the flood (one each time it has moved a little) */
  for (const [id, x, y] of who) {
    if (!(inShallow(x, y) || inDeep(x, y))) {
      wades.delete(id);
      continue;
    }
    const p = wades.get(id);
    if (p && Math.hypot(x - p[0], y - p[1]) < 26) continue;
    wades.set(id, [x, y]);
    rings.push({ x, y, t: now, life: 900, r: 34, water: true, world: true });
  }
  if (wades.size > 400) wades.clear();
  /* the rings, in world px (they stay put as the camera moves) */
  const sc = Wd.sc;
  g.lineWidth = 1.4;
  rings = rings.filter((o) => now - o.t < o.life);
  for (const o of rings) {
    const u = (now - o.t) / o.life,
      p = Wd.toScreen(o.x, o.y, o.world ? Wd.heightAt(o.x, o.y) : 0),
      r = o.r * (0.25 + u) * sc;
    if (p.left < -60 || p.left > w + 60 || p.top < -60 || p.top > h + 60)
      continue;
    g.strokeStyle = o.water
      ? `rgba(170,200,215,${(0.42 * (1 - u)).toFixed(3)})`
      : `rgba(170,190,205,${(0.3 * (1 - u)).toFixed(3)})`;
    g.beginPath();
    g.ellipse(p.left, p.top, r, r * 0.42, 0, 0, 2 * Math.PI);
    g.stroke();
  }
}
function newDrop(w, h, y) {
  const v = FALL * (0.8 + Math.random() * 0.4);
  return {
    x: -h * WIND * 0.5 + Math.random() * (w + h * WIND * 0.5),
    y,
    v,
    l: 14 + Math.random() * 14,
    end: h * (0.15 + Math.random() * 0.85), // (where on the screen it reaches the ground)
  };
}
/* a drop landing at screen (sx, sy): its ring in world px, bigger on the water */
function splash(sx, sy, Wd, now) {
  const o = Wd.toScreen(0, 0, 0), // (back from the screen to the world: where the world's corner shows)
    wx = (sx - o.left) / Wd.sc,
    wy = (sy - o.top) / Wd.sc,
    water = inShallow(wx, wy) || inDeep(wx, wy);
  if (wx > CANOPY.x0 && wx < CANOPY.x1 && wy > CANOPY.y0 && wy < CANOPY.y1)
    return; // (under the canopy over the pumps it's dry)
  rings.push({
    x: wx,
    y: wy,
    t: now,
    life: water ? 650 : 320,
    r: water ? 16 : 7,
    water,
  });
  if (rings.length > 260) rings.splice(0, rings.length - 260);
}
