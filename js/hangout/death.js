/* ---------- how long a knocked-down duck can't move ----------
   I want a duck that plays dead to be unable to move for a while: half a second on the boards by default, 6 seconds in
   Duck Cabin (as long as from Justin's gun), and the host picks another time in Additional settings (s.options.downMs:
   0 for none). One time for every way of being knocked down (a bullet, a dagger, a cat's swipe, a kill
   command), so they can't drift apart. While it lasts the duck can't move: Duck Cabin keeps it in s.hang.still
   (hangout/rules.js hangStill), the boards in s.down = { id: until } (downStill). Then it plays dead until it moves. */
export const DEAD_STILL = 6000;   // ms: the Duck Cabin's default
export const DOWN_GAMES = 500;    // ms: the boards' default
export const DOWN_OK = [0, 500, 1000, 2000, 3000, 5000, 6000];   // (6 s only in Duck Cabin)
const cabin = s => s.options.mode === 'hang';
export const downFor = s => { const v = s.options.downMs; return DOWN_OK.includes(v) && (v !== DEAD_STILL || cabin(s)) ? v : cabin(s) ? DEAD_STILL : DOWN_GAMES; };
const live = (o, now) => { const st = {}; for (const [k, v] of Object.entries(o || {})) if (v > now) st[k] = v; return st; };
export function holdDown(s, id, now) {
  const ms = downFor(s);
  s.up = { ...(s.up || {}), [id]: now + Math.max(ms, GET_UP_MIN) };   // (when the duck stands up by itself: standUps)
  if (cabin(s)) { if (!s.hang) return; const st = live(s.hang.still, now); if (ms) st[id] = now + ms; s.hang = { ...s.hang, still: st }; return; }
  const st = live(s.down, now); if (ms) st[id] = now + ms; s.down = st;
}
/* a duck on the boards that can't move for now (Duck Cabin has hangStill) */
export const downStill = (s, id, now) => !!(s.down && s.down[id] > now);

/* A duck gets up by itself when its time is up, where it lies (a seated duck stays seated, so nobody has to leave a table
   to stop playing dead). With None the dead look still shows for a second. Duck Cabin's ghosts take over from the standing
   up: onGetUp(fn) adds a hook, fn(s, id, now) returns true when it took the duck (the ghost), and then the duck stays down. */
export const GET_UP_MIN = 1000;   // ms
/* a Duck Cabin ghost (ghosts.js): it can't be hit and can't use anything */
export const isGhost = (s, id) => !!(s.hang && s.hang.ghost && s.hang.ghost[id]);
const hooks = [];
export const onGetUp = fn => { hooks.push(fn); };
/* the host's heartbeat: true when a duck stood up */
export function standUps(s, now) {
  if (!s.up) return false;
  let ch = false; const rest = {};
  for (const [id, at] of Object.entries(s.up)) {
    if (at > now) { rest[id] = at; continue; }
    const P = s.players[id];
    if (P && P.dead && !hooks.some(fn => fn(s, id, now))) { delete P.dead; ch = true; }
  }
  const fired = Object.keys(s.up).length !== Object.keys(rest).length; s.up = rest;
  return ch || fired;
}
