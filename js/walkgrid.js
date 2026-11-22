/* ---------- the walking grid: which 40-px cells of a map can be walked, and their heights ----------
   One grid for every walker that finds its way (the owner's cornerstone: one module per mechanic): the zombies, the
   gunmen, Sandbox's NPCs and the merchant search it by flow field (zombiepath.js), Hangout's cats, Justin and the shadow
   duck by A* (hangout/npc.js). What differs is the query, never the grid: the area it covers, whether it's a zombie
   walking (layout.js standable: a zombie passes what only stops a duck) and ok(x, y), a rule of the mode's own (Dead Ducks
   Arcade's play area). Each query's grid is made the first time it's asked for, and again when the map changes
   (layout.js layoutRev); when a car is pushed, only the cells round it (regrid). It reads layout.js alone, so node can
   run it. */
import {
  heightAt,
  standable,
  onPlatform,
  layoutRev,
} from "./hangout/layout.js";

export const CELL = 40;
const made = new Map(); // query's name → { rev, walk, hts }
/* q = { name, x0, y0, gw, gh, zombie, ok }: walk (1 open, 0 not, per cell, row by row) and hts (each cell's height) */
export function gridOf(q) {
  const g = made.get(q.name);
  if (
    g &&
    g.rev === layoutRev() &&
    g.gw === q.gw &&
    g.gh === q.gh &&
    g.x0 === q.x0 &&
    g.y0 === q.y0
  )
    return g;
  const n = q.gw * q.gh,
    out = {
      rev: layoutRev(),
      x0: q.x0,
      y0: q.y0,
      gw: q.gw,
      gh: q.gh,
      walk: new Uint8Array(n),
      hts: new Float32Array(n),
      q,
    };
  for (let c = 0; c < n; c++) cellOf(out, c);
  made.set(q.name, out);
  return out;
}
/* cell c of grid g, made from what stands there now */
function cellOf(g, c) {
  const { q } = g,
    x = q.x0 + (c % q.gw) * CELL + CELL / 2,
    y = q.y0 + Math.floor(c / q.gw) * CELL + CELL / 2,
    z = heightAt(x, y);
  g.hts[c] = z;
  g.walk[c] =
    (!q.ok || q.ok(x, y)) &&
    standable(x, y, z, 0, null, !!q.zombie) &&
    !onPlatform(x, y) // (beds and tables: hopped onto, not walked)
      ? 1
      : 0;
}
/* a car pushed (carpush.js): every grid's cells under the box x0 … x1, y0 … y1 (world px) made again in place, a cell
   past each side (a duck's feet keep that far from a solid), so nothing else is made again (the owner's: no task over
   50 ms) */
export function regrid(x0, y0, x1, y1) {
  for (const g of made.values()) {
    const i0 = Math.max(0, Math.floor((x0 - g.x0) / CELL) - 1),
      i1 = Math.min(g.gw - 1, Math.floor((x1 - g.x0) / CELL) + 1),
      j0 = Math.max(0, Math.floor((y0 - g.y0) / CELL) - 1),
      j1 = Math.min(g.gh - 1, Math.floor((y1 - g.y0) / CELL) + 1);
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) cellOf(g, j * g.gw + i);
  }
}

/* a random spot in the area a = { x0, y0, x1, y1, tries } that passes ok(x, y): x then y from rand() (0 … 1), up to
   a.tries times; null when none did. Every stroll picks its next spot this way: Hangout's characters (hangout/npc.js
   randomSpot, on the grid) and Justin out in Dead Ducks Arcade (bots.js wanderSpot) */
export function spotIn(rand, ok, a) {
  for (let t = 0; t < a.tries; t++) {
    const x = a.x0 + rand() * (a.x1 - a.x0),
      y = a.y0 + rand() * (a.y1 - a.y0);
    if (ok(x, y)) return [x, y];
  }
  return null;
}
