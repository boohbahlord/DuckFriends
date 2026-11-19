/* ---------- Quacky Zombies' new weapons, drawn (the owner's list, Stage 3) ----------
   Each one as the pistol and the shotgun are drawn (specials.js): simple shapes with a dark outline, side on, pointing
   right with the stock or the grip at the left (the game turns it toward the aim), a soft white shine along the top.
   held: in a duck's hand; icon: the weapons bar's picture (turned 45°, its grip down at the left, filling a square);
   w: how wide it is in the hand, in duck sizes. Their bullets are here too (the screens turn them the way they fly).
   Preview: tools/l4dd-art.html */
import { LASER } from "./laserart.js";
const INK = "#2a2d38";
/* the colors they share: the guns' dark metal, lighter metal, the underside, polymer, two woods and their grain */
const M1 = "#33384a",
  M2 = "#454b5e",
  M0 = "#2a2e3c",
  POLY = "#1f2230",
  WOOD = "#8a4b2a",
  AKWOOD = "#b0602a",
  GRAIN = "#5a3218",
  OLIVE = "#5d6b3a",
  OLIVE_D = "#4a5530",
  STEEL = "#a4a8b4",
  STEEL_D = "#8d929e",
  BRASS = "#e0a43a",
  BEAD = "#ffd23f";
const shine = (d, o = 0.28, w = 0.8) =>
  `<path d="${d}" stroke="#fff" stroke-width="${w}" opacity="${o}" fill="none" stroke-linecap="round"/>`;
