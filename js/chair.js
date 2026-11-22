/* ---------- the chair: one thing in every mode (B6c) ----------
   The owner's, Nov 21 16:53Z: "Chairs can go through as many enemies as which its image is on top of, and it damages
   them as it goes through it. So it can hit multiple enemies at once, and the hitbox is based off the actual chair image
   itself. And that's how it works for Mad God Justin as well, because the chair should be the same there as it is in
   Zombies. The only difference is that the amount of damage it does". Its picture is CHAIR.W duck widths across (css
   .thrown.k-chair i), times the Size of the duck that threw it (sh.sc); it hits every body its picture overlaps, each
   once (sh.hit, sh.got), and flies on. What a hit takes stays each mode's own number: Dead Ducks Arcade's ARMS.chair
   (guns.js), the boards' DMG.chair (boardfire.js), Mad God Justin's soak (boardfire.js shotHits). Why its own file: the
   one hitbox both the boards and the maps' zombies read */
import { zOf, hOk, hLock } from "./heights.js";

const CHAIR = { W: 2 };
/* how near the chair's middle comes to a body's for its picture to overlap it, in the body's half widths (a bullet's
   point: 1): the body's own half width and the picture's, thrown by a duck sc big */
export const chairReach = (sc = 1) => 1 + CHAIR.W * (sc || 1);
/* the zombies the chair's picture is over at (x, y) (world px) that it hasn't hit yet, now marked hit (sh.hit): a
   zombie's half width is hw by hh world px (a bullet's reach, l4ddrules.js) and the chair's height as a shot's
   (heights.js) */
export function chairOver(sh, zs, x, y, hw, hh, x0, y0) {
  const k = chairReach(sh.sc),
    out = zs.filter(
      (z) =>
        z.st !== 3 &&
        !(sh.hit || []).includes(z.i) &&
        Math.hypot((z.x - x) / (hw * k), (z.y - y) / (hh * k)) < 1 &&
        hOk(sh, zOf(z, "zombie"), z.x, z.y, x0, y0) &&
        !hLock(sh, zOf(z, "zombie")),
    );
  if (out.length) sh.hit = [...(sh.hit || []), ...out.map((z) => z.i)];
  return out;
}
