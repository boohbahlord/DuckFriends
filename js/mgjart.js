/* ---------- Mad God Justin's new pictures (the Nov 3 rework) ----------
   Each is an SVG string drawn facing right, sized by the css width it's given; the rules and the board live in
   mgjrules.js and mgj.js. The same ink and the same small white shines as the other items (specials.js, mgj.js), so they
   sit with them. Sizes, in a duck's size: the bow 0.9, the arrow 0.8, the fireball 1, the flame covers the duck, the
   teleport flash 1.6 tall, Jaime 0.75 */
import { DUCK_DEFAULT } from "./duck.js";

const INK = "#1c1c28";
let uid = 0; // (each picture's gradients get their own ids, so two on a page never share one)

/* the bow: a wooden recurve bow, its limbs curling back at the tips, a leather grip in the middle, the string on the left.
   Turned around its middle by the aim */
export const BOW = `<svg viewBox="0 0 40 64" aria-hidden="true">
<path d="M13.4 4.6V59.4" stroke="#efe6cf" stroke-width="1.3"/>
<path d="M12 3.4Q15.6 1.6 18 4.4Q29.6 12 30.4 26.4Q30.8 32 30.4 37.6Q29.6 52 18 59.6Q15.6 62.4 12 60.6" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 3.4Q15.6 1.6 18 4.4Q29.6 12 30.4 26.4Q30.8 32 30.4 37.6Q29.6 52 18 59.6Q15.6 62.4 12 60.6" fill="none" stroke="#b5743c" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.6 6.4Q27 13 28.4 24" fill="none" stroke="#f0c48e" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
<path d="M18.6 57.6Q25.6 52 27.8 44" fill="none" stroke="#7a4a22" stroke-width="1" stroke-linecap="round" opacity=".7"/>
<rect x="27.2" y="25" width="7" height="14" rx="2.4" fill="#5a3420" stroke="${INK}" stroke-width="1.4"/>
<path d="M27.6 28.4H33.8M27.6 31.4H33.8M27.6 34.4H33.8" stroke="#8a5634" stroke-width="1"/>
<path d="M29 26.6V37.4" stroke="#fff" stroke-width=".8" opacity=".25"/></svg>`;

/* the arrow: a wooden shaft, a steel head, red feathers at the tail. Pointing right, turned by its flight */
export const ARROW = `<svg viewBox="0 0 64 12" aria-hidden="true">
<path d="M2 1.6L9 5.2H15L12 1.6Z" fill="#ef3b3b" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>
<path d="M2 10.4L9 6.8H15L12 10.4Z" fill="#c92a2a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>
<rect x="6" y="4.8" width="46" height="2.4" rx="1.2" fill="#c98a4b" stroke="${INK}" stroke-width=".9"/>
<path d="M8 5.6H50" stroke="#fff" stroke-width=".6" opacity=".35"/>
<path d="M50 2.2L63 6L50 9.8L52.4 6Z" fill="#c9d1dc" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>
<path d="M52 3.6L60 6" stroke="#fff" stroke-width=".8" opacity=".7" stroke-linecap="round"/></svg>`;

/* the fireball: a white-hot core in a round ball of fire, its flames streaming back in tongues, sparks flying off.
   The head on the right, turned by its flight */
