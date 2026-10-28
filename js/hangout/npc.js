/* ---------- Duck Cabin's characters: how they get around, and the host's heartbeat for them ----------
   The cats, Justin and the shadow duck are run by the host, like the computer players: their brains (cats.js,
   justin.js, shadowduck.js) live on the host, and what everyone needs to see goes in the room's state,
   s.hang.npc = { [id]: { w, a, f, z, say, … } }:
     w  their walk { p: [[x, y], …], t, v }: a path of world px, started at the room's time t, at v px a second. The host
        writes it once when they set off; every screen moves them along it on its own (walkAt), so they don't go over
        the network all the time.
     a  what they're doing ('', 'sit', 'loaf', 'swipe', 'eat', 'drink', 'dead', 'tv' …), f the way they face (1 right,
        -1 left), z a height of their own (on a couch or a table; none: the ground), say { text, t } their last words.
   Paths: a grid of 40-px cells over the world, built once from layout.js (standable), so moved props and new doors are
   found by themselves. A* finds the way; the pool can be kept out of it. Plain logic, no drawing: node can run it. */
import { holdDown, isGhost } from './death.js';
import { W, H, EDGE, STEP, heightAt, standable, onPlatform, inCabin, inPool, POOL, DOORS, CABIN } from './layout.js';

export const CELL = 40;
const GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
let grid = null;   // per cell: 0 blocked, 1 open; heights beside it
let hts = null;
const idx = (i, j) => j * GW + i;
const cellOf = (x, y) => [Math.max(0, Math.min(GW - 1, Math.floor(x / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(y / CELL)))];
const mid = (i, j) => [i * CELL + CELL / 2, j * CELL + CELL / 2];
/* the walking grid (built the first time it's asked for) */
export function walkGrid() {
  if (grid) return grid;
  grid = new Uint8Array(GW * GH); hts = new Float32Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const [x, y] = mid(i, j), z = heightAt(x, y); hts[idx(i, j)] = z;
    grid[idx(i, j)] = standable(x, y, z, 0) && !onPlatform(x, y) ? 1 : 0;   // (beds and tables: hopped onto, not walked)
  }
  return grid;
}
/* the cells where no(x, y) is true, for o.block (the shadow duck's lit places) */
export function blockMap(no) { const b = new Uint8Array(GW * GH); for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) b[idx(i, j)] = no(...mid(i, j)) ? 1 : 0; return b; }
/* rebuild after the map changes (tests) */
export const resetGrid = () => { grid = hts = null; };
const POOLPAD = 60;
const nearPool = (x, y) => x > POOL.x0 - POOLPAD && x < POOL.x1 + POOLPAD && y > POOL.y0 - POOLPAD && y < POOL.y1 + POOLPAD;
/* can a character be in this cell? (o.dry: not in or right beside the pool; o.block: a map of cells it won't enter, from
   blockMap) */
function open(i, j, o) {
  if (i < 0 || j < 0 || i >= GW || j >= GH || !grid[idx(i, j)]) return false;
  if (o.block && o.block[idx(i, j)]) return false;
  if (o.dry) { const [x, y] = mid(i, j); if (nearPool(x, y)) return false; }
  return true;
}
/* is (x, y) somewhere a character may stand? */
export function walkable(x, y, o = {}) { walkGrid(); const [i, j] = cellOf(x, y); return open(i, j, o); }
/* the nearest open cell to (x, y), within r cells (that passes ok(x, y), if given) */
export function nearestOpen(x, y, o = {}, r = 12, ok = null) {
  walkGrid(); const [ci, cj] = cellOf(x, y);
  for (let k = 0; k <= r; k++) for (let dj = -k; dj <= k; dj++) for (let di = -k; di <= k; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== k) continue;
    if (open(ci + di, cj + dj, o) && (!ok || ok(...mid(ci + di, cj + dj)))) return mid(ci + di, cj + dj);
  }
  return null;
}
/* a step between two cells: no more than two of a duck's steps (a cell is 40 px; the deck's stairs climb 12 every 27 px),
   so nobody walks off the deck's edge or up the slope's cliffs */
