/* ---------- Downpour's drawings: the gas station's walls, shelves, pumps, canopy, generator, fences ----------
   Moved out of stationart.js to keep that file small (a pure move; the owner's, Nov 22). */
import { rnd, brokenRows, joint } from "./stationmap.js";

import {
  F,
  O,
  R,
  SKINS,
  box3,
  dirt,
  glassGrad,
  ln,
  n1,
  shine,
  shopGlass,
  uid,
  wrap,
} from "./stationbase.js";

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
/* where two fences meet at a corner of the map (the owner's, Nov 28 04:58Z: "The corner of the fences are supposed to
   join together"): the north-south fence's end leans out (fenceLean), the east-west one stands straight, so between their
   end posts a gap opened at the top. This fills it: chain-link in the triangle between the straight post and the leaning
   one, the top rail and the barbed wire across. Drawn into (lean + 8) × (h + d); the corner's foot at x 4 (dir 1) or
   lean + 4 (dir -1), at y h + d / 2, as fenceXSVG's */
export function fenceCornerSVG({ d = 12, h = 200, lean = 54, dir = 1 } = {}) {
  const id = uid(),
    C = 14,
    W = lean + 8,
    fx = dir > 0 ? 4 : W - 4,
    tx = fx + dir * lean,
    top = d / 2,
    foot = h + d / 2;
  const defs =
    F`<pattern id="${id}" width="${C}" height="${C}" patternUnits="userSpaceOnUse"><path d="M0 ${C / 2}L${C / 2} 0L${C} ${C / 2}L${C / 2} ${C}Z" fill="none" stroke="#1c1c28" stroke-width="3.6" opacity=".5"/><path d="M0 ${C / 2}L${C / 2} 0L${C} ${C / 2}L${C / 2} ${C}Z" fill="none" stroke="#b9c3c8" stroke-width="1.8"/></pattern>` +
    F`<clipPath id="${id}c"><path d="M${fx} ${foot}L${fx} ${top}L${tx} ${top}Z"/></clipPath>`;
  let s = F`<rect x="0" y="0" width="${W}" height="${foot}" fill="url(#${id})" clip-path="url(#${id}c)"/>`;
  s += F`<path d="M${fx} ${top + 4}H${tx}" stroke="${O}" stroke-width="6.4"/><path d="M${fx} ${top + 4}H${tx}" stroke="#d6dde0" stroke-width="3.4"/>`;
  let z = `M${fx} ${top}`;
  for (let u = 7, k = 1; u <= lean; u += 7, k = -k)
    z += `L${n1(fx + dir * u)} ${n1(top + k * 4)}`;
  s += `<path d="${z}" fill="none" stroke="${O}" stroke-width="3.6" stroke-linejoin="round"/><path d="${z}" fill="none" stroke="#d6dde0" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += F`<path d="M${fx} ${top}V${foot}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${fx} ${top}V${foot}" stroke="#9aa6ad" stroke-width="3.6" stroke-linecap="round"/>`;
  return wrap(W, h + d, s, defs);
}
/* how far a fence's top leans, and which way: out, away from the middle of the map, mapW wide. Its drawing (shapes.js),
   the flashlights and a zombie climbing it (l4dd.js) all ask. 0.36 of its height: the lean it has been drawn with since
   the map went to 60% */
export const fenceLean = (p, mapW) => (p.x < mapW / 2 ? -1 : 1) * p.h * 0.36;
