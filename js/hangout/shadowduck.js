/* ---------- the shadow duck ----------
   All black, outside only, and only where it's dark: never into the cabin, onto the deck (the porch), or into the light
   of a lamppost, a window or the campfire (unless the fire is out). It hides at the forest's edge, fades out and in
   again every 20 to 40 seconds, and stalks the player furthest from the cabin, keeping a few hundred px behind them;
   a duck that runs away from it isn't followed (it fades away instead).
   Justin and it only tangle when they meet up close, in the dark: then either it goes for him (a touch and he drops;
   someone revives him with E) and fades away, or, very rarely, he spots it by accident and chases it, and it fades
   before he gets close.
   Its record (npc.js) adds o = { v, t }: seen (1) or faded (0) since the room's time t, for the screens to fade it. */
import { brain, npcAt, randomSpot, nearestOpen, blockMap, CABIN } from './npc.js';
import { justinFree, justinGot, justinSees } from './justin.js';
import { W, H, inPool, inCabin, inDeck, LIGHTS } from './layout.js';

const WALK = 170, LUNGE = 420, FADE = 1500;
const FADE_EVERY = [20, 40], MEET_EVERY = [90, 200];   // seconds
const MEET = 170, JUSTIN_SPOTS = .12;                   // how close they must meet; how rarely Justin chases it
const RUNNING = 260;                                    // px a second: a duck going this fast away from it has run off
const sec = (rand, [a, b]) => (a + rand() * (b - a)) * 1000;
const MID = [(CABIN.x0 + CABIN.x1) / 2, (CABIN.y0 + CABIN.y1) / 2];
/* the light: the cabin, the deck, and the pools of light outside (a light can be out: the campfire put out, s.hang.fire
   === 0; the power off for the cabin's own) */
const OUT_LIGHTS = LIGHTS.filter(l => l.only !== 'in');
const fireOut = s => !!s && !!s.hang && s.hang.fire === 0;
const inLight = (x, y, s) => inCabin(x, y) || inDeck(x, y) || (x > CABIN.x0 - 80 && x < CABIN.x1 + 80 && y > CABIN.y0 - 80 && y < CABIN.y1 + 80)
  || OUT_LIGHTS.some(l => !(l.prop && l.prop.kind === 'campfire' && fireOut(s)) && Math.hypot(x - l.x, y - l.y) < l.r * .8);
const dark = s => (x, y) => !inLight(x, y, s) && !inPool(x, y);
const edge = s => (x, y) => dark(s)(x, y) && (x < 520 || x > W - 520 || y < 380 || y > H - 520);
/* its paths keep to the dark: the lit cells are blocked (worked out once each way the campfire can be) */
const blocks = {};
const way = s => { const k = fireOut(s) ? 'out' : 'lit'; return { dry: true, block: blocks[k] || (blocks[k] = blockMap((x, y) => inLight(x, y, fireOut(s) ? { hang: { fire: 0 } } : null))) }; };
let mm = null;
export const resetShadow = () => { mm = null; };
/* where to lurk behind someone: further out from the cabin than they are, in the dark */
function behind(d, c) {
  const a = Math.atan2(d.y - MID[1], d.x - MID[0]) + (c.rand() - .5) * .9, r = 340 + c.rand() * 200;
  return nearestOpen(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r, way(c.s), 5, dark(c.s));
}
const fade = (me, v, now) => { me.o = { v, t: now }; };
const away = (me, c, back) => { c.stop(me); fade(me, 0, c.now); mm.mode = 'lurk'; mm.target = null; mm.back = c.now + back; };

