/* ---------- the rules of Left 4 Dead Ducks ----------
   A zombie mode on Duck Cabin (the owner's, Nov 3). The power is cut and the outside can't be reached: only the cabin
   and the deck (the owner's balcony) are played on. Slow green ducks with X eyes come in at the front door, up the
   deck's stairs (boarded at the top) and through holes in the walls, round after round without end, each after the
   nearest duck by walking distance. Everyone has 3 HP, the knife, the pistol, the bow and 2 grenades; a duck at 0 HP is
   down until a teammate holds E by it for 10 seconds, or it bleeds out and walks as a ghost until the next round. The
   game ends when nobody is left standing. The host runs it all (this file); every screen draws it (l4dd.js).

   It is Duck Cabin's world (rules.js' isHang is true for it too), with only the activities it keeps (keepOnly below),
   and its own rule 'l4'. s.hang, each key online as its own string (so the zombies walking never send the boards again):
     l4   { r: round, t0: when its zombies start coming (the round's "Round N" shows BREAK before), n: zombies in it,
            made: how many came so far, owe: held back while the board is full, acc, sec: the spawning's clock, next:
            the next zombie's number, over: { at, r } once nobody is standing }
     zp   [i, x, y, k, i, x, y, k, …]: every zombie's spot in world px (whole numbers) and k = hp · 8 + st (st 0 coming,
          1 tearing the boards, 4 climbing in, 2 in, 3 dead), sent every heartbeat
     zs   { i: [a, dir] }: a zombie's last swipe (ms since t0) and its way (1/100 radians), only for one that swiped
     (the host keeps the rest to itself, in s.hidden, which never goes online: l4z { i: [n, d] }, n since when it's at a
     duck (0: not), d its tear clock (st 1) or when it died (st 3); l4tk its last heartbeat)
     zl   { i: [max hp, speed (px a second), opening, size, build, hat, outfit] }: set once, when it comes
     brd  { opening: boards up, 0 … BOARDS }
     l4p  { id: { hp, at (its last hit or heal), dn (down: bleeds out then), rv: { by, at } (being revived), gh (a ghost
          this round) } }
     l4a  { id: { m (pistol shots in the magazine), r (the rest), rl (its reload ends), b (arrows), g (grenades), u: {
          weapon: when last used } } }
     l4b  { id: { o, at } }: who is boarding up which opening, since when (one more board each BOARD_MS)
     l4f  { id: 1 }: flashlights switched off (key 0; nothing else happens, it's only a choice)
     l4c  [[x, y], …]: the extra candles on the floor, picked as the game starts (world px)
     l4k  [{ by, dx, dy, t, hit }]: knives mid-swing (each hurts a zombie once, only for ARMS.knife.swing ms) */
import { rule, keepOnly } from "./hangout/registry.js";
import {
  W,
  H,
  CABIN,
  DECK,
  STAIRS,
  STEP,
  inCabin,
  inDeck,
  heightAt,
  standable,
  solidsAt,
  onPlatform,
} from "./hangout/layout.js";
import { GRENADE_MS } from "./rules.js";

export const isL4dd = (s) => !!s && s.options.mode === "l4dd";
/* I want only these of Hangout's activities on: the lights' stutter. Nothing to sit on, play, write in or switch */
keepOnly("l4dd", [], ["flicker"]);

/* ---------- the numbers ---------- */
export const L4 = {
  HP: 3,
  REGEN: 15000, // ms: 1 HP back, 15 s after the last hit or heal
  REVIVE: 10000, // ms of holding E by a downed duck
  BACK_HP: 2, // a revived duck comes up with 2 HP
  BLEED: 30000, // ms a downed duck waits for a revive, then it's a ghost for the rest of the round
  SPRINT: 7000, // ms of sprint, and as long to fill up again
  BREAK: 7000, // ms between rounds ("Round N" shows meanwhile)
  FIRST: 4000, // ms before the first round's zombies come
  BOARDS: 5,
  BOARD_MS: 900, // ms of holding E for each board
  TEAR_MS: 1500, // ms a zombie takes to tear one board down
  REACH: 110, // world px: how near E works (a downed duck, an opening)
  DEAD_MS: 1000, // ms a dead zombie lies there, fading
};
export const WALK = 380 * 0.5; // world px a second: ducks at 50% of Duck Cabin's walk (world.js SPEED)
/* the owner's rounds: up to which round, zombies in it and how many more for each player past the first [fewest, most],
   their speed as a share of the ducks' [slowest, fastest], how long one is at a duck before it swipes and how often
   after (ms), and the most on the board at once */
const ROUNDS = [
  [5, 14, [3, 5], [0.5, 0.67], 500, 1000, Infinity],
  [10, 20, [3, 5], [0.5, 0.75], 300, 750, 35],
  [15, 20, [3, 5], [0.75, 0.75], 300, 750, 35],
  [25, 50, [5, 10], [0.95, 0.95], 250, 500, 45],
  [Infinity, 50, [5, 10], [0.95, 0.95], 250, 500, 50],
];
export const roundOf = (r) => ROUNDS.find((x) => r <= x[0]);
/* spawning (the owner's): a zombie a second, 50% more for each player past the first, never more than 5 a second (3
   more for each player past the first); each second a 25% chance that none comes */
const SKIP = 0.25;
/* the weapons here (Stage 1): the knife swings twice as fast as anywhere else and hurts only mid-swing, in a small
   bubble just past its blade; the pistol: 72 bullets in all, 8 a magazine; the bow: 150 arrows, one every 0.4 s;
   headshots (crits) kill at once; grenades kill every zombie in their blast. Nothing hurts another duck */
