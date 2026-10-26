/* ---------- now and then a light stutters ----------
   Every 20 to 60 seconds one of the lamps (the six lampposts) or the porch's string lights goes dark in 2 to 4 quick dips
   over half a second, on top of the slow flicker they always have. Nothing goes over the network: the time (the room's
   clock) alone says which light and when, so every screen sees the same one at the same moment. A slot is 40 s long;
   its stutter starts 0 to 20 s into it, so two are never closer than 20 s or further apart than 60 s.
   stutter(target, now) → the light's strength: 1, or DIP in a dip (world.js lays the ground's pools of light with it).
   The lamp's lantern and the porch's bulbs dim the same way on the screen. */
import { activity } from './registry.js';

const TARGETS = ['post1', 'post2', 'post3', 'post4', 'post5', 'post6', 'porch'];
const SLOT = 40000, WITHIN = 20000, SPAN = 500, DIP_MS = 70, DIP = .18;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const still = () => document.documentElement.classList.contains('still');
/* the stutter of the slot `now` is in: { target, at (ms), n (dips) } */
const slotOf = now => {
  const i = Math.floor(now / SLOT);
  return { target: TARGETS[Math.floor(hash(i + .1) * TARGETS.length)], at: i * SLOT + hash(i + .2) * WITHIN, n: 2 + Math.floor(hash(i + .3) * 3) };
};
export function stutter(target, now) {
  if (!target || still()) return 1;
  const s = slotOf(now); if (s.target !== target) return 1;
  const u = now - s.at; if (u < 0 || u >= SPAN) return 1;
  const gap = SPAN / s.n;
  return u % gap < DIP_MS ? DIP : 1;
}

let held = new Set();
activity({
  id: 'flicker',
  unmount() { held.clear(); },
  draw(now, ctx) {
    const W = ctx.world;
    /* the lantern of a lamppost and the porch's bulbs (the pools on the ground are world.js') */
    for (const t of TARGETS) {
      const dim = stutter(t, now) < 1;
      if (dim === held.has(t)) continue;
      dim ? held.add(t) : held.delete(t);
      const els = t === 'porch' ? [...W.board.querySelectorAll('.hg-porch')] : W.propEls(t);
      for (const e of els) for (const g of t === 'porch' ? [e] : e.querySelectorAll('.hg-flicker')) {
        if (dim) g.style.setProperty('opacity', DIP, 'important'); else g.style.removeProperty('opacity');
      }
    }
  },
});
