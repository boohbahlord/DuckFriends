/* ---------- soccer: one ball on the field, one net at its east end ----------
   The ball is s.hang.ball = { x, y, vx, vy, t, g, n, kt }: where it was at time t (world px, px a second), when it went
   in the net (g), how many kicks so far (n) and when the last one was (kt). Where it is at any later time is worked out
   the same way on every screen and by the host (sim: steps of 20 ms, only + − × ÷ and square roots, so every browser
   gets the same numbers): it rolls, slows down, bounces off the field's edge, the trees and the net's posts and sides,
   and settles in the net. So the host only writes it when something happens (a kick, a goal, it stops) and now and then
   while it rolls (tick), and every screen moves it on smoothly between.

   Kicks: my duck walking into the ball kicks it the way it walks, harder when sprinting (a duck in the air over it
   doesn't touch it), and a ball rolling into a duck that stands still bounces off it. My screen sees that first and
   sends { t: 'hang', k: 'ball', x, y, vx, vy, at }: the ball as it leaves my duck, so it moves at once here; the host
   checks it (near the ball, near my duck, not too fast) and every screen takes it from that moment, eased in where its
   own guess was off. Computers kick it on the host when they walk into it. A goal: a little confetti and a horn, no
   score; a few seconds later the ball is back on the center spot. */
import { rule, activity } from './registry.js';
import { isGhost } from './death.js';
import { PROPS, SOLIDS, FIELD, W, H, EDGE, heightAt } from './layout.js';
import * as A from './art.js';
import { profile } from '../store.js';
import { sfxContext, sfxOut, soon } from '../sound.js';
import { fewer } from '../gfx.js';

const R = 16, DT = 20, FRIC = .982, DRAG = .4, BOUNCE = .62, STOP = 6, MAX_SP = 1250, MAX_STEPS = 1500, RESET = 3500;
const CX = 22 + R, CY = 12 + R;   // a duck's feet and the ball touch inside this ellipse (x across, y in depth)
const MID = { x: (FIELD.x0 + FIELD.x1) / 2, y: (FIELD.y0 + FIELD.y1) / 2 };
const B = { x0: FIELD.x0 - 80, y0: FIELD.y0 - 70, x1: W - EDGE - R, y1: FIELD.y1 + 70 };   // the ball stays inside (the field and its edge)
const G = PROPS.find(p => p.kind === 'goal') || { x: 5640, y: 940, w: 130, d: 520 };
const NET = { mouth: G.x + 10, x0: G.x + 24, x1: G.x + 100, y0: G.y + 16, y1: G.y + G.d - 16, in0: G.y + 24 + R * .5, in1: G.y + G.d - 24 - R * .5 };
const NEAR = SOLIDS.filter(b => b.x1 > B.x0 - R && b.x0 < B.x1 + R && b.y1 > B.y0 - R && b.y0 < B.y1 + R);
const r2 = v => Math.round(v * 100) / 100;
const fresh = (t, n = 0) => ({ x: MID.x, y: MID.y, vx: 0, vy: 0, t: Math.round(t), g: 0, n, kt: 0 });

/* ---------- the ball's motion (the same on every screen) ---------- */
function move(b, h) {
  let x = b.x + b.vx * h, y = b.y + b.vy * h;
  if (x < B.x0) { x = 2 * B.x0 - x; b.vx = -b.vx * BOUNCE; } else if (x > B.x1) { x = 2 * B.x1 - x; b.vx = -b.vx * BOUNCE; }
  if (y < B.y0) { y = 2 * B.y0 - y; b.vy = -b.vy * BOUNCE; } else if (y > B.y1) { y = 2 * B.y1 - y; b.vy = -b.vy * BOUNCE; }
  for (const s of NEAR) {   // trees, the net's posts, sides and back: round off them
    const cx = x < s.x0 ? s.x0 : x > s.x1 ? s.x1 : x, cy = y < s.y0 ? s.y0 : y > s.y1 ? s.y1 : y, dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) continue;
    if (d2 < 1e-9) { x = b.x; y = b.y; b.vx = -b.vx * BOUNCE; b.vy = -b.vy * BOUNCE; continue; }
    const d = Math.sqrt(d2), ux = dx / d, uy = dy / d, vn = b.vx * ux + b.vy * uy;
    if (vn < 0) { b.vx -= (1 + BOUNCE) * vn * ux; b.vy -= (1 + BOUNCE) * vn * uy; }
    x = cx + ux * R; y = cy + uy * R;
  }
  b.x = x; b.y = y;
}
function step(b) {
  const inNet = b.x > NET.x0 && b.x < NET.x1 && b.y > NET.y0 && b.y < NET.y1;
  let sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  const n = Math.max(1, Math.ceil(sp * DT / 1000 / 6));
  for (let k = 0; k < n; k++) move(b, DT / 1000 / n);
  sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  const ns = sp * (inNet ? .86 : FRIC) - DRAG;
  if (ns <= STOP) { b.vx = 0; b.vy = 0; } else { b.vx *= ns / sp; b.vy *= ns / sp; }
  b.t += DT;
  if (!b.g && b.x - R > NET.mouth + 2 && b.y > NET.in0 && b.y < NET.in1) b.g = b.t;   // over the line, between the posts
}
/* the ball at time `until`, in whole steps from b (t: the last step's time) */
export function sim(b, until) {
  const o = { ...b };
  for (let k = Math.min(MAX_STEPS, Math.floor((until - o.t) / DT)); k > 0 && (o.vx || o.vy); k--) step(o);
  return o;
}
const touch = (bx, by, x, y) => { const ex = (bx - x) / CX, ey = (by - y) / CY; return ex * ex + ey * ey < 1; };
const outOf = (bx, by, x, y) => { const ex = (bx - x) / CX, ey = (by - y) / CY, e = Math.sqrt(ex * ex + ey * ey) || 1; return [x + ex / e * CX * 1.03, y + ey / e * CY * 1.03]; };
const clampB = (x, y) => [Math.min(B.x1, Math.max(B.x0, x)), Math.min(B.y1, Math.max(B.y0, y))];

