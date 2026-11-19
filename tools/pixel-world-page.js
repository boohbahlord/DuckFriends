/* ---------- the page side of tools/pixel-world.cjs: Duck Cabin's and Downpour's ground and props made into pixels ----------
   Run in a browser with the game's own scripts and css/app.css. For one world (useMode's variant) it makes:
   - the ground (shapes.js GROUND), in TILE-square pieces as world.js used to paint it on the device, one picture;
   - every prop part and decor (shapes.js DRAW, DECOR) at one pixel to ART world px, as it looks in the game: its CSS
     written in (pxdom.js pxSnapshot), and once more for each look the game gives it with a class (a lamp off, a door
     open, a fire out, the blackout), when that look is another picture.
   Returns PNGs (base64) and the index the game reads (world.js baked). */
import * as L from "/js/hangout/layout.js";
import { DRAW, DECOR, GROUND } from "/js/hangout/shapes.js";
import { pxCanvas } from "/js/pixel.js";
import { pxSnapshot, hashText, steadyText } from "/js/pxdom.js";
import { ART, artKey, LOOKS } from "/js/hangout/pxworld.js";

const TILE = 512; // (world px: 256 pixels a side)

/* the parts the world draws, as world.js lists them (all of them: no area left out) */
function parts() {
  const out = [];
  for (const p of L.PROPS) {
    if (p.layer === "none") continue;
    let ps = DRAW[p.kind] ? DRAW[p.kind](p) : [];
    if (typeof ps === "string")
      ps = [{ svg: ps, box: p.box, key: p.key, layer: p.layer }];
    for (const pt of ps) out.push({ ...pt, p });
  }
  for (const d of DECOR()) out.push({ ...d, p: null });
  return out;
}

async function ground() {
  const pieces = GROUND();
  let y0 = 0,
    y1 = L.H,
    x0 = 0,
    x1 = L.W;
  for (const p of pieces) {
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y + p.h);
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x + p.w);
  }
  [x0, y0] = [Math.floor(x0 / TILE) * TILE, Math.floor(y0 / TILE) * TILE];
  [x1, y1] = [Math.ceil(x1 / TILE) * TILE, Math.ceil(y1 / TILE) * TILE];
  const n = TILE / ART,
    big = document.createElement("canvas");
  big.width = (x1 - x0) / ART;
  big.height = (y1 - y0) / ART;
  const g = big.getContext("2d");
  for (let y = y0; y < y1; y += TILE)
    for (let x = x0; x < x1; x += TILE) {
      let body = "";
      for (const p of pieces)
        if (p.x < x + TILE && p.x + p.w > x && p.y < y + TILE && p.y + p.h > y)
          body +=
            p.raw || `<g transform="translate(${p.x} ${p.y})">${p.svg}</g>`;
      if (!body) continue;
      const c = await pxCanvas(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${TILE} ${TILE}" width="${n}" height="${n}">${body}</svg>`,
        n,
        n,
      );
      g.drawImage(c, (x - x0) / ART, (y - y0) / ART);
    }
  return {
    png: big.toDataURL("image/png").split(",")[1],
    x: x0,
    y: y0,
    w: big.width,
    h: big.height,
  };
}

/* one part as it looks with these classes: a canvas, or null when it can't be made ahead (words on it) */
async function look(pt, svg, classes, host, board) {
  const b = pt.box,
    cw = Math.max(1, Math.round(b.w / ART)),
    ch = Math.max(1, Math.round(b.h / ART));
  if (pt.img) return pxCanvas(svg, cw, ch); // (a picture: no CSS reaches it)
  const e = document.createElement("div");
  e.className =
    "hp hp-" +
    (pt.p ? pt.p.kind : "decor") +
    (pt.cls ? " " + pt.cls : "") +
    (classes.own ? " " + classes.own : "");
  e.style.cssText =
    `position:absolute;left:0;top:0;width:${b.w}px;height:${b.h}px;transform:none` +
    (pt.style ? ";" + pt.style : "");
  e.setAttribute("data-nopx", "");
  e.innerHTML = svg;
  board.classList.toggle("blackout", !!classes.board);
  host.append(e);
  try {
    if (e.querySelector("text")) return null;
    const r0 = e.getBoundingClientRect();
    let body = "";
    for (const s of e.querySelectorAll("svg")) {
      if (s.ownerSVGElement) continue;
      const r = s.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const vb = s.viewBox.baseVal;
      if (!vb || !vb.width) continue;
      const cs = getComputedStyle(s);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const op = +cs.opacity;
      let t = pxSnapshot(s).replace(
        /^<svg /,
        `<svg x="${r.left - r0.left}" y="${r.top - r0.top}" `,
      );
      t = t.replace(
        / width="[^"]*" height="[^"]*"/,
        ` width="${r.width}" height="${r.height}"`,
      );
      body += op < 1 ? `<g opacity="${op}">${t}</g>` : t;
    }
    if (!body) {
      const c = document.createElement("canvas"); // (nothing shows in this look: a door shut, seen from where it isn't)
      c.width = cw;
      c.height = ch;
      return c;
    }
    return await pxCanvas(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.w} ${b.h}" width="${b.w}" height="${b.h}">${body}</svg>`,
      cw,
      ch,
    );
  } finally {
    e.remove();
  }
}

