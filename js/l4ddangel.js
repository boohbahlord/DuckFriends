/* ---------- Dead Ducks Arcade's Angel machine (the owner's, Nov 16 17:22Z) ----------
   It stands on the stage. E with a gun or a melee weapon in hand puts it in, for 2,500 points (never the grenade, never
   an item: the medkit and so on). It works only while the power is on (l4ddpower.js); a weapon already in
   it when the power goes out still comes out. It works 5 seconds, glowing, throwing sparks and smoke, then the weapon
   comes back as an orb that only the duck who put it in can take (E), and it stays there till that duck does. The
   weapon is Angelic now:
     - every one: +1 damage, attacks 20% faster, reloads 20% faster (its sound too), and two more magazines (one for the
       LMG); a gun with no magazine (the bow, both shotguns, the flamethrower …) gets as much more in percent (MORE);
     - the bow: each arrow goes on through one zombie;
     - the sniper: through two more zombies than before;
     - the chain gun: through two zombies, the third stops it;
     - the flamethrower: it reaches farther, sooner, and the ground it lights burns 2.5 s longer;
     - the default pistol: two of them, one in each hand, taking turns one bullet at a time (twice the pistol's fire
       rate), a magazine twice as big, a reload twice as long; every bullet kills at once, and every crit sets off a
       blast half a grenade's size where it hit, with a weaker boom (the owner's, Nov 17 11:07Z: PISTOL);
     - the grenade launcher: its blast is GL_RADIUS of a grenade's, and it sets the ground there on fire.
     - the Laser Rifle: its own (LASER), a faster beam, a longer limit and now and then 2 damage.
   s.hang.l4am { by, w, sl (the slot it came from), t (when it went in) }: the weapon in the machine (null: none), till
   its duck takes it. A duck's Angelic weapons: its kit's ang { weapon: 1 } (l4ddrules.js' l4a). */
import { STAGE, layoutVariant } from "./hangout/layout.js";
import * as GS from "./hangout/stationmap.js";
const dpOn = () => layoutVariant() === "l4gs"; // (Downpour: in the chapel, against its south wall)
import { powerOn } from "./l4ddpower.js";

export const ANGEL = {
  // the machine on the stage: its foot's middle, toward the back, clear of the mic (Downpour: on the chapel's floor)
  get X() {
    return dpOn() ? GS.ANGEL.x : STAGE.cx - 80;
  },
  get Y() {
    return dpOn() ? GS.ANGEL.y : STAGE.cy - 40;
  },
  get Z() {
    return dpOn() ? 0 : STAGE.h; // (what it stands on: the stage, the chapel's floor)
  },
  // where E works from: the stage in front of it (Downpour: the floor before it, the aisle's end)
  get E() {
    return dpOn()
      ? [GS.ANGEL.x, GS.ANGEL.y - 60]
      : [STAGE.cx - 80, STAGE.cy + 40];
  },
  REACH: 120,
  PRICE: 2500, // (the owner's, Nov 18 13:46Z: "the angel machine costs 2500 now")
  WORK: 5000, // ms it works
  DMG: 1, // more damage a hit
  FAST: 0.8, // attacks 20% faster
  RELOAD: 0.8, // reloads 20% faster
  MAGS: 2, // more magazines (the LMG: 1)
  LMG_MAGS: 1,
  MORE: 0.2, // a gun with no magazine: 20% more (about what two magazines add to the guns that have them)
  BOW: 2, // zombies an Angelic arrow hits (through one)
  SNIPER: 2, // more zombies the sniper's bullet goes through
  CHAIN: 3, // zombies an Angelic chain gun's bullet hits (through two)
  FLAME_FAR: 4 / 3, // the flamethrower reaches a third farther …
  FLAME_SOON: 1.6, // … and gets there sooner
  FLAME_GROUND: 2500, // ms longer its ground burns
  GL_RADIUS: 1 / 3, // the grenade launcher's blast against a grenade's (the owner's words: "1/3rd the explosion radius")
  GL_FIRE: 4, // burning patches it leaves round its blast
  /* the Laser Rifle (the owner's, Nov 17): a beam every 0.75 s and a sixth cooled every 0.75 s, a limit of 6 beams
     (the 7th overheats it), and a 1 in 3 chance of 2 damage to each zombie it goes through (not the +1 of the others) */
  LASER: { cool: 750, heat: 6, two: 1 / 3 },
  /* the Angelic pistol, dual wielded (the owner's, Nov 17 11:07Z): "double the bullets per magazine", "the fire rate
     for dual wield is obviously twice as fast but the reload twice as long", "the explosion radius should be half of
     that of a grenade" */
  PISTOL: { MAG: 2, FIRE: 0.5, RELOAD: 2, BOOM: 0.5 },
};
/* what goes in: guns and melee weapons (WEAPONS), never the grenade or an item */
export const canAngel = (w, weapons) => weapons.includes(w);
/* is duck id's weapon w Angelic? */
export function angelOf(s, id, w) {
  const k = s && s.hang && s.hang.l4a && s.hang.l4a[id];
  if (k && w === "handgun" && k.dg !== undefined) return false; // (down: the down pistol in hand is never Angelic)
  return !!(k && k.ang && k.ang[w] && (k.sl || []).includes(w));
}
/* an Angelic weapon's ammo, full: two more magazines (the LMG one), or MORE more without one */
export function angelAmmo(A, w) {
  if (!A || A.all === undefined) return null;
  if (w === "handgun") {
    const mag = A.mag * ANGEL.PISTOL.MAG;
    return [mag, A.all + A.mag * ANGEL.MAGS - mag];
  } // (the dual pistols: one magazine twice as big, and the two more magazines every Angelic gun gets)
  if (A.mag && A.mag > 2) {
    const more = A.mag * (A.k === "lmg" ? ANGEL.LMG_MAGS : ANGEL.MAGS);
    return [A.mag, A.all - A.mag + more];
  }
  const all = Math.round(A.all * (1 + ANGEL.MORE));
  return A.mag ? [A.mag, all - A.mag] : [all, 0]; // (the double barrel: two shells is no magazine to speak of)
}
export const angelNow = (s) => (s && s.hang && s.hang.l4am) || null;
/* is the machine done with the weapon in it? */
export const angelDone = (m, now) => !!m && now >= m.t + ANGEL.WORK;

