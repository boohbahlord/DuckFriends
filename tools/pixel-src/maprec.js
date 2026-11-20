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
    c = document.createElement("canvas");
  c.width = fw * N;
  c.height = fh;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  at.forEach(([m, o, cs], k) => {
    if (!(o > 0)) return;
    const t = new DOMMatrix()
      .translate(k * fw, 0)
      .scale(1 / g)
      .translate(shift - i0 * g, shift - j0 * g)
      .multiply(m)
      .scale(1 / d);
    x.save();
    x.beginPath();
    x.rect(k * fw, 0, fw, fh); // (each frame in its own square of the strip)
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
      out = `<div class="pxs${el.classList.contains("pg-smoke") ? " pxs-hide" : ""}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;--n:${f.n};--pd:${Math.round(f.P)}ms;--pdl:${Math.round(f.delay)}ms"><img class="px-file" alt="" draggable="false" src="${src}"></div>`; // (pxs-hide: unseen on a still page, as the smoke)
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
