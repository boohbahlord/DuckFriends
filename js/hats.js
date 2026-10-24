/* ---------- hats ----------
   Drawn in the duck's own 120 × 120 space (its head is centered at 76, 40 with a radius of 23, so its top is at y = 17).
   Each hat gives a front layer (drawn over the head) and, for a few, a back layer (drawn behind the duck: the afro). Hats
   that can be recolored name their colors in `colors` (c1, c2); the hotdog has ketchup; the crown takes a metal. A hat can
   also be a player card's pattern (small hats in a repeating tile). Ducks with hats get headroom above them. */
import { METAL } from './duck.js';

export const HATS = [
  { id: 'wizard', name: 'Wizard hat', colors: [['c1', 'Hat', '#6a3fb5']] },
  { id: 'pumpkin', name: 'Pumpkin' },
  { id: 'hotdog', name: 'Hotdog', ketchup: true },
  { id: 'afro', name: 'Afro', colors: [['c1', 'Hair', '#2b1a10']] },
  { id: 'jordan', name: 'Air Jordan 1', colors: [['c1', 'Primary', '#c8102e'], ['c2', 'Secondary', '#111111']] },
  { id: 'cheese', name: 'Cheese' },
  { id: 'fila', name: 'Fila', tip: 'The Yoruba cap Nigerian men wear (here a fila gobi, folded to one side).', colors: [['c1', 'Cap', '#6b2fa3'], ['c2', 'Stripes', '#f2c94c']] },
  { id: 'gele', name: 'Gele', tip: 'The Nigerian head tie women wear, wrapped and pleated high.', colors: [['c1', 'Gele', '#7a1f2b']] },
  { id: 'sombrero', name: 'Sombrero' },
  { id: 'dunce', name: 'Dunce hat' },
  { id: 'crown', name: 'Crown', metal: true },
  { id: 'duckling', name: 'Rubber duck', colors: [['c1', 'Duck', '#ffd23f']] },
  { id: 'eye', name: 'Floating eye' },
  { id: 'mouse', name: 'Grey mouse' },
  { id: 'bow', name: 'Ribbon bow', colors: [['c1', 'Bow', '#ff4f9a'], ['c2', 'Stripes', '#ffffff']] },
  { id: 'cap', name: 'Baseball cap', colors: [['c1', 'Cap', '#2fa4ff']] },
  { id: 'birthday', name: 'Birthday hat', colors: [['c1', 'Hat', '#2fa4ff'], ['c2', 'Dots', '#ffd23f']] },
  { id: 'word', name: 'Hat', tip: 'The word itself, in an old copperplate hand.', colors: [['c1', 'Ink', '#2b1d0e']] },
  { id: 'glove', name: 'Cartoon glove' },
  { id: 'horns', name: 'Devil horns' },
  { id: 'halo', name: 'Halo' },
  { id: 'antenna', name: 'Antenna', colors: [['c1', 'Bulb', '#ff4f9a']] },
  { id: 'antennae', name: 'Antenna eyes', tip: 'Two alien eyes on stalks.', colors: [['c1', 'Stalks', '#7ad151']] },
  { id: 'police', name: 'Police cap' },
  { id: 'fire', name: 'Firefighter helmet' },
  { id: 'doctor', name: 'Doctor\'s head mirror' },
  { id: 'nightcap', name: 'Nightcap', colors: [['c1', 'Cap', '#4a6fd8'], ['c2', 'Stripes', '#ffffff']] },
  { id: 'bucket', name: 'Bucket hat', tip: 'A floppy canvas bucket hat worn low, like Raoul Duke\'s in Fear and Loathing in Las Vegas.', colors: [['c1', 'Hat', '#c9b28a']] },
  { id: 'veil', name: 'Bridal veil' },
  { id: 'pope', name: 'Papal mitre' },
  { id: 'bishop', name: 'Bishop\'s mitre' },
  { id: 'helmet', name: 'Army helmet', colors: [['c1', 'Helmet', '#5b6b3a']] },
];
export const hatById = id => HATS.find(h => h.id === id) || null;
export const HAT_TOP = 32;   // the headroom (in duck units) a hat needs above the duck's box
const dk = (hex, t) => { const n = parseInt(String(hex).slice(1), 16) || 0, c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * (1 - t))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
const lt = (hex, t) => { const n = parseInt(String(hex).slice(1), 16) || 0, c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
const O = 'stroke="#1c1c28" stroke-width="1.6" stroke-linejoin="round"';

/* every hat in local units: (0, 0) is the top of the head, x toward the beak, y up is negative */
const DRAW = {
  wizard: (h, id) => `<path d="M-19 1C-11-19-5-39 6-50C10-53 15-49 12-44C8-30 13-14 19 1Z" fill="${h.c1}" ${O}/>
    <path d="M-19 1C-16-4 16-4 19 1" stroke="${dk(h.c1, .35)}" stroke-width="4" fill="none"/>
    <ellipse cx="0" cy="2" rx="30" ry="6.5" fill="${dk(h.c1, .15)}" ${O}/>
    <path d="M-4-20l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#ffd34d"/>
    <path d="M5-34l1.1 2.3 2.5.3-1.8 1.7.4 2.5-2.2-1.2-2.2 1.2.4-2.5-1.8-1.7 2.5-.3z" fill="#ffd34d"/>
    <path d="M-8-6l.8 1.7 1.8.2-1.3 1.3.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.3 1.8-.2z" fill="#fff" opacity=".8"/>`,
  pumpkin: () => `<path d="M2-24C1-29 3-33 6-35" stroke="#5b3a1a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M6-31C12-36 19-33 20-28C14-27 9-28 6-31Z" fill="#3fa34d" ${O}/>
    <ellipse cx="-11" cy="-11" rx="12" ry="12.5" fill="#f07f15" ${O}/><ellipse cx="13" cy="-11" rx="12" ry="12.5" fill="#f07f15" ${O}/>
    <ellipse cx="1" cy="-12" rx="13" ry="14" fill="#ff9426" ${O}/>
    <path d="M1-25C-4-18-4-5 1 2M1-25C6-18 6-5 1 2" stroke="#d96a0e" stroke-width="1.4" fill="none"/>
    <ellipse cx="-4" cy="-19" rx="4" ry="2" fill="#fff" opacity=".45"/>`,
  hotdog: h => `<path d="M-24-13C-26-18-20-21-12-19L14-19C22-21 27-17 25-12Z" fill="#e2a65a" ${O}/>
    <rect x="-31" y="-17" width="62" height="10" rx="5" fill="#c0502b" ${O}/>
    <ellipse cx="-12" cy="-14" rx="8" ry="1.4" fill="#fff" opacity=".35"/>
    ${h.ketchup ? '<path d="M-24-13l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3" stroke="#d7191c" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    <path d="M-27-9C-28-1-20 2-10 2L10 2C20 2 28-1 27-9C18-6-18-6-27-9Z" fill="#eab36a" ${O}/>`,
  afroBack: h => { const r = (k => () => (k = (k * 9301 + 49297) % 233280) / 233280)(7), cx = 71, cy = 28, R = 33, edge = dk(h.c1, .35), hi = lt(h.c1, .28);
    const bumps = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2, rr = 7.5 + r() * 2; return `<circle cx="${(cx + Math.cos(a) * R).toFixed(1)}" cy="${(cy + Math.sin(a) * R * .9).toFixed(1)}" r="${rr.toFixed(1)}"/>`; }).join('');
    const curls = Array.from({ length: 34 }, () => { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * .92, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .9; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}a2.6 2.6 0 1 1 3.4 1.6"/>`; }).join('');
    return `<g fill="${h.c1}" stroke="${edge}" stroke-width="1.3">${bumps}</g><ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${(R * .9).toFixed(1)}" fill="${h.c1}"/>
      <g fill="none" stroke="${hi}" stroke-width="1.1" stroke-linecap="round" opacity=".7">${curls}</g>`; },
  afro: h => `<g fill="${h.c1}" stroke="${dk(h.c1, .35)}" stroke-width="1.1">${[[-21, 7, 6], [-14, 2, 6.5], [-6, -1, 6.5], [2, -1, 6.5], [10, 1, 6], [16, 5, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
    <path d="M-16 1a2.4 2.4 0 1 1 3.2 1.4M-6-2a2.4 2.4 0 1 1 3.2 1.4M5-1a2.4 2.4 0 1 1 3 1.4" stroke="${lt(h.c1, .3)}" stroke-width="1.1" fill="none"/>`,
  jordan: h => `<path d="M-27 2L30 2C31-1 30-4 28-5L-27-5Z" fill="#fff" ${O}/>
    <path d="M-27 2L30 2" stroke="${dk(h.c1, .2)}" stroke-width="2.4"/>
    <path d="M-25-5L-25-26C-22-31-14-31-9-27L3-20C13-15 24-12 28-6L28-5Z" fill="#fafafa" ${O}/>
    <path d="M-25-5L-25-26C-22-30-17-30-14-29L-12-15C-12-10-14-7-17-5Z" fill="${h.c1}" ${O}/>
    <path d="M10-12C17-10 25-9 28-6L28-5L8-5C7-8 8-11 10-12Z" fill="${h.c1}" ${O}/>
    <path d="M-9-27L3-20C5-17 4-14 1-13L-9-19Z" fill="${h.c1}" ${O}/>
    <path d="M-20-10C-8-16 6-20 18-21C8-16-4-11-16-8Z" fill="${h.c2}"/>
    <path d="M-25-26C-22-31-14-31-9-27" stroke="${h.c2}" stroke-width="3" fill="none"/>
    <path d="M-5-23l4 2M-1-20l4 2M3-17l4 2" stroke="#fff" stroke-width="1.6"/>`,
  cheese: () => `<path d="M-28-30L27-12L22-15L-23-36Z" fill="#fde98f" ${O}/>
    <path d="M-28 2L27 2L27-12L-28-30Z" fill="#fdd85f" ${O}/>
    <path d="M27 2L31-1L31-14L27-12Z" fill="#f9c63a" ${O}/>
    <ellipse cx="-16" cy="-12" rx="5" ry="4" fill="#efb22b"/><ellipse cx="-17" cy="-13" rx="4" ry="3" fill="#f5c33f"/>
    <ellipse cx="4" cy="-5" rx="4.5" ry="3.6" fill="#efb22b"/><ellipse cx="3.4" cy="-5.6" rx="3.4" ry="2.6" fill="#f5c33f"/>
    <ellipse cx="18" cy="-4" rx="2.6" ry="2.2" fill="#efb22b"/><ellipse cx="-24" cy="-2" rx="2.4" ry="2" fill="#efb22b"/>
    <ellipse cx="-8" cy="-27" rx="4" ry="1.6" fill="#efb22b" transform="rotate(18 -8 -27)"/><ellipse cx="10" cy="-19" rx="3" ry="1.2" fill="#efb22b" transform="rotate(18 10 -19)"/>`,
  fila: (h, id) => { const c = h.c1, s = h.c2, d = dk(c, .3);
    const body = 'M-20 2C-21-9-21-20-17-26C-12-32 4-33 14-28C22-24 27-17 26-8C25.5-4.5 22.5-4.5 22-7.5C21-11 19-14 15.5-15C17.5-9 19-3 20 2Z';
    return `<defs><clipPath id="${id}fl"><path d="${body}"/></clipPath>
    <pattern id="${id}fp" width="4" height="40" patternUnits="userSpaceOnUse"><path d="M1 0V40" stroke="${s}" stroke-width="1.1"/><path d="M2.8 0V40" stroke="${s}" stroke-width=".45" opacity=".8"/></pattern></defs>
    <path d="${body}" fill="${c}"/>
    <g clip-path="url(#${id}fl)">
      <rect x="-30" y="-40" width="60" height="45" fill="url(#${id}fp)" opacity=".7"/>
      <path d="M-30-17H30M-30-6H30" stroke="${s}" stroke-width="1.6" opacity=".5"/>
      <path d="M15.5-15C19-14 21.5-11 22-7.5C22.5-4.5 25.5-4.5 26-8C25.5-13 22-18 16-20Z" fill="${d}" opacity=".6"/>
      <path d="M-17-26C-12-32 4-33 14-28C9-27 0-25-10-23Z" fill="#fff" opacity=".14"/></g>
    <path d="${body}" fill="none" ${O}/>
    <path d="M-13-24C-3-27 9-24 16-19" stroke="${d}" stroke-width="1.2" fill="none" opacity=".8"/>
    <path d="M-21 3C-8 0 8 0 21 3L21-1C8-4-8-4-21-1Z" fill="${dk(c, .2)}" ${O}/>
    <path d="M-21 1C-8-2 8-2 21 1" stroke="${s}" stroke-width=".9" fill="none"/>`; },
  gele: (h, id) => { const N = 17, cx = -7, cy = -7, RX = 47, RY = 38;
    const pt = a => [cx + Math.cos(a) * RX, cy + Math.sin(a) * RY];
    const pleats = Array.from({ length: N }, (_, i) => {
      const a0 = Math.PI * (1.02 + i / N * .98), a1 = Math.PI * (1.02 + (i + 1) / N * .98), [x0, y0] = pt(a0), [x1, y1] = pt(a1), [xm, ym] = pt((a0 + a1) / 2);
      return `<path d="M${cx} ${cy + 6}L${x0.toFixed(1)} ${y0.toFixed(1)}Q${(xm + (xm - cx) * .08).toFixed(1)} ${(ym + (ym - cy) * .08).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}Z" fill="${i % 2 ? lt(h.c1, .14) : h.c1}" stroke="${dk(h.c1, .35)}" stroke-width=".7"/>`;
    }).join('');
    return `${pleats}<path d="M${cx - RX} ${cy}Q${cx} ${cy - RY * 1.25} ${cx + RX} ${cy}" fill="none" stroke="#1c1c28" stroke-width="1.6"/>
      <path d="M-25 5C-24-9 23-11 26 0C27 6 23 9 18 7C9 3-11 3-21 9Z" fill="${dk(h.c1, .12)}" ${O}/>
      <path d="M-20 3C-8-3 10-4 22 0M-18 7C-6 2 10 1 21 4" stroke="${lt(h.c1, .25)}" stroke-width="1.2" fill="none"/>`; },
  sombrero: () => `<ellipse cx="-3" cy="1" rx="40" ry="8.5" fill="#e9c46a" ${O}/>
    <ellipse cx="-3" cy="-1" rx="31" ry="4.6" fill="#d8ae4c"/>
    <path d="M-16-1C-17-20-10-29 0-29C10-29 17-20 16-1Z" fill="#e3b955" ${O}/>
    <path d="M-16-7C-6-9 6-9 16-7L16-2C6-4-6-4-16-2Z" fill="#d7263d"/>
    <path d="M-15-5l4-2 4 2 4-2 4 2 4-2 4 2 4-2" stroke="#2a9d8f" stroke-width="1.6" fill="none"/>
    ${[-38, -27, -15, -3, 9, 21, 31].map((x, i) => `<circle cx="${x}" cy="${(8 - Math.abs(x + 3) / 9).toFixed(1)}" r="2.2" fill="${['#d7263d', '#2a9d8f', '#f4a261'][i % 3]}"/>`).join('')}`,
  dunce: () => `<path d="M-16 2L0-52L16 2Z" fill="#fbfbf6" ${O}/>
    <path d="M0-52L16 2L8 2Z" fill="#000" opacity=".08"/>
    <text x="-1" y="-6" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="16" fill="#1c1c28">D</text>
    <path d="M-16 2C-6 5 6 5 16 2" stroke="#1c1c28" stroke-width="1.6" fill="none"/>`,
  crown: (h, id) => {
    const M = METAL[h.metal] || METAL.gold;
    return `<defs><linearGradient id="${id}cr" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${M[0]}"/><stop offset=".4" stop-color="${M[2]}"/><stop offset=".55" stop-color="${M[3]}"/><stop offset=".75" stop-color="${M[4]}"/><stop offset="1" stop-color="${M[3]}"/></linearGradient></defs>
    <path d="M-20-9L-22-28L-11-17L0-32L11-17L22-28L20-9Z" fill="url(#${id}cr)" ${O}/>
    <rect x="-21" y="-10" width="42" height="11" rx="2" fill="url(#${id}cr)" ${O}/>
    <circle cx="0" cy="-4.5" r="3.2" fill="#e01b4c" stroke="#7a0a25" stroke-width=".8"/><circle cx="-12" cy="-4.5" r="2.4" fill="#2f80ed"/><circle cx="12" cy="-4.5" r="2.4" fill="#27ae60"/>
    <circle cx="-22" cy="-28" r="2" fill="${M[0]}" ${O}/><circle cx="0" cy="-32" r="2.2" fill="${M[0]}" ${O}/><circle cx="22" cy="-28" r="2" fill="${M[0]}" ${O}/>
    <path d="M-18-8L-16-2" stroke="#fff" stroke-width="1.4" opacity=".7"/>`;
  },
  duckling: (h, id) => `<g transform="translate(-14 -24) scale(.3)">
    <path d="M30 62C24 60 18 56 12 49C11 60 13 72 18 81C23 98 40 106 60 106C82 106 98 98 100 82C101 72 96 64 88 60L60 60C48 60 38 62 30 62Z" fill="${h.c1}" stroke="#1c1c28" stroke-width="5"/>
    <circle cx="76" cy="40" r="23" fill="${h.c1}" stroke="#1c1c28" stroke-width="5"/>
    <path d="M96 35C104 32 113 34 116 39C111 42.5 103 43.5 96.5 42.5Z" fill="#ff9a1f" stroke="#1c1c28" stroke-width="4"/>
    <circle cx="83" cy="34" r="5" fill="#161616"/><ellipse cx="64" cy="28" rx="8" ry="5" fill="#fff" opacity=".55"/></g>`,
  eye: () => `<g class="hat-float" opacity=".62"><path d="M-22-30C-12-42 12-42 22-30C12-18-12-18-22-30Z" fill="#ffffff" stroke="#1c1c28" stroke-width="1.8"/>
    <circle cx="0" cy="-30" r="7.5" fill="#4b6584"/><circle cx="0" cy="-30" r="3.6" fill="#111"/><circle cx="2.4" cy="-32.6" r="1.6" fill="#fff"/></g>`,
  mouse: () => `<path d="M-14-6C-24-4-26 6-18 8" stroke="#8d939c" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="-3" cy="-8" rx="13" ry="9" fill="#a3a9b2" ${O}/>
    <circle cx="10" cy="-13" r="7" fill="#a9afb8" ${O}/>
    <circle cx="6" cy="-20" r="4.6" fill="#a9afb8" ${O}/><circle cx="6" cy="-20" r="2.6" fill="#f4a3b4"/>
    <circle cx="13.6" cy="-20.4" r="4" fill="#a9afb8" ${O}/><circle cx="13.6" cy="-20.4" r="2.2" fill="#f4a3b4"/>
    <circle cx="17.2" cy="-12" r="1.6" fill="#f07c95"/><circle cx="12.6" cy="-14.6" r="1.3" fill="#111"/>
    <path d="M16-11l5-1M16-10l5 1" stroke="#555" stroke-width=".6"/><ellipse cx="-6" cy="-12" rx="5" ry="2" fill="#fff" opacity=".35"/>`,
  bow: h => `<g transform="translate(-6 -3) rotate(-12)">
    <path d="M0 0C-8-12-22-14-24-4C-25 4-12 6 0 0Z" fill="${h.c1}" ${O}/>
    <path d="M0 0C8-12 22-14 24-4C25 4 12 6 0 0Z" fill="${h.c1}" ${O}/>
    <path d="M-20-8C-14-6-8-4-3-1M20-8C14-6 8-4 3-1" stroke="${h.c2}" stroke-width="2.2" fill="none"/>
    <path d="M-3 1L-9 14L-4 12L-1 16Z M3 1L9 14L4 12L1 16Z" fill="${dk(h.c1, .15)}" ${O}/>
    <rect x="-4.5" y="-5" width="9" height="9" rx="3" fill="${h.c2}" ${O}/></g>`,
  birthday: (h, id) => `<defs><clipPath id="${id}bd"><path d="M-15 1L2-40L17 1Z"/></clipPath></defs>
    <path d="M-15 1L2-40L17 1Z" fill="${h.c1}" ${O}/>
    <g clip-path="url(#${id}bd)" fill="${h.c2}">${[[-6, -6], [6, -4], [0, -16], [-1, -28], [8, -14], [-9, -2], [3, -25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>
    <path d="M2-40L17 1L10 1Z" fill="#000" opacity=".1"/>
    <ellipse cx="1" cy="1" rx="17" ry="3.4" fill="${dk(h.c1, .2)}" ${O}/>
    <g fill="${h.c2}" stroke="#1c1c28" stroke-width="1">${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${(2 + Math.cos(a * Math.PI / 180) * 3.6).toFixed(1)}" cy="${(-42 + Math.sin(a * Math.PI / 180) * 3.6).toFixed(1)}" r="3"/>`).join('')}<circle cx="2" cy="-42" r="3.2" stroke="none"/></g>`,
  word: h => `<g transform="translate(-32 -2) rotate(-4) scale(1.25)"><path d="M2.8 0Q1.6 0 0.8-0.5Q0-1.1 0-1.9Q0-2.6 0.5-2.9Q0.9-3.1 1.4-3.1Q1.6-3.1 1.9-3Q2.1-2.9 2.1-2.5Q2.1-2.2 1.8-2Q1.6-1.8 1.3-1.8Q1.1-1.8 0.9-1.8Q0.7-1.8 0.6-1.9L0.6-1.8Q0.6-1.2 1.2-0.8Q1.8-0.4 2.9-0.4Q3.5-0.4 4.1-0.5Q4.7-0.7 5.3-1Q6-1.4 6.9-2.1Q7.8-2.8 9-4.2Q10.3-5.5 12-7.7Q11.1-7.4 10.4-7.2Q8.8-6.6 7.3-5.7Q5.8-4.9 5-3.7Q4.9-3.5 4.8-3.5Q4.7-3.5 4.7-3.6Q4.7-3.7 4.7-3.7Q4.7-3.8 4.8-3.9Q5.1-4.4 5.6-4.9Q6.2-5.4 7-5.9Q7.7-6.4 8.2-6.7Q8.9-7 9.9-7.4Q10.9-7.7 12.4-8.1Q14.2-10.6 15.7-12.4Q17.3-14.1 18.2-15.1Q16.7-14.2 15.7-13.8Q14.7-13.5 14-13.5Q13.3-13.5 12.8-13.8Q12.3-14.2 12.3-14.9Q12.3-15.7 12.7-16.4Q13.1-17.1 14.3-18Q14.9-18.5 15-18.7Q15.2-18.9 15.2-19Q15.2-19.5 14.7-19.7Q14.3-20 13.3-20Q12.2-20 11.1-19.6Q10-19.2 9.1-18.4Q8.9-18.2 8.8-18.2Q8.6-18.2 8.6-18.4Q8.6-18.4 8.7-18.5Q8.8-18.6 8.9-18.7Q9.7-19.5 10.9-19.9Q12-20.3 13.3-20.3Q14.5-20.3 15.1-19.9Q15.8-19.4 15.8-18.6Q15.8-17.8 15.4-17Q14.9-16.3 13.6-15.4Q13.1-15.1 13-14.9Q12.8-14.8 12.8-14.6Q12.8-14.4 13.1-14.1Q13.4-13.9 14.2-13.9Q15.1-13.9 16.5-14.6Q17.9-15.2 19.3-16.5Q20.7-17.7 21.6-18.4Q22.5-19.2 23.1-19.6Q23.7-20.1 24.2-20.3Q24.4-20.4 24.6-20.5Q24.7-20.5 24.8-20.5Q25-20.5 25-20.4Q25-20.4 24.7-20.2Q24.5-20.1 24.3-20Q24.1-19.9 23.6-19.5Q22.1-18.3 20.4-16.1Q18.7-13.9 16.5-10.9Q16.1-10.3 15.7-9.8Q15.3-9.3 14.9-8.8Q16.1-9.1 17.5-9.5Q18.9-9.8 20.6-10.2Q20.7-10.4 20.9-10.7Q21.1-10.9 21.3-11.1Q22.9-13 24.8-14.8Q26.7-16.5 28.5-17.8Q30.3-19.1 31.8-19.9Q33.3-20.7 34.2-20.7Q34.8-20.7 35.2-20.4Q35.5-20.1 35.5-19.6Q35.5-18.9 34.6-17.7Q33.7-16.6 32-15.3Q30.4-14 28-12.7Q25.7-11.5 22.8-10.5Q21.2-8.6 20-6.9Q18.8-5.1 18-3.7Q17.3-2.4 17.3-1.7Q17.3-1 17.5-0.7Q17.8-0.3 18.5-0.3Q19.6-0.3 20.8-1.2Q21.9-2 23-3.5Q24-5 24.6-7Q24.7-7.5 24.9-7.5Q25.1-7.5 25.1-7Q25.2-6.4 24.8-5.5Q24.5-4.6 23.8-3.6Q23.2-2.7 22.3-1.8Q21.4-1 20.4-0.5Q19.4 0 18.4 0Q17.5 0 17-0.6Q16.5-1.2 16.5-1.9Q16.5-3.3 17.3-5.1Q18.1-7 20.2-9.8Q18.9-9.4 17.4-9Q15.9-8.7 14.5-8.3Q12.2-5.6 10.4-3.8Q8.5-2 6.8-1Q5.8-0.5 4.7-0.2Q3.7 0 2.8 0M23.2-11Q25.7-12 27.8-13.2Q30-14.5 31.6-15.8Q33.2-17.1 34.1-18.2Q35-19.3 35-19.8Q35-20.3 34.3-20.3Q33.4-20.3 32.2-19.6Q30.9-18.8 29.4-17.5Q27.9-16.1 26.3-14.5Q24.7-12.8 23.2-11M27.1 0Q26.1 0 25.7-0.5Q25.3-1 25.3-1.9Q25.3-2.9 25.7-4Q26.1-5.1 27.1-6.2Q29.1-8.5 30.8-9.3Q32.5-10 34-10Q34.8-10 35.3-9.7Q35.8-9.4 35.8-8.8Q35.8-8.4 35.7-8Q36.1-8.5 36.5-8.9Q36.8-9.4 37.1-9.7Q37.5-9.6 38-9.6Q38.2-9.6 38.5-9.6Q38.9-9.7 39.1-9.7L34.1-3.7Q33.2-2.6 32.8-1.9Q32.4-1.2 32.4-0.8Q32.4-0.4 32.8-0.4Q33.6-0.4 34.5-0.8Q35.3-1.3 36.1-2Q37-2.8 37.7-3.5Q38.4-4.3 38.9-5Q39.5-5.7 39.8-6L40.1-5.7Q39.8-5.4 39.2-4.7Q38.6-4 37.8-3.2Q37.1-2.4 36.2-1.6Q35.3-0.9 34.4-0.4Q33.5 0 32.6 0Q31.1 0 31.1-0.9Q31.1-1.2 31.3-1.6Q31.4-1.9 31.8-2.5Q32.2-3 32.9-3.9L32.8-4Q31-1.8 29.5-0.9Q27.9 0 27.1 0M27.1-0.4Q28.1-0.4 29.6-1.5Q31.2-2.6 33.3-5.1Q33.7-5.6 34-5.9Q34.3-6.3 34.5-6.6Q34.9-7.1 35.1-7.7Q35.4-8.2 35.4-8.7Q35.4-9.2 35.1-9.4Q34.8-9.6 34.4-9.6Q33.7-9.6 32.1-8.5Q30.5-7.5 28.5-5.2Q27.5-3.9 27-2.9Q26.5-1.9 26.5-1.2Q26.5-0.4 27.1-0.4M38.7 0Q37.9 0 37.5-0.3Q37.1-0.6 37.1-1.1Q37.1-1.5 37.2-1.9Q37.3-2.3 37.7-2.9Q38-3.5 38.7-4.5Q39.4-5.5 40.5-7.2L44.3-12.5L43.2-12.5Q42.7-12.5 42.7-12.7Q42.7-12.9 43.3-12.9L44.6-12.9L47.3-16.7Q47.5-16.7 47.8-16.7Q48.1-16.7 48.7-16.7Q49-16.7 49.4-16.7L46.5-12.9L50.3-12.9Q50.7-12.9 50.7-12.7Q50.7-12.5 50.4-12.5L46.2-12.5L42.3-7.3Q41-5.4 40.1-4.2Q39.3-3.1 38.9-2.4Q38.4-1.7 38.3-1.3Q38.1-1 38.1-0.8Q38.1-0.4 38.9-0.4Q39.9-0.4 40.9-1Q42-1.7 43-2.6Q44-3.6 44.8-4.5Q45.6-5.4 46-5.9L46.4-5.7Q45.9-5.2 45.1-4.3Q44.3-3.3 43.2-2.3Q42.2-1.3 41-0.7Q39.9 0 38.7 0" fill="${h.c1}" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke fill"/></g>`,
  glove: () => { const W = 'fill="#fff" stroke="#1c1c28" stroke-width="1.5" stroke-linejoin="round"';
    const fingers = [[-10.5, 16, -10], [-3.5, 21, -3], [3.5, 20, 4], [10.5, 15, 11]].map(([x, L, a]) =>
      `<path d="M${x - 3.6} -12V${-12 - L + 3.6}A3.6 3.6 0 0 1 ${x + 3.6} ${-12 - L + 3.6}V-12Z" ${W} transform="rotate(${a} ${x} -12)"/>`).join('');
    return `<g transform="rotate(4)">${fingers}
    <path d="M14-7C19-9 23-14 25.5-19.5C27.5-24 34-22.5 33-17C31.5-10 25-4 16-1Z" ${W}/>
    <path d="M-17-2C-19-8-18-13-15-14.5C-6-16.5 6-16.5 15-14.5C18-13 19-8 17-2Z" ${W}/>
    <path d="M-6-5V-11M0-5V-12M6-5V-11" stroke="#1c1c28" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M-21 6L-18-3C-6-5.5 6-5.5 18-3L21 6C8 8.5-8 8.5-21 6Z" ${W}/>
    <path d="M-19.5 2C-7 0 7 0 19.5 2" stroke="#1c1c28" stroke-width="1" fill="none"/></g>`; },
  horns: (h, id) => `<defs><linearGradient id="${id}hn" x1="0" y1="1" x2=".6" y2="0"><stop offset="0" stop-color="#8a0d14"/><stop offset=".5" stop-color="#e3242b"/><stop offset="1" stop-color="#ff7a6a"/></linearGradient></defs>
    <path d="M-7 3C-7-6-11-14-20-19C-17-12-16-5-16 3Z" fill="#a3121b" stroke="#3a0408" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-10 0C-10-6-12-11-17-15" stroke="#fff" stroke-width="1" opacity=".3" fill="none" stroke-linecap="round"/>
    <path d="M1 4C1-7 7-16 19-22C14-14 12-6 13 4Z" fill="url(#${id}hn)" stroke="#3a0408" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M4 1C4-7 8-13 15-18" stroke="#fff" stroke-width="1.4" opacity=".55" fill="none" stroke-linecap="round"/>`,
  halo: () => `<g class="hat-glow"><ellipse cx="1" cy="-16" rx="22" ry="6" fill="none" stroke="#fff3b0" stroke-width="9" opacity=".35"/>
    <ellipse cx="1" cy="-16" rx="20" ry="5" fill="none" stroke="#ffd84a" stroke-width="4.2"/>
    <ellipse cx="1" cy="-16" rx="20" ry="5" fill="none" stroke="#fffbe0" stroke-width="1.4"/>
    <path d="M-12-20l1.5-3 1.5 3-3 0Z M12-21l1.2-2.4 1.2 2.4Z" fill="#fff"/></g>`,
  antenna: h => `<path d="M0 1C-4-10 6-16 1-27" stroke="#1c1c28" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="0" cy="1" rx="5" ry="2" fill="#1c1c28"/>
    <circle cx="1" cy="-31" r="5.4" fill="${h.c1}" ${O}/><circle cx="-1" cy="-33" r="1.8" fill="#fff" opacity=".75"/>`,
  police: () => `<path d="M-25-9C-27-18-12-24 2-24C18-24 29-18 25-9Z" fill="#1f2a5a" ${O}/>
    <path d="M-20-19C-10-22 8-22 20-19" stroke="#fff" stroke-width="1.4" opacity=".18" fill="none"/>
    <rect x="-21" y="-10" width="42" height="11" rx="2" fill="#141a3a" ${O}/>
    <path d="M-21-6H21" stroke="#e9e9e9" stroke-width="1.6" stroke-dasharray="3 3"/>
    <path d="M14 1C24-1 33 2 35 7C27 8 19 6 12 3Z" fill="#111" ${O}/><path d="M17 1C24 0 29 2 31 4" stroke="#fff" stroke-width="1" opacity=".4" fill="none"/>
    <path d="M15.5-21L20-19.6L19.5-14.4C19.3-12 17.4-10.6 15.5-10C13.6-10.6 11.7-12 11.5-14.4L11-19.6Z" fill="#f2c94c" stroke="#8a6a12" stroke-width="1"/>
    <circle cx="15.5" cy="-15.6" r="1.5" fill="#8a6a12"/>`,
  fire: () => `<path d="M-40 4C-30-3 18-3 30 3C20 8-30 10-40 4Z" fill="#a8101c" ${O}/>
    <path d="M-18 0C-19-18-8-27 2-27C14-27 21-18 19 0Z" fill="#d7192a" ${O}/>
    <path d="M-12-22C-6-28 8-28 14-22" stroke="#a8101c" stroke-width="4" fill="none"/>
    <path d="M-2-27C0-30 4-30 6-27" stroke="#f2c94c" stroke-width="3" fill="none"/>
    <path d="M7-20L18-20L19-6C16-2 12 0 12 0C12 0 8-2 6-6Z" fill="#f2c94c" stroke="#8a6a12" stroke-width="1.2"/>
    <text x="12.6" y="-9" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="7.5" fill="#a8101c">1</text>
    <ellipse cx="-6" cy="-17" rx="6" ry="3" fill="#fff" opacity=".3" transform="rotate(-25 -6 -17)"/>`,
  doctor: (h, id) => `<defs><radialGradient id="${id}mr" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#cfd6de"/><stop offset="1" stop-color="#8a95a3"/></radialGradient></defs>
    <path d="M-22 4C-23-8 23-10 23 3" stroke="#2b2b2b" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <circle cx="13" cy="-6" r="9" fill="url(#${id}mr)" stroke="#555" stroke-width="1.8"/>
    <circle cx="13" cy="-6" r="1.8" fill="#333"/><path d="M8-10C10-12 13-13 15-12" stroke="#fff" stroke-width="1.2" fill="none"/>`,
  nightcap: (h, id) => { const cap = 'M23 3C25-12 16-29-1-30C-16-31-27-22-32-9C-35-2-37 6-36 13C-33 8-29 0-22-5L-22 3Z';
    return `<defs><clipPath id="${id}nc"><path d="${cap}"/></clipPath></defs>
    <path d="${cap}" fill="${h.c1}"/>
    <g clip-path="url(#${id}nc)" stroke="${h.c2}" stroke-width="3.2" opacity=".9">${[-48, -38, -28, -18, -8, 2, 12, 22].map(x => `<path d="M${x}-36L${x + 22} 20"/>`).join('')}</g>
    <path d="${cap}" fill="none" ${O}/>
    <path d="M-29-7C-25-15-17-23-5-26" stroke="#fff" stroke-width="2" opacity=".25" fill="none" stroke-linecap="round"/>
    <path d="M-23 3C-10-2 10-2 23 3L23 8C10 3-10 3-23 8Z" fill="${h.c2}" ${O}/>
    <circle cx="-36" cy="15.5" r="4.8" fill="${h.c2}" ${O}/>`; },
  bucket: h => { const c = h.c1, d = dk(c, .3), l = lt(c, .25);
    return `<path d="M-19-5C-25-2-31 3-35 8C-22 13 21 13 34 7C30 1 25-3 19-5Z" fill="${dk(c, .08)}" ${O}/>
    <path d="M-31 5C-18 9 18 9 30 4.5M-27 2C-15 5.5 15 5.5 26 1.5M-23-1C-12 2 12 2 22-1.4" stroke="${d}" stroke-width=".8" stroke-dasharray="1.6 1.4" fill="none"/>
    <path d="M-19-5C-20-15-18-25-11-28C-4-31 9-31 14-28C19-25 20-15 19-5C8-3-8-3-19-5Z" fill="${c}" ${O}/>
    <path d="M-19-9C-8-7 8-7 19-9L19-5C8-3-8-3-19-5Z" fill="${d}" opacity=".5"/>
    <path d="M-12-27C-4-24 6-24 13-27" stroke="${d}" stroke-width="1" fill="none"/>
    <path d="M-3-30C-4-20-4-12-3-9M9-29C10-20 10-13 9-9" stroke="${d}" stroke-width=".8" stroke-dasharray="1.6 1.4" fill="none"/>
    <path d="M-15-11C-15-18-13-24-8-26" stroke="${l}" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/>
    <circle cx="14" cy="-16" r=".9" fill="${d}"/>`; },
  veilBack: () => `<path d="M54 20C40 30 30 52 24 86C34 92 48 92 58 84C60 60 62 38 66 22Z" fill="#ffffff" opacity=".55" stroke="#d9d9e8" stroke-width="1.2"/>
    <path d="M52 30C44 46 38 64 34 84M58 32C52 50 48 66 46 86" stroke="#ffffff" stroke-width="1.4" opacity=".8" fill="none"/>`,
  veil: () => `<path d="M-14 2C-22 4-26 10-28 18" stroke="#e8e8f2" stroke-width="5" opacity=".7" fill="none" stroke-linecap="round"/>
    <path d="M-12 1C-12-7 12-9 13 0" stroke="#c9ccd8" stroke-width="2.2" fill="none"/>
    ${[-10, -5, 0, 5, 10].map((x, i) => `<circle cx="${x}" cy="${(-5 - (i === 2 ? 5 : i % 2 ? 3 : 1)).toFixed(1)}" r="${i === 2 ? 2.4 : 1.6}" fill="#fff" stroke="#9aa0b4" stroke-width=".8"/>`).join('')}
    <path d="M-2-11L0-15L2-11Z" fill="#bfe6ff"/>`,
  pope: () => `<path d="M-14 0L-18 17L-14 17L-10 0Z" fill="#d4a72c" ${O}/>
    <path d="M-15 1L-15-26C-11-36-5-40 0-45C5-40 11-36 15-26L15 1Z" fill="#f8f4ea" ${O}/>
    <path d="M-15-4H15M0-44V1" stroke="#d4a72c" stroke-width="4"/>
    <path d="M-15-26C-8-22 8-22 15-26" stroke="#d4a72c" stroke-width="2.4" fill="none"/>
    <path d="M0-37V-27M-4-33H4" stroke="#b8860b" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-15 1L-15-26C-11-36-5-40 0-45" fill="none" stroke="#1c1c28" stroke-width="1.6"/>`,
  bishop: () => `<path d="M-19 2C-19-8 19-8 19 2Z" fill="#7b2d8e" ${O}/>
    <path d="M-14 0L-18 17L-14 17L-10 0Z" fill="#c8102e" ${O}/>
    <path d="M-14-2L-14-24C-10-33-4-37 0-41C4-37 10-33 14-24L14-2Z" fill="#f2d98a" ${O}/>
    <path d="M-14-6H14" stroke="#c8102e" stroke-width="3.4"/><path d="M0-40V-6" stroke="#c8102e" stroke-width="3.4"/>
    <circle cx="0" cy="-22" r="2.6" fill="#2f80ed" stroke="#1c1c28" stroke-width=".8"/>`,
  helmet: h => `<path d="M-25 3C-25-20-11-29 2-29C17-29 27-20 27 3C14 6-12 6-25 3Z" fill="${h.c1}" ${O}/>
    <path d="M-25 3C-12 6 14 6 27 3" stroke="${dk(h.c1, .4)}" stroke-width="2.6" fill="none"/>
    ${[[-14, -16], [-4, -22], [8, -21], [16, -12], [-8, -8], [4, -10], [12, -3], [-18, -4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${dk(h.c1, .3)}"/>`).join('')}
    <ellipse cx="-8" cy="-19" rx="7" ry="3.4" fill="#fff" opacity=".22" transform="rotate(-25 -8 -19)"/>
    <path d="M-15 4C-17 13-11 22 2 24" stroke="#6e5a2e" stroke-width="2" fill="none"/>`,
  antennae: h => { const c = h.c1, d = dk(c, .35);
    const stalk = (x0, x1, y1, r, far) => { const p = `M${x0} 3C${x0} -8 ${x1 - 4} ${y1 + 14} ${x1} ${y1 + r - 1}`;
      return `<path d="${p}" stroke="${d}" stroke-width="${far ? 4.4 : 4.8}" fill="none" stroke-linecap="round"/><path d="${p}" stroke="${far ? dk(c, .14) : c}" stroke-width="${far ? 2.6 : 3}" fill="none" stroke-linecap="round"/>
      <circle cx="${x1}" cy="${y1}" r="${r}" fill="${far ? '#e4e4e4' : '#fff'}" ${O}/><circle cx="${x1 + r * .35}" cy="${y1 + .5}" r="${r * .52}" fill="${far ? dk(c, .45) : dk(c, .3)}"/>
      <circle cx="${x1 + r * .46}" cy="${y1 + .5}" r="${r * .26}" fill="#111"/><circle cx="${x1 + r * .18}" cy="${y1 - r * .36}" r="${r * .18}" fill="#fff"/>`; };
    return `<g class="hat-wobble">${stalk(-9, -16, -30, 5.5, true)}${stalk(5, 10, -36, 6.5, false)}</g>`; },
  cap: (h, id) => { const c = h.c1, d = dk(c, .3), crown = 'M-22 4C-24-12-12-24 1-24C15-24 25-13 23 4C10 1-9 1-22 4Z';
    return `<defs><clipPath id="${id}cp"><path d="${crown}"/></clipPath></defs>
    <path d="M15 1C25-2 36-1 42 4C40 7 30 8 17 6Z" fill="${dk(c, .18)}" ${O}/>
    <path d="M19 3C27 2 35 2.5 40 4.6" stroke="${d}" stroke-width=".9" fill="none" stroke-dasharray="1.6 1.3"/>
    <path d="${crown}" fill="${c}"/>
    <g clip-path="url(#${id}cp)" fill="none"><path d="M1-24C3-14 6-5 9 4M1-24C-4-14-8-5-11 4M1-24C10-16 16-8 19 4" stroke="${d}" stroke-width="1"/>
      <path d="M-22 4C-9 1 10 1 23 4L23 0C10-3-9-3-22 0Z" fill="${d}" opacity=".45"/></g>
    <path d="${crown}" fill="none" ${O}/>
    <circle cx="-9" cy="-11" r="1" fill="${d}"/>
    <path d="M-14-14C-11-19-5-22 1-22" stroke="#fff" stroke-width="2.2" opacity=".35" fill="none" stroke-linecap="round"/>
    <ellipse cx="1" cy="-23.8" rx="3.2" ry="1.7" fill="${dk(c, .2)}" ${O}/>`; },
};
export const ROBOT = `   /* the cardboard box head (now a Face item, faces.js), in the duck's own space */
  <path d="M46 14L104 14L114 6L58 6Z" fill="#d9b07a" ${O}/><path d="M104 14L114 6L114 60L104 68Z" fill="#a87b45" ${O}/>
  <rect x="46" y="14" width="58" height="54" fill="#c89b62" ${O}/>
  <rect x="56" y="26" width="13" height="10" rx="2" fill="#2b2b2b"/><rect x="80" y="26" width="13" height="10" rx="2" fill="#2b2b2b"/>
  <circle cx="62.5" cy="31" r="2.2" fill="#7df9ff"/><circle cx="86.5" cy="31" r="2.2" fill="#7df9ff"/>
  <rect x="58" y="47" width="34" height="9" rx="2" fill="#2b2b2b"/><path d="M63 47v9M68 47v9M73 47v9M78 47v9M83 47v9M88 47v9" stroke="#c89b62" stroke-width="1.6"/>
  <rect x="46" y="38" width="58" height="5" fill="#e8dcc0" opacity=".85"/>
  <path d="M80 6L80-8" stroke="#555" stroke-width="2.4"/><circle cx="80" cy="-11" r="4" fill="#ef3b3b" ${O}/>`;

/* the hat's layers for a duck: { back, front } */
let uid = 0;
export function hatLayers(hat) {
  const def = hat && hatById(hat.id); if (!def) return { back: '', front: '' };
  const h = { ...Object.fromEntries((def.colors || []).map(([k, , d]) => [k, d])), ...hat, metal: hat.metal || 'gold' };
  const id = 'ht' + (++uid);
  const front = `<g transform="translate(76 18) rotate(-6)">${DRAW[def.id](h, id)}</g>`;
  const back = def.id === 'afro' ? DRAW.afroBack(h) : def.id === 'veil' ? DRAW.veilBack(h) : '';
  return { back, front };
}

/* a hat on its own in a 32 × 32 tile (for player-card patterns) */
export function hatTile(hatId, color) {
  const def = hatById(hatId); if (!def) return '';
  const h = { ...Object.fromEntries((def.colors || []).map(([k, , d]) => [k, d])), metal: 'gold', ketchup: true };
  if (color && def.colors) h.c1 = color;
  const id = 'hp' + (++uid);
  if (def.id === 'afro') return `<g transform="translate(16 17) scale(.38) translate(-71 -28)">${DRAW.afroBack(h)}</g>`;
  if (def.id === 'eye') return `<g transform="translate(16 30) scale(.62)">${DRAW.eye(h, id).replace('class="hat-float" ', '')}</g>`;
  const tall = { wizard: 1, dunce: 1, crown: .9, gele: .9, cheese: .9 }[def.id] || .8;
  return `<g transform="translate(16 ${def.id === 'sombrero' ? 22 : 27}) scale(${(def.id === 'sombrero' ? .32 : .48 / tall).toFixed(2)})">${DRAW[def.id](h, id)}</g>`;
}
