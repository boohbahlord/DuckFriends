/* ---------- Downpour's things: the drawings (Dead Ducks Arcade's second map, stationmap.js) ----------
   The owner's swamp at night in the rain: the gas station, the cars stopped on the road, the chapel, the trees.
   Drawn as Duck Cabin's props are (art.js): ink outlines, lighter tops, darker fronts, seen from above and in front.
   A box-like thing w wide, d deep and h tall is drawn into w × (d + h): its top in the first d, its south face under it.
   Inside one, a point (x, y) of its floor plan at height z is at (x, y − z + h) (`at` below). Preview:
   tools/downpour-art.html. */

const O = "#1c1c28"; // the ducks' ink
const n1 = (v) => Math.round(v * 10) / 10;
const F = (s, ...v) =>
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
const ln = (w = 2.4, c = O) =>
  `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
let N = 0;
const uid = () => "dp" + (++N).toString(36);
const rnd = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; // (the same "random" every time)
const wrap = (w, h, body, defs = "", cls = "") =>
  F`<svg class="hg${cls ? " " + cls : ""}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${defs ? "<defs>" + defs + "</defs>" : ""}${body}</svg>`;
const R = (x, y, w, h, fill, more = "") =>
  F`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
/* a box inside a thing H tall: floor plan x … x + w, y … y + d, from height z0 up to z1; its top and its south face */
const box3 = (H, x, y, w, d, z0, z1, top, front, lw = 2.4) =>
  R(x, y - z1 + H, w, d, top, ln(lw)) +
  R(x, y + d - z1 + H, w, z1 - z0, front, ln(lw));
/* a shine along a top's front edge, the way the cabin's props catch the light */
const shine = (x, y, w, c = "#fff", o = 0.22) =>
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
const dirt = (x, foot, w, wallH) =>
  R(x, foot - wallH * 0.14, w, wallH * 0.14, "#788b59") +
  R(x, foot - wallH * 0.07, w, wallH * 0.07, "#4d7e59");
/* the big shop windows in a face from a to b (x), y … y + h: dark glass in aluminium frames, a mullion every 120 or so,
   a kick panel under them; a light from the room shows faintly through */
function shopGlass(id, a, b, y, h) {
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
const glassGrad = (id) =>
  F`<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2757"/><stop offset=".55" stop-color="#171d3a"/><stop offset="1" stop-color="#162c1f"/></linearGradient>`;
/* an east-west wall: its cut top (t deep) and its face (wallH tall), w long; glass: [a, b] spans of shop windows (x
   from its west end). seamless: laid over the ends of the pieces either side (a hole's piece) */
export function gsWallX({
  w,
  wallH,
  t = 24,
  skin = "gs",
  glass = [],
  seamless = false,
}) {
  const S = SKINS[skin],
    id = uid(),
    h = t + wallH;
  let defs = S.face(id, wallH),
    s = "";
  const edge = seamless ? "" : ln(2.6);
  s +=
    R(0, t, w, wallH, `url(#${id})`, edge) +
    S.band(0, t, w, wallH) +
    dirt(0, t + wallH, w, wallH);
  if (glass.length) {
    defs += glassGrad(id);
    for (const [a, b] of glass) s += shopGlass(id, a, b, t, wallH);
  }
  s +=
    R(0, 0, w, t, S.top, edge) +
    F`<path d="M${seamless ? 0 : 3} ${t * 0.35}H${seamless ? w : w - 3}" stroke="${S.topHi}" stroke-width="3" opacity=".7"/><path d="M${seamless ? 0 : 3} ${t - 4}H${seamless ? w : w - 3}" stroke="${S.topLo}" stroke-width="2"/>`;
  if (seamless)
    s += F`<path d="M0 0H${w}M0 ${t}H${w}" fill="none" ${ln(2.6)}/>`;
  return wrap(w, h, s, defs, "hg-wall");
}
/* a north-south wall's piece, w across, h tall on the screen: its cut top, and (unless plain) its south end's face
   wallH tall. plain: its own top colour runs on down to the floor; open: it carries on from the piece north of it */
export function gsWallY({
  w,
  h,
  wallH,
  skin = "gs",
  plain = false,
  open = false,
}) {
  const S = SKINS[skin],
    len = h - wallH,
    e = plain ? h : len;
  let s = open
    ? R(0, 0, w, e, S.top) +
      F`<path d="M0 0V${e}H${w}V0" fill="none" ${ln(2.6)}/>`
    : R(0, 0, w, e, S.top, ln(2.6));
  s += F`<path d="M${w * 0.4} ${open ? 0 : 3}V${e - 3}" stroke="${S.topHi}" stroke-width="3" opacity=".7"/>`;
  if (!plain)
    s +=
      R(0, len, w, wallH, S.end, ln(2.6)) +
      F`<path d="M${w / 2} ${len + 3}V${h - 3}" stroke="${S.topLo}" stroke-width="2" opacity=".6"/>` +
      dirt(0, h, w, wallH);
  return wrap(w, h, s, "", "hg-wall");
}
/* a north-south wall's top alone (the run's pieces that don't end it): d tall, o: how far up past its own top it starts
   (the piece north of it), cut: an opening's edge along its top */
export const gsWallTop = (w, d, o, cut, skin = "gs") => {
  const S = SKINS[skin];
  return `<svg class="hg hg-wall" viewBox="0 0 ${w} ${d}" width="${w}" height="${d}" overflow="visible" aria-hidden="true"><rect x="0" y="${o}" width="${w}" height="${d - o}" fill="${S.top}"/><path d="M${w * 0.4} ${o < 0 ? o : 3}V${d}" stroke="${S.topHi}" stroke-width="3" opacity=".7"/><path d="M0 ${o}V${d}M${w} ${o}V${d}${cut ? `M0 0H${w}` : ""}" stroke="${O}" stroke-width="2.6"/></svg>`;
};
/* the colours of a wall's broken edge (a north-south wall's splinters at a hole) */
export const SPLINTER = {
  gs: ["#c9c3b2", "#b2ab98", "#7d796e"],
  ch: ["#d9d4c6", "#c2bcad", "#8a8476"],
};

/* ---------- the gas station's insides ---------- */
/* a store shelf (a gondola) w long, d deep, h tall: three shelves of cans, boxes and bottles, picked over; empty: nothing
   left on it at all */
export function shelfSVG({
  w = 1000,
  d = 60,
  h = 150,
  empty = false,
  seed = 3,
} = {}) {
  const H = h,
    r = rnd(seed + Math.round(w)),
    goods = [
      "#c7282a",
      "#fba229",
      "#1685dc",
      "#42bd28",
      "#fe8508",
      "#8448cc",
      "#f7f8f3",
      "#805031",
    ];
  let s = R(2, d + h - 10, w - 4, 10, "#353636", ln(2)); // (the kick plate)
  s += box3(H, 0, 0, w, d, 0, h, "#849097", "#565d77");
  s += shine(0, 0 - h + H + 2, w);
  /* the uprights and the shelves on its face */
  const fy = d; // (the face starts here)
  for (let x = 0; x <= w; x += 125)
    s += R(Math.min(x, w - 6), fy, 6, h - 10, "#414d59");
  const lv = [0.18, 0.48, 0.78].map((k) => fy + h * k);
  for (const y of lv) {
    s += R(2, y + 22, w - 4, 5, "#d6ccd8", ln(1.4));
    if (empty) continue;
    for (let x = 10; x < w - 14; ) {
      const iw = 12 + r() * 16,
        ih = 10 + r() * 12,
        gone = r() < 0.32;
      if (!gone) {
        const c = goods[Math.floor(r() * goods.length)];
        s += R(x, y + 22 - ih, iw, ih, c, ln(1.2));
      }
      x += iw + 2 + (gone ? r() * 20 : 0);
    }
  }
  /* price tags along the shelves' edges */
  for (const y of lv)
    for (let x = 30; x < w - 20; x += 90 + ((x * 7) % 40))
      s += R(x, y + 23, 10, 3, "#fcdb4e");
  return wrap(w, d + h, s);
}
/* the shop counter: laminate top, a wood front with a stripe; long (w > d): the till and a rack of sweets on it */
export function counterSVG({ w = 400, d = 110, h = 75 } = {}) {
  const H = h;
  let s = box3(H, 0, 0, w, d, 0, h, "#d0cfa2", "#805031");
  s += R(0, d + h * 0.35, w, 6, "#c7282a"); // (the stripe)
  s += R(0, d + h - 10, w, 10, "#381e10", ln(2));
  for (let x = 30; x < w - 20; x += 60)
    s += F`<path d="M${x} ${d + h * 0.45}V${d + h - 14}" stroke="#5e3215" stroke-width="3"/>`;
  if (w > d) {
    // the till: a grey box with its screen turned toward the shop, the drawer under it
    s +=
      R(w - 120, 18, 70, 46, "#353636", ln(2.2)) +
      R(w - 112, 22, 54, 20, "#14bd84", ln(1.4)) +
      R(w - 112, 46, 54, 12, "#111417", ln(1.2));
    // a rack of sweets
    const c = ["#fe8508", "#1685dc", "#c7282a", "#fcdb4e", "#42bd28"];
    s += R(40, 22, 120, 54, "#565d77", ln(2));
    for (let i = 0; i < 10; i++)
      s += R(
        46 + (i % 5) * 22,
        28 + Math.floor(i / 5) * 24,
        18,
        18,
        c[i % 5],
        ln(1),
      );
  }
  return wrap(w, d + h, s);
}

