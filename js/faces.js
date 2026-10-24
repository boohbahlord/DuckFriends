/* ---------- face items ----------
   Worn over the face (glasses, masks, helmets, anything that covers it), with or without a hat. Drawn in the duck's own
   120 × 120 space after its eyes and beak and before its hat: the head is centered at (76, 40) with a radius of 23, the
   eye at (83, 34), the beak from x = 96 to its tip at 116. A face item can also be a player card's pattern. Items that
   can be recolored name their colors (c1, c2), which show under Colors. */
import { ROBOT } from './hats.js';

export const FACES = [
  { id: 'moto', name: 'Motorcycle helmet', colors: [['c1', 'Helmet', '#d7263d'], ['c2', 'Stripe', '#ffffff']] },
  { id: 'glasses', name: 'Glasses', colors: [['c1', 'Frames', '#1c1c28']] },
  { id: 'round', name: 'Round glasses', colors: [['c1', 'Frames', '#8a6a2a']] },
  { id: 'aviators', name: 'Aviator sunglasses', tip: 'Gold rims and yellow lenses, like Raoul Duke\'s in Fear and Loathing in Las Vegas.' },
  { id: 'shades', name: 'Sunglasses' },
  { id: 'blindfold', name: 'Blindfold', colors: [['c1', 'Cloth', '#1c1c28']] },
  { id: 'bag', name: 'Paper bag' },
  { id: 'ski', name: 'Ski mask', colors: [['c1', 'Mask', '#26262e']] },
  { id: 'pumpkin', name: 'Pumpkin head' },
  { id: 'scifi', name: 'Armored helmet', tip: 'A sci-fi soldier\'s helmet with a gold visor, to go with the armor.', colors: [['c1', 'Armor', '#5d6b4a']] },
  { id: 'gasmask', name: 'Gas mask' },
  { id: 'clown', name: 'Clown nose' },
  { id: 'sleep', name: 'Sleep mask', tip: 'The blue of the nightcap and the pajamas.', colors: [['c1', 'Mask', '#4a6fd8']] },
  { id: 'box', name: 'Cardboard box', tip: 'A cardboard robot head over the whole face.' },
  { id: 'monocle', name: 'Monocle' },
  { id: 'patch', name: 'Eye patch' },
  { id: 'hero', name: 'Hero mask', colors: [['c1', 'Mask', '#1f6feb']] },
  { id: 'vr', name: 'VR headset' },
];
export const faceById = id => FACES.find(f => f.id === id) || null;

