/* ---------- Quacky Zombies' sounds ----------
   What the owner asked for (Nov 4): footsteps for the ducks and quieter ones for the zombies, paced to how fast each
   moves; a board nailed up and a board torn off; the fireplace's spin as a slot machine and the Butler's sale as a cash
   register; a new round's sound, a faint, far-off, eerie swell that fades away; and the zombie ducks' groans, heard but
   not too often, a close group of them counting as one.

     l4Hear(s, ctx)        on every new state: the boards, the spin, a sale, a new round, where the zombies are going
     l4Steps(dt, ctx)      every frame: the footsteps and the groans
     SOUNDS                each sound (a, d, t, opts), for a test to render or count

   Each is made on the spot with Duck Cabin's building blocks and heard through its bus (hangout/sounds.js): it fades with
   its distance from my duck and leans left or right, every part starts and ends at silence, the noise is dark, and the
   voices are capped (CAP there; here a few footsteps and groans at once at most). Checked with tools/clickcheck.js. */
import { addSounds, parts, play } from "./hangout/sounds.js";
import { heightAt } from "./hangout/layout.js";
import { OPENINGS, BUTLER, BOX, zombiesOf, ptsOf } from "./l4ddrules.js";

const { tone, hiss, ring } = parts;
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- the sounds (a: the clock, d: where it goes, t: when, o: what play() was given) ---------- */
export const SOUNDS = {
  /* a duck's webbed foot on the floorboards: a soft low pat */
  l4step(a, d, t) {
    const k = rnd(0.9, 1.12);
    tone(a, d, t, {
      f: 165 * k,
      f2: 95 * k,
      slide: 0.05,
      peak: 0.13,
      att: 0.012,
      tau: 0.025,
    });
    hiss(a, d, t, {
      f: 650 * k,
      q: 1.4,
      peak: 0.05,
      att: 0.008,
      tau: 0.014,
    });
  },
  /* a zombie's foot: dragged, heavier and duller */
  l4zstep(a, d, t) {
    const k = rnd(0.85, 1.1);
    tone(a, d, t, {
      f: 95 * k,
      f2: 62 * k,
      slide: 0.06,
      peak: 0.12,
      att: 0.016,
      tau: 0.035,
    });
    hiss(a, d, t + 0.02, {
      type: "lowpass",
      f: 520 * k,
      f2: 240,
      slide: 0.14,
      q: 0.6,
      peak: 0.06,
      att: 0.03,
      dur: 0.05,
      tau: 0.05,
    });
  },
  /* a board nailed up: two knocks of the hammer on wood and the nail's little ring */
  l4nail(a, d, t) {
    for (const [at, k] of [
      [0, 1],
      [0.17, 1.08],
    ]) {
      tone(a, d, t + at, {
        f: 420 * k,
        f2: 360 * k,
        slide: 0.04,
        peak: 0.13,
        att: 0.005,
        tau: 0.035,
      });
      tone(a, d, t + at, {
        f: 160 * k,
        f2: 120 * k,
        slide: 0.05,
        peak: 0.12,
        att: 0.012,
        tau: 0.05,
      });
      hiss(a, d, t + at, {
        f: 1500 * k,
        q: 2,
        peak: 0.07,
        att: 0.006,
        tau: 0.012,
      });
    }
    ring(
      a,
      d,
      t + 0.18,
      2150,
      [
        [1, 1],
        [1.9, 0.3, 0.5],
      ],
      { peak: 0.025, att: 0.01, tau: 0.07 },
    );
  },
  /* a board torn off: wood splintering, a creak, and the thud of it falling */
  l4crack(a, d, t) {
    for (let i = 0; i < 5; i++)
      hiss(a, d, t + i * rnd(0.018, 0.03), {
        f: rnd(900, 1800),
        q: 1.6,
        peak: 0.1 - i * 0.012,
        att: 0.012,
        tau: 0.018,
      });
    tone(a, d, t, {
      type: "sawtooth",
      f: 230,
      f2: 140,
      slide: 0.12,
      peak: 0.05,
      att: 0.012,
      dur: 0.06,
      tau: 0.04,
      lp: 900,
    });
    tone(a, d, t + 0.22, {
      f: 120,
      f2: 62,
      slide: 0.1,
      peak: 0.17,
      att: 0.016,
      tau: 0.1,
    });
    hiss(a, d, t + 0.22, {
      type: "lowpass",
      f: 700,
      f2: 200,
      slide: 0.15,
      peak: 0.08,
      att: 0.012,
      tau: 0.06,
    });
  },
  /* the fireplace's spin, as a slot machine: the reels tick, fast and then slowing, under a little bleeping tune, and it
     lands with two dings and a few coins (o.secs: how long it spins) */
  l4slot(a, d, t, o) {
    const secs = o.secs || 4.2;
    let at = 0,
      n = 0;
    while (at < secs - 0.05) {
      const u = at / secs; // (0 … 1 of the spin)
      tone(a, d, t + at, {
        type: "triangle",
        f: n % 2 ? 1250 : 1050,
        peak: 0.05,
        att: 0.005,
        tau: 0.012,
        lp: 2600,
      });
      at += 0.06 + 0.24 * u * u; // (the reels slow down)
      n++;
    }
    const TUNE = [72, 76, 79, 84, 79, 76]; // (C E G C G E, high)
    for (let i = 0; i * 0.11 < secs - 0.4; i++)
      tone(a, d, t + i * 0.11, {
        type: "triangle",
        f: 440 * Math.pow(2, (TUNE[i % TUNE.length] - 69) / 12),
        peak: 0.028,
        att: 0.006,
        dur: 0.05,
        tau: 0.02,
        lp: 2600,
      });
    const end = t + secs;
    for (const [at2, f] of [
      [0, 1568],
      [0.16, 2093],
    ])
      ring(
        a,
        d,
        end + at2,
        f,
        [
          [1, 1, 1],
          [2.4, 0.25, 0.5],
        ],
        { peak: 0.08, att: 0.01, tau: 0.25 },
      );
    for (let i = 0; i < 4; i++)
      ring(a, d, end + 0.35 + i * rnd(0.05, 0.08), rnd(2600, 3400), [[1, 1]], {
        peak: 0.02,
        att: 0.008,
        tau: 0.05,
      });
  },
  /* Justin's Butler's cash register: the keys' chk-chk, the drawer sliding out, the bell's "ching" and a few coins */
  l4till(a, d, t) {
    for (const at of [0, 0.07])
      hiss(a, d, t + at, {
        f: 1900,
        q: 3,
        peak: 0.09,
        att: 0.006,
        tau: 0.012,
      });
    hiss(a, d, t + 0.16, {
      f: 700,
      f2: 1600,
      slide: 0.14,
      q: 1.2,
      peak: 0.05,
      att: 0.03,
      dur: 0.1,
      tau: 0.04,
    });
    tone(a, d, t + 0.3, {
      f: 140,
      f2: 100,
      slide: 0.05,
      peak: 0.1,
      att: 0.012,
      tau: 0.04,
    }); // (the drawer stops)
    ring(
      a,
      d,
      t + 0.3,
      2093,
      [
        [1, 1, 1],
        [2.4, 0.3, 0.6],
      ],
      { peak: 0.1, att: 0.01, tau: 0.35 },
    );
    for (let i = 0; i < 3; i++)
      ring(a, d, t + 0.42 + i * rnd(0.05, 0.08), rnd(2800, 3500), [[1, 1]], {
        peak: 0.022,
        att: 0.008,
        tau: 0.05,
      });
  },
  /* a new round: something far off and hard to make out. A low drone (A and its sour neighbours: a fifth, a minor ninth,
     a tritone, each a pair a little out of tune), wind, and a thin whine high above, swelling for two seconds or so and
     fading away for six */
  l4round(a, d, t) {
    for (const [f, pk] of [
      [55, 0.07],
      [82.4, 0.05],
      [116.5, 0.035],
      [155.6, 0.03],
    ])
      for (const det of [0.997, 1.004])
        tone(a, d, t, {
          f: f * det,
          f2: f * det * 0.97,
          slide: 7,
          peak: pk,
          att: 2.2,
          dur: 2.6,
          tau: 0.9,
        });
    const w = hiss(a, d, t, {
      f: 260,
      f2: 700,
      slide: 2.5,
      q: 1.3,
      peak: 0.035,
      att: 2,
      dur: 2.6,
      tau: 0.9,
    });
    w.fl.frequency.exponentialRampToValueAtTime(220, t + 7);
    tone(a, d, t + 0.6, {
      f: 880,
      f2: 830,
      slide: 5,
      peak: 0.012,
      att: 2.2,
      dur: 2.4,
      tau: 0.8,
    });
  },
  /* a zombie duck: a low, rasping, broken quack (o.v: which of two; o.p: its own pitch) */
  l4groan(a, d, t, o) {
    const p = o.p || 1,
      long = !o.v,
      secs = long ? 0.75 : 0.22,
      src = a.createOscillator(),
      lp = a.createBiquadFilter(),
      rasp = a.createGain(),
      lfo = a.createOscillator(),
      lg = a.createGain(),
      g = a.createGain();
    src.type = "sawtooth";
    src.frequency.setValueAtTime((long ? 150 : 260) * p, t);
    src.frequency.linearRampToValueAtTime((long ? 170 : 300) * p, t + 0.08);
    src.frequency.exponentialRampToValueAtTime((long ? 92 : 170) * p, t + secs);
    lp.type = "lowpass";
    lp.frequency.value = 1500;
    lfo.frequency.value = long ? 27 : 34; // (the rasp: the voice shakes)
    lg.gain.value = 0.35;
    rasp.gain.value = 0.65;
    lfo.connect(lg).connect(rasp.gain);
    src.connect(lp).connect(rasp);
    for (const [f, q, l] of [
      [620, 4, 1],
      [1050, 5, 0.6],
      [300, 2, 0.5],
    ]) {
      const b = a.createBiquadFilter(),
        bg = a.createGain();
      b.type = "bandpass";
      b.frequency.value = f * p;
      b.Q.value = q;
      bg.gain.value = l;
      rasp.connect(b).connect(bg).connect(g);
    }
    const peak = long ? 0.42 : 0.36,
      tau = long ? 0.1 : 0.04;
    g.gain.value = 0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.04);
    g.gain.setValueAtTime(peak, t + secs - 0.1);
    g.gain.setTargetAtTime(0, t + secs - 0.1, tau);
    g.connect(d);
    const end = t + secs - 0.1 + tau * 7;
    for (const x of [src, lfo]) {
      x.start(t);
      x.stop(end);
    }
    if (!long)
      hiss(a, d, t + 0.18, {
        type: "lowpass",
        f: 600,
        peak: 0.04,
        att: 0.03,
        dur: 0.1,
        tau: 0.06,
      }); // (a wet gurgle after)
  },
};
addSounds(SOUNDS, {
  l4step: 600,
  l4zstep: 700,
  l4slot: 7000,
  l4round: 11000,
  l4groan: 1500,
});

