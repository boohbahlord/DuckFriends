/* ---------- a map recorded as pixel files (tools/pixel-maps.cjs only: never loaded by the game) ----------
   The owner's, Nov 19 23:26Z: "we don't have the leftover image behind. It's literally pixels", and 23:41Z: all art is
   pixel art, layered pixel files, one for each object on a map. A map is drawn here once, the game's way, at the size
   of the world (1366 × 768 css px, two to a pixel), and made into pixels by pxbake.js as the game made it on every
   device. Then each of its pictures is kept as a file of its own, in its place: what only fades stays one picture
   (its CSS fades it); what moves or turns is kept as a strip of frames over its whole cycle, played at its own timing.
   Returns the world's markup, with FILE:<key> where each file goes, and the files, as PNG data URLs. */
import { forBake } from "../../js/pxbake.js";

const { grid, pictureOf, paintBox, BOX } = forBake;

/* a canvas's bytes: its key (the same picture is one file, however many times it shows) */
async function keyOf(url) {
  const b = new TextEncoder().encode(url),
    h = await crypto.subtle.digest("SHA-1", b);
  return [...new Uint8Array(h)]
    .slice(0, 6)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}

/* everything one element plays by itself (not its holders'): its animations, their cycle (an alternating one: there and
   back), and their delay */
function cycleOf(el) {
  const as = el
    .getAnimations()
    .filter((a) => a.effect && a.effect.target === el);
  if (!as.length) return null;
  let P = 0,
    delay = 0;
  for (const a of as) {
    const t = a.effect.getComputedTiming(),
      d = +t.duration || 0,
      p = /alternate/.test(t.direction) ? 2 * d : d;
    if (p > P) {
      P = p;
      delay = +t.delay || 0;
    }
  }
  return P > 0 ? { as, P, delay } : null;
}
/* the element's box and turn as it is now, in its holder's css px (its own place and transform; not its holders') */
function ownMatrix(el) {
  const cs = getComputedStyle(el),
    [ox, oy] = cs.transformOrigin.split(" ").map(parseFloat);
  let m = new DOMMatrix().translate(el.offsetLeft, el.offsetTop);
  if (cs.transform && cs.transform !== "none")
    m = m
      .translate(ox, oy)
      .multiply(new DOMMatrix(cs.transform))
      .translate(-ox, -oy);
  return [m, +cs.opacity, cs];
}
/* a moving part as n frames over its cycle, on the grid of its holder: { url, x, y, w, h (css px), n, P, delay } */
/* frames laid in rows when one row would be wider than a picture file may be (WebP: 16383 pixels): the most frames a
   row can hold that still split them evenly; the CSS steps down the rows as it steps along them */
export function rowsOf(fw, n) {
  let c = n;
  while (c > 1 && (c * fw > 16000 || n % c)) c--;
  return [c, n / c];
}

export async function framesOf(el, n) {
  const G = grid(),
    { d, g } = G,
    shift = (G.n / 2 - G.at - 0.5) / d,
    pic = await pictureOf(el, d),
    cyc = cycleOf(el),
    N = cyc ? n : 1,
    pad = pic === BOX ? 0 : pic._pad || 0,
    pw = el.offsetWidth,
    ph = el.offsetHeight,
    at = [];
  if (cyc)
    for (const a of cyc.as) {
      a.pause();
      a.effect.updateTiming({ delay: 0 }); // (from the cycle's start: the same part with another delay is the same strip)
    }
  const seek = (k) => {
    if (cyc) for (const a of cyc.as) a.currentTime = (k * cyc.P) / N;
    return ownMatrix(el);
  };
  /* where it goes over the cycle: the box all its frames fit in, on whole pixels of the grid */
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (let k = 0; k < N; k++) {
    const [m, o, cs] = seek(k);
    at.push([
      m,
      o,
      { boxShadow: cs.boxShadow, backgroundColor: cs.backgroundColor },
    ]); // (as it is at that moment)
    /* a plain box's glow reaches past it: as far as its shadows go */
    const p =
      pic === BOX
        ? (cs.boxShadow.match(/-?[\d.]+px/g) || []).reduce(
            (a, v) => a + Math.abs(parseFloat(v)),
            0,
          )
        : pad;
    for (const [px, py] of [
      [-p, -p],
      [pw + p, -p],
      [-p, ph + p],
      [pw + p, ph + p],
    ]) {
      const q = m.transformPoint(new DOMPoint(px, py));
      x0 = Math.min(x0, q.x);
      y0 = Math.min(y0, q.y);
      x1 = Math.max(x1, q.x);
      y1 = Math.max(y1, q.y);
    }
  }
  const i0 = Math.floor(x0 / g),
    j0 = Math.floor(y0 / g),
    fw = Math.max(1, Math.ceil(x1 / g) - i0),
    fh = Math.max(1, Math.ceil(y1 / g) - j0),
    [C, R] = rowsOf(fw, N),
    c = document.createElement("canvas");
  c.width = fw * C;
  c.height = fh * R;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  at.forEach(([m, o, cs], k) => {
    if (!(o > 0)) return;
    const t = new DOMMatrix()
      .translate((k % C) * fw, Math.floor(k / C) * fh)
      .scale(1 / g)
      .translate(shift - i0 * g, shift - j0 * g)
      .multiply(m)
      .scale(1 / d);
    x.save();
    x.beginPath();
    x.rect((k % C) * fw, Math.floor(k / C) * fh, fw, fh); // (each frame in its own square of the strip)
    x.clip();
    x.setTransform(t);
    x.globalAlpha = Math.min(1, o);
    if (pic === BOX) {
      x.setTransform(t.scale(d));
      paintBox(x, cs, pw, ph, 1 / g);
    } else if (pic === el) x.drawImage(pic, 0, 0, pw * d, ph * d);
    else x.drawImage(pic, -pad * d, -pad * d);
    x.restore();
  });
  return {
    url: c.toDataURL("image/png"),
    x: i0 * g,
    y: j0 * g,
    w: fw * g,
    h: fh * g,
    n: N,
    C,
    R,
    P: cyc ? cyc.P : 0,
    delay: cyc ? cyc.delay : 0,
  };
}

