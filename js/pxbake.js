/* ---------- a map's pictures made into pixels once, instead of the filter every frame (the owner's go, Nov 19 13:17Z:
   "Yeah it sounds like we should have pixel files made ahead of time for better performance") ----------
   The maps went through an SVG filter (pixel.js, #px-f) that made the whole layer into pixels again on every frame,
   because something on it always moves. On a slow computer that filter took 3 to 6 times the frame's time. A map can't be
   a file made ahead of time (it's laid out for each screen and it moves), so here each picture on it is made into pixels
   once, when the map is drawn, sampled exactly as the filter samples it (one screen pixel in each grid square, the same
   one), on the same grid. What only fades keeps fading (a fade of the pixels is the pixels of the fade). What moves or
   turns (the toy train, its wheels and smoke, the drifting shapes) is drawn each frame onto one small canvas of the
   grid's pixels (a pixel for each square, picked as the filter picks it), where it is at that moment: its CSS animation
   still moves it, out of sight, and the canvas copies it. Then the root is marked px-own and the filter leaves it
   (css/app.css). */
import { gridPx, afterPaint } from "./pixel.js";

/* the filter's sampling: n screen pixels to a square, and the one it keeps in each (pixel.js filterHTML) */
function grid() {
  const d = devicePixelRatio || 1,
    n = Math.max(1, Math.round(gridPx() * d)),
    at = n % 2 ? (n - 1) / 2 : n / 2 - 1;
  return { d, n, at, g: n / d };
}

/* an <img> or a <canvas> on root as the filter shows it: its pixels, as a canvas laid where its squares are. Returns
   the canvas (or null when the picture can't be drawn, which leaves it under the filter) */
async function bakeImg(img, rootBox, G) {
  if (img.tagName === "IMG")
    try {
      await img.decode();
    } catch {
      return null;
    }
  return sampled(
    img,
    img.getBoundingClientRect(),
    rootBox,
    G,
    /pixelated|crisp/.test(getComputedStyle(img).imageRendering), // (shown with its own pixels sharp: Pixel's sky and world)
  );
}
/* a picture (an img, a canvas) shown in r (a screen box) sampled on root's grid as the filter samples it */
function sampled(img, r, rootBox, G, crisp = false) {
  if (!r.width || !r.height) return null;
  const { d, n, at } = G,
    x0 = (r.left - rootBox.left) * d, // (where it lies, in screen pixels from root's corner)
    y0 = (r.top - rootBox.top) * d,
    ax = Math.floor(x0),
    ay = Math.floor(y0),
    aw = Math.ceil(x0 + r.width * d) - ax,
    ah = Math.ceil(y0 + r.height * d) - ay;
  /* the squares whose kept pixel falls on it */
  const i0 = Math.ceil((ax - at) / n),
    i1 = Math.floor((ax + aw - 1 - at) / n),
    j0 = Math.ceil((ay - at) / n),
    j1 = Math.floor((ay + ah - 1 - at) / n);
  if (i1 < i0 || j1 < j0) return null;
  const a = document.createElement("canvas");
  a.width = aw;
  a.height = ah;
  const ax2 = a.getContext("2d", { willReadFrequently: true });
  if (crisp) ax2.imageSmoothingEnabled = false;
  ax2.drawImage(img, x0 - ax, y0 - ay, r.width * d, r.height * d); // (drawn as the page draws it, at the screen's sharpness)
  const src = ax2.getImageData(0, 0, aw, ah).data,
    cw = i1 - i0 + 1,
    ch = j1 - j0 + 1,
    out = new ImageData(cw, ch);
  for (let j = 0; j < ch; j++) {
    const sy = (j0 + j) * n + at - ay;
    for (let i = 0; i < cw; i++) {
      const sx = (i0 + i) * n + at - ax,
        s = (sy * aw + sx) * 4,
        o = (j * cw + i) * 4;
      out.data[o] = src[s];
      out.data[o + 1] = src[s + 1];
      out.data[o + 2] = src[s + 2];
      out.data[o + 3] = src[s + 3];
    }
  }
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  c.getContext("2d").putImageData(out, 0, 0);
  c._at = [i0, j0];
  return c;
}
/* a canvas of pixels in the place of what it was made from (the same classes, so the same fades); keep: what it was
   made from stays, out of sight, after it (its own code draws on it again) */