const stepOK = (a, b) => Math.abs(hts[a] - hts[b]) <= 2 * STEP + 2;
/* is the straight line from a to b open the whole way? (for smoothing a path) */
function clear(ax, ay, bx, by, o) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / (CELL / 3));
  let last = null;
  for (let k = 0; k <= n; k++) {
    const [i, j] = cellOf(ax + (bx - ax) * k / n, ay + (by - ay) * k / n), c = idx(i, j);
    if (!open(i, j, o)) return false;
    if (last !== null && last !== c && !stepOK(last, c)) return false;
    last = c;
  }
  return true;
}
/* the way from (ax, ay) to (bx, by): a few corners [[x, y], …], or null when there is none */
export function findPath(ax, ay, bx, by, o = {}) {
  walkGrid();
  const side = (x, y) => inCabin(x, y) ? inCabin : (px, py) => !inCabin(px, py);   // (a point in a table by the wall: its open side in the room, not outside)
  const s0 = nearestOpen(ax, ay, o, 12, side(ax, ay)) || nearestOpen(ax, ay, o), g0 = nearestOpen(bx, by, o, 12, side(bx, by)) || nearestOpen(bx, by, o); if (!s0 || !g0) return null;
  const [si, sj] = cellOf(...s0), [gi, gj] = cellOf(...g0), S = idx(si, sj), G = idx(gi, gj);
  if (S === G) return [[ax, ay], g0];
  const gs = new Map([[S, 0]]), from = new Map(), heap = [[0, S]], done = new Set();
  const hf = c => Math.hypot(c % GW - gi, Math.floor(c / GW) - gj);
  const push = (f, c) => { heap.push([f, c]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  let found = false, guard = 0;
  while (heap.length && guard++ < 40000) {
    const [, c] = pop(); if (done.has(c)) continue; done.add(c);
    if (c === G) { found = true; break; }
    const ci = c % GW, cj = Math.floor(c / GW);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj; if (!open(ni, nj, o)) continue;
      if (di && dj && (!open(ci + di, cj, o) || !open(ci, cj + dj, o))) continue;   // (no cutting a corner)
      const n = idx(ni, nj); if (!stepOK(c, n)) continue;
      const g = gs.get(c) + (di && dj ? 1.414 : 1);
      if (g < (gs.get(n) ?? Infinity)) { gs.set(n, g); from.set(n, c); push(g + hf(n), n); }
    }
  }
  if (!found) return null;
  const cells = []; for (let c = G; c !== undefined; c = from.get(c)) cells.push(mid(c % GW, Math.floor(c / GW)));
  cells.reverse();
  /* smoothed: from each corner, straight to the furthest point still in sight */
  const out = [[ax, ay]]; let k = 0;
  while (k < cells.length - 1) {
    let far = k + 1; const [px, py] = out[out.length - 1];
    for (let m = cells.length - 1; m > k + 1; m--) if (clear(px, py, cells[m][0], cells[m][1], o)) { far = m; break; }
    out.push(cells[far]); k = far;
  }
  const [lx, ly] = out[out.length - 1];
  if (Math.hypot(lx - bx, ly - by) > 1 && clear(lx, ly, bx, by, o)) out.push([bx, by]);
  return out.map(([x, y]) => [Math.round(x), Math.round(y)]);
}

/* ---------- walking: everyone works out where a character is from its walk ---------- */
const len = p => { let L = 0; for (let k = 1; k < p.length; k++) L += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); return L; };
/* where a walk has got to at the room's time now: { x, y, moving, dx } */
export function walkAt(w, now) {
  if (!w || !w.p || !w.p.length) return null;
  let d = Math.max(0, (now - w.t) / 1000 * w.v), k = 1;
  if (w.p.length === 1) return { x: w.p[0][0], y: w.p[0][1], moving: false, dx: 0 };
  for (; k < w.p.length; k++) {
    const [ax, ay] = w.p[k - 1], [bx, by] = w.p[k], L = Math.hypot(bx - ax, by - ay);
    if (d <= L) { const u = L ? d / L : 1; return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, moving: true, dx: bx - ax }; }
    d -= L;
  }
  const [x, y] = w.p[w.p.length - 1], [px] = w.p[w.p.length - 2];
  return { x, y, moving: false, dx: x - px };
}
/* when a walk ends (the room's time) */
export const walkEnd = w => w.t + len(w.p) / w.v * 1000;
/* a walk from where a character is now to (x, y); null if there's no way (o: { dry }) */
export function walkTo(from, x, y, v, now, o = {}) {
  const p = findPath(from.x, from.y, x, y, o); if (!p) return null;
  return { p, t: now, v };
}
/* standing still at (x, y) */
export const stand = (x, y, now) => ({ p: [[Math.round(x), Math.round(y)]], t: now, v: 1 });