const box = (x, y, w, h, r, fill, sw = 1.1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const part = (d, fill, sw = 1.1) =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;

/* the sniper, a Barrett .50 Cal (the owner's, Nov 18 12:19Z: "give it the look of a Barret 50 caliber"): long and
   heavy, all dark metal. The stock with its black recoil pad and the monopod under it, the pistol grip, the big box
   magazine in front of it; the long upper receiver running out over the barrel, cut through with its row of square
   holes; the carry handle; the bipod folded under; the barrel out to the big two-chambered arrowhead muzzle brake; the
   scope on its rail, its glass catching the light */
const SNIPER = `<svg viewBox="0 0 96 24">${part("M3.4 7.6H21V14.6L16.6 15.2V17.6H12.4V15.6L4.4 16.2Q2.4 16.4 2.4 14.4V9Q2.4 7.6 3.4 7.6Z", M1, 1.15)}${box(0.8, 6.8, 2.8, 10.2, 1, "#14161c", 1)}${shine("M5 9.2H19.4", 0.24)}
${part("M24.6 14.6H29.8L28 22.4Q27.6 23.6 26.2 23.4L24.2 23Q23 22.6 23.4 21.4Z", POLY, 1.1)}<path d="M29.8 15.2Q29.6 19 32 19" fill="none" stroke="${INK}" stroke-width="1.1"/>
${box(32.6, 14.2, 7.4, 7.8, 1, M0, 1.1)}<path d="M34.2 16.4H38.4M34.2 18.6H38.4" stroke="#fff" stroke-width=".55" opacity=".16"/>
${[60.4, 62.8].map((y, k) => `<path d="M${60 + k * 1.4} ${12.4 + k * 0.6}L${79 - k} ${13 + k * 0.5}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M${60 + k * 1.4} ${12.4 + k * 0.6}L${79 - k} ${13 + k * 0.5}" stroke="${M0}" stroke-width="1" stroke-linecap="round"/>`).join("")}
${box(64, 8, 23, 2.6, 0.8, M2, 1)}${shine("M65.6 8.8H85.6", 0.26, 0.6)}
${part("M86.6 5.6H90.2L91 6.6H92.4L95 9.3L92.4 12H91L90.2 13H86.6Z", M1, 1)}<path d="M88.4 6.8V11.8M91.6 7.6V11" stroke="#0e0e14" stroke-width="1"/>
${box(20.4, 9.2, 26, 6, 1.2, M1, 1.1)}<path d="M22.4 12.4H44" stroke="${INK}" stroke-width=".7" opacity=".4"/>
${box(20, 5.4, 45, 4.6, 1.2, M2, 1.15)}${[48.6, 52.8, 57, 61.2].map((x) => `<rect x="${x - 1.3}" y="6.4" width="2.6" height="2.6" rx=".4" fill="#14161c"/>`).join("")}${shine("M22 6.5H46", 0.28)}
<path d="M48 5.4V2.6Q48 1.4 49.2 1.4H56.6Q57.8 1.4 57.8 2.6V5.4" fill="none" stroke="${INK}" stroke-width="2.6"/><path d="M48 5.4V2.6Q48 1.4 49.2 1.4H56.6Q57.8 1.4 57.8 2.6V5.4" fill="none" stroke="${M0}" stroke-width="1.1"/>
${box(22.4, 4.2, 20.4, 1.4, 0.4, M0, 0.8)}${part("M23.2 0.8L26 1.6V4.2H23.2Z", M0, 0.9)}${box(25.6, 0.8, 13.8, 3.4, 1.2, POLY, 1.05)}${part("M39 1.2L43.6 0.2V4.8L39 3.8Z", M0, 0.9)}
<ellipse cx="42.9" cy="2.5" rx=".8" ry="2" fill="#7fd0ff" opacity=".9"/>${shine("M27 1.9H38.2", 0.35, 0.6)}</svg>`;

/* the submachine gun, an MP5 (the owner's, Nov 18 12:19Z: "rename it to MP5 and give it the look of an MP5"): slim and
   black. The fixed polymer stock, the long thin receiver with the drum rear sight on top, the pistol grip and its
   trigger guard, the magazine curving forward, the cocking tube over the tapered handguard with its handle sticking
   up at the front, the short barrel with its three lugs, and the ring of the front sight */
const SMG = `<svg viewBox="0 0 56 28">${part("M2.2 6.8L13.6 8.4V13.8L4.4 17.2Q1.4 18.2 1.4 15.2V8.2Q1.4 6.7 2.2 6.8Z", POLY, 1.15)}<path d="M1.6 8.6V15.4" stroke="#0e0e14" stroke-width="2"/>${shine("M4.2 8.8L12 9.8", 0.2)}
${part("M17.2 11.2H22L20.8 19.8Q20.5 21 19.2 21H16.6Q15.3 21 15.6 19.6Z", POLY, 1.1)}<path d="M17.2 14H20.6M17 16H20.2M16.8 18H19.8" stroke="#fff" stroke-width=".55" opacity=".16"/>
<path d="M22 11.6Q21.8 15.4 24.4 15.4H26" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="M23.2 11.4L23.8 13.8" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
${part("M26.4 11.2H31.2Q31.8 17.6 35 24L31.2 25.8Q27.6 18.8 26.4 11.2Z", M0, 1.1)}${shine("M28.4 13.4Q29.2 18.6 31.6 23.2", 0.2, 0.7)}
${box(34.8, 5.2, 12.4, 2.4, 1, M2, 0.95)}<path d="M44.2 5.4L46.6 2.6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M44.2 5.4L46.6 2.6" stroke="${M2}" stroke-width="1" stroke-linecap="round"/>
${part("M34.2 7.4H45.4L46.4 8.6V12.2L45.4 13.4H34.2Z", POLY, 1.1)}<path d="M36.6 8.8V12M38.8 8.8V12M41 8.8V12M43.2 8.8V12" stroke="#fff" stroke-width=".5" opacity=".14"/>
${box(46, 8.8, 6.6, 2.4, 0.7, M2, 0.95)}${box(51.4, 8.2, 3.2, 3.6, 0.7, M1, 0.9)}<path d="M52.4 8.6V11.4M53.6 8.6V11.4" stroke="#0e0e14" stroke-width=".6"/>
<path d="M48.6 8.8V5.8" stroke="${INK}" stroke-width="1.6"/><circle cx="48.6" cy="4.6" r="1.6" fill="none" stroke="${INK}" stroke-width="1.6"/><circle cx="48.6" cy="4.6" r="1.6" fill="none" stroke="${M2}" stroke-width=".6"/>
${box(12.4, 5.8, 22.6, 5.6, 1.6, M1, 1.15)}${shine("M14.2 7.1H33", 0.26)}${part("M14.2 5.8V3.6Q14.2 2.6 15.4 2.6H17.4Q18.6 2.6 18.6 3.6V5.8", M0, 0.9)}<circle cx="16.4" cy="3.8" r=".6" fill="#14161c"/></svg>`;

/* the Tommy gun (the owner's, Nov 17): a wooden stock and wooden grip, the dark receiver with a cooling-fin barrel, a vertical
   foregrip under it and the round drum magazine under the receiver (placeholder art until Noah's) */
const TOMMY = `<svg viewBox="0 0 60 30">${part("M2.4 8.6L16 9.8V13.4L6 17Q1.6 18.2 1.6 14.6V10Q1.6 8.5 2.4 8.6Z", WOOD, 1.15)}${shine("M4.6 10.4L14.4 11.2", 0.3)}
${part("M17.4 13H21.8L20.8 19.4Q20.5 20.6 19.2 20.4L17.2 20Q16.2 19.7 16.5 18.6Z", WOOD, 1.1)}
<circle cx="29.6" cy="21.4" r="6.4" fill="${M1}" stroke="${INK}" stroke-width="1.15"/><circle cx="29.6" cy="21.4" r="2.6" fill="${M2}" stroke="${INK}" stroke-width=".9"/><path d="M29.6 15.4V18.8M29.6 24V27.4M23.6 21.4H27M32.2 21.4H35.6" stroke="${INK}" stroke-width=".8"/>
${part("M40 12.6H44.4V19.4Q44.4 20.6 43.2 20.6H41.2Q40 20.6 40 19.4Z", WOOD, 1.1)}
${box(40, 8.2, 17, 3.2, 0.9, M2, 1)}<path d="M43 8.4V11.2M46 8.4V11.2M49 8.4V11.2M52 8.4V11.2" stroke="${INK}" stroke-width=".7"/>${box(55.4, 8.8, 3.6, 2.2, 0.7, M0, 0.9)}
${box(13, 6.6, 28, 6.4, 1.6, M1, 1.15)}${shine("M14.8 8H39", 0.26)}<circle cx="36" cy="9.8" r="1.3" fill="${M2}" stroke="${INK}" stroke-width=".8"/></svg>`;

/* the UMP-45 (the owner's, Nov 17): a compact one in dark polymer, a short stock, a long slightly curved magazine, a rail on
   top and a short barrel (placeholder art until Noah's) */
const UMP = `<svg viewBox="0 0 52 28">${part("M2.4 7.4L14 8.4V12.6L5 14.8Q1.6 15.6 1.6 12.4V8.8Q1.6 7.3 2.4 7.4Z", POLY, 1.15)}
${part("M15.4 12H19.6L18.4 19.8Q18.1 21 16.8 20.8H15Q13.8 20.5 14.2 19.4Z", POLY, 1.1)}
<path d="M19.4 12.2Q19.2 16 21.4 16H23" fill="none" stroke="${INK}" stroke-width="1.1"/>
${part("M25 12H30.4L32.4 24.6Q32.6 26.4 31 26.4H28.4Q27 26.4 26.8 25Z", M0, 1.1)}${shine("M27.2 14L28.6 24", 0.22, 0.7)}
${box(36, 7.2, 10, 3.6, 0.9, M2, 1)}${box(45.4, 7.8, 4.4, 2.4, 0.7, M0, 0.9)}
${box(11, 5.6, 26, 7, 1.8, POLY, 1.15)}${shine("M13 7H35", 0.26)}${box(14, 3.8, 18, 1.8, 0.5, M2, 0.8)}</svg>`;

/* the AK-47: its orange-brown wood (the stock sloping down, the grip, the handguard over and under the barrel), the dark
   receiver with its cover, the curved magazine sweeping forward, the gas tube, the tall front sight and the slanted
   muzzle */
const AK = `<svg viewBox="0 0 74 28">${part("M2.4 8L19.2 9.8V13.8L5.6 18.6Q1.4 19.8 1.4 16V9.4Q1.4 7.9 2.4 8Z", AKWOOD, 1.15)}<path d="M1.6 9.8V16.4" stroke="#2b1a10" stroke-width="2.2"/><path d="M6 12.4L17 11.6" stroke="${GRAIN}" stroke-width=".7" opacity=".6"/>${shine("M4.6 9.6L17.4 10.9", 0.3)}
${part("M19.8 13H24.4L22.6 21.4Q22.2 22.6 20.8 22.4L18.6 22Q17.4 21.7 17.8 20.4Z", AKWOOD, 1.1)}
<path d="M24.2 14Q24 17.6 26.4 17.6H28.4" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="M25.6 13.8L26.2 16" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
${part("M28.6 13.8H34.8Q35.4 19.6 39.2 25.2L33.6 27.4Q29.6 21.6 28.6 13.8Z", M0, 1.1)}<path d="M30.6 17.6L35.6 16.8M31.4 20.6L36.8 19.4M32.6 23.4L38 21.8" stroke="${INK}" stroke-width=".6" opacity=".55"/>${shine("M30.4 15.4Q31.4 21.4 34.4 25.6", 0.2, 0.7)}
${box(49, 9.8, 20, 2.4, 0.9, M2, 1)}${part("M68.4 9.2H72.6L72 13.2H68.4Z", M1, 1)}<path d="M70.4 9.6V12.8" stroke="#0e0e14" stroke-width=".7"/>
${part("M56.6 9.8V5H58.4L59.4 9.8Z", M1, 0.95)}${box(49.6, 7.2, 7.6, 2, 0.8, M2, 0.9)}
${box(38, 9.6, 12.4, 5, 1.8, AKWOOD, 1.1)}<path d="M40 12.4H48.4" stroke="${GRAIN}" stroke-width=".7" opacity=".6"/>${box(38.4, 6.8, 11.6, 2.8, 1.2, "#9a5224", 1)}
${box(17.6, 8.2, 21, 6, 1.2, M1, 1.15)}${shine("M19.4 9.5H36.4", 0.26)}<path d="M21 11.8H30" stroke="${INK}" stroke-width=".9" opacity=".45"/>${box(34.6, 10.4, 3.4, 1.8, 0.6, M2, 0.8)}${part("M36.4 8.2V6.6H38.4V8.2", M1, 0.8)}</svg>`;

/* the chain gun: six barrels in a turning cluster (three show), held by three clamps, a rotor at their back, the motor's
   housing with its vents, two spade grips at the back, a carry handle over the top, and the belt of brass rounds
   feeding it from below */
const ROUNDS = [
  [19.6, 22.4, 8],
  [18.8, 25.2, 26],
  [17, 27.6, 46],
  [14.6, 29.2, 66],
  [11.8, 30, 82],
];
const CHAINGUN = `<svg viewBox="0 0 72 32"><path d="M8 7.4V3.6Q8 2 9.6 2H17.6Q19.2 2 19.2 3.6V7.4" fill="none" stroke="${INK}" stroke-width="3"/><path d="M8 7.4V3.6Q8 2 9.6 2H17.6Q19.2 2 19.2 3.6V7.4" fill="none" stroke="${M0}" stroke-width="1.4"/>
<path d="M20.4 20.8Q20.6 27 15.6 29.4Q12.4 30.8 9 30.6" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M20.4 20.8Q20.6 27 15.6 29.4Q12.4 30.8 9 30.6" fill="none" stroke="#3a3d48" stroke-width="2" stroke-linecap="round"/>
${ROUNDS.map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 1.1}" y="${y - 3.2}" width="2.2" height="4.6" rx=".5" fill="${BRASS}" stroke="${INK}" stroke-width=".7"/><path d="M${x - 1.1} ${y - 3.2}Q${x} ${y - 5}  ${x + 1.1} ${y - 3.2}Z" fill="#c98a3a" stroke="${INK}" stroke-width=".6"/></g>`).join("")}
${box(1, 9.2, 4.4, 3, 1.2, POLY, 0.9)}${box(1, 15.8, 4.4, 3, 1.2, POLY, 0.9)}
${box(4, 7, 18, 14, 3.4, M2, 1.2)}<path d="M8.4 11V17M11.4 11V17M14.4 11V17" stroke="${INK}" stroke-width="1" opacity=".55" stroke-linecap="round"/>${shine("M6.4 8.6H19.4", 0.3, 0.9)}
${box(22, 15.8, 44, 3.4, 1, M1, 1)}${box(22, 7.8, 44, 3.4, 1, M1, 1)}${box(22, 11.8, 44, 3.4, 1, M2, 1)}${shine("M24 12.8H64", 0.3, 0.6)}
${[30, 45, 60].map((x) => box(x, 6.8, 3.4, 13.4, 1, M0, 1)).join("")}${box(19.8, 6, 4.4, 15.4, 1.2, M0, 1.1)}
${box(65.4, 7.2, 4.2, 12.8, 1.4, POLY, 1)}${[9.5, 13.5, 17.5].map((y) => `<circle cx="69" cy="${y}" r=".9" fill="#0b0c10"/>`).join("")}</svg>`;

/* the revolver: silver, with a curved wooden grip. The frame, the hammer cocked back at its top, the fluted cylinder,
   the long barrel with the ejector rod under it and the front sight */
const REVOLVER = `<svg viewBox="0 0 44 24">${part("M7.2 9.6H14.8L13.6 19Q13.2 21.6 10.6 21.6H7.4Q4.4 21.6 4.9 18.8L6.1 12.4Q6.4 10.6 7.2 9.6Z", WOOD, 1.15)}<circle cx="9.8" cy="15.4" r="1.4" fill="#c9a24a" stroke="${INK}" stroke-width=".7"/><path d="M7.6 11.6L6.8 17.4" stroke="#fff" stroke-width=".7" opacity=".25"/>
${part("M11.4 5.8L7.4 1.9Q5.9 1 5.4 2.4Q5.5 3.4 6.8 4.4L8.6 6.8Z", "#6b7280", 1)}
<path d="M14.4 12.4Q14 16.4 17 16.4Q19.8 16.4 19.4 12.4" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="M16.4 12.2L17.2 14.8" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
${box(24.4, 8.6, 13.2, 2.2, 0.8, STEEL_D, 1)}${box(24.4, 5, 17.4, 3.6, 1, STEEL, 1.1)}${shine("M26 6H40", 0.5, 0.7)}${part("M39.4 5.2L40.6 3.2H41.6V5.2", "#6b7280", 0.8)}
${part("M8.8 5.4H24.8V9.4L21.4 12.6H10.2Q8.8 12.6 8.8 11.2Z", STEEL, 1.15)}${shine("M10.4 6.6H15", 0.45, 0.7)}
${box(15.4, 4, 9.4, 8.6, 2.4, STEEL_D, 1.1)}<path d="M17.2 6.2H23M17.2 8.3H23M17.2 10.4H23" stroke="${INK}" stroke-width=".7" opacity=".5"/>${shine("M17.4 5.2H22.8", 0.5, 0.6)}</svg>`;

/* the grenade launcher: olive, with a revolving drum of six grenades. A skeleton stock, the grip, the drum between
   its two plates, the fat barrel with a rail on top, the foregrip under it, and a grenade's green tip in the muzzle */
const LAUNCHER = `<svg viewBox="0 0 64 30">${part("M2.4 8.2L14 10V14.2L5.2 17.8Q1.4 18.8 1.4 15.4V9.6Q1.4 8.1 2.4 8.2Z", OLIVE_D, 1.15)}<path d="M5.4 11.2L11.4 12.2V13.2L5.6 15.2Z" fill="#14161c" opacity=".55"/><path d="M1.6 9.8V15.8" stroke="#14161c" stroke-width="2.2"/>
${part("M14.2 14H18.8L17.2 22Q16.8 23.2 15.4 23L13.4 22.6Q12.2 22.2 12.6 21Z", POLY, 1.1)}
${box(12.6, 9, 10, 5.6, 1, M1, 1.1)}
${part("M44.2 16.6H49.2L48.6 24Q48.4 25.2 47.2 25.2H45.6Q44.4 25.2 44.4 24Z", POLY, 1)}
${box(35.6, 7.4, 22, 9.4, 2, M2, 1.15)}${box(36, 5.4, 18.4, 2.2, 0.6, M1, 0.9)}<path d="M38 5.4V7.6M41 5.4V7.6M44 5.4V7.6M47 5.4V7.6M50 5.4V7.6" stroke="${INK}" stroke-width=".55" opacity=".6"/>${shine("M38 9H55.6", 0.3, 0.8)}
${box(57, 6.4, 4.8, 11.4, 1.6, M0, 1.1)}<path d="M61.8 9.4Q64.4 12.1 61.8 14.8Z" fill="#6f8f3a" stroke="${INK}" stroke-width=".8"/>
${box(21, 4.6, 16, 17.4, 6, OLIVE, 1.2)}<path d="M23.4 9.4H34.6M23 13.3H35M23.4 17.2H34.6" stroke="${OLIVE_D}" stroke-width="1.6" stroke-linecap="round"/>${shine("M24.6 6.6H33.4", 0.32, 0.9)}${box(20, 6.4, 2.4, 13.8, 0.8, M0, 0.9)}${box(35.4, 6.4, 2.4, 13.8, 0.8, M0, 0.9)}</svg>`;

/* the light machine gun: black. A polymer stock, the grip, the receiver with its feed cover, the olive ammo box under it
   with the brass belt going up in, a carry handle, the barrel's shroud with its holes, the bipod folded under the
   barrel, the flash hider and the front post */
const LMG = `<svg viewBox="0 0 82 30">${part("M2.4 8.6L16.4 10V14.6L4.8 17.8Q1.4 18.8 1.4 15.6V10Q1.4 8.5 2.4 8.6Z", "#2f3340", 1.15)}<path d="M1.6 10V16" stroke="#0e0e14" stroke-width="2.2"/>${shine("M4.6 10.2L14.6 11.2", 0.22)}
${part("M17.6 14.6H22L20.6 22Q20.2 23.2 18.8 23L16.8 22.6Q15.6 22.2 16 21Z", POLY, 1.1)}
<path d="M22 15.4Q21.8 18.6 24 18.6" fill="none" stroke="${INK}" stroke-width="1.1"/>
${[60.4, 62.6].map((y, k) => `<path d="M${61 + k} ${13.2 + k * 0.8}L73.4 ${14.6 + k * 0.4}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M${61 + k} ${13.2 + k * 0.8}L73.4 ${14.6 + k * 0.4}" stroke="${M0}" stroke-width="1" stroke-linecap="round"/>`).join("")}
${box(58.4, 9.6, 18.6, 2.8, 0.9, M2, 1)}${box(76.2, 8.8, 4.8, 4.4, 0.8, M0, 1)}<path d="M78 9.6V12.4M79.6 9.6V12.4" stroke="#0e0e14" stroke-width=".7"/>${part("M73.6 9.6V6.6H75V9.6", M1, 0.9)}
${box(38, 8.4, 21.4, 5.6, 1.2, M1, 1.1)}${[41.4, 45.2, 49, 52.8, 56.6].map((x) => `<circle cx="${x}" cy="11.2" r="1" fill="#14161c"/>`).join("")}${shine("M40 9.4H57.6", 0.22, 0.6)}
<path d="M42 8.4V5Q42 3.4 43.6 3.4H49.4Q51 3.4 51 5V8.4" fill="none" stroke="${INK}" stroke-width="2.8"/><path d="M42 8.4V5Q42 3.4 43.6 3.4H49.4Q51 3.4 51 5V8.4" fill="none" stroke="${M0}" stroke-width="1.2"/>
${[34.2, 35.8, 37.4].map((x, k) => `<rect x="${x - 0.7}" y="${11.6 + k * 0.6}" width="1.4" height="3.6" rx=".4" fill="${BRASS}" stroke="${INK}" stroke-width=".55" transform="rotate(${-20 + k * 6} ${x} ${13.4 + k * 0.6})"/>`).join("")}
${box(23.6, 14.6, 11.6, 9.6, 1.4, OLIVE, 1.1)}${box(26.2, 17, 6.4, 2.4, 0.6, OLIVE_D, 0.8)}${shine("M25.4 15.8H33.4", 0.28, 0.7)}
${box(15, 7.4, 24.4, 7.4, 1.4, M2, 1.15)}${part("M17 7.4L18 5.6H35L36.4 7.4", M1, 0.9)}${shine("M17 8.8H37.4", 0.28)}<path d="M18.6 11.6H30" stroke="${INK}" stroke-width=".8" opacity=".4"/></svg>`;

/* the adrenaline shot: a syringe of red adrenaline with a yellow lightning band. The plunger and its thumb pad, the
   finger flange, the clear barrel with its marks, the needle with a drop at its tip */
const ADRENALINE = `<svg viewBox="0 0 44 14">${box(0.8, 2.4, 2.6, 9.2, 1, "#d9dee8", 1)}${box(3.2, 6, 9, 2, 0.6, "#d9dee8", 0.9)}${box(11, 2.6, 2.4, 8.8, 0.8, "#d9dee8", 1)}
${box(13.2, 3.8, 18, 6.4, 1.8, "#f4f8ff", 1.1)}<rect x="17.6" y="5" width="13" height="4" rx="1.2" fill="#ff3d6e"/><rect x="15.6" y="4.6" width="2.2" height="4.8" rx=".6" fill="${INK}"/>
<path d="M21.6 5.2L19.8 7.6H22L20.6 9.4L24.2 6.4H22L23.4 5.2Z" fill="${BEAD}" stroke="#7a5a00" stroke-width=".4" stroke-linejoin="round"/>
<path d="M25.4 3.8V5.4M28 3.8V5.4M30 3.8V5" stroke="${INK}" stroke-width=".6"/>${shine("M15 4.9H30", 0.6, 0.7)}
${box(31, 5.4, 3, 3.2, 0.6, "#c9a24a", 0.9)}<path d="M34 7H42.6" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M34 7H42.6" stroke="${STEEL}" stroke-width=".8" stroke-linecap="round"/><circle cx="43.2" cy="8.4" r=".9" fill="#ff3d6e"/></svg>`;

