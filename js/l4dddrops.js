/* ---------- Quacky Zombies' drops, drawn (Stage 4, the owner's list) ----------
   Each one's symbol, as the owner named them: a skull (Instant Kill), a bullet (Max Ammo), a nuclear bomb (Nuke), the
   adrenaline shot (Speed Boost), a dollar sign (Double Points) and a price tag (Sale). Simple shapes with the guns'
   dark outline and a soft white shine (l4ddguns.js), each filling a 40 × 40 square; the screen floats them over the
   floor with a green glow (css .l4-drop). Preview: tools/l4dd-art.html */
import { GUNS } from "./l4ddguns.js";

const INK = "#2a2d38";
const shine = (d, o = 0.5, w = 1.2) =>
  `<path d="${d}" stroke="#fff" stroke-width="${w}" opacity="${o}" fill="none" stroke-linecap="round"/>`;

/* the skull: bone white, darker on its right side, its eye holes with a red glint, the nose, the teeth */
const SKULL = `<svg viewBox="0 0 40 40"><path d="M20 3.6C11 3.6 5.2 9.8 5.2 17.6C5.2 22.2 7.4 25.6 10.4 27.4V32.2Q10.4 35.2 13.4 35.2H26.6Q29.6 35.2 29.6 32.2V27.4C32.6 25.6 34.8 22.2 34.8 17.6C34.8 9.8 29 3.6 20 3.6Z" fill="#f2efe6" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M27 6.2C31.4 8.6 33.6 12.8 33.6 17.6C33.6 21.6 31.8 24.6 28.4 26.6V32.2Q28.4 34 26.6 34H24.6Q27 33.4 27 30.6V25.4C30 23.4 31 20.6 31 17.6C31 12.6 29.4 8.6 27 6.2Z" fill="#d8d1bf"/>
<path d="M9.8 18.2C9.8 15.4 12 13.6 14.6 13.6S18.8 15.6 18.8 18.1C18.8 20.8 16.8 22.8 14.4 22.8S9.8 21 9.8 18.2Z" fill="#1c1d26"/><path d="M30.2 18.2C30.2 15.4 28 13.6 25.4 13.6S21.2 15.6 21.2 18.1C21.2 20.8 23.2 22.8 25.6 22.8S30.2 21 30.2 18.2Z" fill="#1c1d26"/>
<circle cx="14.8" cy="18.4" r="1.5" fill="#ff4b4b"/><circle cx="25.2" cy="18.4" r="1.5" fill="#ff4b4b"/>
<path d="M20 22.6L17.8 26.4H22.2Z" fill="#1c1d26" stroke="#1c1d26" stroke-width=".8" stroke-linejoin="round"/>
<path d="M10.4 29H29.6" stroke="${INK}" stroke-width="1.3"/><path d="M15.2 29V35M20 29V35M24.8 29V35" stroke="${INK}" stroke-width="1.3"/>
${shine("M9.4 11.4Q12.4 6.8 18 6", 0.7, 1.6)}</svg>`;

/* the bullet: standing up, a copper tip on a brass case, the groove and the rim at its foot */
const BULLET = `<svg viewBox="0 0 40 40"><path d="M13.6 17.6C13.6 9.4 16.8 4.6 20 3.4C23.2 4.6 26.4 9.4 26.4 17.6Z" fill="#c8693a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<rect x="13.6" y="17" width="12.8" height="15.6" rx="1.2" fill="#e0a43a" stroke="${INK}" stroke-width="1.6"/><path d="M23.4 18.4V31.4" stroke="#b77d26" stroke-width="2.2" stroke-linecap="round"/>
<rect x="12.6" y="32.6" width="14.8" height="3.6" rx="1.2" fill="#c98a3a" stroke="${INK}" stroke-width="1.5"/><path d="M14.2 30.4H25.8" stroke="${INK}" stroke-width="1" opacity=".55"/>
${shine("M16.6 19.6V29.6", 0.6, 1.6)}${shine("M16.8 14.6Q17.2 9.6 19.2 6.8", 0.5, 1.3)}</svg>`;

