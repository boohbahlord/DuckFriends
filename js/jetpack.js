/* ---------- the jetpack ----------
   Quacky Zombies' fireplace has it (Stage 4, the owner's: 10 seconds of flight before it needs a refill), and in the
   other modes it's the Jetpack special, opened at 20,736 Jumps (never in Mad God Justin). Switched on, it's worn on the
   duck's back; holding Space (a phone: holding the jump button) flies up, Shift keeps the height, letting go falls.
   Only the time in the air with the jets on burns fuel. In Quacky Zombies the fuel is the host's (l4ddrules.js: a
   Max Ammo fills it); in the other modes it's my own and fills up again on the ground. As in a jump, a duck high in the
   air dodges a hit, but not near the ground, taking off or coming down. The pictures are Noah's (jetart.js). */
import { jetpackSVG, JET_FLAME, JET_AT, JET_AT_FROG } from "./jetart.js";

export const JET = {
  FUEL: 10000, // ms of flight (the owner's)
  RISE: 2.4, // duck heights a second, going up
  PUSH: 16, // duck heights a second, every second: how fast it gets going up
  TOP: 2.6, // duck heights over the ground at most
  SAFE: 0.86, // duck heights: higher than this a hit misses (a jump dodges from the same height: its first fifth)
  REFILL: 10000, // ms on the ground to fill up again (the other modes)
};

/* the pack on a duck's back, its two flames under the nozzles (shown while the jets are on: css .gduck.jet-on) */
export function jetHTML(look) {
  const at = look && look.style === "datboi" ? JET_AT_FROG : JET_AT;
  return `<span class="gduck-jet" aria-hidden="true" style="--jx:${at.x};--jy:${at.y};--jk:${at.k}">${jetpackSVG()}<i class="jet-f far">${JET_FLAME}</i><i class="jet-f near">${JET_FLAME}</i></span>`;
}

/* the other modes: my fuel, used in the air and filled again on the ground */
let fuel = JET.FUEL;
export const myFuel = () => fuel;
export function burnFuel(dt, flying) {
  fuel = flying
    ? Math.max(0, fuel - dt * 1000)
    : Math.min(JET.FUEL, fuel + (dt * 1000 * JET.FUEL) / JET.REFILL);
  return fuel;
}
