/* ---------- the piano in the cabin (Hangout) ----------
   The floor piano: big keys on the floor in front of the piano (two octaves, C4 … B5). A duck walking onto a key (or
   landing on one from a jump) plays its note for everyone, and the key lights in the interval color; standing still
   doesn't play it again, stepping off lets it ring out.
   Play: near the piano the context button says "Play". Pressing it seats my duck at the first free spot on the bench in
   front of the keyboard (six spots, from the middle out; the host decides who sits where, in s.hang.piano) and opens
   keyboard mode (pianokeys.js) over the bottom of the screen (on a phone held upright, the lower part of the screen, in
   four rows). Seated, my duck can't walk; the button says "Get up", and Get up, Escape, Enter or a jump (a tap on the
   board on a phone) stands it up.
   Notes: mine go to the room in little batches (one every 110 ms at most while playing, each note with its time in the
   batch, so a quick run keeps its rhythm on the other screens); every other screen plays them (pianokeys' play() when
   its own keyboard is open, else noteOn), lights them on the big piano everyone sees, with the interval colors, and
   writes them on the music sheet column above it. The batches live in s.pn (outside s.hang, so a note never sends the
   rest of the cabin again), for a few seconds.
   Music: while anyone is seated at the piano the room's music fades away on every screen and the music bar says
   "Piano"; 10 seconds after the last one gets up (s.hang.piano.back) it fades back in, where the room's song is by now. */
import { rule, activity } from './registry.js';
import { PROPS, W, H, heightAt, inCabin } from './layout.js';
import { mountPianoKeys, noteOn, noteOff, allNotesOff, makeTracker, sheetHTML, drawSheet, LOW } from './pianokeys.js';
import { floorPiano, pianoBody, staffColumn, useHangArtCSS } from './art.js';
import { music } from '../music.js';
import { now as clockNow } from '../clock.js';
import { profile } from '../store.js';

const BODY = PROPS.find(p => p.kind === 'piano'), FLOOR = PROPS.find(p => p.kind === 'pianokeys'), SHEET = PROPS.find(p => p.kind === 'sheet');
const WHITE = [0, 2, 4, 5, 7, 9, 11], BLACK = [[0, 1], [1, 3], [3, 6], [4, 8], [5, 10]];   // black keys: [after white key k, pitch class]
const BACK_MS = 10000;   // the music comes back this long after the last player gets up
const BATCH_MS = 110;    // my notes wait this long at most before they go to the room
const KEEP_MS = 4000;    // the room keeps a batch of notes this long
const COARSE = matchMedia('(hover: none) and (pointer: coarse)').matches;

/* ---------- the floor piano's keys (the same shapes as art.js' floorPiano draws) ---------- */
const FLO = 60, OCT = 2;   // C4, two octaves
const FK = (() => {
  const n = OCT * 7, x0 = 14, y0 = 26, kw = (FLOOR.w - 2 * x0) / n, kh = FLOOR.d - y0 - 14, keys = [];
  for (let i = 0; i < n; i++) keys.push({ id: 'w' + i, midi: FLO + 12 * Math.floor(i / 7) + WHITE[i % 7], x0: x0 + i * kw, x1: x0 + (i + 1) * kw, y0, y1: y0 + kh });
  let bi = 0;
  for (let o = 0; o < OCT; o++) for (const [k, pc] of BLACK) {
    const x = x0 + (o * 7 + k + 1) * kw - kw * .31;
    keys.push({ id: 'b' + bi++, midi: FLO + 12 * o + pc, x0: x, x1: x + kw * .62, y0, y1: y0 + kh * .58, black: true });
  }
  return keys;
})();
/* the key under a duck's feet (world px), or null */
function floorKeyAt(x, y) {
  const lx = x - FLOOR.x, ly = y - FLOOR.y;
  return FK.find(k => k.black && lx >= k.x0 && lx < k.x1 && ly >= k.y0 && ly < k.y1) || FK.find(k => !k.black && lx >= k.x0 && lx < k.x1 && ly >= k.y0 && ly < k.y1) || null;
}
const nearFloor = (x, y, m = 0) => x >= FLOOR.x - m && x <= FLOOR.x + FLOOR.w + m && y >= FLOOR.y - m && y <= FLOOR.y + FLOOR.d + m;

