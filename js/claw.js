/* ---------- a claw's marks: three white slashes where a swipe landed ----------
   One for everything that claws: Dead Ducks Arcade's and Survival's zombies (l4dd.js), Mad God Justin's wave zombies
   (game.js), Sandbox's NPCs (npcview.js) and Duck Cabin's cats (hangout/characters.js). The marks are one picture made
   into pixels once for each size (pixel.js pxSVG), made while the game loads (warmClaw), so a swipe never makes one
   mid-game. Before, each mark was a drawing pxdom.js made into pixels as it faded in: every fade step was another
   picture, made in the middle of a fight (the owner's, Nov 20 20:46Z: "pop-ins ... I don't care if you have good frames,
   if the game plays like you see it in this footage") */
import { pxSVG, rasterReady, pixelOn } from "./pixel.js";
import { hashText } from "./pxdom.js";
import { now as clockNow } from "./clock.js";

const CLAW =
  '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M10 6C16 16 18 26 14 36M19 4C25 14 27 24 23 34M28 6C34 16 36 26 32 36" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
/* the swipe: three red lines sweeping in an arc through where the claw lands, across the way it swings (the owner's,
   Nov 21 18:24Z: "a swipe animation, like where it shows like little lines across the screen where they swipe at so
   that you can see it coming"; 20:26Z: "Only want the red lines for the hit, for the zombie hits, and it can go up and
   down as well in any direction with where the zombie hits at"). Its arc's middle, (38, 32) of it, sits on the marks */
const SWIPE =
  '<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" width="48" height="64"><g fill="none" stroke="#ff2a2a" stroke-linecap="round"><path d="M22 10.6A28 28 0 0 1 22 53.4" stroke-width="2.6" opacity=".65"/><path d="M25.9 6A34 34 0 0 1 25.9 58" stroke-width="3.6" opacity=".9"/><path d="M29.7 1.4A40 40 0 0 1 29.7 62.6" stroke-width="2.6" opacity=".65"/></g></svg>';
const size = (k) => Math.max(4, Math.round(40 * k)); // (css px: .hang-npc-claw > img is 40px times --k)
const swipeW = (k) => Math.max(5, Math.round(60 * k)); // (css: a quarter bigger than its drawing)
const CLAW_MAX = 8; // (marks on a layer at once: a swarm at round 21 swiped dozens a second, each a glowing drawing to paint, and a few more marks on one duck didn't show)

/* the marks at (left, top) in layer fx, k times the cats' size; a: the way the swing goes on screen (radians, 0 right,
   down positive), its swipe drawn over them (null: the marks alone, as the cats') */
export function clawMark(fx, left, top, k, a = null) {
  if (!fx || (fx._claws || 0) >= CLAW_MAX) return;
  const el = document.createElement("div"),
    s = size(k);
  el.className = "hang-npc-claw l4-claw"; // (l4-claw: game.js counts a wave's marks)
  el.innerHTML =
    (a == null ? "" : pxSVG(SWIPE, swipeW(k), "claw-swipe")) + pxSVG(CLAW, s);
  if (a != null) {
    const back = Math.cos(a) < 0; // (to the left: flipped, then turned, so it sweeps from its top as to the right)
    el.style.setProperty(
      "--a",
      ((back ? a - Math.PI : a) * 57.2958).toFixed(1) + "deg",
    );
    if (back) el.style.setProperty("--sx", "-1");
  }
  el.style.left = left.toFixed(1) + "px";
  el.style.top = top.toFixed(1) + "px";
  el.style.setProperty("--k", k.toFixed(3));
  fx.append(el);
  fx._claws = (fx._claws || 0) + 1;
  setTimeout(() => {
    el.remove();
    fx._claws--;
  }, 1100);
}
/* the marks at k times the cats' size made into pixels now (while a game loads: pixel.js holds its loading screen) */
export function warmClaw(k) {
  if (!pixelOn()) return;
  rasterReady("s" + hashText(CLAW), CLAW, size(k), size(k)); // (pxSVG's key)
  rasterReady("s" + hashText(SWIPE), SWIPE, swipeW(k), (swipeW(k) * 64) / 48);
}
/* the tell before a zombie's swing: it leans back on its heels (the owner's, Nov 21 18:59Z: "I guess we'll just stick with
   the lean back thing for now"). From its wind-up's start (wu, the host's game time: zombies.js) it tips back over the
   wind-up, slowing as it gets there, and comes forward as the hit lands with its swipe lines. s: the state, for the
   game time its wind-ups keep (since the round's t0; Sandbox, no round: the clock).
   Gives a rotate() for its body (in its own frame, so back is back whichever way it faces), or "" */
const LEAN = { ms: 500, deg: 12 }; // (ms: zombies.js SWIPE[0], the wind-up)
export function leanBack(wu, s) {
  if (!wu) return "";
  const T = clockNow() - ((s.hang.l4 || {}).t0 ?? 0),
    k = Math.min(1, Math.max(0, (T - wu) / LEAN.ms));
  return k ? ` rotate(${(-LEAN.deg * (1 - (1 - k) ** 2)).toFixed(1)}deg)` : "";
}
