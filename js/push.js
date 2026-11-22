/* ---------- push and knock-back: one module for every body in every mode (the cornerstone's one module per mechanic,
   after 8f: 2) ----------
   A push moves a body along a way a step at a time and stops before the first step it can't stand on. Each kind of body
   gives its own steps (its units) and its own "can it stand there": a duck (boardfire.js shove: duck lengths on the
   board's shares, Hangout's walls and the cabin's side) and a zombie (l4ddrules.js knockZ: world px, zOk). How far a
   weapon pushes is guns.js ARMS knock (weaponuse.js knockOf) and, for the board's hammer and grenade, KB_FAR times the
   mode's own number (push in modes.js; PUSH otherwise). Every push on a body is divided by its weight (the ratio,
   pushTaken), and an immobile one is never pushed. */
import { modeOf } from "./modes.js";
import { baseMode } from "./sandboxrules.js";
import { scaleOf } from "./duck.js";
import { WEIGHT } from "./gamedefaults.js";

/* weight follows Size (the owner's, Nov 21 15:56Z: "a duck's weight increases in proportion with its size by
   percentage. So a duck that is 110% bigger has 10% more weight and also 10% less speed ... A duck with more weight has
   more melee damage. In the same ratio ... So knockback becomes 10% more"): a duck's Size (Customize's, duck.js
   scaleOf; 1: 100%) is its weight, its melee's damage and push go with it, and it walks 10% slower for each 10% bigger,
   never slower than WEIGHT.SLOWEST. A grenade's or any shot's push never goes with the thrower's (16:53Z: "Knockback from
   projectiles do not become affected by your weight"). Justin and the computers' made ducks without one: 1 */
export const sizeOf = (s, id) =>
  (s.players && s.players[id] && scaleOf(s.players[id].duck)) || 1;
export const weightOf = sizeOf;
const walkK = (s, id) =>
  id == null ? 1 : Math.max(WEIGHT.SLOWEST, 2 - sizeOf(s, id));
/* the ratio: a push of far on a body of weight w moves it far / w (110%: 1/1.1 as far); an immobile one, never */
export const pushTaken = (far, w) => (w === Infinity ? 0 : far / w);
/* immobile (the owner's, 15:56Z: "select immobile, true. And now it has no movement. It's not affected by knockback.
   It doesn't have its own weight, and it never moves ever"): a body with im, and a Sandbox spawn's Speed 0 (Nov 20
   17:25Z: "Spawns or respawns dont move off their spot"): a map's zombie (zombieAt's sv), a Sandbox walker (brainWalk's
   l) */
export const immobile = (o) =>
  o.im === true || o.sv === 0 || (!!o.sp && !!o.l && o.l[1] === 0);

/* the hammer's knock-back, in duck lengths (a duck it hits is shoved this far, times the mode's number) */
export const KB_FAR = 2.4;
/* how many KB_FAR the board's hammer and a grenade push a duck, unless the mode says otherwise (modes.js push) */
const PUSH = {
  hammer: 1.5, // (50% farther than it was: the owner's, Nov 4)
  grenade: 2, // (twice the hammer's in the normal game: the owner's, Nov 3 17:15Z)
};
/* the lobby's Walking speed: how much faster or slower than normal every duck walks. The zombies of Quacky Zombies and
   the computers there go by it too, so the zombies stay as fast next to the ducks as the owner set them */
const WALKS = { slow: 0.6, normal: 1, fast: 1.5 };
export const walkOf = (s, id) =>
  (WALKS[s && s.options && s.options.walk] || 1) * walkK(s, id); // (id: a duck, as much slower as it's bigger: walkK)
export const pushOf = (s, what) =>
  KB_FAR * ({ ...PUSH, ...modeOf(baseMode(s.options)).push }[what] ?? 1);
/* the one loop: n steps from at ([x, y]); next(i, at) is step i's spot, ok(spot, at) says if the body can stand there,
   fix(spot) is where it's kept (a zombie's whole px). Returns where it stopped */
export function pushAlong(at, n, next, ok, fix = (q) => q) {
  for (let i = 1; i <= n; i++) {
    const q = next(i, at);
    if (!ok(q, at)) break;
    at = fix(q);
  }
  return at;
}
