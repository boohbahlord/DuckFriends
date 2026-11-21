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
   the map and how far apart two of them are, in duck lengths, and brainWalk (below) walks and claws as it says. */
import { nearest, grudgeOf, nearPairs, stillShares } from "./npcrules.js";
import { fight, keepAt, reachTo } from "./sbarms.js";

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

/* ---------- brainWalk: Sandbox's walkers, each one's brain decides, one body walks them all ----------
   What their brains planned (sbbrain.js think: [{ me, o, d }]), walked: to its goal (or away from what it flees), round
   a wall, never through one; then it fights its foe; then all are kept apart, and none pushed through a wall. The brain
   stays each kind's own (sbbrain.js, a Seriat file); the walking, the fighting and the crowd are this one, on the board
   (sbspawn.js boardTick) as on a world (sbcabin.js cabinTick). Only units and a few ways differ, by c:
   far(a, b) duck lengths apart; RX, RY a duck's length; reach (its claw's, duck lengths), stopK (how near a claw it
   stops), ptStop (how near a \move\'s spot); speed(o, to, bd); go(o, to, step, bd, stop) and flee(o, to, step, bd) its
   step; walls(o), wallGo(o, ws, x0, y0), wallStops(o, ws, x0, y0); face (the least move that turns it); strike(me, foe, o,
   dmg, w); swipe (ms between swipes). Optional: sees(o, t) (nothing in the way of a shot), onFloor(o, to), after(o, to, d,
   x0, y0) (its floors), still(o) (one that didn't walk), clamp(o) (kept on the board), round(o). dt: the beat's seconds.
   Returns whether any moved or swung */
export function brainWalk(s, now, plans, live, dt, c) {
  let ch = !!plans.ch;
  const moved = new Set();
  for (const { me, o, d } of plans) {
    const to = d.goal || d.flee;
    if (!to) continue;
    moved.add(o);
    const x0 = o.x,
      y0 = o.y,
      bd = c.far(me, to),
      claw = reachTo(c.reach, o, to, s), // (its hitbox, and its foe's: sbarms.js)
      step = c.speed(o, to, bd) * dt,
      stop = d.foe ? keepAt(o, claw) : to.pt ? c.ptStop : claw * c.stopK; // (a gun keeps its distance: sbarms.js; a \move\'s spot: right on it)
    if (d.flee) {
      c.flee(o, to, step, bd);
      ch = true;
    } else if (
      bd > stop ||
      (c.sees && d.foe && o.wp && bd > claw && !c.sees(o, to)) // (a gun keeps its distance once nothing's in the way)
    ) {
      c.go(o, to, step, bd, stop);
      ch = true;
    }
    const ws = c.walls(o);
    if (ws.length) c.wallGo(o, ws, x0, y0); // (round a wall, never through it)
    if (c.after) c.after(o, d.flee ? null : to, d, x0, y0);
    if (Math.abs(o.x - x0) > c.face) o.f = o.x > x0 ? 1 : -1; // (the way it goes: a made NPC's weapon points it, and its picture faces it, so it's hit where it shows, sbbody.js)
    if (
      d.foe &&
      (!c.onFloor || c.onFloor(o, to)) &&
      fight(
        o,
        to,
        bd,
        claw,
        now,
        c.swipe,
        (dm, w) => c.strike(me, d.foe, o, dm, w),
        c.sees && ((t) => c.sees(o, t)),
      )
    ) {
      o.f = to.x < o.x ? -1 : 1;
      ch = true;
    }
  }
  if (c.still) for (const o of live) if (!moved.has(o)) c.still(o);
  /* never in each other: two too close are pushed apart, each only against a few in its own and the next cells (a
     crowd round a duck can have hundreds in a few cells) */
  const was = live.map((o) => [o.x, o.y]);
  nearPairs(
    live,
    c.RX,
    c.RY,
    (A, B) => {
      const ex = (A.x - B.x) / c.RX,
        ey = (A.y - B.y) / c.RY,
        e = Math.hypot(ex, ey);
      if (e >= 0.9) return;
      const [wa, wb] = stillShares(A, B); // (Speed 0: never pushed aside)
      if (!wa && !wb) return;
      const k = e > 1e-3 ? (0.9 - e) / 2 / e : 0.2,
        ux = e > 1e-3 ? ex * k : Math.random() - 0.5,
        uy = e > 1e-3 ? ey * k : Math.random() - 0.5;
      A.x += ux * c.RX * wa;
      A.y += uy * c.RY * wa;
      B.x -= ux * c.RX * wb;
      B.y -= uy * c.RY * wb;
      if (c.clamp) {
        c.clamp(A);
        c.clamp(B);
      }
      ch = true;
    },
    1,
    BRAIN_NEAR,
  );
  live.forEach((o, i) => {
    const ws = c.walls(o);
    if (ws.length && c.wallStops(o, ws, ...was[i])) [o.x, o.y] = was[i]; // (never pushed through a wall)
  });
  if (c.round) for (const o of live) c.round(o);
  return ch;
}
const BRAIN_NEAR = 12; // (the most others each one is kept apart from in a beat)
