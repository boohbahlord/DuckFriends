/* ---------- the cabin's shell: walls, doors, fireplace ----------
   Moved out of art.js to keep that file small (a pure move; the owner's, Nov 22). */
import { DOOR } from "./layout.js";

import {
  BULB_OFF,
  F,
  O,
  R,
  fire,
  glassDef,
  glowDef,
  ln,
  logDef,
  n1,
  pair,
  rnd,
  shingleDef,
  stoneStripDef,
  stones,
  stringLights,
  uid,
  wrap,
} from "./artbase.js";

/* the chimney: it goes up from the fireplace inside, against the north wall (depth d0 … d1 from the wall's line), and
   comes out of the roof's north slope right there, rise over it */
export const CHIMNEY = { d0: 12, d1: 102, rise: 150 };
export const chimneyTop = (wallH, roofH = 520, d = 1600) =>
  wallH + roofH * Math.min(1, CHIMNEY.d1 / (d / 2)) + CHIMNEY.rise;
/* ---------- the cabin, outside ----------
   Round orange-brown logs, a steep slate grey shingle roof whose ridge runs east-west, a big A-frame gable over the back
   door (the triangle window) facing the deck, a stone chimney, glowing windows, string lights along the eave, and a
   little porch roof over the front door on the north side (the door itself faces away). x positions are from the
   cabin's west wall. Box: w × (d + 290); its bottom is the south wall's foot (foot: y = h), the footprint's north
   edge is at y = h − d. */
