/* ---------- HP in tenths (the owner's, Nov 19 10:30Z) ----------
   "HP tenths: 4 HP shows 4 blocks. Take 1.5 damage and you have 2.5: two full blocks and one half-empty block. Healing
   fills the half block first (rounds up to 3), then whole blocks. Any HP above 0, even 0.1, keeps you standing."
   Every player's HP goes through these, in every mode, so a tenth never turns into 0.30000000000000004 */

/* a number kept to tenths */
export const tenths = (n) => Math.round((+n || 0) * 10) / 10;

/* hp after a hit of dmg (never under 0); still standing while it's above 0 */
export const hpHurt = (hp, dmg) => Math.max(0, tenths(hp - dmg));

/* hp after healing amt, up to max: a part-empty block fills first (2.5 healed by 1 is 3), then whole blocks (2.5
   healed by 2 is 4). A heal of less than 1 (a zone's tenths) only adds what it is */
export function hpHeal(hp, amt, max) {
  const h = tenths(hp),
    a = tenths(amt);
  if (a <= 0) return Math.min(max, h);
  const up = a >= 1 && h % 1 ? Math.ceil(h) + (a - 1) : h + a;
  return Math.min(max, tenths(up));
}

/* an HP number as words show it: 3, 2.5, 0.1 */
export const hpText = (n) => String(tenths(n));
