/* ---------- a claw's marks: three white slashes where a swipe landed ----------
   One for everything that claws: Dead Ducks Arcade's and Survival's zombies (l4dd.js), Mad God Justin's wave zombies
   (game.js), Sandbox's NPCs (npcview.js) and Duck Cabin's cats (hangout/characters.js). The marks are one picture made
   into pixels once for each size (pixel.js pxSVG), made while the game loads (warmClaw), so a swipe never makes one
   mid-game. Before, each mark was a drawing pxdom.js made into pixels as it faded in: every fade step was another
   picture, made in the middle of a fight (the owner's, Nov 20 20:46Z: "pop-ins ... I don't care if you have good frames,
   if the game plays like you see it in this footage") */
import { pxSVG, rasterReady, pixelOn } from "./pixel.js";
import { hashText } from "./pxdom.js";

const CLAW =
  '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M10 6C16 16 18 26 14 36M19 4C25 14 27 24 23 34M28 6C34 16 36 26 32 36" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
const size = (k) => Math.max(4, Math.round(40 * k)); // (css px: .hang-npc-claw > img is 40px times --k)
const CLAW_MAX = 8; // (marks on a layer at once: a swarm at round 21 swiped dozens a second, each a glowing drawing to paint, and a few more marks on one duck didn't show)

/* the marks at (left, top) in layer fx, k times the cats' size */
export function clawMark(fx, left, top, k) {
  if (!fx || (fx._claws || 0) >= CLAW_MAX) return;
  const el = document.createElement("div"),
    s = size(k);
  el.className = "hang-npc-claw l4-claw"; // (l4-claw: game.js counts a wave's marks)
  el.innerHTML = pxSVG(CLAW, s);
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
  if (pixelOn()) rasterReady("s" + hashText(CLAW), CLAW, size(k), size(k)); // (pxSVG's key)
}
