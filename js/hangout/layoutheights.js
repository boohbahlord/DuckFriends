/* ---------- Duck Cabin: the heights (the owner's, Nov 22: layout.js split by mechanic, no behavior change): the ground, the
   decks and roofs, what a duck stands on, the sight line between two floors, the ladders. Queries only: the numbers
   are layoutbase.js', the props layout.js' ---------- */
import * as GS from "./stationmap.js";
import {
  DUCK,
  STEP,
  FOOT,
  CABIN,
  DECK,
  STAIRS,
  SLOPE,
  STAGE,
  POOL,
  TRAMP,
  inR,
  smooth,
  PROPS,
  PLATS,
  T,
  variant,
} from "./layoutbase.js";

/* the ground outside: flat on the highground, falling smoothly down the slope, flat again downhill */
export const terrainAt = (y) =>
  SLOPE.low * smooth((y - SLOPE.y0) / (SLOPE.y1 - SLOPE.y0));
export const onStage = (x, y) =>
  x <= STAGE.cx &&
  ((x - STAGE.cx) / STAGE.rx) ** 2 + ((y - STAGE.cy) / STAGE.ry) ** 2 <= 1;
export const onStageStairs = (x, y) =>
  x >= STAGE.sx0 && x < STAGE.sx1 && y >= STAGE.sy0 && y < STAGE.sy1;
const cabinIn = (x, y) =>
  x > CABIN.x0 && x < CABIN.x1 && y > CABIN.y0 && y < CABIN.y1; // (the walls' middle lines)
/* inside (the cabin; on the second map, either building) */
export const inCabin = (x, y) =>
  variant === "l4gs" ? GS.buildingAt(x, y) > 0 : cabinIn(x, y);
/* which building (x, y) is in: 0 outside; the cabin is 1; on the second map 1 the gas station, 2 the chapel. z: the
   feet's height, when known (Downpour: up on a roof is outside) */
export const whereIn = (x, y, z) =>
  variant === "l4gs"
    ? z !== undefined && deckAt(x, y, z)
      ? 0
      : GS.buildingAt(x, y)
    : cabinIn(x, y)
      ? 1
      : 0;
export const inDeck = (x, y) => inR(x, y, [DECK.x0, DECK.y0, DECK.x1, DECK.y1]);
export const inPool = (x, y) => inR(x, y, [POOL.x0, POOL.y0, POOL.x1, POOL.y1]);
export const onTramp = (x, y) =>
  ((x - TRAMP.cx) / TRAMP.rx) ** 2 + ((y - TRAMP.cy) / TRAMP.ry) ** 2 <= 1;

/* things a duck can jump onto and stand on (beds, tables): { x0, y0, x1, y1, top, key }, filled by add() */
export const platAt = (x, y) =>
  PLATS.find(
    (q) =>
      x >= q.x0 &&
      x < q.x1 &&
      y >= q.y0 &&
      y < q.y1 &&
      (!q.hAt || q.hAt(x, y) !== null),
  ) || null;
