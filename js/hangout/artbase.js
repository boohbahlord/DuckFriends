/* ---------- the drawings' shared pieces ----------
   Moved out of art.js to keep that file small (a pure move; the owner's, Nov 22). */

export const O = "#1c1c28"; // the ducks' ink
export const n1 = (v) => Math.round(v * 10) / 10;
/* a template tag that writes numbers with one decimal */
export const F = (s, ...v) =>
  s.reduce(
    (a, x, i) =>
      a +
      x +
      (i < v.length
        ? typeof v[i] === "number"
          ? n1(v[i])
          : (v[i] ?? "")
        : ""),
    "",
  );
export const ln = (w = 2.4, c = O) =>
  `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
let N = 0;
export const uid = () => "hg" + (++N).toString(36);
export const rnd = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; // the same "random" every time
export const wrap = (w, h, body, cls = "", defs = "") =>
  F`<svg class="hg${cls ? " " + cls : ""}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${defs ? "<defs>" + defs + "</defs>" : ""}${body}</svg>`;
/* a pair: [body, defs] for each part */
export const pair = (
  w,
  h,
  [b, bd = ""],
  [f, fd = ""],
  backFoot,
  frontFoot,
) => ({
  back: wrap(w, h, b, "hg-back", bd),
  front: wrap(w, h, f, "hg-front", fd),
  backFoot,
  frontFoot,
});
export const shade = (cx, cy, rx, ry, o = 0.32) =>
  F`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${o}"/>`;
export const R = (x, y, w, h, fill, more = "") =>
  F`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
export const glowDef = (id, c = "#ffb347", a = 0.55) =>
  F`<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset=".45" stop-color="${c}" stop-opacity="${a * 0.4}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
