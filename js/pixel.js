/* ---------- the pixel look (owner, Nov 16: "32 bit is the way BUT the text should be 128 bit") ----------
   Every picture in the game is drawn onto one grid: a duck is 32 pixels tall and everything else (guns, drops, maps,
   buttons) uses the same pixel size, whatever its own size. Words aren't made into pixels: they use a pixel font
   (Jersey 15) at the screen's own sharpness, the owner's "128". Pictures are made small once, put through the game's
   palette (pixelpalette.js) and cached; the screen shows them scaled up with image-rendering: pixelated, which is also
   much cheaper to draw than the drawings it replaces.
   It is the game's only look (owner, Nov 16: it replaces the old one, with no setting): <html> has the class "pixel"
   (index.html), and css/app.css keys on it. */
import { svgDataURL } from "./hangout/art.js";
import { applyPalette } from "./pixelpalette.js";
import { hasRb, rbSprite, RB_N } from "./rainbowskin.js";

const DUCK = 32, // (pixels to a duck's height: the owner's pick, on phones too)
  KEEP = 900; // (pictures kept made; the oldest go first)

const on = true; // (pixelOn() stays, so each part says where it differs)
export const pixelOn = () => on;

/* ---------- the grid ---------- */
const FILL = 0.7; // (a duck's drawing fills about 70% of its box, hat room included)
/* the board's duck box the pages and every other map are drawn for (css px): Duck Cabin and Downpour use its grid too,
   though their ducks show smaller, so their pixels are the same size as every other map's (the owner's, Nov 17: "one
   pixel size uniformly like the page backgrounds for other maps") */
export const PAGE_DUCK = 92;
let duckPx = PAGE_DUCK * FILL, // (a duck's drawn height on the board, in css px; the board tells me its ducks' box size)
  grid = 2;
/* one pixel is a whole number of the screen's own pixels (owner, Nov 17: the playroom came out smooth in the app). On a
   screen whose pixels aren't whole css px (Windows at 125% or 150%, most phones) a pixel of 2.012 css px fell between
   them and the filter below blurred instead of making squares, so the grid is the nearest whole count of the screen's
   pixels */
const dpr = () => devicePixelRatio || 1;
let dprAt = dpr();
function setGrid() {
  dprAt = dpr();
  grid = Math.max(1, Math.round(Math.max(1, duckPx / DUCK) * dprAt)) / dprAt;
  document.documentElement.style.setProperty("--px", grid.toFixed(3) + "px");
  filterGrid();
  dispatchEvent(new Event("pxgrid")); // (pictures made at the grid's size are made again: pxtext.js' emoji)
}

/* ---------- whole layers made into pixels as they're drawn (the maps: every map, with all its movement) ----------
   An SVG filter (css: filter: url(#px-f)): each grid square takes the color of one point inside it. The maps are made
   of canvases, pictures and moving drawings, so I pixelate what they draw rather than each piece; the same grid as the
   ducks', so the pixels match. (The usual pixelate filter: a 1 × 1 dot tiled every square, kept where the picture is,
   then grown to fill its square.) */
let filt = null,
  filtMade = []; // (each filter's markup as last made)
/* one filter, in the screen's pixels: n of them to a square, k to a css px of its layer. A 1 × 1 dot (one screen pixel,
   so one color) is kept in each square, then grown to fill it: an odd square grows round its middle; an even one grows
   to one less, then is laid over itself a pixel right and a pixel down (a grown dot can only be an odd size) */