/* Safe Keeping: a halo, a gold ring seen a little from above, glowing a heavenly light blue (the owner's, Nov 16) */
const HALO = `<svg viewBox="0 0 30 30"><ellipse cx="15" cy="15" rx="12.5" ry="6.4" fill="none" stroke="#bfe9ff" stroke-width="5.4" opacity=".45"/>
<ellipse cx="15" cy="15" rx="11" ry="5.2" fill="none" stroke="${INK}" stroke-width="4.4"/><ellipse cx="15" cy="15" rx="11" ry="5.2" fill="none" stroke="#ffd23f" stroke-width="2.6"/>
<path d="M6.6 13.2Q10 10.6 15 10.4" fill="none" stroke="#fff6c0" stroke-width="1.2" stroke-linecap="round"/><path d="M21 19.2Q23.4 18.4 24.6 17" fill="none" stroke="#c98a12" stroke-width="1.2" stroke-linecap="round"/></svg>`;

/* the double barrel (the owner asked for it, Nov 16): a break-action shotgun. A wooden stock with a dip at the wrist, the silver action with its two
   hammers, the two barrels side by side (one over the other, seen from the side), a wooden forend under them, a brass
   bead at the muzzle */
const DBARREL = `<svg viewBox="0 0 76 24">${part("M2.4 8L20.4 9.4V14L12.4 15Q8.6 15.4 6.8 18.4L4.4 19Q1.4 19.4 1.4 16V9.4Q1.4 7.9 2.4 8Z", WOOD, 1.15)}<path d="M1.6 9.6V16.6" stroke="#2b1a10" stroke-width="2.2"/><path d="M5.4 12.6L17.8 11.6" stroke="${GRAIN}" stroke-width=".7" opacity=".6"/>${shine("M4.8 9.8L18.6 10.8", 0.3)}
<path d="M21.6 13.6Q21.2 17.4 24.2 17.4Q27 17.4 26.8 13.6" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="M23.8 13.4L24.6 16.2" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>
${part("M19.4 8.2H31.6Q32.8 8.2 32.8 9.6V13.8H22Q19.4 13.8 19.4 11.4Z", STEEL, 1.15)}${shine("M21 9.4H31", 0.55, 0.7)}<path d="M23 11.6Q26 10.4 29.6 11.6" stroke="${INK}" stroke-width=".6" opacity=".4" fill="none"/>
${part("M22.6 8.6L20.8 5.2Q20.4 4.2 21.4 4.2L23.6 5.6L24.6 8.4Z", STEEL_D, 0.9)}${part("M26.4 8.6L24.8 5.2Q24.4 4.2 25.4 4.2L27.6 5.6L28.4 8.4Z", STEEL_D, 0.9)}
${box(32.4, 7, 41.4, 3.6, 1.4, M1, 1.05)}${box(32.4, 10.4, 41.4, 3.6, 1.4, M2, 1.05)}<path d="M33 10.6H73.4" stroke="#0e0e14" stroke-width=".9"/>${shine("M34.4 8.6H72", 0.35, 0.6)}<path d="M73.8 7.8V13.6" stroke="#0e0e14" stroke-width="1"/>
${part("M33 13.4H49.4Q50.6 13.4 50.2 14.8L49.6 16.4Q49.2 17.2 48 17.2H35Q33.4 17.2 33.2 15.8Z", "#a0612f", 1.05)}<path d="M36 15.2H47" stroke="${GRAIN}" stroke-width=".7" opacity=".6"/>
<circle cx="72.4" cy="6.8" r="1.1" fill="${BRASS}" stroke="${INK}" stroke-width=".6"/></svg>`;