export const ARMS = {
  knife: { cool: 500, dmg: 1, swing: 125, at: 58, r: 34 },
  handgun: {
    cool: 200,
    dmg: 1,
    crit: 0.05,
    speed: 1000,
    mag: 8,
    all: 72,
    reload: 1200,
  },
  bow: { cool: 400, dmg: 1, crit: 0.05, speed: 820, all: 150 },
  grenade: { cool: 900, far: 300, r: 140, start: 2, most: 3 },
};
export const HELD = ["knife", "handgun", "bow"]; // what a duck holds out (keys 1 to 3); grenades are thrown with G
const SHOT_LIFE = 2000;
/* a zombie's room on the floor, as the ducks' (world.js crowd): an ellipse 56 across and 25.6 deep; every zombie the
   same, whatever its size. Its claw reaches a little past touching */
const RX = 56,
  RY = 25.6,
  CLAW = 1.35;
const hp0 = () => {
  const r = Math.random();
  return r < 0.05 ? 4 : r < 0.25 ? 3 : 2;
}; // (the owner's: 2 HP, 20% 3, 5% 4)
const ZHATS = [
  "cap",
  "cowboy",
  "bucket",
  "sombrero",
  "afro",
  "police",
  "fire",
  "doctor",
  "nightcap",
  "helmet",
  "pumpkin",
  "birthday",
  "wizard",
  "jester",
];
const ZOUTFITS = [
  "shirt",
  "hoodie",
  "jeans",
  "pajamas",
  "hawaiian",
  "suit",
  "leather",
  "muscle",
  "doctor",
  "police",
  "firefighter",
  "military",
];
export const zombieLook = (l) => ({
  color: "#3f7a34",
  pattern: "none",
  metal: "none",
  style: "rubber",
  beak: "default",
  beakColor: "#b06a1e",
  beakColor2: "#6e3a0c",
  size: l[3] || 0,
  build: l[4] || 0,
  ...(l[5] >= 0 ? { hat: { id: ZHATS[l[5]] } } : {}),
  ...(l[6] >= 0 ? { outfit: { id: ZOUTFITS[l[6]] } } : {}),
});

/* ---------- the map: only inside and the deck ----------
   The deck's stairs are boarded at the top (their landing is part of the deck). The openings: where zombies come in,
   and where boards go up. Each has its line in the wall (x, y; axis 'x' for an east-west wall, half: half its width),
   the spot just outside where a zombie tears the boards down (out), the spot just inside where it's in (in), and for
   the stairs the foot of the stairs where they appear (from) */
const LAND = { x0: STAIRS.x0, x1: STAIRS.x1, y0: STAIRS.y0, y1: STAIRS.land };
export const playable = (x, y) =>
  inCabin(x, y) ||
  inDeck(x, y) ||
  (x >= LAND.x0 && x < LAND.x1 && y >= LAND.y0 && y < LAND.y1);
export const OPENINGS = [
  {
    id: "front",
    kind: "door",
    x: 2000,
    y: CABIN.y0,
    axis: "x",
    half: 40,
    out: [2000, 546],
    in: [2000, 668],
  },
  {
    id: "stairs",
    kind: "stairs",
    x: 4400,
    y: LAND.y1,
    axis: "x",
    half: 92,
    out: [4400, 2410],
    in: [4400, 2296],
    from: [4400, 2860],
  },
  {
    id: "w1",
    kind: "hole",
    x: CABIN.x0,
    y: 1040,
    axis: "y",
    half: 46,
    out: [1244, 1040],
    in: [1362, 1040],
  },
  {
    id: "w2",
    kind: "hole",
    x: CABIN.x0,
    y: 1830,
    axis: "y",
    half: 46,
    out: [1244, 1830],
    in: [1362, 1830],
  },
  {
    id: "s1",
    kind: "hole",
    x: 1790,
    y: CABIN.y1,
    axis: "x",
    half: 46,
    out: [1790, 2262],
    in: [1790, 2138],
  },
  {
    id: "e1",
    kind: "hole",
    x: CABIN.x1,
    y: 930,
    axis: "y",
    half: 46,
    out: [4356, 930],
    in: [4238, 930],
  },
  {
    id: "e2",
    kind: "hole",
    x: CABIN.x1,
    y: 1530,
    axis: "y",
    half: 46,
    out: [4356, 1530],
    in: [4238, 1530],
  },
  {
    id: "e3",
    kind: "hole",
    x: CABIN.x1,
    y: 2110,
    axis: "y",
    half: 46,
    out: [4356, 2110],
    in: [4238, 2110],
  },
];
export const openingById = (id) => OPENINGS.find((o) => o.id === id) || null;
/* where everyone starts, and comes back at the next round: free spots in the great room, nearest the middle first */
let spots = null;
export function startSpot(k = 0) {
  if (!spots) {
    spots = [];
    for (let y = 1300; y <= 1560; y += 65)
      for (let x = 2560; x <= 3080; x += 65)
        if (standable(x, y, heightAt(x, y), 0) && !onPlatform(x, y))
          spots.push({ x, y });
    spots.sort(
      (a, b) =>
        Math.hypot(a.x - 2800, a.y - 1420) - Math.hypot(b.x - 2800, b.y - 1420),
    );
  }
  return spots[k % spots.length];
}

/* ---------- the zombies' way to the ducks: a flow field ----------
   A grid of 40-px cells over the cabin and the deck (built once). Every heartbeat, the walking distance from every cell
   to the nearest duck standing, all at once (Dijkstra from all of them); each zombie walks downhill on it, so it takes
   the way of least walking, never the duck nearest through a wall. */
const CELL = 40,
  GX = 1280,
  GY = 580,
  GW = 82,
  GH = 52;
let walk = null,
  hts = null;
