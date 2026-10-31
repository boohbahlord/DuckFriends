/* ---------- sounds, made on the spot (no sound files) ----------
   The start countdown (a bip each second and a bright tone at zero, like Halo: Reach's lobby), a soft ping for an @mention,
   a pop when someone joins, a tick when a timer gets short. Volume and Sound effects in Settings scale them all. */
import { profile } from "./store.js";

/* the soft ceiling at the end of a chain: straight through up to .7, then rounding off below 1, so many sounds at once
   never go over full scale, which crackles (its input is quartered, as a curve only reads -1..1: it takes up to 4).
   The music ends with one too */
export function ceiling(a, dest) {
  const q = a.createGain(),
    w = a.createWaveShaper(),
    n = 4097,
    c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = 4 * (i / 2048 - 1),
      m = Math.abs(x);
    c[i] =
      Math.sign(x) * (m <= 0.7 ? m : 0.7 + 0.28 * Math.tanh((m - 0.7) / 0.28));
  }
  q.gain.value = 0.25;
  w.curve = c;
  q.connect(w);
  w.connect(dest);
  return q;
}
/* one sound clock for every sound that isn't music (these, Duck Cabin's, the soccer ball's, the piano's): each clock is its
   own stream to the speakers and its own work for the computer, and five of them on a busy computer crackled */
let ctx = null,
  cap = null;
