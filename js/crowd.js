/* ---------- crowds: walkers never stand in each other (the cornerstone, Nov 20: one module per mechanic) ----------
   Every walker that keeps out of the others goes through here: the zombies of Quacky Zombies, Survival and Sandbox,
   Sandbox's NPCs on the maps (zombies.js), the gunmen and the friendly squad (gunmenrules.js). Two ways:
   - crowdOf and into, the block test: a walker's step that takes it closer into another on its floor is refused
     (stepping away is always free), so the ones behind wait instead of walking in and being pushed out every heartbeat,
     which shook a crowd in place (the owner's, Nov 20 03:58Z: "zombies shouldnt viibrate on roof of gas pump").
   - apart, the push-apart: two too close are pushed apart, half each (all of it on one when the other never moves).
   What differs between walkers is data (CROWD_BREEDS); what a walker's world lets it do is the caller's (the hooks).
   Pairs come from nearPairs: one grid, made once, never every walker against every other. */
import { SAME_FLOOR } from "./heights.js";

/* cw x ch: the push-apart's grid (world px); passes: how many times over them all; rx, ry: the room two of them take
   (world px; the zombies' is their map's, given by the caller); zero(rx, ry): the push when two stand on one spot;
   block: the block test's grid (world px) */
const ZOMBIE = {
  cw: 64,
  ch: 64,
  passes: 2,
  block: 96,
  zero(rx, ry) {
    const ex = Math.random() - 0.5,
      ey = Math.random() - 0.5,
      e = Math.hypot(ex, ey),
      p = (1 - e) / 2;
    return [(ex / e) * p * rx, (ey / e) * p * ry]; // (a random way out)
  },
};
const CROWD_BREEDS = {
  zombie: ZOMBIE,
  npc: { ...ZOMBIE }, // (Sandbox's NPCs walk as the zombies do: zombies.js walkers)
  gunman: { cw: 40, ch: 22, rx: 40, ry: 22, passes: 1, zero: () => [4, 2] },
};

/* every pair of walkers near enough to touch, each pair once (b numbered after a: b.i > a.i): the ones in a's cell of a
   grid of cw x ch world px (made once, where they stood) and in the 8 cells round it. passes: how many times over them
   all; most: how many others each one is kept apart from. Each push is the caller's own (fn(a, b)) */
function nearPairs(live, cw, ch, fn, passes = 1, most = Infinity) {
  const grid = new Map(),
    key = (cx, cy) => cx * 100000 + cy;
  for (const o of live) {
    const k = key(Math.floor(o.x / cw), Math.floor(o.y / ch));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(o);
  }
  for (let pass = 0; pass < passes; pass++)
    for (const a of live) {
      const cx = Math.floor(a.x / cw),
        cy = Math.floor(a.y / ch);
      let n = 0;
      for (let dx = -1; dx <= 1 && n < most; dx++)
        for (let dy = -1; dy <= 1 && n < most; dy++)
          for (const b of grid.get(key(cx + dx, cy + dy)) || []) {
            if (b.i <= a.i) continue;
            if (++n > most) break;
            fn(a, b);
          }
    }
}

/* the push-apart of breed k over live. H: rx, ry (the room, when the breed has none of its own); fl (each one's
   height, a Map: only two on one floor, SAME_FLOOR, push; none: every pair); still(o) (one that never moves to make
   room: the other takes all of the push); move(o, dx, dy) (the push, where its world lets it) */
export function apart(live, k, H) {
  const B = CROWD_BREEDS[k],
    rx = B.rx || H.rx,
    ry = B.ry || H.ry,
    fl = H.fl && H.fl.size ? H.fl : null,
    still = H.still || (() => false);
  nearPairs(
    live,
    B.cw,
    B.ch,
    (a, b) => {
      if (fl && Math.abs(fl.get(a) - fl.get(b)) >= SAME_FLOOR) return; // (a floor apart: never in each other's way)
      const ex = (a.x - b.x) / rx,
        ey = (a.y - b.y) / ry,
        e = Math.hypot(ex, ey);
      if (e >= 1) return;
      const [ux, uy] =
          e < 1e-3
            ? B.zero(rx, ry)
            : [(ex / e) * ((1 - e) / 2) * rx, (ey / e) * ((1 - e) / 2) * ry],
        sa = still(a),
        sb = still(b);
      if (sa && sb) return;
      if (!sa) H.move(a, sb ? 2 * ux : ux, sb ? 2 * uy : uy);
      if (!sb) H.move(b, sa ? -2 * ux : -ux, sa ? -2 * uy : -uy);
    },
    B.passes,
  );
}

/* the block test's crowd, made once a heartbeat: list's walkers by the breed's block cells, and each one's height
   (h(o)). { cells, h, cell } */
export function crowdOf(list, k, h) {
  const cell = CROWD_BREEDS[k].block,
    cells = new Map(),
    hs = new Map();
  for (const o of list) {
    hs.set(o, h(o));
    const c = Math.floor(o.x / cell) * 100000 + Math.floor(o.y / cell);
    if (!cells.has(c)) cells.set(c, []);
    cells.get(c).push(o);
  }
  return { cells, h: hs, cell };
}
/* would walker z stepping to (x, y) walk into another of crowd C on its floor? That one, or null (only closer to one it's
   already touching or about to: stepping away is always free). room(ax, ay, bx, by): how far apart, 1 touching */
export function into(C, z, x, y, room) {
  const hz = C.h.get(z),
    i0 = Math.floor(x / C.cell),
    j0 = Math.floor(y / C.cell);
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++)
      for (const o of C.cells.get((i0 + di) * 100000 + j0 + dj) || []) {
        if (o === z || o.st === 3) continue; // (dead since the crowd was made)
        if (Math.abs(C.h.get(o) - hz) >= SAME_FLOOR) continue;
        const then = room(x, y, o.x, o.y);
        if (then < 1 && then < room(z.x, z.y, o.x, o.y)) return o;
      }
  return null;
}