const cellAt = (x, y) => {
  const i = Math.floor((x - GX) / CELL),
    j = Math.floor((y - GY) / CELL);
  return i < 0 || j < 0 || i >= GW || j >= GH ? -1 : j * GW + i;
};
const mid = (c) => [
  GX + (c % GW) * CELL + CELL / 2,
  GY + Math.floor(c / GW) * CELL + CELL / 2,
];
function cells() {
  if (walk) return walk;
  walk = new Uint8Array(GW * GH);
  hts = new Float32Array(GW * GH);
  for (let c = 0; c < GW * GH; c++) {
    const [x, y] = mid(c),
      z = heightAt(x, y);
    hts[c] = z;
    walk[c] =
      playable(x, y) && standable(x, y, z, 0) && !onPlatform(x, y) ? 1 : 0;
  }
  return walk;
}
/* can a zombie step from cell a to its neighbor b? (no climbing the stage's edge; no cutting a corner) */
const N8 = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];
function nextTo(c, k) {
  const [di, dj] = N8[k],
    i = (c % GW) + di,
    j = Math.floor(c / GW) + dj;
  if (i < 0 || j < 0 || i >= GW || j >= GH) return -1;
  const b = j * GW + i;
  if (!walk[b] || Math.abs(hts[b] - hts[c]) > 2 * STEP + 2) return -1;
  if (di && dj && (!walk[c + di] || !walk[c + dj * GW])) return -1;
  return b;
}
/* the nearest open cell to (x, y), within 3 cells (a duck by a wall stands where a cell's middle isn't open) */
function openNear(x, y) {
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
function flowFrom(starts) {
  cells();
  const dist = new Float64Array(GW * GH).fill(Infinity), // (64-bit: a 32-bit copy can be a hair under the heap's number, and its cell was never looked past)
    heap = [];
  const push = (d, c) => {
    heap.push([d, c]);
    let k = heap.length - 1;
    while (k) {
      const p = (k - 1) >> 1;
      if (heap[p][0] <= heap[k][0]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0],
      last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1,
          r = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top;
  };
  for (const c of starts)
    if (c >= 0) {
      dist[c] = 0;
      push(0, c);
    }
  while (heap.length) {
    const [d, c] = pop();
    if (d > dist[c]) continue;
    for (let k = 0; k < 8; k++) {
      const b = nextTo(c, k);
      if (b < 0) continue;
      const nd = d + N8[k][2];
      if (nd < dist[b]) {
        dist[b] = nd;
        push(nd, b);
      }
    }
  }
  return dist;
}
/* where a zombie inside heads next: a point two cells on along the field (the way smooths out), or null */
function heading(dist, x, y) {
  const c = openNear(x, y);
  if (c < 0 || dist[c] === Infinity) return null;
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

/* ---------- small helpers ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const players = (s) => s.seat.filter((id) => s.players[id] && s.pos[id]);
const P4 = (s, id) => ((s.hang && s.hang.l4p) || {})[id] || null;
export const isDown = (s, id) => !!(P4(s, id) && P4(s, id).dn);
export const isGhost4 = (s, id) => !!(P4(s, id) && P4(s, id).gh);
const standing = (s, id) => {
  const p = P4(s, id);
  return !!p && !p.dn && !p.gh;
};
/* a duck in the middle of a jump dodges a hit: not in its first fifth or its last (the owner's) */
export function dodging(s, p, now) {
  if (!p || !p.j) return false;
  const T = (s.options.lowGravity ? 1200 : 620) * (p.lj ? 1.4 : 1),
    u = (now - (p.dj || p.j)) / T;
  return u > 0.2 && u < 0.8;
}
const at = (p) => [p.x * W, p.y * H];
/* the ellipse distance between two spots on the floor: 1 is two ducks touching */
const room = (ax, ay, bx, by) => Math.hypot((ax - bx) / RX, (ay - by) / RY);
/* where zombies can stand inside (the walls, the furniture, the beds stop them; the outside too) */
const zOk = (x, y, z) =>
  playable(x, y) && standable(x, y, z, STEP) && !onPlatform(x, y);
/* the zombies as objects, from the state's three parts, and back */
function zombies(s) {
  const zp = s.hang.zp || [],
    zs = s.hang.zs || {},
    zl = s.hang.zl || {},
    mine = (s.hidden && s.hidden.l4z) || {},
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
      hp: Math.floor(zp[k + 3] / 8),
      st: zp[k + 3] % 8,
      a: sw[0],
      dir: sw[1],
      n: h[0],
      d: h[1],
      l,
    });
  }
  return out;
}
function store(s, zs, keepStatic) {
  const zp = [],
    sw = {},
    mine = {},
    zl = {};
  for (const z of zs) {
    zp.push(z.i, Math.round(z.x), Math.round(z.y), z.hp * 8 + z.st);
    if (z.a > -1e5) sw[z.i] = [Math.round(z.a), z.dir];
    mine[z.i] = [Math.round(z.n), Math.round(z.d)];
    zl[z.i] = z.l;
  }
  const sig = (o) => JSON.stringify(o);
  if (sig(zp) !== sig(s.hang.zp)) s.hang.zp = zp;
  if (sig(sw) !== sig(s.hang.zs)) s.hang.zs = sw;
  if (!keepStatic && sig(zl) !== sig(s.hang.zl)) s.hang.zl = zl;
  s.hidden = { ...(s.hidden || {}), l4z: mine };
}
export const zombiesOf = zombies;

