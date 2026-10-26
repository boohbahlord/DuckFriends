/* ---------- the pool: ducks in the water, ripples and splashes ----------
   A duck whose feet reach the water (walking down the steps at the west end, walking off the edge, or jumping in)
   floats: it sits a little way into the water with a gentle bob, the part under the water hidden below a waterline with
   a ring of water round it, and it swims at a little over half its walking speed. Ripples spread round a duck as it
   swims (and slowly while it floats still), and a splash goes up as it comes in (small down the steps, big from a jump)
   and as it jumps out. Nothing here goes over the network: every screen works it out from where the ducks are drawn, so
   everyone sees everyone's ripples and splashes. The lane rope, the pool and these ripples all lie under every duck and
   everything a duck wears or shows; a splash is drawn just in front of its own duck.
   Other things in the water use it too: ripple(x, y, k) and splash(x, y, k) at a spot on the water (world px). */
import { activity } from './registry.js';
import { POOL, SLOPE, DUCK, W as BW, H as BH, heightAt, inPool } from './layout.js';
import { sfx } from '../sound.js';

export const WATER = POOL.h;   // the water's surface: a duck floats with its feet there
const SINK = 16;               // how far into the water a floating duck sits (world px)
const SLOW = .55;              // swimming speed, of walking speed
/* a duck at (x, y) with its feet at z is in the water (not on the steps) */
export const swimming = (x, y, z) => inPool(x, y) && heightAt(x, y) === WATER && z <= WATER + 4;
/* the water's near strip (as deep as the water is under the ground) is hidden under the near coping on the screen: what
   floats keeps north of SOUTH, at the coping's edge on the screen */
const NEAR = SLOPE.low - WATER;
export const SOUTH = POOL.y1 - NEAR - 12;
/* the water seen on the screen (world px, as drawn: a spot on the water at y is drawn at y − WATER): the near edge hides
   behind the near coping, which stands on the ground in front of it */
const BOX = { x0: POOL.x0, x1: POOL.x1, t: POOL.y0 - WATER, b: POOL.y1 - SLOPE.low };
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const still = () => document.documentElement.classList.contains('still');

/* ---------- ripples and splashes (anyone can make them) ---------- */
let T = 0;                 // the room's time, this frame (ms)
let layer = null;          // .hang-props: where splashes go, sorted with the ducks
const ripples = [];        // { x, y, t, life, r0, r1, a }
const splashes = [];       // { el, x, y, t, life, k, drops, crown, foam }
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
let seed = 0;
/* a ring that spreads on the water from (x, y); k: how big (a duck swimming about .5, a cannonball 1.5) */
export function ripple(x, y, k = .5, r0 = 26) {
  if (ripples.length > 180) ripples.splice(0, ripples.length - 180);
  ripples.push({ x, y, t: T, life: 900 + 900 * k, r0, r1: r0 + 40 + 90 * k, a: cl(.25 + .35 * k, .2, .75) });
}
/* water thrown up at (x, y): tongues of water round it that rise and fall back, and drops; k as for ripple. Drawn just
   behind the duck that made it (so the duck shows, the water round it) */
