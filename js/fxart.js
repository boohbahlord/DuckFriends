/* ---------- the effects' pictures: a duck on fire, the teleport flash, a blast's scorch ----------
   Each is an SVG string drawn facing right, sized by the css width it's given. The same ink and the same small white
   shines as the items (specials.js), so they sit with them. Sizes, in a duck's size: the flame covers the duck, the
   teleport flash 1.6 tall */
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

/* a teleport: a blue flash where it leaves and where it lands, a beam of light over a ring on the ground, with
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

/* the scorch a blast leaves for a moment (grenade.js) */
export const SCORCH = `<svg viewBox="0 0 200 80" aria-hidden="true"><ellipse cx="100" cy="40" rx="96" ry="36" fill="#1c1210" opacity=".55"/><ellipse cx="100" cy="40" rx="62" ry="22" fill="#0e0807" opacity=".7"/>
${[
  [30, 22],
  [168, 30],
  [52, 64],
  [150, 62],
  [100, 8],
]
  .map(
    ([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="5" fill="#ff8c2b" opacity=".7"/>`,
  )
  .join("")}</svg>`;
