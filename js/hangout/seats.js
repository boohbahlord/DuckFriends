/* ---------- the couches, the campfire's logs and the kitchen chairs: sit down, hop over, get up ----------
   Near a couch (or a log by the campfire, or the kitchen table) the context button says "Sit": the duck sits on the
   nearest free cushion (a log has a seat at each end, the table a chair at each plate). Seated, it doesn't walk: a move key, a push of the stick or a tap to one side hops it to
   the next cushion that way, only if that one is free. "Get up" (or a jump) stands it up in front of the seat: on the
   couch's sitting side, on a log's fire side, behind a kitchen chair. Each cushion holds one duck; the host keeps who sits where in
   s.hang.seats ({ 'couch1:0': [id, since] }), checks every sit and frees a seat when its duck leaves, resets or walks off.

   Drawn sitting: the duck stands on the cushion at the seat's height and depth, between the couch's two parts (art.js'
   couch pair: the cushions behind it, the couch back in front), so the back covers its lower part and its head shows
   over it; on a log, the log's top covers its feet; at the table, the chair is behind it and the table hides its feet. A seated duck's name is over its head (class hang-sat). The couches
   and logs are drawn here (the world's placeholders are marked layer 'none'); the table and its chairs by shapes.js. */
import { rule, activity } from './registry.js';
import { PROPS, W, H, heightAt, standable, STEP } from './layout.js';
import * as A from './art.js';

const KINDS = ['couch', 'log'], SEAT_KINDS = [...KINDS, 'table'], ART_H = { couch: 174, log: 79 }, COLORS = { couch1: '#a8382c', couch2: '#3d6e4f' };
const REACH = 75;   // from a seat's footprint, the button shows
for (const p of PROPS) if (KINDS.includes(p.kind)) p.layer = 'none';   // (drawn here)
const FIRE = PROPS.find(p => p.kind === 'campfire');

/* every seat: { id, p (its couch or log), i, x, y (its depth), z (the height the duck sits at), up: [where it stands] } */
export const SEATS = [];
for (const p of PROPS.filter(q => SEAT_KINDS.includes(q.kind))) {
  const n = p.seats || 2, couch = p.kind === 'couch';
  if (p.kind === 'table') {   // a chair behind each plate (art.js' kitchenTable): sat on, the duck faces the room over the table
    for (let i = 0; i < n; i++) SEATS.push({ id: p.id + ':' + i, p, i, n, x: p.x + p.w * (i ? .7 : .3), y: p.y - 15, z: p.z + 32, up: [p.y - 70, p.y - 110] });
    continue;
  }
  for (let i = 0; i < n; i++) {
    const x = couch ? p.x + 30 + (i + .5) * (p.w - 60) / n : p.x + p.w * (i ? .74 : .26);
    const y = couch ? p.y + p.d * .55 : p.y + p.d / 2, z = p.z + 46;   // (on a couch a little higher than its cushion: the head shows over the backrest)
    const north = p.y - 26, south = p.y + p.d + 26, fireSouth = FIRE && p.y + p.d / 2 < FIRE.y + FIRE.d / 2;
    SEATS.push({ id: p.id + ':' + i, p, i, n, x, y, z, up: couch || !fireSouth ? [north, south] : [south, north] });
  }
}
const BY = new Map(SEATS.map(q => [q.id, q]));
const seatsOf = s => (s && s.hang && s.hang.seats) || {};
export const seatOf = (s, id) => { for (const [k, v] of Object.entries(seatsOf(s))) if (v && v[0] === id) return BY.get(k) || null; return null; };
const free = (s, q, id) => !seatsOf(s)[q.id] || seatsOf(s)[q.id][0] === id;
/* where a duck stands up from a seat: in front of it (or behind, if that is blocked) */
function standSpot(q) {
  for (const y of q.up) for (const dx of [0, -40, 40]) { const x = q.x + dx, z = heightAt(x, y); if (standable(x, y, z, STEP)) return { x, y, z }; }
  return { x: q.x, y: q.up[0], z: heightAt(q.x, q.up[0]) };
}
const posAt = (x, y, z) => ({ x: +(x / W).toFixed(5), y: +(y / H).toFixed(5), j: 0, q: '', sp: false, z: Math.round(z), b: Math.round(z) });
/* how far (x, y) is from a prop's footprint */
const away = (p, x, y) => Math.hypot(Math.max(p.x - x, 0, x - p.x - p.w), Math.max(p.y - y, 0, y - p.y - p.d));

