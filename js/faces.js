/* ---------- face items ----------
   Worn over the face (glasses, masks, helmets, anything that covers it), with or without a hat. Drawn in the duck's own
   120 × 120 space after its eyes and beak and before its hat. A face item can also be a player card's pattern. */
import { ROBOT } from './hats.js';

export const FACES = [
  { id: 'box', name: 'Cardboard box', tip: 'A cardboard robot head over the whole face.' },
];
export const faceById = id => FACES.find(f => f.id === id) || null;

/* the layer over the face, or '' */
export function faceLayer(face) {
  const def = face && faceById(face.id); if (!def) return '';
  if (def.id === 'box') return ROBOT;
  return '';
}
/* a face item on its own in a 32 × 32 tile (card patterns) */
export function faceTile(id) {
  const def = faceById(id); if (!def) return '';
  if (def.id === 'box') return `<g transform="translate(4 6) scale(.36) translate(-46 -6)">${ROBOT}</g>`;
  return '';
}
