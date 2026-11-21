/* ---------- hold I on an item: its card (the owner's, Nov 21 18:24Z) ----------
   While I is held over an item (the merchant's list and the Items tab, the hotbar: anything that carries data-item), a
   small card shows beside the pointer with what it does, its numbers, its caliber and its barrel; let go and it goes. On a
   phone the same card shows while a finger rests on the item (a long press) and goes when it lifts. The card is made by
   l4ddcatalog.js itemCardHTML, so it says what the Items tab says. */
import { typing } from "./ui.js";
import { itemCardHTML } from "./l4ddcatalog.js";

const HOLD_MS = 450; // (a long press)
let tip = null,
  mounted = false,
  at = [0, 0],
  timer = 0,
  shown = "";
function hide() {
  clearTimeout(timer);
  timer = 0;
  shown = "";
  if (tip) tip.hidden = true;
}
/* the item under (x, y), through a disabled button too */
const itemAt = (x, y) => {
  const e = document.elementFromPoint(x, y);
  return e && e.closest ? e.closest("[data-item]") : null;
};
function show(x, y) {
  const it = itemAt(x, y),
    w = it && it.dataset.item,
    html = w && itemCardHTML(w);
  if (!html) return hide();
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "item-tip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
  }
  if (shown !== w) {
    shown = w;
    tip.innerHTML = html;
  }
  tip.hidden = false;
  const r = tip.getBoundingClientRect(),
    left = Math.max(8, Math.min(innerWidth - r.width - 8, x + 16)),
    top = Math.max(8, Math.min(innerHeight - r.height - 8, y + 16));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}
export function mountItemTip() {
  if (mounted) return;
  mounted = true;
  addEventListener(
    "pointermove",
    (e) => {
      at = [e.clientX, e.clientY];
      if (tip && !tip.hidden && e.pointerType !== "touch") show(...at); // (held: it follows the pointer)
    },
    { passive: true },
  );
  addEventListener("keydown", (e) => {
    if (
      (e.key === "i" || e.key === "I") &&
      !e.repeat &&
      !typing(e) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    )
      show(...at);
  });
  addEventListener("keyup", (e) => {
    if (e.key === "i" || e.key === "I") hide();
  });
  addEventListener("blur", hide);
  /* a phone: a finger resting on an item */
  addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t || !itemAt(t.clientX, t.clientY)) return;
      clearTimeout(timer);
      timer = setTimeout(() => show(t.clientX, t.clientY), HOLD_MS);
    },
    { passive: true },
  );
  for (const k of ["touchend", "touchcancel"])
    addEventListener(k, hide, { passive: true });
  addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (t && tip && !tip.hidden) show(t.clientX, t.clientY);
      else if (t && !itemAt(t.clientX, t.clientY)) hide();
    },
    { passive: true },
  );
  addEventListener("contextmenu", (e) => {
    if (tip && !tip.hidden) e.preventDefault(); // (the long press's own menu stays out of the way)
  });
}