/* ---------- places ---------- */
/* a random open spot that passes ok(x, y), from rand() (0 … 1) */
export function randomSpot(rand, ok = () => true, o = {}) {
  walkGrid();
  for (let t = 0; t < 400; t++) {
    const x = EDGE + rand() * (W - 2 * EDGE), y = EDGE + rand() * (H - 2 * EDGE);
    if (ok(x, y) && walkable(x, y, o)) return [Math.round(x), Math.round(y)];
  }
  return null;
}
/* inside the cabin, away from its walls */
export const indoors = (x, y) => inCabin(x, y) && x > CABIN.x0 + 40 && x < CABIN.x1 - 40 && y > CABIN.y0 + 40 && y < CABIN.y1 - 40;
/* just outside the front door: the front of the cabin, the path and the jeep */
export const outFront = (x, y) => y < CABIN.y0 - 60 && y > 250 && Math.abs(x - DOORS.front.x) < 700;
export { inCabin, inPool, DOORS, CABIN, POOL };

/* ---------- the host's heartbeat: every character's brain ----------
   brain(id, { kind, init(now, rand), tick(me, c), act(me, a, c), hit(me, by, c) }) adds a character. me is its record
   (a copy; change it and return true to write it down), c = { s, now, rand, ducks, npcs, at(id), say, kill, go, … }.
   The host runs npcTick on every heartbeat, npcAct for a player's { t: 'hang', k: 'npc', who, do } and npcHit when a
   player knocks one down. What everyone else sees: s.hang.npc (above), their words in the chat (s.log: { npc, name,
   text }) and s.hang.npcFx (swipes, shots and purrs, the newest 12, for the screens). */
