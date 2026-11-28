/* ---------- my sprint's stamina, in every mode ----------
   Dead Ducks Arcade's sprint bar in every mode (the owner's, Nov 18 16:43Z + 16:50Z: "no to faster speed BUT they do
   get a 7 second stamina bar for when they do sprint to limit it"). The sprint stays as fast as before (game.js
   SPEED.sprint, Hangout's SPRINT). Sprinting drains it in L4.SPRINT ms; not sprinting fills it SPRINT.refill times as
   slowly (gamedefaults.js: 5 s and 7.5 s since Nov 20 18:46Z).
   Once empty, or once I let go of a sprint, my duck walks until the bar is full again. Only my own duck's, on this device: game.js asks sprintStep every frame, and the HP meter's
   blue bar asks sprintLeft. */
import { L4 } from "./l4ddrules.js";
import { SPRINT } from "./gamedefaults.js";

let left = 1,
  tired = false,
  was = false, // (sprinting last frame)
  asked = false; // (asking to sprint last frame)

/* a sprint tried while it can't be (empty, or not full again): my sprint bars flash white once, each try (the owner's,
   Nov 28 03:28Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7: "the stamina flashes white once for every time
   you try to spring in every game mode before it is filled back up"); the bar under my HP meter and the one under my
   name, by the browser's own animations */
const WHITE = "brightness(0) invert(1)",
  FLASH = [
    { filter: WHITE },
    { filter: WHITE, offset: 0.6 },
    { filter: "none" },
  ];
function flash() {
  if (typeof document === "undefined") return;
  for (const e of document.querySelectorAll(".hpm-stam, .l4-sprint"))
    e.animate(FLASH, 220);
}

/* one frame: on, I want to sprint and am walking; true when my duck sprints this frame. fill: how many times as fast it
   fills again (Sandbox: a group's Regen stamina, sbgroups.js grStam) */
export function sprintStep(on, dt, fill = 1, ask = on) {
  if (ask && !asked && tired) flash(); // (ask: sprint asked for, moving or not)
  asked = ask;
  if (on && !tired && left > 0) {
    left = Math.max(0, left - (dt * 1000) / L4.SPRINT);
    if (left <= 0) tired = true;
    was = true;
    return true;
  }
  /* a sprint let go of locks it too, until the bar is full again (the owner's, Nov 21 05:10Z: "as soon as you start
     sprinting and you let go of the sprint, you cannot sprint again until the sprint bar is full") */
  if (was && left < 1) tired = true;
  was = false;
  left = Math.min(1, left + (dt * 1000 * fill) / (L4.SPRINT * SPRINT.refill));
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
  was = false;
  asked = false;
}
