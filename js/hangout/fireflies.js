/* ---------- fireflies ----------
   Little yellow-green lights that drift over the grass and by the trees outside, each blinking on its own beat; more of
   them while the power is out (s.hang.power === 0, the transformer). Only on this screen, so nothing goes over the
   network: every screen has its own. At most 40, kept round the camera (one that drifts out of view comes back
   somewhere new), drawn on one canvas over the world, and none while my duck is in the cabin. */
import { activity } from './registry.js';
import { inCabin, inPool, W, H, EDGE } from './layout.js';

const MOST = 40, USUAL = 24, PAD = 220;
let cv = null, g = null, sprite = null, flies = [], view = null, was = 0;
/* the soft glow, drawn once */
function glowSprite() {
  const c = document.createElement('canvas'), n = 48; c.width = c.height = n;
  const x = c.getContext('2d'), r = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  r.addColorStop(0, 'rgba(250,255,190,1)'); r.addColorStop(.12, 'rgba(214,255,110,.95)'); r.addColorStop(.35, 'rgba(170,240,70,.35)'); r.addColorStop(1, 'rgba(150,230,60,0)');
  x.fillStyle = r; x.fillRect(0, 0, n, n); return c;
}
const outside = (x, y) => x > EDGE && x < W - EDGE && y > EDGE && y < H - EDGE && !inCabin(x, y) && !inPool(x, y);
function spawn(v, now, anywhere) {
  for (let t = 0; t < 12; t++) {
    const x = v.x0 - PAD + Math.random() * (v.x1 - v.x0 + 2 * PAD), y = v.y0 - PAD + Math.random() * (v.y1 - v.y0 + 2 * PAD);
    if (!outside(x, y)) continue;
    if (!anywhere && x > v.x0 && x < v.x1 && y > v.y0 && y < v.y1) continue;   // (a new one comes in from the edge, not out of nowhere)
    return { x, y, h: 18 + Math.random() * 70, vx: 0, vy: 0, beat: 2200 + Math.random() * 3200, on: 400 + Math.random() * 700, ph: Math.random() * 6000, born: now, size: .7 + Math.random() * .5 };
  }
  return null;
}
activity({
  id: 'fireflies',
  mount(ctx) {
    cv = document.createElement('canvas'); cv.className = 'hang-flies'; cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:25000';   // (over the world and its shade, under the effects)
    ctx.world.board.querySelector('.hang-shade')?.after(cv); g = cv.getContext('2d'); sprite = glowSprite(); flies = []; was = 0;
  },
  unmount() { cv?.remove(); cv = g = null; flies = []; },
  step(dt, now, ctx) {
    if (!cv) return;
    const Wd = ctx.world, sc = Wd.sc; if (!sc || !Wd.vw) return;
    const o = Wd.toScreen(0, 0, 0), cx = (Wd.vw / 2 - o.left) / sc, cy = (Wd.vh / 2 - o.top) / sc, hw = Wd.vw / 2 / sc, hh = Wd.vh / 2 / sc;
    view = { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
    if (Wd.inside) { flies = []; return; }
    const dark = ((ctx.state().hang || {}).power === 0), want = dark ? MOST : USUAL;
    flies = flies.filter(f => f.x > view.x0 - PAD * 1.5 && f.x < view.x1 + PAD * 1.5 && f.y > view.y0 - PAD * 1.5 && f.y < view.y1 + PAD * 1.5 && outside(f.x, f.y));
    for (let k = 0; flies.length < want && k < 3; k++) { const f = spawn(view, now, !was); if (f) flies.push(f); }   // (a few a frame; all at once the first time)
    if (flies.length >= want) was = 1;
    const k = Math.min(dt, .1);
    for (const f of flies) {   // a lazy drift: a nudge this way and that, a slow bob up and down
      f.vx += (Math.random() - .5) * 60 * k; f.vy += (Math.random() - .5) * 40 * k;
      f.vx *= Math.exp(-k * .8); f.vy *= Math.exp(-k * .8);
      f.x += f.vx * k; f.y += f.vy * k; f.h = Math.max(10, Math.min(110, f.h + Math.sin((now + f.ph) / 900) * 6 * k));
    }
  },
  draw(now, ctx) {
    if (!cv) return;
    /* a soft glow: one canvas pixel for two screen pixels is plenty, and much less work on a weak laptop or a phone;
       with none to draw (inside) the canvas is hidden */
    const Wd = ctx.world, dpr = .5, w = Math.round(Wd.vw * dpr), h = Math.round(Wd.vh * dpr), none = Wd.inside || !flies.length;
    if (cv.hidden !== none) cv.hidden = none;
    if (none) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const base = 36 * Wd.sc * dpr;
    for (const f of flies) {
      const t = (now + f.ph) % f.beat, up = Math.min(1, (now - f.born) / 1200);
      const a = t < f.on ? Math.sin(Math.PI * t / f.on) : 0; if (a <= .02) continue;   // (fades on and off: never a jump)
      const p = Wd.toScreen(f.x, f.y, f.h), s = base * f.size * (.6 + .4 * a);
      g.globalAlpha = a * up; g.drawImage(sprite, p.left * dpr - s / 2, p.top * dpr - s / 2, s, s);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  },
});
