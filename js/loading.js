/* ---------- the start: a slow fade to black over the countdown, then a loading screen ----------
   I want the screen to go dark while the start counts down (a cancel brings it back), then a black screen with my duck,
   my ping under it and a bar, and the game fading in fast once the bar is full. The veil lives on the page, outside any
   screen, so it stays up while the router swaps the lobby for the game. */
import { duckSVG } from "./duck.js";
import { profile } from "./store.js";
import { LOAD_LINES } from "./loadlines.js";

let veil = null;
const make = () => {
  if (veil && veil.isConnected) return veil;
  veil = document.querySelector(".veil"); // (the page's own, there from the first paint: index.html)
  if (veil) return veil;
  veil = document.createElement("div");
  veil.className = "veil";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = `<div class="veil-box"><div class="veil-duck"></div><p class="veil-ping"></p><div class="veil-row"><div class="veil-bar"><i></i></div><b class="veil-pct"></b></div><p class="veil-what"></p><p class="veil-line"></p></div>`;
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
/* under the bar, what is loading in plain words, and how much of it is in at the bar's right (the owner's, Nov 20
   22:25Z: "it says what's being loaded ... below the loading bar. And it might even have a percent of load like to the
   right of the green bar"); under that, one line of text to hold the player over, in the normal font (loadlines.js).
   The percent: what is still on its way (the files pictures are drawn from, the pictures on the screen, the screen
   itself) against the most there was, never going back */
const waits = new Set(); // (the screens asked for, still not ready)
let tell = 0;
function telling(v) {
  const bar = v.querySelector(".veil-bar i"),
    pct = v.querySelector(".veil-pct"),
    what = v.querySelector(".veil-what"),
    line = v.querySelector(".veil-line");
  if (line)
    line.textContent = LOAD_LINES.length
      ? LOAD_LINES[Math.floor(Math.random() * LOAD_LINES.length)]
      : "";
  let most = 1,
    shown = 0;
  const look = () => {
    const w = waiting(document.body),
      left = w.n + (waits.size ? 1 : 0),
      p = Math.max(shown, 1 - left / (most = Math.max(most, left, 1)));
    shown = Math.min(p, 0.97); // (full only once it's all up: below)
    if (bar) bar.style.width = (shown * 100).toFixed(1) + "%";
    if (pct) pct.textContent = Math.floor(shown * 100) + "%";
    if (what) what.textContent = loadingWhat(w);
  };
  clearInterval(tell);
  look();
  tell = setInterval(look, 200);
}
function told() {
  clearInterval(tell);
  tell = 0;
  const v = make(),
    pct = v.querySelector(".veil-pct"),
    what = v.querySelector(".veil-what");
  if (pct) pct.textContent = "100%";
  if (what) what.textContent = "";
}
/* what is loading now, in words: the files a drawing waits for (named where they're asked for: filesFor), then the
   pictures on the screen, then the screen itself */
function loadingWhat(w) {
  for (const what of pending.values()) if (what) return what;
  if (w.n > pending.size) return "Pictures";
  return "The game";
}
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
    bar.style.transition = "width 200ms linear";
  }
  const up = Promise.race([
    Promise.resolve(ready && ready()).catch(() => null),
    new Promise((r) => setTimeout(r, MAX)),
  ]);
  waits.add(up);
  if (busy === 1) telling(v);
  up.then(() => {
    waits.delete(up);
    if (--busy > 0) return; // (another screen is still waiting)
    const wait = Math.max(0, MIN - (performance.now() - t0));
    setTimeout(() => {
      if (busy) return; // (another loading screen came in the meantime: it stays up for that one)
      told();
      bar.style.transition = "width 180ms ease-out";
      bar.style.width = "100%";
      setTimeout(() => {
        if (busy) return;
        v.style.pointerEvents = "";
        fade(v, 260, 0); // the game comes back very quickly
        delete v.dataset.on;
        setTimeout(() => busy || v.classList.remove("loading"), 300);
      }, 220);
    }, wait);
  });
}

