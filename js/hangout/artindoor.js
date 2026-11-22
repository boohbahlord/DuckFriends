/* ---------- the cabin's inside: furniture, stage, kitchen, bathroom, beds ----------
   Moved out of art.js to keep that file small (a pure move; the owner's, Nov 22). */
import { mix } from "../duck.js";

import {
  BULB_OFF,
  F,
  O,
  R,
  glowDef,
  ln,
  n1,
  pair,
  rnd,
  shade,
  uid,
  wrap,
} from "./artbase.js";

/* a couch: seats 3 or 2 (cushions visible), facing 'n' (its back toward the viewer; the cabin's couches face the
   fireplace) or 's'. Footprint w × 110; box w × 174. back: the seat and cushions, foot y = 64 (the footprint's north
   edge); front: the backrest (or the seat's front) and the arms, foot y = h. A duck sits on cushion i at
   x = 30 + (i + .5) × (w − 60) / seats, depth .55 of the couch, 30 high. facing 'e': turned to face east, len long down
   the screen and w across (footprint w × len; box w × (len + 64)): the backrest along its west side, an arm at each
   end, seen from above; back: the seat, its cushions and the north arm, foot y = 64; front: the backrest and the south
   arm, foot y = h. A duck sits on
   cushion i at x = 62, y = 26 + (i + .5) × (len − 52) / seats, 32 high. */
export function couch({
  w = 500,
  h = 174,
  seats = 3,
  color = "#a8382c",
  facing = "n",
  throwOn = true,
  len = 360,
} = {}) {
  if (facing === "e" || facing === "w")
    return sideCouch({ w, len, seats, color, flip: facing === "w" });
  const Y = h - 110,
    arm = 30,
    cw = (w - 2 * arm) / seats,
    hi = mix(color, 255, 0.2),
    lo = mix(color, 0, 0.3),
    lo2 = mix(color, 0, 0.45);
  const cushions = (y0, y1) =>
    Array.from({ length: seats }, (_, i) => {
      const x = arm + i * cw + 3;
      return (
        R(x, y0, cw - 6, y1 - y0, hi, `rx="12" ${ln(2.4)}`) +
        R(
          x + 8,
          y0 + 5,
          cw - 22,
          (y1 - y0) * 0.25,
          "#fff",
          'rx="6" opacity=".14"',
        ) +
        F`<circle cx="${x + cw / 2 - 3}" cy="${(y0 + y1) / 2 + 4}" r="2.2" fill="${lo2}"/>`
      );
    }).join("");
  const arms = [0, w - arm]
    .map(
      (x) =>
        R(x, Y - 44, arm, 110, color, `rx="12" ${ln(2.4)}`) +
        R(x + 5, Y - 40, 8, 100, "#fff", 'rx="4" opacity=".12"'),
    )
    .join("");
  const feet = [8, w - 20]
    .map((x) => R(x, h - 7, 12, 7, "#3b2414", ln(1.6)))
    .join("");
  let back, front;
  if (facing === "s") {
    back =
      shade(w / 2, Y + 60, w / 2, 50, 0.25) +
      R(arm - 4, Y - 64, w - 2 * arm + 8, 35, color, `rx="10" ${ln(2.4)}`) +
      R(arm - 4, Y - 29, w - 2 * arm + 8, 40, lo, ln(2.4)) +
      Array.from({ length: seats }, (_, i) =>
        R(arm + i * cw + 6, Y - 40, cw - 12, 46, hi, `rx="14" ${ln(2.2)}`),
      ).join("") +
      R(arm, Y + 5, w - 2 * arm, 75, lo, ln(2.4)) +
      cushions(Y + 6, Y + 80);
    front =
      R(0, Y + 66, w, 44, lo, `rx="6" ${ln(2.4)}`) +
      R(arm, Y + 80, w - 2 * arm, 30, lo, ln(2.4)) +
      F`<path d="M${arm + 6} ${Y + 88}H${w - arm - 6}" stroke="${lo2}" stroke-width="2" stroke-dasharray="6 5"/>` +
      arms +
      feet;
  } else {
    back =
      shade(w / 2, Y + 60, w / 2, 50, 0.25) +
      R(arm, Y - 30, w - 2 * arm, 76, lo, ln(2.4)) +
      cushions(Y - 28, Y + 44);
    front =
      R(0, Y + 46, w, 64, lo, `rx="6" ${ln(2.4)}`) +
      F`<path d="M${arm + 6} ${Y + 56}H${w - arm - 6}" stroke="${lo2}" stroke-width="2" stroke-dasharray="6 5"/>` +
      R(arm - 2, Y + 11, w - 2 * arm + 4, 35, color, `rx="12" ${ln(2.4)}`) +
      R(arm + 10, Y + 15, w - 2 * arm - 20, 8, "#fff", 'rx="4" opacity=".14"');
    if (throwOn) {
      const tx = w - arm - 110;
      front += F`<path d="M${tx} ${Y + 9}h76v${88}l-10 6l-10 -6l-10 6l-10 -6l-10 6l-10 -6l-10 6l-6 -6Z" fill="#e8c35a" ${ln(2.2)}/><path d="M${tx + 18} ${Y + 9}v88M${tx + 50} ${Y + 9}v90M${tx} ${Y + 34}h76M${tx} ${Y + 70}h76" stroke="#3d6f8c" stroke-width="5" opacity=".75"/>`;
    }
    front += arms + feet;
  }
  return pair(w, h, [back], [front], Y, h);
}

function sideCouch({
  w = 100,
  len = 360,
  seats = 2,
  color = "#3d6e4f",
  flip = false,
}) {
  const U = 64,
    h = len + U,
    Y = h - len,
    hi = mix(color, 255, 0.2),
    lo = mix(color, 0, 0.3),
    lo2 = mix(color, 0, 0.45),
    arm = 26,
    bw = 28,
    AH = 46,
    SH = 32;
  const top = (x0, x1, y0, y1, z, fill, more = "") =>
    R(x0, y0 - z, x1 - x0, y1 - y0, fill, more); // a top face at height z (footprint y0 … y1)
  /* back: the shadow, the seat and its cushions, the north arm; front: the backrest (it runs the whole length, so its
     south end is at the front) and the south arm */
  let back =
    shade(w / 2, h - 6, w / 2 + 6, 16, 0.25) +
    top(bw, w, Y, h, SH, lo, ln(2.4));
  const cl = (len - 2 * arm) / seats;
  for (let i = 0; i < seats; i++) {
    const y0 = Y + arm + i * cl + 3,
      y1 = y0 + cl - 6;
    back +=
      top(bw + 4, w - 4, y0, y1, SH, hi, `rx="12" ${ln(2.4)}`) +
      top(bw + 9, w - 9, y0 + 4, y0 + 10, SH, "#fff", 'rx="3" opacity=".14"') +
      F`<circle cx="${(bw + w) / 2}" cy="${(y0 + y1) / 2 - SH}" r="2.2" fill="${lo2}"/>`;
  }
  back +=
    top(bw, w, Y, Y + arm, AH, color, `rx="10" ${ln(2.4)}`) +
    top(bw + 6, w - 6, Y + 4, Y + 9, AH, "#fff", 'rx="2" opacity=".12"');
  const front =
    top(0, bw, Y, h, U, color, `rx="8" ${ln(2.4)}`) +
    top(5, 12, Y + 6, h - 6, U, "#fff", 'rx="3" opacity=".12"') +
    R(0, h - U, bw, U, lo, ln(2.4)) +
    top(bw, w, h - arm, h, AH, color, `rx="10" ${ln(2.4)}`) +
    top(
      bw + 6,
      w - 6,
      h - arm + 4,
      h - arm + 9,
      AH,
      "#fff",
      'rx="2" opacity=".12"',
    ) +
    R(bw, h - AH, w - bw, AH, lo, ln(2.4)) +
    F`<path d="M${bw + 6} ${h - 30}H${w - 8}" stroke="${lo2}" stroke-width="2" stroke-dasharray="6 5"/>` +
    [6, w - 18].map((x) => R(x, h - 7, 12, 7, "#3b2414", ln(1.6))).join("");
  const turn = (b) =>
    flip ? F`<g transform="translate(${w} 0) scale(-1 1)">${b}</g>` : b; // (facing west: the same couch, mirrored)
  return pair(w, h, [turn(back)], [turn(front)], Y, h);
}

/* ---------- the living corner and the rest of the great room ---------- */
/* a low coffee table on the rug, seen from above: its top (footprint w × d) at z, the apron and two front legs under it;
   I want its shadow to fill the whole footprint under the top, so the rug darkens all the way under it with no cut;
   papers, a magazine, a mug of cocoa, a glass of juice and a can of soda on it. Box w × (d + z). Foot: y = h. */
