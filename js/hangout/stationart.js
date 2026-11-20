/* ---------- Downpour's things: the drawings (Dead Ducks Arcade's second map, stationmap.js) ----------
   The owner's swamp at night in the rain: the gas station, the cars stopped on the road, the chapel, the trees.
   Drawn as Duck Cabin's props are (art.js): ink outlines, lighter tops, darker fronts, seen from above and in front.
   A box-like thing w wide, d deep and h tall is drawn into w × (d + h): its top in the first d, its south face under it.
   Inside one, a point (x, y) of its floor plan at height z is at (x, y − z + h) (`at` below). Preview:
   tools/downpour-art.html. */

import { duckSVG, DUCK_DEFAULT } from "../duck.js";
import { hitsOf } from "../l4ddart.js";
import { zombieLook } from "../l4ddrules.js";
import {
  rnd,
  holeSeed,
  brokenRows,
  joint,
  roofHoleShape as holeShape,
} from "./stationmap.js";

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
  brokenW = 0,
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
  /* brokenW (a seed): its west end smashed (the gas station's south wall at the restroom's corner, where the hole in the
     west wall runs up to it: the owner's, Nov 19 22:41Z). Since his 23:41Z ("why is there just like a cookie cutter on
     the wall at that corner? I mean, it's bricks"): it breaks the way a block wall does, along its mortar, a whole
     block at a time. Each course (a row of blocks, 12 high: SKINS.gs) ends at one of its own joints, and going up each
     ends a half block, a whole one or more farther east than the one under it, so the end climbs in stairs; where a
     course stands out past the one over it, its broken top shows (the wall's cut grey, the wall's thickness deep), as
     the wall's top does. The blocks that came off lie in a heap at its foot (shapes.js, bricks.js heapBricks) */
  if (brokenW) {
    const r = rnd(brokenW),
      rows = brokenRows(r, w, h, t);
    /* what stands, as boxes: the top, each course's face, and where a course reaches farther west than the one over
       it, its broken top (the wall's cut grey, the wall's thickness deep) behind the faces over it */
    const cap = { x: rows[0].x, a: 0, b: t },
      over = [cap, ...rows],
      boxes = [[cap.x, 0, w - cap.x, t]],
      tops = [];
    rows.forEach((q, i) => {
      boxes.push([q.x, q.a, w - q.x, q.b - q.a]);
      for (let k = i; k >= 0; k--) {
        const u = over[k], // (the course over it, then the one over that)
          y0 = Math.max(u.a, q.a - t),
          y1 = Math.min(u.b, q.a),
          x1 = Math.min(over[i].x, ...over.slice(k, i + 1).map((v) => v.x));
        if (y1 <= y0) break;
        if (x1 > q.x) tops.push([q.x, y0, x1 - q.x, y1 - y0, q.j, y1 === q.a]);
      }
    });
    boxes.push(...tops);
    defs += F`<clipPath id="${id}b">${boxes.map(([x, y, bw, bh]) => R(x, y, bw, bh, "#000")).join("")}</clipPath>`;
    /* each broken top: the blocks' insides, light (Joseph's critique, Nov 20: dark, "they read as stairs painted on the
       face"), the joints between them across it, and its front edge, the top of the face under it, lit */
    const rowsTop = (j) => rows.find((v) => v.j === j).a;
    let steps = "";
    for (const [x, y, bw, bh, j, front] of tops) {
      steps += R(x, y, bw, bh, S.end);
      if (front) steps += R(x, y + bh - 3, bw, 3, "#d0cfa2");
      if (y === rowsTop(j) - t) steps += R(x, y, bw, 2, S.top); // (its far edge)
      for (let jx = joint(j, x + 4); jx < x + bw - 2; jx += 64)
        steps += R(jx - 1, y, 2, bh - (front ? 3 : 0), S.top);
    }
    /* a few soft cracks along joints near the break, a shade under the face (never black) */
    let cracks = "";
    for (let i = 0; i < rows.length; i++)
      if (r() < 0.45) {
        const q = rows[i],
          x0 = joint(q.j, q.x + 30);
        cracks += F`<path d="M${x0} ${n1(q.a + 1)}l${n1(-2 + r() * 4)} ${n1((q.b - q.a) / 2)}l${n1(2 + r() * 3)} ${n1((q.b - q.a) / 2 - 1)}" fill="none" stroke="#9eb3a1" stroke-width="1.6"/>`;
      }
    /* the ink round what stands, a pixel at a time (one to 2 world px), along the broken end only (the rest of the wall
       has its own) */
    const P = 2,
      inBox = (x, y) =>
        boxes.some(
          ([bx, by, bw, bh]) =>
            x >= bx && x < bx + bw && y >= by && y < by + bh,
        ),
      reach = Math.max(...rows.map((q) => q.x)) + 6;
    let ink = "";
    for (let y = 0; y < h; y += P)
      for (let x = 0; x < Math.min(w, reach); x += P) {
        if (!inBox(x + 1, y + 1)) continue;
        if (
          [
            [-P, 0],
            [0, -P],
            [0, P],
          ].some(([dx, dy]) => !inBox(x + 1 + dx, y + 1 + dy) && y + dy < h)
        )
          ink += R(x, y, P, P, O);
      }
    s = F`<g clip-path="url(#${id}b)">${s}${steps}${cracks}</g>` + ink;
  }
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
  broken = 0,
}) {
  const S = SKINS[skin],
    len = h - wallH,
    e = plain ? h : len;
  if (broken) return gsWallYBroken(w, h, wallH, S, open, broken);
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
/* a north-south wall's piece whose south end is smashed (a hole in the wall: the owner's, Nov 19 22:41Z, "They don't
   resemble the wall at all. They're not the same dimensions as the wall ... no depth ... no vanishing point"). The wall
   itself, broken: its own width (its thickness) and height, nothing past them. Going south, it breaks down in steps,
   each lower than the last, the way a smashed wall stands: its top at full height ends ragged, then a stump 3/5 as
   high, then one under a third, at the floor. Each step is drawn as the world draws the wall: its top (the wall's grey)
   up the screen by its height, and under it its broken face (the wall's bricks and mortar), down to the next step */
function gsWallYBroken(w, h, wallH, S, open, seed) {
  const r = rnd(seed),
    A = wallH * 0.6,
    B = wallH * 0.28,
    l1 = 30,
    l2 = 14,
    jag = (y) => {
      const k = 4;
      let p = "";
      for (let i = k; i >= 0; i--)
        p += `L${n1((w * i) / k)} ${n1(y + (i % 2 ? 3 : -2) * (0.6 + r() * 0.6))}`;
      return p;
    }, // (a broken edge across the wall, east to west)
    brick = (y0, y1) => {
      let m = "";
      for (let y = y0 + 6; y < y1 - 2; y += 8) m += `M1 ${n1(y)}H${w - 1}`;
      for (let y = y0 + 2, i = 0; y < y1 - 6; y += 8, i++)
        m += `M${n1(w * (i % 2 ? 0.3 : 0.7))} ${n1(y + 1)}v6`;
      return (
        R(0, y0, w, y1 - y0, "#d0cfa2") +
        (m ? F`<path d="${m}" stroke="#9eb3a1" stroke-width="2"/>` : "")
      );
    };
  /* the screen's rows: each step's top, then its face (h is the floor at the end) */
  const t1 = h - l1 - wallH,
    f1 = h - l1 - A,
    t2 = h - l2 - A,
    f2 = h - l2 - B,
    t3 = h - B;
  /* each broken face first, then the top over it, so the top's ragged edge shows over its face */
  const side = (y0, y1, last) =>
    F`<path d="M0 ${n1(y0)}V${n1(y1)}${last ? `H${w}` : `M${w} ${n1(y1)}`}V${n1(y0)}" fill="none" ${ln(2.6)}/>`;
  let s =
    brick(t1 - 4, f1) +
    side(t1, f1) +
    F`<path d="M0 0H${w}V${n1(t1)}${jag(t1)}Z" fill="${S.top}" ${ln(2.6)}/>` + // (the wall at full height)
    F`<path d="M${w * 0.4} ${open ? 0 : 3}V${n1(t1 - 4)}" stroke="${S.topHi}" stroke-width="3" opacity=".7"/>`;
  s +=
    brick(t2 - 4, f2) +
    side(t2, f2) +
    F`<path d="M0 ${n1(f1)}H${w}V${n1(t2)}${jag(t2)}Z" fill="${S.top}" ${ln(2.6)}/>`; // (the first stump)
  s +=
    brick(t3 - 4, h) +
    side(t3, h, true) +
    F`<path d="M0 ${n1(f2)}H${w}V${n1(t3)}${jag(t3)}Z" fill="${S.top}" ${ln(2.6)}/>`; // (the last one, low at the floor)
  /* a rusty rod out of each break */
  for (const y of [t1, t2])
    s += F`<path d="M${n1(w * (0.3 + r() * 0.4))} ${n1(y + 2)}l${n1((r() - 0.5) * 10)} 9" stroke="#9a5a2c" stroke-width="2.4" stroke-linecap="round"/>`;
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
/* a piece of the tall chain-link fence across the road, running north-south, d long and h tall (the owner's, Nov 17:
   "the fences will be chain linked fence btw and holding ur light to it helps see that"). Seen straight on it would be
   a line, so it's drawn leaning: its foot on its line, its top lean px over to one side (dir: 1 east, -1 west, out
   toward the map's edge), the way a tall thing leans away from the middle of a view from above, so a duck standing at
   its foot is in front of it, never under it (the owner's, Nov 17 12:28Z: leaning in over the ducks, they looked to be
   through it). The links are see-through wire, bright galvanized grey, so the
   dark shows them faintly and a flashlight clearly; its posts, its top rail and the barbed wire along the top.
   Drawn into (lean + 8) × (d + h); its foot's line at x 4 (dir 1) or lean + 4 (dir -1). fenceLean below */
export function fenceSVG({
  d = 200,
  h = 200,
  lean = 54,
  dir = 1,
  seed = 1,
} = {}) {
  const id = uid(),
    r = rnd(seed),
    W = lean + 8,
    bx = dir > 0 ? 4 : W - 4, // (its foot's line)
    tx = bx + dir * lean, // (its top's)
    C = 14; // (a link across)
  /* a point on its face: u along it (0 … d, north to south), v up it (0 … h) */
  const at = (u, v) => [n1(bx + (dir * lean * v) / h), n1(h + u - v)];
  const line = (u0, v0, u1, v1) => {
    const [x0, y0] = at(u0, v0),
      [x1, y1] = at(u1, v1);
    return `M${x0} ${y0}L${x1} ${y1}`;
  };
  const defs =
    F`<pattern id="${id}" width="${C}" height="${C}" patternUnits="userSpaceOnUse"><path d="M0 ${C / 2}L${C / 2} 0L${C} ${C / 2}L${C / 2} ${C}Z" fill="none" stroke="#1c1c28" stroke-width="3.6" opacity=".5"/><path d="M0 ${C / 2}L${C / 2} 0L${C} ${C / 2}L${C / 2} ${C}Z" fill="none" stroke="#b9c3c8" stroke-width="1.8"/></pattern>` +
    F`<clipPath id="${id}c"><path d="M${bx} ${h}L${bx} ${h + d}L${tx} ${d}L${tx} 0Z"/></clipPath>`;
  // a little shadow on the ground along its foot, then the links (see-through) between its foot and its top
  let s = F`<path d="M${bx} ${h}V${h + d}" stroke="#05060a" stroke-width="6" opacity=".35"/>`;
  s += F`<rect x="0" y="0" width="${W}" height="${d + h}" fill="url(#${id})" clip-path="url(#${id}c)"/>`;
  // its posts, every 100 or so and one at each end, from its foot up to its top
  const posts = [3];
  for (let u = 50 + r() * 30; u < d - 30; u += 100) posts.push(u);
  posts.push(d - 3);
  for (const u of posts)
    s += `<path d="${line(u, 0, u, h)}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="${line(u, 0, u, h)}" stroke="#9aa6ad" stroke-width="3.6" stroke-linecap="round"/>`;
  // the top rail and the bottom wire
  for (const [v, k] of [
    [h - 4, 3.4],
    [4, 2],
  ])
    s += F`<path d="${line(0, v, d, v)}" stroke="${O}" stroke-width="${k + 3}"/><path d="${line(0, v, d, v)}" stroke="#d6dde0" stroke-width="${k}"/>`;
  // the barbed wire, curled along over the top
  let z = `M${tx} 0`;
  for (let u = 6, k = 1; u <= d; u += 7, k = -k)
    z += `L${n1(tx + k * 4)} ${n1(u)}`;
  s += `<path d="${z}" fill="none" stroke="${O}" stroke-width="3.6" stroke-linejoin="round"/><path d="${z}" fill="none" stroke="#d6dde0" stroke-width="1.6" stroke-linejoin="round"/>`;
  return wrap(W, d + h, s, defs);
}
/* a piece of the same fence running east-west (the north and south sides of the map), seen face on: w long, h tall,
   its foot along the bottom of a d deep band. Drawn into w × (h + d) */
export function fenceXSVG({ w = 400, d = 12, h = 200, seed = 1 } = {}) {
  const id = uid(),
    r = rnd(seed),
    C = 14,
    foot = h + d / 2;
  const defs = F`<pattern id="${id}" width="${C}" height="${C}" patternUnits="userSpaceOnUse"><path d="M0 ${C / 2}L${C / 2} 0L${C} ${C / 2}L${C / 2} ${C}Z" fill="none" stroke="#1c1c28" stroke-width="3.6" opacity=".5"/><path d="M0 ${C / 2}L${C / 2} 0L${C} ${C / 2}L${C / 2} ${C}Z" fill="none" stroke="#b9c3c8" stroke-width="1.8"/></pattern>`;
  // a little shadow on the ground along its foot, then the links (see-through) from its foot up to its top
  let s = F`<rect x="0" y="${foot - 3}" width="${w}" height="6" fill="#05060a" opacity=".35"/>`;
  s += F`<rect x="0" y="${d / 2}" width="${w}" height="${h}" fill="url(#${id})"/>`;
  // its posts, every 100 or so and one at each end
  const posts = [3];
  for (let u = 50 + r() * 30; u < w - 30; u += 100) posts.push(u);
  posts.push(w - 3);
  for (const u of posts)
    s += F`<path d="M${n1(u)} ${d / 2}V${foot}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${n1(u)} ${d / 2}V${foot}" stroke="#9aa6ad" stroke-width="3.6" stroke-linecap="round"/>`;
  // the top rail and the bottom wire
  for (const [v, k] of [
    [d / 2 + 4, 3.4],
    [foot - 4, 2],
  ])
    s += F`<path d="M0 ${v}H${w}" stroke="${O}" stroke-width="${k + 3}"/><path d="M0 ${v}H${w}" stroke="#d6dde0" stroke-width="${k}"/>`;
  // the barbed wire, curled along over the top
  let z = `M0 ${d / 2}`;
  for (let u = 7, k = 1; u <= w; u += 7, k = -k)
    z += `L${n1(u)} ${n1(d / 2 + k * 4)}`;
  s += `<path d="${z}" fill="none" stroke="${O}" stroke-width="3.6" stroke-linejoin="round"/><path d="${z}" fill="none" stroke="#d6dde0" stroke-width="1.6" stroke-linejoin="round"/>`;
  return wrap(w, d + h, s, defs);
}
/* how far a fence's top leans, and which way: out, away from the middle of the map, mapW wide. Its drawing (shapes.js)
   and the flashlights (l4dd.js) both ask */
export const fenceLean = (p, mapW) => (p.x < mapW / 2 ? -1 : 1) * p.h * 0.6;

/* ---------- the cars ---------- */
const CAR_COLORS = [
  ["#a24337", "#89132c"],
  ["#28638f", "#143b64"],
  ["#d6ccd8", "#849097"],
  ["#3d813f", "#1f6d20"],
  ["#ae7838", "#805031"],
  ["#565d77", "#353636"],
];
/* ---------- the dead (the owner's, Nov 17 12:28Z) ----------
   A duck's body lying on its side: the game's own duck drawing (duck.js) with the game's own wounds (l4ddart.js
   hitsOf: a bullet hole is a hole through it, a cut bleeds, a lost beak leaves a bloody stump), in its blood.
     yellow: a plain yellow duck shot through the head, on a car's hood;
     body: a dead duck on the chapel's floor, a different one each time the world loads (the owner's, Nov 20 21:38Z: Jaime left the game);
     soldier: a soldier duck on the gas station's roof, his beak gone, scratched all over, rotting;
     trooper: a yellow duck in his army uniform inside the gas station, his head blown off, shot through the body, in a
       pool of blood like the one that spills out of Justin (the owner's, Nov 18 10:38Z: "another dead duck with's it's
       head blown off and in a puddle of blood (like what spills out of Justin ) that is also yellow but wearing a
       military uniform with holes in his body"); now a dead zombie in that uniform, his head still on, his bullet
       wounds red (the owner's, Nov 19 10:22Z: "The last corpse in the gas station should be a dead zombie actually with
       it's head still there AND it's bullet wounds not looking yellow or golden because that isn't right"): the yellow
       was his own yellow showing where the holes tore his uniform; a zombie's skin is green. */
const BODY_COLORS = [
    "#ffd23f",
    "#f4f1ea",
    "#9bd3f2",
    "#f2a0b8",
    "#a8d672",
    "#c9a7e8",
  ], // (the chapel's dead duck: any of these)
  BLOOD = "#7d1424",
  BLOOD_D = "#3d0910",
  CORPSES = {
    yellow: { look: {}, hits: "B3B6c0c5", turn: -96 },
    body: {
      look: {
        color: BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)],
      },
      hits: "c0c2c4c5c7k1",
      turn: -84,
    },
    soldier: {
      look: {
        color: "#a7a26a", // (a yellow duck gone grey-green)
        hat: { id: "helmet" },
        outfit: { id: "military" },
      },
      hits: "p0c3c6c1c7r2r4k2",
      turn: 94,
    },
    trooper: {
      get look() {
        return { ...zombieLook([]), outfit: { id: "military" } }; // (Dead Ducks Arcade's zombie: l4ddrules.js; read when drawn)
      },
      hits: "B0b1B2b4b5",
      turn: -96,
      jpool: true,
    },
  };