/* ---------- a game, a round ---------- */
function freshAmmo() {
  return {
    m: ARMS.handgun.mag,
    r: ARMS.handgun.all - ARMS.handgun.mag,
    rl: 0,
    b: ARMS.bow.all,
    g: ARMS.grenade.start,
    u: {},
  };
}
function countFor(s, r) {
  const R = roundOf(r),
    extra = Math.max(0, players(s).length - 1);
  let n = R[1];
  for (let k = 0; k < extra; k++) n += rint(R[2][0], R[2][1]);
  return n;
}
function newRound(s, r, now, wait) {
  s.hang.l4 = {
    ...s.hang.l4,
    r,
    t0: now + wait,
    n: countFor(s, r),
    made: 0,
    owe: 0,
    acc: 0,
    sec: -1,
  };
}
/* everyone up again, full: a new game, or a ghost back at the next round (where it stands now, or at a start spot) */
function bringBack(s, id, now, k, fresh) {
  const p4 = { ...(s.hang.l4p || {}) },
    was = p4[id] || {};
  p4[id] = { hp: L4.HP, at: now };
  s.hang.l4p = p4;
  if (fresh) s.hang.l4a = { ...(s.hang.l4a || {}), [id]: freshAmmo() };
  if (s.players[id]) delete s.players[id].dead;
  const still = { ...(s.hang.still || {}) };
  delete still[id];
  s.hang.still = still;
  if (s.hang.ghost && s.hang.ghost[id]) {
    const g = { ...s.hang.ghost };
    delete g[id];
    s.hang.ghost = g;
  }
  if (fresh || was.gh) {
    const q = startSpot(k);
    s.pos[id] = {
      x: +(q.x / W).toFixed(5),
      y: +(q.y / H).toFixed(5),
      j: 0,
      z: 0,
      b: 0,
      tp: now,
    };
  }
}
/* a few extra candles on bare spots of the floor (the owner's): 6 inside, 1 on the deck, far from each other, from the
   openings and from where everyone starts */
function candleSpots() {
  const out = [],
    bare = (x, y) =>
      Math.abs(heightAt(x, y)) < 1 &&
      !onPlatform(x, y) &&
      [
        [0, 0],
        [-50, 0],
        [50, 0],
        [0, -40],
        [0, 40],
      ].every(([dx, dy]) => !solidsAt(x + dx, y + dy, 0).length) &&
      OPENINGS.every((o) => Math.hypot(x - o.in[0], y - o.in[1]) > 200) &&
      Math.hypot(x - 2800, y - 1420) > 320 &&
      out.every(([a, b]) => Math.hypot(x - a, y - b) > 420);
  const pick = (n, x0, y0, x1, y1) => {
    for (let k = 0, got = 0; k < 400 && got < n; k++) {
      const x = Math.round(rnd(x0, x1)),
        y = Math.round(rnd(y0, y1));
      if (playable(x, y) && bare(x, y)) {
        out.push([x, y]);
        got++;
      }
    }
  };
  pick(6, CABIN.x0 + 90, CABIN.y0 + 90, CABIN.x1 - 90, CABIN.y1 - 70);
  pick(1, DECK.x0 + 120, DECK.y0 + 70, DECK.x1 - 120, DECK.y1 - 70);
  return out;
}
function setUp(s, now) {
  s.hang.l4 = { r: 1, next: 1, over: null };
  s.hang.zp = [];
  s.hang.zs = {};
  s.hang.zl = {};
  s.hang.brd = Object.fromEntries(OPENINGS.map((o) => [o.id, L4.BOARDS]));
  s.hang.l4p = {};
  s.hang.l4a = {};
  s.hang.l4b = {};
  s.hang.l4f = {};
  s.hang.power = 0; // (the power is cut: the lamps are dark; the fires and the candles burn)
  s.hang.l4c = candleSpots();
  s.hang.l4k = [];
  s.shots = [];
  players(s).forEach((id, k) => bringBack(s, id, now, k, true));
  newRound(s, 1, now, L4.FIRST);
}

rule("l4", {
  only: "l4dd",
  ghosts: true,
  init: () => ({ power: 0, ghost: {}, still: {} }),
  start(s, now) {
    setUp(s, now);
  },
  join(s, id) {
    const now = Date.now();
    bringBack(s, id, now, players(s).indexOf(id), true);
  },
  left(s, id) {
    for (const k of ["l4p", "l4a", "l4b", "l4f"])
      if (s.hang[k] && s.hang[k][id]) {
        const o = { ...s.hang[k] };
        delete o[id];
        s.hang[k] = o;
      }
    const p4 = s.hang.l4p || {};
    for (const [t, p] of Object.entries(p4))
      if (p.rv && p.rv.by === id)
        s.hang.l4p = { ...p4, [t]: { ...p, rv: null } };
  },
  act(s, a, now) {
    return l4Act(s, a, now);
  },
  tick(s, now) {
    return l4Tick(s, now);
  },
});

/* ---------- what a duck does: E (revive, board up), key 0 (the flashlight), Play again ---------- */
function l4Act(s, a, now) {
  const id = a.id,
    L = s.hang.l4,
    me = s.pos[id];
  if (!L || !me) return false;
  if (a.do === "again") {
    if (!L.over || s.hostId !== id) return false;
    setUp(s, now);
    return true;
  }
  if (a.do === "fl") {
    const f = { ...(s.hang.l4f || {}) };
    if (f[id]) delete f[id];
    else f[id] = 1;
    s.hang.l4f = f;
    return true;
  }
  if (L.over || !standing(s, id)) return false;
  const [mx, my] = at(me);
  if (a.do === "rev") {
    const t = String(a.on || ""),
      p4 = s.hang.l4p || {},
      tp = p4[t],
      pos = s.pos[t];
    if (!tp || !tp.dn || !pos || t === id) return false;
    if (!a.hold) {
      if (!tp.rv || tp.rv.by !== id) return false;
      s.hang.l4p = { ...p4, [t]: { ...tp, rv: null } };
      return true;
    }
    const [tx, ty] = at(pos);
    if (Math.hypot(tx - mx, ty - my) > L4.REACH * 1.6) return false;
    if (tp.rv && tp.rv.by !== id && s.pos[tp.rv.by]) return false; // (someone else is at it)
    s.hang.l4p = { ...p4, [t]: { ...tp, rv: { by: id, at: now } } };
    return true;
  }
  if (a.do === "board") {
    const o = openingById(a.o),
      b = { ...(s.hang.l4b || {}) };
    if (!a.hold) {
      if (!b[id]) return false;
      delete b[id];
      s.hang.l4b = b;
      return true;
    }
    if (!o || Math.hypot(o.in[0] - mx, o.in[1] - my) > L4.REACH * 1.6)
      return false;
    if ((s.hang.brd || {})[o.id] >= L4.BOARDS) return false;
    b[id] = { o: o.id, at: now };
    s.hang.l4b = b;
    return true;
  }
  return false;
}

