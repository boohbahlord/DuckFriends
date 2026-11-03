/* ---------- the jetpack's pictures ----------
   Two red tanks with steel caps and nozzles, worn on the back (side-on, so the far tank peeks out behind the near one),
   and the flame that comes out of the nozzles while Space is held. In duck units: a duck faces right in a 120 × 120
   box, so the pack goes behind him at his back (JET_AT), on dat boi a little higher (JET_AT_FROG). */
import { mix } from "./duck.js";

export const JET_AT = { x: -2, y: 36, k: 0.9 };
export const JET_AT_FROG = { x: 16, y: 24, k: 0.78 };

const RED = "#e5383b",
  INK = "#1c1a26";
const tank = (
  x,
  c,
  id,
) => `<rect x="${x}" y="8" width="14" height="38" rx="7" fill="url(#${id})" stroke="${INK}" stroke-width="1.8"/>
<path d="M${x} 15H${x + 14}" stroke="${INK}" stroke-width="1.2" opacity=".5"/><path d="M${x} 38H${x + 14}" stroke="${INK}" stroke-width="1.2" opacity=".5"/>
<rect x="${x + 2.4}" y="2.6" width="9.2" height="7" rx="2.4" fill="url(#${id}m)" stroke="${INK}" stroke-width="1.4"/>
<path d="M${x + 2} 46L${x + 0.6} 53H${x + 13.4}L${x + 12} 46Z" fill="url(#${id}m)" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M${x + 4} 12V35" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="${c === RED ? ".45" : ".2"}"/>`;
const defs = (id, c) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${mix(c, 255, 0.25)}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, 0, 0.35)}"/></linearGradient>
<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f6fa"/><stop offset=".5" stop-color="#aab2c0"/><stop offset="1" stop-color="#6b7383"/></linearGradient>`;

let uid = 0;
/* the pack: 0 0 40 56; the near tank's nozzle is at (21, 53), the far one's at (12, 53) */
export function jetpackSVG() {
  const a = "jp" + ++uid,
    b = a + "f",
    far = mix(RED, 0, 0.22);
  return `<svg class="jetpack" viewBox="0 0 40 56" aria-hidden="true"><defs>${defs(a, RED)}${defs(b, far)}</defs>
${tank(5, far, b)}<rect x="10" y="20" width="16" height="6" rx="1.6" fill="#3b3f4a" stroke="${INK}" stroke-width="1.2"/>${tank(14, RED, a)}
<path d="M28 18H36Q38 18 38 20V30Q38 32 36 32H28" fill="none" stroke="#3b3f4a" stroke-width="3" stroke-linecap="round"/></svg>`;
}
/* the flame out of one nozzle while it's on: 0 0 20 40, its top in the nozzle; the css flickers it (.jet-flame) */
export const JET_FLAME = `<svg class="jet-flame" viewBox="0 0 20 40" aria-hidden="true">
<path d="M3 1H17C18 12 15 24 10 39C5 24 2 12 3 1Z" fill="#ff7a1a" stroke="#e0461a" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M5.4 1H14.6C15 9 13.4 18 10 28C6.6 18 5 9 5.4 1Z" fill="#ffc53d"/>
<path d="M7.6 1H12.4C12.6 6 11.8 11 10 17C8.2 11 7.4 6 7.6 1Z" fill="#fff6c4"/></svg>`;
