/* ---------- using a weapon: one module for every mode (step 8f) ----------
   8f-1, the gate: may I use it now. The board (rules.js case "use") and the maps (l4ddrules.js l4Use) ask the same
   questions here; where their numbers differ, each side's way is breed data (GATE_BREEDS), never an if on the mode.
   8f-2, what comes out: the shot's kind, the shotgun's cone and a burst's rounds, the same for the board, the maps and
   Mad God Justin (each side still builds its own shot from these: its units differ).
   8f-3, flight: the shots in the air, one loop (flyShots).
   8f-4, melee: a swing's life, the pan's miss and the knock-back as data (ARMS knock). */
import { ARMS } from "./guns.js";
import { NADE } from "./gamedefaults.js";
import { DUCK } from "./units.js";

/* full auto: the shots can come a little bunched over the network, so they may come this share of the wait early */
const AUTO_SLACK = 0.2;
/* each side's slack rule: the board takes it off when the weapon is free again (its wait's end, or its reload's), as a
   share of its plain wait; the maps cut the wait since the last use by it */
export const GATE_BREEDS = {
  board: { slack: "end" },
  maps: { slack: "share" },
};
const SLACK = {
  end: (g, now) => now < g.ends - (g.auto ? g.cool * AUTO_SLACK : 0),
  share: (g, now) => now - g.last < g.cool * (g.auto ? 1 - AUTO_SLACK : 1),
};
/* still waiting? g: { auto, cool (the wait, ms), ends ("end": when it's free again), last ("share": its last use) } */
export const waiting = (G, g, now) => SLACK[G.slack](g, now);
/* held back: one zebra cake in the room at a time; the Laser Rifle overheated can't fire until it has cooled
   (over: asks the laser's heat, l4ddrules.js laserHeat, only for the laser) */
export const heldBack = (s, what, over) =>
  (what === "zebra" && !!s.zcake) || (what === "laser" && over());
/* the burst rifle (A.burst): that many rounds a press, or the rest of its clip; every other weapon one */
export const roundsOf = (A, left) =>
  A && A.burst ? Math.min(A.burst, left) : 1;
/* a magazine with `left` shots after `many` more: what's left, and whether it's empty (it reloads by itself then) */
export const afterShots = (left, many) => ({
  left: left - many,
  empty: left - many <= 0,
});

/* ---------- what comes out (8f-2) ---------- */
/* the kind of shot weapon w fires (how it looks and what it does): the bow an arrow, the shotgun its pellets, the
   grenade launcher its grenade, a gun its own bullet (ARMS' k), anything else its own name */
const SHOT_OF = { bow: "arrow", shotgun: "pellet", glauncher: "lgren" };
export const shotKind = (w) => SHOT_OF[w] || (ARMS[w] && ARMS[w].k) || w;
/* a shotgun's cone: the angle of each of its n pellets round the aim a0, spread out evenly `spread` radians each way,
   each nudged a little at random (one roll a pellet, in order) */
const NUDGE = 0.08;
export const coneOf = (a0, n, spread) =>
  Array.from(
    { length: n },
    (_, i) =>
      a0 + spread * ((i / (n - 1)) * 2 - 1) + (Math.random() - 0.5) * NUDGE,
  );
/* a burst's round i of the shot numbered n: its own number and when it leaves (gap ms after the one before); the first
   leaves at once, as the shot */
export const roundAt = (n, i, now, gap) =>
  i ? { n: n * 10 + i, t: now + i * gap } : {};
/* 8f-3, flight: every shot in the air, one beat, one loop for every mode. A burst's round still waiting stays; a
   grenade (sh.tb: the thrown one in every mode, and the maps' launcher's) flies by nadeFly, with F.wallAt(x, y, z, sh)
   and F.floor (FLAT where there are no heights); the board's launcher's grenade and the bullets fly by each side's
   hooks, as what they hit differs (ducks on the board; zombies, NPCs and ducks on the maps).
   F: { U ([x, y]: a spot's units over a share of the board or world), at(sh, ms), walled(sh, at), boom(sh, at),
   launched(sh, age), bullet(sh, age), wallAt, floor }; each true keeps the shot. What's kept comes back, in order */
export function flyShots(list, now, F) {
  const keep = [];
  for (const sh of list) {
    const age = now - sh.t;
    if (
      age < 0 ||
      (sh.tb != null
        ? nadeFly(sh, now, F)
        : sh.k === "lgren"
          ? F.launched(sh, age)
          : F.bullet(sh, age))
    )
      keep.push(sh);
  }
  return keep;
}
/* the ground a grenade flies over with no heights (a board, Hangout's floor plan; in shares): flat, its edges its only
   walls */
export const FLAT = {
  floor: () => 0,
  wallAt: (x, y) => x < 0 || x > 1 || y < 0 || y > 1,
};
/* ---------- a map's grenade, thrown or launched (NADE; the director plan, Nov 28) ----------
   The leg it is on, from sh.tb ms: from (x0, y0) (shares) at (vx, vy) (shares a second) across, from zb world px over
   sh.hz at vz px a second up, g px a second² down. nadeAt: where it is at `now`, { x, y (shares), z (world px over
   sh.hz) }: every screen draws it from here (boardfire.js shotAt), the host flies it (nadeFly). A throw (nadeThrow):
   T ms to go `far` world px over an arc `peak` duck heights high, from the hand, going off at `end` */
