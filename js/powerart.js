/* ---------- Dead Ducks Arcade: the power box and the Angel machine, drawn (the owner's plan, Nov 16) ----------
   Drawn as the Duck Cabin's props are (hangout/art.js): simple shapes in the ducks' ink, a little 3D (a lighter top, a
   darker front, a small shadow), no words on the world's things. The game turns everything into pixels.
   - powerBoxSVG: the box on the balcony with a bay for each of the four parts (an empty bay shows the part's dark
     shape, so you can tell what's missing), the light on top, and beside it the fuel sign (a pump and a gauge).
   - PART_ICONS (fuse, lever, tools, gas) and jerrySVG(pct): the parts and the jerry can as 40 × 40 icons, as the drops.
   - angelMachineSVG: the Angel machine on the stage, after the owner's picture, in greys (I wanted it not colored);
     working, its lamps and its hatch glow white-gold.
   - angelic(svg): any weapon's picture in its Angelic look (a dark crimson edge and glow, a small gold halo, two sparkles);
     angelOrbHTML(w): the dark crimson orb an Angelic weapon comes out of the machine as.
   Preview: tools/power-art.html */
import { weaponIcon } from "./l4ddart.js";

const O = "#1c1c28"; // the ducks' ink
const INK = "#2a2d38"; // the guns' and the drops' outline
/* the greys: the darkest, then lighter, to the tops */
const G0 = "#2f323b",
  G1 = "#474b56",
  G2 = "#5f6470",
  G3 = "#7b818e",
  G4 = "#9ca3ae",
  G5 = "#c0c5cd";
/* the Angel machine's white-gold, and the halo's gold */
const HOLY = "#fff3c4",
  GOLD = "#ffd86a",
  GOLD_D = "#c99a2e";
/* the glow round an Angelic weapon: dark crimson red (the owner's, Nov 16 21:47Z, instead of the white-gold) */
const CRIMSON = "#b0102a",
  CRIMSON_D = "#5e0412";
let N = 0;
const uid = () => "pw" + (++N).toString(36);
const n1 = (v) => Math.round(v * 10) / 10;
const ln = (w = 2.4, c = O) =>
  `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const R = (x, y, w, h, fill, more = "") =>
  `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="${fill}" ${more}/>`;
const shade = (cx, cy, rx, ry, o = 0.32) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${o}"/>`;
const shine = (d, o = 0.5, w = 1.2) =>
  `<path d="${d}" stroke="#fff" stroke-width="${w}" opacity="${o}" fill="none" stroke-linecap="round"/>`;
const wrap = (w, h, body, cls, defs = "") =>
  `<svg class="hg ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${defs ? "<defs>" + defs + "</defs>" : ""}${body}</svg>`;

