/* ---------- Duck Cabin's characters on the map: the host's rule and every screen's part ----------
   The rule runs the brains (npc.js) on the host's heartbeat and takes a player's { t: 'hang', k: 'npc', who, do }.
   Every screen draws each character where its walk has got to (no messages while it walks), hops it up onto a couch
   or a table, shows its words in a bubble over it, lets E pet a cat that likes it, and plays the swipes and purrs
   (s.hang.npcFx). Their words also go in the chat (npc.js). Doors open for them (doors.js addOpeners). */
import { rule, activity } from './registry.js';
import { npcTick, npcAct, npcAt, BRAINS } from './npc.js';
import { inCabin, sortY, W, H } from './layout.js';
import { addOpeners } from './doors.js';
import { catSVG, CATS } from './npcart.js';
import { now as clockNow } from '../clock.js';
import { play, loop, setListener } from './sounds.js';
import './cats.js';

const PETS = { annabelle: 'Pet Annabelle', bubbles: 'Pet Bubbles' };   // who E can pet (Oreo and Opal won't have it)
const REACH = 110, SAY = 4500, HOP = 320;
const MEOWS = /^(M|Mew|Mrr)/;

rule('npc', {
  tick: (s, now) => npcTick(s, now),
  act: (s, a, now) => npcAct(s, a, now),
});
/* doors open for whoever walks through */
addOpeners(s => { const t = clockNow(), out = []; for (const r of Object.values((s.hang || {}).npc || {})) { const p = npcAt(r, t); if (p) out.push([p.x, p.y]); } return out; });