/* ---------- the rule (the host) ---------- */
const botWas = new Map();   // a computer's last spot (world px), for which way it walks
function kicked(b, at, x, y, vx, vy) {
  const sp = Math.sqrt(vx * vx + vy * vy); if (sp > MAX_SP) { vx *= MAX_SP / sp; vy *= MAX_SP / sp; }
  [x, y] = clampB(x, y);
  return { x: r2(x), y: r2(y), vx: r2(vx), vy: r2(vy), t: Math.round(at), g: b.g && b.g <= at ? b.g : 0, n: (b.n || 0) + 1, kt: Math.round(at) };
}
rule('ball', {
  init: () => ({ ball: fresh(0) }),
  act(s, a, now) {
    const b = s.hang.ball, p = s.pos[a.id]; if (!b || !p) return false;
    const at = Math.round(+a.at), x = +a.x, y = +a.y, vx = +a.vx, vy = +a.vy;
    if (![at, x, y, vx, vy].every(Number.isFinite) || at > now + 400 || at < now - 2000 || at <= (b.kt || 0)) return false;
    const cur = sim(b, at);
    if (Math.hypot(cur.x - x, cur.y - y) > 220 || Math.hypot(p.x * W - x, p.y * H - y) > 240) return false;   // (only a ball near it, from a duck near it)
    s.hang.ball = kicked(b, at, x, y, vx, vy);
    return true;
  },
  tick(s, now) {
    let b = s.hang.ball; if (!b) { s.hang.ball = fresh(now); return true; }
    if (b.g && now - b.g > RESET) { s.hang.ball = fresh(now, (b.n || 0) + 1); return true; }   // back on the center spot
    let ch = false;
    const cur = sim(b, now);
    for (const id of s.seat) {   // computers walking into it
      const P = s.players[id], p = s.pos[id]; if (!P || !P.bot || !p || isGhost(s, id)) continue;
      const x = p.x * W, y = p.y * H, was = botWas.get(id); botWas.set(id, { x, y });
      if ((p.j && now - p.j < 1200) || !touch(cur.x, cur.y, x, y)) continue;
      const mx = was ? x - was.x : 0, my = was ? y - was.y : 0, m = Math.hypot(mx, my), dx = cur.x - x, dy = cur.y - y, d = Math.hypot(dx, dy) || 1;
      const ux = m > 1 ? mx / m : dx / d, uy = m > 1 ? my / m : dy / d, [ox, oy] = outOf(cur.x, cur.y, x, y);
      if (cur.vx * ux + cur.vy * uy > 400 || now <= (b.kt || 0)) continue;
      b = s.hang.ball = kicked(b, now, ox, oy, ux * 560, uy * 560); ch = true; break;
    }
    if (ch || !(b.vx || b.vy)) return ch;
    const nb = sim(b, now);
    if ((nb.g && !b.g) || !(nb.vx || nb.vy) || now - b.t >= 600) { s.hang.ball = { ...nb, x: r2(nb.x), y: r2(nb.y), vx: r2(nb.vx), vy: r2(nb.vy) }; return true; }
    return false;
  },
  left(s, id) { botWas.delete(id); },
});

