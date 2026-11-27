/* ---------- how long a knocked-down duck can't move ----------
   I want a duck that plays dead to be unable to move for a while: a second on the boards by default, 6 seconds in
   Duck Cabin (as long as from Justin's gun), and the host picks another time in Additional settings (s.options.downMs:
   0 for none). One time for every way of being knocked down (a bullet, a dagger, a cat's swipe, a kill
   command), so they can't drift apart. While it lasts the duck can't move: Duck Cabin keeps it in s.hang.still
   (hangout/rules.js hangStill), the boards in s.down = { id: until } (downStill). Then it plays dead until it moves. */
import { baseMode } from "../sandboxrules.js";
import { modeOf } from "../modes.js";

export const DEAD_STILL = 6000; // ms: the Duck Cabin's default
export const DOWN_OK = [0, 500, 1000, 2000, 3000, 5000, 6000]; // (6 s only in Duck Cabin)
const cabin = (s) => !!modeOf(baseMode(s.options)).cabinHome; // (Sandbox on Duck Cabin too)
const DOWN_NORMAL = 3000; // ms: the normal games' default (owner, Nov 16: their death lasts three seconds)
export const downFor = (s) => {
  const v = s.options.downMs;
  return DOWN_OK.includes(v) && (v !== DEAD_STILL || cabin(s))
    ? v
    : cabin(s)
      ? DEAD_STILL
      : modeOf(baseMode(s.options)).downMs || DOWN_NORMAL;
};
/* I want the normal games (every mode but Quacky Zombies and Duck Cabin) to give a duck that comes
   back from dying its body back at once (its wounds, holes and knocked-off things gone) and then SPAWN_MS of spawn
   protection: nothing hurts it, and what it shoots, swings or blows up hurts nobody (s.prot[id] = until) */
export const SPAWN_MS = 2500;
export const normalGame = (s) => !modeOf(s.options.mode).ownDeath;
export const shielded = (s, id, now) => !!(s.prot && s.prot[id] > now);
export function comeBack(s, id, now) {
  if (!normalGame(s)) return;
  if (s.pw && s.pw[id]) {
    const rest = { ...s.pw };
    delete rest[id];
    s.pw = Object.keys(rest).length ? rest : null;
  }
  s.prot = { ...live(s.prot, now), [id]: now + SPAWN_MS };
}
const live = (o, now) => {
  const st = {};
  for (const [k, v] of Object.entries(o || {})) if (v > now) st[k] = v;
  return st;
};
/* Invulnerability: no hit takes a duck down, it only flashes red (s.hurt[id] = when; the screens flash on a new stamp).
   Never in Quacky Zombies (the owner's, Nov 4), from the settings or the command line */
export const NO_INVULN = ["l4dd", "surv"];
export const invuln = (s) =>
  +s.options.invuln === 1 && !NO_INVULN.includes(s.options.mode);
export function hurtFx(s, id, now) {
  s.hurt = { ...(s.hurt || {}), [id]: now };
  return true;
}
export function holdDown(s, id, now, ms0) {
  const ms = ms0 ?? downFor(s); // (ms0: a time of its own, as a crit's CRIT_DOWN: wounds.js)
  s.up = { ...(s.up || {}), [id]: now + Math.max(ms, GET_UP_MIN) }; // (when the duck stands up by itself: standUps)
  if (cabin(s)) {
    if (!s.hang) return;
    const st = live(s.hang.still, now);
    if (ms) st[id] = now + ms;
    s.hang = { ...s.hang, still: st };
    return;
  }
  const st = live(s.down, now);
  if (ms) st[id] = now + ms;
  s.down = st;
}
/* a duck on the boards that can't move for now (Duck Cabin has hangStill) */
export const downStill = (s, id, now) => !!(s.down && s.down[id] > now);

/* A duck gets up by itself when its time is up, where it lies (a seated duck stays seated, so nobody has to leave a table
   to stop playing dead). With None the dead look still shows for a second. Duck Cabin's ghosts take over from the standing
   up: onGetUp(fn) adds a hook, fn(s, id, now) returns true when it took the duck (the ghost), and then the duck stays down. */
export const GET_UP_MIN = 1000; // ms
/* a Duck Cabin ghost (ghosts.js): it can't be hit and can't use anything */
export const isGhost = (s, id) =>
  !!(s.hang && s.hang.ghost && s.hang.ghost[id]);
const hooks = [];
export const onGetUp = (fn) => {
  hooks.push(fn);
};
/* the host's heartbeat: true when a duck stood up */
export function standUps(s, now) {
  if (!s.up) return false;
  let ch = false;
  const rest = {};
  for (const [id, at] of Object.entries(s.up)) {
    if (at > now) {
      rest[id] = at;
      continue;
    }
    const P = s.players[id];
    if (P && P.dead && !hooks.some((fn) => fn(s, id, now))) {
      delete P.dead;
      comeBack(s, id, now);
      ch = true;
    }
  }
  const fired = Object.keys(s.up).length !== Object.keys(rest).length;
  s.up = rest;
  return ch || fired;
}
