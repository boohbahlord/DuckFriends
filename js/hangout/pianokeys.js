/* ---------- Hangout: the piano's keyboard mode (Duck Cabin) ----------
   Four octaves of a real piano (C2 … B5; the third row starts on middle C), its warm made-on-the-spot voice, the glow
   colors (the interval from the previous note) and the music sheet column. It knows nothing of the room: the caller
   sends my notes to the room (onNote) and calls play()/release() for notes from others.

   Keys on a computer (read by e.code, so Shift and the keyboard's language don't change them): each row is one chromatic
   octave, C to B, 12 keys a half step apart (black keys have their own keys; notes are spelled with sharps):
     lowest octave (C2)   1 2 3 4 5 6 7 8 9 0 - =         second (C3)  Q W E R T Y U I O P [ ]
     third (C4, middle C) A S D F G H J K L ; ' Enter     fourth (C5)  Shift Z X C V B N M , . / Space
   While the keyboard is open all 48 keys (Enter, Shift and Space too) and Esc are kept from the game and the browser;
   Ctrl/Cmd combinations are never touched. Esc (and the Get up button) gets up (onClose). Key repeat doesn't strike
   again; letting go lets the note ring out (the damper).
   Phones tap the keys (black keys too), several fingers at once for chords.

   API
     mountPianoKeys(root, { onNote, onClose, sheet = true, closeButton = true, legend, letters })
         → { play(midi, opts), release(midi, opts), releaseAll(), notes(), destroy(), el }
       root: an element the caller sizes and places; the keyboard fills it (four octaves in a row on a computer, two rows
       of two on a phone held sideways, four rows of one, lowest at the bottom, on a phone held upright).
       onNote({ midi, on, t, sp }): my own notes (on: true when struck, false when let go; t: Date.now(); sp: '#', 'b'
         or '' for how it was spelled, for the sheet). Send them to the room; don't play them back through play().
       onClose(): Esc or the Get up button.
       sheet: show the music sheet beside the keys (above them on a phone held upright). closeButton: the Get up button.
       legend: the orderly list of keys (default: on a computer). letters: the key letters on the white keys (default:
       on a computer).
       play(midi, { who, color, sp, vel }): a note from someone else: sounds, glows (its color the interval from that
         player's own previous note; `color`, their duck's color, rings the key) and goes on the sheet.
       release(midi, { who }): that player let go.
     noteOn(midi, { who, vel }) / noteOff(midi, { who }) / allNotesOff(who): the sound alone (for the floor keys, and for
       notes from others while my keyboard is closed).
     makeTracker() → { on(midi, t) → { from, semis, color, label, g }, off(midi), last() }: the glow color rule (the note
       still held, else the last one played; notes struck together, within 60 ms, all take the note before them).
     intervalColor(fromMidi, toMidi), intervalLabel(fromMidi, toMidi) ("M3 +1 oct", '' up to an octave),
     INTERVALS (the 12 colors and names, unison/octave first), noteName(midi, sp) ("C#4", "Db4", "C4").
     sheetHTML() → the sheet's element; drawSheet(el, notes): draws notes ([{ midi, sp, c, g, t }]: c its head color, g
       a chord id (same g = one chord; without g, notes within 60 ms are one)) as a narrow grand staff, newest at the
       bottom; full lines scroll up.
     KEY_ROWS, KEY_MAP (e.code → midi), KEY_LABEL (e.code → what the key shows), LOW (36, C2), HIGH (83, B5), keyMidi(code).
     prepare(vel): writes the keys out ahead (see the sound below); the first note played does it too.
     renderOffline(events, { bank }) → AudioBuffer: the voice written out ([{ midi, t, d, vel }], seconds), for tests; bank:
       played back from the written-out keys, as in the game. */
import { profile } from '../store.js';
import { sfxContext, sfxOut, soon } from '../sound.js';

/* ---------- the keys ---------- */
export const LOW = 36, HIGH = LOW + 47;
const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK_PC = new Set([1, 3, 6, 8, 10]);
export const KEY_ROWS = [
  ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Space'],
];
const LETTERS = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='], 'QWERTYUIOP[]'.split(''), ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", '⏎'], ['⇧', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', '␣']];
export const KEY_MAP = Object.fromEntries(KEY_ROWS.flatMap((row, o) => row.map((c, i) => [c, LOW + 12 * o + i])));
KEY_MAP.NumpadEnter = KEY_MAP.Enter;   // (the numpad's Enter is the same key to the game, so the same note here)
export const KEY_LABEL = Object.fromEntries(KEY_ROWS.flatMap((row, o) => row.map((c, i) => [c, LETTERS[o][i]])));
const LETTER_OF = Object.fromEntries(Object.entries(KEY_MAP).map(([c, m]) => [m, KEY_LABEL[c]]));
export const keyMidi = code => KEY_MAP[code] ?? null;
const isBlack = m => BLACK_PC.has(((m % 12) + 12) % 12);