/* the flamethrower (Nov 16): a fat red fuel tank under the gun with its gauge, a hose from the tank back up into the body, the
   grip and a front grip, a long nozzle with a cooling shroud of holes, and the pilot light burning blue at its tip */
const FLAMER = `<svg viewBox="0 0 72 32">${part("M2.6 8.4L14.6 9.8V14L6 17.4Q1.6 18.6 1.6 15.2V9.8Q1.6 8.3 2.6 8.4Z", POLY, 1.15)}${shine("M4.6 10L12.6 10.8", 0.25)}
${part("M15.6 14H20.2L18.8 22Q18.4 23.2 17 23L15 22.6Q13.8 22.2 14.2 21Z", POLY, 1.1)}<path d="M20 14.6Q19.8 17.8 22 17.8" fill="none" stroke="${INK}" stroke-width="1.1"/>
<path d="M30 25.4Q22 27.8 22.6 19.6" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M30 25.4Q22 27.8 22.6 19.6" fill="none" stroke="#3a3d48" stroke-width="1.8" stroke-linecap="round"/>
${box(27, 18.8, 22, 11.4, 5.4, "#c62f2f", 1.25)}${shine("M30.4 20.8H45.6", 0.4, 1.1)}<path d="M31 27.4H45" stroke="#7a1414" stroke-width="1.2" opacity=".6" stroke-linecap="round"/><circle cx="41.4" cy="24.6" r="2.4" fill="#f4f8ff" stroke="${INK}" stroke-width=".8"/><path d="M41.4 24.6L42.8 23.4" stroke="${INK}" stroke-width=".6"/>
${box(13.6, 7.6, 26, 7.6, 1.6, M2, 1.15)}${shine("M15.4 9H38", 0.28)}<path d="M17 12.2H30" stroke="${INK}" stroke-width=".8" opacity=".4"/>
${part("M44 14.4H48.4L47.4 21Q47.2 22 46.2 22H45Q44 22 44 21Z", POLY, 1)}
${box(39, 8.6, 21, 5.6, 1.4, M1, 1.1)}${[42.6, 46.4, 50.2, 54, 57.8].map((x) => `<circle cx="${x}" cy="11.4" r="1" fill="#14161c"/>`).join("")}${box(59.4, 9.4, 9.6, 4, 1, STEEL_D, 1)}${box(68.6, 8.6, 2.6, 5.6, 0.8, M0, 0.9)}
<path d="M70 7.6Q72.2 9.6 70.6 11.4Q69.4 9.8 70 7.6Z" fill="#6fb6ff" stroke="#2a5aa8" stroke-width=".5"/></svg>`;