export function sfxContext() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      cap = ceiling(ctx, ctx.destination);
    } catch (e) {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
export const sfxOut = () => sfxContext() && cap; // where they all go: through the ceiling to the speakers
const ac = sfxContext;
let lastHit = 0;
/* "now" on a sound clock, plus a lead. Firefox only moves currentTime between tasks, so a sound set during a long frame
   read a clock that had stopped, landed in the past and popped: if the clock hasn't moved since I last looked, I add the
   time that has passed since then (at most a quarter of a second) */
const seen = new WeakMap();
export function soon(a, lead = LEAD) {
  const p = performance.now(),
    ct = a.currentTime,
    s = seen.get(a);
  if (s && s.ct === ct && a.state === "running")
    return ct + Math.min(0.25, (p - s.p) / 1000) + lead;
  seen.set(a, { ct, p });
  return ct + lead;
}
const vol = () => (profile.settings.sound / 100) * (profile.settings.sfx / 100);
/* every sound is set a little ahead: set for "now", the moment has gone by the time the sound is worked out, its fade-in
   is skipped and it starts with a pop */
const LEAD = 0.03;

function tone(
  freq,
  dur,
  { type = "sine", gain = 0.2, at = 0, slide = 0, attack = 0.008 } = {},
) {
  const a = ac(),
    v = vol();
  if (!a || !v) return;
  const t = soon(a) + at,
    o = a.createOscillator(),
    g = a.createGain();
  attack = Math.max(freq < 200 ? 0.012 : 0.005, attack); // (5 ms at least, a low note longer, or the start is a click)
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain * v, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(cap);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/* a burst of noise through a filter (crackle, rumble) */
function noise(
  dur,
  {
    gain = 0.1,
    at = 0,
    type = "bandpass",
    freq = 1800,
    q = 0.8,
    slideTo = 0,
    fade = 0.005,
  } = {},
) {
  const a = ac(),
    v = vol();
  if (!a || !v) return;
  const t = soon(a) + at,
    n = Math.ceil(a.sampleRate * dur),
    buf = a.createBuffer(1, n, a.sampleRate),
    d = buf.getChannelData(0),
    fin = a.sampleRate * fade;
  for (let i = 0; i < n; i++)
    d[i] = (Math.random() * 2 - 1) * (1 - i / n) * Math.min(1, i / fin); // it comes in over 5 ms: noise that starts at full level crackles
  const src = a.createBufferSource(),
    f = a.createBiquadFilter(),
    g = a.createGain();
  src.buffer = buf;
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  f.Q.value = q;
  if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain * v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(cap);
  src.start(t);
  src.stop(t + dur + 0.02);
}

export const sfx = {
  /* the start countdown, after Halo: Reach's lobby: a short, soft electronic blip each second, then at zero one bright,
     high, ringing tone (an octave and a fifth up) with a quick shimmer and a short echo */
  count(last) {
    if (last) {
      const f = 1975; // B6, bright and high
      tone(f, 1.1, { type: "sine", gain: 0.2, attack: 0.004 });
      tone(f * 2, 0.55, { type: "sine", gain: 0.05, attack: 0.004 });
      tone(f * 1.003, 1.0, { type: "triangle", gain: 0.07, attack: 0.004 });
      tone(f, 0.8, { type: "sine", gain: 0.06, at: 0.12 }); // the echo
      tone(f, 0.6, { type: "sine", gain: 0.03, at: 0.24 });
      return;
    }
    tone(988, 0.09, { type: "sine", gain: 0.17, attack: 0.003 }); // B5
    tone(1976, 0.06, { type: "sine", gain: 0.04, attack: 0.003 });
    tone(988, 0.07, { type: "sine", gain: 0.04, at: 0.09 });
  },
  /* the cloud's words: a soft rising sparkle as the letters fade in, a breath as they fade out */
  letters(n) {
    const notes = [988, 1175, 1319, 1568, 1760, 1976];
    for (let i = 0; i < Math.min(6, Math.ceil(n / 3)); i++)
      tone(notes[i], 0.16, {
        type: "sine",
        gain: 0.05,
        at: i * 0.07,
        attack: 0.01,
      });
  },
  fade() {
    noise(0.4, {
      gain: 0.025,
      type: "bandpass",
      freq: 2600,
      q: 0.5,
      slideTo: 700,
    });
    tone(784, 0.3, { type: "sine", gain: 0.03, slide: 0.6 });
  },
  /* boop: ending your turn is open */
  boop() {
    tone(620, 0.16, { type: "sine", gain: 0.17, slide: 0.68, attack: 0.005 });
  },
  ping() {
    tone(1318, 0.22, { gain: 0.12 });
    tone(1760, 0.3, { gain: 0.09, at: 0.09 });
  },
  pop() {
    tone(520, 0.1, { type: "sine", gain: 0.15, slide: 1.8 });
  },
  tick() {
    tone(1200, 0.05, { type: "square", gain: 0.04 });
  },
  done() {
    tone(660, 0.09, { gain: 0.14 });
    tone(990, 0.14, { gain: 0.12, at: 0.08 });
  },
  /* the silly commands; the lightning is kept soft */
  /* the E specials */
  sip() {
    noise(0.35, {
      gain: 0.05,
      type: "bandpass",
      freq: 1400,
      q: 2,
      slideTo: 900,
    });
    tone(330, 0.12, { gain: 0.06, at: 0.32, slide: 1.4 });
  },
  chomp() {
    for (let i = 0; i < 4; i++)
      noise(0.07, {
        gain: 0.09,
        type: "bandpass",
        freq: 700 + i * 80,
        q: 1.2,
        at: i * 0.2,
      });
  },
  splash() {
    noise(0.8, { gain: 0.07, type: "highpass", freq: 2600, slideTo: 5200 });
  },
  pop() {
    noise(0.12, { gain: 0.12, type: "bandpass", freq: 1800, q: 0.7 });
    tone(880, 0.14, { gain: 0.06, at: 0.05, slide: 1.5 });
  },
  swish() {
    noise(0.32, {
      gain: 0.07,
      type: "bandpass",
      freq: 700,
      q: 1.4,
      slideTo: 3400,
    });
    noise(0.22, {
      gain: 0.04,
      type: "bandpass",
      freq: 2600,
      q: 1,
      at: 0.16,
      slideTo: 900,
    });
  }, // a dagger thrown, spinning away
  bang() {
    noise(0.25, { gain: 0.2, type: "lowpass", freq: 2200, slideTo: 200 });
    tone(110, 0.3, { type: "square", gain: 0.05, slide: 0.5 });
  },
  shotgun() {
    noise(0.45, {
      gain: 0.2,
      type: "lowpass",
      freq: 1200,
      slideTo: 140,
      fade: 0.016,
    });
    tone(90, 0.38, { type: "sine", gain: 0.1, slide: 0.5, attack: 0.014 });
  }, // Mad God Justin's shotgun: a deeper bang
  boom() {
    noise(1.2, {
      gain: 0.22,
      type: "lowpass",
      freq: 1300,
      slideTo: 70,
      fade: 0.016,
    });
    tone(62, 0.9, { type: "sine", gain: 0.18, slide: 0.55, attack: 0.02 });
  }, // a grenade going off: the meteor's boom, a little shorter
  pump() {
    noise(0.08, {
      gain: 0.07,
      type: "bandpass",
      freq: 1300,
      q: 3,
      fade: 0.012,
    });
    tone(240, 0.07, { type: "triangle", gain: 0.04, slide: 0.7 });
    noise(0.1, {
      gain: 0.08,
      type: "bandpass",
      freq: 800,
      q: 2.4,
      at: 0.2,
      fade: 0.012,
    });
    tone(170, 0.09, {
      type: "triangle",
      gain: 0.05,
      at: 0.2,
      slide: 0.6,
      attack: 0.012,
    });
  }, // … and its pump: chk-chk
  meteor(fall = 1.4) {
    tone(1400, fall, { type: "sine", gain: 0.05, slide: 0.2, attack: 0.04 });
    noise(fall, {
      gain: 0.05,
      type: "bandpass",
      freq: 500,
      q: 0.6,
      slideTo: 1800,
    });
    noise(1.6, {
      gain: 0.22,
      type: "lowpass",
      freq: 900,
      at: fall,
      slideTo: 60,
    });
    tone(55, 1.1, {
      type: "sine",
      gain: 0.2,
      at: fall,
      slide: 0.6,
      attack: 0.02,
    });
  }, // whistling down, then the boom
  fall() {
    tone(1500, 1.2, { type: "sine", gain: 0.07, slide: 0.22, attack: 0.03 });
    tone(1520, 1.2, {
      type: "triangle",
      gain: 0.03,
      slide: 0.22,
      attack: 0.03,
    });
  }, // a slide whistle, falling
  quack() {
    tone(520, 0.14, { type: "sawtooth", gain: 0.07, slide: 0.7 });
    tone(480, 0.18, { type: "sawtooth", gain: 0.07, at: 0.18, slide: 0.6 });
  },
  fire() {
    noise(0.9, {
      gain: 0.08,
      type: "bandpass",
      freq: 900,
      q: 0.4,
      slideTo: 2400,
    });
    noise(1.4, {
      gain: 0.05,
      type: "lowpass",
      freq: 500,
      at: 0.2,
      slideTo: 160,
    });
  },
  zap() {
    noise(0.18, { gain: 0.09, freq: 3200, q: 0.6 });
    noise(0.12, { gain: 0.06, freq: 2200, at: 0.08 });
    noise(1.1, {
      gain: 0.07,
      type: "lowpass",
      freq: 380,
      at: 0.12,
      slideTo: 90,
    });
  },
  love() {
    tone(784, 0.25, { gain: 0.08 });
    tone(988, 0.25, { gain: 0.07, at: 0.12 });
    tone(1175, 0.45, { gain: 0.07, at: 0.24 });
  },
  /* a player hit (or Justin): a short "oof" like a player hurt in Minecraft. A buzzy voice falling in pitch through two
     vowel bands ("uh"), over a soft thump; each a little higher or lower than the last, as there. Two hits at once (a
     knife that knocks a duck down) make one sound */
  hit() {
    const a = ac(),
      v = vol(),
      p = performance.now();
    if (!a || !v || p - lastHit < 120) return;
    lastHit = p;
    const t = soon(a),
      k = 0.92 + Math.random() * 0.16,
      o = a.createOscillator(),
      lp = a.createBiquadFilter(),
      g = a.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(165 * k, t);
    o.frequency.exponentialRampToValueAtTime(100 * k, t + 0.3);
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    o.connect(lp);
    for (const [f, q, l] of [
      [620, 3.5, 1],
      [1150, 5, 0.55],
    ]) {
      const b = a.createBiquadFilter(),
        bg = a.createGain();
      b.type = "bandpass";
      b.frequency.value = f * k;
      b.Q.value = q;
      bg.gain.value = l;
      lp.connect(b).connect(bg).connect(g);
    }
    g.gain.value = 0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4 * v, t + 0.012);
    g.gain.setValueAtTime(0.4 * v, t + 0.1);
    g.gain.setTargetAtTime(0, t + 0.1, 0.05);
    g.connect(cap);
    o.start(t);
    o.stop(t + 0.1 + 0.05 * 7);
    tone(120 * k, 0.14, { gain: 0.08, slide: 0.5, attack: 0.016 }); // (the thump)
  },
  bonk() {
    tone(330, 0.18, { type: "triangle", gain: 0.14, slide: 0.5 });
    noise(0.08, { gain: 0.05, freq: 900 });
  },
  /* Hangout: into the pool (k: 0 a toe in … 1 a cannonball), off the trampoline (k: how high), a pat on the beach ball */
  plunge(k = 1) {
    noise(0.25 + 0.35 * k, {
      gain: 0.03 + 0.06 * k,
      type: "lowpass",
      freq: 1600,
      slideTo: 260,
    });
    tone(420 - 120 * k, 0.22, {
      type: "sine",
      gain: 0.03 + 0.04 * k,
      slide: 0.45,
      attack: 0.01,
    });
    noise(0.4 + 0.3 * k, {
      gain: 0.015 + 0.025 * k,
      type: "highpass",
      freq: 3000,
      at: 0.06,
      slideTo: 5200,
    });
  },
  boing(k = 1) {
    tone(150 + 40 * k, 0.32, {
      type: "sine",
      gain: 0.08,
      slide: 2.2,
      attack: 0.006,
    });
    tone(300 + 80 * k, 0.22, {
      type: "triangle",
      gain: 0.025,
      slide: 1.8,
      attack: 0.006,
    });
  },
  pat() {
    tone(240, 0.1, { type: "sine", gain: 0.08, slide: 0.7, attack: 0.004 });
    noise(0.06, { gain: 0.03, type: "lowpass", freq: 700 });
  },
  /* the double jump: a soft puff of cloud */
  puff() {
    noise(0.28, { gain: 0.06, type: "lowpass", freq: 1400, slideTo: 300 });
    tone(660, 0.12, { type: "sine", gain: 0.04, slide: 1.5 });
  },
  /* the trombone: always the wrong note. It scoops up into a note that's already flat, sags further while it wobbles, and
     a second voice sits a sour quarter tone off, through a brassy filter that opens and closes */
  trombone() {
    const a = ac(),
      v = vol();
    if (!a || !v) return;
    const t = soon(a),
      f = [233.1, 207.7, 185, 155.6][Math.floor(Math.random() * 4)] * 0.97,
      end = t + 1.25;
    const g = a.createGain(),
      flt = a.createBiquadFilter(),
      lfo = a.createOscillator(),
      depth = a.createGain();
    flt.type = "lowpass";
    flt.Q.value = 3;
    flt.frequency.setValueAtTime(380, t);
    flt.frequency.linearRampToValueAtTime(1500, t + 0.09);
    flt.frequency.setValueAtTime(1300, t + 0.5);
    flt.frequency.exponentialRampToValueAtTime(420, end);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16 * v, t + 0.06);
    g.gain.setValueAtTime(0.12 * v, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    lfo.frequency.setValueAtTime(4.5, t);
    lfo.frequency.linearRampToValueAtTime(7, end);
    depth.gain.setValueAtTime(f * 0.012, t);
    depth.gain.linearRampToValueAtTime(f * 0.045, end);
    lfo.connect(depth);
    for (const [cents, type] of [
      [0, "sawtooth"],
      [45, "sawtooth"],
      [-1200, "square"],
    ]) {
      const o = a.createOscillator();
      o.type = type;
      o.detune.value = cents;
      o.frequency.setValueAtTime(f * 0.84, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.14); // the scoop up
      o.frequency.setValueAtTime(f, t + 0.5);
      o.frequency.exponentialRampToValueAtTime(f * 0.8, end); // the sag
      depth.connect(o.frequency);
      o.connect(flt);
      o.start(t);
      o.stop(end + 0.02);
    }
    flt.connect(g).connect(cap);
    lfo.start(t);
    lfo.stop(end + 0.02);
    noise(0.09, { gain: 0.05, type: "bandpass", freq: 600, q: 1.5 }); // the blat as it starts
  },
  hotdog() {
    tone(440, 0.08, { gain: 0.1, slide: 1.6 });
    tone(700, 0.12, { gain: 0.08, at: 0.08, slide: 1.3 });
  },
  /* Who is the Quack?: a snare roll that swells for two seconds, then a hit, before the news */
  drum() {
    for (let i = 0; i < 26; i++)
      noise(0.06, {
        gain: 0.03 + (0.05 * i) / 26,
        type: "bandpass",
        freq: 2400,
        q: 0.7,
        at: i * 0.08,
      });
    noise(0.35, {
      gain: 0.14,
      type: "lowpass",
      freq: 900,
      at: 2.1,
      slideTo: 120,
    });
    tone(98, 0.4, { type: "triangle", gain: 0.14, at: 2.1, slide: 0.6 });
  },
};
/* the start screen: the duck drops through its cloud. A soft puff of cloud, then a slide whistle falling away (scheduled
   a little ahead, every part from silence and back to it). On a's clock into dest: the test page renders it offline */
export function diveVoice(a, dest, t, v = 1) {
  const n = Math.ceil(a.sampleRate * 0.5),
    buf = a.createBuffer(1, n, a.sampleRate),
    d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(),
    lp = a.createBiquadFilter(),
    pg = a.createGain();
  src.buffer = buf;
  lp.type = "lowpass";
  lp.Q.value = 0.5;
  lp.frequency.setValueAtTime(1300, t);
  lp.frequency.exponentialRampToValueAtTime(260, t + 0.42);
  pg.gain.setValueAtTime(0, t);
  pg.gain.linearRampToValueAtTime(0.09 * v, t + 0.02);
  pg.gain.setTargetAtTime(0, t + 0.06, 0.08);
  src.connect(lp).connect(pg).connect(dest);
  src.start(t);
  src.stop(t + 0.06 + 0.48);
  const w = t + 0.08,
    end = w + 1.15,
    o = a.createOscillator(),
    o2 = a.createOscillator(),
    g = a.createGain(),
    lfo = a.createOscillator(),
    dep = a.createGain();
  o.type = "sine";
  o2.type = "triangle";
  for (const x of [o, o2]) {
    x.frequency.setValueAtTime(1050, w);
    x.frequency.exponentialRampToValueAtTime(240, end);
    lfo.connect(dep).connect(x.frequency);
  }
  lfo.frequency.value = 5.5;
  dep.gain.setValueAtTime(0, w);
  dep.gain.linearRampToValueAtTime(14, w + 0.5); // a little wobble as it falls
  const g2 = a.createGain();
  g2.gain.value = 0.3;
  o2.connect(g2).connect(g);
  o.connect(g);
  g.gain.setValueAtTime(0, w);
  g.gain.linearRampToValueAtTime(0.075 * v, w + 0.04);
  g.gain.setValueAtTime(0.075 * v, end - 0.35);
  g.gain.linearRampToValueAtTime(0, end);
  g.connect(dest);
  for (const x of [o, o2, lfo]) {
    x.start(w);
    x.stop(end + 0.05);
  }
}
export function dive() {
  const a = ac(),
    v = vol();
  if (a && v) diveVoice(a, cap, soon(a), v);
}

/* browsers start sound only after the first touch or key */
addEventListener("pointerdown", ac, { once: true });
addEventListener("keydown", ac, { once: true });