/* ---------- outside: the pumps, the canopy, the generator, the fence ---------- */
/* a pump island w × d, h tall: a concrete curb and two pumps on it, each with its display, its hose and its nozzle */
export function pumpSVG({ w = 300, d = 80, h = 140 } = {}) {
  const H = h,
    cz = 14;
  let s = box3(H, 0, 0, w, d, 0, cz, "#849097", "#565d77");
  s += F`<path d="M0 ${d - cz + H}H${w}" stroke="#fcdb4e" stroke-width="4" stroke-dasharray="18 14"/>`;
  for (const x0 of [w * 0.14, w * 0.58]) {
    const pw = w * 0.28,
      y0 = 18,
      pd = d - 36;
    s += box3(H, x0, y0, pw, pd, cz, h, "#ba4e44", "#c7282a");
    const fy = y0 + pd - h + H; // (the pump's face's top)
    s +=
      R(x0 + 8, fy + 10, pw - 16, 30, "#1d1e29", ln(1.6)) +
      R(x0 + 12, fy + 14, pw * 0.5, 9, "#95ec82") +
      R(x0 + 12, fy + 26, pw * 0.36, 9, "#1faa10") +
      R(x0 + 8, fy + 48, pw - 16, 26, "#f7f8f3", ln(1.4)) +
      F`<path d="M${x0 + 14} ${fy + 56}H${x0 + pw - 14}M${x0 + 14} ${fy + 64}H${x0 + pw * 0.6}" stroke="#c7282a" stroke-width="3"/>` +
      R(x0 + 8, fy + 82, pw - 16, h - cz - 92, "#89132c", ln(1.4));
    // the hose, hanging in a loop to the nozzle in its holster on the side
    const hx = x0 + pw;
    s += F`<path d="M${hx - 2} ${fy + 40}C${hx + 22} ${fy + 70} ${hx + 18} ${fy + 120} ${hx + 6} ${fy + 96}" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${hx - 2} ${fy + 40}C${hx + 22} ${fy + 70} ${hx + 18} ${fy + 120} ${hx + 6} ${fy + 96}" fill="none" stroke="#353636" stroke-width="4" stroke-linecap="round"/>`;
    s += R(hx - 4, fy + 22, 12, 22, "#353636", ln(1.6));
    s += shine(x0, y0 - h + H, pw, "#fff", 0.3);
  }
  return wrap(w, d + h, s);
}
/* the canopy over the pumps, seen from above: its roof (w × d) and its front edge (the fascia, `edge` tall), a red band
   with a white stripe along it */
export function canopySVG({ w = 1800, d = 550, edge = 40 } = {}) {
  const id = uid();
  const defs = F`<pattern id="${id}" width="120" height="${d}" patternUnits="userSpaceOnUse"><rect width="120" height="${d}" fill="#d6ccd8"/><path d="M1.5 0V${d}" stroke="#849097" stroke-width="3"/></pattern>`;
  let s = R(2, 2, w - 4, d - 4, `url(#${id})`, ln(4));
  s += R(2, 2, w - 4, 26, "#849097"); // (its back edge, a little lower)
  s += R(2, d - 2, w - 4, edge, "#c7282a", ln(3));
  s += R(2, d + edge * 0.42, w - 4, edge * 0.16, "#f7f8f3");
  s += R(2, d + edge - 6, w - 4, 6, "#820a17");
  // the sign on its front: a white panel, no words (a pump's drop of fuel)
  const cx = w / 2;
  s +=
    R(cx - 70, d - 2 - 4, 140, edge + 8, "#f7f8f3", ln(2.6)) +
    F`<path d="M${cx} ${d + 4}C${cx - 12} ${d + 18} ${cx - 10} ${d + edge - 4} ${cx} ${d + edge - 4}C${cx + 10} ${d + edge - 4} ${cx + 12} ${d + 18} ${cx} ${d + 4}Z" fill="#c7282a" ${ln(1.6)}/>`;
  return wrap(w, d + edge, s, defs);
}
/* the generator on its skid: an olive box with louvres, a control panel, the exhaust, and its cable running east to the
   power box (cable: how far, in px past its east side) */
export function generatorSVG({ w = 140, d = 120, h = 100, cable = 44 } = {}) {
  const H = h,
    W = w + cable;
  let s = box3(H, 0, 4, w, d - 8, 0, 12, "#414d59", "#353636"); // (the skid)
  s += box3(H, 6, 12, w - 12, d - 24, 12, h, "#899317", "#7c7b03");
  const ty = 12 - h + H,
    fy = d - 12 - h + H;
  s += shine(6, ty, w - 12, "#fff", 0.25);
  // the exhaust and the fuel cap on top
  s +=
    F`<ellipse cx="${w - 34}" cy="${ty + 30}" rx="10" ry="8" fill="#353636" ${ln(2)}/><ellipse cx="${w - 34}" cy="${ty + 29}" rx="5" ry="4" fill="#111417"/>` +
    F`<circle cx="30" cy="${ty + 28}" r="8" fill="#c7282a" ${ln(2)}/>`;
  // the louvres and the control panel on its face
  for (let y = fy + 14; y < fy + h - 30; y += 9)
    s += F`<path d="M16 ${y}H${w * 0.5}" stroke="#534f1a" stroke-width="4"/>`;
  s +=
    R(w * 0.58, fy + 12, w * 0.32, h * 0.5, "#353636", ln(1.6)) +
    F`<circle cx="${w * 0.66}" cy="${fy + 26}" r="5" fill="#f7f8f3" ${ln(1)}/><circle cx="${w * 0.82}" cy="${fy + 26}" r="5" fill="#f7f8f3" ${ln(1)}/><rect x="${w * 0.64}" y="${fy + 40}" width="8" height="10" fill="#c7282a"/><rect x="${w * 0.78}" y="${fy + 40}" width="8" height="10" fill="#42bd28"/>`;
  s += R(6, fy + h - 26, w - 12, 6, "#fcdb4e"); // (a warning stripe)
  // the cable, out of its east side and along the ground
  s += F`<path d="M${w - 6} ${fy + h * 0.55}C${w + cable * 0.3} ${fy + h * 0.6} ${w + cable * 0.4} ${d + h - 6} ${W} ${d + h - 10}" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${w - 6} ${fy + h * 0.55}C${w + cable * 0.3} ${fy + h * 0.6} ${w + cable * 0.4} ${d + h - 6} ${W} ${d + h - 10}" fill="none" stroke="#353636" stroke-width="4" stroke-linecap="round"/>`;
  return wrap(W, d + h, s);
}
/* a piece of the tall fence across the road, running north-south: seen edge-on it's a band (w wide, the fence's
   thickness drawn wider so it reads) of chain link, its posts and its rail, the barbed wire curled along its top */
export function fenceSVG({ w = 30, d = 200, h = 200, seed = 1 } = {}) {
  const id = uid(),
    H = d + h,
    r = rnd(seed);
  const defs = F`<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#353636"/><path d="M0 0L14 14M14 0L0 14" stroke="#849097" stroke-width="2.4"/></pattern>`;
  let s = R(3, 0, w - 6, H, `url(#${id})`, ln(2.4));
  // its posts, every 100 or so: the posts' grey run the band's length where they stand
  for (let y = 20 + r() * 20; y < H - 30; y += 100)
    s += R(w / 2 - 6, y, 12, 34, "#849097", ln(2));
  // the top rail, and the barbed wire zigzagging along it
  s += R(w / 2 - 3, 0, 6, H, "#d6ccd8", ln(1.4));
  let z = `M${w / 2} 0`;
  for (let y = 8, k = 1; y < H; y += 9, k = -k)
    z += `L${n1(w / 2 + k * (w / 2 - 3))} ${y}`;
  s += `<path d="${z}" fill="none" stroke="#d6ccd8" stroke-width="2"/>`;
  return wrap(w, H, s, defs);
}

