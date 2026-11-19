/* ---------- full screen (named corners.js after its four-corners button: some ad blockers block any file called "fullscreen.js", which stopped the whole game on the owner's laptop) ----------
   On a phone the browser's own bars eat the room, most of all on its side. So there the first tap on the start screen
   (TAP TO START) puts the game in full screen; on every device a button left of the players button (or of the pause button where
   there's none) leaves full screen and comes back to it, with the usual four-corners sign. A press makes the button
   glow for 4 s and then fade; pressing again starts the glow over instead of stacking a second one. */
import { isPhone } from "./pointer.js";

const html = document.documentElement;
/* the installed app (sw.js, manifest.webmanifest) already opens in full screen, so there the first tap's full screen
   stays off: asking by itself would only bring back Chrome's "To exit full screen" pop-up. The button stays everywhere
   the browser can go full screen, phones, computers and the app alike (the owner's, Nov 17 13:07Z: "just because it
   cant do it automatically in pc doesnt mean we remove the button") */
const appMode = matchMedia(
  "(display-mode: fullscreen), (display-mode: standalone)",
);
export const inApp = () => appMode.matches || navigator.standalone === true;
html.classList.toggle("app", inApp());
const api = () =>
  !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const can = () => !inApp() && api(); // (going full screen by itself: the first tap)
const isFull = () =>
  !!(document.fullscreenElement || document.webkitFullscreenElement);

function enter() {
  const f = html.requestFullscreen || html.webkitRequestFullscreen;
  if (!f) return;
  try {
    const p = f.call(html, { navigationUI: "hide" });
    if (p && p.catch) p.catch(() => {});
  } catch {}
}
function leave() {
  const f = document.exitFullscreen || document.webkitExitFullscreen;
  if (!f) return;
  try {
    const p = f.call(document);
    if (p && p.catch) p.catch(() => {});
  } catch {}
}

/* the sign: four corners pointing out (go full screen) or in (leave it) */
const OUT = '<path d="M3 9V3h6M19 3h6v6M25 19v6h-6M9 25H3v-6"/>';
const IN = '<path d="M9 3v6H3M25 9h-6V3M19 25v-6h6M3 19h6v6"/>';
const sign = (d) =>
  `<svg viewBox="0 0 28 28" width="1.15em" height="1.15em" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="butt" aria-hidden="true">${d}</svg>`;

export const fsBtnHTML = () =>
  `<button type="button" class="btn ghost iconbtn fs-btn" data-fs aria-label="Full screen" data-tip="Full screen"><span class="fs-out">${sign(OUT)}</span><span class="fs-in">${sign(IN)}</span></button>`;

function mark() {
  html.classList.toggle("fs-on", isFull());
  html.classList.toggle("fs-can", api()); // (the button: on every device)
  for (const b of document.querySelectorAll("[data-fs]"))
    b.setAttribute(
      "aria-label",
      isFull() ? "Leave full screen" : "Full screen",
    );
}
mark();
document.addEventListener("fullscreenchange", mark);
document.addEventListener("webkitfullscreenchange", mark);
addEventListener("resize", mark);
appMode.addEventListener?.("change", () => {
  html.classList.toggle("app", inApp());
  mark();
});

let glowTimer = 0;
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-fs]");
  if (!b) return;
  if (isFull()) leave();
  else enter();
  /* one glow at a time: a second press restarts it */
  clearTimeout(glowTimer);
  for (const x of document.querySelectorAll("[data-fs].glow"))
    x.classList.remove("glow");
  void b.offsetWidth;
  b.classList.add("glow");
  glowTimer = setTimeout(() => {
    for (const x of document.querySelectorAll("[data-fs].glow"))
      x.classList.remove("glow");
  }, 4000);
});

/* the first tap on the start screen goes full screen (a finger's lift is what lets a page do that) */
export function fullOnFirstTap() {
  if (!isPhone() || !can()) return;
  const once = () => {
    removeEventListener("pointerup", once, true);
    if (!isFull()) enter();
  };
  addEventListener("pointerup", once, true);
}
