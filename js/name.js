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
  { id: 'bangers', name: 'Bangers', css: "'Bangers', 'Impact', sans-serif" },
  { id: 'pixel', name: 'Press Start 2P', css: "'Press Start 2P', 'Courier New', monospace" },
  { id: 'pacifico', name: 'Pacifico', css: "'Pacifico', 'Brush Script MT', cursive" },
  { id: 'marker', name: 'Permanent Marker', css: "'Permanent Marker', 'Comic Sans MS', cursive" },
  { id: 'creepster', name: 'Creepster', css: "'Creepster', 'Chiller', fantasy" },
  { id: 'orbitron', name: 'Orbitron', css: "'Orbitron', 'Eurostile', sans-serif" },
  { id: 'typewriter', name: 'Special Elite', css: "'Special Elite', 'Courier New', monospace" },
];
export const fontCSS = id => (FONTS.find(f => f.id === id) || FONTS[0]).css;
/* how big a font is drawn so its letters look as big as Fredoka's (Story Chain lines, which sit side by side): from the
   height of its x and H and the width of a sentence, measured on this device once the font is in (fonts on the
   computer itself differ between devices), kept between 0.6 and 1.25 so a line stays easy to read */
const SAMPLE = 'The duck sailed across the pond with a pineapple, and nobody asked why.';
let sized = {}, pen = null;
if (typeof document !== 'undefined' && document.fonts) document.fonts.addEventListener('loadingdone', () => { sized = {}; });
const look = css => {
  pen = pen || document.createElement('canvas').getContext('2d'); pen.font = `100px ${css}`;
  const m = t => pen.measureText(t);
  return (m('x').actualBoundingBoxAscent + m('H').actualBoundingBoxAscent) * m(SAMPLE).width;
};
export function fontScale(id) {
  const f = FONTS.find(x => x.id === id) || FONTS[0];
  if (f === FONTS[0] || typeof document === 'undefined' || !document.fonts) return 1;
  if (sized[f.id]) return sized[f.id];
  const loaded = [FONTS[0], f].every(x => document.fonts.check(`16px ${x.css}`, SAMPLE));
  if (!loaded) { document.fonts.load(`16px ${f.css}`, SAMPLE).catch(() => {}); return 1; }
  const k = Math.sqrt(look(FONTS[0].css) / (look(f.css) || 1));
  return (sized[f.id] = Math.round(Math.min(1.25, Math.max(.6, k)) * 100) / 100);
}
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
