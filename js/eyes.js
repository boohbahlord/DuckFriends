/* ---------- eyes ----------
   Drawn in the duck's own 120 × 120 space around the eye's spot at (83, 34) on a head centered at (76, 40). A "dead"
   duck (the kill command) shows X eyes whatever was chosen. */
export const EYES = [
  { id: 'default', name: 'Duck eyes' },
  { id: 'happy', name: 'Happy' },
  { id: 'sleepy', name: 'Sleepy' },
  { id: 'angry', name: 'Angry' },
  { id: 'googly', name: 'Googly' },
  { id: 'star', name: 'Starry' },
  { id: 'heart', name: 'Heart eyes' },
  { id: 'human', name: 'Human eye' },
  { id: 'bug', name: 'Bug eyes', tip: 'Compound eyes, like a fly\'s.' },
  { id: 'bug2', name: 'Big bug eyes', tip: 'Big glossy insect eyes.' },
  { id: 'alien', name: 'Alien eye' },
  { id: 'demon', name: 'Demon eye' },
  { id: 'coins', name: 'Coins' },
  { id: 'many', name: 'Too many eyes' },
  { id: 'holes', name: 'Holes' },
  { id: 'none', name: 'No eyes' },
];
export const eyeById = id => EYES.find(e => e.id === id) || EYES[0];