/* ---------- the cars ---------- */
const CAR_COLORS = [
  ["#a24337", "#89132c"],
  ["#28638f", "#143b64"],
  ["#d6ccd8", "#849097"],
  ["#3d813f", "#1f6d20"],
  ["#ae7838", "#805031"],
  ["#565d77", "#353636"],
];
/* a car stopped on the road, w × d (east-west), h tall: from above its hood, windshield, roof, rear window and trunk;
   its south side with the doors, the windows and the wheels. east: which way it faces. seed: its colour, a broken
   window. hood: its hood up, the engine showing (it stands taller than its box: up px over it) */
export function carSVG({
  w = 420,
  d = 200,
  h = 110,
  seed = 1,
  east = true,
  hood = false,
  up = 0,
} = {}) {
  const r = rnd(seed * 97 + 11),
    [c, cd] = hood
      ? ["#a24337", "#89132c"]
      : CAR_COLORS[seed % CAR_COLORS.length],
    H = h + up,
    y0 = 16, // (its sides, north and south)
    y1 = d - 16,
    zb = 22, // (the body's foot over the road)
    zt = 62, // (its waist: the hood and the trunk)
    zr = h - 2, // (its roof)
    c0 = 130, // (the roof, back to front)
    c1 = 285,
    g0 = 80, // (the glass reaches down to the waist here, back and front)
    g1 = 345,
    inset = 14; // (the roof is narrower than the body)
  const X = (x) => n1(east ? x : w - x); // (drawn facing east, mirrored)
  const P = (x, y, z) => `${X(x)} ${n1(y - z + H)}`;
  const poly = (pts, fill, more = ln(2.4)) =>
    `<path d="M${pts.map(([x, y, z]) => P(x, y, z)).join("L")}Z" fill="${fill}" ${more}/>`;
  let s = F`<ellipse cx="${w / 2}" cy="${d + H - 8}" rx="${w * 0.52}" ry="16" fill="#000" opacity=".35"/>`;
  // the wheels: the far side's under the body, the near side's in front of it
  for (const x of [w * 0.2, w * 0.79]) {
    s += F`<ellipse cx="${X(x)}" cy="${y0 - 20 + H}" rx="30" ry="18" fill="#111417"/>`;
  }
  // the body: its top (hood, the roof's footing, trunk), rounded at the ends, and its south side
  s += poly(
    [
      [10, y0 + 18, zt],
      [26, y0, zt],
      [w - 30, y0, zt],
      [w - 8, y0 + 20, zt],
      [w - 8, y1 - 20, zt],
      [w - 30, y1, zt],
      [26, y1, zt],
      [10, y1 - 18, zt],
    ],
    c,
  );
  s += poly(
    [
      [26, y1, zt],
      [w - 30, y1, zt],
      [w - 8, y1 - 20, zt],
      [w - 8, y1 - 20, zb + 6],
      [w - 30, y1, zb],
      [26, y1, zb],
      [10, y1 - 18, zb + 6],
      [10, y1 - 18, zt],
    ],
    cd,
  );
  s += `<path d="M${P(30, y0 + 6, zt)}L${P(w - 34, y0 + 6, zt)}" stroke="#f7f8f3" stroke-width="3" opacity=".35"/>`;
  // the greenhouse: the glass round it, the roof on top
  s += poly(
    [
      [g0, y1 - 2, zt],
      [c0, y1 - inset, zr],
      [c1, y1 - inset, zr],
      [g1, y1 - 2, zt],
    ],
    "#171d3a",
  ); // (its south windows)
  s += poly(
    [
      [c1, y0 + inset, zr],
      [g1, y0 + 2, zt],
      [g1, y1 - 2, zt],
      [c1, y1 - inset, zr],
    ],
    "#1f2757",
  ); // (the windshield)
  s += poly(
    [
      [c0, y0 + inset, zr],
      [g0, y0 + 2, zt],
      [g0, y1 - 2, zt],
      [c0, y1 - inset, zr],
    ],
    "#1f2757",
  ); // (the rear window)
  s += poly(
    [
      [c0, y0 + inset, zr],
      [c1, y0 + inset, zr],
      [c1, y1 - inset, zr],
      [c0, y1 - inset, zr],
    ],
    c,
  ); // (the roof)
  s += `<path d="M${P(c0 + 6, y0 + inset + 6, zr)}L${P(c1 - 6, y0 + inset + 6, zr)}" stroke="#f7f8f3" stroke-width="3" opacity=".35"/>`;
  // the pillar between the south windows, a broken window maybe, a shine on the glass
  const mid = (c0 + c1) / 2 + 10,
    brk = r() < 0.4;
  s += poly(
    [
      [mid - 6, y1 - inset, zr],
      [mid + 6, y1 - inset, zr],
      [mid + 8, y1 - 2, zt],
      [mid - 8, y1 - 2, zt],
    ],
    cd,
    ln(1.6),
  );
  if (brk)
    s += `<path d="M${P(mid + 30, y1 - 8, zt + 30)}l14 -8l-4 10l12 2M${P(mid + 60, y1 - 6, zt + 16)}l8 -14" stroke="#7dd4f7" stroke-width="2" fill="none"/>`;
  s += `<path d="M${P(g0 + 20, y1 - 3, zt + 4)}L${P(c0 + 20, y1 - inset, zr - 6)}" stroke="#565d77" stroke-width="5"/>`;
  // the door lines and handles, the lights on its corners, the bumpers
  for (const x of [mid - 70, mid + 70])
    s += `<path d="M${P(x, y1, zt - 4)}L${P(x, y1, zb + 6)}" stroke="${O}" stroke-width="1.8"/>`;
  for (const x of [mid - 40, mid + 98])
    s += `<path d="M${P(x - 8, y1, zt - 12)}h16" stroke="#d6ccd8" stroke-width="4"/>`;
  s += poly(
    [
      [w - 8, y1 - 22, zt - 8],
      [w - 22, y1 - 2, zt - 8],
      [w - 22, y1 - 2, zt - 20],
      [w - 8, y1 - 22, zt - 20],
    ],
    "#fcf289",
    ln(1.4),
  ); // (a headlight)
  s += poly(
    [
      [10, y1 - 20, zt - 8],
      [22, y1 - 2, zt - 8],
      [22, y1 - 2, zt - 18],
      [10, y1 - 20, zt - 18],
    ],
    "#c7282a",
    ln(1.4),
  ); // (a tail light)
  s += `<path d="M${P(26, y1, zb + 4)}L${P(w - 30, y1, zb + 4)}" stroke="#353636" stroke-width="5"/>`;
  // the near wheels, in front of the body
  for (const x of [w * 0.2, w * 0.79])
    s += F`<ellipse cx="${X(x)}" cy="${y1 - 14 + H}" rx="30" ry="24" fill="#111417" ${ln(2.4)}/><ellipse cx="${X(x)}" cy="${y1 - 14 + H}" rx="13" ry="11" fill="#849097" ${ln(1.6)}/>`;
  if (hood) {
    // the hood up: hinged at the windshield's foot, swung up 60° over the engine
    const hx = g1 + 4,
      L = w - 14 - hx;
    s += poly(
      [
        [hx, y0 + 4, zt],
        [w - 12, y0 + 18, zt],
        [w - 12, y1 - 18, zt],
        [hx, y1 - 4, zt],
      ],
      "#1d1e29",
    ); // (the engine bay)
    s +=
      poly(
        [
          [hx + 10, y0 + 30, zt + 10],
          [hx + 44, y0 + 30, zt + 10],
          [hx + 44, y1 - 40, zt + 10],
          [hx + 10, y1 - 40, zt + 10],
        ],
        "#849097",
        ln(1.8),
      ) +
      `<circle cx="${X(w - 30)}" cy="${n1(y0 + 40 - zt + H)}" r="9" fill="#fcdb4e" ${ln(1.6)}/>` +
      poly(
        [
          [w - 40, y1 - 50, zt + 6],
          [w - 22, y1 - 50, zt + 6],
          [w - 22, y1 - 28, zt + 6],
          [w - 40, y1 - 28, zt + 6],
        ],
        "#353636",
        ln(1.4),
      ) +
      `<path d="M${P(hx + 30, y0 + 30, zt + 12)}C${P(hx + 40, y0 + 10, zt + 14)} ${P(w - 40, y0 + 20, zt + 12)} ${P(w - 30, y0 + 40, zt + 8)}" fill="none" stroke="#c7282a" stroke-width="3"/>`;
    const tip = hx + L * 0.85,
      lift = zt + L * 1.4;
    s += poly(
      [
        [hx, y0 + 4, zt],
        [tip, y0 + 10, lift],
        [tip, y1 - 10, lift],
        [hx, y1 - 4, zt],
      ],
      "#849097",
    ); // (the hood's underside, toward us)
    s += poly(
      [
        [hx + 6, y0 + 22, zt + 10],
        [tip - 6, y0 + 26, lift - 10],
        [tip - 6, y1 - 26, lift - 10],
        [hx + 6, y1 - 22, zt + 10],
      ],
      "#565d77",
      ln(1.4),
    ); // (its pad)
    s += `<path d="M${P(w - 30, y1 - 24, zt)}L${P(hx + L * 0.4, y1 - 14, zt + L * 0.7)}" stroke="#d6ccd8" stroke-width="2.4"/>`; // (the prop rod)
  }
  return wrap(w, d + H, s);
}