export const glassDef = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="#ffbd57"/><stop offset="1" stop-color="#f08a32"/></linearGradient>`;
/* round logs in rows R high, the rows lined up so one ends at y0 */
export const logDef = (id, y0 = 0, r = 17) =>
  F`<pattern id="${id}" width="240" height="${r}" patternUnits="userSpaceOnUse" y="${y0}"><rect width="240" height="${r}" fill="#a65a2a"/><rect y="${r * 0.12}" width="240" height="${r * 0.32}" fill="#d98d4e" opacity=".6"/><rect y="${r * 0.7}" width="240" height="${r * 0.3}" fill="#5e2a10" opacity=".5"/><path d="M0 ${r - 0.7}H240" stroke="#3a1906" stroke-width="1.5"/><path d="M30 ${r * 0.55}h34M122 ${r * 0.45}h22M182 ${r * 0.6}h40" stroke="#7a3a16" stroke-width="1" opacity=".6"/></pattern>`;
/* the cabin's shingles: their color, a lighter band on each row and the dark lines between them. Slate grey, not green:
   a green roof blended into the grass around it (the owner, Nov 17), and a red one into the logs */
export const ROOF = { base: "#454c5c", hi: "#8a93a6", line: "#1d2029" };
export const shingleDef = (id, sy = 1, rot = 0) =>
  F`<pattern id="${id}" width="56" height="48" patternUnits="userSpaceOnUse"${sy !== 1 || rot ? F` patternTransform="${rot ? `rotate(${rot})` : ""}${sy !== 1 ? ` scale(1 ${sy})` : ""}"` : ""}><rect width="56" height="48" fill="${ROOF.base}"/><rect width="56" height="7" fill="${ROOF.hi}" opacity=".35"/><rect y="24" width="56" height="7" fill="${ROOF.hi}" opacity=".35"/><path d="M0 23H56M0 47H56" stroke="${ROOF.line}" stroke-width="2.6"/><path d="M14 0V23M42 0V23M0 24V47M28 24V47M56 24V47" stroke="${ROOF.line}" stroke-width="1.8"/></pattern>`;
export const stoneStripDef = (id, hh = 16, y0 = 0) =>
  F`<pattern id="${id}" width="100" height="${hh}" patternUnits="userSpaceOnUse" y="${y0}"><rect width="100" height="${hh}" fill="#3a3c44"/><rect x="1.5" y="1.5" width="28" height="${hh - 3}" rx="4" fill="#80858f"/><rect x="32" y="1.5" width="22" height="${hh - 3}" rx="4" fill="#6d727c"/><rect x="56" y="1.5" width="26" height="${hh - 3}" rx="4" fill="#8f8a82"/><rect x="84" y="1.5" width="14.5" height="${hh - 3}" rx="4" fill="#757079"/></pattern>`;
/* hand-laid stones filling a box */
export function stones(x, y, w, h, seed, rowH = 22) {
  const r = rnd(seed),
    cols = ["#7e838d", "#8b8780", "#6c717b", "#979ca4", "#75706a"];
  let out = R(x, y, w, h, "#383a42");
  for (let yy = y + 2, row = 0; yy < y + h - 4; yy += rowH, row++) {
    const hh = Math.min(rowH - 3, y + h - 2 - yy);
    let xx = x + 2 - (row % 2 ? rowH * 0.6 : 0);
    while (xx < x + w - 3) {
      const sw = rowH * (1 + r() * 1.1),
        x0 = Math.max(x + 2, xx),
        x1 = Math.min(x + w - 2, xx + sw - 3);
      if (x1 - x0 > 4)
        out += F`<rect x="${x0}" y="${yy}" width="${x1 - x0}" height="${hh}" rx="${Math.min(6, hh / 2.5)}" fill="${cols[Math.floor(r() * cols.length)]}"/><rect x="${x0 + 2}" y="${yy + 1.5}" width="${Math.max(0, x1 - x0 - 6)}" height="${hh * 0.26}" rx="2" fill="#fff" opacity=".14"/>`;
      xx += sw;
    }
  }
  return out;
}
/* warm bulbs on a wire that sags between hooks: three sets that twinkle in turn (off: the power's out, dark bulbs) */
export const BULB_OFF = "#6e5a36";
export function stringLights(
  x0,
  x1,
  y,
  sag = 16,
  hook = 180,
  gap = 30,
  seed = 1,
  big = 1,
  off = false,
) {
  const n = Math.max(1, Math.round((x1 - x0) / hook)),
    seg = (x1 - x0) / n,
    sets = ["", "", ""];
  let wire = "",
    k = 0;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * seg,
      b = a + seg,
      m = (a + b) / 2;
    wire += F`M${a} ${y}Q${m} ${y + sag * 2} ${b} ${y}`;
    const nb = Math.max(2, Math.round(seg / gap));
    for (let j = 1; j < nb; j++) {
      const t = j / nb,
        bx = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * m + t * t * b,
        by = y + 2 * (1 - t) * t * sag * 2 + 5;
      sets[k++ % 3] +=
        big > 1
          ? F`<path d="M${bx} ${by - 2}V${by + 34}" stroke="#2a1a10" stroke-width="2.4"/>${off ? "" : F`<circle cx="${bx}" cy="${by + 34 + 7 * big}" r="${9 * big}" fill="#ffb347" opacity=".42"/>`}<ellipse cx="${bx}" cy="${by + 34 + 7 * big}" rx="${3.6 * big}" ry="${4.6 * big}" fill="${off ? BULB_OFF : "#ffe7a8"}" stroke="#6a3a12" stroke-width="1.6"/>`
          : F`${off ? "" : F`<circle cx="${bx}" cy="${by + 2}" r="9" fill="#ffb347" opacity=".3"/>`}<ellipse cx="${bx}" cy="${by + 2}" rx="3.6" ry="4.6" fill="${off ? BULB_OFF : "#ffd98a"}" stroke="#6a3a12" stroke-width="1.2"/>`;
    }
  }
  return (
    `<path d="${wire}" stroke="#2a1a10" stroke-width="2" fill="none"/>` +
    sets
      .map(
        (s, i) =>
          `<g class="hg-twinkle" style="animation-delay:-${(i * 0.8 + seed * 0.3).toFixed(1)}s">${s}</g>`,
      )
      .join("")
  );
}
const flameA = (cx, by, s) =>
  F`<path d="M${cx - 22 * s} ${by}C${cx - 30 * s} ${by - 30 * s} ${cx - 12 * s} ${by - 44 * s} ${cx - 8 * s} ${by - 70 * s}C${cx + 2 * s} ${by - 50 * s} ${cx + 10 * s} ${by - 58 * s} ${cx + 6 * s} ${by - 88 * s}C${cx + 26 * s} ${by - 60 * s} ${cx + 30 * s} ${by - 34 * s} ${cx + 22 * s} ${by}Z" fill="#ff8a2a" ${ln(2)}/><path d="M${cx - 13 * s} ${by}C${cx - 18 * s} ${by - 22 * s} ${cx - 4 * s} ${by - 34 * s} ${cx} ${by - 52 * s}C${cx + 10 * s} ${by - 34 * s} ${cx + 18 * s} ${by - 22 * s} ${cx + 13 * s} ${by}Z" fill="#ffc23f"/><path d="M${cx - 6 * s} ${by}C${cx - 8 * s} ${by - 12 * s} ${cx} ${by - 20 * s} ${cx + 1 * s} ${by - 28 * s}C${cx + 6 * s} ${by - 16 * s} ${cx + 8 * s} ${by - 8 * s} ${cx + 6 * s} ${by}Z" fill="#fff1a8"/>`;