/* root, made into pixels by pxbake.js, as markup of files: its pictures (px-baked) each a file in its place, what moves
   (px-gone) a strip of frames (frames: how many for an element, by what it is), the movers' canvas gone. Changes root */
export async function record(root, frames) {
  const files = {},
    file = async (url) => {
      const k = await keyOf(url);
      files[k] = url;
      return "FILE:" + k;
    };
  root.querySelectorAll("canvas.px-movers").forEach((c) => c.remove());
  document.getAnimations().forEach((a) => a.pause());
  for (const el of [...root.querySelectorAll(".px-gone")]) {
    if (
      el.nextElementSibling &&
      el.nextElementSibling.classList.contains("px-baked")
    ) {
      el.remove(); // (a picture its code drew, kept behind its pixels: only the pixels)
      continue;
    }
    const f = await framesOf(el, frames(el)),
      src = await file(f.url);
    let out;
    if (f.n === 1)
      out = `<img class="px-file" alt="" draggable="false" style="position:absolute;left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px" src="${src}">`;
    else
      out = `<div class="pxs${el.classList.contains("pg-smoke") ? " pxs-hide" : ""}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;--n:${f.C}${f.R > 1 ? `;--r:${f.R}` : ""};--pd:${Math.round(f.P)}ms;--pdl:${Math.round(f.delay)}ms"><img class="px-file" alt="" draggable="false" src="${src}"></div>`; // (pxs-hide: unseen on a still page, as the smoke)
    el.outerHTML = out;
  }
  for (const c of [...root.querySelectorAll("canvas.px-baked")]) {
    const im = document.createElement("img");
    im.className = c.className.replace(/\bpx-baked\b/, "px-file").trim();
    im.alt = "";
    im.draggable = false;
    im.setAttribute("style", c.getAttribute("style") || "");
    if (c.dataset.y) im.dataset.y = c.dataset.y;
    if (c._at) im.dataset.at = c._at.join(" ");
    im.setAttribute("src", await file(c.toDataURL("image/png")));
    c.replaceWith(im);
  }
  return { html: root.innerHTML, files };
}

/* ---------- a scene drawn as one <svg> with moving parts (Carnival Night): pxbake.js svgItems' runs and parts ----------
   The runs (what doesn't move, between the parts in the drawing's order) are files in their place. Each part is what
   kind(part) says:
   - { k: "frames", P, N }: N frames over P ms (the wheel's turn up to where it looks the same again; the flag's wave);
   - { k: "hang", P, cx, cy }: turns round (cx, cy) (the drawing's units) in P ms but hangs straight (the wheel's cars
     and lights): its picture as it is, carried round (css/app.css .pxh);
   - { k: "fade", cls }: only its opacity changes (bulbs and stars twinkling): its picture, faded by its css (cls).
   All animations are read at the same moment (from the start), so the parts keep their places to each other */
