/* ---------- fonts and how a player's name looks ----------
   The site's fonts (Fredoka by default; Lilita One is the playground font of the multicolored letters) and a name drawn
   in its owner's chosen font and color, or in the multicolored letters on any font. */
import { esc } from './ui.js';
import { rainbowHTML } from './art.js';

export const FONTS = [
  { id: 'fredoka', name: 'Fredoka', css: "'Fredoka', 'Trebuchet MS', system-ui, sans-serif" },
  { id: 'lilita', name: 'Lilita One', css: "'Lilita One', 'Fredoka', system-ui, sans-serif" },
  { id: 'grenze', name: 'Old English', css: "'Grenze Gotisch', 'Old English Text MT', serif" },
  { id: 'cascadia', name: 'Cascadia Code Extra Light', css: "'Cascadia Code', Consolas, monospace" },
  { id: 'courier', name: 'Courier New', css: "'Courier New', Courier, monospace" },
  { id: 'times', name: 'Times New Roman', css: "'Times New Roman', Times, serif" },
  { id: 'comic', name: 'Comic Sans', css: "'Comic Sans MS', 'Comic Sans', 'Comic Neue', cursive" },
  { id: 'georgia', name: 'Georgia', css: "Georgia, 'Times New Roman', serif" },
];
export const fontCSS = id => (FONTS.find(f => f.id === id) || FONTS[0]).css;
/* a font from what a player typed ("times new roman", "Old English", "grenze"…) */
export const findFont = s => {
  const k = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  return FONTS.find(f => f.id === k || f.name.toLowerCase().replace(/[^a-z]/g, '') === k || (k.length > 2 && f.name.toLowerCase().replace(/[^a-z]/g, '').startsWith(k))) || null;
};

/* a name as others see it */
export function nameHTML(name, style = {}) {
  const font = fontCSS(style.font);
  if (style.rainbow) return rainbowHTML(name, { font, seed: [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) });
  return `<span class="pname" style="font-family:${esc(font)};color:${esc(style.color || 'inherit')}">${esc(name)}</span>`;
}
