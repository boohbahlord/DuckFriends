/* ---------- the zombies on a board (Sandbox's spawns, s.mz.zb: sbspawn.js boardTick) ----------
   What a duck's swing, shot or blast does to them, and where my screen draws a shot stopping on one. Each takes what a
   Dead Ducks Arcade zombie takes from the weapon (l4ddrules.js zombieTakes), so one gun mechanic covers every mode. */
import { fxOf } from "./justinmoves.js";
import { hpHurt } from "./hpmath.js";
import { JUSTIN_ID } from "./boardjustin.js";
import { zombieTakes, pierceOf, ALL_HP } from "./l4ddrules.js";
import { ARMS } from "./guns.js";
import { sbOnBoard, boardDuck } from "./sandboxrules.js";
import { hitWounds, WOUND_BREEDS } from "./wounds.js";
import { MAD } from "./sbbrain.js";
import { grudge } from "./npcrules.js";
import { npcBody, duOf } from "./sbbody.js";

/* the weapon a shot's kind comes from (rules.js names some shots after what they are) */
const SHOT_ARM = {
  pellet: "shotgun",
  arrow: "bow",
  slug: "dbarrel",
  lgren: "glauncher",
};
const armOf = (k) => SHOT_ARM[k] || k;
/* duck by's hit on the zombies with weapon w: near(x, y, big, body) says which are in reach. Each takes what a Dead
   Ducks Arcade zombie takes from w (its damage, its headshots and its misses; the owner's, Nov 17 16:23Z), with "CRIT"
   or "missed" over it as there. sh: a shot, from (sh.x0, sh.y0); it hits the nearest first, each zombie once (sh.zh),
   goes on past the ones it missed (sh.zp) and stops at the first it hits, or after pierceOf. take(n): a blast's damage
   from what near said. True when the shot stops here, or a swing or blast hit any */
export function zombieHit(s, near, w, now, by, sh = null, take = null) {
  const z = s.mz;
  if (!z || !z.zb || !sbOnBoard(s)) return false;
  const seen = sh ? [...(sh.zh || []), ...(sh.zp || [])] : [];
  const ns = new Map(); // (what near said of each: a blast's ring, take(n))
  let got = z.zb.filter(
    (o) =>
      !o.d &&
      !seen.includes(o.i) &&
      ns
        .set(
          o,
          near(o.x, o.y, o.hb || 1, z.sb ? npcBody(s, o, duOf(s, by)) : null),
        )
        .get(o),
  ); // (o.hb: a Seriat file's hitbox, sbseriat.js. Sandbox's: its body, only where its picture shows, sbbody.js)
  if (!got.length) return false;
  if (sh)
    got.sort(
      (a, b) =>
        Math.hypot(a.x - sh.x0, a.y - sh.y0) -
        Math.hypot(b.x - sh.x0, b.y - sh.y0),
    );
  const fx = fxOf(s, now, JUSTIN_ID),
    most = !sh || w === "laser" ? Infinity : Math.max(1, pierceOf(s, by, w));
  let hit = false;
  for (const o of got) {
    if (sh && (sh.zh || []).length >= most) break;
    const t = take ? take(ns.get(o)) : zombieTakes(s, by, w, sh && sh.dr), // (a drawn arrow: its draw, bowdraw.js)
      A = ARMS[w] || {},
      cut = sh && A.halve ? A.halve ** (sh.zh || []).length : 1; // (the slug: half to each one after, guns.js)
    if (t && t.dmg < ALL_HP && t.dmg * cut < (A.least || 0)) break;
    if (t) t.dmg *= cut;
    if (!t) {
      if (sh) sh.zp = [...(sh.zp || []), o.i];
      fx({ kind: "l4miss", b: 1, x: o.x, y: o.y });
      continue;
    }
    if (sh) sh.zh = [...(sh.zh || []), o.i];
    hit = true;
    o.hp = t.dmg >= ALL_HP ? 0 : hpHurt(o.hp, t.dmg); // (in hundredths, as every HP: hpmath.js)
    o.w = hitWounds(o.w, w, WOUND_BREEDS.zombie, { head: t.crit, dead: !o.hp }); // (its wounds, as Dead Ducks Arcade's zombie gets them: wounds.js)
    if (o.hp <= 0) o.d = now;
    if (z.sb && by) o.mad = grudge("p:" + by, now, MAD); // (Sandbox's: it goes after whoever hurt it, sbbrain.js)
    if (o.d && (w === "grenade" || w === "glauncher") && !o.w.includes("g0"))
      o.w += "g0"; // (a blast's gore: every chunk, cuts and big holes, as there)
    if (t.crit)
      fx({ kind: "l4crit", b: 1, x: o.x, y: o.y, ...(o.hp && { m: 1 }) }); // (a crit: the CRIT, and its head if it killed; m: only the mark)
  }
  return sh ? (sh.zh || []).length >= most : hit;
}
/* a duck's shot this beat, from (x0, y0) to (x0 + dx, y0 + dy) at height z: true when a zombie stopped it */
export function zombieShot(s, sh, x0, y0, dx, dy, now, z = 0.41) {
  if (!sbOnBoard(s) || sh.fake) return false;
  const [rx, ry] = boardDuck(s); // (Sandbox's bigger board: a duck is less of it)
  const near = (x, y, r = 1, body = null) => {
    if (body) return body.line(x0, y0, x0 + dx, y0 + dy, z) >= 0; // (Sandbox's NPCs: where the shot, at its height z, meets what shows of it, sbbody.js)
    const ux = dx / rx,
      uy = dy / ry,
      px = (x - x0) / rx,
      py = (y - y0) / ry,
      len = ux * ux + uy * uy;
    const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    return Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1) * r;
  };
  return zombieHit(s, near, armOf(sh.k), now, sh.by, sh);
}
/* where a duck's shot I draw stops on a zombie (the owner's, Nov 17 20:37Z: bullets that don't pass through zombies are
   seen stopping on them): the host finds the hit at its next beat and my screen hears of it later, so on my screen it
   stops where it meets one. From where I last drew it (x0, y0) to where I draw it now (x1, y1), board shares, in the
   order it gets to them. r: what I know of this shot: skip, the zombies it has gone past, n, how many it has hit; the
   one that makes it pierceOf (or 1) stops it. { x, y, i } where it stops (i: the zombie's number), or null */
export function zombieStop(s, sh, r, x0, y0, x1, y1) {
  if (!sbOnBoard(s) || sh.by === JUSTIN_ID || sh.fake) return null;
  const [rx, ry] = boardDuck(s),
    ux = (x1 - x0) / rx,
    uy = (y1 - y0) / ry,
    len = ux * ux + uy * uy,
    meets = []; // [how far along (0 … 1), the zombie's number]
  for (const o of (s.mz && s.mz.zb) || []) {
    if (o.d || r.skip.has(o.i)) continue;
    const px = (o.x - x0) / rx,
      py = (o.y - y0) / ry,
      k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    if (Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1))
      meets.push([k, o.i]);
  }
  const most = Math.max(1, pierceOf(s, sh.by, armOf(sh.k)));
  for (const [k, i] of meets.sort((a, b) => a[0] - b[0])) {
    r.skip.add(i);
    if (++r.n < most) continue; // (the sniper's: on through it)
    return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, i };
  }
  return null;
}