/* ---------- the parts, each drawn in a 40 × 40 square ---------- */
/* the fuse: a glass cartridge lying a little tilted, brass caps at its ends, the wire inside */
const FUSE = `<g transform="rotate(-32 20 20)"><rect x="10.6" y="13.4" width="18.8" height="13.2" rx="2" fill="#bfe6ff" stroke="${INK}" stroke-width="1.8"/>
<path d="M12 20L15 17.6L18 22.4L21 17.6L24 22.4L27 18.6L28.4 20" fill="none" stroke="#e86a2a" stroke-width="1.5" stroke-linejoin="round"/>
<rect x="3.4" y="12" width="8.4" height="16" rx="1.6" fill="#e0a43a" stroke="${INK}" stroke-width="1.8"/><rect x="28.2" y="12" width="8.4" height="16" rx="1.6" fill="#e0a43a" stroke="${INK}" stroke-width="1.8"/>
<path d="M6.2 12.8V27.2M31 12.8V27.2" stroke="#b77d26" stroke-width="1.4"/>${shine("M13 15.4H27", 0.8, 1.6)}${shine("M5 14.6V20", 0.6, 1.2)}</g>`;
/* the lever: a knife switch's handle, a red grip on a steel arm, its hinge block at the foot */
const LEVER = `<path d="M10.6 31L27.4 9.6" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M10.6 31L27.4 9.6" stroke="#b9bfc9" stroke-width="3" stroke-linecap="round"/>
<g transform="rotate(-52 29 8)"><rect x="21.6" y="3.4" width="15" height="9.4" rx="4.4" fill="#e0463d" stroke="${INK}" stroke-width="1.8"/>${shine("M24.4 5.8H33", 0.6, 1.4)}</g>
<rect x="4.4" y="28.4" width="15.6" height="8.6" rx="1.8" fill="#4a4f5c" stroke="${INK}" stroke-width="1.8"/><circle cx="10.8" cy="31" r="2.4" fill="#d6dbe2" stroke="${INK}" stroke-width="1.2"/>${shine("M6.4 30.4H9", 0.4, 1.2)}`;
/* the tool box: a red metal box, its handle on top, a latch, a wrench sticking out of the lid */
const TOOLS = `<path d="M24 12.6L30.6 3.4" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M24 12.6L30.6 3.4" stroke="#b9bfc9" stroke-width="2.4" stroke-linecap="round"/><path d="M28.2 2.6Q33.4 .6 34 4.6L31.4 5.4L32 7.4Q28.4 8.6 28.2 2.6Z" fill="#b9bfc9" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M13 13V9.4Q13 7.4 15 7.4H21Q23 7.4 23 9.4V13" fill="none" stroke="${INK}" stroke-width="4.2"/><path d="M13 13V9.4Q13 7.4 15 7.4H21Q23 7.4 23 9.4V13" fill="none" stroke="#4a4f5c" stroke-width="1.8"/>
<rect x="3.4" y="12.4" width="33.2" height="9" rx="1.6" fill="#e0463d" stroke="${INK}" stroke-width="1.8"/><rect x="3.4" y="20.6" width="33.2" height="15" rx="1.6" fill="#c8352d" stroke="${INK}" stroke-width="1.8"/>
<rect x="16.4" y="18.4" width="7.2" height="5.6" rx="1" fill="#d6dbe2" stroke="${INK}" stroke-width="1.3"/><path d="M6 31.6H34" stroke="#7e1a15" stroke-width="1.2" opacity=".6"/>${shine("M6 14.6H33.6", 0.45, 1.3)}`;
/* the gas can: a red plastic can, its carry handle, the yellow spout, the gas showing through a window on its side */
const GAS = `<path d="M26.6 9.6L33.6 3.8" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M26.6 9.6L33.6 3.8" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>
<path d="M7.4 9.6Q7.4 6.6 10.4 6.6H25Q31 6.6 31 12.6V33Q31 36.2 27.8 36.2H10.4Q7.4 36.2 7.4 33Z" fill="#e0463d" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M11.4 6.8V3.4H22.4V6.8" fill="none" stroke="${INK}" stroke-width="4.2"/><path d="M11.4 6.8V3.4H22.4V6.8" fill="none" stroke="#c8352d" stroke-width="1.8"/>
<rect x="11.4" y="15" width="5" height="17" rx="1.4" fill="#5a1410" stroke="${INK}" stroke-width="1.2"/><rect x="11.8" y="22.4" width="4.2" height="9.2" rx="1" fill="#ffc94a"/>
<path d="M20.4 13.6V31.6M25.4 13.6V31.6" stroke="#9e211b" stroke-width="1.6" opacity=".7"/>${shine("M9.8 10.4V30", 0.4, 1.4)}`;
/* the four parts as 40 × 40 icons: the bar at the middle left, the floor, the shop */
export const PART_ICONS = Object.fromEntries(
  Object.entries({ fuse: FUSE, lever: LEVER, tools: TOOLS, gas: GAS }).map(
    ([k, v]) => [k, `<svg viewBox="0 0 40 40">${v}</svg>`],
  ),
);
const PART_ART = { fuse: FUSE, lever: LEVER, tools: TOOLS, gas: GAS };

/* the jerry can: a steel army can, its three handles, the X pressed into its side; its fuel shows on the gauge strip
   at its side and in percent on the tag across its foot (the owner wanted the percent on it) */