export const BRAINS = new Map();
export const brain = (id, b) => { BRAINS.set(id, b); };
let pathsLeft = 0;   // paths a heartbeat may work out (a long one can take 20 ms)
const seen = new Map();   // player id → where they were at the last heartbeat (their speed)
/* the players, in world px: { id, x, y, z, dead, inside, speed } */
function ducks(s, now) {
  const out = [];
  for (const id of s.seat || []) {
    const p = s.pos && s.pos[id], P = s.players && s.players[id]; if (!p || p.x < 0 || !P || isGhost(s, id)) continue;   // (ghosts: not there for them)
    const x = p.x * W, y = p.y * H, q = seen.get(id), dt = q ? Math.max(.05, (now - q.t) / 1000) : 1;
    const speed = q ? Math.hypot(x - q.x, y - q.y) / dt : 0;
    seen.set(id, { x, y, t: now });
    out.push({ id, x, y, z: p.z ?? heightAt(x, y), dead: !!P.dead, inside: inCabin(x, y), speed, name: P.name });
  }
  return out;
}
/* where character `rec` is now */
export function npcAt(rec, now) {
  const w = walkAt(rec && rec.w, now); if (!w) return null;
  return { x: w.x, y: w.y, z: rec.z ?? heightAt(w.x, w.y), moving: w.moving, f: w.dx > 0 ? 1 : w.dx < 0 ? -1 : rec.f || 1 };
}
const ring = (list, item) => [...(list || []).slice(-11), item];
function ctxFor(s, now, rand, D, recs) {
  const said = {};
  const c = {
    s, now, rand, ducks: D, npcs: recs, said,
    at: id => npcAt(recs[id], now),
    /* a character speaks: its bubble (for ms, if given) and the chat */
    say(id, text, ms) {
      s.hang.npcN = (s.hang.npcN || 0) + 1;
      said[id] = { text, t: now, n: s.hang.npcN, ...(ms ? { d: ms } : {}) };
      if (s.log) { s.logN = (s.logN || 0) + 1; s.log = [...s.log.slice(-199), { n: s.logN, t: Date.now(), npc: id, name: (BRAINS.get(id) || {}).name || id, text }]; }   // (the chat, like rules.js' logLine)
    },
    /* change another character (a swipe sends it running): fn gets a copy to change */
    poke(id, fn) { if (!recs[id]) return; const o = { ...recs[id] }; fn(o); recs[id] = o; c.poked = true; },
    /* a duck plays dead (a swipe or a shot), for everyone, and can't move for a while (death.js) */
    kill(by, pid, kind) {
      const P = s.players[pid]; if (!P || P.dead || isGhost(s, pid)) return false;
      s.players = { ...s.players, [pid]: { ...P, dead: true } };
      holdDown(s, pid, now);
      const d = D.find(q => q.id === pid); if (d) d.dead = true;
      c.fx(by, pid, kind); return true;
    },
    fx(by, who, kind) { s.hang.npcN = (s.hang.npcN || 0) + 1; s.hang.npcFx = ring(s.hang.npcFx, { n: s.hang.npcN, by, who, kind, t: now }); },
    /* set off toward (x, y) at v px a second; false when there's no way or no time this heartbeat */
    go(me, x, y, v, o = {}) {
      if (pathsLeft <= 0) return false;
      pathsLeft--;
      return c.send(me, x, y, v, o);
    },
    /* the same, now, whatever the budget (a short run: a cat sent off by a swipe) */
    send(me, x, y, v, o = {}) {
      let from = npcAt(me, now) || { x, y };
      if (me.z) { const p = nearestOpen(from.x, from.y, o, 12, inCabin(from.x, from.y) ? inCabin : null); if (p) from = { x: p[0], y: p[1] }; }   // (off a couch or a table: a hop down beside it)
      const w = walkTo(from, x, y, v, now, o); if (!w) return false;
      me.w = w; delete me.z; return true;
    },
    stop(me) { const p = npcAt(me, now); if (p) { me.w = stand(p.x, p.y, now); me.f = p.f; } },
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  };
  return c;
}
const settle = (recs, id, me, c) => { recs[id] = c.said[id] ? { ...me, say: c.said[id] } : me; };
export function npcInit(now = 0, rand = Math.random) {
  const recs = {};
  for (const [id, b] of BRAINS) recs[id] = b.init(now, rand);
  return recs;
}
/* the host's heartbeat: true when s.hang changed */
export function npcTick(s, now, rand = Math.random) {
  if (!s.hang) return false;
  if (!s.hang.npc) { s.hang.npc = npcInit(now, rand); return true; }
  pathsLeft = 2;
  const recs = { ...s.hang.npc }, c = ctxFor(s, now, rand, ducks(s, now), recs);
  let ch = false;
  for (const [id, b] of BRAINS) {
    if (!recs[id]) { recs[id] = b.init(now, rand); ch = true; continue; }
    const me = { ...recs[id] };
    if (b.tick(me, c) || c.said[id]) { settle(recs, id, me, c); ch = true; }
  }
  for (const id in c.said) if (recs[id] && recs[id].say !== c.said[id]) { recs[id] = { ...recs[id], say: c.said[id] }; ch = true; }   // (words one said for another)
  if (ch || c.poked) { s.hang.npc = recs; return true; }
  return false;
}
/* a player's action on a character: { who, do } (a.id is the player) */
export function npcAct(s, a, now, rand = Math.random) {
  const b = BRAINS.get(String(a.who)); if (!b || !b.act || !s.hang || !s.hang.npc || !s.hang.npc[a.who]) return false;
  pathsLeft = 2;
  const recs = { ...s.hang.npc }, c = ctxFor(s, now, rand, ducks(s, now), recs), me = { ...recs[a.who] };
  const by = c.ducks.find(d => d.id === a.id); if (!by || by.dead) return false;
  const at = npcAt(me, now); if (!at || Math.hypot(at.x - by.x, at.y - by.y) > 170) return false;   // (only from beside it)
  if (!b.act(me, a, c, by) && !c.said[a.who]) return false;
  settle(recs, a.who, me, c); s.hang.npc = recs; return true;
}
/* a player knocked a character down (a shot, a dagger, a ball, kill @name); by: the player's id */
export function npcHit(s, id, by, now, rand = Math.random) {
  const b = BRAINS.get(id); if (!b || !b.hit || !s.hang || !s.hang.npc || !s.hang.npc[id]) return false;   // (the cats can't be hurt)
  pathsLeft = 2;
  const recs = { ...s.hang.npc }, c = ctxFor(s, now, rand, ducks(s, now), recs), me = { ...recs[id] };
  if (!b.hit(me, by, c) && !c.said[id]) return false;
  settle(recs, id, me, c); s.hang.npc = recs; return true;
}
