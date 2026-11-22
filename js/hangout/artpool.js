/* ---------- the deck and the pool ----------
   Moved out of art.js to keep that file small (a pure move; the owner's, Nov 22). */
import { mix } from "../duck.js";

import {
  F,
  O,
  R,
  glowDef,
  ln,
  pair,
  shade,
  stringLights,
  uid,
  wrap,
} from "./artbase.js";

/* ---------- the deck ---------- */
/* the deck: orange planks raised over the slope, an orange railing on its west, south and east sides (the east side open
   at gapE for the stairs), warm string lights on the railing, warm light spilling from the cabin's windows (lights: x
   of each). Footprint w × d at height 0, the posts reaching the ground `drop` below its south edge. Box w × (rail + d +
   drop), the footprint's north edge at y = rail. back: the planks and the side railings, foot y = rail; front: the
   south railing and what is under it, foot y = rail + d. */
export function deck({
  w = 2100,
  d = 400,
  rail = 50,
  drop = 190,
  gapE = [0, 150],
  lights = [360, 600, 840, 1300, 1700],
  bulbs = true,
  h,
} = {}) {
  h = h || rail + d + drop;
  const id = uid(),
    Y = rail,
    S = Y + d;
  const boards = F`<pattern id="${id}" width="44" height="400" patternUnits="userSpaceOnUse"><rect width="22" height="400" fill="#c06d30"/><rect x="22" width="22" height="400" fill="#b8672c"/><path d="M21 0V400M43 0V400" stroke="#7a3d14" stroke-width="2"/><path d="M0 130H22M22 290H44" stroke="#7a3d14" stroke-width="2"/><rect x="3" width="5" height="400" fill="#f0a060" opacity=".18"/></pattern>`;
  let back =
    R(0, Y, w, d, `url(#${id})`, ln(3)) +
    lights
      .map(
        (x) =>
          F`<ellipse cx="${x}" cy="${Y + 30}" rx="190" ry="120" fill="url(#${id}w)"/>`,
      )
      .join("");
  const sideRail = (x, a, b) =>
    R(x - 5, Y + a - rail, 10, b - a + rail, "#d98a4a", ln(2.2)) +
    Array.from({ length: Math.max(1, Math.floor((b - a) / 100)) + 1 }, (_, i) =>
      R(
        x - 8,
        Y +
          a -
          rail -
          4 +
          (i * (b - a)) / Math.max(1, Math.floor((b - a) / 100)),
        16,
        12,
        "#a65a2c",
        ln(2),
      ),
    ).join("");
  back += sideRail(6, 0, d);
  if (gapE && gapE[1] < d) back += sideRail(w - 6, gapE[1], d);
  if (gapE && gapE[0] > 0) back += sideRail(w - 6, 0, gapE[0]);
  /* the front: under the deck (dark lattice between posts), its rim, and the south railing with its lights */
  const lat = F`<pattern id="${id}l" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#140d08"/><path d="M0 0L26 26M26 0L0 26" stroke="#6e3a18" stroke-width="5"/></pattern>`;
  let front = R(8, S + 22, w - 16, drop - 22, `url(#${id}l)`, ln(2.4));
  const np = Math.max(1, Math.round(w / 350));
  for (let i = 0; i <= np; i++) {
    const x = Math.min(w - 22, Math.max(4, (i * w) / np - 9));
    front +=
      R(x, S + 18, 18, drop - 18, "#9a5526", ln(2.2)) +
      R(x + 3, S + 20, 4, drop - 24, "#d98a4a", 'opacity=".4"');
  }
  front +=
    R(0, S, w, 22, "#a65a2c", ln(2.4)) +
    R(0, S + 2, w, 5, "#e09a5c", 'opacity=".5"');
  let bal = "";
  for (let x = 14; x < w - 8; x += 20) bal += F`M${x} ${S - rail + 6}V${S - 2}`;
  front +=
    `<path d="${bal}" stroke="${O}" stroke-width="8"/><path d="${bal}" stroke="#d07a35" stroke-width="4.5"/>` +
    R(0, S - 8, w, 7, "#b8672c", ln(1.8));
  const pr = Math.max(1, Math.round(w / 210));
  for (let i = 0; i <= pr; i++) {
    const x = Math.min(w - 14, Math.max(0, (i * w) / pr - 7));
    front += R(x, S - rail - 6, 14, rail + 6, "#c06d30", ln(2.2));
  }
  front +=
    R(-4, S - rail - 12, w + 8, 8, "#e8a060", ln(2.2)) +
    R(-4, S - rail - 4, w + 8, 6, "#a65a2c", ln(1.8));
  if (bulbs) front += stringLights(0, w, S - rail - 6, 14, w / pr, 28, 5, 2.6);
  return pair(
    w,
    h,
    [back, boards + glowDef(id + "w", "#ffb347", 0.38)],
    [front, lat],
    Y,
    S,
  );
}
/* the deck's string lights on their own (a bulbs: false deck's box and place), so they can stutter */
export function deckBulbs({ w = 2100, d = 400, rail = 50, drop = 190 } = {}) {
  const pr = Math.max(1, Math.round(w / 210));
  return wrap(
    w,
    rail + d + drop,
    stringLights(0, w, rail + d - rail - 6, 14, w / pr, 28, 5, 2.6),
    "hg-bulbs",
  );
}
/* the deck's stairs: a landing at the deck's height, then steps down south to the ground rise lower, railings on both
   sides. Footprint w × d (landing first), box w × (rail + d + rise); the landing's north edge at y = rail. back: the
   landing, treads and risers, foot y = rail (ducks walk on it); front: the side railings, foot y = rail + d. */