const K = '#161616';
const DRAW = {
  default: () => `<ellipse cx="83" cy="34" rx="4.3" ry="5.2" fill="${K}"/><circle cx="84.6" cy="32" r="1.7" fill="#fff"/><circle cx="82" cy="36.6" r=".8" fill="#fff" opacity=".7"/>`,
  happy: () => `<path d="M78.5 35.5C80 30.5 86 30.5 87.5 35.5" stroke="${K}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  sleepy: () => `<ellipse cx="83" cy="35.4" rx="4.3" ry="3.4" fill="${K}"/><path d="M78.2 34C80.5 32.6 85.6 32.6 87.8 34" stroke="${K}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="84.4" cy="35.6" r="1" fill="#fff"/>`,
  angry: () => `<ellipse cx="83" cy="35" rx="4" ry="4.6" fill="${K}"/><circle cx="84.4" cy="33.6" r="1.4" fill="#fff"/>
    <path d="M77 27.5L89 31" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`,
  googly: () => `<circle cx="84" cy="33" r="7.2" fill="#fff" stroke="${K}" stroke-width="1.2"/><circle cx="86" cy="36.4" r="3.6" fill="${K}"/><circle cx="85" cy="35.4" r=".9" fill="#fff"/>`,
  star: () => `<ellipse cx="83" cy="34" rx="5" ry="6" fill="#2a1d5a"/><ellipse cx="83" cy="36" rx="3.4" ry="3" fill="#6a4ad8"/>
    <path d="M84.6 29.4l.8 1.8 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.7.9.4-1.9-1.4-1.3 1.9-.3z" fill="#fff"/><circle cx="81.4" cy="37.4" r=".9" fill="#fff"/>`,
  heart: () => `<path d="M83 39.4C77.4 35.4 77 31.4 79.4 30.2C81 29.4 82.4 30.4 83 31.6C83.6 30.4 85 29.4 86.6 30.2C89 31.4 88.6 35.4 83 39.4Z" fill="#ef2d5a" stroke="#8a0a2a" stroke-width=".8"/><ellipse cx="81" cy="31.8" rx="1" ry=".6" fill="#fff" opacity=".8"/>`,
  human: (L, id) => `<defs><clipPath id="${id}e"><path d="M77 34.5C80 29.5 87 29.5 90 34.5C87 38.5 80 38.5 77 34.5Z"/></clipPath></defs>
    <path d="M77 34.5C80 29.5 87 29.5 90 34.5C87 38.5 80 38.5 77 34.5Z" fill="#fbfaf6" stroke="#5a3a2a" stroke-width=".8"/>
    <g clip-path="url(#${id}e)"><circle cx="84" cy="34.2" r="3.3" fill="#5b8a3a"/><circle cx="84" cy="34.2" r="1.6" fill="#111"/><circle cx="85" cy="33.2" r=".8" fill="#fff"/></g>
    <path d="M77 34.5C80 29.2 87 29.2 90 34.5" stroke="#2b1a10" stroke-width="1.5" fill="none"/><path d="M80 31.2L79.2 29.6M83 30.2L82.8 28.4M86 30.6L86.6 29" stroke="#2b1a10" stroke-width=".9" stroke-linecap="round"/>`,
  bug: (L, id) => `<defs><pattern id="${id}hx" width="2.6" height="2.3" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.15" r=".95" fill="#3b7a3a"/></pattern></defs>
    <ellipse cx="84" cy="33" rx="7" ry="8" fill="#163a1a" stroke="${K}" stroke-width="1.2"/><ellipse cx="84" cy="33" rx="7" ry="8" fill="url(#${id}hx)"/>
    <ellipse cx="82" cy="29.6" rx="2.6" ry="1.6" fill="#fff" opacity=".5"/>`,
  bug2: (L, id) => `<defs><radialGradient id="${id}b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#7a5a9a"/><stop offset=".45" stop-color="#2a1a3a"/><stop offset="1" stop-color="#050308"/></radialGradient></defs>
    <ellipse cx="84" cy="32" rx="9.5" ry="10.5" fill="url(#${id}b)" stroke="${K}" stroke-width="1.2"/><ellipse cx="81" cy="27.6" rx="3.4" ry="2.2" fill="#fff" opacity=".7"/><circle cx="88.6" cy="37" r="1.2" fill="#fff" opacity=".5"/>`,
  alien: () => `<path d="M77 31C80 28 88 27 91 30C91 36 86 40 81 39C77 37 76 34 77 31Z" fill="#050505"/><ellipse cx="85" cy="31" rx="2.4" ry="1.2" fill="#fff" opacity=".55" transform="rotate(-15 85 31)"/>`,
  demon: (L, id) => `<defs><radialGradient id="${id}d" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffe14a"/><stop offset=".6" stop-color="#ff6a00"/><stop offset="1" stop-color="#9a0a00"/></radialGradient></defs>
    <ellipse cx="83" cy="34" rx="5.6" ry="5" fill="url(#${id}d)" stroke="#3a0000" stroke-width="1"/><ellipse cx="83" cy="34" rx="1.1" ry="4.2" fill="#100"/>
    <path d="M76.5 29L89 31.5" stroke="#3a0000" stroke-width="2" stroke-linecap="round"/>`,
  coins: (L, id) => `<defs><radialGradient id="${id}c" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#e2b22a"/><stop offset="1" stop-color="#8a6a0a"/></radialGradient></defs>
    <circle cx="83" cy="34" r="6.6" fill="url(#${id}c)" stroke="#6a4a0a" stroke-width="1"/><circle cx="83" cy="34" r="4.8" fill="none" stroke="#9a7a1a" stroke-width=".7"/>
    <text x="83" y="36.8" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="7.5" fill="#7a5a0a">$</text>`,
  many: () => [[83, 34, 4.3], [74, 28, 3], [90, 26, 2.6], [70, 38, 2.4], [79, 23, 2.2], [88, 44, 2.6], [66, 30, 2], [76, 45, 2]].map(([x, y, r]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 1.2).toFixed(1)}" fill="${K}"/><circle cx="${(x + r * .35).toFixed(1)}" cy="${(y - r * .45).toFixed(1)}" r="${(r * .38).toFixed(1)}" fill="#fff"/>`).join(''),
  holes: (L, id) => `<defs><radialGradient id="${id}o" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#000"/><stop offset=".75" stop-color="#121218"/><stop offset="1" stop-color="#2b2b38"/></radialGradient></defs>
    <ellipse cx="83" cy="34" rx="4.6" ry="5.4" fill="url(#${id}o)"/>`,
  none: () => '',
};
let uid = 0;
export function eyesSVG(L, dead) {
  if (dead) return `<path d="M78 30l8 8M86 30l-8 8" stroke="#1b1b1b" stroke-width="2.6" stroke-linecap="round"/>`;
  return (DRAW[L.eyes] || DRAW.default)(L, 'ey' + (++uid));
}