/* ---------- the chapel ---------- */
/* a pew, w × d, h tall: the seat, the backrest along its north side, the ends; broken "e" or "w": that end snapped off,
   splintered */
export function pewSVG({ w = 500, d = 80, h = 45, broken = "" } = {}) {
  const H = h,
    wood = "#805031",
    top = "#ae7838",
    dark = "#5e3215";
  let s = F`<ellipse cx="${w / 2}" cy="${d + h - 4}" rx="${w / 2}" ry="8" fill="#000" opacity=".3"/>`;
  // the backrest (north), then the seat in front of it
  s += box3(H, 0, 6, w, 12, 0, h, top, wood);
  s += F`<path d="M4 ${6 - h + H + 6}H${w - 4}" stroke="#d07528" stroke-width="2"/>`;
  s += box3(H, 0, 22, w, d - 26, 18, 26, top, wood);
  s += shine(0, 22 - 26 + H, w, "#fff", 0.2);
  // its ends (whole ends only)
  for (const [x, side] of [
    [0, "w"],
    [w - 10, "e"],
  ])
    if (broken !== side)
      s += box3(H, x, 4, 10, d - 6, 0, h, "#ac7561", dark, 2);
  // the broken end: splinters and a dark break
  if (broken) {
    const x = broken === "e" ? w : 0,
      k = broken === "e" ? -1 : 1;
    s += F`<path d="M${x} ${6 - h + H}l${k * 10} 8l${-k * 6} 6l${k * 12} 8l${-k * 8} 10l${k * 6} 12L${x} ${d + h - 6}" fill="${dark}" ${ln(2)}/><path d="M${x + k * 2} ${22 - 26 + H + 4}l${k * 18} 6l${-k * 10} 4l${k * 14} 8" fill="none" stroke="#d07528" stroke-width="2.4"/>`;
  }
  return wrap(w, d + h, s);
}
/* the altar, w × d, h tall: a stone table under a white cloth with a gold edge and a cross, two candles on it */
export function altarSVG({ w = 900, d = 220, h = 90 } = {}) {
  const H = h;
  let s = box3(H, 0, 0, w, d, 0, h, "#849097", "#766d7c");
  // the cloth over its top, hanging down its front
  s +=
    R(w * 0.06, 0 - h + H + 8, w * 0.88, d - 14, "#f7f8f3", ln(2)) +
    F`<path d="M${w * 0.18} ${d}H${w * 0.82}V${d + h * 0.72}L${w * 0.75} ${d + h * 0.62}L${w * 0.68} ${d + h * 0.72}L${w * 0.32} ${d + h * 0.72}L${w * 0.25} ${d + h * 0.62}L${w * 0.18} ${d + h * 0.72}Z" fill="#f7f8f3" ${ln(2)}/>` +
    R(w * 0.18, d + 6, w * 0.64, 5, "#c9a11e");
  const cx = w / 2;
  s += F`<path d="M${cx} ${d + 16}V${d + h * 0.58}M${cx - 14} ${d + 28}H${cx + 14}" stroke="#c9a11e" stroke-width="6" stroke-linecap="round"/>`;
  // the candles (the Angel machine stands in the middle: they're at the ends)
  for (const x of [w * 0.16, w * 0.84])
    s +=
      R(x - 7, d * 0.4, 14, 34, "#f7f8f3", ln(1.6)) +
      F`<ellipse cx="${x}" cy="${d * 0.4 - 6}" rx="5" ry="8" fill="#fba229"/><ellipse cx="${x}" cy="${d * 0.4 - 4}" rx="2.4" ry="4" fill="#fcf289"/>` +
      R(x - 12, d * 0.4 + 32, 24, 6, "#c9a11e", ln(1.4));
  return wrap(w, d + h, s);
}
/* the bell tower, w × d, h tall: white clapboard, the belfry's arch with the bell in it near the top, its hip roof seen
   from above */
export function towerSVG({ w = 300, d = 300, h = 520 } = {}) {
  const id = uid(),
    H = h;
  const defs =
    SKINS.ch.face(id, h) +
    F`<radialGradient id="${id}b"><stop offset="0" stop-color="#453219"/><stop offset="1" stop-color="#101016"/></radialGradient>`;
  let s = R(0, d, w, h, `url(#${id})`, ln(2.6)) + dirt(0, d + h, w, h);
  // the roof: four slopes meeting at the middle, dark shingles, a cross on top
  s +=
    R(0, 0, w, d, "#353636", ln(2.6)) +
    F`<path d="M0 0L${w / 2} ${d / 2}L${w} 0M0 ${d}L${w / 2} ${d / 2}L${w} ${d}" stroke="${O}" stroke-width="2.4" fill="none"/><path d="M0 ${d}L${w / 2} ${d / 2}L${w} ${d}Z" fill="#414d59"/><path d="M${w / 2} ${d / 2}L${w} 0V${d}Z" fill="#1d1e29"/>`;
  s += R(0, d - 4, w, 14, "#f7f8f3", ln(2)); // (the eaves)
  s += F`<path d="M${w / 2} ${d / 2 - 46}V${d / 2 + 8}M${w / 2 - 16} ${d / 2 - 28}H${w / 2 + 16}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${w / 2} ${d / 2 - 46}V${d / 2 + 8}M${w / 2 - 16} ${d / 2 - 28}H${w / 2 + 16}" stroke="#c9a11e" stroke-width="5" stroke-linecap="round"/>`;
  // the belfry: an arch, the bell hanging in the dark
  const ax = w / 2,
    ay = d + 40,
    aw = w * 0.5,
    ah = h * 0.3;
  s += F`<path d="M${ax - aw / 2} ${ay + ah}V${ay + aw / 2}A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw / 2} ${ay + aw / 2}V${ay + ah}Z" fill="url(#${id}b)" ${ln(2.6)}/>`;
  s += F`<path d="M${ax - 26} ${ay + ah * 0.78}C${ax - 24} ${ay + ah * 0.42} ${ax - 14} ${ay + ah * 0.32} ${ax} ${ay + ah * 0.32}C${ax + 14} ${ay + ah * 0.32} ${ax + 24} ${ay + ah * 0.42} ${ax + 26} ${ay + ah * 0.78}Z" fill="#c9a11e" ${ln(2)}/><circle cx="${ax}" cy="${ay + ah * 0.84}" r="6" fill="#9d7915" ${ln(1.4)}/><path d="M${ax - 14} ${ay + ah * 0.5}C${ax - 10} ${ay + ah * 0.42} ${ax - 4} ${ay + ah * 0.4} ${ax} ${ay + ah * 0.4}" stroke="#fcdb4e" stroke-width="3" fill="none"/>`;
  s += R(ax - aw / 2 - 10, ay + ah, aw + 20, 10, "#f7f8f3", ln(2)); // (the sill)
  // a narrow window lower down, and the swamp's dirt up its foot
  s += F`<path d="M${ax - 18} ${d + h * 0.72}V${d + h * 0.58}A18 18 0 0 1 ${ax + 18} ${d + h * 0.58}V${d + h * 0.72}Z" fill="#171d3a" ${ln(2)}/>`;
  return wrap(w, d + h, s, defs);
}