/* ---------- the weapons (rules.js sends the 'use' and 'reload' actions here) ---------- */
const aimDir = (a) => {
  const ax = (+a.ax || 0) * W,
    ay = (+a.ay || 0) * H,
    l = Math.hypot(ax, ay);
  return l > 1e-6 ? [ax / l, ay / l] : [a.face < 0 ? -1 : 1, 0];
};
function finishReload(m, now) {
  if (!m.rl || now < m.rl) return false;
  const k = Math.min(ARMS.handgun.mag - m.m, m.r);
  m.m += k;
  m.r -= k;
  m.rl = 0;
  return true;
}
export function l4Reload(s, a, now) {
  const m0 = (s.hang.l4a || {})[a.id];
  if (!m0 || !standing(s, a.id)) return false;
  const m = { ...m0 };
  finishReload(m, now);
  if (m.rl || m.m >= ARMS.handgun.mag || m.r <= 0) return false;
  m.rl = now + ARMS.handgun.reload;
  s.hang.l4a = { ...s.hang.l4a, [a.id]: m };
  return true;
}
const addFx = (s, f) => {
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, ...f }];
  return s.fxN;
};
export function l4Use(s, a, now) {
  const id = a.id,
    what = String(a.what || ""),
    p = s.pos[id],
    L = s.hang && s.hang.l4,
    m0 = (s.hang.l4a || {})[id];
  if (!L || L.over || !p || !m0 || !standing(s, id) || !ARMS[what])
    return false;
  const m = { ...m0, u: { ...m0.u } };
  finishReload(m, now);
  if (now - (m.u[what] || 0) < ARMS[what].cool) return false;
  if (what === "handgun" && (m.rl || m.m <= 0)) return false;
  if (what === "bow" && m.b <= 0) return false;
  if (what === "grenade" && m.g <= 0) return false;
  m.u[what] = now;
  const [dx, dy] = aimDir(a),
    face = dx < 0 ? -1 : 1,
    [px, py] = at(p),
    hz = Math.round(+p.z || 0);
  const n = addFx(s, {
    kind: "use",
    what,
    by: id,
    who: [id],
    face,
    t: now,
    ax: +(dx / W).toFixed(5),
    ay: +(dy / H).toFixed(5),
  });
  if (what === "knife") {
    s.hang.l4k = [
      ...(s.hang.l4k || []).filter(
        (k) => now - k.t < ARMS.knife.swing && k.by !== id,
      ),
      { by: id, dx, dy, t: now, hit: [] },
    ];
    knifeHits(s, now);
  } else {
    if (what === "handgun") {
      m.m--;
      if (m.m <= 0 && m.r > 0) m.rl = now + ARMS.handgun.reload; // (empty: it reloads by itself)
    }
    if (what === "bow") m.b--;
    if (what === "grenade") m.g--;
    const v =
      what === "grenade"
        ? ARMS.grenade.far / (GRENADE_MS / 1000)
        : ARMS[what].speed;
    s.shots = [
      ...(s.shots || []),
      {
        n,
        by: id,
        k: what === "bow" ? "arrow" : what,
        x0: p.x,
        y0: p.y,
        vx: +((dx * v) / W).toFixed(5),
        vy: +((dy * v) / H).toFixed(5),
        t: now,
        lx: p.x,
        ly: p.y,
        hz,
        hin: inCabin(px, py) ? 1 : 0,
      },
    ];
  }
  s.hang.l4a = { ...s.hang.l4a, [id]: m };
  return true;
}
/* a zombie takes damage (a headshot: all of it); true when it died */
function hurt(z, dmg, crit) {
  if (z.st === 3) return false;
  z.hp = crit ? 0 : Math.max(0, z.hp - dmg);
  return z.hp <= 0;
}
function knifeHits(s, now) {
  const ks = (s.hang.l4k || []).filter((k) => now - k.t <= ARMS.knife.swing);
  if (!ks.length) {
    if (s.hang.l4k && s.hang.l4k.length) s.hang.l4k = [];
    return false;
  }
  const zs = zombies(s),
    T = now - s.hang.l4.t0;
  let any = false;
  for (const k of ks) {
    const p = s.pos[k.by];
    if (!p || !standing(s, k.by)) continue;
    const [px, py] = at(p),
      bx = px + k.dx * ARMS.knife.at,
      by = py + k.dy * ARMS.knife.at;
    for (const z of zs) {
      if (z.st === 3 || k.hit.includes(z.i)) continue;
      if (Math.hypot(z.x - bx, (z.y - by) * 1.4) > ARMS.knife.r + 22) continue;
      k.hit.push(z.i);
      if (hurt(z, ARMS.knife.dmg, false)) die(z, T);
      any = true;
    }
  }
  s.hang.l4k = ks;
  if (any) store(s, zs, true);
  return any;
}
const die = (z, T) => {
  z.st = 3;
  z.d = T;
};
/* the shots in the air (instead of rules.js' moveShots here): walls and furniture stop them, a zombie stops a bullet
   or an arrow (a headshot now and then kills it at once), a grenade goes off where it lands or where a wall stops it */