export function splash(x, y, k = .6) {
  ripple(x, y, k * 1.3); ripple(x, y, k * .7, 12);
  if (!layer || still()) return;
  const n = Math.round(5 + 7 * k), drops = [], m = k < .45 ? 3 : 5, tongues = [];
  for (let i = 0; i < n; i++) {
    const r = hash(++seed), q = hash(seed + .5), a = (i / n - .5) * 2.4 + (r - .5) * .4;
    drops.push({ vx: Math.sin(a) * (90 + 120 * k) * (.6 + q * .6), vy: (220 + 260 * k) * (.75 + r * .5) * Math.cos(a * .6), r: 2.6 + 2.6 * k * (.5 + q) });
  }
  for (let i = 0; i < m; i++) { const a = (i / (m - 1) - .5) * 1.9; tongues.push({ a, hf: 1 - .38 * Math.abs(a) + (hash(++seed) - .5) * .2 }); }
  tongues.sort((p, q) => Math.abs(q.a) - Math.abs(p.a));   // (the middle one in front)
  const w = 170 * k + 70, h = 200 * k + 60;
  const el = document.createElement('div');
  el.className = 'hang-splash';
  el.style.zIndex = Math.round(y) + 9;
  el.innerHTML = `<svg viewBox="${-w / 2} ${-h} ${w} ${h + 20}" width="${w}" height="${h + 20}" style="left:${-w / 2}px;top:${-h}px" aria-hidden="true">`
    + '<ellipse class="hs-foam" cx="0" cy="0" rx="10" ry="4"/>' + tongues.map(() => '<path class="hs-tongue"/><circle class="hs-drop" r="0"/>').join('') + drops.map(() => '<circle class="hs-drop" r="0"/>').join('') + '</svg>';
  layer.append(el);
  const cs = [...el.querySelectorAll('.hs-drop')];
  splashes.push({ el, x, y, t: T, life: 650 + 350 * k, k, drops, tongues, svgDrops: cs.slice(m), tips: cs.slice(0, m), paths: [...el.querySelectorAll('.hs-tongue')], foam: el.querySelector('.hs-foam') });
}
function drawSplash(p, toScreen, sc) {
  const age = T - p.t, u = age / p.life;
  if (u >= 1 || age < 0) { p.el.remove(); return false; }
  const at = toScreen(p.x, p.y, WATER);
  p.el.style.transform = `translate(${at.left.toFixed(1)}px, ${at.top.toFixed(1)}px) scale(${sc.toFixed(4)})`;
  const s = age / 1000, G = 1300, f = n => n.toFixed(1);
  p.drops.forEach((d, i) => {
    const y = -(d.vy * s - G * s * s / 2), c = p.svgDrops[i];
    if (y > 2) { c.setAttribute('r', 0); return; }
    c.setAttribute('cx', f(d.vx * s)); c.setAttribute('cy', f(y)); c.setAttribute('r', f(d.r * (1 - u * .4)));
  });
  /* the tongues: up fast, leaning out, then down */
  const env = Math.sin(Math.PI * cl(age / (300 + 180 * p.k), 0, 1)), cw = (18 + 22 * p.k) * (1 + u * .6), H = 34 + 58 * p.k, bw = cw * .42;
  p.tongues.forEach((t, i) => {
    const hh = H * t.hf * env, bx = Math.sin(t.a) * cw * .62, tx = bx + Math.sin(t.a) * (8 + 34 * u) * (.6 + p.k * .5);
    p.paths[i].setAttribute('d', hh < 2 ? '' : `M${f(bx - bw)} 0C${f(bx - bw * .6)} ${f(-hh * .4)} ${f(tx - bw * .3)} ${f(-hh * .78)} ${f(tx)} ${f(-hh)}C${f(tx + bw * .3)} ${f(-hh * .78)} ${f(bx + bw * .6)} ${f(-hh * .4)} ${f(bx + bw)} 0Z`);
    const c = p.tips[i]; c.setAttribute('cx', f(tx + Math.sin(t.a) * 3)); c.setAttribute('cy', f(-hh - 5 - 6 * u)); c.setAttribute('r', hh < 6 ? 0 : f((3 + 2.2 * p.k) * Math.min(1, env * 1.6)));
  });
  p.foam.setAttribute('rx', f(cw * 1.2)); p.foam.setAttribute('ry', f(cw * .34)); p.foam.style.opacity = (.55 * (1 - u)).toFixed(2);
  p.el.style.opacity = u > .75 ? ((1 - u) / .25).toFixed(2) : '';
  return true;
}

/* ---------- the ducks in the water ---------- */
const seen = new Map();   // id → { sw: in the water, z, top: where its way down began, rip: the last ripple, x, y, bob }
let water = null, wg = null, lastHit = 0;
function sound(k, mine) { if (mine) sfx.plunge(k); else if (T - lastHit > 250) { lastHit = T; sfx.plunge(k * .55); } }

