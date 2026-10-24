/* ---------- duck styles ----------
   Every style keeps the rubber duck's body and head where they are, so hats, faces, eyes and beaks sit the same on all
   of them; only the colors, the feathers and small things around the head and tail change.
   - Mallard: a drake: green head, white ring, chestnut breast, grey flanks, a black curled tail. Its colors are its own.
   - White call duck: small, round and all white (the orange duck beak suits it). Its colors are its own.
   - Raptor: a feathered velociraptor rubber duck: stripes down the back, a crest of feathers behind the head and a fan
     on the tail (the beak with teeth goes with it). Body, stripes and feathers can be recolored.
   - Eagle: a brown body, a white head that spills ragged onto the neck, a white tail and a heavy brow. Body and head can
     be recolored. (The eagle beak matches it.)
   - Pelican: white, with grey wings tipped black, a pale yellow crown and a little crest. Body and wings can be
     recolored. (The pelican beak matches it.)
   - Blocks: the duck built of square blocks, each with a lit and a shaded edge. Not rubber.
   - 2D shapes: flat shapes with an outline, no shading. Not rubber. */
import { mix } from './duck.js';

export const STYLES = [
  { id: 'rubber', name: 'Rubber duck' },
  { id: 'mallard', name: 'Mallard', fixed: true, body: '#bdb8ae', head: '#1f6b3a', tip: 'A mallard drake. Its colors are its own.' },
  { id: 'call', name: 'White call duck', fixed: true, body: '#f7f4ec', head: '#f7f4ec', tip: 'A little white call duck. Its colors are its own.' },
  { id: 'raptor', name: 'Raptor', match: 'teeth', colors: [['color', 'Raptor body', '#6aa84f'], ['color2', 'Raptor stripes', '#2f5e2a'], ['color3', 'Raptor feathers', '#e0662f']], tip: 'A feathered velociraptor rubber duck. The beak with teeth goes with it.' },
  { id: 'eagle', name: 'Eagle', match: 'eagle', head2: true, colors: [['color', 'Eagle body', '#5b3a1e'], ['color2', 'Eagle head', '#f5f2ea']], tip: 'A rubber duck shaped like an eagle. The eagle beak matches it.' },
  { id: 'pelican', name: 'Pelican', match: 'pelican', colors: [['color', 'Pelican body', '#f2efe8'], ['color2', 'Pelican wings', '#9aa3b0']], tip: 'A rubber duck shaped like a pelican. The pelican beak matches it.' },
  { id: 'blocks', name: 'Blocks', flat: true, match: 'blocks', tip: 'A duck built of blocks. The block beak matches it.' },
  { id: 'geo', name: '2D shapes', flat: true, match: 'geo', tip: 'A duck of simple flat shapes. The flat beak matches it.' },
];
export const styleById = id => STYLES.find(s => s.id === id) || STYLES[0];
/* a style's color: the look's own, or the style's default */
export const styleColor = (L, st, key) => L[key] || ((st.colors || []).find(c => c[0] === key) || [])[2] || L.color;

/* ---------- the extra layers of the rubber-like styles ----------
   under: inside the duck's outline, before the shading (nh = the "not the head" mask's id); back: behind the duck;
   over: after the outline, before the beak and the eyes; wing: in place of the wing. */
