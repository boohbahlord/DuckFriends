/* ---------- Downpour's drawings: the shared pieces ----------
   Moved out of stationart.js to keep that file small (a pure move; the owner's, Nov 22). */

import { O, F, ln } from "./artbase.js"; // (the same ink, number tag and line as Hangout's drawings: one copy)
export { O, n1, F, ln } from "./artbase.js";
let N = 0;
export const uid = () => "dp" + (++N).toString(36);
export const wrap = (w, h, body, defs = "", cls = "") =>
  F`<svg class="hg${cls ? " " + cls : ""}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${defs ? "<defs>" + defs + "</defs>" : ""}${body}</svg>`;
export const R = (x, y, w, h, fill, more = "") =>
  F`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
/* a box inside a thing H tall: floor plan x … x + w, y … y + d, from height z0 up to z1; its top and its south face */
export const box3 = (H, x, y, w, d, z0, z1, top, front, lw = 2.4) =>
  R(x, y - z1 + H, w, d, top, ln(lw)) +
  R(x, y + d - z1 + H, w, z1 - z0, front, ln(lw));
/* a shine along a top's front edge, the way the cabin's props catch the light */
export const shine = (x, y, w, c = "#fff", o = 0.22) =>
  F`<path d="M${x + 4} ${y}H${x + w - 4}" stroke="${c}" stroke-width="3" opacity="${o}"/>`;

/* ---------- the walls ----------
   The gas station's: painted concrete blocks, cream, with the red stripe of its sign near the top and the dirt of the
   swamp splashed up the foot; its front has the big shop windows (glass). The chapel's: white clapboard gone grey. */
export const SKINS = {
  gs: {
    top: "#849097",
    topHi: "#d6ccd8",
    topLo: "#414d59",
    end: "#9eb3a1",
    face: (id, wallH) =>
      F`<pattern id="${id}" width="64" height="24" patternUnits="userSpaceOnUse"><rect width="64" height="24" fill="#d0cfa2"/><path d="M0 11H64M0 23H64M16 0V11M48 12V24" stroke="#9eb3a1" stroke-width="3"/></pattern>`,
    band: (x, y, w, wallH) =>
      R(x, y + wallH * 0.1, w, wallH * 0.09, "#c7282a") +
      R(x, y + wallH * 0.19, w, 4, "#820a17"),
  },
  ch: {
    top: "#849097",
    topHi: "#d6ccd8",
    topLo: "#414d59",
    end: "#d6ccd8",
    face: (id) =>
      F`<pattern id="${id}" width="240" height="15" patternUnits="userSpaceOnUse"><rect width="240" height="16" fill="#f7f8f3"/><rect y="9" width="240" height="7" fill="#d6ccd8"/><path d="M0 15H240" stroke="#766d7c" stroke-width="2.4"/></pattern>`,
    band: (x, y, w, wallH) => R(x, y, w, 10, "#f7f8f3", ln(1.6)),
  },
};
/* the swamp's mud splashed up a wall's foot (foot: its bottom edge's y), flat colours so the pixels keep them */
export const dirt = (x, foot, w, wallH) =>
  R(x, foot - wallH * 0.14, w, wallH * 0.14, "#788b59") +
  R(x, foot - wallH * 0.07, w, wallH * 0.07, "#4d7e59");
/* the big shop windows in a face from a to b (x), y … y + h: dark glass in aluminium frames, a mullion every 120 or so,
   a kick panel under them; a light from the room shows faintly through */
export function shopGlass(id, a, b, y, h) {
  const n = Math.max(1, Math.round((b - a) / 120)),
    pw = (b - a) / n,
    gy = y + h * 0.26,
    gh = h * 0.6;
  let s = R(a - 6, gy - 6, b - a + 12, gh + 12, "#849097", ln(2.4));
  for (let i = 0; i < n; i++) {
    const x = a + i * pw;
    s +=
      R(x + 3, gy, pw - 6, gh, `url(#${id}g)`, ln(1.6)) +
      F`<path d="M${x + pw * 0.2} ${gy + gh - 4}L${x + pw * 0.62} ${gy + 4}M${x + pw * 0.36} ${gy + gh - 4}L${x + pw * 0.72} ${gy + 24}" stroke="#565d77" stroke-width="5"/>`;
  }
  s += R(a - 6, gy + gh + 6, b - a + 12, h * 0.1, "#414d59", ln(2));
  return s;
}
export const glassGrad = (id) =>
  F`<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2757"/><stop offset=".55" stop-color="#171d3a"/><stop offset="1" stop-color="#162c1f"/></linearGradient>`;
