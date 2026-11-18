/* ---------- Dead Ducks Arcade online: the zombies far from everyone, sent less often ----------
   The owner (Nov 18 14:20Z): "send zombies positions less often yeah but only for when they are not on the given
   player's screen for their machine maybe". Every zombie's spot is s.hang.zp (l4ddrules.js), and the host sends it
   every heartbeat. Online, the host now splits it in two before it goes out (online.js): zp keeps the zombies near some
   player's duck, every heartbeat as before; zq has the ones near nobody, sent again only twice a second (FAR_MS), or at
   once when one comes, dies or goes, so the minimap still shows them. A screen that gets the state puts the two back
   together (wireIn), so the rest of the game never sees the split. The host's own state keeps them all, always.
   "Near": inside the biggest screen a player can have (Duck Cabin's camera shows at most about 1650 × 1040 world px,
   world.js measure), around that player's duck, and two ducks more (as far out as anything is drawn: world.js
   onView), with room to spare for a camera held in from the map's edge. A zombie walking from far to near is sent at
   full rate from out there, before it shows. */
import { W, H } from "./hangout/layout.js";

const NEAR_X = 1000, // (world px either side of a duck)
  NEAR_Y = 700,
  FAR_MS = 500; // (the far ones: twice a second)
let farAt = 0,
  farSig = "",
  farSent = [];

/* the state as it goes online: zp split into near (zp) and far (zq); t: now. Anything else goes as it is */
export function wireOut(s, t) {
  const zp = s && s.hang && s.hang.zp;
  if (!Array.isArray(zp) || !zp.length) {
    farSig = "";
    farSent = [];
    return s;
  }
  const ducks = [];
  for (const id of s.seat || []) {
    const p = s.pos && s.pos[id];
    if (p && p.x === +p.x && p.y === +p.y) ducks.push(p.x * W, p.y * H);
  }
  if (!ducks.length) return s;
  const near = [],
    far = [],
    ids = [];
  for (let i = 0; i + 3 < zp.length; i += 4) {
    const x = zp[i + 1],
      y = zp[i + 2];
    let seen = false;
    for (let j = 0; j < ducks.length && !seen; j += 2)
      seen =
        Math.abs(x - ducks[j]) <= NEAR_X &&
        Math.abs(y - ducks[j + 1]) <= NEAR_Y;
    (seen ? near : far).push(zp[i], x, y, zp[i + 3]);
    if (!seen) ids.push(zp[i]);
  }
  /* the far ones again: twice a second, or at once when which ones are far changes (one came near, came, died or
     went: k, its state, counts too, so a far one's death shows on the minimap at once) */
  const sig = ids.join() + "|" + far.filter((_, i) => i % 4 === 3).join();
  if (sig !== farSig || t - farAt >= FAR_MS) {
    farSig = sig;
    farAt = t;
    farSent = far;
  }
  return { ...s, hang: { ...s.hang, zp: near, zq: farSent } };
}

/* the state as it came in: zq put back into zp (each zombie once: the near one's spot, fresher, wins) */
export function wireIn(s) {
  const h = s && s.hang;
  if (!h || !("zq" in h)) return s;
  const zq = Array.isArray(h.zq) ? h.zq : [],
    zp = Array.isArray(h.zp) ? h.zp : [],
    have = new Set();
  for (let i = 0; i + 3 < zp.length; i += 4) have.add(zp[i]);
  const all = zp.slice();
  for (let i = 0; i + 3 < zq.length; i += 4)
    if (!have.has(zq[i])) all.push(zq[i], zq[i + 1], zq[i + 2], zq[i + 3]);
  const hang = { ...h, zp: all };
  delete hang.zq;
  return { ...s, hang };
}