export function jerrySVG(pct = 100) {
  const p = Math.max(0, Math.min(100, Math.round(pct))),
    lv = 8.6 + (24 * (100 - p)) / 100;
  return `<svg viewBox="0 0 40 40"><path d="M23.4 4.6L27.6 1.4Q30 .2 30.4 2.6L30.6 5.6" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M23.4 4.6L27.6 1.4Q30 .2 30.4 2.6L30.6 5.6" fill="none" stroke="#9ca3ae" stroke-width="1.2" stroke-linecap="round"/>
<path d="M9.4 8.4Q9.4 5.4 12.4 5.4H27.6Q32.6 5.4 32.6 10.4V31.4Q32.6 34.4 29.6 34.4H12.4Q9.4 34.4 9.4 31.4Z" fill="#5d6b3a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M12.4 5.4V2.6H22.6V5.4" fill="none" stroke="${INK}" stroke-width="3.6"/><path d="M14.6 3.6H20.4" stroke="#4a5530" stroke-width="1.6"/>
<path d="M14.4 11.6L29.6 30M29.6 11.6L14.4 30" stroke="#4a5530" stroke-width="2.6" stroke-linecap="round"/><path d="M14.4 11.6L29.6 30M29.6 11.6L14.4 30" stroke="#7a8a4c" stroke-width="1" stroke-linecap="round" opacity=".8"/>
<rect x="3.4" y="8.6" width="4.4" height="24" rx="1.4" fill="#14161c" stroke="${INK}" stroke-width="1.2"/><rect x="3.9" y="${n1(lv)}" width="3.4" height="${n1(32.6 - lv)}" rx=".8" fill="#ffc94a"/>${shine("M12 9V29", 0.35, 1.3)}
<rect x="11.2" y="27.6" width="25.6" height="11" rx="3" fill="#14161c" stroke="#fff3c4" stroke-width="1.1"/><text x="24" y="36.4" text-anchor="middle" font-family="Jersey 15, monospace" font-size="10.4" fill="#fff">${p}%</text></svg>`;
}

/* ---------- the power box ---------- */
/* a part's dark shape, for its bay while it's still missing */
const ghostDef = (id) =>
  `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-color="#0b0c10" flood-opacity=".75"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
/* the box on the balcony, flat against the cabin wall: a grey metal cabinet on a plinth, its top a little lighter; on
   its front four bays (fuse, lever, tool box, gas), the light over them (red off, green on) and a vent; on its left
   the fuel sign on a post: a gas pump and a gauge whose needle shows the fuel left. parts: the fitted ones; on: the
   power's on; fuel: 0 (empty) to 1 (a full can, 12 rounds). Foot: y = h − 8 */
export function powerBoxSVG({
  w = 96,
  h = 150,
  parts = [],
  on = false,
  fuel = 0,
} = {}) {
  const gh = uid(),
    gl = uid(),
    b = h - 8,
    x0 = 30,
    x1 = w - 4,
    top = b - 102,
    face = top + 12;
  const has = new Set(parts);
  let s = shade((x0 + x1) / 2 - 6, b, (x1 - x0) / 2 + 14, 6);
  /* the plinth, the cabinet's top and its front */
  s +=
    R(x0 - 2, b - 8, x1 - x0 + 4, 10, G1, `rx="2" ${ln(2)}`) +
    `<path d="M${x0} ${face}L${x0 + 4} ${top}H${x1 - 4}L${x1} ${face}Z" fill="${G4}" ${ln(2.2)}/>` +
    R(x0, face, x1 - x0, b - 8 - face, G3, `rx="3" ${ln(2.6)}`) +
    R(
      x0 + 4,
      face + 3,
      x1 - x0 - 8,
      b - 8 - face - 6,
      "none",
      `rx="2" stroke="${G2}" stroke-width="2"`,
    ) +
    shine(`M${x0 + 6} ${face + 5}H${x1 - 8}`, 0.25, 1.6);
  /* the light (green on, red off) and the vent */
  const lx = x0 + 12,
    ly = face + 11;
  s +=
    (on
      ? `<circle cx="${lx}" cy="${ly}" r="9" fill="url(#${gl})"/><circle cx="${lx}" cy="${ly}" r="4.6" fill="#3fd46b" ${ln(1.6)}/>`
      : `<circle cx="${lx}" cy="${ly}" r="4.6" fill="#ef3b3b" ${ln(1.6)}/>`) +
    `<path d="M${x0 + 26} ${ly - 4}H${x1 - 10}M${x0 + 26} ${ly}H${x1 - 10}M${x0 + 26} ${ly + 4}H${x1 - 10}" stroke="${G1}" stroke-width="2" stroke-linecap="round"/>`;
  /* the bays, two by two: each a dark recess with the part (or its dark shape) in it */
  const bw = (x1 - x0 - 14) / 2,
    bh = (b - 8 - face - 30) / 2;
  ["fuse", "lever", "tools", "gas"].forEach((k, i) => {
    const bx = x0 + 5 + (i % 2) * (bw + 4),
      by = face + 23 + Math.floor(i / 2) * (bh + 4),
      sz = Math.min(bw, bh) - 3;
    s +=
      R(bx, by, bw, bh, has.has(k) ? G1 : G0, `rx="2" ${ln(1.8)}`) +
      `<path d="M${bx + 2} ${by + 2.4}H${bx + bw - 2}" stroke="#000" stroke-width="2" opacity=".35"/>` +
      `<g transform="translate(${n1(bx + (bw - sz) / 2)} ${n1(by + (bh - sz) / 2)}) scale(${n1(sz / 40)})"${has.has(k) ? "" : ` filter="url(#${gh})" opacity=".9"`}>${PART_ART[k]}</g>`;
  });
  /* the fuel sign on its post: a yellow plate, a gas pump, and the gauge (empty at the left, full at the right) */
  const sx = 3,
    sy = top + 2,
    sw = 24,
    gx = sx + sw / 2,
    gy = sy + 29,
    a = Math.PI * (1 - Math.max(0, Math.min(1, fuel)));
  s +=
    R(gx - 2.5, sy + 30, 5, b - sy - 30, "#6e4424", ln(1.8)) +
    R(sx, sy, sw, 38, "#f2b33d", `rx="3" ${ln(2.2)}`) +
    R(sx + 6, sy + 4, 9, 12, O, 'rx="1.4"') +
    R(sx + 7.6, sy + 5.6, 5.8, 4, "#f2b33d", 'rx=".6"') +
    `<path d="M${sx + 15} ${sy + 6}H${sx + 18}V${sy + 14}Q${sx + 18} ${sy + 16} ${sx + 16.4} ${sy + 15}" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="M${gx - 9} ${gy}A9 9 0 0 1 ${gx + 9} ${gy}Z" fill="#14161c" stroke="${O}" stroke-width="1.4"/>` +
    `<path d="M${gx - 7} ${gy - 1}A7 7 0 0 1 ${gx - 3.4} ${gy - 6.2}" fill="none" stroke="#ef3b3b" stroke-width="2"/><path d="M${gx + 3.4} ${gy - 6.2}A7 7 0 0 1 ${gx + 7} ${gy - 1}" fill="none" stroke="#3fd46b" stroke-width="2"/>` +
    `<path d="M${gx} ${gy}L${n1(gx + Math.cos(a) * 7.4)} ${n1(gy - Math.sin(a) * 7.4)}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="${gx}" cy="${gy}" r="1.6" fill="#fff"/>`;
  return wrap(
    w,
    h,
    s,
    "pw-box" + (on ? " pw-on" : ""),
    ghostDef(gh) +
      `<radialGradient id="${gl}"><stop offset="0" stop-color="#3fd46b" stop-opacity=".7"/><stop offset="1" stop-color="#3fd46b" stop-opacity="0"/></radialGradient>`,
  );
}