/* on top of a bed or a table (somewhere a duck jumps up to, never walks to) */
export const onPlatform = (x, y) => !!platAt(x, y);
/* the height of whatever a duck stands on at (x, y) */
export function heightAt(x, y) {
  if (variant === "l4gs") return GS.groundAt(x, y);
  if (onStage(x, y)) return STAGE.h;
  if (onStageStairs(x, y))
    return (
      STAGE.h *
      (1 -
        Math.min(
          STAGE.n - 1,
          Math.floor(((y - STAGE.sy0) / (STAGE.sy1 - STAGE.sy0)) * STAGE.n),
        ) /
          STAGE.n)
    ); // (steps of 12 at most; the top one level with the stage)
  const pl = PLATS.length && platAt(x, y);
  if (pl) return pl.hAt ? pl.hAt(x, y) : pl.top;
  if (
    (x >= CABIN.x0 && x < CABIN.x1 && y >= CABIN.y0 && y < CABIN.y1) ||
    inDeck(x, y)
  )
    return 0;
  if (x >= STAIRS.x0 && x < STAIRS.x1 && y >= STAIRS.y0 && y < STAIRS.y1)
    return y < STAIRS.land
      ? 0
      : (SLOPE.low / STAIRS.n) *
          Math.min(
            STAIRS.n,
            Math.floor(
              ((y - STAIRS.land) / (STAIRS.y1 - STAIRS.land)) * STAIRS.n,
            ) + 1,
          );
  if (onTramp(x, y)) return terrainAt(y) + TRAMP.h; // (a jump gets onto it; trampoline.js bounces it)
  if (inPool(x, y))
    return x < POOL.x0 + 3 * POOL.step &&
      y >= POOL.steps[0] &&
      y < POOL.steps[1]
      ? SLOPE.low - 10 * (Math.floor((x - POOL.x0) / POOL.step) + 1)
      : POOL.h; // (the pool's steps, at its west end)
  return terrainAt(y);
}
/* ---------- floors over the ground (Part B, the owner's, Nov 17 12:28Z: Downpour's roofs) ----------
   A deck (stationmap.js DECKS: the two roofs, the canopy over the pumps) is a floor at its height h over its rectangle,
   but for its holes. The ground (heightAt) is the floor under everything; a deck holds a duck whose feet are at or over
   it (it walks on it, it lands on it), never one under it (it walks under it, inside) */
export const onDeck = (d, x, y) =>
  x >= d.x0 &&
  x < d.x1 &&
  y >= d.y0 &&
  y < d.y1 &&
  (d.inside
    ? d.inside(x, y)
    : !d.holes.some((o) =>
        o.pts
          ? x >= o.bb[0] &&
            x < o.bb[2] &&
            y >= o.bb[1] &&
            y < o.bb[3] &&
            GS.inPoly(x, y, o.pts)
          : x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1,
      )); // (a hole is its ragged edge as drawn, not its box: stationmap.js roofHoleShape)
export const onDeckAt = onDeck;
/* more floors than the map's own: Sandbox's ground zones (Phase 4, sbfloors.js), each a deck with inside(x, y) for its
   shape and its working squares; none outside Sandbox */
const NO_DECKS = [];
export let extraDecks = () => NO_DECKS;
let floorsRule = () => false;
export function setExtraDecks(fn, rule = null) {
  extraDecks = fn || (() => NO_DECKS);
  floorsRule = rule || (() => false);
}
/* do falls go by floors here (Sandbox on a world: plan Phase 4, world.js) */
export const fallsByFloors = () => floorsRule();
/* every floor over the ground here: Downpour's roofs and canopy, and Sandbox's */
export function allDecks() {
  const e = extraDecks();
  if (variant !== "l4gs") return e;
  return e.length ? [...GS.DECKS, ...e] : GS.DECKS;
}
/* up on a roof (or the canopy, or a Sandbox floor) at (x, y), feet at z: on a floor over the ground, not on a thing's top
   (a car: solid all the way down, vehicles.js carDeck) */
export const onRoof = (x, y, z) => {
  const d = deckAt(x, y, z);
  return !!d && !d.solid;
};
/* a floor's height step: the gas station's roof (100%: the owner's, "100% being the roof of the gas station") */
export const floorStep = () => GS.DECKS[0].h;
/* a deck's height at (x, y): its own, or along a Sandbox slope (sbfloors.js hAt) */
export const deckH = (d, x, y) => (d.hAt ? d.hAt(x, y) : d.h);
/* the deck a duck's feet at height z are on or over (the highest at or under z), or null. A slope holds feet a step under
   it too, so a duck walks up it */
