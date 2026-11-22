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
import { TILE } from "./units.js";

/* cw x ch: the push-apart's grid (world px); passes: how many times over them all; rx, ry: the room two of them take
   (world px; the zombies' is their map's, given by the caller, one duck length across); zero(rx, ry, T): the push
   when two stand on one spot; block: the block test's grid (world px); gap: the room they keep between them (duck
   lengths, on top of touching); line: how many in its way it waits behind before it goes round (one of them, picked
   at random each time it's held up) */
const ZERO = (rx, ry, T) => {
  const ex = Math.random() - 0.5,
    ey = Math.random() - 0.5,
    e = Math.hypot(ex, ey),
    p = (T - e) / 2;
  return [(ex / e) * p * rx, (ey / e) * p * ry]; // (a random way out)
};
const CROWD_BREEDS = {
  /* the zombies (the owner's, Nov 21 16:00Z): "naturally, zombies try to keep a very small amount of space from each
     other, and that space, we'll say, is maybe one of the smallest units, the hitbox" (one tile), "kind of like in a
     way where magnets push each other apart"; only an outside force (a knock-back) presses them together, and the
     ducks may touch them. "It is two or three ... it randomly chooses between the two": two or three in the way, and
     the next goes round */
  zombie: {
    cw: 80,
    ch: 80,
    passes: 2,
    block: 96,
    zero: ZERO,
    gap: TILE,
    line: [2, 3],
  },
  npc: { cw: 64, ch: 64, passes: 2, block: 96, zero: ZERO }, // (Sandbox's NPCs walk as the zombies do, touching: zombies.js brainWalk)
  gunman: { cw: 40, ch: 22, rx: 40, ry: 22, passes: 1, zero: () => [4, 2] }, // (the soldiers stick together)
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
    still = H.still || (() => false),
    T = tooNear(k); // (touching, and the gap)
  nearPairs(
    live,
    B.cw,
    B.ch,
    (a, b) => {
      if (fl && Math.abs(fl.get(a) - fl.get(b)) >= SAME_FLOOR) return; // (a floor apart: never in each other's way)
      const ex = (a.x - b.x) / rx,
        ey = (a.y - b.y) / ry,
        e = Math.hypot(ex, ey);
      if (e >= T) return;
      const [ux, uy] =
          e < 1e-3
            ? B.zero(rx, ry, T)
            : [(ex / e) * ((T - e) / 2) * rx, (ey / e) * ((T - e) / 2) * ry],
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
   (h(o)). { cells, h, cell, T: how near is too near (touching, and the breed's gap), line } */
export function crowdOf(list, k, h) {
  const B = CROWD_BREEDS[k],
    cell = B.block,
    cells = new Map(),
    hs = new Map();
  for (const o of list) {
    hs.set(o, h(o));
    const c = Math.floor(o.x / cell) * 100000 + Math.floor(o.y / cell);
    if (!cells.has(c)) cells.set(c, []);
    cells.get(c).push(o);
  }
  return { cells, h: hs, cell, T: tooNear(k), line: B.line || null };
}
/* the first other of crowd C on z's floor in the cells round (x, y) that f(o) picks, or null */
function first(C, z, x, y, f) {
  const hz = C.h.get(z),
    i0 = Math.floor(x / C.cell),
    j0 = Math.floor(y / C.cell);
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++)
      for (const o of C.cells.get((i0 + di) * 100000 + j0 + dj) || []) {
        if (o === z || o.st === 3) continue; // (dead since the crowd was made)
        if (Math.abs(C.h.get(o) - hz) >= SAME_FLOOR) continue;
        if (f(o)) return o;
      }
  return null;
}
/* would walker z stepping to (x, y) walk into another of crowd C on its floor (nearer than touching and the gap)? That
   one, or null (only closer to one it's already that near or about to be: stepping away is always free).
   room(ax, ay, bx, by): how far apart, 1 touching */
export const into = (C, z, x, y, room) =>
  first(C, z, x, y, (o) => {
    const then = room(x, y, o.x, o.y);
    return then < C.T && then < room(z.x, z.y, o.x, o.y);
  });
/* how near is too near for breed k (room units: touching, 1, and its gap) */
export const tooNear = (k) => 1 + (CROWD_BREEDS[k].gap || 0);
/* the others of crowd C on z's floor within r of (x, y) (room units) */
function near(C, z, x, y, r, room) {
  const out = [];
  first(C, z, x, y, (o) => {
    if (room(x, y, o.x, o.y) < r) out.push(o);
    return false;
  });
  return out;
}
/* going round (the owner's, Nov 21 16:00Z: "they can take a position where there's no more two or three in the way
   anymore"): walker z, held up by o on its way to t ([x, y]), counts the ones in its way (o, and the others as near o
   as the gap that are nearer t than z is). Once they are as many as its pick (z.pk, one of the breed's line, rolled
   when it was first held up), it makes for a free spot beside them: round t at its own distance, a body and a gap
   along at a time, the side with fewer of them first, up to SIDE_STEPS each way, where ok(x, y) lets it stand. The spot
   [x, y], or null (wait in line). rx, ry: the room, in world px */
const SIDE_STEPS = 4;
export function goRound(C, z, o, t, room, rx, ry, ok) {
  if (!C.line) return null;
  if (!z.pk) z.pk = C.line[Math.floor(Math.random() * C.line.length)];
  const dz = room(z.x, z.y, t[0], t[1]),
    way = [o, ...near(C, o, o.x, o.y, C.T + 0.05, room)].filter(
      (q, i, a) =>
        q !== z && a.indexOf(q) === i && room(q.x, q.y, t[0], t[1]) < dz,
    );
  if (way.length < z.pk || dz < 1e-3) return null;
  const a0 = Math.atan2((z.y - t[1]) / ry, (z.x - t[0]) / rx),
    step = C.T / dz, // (one body and its gap along the circle, in radians)
    left = way.filter(
      (q) =>
        Math.sin(Math.atan2((q.y - t[1]) / ry, (q.x - t[0]) / rx) - a0) > 0,
    ).length,
    first = left * 2 > way.length ? -1 : 1; // (the side with fewer of them first)
  for (let k = 1; k <= SIDE_STEPS; k++)
    for (const sgn of [first, -first]) {
      const a = a0 + sgn * k * step,
        x = t[0] + Math.cos(a) * dz * rx,
        y = t[1] + Math.sin(a) * dz * ry;
      if (ok(x, y) && !near(C, z, x, y, C.T, room).length) return [x, y];
    }
  return null;
}

/* ---------- the other way round ----------
   The owner's, Nov 17 17:41Z: "5% of zombies who spawn in will have a pattern where they try to attack the player from a
   different path and direction from the other zombies if it is availible, as a way to add difficulty to players making
   a train of zombies to herd or shepard". p: how many of a breed do (each one rolled as it comes in: fl, its side, 1 or
   -1); far, turn: its spot round the side, far world px from the one it goes for, turn (radians) round from the way it
   comes; done: near enough to its spot (room units) to come straight at it */
const ROUTE_BREEDS = {
  zombie: { p: 0.05, far: 420, turn: 1.75, done: 1.5 },
};
export const otherWay = (k) =>
  Math.random() < ROUTE_BREEDS[k].p ? { fl: Math.random() < 0.5 ? 1 : -1 } : {};
/* the spot round the side for walker z going for t ([x, y]), its own side first, where ok(x, y) lets it stand:
   [x, y], or null (no room either side). rx, ry: the room, in world px */
export function sideSpot(k, z, t, side, rx, ry, ok) {
  const B = ROUTE_BREEDS[k],
    a0 = Math.atan2((z.y - t[1]) / ry, (z.x - t[0]) / rx);
  for (const sgn of [side, -side]) {
    const a = a0 + sgn * B.turn,
      x = t[0] + Math.cos(a) * B.far,
      y = t[1] + Math.sin(a) * B.far * (ry / rx);
    if (ok(x, y)) return [Math.round(x), Math.round(y)];
  }
  return null;
}
/* has walker z got round the side (at its spot, or near t already)? */
export const sideDone = (k, z, at, t, room, rx) =>
  room(z.x, z.y, at[0], at[1]) < ROUTE_BREEDS[k].done ||
  room(z.x, z.y, t[0], t[1]) < (ROUTE_BREEDS[k].far / rx) * 0.6;
