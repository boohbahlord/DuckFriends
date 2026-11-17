/* ---------- emoji and tooltips in the pixel look (owner, Nov 16: "some things werent pixelated") ----------
   Two things the pixel look missed, because they're words rather than pictures:
   - Emoji. Many specials' icons are emoji (the ducklings, the coffee, the kangaroo), and emoji turn up in Updates, chat
     and names too. pxEmojiWatch(root) finds every emoji in the page's text and shows it as pixels on the game's one grid
     (pixel.js' gridPx(), through the game's palette), like every other picture. The emoji itself stays in the text,
     unseen, so copying the text or reading it aloud still gives the emoji.
   - The hover tips. They are words, so they keep the pixel font at reading size (the owner's "128"), but drawn by the
     browser at a size that isn't whole screen pixels they come out smooth. pxWords(box) draws a tip's words onto
     whole screen pixels instead: each of the font's pixels is one screen pixel (two or more on sharp screens), with
     no soft edges. */
import { pixelOn, gridPx } from "./pixel.js";
import { applyPalette } from "./pixelpalette.js";

/* ---------- emoji ---------- */

/* an emoji as the browser shows it in color: an emoji character, a pictograph asked to be shown as emoji (U+FE0F), a
   flag (two regional letters), with skin tones and ZWJ joins (family, profession). Not plain symbols such as ⚙ or ✓:
   those are drawn in the text's own color, as words */
const ONE =
    "(?:\\p{Emoji_Presentation}|\\p{Extended_Pictographic}\\uFE0F)(?:\\p{EMod}|\\uFE0F)*",
  EMOJI = new RegExp(
    `\\p{RI}\\p{RI}|${ONE}(?:\\u200D(?:${ONE}|\\p{Extended_Pictographic}))*`,
    "gu",
  ),
  /* where an emoji stays as it is: typing boxes, drawings (pxdom.js does those), the maps, and my own pieces */
  SKIP =
    "svg, input, textarea, select, option, script, style, title, [contenteditable], [data-nopx], .pxe, .tip, .tipbox",
  FONT =
    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
  BIG = 96; // (css px an emoji is first drawn at, before it's made small)

const made = new Map(); // emoji + "@" + cells -> data URL (a few dozen emoji at most: kept for good)

