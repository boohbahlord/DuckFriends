/* ---------- what every NPC's brain shares (row 48) ----------
   The owner (Nov 19 19:27Z): "doing a better job at universalizing certain behaviors across different game modes". So a
   behavior that Justin, the merchants and Sandbox's NPCs all have lives here once, and
   each brain calls it with its own numbers. Only sharing: each one does exactly what it did before (tools/npc-golden
   proves it, beat for beat). npcshared.js keeps what the screen reads too (no imports there); this file is the rules'.
   - sees: does an NPC see something (a clear shot, on its own floor).
   - nearest: the one to go after (the nearest, by each brain's own measure).
   - grudge, grudgeOf: whoever hurt an NPC, it goes after for a while, whatever else it would pick.
   - roll: a hit's damage; magOf, reloadOf, refill, spend: an NPC's magazines.
   Keeping them apart is crowd.js (every walker's). An NPC's wounds after a hit are wounds.js hitWounds (its breed: merchant); its HP after a hit is hpmath.js
   hpHurt, as a duck's. */
import { ARMS, GUN_BREEDS } from "./guns.js";
import { clearShot } from "./zombies.js";
import { heightAt } from "./hangout/layout.js";

/* does NPC o (world px: x, y) see t (x, y, z)? Nothing in the way at height z (its own floor unless given), and, with
   floor, t on its floor (less than floor px above or below it); Justin, the merchant and Sandbox's NPCs see any floor (0) */
export function sees(o, t, z = heightAt(o.x, o.y), floor = 60) {
  return (
    clearShot(o.x, o.y, t.x, t.y, z) &&
    (!floor || Math.abs(z - (t.z || 0)) < floor)
  );
}

/* the one in pool that far(t) puts nearest, among those ok(t) lets (the first of them on a tie), or null: Sandbox's
   NPCs' (sbbrain.js decide) */
export function nearest(pool, far, ok = null) {
  let best = null,
    bd = Infinity;
  for (const t of pool) {
    if (ok && !ok(t)) continue;
    const d = far(t);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

/* a grudge: the NPC goes after who (an id or a key, as its brain names its targets) till now + ms, whatever else it
   would pick. The gunmen's last 8 s (GM.MAD), Sandbox's NPCs' 10 s (sbbrain.js MAD) */
export const grudge = (who, now, ms) => [who, now + ms];
/* the one NPC o holds a grudge against now, out of all (idOf: its name as the grudge has it), or null */
export const grudgeOf = (o, now, all, idOf = (t) => t.id) =>
  o.mad && o.mad[1] > now
    ? all.find((t) => idOf(t) === o.mad[0]) || null
    : null;

/* one roll of a weapon's damage: a number, or a whole number from the first to the second ("all": what a duck has, 4) */
export const roll = (d) =>
  d === "all"
    ? 4
    : Array.isArray(d)
      ? d[0] + Math.floor(Math.random() * (d[1] - d[0] + 1))
      : +d || 1;
/* ---------- an NPC's magazines (Sandbox's NPCs); what differs is the breed's row in guns.js GUN_BREEDS (sbnpc) ----------
   mg: the rounds left in each gun (by slot), rl: when each one's reload is done (0: none) */
/* the magazine gun w holds: the breed's own for it, else the gun's, else the breed's for any gun; 0: none, it never runs out (a Sandbox NPC's bow) */
export const magOf = (w, breed) => {
  const B = GUN_BREEDS[breed];
  return (B.mag && B.mag[w]) || ARMS[w].mag || B.magAll || 0;
};
/* how long gun w takes to reload its magazine: its own reload time, else its shells one by one, else 1.5 s */
const reloadOf = (w, breed) =>
  ARMS[w].reload || (ARMS[w].shell ? ARMS[w].shell * magOf(w, breed) : 1500);
/* the reloads that are done fill their magazines (a gun with one, emptied) */
export function refill(guns, mg, rl, now, breed) {
  guns.forEach((g, i) => {
    if (rl[i] && rl[i] <= now && g && magOf(g, breed) && mg[i] <= 0) {
      mg[i] = magOf(g, breed);
      rl[i] = 0;
    }
  });
}
/* n rounds fired from slot i's gun g: off its magazine, and the reload starts once it's empty (a gun with none: nothing) */
export function spend(mg, rl, i, g, n, now, breed) {
  if (!magOf(g, breed)) return;
  mg[i] -= n;
  if (mg[i] <= 0) rl[i] = now + reloadOf(g, breed);
}
