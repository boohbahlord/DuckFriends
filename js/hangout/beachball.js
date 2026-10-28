/* ---------- the beach ball ----------
   It floats in the pool. A duck that walks or swims into it bats it along (harder at a sprint); a duck jumping up under
   it heads it high into the air; it bounces on the ground and plops back on the water. It never leaves the pool: the
   water's edges are its walls. Hitting the west wall rings a dark ping and lights that wall dark blue; the east wall, a
   bright ping and pink (a hit is counted in the ball's own numbers, hn, hs and hv, so every screen sees and hears it).
   The host decides every touch (its heartbeat looks at where the ducks are) and writes the ball down only then:
   s.hang.beachball = { x, y, z, vx, vy, vz, t, rest } (world px, px a second, the room's time). Between touches every
   screen, and the host, moves it on from there with the same steps of 1/60 s (move()), so they all see it in the same
   place without the ball going over the network all the time. */
import { rule, activity } from './registry.js';
import { POOL, W, H, heightAt, solidsAt } from './layout.js';
import { WATER, SOUTH, ripple, splash, wallGlow } from './water.js';
import { play } from './sounds.js';
import { beachBall } from './art.js';
import { sfx } from '../sound.js';

const R = 24, DR = 26;          // the ball's radius; a duck's reach round its middle (world px)
const G = 1100, STEP = 1000 / 60, MAX = 60 * 180;   // gravity (light: it floats down); one step (ms); at most 3 minutes of steps
const X0 = POOL.x0 + R, X1 = POOL.x1 - R, Y0 = POOL.y0 + R;   // the pool's walls, for the ball's middle (the near wall is SOUTH: the coping)
const PING = 70;                // a wall hit this fast (px a second) is a ping
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;
const onWater = (x, y) => heightAt(x, y) === WATER && x > POOL.x0 && x < POOL.x1 && y > POOL.y0 && y < POOL.y1;
/* can the ball roll onto (x, y) at height z? (a wall, a post, a step up of more than 8: no) */
const open = (x, y, z) => x > 160 && x < W - 160 && y > 160 && y < H - 160 && heightAt(x, y) <= z + 8 && !solidsAt(x, y, z + 4).length;

/* the ball hit the west ('w') or east ('e') wall at speed v */
function wall(b, side, v) { if (v > PING) { b.hn = (b.hn || 0) + 1; b.hs = side; b.hv = Math.round(v); } }
/* one step of 1/60 s */
function step(b) {
  const dt = STEP / 1000, sfc = heightAt(b.x, b.y);
  if (b.z > sfc + .5 || b.vz > 0) { b.vz -= G * dt; b.z += b.vz * dt; }
  const wet = onWater(b.x, b.y);
  if (b.z <= sfc + .5 && b.vz <= 0) { b.z = sfc; if (b.vz < 0) { b.vz = -b.vz * (wet ? .22 : .55); if (b.vz < 70) b.vz = 0; } }
  const low = b.z <= sfc + .5 && b.vz === 0;
  const k = Math.exp(-(low ? (wet ? 1.1 : 1.6) : .25) * dt); b.vx *= k; b.vy *= k;
  const sx = Math.sign(b.vx) * R * .7, sy = Math.sign(b.vy) * R * .7;
  let nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
  const stuck = solidsAt(b.x, b.y, b.z + 4).length > 0;   // (pushed into a post or a trunk: it rolls out freely)
  if (!stuck && !open(nx + sx, b.y, b.z)) { b.vx = -b.vx * .5; nx = b.x; }
  if (!stuck && !open(nx, ny + sy, b.z)) { b.vy = -b.vy * .5; ny = b.y; }
  /* the pool's walls: it bounces off them (a little softer than it came) */
  if (nx < X0) { nx = X0; if (b.vx < 0) { wall(b, 'w', -b.vx); b.vx = -b.vx * .6; } }
  else if (nx > X1) { nx = X1; if (b.vx > 0) { wall(b, 'e', b.vx); b.vx = -b.vx * .6; } }
  if (ny < Y0) { ny = Y0; if (b.vy < 0) b.vy = -b.vy * .6; }
  else if (ny > SOUTH) { ny = SOUTH; if (b.vy > 0) b.vy = -b.vy * .6; }
  b.x = nx; b.y = ny;
  if (low && Math.hypot(b.vx, b.vy) < 5) { b.vx = b.vy = 0; b.rest = 1; }
}
/* the ball n steps after it was written down (kept: the next frame goes on from there) */
const memos = { host: { key: '' }, screen: { key: '' } };   // (one each: the host and this screen ask for different times)
function stepsTo(ball, n, memo) {
  const key = [ball.t, ball.x, ball.y, ball.z, ball.vx, ball.vy, ball.vz].join();
  if (memo.key !== key || memo.n > n) { memo.key = key; memo.n = 0; memo.b = { ...ball }; }
  const b = memo.b;
  for (n = Math.min(n, MAX); memo.n < n && !b.rest; memo.n++) step(b);
  if (memo.n < n) memo.n = n;
  return b;
}
/* where the ball is at the room's time `now`: exact at a step (the host), or part way to the next (smooth, on screens) */
export function ballAt(ball, now, smooth = false) {
  const ms = Math.max(0, now - (ball.t || 0)), n = Math.floor(ms / STEP), b = { ...stepsTo(ball, n, memos[smooth ? 'screen' : 'host']) };
  if (smooth && !b.rest && n < MAX) { const c = { ...b }; step(c); const u = ms / STEP - n; for (const k of ['x', 'y', 'z']) b[k] += (c[k] - b[k]) * u; }
  return b;
}
const pack = (b, now) => ({ x: r1(b.x), y: r1(b.y), z: r1(b.z), vx: Math.round(b.vx), vy: Math.round(b.vy), vz: Math.round(b.vz), t: now, ...(b.rest ? { rest: 1 } : {}), ...(b.hn ? { hn: b.hn, hs: b.hs, hv: b.hv } : {}) });