/* ---------- pictures still on their way (the owner's, Nov 19 20:04Z: "The loading screen should be anywhere in which it
   hides this kind of pop-in") ----------
   A picture on the screen that isn't shown yet: one still downloading, or, with the pixel look, one waiting for its
   pixels (pixel.js hides an <img> until then, pxdom.js a drawing: data-pxwait). A map's own pictures (the filter and
   pxbake.js draw those where they are) count only while they download: its <img>s, and its pieces on sheets (a
   background in their style: tools/pixel-sheets.cjs). Nothing that has no size (not on the screen) */
const NOT_MINE = ".map-layer, #shapes, [data-nopx], .hurt-edge, .veil";
/* the files come in so far (every picture, sheet and script, as the browser says) */
const came = new Set();
let arrived = 0; // (the last moment any file came in)
try {
  performance.setResourceTimingBufferSize(4000);
  new PerformanceObserver((l) => {
    arrived = performance.now();
    for (const e of l.getEntries()) came.add(e.name);
  }).observe({ type: "resource", buffered: true });
} catch {}
const sheetOf = new WeakMap(); // element -> the file its style's background shows (or "")
const sheetIn = (e) => {
  let u = sheetOf.get(e);
  if (u === undefined) {
    const m = /url\(["']?([^"')]+)/.exec(e.getAttribute("style") || "");
    u =
      m && !/^(data|blob):/.test(m[1])
        ? new URL(m[1], document.baseURI).href
        : "";
    sheetOf.set(e, u);
  }
  return !u || came.has(u);
};
/* files a picture is drawn from out of sight (a world's ground on a canvas, a duck's parts), still on their way: a
   loading screen up now waits for them too (a world popped in after Duck Cabin's loading screen) */
const pending = new Map(); // (each one's name, in words, for the loading screen: "Ducks", "Downpour's pictures")
export function filesFor(p, what = "") {
  pending.set(p, what);
  const off = () => pending.delete(p);
  p.then(off, off);
  return p;
}
/* how many, and how much of the screen they take (a share of it) */
function waiting(root = document.body) {
  const px = document.documentElement.classList.contains("pixel");
  let n = 0,
    area = 0;
  const sel = px
    ? 'img[src], svg[data-pxwait], [style*="url("]'
    : 'img[src], [style*="url("]';
  for (const e of [
    ...(root.matches && root.matches(sel) ? [root] : []), // (root itself too: a drawing waited for)
    ...root.querySelectorAll(sel),
  ]) {
    /* the cheap tests first: this runs every frame while a part of the page waits (shownSoon), over every picture in it */
    if (e.tagName === "IMG") {
      if (
        e.complete && // (one still downloading counts)
        !(
          px &&
          e.naturalWidth &&
          !e.matches(".px, [data-pxok]") &&
          !e.closest(NOT_MINE)
        ) // (and one whose pixels aren't made yet)
      )
        continue;
    } else if (e.tagName === "svg") {
      if (e.closest(NOT_MINE)) continue;
    } else if (sheetIn(e) || e.closest(".veil")) continue;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    n++;
    area += r.width * r.height;
  }
  if (root === document.body) n += pending.size;
  return { n, share: area / (innerWidth * innerHeight || 1) };
}
/* until every picture under root is in. One that never comes doesn't hold the game: nothing new for STUCK ms, or
   maxMs in all, and it goes on */
const STUCK = 8000; /* (counted from the last file that came in, arrived above: on a slow line the pictures wait behind other
   files, and that isn't stuck. The owner's, Nov 20 20:31Z: "even after the loading screen, the duck on the cloud and the
   click to play shit isnt finished loading": the loading screen went while the pictures were still on their way) */
export function picturesIn(root = document.body, maxMs = 90000, onLeft) {
  return new Promise((done) => {
    const t0 = performance.now();
    let least = Infinity,
      since = t0;
    const look = () => {
      const n = root.isConnected ? waiting(root).n : 0,
        t = performance.now();
      if (onLeft) onLeft(n); // (how many are still to come: Customize's green line, customize.js)
      if (!n || t - t0 > maxMs) return done();
      if (n < least) {
        least = n;
        since = t;
      } else if (t - Math.max(since, arrived) > STUCK) return done();
      setTimeout(look, 100);
    };
    requestAnimationFrame(() => requestAnimationFrame(look)); // (once the new pictures have been seen: pixel.js, pxdom.js)
  });
}
/* a part of the page put in for another, shown only once its pictures are in (each frame looked at; given up after
   maxMs), so nothing blinks out while it's redrawn (the owner's, Nov 20 20:46Z: Customize's big duck vanished while it
   was redrawn). roots: what to look at */
export function shownSoon(roots, maxMs = 3000) {
  const list = [].concat(roots);
  return new Promise((done) => {
    const t0 = performance.now();
    const look = () => {
      if (
        performance.now() - t0 > maxMs ||
        list.every((r) => !r.isConnected || !waiting(r).n)
      )
        return done();
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look); // (once the new drawings have been seen: pxdom.js marks them as they come)
  });
}
/* a screen or a window that has just come up (or changed): if its pictures aren't in, the loading screen until they
   are. Many pictures, or a big part of the screen, at once (Sandbox's map vote: they take a while); one picture only
   if it isn't in a moment later (what is made at once never brings it up). Pictures that matter: a small one alone (a
   duck by a chat line, an icon) never does in a window. A new screen (whole: router.js) looks at the whole page, and
   any picture at all counts (the owner's, Nov 20 20:31Z: "pop in images or textures or anything are everywhere") */
const BIG = 0.01, // (of the screen)
  MANY = 4,
  HUGE = 0.3;
const covering = new WeakSet();
export function coverPictures(root, { whole = false } = {}) {
  /* never in the middle of a game (the owner's, Nov 19 22:52Z: "in the game that's already playing, either it be the
     next turn or the next round or clicking an object, no loading is allowed"): only while a game loads */
  if (!root || covering.has(root) || document.body.dataset.screen === "game")
    return;
  const where = whole ? document.body : root;
  const now = () => {
    if (!root.isConnected || covering.has(root)) return null;
    const w = waiting(where);
    return (whole ? w.n : w.share >= BIG) ? w : null;
  };
  const cover = () => {
    covering.add(root);
    const done = holdLoading({ maxMs: 90000 }); // (a slow line: picturesIn says when it's stuck)
    picturesIn(where).then(() => {
      covering.delete(root);
      done();
    });
  };
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const w = now();
      if (!w) return;
      if (w.n >= MANY || w.share >= HUGE) return cover();
      setTimeout(() => now() && cover(), 150);
    }),
  );
}
/* a window or a screen that changes its own pages: each change covered as above */
export function coverChanges(root) {
  let raf = 0;
  const mo = new MutationObserver((recs) => {
    if (raf || !recs.some((r) => r.addedNodes.length)) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      coverPictures(root);
    });
  });
  mo.observe(root, { childList: true, subtree: true });
  coverPictures(root);
  return () => mo.disconnect();
}

/* the page is ready when the fonts are in, the pictures on the screen are in (above) and the frames come steadily again
   (three in a row under 70 ms), so a screen that takes long to build (a big map, Duck Cabin, a slow phone) keeps the
   loading screen up until it is drawn */
export const pageReady = () =>
  Promise.all([
    document.fonts ? document.fonts.ready : null,
    picturesIn(),
  ]).then(
    () =>
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
  );
/* the loading screen while something else is awaited (a room being created or joined, a window being built); done()
   takes it away (it shows for a moment at least, and goes on its own after maxMs) */
export function holdLoading({ ping, maxMs = 20000 } = {}) {
  let done;
  const p = new Promise((r) => (done = r));
  loadingScreen({ duck: profile.duck, ping, ready: () => p, max: maxMs });
  return () => pageReady().then(done);
}