export function cabinOutside({
  w = 3000,
  d = 1600,
  h = d + 290,
  wallH = 170,
  roofH = 520,
  backDoor = 1500,
  frontDoor = 700,
  chimney = 1000,
  gable = 760,
  windows = [280, 640, 1000, 2240, 2640],
  dormers = [560, 2440],
  lights = true,
  door = DOOR,
  dark = false,
} = {}) {
  const id = uid(),
    Y0 = h - d,
    B = h,
    wt = B - wallH,
    sE = wt + 36,
    nE = Y0 - wallH - 50,
    ridge = Y0 + d / 2 - wallH - roofH;
  const gx = backDoor,
    gw = gable / 2,
    gH = 330,
    gA = wt - gH,
    gR = gA - (gH * d) / 2 / roofH;
  const roofAt = (dep) => wallH + roofH * Math.min(1, dep / (d / 2));
  const defs =
    logDef(id + "l", B % 17) +
    shingleDef(id + "s") +
    shingleDef(id + "n", 0.42) +
    shingleDef(id + "v", 1, 90) +
    (dark ? DARK_GLASS(id + "g") : glassDef(id + "g")) +
    glowDef(id + "w", "#ffb347", dark ? 0 : 0.42) +
    glowDef(id + "p", "#ffbe5c", dark ? 0 : 0.6) +
    stoneStripDef(id + "f", 16, B - 16) +
    `<linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d4ff" stop-opacity=".14"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>` +
    `<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".1"/><stop offset=".5" stop-color="#bfe0ff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>`;
  let s = "";
  /* the front porch on the north side: a lantern's glow and a little gable roof poking out past the north eave */
  const fd = frontDoor;
  s += F`<ellipse cx="${fd}" cy="${Y0 - 170}" rx="150" ry="70" fill="url(#${id}p)" class="hg-flicker"/>`;
  s +=
    F`<path d="M${fd - 100} ${Y0 - 238}L${fd} ${Y0 - 290}V${Y0 - 200}L${fd - 100} ${Y0 - 148}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${fd + 100} ${Y0 - 238}L${fd} ${Y0 - 290}V${Y0 - 200}L${fd + 100} ${Y0 - 148}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${fd + 100} ${Y0 - 238}L${fd} ${Y0 - 290}V${Y0 - 200}L${fd + 100} ${Y0 - 148}Z" fill="#000" opacity=".3"/>` +
    F`<path d="M${fd - 104} ${Y0 - 236}L${fd} ${Y0 - 292}L${fd + 104} ${Y0 - 236}" stroke="${O}" stroke-width="13" fill="none" stroke-linejoin="round"/><path d="M${fd - 104} ${Y0 - 236}L${fd} ${Y0 - 292}L${fd + 104} ${Y0 - 236}" stroke="#d0803e" stroke-width="8" fill="none" stroke-linejoin="round"/>`;
  /* the north slope (seen steeply, so short), then the chimney that comes up through it */
  s +=
    R(0, nE, w, ridge - nE, `url(#${id}n)`, ln(3)) +
    R(0, nE, w, ridge - nE, "#000", 'opacity=".28"');
  const cw = 116,
    cd0 = CHIMNEY.d0,
    cd1 = CHIMNEY.d1,
    cz = chimneyTop(wallH, roofH, d),
    ct = Y0 + cd0 - cz,
    cf = Y0 + cd1 - cz,
    cb = Y0 + cd1 - roofAt(cd1),
    cxl = chimney - cw / 2;
  s += F`<g class="hg-smoke" style="animation-delay:-1s"><circle cx="${chimney + 6}" cy="${ct - 6}" r="20" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-3.4s"><circle cx="${chimney - 4}" cy="${ct - 6}" r="16" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-5.6s"><circle cx="${chimney + 2}" cy="${ct - 6}" r="18" fill="#c9cfdb"/></g>`;
  s +=
    stones(cxl, cf, cw, cb - cf, 11, 20) +
    R(cxl, cf, cw, cb - cf, "none", ln(2.6)) +
    R(cxl, cf, cw, cb - cf, "#000", 'opacity=".18"') +
    R(cxl - 4, cb - 12, cw + 8, 14, "#4a4d56", ln(2.2)) +
    stones(cxl, ct, cw, cf - ct, 12, 20) +
    R(cxl, ct, cw, cf - ct, "none", ln(2.6)) +
    R(cxl - 8, ct - 6, cw + 16, 16, "#5e626c", ln(2.4)) +
    R(cxl - 8, ct + 10, cw + 16, 8, "#43464f", ln(2)) +
    F`<rect x="${chimney - 26}" y="${ct + 22}" width="52" height="${cf - ct - 34}" rx="6" fill="#141418" ${ln(2)}/>`;
  /* the south wall: logs on a stone foundation, log ends at the corners */
  s +=
    R(12, wt, w - 24, wallH, `url(#${id}l)`, ln(3)) +
    R(12, B - 16, w - 24, 16, `url(#${id}f)`, ln(2.2));
  for (let y = B - 16 - 8.5; y > wt + 6; y -= 17)
    for (const x of [12, w - 12])
      s += F`<circle cx="${x}" cy="${y}" r="9" fill="#dca36a" stroke="#5e2a10" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#a0602c" stroke-width="1.3"/>`;
  /* windows: a warm glow on the logs around each, a frame, the glass, a cross and a sill */
  const win = (x, ww, hh, yb) =>
    F`<ellipse cx="${x}" cy="${yb - hh / 2}" rx="${ww * 1.25}" ry="${hh * 1.2}" fill="url(#${id}w)"/>` +
    R(x - ww / 2, yb - hh, ww, hh, "#d98a4a", `rx="3" ${ln(2.6)}`) +
    R(x - ww / 2 + 7, yb - hh + 7, ww - 14, hh - 14, `url(#${id}g)`, ln(1.6)) +
    F`<path d="M${x - ww / 2 + 7} ${yb - hh + 7}h${ww * 0.2}l${-ww * 0.2} ${hh * 0.45}ZM${x + ww / 2 - 7} ${yb - hh + 7}h${-ww * 0.2}l${ww * 0.2} ${hh * 0.45}Z" fill="#c2562e" opacity=".85"/>` +
    F`<path d="M${x} ${yb - hh + 7}V${yb - 7}M${x - ww / 2 + 7} ${yb - hh / 2}H${x + ww / 2 - 7}" stroke="#8a4a1f" stroke-width="5"/>` +
    R(x - ww / 2 - 8, yb - 4, ww + 16, 9, "#c87a3c", ln(2.2));
  for (const x of windows) s += win(x, 124, 80, B - 38);
  for (const x of [gx - 150, gx + 150]) s += win(x, 92, 98, B - 30);
  /* the back door (glass, lit) and two lanterns beside it */
  s += doorBody(gx, B, door, `url(#${id}g)`);
  for (const x of [gx - 66, gx + 66])
    s += F`<circle cx="${x}" cy="${B - 92}" r="38" fill="url(#${id}p)" class="hg-flicker" style="animation-delay:-${x % 3}s"/><rect x="${x - 7}" y="${B - 104}" width="14" height="20" rx="3" fill="${dark ? BULB_OFF : "#ffd98a"}" ${ln(2)}/><path d="M${x - 9} ${B - 105}h18M${x} ${B - 84}v8" stroke="${O}" stroke-width="3"/>`;
  /* the south slope (notched where the gable comes forward), its gradient, the eave's fascia and shadow */
  const sp = F`M0 ${ridge}H${w}V${sE}H${gx + gw}V${wt}H${gx - gw}V${sE}H0Z`;
  s +=
    F`<path d="${sp}" fill="url(#${id}s)" ${ln(3)}/><path d="${sp}" fill="url(#${id}r)"/><path d="${sp}" fill="url(#${id}m)"/>` +
    R(12, sE + 2, gx - gw - 12, 12, "#000", 'opacity=".28"') +
    R(gx + gw, sE + 2, w - 12 - gx - gw, 12, "#000", 'opacity=".28"') +
    R(-6, sE - 12, gx - gw + 6, 13, "#c26d32", ln(2.2)) +
    R(gx + gw, sE - 12, w - gx - gw + 6, 13, "#c26d32", ln(2.2));
  s +=
    R(-6, ridge - 8, w + 12, 15, "#1d3a30", ln(2.6)) +
    F`<path d="M0 ${ridge - 4}H${w}" stroke="#7fb89a" stroke-width="2" opacity=".45"/>`;
  s +=
    R(-10, nE - 4, 14, sE - nE + 4, "#c26d32", ln(2.4)) +
    R(w - 4, nE - 4, 14, sE - nE + 4, "#c26d32", ln(2.4));
  /* dormers on the south slope, each with a lit window */
  const yS = (sb, H) => B - sb - H,
    sAt = (H) => ((H - wallH) * (d / 2)) / roofH;
  for (const dx of dormers) {
    const s0 = 300,
      hb = wallH + (roofH * s0) / (d / 2),
      he = hb + 74,
      ha = he + 84,
      hw = 112;
    const fy = yS(s0, he),
      by = yS(s0, hb),
      ay = yS(s0, ha),
      ry = yS(sAt(ha), ha),
      ey = yS(sAt(he), he);
    s +=
      F`<path d="M${dx - hw - 14} ${by + 10}H${dx + hw + 14}" stroke="#000" stroke-width="14" opacity=".25"/>` +
      F`<path d="M${dx - hw - 10} ${fy + 6}L${dx} ${ay - 8}L${dx} ${ry}L${dx - hw - 10} ${ey}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${dx + hw + 10} ${fy + 6}L${dx} ${ay - 8}L${dx} ${ry}L${dx + hw + 10} ${ey}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${dx + hw + 10} ${fy + 6}L${dx} ${ay - 8}L${dx} ${ry}L${dx + hw + 10} ${ey}Z" fill="#000" opacity=".3"/>` +
      R(dx - hw, fy, 2 * hw, by - fy, `url(#${id}l)`, ln(2.6)) +
      F`<path d="M${dx - hw} ${fy}H${dx + hw}L${dx} ${ay}Z" fill="url(#${id}l)" ${ln(2.6)}/>` +
      win(dx, 120, 54, by - 10) +
      F`<path d="M${dx - 32} ${fy - 8}H${dx + 32}L${dx} ${ay + 18}Z" fill="url(#${id}g)" ${ln(2)}/>` +
      F`<path d="M${dx - hw - 12} ${fy + 8}L${dx} ${ay - 9}L${dx + hw + 12} ${fy + 8}" stroke="${O}" stroke-width="15" fill="none" stroke-linejoin="round"/><path d="M${dx - hw - 12} ${fy + 8}L${dx} ${ay - 9}L${dx + hw + 12} ${fy + 8}" stroke="#d0803e" stroke-width="10" fill="none" stroke-linejoin="round"/>`;
  }
  /* the gable over the back door: its two roof planes, then the log triangle with the big window and its trim */
  const L = F`M${gx - gw - 26} ${wt + 26}L${gx} ${gA - 24}L${gx} ${gR}Z`,
    Rt = F`M${gx + gw + 26} ${wt + 26}L${gx} ${gA - 24}L${gx} ${gR}Z`;
  s += F`<path d="${L}" fill="url(#${id}v)" ${ln(3)}/><path d="${L}" fill="#a8d4ff" opacity=".07"/><path d="${Rt}" fill="url(#${id}v)" ${ln(3)}/><path d="${Rt}" fill="#000" opacity=".3"/><path d="M${gx} ${gA - 20}V${gR}" stroke="#1d3a30" stroke-width="12"/><path d="M${gx} ${gA - 20}V${gR}" stroke="#7fb89a" stroke-width="2" opacity=".4"/>`;
  const tw = (gw * 200) / 380,
    ty = wt - 16,
    ta = gA + 100,
    my = wt - 90,
    mw = (tw * (my - ta)) / (ty - ta);
  s +=
    F`<path d="M${gx - gw} ${wt}H${gx + gw}L${gx} ${gA}Z" fill="url(#${id}l)" ${ln(3)}/>` +
    F`<ellipse cx="${gx}" cy="${(ty + ta) / 2 + 20}" rx="${tw * 1.3}" ry="${(ty - ta) * 0.9}" fill="url(#${id}w)"/>` +
    F`<path d="M${gx - tw} ${ty}H${gx + tw}L${gx} ${ta}Z" fill="url(#${id}g)" stroke="${O}" stroke-width="15" stroke-linejoin="round"/><path d="M${gx - tw} ${ty}H${gx + tw}L${gx} ${ta}Z" fill="none" stroke="#d98a4a" stroke-width="9" stroke-linejoin="round"/>` +
    F`<path d="M${gx} ${ta + 6}V${ty}M${gx - mw} ${my}H${gx + mw}" stroke="#8a4a1f" stroke-width="6"/><path d="M${gx - tw * 0.55} ${ty - 4}L${gx - tw * 0.3} ${my + 4}" stroke="#fff6d8" stroke-width="5" opacity=".45" stroke-linecap="round"/>` +
    R(
      gx - (gw * (gA + 70 - gA)) / gH - 6,
      gA + 62,
      (2 * gw * 70) / gH + 12,
      14,
      "#d0803e",
      ln(2.2),
    ) +
    R(gx - 7, gA + 4, 14, 60, "#d0803e", ln(2.2)) +
    R(gx - gw - 14, wt - 8, gable + 28, 16, "#d0803e", ln(2.4));
  s += F`<path d="M${gx - gw - 26} ${wt + 26}L${gx} ${gA - 24}L${gx + gw + 26} ${wt + 26}" stroke="${O}" stroke-width="24" fill="none" stroke-linejoin="round"/><path d="M${gx - gw - 26} ${wt + 26}L${gx} ${gA - 24}L${gx + gw + 26} ${wt + 26}" stroke="#d0803e" stroke-width="17" fill="none" stroke-linejoin="round"/><path d="M${gx - gw - 22} ${wt + 20}L${gx} ${gA - 28}" stroke="#f0a862" stroke-width="3" fill="none" opacity=".6"/>`;
  if (lights)
    s +=
      stringLights(30, gx - gw - 30, sE + 2, 12, 170, 30, 1, 1, dark) +
      stringLights(gx + gw + 30, w - 30, sE + 2, 12, 170, 30, 2, 1, dark) +
      stringLights(
        gx - gw + 20,
        gx + gw - 20,
        wt + 12,
        10,
        150,
        30,
        3,
        1,
        dark,
      );
  return wrap(w, h, s, "hg-cabin", defs);
}