/* ---------- the bench: six spots in front of the keyboard, the middle ones first ---------- */
const SPOTS = [2, 3, 1, 4, 0, 5].map(i => ({ x: BODY.x + BODY.w / 12 * (2 * i + 1), y: BODY.y + BODY.d + 26 }));
/* where the Play button shows: in front of the piano, on and around its floor keys */
const inZone = (x, y, m = 0) => x >= BODY.x - 70 - m && x <= BODY.x + BODY.w + 70 + m && y >= BODY.y + BODY.d - m && y <= FLOOR.y + FLOOR.d + 40 + m;
const pianoOf = s => (s && s.hang && s.hang.piano) || { seats: {}, back: 0 };
const freeSpot = s => { const taken = new Set(Object.values(pianoOf(s).seats).map(v => v.k)); return SPOTS.findIndex((_, k) => !taken.has(k)); };
const hushed = (s, t) => { const P = pianoOf(s); return Object.keys(P.seats).length > 0 || t < (P.back || 0); };

/* ---------- the rules (the host) ---------- */
const int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
rule('piano', {
  init: () => ({ piano: { seats: {}, back: 0 } }),   // seats: player id → { k: its spot, at }; back: when the music comes back
  act(s, a, now) {
    const P = s.hang.piano || (s.hang.piano = { seats: {}, back: 0 }), me = s.pos[a.id]; if (!me) return false;
    const x = me.x * W, y = me.y * H;
    if (a.w === 'sit') {   // Play: the first free spot (from beside the piano)
      if (P.seats[a.id] || !inZone(x, y, 160)) return false;
      const k = freeSpot(s); if (k < 0) return false;
      P.seats[a.id] = { k, at: now };
      s.pos[a.id] = { x: +(SPOTS[k].x / W).toFixed(5), y: +(SPOTS[k].y / H).toFixed(5), j: 0, q: '', sp: false, z: 0, b: 0 };
      return true;
    }
    if (a.w === 'up') return up(s, a.id, now);
    if (a.w === 'n') {   // a batch of notes: [ms into the batch, midi, 1 on / 0 off, '#' | 'b' | '', 1 on the floor]
      if (!Array.isArray(a.ev) || !a.ev.length || a.ev.length > 64 || !Number.isFinite(a.t0)) return false;
      const ev = [];
      for (const e of a.ev) {
        if (!Array.isArray(e) || !int(e[0], 0, 3000) || !int(e[1], 21, 108) || ![0, 1].includes(e[2])) continue;
        const f = e[4] === 1 ? 1 : 0;
        if (f ? !nearFloor(x, y, 220) : !P.seats[a.id]) continue;   // floor notes from on (or by) the floor keys, the keyboard's from the bench
        ev.push([e[0], e[1], e[2], ['#', 'b'].includes(e[3]) ? e[3] : '', f]);
      }
      if (!ev.length) return false;
      const pn = s.pn || { n: 0, b: [] }, n = (pn.n || 0) + 1;
      s.pn = { n, b: [...(pn.b || []).filter(b => now - b.at < KEEP_MS).slice(-23), { i: n, by: a.id, t0: Math.round(a.t0), at: now, ev }] };
      return true;
    }
    return false;
  },
  tick(s, now) {
    let ch = false;
    const P = s.hang.piano;
    if (P) for (const [id, v] of Object.entries(P.seats)) {   // someone gone, or walked off (reset duck): their spot is free
      const p = s.pos[id], sp = SPOTS[v.k];
      if (!p || !sp || (now - v.at > 2500 && Math.hypot(p.x * W - sp.x, p.y * H - sp.y) > 40)) ch = up(s, id, now) || ch;
    }
    if (s.pn && s.pn.b && s.pn.b.length && now - s.pn.b[s.pn.b.length - 1].at > KEEP_MS) { s.pn = { n: s.pn.n, b: [] }; ch = true; }
    return ch;
  },
  left(s, id) { up(s, id, clockNow()); },
});
function up(s, id, now) {
  const P = s.hang.piano; if (!P || !P.seats[id]) return false;
  delete P.seats[id];
  if (!Object.keys(P.seats).length) P.back = now + BACK_MS;
  return true;
}

