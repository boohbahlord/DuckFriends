/* ---------- Dead Ducks Arcade's sounds ----------
   What the owner asked for (Nov 4): footsteps for the ducks and quieter ones for the zombies, paced to how fast each
   moves; a board nailed up and a board torn off; the fireplace's spin as a slot machine and the Butler's sale as a cash
   register; a new round's sound, a faint, far-off, eerie swell that fades away; and the zombie ducks' groans, heard but
   not too often, a close group of them counting as one. Since Nov 16 each is a real recording (sound.js; the owner:
   "very quiet for ducks, even far quieter for zombies"); the boards, the spin, the sale and the groans are silent until
   their recordings come in the next batch.

     l4Hear(s, ctx)        on every new state: the boards, the spin, a sale, a new round, where the zombies are going
     l4Steps(dt, ctx)      every frame: the footsteps and the groans

   Each fades with its distance from my duck (sound.js), and the voices are capped (here a few footsteps and groans at
   once at most). */
import { play, loadSounds } from "./sound.js";
import { heightAt, layoutVariant } from "./hangout/layout.js";
import { OPENINGS, BUTLER, BOX, zombiesOf, ptsOf } from "./l4ddrules.js";
import { groundAt, stepOf } from "./ground.js";
import { isSurv } from "./survrules.js";
import { FILES } from "./sfxlist.js";
import { DUCK_LEN } from "./mgjrules.js";

const rnd = (a, b) => a + Math.random() * (b - a);
export const SOUNDS = {};

/* ---------- when ---------- */
const STRIDE = 44, // world px a duck walks for each footstep
  Z_STRIDE = 40, // … and a zombie (they shuffle)
  Z_STEPS = 4, // zombie footsteps heard at once at most (the nearest ones, a close group as one) …
  Z_PER_S = 6, // … and in a second (the owner OK'd it, Nov 18 14:50Z: a big mob's shuffle thinner, my own steps kept)
  GROUP = 160, // world px: zombies this close together are one group (one voice, one set of footsteps)
  GROAN = [6000, 12000], // ms between one zombie's groans
  GROANS = 2, // groans at once at most
  HEAR = 1500, // world px: farther off, nothing (as Duck Cabin's FAR)
  STROKE = 1.6, // swimming: a stroke's splash every this many steps' way
  Z_K = 0.45, // a zombie's step, of a duck's (the owner: "even far quieter for zombies"; in water too)
  FALL = 50, // world px: landing this far below where it jumped from is a fall (a thud), not a jump
  CLIMB = [450, 800], // ms between one zombie's rattles, climbing the fence (Downpour)
  CLIMBS = 2, // rattles at once at most (the nearest climbers)
  GM_SHOTS = 3, // Survival's gunmen: shots heard each time the state comes in, at most
  GM_K = 0.8, // … each as loud as this much of a duck's
  GM_GUN = { dbuck: "dbarrel" }; // (a gunman's gun whose sound has another name)
/* Downpour's church bell (sound.js "churchBell"), rung as each round starts: its four strikes, s after it starts
   (Noah's bell swings on these: bellStrikes()) */