/* ---------- holes broken through a wall (Downpour's), like the ones the zombies come in by ----------
   holeCut: a hole's outline, a closed path: up its left side from (x0, bottom), across its top at y = top, down its right
   side to (x1, bottom), every edge zigzagging (jag px either way); one seed, the same zigzag every time */
export function holeCut(x0, x1, top, bottom, seed = 1, jag = 7) {
  const r = rnd(seed * 7919 + 13),
    pts = [];
  const edge = (ax, ay, bx, by, sx, sy) => {
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 14));
    for (let i = 0; i < n; i++) {
      const u = i / n,
        k = i ? (i % 2 ? 1 : -1) * jag * (0.35 + 0.65 * r()) : 0;
      pts.push([ax + (bx - ax) * u + sx * k, ay + (by - ay) * u + sy * k]);
    }
  };
  edge(x0, bottom, x0, top, 1, 0);
  edge(x0, top, x1, top, 0, 1);
  edge(x1, top, x1, bottom, 1, 0);
  pts.push([x1, bottom]);
  return "M" + pts.map(([x, y]) => F`${x} ${y}`).join("L") + "Z";
}
/* a drawing (an <svg>, w × h) with holes cut out of it (holeCut's paths): each broken edge a dark band of splintered logs
   and the ink line, on the wall's side only, and nothing past the drawing's box (a hole's edges may run on past it) */
