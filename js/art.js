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
export function rainbowHTML(text, { font = '', seed = 7 } = {}) {
  const r = rnd(seed); let i = 0;
  const parts = [...String(text)].map(ch => {
    if (ch === ' ') return '<span class="sp"> </span>';
    const c = FRIDGE[i++ % FRIDGE.length], t = ((r() - .5) * 10).toFixed(1);
    return `<span style="color:${c};transform:rotate(${t}deg)">${esc(ch)}</span>`;
  });
  return `<span class="rainbow"${font ? ` style="font-family:${esc(font)}"` : ''} aria-label="${esc(text)}">${parts.join('')}</span>`;
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

/* the game's art, which is also the lobby's picture of the chosen map (16 : 9): the map behind (The Board's columns, Sky's
   clouds and sun, Pixel's sunset, islands and forest), the duck sitting on a cloud, the title, the map's name, and the
   game's symbol at the top left */
/* the map's world behind the picture (no columns: the picture shows where the game is played) */
function artBackdrop(map) {
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
   drifting. Drawn to the window's
   size; redrawn when it changes or the theme does. */
export function backdropSVG(w = innerWidth, h = innerHeight, dark = false) {
  const r = rnd(77), out = [], cols = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421'];
  const hz = h * .46, K = (h - hz) * 1.05, K2 = w * .16;
  /* the floor: Twister dots in rows to the horizon and out past both edges; each row and color breathes (glows up and
     fades) a little after the last, so the light rolls across the floor */
  out.push(`<rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#bdfloor)"/>`);
  const px = (x, z) => w / 2 + x * K2 / z, py = z => hz + K / z;
  let row = 0;
  for (let z = .95; z < 9; z *= 1.24, row++) {
    const rx = .42 * K2 / z, ry = rx * .42, y = py(z); if (y > h + ry) continue;
    const groups = [[], [], [], []];
    for (let X = -60; X <= 60; X++) {
      const x = px(X + .5, z); if (x < -rx * 1.8 || x > w + rx * 1.8) continue;
      const c = ((X % 4) + 4) % 4;
      groups[c].push(dark ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * 1.7).toFixed(1)}" ry="${(ry * 1.9).toFixed(1)}" fill="url(#bdg${c})"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`
        : `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`);
    }
    groups.forEach((g, c) => { if (g.length) out.push(`<g class="dot" style="--dl:-${((row * .55 + c * 1.1) % 4.4).toFixed(2)}s">${g.join('')}</g>`); });
  }
  /* bunting along two sagging strings; bulbs between the flags glow in the dark */
  const string = (y1, y2, sag, n, k) => {
    const pt = t => [-30 + (w + 60) * t, y1 + (y2 - y1) * t + sag * 4 * t * (1 - t)];
    const pts = Array.from({ length: n + 1 }, (_, i) => pt(i / n));
    let g = `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')}" stroke="${dark ? '#8a8fb5' : '#5d6072'}" stroke-width="1.5" fill="none" opacity=".6"/>`;
    for (let i = 0; i < n; i++) {
      const [x, y] = pt((i + .5) / n), c = ['#ef3b3b', '#ffd23f', '#2fa4ff', '#37d421', '#9b5de5', '#ff8c2b'][(i + k) % 6], f = 15 + r() * 6;
      g += `<path d="M${(x - f * .7).toFixed(1)} ${(y - 2).toFixed(1)}L${(x + f * .7).toFixed(1)} ${(y - 2).toFixed(1)}L${x.toFixed(1)} ${(y + f * 1.25).toFixed(1)}Z" fill="${c}" opacity="${dark ? .55 : .8}"/>`;
      if (dark) { const [bx, by] = pt((i + 1) / n); g += `<circle class="bulb" cx="${bx.toFixed(1)}" cy="${(by + 3).toFixed(1)}" r="3.6" fill="${['#ffe9a8', '#ffd0f0', '#c6f0ff'][(i + k) % 3]}" style="--dl:-${(r() * 3).toFixed(2)}s"/>`; }
    }
    return g;
  };
  const n = Math.max(8, Math.round(w / 90));
  out.push(`<g${dark ? ' filter="url(#bdglow)"' : ''}>${string(h * .03, h * .08, h * .09, n, 0)}${string(h * .13, h * .06, h * .1, n + 1, 3)}</g>`);
  /* drifting ball-pit balls and confetti, with white space between them */
  const placed = [];
  for (let k = 0, tries = 0; k < Math.round(Math.max(6, w * h / 160000)) && tries < 400; tries++) {
    const s = 12 + r() * 20, x = r() * w, y = h * .18 + r() * h * .55;
    if (placed.some(p => Math.hypot(p[0] - x, p[1] - y) < (p[2] + s) * 3)) continue;
    placed.push([x, y, s]); k++;
    const c = cols[k % 4], v = `style="--d:${(12 + r() * 10).toFixed(1)}s;--dl:-${(r() * 10).toFixed(1)}s;--dx:${((r() - .5) * 26).toFixed(0)}px;--dy:${((r() - .5) * 30).toFixed(0)}px;--dr:${((r() - .5) * 30).toFixed(0)}deg"`;
    out.push(k % 3
      ? `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><g class="sh" ${v}><circle r="${s.toFixed(1)}" fill="${c}" opacity="${dark ? .5 : .55}"/><ellipse cx="${(-s * .35).toFixed(1)}" cy="${(-s * .38).toFixed(1)}" rx="${(s * .32).toFixed(1)}" ry="${(s * .2).toFixed(1)}" fill="#fff" opacity=".55" transform="rotate(-30 ${(-s * .35).toFixed(1)} ${(-s * .38).toFixed(1)})"/></g></g>`
      : `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${(r() * 360).toFixed(0)})"><g class="sh" ${v}><rect x="${-s * .5}" y="${-s * .2}" width="${s}" height="${s * .4}" rx="2" fill="${c}" opacity="${dark ? .5 : .6}"/></g></g>`);
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs>
<linearGradient id="bdsky" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#101225"/><stop offset=".46" stop-color="#1f1640"/>' : '<stop offset="0" stop-color="#e3f4ff"/><stop offset=".46" stop-color="#fff7fb"/>'}</linearGradient>
<linearGradient id="bdfloor" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#191a33"/><stop offset="1" stop-color="#0d0e1c"/>' : '<stop offset="0" stop-color="#f4f1ff"/><stop offset="1" stop-color="#e8f3ff"/>'}</linearGradient>
${cols.map((c, k) => `<radialGradient id="bdg${k}"><stop offset=".35" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
<filter id="bdglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs><rect width="${w}" height="${h}" fill="url(#bdsky)"/>${out.join('')}</svg>`;
}
