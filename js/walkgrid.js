/* ---------- the walking grid: which 40-px cells of a map can be walked, and their heights ----------
   One grid for every walker that finds its way (the owner's cornerstone: one module per mechanic): the zombies, the
   gunmen, Sandbox's NPCs and the merchant search it by flow field (zombiepath.js), Hangout's cats, Justin and the shadow
   duck by A* (hangout/npc.js). What differs is the query, never the grid: the area it covers, whether it's a zombie
   walking (layout.js standable: a zombie passes what only stops a duck) and ok(x, y), a rule of the mode's own (Dead Ducks
   Arcade's play area). Each query's grid is made the first time it's asked for, and again when the map changes
   (layout.js layoutRev). It reads layout.js alone, so node can run it. */
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
    walk = new Uint8Array(n),
    hts = new Float32Array(n);
  for (let c = 0; c < n; c++) {
    const x = q.x0 + (c % q.gw) * CELL + CELL / 2,
      y = q.y0 + Math.floor(c / q.gw) * CELL + CELL / 2,
      z = heightAt(x, y);
    hts[c] = z;
    walk[c] =
      (!q.ok || q.ok(x, y)) &&
      standable(x, y, z, 0, null, !!q.zombie) &&
      !onPlatform(x, y) // (beds and tables: hopped onto, not walked)
        ? 1
        : 0;
  }
  const out = {
    rev: layoutRev(),
    x0: q.x0,
    y0: q.y0,
    gw: q.gw,
    gh: q.gh,
    walk,
    hts,
  };
  made.set(q.name, out);
  return out;
}
