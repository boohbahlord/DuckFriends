/* ---------- the yard: ground, trees, lamps, fire, trampoline, soccer, jeep ----------
   Moved out of art.js to keep that file small (a pure move; the owner's, Nov 22). */
import { mix } from "../duck.js";

import { JEEP } from "./vehicles.js";

import {
  F,
  O,
  R,
  fire,
  glowDef,
  ln,
  pair,
  rnd,
  shade,
  uid,
  wrap,
} from "./artbase.js";

/* ---------- the ground ---------- */
const GROUND = {
  grass: {
    base: "#24503d",
    tuft: "#33694f",
    dark: "#1b4031",
    patch: "#2a5944",
  },
  downhill: {
    base: "#1f4636",
    tuft: "#2c5c47",
    dark: "#18392b",
    patch: "#24503f",
  },
  slope: {
    base: "#1a3a2e",
    tuft: "#24503f",
    dark: "#132c22",
    patch: "#1e4334",
  },
  forest: {
    base: "#14301f",
    tuft: "#1d4230",
    dark: "#0f2418",
    patch: "#3a2e1f",
  },
};
function groundTile(kind, r) {
  const tufts = (n, W, H, c) => {
    let p = "";
    for (let i = 0; i < n; i++) {
      const x = 8 + r() * (W - 16),
        y = 14 + r() * (H - 20),
        l = 6 + r() * 4;
      p += F`M${x} ${y}l${-2.5 - r() * 2} ${-l}M${x} ${y}l${r()} ${-l - 2}M${x} ${y}l${2.5 + r() * 2} ${-l + 1}`;
    }
    return `<path d="${p}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  };
  const dots = (n, W, H, c, s, o) => {
    let p = "";
    for (let i = 0; i < n; i++)
      p += F`<ellipse cx="${s + r() * (W - 2 * s)}" cy="${s + r() * (H - 2 * s)}" rx="${s * (0.6 + r() * 0.8)}" ry="${s * (0.4 + r() * 0.5)}" fill="${c}" opacity="${o}"/>`;
    return p;
  };
  if (kind === "grass" || kind === "downhill") {
    // a bigger tile, so it doesn't show a pattern: dark and light patches, tufts big and small
    const G = GROUND[kind],
      W = 400,
      H = 400;
    const blob = (n, c, s, o) => {
      let p = "";
      for (let i = 0; i < n; i++) {
        const x = s + r() * (W - 2 * s),
          y = s + r() * (H - 2 * s),
          rx = s * (0.7 + r() * 0.9),
          ry = rx * (0.45 + r() * 0.2);
        p += F`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${o}"/><ellipse cx="${x + rx * 0.35}" cy="${y - ry * 0.2}" rx="${rx * 0.6}" ry="${ry * 0.7}" fill="${c}" opacity="${o * 0.8}"/>`;
      }
      return p;
    };
    const tuftsAt = (n, c, k) => {
      let p = "";
      for (let i = 0; i < n; i++) {
        const x = 10 + r() * (W - 20),
          y = 16 + r() * (H - 22),
          l = (5 + r() * 5) * k;
        p += F`M${x} ${y}l${-2.5 * k - r() * 2} ${-l}M${x} ${y}l${r()} ${-l - 2 * k}M${x} ${y}l${2.5 * k + r() * 2} ${-l + 1}`;
      }
      return `<path d="${p}" stroke="${c}" stroke-width="${k > 1 ? 2.4 : 1.8}" fill="none" stroke-linecap="round"/>`;
    };
    let b =
      R(0, 0, W, H, G.base) +
      blob(5, G.dark, 40, 0.45) +
      blob(4, G.patch, 34, 0.55) +
      dots(26, W, H, G.dark, 3.5, 0.55) +
      tuftsAt(26, G.dark, 1) +
      tuftsAt(30, G.tuft, 1) +
      tuftsAt(10, G.tuft, 1.4) +
      tuftsAt(8, "#4a8566", 0.9);
    if (kind === "grass")
      for (let i = 0; i < 5; i++) {
        const x = 20 + r() * (W - 40),
          y = 20 + r() * (H - 40);
        b += F`<g opacity=".7"><circle cx="${x}" cy="${y}" r="1.6" fill="#cfd8ff"/><circle cx="${x + 4}" cy="${y + 2}" r="1.3" fill="#cfd8ff"/><circle cx="${x + 1}" cy="${y + 4}" r="1.3" fill="#cfd8ff"/></g>`;
      } // (little pale flowers, blue in the moonlight)
    return [W, H, b];
  }
  if (GROUND[kind]) {
    const G = GROUND[kind],
      W = 200,
      H = 200;
    let b =
      R(0, 0, W, H, G.base) +
      dots(4, W, H, G.patch, 26, 0.5) +
      dots(10, W, H, G.dark, 4, 0.6) +
      tufts(kind === "slope" ? 8 : 15, W, H, G.tuft);
    if (kind === "slope")
      b += `<path d="M0 60C50 48 150 72 200 60M0 150C50 140 150 162 200 150" stroke="${G.dark}" stroke-width="7" fill="none" opacity=".8"/>`;
    if (kind === "forest") b += dots(12, W, H, "#5a4128", 2.5, 0.55);
    return [W, H, b];
  }
  if (kind === "dirt")
    return [
      160,
      160,
      R(0, 0, 160, 160, "#5d4533") +
        dots(6, 160, 160, "#4b3628", 14, 0.6) +
        dots(16, 160, 160, "#7a6150", 3, 0.7) +
        dots(10, 160, 160, "#3e2c20", 2.4, 0.7),
    ];
  if (kind === "wood") {
    // the cabin's floor: planks that run east-west, of mixed lengths and tones, with grain, nails and a few knots
    const TW = 720,
      rows = 8,
      ph = 24,
      tones = [
        "#9c5d2c",
        "#93552a",
        "#a46634",
        "#8c4f26",
        "#a0602f",
        "#97582b",
      ];
    let b = "";
    for (let i = 0; i < rows; i++) {
      const y = i * ph,
        js = [];
      for (let x = r() * 120; x < TW; x += 130 + r() * 170) js.push(x); // the joints (the row wraps round the tile)
      for (let k = 0; k < js.length; k++) {
        const x0 = js[k],
          x1 = k + 1 < js.length ? js[k + 1] : js[0] + TW,
          tone = tones[Math.floor(r() * tones.length)];
        let g =
          R(x0, y, x1 - x0, ph, tone) +
          R(x0, y + 2, x1 - x0, 3, "#ffd9a0", 'opacity=".07"');
        for (let n = 0; n < 2; n++) {
          const gy = y + 7 + n * 8 + r() * 4,
            gx = x0 + 10 + r() * 20,
            gl = (x1 - x0) * (0.4 + r() * 0.45);
          g += F`<path d="M${gx} ${gy}q${gl / 3} ${-2 + r() * 4} ${gl / 2} 0t${gl / 2} ${-1 + r() * 2}" stroke="#6a3818" stroke-width="1" fill="none" opacity="${0.35 + r() * 0.25}"/>`;
        }
        if (r() < 0.22) {
          const kx = x0 + 30 + r() * Math.max(10, x1 - x0 - 60),
            ky = y + 8 + r() * 8;
          g += F`<ellipse cx="${kx}" cy="${ky}" rx="6" ry="3.4" fill="#6e3c1a" opacity=".75"/><ellipse cx="${kx}" cy="${ky}" rx="10" ry="5.5" fill="none" stroke="#6e3c1a" stroke-width="1" opacity=".45"/>`;
        }
        g += F`<path d="M${x0} ${y}V${y + ph}" stroke="#5e3214" stroke-width="2"/><circle cx="${x0 + 6}" cy="${y + 7}" r="1.3" fill="#3e200c"/><circle cx="${x0 + 6}" cy="${y + 17}" r="1.3" fill="#3e200c"/><circle cx="${x1 - 6}" cy="${y + 7}" r="1.3" fill="#3e200c"/><circle cx="${x1 - 6}" cy="${y + 17}" r="1.3" fill="#3e200c"/>`;
        b += g + (x1 > TW ? `<g transform="translate(${-TW} 0)">${g}</g>` : "");
      }
      b += F`<path d="M0 ${y + ph - 1}H${TW}" stroke="#5e3214" stroke-width="2"/>`;
    }
    return [TW, rows * ph, b];
  }
  if (kind === "tile")
    return [
      80,
      80,
      R(0, 0, 80, 80, "#d9c9a6") +
        R(0, 0, 40, 40, "#b9744a") +
        R(40, 40, 40, 40, "#b9744a") +
        '<path d="M0 .5H80M0 40H80M.5 0V80M40 0V80" stroke="#6e4b33" stroke-width="2"/>',
    ];
  if (kind === "bath")
    return [
      36,
      36,
      R(0, 0, 36, 36, "#9fc9d2") +
        R(0, 0, 18, 18, "#b6dbe2") +
        R(18, 18, 18, 18, "#b6dbe2") +
        '<path d="M0 .5H36M0 18H36M.5 0V36M18 0V36" stroke="#e8f4f6" stroke-width="1.6"/>',
    ];
  if (kind === "pavers")
    return [
      160,
      80,
      R(0, 0, 160, 80, "#2c3036") +
        '<g stroke="#2b2e34" stroke-width="1.5"><rect x="2" y="2" width="76" height="36" rx="5" fill="#535a62"/><rect x="82" y="2" width="76" height="36" rx="5" fill="#4d535b"/><rect x="-38" y="42" width="76" height="36" rx="5" fill="#575e66"/><rect x="42" y="42" width="76" height="36" rx="5" fill="#50565e"/><rect x="122" y="42" width="76" height="36" rx="5" fill="#575e66"/></g><path d="M8 6h30M88 6h40M48 46h40" stroke="#fff" stroke-width="3" opacity=".08"/>',
    ];
  return groundTile("grass", r);
}
/* a patch of ground filling the box: grass (the highground), slope (the darker decline, darkest in its middle),
   downhill, forest (the floor under the trees), dirt, wood (the cabin floor), tile (the kitchen), bath, pavers (around
   the pool). Anchor: flat (ground layer). */
