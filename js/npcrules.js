/* ---------- what every NPC's brain shares (row 48) ----------
   The owner (Nov 19 19:27Z): "doing a better job at universalizing certain behaviors across different game modes". So a
   behavior that the gunmen, the friendly squad, Justin, the merchants and Sandbox's NPCs all have lives here once, and
   each brain calls it with its own numbers. Only sharing: each one does exactly what it did before (tools/npc-golden
   proves it, beat for beat). npcshared.js keeps what the screen reads too (no imports there); this file is the rules'.
   - sees: does an NPC see something (a clear shot, on its own floor). */
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
