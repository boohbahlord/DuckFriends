/* ---------- mud on the screen (Downpour's mud zombies) ----------
   A mud zombie's hit (l4ddrules.js MUD) puts mud over the four corners of that duck's screen: thick in the very
   corner, splattered further in, a few drips running down. It stays 10 s, then fades. A new hit throws fresh mud: the
   splats land a little differently, and the 10 s start again. Over the board, under the HUD; nothing on others' screens. */
import { MUD } from "./l4ddrules.js";

let el = null,
  shown = 0; // (the hit it shows: its time)

export function mudMount(board) {
  el = document.createElement("div");
  el.className = "l4-mud";
  el.setAttribute("aria-hidden", "true");
  el.hidden = true;
  board.append(el);
  shown = 0;
}
export function mudUnmount() {
  el?.remove();
  el = null;
}
/* every frame: at, the last mud hit on my duck (0: none); now, the room's clock */
export function mudDraw(at, now) {
  if (!el) return;
  const u = at ? now - at : Infinity;
  if (u > MUD.FOR + MUD.FADE || u < 0) {
    if (!el.hidden) el.hidden = true;
    return;
  }
  if (at !== shown) {
    shown = at;
    el.innerHTML = ["tl", "tr", "bl", "br"]
      .map((c) => `<i class="l4-mud-${c}">${splat(c[0] === "t")}</i>`)
      .join("");
  }
  if (el.hidden) el.hidden = false;
  const o = u < MUD.FOR ? 1 : 1 - (u - MUD.FOR) / MUD.FADE;
  el.style.opacity = o.toFixed(3);
}
/* one corner's mud, drawn for the top left (CSS turns it for the others): a heap of blobs in the corner, smaller
   flecks thrown out from it, and (the top ones) drips hanging off it */
function splat(drips) {
  const r = (a, b) => a + Math.random() * (b - a),
    dark = "#33230f",
    mid = "#4b351a",
    wet = "#8a6a3c";
  let s = "";
  for (let k = 0; k < 18; k++) {
    const a = r(0, Math.PI / 2),
      d = r(0, 95) * (1 - k / 30);
    s += `<circle cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d).toFixed(1)}" r="${r(26, 50).toFixed(1)}" fill="${k % 4 ? mid : dark}"/>`;
  }
  for (let k = 0; k < 7; k++) {
    const a = r(0.1, Math.PI / 2 - 0.1),
      d = r(120, 165);
    s += `<circle cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d).toFixed(1)}" r="${r(2.5, 7).toFixed(1)}" fill="${mid}"/>`;
  }
  for (let k = 0; k < (drips ? 3 : 0); k++) {
    const x = r(15, 95),
      l = r(40, 110);
    s += `<rect x="${(x - 4).toFixed(1)}" y="20" width="8" height="${l.toFixed(1)}" rx="4" fill="${mid}"/><circle cx="${x.toFixed(1)}" cy="${(20 + l).toFixed(1)}" r="6.5" fill="${mid}"/>`;
  }
  s += `<circle cx="22" cy="18" r="9" fill="${wet}" opacity=".5"/>`; // (a wet shine)
  return `<svg viewBox="0 0 200 200" width="100%" height="100%" opacity=".94">${s}</svg>`;
}