export function ground({ w = 400, h = 300, kind = "grass", seed = 1 } = {}) {
  const id = uid(),
    [tw, th, body] = groundTile(kind, rnd(seed * 97 + kind.length));
  let over = "",
    defs = F`<pattern id="${id}" width="${tw}" height="${th}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  if (kind === "slope") {
    // the decline darkens toward its middle and meets the downhill's green at its foot
    defs += `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24503d" stop-opacity=".9"/><stop offset=".25" stop-color="#24503d" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity=".22"/><stop offset=".85" stop-color="#1f4636" stop-opacity="0"/><stop offset="1" stop-color="#1f4636" stop-opacity=".9"/></linearGradient>`;
    over = R(0, 0, w, h, `url(#${id}s)`);
  }
  return wrap(w, h, R(0, 0, w, h, `url(#${id})`) + over, "hg-ground", defs);
}
/* the dirt path: pts in box px (default straight across the middle), width across; tire ruts and a grassy middle.
   Anchor: flat. */
export function dirtPath({
  w = 1000,
  h = 160,
  pts,
  width = h * 0.82,
  seed = 3,
} = {}) {
  const id = uid(),
    [tw, th, body] = groundTile("dirt", rnd(seed)),
    P = pts || [
      [0, h / 2],
      [w, h / 2],
    ];
  const d = "M" + P.map((p) => F`${p[0]} ${p[1]}`).join("L");
  const off = width * 0.22;
  return wrap(
    w,
    h,
    F`<path d="${d}" stroke="#16301f" stroke-width="${width + 14}" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/><path d="${d}" stroke="url(#${id})" stroke-width="${width}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` +
      F`<path d="${d}" stroke="#463224" stroke-width="${width * 0.13}" fill="none" stroke-linejoin="round" transform="translate(0 ${-off})" opacity=".5"/><path d="${d}" stroke="#463224" stroke-width="${width * 0.13}" fill="none" stroke-linejoin="round" transform="translate(0 ${off})" opacity=".5"/>` +
      F`<path d="${d}" stroke="#2c5238" stroke-width="${width * 0.12}" fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="3 9 14 7 6 12" opacity=".55"/>`,
    "hg-ground",
    F`<pattern id="${id}" width="${tw}" height="${th}" patternUnits="userSpaceOnUse">${body}</pattern>`,
  );
}
/* a pool of light on the ground (a window, a door, a fire), filling the box. Anchor: flat. */
export function glow({
  w = 300,
  h = 200,
  color = "#ffb347",
  a = 0.45,
  flicker = false,
} = {}) {
  const id = uid();
  return wrap(
    w,
    h,
    F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="url(#${id})"${flicker ? ' class="hg-flicker"' : ""}/>`,
    "hg-ground",
    glowDef(id, color, a),
  );
}
/* a rug: oval (braided rings), round, or rect (a woven one with a fringe). Anchor: flat. */
export function rug({
  w = 300,
  h = 200,
  kind = "oval",
  colors = ["#a8402e", "#e0a84a", "#3e6d8c", "#7a8f3a"],
} = {}) {
  if (kind === "rect") {
    let fr = "";
    for (let y = 8; y < h - 6; y += 9) fr += F`M0 ${y}h10M${w - 10} ${y}h10`;
    let dia = "";
    const n = Math.max(1, Math.round((w - 80) / 70));
    for (let i = 0; i < n; i++) {
      const cx = 40 + ((w - 80) * (i + 0.5)) / n,
        cy = h / 2,
        s = Math.min(26, h * 0.22);
      dia += F`<path d="M${cx} ${cy - s}L${cx + s} ${cy}L${cx} ${cy + s}L${cx - s} ${cy}Z" fill="${colors[1]}" stroke="${colors[3]}" stroke-width="3"/>`;
    }
    return wrap(
      w,
      h,
      F`<path d="${fr}" stroke="#e8d9b8" stroke-width="2.4"/>` +
        R(10, 0, w - 20, h, colors[0], `rx="6" ${ln(2.4)}`) +
        R(22, 12, w - 44, h - 24, colors[2], 'rx="3"') +
        R(
          30,
          20,
          w - 60,
          h - 40,
          "none",
          `stroke="${colors[1]}" stroke-width="4" stroke-dasharray="10 6"`,
        ) +
        dia,
      "hg-ground",
    );
  }
  const rings = Math.max(3, Math.floor(Math.min(w, h) / 2 / 13));
  let b = F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 1}" ry="${h / 2 - 1}" fill="${colors[0]}" ${ln(2.4)}/>`;
  for (let i = 1; i < rings; i++)
    b += F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - i * 13}" ry="${h / 2 - i * 13}" fill="${colors[i % colors.length]}" stroke="#00000033" stroke-width="2" stroke-dasharray="7 4"/>`;
  return wrap(
    w,
    h,
    b +
      F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 1}" ry="${h / 2 - 1}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="6" stroke-dasharray="7 4"/>`,
    "hg-ground",
  );
}

/* ---------- trees ---------- */
export const TREE_KINDS = {
  pine: [120, 250],
  fir: [160, 220],
  spruce: [96, 300],
  oak: [210, 230],
  birch: [140, 240],
  bush: [100, 64],
};
/* one tree drawn into w × h with its trunk's foot at (w/2, h − 8) */
function treeBody(kind, w, h, seed = 1) {
  const cx = w / 2,
    b = h - 8,
    r = rnd(seed);
  if (kind === "pine" || kind === "fir" || kind === "spruce") {
    const [n, c0, c1, tw, th] = {
      pine: [4, "#1d4536", "#2b604a", 0.16, 0.13],
      fir: [4, "#21503c", "#30705a", 0.18, 0.1],
      spruce: [5, "#1c4240", "#2a5e5b", 0.12, 0.11],
    }[kind];
    let out = F`<rect x="${cx - (w * tw) / 2}" y="${b - h * 0.22}" width="${w * tw}" height="${h * 0.22}" rx="2" fill="#5b3b24" ${ln(2.2)}/><rect x="${cx - (w * tw) / 2 + 2}" y="${b - h * 0.22}" width="${w * tw * 0.35}" height="${h * 0.22 - 2}" fill="#7a5235"/>`;
    const top = h * 0.02,
      bot = b - h * th;
    for (let i = n - 1; i >= 0; i--) {
      const t0 = top + (bot - top) * (i / (n + 0.6)),
        yb = top + (bot - top) * ((i + 1.6) / (n + 0.6)),
        hw = w * 0.5 * (0.4 + (0.6 * (i + 1)) / n) - 2,
        d = h * 0.035;
      out +=
        F`<path d="M${cx} ${t0}L${cx - hw} ${yb}Q${cx - hw * 0.66} ${yb - d} ${cx - hw * 0.33} ${yb + d * 0.3}Q${cx} ${yb - d} ${cx + hw * 0.33} ${yb + d * 0.3}Q${cx + hw * 0.66} ${yb - d} ${cx + hw} ${yb}Z" fill="${c0}" ${ln(2.4)}/>` +
        F`<path d="M${cx - 1} ${t0 + 5}L${cx - hw + 6} ${yb - 3}Q${cx - hw * 0.66} ${yb - d - 2} ${cx - hw * 0.36} ${yb - 2}L${cx - hw * 0.08} ${t0 + (yb - t0) * 0.5}Z" fill="${c1}"/>`;
    }
    return out;
  }
  if (kind === "bush") {
    const C = [
      [-0.26, 0.62, 0.3],
      [0.24, 0.6, 0.32],
      [0, 0.42, 0.36],
    ].map(([dx, dy, rr]) => [cx + dx * w, dy * h, rr * w * 0.7]);
    return (
      C.map(
        ([x, y, rr]) =>
          F`<circle cx="${x}" cy="${y}" r="${rr}" fill="#22503a" ${ln(2.4)}/>`,
      ).join("") +
      C.map(
        ([x, y, rr]) =>
          F`<circle cx="${x}" cy="${y}" r="${rr - 1.3}" fill="#22503a"/><circle cx="${x - rr * 0.25}" cy="${y - rr * 0.3}" r="${rr * 0.5}" fill="#2f6a4c"/>`,
      ).join("")
    );
  }
  const birch = kind === "birch",
    c0 = birch ? "#3c6b3a" : "#284f34",
    c1 = birch ? "#548a4a" : "#386b45";
  const tk = birch ? "#e6e1d6" : "#5a3a24",
    tw = w * (birch ? 0.07 : 0.1);
  const fork = F`M${cx} ${h * 0.56}L${cx - w * 0.16} ${h * 0.34}M${cx} ${h * 0.58}L${cx + w * 0.14} ${h * 0.3}`;
  let out =
    `<path d="${fork}" stroke="${O}" stroke-width="${tw * 0.8 + 5}" fill="none" stroke-linecap="round"/><path d="${fork}" stroke="${tk}" stroke-width="${tw * 0.8}" fill="none" stroke-linecap="round"/>` +
    F`<path d="M${cx - tw} ${b}Q${cx - tw * 0.55} ${h * 0.7} ${cx - tw * 0.6} ${h * 0.46}H${cx + tw * 0.6}Q${cx + tw * 0.55} ${h * 0.7} ${cx + tw} ${b}Z" fill="${tk}" ${ln(2.2)}/>` +
    (birch
      ? ""
      : F`<path d="M${cx - tw * 0.55} ${b - 4}Q${cx - tw * 0.3} ${h * 0.7} ${cx - tw * 0.35} ${h * 0.5}" stroke="#7a5235" stroke-width="3" fill="none"/>`);
  if (birch)
    for (let y = b - 16; y > h * 0.52; y -= 18 + r() * 10)
      out += F`<path d="M${cx - tw * 0.8 + r() * 3} ${y}h${tw * (0.5 + r() * 0.6)}" stroke="#2a2a30" stroke-width="3" stroke-linecap="round"/>`;
  const blobs = (
    birch
      ? [
          [0, 0.2, 0.21],
          [-0.24, 0.33, 0.17],
          [0.24, 0.32, 0.17],
          [-0.08, 0.44, 0.15],
          [0.14, 0.46, 0.14],
        ]
      : [
          [0, 0.2, 0.27],
          [-0.27, 0.34, 0.22],
          [0.27, 0.36, 0.22],
          [-0.1, 0.48, 0.2],
          [0.15, 0.5, 0.19],
          [-0.36, 0.5, 0.13],
          [0.37, 0.52, 0.13],
        ]
  ).map(([dx, dy, rr]) => [cx + dx * w, dy * h + 8, rr * w]);
  out +=
    blobs
      .map(
        ([x, y, rr]) =>
          F`<circle cx="${x}" cy="${y}" r="${rr}" fill="${c0}" ${ln(2.4)}/>`,
      )
      .join("") +
    blobs
      .map(
        ([x, y, rr]) =>
          F`<circle cx="${x}" cy="${y}" r="${rr - 1.3}" fill="${c0}"/>`,
      )
      .join("") +
    blobs
      .map(
        ([x, y, rr]) =>
          F`<circle cx="${x - rr * 0.28}" cy="${y - rr * 0.3}" r="${rr * 0.52}" fill="${c1}"/>`,
      )
      .join("");
  return out;
}
/* a tree: kind pine | fir | spruce | oak | birch | bush. back: its shadow (flat); front: the tree, foot at its trunk's
   foot (y = h − 8). */
export function tree({ kind = "pine", w, h, seed = 1 } = {}) {
  const [dw, dh] = TREE_KINDS[kind] || TREE_KINDS.pine;
  w = w || dw;
  h = h || dh;
  return pair(
    w,
    h,
    [shade(w / 2, h - 8, w * 0.42, w * 0.16, 0.35)],
    [treeBody(kind, w, h, seed)],
    null,
    h - 8,
  );
}
/* a band of forest, for the edges of the world where no duck goes: trees' feet fill y top … h (the box's top `top`
   px hold the crowns); each kind is drawn once and reused. Anchor: foot at y = top (a duck can only be north of it
   along the south edge, or south of every foot along the north edge). */
export function forest({
  w = 1200,
  h = 500,
  top = 300,
  seed = 5,
  density = 1,
  floor = true,
} = {}) {
  const id = uid(),
    r = rnd(seed),
    kinds = ["pine", "pine", "fir", "fir", "spruce", "spruce", "oak", "birch"];
  let defs = "";
  for (const k of new Set(kinds)) {
    const [tw, th] = TREE_KINDS[k];
    defs += F`<g id="${id}${k}"><g transform="translate(${-tw / 2} ${-(th - 8)})">${treeBody(k, tw, th, 3)}</g></g>`;
  }
  const trees = [];
  for (let y = top + 14; y < h + 10; y += 44 / density) {
    for (let x = -30 + r() * 50; x < w + 30; x += (62 + r() * 30) / density) {
      if (r() < 0.12) continue;
      trees.push([
        x + (r() - 0.5) * 20,
        Math.min(h, y + (r() - 0.5) * 26),
        kinds[Math.floor(r() * kinds.length)],
        0.78 + r() * 0.5,
      ]);
    }
  }
  trees.sort((a, b) => a[1] - b[1]);
  const fl = floor
    ? F`<path d="M0 ${top + 10}Q${w * 0.25} ${top - 14} ${w * 0.5} ${top + 6}T${w} ${top}V${h}H0Z" fill="#10261b" opacity=".85"/>`
    : "";
  const sh = trees
    .map(
      ([x, y, , s]) =>
        F`<ellipse cx="${x}" cy="${y}" rx="${44 * s}" ry="${16 * s}" fill="#000" opacity=".3"/>`,
    )
    .join("");
  const body = trees
    .map(
      ([x, y, k, s]) =>
        F`<use href="#${id}${k}" transform="translate(${x} ${y}) scale(${s})"/>`,
    )
    .join("");
  return wrap(w, h, fl + sh + body, "hg-forest", defs);
}

/* ---------- lights ---------- */
/* a lamppost (warm, flickering a little). back: the pool of light on the ground (flat); front: the post, foot at
   (w/2, h − 14). */
export function lamppost({ w = 140, h = 230 } = {}) {
  const id = uid(),
    cx = w / 2,
    b = h - 14,
    ly = b - 176;
  const back = F`<ellipse cx="${cx}" cy="${b}" rx="${w / 2}" ry="${w * 0.22}" fill="url(#${id})" class="hg-flicker"/>`;
  const front =
    shade(cx, b, 15, 5) +
    F`<circle cx="${cx}" cy="${ly + 16}" r="${w * 0.38}" fill="url(#${id}h)" class="hg-flicker lit-glow" style="animation-delay:-1.1s"/>` +
    F`<path d="M${cx - 12} ${b}h24l-4 -14h-16Z" fill="#2a2b35" ${ln(2.2)}/><rect x="${cx - 4}" y="${ly + 34}" width="8" height="${b - ly - 48}" fill="#30313c" ${ln(2.2)}/><rect x="${cx - 2.5}" y="${ly + 36}" width="2" height="${b - ly - 52}" fill="#5a5c6a"/>` +
    F`<path d="M${cx - 14} ${ly + 8}h28l-3 24h-22Z" fill="#ffd27a" class="lit" ${ln(2.2)}/><path d="M${cx - 9} ${ly + 10}h7l-1 20h-5Z" fill="#fff4cc" class="lit"/><path d="M${cx} ${ly + 8}V${ly + 32}" stroke="${O}" stroke-width="1.6"/>` +
    F`<path d="M${cx - 20} ${ly + 9}L${cx} ${ly - 6}L${cx + 20} ${ly + 9}Z" fill="#2a2b35" ${ln(2.2)}/><circle cx="${cx}" cy="${ly - 9}" r="3.5" fill="#2a2b35" ${ln(1.8)}/><rect x="${cx - 16}" y="${ly + 31}" width="32" height="5" rx="2" fill="#2a2b35" ${ln(1.8)}/>`;
  return pair(
    w,
    h,
    [back, glowDef(id, "#ffb347", 0.5)],
    [front, glowDef(id + "h", "#ffc46a", 0.55)],
    null,
    b,
  );
}
/* the power box (outside, by the cabin's west wall): a wooden post, a small grey transformer near its top (its wire runs
   off east into the cabin's wall), and a grey box at a duck's height with a big red lever on its right side. The lever
   shows up (.pb-up, the power on) or down (.pb-down); the light on the box is green or red (.pb-on / .pb-off); the dial
   on its door (.pb-ring, pathLength 100) counts down while the power can't go back on yet (power.js sets its
   stroke-dashoffset). Foot: y = h − 8. */
export function powerBox({ w = 80, h = 214 } = {}) {
  const cx = 34,
    b = h - 8,
    bt = b - 106,
    bb = b - 40,
    bx0 = cx - 24,
    bx1 = cx + 24,
    px = bx1,
    py = (bt + bb) / 2 - 2;
  const lever = (ang, cls) => {
    const r = (ang * Math.PI) / 180,
      ex = px + Math.cos(r) * 34,
      ey = py + Math.sin(r) * 34;
    return (
      F`<g class="${cls}"><path d="M${px} ${py}L${ex} ${ey}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${px} ${py}L${ex} ${ey}" stroke="#d23a3a" stroke-width="6" stroke-linecap="round"/>` +
      F`<circle cx="${ex}" cy="${ey}" r="8.5" fill="#e8463c" ${ln(2.2)}/><circle cx="${ex - 2.5}" cy="${ey - 2.5}" r="2.6" fill="#ffb3a8" opacity=".8"/></g>`
    );
  };
  let s = shade(cx, b, 22, 7);
  /* the post, its cap, the pipe from the box into the ground */
  s +=
    R(cx - 7, 14, 14, b - 14, "#8a5a32", ln(2.4)) +
    R(cx - 4, 18, 3, b - 22, "#b07a48", 'opacity=".7"') +
    R(cx - 9, 10, 18, 7, "#6e4424", `rx="2" ${ln(2)}`);
  s += R(cx + 9, bb, 7, b - bb - 2, "#5e626c", ln(1.8));
  /* the transformer: a ribbed can on the post, two white bushings, its wire off east (behind the cabin) */
  s +=
    F`<path d="M${cx + 4} 30Q${cx + 70} 46 ${cx + 130} 30" stroke="#2a2b35" stroke-width="2.4" fill="none"/><path d="M${cx - 6} 30Q${cx + 60} 52 ${cx + 130} 44" stroke="#2a2b35" stroke-width="2.4" fill="none"/>` +
    R(cx - 9, 28, 5, 9, "#ece6da", `rx="2" ${ln(1.4)}`) +
    R(cx + 2, 28, 5, 9, "#ece6da", `rx="2" ${ln(1.4)}`) +
    R(cx - 15, 36, 30, 40, "#8d939c", `rx="6" ${ln(2.4)}`) +
    F`<path d="M${cx - 7} 40V72M${cx} 40V72M${cx + 7} 40V72" stroke="#6c717b" stroke-width="2"/>` +
    F`<ellipse cx="${cx}" cy="37" rx="15" ry="4" fill="#b3b9c2" ${ln(2)}/>` +
    R(cx - 12, 46, 6, 22, "#c2c8d0", 'rx="2" opacity=".55"');
  /* the box: its top, its face and door, a warning sign, the light, the dial */
  s +=
    F`<path d="M${bx0} ${bt}L${bx0 + 6} ${bt - 8}H${bx1 + 6}L${bx1} ${bt}Z" fill="#a9afb8" ${ln(2.2)}/><path d="M${bx1} ${bt}L${bx1 + 6} ${bt - 8}V${bb - 8}L${bx1} ${bb}Z" fill="#5e636c" ${ln(2.2)}/>` +
    R(bx0, bt, bx1 - bx0, bb - bt, "#7d838d", `rx="3" ${ln(2.6)}`) +
    R(
      bx0 + 5,
      bt + 5,
      bx1 - bx0 - 10,
      bb - bt - 10,
      "none",
      `rx="2" stroke="#5a5f68" stroke-width="2"`,
    ) +
    F`<path d="M${bx0 + 14} ${bt + 9}L${bx0 + 22} ${bt + 23}H${bx0 + 6}Z" fill="#ffd23f" ${ln(1.6)}/><path d="M${bx0 + 15} ${bt + 12}l-3 6h3l-2 4l4 -6h-3l2 -4Z" fill="${O}"/>` +
    F`<circle cx="${bx1 - 10}" cy="${bt + 13}" r="4.5" fill="#3fd46b" class="pb-on" ${ln(1.6)}/><circle cx="${bx1 - 10}" cy="${bt + 13}" r="4.5" fill="#ef3b3b" class="pb-off" ${ln(1.6)}/>` +
    F`<circle cx="${cx - 4}" cy="${bb - 21}" r="10" fill="#2a2b35" ${ln(2)}/><circle cx="${cx - 4}" cy="${bb - 21}" r="6.5" fill="none" stroke="#ffd23f" stroke-width="4" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" opacity="0" transform="rotate(-90 ${cx - 4} ${bb - 21})" class="pb-ring"/>`;
  /* the lever on its boss: up (on) or down (off) */
  s +=
    lever(-48, "pb-up") +
    lever(48, "pb-down") +
    F`<circle cx="${px}" cy="${py}" r="6.5" fill="#4a4d56" ${ln(2)}/>`;
  return wrap(w, h, s, "hg-powerbox");
}
/* a floor lamp (inside): a warm shade on a pole, side-on. Foot: bottom (y = h − 6). */
export function floorLamp({ w = 70, h = 170 } = {}) {
  const id = uid(),
    cx = w / 2,
    b = h - 6;
  return wrap(
    w,
    h,
    shade(cx, b, 18, 5) +
      F`<circle cx="${cx}" cy="34" r="${w * 0.7}" fill="url(#${id})"/><ellipse cx="${cx}" cy="${b - 3}" rx="15" ry="5" fill="#3b2a1e" ${ln(2)}/><rect x="${cx - 3}" y="40" width="6" height="${b - 44}" fill="#6b4a2c" ${ln(2)}/>` +
      F`<path d="M${cx - 15} 14h30l9 34h-48Z" fill="#ffcf73" ${ln(2.4)}/><path d="M${cx - 12} 18h8l-3 26h-11Z" fill="#fff0c2" opacity=".85"/><path d="M${cx - 24} 48h48" stroke="#c9792f" stroke-width="4"/>`,
    "",
    glowDef(id, "#ffb347", 0.5),
  );
}