export function styleLayers(L, st, id, BODY, bt) {
  const nh = ` mask="url(#${id}nh)"`;
  switch (st.id) {
    case 'mallard': return {
      under: `<path d="M14 50C24 58 34 62 46 62H84C72 67 50 69 30 67C22 64 16 58 14 50Z" fill="#7d7468" opacity=".85"${nh}${bt}/>
        <ellipse cx="93" cy="75" rx="15" ry="17" fill="#6b3a26"${nh}${bt}/><ellipse cx="96" cy="70" rx="6" ry="4" fill="#a0634a" opacity=".6"${nh}${bt}/>
        <path d="M12 49C13 58 18 64 26 67L31 62C24 60 18 56 12 49Z" fill="#1d1d1d"${bt}/>
        <g stroke="#00000022" stroke-width=".8" fill="none"${nh}${bt}><path d="M30 76q3-2 6 0t6 0t6 0M28 84q3-2 6 0t6 0t6 0t6 0M34 92q3-2 6 0t6 0t6 0t6 0"/></g>
        <ellipse cx="70" cy="28" rx="13" ry="7" fill="#6b5bd6" opacity=".25" transform="rotate(-25 70 28)"/>`,
      wing: `<path d="M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z" fill="#8f877c"${bt}/><path d="M43 82L55 79L57 84L45 87Z" fill="#3456c9" stroke="#fff" stroke-width="1"${bt}/>`,
      over: `<path d="M18 54c-7-4-5-12 1-9" stroke="#1d1d1d" stroke-width="2.4" fill="none" stroke-linecap="round"${bt}/>
        <path d="M58 57C66 62.5 84 63.5 93 57" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    };
    case 'call': return {
      under: `<ellipse cx="60" cy="98" rx="34" ry="9" fill="#cfc9bb" opacity=".45"${nh}${bt}/>
        <g stroke="#d6d0c2" stroke-width="1.2" fill="none" stroke-linecap="round"${nh}${bt}><path d="M28 72q4 3 8 0M40 84q4 3 8 0M58 92q4 3 8 0M74 74q4 3 8 0M84 86q4 3 8 0M22 84q4 3 8 0"/></g>
        <circle cx="86" cy="48" r="5" fill="#ffd9d0" opacity=".35"/>`,
      wing: `<path d="M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z" fill="#e3ddcf"${bt}/>
        <path d="M44 85q4 3 8 0M53 87q4 3 8 0" stroke="#cfc8b8" stroke-width="1.1" fill="none"${bt}/>`,
    };
    case 'raptor': {
      const c2 = styleColor(L, st, 'color2'), c3 = styleColor(L, st, 'color3'), e3 = mix(c3, 0, .4);
      return {
        back: `<g fill="${c3}" stroke="${e3}" stroke-width="1.4" stroke-linejoin="round"><path d="M58 30C48 22 44 14 46 9C52 13 58 21 61 27Z"/><path d="M57 39C45 35 38 29 37 24C45 26 53 30 59 35Z"/><path d="M65 21C59 13 58 6 61 2C65 7 67 14 67 20Z"/>
          <path d="M15 51C8 45 5 38 6 33C11 36 15 42 17 47Z"/><path d="M14 56C7 55 3 52 2 48C8 48 12 51 15 53Z"/></g>`,
        under: `<g fill="${c2}" opacity=".9"${bt}><path d="M24 59l7 12 4-1-4-12Z"/><path d="M37 61l6 12 4-1-3-11Z"/><path d="M51 60l5 11 4-1-2-10Z"/><path d="M18 64l5 10 3-2-4-9Z"/></g>
          <g fill="${c2}" opacity=".9"><path d="M68 18l4 9 3-1-2-9Z"/><path d="M78 17l2 9 3 0 0-9Z"/><path d="M58 30l7 5 1-3-6-5Z"/></g>
          <ellipse cx="66" cy="99" rx="28" ry="8" fill="${mix(styleColor(L, st, 'color'), 255, .35)}" opacity=".6"${nh}${bt}/>`,
        over: `<g fill="${c3}" stroke="${e3}" stroke-width="1"${bt}><path d="M45 86C42 89 41 93 42 97C45 94 47 91 47 87Z"/><path d="M53 89C51 92 51 96 52 100C55 96 56 93 56 89Z"/><path d="M62 89C61 92 61 96 63 99C65 95 65 92 64 89Z"/></g>`,
      };
    }
    case 'eagle': {
      const c2 = styleColor(L, st, 'color2'), e2 = mix(c2, 0, .3), body = styleColor(L, st, 'color');
      return {
        under: `<path d="M12 49C11 60 13 72 18 81L29 70C24 64 18 58 12 49Z" fill="${c2}"${bt}/>
          <g stroke="${mix(body, 0, .35)}" stroke-width="1.3" fill="none" opacity=".7"${bt}><path d="M44 81q3 4 7 1M52 80q3 4 7 1M60 80q3 4 7 1M48 87q3 4 7 1M57 87q3 4 7 1"/></g>`,
        over: `<path d="M57 57L60 67L64 61L68 69L72 62L77 70L81 62L86 68L90 61L96 64L95 55C85 61 67 61 57 57Z" fill="${c2}" stroke="${e2}" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M76 27C82 23 91 24 97 30C91 30 83 30 77 32Z" fill="${e2}" opacity=".85"/>`,
      };
    }
    case 'pelican': {
      const c2 = styleColor(L, st, 'color2'), body = styleColor(L, st, 'color');
      return {
        back: `<path d="M56 35C49 31 47 26 48 22C53 25 56 29 59 32Z" fill="${mix(body, 0, .08)}" stroke="${mix(body, 0, .4)}" stroke-width="1.2"/>`,
        under: `<ellipse cx="72" cy="24" rx="16" ry="8" fill="#f3dc7a" opacity=".45"/>`,
        wing: `<path d="M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z" fill="${c2}"${bt}/><path d="M41 87C38 84 38 80 40 77L47 79C46 83 45 85 41 87Z" fill="#26262e"${bt}/>
          <path d="M46 80q8-5 20-1" stroke="${mix(c2, 255, .35)}" stroke-width="1.4" fill="none"${bt}/>`,
      };
    }
  }
  return {};
}