const O = 'stroke="#1c1c28" stroke-width="1.6" stroke-linejoin="round"';
const dk = (hex, t) => { const n = parseInt(String(hex).slice(1), 16) || 0, c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * (1 - t))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
const lt = (hex, t) => { const n = parseInt(String(hex).slice(1), 16) || 0, c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
const arm = (c, w = 2.2) => `<path d="M77 32L56 30" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;

/* where the clown nose sits: on top of the beak, near its front */
const NOSE = { default: [110, 32.5], long: [116, 32.5], short: [104, 33], tall: [107, 28.5], round: [109, 29.5], teeth: [112, 32.5], eagle: [110, 27],
  trunk: [105, 29], pelican: [118, 34], blocks: [108, 30], geo: [108, 33], none: [97, 40], hole: [97, 41] };
const DRAW = {
  moto: (f, id) => `<defs><linearGradient id="${id}v" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="#6f86a8" stop-opacity=".92"/><stop offset=".4" stop-color="#1c2638" stop-opacity=".84"/><stop offset="1" stop-color="#0b0f17" stop-opacity=".9"/></linearGradient>
    <radialGradient id="${id}s" cx=".35" cy=".25" r=".85"><stop offset="0" stop-color="${lt(f.c1, .35)}"/><stop offset=".5" stop-color="${f.c1}"/><stop offset="1" stop-color="${dk(f.c1, .35)}"/></radialGradient></defs>
    <path d="M53 59C44 47 44 23 58 12C71 3 92 6 101 18C104 22 105.5 26 104.5 29L100 34C95 37 93 40 92.5 46L98 48C100.5 51.5 101 55 99 59C90 63.5 63 64 53 59Z" fill="url(#${id}s)" ${O}/>
    <path d="M51 33C55 18 74 7 96 13" stroke="${f.c2}" stroke-width="4.2" fill="none" stroke-linecap="round"/>
    <path d="M100 34C95 37 93 40 92.5 46L98 48" stroke="#1c1c28" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
    <path d="M54 59.5C64 64 90 63.5 99 59.5" stroke="#1c1c28" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M93.5 52L98 52.6M93.5 55.2L98.6 55.8" stroke="#1c1c28" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M66 34C70 28 80 24 92 23L103 23.5C105 27 104.5 30.5 102 33.5C95 37 88 40.5 80 41.5C74 41.5 69 40.5 66 39Z" fill="url(#${id}v)" ${O}/>
    <path d="M74 27.6C82 25 92 24.5 100 25.4" stroke="#fff" stroke-width="1.3" opacity=".55" fill="none"/>
    <path d="M77 39.4C85 38.6 93 36.4 99 33.6" stroke="#9fd0ff" stroke-width=".9" opacity=".4" fill="none"/>
    <circle cx="68" cy="36.5" r="3" fill="#2b2b33" stroke="#0e0e14" stroke-width="1"/><circle cx="68" cy="36.5" r="1" fill="#8a8a96"/>
    <path d="M93 11.5L98 15M90 9.6L95 12.6" stroke="#1c1c28" stroke-width="1.3" stroke-linecap="round"/>
    <ellipse cx="64" cy="19" rx="9" ry="4" fill="#fff" opacity=".3" transform="rotate(-30 64 19)"/>`,
  glasses: f => `${arm(f.c1)}<rect x="77" y="28" width="15" height="12" rx="3" fill="#fff" fill-opacity=".18" stroke="${f.c1}" stroke-width="2.4"/>
    <path d="M92 33L97 34" stroke="${f.c1}" stroke-width="2.2"/><path d="M80 30L84 30" stroke="#fff" stroke-width="1.2" opacity=".7"/>`,
  round: f => `${arm(f.c1, 1.8)}<circle cx="84" cy="34" r="7" fill="#fff" fill-opacity=".15" stroke="${f.c1}" stroke-width="2"/>
    <path d="M91 34L97 34" stroke="${f.c1}" stroke-width="1.8"/><path d="M80 30C81 29 83 28 85 28" stroke="#fff" stroke-width="1.2" opacity=".7" fill="none"/>`,
  aviators: (f, id) => `<defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8520a" stop-opacity=".92"/><stop offset=".5" stop-color="#e0901a" stop-opacity=".78"/><stop offset="1" stop-color="#f5c842" stop-opacity=".6"/></linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e08a"/><stop offset=".5" stop-color="#b8860b"/><stop offset="1" stop-color="#6b4a06"/></linearGradient></defs>
    <g transform="translate(84 34) scale(1.22) translate(-84 -34)"><path d="M75.5 30L61 31.5C58 32 56.5 34 56.5 37" stroke="url(#${id}g)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M96.2 28.6C98.4 28 100.2 28.6 100.6 30.6C101 34.6 100 38.6 98 39.6C96.6 40 95.8 38 95.8 34.4Z" fill="url(#${id}a)" stroke="url(#${id}g)" stroke-width="1.3"/>
    <path d="M75.4 29.2C75.6 27 78.6 26 83.4 26.4L91 27.2C93.2 27.6 94 29.4 93.6 32.6C92.8 38.8 89.6 43.6 85 43.6C79 43.6 75.2 39 74.8 34C74.6 32 74.8 30.4 75.4 29.2Z" fill="url(#${id}a)" stroke="url(#${id}g)" stroke-width="1.6"/>
    <path d="M76 26.6C82 24.8 92 25.2 99.5 27.4" stroke="url(#${id}g)" stroke-width="1.4" fill="none"/>
    <path d="M93.4 30.6C94.4 30 95.2 30 96 30.4" stroke="url(#${id}g)" stroke-width="1.3" fill="none"/>
    <path d="M78 30.6L82 28.6M78.6 34.6L86 29.4" stroke="#fff" stroke-width="1.1" opacity=".6" stroke-linecap="round"/></g>`,
  shades: () => `${arm('#111', 2.6)}<path d="M75 27L95 27L92 37C89 41 80 41 77 37Z" fill="#111" ${O}/>
    <path d="M75 27L95 27" stroke="#111" stroke-width="3.6"/><path d="M79 30L84 30" stroke="#fff" stroke-width="1.6" opacity=".55"/><path d="M95 29L98 30" stroke="#111" stroke-width="2.4"/>`,
  blindfold: f => `<path d="M52 35C46 40 42 46 41 53L45 53C47 47 50 42 54 38Z M53 37C50 44 49 51 50 57L54 56C53 50 54 44 56 39Z" fill="${dk(f.c1, .1)}" ${O}/>
    <path d="M53 30C66 26 86 25 99 28L99 39C86 36 66 37 53 41Z" fill="${f.c1}" ${O}/>
    <path d="M57 33C70 30 86 30 97 32" stroke="${lt(f.c1, .25)}" stroke-width="1.2" fill="none"/><circle cx="53" cy="36" r="4" fill="${f.c1}" ${O}/>`,
  bag: () => `<path d="M47 12L53 7L59 12L65 6L71 12L77 6L83 12L89 6L95 12L101 6L107 11L112 64L46 66Z" fill="#c8a46a" ${O}/>
    <path d="M47 18L108 15" stroke="#a8844a" stroke-width="1.4"/><path d="M60 22L58 62M96 20L99 62" stroke="#b5935a" stroke-width="1" opacity=".7"/>
    <ellipse cx="86" cy="31" rx="4.4" ry="5" fill="#1c1c28"/><ellipse cx="101" cy="30" rx="4" ry="4.8" fill="#1c1c28"/>
    <path d="M86 47C91 51 98 51 103 46" stroke="#1c1c28" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  ski: (f, id) => `<defs><mask id="${id}m"><rect x="-20" y="-40" width="160" height="180" fill="#fff"/><ellipse cx="84" cy="34" rx="7.6" ry="6.2" fill="#000"/><ellipse cx="98.5" cy="41" rx="5" ry="7.6" fill="#000"/></mask>
    <pattern id="${id}k" width="3.2" height="3" patternUnits="userSpaceOnUse"><path d="M.8 0L1.6 1.5L2.4 0M.8 3L1.6 1.5L2.4 3" stroke="${lt(f.c1, .18)}" stroke-width=".55" fill="none"/><path d="M0 0V3" stroke="${dk(f.c1, .3)}" stroke-width=".5"/></pattern>
    <radialGradient id="${id}sh" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>
    <g mask="url(#${id}m)"><circle cx="76" cy="40" r="25.5" fill="${f.c1}" ${O}/><circle cx="76" cy="40" r="25.5" fill="url(#${id}k)"/><circle cx="76" cy="40" r="25.5" fill="url(#${id}sh)"/></g>
    <ellipse cx="84" cy="34" rx="7.6" ry="6.2" fill="none" stroke="${dk(f.c1, .35)}" stroke-width="2"/><ellipse cx="98.5" cy="41" rx="5" ry="7.6" fill="none" stroke="${dk(f.c1, .35)}" stroke-width="2"/>`,
  pumpkin: (f, id) => `<defs><radialGradient id="${id}p" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#ffb04a"/><stop offset=".6" stop-color="#f07f15"/><stop offset="1" stop-color="#b9560a"/></radialGradient></defs>
    <path d="M78 12C77 7 79 3 83 1" stroke="#4a6b2a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="79" cy="39" rx="32" ry="27" fill="url(#${id}p)" ${O}/>
    <path d="M79 12C70 22 70 56 79 66M79 12C88 22 88 56 79 66M64 15C54 26 54 54 64 63M94 15C104 26 104 54 94 63" stroke="#c96a10" stroke-width="1.4" fill="none"/>
    <path d="M82 28L90 36L82 37Z M96 27L104 35L96 36Z" fill="#3a1d05"/><path d="M83 30L88 35L83 35Z M97 29L102 34L97 34Z" fill="#ffd25a" opacity=".85"/>
    <path d="M82 48L86 52L90 48L94 52L98 48L102 51C99 57 87 58 82 52Z" fill="#3a1d05"/>`,
  scifi: (f, id) => { const c = f.c1, d = dk(c, .35), l = lt(c, .2);
    return `<defs><linearGradient id="${id}g" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".3" stop-color="#f2b92a"/><stop offset=".52" stop-color="#7a4e00"/><stop offset=".62" stop-color="#c98a14"/><stop offset="1" stop-color="#4e3000"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${l}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, .3)}"/></linearGradient></defs>
    <path d="M54 56L50 38C49 24 56 14 69 9.5L87 7.5C97 8.5 104 14.5 106.5 23L107.5 30L101 34C96 37 94 40.5 93.5 46L99.5 48L101.5 55L96 60.5L62 61.5Z" fill="url(#${id}s)" ${O}/>
    <path d="M67 11L88 9L98 13.5L72 15Z" fill="${l}" stroke="${d}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M55 25L64 16L72 15M52.5 44L59 54L80 57.5M93.5 46L82 47" stroke="${d}" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
    <path d="M101 34C96 37 94 40.5 93.5 46L99.5 48" stroke="#1c1c28" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
    <path d="M56 33L62 30.5L68 33L68 40L62 43.5L56 40Z" fill="${dk(c, .15)}" ${O}/><circle cx="62" cy="37" r="2.4" fill="${d}"/>
    <path d="M95 51L100 52M95.4 54.4L100.6 55.4" stroke="${d}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M69 33.5L74.5 26.5L90.5 23L105.5 24.8L106.6 30L101 33.8L88.5 40.6L77 41.8L70 39.4Z" fill="url(#${id}g)" ${O}/>
    <path d="M76 27.6L90.5 24.6L103.5 26" stroke="#fff" stroke-width="1.4" opacity=".7" fill="none" stroke-linejoin="round"/>
    <path d="M81 38.4L96 33.6" stroke="#fff8d0" stroke-width="1" opacity=".45"/>
    <ellipse cx="66" cy="19" rx="8" ry="3" fill="#fff" opacity=".22" transform="rotate(-28 66 19)"/>`; },
  gasmask: (f, id) => `<defs><radialGradient id="${id}e" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#d9f2ff"/><stop offset=".6" stop-color="#7aa3b8"/><stop offset="1" stop-color="#3a5566"/></radialGradient></defs>
    <path d="M70 26L53 22M68 44L51 49" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M70 22C86 16 102 24 104 36C106 48 98 58 84 60C74 60 68 52 68 42Z" fill="#3a3f3a" ${O}/>
    <circle cx="84" cy="33" r="7.5" fill="#222" ${O}/><circle cx="84" cy="33" r="5.6" fill="url(#${id}e)"/>
    <g transform="rotate(22 104 47)"><rect x="96" y="40" width="17" height="14" rx="3" fill="#6b7a5a" ${O}/><path d="M100 41V53M104 41V53M108 41V53" stroke="#4a5640" stroke-width="1.4"/></g>`,
  clown: (f, id, look) => { const [x, y] = NOSE[look && look.beak] || NOSE.default;
    return `<defs><radialGradient id="${id}n" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".55" stop-color="#e01b1b"/><stop offset="1" stop-color="#8a0a0a"/></radialGradient></defs>
    <circle cx="${x}" cy="${y}" r="5.4" fill="url(#${id}n)" ${O}/><ellipse cx="${x - 1.9}" cy="${y - 2}" rx="1.8" ry="1.1" fill="#fff" opacity=".75"/>`; },
  sleep: f => `<path d="M54 31L76 30M97 31L101 32" stroke="${dk(f.c1, .25)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M75 28.5C82 25 94 25.5 97.5 30C98.5 36.5 94 41.5 86 41.5C79.5 41.5 75 36.5 75 28.5Z" fill="${f.c1}" ${O}/>
    <path d="M76.6 30C83 27 93 27.4 96 30.8" stroke="${lt(f.c1, .4)}" stroke-width="1.2" opacity=".7" fill="none" stroke-linecap="round"/>
    <path d="M77.4 36C80.4 39.8 90 40.8 95.6 36" stroke="${dk(f.c1, .2)}" stroke-width="1" stroke-dasharray="1.4 1.2" fill="none"/>`,
  box: () => ROBOT,
  monocle: () => `<path d="M84 41C82 50 76 56 70 62" stroke="#c9a43a" stroke-width="1.2" fill="none" stroke-dasharray="2 1.4"/>
    <circle cx="84" cy="34" r="7" fill="#fff" fill-opacity=".2" stroke="#c9a43a" stroke-width="2.2"/><path d="M80 30C81 29 83 28 85 28" stroke="#fff" stroke-width="1.2" opacity=".75" fill="none"/>`,
  patch: () => `<path d="M60 19L80 30M88 39L97 52" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="84" cy="34" rx="6.5" ry="7" fill="#111" ${O}/><path d="M80 30C82 29 84 29 86 30" stroke="#fff" stroke-width="1" opacity=".35" fill="none"/>`,
  hero: (f, id) => `<defs><mask id="${id}h"><rect width="120" height="120" fill="#fff"/><path d="M79 34C81 30 87 30 90 33C88 37 82 38 79 34Z" fill="#000"/></mask></defs>
    <path d="M58 31C70 26 92 24 101 29L101 38C92 41 70 41 58 38L52 40L55 34L52 28Z" fill="${f.c1}" ${O} mask="url(#${id}h)"/>
    <path d="M79 34C81 30 87 30 90 33C88 37 82 38 79 34Z" fill="none" stroke="#1c1c28" stroke-width="1.4"/>`,
  vr: () => `<path d="M74 26L55 25M80 24C77 14 68 13 61 17" stroke="#2b2b2b" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="73" y="23" width="28" height="19" rx="5" fill="#ececf2" ${O}/><rect x="95" y="25" width="7" height="15" rx="3" fill="#1c1c28"/>
    <path d="M77 27L92 27" stroke="#fff" stroke-width="2" opacity=".8"/><circle cx="98.5" cy="32.5" r="1.4" fill="#37d421"/>`,
};

/* the layer over the face, or '' */
let uid = 0;
export function faceLayer(face, look) {
  const def = face && faceById(face.id); if (!def) return '';
  const f = { ...Object.fromEntries((def.colors || []).map(([k, , d]) => [k, d])), ...face };
  return DRAW[def.id](f, 'fc' + (++uid), look);
}
/* a face item on its own in a 32 × 32 tile (card patterns) */
export function faceTile(id) {
  if (!faceById(id)) return '';
  return `<g transform="translate(16 16) scale(.48) translate(-80 -37)">${faceLayer({ id })}</g>`;
}
