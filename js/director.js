/* ---------- the director: how Dead Ducks Arcade measures the team (the owner approved it, Nov 28,
   cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H; Left 4 Dead's director in small) ----------
   Each duck: its health (HP over its most HP), its ammo (the average over its guns of rounds left over their most, an
   melee, items and grenades left out) and whether it can afford a refill (the merchants sell no ammo,
   so: the cheapest gun they sell, which comes full, at today's price). Help (the crate, bandages, the merchant) reads
   the ducks doing badly; pressure (specials, more walkers) reads the team, and never presses while any duck is low on
   health. Numbers: gamedefaults.js */
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
  stockPrice,
  MERCH,
} from "./l4ddrules.js";

/* duck id: { id, hp, ammo (0 to 1), rich (it can afford a refill) }, or null when it has no HP to read */
function duckState(s, id) {
  const hp = l4Hp(s, id),
    kit = kitOf(s, id);
  if (hp < 0 || !kit) return null;
  const guns = (kit.sl || []).filter((w) => kindOf(w) === "ranged"),
    share = (w) => {
      const f = fullFor(s, id, w),
        [m, r] = (kit.am || {})[w] || [0, 0];
      return f ? Math.min(1, (m + r) / (f[0] + f[1] || 1)) : 1;
    };
  return {
    id,
    hp: Math.max(0, hp) / (maxHp(s, id) || 1),
    ammo: guns.length
      ? guns.reduce((t, w) => t + share(w), 0) / guns.length
      : 1,
    rich:
      ptsOf(s, id) >= stockPrice(s, Math.min(MERCH.BOW, MERCH.PRICES.plain)),
  };
}
/* every player's duck (not the wild Justin's) */
export const ducks = (s) =>
  players(s)
    .filter((id) => !isWild(s, id))
    .map((id) => duckState(s, id))
    .filter(Boolean);
export const lowHp = (d) => d.hp < DIRECTOR.HP_LOW;
const lowAmmo = (d) => d.ammo < DIRECTOR.AMMO_LOW;
/* a supply crate is called for: some duck low on ammo that can't afford a refill (l4ddrules.js crateCome) */
export const needsCrate = (s) => ducks(s).some((d) => lowAmmo(d) && !d.rich);
/* how hard the director may press (pressure: the walkers' pace), 0 to 1: the team's average of health and ammo, never
   over the middle while any duck is low on health */
export function pressure(s) {
  const ds = ducks(s);
  if (!ds.length) return 0.5;
  const k = ds.reduce((t, d) => t + (d.hp + d.ammo) / 2, 0) / ds.length;
  return ds.some(lowHp) ? Math.min(0.5, k) : k;
}
/* doing badly: low on health or on ammo */
export const badly = (d) => lowHp(d) || lowAmmo(d);
/* for pressure: the team doing well (its average health and ammo high, and no duck low on health): the Flyer and the
   Giant come more often (zombies.js specialTick) */
export function doingWell(s) {
  const all = ducks(s);
  if (!all.length || all.some(lowHp)) return false;
  const avg = (k) => all.reduce((t, d) => t + d[k], 0) / all.length;
  return avg("hp") > DIRECTOR.WELL.hp && avg("ammo") > DIRECTOR.WELL.ammo;
}
/* the share of the ducks doing badly, 0 to 1 (armored zombies come fewer by it: zombies.js armorRoll) */
export function badShare(s) {
  const all = ducks(s);
  return all.length ? all.filter(badly).length / all.length : 0;
}
