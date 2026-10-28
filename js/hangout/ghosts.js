/* ---------- Duck Cabin's ghosts ----------
   I want this as a Duck Cabin setting (s.options.ghosts, off unless the host turns it on): when a knocked-down duck's
   time is up it doesn't stand up. Its body stays lying where it fell (s.hang.ghost[id] = { x, y, z, t }) and its ghost
   gets up out of it and walks about, as see-through as the shadow duck. A ghost can't be hit and can't use anything
   (no chalk, cards, piano, candles, lights, guestbook, balls, specials: rules.js and hangout/rules.js ask isGhost).
   Space (or the context button) brings it back: the ghost fades away (out, FADE ms, standing still), then the old body
   gets up where it lay (pos.tp tells every screen to put the duck there at once). A computer comes back by itself. */
import { rule, activity, RULES } from './registry.js';
import { onGetUp, isGhost } from './death.js';

export const FADE = 1000;     // ms: the ghost fading away before the body gets up
const BOT_BACK = 4000;        // ms: a computer's ghost walks this long, then comes back

/* the knocked-down time is up: with ghosts on, the duck becomes one (out of its seat, off the piano, out of the games) */
onGetUp((s, id, now) => {
  if (s.options.mode !== 'hang' || !s.options.ghosts || !s.hang) return false;
  const P = s.players[id], p = s.pos[id]; if (!P || !p || p.x < 0) return false;
  for (const [k, r] of RULES) if (k !== 'ghost') r.left?.(s, id);
  s.hang.ghost = { ...(s.hang.ghost || {}), [id]: { x: p.x, y: p.y, z: Math.round(+p.z || 0), t: now } };
  delete P.dead;   // (the ghost walks as itself; the body is what lies there)
  return true;
});

rule('ghost', {
  init: () => ({ ghost: {} }),
  act(s, a, now) {   // come back
    const g = (s.hang.ghost || {})[a.id]; if (!g || g.out) return false;
    s.hang.ghost = { ...s.hang.ghost, [a.id]: { ...g, out: now } };
    s.hang.still = { ...(s.hang.still || {}), [a.id]: now + FADE + 300 };   // (it can't walk off while it fades)
    return true;
  },
  tick(s, now) {
    const G = s.hang.ghost; if (!G) { s.hang.ghost = {}; return true; }
    let ch = false; const next = { ...G };
    for (const [id, g] of Object.entries(G)) {
      const P = s.players[id];
      if (!P || !s.pos[id]) { delete next[id]; ch = true; }
      else if (!g.out && P.bot && now - g.t > BOT_BACK) { next[id] = { ...g, out: now }; ch = true; }
      else if (g.out && now - g.out >= FADE) {   // the body gets up where it lay
        s.pos[id] = { x: g.x, y: g.y, j: 0, z: g.z, b: g.z, tp: now };
        delete next[id]; ch = true;
      }
    }
    if (ch) s.hang.ghost = next;
    return ch;
  },
  left(s, id) { if (s.hang.ghost && s.hang.ghost[id]) { const n = { ...s.hang.ghost }; delete n[id]; s.hang.ghost = n; } },
});

/* my ghost: Space comes back instead of jumping, and the context button says so (before anything near) */
const mine = ctx => { const s = ctx.state(); return s && isGhost(s, ctx.me) ? s.hang.ghost[ctx.me] : null; };
const back = ctx => { const g = mine(ctx); if (g && !g.out) ctx.send({ t: 'hang', k: 'ghost' }); return !!g; };
activity({
  id: 'ghost',
  near(pos, ctx) { const g = mine(ctx); return g ? { label: g.out ? 'Coming back…' : 'Come back', d: -1e6, act: () => back(ctx) } : null; },
  jump: ctx => back(ctx),
});
