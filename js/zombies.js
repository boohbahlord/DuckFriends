/* ---------- the zombies: one module for every mode's zombies ----------
   I want one zombie, Dead Ducks Arcade's, that every mode runs (the cornerstone: "There is a zombie file, period"). This
   is it: what a zombie keeps between heartbeats (s.hang.zs, s.hidden.l4z), a new one at an opening or on the road, its
   walk toward the ducks (moveZombies, stepZombie, the crowd and the nudges), its way up onto the roofs, the flankers
   round the side, the jump onto the canopy, its claw, and what Sandbox's board zombies and the computers ask of it.
   Moved here from l4ddrules.js as it was (nothing it does changed); the way to the ducks is zombiepath.js. Next, Mad God
   Justin's waves and Sandbox's board zombies run on it too, each a breed. */
import {
  ZOMBIE_SWIPE_SLOWER,
  ZOMBIE_GRACE,
  ARMOR,
  SPECIAL_Z,
  DIRECTOR,
  WEIGHT,
} from "./gamedefaults.js";
import { carsSwing } from "./carpush.js";
import { badShare, doingWell, ducks, badly } from "./director.js";
import { helmeted } from "./wounds.js";
/* Dead Ducks Arcade's zombies' swipe in every round: its wind-up (from the tell to the hit) and the ms from one hit to the
   next, rounds 1 to 4's (the owner's, Nov 21 18:24Z: "all of the zombies have the default attack speed as they do in
   rounds 1 through 4"); the 0.2 s slower of Nov 20 is in the second */
const SWIPE = [500, 1000 + ZOMBIE_SWIPE_SLOWER];
import { duckBig } from "./duck.js";
import { SB_BOXES } from "./sandboxrules.js";
import { valueOf } from "./seriatbox.js";
import {
  W,
  H,
  STEP,
  heightAt,
  whereIn,
  standable,
  onPlatform,
  deckAt,
  deckOver,
  deckH,
  onDeckAt,
  wetK,
  DUCK,
} from "./hangout/layout.js";
import * as GS from "./hangout/stationmap.js";
import { walkOf, immobile } from "./push.js";
import { zOf, heightWay, overlapH } from "./heights.js";
import {
  apart,
  otherWay,
  sideSpot,
  sideDone,
  fits,
  leastWay,
} from "./crowd.js";
import * as CR from "./crowd.js"; // (the surround: CR.SUR)
import {
  L4,
  WALK,
  Z_SPEED,
  RX,
  RY,
  CLAW,
  STAGGER,
  ROOF_BACK,
  hp0,
  ZHATS,
  ZOUTFITS,
  Z_JUSTIN,
  Z_BREED,
  zombieLook,
  VIEW,
  playable,
  FENCE,
  acrossFence,
  byFence,
  OPENINGS,
  dp,
  mapDeck,
  syncMap,
  openingById,
  rnd,
  rint,
  players,
  standing,
  dodging,
  JCHASE,
  isWild,
  merchantsOf,
  merchantHurtAt,
  addFx,
  CAKE_R,
  CAKE_BITE,
  cakeDown,
  fireTick,
  clawDmg,
  hurtDuck,
  tugDuck,
  zombieHit,
  walled,
} from "./l4ddrules.js";
import { openNear, flowFrom, heading } from "./zombiepath.js";
import { toPx } from "./units.js";
import {
  CL,
  reaches,
  ladderFoot,
  edgeOf,
  deckOf,
  stationDeck,
  canopyDeck,
  climbZ,
  JUMP,
  jumpOn,
  carLeap,
  jumpZ,
  climbSpot,
  climbFrom,
  roofStep,
  chaseDeck,
  dropOff,
  FALL,
} from "./zombieroofs.js";
/* the most zombies a round in all, every player counted (l4ddrules.js zombiesFor; was 400); Sandbox keeps its NPCs alive
   under it too (sbspawn.js) */
export const Z_MOST = 800;
/* ---------- the ground a walk is on ----------
   Where a zombie walks differs by place, never by mode: a map (Duck Cabin, Downpour: walls, floors, roofs) or the board
   (Mad God Justin's fight: open and flat to its edges). The walk asks the ground, in the ground's own px: rx and ry, a
   duck's room on it (room: 1 is two ducks touching); h(x, y), its floor's height there; ok(x, y, z, up), can a zombie
   stand there; free(x, y), is it inside at all. Every walk is on the map's but a board's (boardWalk, while it runs) */
let MAP = null,
  BOARD = null;
const gr = () =>
  BOARD ||
  MAP ||
  (MAP = { rx: RX, ry: RY, h: heightAt, ok: zOk, free: playable }); // (made at the first walk: RX and the rest come from l4ddrules.js, which imports this file)
/* the ellipse distance between two spots on the ground: 1 is two ducks touching */
export const room = (ax, ay, bx, by) => {
  const g = gr();
  return Math.hypot((ax - bx) / g.rx, (ay - by) / g.ry);
};
/* where zombies can stand inside (the walls, the furniture, the beds stop them; the outside too) */
export const zOk = (x, y, z, up = STEP) =>
  playable(x, y) && standable(x, y, z, up, null, true) && !onPlatform(x, y); // (Downpour: zombies wade the deep flood; the fallen tree stops them)
/* what a zombie keeps from one heartbeat to the next besides its spot, hp and state (in s.hidden.l4z, the host's only):
   cm its way up kept to, k the roof it is up, fl its flank and wp its spot round the side, j its jump onto the canopy
   and jp the spot it jumps from (jumpOn);
   jc since when it chases Justin, jx till when it lets him be, nj never him (JCHASE). These went missing at every
   heartbeat before, so a zombie forgot its way up the moment it chose it (the owner's, Nov 17 19:11Z: "WHY THE FUCK ARE
   ZOMBIES NOT COMMITTING ON WALL CLIMBS EVEN WHEN IM STILL ON THE SAME FUCKING ROOF!!!") */
const KEEP =
  "cm k fl wp j jp jc jx nj sp dm wk wt wd wn lt lw li ws sr sx hu na hd sg tc fy fc gt gc gk tw".split(
    " ",
  ); // (gt, gc, gk: till when the Giant waits to throw a zombie, and to try a car, and the car it knocked: giantStep; tw: a zombie it threw; fy, fc: a Flyer's hold on a duck, and till when it waits to leap: flyerStep; ws: which way it goes round a Sandbox wall, sandboxrules.js sbWallGo; sp, dm: a Sandbox spawn's zombie, its spawn and its damage: sbspawn.js; hd, sg, tc: the way it faces, till when it staggers, how many it touches: steer)
// (sr, sx, hu, na: its spot round its duck, the one it gave up, since when it is held up, the way up it gave up: crowd.js SUR)
/* the zombies as objects, from the state's three parts, and back (k in zp: hp · 16 + st, st up to 8, the jump) */
export function zombies(s) {
  const zp = s.hang.zp || [],
    zs = s.hang.zs || {},
    zl = s.hang.zl || {},
    mine = (s.hidden && s.hidden.l4z) || {},
    zj = s.hang.zj || {}, // (a jump or a fall under way: every screen draws it, not only the host's)
    out = [];
  for (let k = 0; k + 3 < zp.length; k += 4) {
    const i = zp[k],
      l = zl[i],
      sw = zs[i] || [-1e6, 0],
      h = mine[i] || [0, 0];
    if (!l) continue;
    out.push({
      i,
      x: zp[k + 1],
      y: zp[k + 2],
      hp: Math.floor(zp[k + 3] / 16) / 100, // (in hundredths: a zombie's HP can be 3.25)
      st: zp[k + 3] % 16,
      a: sw[0],
      dir: sw[1],
      wu: sw[2] || 0, // (its swing's wind-up since, or 0)
      n: h[0],
      d: h[1],
      l,
      ...(h[2] || {}), // (its way up kept to, its roof, its flank, its jump: KEEP)
      ...(!(h[2] && h[2].j) && zj[i] ? { j: zj[i] } : null),
    });
  }
  return out;
}
export function store(s, zs, keepStatic) {
  const zp = [],
    sw = {},
    mine = {},
    zl = {},
    zj = {};
  for (const z of zs) {
    zp.push(
      z.i,
      Math.round(z.x),
      Math.round(z.y),
      Math.round(z.hp * 100) * 16 + z.st,
    );
    if (z.a > -1e5 || z.wu)
      sw[z.i] = z.wu
        ? [Math.round(z.a), z.dir, Math.round(z.wu)]
        : [Math.round(z.a), z.dir];
    mine[z.i] = [Math.round(z.n), Math.round(z.d)];
    const x = {};
    for (const k of KEEP) if (z[k] !== undefined) x[k] = z[k];
    if (Object.keys(x).length) mine[z.i].push(x);
    zl[z.i] = z.l;
    if ((z.st === 8 || z.st === 9) && z.j) zj[z.i] = z.j; // (9: a Flyer's duck's height, flyerStep)
  }
  const sig = (o) => JSON.stringify(o);
  if (sig(zp) !== sig(s.hang.zp)) s.hang.zp = zp;
  if (sig(sw) !== sig(s.hang.zs)) s.hang.zs = sw;
  if (!keepStatic && sig(zl) !== sig(s.hang.zl)) s.hang.zl = zl;
  if (sig(zj) !== sig(s.hang.zj || {})) s.hang.zj = zj;
  if (s.hang.zw) {
    // (the wounds go with their zombie)
    const zw = {};
    for (const z of zs) if (s.hang.zw[z.i]) zw[z.i] = s.hang.zw[z.i];
    if (sig(zw) !== sig(s.hang.zw)) s.hang.zw = zw;
  }
  s.hidden = { ...(s.hidden || {}), l4z: mine };
}
export const zombiesOf = zombies;
/* Sandbox's groups (sbgroups.js): the map's own zombies up now, as copies ({ i, x, y (world px), hp, l, sp, … }), and
   their HP and most HP (l[0]) set again: ch = Map(i → { hp, l }) */
export const l4Zups = (s) =>
  s.hang && s.hang.zp ? zombies(s).filter((z) => z.st !== 3) : [];
export function l4SetHp(s, ch) {
  if (!ch.size || !s.hang || !s.hang.zp) return;
  const zs = zombies(s);
  for (const z of zs) {
    const q = ch.get(z.i);
    if (!q) continue;
    z.hp = q.hp;
    z.l = q.l;
  }
  s.hang = { ...s.hang };
  store(s, zs, false);
}
export const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];
/* a new zombie, at one of the openings (the ones nearer the ducks twice as likely); kind: a special one's breed
   (SPECIAL_Z: "flyer", "giant"), or "" a plain one */