/* ---------- the swamp's trees and the fallen tree ---------- */
/* The swamp's trees (the owner's pick, Nov 17: A, B and D, three of each, no drapes): a bald cypress, a live oak and a
   willow, about 3 ducks tall, each with one ink outline round it and three flat bands of leaves, colours from the pixel
   palette. swampTreeSVG(kind, v, seed, flip) gives { svg, w, h, foot }: the tree in w × h, its trunk's foot at
   (w/2, h − foot) */
const TINK = "#0f0f17"; // (the trees' ink: a little darker than the ducks', so they stand out of the dark grass)
const tWrap = (w, h, s, flip) =>
  `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${flip ? `<g transform="translate(${w} 0) scale(-1 1)">${s}</g>` : s}</svg>`;
/* the night swamp's colours */
const TC = {
  shade: "#162c1f", // (a crown's underside)
  leaf: "#1b4c24", // (its body)
  lit: "#1d7d30", // (the clumps the moon hits)
  rim: "#559075", // (wet leaves catching light: a few)
  bark: "#453219",
  barkD: "#381e10",
  barkHi: "#5e3215",
};

/* a rough blob round (cx, cy): n points, each its own distance out, joined by a smooth closed curve */
function tBlob(cx, cy, rx, ry, r, rough = 0.2, n = 18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2,
      k = 1 + (r() - 0.5) * 2 * rough;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n],
      p1 = pts[i],
      p2 = pts[(i + 1) % n],
      p3 = pts[(i + 2) % n];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}

/* a crown from a few clumps [cx, cy, rx, ry]: one outlined silhouette for all of them, then each clump's body, then
   the moonlight on its top-left, then a few wet glints. Three flat bands, no circles stacked on circles. */
function tCrown(clumps, r, lit0 = TC.lit) {
  let ink = "",
    shade = "",
    body = "",
    lit = "",
    glint = "";
  for (const [cx, cy, rx, ry] of clumps) {
    const d = tBlob(cx, cy, rx, ry, r);
    ink += `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/>`;
    shade += `<path d="${d}" fill="${TC.shade}"/>`;
    body += `<path d="${tBlob(cx - rx * 0.04, cy - ry * 0.14, rx * 0.86, ry * 0.72, r, 0.24)}" fill="${TC.leaf}"/>`;
    if (rx < 14) continue; // (a small leaf tip: its body only)
    lit += `<path d="${tBlob(cx - rx * 0.24, cy - ry * 0.4, rx * 0.46, ry * 0.3, r, 0.3, 12)}" fill="${lit0}"/>`;
    for (let i = 0; i < 2; i++)
      glint += `<rect x="${n1(cx - rx * 0.55 + r() * rx * 0.6)}" y="${n1(cy - ry * 0.62 + r() * ry * 0.3)}" width="4" height="3" fill="${TC.rim}"/>`;
  }
  return ink + shade + body + lit + glint;
}

/* a limb: an ink line under a bark line */
const tLimb = (d, w, col = TC.bark) =>
  `<path d="${d}" fill="none" stroke="${TINK}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const tShadow = (cx, b, rx) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(b)}" rx="${n1(rx)}" ry="${n1(rx * 0.3)}" fill="#05070a" opacity=".55"/>`;

/* a trunk from its foot (cx, b) up to y top: flared at the foot (flare × its width), a dark side and a lit side */
function tTrunk(
  cx,
  b,
  top,
  w0,
  w1,
  flare,
  col = [TC.bark, TC.barkD, TC.barkHi],
) {
  const [c, cd, ch] = col,
    m = b - (b - top) * 0.3;
  const d = `M${n1(cx - w0 * flare)} ${b}C${n1(cx - w0)} ${b - 3} ${n1(cx - w0 * 0.8)} ${n1(m + 10)} ${n1(cx - w1)} ${n1(m)}L${n1(cx - w1 * 0.8)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const dr = `M${n1(cx + w0 * 0.15)} ${b}C${n1(cx + w0 * 0.4)} ${n1(m + 10)} ${n1(cx + w1 * 0.2)} ${n1(m)} ${n1(cx + w1 * 0.15)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const lt = `M${n1(cx - w0 * 0.75)} ${b - 4}C${n1(cx - w0 * 0.6)} ${n1(m + 8)} ${n1(cx - w1 * 0.6)} ${n1(m)} ${n1(cx - w1 * 0.55)} ${top + 4}`;
  return `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/><path d="${d}" fill="${c}"/><path d="${dr}" fill="${cd}"/><path d="${lt}" fill="none" stroke="${ch}" stroke-width="4" stroke-linecap="round"/>`;
}
const tKnee = (x, b, k) =>
  `<path d="M${n1(x - 7 * k)} ${b + 1}Q${n1(x - 3 * k)} ${n1(b - 15 * k)} ${n1(x)} ${n1(b - 16 * k)}Q${n1(x + 3 * k)} ${n1(b - 15 * k)} ${n1(x + 7 * k)} ${b + 1}Z" fill="${TC.bark}" stroke="${TINK}" stroke-width="3" stroke-linejoin="round"/><path d="M${n1(x - 3 * k)} ${n1(b - 8 * k)}L${n1(x - 1)} ${n1(b - 13 * k)}" stroke="${TC.barkHi}" stroke-width="3"/>`;

/* A: a bald cypress. Tall and thin, its foot flared wide with knees round it; flat pads of leaves stepping up the
   trunk, gaps between them. About 3.5 ducks tall. v: 0 three pads, 1 two pads high on a long bare trunk, 2 young and
   narrow with four small pads */
const CYPRESS = [
  {
    w: 150,
    top: 26,
    pads: [
      [6, 34, 44, 15],
      [-14, 80, 60, 18],
      [14, 126, 54, 17],
    ],
  },
  {
    w: 150,
    top: 22,
    pads: [
      [-10, 40, 56, 17],
      [16, 90, 50, 16],
    ],
  },
  {
    w: 120,
    top: 20,
    pads: [
      [4, 32, 30, 11],
      [-8, 62, 38, 13],
      [8, 96, 42, 13],
      [-4, 130, 44, 14],
    ],
  },
];
function cypress(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 13 + 1),
    { w, top, pads } = CYPRESS[v],
    h = 230,
    foot = 14,
    cx = w / 2,
    b = h - foot,
    k = w / 150;
  let s = tShadow(cx, b, 50 * k);
  s +=
    tKnee(cx - 44 * k, b, 0.9) +
    tKnee(cx + 40 * k, b, 1.1) +
    tKnee(cx - 28 * k, b + 6, 0.6) +
    tKnee(cx + 22 * k, b + 7, 0.7);
  s += tTrunk(cx, b, top, 15 * k, 6, 2.3);
  for (const [dx, y] of pads)
    s += tLimb(
      `M${cx} ${y + 10}Q${n1(cx + dx / 2)} ${y + 6} ${n1(cx + dx)} ${y + 2}`,
      4,
    );
  for (const [dx, y, rx, ry] of pads) {
    const x = cx + dx;
    s += tCrown(
      [
        [x - rx * 0.45, y + 2, rx * 0.58, ry],
        [x + rx * 0.4, y + 1, rx * 0.6, ry * 0.95],
        [x, y - ry * 0.25, rx * 0.62, ry * 1.05],
      ],
      r,
    );
  }
  s += tCrown([[cx + 2, top - 8, 20 * k, 11]], r); // (the top tuft)
  return { svg: tWrap(w, h, s, flip), w, h, foot };
}

/* B: a live oak. Short and thick, its great limbs reaching out low under one broad lumpy crown. About 2.8 ducks tall:
   the big one, used sparingly. v: 0 even, 1 leaning one way (its long limb that way), 2 smaller, a taller dome */
