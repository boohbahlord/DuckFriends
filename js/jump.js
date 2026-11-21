/* ---------- a duck's jump: one arc for every mode ----------
   One jump for everyone: no long, short or double jump, no slow gravity (the owner's, Nov 20 21:38Z). Its time in the
   air and its apex are the same on the board and on the maps; only their units differ (the board: duck heights over
   the tile; the maps: world.js times them by its duck's height). Hangout's trampoline bounces higher (pos.tb, in duck
   heights) and longer. game.js draws and lands it, world.js follows it over steps and edges, and the rules ask whether
   a duck in the middle of one dodges. */
export const JUMP = { T: 0.62, H: 1.35 }; // seconds in the air; apex in duck heights
/* a duck's jump: the one arc; Hangout's trampoline bounces higher (pos.tb) */
export const jumpCfg = (pos) => {
  if (pos && pos.tb > 0)
    return { T: JUMP.T * Math.sqrt(pos.tb / JUMP.H), H: pos.tb }; // Hangout's trampoline: a bounce tb duck heights high
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
  T = p && p.tb > 0 ? JUMP.T * 1000 * Math.sqrt(p.tb / JUMP.H) : JUMP.T * 1000,
) {
  if (!p || !p.j) return false;
  const end = p.j + T;
  return now - p.j > T * 0.2 && end - now > T * 0.2;
}