/* Justin's pool of blood (l4dd.js POOL_SVG: the owner's, Nov 17 18:05Z, "on death a blood pool spreads"), 120 × 52
   round (0, 0): the one under every duck that dies (game.js) and under the trooper */
export const JUSTIN_POOL = `<ellipse cx="0" cy="0" rx="40" ry="15" fill="#5e0711"/>
  <ellipse cx="-24" cy="5" rx="22" ry="9" fill="#5e0711"/>
  <ellipse cx="26" cy="-4" rx="20" ry="9" fill="#5e0711"/>
  <ellipse cx="8" cy="10" rx="18" ry="7" fill="#5e0711"/>
  <ellipse cx="-6" cy="-3" rx="24" ry="8" fill="#7a0b17"/>
  <ellipse cx="-12" cy="-6" rx="7" ry="2" fill="#a3242c" opacity="0.6"/>`;
/* its blood under it, w across, a little splashed (seeded) */
const pool = (cx, cy, w, seed) => {
  const r = rnd(seed);
  let s = F`<ellipse cx="${cx}" cy="${cy}" rx="${w * 0.55}" ry="${w * 0.2}" fill="${BLOOD_D}" opacity=".85"/><ellipse cx="${cx - w * 0.04}" cy="${cy - w * 0.02}" rx="${w * 0.44}" ry="${w * 0.14}" fill="${BLOOD}"/>`;
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2,
      d = w * (0.5 + r() * 0.25);
    s += F`<ellipse cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d * 0.36}" rx="${2 + r() * 4}" ry="${1.4 + r() * 2.4}" fill="${BLOOD}"/>`;
  }
  return s;
};
/* the body itself, kind's, w plan px wide, lying on its side with its middle at (cx, cy): svg markup. only: "pool" its
   blood alone, "body" the body alone (the trooper's body goes, its pool stays: l4ddrules.js troopTick) */