export function newZombie(s, L, T, zs = [], kind = "") {
  const nj = L.made >= L.n * (1 - JCHASE.last); // (the round's last tenth: never after Justin)
  syncMap();
  const ids = players(s).filter((id) => standing(s, id)),
    pts = ids.map((id) => toPx(s.pos[id])),
    near = (o) =>
      Math.min(
        ...pts.map(([x, y]) => Math.hypot(x - o.in[0], y - o.in[1])),
        1e9,
      ),
    order = [...OPENINGS]
      .filter((o) => !dp() || o.kind === "fence") // (Downpour: they come over the fences)
      .sort((a, b) => near(a) - near(b)),
    side = CR.crowdSide(zs, pts),
    pool = CR.awayFrom(side, [...order, ...order.slice(0, dp() ? 1 : 4)]); // (mostly from the side with fewer zombies)
  let o = pool[Math.floor(Math.random() * pool.length)];
  /* Downpour: only from outside the fence, behind it anywhere round the map or out on the road's ends, and never where
     anyone sees it come (the owner's, Nov 17 12:28Z: "zombies can only spawn behind fences or at the ends of the road if
     they arent spawning on a player's screen where they can be seen"); then it climbs over. Of the spots nobody sees,
     one of the nearest to the ducks (so they don't walk round the map for a minute); if all are seen, the furthest */
  let from = o.from;
  if (dp()) {
    const pick = fenceSpot(pts, side);
    if (pick) {
      o = pick.q;
      from = pick.at;
    } else from = byFence(o.fence, FENCE.from, rnd(...o.fence.climb)); // (nowhere to land that leads to anyone: anywhere along it)
  }
  const i = L.next++;
  const B = SPECIAL_Z[kind],
    arm = B ? Z_BREED[kind] : armorRoll(s),
    [size, build, hat, outfit] = B
      ? [B.size || 0, 0, -1, -1] // (no apparel; its breed's size: the Giant's stand-in, the biggest)
      : lookOf(arm),
    max = B ? B.hp : Math.max(1, hp0()),
    jus = !B && Math.random() < Z_JUSTIN ? 1 : 0,
    v = Math.round(B && B.speed ? WALK * B.speed : WALK * rnd(...Z_SPEED)), // (its own speed, every round the same: the owner's, Nov 28 01:57Z, "make every zombie as fast as they are already on round 8")
    [sx, sy] = from || o.out;
  return {
    ...otherWay("zombie"), // (a flanker: flank)
    ...(nj ? { nj: 1 } : {}), // (never after Justin: JCHASE.last)
    i,
    x: sx + (dp() ? 0 : rnd(-12, 12) * (o.axis === "x" ? 1 : 0.3)),
    y: sy + (dp() ? 0 : rnd(-8, 8) * (o.axis === "y" ? 1 : 0.3)),
    hp: max,
    st: 0,
    a: -1e6,
    n: 0,
    d: 0,
    dir: 0,
    l: jus
      ? [max, v, o.id, 0, 0, -1, -1, 1]
      : [max, v, o.id, size, build, hat, outfit, ...(arm ? [0, arm] : [])],
  };
}
/* ---------- the special zombies: the Flyer and the Giant (gamedefaults.js SPECIAL_Z) ----------
   Every heartbeat of a round (L: the round, s.hang.l4's copy; zs: the zombies, the new ones pushed on). L.sz keeps
   this round's: r its round, m its mark (MARKS), and for each kind s its steps up (back one for each wait), o owed (it
   waited: it comes at its next moment without a roll), d done this round. The Giant first, so a Flyer waits for it */
const KINDS = ["giant", "flyer"];
const badNow = (s) => ducks(s).some(badly); // (the team doing badly: any duck low on health or ammo)
export function specialTick(s, L, zs, T) {
  if (KINDS.every((k) => L.r < SPECIAL_Z[k].from)) return; // (before either one's round: nothing, not even a roll)
  let q = L.sz;
  if (!q || q.r !== L.r) {
    q = { r: L.r, m: Math.floor(Math.random() * SPECIAL_Z.MARKS.length) };
    for (const k of KINDS) {
      const B = SPECIAL_Z[k],
        o = (L.sz && L.sz[k]) || { s: L.r - B.from - 1, o: 0 }, // (a game started on a later round: its steps up to there)
        top = Math.round((B.most - B.chance) / B.step);
      q[k] = {
        s: L.r >= B.from ? Math.min(top, o.s + 1) : -1, // (its first round 0 steps)
        o: o.o,
        d: 0,
      };
    }
    L.sz = q;
  }
  if (KINDS.every((k) => q[k].d || L.r < SPECIAL_Z[k].from)) return; // (both done this round)
  let plain = 0; // (the plain ones alive: every heartbeat, so counted, no list made)
  for (const z of zs) if (z.st !== 3 && !(z.l[8] >= Z_BREED.flyer)) plain++;
  if (T < SPECIAL_Z.AT && L.made - plain < SPECIAL_Z.MARKS[q.m] * L.n) return; // (not its moment yet)
  const alive = (k) => zs.some((z) => z.st !== 3 && z.l[8] === Z_BREED[k]);
  q = { ...q };
  for (const k of KINDS) {
    const B = SPECIAL_Z[k];
    if (L.r < B.from || q[k].d) continue;
    const o = { ...q[k], d: 1 },
      chance =
        Math.max(0, B.chance + B.step * o.s) *
        (doingWell(s) ? SPECIAL_Z.WELL : 1);
    q[k] = o;
    if (!o.o && Math.random() >= chance) continue; // (not this round)
    if (KINDS.some((x) => x !== k && alive(x))) {
      o.o = 1; // (the other is alive: next round)
      continue;
    }
    if (badNow(s)) {
      o.o = 1;
      o.s -= 2; // (the team doing badly: next round, and its chance a step under this round's, so each wait drops one)
      continue;
    }
    o.o = 0;
    zs.push(newZombie(s, L, T, zs, k));
  }
  L.sz = q;
}
/* ---------- the Flyer (the owner's, Nov 28; gamedefaults.js SPECIAL_Z.flyer) ----------
   It walks as any zombie does. Near a duck on its floor that nothing holds, with nothing in the way, it leaps at it
   (st 8; z.j[8] its height over the line: zombieroofs.js jumpZ), and landing on it, it holds on (st 9; z.fy: [the duck,
   its next bite, its next tug]): a bite every F.bite ms, a tug a random way every F.pull.ms, a little toward the horde;
   the duck still walks. It lets go when its duck goes down, or when a melee crit throws it off (l4ddrules.js
   meleeHits: only melee reaches it there); then, or after a leap that missed, it waits F.rest ms (z.fc) */
const F = SPECIAL_Z.flyer;
/* the ducks held now, and where the horde is (its middle), for every Flyer this heartbeat */
function flyers(zs) {
  const held = new Set(),
    rest = zs.filter((z) => z.st !== 3 && z.st !== 9),
    n = rest.length || 1;
  for (const z of zs) if (z.st === 9 && z.fy) held.add(z.fy[0]);
  return {
    held,
    horde: [
      rest.reduce((t, z) => t + z.x, 0) / n,
      rest.reduce((t, z) => t + z.y, 0) / n,
    ],
    none: !rest.length,
  };
}
export function flyerOff(z, now) {
  z.st = 2;
  z.n = 0;
  z.fc = now + F.rest;
  delete z.fy;
  delete z.j;
}
/* a Flyer's heartbeat, before the walk every zombie has: true when this did it (it holds on, or leapt) */
function flyerStep(z, c, fly) {
  const { now, pls } = c;
  if (z.st === 9) {
    const q = z.fy && pls.find((p) => p.id === z.fy[0]);
    if (!q || c.down(q)) {
      flyerOff(z, now); // (its duck is down, or gone; Safe Keeping keeps a downed one in pls)
      return true;
    }
    [z.x, z.y] = q.xy;
    z.j = [Math.round(q.zz)]; // (its duck's height, up a floor or in a jump, for every screen: store's zj, zombieZ)
    if (now >= z.fy[1]) {
      z.fy = [z.fy[0], now + F.bite, z.fy[2]];
      if (c.latch(q, rnd(...F.dmg))) flyerOff(z, now);
    }
    if (z.st === 9 && now >= z.fy[2]) {
      z.fy = [z.fy[0], z.fy[1], now + F.pull.ms];
      const a = Math.random() * 2 * Math.PI,
        [hx, hy] = fly.none ? [0, 0] : minus(fly.horde, q.xy), // (no horde: no pull its way)
        hd = Math.hypot(hx, hy) || 1;
      c.tug(
        q,
        Math.cos(a) + (F.pull.horde * hx) / hd,
        Math.sin(a) + (F.pull.horde * hy) / hd,
      );
    }
    return true;
  }
  if (z.st !== 2 || (z.fc || 0) > now || c.cake) return false; // (the zebra cake draws it too)
  const h = zOf(z, "zombie");
  let q = null;
  for (const p of pls) {
    const d = room(z.x, z.y, ...p.xy);
    if (
      !p.j &&
      !p.m &&
      !fly.held.has(p.id) &&
      !c.down(p) && // (Safe Keeping keeps a downed duck in pls)
      d > 1 &&
      d < F.leap &&
      Math.abs(p.zz - h) < 20 &&
      walkable(z.x, z.y, ...p.xy) &&
      (!q || d < room(z.x, z.y, ...q.xy))
    )
      q = p;
  }
  if (!q) return false;
  z.st = 8;
  z.n = 0;
  z.j = [z.x, z.y, ...q.xy, h, q.zz, 0, F.fly, F.up]; // (at its speed along the line, j[7]; its height, j[8])
  return true;
}
/* a Flyer's leap ends: on a duck there that nothing holds, it holds on (every screen hears it, and that duck's hand goes
   to its melee weapon: the owner's "melee is automatically switched to"); else it lands and waits */
function flyerLand(z, c, fly) {
  const q = c.pls.find(
    (p) =>
      !p.j &&
      !p.m &&
      !fly.held.has(p.id) &&
      !c.down(p) &&
      room(z.x, z.y, ...p.xy) < c.reach &&
      Math.abs(p.zz - z.j[5]) < 30,
  );
  if (!q) {
    flyerOff(z, c.now);
    return;
  }
  z.j = [Math.round(q.zz)]; // (its duck's height from the start: zombieZ)
  z.st = 9;
  z.n = 0;
  z.fy = [q.id, c.now + F.bite, c.now + F.pull.ms];
  fly.held.add(q.id);
  addFx(c.s, {
    kind: "l4latch",
    who: [q.id],
    t: c.now,
    x: Math.round(z.x),
    y: Math.round(z.y),
  });
}
/* ---------- the Giant (the owner's 03:28Z; gamedefaults.js SPECIAL_Z.giant) ----------
   It walks as any zombie does, as fast as a duck, climbing twice as fast and stepping up half an elevation, and nothing in
   the crowd holds it back (still: they give way). Its swing throws a duck and hits the zombies beside it (giantHit);
   now and then it throws a zombie beside it at a duck a way off (tossLand), and by a car with a duck past it, it knocks
   the car at it a quarter of the times (giantCar) */
