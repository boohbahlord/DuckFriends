/* ---------- the frame-rate readout (owner 2026-11-15: "Yes to the measure idea") ----------
   A small box at the top left: frames a second, the average and the worst frame of the last second, how long each part of
   my game loop took (rules, scene, ducks), the long tasks (over 50 ms) and how many elements the page has. Hidden; it turns
   on with ?fps in the address, or the command line's `fps on` (kept out of help), and stays on on this device until
   `fps off`. Turned off, it costs nothing: the loop only calls now() when it's on. */
const KEY = "duckfriends-fps";
let on = false,
  box = null,
  frames = [],
  parts = {},
  longs = 0,
  last = 0,
  obs = null;

export const perfOn = () => on;
export const stamp = () => (on ? performance.now() : 0);

/* the time one part of the frame took, since its stamp() */
export function took(name, t0) {
  if (!on) return;
  const ms = performance.now() - t0;
  const p = parts[name] || (parts[name] = { sum: 0, max: 0, n: 0 });
  p.sum += ms;
  p.n++;
  if (ms > p.max) p.max = ms;
}

/* one whole frame, from the loop's own time */
export function frame(t) {
  if (!on) return;
  frames.push(t);
  if (t - last < 1000) return;
  last = t;
  paint(t);
}

function paint(t) {
  while (frames.length && frames[0] < t - 1000) frames.shift();
  const gaps = frames.slice(1).map((x, i) => x - frames[i]),
    avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0,
    worst = gaps.length ? Math.max(...gaps) : 0,
    rows = Object.entries(parts).map(
      ([k, p]) => `${k} ${(p.sum / p.n).toFixed(1)} / ${p.max.toFixed(1)} ms`,
    );
  box.textContent = [
    `${frames.length} fps`,
    `frame ${avg.toFixed(1)} avg / ${worst.toFixed(1)} worst ms`,
    ...rows,
    `long tasks ${longs}`,
    `${document.getElementsByTagName("*").length} elements`,
  ].join("\n");
  parts = {};
  longs = 0;
}

export function setPerf(want) {
  on = !!want;
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {}
  if (on && !box) {
    box = document.createElement("pre");
    box.className = "perf-box";
    box.setAttribute("aria-hidden", "true");
    document.body.append(box);
    try {
      obs = new PerformanceObserver((l) => (longs += l.getEntries().length));
      obs.observe({ type: "longtask", buffered: false });
    } catch {} // (Firefox has no long tasks: the count stays 0 there)
  }
  if (!on && box) {
    box.remove();
    box = null;
    if (obs) obs.disconnect();
    obs = null;
  }
  frames = [];
  parts = {};
  return on;
}

/* on at load with ?fps, or when it was left on */
let was = false;
try {
  was = localStorage.getItem(KEY) === "1";
} catch {}
if (
  typeof document !== "undefined" &&
  (/[?&]fps\b/.test(location.search) || was)
)
  setPerf(true); // (not in a test run outside a browser)