const OAK = [
  {
    w: 244,
    clumps: [
      [-82, 78, 38, 24],
      [-44, 54, 50, 34],
      [4, 40, 58, 36],
      [50, 52, 50, 32],
      [86, 76, 36, 24],
      [0, 74, 76, 26],
    ],
    limbs: [
      [-6, 118, -50, 104, -92, 98, 10],
      [6, 112, 52, 98, 90, 96, 9],
    ],
  },
  {
    w: 244,
    clumps: [
      [-62, 82, 34, 22],
      [-30, 58, 44, 30],
      [16, 42, 56, 36],
      [62, 54, 50, 32],
      [96, 80, 30, 22],
      [20, 76, 74, 26],
    ],
    limbs: [
      [-6, 118, -36, 108, -66, 100, 9],
      [6, 110, 60, 96, 100, 98, 11],
    ],
  },
  {
    w: 200,
    clumps: [
      [-56, 82, 34, 24],
      [-26, 56, 44, 34],
      [8, 38, 50, 38],
      [44, 62, 42, 30],
      [0, 82, 58, 24],
    ],
    limbs: [
      [-6, 120, -36, 112, -64, 102, 8],
      [6, 116, 32, 104, 56, 100, 8],
    ],
  },
];
function oak(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 17 + 3),
    { w, clumps, limbs } = OAK[v],
    h = 184,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = tShadow(cx, b, w / 3);
  s += tCrown(
    clumps.map(([dx, y, rx, ry]) => [cx + dx, y, rx, ry]),
    r,
  );
  for (const [x0, y0, qx, qy, x1, y1, lw] of limbs)
    s += tLimb(`M${cx + x0} ${y0}Q${cx + qx} ${qy} ${cx + x1} ${y1}`, lw);
  s += tTrunk(cx, b, 92, w > 220 ? 22 : 19, w > 220 ? 15 : 13, 1.55);
  return { svg: tWrap(w, h, s, flip), w, h, foot };
}

/* D: a willow with no drapes: a round head on a short trunk, its sides drooping low, the trunk showing under it.
   About 3 ducks tall. v: 0 wide and drooping, 1 taller and narrower, 2 two trunks from one foot */
const WILLOW = [
  {
    w: 200,
    clumps: [
      [-62, 98, 32, 28],
      [-32, 64, 46, 36],
      [0, 44, 52, 38],
      [32, 62, 46, 36],
      [62, 96, 32, 28],
      [0, 86, 56, 28],
    ],
    trunks: [[4, 13]],
  },
  {
    w: 170,
    clumps: [
      [-48, 96, 28, 28],
      [-24, 58, 40, 36],
      [2, 34, 44, 34],
      [26, 56, 40, 36],
      [50, 92, 28, 28],
      [0, 80, 48, 30],
    ],
    trunks: [[2, 12]],
  },
  {
    w: 210,
    clumps: [
      [-68, 92, 30, 26],
      [-40, 62, 42, 34],
      [-6, 46, 46, 36],
      [30, 52, 46, 36],
      [64, 86, 32, 28],
      [0, 84, 62, 28],
    ],
    trunks: [
      [-14, 10],
      [18, 9],
    ],
  },
];
function willow(seed = 1, v = 0, flip = false) {
  const r = rnd(seed * 23 + 7),
    { w, clumps, trunks } = WILLOW[v],
    h = 200,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = tShadow(cx, b, w / 3);
  for (const [dx, tw] of trunks)
    s += tTrunk(cx + dx, b, 80, tw, tw * 0.62, 1.7);
  /* the droop: small round leaf tips all along the bottom of its sides, so it weeps without a single strand */
  const C2 = clumps.map(([dx, y, rx, ry]) => [cx + dx, y, rx, ry]),
    tips = [];
  for (const [x, y, rx, ry] of C2.slice(0, -1))
    if (y > 80)
      for (let i = -1; i <= 1; i++)
        tips.push([
          x + i * rx * (0.5 + r() * 0.15),
          y + ry * (0.8 - Math.abs(i) * 0.25) + r() * 6,
          8 + r() * 4,
          10 + r() * 6,
        ]);
  s += tCrown([...C2, ...tips], r, "#358226"); // (a willow's leaves a little yellower than the rest)
  return { svg: tWrap(w, h, s, flip), w, h, foot };
}

export const SWAMP_KINDS = { cypress, oak, willow };
export const swampTreeSVG = (kind = "cypress", v = 0, seed = 1, flip = false) =>
  SWAMP_KINDS[kind](seed, v, flip);
/* ---------- the swamp's big trees, seen from above (the owner's, Nov 17 03:34Z) ----------
   Trees much bigger than ducks: the trunk's foot about one duck across, the leaves about 4 to 5 ducks across, a roof
   over whoever walks under them (the owner's sketch). Cypress, oak and willow, three looks each, no drapes. Three pieces,
   each { svg, w, h, ax, ay } in world px (a duck is 64), (ax, ay) the point on the trunk's foot:
   - swampShadeSVG: the leaves' shade on the ground (the ground layer)
   - swampTrunkSVG: the trunk, its roots and its limbs, sorted with the ducks by its foot; base: its foot's width
   - swampCrownSVG: the leaves from above, over everything, faded while a duck is under them
   flip mirrors all three the same way. */
export const SWAMP_CROWN = {
  cypress: [
    { w: 230, h: 190 },
    { w: 250, h: 176 },
    { w: 200, h: 170 },
  ],
  oak: [
    { w: 330, h: 250 },
    { w: 350, h: 236 },
    { w: 290, h: 230 },
  ],
  willow: [
    { w: 280, h: 230 },
    { w: 300, h: 214 },
    { w: 250, h: 214 },
  ],
};
/* each kind's shape: its clumps (a ring of them and some inside), its leaf points round the edge, its trunk */
const BIG = {
  /* a cypress: feathery, in rings that step up to its middle, fine needles all round */
  cypress: {
    look: "tiers",
    ring: 12,
    inner: 7,
    clump: 0.14,
    points: 34,
    pointLen: 0.12,
    pointW: 0.045,
    trunk: 40,
    flare: 1.9,
    limbs: 6,
    lit: TC.lit,
  },
  /* an oak: a few great lumps of leaves, a few broad points (the owner's sketch) */
  oak: {
    look: "cloud",
    ring: 6,
    inner: 3,
    clump: 0.27,
    points: 6,
    pointLen: 0.2,
    pointW: 0.2,
    trunk: 54,
    flare: 1.4,
    limbs: 5,
    lit: TC.lit,
  },
  /* a willow: round, its fronds running out from the middle to long thin tips all round */
  willow: {
    look: "fronds",
    ring: 12,
    inner: 3,
    clump: 0.17,
    points: 44,
    pointLen: 0.2,
    pointW: 0.04,
    trunk: 44,
    flare: 1.6,
    limbs: 7,
    lit: "#358226",
  },
};
/* the crown's plan (the same for its shade): clumps and points round (0, 0), the crown's middle */
function bigPlan(kind, v, seed) {
  const r = rnd(seed * 37 + v * 11 + kind.length * 5),
    K = BIG[kind],
    { w, h } = SWAMP_CROWN[kind][v],
    hx = w / 2,
    hy = h / 2,
    lean = v === 1 ? 0.12 : 0, // (the second look leans its leaves one way)
    clumps = [],
    points = [];
  for (let i = 0; i < K.ring; i++) {
    const a = ((i + r() * 0.5) / K.ring) * Math.PI * 2,
      out = 0.62 + (r() - 0.5) * 0.12,
      rx = hx * K.clump * 2 * (0.85 + r() * 0.3),
      x =
        Math.cos(a) * (hx - rx * 0.9) * (out / 0.62) * 0.98 +
        lean * hx * (1 + Math.cos(a)) * 0.5,
      y = Math.sin(a) * (hy - rx * 0.8 * (h / w)) * (out / 0.62) * 0.98;
    clumps.push([x, y, rx, rx * (h / w) * 1.05]);
  }
  for (let i = 0; i < K.inner; i++) {
    const a = ((i + r()) / K.inner) * Math.PI * 2,
      rx = hx * K.clump * 2.2 * (0.85 + r() * 0.3);
    clumps.push([
      Math.cos(a) * hx * 0.26 + lean * hx * 0.5,
      Math.sin(a) * hy * 0.26 - hy * 0.05,
      rx,
      rx * (h / w),
    ]);
  }
  clumps.push([
    lean * hx * 0.5 - hx * 0.06,
    -hy * 0.12,
    hx * K.clump * 2.1,
    hy * K.clump * 2.1,
  ]); // (the top, highest)
  for (let i = 0; i < K.points; i++) {
    const a = ((i + r() * 0.6) / K.points) * Math.PI * 2,
      c = Math.cos(a),
      s = Math.sin(a),
      len = K.pointLen * (0.6 + r() * 0.8),
      wid = K.pointW * (0.7 + r() * 0.6);
    // (a point: its two corners just inside the edge, its tip out past it)
    const at = (k, da) => [
      Math.cos(a + da) * hx * k + lean * hx * (1 + Math.cos(a)) * 0.5,
      Math.sin(a + da) * hy * k,
    ];
    points.push([
      at(0.86, -wid),
      at(1 + len, (r() - 0.5) * 0.05),
      at(0.86, wid),
    ]);
  }
  return { r, K, w, h, clumps, points };
}
const ptsPath = (P, dx, dy) =>
  "M" + P.map(([x, y]) => `${n1(x + dx)} ${n1(y + dy)}`).join("L") + "Z";
