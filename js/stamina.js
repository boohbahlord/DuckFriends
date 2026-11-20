/* ---------- my sprint's stamina, in every mode ----------
   Dead Ducks Arcade's sprint bar in every mode (the owner's, Nov 18 16:43Z + 16:50Z: "no to faster speed BUT they do
   get a 7 second stamina bar for when they do sprint to limit it"). The sprint stays as fast as before (game.js
   SPEED.sprint, Hangout's SPRINT). Sprinting drains it in L4.SPRINT ms (7 s); not sprinting fills it again as slowly.
   Once empty my duck walks until I let go of the sprint (Shift, the stick's edge, a fast swipe), then it can sprint on
   what has filled back. Only my own duck's, on this device: game.js asks sprintStep every frame, and the HP meter's
   blue bar asks sprintLeft. */
import { L4 } from "./l4ddrules.js";

let left = 1,
  tired = false;

/* one frame: on, I want to sprint and am walking; true when my duck sprints this frame. fill: how many times as fast it
   fills again (Sandbox: a group's Regen stamina, sbgroups.js grStam) */
export function sprintStep(on, dt, fill = 1) {
  if (on && !tired && left > 0) {
    left = Math.max(0, left - (dt * 1000) / L4.SPRINT);
    if (left <= 0) tired = true;
    return true;
  }
  if (!on) tired = false; // (it can sprint again as soon as the sprint is let go)
  left = Math.min(1, left + (dt * 1000 * fill) / L4.SPRINT);
  return false;
}
/* my sprint left (0 … 1) and whether I'm too tired to sprint, for the blue bar under my HP meter */
export const sprintLeft = () => [left, tired];
/* full again (a new game, Dead Ducks Arcade mounting) */
export function sprintReset() {
  left = 1;
  tired = false;
}
