/* ---------- Downpour's drawings: the roofs, their holes and the ladders ----------
   Moved out of stationart.js to keep that file small (a pure move; the owner's, Nov 22). */
import { rnd, holeSeed, roofHoleShape as holeShape } from "./stationmap.js";

import { F, O, R, ln, n1, uid, wrap } from "./stationbase.js";

import { FLARE_STICK, corpse } from "./stationcars.js";

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