/* the burst rifle (Nov 16, I wanted it based on the AUG): a bullpup (its magazine behind the grip), one smooth olive body that rounds off at the butt, a
   big round scope sitting on it, the one long trigger guard that wraps the whole hand, a folding front grip, the
   clear magazine showing its brass rounds, a short barrel with a flash hider */
const BURST = `<svg viewBox="0 0 66 30">${part("M3.6 11.2Q6 9.8 12 10H31.4Q35.4 10 37.4 12.8L40.4 18.6H6Q1.6 18.6 1.6 15V13.6Q1.6 12 3.6 11.2Z", OLIVE, 1.2)}${shine("M5 12H31", 0.3, 0.9)}<path d="M3.4 16.8H37.6" stroke="${OLIVE_D}" stroke-width="1.2" opacity=".8"/>
${part("M9.8 18.4H16L15.4 26Q15.2 27.2 14 27.2H11.6Q10.4 27.2 10.4 26Z", "#cfd8e6", 1.05)}<path d="M11 20H15" stroke="${INK}" stroke-width=".5" opacity=".5"/>${[21.4, 23.2, 25].map((y) => `<rect x="11.4" y="${y - 0.6}" width="3.4" height="1.2" rx=".4" fill="${BRASS}"/>`).join("")}
${part("M22.8 18.4H27.6L26.2 25.8Q25.8 27 24.6 26.8L22.8 26.4Q21.6 26 22 24.8Z", POLY, 1.1)}
<path d="M19.6 18.4Q18.2 28.6 26 28.4H33.6Q37.8 28.4 38.4 18.6" fill="none" stroke="${INK}" stroke-width="3"/><path d="M19.6 18.4Q18.2 28.6 26 28.4H33.6Q37.8 28.4 38.4 18.6" fill="none" stroke="${OLIVE}" stroke-width="1.4"/>
${part("M40.2 14.6H44L43.2 22.6Q43 23.6 42 23.6H41.4Q40.4 23.6 40.4 22.6Z", POLY, 1)}
${box(37, 11.4, 21, 3.6, 1, M2, 1)}${box(57.4, 10.6, 6.8, 5.2, 1, M0, 1)}<path d="M59.4 11.4V15M61.8 11.4V15" stroke="#0e0e14" stroke-width=".8"/>
${part("M17.4 10.2L19.4 7.6H30.6L32.6 10.2Z", OLIVE_D, 1)}${box(14.4, 2.2, 21, 6, 3, POLY, 1.15)}${part("M35 3.2L38.4 2.2V9.2L35 8.2Z", M0, 0.9)}<ellipse cx="38" cy="5.7" rx=".9" ry="2.8" fill="#7fd0ff" opacity=".9"/><path d="M14.8 5.2H13.2" stroke="${INK}" stroke-width="2.4"/>${shine("M17 3.6H33", 0.4, 0.8)}</svg>`;

