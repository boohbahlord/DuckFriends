/* ---------- the pieces every weapon's drawing is built from ----------
   The ink, the guns' dark metals and polymer, and the three shapes (a soft shine, a rounded box, a path with an outline)
   that gunart.js and laserart.js both draw with. They sit in a file of their own because gunart.js imports laserart.js,
   so the laser gun can't take them from it (a cycle would draw the laser before they exist). */
export const INK = "#2a2d38";
export const M1 = "#33384a",
  M2 = "#454b5e",
  M0 = "#2a2e3c",
  POLY = "#1f2230";
export const shine = (d, o = 0.28, w = 0.8) =>
  `<path d="${d}" stroke="#fff" stroke-width="${w}" opacity="${o}" fill="none" stroke-linecap="round"/>`;
export const box = (x, y, w, h, r, fill, sw = 1.1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
export const part = (d, fill, sw = 1.1) =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
