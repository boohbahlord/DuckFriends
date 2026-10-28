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
import { DRAW, GROUND, DECOR, groundColor } from './shapes.js';
import { svgDataURL, useHangArtCSS } from './art.js';
import { stutterOf, lightNow } from './flicker.js';
import { ACTS } from './registry.js';
import './activities.js';
import { duckRoom } from '../duck.js';
import { esc } from '../ui.js';
import { low } from '../gfx.js';

export const BOARD_HTML = '<div class="board hang-board"><canvas class="hang-ground" aria-hidden="true"></canvas><div class="hang-props"></div><div class="ducks"></div><div class="hang-shade" hidden></div><div class="fxl"></div></div>';
const SPEED = 380, SPRINT = 1.75;   // world px a second
const AIR_UP = 6;                    // in the air, ground this much above the feet still catches them
const CLICK_REACH = 260;             // Click to interact: how far from my duck a click can use a thing
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const dirOf = (dx, dy) => dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u';

/* api: room() → the room; me() → my duck { x, y (0 … 1), j, lj, dj, z, b … }; jumpZ(pos, now) (duck heights); landsAt(pos);
   cfg() → the jump's { T, H }; button() → the context button changed (redraw it); clickUse() → a click on a thing near
   my duck uses it (the Click to interact setting) */