/* shelves of pictures, 2048 pixels across */
function pack(list) {
  const W = 2048;
  list = [...list].sort((a, b) => b.c.height - a.c.height); // (each keeps its own number in the list it came in)
  let x = 0,
    y = 0,
    row = 0;
  for (const it of list) {
    if (x + it.c.width > W) {
      x = 0;
      y += row + 1;
      row = 0;
    }
    it.at = [x, y];
    x += it.c.width + 1;
    row = Math.max(row, it.c.height);
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = y + row;
  const g = c.getContext("2d");
  for (const it of list) g.drawImage(it.c, ...it.at);
  return c;
}

export async function bake(mode, map) {
  await import("/js/hangout/activities.js"); // (they leave out what they draw themselves: the stage, the seats)
  L.useMode(mode, map);
  let board = document.querySelector("#pxw .hang-board");
  if (!board) {
    const d = document.createElement("div");
    d.id = "pxw";
    d.innerHTML =
      '<div class="game hang"><div class="board hang-board" style="width:4000px;height:4000px"><div class="hang-world"><div class="hang-props"></div></div></div></div>';
    document.body.append(d);
    board = d.querySelector(".hang-board");
  }
  const host = board.querySelector(".hang-props"),
    s = {},
    pics = [],
    skipped = [];
  for (const pt of parts()) {
    const sv = typeof pt.svg === "function" ? pt.svg() : pt.svg,
      frames = pt.frames ? [...Array(pt.nframes || 0).keys()] : null;
    const svgs =
      frames && frames.length ? frames.map((i) => pt.frames(i)) : [sv];
    for (const svg of svgs) {
      const key = artKey(svg, pt.box, hashText, steadyText);
      if (s[key] !== undefined) continue;
      const base = await look(pt, svg, {}, host, board);
      if (!base) {
        skipped.push(pt.p ? pt.p.id : "decor");
        s[key] = null;
        continue;
      }
      const sig = base.toDataURL();
      s[key] = { "": pics.push({ c: base }) - 1 };
      if (pt.img) continue;
      /* its other looks: each class that changes it, and those together */
      const own = [];
      for (const k of LOOKS) {
        const c = await look(
          pt,
          svg,
          k === "blackout" ? { board: 1 } : { own: k },
          host,
          board,
        );
        if (c && c.toDataURL() !== sig) own.push(k);
      }
      if (own.length) s[key].k = own;
      for (let m = 1; m < 1 << own.length; m++) {
        const ks = own.filter((_, i) => m & (1 << i)),
          c = await look(
            pt,
            svg,
            {
              own: ks.filter((k) => k !== "blackout").join(" "),
              board: ks.includes("blackout"),
            },
            host,
            board,
          );
        if (c) s[key][ks.join(" ")] = pics.push({ c }) - 1;
      }
    }
  }
  board.classList.remove("blackout");
  const atlas = pack(pics),
    at = pics.map((p) => [...p.at, p.c.width, p.c.height]);
  for (const k of Object.keys(s)) {
    if (!s[k]) delete s[k];
    else
      for (const v of Object.keys(s[k])) if (v !== "k") s[k][v] = at[s[k][v]];
  }
  return {
    ground: await ground(),
    atlas: atlas.toDataURL("image/png").split(",")[1],
    index: s,
    skipped,
  };
}
