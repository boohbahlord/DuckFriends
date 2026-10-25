/* ---------- the chalk floor: draw on it with the chalk, wipe it with the eraser ----------
   Beside the chalk floor (the great room's north-west corner) lie the chalk and, under it, the eraser. Pressing the chalk
   (a click or a tap on it, or the context button "Chalk" beside it) picks it up: the duck holds a little chalk stick,
   and a drag of the mouse or a finger on the floor draws in the duck's own body color. Anyone holding chalk draws at the
   same time; walking away from the floor or pressing the chalk again puts it down. Standing on the eraser, the button
   says "Erase": the floor is wiped for everyone, with a little dust.

   The room keeps the drawing in s.hang.chalk = { h: { id: 1 } (who holds chalk), e: (how many times it was erased),
   s: [strokes] }. A stroke is one string: its color (6 hex digits), its tag (4 letters the drawer picks, so the next
   batch of the same stroke joins it), then its points, 4 letters each (x and y on the slate in whole world px, 2 letters
   apiece). The drawer sends its points a few times a second, simplified; the host appends them, and keeps the drawing
   under CAP letters by dropping the oldest strokes. Every screen paints the strokes on a canvas laid on the slate, under
   the ducks: chalky (grainy, a little dust round the lines, a slightly rough edge). */
import { rule, activity } from './registry.js';
import { PROPS, W, H } from './layout.js';
import { puffHTML } from '../specials.js';
import { mix } from '../duck.js';
import { sfx } from '../sound.js';

const FLOOR = PROPS.find(p => p.kind === 'chalkfloor'), CHALK = PROPS.find(p => p.kind === 'chalk'), ERASER = PROPS.find(p => p.kind === 'eraser');
const IN = 18;   // the slate inside the floor's wooden frame
const SL = { x0: FLOOR.x + IN, y0: FLOOR.y + IN, w: FLOOR.w - 2 * IN, h: FLOOR.d - 2 * IN };
const NEAR = 150;          // world px round the floor (and the chalk and eraser beside it) where chalk can be held
const AWAY = 230;          // walked this far off: the chalk goes down (the host allows a little more, for lag)
const CAP = 12000, KEEP = 9600, LONG = 1210, BATCH = 80;   // letters kept in all; kept after dropping the oldest; letters a stroke; points a batch
const SEND = 220;          // ms between batches while drawing
const RES = 1.5;           // canvas px per world px

/* the points, in letters */
const B64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_', VAL = {};
for (let i = 0; i < 64; i++) VAL[B64[i]] = i;
const enc = pts => pts.map(([x, y]) => B64[x >> 6] + B64[x & 63] + B64[y >> 6] + B64[y & 63]).join('');
function dec(s, from = 10) {
  const out = [];
  for (let i = from; i + 3 < s.length; i += 4) out.push([VAL[s[i]] * 64 + VAL[s[i + 1]], VAL[s[i + 2]] * 64 + VAL[s[i + 3]]]);
  return out;
}
const okPts = p => typeof p === 'string' && p.length >= 4 && p.length % 4 === 0 && p.length <= BATCH * 4
  && dec(p, 0).every(([x, y]) => x >= 0 && x <= SL.w && y >= 0 && y <= SL.h);