function filterHTML(id, n, k) {
  const u = (v) => (v / k).toFixed(4),
    odd = n % 2,
    at = odd ? (n - 1) / 2 : n / 2 - 1, // (the dot, from the square's corner)
    r = at; // (grown by this much each way)
  const grow = r ? `<feMorphology operator="dilate" radius="${u(r)}"/>` : "";
  const even = odd
    ? ""
    : `<feOffset dx="${u(1)}" result="a"/><feBlend in="a" in2="b" mode="lighten" result="c"/><feOffset dy="${u(1)}"/><feBlend in2="c" mode="lighten"/>`;
  return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feFlood x="${u(at)}" y="${u(at)}" width="${u(1)}" height="${u(1)}" flood-color="#000"/><feComposite width="${u(n)}" height="${u(n)}"/><feTile result="dot"/><feComposite in="SourceGraphic" in2="dot" operator="in"/>${grow}${even ? '<feOffset result="b"/>' : ""}${even}</filter>`;
}
function filterGrid() {
  if (!on || !document.body) return;
  if (!filt) {
    filt = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    filt.setAttribute("aria-hidden", "true");
    filt.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    document.body.append(filt);
  }
  const n = Math.round(grid * dprAt);
  /* (px-fc, the porch's filter under Duck Cabin's zoom, is gone: its lights are a picture made on the grid already,
     pxdom.js, so the filter only drew those same pixels again each frame) */
  const want = [filterHTML("px-f", n, dprAt)];
  want.forEach((h, i) => {
    if (filtMade[i] === h) return; // (made again only when it changed)
    filtMade[i] = h;
    const t = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    t.innerHTML = h;
    if (filt.children[i]) filt.children[i].replaceWith(t.firstChild);
    else filt.append(t.firstChild);
  });
}
if (document.readyState === "loading")
  addEventListener("DOMContentLoaded", filterGrid);
setGrid();
/* the browser zoomed, or the window moved to another screen: its pixels changed size */
addEventListener("resize", () => {
  if (dpr() === dprAt) return;
  setGrid();
  setCursors(); // (the pointers too: drawn in the screen's pixels)
});
document.documentElement.classList.add("pixel");

/* the board's duck size (its box, css px, as game.js' geo.size): every picture's pixel follows it */
export function setDuckSize(box) {
  const h = box * FILL;
  if (!(h > 0) || Math.abs(h - duckPx) < 0.5) return;
  duckPx = h;
  setGrid();
}
/* the size of one pixel, in css px */
export const gridPx = () => grid;
/* a place on the screen, on the grid (ducks and things snap to it, so their pixels line up with the map's) */
export const snap = (v) => Math.round(v / grid) * grid;

/* fn once the frame being drawn is on the screen (call it from a requestAnimationFrame): the page's layout is still
   fresh then, so reading where things are and how big costs nothing. Read during a frame, after the game moved
   things, each read made the browser lay the whole page out again first (Downpour's many zombies: a third of a
   second in every six) */
const painted = new MessageChannel(),
  afterFns = [];
painted.port1.onmessage = () => {
  for (const fn of afterFns.splice(0))
    try {
      fn();
    } catch (e) {
      setTimeout(() => {
        throw e;
      }); // (seen in the console, the others still run)
    }
};
export function afterPaint(fn) {
  if (afterFns.push(fn) === 1) painted.port2.postMessage(0);
}

/* ---------- pictures made into pixels, once ---------- */
const made = new Map(), // full key -> object URL
  making = new Map(); // full key -> Promise<url>
const full = (key, w, h) => {
  const cw = Math.max(1, Math.round(w / grid)),
    ch = Math.max(1, Math.round(h / grid));
  return [`${key}@${cw}x${ch}`, cw, ch];
};
const asURL = (src) =>
  src.trimStart().startsWith("<") ? svgDataURL(src) : src;

async function make(fk, src, cw, ch) {
  const img = new Image();
  img.decoding = "async";
  img.src = asURL(src);
  await img.decode();
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high"; // (each pixel the average of what it covers, as in the samples)
  x.drawImage(img, 0, 0, cw, ch);
  x.putImageData(applyPalette(x.getImageData(0, 0, cw, ch)), 0, 0);
  const blob = await new Promise((f) => c.toBlob(f));
  const url = URL.createObjectURL(blob);
  made.set(fk, url);
  if (made.size > KEEP) {
    const [old, ou] = made.entries().next().value;
    made.delete(old);
    URL.revokeObjectURL(ou);
  }
  for (const el of document.querySelectorAll(
    `img[data-pxk="${CSS.escape(fk)}"]`,
  ))
    el.src = url;
  return url;
}

/* a picture (an SVG string or an image's URL) shown w × h css px: its pixel version's URL, or null while it's made */
export function raster(key, src, w, h) {
  const [fk, cw, ch] = full(key, w, h);
  const u = made.get(fk);
  if (u) return u;
  if (!making.has(fk))
    making.set(
      fk,
      make(fk, src, cw, ch)
        .catch(() => null)
        .finally(() => making.delete(fk)),
    );
  return null;
}
/* the same, waited for */
export function rasterReady(key, src, w, h) {
  const [fk] = full(key, w, h);
  return made.has(fk)
    ? Promise.resolve(made.get(fk))
    : (raster(key, src, w, h),
      making.get(fk) || Promise.resolve(made.get(fk) || null));
}

/* an <img> for a picture, w × h css px: its pixel version once made (the drawing itself shows until then, and the img
   changes by itself when it's ready). With the pixel look off, the plain drawing */
export function pxImg(key, src, w, h, cls = "") {
  const [fk] = full(key, w, h),
    u = on ? raster(key, src, w, h) : null;
  return `<img class="px${cls ? " " + cls : ""}" ${on ? `data-pxk="${fk.replace(/"/g, "&quot;")}" ` : ""}src="${u || asURL(src)}" width="${Math.round(w)}" height="${Math.round(h)}" alt="" draggable="false">`;
}

/* a key for a drawing from its own text (FNV-1a), so the same drawing is made once however often it's asked for */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + str.length.toString(36);
}
/* an SVG drawing shown w css px wide (its height from its own width and height), as pixels: pxImg's <img> */
export function pxSVG(svg, w, cls = "") {
  const head = svg.slice(0, svg.indexOf(">")),
    W = +(/\swidth="([\d.]+)"/.exec(head) || [])[1] || 1,
    H = +(/\sheight="([\d.]+)"/.exec(head) || [])[1] || W;
  if (on && hasRb(svg)) return pxRainbow(svg, W, H, w, cls);
  return pxImg("s" + hash(svg), svg, w, (w * H) / W, cls);
}
/* a drawing wearing the rainbow skin (rainbowskin.js), w css px wide: every step of the rainbow's turn made into pixels
   in one tall picture, one step shown at a time (css img.rbsp). Each step a whole number of pixels tall, so the steps
   line up */
function pxRainbow(svg, W, H, w, cls) {
  const ch = Math.max(1, Math.round((w * H) / W / grid)),
    fh = ch * grid,
    sprite = rbSprite(svg, W, H),
    [fk] = full("r" + hash(svg), w, fh * RB_N),
    u = raster("r" + hash(svg), sprite, w, fh * RB_N);
  return `<img class="px rbsp${cls ? " " + cls : ""}" data-pxk="${fk.replace(/"/g, "&quot;")}" src="${u || asURL(sprite)}" width="${Math.round(w)}" height="${fh.toFixed(2)}" style="aspect-ratio: ${W} / ${H}" alt="" draggable="false">`;
}
/* the same steps for a drawing already on the page (pxdom.js): its sprite's text, its key and its size */
export function rainbowSteps(text, W, H, w, h) {
  const ch = Math.max(1, Math.round(h / grid));
  return {
    sprite: rbSprite(text, W, H),
    key: "r" + hash(text),
    w,
    h: ch * grid * RB_N,
  };
}