brain('shadow', {
  kind: 'duck', name: '',
  init(now, rand) { const p = randomSpot(rand, edge(null), way(null)) || [400, 3000]; return { w: { p: [p], t: now, v: 1 }, a: '', f: 1, o: { v: 0, t: now } }; },
  tick(me, c) {
    if (!mm) mm = { next: c.now + 2000, fade: c.now + sec(c.rand, FADE_EVERY), meet: c.now + sec(c.rand, MEET_EVERY), mode: 'lurk' };
    const at = npcAt(me, c.now); if (!at) return false;
    const seen = me.o && me.o.v;
    /* faded: come back somewhere new, in the dark */
    if (!seen) {
      if (c.now - me.o.t < FADE * 2 || c.now < mm.back) return false;
      const out = c.ducks.filter(d => !d.dead && dark(c.s)(d.x, d.y)).sort((a, b) => c.dist({ x: MID[0], y: MID[1] }, b) - c.dist({ x: MID[0], y: MID[1] }, a));
      const p = (out[0] && behind(out[0], c)) || randomSpot(c.rand, edge(c.s), way(c.s));
      if (!p) return false;
      me.w = { p: [p], t: c.now, v: 1 }; fade(me, 1, c.now); mm.mode = 'lurk'; mm.fade = c.now + sec(c.rand, FADE_EVERY); mm.next = c.now + 1500;
      return true;
    }
    /* standing in the light (the campfire lit again by it): gone */
    if (inLight(at.x, at.y, c.s)) { away(me, c, 3000); return true; }
    const j = c.at('justin'), jd = j ? c.dist(at, j) : Infinity;
    /* going for Justin, met up close: a lunge, a touch and he drops, and it's gone */
    if (mm.mode === 'hunt') {
      if (!j || !justinFree() || c.now > mm.until || jd > MEET * 2 || inLight(j.x, j.y, c.s)) { away(me, c, 4000); return true; }
      if (jd < 50) { c.poke('justin', r => justinGot(r, c)); c.fx('shadow', 'justin', 'touch'); away(me, c, 8000); return true; }
      if (c.now > (mm.chase || 0)) { mm.chase = c.now + 400; if (c.go(me, j.x, j.y, LUNGE, way(c.s))) return true; }
      return false;
    }
    /* Justin chasing it: it slips away into the dark before he gets close */
    if (mm.mode === 'chased') {
      if (!j || jd < 170 || c.now > mm.until) { away(me, c, 6000); return true; }
      return false;
    }
    if (c.now > mm.fade) { away(me, c, FADE); return true; }
    /* Justin, right by it in the dark, by chance */
    if (c.now > mm.meet && j && jd < MEET && justinFree() && dark(c.s)(j.x, j.y)) {
      mm.meet = c.now + sec(c.rand, MEET_EVERY);
      if (c.rand() < JUSTIN_SPOTS) {
        let ok = false; c.poke('justin', r => { ok = justinSees(r, c, at.x, at.y); });
        if (ok) { c.fx('justin', 'shadow', 'spotted'); mm.mode = 'chased'; mm.until = c.now + 8000; return true; }
      }
      mm.mode = 'hunt'; mm.until = c.now + 4000; mm.chase = 0; return false;
    }
    /* stalk the one furthest from the cabin (in the dark); one that runs away from it is let go */
    if (c.now < mm.next) return false;
    mm.next = c.now + 3000;
    const out = c.ducks.filter(d => !d.dead && dark(c.s)(d.x, d.y)).sort((a, b) => c.dist({ x: MID[0], y: MID[1] }, b) - c.dist({ x: MID[0], y: MID[1] }, a));
    if (out.length) {
      const d = out[0], gap = c.dist(at, d); me.f = d.x > at.x ? 1 : -1;
      const ran = mm.target === d.id && d.speed > RUNNING && gap > (mm.gap || 0) + 40; mm.target = d.id; mm.gap = gap;
      if (ran) { away(me, c, 10000); return true; }   // (ran off: it doesn't follow)
      if (gap < 220) { away(me, c, 5000); return true; }   // (too close: it melts away)
      const p = behind(d, c); if (p && c.dist(at, { x: p[0], y: p[1] }) > 120 && c.go(me, p[0], p[1], WALK, way(c.s))) return true;
      return false;
    }
    mm.target = null;
    if (!at.moving && c.rand() < .3) { const p = randomSpot(c.rand, edge(c.s), way(c.s)); if (p && c.go(me, p[0], p[1], WALK * .6, way(c.s))) return true; }
    return false;
  },
});
export { inLight };   // (tools/npc-sim.mjs checks it stays out of the light)
