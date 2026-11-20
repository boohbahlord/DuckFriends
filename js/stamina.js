/* ---------- my sprint's stamina, in every mode ----------
   Dead Ducks Arcade's sprint bar in every mode (the owner's, Nov 18 16:43Z + 16:50Z: "no to faster speed BUT they do
   get a 7 second stamina bar for when they do sprint to limit it"). The sprint stays as fast as before (game.js
   SPEED.sprint, Hangout's SPRINT). Sprinting drains it in L4.SPRINT ms (3.5 s since Nov 20); not sprinting fills it as fast.
   Once empty my duck walks until the bar is full again (3.5 s of sprint, 3.5 s to fill: Nov 20). Only my own duck's, on this device: game.js asks sprintStep every frame, and the HP meter's
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
  left = Math.min(1, left + (dt * 1000 * fill) / L4.SPRINT);
  /* once it ran out, it sprints again only when the bar is full (the owner's, Nov 20 18:27Z: "sprint has to be all the
     way up before you can use it again. But it regens as fast as it was lost") */
  if (left >= 1) tired = false;
  return false;
}
/* my sprint left (0 … 1) and whether I'm too tired to sprint, for the blue bar under my HP meter */
export const sprintLeft = () => [left, tired];
/* full again (a new game, Dead Ducks Arcade mounting) */
export function sprintReset() {
  left = 1;
  tired = false;
}
