/* ---------- how a held weapon and the screen move (owner, Nov 16) ----------
   - Sway: a held weapon or item sways very lightly as its duck walks (faster and a little wider the faster it goes:
     a phone's joystick pushed halfway sways it slower), trails a little behind the way its duck moves, and mid-jump
     sways its own way too (dipping as the duck rises, lifting as it falls); both at once.
   - Sprint: half a second to ease into the faster sway and out of it.
   - Recoil: each shot kicks a gun back and lifts its end, which bounces back down (more for heavier guns: fx.js MUZZLE).
   - Adrenaline: a duck on an adrenaline shot (or the Speed Boost drop) jitters, its weapon too.
   - Shake: firing shakes my screen, a little for a pistol, most for the chain gun but never too much; an adrenaline
     shot taken wobbles it fast for a moment.
   Everything here is per duck and costs a few sums a frame. */
import { MUZZLE, heavyOff } from "./fx.js";

const DEG = Math.PI / 180;
const S = new Map(); // duck id -> its motion

function stateOf(id) {
  let o = S.get(id);
  if (!o)
    S.set(
      id,
      (o = {
        x: 0,
        y: 0,
        z: 0,
        t: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ph: Math.random() * 6,
        spr: 0,
        kt: -1e9,
        ka: 0,
      }),
    );
  return o;
}

/* duck id is at (x, y) on the screen, z px over the floor, now; sprinting or not; unit: a duck's size (css px).
   Called once a frame for every duck holding something; returns how its weapon sways: [turn (rad, + is clockwise),
   dx, dy (css px)] for a weapon pointing at `aim` (rad), `left` if it's turned to the left */
export function sway(id, x, y, z, now, sprinting, unit, aim, left) {
  const o = stateOf(id),
    dt = o.t ? Math.min(0.1, (now - o.t) / 1000) : 0;
  if (dt > 0) {
    const k = 1 - Math.exp(-dt / 0.09); // (smoothed over about a tenth of a second)
    o.vx += ((x - o.x) / dt - o.vx) * k;
    o.vy += ((y - o.y) / dt - o.vy) * k;
    o.vz += ((z - o.z) / dt - o.vz) * k;
    o.spr += ((sprinting ? 1 : 0) - o.spr) * Math.min(1, dt / 0.5); // (half a second into sprint and out)
  }
  if (!o.t || Math.hypot(x - o.x, y - o.y) > unit * 3) o.vx = o.vy = 0; // (a jump across the board: no sway from it)
  o.x = x;
  o.y = y;
  o.z = z;
  o.t = now;
  const sp = Math.min(1.6, Math.hypot(o.vx, o.vy) / (unit * 2.4)), // (how fast, 1 about a walk)
    air = z > 1,
    up = left ? 1 : -1; // (turning this way lifts its end)
  o.ph += dt * Math.PI * 2 * (1.4 + 1.1 * sp) * (1 + 0.35 * o.spr); // (its steps: quicker as it goes faster)
  const step = Math.min(1, sp) * (air ? 0.3 : 1),
    walk = 3 * DEG * step * (1 + 0.3 * o.spr) * Math.sin(o.ph),
    bob = -unit * 0.025 * step * Math.abs(Math.sin(o.ph)),
    /* it trails behind its duck's sideways motion (sideways to where it points) */
    side =
      ((-Math.sin(aim) * o.vx + Math.cos(aim) * o.vy) / (unit * 3)) *
      -2.5 *
      DEG,
    /* mid-jump: rising, its end dips; falling, it lifts (the weapon is a little late to follow) */
    jump = air
      ? -up * Math.max(-1, Math.min(1, o.vz / (unit * 4))) * 6 * DEG
      : 0;
  return [walk + Math.max(-4 * DEG, Math.min(4 * DEG, side)) + jump, 0, bob];
}

/* a shot fired by duck id with gun: its kick starts over */
export function kick(id, gun, now) {
  const M = MUZZLE[gun];
  if (!M) return;
  const o = stateOf(id);
  o.kt = now;
  o.ka = M.kick;
}
/* its kick now: [turn (rad, lifting its end), back (css px)] */
export function kickOf(id, now, unit, left) {
  const o = S.get(id);
  if (!o || !o.ka) return [0, 0];
  const t = now - o.kt;
  if (t > 450) return [0, 0];
  const e = Math.exp(-t / 85),
    lift = 8 * DEG * o.ka * e * Math.cos(t / 38), // (up, then a little bounce back down and up again)
    back = unit * 0.09 * o.ka * Math.exp(-t / 55);
  return [(left ? 1 : -1) * lift, back];
}
/* a duck on adrenaline: a small fast jitter for its weapon, [turn, dx, dy] */
export function jitter(on, unit) {
  if (!on) return [0, 0, 0];
  return [
    (Math.random() - 0.5) * 3 * DEG,
    (Math.random() - 0.5) * unit * 0.04,
    (Math.random() - 0.5) * unit * 0.04,
  ];
}
/* a duck gone from the board: its motion forgotten */
export function forget(id) {
  S.delete(id);
}

/* ---------- my screen's shake ---------- */
let trauma = 0,
  shook = 0,
  wobbleTill = 0;
/* a shot of mine (how much: fx.js MUZZLE's shake) */
export function shake(amount) {
  if (heavyOff()) return;
  trauma = Math.min(1, trauma + amount); // (at most about 6 px: the chain gun held down, a grenade close by)
}
/* an adrenaline shot taken: a short fast wobble */
export function wobble(now, ms = 650) {
  if (heavyOff()) return;
  wobbleTill = now + ms;
}
/* where the board sits now, [x, y] css px (0, 0 when still) */
export function shakeNow(now) {
  const dt = shook ? Math.min(0.1, (now - shook) / 1000) : 0;
  shook = now;
  trauma = Math.max(0, trauma - dt * 2.4);
  let x = 0,
    y = 0;
  if (trauma > 0.005) {
    const a = 6 * trauma;
    x += a * (Math.sin(now / 23) * 0.6 + Math.sin(now / 9.7) * 0.4);
    y += a * (Math.cos(now / 19) * 0.6 + Math.sin(now / 11.3) * 0.4);
  }
  if (now < wobbleTill) {
    const k = (wobbleTill - now) / 650;
    x += 2.5 * k * Math.sin(now / 17);
    y += 1.5 * k * Math.cos(now / 13);
  }
  return [x, y];
}
