/* ---------- Downpour's rain (Dead Ducks Arcade's second map) ----------
   The owner's map is night in heavy rain. One canvas over the board, just over the dark (so the rain shows faintly
   everywhere, brighter in a flashlight's or a lamp's light, as rain does), under the HUD:
     - streaks falling, slanted with the wind, as many as the screen is wide;
     - drops landing: a short ring on the ground, wider and slower on the water (the flood over the road, puddles);
     - ripples round everyone wading in the flood (my duck, the others, the zombies), as they move.
   Inside the gas station or the chapel there is no rain, only its sound later. Low graphics or Data saving: a third
   of the drops; Animations off (html.still): none. I want it cheap: a few hundred short lines a frame, no images. */
import { low } from "./gfx.js";
import { gridPx } from "./pixel.js";
import { inShallow, inDeep, CANOPY } from "./hangout/stationmap.js";

let cv = null,
  g = null,
  drops = [],
  rings = [],
  wades = new Map(), // who → [x, y] where its last ripple was
  last = 0,
  wasW = 0,
  bolt = null; // (the lightning on screen: newBolt)
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
/* every frame from l4dd.js: who: [[id, x, y]] in world px (ducks and zombies on the ground), on: it's Downpour, hit:
   the lightning's last strike [x, y, when] while it's fresh (l4ddrules.js boltTick) */
export function rainDraw(now, ctx, who, on, hit) {
  if (!cv) return;
  const Wd = ctx.world,
    still = document.documentElement.classList.contains("still");
  if (!on || still || Wd.inside || !Wd.vw) {
    if (!cv.hidden) cv.hidden = true;
    last = now;
    return;
  }
  if (cv.hidden) cv.hidden = false;
  if (hit && (!bolt || bolt.when !== hit[2])) bolt = newBolt(hit, now);
  const w = Wd.vw,
    h = Wd.vh,
    dpr = 1 / gridPx(); // (one of its pixels one of the grid's, as the map's: the owner's one pixel size, Nov 17)
  if (w !== wasW || cv.height !== Math.round(h * dpr)) {
    wasW = w;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    cv.style.imageRendering = "pixelated";
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
  g.lineCap = "butt"; // (a pixel wide: round ends look the same and cost more)
  g.strokeStyle = "rgba(190,210,235,0.32)";
  g.lineWidth = Math.max(1.2, gridPx()); // (a pixel wide at least)
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
    rings.push({
      x,
      y,
      z: Wd.heightAt(x, y),
      t: now,
      life: 900,
      r: 34,
      water: true,
    }); // (its ground's height once, not every frame)
  }
  if (wades.size > 400) wades.clear();
  /* the rings, in world px (they stay put as the camera moves). Drawn in a few strokes, not one each: the rings of a
     kind and nearly the same fade go in one path (RING_STEPS steps of fading, as smooth to the eye) */
  const sc = Wd.sc;
  if (bolt) drawBolt(now, Wd, w, h);
  g.lineWidth = Math.max(1.4, gridPx());
  let n = 0;
  for (const o of rings) if (now - o.t < o.life) rings[n++] = o;
  rings.length = n;
  for (const water of [false, true]) {
    const paths = RING_STYLE[water ? 1 : 0];
    let used = 0;
    for (const o of rings) {
      if (o.water !== water) continue;
      const u = (now - o.t) / o.life,
        p = Wd.toScreen(o.x, o.y, o.z),
        r = o.r * (0.25 + u) * sc;
      if (p.left < -60 || p.left > w + 60 || p.top < -60 || p.top > h + 60)
        continue;
      const k = Math.min(RING_STEPS - 1, Math.floor(u * RING_STEPS));
      if (!(used & (1 << k))) {
        used |= 1 << k;
        paths[k].p = new Path2D();
      }
      paths[k].p.moveTo(p.left + r, p.top); // (each its own ring, no line from the last one)
      paths[k].p.ellipse(p.left, p.top, r, r * 0.42, 0, 0, 2 * Math.PI);
    }
    for (let k = 0; k < RING_STEPS; k++)
      if (used & (1 << k)) {
        g.strokeStyle = paths[k].c;
        g.stroke(paths[k].p);
        paths[k].p = null;
      }
  }
}
/* the rings' colors, by kind (ground, water) and by how far they have faded */
const RING_STEPS = 8,
  RING_STYLE = [
    [170, 190, 205, 0.3],
    [170, 200, 215, 0.42],
  ].map(([r, gr, b, a]) =>
    Array.from({ length: RING_STEPS }, (_, k) => ({
      c: `rgba(${r},${gr},${b},${(a * (1 - (k + 0.5) / RING_STEPS)).toFixed(3)})`,
      p: null,
    })),
  );
/* the lightning: a jagged line from the sky down to the zombie it hits, with a branch or two, that blinks twice, and the
   whole screen flashing white and fading. Its kinks are kept in world px across (dx) and screen px up, so it stays on
   the zombie as the camera moves */
const BOLT_MS = 260,
  FLASH_MS = 700;
function newBolt(hit, now) {
  const [x, y, when] = hit,
    path = (from, n, up, spread) => {
      const pts = [];
      for (let k = 0; k <= n; k++)
        pts.push([
          from[0] + (k && k < n ? (Math.random() - 0.5) * spread : 0),
          from[1] + (up * k) / n,
        ]);
      return pts;
    },
    main = path([0, 0], 16, 900, 90);
  for (let k = 1; k < main.length; k++) main[k][0] += main[k - 1][0] * 0.35; // (it wanders a little as it comes down)
  const forks = [];
  for (let f = 0; f < 1 + Math.floor(Math.random() * 2); f++) {
    const at = main[8 + Math.floor(Math.random() * 6)],
      side = Math.random() < 0.5 ? -1 : 1;
    forks.push(
      path(at, 6, -90 - Math.random() * 90, 40).map(([a, b], k) => [
        a + side * k * 30,
        b,
      ]),
    );
  }
  return { x, y, when, t: now, lines: [main, ...forks] };
}
function drawBolt(now, Wd, w, h) {
  const u = now - bolt.t;
  if (u > FLASH_MS) {
    bolt.t = -1e9;
    return;
  }
  g.fillStyle = `rgba(225,235,255,${(0.5 * (1 - u / FLASH_MS) ** 2).toFixed(3)})`;
  g.fillRect(0, 0, w, h);
  if (u > BOLT_MS || (u > 90 && u < 140)) return; // (it blinks once)
  const p = Wd.toScreen(bolt.x, bolt.y, Wd.heightAt(bolt.x, bolt.y)),
    sc = Wd.sc;
  for (const [lw, c] of [
    [7, "rgba(150,180,255,0.35)"],
    [2.4, "rgba(250,252,255,0.95)"],
  ]) {
    g.lineWidth = lw;
    g.strokeStyle = c;
    g.beginPath();
    for (const line of bolt.lines)
      line.forEach(([a, b], k) =>
        g[k ? "lineTo" : "moveTo"](p.left + a * sc, p.top - b * sc * 1.2),
      );
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
    z: 0,
    t: now,
    life: water ? 650 : 320,
    r: water ? 16 : 7,
    water,
  });
  if (rings.length > 260) rings.splice(0, rings.length - 260);
}