const BIG_PAD = 30; // (room round the crown for its points and its ink)
const crownLift = (h) => Math.round(h * 0.3); // (how far above the trunk's foot the crown's middle shows)
const pieceOut = (W, H, s, ax, ay, flip) => ({
  svg: tWrap(W, H, s, flip),
  w: W,
  h: H,
  ax: flip ? W - ax : ax,
  ay,
});

/* the leaves from above: one ink outline round every clump and point, the deep leaves, each clump's body, the moon
   on the top-left of each, a few wet glints */
export function swampCrownSVG(kind = "cypress", v = 0, seed = 1, flip = false) {
  const { r, K, w, h, clumps, points } = bigPlan(kind, v, seed),
    W = w + BIG_PAD * 2,
    H = h + BIG_PAD * 2,
    cx = W / 2,
    cy = H / 2;
  let ink = "",
    deep = "",
    body = "",
    lit = "",
    glint = "";
  for (const P of points) {
    const d = ptsPath(P, cx, cy);
    ink += `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/>`;
    deep += `<path d="${d}" fill="${TC.shade}"/>`;
  }
  clumps.forEach(([x, y, rx, ry], i) => {
    const d = tBlob(cx + x, cy + y, rx, ry, r),
      ring = i < K.ring ? 0 : i < clumps.length - 1 ? 1 : 2; // (the outer ring, the inner one, the top)
    ink += `<path d="${d}" fill="${TINK}" stroke="${TINK}" stroke-width="6" stroke-linejoin="round"/>`;
    deep += `<path d="${d}" fill="${TC.shade}"/>`;
    body += `<path d="${tBlob(cx + x - rx * 0.06, cy + y - ry * 0.1, rx * 0.82, ry * 0.78, r, 0.24)}" fill="${TC.leaf}"/>`;
    if (K.look === "fronds") return; // (a willow's light runs down its fronds instead)
    if (K.look === "tiers" && ring === 0 && r() < 0.5) return; // (a cypress's outer ring mostly in the dark)
    const k = K.look === "tiers" ? 0.34 + ring * 0.08 : 0.44;
    lit += `<path d="${tBlob(cx + x - rx * 0.26, cy + y - ry * 0.3, rx * k, ry * k * 0.8, r, 0.3, 12)}" fill="${K.look === "tiers" && ring === 2 ? TC.rim : K.lit}"/>`;
    if (r() < 0.5)
      glint += `<rect x="${n1(cx + x - rx * 0.5 + r() * rx * 0.5)}" y="${n1(cy + y - ry * 0.55 + r() * ry * 0.3)}" width="4" height="3" fill="${TC.rim}"/>`;
  });
  if (K.look === "fronds")
    /* a willow: its fronds from the middle out, lit on the moon's side, dark on the other */
    for (let i = 0; i < 22; i++) {
      const a = ((i + r() * 0.8) / 22) * Math.PI * 2,
        c = Math.cos(a),
        sn = Math.sin(a),
        k0 = 0.12 + r() * 0.3,
        k1 = 0.6 + r() * 0.3,
        side = -(c + sn) / 1.4; // (1 facing the moon, up and left; −1 away)
      if (side < -0.5 && r() < 0.6) continue; // (the far side mostly plain)
      const bend = (r() - 0.5) * 0.5,
        km = (k0 + k1) / 2,
        P = (k, da = 0) =>
          `${n1(cx + Math.cos(a + da) * (w / 2) * k)} ${n1(cy + Math.sin(a + da) * (h / 2) * k)}`;
      lit += `<path d="M${P(k0)}Q${P(km, bend)} ${P(k1, bend * 0.6)}" fill="none" stroke="${side > -0.2 ? K.lit : TC.shade}" stroke-width="${side > 0.4 ? 6 : 4}" stroke-linecap="round"/>`;
    }
  return pieceOut(
    W,
    H,
    ink + deep + body + lit + glint,
    cx,
    cy + crownLift(h),
    flip,
  );
}

/* the leaves' shade on the ground: the crown's shape, a little smaller, flat and dark, mostly under the leaves, peeking
   out down and right of them (the moon is up and left) */
export function swampShadeSVG(kind = "cypress", v = 0, seed = 1, flip = false) {
  const { r, w, h, clumps, points } = bigPlan(kind, v, seed),
    W = w + BIG_PAD * 2,
    H = h + BIG_PAD * 2,
    cx = W / 2,
    cy = H / 2;
  let s = "";
  for (const P of points) s += `<path d="${ptsPath(P, cx, cy)}"/>`;
  for (const [x, y, rx, ry] of clumps)
    s += `<path d="${tBlob(cx + x, cy + y, rx, ry, r)}"/>`;
  return pieceOut(
    W,
    H,
    `<g fill="#05070a" opacity=".38" transform="translate(${n1(cx)} ${n1(cy)}) scale(.86) translate(${n1(-cx)} ${n1(-cy)})">${s}</g>`,
    cx - 16,
    cy + crownLift(h) * 0.45,
    flip,
  );
}

/* the trunk at the map's slant: its foot flared on the ground with roots running off it (a cypress's knees round it),
   the trunk up to where the leaves start, its limbs spreading out under them. Hidden under the leaves till they fade */
export function swampTrunkSVG(kind = "cypress", v = 0, seed = 1, flip = false) {
  const { K, w, h } = bigPlan(kind, v, seed),
    r = rnd(seed * 41 + v * 13 + kind.length),
    lift = crownLift(h),
    up = lift + 26, // (the trunk's height on screen, to the crown's middle and a little past)
    W = w + BIG_PAD * 2,
    H = up + h * 0.5 + 40,
    cx = W / 2,
    b = H - 24,
    top = b - up,
    tw = K.trunk / 2;
  let s = `<ellipse cx="${cx}" cy="${b}" rx="${n1(tw * K.flare * 1.3)}" ry="${n1(tw * K.flare * 0.45)}" fill="#05070a" opacity=".5"/>`;
  /* roots: tapered, along the ground away from the foot */
  let roots = "";
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (-0.05 + (i / 5) * 1.1) + (r() - 0.5) * 0.3,
      len = tw * (1.6 + r() * 1.2),
      x0 = cx + Math.cos(a) * tw * 0.8,
      y0 = b + Math.sin(a) * tw * 0.25,
      x1 = cx + Math.cos(a) * len * 1.3,
      y1 = b + Math.sin(a) * len * 0.45;
    const hw = tw * 0.32,
      nx = -Math.sin(a) * hw,
      ny = Math.cos(a) * hw * 0.9;
    roots += `<path d="M${n1(x0 + nx)} ${n1(y0 + ny)}Q${n1((x0 + x1) / 2 + nx * 0.5)} ${n1((y0 + y1) / 2 + ny * 0.5 - 3)} ${n1(x1)} ${n1(y1)}Q${n1((x0 + x1) / 2 - nx * 0.5)} ${n1((y0 + y1) / 2 - ny * 0.5)} ${n1(x0 - nx)} ${n1(y0 - ny)}Z"/>`;
  }
  s += `<g fill="${TC.bark}" stroke="${TINK}" stroke-width="3" stroke-linejoin="round">${roots}</g>`;
  if (kind === "cypress")
    for (const [dx, dy, k] of [
      [-1.9, 0.5, 0.9],
      [2.0, 0.3, 1.1],
      [-1.2, 1.1, 0.7],
      [1.4, 1.2, 0.8],
      [0.2, 1.5, 0.6],
    ])
      s += tKnee(cx + dx * tw * 1.4, b + dy * tw * 0.5, k * 1.2);
  /* the limbs: from the trunk's top out and up under the leaves (never down across the trunk), thinner as they go,
     each with a twig off it */
  s += tTrunk(cx, b, top, tw, tw * 0.78, K.flare);
  for (let i = 0; i < K.limbs; i++) {
    const a = -Math.PI * (0.06 + ((i + 0.2 + r() * 0.6) / K.limbs) * 0.88),
      len = (w / 2) * (0.6 + r() * 0.25),
      sy = (h / w) * 0.8,
      at = (k, da = 0) => [
        cx + Math.cos(a + da) * len * k,
        top + 4 + Math.sin(a + da) * len * k * sy,
      ],
      [mx, my] = at(0.5, 0.12 * (r() - 0.5)),
      [ex, ey] = at(1, 0.2 * (r() - 0.5)),
      [tx, ty] = at(0.82, (r() < 0.5 ? -1 : 1) * 0.35);
    s += tLimb(`M${cx} ${top + 6}L${n1(mx)} ${n1(my)}`, Math.max(6, tw * 0.5));
    s += tLimb(
      `M${n1(mx)} ${n1(my)}L${n1(ex)} ${n1(ey)}`,
      Math.max(4, tw * 0.28),
    );
    s += tLimb(`M${n1(mx)} ${n1(my)}L${n1(tx)} ${n1(ty)}`, 3);
  }
  return {
    ...pieceOut(W, H, s, cx, b, flip),
    base: Math.round(K.trunk * 1.25),
  }; // (about a duck: what blocks)
}