const GT = SPECIAL_Z.giant;
const noGo = (c, p) => !!(p.m || p.j || c.down(p)); // (never the merchant, Justin, or a duck down)
function giantStep(z, c, zs) {
  z.up = GT.up; // (how high it steps: stepZombie)
  giantCar(z, c);
  if (z.st !== 2 || (z.gt || 0) > c.now || c.cake) return;
  const h = zOf(z, "zombie");
  let q = null;
  for (const p of c.pls) {
    const d = room(z.x, z.y, ...p.xy);
    if (
      !noGo(c, p) &&
      d > GT.toss.near &&
      d < GT.toss.far &&
      Math.abs(p.zz - h) < 20 &&
      (!q || d < room(z.x, z.y, ...q.xy)) &&
      walkable(z.x, z.y, ...p.xy)
    )
      q = p;
  }
  const o =
    q &&
    zs.find(
      (o) =>
        o !== z &&
        o.st === 2 &&
        !o.wk &&
        !(o.l[8] >= Z_BREED.flyer) &&
        room(z.x, z.y, o.x, o.y) < GT.toss.by,
    );
  if (!o) return;
  z.gt = c.now + GT.toss.every;
  z.a = c.T; // (its swing, seen on every screen)
  z.dir = Math.round(Math.atan2(q.xy[1] - z.y, q.xy[0] - z.x) * 100);
  o.j = [o.x, o.y, ...q.xy, zOf(o, "zombie"), q.zz, 0, GT.toss.fly, GT.toss.up]; // (the Flyer's flight: zombieroofs.js jumpZ)
  o.st = 8;
  o.n = 0;
  o.tw = 1;
}
/* a zombie it threw comes down: on a duck there, it claws it and shoves it on the way it flew */
function tossLand(z, c) {
  const [x0, y0, , , , h1] = z.j,
    q = c.pls.find(
      (p) =>
        !noGo(c, p) &&
        room(z.x, z.y, ...p.xy) < c.reach &&
        Math.abs(p.zz - h1) < 30,
    );
  z.st = 2;
  z.n = 0;
  delete z.tw;
  delete z.j;
  if (q) c.claw(q, z, [z.x - x0, z.y - y0, GT.toss.knock]);
}
/* its swing at duck q: every zombie in front of it in reach takes a claw and a push, and the duck is thrown (a grab and a
   throw, GT.grab of the swings: farther and higher). True when the duck is down */
function giantHit(q, z, c, zs) {
  const ux = q.xy[0] - z.x,
    uy = q.xy[1] - z.y,
    h = zOf(z, "zombie");
  for (const o of zs)
    if (
      o !== z &&
      o.st === 2 &&
      Math.abs(zOf(o, "zombie") - h) < 50 && // (on its floor only)
      room(z.x, z.y, o.x, o.y) < c.reach &&
      (o.x - z.x) * ux + (o.y - z.y) * uy > 0
    )
      c.hitZ(o, o.x - z.x, o.y - z.y, GT.zknock);
  const grab = !q.m && Math.random() < GT.grab;
  return c.claw(q, z, [
    ux,
    uy,
    grab ? GT.throw : GT.knock,
    { ms: GT.ms, h: grab ? GT.tlift : GT.lift, l: 0 },
  ]);
}
/* car i's box now, world px (carpush.js: s.hang.cars, its way from where the map put it) */
function carBox(s, i) {
  const C = GS.CARS[i],
    [ox, oy] = (s.hang.cars || {})[i] || [0, 0];
  return [C.x0 + ox, C.y0 + oy, C.x1 + ox, C.y1 + oy];
}
/* the car it knocked slides on (z.gk: [the car, its way, px left, the ducks it hit]), every duck it runs into clawed and
   thrown; or, beside a car with a duck past it, it tries (GT.car) */
function giantCar(z, c) {
  const { s, now, pls } = c,
    h = zOf(z, "zombie");
  if (z.gk) {
    const [i, ux, uy, left, hit] = z.gk,
      b = carBox(s, i);
    carsSwing(
      s,
      (b[0] + b[2]) / 2,
      (b[1] + b[3]) / 2,
      1,
      { dx: ux, dy: uy, hit: [] },
      Math.min(left, GT.car.speed * c.dt) * WEIGHT.CAR, // (over its weight: push.js pushOn)
    );
    const [x0, y0, x1, y1] = carBox(s, i),
      moved = Math.hypot(x0 - b[0], y0 - b[1]);
    for (const q of pls)
      if (
        moved >= 1 && // (only a car that moved hits anyone)
        !noGo(c, q) &&
        !hit.includes(q.id) &&
        Math.abs(q.zz - h) < 30 &&
        q.xy[0] > x0 - 12 &&
        q.xy[0] < x1 + 12 &&
        q.xy[1] > y0 - 12 &&
        q.xy[1] < y1 + 12
      ) {
        hit.push(q.id);
        c.claw(q, z, [ux, uy, GT.car.knock, { ms: GT.ms, h: GT.lift, l: 0 }]);
      }
    if (moved < 1 || left - moved < 1) delete z.gk;
    else z.gk = [i, ux, uy, left - moved, hit];
    return;
  }
  if (z.st !== 2 || (z.gc || 0) > now || !dp()) return; // (Downpour's cars only)
  for (let i = 0; i < GS.CARS.length; i++) {
    const [x0, y0, x1, y1] = carBox(s, i),
      cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2,
      d = Math.hypot(cx - z.x, cy - z.y) || 1,
      [ux, uy] = [(cx - z.x) / d, (cy - z.y) / d];
    if (
      Math.hypot(
        Math.max(x0 - z.x, 0, z.x - x1),
        Math.max(y0 - z.y, 0, z.y - y1),
      ) > GT.car.near
    )
      continue;
    const q = pls.find((p) => {
      if (noGo(c, p) || Math.abs(p.zz - h) > 30) return false;
      const vx = p.xy[0] - cx,
        vy = p.xy[1] - cy,
        along = vx * ux + vy * uy;
      return (
        along > 0 &&
        along < GT.car.far &&
        Math.abs(vx * uy - vy * ux) < GT.car.wide
      );
    }); // (a duck past the car, on the way from it through the car)
    if (!q) continue;
    z.gc = now + GT.car.every;
    if (Math.random() < GT.car.chance) {
      const vx = q.xy[0] - cx,
        vy = q.xy[1] - cy,
        e = Math.hypot(vx, vy) || 1;
      z.gk = [i, vx / e, vy / e, GT.car.far, []]; // (at the duck)
      z.a = c.T;
      z.dir = Math.round(Math.atan2(uy, ux) * 100);
    }
    return;
  }
}
/* what a zombie of look l wears that stops hits: "", "helmet" or "swat" (wounds.js armorHit) */
export const zArmor = (l) =>
  l[8] === Z_BREED.swat ? "swat" : helmeted(zombieLook(l)) ? "helmet" : "";
/* armor (the owner's, Nov 28; gamedefaults.js ARMOR): a new zombie's, Z_BREED's or 0. Each kind ARMOR.SPAWN of them,
   from round 1, fewer only while ducks do badly: times 1 - 2 x (ducks doing badly / ducks). Half the helmets an army
   one, half a motorcycle one */
function armorRoll(s) {
  const k = Math.max(0, 1 - 2 * badShare(s)),
    r = Math.random();
  if (r < ARMOR.SPAWN.swat * k) return Z_BREED.swat;
  if (r < (ARMOR.SPAWN.swat + ARMOR.SPAWN.helmet) * k)
    return Math.random() < 0.5 ? Z_BREED.helmet : Z_BREED.moto;
  return 0;
}
/* every helmet but on an armored one: any helmet stops crits, so only armorRoll's wear one (made on first use:
   l4ddrules.js, which ZHATS is from, may load after this) */
let HATS;
const hats = () =>
  (HATS ||= ZHATS.map((_, i) => i).filter(
    (i) => !ARMOR.HATS.includes(ZHATS[i]),
  ));
/* a new zombie's look, every kind's: [size, build, hat, outfit] (l: its look, after its HP, speed and opening); arm:
   its armor's (armorRoll) */
function lookOf(arm = 0) {
  const dress = Math.random() < 0.2 ? Math.random() : -1, // (20% wear something: a hat, an outfit or both)
    hat =
      arm === Z_BREED.helmet || arm === Z_BREED.swat
        ? ZHATS.indexOf("helmet")
        : arm
          ? -1
          : dress >= 0 && dress < 0.6
            ? hats()[rint(0, hats().length - 1)]
            : -1,
    outfit =
      arm === Z_BREED.swat
        ? ZOUTFITS.indexOf("police")
        : dress >= 0.4
          ? rint(0, ZOUTFITS.length - 1)
          : -1,
    odd = Math.random() < 0.25, // (25% are another size or build; every one has the same room on the floor)
    size = odd && Math.random() < 0.5 ? +rnd(-1, 1).toFixed(2) : 0,
    build = odd && !size ? +rnd(-1, 1).toFixed(2) : 0;
  return [size, build, hat, outfit];
}
/* Downpour: a spot behind a fence that no duck sees, one of the nearest to the ducks (pts: where they stand), where one
   coming over lands somewhere that leads to them: { q (its opening), at (outside, by the fence), land (inside) }, or
   null */
const seenBy = (pts, x, y) => CR.seenBy(pts, x, y, VIEW);
function fenceSpot(pts, side) {
  const dist = flowFrom(pts.map((q) => openNear(...q))),
    fences = OPENINGS.filter((q) => q.kind === "fence"),
    long = fences.map((q) => q.fence.climb[1] - q.fence.climb[0]),
    all = long.reduce((a, b) => a + b, 0),
    far = (x, y) =>
      Math.min(...pts.map(([a, b]) => Math.hypot(x - a, y - b)), 1e9),
    hidden = [],
    shown = [];
  for (let t = 0; t < 40; t++) {
    let r = Math.random() * all,
      k = 0;
    while (k < fences.length - 1 && r > long[k]) r -= long[k++];
    const q = fences[k],
      f = q.fence,
      v = f.climb[0] + r,
      [ix, iy] = byFence(f, FENCE.out - FENCE.across, v),
      c = openNear(ix, iy);
    if (c < 0 || !(dist[c] < Infinity) || !zOk(ix, iy, heightAt(ix, iy)))
      continue; // (it would land in a trunk, or where nobody can be reached)
    const at = byFence(f, FENCE.from, v);
    (seenBy(pts, ...at) ? shown : hidden).push({
      q,
      at,
      d: far(...at),
      cs: CR.onCrowdSide(side, ...at) ? 1 : 0, // (the crowd's side of the ducks last: crowd.js crowdSide)
      land: [ix, iy],
    });
  }
  hidden.sort((a, b) => a.d * (1 + 2 * a.cs) - b.d * (1 + 2 * b.cs));
  shown.sort((a, b) => a.cs - b.cs || b.d - a.d); // (all in sight: the far side first, then the farthest)
  const pick = hidden.length
    ? hidden[Math.floor(Math.random() * Math.min(4, hidden.length))]
    : shown[0];
  return pick || null;
}
/* Sandbox: a zombie made at a spawn (sbspawn.js), at (x, y) in shares of the map, already inside and after the ducks
   (st 2), with its spawn's HP, speed (a share of a zombie's own) and damage; its number, or 0 when the map has no room.
   l: its look as newZombie makes it, its opening the nearest one (it never needs it inside) */