const OPEN_PAD = 30;
const inOpening = (x, y) =>
  OPENINGS.some((o) =>
    o.axis === "x"
      ? Math.abs(x - o.x) < o.half && Math.abs(y - o.y) < OPEN_PAD + 40
      : Math.abs(y - o.y) < o.half && Math.abs(x - o.x) < OPEN_PAD + 40,
  );
const walled = (x, y, z) =>
  (!playable(x, y) && !inOpening(x, y)) ||
  (!inOpening(x, y) && solidsAt(x, y, z + 20).some((b) => b.top > z + 20));
export function l4Shots(s, now) {
  const list = s.shots || [];
  if (!list.length || !s.hang || !s.hang.l4) return false;
  const L = s.hang.l4,
    T = now - L.t0,
    zs = zombies(s),
    keep = [];
  let hitAny = false;
  for (const sh0 of list) {
    const sh = { ...sh0 },
      age = now - sh.t;
    if (sh.k === "grenade") {
      const u = Math.min(age, GRENADE_MS) / 1000,
        x = (sh.x0 + sh.vx * u) * W,
        y = (sh.y0 + sh.vy * u) * H,
        wall = walled(x, y, sh.hz);
      if (wall || age >= GRENADE_MS) {
        const bx = wall ? sh.lx * W : x,
          by = wall ? sh.ly * H : y,
          hit = [];
        for (const z of zs)
          if (
            z.st !== 3 &&
            Math.hypot(z.x - bx, (z.y - by) * 1.25) < ARMS.grenade.r
          ) {
            hurt(z, Infinity, true);
            die(z, T);
            hit.push(z.i);
          }
        addFx(s, {
          kind: "boom",
          by: sh.by,
          who: [],
          t: now,
          x: +(bx / W).toFixed(4),
          y: +(by / H).toFixed(4),
          hit: [],
          hz: sh.hz || 0,
        });
        hitAny = hitAny || hit.length > 0;
        continue;
      }
      sh.lx = x / W;
      sh.ly = y / H;
      keep.push(sh);
      continue;
    }
    const x0 = sh.lx * W,
      y0 = sh.ly * H,
      u = age / 1000,
      x1 = (sh.x0 + sh.vx * u) * W,
      y1 = (sh.y0 + sh.vy * u) * H,
      len = Math.hypot(x1 - x0, y1 - y0),
      steps = Math.max(1, Math.ceil(len / 12));
    let gone = age > SHOT_LIFE,
      endX = x1,
      endY = y1;
    for (let k = 1; k <= steps && !gone; k++) {
      const x = x0 + ((x1 - x0) * k) / steps,
        y = y0 + ((y1 - y0) * k) / steps;
      if (walled(x, y, sh.hz)) {
        gone = true;
        endX = x;
        endY = y;
        break;
      }
      const z = zs.find(
        (z) => z.st !== 3 && Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1,
      );
      if (z) {
        const w = sh.k === "arrow" ? ARMS.bow : ARMS.handgun,
          crit = Math.random() < w.crit;
        if (hurt(z, w.dmg, crit)) die(z, T);
        z.hitBy = sh.by;
        if (crit)
          addFx(s, {
            kind: "l4crit",
            by: sh.by,
            who: [],
            t: now,
            x: Math.round(z.x),
            y: Math.round(z.y),
          });
        hitAny = true;
        gone = true;
      }
    }
    if (gone) continue;
    sh.lx = endX / W;
    sh.ly = endY / H;
    keep.push(sh);
  }
  s.shots = keep;
  if (hitAny) store(s, zs, true);
  return true;
}

