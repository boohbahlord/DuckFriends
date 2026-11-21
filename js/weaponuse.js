/* ---------- using a weapon: one module for every mode (step 8f) ----------
   8f-1, the gate: may I use it now. The board (rules.js case "use") and the maps (l4ddrules.js l4Use) ask the same
   questions here; where their numbers differ, each side's way is breed data (GATE_BREEDS), never an if on the mode. */

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