export function l4Spawn(s, x, y, o = {}) {
  if (!s.hang.l4) return 0;
  const L = { ...s.hang.l4 },
    z = zombieAt(L, x * W, y * H, o);
  s.hang.l4 = L;
  const zs = zombies(s);
  zs.push(z);
  store(s, zs, false);
  return z.i;
}
/* a zombie at (wx, wy), in world px, already inside (st 2), its number the round's next (L.next goes on): o.hp, o.speed
   (a share of a zombie's own), o.v (its speed itself), o.sp and o.dm (l4Spawn), o.wk (a rest's walker: walkerAt) */
function zombieAt(L, wx, wy, o = {}) {
  syncMap();
  const op = [...OPENINGS].sort(
      (a, b) =>
        Math.hypot(a.in[0] - wx, a.in[1] - wy) -
        Math.hypot(b.in[0] - wx, b.in[1] - wy),
    )[0],
    i = L.next || 1,
    max = Math.max(1, o.hp ? Math.round(o.hp) : hp0()),
    v = o.v || Math.round(zWalk() * (o.speed ?? 1)); // (a Sandbox spawn's Speed 0: it stays put)
  L.next = i + 1;
  return {
    i,
    x: wx,
    y: wy,
    hp: max,
    st: 2,
    a: -1e6,
    n: 0,
    d: 0,
    dir: 0,
    ...(o.sp ? { sp: o.sp } : {}),
    ...(o.dm ? { dm: o.dm } : {}),
    ...(o.wk ? { wk: 1 } : {}),
    l: [max, v, op ? op.id : 0, ...lookOf()],
  };
}
/* ---------- a rest's walkers (the director plan, Nov 28: old Survival's, DIRECTOR.WALKERS) ----------
   z.wk: 1 wandering, 2 come for duck z.wt (it came close, its flashlight's close middle stayed on it, or it hit it:
   l4ddrules.js strike); z.wd, z.wn: where it wanders to, and till when; z.lt, z.lw, z.li: since when a flashlight is on it, and
   how long it takes this time, and whose. A new one turns up on open ground out of every building and out of every duck's sight
   (ids: the ducks standing), slow; null when none is found */
export function walkerAt(s, L, ids) {
  const pts = ids.filter((id) => s.pos[id]).map((id) => toPx(s.pos[id]));
  for (let t = 0; t < 20; t++) {
    const x = Math.round(rnd(GS.RIM.x0, GS.RIM.x1)),
      y = Math.round(rnd(GS.RIM.y0, GS.RIM.y1));
    if (
      GS.inOpen(x, y) &&
      openNear(x, y) >= 0 &&
      !GS.buildingAt(x, y) &&
      zOk(x, y, heightAt(x, y)) &&
      !seenBy(pts, x, y)
    )
      return zombieAt(L, x, y, {
        wk: 1,
        v: Math.round(WALK * Z_SPEED[0] * DIRECTOR.WALKERS.SLOW),
      });
  }
  return null;
}
/* the next round has come: a walker still up is one of its horde, at a zombie's walk */
export function walkerJoins(z) {
  for (const k of ["wk", "wt", "wd", "wn", "lt", "lw", "li"]) delete z[k];
  z.a = -1e6; // (its last swipe was on the rest's clock)
  if (z.st !== 1) z.n = 0; // (and so was its wind-up by a duck; at the boards n is the side it tears from)
  z.wu = z.d = 0; // (and the boards' tearing time)
  z.l = [...z.l];
  z.l[1] = Math.round(WALK * rnd(...Z_SPEED));
}
/* does walker z go on wandering (true), or come for a duck? pls: the ducks (walkAll's), off: the flashlights switched
   off */
function walkerWatch(z, pls, now, off) {
  const K = DIRECTOR.WALKERS;
  if (z.wk === 2) {
    const q = pls.find((q) => q.id === z.wt);
    if (q && room(z.x, z.y, ...q.xy) <= K.LOSE) return false;
    z.wk = 1;
    delete z.wt;
  }
  let lit = null;
  for (const q of pls) {
    if (q.m) continue; // (never the merchant)
    if (room(z.x, z.y, ...q.xy) < K.NEAR) {
      [z.wk, z.wt] = [2, q.id];
      return false;
    }
    if ((!lit || q.id === z.li) && litBy(z, q, off)) lit = q; // (the duck already lighting it first)
  }
  if (!lit) {
    for (const k of ["lt", "lw", "li"]) delete z[k];
    return true;
  }
  if (lit.id !== z.li)
    [z.lt, z.lw, z.li] = [now, Math.round(rnd(...K.SEEN)), lit.id]; // (each duck's light counts on its own)
  if (now - z.lt < z.lw) return true;
  [z.wk, z.wt] = [2, lit.id];
  for (const k of ["lt", "lw", "li"]) delete z[k];
  return false;
}
/* is walker z in the close middle of duck q's flashlight (DIRECTOR.WALKERS.BEAM), with nothing between? */
function litBy(z, q, off) {
  const p = q.p,
    B = DIRECTOR.WALKERS.BEAM;
  if (!p || off[q.id]) return false;
  const ax = (+p.ax || 0) * W,
    ay = (+p.ay || 0) * H,
    l = Math.hypot(ax, ay),
    dx = z.x - q.xy[0],
    dy = z.y - q.xy[1],
    d = Math.hypot(dx, dy);
  if (l < 1e-6 || d < 1 || d > B.far) return false;
  if ((dx * ax + dy * ay) / (d * l) < Math.cos(B.half)) return false;
  return clearShot(q.xy[0], q.xy[1], z.x, z.y);
}
/* a walker wandering, slowly, from one spot near it to the next, never into the church, standing about at each a while */
function wander(z, far, pls, now) {
  const K = DIRECTOR.WALKERS;
  if (!z.wd && now < (z.wn || 0)) return;
  if (!z.wd || now >= z.wn) {
    delete z.wd;
    for (let t = 0; t < 8 && !z.wd; t++) {
      const a = Math.random() * 2 * Math.PI,
        r = rnd(120, K.ROAM),
        x = Math.round(z.x + Math.cos(a) * r),
        y = Math.round(z.y + Math.sin(a) * r);
      if (
        openNear(x, y) >= 0 &&
        GS.buildingAt(x, y) !== CHURCH &&
        walkable(z.x, z.y, x, y)
      )
        z.wd = [x, y];
    }
    z.wn = now + (z.wd ? 12000 : rnd(...K.IDLE));
    if (!z.wd) return;
  }
  if (Math.hypot(z.x - z.wd[0], z.y - z.wd[1]) < 24) {
    delete z.wd;
    z.wn = now + rnd(...K.IDLE);
    return;
  }
  stepZombie(z, z.wd, far, pls);
}
/* Sandbox: the zombies standing now, each { i, x, y (shares of the map), sp (its spawn) } */
export const l4Live = (s) =>
  s.hang && s.hang.zp
    ? zombies(s)
        .filter((z) => z.st !== 3)
        .map((z) => ({ i: z.i, x: z.x / W, y: z.y / H, sp: z.sp }))
    : [];
export function moveZombies(s, zs, now, T, up, seers = up) {
  const tk = (s.hidden && s.hidden.l4tk) || now - 200,
    dt = Math.min(0.35, Math.max(0.05, (now - tk) / 1000)),
    brd = { ...(s.hang.brd || {}) },
    pls = up.map((id) => {
      const p = s.pos[id],
        xy = toPx(p),
        zz = zOf(p),
        on = dp() ? mapDeck(deckAt(xy[0], xy[1], zz)) : null, // (Downpour: up on a roof, or the canopy; Sandbox's floors are Phase 4's zombies, later)
        dk = chaseDeck(on),
        way = dk && dk.kind === "canopy" ? stationDeck() : dk; // (the canopy: by way of the gas station's roof, then a jump)
      return {
        id,
        p,
        xy,
        zz,
        dk,
        on,
        way,
        goal: (way && climbSpot(way, xy)) || xy,
        cap: way ? fits("zombie", way.x1 - way.x0, RX) : Infinity, // (how many side by side up it: crowd.js leastWay)
        alts:
          dk && dk.kind === "canopy"
            ? [
                { way: dk, goal: ladderFoot(), cap: 1 },
                {
                  way: carLeap(),
                  goal: climbSpot(carLeap(), xy),
                  cap: fits("zombie", carLeap().x1 - carLeap().x0, RX),
                },
              ] // (or up the ladder on its left, or the red car's roof and a jump: whichever is nearest the zombie and not full)
            : [],
        j: isWild(s, id), // (Justin out there: JCHASE)
      };
    });
  /* the merchant running away: chased as Justin is, until he's over the fence or off the balcony (the owner's, Nov 18
     13:46Z: "zombies might try and chase them like they are a player UNLESS they climb a fence OR jump off the
     balcony, then they give up"); never his body */
  merchantsOf(s).forEach((mm, k) => {
    if ((mm.st === "out" || mm.st === "fight") && !mm.c)
      pls.push({
        id: "@m" + k,
        p: null,
        xy: [mm.x, mm.y],
        zz: heightAt(mm.x, mm.y),
        dk: null,
        way: null,
        goal: [mm.x, mm.y],
        j: true,
        m: k + 1, // (which one: merchantHurtAt)
      });
  });
  s.hidden = { ...(s.hidden || {}), l4tk: now };
  const field = pls.filter((q) => !q.j),
    dist = flowFrom(
      (field.length ? field : pls).flatMap((q) =>
        [q.goal, ...(q.alts || []).map((a) => a.goal)].map((g) =>
          openNear(...g),
        ),
      ),
      true,
    ); // (to a duck up on a roof: to the foot of its wall. The players only: a zombie after Justin finds its own way, wayTo)
  const p4 = { ...s.hang.l4p },
    eating = { ...((s.hidden && s.hidden.l4ze) || {}) };
  for (const k of Object.keys(eating))
    if (k !== "fx" && eating[k] <= now) delete eating[k];
  const c = {
    s,
    now,
    T,
    dt,
    pls,
    dist,
    brd,
    eating,
    eyes: seers.filter((id) => s.pos[id]).map((id) => toPx(s.pos[id])), // (every duck's screen, God mode's too, though the zombies ignore it; never Justin's)
    cake: cakeDown(s, now),
    swipe: SWIPE,
    reach: CLAW,
    way: (x, y, tx, ty) => wayTo(x, y, tx, ty, now),
    bite: (x, y) => addFx(s, { kind: "l4bite", who: [], t: now, x, y }),
    claw: (target, z, fl) => mapClaw(s, p4, target, z, now, fl),
    hitZ: (o, ux, uy, px) => zombieHit(s, o, clawDmg(), ux, uy, px, now, T), // (the Giant's swing on a zombie)
    down: (q) => !!(p4[q.id] || {}).dn, // (a duck down, Safe Keeping's too: a Flyer lets go)
    latch: (q, dmg) => hurtDuck(s, p4, q.id, now, "claw", dmg), // (a Flyer's bite: true once its duck is down)
    tug: (q, ux, uy) => tugDuck(s, q.id, ux, uy, F.pull.px, now), // (a Flyer's tug: as a shove, l4ddrules.js)
  };
  walkAll(zs, c);
  fireTick(s, zs, now, T, p4);
  s.hang.l4p = p4;
  s.hang.brd = brd;
  s.hidden = { ...s.hidden, l4ze: eating };
}
/* a swipe on the map: at the merchant or a duck (p4: the ducks' points this heartbeat). True when the target
   is down (no more swipes at it this heartbeat). fl: [ux, uy (any length), px, more], a duck it hits and leaves up is thrown so
   (the Giant's: giantHit; tugDuck) */
