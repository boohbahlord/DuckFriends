/* ---------- Duck Cabin's sounds, made on the spot (no sound files) ----------
   For the cabin's things that happen: the power (the transformer's hum, the switch, power down and up), the candles and
   the campfire put out, the TV (a channel click, static), the walls' ball pings, and the cabin's characters (the cats'
   meows, purr, hiss and swipe, a cartoon gunshot, a hotdog bite and gulp, the shadow duck's whoosh).

     play(name, opts?)        one sound. opts: { x, y } where it happens (world px, layout's W × H): it fades with its
                              distance from my duck and leans left or right; { k } louder or softer (1 = as made).
                              The lever and the hum are heard near the power box only (RANGE); powerDown and powerUp are
                              heard everywhere: the machine itself near the box, a soft low thump far off (SPLIT_AT).
     loop(name, opts?)        a sound that goes on (hum, static, purr) → { stop(), move(x, y) }. It swells in and fades out.
     setListener(fn)          fn() → my duck's { x, y } in world px, for the distance fading (none set: every sound is near).
     NAMES, LOOPS             what play() and loop() take.
     render(name, secs)       the sound written out offline (an AudioBuffer), for the test page (tools/sounds-test.html).

   Every part starts from silence and ends at silence, scheduled a little ahead; the noise is filtered dark; everything
   goes through one bus that rolls off the very top and rounds off anything that would go over (see CLAUDE.md). Volume and
   Sound effects in Settings scale it all. */
import { profile } from '../store.js';

const vol = () => ((profile.settings.sound ?? 100) / 100) * ((profile.settings.sfx ?? 100) / 100);
const LEAD = .03;              // how far ahead a live sound is scheduled
const NEAR = 220, FAR = 1500;  // world px: full loudness up to NEAR, silent from FAR
const CAP = 24;                // sounds at once, at most

/* ---------- the bus: dark at the very top, a soft ceiling below 1 ---------- */
function bus(a, dest) {
  const inp = a.createGain(), l1 = a.createBiquadFilter(), l2 = a.createBiquadFilter(), half = a.createGain(), cap = a.createWaveShaper(), back = a.createGain();
  l1.type = l2.type = 'lowpass'; l1.frequency.value = l2.frequency.value = 5500; l1.Q.value = .54; l2.Q.value = 1.3;   // (24 dB an octave above 5.5 kHz)
  const curve = new Float32Array(1025);
  for (let i = 0; i < curve.length; i++) { const x = 2 * (i / 512 - 1), m = Math.abs(x); curve[i] = Math.sign(x) * (m <= .8 ? m : .8 + .2 * Math.tanh((m - .8) / .2)); }
  half.gain.value = .5; cap.curve = curve; back.gain.value = 1;   // (the curve reads -1..1, so its input is halved; the curve gives the 2× back)
  inp.connect(l1).connect(l2).connect(half).connect(cap).connect(back).connect(dest);
  return inp;
}
const NOISE = new WeakMap();
function noiseBuf(a) {   // two seconds of white noise, made once for each audio clock
  let b = NOISE.get(a); if (b) return b;
  const n = a.sampleRate * 2; b = a.createBuffer(1, n, a.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  NOISE.set(a, b); return b;
}

/* ---------- building blocks (a: the audio clock, d: where it goes, t: when) ---------- */
/* a gain that swells from 0 to peak over att, holds until t + dur, then dies away (tau); returns { g, end } */
function env(a, t, peak, att, dur, tau) {
  const g = a.createGain();
  g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + att);
  if (dur > att) g.gain.setValueAtTime(peak, t + dur);
  g.gain.setTargetAtTime(0, Math.max(t + att, t + dur), tau);
  return { g, end: Math.max(t + att, t + dur) + tau * 7 };
}
/* a tone: f to f2 (exponential, over slide s), shaped by env */
function tone(a, d, t, { f, f2 = f, slide = 0, type = 'sine', peak = .1, att = .01, dur = 0, tau = .05, lp = 0 }) {
  const o = a.createOscillator(), { g, end } = env(a, t, peak, att, dur, tau);
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2 !== f) o.frequency.exponentialRampToValueAtTime(f2, t + (slide || dur || .1));
  let x = o;
  if (lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; x = x.connect(fl); }
  x.connect(g).connect(d); o.start(t); o.stop(end);
  return { o, g, end };
}
/* filtered noise: the filter's frequency goes f to f2 over slide */
function hiss(a, d, t, { type = 'bandpass', f = 1000, f2 = f, slide = 0, q = .7, peak = .1, att = .01, dur = 0, tau = .05 }) {
  const s = a.createBufferSource(), fl = a.createBiquadFilter(), dark = a.createBiquadFilter(), { g, end } = env(a, t, peak, Math.max(att, .005), dur, tau);
  s.buffer = noiseBuf(a); s.loop = true; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t);
  if (f2 !== f) fl.frequency.exponentialRampToValueAtTime(f2, t + (slide || dur || .1));
  const dark2 = a.createBiquadFilter(); dark.type = dark2.type = 'lowpass'; dark.frequency.value = dark2.frequency.value = 4200; dark.Q.value = .54; dark2.Q.value = 1.3;
  s.connect(fl).connect(dark).connect(dark2).connect(g).connect(d);   // (noise stays dark: next to nothing up where a click would show)
  s.start(t, Math.random() * 1.5); s.stop(end);
  return { s, fl, g, end };
}
/* a struck thing: a few sine partials that ring away */
function ring(a, d, t, f, parts, { peak = .1, att = .012, tau = .2 } = {}) {
  for (const [m, k, tk = 1] of parts) tone(a, d, t, { f: f * m, peak: peak * k, att, tau: tau * tk });
}
/* a switch's clack: a short dark tick and a little thunk, and the spring's softer one just after */
function clack(a, d, t, k = 1) {
  hiss(a, d, t, { f: 1200, q: 1.2, peak: .11 * k, att: .006, tau: .012 });
  tone(a, d, t, { f: 230, f2: 120, slide: .03, peak: .16 * k, att: .006, tau: .025 });
  hiss(a, d, t + .038, { f: 1600, q: 1.4, peak: .045 * k, att: .006, tau: .01 });
}

