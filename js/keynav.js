/* ---------- menus by keyboard ----------
   The arrow keys move between the buttons of whatever is on top: a right-click menu, a window (pause, Customize,
   Settings, Game type…), the players menu (Tab), or the front page, Rooms and the lobby. Enter picks; Shift+Enter is a
   right-click. In a game the arrows walk the duck unless one of those menus is open. A typing box keeps its own keys,
   except that up and down leave a one-line box (not the chat's, which has its own up and down). */
import { $$, navSig, refocus } from "./ui.js";

export const NAV_HINTS =
  "<kbd>↑↓←→</kbd> Move around <kbd>Enter</kbd> Select <kbd>Shift+Enter</kbd> Right-click";

const ARROWS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/* the menu on top, or nothing */
function scope() {
  const ctx = $$(".ctx").pop();
  if (ctx) return ctx;
  const win = $$(".win-back").pop();
  if (win) return win.querySelector(".win");
  const pm = document.querySelector(".pmenu:not([hidden])");
  if (pm) return pm;
  return (
    (document.body.dataset.screen !== "game" &&
      document.querySelector("#app > .screen")) ||
    null
  );
}

/* what can be picked in it: the row, not the card inside it; never a window's X (Esc closes it) */
const FOCUSABLE =
  "button, a[href], input, select, textarea, summary, [tabindex]";
export function items(sc) {
  const all = $$(FOCUSABLE, sc).filter(
    (b) =>
      !b.disabled &&
      b.tabIndex >= 0 &&
      b.type !== "hidden" &&
      !b.closest(".win-x, [data-nonav]") &&
      b.getClientRects().length &&
      getComputedStyle(b).visibility !== "hidden",
  );
  return all.filter((b) => !all.some((a) => a !== b && a.contains(b)));
}

/* a box to type in (a tick box or a color well is more like a button) */
const textBox = (t) =>
  t.isContentEditable ||
  ["TEXTAREA", "SELECT"].includes(t.tagName) ||
  (t.tagName === "INPUT" &&
    !["checkbox", "radio", "file", "color", "button", "submit"].includes(
      t.type,
    ));
/* does the focused box keep this key for itself? */
function keeps(t, key) {
  if (!textBox(t)) return false;
  if (t.isContentEditable || t.tagName === "TEXTAREA") return true;
  if (t.tagName === "SELECT") return false; // (Enter opens its list, which then has the arrows)
  if (t.type === "range") return key === "ArrowLeft" || key === "ArrowRight";
  return (
    key === "Enter" ||
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    !!t.closest(".dock-l, .dock-r, .dock-b")
  ); // (the chat's up and down are its own)
}

/* the nearest item that way. In order: one in line with this one (the next row of a grid, the next button of a list,
   the next card of a column), the far end of that line (up and down wrap around), then the nearest one anywhere that way */
function nearest(list, from, [dx, dy]) {
  const a = from.getBoundingClientRect(),
    mid = (r) => [r.left + r.width / 2, r.top + r.height / 2],
    [ax, ay] = mid(a),
    vert = dy !== 0;
  const best = [
    [null, Infinity],
    [null, Infinity],
    [null, Infinity],
  ]; // in line; wrapped in line; anywhere
  const keep = (i, b, s) => {
    if (s < best[i][1]) best[i] = [b, s];
  };
  for (const b of list) {
    if (b === from) continue;
    const r = b.getBoundingClientRect(),
      [bx, by] = mid(r);
    const inLine =
      (vert
        ? Math.min(r.right, a.right) - Math.max(r.left, a.left)
        : Math.min(r.bottom, a.bottom) - Math.max(r.top, a.top)) > -16; // (or nearly: the tile beside the one above)
    const off = vert ? Math.abs(bx - ax) : Math.abs(by - ay);
    if ((vert ? (by - ay) * dy : (bx - ax) * dx) > 1) {
      const gap = Math.max(
        0,
        vert
          ? dy > 0
            ? r.top - a.bottom
            : a.top - r.bottom
          : dx > 0
            ? r.left - a.right
            : a.left - r.right,
      );
      keep(inLine ? 0 : 2, b, gap * 4 + off);
    } else if (vert && inLine)
      keep(1, b, (dy > 0 ? r.top : -r.bottom) * 4 + off);
  }
  return (best.find(([b]) => b) || [null])[0];
}

/* where the arrows start in a menu: what had the focus there last, its marked start, the item chosen, or the first */
const lastSig = new WeakMap();
function start(sc, list) {
  const sig = lastSig.get(sc),
    was = sig && list.find((b) => navSig(b) === sig);
  if (was) return was;
  const mark = sc.querySelector("[data-nav-start]"),
    inMark = mark && list.find((b) => mark === b || mark.contains(b));
  return (
    inMark ||
    list.find((b) => b.getAttribute("aria-pressed") === "true") ||
    list.find((b) => !textBox(b)) ||
    list[0]
  );
}
document.addEventListener("focusin", (e) => {
  const sc = scope();
  if (sc && sc.contains(e.target)) lastSig.set(sc, navSig(e.target));
});

/* Enter: a click on it; Shift+Enter: a right-click. If a redraw took it away, the focus goes back to its new copy. */
function press(b, right) {
  if (!right && b.tagName === "SELECT") {
    try {
      b.showPicker();
    } catch (e) {
      /* an old browser */
    }
    return;
  }
  const r = b.getBoundingClientRect(),
    o = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2,
    };
  const sig = navSig(b);
  b.dispatchEvent(
    new MouseEvent(right ? "contextmenu" : "click", {
      ...o,
      button: right ? 2 : 0,
    }),
  );
  requestAnimationFrame(() => {
    const f = document.activeElement,
      sc = scope();
    if (sc && (!f || f === document.body || !f.isConnected)) {
      const list = items(sc);
      if (list.some((x) => navSig(x) === sig)) refocus(sc, sig, list);
      else start(sc, list)?.focus();
    }
  });
}

addEventListener(
  "keydown",
  (e) => {
    const dir = ARROWS[e.key];
    if (
      (!dir && e.key !== "Enter") ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.isComposing
    )
      return;
    const sc = scope();
    if (!sc) return;
    const t = e.target,
      inside = t instanceof Element && t !== document.body && sc.contains(t);
    if (inside && keeps(t, e.key)) return;
    if (e.key === "Enter") {
      if (!inside || e.repeat) return; // (nothing chosen: Enter does what it always does, like ending your turn)
      e.preventDefault();
      e.stopPropagation();
      press(t, e.shiftKey);
      return;
    }
    if (!inside && e.repeat && sc.matches(".pmenu")) return; // still holding an arrow from walking when Tab came up
    e.preventDefault();
    e.stopPropagation();
    const list = items(sc);
    if (!list.length) return;
    const to = inside
      ? nearest(list, list.find((b) => b.contains(t)) || t, dir)
      : start(sc, list);
    if (to) to.focus();
  },
  true,
);