function mapClaw(s, p4, target, z, now, fl) {
  if (target.m) return merchantHurtAt(s, target.m - 1, null, 1, now, "claw"); // (the merchant: a swipe takes 1, and no line)
  if (dodging(s, target.p, now)) return false;
  const down = hurtDuck(
    s,
    p4,
    target.id,
    now,
    "claw",
    z.dm ? (valueOf({ ok: z.dm }, SB_BOXES.damage) ?? 1) : clawDmg(), // (the owner's, Nov 19 19:27Z: "zombies could do anywhere from 0.6 to 1 damage")
  );
  const u = fl && Math.hypot(fl[0], fl[1]);
  if (u && !down)
    tugDuck(s, target.id, fl[0] / u, fl[1] / u, fl[2], now, fl[3]); // (a way of length 1: boardfire.js shove)
  return down;
}
/* ---------- the walk: every zombie's heartbeat, on whatever ground (the template every walk runs) ----------
   c: what the walk it is part of hands it: s, now, T (the clock its swipes keep), dt, pls (what they go for: ducks, and
   on the map the merchant), dist (the flow field to them; none on open ground: straight at them), brd (the boards up),
   eating, cake ([x, y] or null), swipe ([wind-up, between]), reach (duck lengths), way(x, y, tx, ty) (the next point
   toward a spot), bite(x, y) (a chomp at the cake, or null) and claw(target, z) (a swipe's hit: true once the target is
   down) */
