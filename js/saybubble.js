/* ---------- a duck's speech bubble kept inside the board (game.js drawDucks) ----------
   Under the name tag at the board's top, slid in at its sides, and below the duck where the question's cloud or its
   writer sits over it. Its measures are read at the frame's start, before anything is written, and only when they can
   have changed (sayRead): read every quarter second for each talking duck, after the frame's writes, as they were,
   they made the page lay itself out again in the middle of the frame, 168 ms in 40 s of Agree or Disagree with three
   computers talking, the top cause of its long frames (A2, Nov 22) */
import { $ } from "./ui.js";

let seen = null, // the boxes: { g (the board's measure they're for), lay, br, over, at } (css px)
  talking = false;
/* the read: every talking duck's bubble size (once for each line), and the layer's and the board's boxes (once for each
   measure of the board) and what sits over it (a few times a second), only while someone talks */
export function sayRead(S, board, layer, geo, now) {
  talking = false;
  if (!layer._els) return;
  for (const d of layer._els.values()) {
    if (!d._saying) continue;
    talking = true;
    const sb = d._sb || (d._sb = d.querySelector(".gduck-say"));
    if (sb._m !== sb._n) {
      sb._m = sb._n;
      sb._w = sb.offsetWidth;
      sb._h = sb.offsetHeight;
    }
  }
  if (!talking) return;
  if (!seen || seen.g !== geo)
    seen = {
      g: geo,
      lay: layer.getBoundingClientRect(),
      br: ($(".cols", board) || board).getBoundingClientRect(),
      at: -1e9,
    };
  if (now - seen.at > 400) {
    seen.at = now;
    seen.over = [...S.querySelectorAll(".topover > *")].map((e) =>
      e.getBoundingClientRect(),
    );
  }
}
/* the write: duck d's bubble where it fits, for a duck at (left, top) of the layer, z up, size px. False when its
   measures aren't read yet (its first frame: placed on the next) */
export function sayPlace(d, at, z, size) {
  const sb = d._sb || (d._sb = d.querySelector(".gduck-say"));
  if (!talking || !seen || sb._m !== sb._n) return false;
  const { lay, br, over } = seen,
    bw = sb._w,
    bh = sb._h,
    cx = lay.left + at.left,
    feet = lay.top + at.top - z,
    top = feet - size * 1.08 - bh - 4, // (where the duck is going, not where its glide has got to)
    dx = Math.round(
      Math.max(
        br.left + 4 - (cx - bw / 2),
        Math.min(0, br.right - 4 - (cx + bw / 2)),
      ),
    ),
    l = cx + dx - bw / 2;
  let below = top < br.top; // (over the board's top, or over what sits on it: the question's cloud and its writer)
  for (const q of over)
    if (
      q.width &&
      q.left < l + bw &&
      q.right > l &&
      q.top < top + bh &&
      q.bottom > top
    )
      below = true;
  if (d._below !== below) {
    d._below = below;
    d.classList.toggle("say-below", below);
  }
  if (d._sdx !== dx) {
    d._sdx = dx;
    sb.style.setProperty("--say-dx", dx + "px");
  }
  return true;
}
