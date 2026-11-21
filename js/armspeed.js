/* ---------- how fast the weapons work, in every mode ----------
   I want the guns, the arrows, the knife, the hammer and the daggers to work as fast as they do in Quacky Zombies, in
   every mode (the owner, Nov 4). These are Quacky Zombies' numbers, the one place they live: Quacky Zombies (l4ddrules.js
   ARMS) and the other modes (rules.js, mgjrules.js) both read them from here.
   Speeds are in Duck Cabin's pixels a second; the other modes' boards measure them in board widths a second, and a
   computer's board is about BOARD_PX wide. Times are in ms. */
export const BOARD_PX = 1100;
export const ARM_SPEED = {
  handgun: 1000,
  bow: 820,
  dagger: 700,
  shotgun: 1100,
};
export const ARM_COOL = {
  handgun: 200,
  knife: 250,
  hammer: 880, // (the fire axe's: the owner's, Nov 21 18:59Z; it was 1100)
  bow: 400,
  dagger: 600,
  shotgun: 900,
  axe: 880, // (25% faster than the hammer was: the owner's, Nov 16)
  sword: 167, // (50% faster than the knife)
  pan: 880, // (as slow as the fire axe)
};
export const ARM_SWING = {
  knife: 125,
  hammer: 250,
  axe: 200,
  sword: 83,
  pan: 200,
}; // (how long a stab or a swing hurts)
export const ARM_RELOAD = 1200; // (the handgun's magazine)
/* a speed as board widths a second */
export const boardSpeed = (w) => ARM_SPEED[w] / BOARD_PX;
