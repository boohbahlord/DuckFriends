/* ---------- the pixel look for drawings already on the page (owner, Nov 16; pixel.js does the pixels) ----------
   Much of the game is drawn as inline SVG that its own code keeps changing: Duck Cabin's props (a lamp switched off, a
   door opened, a seat taken), the zombies' boards, the drops, Mad God Justin's things. pxWatch(root) shows every such
   drawing under root as pixels without taking it away: the drawing stays where it is (its ids, its clicks and its
   size all as before) but turns invisible, and over it, inside the same <svg>, an <image> shows its pixel picture. The
   picture is made from the drawing as it looks at that moment (its CSS written into a copy, so a lamp that's off is
   made off), by pixel.js' raster(): small on the grid, through the game's palette, cached. When the drawing changes
   (its parts, its classes or the classes of what holds it), it's made again, at most every PACE ms per drawing.
   Only with the pixel look on (pixel.js' pixelOn()). */
import {
  pixelOn,
  gridPx,
  snap,
  raster,
  rasterReady,
  rainbowSteps,
  afterPaint,
  bakedPiece,
  bakedWait,
} from "./pixel.js";
import { hasRb, RB_N } from "./rainbowskin.js";

const NS = "http://www.w3.org/2000/svg",
  PACE = 120, // (ms between two new pictures of one drawing that keeps changing)
  /* what CSS can change in a drawing, copied into the copy that's made into pixels */
  PROPS = [
    "fill",
    "stroke",
    "opacity",
    "fill-opacity",
    "stroke-opacity",
    "visibility",
    "display",
    "color",
    "stop-color",
    "stop-opacity",
  ];

/* a position for a translate(), in css px: on the grid with the look on, so nothing drawn moves by less than one pixel */
export const pxAt = (v) => (pixelOn() ? snap(v).toFixed(2) : v.toFixed(1));

/* a drawing left alone: under [data-nopx] (a map: drawn as pixels already), unless something nearer it asks for its
   pixels ([data-pxyes]: Sky's duck riding a cloud) */
const noPx = (svg) => {
  const n = svg.closest("[data-nopx], [data-pxyes]");
  return !!n && n.hasAttribute("data-nopx");
};

/* the rules: a drawing shown as pixels hides its own parts (its picture is the only thing that shows) */
function css() {
  if (document.getElementById("pxdom-css")) return;
  const s = document.createElement("style");
  s.id = "pxdom-css";
  s.textContent =
    "svg[data-px]>:not(image.pxi,g.pxt,svg.pxw),svg[data-pxwait]>:not(image.pxi,g.pxt,svg.pxw){opacity:0!important}" +
    "image.pxi{image-rendering:pixelated;pointer-events:none}";
  document.head.append(s);
}

/* the box a drawing's viewBox fills on the screen, in css px (as the browser fits it: meet, slice or none). A sliced
   drawing (cut to fill its box, as the front page's ball pit) is shown bigger than its box: made at the box's size, its
   pixels came out stretched, bigger than everything else's (owner, Nov 16: one pixel size for every background) */
function shownSize(svg, vb) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const [w, h] = unturned(svg) || [r.width, r.height];
  const par = svg.getAttribute("preserveAspectRatio") || "";
  if (par.startsWith("none")) return [w, h];
  const k = (par.includes("slice") ? Math.max : Math.min)(
    w / vb.width,
    h / vb.height,
  );
  return [vb.width * k, vb.height * k];
}
/* what turns as it flies or is held (a weapon in hand, a bullet, an arrow, a thrown dagger or grenade, the grenade's
   pin, the zebra cake): its box on the screen is the box round it turned, so a long
   thin one pointing up or down measured as a sliver and was made with barely any pixels, and kept that way (the
   owner's, Nov 18 10:38Z: "when i first picked up the laser gun ... it was rendered as being almost barely any pixels",
   and "grenades and bow projectiles unseen"). Its size unturned instead: its own width and height, times how much the
   board is scaled. A dead duck's pool of blood too, which grows from small (game.js .gduck-pool): made at its full
   size, not at the size it starts from. Null for everything else */
