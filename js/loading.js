/* ---------- the start: a slow fade to black over the countdown, then a loading screen ----------
   I want the screen to go dark while the start counts down (a cancel brings it back), then a black screen with my duck,
   my ping under it and a bar, and the game fading in fast once the bar is full. The veil lives on the page, outside any
   screen, so it stays up while the router swaps the lobby for the game. */
import { duckSVG } from "./duck.js";
import { profile } from "./store.js";

let veil = null;
const make = () => {
  if (veil && veil.isConnected) return veil;
  veil = document.querySelector(".veil"); // (the page's own, there from the first paint: index.html)
  if (veil) return veil;
  veil = document.createElement("div");
  veil.className = "veil";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = `<div class="veil-box"><div class="veil-duck"></div><p class="veil-ping"></p><div class="veil-bar"><i></i></div></div>`;
  document.body.appendChild(veil);
  return veil;
};
const fade = (v, ms, to) => {
  v.style.transitionDuration = `${Math.max(0, ms)}ms`;
  v.getBoundingClientRect(); // (the duration is set before the opacity moves)
  v.style.opacity = to;
};

/* the lobby: the screen goes dark over the ms left of the countdown (once, then it just goes on) */
export function darken(ms) {
  const v = make();
  if (v.dataset.on) return;
  v.dataset.on = "1";
  v.classList.remove("loading");
  fade(v, ms, 1);
}
/* a cancelled start: the screen comes back */
export function brighten() {
  if (!veil || !veil.dataset.on) return;
  delete veil.dataset.on;
  fade(veil, 350, 0);
}

/* the game starts: duck, ping and bar on the black; ready() says when the game is on its screen. The bar fills as long as
   the game takes (at least a moment, so it shows), then the game fades in fast. */
let busy = 0; // (loading screens asked for at once: the page comes back when the last one is ready)
export function loadingScreen({ duck, ping, ready, max = 5000 }) {
  const v = make();
  busy++;
  v.dataset.on = "1";
  v.style.pointerEvents = "auto";
  v.classList.add("loading");
  fade(v, 0, 1);
  v.querySelector(".veil-duck").innerHTML = duckSVG(duck, {
    size: 110,
    shadow: true,
    title: "",
  });
  const pingEl = v.querySelector(".veil-ping"),
    bar = v.querySelector(".veil-bar i");
  pingEl.textContent = ping ? "Ping …" : "";
  if (ping)
    Promise.resolve(ping())
      .then(
        (ms) =>
          (pingEl.textContent = `Ping ${Math.max(0, Math.round(ms || 0))} ms`),
      )
      .catch(() => (pingEl.textContent = ""));
  const t0 = performance.now(),
    MIN = 700,
    MAX = max;
  if (busy === 1) {
    bar.style.transition = "none";
    bar.style.width = "0%";
    bar.getBoundingClientRect();
    bar.style.transition = `width ${MIN}ms ease-out`;
    bar.style.width = "88%"; // (it creeps to nearly full, and fills when the game is up)
  }
  const up = Promise.race([
    Promise.resolve(ready && ready()).catch(() => null),
    new Promise((r) => setTimeout(r, MAX)),
  ]);
  up.then(() => {
    if (--busy > 0) return; // (another screen is still waiting)
    const wait = Math.max(0, MIN - (performance.now() - t0));
    setTimeout(() => {
      bar.style.transition = "width 180ms ease-out";
      bar.style.width = "100%";
      setTimeout(() => {
        v.style.pointerEvents = "";
        fade(v, 260, 0); // the game comes back very quickly
        delete v.dataset.on;
        setTimeout(() => v.classList.remove("loading"), 300);
      }, 220);
    }, wait);
  });
}

/* the page is ready when the fonts are in and the frames come steadily again (three in a row under 70 ms), so a screen
   that takes long to build (a big map, Duck Cabin, a slow phone) keeps the loading screen up until it is drawn */
export const pageReady = () =>
  Promise.all([
    document.fonts ? document.fonts.ready : null,
    new Promise((res) => {
      let last = performance.now(),
        steady = 0;
      const frame = (t) => {
        steady = t - last < 70 ? steady + 1 : 0;
        last = t;
        if (steady >= 3) res();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }),
  ]);
/* the loading screen while something else is awaited (a room being created or joined, a window being built); done()
   takes it away (it shows for a moment at least, and goes on its own after maxMs) */
export function holdLoading({ ping, maxMs = 20000 } = {}) {
  let done;
  const p = new Promise((r) => (done = r));
  loadingScreen({ duck: profile.duck, ping, ready: () => p, max: maxMs });
  return () => pageReady().then(done);
}