export function mountWorld(board, api) {
  const canvas = board.querySelector('.hang-ground'), g = canvas.getContext('2d'), propsBox = board.querySelector('.hang-props'), shade = board.querySelector('.hang-shade');
  const cam = { x: 0, y: 0, sc: 1, vw: 0, vh: 0, dpr: 1, set: false };
  const els = new Map();     // prop id → its element (the front or only part; made the first time it comes into view)
  const all = new Map();     // prop id → all its parts' elements
  const cls = new Map();     // prop id → the class its activity gives it
  const sm = new Map();      // other ducks as drawn: { x, y, z } in world px, gliding after the room's numbers
  let dead = false, last = 0, inside = false, flip = -1e9, shut = false, button = null, btnSig = null, pushed = '', grab = null, grabEnd = 0, seenState = null;
  const R = () => api.room();
  /* inside, everything round the cabin goes black (the shade): once it's up, nothing out there is drawn at all. Walking
     out, the black fades away */
  const HOLE = { l: L.CABIN.x0, t: L.CABIN.y0 - L.CABIN.wall - 30, r: L.CABIN.x1, b: L.CABIN.y1 + 14 }, SHADE_IN = 350, SHADE_OUT = 700;
  const outOfHole = (l, t, r, b) => r < HOLE.l || l > HOLE.r || b < HOLE.t || t > HOLE.b;
  const toScreen = (x, y, h = 0) => ({ left: (x - cam.x) * cam.sc + cam.vw / 2, top: (y - h - cam.y) * cam.sc + cam.vh / 2 });
  const ctx = { state: () => R().state, get me() { return R().me; }, send: a => R().send(a), duck: () => api.me(),
    world: { toScreen, heightAt: L.heightAt, get sc() { return cam.sc; }, get vw() { return cam.vw; }, get vh() { return cam.vh; }, get inside() { return inside; }, board, seen: (l, t, w, h) => l < cam.vw + NEAR && l + w > -NEAR && t < cam.vh + NEAR && t + h > -NEAR, propEl: id => els.get(id) || null, propEls: id => all.get(id) || [], shines: l => shines(l, R().state),
      at: id => { const p = R().state.pos[id]; return p || mine(id) ? at(id, p || {}) : null; } } };
  useHangArtCSS();
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

  /* ---------- the ground: art.js's flat pieces (shapes.js GROUND), painted once into tiles, then the night's light ----------
     A tile is TILE screen-world px square, painted at the board's resolution (at most 1.5 px a world px on a phone, 2 on
     a computer) from one SVG of the pieces it touches; a few at a time, nearest first, the ones around the view too. Until
     a tile is ready its ground's plain color stands in. A decoded tile is copied into its canvas at most three a frame (one
     when none in view is missing), so walking on never stutters. The canvas reaches EDGE px past the view on every side:
     it is drawn again (the tiles, then the warm pools of light) only when something on it changed (a tile came, a lamp
     stuttered or went out, the view got bigger) or the camera went near its edge; in between it only slides, which costs
     nothing, so a weak laptop isn't painting the whole ground sixty times a second. The pools keep still (the dark over
     them, power.js, sways with the flames: that's the flicker you see). */
  const TILE = 256, MAXT = 90, EDGE = 96;
  const tiles = new Map(), ready = []; let tk = 0, busy = 0, fno = 0;
  const gv = { x: 0, y: 0, r: [0, 0, 0, 0], dirty: [], shut: false, sig: '', need: true, tr: '' };   // where the ground was last drawn from (and the world it covers), its lights then, and if it must be drawn again
  const pieces = GROUND();
  function paintTile(t) {
    busy++; t.queued = true;
    const x = t.i * TILE, y = t.j * TILE, px = Math.ceil(TILE * tk), k = tk;
    let body = '';
    for (const p of pieces) if (p.x < x + TILE && p.x + p.w > x && p.y < y + TILE && p.y + p.h > y) body += p.raw || `<g transform="translate(${p.x} ${p.y})">${p.svg}</g>`;
    const url = URL.createObjectURL(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${TILE} ${TILE}" width="${px}" height="${px}">${body}</svg>`], { type: 'image/svg+xml' }));
    const img = new Image(); img.src = url;
    const done = () => { URL.revokeObjectURL(url); busy--; };
    img.decode().then(() => { done(); if (k === tk && !dead) ready.push([t, img, px]); else t.queued = false; }, () => { done(); t.queued = false; });
  }
  function copyTile([t, img, px]) { const c = document.createElement('canvas'); c.width = c.height = px; c.getContext('2d').drawImage(img, 0, 0, px, px); t.c = c; t.old = null;
    /* drawn again at once if it's in view; on the canvas' edge only once the view slides onto it (a tile a frame coming
       in round the view doesn't draw the whole ground each time) */
    const x0 = t.i * TILE, y0 = t.j * TILE, x1 = x0 + TILE, y1 = y0 + TILE, [r0, s0, r1, s1] = gv.r;
    if (x1 <= r0 || x0 >= r1 || y1 <= s0 || y0 >= s1 || (gv.shut && outOfHole(x0, y0, x1, y1))) return;
    if (inView(x0, y0, x1, y1)) gv.need = true; else gv.dirty.push([x0, y0, x1, y1]);
  }
  const inView = (x0, y0, x1, y1) => { const hw = cam.vw / 2 / cam.sc, hh = cam.vh / 2 / cam.sc; return x1 > cam.x - hw && x0 < cam.x + hw && y1 > cam.y - hh && y0 < cam.y + hh; };
  function drawGround(now, s, gx, gy) {   // (gx, gy: where the camera is heading, my duck: its tiles come first)
    const { sc, vw, vh, dpr } = cam; fno++;
    const hw = vw / 2 / sc, hh = vh / 2 / sc, vx0 = cam.x - hw, vx1 = cam.x + hw, vy0 = cam.y - hh, vy1 = cam.y + hh, e = EDGE / sc;
    const tile = (i, j) => { const id = i + ',' + j; let t = tiles.get(id); if (!t) { t = { i, j, c: null, old: null, queued: false, used: 0 }; tiles.set(id, t); } t.used = fno; return t; };
    const near = t => Math.hypot((t.i + .5) * TILE - gx, (t.j + .5) * TILE - gy), want = [];
    const span = (x0, x1, y0, y1, pri) => { for (let j = Math.floor(y0 / TILE); j <= Math.floor(y1 / TILE); j++) for (let i = Math.floor(x0 / TILE); i <= Math.floor(x1 / TILE); i++) { const t = tile(i, j); if (!t.c && !t.queued) want.push([pri, near(t), t]); } };
    span(gx - hw, gx + hw, gy - hh, gy + hh, 0); span(vx0, vx1, vy0, vy1, 1); span(vx0 - TILE, vx1 + TILE, vy0 - TILE, vy1 + TILE, 2);
    let missing = false;
    for (let j = Math.floor(vy0 / TILE); j <= Math.floor(vy1 / TILE); j++) for (let i = Math.floor(vx0 / TILE); i <= Math.floor(vx1 / TILE); i++) if (!tile(i, j).c) missing = true;
    if (ready.length) { ready.sort((a, b) => near(a[0]) - near(b[0])); for (let n = missing ? 3 : 1; n > 0 && ready.length; n--) copyTile(ready.shift()); }
    want.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const [, , t] of want) { if (busy >= 4) break; if (!t.queued) paintTile(t); }
    if (tiles.size > MAXT) for (const [id, t] of [...tiles].sort((a, b) => a[1].used - b[1].used)) { if (tiles.size <= MAXT * .8 || t.used === fno) break; tiles.delete(id); }
    // night: warm pools of light (the lamps, the windows, the fire, the posts), on the canvas' whole reach
    const see = (x0, y0, x1, y1) => x1 > vx0 - e && x0 < vx1 + e && y1 > vy0 - e && y0 < vy1 + e, pools = [], ln = lightNow(now);
    for (const l of L.LIGHTS) {
      if (l.only && (l.only === 'in') !== inside) continue;
      if (!shines(l, s)) continue;
      const x = l.x, y = l.y - L.heightAt(l.x, l.y) - (l.z || 0), r = l.r;
      if (see(x - r, y - r, x + r, y + r) && !(shut && outOfHole(x - r, y - r, x + r, y + r))) pools.push([x, y, r, l.c, l.k * stutterOf(l, ln)]);   // (now and then a lamp stutters: flicker.js)
    }
    const sig = pools.map(p => p[2].toFixed(1) + p[4].toFixed(3)).join();
    const ox = (gv.x - cam.x) * sc, oy = (gv.y - cam.y) * sc;
    if (gv.shut !== shut || gv.dirty.some(d => inView(...d))) gv.need = true;
    if (!gv.need && sig === gv.sig && Math.abs(ox) < EDGE - 2 && Math.abs(oy) < EDGE - 2) {   // only slid
      const tr = `translate(${Math.round(ox * dpr) / dpr}px, ${Math.round(oy * dpr) / dpr}px)`;
      if (gv.tr !== tr) { gv.tr = tr; canvas.style.transform = tr; }
      return;
    }
    gv.x = cam.x; gv.y = cam.y; gv.r = [vx0 - e, vy0 - e, vx1 + e, vy1 + e]; gv.dirty = []; gv.shut = shut; gv.sig = sig; gv.need = false; if (gv.tr) { gv.tr = ''; canvas.style.transform = ''; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
    const DX = x => Math.round(((x - cam.x) * sc + vw / 2 + EDGE) * dpr), DY = y => Math.round(((y - cam.y) * sc + vh / 2 + EDGE) * dpr);
    for (let j = Math.floor((vy0 - e) / TILE); j <= Math.floor((vy1 + e) / TILE); j++) for (let i = Math.floor((vx0 - e) / TILE); i <= Math.floor((vx1 + e) / TILE); i++) {
      if (shut && outOfHole(i * TILE, j * TILE, (i + 1) * TILE, (j + 1) * TILE)) continue;   // (under the black)
      const t = tile(i, j), x0 = DX(i * TILE), x1 = DX((i + 1) * TILE), y0 = DY(j * TILE), y1 = DY((j + 1) * TILE), c = t.c || t.old;
      if (c) g.drawImage(c, x0, y0, x1 - x0, y1 - y0);   // (t.old: the tile at the size it had, until it's painted again at the new one)
      else { g.fillStyle = groundColor((j + .5) * TILE); g.fillRect(x0, y0, x1 - x0, y1 - y0); }
    }
    g.setTransform(sc * dpr, 0, 0, sc * dpr, (vw / 2 + EDGE - cam.x * sc) * dpr, (vh / 2 + EDGE - cam.y * sc) * dpr);
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, c, k] of pools) {
      const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, hexA(c, k)); rg.addColorStop(1, hexA(c, 0));
      g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.globalCompositeOperation = 'source-over';
  }
  const hexA = (c, a) => c + Math.round(cl(a, 0, 1) * 255).toString(16).padStart(2, '0');
  const shines = (l, s) => { for (const a of acts()) if (a.light && a.light(l.prop, s, l) === false) return false; return true; };

  /* ---------- the props: each part of each prop (shapes.js DRAW), and the decor, as an element sorted with the ducks ----------
     Made the first time it comes near the view, then only moved (each is its own layer: moving it is cheap), hidden
     when far. Its z-index is its foot's (key): a duck in front of it covers it, one behind it is covered. */
  const items = [];
  for (const p of L.PROPS) {
    if (p.layer === 'none') continue;
    let parts = DRAW[p.kind] ? DRAW[p.kind](p) : [];
    if (typeof parts === 'string') { const svg = parts; parts = [{ svg, box: p.box, key: p.key, layer: p.layer, fade: p.fade }]; }
    for (const pt of parts) items.push({ ...pt, p, only: pt.only || p.only });
  }
  for (const d of DECOR()) items.push({ ...d, p: null });
  const NEAR = 160;   // (px past the view's edge: made and shown a little before it comes into view)
  function make(it) {
    const e = document.createElement('div'), p = it.p, b = it.box;
    e.className = 'hp hp-' + (p ? p.kind : 'decor') + (it.cls ? ' ' + it.cls : '');
    if (p) { e.dataset.prop = p.id; if (it.part) e.dataset.part = it.part; }
    e.style.width = b.w + 'px'; e.style.height = b.h + 'px';
    e.style.zIndex = it.layer === 'floor' ? 2 : Math.round(it.key) + 10;
    if (it.style) e.style.cssText += it.style;
    const svg = typeof it.svg === 'function' ? it.svg() : it.svg;
    if (it.img) { const im = new Image(); im.alt = ''; im.draggable = false; im.src = it.url ? svg : svgDataURL(svg); e.append(im); }
    else e.innerHTML = svg;
    if (p) {
      if (cls.get(p.id)) e.classList.add(...cls.get(p.id).split(' '));
      if (!els.has(p.id) || it.part !== 'back') els.set(p.id, e);
      if (!all.has(p.id)) all.set(p.id, []); all.get(p.id).push(e);
    }
    propsBox.append(e); it.el = e; return e;
  }
  /* every duck on my side of the walls: its box on the screen and its depth (a wall or a tree turns see-through only
     while it hides one: a duck behind it with a good part of it covered) */
  function duckBoxes(s) {
    const size = L.DUCK * cam.sc, out = [];
    for (const id of s.seat) {
      if (!s.pos[id] && !mine(id)) continue;
      const a = at(id, s.pos[id]); if (L.inCabin(a.x, a.y) !== inside) continue;
      const g = L.heightAt(a.x, a.y), f = toScreen(a.x, a.y, g), lift = Math.max(0, a.z - g) * cam.sc;
      out.push({ key: L.sortY(a.x, a.y, a.z), l: f.left - size * .4, r: f.left + size * .4, t: f.top - lift - size * .9, b: f.top - lift });
    }
    return out;
  }
  const HIDDEN = .3;   // this much of a duck's box covered: hidden
  function drawProps(ducks) {
    const { sc, vw, vh } = cam, scs = sc.toFixed(4);
    for (const it of items) {
      const b = it.box, sx = (b.l - cam.x) * sc + vw / 2, sy = (b.t - cam.y) * sc + vh / 2, sw = b.w * sc, sh = b.h * sc;
      const vis = (!it.only || (it.only === 'in') === inside) && sx < vw + NEAR && sx + sw > -NEAR && sy < vh + NEAR && sy + sh > -NEAR && !(shut && outOfHole(b.l, b.t, b.l + b.w, b.t + b.h));
      let e = it.el;
      if (!vis) { if (e && !e.hidden) e.hidden = true; continue; }
      if (!e) e = make(it);
      if (e.hidden) e.hidden = false;
      const tr = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${scs})`;
      if (e._tr !== tr) { e._tr = tr; e.style.transform = tr; }
      if (it.fade) {
        const h = it.hit || { l: b.l, t: b.t, r: b.l + b.w, b: b.t + b.h }, hl = (h.l - cam.x) * sc + vw / 2, hr = (h.r - cam.x) * sc + vw / 2, ht = (h.t - cam.y) * sc + vh / 2, hb = (h.b - cam.y) * sc + vh / 2;
        const thru = ducks.some(d => d.key < it.key && (Math.min(d.r, hr) - Math.max(d.l, hl)) * (Math.min(d.b, hb) - Math.max(d.t, ht)) > HIDDEN * (d.r - d.l) * (d.b - d.t) && d.r > hl && d.l < hr && d.b > ht && d.t < hb);
        if (e._thru !== thru) { e._thru = thru; e.classList.toggle('thru', thru); }
      }
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
      cam.low = low(); cam.dpr = Math.min(2, devicePixelRatio || 1) * (cam.low ? .5 : 1);   // (Low graphics: the ground at half its sharpness)
      const cw = Math.round((vw + 2 * EDGE) * cam.dpr), ch = Math.round((vh + 2 * EDGE) * cam.dpr);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; Object.assign(canvas.style, { left: -EDGE + 'px', top: -EDGE + 'px', width: vw + 2 * EDGE + 'px', height: vh + 2 * EDGE + 'px' }); }
      gv.need = true;
      /* the ground's tiles at a new size: only when it needs them sharper. Smaller (the Chat opened and the board got
         narrower), the sharper ones it has are kept, so nothing pops in; sharper, each one is shown stretched until it's
         painted again */
      const k = Math.max(.25, Math.min(vw <= 500 ? 1.5 : 2, Math.round(cam.sc * cam.dpr * 4) / 4));
      if (k > tk) { tk = k; ready.length = 0; for (const t of tiles.values()) if (t.c) { t.old = t.c; t.c = null; t.queued = false; } }
      for (const e of els.values()) e._tr = '';
      return { W: vw, H: vh, top0: 0, size: L.DUCK * cam.sc, labelH: 0, left: r.left, top: r.top, hang: true };
    },
    /* a spot (x, y: 0 … 1) on the board, in px: its ground, at the height of whatever is there (or at height h) */
    place(p, h) { const x = p.x * L.W, y = p.y * L.H; return toScreen(x, y, h ?? L.heightAt(x, y)); },
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
    /* the way an activity turns a duck (seated: toward what it sits at), or 0 */
    face(id) { for (const a of acts()) { const f = a.face?.(id, ctx); if (f) return f; } return 0; },
    shown(id, pos) { const o = sm.get(id); return o && pos ? { ...pos, x: o.x / L.W, y: o.y / L.H } : pos; },
    /* every frame, before the ducks: the others glide, the camera follows, the ground, the props, the button */
    frame(now) {
      const dt = Math.min(.1, Math.max(0, (now - (last || now)) / 1000)); last = now;
      const r = R(), s = r.state, me = api.me(); if (!me || !cam.vw) return;
      if (cam.low !== low()) world.measure();   // (Graphics changed in Settings)
      ensure(me);
      const was = inside; inside = L.inCabin(me.x * L.W, me.y * L.H); if (inside !== was) flip = now;
      shut = inside && now - flip > SHADE_IN;
      for (const id of s.seat) if (id !== r.me && s.pos[id]) glide(id, s.pos[id], dt, now);
      for (const id of [...sm.keys()]) if (!s.pos[id]) sm.delete(id);
      let shift = 0, f = null; for (const a of acts()) shift += a.view?.(ctx) || 0;   // (an activity's panel covers the bottom: my duck shows higher)
      for (const a of acts()) if ((f = a.focus?.(ctx))) break;   // (or the camera looks somewhere else: the blackjack table while I sit at it)
      const tx = f ? f.x : me.x * L.W, ty = f ? f.y : me.y * L.H - (me.j ? me.b : me.z) + shift / cam.sc;
      if (!cam.set) { cam.x = tx; cam.y = ty; cam.set = true; } else { const k = 1 - Math.exp(-dt * 7); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; }
      clampCam();
      for (const a of acts()) a.step?.(dt, now, ctx);
      drawGround(now, s, tx, ty);
      drawProps(duckBoxes(s));
      const show = inside || now - flip < SHADE_OUT;
      if (shade.hidden === show) { shade.hidden = !show; if (show) shade._at = now; }
      if (show) {   // (the shade only slides: its size changes only with the board's, so its big shadow is never painted again)
        const a = toScreen(HOLE.l, HOLE.t), b = toScreen(HOLE.r, HOLE.b), sz = (b.left - a.left).toFixed(1) + 'px', tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px)`;
        if (shade._sz !== sz) { shade._sz = sz; shade.style.width = sz; shade.style.height = (b.top - a.top).toFixed(1) + 'px'; }
        if (shade._tr !== tr) { shade._tr = tr; shade.style.transform = tr; }
        const on = inside && now - shade._at > 30; if (shade._on !== on) { shade._on = on; shade.classList.toggle('on', on); }   // (it fades in, and out)
      }
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
          cls.set(p.id, c); for (const e of all.get(p.id) || []) { if (was) e.classList.remove(...was.split(' ')); if (c) e.classList.add(...c.split(' ')); }
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
        const hz = holder.heldZ?.(ctx); if (hz != null) { me.z = me.b = hz; me.vz = null; me.j = 0; return ev; }   // (seated: at the seat's height, no falling)
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
        let k = 1; for (const a of acts()) if (a.speed) k *= a.speed({ x, y, z: me.z }, ctx) ?? 1;   // (the water slows it)
        const sp = SPEED * (sprint ? SPRINT : 1) * k, dx = ax * sp * dt, dy = ay * sp * dt, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8)), sx = dx / n, sy = dy / n;
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
      for (const a of acts()) a.after?.(me, ev, now, ctx);   // (the trampoline: the next bounce)
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
      return button ? `<div class="act-row"><button type="button" class="btn hang-btn" data-a="hang">${esc(button.label)} <kbd>E</kbd></button></div>`
        : '<div class="act-row"><button type="button" class="btn hang-btn idle" tabindex="-1" aria-hidden="true" disabled>Sit <kbd>E</kbd></button></div>';
    },
    press() { if (button && button.act) button.act(); },
    /* where someone lands, for reset duck */
    spawn() { const p = L.spawnAt(Math.floor(Math.random() * 12)); return { x: p.x / L.W, y: p.y / L.H, z: L.heightAt(p.x, p.y) }; },
    destroy() {
      for (const a of acts()) a.unmount?.(ctx);
      board.removeEventListener('pointerdown', down); board.removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      dead = true; els.clear(); all.clear(); sm.clear(); tiles.clear(); ready.length = 0;
    },
  };
  /* pointers on the board go to an activity first (drawing on the chalk floor) */
  const pt = e => { const r = board.getBoundingClientRect(), u = world.unplace(e.clientX - r.left, e.clientY - r.top); return { x: u.x * L.W, y: u.y * L.H }; };
  function down(e) {
    for (const a of acts()) if (a.pointer?.('down', pt(e), e, ctx)) { grab = a; e.stopPropagation(); return; }
    if (api.clickUse?.()) {   // Click to interact: what the button would offer standing at the click, if my duck is near it
      const me = api.me(), p = pt(e); if (!me || Math.hypot(p.x - me.x * L.W, p.y - me.y * L.H) > CLICK_REACH) return;
      let best = null;
      for (const a of acts()) { const n = a.near?.({ x: p.x, y: p.y, z: me.z, inside }, ctx); if (n && n.label && n.act && (!best || (n.d ?? 0) < (best.d ?? 0))) best = n; }
      if (best) { best.act(); grabEnd = performance.now(); e.stopPropagation(); }   // (no walking to the click)
    }
  }
  function move(e) { if (grab) grab.pointer('move', pt(e), e, ctx); }
  function up(e) { if (!grab) return; grab.pointer('up', pt(e), e, ctx); grab = null; grabEnd = performance.now(); }
  board.addEventListener('pointerdown', down); board.addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  return world;
}