export function coffeeTable({ w = 150, d = 100, z = 38 } = {}) {
  const h = d + z;
  const paper = (x, y, a, c = "#f6f3ea") =>
    F`<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-17" y="-12" width="34" height="24" fill="${c}" ${ln(1.6)}/><path d="M-12 -6h22M-12 -1h18M-12 4h20" stroke="#9aa0aa" stroke-width="1.4"/></g>`;
  const cup = (x, y, top, side, k = 1) =>
    F`<rect x="${x - 7 * k}" y="${y - 12 * k}" width="${14 * k}" height="${12 * k}" fill="${side}" ${ln(1.6)}/><ellipse cx="${x}" cy="${y - 12 * k}" rx="${7 * k}" ry="${3.4 * k}" fill="${top}" ${ln(1.4)}/>`;
  return wrap(
    w,
    h,
    R(2, z + 2, w - 4, d - 2, "#000", 'rx="14" opacity=".34"') +
      R(10, d + 2, w - 20, 12, "#000", 'opacity=".16"') +
      R(10, d + 4, 10, z - 6, "#6e3a1a", ln(1.8)) +
      R(w - 20, d + 4, 10, z - 6, "#6e3a1a", ln(1.8)) +
      R(4, d - 2, w - 8, 12, "#8a4a22", ln(2)) +
      R(0, 0, w, d, "#b8743e", `rx="8" ${ln(2.6)}`) +
      R(7, 7, w - 14, d - 14, "#c98a52", `rx="5"`) +
      F`<path d="M12 ${d * 0.36}H${w - 12}M12 ${d * 0.68}H${w - 12}" stroke="#a8683a" stroke-width="1.6"/>` +
      paper(w * 0.27, d * 0.38, -9) +
      paper(w * 0.33, d * 0.55, 7) +
      paper(w * 0.62, d * 0.7, -4, "#7fb7d8") +
      F`<path d="M${w * 0.62 - 10} ${d * 0.7 - 4}h20" stroke="#fff" stroke-width="3" opacity=".7"/>` +
      F`<path d="M${w * 0.8 + 7} ${d * 0.33 - 8}q7 1 0 8" stroke="${O}" stroke-width="4" fill="none"/><path d="M${w * 0.8 + 7} ${d * 0.33 - 8}q7 1 0 8" stroke="#e8e2d0" stroke-width="2" fill="none"/>` +
      cup(w * 0.8, d * 0.33, "#6b3a1f", "#e8e2d0") +
      cup(w * 0.58, d * 0.32, "#ffb347", "#ffe2b0aa", 0.9) +
      cup(w * 0.86, d * 0.66, "#c9ced6", "#d23b33", 0.8) +
      F`<path d="M${w * 0.86 - 4} ${d * 0.66 - 8}h7" stroke="#fff" stroke-width="2" opacity=".8"/>`,
    "hg-coffee",
  );
}
/* the end table in the couches' corner: a little square table with a drawer and a lamp on it. Box w × h; its top at
   height 50. Foot: y = h. */
export function endTable({ w = 76, h = 170 } = {}) {
  const id = uid(),
    Y = h - 50,
    cx = w / 2,
    d = 56,
    t = Y - d;
  return wrap(
    w,
    h,
    F`<circle cx="${cx}" cy="${t - 30}" r="${w * 0.9}" fill="url(#${id})"/>` +
      shade(cx, h - 3, w / 2, 6, 0.3) +
      R(6, Y, 8, 50, "#6e3a1a", ln(1.8)) +
      R(w - 14, Y, 8, 50, "#6e3a1a", ln(1.8)) +
      R(2, Y - 2, w - 4, 22, "#9a5526", ln(2.2)) +
      R(0, t, w, d, "#c47a3e", `rx="5" ${ln(2.4)}`) +
      R(5, t + 5, w - 10, d - 10, "#d08a4a", 'rx="3"') +
      F`<ellipse cx="${cx}" cy="${t + d * 0.55}" rx="13" ry="5" fill="#3e6d8c" ${ln(1.6)}/><path d="M${cx} ${t + d * 0.55}v-26" stroke="${O}" stroke-width="3.4"/><path d="M${cx - 17} ${t + d * 0.55 - 26}h34l-8 -28h-18Z" fill="#ffcf73" ${ln(2.2)}/><path d="M${cx - 11} ${t + d * 0.55 - 28}h7l-3 -22h-2Z" fill="#fff0c2" opacity=".85"/>` +
      F`<ellipse cx="${w * 0.22}" cy="${t + d * 0.7}" rx="8" ry="3.5" fill="#e8e2d0" ${ln(1.2)}/>`,
    "hg-endtable",
    glowDef(id, "#ffb347", 0.5),
  );
}
/* the TV: a small box television like the ones everybody had in the 90s (a deep dark plastic box, the picture tube's
   back behind it, two knobs and a speaker beside the screen, rabbit ears on top) on a low wooden stand, the whole turned
   45° to face the couches' corner. s runs along the stand (north-east), t across it (south-east, the screen's side), z
   up; the stand's middle stands on the floor at (70, 178) in the box. Box 140 × 240. Foot: y = h. TV_SCREEN: the screen
   on the front, where tv.js shows the channels (tvScreen: where it is in the box). */
const TVK = Math.SQRT1_2,
  TVC = [70, 62],
  TVTOP = 116;
const tvPt = (s, t, z) => [
  TVC[0] + (s + t) * TVK,
  TVC[1] + (t - s) * TVK + TVTOP - z,
];
export const TV_SCREEN = { s0: -33, s1: 19, t: 14, z0: 44, z1: 84 };
/* the screen's top-left corner in the TV's box and its size (along the front, up) */
export function tvScreen() {
  const S = TV_SCREEN,
    [x, y] = tvPt(S.s0, S.t, S.z1);
  return { x, y, w: S.s1 - S.s0, h: S.z1 - S.z0 };
}
export function tvSet() {
  const w = 140,
    h = 240,
    id = uid(),
    pt = (s, t, z) => tvPt(s, t, z).map(n1).join(" ");
  const quad = (a, b, c2, d2) => `M${a}L${b}L${c2}L${d2}Z`;
  const box = (s0, s1, t0, t1, z0, z1, top_, sw, se, lw = 2.4) =>
    F`<path d="${quad(pt(s0, t0, z0), pt(s0, t1, z0), pt(s0, t1, z1), pt(s0, t0, z1))}" fill="${sw}" ${ln(lw)}/>` +
    F`<path d="${quad(pt(s0, t1, z0), pt(s1, t1, z0), pt(s1, t1, z1), pt(s0, t1, z1))}" fill="${se}" ${ln(lw)}/>` +
    F`<path d="${quad(pt(s0, t0, z1), pt(s1, t0, z1), pt(s1, t1, z1), pt(s0, t1, z1))}" fill="${top_}" ${ln(lw)}/>`;
  const front = (t, inner) => {
    const [x, y] = tvPt(0, t, 0);
    return F`<g transform="matrix(${TVK} ${-TVK} 0 -1 ${x} ${y})">${inner}</g>`;
  }; // (drawn flat on the face at t: x along it, y up)
  const HS = 34,
    Z1 = HS + 58,
    S = TV_SCREEN,
    sw = S.s1 - S.s0,
    sh = S.z1 - S.z0;
  const [bx, by] = tvPt(4, -4, Z1),
    ear = (s, t, z) => {
      const [x, y] = tvPt(s, t, z);
      return F`<path d="M${bx} ${by - 3}L${x} ${y}" stroke="${O}" stroke-width="3.6" stroke-linecap="round"/><path d="M${bx} ${by - 3}L${x} ${y}" stroke="#c9ced6" stroke-width="1.8" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="2.6" fill="#c9ced6" ${ln(1.2)}/>`;
    };
  return wrap(
    w,
    h,
    F`<ellipse cx="${TVC[0]}" cy="${TVC[1] + TVTOP}" rx="64" ry="35" fill="#000" opacity=".28"/>` +
      /* the stand: two drawers on its front */
      box(-62, 62, -22, 22, 0, HS, "#c47a3e", "#7a3f1f", "#9a5526") +
      F`<path d="${quad(pt(-50, 22, HS - 8), pt(-4, 22, HS - 8), pt(-4, 22, HS - 26), pt(-50, 22, HS - 26))}${quad(pt(4, 22, HS - 8), pt(50, 22, HS - 8), pt(50, 22, HS - 26), pt(4, 22, HS - 26))}" fill="#b06a35" ${ln(1.6)}/>` +
      /* the picture tube's back, then the box */
      box(
        -26,
        26,
        -30,
        -18,
        HS + 6,
        Z1 - 8,
        "#454756",
        "#2b2b33",
        "#33343d",
        2,
      ) +
      box(-40, 40, -18, 14, HS, Z1, "#555869", "#2b2b33", "#3f414d") +
      /* on its front: the screen sunk in its bezel, the two knobs (the channel one with its pointer), the speaker, the light */
      front(
        14,
        R(
          S.s0 - 2.5,
          S.z0 - 2.5,
          sw + 5,
          sh + 5,
          "#1f2027",
          `rx="6" ${ln(1.6)}`,
        ) +
          R(S.s0, S.z0, sw, sh, `url(#${id})`, 'rx="5" class="hg-tv-screen"') +
          F`<path d="M${S.s0 + 6} ${S.z1 - 5}q8 -2 14 -1" stroke="#fff" stroke-width="2" opacity=".18" fill="none" stroke-linecap="round"/>` +
          F`<circle cx="30" cy="74" r="5.5" fill="#23242c" ${ln(1.6)}/><path d="M30 74l3 4" stroke="#c9ced6" stroke-width="1.6" stroke-linecap="round"/><circle cx="30" cy="61" r="4" fill="#23242c" ${ln(1.4)}/>` +
          F`<path d="M25 52h10M25 49h10M25 46h10" stroke="#23242c" stroke-width="1.4"/><circle cx="35" cy="84" r="1.4" fill="#ff5a4a"/>`,
      ) +
      /* the rabbit ears */
      F`<ellipse cx="${bx}" cy="${by}" rx="7" ry="4" fill="#2b2b33" ${ln(1.6)}/>` +
      ear(-24, -8, Z1 + 46) +
      ear(28, -10, Z1 + 44),
    "hg-tv",
    F`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c4a66"/><stop offset=".6" stop-color="#18263a"/><stop offset="1" stop-color="#101824"/></linearGradient>`,
  );
}
/* a low bookshelf against the north wall: two shelves of books (a few leaning), a little plant on top. Footprint w × 40,
   100 high. Box w × 140. Foot: y = h. */
