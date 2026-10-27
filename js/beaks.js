/* ---------- beaks ----------
   Drawn in the duck's own 120 × 120 space, where the default beak starts at the face (x ≈ 96) and points right with its
   tip at 116 (upper half from y 33 to 43, the lower from 42 to 49). Only the block beak and the flat geometric beak can be
   recolored; their two colors show under Colors only while one of them is on. */
import { blockSquares } from './styles.js';
const O = 'stroke-linejoin="round"';
const ORANGE = ['#ff9a1f', '#f07f0e', '#c45f00'];   // top, bottom, edge

export const BEAKS = [
  { id: 'default', name: 'Duck beak' },
  { id: 'long', name: 'Long beak' },
  { id: 'short', name: 'Short beak' },
  { id: 'tall', name: 'Tall beak' },
  { id: 'round', name: 'Round beak' },
  { id: 'teeth', name: 'Beak with teeth', tip: 'Little reptile teeth, for a raptor.' },
  { id: 'eagle', name: 'Eagle beak' },
  { id: 'trunk', name: 'Elephant trunk' },
  { id: 'pelican', name: 'Pelican beak' },
  { id: 'blocks', name: 'Block beak', colors: [['beakColor', 'Beak', '#ff9a1f'], ['beakColor2', 'Beak shade', '#c45f00']] },
  { id: 'geo', name: 'Flat beak', tip: 'Simple flat shapes.', colors: [['beakColor', 'Beak', '#ff9a1f'], ['beakColor2', 'Beak shade', '#c45f00']] },
  { id: 'none', name: 'No beak' },
  { id: 'hole', name: 'A round hole' },
];
export const beakById = id => BEAKS.find(b => b.id === id) || BEAKS[0];
/* how Customize shows the beaks: in groups, each under a small heading */
export const BEAK_GROUPS = [
  ['Duck beaks', ['default', 'long', 'short', 'tall', 'round']],
  ['Other animals', ['teeth', 'eagle', 'pelican', 'trunk']],
  ['To match a style', ['blocks', 'geo']],
  ['Odd', ['hole']],
];

/* a duck-beak shape: from the face at x0, upper half up to `top`, tip at x1 (y tipY), lower half down to `bot` */
const duckBeak = ({ x0 = 96, x1 = 116, top = 33, tipY = 39, mid = 42.5, bot = 49, hl = true } = {}) => {
  const [a, b, e] = ORANGE, w = x1 - x0;
  return `<path d="M${x0} ${top + 2}C${x0 + w * .4} ${top - 1} ${x1 - 3} ${top + 1} ${x1} ${tipY}C${x1 - w * .25} ${mid} ${x0 + w * .35} ${mid + 1} ${x0 + .5} ${mid}Z" fill="${a}" stroke="${e}" stroke-width="1.6" ${O}/>
<path d="M${x0 + .5} ${mid}C${x0 + w * .35} ${mid + 1} ${x1 - w * .15} ${mid + 1} ${x1 - 3} ${mid + 3}C${x1 - w * .4} ${bot} ${x0 + w * .25} ${bot} ${x0 - .5} ${bot - 2.5}Z" fill="${b}" stroke="${e}" stroke-width="1.6" ${O}/>
${hl ? `<ellipse cx="${(x0 + w * .4).toFixed(1)}" cy="${top + 3.4}" rx="${(w * .2).toFixed(1)}" ry="1.3" fill="#fff" opacity=".5"/>` : ''}`;
};