function walkAll(zs, c) {
  const { s, now, T, dt, pls, dist, brd, eating, cake } = c;
  const onWay = {}; // (the ones keeping to each way up, by its place in DECKS: crowd.js leastWay)
  for (const z of zs) if (z.cm && z.st !== 3) (onWay[z.cm[3]] ||= []).push(z);
  const taken = CR.spotsTaken(zs, now),
    G = { ...gr(), walk: walkable },
    eyes = c.eyes || pls.filter((q) => !q.j).map((q) => q.xy),
    rush = T >= ZOMBIE_GRACE, // (off every duck's screen they come twice as fast, but not in a round's first ZOMBIE_GRACE ms)
    fly = c.latch && flyers(zs);
  for (const z of zs) {
    if (z.st === 3) {
      if (z.gk && fly) giantCar(z, c); // (a car the Giant knocked slides on after it falls)
      continue;
    }
    const o = z.l[2] ? openingById(z.l[2]) : null,
      v =
        z.l[1] *
        walkOf(s) * // (as much faster or slower as the ducks, by the lobby's Walking speed)
        wetK(z.x, z.y, zOf(z, "zombie")) * // (water: as slow of its own walk as a duck is of its, layout.js)
        (rush && !seenBy(eyes, z.x, z.y) ? 2 : 1) * // (the owner's, Nov 23 00:32Z: "speed up the zombies by twice the amount of speed when they're not on a player screen")
        (z.sg > now ? STAGGER.k : 1), // (just hit: a short stagger)
      sp = o && sidesOf(o, z),
      gt = fly && z.l[8] === Z_BREED.giant, // (the Giant: giantStep, giantHit)
      cl = gt ? GT.climb : 1, // (how much faster it climbs)
      claw = gt ? (q) => giantHit(q, z, c, zs) : c.claw;
    if (fly && z.l[8] === Z_BREED.flyer && flyerStep(z, c, fly)) continue;
    if (gt) giantStep(z, c, zs);
    if (z.st === 0) {
      // coming: to the spot outside its opening (Downpour: the foot of the fence)
      const [tx, ty] = sp.out;
      if (walkTo(z, tx, ty, v * dt)) {
        z.st = o.fence ? 5 : brd[o.id] > 0 ? 1 : 4;
        z.d = T;
      }
      continue;
    }
    if (z.st === 5) {
      /* over the fence: up it like a ladder at its walking speed (FENCE.mid across while it climbs FENCE_H), then a
         drop from the top down the inside (fenceZ) */
      const f = o.fence,
        top = FENCE.out - FENCE.mid,
        up = !f.open && acrossFence(f, z.x, z.y) > top + 1,
        [tx, ty] = up ? byFence(f, top, f.axis === "y" ? z.y : z.x) : sp.in;
      if (
        walkTo(
          z,
          tx,
          ty,
          up
            ? (FENCE.mid * v * dt * cl) / GS.FENCE_H
            : f.open
              ? v * dt // (the road's ends: no fence, it walks in)
              : ((FENCE.across - FENCE.mid) * dt) / FENCE.FALL,
        ) &&
        !up
      ) {
        z.st = 2;
        z.n = 0;
      }
      continue;
    }
    if (z.st === 1) {
      // tearing the boards down, one at a time (Downpour: from whichever side it came to them)
      if (dp() && walkTo(z, sp.out[0], sp.out[1], v * dt) === false) continue;
      /* Downpour: it keeps at the window it chose on its way, but for a duck very close to it outside the church: it
         goes for that one (the owner's, Nov 17 18:05Z: "they commit to breaking a window if the player isnt very close
         to them outside the church") */
      if (
        dp() &&
        pls.some(
          (q) =>
            !q.dk &&
            whereIn(q.xy[0], q.xy[1], q.zz) !== CHURCH &&
            room(z.x, z.y, ...q.xy) < TEAR_NEAR,
        )
      ) {
        z.st = 2;
        z.n = 0;
        continue;
      }
      if (!(brd[o.id] > 0)) {
        z.st = 4;
        continue;
      }
      if (T - z.d >= L4.TEAR_MS) {
        brd[o.id] = Math.max(0, brd[o.id] - 1);
        z.d = T;
      }
      continue;
    }
    if (z.st === 4) {
      // climbing in through the opening (the boards are down)
      if (brd[o.id] > 0) {
        if (Math.hypot(z.x - sp.out[0], z.y - sp.out[1]) < 30) {
          z.st = 1;
          z.d = T;
        }
      }
      if (walkTo(z, sp.in[0], sp.in[1], v * dt)) {
        z.st = 2;
        z.n = 0;
      }
      continue;
    }
    if (z.st === 6) {
      // up a wall onto a roof (its own: z.k), straight in from its edge, slowly (its height: climbZ)
      const e = edgeOf(z.x, z.y, deckOf(z)),
        far = v * dt * CL.speed * cl * (deckOf(z)?.kind === "car" ? CL.hop : 1); // (a car: a hop up)
      if (!pls.some((q) => reaches(q, e.d))) {
        /* nobody left up there (off the roof, not just jumping on it): it gives up its climb and climbs back down (the
           owner's, Nov 19 19:27Z: "If a player jumps off a roof, zombies will stop committing to their climb if they
           jump off. Not if they jump in the air, but if they are off the roof") */
        z.x += e.nx * far;
        z.y += e.ny * far;
        if (e.o + far >= CL.out) {
          z.st = 2;
          z.n = 0;
          delete z.k;
          delete z.cm;
        }
        continue;
      }
      z.x -= e.nx * far;
      z.y -= e.ny * far;
      if (e.o - far <= -CL.in) {
        z.st = 7;
        z.n = 0;
        delete z.cm; // (up: the way it kept to is done)
      }
      continue;
    }
    if (z.st === 8) {
      // jumping from the gas station's roof onto the canopy (or, 1 time in 20, short of it, down to the ground), or walking up the plank
      const [, , x1, y1, , h1, walk, fall] = z.j,
        q =
          walk &&
          pls.find(
            (q) =>
              (!z.wk || q.id === z.wt) && // (a rest's walker claws only the duck it came for)
              room(z.x, z.y, ...q.xy) < c.reach &&
              Math.abs(q.zz - jumpZ(z)) < 50,
          );
      if (q) {
        if (T - (z.a || 0) >= c.swipe[1]) {
          z.a = T;
          z.dir = Math.round(Math.atan2(q.xy[1] - z.y, q.xy[0] - z.x) * 100);
          if (c.claw(q, z)) pls.splice(pls.indexOf(q), 1);
        }
        continue;
      } // (a duck on the plank in its way: it stops there and claws at it)
      if (walkTo(z, x1, y1, (fall || (walk ? v : JUMP.speed)) * dt)) {
        if (z.j[8] && fly) {
          (z.tw ? tossLand : flyerLand)(z, c, fly);
          continue;
        } // (the Flyer's leap, or a zombie the Giant threw)
        const fell = h1 < canopyDeck().h - 1;
        z.st = fell ? 2 : 7;
        z.n = 0;
        if (fell) delete z.k;
        else z.k = GS.DECKS.indexOf(canopyDeck());
        delete z.j;
      }
      continue;
    }
    if (
      z.wk &&
      z.st === 2 &&
      walkerWatch(z, pls, now, (s.hang && s.hang.l4f) || {})
    ) {
      wander(z, v * dt, pls, now);
      continue;
    } // (a rest's walker: it wanders till a duck makes it come)
    let target = null,
      best = Infinity;
    /* how far a duck counts as, to this zombie: Justin twice his distance, or out of mind (JCHASE); a walker, only the
       duck it came for */
    const far = (q) =>
      z.wk
        ? q.id === z.wt
          ? 1
          : Infinity
        : !q.j
          ? 1
          : z.nj || (z.jx || 0) > now
            ? Infinity
            : JCHASE.far;
    if (z.st === 7) {
      /* on a roof: straight at the nearest duck up there; a hole underfoot and it falls in; nobody left up there (or
         the cake down), it walks off the nearest edge and drops */
      const e = edgeOf(z.x, z.y, deckOf(z));
      if (!deckAt(z.x, z.y, e.d.h)) {
        const a = (z.dir || 0) / 100;
        dropOff(
          z,
          Math.cos(a),
          Math.sin(a),
          deckH(e.d, z.x, z.y),
          FALL.out / 3,
        ); // (a hole underfoot: down through it, seen falling)
        continue;
      }
      for (const q of pls)
        if (
          q.dk === chaseDeck(e.d) &&
          room(z.x, z.y, ...q.xy) * far(q) < best
        ) {
          best = room(z.x, z.y, ...q.xy) * far(q);
          target = q;
        }
      if (target) best = room(z.x, z.y, ...target.xy); // (how far it really is)
      if (!target && !cake && jumpOn(z, pls, v * dt, e.d)) continue; // (nobody up here, a duck on the canopy: to the roof's edge facing it, then the jump)
      if (!target || cake) {
        walkTo(z, z.x + e.nx * 200, z.y + e.ny * 200, v * dt);
        if (edgeOf(z.x, z.y, e.d).o >= CL.out)
          dropOff(z, e.nx, e.ny, deckH(e.d, z.x, z.y)); // (off the edge: it falls, seen falling)
        continue;
      }
      if (best > ROOF_BACK) {
        const k = 1 - 1 / best, // (up to it, not into it)
          at =
            !target.j &&
            best > CR.SUR.r + 1 && // (close in, straight at it: a roof's too tight to go round)
            CR.surroundAim(z, target, taken, now, G.rx, G.ry, (x, y) =>
              onDeckAt(e.d, x, y),
            ); // (up here too, round to the free side of the duck, never queued behind the first one)
        roofStep(
          z,
          ...(at || [
            z.x + (target.xy[0] - z.x) * k,
            z.y + (target.xy[1] - z.y) * k,
          ]),
          v * dt,
        );
        const o2 = edgeOf(z.x, z.y, e.d),
          P = target.on && target.on.kind === "plank" ? target.on : null;
        if (P && e.d !== P && onDeckAt(P, z.x, z.y))
          z.k = GS.DECKS.indexOf(P); // (onto the plank, after a duck on it)
        else if (o2.o > -6) {
          z.x += o2.nx * (o2.o + 6) * -1;
          z.y += o2.ny * (o2.o + 6) * -1;
        } // (never off its edge while it goes for a duck)
      }
    }
    /* every zombie in goes for the zebra cake while it lies there (the owner's, Nov 3: it draws them all away from the
       ducks), and each one there bites it again and again, chewing between bites, until the cake is gone by itself */
    if ((eating[z.i] || 0) > now) continue;
    if (cake && z.st !== 7) {
      if (Math.hypot(z.x - cake[0], z.y - cake[1]) < CAKE_R) {
        eating[z.i] = now + CAKE_BITE;
        if (c.bite && now - (eating.fx || 0) >= 450) {
          eating.fx = now;
          c.bite(z.x, z.y);
        } // (a chomp now and then, not one for every zombie at it)
        continue;
      }
      const aim =
        Math.hypot(z.x - cake[0], z.y - cake[1]) < 120
          ? cake
          : c.way(z.x, z.y, cake[0], cake[1]) || cake; // (no way from the field: straight at it, see below)
      if (aim) stepZombie(z, aim, v * dt, pls);
      z.n = 0;
      continue;
    }
    if (z.st !== 7) {
      /* in: along the flow field, or straight at a duck close by; never into a duck. A duck up on a roof: to the foot
         of its wall nearest it, then up the wall */
      /* a way up kept to (z.cm: [the duck, the foot of the wall, the deck]): the owner's, Nov 17 18:05Z, "it keeps to it
         until it has climbed the wall and then targets the player as usual OR it resorts to what you described IF they
         leave the floor into a location NEAR ENOUGH to them during the commit" */
      let goal = null;
      const cm = z.cm && pls.find((q) => q.id === z.cm[0]);
      if (cm && reaches(cm, GS.DECKS[z.cm[3]])) {
        target = cm;
        goal = [z.cm[1], z.cm[2]];
        best = room(z.x, z.y, ...goal);
      } else {
        delete z.cm;
        for (const q of pls) {
          const d = room(z.x, z.y, ...q.goal) * far(q);
          if (d < best) {
            best = d;
            target = q;
          }
        }
        if (!target) continue;
        const w = (target.alts || []).length
            ? leastWay(
                "zombie",
                [target, ...target.alts],
                (a) =>
                  (onWay[GS.DECKS.indexOf(a.way)] || []).filter(
                    (q) =>
                      !!q.cm &&
                      q.st !== 3 &&
                      (q.st === 6 ||
                        room(q.x, q.y, q.cm[1], q.cm[2]) <
                          room(z.x, z.y, ...a.goal)),
                  ).length, // (the ones ahead of it there: up it already, or nearer its foot)
                (a) =>
                  room(z.x, z.y, ...a.goal) +
                  CR.gaveUp(z, GS.DECKS.indexOf(a.way), now),
              )
            : target, // (the canopy's ladder, or the red car, is nearer than the gas station's wall: that way, unless it's full: crowd.js leastWay)
          way = w.way;
        goal = w.goal;
        if (w !== target) best = room(z.x, z.y, ...goal);
        if (target.j) best = room(z.x, z.y, ...goal); // (how far it really is, for what follows)
        if (way) {
          const k = GS.DECKS.indexOf(way);
          z.cm = [target.id, goal[0], goal[1], k]; // (its way up, from now on)
          (onWay[k] ||= []).push(z);
        }
      }
      /* at the foot of its wall, outside: up it goes. Never from inside, under the roof (the owner's, Nov 17 20:02Z: "WHEN
         THEY TRY TO ATTACK A PLAYER ON THE ROOF, THEY TRY TO GET ON THE ROOF, THEY DONT TRY TO GO UNDER IT FROM THE
         INSIDE OF THE BUILDING AND ATTACK FROM THE FUCKING FLOOR"): from in there it walks out to the foot first */
      const up =
        z.cm &&
        best < CL.along &&
        !deckOver(z.x, z.y, zOf(z, "zombie")) &&
        climbFrom(z, GS.DECKS[z.cm[3]], z.cm[1], z.cm[2]);
      /* up from the foot of its way up, or from the same wall straight in front of it, a few ducks along: one spot
         was all a crowd had, and as they keep a duck apart, none got near enough to it and none went up (the owner's,
         Nov 22 18:13Z: "zombies that will not move and will not kill me", under him on the gas station's roof) */
      if (
        up &&
        (best < 0.9 ||
          ((up[0] !== z.cm[1] || up[1] !== z.cm[2]) &&
            Math.hypot(up[0] - z.x, up[1] - z.y) < CL.deep))
      ) {
        const at = up;
        if (Math.hypot(at[0] - z.x, at[1] - z.y) > CL.at) {
          walkTo(z, ...at, v * dt);
          continue;
        } // (to it first, on the ground; up from the next heartbeat on, so it is drawn there before it climbs)
        [z.x, z.y] = at;
        z.st = 6;
        z.k = z.cm[3];
        z.n = 0;
        continue;
      }
      const cc = dist ? openNear(z.x, z.y) : -1,
        close =
          !dist || // (open ground: no field, straight at it)
          ((best < 2.6 || (cc >= 0 && dist[cc] <= 1.5)) &&
            walkable(z.x, z.y, ...goal)); // (straight at it only with nothing in between: a trunk, a car or a pew in the way and it goes round by the field)
      let aim = close
        ? goal
        : z.cm || target.j || z.wk
          ? c.way(z.x, z.y, goal[0], goal[1]) // (its own way up's foot, wherever the duck goes meanwhile; Justin: the field is the players')
          : lane(z, heading(dist, z.x, z.y));
      /* the field has no way on when the zombie's cell is already its goal's, or the nearest open one to it (pressed
         into a wall's foot under a duck on the roof, or across a trunk from a duck): it went nowhere, and the crowd
         behind it waited for good (the owner's, Nov 22 18:07Z and 18:13Z: "stuck on a tree ... not moving around it",
         "zombies that will not move and will not kill me"). Then it's straight at its goal, and stepZombie's turns take
         it round what's in between, as everywhere else (chaseStep, wayTo's callers) */
      aim ||= goal;
      if (z.fl && !z.cm && !close) aim = flank(z, target, now) || aim; // (a flanker: round the side first)
      if (!z.cm && !target.j && best < CR.SUR.near && zFloor(z) === target.dk)
        aim = CR.surround(z, target, taken, now, G, c.reach) || aim; // (round to the free side of the duck)
      else if (CR.stuck(z, target, now, G, c.reach)) delete z.cm; // (held up at a ladder: another way)
      /* Downpour: its way goes through a boarded hole with its boards up: it stops there and tears them down */
      const bh = aim && dp() && boardsAhead(z, aim, brd);
      if (bh) {
        z.l = [...z.l];
        z.l[2] = bh.o.id;
        z.n = bh.side;
        z.st = 1;
        z.d = T;
        continue;
      }
      if (aim) {
        const far =
          v *
          dt *
          (gt
            ? 1
            : Math.max(CROWD_SLOW.least, 1 - CROWD_SLOW.each * (z.tc || 0))); // (slower in a crowd, by how many it touches; never the Giant, which shoves them aside)
        stepZombie(z, steer(z, aim, far, dt), far, pls);
      }
    }
    /* after Justin: only so long, then it lets him be a while (JCHASE) */
    if (target.j) {
      if (!z.jc) z.jc = now;
      else if (now - z.jc > JCHASE.give) {
        z.jx = now + JCHASE.off;
        delete z.jc;
        if (z.cm && z.cm[0] === target.id) delete z.cm;
      }
    } else delete z.jc;
    /* the claw: at a duck long enough, then again every so often (it keeps walking meanwhile); only one on its own
       floor (zFloor), never one up on a roof over it or down below it, nor one up the ladder */
    const d = room(z.x, z.y, ...target.xy);
    if (
      d < c.reach + (duckBig(s, target.id) - 1) / 2 && // (a duck bigger than 100% is reached sooner: duck.js)
      zFloor(z) === target.dk &&
      Math.abs(target.zz - zOf(z, "zombie")) < 50
    ) {
      /* a swing: at its duck c.swipe[0] (its wind-up) and c.swipe[1] since its last hit. The wind-up shows from z.wu (since
         when, sent to every screen for the tell and the swipe lines: Adam, Nov 21 18:47Z), at least c.swipe[0] before
         the hit */
      if (!z.n) z.n = T || 1;
      if (!z.wu && T - z.a >= c.swipe[1] - c.swipe[0]) z.wu = T || 1;
      if (T - z.n >= c.swipe[0] && T - z.a >= c.swipe[1]) {
        z.a = T;
        z.wu = 0;
        z.dir = Math.round(
          Math.atan2(target.xy[1] - z.y, target.xy[0] - z.x) * 100,
        );
        if (claw(target, z)) pls.splice(pls.indexOf(target), 1);
      }
    } else z.n = z.wu = 0; // (out of reach: the swing is lost)
  }
  separate(zs);
}
/* how high a zombie climbing a fence (its opening id) is, at (x, y) (0 once down): up at its walking speed, then falling
   from the top */