/* ---------- around the yard ---------- */
/* the campfire: a ring of stones, logs, a flickering fire, sparks. Footprint w × w (the ring), the flames rising above;
   box w × (w + 110). Foot: y = h. Give it a big glow() on the ground too. */
export function campfire({ w = 150, h } = {}) {
  h = h || w + 110;
  const id = uid(),
    Y = h - w,
    cx = w / 2,
    cy = Y + w / 2,
    rr = w * 0.39;
  const stone = (a) => {
    const x = cx + Math.cos(a) * rr,
      y = cy + Math.sin(a) * rr;
    return F`<ellipse cx="${x}" cy="${y}" rx="${w * 0.1}" ry="${w * 0.08}" fill="#5c6068" ${ln(2)}/><ellipse cx="${x - 2}" cy="${y - 4}" rx="${w * 0.07}" ry="${w * 0.045}" fill="#8a8f98"/>`;
  };
  const A = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2 + 0.2);
  let s =
    F`<circle cx="${cx}" cy="${cy}" r="${w * 0.8}" fill="url(#${id})" class="hg-flicker hg-f"/>` +
    A.filter((a) => Math.sin(a) < 0)
      .map(stone)
      .join("") +
    F`<circle cx="${cx}" cy="${cy}" r="${rr - 4}" fill="#2b2220" ${ln(2)}/><circle cx="${cx}" cy="${cy + 4}" r="${rr * 0.6}" fill="#ff7a1f" opacity=".45" class="hg-f"/>`;
  const logs = F`M${cx - rr * 0.8} ${cy + rr * 0.5}L${cx + 4} ${cy - rr * 1.2}M${cx + rr * 0.8} ${cy + rr * 0.5}L${cx - 4} ${cy - rr * 1.2}M${cx - rr * 0.3} ${cy + rr * 0.75}L${cx + 2} ${cy - rr * 1.1}M${cx + rr * 0.35} ${cy + rr * 0.75}L${cx - 2} ${cy - rr * 1.1}`;
  s += `<path d="${logs}" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="${logs}" stroke="#6b3f22" stroke-width="8.5" stroke-linecap="round"/>`;
  s += `<g class="hg-f">${fire(cx, cy + 8, (w / 150) * 1.05)}</g>`;
  s += A.filter((a) => Math.sin(a) >= 0)
    .map(stone)
    .join("");
  for (let i = 0; i < 4; i++)
    s += F`<circle cx="${cx - 10 + i * 7}" cy="${cy - 70}" r="2.2" fill="#ffd27a" class="hg-spark hg-f" style="animation-delay:-${(i * 0.47).toFixed(2)}s"/>`;
  return wrap(w, h, s, "hg-campfire", glowDef(id, "#ff9a3a", 0.45));
}
/* a log to sit on. axis 'x' lies east-west (box w × 79; its ends drawn as cut rings); axis 'y' lies north-south (box
   40 × h; its south end shows the rings). Seat height 40. Foot: y = h. */
