/* ---------- outfits ----------
   An outfit is cloth over the duck's body (never its head), drawn before the duck's shading so it reads as part of
   the toy, plus what sits on top: collars, ties, buttons, trims. The wing becomes a sleeve (or stays bare for a tank
   top). A few reach past the body's outline: a flared skirt, a cardboard box, cloud puffs, a hood behind the head.
   Colors that can change are listed like a hat's (c1, c2) and show under Colors.
   The duck faces right: its chest is the right edge of the body under the head (x 84–100, y 60–96); its waist is about
   y 86; the tail is up at the left. */
import { mix } from './duck.js';

const dk = (c, t = .3) => mix(c, 0, t), lt = (c, t = .35) => mix(c, 255, t);
/* cloth: everything below the head, the top part (above the waist) or the bottom part (below it) */
const ALL = c => `<rect width="120" height="120" fill="${c}"/>`;
const TOP = (c, y = 86) => `<rect width="120" height="${y}" fill="${c}"/>`;
const LOW = (c, y = 86) => `<rect y="${y}" width="120" height="${120 - y}" fill="${c}"/>`;
/* the wing as a sleeve: the wing's shape in the cloth's color, with a cuff at its tip */
const WING_D = 'M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z';
const sleeve = (c, cuff = '') => `<path d="${WING_D}" fill="${dk(c, .12)}" stroke="${dk(c, .45)}" stroke-width="1.2"/>
  <path d="M43 78C51 73 66 73 73 79" stroke="${lt(c, .3)}" stroke-width="1.4" fill="none" opacity=".6"/>${cuff ? `<path d="M43.6 78.4C41.8 81 41.8 84.2 43.6 86.8" stroke="${cuff}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : ''}`;
/* the parts at the neck and chest */
const shirtV = (c = '#fbfbf7') => `<path d="M80 58L102 58L102 90L97 90Z" fill="${c}"/>`;
const lapels = c => `<path d="M79 58L94 90L97.5 90L85 58Z" fill="${dk(c, .25)}"/><path d="M79 58L94 90" stroke="${lt(c, .25)}" stroke-width=".8"/>`;
const tie = c => `<path d="M96 66.4L99.6 66.4L101.4 85L98.6 90L95.4 85.4Z" fill="${c}"/><path d="M95.2 61.4H100.4L99.6 66.6H96Z" fill="${dk(c, .22)}"/><path d="M97.4 68L99.4 84" stroke="${lt(c, .3)}" stroke-width=".8" opacity=".7"/>`;
const bowtie = c => `<path d="M90.6 61L95.4 64L90.6 67Z" fill="${c}"/><path d="M101.4 61L96.6 64L101.4 67Z" fill="${c}"/><circle cx="96" cy="64" r="1.7" fill="${dk(c, .3)}"/>`;
const buttons = (c, xs = [[91, 72], [92.5, 80], [93.5, 88]]) => xs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.25" fill="${c}"/>`).join('');
const collarBand = (c, w = 3.4) => `<path d="M58 59.5C68 66 86 66.5 95 59.5" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
/* the Roman collar: a black band round the neck under the head (an arc round the head's middle; the body and the head
   hide what isn't neck), its lower edge picked out, and the white tab at its front, on the throat, where only its near
   half shows (as the suit's tie) */
const neck = (a0, a1, r = 25.3) => { const p = a => `${(76 + r * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(40 + r * Math.sin(a * Math.PI / 180)).toFixed(1)}`; return `M${p(a0)}A${r} ${r} 0 0 0 ${p(a1)}`; };
const romanCollar = () => `<path d="${neck(150, 30, 25.6)}" stroke="#08080b" stroke-width="5.6" fill="none"/><path d="${neck(150, 30, 28.4)}" stroke="#4a4a56" stroke-width="1" fill="none"/>
  <path d="${neck(80, 26, 25.6)}" stroke="#fdfdf9" stroke-width="5.6" fill="none"/><path d="${neck(80, 26, 28.4)}" stroke="#bdbdb4" stroke-width="1" fill="none"/>`;
/* the leather jacket's parts: a zip (dark tape, silver teeth) and its pull; the centre-front zip runs on the body's own
   front edge (from the neck to the hem at y 94), so only its near half shows, set in from the outline */
const FRONT = 'M88 60C96 64 101 72 100 82C99.4 86.8 97.5 90.9 94.6 94.2';
const zipLine = (d, w = 1) => `<path d="${d}" stroke="#0d0d10" stroke-width="${(2.8 * w).toFixed(2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#c9ccd2" stroke-width="${(1.3 * w).toFixed(2)}" fill="none" stroke-dasharray=".6 .55"/>`;
const pull = (x, y, a = 0, k = 1) => `<rect x="${x - .8 * k}" y="${y}" width="${1.6 * k}" height="${3.4 * k}" rx="${.6 * k}" fill="#c9ccd2" stroke="#6b7078" stroke-width=".4" transform="rotate(${a} ${x} ${y})"/>`;
const belt = (c, buckle = '#d9b44a', y = 86) => `<rect y="${y - 2}" width="120" height="4" fill="${c}"/><rect x="94" y="${y - 2.6}" width="5" height="5.2" rx="1" fill="none" stroke="${buckle}" stroke-width="1.3"/>`;
const cross = (x, y, c = '#e2b93b', k = 1) => `<path d="M${x} ${y - 4 * k}V${y + 5 * k}M${x - 2.8 * k} ${y - 1.4 * k}H${x + 2.8 * k}" stroke="${c}" stroke-width="${1.5 * k}" stroke-linecap="round"/>`;
const chain = (c = '#e2b93b') => `<path d="M64 62C72 70 86 74 92 72" stroke="${c}" stroke-width=".9" fill="none" stroke-dasharray="1.2 .8"/>`;
const sparkle = (x, y, r = 1.6, c = '#fff') => `<path d="M${x} ${y - r * 2}L${x + r * .5} ${y - r * .5}L${x + r * 2} ${y}L${x + r * .5} ${y + r * .5}L${x} ${y + r * 2}L${x - r * .5} ${y + r * .5}L${x - r * 2} ${y}L${x - r * .5} ${y - r * .5}Z" fill="${c}"/>`;
const dots = (c, r = 1.1, step = 8, y0 = 58, y1 = 110) => { let s = ''; for (let y = y0; y < y1; y += step) for (let x = 8 + (((y - y0) / step) % 2) * step / 2; x < 104; x += step) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`; return s; };
const STAR = (x, y, r, c) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; d += `${i ? 'L' : 'M'}${(x + q * Math.cos(a)).toFixed(1)} ${(y + q * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="${c}"/>`; };
const flower = (x, y, r, c, mid = '#ffd23f') => `<g>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${(x + r * .55 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + r * .55 * Math.sin(a * Math.PI / 180)).toFixed(1)}" rx="${(r * .5).toFixed(1)}" ry="${(r * .32).toFixed(1)}" transform="rotate(${a} ${(x + r * .55 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(y + r * .55 * Math.sin(a * Math.PI / 180)).toFixed(1)})" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y}" r="${(r * .2).toFixed(1)}" fill="${mid}"/></g>`;
const leaf = (x, y, a, c) => `<path d="M${x} ${y}c3-4 8-4 11 0c-3 4-8 4-11 0Z" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`;
const num33 = (x, y, fill, edge, k = 1) => `<text x="${x}" y="${y}" font-family="'Lilita One', 'Fredoka', sans-serif" font-size="${16 * k}" text-anchor="middle" fill="${fill}" stroke="${edge}" stroke-width="${1.6 * k}" paint-order="stroke fill">33</text>`;
/* a jersey's front: the team name arched over the number, small on the chest (right of the wing, under the head, so
   neither covers them); class jm, so a duck drawn too small for them to read leaves them out */
