/* ---------- the rubber duck avatar ----------
   One SVG, drawn from a look: a body color, a pattern over it, or a metal that shines (gold, silver…), or a square picture
   the player uploaded. The duck is lit from the top left (a soft highlight, a darker belly) and casts a small shadow. */

export const DUCK_COLORS = [
  ['Classic yellow', '#ffd23f'], ['Tangerine', '#ff8c2b'], ['Cherry', '#ef3b3b'], ['Bubblegum', '#ff7eb6'],
  ['Grape', '#9b5de5'], ['Pool blue', '#2fa4ff'], ['Teal', '#14c6b4'], ['Lime', '#8ee03c'],
  ['Snow', '#f4f4f0'], ['Charcoal', '#3b3f4a'],
];
export const DUCK_PATTERNS = [['none', 'Plain'], ['dots', 'Polka dots'], ['stripes', 'Stripes'], ['stars', 'Stars'],
  ['hearts', 'Hearts'], ['checks', 'Checks'], ['waves', 'Waves']];
export const DUCK_METALS = [['none', 'No metal'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze'],
  ['rose', 'Rose gold'], ['chrome', 'Chrome']];
const METAL = {   // light, mid, dark, sheen
  gold: ['#fff2a8', '#f2c230', '#9c6a06', '#fffbe0'], silver: ['#ffffff', '#c9ced6', '#6e7682', '#ffffff'],
  bronze: ['#ffd2a0', '#c9803e', '#6e3a12', '#ffe6c8'], rose: ['#ffe1df', '#e8a29a', '#93554e', '#fff1ef'],
  chrome: ['#ffffff', '#aeb8c4', '#3c4652', '#ffffff'],
};
export const DUCK_DEFAULT = { color: '#ffd23f', pattern: 'none', patternColor: '#ffffff', metal: 'none', image: null };

let uid = 0;
const mix = (hex, to, t) => {   // blend a color toward white (to = 255) or black (to = 0)
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (to - v) * t));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function patternDef(id, kind, col) {
  const P = {
    dots: `<circle cx="5" cy="5" r="2.2" fill="${col}"/>`,
    stripes: `<rect width="10" height="4" fill="${col}"/>`,
    stars: `<path d="M5 1.2l1.1 2.4 2.6.3-1.9 1.8.5 2.6L5 7.1 2.7 8.3l.5-2.6L1.3 3.9l2.6-.3z" fill="${col}"/>`,
    hearts: `<path d="M5 8.2C2.2 6.3 1.4 4.8 1.9 3.5c.5-1.3 2.3-1.5 3.1-.2.8-1.3 2.6-1.1 3.1.2.5 1.3-.3 2.8-3.1 4.7z" fill="${col}"/>`,
    checks: `<rect width="5" height="5" fill="${col}"/><rect x="5" y="5" width="5" height="5" fill="${col}"/>`,
    waves: `<path d="M0 6c2.5-3 5 3 10 0" stroke="${col}" stroke-width="1.8" fill="none"/>`,
  }[kind];
  return P ? `<pattern id="${id}p" width="10" height="10" patternUnits="userSpaceOnUse"${kind === 'stripes' ? ' patternTransform="rotate(-30)"' : ''}>${P}</pattern>` : '';
}

/* the duck itself, in a 120 × 120 box, facing right */
export function duckSVG(look = DUCK_DEFAULT, { size = 64, shadow = true, title = '' } = {}) {
  const L = { ...DUCK_DEFAULT, ...(look || {}) }, id = 'dk' + (++uid);
  if (L.image) {   // an uploaded square picture, with the same little shadow
    return `<svg class="duck" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(title || 'Avatar')}">
${shadow ? `<ellipse cx="60" cy="110" rx="40" ry="7" fill="#000" opacity=".18"/>` : ''}
<defs><clipPath id="${id}c"><rect x="14" y="10" width="92" height="92" rx="16"/></clipPath></defs>
<image href="${esc(L.image)}" x="14" y="10" width="92" height="92" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}c)"/>
<rect x="14" y="10" width="92" height="92" rx="16" fill="none" stroke="#00000022" stroke-width="2"/></svg>`;
  }
  const M = L.metal !== 'none' && METAL[L.metal];
  const base = M ? M[1] : L.color, light = M ? M[0] : mix(L.color, 255, .45), dark = M ? M[2] : mix(L.color, 0, .3);
  const body = 'M18 70c0-14 12-24 30-24h20c4-10 2-18-2-24 9-3 22 1 27 12 5 9 3 19-3 25 9 2 14 9 14 18 0 18-20 32-46 32H48c-18 0-30-12-30-30z';
  const pat = !M && L.pattern !== 'none' ? patternDef(id, L.pattern, L.patternColor || '#ffffff') : '';
  return `<svg class="duck" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(title || 'Rubber duck')}">
<defs>
<radialGradient id="${id}g" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
${pat}
${M ? `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="${M[3]}" stop-opacity="0"/><stop offset=".42" stop-color="${M[3]}" stop-opacity=".85"/><stop offset=".55" stop-color="${M[3]}" stop-opacity="0"/></linearGradient>` : ''}
<clipPath id="${id}b"><path d="${body}"/></clipPath>
</defs>
${shadow ? `<ellipse cx="60" cy="110" rx="42" ry="7" fill="#000" opacity=".2"/>` : ''}
<path d="${body}" fill="url(#${id}g)" stroke="${dark}" stroke-width="2"/>
${pat ? `<rect x="0" y="0" width="120" height="120" fill="url(#${id}p)" clip-path="url(#${id}b)" opacity=".85"/>` : ''}
${M ? `<rect x="0" y="0" width="120" height="120" fill="url(#${id}s)" clip-path="url(#${id}b)"/>` : ''}
<path d="M40 74c8 10 24 12 36 4-4 12-24 16-36-4z" fill="${dark}" opacity=".35"/>
<ellipse cx="44" cy="58" rx="13" ry="6" fill="#fff" opacity=".35" transform="rotate(-18 44 58)"/>
<ellipse cx="78" cy="28" rx="6" ry="3.5" fill="#fff" opacity=".45" transform="rotate(-25 78 28)"/>
<path d="M95 38c8-2 16 0 19 4-3 4-10 6-19 5z" fill="#ff9a1f" stroke="#c45f00" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M95 43c6 1 12 0 17-1" stroke="#c45f00" stroke-width="1.2" fill="none"/>
<circle cx="84" cy="32" r="4.6" fill="#1b1b1b"/><circle cx="85.6" cy="30.4" r="1.5" fill="#fff"/>
</svg>`;
}

/* a square picture from the player's files, cut to its middle and made small enough to send to others */
export function pictureToSquare(file, px = 128) {
  return new Promise((ok, bad) => {
    if (!file || !/^image\//.test(file.type)) { bad(new Error('That file is not a picture.')); return; }
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = px;
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, px, px);
      URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', .85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); bad(new Error('That picture could not be read.')); };
    img.src = url;
  });
}
