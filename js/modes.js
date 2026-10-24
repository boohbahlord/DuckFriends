/* ---------- the game modes ----------
   Agree or Disagree: everyone writes a statement; the room stands on a seven-column scale for each one.
   Would You Rather: everyone writes a "would you rather" with two choices in secret; the room walks to a side.
   Bicker Brackets: a tournament a round; the room picks a topic, writes the seeds and votes match by match. */
import { esc } from './ui.js';

export const MODES = [
  { id: 'aod', name: 'Agree or Disagree', tip: 'Everyone writes a statement; for each one, walk to how much you agree, then talk it over.' },
  { id: 'wyr', name: 'Would You Rather', tip: 'Everyone writes a "would you rather" with two choices, in secret; for each one, walk to the side you\'d pick.' },
  { id: 'bb', name: 'Bicker Brackets', tip: 'A tournament: pick a topic, write the seeds together, then walk onto the seed you back, match by match, until one is the champion.' },
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
  return '';   // (Agree or Disagree's symbol is art.js's symbolSVG)
}