/* ---------- the host's heartbeat ---------- */
function l4Tick(s, now) {
  const L = s.hang.l4;
  if (!L) return false;
  if (L.over) return false;
  knifeHits(s, now); // (first: the zombies below are read after it)
  const T = now - L.t0,
    zs = zombies(s);
  /* the ducks: HP coming back, revives, bleeding out, boards going up, reloads */
  const p4 = { ...(s.hang.l4p || {}) },
    ids = players(s);
  for (const id of ids) {
    let p = p4[id];
    if (!p) continue;
    if (p.dn) {
      const rv = p.rv,
        by = rv && s.pos[rv.by];
      if (
        rv &&
        (!by ||
          !standing(s, rv.by) ||
          Math.hypot(...minus(at(by), at(s.pos[id]))) > L4.REACH * 1.8)
      )
        p = { ...p, rv: null };
      else if (rv && now - rv.at >= L4.REVIVE) {
        p = { hp: L4.BACK_HP, at: now };
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
      } else if (!rv && now >= p.dn) {
        p = { hp: 0, at: now, gh: 1 }; // (bled out: a ghost until the next round)
        const q = s.pos[id];
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
        s.hang.ghost = {
          ...(s.hang.ghost || {}),
          [id]: { x: q.x, y: q.y, z: Math.round(+q.z || 0), t: now, l4: 1 },
        };
        const b = { ...(s.hang.l4b || {}) };
        delete b[id];
        s.hang.l4b = b;
      }
      p4[id] = p;
      continue;
    }
    if (p.gh) continue;
    if (p.hp < L4.HP && now - p.at >= L4.REGEN)
      p4[id] = { ...p, hp: p.hp + 1, at: now };
  }
  s.hang.l4p = p4;
  const am = s.hang.l4a || {};
  for (const id of Object.keys(am))
    if (am[id].rl && now >= am[id].rl) {
      const m = { ...am[id] };
      finishReload(m, now);
      s.hang.l4a = { ...s.hang.l4a, [id]: m };
    }
  const brd = { ...(s.hang.brd || {}) },
    bl = { ...(s.hang.l4b || {}) };
  for (const [id, b] of Object.entries(bl)) {
    const o = openingById(b.o),
      p = s.pos[id];
    if (
      !o ||
      !p ||
      !standing(s, id) ||
      Math.hypot(o.in[0] - p.x * W, o.in[1] - p.y * H) > L4.REACH * 1.8 ||
      brd[o.id] >= L4.BOARDS
    ) {
      delete bl[id];
      continue;
    }
    if (now - b.at >= L4.BOARD_MS) {
      brd[o.id] = Math.min(L4.BOARDS, (brd[o.id] || 0) + 1);
      bl[id] = { ...b, at: now };
    }
  }
  s.hang.brd = brd;
  s.hang.l4b = bl;
  /* nobody standing: the game is over */
  const up = ids.filter((id) => standing(s, id));
  if (!up.length && ids.length) {
    s.hang.l4 = { ...L, over: { at: now, r: L.r } };
    s.hang.l4b = {};
    return true;
  }
  /* more zombies come */
  const R = roundOf(L.r),
    live = zs.filter((z) => z.st !== 3).length,
    extra = Math.max(0, ids.length - 1),
    L2 = { ...s.hang.l4 };
  if (T >= 0 && L2.made + L2.owe < L2.n) {
    const sec = Math.floor(T / 1000);
    if (sec > L2.sec) {
      L2.sec = sec;
      if (Math.random() >= SKIP) {
        L2.acc += Math.pow(1.5, extra);
        const k = Math.min(
          Math.floor(L2.acc),
          5 + 3 * extra,
          L2.n - L2.made - L2.owe,
        );
        L2.acc -= Math.floor(L2.acc);
        L2.owe += Math.max(0, k);
      }
    }
  }
  if (L2.owe > 0) {
    const room = Math.max(0, R[6] - live),
      k = Math.min(L2.owe, room);
    for (let q = 0; q < k; q++) zs.push(newZombie(s, L2, T));
    L2.owe -= k;
    L2.made += k;
  }
  /* the zombies walk, tear boards down, climb in, swipe */
  moveZombies(s, zs, now, T, up);
  /* the dead go */
  const left = zs.filter((z) => !(z.st === 3 && T - z.d > L4.DEAD_MS));
  /* every zombie of the round came and died: the next round, and the ghosts come back */
  if (L2.made >= L2.n && !left.length && T >= 0) {
    s.hang.l4 = L2;
    store(s, [], false);
    newRound(s, L2.r + 1, now, L4.BREAK);
    ids.forEach((id, k) => {
      if (isGhost4(s, id)) bringBack(s, id, now, k, false);
    });
    return true;
  }
  s.hang.l4 = L2;
  store(s, left, false);
  return true; // (the zombies move every heartbeat)
}
const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];
/* a new zombie, at one of the openings (the ones nearer the ducks twice as likely) */
function newZombie(s, L, T) {
  const R = roundOf(L.r),
    ids = players(s).filter((id) => standing(s, id)),
    pts = ids.map((id) => at(s.pos[id])),
    near = (o) =>
      Math.min(
        ...pts.map(([x, y]) => Math.hypot(x - o.in[0], y - o.in[1])),
        1e9,
      ),
    order = [...OPENINGS].sort((a, b) => near(a) - near(b)),
    pool = [...order, ...order.slice(0, 4)],
    o = pool[Math.floor(Math.random() * pool.length)];
  const i = L.next++;
  const dress = Math.random() < 0.2 ? Math.random() : -1, // (20% wear something: a hat, an outfit or both)
    hat = dress >= 0 && dress < 0.6 ? rint(0, ZHATS.length - 1) : -1,
    outfit = dress >= 0.4 ? rint(0, ZOUTFITS.length - 1) : -1,
    odd = Math.random() < 0.25, // (25% are another size or build; every one has the same room on the floor)
    size = odd && Math.random() < 0.5 ? +rnd(-1, 1).toFixed(2) : 0,
    build = odd && !size ? +rnd(-1, 1).toFixed(2) : 0,
    max = hp0(),
    v = Math.round(WALK * rnd(R[3][0], R[3][1])),
    [sx, sy] = o.from || o.out;
  return {
    i,
    x: sx + rnd(-12, 12) * (o.axis === "x" ? 1 : 0.3),
    y: sy + rnd(-8, 8) * (o.axis === "y" ? 1 : 0.3),
    hp: max,
    st: 0,
    a: -1e6,
    n: 0,
    d: 0,
    dir: 0,
    l: [max, v, o.id, size, build, hat, outfit],
  };
}
function moveZombies(s, zs, now, T, up) {
  const R = roundOf(s.hang.l4.r),
    tk = (s.hidden && s.hidden.l4tk) || now - 200,
    dt = Math.min(0.35, Math.max(0.05, (now - tk) / 1000)),
    brd = { ...(s.hang.brd || {}) },
    pls = up.map((id) => ({ id, p: s.pos[id], xy: at(s.pos[id]) }));
  s.hidden = { ...(s.hidden || {}), l4tk: now };
  const dist = flowFrom(pls.map((q) => openNear(...q.xy)));
  const p4 = { ...s.hang.l4p };
  for (const z of zs) {
    if (z.st === 3) continue;
    const o = openingById(z.l[2]),
      v = z.l[1];
    if (z.st === 0) {
      // coming: to the spot outside its opening
      const [tx, ty] = o.out;
      if (walkTo(z, tx, ty, v * dt)) {
        z.st = brd[o.id] > 0 ? 1 : 4;
        z.d = T;
      }
      continue;
    }
    if (z.st === 1) {
      // tearing the boards down, one at a time
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
        if (Math.hypot(z.x - o.out[0], z.y - o.out[1]) < 30) {
          z.st = 1;
          z.d = T;
        }
      }
      if (walkTo(z, o.in[0], o.in[1], v * dt)) z.st = 2;
      continue;
    }
    /* in: along the flow field, or straight at a duck close by; never into a duck */
    let target = null,
      best = Infinity;
    for (const q of pls) {
      const d = room(z.x, z.y, ...q.xy);
      if (d < best) {
        best = d;
        target = q;
      }
    }
    if (!target) continue;
    const c = openNear(z.x, z.y),
      close = best < 2.6 || (c >= 0 && dist[c] <= 1.5);
    const aim = close ? target.xy : heading(dist, z.x, z.y);
    if (aim) stepZombie(z, aim, v * dt, pls);
    /* the claw: at a duck long enough, then again every so often (it keeps walking meanwhile) */
    const d = room(z.x, z.y, ...target.xy);
    if (d < CLAW) {
      if (!z.n) z.n = T || 1;
      if (T - z.n >= R[4] && T - z.a >= R[5]) {
        z.a = T;
        z.dir = Math.round(
          Math.atan2(target.xy[1] - z.y, target.xy[0] - z.x) * 100,
        );
        if (!dodging(s, target.p, now)) {
          const p = p4[target.id];
          if (p && !p.dn && !p.gh) {
            const hp = p.hp - 1;
            if (hp <= 0) {
              p4[target.id] = { hp: 0, at: now, dn: now + L4.BLEED };
              if (s.players[target.id]) s.players[target.id].dead = true;
              s.hang.still = {
                ...(s.hang.still || {}),
                [target.id]: now + L4.BLEED + 60000,
              };
              const b = { ...(s.hang.l4b || {}) };
              delete b[target.id];
              s.hang.l4b = b;
              pls.splice(pls.indexOf(target), 1);
            } else p4[target.id] = { ...p, hp, at: now };
          }
        }
      }
    } else z.n = 0;
  }
  s.hang.l4p = p4;
  s.hang.brd = brd;
  separate(zs);
}
/* straight toward (tx, ty), through anything (outside, or climbing in): true on arrival */
function walkTo(z, tx, ty, far) {
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
/* inside: a few small steps toward aim, sliding along walls, stopping at ducks */
function stepZombie(z, aim, far, pls) {
  const n = Math.max(1, Math.ceil(far / 8));
  for (let k = 0; k < n; k++) {
    const dx = aim[0] - z.x,
      dy = aim[1] - z.y,
      d = Math.hypot(dx, dy);
    if (d < 1) return;
    const sx = (dx / d) * (far / n),
      sy = (dy / d) * (far / n),
      zz = heightAt(z.x, z.y);
    const ok = (x, y) => {
      if (!zOk(x, y, zz)) return false;
      for (const q of pls) {
        const now = room(z.x, z.y, ...q.xy),
          then = room(x, y, ...q.xy);
        if (then < 1 && then < now) return false;
      }
      return true;
    };
    if (ok(z.x + sx, z.y + sy)) {
      z.x += sx;
      z.y += sy;
    } else if (ok(z.x + sx, z.y)) z.x += sx;
    else if (ok(z.x, z.y + sy)) z.y += sy;
    else return;
  }
}
/* zombies never stand in each other: two too close are pushed apart (each half), where it's open */
function separate(zs) {
  const live = zs.filter((z) => z.st !== 3),
    grid = new Map(),
    key = (x, y) => Math.floor(x / 64) * 10000 + Math.floor(y / 64);
  for (const z of live) {
    const k = key(z.x, z.y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(z);
  }
  for (let pass = 0; pass < 2; pass++)
    for (const a of live) {
      const i0 = Math.floor(a.x / 64),
        j0 = Math.floor(a.y / 64);
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++)
          for (const b of grid.get((i0 + di) * 10000 + j0 + dj) || []) {
            if (b.i <= a.i) continue;
            let ex = (a.x - b.x) / RX,
              ey = (a.y - b.y) / RY,
              e = Math.hypot(ex, ey);
            if (e >= 1) continue;
            if (e < 1e-3) {
              ex = Math.random() - 0.5;
              ey = Math.random() - 0.5;
              e = Math.hypot(ex, ey);
            }
            const push = (1 - e) / 2,
              ux = (ex / e) * push * RX,
              uy = (ey / e) * push * RY;
            nudge(a, ux, uy);
            nudge(b, -ux, -uy);
          }
    }
}
function nudge(z, dx, dy) {
  const x = z.x + dx,
    y = z.y + dy;
  if (
    z.st === 2 ? zOk(x, y, heightAt(z.x, z.y)) : !playable(x, y) || z.st === 4
  ) {
    z.x = x;
    z.y = y;
  }
}
/* ---------- for the computers (l4ddbots.js) ---------- */
/* the way from (x, y) toward (tx, ty) by walking (the next point along the flow field), or null; one field per target
   cell, kept for the heartbeat */
let ways = new Map(),
  waysAt = 0;
export function wayTo(x, y, tx, ty, now) {
  if (now - waysAt > 150) {
    ways = new Map();
    waysAt = now;
  }
  const c = openNear(tx, ty);
  if (c < 0) return null;
  if (!ways.has(c)) ways.set(c, flowFrom([c]));
  return heading(ways.get(c), x, y);
}
/* can a shot from (x0, y0) reach (x1, y1)? (no wall or furniture in between, at height z) */
export function clearShot(x0, y0, x1, y1, z = 0) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16));
  for (let k = 1; k < n; k++)
    if (walled(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, z))
      return false;
  return true;
}
export { standing as l4Up };

/* what the screens ask: a duck's HP, its bleeding out, the round */
export const l4Hp = (s, id) => {
  const p = P4(s, id);
  return p ? p.hp : -1;
};
export const l4Down = (s, id) => {
  const p = P4(s, id);
  return p && p.dn ? p.dn : 0;
};
