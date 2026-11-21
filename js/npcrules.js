/* ---------- what every NPC's brain shares (row 48) ----------
   The owner (Nov 19 19:27Z): "doing a better job at universalizing certain behaviors across different game modes". So a
   behavior that the gunmen, the friendly squad, Justin, the merchants and Sandbox's NPCs all have lives here once, and
   each brain calls it with its own numbers. Only sharing: each one does exactly what it did before (tools/npc-golden
   proves it, beat for beat). npcshared.js keeps what the screen reads too (no imports there); this file is the rules'.
   - sees: does an NPC see something (a clear shot, on its own floor).
   - nearPairs: the NPCs close enough to touch, pair by pair, to keep them apart.
   - nearest: the one to go after (the nearest, by each brain's own measure).
   - grudge, grudgeOf: whoever hurt an NPC, it goes after for a while, whatever else it would pick.
   - roll, reloadMs, refill, shotMark: an NPC's guns (a hit's damage, a reload, the magazines, where a shot went).
   - woundsAfter: the wounds a hit leaves (a headshot that kills, a blast that kills, any other hit). An NPC's HP after a
     hit is hpmath.js hpHurt, as a duck's. */
import { ARMS } from "./l4ddrules.js";
import { clearShot } from "./zombies.js";
import { heightAt } from "./hangout/layout.js";
import { woundCode, DEATH } from "./wounds.js";

/* does NPC o (world px: x, y) see t (x, y, z)? Nothing in the way at height z (its own floor unless given), and, with
   floor, t on its floor (less than floor px above or below it). The gunmen and the friendly squad keep to their floor
   (60); the sniper, Justin, the merchant and Sandbox's NPCs see any floor (0) */
export function sees(o, t, z = heightAt(o.x, o.y), floor = 60) {
  return (
    clearShot(o.x, o.y, t.x, t.y, z) &&
    (!floor || Math.abs(z - (t.z || 0)) < floor)
  );
}

/* every pair of NPCs near enough to touch, each pair once (b numbered after a: b.i > a.i), for keeping them apart: the
   ones in a's cell of a grid of cw x ch world px (made once, where they stood) and in the 8 cells round it. passes: how
   many times over them all; most: how many others each one is kept apart from (Sandbox's NPCs: a crowd costs little).
   Quacky Zombies' zombies and Sandbox's NPCs; each push is the caller's own (fn(a, b)) */
/* two NPCs too close: each one's share of the push apart. One with Speed 0 never moves (the owner's, Nov 20 17:25Z: "Spawns
   or respawns dont move off their position anymore to make room, since their movement being zero means zero"), so the
   other takes all of it; both 0: neither */
export const stillShares = (A, B) => {
  const a = A.sv === 0 ? 0 : 1,
    b = B.sv === 0 ? 0 : 1;
  return [a && (b ? 1 : 2), b && (a ? 1 : 2)];
};
export function nearPairs(live, cw, ch, fn, passes = 1, most = Infinity) {
  const grid = new Map(),
    key = (cx, cy) => cx * 100000 + cy;
  for (const o of live) {
    const k = key(Math.floor(o.x / cw), Math.floor(o.y / ch));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(o);
  }
  for (let pass = 0; pass < passes; pass++)
    for (const a of live) {
      const cx = Math.floor(a.x / cw),
        cy = Math.floor(a.y / ch);
      let n = 0;
      for (let dx = -1; dx <= 1 && n < most; dx++)
        for (let dy = -1; dy <= 1 && n < most; dy++)
          for (const b of grid.get(key(cx + dx, cy + dy)) || []) {
            if (b.i <= a.i) continue;
            if (++n > most) break;
            fn(a, b);
          }
    }
}

/* the one in pool that far(t) puts nearest, among those ok(t) lets (the first of them on a tie), or null: the gunmen's
   and the friendly squad's target and the zombie they shoot first, Sandbox's NPCs' (sbbrain.js decide) */
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
/* how long gun w takes to reload a magazine of mag rounds: its own reload time, else its shells one by one, else 1.5 s */
export const reloadMs = (w, mag = ARMS[w].mag) =>
  ARMS[w].reload || (ARMS[w].shell ? ARMS[w].shell * mag : 1500);
/* the reloads that are done fill their magazines: guns (its guns, by slot), mg (rounds in each), rl (when each one's
   reload is done, 0: none), full(g): a full magazine of g; ok(g, i): may this one fill (Sandbox's: a gun with a magazine,
   and empty) */
export function refill(guns, mg, rl, now, full, ok = null) {
  guns.forEach((g, i) => {
    if (rl[i] && rl[i] <= now && (!ok || ok(g, i))) {
      mg[i] = full(g);
      rl[i] = 0;
    }
  });
}
/* where a shot at t went, as the screen draws it ([when, x, y]): off px from it (0: a hit) at angle a, half as far up and
   down (the floor seen from above) */
export const shotMark = (now, t, a, off) => [
  now,
  Math.round(t.x + Math.cos(a) * off),
  Math.round(t.y + Math.sin(a) * off * 0.5),
];

/* an NPC's wounds after a hit by weapon w (wounds.js codes; had: its wounds so far). Killed by a headshot (a crit): its
   head blown off, once. Killed by a blast: torn apart (every DEATH code it hasn't got). Any other hit: the weapon's own
   wound, where can() says what can be knocked off it (a hat, a face item), worked out only then. The gunmen's (and the
   friendly squad's) and the merchants' */
export const woundsAfter = (had, w, dead, head, blast, can = () => ({})) =>
  dead && head
    ? had.includes("x")
      ? had
      : had + "x0"
    : dead && blast
      ? had + DEATH.filter((c) => !had.includes(c)).join("")
      : had + woundCode(had, w, can());
