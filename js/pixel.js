/* ---------- the pixel look (owner, Nov 16: "32 bit is the way BUT the text should be 128 bit") ----------
   Every picture in the game is drawn onto one grid: a duck is 32 pixels tall and everything else (guns, drops, maps,
   buttons) uses the same pixel size, whatever its own size. Words aren't made into pixels: they use a pixel font
   (Jersey 15) at the screen's own sharpness, the owner's "128". Pictures are made small once, put through the game's
   palette (pixelpalette.js) and cached; the screen shows them scaled up with image-rendering: pixelated, which is also
   much cheaper to draw than the drawings it replaces.
   Hidden until every screen is done: ?pixel in the address (or the command line's `pixel on`) turns it on for this
   device, ?pixel=0 (or `pixel off`) turns it off. With it on, <html> has the class "pixel"; css/app.css keys on it. */
import { svgDataURL } from "./hangout/art.js";
import { applyPalette } from "./pixelpalette.js";

const KEY = "duckfriends-pixel",
  DUCK = 32, // (pixels to a duck's height: the owner's pick, on phones too)
  KEEP = 900; // (pictures kept made; the oldest go first)

function stored() {
  try {
    const q = new URLSearchParams(location.search).get("pixel");
    if (q !== null)
      localStorage.setItem(KEY, q === "0" || q === "off" ? "0" : "1");
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
let on = stored();

export const pixelOn = () => on;

/* the command line's `pixel on|off`: the class changes now; pictures already on the screen change as they redraw */
export function setPixel(v) {
  on = !!v;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {}
  document.documentElement.classList.toggle("pixel", on);
  filterGrid();
  dispatchEvent(new Event("pixelchange"));
}

/* ---------- the grid ---------- */
const FILL = 0.7; // (a duck's drawing fills about 70% of its box, hat room included)
let duckPx = 92 * FILL, // (a duck's drawn height on the board, in css px; the board tells me its ducks' box size)
  grid = 2;
function setGrid() {
  grid = Math.max(1, duckPx / DUCK);
  document.documentElement.style.setProperty("--px", grid.toFixed(3) + "px");
  filterGrid();
}

/* ---------- whole layers made into pixels as they're drawn (the maps: every map, with all its movement) ----------
   An SVG filter (css: filter: url(#px-f)): each grid square takes the color of one point inside it. The maps are made
   of canvases, pictures and moving drawings, so I pixelate what they draw rather than each piece; the same grid as the
   ducks', so the pixels match. (The usual pixelate filter: a 1 × 1 dot tiled every square, kept where the picture is,
   then grown to fill its square.) */
let filt = null;
function filterGrid() {
  if (!on || !document.body) return;
  if (!filt) {
    filt = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    filt.setAttribute("aria-hidden", "true");
    filt.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    filt.innerHTML = `<filter id="px-f" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feFlood x="0" y="0" width="1" height="1" flood-color="#000"/><feComposite width="2" height="2"/><feTile result="dot"/><feComposite in="SourceGraphic" in2="dot" operator="in"/><feMorphology operator="dilate" radius="1"/></filter>`;
    document.body.append(filt);
  }
  const g = grid.toFixed(3),
    [flood, comp, , , morph] = filt.querySelector("filter").children;
  flood.setAttribute("x", (grid / 2).toFixed(3));
  flood.setAttribute("y", (grid / 2).toFixed(3));
  comp.setAttribute("width", g);
  comp.setAttribute("height", g);
  morph.setAttribute("radius", (grid / 2).toFixed(3));
}
if (document.readyState === "loading")
  addEventListener("DOMContentLoaded", filterGrid);
setGrid();
document.documentElement.classList.toggle("pixel", on);

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
  return pxImg("s" + hash(svg), svg, w, (w * H) / W, cls);
}
