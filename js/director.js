/* ---------- the director: how Dead Ducks Arcade measures the team (the owner approved it, Nov 28,
   cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H; Left 4 Dead's director in small) ----------
   Each duck: its health (HP over its most HP), its ammo (the average over its guns of rounds left over their most;
   melee, items and grenades left out) and whether it can afford a refill (one of its guns bought again from the
   merchant, the cheapest). Help (the crate, bandages, the merchant) reads the worst-off duck; pressure (specials, more
   walkers) reads the team's average, and never presses while any duck is low on health. Numbers: gamedefaults.js */
import { DIRECTOR } from "./gamedefaults.js";
import { kindOf } from "./guns.js";
import {
  players,
  isWild,
  kitOf,
  l4Hp,
  maxHp,
  fullFor,
  ptsOf,
  merchantPrice,
  stockPrice,
} from "./l4ddrules.js";

/* duck id: { id, hp, ammo (0 to 1), rich (it can afford a refill) }, or null when it has no HP to read */
export function duckState(s, id) {
  const hp = l4Hp(s, id),
    kit = kitOf(s, id);
  if (hp < 0 || !kit) return null;
  const guns = (kit.sl || []).filter(
      (w) => kindOf(w) === "ranged" && fullFor(s, id, w),
    ),
    share = (w) => {
      const f = fullFor(s, id, w),
        [m, r] = (kit.am || {})[w] || [0, 0];
      return Math.min(1, (m + r) / (f[0] + f[1] || 1));
    },
    cheapest = Math.min(
      ...guns.map((w) => stockPrice(s, merchantPrice(w), w, kit)),
    );
  return {
    id,
    hp: Math.max(0, hp) / (maxHp(s, id) || 1),
    ammo: guns.length
      ? guns.reduce((t, w) => t + share(w), 0) / guns.length
      : 1,
    rich: !guns.length || ptsOf(s, id) >= cheapest,
  };
}
/* every player's duck (not the wild Justin's) */
export const ducks = (s) =>
  players(s)
    .filter((id) => !isWild(s, id))
    .map((id) => duckState(s, id))
    .filter(Boolean);
export const lowHp = (d) => d.hp < DIRECTOR.HP_LOW;
export const lowAmmo = (d) => d.ammo < DIRECTOR.AMMO_LOW;
/* doing badly: low on health or on ammo */
export const badly = (d) => lowHp(d) || lowAmmo(d);
/* the share of the ducks doing badly, 0 to 1 (armored zombies come fewer by it: zombies.js armorRoll) */
export function badShare(s) {
  const all = ducks(s);
  return all.length ? all.filter(badly).length / all.length : 0;
}
/* for help: the worst-off duck (its lower share first), or null */
export const worst = (s) =>
  ducks(s).reduce(
    (a, d) => (!a || Math.min(d.hp, d.ammo) < Math.min(a.hp, a.ammo) ? d : a),
    null,
  );
/* for pressure: the team doing well (its average health and ammo high, and no duck low on health) */
export function doingWell(s) {
  const all = ducks(s);
  if (!all.length || all.some(lowHp)) return false;
  const avg = (k) => all.reduce((t, d) => t + d[k], 0) / all.length;
  return avg("hp") > DIRECTOR.WELL.hp && avg("ammo") > DIRECTOR.WELL.ammo;
}
