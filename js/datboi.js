/* ---------- here come dat boi ----------
   Not a duck: the frog on his unicycle, side-on and facing right like the ducks, in the same 120 × 120 box, his wheel
   on the ground at y ≈ 106. He is a rubber toy like them: soft shading, a darker edge, the small shadow under him.
   His ranks are metals (bronze, silver, chrome, gold, rose gold), and the last one is rainbow: every part of him and his
   unicycle runs through the colors at a steady pace (css: .datboi.rainbow). Hats and face items keep their own drawing:
   I move them from the duck's head onto his (HEAD_AT), smaller and tilted back with his head. */
import { mix, metalBands, METAL } from "./duck.js";

/* where a duck's head (76, 40, r 23) lands on his head: the center, how much smaller, the tilt */
export const HEAD_AT = { x: 63.9, y: 16.4, k: 0.75, tilt: -14 };
export const onHead = (svg) =>
  svg
    ? `<g transform="translate(${HEAD_AT.x} ${HEAD_AT.y}) rotate(${HEAD_AT.tilt}) scale(${HEAD_AT.k}) translate(-76 -40)">${svg}</g>`
    : "";

/* the rainbow rank starts from this red; the css spins its hue */
const RAINBOW = "#ff3b3b";
export const FROG = "#3fbf2f";
export const CYCLE = "#ff7a1a";

/* one of his parts, as a tube: an edge line under a fill line (a limb, the fork) */
const tube = (d, w, fill, edge) =>
  `<path d="${d}" stroke="${edge}" stroke-width="${w + 2.2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${fill}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

/* L: the look (frog and cycle: his colors; rank: bronze, silver, chrome, gold, rose or rainbow, or none); id: a unique id;
   dead: X eyes and the arm down */
export function datboiSVG(L, id, dead) {
  const rainbow = L.rank === "rainbow",
    M = !rainbow && L.rank && METAL[L.rank];
  const skin = rainbow ? RAINBOW : L.frog || FROG,
    bike = rainbow ? mix(RAINBOW, 0, 0.1) : L.cycle || CYCLE;
  /* the colors of his skin: light, mid, dark, edge (a metal takes its own) */
  const T = M
    ? { light: M[1], base: M[2], dark: M[5], edge: M[5], belly: M[0] }
    : {
        light: mix(skin, 255, 0.45),
        base: skin,
        dark: mix(skin, 0, 0.3),
        edge: mix(skin, 0, 0.5),
        belly: mix(mix(skin, 255, 0.45), 0, 0.02),
      };
  const B = M
    ? { base: M[2], edge: M[5], light: M[1] }
    : { base: bike, edge: mix(bike, 0, 0.45), light: mix(bike, 255, 0.4) };
  const fillDef = (gid, cx, cy) =>
    M
      ? metalBands(gid, M)
      : `<radialGradient id="${gid}" cx="${cx}" cy="${cy}" r=".85"><stop offset="0" stop-color="${T.light}"/><stop offset=".5" stop-color="${T.base}"/><stop offset="1" stop-color="${T.dark}"/></radialGradient>`;
  const defs = `<defs>${fillDef(id + "fb", ".4", ".3")}${fillDef(id + "fh", ".45", ".3")}
