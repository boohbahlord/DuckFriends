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
   them out as layers for the page and the Night Show map: the still part as one picture, each row of dots of one color
   and each set of bulbs as a small picture that fades in and out a little after the last (so the light rolls across the
   floor in diagonal waves), and each ball or confetti as its own small picture that drifts. Fading or moving a whole picture is cheap for the browser; redrawing a big animated drawing every frame
   is not (it made scrolling lag). */
function backdropParts(w, h, dark) {
  const r = rnd(77), base = [], dots = [], bulbs = [[], [], []], shapes = [], cols = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421'];
  const hz = h * .46, K = (h - hz) * 1.05, K2 = w * .16;
  /* the floor: Twister dots in rows to the horizon and out past both edges; each row and color breathes (glows up and
     fades) a little after the last, so the light rolls across the floor */
  base.push(`<rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#bdfloor)"/>`);
  const px = (x, z) => w / 2 + x * K2 / z, py = z => hz + K / z;
  for (let z = .95, row = 0; z < 9; z *= 1.24, row++) {
    const rx = .42 * K2 / z, ry = rx * .42, y = py(z); if (y > h + ry) continue;
    const groups = cols.map((_, c) => ({ dl: (row * .55 + c * 1.1) % 4.4, y0: Math.max(hz, y - ry * 2), y1: Math.min(h, y + ry * 2), items: [] }));
    for (let X = -60; X <= 60; X++) {
      const x = px(X + .5, z); if (x < -rx * 1.8 || x > w + rx * 1.8) continue;
      const c = ((X % 4) + 4) % 4;
      groups[c].items.push(dark ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * 1.7).toFixed(1)}" ry="${(ry * 1.9).toFixed(1)}" fill="url(#bdg${c})"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`
        : `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`);
    }
    dots.push(...groups.filter(g => g.items.length && g.y1 - g.y0 > 1));
  }
  /* bunting along two sagging strings; bulbs between the flags glow in the dark */
  const string = (y1, y2, sag, n, k) => {
    const pt = t => [-30 + (w + 60) * t, y1 + (y2 - y1) * t + sag * 4 * t * (1 - t)];
    const pts = Array.from({ length: n + 1 }, (_, i) => pt(i / n));
    let g = `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')}" stroke="${dark ? '#8a8fb5' : '#5d6072'}" stroke-width="1.5" fill="none" opacity=".6"/>`;
    for (let i = 0; i < n; i++) {
      const [x, y] = pt((i + .5) / n), c = ['#ef3b3b', '#ffd23f', '#2fa4ff', '#37d421', '#9b5de5', '#ff8c2b'][(i + k) % 6], f = 15 + r() * 6;
      g += `<path d="M${(x - f * .7).toFixed(1)} ${(y - 2).toFixed(1)}L${(x + f * .7).toFixed(1)} ${(y - 2).toFixed(1)}L${x.toFixed(1)} ${(y + f * 1.25).toFixed(1)}Z" fill="${c}" opacity="${dark ? .55 : .8}"/>`;
      if (dark) { const [bx, by] = pt((i + 1) / n); r(); bulbs[(i + k) % 3].push(`<circle cx="${bx.toFixed(1)}" cy="${(by + 3).toFixed(1)}" r="3.6" fill="${['#ffe9a8', '#ffd0f0', '#c6f0ff'][(i + k) % 3]}"/>`); }
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
  const room = playroomParts(w, h, dark);
  return { w, h, defs: defs.replace('</defs>', room.defs + '</defs>'), base, dots, bulbs, shapes, room };
}
/* the back wall of the carnival: a glowing indoor playground on each side (towers, a tube, a slide) wrapped in string
   lights, piles of wooden letter blocks whose letters change colors one after another, and in the middle a window with a
   waxing crescent moon and a tree outside. Drawn between the bunting and the floor; u is the wall's height.
   base: the still part; bulbs: four sets that light up in turn, so the light runs along the strings; letters[g][p]: the
   letters of block set g in color p (the four colors take turns, each set a little after the last) */
function playroomParts(w, h, dark) {
  const r = rnd(91), hz = h * .46, top = h * .2, u = hz - top, cx = w / 2;
  const PAL = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421', '#9b5de5', '#ff8c2b'], f = v => v.toFixed(1);
  const base = [], bulbs = [[], [], [], []], letters = [[], [], [], []].map(() => [[], [], [], []]);
  const glow = dark ? ' filter="url(#pgglow)"' : '';
  /* the window */
  const ww = Math.min(u * .78, w * .36), wh = u * .7, wx = cx - ww / 2, wy = hz - u * .14 - wh, ft = ww * .07;
  const mr = ww * .1, mx = wx + ww * .7, my = wy + wh * .3;
  let win = `<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="url(#pgsky)"/>`;
  for (let i = 0; i < 14; i++) win += `<circle cx="${f(wx + r() * ww)}" cy="${f(wy + r() * wh * .75)}" r="${f(.6 + r() * 1.1)}" fill="#fff" opacity="${(.4 + r() * .5).toFixed(2)}"/>`;
  win += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(mr * 2.4)}" fill="url(#pgmoonhalo)"/><path d="M${f(mx)} ${f(my - mr)}A${f(mr)} ${f(mr)} 0 1 1 ${f(mx)} ${f(my + mr)}A${f(mr * .62)} ${f(mr)} 0 1 0 ${f(mx)} ${f(my - mr)}Z" fill="#fff3c4" transform="rotate(-18 ${f(mx)} ${f(my)})"/>`;
  /* the tree outside: a trunk from the bottom left, a few branches and round clumps of leaves */
  const tx = wx + ww * .26, ty = wy + wh, tc = dark ? '#0a1420' : '#3b6b4a', tl = dark ? '#10241f' : '#5f9a5c';
  win += `<path d="M${f(tx - ww * .05)} ${f(ty)}C${f(tx - ww * .03)} ${f(ty - wh * .3)} ${f(tx - ww * .02)} ${f(ty - wh * .45)} ${f(tx + ww * .02)} ${f(ty - wh * .62)}L${f(tx + ww * .06)} ${f(ty - wh * .6)}C${f(tx + ww * .04)} ${f(ty - wh * .4)} ${f(tx + ww * .05)} ${f(ty - wh * .25)} ${f(tx + ww * .07)} ${f(ty)}Z" fill="${tc}"/>`
    + `<path d="M${f(tx)} ${f(ty - wh * .42)}L${f(tx + ww * .2)} ${f(ty - wh * .55)}M${f(tx)} ${f(ty - wh * .5)}L${f(tx - ww * .16)} ${f(ty - wh * .66)}" stroke="${tc}" stroke-width="${f(ww * .025)}" stroke-linecap="round"/>`;
  [[0, .7, .2], [-.15, .66, .14], [.17, .6, .15], [.06, .82, .15], [-.08, .86, .12], [.25, .74, .11], [-.2, .52, .11]].forEach(([dx, dy, rr]) => {
    win += `<circle cx="${f(tx + dx * ww)}" cy="${f(ty - dy * wh)}" r="${f(rr * ww)}" fill="${tl}"/><circle cx="${f(tx + dx * ww + rr * ww * .3)}" cy="${f(ty - dy * wh - rr * ww * .3)}" r="${f(rr * ww * .55)}" fill="${dark ? '#1d3d36' : '#7cb874'}" opacity=".7"/>`;
  });
  base.push(`<defs><clipPath id="pgwin"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}"/></clipPath></defs>`
    + (dark ? `<path d="M${f(wx)} ${f(wy + wh)}L${f(wx + ww)} ${f(wy + wh)}L${f(wx + ww * 1.6)} ${f(h * .62)}L${f(wx - ww * .35)} ${f(h * .62)}Z" fill="#9fc4ff" opacity=".07"/>` : '')
    + `<g clip-path="url(#pgwin)">${win}</g>`
    + `<g fill="none" stroke="${dark ? '#8a5a35' : '#c98a4b'}" stroke-width="${f(ft)}"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx="${f(ft * .4)}"/><path d="M${f(cx)} ${f(wy)}V${f(wy + wh)}M${f(wx)} ${f(wy + wh * .5)}H${f(wx + ww)}" stroke-width="${f(ft * .55)}"/></g>`
    + `<rect x="${f(wx - ft * 1.3)}" y="${f(wy + wh + ft * .3)}" width="${f(ww + ft * 2.6)}" height="${f(ft * .9)}" rx="${f(ft * .3)}" fill="${dark ? '#a06b3f' : '#dba06a'}"/>`);
  /* a playground on each side: side -1 grows from the left edge, 1 from the right */
  let bk = 0;
  const bulbAlong = (pts, gap) => {
    for (let i = 1, acc = 0, n = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
      for (; acc <= d; acc += gap, n++) { const t = acc / d, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        bk = (bk + 1) % 4; bulbs[bk].push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(1.6, u * .012))}" fill="${['#ffe9a8', '#ff9de2', '#9be8ff', '#b8ff9c'][(bk + n) % 4]}"/>`); }
      acc -= d;
    }
  };
  /* its size: as tall as the wall under the high ends of the bunting, as wide as the room beside the window and blocks
     allows; where that is narrow (a phone), only the first tower and its slide */
  const avail = (w - ww) / 2 - Math.min(u * .15, (w - ww) / 2 / 5.2) * 4.4, compact = avail < hz * .3 * 1.25;
  const sc = Math.max(u * .6, Math.min(hz - h * .11, compact ? (w - ww) / 2 / .8 : avail / 1.62));
  const ground = side => {
    const u = sc, X = dx => side < 0 ? dx * u : w - dx * u, P = (dx, dy) => [X(dx), hz - dy * u], pp = (...a) => a.map(([dx, dy]) => P(dx, dy).map(f).join(' ')).join('L');
    const [cPost, cDeck, cRoof, cRoof2, cTube, cSlide] = side < 0 ? [PAL[0], PAL[1], PAL[2], PAL[0], PAL[3], PAL[2]] : [PAL[1], PAL[4], PAL[3], PAL[1], PAL[4], PAL[0]];
    const sh = (d, c, extra = '') => `<path d="${d}" fill="${c}" fill-opacity="${dark ? .5 : .7}" stroke="${c}" stroke-width="${f(Math.max(1.5, u * .012))}" stroke-linejoin="round"${extra}/>`;
    const box = (x0, y0, x1, y1) => `M${pp([x0, y0], [x1, y0], [x1, y1], [x0, y1])}Z`;
    let g = '';
    /* tower A: a climbing wall under the deck, posts, rails and a striped roof */
    g += sh(box(.1, 0, .36, .4), cDeck);
    for (let i = 0; i < 7; i++) { const [hx, hy] = P(.14 + r() * .18, .05 + r() * .3); g += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(u * .018)}" fill="${PAL[(i + (side > 0 ? 2 : 0)) % 6]}"/>`; }
    g += sh(box(.07, 0, .1, .78), cPost) + sh(box(.36, 0, .39, .78), cPost) + sh(box(.04, .4, .42, .45), cDeck);
    g += `<path d="M${pp([.07, .58], [.39, .58])}M${pp([.07, .66], [.39, .66])}" stroke="${cPost}" stroke-width="${f(u * .014)}" opacity=".8"/>`;
    g += sh(`M${pp([.02, .76], [.44, .76], [.23, .96])}Z`, cRoof) + sh(`M${pp([.13, .76], [.23, .96], [.33, .76])}Z`, cRoof2);
    if (compact) {
      const sl = [[.39, .44], [.5, .36], [.62, .14], [.76, .03]], sl2 = sl.map(([a, b]) => [a, b + .08]).reverse();
      g += sh(`M${pp(...sl)}L${pp(...sl2)}Z`, cSlide);
      bulbAlong([P(.02, .76), P(.23, .96), P(.44, .76)], u * .055);
      bulbAlong(sl2.map(([a, b]) => P(a, b + .02)), u * .055);
      for (const px of [.085, .375]) bulbAlong(Array.from({ length: 7 }, (_, i) => P(px + (i % 2 ? .025 : -.025), i * .11)), u * .05);
      return g;
    }
    /* the tube across to tower B, with round windows */
    g += sh(`M${pp([.39, .45], [.75, .45], [.75, .61], [.39, .61])}Z`, cTube);
    for (let i = 0; i < 3; i++) { const [ox, oy] = P(.47 + i * .1, .53); g += `<circle cx="${f(ox)}" cy="${f(oy)}" r="${f(u * .035)}" fill="${dark ? '#0d0b22' : '#fff'}" opacity=".7" stroke="${cTube}" stroke-width="${f(u * .008)}"/>`; }
    /* tower B: posts, a deck, a round roof, and the slide down toward the window */
    g += sh(box(.75, 0, .78, .74), cPost) + sh(box(1.02, 0, 1.05, .74), cPost) + sh(box(.72, .4, 1.08, .45), cDeck);
    const [dcx, dcy] = P(.9, .72); g += sh(`M${pp([.7, .72])}A${f(u * .2)} ${f(u * .17)} 0 0 ${side < 0 ? 1 : 0} ${P(1.1, .72).map(f).join(' ')}Z`, cRoof);
    g += `<circle cx="${f(dcx)}" cy="${f(dcy - u * .17)}" r="${f(u * .025)}" fill="${cRoof2}"/>`;
    const sl = [[1.05, .44], [1.22, .36], [1.4, .14], [1.58, .03]], sl2 = sl.map(([a, b]) => [a, b + .08]).reverse();
    g += sh(`M${pp(...sl)}L${pp(...sl2)}Z`, cSlide);
    /* the lights wrapped around it all */
    bulbAlong([P(.02, .76), P(.23, .96), P(.44, .76)], u * .055);
    bulbAlong([P(.39, .62), P(.75, .62)], u * .055);
    bulbAlong([P(.7, .72), P(.76, .84), P(.9, .89), P(1.04, .84), P(1.1, .72)], u * .055);
    bulbAlong(sl2.map(([a, b]) => P(a, b + .02)), u * .055);
    for (const px of [.085, .375, .765, 1.035]) bulbAlong(Array.from({ length: 7 }, (_, i) => P(px + (i % 2 ? .025 : -.025), i * .11)), u * .05);
    return g;
  };
  /* the wall glows in the playground's colors */
  base.push(dark ? `<ellipse cx="${f(sc * .6)}" cy="${f(hz - sc * .45)}" rx="${f(sc * 1.1)}" ry="${f(sc * .6)}" fill="url(#pgwash0)"/><ellipse cx="${f(w - sc * .6)}" cy="${f(hz - sc * .45)}" rx="${f(sc * 1.1)}" ry="${f(sc * .6)}" fill="url(#pgwash1)"/>` : '');
  base.push(`<g${glow}>${ground(-1)}${ground(1)}</g>`);
  /* the letter blocks: a pile on each side of the window */
  const b = Math.min(u * .15, (w - ww) / 2 / 5.2), td = b * .2;
  const wood = dark ? ['#a8743f', '#c99257', '#7a5129', '#8d6034'] : ['#e0a865', '#f2c58a', '#b77d42', '#c98d52'];
  const piles = [{ x1: wx - ft * 1.6 - b * .3, rows: ['DUCK', 'FUN', 'GO'] }, { x0: wx + ww + ft * 1.6 + b * .3, rows: ['ABC', 'XY', 'Z'] }];
  let blocks = '', col = 0;
  piles.forEach((pl, k) => pl.rows.forEach((word, row) => {
    const n = word.length, x0 = pl.x0 !== undefined ? pl.x0 + row * b * .5 : pl.x1 - (piles[k].rows[0].length) * b + row * b * .5 - td;
    [...word].forEach((ch, i) => {
      const x = x0 + i * b + (r() - .5) * b * .08, y = hz + b * .25 - (row + 1) * b, rot = row ? (r() - .5) * 8 : (r() - .5) * 3;
      const T = ` transform="rotate(${rot.toFixed(1)} ${f(x + b / 2)} ${f(y + b)})"`;
      blocks += `<g${T}><path d="M${f(x)} ${f(y)}L${f(x + td)} ${f(y - td)}L${f(x + b + td)} ${f(y - td)}L${f(x + b)} ${f(y)}Z" fill="${wood[1]}"/><path d="M${f(x + b)} ${f(y)}L${f(x + b + td)} ${f(y - td)}L${f(x + b + td)} ${f(y + b - td)}L${f(x + b)} ${f(y + b)}Z" fill="${wood[2]}"/>`
        + `<rect x="${f(x)}" y="${f(y)}" width="${f(b)}" height="${f(b)}" fill="${wood[0]}"/><path d="M${f(x + b * .1)} ${f(y + b * .3)}h${f(b * .8)}M${f(x + b * .05)} ${f(y + b * .72)}h${f(b * .7)}" stroke="${wood[3]}" stroke-width="${f(b * .03)}" opacity=".6"/></g>`;
      const g = (col + row) % 4, c0 = (col * 5 + row * 2) % 6;
      for (let p = 0; p < 4; p++) {
        const c = PAL[(c0 + p) % 6];
        letters[g][p].push(`<g${T}><rect x="${f(x + b * .08)}" y="${f(y + b * .08)}" width="${f(b * .84)}" height="${f(b * .84)}" rx="${f(b * .06)}" fill="none" stroke="${c}" stroke-width="${f(b * .07)}"/><text x="${f(x + b / 2)}" y="${f(y + b * .76)}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${f(b * .66)}" text-anchor="middle" fill="${c}">${ch}</text></g>`);
      }
      col++;
    });
  }));
  base.push(blocks);
  const ltop = hz + b * .25 - 3 * b - td * 2 - b * .25, lbot = hz + b * .5;
  const defs = `<linearGradient id="pgsky" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#0a1238"/><stop offset="1" stop-color="#2a2f6e"/>' : '<stop offset="0" stop-color="#5b74c9"/><stop offset="1" stop-color="#f0a7c8"/>'}</linearGradient>
<radialGradient id="pgwash0"><stop offset="0" stop-color="#ff5fa2" stop-opacity=".16"/><stop offset="1" stop-color="#ff5fa2" stop-opacity="0"/></radialGradient>
<radialGradient id="pgwash1"><stop offset="0" stop-color="#4fb8ff" stop-opacity=".16"/><stop offset="1" stop-color="#4fb8ff" stop-opacity="0"/></radialGradient>
<radialGradient id="pgmoonhalo"><stop offset=".3" stop-color="#fff3c4" stop-opacity=".35"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
<filter id="pgglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(Math.max(1.5, u * .012))}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return { defs, base, bulbs, letters, ltop, lbot, btop: Math.min(top, hz - sc) - sc * .06, bbot: hz + u * .04 };
}
/* a drawing of some parts; y0, y1: only that band of the page (the fading layers stay small: the floor, the lights) */
const svgOf = (P, body, sky = false, y0 = 0, y1 = P.h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${y0.toFixed(1)} ${P.w} ${(y1 - y0).toFixed(1)}" width="${P.w}" height="${(y1 - y0).toFixed(0)}" preserveAspectRatio="none" aria-hidden="true">${P.defs}${sky ? `<rect width="${P.w}" height="${P.h}" fill="url(#bdsky)"/>` : ''}${body}</svg>`;
/* the whole backdrop as one still drawing */
export function backdropSVG(w = innerWidth, h = innerHeight, dark = false) {
  const P = backdropParts(w, h, dark);
  return svgOf(P, P.base[0] + `<g opacity=".5">${P.dots.map(d => d.items.join('')).join('')}</g>` + P.room.base.join('') + P.room.bulbs.flat().join('') + P.room.letters.map(g => g[0].join('')).join('') + P.base.slice(1).join('') + P.bulbs.flat().join('')
    + P.shapes.map(x => `<g transform="translate(${x.x.toFixed(0)} ${x.y.toFixed(0)})">${x.inner}</g>`).join(''), true).replace(' xmlns="http://www.w3.org/2000/svg"', '');
}
/* the backdrop as layers that animate cheaply (see above) */
export function backdropHTML(w = innerWidth, h = innerHeight, dark = false) {
  const P = backdropParts(w, h, dark), img = (svg, cls = '', style = '') => `<img class="bd-layer${cls ? ' ' + cls : ''}" alt="" draggable="false"${style ? ` style="${style}"` : ''} src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
  return img(svgOf(P, P.base[0], true))
    + P.dots.map(d => img(svgOf(P, d.items.join(''), false, d.y0, d.y1), 'bd-dots', `top:${(d.y0 / h * 100).toFixed(3)}%;height:${((d.y1 - d.y0) / h * 100).toFixed(3)}%;--dl:-${d.dl.toFixed(2)}s`)).join('')
    + img(svgOf(P, P.room.base.join(''), false, P.room.btop, h * .62), '', `top:${(P.room.btop / h * 100).toFixed(3)}%;height:${((h * .62 - P.room.btop) / h * 100).toFixed(3)}%`)
    + P.room.bulbs.map((b, k) => img(svgOf(P, `<g filter="url(#pgglow)">${b.join('')}</g>`, false, P.room.btop, P.room.bbot), 'bd-pgb', `top:${(P.room.btop / h * 100).toFixed(3)}%;height:${((P.room.bbot - P.room.btop) / h * 100).toFixed(3)}%;--dl:-${(k * .4).toFixed(1)}s`)).join('')
    + P.room.letters.map((g, k) => g.map((L, c) => img(svgOf(P, `<g${dark ? ' filter="url(#pgglow)"' : ''}>${L.join('')}</g>`, false, P.room.ltop, P.room.lbot), `bd-bk bd-bk${c}`, `top:${(P.room.ltop / h * 100).toFixed(3)}%;height:${((P.room.lbot - P.room.ltop) / h * 100).toFixed(3)}%;--dl:-${(c * 1.5 + k * .45).toFixed(2)}s`)).join('')).join('')
    + img(svgOf(P, P.base.slice(1).join('')))
    + P.bulbs.map((b, k) => b.length ? img(svgOf(P, `<g filter="url(#bdglow)">${b.join('')}</g>`, false, 0, h * .3), 'bd-bulbs', `height:30%;--dl:-${(k * .87).toFixed(2)}s`) : '').join('')
    + P.shapes.map(x => { const k = Math.ceil(x.s * 1.6); return `<div class="bd-sh" style="left:${(x.x / w * 100).toFixed(2)}%;top:${(x.y / h * 100).toFixed(2)}%;width:${k * 2}px;height:${k * 2}px;margin:-${k}px 0 0 -${k}px;${x.vars}"><svg viewBox="${-k} ${-k} ${k * 2} ${k * 2}" aria-hidden="true">${x.inner}</svg></div>`; }).join('');
}
