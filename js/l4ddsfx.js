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
import { heightAt } from "./hangout/layout.js";
import { OPENINGS, BUTLER, BOX, zombiesOf, ptsOf } from "./l4ddrules.js";

const rnd = (a, b) => a + Math.random() * (b - a);
export const SOUNDS = {};

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
    fx: -1,
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
  /* a new round (not the first look at the game) */
  if (L && L.r !== st.r) {
    if (st.r >= 0 && L.r > st.r && L.r > 0) play("l4round"); // (everywhere alike: no x, y)
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
      play("step", { x: a.x, y: a.y, k: id === ctx.me ? 1 : 0.7 });
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
        play("zstep", {
          x: o.x,
          y: o.y,
          k: Math.min(1, 0.7 + 0.08 * l.n),
        });
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