/* the transformer's hum as one swell or fade: from level h0 to h1 over secs, then gone */
function hum(a, d, t, h0, h1, secs) {
  const g = a.createGain(), lp = a.createBiquadFilter(), end = t + secs;
  lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(g).connect(d);
  g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(h0 || .0001, t + .03);
  if (h1) { g.gain.linearRampToValueAtTime(h1, end); g.gain.setTargetAtTime(0, end, .25); } else g.gain.linearRampToValueAtTime(0, end);
  const stop = h1 ? end + 1.8 : end + .05;
  for (const [f, k, type] of [[60, .5, 'sine'], [120, .4, 'sine'], [180, .16, 'sine'], [240, .06, 'triangle']]) {
    const o = a.createOscillator(), og = a.createGain(); o.type = type; o.frequency.value = f; og.gain.value = k; o.connect(og).connect(lp); o.start(t); o.stop(stop);
  }
}
/* the power heard from far off: a soft low thump through the walls, and the hum's faint fade (dir -1 down, 1 up) */
function thump(a, d, t, dir) {
  hiss(a, d, t, { type: 'lowpass', f: 180, q: .6, peak: .14, att: .02, tau: .12 });
  tone(a, d, t, { f: 58, f2: 42, slide: .3, peak: .13, att: .02, tau: .2 });
  tone(a, d, t + .04, dir < 0 ? { f: 120, peak: .025, att: .03, dur: .05, tau: .35 } : { f: 120, peak: .02, att: .5, dur: .6, tau: .3 });
}
/* near and far versions of one sound, mixed by n (1 near, 0 far) */
function both(a, d, t, n, near, far) {
  for (const [k, f] of [[n, near], [1 - n, far]]) { if (k < .02) continue; const g = a.createGain(); g.gain.value = k; g.connect(d); f(a, g, t); }
}

/* ---------- the one-shot sounds: (a, d, t, o) ---------- */
const MEOWS = [   // [start, top, end pitch], length: a plain meow, a kitten's mew, a long low one, a chirpy mrrp
  [[520, 760, 480], .55], [[700, 920, 650], .34], [[430, 610, 370], .8], [[480, 640, 760], .3]];
