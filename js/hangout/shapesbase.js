/* ---------- Duck Cabin's props, drawn: the shared pieces ----------
   Moved out of shapes.js to keep that file small (a pure move; the owner's, Nov 22). */
import * as L from "./layout.js";

export const C = L.CABIN,
  T = 12,
  n1 = (v) => Math.round(v * 10) / 10;
export const hash = (s) => {
  let h = 7;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((h >>> 0) % 1000) / 1000;
};
export const part = (svg, l, t, w, h, key, o = {}) => ({
  svg,
  box: { l, t, w, h },
  key,
  ...o,
});
/* a pair from art.js (its box w × h) put with its box's left at l and its bottom at screen-world b; keys: the world y of
   each foot (back: null = flat, into the ground instead), or given */
export function pairParts(
  pr,
  l,
  b,
  w,
  h,
  { backKey, frontKey, s = 1, z = 0, fade = false, hit } = {},
) {
  const t = b - h * s,
    out = [];
  if (pr.backFoot != null || backKey != null)
    out.push(
      part(pr.back, l, t, w * s, h * s, backKey ?? t + pr.backFoot * s + z, {
        part: "back",
      }),
    );
  out.push(
    part(pr.front, l, t, w * s, h * s, frontKey ?? t + pr.frontFoot * s + z, {
      part: "front",
      fade,
      hit,
    }),
  );
  return out;
}
export const lit = (svg, glow = []) =>
  svg.replace(
    /<(circle|ellipse|path|rect)([^>]*?)fill="([^"]+)"/g,
    (m, tag, a, f) =>
      f.startsWith("url(")
        ? `<${tag} class="lit lit-glow"${a}fill="${f}"`
        : glow.includes(f)
          ? `<${tag} class="lit"${a}fill="${f}"`
          : m,
  );
export const still = (svg) =>
  svg.replace(/ class="hg-(?:flicker|twinkle|shimmer|smoke|spark)"/g, "");
export const calm = (svg) =>
  svg.replace(/<rect [^>]*class="hg-shimmer"[^>]*\/>/g, ""); // (the pool without its light on the water: DECOR moves that)