function place(c, from, G, keep = false) {
  const [i0, j0] = c._at;
  c.className = from.className + " px-baked";
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = `${from.style.cssText};inset:auto;left:${(i0 * G.g).toFixed(3)}px;top:${(j0 * G.g).toFixed(3)}px;width:${(c.width * G.g).toFixed(3)}px;height:${(c.height * G.g).toFixed(3)}px`;
  if (from.dataset.y) c.dataset.y = from.dataset.y;
  if (keep) {
    from.after(c);
    from.classList.add("px-gone");
  } else from.replaceWith(c);
}
/* back to the drawings themselves under the filter, before they're drawn again (bakeStill's keep, movers) */
export function unbake(root, mark = root) {
  mark.classList.remove("px-own");
  root.querySelectorAll(".px-baked").forEach((c) => c.remove());
  root
    .querySelectorAll(".px-gone")
    .forEach((e) => e.classList.remove("px-gone"));
}
/* still pictures on root (sel: its <img>s and <canvas>es that don't change once drawn) made into pixels in their
   place (keep: the drawings stay, out of sight, for their code to draw on again; sel null: none), and what moves on it
   (moving: { sel, before, bg, every }) drawn each frame as pixels (movers; bg: root's own background, a color or a top
   to bottom gradient, painted under them, Sky's; every: ms between frames, 32); mark (root, or the map's layer) is marked px-own. Resolves true once they are. Call it again after each new
   drawing (a new size, a new grid): the drawing goes under the filter until then (take px-own off first) */
export async function bakeStill(
  root,
  sel,
  mark = root,
  moving = null,
  keep = false,
) {
  const G = grid(),
    rootBox = root.getBoundingClientRect();
  if (!rootBox.width || !rootBox.height) return false;
  const els = sel ? [...root.querySelectorAll(sel)] : [];
  if (sel && !els.length) return false;
  const made = await Promise.all(els.map((el) => bakeImg(el, rootBox, G)));
  if (!els.every((el) => el.isConnected) || made.some((c) => !c)) return false;
  made.forEach((c, k) => place(c, els[k], G, keep));
  if (moving) {
    const parts = [...root.querySelectorAll(moving.sel)];
    if (
      (parts.length || moving.bg) &&
      !(await movers(root, parts, G, moving.before, moving.bg, moving.every))
    )
      return false;
  }
  mark.classList.add("px-own");
  return true;
}
/* the Night Show backdrop (tools/pixel-src/nightshow.js backdropHTML) on root: its pictures made into pixels, its train
   and its drifting shapes in boxes of their own, for its pixel files (tools/pixel-maps.cjs). Resolves true once done */
export async function bakeBackdrop(root, mark = root) {
  const G = grid(),
    rootBox = root.getBoundingClientRect();
  if (!rootBox.width || !rootBox.height) return false;
  const imgs = [...root.querySelectorAll(":scope > img.bd-layer")];
  const made = await Promise.all(imgs.map((im) => bakeImg(im, rootBox, G)));
  if (!imgs.every((im) => im.isConnected)) return false; // (drawn again meanwhile: that one bakes itself)
  if (made.some((c) => !c)) return false; // (any picture that failed: the filter stays, as before)
  made.forEach((c, k) => place(c, imgs[k], G));
  /* the train (its body, wheels and smoke) and the drifting shapes: drawn each frame as pixels (movers) */
  const parts = [
    ...root.querySelectorAll(
      ":scope > .pg-train > .pg-body, :scope > .pg-train > .pg-wheel, :scope > .pg-train > .pg-smoke, :scope > .bd-sh",
    ),
  ];
  if (parts.length && !(await movers(root, parts, G))) return false;
  mark.classList.add("px-own");
  return true;
}

/* draw(now) for a canvas of moving parts, at most every `ms`, while it's on the page and seen, each time once the frame
   is on the screen (afterPaint: reading where the parts are costs nothing then). Seen: an IntersectionObserver says
   when it's out of sight (the menus' background in a game), where asking the canvas itself each frame (offsetParent)
   laid the page out again */
