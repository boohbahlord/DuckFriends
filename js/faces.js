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
  { id: 'aviators', name: 'Aviator sunglasses' },
  { id: 'shades', name: 'Sunglasses' },
  { id: 'blindfold', name: 'Blindfold', colors: [['c1', 'Cloth', '#1c1c28']] },
  { id: 'bag', name: 'Paper bag' },
  { id: 'ski', name: 'Ski mask', colors: [['c1', 'Mask', '#26262e'], ['c2', 'Stripe', '#ef3b3b']] },
  { id: 'pumpkin', name: 'Pumpkin head' },
  { id: 'scifi', name: 'Armored helmet', tip: 'A sci-fi soldier\'s helmet with a gold visor, to go with the armor.', colors: [['c1', 'Armor', '#5d6b4a']] },
  { id: 'gasmask', name: 'Gas mask' },
  { id: 'clown', name: 'Clown nose' },
  { id: 'sleep', name: 'Sleep mask', colors: [['c1', 'Mask', '#f7a8c8']] },
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

const DRAW = {
  moto: (f, id) => `<defs><linearGradient id="${id}v" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#5b6d8a"/><stop offset=".45" stop-color="#1a2333"/><stop offset="1" stop-color="#0b0f17"/></linearGradient></defs>
    <path d="M51 40C49 19 65 9 80 9C97 9 108 21 109 35L113 50C106 58 90 62 74 61C60 61 51 53 51 40Z" fill="${f.c1}" ${O}/>
    <path d="M55 30C62 18 76 13 92 13" stroke="${f.c2}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M78 25C91 22 106 27 109 36C106 43 94 45 80 42C75 37 75 30 78 25Z" fill="url(#${id}v)" ${O}/>
    <path d="M82 27C90 25 100 27 104 31" stroke="#fff" stroke-width="1.6" opacity=".55" fill="none"/>
    <path d="M98 50L108 48M97 54L107 52" stroke="${dk(f.c1, .4)}" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="64" cy="22" rx="8" ry="4" fill="#fff" opacity=".3" transform="rotate(-30 64 22)"/>`,
  glasses: f => `${arm(f.c1)}<rect x="77" y="28" width="15" height="12" rx="3" fill="#fff" fill-opacity=".18" stroke="${f.c1}" stroke-width="2.4"/>
    <path d="M92 33L97 34" stroke="${f.c1}" stroke-width="2.2"/><path d="M80 30L84 30" stroke="#fff" stroke-width="1.2" opacity=".7"/>`,
  round: f => `${arm(f.c1, 1.8)}<circle cx="84" cy="34" r="7" fill="#fff" fill-opacity=".15" stroke="${f.c1}" stroke-width="2"/>
    <path d="M91 34L97 34" stroke="${f.c1}" stroke-width="1.8"/><path d="M80 30C81 29 83 28 85 28" stroke="#fff" stroke-width="1.2" opacity=".7" fill="none"/>`,
  aviators: (f, id) => `<defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1a"/><stop offset=".6" stop-color="#8a5a2a" stop-opacity=".8"/><stop offset="1" stop-color="#d9a066" stop-opacity=".5"/></linearGradient></defs>
    ${arm('#c9a43a', 1.6)}<path d="M77 29C80 27 90 27 94 29C95 35 91 41 85 41C80 41 77 36 77 29Z" fill="url(#${id}a)" stroke="#c9a43a" stroke-width="1.7"/>
    <path d="M94 30L98 30M94 33L98 32" stroke="#c9a43a" stroke-width="1.5"/><path d="M80 31L86 30" stroke="#fff" stroke-width="1.4" opacity=".6"/>`,
  shades: () => `${arm('#111', 2.6)}<path d="M75 27L95 27L92 37C89 41 80 41 77 37Z" fill="#111" ${O}/>
    <path d="M75 27L95 27" stroke="#111" stroke-width="3.6"/><path d="M79 30L84 30" stroke="#fff" stroke-width="1.6" opacity=".55"/><path d="M95 29L98 30" stroke="#111" stroke-width="2.4"/>`,
  blindfold: f => `<path d="M52 35C46 40 42 46 41 53L45 53C47 47 50 42 54 38Z M53 37C50 44 49 51 50 57L54 56C53 50 54 44 56 39Z" fill="${dk(f.c1, .1)}" ${O}/>
    <path d="M53 30C66 26 86 25 99 28L99 39C86 36 66 37 53 41Z" fill="${f.c1}" ${O}/>
    <path d="M57 33C70 30 86 30 97 32" stroke="${lt(f.c1, .25)}" stroke-width="1.2" fill="none"/><circle cx="53" cy="36" r="4" fill="${f.c1}" ${O}/>`,
  bag: () => `<path d="M47 12L53 7L59 12L65 6L71 12L77 6L83 12L89 6L95 12L101 6L107 11L112 64L46 66Z" fill="#c8a46a" ${O}/>
    <path d="M47 18L108 15" stroke="#a8844a" stroke-width="1.4"/><path d="M60 22L58 62M96 20L99 62" stroke="#b5935a" stroke-width="1" opacity=".7"/>
    <ellipse cx="86" cy="31" rx="4.4" ry="5" fill="#1c1c28"/><ellipse cx="101" cy="30" rx="4" ry="4.8" fill="#1c1c28"/>
    <path d="M86 47C91 51 98 51 103 46" stroke="#1c1c28" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  ski: (f, id) => `<defs><mask id="${id}m"><rect width="120" height="120" fill="#fff"/><ellipse cx="85" cy="34" rx="8" ry="6" fill="#000"/><ellipse cx="99" cy="45" rx="6.5" ry="5" fill="#000"/></mask></defs>
    <g mask="url(#${id}m)"><circle cx="76" cy="40" r="25" fill="${f.c1}" ${O}/>
    <g stroke="${lt(f.c1, .12)}" stroke-width="1.1">${[58, 63, 68, 73, 78, 83, 88, 93].map(x => `<path d="M${x} 17V63"/>`).join('')}</g>
    <path d="M52 30C64 22 88 20 100 28" stroke="${f.c2}" stroke-width="4" fill="none"/></g>
    <ellipse cx="85" cy="34" rx="8" ry="6" fill="none" stroke="${dk(f.c1, .3)}" stroke-width="1.6"/><ellipse cx="99" cy="45" rx="6.5" ry="5" fill="none" stroke="${dk(f.c1, .3)}" stroke-width="1.6"/>`,
  pumpkin: (f, id) => `<defs><radialGradient id="${id}p" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#ffb04a"/><stop offset=".6" stop-color="#f07f15"/><stop offset="1" stop-color="#b9560a"/></radialGradient></defs>
    <path d="M78 12C77 7 79 3 83 1" stroke="#4a6b2a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="79" cy="39" rx="32" ry="27" fill="url(#${id}p)" ${O}/>
    <path d="M79 12C70 22 70 56 79 66M79 12C88 22 88 56 79 66M64 15C54 26 54 54 64 63M94 15C104 26 104 54 94 63" stroke="#c96a10" stroke-width="1.4" fill="none"/>
    <path d="M82 28L90 36L82 37Z M96 27L104 35L96 36Z" fill="#3a1d05"/><path d="M83 30L88 35L83 35Z M97 29L102 34L97 34Z" fill="#ffd25a" opacity=".85"/>
    <path d="M82 48L86 52L90 48L94 52L98 48L102 51C99 57 87 58 82 52Z" fill="#3a1d05"/>`,
  scifi: (f, id) => `<defs><linearGradient id="${id}g" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".35" stop-color="#f2b92a"/><stop offset=".55" stop-color="#8a5a00"/><stop offset=".75" stop-color="#e2a12a"/><stop offset="1" stop-color="#5e3a00"/></linearGradient></defs>
    <path d="M51 42C49 20 63 9 80 9C97 9 109 19 111 34L113 50C105 58 90 62 76 62C60 62 51 54 51 42Z" fill="${f.c1}" ${O}/>
    <path d="M58 22C66 14 78 12 90 13M54 46C60 54 68 58 78 59" stroke="${dk(f.c1, .35)}" stroke-width="1.6" fill="none"/>
    <path d="M79 23C93 21 108 27 111 36C107 44 93 46 80 42C75 36 75 28 79 23Z" fill="url(#${id}g)" ${O}/>
    <path d="M83 26C92 24 101 26 106 30" stroke="#fff" stroke-width="1.6" opacity=".6" fill="none"/>
    <circle cx="63" cy="40" r="6.5" fill="${dk(f.c1, .25)}" ${O}/><circle cx="63" cy="40" r="2.4" fill="${lt(f.c1, .3)}"/>
    <path d="M100 50L110 48" stroke="${dk(f.c1, .4)}" stroke-width="2"/><ellipse cx="66" cy="20" rx="8" ry="3.6" fill="#fff" opacity=".25" transform="rotate(-25 66 20)"/>`,
  gasmask: (f, id) => `<defs><radialGradient id="${id}e" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#d9f2ff"/><stop offset=".6" stop-color="#7aa3b8"/><stop offset="1" stop-color="#3a5566"/></radialGradient></defs>
    <path d="M70 26L53 22M68 44L51 49" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M70 22C86 16 102 24 104 36C106 48 98 58 84 60C74 60 68 52 68 42Z" fill="#3a3f3a" ${O}/>
    <circle cx="84" cy="33" r="7.5" fill="#222" ${O}/><circle cx="84" cy="33" r="5.6" fill="url(#${id}e)"/>
    <g transform="rotate(22 104 47)"><rect x="96" y="40" width="17" height="14" rx="3" fill="#6b7a5a" ${O}/><path d="M100 41V53M104 41V53M108 41V53" stroke="#4a5640" stroke-width="1.4"/></g>`,
  clown: (f, id) => `<defs><radialGradient id="${id}n" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".55" stop-color="#e01b1b"/><stop offset="1" stop-color="#8a0a0a"/></radialGradient></defs>
    <circle cx="110" cy="40" r="7" fill="url(#${id}n)" ${O}/><ellipse cx="107.6" cy="37.4" rx="2.2" ry="1.4" fill="#fff" opacity=".75"/>`,
  sleep: f => `<path d="M54 31L78 30M96 31L101 32" stroke="${dk(f.c1, .2)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M76 28C82 25 94 26 97 30C98 36 94 41 86 41C80 41 76 36 76 28Z" fill="${f.c1}" ${O}/>
    <path d="M80 35C84 38 89 38 93 35" stroke="#1c1c28" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M82 37L81 39M86 38V40M90 37L91 39" stroke="#1c1c28" stroke-width="1.1" stroke-linecap="round"/>
    <text x="96" y="22" font-family="Georgia, serif" font-weight="700" font-size="7" fill="${dk(f.c1, .3)}">z</text><text x="101" y="16" font-family="Georgia, serif" font-weight="700" font-size="9" fill="${dk(f.c1, .3)}">z</text>`,
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
export function faceLayer(face) {
  const def = face && faceById(face.id); if (!def) return '';
  const f = { ...Object.fromEntries((def.colors || []).map(([k, , d]) => [k, d])), ...face };
  return DRAW[def.id](f, 'fc' + (++uid));
}
/* a face item on its own in a 32 × 32 tile (card patterns) */
export function faceTile(id) {
  if (!faceById(id)) return '';
  return `<g transform="translate(16 16) scale(.48) translate(-80 -37)">${faceLayer({ id })}</g>`;
}
