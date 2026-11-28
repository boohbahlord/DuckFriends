/* ---------- Dead Ducks Arcade's sounds ----------
   What the owner asked for (Nov 4): footsteps for the ducks and quieter ones for the zombies, paced to how fast each
   moves; a board nailed up and a board torn off; the Butler's sale as a cash register; a new round's sound, a faint, far-off, eerie swell that fades away; and the zombie ducks' groans, heard but
   not too often, a close group of them counting as one. Since Nov 16 each is a real recording (sound.js; the owner:
   "very quiet for ducks, even far quieter for zombies"); the boards, the sale and the groans are silent until
   their recordings come in the next batch.

     l4Hear(s, ctx)        on every new state: the boards, a sale, a new round, where the zombies are going
     l4Steps(dt, ctx)      every frame: the footsteps and the groans
     boardSteps(s), sbSteps(ctx)   every frame: Sandbox's NPCs', on the board and on a world (below)

   Each fades with its distance from my duck (sound.js), and the voices are capped (here a few footsteps and groans at
   once at most). */
import { play, loadSounds } from "./sound.js";
import { heightAt, layoutVariant } from "./hangout/layout.js";
import { OPENINGS, BUTLER, ptsOf } from "./l4ddrules.js";
import { zombiesOf } from "./zombies.js";
import { groundAt, stepOf } from "./ground.js";

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
  NEAR_MOST = 40, // only the nearest this many walkers count for their steps and groans (Sandbox can have 800: grouping them all would cost too much each frame)
  WINDUPS = 3, // zombies' wind-up growls in a second at most (the nearest first: the tell of a swing, from its wu)
  WINDUP_K = 1; // (sound.js VOL.zwindup sets how quiet)
/* the budgets every walker shares, whichever path asks (who: "l4" the map's zombies, "mz" the board's zombies, "sb"
   Sandbox's own): Z_PER_S steps a second, GROANS groans in 1.2 s; while another path is asking too, one takes at most two thirds
   of it, so a crowd of one kind never silences the other (Sandbox's ducks beside a zombie map's mob) */
const crowd = { steps: [], groans: [], windups: [], asked: {} };
function allow(k, ms, most, now, who) {
  const a = crowd[k],
    asked = (crowd.asked[k] = crowd.asked[k] || {});
  asked[who] = now;
  while (a.length && now - a[0].t >= ms) a.shift();
  const shared = Object.keys(asked).some(
    (o) => o !== who && now - asked[o] < ms,
  ); // (another path wanted one lately)
  if (
    a.length >= most ||
    (shared &&
      a.filter((e) => e.who === who).length >= Math.round((most * 2) / 3))
  )
    return false;
  a.push({ t: now, who });
  return true;
}
/* Downpour's church bell (sound.js "churchBell"), rung as each round starts: its four strikes, s after it starts
   (Noah's bell swings on these: bellStrikes()) */
const BELL = [0.01, 2.12, 4.24, 6.35];
let bellAt = 0; // performance.now() when the bell last started
export const bellStrikes = () =>
  bellAt ? BELL.map((t) => bellAt + t * 1000) : null;