let arcN = 0;
const chest = (name, fill, edge) => { const id = 'jma' + (++arcN); return `<g class="jm"><path id="${id}" d="M80.5 75.5Q87.5 70.5 94.5 75.5" fill="none"/>`
  + `<text font-family="'Fredoka', sans-serif" font-weight="700" font-size="3.6" fill="${fill}" letter-spacing=".15"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${name}</textPath></text>`
  + num33(87.5, 85, fill, edge, .58) + '</g>'; };
/* past the outline: a skirt that flares at the hem */
const flare = (c, y = 92, out = 5) => `<path d="M${18 - out} ${y + 14}C${30} ${y + 4} ${88} ${y + 2} ${100 + out} ${y + 10}L${101 + out} ${y + 15}C${70} ${y + 20} ${40} ${y + 20} ${17 - out} ${y + 15}Z" fill="${c}" stroke="${dk(c, .4)}" stroke-width="1.2"/>`;

/* each outfit: { id, name, tip, colors, opts, cloth(o), sleeve(o), over(o), back(o), bare, low } (o: the outfit with its
   colors and options; opts: [key, [[value, label], …]], the first the default, picked under the outfit's tile; low:
   cloth below the waist only, so the bare body above keeps its highlights) */
export const OUTFITS = [
  { id: 'suit', name: 'Suit and tie', colors: [['c1', 'Suit', '#2b2f3a'], ['c2', 'Tie', '#c8102e']],
    cloth: o => ALL(o.c1) + shirtV() + lapels(o.c1) + tie(o.c2) + buttons(dk(o.c1, .5), [[90, 84], [90.8, 92]]), sleeve: o => sleeve(o.c1, '#fbfbf7') },
  { id: 'tux', name: 'Suit and bow tie', colors: [['c1', 'Suit', '#18181f'], ['c2', 'Bow tie', '#18181f']],
    cloth: o => ALL(o.c1) + shirtV() + lapels(o.c1) + buttons('#888', [[98.6, 72], [99.2, 77], [99.6, 82]]) + bowtie(o.c2), sleeve: o => sleeve(o.c1, '#fbfbf7') },
  { id: 'dress', name: 'Dress', colors: [['c1', 'Dress', '#e0457b']],
    cloth: o => ALL(o.c1) + `<path d="M0 84H120V87H0Z" fill="${dk(o.c1, .25)}"/><path d="M84 60C88 66 96 67 100 62" fill="none" stroke="${lt(o.c1, .5)}" stroke-width="1.6"/>` + `<g stroke="${dk(o.c1, .2)}" stroke-width="1" fill="none" opacity=".7"><path d="M30 90L26 106M44 90L42 108M58 90L58 108M72 90L74 108M86 90L90 106"/></g>`,
    over: o => flare(o.c1) + `<g stroke="${dk(o.c1, .25)}" stroke-width="1" fill="none"><path d="M32 98L28 112M50 99L48 114M68 99L70 114M86 97L92 112"/></g>`, sleeve: o => sleeve(o.c1) },
  { id: 'gown', name: 'Wedding gown', tip: 'With a lace bodice. The bridal veil (a hat) goes with it.',
    cloth: () => ALL('#fbf8f2') + `<g fill="none" stroke="#e3dccd" stroke-width=".8"><path d="M20 70q4-3 8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0"/><path d="M18 78q4-3 8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0"/></g>` + dots('#e8e1d2', .8, 7, 62, 84) + `<path d="M0 84H120V86.5H0Z" fill="#efe6d4"/>`,
    over: () => flare('#fbf8f2', 92, 7) + sparkle(40, 104, 1.1, '#e8dcc0') + sparkle(76, 105, 1.1, '#e8dcc0') + sparkle(58, 108, .9, '#e8dcc0'), sleeve: () => sleeve('#fbf8f2') },
  { id: 'priest', name: 'Priest', tip: 'A black cassock with the Roman collar: a black band with the white tab at the throat.',
    cloth: () => ALL('#1d1d24') + romanCollar() + buttons('#3a3a46', [[97, 68], [99, 74], [100.1, 80], [99.1, 86], [96.3, 92]]), sleeve: () => sleeve('#1d1d24') },
  { id: 'pope', name: 'Pope', tip: 'White cassock, a short white cape and a gold cross. The papal mitre goes with it.',
    cloth: () => ALL('#f8f6f0') + `<path d="M14 54C26 64 40 70 60 70C76 70 90 68 101 64L102 78C88 84 70 86 50 84C34 82 22 74 14 64Z" fill="#fffdf7" stroke="#d9d3c4" stroke-width="1"/>` + `<rect y="88" width="120" height="5" fill="#f1ead8"/>` + chain() + cross(92, 76, '#e2b93b', 1.1),
    sleeve: () => sleeve('#f8f6f0') },
  { id: 'bishop', name: 'Bishop', tip: 'A magenta cassock with a sash and a cross. The bishop\'s mitre goes with it.',
    cloth: () => ALL('#9b1b6a') + `<rect y="84" width="120" height="6" fill="#7d1255"/><path d="M28 88L22 104L30 104L32 89Z" fill="#7d1255"/>` + buttons('#e04b8f', [[92, 66], [93, 71], [93.8, 76], [94.4, 81]]) + chain() + cross(91.5, 75, '#e2b93b', 1),
    sleeve: () => sleeve('#9b1b6a') },
  { id: 'armor', name: 'Sci-fi armor', tip: 'Power armor in plates over a black suit. The armored helmet (a face item) goes with it.', colors: [['c1', 'Armor', '#5d6b3a']],
    cloth: o => ALL('#22252a') + `<path d="M64 60H98C102 66 103 76 100 86C90 90 74 90 64 86C60 78 60 66 64 60Z" fill="${o.c1}" stroke="${dk(o.c1, .5)}" stroke-width="1.4"/>
      <path d="M68 64H95M70 76H97" stroke="${dk(o.c1, .35)}" stroke-width="1"/><path d="M66 62C70 61 80 61 86 62" stroke="${lt(o.c1, .4)}" stroke-width="1.4" fill="none"/>
      <path d="M26 92C40 88 56 90 62 96L60 104C48 106 34 104 24 100Z" fill="${o.c1}" stroke="${dk(o.c1, .5)}" stroke-width="1.2"/><path d="M70 92C80 88 92 90 98 94L96 101C88 104 78 104 70 101Z" fill="${o.c1}" stroke="${dk(o.c1, .5)}" stroke-width="1.2"/>
      <rect x="62" y="86" width="40" height="3" fill="#15171b"/><circle cx="89" cy="70" r="1.6" fill="#7fd0ff" opacity=".8"/>`,
    sleeve: o => `<path d="M38 75C48 66 70 67 78 77C72 90 52 94 40 88C36 84 35 79 38 75Z" fill="${o.c1}" stroke="${dk(o.c1, .5)}" stroke-width="1.4"/><path d="M42 77C52 71 66 71 74 78" stroke="${lt(o.c1, .4)}" stroke-width="1.3" fill="none"/><path d="M44 84H70" stroke="${dk(o.c1, .35)}" stroke-width="1"/>` },
  { id: 'military', name: 'Military uniform', tip: 'Olive drab, a web belt with pouches and a shoulder strap, like the 1940s. The army helmet goes with it.',
    cloth: () => ALL('#5b5a3a') + `<path d="M64 58L100 92" stroke="#b5a77a" stroke-width="3.2"/>` + `<rect y="83" width="120" height="5" fill="#b5a77a"/><g fill="#a2946a" stroke="#6d6444" stroke-width=".8"><rect x="30" y="81" width="8" height="9" rx="1"/><rect x="44" y="81" width="8" height="9" rx="1"/><rect x="74" y="81" width="8" height="9" rx="1"/></g>
      <rect x="84" y="66" width="8" height="7" rx="1" fill="#4e4d31" stroke="#3b3a24" stroke-width=".8"/><circle cx="88" cy="67.6" r=".9" fill="#a2946a"/>` + collarBand('#4e4d31', 3.6),
    sleeve: () => sleeve('#5b5a3a') },
  { id: 'wizard', name: 'Wizard robe', tip: 'Stars and moons, a rope belt and a hem that drags. The wizard hat goes with it.', colors: [['c1', 'Robe', '#4b2fa0']],
    cloth: o => ALL(o.c1) + STAR(30, 74, 3, '#ffd23f') + STAR(56, 98, 2.6, '#ffd23f') + STAR(84, 90, 2.2, '#ffd23f') + STAR(20, 92, 2, '#fff3b0') + `<path d="M70 70a3.4 3.4 0 1 0 2.6 5.6a2.6 2.6 0 1 1-2.6-5.6Z" fill="#fff3b0"/>` + `<path d="M0 85H120" stroke="#d9b44a" stroke-width="2.4"/><path d="M90 85L92 97M92 85L95 96" stroke="#d9b44a" stroke-width="1.4" stroke-linecap="round"/>`,
    over: o => flare(o.c1, 93, 4) + STAR(40, 106, 2, '#ffd23f') + STAR(78, 106, 2, '#ffd23f'),
    sleeve: o => `<path d="M38 75C48 68 68 69 78 77C76 92 62 100 46 98C40 94 37 84 38 75Z" fill="${dk(o.c1, .12)}" stroke="${dk(o.c1, .45)}" stroke-width="1.2"/><path d="M46 98C52 96 64 95 72 90" stroke="#d9b44a" stroke-width="1.6" fill="none"/>` },
  { id: 'robot', name: 'Cardboard robot', tip: 'A cardboard box with marker dials and tape.',
    over: () => `<path d="M16 60L10 54V101L16 107Z" fill="#a87b45" stroke="#7a5a2e" stroke-width="1.4" stroke-linejoin="round"/><path d="M13 57.4V103.6" stroke="#96693a" stroke-width=".8"/>
      <path d="M16 60H102V107H16Z" fill="#c8995b" stroke="#7a5a2e" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 60L10 54H96L102 60" fill="#b9884a" stroke="#7a5a2e" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="40" y="58" width="22" height="5" fill="#d8cfae" opacity=".9"/><rect x="24" y="72" width="26" height="16" rx="2" fill="none" stroke="#2b2b2b" stroke-width="1.4"/>
      <circle cx="31" cy="80" r="3.4" fill="none" stroke="#2b2b2b" stroke-width="1.3"/><path d="M31 80l2-2" stroke="#2b2b2b" stroke-width="1.2"/><circle cx="43" cy="80" r="2" fill="#e03b3b"/>
      <path d="M58 76h30M58 82h24M58 88h28" stroke="#2b2b2b" stroke-width="1.2" stroke-dasharray="3 2"/><rect x="74" y="92" width="10" height="5" fill="#d8cfae" opacity=".9"/><path d="M10 84L16 90H22V95H16L10 89Z" fill="#d8cfae" opacity=".9"/>
      <path d="M40 102c2-4 6-4 8 0" stroke="#7a5a2e" stroke-width="1" fill="none"/>
      <rect x="40" y="84" width="24" height="10" rx="5" fill="#b9884a" stroke="#7a5a2e" stroke-width="1.4"/><path d="M47 84v10M53 84v10M59 84v10" stroke="#7a5a2e" stroke-width=".8"/>`, sleeve: () => '' },
  { id: 'lakers', name: 'Lakers jersey #33', tip: 'Kareem Abdul-Jabbar\'s number with the Lakers: gold with purple trim.',
    cloth: () => TOP('#fdb927', 90) + LOW('#fdb927', 90) + `<rect y="88" width="120" height="3" fill="#552583"/>` + collarBand('#552583', 2.8) + chest('LAKERS', '#552583', '#fff'),
    bare: true, sleeve: () => `<path d="M38 74C48 66 70 67 79 77" stroke="#552583" stroke-width="2.6" fill="none"/>` },
  { id: 'celtics', name: 'Celtics jersey #33', tip: 'Larry Bird\'s number with the Celtics: green with white.',
    cloth: () => TOP('#007a33', 90) + LOW('#007a33', 90) + `<rect y="88" width="120" height="3" fill="#fff"/>` + collarBand('#fff', 2.8) + chest('CELTICS', '#fff', '#00461d'),
    bare: true, sleeve: () => `<path d="M38 74C48 66 70 67 79 77" stroke="#fff" stroke-width="2.6" fill="none"/>` },
  /* a café racer: matte black leather with a soft sheen and darker seams; the collar: a band round the neck and its
     point lying on the chest, with a snap; the zip on the centre line (the body's front edge, so only its near half
     shows, as the suit's tie); a chest and a hand zip pocket. It ends at the hip (y 94). The owner picks what goes
     under it: blue jeans with the belt at the jacket's hem, or no pants and no belt (the duck's own body, as under
     the shirt) */
  { id: 'leather', name: 'Leather jacket', tip: 'A black leather biker jacket with zips and a snap collar. Pick jeans with a belt, or no pants.',
    opts: [['pants', [['jeans', 'Jeans'], ['none', 'No pants']]]],
    cloth: o => TOP('#1f1f24', 94) + `<g fill="none" stroke-linecap="round"><path d="M18 64C30 72 46 72 60 69" stroke="#fff" stroke-width="5" opacity=".06"/><path d="M93.5 67C97.5 73 98.6 80 97.4 87" stroke="#fff" stroke-width="3" opacity=".09"/><path d="M14 66C14 77 18 86 24 91" stroke="#fff" stroke-width="3" opacity=".06"/></g>
      <g fill="none"><path d="M14 59C30 67 50 67 66 63" stroke="#0d0d10" stroke-width="1.3"/><path d="M15 61C30 68.6 50 68.6 66 64.6" stroke="#3a3a42" stroke-width=".45" stroke-dasharray="1 .8"/><path d="M30 65C27 74 27 82 29 89" stroke="#0d0d10" stroke-width="1.1"/></g>
      <path d="${neck(155, 52, 25.5)}" stroke="#2a2a31" stroke-width="5.4" fill="none"/><path d="${neck(155, 52, 28.2)}" stroke="#0d0d10" stroke-width="1" fill="none"/><path d="${neck(155, 52, 27.2)}" stroke="#4a4a54" stroke-width=".4" stroke-dasharray="1 .8" fill="none"/><circle cx="82.6" cy="64.4" r="1" fill="#c9ccd2" stroke="#6b7078" stroke-width=".4"/>
      <g fill="none"><path d="${FRONT}" stroke="#0d0d10" stroke-width="9.6"/><path d="${FRONT}" stroke="#c9ccd2" stroke-width="6.4" stroke-dasharray=".7 .6"/><path d="${FRONT}" stroke="#0d0d10" stroke-width="2.6"/></g>${pull(89.4, 61.6, -8)}
      <path d="M77 62.4L88.6 61L94.4 64.8L92.2 71.6L84.2 66.8Z" fill="#2a2a31" stroke="#0d0d10" stroke-width=".8" stroke-linejoin="round"/><path d="M84.2 66.8L92.2 71.6" stroke="#4a4a54" stroke-width=".6"/><circle cx="91" cy="69.6" r=".95" fill="#c9ccd2" stroke="#6b7078" stroke-width=".4"/>
      <path d="M80.6 76.6L90.2 73.4" stroke="#3a3a42" stroke-width="1.6" stroke-linecap="round"/>${zipLine('M80.6 76L90.2 72.8', .8)}${pull(90, 72.8, -4, .8)}
      <path d="M82.8 86.8L88.8 79.6" stroke="#3a3a42" stroke-width="1.8" stroke-linecap="round"/>${zipLine('M82.2 86.4L88.2 79.2', .9)}${pull(88.2, 79.2, -10, .9)}
      ${o.pants === 'none'
    ? `<rect y="91.4" width="120" height="2.6" fill="#18181c"/><path d="M0 91.4H120" stroke="#0d0d10" stroke-width=".6"/><path d="M0 92.6H120" stroke="#3a3a42" stroke-width=".4" stroke-dasharray="1 .8"/>`
    : LOW('#3f63a8', 94) + `<g fill="none" stroke="#d9a441" stroke-width=".8" stroke-dasharray="1.6 1"><path d="M58 94V108"/><path d="M86 94.4C86.6 99 88.6 101.4 92 101"/></g><path d="M61 94V108" stroke="#2f4d86" stroke-width="1"/>
      <rect y="88.6" width="120" height="5.6" fill="#141417"/><path d="M0 89.6H120M0 93.2H120" stroke="#3a3a42" stroke-width=".45" stroke-dasharray="1 .8"/>
      <path d="M89 89.8H100V93H89Z" fill="#1a1a1e"/><circle cx="93.4" cy="91.4" r=".55" fill="#050506"/><rect x="84" y="88" width="5.2" height="6.8" rx=".9" fill="none" stroke="#c9ccd2" stroke-width="1.1"/><path d="M86.6 88V94.8M86.6 91.4H90.6" stroke="#c9ccd2" stroke-width=".7"/>`}`,
    sleeve: () => sleeve('#1f1f24') + `${zipLine('M45.4 79.2L49.4 86.6', .7)}${pull(49.4, 86.6, -30, .7)}` },
  { id: 'royal', name: 'Royal robe', tip: 'Red velvet with ermine trim and a gold clasp. The crown goes with it.', colors: [['c1', 'Velvet', '#9b1426']],
    cloth: o => ALL(o.c1) + `<path d="M10 52C26 64 44 70 64 68C78 67 90 64 101 60L102 70C88 76 70 78 56 78C36 78 22 70 10 62Z" fill="#fbfaf6"/>` + `<g fill="#1c1c1c"><path d="M24 66l1.2 3 1.2-3-1.2 1Z"/><path d="M40 72l1.2 3 1.2-3-1.2 1Z"/><path d="M58 73l1.2 3 1.2-3-1.2 1Z"/><path d="M76 71l1.2 3 1.2-3-1.2 1Z"/><path d="M92 66l1.2 3 1.2-3-1.2 1Z"/></g>` + `<circle cx="88" cy="74" r="2.6" fill="#e2b93b" stroke="#8a6400" stroke-width=".8"/>` + `<rect y="100" width="120" height="8" fill="#fbfaf6"/><g fill="#1c1c1c"><path d="M30 102l1 2.6 1-2.6-1 .8Z"/><path d="M50 103l1 2.6 1-2.6-1 .8Z"/><path d="M70 102l1 2.6 1-2.6-1 .8Z"/></g>`,
    sleeve: o => sleeve(o.c1, '#fbfaf6') },
  { id: 'shirt', name: 'Shirt', colors: [['c1', 'Shirt', '#2f7fe0']],
    cloth: o => TOP(o.c1, 88) + collarBand(dk(o.c1, .2), 2.6) + `<path d="M0 87H120" stroke="${dk(o.c1, .25)}" stroke-width="1.6"/>`,
    sleeve: o => `<path d="M40 77C50 70 68 71 76 79L72 83C64 78 50 77 42 82C40 81 39 79 40 77Z" fill="${dk(o.c1, .1)}" stroke="${dk(o.c1, .45)}" stroke-width="1.1"/>`, bare: true },
  { id: 'hoodie', name: 'Hoodie', colors: [['c1', 'Hoodie', '#8a8f9a']],
    cloth: o => ALL(o.c1) + `<path d="M28 88C40 84 60 84 72 88L70 98C60 100 42 100 30 98Z" fill="${dk(o.c1, .14)}" stroke="${dk(o.c1, .35)}" stroke-width=".9"/>` + `<path d="M90 62L91 74M94 62L96 73" stroke="#f2f2f2" stroke-width="1.1" stroke-linecap="round"/><circle cx="91" cy="74.6" r="1" fill="#f2f2f2"/><circle cx="96" cy="73.6" r="1" fill="#f2f2f2"/>` + `<rect y="100" width="120" height="6" fill="${dk(o.c1, .12)}"/>`,
    back: o => `<path d="M58 52C48 52 44 62 50 68C56 72 66 70 72 66L66 54Z" fill="${dk(o.c1, .1)}" stroke="${dk(o.c1, .45)}" stroke-width="1.2"/>`,
    sleeve: o => sleeve(o.c1, dk(o.c1, .12)) },
  { id: 'agbada', name: 'Agbada', tip: 'Formal Nigerian men\'s wear: a wide embroidered robe. The fila goes with it.', colors: [['c1', 'Robe', '#6b2fa3'], ['c2', 'Embroidery', '#e8b84a']],
    cloth: o => ALL(o.c1) + `<path d="M84 60C86 70 90 78 96 82C98 76 100 68 100 60Z" fill="none" stroke="${o.c2}" stroke-width="1.6"/><path d="M86 62l2 3 2-3 2 3 2-3 2 3 2-3" stroke="${o.c2}" stroke-width="1.1" fill="none"/>` + `<g fill="none" stroke="${o.c2}" stroke-width="1"><path d="M88 70c2 2 4 2 6 0M89 75c2 2 4 2 6 0"/><circle cx="91.5" cy="80" r="1.6"/></g>` + `<path d="M0 100H120" stroke="${o.c2}" stroke-width="1.4"/>`,
    sleeve: o => `<path d="M36 74C46 64 72 66 80 76C80 94 64 104 44 102C36 96 34 84 36 74Z" fill="${dk(o.c1, .1)}" stroke="${dk(o.c1, .45)}" stroke-width="1.2"/><path d="M44 102C56 100 70 96 78 86" stroke="${o.c2}" stroke-width="1.4" fill="none"/><path d="M42 80c4-4 10-5 16-4" stroke="${o.c2}" stroke-width="1" fill="none"/>` },
  { id: 'iro', name: 'Iro and buba', tip: 'Nigerian women\'s wear: a blouse and a wrapped skirt in matching print. The gele goes with it.', colors: [['c1', 'Fabric', '#7a1f2b'], ['c2', 'Print', '#e8b84a']],
    cloth: o => ALL(o.c1) + `<g fill="none" stroke="${o.c2}" stroke-width="1.2" opacity=".9"><circle cx="24" cy="72" r="3"/><circle cx="44" cy="68" r="3"/><circle cx="66" cy="72" r="3"/><circle cx="34" cy="96" r="3"/><circle cx="56" cy="98" r="3"/><circle cx="78" cy="96" r="3"/></g><g fill="${o.c2}"><circle cx="24" cy="72" r="1"/><circle cx="44" cy="68" r="1"/><circle cx="66" cy="72" r="1"/><circle cx="34" cy="96" r="1"/><circle cx="56" cy="98" r="1"/><circle cx="78" cy="96" r="1"/></g>`
      + `<path d="M0 84H120V88H0Z" fill="${dk(o.c1, .25)}"/><path d="M90 84C96 86 98 92 96 98L92 96C93 92 92 88 88 87Z" fill="${dk(o.c1, .15)}" stroke="${o.c2}" stroke-width=".8"/>`,
    sleeve: o => sleeve(o.c1) + `<circle cx="58" cy="82" r="2.4" fill="none" stroke="${o.c2}" stroke-width="1"/>` },
  { id: 'muscle', name: 'Muscle shirt', tip: 'A white tank top.',
    cloth: () => TOP('#fbfbf7', 90) + `<path d="M0 89H120" stroke="#dcdcd4" stroke-width="1.4"/>` + `<path d="M62 60C70 66 84 66 94 60" stroke="#dcdcd4" stroke-width="1.6" fill="none"/>`,
    bare: true, sleeve: () => `<path d="M38 74C48 66 70 67 79 77" stroke="#dcdcd4" stroke-width="2.6" fill="none"/>` },
  { id: 'jeans', name: 'Blue jeans', tip: 'Just the jeans.', low: true,
    cloth: () => LOW('#3f63a8', 84) + `<rect y="83" width="120" height="3" fill="#2f4d86"/><g fill="none" stroke="#d9a441" stroke-width=".8" stroke-dasharray="1.6 1"><path d="M0 87.4H120"/><path d="M60 88V108"/><path d="M76 90C80 96 86 98 92 96"/></g><g fill="#2f4d86"><rect x="40" y="82" width="2.4" height="5"/><rect x="70" y="82" width="2.4" height="5"/></g><circle cx="94" cy="85" r="1.3" fill="#c9a24a"/>` },
  { id: 'doctor', name: 'Doctor\'s coat', tip: 'A white coat with a stethoscope. The head mirror (a hat) goes with it.',
    cloth: () => ALL('#fbfbf7') + `<path d="M84 60L94 80L97 66L92 60Z" fill="#ececE6" stroke="#cfd2d6" stroke-width=".8"/><path d="M78 62C76 72 82 80 88 82" stroke="#2a2d34" stroke-width="1.6" fill="none"/><circle cx="88.6" cy="83" r="2.2" fill="#c9ccd2" stroke="#6b7078" stroke-width=".8"/>
      <rect x="76" y="86" width="9" height="8" rx="1" fill="none" stroke="#cfd2d6" stroke-width="1"/><path d="M78 84V89M81 84.6V89" stroke="#2f7fe0" stroke-width="1.1"/>` + buttons('#c9ccd2', [[93, 86], [93.6, 94]]),
    sleeve: () => sleeve('#fbfbf7') },
  { id: 'firefighter', name: 'Firefighter coat', tip: 'A turnout coat with reflective stripes. The firefighter helmet goes with it.',
    cloth: () => ALL('#c7a46a') + `<g fill="#e8e3a8"><rect y="76" width="120" height="4"/><rect y="94" width="120" height="4"/></g><g fill="#9aa0a8"><rect y="77.2" width="120" height="1.4"/><rect y="95.2" width="120" height="1.4"/></g><path d="M94 60V104" stroke="#2b2b2b" stroke-width="1.6"/><g fill="#2b2b2b"><rect x="95" y="68" width="3" height="2"/><rect x="95.6" y="86" width="3" height="2"/></g>` + collarBand('#2b2b2b', 3.6),
    sleeve: () => sleeve('#c7a46a', '#2b2b2b') + `<path d="M50 74L48 88" stroke="#e8e3a8" stroke-width="3"/>` },
  { id: 'police', name: 'Police uniform', tip: 'Navy with a badge, a patch and a duty belt. The police cap goes with it.',
    cloth: () => ALL('#1f2a48') + `<path d="M90 58L102 58L102 90L98 90Z" fill="#26324f"/>` + tie('#111520') + `<path d="M84 72l3-1.6 3 1.6v3.4c0 2-1.4 3.2-3 3.8c-1.6-.6-3-1.8-3-3.8Z" fill="#e2b93b" stroke="#8a6400" stroke-width=".6"/>` + belt('#111', '#e2b93b', 90) + `<rect x="70" y="86" width="6" height="8" rx="1.4" fill="#111"/>`,
    sleeve: () => sleeve('#1f2a48') + `<path d="M56 74l5-1 4 2-1 5-5 1-4-2Z" fill="#e2b93b" stroke="#1f2a48" stroke-width=".6"/>` },
  { id: 'cloud', name: 'Cloud outfit', tip: 'Soft puffs of cloud.',
    over: () => { const puffs = [[22, 70, 9], [34, 64, 9], [48, 64, 10], [62, 66, 10], [80, 68, 10], [94, 72, 8], [18, 84, 9], [30, 80, 10], [46, 80, 11], [62, 82, 11], [80, 82, 11], [96, 84, 8], [24, 96, 9], [40, 98, 10], [58, 100, 10], [76, 98, 10], [92, 94, 8]];
      return `<g>${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.2}" fill="#c9dcef"/>`).join('')}${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y - 1}" r="${r}" fill="#ffffff"/>`).join('')}${puffs.slice(0, 6).map(([x, y, r]) => `<circle cx="${x - r * .3}" cy="${y - r * .45}" r="${r * .35}" fill="#fff" opacity=".9"/>`).join('')}
        <circle cx="52" cy="82" r="7" fill="#f4f8fc" stroke="#c9dcef" stroke-width="1.2"/><circle cx="62" cy="80" r="5.4" fill="#f4f8fc" stroke="#c9dcef" stroke-width="1.2"/></g>`; },
    sleeve: () => '' },
  { id: 'pajamas', name: 'Pajama gown', tip: 'A long nightgown in the nightcap\'s blue. The nightcap and the sleep mask go with it.', colors: [['c1', 'Pajamas', '#4a6fd8']],
    cloth: o => ALL(o.c1) + dots(lt(o.c1, .55), 1, 9, 64) + collarBand('#ffffff', 2.4) + `<path d="M93 62V104" stroke="#fff" stroke-width="1.2"/>` + buttons('#fff', [[95, 70], [95.4, 78], [95.8, 86], [96, 94]]),
    sleeve: o => sleeve(o.c1, '#ffffff') },
  { id: 'hawaiian', name: 'Hawaiian shirt', colors: [['c1', 'Shirt', '#e2364a']],
    cloth: o => TOP(o.c1, 90) + leaf(20, 70, -20, '#2f8f4e') + flower(30, 72, 7, '#ffd0e0') + leaf(54, 92, 30, '#2f8f4e') + flower(48, 66, 6, '#fff3b0') + flower(66, 84, 7, '#ffd0e0') + leaf(70, 66, -40, '#2f8f4e') + flower(24, 88, 5, '#fff3b0') + flower(86, 78, 5, '#ffffff')
      + `<path d="M84 60L92 72L96 60Z" fill="${dk(o.c1, .2)}"/>` + buttons('#fff', [[92, 76], [93, 84]]) + LOW('#d8c8a0', 90) + `<path d="M0 90H120" stroke="${dk(o.c1, .3)}" stroke-width="1.4"/>`,
    sleeve: o => `<path d="M40 77C50 70 68 71 76 79L72 84C64 78 50 77 42 83C40 81 39 79 40 77Z" fill="${dk(o.c1, .08)}" stroke="${dk(o.c1, .45)}" stroke-width="1.1"/>` + flower(58, 76, 3.4, '#ffd0e0'), bare: true },
  { id: 'disco', name: 'Disco suit', tip: 'Sequins and a big collar.', colors: [['c1', 'Sequins', '#8e44ad']],
    cloth: o => ALL(o.c1) + dots(lt(o.c1, .5), .9, 5, 58) + `<path d="M82 60L90 78L94 60Z" fill="${lt(o.c1, .7)}"/><path d="M86 60L93 70L99 60Z" fill="#fbfbf7"/>` + `<circle cx="91" cy="78" r="2.4" fill="#e2b93b" stroke="#8a6400" stroke-width=".7"/>` + sparkle(30, 70, 1.6) + sparkle(64, 92, 1.4) + sparkle(48, 80, 1.2),
    sleeve: o => sleeve(o.c1) + `<circle cx="52" cy="80" r=".9" fill="${lt(o.c1, .6)}"/><circle cx="60" cy="84" r=".9" fill="${lt(o.c1, .6)}"/>` },
];
export const outfitById = id => OUTFITS.find(o => o.id === id) || null;
/* how Customize shows the outfits: in themed groups, each under a small heading */
export const OUTFIT_GROUPS = [
  ['Everyday', ['shirt', 'hoodie', 'jeans', 'leather', 'hawaiian', 'muscle', 'pajamas']],
  ['Dressed up', ['suit', 'tux', 'agbada', 'dress', 'iro', 'gown', 'disco']],
  ['Church', ['priest', 'pope', 'bishop']],
  ['Jobs and uniforms', ['doctor', 'firefighter', 'police', 'military']],
  ['Sports', ['lakers', 'celtics']],
  ['Fantasy and sci-fi', ['royal', 'wizard', 'armor', 'robot', 'cloud']],
];

/* the outfit's layers for a duck: cloth (inside the body), sleeve (in place of the wing), over and back (past the
   outline); colors filled in from the look or the defaults */
export function outfitLayers(outfit, T) {   // T: the duck's own tones { base, edge } (a bare arm)
  const def = outfit && outfitById(outfit.id); if (!def) return null;
  const o = { ...Object.fromEntries((def.colors || []).map(([k, , v]) => [k, v])), ...Object.fromEntries((def.colors || []).map(([k]) => [k, outfit[k]]).filter(([, v]) => v)) };
  for (const [k, choices] of def.opts || []) o[k] = choices.some(([v]) => v === outfit[k]) ? outfit[k] : choices[0][0];   // an option: the look's pick, or the first
  const run = f => (f ? f(o, T) : '');
  return { cloth: run(def.cloth), sleeve: def.sleeve ? def.sleeve(o, T) : null, over: run(def.over), back: run(def.back), bare: !!def.bare, low: !!def.low };
}
