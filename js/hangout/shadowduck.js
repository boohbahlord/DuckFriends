/* ---------- the shadow duck ----------
   All black, outside only. It hides in the dark and at the forest's edge, fades out and in again every 20 to 40
   seconds, and stalks the player furthest from the cabin, keeping a few hundred px behind them, out in the dark.
   Now and then, with Justin close: either Justin chases it (he never gets it: it fades away), or it chases Justin, and
   when it touches him he drops (someone revives him with E) and it fades away.
   Its record (npc.js) adds o = { v, t }: seen (1) or faded (0) since the room's time t, for the screens to fade it. */
import { brain, npcAt, randomSpot, nearestOpen, indoors, CABIN } from './npc.js';
import { justinFree, justinGot, justinSees } from './justin.js';
import { W, H, inPool } from './layout.js';

const WALK = 170, CHASE = 520, FADE = 1500;
const FADE_EVERY = [20, 40], MEET_EVERY = [60, 150];   // seconds
const sec = (rand, [a, b]) => (a + rand() * (b - a)) * 1000;
const MID = [(CABIN.x0 + CABIN.x1) / 2, (CABIN.y0 + CABIN.y1) / 2];
const DRY = { dry: true };
const outside = (x, y) => !indoors(x, y) && !(x > CABIN.x0 - 80 && x < CABIN.x1 + 80 && y > CABIN.y0 - 80 && y < CABIN.y1 + 80) && !inPool(x, y);
const edge = (x, y) => outside(x, y) && (x < 520 || x > W - 520 || y < 380 || y > H - 520);
let mm = null;
export const resetShadow = () => { mm = null; };
/* where to lurk behind someone: further out from the cabin than they are */
function behind(d, c) {
  const a = Math.atan2(d.y - MID[1], d.x - MID[0]) + (c.rand() - .5) * .9, r = 340 + c.rand() * 200;
  const p = nearestOpen(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r, DRY, 5);
  return p && outside(p[0], p[1]) ? p : null;
}
const fade = (me, v, now) => { me.o = { v, t: now }; };

brain('shadow', {
  kind: 'duck',
  init(now, rand) { const p = randomSpot(rand, edge, DRY) || [400, 3000]; return { w: { p: [p], t: now, v: 1 }, a: '', f: 1, o: { v: 0, t: now } }; },
  tick(me, c) {
    if (!mm) mm = { next: c.now + 2000, fade: c.now + sec(c.rand, FADE_EVERY), meet: c.now + sec(c.rand, MEET_EVERY), mode: 'lurk' };
    const at = npcAt(me, c.now); if (!at) return false;
    const seen = me.o && me.o.v;
    /* faded: come back somewhere new */
    if (!seen) {
      if (c.now - me.o.t < FADE * 2 || c.now < mm.back) return false;
      const out = c.ducks.filter(d => !d.dead && outside(d.x, d.y)).sort((a, b) => c.dist({ x: MID[0], y: MID[1] }, b) - c.dist({ x: MID[0], y: MID[1] }, a));
      const p = (out[0] && behind(out[0], c)) || randomSpot(c.rand, edge, DRY);
      if (!p) return false;
      me.w = { p: [p], t: c.now, v: 1 }; fade(me, 1, c.now); mm.mode = 'lurk'; mm.fade = c.now + sec(c.rand, FADE_EVERY); mm.next = c.now + 1500;
      return true;
    }
    /* chasing Justin: a touch and he drops, and it's gone */
    if (mm.mode === 'hunt') {
      const j = c.at('justin');
      if (!j || !justinFree() || c.now > mm.until) { mm.mode = 'lurk'; fade(me, 0, c.now); mm.back = c.now + 4000; return true; }
      if (c.dist(at, j) < 50) { c.poke('justin', r => justinGot(r, c)); c.fx('shadow', 'justin', 'touch'); c.stop(me); fade(me, 0, c.now); mm.mode = 'lurk'; mm.back = c.now + 8000; return true; }
      if (c.now > (mm.chase || 0)) { mm.chase = c.now + 500; if (c.go(me, j.x, j.y, CHASE, DRY)) return true; }
      return false;
    }
    /* Justin chasing it: it slips away into the dark before he gets close */
    if (mm.mode === 'chased') {
      const j = c.at('justin');
      if (!j || c.dist(at, j) < 170 || c.now > mm.until) { c.stop(me); fade(me, 0, c.now); mm.mode = 'lurk'; mm.back = c.now + 6000; return true; }
      return false;
    }
    if (c.now > mm.fade) { c.stop(me); fade(me, 0, c.now); mm.back = c.now + FADE; return true; }
    /* Justin close by, out here */
    const j = c.at('justin');
    if (c.now > mm.meet && j && outside(j.x, j.y) && justinFree() && c.dist(at, j) < 800) {
      mm.meet = c.now + sec(c.rand, MEET_EVERY);
      if (c.rand() < .5) { mm.mode = 'hunt'; mm.until = c.now + 15000; mm.chase = 0; return false; }
      let ok = false; c.poke('justin', r => { ok = justinSees(r, c, at.x, at.y); });
      if (ok) { c.fx('justin', 'shadow', 'spotted'); mm.mode = 'chased'; mm.until = c.now + 8000; return true; }
    }
    /* stalk the one furthest from the cabin */
    if (c.now < mm.next) return false;
    mm.next = c.now + 3000;
    const out = c.ducks.filter(d => !d.dead && outside(d.x, d.y)).sort((a, b) => c.dist({ x: MID[0], y: MID[1] }, b) - c.dist({ x: MID[0], y: MID[1] }, a));
    if (out.length) {
      const d = out[0]; me.f = d.x > at.x ? 1 : -1;
      if (c.dist(at, d) < 220) { fade(me, 0, c.now); c.stop(me); mm.back = c.now + 5000; return true; }   // (too close: it melts away)
      const p = behind(d, c); if (p && c.dist(at, { x: p[0], y: p[1] }) > 120 && c.go(me, p[0], p[1], WALK, DRY)) return true;
      return false;
    }
    if (!at.moving && c.rand() < .3) { const p = randomSpot(c.rand, edge, DRY); if (p && c.go(me, p[0], p[1], WALK * .6, DRY)) return true; }
    return false;
  },
});