<radialGradient id="${id}fy" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="${mix(T.belly, 255, 0.4)}"/><stop offset="1" stop-color="${T.belly}"/></radialGradient></defs>`;
  const S = `url(#${id}fb)`;

  /* the unicycle: a black tire, a grey rim with spokes, an orange fork up to a black seat, the cranks and pedals */
  const W = { x: 52, y: 86, r: 19 };
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `M${W.x} ${W.y}L${(W.x + 15 * Math.cos(a)).toFixed(1)} ${(W.y + 15 * Math.sin(a)).toFixed(1)}`;
  }).join("");
  const wheel = `<circle cx="${W.x}" cy="${W.y}" r="${W.r - 2.6}" fill="none" stroke="#1b1b20" stroke-width="5.4"/>
<circle cx="${W.x}" cy="${W.y}" r="${W.r - 2.6}" fill="none" stroke="#3a3a44" stroke-width="1" opacity=".8" stroke-dasharray="2 2.4"/>
<circle cx="${W.x}" cy="${W.y}" r="15.4" fill="none" stroke="#b9bec7" stroke-width="1.4"/>
<path d="${spokes}" stroke="#d5d9e0" stroke-width=".7"/>`;
  const fork = `${tube(`M${W.x} ${W.y}L55.4 60`, 3.4, B.base, B.edge)}<path d="M${W.x + 0.9} ${W.y - 4}L55.6 62" stroke="${B.light}" stroke-width="1" opacity=".7" stroke-linecap="round"/>
<circle cx="${W.x}" cy="${W.y}" r="3" fill="${B.base}" stroke="${B.edge}" stroke-width="1"/>`;
  const seat = `<path d="M44.6 57.4Q49 52.6 57 53.4Q66 54.2 67.4 57.6Q63 60.4 55 60Q47.6 59.8 44.6 57.4Z" fill="#26262e" stroke="#0e0e12" stroke-width="1" stroke-linejoin="round"/><path d="M48 55.6Q55 54 63 55.6" stroke="#fff" stroke-width="1" opacity=".18" fill="none" stroke-linecap="round"/>`;
  /* the cranks: the near one forward and down, the far one back and up */
  const near = { x: 62, y: 93 },
    far = { x: 42, y: 79 };
  const crank = (p, dim) =>
    `<path d="M${W.x} ${W.y}L${p.x} ${p.y}" stroke="${dim ? mix(B.edge, 0, 0.2) : "#8d939c"}" stroke-width="2.2" stroke-linecap="round"/><rect x="${p.x - 4}" y="${p.y - 1.4}" width="8" height="2.8" rx="1" fill="#22222a"/>`;

  /* the frog: a tall pear of a body sitting up on the seat, his belly lighter; his head tipped back, his big eye on top */
  const body = `<path d="M44 55C38.6 45 40.6 32 49.4 26.4C56 22 67 22.6 71.6 29C76 36.6 73 48 66.6 56C60 59.4 49.6 59.4 44 55Z" fill="${S}" stroke="${T.edge}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M60 30.6C67 32 70 40 66.6 51C63 55.6 57.4 56 55 52C54 44 55 35 60 30.6Z" fill="url(#${id}fy)" opacity=".95"/>
<path d="M48 34Q47 44 50 52" stroke="${T.light}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`;
  const head = `<path d="M52 22C51 14 57 8.6 65 9.4C72 10 79 10.6 83.4 14.4C85 17 82.6 20.6 78 23C72 26 63 28 57 27C54 26.4 52.4 24.6 52 22Z" fill="url(#${id}fh)" stroke="${T.edge}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M60 23.6Q71 23.4 82.4 16.6" stroke="${T.edge}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<circle cx="79.6" cy="12.2" r=".9" fill="${T.edge}"/>`;
  const eye = dead
    ? `<circle cx="69" cy="10.4" r="5.8" fill="url(#${id}fh)" stroke="${T.edge}" stroke-width="1.4"/><path d="M66.4 7.8L71.6 13M71.6 7.8L66.4 13" stroke="#1b1b1b" stroke-width="1.6" stroke-linecap="round"/>`
    : `<circle cx="69" cy="10.4" r="5.8" fill="url(#${id}fh)" stroke="${T.edge}" stroke-width="1.4"/><circle cx="70" cy="10" r="3.7" fill="#141414"/><circle cx="71.3" cy="8.7" r="1.25" fill="#fff"/>`;
  /* his arms: the near one thrown out ahead (here he comes), the far one back on the seat */
  const hand = (x, y, a) =>
    `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0L7 -2.6M0 0L7.6 .6M0 0L6.4 3.6" stroke="${T.edge}" stroke-width="3" stroke-linecap="round"/><path d="M0 0L7 -2.6M0 0L7.6 .6M0 0L6.4 3.6" stroke="${S}" stroke-width="1.6" stroke-linecap="round"/><circle cx="7" cy="-2.6" r="1.3" fill="${T.base}"/><circle cx="7.6" cy=".6" r="1.3" fill="${T.base}"/><circle cx="6.4" cy="3.6" r="1.3" fill="${T.base}"/></g>`;
  const armFar = `<g opacity=".92">${tube("M50 33Q43 42 46 52", 4.2, T.dark, mix(T.edge, 0, 0.2))}</g>`;
  const armNear = dead
    ? `${tube("M64 34Q70 44 74 52", 5.2, S, T.edge)}${hand(74, 52, 70)}`
    : `${tube("M63 33Q78 31 92 38.6", 5.2, S, T.edge)}${hand(92, 38.6, 18)}`;
  /* his legs: long frog legs, the knees up high, the long feet on the pedals */
  const foot = (x, y, dim) =>
    `<path d="M${x - 3.6} ${y - 2.2}Q${x + 4} ${y - 4} ${x + 11} ${y - 1}Q${x + 13} ${y + 0.4} ${x + 11.6} ${y + 1.8}Q${x + 3} ${y + 2.4} ${x - 3.6} ${y + 1.4}Z" fill="${dim ? T.dark : S}" stroke="${T.edge}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const legFar = `${tube(`M50 54L39.6 64L${far.x + 0.6} ${far.y - 2}`, 6.2, T.dark, mix(T.edge, 0, 0.2))}${foot(far.x, far.y - 2.4, true)}`;
  const legNear = `${tube(`M57 53.6Q70 56.6 73 63L${near.x + 0.4} ${near.y - 2}`, 7.2, S, T.edge)}${foot(near.x, near.y - 2.4)}`;

  /* back to front: the far leg and crank, the wheel and fork, the seat, the far arm, his body and head, the near leg
     and crank, the near arm */
  return `${defs}${crank(far, true)}${legFar}${wheel}${fork}${seat}${armFar}${body}${head}${eye}${crank(near)}${legNear}${armNear}`;
}