export function holed(svg, w, h, cuts) {
  const id = uid(),
    head = svg.match(/^<svg[^>]*>/)[0],
    body = svg.slice(head.length, svg.lastIndexOf("</svg>")),
    all = cuts.join("");
  return (
    head +
    F`<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#fff"/><path d="${all}" fill="#000"/></mask></defs>` +
    F`<g mask="url(#${id})">${body}<path d="${all}" fill="none" stroke="#4a2c14" stroke-width="11" stroke-linejoin="round"/><path d="${all}" fill="none" stroke="#2a1a0e" stroke-width="5" stroke-linejoin="round"/><path d="${all}" fill="none" ${ln(2.6)}/></g></svg>`
  );
}

/* ---------- the cabin, inside ---------- */
/* a log wall cut away. axis 'x' runs east-west, w long: box w × (t + wallH): the cut top (t deep), then the face that
   looks south; doors are gaps [from, to] along it, windows [from, to] look out at the grass. axis 'y' runs north-south:
   w = t, box t × (length + wallH): the cut top, then the south end's log ends (plain: the top's wood on down to the floor); doors are gaps [from, to] along y.
   Foot: y = h (an 'x' wall); a 'y' wall is long in depth, so give it a foot per gap-free piece or keep it low. */
export function logWall({
  w,
  h,
  axis = "x",
  wallH = 40,
  t = 24,
  doors = [],
  windows = [],
  plain = false,
  rowsH,
  open = false,
  seamless = false,
} = {}) {
  w = axis === "x" ? w || 400 : t;
  const id = uid(),
    len = axis === "x" ? w : (h || 400 + wallH) - wallH;
  h = axis === "x" ? t + wallH : len + wallH;
  const segs = [],
    ds = [...doors].sort((a, b) => a[0] - b[0]);
  let at = 0;
  for (const [a, b] of ds) {
    if (a > at) segs.push([at, a]);
    at = Math.max(at, b);
  }
  if (at < len) segs.push([at, len]);
  let s = "",
    defs = logDef(id, (rowsH ?? h) % 17); // (rowsH: a piece over a door lines its logs up with the whole wall's, rowsH tall)
  if (axis === "x") {
    for (const [a, b] of segs) {
      if (seamless) {
        // (seamless: a piece laid over the ends of the wall pieces either side of it, so no seam shows: no side lines,
        // and no foot line, the door's frame under it has its own)
        s +=
          R(a, t, b - a, wallH, `url(#${id})`) +
          R(a, 0, b - a, t, "#c98a52") +
          F`<path d="M${a} 0H${b}M${a} ${t}H${b}" fill="none" ${ln(2.6)}/><path d="M${a} ${t * 0.4}H${b}" stroke="#e8b27a" stroke-width="3" opacity=".7"/><path d="M${a} ${t - 4}H${b}" stroke="#8a4f22" stroke-width="2"/>`;
        continue;
      }
      s +=
        R(a, t, b - a, wallH, `url(#${id})`, ln(2.6)) +
        R(a, 0, b - a, t, "#c98a52", ln(2.6)) +
        F`<path d="M${a + 3} ${t * 0.4}H${b - 3}" stroke="#e8b27a" stroke-width="3" opacity=".7"/><path d="M${a + 3} ${t - 4}H${b - 3}" stroke="#8a4f22" stroke-width="2"/>`;
      if (a > 0) s += R(a - 2, 0, 10, h, "#6e3a1a", ln(2));
      if (b < len) s += R(b - 8, 0, 10, h, "#6e3a1a", ln(2));
    }
    if (windows.length) {
      // (seen from inside, looking down a little: the grass outside, in the dark)
      defs += F`<linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173528"/><stop offset="1" stop-color="#24503d"/></linearGradient>`;
      for (const [a, b] of windows) {
        const wy = t + wallH * 0.2,
          wh = wallH * 0.5,
          r = rnd(a + 7);
        let grass = "";
        for (let i = 0; i < 9; i++) {
          const gx = a + 8 + r() * (b - a - 16),
            gy = wy + 10 + r() * (wh - 14);
          grass += F`<path d="M${gx - 3} ${gy}l2 -7l1 7M${gx + 1} ${gy}l3 -6" stroke="#3f7a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
        }
        grass += F`<path d="M${a} ${wy + wh * 0.3}h${b - a}" stroke="#5aa0ff" stroke-width="${wh * 0.5}" opacity=".05"/>`;
        s +=
          R(
            a - 8,
            wy - 8,
            b - a + 16,
            wh + 16,
            "#d98a4a",
            `rx="3" ${ln(2.4)}`,
          ) +
          R(a, wy, b - a, wh, `url(#${id}n)`, ln(1.6)) +
          grass +
          F`<path d="M${(a + b) / 2} ${wy}V${wy + wh}M${a} ${wy + wh / 2}H${b}" stroke="#8a4a1f" stroke-width="5"/>` +
          R(a - 12, wy + wh + 6, b - a + 24, 8, "#c87a3c", ln(2));
      }
    }
  } else {
    for (const [a, b] of segs) {
      const e = plain ? b + wallH : b; // (plain: the wall's own wood runs on down to the floor, no log ends: by an open doorway, over the south wall's low line)
      s +=
        open && !a // (open: it carries on a run of pieces from the one north of it, its top edge unlined so no seam shows)
          ? R(0, a, w, e - a, "#c98a52") +
            F`<path d="M0 ${a}V${e}H${w}V${a}" fill="none" ${ln(2.6)}/><path d="M${w * 0.4} ${a}V${e - 3}" stroke="#e8b27a" stroke-width="3" opacity=".7"/>`
          : R(0, a, w, e - a, "#c98a52", ln(2.6)) +
            F`<path d="M${w * 0.4} ${a + 3}V${e - 3}" stroke="#e8b27a" stroke-width="3" opacity=".7"/>`;
      if (plain) continue;
      s += R(0, b, w, wallH, "#8f4c22", ln(2.6));
      for (let y = b + wallH - 8.5; y > b + 4; y -= 17)
        s += F`<ellipse cx="${w / 2}" cy="${y}" rx="${w / 2 - 1.5}" ry="8" fill="#dca36a" stroke="#5e2a10" stroke-width="1.4"/><ellipse cx="${w / 2}" cy="${y}" rx="${w / 4}" ry="4" fill="none" stroke="#a0602c" stroke-width="1.2"/>`;
    }
  }
  return wrap(w, h, s, "hg-wall", defs);
}
/* ---------- doors ---------- */
/* the cabin's door (the front door and the back door, from inside and from outside: one door): a frame, the door with a
   window of four panes (glass: its fill, lit from inside or the night outside), a brass knob on the side away from the
   hinge, off the glass, and the sill. Its size is layout.js' DOOR: w × h the door, the frame `frame` round its top and
   sides (the walls' opening). */
const DOOR_GLASS = { x: 12, y: 8, w: 40, h: 64 }; // (the window in the door: from its left and top, of a 64 × 112 door)
const DOOR_KNOB = { x: 58, y: 62, r: 3.2 }; // (the knob: off the glass, inside the door's edge)
/* the door's parts, its foot's middle at (cx, b) */
function doorBody(
  cx,
  b,
  { w = 64, h = 112, frame = 8 } = DOOR,
  glass = "#ffbd57",
  open = false,
) {
  const x = cx - w / 2,
    y = b - h,
    k = w / 64,
    gl = DOOR_GLASS,
    kn = DOOR_KNOB;
  let s = R(x - frame, y - frame, w + 2 * frame, h + frame, "#d98a4a", ln(2.6));
  if (open)
    return (
      s +
      R(x, y, w, h, glass, ln(2)) +
      R(x - frame - 4, b - 6, w + 2 * frame + 8, 6, "#6e3a1a", ln(1.6))
    );
  const gx = x + gl.x * k,
    gy = y + gl.y,
    gw = gl.w * k,
    gh = gl.h;
  s +=
    R(x, y, w, h, "#8a4520", ln(2)) +
    R(gx, gy, gw, gh, glass, ln(1.6)) +
    F`<path d="M${gx + gw / 2} ${gy}V${gy + gh}M${gx} ${gy + gh / 2}H${gx + gw}" stroke="#8a4a1f" stroke-width="4"/><circle cx="${x + kn.x * k}" cy="${y + kn.y}" r="${kn.r}" fill="#e8b84a" ${ln(1.4)}/>`;
  return s + R(x - frame - 4, b - 6, w + 2 * frame + 8, 6, "#6e3a1a", ln(1.6));
}
/* the door shut in its frame (seen from inside: night: the dark grass outside in its window). Box (w + 2·frame + 8) ×
   (h + frame); foot: y = box height. open: the frame round an open doorway instead (the lit room, or the night) */
export function cabinDoor({ night = false, open = false, door = DOOR } = {}) {
  const id = uid(),
    W = door.w + 2 * door.frame + 8,
    H = door.h + door.frame;
  const defs = night
    ? NIGHT_GLASS(id)
    : `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${open ? '<stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#c8662a"/>' : '<stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="#ffbd57"/><stop offset="1" stop-color="#f08a32"/>'}</linearGradient>`;
  return wrap(
    W,
    H,
    doorBody(W / 2, H, door, `url(#${id})`, open),
    "hg-door",
    defs,
  );
}
/* a window with the lights off inside, from outside: the night sky in it */
const DARK_GLASS = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a5c"/><stop offset=".6" stop-color="#1b2540"/><stop offset="1" stop-color="#141b30"/></linearGradient>`;
const NIGHT_GLASS = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173528"/><stop offset="1" stop-color="#24503d"/></linearGradient>`;
/* a door's face, w × h: a frame, four sunk panels, a brass knob (knob: 'l' | 'r', the side away from the hinge). Foot: y = h. */
export function doorFace({ w = 150, h = 150, knob = "r" } = {}) {
  const pw = (w - 30) / 2,
    ph = (h - 34) / 2,
    kx = knob === "l" ? 12 : w - 12;
  let p = "";
  for (const [x, y] of [
    [10, 10],
    [20 + pw, 10],
    [10, 24 + ph],
    [20 + pw, 24 + ph],
  ])
    p +=
      R(x, y, pw, ph, "#9a5526", `rx="3" ${ln(1.6)}`) +
      R(x + 3, y + 3, pw - 6, 4, "#c98a52", 'opacity=".6"');
  return wrap(
    w,
    h,
    R(0, 0, w, h, "#b06a35", `rx="3" ${ln(2.4)}`) +
      p +
      F`<circle cx="${kx}" cy="${h * 0.55}" r="4.5" fill="#e8b84a" ${ln(1.4)}/>`,
    "hg-door",
  );
}
/* a door swung open toward the viewer by ang degrees (from shut): its face turned, hinge on the left. Box
   len·cos(ang) × (h + len·sin(ang)); the hinge's foot at (0, h), the open edge's at (w, box height). */
export function doorAjar({ len = 150, h = 150, ang = 60, night = false } = {}) {
  const r = (ang * Math.PI) / 180,
    cx = len * Math.cos(r),
    sy = len * Math.sin(r),
    q = (u, v) => `${n1(u * cx)} ${n1(v * h + u * sy)}`;
  const id = uid(),
    gl = DOOR_GLASS,
    kn = DOOR_KNOB,
    u0 = gl.x / 64,
    u1 = (gl.x + gl.w) / 64,
    v0 = gl.y / 112,
    v1 = (gl.y + gl.h) / 112,
    um = (u0 + u1) / 2,
    vm = (v0 + v1) / 2;
  const defs = night ? NIGHT_GLASS(id) : glassDef(id);
  return wrap(
    cx,
    h + sy,
    F`<path d="M${q(0, 0)}L${q(1, 0)}L${q(1, 1)}L${q(0, 1)}Z" fill="#8a4520" ${ln(2)}/><path d="M${q(u0, v0)}L${q(u1, v0)}L${q(u1, v1)}L${q(u0, v1)}Z" fill="url(#${id})" ${ln(1.6)}/>` +
      F`<path d="M${q(um, v0)}L${q(um, v1)}M${q(u0, vm)}L${q(u1, vm)}" stroke="#8a4a1f" stroke-width="4"/><ellipse cx="${n1((kn.x / 64) * cx)}" cy="${n1((kn.y / 112) * h + (kn.x / 64) * sy)}" rx="${n1(Math.max(1.6, kn.r * Math.cos(r)))}" ry="${kn.r}" fill="#e8b84a" ${ln(1.4)}/>`,
    "hg-door",
    defs,
  );
}
/* an open doorway seen from outside: the warm room behind it. Box w × h. */
export function doorway({ w = 64, h = 112 } = {}) {
  const id = uid();
  return wrap(
    w,
    h,
    R(0, 0, w, h, `url(#${id})`, ln(2)),
    "hg-doorway",
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#c8662a"/></linearGradient>`,
  );
}
/* the fireplace, against the north wall: a stone chimney breast with a warm, flickering fire and a mantel (with a little
   rubber duck on it); a raised stone hearth in front. w × (72 + wallH). back: the breast, foot y = 30 + wallH (its
   face); front: the hearth, foot y = h. */
export function fireplace({ w = 280, h, wallH = 170 } = {}) {
  const id = uid(),
    d = 72;
  h = h || d + wallH;
  const F0 = 30 + wallH - (d + wallH - h); // the breast's face on the floor
  const top = F0 - wallH,
    ox = w / 2,
    ow = w * 0.25,
    ob = F0 - 12,
    ot = F0 - 105;
  let b =
    stones(0, top + 30, w, wallH, 21, 24) +
    R(0, top + 30, w, wallH, "none", ln(3)) +
    stones(0, top, w, 30, 22, 15) +
    R(0, top, w, 30, "none", ln(2.6)) +
    R(0, top, w, 30, "#fff", 'opacity=".08"');
  /* the firebox: an arch, sooty inside, bricks glowing, logs and the fire */
  const arch = F`M${ox - ow} ${ob}V${ot + ow * 0.55}Q${ox - ow} ${ot} ${ox} ${ot}Q${ox + ow} ${ot} ${ox + ow} ${ot + ow * 0.55}V${ob}Z`;
  b +=
    F`<path d="${arch}" fill="#1a1110" stroke="#4a4d56" stroke-width="12"/><path d="${arch}" fill="url(#${id}f)" class="hg-f"/><path d="${arch}" fill="none" ${ln(2.6)}/>` +
    F`<path d="M${ox - ow * 0.7} ${ob - 6}L${ox + ow * 0.6} ${ob - 14}M${ox - ow * 0.6} ${ob - 14}L${ox + ow * 0.7} ${ob - 6}" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M${ox - ow * 0.7} ${ob - 6}L${ox + ow * 0.6} ${ob - 14}M${ox - ow * 0.6} ${ob - 14}L${ox + ow * 0.7} ${ob - 6}" stroke="#6b3f22" stroke-width="9" stroke-linecap="round"/>` +
    F`<g class="hg-f">${fire(ox, ob - 10, 0.85)}<ellipse cx="${ox}" cy="${ob - 4}" rx="${ow * 0.8}" ry="6" fill="#ff7a1f" opacity=".8"/></g>`;
  /* the mantel and what sits on it */
  const my = F0 - 134;
  b +=
    R(-10, my - 14, w + 20, 14, "#c47a3e", ln(2.4)) +
    R(-10, my, w + 20, 14, "#9a5526", ln(2.4)) +
    F`<rect x="22" y="${my - 40}" width="9" height="26" fill="#f4ecd8" ${ln(1.6)}/><path d="M26.5 ${my - 52}q-5 7 0 11q5 -4 0 -11Z" fill="#ffc23f" stroke="#c46a12" stroke-width="1" class="hg-c"/><circle cx="26.5" cy="${my - 46}" r="12" fill="url(#${id}c)" class="hg-flicker hg-c"/>` +
    F`<rect x="${w - 31}" y="${my - 34}" width="9" height="20" fill="#f4ecd8" ${ln(1.6)}/><path d="M${w - 26.5} ${my - 46}q-5 7 0 11q5 -4 0 -11Z" fill="#ffc23f" stroke="#c46a12" stroke-width="1" class="hg-c"/><circle cx="${w - 26.5}" cy="${my - 40}" r="12" fill="url(#${id}c)" class="hg-flicker hg-c" style="animation-delay:-1.7s"/>` +
    F`<g transform="translate(${w * 0.62} ${my - 14})"><path d="M-12 0C-14 -6 -12 -11 -8 -12C-8 -18 -2 -21 2 -18C6 -16 6 -11 4 -9C10 -10 13 -6 12 0Z" fill="#ffd23f" ${ln(1.6)}/><path d="M5 -16l5 1.5l-5 1.5Z" fill="#ff9a1f"/><circle cx="2.5" cy="-16" r="1.2" fill="${O}"/></g>`;
  b += F`<ellipse cx="${ox}" cy="${ot + 40}" rx="${w * 0.7}" ry="${wallH * 0.5}" fill="url(#${id}g)" class="hg-flicker hg-f"/>`;
  const hy = F0 - 12;
  const f =
    stones(-6, hy, w + 12, d - 30, 23, 21) +
    R(-6, hy, w + 12, d - 30, "none", ln(2.6)) +
    R(-6, hy, w + 12, d - 30, "#ff9a3a", 'opacity=".12" class="hg-f"') +
    R(-6, hy + d - 30, w + 12, 12, "#4f525b", ln(2.4));
  const defs =
    F`<radialGradient id="${id}f" cx=".5" cy=".85" r=".7"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".9"/><stop offset=".5" stop-color="#b8441a" stop-opacity=".5"/><stop offset="1" stop-color="#1a1110" stop-opacity="0"/></radialGradient>` +
    glowDef(id + "c", "#ffb347", 0.55) +
    glowDef(id + "g", "#ff9a3a", 0.3);
  return pair(w, h, [b, defs], [f], F0, h);
}