export function bookshelf({ w = 190, h = 140 } = {}) {
  const d = 40,
    H = h - d,
    r = rnd(w + 3),
    cols = [
      "#a8382c",
      "#3e6d8c",
      "#e0b04a",
      "#5f8a4a",
      "#9b5de5",
      "#c4573a",
      "#2f7a6a",
      "#d9cfb5",
    ];
  let books = "";
  for (const [y0, y1] of [
    [d + 10, d + 46],
    [d + 54, H + d - 8],
  ]) {
    let x = 12;
    while (x < w - 16) {
      const bw = 7 + Math.floor(r() * 7),
        bh = (y1 - y0) * (0.68 + r() * 0.3),
        c = cols[Math.floor(r() * cols.length)];
      const room = w - 10 - x - bw; // (the shelf's inside ends at w − 8: every book stays in it)
      if (x > w - 34 && r() < 0.6) {
        // (one leaning, its top against the shelf's right side)
        const dx = Math.min(bh * 0.5, room),
          up = Math.sqrt(bh * bh - dx * dx);
        if (dx >= 4)
          books += F`<path d="M${x} ${y1}l${dx} ${-up}l${bw} 3l${-dx} ${up - 3}Z" fill="${c}" ${ln(1.4)}/>`;
        break;
      }
      if (room < 0) break;
      books +=
        R(x, y1 - bh, bw, bh, c, ln(1.4)) +
        R(x + 2, y1 - bh + 4, bw - 4, 2.4, "#fff", 'opacity=".35"');
      x += bw + (r() < 0.15 ? 6 : 0);
    }
  }
  return wrap(
    w,
    h,
    shade(w / 2, h - 2, w / 2, 7, 0.3) +
      R(0, 0, w, d, "#c47a3e", `rx="3" ${ln(2.4)}`) +
      R(0, d, w, H, "#7a3f1f", ln(2.6)) +
      R(8, d + 8, w - 16, 40, "#4a2412", ln(1.6)) +
      R(8, d + 52, w - 16, H - 58, "#4a2412", ln(1.6)) +
      books +
      R(4, d + 46, w - 8, 7, "#9a5526", ln(1.6)) +
      R(4, h - 8, w - 8, 8, "#9a5526", ln(1.6)) +
      F`<path d="M${w - 34} ${d * 0.62}l4 -16h18l4 16Z" fill="#c4683a" ${ln(1.6)}/><circle cx="${w - 30}" cy="${d * 0.62 - 22}" r="8" fill="#5f8a4a" ${ln(1.4)}/><circle cx="${w - 18}" cy="${d * 0.62 - 26}" r="9" fill="#6f9a52" ${ln(1.4)}/>` +
      R(22, d * 0.2, 34, 12, "#e0b04a", ln(1.4)) +
      R(26, d * 0.2 - 9, 28, 10, "#3e6d8c", ln(1.4)),
    "hg-shelf",
  );
}
/* a little framed picture for a wall: a duck on a pond (kind 'duck') or hills under the moon (kind 'hills'). Box w × h.
   Foot: y = h (its bottom edge). */
export function picture({ w = 46, h = 38, kind = "duck" } = {}) {
  const art =
    kind === "duck"
      ? R(6, 6, w - 12, h - 12, "#7fb7d8") +
        R(6, h * 0.6, w - 12, h * 0.4 - 6, "#3e6d8c") +
        F`<path d="M${w / 2 - 8} ${h * 0.62}c-1 -5 2 -8 6 -7c0 -4 5 -6 7 -3c2 2 1 5 -1 6c5 -1 7 2 6 4Z" fill="#ffd23f" ${ln(1)}/>`
      : R(6, 6, w - 12, h - 12, "#1f2e4a") +
        F`<circle cx="${w * 0.68}" cy="${h * 0.36}" r="4" fill="#ffe9a8"/><path d="M6 ${h - 6}l${w * 0.3} ${-h * 0.32}l${w * 0.2} ${h * 0.14}l${w * 0.22} ${-h * 0.2}l${w * 0.28 - 12} ${h * 0.3}V${h - 6}Z" fill="#3f7a52"/>`;
  return wrap(
    w,
    h,
    R(0, 0, w, h, "#8a4a22", `rx="2" ${ln(2.2)}`) +
      art +
      R(6, 6, w - 12, h - 12, "none", ln(1.4)),
    "hg-picture",
  );
}
/* a round wooden wall clock. Box 2r × 2r. Foot: y = h. */
export function wallClock({ r = 24 } = {}) {
  const c = r,
    ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return F`M${c + Math.sin(a) * (r - 7)} ${c - Math.cos(a) * (r - 7)}L${c + Math.sin(a) * (r - 10)} ${c - Math.cos(a) * (r - 10)}`;
    }).join("");
  return wrap(
    2 * r,
    2 * r,
    F`<circle cx="${c}" cy="${c}" r="${r}" fill="#8a4a22" ${ln(2.4)}/><circle cx="${c}" cy="${c}" r="${r - 5}" fill="#f6f0dc" ${ln(1.6)}/><path d="${ticks}" stroke="${O}" stroke-width="1.6"/>` +
      F`<path d="M${c} ${c}L${c} ${c - r + 11}M${c} ${c}L${c + r * 0.38} ${c + 4}" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${c}" cy="${c}" r="2.4" fill="#d23b33"/>`,
    "hg-clock",
  );
}
/* a coat stand: a pole on a round foot, pegs, a red coat and a woolly hat hanging. Box 50 × 170. Foot: y = h. */
export function coatRack({ w = 50, h = 170 } = {}) {
  const cx = w / 2;
  return wrap(
    w,
    h,
    shade(cx, h - 4, 18, 5, 0.3) +
      F`<ellipse cx="${cx}" cy="${h - 7}" rx="16" ry="5" fill="#5a2d14" ${ln(2)}/><rect x="${cx - 3}" y="10" width="6" height="${h - 18}" fill="#7a3f1f" ${ln(2)}/>` +
      F`<path d="M${cx} 22l-14 -8M${cx} 22l14 -8M${cx} 34l-12 -4" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M${cx} 22l-14 -8M${cx} 22l14 -8M${cx} 34l-12 -4" stroke="#9a5526" stroke-width="2.6" stroke-linecap="round"/><circle cx="${cx}" cy="8" r="5" fill="#9a5526" ${ln(1.8)}/>` +
      F`<path d="M${cx - 14} 18q-6 0 -8 10l-4 52q10 6 22 0l2 -46q0 -12 -12 -16Z" fill="#c4573a" ${ln(2.2)}/><path d="M${cx - 10} 30v44" stroke="#8a2f22" stroke-width="2"/>` +
      F`<path d="M${cx + 6} 18q8 -14 18 0Z" fill="#3e6d8c" ${ln(1.8)}/><circle cx="${cx + 15}" cy="6" r="4" fill="#f4f2ec" ${ln(1.4)}/><path d="M${cx + 6} 18h18" stroke="#e0b04a" stroke-width="3"/>`,
    "hg-coatrack",
  );
}
/* a pair of yellow rain boots, side by side. Box 54 × 44. Foot: y = h. */
export function boots({ w = 54, h = 44 } = {}) {
  const boot = (x) =>
    F`<path d="M${x} 6h14v26q10 0 12 8h-26Z" fill="#ffc23f" ${ln(2)}/><path d="M${x} 6h14v5h-14Z" fill="#e0a020" ${ln(1.4)}/><path d="M${x + 1} 40h25" stroke="#7a5212" stroke-width="3"/>`;
  return wrap(
    w,
    h,
    shade(w / 2, h - 2, w / 2, 4, 0.3) + boot(3) + boot(25),
    "hg-boots",
  );
}
/* the welcome mat in front of the front door: a coir mat with a border and a duck's three-toed prints. Flat, w × h. */
export function doorMat({ w = 130, h = 64 } = {}) {
  const print = (x, y) =>
    F`<path d="M${x} ${y}l-6 -8M${x} ${y}v-10M${x} ${y}l6 -8" stroke="#6e3a1a" stroke-width="3" stroke-linecap="round"/>`;
  return wrap(
    w,
    h,
    R(0, 0, w, h, "#b8864e", `rx="5" ${ln(2.2)}`) +
      R(
        6,
        6,
        w - 12,
        h - 12,
        "none",
        'stroke="#7a5230" stroke-width="3" stroke-dasharray="5 4"',
      ) +
      print(w * 0.32, h * 0.62) +
      print(w * 0.5, h * 0.46) +
      print(w * 0.68, h * 0.64),
    "hg-mat",
  );
}
/* a potted plant: a terracotta pot and a leafy bush. Box 60 × 100. Foot: y = h. */
export function pottedPlant({ w = 60, h = 100 } = {}) {
  const cx = w / 2,
    leaf = (x, y, a, c) =>
      F`<path d="M${x} ${y}q${8 * Math.cos(a) - 6 * Math.sin(a)} ${8 * Math.sin(a) + 6 * Math.cos(a)} ${22 * Math.cos(a)} ${22 * Math.sin(a)}q${-14 * Math.cos(a) + 6 * Math.sin(a)} ${-14 * Math.sin(a) - 6 * Math.cos(a)} ${-22 * Math.cos(a)} ${-22 * Math.sin(a)}Z" fill="${c}" ${ln(1.6)}/>`;
  let leaves = "";
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.36;
    leaves += leaf(cx, h - 40, a, i % 2 ? "#5f8a4a" : "#3f7a52");
  }
  return wrap(
    w,
    h,
    shade(cx, h - 3, 20, 5, 0.3) +
      leaves +
      F`<path d="M${cx - 18} ${h - 42}h36l-5 38h-26Z" fill="#c4683a" ${ln(2.2)}/><path d="M${cx - 20} ${h - 44}h40v8h-40Z" fill="#d9824a" ${ln(2)}/>`,
    "hg-plant",
  );
}