/* ---------- the rules' side (l4ddrules.js calls these; h: its helpers) ---------- */
/* E at the machine: put the weapon in hand in (with the power on, the points, nothing in it), or take my orb */
export function angelAct(s, id, a, now, mx, my, h) {
  if (Math.hypot(mx - ANGEL.E[0], my - ANGEL.E[1]) > ANGEL.REACH * 1.6)
    return false;
  const m = angelNow(s),
    kit = h.kitOf(s, id);
  if (!kit) return false;
  if (m) {
    if (m.by !== id || !angelDone(m, now)) return false;
    const sl = [...kit.sl];
    if (sl[m.sl] === "" && !sl.includes(m.w)) sl[m.sl] = m.w;
    else if (!sl.includes(m.w)) {
      if (!h.give(s, id, m.w, a.hand)) return false;
      sl.splice(0, sl.length, ...h.kitOf(s, id).sl);
    }
    const k = h.kitOf(s, id);
    s.hang.l4a = {
      ...s.hang.l4a,
      [id]: {
        ...k,
        sl,
        ang: { ...(k.ang || {}), [m.w]: 1 },
        am: {
          ...k.am,
          ...(h.full(m.w) ? { [m.w]: angelAmmo(h.arm(m.w), m.w) } : {}),
        },
      },
    };
    s.hang.l4am = null;
    h.addFx(s, { kind: "l4angout", by: id, w: m.w, who: [], t: now });
    return true;
  }
  const w = String(a.hand || "");
  if (!powerOn(s) || !kit.sl.includes(w) || !canAngel(w, h.weapons))
    return false;
  if ((kit.ang || {})[w] || h.ptsOf(s, id) < ANGEL.PRICE) return false;
  h.addPts(s, id, -ANGEL.PRICE);
  const i = kit.sl.indexOf(w),
    am = { ...kit.am };
  delete am[w];
  s.hang.l4a = {
    ...s.hang.l4a,
    [id]: {
      ...kit,
      sl: kit.sl.map((x, k) => (k === i ? "" : x)),
      am,
      ...(kit.rw === w ? { rl: 0, rw: "" } : {}),
    },
  };
  s.hang.l4am = { by: id, w, sl: i, t: now };
  h.addFx(s, { kind: "l4angin", by: id, w, who: [], t: now });
  return true;
}
/* a duck that leaves: its weapon in the machine is gone */
export function angelLeft(s, id) {
  const m = angelNow(s);
  if (m && m.by === id) s.hang.l4am = null;
}
