/* Duck Cabin's characters, run without a screen: node tools/npc-sim.mjs [minutes] [players] [seed]
   Three (or more) pretend players wander the map, walk up to the characters, press E on them and now and then knock
   Justin down; the host's heartbeat runs every 200 ms. It prints what happened (every behavior, counted), how big the
   characters' part of the room's state gets, and fails if a character gets stuck, stands in the pool, or a heartbeat is slow. */
import { npcTick, npcAct, npcHit, npcAt, findPath, randomSpot, walkAt, walkable, BRAINS } from '../js/hangout/npc.js';
import '../js/hangout/cats.js';
import '../js/hangout/justin.js';
import '../js/hangout/shadowduck.js';
import { W, H, inPool, inCabin } from '../js/hangout/layout.js';

const MIN = +(process.argv[2] || 10), NP = +(process.argv[3] || 3);
let seed = +(process.argv[4] || 7);
const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const s = { seat: [], players: {}, pos: {}, hang: {} };
for (let k = 0; k < NP; k++) { const id = 'p' + k; s.seat.push(id); s.players[id] = { name: 'P' + k }; s.pos[id] = { x: 2000 / W, y: (450 - k * 50) / H, z: 0 }; }
const walks = {}, deadAt = {};
const count = {}, bump = k => { count[k] = (count[k] || 0) + 1; };
let lastLog = 0, lastFx = 0, slow = 0, worst = 0, bigState = 0;
const still = {}, maxStill = {}, bad = [];
const T0 = 1e6, END = T0 + MIN * 60000;
for (let now = T0; now < END; now += 200) {
  /* the players */
  for (const id of s.seat) {
    const P = s.players[id], p = s.pos[id];
    if (P.dead) { deadAt[id] ??= now; if (now - deadAt[id] > 3000) { s.players = { ...s.players, [id]: { ...P, dead: false } }; delete deadAt[id]; } continue; }
    let w = walks[id], at = w && walkAt(w, now);
    if (!w || (!at.moving && now > (w.rest ??= now + 1000 + rand() * 7000))) {
      let to;
      if (rand() < .45) { const ids = [...BRAINS.keys()], n = s.hang.npc && npcAt(s.hang.npc[ids[Math.floor(rand() * ids.length)]], now); if (n) to = [n.x + 50, n.y + 20]; }
      to ||= randomSpot(rand, () => true, { dry: rand() < .8 });
      const path = to && findPath(p.x * W, p.y * H, to[0], to[1]);
      if (path) walks[id] = w = { p: path, t: now, v: rand() < .2 ? 665 : 380 };
      at = w && walkAt(w, now);
    }
    if (at) s.pos[id] = { ...p, x: at.x / W, y: at.y / H };
    /* E on whoever is beside them */
    if (rand() < .05) for (const [nid, b] of BRAINS) {
      const n = npcAt(s.hang.npc && s.hang.npc[nid], now); if (!n || !b.act) continue;
      if (Math.hypot(n.x - p.x * W, n.y - p.y * H) < 150) { if (npcAct(s, { t: 'hang', k: 'npc', id, who: nid, do: nid === 'justin' ? 'talk' : 'pet' }, now, rand)) bump('E ' + nid); }
    }
    if (rand() < .0008) { if (npcHit(s, 'justin', id, now, rand)) bump('knocked Justin down'); }
  }
  const t = performance.now(); npcTick(s, now, rand); const ms = performance.now() - t;
  worst = Math.max(worst, ms); if (ms > 30) slow++;
  bigState = Math.max(bigState, JSON.stringify({ npc: s.hang.npc, log: s.hang.npcLog, fx: s.hang.npcFx }).length);
  for (const m of s.hang.npcLog || []) if (m.n > lastLog) { bump(`${m.who} says`); if (m.who === 'justin') bump('  Justin: ' + m.text.slice(0, 40)); lastLog = Math.max(lastLog, m.n); }
  for (const f of s.hang.npcFx || []) if (f.n > lastFx) { bump(`fx ${f.kind} ${f.by}→${s.players[f.who] ? 'a duck' : f.who}`); lastFx = Math.max(lastFx, f.n); }
  for (const [id, r] of Object.entries(s.hang.npc || {})) {
    const a = npcAt(r, now); if (!a) continue;
    bump(`${id} ${r.a || (a.moving ? 'walks' : 'stands')}${r.z ? ' up on something' : ''}`);
    if (id !== 'justin' && id !== 'shadow' && !inCabin(a.x, a.y)) { bump(`${id} outside the cabin`); if (process.env.OUT === id && (count.outp = (count.outp || 0) + 1) < 6) console.log(id, Math.round(a.x), Math.round(a.y), r.a, JSON.stringify(r.w).slice(0, 150)); }
    if (!r.z && inPool(a.x, a.y)) bad.push(`${id} in the pool at ${Math.round(a.x)},${Math.round(a.y)}`);
    if (!r.z && !walkable(a.x, a.y)) { bump(`(${id} off the walking grid a moment)`); if (process.env.OFF === id && (count.offp = (count.offp || 0) + 1) < 15) console.log(id, Math.round(a.x), Math.round(a.y), r.a, a.moving, JSON.stringify(r.w.p).slice(0, 80)); }
    if (id === 'shadow' && r.o && r.o.t === now) bump(`shadow ${r.o.v ? 'fades in' : 'fades out'}`);
    const key = Math.round(a.x) + ',' + Math.round(a.y) + r.a;
    if (!still[id] || still[id].key !== key) still[id] = { key, t: now };
    maxStill[id] = Math.max(maxStill[id] || 0, (now - still[id].t) / 1000);
  }
}
console.log(Object.entries(count).sort().map(([k, v]) => `${String(v).padStart(6)}  ${k}`).join('\n'));
console.log('\nlongest without moving (s):', maxStill);
console.log('slowest heartbeat:', worst.toFixed(1), 'ms; over 30 ms:', slow, '; biggest state:', bigState, 'bytes');
const stuck = Object.entries(maxStill).filter(([id, t]) => t > (id === 'justin' ? 400 : 110));   // (Justin stays down until revived)
if (bad.length || stuck.length || slow > 5) { console.log('FAIL', bad.slice(0, 5), stuck); process.exit(1); }
console.log('OK');
