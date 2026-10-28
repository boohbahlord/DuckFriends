/* ---------- the piano in the cabin (Hangout), against the great room's north wall ----------
   Play: near the piano the context button says "Play". Pressing it seats my duck at the first free spot on the bench in
   front of the keyboard (six spots, from the middle out; the host decides who sits where, in s.hang.piano) and opens
   keyboard mode (pianokeys.js) over the bottom of the screen (on a phone held upright, the lower part of the screen, in
   four rows). Seated, my duck can't walk; the button says "Get up", and Get up, Escape or a jump (a tap on the
   board on a phone) stands it up.
   Notes: mine go to the room in little batches (one every 110 ms at most while playing, each note with its time in the
   batch, so a quick run keeps its rhythm on the other screens); every other screen plays them (pianokeys' play() when
   its own keyboard is open, else noteOn) and lights them on the big piano everyone sees, with the interval colors. The batches live in s.pn (outside s.hang, so a note never sends the
   rest of the cabin again), for a few seconds.
   Music: while anyone is seated at the piano the room's music fades away on every screen and the music bar says
   "Piano"; 10 seconds after the last one gets up (s.hang.piano.back) it fades back in, where the room's song is by now. */
import { rule, activity } from './registry.js';
import { PROPS, W, H, inCabin } from './layout.js';
import { mountPianoKeys, noteOn, noteOff, allNotesOff, makeTracker, prepare, LOW } from './pianokeys.js';
import { pianoBody, useHangArtCSS } from './art.js';
import { music } from '../music.js';
import { now as clockNow } from '../clock.js';
import { profile } from '../store.js';

const BODY = PROPS.find(p => p.kind === 'piano');
const WHITE = [0, 2, 4, 5, 7, 9, 11], BLACK = [[0, 1], [1, 3], [3, 6], [4, 8], [5, 10]];   // black keys: [after white key k, pitch class]
const BACK_MS = 10000;   // the music comes back this long after the last player gets up
const BATCH_MS = 110;    // my notes wait this long at most before they go to the room
const KEEP_MS = 4000;    // the room keeps a batch of notes this long
const COARSE = matchMedia('(hover: none) and (pointer: coarse)').matches;

/* ---------- the bench: six spots in front of the keyboard, the middle ones first ---------- */
const SPOTS = [2, 3, 1, 4, 0, 5].map(i => ({ x: BODY.x + BODY.w / 12 * (2 * i + 1), y: BODY.y + BODY.d + 26 }));
/* where the Play button shows: in front of the piano */
const inZone = (x, y, m = 0) => x >= BODY.x - 70 - m && x <= BODY.x + BODY.w + 70 + m && y >= BODY.y + BODY.d - m && y <= BODY.y + BODY.d + 150 + m;
const pianoOf = s => (s && s.hang && s.hang.piano) || { seats: {}, back: 0 };
const freeSpot = s => { const taken = new Set(Object.values(pianoOf(s).seats).map(v => v.k)); return SPOTS.findIndex((_, k) => !taken.has(k)); };
const hushed = (s, t) => { const P = pianoOf(s); return Object.keys(P.seats).length > 0 || t < (P.back || 0); };