/* a tile's picture: the weapon turned 45°, its grip down at the left, filling a square (as specials.js' iconOf); k
   zooms in (under 1: its far corners go past the square) or out. A light edge (css: .l4-gun) keeps the dark metal
   showing on the dark slots */
const iconOf = (svg, k = 1) => {
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),
    S = (+w + +h) * 0.72 * k;
  return svg
    .replace(/viewBox="[^"]+"/, `viewBox="0 0 ${S.toFixed(1)} ${S.toFixed(1)}"`)
    .replace(
      /^<svg ([^>]*)>/,
      `<svg class="l4-gun" $1><g transform="translate(${(S / 2).toFixed(1)} ${(S / 2).toFixed(1)}) rotate(-45) translate(${-w / 2} ${-h / 2})">`,
    )
    .replace(/<\/svg>$/, "</g></svg>");
};

/* every new gun: its picture in the hand, its icon, and how wide it is in the hand (duck sizes) */
export const GUNS = {
  sniper: { held: SNIPER, icon: iconOf(SNIPER, 0.8), w: 1.25 },
  smg: { held: SMG, icon: iconOf(SMG, 0.74), w: 0.74 }, // (an MP5: a little shorter than the UMP-45, as the real ones are)
  tommy: { held: TOMMY, icon: iconOf(TOMMY, 0.8), w: 0.92 }, // (almost the AK-47's size: the owner's, Nov 18 10:38Z)
  ump: { held: UMP, icon: iconOf(UMP, 0.78), w: 0.78 }, // (a little shorter than the Tommy gun, as the real ones are)
  ak: { held: AK, icon: iconOf(AK, 0.8), w: 1 },
  chaingun: { held: CHAINGUN, icon: iconOf(CHAINGUN, 0.8), w: 1.05 },
  revolver: { held: REVOLVER, icon: iconOf(REVOLVER, 0.72), w: 0.44 },
  glauncher: { held: LAUNCHER, icon: iconOf(LAUNCHER, 0.8), w: 0.9 },
  lmg: { held: LMG, icon: iconOf(LMG, 0.8), w: 1.2 },
  dbarrel: { held: DBARREL, icon: iconOf(DBARREL, 0.8), w: 1.15 },
  dbuck: { held: DBARREL, icon: iconOf(DBARREL, 0.8), w: 1.15 }, // (the buckshot double barrel: the same gun, its shells told apart by its color in the slot)
  flamer: { held: FLAMER, icon: iconOf(FLAMER, 0.8), w: 1.1 },
  burst: { held: BURST, icon: iconOf(BURST, 0.8), w: 0.85 },
  laser: { held: LASER(0), icon: iconOf(LASER(0), 0.8), w: 1.1 }, // (its barrel's heat: game.js draws LASER(heat))
  safekeep: { icon: HALO, w: 0.5 }, // (never in hand: only its picture)
  adrenaline: {
    held: ADRENALINE,
    icon: iconOf(ADRENALINE, 0.8),
    whole: iconOf(ADRENALINE, 1.06), // (the Speed Boost drop: the whole syringe, its corners in, as the owner asked)
    w: 0.44,
  },
};

