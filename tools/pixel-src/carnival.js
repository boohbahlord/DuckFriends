/* ---------- Carnival Night's drawing (tools/pixel-maps.cjs and tools/pixel-files.cjs only: never loaded by the game,
   which shows its pixel files, js/pxm/carnival.js) ---------- */
import { rnd } from "../../js/art.js";

/* Carnival Night's world, 1600 × 900 (the map stretches it to cover the page from the bottom): a purple night with stars,
   string lights across the top, a Ferris wheel on the left, a striped big top on the right and the outlines of a roller
   coaster and a carousel between them. live: the parts that move get their classes (the wheel turns, its cars hang
   straight, the bulbs twinkle, the flag waves); otherwise a still picture */
let cnId = 0;
export function carnivalSVG(live = false) {
  const id = "cn" + ++cnId,
    r = rnd(77),
    B = ["#ff4f6d", "#ffd23f", "#5ce1ff", "#8bff6a", "#ff9a3c", "#c98bff"];
  let stars = "";
  for (let i = 0; i < 70; i++)
    stars += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 520).toFixed(0)}" r="${(0.8 + r() * 1.8).toFixed(1)}" fill="#fff" opacity="${(0.35 + r() * 0.6).toFixed(2)}"${live ? ` class="cn-star" style="animation-delay:-${(r() * 3).toFixed(1)}s"` : ""}/>`;
  /* string lights: three sagging wires with bulbs */
  let lights = "";
  [
    [-40, 30, 560, 120],
    [520, 40, 1120, 130],
    [1080, 20, 1640, 110],
  ].forEach(([x0, y0, x1, sag], k) => {
    const mx = (x0 + x1) / 2,
      my = y0 + sag,
      at = (t) => [
        (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1,
        (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y0,
      ];
    lights += `<path d="M${x0} ${y0}Q${mx} ${my} ${x1} ${y0}" stroke="#0c0618" stroke-width="2.5" fill="none"/>`;
    for (let i = 1; i < 14; i++) {
      const [x, y] = at(i / 14),
        c = B[(i + k) % B.length];
      lights += `<g${live ? ` class="cn-bulb" style="animation-delay:-${(((i * 7 + k * 3) % 10) * 0.26).toFixed(2)}s"` : ""}><circle cx="${x.toFixed(0)}" cy="${(y + 9).toFixed(0)}" r="16" fill="${c}" opacity=".22"/><circle cx="${x.toFixed(0)}" cy="${(y + 9).toFixed(0)}" r="6.5" fill="${c}"/></g>`;
    }
  });
  /* far rides: a roller coaster and a carousel, dark against the glow */
  const far = "#24113f";
  let coaster =
    "M560 760 C600 520 660 470 700 600 S780 760 830 560 S900 380 960 560 S1010 720 1050 760";
  let supports = "";
  for (let x = 590; x < 1040; x += 34)
    supports += `<path d="M${x} 760V${(560 + Math.sin(x / 40) * 60).toFixed(0)}" stroke="${far}" stroke-width="5"/>`;
  const carousel = `<g fill="${far}"><path d="M820 640 L900 590 L980 640 Z"/><rect x="836" y="640" width="128" height="10"/><rect x="842" y="650" width="6" height="70"/><rect x="897" y="650" width="6" height="70"/><rect x="952" y="650" width="6" height="70"/><rect x="826" y="718" width="148" height="16" rx="6"/><circle cx="900" cy="584" r="6"/></g>`;
  /* the Ferris wheel */
  const cx = 330,
    cy = 410,
    R = 270;
  let spokes = "",
    rim = "",
    cars = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      x = cx + Math.cos(a) * R,
      y = cy + Math.sin(a) * R;
    spokes += `<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#d9d2ff" stroke-width="5" opacity=".75"/>`;
    for (let k = 0; k < 3; k++) {
      const b = a + ((k / 3) * Math.PI) / 6;
      const bx = (cx + Math.cos(b) * R).toFixed(1),
        by = (cy + Math.sin(b) * R).toFixed(1);
      rim += live
        ? `<g transform="translate(${bx} ${by})"><g class="cn-car"><circle r="5" fill="${B[(i + k) % B.length]}"/></g></g>` // (carried round as the cars are: its pixels never turn, tools/pixel-maps.cjs)
        : `<circle cx="${bx}" cy="${by}" r="5" fill="${B[(i + k) % B.length]}"/>`;
    }
    const c = B[i % B.length];
    cars += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g${live ? ' class="cn-car"' : ""}><path d="M0 0V16" stroke="#d9d2ff" stroke-width="4"/><path d="M-24 16H24L19 44Q0 52-19 44Z" fill="${c}" stroke="#1c1c28" stroke-width="3"/><rect x="-22" y="16" width="44" height="7" fill="#fff" opacity=".35"/></g></g>`;
  }
  const wheel = `<g${live ? ' class="cn-wheel"' : ""}><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d9d2ff" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${R - 30}" fill="none" stroke="#d9d2ff" stroke-width="4" opacity=".6"/>${spokes}${rim}${cars}</g>`;
  const legs = `<path d="M${cx} ${cy}L${cx - 150} 770M${cx} ${cy}L${cx + 150} 770" stroke="#b7aee6" stroke-width="14" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="22" fill="#ffd23f" stroke="#1c1c28" stroke-width="4"/>`;
  /* the big top: red and white wedges for the roof, stripes for the wall, a flag on top */
  const tx = 1290,
    top = 360,
    eave = 560,
    base = 770,
    hw = 230;
  let roof = "",
    wall = "";
  for (let i = 0; i < 10; i++) {
    const x0 = tx - hw + (i * hw) / 5,
      x1 = x0 + hw / 5,
      c = i % 2 ? "#f4efe6" : "#e5262b";
    roof += `<path d="M${tx} ${top}L${x0} ${eave}Q${(x0 + x1) / 2} ${eave + 26} ${x1} ${eave}Z" fill="${c}"/>`;
    wall += `<rect x="${x0}" y="${eave}" width="${hw / 5 + 0.5}" height="${base - eave}" fill="${c}"/>`;
  }
  const tent = `<g>${wall}<path d="M${tx - 46} ${base}Q${tx} ${eave + 40} ${tx + 46} ${base}Z" fill="#2a0d1a"/><path d="M${tx - hw} ${eave}H${tx + hw}" stroke="#ffd23f" stroke-width="6"/>${roof}
    <path d="M${tx} ${top}V${top - 70}" stroke="#d9d2ff" stroke-width="5"/><path d="M${tx} ${top - 70}L${tx + 60} ${top - 56}L${tx} ${top - 42}Z" fill="#ffd23f"${live ? ' class="cn-flag"' : ""}/></g>`;
  let edge = "";
  for (let i = 0; i <= 10; i++)
    edge += `<circle cx="${tx - hw + (i * hw) / 5}" cy="${eave}" r="6" fill="${B[i % B.length]}"${live ? ` class="cn-bulb" style="animation-delay:-${(i * 0.31).toFixed(2)}s"` : ""}/>`;
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0722"/><stop offset=".55" stop-color="#2a1252"/><stop offset=".85" stop-color="#6a2a6e"/><stop offset="1" stop-color="#a8467a"/></linearGradient>
<radialGradient id="${id}glow" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#ffb35c" stop-opacity=".45"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="900" fill="url(#${id}sky)"/>${stars}<rect y="420" width="1600" height="480" fill="url(#${id}glow)"/>
<path d="${coaster}" stroke="${far}" stroke-width="12" fill="none"/>${supports}${carousel}
${legs}${wheel}${tent}${edge}
<rect y="760" width="1600" height="140" fill="#160a24"/><path d="M0 760H1600" stroke="#ffb35c" stroke-width="3" opacity=".35"/>${lights}</svg>`;
}
