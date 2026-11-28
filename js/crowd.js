/* ---------- crowds: walkers never stand in each other (the cornerstone, Nov 20: one module per mechanic) ----------
   Every walker that keeps out of the others goes through here: the zombies of Quacky Zombies, Survival and Sandbox,
   Sandbox's NPCs on the maps (zombies.js). Two ways:
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
/* would walker z stepping to (x, y) on its way to aim ([x, y]) walk into another of crowd C on its floor (nearer than
   touching and the gap)? That one, or null (only closer to one it's already that near or about to be: stepping away is
   always free). Only one ahead of it holds it up, no farther from its aim than it is: two making for the same spot
   (a doorway, a wall's foot) each held the other up for good, so neither went on (the owner's, Nov 22 18:13Z:
   "zombies that will not move and will not kill me"); now the nearer goes first and the other waits behind it.
   room(ax, ay, bx, by): how far apart, 1 touching */
export const into = (C, z, x, y, room, aim) =>
  first(C, z, x, y, (o) => {
    const then = room(x, y, o.x, o.y);
    return (
      then < C.T &&
      then < room(z.x, z.y, o.x, o.y) &&
      (!aim || room(o.x, o.y, ...aim) <= room(z.x, z.y, ...aim))
    );
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

/* ---------- narrow ways: another route instead of a line (the owner's, Nov 21 16:00Z) ----------
   "if something is narrow enough and there is another route, they will take the other route, the other path of least
   resistance. And if one zombie jumps up on the gas pump roof and now there's the next slot, another zombie that's
   coming by that hasn't committed to a roof climb, for example, might take the path of least resistance, which is
   climbing the car". A way holds as many of breed k side by side as fit across its span (world px: fits); the ones
   already keeping to it stand in rows of that many, and each row ahead costs as much as walking a body and its gap
   farther. A walker picks the way that costs least: its own way there plus the rows ahead of it (with nobody on any,
   simply the nearest). ways: [{ way, goal, cap }], taken(w): how many keep to way w already, far(w): how far it is
   (room units) */
export const fits = (k, span, rx) =>
  Math.max(1, Math.floor(span / (rx * tooNear(k))));
export function leastWay(k, ways, taken, far) {
  const row = tooNear(k),
    cost = (w) => far(w) + Math.floor(taken(w) / w.cap) * row;
  let best = null,
    bc = Infinity;
  for (const w of ways) {
    const c = cost(w);
    if (c < bc) {
      best = w;
      bc = c;
    }
  }
  return best;
}

/* ---------- the surround (the owner's, Nov 23 00:32Z: "We want the zombies to encircle the player and to try and
   surround them as much as possible ... have them come from different directions as well") ----------
   Near a duck (SUR.near duck lengths) each zombie takes one of SUR.n spots round it, SUR.r away: of the spots it can
   stand at, the one with the fewest zombies on it, then the nearest round the circle. It walks round the duck to its
   spot (SUR.turn of the circle a step at most, at the room it has, never through the duck), then in. Held up SUR.held
   ms (behind another, at a ladder) it takes another spot or another way (heldUp). New ones come from the side of the
   ducks with fewer zombies (crowdSide). z.sr: [the duck, its spot, until]; z.sx: the spot it gave up */
export const SUR = {
  near: 6,
  r: 1.2,
  n: 8,
  turn: 0.9,
  keep: 4000,
  held: 1000,
  moved: 0.25,
  away: 0.75,
};
const angle = (k) => (k / SUR.n) * 2 * Math.PI,
  turnOf = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/* the spots taken round each duck: Map(duck id -> how many on each spot) */
export function spotsTaken(zs, now) {
  const m = new Map();
  for (const z of zs)
    if (z.sr && z.sr[2] > now && z.st !== 3) {
      const c = m.get(z.sr[0]) || Array(SUR.n).fill(0);
      c[z.sr[1]]++;
      m.set(z.sr[0], c);
    }
  return m;
}
/* where zombie z goes next round duck q (q.xy, px; rx, ry: a duck length in px; ok(x, y): it can stand there), or
   null: straight at the duck (there, or too far, or no spot it can stand at) */
export function surroundAim(z, q, taken, now, rx, ry, ok) {
  const [qx, qy] = q.xy,
    dx = (z.x - qx) / rx,
    dy = (z.y - qy) / ry,
    d = Math.hypot(dx, dy),
    az = Math.atan2(dy, dx),
    spot = (a, r) => [qx + Math.cos(a) * r * rx, qy + Math.sin(a) * r * ry];
  if (d > SUR.near) return null;
  let c = taken.get(q.id);
  if (!c) taken.set(q.id, (c = Array(SUR.n).fill(0)));
  if (!z.sr || z.sr[0] !== q.id || z.sr[2] <= now) {
    if (z.sr && z.sr[0] === q.id && z.sr[2] > now) c[z.sr[1]]--;
    let best = -1,
      bc = Infinity;
    for (let k = 0; k < SUR.n; k++) {
      if (k === z.sx || !ok(...spot(angle(k), SUR.r))) continue;
      const cost = c[k] * 10 + Math.abs(turnOf(angle(k) - az)); // (the fewest on it first, then the nearest round)
      if (cost < bc) [best, bc] = [k, cost];
    }
    delete z.sx;
    if (best < 0) return null;
    z.sr = [q.id, best, now + SUR.keep];
    c[best]++;
  }
  const diff = turnOf(angle(z.sr[1]) - az);
  if (Math.abs(diff) < 0.3)
    return d > SUR.r + 0.2 ? spot(angle(z.sr[1]), SUR.r) : null; // (its side: in to its spot, then at the duck)
  return spot(
    az + Math.max(-SUR.turn, Math.min(SUR.turn, diff)),
    Math.max(SUR.r + 0.6, d - 0.4),
  ); // (round the duck to its side, a little nearer each step)
}
/* zombie z near duck q, in a world G ({ rx, ry, h, ok, walk }: zombies.js gr): its aim round to its spot, or null
   (straight on); held up a second short of the duck's reach, it gives its spot up for another */
export function surround(z, q, taken, now, G, reach) {
  const at = surroundAim(z, q, taken, now, G.rx, G.ry, (x, y) =>
    G.ok(x, y, G.h(z.x, z.y)),
  );
  if (stuck(z, q, now, G, reach) && z.sr) {
    z.sx = z.sr[1];
    delete z.sr;
  }
  return at && G.walk(z.x, z.y, ...at) ? at : null;
}
/* held up a second short of duck q's reach (behind another, at a ladder): true, and a way up it keeps to is given up
   for a while (gaveUp) */
export function stuck(z, q, now, G, reach) {
  const far = Math.hypot((z.x - q.xy[0]) / G.rx, (z.y - q.xy[1]) / G.ry);
  if (far <= reach + 0.3 || !heldUp(z, now, G.rx)) return false;
  if (z.cm) z.na = [z.cm[3], now + SUR.keep];
  return true;
}
/* how much farther a way up (k: its deck) looks to z when it gave that one up a while ago */
export const gaveUp = (z, k, now) =>
  z.na && z.na[0] === k && now < z.na[1] ? SUR.near : 0;
/* z hardly moved for SUR.held ms: true once, then its clock starts again */
function heldUp(z, now, rx) {
  const h = z.hu;
  if (h && Math.hypot(z.x - h[0], z.y - h[1]) <= SUR.moved * rx) {
    if (now - h[2] < SUR.held) return false;
  } else if (h) {
    z.hu = [z.x, z.y, now];
    return false;
  }
  z.hu = [Math.round(z.x), Math.round(z.y), now];
  return !!h;
}
/* which way the zombies are from the ducks (pts, px): a unit [x, y], or null when they're all round (or none) */
export function crowdSide(zs, pts) {
  if (!pts.length) return null;
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length,
    cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  let sx = 0,
    sy = 0,
    n = 0;
  for (const z of zs) {
    const l = z.st !== 3 && Math.hypot(z.x - cx, z.y - cy);
    if (!l) continue;
    sx += (z.x - cx) / l;
    sy += (z.y - cy) / l;
    n++;
  }
  const l = Math.hypot(sx, sy);
  return n >= 3 && l > n * 0.25 ? [sx / l, sy / l, cx, cy] : null; // (most on one side)
}
/* a spawn at (x, y) is on the crowd's side (side: crowdSide's) */
export const onCrowdSide = (side, x, y) =>
  !!side && (x - side[2]) * side[0] + (y - side[3]) * side[1] > 0;
/* the openings of pool (q.in: where it comes in, px) away from the crowd's side, SUR.away of the time (all when none) */
export function awayFrom(side, pool) {
  const away = pool.filter((q) => !onCrowdSide(side, ...q.in));
  return away.length && Math.random() < SUR.away ? away : pool;
}
/* is (x, y) on a screen of one at pts (px; view: half a screen, l4ddrules.js VIEW): up and down a little more, a tall
   phone held upright sees farther that way, 15% more since the owner's Nov 18 15:18Z (modes.js phoneOut) */
export const seenBy = (pts, x, y, view) =>
  pts.some(
    ([a, b]) => Math.abs(x - a) < view.x + 60 && Math.abs(y - b) < view.y + 140,
  );