/* the emoji as cells × cells pixels: drawn big, cropped to what it shows, made small, through the palette */
function emojiURL(e, cells) {
  const key = e + "@" + cells;
  if (made.has(key)) return made.get(key);
  const big = document.createElement("canvas");
  big.width = big.height = BIG * 1.5;
  const b = big.getContext("2d", { willReadFrequently: true });
  b.font = `${BIG}px ${FONT}`;
  b.textAlign = "center";
  b.textBaseline = "middle";
  b.fillText(e, big.width / 2, big.height / 2);
  /* the box of what it really shows (an emoji's glyph has room around it) */
  const d = b.getImageData(0, 0, big.width, big.height).data;
  let x0 = big.width,
    y0 = big.height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < big.height; y++)
    for (let x = 0; x < big.width; x++)
      if (d[(y * big.width + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) {
    made.set(key, "");
    return ""; // (this device has no picture for it: the emoji shows as it is)
  }
  const w = x1 - x0 + 1,
    h = y1 - y0 + 1,
    k = cells / Math.max(w, h),
    cw = Math.max(1, Math.round(w * k)),
    ch = Math.max(1, Math.round(h * k)),
    c = document.createElement("canvas");
  c.width = c.height = cells;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high"; // (each pixel the average of what it covers, as pixel.js makes pictures)
  x.drawImage(
    big,
    x0,
    y0,
    w,
    h,
    Math.floor((cells - cw) / 2),
    Math.floor((cells - ch) / 2),
    cw,
    ch,
  );
  x.putImageData(applyPalette(x.getImageData(0, 0, cells, cells)), 0, 0);
  const url = c.toDataURL();
  made.set(key, url);
  return url;
}

/* one emoji's picture at the size its words are now, on the grid */
function fit(span) {
  const fs = parseFloat(getComputedStyle(span).fontSize) || 16,
    g = gridPx(),
    cells = Math.max(4, Math.round((fs * 1.05) / g)); // (about as tall as the words around it)
  if (span.dataset.cells === String(cells) && span.dataset.g === g.toFixed(3))
    return;
  const url = emojiURL(span.dataset.e, cells);
  span.dataset.cells = cells;
  span.dataset.g = g.toFixed(3);
  if (!url) {
    span.classList.add("pxe-none");
    return;
  }
  span.style.backgroundImage = `url(${url})`;
  span.style.backgroundSize = `${(cells * g).toFixed(2)}px`;
}

/* a run of text with emoji in it: each emoji goes in its own <span class="pxe">, the rest stays text */
function wrap(node) {
  const text = node.nodeValue;
  EMOJI.lastIndex = 0;
  if (!EMOJI.test(text)) return [];
  const p = node.parentElement;
  if (!p || p.closest(SKIP)) return [];
  EMOJI.lastIndex = 0;
  const frag = document.createDocumentFragment(),
    spans = [];
  let at = 0;
  for (const m of text.matchAll(EMOJI)) {
    if (m.index > at) frag.append(text.slice(at, m.index));
    const s = document.createElement("span");
    s.className = "pxe";
    s.dataset.e = m[0];
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", m[0]);
    const g = document.createElement("span");
    g.textContent = m[0];
    s.append(g);
    frag.append(s);
    spans.push(s);
    at = m.index + m[0].length;
  }
  if (at < text.length) frag.append(text.slice(at));
  node.replaceWith(frag);
  return spans;
}

function css() {
  if (document.getElementById("pxtext-css")) return;
  const s = document.createElement("style");
  s.id = "pxtext-css";
  s.textContent =
    ".pxe{display:inline-block;background:center no-repeat;image-rendering:pixelated}" +
    ".pxe>span{opacity:0}" +
    ".pxe.pxe-none>span{opacity:1}" +
    ".pxw{display:block;image-rendering:pixelated;pointer-events:none}";
  document.head.append(s);
}

/* every emoji under root shown as pixels: those there now and every one that comes or changes. Returns stop() */
export function pxEmojiWatch(root) {
  if (!pixelOn()) return () => {};
  css();
  let raf = 0;
  const nodes = new Set(),
    toFit = new Set();
  const flush = () => {
    raf = 0;
    for (const n of nodes)
      if (n.isConnected) wrap(n).forEach((s) => toFit.add(s));
    nodes.clear();
    for (const s of toFit) if (s.isConnected) fit(s);
    toFit.clear();
  };
  const want = (n) => {
    if (n.nodeType === 3) nodes.add(n);
    else if (n.nodeType === 1 && !n.closest(SKIP)) {
      EMOJI.lastIndex = 0;
      if (!EMOJI.test(n.textContent)) return; // (no emoji in it: nothing to look for)
      const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      for (let t = w.nextNode(); t; t = w.nextNode()) nodes.add(t);
    } else return;
    if (!raf) raf = requestAnimationFrame(flush);
  };
  const mo = new MutationObserver((recs) => {
    for (const r of recs)
      if (r.type === "characterData") want(r.target);
      else r.addedNodes.forEach(want);
  });
  mo.observe(root, { subtree: true, childList: true, characterData: true });
  want(root);
  /* the grid follows the board's duck size, and words change size with the screen: every emoji made again to fit */
  const refit = () => {
    root.querySelectorAll(".pxe").forEach((s) => toFit.add(s));
    if (!raf) raf = requestAnimationFrame(flush);
  };
  addEventListener("resize", refit);
  addEventListener("pxgrid", refit);
  return () => {
    mo.disconnect();
    removeEventListener("resize", refit);
    removeEventListener("pxgrid", refit);
    if (raf) cancelAnimationFrame(raf);
  };
}

/* ---------- a tip's words on whole screen pixels ----------
   Jersey 15 is drawn on a grid of 50 units to an em of 1350: 27 of its pixels to an em, 11 to a small letter's height
   and 21 above the line. Drawn at 27 px on a canvas, each of its pixels is exactly one of the canvas', with no soft
   edges; the canvas is then shown at a whole number of screen pixels per pixel, as close as can be to the size the
   words had. Long tips break between words, as before. The words stay in the box for screen readers (aria-label). */
const EM = 27,
  ASC = 21,
  LINE = 30; // (the font's pixels from one line to the next)

export function pxWords(box) {
  if (!pixelOn() || !document.fonts.check(`${EM}px "Jersey 15"`)) return; // (no font yet: the words stay as words)
  if (document.documentElement.classList.contains("map-is-nwk")) return; // (Nous Within Kenoma's terminal: its own pixel letters, VT323, css/app.css)
  css();
  const text = box.textContent.trim();
  if (!text) return;
  const cs = getComputedStyle(box),
    dpr = devicePixelRatio || 1,
    xh = 0.52 * parseFloat(cs.fontSize), // (a small letter's height now: the page's font-size-adjust)
    k = Math.max(1, Math.round((xh / 11) * dpr)), // (screen pixels to one of the font's)
    one = k / dpr, // (css px to one of the font's pixels)
    grow = one / (xh / 11), // (how much bigger its words came out: the box may grow as much, so they break as before)
    pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
    maxW = Math.floor(
      Math.min(
        innerWidth - 16 - pad,
        ((parseFloat(cs.maxWidth) || innerWidth * 0.8) - pad) * grow,
      ),
    ),
    c = document.createElement("canvas"),
    x = c.getContext("2d", { willReadFrequently: true }),
    font = `${EM}px "Jersey 15", monospace`;
  x.font = font;
  const room = Math.floor(maxW / one),
    lines = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = line ? line + " " + w : w;
      if (line && x.measureText(t).width > room) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    lines.push(line);
  }
  const W = Math.max(
      1,
      Math.ceil(Math.max(...lines.map((l) => x.measureText(l).width))),
    ),
    H = (lines.length - 1) * LINE + EM;
  c.width = W;
  c.height = H;
  x.font = font;
  x.fillStyle = cs.color;
  lines.forEach((l, i) => x.fillText(l, 0, ASC + i * LINE));
  /* any soft edge left (an emoji or a symbol from another font): kept or dropped, never half */
  const img = x.getImageData(0, 0, W, H),
    d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0;
  x.putImageData(img, 0, 0);
  c.className = "pxw";
  c.style.width = (W * one).toFixed(3) + "px";
  c.style.height = (H * one).toFixed(3) + "px";
  box.setAttribute("aria-label", text);
  box.style.maxWidth = "none";
  box.replaceChildren(c);
}