/* ---------- the piano ---------- */
/* the piano itself: a warm wooden upright with brass candle sconces. Footprint w × 90, 150 high; box w × 240. back: the
   case, foot y = 205; front: the keyboard shelf, keys, legs and pedals, foot y = h. Ducks playing stand south of it. */
export function pianoBody({ w = 360, h = 240 } = {}) {
  const id = uid(),
    Y = h - 90,
    wood = "#7a3f1f",
    hi = "#a65a2c",
    lo = "#552a14";
  const back =
    shade(w / 2, Y + 70, w / 2 + 10, 30, 0.3) +
    R(0, Y - 150, w, 55, hi, `rx="4" ${ln(2.6)}`) +
    R(0, Y - 95, w, 150, wood, ln(2.6)) +
    R(24, Y - 84, w - 48, 52, lo, `rx="6" ${ln(2)}`) +
    R(32, Y - 78, w - 64, 40, wood, 'rx="4"') +
    F`<path d="M${w / 2 - 50} ${Y - 58}q25 -16 50 0q25 16 50 0" stroke="#c88a4a" stroke-width="3" fill="none"/>` +
    R(w / 2 - 70, Y - 40, 140, 10, hi, ln(2)) +
    R(w / 2 - 50, Y - 64, 100, 26, "#f3e7c8", ln(1.6)) +
    F`<path d="M${w / 2 - 44} ${Y - 58}h88M${w / 2 - 44} ${Y - 52}h88M${w / 2 - 44} ${Y - 46}h88" stroke="#8a7458" stroke-width="1"/>` +
    [14, w - 14]
      .map(
        (x, i) =>
          F`<circle cx="${x}" cy="${Y - 110}" r="30" fill="url(#${id})" class="hg-flicker hg-c" style="animation-delay:-${i * 1.3}s"/><rect x="${x - 4}" y="${Y - 112}" width="8" height="18" fill="#f4ecd8" ${ln(1.4)}/><path d="M${x} ${Y - 124}q-4 6 0 9q4 -3 0 -9Z" fill="#ffc23f" stroke="#c46a12" stroke-width="1" class="hg-c"/>`,
      )
      .join("");
  let keys = "";
  const nk = Math.floor((w - 40) / 9);
  for (let i = 0; i < nk; i++)
    keys += F`M${20 + (i * (w - 40)) / nk} ${Y - 15}v35`;
  let bk = "";
  for (let i = 0; i < nk - 1; i++)
    if ([0, 1, 3, 4, 5].includes(i % 7))
      bk += R(20 + ((i + 1) * (w - 40)) / nk - 2.5, Y - 15, 5, 18, "#23222b");
  const front =
    R(10, Y - 15, w - 20, 35, "#f3efe4", ln(2.2)) +
    `<path d="${keys}" stroke="#8a8478" stroke-width="1"/>` +
    bk +
    R(0, Y - 22, 20, 44, hi, `rx="4" ${ln(2.2)}`) +
    R(w - 20, Y - 22, 20, 44, hi, `rx="4" ${ln(2.2)}`) +
    R(4, Y + 20, w - 8, 15, wood, ln(2.4)) +
    R(30, Y + 35, w - 60, 20, "#3a1d0e") +
    [22, w - 34]
      .map(
        (x) =>
          R(x, Y + 35, 12, 55, hi, `rx="5" ${ln(2.2)}`) +
          R(x - 4, Y + 84, 20, 6, lo, ln(1.6)),
      )
      .join("") +
    [-14, 0, 14]
      .map((dx) =>
        R(w / 2 + dx - 4, Y + 76, 8, 12, "#d9a441", `rx="2" ${ln(1.4)}`),
      )
      .join("");
  return pair(w, h, [back, glowDef(id, "#ffb347", 0.5)], [front], Y + 55, h);
}

/* ---------- the stage ---------- */
/* the stage: half an oval, its flat side against an east wall: rx out from the wall, ry along it (footprint rx × 2ry),
   raised z (+70). Planks on top with a warm spotlight, a red skirt round the curve, and footlights standing on the top
   just inside the rim along the front, drawn last. Box rx × (2ry + z). back: the top, foot y = z (the footprint's north
   edge); front: the skirt and the footlights, foot y = h. lit false: the power's out (no spotlight, the bulbs dark). */
