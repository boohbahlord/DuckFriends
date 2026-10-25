/* ---------- falling a long way (off the deck, over its railing) ----------
   A duck dropping more than a duck height or so (not jumping: falling) flails, wobbling round as it goes down, and a puff
   of dust goes up where it lands (in the water it splashes instead: water.js). Worked out on every screen from where
   the ducks are drawn, for everyone's duck. My own duck's slide whistle and thud are game.js's. */
import { activity } from './registry.js';
import { heightAt } from './layout.js';
import { swimming } from './water.js';

const FLAIL = 60, PUFF = 90;   // flails with more than this under it; a puff when it fell more than this
const seen = new Map();        // id → { top, fall }
let puffs = [], layer = null;
const still = () => document.documentElement.classList.contains('still');
/* a puff of dust at (x, y) on ground at height z; k: how hard it landed (0 … 1.4) */
export function dust(x, y, z, k = 1) {
  if (!layer || still()) return;
  const el = document.createElement('div'); el.className = 'hang-dust'; el.style.zIndex = Math.round(y) + 9;   // (round its feet, behind it)
  const n = 8, bits = Array.from({ length: n }, (_, i) => ({ a: Math.PI * (i / (n - 1)), r: 5 + (i % 3) * 2.2 }));
  el.innerHTML = `<svg viewBox="-90 -60 180 80" width="180" height="80" aria-hidden="true">${bits.map(() => '<circle class="hd-bit" r="0"/>').join('')}</svg>`;
  layer.append(el);
  puffs.push({ el, x, y, z, k, t: performance.now(), bits, cs: [...el.querySelectorAll('circle')] });
}

activity({
  id: 'falls',
  mount(ctx) { layer = ctx.world.board.querySelector('.hang-props'); },
  unmount() { puffs.forEach(p => p.el.remove()); puffs = []; seen.clear(); layer = null; },
  step(dt, now, ctx) {
    const s = ctx.state(), mine = ctx.duck();
    for (const id of s.seat) {
      const a = ctx.world.at(id), p = s.pos[id]; if (!a || !p) continue;
      const gnd = heightAt(a.x, a.y), up = a.z - gnd;
      const falling = id === ctx.me && mine ? mine.vz != null && !mine.j : !p.j && up > 2;
      let o = seen.get(id); if (!o) { o = { top: a.z, fall: false, z: a.z }; seen.set(id, o); }
      if (falling) { o.top = Math.max(o.top, a.z); o.fall = o.fall || up > FLAIL; }
      else {
        if (o.fall && o.top - a.z > PUFF && up <= 2 && !swimming(a.x, a.y, a.z)) dust(a.x, a.y, a.z, Math.min(1.4, (o.top - a.z) / 200));
        o.top = a.z; o.fall = false;
      }
      o.flail = falling && o.fall;
    }
    for (const id of [...seen.keys()]) if (!s.pos[id]) seen.delete(id);
  },
  draw(now, ctx) {
    const Wd = ctx.world;
    for (const d of Wd.board.querySelectorAll('.ducks .gduck')) {
      const o = seen.get(d.dataset.pid), f = !!o && !!o.flail;
      if (d._flail !== f) { d._flail = f; d.classList.toggle('hang-flail', f); }
    }
    const t = performance.now();
    puffs = puffs.filter(p => {
      const u = (t - p.t) / 650; if (u >= 1) { p.el.remove(); return false; }
      const at = Wd.toScreen(p.x, p.y, p.z), e = 1 - (1 - u) ** 3;
      p.el.style.transform = `translate(${at.left.toFixed(1)}px, ${at.top.toFixed(1)}px) scale(${(Wd.sc * (.75 + .35 * p.k)).toFixed(4)})`;
      p.el.style.opacity = (1 - u * u).toFixed(2);
      p.bits.forEach((b, i) => {
        const c = p.cs[i], r = 18 + 50 * e;
        c.setAttribute('cx', (-Math.cos(b.a) * r).toFixed(1)); c.setAttribute('cy', (-Math.sin(b.a) * r * .22 - 10 * e * (1 - Math.abs(Math.cos(b.a)) * .5)).toFixed(1)); c.setAttribute('r', (b.r * (.7 + .9 * e)).toFixed(1));
      });
      return true;
    });
  },
});