export function fenceZ(x, y, id) {
  const o = openingById(id),
    f = o && o.fence;
  if (!f || f.open) return 0;
  const u = (FENCE.out - acrossFence(f, x, y)) / FENCE.across;
  if (u <= 0 || u >= 1) return 0;
  const m = FENCE.mid / FENCE.across;
  return u <= m
    ? GS.FENCE_H * (u / m)
    : GS.FENCE_H * (1 - ((u - m) / (1 - m)) ** 2);
}
export const STATION = 1; // (layout.js whereIn: the gas station)
const CHURCH = 2, // (and the chapel)
  TEAR_NEAR = 2.2; // duck lengths (room): a duck this close outside the church takes a zombie off the window it tears at // duck lengths (room): a duck that left the floor this close to a zombie keeping to its way up
/* ---------- flankers: the other way round (crowd.js otherWay), for a duck on the ground; along the flow field to
   its spot round the side. No room on either side (a wall, the trees, the flood's edge) and it comes as the others */
function flank(z, q, now) {
  if (!q || q.dk) return null;
  if (!z.wp || z.wp[2] !== q.id) {
    const at = sideSpot(
      "zombie",
      z,
      q.xy,
      z.fl,
      RX,
      RY,
      (x, y) => zOk(x, y, heightAt(x, y)) && openNear(x, y) >= 0,
    );
    z.wp = at ? [...at, q.id, 0] : [0, 0, q.id, 1];
  }
  if (z.wp[3]) return null;
  if (sideDone("zombie", z, z.wp, q.xy, room, RX)) {
    z.wp = [...z.wp.slice(0, 3), 1]; // (round the side: now straight at it)
    return null;
  }
  return wayTo(z.x, z.y, z.wp[0], z.wp[1], now);
}
/* the floor a zombie is on, as a duck's (deckAt: a roof, or null: the ground); undefined while it climbs a wall or
   jumps, between two floors. A zombie only ever claws a duck on its own floor (the owner's, Nov 17 20:02Z: "ZOMBIES
   CANNOT CANNOT CANNOT HIT SOMEONE ON A FLOOR ABOVE THEM AND VICE VERSA!! ... THOSE RULES I DESCRIBED ONLY APPLIED TO
   PROJECTILES THAT PLAYERS USE"), and a duck on fire only sets one on its own floor alight */
export const zFloor = (z) =>
  z.st === 6 || z.st === 8
    ? undefined
    : dp()
      ? deckAt(z.x, z.y, zOf(z, "zombie"))
      : null;
export const duckFloor = (p) => (dp() ? deckAt(...toPx(p), zOf(p)) : null);
/* a zombie's height: up a fence, up a wall, on a roof (alive or dead there: l4ddrules.js die), jumping onto the canopy,
   or on the ground */
const zombieZ = (z) =>
  z.st === 5
    ? fenceZ(z.x, z.y, z.l[2]) || gr().h(z.x, z.y) // (off it, or walking in at the road's ends: the ground)
    : z.st === 6
      ? climbZ(z.x, z.y, deckOf(z))
      : z.st === 7 || (z.st === 3 && deckOf(z))
        ? deckH(edgeOf(z.x, z.y, deckOf(z)).d, z.x, z.y)
        : z.st === 8 && z.j
          ? jumpZ(z)
          : z.st === 9
            ? (z.j ? z.j[0] : gr().h(z.x, z.y)) + F.ride // (a Flyer on a duck: on its back, at its duck's height)
            : gr().h(z.x, z.y);
heightWay("zombie", zombieZ); // (every zombie's height is asked through heights.js zOf)
/* an opening's two spots for zombie z: out (where it waits and tears) and in (where it's through). A fence's at the
   zombie's own place along it; a boarded hole on Downpour from the side it came to it (z.n: 1 outside, -1 inside) */
function sidesOf(o, z) {
  if (o.fence)
    return o.axis === "y"
      ? { out: [o.out[0], z.y], in: [o.in[0], z.y] }
      : { out: [z.x, o.out[1]], in: [z.x, o.in[1]] };
  return z.n === -1 ? { out: o.in, in: o.out } : o;
}
/* Downpour: does a zombie's way (from it to aim) go through a boarded hole with boards up? Its opening and side */
export function boardsAhead(z, aim, brd) {
  for (const o of OPENINGS) {
    if (o.kind !== "hole" || !(brd[o.id] > 0)) continue;
    const [al, ac, bc] =
      o.axis === "x"
        ? [z.x, z.y - o.y, aim[1] - o.y]
        : [z.y, z.x - o.x, aim[0] - o.x];
    if (al < o.a - 20 || al > o.b + 20 || Math.abs(ac) > 90) continue;
    if (Math.sign(ac) === Math.sign(bc) && Math.abs(bc) > 24) continue;
    const outward = Math.sign(
      (o.axis === "x" ? o.out[1] - o.y : o.out[0] - o.x) || 1,
    );
    return { o, side: Math.sign(ac) === outward ? 1 : -1 };
  }
  return null;
}
/* straight toward (tx, ty), through anything (outside, or climbing in): true on arrival */
export function walkTo(z, tx, ty, far) {
  const dx = tx - z.x,
    dy = ty - z.y,
    d = Math.hypot(dx, dy);
  if (d <= far) {
    z.x = tx;
    z.y = ty;
    return true;
  }
  z.x += (dx / d) * far;
  z.y += (dy / d) * far;
  return false;
}
/* inside: a few small steps toward aim. Something in the way (a trunk, a car, a pew, a wall's end): it slides along it,
   or turns a little more each try (30, 60, then 90 degrees, either way) until a step is free, so it walks round instead
   of standing pressed against it (the owner's, Nov 17 05:46Z: zombies got stuck on trees and didn't know to go round).
   Stopping only at ducks. Stood inside something (pushed or climbed in there), it walks out toward aim */
const TURNS = [0, 0.52, -0.52, 1.05, -1.05, 1.57, -1.57];
/* Sandbox's walls (sandboxrules.js sbZombieWall), while the zombies of a Sandbox walk */
let ZW = null;
export const setZWall = (f) => (ZW = f);
/* Reynolds' steering (1999): a zombie turns toward aim at most its own turn rate (TURN, radians a second, each its
   own by its number), so a crowd swings round as it comes instead of snapping about; near aim it goes straight there.
   The point it heads for now, far px a step */
const TURN = [2.5, 5];
export function steer(z, aim, far, dt) {
  const dx = aim[0] - z.x,
    dy = aim[1] - z.y,
    d = Math.hypot(dx, dy);
  if (d < 1) return aim;
  const want = Math.atan2(dy, dx),
    was = z.hd === undefined ? want : z.hd / 100,
    tr = TURN[0] + ((z.i * 0.618034) % 1) * (TURN[1] - TURN[0]),
    diff = Math.atan2(Math.sin(want - was), Math.cos(want - was)),
    h = was + Math.max(-tr * dt, Math.min(tr * dt, diff));
  z.hd = Math.round(h * 100);
  if (d <= far * 2) return aim; // (arriving)
  return [z.x + Math.cos(h) * far * 2, z.y + Math.sin(h) * far * 2];
}
/* each its own lane along the flow field, a little to one side of it (LANE duck lengths at most, by its number), so a
   crowd fans out instead of walking in one line */
const LANE = 0.45;
function lane(z, at) {
  if (!at) return at;
  const dx = at[0] - z.x,
    dy = at[1] - z.y,
    d = Math.hypot(dx, dy),
    g = gr();
  if (d < 1) return at;
  const k = (((z.i * 0.381966) % 1) * 2 - 1) * LANE * g.rx,
    x = at[0] - (dy / d) * k,
    y = at[1] + (dx / d) * k;
  return g.ok(x, y, g.h(z.x, z.y)) ? [x, y] : at;
}
/* slower in a crowd: each one it touches takes CROWD_SLOW.each off its speed, down to CROWD_SLOW.least */
const CROWD_SLOW = { each: 0.08, least: 0.6 };
export function stepZombie(z, aim, far, pls) {
  const g = gr(),
    n = Math.max(1, Math.ceil(far / 8)),
    side = z.i % 2 ? -1 : 1; // (when it has to turn, its own side first: one way, then the other, and it swung about)
  for (let k = 0; k < n; k++) {
    const dx = aim[0] - z.x,
      dy = aim[1] - z.y,
      d = Math.hypot(dx, dy);
    if (d < 1) return;
    const len = Math.min(d, far / n),
      ux = dx / d,
      uy = dy / d,
      zz = g.h(z.x, z.y),
      stuckIn = !g.ok(z.x, z.y, zz);
    const ok = (x, y) => {
      if (stuckIn ? !g.free(x, y) : !g.ok(x, y, zz, z.up ?? STEP)) return false; // (z.up: how high a Sandbox NPC steps, its Can jump and Can climb walls, sbspawn.js)
      if (ZW && ZW.stops(z, x, y, zz)) return false; // (a zone that's a wall to it)
      for (const q of pls) {
        if (!overlapH(zz, DUCK, q.zz || 0, q.h)) continue; // (a duck up on a roof over it: it walks under it; heights.js overlapH)
        const now = room(z.x, z.y, ...q.xy),
          then = room(x, y, ...q.xy);
        if (then < 1 && then < now) return false;
      }
      return true;
    };
    if (ZW) {
      const sx = z.x + ux * len,
        sy = z.y + uy * len;
      if (z.ws || ZW.stops(z, sx, sy, zz)) {
        const [x, y] = ZW.go(z, sx, sy, zz, ok);
        if ((x !== z.x || y !== z.y) && ok(x, y)) {
          z.x = x;
          z.y = y;
          continue;
        } // (round a Sandbox wall, one way till it's past: else the turns below)
      }
    }
    let moved = false;
    for (const t of TURNS) {
      const c = Math.cos(t * side),
        s = Math.sin(t * side),
        sx = (ux * c - uy * s) * len,
        sy = (ux * s + uy * c) * len;
      if (ok(z.x + sx, z.y + sy)) {
        z.x += sx;
        z.y += sy;
        moved = true;
        break;
      }
      if (t) continue;
      // (straight on is blocked: first a slide along the wall, the old way, keeping what part of the step is free)
      if (Math.abs(sx) > 0.5 && ok(z.x + sx, z.y)) {
        z.x += sx;
        moved = true;
        break;
      }
      if (Math.abs(sy) > 0.5 && ok(z.x, z.y + sy)) {
        z.y += sy;
        moved = true;
        break;
      }
    }
    if (!moved) return;
  }
}
/* can a zombie walk straight from (x0, y0) up to a duck at (x1, y1)? (nothing it can't step on in between, every 8 px;
   the last 30 px don't count: a duck up on a car or by a pew is still clawed from the foot of it) */
