/* ---------- the doors: they swing open while a duck is near and close behind it ----------
   Drawn only (shapes.js draws each door shut and open; this file marks the prop "open"): nothing in the room's state, so
   every screen works it out from where the ducks are. Doors never block walking. Other things that walk (the cabin's
   characters) open them too: addOpeners(fn), fn(s) → [[x, y], …] in world px. */
import { activity } from "./registry.js";
import { DOORWAYS, W, H } from "./layout.js";

const NEAR = 90; // world px from the door's line, either side
const openers = [];
export const addOpeners = (fn) => {
  openers.push(fn);
};
/* is anyone at this doorway? */
export function doorOpen(s, d) {
  const pts = [];
  for (const id of s.seat || []) {
    const p = s.pos[id];
    if (p) pts.push([p.x * W, p.y * H]);
  }
  for (const fn of openers) pts.push(...(fn(s) || []));
  return pts.some(([x, y]) =>
    d.axis === "y"
      ? Math.abs(x - d.at) < NEAR && y > d.a - 20 && y < d.b + 20
      : Math.abs(y - d.at) < NEAR && x > d.a - 20 && x < d.b + 20,
  );
}

activity({
  id: "doors",
  kinds: ["door"],
  propClass: (p, s) => (doorOpen(s, p.door) ? "open" : ""),
});