export function deckAt(x, y, z) {
  if (z === undefined || z === null) return null;
  const ds = allDecks();
  if (!ds.length) return null;
  let best = null,
    bh = 0;
  for (const d of ds) {
    const h = deckH(d, x, y);
    if (h <= z + (d.hAt ? STEP : 0.5) && (!best || h > bh) && onDeck(d, x, y)) {
      best = d;
      bh = h;
    }
  }
  return best;
}
/* the deck over a duck's head at height z (the lowest over it), or null: a roof it is under */
export function deckOver(x, y, z) {
  const ds = allDecks();
  if (!ds.length) return null;
  let best = null,
    bh = 0;
  for (const d of ds) {
    const h = deckH(d, x, y);
    if (h > z + (d.hAt ? STEP : 0.5) && (!best || h < bh) && onDeck(d, x, y)) {
      best = d;
      bh = h;
    }
  }
  return best;
}
/* the room over a duck's head standing at z, in duck heights, or undefined under the open sky: a jump's head stops there
   (jump.js) */
export function headRoom(x, y, z) {
  const d = deckOver(x, y, z);
  return d ? (deckH(d, x, y) - z - DUCK) / DUCK : undefined;
}
/* the height of the floor under a duck's feet at height z: a deck it is on or over, or the ground (z left out: the
   ground) */
export function floorH(x, y, z) {
  const g = heightAt(x, y),
    d = z >= g ? deckAt(x, y, z) : null,
    h = d ? deckH(d, x, y) : g;
  return h > g ? h : g;
}
/* the same, with what it is: { h, kind: "ground" | "roof" | "canopy", deck } (the outlines' and the footsteps' floor:
   outlines.js, ground.js) */
export function floorAt(x, y, z) {
  const g = heightAt(x, y),
    d = z >= g ? deckAt(x, y, z) : null,
    h = d ? deckH(d, x, y) : g;
  return d && h > g
    ? { h, kind: d.kind, deck: d }
    : { h: g, kind: "ground", deck: null };
}
/* the one rule for a shot (heights.js) between two floors (the owner's, Nov 17 20:02Z: "PROJECTILES WILL NEVER SHOOT AT
   ENEMIES INSIDE A BUILDING IF THEY ARE ON A ROOFTOP UNLESS THEY ARE EXPOSED BY A HOLE IN A CIELINNG THEY ARE DIRECTLY
   UNDERNEATH ... THE ONLY WAY A PLAYER CAN SHOOT DOWN INTO THE GROUUND LEVEL IS BY SHOOTING AT A ZOMBIE NOT COVERED BY A
   BUILDING ... YOU WILL MAKE A SIMPLE AND BASIC PRINCPLE"): a shot reaches a target only if nothing solid is between
   them. On one floor (the ground, or the same roof) only walls can be between, and the shot's own walk checks those. On
   two floors a roof is between, unless both are under the open sky: the one up on its roof, the other with no roof over
   it (off every roof, or right under a hole). So from a roof nothing inside a building or under the pump roof is hit,
   and nothing on a roof is hit from inside or under it. True: something is between */
export function slabBetween(ax, ay, az, bx, by, bz) {
  if (variant !== "l4gs" && !extraDecks().length) return false;
  if (deckAt(ax, ay, az) === deckAt(bx, by, bz)) return false; // (one floor)
  if (SIGHT.on) return !seeLine(ax, ay, az, bx, by, bz);
  return !!deckOver(ax, ay, az) || !!deckOver(bx, by, bz);
}
/* ---------- the sightline (the owner's drawing, Nov 20 02:07Z: "the further the duck goes back, the further a zombie
   has to be from it's ledge to actually have a sightline on said zombie") ----------
   One rule for every height: a straight line from my eyes to the target's head ("Should a target count as seen once its
   head is in sight? Yeah, of course"). Wherever that line, seen from above, passes over a roof or floor (not over a hole
   in it) while it is at that floor's height, the floor is between us. It is the drawing's triangle: from a ledge h high,
   standing b back from its edge with my eyes e over my feet, the ground is out of sight for h * b / e from the ledge
   (similar triangles). It works the same looking up at a roof, through a hole, and across any number of floors.
   Heights are counted in steps of 2.5% of the gas station's roof (100%), the owner's 02:14Z "integers of 2.5% ... as the
   smallest unit", and nothing is stepped through bit by bit: the line's height is a straight line, so where it is
   inside a floor's thickness is worked out once (a division), then cut by the floor's edges and its holes (boxes) */
