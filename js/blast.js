/* ---------- explosions: one module (the cornerstone, Nov 20: one module per mechanic) ----------
   Every blast goes through here: the board's and Hangout's (boardfire.js), and the zombie maps' (l4ddrules.js), with
   their gunmen (gunmenrules.js). Who is in one is measured one way (reach): an ellipse round where it went off, and only
   where its world lets it reach (ok: Hangout's side of the cabin's walls and its height, the maps' nothing solid
   between), in the rings of tiles it does its damage by (the owner's, Nov 21 19:07Z). What it does to each one stays
   that body's own: each kind's damage and push are the caller's (hit). */
import { TILE } from "./units.js";
import { BLAST } from "./gamedefaults.js";

/* the rings (gamedefaults.js BLAST): ring 1 is the 2x2 of tiles round the tile corner it went off at (its center
   snaps to the nearest one), always a crit; ring 2 the next, as strong; each after does half the one inside. A tile's
   ring: how far its center is from that corner, in rings, rounded up, so the corners are cut round. RINGS: the last one
   that does BLAST.LEAST or more; REACH: how far that is, in duck lengths (a ring of 1 tile: 6 rings, 1.5 ducks) */
const ringDmg = (k) => (k <= 2 ? BLAST.CENTER : BLAST.CENTER / 2 ** (k - 2));
let RINGS = 1;
while (ringDmg(RINGS + 1) >= BLAST.LEAST) RINGS++;
export const REACH = RINGS * BLAST.RING * TILE;
/* a hit's damage as every crit makes it: twice (gunmen and ducks take it so; strike doubles a zombie's itself) */
export const hitOf = (n) => ({ dmg: n.dmg * (n.crit ? 2 : 1), crit: n.crit });

/* the measure of a blast at (x, y): rx, ry, how far a duck length is each way; wide, its rings that much wider (the
   Angelic pistol's and launcher's smaller ones); ok(x, y, z, side), whether it gets there at all. near(x, y, z, side,
   big) gives { d (duck lengths, from the corner it snapped to), dx, dy, ring, dmg, crit } for one in it, else null. A
   body's ring is its nearest tile's, of its body only (the owner's: "hats and outfits do not count as hitbox, only the
   duck does"): a duck's footprint, a duck length across and half a duck deep, times big (a duck over 100%, a Seriat NPC's
   hitbox) */
export function reach(B) {
  const T = TILE,
    w = BLAST.RING * (B.wide || 1),
    cx = Math.round(B.x / B.rx / T) * T, // (the tile corner it went off at, in duck lengths)
    cy = Math.round(B.y / B.ry / T) * T;
  return (px, py, pz, side = 0, big = 1) => {
    const dx = px / B.rx - cx,
      dy = py / B.ry - cy,
      d = Math.hypot(dx, dy),
      ux = d ? dx / d : 0,
      uy = d ? dy / d : 0,
      foot = d ? big / Math.hypot(ux / 0.5, uy / 0.25) : 0, // (its footprint's edge toward the corner)
      e = Math.max(0, d - foot), // (its nearest part)
      tx = Math.floor((cx + ux * e) / T) + 0.5, // (that part's tile's center, in tiles)
      ty = Math.floor((cy + uy * e) / T) + 0.5,
      ring = Math.max(1, Math.ceil(Math.hypot(tx - cx / T, ty - cy / T) / w));
    if (ring > RINGS || (B.ok && !B.ok(px, py, pz, side))) return null; // (the ring first: ok can cost)
    const crit = ring === 1 || Math.random() < BLAST.CRIT;
    return { d, dx, dy, ring, dmg: ringDmg(ring), crit };
  };
}

/* a blast over every kind of body in its world, in turn: [list (or a fn giving it, read when its turn comes), where(b) (its [x, y, z, side, big], or null when it
   can't be hit), hit(b, n) (its own effect; true when it counts as a hit)], or a kind that finds its own (fn(near)).
   True when any hit counted */
export function blast(near, kinds) {
  let any = false;
  for (const k of kinds) {
    if (typeof k === "function") {
      any = k(near) === true || any;
      continue;
    }
    const [list, where, hit] = k;
    for (const b of typeof list === "function" ? list() : list) {
      const at = where(b),
        n = at && near(...at);
      if (n && hit(b, n) === true) any = true;
    }
  }
  return any;
}
