/* ---------- the page side of tools/duck-parts.cjs: every part of every duck made into pixels at each size ----------
   Run in a browser with the game's own scripts. Every layer (duck.js LAYERS) of every look the parts can make is listed
   by its name (duckparts.js partKey: its drawing with every color black), then each one is made at each size of
   duckparts.js SIZES: its pixels with every color black, and for each color it takes, how much of it each pixel takes
   (the same drawing with that color white, less the black one). Returns per size a PNG (base64) and its index. */
import {
  duckSVG,
  LAYERS,
  DUCK_DEFAULT,
  BUILDS,
  DUCK_PATTERNS,
  DUCK_METALS,
} from "/js/duck.js";
import { STYLES } from "/js/styles.js";
import { HATS, NPC_HATS } from "/js/hats.js";
import { FACES, NPC_FACES } from "/js/faces.js";
import { OUTFITS, NPC_OUTFITS } from "/js/outfits.js";
import { EYES } from "/js/eyes.js";
import { BEAKS } from "/js/beaks.js";
import {
  SIZES,
  FRAME,
  duckVars,
  withColor,
  blackLook,
  codedLook,
  partKey,
} from "/js/duckparts.js";

const WHITE = "#ffffff";
/* the looks to draw every part from: each part's own choices, the rest left as the plain duck */
function looks() {
  const out = [],
    D = { ...DUCK_DEFAULT },
    styles = STYLES.filter(
      (s) => !s.flat && s.id !== "jack" && s.id !== "datboi",
    ),
    metals = DUCK_METALS.map(([m]) => m),
    outfits = [];
  for (const o of [...OUTFITS, ...NPC_OUTFITS]) {
    let picks = [{ id: o.id }];
    for (const [k, choices] of o.opts || [])
      picks = picks.flatMap((p) => choices.map(([v]) => ({ ...p, [k]: v })));
    outfits.push(...picks);
  }
  for (const st of styles)
    for (const [b] of BUILDS)
      for (const m of st.fixed ? ["none"] : metals) {
        const L = { ...D, style: st.id, build: b, metal: m };
        for (const sh of [true, false]) out.push([L, { shadow: sh }]);
        if (m === "none" && !st.fixed)
          for (const [p] of DUCK_PATTERNS) out.push([{ ...L, pattern: p }, {}]);
        for (const o of outfits) out.push([{ ...L, outfit: o }, {}]);
      }
  const eyes = EYES.map((e) => e.id),
    beaks = BEAKS.map((b) => b.id);
  for (const h of [...HATS, ...NPC_HATS])
    for (const m of h.metal ? metals.filter((x) => x !== "none") : [undefined])
      for (const e of h.id === "antennae" ? eyes : ["default"])
        for (const dead of [false, true])
          out.push([
            { ...D, eyes: e, hat: { id: h.id, ...(m ? { metal: m } : {}) } },
            { dead },
          ]);
  for (const f of [...FACES, ...NPC_FACES])
    for (const bk of beaks)
      for (const e of f.id === "clownpaint" ? eyes : ["default"])
        for (const dead of [false, true])
          out.push([{ ...D, beak: bk, eyes: e, face: { id: f.id } }, { dead }]);
  for (const bk of beaks) out.push([{ ...D, beak: bk }, {}]);
  for (const e of eyes)
    for (const dead of [false, true]) out.push([{ ...D, eyes: e }, { dead }]);
  return out;
}

/* every part, once: { layer, key, svg (all black), whites: [[path, svg with that color white]] } */
function parts() {
  const seen = new Map();
  for (const [look, o] of looks()) {
    const B = blackLook(look),
      C = codedLook(look),
      paths = duckVars(look).map(([p]) => p);
    for (const layer of LAYERS) {
      const svg = duckSVG(B, {
        layer,
        size: 0,
        dead: !!o.dead,
        shadow: o.shadow !== false,
      });
      if (!svg) continue;
      const key = partKey(
        layer,
        duckSVG(C, {
          layer,
          size: 0,
          dead: !!o.dead,
          shadow: o.shadow !== false,
        }),
      );
      if (seen.has(key)) continue;
      const whites = [];
      for (const p of paths) {
        const w = duckSVG(withColor(B, p, WHITE), {
          layer,
          size: 0,
          dead: !!o.dead,
          shadow: o.shadow !== false,
        });
        if (w !== svg && w) whites.push([p, w]);
      }
      seen.set(key, { layer, key, svg, whites });
    }
  }
  return [...seen.values()];
}