let st = null;
function fresh() {
  return {
    brd: null,
    pts: {},
    r: -1,
    ducks: new Map(),
    z: new Map(),
    zAt: 0,
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

/* the state's news: boards up and down, a sale, a new round, the zombies' new spots */
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
  /* a sale: the rules' l4buy (ammo or a gun, anywhere: B) rings where the buyer stands; anything else bought by the
     Butler (his upgrades) is someone's points going down near him */
  const rang = new Set();
  if (st.fx < 0) st.fx = s.fxN || 0;
  if ((s.fxN || 0) > st.fx) {
    for (const f of s.fx || [])
      if (f.n > st.fx && f.kind === "l4buy") {
        const a = ctx.world.at(f.by);
        play("l4till", a ? { x: a.x, y: a.y } : {});
        rang.add(f.by);
      } else if (f.n > st.fx && f.kind === "l4heli")
        play("heli"); // (the supply crate's helicopter, heard everywhere: the rules' crateCome)
      else if (f.n > st.fx && f.kind === "l4thud")
        play("thud", { x: f.x, y: f.y }); // (the supply crate lands: the rules' crateTick)
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
  const same = h.l4m === st.mA && h.l4mx === st.mB; // (nothing to hear unless one of them changed)
  const mst = same ? st.mst : {}; // (each one here, by his visit: several can be)
  if (!same) [st.mA, st.mB] = [h.l4m, h.l4mx];
  for (const mc of same ? [] : [h.l4m, ...(h.l4mx || [])]) {
    if (!mc) continue;
    mst[mc.v] = mc.st;
    if (
      mc.st !== (st.mst || {})[mc.v] &&
      !st.first &&
      (mc.st === "here" || mc.st === "out")
    )
      play(mc.st === "here" ? "merchantIn" : "merchantOut", {
        x: mc.x,
        y: mc.y,
      });
  }
  st.mst = mst;
  /* a new round (not the first look at the game, nor once it's over) */
  if (L && L.r !== st.r) {
    if (st.r >= 0 && L.r > st.r && L.r > 0 && !L.over) {
      play("l4round"); // (everywhere alike: no x, y)
      if (layoutVariant() === "l4gs" && play("churchBell"))
        bellAt = performance.now(); // (Downpour: the church bell rings the round in, the owner's, Nov 17 12:28Z)
    }
    st.r = L.r;
  }
  /* every zombie of the round down (all of them came, none left standing): one chime, the last note of What the duck?
     (the owner's, Nov 17 12:28Z) */
  if (L && L.r > 0 && L.n > 0 && L.made >= L.n && st.clr !== L.r) {
    const up = zombiesOf(s).some((z) => z.st !== 3);
    if (!up) {
      if (!st.first) play("cleared"); // (not for a round already done as I first look)
      st.clr = L.r;
    }
  }
  st.first = false;
  /* the zombies: how fast each is going, from its last two spots */
  const seen = new Set(),
    gap = Math.max(0.1, Math.min(0.5, (now - (st.zAt || now - 200)) / 1000)),
    me = ctx && ctx.world && ctx.world.at(ctx.me),
    winding = [];
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
        wu: z.wu,
      };
      st.z.set(z.i, o);
    } else {
      if (z.wu && z.wu !== o.wu && z.st !== 3) winding.push(z); // (a swing winding up: its tell)
      if (z.x !== o.x || z.y !== o.y) {
        const dd = Math.hypot(z.x - o.x, z.y - o.y);
        o.v = dd > 300 ? 0 : dd / gap;
        o.x = z.x;
        o.y = z.y;
      } else o.v = 0;
    }
    o.wu = z.wu;
    o.st = z.st;
  }
  st.zAt = now;
  for (const i of st.z.keys()) if (!seen.has(i)) st.z.delete(i);
  if (me)
    winding.sort(
      (p, q) =>
        Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y),
    );
  for (const z of winding)
    if (allow("windups", 1000, WINDUPS, now, "l4"))
      windup({ x: z.x, y: z.y, z: heightAt(z.x, z.y) });
}

/* a zombie winding up its swing (the owner, Nov 21: "maybe there's like a sound effect when the zombie's about to hit as a
   tell"; his pick, B2, "More like it, please"): one of the growls, quiet, never cutting another sound */
const windup = (at) =>
  play("zwindup", { k: WINDUP_K, ...at, rate: rnd(0.94, 1.06), yield: true });

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
    .sort((p, q) => p.d - q.d)
    .slice(0, NEAR_MOST);
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
      if (steps++ < Z_STEPS && allow("steps", 1000, Z_PER_S, now, "l4")) {
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
  for (const l of lead) {
    const o = l.o;
    if (now < o.next) continue;
    o.next = now + rnd(GROAN[0], GROAN[1]) / Math.min(2, Math.sqrt(l.n)); // (a group groans a little more often than one alone, never as often as all of them would)
    if (!allow("groans", 1200, GROANS, now, "l4")) continue;
    play("l4groan", {
      x: o.x,
      y: o.y,
      rate: rnd(0.88, 1.12), // (the same groans, never twice at quite the same pitch)
      k: 0.9,
    });
  }
}

/* ---------- every other walker: Sandbox's own, on the board and on a world ----------
   They shuffle and groan as Quacky Zombies' do (Adam, Nov 19, for the owner's "this is the new feel and vibe of the
   game"). Sandbox's spawns (the owner's spawn list: "Blank NPC /
   zombie / Justin / NPCs from Test Mode / Custom NPCs"): on the board in s.mz.zb, on Duck Cabin and the zombie maps in
   s.hang.sbz.zb (sbcabin.js). A zombie shuffles and groans; every other kind steps as a duck does, quieter, and never
   groans. Only the nearest NEAR_MOST count, a close group of one kind as one, inside the same budgets as the map's
   zombies (crowd). On the board every sound is heard by all (no distances; game.js calls boardSteps every frame); on a
   world each fades with its distance from my duck (sbsfx.js calls sbSteps every frame). */
const MZ = {
  STRIDE: 0.7, // duck lengths a board zombie walks for each footstep
  GROUP: 2, // duck lengths: board zombies this close together are one group
  JUMP: 2, // duck lengths: a move longer than this in one frame is a new spot (a spawn), not a walk
  K: 0.55, // a board zombie's step, of a duck's
  GROAN_K: 0.7,
};
const DUCK_K = 0.55; // a Sandbox duck's step (a Blank NPC, Justin, a Test NPC, a made one), of mine

/* list's walkers ({ i, x, y, d (dead), k (its kind; none: a zombie) }), kept in pool (i → { x, y, acc, next, z }); o: len
   (a distance), stride, group, jump (in len's units), me (where I stand, or null: all alike), hear, who (its share of
   crowd), step(w, n), groan(w) */
