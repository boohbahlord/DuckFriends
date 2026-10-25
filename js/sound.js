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

/* a burst of noise through a filter (crackle, rumble) */
function noise(dur, { gain = .1, at = 0, type = 'bandpass', freq = 1800, q = .8, slideTo = 0 } = {}) {
  const a = ac(), v = vol(); if (!a || !v) return;
  const t = a.currentTime + at, n = Math.ceil(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain * v, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination); src.start(t); src.stop(t + dur + .02);
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
  /* the cloud's words: a soft rising sparkle as the letters fade in, a breath as they fade out */
  letters(n) { const notes = [988, 1175, 1319, 1568, 1760, 1976]; for (let i = 0; i < Math.min(6, Math.ceil(n / 3)); i++) tone(notes[i], .16, { type: 'sine', gain: .05, at: i * .07, attack: .01 }); },
  fade() { noise(.4, { gain: .025, type: 'bandpass', freq: 2600, q: .5, slideTo: 700 }); tone(784, .3, { type: 'sine', gain: .03, slide: .6 }); },
  /* boop: ending your turn is open */
  boop() { tone(620, .16, { type: 'sine', gain: .17, slide: .68, attack: .005 }); },
  ping() { tone(1318, .22, { gain: .12 }); tone(1760, .3, { gain: .09, at: .09 }); },
  pop() { tone(520, .1, { type: 'sine', gain: .15, slide: 1.8 }); },
  tick() { tone(1200, .05, { type: 'square', gain: .04 }); },
  done() { tone(660, .09, { gain: .14 }); tone(990, .14, { gain: .12, at: .08 }); },
  /* the silly commands; the lightning is kept soft */
  /* the E specials */
  sip() { noise(.35, { gain: .05, type: 'bandpass', freq: 1400, q: 2, slideTo: 900 }); tone(330, .12, { gain: .06, at: .32, slide: 1.4 }); },
  chomp() { for (let i = 0; i < 4; i++) noise(.07, { gain: .09, type: 'bandpass', freq: 700 + i * 80, q: 1.2, at: i * .2 }); },
  splash() { noise(.8, { gain: .07, type: 'highpass', freq: 2600, slideTo: 5200 }); },
  pop() { noise(.12, { gain: .12, type: 'bandpass', freq: 1800, q: .7 }); tone(880, .14, { gain: .06, at: .05, slide: 1.5 }); },
  bang() { noise(.25, { gain: .2, type: 'lowpass', freq: 2200, slideTo: 200 }); tone(110, .3, { type: 'square', gain: .05, slide: .5 }); },
  quack() { tone(520, .14, { type: 'sawtooth', gain: .07, slide: .7 }); tone(480, .18, { type: 'sawtooth', gain: .07, at: .18, slide: .6 }); },
  fire() { noise(.9, { gain: .08, type: 'bandpass', freq: 900, q: .4, slideTo: 2400 }); noise(1.4, { gain: .05, type: 'lowpass', freq: 500, at: .2, slideTo: 160 }); },
  zap() { noise(.18, { gain: .09, freq: 3200, q: .6 }); noise(.12, { gain: .06, freq: 2200, at: .08 }); noise(1.1, { gain: .07, type: 'lowpass', freq: 380, at: .12, slideTo: 90 }); },
  love() { tone(784, .25, { gain: .08 }); tone(988, .25, { gain: .07, at: .12 }); tone(1175, .45, { gain: .07, at: .24 }); },
  bonk() { tone(330, .18, { type: 'triangle', gain: .14, slide: .5 }); noise(.08, { gain: .05, freq: 900 }); },
  hotdog() { tone(440, .08, { gain: .1, slide: 1.6 }); tone(700, .12, { gain: .08, at: .08, slide: 1.3 }); },
  /* Who is the Quack?: a snare roll that swells for two seconds, then a hit, before the news */
  drum() {
    for (let i = 0; i < 26; i++) noise(.06, { gain: .03 + .05 * i / 26, type: 'bandpass', freq: 2400, q: .7, at: i * .08 });
    noise(.35, { gain: .14, type: 'lowpass', freq: 900, at: 2.1, slideTo: 120 }); tone(98, .4, { type: 'triangle', gain: .14, at: 2.1, slide: .6 });
  },
};
/* browsers start sound only after the first touch or key */
addEventListener('pointerdown', ac, { once: true });
addEventListener('keydown', ac, { once: true });
