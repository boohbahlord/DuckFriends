/* ---------- numbers as the settings ask ---------- */
import { profile } from './store.js';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/* jumps: 12,345, or 1.23 × 10⁴ with scientific notation on */
export function fmtJumps(n) {
  n = n || 0;
  if (!profile.settings.jumpsSci || n < 1000) return n.toLocaleString('en-US');
  const e = Math.floor(Math.log10(n)), m = (n / 10 ** e).toFixed(2).replace(/\.?0+$/, '');
  return `${m} × 10${[...String(e)].map(d => SUP[d]).join('')}`;
}
