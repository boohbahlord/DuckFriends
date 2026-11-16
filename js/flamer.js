/* ---------- the flamethrower (the owner's, Nov 16 16:25Z) ----------
   Its tank starts at 100% and burns 2% for each second it fires (TANK puffs, one each tick of COOL ms). The longer it's
   held the farther it reaches (REACH, growing over GROW ms) and the faster it spews (an exponential growth, RATE). Every
   flame is a pixel in a cone: the cone's width is cut into bands out from its middle, and each band out is half as
   likely to get a pixel as the one before it (band). Whatever is in it catches fire; the ground at the stream's end
   burns for GROUND ms (a patch every PATCH ms, MOST at once). Shared by the rules (rules.js, l4ddrules.js) and the
   screens (game.js, fx.js). Distances are in duck lengths (Dead Ducks Arcade: DUCK world px each) */
export const FLAME = {
  TANK: 500, // (puffs: 500 at 10 a second is 50 seconds, 2% a second)
  COOL: 100, // ms between puffs
  GAP: 300, // ms without a puff and the next one starts a new hold
  REACH: [2, 6], // duck lengths: as it starts, and once held GROW ms
  GROW: 2500,
  CONE: 0.3, // radians: half the cone's width
  BANDS: 5, // (the cone's half cut into this many bands; each one out half as likely)
  RATE: [60, 420], // pixels a second: as it starts, and the most it grows to
  TAU: 900, // ms: the rate grows e times over this
  GROUND: 5000, // ms a patch of ground burns
  PATCH: 250, // ms between my patches
  MOST: 30, // patches at once, everyone's
  PATCH_R: 0.7, // duck lengths: how near a patch's middle something catches fire
  RELOAD: 4000, // ms (outside Dead Ducks Arcade, the tank fills again after it's empty)
  BURN: 1000, // ms: a duck in it takes 1 HP once in this long (outside Dead Ducks Arcade)
  DUCK: 56, // Dead Ducks Arcade's duck length, world px (l4ddrules.js RX)
};
/* how far it reaches (duck lengths), held for `ms` */
export const flameReach = (ms) =>
  FLAME.REACH[0] +
  (FLAME.REACH[1] - FLAME.REACH[0]) * Math.min(1, Math.max(0, ms) / FLAME.GROW);
/* how many pixels a second it spews, held for `ms`: growing exponentially to the most */
export const flameRate = (ms) =>
  Math.min(
    FLAME.RATE[1],
    FLAME.RATE[0] * Math.exp(Math.max(0, ms) / FLAME.TAU),
  );
/* a pixel's place across the cone, from -1 (one edge) to 1 (the other): its band out from the middle, each half as
   likely as the one before it, then anywhere inside that band, either side */
export function band() {
  let k = 0;
  while (k < FLAME.BANDS - 1 && Math.random() < 0.5) k++;
  return ((k + Math.random()) / FLAME.BANDS) * (Math.random() < 0.5 ? -1 : 1);
}
/* is (dx, dy) (duck lengths from the nozzle) in the cone pointing (ux, uy) (a unit), within `far` duck lengths? One
   right at the nozzle is always in it */
export function inCone(dx, dy, ux, uy, far) {
  const d = Math.hypot(dx, dy);
  if (d > far) return false;
  if (d < 0.6) return true;
  return (dx * ux + dy * uy) / d >= Math.cos(FLAME.CONE);
}