export function walkable(x0, y0, x1, y1) {
  const g = gr(),
    z = g.h(x0, y0),
    d = Math.hypot(x1 - x0, y1 - y0);
  for (let t = 8; t < d - 30; t += 8)
    if (!g.ok(x0 + ((x1 - x0) * t) / d, y0 + ((y1 - y0) * t) / d, z))
      return false;
  return true;
}
/* zombies ease out of each other: two that overlap are pushed a little apart (crowd.js apart), where it's open. Only two on the
   same floor (SAME_FLOOR): one up on a roof and one under it, or one on the canopy and one on the ground by the pumps,
   pushed each other every heartbeat and walked back, so they shook in place ("zombies shouldnt viibrate on roof of gas
   pump", the owner's, Nov 20 03:58Z) */
function separate(zs, zf = dp() ? zombieZ : null, k = "zombie") {
  const g = gr(),
    live = zs.filter((z) => z.st !== 3 && z.st !== 9), // (a Flyer on a duck rides it: it takes no room)
    touch = apart(live, k, {
      rx: g.rx,
      ry: g.ry,
      fl: new Map(zf ? live.map((z) => [z, zf(z)]) : []),
      still,
      move: nudge,
    });
  if (k === "zombie")
    for (const z of live)
      if (touch.has(z)) z.tc = touch.get(z);
      else delete z.tc; // (how many it touches: the crowd's slowdown, walkAll)
}
/* one that never moves to make room: Speed 0 (the owner's, Nov 20 17:25Z: "Spawns or respawns dont move off their
   position anymore to make room, since their movement being zero means zero"), and an immobile one (push.js); the other
   takes all of the push. Speed 0 still takes a hit's knock-back (Nov 21 14:52Z: "zero speed = can't move itself") */
const still = (z) =>
  immobile(z) ||
  z.sv === 0 ||
  (!!z.sp && !!z.l && z.l[1] === 0) ||
  (!!z.l && z.l[8] === Z_BREED.giant); // (the Giant never gives way: it shoves them aside, the owner's "they push all zombies out of the way") // (a Sandbox spawn's Speed 0: a map's zombie, zombieAt; a Sandbox walker, brainWalk)
function nudge(z, dx, dy) {
  const x = z.x + dx,
    y = z.y + dy;
  if (z.st === 6 || z.st === 8) return; // (up a wall, or jumping: it keeps to it)
  const e = z.st === 7 && edgeOf(x, y, deckOf(z));
  if (
    z.st === 7
      ? e.o < -6 && !!deckAt(x, y, e.d.h)
      : z.st === 2 || z.st === undefined
        ? gr().ok(x, y, gr().h(z.x, z.y)) &&
          !(ZW && ZW.stops(z, x, y, gr().h(z.x, z.y))) // (a Sandbox walker, brainWalk: as one walking in; never pushed into a zone that's a wall to it)
        : !gr().free(x, y) || z.st === 4
  ) {
    z.x = x;
    z.y = y;
  }
}
/* ---------- for the computers (bots.js) ---------- */
/* the way from (x, y) toward (tx, ty) by walking (the next point along the flow field), or null; one field per target
   cell (flowFrom keeps them) */
export function wayTo(x, y, tx, ty, now) {
  const c = openNear(tx, ty);
  if (c < 0) return null;
  return heading(flowFrom([c]), x, y); // (flowFrom keeps the fields it made)
}
/* ---------- for Sandbox's zombies on Duck Cabin (sbcabin.js): the same way to the ducks, the same steps ----------
   One way for every map (the owner's, through Adam, Nov 19: no walking routes drawn by hand): the flow field over the
   map's own solids, and stepZombie's turns round what's in the way */
/* the walking distance to the nearest of goals ([x, y] in world px), worked out as the chase's is */
export const chaseField = (goals) =>
  flowFrom(
    goals.map(([x, y]) => openNear(x, y)),
    true,
  );
/* one zombie z ({ x, y } in world px) walks far px toward goal [x, y]: straight at it once nothing is in between,
   else down the field. ducks: [{ xy, zz }], the ones it never walks into */
export function chaseStep(z, dist, goal, far, ducks = []) {
  const aim =
    (Math.hypot(goal[0] - z.x, goal[1] - z.y) < 240 &&
      walkable(z.x, z.y, ...goal) &&
      goal) ||
    (dist && heading(dist, z.x, z.y)) ||
    goal;
  stepZombie(z, aim, far * wetK(z.x, z.y, z.z), ducks); // (water: layout.js)
}
/* a zombie's walk in world px a second at round 1, before its spawn's speed box */
export const zWalk = () => (WALK * (Z_SPEED[0] + Z_SPEED[1])) / 2;
/* can a shot from (x0, y0) reach (x1, y1)? (no wall or furniture in between, at height z) */
export function clearShot(x0, y0, x1, y1, z = 0) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16));
  for (let k = 1; k < n; k++)
    if (walled(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, z))
      return false;
  return true;
}
/* ---------- the kinds of zombie (breeds: the Type Object pattern, Nystrom) ----------
   What differs between one kind of zombie and another is these numbers, never code: the walk asks the breed. Dead
   Ducks Arcade's own zombies take theirs from the round (l4ddrules.js roundOf); a breed here is every other kind.
   speed: duck lengths a second; hp; reach: duck lengths, how far its claw reaches from the duck's middle (it stops
   touching it, at 1); swipe: [ms at the duck before its first swipe, ms between swipes]; deadMs: how long its body lies
   there */
export const ZOMBIE_BREEDS = {
  /* Sandbox's zombies, on the board and on Duck Cabin (sbspawn.js boardTick, sbcabin.js cabinTick, both by brainWalk):
     they stop at 1, touching, as on the map, so they reach 1.2 (they stopped at 0.8 of a reach of 1).
     The board's damage, the median of 5 seeds: 4,771 before, 5,585 after (1.1: 5,589) */
  sbBoard: { speed: 3.2, hp: 3, reach: 1.2, swipe: [0, 1200], deadMs: 4000 },
};
/* a board zombie's look (l): its breed's HP, no speed nor opening of its own, then lookOf's */
export const zLook = (B) => [B.hp, 0, "", ...lookOf()];
/* ---------- the board's zombies: the map's walk, on the board ----------
   The board's spots are fractions of it (x across, y down), and a duck's length there is duck = [across, down] of them.
   The walk's px on the board are DL to a duck's length both ways, so its steps, its crowd and its turns are the map's,
   unchanged. This is the one place the board's units turn into the walk's and back (brainWalk below). */
const DL = 56; // the walk's px in a duck's length on the board (the map's own, RX)
/* the board as a ground (gr()) for a duck of duck = [across, down] of it: [kx, ky] the walk's px in one of its shares,
   and the ground, open and flat to a little short of its edges */
function boardGround(duck) {
  const [kx, ky] = [DL / duck[0], DL / duck[1]],
    inside = (x, y) =>
      x >= 0.01 * kx && x <= 0.99 * kx && y >= 0.03 * ky && y <= 0.97 * ky;
  return [kx, ky, { rx: DL, ry: DL, h: () => 0, ok: inside, free: inside }];
}
/* ---------- Sandbox's walkers: each one's brain says where, the zombies' walk takes it there ----------
   What their brains planned (sbbrain.js think: [{ me, o, d }]), walked with the zombies' own step (chaseStep: straight
   at it, down the field, round what's in the way, never into a duck) and kept apart with their own crowd (separate), on
   the ground they're on: a world's (sbcabin.js cabinTick) or the board's (sbspawn.js boardTick: its shares turn into
   the walk's px here, boardGround). Each kind's brain stays its own; the body is this one (the cornerstone: one
   walk). c, each map's own: far(a, b) duck lengths apart; duck: the board's duck ([across, down], none on a world);
   ducks: [{ x, y, z }] the ducks it never walks into; field(to): the way to it (null: straight); speed(o, to, bd) duck
   lengths a second; reach (its claw's), stopK (how near a claw it stops), ptStop (how near a \move\'s spot);
   walls(o), wallGo(o, ws, x0, y0), wallStops(o, ws, x0, y0): Sandbox's zones that are walls to it (its own units);
   face (the least move that turns it); strike(me, foe, o, dmg, w); swipe (ms between swipes). Optional: sees(o, t),
   onFloor(o, to), z(o) (its height, for its floor in the crowd); arms: sbarms.js' fight, keepAt and reachTo (passed in:
   sbarms.js reads l4ddrules.js as it loads, which loads this file), after(o, to, d, x0, y0) (its floors), still(o) (one
   that didn't walk), round(o). Returns whether any moved or swung */
export function brainWalk(s, now, plans, live, dt, c) {
  const { fight, keepAt, reachTo } = c.arms,
    [kx, ky, ground] = c.duck ? boardGround(c.duck) : [1, 1, null],
    px = (o) => {
      o.x *= kx;
      o.y *= ky;
    },
    back = (o) => {
      o.x /= kx;
      o.y /= ky;
    },
    pls = c.ducks.map((q) => ({ xy: [q.x * kx, q.y * ky], zz: q.z || 0 }));
  let ch = !!plans.ch;
  const moved = new Set();
  if (ground) BOARD = ground;
  try {
    const g = gr();
    for (const { me, o, d } of plans) {
      const to = d.goal || d.flee;
      if (!to) continue;
      moved.add(o);
      const x0 = o.x,
        y0 = o.y,
        bd = c.far(me, to),
        claw = reachTo(c.reach, o, to, s), // (its hitbox, and its foe's: sbarms.js)
        step = c.speed(o, to, bd) * g.rx * dt,
        stop = d.foe ? keepAt(o, claw) : to.pt ? c.ptStop : claw * c.stopK; // (a gun keeps its distance: sbarms.js; a \move\'s spot: right on it)
      if (
        d.flee ||
        bd > stop ||
        (c.sees && d.foe && o.wp && bd > claw && !c.sees(o, to)) // (a gun keeps its distance once nothing's in the way)
      ) {
        px(o);
        const [tx, ty] = [to.x * kx, to.y * ky];
        if (d.flee) {
          const n = Math.hypot(o.x - tx, o.y - ty) || 1;
          chaseStep(
            o,
            null,
            [o.x + ((o.x - tx) / n) * 200, o.y + ((o.y - ty) / n) * 200],
            step,
            pls,
          );
        } else chaseStep(o, to.pt ? null : c.field(to), [tx, ty], step, pls); // (a \move\'s spot: straight at it, round what's in the way)
        back(o);
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
    /* never in each other: the zombies' own crowd */
    const was = live.map((o) => [o.x, o.y]);
    live.forEach(px);
    separate(live, c.z || null, "npc"); // (Sandbox's NPCs: crowd.js CROWD_BREEDS.npc)
    live.forEach(back);
    live.forEach((o, i) => {
      if (o.x !== was[i][0] || o.y !== was[i][1]) ch = true;
      const ws = c.walls(o);
      if (ws.length && c.wallStops(o, ws, ...was[i])) [o.x, o.y] = was[i]; // (never pushed through a wall)
    });
  } finally {
    if (ground) BOARD = null;
  }
  if (c.round) for (const o of live) c.round(o);
  return ch;
}
