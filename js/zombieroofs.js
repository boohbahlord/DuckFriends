/* ---------- the zombies' walk over Downpour's roofs: up a wall, along a roof, the jump onto the canopy ----------
   Part of the one zombie module (zombies.js walks every mode's zombies and calls in here; nothing here is a mode's
   own). Why its own file: it is the walk over one kind of ground, as zombiepath.js is the ways over the map, and
   zombies.js had grown past the 1,500 lines a file may have (tools/health/metrics.mjs). Moved as it was, unchanged */
import * as GS from "./hangout/stationmap.js";
import {
  heightAt,
  deckKey,
  sortY,
  layoutRev,
  PROPS,
  onDeckAt,
} from "./hangout/layout.js";
import { RX, RY } from "./l4ddrules.js";
import { room, walkTo, zOk } from "./zombies.js";
/* ---------- up onto the roofs (Downpour, Part B: the owner's, Nov 17 12:28Z) ----------
   A duck up on a roof (or on the canopy over the pumps) is reached by climbing: a zombie goes to the foot of the edge
   nearest the duck (CL.out outside it), climbs straight up the wall onto it (st 6, slower than it walks: CL.speed of its
   walk), and walks the roof at it (st 7). Its height comes from where it is, as on a fence */
export const CL = {
  out: 26,
  in: 14,
  step: 40,
  speed: 0.25,
  wide: 10,
  deep: 40,
};
/* does a way up deck d still lead to duck q? Its own way (the deck it is on, or the gas station's roof for the canopy),
   or the canopy's ladder. Once q is off the roof (landed, not just jumping) it doesn't, and a zombie keeping to that
   way gives it up at once (the owner's, Nov 19 19:27Z; it used to keep to it unless the duck was near) */
export const reaches = (q, d) =>
  !!d && (q.way === d || (!!q.alt && q.alt.way === d));
/* the foot of the canopy's ladder (stationmap.js PUMP_LADDER), where a zombie starts up it: the canopy's edge, as a wall */
export const ladderFoot = () => [
  GS.PUMP_LADDER.at - CL.out,
  (GS.PUMP_LADDER.y0 + GS.PUMP_LADDER.y1) / 2,
];

/* the edge of a roof nearest (x, y): d its deck (stationmap.js DECKS), o how far outside its edge (< 0: inside), nx ny
   the way out. only: that deck's (a zombie up a wall or on a roof keeps to its own, z.k) */
export function edgeOf(x, y, only = null) {
  let best = null;
  for (const d of only ? [only] : GS.DECKS) {
    let o = d.x0 - x,
      nx = -1,
      ny = 0;
    if (x - d.x1 > o) [o, nx, ny] = [x - d.x1, 1, 0];
    if (d.y0 - y > o) [o, nx, ny] = [d.y0 - y, 0, -1];
    if (y - d.y1 > o) [o, nx, ny] = [y - d.y1, 0, 1];
    if (!best || Math.abs(o) < Math.abs(best.o)) best = { d, o, nx, ny };
  }
  return best;
}
/* the deck a zombie up a wall or on a roof keeps to (z.k, its place in DECKS), or none (the nearest edge's) */
export const deckOf = (z) => (z.k === undefined ? null : GS.DECKS[z.k] || null);
export const stationDeck = () =>
  GS.DECKS.find((d) => d.kind === "roof" && d.bldg === 1);
export const canopyDeck = () => GS.DECKS.find((d) => d.kind === "canopy");
/* how high a zombie climbing a wall (st 6) is at (x, y): up from the foot (CL.out out) to the top at the edge */
export const climbZ = (x, y, only = null) => {
  const e = edgeOf(x, y, only);
  return e.d.h * Math.min(1, Math.max(0, (CL.out - e.o) / CL.out));
};

/* ---------- onto the canopy (the owner's, Nov 17 18:05Z: "zombies can jump onto the gas pump roof with only a 5%
   chance of failing once they are on the gas station roof, and their path of least resistance is the climbing of the
   most near by gas station wall before getting on the roof and doing a jump animation for this") ----------
   A duck on the canopy: a zombie climbs the gas station's wall nearest it, walks the roof to its south edge over the
   canopy, and jumps across (st 8: z.j [x0, y0, x1, y1, h0, h1], an arc JUMP.arc high), 1 time in 20 short of it, down
   to the ground (JUMP.fail). It picks its spot on the roof's edge once (z.jp [x, the duck]) and keeps it till it jumps,
   or till that duck leaves the canopy (the owner's, Nov 19 01:00Z: "zombies should pick a part to jump onto the gas
   pump from and commit, not going left and right over and over until the player stands still because that is ripe
   for exploit") */
