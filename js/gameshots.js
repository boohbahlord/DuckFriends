/* ---------- The bullets in the air, the blood bursts and the pools that reuse their elements ----------
   Moved out of game.js to keep that file small (a pure move; the owner's, Nov 22). */
import { place } from "./gameboard.js";
import { go } from "./router.js";
import { el, $ } from "./ui.js";
import { isL4dd } from "./l4ddrules.js";
import { shotStop } from "./l4dd.js";
import { sbOnBoard } from "./sandboxrules.js";
import { zombieStop } from "./boardzombies.js";
import { hatLayers, HAT_TOP } from "./hats.js";
import { faceLayer } from "./faces.js";
import { beakSVG } from "./beaks.js";
import { fxImpact, fxBurst, fxSpurt, fxKnock, fxEye } from "./fx.js";
import { geo, world } from "./game.js";

/* ---------- pools (owner 2026-11-15: "I agree with reusing objects") ----------
   The bullets in the air and the blood bursts are made and thrown away many times a second. Done with, they're kept
   (out of the page) and handed out again for the next one that looks the same, instead of building new elements every
   time: fewer small freezes while the browser cleans up. Put back in the page, an element's CSS animation starts over
   by itself. */
export const SHOT_EL = new Map(); // a shot's number → its element
/* a shot that stops where it hits ends there on my screen, never drawn past it (the owner's, Nov 17 20:37Z: "BULLETS
   THAT DO NOT PASS THROUGH ZOMBIES WILL NO LONGER PASS THRU ZOMBIES, BECAUSE IN GAME THEY ARE STILL PASSING THROUGH
   ZOMBIES IN A GLITCHY WEIRD WAY. LIKE IF U SHOOT A PISTOL THE BULLET KIND IS SEEN GOING PAST THEM A BIT"). The host
   finds the hit at its next beat and my screen hears of it later, so the shot I draw at where it is now flew on past
   what it hit until then. Now, each frame, from where I last drew it to where it is now, I look for what stops it as I
   draw things (Dead Ducks Arcade: a wall or a zombie, l4dd.js shotStop; Sandbox's board: a zombie, boardzombies.js
   zombieStop), every gun and thrown thing but the grenade (which lands) and the Laser
   Rifle's line; the sniper's goes through as many as it does there. It ends at that spot, its hit shown
   there at once (fx.js fxImpact). If the host then says it went on (a miss, a crit's slug, the sniper's: sh.ms, sh.hit,
   sh.zp, sh.zh), or still has it once it should long have heard (STOP_WAIT), it flies on from there. True: it's
   stopped, don't draw it */
const STOP_WAIT = 700;
export function stopped(s, sh, at, hang, now) {
  const r = SHOT_SEEN.get(sh.n),
    zb = sbOnBoard(s); // (Sandbox's board: its spawns' zombies stop shots)
  if (
    !r ||
    !((hang && isL4dd(s)) || zb) ||
    sh.k === "grenade" ||
    sh.k === "laser"
  )
    return false;
  const missed = [...(sh.ms || []), ...(sh.zp || [])],
    past = [...missed, ...(sh.hit || []), ...(sh.zh || [])];
  for (const i of past) r.skip.add(i);
  if (
    r.stop &&
    ((r.stop.i >= 0 && past.includes(r.stop.i)) || now - r.stop.at > STOP_WAIT)
  ) {
    if (r.stop.i >= 0 && missed.includes(r.stop.i)) r.n--; // (a miss isn't a hit)
    r.stop = null;
    r.fired = false;
  } // (it went on: from where it stopped)
  if (r.stop) return true;
  const [x0, y0] = r.p || [sh.x0, sh.y0],
    end = zb
      ? zombieStop(s, sh, r, x0, y0, at.x, at.y)
      : shotStop(s, sh, r, x0, y0, at.x, at.y);
  r.p = [at.x, at.y];
  if (!end) return false;
  r.stop = { i: end.i, at: now };
  r.p = [end.x, end.y];
  const e = { x: end.x, y: end.y, z: at.z },
    a = hang ? world.place(e, sh.hz) : place(e, 0, 1, true);
  r.x = a.left;
  r.y = a.top;
  fxImpact(r.x, r.y, r.k, r.vx, r.vy);
  r.fired = true;
  return true;
}
export const SHOT_SEEN = new Map(); // a shot's number → { k, x, y (where last seen on the screen), vx, vy (its way) }: once it's gone, it hit there (fx.js fxImpact)
const SHOTS_KEPT = new Map(); // class + look → elements ready to go again
export function shotPool(cls, inner) {
  const k = cls + "|" + inner,
    free = SHOTS_KEPT.get(k);
  if (free && free.length) return free.pop();
  const b = el(`<div class="${cls}">${inner}</div>`);
  b._k = k;
  return b;
}
export function shotDone(b) {
  b.remove();
  let free = SHOTS_KEPT.get(b._k);
  if (!free) SHOTS_KEPT.set(b._k, (free = []));
  if (free.length < 24) free.push(b);
  if (SHOTS_KEPT.size > 60) SHOTS_KEPT.clear(); // (many looks: start over)
}
/* blood bursting from (x, y): n drops all around, as pixels (fx.js); `near` is how far over its floor it bursts */
export function bloodBurst(x, y, n, wide, near, far, delay = 0) {
  const size = (geo && geo.size) || 60,
    go = () => fxBurst(x, y + size * 0.5, size * 0.5, n, Math.round(n / 4));
  if (delay) setTimeout(go, delay);
  else go();
}
/* a headless duck's neck spurting blood for a moment after (owner 2026-11-04 06:44Z): small spurts, one after another,
   as pixels (fx.js) */
export function neckSpray(x, y) {
  const size = geo && geo.size;
  if (!size) return;
  fxSpurt(x, y + size * 0.5, size * 0.5, 14, 1500);
}

/* what a hit just knocked off duck d (wounds.js codes it didn't have a moment ago: a hat h, a face item m, the beak p,
   the eye e), flying off its head the way it looks away from, as pixels (fx.js). The owner's, Nov 16 */
export function knockedOff(d, wc, look, at, z, size, face) {
  const was = d._wc || "";
  d._wc = wc;
  if (!look || !wc) return;
  const fresh = (k) =>
      wc.includes(k + "0") && !was.includes(k + "0") && !was.includes(k + "1"),
    u = size / 120,
    x = (v) => at.left + (v - 60) * u * face,
    h = (v) => z + (108 - v) * u,
    away = -face,
    svg = (inner) =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-HAT_TOP} 120 ${120 + HAT_TOP}" width="120" height="${120 + HAT_TOP}">${face < 0 ? `<g transform="translate(120 0) scale(-1 1)">${inner}</g>` : inner}</svg>`;
  if (fresh("h") && look.hat) {
    const H = hatLayers(look.hat, look, false);
    fxKnock(svg(H.back + H.front), size, x(72), at.top, h(20), away, 1);
  }
  if (fresh("m") && look.face)
    fxKnock(
      svg(faceLayer(look.face, look, false)),
      size,
      x(84),
      at.top,
      h(36),
      away,
      0.9,
    );
  if (fresh("p"))
    fxKnock(svg(beakSVG(look)), size, x(100), at.top, h(42), face, 1.1, true);
  if (fresh("e")) fxEye(x(83), at.top, h(34), face);
}
