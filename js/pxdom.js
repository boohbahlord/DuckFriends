/* ---------- the pixel look for drawings already on the page (owner, Nov 16; pixel.js does the pixels) ----------
   Much of the game is drawn as inline SVG that its own code keeps changing: Duck Cabin's props (a lamp switched off, a
   door opened, a seat taken), the zombies' boards, the drops, Mad God Justin's things. pxWatch(root) shows every such
   drawing under root as pixels without taking it away: the drawing stays where it is (its ids, its clicks and its
   size all as before) but turns invisible, and over it, inside the same <svg>, an <image> shows its pixel picture. The
   picture is made from the drawing as it looks at that moment (its CSS written into a copy, so a lamp that's off is
   made off), by pixel.js' raster(): small on the grid, through the game's palette, cached. When the drawing changes
   (its parts, its classes or the classes of what holds it), it's made again, at most every PACE ms per drawing.
   Only with the pixel look on (pixel.js' pixelOn()). */
import { pixelOn, gridPx, snap, raster, rasterReady } from "./pixel.js";

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

/* the rules: a drawing shown as pixels hides its own parts (its picture is the only thing that shows) */
function css() {
  if (document.getElementById("pxdom-css")) return;
  const s = document.createElement("style");
  s.id = "pxdom-css";
  s.textContent =
    "svg[data-px]>:not(image.pxi){opacity:0!important}" +
    "image.pxi{image-rendering:pixelated;pointer-events:none}";
  document.head.append(s);
}

/* the box a drawing's viewBox fills on the screen, in css px (as the browser fits it: meet, unless it says none) */
function shownSize(svg, vb) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  if ((svg.getAttribute("preserveAspectRatio") || "").startsWith("none"))
    return [r.width, r.height];
  const k = Math.min(r.width / vb.width, r.height / vb.height);
  return [vb.width * k, vb.height * k];
}

/* a copy of the drawing as it looks now, as SVG text: every part's CSS (from classes, and from the classes of what
   holds it) written into the part itself, so the picture is made as it's seen */
function snapshot(svg, vb) {
  svg.removeAttribute("data-px"); // (the hiding rule out of the way while I read how it looks)
  const copy = svg.cloneNode(true);
  copy.querySelectorAll("image.pxi").forEach((e) => e.remove());
  const from = [svg, ...svg.querySelectorAll("*")].filter(
      (e) => !(e.tagName === "image" && e.classList.contains("pxi")),
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
  svg.setAttribute("data-px", "");
  copy.removeAttribute("data-px");
  copy.removeAttribute("class");
  copy.setAttribute("xmlns", NS);
  copy.setAttribute("width", vb.width);
  copy.setAttribute("height", vb.height);
  return new XMLSerializer().serializeToString(copy);
}

/* the drawing's text without my picture in it, and the classes around it: when these change, it's made again */
const ownText = (svg) =>
  svg.outerHTML.replace(/<image class="pxi"[^>]*>(<\/image>)?/g, "");
function around(svg, root) {
  let s = "";
  for (let e = svg; e && e !== root; e = e.parentElement)
    s += (e.getAttribute("class") || "") + "|";
  return s;
}

/* one drawing as pixels (or as it was, with the look off). Safe to call again: it only makes a new picture when the
   drawing, the classes around it or its size on the screen changed */
const state = new WeakMap(); // svg -> { key, at, timer, img }
export function pxSvgEl(svg, root = document.body) {
  if (!pixelOn()) return unPx(svg);
  if (svg.closest("[data-nopx]") || svg.ownerSVGElement) return; // (inside another drawing: that one carries it)
  const vb = svg.viewBox && svg.viewBox.baseVal;
  if (!vb || !vb.width || !vb.height) return; // (no viewBox: nothing to fit a picture to)
  const size = shownSize(svg, vb);
  if (!size) return; // (not on the screen yet: made when it shows, pxRefresh)
  const g = gridPx(),
    cw = Math.max(1, Math.round(size[0] / g)),
    ch = Math.max(1, Math.round(size[1] / g)),
    key = cw + "x" + ch + "|" + around(svg, root) + ownText(svg);
  let st = state.get(svg);
  if (!st) state.set(svg, (st = { key: "", at: 0, timer: 0, img: null }));
  if (st.key === key && st.img && st.img.isConnected) return;
  const wait = st.at + PACE - performance.now();
  if (wait > 0) {
    if (!st.timer)
      st.timer = setTimeout(() => {
        st.timer = 0;
        pxSvgEl(svg, root);
      }, wait);
    return;
  }
  st.key = key;
  st.at = performance.now();
  css();
  const text = snapshot(svg, vb),
    w = cw * g,
    h = ch * g,
    k = "d" + hash(text);
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
    if (!url || st.key !== key) return;
    img.setAttribute("href", url);
    if (img.parentNode !== svg) svg.append(img);
    svg.setAttribute("data-px", ""); // (hidden only once its picture is there: never a gap)
  };
  const u = raster(k, text, w, h);
  if (u) show(u);
  else rasterReady(k, text, w, h).then(show);
}
function unPx(svg) {
  if (!svg.hasAttribute("data-px")) return;
  svg.removeAttribute("data-px");
  svg.querySelectorAll("image.pxi").forEach((e) => e.remove());
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
  const flush = () => {
    raf = 0;
    if (gone()) return;
    const list = queued;
    queued = new Set();
    for (const svg of list) if (svg.isConnected) pxSvgEl(svg, root);
  };
  const want = (svg) => {
    if (!svg || (skip && svg.closest(skip))) return;
    queued.add(svg);
    if (!raf) raf = requestAnimationFrame(flush);
  };
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
              (n) => n.nodeType === 1 && n.classList?.contains("pxi"),
            )
          )
            continue; // (my own picture going in)
          want(rootSvg(t));
        } else r.addedNodes.forEach(scan);
      } else if (t.tagName === "image" && t.classList.contains("pxi")) continue;
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
    removeEventListener("pixelchange", onSwitch);
    removeEventListener("resize", all);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
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