export const BELL = [0.01, 2.12, 4.24, 6.35];
let bellAt = 0; // performance.now() when the bell last started
export const bellStrikes = () =>
  bellAt ? BELL.map((t) => bellAt + t * 1000) : null;
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
    fx: -1,
    drops: null,
    flash: null,
    clr: -1,
    first: true,
  };
}
export function l4Reset() {
  st = fresh();
  loadSounds("l4dd"); // (its own sounds, fetched as the mode starts)
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
  /* a sale: the rules' l4buy (ammo or a gun, anywhere: B) rings where the buyer stands; anything else bought by the
     Butler (his upgrades) is someone's points going down near him (the fireplace's spin is the slot machine instead) */
  const rang = new Set();
  if (st.fx < 0) st.fx = s.fxN || 0;
  if ((s.fxN || 0) > st.fx) {
    for (const f of s.fx || [])
      if (f.n > st.fx && f.kind === "l4buy") {
        const a = ctx.world.at(f.by);
        play("l4till", a ? { x: a.x, y: a.y } : {});
        rang.add(f.by);
      } else if (f.n > st.fx && f.kind === "l4defib") {
        /* Survival's defibrillator: the dead duck brought back, its shock where that duck lies */
        const a = ctx.world.at((f.who || [])[0] || f.by);
        play("defib", a ? { x: a.x, y: a.y } : {});
      }
    st.fx = s.fxN || 0;
  }
  for (const id of s.seat || []) {
    const n = ptsOf(s, id),
      was = st.pts[id],
      a = ctx.world.at(id);
    if (
      was !== undefined &&
      n < was &&
      !rang.has(id) &&
      a &&
      Math.hypot(a.x - BUTLER.x, a.y - BUTLER.y) < 320
    )
      play("l4till", { x: BUTLER.x, y: BUTLER.y });
    st.pts[id] = n;
  }
  /* a drop falling from a zombie: a chime where it lies (not the first look at the game) */
  const drops = h.l4dr || [];
  if (st.drops)
    for (const d of drops)
      if (!st.drops.has(d.n)) play("dropIn", { x: d.x, y: d.y });
  st.drops = new Set(drops.map((d) => d.n));
  /* a flashlight switched on or off (key 0): mine, or another duck's near me */
  const off = h.l4f || {};
  if (st.flash)
    for (const id of s.seat || [])
      if (!!off[id] !== !!st.flash[id]) {
        const a = ctx.world.at(id);
        play(off[id] ? "flashOff" : "flashOn", {
          k: id === ctx.me ? 1 : 0.6,
          ...(a && id !== ctx.me ? { x: a.x, y: a.y } : {}),
        });
      }
  st.flash = { ...off };
  /* a melee worn down to nothing breaks (l4ddrules.js wearDown): the one sound every item makes as it breaks (the
     owner, Nov 19), mine full, another duck's by how far it is; not for one already broken as I first look */
  const brk = h.l4brk;
  if (brk && st.brk !== brk.n) {
    const a = brk.by !== ctx.me && ctx.world.at(brk.by);
    if (!st.first) play("break", a ? { x: a.x, y: a.y } : {});
    st.brk = brk.n;
  }
  /* everyone's down: the game's ending, on both maps (not the new round's swell, not the bell: the owner, Nov 19), and
     only once (not for a game already over as I first look) */
  if (L && L.over && st.over !== L.over.at) {
    if (!st.first) play("l4over");
    st.over = L.over.at;
  }
  /* the merchant: a little shop bell as he gets to his spot, the same bell down as he runs off; from where he stands */
  const mc = h.l4m,
    mst = mc ? mc.st : "";
  if (mst !== st.mst) {
    if (!st.first && mc && (mst === "here" || mst === "out"))
      play(mst === "here" ? "merchantIn" : "merchantOut", { x: mc.x, y: mc.y });
    st.mst = mst;
  }
  /* Survival's gunmen (gunmenrules.js s.hang.gm.gb): a new last shot (sh[0]) is a shot, its gun's own sound where the
     gunman stands, a little quieter than a duck's; a few at most each time, so a firefight never drowns everything */
  const gb = (h.gm && h.gm.gb) || [],
    shot = st.gmShot || (st.gmShot = {});
  let shots = 0;
  for (const o of gb) {
    const t = (o.sh && o.sh[0]) || 0;
    if (shot[o.i] === t) continue;
    shot[o.i] = t;
    if (!t || st.first || o.d || shots++ >= GM_SHOTS) continue; // (not the shots already fired as I first look)
    play(GM_GUN[o.hw] || (FILES[o.hw] ? o.hw : "handgun"), {
      x: o.x,
      y: o.y,
      k: GM_K,
      yield: true,
    });
  }
  /* Survival has no rounds (its L.r is only a horde's level), so no new round's swell and no bell: a horde coming is
     many zombies groaning far off, and its last one down the air letting go (s.hang.sv's phases: survrules.js) */
  const sv = isSurv(s) && h.sv;
  if (sv && sv.ph !== st.sv) {
    if (!st.first && !L.over)
      if (sv.ph === "peak") play("svHorde");
      else if (sv.ph === "tail" && st.sv === "peak") play("svCalm");
    st.sv = sv.ph;
  }
  /* a new round (not the first look at the game, nor once it's over) */
  if (L && L.r !== st.r) {
    if (st.r >= 0 && L.r > st.r && L.r > 0 && !L.over && !isSurv(s)) {
      play("l4round"); // (everywhere alike: no x, y)
      if (layoutVariant() === "l4gs" && play("churchBell"))
        bellAt = performance.now(); // (Downpour: the church bell rings the round in, the owner's, Nov 17 12:28Z)
    }
    st.r = L.r;
  }
  /* every zombie of the round down (all of them came, none left standing): one chime, the last note of What the duck?
     (the owner's, Nov 17 12:28Z; not in Survival, which has svCalm above) */
  if (L && L.r > 0 && L.n > 0 && L.made >= L.n && st.clr !== L.r && !sv) {
    const up = zombiesOf(s).some((z) => z.st !== 3);
    if (!up) {
      if (!st.first) play("cleared"); // (not for a round already done as I first look)
      st.clr = L.r;
    }
  }
  st.first = false;
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
    if (!o) st.ducks.set(id, (o = { x: a.x, y: a.y, acc: 0, air: false }));
    const dd = Math.hypot(a.x - o.x, a.y - o.y),
      under = heightAt(a.x, a.y),
      air = a.z - under > 4, // (in a jump: no footsteps)
      k = id === ctx.me ? 1 : 0.7;
    /* a fall: off the deck, the balcony, a roof (the owner: "a falling sound for when you fall off the fence or the
       balcony (like the sound of the impact)"); landing where it jumped from, or higher, is only a jump */
    if (!air) {
      if (o.air && o.from - a.z > FALL && dd <= 60)
        play("thud", {
          x: a.x,
          y: a.y,
          z: a.z,
          k: k * Math.min(1, 0.5 + (o.from - a.z) / 400),
        });
      o.from = a.z; // (where it stands: what a jump or a fall starts from)
    }
    o.air = air;
    o.x = a.x;
    o.y = a.y;
    if (dd > 60 || air) continue; // (60: a jump back to a start spot)
    const g = groundAt(a.x, a.y, a.z),
      every = g === "deep" ? STRIDE * STROKE : STRIDE; // (swimming: a stroke, less often than steps)
    o.acc += dd;
    if (o.acc >= every) {
      o.acc %= every;
      play(stepOf(g), { x: a.x, y: a.y, z: a.z, k });
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
  let steps = 0,
    climbs = 0;
  const fence = layoutVariant() === "l4gs";
  for (const l of lead) {
    const o = l.o;
    /* climbing over the fence (Downpour; on the cabin, st 4 is in through a window): its rattle, now and then */
    if (o.st === 4 && fence) {
      if (now >= (o.rattle || 0) && climbs++ < CLIMBS) {
        o.rattle = now + rnd(CLIMB[0], CLIMB[1]);
        play("climb", { x: o.x, y: o.y, k: Math.min(1, 0.8 + 0.1 * l.n) });
      }
      continue;
    }
    o.acc += o.v * dt;
    const z = heightAt(o.x, o.y),
      g = groundAt(o.x, o.y, z),
      every = g === "deep" ? Z_STRIDE * STROKE : Z_STRIDE;
    if (o.acc >= every) {
      o.acc %= every;
      st.zsteps = (st.zsteps || []).filter((t) => now - t < 1000);
      if (steps++ < Z_STEPS && st.zsteps.length < Z_PER_S) {
        st.zsteps.push(now);
        const n = Math.min(1, 0.7 + 0.08 * l.n);
        if (g === "wood")
          play("zstep", { x: o.x, y: o.y, z, k: n, yield: true });
        // (their shuffle on floors, as before; elsewhere the ground's step, lower and quieter)
        else
          play(stepOf(g), {
            x: o.x,
            y: o.y,
            z,
            k: n * Z_K,
            rate: rnd(0.8, 0.88),
            yield: true, // (a duck's step is never cut for a zombie's)
          });
      }
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
      rate: rnd(0.88, 1.12), // (the same groans, never twice at quite the same pitch)
      k: 0.9,
    });
  }
}

