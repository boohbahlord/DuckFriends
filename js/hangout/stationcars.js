/* ---------- Downpour's drawings: the cars, the corpses and the chapel ----------
   Moved out of stationart.js to keep that file small (a pure move; the owner's, Nov 22). */
import { duckSVG, DUCK_DEFAULT } from "../duck.js";

import { hitsOf } from "../wounds.js";

import { zombieLook } from "../l4ddrules.js";

import { rnd } from "./stationmap.js";

import { CAR_TOP } from "./vehicles.js";

import { DP_WATER, DP_WATER_A } from "./dpground.js";

import {
  F,
  O,
  R,
  SKINS,
  box3,
  dirt,
  ln,
  n1,
  shine,
  uid,
  wrap,
} from "./stationbase.js";

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
   lying on its hood (corpse above). sunk: how deep it stands in the flood, the water over its wheels that far up (the
   owner's, Nov 28 04:58Z: "that car should be as submerged as its depth") */
export function carSVG({
  w = 420,
  d = 200,
  h = CAR_TOP.h,
  seed = 1,
  east = true,
  hood = false,
  up = 0,
  smash = "",
  dead = "",
  sunk = 0,
} = {}) {
  const r = rnd(seed * 97 + 11),
    [c, cd] = hood
      ? ["#a24337", "#89132c"]
      : CAR_COLORS[seed % CAR_COLORS.length],
    H = h + up,
    T = CAR_TOP, // (its top's shape: the same numbers the floor on it walks, vehicles.js carDeck)
    y0 = T.side, // (its sides, north and south)
    y1 = d - T.side,
    zb = 22, // (the body's foot over the road)
    zt = T.waist, // (its waist: the hood and the trunk)
    zr = h - T.below, // (its roof)
    [c0, c1] = T.roof, // (the roof, back to front)
    [g0, g1] = T.glass, // (the glass reaches down to the waist here, back and front)
    inset = T.inset; // (the roof is narrower than the body)
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
  for (const x of [w * 0.2, w * 0.79]) {
    s += F`<ellipse cx="${X(x)}" cy="${y1 - 14 + H}" rx="30" ry="24" fill="#111417" ${ln(2.4)}/><ellipse cx="${X(x)}" cy="${y1 - 14 + H}" rx="13" ry="11" fill="#849097" ${ln(1.6)}/>`;
    if (sunk > 0) {
      const v = Math.min(sunk, 24) - 24, // (the water's top on it, from its middle: it touches the road at its bottom)
        u = 30 * Math.sqrt(1 - (v / 24) ** 2);
      s += F`<path d="M${X(x) - u} ${y1 - v - 14 + H}A30 24 0 0 0 ${X(x) + u} ${y1 - v - 14 + H}Z" fill="${DP_WATER}" opacity="${DP_WATER_A}"/>`;
    }
  }
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
  const id = uid();
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
