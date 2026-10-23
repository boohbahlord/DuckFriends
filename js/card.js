/* ---------- the player card ----------
   Bigger than Halo's: the duck on the left, the name beside it in its owner's style, small tags (Host, Computer, Ready).
   Its background is a color, a fun pattern over a color, or a picture the player uploaded. */
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { esc } from './ui.js';

export const CARD_PATTERNS = [['none', 'Plain'], ['dots', 'Polka dots'], ['stripes', 'Stripes'], ['zigzag', 'Zigzag'],
  ['checks', 'Checks'], ['confetti', 'Confetti'], ['bubbles', 'Bubbles'], ['stars', 'Stars']];

/* a pattern as a small SVG tile, for a CSS background */
function patternTile(kind, col) {
  const T = {
    dots: `<circle cx="8" cy="8" r="3" fill="${col}"/><circle cx="24" cy="24" r="3" fill="${col}"/>`,
    stripes: `<path d="M-8 40L40 -8M-8 24L24 -8M8 40L40 8" stroke="${col}" stroke-width="5"/>`,
    zigzag: `<path d="M0 20l8-8 8 8 8-8 8 8" stroke="${col}" stroke-width="4" fill="none"/>`,
    checks: `<rect width="16" height="16" fill="${col}"/><rect x="16" y="16" width="16" height="16" fill="${col}"/>`,
    confetti: `<rect x="4" y="5" width="6" height="3" rx="1" fill="#ef3b3b" transform="rotate(30 7 6)"/><rect x="20" y="9" width="6" height="3" rx="1" fill="#2fa4ff" transform="rotate(-20 23 10)"/><rect x="10" y="22" width="6" height="3" rx="1" fill="#37d421" transform="rotate(60 13 23)"/><rect x="24" y="24" width="6" height="3" rx="1" fill="${col}" transform="rotate(10 27 25)"/>`,
    bubbles: `<circle cx="9" cy="10" r="6" fill="none" stroke="${col}" stroke-width="2"/><circle cx="25" cy="24" r="4" fill="none" stroke="${col}" stroke-width="2"/><circle cx="26" cy="7" r="2" fill="${col}"/>`,
    stars: `<path d="M16 6l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="${col}"/>`,
  }[kind];
  if (!T) return '';
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${T}</svg>`)}")`;
}
export function cardBackground(card = {}) {
  if (card.image) return `background:url("${card.image}") center/cover, ${card.color || '#2fa4ff'}`;
  const pat = card.pattern && card.pattern !== 'none' ? patternTile(card.pattern, card.patternColor || '#ffffff') : '';
  return `background:${pat ? pat + ' 0 0/32px 32px, ' : ''}${card.color || '#2fa4ff'}`;
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