export const JUMP = {
  speed: 300,
  arc: 40,
  fail: 0.05,
  in: 30,
  wide: 4,
  gap: 40,
  near: 16,
};
/* each zombie's own spot along the edge (JUMP.wide spots each side of the duck, JUMP.gap apart, by its number), and it
   jumps once it's within JUMP.near of it: all of them at one spot pushed each other off it (separate) and walked
   back, over and over, so they shook at the roof's edge (the owner's, Nov 20 03:58Z: "zombies shouldnt viibrate on
   roof of gas pump") */
const jumpLane = (z) => ((z.i % (2 * JUMP.wide + 1)) - JUMP.wide) * JUMP.gap;
/* the nearest x along the roof's edge (at y) that has roof under it, JUMP.near either side: a spot over the hole broken
   out of the corner by the restroom had them walk into it, drop to the ground, climb back up and walk into it again,
   over and over (the owner's, Nov 21 08:46 ET: "the zombies are stuck on one another and not going up a ladder") */
const roofAlong = (S, x, y) => {
  const ok = (a) =>
    [-JUMP.near, 0, JUMP.near].every((t) => onDeckAt(S, a + t, y));
  for (let t = 0; t <= S.x1 - S.x0; t += 4) {
    if (ok(x + t)) return x + t;
    if (ok(x - t)) return x - t;
  }
  return x;
};
export function jumpOn(z, pls, far) {
  const C = canopyDeck(),
    S = stationDeck();
  let q = null;
  for (const p of pls)
    if (p.dk === C && (!q || room(z.x, z.y, ...p.xy) < room(z.x, z.y, ...q.xy)))
      q = p;
  if (!q) {
    delete z.jp;
    return false;
  }
  const y = S.y1 - 10;
  if (!z.jp || !pls.some((p) => p.dk === C && p.id === z.jp[1]))
    z.jp = [
      Math.round(
        roofAlong(
          S,
          Math.min(
            Math.max(q.xy[0] + jumpLane(z), Math.max(C.x0, S.x0) + JUMP.in),
            Math.min(C.x1, S.x1) - JUMP.in,
          ),
          y,
        ),
      ),
      q.id,
    ]; // (its spot, picked once: kept while its duck stays on the canopy)
  const x = z.jp[0];
  if (Math.hypot(x - z.x, y - z.y) > far + JUMP.near) {
    walkTo(z, x, y, far);
    return true;
  }
  z.x = x;
  z.y = y;
  delete z.jp;
  const fell = Math.random() < JUMP.fail,
    y1 = fell ? (S.y1 + C.y0) / 2 : C.y0 + JUMP.in;
  z.st = 8;
  z.n = 0;
  z.j = [x, y, x, y1, S.h, fell ? heightAt(x, y1) : C.h];
  return true;
}
export const jumpZ = (z) => {
  const [x0, y0, x1, y1, h0, h1] = z.j,
    u = Math.min(
      1,
      Math.hypot(z.x - x0, z.y - y0) / (Math.hypot(x1 - x0, y1 - y0) || 1),
    );
  return h0 + (h1 - h0) * u + JUMP.arc * 4 * u * (1 - u);
};

/* where a zombie is drawn in depth: up a wall, in front of the roof it climbs onto, as a duck up a ladder is drawn in
   front of it (layout.js onLadder), so no part of the roof hides it on its way up; else as anyone at its height */
export const zSortY = (z, zz) =>
  z.st === 6 && deckOf(z) ? deckKey(deckOf(z), z.y) : sortY(z.x, z.y, zz);
