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
  { id: 'alien', name: 'Alien eye', tip: 'A big, black, slanted alien eye.' },
  { id: 'demon', name: 'Demon eye' },
  { id: 'coins', name: 'Coins' },
  { id: 'many', name: 'Too many eyes' },
  { id: 'holes', name: 'Holes' },
  { id: 'none', name: 'No eyes' },
  { id: 'raptor', name: 'Raptor eye', tip: 'A yellow reptile eye with a slit. Matches the raptor.' },
  { id: 'eagle', name: 'Eagle eye', tip: 'A fierce golden eye. Matches the eagle.' },
  { id: 'pelican', name: 'Pelican eye', tip: 'A pale eye in a pink ring. Matches the pelican.' },
  { id: 'block', name: 'Block eye', tip: 'One square block. Matches the block duck.' },
  { id: 'flat', name: 'Flat eye', tip: 'A plain flat dot. Matches the 2D duck.' },
];
export const eyeById = id => EYES.find(e => e.id === id) || EYES[0];
/* how Customize shows the eyes: in groups, each under a small heading */
export const EYE_GROUPS = [
  ['Duck eyes', ['default', 'happy', 'sleepy', 'angry', 'googly']],
  ['Shiny', ['star', 'heart', 'coins']],
  ['Strange', ['human', 'bug', 'bug2', 'alien', 'demon', 'many', 'holes']],
  ['To match a style', ['raptor', 'eagle', 'pelican', 'block', 'flat']],
];

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
  alien: (L, id) => `<defs><radialGradient id="${id}a" cx=".62" cy=".42" r=".75"><stop offset="0" stop-color="#16302a"/><stop offset=".45" stop-color="#050807"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
    <path d="M72.5 24.5C79 22 89.5 27 93 34.5C94.2 38.4 90.6 41.4 86.2 40.4C78.6 38.4 72.6 32 72.5 24.5Z" fill="url(#${id}a)" stroke="#5dffa0" stroke-opacity=".45" stroke-width="1.1"/>
    <path d="M76 26.4C81 25.6 87.4 28.6 90 32.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".55"/>
    <ellipse cx="88.4" cy="37.4" rx="1.5" ry=".9" fill="#fff" opacity=".85" transform="rotate(30 88.4 37.4)"/>`,
  demon: (L, id) => `<defs><radialGradient id="${id}d" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffe14a"/><stop offset=".6" stop-color="#ff6a00"/><stop offset="1" stop-color="#9a0a00"/></radialGradient></defs>
    <ellipse cx="83" cy="34" rx="5.6" ry="5" fill="url(#${id}d)" stroke="#3a0000" stroke-width="1"/><ellipse cx="83" cy="34" rx="1.1" ry="4.2" fill="#100"/>
    <path d="M76.5 29L89 31.5" stroke="#3a0000" stroke-width="2" stroke-linecap="round"/>`,
  coins: (L, id) => `<defs><radialGradient id="${id}c" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#e2b22a"/><stop offset="1" stop-color="#8a6a0a"/></radialGradient></defs>
    <circle cx="83" cy="34" r="6.6" fill="url(#${id}c)" stroke="#6a4a0a" stroke-width="1"/><circle cx="83" cy="34" r="4.8" fill="none" stroke="#9a7a1a" stroke-width=".7"/>
    <text x="83" y="36.8" text-anchor="middle" font-family="Georgia, Gelasio, serif" font-weight="700" font-size="7.5" fill="#7a5a0a">$</text>`,
  many: () => [[83, 34, 4.3], [74, 28, 3], [90, 26, 2.6], [70, 38, 2.4], [79, 23, 2.2], [88, 44, 2.6], [66, 30, 2], [76, 45, 2]].map(([x, y, r]) =>
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 1.2).toFixed(1)}" fill="${K}"/><circle cx="${(x + r * .35).toFixed(1)}" cy="${(y - r * .45).toFixed(1)}" r="${(r * .38).toFixed(1)}" fill="#fff"/>`).join(''),
  holes: (L, id) => `<defs><radialGradient id="${id}o" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#000"/><stop offset=".75" stop-color="#121218"/><stop offset="1" stop-color="#2b2b38"/></radialGradient></defs>
    <ellipse cx="83" cy="34" rx="4.6" ry="5.4" fill="url(#${id}o)"/>`,
  none: () => '',
  raptor: () => `<path d="M77 34C79.5 29.6 87 29.4 89.6 34C87 38.4 79.5 38.4 77 34Z" fill="#f2c218" stroke="#3a2a06" stroke-width="1"/>
    <ellipse cx="83.6" cy="34" rx="1.1" ry="3.9" fill="${K}"/><circle cx="85.6" cy="32.4" r=".8" fill="#fff" opacity=".8"/>
    <path d="M76 30.6C79.6 28 86.4 28 90.4 30.4" stroke="#2a1f10" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  eagle: () => `<circle cx="83.4" cy="34.4" r="4.6" fill="#e8a317" stroke="#3a2406" stroke-width="1"/><circle cx="83.8" cy="34.6" r="2.2" fill="${K}"/>
    <circle cx="85" cy="33.2" r=".8" fill="#fff"/><path d="M77 30.6L90 31.4L89 29.4C85 28.4 80 28.6 77 30.6Z" fill="#2b1c0c"/>`,
  pelican: () => `<circle cx="83" cy="34" r="4.6" fill="#f6b2b8" stroke="#8a4a50" stroke-width=".8"/><circle cx="83" cy="34" r="3" fill="#fbf2c8"/>
    <circle cx="83.2" cy="34" r="1.3" fill="${K}"/><circle cx="84.2" cy="33" r=".6" fill="#fff"/>`,
  block: () => `<g shape-rendering="crispEdges"><rect x="78" y="30" width="7" height="7" fill="${K}"/><rect x="82" y="31" width="2" height="2" fill="#fff"/></g>`,
  flat: () => `<circle cx="83" cy="34" r="4.4" fill="${K}"/><circle cx="84.4" cy="32.6" r="1.4" fill="#fff"/>`,
};
let uid = 0;
export function eyesSVG(L, dead) {
  if (dead) return `<path d="M78 30l8 8M86 30l-8 8" stroke="#1b1b1b" stroke-width="2.6" stroke-linecap="round"/>`;
  return (DRAW[L.eyes] || DRAW.default)(L, 'ey' + (++uid));
}