const TURNS = ".held, .bullet, .thrown, .gpin, .mgj-cake, .gduck-pool";
function unturned(svg) {
  const host = svg.closest(TURNS);
  if (!host || !svg.clientWidth || !svg.clientHeight) return null;
  const up = host.parentElement,
    k =
      up && up.offsetWidth
        ? up.getBoundingClientRect().width / up.offsetWidth
        : 1;
  return [svg.clientWidth * k, svg.clientHeight * k];
}

/* a copy of the drawing as it looks now, as SVG text: every part's CSS (from classes, and from the classes of what
   holds it) written into the part itself, so the picture is made as it's seen (read with its hiding rule off: make) */
function snapshot(svg, vb) {
  const copy = svg.cloneNode(true);
  copy.querySelectorAll("image.pxi, g.pxt, svg.pxw").forEach((e) => e.remove());
  const from = [svg, ...svg.querySelectorAll("*")].filter(
      (e) => !e.closest("image.pxi, g.pxt, svg.pxw"),
    ),
    to = [copy, ...copy.querySelectorAll("*")];
  for (let i = 0; i < from.length && i < to.length; i++) {
    const cs = getComputedStyle(from[i]);
    let st = "";
    for (const p of PROPS) {
      const v = cs.getPropertyValue(p);
      if (v) st += `${p}:${v};`;
    }
    if (i === 0) st += "opacity:1;"; // (the drawing's own see-through belongs to what shows it: the <svg> stays as it is)
    to[i].setAttribute("style", st + (to[i].getAttribute("style") || ""));
  }
  copy.querySelectorAll("text").forEach((t) => {
    if (!t.querySelector("textPath")) t.remove();
  }); // (its words stay words: words(), over the picture)
  copy.removeAttribute("data-px");
  copy.removeAttribute("class");
  copy.setAttribute("xmlns", NS);
  copy.setAttribute("width", vb.width);
  copy.setAttribute("height", vb.height);
  return sameIds(new XMLSerializer().serializeToString(copy));
}

/* the same for a drawing the game makes into pixels ahead of time (tools/pixel-world.cjs): its copy as it looks now */
export const pxSnapshot = (svg) => snapshot(svg, svg.viewBox.baseVal);
/* a drawing's text with its ids renamed in order (sameIds): the same drawing made twice is the same text */
export const steadyText = (text) => sameIds(text);

/* a drawing's ids are often new each time it's drawn (duck.js counts them), so the same look would be a new picture
   every time (made again, and a gap while it's made). Its ids renamed in order, the same look is the same text */
