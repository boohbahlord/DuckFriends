/* ---------- pictures drawn in code ----------
   The game's symbol (three see-through columns: red, yellow, green), the multicolored letters, the game's art (a duck on a
   cloud with the title across it and the symbol at its top left), the front page's duck in a ball pit, and the page's
   Twister-like shapes. Nothing here is a file, so everything is sharp at any size and changes with the theme. */
import { duckSVG, DUCK_DEFAULT } from './duck.js';
import { esc } from './ui.js';

export const FRIDGE = ['#ef3b3b', '#ff8c2b', '#ffd23f', '#37d421', '#2fa4ff', '#9b5de5', '#ff7eb6'];
const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;   // the same "random" every time

/* the symbol */
export function symbolSVG(size = 32, title = 'Agree or Disagree') {
  return `<svg viewBox="0 0 30 24" width="${size}" height="${size * .8}" role="img" aria-label="${esc(title)}">
<rect x="1" y="1" width="8" height="22" rx="1.6" fill="#ED1C24" fill-opacity=".78" stroke="#a5121a" stroke-width="1"/>
<rect x="11" y="1" width="8" height="22" rx="1.6" fill="#FFF200" fill-opacity=".78" stroke="#b8ae00" stroke-width="1"/>
<rect x="21" y="1" width="8" height="22" rx="1.6" fill="#37D421" fill-opacity=".78" stroke="#23931a" stroke-width="1"/></svg>`;
}

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

/* the game's art: sky, a cloud, the duck sitting on it, the title, the symbol at the top left (16 : 9) */
export function gameArtSVG({ width = 480, duck = DUCK_DEFAULT } = {}) {
  return `<svg class="art" viewBox="0 0 480 270" width="${width}" height="${width * 9 / 16}" role="img" aria-label="Agree or Disagree">
<defs><linearGradient id="artsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff"/><stop offset="1" stop-color="#d9f2ff"/></linearGradient></defs>
<rect width="480" height="270" rx="18" fill="url(#artsky)"/>
${cloud(380, 64, .45, '#ffffffcc', '#ffffff66')}${cloud(92, 210, .38, '#ffffffaa', '#ffffff55')}
${cloud(250, 200, 1.05)}
<g transform="translate(176 66)"><svg width="150" height="150" viewBox="0 0 120 120">${duckSVG(duck, { size: 120, shadow: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g>
<text x="240" y="252" text-anchor="middle" font-family="'Lilita One', 'Fredoka', sans-serif" font-size="44" stroke="#1c1c28" stroke-width="5" stroke-linejoin="round" paint-order="stroke fill">${rainbowTSpans('Agree or Disagree')}</text>
<g transform="translate(14 12)"><rect x="-4" y="-4" width="46" height="38" rx="8" fill="#ffffffd0" stroke="#1c1c28" stroke-width="2"/>${symbolSVG(38).replace('<svg ', '<svg x="0" y="0" ')}</g>
</svg>`;
}

/* the front page's duck: the classic yellow duck sitting in a ball pit */
export function heroSVG() {
  const r = rnd(42), back = [], front = [];
  const ball = (x, y, s) => {
    const c = FRIDGE[Math.floor(r() * FRIDGE.length)];
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s}" fill="${c}" stroke="#1c1c28" stroke-width="2.2"/>
<ellipse cx="${(x - s * .35).toFixed(1)}" cy="${(y - s * .38).toFixed(1)}" rx="${(s * .32).toFixed(1)}" ry="${(s * .2).toFixed(1)}" fill="#fff" opacity=".55" transform="rotate(-30 ${(x - s * .35).toFixed(1)} ${(y - s * .38).toFixed(1)})"/>`;
  };
  for (let row = 0; row < 4; row++) {
    const y = 300 + row * 26, n = 12 + (row % 2);
    for (let i = 0; i < n; i++) {
      const x = 16 + i * 40 + (row % 2 ? -20 : 0) + (r() - .5) * 10, s = 19 + r() * 4;
      (row < 1 ? back : front).push(ball(x, y + (r() - .5) * 8, s));
    }
  }
  const duck = duckSVG(DUCK_DEFAULT, { size: 300, shadow: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  return `<svg viewBox="0 0 480 400" role="img" aria-label="A rubber duck in a ball pit">
<g>${back.join('')}</g>
<g class="bob"><svg x="80" y="20" width="320" height="320" viewBox="0 0 120 120">${duck}</svg></g>
<g>${front.join('')}</g></svg>`;
}

/* the page's background: big simple shapes in the playground colors, spread out with white space between them */
export function shapesSVG(w = innerWidth, h = innerHeight) {
  const r = rnd(1234), cols = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421', '#ff8c2b', '#9b5de5'], out = [], placed = [];
  const n = Math.round(Math.min(26, Math.max(9, w * h / 70000)));
  for (let k = 0, tries = 0; k < n && tries < 600; tries++) {
    const s = 34 + r() * 60, x = r() * w, y = r() * h;
    if (placed.some(p => Math.hypot(p[0] - x, p[1] - y) < (p[2] + s) * 1.35)) continue;   // keep white space between shapes
    placed.push([x, y, s]); k++;
    const c = cols[k % cols.length], kind = Math.floor(r() * 5), rot = Math.round(r() * 360);
    const v = `style="--d:${(14 + r() * 12).toFixed(1)}s;--dl:-${(r() * 10).toFixed(1)}s;--dx:${((r() - .5) * 30).toFixed(0)}px;--dy:${((r() - .5) * 30).toFixed(0)}px;--dr:${((r() - .5) * 24).toFixed(0)}deg"`;
    const g = `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot})"><g class="sh" ${v} fill="${c}" opacity=".2">`;
    const shape = [
      `<circle r="${s}"/>`,
      `<rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}" rx="${s * .18}"/>`,
      `<path d="M0 ${-s * 1.1}L${s} ${s * .75}H${-s}z" stroke="${c}" stroke-width="${s * .2}" stroke-linejoin="round"/>`,
      `<circle r="${s}" fill="none" stroke="${c}" stroke-width="${s * .34}"/>`,
      `<path d="M${-s * .36} ${-s}h${s * .72}v${s * .64}h${s * .64}v${s * .72}h${-s * .64}v${s * .64}h${-s * .72}v${-s * .64}h${-s * .64}v${-s * .72}h${s * .64}z" stroke="${c}" stroke-width="${s * .12}" stroke-linejoin="round"/>`,
    ][kind];
    out.push(`${g}${shape}</g></g>`);
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${out.join('')}</svg>`;
}
