/* ---------- HP in hundredths (the owner's, Nov 19 10:30Z; hundredths since Nov 21 18:16Z, "damage in hundredths") ----------
   "HP tenths: 4 HP shows 4 blocks. Take 1.5 damage and you have 2.5: two full blocks and one half-empty block. Healing
   fills the half block first (rounds up to 3), then whole blocks. Any HP above 0, even 0.1, keeps you standing."
   Every player's HP goes through these, in every mode, so a hundredth never turns into 0.30000000000000004 */
import { modeOf } from "./modes.js";
import { baseMode } from "./sandboxrules.js";

/* a number kept to hundredths */
export const hundredths = (n) => Math.round((+n || 0) * 100) / 100;

/* hp after a hit of dmg (never under 0); still standing while it's above 0 */
export const hpHurt = (hp, dmg) => Math.max(0, hundredths(hp - dmg));

/* hp after healing amt, up to max: a part-empty block fills first (2.5 healed by 1 is 3), then whole blocks (2.5
   healed by 2 is 4). A heal of less than 1 (a zone's tenths) only adds what it is */
export function hpHeal(hp, amt, max) {
  const h = hundredths(hp),
    a = hundredths(amt);
  if (a <= 0) return Math.min(max, h);
  const up = a >= 1 && h % 1 ? Math.ceil(h) + (a - 1) : h + a;
  return Math.min(max, hundredths(up));
}

/* an HP number as words show it: 3, 2.5, 0.1 */
export const hpText = (n) => String(hundredths(n));

/* ---------- whose HP: one HP module, the modes differ only by breed (the cornerstone, Nov 20) ----------
   The file that keeps an HP registers its breed (hpBreed): of(s, id, now, seated) is [hp, most] for a duck, Justin or
   his double right now, or null where it has none; heal(s, id, amt, now) gives some back; most(s, id) is what a heal of
   100% fills to; store(s) is the state a heal changes. A mode names its breed in modes.js (hp); every other mode, and
   a breed without a heal of its own (Mad God Justin's), has the board's. Hurting stays with each weapon's rules */
const HP_BREEDS = {};
export const hpBreed = (k, b) => (HP_BREEDS[k] = b);
const breedOf = (s) =>
  HP_BREEDS[modeOf(baseMode(s.options)).hp] || HP_BREEDS.board;
const healer = (s) => (breedOf(s).heal ? breedOf(s) : HP_BREEDS.board);
export const hpOf = (s, id, now) =>
  breedOf(s).of(s, id, now, !!(s.seat.includes(id) && s.players[id]));
export const hpMostOf = (s, id) => healer(s).most(s, id);
/* amt of HP back for duck id; true when the state changed */
export function hpHealOf(s, id, amt, now) {
  const B = healer(s),
    was = B.store(s);
  B.heal(s, id, amt, now);
  return B.store(s) !== was;
}
