/* ---------- a duck's jump: one arc for every mode ----------
   One jump for everyone: no long, short or double jump, no slow gravity (the owner's, Nov 20 21:38Z). Its time in the
   air and its apex are the same on the board and on the maps; only their units differ (the board: duck heights over
   the tile; the maps: world.js times them by its duck's height). Hangout's trampoline bounces higher (pos.tb, in duck
   heights) and longer. game.js draws and lands it, world.js follows it over steps and edges, and the rules ask whether
   a duck in the middle of one dodges. */
import { DUCK } from "./hangout/layout.js";
import { ELEV } from "./heights.js";

/* how high a duck jumps: 0.3 of an elevation (the owner's, Nov 21 10:48 AM ET: "we'll make it to where ducks can jump
   0.3 elevation high"), JUMP_UP world px: anything up to that high a duck can jump onto */
const JUMP_ELEV = 0.3;
const JUMP_UP = JUMP_ELEV * ELEV;
export const JUMP = { T: 0.62, H: JUMP_UP / DUCK }; // seconds in the air; apex in duck heights
const BOUNCE_H = 1.35; // (the trampoline's bounces keep the timing they had: a bounce tb high lasts T * sqrt(tb / this))
/* a duck's jump: the one arc; Hangout's trampoline bounces higher (pos.tb) */
export const jumpCfg = (pos) => {
  if (pos && pos.tb > 0)
    return { T: JUMP.T * Math.sqrt(pos.tb / BOUNCE_H), H: pos.tb }; // Hangout's trampoline: a bounce tb duck heights high
  return JUMP;
};
const arc = (t0, now, T, H) => {
  const t = (now - t0) / 1000 / T;
  return t <= 0 || t >= 1 ? 0 : 4 * H * t * (1 - t);
};
/* how high a duck is in its jump now, in duck heights (0 on the ground) */
export const jumpZ = (pos, now) => {
  if (!pos || !pos.j) return 0;
  const { T, H } = jumpCfg(pos);
  return arc(pos.j, now, T, H);
};
/* when its jump comes down (ms, on the room's clock) */
export const landsAt = (pos) => pos.j + jumpCfg(pos).T * 1000;
/* a jump dodges attacks, but not in its first and its last fifth: I want a dodge timed, not a jump held as a shield.
   T: its length in ms (a trampoline's bounce is longer; Dead Ducks Arcade counts a plain jump's, l4ddrules.js dodging) */
export function jumpDodges(
  p,
  now,
  T = p && p.tb > 0
    ? JUMP.T * 1000 * Math.sqrt(p.tb / BOUNCE_H)
    : JUMP.T * 1000,
) {
  if (!p || !p.j) return false;
  const end = p.j + T;
  return now - p.j > T * 0.2 && end - now > T * 0.2;
}