/* the feet of each roof's walls where a zombie can start up (every CL.step along its edges, on open ground), made once */
let footOf = null;
export function climbSpot(dk, [x, y]) {
  if (!footOf || footOf.rev !== layoutRev()) {
    footOf = new Map();
    footOf.rev = layoutRev();
  }
  if (!footOf.has(dk)) {
    const spots = [],
      o = CL.out;
    for (let a = dk.x0; a <= dk.x1; a += CL.step)
      spots.push([a, dk.y0 - o], [a, dk.y1 + o]);
    for (let b = dk.y0; b <= dk.y1; b += CL.step)
      spots.push([dk.x0 - o, b], [dk.x1 + o, b]);
    footOf.set(
      dk,
      spots.filter(
        ([sx, sy]) => zOk(sx, sy, heightAt(sx, sy)) && wallUnder(dk, sx, sy),
      ),
    );
  }
  let best = null,
    bd = Infinity;
  for (const q of footOf.get(dk)) {
    const d = Math.hypot(q[0] - x, q[1] - y);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
}
/* is a wall drawn under deck dk's edge in front of the foot spot (x, y)? Looked for from the spot in toward the deck,
   past the roof's overhang and through the wall's thickness (CL.deep more): a wall's drawing (layout.js PROPS, the
   same pieces the art draws) as tall as the roof, under the whole width of a zombie (CL.wide each side). A hole or a
   door is no wall piece, so nobody climbs it (the owner's, Nov 21 03:40Z: "zombies should not be able to climb over
   holes in a wall because there's a hole in the wall. So they can't climb what isn't there"). The canopy has no walls
   (its ladder is climbed instead). And only a wall that holds the roof up: the roof must be there at its top, where the
   climb comes out (CL.in onto it), never a hole in the roof (the owner's, Nov 21: "zombies also climb on the brick walls
   that doesnt connect to the cieling on the bathroom, which doesnt work, so they shouldnt be able to climb tha wall") */
function wallUnder(dk, x, y) {
  const e = edgeOf(x, y, dk),
    walls = PROPS.filter((p) => p.kind === "wall" && p.z + p.h >= dk.h - 1),
    drawn = (px, py) =>
      walls.some(
        (p) => px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.d,
      ),
    under = (t) => {
      for (let d = 0; d <= CL.out + CL.deep; d += 4)
        if (drawn(x - e.nx * d - e.ny * t, y - e.ny * d + e.nx * t))
          return true;
      return false;
    };
  const roof = (t) =>
    onDeckAt(
      dk,
      x - e.nx * (CL.out + CL.in) - e.ny * t,
      y - e.ny * (CL.out + CL.in) + e.nx * t,
    );
  return [-CL.wide, 0, CL.wide].every((t) => under(t) && roof(t));
}
/* where zombie z starts up deck dk's wall, its way up's foot (gx, gy) near: at the foot of the wall straight in front of
   it, if a wall stands there too, else that foot itself. It walks there first and starts from the ground: it started
   wherever it was within reach of the foot before, up to the roof's edge, and was halfway up the moment it began (the
   owner's, Nov 21 03:40Z: "not just stand there and then teleport to the top") */
export function climbFrom(z, dk, gx, gy) {
  /* the canopy's ladder is as wide as its rungs: each zombie starts up it where it stands along it, not all of them at
     its middle (there they pushed one another off it for good and none went up: the owner's, Nov 21 08:46 ET, "the
     zombies are stuck on one another and not going up a ladder") */
  if (dk.kind === "canopy")
    return [gx, Math.min(Math.max(z.y, GS.PUMP_LADDER.y0), GS.PUMP_LADDER.y1)];
  const e = edgeOf(gx, gy, dk),
    at = e.nx ? [gx, z.y] : [z.x, gy];
  return zOk(at[0], at[1], heightAt(at[0], at[1])) &&
    wallUnder(dk, at[0], at[1])
    ? at
    : [gx, gy];
}

/* on a roof, going for its duck: toward (tx, ty), but never into another zombie on that roof, as a duck never walks
   into one (world.js crowd); blocked, it slides round it or waits. Before, the ones behind walked into the ones in
   front every heartbeat and were pushed back out (separate), so the whole crowd round a duck standing on the canopy
   shook (the owner's, Nov 20 03:58Z: "zombies shouldnt viibrate on roof of gas pump") */
const ROOF_TURNS = [0, 0.52, 1.05];
export function roofStep(z, tx, ty, far, zs) {
  const dx = tx - z.x,
    dy = ty - z.y,
    d = Math.hypot(dx, dy);
  if (d < 1) return;
  const len = Math.min(d, far),
    near = zs.filter(
      (o) =>
        o !== z &&
        o.st === 7 &&
        o.k === z.k &&
        Math.abs(o.x - z.x) < RX * 2 + len &&
        Math.abs(o.y - z.y) < RY * 2 + len,
    ),
    free = (x, y) => {
      const o = near.find((o) => {
        const now = room(z.x, z.y, o.x, o.y),
          then = room(x, y, o.x, o.y);
        return then < 1 && then < now;
      });
      if (o) z.bl = o; // (the one in its way, this heartbeat: QUEUE)
      return !o;
    };
  const side = z.i % 2 ? 1 : -1; // (always round the same side, its own: trying both, it went left, then right, then left)
  for (const t of ROOF_TURNS) {
    const c = Math.cos(t * side),
      sn = Math.sin(t * side),
      x = z.x + ((dx * c - dy * sn) / d) * len,
      y = z.y + ((dx * sn + dy * c) / d) * len;
    if (free(x, y)) {
      z.x = x;
      z.y = y;
      return;
    }
  }
}