/* ---------- names and the glow colors ---------- */
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const noteName = (midi, sp = '#') => (sp === 'b' ? FLATS : SHARPS)[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
/* the twelve half-step intervals around the rainbow; the same note or an octave is white */
export const INTERVALS = [
  ['P1', 'unison or octave', '#ffffff'],
  ['m2', 'minor 2nd', '#ff4141'], ['M2', 'major 2nd', '#ff8a1f'], ['m3', 'minor 3rd', '#ffc21a'], ['M3', 'major 3rd', '#fff23a'],
  ['P4', 'perfect 4th', '#a8ee32'], ['aug4', 'augmented 4th', '#35d65a'], ['P5', 'perfect 5th', '#1fdcc4'], ['m6', 'minor 6th', '#2cb6ff'],
  ['M6', 'major 6th', '#557bff'], ['m7', 'minor 7th', '#9a5cff'], ['M7', 'major 7th', '#ec4ee0'],
];
export const intervalColor = (from, to) => INTERVALS[from == null ? 0 : Math.abs(to - from) % 12][2];
export function intervalLabel(from, to) {
  if (from == null) return '';
  const d = Math.abs(to - from), o = Math.floor(d / 12), r = d % 12;
  if (d <= 12) return '';
  return r ? `${INTERVALS[r][0]} +${o} oct` : `${o} oct`;
}
/* the note still held, else the last one played; notes struck together (within 60 ms of the first) all take the note
   before the chord */
export function makeTracker({ chordMs = 60 } = {}) {
  const held = []; let last = null, group = null, gid = 0;
  return {
    on(midi, t = performance.now()) {
      if (!group || t - group.t > chordMs) { const h = held.filter(m => m !== midi); group = { ref: h.length ? h[h.length - 1] : last, id: ++gid, t }; }   // (a chord: struck within 60 ms of its first note)
      const from = group.ref, i = held.indexOf(midi); if (i >= 0) held.splice(i, 1);
      held.push(midi); last = midi;
      return { from, semis: from == null ? 0 : Math.abs(midi - from), color: intervalColor(from, midi), label: intervalLabel(from, midi), g: group.id };
    },
    off(midi) { const i = held.indexOf(midi); if (i >= 0) held.splice(i, 1); },
    last: () => held.length ? held[held.length - 1] : last,
  };
}

/* ---------- the sound: a warm piano made on the spot ----------
   Each note is its own few sine partials, a little stretched like a real string's, each fading at its own pace (the
   high ones first, so the note starts a little bright and settles warm), the lowest two doubled a hair apart so they
   breathe. Every partial swells in over 5-7 ms from silence and there is no noise at all at the start (a burst of noise
   at a note's start is heard as crackling). Letting go brings the damper down: a short, natural fade. Through a soft
   treble cut, a small made room, a gentle limiter and, last, a soft ceiling, so a crowd of notes never clips (the
   limiter turns quiet sound up by itself, so many keys at once went over the top). Volume and Sound effects in
   Settings scale it, as for every sound.
   Every key is set to sound LEAD from now: a note set to start in the past skips its fade-in and clicks, or even starts
   at full volume. Firefox's clock only moves between tasks, so "now" can already be several ms gone. */
const COARSE = matchMedia('(hover: none) and (pointer: coarse)').matches;
const vol = () => (profile.settings.sound / 100) * (profile.settings.sfx / 100);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damperTau = m => clamp(.32 - (m - 36) * .004, .11, .32);
const LEAD = .02;

function roomIR(ctx, sec) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate), pre = Math.floor(ctx.sampleRate * .012), fin = ctx.sampleRate * .01;
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let y = 0;
    for (let k = pre; k < n; k++) { const q = k / n; y += (.35 - .25 * q) * ((Math.random() * 2 - 1) - y); d[k] = y * Math.exp(-6.2 * q) * Math.min(1, (k - pre) / fin); }
  }
  return b;
}
function chain(ctx, dest, lite) {
  const inp = ctx.createGain(), shelf = ctx.createBiquadFilter(), comp = ctx.createDynamicsCompressor();
  shelf.type = 'highshelf'; shelf.frequency.value = 2600; shelf.gain.value = -4;
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .3;
  // the ceiling: straight up to .8, then rounding off below 1 (its input is halved, as a curve only reads -1..1)
  const half = ctx.createGain(), cap = ctx.createWaveShaper(), curve = new Float32Array(1025);
  for (let i = 0; i < curve.length; i++) { const x = 2 * (i / 512 - 1), a = Math.abs(x); curve[i] = Math.sign(x) * (a <= .8 ? a : .8 + .2 * Math.tanh((a - .8) / .2)); }
  half.gain.value = .5; cap.curve = curve;
  inp.connect(shelf).connect(comp).connect(half).connect(cap).connect(dest);
  const rev = ctx.createConvolver(), wet = ctx.createGain();
  rev.buffer = roomIR(ctx, lite ? 1.1 : 1.7); wet.gain.value = lite ? .12 : .17;
  inp.connect(rev); rev.connect(wet).connect(comp);
  return inp;
}
/* one struck string → { release(at, tau) } */
function strike(ctx, out, midi, t, vel, gain, lite) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const N = Math.max(1, Math.min(lite ? 4 : 8, Math.floor(7000 / f)));
  const tau1 = clamp(3.2 * Math.pow(261.6 / f, .55), .7, 6);
  const B = .00012 * (1 + Math.max(0, midi - 60) / 12), bright = .55 + .45 * vel;
  const amps = [];
  for (let n = 1; n <= N; n++) amps.push(n === 1 ? (midi < 48 ? .72 + .28 * (midi - 36) / 12 : 1) : Math.pow(n, -1.55) * Math.pow(bright, n - 1) * (n === 7 ? .35 : 1));
  const sum = amps.reduce((a, b) => a + b, 0);
  const peak = .2 * vel * gain * (1 + .35 * clamp((60 - midi) / 24, 0, 1)) / sum * 1.6;
  const damper = ctx.createGain(); damper.gain.value = 1; damper.connect(out);
  const oscs = []; let end = t;
  amps.forEach((a, k) => {
    const n = k + 1, fn = f * n * Math.sqrt(1 + B * n * n), tn = tau1 / (1 + .55 * (n - 1)), att = n >= 4 ? .005 : .007;
    const g = ctx.createGain(); g.gain.value = 0;                          // (0 first: set late, it stays quiet, not loud)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * peak, t + att);
    g.gain.setTargetAtTime(a * peak * .42, t + att, tn * .18);            // the bright first moment
    g.gain.setTargetAtTime(0, t + att + tn * .5, tn);                      // the long ring after it
    g.connect(damper);
    const stop = Math.min(t + 14, t + att + tn * 7.5); end = Math.max(end, stop);
    const twins = !lite && n <= 2 ? [1, Math.pow(2, (.9 + .4 * n) / 1200)] : [1];
    for (const m of twins) {
      const o = ctx.createOscillator(); o.frequency.value = fn * m;
      if (twins.length > 1) { const h = ctx.createGain(); h.gain.value = .5; o.connect(h).connect(g); } else o.connect(g);
      o.start(t); o.stop(stop); oscs.push(o);
    }
  });
  let done = false;
  oscs[0].onended = () => { try { damper.disconnect(); } catch (e) {} };   // (the fundamental rings longest)
  return {
    get end() { return end; },
    release(at, tau) {
      if (done) return; done = true;
      damper.gain.setValueAtTime(1, at); damper.gain.setTargetAtTime(0, at, tau);
      const stop = at + tau * 8; if (stop < end) { end = stop; for (const o of oscs) try { o.stop(stop); } catch (e) {} }
    },
  };
}