export function logSeat({ w, h, axis = "x" } = {}) {
  const bark = "#6b4226",
    cut = "#d9a066";
  if (axis === "y") {
    w = w || 40;
    h = h || 200;
    const r = w / 2;
    return wrap(
      w,
      h,
      shade(r, h - 4, r + 4, 6) +
        R(0, 0, w, h - r, bark, `rx="${r}" ${ln(2.4)}`) +
        F`<path d="M${r * 0.5} 10V${h - w - 4}M${r * 1.3} 18V${h - w - 10}" stroke="#4a2c18" stroke-width="2.4"/><path d="M${r * 0.35} 14V${h - w}" stroke="#9a6a44" stroke-width="2" opacity=".6"/>` +
        F`<circle cx="${r}" cy="${h - r}" r="${r - 1}" fill="${cut}" ${ln(2.4)}/><circle cx="${r}" cy="${h - r}" r="${r * 0.62}" fill="none" stroke="#a0602c" stroke-width="1.6"/><circle cx="${r}" cy="${h - r}" r="${r * 0.3}" fill="none" stroke="#a0602c" stroke-width="1.6"/>`,
      "hg-log",
    );
  }
  w = w || 180;
  h = h || 79;
  const t = h - 46 - 2;
  return wrap(
    w,
    h,
    shade(w / 2, h - 6, w / 2, 9) +
      R(8, t - 30, w - 16, 62, bark, `rx="26" ${ln(2.4)}`) +
      F`<path d="M24 ${t - 14}H${w - 40}M30 ${t + 4}H${w - 26}M20 ${t + 20}H${w - 60}" stroke="#4a2c18" stroke-width="2.4"/><path d="M26 ${t - 24}H${w - 30}" stroke="#9a6a44" stroke-width="3" opacity=".6"/>` +
      [12, w - 12]
        .map(
          (x) =>
            F`<ellipse cx="${x}" cy="${t + 1}" rx="10" ry="30" fill="${cut}" ${ln(2.4)}/><ellipse cx="${x}" cy="${t + 1}" rx="5.5" ry="17" fill="none" stroke="#a0602c" stroke-width="1.5"/>`,
        )
        .join(""),
    "hg-log",
  );
}
/* the trampoline: round (w × d), a black mat in a blue pad at height z, legs. Box w × (d + z). back: the mat and the
   pad, foot y = z (north edge); front: the pad's front and the legs, foot y = h. */
