/* ---------- a page of Customize's tiles put on the screen (customize.js show) ----------
   The same page again (a pick on it): every tile whose picture and words didn't change stays as it is, with its
   pixels, so a pick only redraws what it changed (the owner's, Nov 20 21:38Z: a pick froze for a second). A tile that
   changed keeps its old picture over it until its new one is in. Another page: the page shown stays over the new one
   until the new one's pictures are in, so no tile is ever empty (the owner's, Nov 20 20:46Z) */
import { esc } from "./ui.js";
import { shownSoon } from "./loading.js";
import { pxNow } from "./pxdom.js";

const TILE = ".arm-tile[data-g][data-v]";
/* menu: where the page goes; html: its words; same: the page on it now is this one; next: its words already made
   into elements (off the page) */
export function putPage(menu, html, same, next) {
  const src = tileSources(html);
  let old = menu.querySelector(":scope > .arm-old");
  if (old) old.remove();
  old = null;
  if (same) {
    const was = new Map();
    for (const t of menu.querySelectorAll(TILE))
      if (t._src !== undefined) was.set(tileKey(t), t);
    /* a tile that is as it was isn't even made again: only its box comes in (data-keep), and the one on the page
       takes that box's classes and state. The page is changed in place, so what didn't change isn't laid out
       or styled again either */
    const fresh = document.createElement("div");
    fresh.innerHTML = html.replace(TILE_HTML, (all, open, g, v, inner) => {
      const o = was.get(g + " " + v);
      return o && o._src === src.get(g + " " + v)
        ? open.replace("<button", "<button data-keep") + "</button>"
        : all;
    });
    const redrawn = [];
    morphInto(menu, fresh, was, redrawn);
    for (const t of menu.querySelectorAll("[data-keep]")) {
      const o = was.get(tileKey(t));
      if (!o) {
        t.remove();
        continue;
      }
      copyAttrs(o, t);
      t.replaceWith(o);
    } // (where the page's shape changed: the kept tiles put back in their new places)
    for (const [t, o] of redrawn) {
      o.classList.add("arm-was");
      o.setAttribute("data-nopx", "");
      o.inert = true;
      t.append(o);
      shownSoon(t).then(() => o.remove());
    }
  } else {
    /* another page: the page shown stays over the new one until the new one's pictures are in (data-nopx:
       left as it is), so no tile is ever empty (the owner's, Nov 20 20:46Z) */
    if (menu.firstElementChild) {
      old = document.createElement("div");
      old.className = "arm-old";
      old.setAttribute("data-nopx", "");
      old.inert = true; // (only a picture of the last page: nothing in it is reached)
      const top = (menu.querySelector(".arm-body") || {}).scrollTop || 0;
      old.append(...menu.childNodes);
      old.dataset.top = top;
    }
    if (next) menu.replaceChildren(...next.childNodes);
    else menu.innerHTML = html;
  }
  for (const t of menu.querySelectorAll(TILE))
    if (t._src === undefined) t._src = src.get(tileKey(t)); // (what it was made from, before its pixels)
  pxNow(); // (the new tiles' drawings marked before the page is laid out below)
  if (old) {
    menu.append(old);
    const ob = old.querySelector(".arm-body");
    if (ob) ob.scrollTop = +old.dataset.top || 0;
    const fresh = [...menu.children].filter((e) => e !== old);
    shownSoon(fresh).then(() => {
      if (fresh.every((e) => e.isConnected)) old.remove();
    });
  }
}

/* a tile in the page's words: its opening, group, value (as written: escaped) and insides */
const TILE_HTML =
  /(<button type="button" class="arm-tile[^"]*" data-g="([^"]*)" data-v="([^"]*)"[^>]*>)([\s\S]*?)<\/button>/g;
const tileKey = (t) => t.dataset.g + " " + esc(t.dataset.v);
/* each tile's insides, from the page's words (the drawings' ids left out: they are new each time, duck.js uid) */
function tileSources(html) {
  const out = new Map();
  for (const m of html.matchAll(TILE_HTML))
    out.set(
      m[2] + " " + m[3],
      m[4].replace(/\b(dk|ht|fc|ey|bk|jma)\d+/g, "$1"),
    );
  return out;
}
/* a's attributes made b's (a kept tile's data-keep, and the pixels' own marks, left alone) */
const OWN = new Set(["data-keep", "data-px", "data-pxwait"]);
function copyAttrs(a, b) {
  for (const at of [...a.attributes])
    if (!b.hasAttribute(at.name) && !OWN.has(at.name))
      a.removeAttribute(at.name);
  for (const at of b.attributes)
    if (!OWN.has(at.name) && a.getAttribute(at.name) !== at.value)
      a.setAttribute(at.name, at.value);
}
/* the page on the screen (a) made like the one just written (b), in place: the same element where the same element
   stands; a tile that changed is a new one (and its old picture goes on it till its new one is in: redrawn); a drawing
   outside the tiles is new if its words changed. Where the shape differs, b's part goes in whole */
function morphInto(a, b, was, redrawn) {
  const ac = [...a.childNodes],
    bc = [...b.childNodes];
  if (ac.length !== bc.length) return a.replaceChildren(...bc);
  bc.forEach((n, i) => {
    const m = ac[i];
    if (m.nodeType !== n.nodeType || m.nodeName !== n.nodeName)
      return m.replaceWith(n);
    if (n.nodeType !== 1) {
      if (m.nodeValue !== n.nodeValue) m.nodeValue = n.nodeValue;
      return;
    }
    if (n.matches(TILE)) {
      if (n.hasAttribute("data-keep") && m === was.get(tileKey(n))) {
        copyAttrs(m, n);
        return;
      }
      m.replaceWith(n);
      if (
        !n.hasAttribute("data-keep") &&
        m.nodeName === n.nodeName &&
        m.matches(TILE) &&
        tileKey(m) === tileKey(n)
      )
        redrawn.push([n, m]); // (the same tile, changed)
      return;
    }
    if (n.namespaceURI === "http://www.w3.org/2000/svg") {
      const w = n.outerHTML;
      if (m._words === w) return;
      n._words = w;
      return m.replaceWith(n);
    }
    copyAttrs(m, n);
    morphInto(m, n, was, redrawn);
  });
}
