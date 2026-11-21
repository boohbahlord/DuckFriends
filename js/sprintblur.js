/* the sprint's blurred border of my screen (css/app.css html.sprint-blur, the owner's, Nov 21 05:08Z: "the border of
   your screen that goes blurry, like how it is with the blood"), also the whole time I'm on an adrenaline shot or the
   Speed Boost (game.js drawFx asks for it every frame).
   A blur of what's behind it costs the graphics card about 40% of a crowded frame, whatever its size, radius or mask
   (tools/perf/frames.cjs, Nov 21), so it shows only where the game runs fast enough without it
   (gamedefaults.js SPRINT_BLUR_MIN_FPS): the frames are timed while it's off (and half a second after, as it fades),
   two seconds at a time; two of those in a row slower than that and it stays off until the next round or map. Timing
   it while it shows would only measure its own cost */
import { SPRINT_BLUR_MIN_FPS } from "./gamedefaults.js";
import { profile } from "./store.js";

const bk = {
  key: "",
  off: false,
  last: 0,
  n: 0,
  ms: 0,
  slow: 0,
  blurAt: -1e9,
  from: 0,
};

export function sprintBlur(s, pt, want) {
  const key = [
    s.options.map,
    s.startedAt,
    s.round,
    s.hang && s.hang.l4 && s.hang.l4.r,
  ].join();
  if (bk.key !== key)
    Object.assign(bk, {
      key,
      off: false,
      n: 0,
      ms: 0,
      slow: 0,
      from: pt + 3000,
    }); // (a round's or map's first seconds left out: they settle)
  const dt = pt - bk.last;
  bk.last = pt;
  if (want && !bk.off) bk.blurAt = pt;
  else if (pt > bk.from && pt - bk.blurAt > 500 && dt > 0 && dt < 250) {
    bk.n++;
    bk.ms += dt; // (a gap longer than that: the tab was away, not a slow frame)
    if (bk.ms >= 2000) {
      const st = profile.settings,
        cap = st.fpsCapOn !== false ? +st.fpsCap || 0 : 0, // (a frame cap set under it is my choice, not a slow device)
        slow =
          (1000 * bk.n) / bk.ms <
          Math.min(SPRINT_BLUR_MIN_FPS, cap ? cap * 0.9 : 1e9);
      bk.slow = slow ? bk.slow + 1 : 0;
      if (bk.slow >= 2) bk.off = true; // (two slow stretches in a row: one hitch isn't a slow device)
      bk.n = bk.ms = 0;
    }
  }
  document.documentElement.classList.toggle("sprint-blur", want && !bk.off);
}