/* ---------- the rules (the host) ---------- */
const int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
rule('piano', {
  init: () => ({ piano: { seats: {}, back: 0 } }),   // seats: player id → { k: its spot, at }; back: when the music comes back
  act(s, a, now) {
    const P = s.hang.piano || (s.hang.piano = { seats: {}, back: 0 }), me = s.pos[a.id]; if (!me) return false;
    if (a.w === 'sit') {
      const x = me.x * W, y = me.y * H;   // Play: the first free spot (from beside the piano)
      if (P.seats[a.id] || !inZone(x, y, 160)) return false;
      const k = freeSpot(s); if (k < 0) return false;
      P.seats[a.id] = { k, at: now };
      s.pos[a.id] = { x: +(SPOTS[k].x / W).toFixed(5), y: +(SPOTS[k].y / H).toFixed(5), j: 0, q: '', sp: false, z: 0, b: 0 };
      return true;
    }
    if (a.w === 'up') return up(s, a.id, now);
    if (a.w === 'n') {   // a batch of notes: [ms into the batch, midi, 1 on / 0 off, '#' | 'b' | '']
      if (!Array.isArray(a.ev) || !a.ev.length || a.ev.length > 64 || !Number.isFinite(a.t0)) return false;
      const ev = [];
      for (const e of a.ev) {
        if (!Array.isArray(e) || !int(e[0], 0, 3000) || !int(e[1], 21, 108) || ![0, 1].includes(e[2])) continue;
        if (!P.seats[a.id]) continue;   // (notes from the bench only)
        ev.push([e[0], e[1], e[2], ['#', 'b'].includes(e[3]) ? e[3] : '']);
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
let batch = null, batchT = 0, seen = 0, tap = null, lastTap = null;
const senders = new Map();    // player id → { L: how late their notes play here (ms), last }
const timers = new Set();
const bigTr = new Map(), held = new Map();   // trackers per player; held: midi → the players holding it
let bigEls = null;   // midi → the key's elements on the piano

const myId = () => C && C.me;
const colorOf = id => { const s = C && C.state(); return ((s && s.players[id] || {}).duck || {}).color || ''; };
const vel = () => { const d = C && C.duck(); return d && !inCabin(d.x * W, d.y * H) ? .35 : .8; };   // outside, the piano is heard through the walls
const tracker = (map, id) => { if (!map.has(id)) map.set(id, makeTracker()); return map.get(id); };

/* a key lit (or let go) on the piano; it stays lit while anyone holds it, then fades */
function lightKey(midi, id, color) {
  if (!held.has(midi)) held.set(midi, new Set()); held.get(midi).add(id);
  const e = (bigEls || {})[midi]; if (!e) return;
  for (const x of e) { x.style.setProperty('--g', color); x.classList.remove('on'); void x.getBoundingClientRect(); x.classList.add('on'); }
}
function unlightKey(midi, id) {
  const h = held.get(midi); if (h) h.delete(id); if (h && h.size) return;
  const e = (bigEls || {})[midi]; if (e) for (const x of e) x.classList.remove('on');
}
function bigOn(id, midi) { lightKey(midi, id, tracker(bigTr, id).on(midi).color); }
function bigOff(id, midi) { tracker(bigTr, id).off(midi); unlightKey(midi, id); }

/* ---------- my notes, to the room ---------- */
function queue(midi, on, sp) {
  const t = clockNow();
  if (!batch) { batch = { t0: t, ev: [] }; batchT = setTimeout(flush, BATCH_MS); }
  batch.ev.push([Math.min(3000, Math.round(t - batch.t0)), midi, on ? 1 : 0, sp || '']);
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
function play(by, [, midi, on, sp]) {
  if (!C) return;
  if (on) {
    bigOn(by, midi);
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
      queue(midi, on, s);
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
  const p = pk, el = panel; pk = null; panel = null; panelTop = 0;
  p.destroy();   // (its held notes are let go: those go to the room too)
  flush();
  el.remove();
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
  leaving = true; closeKeys();   // (until the room says so, my old spot doesn't seat me again: not even as my last notes go)
  if (mine) C.send({ t: 'hang', k: 'piano', w: 'up' });
}

/* ---------- the drawings: the piano's glowing keys ----------
   Over world.js' own element for the piano (art.js' drawing; drawn here only where the world still has a placeholder):
   the piano body's front part (its keyboard shelf, 240 tall and the piano's width). */
function fill() {
  const W2 = C.world;
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
    for (const [m, hs] of held) if (hs.size) bigEls[m]?.forEach(x => x.classList.add('on'));
  }
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
    senders.clear(); bigTr.clear(); held.clear();
    bigEls = null; tap = lastTap = null; batch = null; leaving = false; C = null;
  },
  near(pos, ctx) {
    const s = ctx.state();
    if (pk || pianoOf(s).seats[ctx.me]) return { label: 'Get up', key: 'Esc', d: -1, act: getUp };   // (E plays a note here: Esc gets up)
    if (!pos.inside || !inZone(pos.x, pos.y) || freeSpot(s) < 0) return null;
    prepare(vel());   // (the Play button shows: the keys are written out ahead, so they're ready when I sit)
    return { label: 'Play', d: Math.max(0, pos.y - (BODY.y + BODY.d)), act: () => ctx.send({ t: 'hang', k: 'piano', w: 'sit' }) };
  },
  onState(s, ctx) {
    const mine = pianoOf(s).seats[ctx.me];
    if (!mine) leaving = false;
    if (Object.keys(pianoOf(s).seats).length) prepare(vel());   // (someone sat down: the keys are written out ahead)
    if (mine && !leaving && (!pk || mine.k !== seatK)) openKeys(mine.k);
    else if (!mine && pk) closeKeys();
    const pn = s.pn;
    if (pn && pn.b) for (const b of pn.b) { if (b.i <= seen) continue; seen = b.i; if (b.by !== ctx.me) hear(b); }
    if (pn && pn.n < seen) seen = pn.n;   // (a new room's count)
  },
  step(dt, now, ctx) {
    music.hush(hushed(ctx.state(), clockNow()) ? 'Piano' : null);
  },
  draw() { fill(); },
  /* the camera: with the keys open, my duck (and the piano above it) shows just above them */
  view(ctx) { return pk && panelTop ? ctx.world.vh / 2 - (panelTop - 30) : 0; },
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