export const FIREBALL = (() => {
  const i = `fb${uid++}`;
  return `<svg viewBox="0 0 80 48" aria-hidden="true"><defs>
<radialGradient id="${i}h" cx=".62" cy=".42" r=".6"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffe066"/><stop offset=".7" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ff4d1a"/></radialGradient>
<linearGradient id="${i}t" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1a"/><stop offset=".6" stop-color="#ff4d1a"/><stop offset="1" stop-color="#d7263d" stop-opacity=".0"/></linearGradient>
<linearGradient id="${i}u" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/></linearGradient></defs>
<path d="M58 7C46 6 34 2 20 4C26 7 28 9 27 11C18 10 9 12 2 17C10 18 15 20 16 22C9 24 5 28 2 33C11 31 18 32 22 35C18 38 16 41 15 45C26 41 36 41 46 42C52 42 56 41 58 41Z" fill="url(#${i}t)"/>
<path d="M58 13C48 12 40 10 31 12C35 14 36 16 34 17C27 18 21 20 16 24C23 25 27 26 28 28C24 30 21 33 20 36C29 34 38 34 46 36C51 36 55 35 58 35Z" fill="url(#${i}u)"/>
<circle cx="58" cy="24" r="16.6" fill="url(#${i}h)" stroke="#b3260f" stroke-width="1.8"/>
<path d="M49 15Q55 10 62 11.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
<circle cx="61" cy="22" r="6" fill="#fffbe0" opacity=".85"/>
<g fill="#ffd23f"><circle cx="24" cy="2.6" r="1.4"/><circle cx="9" cy="40" r="1.2"/><circle cx="31" cy="45.4" r="1.1" fill="#ff9a1f"/><circle cx="5" cy="9" r="1"/></g></svg>`;
})();

/* the burning duck: one big flame over the whole duck (the owner: "the whole duck covered in one large enough flame"),
   red outside, orange, then yellow and a pale core, its tongues licking up past the head. It flickers (css: .gduck-fire) */
export const FLAME = `<svg viewBox="0 0 100 120" aria-hidden="true">
<g class="fl-out"><path d="M50 118C20 118 5 98 8 76C10 60 21 53 20 36C28 43 31 50 33 55C33 38 40 20 53 3C56 21 66 30 69 44C71 36 76 31 81 24C86 39 96 54 93 77C90 101 78 118 50 118Z" fill="#ff4d1a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>
<g class="fl-mid"><path d="M50 114C28 114 18 99 21 83C23 71 31 65 33 55C39 62 41 68 43 71C45 57 50 44 58 31C62 46 70 55 72 66C74 61 76 57 79 52C83 63 86 74 84 88C82 104 71 114 50 114Z" fill="#ff9a1f"/></g>
<g class="fl-in"><path d="M50 111C34 111 28 100 31 90C33 82 40 78 42 71C46 79 48 82 51 84C53 75 57 68 62 63C67 73 70 83 68 95C66 106 60 111 50 111Z" fill="#ffd23f"/>
<path d="M50 108C42 108 38 102 40 96C41.6 91 45 88 46.4 84C49 89 51 91 53 92C54 87 56 84 59 81C61.6 87 62.4 93 61 99C59.6 105 56 108 50 108Z" fill="#fff6c4"/></g>
<path d="M26 74Q24 60 30 50M70 38Q76 46 76 56" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".28"/></svg>`;

/* Jaime: a skinny, small, light pink duck in a sombrero (drawn by duckSVG; his knife comes from the knife special) */
export const JAIME = {
  name: "Jaime",
  duck: {
    ...DUCK_DEFAULT,
    color: "#ffc2d4",
    beakColor: "#ff9a1f",
    beakColor2: "#c45f00",
    hat: { id: "sombrero" },
    build: -1,
    size: -1,
  },
};
/* the Jaime Bomb's dynamite (jaimebomb.js), as a duck's skin (duck.js, in the 120 box): a black strap round his body
   under the wing, three red sticks on his chest with a strap over them, a little black timer with a red light and green
   numbers, and a fuse up from the middle stick */
