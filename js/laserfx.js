/* ---------- the Laser Rifle on the screen (the owner, Nov 17) ----------
   Every screen reads each duck's heat from the room's state (l4ddrules.js laserHeat), so everyone sees the same:
     - the gun in hand: its barrel hotter and hotter from its end back, one look for each beam of heat (laserart.js);
       overheated, the bright orange one;
     - steam off its barrel once it's hot, and much more while it's overheated, with little fire pixels at its end; in
       the rain (Downpour, outside) twice the steam, in sound too (the owner: "steams up in sound and visual effect MORE
       when it is in the rain");
     - the steam's sound, each duck's own (sound.js steam).
   game.js calls laserLook for the gun's picture and laserFrame every frame, in Dead Ducks Arcade and in Mad God Justin
   (a pickup there). */
import { laserHeat, dp } from "./l4ddrules.js";
import { LASER } from "./laserart.js";
import { fxSteam, fxGroundFire } from "./fx.js";
import { sfx } from "./sound.js";
import { W, H, inCabin } from "./hangout/layout.js";
import { CANOPY } from "./hangout/stationmap.js";
import { now as clockNow } from "./clock.js";
import { heldOn } from "./barrelheat.js";

/* the look of duck id's Laser Rifle now: { lvl: its heat 0 … 1 in steps of one beam, over: overheated }, and its key
   (the gun's picture is made again only when it changes) */
export function laserLook(s, id) {
  const q = laserHeat(s, id, clockNow()),
    lvl = Math.min(q.max, Math.ceil(q.h - 0.05)) / q.max,
    over = q.over > 0;
  return { lvl, over, key: over ? "-hot" : "-h" + Math.round(lvl * q.max) };
}
export const laserArt = (look) => LASER(look.lvl, look.over);

/* is it raining on (x, y) in the world? Downpour, out from under a roof */
const wet = (x, y) =>
  dp() &&
  !inCabin(x, y) &&
  !(x > CANOPY.x0 && x < CANOPY.x1 && y > CANOPY.y0 && y < CANOPY.y1);

/* every frame: the steam and the fire at each Laser Rifle in hand (held: duck id → its gun on the screen, game.js; its
   _tip is the lens), and each one's steam sound. heard(id): where a duck's sound comes from (game.js) */
const STEAM = new Map(); // duck id → { carry: puffs owed, fire: fire pixels owed }
let last = 0;
export function laserFrame(s, held, fxl, size, heard) {
  const t = performance.now(),
    dt = Math.min(0.1, last ? (t - last) / 1000 : 0),
    now = clockNow(),
    seen = new Set();
  last = t;
  for (const [id, g] of held) {
    if (g.dataset.w !== "laser" || !heldOn(g, fxl) || g._gone || !g._tip)
      continue;
    const q = laserHeat(s, id, now),
      f = q.h / q.max, // (0 … 1, past 1 while overheated)
      over = q.over > 0,
      p = s.pos[id],
      rain = !!p && wet(p.x * W, p.y * H);
    seen.add(id);
    const o = STEAM.get(id) || { carry: 0, fire: 0 };
    STEAM.set(id, o);
    /* puffs a second: none while it's cool, a few once it's past half, a lot overheated; twice that in the rain */
    const rate =
      (over ? 26 : f > 0.45 ? 3 + 14 * ((f - 0.45) / 0.55) : 0) *
      (rain ? 2 : 1);
    o.carry = Math.min(4, o.carry + rate * dt);
    o.fire = over ? Math.min(4, o.fire + 30 * dt) : 0;
    const [tx, ty, rot] = g._tip,
      back = size * 0.45; // (how far back along the barrel the steam comes off)
    for (; o.carry >= 1; o.carry--) {
      const a = Math.random() * back;
      fxSteam(tx - Math.cos(rot) * a, ty - Math.sin(rot) * a);
    }
    for (; o.fire >= 1; o.fire--)
      fxGroundFire(
        tx - Math.cos(rot) * size * 0.06,
        ty - Math.sin(rot) * size * 0.06,
        size * 0.07,
        1,
      ); // (little fire pixels at its end, flickering up)
    sfx.steam(id, f * (over ? 1.25 : 1), { ...heard(id), rain });
  }
  for (const id of STEAM.keys())
    if (!seen.has(id)) {
      STEAM.delete(id);
      sfx.steam(id, 0);
    } // (put away, or gone: its steam fades)
}

/* the Laser Rifle's heat, under my duck (the owner's, Nov 17): a thin row of blocks, one for each beam before its limit
   (5, the Angelic one's 6), lit one by one from red toward orange as it heats; overheated, the lit ones flash white,
   the meter shakes and steams more (css/app.css .l4-heat). Shown while the Laser Rifle is in hand and warm, in Dead
   Ducks Arcade (l4dd.js) and Mad God Justin (game.js) */
const HEAT_RED = [200, 34, 42],
  HEAT_ORANGE = [255, 138, 31];
export function laserMeter(tag, s, me, w) {
  const q = w === "laser" ? laserHeat(s, me, clockNow()) : null,
    on = !!q && (q.h > 0.05 || q.over > 0);
  let el = tag.querySelector(".l4-heat");
  if (!el) {
    if (!on) return;
    el = document.createElement("span");
    el.className = "l4-heat off";
    el.setAttribute("aria-hidden", "true");
    tag.append(el);
  }
  if (!on) {
    if (!el.classList.contains("off")) el.className = "l4-heat off";
    el._look = "";
    return;
  }
  if (el._max !== q.max) {
    el._max = q.max;
    el.innerHTML = Array.from({ length: q.max }, (_, i) => {
      const t = q.max > 1 ? i / (q.max - 1) : 1,
        c = HEAT_RED.map((v, k) => Math.round(v + (HEAT_ORANGE[k] - v) * t));
      return `<i style="--c:rgb(${c.join(",")})"></i>`;
    }).join("");
  }
  const over = q.over > 0,
    lit = Math.min(q.max, over ? Math.ceil(q.h) : Math.round(q.h)),
    look = `${lit}${over ? " hot" : ""}${over || q.h / q.max >= 0.6 ? " steam" : ""}`;
  if (el._look === look) return;
  el._look = look;
  el.className = `l4-heat${over ? " hot" : ""}${look.includes("steam") ? " steam" : ""}`;
  el.querySelectorAll("i").forEach((b, i) => b.classList.toggle("on", i < lit));
}