/* ---------- Blocks: the duck's outline in 6-pixel blocks (h head, b body, w wing) ---------- */
const GRID = [
  '....................', '....................', '....................',
  '..........hhhhh.....', '.........hhhhhhh....', '.........hhhhhhh....', '.........hhhhhhhh...', '.........hhhhhhh....',
  '..b......hhhhhhh....', '..bb......hhhhh.....', '..bbbbbbbbbbbbbb....', '..bbbbbbbbbbbbbb....', '...bbbbwwwwwbbbbb...',
  '...bbbwwwwwwbbbbb...', '...bbbbwwwwbbbbb....', '....bbbbbbbbbbbb....', '.....bbbbbbbbbb.....', '......bbbbbbb.......',
];
export function blocksBody(color) {
  let out = '', n = 0;
  GRID.forEach((row, r) => [...row].forEach((c, k) => {
    if (c === '.') return;
    const x = k * 6, y = r * 6, j = ((k * 7 + r * 13) % 5) / 100;   // each block a touch lighter or darker
    const f = c === 'w' ? mix(color, 0, .22 + j) : mix(color, r < 9 ? 255 : 0, r < 9 ? .06 + j : j);
    out += `<rect x="${x}" y="${y}" width="6" height="6" fill="${f}"/><path d="M${x} ${y + 6}V${y}H${x + 6}" stroke="${mix(f, 255, .35)}" stroke-width="1" fill="none"/><path d="M${x + 6} ${y}V${y + 6}H${x}" stroke="${mix(f, 0, .3)}" stroke-width="1" fill="none"/>`;
    n++;
  }));
  return `<g shape-rendering="crispEdges">${out}</g>`;
}

/* ---------- 2D shapes: a circle for the head, a half disc for the body, a triangle for the tail ---------- */
export const GEO_BODY = 'M20 62H100A40 44 0 0 1 20 62ZM14 46L36 64L22 74Z';
export function geoBody(color) {
  const edge = mix(color, 0, .5), wing = mix(color, 0, .18);
  return `<path d="M14 46L36 64L22 74Z" fill="${color}" stroke="${edge}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M20 62H100A40 44 0 0 1 20 62Z" fill="${color}" stroke="${edge}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M40 76Q58 66 76 77Q58 90 40 76Z" fill="${wing}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>
<circle cx="76" cy="40" r="23" fill="${color}" stroke="${edge}" stroke-width="2.2"/>
<circle cx="68" cy="30" r="5" fill="#fff" opacity=".45"/>`;
}
