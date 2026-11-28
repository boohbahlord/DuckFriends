/* ---------- a car pushed: Downpour's cars moved by a blast (B6d) ----------
   The owner's, Nov 21 19:07Z: "for the new physics update, cars can be moved around ... Forget about the trees ... we're
   just worried about that cars can get moved around by enough weight or knockback or power. So like an explosion might
   be able to move it". A car weighs WEIGHT.CAR duck weights (a small 80s or 90s car is about 1,000 kg, some 15 grown-ups),
   so a push moves it far / its weight (push.js pushOn), a step at a time along pushAlong, as long as its whole box
   stands clear (layout.js carClear). Where each car is: s.hang.cars { i: [dx, dy] }, world px from where the map puts it
   (none: there), so every device has it; carsAt(s) moves the map to it (layout.js carAt: its solids, its floor and its
   drawing) and makes again only the walk cells round it (walkgrid.js regrid). The hood-up car never moves: the plank up
   to the canopy and the rest phase's spin square are on it (it isn't one of CARS). Why its own file: it is the one
   mechanic that moves the map, and it reads the map, the push and the walk grid together */
import { blastPush, pushOn, pushAlong } from "./push.js";
import { CARS } from "./hangout/stationmap.js";
import { carAt, carClear, heightAt, PROPS } from "./hangout/layout.js";
import { regrid } from "./walkgrid.js";
import { activity } from "./hangout/registry.js";

const STEP = 4; // world px a step (a car never goes through anything thinner than this)
const NONE = {};
let last = NONE;
/* the map to where s says the cars are (the host's rules for every action, every screen each frame) */
export function carsAt(s) {
  const at = (s && s.hang && s.hang.cars) || NONE;
  if (at === last) return;
  last = at;
  CARS.forEach((c, i) => {
    const r = carAt(i, ...(at[i] || [0, 0]));
    if (r) regrid(...r);
  });
}
/* every push on the cars, the one rule (B6d: "weight or knockback or power", explosions too): from (x, y) world px,
   push(i, qx, qy) says how car i, its nearest part at (qx, qy), is pushed: [ux, uy, px], a way and its push (world px,
   push.js), or null; the car goes px over its weight (push.js pushOn), a step at a time while it stands clear (layout.js
   carClear) */
function carsPushed(s, x, y, push) {
  const at = s.hang.cars || NONE;
  let to = null;
  CARS.forEach((c, i) => {
    const [ox, oy] = at[i] || [0, 0],
      qx = Math.min(c.x1 + ox, Math.max(c.x0 + ox, x)),
      qy = Math.min(c.y1 + oy, Math.max(c.y0 + oy, y)),
      u = push(i, qx, qy);
    if (!u) return;
    const far = pushOn(s, "car", c, u[2]),
      n = Math.ceil(far / STEP),
      [nx, ny] = pushAlong(
        [ox, oy],
        n,
        (k) => [
          Math.round(ox + u[0] * far * (k / n)),
          Math.round(oy + u[1] * far * (k / n)),
        ],
        ([px, py]) => carClear(i, px, py),
      );
    if (nx !== ox || ny !== oy) (to = to || { ...at })[i] = [nx, ny];
  });
  if (!to) return;
  s.hang.cars = to;
  carsAt(s);
}
/* a blast (near: who it reaches, blast.js reach) from (x, y): each car it reaches, away from it, by its push there
   (push.js blastPush) */
export function carsBlast(s, near, x, y) {
  carsPushed(s, x, y, (i, qx, qy) => {
    const n = near(qx, qy, heightAt(qx, qy), 0, 0.001);
    if (!n) return null;
    const c = CARS[i],
      [ox, oy] = (s.hang.cars || NONE)[i] || [0, 0],
      ax = (c.x0 + c.x1) / 2 + ox - x,
      ay = (c.y0 + c.y1) / 2 + oy - y,
      d = Math.hypot(ax, ay) || 1;
    return [ax / d, ay / d, blastPush(s, n.o).px];
  });
}
/* a melee swing k's bubble (r world px round (x, y)): each car in it, once a swing (k.hit), along the swing (k.dx,
   k.dy), by px, the swing's push (world px, push.js meleePush) */
export function carsSwing(s, x, y, r, k, px) {
  const d = Math.hypot(k.dx, k.dy) || 1;
  carsPushed(s, x, y, (i, qx, qy) => {
    if (Math.hypot(qx - x, qy - y) > r || k.hit.includes("c" + i)) return null;
    k.hit.push("c" + i);
    return [k.dx / d, k.dy / d, px];
  });
}
/* … and on my screen, each frame (on Downpour: every mode there is Dead Ducks Arcade's, registry.js): the cars' parts at
   their depth now (world.js set it when it made them) */
activity({
  id: "cars",
  only: "l4dd",
  draw: (now, ctx) => carsShown(ctx.state(), ctx.world),
});
function carsShown(s, Wd) {
  carsAt(s);
  if (last === NONE) return;
  for (const p of PROPS) {
    if (p.car === undefined) continue;
    const z = String(Math.round(p.key) + 10);
    for (const e of Wd.propEls(p.id))
      if (e.style.zIndex !== z) e.style.zIndex = z;
  }
}
