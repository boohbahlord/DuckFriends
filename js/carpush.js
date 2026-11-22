/* ---------- a car pushed: Downpour's cars moved by a blast (B6d) ----------
   The owner's, Nov 21 19:07Z: "for the new physics update, cars can be moved around ... Forget about the trees ... we're
   just worried about that cars can get moved around by enough weight or knockback or power. So like an explosion might
   be able to move it". A car weighs WEIGHT.CAR duck weights (a small 80s or 90s car is about 1,000 kg, some 15 grown-ups),
   so a push moves it far / its weight (push.js pushTaken), a step at a time along pushAlong, as long as its whole box
   stands clear (layout.js carClear). Where each car is: s.hang.cars { i: [dx, dy] }, world px from where the map puts it
   (none: there), so every device has it; carsAt(s) moves the map to it (layout.js carAt: its solids, its floor and its
   drawing) and makes again only the walk cells round it (walkgrid.js regrid). The hood-up car never moves: the plank up
   to the canopy and the rest phase's spin square are on it (it isn't one of CARS). Why its own file: it is the one
   mechanic that moves the map, and it reads the map, the push and the walk grid together */
import { WEIGHT } from "./gamedefaults.js";
import { pushOf, pushTaken, pushAlong } from "./push.js";
import { DUCK } from "./units.js";
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
/* a blast's push on the cars (near: who it reaches, blast.js reach; from (x, y) world px): each car it reaches is pushed
   away from it as far as it pushes a duck (push.js pushOf), over the car's weight */
export function carsBlast(s, near, x, y) {
  const at = s.hang.cars || NONE;
  let to = null;
  CARS.forEach((c, i) => {
    const [ox, oy] = at[i] || [0, 0],
      x0 = c.x0 + ox,
      y0 = c.y0 + oy,
      x1 = c.x1 + ox,
      y1 = c.y1 + oy,
      px = Math.min(x1, Math.max(x0, x)),
      py = Math.min(y1, Math.max(y0, y)); // (its nearest part)
    if (!near(px, py, heightAt(px, py), 0, 0.001)) return;
    const far = pushTaken(pushOf(s, "grenade"), WEIGHT.CAR) * DUCK,
      ax = (x0 + x1) / 2 - x,
      ay = (y0 + y1) / 2 - y,
      d = Math.hypot(ax, ay) || 1,
      n = Math.ceil(far / STEP),
      [nx, ny] = pushAlong(
        [ox, oy],
        n,
        (k) => [
          Math.round(ox + (ax / d) * far * (k / n)),
          Math.round(oy + (ay / d) * far * (k / n)),
        ],
        ([qx, qy]) => carClear(i, qx, qy),
      );
    if (nx !== ox || ny !== oy) (to = to || { ...at })[i] = [nx, ny];
  });
  if (!to) return;
  s.hang.cars = to;
  carsAt(s);
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