/* the nuclear bomb: fat and yellow, falling nose first, the black trefoil on its side, the box fins at its tail */
const NUKE = `<svg viewBox="0 0 40 40"><g transform="translate(20 20) rotate(35) scale(.84) translate(-21 -20)"><path d="M28.4 15.6L33.4 14.2V25.8L28.4 24.4Z" fill="#454b5e" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
<rect x="32" y="11" width="5.6" height="18" rx="1" fill="#33384a" stroke="${INK}" stroke-width="1.5"/><path d="M32 20H37.6" stroke="${INK}" stroke-width="1.2"/>
<ellipse cx="17" cy="20" rx="12.6" ry="10.4" fill="#ffd23f" stroke="${INK}" stroke-width="1.8"/><path d="M8.6 26.8Q17 31.6 26 27.4" fill="none" stroke="#d9a21a" stroke-width="2.6" stroke-linecap="round"/>
<path d="M15.70 17.75L13.30 13.59A7.4 7.4 0 0 1 20.70 13.59L18.30 17.75A2.6 2.6 0 0 0 15.70 17.75ZM19.60 20.00L24.40 20.00A7.4 7.4 0 0 1 20.70 26.41L18.30 22.25A2.6 2.6 0 0 0 19.60 20.00ZM15.70 22.25L13.30 26.41A7.4 7.4 0 0 1 9.60 20.00L14.40 20.00A2.6 2.6 0 0 0 15.70 22.25Z" fill="#1c1d26"/><circle cx="17" cy="20" r="1.5" fill="#1c1d26"/>
${shine("M9.6 13.4Q13 10.6 18.4 10.4", 0.75, 1.6)}</g></svg>`;

/* the dollar sign: a thick green S with the bar through it */
const DOLLAR = `<svg viewBox="0 0 40 40"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 3.6V36.4" stroke="${INK}" stroke-width="7.6"/><path d="M27.4 11.6C25.8 9.4 23.2 8.4 20 8.4C15.6 8.4 12.6 10.8 12.6 14.2C12.6 21.8 27.6 18.4 27.6 26.2C27.6 29.8 24.4 31.8 20 31.8C16.6 31.8 13.8 30.4 12.4 28.2" stroke="${INK}" stroke-width="8"/>
<path d="M20 3.6V36.4" stroke="#2fbf5b" stroke-width="4"/><path d="M27.4 11.6C25.8 9.4 23.2 8.4 20 8.4C15.6 8.4 12.6 10.8 12.6 14.2C12.6 21.8 27.6 18.4 27.6 26.2C27.6 29.8 24.4 31.8 20 31.8C16.6 31.8 13.8 30.4 12.4 28.2" stroke="#2fbf5b" stroke-width="4.4"/></g>
${shine("M14.4 13.4Q15.2 10.4 19.4 10", 0.65, 1.3)}</svg>`;

/* the price tag: orange, its hole and its string, a white percent sign */
const TAG = `<svg viewBox="0 0 40 40"><path d="M11.6 19.4Q7.4 12.6 3.4 9.6" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>
<path d="M5.4 21L14.6 9.4H34Q36.4 9.4 36.4 11.8V30.2Q36.4 32.6 34 32.6H14.6Z" fill="#ff7a3d" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M34.6 11.6V30.4" stroke="#d95a22" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="12.6" cy="21" r="2.3" fill="#1c1d26"/>
<g stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cx="21" cy="15.6" r="2.4"/><circle cx="28.6" cy="26.4" r="2.4"/><path d="M29 13.6L20.6 28.4"/></g>
${shine("M15.4 11.4H31", 0.5, 1.2)}</svg>`;

export const DROP_ICONS = {
  kill: SKULL,
  ammo: BULLET,
  nuke: NUKE,
  speed: GUNS.adrenaline.icon,
  double: DOLLAR,
  sale: TAG,
};