function sameIds(text) {
  const ids = [...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  if (!ids.length) return text;
  const to = new Map(ids.map((id, i) => [id, "q" + i])),
    esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(["#])(${ids.map(esc).join("|")})(?=["')&])`, "g"), // (&: a style's url("#…"), its quotes written &quot;)
    (m, a, id) => a + to.get(id),
  );
}

/* the drawing's text without my picture in it, and the classes around it: when these change, it's made again */
const ownText = (svg) =>
  svg.outerHTML
    .replace(/<svg class="pxw"[\s\S]*?<\/svg>/g, "")
    .replace(/<image class="pxi"[^>]*>(<\/image>)?/g, "")
    .replace(/<g class="pxt">[\s\S]*?<\/g>/g, "");

/* the owner's "128": a drawing's words aren't made into pixels with it. A copy of each, where it shows and as it looks,
   goes over the picture in one <g class="pxt">, sharp, in the pixel font. (Not words along a curve: those are art) */
function words(svg) {
  const list = [...svg.querySelectorAll("text")].filter(
    (t) => !t.closest("g.pxt") && !t.querySelector("textPath"),
  );
  if (!list.length) return null;
  const g = document.createElementNS(NS, "g"),
    inv = svg.getScreenCTM()?.inverse();
  if (!inv) return null;
  g.setAttribute("class", "pxt");
  g.setAttribute("pointer-events", "none");
  for (const t of list) {
    const cs = getComputedStyle(t),
      m = t.getScreenCTM();
    if (!m || cs.display === "none" || cs.visibility === "hidden") continue;
    let op = 1;
    for (let e = t; e && e !== svg; e = e.parentElement)
      op *= +getComputedStyle(e).opacity;
    if (op < 0.05) continue;
    const c = t.cloneNode(true),
      k = inv.multiply(m);
    c.removeAttribute("class");
    c.setAttribute(
      "transform",
      `matrix(${k.a} ${k.b} ${k.c} ${k.d} ${k.e} ${k.f})`,
    );
    let st = "";
    for (const p of [
      "fill",
      "stroke",
      "stroke-width",
      "paint-order",
      "font-size",
      "font-weight",
      "text-anchor",
      "dominant-baseline",
      "letter-spacing",
    ])
      st += `${p}:${cs.getPropertyValue(p)};`;
    c.setAttribute("style", st + `opacity:${op}`);
    g.append(c);
  }
  return g.childNodes.length ? g : null;
}
/* classes that only move the board (its quake shake is a transform animation) change no pixel of a drawing: left out of
   the key, every shake made all the walls and the HP badge into pictures again (Downpour: dozens a second) */
const MOTION = /(^|\s)quake(?=\s|$)/g;
function around(svg, root) {
  let s = "";
  for (let e = svg; e && e !== root; e = e.parentElement)
    s += (e.getAttribute("class") || "").replace(MOTION, "") + "|";
  return s;
}

/* one drawing as pixels (or as it was, with the look off). Safe to call again: it only makes a new picture when the
   drawing, the classes around it or its size on the screen changed */
const state = new WeakMap(); // svg -> { key, at, timer, img }
const sizeOf = (svg) => {
  const vb = svg.viewBox && svg.viewBox.baseVal;
  return vb && vb.width && vb.height ? shownSize(svg, vb) : null;
};
export function pxSvgEl(svg, root = document.body, size) {
  const job = plan(svg, root, size);
  if (job) make([job]);
}
/* whether a drawing needs a new picture, and at what size: only reads, nothing changed on the page yet (null: it
   doesn't, or not now) */
const requeue = new WeakMap(); // root -> its pxWatch's want(): a drawing that waits for PACE goes back in its queue
function plan(svg, root, size) {
  if (!pixelOn()) {
    unPx(svg);
    return null;
  }
  if (noPx(svg) || svg.ownerSVGElement) return null; // (inside another drawing: that one carries it)
  const vb = svg.viewBox && svg.viewBox.baseVal;
  if (!vb || !vb.width || !vb.height) return null; // (no viewBox: nothing to fit a picture to)
  if (size === undefined) size = shownSize(svg, vb); // (or read already: pxWatch's flush)
  if (!size) return null; // (not on the screen yet: made when it shows, pxRefresh)
  const g = gridPx(),
    cw = Math.max(1, Math.round(size[0] / g)),
    ch = Math.max(1, Math.round(size[1] / g)),
    key = cw + "x" + ch + "|" + around(svg, root) + ownText(svg);
  let st = state.get(svg);
  if (!st) state.set(svg, (st = { key: "", at: 0, timer: 0, img: null }));
  if (
    st.key === key &&
    ((st.img && st.img.isConnected) || (st.win && st.win.isConnected))
  )
    return null;
  const wait = st.at + PACE - performance.now();
  if (wait > 0) {
    if (!st.timer)
      st.timer = setTimeout(() => {
        st.timer = 0;
        const want = requeue.get(root);
        if (want) want(svg);
        else pxSvgEl(svg, root);
      }, wait);
    return null;
  }
  st.key = key;
  st.at = performance.now();
  return { svg, st, key, vb, w: cw * g, h: ch * g };
}
/* the drawings' new pictures. Every drawing is read first (as it looks: its hiding rule taken off all of them at
   once), then every picture put in: read one by one between the changes, the browser worked out the whole page's
   styles again for each */
function make(jobs) {
  css();
  const hid = jobs.map((j) => [
    j.svg.hasAttribute("data-px"),
    j.svg.hasAttribute("data-pxwait"),
  ]);
  for (const j of jobs) {
    j.svg.removeAttribute("data-px");
    j.svg.removeAttribute("data-pxwait");
  }
  for (const j of jobs) {
    j.text = snapshot(j.svg, j.vb);
    j.tx = words(j.svg);
  }
  jobs.forEach((j, i) => {
    if (hid[i][0]) j.svg.setAttribute("data-px", "");
    if (hid[i][1]) j.svg.setAttribute("data-pxwait", "");
  }); // (read as it looks, all in one go, so nothing is seen in between)
  for (const j of jobs) put(j);
}
function put(job) {
  const { svg, st, key, vb, w, h, text, tx } = job;
  const k = (svg.matches(".duck, .cat") ? "c" : "d") + hash(text); // (c: a character, made from its parts: the ducks' sheets)
  if (hasRb(text)) return rbShow(svg, st, key, text, vb, w, h);
  const piece = bakedPiece(k, w, h);
  if (piece) return fileShow(svg, st, piece, vb, tx);
  const files = bakedWait(k); // (in the files, and they're on their way: shown from them once they're here)
  if (files)
    return void files.then(() => {
      if (st.key === key) put(job);
    });
  let img = st.img;
  if (!img || img.parentNode !== svg) {
    img = document.createElementNS(NS, "image");
    img.setAttribute("class", "pxi");
    img.setAttribute("preserveAspectRatio", "none");
    st.img = img;
  }
  img.setAttribute("x", vb.x);
  img.setAttribute("y", vb.y);
  img.setAttribute("width", vb.width);
  img.setAttribute("height", vb.height);
  const show = (url) => {
    if (st.key !== key) return;
    if (!url) return svg.removeAttribute("data-pxwait"); // (it couldn't be made: the drawing after all, rather than nothing)
    img.setAttribute("href", url);
    if (img.parentNode !== svg) svg.append(img);
    if (st.win) st.win.remove();
    svg.querySelectorAll(":scope > g.pxt").forEach((e) => e.remove());
    if (tx) svg.append(tx);
    svg.setAttribute("data-px", ""); // (its picture there: its own parts hidden)
    svg.removeAttribute("data-pxwait");
  };
  const ext = inlined(text);
  if (ext) ext.then((t) => rasterReady(k, t, w, h)).then(show);
  else {
    const u = raster(k, text, w, h);
    if (u) show(u);
    else rasterReady(k, text, w, h).then(show);
  }
}

/* a drawing made into pixels ahead of time (pixel.js bakedPiece): its piece of the files' picture, shown as it is
   through a window the drawing's size (svg.pxw). Nothing is made on the device */
function fileShow(svg, st, { url, W, H, at }, vb, tx) {
  let win = st.win;
  if (!win || win.dataset.f !== "1") {
    if (win) win.remove();
    win = document.createElementNS(NS, "svg");
    win.setAttribute("class", "pxw");
    win.setAttribute("overflow", "hidden");
    win.setAttribute("preserveAspectRatio", "none");
    win.dataset.f = "1";
    const im = document.createElementNS(NS, "image");
    im.setAttribute("class", "pxi");
    im.setAttribute("preserveAspectRatio", "none");
    win.append(im);
    st.win = win;
  }
  win.setAttribute("x", vb.x);
  win.setAttribute("y", vb.y);
  win.setAttribute("width", vb.width);
  win.setAttribute("height", vb.height);
  win.setAttribute("viewBox", `${at[2]} ${at[3]} ${at[0]} ${at[1]}`);
  /* (in its own words too: the page's rules for a drawing's svg, its size or "overflow: visible", reach this one inside
     it, and the whole picture of every drawing showed round the speaker) */
  win.style.cssText = `overflow:hidden;filter:none;transform:none;x:${vb.x}px;y:${vb.y}px;width:${vb.width}px;height:${vb.height}px`;
  const im = win.firstChild;
  im.setAttribute("width", W);
  im.setAttribute("height", H);
  if (im.getAttribute("href") !== url) im.setAttribute("href", url);
  if (win.parentNode !== svg) svg.append(win);
  if (st.img) st.img.remove();
  svg.querySelectorAll(":scope > g.pxt").forEach((e) => e.remove());
  if (tx) svg.append(tx);
  svg.setAttribute("data-px", "");
  svg.removeAttribute("data-pxwait");
}

/* a drawing wearing the rainbow skin (rainbowskin.js): every step of the rainbow's turn in one tall picture, seen
   through a window the drawing's size (svg.pxw), stepped through by css (image.rbsp) */
function rbShow(svg, st, key, text, vb, w, h) {
  const R = rainbowSteps(text, vb.width, vb.height, w, h);
  let win = st.win;
  if (win && win.dataset.f) {
    win.remove(); // (the window of a picture from the files: not this one's)
    win = null;
  }
  if (!win) {
    win = document.createElementNS(NS, "svg");
    win.setAttribute("class", "pxw");
    win.setAttribute("overflow", "hidden");
    const im = document.createElementNS(NS, "image");
    im.setAttribute("class", "pxi rbsp");
    im.setAttribute("preserveAspectRatio", "none");
    win.append(im);
    st.win = win;
  }
  win.setAttribute("x", vb.x);
  win.setAttribute("y", vb.y);
  win.setAttribute("width", vb.width);
  win.setAttribute("height", vb.height);
  win.setAttribute("viewBox", `0 0 ${vb.width} ${vb.height}`);
  const im = win.firstChild;
  im.setAttribute("width", vb.width);
  im.setAttribute("height", vb.height * RB_N);
  im.style.setProperty("--rbh", vb.height + "px");
  const show = (url) => {
    if (st.key !== key) return;
    if (!url) return svg.removeAttribute("data-pxwait");
    im.setAttribute("href", url);
    if (win.parentNode !== svg) svg.append(win);
    if (st.img) st.img.remove();
    svg.querySelectorAll(":scope > g.pxt").forEach((e) => e.remove());
    svg.setAttribute("data-px", "");
    svg.removeAttribute("data-pxwait");
  };
  const u = raster(R.key, R.sprite, R.w, R.h);
  if (u) show(u);
  else rasterReady(R.key, R.sprite, R.w, R.h).then(show);
}

/* a drawing made into a picture can't load its own pictures (an <image> of a file: a mode's screenshot, a map's photo),
   so they go into its text first, as data. Null when it has none to load */
const dataOf = new Map(); // url -> Promise<data url>
function inlined(text) {
  const urls = [
    ...new Set(
      [...text.matchAll(/<image\b[^>]*?\s(?:xlink:)?href="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((u) => !u.startsWith("data:")),
    ),
  ];
  if (!urls.length) return null;
  return Promise.all(
    urls.map((u) => {
      if (!dataOf.has(u))
        dataOf.set(
          u,
          fetch(u.replace(/&amp;/g, "&"))
            .then((r) => r.blob())
            .then(
              (b) =>
                new Promise((ok) => {
                  const fr = new FileReader();
                  fr.onload = () => ok(fr.result);
                  fr.readAsDataURL(b);
                }),
            )
            .catch(() => u),
        );
      return dataOf.get(u);
    }),
  ).then((ds) =>
    urls.reduce((t, u, i) => t.split(`"${u}"`).join(`"${ds[i]}"`), text),
  );
}
function unPx(svg) {
  svg.removeAttribute("data-pxwait");
  if (!svg.hasAttribute("data-px")) return;
  svg.removeAttribute("data-px");
  svg
    .querySelectorAll("image.pxi, :scope > g.pxt, :scope > svg.pxw")
    .forEach((e) => e.remove());
  state.delete(svg);
}

/* every drawing under root as pixels, now and whenever one is added or changes. Returns a function that stops it (it
   also stops by itself once root has been on the page and left it). skip: a selector for parts of root it leaves alone (the ducks,
   which game.js makes into pixels itself) */
const ATTRS = [
  "class",
  "d",
  "fill",
  "stroke",
  "opacity",
  "transform",
  "points",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "width",
  "height",
  "href",
  "viewBox",
  "hidden",
];
export function pxWatch(root, { skip = "" } = {}) {
  let queued = new Set(),
    raf = 0,
    was = false; // (root has been on the page)
  const gone = () => {
    if (root.isConnected) was = true;
    else if (was) stop();
    return !root.isConnected;
  };
  /* once the frame is on the screen (afterPaint), every size read first, then every picture made: a size read after a
     picture went in made the browser lay the page out again, once per drawing */
  const flush = () => {
    if (gone()) return;
    const list = [...queued].filter((svg) => svg.isConnected);
    queued = new Set();
    const sizes = list.map(sizeOf),
      jobs = list.map((svg, i) => plan(svg, root, sizes[i])).filter(Boolean);
    list.forEach((svg, i) => {
      if (!sizes[i] && svg.hasAttribute("data-pxwait"))
        if (sized) sized.observe(svg);
        else svg.removeAttribute("data-pxwait");
    }); // (not on the screen yet: made once it shows, hidden till then)
    if (jobs.length) make(jobs);
  };
  /* a new drawing is hidden from the start until its picture is there (the owner's, Nov 19 17:00Z: the original
     pictures popped in before their pixels). Set as it comes in, before the screen is drawn */
  const sized =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver((es) =>
          es.forEach((e) => {
            if (!e.contentRect.width || !e.contentRect.height) return;
            sized.unobserve(e.target);
            want(e.target);
          }),
        );
  const want = (svg) => {
    if (!svg || (skip && svg.closest(skip))) return;
    if (
      !svg.hasAttribute("data-px") &&
      !svg.hasAttribute("data-pxwait") &&
      pixelOn() &&
      !noPx(svg) &&
      !svg.ownerSVGElement &&
      svg.viewBox &&
      svg.viewBox.baseVal &&
      svg.viewBox.baseVal.width &&
      svg.viewBox.baseVal.height
    ) {
      css();
      svg.setAttribute("data-pxwait", "");
    }
    queued.add(svg);
    if (!raf)
      raf = requestAnimationFrame(() => {
        raf = 0;
        afterPaint(flush);
      });
  };
  requeue.set(root, want);
  const scan = (n) => {
    if (n.nodeType !== 1 || (skip && n.closest(skip))) return;
    if (n.tagName === "svg") want(n.ownerSVGElement || n);
    else if (n.ownerSVGElement) want(rootSvg(n));
    else n.querySelectorAll("svg").forEach((s) => s.ownerSVGElement || want(s));
  };
  const mo = new MutationObserver((recs) => {
    if (!pixelOn()) return;
    for (const r of recs) {
      const t = r.target;
      if (r.type === "childList") {
        if (t.nodeType === 1 && (t.tagName === "svg" || t.ownerSVGElement)) {
          if (
            [...r.addedNodes, ...r.removedNodes].every(
              (n) =>
                n.nodeType === 1 &&
                (n.classList?.contains("pxi") ||
                  n.classList?.contains("pxt") ||
                  n.classList?.contains("pxw")),
            )
          )
            continue; // (my own picture going in)
          want(rootSvg(t));
        } else r.addedNodes.forEach(scan);
      } else if (
        (t.tagName === "image" && t.classList.contains("pxi")) ||
        (t.tagName === "svg" && t.classList.contains("pxw"))
      )
        continue;
      else if (t.tagName === "svg" || t.ownerSVGElement) want(rootSvg(t));
      else if (r.attributeName === "class" || r.attributeName === "hidden")
        scan(t); // (a class on something that holds drawings, or it shows again: they may look different)
    }
  });
  mo.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
  const all = () =>
    gone() ||
    root.querySelectorAll("svg").forEach((s) => s.ownerSVGElement || want(s));
  const onSwitch = () =>
    pixelOn() ? all() : root.querySelectorAll("svg[data-px]").forEach(unPx);
  addEventListener("pixelchange", onSwitch);
  addEventListener("resize", all);
  if (pixelOn()) all();
  function stop() {
    mo.disconnect();
    if (sized) sized.disconnect();
    removeEventListener("pixelchange", onSwitch);
    removeEventListener("resize", all);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    queued = new Set(); // (a flush already on its way finds nothing to do)
    if (requeue.get(root) === want) requeue.delete(root);
  }
  return stop;
}
const rootSvg = (n) => {
  let s = n.tagName === "svg" ? n : n.ownerSVGElement;
  while (s && s.ownerSVGElement) s = s.ownerSVGElement;
  return s;
};

/* every drawing under root made again at its size now (after the board changed size, or a drawing came into view) */
export function pxRefresh(root) {
  if (!pixelOn()) return;
  root
    .querySelectorAll("svg")
    .forEach((s) => s.ownerSVGElement || pxSvgEl(s, root));
}

/* a key for a drawing from its text (FNV-1a), so the same look is made into pixels once */
export const hashText = (str) => hash(str);
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + str.length.toString(36);
}