export function stage({
  rx = 250,
  ry = 195,
  z = 70,
  stairs = 0,
  lit = true,
} = {}) {
  const id = uid(),
    w = rx,
    h = 2 * ry + z,
    cx = rx,
    cy = ry; // (the top's middle, on the wall's face)
  const top = F`M${cx} ${cy - ry}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}Z`;
  let planks = "";
  for (let y = cy - ry + 22; y < cy + ry; y += 22) planks += F`M0 ${y}H${w}`;
  const back =
    F`<path d="${top}" fill="#b06a35"/><g clip-path="url(#${id}c)"><path d="${planks}" stroke="#7a4220" stroke-width="2.2"/>${lit ? F`<ellipse cx="${cx - rx * 0.45}" cy="${cy}" rx="${rx * 0.5}" ry="${ry * 0.55}" fill="url(#${id}s)"/>` : ""}` +
    F`<path d="M${cx} ${cy - ry + 7}A${rx - 7} ${ry - 7} 0 0 0 ${cx} ${cy + ry - 7}" fill="none" stroke="#e0a050" stroke-width="12"/></g>` +
    F`<path d="M${cx} ${cy - ry}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}" fill="none" ${ln(3)}/>`;
  /* the skirt: the curve's south-west quarter, from its left end round to the wall, z deep */
  const band = F`M0 ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}V${cy + ry + z}A${rx} ${ry} 0 0 1 0 ${cy + z}Z`;
  let pleats = "";
  for (let x = 8; x < w; x += 18) pleats += F`M${x} ${cy}V${cy + ry + z}`;
  /* the footlights: little black cans on the top, each a few px in from the rim, their bulbs turned in toward the stage;
     the row ends before the stairs (stairs: how far they reach out from the wall), a can's width short of them */
  let lamps = "";
  const a0 = Math.max(
      Math.PI * 0.56,
      Math.acos(-Math.min(1, (stairs + 32) / (rx - 16))),
    ),
    n = Math.round((Math.PI * 0.96 - a0) / (Math.PI * 0.08)) + 1;
  for (let i = 0; i < n; i++) {
    const a = a0 + ((Math.PI * 0.96 - a0) * i) / (n - 1),
      x = cx + (rx - 16) * Math.cos(a),
      y = cy + (ry - 13) * Math.sin(a),
      k = Math.cos(a);
    lamps +=
      (lit
        ? F`<g class="hg-twinkle" style="animation-delay:-${i * 0.5}s"><circle cx="${x - k * 9}" cy="${y - 6}" r="15" fill="#ffb347" opacity=".4"/></g>`
        : "") +
      F`<rect x="${x - 8}" y="${y - 10}" width="16" height="11" rx="4" fill="#2a2b35" ${ln(1.8)}/><circle cx="${x - k * 5}" cy="${y - 6}" r="4" fill="${lit ? "#fff0b8" : BULB_OFF}" stroke="#6a3a12" stroke-width="1.2"/>`;
  }
  const front =
    F`<path d="${band}" fill="#7a1f2b"/><g clip-path="url(#${id}b)"><path d="${pleats}" stroke="#5a1520" stroke-width="5"/><path d="${pleats}" stroke="#a83444" stroke-width="2" transform="translate(6 0)"/></g><path d="${band}" fill="url(#${id}d)"/>` +
    F`<path d="M0 ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}" stroke="${O}" stroke-width="15" fill="none"/><path d="M0 ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}" stroke="#e0a050" stroke-width="9" fill="none"/>` +
    F`<path d="${band}" fill="none" ${ln(3)}/>` +
    lamps;
  const defs =
    F`<clipPath id="${id}c"><path d="${top}"/></clipPath>` +
    glowDef(id + "s", "#ffd27a", 0.4);
  const fdefs = F`<clipPath id="${id}b"><path d="${band}"/></clipPath><linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;
  return pair(w, h, [back, defs], [front, fdefs], z, h);
}
/* stairs up onto the stage, rising to z. dir 'n' (the default) climbs northward, its risers facing the viewer: the stage
   is beside its top step; dir 'w' climbs westward, the stage at its west end (its steps seen from above, their sides
   facing the viewer). Box w × (d + z). back: the treads (and risers), foot y = z (north edge); front: dir 'w' the steps'
   south faces, dir 'n' nothing (no rail), foot y = h. */
export function stageStairs({
  w = 130,
  d = 150,
  z = 95,
  steps = 5,
  dir = "n",
  h,
} = {}) {
  h = h || d + z;
  const Y = h - d;
  let back = "",
    front = "";
  if (dir === "w") {
    const sw = w / steps;
    for (let k = 0; k < steps; k++) {
      const x = k * sw,
        H = (z * (steps - k)) / steps;
      back +=
        R(x, Y - H, sw + 0.5, d, "#c9803f", ln(2.2)) +
        R(x + 2, Y - H + 2, 5, d - 4, "#f0b070", 'opacity=".55"');
      front +=
        R(x, Y + d - H, sw + 0.5, H, "#8a4a22", ln(2.2)) +
        R(x, Y + d - H, sw + 0.5, 6, "#b06a35");
    }
    return pair(w, h, [back], [front], Y, h);
  }
  const sd = d / steps,
    r = z / steps;
  for (let k = steps - 1; k >= 0; k--) {
    // from the top (north) down
    const y0 = Y + d - (k + 1) * sd;
    back +=
      R(4, y0 - (k + 1) * r, w - 8, sd, "#c9803f", ln(2.2)) +
      R(6, y0 - (k + 1) * r + 2, w - 12, 4, "#f0b070", 'opacity=".55"') +
      R(4, y0 + sd - (k + 1) * r, w - 8, r, "#8a4a22", ln(2.2));
  }
  return pair(w, h, [back], [""], Y, h);
}
/* the mic stand (decoration), side-on. Foot: bottom (y = h − 6). */
export function micStand({ w = 56, h = 120 } = {}) {
  const b = h - 6,
    cx = w * 0.45;
  return wrap(
    w,
    h,
    shade(cx, b, 20, 5) +
      F`<path d="M${cx} ${b - 16}L${cx - 18} ${b}M${cx} ${b - 16}L${cx + 18} ${b}M${cx} ${b - 16}L${cx + 3} ${b - 2}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${cx} ${b - 16}L${cx - 18} ${b}M${cx} ${b - 16}L${cx + 18} ${b}M${cx} ${b - 16}L${cx + 3} ${b - 2}" stroke="#4a4c58" stroke-width="3" stroke-linecap="round"/>` +
      F`<path d="M${cx} ${b - 14}V${h * 0.36}L${cx + 12} ${h * 0.26}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${cx} ${b - 14}V${h * 0.36}L${cx + 12} ${h * 0.26}" stroke="#8a8f9c" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="${h * 0.55}" r="4" fill="#2a2b35" ${ln(1.6)}/>` +
      F`<g transform="rotate(35 ${cx + 15} ${h * 0.2})"><rect x="${cx + 9}" y="${h * 0.14}" width="12" height="22" rx="5" fill="#25262e" ${ln(2)}/><circle cx="${cx + 15}" cy="${h * 0.12}" r="8" fill="#c9ced6" ${ln(2)}/><path d="M${cx + 9} ${h * 0.12}h12M${cx + 15} ${h * 0.12 - 7}v14" stroke="#7d838f" stroke-width="1.2"/><circle cx="${cx + 12}" cy="${h * 0.12 - 3}" r="2" fill="#fff" opacity=".8"/></g>`,
    "hg-mic",
  );
}

/* ---------- the chalk floor ---------- */
/* the chalk floor: dark slate in a wooden frame, a little old chalk dust. Anchor: flat. The drawable slate is inset 18. */
export function chalkFloor({ w = 600, h = 550, seed = 4 } = {}) {
  const r = rnd(seed);
  let dust = "";
  for (let i = 0; i < 7; i++) {
    const x = 50 + r() * (w - 140),
      y = 40 + r() * (h - 80),
      l = 40 + r() * 70;
    dust += F`<path d="M${x} ${y}q${l / 2} ${-8 + r() * 16} ${l} ${-4 + r() * 8}" stroke="#fff" stroke-width="${10 + r() * 14}" stroke-linecap="round" fill="none" opacity="${0.025 + r() * 0.03}"/>`;
  }
  return wrap(
    w,
    h,
    R(0, 0, w, h, "#a65a2c", `rx="8" ${ln(3)}`) +
      R(5, 4, w - 10, 5, "#e3a066", 'rx="2" opacity=".55"') +
      R(18, 18, w - 36, h - 36, "#26302f", ln(2.4)) +
      dust +
      [
        [18, 18],
        [w - 18, 18],
        [18, h - 18],
        [w - 18, h - 18],
      ]
        .map(
          ([x, y]) =>
            F`<circle cx="${x}" cy="${y}" r="5" fill="#d9a441" ${ln(1.4)}/>`,
        )
        .join(""),
    "hg-ground hg-chalk",
  );
}
export const tile = (w, h) =>
  R(2, 2, w - 4, h - 4, "#2f3836", `rx="8" ${ln(2.4)}`) +
  R(
    2,
    2,
    w - 4,
    h - 4,
    "none",
    'rx="8" stroke="#a65a2c" stroke-width="4" opacity=".9"',
  );
/* the eraser tile (pick the eraser up, rub out a little at a time). Anchor: flat. */
export function eraserTile({ w = 72, h = 72 } = {}) {
  const x = w / 2 - 24,
    y = h / 2 - 8;
  return wrap(
    w,
    h,
    tile(w, h) +
      F`<ellipse cx="${w / 2}" cy="${y + 26}" rx="26" ry="6" fill="#000" opacity=".35"/><ellipse cx="${w / 2 - 6}" cy="${y + 24}" rx="16" ry="4" fill="#fff" opacity=".1"/>` +
      R(x, y + 10, 48, 12, "#8b8f99", `rx="3" ${ln(2)}`) +
      R(x, y - 6, 48, 18, "#c58a4e", `rx="4" ${ln(2)}`) +
      R(x + 5, y - 3, 30, 4, "#ecb57c", 'rx="2" opacity=".7"'),
    "hg-ground",
  );
}
/* the white X tile beside the chalk floor (use it: the whole floor wiped). Anchor: flat. */
export function wipeTile({ w = 72, h = 72 } = {}) {
  const c = w / 2,
    m = h / 2,
    k = Math.min(w, h) * 0.26;
  const x = F`M${c - k} ${m - k}L${c + k} ${m + k}M${c + k} ${m - k}L${c - k} ${m + k}`;
  return wrap(
    w,
    h,
    tile(w, h) +
      F`<path d="${x}" stroke="${O}" stroke-width="15" stroke-linecap="round"/><path d="${x}" stroke="#f4f4f0" stroke-width="9" stroke-linecap="round"/><path d="${x}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5" transform="translate(-1.5 -1.5)"/>`,
    "hg-ground",
  );
}
/* the chalk tile (pick up the chalk): a few sticks. Anchor: flat. */
export function chalkTile({ w = 72, h = 72 } = {}) {
  const stick = (x, y, c, a) =>
    F`<g transform="rotate(${a} ${x} ${y})"><rect x="${x - 15}" y="${y - 4}" width="30" height="8" rx="4" fill="${c}" ${ln(1.8)}/><rect x="${x - 12}" y="${y - 3}" width="18" height="2" rx="1" fill="#fff" opacity=".6"/></g>`;
  return wrap(
    w,
    h,
    tile(w, h) +
      F`<ellipse cx="${w / 2}" cy="${h / 2 + 10}" rx="22" ry="7" fill="#fff" opacity=".07"/>` +
      stick(w / 2 - 6, h / 2 - 10, "#ff9ec4", -12) +
      stick(w / 2 + 6, h / 2 + 2, "#8fd0ff", 8) +
      stick(w / 2 - 2, h / 2 + 14, "#f4f4f0", -4),
    "hg-ground",
  );
}
/* the guestbook on its lectern, with an ink pot and a quill. Footprint w × 40; foot y = h. */
export function bookStand({ w = 76, h = 136 } = {}) {
  const id = uid(),
    cx = w / 2,
    Y = h - 40;
  return wrap(
    w,
    h,
    shade(cx, Y + 30, w * 0.42, 12) +
      F`<circle cx="${cx}" cy="${Y - 70}" r="${w * 0.75}" fill="url(#${id})" class="hg-flicker"/>` +
      R(cx - 22, Y + 28, 44, 10, "#5e3218", `rx="3" ${ln(2)}`) +
      R(cx - 7, Y - 40, 14, 70, "#8a4a22", ln(2.2)) +
      R(cx - 5, Y - 38, 4, 64, "#b06a35") +
      F`<path d="M2 ${Y - 66}H${w - 2}L${w - 6} ${Y - 38}H6Z" fill="#a65a2c" ${ln(2.4)}/><path d="M6 ${Y - 38}H${w - 6}v6H6Z" fill="#6e3a1a" ${ln(2)}/>` +
      F`<path d="M8 ${Y - 70}Q${cx / 2 + 4} ${Y - 78} ${cx} ${Y - 70}Q${cx * 1.5 - 4} ${Y - 78} ${w - 8} ${Y - 70}L${w - 10} ${Y - 44}Q${cx * 1.5} ${Y - 50} ${cx} ${Y - 44}Q${cx / 2} ${Y - 50} 10 ${Y - 44}Z" fill="#f6ead0" ${ln(2)}/><path d="M${cx} ${Y - 70}V${Y - 44}" stroke="#b9a37f" stroke-width="2"/>` +
      F`<path d="M15 ${Y - 64}h18M14 ${Y - 58}h20M14 ${Y - 52}h14M${cx + 6} ${Y - 64}h18M${cx + 6} ${Y - 58}h12" stroke="#7d6a52" stroke-width="1.6" stroke-linecap="round"/><path d="M${cx + 14} ${Y - 46}l3 14l3 -4l3 4l-1 -14" fill="#c4302b" ${ln(1.2)}/>` +
      F`<path d="M${w - 4} ${Y - 92}C${w + 4} ${Y - 84} ${w - 6} ${Y - 72} ${w - 16} ${Y - 66}C${w - 14} ${Y - 76} ${w - 8} ${Y - 86} ${w - 4} ${Y - 92}Z" fill="#f4f4f0" ${ln(1.6)}/>`,
    "hg-book",
    glowDef(id, "#ffd27a", 0.35),
  );
}

/* ---------- the kitchen ---------- */
/* a counter along a wall: cabinets with a butcher-block top; sink: x of a sink on it; upper: wall cabinets above.
   Footprint w × 60, 70 high; box w × 130 (w × 230 with upper). Foot: y = h. */
export function counter({ w = 260, h, sink = null, upper = true } = {}) {
  const d = 60,
    z = 70;
  h = h || d + (upper ? 180 : z);
  const Y = h - d,
    n = Math.max(1, Math.round(w / 64)),
    cw = w / n;
  let s = "";
  if (upper) {
    // (on the wall above the counter, wall showing between: a shallow top, then the doors)
    s +=
      R(0, Y - 180, w, 14, "#b8743e", ln(2.4)) +
      R(0, Y - 166, w, 60, "#8f4f24", ln(2.4));
    for (let i = 0; i < n; i++)
      s +=
        R(i * cw + 5, Y - 161, cw - 10, 50, "#a35d2c", `rx="3" ${ln(1.6)}`) +
        R(i * cw + cw / 2 - 2, Y - 124, 4, 10, "#d9a441", ln(1));
  }
  s += R(0, Y - 10, w, 70, "#8f4f24", ln(2.4));
  for (let i = 0; i < n; i++)
    s +=
      R(i * cw + 5, Y - 4, cw - 10, 50, "#a35d2c", `rx="3" ${ln(1.6)}`) +
      R(i * cw + cw / 2 - 6, Y + 4, 12, 4, "#d9a441", ln(1));
  s +=
    R(0, Y + 48, w, 12, "#3a1d0e", ln(2)) +
    R(0, Y - 72, w, 64, "#d39a5e", `rx="3" ${ln(2.4)}`) +
    F`<path d="M8 ${Y - 60}H${w - 8}M8 ${Y - 40}H${w - 8}M8 ${Y - 22}H${w - 8}" stroke="#b27740" stroke-width="1.6"/>` +
    R(0, Y - 10, w, 6, "#a86a34", ln(1.6));
  if (sink != null)
    s +=
      R(sink - 34, Y - 62, 68, 42, "#9aa3ad", `rx="8" ${ln(2.2)}`) +
      R(sink - 28, Y - 56, 56, 30, "#5d6670", 'rx="6"') +
      F`<ellipse cx="${sink}" cy="${Y - 40}" rx="14" ry="5" fill="#8fd3e8" opacity=".5"/><path d="M${sink + 22} ${Y - 64}V${Y - 92}Q${sink + 22} ${Y - 100} ${sink + 10} ${Y - 100}V${Y - 88}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${sink + 22} ${Y - 64}V${Y - 92}Q${sink + 22} ${Y - 100} ${sink + 10} ${Y - 100}V${Y - 88}" stroke="#c9ced6" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  else
    s += F`<g transform="translate(${w * 0.3} ${Y - 46})"><ellipse cx="0" cy="0" rx="16" ry="5" fill="#b9b2a0" ${ln(1.8)}/><circle cx="0" cy="-5" r="6" fill="#8ee03c" ${ln(1.6)}/><circle cx="-6" cy="-1" r="7" fill="#ef3b3b" ${ln(1.6)}/><circle cx="6" cy="-1" r="6" fill="#ff8c2b" ${ln(1.6)}/><path d="M-16 0Q-15 13 -8 14H8Q15 13 16 0Q0 6 -16 0Z" fill="#e8e2d0" ${ln(1.8)}/></g>`; // (the fruit in the bowl: the bowl's front over it)
  return wrap(w, h, s, "hg-counter");
}
/* a rounded old fridge, with fridge magnets. Footprint w × 60, 150 high. Foot: y = h. */
export function fridge({ w = 76, h = 196 } = {}) {
  const Y = h - 60,
    mags = ["#ef3b3b", "#ffd23f", "#2fa4ff", "#37d421", "#9b5de5"];
  return wrap(
    w,
    h,
    R(2, Y - 10, w - 4, 70, "#e2dccb", ln(2.4)) +
      F`<path d="M2 ${Y - 10}V${Y - 122}Q2 ${Y - 136} 16 ${Y - 136}H${w - 16}Q${w - 2} ${Y - 136} ${w - 2} ${Y - 122}V${Y - 10}Z" fill="#f1ecdf" ${ln(2.4)}/>` +
      F`<path d="M2 ${Y - 94}H${w - 2}" stroke="${O}" stroke-width="2"/><rect x="${w - 14}" y="${Y - 84}" width="6" height="36" rx="3" fill="#c9ced6" ${ln(1.6)}/>` +
      R(8, Y - 132, 20, 108, "#fff", 'rx="6" opacity=".25"') +
      mags
        .map(
          (c, i) =>
            F`<rect x="${12 + (i % 3) * 14}" y="${Y - 80 + Math.floor(i / 3) * 16 + (i % 2) * 4}" width="9" height="9" rx="2" fill="${c}" ${ln(1.2)} transform="rotate(${((i * 23) % 30) - 15} ${16 + (i % 3) * 14} ${Y - 76 + Math.floor(i / 3) * 16})"/>`,
        )
        .join("") +
      F`<rect x="${w - 14}" y="${Y + 2}" width="6" height="30" rx="3" fill="#c9ced6" ${ln(1.6)}/>` +
      R(4, Y + 46, w - 8, 10, "#3a3b44", ln(1.6)),
    "hg-fridge",
  );
}
/* the stove: four burners, a red kettle, an oven window with a faint glow. Footprint w × 60, 70 high. Foot: y = h. */
export function stove({ w = 76, h = 150 } = {}) {
  const Y = h - 60;
  return wrap(
    w,
    h,
    R(0, Y - 70, w, 20, "#e2dccb", ln(2.2)) +
      R(0, Y - 10, w, 70, "#e8e2d0", ln(2.4)) +
      R(0, Y - 50, w, 40, "#2b2b33", ln(2.4)) +
      [
        [w * 0.28, Y - 40],
        [w * 0.72, Y - 40],
        [w * 0.28, Y - 22],
        [w * 0.72, Y - 22],
      ]
        .map(
          ([x, y]) =>
            F`<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="none" stroke="#5a5b66" stroke-width="3"/>`,
        )
        .join("") +
      F`<g transform="translate(${w * 0.72} ${Y - 36})"><path d="M-12 0C-14 -14 14 -14 12 0Z" fill="#d23b33" ${ln(1.8)}/><path d="M10 -6l8 -6" stroke="${O}" stroke-width="3"/><path d="M-6 -11q6 -8 12 0" stroke="${O}" stroke-width="2.4" fill="none"/></g>` +
      [0.2, 0.4, 0.6, 0.8]
        .map(
          (t) =>
            F`<circle cx="${w * t}" cy="${Y - 3}" r="3.2" fill="#2b2b33" ${ln(1)}/>`,
        )
        .join("") +
      R(8, Y + 6, w - 16, 40, "#2b2b33", `rx="4" ${ln(2)}`) +
      R(14, Y + 12, w - 28, 22, "#ff9a3a", 'rx="3" opacity=".35"') +
      R(14, Y + 6, w - 28, 3, "#c9ced6", ln(1)) +
      R(2, Y + 50, w - 4, 8, "#3a3b44"),
    "hg-stove",
  );
}
/* the kitchen table with two chairs behind it, a lantern and plates on it; box w × 240. A pair: the chairs (foot y = 100,
   so a duck sitting on one is in front of them) and the table (foot y = h − 10, the table's front). */
