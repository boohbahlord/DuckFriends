/* ---------- the name of what's in my hand, and its caliber ----------
   The owner's, Nov 21 17:25Z: "very, very small text ... It should probably be in that little black box in the bottom of
   the screen that's transparent that holds that portion of the UI. It should say what the item is when you switch to it
   by name. That helps a lot. And it should also say what caliber it uses. And maybe a semicolon after or parentheses or
   something like that as well, so players know." So: "M1911 (.45 ACP)", the caliber from guns.js (ARMS[w].cal); a
   weapon without one (melee, daggers, grenades, items) shows its name alone.
   It goes with the slots: on a computer in the bottom bar's strip over the slots' left end (in the slots' row), on a
   phone beside the specials' slider: held upright right of it (in the slider, so it moves with it), up to my HP; held
   sideways left of it in the same row, up to the bar's middle. It wraps within that room, so it never covers anything. */
import { ARMS } from "./guns.js";

const GAP = 6; // px between it and what's next to it

/* "Name (caliber)", or the name alone */
export const itemLabel = (name, w) => {
  const c = (ARMS[w] || {}).cal;
  return c ? `${name} (${c})` : name;
};

const seen = (e) => !!e && e.getClientRects().length > 0 && e.offsetWidth > 0;
const tag = () => {
  const el = document.createElement("span");
  el.className = "iname";
  el.setAttribute("aria-hidden", "true");
  return el;
};

/* row: the slots' row (a computer's), slider(): the phone's slider (hotbar.js .sp-phone), or null. Gives show(text):
   "" hides it */
export function mountItemName(row, slider) {
  const pc = tag(),
    ph = tag();
  row.append(pc);
  let text = "",
    ro = null;
  /* a phone's room beside the slider, measured when the text or the bar's size changes (never every frame) */
  const room = () => {
    const sp = slider();
    if (!sp || !seen(sp)) return;
    const up = matchMedia("(orientation: portrait)").matches;
    if (up && ph.parentNode !== sp) sp.append(ph);
    if (!up && ph.nextSibling !== sp) sp.before(ph); // (on its side the slider sits in the row: the name goes in it too)
    const bar = sp.closest(".bbar") || document.body,
      r = sp.getBoundingClientRect(),
      next = up ? bar.querySelector(".hpm-me") : bar.querySelector(".bbar-c"),
      edge = seen(next)
        ? next.getBoundingClientRect()[up ? "left" : "right"]
        : bar.getBoundingClientRect()[up ? "right" : "left"],
      w = (up ? edge - r.right : r.left - edge) - GAP * 2;
    ph.classList.toggle("end", !up);
    ph.style.maxWidth = Math.max(0, w) + "px";
    ph.style.visibility = w < 24 ? "hidden" : ""; // (no room: never squeezed over something)
    if (!ro && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(room);
      ro.observe(bar);
    }
  };
  return {
    show(t) {
      if (pc.parentNode !== row) row.append(pc); // (the row's slots made again take it out)
      if (t === text) return;
      text = t;
      for (const e of [pc, ph]) {
        e.textContent = t;
        e.hidden = !t;
      }
      if (t) requestAnimationFrame(room);
    },
    destroy() {
      if (ro) ro.disconnect();
      pc.remove();
      ph.remove();
    },
  };
}
