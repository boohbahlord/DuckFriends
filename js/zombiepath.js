/* ---------- the zombies' way to the ducks on a map: its cells and its flow field ----------
   The grid over the map (Duck Cabin's cabin and deck, or all of Downpour), what each cell costs to walk, and the
   walking distance from every cell to the nearest duck (flowfield.js fieldOf works it out, on the page or in its
   worker). Its own file: the way is its own mechanic (pathing), and flowfield.js stands alone so its worker can run it.
   Moved here from l4ddrules.js as it was. */
import {
  STEP,
  heightAt,
  standable,
  onPlatform,
  layoutRev,
} from "./hangout/layout.js";
import { fieldOf, askField, stepper } from "./flowfield.js";
import { playable, OPENINGS, dp, syncMap } from "./l4ddrules.js";

/* ---------- the zombies' way to the ducks: a flow field ----------
   A grid of 40-px cells over the cabin and the deck (built once). Every heartbeat, the walking distance from every cell
   to the nearest duck standing, all at once (Dijkstra from all of them); each zombie walks downhill on it, so it takes
   the way of least walking, never the duck nearest through a wall. */
export const CELL = 40;
let GX = 1280,
  GY = 580;
export let GW = 82,
  GH = 52; // (Downpour's grid covers its whole world: syncMap)
export const setGrid = (g) => ([GX, GY, GW, GH] = g); // (the map's grid, as syncMap finds it: l4ddrules.js)
const BOARD_COST = 6; // (cells' worth of walking)
export let walk = null;
let extra = null,
  walkRev = -1, // (the cabin it was made for: layout.js' layoutRev)
  hts = null;
const cellAt = (x, y) => {
  const i = Math.floor((x - GX) / CELL),
    j = Math.floor((y - GY) / CELL);
  return i < 0 || j < 0 || i >= GW || j >= GH ? -1 : j * GW + i;
};
export const mid = (c) => [
  GX + (c % GW) * CELL + CELL / 2,
  GY + Math.floor(c / GW) * CELL + CELL / 2,
];
export function cells() {
  syncMap();
  if (walk && walkRev === layoutRev()) return walk;
  walkRev = layoutRev();
  FLOWS.clear(); // (their ways were for the cabin before)
  walk = new Uint8Array(GW * GH);
  hts = new Float32Array(GW * GH);
  for (let c = 0; c < GW * GH; c++) {
    const [x, y] = mid(c),
      z = heightAt(x, y);
    hts[c] = z;
    walk[c] =
      playable(x, y) && standable(x, y, z, 0, null, true) && !onPlatform(x, y)
        ? 1
        : 0;
  }
  /* Downpour: a boarded hole's cells cost a few more (a zombie goes round by an open way if it isn't much further, or
     stops at the boards and tears them down) */
  extra = new Float32Array(GW * GH);
  if (dp())
    for (const o of OPENINGS)
      if (o.kind === "hole")
        for (let c = 0; c < GW * GH; c++) {
          const [x, y] = mid(c),
            [along, across] = o.axis === "x" ? [x, y - o.y] : [y, x - o.x];
          if (along > o.a && along < o.b && Math.abs(across) < 40)
            extra[c] = BOARD_COST;
        }
  return walk;
}
/* the nearest open cell to (x, y), within 3 cells (a duck by a wall stands where a cell's middle isn't open) */
export function openNear(x, y) {
  cells();
  const c = cellAt(x, y);
  if (c >= 0 && walk[c]) return c;
  let best = -1,
    bd = Infinity;
  const i0 = Math.floor((x - GX) / CELL),
    j0 = Math.floor((y - GY) / CELL);
  for (let dj = -3; dj <= 3; dj++)
    for (let di = -3; di <= 3; di++) {
      const i = i0 + di,
        j = j0 + dj;
      if (i < 0 || j < 0 || i >= GW || j >= GH || !walk[j * GW + i]) continue;
      const [mx, my] = mid(j * GW + i),
        d = Math.hypot(mx - x, my - y);
      if (d < bd) {
        bd = d;
        best = j * GW + i;
      }
    }
  return best;
}
/* the walking distance from every cell to the nearest of `starts` (Dijkstra from all of them at once: flowfield.js).
   The grid never changes, so a field is the same every time its starts are: I keep the last ones made and hand them out
   again instead of working them out on every heartbeat (the ducks only change cells now and then). A field handed out
   is only read.
   late (the zombies' chase, every heartbeat): a field not made yet is asked of the worker (flowfield.js), and until it
   answers, the zombies keep to the last field they had, the ducks' spots one heartbeat or so ago; so a big crowd's new
   field never holds up a frame (the owner's, Nov 18 14:20Z). Only the very first one, or with no worker, is worked out
   here at once. Every answer that comes back newer than the field they have is theirs at once: a duck that never stops
   (herding them) changes cells faster than the worker answers, so waiting for the field of the cell it is in now kept
   them on the field of where it last stood still (the fireplace) for as long as it kept walking (the owner's, Nov 19
   22:35Z: "they will keep walking to the fireplace even when I walk away from it"; "they kind of get caught in each
   other in a circle") */
