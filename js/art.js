/* ---------- pictures drawn in code ----------
   The game's symbol (three see-through columns: red, yellow, green), the multicolored letters, the game's art (a duck on a
   cloud with the title across it and the symbol at its top left), the front page's duck in a ball pit, and the page's
   Twister-like shapes. Nothing here is a file, so everything is sharp at any size and changes with the theme. */
import { duckSVG, DUCK_DEFAULT } from './duck.js';
import { HAT_TOP } from './hats.js';
import { esc } from './ui.js';
import { modeOf, modeSymbol } from './modes.js';

export const FRIDGE = ['#ef3b3b', '#ff8c2b', '#ffd23f', '#37d421', '#2fa4ff', '#9b5de5', '#ff7eb6'];
const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;   // the same "random" every time

/* the symbol */
export function symbolSVG(size = 32, title = 'Agree or Disagree') {
  return `<svg viewBox="0 0 30 24" width="${size}" height="${size * .8}" role="img" aria-label="${esc(title)}">
<rect x="1" y="1" width="8" height="22" rx="1.6" fill="#ED1C24" fill-opacity=".78" stroke="#a5121a" stroke-width="1"/>
<rect x="11" y="1" width="8" height="22" rx="1.6" fill="#FFF200" fill-opacity=".78" stroke="#b8ae00" stroke-width="1"/>
<rect x="21" y="1" width="8" height="22" rx="1.6" fill="#37D421" fill-opacity=".78" stroke="#23931a" stroke-width="1"/></svg>`;
}

/* a game mode's symbol */
export const gameSymbol = (mode, size = 32) => modeOf(mode).id === 'aod' ? symbolSVG(size) : modeSymbol(mode, size);

/* multicolored letters as HTML: each letter its own fridge-magnet color, a little tilt; on any font */
export function rainbowHTML(text, { font = '', fk = 1, seed = 7, from = 0 } = {}) {   // (from: the color to start on; fk: a player font's scale)
  const r = rnd(seed); let i = from;
  const parts = [...String(text)].map(ch => {
    if (ch === ' ') return '<span class="sp"> </span>';
    const c = FRIDGE[i++ % FRIDGE.length], t = ((r() - .5) * 10).toFixed(1);
    return `<span style="color:${c};transform:rotate(${t}deg)">${esc(ch)}</span>`;
  });
  return `<span class="rainbow"${font ? ` style="font-family:${esc(font)};--fk:${+fk || 1}"` : ''} aria-label="${esc(text)}">${parts.join('')}</span>`;
}

/* the same letters inside an SVG */
function rainbowTSpans(text, seed = 3) {
  const r = rnd(seed); let i = 0;
  return [...text].map(ch => ch === ' ' ? '<tspan> </tspan>'
    : `<tspan fill="${FRIDGE[i++ % FRIDGE.length]}" dy="${((r() - .5) * 6).toFixed(1)}">${esc(ch)}</tspan>`).join('');
}

const cloud = (cx, cy, s, fill = '#ffffff', shade = '#d8ecff') => {
  const puffs = [[-60, 6, 34], [-28, -16, 40], [12, -26, 46], [52, -10, 38], [78, 10, 28], [-82, 18, 22], [0, 12, 44], [40, 16, 36], [-40, 18, 34]];
  const c = (dy, f) => puffs.map(([x, y, r]) => `<circle cx="${cx + x * s}" cy="${cy + (y + dy) * s}" r="${r * s}" fill="${f}"/>`).join('');
  return `<g>${c(8, shade)}${c(0, fill)}</g>`;
};

/* Carnival Night's world, 1600 × 900 (the map stretches it to cover the page from the bottom): a purple night with stars,
   string lights across the top, a Ferris wheel on the left, a striped big top on the right and the outlines of a roller
   coaster and a carousel between them. live: the parts that move get their classes (the wheel turns, its cars hang
   straight, the bulbs twinkle, the flag waves); otherwise a still picture */