export function corpse(kind, cx, cy, w = 100, flip = false, only = "") {
  const C = CORPSES[kind],
    h = hitsOf(C.hits),
    duck = duckSVG(
      { ...DUCK_DEFAULT, ...C.look },
      {
        size: 120,
        shadow: false,
        dead: true,
        skin: { head: h.inner, body: "", out: h.out },
        gone: h.gone,
      },
    ),
    vb = (duck.match(/viewBox="([^"]+)"/) || [, "0 0 120 120"])[1]
      .split(" ")
      .map(Number),
    inner = duck.replace(/^<svg[^>]*>|<\/svg>$/g, ""),
    k = w / 120,
    put = (body, dx = 0, dy = 0) =>
      F`<g transform="translate(${cx + dx} ${cy + dy})${flip ? " scale(-1 1)" : ""} rotate(${C.turn}) scale(${k}) translate(${-vb[0] - 60} ${-vb[1] - vb[3] * 0.62})">${body}</g>`;
  let s =
    only === "body"
      ? ""
      : C.jpool
        ? F`<g transform="translate(${cx} ${cy + w * 0.05}) scale(${(w * 1.5) / 120})" opacity=".92">${JUSTIN_POOL}</g>`
        : pool(cx, cy + w * 0.05, w * 1.1, w + cy);
  if (only === "pool") return s;
  if (!C.cut) return s + put(inner);
  /* cut up: the head off, a hand's width from the rest, the cut's edges raw */
  const id = uid();
  s += F`<defs><clipPath id="${id}a"><rect x="-200" y="${vb[1] + vb[3] * 0.52}" width="600" height="400"/></clipPath><clipPath id="${id}b"><rect x="-200" y="-200" width="600" height="${200 + vb[1] + vb[3] * 0.52}"/></clipPath></defs>`;
  s += put(`<g clip-path="url(#${id}a)">${inner}</g>`);
  s += put(`<g clip-path="url(#${id}b)">${inner}</g>`, -w * 0.32, -w * 0.06);
  s += F`<path d="M${cx - w * 0.2} ${cy - w * 0.16}c6 4 4 12 -2 18M${cx - w * 0.28} ${cy - w * 0.1}c5 5 3 10 -3 14" stroke="${BLOOD}" stroke-width="${w * 0.06}" stroke-linecap="round" fill="none"/>`;
  return s;
}
/* one of them on its own, for the chapel's floor: w × d */
export function corpseSVG({ w = 140, d = 70, kind = "body", only = "" } = {}) {
  return wrap(w, d, corpse(kind, w / 2, d * 0.55, w * 0.72, false, only));
}

