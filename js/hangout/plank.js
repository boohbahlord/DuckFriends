/* ---------- the plank from the red car's roof up to the pumps' roof (Downpour) ----------
   The owner's, Nov 21 09:52 ET: a wooden plank from a car's roof to the pumps' roof; Adam's brief 15:49Z: construction
   wood like a pallet, leaning from the red car's roof up to the canopy, walked as a slope by ducks and zombies. Its own
   file: stationart.js and shapes.js are at their size limit, and its drawing and its slope are made from the same
   numbers */
import { O, F, ln, wrap } from "./stationart.js";

const PINE = "#d9b27a", // (the slats' tops)
  PINE_DK = "#b08550", // (their edges and the grain)
  BEAM = "#8a6234", // (the runners under them)
  BEAM_DK = "#5f4122";

/* the plank in a box w wide (its run, west to east), d deep: its west end z1 up (on the canopy), its east end z0 up (on
   the car's roof), its last `rest` at each end lying on what holds it up. A pallet: three runners along its length,
   slats across them with gaps, two nails where each slat crosses a runner, and a soft shadow where each end rests. Drawn as the maps draw (x east, y south, a height lifts a point straight up the picture) */
function plankSVG({ w = 280, d = 70, z0 = 108, z1 = 153, rest = 26 }) {
  const H = z1 + 16, // (room over its high end)
    Z = (X) => z1 + ((z0 - z1) * X) / w,
    at = (X, Y, z) => [X, Y + H - z],
    pt = (X, Y, z) => at(X, Y, z).join(" "),
    quad = (a, b, c, e, fill, more = ln(2)) =>
      F`<path d="M${a}L${b}L${c}L${e}Z" fill="${fill}" ${more}/>`;
  let s = "";
  /* where it rests: a shadow on the canopy's roof and on the car's, just south of each end */
  for (const [a, b, z] of [
    [0, rest, z1],
    [w - rest, w, z0],
  ])
    s += quad(
      pt(a, 4, z),
      pt(b, 4, z),
      pt(b, d + 6, z),
      pt(a, d + 6, z),
      O,
      'opacity=".28"',
    );
  /* the runners: a beam along each side and one down the middle, under the slats */
  for (const Y of [6, d / 2, d - 6]) {
    const top = (X) => Z(X) - 4,
      bot = (X) => Z(X) - 16;
    s += quad(
      pt(0, Y, top(0)),
      pt(w, Y, top(w)),
      pt(w, Y, bot(w)),
      pt(0, Y, bot(0)),
      BEAM,
    );
    s += F`<path d="M${pt(6, Y, bot(6) + 4)}L${pt(w - 6, Y, bot(w - 6) + 4)}" ${ln(1.2, BEAM_DK)} fill="none"/>`;
  }
  /* the slats, west to east: each a board across the runners, its top and its south edge */
  for (let X = 2; X + 20 <= w; X += 24) {
    const a = Z(X),
      b = Z(X + 20);
    s += quad(
      pt(X, 0, a),
      pt(X + 20, 0, b),
      pt(X + 20, d, b),
      pt(X, d, a),
      PINE,
    );
    s += quad(
      pt(X, d, a),
      pt(X + 20, d, b),
      pt(X + 20, d, b - 4),
      pt(X, d, a - 4),
      PINE_DK,
    );
    s += F`<path d="M${pt(X + 7, 3, Z(X + 7))}L${pt(X + 8, d - 3, Z(X + 8))}" ${ln(1, PINE_DK)} fill="none" opacity=".7"/>`;
    for (const Y of [6, d / 2, d - 6])
      for (const dx of [5, 15]) {
        const [x, y] = at(X + dx, Y, Z(X + dx));
        s += F`<circle cx="${x}" cy="${y}" r="1.3" fill="${O}" opacity=".75"/>`;
      }
  }
  return wrap(w, d + H, s);
}
/* the plank prop's drawing (shapes.js): its numbers come in world px (stationmap.js PLANK), it's drawn at the plan's size
   and shown at K of it, as every Downpour thing is */
export const plankArt = (p, K) =>
  plankSVG({
    w: p.w / K,
    d: p.d / K,
    z0: p.z0 / K,
    z1: p.z1 / K,
    rest: p.rest / K,
  }).replace(
    /width="([\d.]+)" height="([\d.]+)"/,
    (m, w, h) =>
      `width="${+(w * K).toFixed(2)}" height="${+(h * K).toFixed(2)}"`,
  );