/* ---------- on every screen ---------- */
let C = null;                 // the world's ctx while the cabin is open here
let pk = null, panel = null, panelTop = 0, ro = null, seatK = -1, leaving = false;
let batch = null, batchT = 0, seen = 0, myKey = null, tap = null, lastTap = null;
const senders = new Map();    // player id → { L: how late their notes play here (ms), last }
const timers = new Set();
const bigTr = new Map(), floorTr = new Map(), held = new Map();   // trackers per player; held: 'b'|'f' + midi → the players holding it
const sheetNotes = []; let sheetDirty = true;
let bigEls = null, floorEls = null;   // midi → the key's elements on the big piano, on the floor

const myId = () => C && C.me;
const colorOf = id => { const s = C && C.state(); return ((s && s.players[id] || {}).duck || {}).color || ''; };
const vel = () => { const d = C && C.duck(); return d && !inCabin(d.x * W, d.y * H) ? .35 : .8; };   // outside, the piano is heard through the walls
const tracker = (map, id) => { if (!map.has(id)) map.set(id, makeTracker()); return map.get(id); };
const isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);

/* a key lit (or let go) on the big piano or the floor; it stays lit while anyone holds it, then fades */
function lightKey(kind, midi, id, color) {
  const k = kind + midi; if (!held.has(k)) held.set(k, new Set()); held.get(k).add(id);
  const els = (kind === 'b' ? bigEls : floorEls) || {}, e = els[midi]; if (!e) return;
  for (const x of e) { x.style.setProperty('--g', color); x.classList.remove('on'); void x.getBoundingClientRect(); x.classList.add('on'); }
}
function unlightKey(kind, midi, id) {
  const k = kind + midi, h = held.get(k); if (h) h.delete(id); if (h && h.size) return;
  const e = ((kind === 'b' ? bigEls : floorEls) || {})[midi]; if (e) for (const x of e) x.classList.remove('on');
}
function bigOn(id, midi, sp) {
  const iv = tracker(bigTr, id).on(midi);
  lightKey('b', midi, id, iv.color);
  sheetNotes.push({ midi, sp: isBlack(midi) ? sp || (iv.from != null && iv.from > midi ? 'b' : '#') : '', c: iv.color, g: id + iv.g, t: Date.now() });
  if (sheetNotes.length > 120) sheetNotes.splice(0, sheetNotes.length - 120);
  sheetDirty = true;
}
function bigOff(id, midi) { tracker(bigTr, id).off(midi); unlightKey('b', midi, id); }
function floorOn(id, midi) { const iv = tracker(floorTr, id).on(midi); lightKey('f', midi, id, iv.color); }
function floorOff(id, midi) { tracker(floorTr, id).off(midi); unlightKey('f', midi, id); }

/* ---------- my notes, to the room ---------- */
function queue(midi, on, sp, f) {
  const t = clockNow();
  if (!batch) { batch = { t0: t, ev: [] }; batchT = setTimeout(flush, BATCH_MS); }
  batch.ev.push([Math.min(3000, Math.round(t - batch.t0)), midi, on ? 1 : 0, sp || '', f ? 1 : 0]);
  if (batch.ev.length >= 48) flush();
}
function flush() {
  clearTimeout(batchT); batchT = 0;
  if (!batch || !C) { batch = null; return; }
  const b = batch; batch = null;
  C.send({ t: 'hang', k: 'piano', w: 'n', t0: b.t0, ev: b.ev });
}

