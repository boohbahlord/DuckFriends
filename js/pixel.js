/* ---------- the pixel look (owner, Nov 16: "32 bit is the way BUT the text should be 128 bit") ----------
   Every picture in the game is drawn onto one grid: a duck is 32 pixels tall and everything else (guns, drops, maps,
   buttons) uses the same pixel size, whatever its own size. Words aren't made into pixels: they use a pixel font
   (Jersey 15) at the screen's own sharpness, the owner's "128". Pictures are made small once, put through the game's
   palette (pixelpalette.js) and cached; the screen shows them scaled up with image-rendering: pixelated, which is also
   much cheaper to draw than the drawings it replaces.
   It is the game's only look (owner, Nov 16: it replaces the old one, with no setting): <html> has the class "pixel"
   (index.html), and css/app.css keys on it. */
import { svgDataURL } from "./svgurl.js";
import { applyPalette } from "./pixelpalette.js";
import { hasRb, rbSprite, RB_N } from "./rainbowskin.js";
import { holdGame } from "./gameready.js";

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

/* a picture (an SVG string or an image's URL) made into cw × ch pixels in the game's colors: a canvas. The game makes
   them ahead of time with it too (tools/pixel-world.cjs), so the files come out as the game would make them */
export async function pxCanvas(src, cw, ch) {
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
  return c;
}
/* ---------- pictures made into pixels ahead of time (the owner's, Nov 19 23:26Z: "It should be saved as real pixels")
   ----------
   Every weapon, item and icon the game shows was made into pixels once, by tools/pixel-art.cjs, in the same way the
   device made them (pxCanvas), and shipped as one picture of them all (assets/px/art) with the list of where each is
   (pxa.js). A picture asked for here that's in the list is copied out of it as it is, pixel for pixel: nothing is drawn
   or put through the palette on the device. Each drawing has the sizes it shows at in the game; another size takes the
   nearest one (shown a little bigger or smaller). What isn't in the list (a drawing new since the files were made, a
   duck: the ducks come next) is still made here as before */
/* The files are two pictures (slimming step 6: the owner's, Nov 20 19:11Z, nothing at the front screen it doesn't
   show): what the front screen and its splash show (a piece listed with a 1 after its place), and all the rest, each
   loaded the first time a picture in it is shown, both once a screen past the front one comes up
   (tools/pixel-art-front.cjs) */
let INDEX = null,
  ATLAS = [],
  indexIn = false;
const index = import("./pxa.js")
  .then((m) => {
    INDEX = m.INDEX;
    ATLAS = [].concat(m.ATLAS);
  })
  .catch(() => null)
  .finally(() => (indexIn = true));
const sheets = []; // { p: Promise, im: Image | null, in: loaded or failed }
function sheet(n) {
  if (sheets[n]) return sheets[n];
  const s = (sheets[n] = { im: null, in: false });
  s.p = (async () => {
    if (window.__pxNoBaked || !ATLAS[n]) return; // (tools/pixel-art.cjs, while it lists what the game makes)
    const im = new Image();
    im.src = ATLAS[n];
    await im.decode();
    s.im = im;
  })()
    .catch(() => {})
    .finally(() => (s.in = true));
  return s;
}
/* the picture key's pieces are in (asking for it the first time), or null when it isn't in the files */
const sheetFor = (key) => {
  const vs = INDEX && INDEX[key];
  return vs ? sheet(vs[0][4] || 0) : null;
};
if (typeof document !== "undefined")
  document.addEventListener("screen", () => {
    if (document.body.dataset.screen !== "front")
      index.then(() => ATLAS.forEach((_, n) => sheet(n))); // (on their way before a game's pictures want them)
  });
/* while key's picture may be in the files and they aren't here yet: a Promise for when they are (or turn out not to
   be), else null */
export function bakedWait(key) {
  if (!indexIn) return index.then(() => (sheetFor(key) || {}).p);
  const s = sheetFor(key);
  return s && !s.in ? s.p : null;
}
/* of key's sizes in the files, the nearest to cw × ch: [w, h, x, y(, its picture)] */
function nearest(key, cw, ch) {
  const vs = INDEX && INDEX[key];
  if (!vs) return null;
  let v = vs[0];
  for (const u of vs)
    if (
      Math.abs(u[0] - cw) + Math.abs(u[1] - ch) <
      Math.abs(v[0] - cw) + Math.abs(v[1] - ch)
    )
      v = u;
  return v;
}
/* a drawing shown w × h css px (pxdom.js), from the files as they are: { url, W, H, at: [w, h, x, y] } (the whole
   picture and the piece of it to show), or null when it isn't in them or they haven't come yet */