/* ---------- the Angel machine ---------- */
/* the stage's machine, after the owner's picture but in greys: a wide base; a tall column with a head (its round eye on
   top, a panel of three lamps, a rod through it); the flywheel at the left on its belt; a coil spring up to the cage at
   the right, where the motor turns, a tank on its roof with its pipe and a ball arm; a drum on the right side; and in
   front the body with the hatch the weapon goes into, and its buttons. working: the lamps and the hatch glow
   white-gold and the glow pulses (hg-flicker, under html.moving); the sparks and the smoke are fx.js'. Foot: y = h − 8 */
export function angelMachineSVG({ w = 130, h = 150, working = false } = {}) {
  const glow = uid(),
    hatch = uid(),
    b = h - 8,
    k = (h - 8) / 142, // (drawn for h 150; taller or shorter stretches it up and down)
    Y = (v) => n1(b - (142 - v) * k);
  const lamp = working ? HOLY : G1,
    lit = (cx, cy, r) =>
      `<circle cx="${cx}" cy="${Y(cy)}" r="${r}" fill="${lamp}" ${ln(1.4)}/>` +
      (working
        ? ""
        : `<circle cx="${cx - r * 0.3}" cy="${Y(cy) - r * 0.3}" r="${r * 0.35}" fill="${G3}"/>`);
  let s = shade(w / 2, b, w / 2 - 4, 7);
  /* the glow behind it while it works */
  if (working)
    s += `<ellipse class="hg-flicker" cx="${w * 0.48}" cy="${Y(84)}" rx="${w * 0.58}" ry="${Y(142) - Y(30)}" fill="url(#${glow})"/>`;
  /* the base: its top a little lighter, its front */
  s +=
    `<path d="M6 ${Y(122)}L10 ${Y(112)}H${w - 10}L${w - 6} ${Y(122)}Z" fill="${G4}" ${ln(2.2)}/>` +
    R(6, Y(122), w - 12, Y(142) - Y(122), G2, `rx="3" ${ln(2.4)}`) +
    R(4, Y(136), w - 8, Y(142) - Y(136) + 2, G0, `rx="2" ${ln(2)}`) +
    `<circle cx="${w - 34}" cy="${Y(129)}" r="2.6" fill="${G0}"/><circle cx="${w - 20}" cy="${Y(129)}" r="2.6" fill="${G0}"/>`;
  /* the cage at the right: its back posts, the motor (ribbed) inside, its shelf, the front posts */
  const cx0 = 72,
    cx1 = 112;
  s +=
    R(cx0, Y(46), cx1 - cx0, Y(112) - Y(46), G0, ln(2)) +
    R(cx0 + 4, Y(68), cx1 - cx0 - 4, Y(90) - Y(68), G2, `rx="8" ${ln(2)}`) +
    [0, 1, 2, 3, 4, 5]
      .map(
        (i) =>
          `<path d="M${cx0 + 9 + i * 4.6} ${Y(70)}V${Y(88)}" stroke="${G1}" stroke-width="1.8"/>`,
      )
      .join("") +
    shine(`M${cx0 + 8} ${Y(71)}H${cx1 - 6}`, 0.25, 1.4) +
    R(cx0, Y(96), cx1 - cx0, 4, G3, ln(1.6)) +
    R(cx0 - 2, Y(44), 6, Y(112) - Y(44), G4, `rx="1.4" ${ln(2)}`) +
    R(cx1 - 4, Y(44), 6, Y(112) - Y(44), G4, `rx="1.4" ${ln(2)}`) +
    R(cx0 - 3, Y(44) - 2, cx1 - cx0 + 6, 7, G4, `rx="1.4" ${ln(2)}`);
  /* the drum on its right side, and its foot */
  s +=
    `<path d="M${cx1 + 2} ${Y(98)}L${cx1 + 8} ${Y(112)}" stroke="${O}" stroke-width="2.4"/>` +
    R(cx1 + 1, Y(62), 13, Y(96) - Y(62), G3, `rx="6" ${ln(2.2)}`) +
    R(cx1 + 9, Y(72), 9, Y(86) - Y(72), G1, `rx="3" ${ln(2)}`);
  /* the tank on the cage's roof, its pipe, the arm with its ball */
  s +=
    `<path d="M84 ${Y(26)}V${Y(14)}H98V${Y(24)}" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M84 ${Y(26)}V${Y(14)}H98V${Y(24)}" fill="none" stroke="${G4}" stroke-width="2.4" stroke-linejoin="round"/>` +
    R(78, Y(26), 26, Y(44) - Y(26), G3, `rx="2" ${ln(2.2)}`) +
    R(76, Y(37), 30, Y(44) - Y(37) + 1, G2, `rx="1.4" ${ln(2)}`) +
    shine(`M81 ${Y(29)}H100`, 0.3, 1.4) +
    `<path d="M104 ${Y(31)}H${w - 8}" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M104 ${Y(31)}H${w - 8}" stroke="${G4}" stroke-width="1.8" stroke-linecap="round"/>` +
    lit(w - 7, 31, 3.6);
  /* the coil spring from the column's head up to the tank */
  s +=
    [0, 1, 2, 3, 4, 5]
      .map(
        (i) =>
          `<ellipse cx="69" cy="${Y(34 + i * 4.4)}" rx="4.4" ry="1.8" fill="none" stroke="${O}" stroke-width="2.6"/><ellipse cx="69" cy="${Y(34 + i * 4.4)}" rx="4.4" ry="1.8" fill="none" stroke="${G4}" stroke-width="1.1"/>`,
      )
      .join("") +
    `<path d="M69 ${Y(32)}H78" stroke="${O}" stroke-width="2.6"/>`;
  /* the column, its cap, the head with its eye, its three lamps and the rod through it */
  s +=
    R(32, Y(22), 30, Y(112) - Y(22), G3, ln(2.4)) +
    R(32, Y(22), 8, Y(112) - Y(22), G4, 'opacity=".5"') +
    `<path d="M30 ${Y(22)}L35 ${Y(12)}H59L64 ${Y(22)}Z" fill="${G4}" ${ln(2.2)}/>` +
    `<path d="M16 ${Y(56)}H78" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M16 ${Y(56)}H78" stroke="${G5}" stroke-width="2.2" stroke-linecap="round"/>` +
    R(24, Y(40), 46, Y(74) - Y(40), G4, `rx="5" ${ln(2.4)}`) +
    R(28, Y(62), 38, Y(71) - Y(62), G1, `rx="2" ${ln(1.8)}`) +
    lit(37, 66.5, 2.8) +
    lit(47, 66.5, 2.8) +
    lit(57, 66.5, 2.8) +
    shine(`M28 ${Y(44)}H54`, 0.35, 1.4) +
    `<circle cx="47" cy="${Y(36)}" r="8.4" fill="${G5}" ${ln(2.2)}/><circle cx="47" cy="${Y(36)}" r="4" fill="${working ? HOLY : G0}" ${ln(1.6)}/>` +
    (working ? "" : `<circle cx="45.8" cy="${Y(34.8)}" r="1.4" fill="${G4}"/>`);
  /* the flywheel at the left, its spokes, its hub, and the belt into the column */
  const fx = 19,
    fy = Y(86),
    fr = 15;
  s +=
    `<path d="M${fx} ${fy - 3}H66V${fy + 3}H${fx}Z" fill="${G2}" ${ln(2)}/>` +
    `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="none" stroke="${O}" stroke-width="6.4"/><circle cx="${fx}" cy="${fy}" r="${fr}" fill="none" stroke="${G4}" stroke-width="3.2"/>` +
    [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const a = (i * Math.PI) / 3 + 0.3;
        return `<path d="M${fx} ${fy}L${n1(fx + Math.cos(a) * (fr - 2))} ${n1(fy + Math.sin(a) * (fr - 2))}" stroke="${O}" stroke-width="3.6"/><path d="M${fx} ${fy}L${n1(fx + Math.cos(a) * (fr - 2))} ${n1(fy + Math.sin(a) * (fr - 2))}" stroke="${G3}" stroke-width="1.6"/>`;
      })
      .join("") +
    `<circle cx="${fx}" cy="${fy}" r="5" fill="${G5}" ${ln(2)}/><circle cx="${fx}" cy="${fy}" r="2" fill="${G0}"/>` +
    shine(
      `M${fx - 11} ${fy - 8}Q${fx - 6} ${fy - 13} ${fx} ${fy - 13.4}`,
      0.4,
      1.4,
    );
  /* the box at the left of the base with its slots */
  s +=
    R(8, Y(102), 30, Y(122) - Y(102), G2, `rx="1.6" ${ln(2)}`) +
    [0, 1, 2, 3]
      .map((i) => R(12.4 + i * 6.4, Y(106), 3, Y(119) - Y(106), G0, 'rx="1"'))
      .join("");
  /* the body in front, its hatch (where the weapon goes in) and its buttons */
  s +=
    `<path d="M40 ${Y(98)}Q40 ${Y(92)} 46 ${Y(92)}H96Q100 ${Y(92)} 100 ${Y(98)}V${Y(124)}H40Z" fill="${G3}" ${ln(2.4)}/>` +
    shine(`M46 ${Y(95)}H94`, 0.3, 1.4) +
    R(
      48,
      Y(98),
      26,
      Y(121) - Y(98),
      working ? `url(#${hatch})` : G0,
      `rx="3" ${ln(2)}`,
    ) +
    [0, 1, 2, 3, 4]
      .map(
        (i) =>
          `<path d="M52 ${Y(102 + i * 3.8)}H70" stroke="${working ? GOLD_D : G2}" stroke-width="1.6" stroke-linecap="round"/>`,
      )
      .join("") +
    lit(85, 101, 3) +
    `<circle cx="85" cy="${Y(110)}" r="3" fill="${G1}" ${ln(1.4)}/><circle cx="92.4" cy="${Y(116)}" r="2" fill="${G1}" ${ln(1.2)}/><circle cx="85" cy="${Y(117.4)}" r="2" fill="${G1}" ${ln(1.2)}/>`;
  if (working)
    s += `<rect class="hg-flicker" x="46" y="${Y(96)}" width="30" height="${Y(123) - Y(96)}" rx="5" fill="none" stroke="${HOLY}" stroke-width="2.4" opacity=".75"/>`;
  return wrap(
    w,
    h,
    s,
    "pw-angel" + (working ? " pw-working" : ""),
    `<radialGradient id="${glow}"><stop offset="0" stop-color="${HOLY}" stop-opacity=".55"/><stop offset=".5" stop-color="${GOLD}" stop-opacity=".2"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${hatch}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="${HOLY}"/><stop offset="1" stop-color="${GOLD}"/></linearGradient>`,
  );
}