export function trampoline({ w = 300, d, z = 44, h } = {}) {
  d = d || w;
  h = h || d + z;
  const Y = h - d,
    cx = w / 2,
    rx = w / 2,
    ry = d / 2,
    cy = Y + ry - z,
    p = 22;
  let seams = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    seams += F`M${cx + Math.cos(a) * (rx - p)} ${cy + Math.sin(a) * (ry - p)}L${cx + Math.cos(a) * rx} ${cy + Math.sin(a) * ry}`;
  }
  const back = F`<ellipse cx="${cx}" cy="${Y + ry}" rx="${rx}" ry="${ry}" fill="#000" opacity=".35"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2f86d6" ${ln(3)}/><path d="${seams}" stroke="#1d5a9a" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - p}" ry="${ry - p}" fill="#1b1b22" ${ln(2.4)}/><ellipse cx="${cx - rx * 0.2}" cy="${cy - ry * 0.25}" rx="${rx * 0.45}" ry="${ry * 0.3}" fill="#fff" opacity=".05"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - p - 10}" ry="${ry - p - 10}" fill="none" stroke="#33333e" stroke-width="2" stroke-dasharray="4 6"/>`;
  let legs = "";
  for (const a of [0.45, 1.2, 1.95, 2.7]) {
    const x = cx + Math.cos(a) * (rx - 8),
      y = cy + Math.sin(a) * (ry - 8);
    legs += F`M${x} ${y + 6}V${y + z}`;
  }
  const ring = F`M0 ${cy}A${rx} ${ry} 0 0 0 ${w} ${cy}H${w - p}A${rx - p} ${ry - p} 0 0 1 ${p} ${cy}Z`;
  const front =
    `<path d="${legs}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="${legs}" stroke="#9aa3ad" stroke-width="5.5" stroke-linecap="round"/>` +
    F`<path d="M0 ${cy}A${rx} ${ry} 0 0 0 ${w} ${cy}V${cy + 8}A${rx} ${ry} 0 0 1 0 ${cy + 8}Z" fill="#1d5a9a" ${ln(2.4)}/><path d="${ring}" fill="#2f86d6" ${ln(2.4)}/><path d="M${p + 6} ${cy + 10}A${rx - p} ${ry - p} 0 0 0 ${w - p - 6} ${cy + 10}" stroke="#7ec0ff" stroke-width="3" fill="none" opacity=".35"/>`;
  return pair(w, h, [back], [front], Y, h);
}
/* the soccer field's painted lines on the grass (mowing stripes, the halfway line, the center circle, both boxes).
   Anchor: flat. */
