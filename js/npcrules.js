/* ---------- what every NPC's brain shares (row 48) ----------
   The owner (Nov 19 19:27Z): "doing a better job at universalizing certain behaviors across different game modes". So a
   behavior that the gunmen, the friendly squad, Justin, the merchants and Sandbox's NPCs all have lives here once, and
   each brain calls it with its own numbers. Only sharing: each one does exactly what it did before (tools/npc-golden
   proves it, beat for beat). npcshared.js keeps what the screen reads too (no imports there); this file is the rules'.
   - sees: does an NPC see something (a clear shot, on its own floor).
   - nearPairs: the NPCs close enough to touch, pair by pair, to keep them apart. */
import { clearShot } from "./l4ddrules.js";
import { heightAt } from "./hangout/layout.js";

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