/* ---------- the Angelic look ---------- */
/* a four-pointed sparkle */
const star = (x, y, r) =>
  `<path d="M${n1(x)} ${n1(y - r)}Q${n1(x + r * 0.2)} ${n1(y - r * 0.2)} ${n1(x + r)} ${n1(y)}Q${n1(x + r * 0.2)} ${n1(y + r * 0.2)} ${n1(x)} ${n1(y + r)}Q${n1(x - r * 0.2)} ${n1(y + r * 0.2)} ${n1(x - r)} ${n1(y)}Q${n1(x - r * 0.2)} ${n1(y - r * 0.2)} ${n1(x)} ${n1(y - r)}Z" fill="#fff" stroke="${GOLD_D}" stroke-width="${n1(r * 0.16)}"/>`;
/* any weapon's picture (held or icon) made Angelic: a dark crimson edge round it and a small crimson glow (much smaller,
   fewer pixels: the owner, Nov 17; css .angelic breathes it softly), a see-through gold halo over its middle and two
   sparkles. The picture keeps its width and its middle (the room for the halo is added above and
   below alike), so it sits in the hand and in its slot as before */
export function angelic(svg) {
  const m = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!m) return svg;
  const [x, y, w, h] = m.slice(1).map(Number),
    sq = Math.abs(w - h) < 1, // (an icon: a square, its weapon turned 45°)
    e = sq ? 0 : Math.max(h * 0.4, w * 0.1),
    id = uid(),
    u = Math.min(w, h + 2 * e) / 40, // (the halo's and the sparkles' size, against a 40 square)
    hx = x + w * (sq ? 0.5 : 0.68),
    hy = sq ? y + h * 0.12 : y - e * 0.45;
  const defs = `<filter id="${id}" x="-20%" y="-30%" width="140%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="${n1(Math.max(0.6, u * 0.8))}" result="d"/><feFlood flood-color="${CRIMSON_D}"/><feComposite in2="d" operator="in" result="edge"/><feGaussianBlur in="d" stdDeviation="${n1(Math.max(0.6, u * 1))}" result="b"/><feFlood flood-color="${CRIMSON}" flood-opacity=".7"/><feComposite in2="b" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const halo =
    `<g opacity=".55"><ellipse cx="${n1(hx)}" cy="${n1(hy)}" rx="${n1(u * 7)}" ry="${n1(u * 2.4)}" fill="none" stroke="${GOLD_D}" stroke-width="${n1(u * 3)}"/>` +
    `<ellipse cx="${n1(hx)}" cy="${n1(hy)}" rx="${n1(u * 7)}" ry="${n1(u * 2.4)}" fill="none" stroke="${GOLD}" stroke-width="${n1(u * 1.6)}"/></g>`;
  const sparks = sq
    ? star(x + w * 0.82, y + h * 0.2, u * 3.4) +
      star(x + w * 0.18, y + h * 0.62, u * 2.4)
    : star(x + w * 0.9, y + h * 0.05, u * 3.4) +
      star(x + w * 0.12, y + h + e * 0.15, u * 2.6);
  return svg
    .replace(m[0], `viewBox="${n1(x)} ${n1(y - e)} ${n1(w)} ${n1(h + 2 * e)}"`)
    .replace(
      /^<svg([^>]*)>/,
      (t, a) =>
        `<svg${a.includes("class=") ? a.replace(/class="/, 'class="angelic ') : a + ' class="angelic"'}><defs>${defs}</defs>${halo}<g filter="url(#${id})">`,
    )
    .replace(/<\/svg>$/, `</g>${sparks}</svg>`);
}
/* the orb an Angelic weapon comes out of the machine as: a dark crimson orb (css .l4orb.k-angel) with its gold halo, the
   weapon's icon inside in its Angelic look */
export const angelOrbHTML = (w) =>
  `<span class="l4orb k-angel"><i>${angelic(weaponIcon(w))}</i></span>`;