const flameB = (cx, by, s) =>
  F`<path d="M${cx - 22 * s} ${by}C${cx - 32 * s} ${by - 26 * s} ${cx - 20 * s} ${by - 50 * s} ${cx - 2 * s} ${by - 84 * s}C${cx + 4 * s} ${by - 60 * s} ${cx + 16 * s} ${by - 64 * s} ${cx + 18 * s} ${by - 74 * s}C${cx + 30 * s} ${by - 46 * s} ${cx + 28 * s} ${by - 24 * s} ${cx + 22 * s} ${by}Z" fill="#ff8a2a" ${ln(2)}/><path d="M${cx - 13 * s} ${by}C${cx - 20 * s} ${by - 20 * s} ${cx - 8 * s} ${by - 36 * s} ${cx - 2 * s} ${by - 56 * s}C${cx + 8 * s} ${by - 36 * s} ${cx + 18 * s} ${by - 22 * s} ${cx + 13 * s} ${by}Z" fill="#ffc23f"/><path d="M${cx - 6 * s} ${by}C${cx - 9 * s} ${by - 10 * s} ${cx - 2 * s} ${by - 20 * s} ${cx - 1 * s} ${by - 30 * s}C${cx + 6 * s} ${by - 18 * s} ${cx + 8 * s} ${by - 8 * s} ${cx + 6 * s} ${by}Z" fill="#fff1a8"/>`;
export const fire = (cx, by, s) =>
  `<g class="hg-fire-a">${flameA(cx, by, s)}</g><g class="hg-fire-b">${flameB(cx, by, s)}</g>`;

/* ---------- the CSS for the moving bits (only under html.moving, like the rest of the game) ---------- */
export const HANG_ART_CSS = `
.hg-flicker,.hg-shimmer,.hg-smoke,.hg-spark{transform-box:fill-box;transform-origin:center}
.hg-fire-b{opacity:0}
html.moving .hg-flicker{animation:hgflick 3.3s ease-in-out infinite}
@keyframes hgflick{0%,100%{opacity:.85}12%{opacity:1}20%{opacity:.7}34%{opacity:.95}48%{opacity:.78}61%{opacity:1}70%{opacity:.62}74%{opacity:.92}88%{opacity:.8}}
html.moving .hg-fire-a{animation:hgfa .46s steps(1) infinite}
html.moving .hg-fire-b{animation:hgfb .46s steps(1) infinite}
@keyframes hgfa{0%{opacity:1}50%{opacity:0}}
@keyframes hgfb{0%{opacity:0}50%{opacity:1}}
html.moving .hg-twinkle{animation:hgtw 2.4s ease-in-out infinite alternate}
@keyframes hgtw{from{opacity:1}to{opacity:.45}}
html.moving .hg-shimmer{animation:hgsh 3.6s ease-in-out infinite alternate}
@keyframes hgsh{from{opacity:.35}to{opacity:1}}
.hg-smoke{opacity:0}
html.moving .hg-smoke{animation:hgsm 7s linear infinite}
@keyframes hgsm{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.35}100%{transform:translate(40px,-150px) scale(1.8);opacity:0}}
.hg-spark{opacity:0}
html.moving .hg-spark{animation:hgsp 1.9s linear infinite}
@keyframes hgsp{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(8px,-80px);opacity:0}}
`;
export function useHangArtCSS(doc = document) {
  if (doc.getElementById("hg-art-css")) return;
  const s = doc.createElement("style");
  s.id = "hg-art-css";
  s.textContent = HANG_ART_CSS;
  doc.head.append(s);
}