export function soccerField({ w = 1300, h = 1400 } = {}) {
  const m = 30,
    cy = h / 2,
    cx = w / 2;
  let s = "";
  for (let x = 0, i = 0; x < w; x += 130, i++)
    s += R(
      x,
      0,
      130,
      h,
      i % 2 ? "#ffffff" : "#000000",
      `opacity="${i % 2 ? 0.035 : 0.06}"`,
    );
  const box = (x, bw, bh) =>
    F`M${x} ${cy - bh / 2}H${x + bw}V${cy + bh / 2}H${x}`;
  const L =
    F`M${m} ${m}H${w - m}V${h - m}H${m}ZM${cx} ${m}V${h - m}` +
    box(m, 230, 640) +
    box(m, 90, 300) +
    F`M${w - m} ${cy - 320}H${w - m - 230}V${cy + 320}H${w - m}M${w - m} ${cy - 150}H${w - m - 90}V${cy + 150}H${w - m}` +
    F`M${m} ${m + 34}A34 34 0 0 0 ${m + 34} ${m}M${w - m - 34} ${m}A34 34 0 0 0 ${w - m} ${m + 34}M${m} ${h - m - 34}A34 34 0 0 1 ${m + 34} ${h - m}M${w - m - 34} ${h - m}A34 34 0 0 1 ${w - m} ${h - m - 34}` +
    F`M${m + 230} ${cy - 80}A110 110 0 0 1 ${m + 230} ${cy + 80}M${w - m - 230} ${cy - 80}A110 110 0 0 0 ${w - m - 230} ${cy + 80}`;
  s +=
    F`<path d="${L}" stroke="#e8f0e6" stroke-width="9" fill="none" opacity=".8" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="#e8f0e6" stroke-width="9" opacity=".8"/>` +
    [
      [cx, cy],
      [m + 160, cy],
      [w - m - 160, cy],
    ]
      .map(
        ([x, y]) =>
          F`<circle cx="${x}" cy="${y}" r="8" fill="#e8f0e6" opacity=".85"/>`,
      )
      .join("");
  return wrap(w, h, s, "hg-ground hg-field");
}
/* the soccer net at the field's east end, its mouth facing west: posts and crossbar z high, the net sloping back to
   backZ. Footprint w × d (d: the goal's width, north to south); box w × (d + z). back: the north side, the back and the
   north post, foot y = z (north edge); front: the roof net, the crossbar, the south side and post, foot y = h. */
