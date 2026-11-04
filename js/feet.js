/* ---------- footsteps in every mode ----------
   The owner (Nov 4): the ducks' walking makes a quiet sound in every game mode, not only in Quacky Zombies. It is
   Quacky Zombies' own footstep (l4ddsfx.js), softer: mine a little louder than the others'. A step every STRIDE of the
   way a duck walks, none while it's in the air or knocked flying; at most CAP steps in any STEP_MS, so a board full of
   ducks walking at once stays a few soft pats and never piles up voices.

     feet(list, scale, stride, me, world)   every frame: list [[id, x, y, up]] (x, y: where it's drawn, 0 … 1; up: how
                                     high it is off its ground, px), scale [w, h] to px, stride (px), me: my id, world:
                                     Duck Cabin's (x, y are its world then, and a step far from my duck is fainter) */
import { play } from "./hangout/sounds.js";
import "./l4ddsfx.js"; // (the footstep itself)

const CAP = 3, // steps at once …
  STEP_MS = 150, // … in this long
  K_ME = 0.4, // my steps' loudness (1 = Quacky Zombies' own)
  K_OTHER = 0.28; // everyone else's
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
    const d = Math.hypot(px - o.x, py - o.y);
    o.x = px;
    o.y = py;
    if (x < 0 || up > 1 || d > stride * 1.5) continue; // (off the board, in a jump, or put somewhere new)
    o.acc += d;
    if (o.acc < stride) continue;
    o.acc %= stride;
    if (recent.length >= CAP) continue;
    recent.push(now);
    play("l4step", {
      k: id === me ? K_ME : K_OTHER,
      ...(world ? { x: px, y: py } : {}),
    });
  }
  for (const id of seen.keys()) if (!here.has(id)) seen.delete(id);
}