/* ---------- Mad God Justin's zombie waves ----------
   His wave zombies (mgjrules.js s.mz) shuffle and groan as Quacky Zombies' do (Adam, Nov 19, for the owner's "this is
   the new feel and vibe of the game"). They walk the board, where every sound is heard by all (no distances): so the
   same caps as above, a close group as one, and quieter than in Quacky Zombies. game.js calls this every frame. */
const MZ = {
  STRIDE: 0.7, // duck lengths a wave zombie walks for each footstep
  GROUP: 2, // duck lengths: wave zombies this close together are one group
  JUMP: 2, // duck lengths: a move longer than this in one frame is a new spot (a spawn), not a walk
  K: 0.55, // a wave zombie's step, of a duck's
  GROAN_K: 0.7,
  MOST: 60, // (heard at most: Sandbox can have 800 on the board, and the grouping below would cost too much for them all)
};
let mz = null; // { z: Map(i → { x, y, acc, next }), steps: [], groans: [] }
export function mgjSteps(s) {
  const zb =
    (s && (s.phase === "boss" || s.phase === "sandbox") && s.mz && s.mz.zb) ||
    null; // (and Sandbox's board: its spawns' zombies)
  if (!zb || !zb.length) {
    mz = null; // (no waves: start fresh next time)
    return;
  }
  if (!mz) {
    mz = { z: new Map(), steps: [], groans: [] };
    loadSounds("l4dd"); // (zstep and l4groan: fetched once, as the first wave comes)
  }
  const now = performance.now(),
    len = (dx, dy) => Math.hypot(dx / DUCK_LEN.x, dy / DUCK_LEN.y),
    seen = new Set(),
    lead = [];
  let heard = 0;
  for (const o of zb) {
    if (o.d) continue; // (dead: no steps, no groans)
    if (++heard > MZ.MOST) break;
    seen.add(o.i);
    let z = mz.z.get(o.i);
    if (!z) {
      mz.z.set(
        o.i,
        (z = { x: o.x, y: o.y, acc: 0, next: now + rnd(0, GROAN[1]) }),
      );
      continue;
    }
    const d = len(o.x - z.x, o.y - z.y);
    z.x = o.x;
    z.y = o.y;
    if (d < MZ.JUMP) z.acc += d;
    const g = lead.find((l) => len(l.z.x - z.x, l.z.y - z.y) < MZ.GROUP);
    if (g) {
      g.n++;
      g.acc = Math.max(g.acc, z.acc);
      z.acc %= MZ.STRIDE; // (the group's leader steps for it)
    } else lead.push({ z, n: 1, acc: z.acc });
  }
  for (const i of mz.z.keys()) if (!seen.has(i)) mz.z.delete(i);
  mz.steps = mz.steps.filter((t) => now - t < 1000);
  let steps = 0;
  for (const l of lead) {
    if (l.acc < MZ.STRIDE) continue;
    l.z.acc %= MZ.STRIDE;
    if (steps++ >= Z_STEPS || mz.steps.length >= Z_PER_S) continue;
    mz.steps.push(now);
    play("zstep", {
      k: MZ.K * Math.min(1, 0.7 + 0.08 * l.n),
      rate: rnd(0.92, 1.08),
      yield: true, // (a duck's step is never cut for a zombie's)
    });
  }
  mz.groans = mz.groans.filter((t) => now - t < 1200);
  for (const l of lead) {
    if (now < l.z.next) continue;
    l.z.next = now + rnd(GROAN[0], GROAN[1]) / Math.min(2, Math.sqrt(l.n));
    if (mz.groans.length >= GROANS) continue;
    mz.groans.push(now);
    play("l4groan", { rate: rnd(0.88, 1.12), k: MZ.GROAN_K, yield: true });
  }
}