export async function recordSvg(root, svg, anim, kind) {
  const G = grid(),
    { d, n, at, g } = G,
    shift = (n / 2 - at - 0.5) / d,
    rb = root.getBoundingClientRect(),
    items = await forBake.svgItems(root, svg, anim);
  if (!items) throw new Error("svg: not made into pixels");
  const files = {},
    file = async (url) => {
      const k = await keyOf(url);
      files[k] = url;
      return "FILE:" + k;
    };
  const anims = document.getAnimations();
  anims.forEach((a) => a.pause());
  const seek = (t) => anims.forEach((a) => (a.currentTime = t));
  const base = new DOMMatrix()
    .scale(1 / g)
    .translate(shift, shift)
    .translate(-rb.left, -rb.top);
  const where = (it) => {
    const [ux, uy, k] = it.at;
    return base
      .multiply(it.part.getScreenCTM())
      .translate(ux, uy)
      .scale(1 / k);
  };
  /* the part drawn at these moments, each in a frame of one strip: { url, i0, j0, fw, fh } (grid pixels) */
  const strip = (it, times, alpha = true) => {
    let i0 = Infinity,
      j0 = Infinity,
      i1 = -Infinity,
      j1 = -Infinity;
    const ms = times.map((t) => {
      seek(t);
      const m = where(it),
        o = alpha ? +getComputedStyle(it.part).opacity : 1;
      for (const [px, py] of [
        [0, 0],
        [it.pic.width, 0],
        [0, it.pic.height],
        [it.pic.width, it.pic.height],
      ]) {
        const q = m.transformPoint(new DOMPoint(px, py));
        i0 = Math.min(i0, Math.floor(q.x));
        j0 = Math.min(j0, Math.floor(q.y));
        i1 = Math.max(i1, Math.ceil(q.x));
        j1 = Math.max(j1, Math.ceil(q.y));
      }
      return [m, o];
    });
    const fw = i1 - i0,
      fh = j1 - j0,
      [C, R] = rowsOf(fw, times.length),
      c = document.createElement("canvas");
    c.width = fw * C;
    c.height = fh * R;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    ms.forEach(([m, o], f) => {
      if (!(o > 0)) return;
      x.save();
      x.beginPath();
      const fx = (f % C) * fw,
        fy = Math.floor(f / C) * fh;
      x.rect(fx, fy, fw, fh);
      x.clip();
      x.setTransform(new DOMMatrix().translate(fx - i0, fy - j0).multiply(m));
      x.globalAlpha = Math.min(1, o);
      x.drawImage(it.pic, 0, 0);
      x.restore();
    });
    return { url: c.toDataURL("image/png"), i0, j0, fw, fh, C, R };
  };
  const box = (i, j, w, h) =>
    `left:${i * g}px;top:${j * g}px;width:${w * g}px;height:${h * g}px`;
  const toCss = (pt) => {
    const q = pt.matrixTransform(svg.getScreenCTM());
    return [q.x - rb.left, q.y - rb.top];
  };
  let html = "";
  for (const it of items) {
    if (!it.part) {
      if (it.pic._empty) continue;
      html += `<img class="px-file" alt="" draggable="false" style="${box(it.pic._at[0], it.pic._at[1], it.pic.width, it.pic.height)}" src="${await file(it.pic.toDataURL("image/png"))}">`;
      continue;
    }
    const kd = kind(it.part);
    if (kd.k === "frames") {
      const s = strip(
        it,
        Array.from({ length: kd.N }, (_, f) => (f * kd.P) / kd.N),
      );
      html += `<div class="pxs" style="${box(s.i0, s.j0, s.fw, s.fh)};--n:${s.C}${s.R > 1 ? `;--r:${s.R}` : ""};--pd:${kd.P}ms"><img class="px-file" alt="" draggable="false" src="${await file(s.url)}"></div>`;
    } else if (kd.k === "hang") {
      const s = strip(it, [0]),
        [cx, cy] = toCss(new DOMPoint(kd.cx, kd.cy));
      seek(0);
      const [ax, ay] = toCss(
        new DOMPoint(0, 0).matrixTransform(
          svg
            .getScreenCTM()
            .inverse()
            .multiply(it.part.parentNode.getScreenCTM()),
        ),
      );
      html += `<div class="pxh" style="left:${cx.toFixed(2)}px;top:${cy.toFixed(2)}px;--hp:${kd.P}ms"><div class="pxh-in" style="left:${(ax - cx).toFixed(2)}px;top:${(ay - cy).toFixed(2)}px"><img class="px-file" alt="" draggable="false" style="left:${(s.i0 * g - ax).toFixed(2)}px;top:${(s.j0 * g - ay).toFixed(2)}px;width:${s.fw * g}px;height:${s.fh * g}px" src="${await file(s.url)}"></div></div>`;
    } else {
      const s = strip(it, [0], false),
        dl = getComputedStyle(it.part).animationDelay || "0s";
      html += `<img class="px-file ${kd.cls}" alt="" draggable="false" style="${box(s.i0, s.j0, s.fw, s.fh)};animation-delay:${dl}" src="${await file(s.url)}">`;
    }
  }
  return { html, files };
}
