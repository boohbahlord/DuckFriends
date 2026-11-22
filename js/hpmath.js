/* ---------- HP in hundredths (the owner's, Nov 19 10:30Z; hundredths since Nov 21 18:16Z, "damage in hundredths") ----------
   "HP tenths: 4 HP shows 4 blocks. Take 1.5 damage and you have 2.5: two full blocks and one half-empty block. ... Any
   HP above 0, even 0.1, keeps you standing." (A heal no longer fills the half block first: Nov 22, hpHeal.) Every
   player's HP goes through these, in every mode, so a hundredth never turns into 0.30000000000000004 */
import { modeOf } from "./modes.js";
import { baseMode } from "./sandboxrules.js";

const DUCK_STEP = 0.01; // (a duck's HP back on its own: in hundredths, regenOf below)
/* a number kept to hundredths */
export const hundredths = (n) => Math.round((+n || 0) * 100) / 100;

/* hp after a hit of dmg (never under 0); still standing while it's above 0 */
export const hpHurt = (hp, dmg) => Math.max(0, hundredths(hp - dmg));

/* hp after healing amt, up to max: just what it is, a point or a part of one (2.5 healed by 1 is 3.5; the owner's,
   Nov 22 06:24Z: "the amount that heals is also a point or fraction of HP", where a part-empty block used to fill first) */
export function hpHeal(hp, amt, max) {
  const h = hundredths(hp),
    a = hundredths(amt);
  return Math.min(max, a > 0 ? hundredths(h + a) : h);
}

/* an HP number as words show it: 3, 2.5, 0.1 */
export const hpText = (n) => String(hundredths(n));

/* ---------- whose HP: one HP module, the modes differ only by breed (the cornerstone, Nov 20) ----------
   The file that keeps an HP registers its breed (hpBreed): of(s, id, now, seated) is [hp, most] for a duck, Justin or
   his double right now, or null where it has none; heal(s, id, amt, now) gives some back; most(s, id) is what a heal of
   100% fills to; store(s) is the state a heal changes. A mode names its breed in modes.js (hp); every other mode, and
   a breed without a heal of its own (Mad God Justin's), has the board's. Hurting stays with each weapon's rules */
const HP_BREEDS = {};
export const hpBreed = (k, b) => (HP_BREEDS[k] = { step: DUCK_STEP, ...b });
const breedOf = (s) =>
  HP_BREEDS[modeOf(baseMode(s.options)).hp] || HP_BREEDS.board;
const healer = (s) => (breedOf(s).heal ? breedOf(s) : HP_BREEDS.board);
export const hpOf = (s, id, now) =>
  breedOf(s).of(s, id, now, !!(s.seat.includes(id) && s.players[id]));
export const hpMostOf = (s, id) => healer(s).most(s, id);
/* the bar over a duck, Justin or his double (game.js): { hp, most } while it shows, else null. A breed's bar(s, id,
   now, seated) says when and how full (full: a bar that first shows below full flashes down from full); without one,
   its HP while above 0 (glow: the breed's HP back glows green) */
export function hpBarOf(s, id, now) {
  const B = breedOf(s);
  if (B.bar) return B.bar(s, id, now, s.seat.includes(id));
  const v = hpOf(s, id, now);
  return v && v[0] > 0 && v[1] ? { hp: v[0], most: v[1], glow: B.glow } : null;
}
/* amt of HP back for duck id; true when the state changed */
export function hpHealOf(s, id, amt, now) {
  const B = healer(s),
    was = B.store(s);
  B.heal(s, id, amt, now);
  return B.store(s) !== was;
}

/* ---------- HP back on its own (B7, the owner's, Nov 21 16:17Z: "HP regenerates as fast as it did, but it doesn't
   wait for an entire health point until it comes back ... split into fractions or units of either a 10th or 100th
   place ... for players. Now for NPC entities ... It can generate as a larger unit in chunks. If it even has
   regeneration") ----------
   What comes back at a time is a breed's step: a duck's HP (every HP breed's step) in hundredths, so its bar fills
   smoothly at the speed it always came back; an NPC's in whole HP (NPC_STEP). regenOf(s, since, now, ms, npc): one HP
   back every ms, how much has come back since `since` in whole steps, and the time that's counted to (the rest waits) */
const NPC_STEP = 1;
export function regenOf(s, since, now, ms, npc = false) {
  const step = npc ? NPC_STEP : breedOf(s).step,
    n = Math.floor((now - since) / (ms * step) + 1e-6);
  return [hundredths(n * step), since + n * ms * step];
}