/* ---------- the host: the ducks touch it ---------- */
const was = new Map();   // id → where each duck was at the last heartbeat { x, y, z, t }
const START = () => ({ x: 4380, y: 3470, z: WATER, vx: 0, vy: 0, vz: 0, t: 0, rest: 1 });   // (floating in the east half)
rule('beachball', {
  init: () => ({ beachball: START() }),
  tick(s, now) {
    const ball = s.hang.beachball; if (!ball) { s.hang.beachball = START(); return true; }
    const c = ballAt(ball, now);
    let hit = false;
    for (const id of s.seat) {
      const p = s.pos[id]; if (!p) continue;
      const px = p.x * W, py = p.y * H, pz = p.z ?? heightAt(px, py), q = was.get(id) || { x: px, y: py, z: pz, t: now - 200 };
      was.set(id, { x: px, y: py, z: pz, t: now });
      if (Math.abs(px - c.x) > 600 || Math.abs(py - c.y) > 600) continue;
      /* the nearest the duck came to the ball since the last heartbeat */
      const sx = px - q.x, sy = py - q.y, L2 = sx * sx + sy * sy, u = L2 ? cl(((c.x - q.x) * sx + (c.y - q.y) * sy) / L2, 0, 1) : 1;
      const cx = q.x + sx * u, cy = q.y + sy * u, cz = q.z + (pz - q.z) * u, dx = c.x - cx, dy = c.y - cy, d = Math.hypot(dx, dy);
      if (d > R + DR || c.z > cz + 58 || c.z + 2 * R < cz) continue;   // (not touching: too far, over its head or under its feet)
      const dts = cl((now - q.t) / 1000, .05, 1), vx = cl(sx / dts, -900, 900), vy = cl(sy / dts, -900, 900), vd = Math.hypot(vx, vy);
      const nx = d > 1 ? dx / d : vd ? vx / vd : 1, ny = d > 1 ? dy / d : vd ? vy / vd : 0;
      const into = c.vx * nx + c.vy * ny; if (into < 0) { c.vx -= 1.6 * into * nx; c.vy -= 1.6 * into * ny; }   // (bounced off the duck)
      const vn = Math.max(0, vx * nx + vy * ny), push = Math.max(vn * 1.4, 170) * (p.sp ? 1.3 : 1), along = c.vx * nx + c.vy * ny;
      if (along < push) { c.vx += (push - along) * nx; c.vy += (push - along) * ny; }
      c.vx += (vx - vn * nx) * .3; c.vy += (vy - vn * ny) * .3;   // (and carried a little the way the duck goes)
      const air = !!p.j;   // (jumping: its j stays until it lands)
      if (air) { c.vz = Math.max(c.vz, c.z > cz + 14 ? 680 : 520); c.vx *= .6; c.vy *= .6; }   // a jump into it (or up under it): up it goes
      else c.vz = Math.max(c.vz, onWater(c.x, c.y) ? 90 : 130 + vn * .2);
      c.x = cx + nx * (R + DR + 1); c.y = cy + ny * (R + DR + 1);
      delete c.rest; hit = true;
    }
    for (const id of was.keys()) if (!s.pos[id]) was.delete(id);
    if (hit || (c.rest && !ball.rest)) { s.hang.beachball = pack(c, now); return true; }   // (at rest: written down, so it isn't worked out from long ago)
    return false;
  },
});