let cnId = 0;
export function carnivalSVG(live = false) {
  const id = 'cn' + (++cnId), r = rnd(77), B = ['#ff4f6d', '#ffd23f', '#5ce1ff', '#8bff6a', '#ff9a3c', '#c98bff'];
  let stars = '';
  for (let i = 0; i < 70; i++) stars += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 520).toFixed(0)}" r="${(.8 + r() * 1.8).toFixed(1)}" fill="#fff" opacity="${(.35 + r() * .6).toFixed(2)}"${live ? ` class="cn-star" style="animation-delay:-${(r() * 3).toFixed(1)}s"` : ''}/>`;
  /* string lights: three sagging wires with bulbs */
  let lights = '';
  [[-40, 30, 560, 120], [520, 40, 1120, 130], [1080, 20, 1640, 110]].forEach(([x0, y0, x1, sag], k) => {
    const mx = (x0 + x1) / 2, my = y0 + sag, at = t => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y0];
    lights += `<path d="M${x0} ${y0}Q${mx} ${my} ${x1} ${y0}" stroke="#0c0618" stroke-width="2.5" fill="none"/>`;
    for (let i = 1; i < 14; i++) { const [x, y] = at(i / 14), c = B[(i + k) % B.length]; lights += `<g${live ? ` class="cn-bulb" style="animation-delay:-${((i * 7 + k * 3) % 10 * .26).toFixed(2)}s"` : ''}><circle cx="${x.toFixed(0)}" cy="${(y + 9).toFixed(0)}" r="16" fill="${c}" opacity=".22"/><circle cx="${x.toFixed(0)}" cy="${(y + 9).toFixed(0)}" r="6.5" fill="${c}"/></g>`; }
  });
  /* far rides: a roller coaster and a carousel, dark against the glow */
  const far = '#24113f';
  let coaster = 'M560 760 C600 520 660 470 700 600 S780 760 830 560 S900 380 960 560 S1010 720 1050 760';
  let supports = ''; for (let x = 590; x < 1040; x += 34) supports += `<path d="M${x} 760V${(560 + Math.sin(x / 40) * 60).toFixed(0)}" stroke="${far}" stroke-width="5"/>`;
  const carousel = `<g fill="${far}"><path d="M820 640 L900 590 L980 640 Z"/><rect x="836" y="640" width="128" height="10"/><rect x="842" y="650" width="6" height="70"/><rect x="897" y="650" width="6" height="70"/><rect x="952" y="650" width="6" height="70"/><rect x="826" y="718" width="148" height="16" rx="6"/><circle cx="900" cy="584" r="6"/></g>`;
  /* the Ferris wheel */
  const cx = 330, cy = 410, R = 270;
  let spokes = '', rim = '', cars = '';
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    spokes += `<path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#d9d2ff" stroke-width="5" opacity=".75"/>`;
    for (let k = 0; k < 3; k++) { const b = a + k / 3 * Math.PI / 6; rim += `<circle cx="${(cx + Math.cos(b) * R).toFixed(1)}" cy="${(cy + Math.sin(b) * R).toFixed(1)}" r="5" fill="${B[(i + k) % B.length]}"/>`; }
    const c = B[i % B.length];
    cars += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g${live ? ' class="cn-car"' : ''}><path d="M0 0V16" stroke="#d9d2ff" stroke-width="4"/><path d="M-24 16H24L19 44Q0 52-19 44Z" fill="${c}" stroke="#1c1c28" stroke-width="3"/><rect x="-22" y="16" width="44" height="7" fill="#fff" opacity=".35"/></g></g>`;
  }
  const wheel = `<g${live ? ' class="cn-wheel"' : ''}><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d9d2ff" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${R - 30}" fill="none" stroke="#d9d2ff" stroke-width="4" opacity=".6"/>${spokes}${rim}${cars}</g>`;
  const legs = `<path d="M${cx} ${cy}L${cx - 150} 770M${cx} ${cy}L${cx + 150} 770" stroke="#b7aee6" stroke-width="14" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="22" fill="#ffd23f" stroke="#1c1c28" stroke-width="4"/>`;
  /* the big top: red and white wedges for the roof, stripes for the wall, a flag on top */
  const tx = 1290, top = 360, eave = 560, base = 770, hw = 230;
  let roof = '', wall = '';
  for (let i = 0; i < 10; i++) {
    const x0 = tx - hw + i * hw / 5, x1 = x0 + hw / 5, c = i % 2 ? '#f4efe6' : '#e5262b';
    roof += `<path d="M${tx} ${top}L${x0} ${eave}Q${(x0 + x1) / 2} ${eave + 26} ${x1} ${eave}Z" fill="${c}"/>`;
    wall += `<rect x="${x0}" y="${eave}" width="${hw / 5 + .5}" height="${base - eave}" fill="${c}"/>`;
  }
  const tent = `<g>${wall}<path d="M${tx - 46} ${base}Q${tx} ${eave + 40} ${tx + 46} ${base}Z" fill="#2a0d1a"/><path d="M${tx - hw} ${eave}H${tx + hw}" stroke="#ffd23f" stroke-width="6"/>${roof}
    <path d="M${tx} ${top}V${top - 70}" stroke="#d9d2ff" stroke-width="5"/><path d="M${tx} ${top - 70}L${tx + 60} ${top - 56}L${tx} ${top - 42}Z" fill="#ffd23f"${live ? ' class="cn-flag"' : ''}/></g>`;
  let edge = ''; for (let i = 0; i <= 10; i++) edge += `<circle cx="${tx - hw + i * hw / 5}" cy="${eave}" r="6" fill="${B[i % B.length]}"${live ? ` class="cn-bulb" style="animation-delay:-${(i * .31).toFixed(2)}s"` : ''}/>`;
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0722"/><stop offset=".55" stop-color="#2a1252"/><stop offset=".85" stop-color="#6a2a6e"/><stop offset="1" stop-color="#a8467a"/></linearGradient>
<radialGradient id="${id}glow" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#ffb35c" stop-opacity=".45"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="900" fill="url(#${id}sky)"/>${stars}<rect y="420" width="1600" height="480" fill="url(#${id}glow)"/>
<path d="${coaster}" stroke="${far}" stroke-width="12" fill="none"/>${supports}${carousel}
${legs}${wheel}${tent}${edge}
<rect y="760" width="1600" height="140" fill="#160a24"/><path d="M0 760H1600" stroke="#ffb35c" stroke-width="3" opacity=".35"/>${lights}</svg>`;
}

