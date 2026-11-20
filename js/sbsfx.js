/* ---------- Sandbox's sounds ----------
   What I want heard in Sandbox (the owner, Nov 19: "check for anything in which needs sounds"), read from the state, so
   every player hears them:
   - a point set down in build mode (a spawn, a respawn, a zone, loot: s.sb.pts), a soft knock (sbPlace); one cut or
     deleted, the same knock backwards and quieter (sbCut);
   - a loot orb coming (sbOrb), and one taken (Dead Ducks Arcade's own pickup, dropGot). On the zombie maps an orb can be
     a zombie's drop (its dn), which already has its own sounds (l4ddsfx.js dropIn, l4dd.js dropGot): those are left be.
   On a world each comes from its spot and fades with distance; on the board it is heard by all alike.
   sbHear(s, world): world true on Duck Cabin, the zombie cabin and Downpour (their activity below), false on the board
   (game.js). Cheat mode (sandbox.js) is my own switch, so its chime is played there (sbCheatSound).
   On a world, Sandbox's own NPCs (sbcabin.js) walk the zombies' step path every frame (l4ddsfx.js sbSteps); on the board
   theirs are game.js' (mgjSteps). */
import { play } from "./sound.js";
import { sbSteps } from "./l4ddsfx.js";
import { isSb } from "./sandboxrules.js";
import { activity } from "./hangout/registry.js";
import { W, H } from "./hangout/layout.js";
import { orbsOf } from "./sbloot.js";
import { activeRoom } from "./net.js";
import { epKeep } from "./sbepview.js";

let brkN = null; // (the last item break heard: s.sb.brk.n)
let seen = null; // id → { orbs: its orbs lying (not the zombies' drops), mine: how many of them I took my own copy of, p }
export function sbHear(s, world) {
  if (!isSb(s)) {
    seen = null;
    return;
  }
  epKeep(s); // (an NPC of mine someone I let changed: kept on my device too, sbepview.js)
  const pts = (s.sb && s.sb.pts) || {};
  const first = !seen,
    now = new Map(),
    at = (p) => (world ? { x: p.x * W, y: p.y * H } : {}),
    orbAt = (p, o) =>
      at(o && Number.isFinite(o.x) && Number.isFinite(o.y) ? o : p); // (an orb in a zone lies there)
  const me = activeRoom() && activeRoom().me;
  for (const [id, p] of Object.entries(pts)) {
    const was = seen && seen.get(id),
      orbs = orbsOf(p).filter((o) => o.dn == null), // (a zombie's drop has its own: l4ddsfx.js dropIn)
      mine = orbs.filter((o) => (o.got || []).includes(me)).length;
    now.set(id, { orbs, mine, p });
    if (first) continue;
    if (!was) play("sbPlace", at(p));
    else if (orbs.length > was.orbs.length)
      play("sbOrb", orbAt(p, orbs[orbs.length - 1]));
    else if (orbs.length < was.orbs.length)
      play(
        "dropGot",
        orbAt(
          p,
          was.orbs.find(
            (o) => !orbs.some((n) => n.at === o.at && n.w === o.w),
          ) || was.orbs[0],
        ),
      );
    else if (mine > was.mine) play("dropGot", orbAt(p, orbs[0])); // (my own copy, the others' stays: sbloot.js)
  }
  if (seen && !first)
    for (const [id, was] of seen) if (!now.has(id)) play("sbCut", at(was.p));
  /* a loot item used up that breaks (sbhot.js sbSpend): the melee's breaking sound */
  const brk = (s.sb && s.sb.brk) || null;
  if (brk && brkN != null && brk.n !== brkN) play("break");
  brkN = brk ? brk.n : 0;
  seen = now;
}
/* cheat mode, switched on or off (sandbox.js): a short chime up, or down */
export const sbCheatSound = (on) => play(on ? "cheatOn" : "cheatOff");

activity({
  id: "sbsfx",
  only: "sandbox",
  onState: (s) => sbHear(s, true),
  step: (dt, now, ctx) => sbSteps(ctx),
});