export function bakedPiece(key, w, h) {
  if (window.__pxAsk) window.__pxAsk(key); // (tools/pixel-art-front.cjs, listing what the front screen shows)
  const [, cw, ch] = full(key, w, h),
    v = nearest(key, cw, ch),
    im = v && sheets[v[4] || 0] && sheets[v[4] || 0].im;
  return (
    im && {
      url: im.src,
      W: im.naturalWidth,
      H: im.naturalHeight,
      at: v,
    }
  );
}
/* the made picture for key at cw × ch, cut out of the files: a canvas, or null when it isn't there */
async function fromFiles(key, cw, ch) {
  await index;
  const s = sheetFor(key);
  if (!s) return null;
  await s.p;
  const v = nearest(key, cw, ch);
  if (!s.im || !v) return null;
  const c = document.createElement("canvas");
  c.width = v[0];
  c.height = v[1];
  c.getContext("2d").drawImage(s.im, v[2], v[3], v[0], v[1], 0, 0, v[0], v[1]);
  return c;
}
/* a duck, from its pixel parts (duckparts.js), when its drawing says what it is (duck.js data-dk) */
const unq = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
async function fromParts(src, cw, ch) {
  let text = typeof src === "string" ? src : "";
  if (text.startsWith("data:image/svg+xml")) {
    // (a zombie's or an NPC's picture comes as its drawing's URL: svgurl.js)
    try {
      text = decodeURIComponent(text.slice(text.indexOf(",") + 1));
    } catch {
      return null;
    }
  }
  /* in its first tag (esc() leaves no > in it); a rainbow skin's every step (rbSprite), in its first step's */
  const steps = hasRb(text) && !/^<svg[^>]*\sdata-dk=/.test(text) ? RB_N : 1,
    at = steps > 1 ? text.indexOf("<svg", 1) : 0,
    m = /\sdata-dk="([^"]*)"/.exec(text.slice(at, text.indexOf(">", at) + 1));
  if (!m || window.__pxNoParts || ch % steps) return null;
  try {
    const { duckFromParts } = await import("./duckparts.js");
    return await duckFromParts(JSON.parse(unq(m[1])), cw, ch / steps, steps);
  } catch {
    return null;
  }
}
async function make(fk, src, cw, ch) {
  const key = fk.slice(0, fk.lastIndexOf("@"));
  let c = await fromFiles(key, cw, ch);
  if (!c) c = await fromParts(src, cw, ch);
  if (!c) {
    if (window.__pxHear) window.__pxHear(key, src, cw, ch); // (tools/pixel-art.cjs, listing what the game makes)
    c = await pxCanvas(src, cw, ch);
  }
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
      holdGame(
        make(fk, src, cw, ch)
          .catch(() => null)
          .finally(() => making.delete(fk)),
      ), // (a game that's loading waits for it: gameready.js)
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

/* what an <img> shows while its pixel version is made: nothing (the owner's, Nov 19 17:00Z: the original pictures popped
   in before their pixels, "which tells me it's still using the old pictures"). One see-through pixel */
export const BLANK =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
/* an <img> for a picture, w × h css px: its pixel version once made (nothing shows until then, and the img changes by
   itself when it's ready). With the pixel look off, the plain drawing */
export function pxImg(key, src, w, h, cls = "") {
  const [fk] = full(key, w, h),
    u = on ? raster(key, src, w, h) : null;
  return `<img class="px${cls ? " " + cls : ""}" ${on ? `data-pxk="${fk.replace(/"/g, "&quot;")}" ` : ""}src="${u || (on ? BLANK : asURL(src))}" width="${Math.round(w)}" height="${Math.round(h)}" alt="" draggable="false">`;
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
  return pxImg(
    (/\bduck\b/.test(cls) ? "c" : "s") + hash(svg),
    svg,
    w,
    (w * H) / W,
    cls,
  );
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
  return `<img class="px rbsp${cls ? " " + cls : ""}" data-pxk="${fk.replace(/"/g, "&quot;")}" src="${u || BLANK}" width="${Math.round(w)}" height="${fh.toFixed(2)}" style="aspect-ratio: ${W} / ${H}" alt="" draggable="false">`;
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
   in data-pxsrc), made again when its size or its picture changes. Until then it's hidden (css/app.css, html.pixel
   img:not([data-pxok])): its own picture never shows first (the owner's, Nov 19 17:00Z). Not the ones made by pxImg or
   by a mode's own code (class "px": they do it themselves), nor what's under [data-nopx] or on a map (drawn on the grid
   by the filter, or baked: pxbake.js), nor a picture made as pixels ahead of time (data-pxok in its markup) */
const imgSeen = new WeakMap(), // img -> the key it was last made at
  /* a picture not shown yet (no size): made as soon as it shows */
  sized =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver((es) =>
          es.forEach((e) => {
            if (!e.target.offsetWidth) return;
            sized.unobserve(e.target);
            pxImgEl(e.target);
          }),
        );
const shown = (img) => {
  if (!img.hasAttribute("data-pxok")) img.setAttribute("data-pxok", "");
};
function pxImgEl(img) {
  if (!on || img.classList.contains("px") || img.closest("[data-nopx]")) return;
  let src = img.getAttribute("src") || "";
  if (!src) return;
  if (src.startsWith("blob:") && !img.dataset.pxsrc) return shown(img); // (someone else's picture, made by their code)
  if (src.startsWith("data:image/gif")) return; // (a stand-in, nothing to make)
  if (img.hasAttribute("data-pxready")) return shown(img); // (made as pixels ahead of time: tools/pixel-files.cjs)
  if (src.startsWith("blob:")) src = img.dataset.pxsrc;
  else img.dataset.pxsrc = src;
  let w = img.offsetWidth,
    h = img.offsetHeight;
  if (!img.naturalWidth) return; // (not loaded yet: made when it is)
  if (!w || !h) {
    if (sized) sized.observe(img);
    else shown(img);
    return;
  } // (not shown yet: made once it shows)
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
    if (imgSeen.get(img) !== fk) return;
    if (u) img.src = u;
    shown(img); // (and if it couldn't be made, its own picture after all, rather than nothing)
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
          if (!s.startsWith("blob:")) {
            delete t.dataset.pxsrc; // (a new picture: hidden until its pixels are made)
            imgSeen.delete(t);
            if (!t.classList.contains("px") && !t.hasAttribute("data-pxready"))
              t.removeAttribute("data-pxok");
          }
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
   follow Mouse size, the hand Pointer size, the crosshair Crosshair size (100% each by default). Nov 20 21:17Z: the
   mouse had become smaller than a browser's own; I want it "default size like it is on a normal browser, but just a
   small fraction bit larger": the arrow and the hand about 22 css px tall (a browser's arrow is about 20), the crosshair
   kept */
const CURSOR_ZOOM = { arrow: 1.3, hand: 1.3, text: 1.3, cross: 3 },
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