/* the game's art, which is also the lobby's picture of the chosen map (16 : 9): the map behind (The Board's columns, Sky's
   clouds and sun, Pixel's sunset, islands and forest), the duck sitting on a cloud, the title, the map's name, and the
   game's symbol at the top left */
/* the map's world behind the picture (no columns: the picture shows where the game is played) */
function artBackdrop(map) {
  if (map === 'rabbit') return '<image href="assets/maps/rabbit-hole.jpg" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>';
  if (map === 'stars') return '<image href="assets/maps/starry-night.jpg" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>';
  if (map === 'ec') return `<image href="assets/maps/ethers-crossroads.png" width="480" height="270" preserveAspectRatio="xMidYMid slice" style="image-rendering:pixelated"/>
<circle cx="268" cy="70" r="34" fill="#ffb347" opacity=".22"/><rect width="480" height="270" fill="url(#ecscan)" opacity=".5"/>
<defs><pattern id="ecscan" width="4" height="4" patternUnits="userSpaceOnUse"><rect y="3" width="4" height="1" fill="#000" opacity=".35"/></pattern></defs>`;
  if (map === 'sky') return `<defs><linearGradient id="artsky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ab8f5"/><stop offset="1" stop-color="#ffd6a8"/></linearGradient></defs>
<rect width="480" height="270" fill="url(#artsky2)"/><circle cx="392" cy="58" r="30" fill="#ffd84a"/><circle cx="392" cy="58" r="44" fill="#ffd84a" opacity=".25"/>
${cloud(90, 70, .5, '#ffffffdd', '#ffffff77')}${cloud(330, 150, .55, '#ffffffcc', '#ffffff66')}`;
  if (map === 'pixel') {
    const bands = ['#171a45', '#2b2a6b', '#5b3586', '#8a3f86', '#bb4f78', '#e2685e', '#f58e48', '#ffb44d'];
    const r = rnd(9); let px = bands.map((c, i) => `<rect x="0" y="${i * 17}" width="480" height="18" fill="${c}"/>`).join('');
    px += '<rect x="356" y="118" width="40" height="40" fill="#ffdf6b"/><rect x="350" y="112" width="52" height="52" fill="#ffdf6b" opacity=".3"/>';
    const isle = (x, y, b, w) => {
      let g = '';
      for (let k = 0; k < w; k++) g += `<rect x="${x + k * b}" y="${y}" width="${b}" height="${b}" fill="#5fa83a"/><rect x="${x + k * b}" y="${y + b}" width="${b}" height="${b * 2}" fill="#8a5a33"/>`;
      for (let row = 3, lo = 1, hi = w - 1; hi > lo; row++, lo++, hi--) for (let k = lo; k < hi; k++) g += `<rect x="${x + k * b}" y="${y + row * b}" width="${b}" height="${b}" fill="${(k + row) % 3 ? '#808080' : '#6a6a6a'}"/>`;
      return g + `<rect x="${x + 2 * b}" y="${y - 3 * b}" width="${b}" height="${b * 3}" fill="#6b4a2a"/><rect x="${x + b}" y="${y - 6 * b}" width="${b * 3}" height="${b * 3}" fill="#3f8f2f"/>`;
    };
    px += isle(60, 60, 8, 8) + isle(250, 40, 6, 7);
    for (let y = 136, b = 6; y < 270; y += b, b = Math.min(18, b + 2)) for (let x = 0; x < 480; x += b) px += `<rect x="${x}" y="${y}" width="${b}" height="${b}" fill="${['#2a5e22', '#2f6b26', '#3b7f2c', '#4a9433'][Math.floor(r() * 4)]}"/>`;
    return `<g shape-rendering="crispEdges">${px}</g>`;
  }
  if (map === 'carnival') return carnivalSVG().replace('<svg ', '<svg width="480" height="270" ');
  if (map === 'cabin') {   // Duck Cabin at night: the moon, pines, the cabin with its warm windows, string lights on the deck
    const r = rnd(5), stars = Array.from({ length: 40 }, () => `<circle cx="${(r() * 480).toFixed(0)}" cy="${(r() * 120).toFixed(0)}" r="${(.6 + r() * 1.2).toFixed(1)}" fill="#fff" opacity="${(.4 + r() * .5).toFixed(2)}"/>`).join('');
    const pine = (x, y, k) => `<path d="M${x} ${y - 70 * k}L${x + 22 * k} ${y - 28 * k}H${x + 12 * k}L${x + 30 * k} ${y}H${x - 30 * k}L${x - 12 * k} ${y - 28 * k}H${x - 22 * k}Z" fill="#14301f" stroke="#0a1a10" stroke-width="2"/>`;
    return `<defs><linearGradient id="artcabin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#22305e"/></linearGradient></defs>
<rect width="480" height="270" fill="url(#artcabin)"/>${stars}<circle cx="70" cy="52" r="22" fill="#fff4cf"/><circle cx="70" cy="52" r="36" fill="#fff4cf" opacity=".15"/>
<rect y="196" width="480" height="74" fill="#1e3b2b"/>${pine(30, 210, 1.2)}${pine(450, 214, 1.3)}${pine(400, 205, .9)}${pine(96, 206, .8)}
<path d="M300 196V130L360 92L420 130V196Z" fill="#8a4a20" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/><path d="M290 134L360 84L430 134" fill="none" stroke="#5a2f14" stroke-width="10" stroke-linecap="round"/>
<rect x="318" y="146" width="24" height="20" rx="3" fill="#ffc861" stroke="#1c1c28" stroke-width="2.5"/><rect x="380" y="146" width="24" height="20" rx="3" fill="#ffc861" stroke="#1c1c28" stroke-width="2.5"/><rect x="350" y="160" width="20" height="36" rx="3" fill="#5a2f14" stroke="#1c1c28" stroke-width="2.5"/>
<ellipse cx="330" cy="200" rx="60" ry="10" fill="#ffc861" opacity=".18"/>
<path d="M290 182Q330 194 360 182T430 182" fill="none" stroke="#1c1c28" stroke-width="1.5"/>${[300, 315, 330, 345, 375, 390, 405, 420].map((x, i) => `<circle cx="${x}" cy="${(185 + Math.sin(i * 1.3) * 3).toFixed(1)}" r="3" fill="${['#ffd23f', '#ff6b6b', '#5ce1ff', '#7dff7a'][i % 4]}"/>`).join('')}`;
  }
  return backdropSVG(480, 270, true).replace('<svg ', '<svg width="480" height="270" ');   // Night Show
}
export function gameArtSVG({ width = 480, duck = DUCK_DEFAULT, map = 'board', mapLabel = '', mode = 'aod' } = {}) {
  const top = duck && duck.hat && !duck.image ? HAT_TOP : 0, title = modeOf(mode).name;   // room for a hat
  return `<svg class="art" viewBox="0 0 480 270" width="${width}" height="${width * 9 / 16}" role="img" aria-label="${esc(title)}${mapLabel ? ': ' + esc(mapLabel) : ''}">
<defs><clipPath id="artclip"><rect width="480" height="270" rx="18"/></clipPath><linearGradient id="artshade" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
<g clip-path="url(#artclip)">${artBackdrop(map)}</g>
${cloud(250, 200, 1.05)}
<g transform="translate(176 ${(66 - 150 * top / 120).toFixed(1)})"><svg width="150" height="${(150 * (120 + top) / 120).toFixed(1)}" viewBox="0 ${-top} 120 ${120 + top}">${duckSVG(duck, { size: 120, shadow: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g>
<text x="240" y="252" text-anchor="middle" font-family="'Lilita One', 'Fredoka', sans-serif" font-size="44" stroke="#1c1c28" stroke-width="5" stroke-linejoin="round" paint-order="stroke fill">${rainbowTSpans(title)}</text>
<g transform="translate(14 12)"><rect x="-4" y="-4" width="46" height="38" rx="8" fill="#ffffffd0" stroke="#1c1c28" stroke-width="2"/>${gameSymbol(mode, 38).replace('<svg ', '<svg x="0" y="0" ')}</g>
${mapLabel ? `<g transform="translate(466 14)"><rect x="${-(mapLabel.length * 9.4 + 18)}" y="0" width="${mapLabel.length * 9.4 + 18}" height="28" rx="14" fill="#1c1c28d0"/><text x="${-(mapLabel.length * 9.4 + 18) / 2}" y="19.5" text-anchor="middle" font-family="'Fredoka', sans-serif" font-weight="600" font-size="16" fill="#fff">${esc(mapLabel)}</text></g>` : ''}
</svg>`;
}

