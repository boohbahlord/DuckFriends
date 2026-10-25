/* ---------- the game modes ----------
   Agree or Disagree: everyone writes a statement; the room stands on a seven-column scale for each one.
   Would You Rather: everyone writes a "would you rather" with two choices in secret; the room walks to a side.
   Bicker Brackets: a tournament a round; the room picks a topic, writes the seeds and votes match by match.
   Who is the Quack?: everyone's Secret Card has the same word except one duck's; clues out loud, then walk onto a duck. */
import { esc } from './ui.js';

export const MODES = [
  { id: 'aod', name: 'Agree or Disagree', tip: 'Everyone writes a statement; for each one, walk to how much you agree, then talk it over.' },
  { id: 'wyr', name: 'Would You Rather', tip: 'Everyone writes a "would you rather" with two choices, in secret; for each one, walk to the side you\'d pick.' },
  { id: 'bb', name: 'Bicker Brackets', tip: 'A tournament: pick a topic, write the contenders together, then walk onto the one you back, match by match, until one is the champion.' },
  { id: 'quack', name: 'Who is the Quack?', tip: 'Everyone\'s Secret Card has the same word except the Quack\'s. Give clues, then walk onto the duck you think is faking it. 3 players or more.' },
];
export const modeOf = id => MODES.find(m => m.id === id) || MODES[0];

/* each mode's little symbol: Agree or Disagree's colored bars; Would You Rather's two tiles with OR between */
export function modeSymbol(id, size = 32) {
  const m = modeOf(id);
  if (m.id === 'wyr') return `<svg viewBox="0 0 30 24" width="${size}" height="${size * .8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="2" width="11" height="20" rx="2" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1.2"/><rect x="18" y="2" width="11" height="20" rx="2" fill="#ff8c2b" stroke="#1c1c28" stroke-width="1.2"/>
<text x="15" y="15.5" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="6.5" fill="#fff" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">OR</text></svg>`;
  if (m.id === 'bb') return `<svg viewBox="0 0 30 24" width="${size}" height="${size * .8}" role="img" aria-label="${esc(m.name)}">
<path d="M11 6H15V12H19M11 18H15V12" fill="none" stroke="#1c1c28" stroke-width="1.4" opacity=".55"/>
<rect x="1" y="2" width="10" height="8" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/><rect x="1" y="14" width="10" height="8" rx="2" fill="#7a1220" stroke="#1c1c28" stroke-width="1.2"/>
<path d="M3.2 15.8l5.6 4.4M8.8 15.8l-5.6 4.4" stroke="#ff3030" stroke-width="1.6" stroke-linecap="round"/>
<rect x="19" y="8" width="10" height="8" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/></svg>`;
  if (m.id === 'quack') return `<svg viewBox="0 0 30 24" width="${size}" height="${size * .8}" role="img" aria-label="${esc(m.name)}">
${[[5, '#ffd23f'], [15, '#ffd23f'], [25, '#3b3f4a']].map(([x, c]) => `<g transform="translate(${x} 16)"><ellipse cx="0" cy="2.6" rx="4.3" ry="3" fill="${c}" stroke="#1c1c28" stroke-width="1"/><circle cx="1" cy="-1.6" r="2.4" fill="${c}" stroke="#1c1c28" stroke-width="1"/><path d="M3 -1.8l2.3 .5-2.2 .9z" fill="#ff8c2b" stroke="#1c1c28" stroke-width=".6"/><circle cx="1.6" cy="-2.2" r=".45" fill="#1c1c28"/></g>`).join('')}
<text x="25.6" y="9" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="8.5" fill="#ff3d6e" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">?</text></svg>`;
  return '';   // (Agree or Disagree's symbol is art.js's symbolSVG)
}