function frames(cv, ms, draw, gone = null) {
  let seen = true,
    at0 = 0;
  const io = new IntersectionObserver((es) => {
    seen = es[es.length - 1].isIntersecting;
  });
  io.observe(cv);
  const tick = (now) => {
    if (!cv.isConnected) {
      io.disconnect();
      if (gone) gone();
      return;
    }
    requestAnimationFrame(tick);
    if (now - at0 < ms || document.hidden || !seen) return;
    at0 = now;
    afterPaint(() => cv.isConnected && draw(now));
  };
  requestAnimationFrame(tick);
}

/* ---------- what moves, drawn each frame on the grid ----------
   Each part is drawn once at the screen's sharpness (a picture of it); each frame (30 a second at most, and only while
   something moved) every part is laid onto one canvas of root's size with a pixel for each grid square, where its
   animation has it now (its transform and its parents', read from the page) at its opacity, sampled at the pixel the
   filter keeps (no smoothing). The parts themselves stay on the page out of sight, so their animations keep running */
/* each part's chain up to root, read once (where each box sits and what it turns round don't change): only the
   transforms and the opacity are read each frame (from live computed styles), and the part's own place (a part that
   jumps from place to place: Shelter Sky & Null's squares) */
function chainOf(el, root, nodes) {
  const node = (e) => {
    if (!e || e === root) return null;
    if (!nodes.has(e)) {
      const cs = getComputedStyle(e),
        [ox, oy] = cs.transformOrigin.split(" ").map(parseFloat);
      nodes.set(e, { e, cs, ox, oy, up: node(e.offsetParent) }); // (shared by the parts it holds)
    }
    return nodes.get(e);
  };
  const leaf = node(el);
  const opacity = [];
  for (let n = leaf; n; n = n.up) opacity.push(n.cs);
  return { leaf, cs: leaf.cs, opacity };
}
/* where a box's corner and turn are now, from root's corner: its place and its transform, after its holder's (each
   holder worked out once a frame: memo) */
function matrixOf(n, memo) {
  if (!n) return new DOMMatrix();
  let m = memo.get(n);
  if (m) return m;
  m = matrixOf(n.up, memo).translate(n.e.offsetLeft, n.e.offsetTop);
  const tf = n.cs.transform;
  if (tf && tf !== "none")
    m = m
      .translate(n.ox, n.oy)
      .multiply(new DOMMatrix(tf))
      .translate(-n.ox, -n.oy);
  memo.set(n, m);
  return m;
}
/* a plain box (no picture in it: a square of color, Pixel's sun) painted from its style as it is now, in its own css px
   (k: canvas pixels to one of them, for the shadows, which the canvas draws unscaled): its background, then its
   shadows (an inset line inside it; outside, rings and glows, the first one on top) */