function meow(a, d, t, which) {
  const [[f0, f1, f2], len] = MEOWS[which], peakAt = t + len * .38, endAt = t + len;
  const o = a.createOscillator(), lp = a.createBiquadFilter(), fa = a.createBiquadFilter(), fb = a.createBiquadFilter(), ga = a.createGain(), gb = a.createGain(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, peakAt); o.frequency.exponentialRampToValueAtTime(f2, endAt);
  const vib = a.createOscillator(), vd = a.createGain(); vib.frequency.value = 6; vd.gain.setValueAtTime(0, t); vd.gain.linearRampToValueAtTime(f1 * .012, endAt);
  vib.connect(vd).connect(o.frequency);
  lp.type = 'lowpass'; lp.frequency.value = 3200;
  fa.type = fb.type = 'bandpass'; fa.Q.value = 4; fb.Q.value = 5;   // the mouth: "mm-ee-ow"
  fa.frequency.setValueAtTime(450, t); fa.frequency.linearRampToValueAtTime(950, peakAt); fa.frequency.linearRampToValueAtTime(620, endAt);
  fb.frequency.setValueAtTime(1300, t); fb.frequency.linearRampToValueAtTime(2300, peakAt); fb.frequency.linearRampToValueAtTime(1150, endAt);
  ga.gain.value = 1; gb.gain.value = .55;
  o.connect(lp); lp.connect(fa).connect(ga).connect(g); lp.connect(fb).connect(gb).connect(g);
  g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.2, t + .05); g.gain.setValueAtTime(.2, endAt - .09); g.gain.linearRampToValueAtTime(0, endAt);
  g.connect(d);
  for (const x of [o, vib]) { x.start(t); x.stop(endAt + .05); }
}
const ONE = {
  /* goal 3b */
  switch: (a, d, t) => clack(a, d, t),
  lever(a, d, t) {   // the power box's big lever: a ratchet, a metal clack and a heavy thunk
    for (const dt of [0, .045]) hiss(a, d, t + dt, { f: 1100, q: 1.4, peak: .05, att: .006, tau: .01 });
    const c = t + .1;
    ring(a, d, c, 410, [[1, 1, .6], [2.73, .45, .4], [4.6, .18, .3]], { peak: .1, att: .006, tau: .12 });   // the metal
    hiss(a, d, c, { type: 'lowpass', f: 700, q: .6, peak: .16, att: .006, tau: .05 });
    tone(a, d, c, { f: 95, f2: 52, slide: .12, peak: .26, att: .016, tau: .09 });   // the thunk
  },
  /* the power box: near it (o.near 1) the machine itself, far off (0) a soft low thump through the walls, mixed between */
  powerDown: (a, d, t, o = {}) => both(a, d, t, o.near ?? 1, (a, d, t) => {   // near: a clunk, a loud whine winding down, the hum dying
    clack(a, d, t, .8);
    const w = t + .05, end = w + 1.4, o = a.createOscillator(), fl = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(240, w); o.frequency.exponentialRampToValueAtTime(32, end);
    fl.type = 'lowpass'; fl.Q.value = 1.6; fl.frequency.setValueAtTime(1600, w); fl.frequency.exponentialRampToValueAtTime(100, end);
    g.gain.value = 0; g.gain.setValueAtTime(0, w); g.gain.linearRampToValueAtTime(.13, w + .03); g.gain.linearRampToValueAtTime(.07, end - .3); g.gain.linearRampToValueAtTime(0, end);
    o.connect(fl).connect(g).connect(d); o.start(w); o.stop(end + .05);
    tone(a, d, w, { f: 110, f2: 30, slide: 1.3, peak: .08, att: .02, dur: 1, tau: .1 });
    hum(a, d, t, .16, 0, 1.4);
  }, (a, d, t) => thump(a, d, t, -1)),
  powerUp: (a, d, t, o = {}) => both(a, d, t, o.near ?? 1, (a, d, t) => {   // near: a clunk, the machine winding up, the hum swelling, a buzz
    clack(a, d, t, .8);
    const w = t + .05, top = w + 1, o = a.createOscillator(), fl = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(40, w); o.frequency.exponentialRampToValueAtTime(260, top);
    fl.type = 'lowpass'; fl.Q.value = 1.5; fl.frequency.setValueAtTime(150, w); fl.frequency.exponentialRampToValueAtTime(1600, top);
    g.gain.value = 0; g.gain.setValueAtTime(0, w); g.gain.linearRampToValueAtTime(.09, top); g.gain.setTargetAtTime(0, top + .05, .08);
    o.connect(fl).connect(g).connect(d); o.start(w); o.stop(top + .7);
    hum(a, d, w, 0, .16, 1.1);
    const bz = a.createOscillator(), bp = a.createBiquadFilter(), { g: bg, end } = env(a, top - .1, .035, .06, .35, .1);   // the buzz as it comes on
    bz.type = 'sawtooth'; bz.frequency.value = 120; bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2;
    bz.connect(bp).connect(bg).connect(d); bz.start(top - .1); bz.stop(end);
  }, (a, d, t) => thump(a, d, t, 1)),
  candleOut(a, d, t) {   // a short breath, and the flame's little "fft"
    hiss(a, d, t, { f: 760, f2: 520, slide: .25, q: .6, peak: .13, att: .06, dur: .14, tau: .07 });
    hiss(a, d, t + .17, { type: 'lowpass', f: 420, peak: .05, att: .01, tau: .04 });
  },
  fireOut(a, d, t) {   // a whump, and a long hiss that settles
    hiss(a, d, t, { type: 'lowpass', f: 320, peak: .2, att: .016, tau: .14 });
    tone(a, d, t, { f: 72, f2: 44, slide: .25, peak: .14, att: .016, tau: .12 });
    hiss(a, d, t + .03, { f: 3000, f2: 1400, slide: 1.5, q: .45, peak: .08, att: .05, dur: 1.1, tau: .3 });
    hiss(a, d, t + .03, { f: 900, f2: 500, slide: 1.2, q: .6, peak: .05, att: .05, dur: .9, tau: .25 });
  },
  tvClick(a, d, t) {   // the knob's clunk and a blip of static between channels
    tone(a, d, t, { f: 170, f2: 110, slide: .03, peak: .15, att: .006, tau: .03 });
    hiss(a, d, t, { f: 1200, q: 1.1, peak: .1, att: .006, tau: .015 });
    hiss(a, d, t + .02, { f: 1600, q: .7, peak: .04, att: .012, dur: .1, tau: .03 });
  },
  pingLow(a, d, t) {   // the blue wall: a dark, low "bonnng" (the ball's thud under it)
    hiss(a, d, t, { type: 'lowpass', f: 420, peak: .07, att: .006, tau: .03 });
    ring(a, d, t, 147, [[1, 1], [2.76, .25, .5], [5.4, .06, .3]], { peak: .2, att: .014, tau: .28 });
  },
  pingHigh(a, d, t) {   // the pink wall: a bright, high "ting"
    hiss(a, d, t, { type: 'lowpass', f: 900, peak: .04, att: .005, tau: .02 });
    ring(a, d, t, 1047, [[1, 1], [2.5, .12, .5], [1.5, .1, .7]], { peak: .1, att: .008, tau: .16 });
  },
  /* goal 4 */
  meow1: (a, d, t) => meow(a, d, t, 0), meow2: (a, d, t) => meow(a, d, t, 1), meow3: (a, d, t) => meow(a, d, t, 2), meow4: (a, d, t) => meow(a, d, t, 3),
  meow: (a, d, t) => meow(a, d, t, Math.floor(Math.random() * MEOWS.length)),   // one of the four
  hiss(a, d, t) {   // a cat's hiss: it swells, rasps, and stops
    const h = hiss(a, d, t, { f: 3600, q: .5, peak: .09, att: .12, dur: .55, tau: .06 });
    const lfo = a.createOscillator(), dep = a.createGain(), m = a.createGain();
    lfo.frequency.value = 28; dep.gain.value = .25; m.gain.value = .8; lfo.connect(dep).connect(m.gain);
    h.g.disconnect(); h.g.connect(m).connect(d); lfo.start(t); lfo.stop(h.end);
  },
  swipe(a, d, t) {   // a paw's swipe through the air, claws out
    hiss(a, d, t, { f: 400, f2: 1500, slide: .13, q: 1.6, peak: .1, att: .02, dur: .1, tau: .04 });
    hiss(a, d, t + .09, { f: 1300, f2: 800, slide: .1, q: 1.2, peak: .045, att: .01, tau: .04 });
  },
  gunshot(a, d, t) {   // a cartoon pop-bang: a cork's pop, then a round boom
    tone(a, d, t, { f: 650, f2: 1400, slide: .04, peak: .09, att: .005, tau: .025 });
    const b = t + .05;
    hiss(a, d, b, { type: 'lowpass', f: 1100, f2: 150, slide: .4, q: .6, peak: .36, att: .01, tau: .13 });
    tone(a, d, b, { f: 120, f2: 40, slide: .3, peak: .28, att: .016, tau: .16 });
  },
  bite(a, d, t) {   // the hotdog's snap, a little crunch and a "mm"
    hiss(a, d, t, { f: 900, q: 1.3, peak: .13, att: .006, tau: .018 });
    hiss(a, d, t + .05, { f: 950, q: 1.1, peak: .08, att: .006, tau: .02 });
    hiss(a, d, t + .1, { f: 850, q: 1.1, peak: .06, att: .006, tau: .02 });
    tone(a, d, t + .01, { f: 190, f2: 120, slide: .05, peak: .08, att: .01, tau: .04 });
  },
  gulp(a, d, t) {   // a cartoon gulp: "glk", then a little bloop
    tone(a, d, t, { f: 330, f2: 115, slide: .12, peak: .16, att: .012, dur: .08, tau: .04, lp: 900 });
    tone(a, d, t + .16, { f: 170, f2: 400, slide: .08, peak: .09, att: .012, dur: .05, tau: .04, lp: 1200 });
  },
  whoosh(a, d, t) {   // the shadow duck going by: a soft rush that rises and falls, passing from left to right
    const p = a.createStereoPanner ? a.createStereoPanner() : null;
    const out = p || a.createGain(); out.connect(d);
    if (p) { p.pan.setValueAtTime(-.6, t); p.pan.linearRampToValueAtTime(.6, t + .9); }
    const h = hiss(a, out, t, { f: 280, f2: 1100, slide: .45, q: 1, peak: .16, att: .3, dur: .45, tau: .14 });
    h.fl.frequency.exponentialRampToValueAtTime(360, t + .95);
  },
};

