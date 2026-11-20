/* ---------- Sandbox: what a spawned NPC does (stage 2b), on every map ----------
   The owner's Sandbox file, its behavior lists, each one any number of Players, Everything, a kind (a zombie, a Blank NPC,
   Justin, a Test NPC) or a spawn by its name or color:
   - Target: what it goes after and attacks.
   - Ignore: what it leaves alone, "and it defends itself if attacked after taking one damage (neutrality)": whatever
     hurts it, it goes after for a while (MAD), whatever the lists say.
   - Avoid: what it runs from, once one comes near.
   - Protect: what it guards: it keeps by it and goes after whatever comes for it.
   A zombie whose spawn never set its Target goes after the players; the others go after nothing.
   decide() is the same on the board and on the worlds: the map's tick (sbspawn.js, sbcabin.js) gives it the things on
   the map and how far apart two of them are, in duck lengths, and walks and claws as it says. */
import { nearest, grudgeOf } from "./npcrules.js";

export const MAD = 10000; // ms it goes after whatever hurt it
export const FLEE = 4; // duck lengths: an avoided one this near, it runs
export const GUARD = { NEAR: 1.5, WATCH: 4 }; // (it keeps this near its charge; a threat this near its charge, it goes for)

const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
/* the lists of spawn p for one of its NPCs, o (box(p, f): what the box says, sbspawn.js boxText; set(p, f): was it
   ever written; def: a made NPC's own lists, which it keeps where the spawn wrote none: sbnpcs.js) */
export function listsOf(p, o, box, set, def = null) {
  const of = (f) => words(set(p, f) || !def ? box(p, f) : def[f]);
  const T =
    set(p, "target") || def
      ? of("target")
      : (o.k || "zombie") === "zombie"
        ? ["players"]
        : [];
  const L = {
    T,
    I: of("ignore"),
    A: of("avoid"),
    P: of("protect"),
  };
  L.np = [L.T, L.A, L.P].some((ws) =>
    ws.some((w) => w !== "players" && w !== "player"),
  ); // (it looks at other NPCs too: else only the ducks are looked through, so 800 zombies cost little)
  return L;
}
/* a thing on the map: { key ("p:" a duck's id, "n:" an NPC's number), duck (true for a player), k (an NPC's kind), tags
   (its spawn's color and name), g (the groups it's in), x, y } */
export const keyOf = (t) => t.key;
export function matches(ws, t) {
  if (!ws.length) return false;
  if (ws.includes("everything")) return true;
  if ((t.g || []).some((g) => ws.includes("g:" + g))) return true; // (a group it's in: sbgroups.js)
  if (t.duck) return ws.includes("players") || ws.includes("player");
  return ws.includes(t.k) || (t.tags || []).some((g) => ws.includes(g));
}
/* what NPC me does now: { goal, foe, flee } (things, or none). all: everything on the map, me among them; ducks: the
   players among them; far(a, b): duck lengths between two */
export function decide(me, L, all, ducks, far, now) {
  const pool = L.np ? all : ducks,
    near = (ok) =>
      nearest(
        pool,
        (t) => far(me, t),
        (t) => t.key !== me.key && ok(t),
      );
  const mad = grudgeOf(me, now, all, (t) => t.key);
  if (mad) return { goal: mad, foe: mad };
  if (L.A.length) {
    const scary = near((t) => matches(L.A, t) && far(me, t) < FLEE);
    if (scary) return { flee: scary };
  }
  if (L.P.length) {
    const charge = near((t) => matches(L.P, t));
    if (charge) {
      const threat = near(
        (t) =>
          t !== charge &&
          far(charge, t) < GUARD.WATCH &&
          (t.fo === charge.key ||
            (matches(L.T, t) && !matches(L.I, t) && t.key !== charge.key)),
      );
      if (threat) return { goal: threat, foe: threat };
      return far(me, charge) > GUARD.NEAR ? { goal: charge } : {};
    }
  }
  if (!L.T.length) return {};
  const prey = near((t) => matches(L.T, t) && !matches(L.I, t));
  return prey ? { goal: prey, foe: prey } : {};
}
