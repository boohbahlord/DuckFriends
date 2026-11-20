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
function looks({ WOUNDS, hitsOf, ZOUTFITS }) {
  const out = [],
    D = { ...DUCK_DEFAULT },
    styles = STYLES.filter((s) => s.id !== "jack" && s.id !== "datboi"),
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
      for (const m of st.fixed || st.flat ? ["none"] : [...metals, "rainbow"]) {
        const L = { ...D, style: st.id, build: b, metal: m };
        for (const sh of [true, false]) out.push([L, { shadow: sh }]);
        if (m === "none" && !st.fixed && !st.flat)
          for (const [p] of DUCK_PATTERNS) out.push([{ ...L, pattern: p }, {}]);
        for (const o of outfits) out.push([{ ...L, outfit: o }, {}]);
      }
  const eyes = EYES.map((e) => e.id),
    beaks = BEAKS.map((b) => b.id);
  /* Jack (or Jill) in a Box: his eyes on him; Dat Boi: each rank, and the hats and face items moved onto his head */
  for (const e of eyes)
    for (const jill of [false, true])
      for (const dead of [false, true])
        for (const sh of [true, false])
          out.push([
            { ...D, style: "jack", eyes: e, jill },
            { dead, shadow: sh },
          ]);
  const DB = { ...D, style: "datboi" };
  for (const rank of ["none", ...metals.filter((x) => x !== "none"), "rainbow"])
    for (const dead of [false, true])
      for (const sh of [true, false])
        out.push([
          { ...DB, rank },
          { dead, shadow: sh },
        ]);
  for (const h of [...HATS, ...NPC_HATS])
    for (const m of h.metal ? metals.filter((x) => x !== "none") : [undefined])
      for (const k of h.ketchup ? [false, true] : [undefined])
        for (const dead of [false, true])
          out.push([
            {
              ...DB,
              hat: {
                id: h.id,
                ...(m ? { metal: m } : {}),
                ...(k ? { ketchup: k } : {}),
              },
            },
            { dead },
          ]);
  for (const f of [...FACES, ...NPC_FACES])
    for (const dead of [false, true])
      out.push([{ ...DB, face: { id: f.id } }, { dead }]);
  for (const h of [...HATS, ...NPC_HATS])
    for (const m of h.metal ? metals.filter((x) => x !== "none") : [undefined])
      for (const k of h.ketchup ? [false, true] : [undefined]) // (the hotdog's, with ketchup or without)
        for (const e of h.id === "antennae" ? eyes : ["default"])
          for (const dead of [false, true])
            out.push([
              {
                ...D,
                eyes: e,
                hat: {
                  id: h.id,
                  ...(m ? { metal: m } : {}),
                  ...(k ? { ketchup: k } : {}),
                },
              },
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
  /* the marks on a duck's skin (a zombie's scars and rot, the wounds hits leave: l4ddart.js), each on its own, on each
     build (they're clipped to the body's shape) */
  const marks = { body: new Set(), head: new Set(), out: new Set() };
  for (const w of Object.values(WOUNDS)) marks[w.on].add(w.svg);
  for (const kind of "bBscrakpefx")
    for (let at = 0; at < 8; at++) {
      const h = hitsOf(kind + at);
      for (const m of h.inner) marks.head.add(m);
      for (const m of h.out) marks.out.add(m);
    }
  /* headless (a zombie's headshot): a zombie's own look, bare or in its clothes, dead */
  for (const [b] of BUILDS)
    for (const o of [null, ...ZOUTFITS])
      out.push([
        { ...D, build: b, ...(o ? { outfit: { id: o } } : {}) },
        { dead: true, gone: { head: true } },
      ]);
  for (const [b] of BUILDS)
    for (const [part, set] of Object.entries(marks))
      for (const m of set)
        out.push([{ ...D, build: b }, { skin: { [part]: [m] } }]);
  return out;
}

/* which file of its size a part goes in, so a game fetches only what its ducks wear: an outfit's clothes, a face item,
   a style's body, a pattern, each a file of their own; the marks on skin and the headless parts (the zombies') too; the
   rest (shadows, beaks, eyes, hats, metals) one file */
const OWN = {
    ofBack: "o",
    cloth: "o",
    sleeve: "o",
    ofOver: "o",
    face: "f",
    pattern: "p",
  },
  BODY = [
    "fill",
    "edge",
    "shade",
    "wingBare",
    "spots",
    "slBack",
    "slUnder",
    "slOver",
  ];
const chunkOf = (layer, look, o) => {
  if (o.gone && o.gone.head) return "x";
  if (look.style === "jack" || look.style === "datboi")
    return "s-" + look.style; // (all of him)
  if (look.metal === "rainbow" && BODY.includes(layer)) return "rb"; // (the rainbow skin's)
  if (/^skin/.test(layer)) return "skin";
  const k = OWN[layer];
  if (k === "o" && look.outfit) return "o-" + look.outfit.id;
  if (k === "f" && look.face) return "f-" + look.face.id;
  if (k === "p") return "p-" + look.pattern;
  if (BODY.includes(layer)) return "s-" + look.style;
  return "main";
};
/* every part, once: { layer, key, svg (all black), whites: [[path, svg with that color white]] } */
function parts(L4) {
  const seen = new Map();
  for (const [look, o] of looks(L4)) {
    const B = blackLook(look),
      C = codedLook(look),
      paths = duckVars(look).map(([p]) => p);
    const opt = {
      size: 0,
      dead: !!o.dead,
      shadow: o.shadow !== false,
      skin: o.skin,
      gone: o.gone,
    };
    for (const layer of LAYERS) {
      const svg = duckSVG(B, { layer, ...opt });
      if (!svg) continue;
      const key = partKey(layer, duckSVG(C, { layer, ...opt }));
      if (seen.has(key)) continue;
      const whites = [];
      for (const p of paths) {
        const w = duckSVG(withColor(B, p, WHITE), { layer, ...opt });
        if (w !== svg && w) whites.push([p, w]);
      }
      seen.set(key, {
        layer,
        key,
        svg,
        whites,
        chunk: chunkOf(layer, look, o),
      });
    }
  }
  return [...seen.values()];
}

async function draw(svg, n, H) {
  if (!/^<svg[^>]*\sxmlns=/.test(svg))
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'); // (a cat's drawing goes in a page, so it has none)
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
    made = [],
    empty = [];
  for (const p of list) {
    /* a cat's box is its own: as big next to this size's duck box as it is next to a duck's (64 world px) */
    const pw = p.cat ? Math.round((n * p.cat.w) / 64) : n,
      ph = p.cat ? Math.round((n * p.cat.h) / 64) : H;
    const z = await draw(p.svg, pw, ph),
      ws = [];
    for (const [path, svg] of p.whites)
      ws.push([path, await draw(svg, pw, ph)]);
    /* its box: where anything shows */
    let x0 = pw,
      y0 = ph,
      x1 = -1,
      y1 = -1;
    for (let j = 0; j < ph; j++)
      for (let i = 0; i < pw; i++)
        if (z[(j * pw + i) * 4 + 3]) {
          x0 = Math.min(x0, i);
          y0 = Math.min(y0, j);
          x1 = Math.max(x1, i);
          y1 = Math.max(y1, j);
        }
    if (x1 < 0) {
      empty.push(p.key); // (nothing at this size, or nothing at all: a robot's sleeve. Listed as nothing, so it's not missing)
      continue;
    }
    const w = x1 - x0 + 1,
      h = y1 - y0 + 1,
      used = [],
      coef = [];
    for (const [path, wd] of ws) {
      const q = new Uint8ClampedArray(w * h);
      let any = 0;
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const s = ((y0 + j) * pw + x0 + i) * 4,
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
        const s = ((y0 + j) * pw + x0 + i) * 4,
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
    made.push({
      key: p.key,
      chunk: p.chunk,
      c,
      e: p.cat
        ? [0, 0, w, h, x0, y0, used, 0, pw, ph]
        : [0, 0, w, h, x0, y0, used, 0],
    });
  }
  /* a file for each chunk, its parts on shelves: as wide as it needs, 2048 at most */
  const chunks = [...new Set(made.map((it) => it.chunk))].sort(),
    index = {},
    files = [];
  chunks.forEach((name, ci) => {
    const its = made.filter((it) => it.chunk === name),
      area = its.reduce((s, it) => s + (it.c.width + 1) * (it.c.height + 1), 0),
      W = Math.min(
        2048,
        Math.max(
          ...its.map((it) => it.c.width),
          Math.ceil(Math.sqrt(area) * 1.15),
        ),
      ),
      sorted = [...its].sort((a, b) => b.c.height - a.c.height);
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
      it.e[7] = ci;
      x += it.c.width + 1;
      row = Math.max(row, it.c.height);
    }
    const out = document.createElement("canvas");
    out.width = W;
    out.height = Math.max(1, y + row);
    const g = out.getContext("2d");
    for (const it of its) {
      g.drawImage(it.c, it.e[0], it.e[1]);
      index[it.key] = it.e;
    }
    files.push({ name, png: out.toDataURL("image/png").split(",")[1] });
  });
  for (const k of empty) index[k] = 0;
  return { files, index };
}

export async function listParts() {
  /* the zombies' marks (l4ddart.js): its modules need the game's own order, from rules.js, or they wait on each other */
  await import("/js/rules.js");
  const list = parts({
    ...(await import("/js/l4ddart.js")),
    ...(await import("/js/l4ddrules.js")),
  });
  /* Duck Cabin's cats (hangout/npcart.js): each pose one part, as it is (their colors never change) */
  const { CATS, catSVG, catBox } = await import("/js/hangout/npcart.js");
  for (const name of Object.keys(CATS))
    for (const [pose, step] of [
      ["stand", 0],
      ["walk", -1],
      ["walk", 1],
      ["sit", 0],
      ["loaf", 0],
      ["swipe", 0],
    ]) {
      const svg = catSVG(name, { pose, step });
      list.push({
        layer: "cat",
        key: partKey("cat", svg),
        svg,
        whites: [],
        chunk: "cats",
        cat: catBox(name),
      });
    }
  window.__parts = list;
  return list.length;
}
export async function bakeSize(n) {
  return sheet(window.__parts, n);
}
