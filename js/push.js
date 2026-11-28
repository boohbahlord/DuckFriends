/* ---------- push and knock-back: one module for every body in every mode (the cornerstone's one module per mechanic,
   after 8f: 2) ----------
   How far every hit pushes is worked out here (meleePush, blastPush) and every body goes it over its weight (pushOn).
   A push moves a body along a way a step at a time and stops before the first step it can't stand on (pushAlong). Each
   kind of body gives its own steps (its units) and its own "can it stand there": a duck (boardfire.js shove: duck
   lengths on the board's shares, Hangout's walls and the cabin's side), a zombie (l4ddrules.js knockZ: world px, zOk)
   and a car (carpush.js: world px, carClear). */
import { modeOf } from "./modes.js";
import { baseMode } from "./sandboxrules.js";
import { scaleOf } from "./duck.js";
import { WEIGHT, KNOCK } from "./gamedefaults.js";
import { ARMS, DEAD_WEIGHT } from "./guns.js";
import { overlapH } from "./heights.js";
import { DUCK } from "./hangout/layoutbase.js";

/* weight follows Size (the owner's, Nov 21 15:56Z: "a duck's weight increases in proportion with its size by
   percentage. So a duck that is 110% bigger has 10% more weight and also 10% less speed ... A duck with more weight has
   more melee damage. In the same ratio ... So knockback becomes 10% more"): a duck's Size (Customize's, duck.js
   scaleOf; 1: 100%) is its weight, its melee's damage and push go with it, and it walks 10% slower for each 10% bigger,
   never slower than WEIGHT.SLOWEST. A grenade's or any shot's push never goes with the thrower's (16:53Z: "Knockback from
   projectiles do not become affected by your weight"). Justin and the computers' made ducks without one: 1 */
export const sizeOf = (s, id) =>
  (s.players && s.players[id] && scaleOf(s.players[id].duck)) || 1;
/* do two bodies walk into each other at their heights (heights.js overlapH)? Player a's feet at az, and player b's at
   bz (b null: a zombie, DUCK tall); each a duck tall times its Size (world.js and l4dd.js crowd) */
export const meets = (s, a, az, b, bz) =>
  overlapH(az, DUCK * sizeOf(s, a), bz, b == null ? DUCK : DUCK * sizeOf(s, b));
/* its weight: its Size and the dead weight it carries (16:53Z: "this kind of weight ... does not add to your
   knockback"; nor to its walk): what it holds out (s.pos' w), or with WEIGHT.DEAD_FROM "all", everything in its kit */
const deadOf = (w) => DEAD_WEIGHT[(ARMS[w] || {}).dw] || 0;
const carried = (s, id) =>
  WEIGHT.DEAD_FROM === "all"
    ? ((s.hang && s.hang.l4a && s.hang.l4a[id]) || {}).sl || []
    : [s.pos && s.pos[id] && s.pos[id].w];
export const weightOf = (s, id) =>
  sizeOf(s, id) + carried(s, id).reduce((t, w) => t + deadOf(w), 0);
const walkK = (s, id) =>
  id == null ? 1 : Math.max(WEIGHT.SLOWEST, 2 - sizeOf(s, id));
/* the ratio: a push of far on a body of weight w moves it far / w (110%: 1/1.1 as far); an immobile one, never */
export const pushTaken = (far, w) => (w === Infinity ? 0 : far / w);
/* immobile (the owner's, 15:56Z: "select immobile, true. And now it has no movement. It's not affected by knockback.
   It doesn't have its own weight, and it never moves ever"): a body with im. Not Speed 0, which only can't move itself:
   a hit still pushes it (Nov 21 14:52Z, "zero speed = can't move itself") */
export const immobile = (o) => o.im === true;

/* the lobby's Walking speed: how much faster or slower than normal every duck walks. The zombies of Quacky Zombies and
   the computers there go by it too, so the zombies stay as fast next to the ducks as the owner set them */
const WALKS = { slow: 0.6, normal: 1, fast: 1.5 };
export const walkOf = (s, id) =>
  (WALKS[s && s.options && s.options.walk] || 1) * walkK(s, id); // (id: a duck, as much slower as it's bigger: walkK)
/* the one push (the owner's, Nov 28 04:05Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H: "one physics rule
   for everything, by weight and stats"): a hit gives a push in world px, how far it moves a body of weight 1, and every
   body goes that over its weight (pushOn). A melee hit's: its weapon's knock (guns.js ARMS: a blunt hit hard, a knife
   almost nothing) times the swinger's weight, its Size (none: a thrown thing's, never the thrower's: 16:53Z). A blast's,
   o of its reach out (0 its middle, 1 its edge): sideways more the farther out (half as far at its middle as at its
   edge), and up higher the nearer the middle (h, duck sizes). A mode scales them (modes.js push; gamedefaults.js KNOCK otherwise). No bullet pushes (Nov 21
   17:48Z) */
const knockK = (s) => ({ ...KNOCK, ...modeOf(baseMode(s.options)).push });
export const meleePush = (s, by, w) =>
  ((ARMS[w] || ARMS.knife).knock || 0) * sizeOf(s, by) * knockK(s).melee;
export const blastPush = (s, o) => ({
  px: (knockK(s).blast * (1 + o)) / 2,
  h: KNOCK.lift * (1 - o),
});
/* how far a push of px moves a body: a duck by its weight (weightOf), a zombie (alive or dead) 1, an immobile one never,
   a car WEIGHT.CAR */
export const pushOn = (s, kind, b, px) =>
  pushTaken(
    px,
    kind === "duck"
      ? weightOf(s, b)
      : kind === "car"
        ? WEIGHT.CAR
        : immobile(b)
          ? Infinity
          : 1,
  );
/* the one loop: n steps from at ([x, y]); next(i, at) is step i's spot, ok(spot, at) says if the body can stand there,
   fix(spot) is where it's kept (a zombie's whole px). Returns where it stopped */
export function pushAlong(at, n, next, ok, fix = (q) => q) {
  for (let i = 1; i <= n; i++) {
    const q = next(i, at);
    if (!ok(q, at)) break;
    at = fix(q);
  }
  return at;
}