export function deckStairs({
  w = 200,
  d = 700,
  rise = 240,
  steps = 12,
  landing = 150,
  rail = 50,
  h,
} = {}) {
  h = h || rail + d + rise;
  const Y = rail,
    td = (d - landing) / steps,
    r = rise / steps;
  let back =
    R(0, Y, w, landing, "#c06d30", ln(2.4)) +
    F`<path d="M44 ${Y}V${Y + landing}M88 ${Y}V${Y + landing}M132 ${Y}V${Y + landing}M176 ${Y}V${Y + landing}" stroke="#7a3d14" stroke-width="2"/>`;
  /* going down, out of the deck's light, the steps get a little darker (from a third of the way down, 15% at the bottom) */
  const dk = (hex, f) =>
    "#" +
    [1, 3, 5]
      .map((k) =>
        Math.round(parseInt(hex.slice(k, k + 2), 16) * (1 - f))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  for (let i = 1; i <= steps; i++) {
    const y = Y + landing + (i - 1) * td,
      f = 0.15 * Math.max(0, (i - steps / 3) / (steps - steps / 3));
    back +=
      R(10, y + (i - 1) * r, w - 20, r, dk("#7e3f18", f), ln(2)) +
      R(10, y + i * r, w - 20, td, dk("#c46f31", f), ln(2)) +
      R(12, y + i * r + 2, w - 24, 4, "#f0a060", F`opacity="${0.45 - f}"`);
  }
  let front = "";
  for (const x of [5, w - 5]) {
    front +=
      R(x - 6, Y - rail, 12, d + rise, "#d98a4a", ln(2.2)) +
      R(x - 2, Y - rail + 2, 3, d + rise - 4, "#f0b070", 'opacity=".5"');
    for (const y of [
      Y - rail - 6,
      Y + landing - rail - 6,
      Y + d + rise - rail - 6,
    ])
      front += R(x - 9, y, 18, 14, "#a65a2c", ln(2));
  }
  return pair(w, h, [back], [front], Y, Y + d);
}
/* a rocking chair, side-on (facing 'e' or 'w'), with a plaid cushion. Foot: bottom (y = h − 4). */
export function rockingChair({ w = 70, h = 100, facing = "e" } = {}) {
  const b = h - 4,
    wood = "#c06d30",
    sx = w / 70,
    sy = h / 100;
  const P = (x, y) => F`${x * sx} ${y * sy}`;
  let s =
    shade(w / 2, b, w * 0.42, 5) +
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  const path = `M${P(4, 84)}Q${P(34, 100)} ${P(68, 80)}M${P(20, 56)}L${P(16, 88)}M${P(54, 56)}L${P(56, 88)}M${P(14, 58)}L${P(6, 10)}M${P(10, 34)}L${P(56, 38)}L${P(54, 56)}`;
  s += `<path d="${path}" stroke="${O}" stroke-width="10"/><path d="${path}" stroke="${wood}" stroke-width="5.5"/></g>`;
  s += F`<path d="M${P(8, 14)}L${P(14, 52)}" stroke="#e09a5c" stroke-width="2" opacity=".6"/><path d="M${P(9, 18)}h${10 * sx}M${P(10, 30)}h${10 * sx}" stroke="${O}" stroke-width="3"/>`;
  s +=
    R(10 * sx, 50 * sy, 50 * sx, 9 * sy, "#a65a2c", `rx="3" ${ln(2)}`) +
    R(12 * sx, 42 * sy, 44 * sx, 10 * sy, "#c4302b", `rx="5" ${ln(2)}`) +
    F`<path d="M${P(22, 42)}v${10 * sy}M${P(38, 42)}v${10 * sy}" stroke="#ffd23f" stroke-width="2.4"/>`;
  return wrap(
    w,
    h,
    facing === "w"
      ? F`<g transform="translate(${w} 0) scale(-1 1)">${s}</g>`
      : s,
    "hg-rocker",
  );
}
/* a little round table with a lantern and two mugs. Footprint w × w, 40 high. Foot: y = h. */
export function smallTable({ w = 60, h = 130 } = {}) {
  const id = uid(),
    cx = w / 2,
    Y = h - w,
    cy = Y + w / 2 - 40;
  return wrap(
    w,
    h,
    shade(cx, Y + w / 2, w * 0.45, w * 0.25, 0.3) +
      R(cx - 5, cy, 10, 44, "#8a4a22", ln(2)) +
      F`<ellipse cx="${cx}" cy="${Y + w / 2 + 2}" rx="${w * 0.28}" ry="6" fill="#6e3a1a" ${ln(1.8)}/><circle cx="${cx}" cy="${cy}" r="${w / 2}" fill="#c47a3e" ${ln(2.4)}/><circle cx="${cx - 6}" cy="${cy - 6}" r="${w / 3}" fill="#e09a5c" opacity=".35"/>` +
      F`<circle cx="${cx}" cy="${cy - 24}" r="40" fill="url(#${id})" class="hg-flicker hg-l"/><rect x="${cx - 7}" y="${cy - 30}" width="14" height="20" rx="3" fill="#ffd98a" class="hg-lg" ${ln(1.8)}/><path d="M${cx - 9} ${cy - 31}h18M${cx} ${cy - 31}v-6" stroke="${O}" stroke-width="2.6"/>` +
      F`<rect x="${cx - 22}" y="${cy - 2}" width="9" height="10" rx="2" fill="#2fa4ff" ${ln(1.4)}/><rect x="${cx + 12}" y="${cy + 2}" width="9" height="10" rx="2" fill="#ef3b3b" ${ln(1.4)}/>`,
    "hg-smalltable",
    glowDef(id, "#ffb347", 0.5),
  );
}

/* ---------- the pool ---------- */
/* the pool: stone coping c wide, the water depth below the ground, lit by lights under the water, steps at its west end,
   a ladder at its east end. Footprint w × d. back: the coping, the far wall and the water (flat), foot null;
   front: the near coping, foot y = h. The water shows from y = c + depth to y = d − c. */
export function pool({
  w = 1800,
  d = 800,
  h,
  depth = 40,
  c = 30,
  lights = 5,
} = {}) {
  h = h || d;
  const id = uid(),
    ww = w - 2 * c,
    wy = c + depth,
    wb = d - c;
  let s =
    R(0, 0, w, d, "#8a8e94", `rx="18" ${ln(3)}`) +
    R(c, c, ww, d - 2 * c, "#0b3f5c", ln(2.4));
  s +=
    R(c, c, ww, depth, `url(#${id}t)`) +
    R(c, c, ww, depth, `url(#${id}k)`) +
    R(c, c, ww, depth, "#000", 'opacity=".1"');
  s += R(c, wy, ww, wb - wy, `url(#${id}w)`);
  let lamps = "";
  for (let i = 0; i < lights; i++) {
    const x = c + (ww * (i + 0.5)) / lights;
    lamps += F`<ellipse cx="${x}" cy="${wy + 70}" rx="190" ry="150" fill="url(#${id}g)" class="hg-shimmer" style="animation-delay:-${(i * 1.3).toFixed(1)}s"/><ellipse cx="${x + ww / lights / 2}" cy="${wb - 40}" rx="170" ry="110" fill="url(#${id}g)" opacity=".7"/>`;
    s += F`<ellipse cx="${x}" cy="${c + depth * 0.55}" rx="15" ry="8" fill="#f2ffff" ${ln(2)}/><ellipse cx="${x}" cy="${c + depth * 0.55}" rx="7" ry="3.5" fill="#fff"/>`;
  }
  s += lamps;
  /* the pool floor's lane lines, seen through the water */
  const lane = (x) =>
    F`<path d="M${x} ${wy + 70}V${wb - 60}M${x - 30} ${wy + 70}H${x + 30}M${x - 30} ${wb - 60}H${x + 30}" stroke="#0a4f73" stroke-width="16" opacity=".45"/>`;
  s += lane(c + ww * 0.25) + lane(c + ww * 0.75);
  s +=
    R(c, wy, ww, wb - wy, `url(#${id}a)`, 'class="hg-shimmer"') +
    R(
      c,
      wy,
      ww,
      wb - wy,
      `url(#${id}b)`,
      'class="hg-shimmer" style="animation-delay:-1.8s"',
    );
  /* the steps at the west end */
  for (let k = 0; k < 3; k++)
    s +=
      R(
        c + k * 44,
        wy + 10,
        44,
        Math.min(300, wb - wy - 20),
        "#6fe0f4",
        `opacity="${0.32 - k * 0.08}"`,
      ) +
      F`<path d="M${c + (k + 1) * 44} ${wy + 10}V${wy + 10 + Math.min(300, wb - wy - 20)}" stroke="#e8fbff" stroke-width="4" opacity=".75"/>`;
  s += F`<path d="M${c} ${wy + 10 + Math.min(300, wb - wy - 20)}H${c + 132}" stroke="#e8fbff" stroke-width="3" opacity=".5"/>`;
  /* the ladder at the east end */
  for (const x of [w - 300, w - 252])
    s += F`<path d="M${x} ${c + 14}C${x} ${c - 34} ${x + 26} ${c - 34} ${x + 26} ${c + 26}V${c + depth + 26}" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x} ${c + 14}C${x} ${c - 34} ${x + 26} ${c - 34} ${x + 26} ${c + 26}V${c + depth + 26}" stroke="#d9e1ea" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  let joints = "";
  for (let x = 60; x < w - 20; x += 60) joints += F`M${x} 2V${c - 2}`;
  for (let y = c + 60; y < d - c; y += 60)
    joints += F`M2 ${y}H${c - 2}M${w - c + 2} ${y}H${w - 2}`;
  s +=
    `<path d="${joints}" stroke="#5e6268" stroke-width="2"/>` +
    R(4, 4, w - 8, 5, "#fff", 'rx="2" opacity=".15"') +
    R(c * 2, 8, 60, 14, "#3e4248", `rx="3" ${ln(1.6)}`);
  const defs =
    F`<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b9cc4"/><stop offset=".5" stop-color="#127fa8"/><stop offset="1" stop-color="#0b5f88"/></linearGradient>` +
    `<linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ee3ef"/><stop offset="1" stop-color="#3fb8d6"/></linearGradient>` +
    F`<pattern id="${id}k" width="24" height="${depth}" patternUnits="userSpaceOnUse" x="${c}" y="${c}"><path d="M0 .5H24M.5 0V${depth}M0 ${depth / 2}H24" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.4"/></pattern>` +
    glowDef(id + "g", "#8ff6ff", 0.6) +
    `<pattern id="${id}a" width="140" height="70" patternUnits="userSpaceOnUse"><path d="M0 20Q35 4 70 20T140 20M0 55Q35 40 70 55T140 55M20 0Q30 35 15 70M95 0Q110 35 90 70" stroke="#c8fbff" stroke-width="2.2" fill="none" opacity=".35"/></pattern>` +
    `<pattern id="${id}b" width="180" height="90" patternUnits="userSpaceOnUse" patternTransform="translate(40 20)"><path d="M0 30Q45 10 90 30T180 30M0 75Q45 55 90 75T180 75M50 0Q65 45 45 90" stroke="#e2fdff" stroke-width="1.8" fill="none" opacity=".3"/></pattern>`;
  let fj = "";
  for (let x = 60; x < w - 20; x += 60) fj += F`M${x} ${d - c + 2}V${d - 2}`;
  const front =
    F`<path d="M0 ${wb}H${w}V${d - 18}Q${w} ${d} ${w - 18} ${d}H18Q0 ${d} 0 ${d - 18}Z" fill="#8a8e94" ${ln(3)}/><path d="${fj}" stroke="#5e6268" stroke-width="2"/>` +
    R(c, wb - 2, ww, 6, "#5e6268") +
    R(4, wb + 4, w - 8, 4, "#fff", 'rx="2" opacity=".15"');
  return pair(w, h, [s, defs], [front], null, h);
}
/* the lane rope across the pool (north to south): floats on a line, red near the ends. Drawn under every duck.
   Anchor: flat (draw it above the water, below every duck and everything they wear). */
export function laneRope({ w = 22, h = 740 } = {}) {
  const n = Math.floor((h - 12) / 14);
  let s = F`<path d="M${w / 2} 4V${h - 4}" stroke="${O}" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) {
    const y = 10 + (i * (h - 20)) / (n - 1),
      c = i < 5 || i >= n - 5 ? "#ef3b3b" : i % 2 ? "#f4f4f0" : "#2fa4ff";
    s += F`<ellipse cx="${w / 2}" cy="${y}" rx="${w / 2 - 1}" ry="6.5" fill="${c}" ${ln(1.6)}/><ellipse cx="${w / 2 - 3}" cy="${y - 2}" rx="3" ry="1.6" fill="#fff" opacity=".6"/>`;
  }
  return wrap(
    w,
    h,
    s +
      F`<circle cx="${w / 2}" cy="4" r="5" fill="#c9ced6" ${ln(1.6)}/><circle cx="${w / 2}" cy="${h - 4}" r="5" fill="#c9ced6" ${ln(1.6)}/>`,
    "hg-ground hg-rope",
  );
}
/* a little rubber duck floating (facing 'e' or 'w'), with a ripple. Foot: the waterline (y = h − 5). */
export function rubberDuck({
  w = 28,
  h = 26,
  color = "#ffd23f",
  facing = "e",
} = {}) {
  const b = h - 5,
    k = w / 28,
    edge = mix(color, 0, 0.45);
  const g =
    F`<ellipse cx="${w / 2}" cy="${b}" rx="${13 * k}" ry="${3.4 * k}" fill="none" stroke="#c8fbff" stroke-width="1.6" opacity=".7"/>` +
    F`<path d="M${3 * k} ${b - 9 * k}C${2 * k} ${b - 2 * k} ${7 * k} ${b} ${14 * k} ${b}C${22 * k} ${b} ${25 * k} ${b - 4 * k} ${24 * k} ${b - 9 * k}H${12 * k}C${9 * k} ${b - 9 * k} ${6 * k} ${b - 8 * k} ${3 * k} ${b - 11 * k}Z" fill="${color}" stroke="${edge}" stroke-width="1.4"/>` +
    F`<circle cx="${18 * k}" cy="${b - 14 * k}" r="${5.5 * k}" fill="${color}" stroke="${edge}" stroke-width="1.4"/><path d="M${23 * k} ${b - 14.5 * k}l${4.5 * k} ${1 * k}l${-4.5 * k} ${2.2 * k}Z" fill="#ff9a1f" stroke="#a85a00" stroke-width=".8"/><circle cx="${19.5 * k}" cy="${b - 15.5 * k}" r="${1.1 * k}" fill="${O}"/><ellipse cx="${16 * k}" cy="${b - 17 * k}" rx="${1.8 * k}" ry="${1 * k}" fill="#fff" opacity=".7"/>`;
  return wrap(
    w,
    h,
    facing === "w"
      ? F`<g transform="translate(${w} 0) scale(-1 1)">${g}</g>`
      : g,
    "hg-rduck",
  );
}
/* the beach ball (spin: degrees). Foot: the bottom (y = h − 3); shadow: false leaves out its shadow (the world can draw
   it on the ground under a ball in the air). */
export function beachBall({ w = 48, h = 52, spin = 0, shadow = true } = {}) {
  const id = uid(),
    r = w / 2 - 1.5,
    cx = w / 2,
    cy = h - 3 - r,
    cols = ["#ef3b3b", "#f4f4f0", "#2fa4ff", "#ffd23f", "#f4f4f0", "#37d421"];
  const px = cx - r * 0.25,
    py = cy - r * 0.35;
  let wedges = "";
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2,
      a1 = ((i + 1) / 6) * Math.PI * 2;
    wedges += F`<path d="M${px} ${py}L${px + Math.cos(a0) * r * 3} ${py + Math.sin(a0) * r * 3}L${px + Math.cos(a1) * r * 3} ${py + Math.sin(a1) * r * 3}Z" fill="${cols[i]}"/>`;
  }
  return wrap(
    w,
    h,
    (shadow ? shade(cx, h - 3, r * 0.9, r * 0.25) : "") +
      F`<g clip-path="url(#${id})"><g transform="rotate(${spin} ${cx} ${cy})">${wedges}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}s)"/></g><circle cx="${px}" cy="${py}" r="${r * 0.16}" fill="#f4f4f0" ${ln(1.2)}/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${ln(2)}/><ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.45}" rx="${r * 0.28}" ry="${r * 0.14}" fill="#fff" opacity=".7" transform="rotate(-30 ${cx - r * 0.35} ${cy - r * 0.45})"/>`,
    "hg-ball",
    F`<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><radialGradient id="${id}s" cx=".35" cy=".3" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`,
  );
}
