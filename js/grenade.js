/* ---------- a grenade going off ----------
   I want it loud and simple, like the other specials: a yellow and orange starburst with a white middle, a ball of fire
   under it, a ring across the ground three ducks wide (where it knocks ducks down), a few puffs of smoke rising, and the
   meteor's scorch mark left on the ground for a moment. The rules throw the ducks (rules.js blast); this only draws it. */
import { el } from "./ui.js";
import { SCORCH } from "./mgj.js";

const BURST = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${star(50, 50, 48, 30, 12)}" fill="#ff8c2b" stroke="#2a2d38" stroke-width="2.4" stroke-linejoin="round"/><path d="${star(50, 50, 34, 21, 12, 0.26)}" fill="#ffd23f"/><circle cx="50" cy="50" r="13" fill="#fff6d8"/></svg>`;
function star(cx, cy, R, r, n, turn = 0) {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = ((i + turn) * Math.PI) / n - Math.PI / 2,
      k = i % 2 ? r : R;
    d += `${i ? "L" : "M"}${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
}
/* at: where it went off, on the screen (the ground under it); size: a duck's size there */
export function grenadeBoom(fxl, board, at, size) {
  const w = size * 3.2,
    puffs = [-0.32, -0.12, 0.1, 0.3]
      .map(
        (x, i) =>
          `<i class="gr-smoke" style="--x:${(x * w).toFixed(0)}px;--d:${(i * 0.07).toFixed(2)}s"></i>`,
      )
      .join("");
  const boom = el(
    `<div class="gr-boom" style="left:${at.left.toFixed(1)}px;top:${at.top.toFixed(1)}px;--w:${w.toFixed(0)}px"><i class="mgj-scorch">${SCORCH}</i><i class="mgj-ring"></i><i class="gr-ball"></i><i class="gr-burst">${BURST}</i>${puffs}</div>`,
  );
  fxl.append(boom);
  board.classList.add("quake");
  setTimeout(() => board.classList.remove("quake"), 450);
  setTimeout(() => boom.remove(), 2600);
}
