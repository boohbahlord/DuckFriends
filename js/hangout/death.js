/* ---------- how long a duck stays dead in Duck Cabin ----------
   The owner wants every death in Duck Cabin to last as long as one from Justin's gun: a bullet or a dagger, a cat's
   swipe, a kill command. One time for all of them, so they can't drift apart; while it lasts the duck can't move
   (s.hang.still = { id: until }, hangout/rules.js hangStill). The boards keep theirs (dead until you move). */
export const DEAD_STILL = 6000;   // ms
export function holdDown(s, id, now) {
  if (!s.hang) return;
  const st = {}; for (const [k, v] of Object.entries(s.hang.still || {})) if (v > now) st[k] = v;
  st[id] = now + DEAD_STILL; s.hang = { ...s.hang, still: st };
}