/* ---------- their notes, from the room: each at its time in its batch, a steady delay behind the player ---------- */
function hear(b) {
  const t = clockNow(), raw = t - b.t0;
  let S = senders.get(b.by); if (!S) senders.set(b.by, S = { L: 0, last: 0 });
  if (!S.L || t - S.last > 2500 || raw + 15 > S.L) S.L = raw + 40;   // (first notes, or late ones: a new delay)
  else S.L = Math.max(raw + 40, S.L - 6);                              // (quicker now: it closes in, slowly)
  S.last = t;
  const stale = raw > 3000;
  for (const e of b.ev) {
    if (stale && e[2]) continue;   // (too old to play; its let-gos still count)
    const ms = Math.max(0, b.t0 + e[0] + S.L - t), id = setTimeout(() => { timers.delete(id); play(b.by, e); }, ms);
    timers.add(id);
  }
}
function play(by, [, midi, on, sp, f]) {
  if (!C) return;
  if (f) {   // the floor
    if (on) { floorOn(by, midi); noteOn(midi, { who: 'f' + by, vel: vel() }); }
    else { floorOff(by, midi); noteOff(midi, { who: 'f' + by }); }
    return;
  }
  if (on) {
    bigOn(by, midi, sp);
    if (pk) pk.play(midi, { who: by, color: colorOf(by), sp, vel: vel() }); else noteOn(midi, { who: 'k' + by, vel: vel() });
  } else {
    bigOff(by, midi);
    if (pk) pk.release(midi, { who: by });
    noteOff(midi, { who: 'k' + by });
  }
}

/* ---------- keyboard mode: the panel over the bottom of the screen ---------- */
function openKeys(k) {
  const d = C.duck(), sp = SPOTS[k];
  seatK = k;
  if (d && sp) Object.assign(d, { x: sp.x / W, y: sp.y / H, z: 0, b: 0, j: 0, lj: false, dj: 0, vz: null, _za: undefined });   // (to my spot on the bench)
  if (pk) return;
  const S = C.world.board.closest('.screen') || document.body;
  panel = document.createElement('div'); panel.className = 'pia-panel';
  S.append(panel);
  place();
  pk = mountPianoKeys(panel, {
    onNote: ({ midi, on, sp: s }) => {
      queue(midi, on, s, 0);
      if (on) bigOn(myId(), midi, s); else bigOff(myId(), midi);
    },
    onClose: () => getUp(),
    closeButton: COARSE || innerHeight > innerWidth,
  });
  ro = new ResizeObserver(() => place()); ro.observe(C.world.board);
  addEventListener('resize', place);
}
function closeKeys() {
  seatK = -1;
  if (!pk) return;
  ro.disconnect(); ro = null; removeEventListener('resize', place);
  const p = pk; pk = null; p.destroy();   // (its held notes are let go: those go to the room too)
  flush();
  panel.remove(); panel = null; panelTop = 0;
}
/* computer: along the bottom of the board, under my duck; a phone held upright: the lower part of the screen */
function place() {
  if (!panel || !C) return;
  const b = C.world.board.getBoundingClientRect(), tall = innerHeight > innerWidth;
  if (tall) {
    const h = Math.round(Math.min(innerHeight * .56, 600));
    Object.assign(panel.style, { left: '6px', right: '6px', width: '', top: '', bottom: 'max(6px, env(safe-area-inset-bottom))', height: h + 'px' });
  } else {
    const h = Math.round(Math.max(150, Math.min(232, b.height * .42)));
    Object.assign(panel.style, { left: Math.round(b.left + 10) + 'px', width: Math.round(b.width - 20) + 'px', right: '', bottom: '', top: Math.round(b.bottom - 10 - h) + 'px', height: h + 'px' });
  }
  panel.dataset.lay = tall ? 'tall' : 'wide';
  panelTop = panel.getBoundingClientRect().top - b.top;
}
function getUp() {
  if (!C) return;
  const mine = pianoOf(C.state()).seats[myId()];
  closeKeys(); leaving = true;   // (until the room says so, my old spot doesn't seat me again)
  if (mine) C.send({ t: 'hang', k: 'piano', w: 'up' });
}

/* ---------- the drawings: the lit floor keys, the big piano's glowing keys, the music sheet ----------
   Each goes over world.js' own element for its prop (art.js' drawing; drawn here only where the world still has a
   placeholder): the floor piano's keys (hg-key, data-key w0 … b9), the piano body's front part (its keyboard shelf, 240
   tall and the piano's width) and the staff column (a parchment 12 in from its sides and top, 86 short of its foot). */
