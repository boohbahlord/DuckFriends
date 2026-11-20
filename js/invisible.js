/* Who is invisible right now (the owner's, Nov 19 23:17Z): an invisible duck walks through players, NPCs and entities, and
   they through it, so turning visible again never leaves it stuck inside anything (a duck already inside another never
   pins, game.js crowd). Its key keeps the aura on (no end time) or it runs to a time. */
import { invOn } from "./sbgod.js";
export function isInvisible(s, id, now) {
  if (invOn(s, id)) return true; // (Sandbox's own Invisible switch in P: sbgod.js)
  const a = (s.aura || {})[id];
  if (!a || !("invisible" in a)) return false;
  const u = a.invisible;
  return !u || u > now;
}
