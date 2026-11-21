/* ---------- Mad God Justin's new pictures (the Nov 3 rework) ----------
   Each is an SVG string drawn facing right, sized by the css width it's given; the rules and the board live in
   mgjrules.js and mgj.js. The same ink and the same small white shines as the other items (specials.js, mgj.js), so they
   sit with them. Sizes, in a duck's size: the bow 0.9, the arrow 0.8, the flame covers the duck, the
   teleport flash 1.6 tall */

import { ZEBRA } from "./gunart.js";
const INK = "#1c1c28";
let uid = 0; // (each picture's gradients get their own ids, so two on a page never share one)

/* the burning duck: one big flame over the whole duck (the owner: "the whole duck covered in one large enough flame"),
   red outside, orange, then yellow and a pale core, its tongues licking up past the head. It flickers (css: .gduck-fire) */
export const FLAME = `<svg viewBox="0 0 100 120" aria-hidden="true">
<g class="fl-out"><path d="M50 118C20 118 5 98 8 76C10 60 21 53 20 36C28 43 31 50 33 55C33 38 40 20 53 3C56 21 66 30 69 44C71 36 76 31 81 24C86 39 96 54 93 77C90 101 78 118 50 118Z" fill="#ff4d1a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>
<g class="fl-mid"><path d="M50 114C28 114 18 99 21 83C23 71 31 65 33 55C39 62 41 68 43 71C45 57 50 44 58 31C62 46 70 55 72 66C74 61 76 57 79 52C83 63 86 74 84 88C82 104 71 114 50 114Z" fill="#ff9a1f"/></g>
<g class="fl-in"><path d="M50 111C34 111 28 100 31 90C33 82 40 78 42 71C46 79 48 82 51 84C53 75 57 68 62 63C67 73 70 83 68 95C66 106 60 111 50 111Z" fill="#ffd23f"/>
<path d="M50 108C42 108 38 102 40 96C41.6 91 45 88 46.4 84C49 89 51 91 53 92C54 87 56 84 59 81C61.6 87 62.4 93 61 99C59.6 105 56 108 50 108Z" fill="#fff6c4"/></g>
<path d="M26 74Q24 60 30 50M70 38Q76 46 76 56" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".28"/></svg>`;

/* his poof when he's killed: a burst of round cloud puffs with a few little ones flying off */
export const POOF = `<svg viewBox="0 0 100 70" aria-hidden="true">
<g fill="#ffffff" stroke="#b9bfcc" stroke-width="2">
<circle cx="30" cy="40" r="14"/><circle cx="50" cy="30" r="18"/><circle cx="70" cy="40" r="14"/><circle cx="42" cy="50" r="13"/><circle cx="60" cy="50" r="13"/></g>
<g fill="#ffffff"><circle cx="30" cy="40" r="12.6"/><circle cx="50" cy="30" r="16.6"/><circle cx="70" cy="40" r="12.6"/><circle cx="42" cy="50" r="11.6"/><circle cx="60" cy="50" r="11.6"/></g>
<path d="M40 22Q46 16 54 17" fill="none" stroke="#e9edf5" stroke-width="3" stroke-linecap="round"/>
<g fill="#fff" stroke="#b9bfcc" stroke-width="1.4"><circle cx="11" cy="24" r="4.4"/><circle cx="89" cy="22" r="4"/><circle cx="14" cy="58" r="3.4"/><circle cx="88" cy="58" r="3.6"/><circle cx="50" cy="6" r="3.2"/></g></svg>`;

/* Justin's snacks: the zebra cake, a slice of pizza and a pink donut with sprinkles (held at his beak, a bite at a time) */
export const FOODS = {
  zebra: ZEBRA,
  pizza: `<svg viewBox="0 0 40 40" aria-hidden="true">
<path d="M4 8Q20 2 36 8L21 38Z" fill="#ffd23f" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M4 8Q20 2 36 8L35 11.6Q20 6 5.2 11.6Z" fill="#d98b3a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M9 13.6Q12 20 10.6 22M27 13Q28 18 31 18.6" fill="none" stroke="#ffe680" stroke-width="2" stroke-linecap="round"/>
<g fill="#d7263d" stroke="${INK}" stroke-width="1"><circle cx="15" cy="15" r="3.2"/><circle cx="25" cy="16" r="3"/><circle cx="20" cy="25" r="2.8"/></g>
<path d="M9 7.4Q20 4 31 7.4" stroke="#fff" stroke-width="1" opacity=".45" stroke-linecap="round"/></svg>`,
  donut: `<svg viewBox="0 0 40 40" aria-hidden="true">
<ellipse cx="20" cy="22" rx="17" ry="14" fill="#d9a05b" stroke="${INK}" stroke-width="1.6"/>
<path d="M4.6 19C5 11 12 7 20 7C28 7 35 11 35.4 19C34 22 32 21 30 23C28 25 26 22 24 24C22 26 19 23 17 25C15 26 13 23 11 24C9 25 6 23 4.6 19Z" fill="#ff8fb8" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
<ellipse cx="20" cy="17" rx="5.6" ry="3.8" fill="#2a1a12" stroke="${INK}" stroke-width="1.2"/>
<g stroke-width="1.6" stroke-linecap="round"><path d="M10 13L12 12" stroke="#ffd23f"/><path d="M27 11L29 12.4" stroke="#38b6ff"/><path d="M13 20L14.6 21.4" stroke="#3ddc84"/><path d="M30 18L31.6 16.8" stroke="#fff"/><path d="M24 22L26 22" stroke="#c77dff"/><path d="M18 9.6L20 9.2" stroke="#fff"/></g>
<path d="M9 11.6Q13 8.6 18 8.4" stroke="#fff" stroke-width="1.2" opacity=".55" stroke-linecap="round"/></svg>`,
};