/* ---------- every screen ---------- */
const shown = new Map();   // id → { el, body, say, x, y, z, pose, f, hopFrom, hopAt, sayN, dist }
let layer = null, fxl = null, lastFx = 0, mounted = false;
function make(id) {
  const el = document.createElement('div'); el.className = 'hang-npc npc-' + id;
  el.innerHTML = '<div class="hang-npc-say"></div><div class="hang-npc-body"></div>';
  layer.append(el);
  const body = el.querySelector('.hang-npc-body'), k = CATS[id] ? CATS[id].tall / 63 : 1;   // (a cat's drawing: 100 × 80 units, its feet at 46, 74)
  body.style.left = (-46 * k).toFixed(1) + 'px'; body.style.top = (-74 * k).toFixed(1) + 'px'; body.style.transformOrigin = `${(46 * k).toFixed(1)}px ${(74 * k).toFixed(1)}px`;
  return { el, body, k, say: el.querySelector('.hang-npc-say'), pose: '', dist: 0, sayN: 0 };
}
const svgFor = (id, pose, step) => BRAINS.get(id)?.kind === 'cat' ? catSVG(id, { pose, step }) : '';
/* a claw swipe over whoever got it, or a heart from a purr */
function burst(kind, x, y, ctx) {
  if (!fxl) return;
  const f = ctx.world.toScreen(x, y, 40), el = document.createElement('div');
  el.className = kind === 'purr' ? 'hang-npc-heart' : 'hang-npc-claw';
  el.innerHTML = kind === 'purr' ? '♥' : '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 6C16 16 18 26 14 36M19 4C25 14 27 24 23 34M28 6C34 16 36 26 32 36" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
  el.style.left = f.left.toFixed(1) + 'px'; el.style.top = f.top.toFixed(1) + 'px'; el.style.setProperty('--k', ctx.world.sc.toFixed(3));
  fxl.append(el); setTimeout(() => el.remove(), 1100);
}
activity({
  id: 'npc',
  mount(ctx) { setListener(() => ctx.world.at(ctx.me)); layer = ctx.world.board.querySelector('.hang-props'); fxl = ctx.world.board.querySelector('.fxl'); shown.clear(); lastFx = ((ctx.state().hang || {}).npcFx || []).reduce((m, f) => Math.max(m, f.n), 0); mounted = true; },
  unmount() { for (const o of shown.values()) o.el.remove(); shown.clear(); layer = fxl = null; mounted = false; },
  near(pos, ctx) {
    const recs = (ctx.state().hang || {}).npc || {}, t = clockNow();
    let best = null;
    for (const id in PETS) {
      const o = shown.get(id) || npcAt(recs[id], t); if (!o || inCabin(o.x, o.y) !== pos.inside) continue;
      const d = Math.hypot(pos.x - o.x, pos.y - o.y);
      if (d < REACH && (!best || d < best.d)) best = { label: PETS[id], d, act: () => ctx.send({ t: 'hang', k: 'npc', who: id, do: 'pet' }) };
    }
    return best;
  },
  step(dt, now, ctx) {
    if (!mounted) return;
    const s = ctx.state(), recs = (s.hang || {}).npc || {};
    for (const id of Object.keys(recs)) {
      if (!BRAINS.has(id)) continue;
      const r = recs[id], p = npcAt(r, now); if (!p) continue;
      let o = shown.get(id); if (!o) { o = make(id); shown.set(id, o); o.x = p.x; o.y = p.y; o.z = p.z; }
      /* glide to where the walk says (a new walk starts where the old one was, so this is small) */
      const k = 1 - Math.exp(-dt / .08), ox = o.x, oy = o.y;
      if (Math.hypot(p.x - o.x, p.y - o.y) > 300) { o.x = p.x; o.y = p.y; } else { o.x += (p.x - o.x) * k; o.y += (p.y - o.y) * k; }
      o.dist += Math.hypot(o.x - ox, o.y - oy);
      if (Math.abs((o.zTo ?? o.z) - p.z) > 1) { o.hopFrom = o.z; o.zTo = p.z; o.hopAt = now; }   // up onto (or down off) something: a hop
      if (o.hopAt !== undefined) { const u = Math.min(1, (now - o.hopAt) / HOP); o.z = o.hopFrom + (o.zTo - o.hopFrom) * u + Math.sin(Math.PI * u) * 26; if (u >= 1) { o.z = o.zTo; delete o.hopAt; } } else o.z = p.z;
      o.f = p.moving ? p.f : r.f || p.f;
      /* the pose: walking steps, or what the brain says (a swipe shows a moment) */
      let pose = r.a || (p.moving ? 'walk' : 'stand'), step = 0;
      if (pose === 'swipe' && now - r.w.t > 700) pose = 'stand';
      if (pose === 'walk') step = Math.floor(o.dist / 16) % 2 ? 1 : -1;
      if (pose === 'dead') pose = 'loaf';
      const key = pose + step;
      if (key !== o.pose) { o.pose = key; o.body.innerHTML = svgFor(id, pose, step); o.el.classList.toggle('dead', r.a === 'dead'); }
      /* words: a bubble for a few seconds (and a meow, a purr or a hiss nearby) */
      if (r.say && r.say.n !== o.sayN) {
        const fresh = o.sayN && now - r.say.t < 2000; o.sayN = r.say.n; o.say.textContent = r.say.text; o.sayUntil = r.say.t + SAY;
        if (fresh && inCabin(o.x, o.y) === ctx.world.inside) {   // (sounds fade with distance by themselves)
          const t = r.say.text;
          if (t.startsWith('Purr')) { const pl = loop('purr', { x: o.x, y: o.y }); setTimeout(() => pl.stop(), 3200); }
          else if (t.startsWith('Hss')) play('hiss', { x: o.x, y: o.y });
          else if (MEOWS.test(t)) play('meow', { x: o.x, y: o.y });
        }
      }
      o.el.classList.toggle('saying', now < (o.sayUntil || 0));
    }
    for (const [id, o] of shown) if (!recs[id]) { o.el.remove(); shown.delete(id); }
    /* swipes and purrs */
    for (const f of (s.hang || {}).npcFx || []) {
      if (f.n <= lastFx) continue; lastFx = f.n;
      if (now - f.t > 2500) continue;
      const at = s.players[f.who] ? ctx.world.at(f.who) : shown.get(f.who);
      if (at && inCabin(at.x, at.y) === ctx.world.inside) { burst(f.kind, at.x, at.y, ctx); if (f.kind === 'swipe') play('swipe', { x: at.x, y: at.y }); }
    }
  },
  draw(now, ctx) {
    const Wd = ctx.world, sc = Wd.sc;
    for (const o of shown.values()) {
      const hide = inCabin(o.x, o.y) !== Wd.inside; if (o.el.hidden !== hide) o.el.hidden = hide;
      if (hide) continue;
      const f = Wd.toScreen(o.x, o.y, o.z);
      o.el.style.transform = `translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`;
      o.body.style.transform = `scale(${(o.f < 0 ? -sc : sc).toFixed(4)}, ${sc.toFixed(4)})`;
      if (o.sc !== sc) { o.sc = sc; o.el.style.setProperty('--h', (62 * o.k * sc).toFixed(1) + 'px'); }   // (the bubble sits over its head)
      o.el.style.zIndex = Math.round(o.z > 2 ? o.y + 80 : sortY(o.x, o.y, o.z)) + 10;   // (up on a couch or a table: in front of it)
    }
  },
});
