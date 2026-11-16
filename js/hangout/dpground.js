/* ---------- Downpour's ground (Dead Ducks Arcade's second map, stationmap.js) ----------
   Flat pieces under everything, as shapes.js' GROUND() gives them to world.js (each { svg, x, y, w, h }, painted into
   tiles once): the forest floor past the owner's line, the swamp's grass inside it with mud and puddles, the concrete in
   front of the gas station and under the canopy, the gravel path to the chapel, the sunken road (its muddy sides, the
   asphalt, cracks, the faded lines), the flood over it (murky, deep at the west end), and the floors: the gas station's
   worn tiles, the chapel's planks and its red runner up the aisle. Night colors; the rain, the ripples and the lights
   go over it later (the owner's order: details, then rain and water, then lighting). Seeded: every screen the same. */
import * as GS from "./stationmap.js";

const n1 = (v) => Math.round(v * 10) / 10;
const rng = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const svg = (w, h, body, defs = "") =>
  `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;
const piece = (body, x, y, w, h, defs = "") => ({
  svg: svg(w, h, body, defs),
  x,
  y,
  w,
  h,
});
const poly = (P, dx = 0, dy = 0) =>
  P.map(([x, y]) => `${n1(x - dx)},${n1(y - dy)}`).join(" ");

/* the patterns, each a tile that repeats */
function grassTile(id, r) {
  const W = 400,
    H = 400;
  let b = `<rect width="${W}" height="${H}" fill="#24331f"/>`;
  for (let i = 0; i < 14; i++) {
    const x = r() * W,
      y = r() * H,
      rx = 20 + r() * 50;
    b += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(rx * 0.5)}" fill="${r() < 0.5 ? "#1b2817" : "#2c3d24"}" opacity=".7"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const x = r() * W,
      y = r() * H,
      rx = 14 + r() * 26;
    b += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(rx * 0.45)}" fill="#33291d" opacity=".55"/>`; // (mud showing through)
  }
  let p = "";
  for (let i = 0; i < 70; i++) {
    const x = 6 + r() * (W - 12),
      y = 12 + r() * (H - 16),
      l = 5 + r() * 7;
    p += `M${n1(x)} ${n1(y)}l${n1(-2 - r() * 2)} ${n1(-l)}M${n1(x)} ${n1(y)}l${n1(r())} ${n1(-l - 2)}M${n1(x)} ${n1(y)}l${n1(2 + r() * 2)} ${n1(-l + 1)}`;
  }
  b += `<path d="${p}" stroke="#3b5230" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>`;
  return `<pattern id="${id}" width="${W}" height="${H}" patternUnits="userSpaceOnUse">${b}</pattern>`;
}
function forestTile(id, r) {
  const W = 400,
    H = 400;
  let b = `<rect width="${W}" height="${H}" fill="#121c12"/>`;
  for (let i = 0; i < 60; i++)
    b += `<ellipse cx="${n1(r() * W)}" cy="${n1(r() * H)}" rx="${n1(4 + r() * 9)}" ry="${n1(2 + r() * 4)}" fill="${["#1d2a17", "#2a2416", "#17241a"][i % 3]}"/>`; // (dead leaves, moss)
  return `<pattern id="${id}" width="${W}" height="${H}" patternUnits="userSpaceOnUse">${b}</pattern>`;
}
function asphaltTile(id, r) {
  const W = 240,
    H = 240;
  let b = `<rect width="${W}" height="${H}" fill="#2a2b2f"/>`;
  for (let i = 0; i < 160; i++)
    b += `<rect x="${n1(r() * W)}" y="${n1(r() * H)}" width="2" height="2" fill="${r() < 0.5 ? "#36373c" : "#202125"}"/>`;
  return `<pattern id="${id}" width="${W}" height="${H}" patternUnits="userSpaceOnUse">${b}</pattern>`;
}
function concreteTile(id, r) {
  const W = 200,
    H = 200;
  let b = `<rect width="${W}" height="${H}" fill="#47484b"/><path d="M0 0H${W}M0 0V${H}" stroke="#36373a" stroke-width="3"/>`;
  for (let i = 0; i < 40; i++)
    b += `<rect x="${n1(r() * W)}" y="${n1(r() * H)}" width="3" height="2" fill="#3b3c3f"/>`;
  return `<pattern id="${id}" width="${W}" height="${H}" patternUnits="userSpaceOnUse">${b}</pattern>`;
}
function tileFloor(id) {
  const S = 60;
  return `<pattern id="${id}" width="${2 * S}" height="${2 * S}" patternUnits="userSpaceOnUse"><rect width="${2 * S}" height="${2 * S}" fill="#7c7a72"/><rect width="${S}" height="${S}" fill="#5f5d57"/><rect x="${S}" y="${S}" width="${S}" height="${S}" fill="#5f5d57"/><path d="M0 0H${2 * S}M0 ${S}H${2 * S}M0 0V${2 * S}M${S} 0V${2 * S}" stroke="#4a4944" stroke-width="2"/></pattern>`;
}
function plankFloor(id) {
  const W = 320,
    H = 36;
  return `<pattern id="${id}" width="${W}" height="${2 * H}" patternUnits="userSpaceOnUse"><rect width="${W}" height="${2 * H}" fill="#4f3522"/><rect y="${H}" width="${W}" height="${H}" fill="#56392a"/><path d="M0 0H${W}M0 ${H}H${W}M120 0V${H}M280 ${H}V${2 * H}M40 ${H}V${2 * H}" stroke="#2e1f14" stroke-width="3"/></pattern>`;
}

