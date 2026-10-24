/* ---------- choosing a color ----------
   A row of ready colors and, at its end, the paintbrush: Invent a color. It opens a hex box (with the browser's color
   picker beside it) and a circled "i" that explains hex on hover or click. */
import { el, esc } from './ui.js';

export const SWATCHES = ['#1c1c28', '#ffffff', '#ef3b3b', '#ff8c2b', '#ffd23f', '#37d421', '#14c6b4', '#2fa4ff', '#9b5de5', '#ff7eb6', '#8b5a2b', '#9aa0aa'];
/* the Colors screen's grid, after Halo: Reach's: each row one color, dark to light */
export const SHADES = [
  ['#1c1c28', '#6b7078', '#ffffff'], ['#5a3a22', '#8b5a2b', '#c8996a'], ['#3f4a1f', '#6b7a2e', '#a8b860'],
  ['#1f6b2a', '#37d421', '#9ef08a'], ['#0d5c57', '#14c6b4', '#8fe8de'], ['#1d4f7a', '#2fa4ff', '#9fd3ff'],
  ['#2b2f7a', '#4a5ad8', '#a7b0f5'], ['#4b2479', '#9b5de5', '#d2b6f5'], ['#6b0f1e', '#ef3b3b', '#ff9a9a'],
  ['#8a3a0c', '#ff8c2b', '#ffc38a'], ['#9a7a00', '#ffd23f', '#fff0a3'], ['#8a1f55', '#ff7eb6', '#ffc7df'],
];
const HEX_INFO = 'A hex color is # and six characters, each 0–9 or A–F: two for red, two for green, two for blue. 00 is none, FF is the most. #FF0000 is red, #00FF00 green, #FFFFFF white, #000000 black.';
export const HEX_OK = /^#[0-9a-f]{6}$/i;
export const normHex = s => { s = String(s || '').trim(); if (!s.startsWith('#')) s = '#' + s; if (/^#[0-9a-f]{3}$/i.test(s)) s = '#' + [...s.slice(1)].map(c => c + c).join(''); return HEX_OK.test(s) ? s.toLowerCase() : null; };

/* a color field; onPick(hex) runs on every change */
export function colorField(value, onPick, { swatches = SWATCHES, grid = false } = {}) {
  if (grid) swatches = SHADES.flat();
  const box = el(`<div class="colors${grid ? ' grid3' : ''}">
    <div class="swatches">${swatches.map(c => `<button type="button" class="sw" style="background:${c}" data-c="${c}" aria-label="${c}" aria-pressed="${c === value}"></button>`).join('')}
      <button type="button" class="sw brush" aria-label="Invent a color" data-tip="Invent a color" aria-expanded="false">🖌</button></div>
    <div class="invent" hidden>
      <input type="color" value="${esc(value || '#2fa4ff')}" aria-label="Color picker">
      <input class="hex" value="${esc(value || '#2fa4ff')}" maxlength="7" spellcheck="false" aria-label="Hex color">
      <button type="button" class="info" aria-label="What hex is" data-tip="${esc(HEX_INFO)}">i</button>
      <p class="info-text small dim" hidden>${esc(HEX_INFO)}</p>
    </div></div>`);
  const inv = box.querySelector('.invent'), picker = inv.querySelector('[type=color]'), hex = inv.querySelector('.hex');
  const mark = c => box.querySelectorAll('.sw[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === c));
  const set = c => { mark(c); picker.value = c; if (document.activeElement !== hex) hex.value = c; onPick(c); };
  box.querySelector('.swatches').onclick = e => {
    const b = e.target.closest('.sw'); if (!b) return;
    if (b.classList.contains('brush')) { inv.hidden = !inv.hidden; b.setAttribute('aria-expanded', !inv.hidden); if (!inv.hidden) hex.focus(); return; }
    set(b.dataset.c);
  };
  picker.oninput = () => set(picker.value);
  hex.oninput = () => { const c = normHex(hex.value); hex.classList.toggle('bad', !c && hex.value.length > 0); if (c) set(c); };
  inv.querySelector('.info').onclick = () => { const t = inv.querySelector('.info-text'); t.hidden = !t.hidden; };
  if (value && !swatches.includes(value)) { inv.hidden = false; box.querySelector('.brush').setAttribute('aria-expanded', 'true'); }
  return box;
}