const DRAW = {
  default: () => `<path d="M96 35C104 32 113 34 116 39C111 42.5 103 43.5 96.5 42.5Z" fill="#ff9a1f" stroke="#c45f00" stroke-width="1.6" ${O}/>
<path d="M96.5 42.5C103 43.5 110 43.5 113 45.5C108 49.5 100.5 49.5 95.5 46.5Z" fill="#f07f0e" stroke="#c45f00" stroke-width="1.6" ${O}/>
<ellipse cx="104" cy="36.4" rx="4" ry="1.3" fill="#fff" opacity=".5"/>`,
  long: () => duckBeak({ x1: 123, tipY: 39.5 }),
  short: () => duckBeak({ x1: 108, tipY: 39.5, mid: 42.5 }),
  tall: () => duckBeak({ x1: 114, top: 29, tipY: 39, mid: 43, bot: 54 }),
  round: () => `<path d="M95 33C104 28 116 31 116 40C116 49 104 52 95 47Z" fill="#ff9a1f" stroke="#c45f00" stroke-width="1.6" ${O}/>
<path d="M96 42C102 43 110 43 115 41" stroke="#c45f00" stroke-width="1.4" fill="none"/><ellipse cx="104" cy="34.5" rx="5" ry="1.8" fill="#fff" opacity=".5"/>`,
  teeth: () => `${duckBeak({ x1: 119, tipY: 39.5, hl: false })}
<path d="M100 42.6l1.4 2.6 1.4-2.5 1.4 2.6 1.4-2.5 1.4 2.5 1.4-2.4 1.4 2.4 1.4-2.3 1.4 2.2 1.4-2.1" fill="#fffef4" stroke="#7a5a2a" stroke-width=".6" ${O}/>
<path d="M101 42.4l1.2-2.2 1.2 2.2 1.2-2.2 1.2 2.2 1.2-2.1 1.2 2.1 1.2-2 1.2 2" fill="#fffef4" stroke="#7a5a2a" stroke-width=".6" ${O}/>`,
  eagle: () => `<path d="M95 33C103 27 115 29 119 37C121 42 119 48 115 50C116 46 115 43 112 42C106 43 100 44 95 44Z" fill="#f6c32a" stroke="#9a6a0a" stroke-width="1.6" ${O}/>
<path d="M115 50C116 46 115 43 112 42C114 44 115 47 115 50Z" fill="#5a4a2a"/>
<path d="M95 44C101 44 107 44 111 45C107 48 101 49 96 48Z" fill="#e3a915" stroke="#9a6a0a" stroke-width="1.4" ${O}/>
<ellipse cx="103" cy="33" rx="5" ry="1.6" fill="#fff" opacity=".5"/><circle cx="101" cy="37" r="1" fill="#7a5a1a"/>`,
  trunk: () => `<path d="M94 34C104 30 112 34 114 44C116 54 112 64 104 66C100 67 97 64 99 61C103 60 107 56 107 48C107 42 102 40 95 44Z" fill="#9aa1ab" stroke="#5f6670" stroke-width="1.6" ${O}/>
<path d="M104 38C107 40 109 43 109 47M108 52L111 51M106 56L109 56M103 59L106 60" stroke="#6f7680" stroke-width="1.1" fill="none"/>
<ellipse cx="101.5" cy="63.6" rx="2.4" ry="1.4" fill="#4a4f57"/><ellipse cx="100" cy="35.5" rx="4" ry="1.4" fill="#fff" opacity=".35"/>`,
  pelican: () => `<path d="M94 46C102 52 118 60 128 56C127 52 120 46 96 42Z" fill="#f2a07a" stroke="#b96a4a" stroke-width="1.4" ${O}/>
<path d="M96 35C108 34 122 37 130 41C122 43 106 43 96 42Z" fill="#ffb347" stroke="#c45f00" stroke-width="1.5" ${O}/>
<path d="M130 41C128 42 127 44 126 45" stroke="#c45f00" stroke-width="1.4" fill="none"/><ellipse cx="108" cy="37.4" rx="7" ry="1.1" fill="#fff" opacity=".5"/>`,
  blocks: L => { const a = L.beakColor || '#ff9a1f', b = L.beakColor2 || '#c45f00', s = 4.4;   // (the Blocks duck's own hairline seams: blockSquares)
    return blockSquares([[0, 0, a], [1, 0, a], [2, 0, a], [3, 0, a], [0, 1, a], [1, 1, a], [2, 1, a], [3, 1, a], [4, 1, a], [0, 2, b], [1, 2, b], [2, 2, b], [3, 2, b], [0, 3, b], [1, 3, b]].map(([x, y, c]) => [+(95 + x * s).toFixed(1), +(33 + y * s).toFixed(1), s, c])); },
  geo: L => `<path d="M95 33L117 40L95 42Z" fill="${L.beakColor || '#ff9a1f'}"/><path d="M95 42L112 43L95 48Z" fill="${L.beakColor2 || '#c45f00'}"/>`,
  none: () => '',
  hole: (L, id) => `<defs><radialGradient id="${id}h" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#14141c"/><stop offset="1" stop-color="#2b2b38"/></radialGradient></defs>
<ellipse cx="96" cy="42" rx="5.6" ry="5" fill="url(#${id}h)" stroke="#000" stroke-opacity=".35" stroke-width="1"/>`,
};
let uid = 0;
export function beakSVG(L) { return (DRAW[L.beak] || DRAW.default)(L, 'bk' + (++uid)); }
