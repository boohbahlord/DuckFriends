/* ---------- Survival: watching the others once my duck is dead ----------
   The owner's, Nov 19 22:25Z: a duck that dies in Survival doesn't come back, and its player spectates: "show a player
   ... a little bit around where the vote button is ... their player card. ... a left arrow and a right arrow. And it
   only shows up the left or right arrow if there's other players that are alive or down to watch. If the player's dead,
   you don't watch them ... it basically puts the camera and centers it on their view ... if spectating mode ends, it
   stops rendering what's on their screen". One place decides it all, every frame: watching(s, me), the id I watch or
   "". It is "" (and the camera is mine again) the moment my duck is up again (a defibrillator), the game is over, or
   nobody is left standing or down to watch. game.js puts the camera on that duck (world.js eye) and the card in the
   bottom bar's middle, where the Vote button goes (bottom bar, never over a window). */
import { isSurv } from "./survrules.js";
import { isWild } from "./l4ddrules.js";
import { cardHTML } from "./card.js";
import { esc } from "./ui.js";

const P4 = (s, id) => ((s.hang && s.hang.l4p) || {})[id] || null;
const dead = (s, id) => !!(P4(s, id) || {}).ex; // (dead for good: l4ddrules.js, Survival's and Justin's)
let watch = "";
/* the ducks I may watch: the other players still in it (up or down), never a dead one, nor Justin out there */
export function watchable(s, me) {
  const L = s && s.hang && s.hang.l4;
  if (!isSurv(s) || s.phase !== "hang" || !L || L.over || !dead(s, me))
    return [];
  return s.seat.filter(
    (id) =>
      id !== me &&
      s.players[id] &&
      s.pos[id] &&
      P4(s, id) &&
      !dead(s, id) &&
      !isWild(s, id),
  );
}
/* the duck I watch now, or "" (not spectating): the one I picked while it's still there, else the first I may */
export function watching(s, me) {
  const ids = watchable(s, me);
  if (!ids.length) return (watch = "");
  if (!ids.includes(watch)) watch = ids[0];
  return watch;
}
/* the arrows: the next (1) or the one before (-1) */
export function watchNext(s, me, d) {
  const ids = watchable(s, me);
  if (ids.length < 2) return false;
  const k = Math.max(0, ids.indexOf(watching(s, me)));
  watch = ids[(k + d + ids.length) % ids.length];
  return true;
}
/* the card in the bottom bar: the duck I watch, with the arrows only when there's another to watch */
export function watchHTML(s, me) {
  const id = watching(s, me);
  if (!id) return "";
  const more = watchable(s, me).length > 1,
    p = s.players[id],
    down = !!(P4(s, id) || {}).dn,
    arrow = (d, t) =>
      more
        ? `<button type="button" class="btn small ghost spec-go" data-a="spec" data-d="${d}" aria-label="${t}" data-tip="${t}">${d < 0 ? "◀" : "▶"}</button>`
        : "";
  return `<div class="act-row spec" role="status" aria-label="Watching ${esc(p.name)}">${arrow(-1, "The one before")}${cardHTML(
    { ...p, id },
    { size: 34, extra: down ? '<span class="spec-down">Down</span>' : "" },
  )}${arrow(1, "The next one")}</div>`;
}
