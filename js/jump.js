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
/* head room (the owner's, Nov 21 14:52Z: a duck is about 0.6 of an elevation tall, and a jump stops when its head hits a
   ceiling, then it falls back): pos.hr, in duck heights, from the head where it jumped to the roof over it (world.js
   sets it as the jump starts; none under the open sky). Under the apex the arc rises to it and comes back down as its
   own mirror. th: the share of the jump where the head hits (half: never) */
const bump = (hr, H) =>
  hr === undefined || hr >= H
    ? 0.5
    : hr <= 0
      ? 0
      : (1 - Math.sqrt(1 - hr / H)) / 2;
const arc = (t0, now, T, H, th = 0.5) => {
  let t = (now - t0) / 1000 / T;
  if (t <= 0 || t >= 2 * th) return 0;
  if (t > th) t = 2 * th - t; // (bumped: back down the way it came)
  return 4 * H * t * (1 - t);
};
/* how high a duck is in its jump now, in duck heights (0 on the ground) */
export const jumpZ = (pos, now) => {
  if (!pos || !pos.j) return 0;
  const { T, H } = jumpCfg(pos);
  return arc(pos.j, now, T, H, bump(pos.hr, H));
};
/* when its jump comes down (ms, on the room's clock) */
export const landsAt = (pos) =>
  pos.j + jumpCfg(pos).T * 1000 * 2 * bump(pos.hr, jumpCfg(pos).H);
/* what a move sends of its jump (game.js), and what the rules keep of it (rules.js): a trampoline bounce's height and
   the head room */
export const jumpSend = (p) =>
  p.j
    ? {
        ...(p.tb ? { tb: p.tb } : {}),
        ...(p.hr < jumpCfg(p).H ? { hr: p.hr } : {}), // (only a roof the jump would hit: under a high one, nothing new)
      }
    : {};
export const jumpKept = (j, a) =>
  j
    ? {
        ...(+a.tb > 0 ? { tb: Math.min(3.5, +a.tb) } : {}),
        ...(a.hr != null && isFinite(a.hr)
          ? { hr: Math.min(9, Math.max(0, +a.hr)) }
          : {}),
      }
    : {};
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
  T *= 2 * bump(p.hr, jumpCfg(p).H); // (a bumped jump is shorter: so is its dodge)
  const end = p.j + T;
  return now - p.j > T * 0.2 && end - now > T * 0.2;
}
