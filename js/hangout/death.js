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
  if (cabin(s)) { if (!s.hang) return; const st = live(s.hang.still, now); if (ms) st[id] = now + ms; s.hang = { ...s.hang, still: st }; return; }
  const st = live(s.down, now); if (ms) st[id] = now + ms; s.down = st;
}
/* a duck on the boards that can't move for now (Duck Cabin has hangStill) */
export const downStill = (s, id, now) => !!(s.down && s.down[id] > now);