/* the rule: { t: 'hang', k: 'sit', seat } sits (or hops to another cushion); seat '' gets up */
rule('sit', {
  init: () => ({ seats: {} }),
  act(s, a, now) {
    const me = s.pos[a.id]; if (!me) return false;
    const was = seatOf(s, a.id), seats = { ...seatsOf(s) };
    if (!a.seat) {   // get up
      if (!was) return false;
      delete seats[was.id]; s.hang.seats = seats;
      if (!a.stay) { const st = standSpot(was); s.pos[a.id] = posAt(st.x, st.y, st.z); }   // (stay: it is somewhere else already)
      return true;
    }
    const q = BY.get(String(a.seat)); if (!q || q === was || !free(s, q, a.id)) return false;
    if (was ? was.p !== q.p : away(q.p, me.x * W, me.y * H) > REACH * 2.5) return false;   // (a hop stays on its couch; a sit only from beside it)
    if (was) delete seats[was.id];
    seats[q.id] = [a.id, now]; s.hang.seats = seats;
    s.pos[a.id] = posAt(q.x, q.y, q.z);
    return true;
  },
  /* a seat whose duck has gone, or is somewhere else (reset, walked off) for a moment, is free again */
  tick(s, now) {
    let ch = false; const seats = { ...seatsOf(s) };
    for (const [k, v] of Object.entries(seats)) {
      const q = BY.get(k), p = v && s.pos[v[0]];
      if (!q || !p || (now - v[1] > 2500 && Math.hypot(p.x * W - q.x, p.y * H - q.y) > 60)) { delete seats[k]; ch = true; }
    }
    if (ch) s.hang.seats = seats;
    return ch;
  },
  left(s, id) { const q = seatOf(s, id); if (q) { const seats = { ...seatsOf(s) }; delete seats[q.id]; s.hang.seats = seats; } },
});