function walk(pool, list, now, o) {
  const seen = new Set(),
    near = [];
  for (const b of list) {
    if (b.d) continue; // (dead: no steps, no groans)
    seen.add(b.i);
    const w = pool.get(b.i);
    if (!w) {
      pool.set(b.i, {
        x: b.x,
        y: b.y,
        acc: 0,
        next: now + rnd(0, GROAN[1]),
        z: !b.k,
        wu: b.wu,
      });
      continue;
    }
    if (
      b.wu &&
      b.wu !== w.wu &&
      o.windup &&
      allow("windups", 1000, WINDUPS, now, o.who)
    )
      o.windup(w); // (a swing winding up: its tell)
    w.wu = b.wu;
    const d = o.len(b.x - w.x, b.y - w.y);
    w.x = b.x;
    w.y = b.y;
    if (d < o.jump) w.acc += d;
    const far = o.me ? o.len(b.x - o.me.x, b.y - o.me.y) : 0;
    if (far < o.hear) near.push({ w, far });
  }
  for (const i of pool.keys()) if (!seen.has(i)) pool.delete(i);
  if (o.me) near.sort((p, q) => p.far - q.far);
  const lead = [];
  for (const { w } of near.slice(0, NEAR_MOST)) {
    const g = lead.find(
      (l) => l.w.z === w.z && o.len(l.w.x - w.x, l.w.y - w.y) < o.group,
    );
    if (g) {
      g.n++;
      g.acc = Math.max(g.acc, w.acc);
      w.acc %= o.stride; // (the group's leader steps for it)
    } else lead.push({ w, n: 1, acc: w.acc });
  }
  let steps = 0;
  for (const l of lead) {
    if (l.acc < o.stride) continue;
    l.w.acc %= o.stride;
    if (steps++ >= Z_STEPS || !allow("steps", 1000, Z_PER_S, now, o.who))
      continue;
    o.step(l.w, Math.min(1, 0.7 + 0.08 * l.n));
  }
  for (const l of lead) {
    if (!l.w.z || now < l.w.next) continue;
    l.w.next = now + rnd(GROAN[0], GROAN[1]) / Math.min(2, Math.sqrt(l.n)); // (a group groans a little more often than one alone)
    if (allow("groans", 1200, GROANS, now, o.who)) o.groan(l.w);
  }
}

let mz = null; // the board's walkers (walk's pool)
const DUCK_LEN = { x: 0.03, y: 0.08 }; // (a duck's length on the board, in its widths and heights)
export function boardSteps(s) {
  const zb = (s && s.phase === "sandbox" && s.mz && s.mz.zb) || null; // (Sandbox's board: its spawns)
  if (!zb || !zb.length) {
    mz = null; // (none: start fresh next time)
    return;
  }
  if (!mz) {
    mz = new Map();
    loadSounds("l4dd"); // (zstep and l4groan: fetched once, as the first wave comes)
  }
  walk(mz, zb, performance.now(), {
    len: (dx, dy) => Math.hypot(dx / DUCK_LEN.x, dy / DUCK_LEN.y),
    stride: MZ.STRIDE,
    group: MZ.GROUP,
    jump: MZ.JUMP,
    me: null,
    hear: Infinity,
    who: "mz",
    step: (w, n) =>
      w.z
        ? play("zstep", {
            k: MZ.K * n,
            rate: rnd(0.92, 1.08),
            yield: true, // (a duck's step is never cut for a zombie's)
          })
        : play("step", { k: DUCK_K * n, rate: rnd(0.92, 1.08), yield: true }),
    groan: () =>
      play("l4groan", { rate: rnd(0.88, 1.12), k: MZ.GROAN_K, yield: true }),
    windup: () => windup({ k: MZ.GROAN_K }),
  });
}

let sbw = null; // Sandbox's own on a world (walk's pool)
export function sbSteps(ctx) {
  const s = ctx.state(),
    zb = s && s.hang && s.hang.sbz && s.hang.sbz.zb,
    me = zb && zb.length && ctx.world.at(ctx.me);
  if (!me) {
    sbw = null;
    return;
  }
  if (!sbw) {
    sbw = new Map();
    loadSounds("l4dd");
  }
  walk(sbw, zb, performance.now(), {
    len: Math.hypot,
    stride: Z_STRIDE,
    group: GROUP,
    jump: 60, // (60: a jump to a spawn)
    me,
    hear: HEAR,
    who: "sb",
    step(w, n) {
      const z = heightAt(w.x, w.y),
        g = groundAt(w.x, w.y, z);
      if (w.z && g === "wood")
        play("zstep", { x: w.x, y: w.y, z, k: n, yield: true });
      else
        play(stepOf(g), {
          x: w.x,
          y: w.y,
          z,
          k: n * (w.z ? Z_K : DUCK_K),
          rate: w.z ? rnd(0.8, 0.88) : rnd(0.94, 1.06),
          yield: true,
        });
    },
    groan: (w) =>
      play("l4groan", { x: w.x, y: w.y, rate: rnd(0.88, 1.12), k: 0.9 }),
    windup: (w) => windup({ x: w.x, y: w.y, z: heightAt(w.x, w.y) }),
  });
}
