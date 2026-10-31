/* ---------- the start: a slow fade to black over the countdown, then a loading screen ----------
   I want the screen to go dark while the start counts down (a cancel brings it back), then a black screen with my duck,
   my ping under it and a bar, and the game fading in fast once the bar is full. The veil lives on the page, outside any
   screen, so it stays up while the router swaps the lobby for the game. */
import { duckSVG } from "./duck.js";

let veil = null;
const make = () => {
  if (veil && veil.isConnected) return veil;
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
export function loadingScreen({ duck, ping, ready }) {
  const v = make();
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
  pingEl.textContent = "Ping …";
  Promise.resolve(ping && ping())
    .then(
      (ms) =>
        (pingEl.textContent = `Ping ${Math.max(0, Math.round(ms || 0))} ms`),
    )
    .catch(() => (pingEl.textContent = ""));
  const t0 = performance.now(),
    MIN = 700,
    MAX = 5000;
  bar.style.transition = "none";
  bar.style.width = "0%";
  bar.getBoundingClientRect();
  bar.style.transition = `width ${MIN}ms ease-out`;
  bar.style.width = "88%"; // (it creeps to nearly full, and fills when the game is up)
  const up = Promise.race([
    Promise.resolve(ready && ready()).catch(() => null),
    new Promise((r) => setTimeout(r, MAX)),
  ]);
  up.then(() => {
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
