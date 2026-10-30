/* ---------- the little rubber ducks in the pool ----------
   Seven little rubber ducks float in the pool, each in its own half (the lane rope keeps floating things on their side),
   drifting slowly round where they like to be and bobbing on the water. Where they drift is worked out from the room's
   clock, so they are in the same places on every screen. A duck swimming into one (or the beach ball) nudges it away,
   and it glides on a little and drifts slowly back to its way: the nudges are worked out on each screen from where the
   ducks are, so every screen sees much the same. */
import { activity } from "./registry.js";
import { POOL } from "./layout.js";
import { WATER, SOUTH, swimming, ripple } from "./water.js";
import { ballShown } from "./beachball.js";
import { rubberDuck } from "./art.js";

const RW = 32,
  RH = 30; // a little duck's box (world px); its waterline at RH − 5
const Y = "#ffd23f";
/* where each one likes to be (x, y), how far it wanders, how fast, its color */
const DUCKS = [
  [3300, 3290, Y],
  [3560, 3660, Y],
  [3760, 3240, "#ff8fb8"],
  [3290, 3760, Y],
  [4120, 3360, Y],
  [4480, 3720, "#ff9a3a"],
  [4600, 3260, Y],
].map(([hx, hy, c], i) => ({
  hx,
  hy,
  c,
  ax: 60 + ((i * 37) % 50),
  ay: 40 + ((i * 23) % 35),
  wx: 0.09 + ((i * 0.017) % 0.07),
  wy: 0.07 + ((i * 0.023) % 0.06),
  p: i * 1.7,
  q: i * 2.9,
  lo: hx < POOL.rope ? POOL.x0 + 30 : POOL.rope + 22,
  hi: hx < POOL.rope ? POOL.rope - 22 : POOL.x1 - 30,
  ox: 0,
  oy: 0,
  vx: 0,
  vy: 0,
  face: 1,
  rip: 0,
  x: hx,
  y: hy,
}));
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const STEPS = {
  x1: POOL.x0 + 150,
  y0: POOL.steps[0] - 20,
  y1: POOL.steps[1] + 20,
}; // (not up on the steps)
const path = (d, t) => [
  d.hx +
    d.ax * Math.sin(t * d.wx + d.p) +
    d.ax * 0.35 * Math.sin(t * d.wx * 2.3 + d.q),
  d.hy +
    d.ay * Math.sin(t * d.wy + d.q) +
    d.ay * 0.3 * Math.sin(t * d.wy * 1.9 + d.p),
];

let els = [],
  was = new Map();
activity({
  id: "rubberducks",
  mount(ctx) {
    const layer = ctx.world.board.querySelector(".hang-props");
    els = DUCKS.map((d) => {
      const e = document.createElement("div");
      e.className = "hang-rduck";
      e.innerHTML = rubberDuck({ w: RW, h: RH, color: d.c });
      layer.append(e);
      return e;
    });
  },
  unmount() {
    els.forEach((e) => e.remove());
    els = [];
    was.clear();
  },
  step(dt, now, ctx) {
    if (!els.length || !dt) return;
    const t = now / 1000,
      s = ctx.state(),
      pushers = [];
    for (const id of s.seat) {
      // the ducks in the water, and how fast they go
      const a = ctx.world.at(id);
      if (!a || !swimming(a.x, a.y, a.z)) {
        was.delete(id);
        continue;
      }
      const o = was.get(id) || a;
      was.set(id, { x: a.x, y: a.y });
      pushers.push({
        x: a.x,
        y: a.y,
        r: 48,
        vx: (a.x - o.x) / dt,
        vy: (a.y - o.y) / dt,
      });
    }
    const b = ballShown();
    if (b && b.z <= WATER + 30)
      pushers.push({ x: b.x, y: b.y, r: 40, vx: 0, vy: 0 });
    for (const d of DUCKS) {
      const [px, py] = path(d, t);
      let x = px + d.ox,
        y = py + d.oy;
      for (const p of pushers) {
        // nudged away, and carried a little the way the duck swims
        const dx = x - p.x,
          dy = y - p.y,
          dd = Math.hypot(dx, dy);
        if (dd >= p.r) continue;
        const nx = dd ? dx / dd : 1,
          ny = dd ? dy / dd : 0,
          push = p.r - dd;
        d.ox += nx * push;
        d.oy += ny * push;
        x += nx * push;
        y += ny * push;
        d.vx += nx * (60 + Math.max(0, p.vx * nx + p.vy * ny) * 0.6);
        d.vy += ny * (60 + Math.max(0, p.vx * nx + p.vy * ny) * 0.6);
      }
      const k = Math.exp(-1.1 * dt); // the water slows it, and it drifts back to its way
      d.vx = d.vx * k - d.ox * 0.12 * dt;
      d.vy = d.vy * k - d.oy * 0.12 * dt;
      d.ox += d.vx * dt;
      d.oy += d.vy * dt;
      /* inside its half of the water, off the steps */
      const lo = x < STEPS.x1 && y > STEPS.y0 && y < STEPS.y1 ? STEPS.x1 : d.lo;
      const cx = cl(px + d.ox, lo, d.hi),
        cy = cl(py + d.oy, POOL.y0 + 26, SOUTH - 14);
      if (cx !== px + d.ox) {
        d.ox = cx - px;
        d.vx *= -0.3;
      }
      if (cy !== py + d.oy) {
        d.oy = cy - py;
        d.vy *= -0.3;
      }
      const mx = cx - d.x;
      d.x = cx;
      d.y = cy;
      if (Math.abs(mx) > 0.02) d.face = mx > 0 ? 1 : -1;
      if (Math.hypot(d.vx, d.vy) > 40 && now - d.rip > 260) {
        d.rip = now;
        ripple(cx, cy, 0.15, 12);
      }
    }
  },
  draw(now, ctx) {
    const Wd = ctx.world,
      sc = Wd.sc;
    DUCKS.forEach((d, i) => {
      const e = els[i];
      if (!e) return;
      const bob = Math.sin(now / 430 + d.p * 3) * 1.4,
        f = Wd.toScreen(d.x, d.y, WATER + bob),
        tilt = Math.sin(now / 610 + d.q) * 7,
        x = f.left - (RW / 2) * sc,
        y = f.top - (RH - 5) * sc;
      const hide = Wd.inside || !Wd.seen(x, y, RW * sc, RH * sc); // (inside, or off the screen: hidden, and nothing more to do)
      if (e.hidden !== hide) e.hidden = hide;
      if (hide) return;
      const tr = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(4)})`;
      if (e._tr !== tr) {
        e._tr = tr;
        e.style.transform = tr;
      }
      const z = Math.round(d.y) + 10;
      if (e._z !== z) {
        e._z = z;
        e.style.zIndex = z;
      }
      const inner = `scaleX(${d.face}) rotate(${tilt.toFixed(1)}deg)`;
      if (e._in !== inner) {
        e._in = inner;
        e.firstElementChild.style.transform = inner;
      }
    });
  },
});