export const SIGHT = {
  on: !/[?&]nosight\b/.test(
    (globalThis.location && globalThis.location.search) || "",
  ), // (on: the owner's go, Nov 20 02:14Z; ?nosight in the address to compare)
};
export const EYE = DUCK * 0.8; // (my eyes over my feet: about 28% of the roof at Downpour's size)
export const HEAD = DUCK * 0.85; // (a target counts as seen once its head is)
export const SIGHT_UNIT = 0.025; // (2.5% of the roof: the smallest height step)
const SIGHT_SLAB = 16; // (how thick a roof or floor is)
/* where segment (ax, ay) + t (dx, dy), t from 0 to 1, is inside box b ({ x0, y0, x1, y1 }): [t0, t1], or null */
function boxSpan(ax, ay, dx, dy, b) {
  let t0 = 0,
    t1 = 1;
  for (const [p, q] of [
    [-dx, ax - b.x0],
    [dx, b.x1 - ax],
    [-dy, ay - b.y0],
    [dy, b.y1 - ay],
  ]) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    if (t0 > t1) return null;
  }
  return [t0, t1];
}
export function seeLine(ax, ay, az, bx, by, bz) {
  const roof = GS.DECKS[0].h,
    U = roof * SIGHT_UNIT,
    q = (v) => Math.round(v / U) * U,
    ea = q((+az || 0) + EYE),
    eb = q((+bz || 0) + HEAD),
    dx = bx - ax,
    dy = by - ay;
  for (const d of allDecks()) {
    if (d.solid || d.thin) continue; // (a car's top: never a floor between, as the cars never were; nor the plank)
    /* when is the line inside this floor's thickness */
    const lo = q(d.h - SIGHT_SLAB),
      hi = q(d.h);
    let t0, t1;
    if (ea === eb) {
      if (!(ea > lo && ea <= hi)) continue;
      [t0, t1] = [0, 1];
    } else {
      const a = (lo - ea) / (eb - ea),
        b = (hi - ea) / (eb - ea);
      [t0, t1] = [Math.max(0, Math.min(a, b)), Math.min(1, Math.max(a, b))];
      if (t0 >= t1) continue;
    }
    /* ... and over the floor itself */
    const on = boxSpan(ax, ay, dx, dy, d);
    if (!on) continue;
    t0 = Math.max(t0, on[0]);
    t1 = Math.min(t1, on[1]);
    if (t1 - t0 < 1e-6) continue;
    /* ... and not over one of its holes */
    let left = [[t0, t1]];
    for (const h of d.holes) {
      const c = boxSpan(ax, ay, dx, dy, h);
      if (!c) continue;
      left = left.flatMap(([u, v]) =>
        [
          [u, Math.min(v, c[0])],
          [Math.max(u, c[1]), v],
        ].filter(([m, n]) => n - m > 1e-6),
      );
      if (!left.length) break;
    }
    if (left.length && (!d.inside || spanOn(d, ax, ay, dx, dy, left)))
      return false;
  }
  return true;
}
/* a Sandbox floor (its shape, its working squares: d.inside) under any part of the line's spans, looked at every few px */
function spanOn(d, ax, ay, dx, dy, spans) {
  const len = Math.hypot(dx, dy) || 1;
  for (const [u, v] of spans) {
    const n = Math.max(1, Math.ceil(((v - u) * len) / 6));
    for (let i = 0; i <= n; i++) {
      const t = u + ((v - u) * i) / n;
      if (d.inside(ax + dx * t, ay + dy * t)) return true;
    }
  }
  return false;
}
/* the ladders (stationmap.js): up the gas station's back wall (LADDER, side "n"), and leaning on the canopy over the
   pumps from its left (PUMP_LADDER, side "w"). ladderAt: the one whose foot (x, y) is at, outside, where a duck climbs
   it (null: none). ladderTop: where a duck steps off it onto the roof, and that roof's height */