/* ---------- the sounds that go on: (a, d, t) → stop(at) (fades out; returns when it's silent) ---------- */
function holdAt(p, at) { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(at); else { p.cancelScheduledValues(at); p.setValueAtTime(p.value, at); } }
function looped(a, t, peak, swell, srcs, g) {   // g: the gain every part goes through
  g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + swell);
  for (const s of srcs) s.start(t);
  return at => { holdAt(g.gain, at); g.gain.setTargetAtTime(0, at, .1); const end = at + .8; for (const s of srcs) s.stop(end); return end; };
}
const LOOP = {
  hum(a, d, t) {   // the transformer: mains hum (60 Hz and its overtones, which small speakers can play), slowly breathing
    const g = a.createGain(), lp = a.createBiquadFilter(), w = a.createGain(), srcs = [];
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(w).connect(g).connect(d);
    for (const [f, k, type] of [[60, .5, 'sine'], [120, .4, 'sine'], [180, .16, 'sine'], [240, .06, 'triangle'], [360, .03, 'sine']]) {
      const o = a.createOscillator(), og = a.createGain(); o.type = type; o.frequency.value = f; og.gain.value = k; o.connect(og).connect(lp); srcs.push(o);
    }
    const lfo = a.createOscillator(), dep = a.createGain(); lfo.frequency.value = .7; dep.gain.value = .1; w.gain.value = .9; lfo.connect(dep).connect(w.gain); srcs.push(lfo);
    return looped(a, t, .14, .4, srcs, g);
  },
  static(a, d, t) {   // the TV between channels: a soft, dark hiss that flutters
    const s = a.createBufferSource(), bp = a.createBiquadFilter(), w = a.createGain(), g = a.createGain();
    s.buffer = noiseBuf(a); s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .35;
    const lfo = a.createOscillator(), dep = a.createGain(); lfo.frequency.value = 13; dep.gain.value = .15; w.gain.value = .85; lfo.connect(dep).connect(w.gain);
    s.connect(bp).connect(w).connect(g).connect(d);
    return looped(a, t, .07, .05, [s, lfo], g);
  },
  purr(a, d, t) {   // a cat's purr: a low rumble pulsing about 25 times a second, breathing in and out
    const s = a.createBufferSource(), lp = a.createBiquadFilter(), lp2 = a.createBiquadFilter(), pulse = a.createGain(), breath = a.createGain(), g = a.createGain();
    s.buffer = noiseBuf(a); s.loop = true; lp.type = lp2.type = 'lowpass'; lp.frequency.value = 380; lp2.frequency.value = 600;
    const p = a.createOscillator(), pd = a.createGain(); p.frequency.value = 25; pd.gain.value = .5; pulse.gain.value = .5; p.connect(pd).connect(pulse.gain);
    const b = a.createOscillator(), bd = a.createGain(); b.frequency.value = .5; bd.gain.value = .3; breath.gain.value = .7; b.connect(bd).connect(breath.gain);
    p.frequency.setValueAtTime(25, t); s.connect(lp).connect(lp2).connect(pulse).connect(breath).connect(g).connect(d);
    return looped(a, t, .6, .5, [s, p, b], g);
  },
};
export const NAMES = Object.keys(ONE), LOOPS = Object.keys(LOOP);