export function kitchenTable({ w = 200, h = 240 } = {}) {
  const id = uid(),
    Y = h - 150,
    tx = 10,
    tw = w - 20;
  const chair = (x) =>
    R(x - 18, Y - 74, 36, 12, "#b06a35", `rx="4" ${ln(2)}`) +
    R(x - 16, Y - 62, 6, 34, "#8a4a22", ln(1.6)) +
    R(x + 10, Y - 62, 6, 34, "#8a4a22", ln(1.6)) +
    R(x - 10, Y - 54, 20, 6, "#8a4a22", ln(1.4)) +
    R(x - 10, Y - 42, 20, 6, "#8a4a22", ln(1.4)) +
    R(x - 20, Y - 30, 40, 40, "#c9803f", `rx="4" ${ln(2)}`);
  return pair(
    w,
    h,
    [shade(w / 2, Y + 120, w / 2, 26, 0.3) + chair(w * 0.3) + chair(w * 0.7)],
    [
      R(tx, Y - 6, tw, 100, "#b8743e", `rx="6" ${ln(2.6)}`) +
        F`<path d="M${tx + 6} ${Y + 20}H${tx + tw - 6}M${tx + 6} ${Y + 46}H${tx + tw - 6}M${tx + 6} ${Y + 72}H${tx + tw - 6}" stroke="#94582a" stroke-width="1.6"/>` +
        R(tx, Y + 94, tw, 14, "#8a4a22", ln(2.2)) +
        R(tx + 6, Y + 108, 12, 32, "#6e3a1a", ln(1.8)) +
        R(tx + tw - 18, Y + 108, 12, 32, "#6e3a1a", ln(1.8)) +
        [w * 0.3, w * 0.7]
          .map(
            (x) =>
              F`<ellipse cx="${x}" cy="${Y + 30}" rx="18" ry="12" fill="#f1ecdf" ${ln(1.8)}/><ellipse cx="${x}" cy="${Y + 30}" rx="10" ry="6" fill="#e2dccb"/>`,
          )
          .join("") +
        F`<circle cx="${w / 2}" cy="${Y + 30}" r="44" fill="url(#${id})" class="hg-flicker hg-l"/><rect x="${w / 2 - 9}" y="${Y + 14}" width="18" height="24" rx="3" fill="#ffd98a" class="hg-lg" ${ln(2)}/><path d="M${w / 2 - 11} ${Y + 13}h22M${w / 2 - 11} ${Y + 39}h22M${w / 2} ${Y + 13}v-6" stroke="${O}" stroke-width="3"/>`,
      glowDef(id, "#ffb347", 0.45),
    ],
    Y + 10,
    h - 10,
  );
}

