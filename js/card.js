/* ---------- the player card ----------
   Bigger than Halo's: the duck on the left, the name beside it in its owner's style, small tags (Host, Computer, Ready).
   Its background is a color, a fun pattern over a color (any hat or face item can be a pattern too) laid out the way the
   player picks (tiled, staggered, diagonal, scattered, one big, a band, a border; small to large), or a picture. */
import { duckSVG } from './duck.js';
import { HATS, hatTile } from './hats.js';
import { FACES, faceTile } from './faces.js';
import { nameHTML } from './name.js';
import { esc } from './ui.js';

export const CARD_PATTERNS = [['none', 'Plain'], ['dots', 'Polka dots'], ['stripes', 'Stripes'], ['zigzag', 'Zigzag'],
  ['checks', 'Checks'], ['confetti', 'Confetti'], ['bubbles', 'Bubbles'], ['stars', 'Stars'],
  ...HATS.map(h => [`hat:${h.id}`, h.name]), ...FACES.map(f => [`face:${f.id}`, f.name])];
/* how the pattern sits on the card: the pattern of the pattern */
export const CARD_LAYOUTS = [['tiled', 'Tiled'], ['staggered', 'Staggered'], ['diagonal', 'Diagonal'], ['scattered', 'Scattered'],
  ['big', 'One big'], ['band', 'Band'], ['border', 'Border']];
export const CARD_SIZES = [['s', 'Small', .7], ['m', 'Medium', 1], ['l', 'Large', 1.45]];

/* one pattern's motif in a 32 × 32 box */
function motif(kind, col) {
  if (String(kind).startsWith('hat:')) return hatTile(kind.slice(4), col === '#ffffff' ? '' : col);
  if (String(kind).startsWith('face:')) return faceTile(kind.slice(5));
  return {
    dots: `<circle cx="8" cy="8" r="3" fill="${col}"/><circle cx="24" cy="24" r="3" fill="${col}"/>`,
    stripes: `<path d="M-8 40L40 -8M-8 24L24 -8M8 40L40 8" stroke="${col}" stroke-width="5"/>`,
    zigzag: `<path d="M0 20l8-8 8 8 8-8 8 8" stroke="${col}" stroke-width="4" fill="none"/>`,
    checks: `<rect width="16" height="16" fill="${col}"/><rect x="16" y="16" width="16" height="16" fill="${col}"/>`,
    confetti: `<rect x="4" y="5" width="6" height="3" rx="1" fill="#ef3b3b" transform="rotate(30 7 6)"/><rect x="20" y="9" width="6" height="3" rx="1" fill="#2fa4ff" transform="rotate(-20 23 10)"/><rect x="10" y="22" width="6" height="3" rx="1" fill="#37d421" transform="rotate(60 13 23)"/><rect x="24" y="24" width="6" height="3" rx="1" fill="${col}" transform="rotate(10 27 25)"/>`,
    bubbles: `<circle cx="9" cy="10" r="6" fill="none" stroke="${col}" stroke-width="2"/><circle cx="25" cy="24" r="4" fill="none" stroke="${col}" stroke-width="2"/><circle cx="26" cy="7" r="2" fill="${col}"/>`,
    stars: `<path d="M16 6l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="${col}"/>`,
  }[kind] || '';
}
const svgURL = (w, h, inner) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`)}")`;
const at = (m, x, y, r = 0, k = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k}) translate(-16 -16)">${m}</g>`;
/* a pattern laid out on a card: CSS background layers (without the card's color) */
export function patternLayers(kind, col, layout = 'tiled', size = 'm') {
  const m = motif(kind, col); if (!m) return '';
  const k = (CARD_SIZES.find(z => z[0] === size) || CARD_SIZES[1])[2], big = /^(hat|face):/.test(kind);
  const px = n => `${Math.round(n * k)}px`;
  switch (layout) {
    case 'staggered': return `${svgURL(64, 64, at(m, 16, 16) + at(m, 48, 48))} 0 0/${px(big ? 76 : 56)} ${px(big ? 76 : 56)}`;
    case 'diagonal': return `${svgURL(64, 64, at(m, 32, 32, -35) + at(m, 0, 0, -35) + at(m, 64, 0, -35) + at(m, 0, 64, -35) + at(m, 64, 64, -35))} 0 0/${px(60)} ${px(60)}`;
    case 'scattered': return `${svgURL(128, 128, [[20, 22, -20, .9], [78, 14, 25, .7], [108, 60, -10, 1.1], [50, 70, 40, .8], [16, 100, 15, 1], [88, 108, -35, .75]].map(([x, y, r, s]) => at(m, x, y, r, s)).join(''))} 0 0/${px(120)} ${px(120)}`;
    case 'big': return `${svgURL(32, 32, m)} 88% 50%/auto ${Math.round(110 * k)}% no-repeat`;
    case 'band': return `${svgURL(32, 32, m)} 0 50%/${px(26)} ${px(26)} repeat-x`;
    case 'border': return `${svgURL(32, 32, m)} 0 0/${px(18)} ${px(18)} repeat-x, ${svgURL(32, 32, m)} 0 100%/${px(18)} ${px(18)} repeat-x`;
    default: return big ? `${svgURL(56, 56, `<g transform="translate(-2 -2) scale(.95)">${m}</g><g transform="translate(26 26) scale(.95)">${m}</g>`)} 0 0/${px(56)} ${px(56)}`
      : `${svgURL(32, 32, m)} 0 0/${px(32)} ${px(32)}`;
  }
}
export function cardBackground(card = {}) {
  if (card.image) return `background:url("${card.image}") center/cover, ${card.color || '#2fa4ff'}`;
  const pat = card.pattern && card.pattern !== 'none' ? patternLayers(card.pattern, card.patternColor || '#ffffff', card.layout, card.size) : '';
  return `background:${pat ? `${pat}, ` : ''}${card.color || '#2fa4ff'}`;
}

/* p = a player; o = { host, me, ready, size, extra } */
export function cardHTML(p, o = {}) {
  const tags = [o.host ? '<span class="tag host" title="Host">Host</span>' : '', p.bot ? '<span class="tag bot">Computer</span>' : '',
    o.me ? '<span class="tag me">You</span>' : ''].join('');
  return `<div class="pcard${o.me ? ' mine' : ''}${o.ready ? ' ready' : ''}" data-pid="${esc(p.id)}" style="${esc(cardBackground(p.card))}" tabindex="0">
  <div class="pcard-duck">${duckSVG(p.duck, { size: o.size || 58, title: p.name })}</div>
  <div class="pcard-name"><span class="pcard-label">${nameHTML(p.name, p.nameStyle)}</span>${tags}</div>
  ${o.extra || ''}${o.ready !== undefined ? `<span class="pcard-ready" aria-label="${o.ready ? 'Ready' : 'Not ready'}">${o.ready ? '✓' : ''}</span>` : ''}
</div>`;
}