let AC = null, OUT = null;
const live = new Map();   // "who|midi" → voice
function ctx() {
  if (!AC) {
    AC = sfxContext(); if (!AC) return null;   // (the game's one clock for sounds: sound.js)
    OUT = chain(AC, sfxOut(), COARSE);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
/* each key written out once, then played back. Made on the spot, a note is ten oscillators, each with its own fades, and
   they ring on after the key is let go: a quick run kept hundreds going at once and a busy laptop couldn't work them out
   in time, so the sound to the speakers ran short, and that was the popping (the sound itself had no clicks in it). Written
   out, a note is one player and its damper. The keys are written out in the background as soon as anyone sits at the
   piano (or it is first played), middle C first and outward from there, one at a time; a key that isn't ready yet is made on the spot as before.
   A key held longer than its recording (7 s, 4 on a phone) fades out at its end. The recordings are at the clock's own
   sample rate (at a lower one, the clock's quick change of rate left a faint hiss on a big chord's first moment); all
   48 keys take about 64 MB (37 on a phone) */
const BANK_LEN = COARSE ? 4 : 7;
const BANK = new Map();   // "midi|loudness|rate" → AudioBuffer, or true while it's being written out
const bankVel = vel => vel < .55 ? .35 : .8;   // (two loudnesses: inside, and through the walls, darker)
let warming = null;
async function writeKey(midi, vb, sr) {
  const k = midi + '|' + vb + '|' + sr; if (BANK.has(k)) return;
  BANK.set(k, true);
  try {
    const oc = new OfflineAudioContext(1, Math.ceil(BANK_LEN * sr), sr);
    strike(oc, oc.destination, midi, 0, vb, 1, COARSE).release(BANK_LEN - .45, .05);   // (its end fades to silence)
    BANK.set(k, await oc.startRendering());
  } catch (e) { BANK.delete(k); }
}
/* the keys written out ahead, as soon as anyone sits at the piano (vel: how loud I hear it here) */
export function prepare(vel = .8) { const a = ctx(); if (a && typeof OfflineAudioContext !== 'undefined') warm(bankVel(vel), a.sampleRate); }
function warm(vb, sr, first) {
  if (first != null) writeKey(first, vb, sr);
  if (warming) return;
  const todo = Array.from({ length: HIGH - LOW + 1 }, (_, i) => LOW + i).sort((a, b) => Math.abs(a - 60) - Math.abs(b - 60));
  warming = (async () => { for (const m of todo) { await writeKey(m, vb, sr); await new Promise(r => setTimeout(r, 40)); } })();   // (one at a time, so the computer keeps up)
}
function playBack(a, out, midi, t, vel, gain) {
  const vb = bankVel(vel), buf = BANK.get(midi + '|' + vb + '|' + a.sampleRate);
  if (!(buf instanceof AudioBuffer)) { warm(vb, a.sampleRate, midi); return strike(a, out, midi, t, vel, gain, COARSE); }
  const s = a.createBufferSource(), damper = a.createGain(), lvl = gain * vel / vb;
  s.buffer = buf; damper.gain.value = lvl; s.connect(damper).connect(out);   // (the recording starts at silence: the level is set before it sounds)
  s.start(t); let end = t + buf.duration, done = false; s.stop(end);
  s.onended = () => { try { damper.disconnect(); } catch (e) {} };
  return {
    get end() { return end; },
    release(at, tau) {
      if (done) return; done = true;
      damper.gain.setValueAtTime(lvl, at); damper.gain.setTargetAtTime(0, at, tau);
      const stop = at + tau * 8; if (stop < end) { end = stop; try { s.stop(stop); } catch (e) {} }
    },
  };
}
const MAX_VOICES = 28, MAX_RINGING = 40;
const ringing = [];   // every note still sounding, held or let go, oldest first
export function noteOn(midi, { who = '', vel = .8 } = {}) {
  const a = ctx(), v = vol(); if (!a || !v) return;
  const k = who + '|' + midi, t = soon(a, LEAD);
  const old = live.get(k); if (old) old.release(t, .03);   // struck again: the old one stops quickly
  if (live.size >= MAX_VOICES) { const [ok, ov] = live.entries().next().value; ov.release(t, .05); live.delete(ok); }
  for (let i = ringing.length - 1; i >= 0; i--) if (ringing[i].end <= a.currentTime) ringing.splice(i, 1);
  while (ringing.length >= MAX_RINGING) ringing.shift().release(t, .05);   // (too many still ringing: the oldest let go)
  const vc = playBack(a, OUT, midi, t, vel * (.96 + Math.random() * .08), v);
  live.delete(k); live.set(k, vc); ringing.push(vc);
}
export function noteOff(midi, { who = '' } = {}) {
  const k = who + '|' + midi, vc = live.get(k); if (!vc || !AC) return;
  live.delete(k); vc.release(soon(AC, LEAD), damperTau(midi));   // (the same lead: a quick tap still sounds)
}
export function allNotesOff(who) { for (const k of [...live.keys()]) if (who == null || k.startsWith(who + '|')) noteOff(+k.split('|')[1], { who: k.split('|')[0] }); }
/* the voice written out, for tests: events [{ midi, t, d, vel }] in seconds */
export async function renderOffline(events, { sampleRate = 44100, tail = 3, lite = false, bank = false } = {}) {
  const len = Math.max(...events.map(e => e.t + e.d)) + tail;
  const oc = new OfflineAudioContext(2, Math.ceil(len * sampleRate), sampleRate), out = chain(oc, oc.destination, lite);
  if (bank) for (const e of events) await writeKey(e.midi, bankVel(e.vel ?? .8), sampleRate);   // (bank: played back from the written-out keys, as in the game)
  for (const e of events) (bank ? playBack(oc, out, e.midi, e.t, e.vel ?? .8, 1) : strike(oc, out, e.midi, e.t, e.vel ?? .8, 1, lite)).release(e.t + e.d, damperTau(e.midi));
  return oc.startRendering();
}

/* ---------- the music sheet column ----------
   A narrow grand staff (treble and bass). Notes fill a line left to right as colored note heads (chords stacked), sharps
   and flats as they were played; when a line is full a new one starts below and the sheet scrolls up. */
const SYS = 150, X0 = 30, SW = 19;
const yT = d => 56 - (d - 30) * 4, yB = d => 120 - (d - 18) * 4;
const LET_S = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6], LET_F = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const dia = (m, sp) => (Math.floor(m / 12) - 1) * 7 + (sp === 'b' ? LET_F : LET_S)[((m % 12) + 12) % 12];
const INK = '#2b2333';
const TREBLE = `<path d="M13.6 70 Q15.6 42 13.4 15 Q19 21 16.8 28 Q15 33 9 38.5 Q4 43.5 5.6 49 Q7.6 54 12.6 53.5 Q18.4 52.6 18 46.5 Q17.4 41.5 12.6 42 Q9.4 42.6 9.8 46" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><circle cx="10.4" cy="69" r="2.4" fill="${INK}"/>`;
const BASS = `<circle cx="7" cy="96" r="2.4" fill="${INK}"/><path d="M7 96 C6.5 89.5 17 87.5 18.2 94.5 C19.2 102 12.5 108.5 5 112" fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round"/><circle cx="22" cy="92.2" r="1.3" fill="${INK}"/><circle cx="22" cy="99.8" r="1.3" fill="${INK}"/>`;
const sharpSVG = (x, y) => `<path d="M${x - 1.5} ${y - 7}v13M${x + 1.5} ${y - 6}v13" stroke="${INK}" stroke-width="1"/><path d="M${x - 3.6} ${y - 1.2}l7.2-1.8M${x - 3.6} ${y + 3.4}l7.2-1.8" stroke="${INK}" stroke-width="1.8"/>`;
const flatSVG = (x, y) => `<path d="M${x - 2} ${y - 10}V${y + 3.2}C${x + 4.5} ${y} ${x + 3.5} ${y - 4.6} ${x - 2} ${y - 1.4}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
function slotsOf(notes) {
  const out = []; let cur = null;
  for (const n of notes) {
    const same = cur && (n.g != null ? n.g === cur.g : cur.g == null && n.t != null && cur.t != null && n.t - cur.t <= 60);
    if (same && !cur.ns.some(x => x.midi === n.midi)) { cur.ns.push(n); cur.t = n.t; }
    else if (!same) { cur = { g: n.g, t: n.t, ns: [n] }; out.push(cur); }
  }
  return out;
}
function slotSVG(slot, cx) {
  let s = '';
  const heads = slot.ns.map(n => { const d = dia(n.midi, n.sp), tr = n.midi >= 60; return { n, d, tr, y: tr ? yT(d) : yB(d) }; }).sort((a, b) => a.y - b.y);
  let prev = null, accN = 0;
  for (const h of heads) {
    const x = prev && prev.tr === h.tr && Math.abs(prev.y - h.y) <= 4 && !prev.shift ? cx + 8.5 : cx; h.shift = x !== cx; prev = h;
    const ledg = [];
    if (h.tr) { for (let d = 40; d <= h.d; d += 2) ledg.push(yT(d)); for (let d = 28; d >= h.d; d -= 2) ledg.push(yT(d)); }
    else { for (let d = 16; d >= h.d; d -= 2) ledg.push(yB(d)); for (let d = 28; d <= h.d; d += 2) ledg.push(yB(d)); }
    for (const y of ledg) s += `<path d="M${x - 7.5} ${y}h15" stroke="${INK}" stroke-width="1"/>`;
    if (isBlack(h.n.midi)) { const ax = cx - 10 - (accN++ % 2) * 6; s += h.n.sp === 'b' ? flatSVG(ax, h.y) : sharpSVG(ax, h.y); }
    s += `<ellipse cx="${x}" cy="${h.y}" rx="4.9" ry="3.7" transform="rotate(-20 ${x} ${h.y})" fill="${h.n.c || '#fff'}" stroke="${INK}" stroke-width="1.3"/>`;
  }
  return s;
}
export const sheetHTML = () => '<div class="pk-sheet" aria-hidden="true"></div>';
export function drawSheet(el, notes) {
  if (!el) return;
  const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
  const sc = W > 1.6 * H ? H / SYS : clamp(H / (SYS * 2), .5, 1.2), Wu = W / sc;
  const per = Math.max(2, Math.floor((Wu - X0 - 4) / SW));
  const slots = slotsOf(notes || []), cur = Math.max(0, Math.ceil(slots.length / per) - 1);
  const vis = Math.ceil(H / (SYS * sc)) + 1, first = Math.max(0, cur - vis + 1), nsys = cur - first + 1;
  let s = '';
  for (let k = 0; k < nsys; k++) {
    const oy = (nsys - 1 - k) * SYS, idx = cur - k;
    let g = `<g transform="translate(0 ${oy})">`;
    for (let i = 0; i < 5; i++) g += `<path d="M2 ${24 + i * 8}H${Wu - 2}M2 ${88 + i * 8}H${Wu - 2}" stroke="${INK}" stroke-width=".9" opacity=".75"/>`;
    g += `<path d="M2 24V120M${Wu - 2} 24V120" stroke="${INK}" stroke-width="1.2"/>${TREBLE}${BASS}`;
    for (let i = 0; i < per; i++) { const sl = slots[idx * per + i]; if (sl) g += slotSVG(sl, X0 + SW * (i + .5) + 3); }
    s += g + '</g>';
  }
  const hpx = nsys * SYS * sc;
  el.innerHTML = `<svg class="pk-sheet-svg" viewBox="0 0 ${Wu.toFixed(1)} ${nsys * SYS}" width="${W}" height="${hpx.toFixed(1)}" style="height:${hpx.toFixed(1)}px">${s}</svg>`;
  const svg = el.firstChild;
  if (el._pkLine != null && cur > el._pkLine) {   // a new line: the sheet scrolls up
    svg.style.transform = `translateY(${(SYS * sc).toFixed(1)}px)`; void svg.getBoundingClientRect();
    svg.style.transition = 'transform .45s ease'; svg.style.transform = '';
  }
  el._pkLine = cur;
}

/* ---------- the keyboard on the screen ---------- */
const BLACK_AFTER = [[0, 1, -.1], [1, 3, .1], [3, 6, -.12], [4, 8, 0], [5, 10, .12]];   // [white index, pitch class, nudge]
const typing = t => t instanceof Element && (t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));

export function mountPianoKeys(root, { onNote = () => {}, onClose = () => {}, sheet = true, closeButton = true, legend, letters } = {}) {
  const touch = COARSE;
  const showLetters = letters ?? !touch, showLegend = legend ?? !touch;
  const box = document.createElement('div');
  box.className = 'pk';
  box.innerHTML = `${sheet || closeButton ? `<div class="pk-side">${sheet ? sheetHTML() : ''}${closeButton ? '<button type="button" class="btn ghost pk-close">Get up</button>' : ''}</div>` : ''}
    <div class="pk-main">${showLegend ? legendHTML() : ''}<div class="pk-keys"></div></div>`;
  root.append(box);
  const kb = box.querySelector('.pk-keys'), sheetEl = box.querySelector('.pk-sheet');
  const keyEl = new Map(), holders = new Map(), trackers = new Map(), down = new Map(), ptr = new Map(), sheetNotes = [];
  const mine = makeTracker();
  let per = 0, raf = 0;

  /* the layout: as many octaves a row as keep the white keys wide enough to hit (26 px with a mouse, 40 with a finger):
     4 on a computer, 2 on a phone held sideways, 1 on a phone held upright; the lowest row at the bottom */
  function build() {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    const side = w >= h;
    box.dataset.lay = side ? 'side' : 'top';
    const kw0 = kb.clientWidth || w, min = touch ? 40 : 26;
    const p = kw0 / 28 >= min ? 4 : kw0 / 14 >= min ? 2 : 1;
    if (p !== per) {
      per = p; box.dataset.per = p;
      let html = '';
      for (let r = 0; r < 4 / p; r++) {
        const n = 7 * p; let row = `<div class="pk-row">`;
        for (let o = r * p; o < r * p + p; o++) WHITE.forEach((pc, i) => { const m = LOW + 12 * o + pc;
          row += `<div class="pk-w" data-m="${m}"><span class="pk-gl"><span class="pk-lab"></span></span>${showLetters ? `<span class="pk-k">${LETTER_OF[m]}</span>` : ''}${!showLetters && pc === 0 ? `<span class="pk-k">C${o + 2}</span>` : ''}</div>`; });
        for (let o = r * p; o < r * p + p; o++) for (const [wi, pc, nudge] of BLACK_AFTER) {
          const m = LOW + 12 * o + pc, left = ((o - r * p) * 7 + wi + 1 + nudge) / n * 100, bw = 60 / n;
          row += `<div class="pk-b" data-m="${m}" style="left:${(left - bw / 2).toFixed(3)}%;width:${bw.toFixed(3)}%"><span class="pk-gl"><span class="pk-lab"></span></span>${showLetters ? `<span class="pk-k">${LETTER_OF[m]}</span>` : ''}</div>`;
        }
        html += row + '</div>';
      }
      kb.innerHTML = html;
      keyEl.clear(); kb.querySelectorAll('[data-m]').forEach(k => keyEl.set(+k.dataset.m, k));
      for (const [m, set] of holders) if (set.size) keyEl.get(m)?.classList.add('on');
    }
    const kw = kb.clientWidth, ww = kw / (7 * per), rows = 4 / per;
    const gap = parseFloat(getComputedStyle(kb).rowGap) || 0, main = kb.parentElement, lg = main.querySelector('.pk-legend');
    const room = main.clientHeight - (lg ? lg.offsetHeight + (parseFloat(getComputedStyle(main).rowGap) || 0) : 0);   // (the keys sit at the bottom, the legend just above them)
    kb.style.setProperty('--rowh', Math.max(20, Math.floor(Math.min((room - gap * (rows - 1)) / rows, ww * (touch ? 6 : 5.2)))) + 'px');
    kb.style.setProperty('--ww', ww + 'px');
    drawNow();
  }
  const ro = new ResizeObserver(() => build()); ro.observe(box);

  const light = (m, color, label, ring) => {
    const k = keyEl.get(m); if (!k) return;
    k.style.setProperty('--g', color); k.style.setProperty('--ring', ring || 'transparent');
    k.querySelector('.pk-lab').innerHTML = label ? label.split(' ').map((w, i) => i ? `<i>${w}</i>` : `<b>${w}</b>`).join('') : '';   // "M3 +1 oct" on three short lines (keys are narrow)
    clearTimeout(k._pkT); k.classList.toggle('pk-labd', !!label);   // (the label takes the key letter's place while it shows)
    k.classList.remove('on'); void k.offsetWidth; k.classList.add('on');
  };
  const unlight = m => {
    const k = keyEl.get(m); if (!k || (holders.get(m) || new Set()).size) return;
    k.classList.remove('on'); clearTimeout(k._pkT); k._pkT = setTimeout(() => k.classList.remove('pk-labd'), 1200);
  };
  const hold = (m, h) => { if (!holders.has(m)) holders.set(m, new Set()); holders.get(m).add(h); };
  const mineHeld = m => [...(holders.get(m) || [])].some(h => h[0] !== 'r');
  const drawNow = () => { raf = 0; if (sheetEl) drawSheet(sheetEl, sheetNotes); };
  const addSheet = n => { sheetNotes.push(n); if (sheetNotes.length > 240) sheetNotes.splice(0, sheetNotes.length - 240); if (sheetEl && !raf) raf = requestAnimationFrame(drawNow); };

  /* my own notes */
  function myOn(h, m, sp) {
    const again = mineHeld(m); hold(m, h); if (again) return;
    const iv = mine.on(m);
    noteOn(m);
    light(m, iv.color, iv.label);
    if (isBlack(m) && !sp) sp = iv.from != null && iv.from > m ? 'b' : '#';   // a tapped black key: flat going down, sharp going up (a computer's keys: sharp)
    addSheet({ midi: m, sp: isBlack(m) ? sp : '', c: iv.color, g: 'me' + iv.g, t: Date.now() });
    onNote({ midi: m, on: true, t: Date.now(), sp: isBlack(m) ? sp : '' });
  }
  function myOff(h, m) {
    const set = holders.get(m); if (!set || !set.delete(h)) return;
    if (mineHeld(m)) return;
    mine.off(m); noteOff(m); unlight(m);
    onNote({ midi: m, on: false, t: Date.now() });
  }
  function releaseMine() {
    for (const [code, m] of [...down]) { down.delete(code); myOff('k' + code, m); }
    for (const [id, m] of [...ptr]) { ptr.delete(id); myOff('p' + id, m); }
  }

  /* the computer's keys */
  const keydown = e => {
    if (e.ctrlKey || e.metaKey) { if (e.key === 'Meta') releaseMine(); return; }   // (a Mac sends no key-ups while Cmd is held)
    if (typing(e.target)) return;
    if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) onClose(); return; }
    const m = KEY_MAP[e.code]; if (m == null) return;
    e.preventDefault(); e.stopImmediatePropagation();   // (Enter, Space and Shift are notes too: nothing else gets them)
    if (e.repeat || down.has(e.code)) return;
    down.set(e.code, m); myOn('k' + e.code, m, '#');
  };
  const keyup = e => {
    if (e.code === 'Escape') { e.stopImmediatePropagation(); return; }
    const m = down.get(e.code); if (m == null) return;
    e.preventDefault(); e.stopImmediatePropagation(); down.delete(e.code); myOff('k' + e.code, m);
  };
  const blur = () => releaseMine();
  const vis = () => { if (document.hidden) releaseMine(); };
  addEventListener('keydown', keydown, true); addEventListener('keyup', keyup, true);
  addEventListener('blur', blur); document.addEventListener('visibilitychange', vis);

  /* fingers and the mouse: each finger its own note; sliding across the keys plays each key it reaches */
  const keyAt = (x, y) => { const k = document.elementFromPoint(x, y); const t = k && k.closest && k.closest('[data-m]'); return t && kb.contains(t) ? +t.dataset.m : null; };
  kb.addEventListener('pointerdown', e => {
    const k = e.target.closest('[data-m]'); if (!k || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); try { kb.setPointerCapture(e.pointerId); } catch (er) {}
    const m = +k.dataset.m; ptr.set(e.pointerId, m); myOn('p' + e.pointerId, m, '');
  });
  kb.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    const m = keyAt(e.clientX, e.clientY), was = ptr.get(e.pointerId); if (m == null || m === was) return;
    myOff('p' + e.pointerId, was); ptr.set(e.pointerId, m); myOn('p' + e.pointerId, m, '');
  });
  const lift = e => { if (!ptr.has(e.pointerId)) return; const m = ptr.get(e.pointerId); ptr.delete(e.pointerId); myOff('p' + e.pointerId, m); };
  kb.addEventListener('pointerup', lift); kb.addEventListener('pointercancel', lift); kb.addEventListener('lostpointercapture', lift);
  kb.addEventListener('contextmenu', e => e.preventDefault());
  box.querySelector('.pk-close')?.addEventListener('click', () => onClose());

  build();
  return {
    el: box,
    /* a note from someone else */
    play(m, { who = '?', color = '', sp = '', vel = .8 } = {}) {
      if (!trackers.has(who)) trackers.set(who, makeTracker());
      const iv = trackers.get(who).on(m);
      hold(m, 'r' + who); noteOn(m, { who: 'r' + who, vel }); light(m, iv.color, iv.label, color);
      addSheet({ midi: m, sp: isBlack(m) ? (sp || '#') : '', c: iv.color, g: who + iv.g, t: Date.now() });
    },
    release(m, { who = '?' } = {}) {
      trackers.get(who)?.off(m); noteOff(m, { who: 'r' + who });
      holders.get(m)?.delete('r' + who); unlight(m);
    },
    releaseAll() { releaseMine(); for (const [m, set] of holders) for (const h of [...set]) if (h[0] === 'r') { set.delete(h); noteOff(m, { who: h }); } for (const m of holders.keys()) unlight(m); },
    notes: () => sheetNotes.slice(),
    destroy() {
      releaseMine(); allNotesOff();
      removeEventListener('keydown', keydown, true); removeEventListener('keyup', keyup, true);
      removeEventListener('blur', blur); document.removeEventListener('visibilitychange', vis);
      ro.disconnect(); cancelAnimationFrame(raf); box.remove();
    },
  };
}

/* the keys and what they do, in order (a computer only) */
function legendHTML() {
  const k = s => `<kbd>${s}</kbd>`;
  const rows = LETTERS.map((l, o) => `<span class="pk-lg-i"><b>C${o + 2}</b>${k(l[0])}…${k(l[11])}</span>`).join('');
  return `<div class="pk-legend" aria-label="Keys">${rows}<span class="pk-lg-sep"></span>
    <span class="pk-lg-i">${k('Esc')}<b>Get up</b></span></div>`;
}