/* ---------- sounds: a thump for a kick, a horn for a goal ---------- */
let ac = null;
const audio = () => (ac = sfxContext());   // (the game's one clock for sounds: sound.js)
const vol = () => ((profile.settings.sound ?? 100) / 100) * ((profile.settings.sfx ?? 100) / 100);
function voice(f, dur, { type = 'sine', gain = .1, at = 0, slide = 0, attack = .012, lp = 0, noise = false } = {}) {
  const a = audio(), v = vol(); if (!a || !v) return;
  const t = soon(a) + at, g = a.createGain();   // (a little ahead: set for "now", the fade-in is skipped and it pops)
  attack = Math.max(!noise && f < 200 ? .016 : .005, attack);   // (a low thump comes in slower, so it's a thud, not a pop)
  let src;
  if (noise) {
    const n = Math.ceil(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) * Math.min(1, i / (a.sampleRate * .005));
    src = a.createBufferSource(); src.buffer = buf;
  } else { src = a.createOscillator(); src.type = type; src.frequency.setValueAtTime(f, t); if (slide) src.frequency.exponentialRampToValueAtTime(f * slide, t + dur); }
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * v, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let out = src;
  if (lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; out = out.connect(fl); }
  out.connect(g).connect(sfxOut()); src.start(t); src.stop(t + dur + .03);
}
const thump = (k = 1) => { voice(0, .09, { noise: true, gain: .14 * k, lp: 520, attack: .004 }); voice(150, .12, { gain: .12 * k, slide: .5, attack: .004 }); };
function horn() {   // an air horn: two blasts of a low chord
  for (const [at, dur] of [[0, .32], [.42, .75]]) for (const f of [233, 294, 349]) voice(f, dur, { type: 'sawtooth', gain: .045, at, attack: .02, lp: 1500, slide: .985 });
}

