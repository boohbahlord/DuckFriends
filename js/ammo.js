/* THE ONE AMMO RULE, every mode (the owner's, Nov 22 19:29Z: "WHEN THE GUNS ARE SELECTED, THEY HAVE AMMO OF DEAD DUCKS
   ARCADE UNLESS UNLIMITED AMMO IS SELECTED"). Every gun has Dead Ducks Arcade's ammo (guns.js ARMS): its magazine (mag)
   and all it carries (all), reloaded from the rest; a gun without a magazine (the shotgun, the grenade launcher, the
   flamethrower) fires all it has and is empty. One pair everywhere: [in the magazine, the rest] (no magazine: [all of
   it, 0]). Dead Ducks Arcade keeps a duck's pairs in its kit (l4ddrules.js m.am); the board and Mad God Justin in s.mag.
   G's Unlimited ammo (s.options.infAmmo): the rest never goes down; a magazine still empties and reloads, and a gun
   without one never runs out. The bow and the Laser Rifle never run out anywhere (no `all`). A game starts every gun
   full (voterules.js beginGame). */
import { ARMS, loadTo } from "./guns.js";
import { afterShots } from "./weaponuse.js";
import { survOn, SV } from "./survrules.js";

/* a ranged weapon whose ammo never runs out (no `all`: the Laser Rifle, the bow) */
export const endless = (w) =>
  !!ARMS[w] &&
  ARMS[w].kind === "ranged" &&
  ARMS[w].all === undefined &&
  !(w === "bow" && survOn()); // (Survival: the bow has 300 arrows)
/* a weapon's ammo, full: [in the magazine, the rest], or [all of it, 0] without a magazine; null: none kept (melee,
   endless). Survival: every gun holds half as much ("every weapon now has half as much ammo"), never less than a
   magazine; the bow 300 arrows */
export const fullAmmo = (w) => {
  const a = ARMS[w];
  if (w === "bow" && survOn()) return [SV.ARROWS, 0];
  if (!a || a.all === undefined) return null;
  const all =
    survOn() && a.kind === "ranged"
      ? Math.max(a.mag || 1, Math.ceil(a.all / 2))
      : a.all;
  return a.mag ? [a.mag, all - a.mag] : [all, 0];
};
/* G's Unlimited ammo is on */
export const infAmmo = (s) => !!(s && s.options && s.options.infAmmo);
/* gun w's magazine (0: none) */
export const capOf = (w) => (ARMS[w] && ARMS[w].mag) || 0;
/* `many` rounds fired from pair c with a magazine of cap (0: none): the pair after, and whether the magazine is empty
   (it reloads by itself then; without a magazine, the gun is empty) */
export const fire = (c, many, cap, inf) => {
  if (!cap && inf) return { c, empty: false };
  const shot = afterShots(c[0], many);
  return { c: [shot.left, c[1]], empty: shot.empty };
};
/* a reload of gun w from pair c, its magazine cap: [what it fills to, the share of its time], or null when it can't
   (no magazine, nothing left to load, or full: guns.js loadTo) */
export const reloadTo = (w, c, cap, inf) =>
  cap && (inf || c[1] > 0) ? loadTo(w, c[0], cap) : null;
/* the reload done: the magazine filled to `to` from the rest */
export const refill = (c, to, inf) => {
  const k = Math.max(0, inf ? to - c[0] : Math.min(to - c[0], c[1]));
  return [c[0] + k, inf ? c[1] : c[1] - k];
};
/* how long a reload of gun w from pair c takes: the double barrel a second for each shell it loads, the rest their
   own (Dead Ducks Arcade's upgrades and Angelic weapons change it there: l4ddrules.js reloadOf) */
export const reloadMs = (w, c, inf) =>
  ARMS[w].shell
    ? ARMS[w].shell *
      Math.max(
        1,
        Math.min(ARMS[w].mag - (c ? c[0] : 0), c && !inf ? c[1] : ARMS[w].mag),
      )
    : ARMS[w].reload || 1500;

/* ---------- the board's and Mad God Justin's: s.mag = { key: { c: the pair, r: when its reload ends (0: not
   reloading), d: how long it takes, f: the pair once it's done } }, key: magKey ---------- */
export const magKey = (id, w) => (w === "handgun" ? id : `${id} ${w}`);
/* duck id's gun w now: { c, r, d } (never fired this game: full; a reload over: done), or null for none kept (not a
   gun, or endless). down: the down pistol, its bullets never run out */
export function magOf(s, id, now, w = "handgun", down) {
  const m = (s.mag || {})[magKey(id, w)];
  if (!m) {
    const full = ARMS[w] && ARMS[w].kind === "ranged" && fullAmmo(w);
    return full && { c: down ? [full[0], 0] : full, r: 0, d: 0 };
  }
  return m.r && now >= m.r ? { c: m.f, r: 0, d: 0 } : m;
}
/* the rounds left in duck id's gun w, all told (Infinity: none kept) */
export const leftOf = (s, id, now, w) => {
  const m = magOf(s, id, now, w);
  return m ? m.c[0] + m.c[1] : Infinity;
};
/* a reload of duck id's gun w starts (by R, or by itself once empty); false when it can't */
export function reloadMag(s, id, now, w, inf, m = magOf(s, id, now, w)) {
  const to = m && !m.r && reloadTo(w, m.c, capOf(w), inf);
  if (!to) return false;
  const d = reloadMs(w, m.c, inf) * to[1];
  s.mag = {
    ...(s.mag || {}),
    [magKey(id, w)]: { c: m.c, r: now + d, d, f: refill(m.c, to[0], inf) },
  };
  return true;
}
/* duck id fires `many` rounds of gun w: false when it's empty or reloading; empty after, it reloads by itself */
export function shootMag(s, id, now, w, many, inf) {
  const m = magOf(s, id, now, w);
  if (!m) return true; // (none kept: it never runs out)
  if (m.r || m.c[0] <= 0) return false;
  const shot = fire(m.c, many, capOf(w), inf),
    k = magKey(id, w);
  s.mag = { ...(s.mag || {}), [k]: { c: shot.c, r: 0, d: 0 } };
  if (shot.empty) reloadMag(s, id, now, w, inf, s.mag[k]);
  return true;
}
/* what one magazine of gun w holds, for its bar and dots (no magazine: all it carries) */
export const sizeOf = (w) => capOf(w) || (fullAmmo(w) || [0])[0];
/* the yellow bar under my duck (meters.js ammoBar) for magOf's m: how full, reloading, nothing left at all */
export const barOf = (m, w, now, inf) => {
  const rl = m.r > now;
  return {
    f: rl ? 0 : Math.min(1, m.c[0] / sizeOf(w)), // (one more in the chamber: still full)
    rl,
    dry: !rl && m.c[0] <= 0 && (m.c[1] <= 0 || !capOf(w)) && !inf,
  };
};