const BOX = {};
function paintBox(x, cs, w, h, k) {
  const shadows = (cs.boxShadow === "none" ? "" : cs.boxShadow)
    .split(/,(?![^(]*\))/)
    .map((v) => {
      const inset = /\binset\b/.test(v),
        col = (v.match(/(rgba?\([^)]*\)|#[0-9a-f]+)/i) || [""])[0],
        [ox = 0, oy = 0, blur = 0, spread = 0] = (
          v.replace(col, "").match(/-?[\d.]+px/g) || []
        ).map(parseFloat);
      return { inset, col, ox, oy, blur, spread };
    })
    .filter((v) => v.col);
  for (const v of shadows.filter((v) => !v.inset).reverse()) {
    x.save();
    x.shadowColor = v.col;
    x.shadowBlur = v.blur * k;
    x.shadowOffsetX = (v.ox + 10000) * k; // (the box itself drawn far away: only its shadow lands here)
    x.shadowOffsetY = v.oy * k;
    x.fillStyle = "#000";
    x.fillRect(
      -v.spread - 10000,
      -v.spread,
      w + 2 * v.spread,
      h + 2 * v.spread,
    );
    x.restore();
  }
  x.fillStyle = cs.backgroundColor;
  x.fillRect(0, 0, w, h);
  for (const v of shadows.filter((v) => v.inset && !v.blur)) {
    x.strokeStyle = v.col;
    x.lineWidth = v.spread;
    x.strokeRect(v.spread / 2, v.spread / 2, w - v.spread, h - v.spread);
  }
}
/* root's own background (a color, or a gradient from top to bottom) painted over W × H css px: Sky's sky */
function paintBg(x, cs, W, H) {
  const stops = [
    ...cs.backgroundImage.matchAll(/(rgba?\([^)]*\))(?:\s+([\d.]+)%)?/g),
  ];
  if (/^linear-gradient\(rgb/.test(cs.backgroundImage) && stops.length > 1) {
    const gr = x.createLinearGradient(0, 0, 0, H);
    stops.forEach(([, c, at], i) =>
      gr.addColorStop(at ? at / 100 : i / (stops.length - 1), c),
    ); // (a stop without a place: evenly between, as css, for the ends and Sky's two)
    x.fillStyle = gr;
  } else x.fillStyle = cs.backgroundColor;
  x.fillRect(0, 0, W, H);
}
/* a picture of an element drawn by css (round, with gradients and glows: Sky's sun, moon, stars and clouds), made by
   the browser itself: a copy with every style written into it, in an svg <foreignObject>. Its own place, turn and
   opacity are left out (movers puts it where it is, as it is now); room round it (_pad) for its glow */
const SKIP =
    /^(transform|translate|rotate|scale|opacity|left|top|right|bottom|inset|margin)/,
  LOOKS =
    /^(background|border|box-shadow|box-sizing|width|height|color|filter|display|position|left|top|right|bottom|transform|translate|rotate|scale|overflow|clip|mask|content|font|line-height|text-|white-space|margin|padding|opacity|visibility|z-index|aspect-ratio|outline|mix-blend|isolation|object-|vertical-align|letter|word|fill|stroke)/; // (what changes how a box looks: the rest is left out, a picture is made faster)
function inlineStyle(src, dst, top) {
  const cs = getComputedStyle(src),
    kids = [...dst.children];
  let t = "";
  for (const p of cs)
    if (LOOKS.test(p) && !(top && SKIP.test(p)))
      t += `${p}:${cs.getPropertyValue(p)};`;
  dst.setAttribute("style", t);
  if (src.namespaceURI !== "http://www.w3.org/1999/xhtml") return; // (a drawing: its parts keep their own attributes)
  for (const where of ["::before", "::after"]) {
    const ps = getComputedStyle(src, where);
    if (!ps.content || ps.content === "none" || ps.content === "normal")
      continue;
    const e = document.createElement("span");
    let u = "";
    for (const p of ps)
      if (LOOKS.test(p)) u += `${p}:${ps.getPropertyValue(p)};`;
    e.setAttribute("style", u);
    where === "::before" ? dst.prepend(e) : dst.append(e);
  }
  [...src.children].forEach(
    (c, i) => kids[i] && inlineStyle(c, kids[i], false),
  );
}
const shots = new Map(); // (the same look made once: Sky's stars; the newest kept)
async function snapshot(el, d) {
  const w = el.offsetWidth,
    h = el.offsetHeight,
    cs = getComputedStyle(el),
    pad = Math.ceil(
      Math.min(Math.max(w, h), 64) + // (what sticks out of it: Starry Night's spikes)
        ((cs.boxShadow + " " + cs.filter).match(/[\d.]+px/g) || []).reduce(
          (a, v) => a + parseFloat(v),
          0,
        ), // (and its glows and shadows, more than enough)
    ),
    copy = el.cloneNode(true);
  copy.classList.remove("px-gone");
  inlineStyle(el, copy, true);
  copy.style.position = "absolute";
  copy.style.left = pad + "px";
  copy.style.top = pad + "px";
  copy.style.margin = "0";
  copy.style.visibility = "visible";
  const W = w + 2 * pad,
    H = h + 2 * pad,
    box = document.createElement("div");
  box.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  box.style.cssText = `position:relative;width:${W}px;height:${H}px`;
  box.append(copy);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="${W}" height="${H}">${new XMLSerializer().serializeToString(box)}</foreignObject></svg>`,
    key = d + svg;
  if (shots.has(key)) return shots.get(key);
  const im = new Image();
  im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await im.decode();
  const c = document.createElement("canvas");
  c.width = Math.round(W * d);
  c.height = Math.round(H * d);
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
  c._pad = pad;
  shots.set(key, c);
  if (shots.size > 80) shots.delete(shots.keys().next().value);
  return c;
}
/* a part's picture at the screen's sharpness: an <img>, a drawing (svg), the smoke's soft dot, a plain colored box
   (its background and an inset line), or a <canvas> that its own code keeps drawing (then the canvas itself, drawn
   each frame). Grey under a .grey scene (Shelter Sky & Null in black and white) */
async function pictureOf(el, d) {
  if (el.tagName === "CANVAS") return el;
  if (el.tagName === "IMG" && !/svg/.test(el.src)) {
    await el.decode();
    return el; // (a ready picture, maybe a huge one: Starry Night's sky, drawn from itself)
  }
  const w = el.offsetWidth,
    h = el.offsetHeight,
    c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * d));
  c.height = Math.max(1, Math.round(h * d));
  const x = c.getContext("2d");
  if (el.closest(".grey")) x.filter = "grayscale(1)";
  if (el.tagName === "IMG") {
    await el.decode();
    x.drawImage(el, 0, 0, c.width, c.height);
  } else if (el.classList.contains("pg-smoke")) {
    const r = c.width / 2,
      gr = x.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "#e9e4ffcc");
    gr.addColorStop(0.7, "#e9e4ff00"); // (css .pg-smoke: radial-gradient(#e9e4ffcc, #e9e4ff00 70%))
    x.fillStyle = gr;
    x.beginPath();
    x.arc(r, r, r, 0, Math.PI * 2);
    x.fill();
  } else if (el.classList.contains("px-shot")) {
    return snapshot(el, d);
  } else if (!el.children.length) {
    return BOX; // (painted each frame from its style: paintBox)
  } else {
    const svg = el.querySelector("svg");
    if (!svg) return null;
    const s = svg.cloneNode(true);
    s.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    s.setAttribute("width", w);
    s.setAttribute("height", h);
    const im = new Image();
    im.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(new XMLSerializer().serializeToString(s));
    await im.decode();
    x.drawImage(im, 0, 0, c.width, c.height);
  }
  return c;
}
/* the parts (in the page's order) drawn each frame on one canvas, put before `before` (by default the first part, or
   the train holding it) */
async function movers(root, parts, G, before, bg = false, every = 32) {
  const { d, n, at, g } = G;
  let pics;
  try {
    pics = await Promise.all(parts.map((el) => pictureOf(el, d)));
  } catch {
    return false;
  }
  if (pics.some((p) => !p) || !root.isConnected) return false;
  const W = root.clientWidth,
    H = root.clientHeight,
    cv = document.createElement("canvas");
  cv.className = "bd-layer px-baked px-movers";
  cv.setAttribute("aria-hidden", "true");
  cv.width = Math.ceil(W / g);
  cv.height = Math.ceil(H / g);
  cv.style.cssText = `width:${(cv.width * g).toFixed(3)}px;height:${(cv.height * g).toFixed(3)}px;right:auto;bottom:auto`;
  const x = cv.getContext("2d");
  x.imageSmoothingEnabled = false;
  const nodes = new Map(),
    chains = parts.map((el) => chainOf(el, root, nodes)),
    live = parts.some((el) => el.tagName === "CANVAS"), // (a canvas that keeps drawing itself: drawn again every frame)
    grey = parts.map((el) => !!el.closest(".grey")),
    rootCs = getComputedStyle(root);
  /* a canvas pixel's middle lands on the screen pixel the filter keeps in its square */
  const shift = (n / 2 - at - 0.5) / d;
  /* nothing in it moves by itself (no animation or transition from its parts up to root: Duck Cabin's and Tiles'
     scenes): nothing read or drawn again until something under root, or round it, changes its classes or style.
     Reading its place each frame made the browser work out the page's styles again mid-game (Downpour) */
  const moves = (cs) =>
      cs.animationName.split(",").some((a) => a.trim() !== "none") ||
      cs.transitionDuration.split(",").some((t) => parseFloat(t) > 0),
    stillNow = () =>
      !live && ![rootCs, ...[...nodes.values()].map((n) => n.cs)].some(moves);
  let last = "",
    still = stillNow(),
    changed = false;
  const mo = new MutationObserver(() => (changed = true)),
    look = { attributes: true, attributeFilter: ["class", "style"] };
  mo.observe(root, { ...look, subtree: true });
  for (let e = root.parentElement; e; e = e.parentElement) mo.observe(e, look);
  const draw = () => {
    if (still && last && !changed) return;
    if (changed) {
      changed = false;
      still = stillNow();
    }
    const memo = new Map(),
      now2 = chains.map((c) => [
        matrixOf(c.leaf, memo),
        c.opacity.reduce((o, cs) => o * cs.opacity, 1), // (its opacity, and what holds it: Sky's stars fade out by day)
      ]),
      key =
        now2
          .map(
            ([m, o], k) =>
              m.toString() +
              o +
              (pics[k] === BOX ? chains[k].cs.boxShadow : ""),
          )
          .join() + (bg ? rootCs.backgroundImage + rootCs.backgroundColor : "");
    if (key === last && !live) return; // (nothing moved: as it is)
    last = key;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, cv.width, cv.height);
    if (bg) {
      x.setTransform(new DOMMatrix().scale(1 / g).translate(shift, shift));
      paintBg(x, rootCs, W, H);
    }
    now2.forEach(([m, o], k) => {
      if (!(o > 0)) return;
      const t = new DOMMatrix()
        .scale(1 / g)
        .translate(shift, shift)
        .multiply(m)
        .scale(1 / d);
      x.setTransform(t);
      x.globalAlpha = Math.min(1, o);
      const p = pics[k];
      if (p === BOX) {
        x.setTransform(t.scale(d)); // (in its css px)
        if (grey[k]) x.filter = "grayscale(1)";
        paintBox(
          x,
          chains[k].cs,
          parts[k].offsetWidth,
          parts[k].offsetHeight,
          1 / g,
        );
        x.filter = "none";
      } else if (p === parts[k])
        x.drawImage(p, 0, 0, p.offsetWidth * d, p.offsetHeight * d); // (a live canvas or a ready picture, at its size on the page)
      else x.drawImage(p, -(p._pad || 0) * d, -(p._pad || 0) * d);
    });
    x.globalAlpha = 1;
  };
  if (before === "first") root.prepend(cv);
  else (before || parts[0].closest(".pg-train") || parts[0]).before(cv);
  for (const el of parts) el.classList.add("px-gone"); // (out of sight: css/app.css)
  frames(cv, every, draw, () => mo.disconnect());
  return true;
}

/* a sampled canvas cut to the part of it that isn't empty (null when all of it is) */
function trimmed(c) {
  if (!c) return c;
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let i0 = c.width,
    j0 = c.height,
    i1 = -1,
    j1 = -1;
  for (let j = 0; j < c.height; j++)
    for (let i = 0; i < c.width; i++)
      if (d[(j * c.width + i) * 4 + 3]) {
        if (i < i0) i0 = i;
        if (i > i1) i1 = i;
        if (j < j0) j0 = j;
        if (j > j1) j1 = j;
      }
  if (i1 < 0)
    return Object.assign(document.createElement("canvas"), {
      width: 1,
      height: 1,
      _at: [0, 0],
      _empty: true,
    });
  const t = document.createElement("canvas");
  t.width = i1 - i0 + 1;
  t.height = j1 - j0 + 1;
  t.getContext("2d").drawImage(c, -i0, -j0);
  t._at = [c._at[0] + i0, c._at[1] + j0];
  return t;
}
/* ---------- a whole scene drawn as one <svg> with moving parts inside it (Carnival Night) ----------
   The parts that move (anim: a selector; their CSS animations turn, wave and twinkle them) each get a picture of their
   own, made once at the screen's sharpness; what lies between them in the drawing's order is made into pixels once, a
   run at a time (what lies under them all on a canvas of its own). Each frame (15 a second at most) one canvas of the grid's pixels gets the runs and the parts in the
   drawing's order, each part where the page has it now (getScreenCTM: its place with its animation) at its opacity.
   The drawing stays on the page out of sight, so its animations keep running. mark is marked px-own */
const SHAPES =
  /^(path|rect|circle|ellipse|line|polyline|polygon|text|image|use)$/i;
const UNDRAWN = "defs, clipPath, mask, pattern, marker, symbol"; // (shapes only used by others)
const svgOf = (inner, vb, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
async function svgPic(markup, w, h) {
  const im = new Image();
  im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
  await im.decode();
  return im;
}
/* the drawing's order as items: runs of still shapes made into pixels ({ pic: a trimmed canvas on the grid }) and the
   moving parts ({ part, pic at the screen's sharpness, at: [x, y, k] where it lies in the drawing's units, cs }); null
   if a picture couldn't be made */
async function svgItems(root, svg, anim) {
  const G = grid(),
    { d } = G,
    rb = root.getBoundingClientRect(),
    sb = svg.getBoundingClientRect(),
    vbox = svg.getAttribute("viewBox");
  if (!sb.width || !sb.height || !vbox) return null;
  const parts = new Set(svg.querySelectorAll(anim)),
    defs = [...svg.querySelectorAll("defs")].map((e) => e.outerHTML).join(""),
    all = [...svg.querySelectorAll("*")];
  /* the drawing's order: runs of still shapes, and the moving parts (a part inside a part comes after it) */
  const items = [];
  let run = null;
  const walk = (e, inPart) => {
    for (const c of e.children) {
      if (c.closest(UNDRAWN)) continue;
      if (parts.has(c)) {
        items.push({ part: c });
        run = null;
        walk(c, true);
      } else if (inPart) walk(c, true);
      else if (SHAPES.test(c.tagName)) {
        if (!run) items.push((run = { leaves: new Set() }));
        run.leaves.add(c);
      } else walk(c, false);
    }
  };
  walk(svg, false);
  const vb = vbox.split(/[\s,]+/).map(Number),
    S = Math.min(sb.width / vb[2], sb.height / vb[3]); // (css px to one of the drawing's units)
  try {
    for (const it of items) {
      if (it.leaves) {
        /* a run: the whole drawing with everything else hidden, made into pixels where it shows */
        const copy = svg.cloneNode(true),
          ca = [...copy.querySelectorAll("*")];
        all.forEach((e, i) => {
          if (
            (SHAPES.test(e.tagName) &&
              !it.leaves.has(e) &&
              !e.closest(UNDRAWN)) ||
            parts.has(e)
          )
            ca[i].setAttribute("visibility", "hidden");
          ca[i].removeAttribute("class"); // (no page css in a picture: the still pose)
        });
        copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        copy.setAttribute("width", sb.width);
        copy.setAttribute("height", sb.height);
        copy.removeAttribute("style");
        const im = await svgPic(new XMLSerializer().serializeToString(copy));
        it.pic = trimmed(sampled(im, sb, rb, G));
      } else {
        /* a part: its own shapes, in its own units, inherited colors written onto it */
        const e = it.part,
          b = e.getBBox(),
          p = 14, // (room for strokes)
          cs = getComputedStyle(e),
          copy = e.cloneNode(true);
        for (const a of ["class", "style", "transform", "opacity"])
          copy.removeAttribute(a);
        const inner = e.querySelectorAll("*");
        copy.querySelectorAll("*").forEach((c, i) => {
          c.removeAttribute("class");
          if (parts.has(inner[i])) c.setAttribute("visibility", "hidden"); // (a part of its own)
        });
        const wrap = `<g fill="${cs.fill}" stroke="${cs.stroke}" stroke-width="${cs.strokeWidth}" fill-opacity="${cs.fillOpacity}" stroke-opacity="${cs.strokeOpacity}">${new XMLSerializer().serializeToString(copy)}</g>`,
          bw = b.width + 2 * p,
          bh = b.height + 2 * p,
          k = S * d;
        it.pic = await svgPic(
          svgOf(
            defs + wrap,
            `${b.x - p} ${b.y - p} ${bw} ${bh}`,
            bw * k,
            bh * k,
          ),
        );
        it.at = [b.x - p, b.y - p, k];
        it.cs = cs;
      }
    }
  } catch {
    return null;
  }
  if (!svg.isConnected || items.some((it) => !it.pic)) return null;
  return items;
}
export async function bakeSvg(root, svg, mark, anim) {
  const G = grid(),
    { d, n, at, g } = G,
    rb = root.getBoundingClientRect();
  const items = await svgItems(root, svg, anim);
  if (!items) return false;
  const canvas = () => {
    const c = document.createElement("canvas");
    c.className = "bd-layer px-baked px-movers";
    c.setAttribute("aria-hidden", "true");
    c.width = Math.ceil(rb.width / g);
    c.height = Math.ceil(rb.height / g);
    c.style.cssText = `width:${(c.width * g).toFixed(3)}px;height:${(c.height * g).toFixed(3)}px;right:auto;bottom:auto`;
    return c;
  };
  const still = (it) => {
    if (!it.pic._empty) bx.drawImage(it.pic, it.pic._at[0], it.pic._at[1]);
  };
  /* what lies under every moving part (the sky) on a canvas of its own, drawn once */
  const under = canvas(),
    bx = under.getContext("2d");
  while (items.length && items[0].leaves) still(items.shift());
  const cv = canvas(),
    x = cv.getContext("2d");
  x.imageSmoothingEnabled = false;
  const shift = (n / 2 - at - 0.5) / d,
    base = new DOMMatrix()
      .scale(1 / g)
      .translate(shift, shift)
      .translate(-rb.left, -rb.top); // (the page's corner to root's, then to the grid's pixels)
  let last = "";
  const draw = () => {
    const where = items.map((it) =>
        it.leaves
          ? null
          : [base.multiply(it.part.getScreenCTM()), +it.cs.opacity],
      ),
      key = where.map((w) => (w ? w[0].toString() + w[1] : "")).join();
    if (key === last) return; // (nothing moved: as it is)
    last = key;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, cv.width, cv.height);
    items.forEach((it, i) => {
      if (it.leaves) {
        if (it.pic._empty) return;
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.globalAlpha = 1;
        x.drawImage(it.pic, it.pic._at[0], it.pic._at[1]);
        return;
      }
      const [m, o] = where[i];
      if (!(o > 0)) return;
      const [ux, uy, k] = it.at;
      x.setTransform(m.translate(ux, uy).scale(1 / k));
      x.globalAlpha = Math.min(1, o);
      x.drawImage(it.pic, 0, 0);
    });
    x.globalAlpha = 1;
  };
  svg.after(under, cv);
  svg.classList.add("px-gone");
  frames(cv, 64, draw); // (15 a second: slow turns and twinkles)
  mark.classList.add("px-own");
  return true;
}

/* ---------- a layer drawn in code, once, as pixels ----------
   el's picture painted by paint(x, w, h, el) (in its css px) onto a canvas with a pixel for each grid square, each pixel's
   color the one at the screen pixel the filter keeps; made again only when el's size or the grid changes. el is marked
   px-own (its css drops the filter and its own background for the canvas) */
export function bakeFill(el, paint) {
  const G = grid(),
    w = el.clientWidth,
    h = el.clientHeight,
    key = [w, h, G.n, G.d].join();
  if (!w || !h || el._pxKey === key) return;
  el._pxKey = key;
  const cv =
    el.querySelector(":scope > canvas.px-fill") ||
    document.createElement("canvas");
  cv.className = "px-baked px-fill";
  cv.width = Math.ceil(w / G.g);
  cv.height = Math.ceil(h / G.g);
  cv.style.cssText = `position:absolute;left:0;top:0;width:${(cv.width * G.g).toFixed(3)}px;height:${(cv.height * G.g).toFixed(3)}px`;
  const x = cv.getContext("2d"),
    shift = (G.n / 2 - G.at - 0.5) / G.d; // (a canvas pixel's middle on the kept screen pixel, as movers)
  x.setTransform(new DOMMatrix().scale(1 / G.g).translate(shift, shift));
  paint(x, w, h, el);
  if (!cv.isConnected) el.prepend(cv);
  el.classList.add("px-own");
}

/* for the map bake (tools/pixel-maps.cjs) only: how a part is pictured and painted, the same as here */
export const forBake = { grid, pictureOf, paintBox, BOX, svgItems };