function fill() {
  const W2 = C.world;
  const fe = W2.propEl(FLOOR.id);
  if (fe && fe.dataset.pia !== '1') {
    fe.dataset.pia = '1'; fe.classList.add('pia-floor');
    if (!fe.querySelector('.hg-key')) fe.innerHTML = floorPiano({ w: FLOOR.w, h: FLOOR.d, octaves: OCT });
    floorEls = {};
    for (const g of fe.querySelectorAll('.hg-key')) {
      const k = FK.find(x => x.id === g.dataset.key), face = g.querySelector('rect'); if (!k || !face) continue;
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      for (const [a, d] of [['x', -4], ['y', -4], ['width', 8], ['height', 8]]) ring.setAttribute(a, +face.getAttribute(a) + d);
      ring.setAttribute('rx', 8); ring.setAttribute('class', 'pia-ring'); g.append(ring);
      floorEls[k.midi] = [g];
    }
    for (const [k, h] of held) if (k[0] === 'f' && h.size) floorEls[+k.slice(1)]?.forEach(x => x.classList.add('on'));
  }
  const be = W2.propEl(BODY.id);
  if (be && be.dataset.pia !== '1') {
    be.dataset.pia = '1'; be.classList.add('pia-big');
    const w = BODY.w, h = 240, Y = h - 90, n = 28, kw = (w - 20) / n;
    if (!be.querySelector('.hg-front')) { const art = pianoBody({ w, h }); be.innerHTML = art.back + art.front; }
    let keys = '', glow = '', black = '';
    for (let i = 0; i < n; i++) {
      const m = LOW + 12 * Math.floor(i / 7) + WHITE[i % 7], x = 10 + i * kw;
      glow += `<ellipse class="pia-h" data-m="${m}" cx="${(x + kw / 2).toFixed(1)}" cy="${Y - 15}" rx="${(kw * .9).toFixed(1)}" ry="22"/>`;
      keys += `<rect class="pia-k pia-w" data-m="${m}" x="${x.toFixed(1)}" y="${Y - 15}" width="${kw.toFixed(1)}" height="35" rx="2"/>`;
    }
    for (let o = 0; o < 4; o++) for (const [k, pc] of BLACK) {
      const m = LOW + 12 * o + pc, x = 10 + (o * 7 + k + 1) * kw - kw * .3;
      black += `<rect class="pia-k pia-b" data-m="${m}" x="${x.toFixed(1)}" y="${Y - 15}" width="${(kw * .6).toFixed(1)}" height="21" rx="2"/>`;
    }
    be.insertAdjacentHTML('beforeend', `<svg class="pia-keys" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${glow}${keys}${black}</svg>`);
    bigEls = {};
    for (const e of be.querySelectorAll('.pia-keys [data-m]')) (bigEls[e.dataset.m] = bigEls[e.dataset.m] || []).push(e);
    for (const [k, hs] of held) if (k[0] === 'b' && hs.size) bigEls[+k.slice(1)]?.forEach(x => x.classList.add('on'));
  }
  const se = W2.propEl(SHEET.id);
  if (se && se.dataset.pia !== '1') {
    se.dataset.pia = '1'; se.classList.add('pia-sheet');
    if (!se.querySelector('.hg-staff')) se.innerHTML = staffColumn({ w: SHEET.w, h: SHEET.d + SHEET.h });
    const svg = se.querySelector('.hg-staff'), w = +svg.getAttribute('width'), h = +svg.getAttribute('height'), z = w < 170 ? 1.5 : 1;   // (a narrow column: the sheet drawn bigger and shrunk, so a line holds more notes)
    const shown = BODY.y + BODY.d - 240 - (SHEET.y + SHEET.d - (h - 4)) - 30;   // (the part over the piano's top: the newest notes, at the bottom, show)
    se.insertAdjacentHTML('beforeend', sheetHTML());
    Object.assign(se.querySelector('.pk-sheet').style, { left: '12px', top: '12px', width: (w - 24) * z + 'px', height: Math.min(h - 86, shown) * z + 'px', transform: `scale(${1 / z})` });
    sheetDirty = true;
  }
  if (se && sheetDirty && !se.hidden) { sheetDirty = false; drawSheet(se.querySelector('.pk-sheet'), sheetNotes); }
}

