/* ---------- footsteps in every mode ----------
   The owner (Nov 4): the ducks' walking makes a quiet sound in every game mode; (Nov 16) "very quiet for ducks", a real
   recording (a light step on wood: sound.js "step"); (Nov 17) on Duck Cabin, the same step by the ground under it
   (ground.js). A step every STRIDE of the way a duck walks, none while it's in the air or knocked flying; at most CAP
   steps in any STEP_MS, so a board full of ducks walking at once stays a few soft pats and never piles up voices. Mine
   a little louder than the others'.

     feet(list, scale, stride, me, world)   every frame: list [[id, x, y, up]] (x, y: where it's drawn, 0 … 1; up: how
                                     high it is off its ground, px), scale [w, h] to px, stride (px), me: my id, world:
                                     Duck Cabin's (x, y are its world then, and a step far from my duck is fainter) */
import { play } from "./sound.js";
import { groundAt, stepOf } from "./ground.js";
import { heightAt } from "./hangout/layout.js";

const CAP = 3, // steps at once …
  STEP_MS = 150, // … in this long
  K_ME = 1, // my steps' loudness (sound.js VOL.step) …
  K_OTHER = 0.7, // … and everyone else's
  STROKE = 1.6, // swimming: a stroke's splash every this many steps' way
  FALL = 50; // world px: landing this far below where it last stood is a fall (a thud), not a jump
const seen = new Map(),
  recent = [];

export function feet(list, [w, h], stride, me, world = false) {
  const now = performance.now();
  while (recent.length && now - recent[0] > STEP_MS) recent.shift();
  const here = new Set();
  for (const [id, x, y, up] of list) {
    here.add(id);
    const px = x * w,
      py = y * h;
    let o = seen.get(id);
    if (!o) seen.set(id, (o = { x: px, y: py, acc: 0 }));
    const d = Math.hypot(px - o.x, py - o.y),
      z = world ? heightAt(px, py) + (up || 0) : 0;
    o.x = px;
    o.y = py;
    /* on Duck Cabin, a fall (off the deck, the balcony) lands with a thud: landing well below where it last stood */
    if (world && x >= 0) {
      const air = up > 1;
      if (!air) {
        if (o.air && o.from - z > FALL && d <= stride * 1.5)
          play("thud", {
            x: px,
            y: py,
            z,
            k:
              (id === me ? K_ME : K_OTHER) *
              Math.min(1, 0.5 + (o.from - z) / 400),
          });
        o.from = z;
      }
      o.air = air;
    }
    if (x < 0 || up > 1 || d > stride * 1.5) continue; // (off the board, in a jump, or put somewhere new)
    /* on Duck Cabin, by the ground under it (ground.js: grass, wood, water …; swimming, a stroke every STROKE steps) */
    const g = world ? groundAt(px, py, z) : "wood",
      every = g === "deep" ? stride * STROKE : stride;
    o.acc += d;
    if (o.acc < every) continue;
    o.acc %= every;
    if (recent.length >= CAP) continue;
    recent.push(now);
    play(stepOf(g), {
      k: id === me ? K_ME : K_OTHER,
      ...(world ? { x: px, y: py, z } : {}),
    });
  }
  for (const id of seen.keys()) if (!here.has(id)) seen.delete(id);
}