async function draw(svg, n, H) {
  const u = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
    i = new Image();
  i.src = u;
  await i.decode();
  const c = document.createElement("canvas");
  c.width = n;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(i, 0, 0, n, H);
  URL.revokeObjectURL(u);
  return g.getImageData(0, 0, n, H).data;
}

/* one size: each part's black pixels and its colors' shade numbers, cropped, on shelves 2048 pixels across */
async function sheet(list, n) {
  const H = Math.round((n * FRAME) / 120),
    made = [];
  for (const p of list) {
    const z = await draw(p.svg, n, H),
      ws = [];
    for (const [path, svg] of p.whites) ws.push([path, await draw(svg, n, H)]);
    /* its box: where anything shows */
    let x0 = n,
      y0 = H,
      x1 = -1,
      y1 = -1;
    for (let j = 0; j < H; j++)
      for (let i = 0; i < n; i++)
        if (z[(j * n + i) * 4 + 3]) {
          x0 = Math.min(x0, i);
          y0 = Math.min(y0, j);
          x1 = Math.max(x1, i);
          y1 = Math.max(y1, j);
        }
    if (x1 < 0) continue; // (nothing at this size)
    const w = x1 - x0 + 1,
      h = y1 - y0 + 1,
      used = [],
      coef = [];
    for (const [path, wd] of ws) {
      const q = new Uint8ClampedArray(w * h);
      let any = 0;
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const s = ((y0 + j) * n + x0 + i) * 4,
            a = z[s + 3] / 255,
            aw = wd[s + 3] / 255;
          let v = 0;
          for (let ch = 0; ch < 3; ch++) v += wd[s + ch] * aw - z[s + ch] * a;
          v = Math.round(v / 3); // (the same in each channel: the color mixes the same way into all three)
          q[j * w + i] = v;
          if (v > 0) any = 1;
        }
      if (any) {
        used.push(path);
        coef.push(q);
      }
    }
    const tiles = 1 + Math.ceil(coef.length / 3),
      c = document.createElement("canvas");
    c.width = tiles * (w + 1) - 1;
    c.height = h;
    const g = c.getContext("2d"),
      id = g.createImageData(c.width, h),
      d = id.data;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const s = ((y0 + j) * n + x0 + i) * 4,
          t = (j * c.width + i) * 4;
        d[t] = z[s];
        d[t + 1] = z[s + 1];
        d[t + 2] = z[s + 2];
        d[t + 3] = z[s + 3];
        for (let v = 0; v < coef.length; v++) {
          const u = (j * c.width + (1 + ((v / 3) | 0)) * (w + 1) + i) * 4;
          d[u + (v % 3)] = coef[v][j * w + i];
          d[u + 3] = 255;
        }
      }
    g.putImageData(id, 0, 0);
    made.push({ key: p.key, c, at: null, e: [0, 0, w, h, x0, y0, used] });
  }
  /* shelves */
  const W = 2048,
    sorted = [...made].sort((a, b) => b.c.height - a.c.height);
  let x = 0,
    y = 0,
    row = 0;
  for (const it of sorted) {
    if (x + it.c.width > W) {
      x = 0;
      y += row + 1;
      row = 0;
    }
    it.e[0] = x;
    it.e[1] = y;
    x += it.c.width + 1;
    row = Math.max(row, it.c.height);
  }
  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.max(1, y + row);
  const g = out.getContext("2d");
  const index = {};
  for (const it of made) {
    g.drawImage(it.c, it.e[0], it.e[1]);
    index[it.key] = it.e;
  }
  return { png: out.toDataURL("image/png").split(",")[1], index };
}

export async function listParts() {
  const list = parts();
  window.__parts = list;
  return list.length;
}
export async function bakeSize(n) {
  return sheet(window.__parts, n);
}