/* his teleport: a blue flash where he leaves and where he lands, a beam of light over a ring on the ground, with
   sparks around it (css: .mgj-tp plays it in half a second) */
export const TELEPORT = (() => {
  const i = `tp${uid++}`;
  return `<svg viewBox="0 0 100 120" aria-hidden="true"><defs>
<linearGradient id="${i}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38b6ff" stop-opacity="0"/><stop offset=".55" stop-color="#7fd4ff" stop-opacity=".8"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient>
<radialGradient id="${i}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e6f7ff"/><stop offset=".5" stop-color="#38b6ff" stop-opacity=".6"/><stop offset="1" stop-color="#1a6dff" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="50" cy="104" rx="46" ry="14" fill="url(#${i}g)"/>
<path d="M30 104L36 8Q50 0 64 8L70 104Z" fill="url(#${i}b)"/>
<path d="M44 104L47 14Q50 10 53 14L56 104Z" fill="#fff" opacity=".85"/>
<ellipse cx="50" cy="104" rx="30" ry="8" fill="none" stroke="#bff1ff" stroke-width="3"/>
<ellipse cx="50" cy="104" rx="20" ry="5" fill="none" stroke="#fff" stroke-width="2"/>
<g fill="#fff"><path d="M18 60l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path d="M82 40l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Z"/><path d="M80 84l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2Z"/><path d="M22 28l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2Z"/></g></svg>`;
})();

/* hitmarkers: four short white strokes around the spot that was hit, with a dark edge so they show on any map; his
   double gets the same ones (the owner's, Nov 3) */
const MARK = (fill, edge, op) =>
  `<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke-linecap="round" opacity="${op}">
<path d="M5 5L12 12M27 5L20 12M5 27L12 20M27 27L20 20" stroke="${edge}" stroke-width="5.4"/>
<path d="M5 5L12 12M27 5L20 12M5 27L12 20M27 27L20 20" stroke="${fill}" stroke-width="2.8"/></g></svg>`;
export const HITMARK = MARK("#ffffff", INK, 1);

/* the edge lightning, on the board's edges and corners (css: .mgj-edge, its depth --edge): "warn" glows electric blue
   along them for a moment, "zap" strikes: jagged bolts run along all four sides with bright flashes in the corners. The
   bolts are new each strike */
export function edgeHTML(kind) {
  if (kind !== "zap")
    return '<div class="mgj-edge warn" aria-hidden="true"></div>';
  const bolt = (x0, y0, x1, y1, n, amp) => {
    let d = `M${x0} ${y0}`;
    for (let i = 1; i < n; i++) {
      const t = i / n,
        j = (Math.random() * 2 - 1) * amp;
      d += `L${(x0 + (x1 - x0) * t + (y0 === y1 ? 0 : j)).toFixed(1)} ${(y0 + (y1 - y0) * t + (y0 === y1 ? j : 0)).toFixed(1)}`;
    }
    return d + `L${x1} ${y1}`;
  };
  const e = 22; // (how far in the bolts run, out of 1000 by 600; the glow is css)
  const sides = [
    bolt(0, e, 1000, e, 26, 14),
    bolt(0, 600 - e, 1000, 600 - e, 26, 14),
    bolt(e, 0, e, 600, 16, 14),
    bolt(1000 - e, 0, 1000 - e, 600, 16, 14),
  ].join("");
  const corner = (x, y) =>
    `<circle cx="${x}" cy="${y}" r="70" fill="url(#mgjz)"/>`;
  return `<div class="mgj-edge zap" aria-hidden="true"><svg viewBox="0 0 1000 600" preserveAspectRatio="none"><defs><radialGradient id="mgjz"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#9be8ff" stop-opacity=".8"/><stop offset="1" stop-color="#38b6ff" stop-opacity="0"/></radialGradient></defs>
<path d="${sides}" fill="none" stroke="#38b6ff" stroke-width="9" stroke-linejoin="round" opacity=".55" vector-effect="non-scaling-stroke"/>
<path d="${sides}" fill="none" stroke="#e6f7ff" stroke-width="3.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
${corner(0, 0)}${corner(1000, 0)}${corner(0, 600)}${corner(1000, 600)}</svg></div>`;
}
