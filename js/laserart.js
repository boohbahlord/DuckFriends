/* ---------- the laser gun, drawn (the owner's idea, Nov 17) ----------
   Drawn as the other guns are (l4ddguns.js): simple shapes with a dark outline, side on, pointing right with the grip at
   the left, a soft white shine along the top. Its barrel heats up from its end back: from the dark metal to red, then
   orange, then a bright orange once it's overheated. LASER(heat 0 … 1, over: overheated) → svg; LASER.tip: where the
   beam comes out, in its viewBox. Preview:
   tools/laser-art.html */
const INK = "#2a2d38";
const M1 = "#33384a",
  M2 = "#454b5e",
  M0 = "#2a2e3c",
  POLY = "#1f2230",
  RED = "#e0262f",
  COPPER = "#c9733a";
const shine = (d, o = 0.28, w = 0.8) =>
  `<path d="${d}" stroke="#fff" stroke-width="${w}" opacity="${o}" fill="none" stroke-linecap="round"/>`;
const box = (x, y, w, h, r, fill, sw = 1.1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const part = (d, fill, sw = 1.1) =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;

/* the hot metal's color at heat h (0 … 1): the metal, then a dull red, red, orange; overheated, a bright orange */
const HOT = [
  [0, [69, 75, 94]],
  [0.35, [140, 40, 36]],
  [0.7, [226, 70, 30]],
  [1, [255, 140, 40]],
];
export function hotColor(h, over = false) {
  if (over) return "#ffa53a";
  h = Math.max(0, Math.min(1, h));
  let i = 1;
  while (i < HOT.length - 1 && HOT[i][0] < h) i++;
  const [a, ca] = HOT[i - 1],
    [b, cb] = HOT[i],
    t = (h - a) / (b - a || 1);
  return (
    "#" +
    ca
      .map((v, k) =>
        Math.round(v + (cb[k] - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
/* the glow round a hot barrel's end: none when cool */
const tipGlow = (x, y, r, h, over) =>
  h > 0.3 || over
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${over ? "#ffb347" : "#ff5a2a"}" opacity="${(over ? 0.55 : 0.4 * h).toFixed(2)}"/>`
    : "";

/* the laser gun (the owner, Nov 17: "combine the heavy laser and the laser rifle"): the laser rifle's long dark body with
   its stock and the window showing three red cells, the heavy laser's battery under it with its red light, its thick
   barrel with cooling fins and a copper coil wound round it, and the wide lens at its end. As it heats up, the barrel
   warms from its end back: the end hottest, more and more of it glowing (the owner: "more of the barrel get hotter not
   just the tip"); each piece along it its own color, so it stays crisp in the pixel look */
const BAR = { x0: 44, x1: 74 }; // the barrel, from the body to the lens
/* how hot the barrel is at x, with the gun's heat h: the end most, the back about a third as much */
const hotAt = (x, h) => {
  const d = (BAR.x1 - x) / (BAR.x1 - BAR.x0);
  return Math.max(0, Math.min(1, h * (1.25 - 0.9 * d)));
};
function laserGun(h = 0, over = false) {
  const at = (x) => hotColor(hotAt(x, over ? 1 : h), over && x > BAR.x1 - 6),
    lit = h > 0.3 || over;
  /* the barrel in pieces, each its own heat */
  let barrel = "";
  for (let x = BAR.x0; x < 70; x += 4.4)
    barrel += `<rect x="${x}" y="8" width="4.6" height="5.4" fill="${at(x + 2.2)}"/>`;
  const fins = [46.4, 49.6, 52.8]
      .map((x) => box(x, 5.6, 2, 10.2, 0.6, at(x + 1), 0.8))
      .join(""),
    coil = [56.6, 59.2, 61.8, 64.4, 67]
      .map((x) => {
        const c =
          hotAt(x, over ? 1 : h) > 0.55
            ? hotColor(hotAt(x, over ? 1 : h))
            : COPPER;
        return `<path d="M${x} 6.6L${x + 2} 14.8" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M${x} 6.6L${x + 2} 14.8" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/>`;
      })
      .join("");
  return `<svg viewBox="0 0 80 28">${part("M2.4 7L18 8.6V14L5.6 18Q1.4 19.2 1.4 15.6V8.4Q1.4 6.9 2.4 7Z", POLY, 1.15)}<path d="M1.6 8.8V15.8" stroke="#0e0e14" stroke-width="2.2"/>${shine("M4.4 8.6L16 9.8", 0.25)}
${part("M19.6 13.6H24.4L22.8 22.6Q22.4 23.8 21 23.6L19 23.2Q17.8 22.9 18.2 21.6Z", POLY, 1.1)}
<path d="M24.2 14.4Q24 18.2 26.4 18.2H27.4" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="M25.6 14.2L26.2 16.4" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
${box(28, 14.6, 13.6, 7.6, 1.4, M0, 1.1)}<circle cx="38.4" cy="18.4" r="1.4" fill="${RED}" stroke="${INK}" stroke-width=".6"/><path d="M30.2 16.6V20.2M32.4 16.6V20.2" stroke="#fff" stroke-width=".6" opacity=".2"/>
${box(17.4, 4.6, 27.4, 10.4, 2, M1, 1.25)}${box(21, 6.8, 19.4, 4.4, 0.9, "#14161c", 0.9)}${[22.6, 28.6, 34.6].map((x) => `<rect x="${x}" y="7.9" width="4.4" height="2.2" rx=".9" fill="${RED}"/><rect x="${x + 0.5}" y="8.1" width="1.8" height=".6" rx=".3" fill="#fff" opacity=".55"/>`).join("")}${shine("M19.4 6H43", 0.3)}
${part("M27 4.6V2.4H37.6L39.4 4.6Z", M0, 1)}
<rect x="${BAR.x0}" y="8" width="26" height="5.4" rx="1" fill="${M2}"/>${barrel}<rect x="${BAR.x0}" y="8" width="26" height="5.4" rx="1" fill="none" stroke="${INK}" stroke-width="1"/>${shine("M45 9.2H69", 0.25, 0.6)}
${fins}${coil}
${part(`M69.6 5H73Q74.4 5 74.4 6.4V15Q74.4 16.4 73 16.4H69.6Z`, at(72), 1.1)}<ellipse cx="74.8" cy="10.7" rx="1.8" ry="4.4" fill="${lit ? "#ffe2a0" : "#ff7a7a"}" stroke="${INK}" stroke-width=".8"/>${tipGlow(75, 10.7, 5.6, h, over)}</svg>`;
}
laserGun.tip = [76.6, 10.7];

export const LASER = laserGun;
export const LOOKS = { laser: laserGun };

/* the beam: a red straight line with a glow, a little thicker than the chain gun's line, and a little longer on the
   screen (ms: in and out) */
export const BEAM = {
  color: "#ff2b2b",
  core: "#ff9c9c",
  glow: "#ff3b3b",
  ms: 240,
};
