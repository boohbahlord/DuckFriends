/* ---------- sounds, made on the spot (no sound files) ----------
   The start countdown (a bip each second and a bright tone at zero, like Halo: Reach's lobby), a soft ping for an @mention,
   a pop when someone joins, a tick when a timer gets short. Volume and Sound effects in Settings scale them all. */
import { profile } from './store.js';

let ctx = null;
const ac = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
const vol = () => (profile.settings.sound / 100) * (profile.settings.sfx / 100);

function tone(freq, dur, { type = 'sine', gain = .2, at = 0, slide = 0, attack = .008 } = {}) {
  const a = ac(), v = vol(); if (!a || !v) return;
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * v, t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}

export const sfx = {
  /* one bip of the countdown; last = the bright tone at zero */
  count(last) {
    if (last) { tone(1046, .55, { type: 'triangle', gain: .22 }); tone(1568, .5, { type: 'sine', gain: .12, at: .02 }); return; }
    tone(784, .12, { type: 'triangle', gain: .2 }); tone(1568, .08, { type: 'sine', gain: .05 });
  },
  ping() { tone(1318, .22, { gain: .12 }); tone(1760, .3, { gain: .09, at: .09 }); },
  pop() { tone(520, .1, { type: 'sine', gain: .15, slide: 1.8 }); },
  tick() { tone(1200, .05, { type: 'square', gain: .04 }); },
  done() { tone(660, .09, { gain: .14 }); tone(990, .14, { gain: .12, at: .08 }); },
};
/* browsers start sound only after the first touch or key */
addEventListener('pointerdown', ac, { once: true });
addEventListener('keydown', ac, { once: true });