/* the fallen tree across the road's east end: a log from (x0, y0) to (x1, y1) in a box w × h, `half` thick each side
   and lying `z` high at its middle; its roots torn up at the south end, its broken crown at the north, moss along it */
export function fallenSVG({ w, h, x0, y0, x1, y1, half = 55, z = 30 }) {
  const id = uid(),
    dx = x1 - x0,
    dy = y1 - y0,
    len = Math.hypot(dx, dy),
    a = (Math.atan2(dy, dx) * 180) / Math.PI;
  const defs = F`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#805031"/><stop offset=".5" stop-color="#5e3215"/><stop offset="1" stop-color="#381e10"/></linearGradient>`;
  // drawn along x in its own frame (0 … len, −half … half), then turned onto its line and lifted z
  let g = R(
    0,
    -half,
    len,
    2 * half,
    `url(#${id})`,
    `rx="${half * 0.9}" ${ln(3)}`,
  );
  const r = rnd(7);
  for (let x = 30; x < len - 30; x += 26 + r() * 18)
    g += F`<path d="M${x} ${-half * 0.8}Q${x + 10} 0 ${x - 4} ${half * 0.8}" stroke="#381e10" stroke-width="3" fill="none"/>`;
  for (let x = 60; x < len - 60; x += 70 + r() * 60)
    g += F`<path d="M${x} ${-half * 0.9}c10 -6 30 -6 40 0c-8 6 -30 6 -40 0Z" fill="#788b59" ${ln(1.4)}/>`; // (moss on its top)
  // the roots at the far end, a broken crown at the near one, a few snapped branches
  for (let i = 0; i < 9; i++) {
    const t = (i / 8) * Math.PI * 1.4 - Math.PI * 0.7;
    g += F`<path d="M${len - 10} 0L${len + 30 + Math.cos(t) * 50} ${Math.sin(t) * (half + 40)}" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M${len - 10} 0L${len + 30 + Math.cos(t) * 50} ${Math.sin(t) * (half + 40)}" stroke="#5e3215" stroke-width="5" stroke-linecap="round"/>`;
  }
  g += F`<ellipse cx="${len + 10}" cy="0" rx="34" ry="${half + 10}" fill="#453219" ${ln(2.4)}/>`;
  g += F`<path d="M8 ${-half * 0.7}l-22 -16l10 22l-24 0l22 14l-20 18l26 -8" fill="#ae7838" ${ln(2)}/>`;
  for (const [x, k] of [
    [len * 0.3, -1],
    [len * 0.55, 1],
    [len * 0.75, -1],
  ])
    g += F`<path d="M${x} ${k * half * 0.6}l18 ${k * 40}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${x} ${k * half * 0.6}l18 ${k * 40}" stroke="#5e3215" stroke-width="6" stroke-linecap="round"/>`;
  const s =
    F`<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#000" stroke-width="${2 * half}" stroke-linecap="round" opacity=".3"/>` +
    F`<g transform="translate(${x0} ${y0 - z}) rotate(${a})">${g}</g>`;
  return wrap(w, h, s, defs);
}

/* ---------- the roofs, seen from outside ----------
   w × d: the roof's top, over the walls and 30 past them all round. The gas station's: flat, tar and gravel inside a
   parapet, two air-conditioning units and vents, the sign's red band along its front. The chapel's: pitched, its ridge
   running north-south, the west slope catching more light than the east, a cross on the ridge over the entrance */
export function roofSVG({ w, d, kind = "gs" }) {
  const id = uid();
  if (kind === "gs") {
    let s =
      R(2, 2, w - 4, d - 4, "#849097", ln(4)) +
      R(16, 16, w - 32, d - 32, "#353636", ln(2));
    const r = rnd(w + d);
    for (let i = 0; i < 26; i++)
      s += R(
        30 + r() * (w - 90),
        30 + r() * (d - 110),
        20 + r() * 50,
        8 + r() * 10,
        "#1d1e29",
      );
    // the air-conditioning units: a box each, its fan's grille on top
    for (const [x, y] of [
      [w * 0.62, d * 0.22],
      [w * 0.78, d * 0.22],
    ]) {
      s +=
        R(x, y, 110, 70, "#849097", ln(2.4)) +
        R(x, y + 70, 110, 30, "#565d77", ln(2.4)) +
        F`<circle cx="${x + 55}" cy="${y + 35}" r="26" fill="#353636" ${ln(2)}/><path d="M${x + 33} ${y + 35}H${x + 77}M${x + 55} ${y + 13}V${y + 57}" stroke="#849097" stroke-width="3"/>`;
    }
    for (const [x, y] of [
      [w * 0.3, d * 0.3],
      [w * 0.45, d * 0.55],
    ])
      s += F`<ellipse cx="${x}" cy="${y}" rx="14" ry="10" fill="#565d77" ${ln(2)}/><ellipse cx="${x}" cy="${y - 2}" rx="8" ry="5" fill="#111417"/>`;
    // the sign along the front: a red band with a white stripe and a white panel with the fuel drop
    const by = d - 70;
    s +=
      R(2, by, w - 4, 68, "#c7282a", ln(3)) +
      R(2, by + 30, w - 4, 10, "#f7f8f3") +
      R(2, by + 60, w - 4, 8, "#820a17");
    const cx = w * 0.62;
    s +=
      R(cx - 90, by - 10, 180, 88, "#f7f8f3", ln(3)) +
      F`<path d="M${cx} ${by + 2}C${cx - 22} ${by + 30} ${cx - 20} ${by + 66} ${cx} ${by + 66}C${cx + 20} ${by + 66} ${cx + 22} ${by + 30} ${cx} ${by + 2}Z" fill="#c7282a" ${ln(2)}/>`;
    return wrap(w, d, s);
  }
  const defs =
    F`<pattern id="${id}w" width="20" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="40" fill="#565d77"/><path d="M1.5 0V40" stroke="#414d59" stroke-width="3"/><path d="M0 20H20" stroke="#414d59" stroke-width="2"/></pattern>` +
    F`<pattern id="${id}e" width="20" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="40" fill="#414d59"/><path d="M1.5 0V40" stroke="#353636" stroke-width="3"/><path d="M0 20H20" stroke="#353636" stroke-width="2"/></pattern>`;
  let s =
    R(2, 2, w / 2 - 2, d - 4, `url(#${id}w)`, ln(4)) +
    R(w / 2, 2, w / 2 - 2, d - 4, `url(#${id}e)`, ln(4)) +
    R(w / 2 - 9, 2, 18, d - 4, "#849097", ln(2.4)); // (the ridge)
  s += R(2, d - 18, w - 4, 16, "#f7f8f3", ln(2.4)); // (the eaves over the south wall)
  const cy = 90;
  s += F`<path d="M${w / 2} ${cy - 50}V${cy + 40}M${w / 2 - 26} ${cy - 18}H${w / 2 + 26}" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M${w / 2} ${cy - 50}V${cy + 40}M${w / 2 - 26} ${cy - 18}H${w / 2 + 26}" stroke="#c9a11e" stroke-width="9" stroke-linecap="round"/>`;
  return wrap(w, d, s, defs);
}