/* where things are */
const right = Math.max(FLOOR.x + FLOOR.w, CHALK.x + CHALK.w, ERASER.x + ERASER.w);
const nearFloor = (x, y, m = NEAR) => x > FLOOR.x - m && x < right + m && y > FLOOR.y - m && y < FLOOR.y + FLOOR.d + m;
const inBox = (x, y, p, m = 0) => x > p.x - m && x < p.x + p.w + m && y > p.y - m && y < p.y + p.d + m;
const mid = p => [p.x + p.w / 2, p.y + p.d / 2];
const chalkOf = s => ((s && s.hang) || {}).chalk || { h: {}, e: 0, s: [] };
const colorOf = (s, id) => { const c = (((s.players || {})[id] || {}).duck || {}).color; return /^#[0-9a-f]{6}$/i.test(c || '') ? c.slice(1).toLowerCase() : 'ffd23f'; };

/* ---------- the rules (the host) ---------- */
rule('chalk', {
  init: () => ({ chalk: { h: {}, e: 0, s: [] } }),
  act(s, a) {
    const c = s.hang.chalk = s.hang.chalk || { h: {}, e: 0, s: [] }, me = s.pos[a.id]; if (!me || !s.players[a.id]) return false;
    c.h = c.h || {}; c.s = c.s || [];
    const x = me.x * W, y = me.y * H;
    switch (a.do) {
      case 'pick': if (c.h[a.id] || !nearFloor(x, y, NEAR + 60)) return false; c.h[a.id] = 1; return true;
      case 'put': if (!c.h[a.id]) return false; delete c.h[a.id]; return true;
      case 'erase': if (!inBox(x, y, ERASER, 70)) return false; c.s = []; c.e = (c.e || 0) + 1; return true;
      case 'draw': {
        const tag = String(a.sid || ''), p = a.p;
        if (!c.h[a.id] || !/^[0-9a-z]{4}$/.test(tag) || !okPts(p)) return false;
        const col = colorOf(s, a.id);
        let i = c.s.length - 1; while (i >= 0 && i >= c.s.length - 12 && c.s[i].slice(0, 10) !== col + tag) i--;   // (this stroke's last piece, among the newest)
        if (i >= 0 && i >= c.s.length - 12 && c.s[i].length + p.length <= LONG) c.s[i] += p;
        else if (i >= 0 && i >= c.s.length - 12) c.s.push(col + tag + c.s[i].slice(-4) + p);   // (a long stroke goes on in a new piece, from where it was)
        else c.s.push(col + tag + p);
        let n = c.s.reduce((t, k) => t + k.length, 0);
        if (n > CAP) { let k = 0; while (n > KEEP && k < c.s.length - 1) n -= c.s[k++].length; c.s = c.s.slice(k); }   // (the oldest go, a good few at once)
        return true;
      }
    }
    return false;
  },
  tick(s) {   // whoever walked off (or left) puts the chalk down
    const c = s.hang.chalk; if (!c || !c.h) return false;
    let ch = false;
    for (const id of Object.keys(c.h)) { const p = s.pos[id]; if (!p || !s.players[id] || !nearFloor(p.x * W, p.y * H, AWAY + 60)) { delete c.h[id]; ch = true; } }
    return ch;
  },
  left(s, id) { const c = s.hang && s.hang.chalk; if (c && c.h) delete c.h[id]; },
});

/* ---------- chalky lines ---------- */
/* a binary grain (each pixel the color or nothing), so drawing a line twice looks the same as once */
function grain(col, fill, k) {
  const c = document.createElement('canvas'); c.width = c.height = 72;
  const g = c.getContext('2d'), im = g.createImageData(72, 72), [r, gg, b] = [0, 2, 4].map(i => parseInt(col.slice(i, i + 2), 16));
  let seed = 1234567;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let y = 0; y < 72; y += k) for (let x = 0; x < 72; x += k) {
    if (rnd() > fill) continue;
    const v = .88 + rnd() * .12;
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const o = ((y + dy) * 72 + x + dx) * 4; im.data[o] = r * v; im.data[o + 1] = gg * v; im.data[o + 2] = b * v; im.data[o + 3] = 255; }
  }
  g.putImageData(im, 0, 0); return c;
}
/* chalk on a dark slate: the color a little lighter (a dark color lighter still) */
function chalkColor(hex) {
  const n = parseInt(hex, 16), lum = (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255;
  return mix('#' + hex, 255, lum < .3 ? .5 : .18).replace('#', '');
}

/* ---------- on each screen ---------- */
let v = null;   // this screen's chalk floor while the cabin is open
const holding = ctx => !!chalkOf(ctx.state()).h[ctx.me];
const send = (ctx, what, more = {}) => ctx.send({ t: 'hang', k: 'chalk', do: what, ...more });

function paints(hex) {
  let p = v.pats.get(hex); if (p) return p;
  const c = chalkColor(hex);
  p = { body: v.g.createPattern(grain(c, .8, 2), 'repeat'), edge: v.g.createPattern(grain(c, .55, 1), 'repeat'), dust: v.g.createPattern(grain(c, .07, 2), 'repeat') };
  v.pats.set(hex, p); return p;
}
const wob = (x, y) => (((x * 7 + y * 13) % 5) - 2) * .45;   // the rough edge: the same nudge for the same point, always
function trace(pts, nudge = false) {
  const g = v.g; g.beginPath();
  pts.forEach(([x, y], i) => { const a = nudge ? x + wob(x, y) : x, b = nudge ? y + wob(y, x) : y; if (i) g.lineTo(a, b); else g.moveTo(a, b); });
  if (pts.length === 1) g.lineTo(pts[0][0] + .01, pts[0][1]);   // (a dot)
}
function line(hex, pts) {
  if (!pts.length) return;
  const g = v.g, P = paints(hex);
  g.lineCap = g.lineJoin = 'round';
  g.strokeStyle = P.dust; g.lineWidth = 13; trace(pts); g.stroke();
  g.strokeStyle = P.body; g.lineWidth = 5.5; trace(pts); g.stroke();
  g.strokeStyle = P.edge; g.lineWidth = 2.6; trace(pts, true); g.stroke();
}
/* everything again (after an erase, or when the oldest strokes went) */
function redraw(s) {
  const c = chalkOf(s);
  v.g.setTransform(RES, 0, 0, RES, 0, 0); v.g.clearRect(0, 0, SL.w, SL.h);
  for (const k of c.s || []) line(k.slice(0, 6), dec(k));
  v.drawn = (c.s || []).slice(); v.queue = [];
  if (v.cur && v.cur.raw.length) line(v.cur.col, v.cur.anchor ? [v.cur.anchor, ...v.cur.raw] : v.cur.raw);   // (my line not sent yet)
}
/* a new state: what was added since is drawn over the next moment (so a batch from someone else flows on like a pen) */
function sync(s) {
  const c = chalkOf(s), now = c.s || [];
  if ((c.e || 0) !== v.e) { const wiped = v.e !== null; v.e = c.e || 0; if (wiped) { erased(); return; } }
  if (v.wiping) return;
  const old = v.drawn;
  let ok = now.length >= old.length;
  for (let i = 0; ok && i < old.length; i++) ok = now[i].startsWith(old[i]);
  if (!ok) { redraw(s); return; }
  for (let i = 0; i < now.length; i++) {
    const was = (old[i] || '').length; if (now[i].length === was) continue;
    const pts = dec(now[i], was ? was - 4 : 10);   // (from the last point drawn, so it joins)
    v.queue.push({ hex: now[i].slice(0, 6), pts, at: 1 });
  }
  v.drawn = now.slice();
}
/* the floor wiped: a little dust, the chalk fades off */
function erased() {
  v.wiping = true; v.cv.classList.add('wipe');
  const fx = v.ctx.world.board.querySelector('.fxl'), sc = v.ctx.world.sc;
  if (fx && v.ctx.world.inside) {
    sfx.puff();
    for (let i = 0; i < 10; i++) {
      const x = i ? SL.x0 + SL.w * (.12 + .76 * ((i * 37) % 10) / 9) : mid(ERASER)[0], y = i ? SL.y0 + SL.h * (.12 + .76 * ((i * 61) % 10) / 9) : mid(ERASER)[1];
      const a = v.ctx.world.toScreen(x, y), pf = document.createElement('div');
      setTimeout(() => { pf.innerHTML = puffHTML(a.left, a.top, 64 * sc * (i ? 2.4 : 1.4), '#e6ece9'); fx.append(pf); setTimeout(() => pf.remove(), 1000); }, i * 40);
    }
  }
  clearTimeout(v.wipeT);
  v.wipeT = setTimeout(() => { if (!v) return; v.wiping = false; v.cv.classList.remove('wipe'); redraw(v.ctx.state()); }, 380);
}

/* drawing: my points, a few times a second, simplified */
function simplify(pts, eps = .9) {   // Ramer–Douglas–Peucker, keeping both ends
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let far = -1, fd = eps;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > fd) { fd = d; far = i; } }
    if (far > 0) { keep[far] = 1; st.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function flush(ctx) {
  const cur = v.cur; if (!cur || !cur.raw.length) return;
  cur.sentAt = performance.now();
  let pts = simplify(cur.anchor ? [cur.anchor, ...cur.raw] : cur.raw);
  if (cur.anchor) pts = pts.slice(1);
  cur.anchor = cur.raw[cur.raw.length - 1]; cur.raw = [];
  for (let i = 0; i < pts.length; i += BATCH) send(ctx, 'draw', { sid: cur.sid, p: enc(pts.slice(i, i + BATCH)) });
}
const onSlate = (pt, m = 0) => pt.x > SL.x0 - m && pt.x < SL.x0 + SL.w + m && pt.y > SL.y0 - m && pt.y < SL.y0 + SL.h + m;
const slatePt = pt => [Math.round(Math.max(0, Math.min(SL.w, pt.x - SL.x0))), Math.round(Math.max(0, Math.min(SL.h, pt.y - SL.y0)))];
function addPt(pt) {
  const cur = v.cur, q = slatePt(pt), last = cur.raw[cur.raw.length - 1] || cur.anchor;
  if (last && Math.hypot(q[0] - last[0], q[1] - last[1]) < 2.2) return;
  cur.raw.push(q);
  v.g.setTransform(RES, 0, 0, RES, 0, 0);
  line(cur.col, last ? [last, q] : [q]);   // (at once on my screen)
}

/* the chalk stick a holding duck carries */
function sticks(ctx, s) {
  const c = chalkOf(s), layer = ctx.world.board.querySelector('.ducks'); if (!layer) return;
  for (const id of Object.keys(c.h || {})) {
    const d = layer.querySelector(`.gduck[data-pid="${CSS.escape(id)}"] .gduck-lift`); if (!d) continue;
    let k = d.querySelector('.hang-chalkstick');
    if (!k) { k = document.createElement('span'); k.className = 'hang-chalkstick'; k.setAttribute('aria-hidden', 'true'); d.append(k); }
    const col = '#' + chalkColor(colorOf(s, id)); if (k._c !== col) { k._c = col; k.style.setProperty('--chalk', col); }
  }
  for (const k of layer.querySelectorAll('.hang-chalkstick')) { const id = k.closest('.gduck').dataset.pid; if (!(c.h || {})[id]) k.remove(); }
}

activity({
  id: 'chalk',
  mount(ctx) {
    const box = ctx.world.board.querySelector('.hang-props'); if (!box) return;
    const cv = document.createElement('canvas');
    cv.className = 'hang-chalk-ink'; cv.width = Math.round(SL.w * RES); cv.height = Math.round(SL.h * RES);
    Object.assign(cv.style, { width: SL.w + 'px', height: SL.h + 'px' }); cv.dataset.x0 = SL.x0; cv.dataset.y0 = SL.y0; cv.hidden = true;
    box.append(cv);
    v = { ctx, cv, g: cv.getContext('2d'), pats: new Map(), drawn: [], queue: [], e: null, cur: null, wiping: false, wipeT: 0, putSent: 0, tr: '', sig: '', stickAt: 0, last: 0 };
    sync(ctx.state());
  },
  unmount() { if (!v) return; clearTimeout(v.wipeT); v.cv.remove(); v.ctx.world.board.classList.remove('hang-pen'); v = null; },
  near(pos, ctx) {
    if (!pos.inside || !v || !nearFloor(pos.x, pos.y)) return null;
    const have = holding(ctx);
    if (inBox(pos.x, pos.y, ERASER, 6)) return { label: 'Erase', d: 0, act: () => send(ctx, 'erase') };
    const [cx, cy] = mid(CHALK), d = Math.hypot(pos.x - cx, pos.y - cy);
    if (d < 110) return { label: have ? 'Put down' : 'Chalk', d, act: () => send(ctx, have ? 'put' : 'pick') };
    return have ? { label: 'Put down', d: 200, act: () => send(ctx, 'put') } : null;
  },
  onState(s) { if (v) sync(s); },
  step(dt, _, ctx) {
    if (!v) return;
    const me = ctx.duck(), have = holding(ctx), now = performance.now();
    if (have && me && !nearFloor(me.x * W, me.y * H, AWAY) && now - v.putSent > 1500) { v.putSent = now; if (v.cur) { flush(ctx); v.cur = null; } send(ctx, 'put'); }   // walked off: down it goes
    if (v.cur && !have && now - v.cur.t0 > 1500) v.cur = null;   // (the host put it down)
    if (v.cur && now - v.cur.sentAt > SEND) flush(ctx);
  },
  draw(now, ctx) {
    if (!v) return;
    const w = ctx.world, a = w.toScreen(SL.x0, SL.y0), sc = w.sc, bw = w.vw, bh = w.vh;
    const vis = w.inside && a.left < bw && a.top < bh && a.left + SL.w * sc > 0 && a.top + SL.h * sc > 0;
    if (v.cv.hidden === vis) v.cv.hidden = !vis;
    const pen = vis && holding(ctx); if (v.pen !== pen) { v.pen = pen; w.board.classList.toggle('hang-pen', pen); }   // (holding chalk: a pen for the mouse)
    if (vis) { const tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px) scale(${sc.toFixed(4)})`; if (v.tr !== tr) { v.tr = tr; v.cv.style.transform = tr; } }
    if (v.queue.length && !v.wiping) {   // others' lines flow on over about a fifth of a second
      v.g.setTransform(RES, 0, 0, RES, 0, 0);
      let left = v.queue.reduce((t, q) => t + q.pts.length - q.at, 0), n = Math.max(3, Math.ceil(left * Math.min(1, (now - (v.last || now)) / 180 + .05)));
      while (n > 0 && v.queue.length) {
        const q = v.queue[0], k = Math.min(q.pts.length, q.at + n);
        line(q.hex, q.pts.slice(Math.max(0, q.at - 1), k)); n -= k - q.at; q.at = k;
        if (q.at >= q.pts.length) v.queue.shift();
      }
    }
    v.last = now;
    const s = ctx.state(), sig = JSON.stringify(chalkOf(s).h || {}) + ctx.world.board.querySelectorAll('.ducks .gduck').length;
    if (sig !== v.sig || now - v.stickAt > 1000) { v.sig = sig; v.stickAt = now; sticks(ctx, s); }   // (and now and then: a duck drawn anew)
  },
  pointer(kind, pt, e, ctx) {
    if (!v) return false;
    if (kind === 'down') {
      if (e.button > 0 || !ctx.world.inside) return false;
      if (v.cur) { flush(ctx); v.cur = null; }   // (one finger draws at a time: the newest)
      const me = ctx.duck(); if (!me) return false;
      const mx = me.x * W, my = me.y * H;
      if (inBox(pt.x, pt.y, CHALK, 16) && nearFloor(mx, my)) { send(ctx, holding(ctx) ? 'put' : 'pick'); return true; }   // the chalk itself
      if (!holding(ctx) || !onSlate(pt, 4) || !nearFloor(mx, my, AWAY)) return false;
      e.preventDefault();
      v.cur = { pid: e.pointerId, sid: Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0'), col: colorOf(ctx.state(), ctx.me), raw: [], anchor: null, sentAt: performance.now(), t0: performance.now() };
      addPt(pt);
      return true;
    }
    if (!v.cur || e.pointerId !== v.cur.pid) return false;
    if (kind === 'move') addPt(pt);
    else if (kind === 'up') { if (e.type === 'pointerup') addPt(pt); flush(ctx); v.cur = null; }
    return true;
  },
});
