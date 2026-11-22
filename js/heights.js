/* ---------- a shot's height, Doom's way (Part B, the owner's, Nov 17 12:28Z; every mode) ----------
   A shot flies flat. It sets off at its shooter's middle, and the first target it passes over (on the floor plan, at
   any height: up on a roof) is hit, and sets its height: that target's middle. From there on, a shot that goes
   through hits only what that height passes through, and a wall stops it only if the wall is taller than it. Between
   two floors, the one rule: nothing solid between shooter and target (layout.js slabBetween), and the chain-link fence
   never stops one.
   sh.hz: the shooter's feet, as the rules always kept it; sh.lh: its height once a target has set it (world px) */
import { DUCK, slabBetween } from "./hangout/layout.js";
import { LEVEL } from "./gamedefaults.js";

const MID = DUCK / 2;
/* one elevation: the gas station's roof over the ground (world px; the owner's, Nov 21 14:06Z). Heights the owner
   gives in elevations are times this */
export const ELEV = 108;
/* the one reading of a height as a level (B5's arrows, Sandbox's Elevation): feet at z (world px over the ground) stand on
   level levelOf(z), the ground's LEVEL.GROUND (gamedefaults.js), a whole level more each roof up; levelZ(n): level n's
   height */
export const levelOf = (z) => z / ELEV + LEVEL.GROUND;
export const levelZ = (n) => (n - LEVEL.GROUND) * ELEV;
/* how high shot sh flies now (world px) */
const shotH = (sh) => sh.lh ?? (sh.hz || 0) + MID;
/* ---------- the height of a body: one way to ask it, for every body in every mode (the cornerstone's one module per
   mechanic, after 8f: 1) ----------
   zOf(b): its feet, world px. A duck, an NPC, a gunman or a ghost keeps them in b.z (0 or none: on the ground); a
   zombie works its out (up a fence, up a wall, on a roof, jumping: zombies.js gives its way, zOf(z, "zombie")); a
   shot flies at shotH ("shot"). A new kind of body gives its way with heightWay(kind, f) */
const WAYS = { body: (b) => +b.z || 0, shot: shotH };
export const heightWay = (k, f) => (WAYS[k] = f);
export const zOf = (b, k = "body") => WAYS[k](b);
/* two bodies near enough in height for a flame or a swing to reach from one to the other (feet, world px) */
const NEAR_H = 48;
export const nearH = (za, zb) => Math.abs(za - zb) <= NEAR_H;
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
/* Doom's same floor first (the owner's, Nov 17 17:41Z: "the natural target priority hits the duck on the same floor
   ... unless the same direction of enemy has no one which CAN be shot IN that direction ON the same floor"; in every
   mode, the owner's 12:28Z "the bullets verticality rule applies to all game modes now"): is a target on my floor (feet
   within SAME_FLOOR of mine, hz) in my shot's line before anything stops it? Then the shot stays on my floor
   (floorLock); if not, it goes to the first target at any height (hOk, hLock). targets: [{ x, y, z }] (z: feet, world
   px); my shot from (px, py) along (dx, dy) (a unit), as far as far, looking every step, in the units of x and y; r: a
   target's hit room [rx, ry] in those units; stop(x, y): something there stops it (a wall). The normal modes' ducks
   (rules.js); Dead Ducks Arcade's roofs go by layout.js slabBetween alone (the owner's, Nov 17 20:02Z) */
export const SAME_FLOOR = 20;
export function sameFloorAhead(t, px, py, hz, dx, dy, far, r, step, stop) {
  const mine = t.filter((o) => Math.abs(o.z - hz) < SAME_FLOOR);
  if (!mine.length) return false;
  for (let d = step; d < far; d += step) {
    const x = px + dx * d,
      y = py + dy * d;
    if (stop && stop(x, y)) return false;
    if (mine.some((o) => Math.hypot((o.x - x) / r[0], (o.y - y) / r[1]) < 1))
      return true;
  }
  return false;
}
/* the height of a shot held to my floor (my feet at hz): sh.lh, as hLock would set it */
export const floorLock = (hz) => Math.round(hz + MID);
/* the height a wall must reach over a shot's feet to stop it, for walls that ask for feet (l4ddrules.js walled) */
export const shotFeet = (sh) => shotH(sh) - 20;