/* a car stopped on the road, w × d (east-west), h tall: from above its hood, windshield, roof, rear window and trunk;
   its south side with the doors, the windows and the wheels. east: which way it faces. seed: its colour, a broken
   window. hood: its hood up, the engine showing (it stands taller than its box: up px over it). smash: its windows
   broken in (the owner's, Nov 17 12:28Z): "front" the windshield, "side" a south window, "both". dead: a dead duck
   lying on its hood (corpse above) */
export function carSVG({
  w = 420,
  d = 200,
  h = 110,
  seed = 1,
  east = true,
  hood = false,
  up = 0,
  smash = "",
  dead = "",
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
  const mid = (c0 + c1) / 2 + 10;
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
  /* a window smashed in: a jagged hole into the dark car, cracks running out from it over what's left of the glass,
     and bits of glass on the body under it */
  const smashed = (pts, cx, cy, cz, bits) => {
    let o = "";
    const hole = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2,
        k = 0.45 + r() * 0.55;
      hole.push(pts(a, k));
    }
    o += `<path d="M${hole.map(([x, y, z]) => P(x, y, z)).join("L")}Z" fill="#05060c" stroke="#9fd8f0" stroke-width="1.6" stroke-linejoin="round"/>`;
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2,
        [x0, y0, z0] = pts(a, 1),
        [x1, y1_, z1] = pts(a, 1.7 + r() * 0.5);
      o += `<path d="M${P(x0, y0, z0)}L${P(x1, y1_, z1)}" stroke="#9fd8f0" stroke-width="1.4" opacity=".8"/>`;
    }
    for (const [x, y, z] of bits)
      o += `<path d="M${P(x, y, z)}l5 -3l2 4z" fill="#bfe8f8" opacity=".85"/>`;
    return o;
  };
  if (smash === "front" || smash === "both") {
    const fx = (c1 + g1) / 2,
      fy = (y0 + y1) / 2,
      fz = (zr + zt) / 2;
    s += smashed(
      (a, k) => [
        fx + Math.cos(a) * 22 * k,
        fy + Math.sin(a) * 40 * k,
        fz - Math.cos(a) * 10 * k,
      ],
      fx,
      fy,
      fz,
      [
        [g1 + 14, y0 + 40, zt],
        [g1 + 26, y0 + 90, zt],
        [g1 + 18, y1 - 50, zt],
        [g1 + 40, y1 - 30, zt],
      ],
    );
  }
  if (smash === "side" || smash === "both") {
    const sx = (mid + g1) / 2 - 4,
      sz = (zr + zt) / 2 - 2;
    s += smashed(
      (a, k) => [sx + Math.cos(a) * 34 * k, y1 - 6, sz + Math.sin(a) * 16 * k],
      sx,
      y1 - 6,
      sz,
      [
        [sx - 20, y1 + 6, 0],
        [sx + 10, y1 + 10, 0],
        [sx + 34, y1 + 4, 0],
      ],
    );
  }
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
  if (dead) {
    // a dead duck on its hood, its blood running down the front
    const hx = (g1 + w - 8) / 2 + 4,
      hy = (y0 + y1) / 2 + 6;
    s += F`<g transform="translate(0 ${H - zt})">${corpse(dead, Number(X(hx)), hy, 104, !east)}</g>`;
    s += `<path d="M${P(w - 10, y1 - 30, zt)}C${P(w - 6, y1 - 26, zt - 20)} ${P(w - 8, y1 - 28, zt - 30)} ${P(w - 9, y1 - 30, zb + 8)}" stroke="${BLOOD}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
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
/* a road flare lying on its side, its middle at (x, y): a red tube, its cap and its striker end */
export const FLARE_STICK = (x, y) =>
  F`<g transform="translate(${x} ${y}) rotate(-18)"><rect x="-20" y="-5" width="40" height="10" rx="3" fill="#c7282a" ${ln(1.8)}/><rect x="14" y="-5.5" width="8" height="11" rx="2" fill="#1d1e29" ${ln(1.4)}/><path d="M-16 -2H10" stroke="#f7f8f3" stroke-width="2" opacity=".5"/></g>`;
/* the bell in the belfry: its yoke at the top, the bell hanging from it, swung a degrees round its pivot (PIVOT in its
   own box, BELL_BOX) */
/* the bell's swing: its drawing at each of these angles (l4dd.js picks the nearest), BELL_REST hanging still */
export const BELL_ANGLES = [-32, -24, -16, -8, 0, 8, 16, 24, 32],
  BELL_REST = 4;
export const BELL_BOX = [90, 120],
  BELL_PIVOT = [45, 14];
const bellBody = (ax, py, a = 0) =>
  F`<g transform="rotate(${a} ${ax} ${py})"><rect x="${ax - 22}" y="${py - 8}" width="44" height="12" rx="3" fill="#5a3a22" ${ln(1.8)}/><path d="M${ax - 26} ${py + 82}C${ax - 24} ${py + 46} ${ax - 14} ${py + 30} ${ax} ${py + 30}C${ax + 14} ${py + 30} ${ax + 24} ${py + 46} ${ax + 26} ${py + 82}Z" fill="#c9a11e" ${ln(2)}/><path d="M${ax - 4} ${py + 4}V${py + 30}M${ax + 4} ${py + 4}V${py + 30}" stroke="${O}" stroke-width="3"/><path d="M${ax - 30} ${py + 82}H${ax + 30}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${ax - 28} ${py + 82}H${ax + 28}" stroke="#9d7915" stroke-width="3" stroke-linecap="round"/><circle cx="${ax}" cy="${py + 88}" r="6" fill="#9d7915" ${ln(1.4)}/><path d="M${ax - 14} ${py + 48}C${ax - 10} ${py + 40} ${ax - 4} ${py + 38} ${ax} ${py + 38}" stroke="#fcdb4e" stroke-width="3" fill="none"/></g>`;
export function bellSVG({ a = 0 } = {}) {
  const [w, h] = BELL_BOX;
  return wrap(w, h, bellBody(BELL_PIVOT[0], BELL_PIVOT[1], a));
}
/* the bell tower, w × d, h tall: white clapboard, the belfry's arch with the bell in it near the top, its hip roof seen
   from above. bell: false, the arch without its bell (Downpour draws it apart, swinging: bellSVG) */
export function towerSVG({ w = 300, d = 300, h = 520, bell = true } = {}) {
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
  if (bell)
    s += F`<path d="M${ax - 26} ${ay + ah * 0.78}C${ax - 24} ${ay + ah * 0.42} ${ax - 14} ${ay + ah * 0.32} ${ax} ${ay + ah * 0.32}C${ax + 14} ${ay + ah * 0.32} ${ax + 24} ${ay + ah * 0.42} ${ax + 26} ${ay + ah * 0.78}Z" fill="#c9a11e" ${ln(2)}/><circle cx="${ax}" cy="${ay + ah * 0.84}" r="6" fill="#9d7915" ${ln(1.4)}/><path d="M${ax - 14} ${ay + ah * 0.5}C${ax - 10} ${ay + ah * 0.42} ${ax - 4} ${ay + ah * 0.4} ${ax} ${ay + ah * 0.4}" stroke="#fcdb4e" stroke-width="3" fill="none"/>`;
  else
    s += F`<path d="M${ax - aw / 2 + 6} ${ay + ah * 0.18}H${ax + aw / 2 - 6}" stroke="#5a3a22" stroke-width="7"/>`; // (the beam the bell hangs from: the bell itself is its own drawing, bellSVG, so it can swing)
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
/* a hole broken through the gas station's flat roof, in its box x, y, w × d (the owner's, Nov 17 12:28Z). Since the
   owner's Nov 19 22:41Z it is open, not a black mouth: "make those transparent ... where you can see into the first floor
   of the ground level". holeShape: its ragged edge, as a path (stationmap.js roofHoleShape: a duck falls through
   exactly that); roofHole: what's drawn round it, over the roof (the roof
   itself is cut there: roofSVG's mask), so through it shows what's under the roof, the floor and what stands on it.
   corner "sw": a bite out of the roof's south-west corner instead (over the restroom's smashed west wall: the
   owner's, Nov 19 22:41Z, "break a little bit of the corner of the roof ... and make that ... transparent"), open to
   the roof's west and south edges */
const SLAB = 16; // (the roof's thickness, as seen down its broken edge)
const pathOf = (p, dy = 0) =>
  "M" + p.map(([u, v]) => n1(u) + " " + n1(v + dy)).join("L") + "Z";
/* the roof's broken edge as a ledge, made as pixels (P world px each): under every edge of the cut that looks south,
   the slab's own thickness (its broken face, LEDGE deep, its bottom ragged), solid, the way the broken wall's courses
   show theirs (the owner's, Nov 20 16:57Z: "with it's hieght showing in it's solid since it is also 3d"). Its top
   lip the roof's grey, the concrete under it darker going down, the ink round it. roofW × roofD: the roof's drawing
   (its sign's band, the roof's front, its bottom 70: that is already its face, so a ledge only hangs from its top);
   P: one of the world's pixels, in the roof's own numbers */
const LEDGE = 20; // (a thin slab: a few pixels deep, so a long edge never hangs down like a curtain: Joseph's critique, Nov 20 19:03Z)
function ledgeOf(cut, roofW, roofD, seed, P) {
  const r = rnd(seed + 7),
    by = roofD - 70,
    xs = cut.map((v) => v[0]),
    ys = cut.map((v) => v[1]),
    i0 = Math.max(1, Math.floor(Math.min(...xs) / P)),
    i1 = Math.min(Math.floor(roofW / P) - 1, Math.ceil(Math.max(...xs) / P)),
    j0 = Math.max(1, Math.floor(Math.min(...ys) / P) - 1),
    j1 = Math.min(Math.floor(roofD / P), Math.ceil(Math.max(...ys) / P));
  const inCut = (i, j) => {
    const px = (i + 0.5) * P,
      py = (j + 0.5) * P;
    let c = false;
    for (let a = 0, b = cut.length - 1; a < cut.length; b = a++) {
      const [ax, ay] = cut[a],
        [bx, bz] = cut[b];
      if (ay > py !== bz > py && px < ((bx - ax) * (py - ay)) / (bz - ay) + ax)
        c = !c;
    }
    return c;
  };
  const face = new Map(), // ("i,j": how many pixels down the face, from its top)
    deep = new Map(),
    K0 = Math.round(LEDGE / P);
  let run = K0;
  for (let i = i0; i < i1; i++) {
    if (i === i0 || r() < 0.2) run = K0 - 1 + Math.round(r() * 2);
    const k0 = run; // (its bottom broken in short runs, a crisp line, never a fringe)
    deep.set(i, k0);
    let last = -1e9;
    for (let j = j0; j < j1; j++) {
      if (!inCut(i, j)) {
        last = (j + 1) * P <= by ? j : -1e9; // (the roof's top: a ledge hangs from it; the band is a face already)
        continue;
      }
      const k = j - last;
      if (k <= k0) face.set(i + "," + j, k);
    }
  }
  let s = "";
  const q = (v) => Math.round(v * 1000) / 1000;
  for (const [key, k] of face) {
    const [i, j] = key.split(",").map(Number),
      k0 = deep.get(i),
      side = [-1, 1].some(
        (di) => !face.has(i + di + "," + j) && inCut(i + di, j),
      ),
      c =
        k >= k0 || side
          ? O
          : k <= 1
            ? "#849097"
            : k < k0 * 0.5
              ? "#414d59"
              : "#353636"; // (darker than the floor it hangs over, so it stands out solid)
    s += R(q(i * P), q(j * P), q(P), q(P), c);
  }
  return s;
}
function roofHole(
  x,
  y,
  w,
  d,
  seed,
  corner = "",
  cap = 0,
  roofW = 0,
  roofD = 0,
  px = 2,
) {
  const r = rnd(seed + 101),
    cut = holeShape(x, y, w, d, seed, corner, cap),
    id = uid(),
    cx = x + w / 2,
    cy = y + d / 2;
  /* the cracked concrete round it: a ring of broken slab, wider than the cut (a round hole), along the bite's edge (the
     corner) */
  const ring = corner
    ? cut.map(([u, v], i) =>
        i === 0 || i >= cut.length - 2 || v > roofD - 74
          ? [u, v]
          : [u + 10 + r() * 8, v - 6 - r() * 6],
      ) // (none over the band: it's the roof's front, not its top)
    : cut.map(([u, v]) => [
        cx + (u - cx) * (1.16 + r() * 0.06),
        cy + (v - cy) * (1.16 + r() * 0.06),
      ]);
  let s =
    F`<path d="${pathOf(ring)}${pathOf(cut)}" fill="#565d77" fill-rule="evenodd"/>` +
    F`<path d="${pathOf(ring)}" fill="none" stroke="#414d59" stroke-width="2" stroke-dasharray="9 7"/>`;
  /* the slab's broken edge, seen down the far (north) side of the hole: its thickness, then nothing (what's under the
     roof shows); the corner's, a ledge, solid (ledgeOf) */
  s +=
    (corner
      ? ledgeOf(cut, roofW, roofD, seed, px)
      : F`<clipPath id="${id}"><path d="${pathOf(cut)}"/></clipPath>` +
        F`<g clip-path="url(#${id})"><path d="${pathOf(cut)}${pathOf(cut, SLAB)}" fill="#414d59" fill-rule="evenodd"/><path d="${pathOf(cut, SLAB * 0.45)}" fill="none" stroke="#353636" stroke-width="2"/></g>`) +
    F`<path d="${pathOf(cut)}" fill="none" stroke="#353636" stroke-width="2.4" stroke-linejoin="round"/>`; // (soft, as its cracks: Joseph's critique, Nov 20)
  /* the band's torn end (the corner's): a strip of it bent down over the gap, and faint cracks running back along it
     from the tear, a shade under its red */
  if (corner) {
    const bx = cut[cut.length - 8][0],
      by = roofD - 70;
    s +=
      F`<path d="M${n1(bx + 2)} ${by + 38}L${n1(bx - 20)} ${by + 50}L${n1(bx - 24)} ${by + 64}L${n1(bx - 14)} ${by + 66}L${n1(bx - 8)} ${by + 56}L${n1(bx + 4)} ${by + 52}Z" fill="#c7282a" ${ln(2)}/>` +
      F`<path d="M${n1(bx - 20)} ${by + 50}L${n1(bx - 24)} ${by + 64}L${n1(bx - 14)} ${by + 66}" fill="none" stroke="#820a17" stroke-width="3"/>`;
    for (const [dy, l] of [
      [10, 34],
      [46, 26],
    ])
      s += F`<path d="M${n1(bx + 8)} ${by + dy}l${n1(l * 0.5)} ${n1(2 + r() * 3)}l${n1(l * 0.5)} ${n1(-2 - r() * 3)}" fill="none" stroke="#99163b" stroke-width="2"/>`;
  }
  /* rebar: rusty rods sticking out over the hole from its edge, a few bent down; none over the restroom's corner, where
     it broke with the brick wall under it (Joseph's critique, Nov 20: "Brick walls have no rebar") */
  for (let i = 0; i < (corner ? 0 : 5); i++) {
    const [x0, y0] = cut[1 + Math.floor(r() * (cut.length - 3))],
      tx = corner ? x : cx,
      ty = corner ? y + d : cy,
      k = 0.12 + r() * 0.16,
      x1 = x0 + (tx - x0) * k,
      y1 = y0 + (ty - y0) * k + 6 + r() * 10;
    s += F`<path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" stroke="#9a5a2c" stroke-width="3" stroke-linecap="round"/>`;
  }
  /* cracks running out over the roof from its edge (soft: a shade under the roof, never black: the owner's, Nov 19
     23:41Z, "Soft, faint cracks, not harsh, black contrast cracks"), and chunks of the slab lying on it */
  for (let i = 0; i < 6; i++) {
    const [x0, y0] = ring[1 + Math.floor(r() * (ring.length - 3))],
      a = Math.atan2(y0 - (corner ? y + d : cy), x0 - (corner ? x : cx)),
      l = 20 + r() * 40;
    s += F`<path d="M${n1(x0)} ${n1(y0)}l${n1(Math.cos(a) * l)} ${n1(Math.sin(a) * l + (r() - 0.5) * 14)}l${n1(Math.cos(a + 0.6) * l * 0.5)} ${n1(Math.sin(a + 0.6) * l * 0.5)}" fill="none" stroke="#414d59" stroke-width="2" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 9; i++) {
    const [u, v] = ring[1 + Math.floor(r() * (ring.length - 3))],
      a = Math.atan2(v - (corner ? y + d : cy), u - (corner ? x : cx)),
      f = 8 + r() * 26,
      bx = u + Math.cos(a) * f,
      by = v + Math.sin(a) * f,
      z = 6 + r() * 8;
    s += F`<path d="M${n1(bx - z)} ${n1(by)}L${n1(bx - z * 0.3)} ${n1(by - z * 0.8)}L${n1(bx + z)} ${n1(by - z * 0.3)}L${n1(bx + z * 0.6)} ${n1(by + z * 0.5)}Z" fill="${r() < 0.5 ? "#849097" : "#565d77"}" ${ln(1.6)}/><path d="M${n1(bx - z)} ${n1(by)}L${n1(bx + z * 0.6)} ${n1(by + z * 0.5)}L${n1(bx + z * 0.6)} ${n1(by + z * 0.5 + 4)}L${n1(bx - z)} ${n1(by + 4)}Z" fill="#353636" ${ln(1.6)}/>`;
  }
  return s;
}
/* the ladder up the gas station's back wall (stationmap.js LADDER), w wide and h tall from the ground, plus the rails'
   hoops curling over the roof's edge at its top (TOP px over the roof) */
