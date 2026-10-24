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
  { id: 'gele', name: 'Gele', tip: 'The Nigerian head tie women wear, wrapped and pleated high.', colors: [['c1', 'Gele', '#e0218a'], ['c2', 'Shimmer', '#ffd34d']] },
  { id: 'sombrero', name: 'Sombrero' },
  { id: 'dunce', name: 'Dunce hat' },
  { id: 'crown', name: 'Crown', metal: true },
  { id: 'duckling', name: 'Rubber duck', colors: [['c1', 'Duck', '#ffd23f']] },
  { id: 'eye', name: 'Floating eye' },
  { id: 'mouse', name: 'Grey mouse' },
  { id: 'bow', name: 'Ribbon bow', colors: [['c1', 'Bow', '#ff4f9a'], ['c2', 'Stripes', '#ffffff']] },
  { id: 'cap', name: 'Baseball cap', colors: [['c1', 'Cap', '#2fa4ff']] },
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
  afroBack: h => `<g fill="${h.c1}" stroke="${dk(h.c1, .35)}" stroke-width="1.4">${[[72, 34, 31], [48, 26, 11], [56, 12, 11], [70, 6, 11], [86, 8, 11], [99, 18, 10], [104, 33, 9], [44, 42, 10], [48, 56, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`,
  afro: h => `<g fill="${h.c1}" stroke="${dk(h.c1, .35)}" stroke-width="1.2">${[[-18, 6, 7], [-10, 1, 7], [-1, -1, 7], [8, 1, 6.5], [15, 5, 5.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
    <path d="M-12-1c2-2 5-2 7 0M2-2c2-2 5-1 6 1" stroke="${lt(h.c1, .35)}" stroke-width="1.2" fill="none"/>`,
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
  fila: (h, id) => `<defs><clipPath id="${id}fl"><path d="M-21-5C-24-30 8-40 26-27C31-23 25-16 18-14L20-5Z"/></clipPath></defs>
    <path d="M-21-5C-24-30 8-40 26-27C31-23 25-16 18-14L20-5Z" fill="${h.c1}" ${O}/>
    <g clip-path="url(#${id}fl)" stroke="${h.c2}" stroke-width="1.6" opacity=".85">${[-24, -18, -12, -6, 0, 6, 12, 18, 24].map(x => `<path d="M${x}-40L${x + 6} 0"/>`).join('')}</g>
    <path d="M26-27C31-23 25-16 18-14C20-19 22-23 26-27Z" fill="${dk(h.c1, .3)}"/>
    <rect x="-22" y="-7" width="44" height="8" rx="3" fill="${dk(h.c1, .25)}" ${O}/>`,
  gele: h => `${[-172, -157, -142, -127, -112, -97, -82, -67, -52, -37, -22, -8].map((a, i) => {
      const r = 36 - Math.abs(a + 95) / 8, t = a * Math.PI / 180, x = Math.cos(t) * r, y = Math.sin(t) * r - 6, w = 7;
      const px = -Math.sin(t) * w, py = Math.cos(t) * w;   // the pleat's width, across its direction
      return `<path d="M0-6Q${(x * .5 - px).toFixed(1)} ${(y * .5 - py).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}Q${(x * .5 + px).toFixed(1)} ${(y * .5 + py).toFixed(1)} 0-6Z" fill="${i % 2 ? lt(h.c1, .2) : h.c1}" stroke="${h.c2}" stroke-width="1.1"/>`;
    }).join('')}
    <path d="M-24 2C-24-10 24-12 24 0C12-3-12-3-24 2Z" fill="${dk(h.c1, .15)}" ${O}/>
    <path d="M-20-2C-8-6 8-6 20-3" stroke="${h.c2}" stroke-width="1.6" fill="none" opacity=".9"/>`,
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
    <circle cx="0" cy="-30" r="7.5" fill="#4b6584"/><circle cx="0" cy="-30" r="3.6" fill="#111"/><circle cx="2.4" cy="-32.6" r="1.6" fill="#fff"/>
    <path d="M-12-43l-2-5M0-46v-6M12-43l2-5" stroke="#1c1c28" stroke-width="1.6" stroke-linecap="round"/></g>`,
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
  cap: h => `<path d="M17 0C29-3 38 0 41 5C33 7 24 6 15 4Z" fill="${dk(h.c1, .2)}" ${O}/>
    <path d="M-22 3C-23-20 20-24 23 3C8 0-8 0-22 3Z" fill="${h.c1}" ${O}/>
    <path d="M0-21C-1-12-1-5 0 1M-12-17C-10-9-10-3-10 2M12-17C10-9 10-3 10 2" stroke="${dk(h.c1, .3)}" stroke-width="1" fill="none"/>
    <circle cx="0" cy="-21" r="2.4" fill="${dk(h.c1, .25)}" ${O}/><ellipse cx="-8" cy="-13" rx="6" ry="3" fill="#fff" opacity=".3" transform="rotate(-20 -8 -13)"/>`,
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
  const back = def.id === 'afro' ? DRAW.afroBack(h) : '';
  return { back, front };
}

/* a hat on its own in a 32 × 32 tile (for player-card patterns) */
export function hatTile(hatId, color) {
  const def = hatById(hatId); if (!def) return '';
  const h = { ...Object.fromEntries((def.colors || []).map(([k, , d]) => [k, d])), metal: 'gold', ketchup: true };
  if (color && def.colors) h.c1 = color;
  const id = 'hp' + (++uid);
  if (def.id === 'afro') return `<g transform="translate(16 18) scale(.42)">${DRAW.afroBack(h).replace(/cx="(\d+)" cy="(\d+)"/g, (m, x, y) => `cx="${x - 72}" cy="${y - 34}"`)}</g>`;
  if (def.id === 'eye') return `<g transform="translate(16 30) scale(.62)">${DRAW.eye(h, id).replace('class="hat-float" ', '')}</g>`;
  const tall = { wizard: 1, dunce: 1, crown: .9, gele: .9, cheese: .9 }[def.id] || .8;
  return `<g transform="translate(16 ${def.id === 'sombrero' ? 22 : 27}) scale(${(def.id === 'sombrero' ? .32 : .48 / tall).toFixed(2)})">${DRAW[def.id](h, id)}</g>`;
}