/* ---------- on the screen ---------- */
const COLORS = ['#ff4f8b', '#ffd23f', '#3ad8ff', '#7ee081', '#b07aff', '#ff8a2a', '#f4f4f0'];
let ball = null, spinG = null, spinAt = '', base = '', off = { x: 0, y: 0, t: 0 }, shown = null, spin = 0, trail = [], cool = 0, heard = -1, cheered = 0, bits = [], box = null, drawn = 0;
const BW = 34, BH = 38;
export const ballShown = () => shown && { ...shown };   // where this screen draws the ball (world px)
function cheer(ctx, now) {
  const x0 = NET.mouth + 30, y0 = (NET.in0 + NET.in1) / 2;
  for (let i = 0, n = fewer(28); i < n; i++) {   // thrown up out of the net's mouth, toward the field
    const e = document.createElement('div'), a = Math.PI * (.6 + Math.random() * .8), sp = 70 + Math.random() * 190;
    e.className = 'hang-confetti'; e.style.background = COLORS[i % COLORS.length]; box.append(e);
    bits.push({ e, x: x0 + (Math.random() - .5) * 30, y: y0 + (Math.random() - .5) * 260, h: 70 + Math.random() * 40, vx: Math.cos(a) * sp, vy: (Math.random() - .5) * 120, vh: 380 + Math.random() * 300, r: Math.random() * 360, vr: (Math.random() - .5) * 900, until: now + 1900 + Math.random() * 600 });
  }
  const me = ctx.duck(); if (me && Math.hypot(me.x * W - x0, me.y * H - y0) < 1500) horn();
}
activity({
  id: 'soccer',
  mount(ctx) {
    A.useHangArtCSS();
    box = ctx.world.board.querySelector('.hang-props');
    ball = document.createElement('div'); ball.className = 'hp hang-ball'; ball.hidden = true;
    Object.assign(ball.style, { width: BW + 'px', height: BH + 'px' });
    ball.innerHTML = A.soccerBall({ w: BW, h: BH }); box.append(ball);
    spinG = ball.querySelector('g[transform^="rotate"]'); spinAt = spinG ? (spinG.getAttribute('transform').match(/rotate\([^ ]+ (.*)\)/) || [])[1] || '' : '';
    const b = ctx.state().hang && ctx.state().hang.ball; heard = b ? b.n || 0 : -1; cheered = b ? b.g || 0 : 0;
  },
  unmount() { if (ball) ball.remove(); for (const p of bits) p.e.remove(); ball = null; bits = []; shown = null; trail = []; base = ''; },
  step(dt, now, ctx) {
    const s = ctx.state(), b = s.hang && s.hang.ball; if (!b || !ball) return;
    const T = sim(b, now), f = Math.min(DT, Math.max(0, now - T.t)) / 1000, tx = T.x + T.vx * f, ty = T.y + T.vy * f;
    /* a new start (a kick, the host's next word): ease from where it was shown */
    const sig = [b.t, b.n, b.x, b.y].join();
    if (sig !== base) { base = sig; if (shown && Math.hypot(shown.x - tx, shown.y - ty) < 300) off = { x: shown.x - tx, y: shown.y - ty, t: now }; else off = { x: 0, y: 0, t: now }; }
    const k = Math.exp(-(now - off.t) / 150), nx = tx + off.x * k, ny = ty + off.y * k;
    if (shown) { const d = Math.hypot(nx - shown.x, ny - shown.y); if (d < 200) spin += (nx - shown.x || ny - shown.y) >= 0 ? d / R * 57.3 : -d / R * 57.3; }
    shown = { x: nx, y: ny };
    /* sounds: a kick nearby, a goal */
    const me = ctx.duck(), mx = me ? me.x * W : 0, my = me ? me.y * H : 0, near = me && !ctx.world.inside && Math.hypot(mx - nx, my - ny) < 1100;
    if ((b.n || 0) !== heard) { if ((b.n || 0) > heard && heard >= 0 && near && !(b.vx === 0 && b.vy === 0 && b.x === MID.x && b.y === MID.y)) thump(Math.min(1, Math.hypot(b.vx, b.vy) / 900 + .35)); heard = b.n || 0; }
    if (T.g && T.g !== cheered && now >= T.g) { cheered = T.g; if (now - T.g < 2500) cheer(ctx, now); }
    /* my duck walks into it (or it rolls into my duck): a kick, sent at once */
    if (!me) return;
    /* how fast my duck walks: over the last tenth of a second (one frame alone is too jumpy) */
    const prev = trail[trail.length - 1]; if (prev && Math.hypot(mx - prev.x, my - prev.y) > 150) trail = [];   // (put somewhere else: not a walk)
    trail.push({ x: mx, y: my, t: now }); while (trail.length > 2 && now - trail[1].t > 110) trail.shift();
    const o = trail[0], span = (now - o.t) / 1000, vx = span > .02 ? (mx - o.x) / span : 0, vy = span > .02 ? (my - o.y) / span : 0, sp = Math.hypot(vx, vy);
    if (ctx.world.inside || (me.z ?? 0) - heightAt(mx, my) > 14 || now < cool || !touch(tx, ty, mx, my)) return;
    const dx = tx - mx, dy = ty - my, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    let kx, ky;
    if (sp > 40 && vx * dx + vy * dy > 0) {   // walking into it: kicked the way my duck walks (sprinting: harder)
      const kick = Math.min(MAX_SP, sp * 1.6 + 60); let wx = vx / sp * .8 + ux * .2, wy = vy / sp * .8 + uy * .2; const wn = Math.hypot(wx, wy) || 1; wx /= wn; wy /= wn;
      if (T.vx * wx + T.vy * wy > kick * .8) return;   // (already going that way, as fast)
      kx = wx * kick; ky = wy * kick;
    } else {
      const vn = T.vx * ux + T.vy * uy; if (vn > -30) return;   // it rolled into my duck: it bounces off
      kx = T.vx - 1.5 * vn * ux; ky = T.vy - 1.5 * vn * uy;
    }
    const [ox, oy] = outOf(tx, ty, mx, my);
    ctx.send({ t: 'hang', k: 'ball', x: r2(ox), y: r2(oy), vx: r2(kx), vy: r2(ky), at: Math.round(now) });
    cool = now + 140;
  },
  draw(now, ctx) {
    if (!ball || !shown) return;
    const Wd = ctx.world, sc = Wd.sc, vw = Wd.vw, vh = Wd.vh;
    const a = Wd.toScreen(shown.x - BW / 2, shown.y - (BH - 3), heightAt(shown.x, shown.y));
    const vis = !Wd.inside && a.left < vw + 40 && a.left + BW * sc > -40 && a.top < vh + 40 && a.top + BH * sc > -40;
    if (ball.hidden !== !vis) ball.hidden = !vis;
    if (vis) {
      ball.style.transform = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px) scale(${sc.toFixed(4)})`;
      const zi = Math.round(shown.y) + 10; if (ball._zi !== zi) { ball._zi = zi; ball.style.zIndex = zi; }
      if (spinG) spinG.setAttribute('transform', `rotate(${(spin % 360).toFixed(1)} ${spinAt})`);
    }
    /* the confetti: thrown up out of the net, falling, fading */
    const dt = Math.min(.05, Math.max(0, (now - (drawn || now)) / 1000)); drawn = now;
    bits = bits.filter(p => {
      if (now > p.until || Wd.inside) { p.e.remove(); return false; }
      p.vh -= 900 * dt; p.h = Math.max(0, p.h + p.vh * dt); const air = p.h > 0;
      if (air) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.vx *= .985; p.vy *= .985; }
      const q = Wd.toScreen(p.x, p.y, heightAt(p.x, p.y) + p.h);
      p.e.style.transform = `translate(${q.left.toFixed(1)}px, ${q.top.toFixed(1)}px) scale(${sc.toFixed(3)}) rotate(${p.r.toFixed(0)}deg)`;
      p.e.style.opacity = Math.min(1, (p.until - now) / 500).toFixed(2);
      return true;
    });
  },
});