export const LADDER_TOP = 46;
export function ladderSVG({ w = 80, h = 340 }) {
  const rail = 9,
    l = 6,
    r = w - 6 - rail,
    top = 8;
  let s = "";
  /* the rungs, every 34 px, under the rails */
  for (let y = h - 26; y > top + LADDER_TOP; y -= 34)
    s += R(l + rail - 2, y, r - l - rail + 4, 7, "#849097", ln(2));
  /* the two rails up the wall, and their hoops over the roof's edge (a grab at the top) */
  for (const x of [l, r])
    s +=
      F`<path d="M${x + rail / 2} ${h - 2}V${top + 18}Q${x + rail / 2} ${top} ${x + rail / 2 + (x === l ? -14 : 14)} ${top + 6}" fill="none" stroke="${O}" stroke-width="${rail + 5}" stroke-linecap="round"/>` +
      F`<path d="M${x + rail / 2} ${h - 2}V${top + 18}Q${x + rail / 2} ${top} ${x + rail / 2 + (x === l ? -14 : 14)} ${top + 6}" fill="none" stroke="#a9b3b8" stroke-width="${rail}" stroke-linecap="round"/>` +
      R(x + 1, top + 18, 3, h - top - 24, "#d6dde0"); // (the light down its front edge)
  /* rust, and its feet bolted to the ground */
  s +=
    R(l - 2, h - 8, rail + 4, 8, "#565d77", ln(2)) +
    R(r - 2, h - 8, rail + 4, 8, "#565d77", ln(2)) +
    F`<path d="M${l + 3} ${h * 0.55}v26M${r + 5} ${h * 0.3}v18" stroke="#9a5a2c" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
  return wrap(w, h, s);
}
/* the ladder leaning on the canopy over the pumps from its west side (stationmap.js PUMP_LADDER; the owner's, Nov 19
   20:44Z: its own picture, not the wall ladder's). Seen from the south and above as everything is: its two rails go
   up from its feet on the ground, LEAN west of the canopy's edge, to the edge at the canopy's height z, one behind the
   other (the ladder's width runs north to south, d); its rungs join them, so each is a short upright bar; the rails'
   hoops curl over onto the roof. w: the box's width (LEAN + 6 + the hoops' 34), d: the ladder's width, h: the box's
   height over the ground (z + 50). only: "body" (the rails and the rungs) or "hoops" (drawn over the canopy's roof) */
export function leanLadderSVG({
  w = 107,
  d = 80,
  h = 200,
  z = 150,
  only = "body",
}) {
  const lean = w - 40,
    rail = 11,
    foot = 6,
    at = (X, Y, Z) => [X, Y + h - Z], // (a point of the ladder in the box: X east of its west side, Y south of its north side, Z up)
    rails = [4, d - 4]; // (the back rail and the front one)
  const railD = (Y, top) => {
    const [x0, y0] = at(foot, Y, 0),
      [x1, y1] = at(foot + lean, Y, z);
    return top
      ? F`M${x1} ${y1}L${x1 + 4} ${y1 - 26}Q${x1 + 8} ${y1 - 40} ${x1 + 20} ${y1 - 32}L${x1 + 28} ${y1 - 24}`
      : F`M${x0} ${y0}L${x1} ${y1}`;
  };
  const stroke = (dd, c = "#a9b3b8") =>
    F`<path d="${dd}" fill="none" stroke="${O}" stroke-width="${rail + 6}" stroke-linecap="round" stroke-linejoin="round"/>` +
    F`<path d="${dd}" fill="none" stroke="${c}" stroke-width="${rail}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let s = "";
  if (only === "hoops") {
    for (const Y of rails) s += stroke(railD(Y, true));
    return wrap(w, d + h, s);
  }
  /* the back rail, the rungs every 30 up (each an upright bar between the rails), then the front rail over their ends */
  s += stroke(railD(rails[0]), "#8f999e");
  for (let Z = 24; Z < z - 8; Z += 30) {
    const X = foot + (lean * Z) / z,
      [, yb] = at(X, rails[0], Z),
      [, yf] = at(X, rails[1], Z);
    s +=
      R(X - 4.5, yb, 9, yf - yb, "#849097", ln(3)) +
      R(X - 2.4, yb + 3, 2.4, yf - yb - 6, "#c2cbcf");
  }
  s += stroke(railD(rails[1]));
  /* the light along the front rail, its rubber feet, a little rust */
  const [fx0, fy0] = at(foot, rails[1], 0),
    [fx1, fy1] = at(foot + lean, rails[1], z);
  s +=
    F`<path d="M${fx0 + 2.6} ${fy0 - 8}L${fx1 + 2.6} ${fy1 + 6}" stroke="#d6dde0" stroke-width="3" stroke-linecap="round"/>` +
    rails
      .map((Y) => {
        const [x, y] = at(foot, Y, 0);
        return R(x - 8, y - 5, 16, 9, "#2b2d33", ln(2.4));
      })
      .join("") +
    F`<path d="M${foot + lean * 0.3} ${fy0 - z * 0.3 - 2}l${lean * 0.06} ${-z * 0.06}M${foot + lean * 0.7} ${fy0 - z * 0.7 - 2}l${lean * 0.04} ${-z * 0.04}" stroke="#9a5a2c" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
  return wrap(w, d + h, s);
}
export function roofSVG({
  w,
  d,
  kind = "gs",
  soldier = null,
  holes = null,
  px = 2, // (one of the world's pixels, in its own numbers)
}) {
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
    /* the holes broken through it ([x, y, w, d, corner] on the roof: stationmap.js ROOF_HOLES, a duck falls through
       them): the roof cut away there (a mask), so what's under it shows, then each one's broken edge over it */
    const hs = (holes || []).map(([hx, hy, hw, hd, corner, cap], i) => [
      hx,
      hy,
      hw,
      hd,
      holeSeed(i),
      corner || "",
      cap || 0,
    ]);
    if (hs.length)
      s =
        F`<mask id="${id}m" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${w + 40}" height="${d + 40}"><rect x="-20" y="-20" width="${w + 40}" height="${d + 40}" fill="#fff"/>${hs.map((h) => F`<path d="${pathOf(holeShape(...h))}" fill="#000"/>`).join("")}</mask>` +
        F`<g mask="url(#${id}m)">${s}</g>`;
    for (const h of hs) s += roofHole(...h, w, d, px);
    /* the dead soldier up here, [x, y] on the roof, and his flare beside him (it burns at each round's start:
       l4dd.js flare) */
    if (soldier) {
      const [sx, sy] = soldier;
      s += corpse("soldier", sx, sy, 108);
      s += FLARE_STICK(sx + 92, sy + 18);
    }
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
