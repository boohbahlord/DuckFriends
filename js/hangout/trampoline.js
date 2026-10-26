/* ---------- the trampoline ----------
   Its mat stands 30 over the downhill (layout.js TRAMP), so a duck jumps onto it. Landing on the mat bounces the duck
   straight up again, each bounce a little higher than the one before, up to about three duck heights; walking off the
   mat in the air ends it on the ground. A bounce is an ordinary jump (j, b: it began on the mat) with its height in tb,
   so every screen draws it from the same numbers; bounces don't count as Jumps (the jump onto it does). The mat dips
   under a duck as it lands and pushes off. */
import { activity } from './registry.js';
import { TRAMP, W, H, onTramp, terrainAt } from './layout.js';
import { trampoline } from './art.js';
import { sfx } from '../sound.js';

const MAT = terrainAt(TRAMP.cy) + TRAMP.h;   // the mat's height
const FIRST = 1.6, MORE = .4, TOP = 3;        // bounce heights in duck heights: the first, each one more, the highest
const TW = 2 * TRAMP.rx, TD = 2 * TRAMP.ry, TH = TD + TRAMP.h, X0 = TRAMP.cx - TRAMP.rx, Y0 = TRAMP.cy - TRAMP.ry;
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

/* a dip in the mat: darker in the middle, the mat's weave pulled in round it */
const DENT = '<svg viewBox="-60 -22 120 44" width="120" height="44" aria-hidden="true"><ellipse rx="44" ry="15" fill="#000" opacity=".55"/><ellipse rx="30" ry="9" fill="#000" opacity=".5"/>'
  + '<ellipse rx="40" ry="13" fill="none" stroke="#6b7488" stroke-width="2" stroke-dasharray="4 5" opacity=".9"/><ellipse rx="56" ry="19" fill="none" stroke="#6b7488" stroke-width="1.6" stroke-dasharray="4 6" opacity=".55"/>'
  + '<path d="M-42 4A44 15 0 0 0 42 4" fill="none" stroke="#9fb4ff" stroke-width="2" opacity=".35"/></svg>';
let back = null, front = null, dents = new Map(), bounced = new Map(), layer = null;
activity({
  id: 'trampoline',
  mount(ctx) {
    layer = ctx.world.board.querySelector('.hang-props');
    const art = trampoline({ w: TW, d: TD, z: TRAMP.h });
    back = document.createElement('div'); back.className = 'hang-tramp'; back.innerHTML = art.back; back.style.zIndex = Y0 + 10;
    front = document.createElement('div'); front.className = 'hang-tramp'; front.innerHTML = art.front; front.style.zIndex = Y0 + TD + 10;
    layer.append(back, front);
  },
  unmount() { back?.remove(); front?.remove(); dents.forEach(d => d.remove()); dents.clear(); bounced.clear(); back = front = layer = null; },
  /* my duck on the mat: up again */
  after(me, ev, now) {
    const x = me.x * W, y = me.y * H;
    if (ev.land && me.tb) ev.land = 0;   // (a landing that ends a bounce is never a Jump, wherever it comes down or even while falling on)
    if (!onTramp(x, y) || me.z > MAT + .5) {   // off it: a bounce that comes down on the ground ends there (no Jump for it)
      if (!me.j && me.tb) { if (ev.land) ev.land = 0; me.tb = 0; }
      return;
    }
    if (me.j || me.vz != null) return;   // (still in the air)
    const was = me.tb || 0;
    if (ev.land && was) ev.land = 0;     // (a bounce isn't a Jump)
    me.tb = was ? Math.min(TOP, was + MORE) : FIRST;
    me.j = now; me._j = now; me.lj = false; me.dj = 0; me.b = me.z; me.vz = null; me._za = undefined;
    ev.force = true; ev.q = ev.q || 'd'; sfx.boing(me.tb / TOP);   // (squashed on the mat for a moment: others see it too)
  },
  draw(now, ctx) {
    if (!back) return;
    const Wd = ctx.world, sc = Wd.sc, hide = Wd.inside;
    if (back.hidden !== hide) back.hidden = front.hidden = hide;
    if (hide) return;
    const f = Wd.toScreen(X0, Y0 + TD, terrainAt(TRAMP.cy)), tr = `translate(${f.left.toFixed(1)}px, ${(f.top - TH * sc).toFixed(1)}px) scale(${sc.toFixed(4)})`;
    if (back._tr !== tr) { back._tr = front._tr = tr; back.style.transform = front.style.transform = tr; }
    /* the mat dips under every duck coming down onto it and pushing off (a moment from each bounce's start, so it shows
       at any frame rate), and the duck sinks into it a little */
    const s = ctx.state(), live = new Set(), mine = ctx.duck();
    for (const id of s.seat) {
      const a = Wd.at(id); if (!a || !onTramp(a.x, a.y)) continue;
      const j = id === ctx.me && mine ? mine.j : (s.pos[id] || {}).j, b = bounced.get(id) || { j };
      if (j && j !== b.j) b.t = now; b.j = j; bounced.set(id, b);
      const near = cl(1 - (a.z - MAT) / 40, 0, 1), dip = Math.max(near, b.t ? cl(1 - (now - b.t) / 220, 0, 1) : 0);
      const d = Wd.board.querySelector(`.ducks .gduck[data-pid="${CSS.escape(id)}"] .gduck-lift`);
      if (d) d.style.translate = near > 0 ? `0 ${(near * 9 * sc).toFixed(1)}px` : '';
      if (dip <= 0) continue;
      live.add(id);
      let e = dents.get(id); if (!e) { e = document.createElement('div'); e.className = 'hang-dent'; e.style.zIndex = Y0 + 11; e.innerHTML = DENT; layer.append(e); dents.set(id, e); }
      const p = Wd.toScreen(a.x, a.y, MAT);
      e.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px) scale(${(sc * (.7 + .4 * dip)).toFixed(4)})`;
      e.style.opacity = dip.toFixed(2);
    }
    for (const id of bounced.keys()) if (!s.pos[id]) bounced.delete(id);
    for (const [id, e] of dents) if (!live.has(id)) {
      e.remove(); dents.delete(id);
      const d = Wd.board.querySelector(`.ducks .gduck[data-pid="${CSS.escape(id)}"] .gduck-lift`); if (d) d.style.translate = '';
    }
  },
});