/* ---------- live ---------- */
let ac = null, main = null, listener = null, live = 0;
const loops = new Set();
function audio() {
  try {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); main = bus(ac, ac.destination); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  } catch (e) { return null; }
}
export function setListener(fn) { listener = fn; }
/* how loud and which way, for a sound at (x, y) */
const RANGE = { hum: [120, 520], lever: [150, 650] };   // world px: full up to the first, silent from the second (the rest: NEAR, FAR)
const SPLIT = { powerDown: 1, powerUp: 1 };   // near and far versions: always heard, the mix follows the distance
const SPLIT_AT = [400, 900];                 // all near up to the first, all far from the second
function where(x, y, name) {
  if (x == null || y == null || !listener) return { k: 1, pan: 0, dist: 0 };
  const me = listener(); if (!me) return { k: 1, pan: 0, dist: 0 };
  const [n0, n1] = RANGE[name] || [NEAR, FAR];
  const dx = x - me.x, dy = y - me.y, dist = Math.hypot(dx, dy), u = Math.min(1, Math.max(0, (dist - n0) / (n1 - n0)));
  return { k: (1 - u) * (1 - u), pan: Math.max(-.7, Math.min(.7, dx / 700)), dist };
}
const nearness = dist => 1 - Math.min(1, Math.max(0, (dist - SPLIT_AT[0]) / (SPLIT_AT[1] - SPLIT_AT[0])));
/* a sound's own way into the bus: its loudness and its lean */
function lane(a, k, pan) {
  const g = a.createGain(); g.gain.value = k;
  if (a.createStereoPanner && pan) { const p = a.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(main); } else g.connect(main);
  return g;
}
export function play(name, opts = {}) {
  const f = ONE[name], v = vol(); if (!f || !v || live >= CAP) return;
  const a = audio(); if (!a) return;
  const w = where(opts.x, opts.y, name), split = SPLIT[name], kk = (split ? 1 : w.k) * v * (opts.k ?? 1); if (kk < .01) return;
  const n = split ? nearness(w.dist) : 1, g = lane(a, kk, w.pan * n); live++;
  f(a, g, a.currentTime + LEAD, { near: n });
  setTimeout(() => { live--; g.disconnect(); }, 4000);   // (every one-shot is silent well within 4 s)
}
export function loop(name, opts = {}) {
  const f = LOOP[name], a = f && audio(); if (!a) return { stop() {}, move() {} };
  let x = opts.x, y = opts.y, done = false;
  const level = () => where(x, y, name).k * vol() * (opts.k ?? 1);
  const g = a.createGain(), p = a.createStereoPanner ? a.createStereoPanner() : null;
  g.gain.value = level(); if (p) { p.pan.value = where(x, y, name).pan; g.connect(p).connect(main); } else g.connect(main);
  const stop = f(a, g, a.currentTime + LEAD);
  const h = {
    move(nx, ny) { x = nx; y = ny; },
    stop() {
      if (done) return; done = true; loops.delete(h);
      const end = stop(a.currentTime + LEAD);
      setTimeout(() => g.disconnect(), (end - a.currentTime + .2) * 1000);
    },
    follow() {   // (every 200 ms: my duck moves, the sound's loudness glides after it)
      const w = where(x, y, name), t = a.currentTime + LEAD;
      g.gain.setTargetAtTime(w.k * vol() * (opts.k ?? 1), t, .15); if (p) p.pan.setTargetAtTime(w.pan, t, .15);
    },
  };
  loops.add(h);
  if (loops.size === 1) followT = setInterval(() => { if (!loops.size) { clearInterval(followT); followT = 0; } for (const l of loops) l.follow(); }, 200);
  return h;
}
let followT = 0;

/* ---------- offline, for the test page: a one-shot, or a loop that runs until 0.8 s before the end ---------- */
export async function render(name, secs = 2.5, sr = 44100, o2 = {}) {   // (o2.near: for powerDown and powerUp, 1 near … 0 far)
  const o = new OfflineAudioContext(2, Math.ceil(sr * secs), sr), d = bus(o, o.destination), g = o.createGain();
  g.connect(d);
  if (ONE[name]) ONE[name](o, g, .05, o2);
  else if (LOOP[name]) LOOP[name](o, g, .05)(secs - 1);
  return o.startRendering();
}