const STICK_X = [80, 86.5, 93];
export const BOMB_SKIN = {
  body: `<path d="M12 74C40 81 76 81 101 73V80C76 88 40 88 13 81Z" fill="#22222a" opacity=".92"/>`,
  out: `<g stroke="#4a0a0a" stroke-width="1.4">${STICK_X.map((x) => `<rect x="${x}" y="64" width="6.2" height="27" rx="2.6" fill="#d8312b"/>`).join("")}</g>
${STICK_X.map((x) => `<rect x="${x + 1.3}" y="66.5" width="1.5" height="22" rx=".75" fill="#ff9a88" opacity=".75"/>`).join("")}
<rect x="77.5" y="75.5" width="25" height="5" rx="1.6" fill="#24242c" stroke="#0b0b10" stroke-width="1"/>
<rect x="83.2" y="68.6" width="12.6" height="8" rx="1.5" fill="#15151b" stroke="#000" stroke-width="1"/>
<circle cx="86.4" cy="72.6" r="1.5" fill="#ff2a2a"/><rect x="88.6" y="71.1" width="5" height="3" rx=".6" fill="#46e06a" opacity=".9"/>
<path d="M89.6 64C89.6 59 95 58.5 96.5 54.5" stroke="#e9d9ad" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<circle cx="96.7" cy="54" r="1.6" fill="#ffb02e"/>`,
};

/* his poof when he's killed: a burst of round cloud puffs with a few little ones flying off */
export const POOF = `<svg viewBox="0 0 100 70" aria-hidden="true">
<g fill="#ffffff" stroke="#b9bfcc" stroke-width="2">
<circle cx="30" cy="40" r="14"/><circle cx="50" cy="30" r="18"/><circle cx="70" cy="40" r="14"/><circle cx="42" cy="50" r="13"/><circle cx="60" cy="50" r="13"/></g>
<g fill="#ffffff"><circle cx="30" cy="40" r="12.6"/><circle cx="50" cy="30" r="16.6"/><circle cx="70" cy="40" r="12.6"/><circle cx="42" cy="50" r="11.6"/><circle cx="60" cy="50" r="11.6"/></g>
<path d="M40 22Q46 16 54 17" fill="none" stroke="#e9edf5" stroke-width="3" stroke-linecap="round"/>
<g fill="#fff" stroke="#b9bfcc" stroke-width="1.4"><circle cx="11" cy="24" r="4.4"/><circle cx="89" cy="22" r="4"/><circle cx="14" cy="58" r="3.4"/><circle cx="88" cy="58" r="3.6"/><circle cx="50" cy="6" r="3.2"/></g></svg>`;

/* the medkit: a white case with a red cross, a dark handle on top and two latches */
export const MEDKIT = `<svg viewBox="0 0 48 40" aria-hidden="true">
<path d="M17 9.6V6.4Q17 4 19.4 4H28.6Q31 4 31 6.4V9.6" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>
<path d="M17 9.6V6.4Q17 4 19.4 4H28.6Q31 4 31 6.4V9.6" fill="none" stroke="#4a4e5c" stroke-width="2.4" stroke-linecap="round"/>
<rect x="3" y="9" width="42" height="28" rx="5" fill="#f4f6fa" stroke="${INK}" stroke-width="2"/>
<path d="M3.6 31H44.4V32Q44.4 36.4 40 36.4H8Q3.6 36.4 3.6 32Z" fill="#d6dbe5"/>
<rect x="9" y="10.6" width="4" height="3" rx="1" fill="#9aa1b0" stroke="${INK}" stroke-width=".9"/><rect x="35" y="10.6" width="4" height="3" rx="1" fill="#9aa1b0" stroke="${INK}" stroke-width=".9"/>
<path d="M20.4 15H27.6V20.4H33V27.6H27.6V33H20.4V27.6H15V20.4H20.4Z" fill="#e63946" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M7 13.6Q7 12 9 12" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M21.6 16.4V20" stroke="#fff" stroke-width="1" opacity=".5" stroke-linecap="round"/></svg>`;

/* Mad God Justin's big black office chair (padded back, a seat, one post, five legs on wheels; no arms): his throw, and
   the Chair special's (specials.js) */