/* the bullets, flying right (the screens turn them): the sniper's, a longer pistol bullet with a long streak; the
   SMG's, a small pointed one, not tiny (owner 2026-11-04 03:16Z), and cheap since many fly at once (no glow); the AK-47's, a pointed copper
   one; the revolver's, a big round-nosed slug; the LMG's, a tracer with a red streak. Each: its picture and how wide
   it shows (px) */
export const ROUNDS_ART = {
  sniper: {
    w: 56,
    svg: `<svg viewBox="0 0 48 10"><path d="M2 5h30" stroke="#ffd84a" stroke-width="2" opacity=".6"/><path d="M27 2.6h12.6q6 .2 8.2 2.4q-2.2 2.2-8.2 2.4H27Z" fill="#c9a24a" stroke="#5a4310" stroke-width="1"/><path d="M33 2.8v4.4" stroke="#5a4310" stroke-width=".7" opacity=".6"/></svg>`,
  },
  smg: {
    w: 22,
    svg: `<svg viewBox="0 0 20 8"><path d="M0 4h11" stroke="#ffd84a" stroke-width="1.8" opacity=".55"/><path d="M8 1.9h6.2q4 .3 5.4 2.1q-1.4 1.8-5.4 2.1H8Z" fill="#e0b04a" stroke="#6a4c12" stroke-width=".8"/></svg>`,
  },
  tommy: {
    w: 26,
    svg: `<svg viewBox="0 0 24 9"><path d="M0 4.5h12" stroke="#ffd84a" stroke-width="2" opacity=".55"/><path d="M9 2.2h7q4.4.3 6.4 2.3q-2 2-6.4 2.3H9Z" fill="#d9a54a" stroke="#6a4c12" stroke-width=".9"/></svg>`,
  },
  ump: {
    w: 24,
    svg: `<svg viewBox="0 0 22 9"><path d="M0 4.5h11" stroke="#ffd84a" stroke-width="1.9" opacity=".55"/><path d="M8 2.1h6.6q4 .3 5.8 2.4q-1.8 2-5.8 2.3H8Z" fill="#e0b04a" stroke="#6a4c12" stroke-width=".9"/></svg>`,
  },
  ak: {
    w: 30,
    svg: `<svg viewBox="0 0 28 10"><path d="M2 5h16" stroke="#ffd84a" stroke-width="2" opacity=".6"/><path d="M14 2.7h7q5 .4 6.6 2.3q-1.6 1.9-6.6 2.3h-7Z" fill="#c98a3a" stroke="#5a3510" stroke-width="1"/></svg>`,
  },
  revolver: {
    w: 30,
    svg: `<svg viewBox="0 0 26 12"><path d="M2 6h13" stroke="#ffd84a" stroke-width="2.4" opacity=".6"/><path d="M13 2.3h6.4a3.7 3.7 0 0 1 0 7.4H13Z" fill="#b87333" stroke="#4a2a10" stroke-width="1"/><path d="M15 3.4h3.6" stroke="#fff" stroke-width=".8" opacity=".45"/></svg>`,
  },
  slug: {
    w: 30,
    svg: `<svg viewBox="0 0 26 14"><path d="M1 7h14" stroke="#ffd84a" stroke-width="3" opacity=".6"/><path d="M12 2.4h7.6a4.6 4.6 0 0 1 0 9.2H12Z" fill="#8d929e" stroke="#33384a" stroke-width="1"/><path d="M14 4h4.6" stroke="#fff" stroke-width=".9" opacity=".5"/></svg>`,
  },
  burst: {
    w: 28,
    svg: `<svg viewBox="0 0 26 10"><path d="M2 5h14" stroke="#ffd84a" stroke-width="2" opacity=".6"/><path d="M12 2.8h7q5 .4 6.4 2.2q-1.4 1.8-6.4 2.2h-7Z" fill="#d9a24a" stroke="#5a3510" stroke-width="1"/></svg>`,
  },
  lmg: {
    w: 32,
    svg: `<svg viewBox="0 0 30 10"><path d="M1 5h19" stroke="#ff6a3d" stroke-width="2.4" opacity=".75"/><path d="M16 2.7h6.6q5 .4 6.6 2.3q-1.6 1.9-6.6 2.3H16Z" fill="#c98a3a" stroke="#5a3510" stroke-width="1"/><path d="M25.4 3.3q2.6.6 3.6 1.7q-1 1.1-3.6 1.7Z" fill="#ff5a1a"/></svg>`,
  },
};
/* the chain gun's shots: thin yellow lines from the barrel out to what each hit, flashing in and out */
export const TRACE = {
  color: "#ffe066",
  glow: "#ffb347",
  ms: 70, // each line's flash, in and out
  tip: [69.6, 13.4], // the barrel's end in the chain gun's drawing (viewBox 72 by 32)
  box: [72, 32],
  spread: 0.24, // radians: how far apart the extra lines can point
};