/* the front page's ball pit: rows of glossy balls across the whole bottom of the page; the back rows go behind the duck,
   the front rows in front of it, so the duck sits in the pit */
export function pitSVG(part = 'front') {
  const r = rnd(part === 'front' ? 42 : 7), out = [], W = 1600;
  const rows = part === 'front' ? [[120, 30], [165, 33], [212, 36], [262, 38]] : [[70, 26], [96, 28]];
  for (const [y, s0] of rows) {
    const s = s0, step = s * 1.75, n = Math.ceil(W / step) + 2, off = (r() - .5) * step;
    for (let i = -1; i < n; i++) {
      const x = i * step + off + (r() - .5) * s * .5, yy = y + (r() - .5) * s * .4, rr = s * (.92 + r() * .16);
      const c = FRIDGE[Math.floor(r() * FRIDGE.length)];
      out.push(`<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${c}" stroke="#1c1c28" stroke-width="2.4"/>`
        + `<ellipse cx="${(x - rr * .35).toFixed(1)}" cy="${(yy - rr * .38).toFixed(1)}" rx="${(rr * .3).toFixed(1)}" ry="${(rr * .18).toFixed(1)}" fill="#fff" opacity=".6" transform="rotate(-30 ${(x - rr * .35).toFixed(1)} ${(yy - rr * .38).toFixed(1)})"/>`);
    }
  }
  return `<svg class="pit-${part}" viewBox="0 0 ${W} 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${part === 'front' ? '<rect x="0" y="190" width="1600" height="200" fill="#1c1c28" opacity=".12"/>' : ''}${out.join('')}</svg>`;
}
export const heroDuckSVG = () => duckSVG(DUCK_DEFAULT, { size: 300, shadow: false, title: 'A rubber duck in a ball pit' });