export const nadeAt = (sh, now) => {
  const u = Math.max(0, now - sh.tb) / 1000;
  return {
    x: sh.x0 + sh.vx * u,
    y: sh.y0 + sh.vy * u,
    z: sh.zb + sh.vz * u - (sh.g * u * u) / 2,
  };
};
export function nadeThrow(ux, uy, far, T, peak, end, now, [w, h]) {
  const s = T / 1000,
    up = peak * DUCK,
    zb = NADE.HAND * DUCK,
    r = Math.sqrt((up - zb) / up),
    top = (r * s) / (1 + r), // (up from the hand to its top, then down to the ground at T: textbook projectile)
    g = (2 * up) / (s - top) ** 2;
  return {
    tb: now,
    vx: +((ux * far) / s / w).toFixed(6),
    vy: +((uy * far) / s / h).toFixed(6),
    zb: Math.round(zb),
    vz: Math.round(g * top),
    g: Math.round(g),
    end,
  };
}
/* the host's beat for one: from where it got to (sh.ts) to now, 20 ms a step. Something taller than it where it goes
   (F.wallAt(x, y, z): world px, its height) turns it back, each way it ran into reflected, NADE.KEEP of its speed
   kept, and so does a roof it rises into from under it; a floor under it (F.floor(x, y, z): that floor's height) stops
   it there, falling. When its fuse ends (sh.end)
   it goes off where it is (F.boom) */
const NADE_STEP = 20,
  NADE_BOUNCES = 8; // (at most a beat: one wedged in a corner stops)
function nadeFly(sh, now, F) {
  const [w, h] = F.U,
    to = Math.min(now, sh.end);
  let t = sh.ts || sh.tb,
    turns = 0;
  while (t < to) {
    const was = nadeAt(sh, t),
      t2 = Math.min(to, t + NADE_STEP),
      at = nadeAt(sh, t2),
      z = sh.hz + at.z;
    if (sh.vx || sh.vy) {
      const ax = F.wallAt(at.x * w, was.y * h, z, sh),
        ay = F.wallAt(was.x * w, at.y * h, z, sh);
      if (ax || ay || F.wallAt(at.x * w, at.y * h, z, sh)) {
        const k = turns++ < NADE_BOUNCES ? NADE.KEEP : 0;
        Object.assign(sh, {
          tb: t,
          x0: was.x,
          y0: was.y,
          zb: was.z,
          vz: sh.vz - (sh.g * (t - sh.tb)) / 1000,
          vx: (ax || !ay ? -sh.vx : sh.vx) * k,
          vy: (ay || !ax ? -sh.vy : sh.vy) * k,
        });
        continue;
      }
    }
    const vz = sh.vz - (sh.g * (t2 - sh.tb)) / 1000,
      hi = sh.hz + was.z,
      past = vz < 0 && hi > z ? F.floor(at.x * w, at.y * h, hi) : -Infinity,
      fl = Math.max(
        F.floor(at.x * w, at.y * h, z),
        past <= hi ? past : -Infinity,
      ); // (falling: a roof it was over and went down past this step stops it too)
    if (vz > 0 && fl > sh.hz + was.z && fl <= z) {
      Object.assign(sh, {
        tb: t,
        x0: was.x,
        y0: was.y,
        zb: was.z,
        vz: -(sh.vz - (sh.g * (t - sh.tb)) / 1000) * NADE.KEEP,
      }); // (up into a roof from under it: back down)
      continue;
    }
    if (sh.g && z <= fl && vz < 0)
      Object.assign(sh, {
        tb: t2,
        x0: at.x,
        y0: at.y,
        zb: fl - sh.hz,
        vx: 0,
        vy: 0,
        vz: 0,
        g: 0,
      }); // (down: it lies there)
    t = t2;
  }
  sh.ts = to;
  const p = nadeAt(sh, to);
  sh.lx = p.x;
  sh.ly = p.y;
  if (now < sh.end) return true;
  F.boom(sh, { x: p.x * w, y: p.y * h, z: sh.hz + p.z });
  return false;
}
/* 8f-4, melee: a swing hurts for its swing's ms (ARMS swing), each thing it reaches once, one live swing a swinger;
   the pan misses half of them (ARMS miss), rolled once at the press. Each side keeps its own record (the board's s.atk
   names the weapon sp, the maps' s.hang.l4k w) and its own targets */
const swingMs = (k) => (ARMS[k.w || k.sp] || ARMS.knife).swing;
export const swinging = (k, now) => now - k.t <= swingMs(k);
export const swingOn = (list, rec, now) => [
  ...(list || []).filter((k) => now - k.t < swingMs(k) && k.by !== rec.by),
  rec,
];
export const swingMisses = (w) => {
  const m = (ARMS[w] || {}).miss;
  return !!m && Math.random() < m;
};