/* ---------- pictures already on the page (<img>: the mode pictures, props, a player's own picture) ----------
   Every <img> under root shows as pixels at the size it shows: its src becomes its pixel version (the first one kept
   in data-pxsrc), made again when its size or its picture changes. Not the ones made by pxImg or by a mode's own code
   (class "px": they do it themselves), nor what's under [data-nopx] (the maps, drawn on the grid by the filter) */
const imgSeen = new WeakMap(); // img -> the key it was last made at
function pxImgEl(img) {
  if (!on || img.classList.contains("px") || img.closest("[data-nopx]")) return;
  let src = img.getAttribute("src") || "";
  if (!src || (src.startsWith("blob:") && !img.dataset.pxsrc)) return;
  if (src.startsWith("blob:")) src = img.dataset.pxsrc;
  else img.dataset.pxsrc = src;
  let w = img.offsetWidth,
    h = img.offsetHeight;
  if (!w || !h || !img.naturalWidth) return; // (not shown or not loaded yet: made when it is)
  const fit = getComputedStyle(img).objectFit;
  if (fit === "cover" || fit === "contain") {
    const nw = img.naturalWidth,
      nh = img.naturalHeight,
      k = (fit === "cover" ? Math.max : Math.min)(w / nw, h / nh);
    w = nw * k;
    h = nh * k;
  } // (cropped or fitted: made at the size the picture itself shows, so it isn't stretched)
  const [fk] = full(src, w, h);
  if (imgSeen.get(img) === fk) return;
  imgSeen.set(img, fk);
  img.style.imageRendering = "pixelated";
  rasterReady("i" + hash(src), src, w, h).then((u) => {
    if (u && imgSeen.get(img) === fk) img.src = u;
  });
}
export function pxImgWatch(root) {
  const all = () => root.querySelectorAll("img").forEach(pxImgEl);
  const mo = new MutationObserver((recs) => {
    if (!on) return;
    for (const r of recs) {
      if (r.type === "attributes") {
        const t = r.target;
        if (t.tagName === "IMG") {
          const s = t.getAttribute("src") || "";
          if (!s.startsWith("blob:")) delete t.dataset.pxsrc; // (a new picture)
          pxImgEl(t);
        }
      } else
        r.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.tagName === "IMG") pxImgEl(n);
          else n.querySelectorAll("img").forEach(pxImgEl);
        });
    }
  });
  mo.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src"],
  });
  root.addEventListener(
    "load",
    (e) => e.target.tagName === "IMG" && pxImgEl(e.target),
    true,
  ); // (its size known once loaded)
  addEventListener("resize", all);
  all();
}

/* ---------- the mouse pointer as pixels (owner, Nov 16: "that would be cool if it was also 64 bit") ----------
   Drawn here, a pixel at a time: each pixel is CURSOR_ZOOM css px, sharp on any screen (image-set: 1x, 2x, 3x). k is
   the dark edge, w the fill, y the duck-yellow shine. css/app.css puts them on (--cur-*) */
