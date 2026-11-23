/* ---------- a gun's heat: the spread that grows as it fires (K2) ----------
   The owner's, Nov 21 17:25Z: "when you shoot a gun, the cursor expands, and in a mathematical relation or ratio ... the
   cone in which the bullets can land expands the more rapidly it is shot. And how rapidly is rapid is also based on a
   ratio of its fire rate ... the shakes get like just a little tiny bit smidgen worse, the more inaccurate it gets";
   17:48Z: "it's not that its size grows, it's that the little like outside of the Corsairs become expanded further out
   ... more contracted ... somewhat transparent ... as you shoot, those kind of move further away from the center";
   "The bow and the dagger doesn't have recoil because they're not guns ... the bow's accuracy changes"; 18:59Z: "Heat
   and recoil count up and down in decimals, never on or off". The plan in plain English
   (/mnt/project-files/adam/calibers.md, Spread):
   - each gun has a heat from 0 to 1; every shot adds 1 over its fire rate (guns.js fireRate), so a full second at its
     top rate reaches full heat on any gun;
   - it keeps its heat while the gun fires as fast as it can, and once it stops it cools back to 0 in half a second
     (HEAT.COOL a second);
   - a shot flies off its aim by up to its widest cone times the heat it found (none on the first shot): the widest cone
     is HEAT.CONE (15°, the owner's pick, Nov 22 13:02Z) for each point of its recoil score (guns.js recoilOf), the
     bow HEAT.BOW; the grenade launcher kicks but never spreads (the owner's pick, the same card), and the dagger and
     the grenades have no recoil, so they never change;
   - my crosshair's four ticks sit close round its dot when cool, a little see-through, and move out with my heat
     (pixel.js crossLevel); the gun's kick and my screen's shake grow by up to HEAT.SHAKE (30%) at full heat.
   Where it lives: s.heat { "id weapon": [heat, ms] } (the host's, so every screen draws the same), its heat just after
   the shot fired at ms. Why its own file: one rule for every mode's guns (the boards, Mad God Justin, Sandbox and Dead
   Ducks Arcade) and for what my screen shows of it */
import { ARMS, fireRate, recoilOf } from "./guns.js";
import { crossLevel } from "./pixel.js";

const DEG = Math.PI / 180;
/* CONE and BUILD: 50% more scatter, built up 50% faster (the owner's, Nov 23 00:32Z: recoil "50% worse ... Maybe it can
   stack up a little bit faster too"; CONE was 15 degrees) */
const HEAT = {
  COOL: 2,
  CONE: 22.5 * DEG,
  BUILD: 1.5,
  BOW: 6 * DEG,
  SHAKE: 0.3,
  TICKS: 4,
};
/* the widest cone of weapon w, radians each way of its aim (0: it never spreads) */
const coneOf = (w) =>
  w === "bow" ? HEAT.BOW : w === "glauncher" ? 0 : recoilOf(w) * HEAT.CONE;
/* duck id's heat with weapon w at now, 0 … 1 */
function heatOf(s, id, w, now) {
  const e = s && s.heat && s.heat[id + " " + w];
  if (!e) return 0;
  const rest = now - e[1] - 1000 / (fireRate(w) || 1); // (cooling only once it's slower than its top rate)
  return Math.max(0, e[0] - (HEAT.COOL * Math.max(0, rest)) / 1000);
}
/* duck id fires weapon w at now, n rounds (a burst's: all of them unless told): its aim [x, y] (in u: a board's units
   of one duck each way, as the board isn't square) turned by a roll within its cone at the heat it found, and its heat
   up by n over its fire rate. Weapons with no cone come back as they were, with no roll */
export function spreadAim(
  s,
  id,
  w,
  aim,
  now,
  n = ARMS[w]?.burst || 1,
  u = [1, 1],
) {
  const cone = coneOf(w);
  if (!cone || !aim) return aim;
  const h = heatOf(s, id, w, now),
    up = Math.min(1, h + (HEAT.BUILD * n) / (fireRate(w) || 1));
  s.heat = { ...(s.heat || {}), [id + " " + w]: [+up.toFixed(3), now] };
  if (!h) return aim; // (the first shot goes where it's aimed)
  const a = (Math.random() * 2 - 1) * cone * h,
    x = aim[0] / u[0],
    y = aim[1] / u[1],
    [c, si] = [Math.cos(a), Math.sin(a)];
  return [(x * c - y * si) * u[0], (x * si + y * c) * u[1]];
}
/* how much more a shot of weapon w by duck id kicks and shakes, now: 1 … 1 + HEAT.SHAKE */
export const heatShake = (s, id, w, now) =>
  coneOf(w) && w !== "bow" ? 1 + HEAT.SHAKE * heatOf(s, id, w, now) : 1;
/* every frame (game.js): a weapon in my hand makes the mouse a crosshair over the board (owner Nov 16, css/app.css
   html.armed), its ticks as far out as my heat with it. arms: game.js' [id, weapon, pos, duck, mine] */
export function armedView(arms, s, now) {
  const mine = arms.find((a) => a[4]);
  document.documentElement.classList.toggle("armed", !!mine);
  const w = mine && mine[1];
  crossLevel(
    coneOf(w) ? Math.round(heatOf(s, mine[0], w, now) * HEAT.TICKS) : 0,
  );
}