/* a playing card, 14 × 20, its middle at (x, y), turned a degrees: face up (c white, a red or black pip: mark) or face
   down (c the blue back) */
const playCard = (x, y, a, c = "#fbfaf6", mark = "") =>
  F`<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-7" y="-10" width="14" height="20" rx="2" fill="${c}" ${ln(1.4)}/>${mark}</g>`;
const CHIPS = ["#ef3b3b", "#2fa4ff", "#ffd23f", "#37d421", "#f4f2ec"]; // (Twister's colors, and white)
/* the blackjack table in the great room (blackjack.js): round and seen from above like the room, so its top is a circle
   (r from its middle): a dark wood rim round a green felt top, a light arc and a ring for each stool's bet printed on
   it, the dealer's tray of chips and the deck on the north side; under the front of the top, its thickness and two of
   its four legs. seats: each stool's direction, in degrees east of north. Box (2r + 20) × (2r + h + 18); foot y =
   2r + h + 8 (the floor at its front). The cards and bets of a hand are drawn over it by blackjack.js. */
export function roundCardTable({
  r = 100,
  h = 55,
  seats = [50, 85, 117.5, 150, 210, 242.5, 275, 310],
} = {}) {
  const w = 2 * r + 20,
    cx = w / 2,
    cy = r + 8,
    fy = cy + h,
    t = 14,
    H = 2 * r + h + 18; // (cy: the top's middle; fy: the floor under it; t: the top's thickness)
  const leg = (s) => {
    const x = cx + s * r * 0.5,
      b = fy + r * 0.62;
    return (
      R(x - 6, b - (h - t), 12, h - t, "#5a2d14", ln(1.8)) +
      R(x - 3, b - (h - t) + 2, 3, h - t - 4, "#8a4a22", 'opacity=".6"')
    );
  };
  const spots = seats
    .map(
      (a) =>
        F`<circle cx="${cx + r * 0.66 * Math.sin((a * Math.PI) / 180)}" cy="${cy - r * 0.66 * Math.cos((a * Math.PI) / 180)}" r="10" fill="none" stroke="#e8d9a0" stroke-width="1.6" opacity=".55"/>`,
    )
    .join("");
  const tray =
    R(cx - 36, cy - r + 14, 72, 20, "#3a2414", `rx="5" ${ln(1.8)}`) +
    CHIPS.map(
      (c, i) =>
        F`<circle cx="${cx - 26 + i * 13}" cy="${cy - r + 24}" r="5.2" fill="${c}" ${ln(1.1)}/>`,
    ).join("");
  const deck = [2, 1, 0]
    .map((i) => playCard(cx + 52 - i, cy - r + 34 - i * 1.4, 8, "#3e6d8c"))
    .join("");
  return wrap(
    w,
    H,
    shade(cx, fy, r * 0.82, r * 0.82, 0.26) +
      leg(-1) +
      leg(1) +
      F`<path d="M${cx - r} ${cy}V${cy + t}A${r} ${r} 0 0 0 ${cx + r} ${cy + t}V${cy}Z" fill="#6e3a1a" ${ln(2.6)}/>` +
      F`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#8a4a22" ${ln(2.6)}/><circle cx="${cx}" cy="${cy}" r="${r - 11}" fill="#2f7a4a" ${ln(1.6)}/>` +
      F`<path d="M${cx - r * 0.44} ${cy - r * 0.3}A${r * 0.54} ${r * 0.54} 0 0 0 ${cx + r * 0.44} ${cy - r * 0.3}" fill="none" stroke="#e8d9a0" stroke-width="1.6" opacity=".45"/>` +
      F`<circle cx="${cx - r * 0.22}" cy="${cy - r * 0.24}" r="${r * 0.5}" fill="#fff" opacity=".05"/>` +
      spots +
      tray +
      deck,
    "hg-bjtable",
  );
}
/* a bar stool by the blackjack table, seen from above like the room: a round cushion (r from its middle, Twister colors)
   on a short wooden seat, three legs splayed to the floor and a footrest ring halfway down. h: the cushion's top. Box
   (2r + 8) × (2r + h + 8); foot y = 2r + h + 4 (the floor at its front). */
export function stool({ r = 17, h = 32, color = "#ef3b3b" } = {}) {
  const w = 2 * r + 8,
    cx = w / 2,
    cy = r + 4,
    fy = cy + h,
    t = 6,
    H = 2 * r + h + 8;
  const legs = F`M${cx} ${cy + t}L${cx} ${fy - r * 0.75}M${cx - r * 0.35} ${cy + t}L${cx - r * 0.8} ${fy + r * 0.45}M${cx + r * 0.35} ${cy + t}L${cx + r * 0.8} ${fy + r * 0.45}`;
  return wrap(
    w,
    H,
    shade(cx, fy, r * 0.85, r * 0.85, 0.3) +
      `<path d="${legs}" stroke="${O}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="${legs}" stroke="#8a4a22" stroke-width="3.6" stroke-linecap="round" fill="none"/>` +
      F`<circle cx="${cx}" cy="${cy + h * 0.55}" r="${r * 0.62}" fill="none" stroke="${O}" stroke-width="6"/><circle cx="${cx}" cy="${cy + h * 0.55}" r="${r * 0.62}" fill="none" stroke="#a65a2c" stroke-width="3"/>` +
      F`<path d="M${cx - r} ${cy}V${cy + t}A${r} ${r} 0 0 0 ${cx + r} ${cy + t}V${cy}Z" fill="#8a4a22" ${ln(2.2)}/>` +
      F`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" ${ln(2.2)}/><path d="M${cx - r * 0.62} ${cy - r * 0.2}A${r * 0.66} ${r * 0.66} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.64}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>`,
    "hg-stool",
  );
}
export { playCard, CHIPS };

/* ---------- the bathroom ---------- */
/* a tub with bubbles and a tiny rubber duck, seen from above like the room: its rim, a sliver of its side under it and
   two little feet. Footprint w × 84, 46 high. Foot: y = h. */
