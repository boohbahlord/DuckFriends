/* ---------- the colors an outfit or a hat draws that its player can't pick one by one ----------
   I want every color on an outfit or a hat to be changeable (the owner, Nov 21 00:43Z: "if there's colors on an item, I
   should be able to change it"), but an item has three color places (c1 to c3) at most. So each color written in its
   drawing goes through F: a color the item names in its `fixed` (a hex → the place it follows) is a shade of that
   place's color, the same shade it was drawn in (at the item's own colors it comes out exactly as written, so nothing
   looks different until a player picks), and any other color stays as written. A shade is a mix of the place's color
   and a fixed color, so it stays a palette swap for the part sheets (duckparts.js). */
import { METAL } from "./duck.js";

let cur = null; // (the item being drawn: { def, o } with o its colors now)
/* draw an item: its colors o, the item def ({ colors: [[place, name, default]…], fixed: { hex: place } }) */
export function drawing(def, o, make) {
  const was = cur;
  cur = { def, o };
  try {
    return bands(make(), o);
  } finally {
    cur = was;
  }
}
/* a metal place's color written straight into the drawing (not through F) comes out as the metal's middle tone
   (flatMetal): painted, filled or stroked, it gets the metal's bands too */
function bands(res, o) {
  const ms = Object.values(o).map(metalOf).filter(Boolean);
  if (!ms.length) return res;
  const swap = (s) =>
    typeof s === "string"
      ? ms.reduce(
          (t, m) =>
            t.replace(
              new RegExp(`(fill|stroke)="${METAL[m][2]}"`, "gi"),
              `$1="url(#mt-${m})"`,
            ),
          s,
        )
      : s;
  return res && typeof res === "object"
    ? Object.fromEntries(Object.entries(res).map(([k, v]) => [k, swap(v)]))
    : swap(res);
}
const norm = (h) =>
  h.length === 4
    ? "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]
    : h.toLowerCase();
const hex2 = (n) => n.toString(16).padStart(2, "0");
const byte = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
// a color t of the way from a to b
const blend = (a, b, t) =>
  "#" +
  [0, 1, 2]
    .map((i) => hex2(Math.round((1 - t) * byte(a, i) + t * byte(b, i))))
    .join("");
/* the mix (of a place's color and a fixed color T, by t) that comes out as `to` when the place's color is `from`: the
   smallest t for which T is a real color, so the shade follows its place as closely as it can */
const seen = new Map();
function shade(from, to) {
  const key = from + to;
  if (seen.has(key)) return seen.get(key);
  let found = null;
  for (let t = 0.05; t < 0.995 && !found; t += 0.05) {
    const T = [0, 1, 2].map((i) =>
      Math.round((byte(to, i) - (1 - t) * byte(from, i)) / t),
    );
    if (T.some((v) => v < 0 || v > 255)) continue;
    const c = "#" + T.map(hex2).join("");
    if (blend(from, c, t) === to) found = [c, t];
  }
  if (!found) found = [to, 1];
  seen.set(key, found);
  return found;
}
/* a place in a metal ("m:gold", from Colors' Metallic list): its own color is the metal's bands (duck.js metalDefs
   draws them as "mt-gold"), its shades are shades of the metal's middle tone */
const metalOf = (v) =>
  typeof v === "string" && v.startsWith("m:") && METAL[v.slice(2)]
    ? v.slice(2)
    : null;
/* an item's colors for its own drawing code: a metal place as the metal's middle tone (F gives the bands) */
export const flatMetal = (o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k,
      metalOf(v) ? METAL[metalOf(v)][2] : v,
    ]),
  );
export function F(hex) {
  if (!cur) return hex;
  const h = norm(hex),
    place = cur.def.fixed && cur.def.fixed[h];
  if (!place) return hex;
  const from = norm(cur.def.colors.find(([k]) => k === place)[2]),
    m = metalOf(cur.o[place]),
    now = m ? METAL[m][2] : cur.o[place];
  if (!now || (!m && norm(now) === from)) return hex;
  if (from === h) return m ? `url(#mt-${m})` : now;
  const [c, t] = shade(from, h);
  return t >= 1 ? hex : blend(now, c, t);
}
