/* ---------- Dead Ducks Arcade: what lies on the ground, and E that takes it (K16) ----------
   The owner's, Nov 21 18:27Z: "there's a 0.01% chance that a zombie drops a weapon. And we can make it a 0.01%
   additional chance they drop certain items. What items they drop or what weapons they drop are based on the slot's
   chances"; "You only pick them up by clicking E / Same for any loot on the ground now. / you cannot spin for wheel
   WHIle loot is on the ground FROM the slot machine, no player can, it has to fade away first".
   - Every zombie a duck kills may leave a weapon (KILL.ARM) or an item (KILL.ITEM), picked as the fireplace picks
     (l4ddrules.js bagsNow): a weapon from the chair, special and weapon bags by their odds, an item from the item bag.
   - It lies where it fell among the other drops (s.hang.l4dr: { n, k, x, y, until }, here k "arm" and w what it is)
     and fades as they do.
   - Nothing on the ground is taken by walking over it any more: only E, near enough (lootAt; l4ddrules.js pickLoot).
     Computers press E too when they stand on one (bots.js).
   - The fireplace (Downpour's car) can't be spun while anything it landed on is still there (l4ddrules.js fireplace) */
import { anyOf } from "./random.js";
export const KILL = { ARM: 0.0001, ITEM: 0.0001 };
export const REACH = 70; // world px: how near E takes one (and how near a Sandbox orb is walked over, l4ddrules.js DROP.REACH)
/* what a zombie just killed leaves (bags: the fireplace's, bagsNow): a weapon, an item or "" (one roll for both) */
export function killLoot({ odds, slot, weapon }) {
  const r = Math.random();
  if (r >= KILL.ARM + KILL.ITEM) return "";
  if (r >= KILL.ARM) return anyOf(slot.item);
  for (const k of ["chair", "special"])
    if (Math.random() < odds[k]) return anyOf(slot[k]);
  return anyOf(weapon[anyOf(Object.keys(weapon))]); // (the weapon bags take turns at the fireplace: here each as likely)
}
/* drop k (w: the weapon or item it is) lies at (x, y) in world px until `until`; n: its number, when it fell */
export function layDrop(s, k, x, y, n, until, w = "") {
  s.hang.l4dr = [
    ...(s.hang.l4dr || []),
    { n, k, ...(w ? { w } : {}), x: Math.round(x), y: Math.round(y), until },
  ];
}
/* the nearest drop E takes from (x, y) in world px, or null */
export function lootAt(s, x, y, now) {
  let best = null,
    bd = REACH;
  for (const d of (s.hang && s.hang.l4dr) || []) {
    const e = Math.hypot(d.x - x, d.y - y);
    if (now < d.until && e < bd) [best, bd] = [d, e];
  }
  return best;
}
