/* ---------- crowds: walkers keep out of each other (the cornerstone, Nov 20: one module per mechanic) ----------
   Every walker that keeps out of the others goes through here: the zombies of Dead Ducks Arcade and Sandbox, Sandbox's
   NPCs on the maps (zombies.js). We use Reynolds' steering (1999, "Steering Behaviors For Autonomous Characters"):
   - apart, separation: two that overlap are pushed a share of the way apart (CROWD_BREEDS soft) every heartbeat, half
     each (all of it on one when the other never moves), so a crowd touches and stacks and eases apart instead of
     shaking (the owner's, Nov 20 03:58Z: "zombies shouldnt viibrate on roof of gas pump"); it hands back how many each
     one touches, for the slowdown in a crowd (zombies.js).
   - the turns and the speed are each walker's own (zombies.js steer).
   What differs between walkers is data (CROWD_BREEDS); what a walker's world lets it do is the caller's (the hooks).
   Pairs come from nearPairs: one grid, made once, never every walker against every other. */
import { SAME_FLOOR } from "./heights.js";

/* cw x ch: the push-apart's grid (world px); passes: how many times over them all; soft: the share of an overlap
   pushed out each pass (1: all of it); rx, ry: the room two of them take (world px; the zombies' is their map's, given
   by the caller, one duck length across); zero(rx, ry, T): the push when two stand on one spot; gap: the room they keep
   between them (duck lengths, on top of touching) */
const ZERO = (rx, ry, T) => {
  const ex = Math.random() - 0.5,
    ey = Math.random() - 0.5,
    e = Math.hypot(ex, ey),
    p = (T - e) / 2;
  return [(ex / e) * p * rx, (ey / e) * p * ry]; // (a random way out)
};
const CROWD_BREEDS = {
  /* the zombies touch and stack (the owner's, Nov 28 01:57Z: they don't "stack like they should"): no gap, and a soft
     push, "kind of like in a way where magnets push each other apart" (Nov 21 16:00Z) */
  zombie: { cw: 80, ch: 80, passes: 1, soft: 0.35, zero: ZERO },
  npc: { cw: 64, ch: 64, passes: 2, zero: ZERO }, // (Sandbox's NPCs walk as the zombies do, touching: zombies.js brainWalk)
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
   room: the other takes all of the push); move(o, dx, dy) (the push, where its world lets it). Hands back how many
   others each one touches (a Map) */
export function apart(live, k, H) {
  const B = CROWD_BREEDS[k],
    rx = B.rx || H.rx,
    ry = B.ry || H.ry,
    fl = H.fl && H.fl.size ? H.fl : null,
    still = H.still || (() => false),
    T = tooNear(k), // (touching, and the gap)
    soft = B.soft || 1,
    touch = new Map();
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
      touch.set(a, (touch.get(a) || 0) + 1);
      touch.set(b, (touch.get(b) || 0) + 1);
      const [ux, uy] = (
          e < 1e-3
            ? B.zero(rx, ry, T)
            : [(ex / e) * ((T - e) / 2) * rx, (ey / e) * ((T - e) / 2) * ry]
        ).map((u) => u * soft),
        sa = still(a),
        sb = still(b);
      if (sa && sb) return;
      if (!sa) H.move(a, sb ? 2 * ux : ux, sb ? 2 * uy : uy);
      if (!sb) H.move(b, sa ? -2 * ux : -ux, sa ? -2 * uy : -uy);
    },
    B.passes,
  );
  return touch;
}

/* how near is too near for breed k (room units: touching, 1, and its gap) */
export const tooNear = (k) => 1 + (CROWD_BREEDS[k].gap || 0);

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
   surround them as much as possible ... have them come from different directions as well"; Nov 28 01:57Z: "our behavior
   doesn't sourround the player well") ----------
   Attack spots and a waiting ring, as melee games keep a crowd round a player (the "attack slots" of Assassin's Creed
   and Batman: Arkham's crowds): near a duck (SUR.near duck lengths) each zombie takes one of SUR.n spots round it,
   SUR.r away, one zombie a spot: of the free ones it can stand at, the nearest round the circle. With every spot taken
   it waits on a ring farther out (SUR.wait), on its own side, and takes a spot the moment one frees. It walks round
   the duck to its spot (SUR.turn of the circle a step at most, never through the duck), then in. Held up SUR.held ms
   (behind another, at a ladder) it takes another spot or another way (heldUp). New ones come from the side of the
   ducks with fewer zombies (crowdSide). z.sr: [the duck, its spot, until]; z.sx: the spot it gave up */
export const SUR = {
  near: 6,
  r: 1.2,
  n: 6,
  wait: 2.3,
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
   null: straight at the duck (there, or too far, or nowhere round it it can stand) */
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
    if (z.sr && z.sr[0] === q.id) c[z.sr[1]]--;
    let best = -1,
      bc = Infinity;
    for (let k = 0; k < SUR.n; k++) {
      if (c[k] > 0 || k === z.sx || !ok(...spot(angle(k), SUR.r))) continue;
      const cost = Math.abs(turnOf(angle(k) - az)); // (the nearest free one round the circle)
      if (cost < bc) [best, bc] = [k, cost];
    }
    delete z.sx;
    delete z.sr;
    if (best < 0) {
      const w = spot(az, SUR.wait); // (every spot taken: it waits farther out, on its own side)
      if (d <= SUR.wait + 0.2) return [z.x, z.y]; // (there: it stands, ready)
      return ok(...w) ? w : null;
    }
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