/* ---------- every screen: the ball, its shadow, its ripples ---------- */
let lastHn = null, el = null, sh = null, spinG = null, shown = null, err = { x: 0, y: 0, z: 0 }, lastKey = '', spin = 0, rip = 0, wasUp = false;
const BW = 48, BH = 52;
/* where the ball is drawn this frame (the rubber ducks get out of its way) */
export const ballShown = () => shown;
activity({
  id: 'beachball',
  mount(ctx) {
    const layer = ctx.world.board.querySelector('.hang-props');
    sh = document.createElement('div'); sh.className = 'hang-ballsh'; sh.style.zIndex = 3;
    el = document.createElement('div'); el.className = 'hang-ball'; el.innerHTML = beachBall({ w: BW, h: BH, shadow: false });
    spinG = el.querySelector('g[transform^="rotate"]');
    layer.append(sh, el); shown = null; lastKey = ''; lastHn = null;
  },
  unmount() { el?.remove(); sh?.remove(); el = sh = spinG = shown = null; },
  step(dt, now, ctx) {
    const ball = (ctx.state().hang || {}).beachball; if (!ball || !el) return;
    const b = ballAt(ball, now, true), key = ball.t + ',' + ball.x + ',' + ball.y;
    if (key !== lastKey) {   // touched: no jump on the screen (the gap eases away), a pat if it's near me
      if (shown && lastKey) {
        err = { x: shown.x - b.x, y: shown.y - b.y, z: shown.z - b.z };
        if (Math.hypot(err.x, err.y) > 400) err = { x: 0, y: 0, z: 0 };
        const m = ctx.world.at(ctx.me); if (m && Math.hypot(m.x - b.x, m.y - b.y) < 700) sfx.pat();
      }
      lastKey = key;
    }
    const hn = b.hn || 0;   // a wall hit (counted in the ball's own numbers, so every screen has it): a ping and that wall's glow
    if (lastHn !== null && hn > lastHn && ctx.world.at(ctx.me)) {
      const w = b.hs === 'w';
      play(w ? 'pingLow' : 'pingHigh', { x: w ? POOL.x0 : POOL.x1, y: b.y }); wallGlow(b.hs, (b.hv || 0) / 380);
    }
    lastHn = hn;
    const k = Math.exp(-dt / .12); err.x *= k; err.y *= k; err.z *= k;
    const prev = shown; shown = { x: b.x + err.x, y: b.y + err.y, z: b.z + err.z, rest: b.rest };
    const sfc = heightAt(shown.x, shown.y), wet = onWater(shown.x, shown.y), up = shown.z > sfc + 6;
    if (prev) {
      spin += (shown.x - prev.x) / R * 57.3 + (shown.y - prev.y) / R * 20;
      const v = Math.hypot(shown.x - prev.x, shown.y - prev.y) / Math.max(dt, .001);
      if (wet && !up && v > 30 && now - rip > 220) { rip = now; ripple(shown.x, shown.y, .25, 20); }
      if (wet && wasUp && !up) { splash(shown.x, shown.y, .35); }
    }
    wasUp = up;
  },
  draw(now, ctx) {
    if (!el || !shown) return;
    const Wd = ctx.world, sc = Wd.sc;
    const sfc = heightAt(shown.x, shown.y), wet = onWater(shown.x, shown.y), floating = wet && shown.z <= sfc + 2;
    const bob = floating ? Math.sin(now / 640) * 1.8 + 7 : 0, sway = floating ? Math.sin(now / 1900) * 3 : 0;
    const f = Wd.toScreen(shown.x + sway, shown.y, shown.z - bob);
    const hide = Wd.inside || !Wd.seen(f.left - BW / 2 * sc, f.top - BH * sc, BW * sc, (BH + shown.z - sfc + 20) * sc);   // (inside, or off the screen with its shadow: hidden)
    if (el.hidden !== hide) { el.hidden = sh.hidden = hide; }
    if (hide) return;
    el.style.transform = `translate(${(f.left - BW / 2 * sc).toFixed(1)}px, ${(f.top - (BH - 3) * sc).toFixed(1)}px) scale(${sc.toFixed(4)})`;
    el.style.zIndex = Math.round(shown.y) + 10;
    el.style.clipPath = floating ? `inset(0 0 ${(3 + bob).toFixed(1)}px 0)` : '';   // (the part under the water)
    if (spinG) spinG.setAttribute('transform', `rotate(${(spin % 360).toFixed(1)} ${BW / 2} ${BH - 3 - (BW / 2 - 1.5)})`);
    /* its shadow on whatever is under it: smaller and fainter the higher it is */
    const hgt = Math.max(0, shown.z - sfc), k = 1 / (1 + hgt / 140), g = Wd.toScreen(shown.x, shown.y, sfc);
    sh.style.transform = `translate(${g.left.toFixed(1)}px, ${g.top.toFixed(1)}px) scale(${(sc * k).toFixed(4)})`;
    sh.style.opacity = floating ? 0 : (k * (wet ? .5 : .9)).toFixed(2);
  },
});
