/* ---------- Hangout on the screen: the camera, the ground, the props, how ducks stand and fall ----------
   The board is a window on the world (layout.js), centered on my duck: the camera eases after it and stops at the
   world's edges. About 1300 world px fit across a computer and 520 across a phone held upright, so a duck (64 world px)
   is the size it is on the boards. The ground is a canvas under everything (grass, the slope, floors, the deck, the
   pool, pools of warm light); every prop is an element sorted with the ducks by its front (z-index), so a duck behind
   the couch is covered by it and one in front covers it. Outside, the roof covers the cabin; inside, the roof and the
   front wall go away, the rooms show, and the outside goes dark. Ducks on the other side of the walls are hidden.

   My duck: walls, trunks and furniture stop it; it walks up 12 px at most (stairs are steps of 12); a jump gets onto
   higher ground only if it is that high at that moment; walking off an edge falls (off the deck, a long way). Other
   ducks glide to where the room says they are, and jump and fall from their own numbers (z: height, b: where the jump
   began). The activities (registry.js) add the context button, and whatever they draw. */
import * as L from './layout.js';
import { DRAW } from './shapes.js';
import { ACTS } from './registry.js';
import './activities.js';
import { duckRoom } from '../duck.js';
import { esc } from '../ui.js';

export const BOARD_HTML = '<div class="board hang-board"><canvas class="hang-ground" aria-hidden="true"></canvas><div class="hang-props"></div><div class="ducks"></div><div class="hang-shade" hidden></div><div class="fxl"></div></div>';
const SPEED = 380, SPRINT = 1.75;   // world px a second
const AIR_UP = 6;                    // in the air, ground this much above the feet still catches them
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const dirOf = (dx, dy) => dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u';

/* the grass tufts, and the floor's planks: the same every time */
const rnd = (s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)(77);
const TUFTS = Array.from({ length: 1400 }, () => [L.EDGE + rnd() * (L.W - 2 * L.EDGE), L.EDGE + rnd() * (L.H - 2 * L.EDGE)]).filter(([x, y]) => !(x > 1250 && x < 4350 && y > 550 && y < 2650) && !L.inPool(x, y) && !(y > L.PATH.y0 - 10 && y < L.PATH.y1 + 10 && x < L.PATH.x1));

/* api: room() → the room; me() → my duck { x, y (0 … 1), j, lj, dj, z, b … }; jumpZ(pos, now) (duck heights); landsAt(pos);
   cfg() → the jump's { T, H }; button() → the context button changed (redraw it) */