const FLOWS = new Map(),
  FLOWS_KEPT = 48;
let lastLate = null, // (the last field the chase had, and the grid it was made on)
  lastLateRev = -1,
  lateN = 0, // (how many fields the chase asked for so far …
  lastLateN = 0; // … and which of them it has)
const askedN = new Map(); // (the key of a field asked for: its number, the newest asking)
const keep = (key, dist) => {
  FLOWS.set(key, dist);
  if (FLOWS.size > FLOWS_KEPT) FLOWS.delete(FLOWS.keys().next().value);
};
export function flowFrom(starts, late = false) {
  const key = [...new Set(starts.filter((c) => c >= 0))]
    .sort((a, b) => a - b)
    .join();
  let dist = FLOWS.get(key);
  if (dist) {
    FLOWS.delete(key);
    FLOWS.set(key, dist); // (the newest used is the last one dropped)
  } else {
    const cs = key ? key.split(",").map(Number) : [];
    if (
      late &&
      lastLate &&
      lastLateRev === walkRev &&
      askField(key, cs, grid(), walkRev, (k, rev, d) => {
        if (rev !== walkRev) return; // (a field for a grid made again since is dropped)
        keep(k, d);
        const n = askedN.get(k) || 0;
        askedN.delete(k);
        if (n > lastLateN) {
          lastLate = d;
          lastLateN = n;
        } // (newer than the one they have: theirs now)
      })
    ) {
      askedN.set(key, ++lateN);
      if (askedN.size > FLOWS_KEPT) askedN.delete(askedN.keys().next().value);
      return lastLate;
    }
    dist = fieldOf(grid(), cs);
    keep(key, dist);
  }
  if (late) {
    lastLate = dist;
    lastLateRev = walkRev;
    lastLateN = ++lateN;
  }
  return dist;
}
/* the grid as flowfield.js takes it (made again with the cells), and its step from a cell to a neighbor */
let G = null,
  nextTo = null;
function grid() {
  cells();
  if (!G || G.walk !== walk) {
    G = { walk, hts, extra, gw: GW, gh: GH, climb: 2 * STEP + 2 };
    nextTo = stepper(G);
  }
  return G;
}
/* where a zombie inside heads next: a point two cells on along the field (the way smooths out), or null */
export function heading(dist, x, y) {
  const c = openNear(x, y);
  if (c < 0 || dist[c] === Infinity) return null;
  grid(); // (its step: nextTo)
  const best = (a) => {
    let b = -1;
    for (let k = 0; k < 8; k++) {
      const n = nextTo(a, k);
      if (n >= 0 && dist[n] < (b < 0 ? dist[a] : dist[b])) b = n;
    }
    return b;
  };
  const n1 = best(c);
  if (n1 < 0) return null;
  const n2 = best(n1),
    [ax, ay] = mid(n1);
  if (n2 < 0) return [ax, ay];
  const [bx, by] = mid(n2);
  return [(ax + bx) / 2, (ay + by) / 2];
}