/* the whole map's ground (piece by piece, so a tile only draws the pieces it touches) */
export function downpourGround() {
  const r = rng(20261117),
    R = GS.ROAD,
    W = GS.GS_W,
    H = GS.GS_H,
    G = [];
  /* the forest floor everywhere, the swamp's grass inside the line: in bands, so no tile draws the whole map */
  const BAND = 800;
  const bandDefs = forestTile("dpf", rng(7)) + grassTile("dpg", rng(11)); // (tiles of 400: the bands, 800 tall, meet seamlessly)
  for (let y = 0; y < H; y += BAND) {
    const h = Math.min(BAND, H - y);
    G.push(
      piece(
        `<rect width="${W}" height="${h}" fill="url(#dpf)"/><polygon points="${poly(GS.TOP, 0, y)}" fill="url(#dpg)"/><polygon points="${poly(GS.BOT, 0, y)}" fill="url(#dpg)"/>`,
        0,
        y,
        W,
        h,
        bandDefs,
      ),
    );
  }
  /* mud and puddles on the open ground (not on the floors, the road or the concrete) */
  const busy = [
    [
      GS.STATION.x0 - 40,
      GS.STATION.y0 - 40,
      GS.STATION.x1 + 40,
      GS.STATION.y1 + 40,
    ],
    [GS.CHAPEL.x0 - 40, GS.CHAPEL.y0 - 40, GS.TOWER.x1 + 40, GS.CHAPEL.y1 + 40],
    [0, R.y0 - 160, W, R.y1 + 160],
    [1200, 1750, 3400, 2650],
  ];
  for (let k = 0; k < 90; k++) {
    const x = 200 + r() * (W - 400),
      y = 200 + r() * (H - 400),
      rx = 40 + r() * 110,
      ry = rx * (0.35 + r() * 0.2),
      wet = r() < 0.45;
    if (
      !GS.inOpen(x, y) ||
      busy.some(
        ([a, b, c, d]) => x > a - rx && x < c + rx && y > b - ry && y < d + ry,
      )
    )
      continue;
    const w = 2 * rx + 20,
      h = 2 * ry + 20;
    G.push(
      piece(
        `<ellipse cx="${n1(w / 2)}" cy="${n1(h / 2)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="#2e251a" opacity=".85"/>` +
          (wet
            ? `<ellipse cx="${n1(w / 2 + rx * 0.08)}" cy="${n1(h / 2)}" rx="${n1(rx * 0.72)}" ry="${n1(ry * 0.62)}" fill="#1c2a2c"/><ellipse cx="${n1(w / 2 - rx * 0.2)}" cy="${n1(h / 2 - ry * 0.2)}" rx="${n1(rx * 0.3)}" ry="${n1(ry * 0.15)}" fill="#5a7280" opacity=".35"/>`
            : ""),
        n1(x - w / 2),
        n1(y - h / 2),
        n1(w),
        n1(h),
      ),
    );
  }
  /* concrete: the gas station's forecourt, under the canopy, down to the road */
  {
    const x0 = 1200,
      y0 = GS.STATION.y1,
      x1 = 3400,
      y1 = R.y0 + 20;
    G.push(
      piece(
        `<rect width="${x1 - x0}" height="${y1 - y0}" fill="url(#dpc)"/><path d="M300 120l90 60 40 110M1500 300l-60 80-20 120M900 700l120-40 60 30" stroke="#2b2c2e" stroke-width="4" fill="none"/>`,
        x0,
        y0,
        x1 - x0,
        y1 - y0,
        concreteTile("dpc", rng(13)),
      ),
    );
  }
  /* the gravel path from the road to the chapel's doors */
  {
    const x0 = GS.CHAPEL_DOOR.a - 30,
      x1 = GS.CHAPEL_DOOR.b + 30,
      y0 = R.y1 - 20,
      y1 = GS.CHAPEL.y0 + 10;
    let dots = "";
    const q = rng(17);
    for (let i = 0; i < 260; i++)
      dots += `<circle cx="${n1(q() * (x1 - x0))}" cy="${n1(q() * (y1 - y0))}" r="${n1(2 + q() * 3)}" fill="${q() < 0.5 ? "#5b5650" : "#3f3b36"}"/>`;
    G.push(
      piece(
        `<rect width="${x1 - x0}" height="${y1 - y0}" rx="30" fill="#48433c"/>${dots}`,
        x0,
        y0,
        x1 - x0,
        y1 - y0,
      ),
    );
  }
  /* the road: muddy sides where it sinks, the asphalt, cracks, faded lines */
  {
    const h = R.y1 - R.y0,
      side = R.ramp;
    let dash = "",
      cracks = "";
    for (let x = 30; x < W; x += 180)
      dash += `<rect x="${x}" y="${h / 2 - 6}" width="100" height="12" fill="#b8a656" opacity="${n1(0.35 + r() * 0.3)}"/>`;
    for (let k = 0; k < 40; k++) {
      let x = r() * W,
        y = side + r() * (h - 2 * side),
        d = `M${n1(x)} ${n1(y)}`;
      for (let s = 0; s < 4; s++) {
        x += -40 + r() * 80;
        y += -25 + r() * 50;
        d += `L${n1(x)} ${n1(y)}`;
      }
      cracks += `<path d="${d}" stroke="#18191c" stroke-width="3" fill="none"/>`;
    }
    G.push(
      piece(
        `<rect width="${W}" height="${h}" fill="url(#dpa)"/><rect width="${W}" height="${side}" fill="#2f281d"/><rect y="${h - side}" width="${W}" height="${side}" fill="#2f281d"/><rect width="${W}" height="${side}" fill="url(#dpsh)"/><rect y="${h - side}" width="${W}" height="${side}" fill="url(#dpsh2)"/>` +
          `<rect y="${side + 10}" width="${W}" height="6" fill="#9a9a96" opacity=".35"/><rect y="${h - side - 16}" width="${W}" height="6" fill="#9a9a96" opacity=".35"/>${dash}${cracks}`,
        0,
        R.y0,
        W,
        h,
        asphaltTile("dpa", rng(19)) +
          `<linearGradient id="dpsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24331f"/><stop offset="1" stop-color="#2a2b2f" stop-opacity=".3"/></linearGradient><linearGradient id="dpsh2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#24331f"/><stop offset="1" stop-color="#2a2b2f" stop-opacity=".3"/></linearGradient>`,
      ),
    );
  }
  /* the flood: murky water over the road, the deep end at the west darker, soft where the shallow one thins out */
  {
    const [x0, y0, x1, y1] = GS.SHALLOW,
      [d0, , d1] = GS.DEEP,
      h = y1 - y0;
    G.push(
      piece(
        `<rect width="${x1 - x0}" height="${h}" fill="url(#dpw)"/>`,
        x0,
        y0,
        x1 - x0,
        h,
        `<linearGradient id="dpw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22383a" stop-opacity=".88"/><stop offset=".85" stop-color="#2b4446" stop-opacity=".7"/><stop offset="1" stop-color="#2b4446" stop-opacity="0"/></linearGradient>`,
      ),
    );
    G.push(
      piece(
        `<rect width="${d1 - d0}" height="${h}" fill="url(#dpd)"/>`,
        d0,
        y0,
        d1 - d0,
        h,
        `<linearGradient id="dpd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d1a1d" stop-opacity=".97"/><stop offset=".8" stop-color="#16282b" stop-opacity=".93"/><stop offset="1" stop-color="#22383a" stop-opacity=".88"/></linearGradient>`,
      ),
    );
  }
  /* the floors */
  {
    const S = GS.STATION;
    G.push(
      piece(
        `<rect width="${S.x1 - S.x0}" height="${S.y1 - S.y0}" fill="url(#dpt)"/><rect width="${S.x1 - S.x0}" height="${S.y1 - S.y0}" fill="#1a1712" opacity=".25"/>`,
        S.x0,
        S.y0,
        S.x1 - S.x0,
        S.y1 - S.y0,
        tileFloor("dpt"),
      ),
    );
    const C = GS.CHAPEL,
      a0 = 2200 - C.x0,
      a1 = 2400 - C.x0;
    G.push(
      piece(
        `<rect width="${C.x1 - C.x0}" height="${C.y1 - C.y0}" fill="url(#dpp)"/><rect x="${a0}" y="0" width="${a1 - a0}" height="${C.y1 - C.y0}" fill="#6b1c1f"/><path d="M${a0 + 10} 0V${C.y1 - C.y0}M${a1 - 10} 0V${C.y1 - C.y0}" stroke="#a8862f" stroke-width="5" opacity=".6"/>`,
        C.x0,
        C.y0,
        C.x1 - C.x0,
        C.y1 - C.y0,
        plankFloor("dpp"),
      ),
    );
  }
  return G;
}
/* the plain color under a tile till it's painted */
export const dpGroundColor = (y) =>
  y >= GS.ROAD.y0 && y < GS.ROAD.y1 ? "#2a2b2f" : "#1f2c1b";
