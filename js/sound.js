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
  /* the start countdown, after Halo: Reach's lobby: a short, soft electronic blip each second, then at zero one bright,
     high, ringing tone (an octave and a fifth up) with a quick shimmer and a short echo */
  count(last) {
    if (last) {
      const f = 1975;   // B6, bright and high
      tone(f, 1.1, { type: 'sine', gain: .2, attack: .004 });
      tone(f * 2, .55, { type: 'sine', gain: .05, attack: .004 });
      tone(f * 1.003, 1.0, { type: 'triangle', gain: .07, attack: .004 });
      tone(f, .8, { type: 'sine', gain: .06, at: .12 });   // the echo
      tone(f, .6, { type: 'sine', gain: .03, at: .24 });
      return;
    }
    tone(988, .09, { type: 'sine', gain: .17, attack: .003 });   // B5
    tone(1976, .06, { type: 'sine', gain: .04, attack: .003 });
    tone(988, .07, { type: 'sine', gain: .04, at: .09 });
  },
  ping() { tone(1318, .22, { gain: .12 }); tone(1760, .3, { gain: .09, at: .09 }); },
  pop() { tone(520, .1, { type: 'sine', gain: .15, slide: 1.8 }); },
  tick() { tone(1200, .05, { type: 'square', gain: .04 }); },
  done() { tone(660, .09, { gain: .14 }); tone(990, .14, { gain: .12, at: .08 }); },
};
/* browsers start sound only after the first touch or key */
addEventListener('pointerdown', ac, { once: true });
addEventListener('keydown', ac, { once: true });
