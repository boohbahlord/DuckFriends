/* ---------- using a weapon: one module for every mode (step 8f) ----------
   8f-1, the gate: may I use it now. The board (rules.js case "use") and the maps (l4ddrules.js l4Use) ask the same
   questions here; where their numbers differ, each side's way is breed data (GATE_BREEDS), never an if on the mode.
   8f-2, what comes out: the shot's kind, the shotgun's cone and a burst's rounds, the same for the board, the maps and
   Mad God Justin (each side still builds its own shot from these: its units differ).
   8f-3, flight: the shots in the air, one loop (flyShots).
   8f-4, melee: a swing's life, the pan's miss and the knock-back as data (ARMS knock). */
import { ARMS } from "./guns.js";

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
/* 8f-3, flight: every shot in the air, one beat, one loop for every mode. A burst's round still waiting stays; a thrown
   grenade arcs and goes off where it lands, or where a wall stops it (at its last spot); the launcher's grenade and the
   bullets fly by each side's hooks, as what they hit differs (ducks on the board; zombies, NPCs and ducks on the maps).
   F: { fuse (ms), U ([x, y]: a spot's units over a share of the board or world), at(sh, ms), walled(sh, at),
   boom(sh, at), launched(sh, age), bullet(sh, age) }; each true keeps the shot. What's kept comes back, in order */
export function flyShots(list, now, F) {
  const keep = [];
  for (const sh of list) {
    const age = now - sh.t;
    if (
      age < 0 ||
      (sh.k === "grenade"
        ? arc(sh, age, F)
        : sh.k === "lgren"
          ? F.launched(sh, age)
          : F.bullet(sh, age))
    )
      keep.push(sh);
  }
  return keep;
}
const arc = (sh, age, F) => {
  const at = F.at(sh, Math.min(age, F.fuse)),
    [w, h] = F.U,
    wall = F.walled(sh, at);
  if (wall || age >= F.fuse) {
    F.boom(sh, wall ? { x: sh.lx * w, y: sh.ly * h } : at);
    return false;
  }
  sh.lx = at.x / w;
  sh.ly = at.y / h;
  return true;
};
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