activity({
  id: 'pool',
  mount(ctx) {
    layer = ctx.world.board.querySelector('.hang-props');
    water = document.createElement('canvas'); water.className = 'hang-water'; water.setAttribute('aria-hidden', 'true');
    layer.prepend(water); wg = water.getContext('2d');
  },
  unmount() {
    water?.remove(); water = wg = null;
    for (const p of splashes) p.el.remove();
    splashes.length = ripples.length = 0; seen.clear(); layer = null;
  },
  speed: pos => swimming(pos.x, pos.y, pos.z) ? SLOW : 1,
  /* my duck under the ground in the near strip (dropping in, or swimming up to the near edge) keeps north of it by as much
     as it is under the ground: on the screen it stays at the coping's edge, never over the coping */
  after(me) {
    const x = me.x * BW, y = me.y * BH, under = SLOPE.low - me.z;
    if (under <= 0 || !inPool(x, y)) return;
    const lim = POOL.y1 - Math.min(1, under / NEAR) * (POOL.y1 - SOUTH);
    if (y > lim) me.y = lim / BH;
  },
  step(dt, now, ctx) {
    T = now;
    const s = ctx.state(), me = ctx.me, here = ctx.world.at(me);
    for (const id of s.seat) {
      const a = ctx.world.at(id); if (!a) { seen.delete(id); continue; }
      const sw = swimming(a.x, a.y, a.z), gnd = heightAt(a.x, a.y);
      let o = seen.get(id);
      if (!o) { o = { sw, z: a.z, top: a.z, rip: 0, x: a.x, y: a.y, ph: hash(id.length * 7.3 + id.charCodeAt(0)) * 6.28 }; seen.set(id, o); }
      const near = here && Math.abs(a.x - here.x) < 900 && Math.abs(a.y - here.y) < 700;
      if (sw && !o.sw) {   // in: down the steps a toe in; off the edge a splash; from a jump a big one
        const drop = o.top - WATER, k = drop > 24 ? cl(drop / 130, .55, 1.5) : .3;
        splash(a.x, a.y, k); o.rip = now;
        if (near && (id === me || k >= .55)) sound(k, id === me);
      } else if (!sw && o.sw && inPool(a.x, a.y) && a.z > WATER + 3) {   // out, with a jump
        splash(a.x, a.y, .6); if (near && id === me) sfx.splash();
      }
      if (sw) {   // swimming: rings spread round it (fast while it swims, slowly while it floats)
        const v = Math.hypot(a.x - o.x, a.y - o.y) / Math.max(dt, .001);
        if (v > 25 ? now - o.rip > 150 : now - o.rip > 1300) { o.rip = now; ripple(a.x, a.y, v > 25 ? .45 : .22); }
        o.top = WATER;
      } else if (a.z <= gnd + 1 || a.z > o.z) o.top = a.z;   // (on the ground, or still going up: where its way down begins)
      o.sw = sw; o.z = a.z; o.x = a.x; o.y = a.y;
    }
    for (const id of [...seen.keys()]) if (!s.pos[id]) seen.delete(id);
  },
  draw(now, ctx) {
    const W = ctx.world, sc = W.sc, board = W.board;
    for (let i = splashes.length - 1; i >= 0; i--) if (!drawSplash(splashes[i], W.toScreen, sc)) splashes.splice(i, 1);
    /* the ducks: in the water, sunk to the waterline and bobbing */
    for (const d of board.querySelectorAll('.ducks .gduck')) {
      const o = seen.get(d.dataset.pid), sw = !!o && o.sw && !W.inside, body = d.querySelector('.gduck-body');
      if (!body) continue;
      if (sw) {
        const bob = Math.sin(now / 520 + o.ph) * 2.2, dip = ((SINK + bob) * sc).toFixed(1), tilt = (Math.sin(now / 760 + o.ph * 2) * 2.5).toFixed(1);
        if (d._dip !== dip) {
          d._dip = dip; body.style.translate = `0 ${dip}px`; body.style.rotate = `${tilt}deg`;
          body.style.clipPath = `polygon(-300% -300%, 400% -300%, 400% calc(100% - ${dip}px), -300% calc(100% - ${dip}px))`;
        }
        if (!d._swim) { d._swim = true; d.classList.add('hang-swim'); if (!d.querySelector('.hang-wl')) d.insertAdjacentHTML('beforeend', '<div class="hang-wl" aria-hidden="true"><svg viewBox="0 0 100 28" preserveAspectRatio="none"><path class="wl-front" d="M4 14A46 11 0 0 0 96 14"/><path class="wl-shine" d="M22 21Q34 25 46 23"/></svg></div>'); }
      } else if (d._swim) {
        d._swim = false; d._dip = null; d.classList.remove('hang-swim');
        body.style.translate = body.style.rotate = body.style.clipPath = '';
      }
    }
    /* the ripples, on a canvas of their own over the water (under every duck and prop) */
    if (!water) return;
    const vw = W.vw, vh = W.vh, dpr = Math.min(2, devicePixelRatio || 1);
    for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t > ripples[i].life || now < ripples[i].t - 1000) ripples.splice(i, 1);
    const a0 = W.toScreen(BOX.x0, BOX.t), a1 = W.toScreen(BOX.x1, BOX.b);
    const off = W.inside || a1.left < 0 || a0.left > vw || a1.top < 0 || a0.top > vh || (!ripples.length && ![...seen.values()].some(d => d.sw));
    if (off && water._clear) return;   // (nothing on it, and nothing to draw: the canvas is left alone)
    if (water.width !== Math.round(vw * dpr) || water.height !== Math.round(vh * dpr)) { water.width = Math.round(vw * dpr); water.height = Math.round(vh * dpr); }
    const g = wg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, water.width, water.height);
    water._clear = off; if (off) return;
    const o = W.toScreen(0, 0);
    g.setTransform(sc * dpr, 0, 0, sc * dpr, o.left * dpr, o.top * dpr);
    g.save(); g.beginPath(); g.rect(BOX.x0, BOX.t, BOX.x1 - BOX.x0, BOX.b - BOX.t); g.clip();
    g.lineCap = 'round';
    for (const r of ripples) {
      const u = (now - r.t) / r.life, e = 1 - (1 - u) * (1 - u), rad = r.r0 + (r.r1 - r.r0) * e;
      g.strokeStyle = `rgba(214, 252, 255, ${(r.a * (1 - u) ** 1.4).toFixed(3)})`; g.lineWidth = 3.2 - 1.6 * u;
      g.beginPath(); g.ellipse(r.x, r.y - WATER, rad, rad * .42, 0, 0, Math.PI * 2); g.stroke();
    }
    /* a soft ring of moving water round each floating duck (its back half shows behind the duck) */
    for (const [, d] of seen) if (d.sw) {
      const w = DUCK * .46 + Math.sin(now / 300 + d.ph) * 1.5;
      g.strokeStyle = 'rgba(214, 252, 255, .5)'; g.lineWidth = 2.6;
      g.beginPath(); g.ellipse(d.x, d.y - WATER, w, w * .3, 0, Math.PI, Math.PI * 2); g.stroke();
    }
    g.restore();
  },
});