export function soccerNet({ w = 120, d = 500, z = 110, backZ = 70, h } = {}) {
  h = h || d + z;
  const id = uid(),
    Y = h - d;
  const mesh = (k) =>
    F`<pattern id="${id}${k}" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 0L16 16M16 0L0 16" stroke="#f4f4f0" stroke-width="1.5" opacity=".55"/></pattern>`;
  const side = (y, k) =>
    F`<path d="M0 ${y}V${y - z}L${w} ${y - backZ}V${y}Z" fill="url(#${id}${k})" stroke="#e8e8e0" stroke-width="2.4"/>`;
  const post = (y) => R(-4, y - z, 9, z, "#f4f4f0", `rx="3" ${ln(2)}`);
  const back =
    F`<path d="M0 ${Y}H${w}V${Y + d}H0" stroke="#d8d8d0" stroke-width="4" fill="none" opacity=".7"/>` +
    side(Y, "b") +
    R(w - 3, Y - backZ, 5, d + backZ, "#e8e8e0", ln(1.4)) +
    post(Y);
  const front =
    F`<path d="M0 ${Y - z}L${w} ${Y - backZ}V${Y + d - backZ}L0 ${Y + d - z}Z" fill="url(#${id}f)" stroke="#e8e8e0" stroke-width="2.4"/>` +
    side(Y + d, "f") +
    R(-4, Y - z - 4, 9, d + 8, "#f4f4f0", `rx="3" ${ln(2)}`) +
    post(Y + d);
  return pair(w, h, [back, mesh("b")], [front, mesh("f")], Y, h);
}
/* the soccer ball. Foot: the bottom (y = h − 3). */
export function soccerBall({ w = 30, h = 34, spin = 0, shadow = true } = {}) {
  const id = uid(),
    r = w / 2 - 1.5,
    cx = w / 2,
    cy = h - 3 - r,
    pent = (x, y, s) => {
      let p = "";
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        p += (i ? "L" : "M") + F`${x + Math.cos(a) * s} ${y + Math.sin(a) * s}`;
      }
      return `<path d="${p}Z" fill="${O}"/>`;
    };
  return wrap(
    w,
    h,
    (shadow ? shade(cx, h - 3, r * 0.9, r * 0.28) : "") +
      F`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4f4f0"/><g transform="rotate(${spin} ${cx} ${cy})">${pent(cx, cy, r * 0.32)}${[
        0, 1, 2, 3, 4,
      ]
        .map((i) => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
          return pent(
            cx + Math.cos(a) * r * 0.92,
            cy + Math.sin(a) * r * 0.92,
            r * 0.26,
          );
        })
        .join("")}</g>` +
      F`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})" ${ln(2)}/><ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.45}" rx="${r * 0.26}" ry="${r * 0.13}" fill="#fff" opacity=".8" transform="rotate(-30 ${cx - r * 0.35} ${cy - r * 0.45})"/>`,
    "hg-ball",
    `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`,
  );
}

/* ---------- the red jeep ----------
   An early-2000s boxy two-door with a black soft top: round headlights, a seven-slot grille, flat fenders with black
   flares, a spare tire on the back. No badge, no name. Seen a little from its front (facing 'e', the default) so the
   grille shows; 'w' is the same, mirrored. Box w × 214; its footprint (about 230 × 100, the spare included) has its
   south-west corner near (4, 214) and leans right toward its north side. back: its shadow (flat); front: the jeep,
   foot y = h. */
