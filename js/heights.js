/* ---------- a shot's height, Doom's way (Part B, the owner's, Nov 17 12:28Z; every mode, jetpacks too) ----------
   A shot flies flat. It sets off at its shooter's middle, and the first target it passes over (on the floor plan, at
   any height: up on a roof, flying) is hit, and sets its height: that target's middle. From there on, a shot that goes
   through hits only what that height passes through, and a wall stops it only if the wall is taller than it. A roof is
   a slab: no shot goes through one (layout.js slabBetween), and the chain-link fence never stops one.
   sh.hz: the shooter's feet, as the rules always kept it; sh.lh: its height once a target has set it (world px). On
   the boards, a flying duck's height is its jetpack's (fz, in duck heights) */
import { DUCK, slabBetween } from "./hangout/layout.js";

export const MID = DUCK / 2;
/* how high shot sh flies now (world px) */
export const shotH = (sh) => sh.lh ?? (sh.hz || 0) + MID;
/* can shot sh hit a target whose feet are at tz, at (tx, ty), world px? (its shooter at (sx, sy), world px; leave
   them out where there are no roofs) */
export function hOk(sh, tz, tx, ty, sx, sy) {
  if (sx !== undefined && slabBetween(sx, sy, sh.hz || 0, tx, ty, tz))
    return false;
  if (sh.lh === undefined) return true;
  return sh.lh >= tz - 4 && sh.lh <= tz + DUCK + 4;
}
/* it hit a target with its feet at tz: the first one sets its height */
export function hLock(sh, tz) {
  if (sh.lh === undefined) sh.lh = Math.round(tz + MID);
}
/* the height a wall must reach over a shot's feet to stop it, for walls that ask for feet (l4ddrules.js walled) */
export const shotFeet = (sh) => shotH(sh) - 20;