const LADDER_REACH = 34; // (how far out from the wall's face a duck still holds it)
const LADDER_LEAN = 40; // (the canopy's ladder: its foot this far out from the canopy's edge)
export function ladderAt(x, y) {
  if (variant !== "l4gs") return null;
  const A = GS.LADDER,
    face = A.at - T,
    B = GS.PUMP_LADDER,
    out = B.at - LADDER_LEAN;
  if (
    x > A.x0 - 10 &&
    x < A.x1 + 10 &&
    y < face &&
    y > face - FOOT - LADDER_REACH
  )
    return A;
  if (
    y > B.y0 - 10 &&
    y < B.y1 + 10 &&
    x < out + FOOT &&
    x > out - LADDER_REACH
  )
    return B;
  return null;
}
export const atLadder = (x, y) => !!ladderAt(x, y);
/* a duck partway up a ladder, at height z with its feet at (x, y): drawn on the ladder itself, in front of it, and on the
   canopy's (it leans) moving from its feet toward the canopy's edge as it climbs; on the roof only once it is at the top
   (the owner's, Nov 20 16:57Z: "The walk up the ladder should be where ur duck is on the ladder as they move up it
   BEOFRE they are on the roof of the pump"). Only how it is drawn: where it stands (and climbs) is the ladder's foot, as
   before (world.js climb). { dx: east of its feet, g: the ground under its feet, key: in front of the ladder } or null */
export function onLadder(x, y, z) {
  const A = ladderAt(x, y);
  if (!A) return null;
  const g = heightAt(x, y),
    top = ladderTop(A);
  if (!(z > g + 0.5) || z >= top.h - 0.5) return null;
  const t = Math.min(1, (z - g) / (top.h - g)),
    parts = PROPS.filter(
      (p) =>
        /ladder/.test(p.id) &&
        Math.abs(p.x + p.w / 2 - x) < 150 &&
        Math.abs(p.y + p.d / 2 - y) < 150,
    ), // (this ladder's own drawings: its rails, its hoops)
    key = parts.length
      ? Math.max(...parts.map((p) => Math.max(p.key, p.hoopKey || 0)))
      : null;
  return {
    dx: A.side === "w" ? t * Math.max(0, A.at - 6 - x) : 0,
    g,
    key,
  };
}
export const ladderTop = (A = GS.LADDER) =>
  A.side === "w"
    ? { x: A.at + FOOT + 4, y: (A.y0 + A.y1) / 2, h: GS.CANOPY.z }
    : { x: (A.x0 + A.x1) / 2, y: A.at + T + FOOT + 4, h: GS.STATION.wall };

/* a duck on the roof at a ladder's top, as it turns back to it: the ladder it climbs down, and the spot at its foot it
   climbs down to (where a climb up starts: ladderAt finds it there). The owner's, Nov 20 16:57Z, the ladder "where ur
   duck is on the ladder as they move up it", and down it the same way. { A, x, y } or null */
export function ladderDown(x, y, z) {
  if (variant !== "l4gs") return null;
  for (const A of [GS.LADDER, GS.PUMP_LADDER]) {
    const top = ladderTop(A);
    if (Math.abs(z - top.h) > 1) continue;
    if (A.side === "w") {
      if (y >= A.y0 && y <= A.y1 && x >= A.at && x <= top.x + 12)
        return { A, x: A.at - LADDER_LEAN, y };
    } else if (x >= A.x0 && x <= A.x1 && y >= A.at && y <= top.y + 12)
      return { A, x, y: A.at - T - FOOT };
  }
  return null;
}