export function tub({ w = 170, h = 130 } = {}) {
  const Y = h - 84,
    t = Y - 26;
  return wrap(
    w,
    h,
    shade(w / 2, Y + 74, w / 2 - 6, 9, 0.3) +
      [26, w - 26]
        .map(
          (x) =>
            F`<path d="M${x - 7} ${Y + 62}l2 9h10l2 -9Z" fill="#d9a441" ${ln(1.6)}/>`,
        )
        .join("") +
      R(12, Y + 36, w - 24, 30, "#dcd8cf", `rx="14" ${ln(2.2)}`) +
      R(4, t, w - 8, 84, "#f4f2ec", `rx="34" ${ln(2.6)}`) +
      R(14, t + 10, w - 28, 64, "#7fcfe4", `rx="26" ${ln(1.8)}`) +
      [
        [0.3, 0.3],
        [0.45, 0.5],
        [0.62, 0.25],
        [0.7, 0.6],
        [0.36, 0.7],
        [0.55, 0.72],
      ]
        .map(
          ([fx, fy], i) =>
            F`<circle cx="${14 + fx * (w - 28)}" cy="${t + 10 + fy * 64}" r="${5 + (i % 3) * 2}" fill="#fff" opacity=".85" ${ln(1)}/>`,
        )
        .join("") +
      F`<g transform="translate(${w * 0.74} ${t + 44}) scale(-1 1)"><path d="M-8 0C-9 -4 -8 -7 -5 -8C-5 -12 -1 -14 1.5 -12C4 -11 4 -7 2.5 -6C7 -7 9 -4 8 0Z" fill="#ffd23f" ${ln(1.3)}/><path d="M3.5 -11l4 1l-4 1Z" fill="#ff9a1f"/></g>` +
      F`<path d="M12 ${t + 40}v-13h12" stroke="${O}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M12 ${t + 40}v-13h12" stroke="#d9a441" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    "hg-tub",
  ); // (the faucet: on the left rim, halfway down)
}
/* a washstand with a round mirror on the wall above it. Footprint w × 46, 72 high, the mirror up to 150 and a little light over it. Foot: y = h. */
export function sink({ w = 66, h = 196 } = {}) {
  const Y = h - 46;
  const id = uid();
  return wrap(
    w,
    h,
    F`<circle cx="${w / 2}" cy="${Y - 160}" r="34" fill="url(#${id})" class="lit lit-glow"/><path d="M${w / 2} ${Y - 148}v-8" stroke="${O}" stroke-width="5"/><path d="M${w / 2} ${Y - 148}v-8" stroke="#d9a441" stroke-width="2.4"/><path d="M${w / 2 - 9} ${Y - 156}h18l-4 -10h-10Z" fill="#ffcf73" class="lit" ${ln(1.8)}/>` +
      F`<circle cx="${w / 2}" cy="${Y - 124}" r="24" fill="#c47a3e" ${ln(2.4)}/><circle cx="${w / 2}" cy="${Y - 124}" r="17" fill="#6f8fb0" ${ln(1.6)}/><path d="M${w / 2 - 9} ${Y - 130}l8 -8M${w / 2 - 4} ${Y - 122}l10 -10" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>` +
      R(4, Y - 26, w - 8, 72, "#9a5526", ln(2.4)) +
      R(10, Y - 14, w - 20, 50, "#b06a35", `rx="3" ${ln(1.6)}`) +
      R(w / 2 - 6, Y + 6, 12, 4, "#d9a441", ln(1)) +
      R(0, Y - 72, w, 46, "#e8e2d0", `rx="6" ${ln(2.4)}`) +
      F`<ellipse cx="${w / 2}" cy="${Y - 46}" rx="${w * 0.32}" ry="13" fill="#b9c3cb" ${ln(1.8)}/><path d="M${w / 2} ${Y - 66}v10h6" stroke="#c9ced6" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    "hg-sink",
    glowDef(id, "#ffe0b0", 0.5),
  );
}
/* a toilet against the north wall, facing into the room, drawn like the plain one everybody knows: the tank (a lid band,
   a flush lever) just behind a closed round seat, the bowl's round belly, and a short foot that widens to the floor.
   Footprint w × 70, the tank 120 high. Foot: y = h. */
export function toilet({ w = 80, h = 130 } = {}) {
  const Y = h,
    c = w / 2;
  return wrap(
    w,
    h,
    shade(c, Y - 3, 24, 6, 0.3) +
      R(c - 25, Y - 114, 50, 62, "#e9e6de", `rx="6" ${ln(2.4)}`) +
      R(c - 28, Y - 122, 56, 11, "#f7f5ef", `rx="4" ${ln(2.2)}`) +
      R(c - 3, Y - 125, 6, 4, "#c9ced6", `rx="1.5" ${ln(1.2)}`) +
      F`<path d="M${c - 25} ${Y - 104}h-7" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/><path d="M${c - 25} ${Y - 104}h-7" stroke="#c9ced6" stroke-width="2.6" stroke-linecap="round"/>` +
      F`<path d="M${c - 30} ${Y - 56}C${c - 30} ${Y - 36} ${c - 21} ${Y - 28} ${c - 12} ${Y - 27}L${c - 15} ${Y - 3}H${c + 15}L${c + 12} ${Y - 27}C${c + 21} ${Y - 28} ${c + 30} ${Y - 36} ${c + 30} ${Y - 56}Z" fill="#ece9e2" ${ln(2.4)}/>` +
      F`<path d="M${c - 12} ${Y - 27}H${c + 12}" stroke="#bdb9ae" stroke-width="1.6"/><path d="M${c + 18} ${Y - 47}Q${c + 22} ${Y - 38} ${c + 14} ${Y - 33}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round"/>` +
      F`<ellipse cx="${c}" cy="${Y - 55}" rx="31" ry="12" fill="#dedad1" ${ln(2.2)}/><ellipse cx="${c}" cy="${Y - 59}" rx="29" ry="11" fill="#f7f5ef" ${ln(2.4)}/><path d="M${c - 14} ${Y - 63}q14 -5 28 0" stroke="#fff" stroke-width="2" fill="none" opacity=".9" stroke-linecap="round"/>`,
    "hg-toilet",
  );
}

/* ---------- the bedrooms ---------- */
/* a bed with a low log headboard, two pillows and a patchwork quilt. Footprint w × 210, the headboard 30 over it. Foot: y = h. */
export function bed({
  w = 150,
  h = 290,
  colors = ["#3e6d8c", "#c4573a", "#e0b04a", "#5f8a4a"],
} = {}) {
  const Y = h - 210,
    q0 = Y + 34,
    q1 = Y + 168,
    n = 6,
    sq = (w - 12) / n;
  let quilt = "";
  for (let r = 0, y = q0; y < q1 + 22; y += sq, r++)
    for (let c = 0; c < n; c++)
      quilt += R(
        6 + c * sq,
        y,
        sq + 0.3,
        Math.min(sq, q1 + 22 - y) + 0.3,
        colors[(r + c * 2) % colors.length],
      );
  return wrap(
    w,
    h,
    shade(w / 2, Y + 200, w / 2 + 6, 16, 0.3) +
      R(4, Y - 26, w - 8, 190, "#f1ecdf", `rx="10" ${ln(2.4)}`) +
      R(10, Y - 18, (w - 26) / 2, 34, "#fbfaf6", `rx="12" ${ln(2)}`) +
      R(w / 2 + 3, Y - 18, (w - 26) / 2, 34, "#fbfaf6", `rx="12" ${ln(2)}`) +
      quilt +
      R(6, q0, w - 12, q1 + 22 - q0, "none", `rx="6" ${ln(2.2)}`) +
      R(6, q0 - 10, w - 12, 14, "#fbfaf6", `rx="4" ${ln(2)}`) +
      F`<path d="M6 ${q0 + 4}H${w - 6}" stroke="#000" stroke-opacity=".15" stroke-width="4"/>` +
      R(0, Y + 186, w, 24, "#a65a2c", `rx="10" ${ln(2.4)}`) +
      R(4, Y + 190, w - 8, 5, "#d98d4e", 'rx="2" opacity=".6"') +
      R(0, Y - 46, w, 10, "#c98a52", ln(2.4)) +
      R(0, Y - 36, w, 14, "#a65a2c", ln(2.4)) +
      F`<path d="M0 ${Y - 29}H${w}" stroke="#5e2a10" stroke-width="2"/>` +
      [0, w - 16]
        .map((x) => R(x, Y - 54, 16, 36, "#b8703a", `rx="8" ${ln(2.4)}`))
        .join(""),
    "hg-bed",
  );
}
/* a nightstand with a glowing table lamp. Footprint w × 40, 44 high, the lamp up to 100. Foot: y = h. */
export function nightstand({ w = 48, h = 140 } = {}) {
  const id = uid(),
    Y = h - 40,
    cx = w / 2;
  return wrap(
    w,
    h,
    F`<circle cx="${cx}" cy="${Y - 76}" r="${w * 0.9}" fill="url(#${id})"/>` +
      R(2, Y - 4, w - 4, 44, "#9a5526", ln(2.2)) +
      R(6, Y + 2, w - 12, 16, "#b06a35", `rx="2" ${ln(1.4)}`) +
      R(cx - 4, Y + 8, 8, 3, "#d9a441") +
      R(0, Y - 44, w, 40, "#c47a3e", `rx="3" ${ln(2.2)}`) +
      F`<path d="M${cx - 8} ${Y - 30}h16l-3 -14h-10Z" fill="#3e6d8c" ${ln(1.6)}/><path d="M${cx} ${Y - 44}v-14" stroke="${O}" stroke-width="3"/><path d="M${cx - 13} ${Y - 58}h26l-6 -24h-14Z" fill="#ffcf73" ${ln(2)}/><path d="M${cx - 9} ${Y - 60}h6l-2 -18h-2Z" fill="#fff0c2" opacity=".8"/>`,
    "hg-nightstand",
    glowDef(id, "#ffb347", 0.5),
  );
}
