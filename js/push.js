/* ---------- push and knock-back: one module for every body in every mode (the cornerstone's one module per mechanic,
   after 8f: 2) ----------
   A push moves a body along a way a step at a time and stops before the first step it can't stand on. Each kind of body
   gives its own steps (its units) and its own "can it stand there": a duck (boardfire.js shove: duck lengths on the
   board's shares, Hangout's walls and the cabin's side) and a zombie (l4ddrules.js knockZ: world px, zOk). How far a
   weapon pushes is guns.js ARMS knock (weaponuse.js knockOf) and, for the board's hammer and grenade, KB_FAR times the
   mode's own number (push in modes.js; PUSH otherwise). Weight, "immobile" and the ratio come next (category B6). */
import { modeOf } from "./modes.js";
import { baseMode } from "./sandboxrules.js";

/* the hammer's knock-back, in duck lengths (a duck it hits is shoved this far, times the mode's number) */
export const KB_FAR = 2.4;
/* how many KB_FAR the board's hammer and a grenade push a duck, unless the mode says otherwise (modes.js push) */
const PUSH = {
  hammer: 1.5, // (50% farther than it was: the owner's, Nov 4)
  grenade: 2, // (twice the hammer's in the normal game: the owner's, Nov 3 17:15Z)
};
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