export function mountWorld(board, api) {
  const canvas = board.querySelector('.hang-ground'), g = canvas.getContext('2d'), propsBox = board.querySelector('.hang-props'), shade = board.querySelector('.hang-shade');
  const cam = { x: 0, y: 0, sc: 1, vw: 0, vh: 0, dpr: 1, set: false };
  const els = new Map();     // prop id → its element (made the first time it comes into view)
  const cls = new Map();     // prop id → the class its activity gives it
  const sm = new Map();      // other ducks as drawn: { x, y, z } in world px, gliding after the room's numbers
  let last = 0, inside = false, button = null, btnSig = null, pushed = '', grab = null, grabEnd = 0, seenState = null;
  const R = () => api.room();
  const toScreen = (x, y, h = 0) => ({ left: (x - cam.x) * cam.sc + cam.vw / 2, top: (y - h - cam.y) * cam.sc + cam.vh / 2 });
  const ctx = { state: () => R().state, get me() { return R().me; }, send: a => R().send(a), duck: () => api.me(),
    world: { toScreen, heightAt: L.heightAt, get sc() { return cam.sc; }, get inside() { return inside; }, board, propEl: id => els.get(id) || null } };
  const acts = () => ACTS.values();
  for (const a of acts()) a.mount?.(ctx);

  function ensure(me) { if (me.z === undefined || isNaN(me.z)) me.z = L.heightAt(me.x * L.W, me.y * L.H); if (me.b === undefined) me.b = me.z; }
  function clampCam() {
    const hw = cam.vw / cam.sc / 2, hh = cam.vh / cam.sc / 2, x0 = hw - 60, x1 = L.W + 60 - hw, y0 = hh - 160, y1 = L.H + 280 - hh;
    cam.x = x0 > x1 ? L.W / 2 : cl(cam.x, x0, x1); cam.y = y0 > y1 ? L.H / 2 : cl(cam.y, y0, y1);
  }
  /* where a duck is drawn: { x, y, z } in world px (mine as it is; the others as they glide) */
  const mine = id => id === R().me && api.me();
  function at(id, pos) {
    const m = mine(id); if (m) { ensure(m); return { x: m.x * L.W, y: m.y * L.H, z: m.z }; }
    return sm.get(id) || { x: pos.x * L.W, y: pos.y * L.H, z: pos.z ?? L.heightAt(pos.x * L.W, pos.y * L.H) };
  }
  function glide(id, p, dt, now) {
    const tx = p.x * L.W, ty = p.y * L.H; let o = sm.get(id);
    if (!o || Math.hypot(tx - o.x, ty - o.y) > 420) { o = { x: tx, y: ty, z: p.z ?? L.heightAt(tx, ty) }; sm.set(id, o); }
    else { const k = 1 - Math.exp(-dt / .09); o.x += (tx - o.x) * k; o.y += (ty - o.y) * k; }
    const gnd = L.heightAt(o.x, o.y);
    if (p.j && now < api.landsAt(p)) o.z = Math.max(gnd, (p.b ?? gnd) + api.jumpZ(p, now) * L.DUCK);   // a jump: the arc itself
    else if ((p.z ?? gnd) > L.heightAt(tx, ty) + 2) o.z = Math.max(gnd, o.z + ((p.z ?? gnd) - o.z) * (1 - Math.exp(-dt / .07)));   // falling
    else o.z = gnd;   // on the ground: the ground under it as it glides
  }

  /* ---------- the ground ---------- */
  const GRASS = '#1e3b2b', SLOPE_A = '#1b3527', SLOPE_B = '#13281d', LOW = '#17301f';
  function drawGround(now, s) {
    const { sc, vw, vh, dpr } = cam;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#08120d'; g.fillRect(0, 0, vw, vh);
    g.setTransform(sc * dpr, 0, 0, sc * dpr, (vw / 2 - cam.x * sc) * dpr, (vh / 2 - cam.y * sc) * dpr);
    const vx0 = cam.x - vw / 2 / sc - 20, vx1 = cam.x + vw / 2 / sc + 20, vy0 = cam.y - vh / 2 / sc - 20, vy1 = cam.y + vh / 2 / sc + 20;
    const see = (x0, y0, x1, y1) => x1 > vx0 && x0 < vx1 && y1 > vy0 && y0 < vy1;
    const lowY = L.SLOPE.y1 - L.SLOPE.low;   // where the downhill starts on the screen
    g.fillStyle = GRASS; g.fillRect(0, 0, L.W, L.SLOPE.y0);
    const sg = g.createLinearGradient(0, L.SLOPE.y0, 0, lowY); sg.addColorStop(0, SLOPE_A); sg.addColorStop(1, SLOPE_B);
    g.fillStyle = sg; g.fillRect(0, L.SLOPE.y0, L.W, lowY - L.SLOPE.y0);
    g.fillStyle = LOW; g.fillRect(0, lowY, L.W, L.H - L.SLOPE.low - lowY);
    // tufts of grass (where they are seen)
    g.strokeStyle = '#2b5138'; g.lineWidth = 3; g.beginPath();
    for (const [x, y] of TUFTS) { const yy = y - L.terrainAt(y); if (x < vx0 || x > vx1 || yy < vy0 || yy > vy1) continue; g.moveTo(x - 7, yy - 9); g.lineTo(x, yy); g.lineTo(x + 6, yy - 10); }
    g.stroke();
    // the soccer field: stripes and painted lines
    const F = L.FIELD;
    if (see(F.x0, F.y0, F.x1, F.y1)) {
      for (let x = F.x0, k = 0; x < F.x1; x += 130, k++) { g.fillStyle = k % 2 ? '#24492f' : '#28512f'; g.fillRect(x, F.y0, Math.min(130, F.x1 - x), F.y1 - F.y0); }
      g.strokeStyle = '#e8f0e8aa'; g.lineWidth = 7;
      g.strokeRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); g.beginPath(); g.moveTo((F.x0 + F.x1) / 2, F.y0); g.lineTo((F.x0 + F.x1) / 2, F.y1); g.stroke();
      g.beginPath(); g.arc((F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, 160, 0, Math.PI * 2); g.stroke();
      g.strokeRect(F.x1 - 330, 760, 330, 880); g.strokeRect(F.x1 - 140, 900, 140, 600);
    }
    // the dirt path to the front door
    const P = L.PATH; g.fillStyle = '#4a3a2a'; g.beginPath(); g.roundRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 60); g.fill();
    g.strokeStyle = '#3a2c1f'; g.lineWidth = 6; g.beginPath(); g.moveTo(P.x0 + 60, P.y0 + 45); g.lineTo(P.x1 - 40, P.y0 + 45); g.moveTo(P.x0 + 60, P.y1 - 45); g.lineTo(P.x1 - 40, P.y1 - 45); g.stroke();
    // the cabin: its stone footing where the ground falls away, its floors (wood, the kitchen's and bathroom's tiles, the bedrooms' carpet)
    const C = L.CABIN;
    if (see(C.x0, C.y0 - C.wall, C.x1, C.y1 + 90)) {
      g.fillStyle = '#4d5059'; g.fillRect(C.x0, C.y1, C.x1 - C.x0, -L.terrainAt(C.y1) + 2);
      g.fillStyle = '#6e4426'; g.fillRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0);
      g.strokeStyle = '#59361d'; g.lineWidth = 3; g.beginPath();
      for (let y = C.y0 + 40; y < C.y1; y += 40) { g.moveTo(C.x0, y); g.lineTo(C.x1, y); }
      g.stroke();
      const tiles = (x0, y0, x1, y1, c, line, k) => { g.fillStyle = c; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); for (let x = x0; x <= x1; x += k) { g.moveTo(x, y0); g.lineTo(x, y1); } for (let y = y0; y <= y1; y += k) { g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke(); };
      tiles(3500, C.y0, C.x1, 1100, '#7d828e', '#5f636e', 60); tiles(3500, 1100, 3900, 1450, '#5f8496', '#4a6a7a', 40);
      g.fillStyle = '#4a3a5e'; g.fillRect(3900, 1100, 400, 550); g.fillStyle = '#34495e'; g.fillRect(3500, 1650, 800, 550);
    }
    // the deck: its boards, its front face down to the slope, its stairs
    const D = L.DECK, S = L.STAIRS;
    if (see(D.x0, D.y0, S.x1, S.y1 - L.SLOPE.low)) {
      g.fillStyle = '#a85a26'; g.fillRect(D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0); g.fillRect(S.x0, S.y0, S.x1 - S.x0, S.land - S.y0);
      g.strokeStyle = '#7a3f18'; g.lineWidth = 3; g.beginPath(); for (let y = D.y0 + 30; y < D.y1; y += 30) { g.moveTo(D.x0, y); g.lineTo(S.x1, y); } g.stroke();
      const face = -L.terrainAt(D.y1);
      g.fillStyle = '#5e3014'; g.fillRect(D.x0, D.y1, D.x1 - D.x0, face);
      g.fillStyle = '#3e1f0c'; for (let x = D.x0 + 20; x < D.x1; x += 300) g.fillRect(x, D.y1, 34, face);
      g.strokeStyle = '#1c1c28'; g.lineWidth = 4; g.strokeRect(D.x0, D.y1, D.x1 - D.x0, face);
      const n = S.n, dy = (S.y1 - S.land) / n, k = -L.SLOPE.low / n;
      for (let i = 0; i < n; i++) { const y = S.land + i * dy; g.fillStyle = '#6e3a17'; g.fillRect(S.x0, y + k * i, S.x1 - S.x0, k); g.fillStyle = i % 2 ? '#b0632c' : '#a85a26'; g.fillRect(S.x0, y + k * (i + 1), S.x1 - S.x0, dy); }
    }
    // the pool: the rim, the far wall inside, the water (lit from below), its steps, the lane rope, the near rim over the water's edge
    const PL = L.POOL, lo = -L.SLOPE.low, wl = -PL.h;
    if (see(PL.x0 - 40, PL.y0 + lo - 40, PL.x1 + 40, PL.y1 + wl + 40)) {
      g.fillStyle = '#8f97a6'; g.fillRect(PL.x0 - 40, PL.y0 - 40 + lo, PL.x1 - PL.x0 + 80, PL.y1 - PL.y0 + 80);
      g.fillStyle = '#2f6f8a'; g.fillRect(PL.x0, PL.y0 + lo, PL.x1 - PL.x0, wl - lo);
      const wg = g.createLinearGradient(0, PL.y0 + wl, 0, PL.y1 + wl); wg.addColorStop(0, '#1690b8'); wg.addColorStop(1, '#0c5a7a');
      g.fillStyle = wg; g.fillRect(PL.x0, PL.y0 + wl, PL.x1 - PL.x0, PL.y1 - PL.y0);
      g.strokeStyle = '#7fe6ff55'; g.lineWidth = 4; g.beginPath();
      for (let y = PL.y0 + wl + 60; y < PL.y1 + wl - 20; y += 90) for (let x = PL.x0 + 40; x < PL.x1 - 80; x += 260) { const o = Math.sin(now / 900 + x * .01 + y * .02) * 20; g.moveTo(x + o, y); g.quadraticCurveTo(x + 40 + o, y - 10, x + 80 + o, y); }
      g.stroke();
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(190, 210, 225, ${.75 - k * .15})`; g.fillRect(PL.x0 + 40 * k, PL.steps[0] + lo + 10 * (k + 1), 40, PL.steps[1] - PL.steps[0]); }
      g.lineWidth = 5; g.strokeStyle = '#f4f4f0'; g.beginPath(); g.moveTo(PL.rope, PL.y0 + wl); g.lineTo(PL.rope, PL.y1 + wl); g.stroke();
      for (let y = PL.y0 + wl + 14; y < PL.y1 + wl - 40; y += 28) { g.fillStyle = Math.round(y / 28) % 2 ? '#e8463a' : '#f4f4f0'; g.beginPath(); g.ellipse(PL.rope, y, 9, 7, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#8f97a6'; g.fillRect(PL.x0 - 40, PL.y1 + lo, PL.x1 - PL.x0 + 80, 40);
      g.strokeStyle = '#1c1c28'; g.lineWidth = 4; g.strokeRect(PL.x0 - 40, PL.y0 - 40 + lo, PL.x1 - PL.x0 + 80, PL.y1 - PL.y0 + 80);
    }
    // the forest floor darkens toward the world's edge
    for (const [x0, y0, x1, y1, gx0, gy0, gx1, gy1] of [[0, -400, L.W, 420, 0, 420, 0, 0], [0, L.H - 140, L.W, L.H + 700, 0, L.H - 140, 0, L.H - L.SLOPE.low], [-400, -400, 400, L.H + 700, 400, 0, 0, 0], [L.W - 400, -400, L.W + 400, L.H + 700, L.W - 400, 0, L.W, 0]]) {
      if (!see(x0, y0, x1, y1)) continue;
      const fg = g.createLinearGradient(gx0, gy0, gx1, gy1); fg.addColorStop(0, '#08120d00'); fg.addColorStop(1, '#08120dee');
      g.fillStyle = fg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    // night: warm pools of light (the lamps, the windows, the fire, the posts), the pool glowing from under the water
    g.globalCompositeOperation = 'lighter';
    for (const l of L.LIGHTS) {
      if (l.only && (l.only === 'in') !== inside) continue;
      if (l.prop && !lit(l.prop, s)) continue;
      const fl = l.flick ? 1 + Math.sin(now / 130 * l.flick + l.x) * .04 + Math.sin(now / 47 + l.y) * .025 * l.flick : 1;
      const x = l.x, y = l.y - L.heightAt(l.x, l.y), r = l.r * fl;
      if (!see(x - r, y - r, x + r, y + r)) continue;
      const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, hexA(l.c, l.k * fl)); rg.addColorStop(1, hexA(l.c, 0));
      g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    if (see(PL.x0, PL.y0 + wl, PL.x1, PL.y1 + wl)) for (let x = PL.x0 + 225; x < PL.x1; x += 450) for (const y of [PL.y0 + wl + 200, PL.y1 + wl - 200]) {
      const rg = g.createRadialGradient(x, y, 0, x, y, 300); rg.addColorStop(0, '#3ad8ff55'); rg.addColorStop(1, '#3ad8ff00'); g.fillStyle = rg; g.fillRect(x - 300, y - 300, 600, 600);
    }
    g.globalCompositeOperation = 'source-over';
  }
  const hexA = (c, a) => c + Math.round(cl(a, 0, 1) * 255).toString(16).padStart(2, '0');
  const lit = (p, s) => { for (const a of acts()) if (a.light && a.light(p, s) === false) return false; return true; };

  /* ---------- the props ---------- */
  function make(p) {
    const e = document.createElement('div');
    e.className = 'hp hp-' + p.kind; e.dataset.prop = p.id;
    e.style.width = p.box.w + 'px'; e.style.height = p.box.h + 'px';
    e.style.zIndex = p.layer === 'floor' ? 2 : Math.round(p.key) + 10;
    e.innerHTML = (DRAW[p.kind] || (() => ''))(p);
    if (cls.get(p.id)) e.classList.add(...cls.get(p.id).split(' '));
    propsBox.append(e); els.set(p.id, e); return e;
  }
  function drawProps(me, myKey, myBox) {
    const { sc, vw, vh } = cam, scs = sc.toFixed(4);
    for (const p of L.PROPS) {
      if (p.layer === 'none') continue;
      const b = p.box, sx = (b.l - cam.x) * sc + vw / 2, sy = (b.t - cam.y) * sc + vh / 2, sw = b.w * sc, sh = b.h * sc;
      const vis = (!p.only || (p.only === 'in') === inside) && sx < vw + 30 && sx + sw > -30 && sy < vh + 30 && sy + sh > -30;
      let e = els.get(p.id);
      if (!vis) { if (e && !e.hidden) e.hidden = true; continue; }
      if (!e) e = make(p);
      if (e.hidden) e.hidden = false;
      const tr = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${scs})`;
      if (e._tr !== tr) { e._tr = tr; e.style.transform = tr; }
      if (p.fade) { const thru = !!myBox && myKey < p.key && myBox.r > sx + sw * .12 && myBox.l < sx + sw * .88 && myBox.b > sy && myBox.t < sy + sh * (p.kind === 'tree' ? .82 : 1); if (e._thru !== thru) { e._thru = thru; e.classList.toggle('thru', thru); } }
    }
  }

  /* ---------- the context button ---------- */
  function pickButton(me) {
    const pos = { x: me.x * L.W, y: me.y * L.H, z: me.z, inside };
    let best = null;
    for (const a of acts()) { const n = a.near?.(pos, ctx); if (n && n.label && (!best || (n.d ?? 0) < (best.d ?? 0))) best = n; }
    button = best;
    const sig = best ? best.label : '';
    if (sig !== btnSig) { btnSig = sig; api.button(); }
  }

  /* ---------- other ducks in the way (on the ground, at about the same height, on the same side of the walls) ---------- */
  function crowd(x, y, me, now) {
    const r = R(), s = r.state; if (me.j || me.vz != null) return 0;
    const ka = duckRoom((s.players[r.me] || {}).duck), here = L.inCabin(x, y); let d = 0;
    for (const id of s.seat) {
      const p = s.pos[id]; if (id === r.me || !p || (p.j && now < api.landsAt(p))) continue;
      const ox = p.x * L.W, oy = p.y * L.H; if (Math.abs((p.z ?? 0) - me.z) > 40 || L.inCabin(ox, oy) !== here) continue;
      const kb = duckRoom((s.players[id] || {}).duck), dx = (x - ox) / (28 * (ka.x + kb.x)), dy = (y - oy) / (12.8 * (ka.y + kb.y));
      d = Math.max(d, 1 - (dx * dx + dy * dy));
    }
    return d;
  }
  const endJump = me => { me.j = 0; me.lj = false; me.dj = 0; me._za = undefined; };
  /* after a step: up or down a step, landing on what it walked onto, or off an edge (it falls) */
  function ground(me, x, y, ev) {
    const gnd = L.heightAt(x, y);
    if (me.j) { if (me.z < gnd) { ev.land = me.dj ? 2 : 1; endJump(me); me.z = gnd; } return; }
    if (me.vz != null) { if (me.z <= gnd) { ev.thud = Math.max(ev.thud || 0, me.top - gnd); me.z = gnd; me.vz = null; } return; }
    if (gnd >= me.z - L.STEP) me.z = gnd;
    else { me.vz = 0; me.top = me.z; if (me.z - gnd > 100) ev.whee = true; }
  }

  const world = {
    measure() {
      const r = board.getBoundingClientRect(), vw = board.clientWidth, vh = board.clientHeight;
      const across = vw >= 1100 ? 1300 : vw <= 500 ? 520 : 520 + (vw - 500) / 600 * 780;
      cam.sc = Math.min(vw / across, vh / 380) || 1; cam.vw = vw; cam.vh = vh;
      cam.dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(vw * cam.dpr); canvas.height = Math.round(vh * cam.dpr);
      for (const e of els.values()) e._tr = '';
      return { W: vw, H: vh, top0: 0, size: L.DUCK * cam.sc, labelH: 0, left: r.left, top: r.top, hang: true };
    },
    /* a spot (x, y: 0 … 1) on the board, in px: its ground, at the height of whatever is there */
    place(p) { const x = p.x * L.W, y = p.y * L.H; return toScreen(x, y, L.heightAt(x, y)); },
    /* a point on the board (px) → the spot on the ground seen there (the front-most one, where heights overlap) */
    unplace(px, py) {
      const X = (px - cam.vw / 2) / cam.sc + cam.x, Y = (py - cam.vh / 2) / cam.sc + cam.y;
      let y = Y; for (let t = Y + 320; t >= Y - 140; t -= 3) if (t - L.heightAt(X, t) <= Y + 1.5) { y = t; break; }
      return { x: cl(X / L.W, 0, 1), y: cl(y / L.H, 0, 1) };
    },
    /* how far over its ground a duck is drawn (px), its z-index, whether it is on the other side of the walls, where it is drawn */
    lift(id, pos) { const a = at(id, pos); return Math.max(0, a.z - L.heightAt(a.x, a.y)) * cam.sc; },
    key(id, pos) { const a = at(id, pos); return Math.round(L.sortY(a.x, a.y, a.z)) + 10; },
    hidden(id, pos) { const a = at(id, pos); return L.inCabin(a.x, a.y) !== inside; },
    shown(id, pos) { const o = sm.get(id); return o && pos ? { ...pos, x: o.x / L.W, y: o.y / L.H } : pos; },
    /* every frame, before the ducks: the others glide, the camera follows, the ground, the props, the button */
    frame(now) {
      const dt = Math.min(.1, Math.max(0, (now - (last || now)) / 1000)); last = now;
      const r = R(), s = r.state, me = api.me(); if (!me || !cam.vw) return;
      ensure(me);
      inside = L.inCabin(me.x * L.W, me.y * L.H);
      for (const id of s.seat) if (id !== r.me && s.pos[id]) glide(id, s.pos[id], dt, now);
      for (const id of [...sm.keys()]) if (!s.pos[id]) sm.delete(id);
      let shift = 0; for (const a of acts()) shift += a.view?.(ctx) || 0;   // (an activity's panel covers the bottom: my duck shows higher)
      const tx = me.x * L.W, ty = me.y * L.H - (me.j ? me.b : me.z) + shift / cam.sc;
      if (!cam.set) { cam.x = tx; cam.y = ty; cam.set = true; } else { const k = 1 - Math.exp(-dt * 7); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; }
      clampCam();
      for (const a of acts()) a.step?.(dt, now, ctx);
      drawGround(now, s);
      const size = L.DUCK * cam.sc, f = toScreen(tx, me.y * L.H, L.heightAt(tx, me.y * L.H)), lift = Math.max(0, me.z - L.heightAt(tx, me.y * L.H)) * cam.sc;
      drawProps(me, L.sortY(tx, me.y * L.H, me.z), { l: f.left - size * .4, r: f.left + size * .4, t: f.top - lift - size * .9, b: f.top - lift });
      shade.hidden = !inside;
      if (inside) { const a = toScreen(L.CABIN.x0, L.CABIN.y0 - L.CABIN.wall - 30), b = toScreen(L.CABIN.x1, L.CABIN.y1 + 14); Object.assign(shade.style, { left: a.left + 'px', top: a.top + 'px', width: (b.left - a.left) + 'px', height: (b.top - a.top) + 'px' }); }
      for (const a of acts()) a.draw?.(now, ctx);
      pickButton(me);
    },
    /* a new room state: the activities hear it; the props they mark (a lamp switched off) */
    state(s) {
      if (s === seenState) return; seenState = s;
      for (const a of acts()) {
        a.onState?.(s, ctx);
        if (!a.propClass) continue;
        for (const p of L.PROPS) if (!a.kinds || a.kinds.includes(p.kind)) {
          const c = a.propClass(p, s) || '', was = cls.get(p.id) || ''; if (c === was) continue;
          cls.set(p.id, c); const e = els.get(p.id); if (e) { if (was) e.classList.remove(...was.split(' ')); if (c) e.classList.add(...c.split(' ')); }
        }
      }
    },
    /* my duck: walk (ax, ay: −1 … 1, on the screen = in the world), fall, land; returns what happened:
       { moved, q (squashed against: l r u d), land (jumps that just ended), thud (how far it fell), whee (off a high edge) } */
    step(me, ax, ay, sprint, dt, now) {
      ensure(me);
      const ev = { moved: false, q: '', land: 0, thud: 0, whee: false };
      let x = me.x * L.W, y = me.y * L.H;
      const holder = [...acts()].find(a => a.hold?.(ctx));
      if (holder) {   // seated or playing: a direction goes to the activity (once a press)
        const k = ax || ay ? (Math.abs(ax) >= Math.abs(ay) ? [Math.sign(ax), 0] : [0, Math.sign(ay)]) : null, sig = k ? k.join() : '';
        if (k && sig !== pushed) holder.push?.(k[0], k[1], ctx);
        pushed = sig; ax = ay = 0;
        x = me.x * L.W; y = me.y * L.H;   // (it may have moved my duck)
      } else pushed = '';
      if (me.j !== me._j) { me._j = me.j; me._za = undefined; if (me.j) me.vz = null; }
      const cfg = api.cfg(), Hpx = cfg.H * L.DUCK, G = 8 * Hpx / (cfg.T * cfg.T);
      if (me.j) {   // a jump's arc, from where it began; it lands early on anything high enough, or falls on past its end
        const za = me.b + api.jumpZ(me, now) * L.DUCK, gnd = L.heightAt(x, y);
        if (now >= api.landsAt(me)) { ev.land = me.dj ? 2 : 1; endJump(me); me._j = 0; if (me.b - gnd > L.STEP) { me.z = me.b; me.vz = -4 * Hpx / cfg.T; me.top = me.z; } else me.z = gnd; }
        else if (za <= gnd && za < (me._za ?? Infinity)) { ev.land = me.dj ? 2 : 1; endJump(me); me._j = 0; me.z = gnd; }
        else { me.z = Math.max(za, gnd); me._za = za; }
      } else if (me.vz != null) {   // falling
        me.vz -= G * dt; me.z += me.vz * dt;
        const gnd = L.heightAt(x, y); if (me.z <= gnd) { ev.thud = me.top - gnd; me.z = gnd; me.vz = null; }
      }
      const n0 = Math.hypot(ax, ay); if (n0 > 1) { ax /= n0; ay /= n0; }
      if (ax || ay) {
        const sp = SPEED * (sprint ? SPRINT : 1), dx = ax * sp * dt, dy = ay * sp * dt, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8)), sx = dx / n, sy = dy / n;
        for (let i = 0; i < n; i++) {
          const up = me.j || me.vz != null ? AIR_UP : L.STEP, here = crowd(x, y, me, now);
          const ok = (tx, ty) => { if (!L.standable(tx, ty, me.z, up, [x, y])) return false; const c = crowd(tx, ty, me, now); return !(c > 0 && c > here - 1e-6); };
          if (ok(x + sx, y + sy)) { x += sx; y += sy; }
          else if (sx && ok(x + sx, y)) { x += sx; ev.q = ev.q || dirOf(0, sy); }
          else if (sy && ok(x, y + sy)) { y += sy; ev.q = ev.q || dirOf(sx, 0); }
          else { ev.q = ev.q || dirOf(sx, sy); break; }
          ev.moved = true;
          ground(me, x, y, ev);
        }
      }
      ground(me, x, y, ev);
      me.x = x / L.W; me.y = y / L.H;
      return ev;
    },
    /* the way to a spot (a click or a tap): { ax, ay, d } in world px */
    aim(me, t) { const dx = (t.x - me.x) * L.W, dy = (t.y - me.y) * L.H, d = Math.hypot(dx, dy); return { ax: d ? dx / d : 0, ay: d ? dy / d : 0, d }; },
    /* Space: an activity may take it (a jump gets up); no jumping while falling */
    canJump(me) { for (const a of acts()) if (a.jump?.(ctx)) return false; ensure(me); return !!me.j || me.vz == null; },
    started(me) { ensure(me); me.b = me.z; me.vz = null; me._za = undefined; },
    keydown(e) { for (const a of acts()) if (a.keydown?.(e, ctx)) return true; return false; },
    keyup(e) { for (const a of acts()) if (a.keyup?.(e, ctx)) return true; return false; },
    /* a pointer an activity took (drawing with the chalk): no walking or joystick meanwhile */
    grabbing: () => !!grab || performance.now() - grabEnd < 350,
    /* the context button, in the place of the Vote / End turn button (kept in its place, unseen, when nothing is near) */
    buttonHTML() {
      return button ? `<div class="act-row"><button type="button" class="btn hang-btn" data-a="hang">${esc(button.label)} <kbd>Enter</kbd></button></div>`
        : '<div class="act-row"><button type="button" class="btn hang-btn idle" tabindex="-1" aria-hidden="true" disabled>Sit <kbd>Enter</kbd></button></div>';
    },
    press() { if (button && button.act) button.act(); },
    /* where someone lands, for reset duck */
    spawn() { const p = L.spawnAt(Math.floor(Math.random() * 12)); return { x: p.x / L.W, y: p.y / L.H, z: L.heightAt(p.x, p.y) }; },
    destroy() {
      for (const a of acts()) a.unmount?.(ctx);
      board.removeEventListener('pointerdown', down); board.removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      els.clear(); sm.clear();
    },
  };
  /* pointers on the board go to an activity first (drawing on the chalk floor) */
  const pt = e => { const r = board.getBoundingClientRect(), u = world.unplace(e.clientX - r.left, e.clientY - r.top); return { x: u.x * L.W, y: u.y * L.H }; };
  function down(e) { for (const a of acts()) if (a.pointer?.('down', pt(e), e, ctx)) { grab = a; e.stopPropagation(); return; } }
  function move(e) { if (grab) grab.pointer('move', pt(e), e, ctx); }
  function up(e) { if (!grab) return; grab.pointer('up', pt(e), e, ctx); grab = null; grabEnd = performance.now(); }
  board.addEventListener('pointerdown', down); board.addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  return world;
}