const CURSORS = {
  arrow: [
    0,
    0,
    `k
kk
kyk
kywk
kywwk
kywwwk
kywwwwk
kywwwwwk
kywwwwwwk
kywwwwwwwk
kywwwwkkkkk
kywkwwk
kwk.kwwk
kk..kwwk
k....kwwk
.....kwwk
......kk`,
  ],
  hand: [
    4,
    0,
    `....kk
...kywk
...kywk
...kywk
...kywkkk
...kywkwkkk
...kywkwkwkkk
kk.kywkwkwkwk
kwkkywwwwwwwk
kwwkywwwwwwwk
.kwwwwwwwwwwk
.kwwwwwwwwwwk
..kwwwwwwwwwk
..kwwwwwwwwk
...kwwwwwwwk
...kwwwwwwk
...kkkkkkkk`,
  ],
  cross: [
    7,
    7,
    `......kkk
......kwk
......kwk
......kwk
......kkk

kkkkk.....kkkkk
kwwwk..y..kwwwk
kkkkk.....kkkkk

......kkk
......kwk
......kwk
......kwk
......kkk`,
  ],
  text: [
    3,
    6,
    `kkk.kkk
kwwkwwk
kkkwkkk
..kwk
..kwk
..kwk
..kwk
..kwk
..kwk
..kwk
kkkwkkk
kwwkwwk
kkk.kkk`,
  ],
};
const INK = { k: "#101016", w: "#f7f8f3", y: "#fcdb4e" };
function cursorURL(rows, s) {
  const w = Math.max(...rows.map((r) => r.length)),
    c = document.createElement("canvas");
  c.width = w * s;
  c.height = rows.length * s;
  const x = c.getContext("2d");
  rows.forEach((r, j) =>
    [...r].forEach((ch, i) => {
      if (!INK[ch]) return;
      x.fillStyle = INK[ch];
      x.fillRect(i * s, j * s, s, s);
    }),
  );
  return c.toDataURL();
}
/* how many css px each of a pointer's pixels takes (owner, Nov 16: one css px was far too small, "bigger, but not
   large", and the crosshair so small the game was unplayable; then twice as big was too big; Nov 17: the mouse and the
   pointer over a button still too large, the crosshair a good size, and all three sizes in Settings: the arrow, the hand
   and the text pointer are drawn again about two thirds as big, the crosshair kept). The arrow and the text pointer
   follow Mouse size, the hand Pointer size, the crosshair Crosshair size (100% each by default) */
const CURSOR_ZOOM = { arrow: 1, hand: 1, text: 1, cross: 3 },
  CURSOR_SIZE = {
    arrow: "mouse",
    text: "mouse",
    hand: "pointer",
    cross: "cross",
  },
  CURSOR_MAX = 128; // (browsers drop a pointer picture bigger than this)
let cursorSizes = { mouse: 100, pointer: 100, cross: 100 },
  cursorsAt = "";
/* each pointer's picture is drawn in whole pixels of the screen (as many as its size needs, rounded up) and told how
   many of them make a css px (image-set), so it shows at exactly its size: sharp wherever that is a whole number of the
   screen's pixels (100% on most screens) */
function setCursors() {
  const d = dpr(),
    key = [d, cursorSizes.mouse, cursorSizes.pointer, cursorSizes.cross].join();
  if (key === cursorsAt) return;
  cursorsAt = key;
  const sets = CSS.supports("cursor", "image-set(url(a.png) 1.5x) 0 0, auto"),
    root = document.documentElement.style;
  for (const [name, [hx, hy, art]] of Object.entries(CURSORS)) {
    const rows = art.split("\n"),
      big = Math.max(rows.length, ...rows.map((r) => r.length)),
      z = (CURSOR_ZOOM[name] * cursorSizes[CURSOR_SIZE[name]]) / 100, // (one pointer pixel, in css px)
      px = sets
        ? Math.max(
            1,
            Math.min(Math.ceil(z * d - 0.01), Math.floor(CURSOR_MAX / big)),
          )
        : Math.max(1, Math.round(z)),
      img = sets
        ? `image-set(url(${cursorURL(rows, px)}) ${+(px / z).toFixed(4)}x)`
        : `url(${cursorURL(rows, px)})`,
      at = sets ? z : px;
    root.setProperty(
      `--cur-${name}`,
      `${img} ${Math.round(hx * at)} ${Math.round(hy * at)}`,
    );
  }
}
setCursors();
/* Settings → Controls: Mouse size, Pointer size, Crosshair size (in %) */
export function setCursorSizes(mouse, pointer, cross) {
  const pc = (v) => Math.max(25, Math.min(400, +v || 100));
  cursorSizes = { mouse: pc(mouse), pointer: pc(pointer), cross: pc(cross) };
  setCursors();
}