/* the page's background: a little indoor carnival. Twister dots across the whole floor in perspective, breathing like
   lights, bunting (and, in the dark, glowing string lights) across the top, and a few ball-pit balls and bits of confetti
   drifting. Drawn to the window's size; redrawn when it changes or the theme does.
   backdropParts draws the pieces; backdropSVG puts them in one still picture (the small previews); backdropHTML lays
   them out as layers for the page and the Night Show map: the still part as one picture, the dots and the bulbs as a
   picture each that fades in and out, and each ball or confetti as its own small picture that drifts. Fading or moving a whole picture is cheap for the browser; redrawing a big animated drawing every frame
   is not (it made scrolling lag). */
function backdropParts(w, h, dark) {
  const r = rnd(77), base = [], dots = [[], [], [], []], bulbs = [[], []], shapes = [], cols = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421'];
  const hz = h * .46, K = (h - hz) * 1.05, K2 = w * .16;
  /* the floor: Twister dots in rows to the horizon and out past both edges */
  base.push(`<rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#bdfloor)"/>`);
  const px = (x, z) => w / 2 + x * K2 / z, py = z => hz + K / z;
  for (let z = .95; z < 9; z *= 1.24) {
    const rx = .42 * K2 / z, ry = rx * .42, y = py(z); if (y > h + ry) continue;
    for (let X = -60; X <= 60; X++) {
      const x = px(X + .5, z); if (x < -rx * 1.8 || x > w + rx * 1.8) continue;
      const c = ((X % 4) + 4) % 4;
      dots[c].push(dark ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * 1.7).toFixed(1)}" ry="${(ry * 1.9).toFixed(1)}" fill="url(#bdg${c})"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`
        : `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`);
    }
  }
  /* bunting along two sagging strings; bulbs between the flags glow in the dark */
  const string = (y1, y2, sag, n, k) => {
    const pt = t => [-30 + (w + 60) * t, y1 + (y2 - y1) * t + sag * 4 * t * (1 - t)];
    const pts = Array.from({ length: n + 1 }, (_, i) => pt(i / n));
    let g = `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')}" stroke="${dark ? '#8a8fb5' : '#5d6072'}" stroke-width="1.5" fill="none" opacity=".6"/>`;
    for (let i = 0; i < n; i++) {
      const [x, y] = pt((i + .5) / n), c = ['#ef3b3b', '#ffd23f', '#2fa4ff', '#37d421', '#9b5de5', '#ff8c2b'][(i + k) % 6], f = 15 + r() * 6;
      g += `<path d="M${(x - f * .7).toFixed(1)} ${(y - 2).toFixed(1)}L${(x + f * .7).toFixed(1)} ${(y - 2).toFixed(1)}L${x.toFixed(1)} ${(y + f * 1.25).toFixed(1)}Z" fill="${c}" opacity="${dark ? .55 : .8}"/>`;
      if (dark) { const [bx, by] = pt((i + 1) / n); r(); bulbs[(i + k) % 2].push(`<circle cx="${bx.toFixed(1)}" cy="${(by + 3).toFixed(1)}" r="3.6" fill="${['#ffe9a8', '#ffd0f0', '#c6f0ff'][(i + k) % 3]}"/>`); }
    }
    return g;
  };
  const n = Math.max(8, Math.round(w / 90));
  base.push(`<g${dark ? ' filter="url(#bdglow)"' : ''}>${string(h * .03, h * .08, h * .09, n, 0)}${string(h * .13, h * .06, h * .1, n + 1, 3)}</g>`);
  /* drifting ball-pit balls and confetti, with white space between them */
  const placed = [];
  for (let k = 0, tries = 0; k < Math.round(Math.max(6, w * h / 160000)) && tries < 400; tries++) {
    const s = 12 + r() * 20, x = r() * w, y = h * .18 + r() * h * .55;
    if (placed.some(p => Math.hypot(p[0] - x, p[1] - y) < (p[2] + s) * 3)) continue;
    placed.push([x, y, s]); k++;
    const c = cols[k % 4], vars = `--d:${(12 + r() * 10).toFixed(1)}s;--dl:-${(r() * 10).toFixed(1)}s;--dx:${((r() - .5) * 26).toFixed(0)}px;--dy:${((r() - .5) * 30).toFixed(0)}px;--dr:${((r() - .5) * 30).toFixed(0)}deg`;
    const inner = k % 3
      ? `<circle r="${s.toFixed(1)}" fill="${c}" opacity="${dark ? .5 : .55}"/><ellipse cx="${(-s * .35).toFixed(1)}" cy="${(-s * .38).toFixed(1)}" rx="${(s * .32).toFixed(1)}" ry="${(s * .2).toFixed(1)}" fill="#fff" opacity=".55" transform="rotate(-30 ${(-s * .35).toFixed(1)} ${(-s * .38).toFixed(1)})"/>`
      : `<g transform="rotate(${(r() * 360).toFixed(0)})"><rect x="${-s * .5}" y="${-s * .2}" width="${s}" height="${s * .4}" rx="2" fill="${c}" opacity="${dark ? .5 : .6}"/></g>`;
    shapes.push({ x, y, s, inner, vars });
  }
  const defs = `<defs>
<linearGradient id="bdsky" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#101225"/><stop offset=".46" stop-color="#1f1640"/>' : '<stop offset="0" stop-color="#e3f4ff"/><stop offset=".46" stop-color="#fff7fb"/>'}</linearGradient>
<linearGradient id="bdfloor" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#191a33"/><stop offset="1" stop-color="#0d0e1c"/>' : '<stop offset="0" stop-color="#f4f1ff"/><stop offset="1" stop-color="#e8f3ff"/>'}</linearGradient>
${cols.map((c, k) => `<radialGradient id="bdg${k}"><stop offset=".35" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
<filter id="bdglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
  return { w, h, defs, base, dots, bulbs, shapes };
}
/* a drawing of some parts; y0, y1: only that band of the page (the fading layers stay small: the floor, the lights) */
const svgOf = (P, body, sky = false, y0 = 0, y1 = P.h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${y0.toFixed(1)} ${P.w} ${(y1 - y0).toFixed(1)}" width="${P.w}" height="${(y1 - y0).toFixed(0)}" preserveAspectRatio="none" aria-hidden="true">${P.defs}${sky ? `<rect width="${P.w}" height="${P.h}" fill="url(#bdsky)"/>` : ''}${body}</svg>`;
/* the whole backdrop as one still drawing */
export function backdropSVG(w = innerWidth, h = innerHeight, dark = false) {
  const P = backdropParts(w, h, dark);
  return svgOf(P, P.base[0] + P.dots.map(d => `<g opacity=".5">${d.join('')}</g>`).join('') + P.base.slice(1).join('') + P.bulbs.flat().join('')
    + P.shapes.map(x => `<g transform="translate(${x.x.toFixed(0)} ${x.y.toFixed(0)})">${x.inner}</g>`).join(''), true).replace(' xmlns="http://www.w3.org/2000/svg"', '');
}
/* the backdrop as layers that animate cheaply (see above) */
export function backdropHTML(w = innerWidth, h = innerHeight, dark = false) {
  const P = backdropParts(w, h, dark), img = (svg, cls = '', style = '') => `<img class="bd-layer${cls ? ' ' + cls : ''}" alt="" draggable="false"${style ? ` style="${style}"` : ''} src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
  return img(svgOf(P, P.base[0], true))
    + img(svgOf(P, P.dots.flat().join(''), false, h * .44, h), 'bd-dots', 'top:44%;height:56%')
    + img(svgOf(P, P.base.slice(1).join('')))
    + (P.bulbs.flat().length ? img(svgOf(P, `<g filter="url(#bdglow)">${P.bulbs.flat().join('')}</g>`, false, 0, h * .3), 'bd-bulbs', 'height:30%') : '')
    + P.shapes.map(x => { const k = Math.ceil(x.s * 1.6); return `<div class="bd-sh" style="left:${(x.x / w * 100).toFixed(2)}%;top:${(x.y / h * 100).toFixed(2)}%;width:${k * 2}px;height:${k * 2}px;margin:-${k}px 0 0 -${k}px;${x.vars}"><svg viewBox="${-k} ${-k} ${k * 2} ${k * 2}" aria-hidden="true">${x.inner}</svg></div>`; }).join('');
}