/* ---------- on the screen ---------- */
let parts = [], placed = null, satSig = '', satAt = 0;   // the drawings; the seat my duck was put on here (until the room agrees); the ducks marked seated
function put(ctx, x, y, z) { const me = ctx.duck(); if (!me) return; Object.assign(me, { x: x / W, y: y / H, z, b: z, j: 0, lj: false, dj: 0, vz: null, _za: undefined }); }
function sit(ctx, q) {
  ctx.send({ t: 'hang', k: 'sit', seat: q.id });
  if (seatOf(ctx.state(), ctx.me) !== q) return;   // (taken meanwhile: the room said no)
  placed = q; put(ctx, q.x, q.y, q.z);
  const me = ctx.duck(); if (me && FIRE && q.p.kind === 'log') me.face = Math.sign(FIRE.x + FIRE.w / 2 - q.x) || 1;   // (on a log: toward the fire)
}
function getUp(ctx) {
  const q = seatOf(ctx.state(), ctx.me) || placed; if (!q) return;
  ctx.send({ t: 'hang', k: 'sit', seat: '' });
  placed = null; const st = standSpot(q); put(ctx, st.x, st.y, st.z);
}
activity({
  id: 'seats',
  mount(ctx) {
    A.useHangArtCSS();
    const box = ctx.world.board.querySelector('.hang-props');
    for (const p of PROPS.filter(q => KINDS.includes(q.kind))) {
      const bh = ART_H[p.kind], top = p.y + p.d - bh - p.z, list = [];
      if (p.kind === 'couch') { const art = A.couch({ w: p.w, h: bh, seats: p.seats, color: COLORS[p.id] || '#a8382c', facing: 'n', throwOn: p.id !== 'couch2' }); list.push([art.back, p.y + p.d - bh + art.backFoot], [art.front, p.y + p.d]); }
      else list.push([A.logSeat({ w: p.w, h: bh }), p.y + p.d]);
      for (const [html, key] of list) {
        const e = document.createElement('div');
        e.className = 'hp hang-seat-part'; e.innerHTML = html; e.hidden = true;
        Object.assign(e.style, { width: p.w + 'px', height: bh + 'px', zIndex: Math.round(key) + 10 });
        box.append(e); parts.push({ e, p, l: p.x, t: top, w: p.w, h: bh });
      }
    }
  },
  unmount() { for (const q of parts) q.e.remove(); parts = []; placed = null; satSig = ''; },
  draw(now, ctx) {
    const Wd = ctx.world, sc = Wd.sc, scs = sc.toFixed(4), vw = Wd.vw, vh = Wd.vh;
    for (const q of parts) {
      const a = Wd.toScreen(q.l, q.t), vis = (q.p.only !== 'in') !== Wd.inside && a.left < vw + 30 && a.left + q.w * sc > -30 && a.top < vh + 30 && a.top + q.h * sc > -30;
      if (q.e.hidden !== !vis) q.e.hidden = !vis;
      if (!vis) continue;
      const tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px) scale(${scs})`;
      if (q.e._tr !== tr) { q.e._tr = tr; q.e.style.transform = tr; }
    }
    // a seated duck has its name over its head (under it, the couch back or the log would hide it); now and then: a duck drawn anew
    const layer = Wd.board.querySelector('.ducks'), on = Object.values(seatsOf(ctx.state())).filter(Boolean).map(v => v[0]);
    const sig = on.join(); if (!layer || (sig === satSig && now - satAt < 1000)) return;
    satSig = sig; satAt = now;
    for (const d of layer.querySelectorAll('.gduck')) { const sat = on.includes(d.dataset.pid); if (d.classList.contains('hang-sat') !== sat) d.classList.toggle('hang-sat', sat); }
  },
  /* the button: Get up while seated; Sit beside a couch or a log with a free seat */
  near(pos, ctx) {
    const s = ctx.state();
    if (seatOf(s, ctx.me)) return { label: 'Get up', d: -1, act: () => getUp(ctx) };
    let best = null, bd = REACH;
    for (const q of SEATS) {
      if ((q.p.only === 'in') !== pos.inside || !free(s, q, ctx.me)) continue;
      const d = away(q.p, pos.x, pos.y), dq = Math.hypot(pos.x - q.x, pos.y - q.y);
      if (d < bd || (d === bd && best && dq < best.dq)) { bd = d; best = { q, dq }; }
    }
    if (!best) return null;
    // the nearest free cushion of that couch
    const q = SEATS.filter(o => o.p === best.q.p && free(s, o, ctx.me)).sort((a, b) => Math.hypot(pos.x - a.x, pos.y - a.y) - Math.hypot(pos.x - b.x, pos.y - b.y))[0];
    return { label: 'Sit', d: bd, act: () => sit(ctx, q) };
  },
  /* seated: no walking; my duck stays on its cushion, at the cushion's height */
  hold(ctx) { return this.heldZ(ctx) != null; },
  heldZ(ctx) { const q = seatOf(ctx.state(), ctx.me), me = ctx.duck(); return q && me && Math.hypot(me.x * W - q.x, me.y * H - q.y) < 60 ? q.z : null; },
  push(dx, dy, ctx) {   // a hop to the next cushion that way (screen left is west), only if it is free
    const q = seatOf(ctx.state(), ctx.me); if (!q || !dx) return;
    const to = BY.get(q.p.id + ':' + (q.i + Math.sign(dx)));
    if (to && free(ctx.state(), to, ctx.me)) { const me = ctx.duck(); if (me) me.face = Math.sign(dx); sit(ctx, to); }
  },
  jump(ctx) { if (!seatOf(ctx.state(), ctx.me)) return false; getUp(ctx); return true; },   // a jump gets up instead
  /* the room says my duck isn't seated (someone took the seat first, or the host freed it): it stands up */
  onState(s, ctx) {
    if (!placed || seatOf(s, ctx.me)) return;
    const me = ctx.duck(), q = placed; placed = null;
    if (me && Math.hypot(me.x * W - q.x, me.y * H - q.y) < 4) { const st = standSpot(q); put(ctx, st.x, st.y, st.z); }
  },
  /* seated, and my duck was put somewhere else (reset duck): get up */
  step(dt, now, ctx) {
    const q = seatOf(ctx.state(), ctx.me), me = ctx.duck(); if (!q || !me) return;
    if (Math.hypot(me.x * W - q.x, me.y * H - q.y) > 60) { ctx.send({ t: 'hang', k: 'sit', seat: '', stay: 1 }); placed = null; }
  },
});