/* ---------- when ---------- */
const STRIDE = 44, // world px a duck walks for each footstep
  Z_STRIDE = 40, // … and a zombie (they shuffle)
  Z_STEPS = 4, // zombie footsteps heard at once at most (the nearest ones, a close group as one)
  GROUP = 160, // world px: zombies this close together are one group (one voice, one set of footsteps)
  GROAN = [6000, 12000], // ms between one zombie's groans
  GROANS = 2, // groans at once at most
  HEAR = 1500; // world px: farther off, nothing (as Duck Cabin's FAR)
let st = null;
function fresh() {
  return {
    brd: null,
    box: {},
    pts: {},
    r: -1,
    ducks: new Map(),
    z: new Map(),
    zAt: 0,
    groans: [],
  };
}
export function l4Reset() {
  st = fresh();
}

/* the state's news: boards up and down, a spin, a sale, a new round, the zombies' new spots */
export function l4Hear(s, ctx) {
  if (!st) st = fresh();
  const h = s.hang,
    L = h.l4,
    now = performance.now();
  /* the boards: one up is a nail, one down a crack (many up at once is a new game putting them all back: quiet) */
  const brd = h.brd || {};
  if (st.brd) {
    const d = (o) => (brd[o.id] || 0) - (st.brd[o.id] || 0),
      ups = OPENINGS.filter((o) => d(o) > 0);
    for (const o of OPENINGS)
      if (d(o) < 0) play("l4crack", { x: o.x, y: o.y });
      else if (d(o) === 1 && ups.length <= 2)
        play("l4nail", { x: o.x, y: o.y });
  }
  st.brd = { ...brd };
  /* the fireplace: a new spin (by anyone) */
  const box = h.l4box || {};
  for (const [id, b] of Object.entries(box))
    if (b && b.t && (st.box[id] || 0) !== b.t) {
      if (st.r >= 0)
        play("l4slot", { x: BOX.x, y: BOX.y, secs: BOX.spin / 1000 });
      st.box[id] = b.t;
    }
  /* a sale: someone's points went down by the Butler (the fireplace's spin is the slot machine instead) */
  for (const id of s.seat || []) {
    const n = ptsOf(s, id),
      was = st.pts[id],
      a = ctx.world.at(id);
    if (
      was !== undefined &&
      n < was &&
      a &&
      Math.hypot(a.x - BUTLER.x, a.y - BUTLER.y) < 320
    )
      play("l4till", { x: BUTLER.x, y: BUTLER.y });
    st.pts[id] = n;
  }
  /* a new round (not the first look at the game) */
  if (L && L.r !== st.r) {
    if (st.r >= 0 && L.r > st.r && L.r > 0) play("l4round", { k: 0.6 });
    st.r = L.r;
  }
  /* the zombies: how fast each is going, from its last two spots */
  const seen = new Set(),
    gap = Math.max(0.1, Math.min(0.5, (now - (st.zAt || now - 200)) / 1000));
  for (const z of zombiesOf(s)) {
    seen.add(z.i);
    let o = st.z.get(z.i);
    if (!o) {
      o = {
        x: z.x,
        y: z.y,
        v: 0,
        acc: rnd(0, Z_STRIDE),
        next: now + rnd(1500, GROAN[1]),
      };
      st.z.set(z.i, o);
    } else if (z.x !== o.x || z.y !== o.y) {
      const dd = Math.hypot(z.x - o.x, z.y - o.y);
      o.v = dd > 300 ? 0 : dd / gap;
      o.x = z.x;
      o.y = z.y;
    } else o.v = 0;
    o.st = z.st;
  }
  st.zAt = now;
  for (const i of st.z.keys()) if (!seen.has(i)) st.z.delete(i);
}

