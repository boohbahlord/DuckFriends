/* ---------- the lamps: the example activity ----------
   Standing by a lamp in the cabin, the context button says "Light off" (or "Light on"); pressing it switches that lamp
   for everyone: its shade goes dark and its pool of light goes out. A new activity can start from this file: its rule
   (the host checks and changes s.hang), its screen part (the button, a class on its props, its light). */
import { rule, activity } from './registry.js';
import { PROPS, W, H } from './layout.js';

const LAMPS = PROPS.filter(p => p.kind === 'lamp');
const REACH = 120;   // world px from the lamp's foot
const foot = p => [p.x + p.w / 2, p.y + p.d];
const isOff = (s, id) => !!((s.hang || {}).lamps || {})[id];

rule('lamp', {
  init: () => ({ lamps: {} }),   // lamp id → 1 while it is switched off
  act(s, a) {
    const L = LAMPS.find(p => p.id === a.lamp), me = s.pos[a.id]; if (!L || !me) return false;
    const [fx, fy] = foot(L); if (Math.hypot(me.x * W - fx, me.y * H - fy) > REACH * 2) return false;   // (only from beside it)
    const off = { ...s.hang.lamps }; if (off[L.id]) delete off[L.id]; else off[L.id] = 1;
    s.hang.lamps = off; return true;
  },
});

activity({
  id: 'lamp',
  kinds: ['lamp'],
  near(pos, ctx) {
    if (!pos.inside) return null;   // (they're all in the cabin)
    let best = null, bd = REACH;
    for (const L of LAMPS) { const [fx, fy] = foot(L), d = Math.hypot(pos.x - fx, pos.y - fy); if (d < bd) { bd = d; best = L; } }
    if (!best) return null;
    const off = isOff(ctx.state(), best.id);
    return { label: off ? 'Light on' : 'Light off', d: bd, act: () => ctx.send({ t: 'hang', k: 'lamp', lamp: best.id }) };
  },
  propClass: (p, s) => isOff(s, p.id) ? 'off' : '',
  light: (p, s) => p.kind === 'lamp' ? !isOff(s, p.id) : undefined,
});