export function jeep({
  w = 292,
  h = 214,
  facing = "e",
  color = "#c42b2b",
} = {}) {
  const id = uid(),
    { kx, ox, DD } = JEEP,
    Y = h - DD;
  const top = mix(color, 255, 0.14),
    south = color,
    east = mix(color, 0, 0.22),
    dark = mix(color, 0, 0.45),
    blk = "#26262c",
    blk2 = "#1d1d22";
  const S = (dep) => F`matrix(1 0 0 -1 ${ox + kx * (DD - dep)} ${Y + dep})`,
    T = (H) => F`matrix(1 0 ${-kx} 1 ${ox + kx * DD} ${Y - H})`,
    E = (X) => F`matrix(${-kx} 1 0 -1 ${X + ox + kx * DD} ${Y})`;
  const g = (m, inner) => `<g transform="${m}">${inner}</g>`;
  const box = (x0, x1, d0, d1, h0, h1, ct, cs, ce, o = {}) =>
    g(
      S(d1),
      R(x0, h0, x1 - x0, h1 - h0, cs, `rx="${o.r || 0}" ${ln(2)}`) +
        (o.s || ""),
    ) +
    g(
      E(x1),
      R(d0, h0, d1 - d0, h1 - h0, ce, `rx="${o.r || 0}" ${ln(2)}`) +
        (o.e || ""),
    ) +
    g(
      T(h1),
      R(x0, d0, x1 - x0, d1 - d0, ct, `rx="${o.r || 0}" ${ln(2)}`) +
        (o.t || ""),
    );
  /* a wheel: a round tire 16 deep, its outer face at dep, its tread running back to dep − 16 (one shape: the two faces
     and everything between, no gaps), the hub on the outer face. near: only what shows under its flare (the wheel well
     hides the rest), the flares on the body's side (dep 92) */
  const tire = (x, r, fill, w = 0) =>
    F`<path d="M${x} 21L${x + 16 * kx} 37" stroke="${fill}" stroke-width="${2 * r + w}" stroke-linecap="round"/>`;
  const wheel = (x, dep) =>
    g(
      S(dep),
      tire(x, 21, O, 4.4) +
        tire(x, 21, blk2) +
        F`<circle cx="${x}" cy="21" r="21" fill="${blk}" ${ln(2.2)}/><circle cx="${x}" cy="21" r="12" fill="#8d949e" ${ln(1.6)}/><circle cx="${x}" cy="21" r="4.5" fill="#5d636c"/>${[0, 1, 2, 3, 4].map((i) => F`<circle cx="${x + Math.cos(i * 1.2566) * 8}" cy="${21 + Math.sin(i * 1.2566) * 8}" r="1.6" fill="#3a3f46"/>`).join("")}`,
    );
  const arch = (x0, x1) => F`M${x0} 24C${x0 + 2} 54 ${x1 - 2} 54 ${x1} 24`;
  const well = (x0, x1) =>
    F`<clipPath id="${id}w${x0}"><path d="M${x0 - 40} 24H${x0}${arch(x0, x1).replace(/^M[^C]*/, "")}H${x1 + 40}V-30H${x0 - 40}Z"/></clipPath>`;
  const nearWheel = (x, x0, x1) =>
    g(
      S(92),
      F`<g clip-path="url(#${id}w${x0})"><g transform="translate(${2 * kx} 2)">${wheel(x, 90).replace(/^<g transform="[^"]*">/, "<g>")}</g></g>`,
    );
  const flare = (x0, x1) =>
    F`<path d="${arch(x0, x1)}" stroke="${O}" stroke-width="10" fill="none"/><path d="${arch(x0, x1)}" stroke="${blk}" stroke-width="6" fill="none"/>`;
  let s = "";
  /* the wheels, the flares and the fenders stay inside the body's width (8 … 92); the hood narrows a little (14 … 86) */
  s += wheel(45, 26) + wheel(160, 26);
  s += box(132, 197, 8, 16, 44, 50, top, blk, blk);
  /* the spare on the back: a round tire on the tailgate, its face to the west (away), its tread toward us: in the back's
     plane a circle (dep 50, 56 high, r 21) drawn round from x −20 to −2, one shape */
  const sp = (w, fill) =>
    F`<path d="M50 56L${50 - 18 / kx} ${56 - 18 / kx}" stroke="${fill}" stroke-width="${42 + w}" stroke-linecap="round"/>`;
  s += g(E(-20), sp(4.4, O) + sp(0, "#2c2c33"));
  s += box(-8, 6, 10, 90, 16, 26, "#3a3a42", blk, blk2);
  /* the tub, the doors, the soft top with its windows, the windshield */
  s += box(...JEEP.tub, top, south, east, {
    s: F`<path d="M92 24V60M144 24V60" stroke="${dark}" stroke-width="2"/><rect x="98" y="52" width="12" height="3.5" rx="1.5" fill="${blk}"/><path d="M8 56H146" stroke="#fff" stroke-width="2.5" opacity=".18"/>`,
  });
  s += box(...JEEP.soft, "#2e2e37", "#25252c", "#1f1f25", {
    r: 4,
    s: F`<rect x="72" y="70" width="54" height="34" rx="4" fill="#3d5574" ${ln(1.6)}/><path d="M80 76l14 20M92 74l10 14" stroke="#9ab4d4" stroke-width="3" opacity=".5"/><rect x="20" y="72" width="40" height="30" rx="4" fill="#33465f" ${ln(1.6)}/><path d="M66 64V110" stroke="#18181d" stroke-width="2"/>`,
    t: '<path d="M14 30H130M14 70H130" stroke="#3c3c47" stroke-width="2"/>',
  });
  s += box(...JEEP.glass, top, south, "#3e587a", {
    e: F`<rect x="14" y="66" width="72" height="40" fill="#3e587a" stroke="${color}" stroke-width="5"/><path d="M24 70l22 32M40 70l16 24" stroke="#a8c4e4" stroke-width="3" opacity=".55"/>`,
  });
  /* the hood and its grille face: seven slots between two round headlights, both whole (the fenders end beside them),
     the far one a little wider, the same height */
  let slots = "";
  for (let k = 0; k < 7; k++)
    slots += F`<rect x="${35 + k * 4.6}" y="38" width="2.8" height="21" rx="1.3" fill="${blk2}"/>`;
  const lamp = (dep, rx) =>
    F`<ellipse cx="${dep}" cy="50" rx="${rx}" ry="10" fill="#c9ced6" ${ln(1.8)}/><ellipse cx="${dep}" cy="50" rx="${rx - 3}" ry="7" fill="#fff4cf"/><circle cx="${dep - 2}" cy="52" r="2.4" fill="#fff"/><circle cx="${dep}" cy="38.5" r="2.6" fill="#ffb02e" ${ln(1)}/>`;
  s += box(...JEEP.hood, top, south, east, {
    e: slots + lamp(24, 10) + lamp(75, 9) + R(16, 30, 68, 3, dark),
    t: F`<path d="M146 22v56M190 22v56" stroke="${dark}" stroke-width="1.6" opacity=".7"/><rect x="186" y="44" width="6" height="12" rx="2" fill="${dark}"/>`,
  });
  s += box(128, 136, 92, 100, 66, 78, blk, blk, blk);
  s += box(196, 206, 10, 90, 16, 26, "#3a3a42", blk, blk2);
  s += nearWheel(45, 20, 70) + nearWheel(160, 134, 186);
  s += box(132, 197, 84, 92, 44, 50, top, blk, blk);
  s += g(S(92), flare(20, 70) + flare(134, 186));
  s +=
    g(
      T(50),
      F`<path d="M134 90H196" stroke="#fff" stroke-width="2" opacity=".25"/>`,
    ) +
    g(
      T(64),
      F`<path d="M144 20H196" stroke="#fff" stroke-width="3" opacity=".3"/>`,
    );
  const shadow = g(T(0), R(-26, -4, 248, 108, "#000", 'rx="26" opacity=".38"'));
  const flip = (x) =>
    facing === "w"
      ? F`<g transform="translate(${w} 0) scale(-1 1)">${x}</g>`
      : x;
  return pair(
    w,
    h,
    [flip(shadow)],
    [flip(s), well(20, 70) + well(134, 186)],
    null,
    h,
  );
}