/* every frame: footsteps (mine and every duck's, the zombies' quieter) and the groans */
export function l4Steps(dt, ctx) {
  if (!st) return;
  const s = ctx.state();
  if (!s || !s.hang || !s.hang.l4) return;
  const now = performance.now(),
    me = ctx.world.at(ctx.me);
  for (const id of s.seat || []) {
    const a = ctx.world.at(id);
    if (!a) continue;
    let o = st.ducks.get(id);
    if (!o) st.ducks.set(id, (o = { x: a.x, y: a.y, acc: 0 }));
    const dd = Math.hypot(a.x - o.x, a.y - o.y),
      air = a.z - heightAt(a.x, a.y) > 4; // (in a jump: no footsteps)
    o.x = a.x;
    o.y = a.y;
    if (dd > 60 || air) continue; // (60: a jump back to a start spot)
    o.acc += dd;
    if (o.acc >= STRIDE) {
      o.acc %= STRIDE;
      play("l4step", { x: a.x, y: a.y, k: id === ctx.me ? 0.8 : 0.6 });
    }
  }
  if (!me) return;
  /* the zombies: the nearest first, each close group as one */
  const live = [...st.z.values()]
    .filter((o) => o.st !== 3)
    .map((o) => ({ o, d: Math.hypot(o.x - me.x, o.y - me.y) }))
    .filter((e) => e.d < HEAR)
    .sort((p, q) => p.d - q.d);
  const lead = [];
  for (const e of live) {
    const g = lead.find(
      (l) => Math.hypot(l.o.x - e.o.x, l.o.y - e.o.y) < GROUP,
    );
    if (g) g.n++;
    else lead.push({ ...e, n: 1 });
  }
  let steps = 0;
  for (const l of lead) {
    const o = l.o;
    o.acc += o.v * dt;
    if (o.acc >= Z_STRIDE) {
      o.acc %= Z_STRIDE;
      if (steps++ < Z_STEPS)
        play("l4zstep", { x: o.x, y: o.y, k: Math.min(0.6, 0.4 + 0.05 * l.n) });
    }
  }
  st.groans = st.groans.filter((t) => now - t < 1200);
  for (const l of lead) {
    const o = l.o;
    if (now < o.next) continue;
    o.next = now + rnd(GROAN[0], GROAN[1]) / Math.min(2, Math.sqrt(l.n)); // (a group groans a little more often than one alone, never as often as all of them would)
    if (st.groans.length >= GROANS) continue;
    st.groans.push(now);
    play("l4groan", {
      x: o.x,
      y: o.y,
      v: Math.random() < 0.6 ? 0 : 1,
      p: rnd(0.85, 1.15),
      k: 0.9,
    });
  }
}