export const CHAIR = `<svg viewBox="0 0 100 120" aria-hidden="true">
<path d="M50 96L18 106M50 96L30 115M50 96L70 115M50 96L83 106M50 96L52 104" stroke="#1c1c28" stroke-width="6.6" stroke-linecap="round"/>
<path d="M50 96L18 106M50 96L30 115M50 96L70 115M50 96L83 106M50 96L52 104" stroke="#2c2e36" stroke-width="3.8" stroke-linecap="round"/>
<g fill="#2b2d34" stroke="#1c1c28" stroke-width="1.6"><circle cx="17" cy="108.6" r="4.4"/><circle cx="29.4" cy="116.4" r="4.4"/><circle cx="70.6" cy="116.4" r="4.4"/><circle cx="84" cy="108.6" r="4.4"/><circle cx="52.4" cy="106.4" r="3.8"/></g>
<rect x="46.4" y="76" width="7.4" height="21" rx="2" fill="#24262d" stroke="#1c1c28" stroke-width="1.6"/><path d="M48.6 79V94" stroke="#fff" stroke-width="1.2" opacity=".2" stroke-linecap="round"/>
<path d="M36 7C48 2.6 72 3.4 82 8.6C86 10.6 87 14.6 86.4 20.6L82.6 58.6C82 65 78.6 67.6 72 67.4L41 65.8C35 65.4 32.4 62.4 32.2 56.4L31 17C30.8 11 32 8.6 36 7Z" fill="#3b3d46" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/>
<path d="M38 12C49 8.4 70 9 79 13" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".16"/>
<path d="M36 36C46 33 68 34 80 38" fill="none" stroke="#24262d" stroke-width="1.6" stroke-linecap="round"/>
<path d="M58 14.6L57 34" stroke="#24262d" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
<path d="M17 66C26 60.4 72 60.6 84.6 64.4C89.4 66 89.6 72.4 85 75.6C74 82 30 82.4 17.6 78C11.6 75.8 11.8 69 17 66Z" fill="#45474f" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/>
<path d="M14.6 73.4C26 79 72 79.4 87 72.6" fill="none" stroke="#2a2c33" stroke-width="2.2" stroke-linecap="round"/>
<path d="M22 66.6C34 63.6 62 63.6 76 66" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".18"/>
</svg>`;
/* the zebra cake (the owner's picture): a square snack cake in white icing with thin chocolate stripes across the top and
   down the sides, its cut front showing the golden sponge and the cream between */
export const ZEBRA = `<svg viewBox="0 0 56 36" aria-hidden="true">
<path d="M4 12L30 6L52 11L26 18Z" fill="#fbf8f0" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M26 18L52 11V25L26 33Z" fill="#efe9dc" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M4 12L26 18V33L4 26Z" fill="#f2c66d" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M4 18.6L26 24.8V27.4L4 21.2Z" fill="#fffaf0"/><path d="M4 12.8L26 18.8V20.6L4 14.6Z" fill="#fbf8f0"/>
<g fill="#e2ab4c"><circle cx="9" cy="23.6" r=".7"/><circle cx="16" cy="28.6" r=".7"/><circle cx="21" cy="29.6" r=".6"/><circle cx="12" cy="17.6" r=".6"/><circle cx="19" cy="21" r=".6"/></g>
<g fill="none" stroke="#3b2314" stroke-width="1.6" stroke-linecap="round"><path d="M8.7 10.9Q19.7 15.4 30.7 16.7M30.7 16.7Q31.9 20.7 30.9 25.3M14.9 9.5Q25.9 13.9 36.9 15.1M36.9 15.1Q38.1 19.1 37.1 24.3M21.2 8.0Q32.2 12.3 43.2 13.4M43.2 13.4Q44.4 17.4 43.4 23.4M26.9 6.7Q37.9 10.9 48.9 11.8M48.9 11.8Q50.1 15.8 49.1 22.5"/></g>
<path d="M14 11Q22 9 30 8.2" stroke="#fff" stroke-width="1.2" opacity=".8" stroke-linecap="round"/></svg>`;

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