activity({
  id: 'piano',
  mount(ctx) {
    C = ctx; useHangArtCSS();
    const s = ctx.state(); seen = (s.pn && s.pn.n) || 0;   // (notes played before I came in stay unheard)
  },
  unmount() {
    closeKeys(); flush();
    for (const t of timers) clearTimeout(t); timers.clear();
    allNotesOff(); music.hush(null);
    senders.clear(); bigTr.clear(); floorTr.clear(); held.clear(); sheetNotes.length = 0;
    bigEls = floorEls = null; myKey = null; tap = lastTap = null; batch = null; leaving = false; C = null;
  },
  near(pos, ctx) {
    const s = ctx.state();
    if (pk || pianoOf(s).seats[ctx.me]) return { label: 'Get up', d: -1, act: getUp };
    if (!pos.inside || !inZone(pos.x, pos.y) || freeSpot(s) < 0) return null;
    return { label: 'Play', d: Math.max(0, pos.y - (BODY.y + BODY.d)), act: () => ctx.send({ t: 'hang', k: 'piano', w: 'sit' }) };
  },
  onState(s, ctx) {
    const mine = pianoOf(s).seats[ctx.me];
    if (!mine) leaving = false;
    if (mine && !leaving && (!pk || mine.k !== seatK)) openKeys(mine.k);
    else if (!mine && pk) closeKeys();
    const pn = s.pn;
    if (pn && pn.b) for (const b of pn.b) { if (b.i <= seen) continue; seen = b.i; if (b.by !== ctx.me) hear(b); }
    if (pn && pn.n < seen) seen = pn.n;   // (a new room's count)
  },
  step(dt, now, ctx) {
    const d = ctx.duck(); if (!d) return;
    // the floor keys under my feet: on the ground on a key plays it, once a step
    const x = d.x * W, y = d.y * H, gnd = heightAt(x, y);
    const k = !pk && !d.j && d.vz == null && Math.abs((d.z ?? gnd) - gnd) < 3 ? floorKeyAt(x, y) : null;
    if ((k && k.id) !== (myKey && myKey.id)) {
      const me = ctx.me;
      if (myKey) { floorOff(me, myKey.midi); noteOff(myKey.midi, { who: 'fme' }); queue(myKey.midi, false, '', 1); }
      if (k) { floorOn(me, k.midi); noteOn(k.midi, { who: 'fme', vel: .8 }); queue(k.midi, true, '', 1); }
      myKey = k;
    }
    music.hush(hushed(ctx.state(), clockNow()) ? 'Piano' : null);
  },
  draw() { fill(); },
  /* the camera: with the keys open, my duck (and the piano above it) shows just above them */
  view(ctx) { return pk && panelTop ? ctx.world.board.clientHeight / 2 - (panelTop - 30) : 0; },
  hold: () => !!pk,
  jump() { if (!pk) return false; getUp(); return true; },
  /* seated: the specials' keys (and E) do nothing; the keyboard's own keys never get here */
  keydown(e) {
    if (!pk) return false;
    if (/^(Digit|Numpad)/.test(e.code) || e.code === 'KeyE' || e.code === 'KeyQ') { e.preventDefault(); return true; }
    return false;
  },
  /* seated: the board takes no walking, joystick or specials; a tap (a double tap with tap to move) gets up, like a jump */
  pointer(kind, pt, e) {
    if (!pk) return false;
    if (kind === 'down') { tap = { t: performance.now(), x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' }; return true; }
    if (kind === 'up' && tap && !tap.mouse) {
      const t = performance.now(), still = Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 12 && t - tap.t < 260;
      if (still) {
        if (profile.settings.touch !== 'tap' || (lastTap && t - lastTap.t < 300 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 70)) { lastTap = null; getUp(); }
        else lastTap = { t, x: e.clientX, y: e.clientY };
      }
    }
    if (kind === 'up') tap = null;
    return true;
  },
});
