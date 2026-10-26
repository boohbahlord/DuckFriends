/* ---------- Duck Cabin: the drawings (Hangout) ----------
   Every prop of the Duck Cabin map as an SVG string, in world px (a duck is about 64 tall), for the world's 3/4 view:
   x across, y depth, and a thing h high drawn h px higher on the screen (so tops show their whole footprint and south
   faces show their whole height; faces that look east or west are edge-on). It is always night: dark blue-green
   ground, warm orange light from windows, lamps, fires and string lights, and a pool lit from under the water. Shapes
   are simple and outlined in the ducks' ink (#1c1c28), a little 3D (a lighter top, a darker front, a small shadow);
   no text, no logos. Small props that read best from the side (lamps, the mic, rocking chairs) are drawn side-on,
   like the ducks.
   The box: each function takes { w, h, ...options } in world px and fills that box. w is the footprint's width; h is
   the footprint's depth plus whatever rises above it (and, for raised things, hangs below). Unless a comment says
   otherwise the box's bottom edge is the footprint's south edge on the ground (the foot line, for depth sorting) and
   its left edge the footprint's west edge: put the box at screen (x, y + depth − h).
   Pairs: things a duck can be behind AND in front of return { back, front, backFoot, frontFoot }: two SVGs over the
   same box, each depth-sorted by its foot, a y in the box (null: a flat piece for the ground layer, under every duck).
   Moving bits only carry CSS classes (hg-flicker, hg-fire-a/-b, hg-twinkle, hg-shimmer, hg-smoke, hg-spark), animated
   only under html.moving like the rest of the game: put HANG_ART_CSS in the page once (useHangArtCSS()).
   Ids: each drawing makes its own (hg + a counter), so any number of copies live on one page. ART lists every prop
   with its default box and its anchor, for the world and the preview page (tools/hangout-art.html). */
import { mix } from '../duck.js';

const O = '#1c1c28';   // the ducks' ink
const n1 = v => Math.round(v * 10) / 10;
/* a template tag that writes numbers with one decimal */
const F = (s, ...v) => s.reduce((a, x, i) => a + x + (i < v.length ? (typeof v[i] === 'number' ? n1(v[i]) : v[i] ?? '') : ''), '');
const ln = (w = 2.4, c = O) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
let N = 0;
const uid = () => 'hg' + (++N).toString(36);
const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;   // the same "random" every time
const wrap = (w, h, body, cls = '', defs = '') => F`<svg class="hg${cls ? ' ' + cls : ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${defs ? '<defs>' + defs + '</defs>' : ''}${body}</svg>`;
/* a pair: [body, defs] for each part */
const pair = (w, h, [b, bd = ''], [f, fd = ''], backFoot, frontFoot) => ({ back: wrap(w, h, b, 'hg-back', bd), front: wrap(w, h, f, 'hg-front', fd), backFoot, frontFoot });
const shade = (cx, cy, rx, ry, o = .32) => F`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${o}"/>`;
const R = (x, y, w, h, fill, more = '') => F`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
const glowDef = (id, c = '#ffb347', a = .55) => F`<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset=".45" stop-color="${c}" stop-opacity="${a * .4}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const glassDef = id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="#ffbd57"/><stop offset="1" stop-color="#f08a32"/></linearGradient>`;
/* round logs in rows R high, the rows lined up so one ends at y0 */
const logDef = (id, y0 = 0, r = 17) => F`<pattern id="${id}" width="240" height="${r}" patternUnits="userSpaceOnUse" y="${y0}"><rect width="240" height="${r}" fill="#a65a2a"/><rect y="${r * .12}" width="240" height="${r * .32}" fill="#d98d4e" opacity=".6"/><rect y="${r * .7}" width="240" height="${r * .3}" fill="#5e2a10" opacity=".5"/><path d="M0 ${r - .7}H240" stroke="#3a1906" stroke-width="1.5"/><path d="M30 ${r * .55}h34M122 ${r * .45}h22M182 ${r * .6}h40" stroke="#7a3a16" stroke-width="1" opacity=".6"/></pattern>`;
const shingleDef = (id, sy = 1, rot = 0) => F`<pattern id="${id}" width="56" height="48" patternUnits="userSpaceOnUse"${sy !== 1 || rot ? F` patternTransform="${rot ? `rotate(${rot})` : ''}${sy !== 1 ? ` scale(1 ${sy})` : ''}"` : ''}><rect width="56" height="48" fill="#2b5747"/><rect width="56" height="7" fill="#4f866d" opacity=".35"/><rect y="24" width="56" height="7" fill="#4f866d" opacity=".35"/><path d="M0 23H56M0 47H56" stroke="#14302a" stroke-width="2.6"/><path d="M14 0V23M42 0V23M0 24V47M28 24V47M56 24V47" stroke="#14302a" stroke-width="1.8"/></pattern>`;
const stoneStripDef = (id, hh = 16, y0 = 0) => F`<pattern id="${id}" width="100" height="${hh}" patternUnits="userSpaceOnUse" y="${y0}"><rect width="100" height="${hh}" fill="#3a3c44"/><rect x="1.5" y="1.5" width="28" height="${hh - 3}" rx="4" fill="#80858f"/><rect x="32" y="1.5" width="22" height="${hh - 3}" rx="4" fill="#6d727c"/><rect x="56" y="1.5" width="26" height="${hh - 3}" rx="4" fill="#8f8a82"/><rect x="84" y="1.5" width="14.5" height="${hh - 3}" rx="4" fill="#757079"/></pattern>`;
/* hand-laid stones filling a box */
function stones(x, y, w, h, seed, rowH = 22) {
  const r = rnd(seed), cols = ['#7e838d', '#8b8780', '#6c717b', '#979ca4', '#75706a'];
  let out = R(x, y, w, h, '#383a42');
  for (let yy = y + 2, row = 0; yy < y + h - 4; yy += rowH, row++) {
    const hh = Math.min(rowH - 3, y + h - 2 - yy);
    let xx = x + 2 - (row % 2 ? rowH * .6 : 0);
    while (xx < x + w - 3) {
      const sw = rowH * (1 + r() * 1.1), x0 = Math.max(x + 2, xx), x1 = Math.min(x + w - 2, xx + sw - 3);
      if (x1 - x0 > 4) out += F`<rect x="${x0}" y="${yy}" width="${x1 - x0}" height="${hh}" rx="${Math.min(6, hh / 2.5)}" fill="${cols[Math.floor(r() * cols.length)]}"/><rect x="${x0 + 2}" y="${yy + 1.5}" width="${Math.max(0, x1 - x0 - 6)}" height="${hh * .26}" rx="2" fill="#fff" opacity=".14"/>`;
      xx += sw;
    }
  }
  return out;
}
/* warm bulbs on a wire that sags between hooks: three sets that twinkle in turn */
function stringLights(x0, x1, y, sag = 16, hook = 180, gap = 30, seed = 1) {
  const n = Math.max(1, Math.round((x1 - x0) / hook)), seg = (x1 - x0) / n, sets = ['', '', ''];
  let wire = '', k = 0;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * seg, b = a + seg, m = (a + b) / 2;
    wire += F`M${a} ${y}Q${m} ${y + sag * 2} ${b} ${y}`;
    const nb = Math.max(2, Math.round(seg / gap));
    for (let j = 1; j < nb; j++) {
      const t = j / nb, bx = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * m + t * t * b, by = y + 2 * (1 - t) * t * sag * 2 + 5;
      sets[k++ % 3] += F`<circle cx="${bx}" cy="${by + 2}" r="9" fill="#ffb347" opacity=".3"/><ellipse cx="${bx}" cy="${by + 2}" rx="3.6" ry="4.6" fill="#ffd98a" stroke="#6a3a12" stroke-width="1.2"/>`;
    }
  }
  return `<path d="${wire}" stroke="#2a1a10" stroke-width="2" fill="none"/>` + sets.map((s, i) => `<g class="hg-twinkle" style="animation-delay:-${(i * .8 + seed * .3).toFixed(1)}s">${s}</g>`).join('');
}
const flameA = (cx, by, s) => F`<path d="M${cx - 22 * s} ${by}C${cx - 30 * s} ${by - 30 * s} ${cx - 12 * s} ${by - 44 * s} ${cx - 8 * s} ${by - 70 * s}C${cx + 2 * s} ${by - 50 * s} ${cx + 10 * s} ${by - 58 * s} ${cx + 6 * s} ${by - 88 * s}C${cx + 26 * s} ${by - 60 * s} ${cx + 30 * s} ${by - 34 * s} ${cx + 22 * s} ${by}Z" fill="#ff8a2a" ${ln(2)}/><path d="M${cx - 13 * s} ${by}C${cx - 18 * s} ${by - 22 * s} ${cx - 4 * s} ${by - 34 * s} ${cx} ${by - 52 * s}C${cx + 10 * s} ${by - 34 * s} ${cx + 18 * s} ${by - 22 * s} ${cx + 13 * s} ${by}Z" fill="#ffc23f"/><path d="M${cx - 6 * s} ${by}C${cx - 8 * s} ${by - 12 * s} ${cx} ${by - 20 * s} ${cx + 1 * s} ${by - 28 * s}C${cx + 6 * s} ${by - 16 * s} ${cx + 8 * s} ${by - 8 * s} ${cx + 6 * s} ${by}Z" fill="#fff1a8"/>`;
const flameB = (cx, by, s) => F`<path d="M${cx - 22 * s} ${by}C${cx - 32 * s} ${by - 26 * s} ${cx - 20 * s} ${by - 50 * s} ${cx - 2 * s} ${by - 84 * s}C${cx + 4 * s} ${by - 60 * s} ${cx + 16 * s} ${by - 64 * s} ${cx + 18 * s} ${by - 74 * s}C${cx + 30 * s} ${by - 46 * s} ${cx + 28 * s} ${by - 24 * s} ${cx + 22 * s} ${by}Z" fill="#ff8a2a" ${ln(2)}/><path d="M${cx - 13 * s} ${by}C${cx - 20 * s} ${by - 20 * s} ${cx - 8 * s} ${by - 36 * s} ${cx - 2 * s} ${by - 56 * s}C${cx + 8 * s} ${by - 36 * s} ${cx + 18 * s} ${by - 22 * s} ${cx + 13 * s} ${by}Z" fill="#ffc23f"/><path d="M${cx - 6 * s} ${by}C${cx - 9 * s} ${by - 10 * s} ${cx - 2 * s} ${by - 20 * s} ${cx - 1 * s} ${by - 30 * s}C${cx + 6 * s} ${by - 18 * s} ${cx + 8 * s} ${by - 8 * s} ${cx + 6 * s} ${by}Z" fill="#fff1a8"/>`;
const fire = (cx, by, s) => `<g class="hg-fire-a">${flameA(cx, by, s)}</g><g class="hg-fire-b">${flameB(cx, by, s)}</g>`;

/* ---------- the CSS for the moving bits (only under html.moving, like the rest of the game) ---------- */
export const HANG_ART_CSS = `
.hg-flicker,.hg-shimmer,.hg-smoke,.hg-spark{transform-box:fill-box;transform-origin:center}
.hg-fire-b{opacity:0}
html.moving .hg-flicker{animation:hgflick 3.3s ease-in-out infinite}
@keyframes hgflick{0%,100%{opacity:.85}12%{opacity:1}20%{opacity:.7}34%{opacity:.95}48%{opacity:.78}61%{opacity:1}70%{opacity:.62}74%{opacity:.92}88%{opacity:.8}}
html.moving .hg-fire-a{animation:hgfa .46s steps(1) infinite}
html.moving .hg-fire-b{animation:hgfb .46s steps(1) infinite}
@keyframes hgfa{0%{opacity:1}50%{opacity:0}}
@keyframes hgfb{0%{opacity:0}50%{opacity:1}}
html.moving .hg-twinkle{animation:hgtw 2.4s ease-in-out infinite alternate}
@keyframes hgtw{from{opacity:1}to{opacity:.45}}
html.moving .hg-shimmer{animation:hgsh 3.6s ease-in-out infinite alternate}
@keyframes hgsh{from{opacity:.35}to{opacity:1}}
.hg-smoke{opacity:0}
html.moving .hg-smoke{animation:hgsm 7s linear infinite}
@keyframes hgsm{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.35}100%{transform:translate(40px,-150px) scale(1.8);opacity:0}}
.hg-spark{opacity:0}
html.moving .hg-spark{animation:hgsp 1.9s linear infinite}
@keyframes hgsp{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(8px,-80px);opacity:0}}
`;
/* a drawing as a data: URL, for an <img> (the browser then keeps it as a picture: cheap for big still things like the
   forest bands; its CSS classes no longer move and nothing outside its box shows) */
export const svgDataURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
export function useHangArtCSS(doc = document) {
  if (doc.getElementById('hg-art-css')) return;
  const s = doc.createElement('style'); s.id = 'hg-art-css'; s.textContent = HANG_ART_CSS; doc.head.append(s);
}

/* ---------- the ground ---------- */
const GROUND = {
  grass: { base: '#24503d', tuft: '#33694f', dark: '#1b4031', patch: '#2a5944' },
  downhill: { base: '#1f4636', tuft: '#2c5c47', dark: '#18392b', patch: '#24503f' },
  slope: { base: '#1a3a2e', tuft: '#24503f', dark: '#132c22', patch: '#1e4334' },
  forest: { base: '#14301f', tuft: '#1d4230', dark: '#0f2418', patch: '#3a2e1f' },
};
function groundTile(kind, r) {
  const tufts = (n, W, H, c) => { let p = ''; for (let i = 0; i < n; i++) { const x = 8 + r() * (W - 16), y = 14 + r() * (H - 20), l = 6 + r() * 4; p += F`M${x} ${y}l${-2.5 - r() * 2} ${-l}M${x} ${y}l${r()} ${-l - 2}M${x} ${y}l${2.5 + r() * 2} ${-l + 1}`; } return `<path d="${p}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`; };
  const dots = (n, W, H, c, s, o) => { let p = ''; for (let i = 0; i < n; i++) p += F`<ellipse cx="${s + r() * (W - 2 * s)}" cy="${s + r() * (H - 2 * s)}" rx="${s * (.6 + r() * .8)}" ry="${s * (.4 + r() * .5)}" fill="${c}" opacity="${o}"/>`; return p; };
  if (kind === 'grass' || kind === 'downhill') {   // a bigger tile, so it doesn't show a pattern: dark and light patches, tufts big and small
    const G = GROUND[kind], W = 400, H = 400;
    const blob = (n, c, s, o) => { let p = ''; for (let i = 0; i < n; i++) { const x = s + r() * (W - 2 * s), y = s + r() * (H - 2 * s), rx = s * (.7 + r() * .9), ry = rx * (.45 + r() * .2); p += F`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${o}"/><ellipse cx="${x + rx * .35}" cy="${y - ry * .2}" rx="${rx * .6}" ry="${ry * .7}" fill="${c}" opacity="${o * .8}"/>`; } return p; };
    const tuftsAt = (n, c, k) => { let p = ''; for (let i = 0; i < n; i++) { const x = 10 + r() * (W - 20), y = 16 + r() * (H - 22), l = (5 + r() * 5) * k; p += F`M${x} ${y}l${-2.5 * k - r() * 2} ${-l}M${x} ${y}l${r()} ${-l - 2 * k}M${x} ${y}l${2.5 * k + r() * 2} ${-l + 1}`; } return `<path d="${p}" stroke="${c}" stroke-width="${k > 1 ? 2.4 : 1.8}" fill="none" stroke-linecap="round"/>`; };
    let b = R(0, 0, W, H, G.base) + blob(5, G.dark, 40, .45) + blob(4, G.patch, 34, .55) + dots(26, W, H, G.dark, 3.5, .55)
      + tuftsAt(26, G.dark, 1) + tuftsAt(30, G.tuft, 1) + tuftsAt(10, G.tuft, 1.4) + tuftsAt(8, '#4a8566', .9);
    if (kind === 'grass') for (let i = 0; i < 5; i++) { const x = 20 + r() * (W - 40), y = 20 + r() * (H - 40); b += F`<g opacity=".7"><circle cx="${x}" cy="${y}" r="1.6" fill="#cfd8ff"/><circle cx="${x + 4}" cy="${y + 2}" r="1.3" fill="#cfd8ff"/><circle cx="${x + 1}" cy="${y + 4}" r="1.3" fill="#cfd8ff"/></g>`; }   // (little pale flowers, blue in the moonlight)
    return [W, H, b];
  }
  if (GROUND[kind]) {
    const G = GROUND[kind], W = 200, H = 200;
    let b = R(0, 0, W, H, G.base) + dots(4, W, H, G.patch, 26, .5) + dots(10, W, H, G.dark, 4, .6) + tufts(kind === 'slope' ? 8 : 15, W, H, G.tuft);
    if (kind === 'slope') b += `<path d="M0 60C50 48 150 72 200 60M0 150C50 140 150 162 200 150" stroke="${G.dark}" stroke-width="7" fill="none" opacity=".8"/>`;
    if (kind === 'forest') b += dots(12, W, H, '#5a4128', 2.5, .55);
    return [W, H, b];
  }
  if (kind === 'dirt') return [160, 160, R(0, 0, 160, 160, '#5d4533') + dots(6, 160, 160, '#4b3628', 14, .6) + dots(16, 160, 160, '#7a6150', 3, .7) + dots(10, 160, 160, '#3e2c20', 2.4, .7)];
  if (kind === 'wood') {   // the cabin's floor: planks that run east-west, of mixed lengths and tones, with grain, nails and a few knots
    const TW = 720, rows = 8, ph = 24, tones = ['#9c5d2c', '#93552a', '#a46634', '#8c4f26', '#a0602f', '#97582b'];
    let b = '';
    for (let i = 0; i < rows; i++) {
      const y = i * ph, js = [];
      for (let x = r() * 120; x < TW; x += 130 + r() * 170) js.push(x);   // the joints (the row wraps round the tile)
      for (let k = 0; k < js.length; k++) {
        const x0 = js[k], x1 = k + 1 < js.length ? js[k + 1] : js[0] + TW, tone = tones[Math.floor(r() * tones.length)];
        let g = R(x0, y, x1 - x0, ph, tone) + R(x0, y + 2, x1 - x0, 3, '#ffd9a0', 'opacity=".07"');
        for (let n = 0; n < 2; n++) { const gy = y + 7 + n * 8 + r() * 4, gx = x0 + 10 + r() * 20, gl = (x1 - x0) * (.4 + r() * .45); g += F`<path d="M${gx} ${gy}q${gl / 3} ${-2 + r() * 4} ${gl / 2} 0t${gl / 2} ${-1 + r() * 2}" stroke="#6a3818" stroke-width="1" fill="none" opacity="${.35 + r() * .25}"/>`; }
        if (r() < .22) { const kx = x0 + 30 + r() * Math.max(10, x1 - x0 - 60), ky = y + 8 + r() * 8; g += F`<ellipse cx="${kx}" cy="${ky}" rx="6" ry="3.4" fill="#6e3c1a" opacity=".75"/><ellipse cx="${kx}" cy="${ky}" rx="10" ry="5.5" fill="none" stroke="#6e3c1a" stroke-width="1" opacity=".45"/>`; }
        g += F`<path d="M${x0} ${y}V${y + ph}" stroke="#5e3214" stroke-width="2"/><circle cx="${x0 + 6}" cy="${y + 7}" r="1.3" fill="#3e200c"/><circle cx="${x0 + 6}" cy="${y + 17}" r="1.3" fill="#3e200c"/><circle cx="${x1 - 6}" cy="${y + 7}" r="1.3" fill="#3e200c"/><circle cx="${x1 - 6}" cy="${y + 17}" r="1.3" fill="#3e200c"/>`;
        b += g + (x1 > TW ? `<g transform="translate(${-TW} 0)">${g}</g>` : '');
      }
      b += F`<path d="M0 ${y + ph - 1}H${TW}" stroke="#5e3214" stroke-width="2"/>`;
    }
    return [TW, rows * ph, b];
  }
  if (kind === 'tile') return [80, 80, R(0, 0, 80, 80, '#d9c9a6') + R(0, 0, 40, 40, '#b9744a') + R(40, 40, 40, 40, '#b9744a') + '<path d="M0 .5H80M0 40H80M.5 0V80M40 0V80" stroke="#6e4b33" stroke-width="2"/>'];
  if (kind === 'bath') return [36, 36, R(0, 0, 36, 36, '#9fc9d2') + R(0, 0, 18, 18, '#b6dbe2') + R(18, 18, 18, 18, '#b6dbe2') + '<path d="M0 .5H36M0 18H36M.5 0V36M18 0V36" stroke="#e8f4f6" stroke-width="1.6"/>'];
  if (kind === 'pavers') return [160, 80, R(0, 0, 160, 80, "#2c3036") + '<g stroke="#2b2e34" stroke-width="1.5"><rect x="2" y="2" width="76" height="36" rx="5" fill="#535a62"/><rect x="82" y="2" width="76" height="36" rx="5" fill="#4d535b"/><rect x="-38" y="42" width="76" height="36" rx="5" fill="#575e66"/><rect x="42" y="42" width="76" height="36" rx="5" fill="#50565e"/><rect x="122" y="42" width="76" height="36" rx="5" fill="#575e66"/></g><path d="M8 6h30M88 6h40M48 46h40" stroke="#fff" stroke-width="3" opacity=".08"/>'];
  return groundTile('grass', r);
}
/* a patch of ground filling the box: grass (the highground), slope (the darker decline, darkest in its middle),
   downhill, forest (the floor under the trees), dirt, wood (the cabin floor), tile (the kitchen), bath, pavers (around
   the pool). Anchor: flat (ground layer). */
export function ground({ w = 400, h = 300, kind = 'grass', seed = 1 } = {}) {
  const id = uid(), [tw, th, body] = groundTile(kind, rnd(seed * 97 + kind.length));
  let over = '', defs = F`<pattern id="${id}" width="${tw}" height="${th}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  if (kind === 'slope') {   // the decline darkens toward its middle and meets the downhill's green at its foot
    defs += `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24503d" stop-opacity=".9"/><stop offset=".25" stop-color="#24503d" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity=".22"/><stop offset=".85" stop-color="#1f4636" stop-opacity="0"/><stop offset="1" stop-color="#1f4636" stop-opacity=".9"/></linearGradient>`;
    over = R(0, 0, w, h, `url(#${id}s)`);
  }
  return wrap(w, h, R(0, 0, w, h, `url(#${id})`) + over, 'hg-ground', defs);
}
/* the dirt path: pts in box px (default straight across the middle), width across; tire ruts and a grassy middle.
   Anchor: flat. */
export function dirtPath({ w = 1000, h = 160, pts, width = h * .82, seed = 3 } = {}) {
  const id = uid(), [tw, th, body] = groundTile('dirt', rnd(seed)), P = pts || [[0, h / 2], [w, h / 2]];
  const d = 'M' + P.map(p => F`${p[0]} ${p[1]}`).join('L');
  const off = width * .22;
  return wrap(w, h, F`<path d="${d}" stroke="#16301f" stroke-width="${width + 14}" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/><path d="${d}" stroke="url(#${id})" stroke-width="${width}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
    + F`<path d="${d}" stroke="#463224" stroke-width="${width * .13}" fill="none" stroke-linejoin="round" transform="translate(0 ${-off})" opacity=".5"/><path d="${d}" stroke="#463224" stroke-width="${width * .13}" fill="none" stroke-linejoin="round" transform="translate(0 ${off})" opacity=".5"/>`
    + F`<path d="${d}" stroke="#2c5238" stroke-width="${width * .12}" fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="3 9 14 7 6 12" opacity=".55"/>`, 'hg-ground',
  F`<pattern id="${id}" width="${tw}" height="${th}" patternUnits="userSpaceOnUse">${body}</pattern>`);
}
/* a pool of light on the ground (a window, a door, a fire), filling the box. Anchor: flat. */
export function glow({ w = 300, h = 200, color = '#ffb347', a = .45, flicker = false } = {}) {
  const id = uid();
  return wrap(w, h, F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="url(#${id})"${flicker ? ' class="hg-flicker"' : ''}/>`, 'hg-ground', glowDef(id, color, a));
}
/* a rug: oval (braided rings), round, or rect (a woven one with a fringe). Anchor: flat. */
export function rug({ w = 300, h = 200, kind = 'oval', colors = ['#a8402e', '#e0a84a', '#3e6d8c', '#7a8f3a'] } = {}) {
  if (kind === 'rect') {
    let fr = '';
    for (let y = 8; y < h - 6; y += 9) fr += F`M0 ${y}h10M${w - 10} ${y}h10`;
    let dia = '';
    const n = Math.max(1, Math.round((w - 80) / 70));
    for (let i = 0; i < n; i++) { const cx = 40 + (w - 80) * (i + .5) / n, cy = h / 2, s = Math.min(26, h * .22); dia += F`<path d="M${cx} ${cy - s}L${cx + s} ${cy}L${cx} ${cy + s}L${cx - s} ${cy}Z" fill="${colors[1]}" stroke="${colors[3]}" stroke-width="3"/>`; }
    return wrap(w, h, F`<path d="${fr}" stroke="#e8d9b8" stroke-width="2.4"/>` + R(10, 0, w - 20, h, colors[0], `rx="6" ${ln(2.4)}`) + R(22, 12, w - 44, h - 24, colors[2], 'rx="3"') + R(30, 20, w - 60, h - 40, 'none', `stroke="${colors[1]}" stroke-width="4" stroke-dasharray="10 6"`) + dia, 'hg-ground');
  }
  const rings = Math.max(3, Math.floor(Math.min(w, h) / 2 / 13));
  let b = F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 1}" ry="${h / 2 - 1}" fill="${colors[0]}" ${ln(2.4)}/>`;
  for (let i = 1; i < rings; i++) b += F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - i * 13}" ry="${h / 2 - i * 13}" fill="${colors[i % colors.length]}" stroke="#00000033" stroke-width="2" stroke-dasharray="7 4"/>`;
  return wrap(w, h, b + F`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 1}" ry="${h / 2 - 1}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="6" stroke-dasharray="7 4"/>`, 'hg-ground');
}

/* ---------- trees ---------- */
export const TREE_KINDS = { pine: [120, 250], fir: [160, 220], spruce: [96, 300], oak: [210, 230], birch: [140, 240], bush: [100, 64] };
/* one tree drawn into w × h with its trunk's foot at (w/2, h − 8) */
function treeBody(kind, w, h, seed = 1) {
  const cx = w / 2, b = h - 8, r = rnd(seed);
  if (kind === 'pine' || kind === 'fir' || kind === 'spruce') {
    const [n, c0, c1, tw, th] = { pine: [4, '#1d4536', '#2b604a', .16, .13], fir: [4, '#21503c', '#30705a', .18, .1], spruce: [5, '#1c4240', '#2a5e5b', .12, .11] }[kind];
    let out = F`<rect x="${cx - w * tw / 2}" y="${b - h * .22}" width="${w * tw}" height="${h * .22}" rx="2" fill="#5b3b24" ${ln(2.2)}/><rect x="${cx - w * tw / 2 + 2}" y="${b - h * .22}" width="${w * tw * .35}" height="${h * .22 - 2}" fill="#7a5235"/>`;
    const top = h * .02, bot = b - h * th;
    for (let i = n - 1; i >= 0; i--) {
      const t0 = top + (bot - top) * (i / (n + .6)), yb = top + (bot - top) * ((i + 1.6) / (n + .6)), hw = w * .5 * (.4 + .6 * (i + 1) / n) - 2, d = h * .035;
      out += F`<path d="M${cx} ${t0}L${cx - hw} ${yb}Q${cx - hw * .66} ${yb - d} ${cx - hw * .33} ${yb + d * .3}Q${cx} ${yb - d} ${cx + hw * .33} ${yb + d * .3}Q${cx + hw * .66} ${yb - d} ${cx + hw} ${yb}Z" fill="${c0}" ${ln(2.4)}/>`
        + F`<path d="M${cx - 1} ${t0 + 5}L${cx - hw + 6} ${yb - 3}Q${cx - hw * .66} ${yb - d - 2} ${cx - hw * .36} ${yb - 2}L${cx - hw * .08} ${t0 + (yb - t0) * .5}Z" fill="${c1}"/>`;
    }
    return out;
  }
  if (kind === 'bush') {
    const C = [[-.26, .62, .3], [.24, .6, .32], [0, .42, .36]].map(([dx, dy, rr]) => [cx + dx * w, dy * h, rr * w * .7]);
    return C.map(([x, y, rr]) => F`<circle cx="${x}" cy="${y}" r="${rr}" fill="#22503a" ${ln(2.4)}/>`).join('') + C.map(([x, y, rr]) => F`<circle cx="${x}" cy="${y}" r="${rr - 1.3}" fill="#22503a"/><circle cx="${x - rr * .25}" cy="${y - rr * .3}" r="${rr * .5}" fill="#2f6a4c"/>`).join('');
  }
  const birch = kind === 'birch', c0 = birch ? '#3c6b3a' : '#284f34', c1 = birch ? '#548a4a' : '#386b45';
  const tk = birch ? '#e6e1d6' : '#5a3a24', tw = w * (birch ? .07 : .1);
  const fork = F`M${cx} ${h * .56}L${cx - w * .16} ${h * .34}M${cx} ${h * .58}L${cx + w * .14} ${h * .3}`;
  let out = `<path d="${fork}" stroke="${O}" stroke-width="${tw * .8 + 5}" fill="none" stroke-linecap="round"/><path d="${fork}" stroke="${tk}" stroke-width="${tw * .8}" fill="none" stroke-linecap="round"/>`
    + F`<path d="M${cx - tw} ${b}Q${cx - tw * .55} ${h * .7} ${cx - tw * .6} ${h * .46}H${cx + tw * .6}Q${cx + tw * .55} ${h * .7} ${cx + tw} ${b}Z" fill="${tk}" ${ln(2.2)}/>`
    + (birch ? '' : F`<path d="M${cx - tw * .55} ${b - 4}Q${cx - tw * .3} ${h * .7} ${cx - tw * .35} ${h * .5}" stroke="#7a5235" stroke-width="3" fill="none"/>`);
  if (birch) for (let y = b - 16; y > h * .52; y -= 18 + r() * 10) out += F`<path d="M${cx - tw * .8 + r() * 3} ${y}h${tw * (.5 + r() * .6)}" stroke="#2a2a30" stroke-width="3" stroke-linecap="round"/>`;
  const blobs = (birch ? [[0, .2, .21], [-.24, .33, .17], [.24, .32, .17], [-.08, .44, .15], [.14, .46, .14]] : [[0, .2, .27], [-.27, .34, .22], [.27, .36, .22], [-.1, .48, .2], [.15, .5, .19], [-.36, .5, .13], [.37, .52, .13]])
    .map(([dx, dy, rr]) => [cx + dx * w, dy * h + 8, rr * w]);
  out += blobs.map(([x, y, rr]) => F`<circle cx="${x}" cy="${y}" r="${rr}" fill="${c0}" ${ln(2.4)}/>`).join('')
    + blobs.map(([x, y, rr]) => F`<circle cx="${x}" cy="${y}" r="${rr - 1.3}" fill="${c0}"/>`).join('')
    + blobs.map(([x, y, rr]) => F`<circle cx="${x - rr * .28}" cy="${y - rr * .3}" r="${rr * .52}" fill="${c1}"/>`).join('');
  return out;
}
/* a tree: kind pine | fir | spruce | oak | birch | bush. back: its shadow (flat); front: the tree, foot at its trunk's
   foot (y = h − 8). */
export function tree({ kind = 'pine', w, h, seed = 1 } = {}) {
  const [dw, dh] = TREE_KINDS[kind] || TREE_KINDS.pine;
  w = w || dw; h = h || dh;
  return pair(w, h, [shade(w / 2, h - 8, w * .42, w * .16, .35)], [treeBody(kind, w, h, seed)], null, h - 8);
}
/* a band of forest, for the edges of the world where no duck goes: trees' feet fill y top … h (the box's top `top`
   px hold the crowns); each kind is drawn once and reused. Anchor: foot at y = top (a duck can only be north of it
   along the south edge, or south of every foot along the north edge). */
export function forest({ w = 1200, h = 500, top = 300, seed = 5, density = 1, floor = true } = {}) {
  const id = uid(), r = rnd(seed), kinds = ['pine', 'pine', 'fir', 'fir', 'spruce', 'spruce', 'oak', 'birch'];
  let defs = '';
  for (const k of new Set(kinds)) { const [tw, th] = TREE_KINDS[k]; defs += F`<g id="${id}${k}"><g transform="translate(${-tw / 2} ${-(th - 8)})">${treeBody(k, tw, th, 3)}</g></g>`; }
  const trees = [];
  for (let y = top + 14; y < h + 10; y += 44 / density) {
    for (let x = -30 + r() * 50; x < w + 30; x += (62 + r() * 30) / density) {
      if (r() < .12) continue;
      trees.push([x + (r() - .5) * 20, Math.min(h, y + (r() - .5) * 26), kinds[Math.floor(r() * kinds.length)], .78 + r() * .5]);
    }
  }
  trees.sort((a, b) => a[1] - b[1]);
  const fl = floor ? F`<path d="M0 ${top + 10}Q${w * .25} ${top - 14} ${w * .5} ${top + 6}T${w} ${top}V${h}H0Z" fill="#10261b" opacity=".85"/>` : '';
  const sh = trees.map(([x, y, , s]) => F`<ellipse cx="${x}" cy="${y}" rx="${44 * s}" ry="${16 * s}" fill="#000" opacity=".3"/>`).join('');
  const body = trees.map(([x, y, k, s]) => F`<use href="#${id}${k}" transform="translate(${x} ${y}) scale(${s})"/>`).join('');
  return wrap(w, h, fl + sh + body, 'hg-forest', defs);
}

/* ---------- lights ---------- */
/* a lamppost (warm, flickering a little). back: the pool of light on the ground (flat); front: the post, foot at
   (w/2, h − 14). */
export function lamppost({ w = 140, h = 230 } = {}) {
  const id = uid(), cx = w / 2, b = h - 14, ly = b - 176;
  const back = F`<ellipse cx="${cx}" cy="${b}" rx="${w / 2}" ry="${w * .22}" fill="url(#${id})" class="hg-flicker"/>`;
  const front = shade(cx, b, 15, 5) + F`<circle cx="${cx}" cy="${ly + 16}" r="${w * .38}" fill="url(#${id}h)" class="hg-flicker" style="animation-delay:-1.1s"/>`
    + F`<path d="M${cx - 12} ${b}h24l-4 -14h-16Z" fill="#2a2b35" ${ln(2.2)}/><rect x="${cx - 4}" y="${ly + 34}" width="8" height="${b - ly - 48}" fill="#30313c" ${ln(2.2)}/><rect x="${cx - 2.5}" y="${ly + 36}" width="2" height="${b - ly - 52}" fill="#5a5c6a"/>`
    + F`<path d="M${cx - 14} ${ly + 8}h28l-3 24h-22Z" fill="#ffd27a" ${ln(2.2)}/><path d="M${cx - 9} ${ly + 10}h7l-1 20h-5Z" fill="#fff4cc"/><path d="M${cx} ${ly + 8}V${ly + 32}" stroke="${O}" stroke-width="1.6"/>`
    + F`<path d="M${cx - 20} ${ly + 9}L${cx} ${ly - 6}L${cx + 20} ${ly + 9}Z" fill="#2a2b35" ${ln(2.2)}/><circle cx="${cx}" cy="${ly - 9}" r="3.5" fill="#2a2b35" ${ln(1.8)}/><rect x="${cx - 16}" y="${ly + 31}" width="32" height="5" rx="2" fill="#2a2b35" ${ln(1.8)}/>`;
  return pair(w, h, [back, glowDef(id, '#ffb347', .5)], [front, glowDef(id + 'h', '#ffc46a', .55)], null, b);
}
/* a floor lamp (inside): a warm shade on a pole, side-on. Foot: bottom (y = h − 6). */
export function floorLamp({ w = 70, h = 170 } = {}) {
  const id = uid(), cx = w / 2, b = h - 6;
  return wrap(w, h, shade(cx, b, 18, 5) + F`<circle cx="${cx}" cy="34" r="${w * .7}" fill="url(#${id})"/><ellipse cx="${cx}" cy="${b - 3}" rx="15" ry="5" fill="#3b2a1e" ${ln(2)}/><rect x="${cx - 3}" y="40" width="6" height="${b - 44}" fill="#6b4a2c" ${ln(2)}/>`
    + F`<path d="M${cx - 15} 14h30l9 34h-48Z" fill="#ffcf73" ${ln(2.4)}/><path d="M${cx - 12} 18h8l-3 26h-11Z" fill="#fff0c2" opacity=".85"/><path d="M${cx - 24} 48h48" stroke="#c9792f" stroke-width="4"/>`, '', glowDef(id, '#ffb347', .5));
}

/* the chimney: it goes up from the fireplace inside, against the north wall (depth d0 … d1 from the wall's line), and
   comes out of the roof's north slope right there, rise over it */
export const CHIMNEY = { d0: 12, d1: 102, rise: 150 };
export const chimneyTop = (wallH, roofH = 520, d = 1600) => wallH + roofH * Math.min(1, CHIMNEY.d1 / (d / 2)) + CHIMNEY.rise;
/* ---------- the cabin, outside ----------
   Round orange-brown logs, a steep dark green shingle roof whose ridge runs east-west, a big A-frame gable over the back
   door (the triangle window) facing the deck, a stone chimney, glowing windows, string lights along the eave, and a
   little porch roof over the front door on the north side (the door itself faces away). x positions are from the
   cabin's west wall. Box: w × (d + 290); its bottom is the south wall's foot (foot: y = h), the footprint's north
   edge is at y = h − d. */
export function cabinOutside({ w = 3000, d = 1600, h = d + 290, wallH = 170, roofH = 520, backDoor = 1500, frontDoor = 700, chimney = 1000, gable = 760, windows = [280, 640, 1000, 2240, 2640], dormers = [560, 2440], lights = true } = {}) {
  const id = uid(), Y0 = h - d, B = h, wt = B - wallH, sE = wt + 36, nE = Y0 - wallH - 50, ridge = Y0 + d / 2 - wallH - roofH;
  const gx = backDoor, gw = gable / 2, gH = 330, gA = wt - gH, gR = gA - gH * d / 2 / roofH;
  const roofAt = dep => wallH + roofH * Math.min(1, dep / (d / 2));
  const defs = logDef(id + 'l', B % 17) + shingleDef(id + 's') + shingleDef(id + 'n', .42) + shingleDef(id + 'v', 1, 90) + glassDef(id + 'g') + glowDef(id + 'w', '#ffb347', .42) + glowDef(id + 'p', '#ffbe5c', .6) + stoneStripDef(id + 'f', 16, B - 16)
    + `<linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d4ff" stop-opacity=".14"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>`
    + `<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".1"/><stop offset=".5" stop-color="#bfe0ff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>`;
  let s = '';
  /* the front porch on the north side: a lantern's glow and a little gable roof poking out past the north eave */
  const fd = frontDoor;
  s += F`<ellipse cx="${fd}" cy="${Y0 - 170}" rx="150" ry="70" fill="url(#${id}p)" class="hg-flicker"/>`;
  s += F`<path d="M${fd - 100} ${Y0 - 238}L${fd} ${Y0 - 290}V${Y0 - 200}L${fd - 100} ${Y0 - 148}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${fd + 100} ${Y0 - 238}L${fd} ${Y0 - 290}V${Y0 - 200}L${fd + 100} ${Y0 - 148}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${fd + 100} ${Y0 - 238}L${fd} ${Y0 - 290}V${Y0 - 200}L${fd + 100} ${Y0 - 148}Z" fill="#000" opacity=".3"/>`
    + F`<path d="M${fd - 104} ${Y0 - 236}L${fd} ${Y0 - 292}L${fd + 104} ${Y0 - 236}" stroke="${O}" stroke-width="13" fill="none" stroke-linejoin="round"/><path d="M${fd - 104} ${Y0 - 236}L${fd} ${Y0 - 292}L${fd + 104} ${Y0 - 236}" stroke="#d0803e" stroke-width="8" fill="none" stroke-linejoin="round"/>`;
  /* the north slope (seen steeply, so short), then the chimney that comes up through it */
  s += R(0, nE, w, ridge - nE, `url(#${id}n)`, ln(3)) + R(0, nE, w, ridge - nE, '#000', 'opacity=".28"');
  const cw = 116, cd0 = CHIMNEY.d0, cd1 = CHIMNEY.d1, cz = chimneyTop(wallH, roofH, d), ct = Y0 + cd0 - cz, cf = Y0 + cd1 - cz, cb = Y0 + cd1 - roofAt(cd1), cxl = chimney - cw / 2;
  s += F`<g class="hg-smoke" style="animation-delay:-1s"><circle cx="${chimney + 6}" cy="${ct - 6}" r="20" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-3.4s"><circle cx="${chimney - 4}" cy="${ct - 6}" r="16" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-5.6s"><circle cx="${chimney + 2}" cy="${ct - 6}" r="18" fill="#c9cfdb"/></g>`;
  s += stones(cxl, cf, cw, cb - cf, 11, 20) + R(cxl, cf, cw, cb - cf, 'none', ln(2.6)) + R(cxl, cf, cw, cb - cf, '#000', 'opacity=".18"')
    + R(cxl - 4, cb - 12, cw + 8, 14, '#4a4d56', ln(2.2))
    + stones(cxl, ct, cw, cf - ct, 12, 20) + R(cxl, ct, cw, cf - ct, 'none', ln(2.6))
    + R(cxl - 8, ct - 6, cw + 16, 16, '#5e626c', ln(2.4)) + R(cxl - 8, ct + 10, cw + 16, 8, '#43464f', ln(2)) + F`<rect x="${chimney - 26}" y="${ct + 22}" width="52" height="${cf - ct - 34}" rx="6" fill="#141418" ${ln(2)}/>`;
  /* the south wall: logs on a stone foundation, log ends at the corners */
  s += R(12, wt, w - 24, wallH, `url(#${id}l)`, ln(3)) + R(12, B - 16, w - 24, 16, `url(#${id}f)`, ln(2.2));
  for (let y = B - 16 - 8.5; y > wt + 6; y -= 17) for (const x of [12, w - 12]) s += F`<circle cx="${x}" cy="${y}" r="9" fill="#dca36a" stroke="#5e2a10" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#a0602c" stroke-width="1.3"/>`;
  /* windows: a warm glow on the logs around each, a frame, the glass, a cross and a sill */
  const win = (x, ww, hh, yb) => F`<ellipse cx="${x}" cy="${yb - hh / 2}" rx="${ww * 1.25}" ry="${hh * 1.2}" fill="url(#${id}w)"/>`
    + R(x - ww / 2, yb - hh, ww, hh, '#d98a4a', `rx="3" ${ln(2.6)}`) + R(x - ww / 2 + 7, yb - hh + 7, ww - 14, hh - 14, `url(#${id}g)`, ln(1.6))
    + F`<path d="M${x - ww / 2 + 7} ${yb - hh + 7}h${ww * .2}l${-ww * .2} ${hh * .45}ZM${x + ww / 2 - 7} ${yb - hh + 7}h${-ww * .2}l${ww * .2} ${hh * .45}Z" fill="#c2562e" opacity=".85"/>`
    + F`<path d="M${x} ${yb - hh + 7}V${yb - 7}M${x - ww / 2 + 7} ${yb - hh / 2}H${x + ww / 2 - 7}" stroke="#8a4a1f" stroke-width="5"/>` + R(x - ww / 2 - 8, yb - 4, ww + 16, 9, '#c87a3c', ln(2.2));
  for (const x of windows) s += win(x, 124, 80, B - 38);
  s += win(gx - 150, 92, 98, B - 30) + win(gx + 150, 92, 98, B - 30);
  /* the back door (glass, lit) and two lanterns beside it */
  s += R(gx - 40, B - 120, 80, 120, '#d98a4a', ln(2.6)) + R(gx - 32, B - 112, 64, 112, '#8a4520', ln(2)) + R(gx - 24, B - 104, 48, 64, `url(#${id}g)`, ln(1.6))
    + F`<path d="M${gx} ${B - 104}V${B - 40}M${gx - 24} ${B - 72}H${gx + 24}" stroke="#8a4a1f" stroke-width="4"/><circle cx="${gx + 20}" cy="${B - 50}" r="3.4" fill="#e8b84a" ${ln(1.4)}/>` + R(gx - 44, B - 6, 88, 6, '#6e3a1a', ln(1.6));
  for (const x of [gx - 66, gx + 66]) s += F`<circle cx="${x}" cy="${B - 92}" r="38" fill="url(#${id}p)" class="hg-flicker" style="animation-delay:-${x % 3}s"/><rect x="${x - 7}" y="${B - 104}" width="14" height="20" rx="3" fill="#ffd98a" ${ln(2)}/><path d="M${x - 9} ${B - 105}h18M${x} ${B - 84}v8" stroke="${O}" stroke-width="3"/>`;
  /* the south slope (notched where the gable comes forward), its gradient, the eave's fascia and shadow */
  const sp = F`M0 ${ridge}H${w}V${sE}H${gx + gw}V${wt}H${gx - gw}V${sE}H0Z`;
  s += F`<path d="${sp}" fill="url(#${id}s)" ${ln(3)}/><path d="${sp}" fill="url(#${id}r)"/><path d="${sp}" fill="url(#${id}m)"/>`
    + R(12, sE + 2, gx - gw - 12, 12, '#000', 'opacity=".28"') + R(gx + gw, sE + 2, w - 12 - gx - gw, 12, '#000', 'opacity=".28"')
    + R(-6, sE - 12, gx - gw + 6, 13, '#c26d32', ln(2.2)) + R(gx + gw, sE - 12, w - gx - gw + 6, 13, '#c26d32', ln(2.2));
  s += R(-6, ridge - 8, w + 12, 15, '#1d3a30', ln(2.6)) + F`<path d="M0 ${ridge - 4}H${w}" stroke="#7fb89a" stroke-width="2" opacity=".45"/>`;
  s += R(-10, nE - 4, 14, sE - nE + 4, '#c26d32', ln(2.4)) + R(w - 4, nE - 4, 14, sE - nE + 4, '#c26d32', ln(2.4));
  /* dormers on the south slope, each with a lit window */
  const yS = (sb, H) => B - sb - H, sAt = H => (H - wallH) * (d / 2) / roofH;
  for (const dx of dormers) {
    const s0 = 300, hb = wallH + roofH * s0 / (d / 2), he = hb + 74, ha = he + 84, hw = 112;
    const fy = yS(s0, he), by = yS(s0, hb), ay = yS(s0, ha), ry = yS(sAt(ha), ha), ey = yS(sAt(he), he);
    s += F`<path d="M${dx - hw - 14} ${by + 10}H${dx + hw + 14}" stroke="#000" stroke-width="14" opacity=".25"/>`
      + F`<path d="M${dx - hw - 10} ${fy + 6}L${dx} ${ay - 8}L${dx} ${ry}L${dx - hw - 10} ${ey}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${dx + hw + 10} ${fy + 6}L${dx} ${ay - 8}L${dx} ${ry}L${dx + hw + 10} ${ey}Z" fill="url(#${id}v)" ${ln(2.6)}/><path d="M${dx + hw + 10} ${fy + 6}L${dx} ${ay - 8}L${dx} ${ry}L${dx + hw + 10} ${ey}Z" fill="#000" opacity=".3"/>`
      + R(dx - hw, fy, 2 * hw, by - fy, `url(#${id}l)`, ln(2.6)) + F`<path d="M${dx - hw} ${fy}H${dx + hw}L${dx} ${ay}Z" fill="url(#${id}l)" ${ln(2.6)}/>`
      + win(dx, 120, 54, by - 10) + F`<path d="M${dx - 32} ${fy - 8}H${dx + 32}L${dx} ${ay + 18}Z" fill="url(#${id}g)" ${ln(2)}/>`
      + F`<path d="M${dx - hw - 12} ${fy + 8}L${dx} ${ay - 9}L${dx + hw + 12} ${fy + 8}" stroke="${O}" stroke-width="15" fill="none" stroke-linejoin="round"/><path d="M${dx - hw - 12} ${fy + 8}L${dx} ${ay - 9}L${dx + hw + 12} ${fy + 8}" stroke="#d0803e" stroke-width="10" fill="none" stroke-linejoin="round"/>`;
  }
  /* the gable over the back door: its two roof planes, then the log triangle with the big window and its trim */
  const L = F`M${gx - gw - 26} ${wt + 26}L${gx} ${gA - 24}L${gx} ${gR}Z`, Rt = F`M${gx + gw + 26} ${wt + 26}L${gx} ${gA - 24}L${gx} ${gR}Z`;
  s += F`<path d="${L}" fill="url(#${id}v)" ${ln(3)}/><path d="${L}" fill="#a8d4ff" opacity=".07"/><path d="${Rt}" fill="url(#${id}v)" ${ln(3)}/><path d="${Rt}" fill="#000" opacity=".3"/><path d="M${gx} ${gA - 20}V${gR}" stroke="#1d3a30" stroke-width="12"/><path d="M${gx} ${gA - 20}V${gR}" stroke="#7fb89a" stroke-width="2" opacity=".4"/>`;
  const tw = gw * 200 / 380, ty = wt - 16, ta = gA + 100, my = wt - 90, mw = tw * (my - ta) / (ty - ta);
  s += F`<path d="M${gx - gw} ${wt}H${gx + gw}L${gx} ${gA}Z" fill="url(#${id}l)" ${ln(3)}/>`
    + F`<ellipse cx="${gx}" cy="${(ty + ta) / 2 + 20}" rx="${tw * 1.3}" ry="${(ty - ta) * .9}" fill="url(#${id}w)"/>`
    + F`<path d="M${gx - tw} ${ty}H${gx + tw}L${gx} ${ta}Z" fill="url(#${id}g)" stroke="${O}" stroke-width="15" stroke-linejoin="round"/><path d="M${gx - tw} ${ty}H${gx + tw}L${gx} ${ta}Z" fill="none" stroke="#d98a4a" stroke-width="9" stroke-linejoin="round"/>`
    + F`<path d="M${gx} ${ta + 6}V${ty}M${gx - mw} ${my}H${gx + mw}" stroke="#8a4a1f" stroke-width="6"/><path d="M${gx - tw * .55} ${ty - 4}L${gx - tw * .3} ${my + 4}" stroke="#fff6d8" stroke-width="5" opacity=".45" stroke-linecap="round"/>`
    + R(gx - gw * (gA + 70 - gA) / gH - 6, gA + 62, 2 * gw * 70 / gH + 12, 14, '#d0803e', ln(2.2)) + R(gx - 7, gA + 4, 14, 60, '#d0803e', ln(2.2))
    + R(gx - gw - 14, wt - 8, gable + 28, 16, '#d0803e', ln(2.4));
  s += F`<path d="M${gx - gw - 26} ${wt + 26}L${gx} ${gA - 24}L${gx + gw + 26} ${wt + 26}" stroke="${O}" stroke-width="24" fill="none" stroke-linejoin="round"/><path d="M${gx - gw - 26} ${wt + 26}L${gx} ${gA - 24}L${gx + gw + 26} ${wt + 26}" stroke="#d0803e" stroke-width="17" fill="none" stroke-linejoin="round"/><path d="M${gx - gw - 22} ${wt + 20}L${gx} ${gA - 28}" stroke="#f0a862" stroke-width="3" fill="none" opacity=".6"/>`;
  if (lights) s += stringLights(30, gx - gw - 30, sE + 2, 12, 170, 30, 1) + stringLights(gx + gw + 30, w - 30, sE + 2, 12, 170, 30, 2) + stringLights(gx - gw + 20, gx + gw - 20, wt + 12, 10, 150, 30, 3);
  return wrap(w, h, s, 'hg-cabin', defs);
}

/* ---------- the cabin, inside ---------- */
/* a log wall cut away. axis 'x' runs east-west, w long: box w × (t + wallH): the cut top (t deep), then the face that
   looks south; doors are gaps [from, to] along it, windows [from, to] look out at the grass. axis 'y' runs north-south:
   w = t, box t × (length + wallH): the cut top, then the south end's log ends; doors are gaps [from, to] along y.
   Foot: y = h (an 'x' wall); a 'y' wall is long in depth, so give it a foot per gap-free piece or keep it low. */
export function logWall({ w, h, axis = 'x', wallH = 40, t = 24, doors = [], windows = [] } = {}) {
  w = axis === 'x' ? w || 400 : t;
  const id = uid(), len = axis === 'x' ? w : (h || 400 + wallH) - wallH;
  h = axis === 'x' ? t + wallH : len + wallH;
  const segs = [], ds = [...doors].sort((a, b) => a[0] - b[0]);
  let at = 0;
  for (const [a, b] of ds) { if (a > at) segs.push([at, a]); at = Math.max(at, b); }
  if (at < len) segs.push([at, len]);
  let s = '', defs = logDef(id, h % 17);
  if (axis === 'x') {
    for (const [a, b] of segs) {
      s += R(a, t, b - a, wallH, `url(#${id})`, ln(2.6)) + R(a, 0, b - a, t, '#c98a52', ln(2.6)) + F`<path d="M${a + 3} ${t * .4}H${b - 3}" stroke="#e8b27a" stroke-width="3" opacity=".7"/><path d="M${a + 3} ${t - 4}H${b - 3}" stroke="#8a4f22" stroke-width="2"/>`;
      if (a > 0) s += R(a - 2, 0, 10, h, '#6e3a1a', ln(2));
      if (b < len) s += R(b - 8, 0, 10, h, '#6e3a1a', ln(2));
    }
    if (windows.length) {   // (seen from inside, looking down a little: the grass outside, in the dark)
      defs += F`<linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173528"/><stop offset="1" stop-color="#24503d"/></linearGradient>`;
      for (const [a, b] of windows) {
        const wy = t + wallH * .2, wh = wallH * .5, r = rnd(a + 7);
        let grass = '';
        for (let i = 0; i < 9; i++) { const gx = a + 8 + r() * (b - a - 16), gy = wy + 10 + r() * (wh - 14); grass += F`<path d="M${gx - 3} ${gy}l2 -7l1 7M${gx + 1} ${gy}l3 -6" stroke="#3f7a52" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
        grass += F`<path d="M${a} ${wy + wh * .3}h${b - a}" stroke="#5aa0ff" stroke-width="${wh * .5}" opacity=".05"/>`;
        s += R(a - 8, wy - 8, b - a + 16, wh + 16, '#d98a4a', `rx="3" ${ln(2.4)}`) + R(a, wy, b - a, wh, `url(#${id}n)`, ln(1.6)) + grass + F`<path d="M${(a + b) / 2} ${wy}V${wy + wh}M${a} ${wy + wh / 2}H${b}" stroke="#8a4a1f" stroke-width="5"/>` + R(a - 12, wy + wh + 6, b - a + 24, 8, '#c87a3c', ln(2));
      }
    }
  } else {
    for (const [a, b] of segs) {
      s += R(0, a, w, b - a, '#c98a52', ln(2.6)) + F`<path d="M${w * .4} ${a + 3}V${b - 3}" stroke="#e8b27a" stroke-width="3" opacity=".7"/>`;
      s += R(0, b, w, wallH, '#8f4c22', ln(2.6));
      for (let y = b + wallH - 8.5; y > b + 4; y -= 17) s += F`<ellipse cx="${w / 2}" cy="${y}" rx="${w / 2 - 1.5}" ry="8" fill="#dca36a" stroke="#5e2a10" stroke-width="1.4"/><ellipse cx="${w / 2}" cy="${y}" rx="${w / 4}" ry="4" fill="none" stroke="#a0602c" stroke-width="1.2"/>`;
    }
  }
  return wrap(w, h, s, 'hg-wall', defs);
}
/* ---------- doors ---------- */
/* a door's face, w × h: a frame, four sunk panels, a brass knob (knob: 'l' | 'r', the side away from the hinge). Foot: y = h. */
export function doorFace({ w = 150, h = 150, knob = 'r' } = {}) {
  const pw = (w - 30) / 2, ph = (h - 34) / 2, kx = knob === 'l' ? 12 : w - 12;
  let p = '';
  for (const [x, y] of [[10, 10], [20 + pw, 10], [10, 24 + ph], [20 + pw, 24 + ph]]) p += R(x, y, pw, ph, '#9a5526', `rx="3" ${ln(1.6)}`) + R(x + 3, y + 3, pw - 6, 4, '#c98a52', 'opacity=".6"');
  return wrap(w, h, R(0, 0, w, h, '#b06a35', `rx="3" ${ln(2.4)}`) + p + F`<circle cx="${kx}" cy="${h * .55}" r="4.5" fill="#e8b84a" ${ln(1.4)}/>`, 'hg-door');
}
/* the inside doors copy the porch's door (cabinOutside's back door): an orange frame, a dark brown door, a lit window of
   four panes in its upper half and a low panel; quad(u0, u1, v0, v1) and q(u, v) map the door's face (u along it, v up) */
const porchGlassDef = '<linearGradient id="hg-porch-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="#ffbd57"/><stop offset="1" stop-color="#f08a32"/></linearGradient>';
function porchFace(quad, q, frame = true) {
  return (frame ? F`<path d="${quad(-.06, 1.06, 0, 1.08)}" fill="#d98a4a" ${ln(2.4)}/>` : '')
    + F`<path d="${quad(0, 1, 0, 1)}" fill="#8a4520" ${ln(2.2)}/><path d="${quad(.16, .84, .5, .88)}" fill="url(#hg-porch-glass)" ${ln(1.6)}/>`
    + F`<path d="M${q(.5, .5)}L${q(.5, .88)}M${q(.16, .69)}L${q(.84, .69)}" stroke="#8a4a1f" stroke-width="3.4"/><path d="${quad(.16, .84, .1, .38)}" fill="#6e3a1a" ${ln(1.4)}/>`;
}
/* a shut door in a north-south wall, seen a little from its west side the way the deck's door is seen: its top edge in
   the wall's line (x = k), its face sloping down to its foot k to the west, so its panels and knob show; len long (down
   the screen), h high. Box (k + 8) × (len + h); the foot runs down x = 0 from y = h to h + len. knob: 'a' (north end) |
   'b' (south end). */
export function doorSide({ len = 150, h = 110, k = 60, knob = 'b' } = {}) {
  const q = (u, v) => `${n1(v * k)} ${n1((1 - v) * h + u * len)}`, quad = (u0, u1, v0, v1) => `M${q(u0, v0)}L${q(u1, v0)}L${q(u1, v1)}L${q(u0, v1)}Z`;
  const ku = knob === 'a' ? .1 : .9, kx = .48 * k, ky = (1 - .48) * h + ku * len;
  return wrap(k + 8, len + h, F`<path d="M${q(0, 0)}L${q(1, 0)}L${n1(8 + 14)} ${n1(h + len + 4)}L${n1(-6)} ${n1(h + len + 4)}Z" fill="#000" opacity=".28"/>`
    + porchFace(quad, q) + F`<circle cx="${n1(kx)}" cy="${n1(ky)}" r="4.5" fill="#e8b84a" ${ln(1.4)}/>`, 'hg-door', porchGlassDef);
}
/* a door standing open in a north-south wall, swung part way into the room: an upright panel from its hinge (on the
   floor at 0, 0) to its free end (dx, dy) on the floor, h high, drawn the way the deck's open door is: its face, panels,
   knob and the free end's edge. Box |dx| + 8 × (|dy| + h); returns { svg, ox, oy }: the hinge's foot in the box. */
export function doorSwing({ len = 150, h = 110, dx = -130, dy = 75 } = {}) {
  const x0 = Math.min(0, dx) - 4, y0 = Math.min(0, dy) - h - 4, w = Math.abs(dx) + 8, bh = Math.abs(dy) + h + 8, ox = -x0, oy = -y0;
  const q = (u, v) => `${n1(ox + u * dx)} ${n1(oy + u * dy - v * h)}`, quad = (u0, u1, v0, v1) => `M${q(u0, v0)}L${q(u1, v0)}L${q(u1, v1)}L${q(u0, v1)}Z`;
  const svg = wrap(w, bh, F`<path d="M${q(0, 0)}L${q(1, 0)}L${n1(ox + dx + 10)} ${n1(oy + dy + 4)}L${n1(ox + 10)} ${n1(oy + 4)}Z" fill="#000" opacity=".22"/>`
    + porchFace(quad, q, false) + F`<path d="M${q(1, 0)}L${q(1, 1)}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${q(1, 0)}L${q(1, 1)}" stroke="#c97a3e" stroke-width="2.6" stroke-linecap="round"/>`
    + F`<circle cx="${n1(ox + .88 * dx)}" cy="${n1(oy + .88 * dy - .48 * h)}" r="4.5" fill="#e8b84a" ${ln(1.4)}/>`, 'hg-door', porchGlassDef);
  return { svg, ox, oy, w, h: bh };
}
/* a door swung open toward the viewer by ang degrees (from shut): its face turned, hinge on the left. Box
   len·cos(ang) × (h + len·sin(ang)); the hinge's foot at (0, h), the open edge's at (w, box height). */
export function doorAjar({ len = 150, h = 150, ang = 60 } = {}) {
  const r = ang * Math.PI / 180, cx = len * Math.cos(r), sy = len * Math.sin(r), q = (u, v) => `${n1(u * cx)} ${n1(v * h + u * sy)}`;
  return wrap(cx, h + sy, F`<path d="M${q(0, 0)}L${q(1, 0)}L${q(1, 1)}L${q(0, 1)}Z" fill="#b06a35" ${ln(2.4)}/><path d="M${q(.15, .08)}L${q(.85, .08)}L${q(.85, .45)}L${q(.15, .45)}ZM${q(.15, .55)}L${q(.85, .55)}L${q(.85, .92)}L${q(.15, .92)}Z" fill="#9a5526" ${ln(1.6)}/>`
    + F`<circle cx="${n1(.9 * cx)}" cy="${n1(.55 * h + .9 * sy)}" r="4" fill="#e8b84a" ${ln(1.2)}/>`, 'hg-door');
}
/* an open doorway seen from outside: the warm room behind it. Box w × h. */
export function doorway({ w = 64, h = 112 } = {}) {
  const id = uid();
  return wrap(w, h, R(0, 0, w, h, `url(#${id})`, ln(2)), 'hg-doorway', `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#c8662a"/></linearGradient>`);
}
/* the fireplace, against the north wall: a stone chimney breast with a warm, flickering fire and a mantel (with a little
   rubber duck on it); a raised stone hearth in front. w × (72 + wallH). back: the breast, foot y = 30 + wallH (its
   face); front: the hearth, foot y = h. */
export function fireplace({ w = 280, h, wallH = 170 } = {}) {
  const id = uid(), d = 72; h = h || d + wallH;
  const F0 = 30 + wallH - (d + wallH - h);   // the breast's face on the floor
  const top = F0 - wallH, ox = w / 2, ow = w * .25, ob = F0 - 12, ot = F0 - 105;
  let b = stones(0, top + 30, w, wallH, 21, 24) + R(0, top + 30, w, wallH, 'none', ln(3)) + stones(0, top, w, 30, 22, 15) + R(0, top, w, 30, 'none', ln(2.6)) + R(0, top, w, 30, '#fff', 'opacity=".08"');
  /* the firebox: an arch, sooty inside, bricks glowing, logs and the fire */
  const arch = F`M${ox - ow} ${ob}V${ot + ow * .55}Q${ox - ow} ${ot} ${ox} ${ot}Q${ox + ow} ${ot} ${ox + ow} ${ot + ow * .55}V${ob}Z`;
  b += F`<path d="${arch}" fill="#1a1110" stroke="#4a4d56" stroke-width="12"/><path d="${arch}" fill="url(#${id}f)"/><path d="${arch}" fill="none" ${ln(2.6)}/>`
    + F`<path d="M${ox - ow * .7} ${ob - 6}L${ox + ow * .6} ${ob - 14}M${ox - ow * .6} ${ob - 14}L${ox + ow * .7} ${ob - 6}" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M${ox - ow * .7} ${ob - 6}L${ox + ow * .6} ${ob - 14}M${ox - ow * .6} ${ob - 14}L${ox + ow * .7} ${ob - 6}" stroke="#6b3f22" stroke-width="9" stroke-linecap="round"/>`
    + fire(ox, ob - 10, .85) + F`<ellipse cx="${ox}" cy="${ob - 4}" rx="${ow * .8}" ry="6" fill="#ff7a1f" opacity=".8"/>`;
  /* the mantel and what sits on it */
  const my = F0 - 134;
  b += R(-10, my - 14, w + 20, 14, '#c47a3e', ln(2.4)) + R(-10, my, w + 20, 14, '#9a5526', ln(2.4))
    + F`<rect x="22" y="${my - 40}" width="9" height="26" fill="#f4ecd8" ${ln(1.6)}/><path d="M26.5 ${my - 52}q-5 7 0 11q5 -4 0 -11Z" fill="#ffc23f" stroke="#c46a12" stroke-width="1"/><circle cx="26.5" cy="${my - 46}" r="12" fill="url(#${id}c)" class="hg-flicker"/>`
    + F`<rect x="${w - 31}" y="${my - 34}" width="9" height="20" fill="#f4ecd8" ${ln(1.6)}/><path d="M${w - 26.5} ${my - 46}q-5 7 0 11q5 -4 0 -11Z" fill="#ffc23f" stroke="#c46a12" stroke-width="1"/><circle cx="${w - 26.5}" cy="${my - 40}" r="12" fill="url(#${id}c)" class="hg-flicker" style="animation-delay:-1.7s"/>`
    + F`<g transform="translate(${w * .62} ${my - 14})"><path d="M-12 0C-14 -6 -12 -11 -8 -12C-8 -18 -2 -21 2 -18C6 -16 6 -11 4 -9C10 -10 13 -6 12 0Z" fill="#ffd23f" ${ln(1.6)}/><path d="M5 -16l5 1.5l-5 1.5Z" fill="#ff9a1f"/><circle cx="2.5" cy="-16" r="1.2" fill="${O}"/></g>`;
  b += F`<ellipse cx="${ox}" cy="${ot + 40}" rx="${w * .7}" ry="${wallH * .5}" fill="url(#${id}g)" class="hg-flicker"/>`;
  const hy = F0 - 12;
  const f = stones(-6, hy, w + 12, d - 30, 23, 21) + R(-6, hy, w + 12, d - 30, 'none', ln(2.6)) + R(-6, hy, w + 12, d - 30, '#ff9a3a', 'opacity=".12"') + R(-6, hy + d - 30, w + 12, 12, '#4f525b', ln(2.4));
  const defs = F`<radialGradient id="${id}f" cx=".5" cy=".85" r=".7"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".9"/><stop offset=".5" stop-color="#b8441a" stop-opacity=".5"/><stop offset="1" stop-color="#1a1110" stop-opacity="0"/></radialGradient>` + glowDef(id + 'c', '#ffb347', .55) + glowDef(id + 'g', '#ff9a3a', .3);
  return pair(w, h, [b, defs], [f], F0, h);
}
/* a couch: seats 3 or 2 (cushions visible), facing 'n' (its back toward the viewer; the cabin's couches face the
   fireplace) or 's'. Footprint w × 110; box w × 174. back: the seat and cushions, foot y = 64 (the footprint's north
   edge); front: the backrest (or the seat's front) and the arms, foot y = h. A duck sits on cushion i at
   x = 30 + (i + .5) × (w − 60) / seats, depth .55 of the couch, 30 high. facing 'e': turned to face east, len long down
   the screen and w across (footprint w × len; box w × (len + 64)): the backrest along its west side, an arm at each
   end, seen from above; back: the seat, its cushions and the north arm, foot y = 64; front: the backrest and the south
   arm, foot y = h. A duck sits on
   cushion i at x = 62, y = 26 + (i + .5) × (len − 52) / seats, 32 high. */
export function couch({ w = 500, h = 174, seats = 3, color = '#a8382c', facing = 'n', throwOn = true, len = 360 } = {}) {
  if (facing === 'e' || facing === 'w') return sideCouch({ w, len, seats, color, flip: facing === 'w' });
  const Y = h - 110, arm = 30, cw = (w - 2 * arm) / seats, hi = mix(color, 255, .2), lo = mix(color, 0, .3), lo2 = mix(color, 0, .45);
  const cushions = (y0, y1) => Array.from({ length: seats }, (_, i) => { const x = arm + i * cw + 3; return R(x, y0, cw - 6, y1 - y0, hi, `rx="12" ${ln(2.4)}`) + R(x + 8, y0 + 5, cw - 22, (y1 - y0) * .25, '#fff', 'rx="6" opacity=".14"') + F`<circle cx="${x + cw / 2 - 3}" cy="${(y0 + y1) / 2 + 4}" r="2.2" fill="${lo2}"/>`; }).join('');
  const arms = [0, w - arm].map(x => R(x, Y - 44, arm, 110, color, `rx="12" ${ln(2.4)}`) + R(x + 5, Y - 40, 8, 100, '#fff', 'rx="4" opacity=".12"')).join('');
  const feet = [8, w - 20].map(x => R(x, h - 7, 12, 7, '#3b2414', ln(1.6))).join('');
  let back, front;
  if (facing === 's') {
    back = shade(w / 2, Y + 60, w / 2, 50, .25) + R(arm - 4, Y - 64, w - 2 * arm + 8, 35, color, `rx="10" ${ln(2.4)}`) + R(arm - 4, Y - 29, w - 2 * arm + 8, 40, lo, ln(2.4))
      + Array.from({ length: seats }, (_, i) => R(arm + i * cw + 6, Y - 40, cw - 12, 46, hi, `rx="14" ${ln(2.2)}`)).join('') + R(arm, Y + 5, w - 2 * arm, 75, lo, ln(2.4)) + cushions(Y + 6, Y + 80);
    front = R(0, Y + 66, w, 44, lo, `rx="6" ${ln(2.4)}`) + R(arm, Y + 80, w - 2 * arm, 30, lo, ln(2.4)) + F`<path d="M${arm + 6} ${Y + 88}H${w - arm - 6}" stroke="${lo2}" stroke-width="2" stroke-dasharray="6 5"/>` + arms + feet;
  } else {
    back = shade(w / 2, Y + 60, w / 2, 50, .25) + R(arm, Y - 30, w - 2 * arm, 76, lo, ln(2.4)) + cushions(Y - 28, Y + 44);
    front = R(0, Y + 46, w, 64, lo, `rx="6" ${ln(2.4)}`) + F`<path d="M${arm + 6} ${Y + 56}H${w - arm - 6}" stroke="${lo2}" stroke-width="2" stroke-dasharray="6 5"/>`
      + R(arm - 2, Y + 11, w - 2 * arm + 4, 35, color, `rx="12" ${ln(2.4)}`) + R(arm + 10, Y + 15, w - 2 * arm - 20, 8, '#fff', 'rx="4" opacity=".14"');
    if (throwOn) { const tx = w - arm - 110; front += F`<path d="M${tx} ${Y + 9}h76v${88}l-10 6l-10 -6l-10 6l-10 -6l-10 6l-10 -6l-10 6l-6 -6Z" fill="#e8c35a" ${ln(2.2)}/><path d="M${tx + 18} ${Y + 9}v88M${tx + 50} ${Y + 9}v90M${tx} ${Y + 34}h76M${tx} ${Y + 70}h76" stroke="#3d6f8c" stroke-width="5" opacity=".75"/>`; }
    front += arms + feet;
  }
  return pair(w, h, [back], [front], Y, h);
}

function sideCouch({ w = 100, len = 360, seats = 2, color = '#3d6e4f', flip = false }) {
  const U = 64, h = len + U, Y = h - len, hi = mix(color, 255, .2), lo = mix(color, 0, .3), lo2 = mix(color, 0, .45), arm = 26, bw = 28, AH = 46, SH = 32;
  const top = (x0, x1, y0, y1, z, fill, more = '') => R(x0, y0 - z, x1 - x0, y1 - y0, fill, more);   // a top face at height z (footprint y0 … y1)
  /* back: the shadow, the seat and its cushions, the north arm; front: the backrest (it runs the whole length, so its
     south end is at the front) and the south arm */
  let back = shade(w / 2, h - 6, w / 2 + 6, 16, .25) + top(bw, w, Y, h, SH, lo, ln(2.4));
  const cl = (len - 2 * arm) / seats;
  for (let i = 0; i < seats; i++) {
    const y0 = Y + arm + i * cl + 3, y1 = y0 + cl - 6;
    back += top(bw + 4, w - 4, y0, y1, SH, hi, `rx="12" ${ln(2.4)}`) + top(bw + 9, w - 9, y0 + 4, y0 + 10, SH, '#fff', 'rx="3" opacity=".14"') + F`<circle cx="${(bw + w) / 2}" cy="${(y0 + y1) / 2 - SH}" r="2.2" fill="${lo2}"/>`;
  }
  back += top(bw, w, Y, Y + arm, AH, color, `rx="10" ${ln(2.4)}`) + top(bw + 6, w - 6, Y + 4, Y + 9, AH, '#fff', 'rx="2" opacity=".12"');
  const front = top(0, bw, Y, h, U, color, `rx="8" ${ln(2.4)}`) + top(5, 12, Y + 6, h - 6, U, '#fff', 'rx="3" opacity=".12"') + R(0, h - U, bw, U, lo, ln(2.4))
    + top(bw, w, h - arm, h, AH, color, `rx="10" ${ln(2.4)}`) + top(bw + 6, w - 6, h - arm + 4, h - arm + 9, AH, '#fff', 'rx="2" opacity=".12"') + R(bw, h - AH, w - bw, AH, lo, ln(2.4))
    + F`<path d="M${bw + 6} ${h - 30}H${w - 8}" stroke="${lo2}" stroke-width="2" stroke-dasharray="6 5"/>` + [6, w - 18].map(x => R(x, h - 7, 12, 7, '#3b2414', ln(1.6))).join('');
  const turn = b => flip ? F`<g transform="translate(${w} 0) scale(-1 1)">${b}</g>` : b;   // (facing west: the same couch, mirrored)
  return pair(w, h, [turn(back)], [turn(front)], Y, h);
}

/* ---------- the living corner and the rest of the great room ---------- */
/* a low coffee table on the rug, seen from above: its top (footprint w × d) at z, the apron and two front legs under it;
   papers, a magazine, a mug of cocoa, a glass of juice and a can of soda on it. Box w × (d + z). Foot: y = h. */
export function coffeeTable({ w = 150, d = 100, z = 38 } = {}) {
  const h = d + z;
  const paper = (x, y, a, c = '#f6f3ea') => F`<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-17" y="-12" width="34" height="24" fill="${c}" ${ln(1.6)}/><path d="M-12 -6h22M-12 -1h18M-12 4h20" stroke="#9aa0aa" stroke-width="1.4"/></g>`;
  const cup = (x, y, top, side, k = 1) => F`<rect x="${x - 7 * k}" y="${y - 12 * k}" width="${14 * k}" height="${12 * k}" fill="${side}" ${ln(1.6)}/><ellipse cx="${x}" cy="${y - 12 * k}" rx="${7 * k}" ry="${3.4 * k}" fill="${top}" ${ln(1.4)}/>`;
  return wrap(w, h, shade(w / 2, h - 2, w / 2, 10, .3)
    + R(10, d + 4, 10, z - 6, '#6e3a1a', ln(1.8)) + R(w - 20, d + 4, 10, z - 6, '#6e3a1a', ln(1.8)) + R(4, d - 2, w - 8, 12, '#8a4a22', ln(2))
    + R(0, 0, w, d, '#b8743e', `rx="8" ${ln(2.6)}`) + R(7, 7, w - 14, d - 14, '#c98a52', `rx="5"`) + F`<path d="M12 ${d * .36}H${w - 12}M12 ${d * .68}H${w - 12}" stroke="#a8683a" stroke-width="1.6"/>`
    + paper(w * .27, d * .38, -9) + paper(w * .33, d * .55, 7) + paper(w * .62, d * .7, -4, '#7fb7d8') + F`<path d="M${w * .62 - 10} ${d * .7 - 4}h20" stroke="#fff" stroke-width="3" opacity=".7"/>`
    + F`<path d="M${w * .8 + 7} ${d * .33 - 8}q7 1 0 8" stroke="${O}" stroke-width="4" fill="none"/><path d="M${w * .8 + 7} ${d * .33 - 8}q7 1 0 8" stroke="#e8e2d0" stroke-width="2" fill="none"/>` + cup(w * .8, d * .33, '#6b3a1f', '#e8e2d0')
    + cup(w * .58, d * .32, '#ffb347', '#ffe2b0aa', .9) + cup(w * .86, d * .66, '#c9ced6', '#d23b33', .8) + F`<path d="M${w * .86 - 4} ${d * .66 - 8}h7" stroke="#fff" stroke-width="2" opacity=".8"/>`, 'hg-coffee');
}
/* the end table in the couches' corner: a little square table with a drawer and a lamp on it. Box w × h; its top at
   height 50. Foot: y = h. */
export function endTable({ w = 76, h = 170 } = {}) {
  const id = uid(), Y = h - 50, cx = w / 2, d = 56, t = Y - d;
  return wrap(w, h, F`<circle cx="${cx}" cy="${t - 30}" r="${w * .9}" fill="url(#${id})"/>` + shade(cx, h - 3, w / 2, 6, .3)
    + R(6, Y, 8, 50, '#6e3a1a', ln(1.8)) + R(w - 14, Y, 8, 50, '#6e3a1a', ln(1.8)) + R(2, Y - 2, w - 4, 22, '#9a5526', ln(2.2)) + R(cx - 14, Y + 4, 28, 10, '#b06a35', `rx="2" ${ln(1.4)}`) + R(cx - 4, Y + 8, 8, 3, '#d9a441')
    + R(0, t, w, d, '#c47a3e', `rx="5" ${ln(2.4)}`) + R(5, t + 5, w - 10, d - 10, '#d08a4a', 'rx="3"')
    + F`<ellipse cx="${cx}" cy="${t + d * .55}" rx="13" ry="5" fill="#3e6d8c" ${ln(1.6)}/><path d="M${cx} ${t + d * .55}v-26" stroke="${O}" stroke-width="3.4"/><path d="M${cx - 17} ${t + d * .55 - 26}h34l-8 -28h-18Z" fill="#ffcf73" ${ln(2.2)}/><path d="M${cx - 11} ${t + d * .55 - 28}h7l-3 -22h-2Z" fill="#fff0c2" opacity=".85"/>`
    + F`<ellipse cx="${w * .22}" cy="${t + d * .7}" rx="8" ry="3.5" fill="#e8e2d0" ${ln(1.2)}/>`, 'hg-endtable', glowDef(id, '#ffb347', .5));
}
/* the TV on a low stand, both turned 45° to face the couches' corner (south-east of it): the stand's top, its south-west
   end and its long south-east front; on it, the TV's foot, its end and its top, and the screen looking south-east.
   Footprint 140 × 124 (the stand's corners inside it). Box 140 × (124 + 116). Foot: y = h. */
export function tvSet({ on = false } = {}) {
  const w = 140, fd = 124, top = 116, h = fd + top, c = [70, 62], k = Math.SQRT1_2, id = uid();
  const pt = (s, t, z) => `${n1(c[0] + (s + t) * k)} ${n1(c[1] + (t - s) * k + top - z)}`;   // (s along the stand: to the north-east; t across it: to the south-east)
  const quad = (a, b, c2, d2) => `M${a}L${b}L${c2}L${d2}Z`;
  const box = (s0, s1, t0, t1, z0, z1, top_, sw, se, lw = 2.4) => F`<path d="${quad(pt(s0, t0, z0), pt(s0, t1, z0), pt(s0, t1, z1), pt(s0, t0, z1))}" fill="${sw}" ${ln(lw)}/>`
    + F`<path d="${quad(pt(s0, t1, z0), pt(s1, t1, z0), pt(s1, t1, z1), pt(s0, t1, z1))}" fill="${se}" ${ln(lw)}/>` + F`<path d="${quad(pt(s0, t0, z1), pt(s1, t0, z1), pt(s1, t1, z1), pt(s0, t1, z1))}" fill="${top_}" ${ln(lw)}/>`;
  const HS = 34, Z0 = HS + 12, Z1 = Z0 + 66;
  return wrap(w, h, F`<ellipse cx="${c[0]}" cy="${c[1] + top}" rx="62" ry="34" fill="#000" opacity=".28"/>`
    + box(-62, 62, -22, 22, 0, HS, '#c47a3e', '#7a3f1f', '#9a5526')
    + F`<path d="${quad(pt(-50, 22, HS - 8), pt(-4, 22, HS - 8), pt(-4, 22, HS - 26), pt(-50, 22, HS - 26))}${quad(pt(4, 22, HS - 8), pt(50, 22, HS - 8), pt(50, 22, HS - 26), pt(4, 22, HS - 26))}" fill="#b06a35" ${ln(1.6)}/>`
    + F`<path d="${quad(pt(-20, -18, HS), pt(20, -18, HS), pt(20, 0, HS), pt(-20, 0, HS))}" fill="#2b2b33" ${ln(1.8)}/>` + box(-6, 6, -12, -6, HS, Z0, '#3a3b44', '#2b2b33', '#3a3b44', 1.6)
    + box(-56, 56, -14, -6, Z0, Z1, '#4a4c58', '#2b2b33', '#23242c')
    + F`<path d="${quad(pt(-51, -6, Z0 + 5), pt(51, -6, Z0 + 5), pt(51, -6, Z1 - 5), pt(-51, -6, Z1 - 5))}" fill="url(#${id})" class="hg-tv-screen${on ? ' on' : ''}" ${ln(1.4)}/>`
    + F`<path d="${quad(pt(-40, -6, Z1 - 10), pt(-22, -6, Z1 - 10), pt(-36, -6, Z0 + 10), pt(-50, -6, Z0 + 10))}" fill="#fff" opacity=".08"/>`
    + F`<circle cx="${pt(46, -6, Z0 + 2).split(' ')[0]}" cy="${pt(46, -6, Z0 + 2).split(' ')[1]}" r="1.8" fill="#ff5a4a"/>`, 'hg-tv',
    F`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c4a66"/><stop offset=".6" stop-color="#18263a"/><stop offset="1" stop-color="#101824"/></linearGradient>`);
}
/* a low bookshelf against the north wall: two shelves of books (a few leaning), a little plant on top. Footprint w × 40,
   100 high. Box w × 140. Foot: y = h. */
export function bookshelf({ w = 190, h = 140 } = {}) {
  const d = 40, H = h - d, r = rnd(w + 3), cols = ['#a8382c', '#3e6d8c', '#e0b04a', '#5f8a4a', '#9b5de5', '#c4573a', '#2f7a6a', '#d9cfb5'];
  let books = '';
  for (const [y0, y1] of [[d + 10, d + 46], [d + 54, H + d - 8]]) {
    let x = 12;
    while (x < w - 16) {
      const bw = 7 + Math.floor(r() * 7), bh = (y1 - y0) * (.68 + r() * .3), c = cols[Math.floor(r() * cols.length)];
      if (x > w - 34 && r() < .6) { books += F`<path d="M${x} ${y1}l${bh * .5} ${-bh * .86}l${bw} 3l${-bh * .5} ${bh * .86 - 3}Z" fill="${c}" ${ln(1.4)}/>`; break; }   // (one leaning)
      books += R(x, y1 - bh, bw, bh, c, ln(1.4)) + R(x + 2, y1 - bh + 4, bw - 4, 2.4, '#fff', 'opacity=".35"');
      x += bw + (r() < .15 ? 6 : 0);
    }
  }
  return wrap(w, h, shade(w / 2, h - 2, w / 2, 7, .3) + R(0, 0, w, d, '#c47a3e', `rx="3" ${ln(2.4)}`) + R(0, d, w, H, '#7a3f1f', ln(2.6))
    + R(8, d + 8, w - 16, 40, '#4a2412', ln(1.6)) + R(8, d + 52, w - 16, H - 58, '#4a2412', ln(1.6)) + books + R(4, d + 46, w - 8, 7, '#9a5526', ln(1.6)) + R(4, h - 8, w - 8, 8, '#9a5526', ln(1.6))
    + F`<path d="M${w - 34} ${d * .62}l4 -16h18l4 16Z" fill="#c4683a" ${ln(1.6)}/><circle cx="${w - 30}" cy="${d * .62 - 22}" r="8" fill="#5f8a4a" ${ln(1.4)}/><circle cx="${w - 18}" cy="${d * .62 - 26}" r="9" fill="#6f9a52" ${ln(1.4)}/>`
    + R(22, d * .2, 34, 12, '#e0b04a', ln(1.4)) + R(26, d * .2 - 9, 28, 10, '#3e6d8c', ln(1.4)), 'hg-shelf');
}
/* a little framed picture for a wall: a duck on a pond (kind 'duck') or hills under the moon (kind 'hills'). Box w × h.
   Foot: y = h (its bottom edge). */
export function picture({ w = 46, h = 38, kind = 'duck' } = {}) {
  const art = kind === 'duck'
    ? R(6, 6, w - 12, h - 12, '#7fb7d8') + R(6, h * .6, w - 12, h * .4 - 6, '#3e6d8c') + F`<path d="M${w / 2 - 8} ${h * .62}c-1 -5 2 -8 6 -7c0 -4 5 -6 7 -3c2 2 1 5 -1 6c5 -1 7 2 6 4Z" fill="#ffd23f" ${ln(1)}/>`
    : R(6, 6, w - 12, h - 12, '#1f2e4a') + F`<circle cx="${w * .68}" cy="${h * .36}" r="4" fill="#ffe9a8"/><path d="M6 ${h - 6}l${w * .3} ${-h * .32}l${w * .2} ${h * .14}l${w * .22} ${-h * .2}l${w * .28 - 12} ${h * .3}V${h - 6}Z" fill="#3f7a52"/>`;
  return wrap(w, h, R(0, 0, w, h, '#8a4a22', `rx="2" ${ln(2.2)}`) + art + R(6, 6, w - 12, h - 12, 'none', ln(1.4)), 'hg-picture');
}
/* a round wooden wall clock. Box 2r × 2r. Foot: y = h. */
export function wallClock({ r = 24 } = {}) {
  const c = r, ticks = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return F`M${c + Math.sin(a) * (r - 7)} ${c - Math.cos(a) * (r - 7)}L${c + Math.sin(a) * (r - 10)} ${c - Math.cos(a) * (r - 10)}`; }).join('');
  return wrap(2 * r, 2 * r, F`<circle cx="${c}" cy="${c}" r="${r}" fill="#8a4a22" ${ln(2.4)}/><circle cx="${c}" cy="${c}" r="${r - 5}" fill="#f6f0dc" ${ln(1.6)}/><path d="${ticks}" stroke="${O}" stroke-width="1.6"/>`
    + F`<path d="M${c} ${c}L${c} ${c - r + 11}M${c} ${c}L${c + r * .38} ${c + 4}" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${c}" cy="${c}" r="2.4" fill="#d23b33"/>`, 'hg-clock');
}
/* a coat stand: a pole on a round foot, pegs, a red coat and a woolly hat hanging. Box 50 × 170. Foot: y = h. */
export function coatRack({ w = 50, h = 170 } = {}) {
  const cx = w / 2;
  return wrap(w, h, shade(cx, h - 4, 18, 5, .3) + F`<ellipse cx="${cx}" cy="${h - 7}" rx="16" ry="5" fill="#5a2d14" ${ln(2)}/><rect x="${cx - 3}" y="10" width="6" height="${h - 18}" fill="#7a3f1f" ${ln(2)}/>`
    + F`<path d="M${cx} 22l-14 -8M${cx} 22l14 -8M${cx} 34l-12 -4" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M${cx} 22l-14 -8M${cx} 22l14 -8M${cx} 34l-12 -4" stroke="#9a5526" stroke-width="2.6" stroke-linecap="round"/><circle cx="${cx}" cy="8" r="5" fill="#9a5526" ${ln(1.8)}/>`
    + F`<path d="M${cx - 14} 18q-6 0 -8 10l-4 52q10 6 22 0l2 -46q0 -12 -12 -16Z" fill="#c4573a" ${ln(2.2)}/><path d="M${cx - 10} 30v44" stroke="#8a2f22" stroke-width="2"/>`
    + F`<path d="M${cx + 6} 18q8 -14 18 0Z" fill="#3e6d8c" ${ln(1.8)}/><circle cx="${cx + 15}" cy="6" r="4" fill="#f4f2ec" ${ln(1.4)}/><path d="M${cx + 6} 18h18" stroke="#e0b04a" stroke-width="3"/>`, 'hg-coatrack');
}
/* a pair of yellow rain boots, side by side. Box 54 × 44. Foot: y = h. */
export function boots({ w = 54, h = 44 } = {}) {
  const boot = x => F`<path d="M${x} 6h14v26q10 0 12 8h-26Z" fill="#ffc23f" ${ln(2)}/><path d="M${x} 6h14v5h-14Z" fill="#e0a020" ${ln(1.4)}/><path d="M${x + 1} 40h25" stroke="#7a5212" stroke-width="3"/>`;
  return wrap(w, h, shade(w / 2, h - 2, w / 2, 4, .3) + boot(3) + boot(25), 'hg-boots');
}
/* the welcome mat in front of the front door: a coir mat with a border and a duck's three-toed prints. Flat, w × h. */
export function doorMat({ w = 130, h = 64 } = {}) {
  const print = (x, y) => F`<path d="M${x} ${y}l-6 -8M${x} ${y}v-10M${x} ${y}l6 -8" stroke="#6e3a1a" stroke-width="3" stroke-linecap="round"/>`;
  return wrap(w, h, R(0, 0, w, h, '#b8864e', `rx="5" ${ln(2.2)}`) + R(6, 6, w - 12, h - 12, 'none', 'stroke="#7a5230" stroke-width="3" stroke-dasharray="5 4"') + print(w * .32, h * .62) + print(w * .5, h * .46) + print(w * .68, h * .64), 'hg-mat');
}
/* a potted plant: a terracotta pot and a leafy bush. Box 60 × 100. Foot: y = h. */
export function pottedPlant({ w = 60, h = 100 } = {}) {
  const cx = w / 2, leaf = (x, y, a, c) => F`<path d="M${x} ${y}q${8 * Math.cos(a) - 6 * Math.sin(a)} ${8 * Math.sin(a) + 6 * Math.cos(a)} ${22 * Math.cos(a)} ${22 * Math.sin(a)}q${-14 * Math.cos(a) + 6 * Math.sin(a)} ${-14 * Math.sin(a) - 6 * Math.cos(a)} ${-22 * Math.cos(a)} ${-22 * Math.sin(a)}Z" fill="${c}" ${ln(1.6)}/>`;
  let leaves = '';
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .36; leaves += leaf(cx, h - 40, a, i % 2 ? '#5f8a4a' : '#3f7a52'); }
  return wrap(w, h, shade(cx, h - 3, 20, 5, .3) + leaves + F`<path d="M${cx - 18} ${h - 42}h36l-5 38h-26Z" fill="#c4683a" ${ln(2.2)}/><path d="M${cx - 20} ${h - 44}h40v8h-40Z" fill="#d9824a" ${ln(2)}/>`, 'hg-plant');
}

/* ---------- the piano ---------- */
/* the piano itself: a warm wooden upright with brass candle sconces. Footprint w × 90, 150 high; box w × 240. back: the
   case, foot y = 205; front: the keyboard shelf, keys, legs and pedals, foot y = h. Ducks playing stand south of it. */
export function pianoBody({ w = 360, h = 240 } = {}) {
  const id = uid(), Y = h - 90, wood = '#7a3f1f', hi = '#a65a2c', lo = '#552a14';
  const back = shade(w / 2, Y + 70, w / 2 + 10, 30, .3) + R(0, Y - 150, w, 55, hi, `rx="4" ${ln(2.6)}`) + R(0, Y - 95, w, 150, wood, ln(2.6))
    + R(24, Y - 84, w - 48, 52, lo, `rx="6" ${ln(2)}`) + R(32, Y - 78, w - 64, 40, wood, 'rx="4"') + F`<path d="M${w / 2 - 50} ${Y - 58}q25 -16 50 0q25 16 50 0" stroke="#c88a4a" stroke-width="3" fill="none"/>`
    + R(w / 2 - 70, Y - 40, 140, 10, hi, ln(2)) + R(w / 2 - 50, Y - 64, 100, 26, '#f3e7c8', ln(1.6)) + F`<path d="M${w / 2 - 44} ${Y - 58}h88M${w / 2 - 44} ${Y - 52}h88M${w / 2 - 44} ${Y - 46}h88" stroke="#8a7458" stroke-width="1"/>`
    + [14, w - 14].map((x, i) => F`<circle cx="${x}" cy="${Y - 110}" r="30" fill="url(#${id})" class="hg-flicker" style="animation-delay:-${i * 1.3}s"/><path d="M${x} ${Y - 70}c0 -10 ${i ? -6 : 6} -16 ${i ? -6 : 6} -26" stroke="#d9a441" stroke-width="3" fill="none"/><rect x="${x - 4}" y="${Y - 112}" width="8" height="18" fill="#f4ecd8" ${ln(1.4)}/><path d="M${x} ${Y - 124}q-4 6 0 9q4 -3 0 -9Z" fill="#ffc23f" stroke="#c46a12" stroke-width="1"/>`).join('');
  let keys = '';
  const nk = Math.floor((w - 40) / 9);
  for (let i = 0; i < nk; i++) keys += F`M${20 + i * (w - 40) / nk} ${Y - 15}v35`;
  let bk = '';
  for (let i = 0; i < nk - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) bk += R(20 + (i + 1) * (w - 40) / nk - 2.5, Y - 15, 5, 18, '#23222b');
  const front = R(10, Y - 15, w - 20, 35, '#f3efe4', ln(2.2)) + `<path d="${keys}" stroke="#8a8478" stroke-width="1"/>` + bk
    + R(0, Y - 22, 20, 44, hi, `rx="4" ${ln(2.2)}`) + R(w - 20, Y - 22, 20, 44, hi, `rx="4" ${ln(2.2)}`) + R(4, Y + 20, w - 8, 15, wood, ln(2.4))
    + R(30, Y + 35, w - 60, 20, '#3a1d0e') + [22, w - 34].map(x => R(x, Y + 35, 12, 55, hi, `rx="5" ${ln(2.2)}`) + R(x - 4, Y + 84, 20, 6, lo, ln(1.6))).join('')
    + [-14, 0, 14].map(dx => R(w / 2 + dx - 4, Y + 76, 8, 12, '#d9a441', `rx="2" ${ln(1.4)}`)).join('');
  return pair(w, h, [back, glowDef(id, '#ffb347', .5)], [front], Y + 55, h);
}

/* ---------- the stage ---------- */
/* the stage: half an oval, its flat side against an east wall: rx out from the wall, ry along it (footprint rx × 2ry),
   raised z (+70). Planks on top with a warm spotlight, a red skirt round the curve, and footlights standing on the top
   just inside the rim along the front, drawn last. Box rx × (2ry + z). back: the top, foot y = z (the footprint's north
   edge); front: the skirt and the footlights, foot y = h. */
export function stage({ rx = 250, ry = 195, z = 70 } = {}) {
  const id = uid(), w = rx, h = 2 * ry + z, cx = rx, cy = ry;   // (the top's middle, on the wall's face)
  const top = F`M${cx} ${cy - ry}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}Z`;
  let planks = '';
  for (let y = cy - ry + 22; y < cy + ry; y += 22) planks += F`M0 ${y}H${w}`;
  const back = F`<path d="${top}" fill="#b06a35"/><g clip-path="url(#${id}c)"><path d="${planks}" stroke="#7a4220" stroke-width="2.2"/><ellipse cx="${cx - rx * .45}" cy="${cy}" rx="${rx * .5}" ry="${ry * .55}" fill="url(#${id}s)"/>`
    + F`<path d="M${cx} ${cy - ry + 7}A${rx - 7} ${ry - 7} 0 0 0 ${cx} ${cy + ry - 7}" fill="none" stroke="#e0a050" stroke-width="12"/></g>`
    + F`<path d="M${cx} ${cy - ry}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}" fill="none" ${ln(3)}/>`;
  /* the skirt: the curve's south-west quarter, from its left end round to the wall, z deep */
  const band = F`M0 ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}V${cy + ry + z}A${rx} ${ry} 0 0 1 0 ${cy + z}Z`;
  let pleats = '';
  for (let x = 8; x < w; x += 18) pleats += F`M${x} ${cy}V${cy + ry + z}`;
  /* the footlights: little black cans on the top, each a few px in from the rim, their bulbs turned in toward the stage */
  let lamps = '';
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (.56 + .4 * i / 5), x = cx + (rx - 16) * Math.cos(a), y = cy + (ry - 13) * Math.sin(a), k = Math.cos(a);
    lamps += F`<g class="hg-twinkle" style="animation-delay:-${i * .5}s"><circle cx="${x - k * 9}" cy="${y - 6}" r="15" fill="#ffb347" opacity=".4"/></g>`
      + F`<rect x="${x - 8}" y="${y - 10}" width="16" height="11" rx="4" fill="#2a2b35" ${ln(1.8)}/><circle cx="${x - k * 5}" cy="${y - 6}" r="4" fill="#fff0b8" stroke="#6a3a12" stroke-width="1.2"/>`;
  }
  const front = F`<path d="${band}" fill="#7a1f2b"/><g clip-path="url(#${id}b)"><path d="${pleats}" stroke="#5a1520" stroke-width="5"/><path d="${pleats}" stroke="#a83444" stroke-width="2" transform="translate(6 0)"/></g><path d="${band}" fill="url(#${id}d)"/>`
    + F`<path d="M0 ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}" stroke="${O}" stroke-width="15" fill="none"/><path d="M0 ${cy}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}" stroke="#e0a050" stroke-width="9" fill="none"/>`
    + F`<path d="${band}" fill="none" ${ln(3)}/>` + lamps;
  const defs = F`<clipPath id="${id}c"><path d="${top}"/></clipPath>` + glowDef(id + 's', '#ffd27a', .4);
  const fdefs = F`<clipPath id="${id}b"><path d="${band}"/></clipPath><linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;
  return pair(w, h, [back, defs], [front, fdefs], z, h);
}
/* stairs up onto the stage, rising to z. dir 'n' (the default) climbs northward, its risers facing the viewer: the stage
   is beside its top step; dir 'w' climbs westward, the stage at its west end (its steps seen from above, their sides
   facing the viewer). Box w × (d + z). back: the treads (and risers), foot y = z (north edge); front: dir 'w' the steps'
   south faces, dir 'n' nothing (no rail), foot y = h. */
export function stageStairs({ w = 130, d = 150, z = 95, steps = 5, dir = 'n', h } = {}) {
  h = h || d + z;
  const Y = h - d;
  let back = '', front = '';
  if (dir === 'w') {
    const sw = w / steps;
    for (let k = 0; k < steps; k++) {
      const x = k * sw, H = z * (steps - k) / steps;
      back += R(x, Y - H, sw + .5, d, '#c9803f', ln(2.2)) + R(x + 2, Y - H + 2, 5, d - 4, '#f0b070', 'opacity=".55"');
      front += R(x, Y + d - H, sw + .5, H, '#8a4a22', ln(2.2)) + R(x, Y + d - H, sw + .5, 6, '#b06a35');
    }
    return pair(w, h, [back], [front], Y, h);
  }
  const sd = d / steps, r = z / steps;
  for (let k = steps - 1; k >= 0; k--) {   // from the top (north) down
    const y0 = Y + d - (k + 1) * sd;
    back += R(4, y0 - (k + 1) * r, w - 8, sd, '#c9803f', ln(2.2)) + R(6, y0 - (k + 1) * r + 2, w - 12, 4, '#f0b070', 'opacity=".55"')
      + R(4, y0 + sd - (k + 1) * r, w - 8, r, '#8a4a22', ln(2.2));
  }
  return pair(w, h, [back], [''], Y, h);
}
/* the mic stand (decoration), side-on. Foot: bottom (y = h − 6). */
export function micStand({ w = 56, h = 120 } = {}) {
  const b = h - 6, cx = w * .45;
  return wrap(w, h, shade(cx, b, 20, 5) + F`<path d="M${cx} ${b - 16}L${cx - 18} ${b}M${cx} ${b - 16}L${cx + 18} ${b}M${cx} ${b - 16}L${cx + 3} ${b - 2}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${cx} ${b - 16}L${cx - 18} ${b}M${cx} ${b - 16}L${cx + 18} ${b}M${cx} ${b - 16}L${cx + 3} ${b - 2}" stroke="#4a4c58" stroke-width="3" stroke-linecap="round"/>`
    + F`<path d="M${cx} ${b - 14}V${h * .36}L${cx + 12} ${h * .26}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${cx} ${b - 14}V${h * .36}L${cx + 12} ${h * .26}" stroke="#8a8f9c" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="${h * .55}" r="4" fill="#2a2b35" ${ln(1.6)}/>`
    + F`<g transform="rotate(35 ${cx + 15} ${h * .2})"><rect x="${cx + 9}" y="${h * .14}" width="12" height="22" rx="5" fill="#25262e" ${ln(2)}/><circle cx="${cx + 15}" cy="${h * .12}" r="8" fill="#c9ced6" ${ln(2)}/><path d="M${cx + 9} ${h * .12}h12M${cx + 15} ${h * .12 - 7}v14" stroke="#7d838f" stroke-width="1.2"/><circle cx="${cx + 12}" cy="${h * .12 - 3}" r="2" fill="#fff" opacity=".8"/></g>`, 'hg-mic');
}

/* ---------- the chalk floor ---------- */
/* the chalk floor: dark slate in a wooden frame, a little old chalk dust. Anchor: flat. The drawable slate is inset 18. */
export function chalkFloor({ w = 600, h = 550, seed = 4 } = {}) {
  const r = rnd(seed);
  let dust = '';
  for (let i = 0; i < 7; i++) { const x = 50 + r() * (w - 140), y = 40 + r() * (h - 80), l = 40 + r() * 70; dust += F`<path d="M${x} ${y}q${l / 2} ${-8 + r() * 16} ${l} ${-4 + r() * 8}" stroke="#fff" stroke-width="${10 + r() * 14}" stroke-linecap="round" fill="none" opacity="${.025 + r() * .03}"/>`; }
  return wrap(w, h, R(0, 0, w, h, '#a65a2c', `rx="8" ${ln(3)}`) + R(5, 4, w - 10, 5, '#e3a066', 'rx="2" opacity=".55"') + R(18, 18, w - 36, h - 36, '#26302f', ln(2.4)) + dust
    + [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]].map(([x, y]) => F`<circle cx="${x}" cy="${y}" r="5" fill="#d9a441" ${ln(1.4)}/>`).join(''), 'hg-ground hg-chalk');
}
const tile = (w, h) => R(2, 2, w - 4, h - 4, '#2f3836', `rx="8" ${ln(2.4)}`) + R(2, 2, w - 4, h - 4, 'none', 'rx="8" stroke="#a65a2c" stroke-width="4" opacity=".9"');
/* the eraser tile (pick the eraser up, rub out a little at a time). Anchor: flat. */
export function eraserTile({ w = 72, h = 72 } = {}) {
  const x = w / 2 - 24, y = h / 2 - 8;
  return wrap(w, h, tile(w, h) + F`<ellipse cx="${w / 2}" cy="${y + 26}" rx="26" ry="6" fill="#000" opacity=".35"/><ellipse cx="${w / 2 - 6}" cy="${y + 24}" rx="16" ry="4" fill="#fff" opacity=".1"/>`
    + R(x, y + 10, 48, 12, '#8b8f99', `rx="3" ${ln(2)}`) + R(x, y - 6, 48, 18, '#c58a4e', `rx="4" ${ln(2)}`) + R(x + 5, y - 3, 30, 4, '#ecb57c', 'rx="2" opacity=".7"'), 'hg-ground');
}
/* the white X tile beside the chalk floor (use it: the whole floor wiped). Anchor: flat. */
export function wipeTile({ w = 72, h = 72 } = {}) {
  const c = w / 2, m = h / 2, k = Math.min(w, h) * .26;
  const x = F`M${c - k} ${m - k}L${c + k} ${m + k}M${c + k} ${m - k}L${c - k} ${m + k}`;
  return wrap(w, h, tile(w, h) + F`<path d="${x}" stroke="${O}" stroke-width="15" stroke-linecap="round"/><path d="${x}" stroke="#f4f4f0" stroke-width="9" stroke-linecap="round"/><path d="${x}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5" transform="translate(-1.5 -1.5)"/>`, 'hg-ground');
}
/* the chalk tile (pick up the chalk): a few sticks. Anchor: flat. */
export function chalkTile({ w = 72, h = 72 } = {}) {
  const stick = (x, y, c, a) => F`<g transform="rotate(${a} ${x} ${y})"><rect x="${x - 15}" y="${y - 4}" width="30" height="8" rx="4" fill="${c}" ${ln(1.8)}/><rect x="${x - 12}" y="${y - 3}" width="18" height="2" rx="1" fill="#fff" opacity=".6"/></g>`;
  return wrap(w, h, tile(w, h) + F`<ellipse cx="${w / 2}" cy="${h / 2 + 10}" rx="22" ry="7" fill="#fff" opacity=".07"/>` + stick(w / 2 - 6, h / 2 - 10, '#ff9ec4', -12) + stick(w / 2 + 6, h / 2 + 2, '#8fd0ff', 8) + stick(w / 2 - 2, h / 2 + 14, '#f4f4f0', -4), 'hg-ground');
}
/* the guestbook on its lectern, with an ink pot and a quill. Footprint w × 40; foot y = h. */
export function bookStand({ w = 76, h = 136 } = {}) {
  const id = uid(), cx = w / 2, Y = h - 40;
  return wrap(w, h, shade(cx, Y + 30, w * .42, 12) + F`<circle cx="${cx}" cy="${Y - 70}" r="${w * .75}" fill="url(#${id})" class="hg-flicker"/>`
    + R(cx - 22, Y + 28, 44, 10, '#5e3218', `rx="3" ${ln(2)}`) + R(cx - 7, Y - 40, 14, 70, '#8a4a22', ln(2.2)) + R(cx - 5, Y - 38, 4, 64, '#b06a35')
    + F`<path d="M2 ${Y - 66}H${w - 2}L${w - 6} ${Y - 38}H6Z" fill="#a65a2c" ${ln(2.4)}/><path d="M6 ${Y - 38}H${w - 6}v6H6Z" fill="#6e3a1a" ${ln(2)}/>`
    + F`<path d="M8 ${Y - 70}Q${cx / 2 + 4} ${Y - 78} ${cx} ${Y - 70}Q${cx * 1.5 - 4} ${Y - 78} ${w - 8} ${Y - 70}L${w - 10} ${Y - 44}Q${cx * 1.5} ${Y - 50} ${cx} ${Y - 44}Q${cx / 2} ${Y - 50} 10 ${Y - 44}Z" fill="#f6ead0" ${ln(2)}/><path d="M${cx} ${Y - 70}V${Y - 44}" stroke="#b9a37f" stroke-width="2"/>`
    + F`<path d="M15 ${Y - 64}h18M14 ${Y - 58}h20M14 ${Y - 52}h14M${cx + 6} ${Y - 64}h18M${cx + 6} ${Y - 58}h12" stroke="#7d6a52" stroke-width="1.6" stroke-linecap="round"/><path d="M${cx + 14} ${Y - 46}l3 14l3 -4l3 4l-1 -14" fill="#c4302b" ${ln(1.2)}/>`
    + F`<path d="M${w - 4} ${Y - 92}C${w + 4} ${Y - 84} ${w - 6} ${Y - 72} ${w - 16} ${Y - 66}C${w - 14} ${Y - 76} ${w - 8} ${Y - 86} ${w - 4} ${Y - 92}Z" fill="#f4f4f0" ${ln(1.6)}/>`, 'hg-book', glowDef(id, '#ffd27a', .35));
}

/* ---------- the kitchen ---------- */
/* a counter along a wall: cabinets with a butcher-block top; sink: x of a sink on it; upper: wall cabinets above.
   Footprint w × 60, 70 high; box w × 130 (w × 230 with upper). Foot: y = h. */
export function counter({ w = 260, h, sink = null, upper = true } = {}) {
  const d = 60, z = 70; h = h || d + (upper ? 180 : z);
  const Y = h - d, n = Math.max(1, Math.round(w / 64)), cw = w / n;
  let s = '';
  if (upper) {   // (on the wall above the counter, wall showing between: a shallow top, then the doors)
    s += R(0, Y - 180, w, 14, '#b8743e', ln(2.4)) + R(0, Y - 166, w, 60, '#8f4f24', ln(2.4));
    for (let i = 0; i < n; i++) s += R(i * cw + 5, Y - 161, cw - 10, 50, '#a35d2c', `rx="3" ${ln(1.6)}`) + R(i * cw + cw / 2 - 2, Y - 124, 4, 10, '#d9a441', ln(1));
  }
  s += R(0, Y - 10, w, 70, '#8f4f24', ln(2.4));
  for (let i = 0; i < n; i++) s += R(i * cw + 5, Y - 4, cw - 10, 50, '#a35d2c', `rx="3" ${ln(1.6)}`) + R(i * cw + cw / 2 - 6, Y + 4, 12, 4, '#d9a441', ln(1));
  s += R(0, Y + 48, w, 12, '#3a1d0e', ln(2)) + R(0, Y - 72, w, 64, '#d39a5e', `rx="3" ${ln(2.4)}`) + F`<path d="M8 ${Y - 60}H${w - 8}M8 ${Y - 40}H${w - 8}M8 ${Y - 22}H${w - 8}" stroke="#b27740" stroke-width="1.6"/>` + R(0, Y - 10, w, 6, '#a86a34', ln(1.6));
  if (sink != null) s += R(sink - 34, Y - 62, 68, 42, '#9aa3ad', `rx="8" ${ln(2.2)}`) + R(sink - 28, Y - 56, 56, 30, '#5d6670', 'rx="6"') + F`<ellipse cx="${sink}" cy="${Y - 40}" rx="14" ry="5" fill="#8fd3e8" opacity=".5"/><path d="M${sink + 22} ${Y - 64}V${Y - 92}Q${sink + 22} ${Y - 100} ${sink + 10} ${Y - 100}V${Y - 88}" stroke="${O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${sink + 22} ${Y - 64}V${Y - 92}Q${sink + 22} ${Y - 100} ${sink + 10} ${Y - 100}V${Y - 88}" stroke="#c9ced6" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  else s += F`<g transform="translate(${w * .3} ${Y - 46})"><ellipse cx="0" cy="0" rx="16" ry="5" fill="#b9b2a0" ${ln(1.8)}/><circle cx="0" cy="-5" r="6" fill="#8ee03c" ${ln(1.6)}/><circle cx="-6" cy="-1" r="7" fill="#ef3b3b" ${ln(1.6)}/><circle cx="6" cy="-1" r="6" fill="#ff8c2b" ${ln(1.6)}/><path d="M-16 0Q-15 13 -8 14H8Q15 13 16 0Q0 6 -16 0Z" fill="#e8e2d0" ${ln(1.8)}/></g>`;   // (the fruit in the bowl: the bowl's front over it)
  return wrap(w, h, s, 'hg-counter');
}
/* a rounded old fridge, with fridge magnets. Footprint w × 60, 150 high. Foot: y = h. */
export function fridge({ w = 76, h = 196 } = {}) {
  const Y = h - 60, mags = ['#ef3b3b', '#ffd23f', '#2fa4ff', '#37d421', '#9b5de5'];
  return wrap(w, h, R(2, Y - 10, w - 4, 70, '#e2dccb', ln(2.4)) + F`<path d="M2 ${Y - 10}V${Y - 122}Q2 ${Y - 136} 16 ${Y - 136}H${w - 16}Q${w - 2} ${Y - 136} ${w - 2} ${Y - 122}V${Y - 10}Z" fill="#f1ecdf" ${ln(2.4)}/>`
    + F`<path d="M2 ${Y - 94}H${w - 2}" stroke="${O}" stroke-width="2"/><rect x="${w - 14}" y="${Y - 84}" width="6" height="36" rx="3" fill="#c9ced6" ${ln(1.6)}/>`
    + R(8, Y - 132, 20, 108, '#fff', 'rx="6" opacity=".25"') + mags.map((c, i) => F`<rect x="${12 + (i % 3) * 14}" y="${Y - 80 + Math.floor(i / 3) * 16 + (i % 2) * 4}" width="9" height="9" rx="2" fill="${c}" ${ln(1.2)} transform="rotate(${(i * 23) % 30 - 15} ${16 + (i % 3) * 14} ${Y - 76 + Math.floor(i / 3) * 16})"/>`).join('')
    + F`<rect x="${w - 14}" y="${Y + 2}" width="6" height="30" rx="3" fill="#c9ced6" ${ln(1.6)}/>` + R(4, Y + 46, w - 8, 10, '#3a3b44', ln(1.6)), 'hg-fridge');
}
/* the stove: four burners, a red kettle, an oven window with a faint glow. Footprint w × 60, 70 high. Foot: y = h. */
export function stove({ w = 76, h = 150 } = {}) {
  const Y = h - 60;
  return wrap(w, h, R(0, Y - 70, w, 20, '#e2dccb', ln(2.2)) + R(0, Y - 10, w, 70, '#e8e2d0', ln(2.4)) + R(0, Y - 50, w, 40, '#2b2b33', ln(2.4))
    + [[w * .28, Y - 40], [w * .72, Y - 40], [w * .28, Y - 22], [w * .72, Y - 22]].map(([x, y]) => F`<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="none" stroke="#5a5b66" stroke-width="3"/>`).join('')
    + F`<g transform="translate(${w * .72} ${Y - 36})"><path d="M-12 0C-14 -14 14 -14 12 0Z" fill="#d23b33" ${ln(1.8)}/><path d="M10 -6l8 -6" stroke="${O}" stroke-width="3"/><path d="M-6 -11q6 -8 12 0" stroke="${O}" stroke-width="2.4" fill="none"/></g>`
    + [.2, .4, .6, .8].map(t => F`<circle cx="${w * t}" cy="${Y - 3}" r="3.2" fill="#2b2b33" ${ln(1)}/>`).join('')
    + R(8, Y + 6, w - 16, 40, '#2b2b33', `rx="4" ${ln(2)}`) + R(14, Y + 12, w - 28, 22, '#ff9a3a', 'rx="3" opacity=".35"') + R(14, Y + 6, w - 28, 3, '#c9ced6', ln(1)) + R(2, Y + 50, w - 4, 8, '#3a3b44'), 'hg-stove');
}
/* the kitchen table with two chairs behind it, a lantern and plates on it; box w × 240. A pair: the chairs (foot y = 100,
   so a duck sitting on one is in front of them) and the table (foot y = h − 10, the table's front). */
export function kitchenTable({ w = 200, h = 240, cards = false } = {}) {
  if (cards) return cardTable({ w, h });
  const id = uid(), Y = h - 150, tx = 10, tw = w - 20;
  const chair = x => R(x - 18, Y - 74, 36, 12, '#b06a35', `rx="4" ${ln(2)}`) + R(x - 16, Y - 62, 6, 34, '#8a4a22', ln(1.6)) + R(x + 10, Y - 62, 6, 34, '#8a4a22', ln(1.6)) + R(x - 10, Y - 54, 20, 6, '#8a4a22', ln(1.4)) + R(x - 10, Y - 42, 20, 6, '#8a4a22', ln(1.4)) + R(x - 20, Y - 30, 40, 40, '#c9803f', `rx="4" ${ln(2)}`);
  return pair(w, h, [shade(w / 2, Y + 120, w / 2, 26, .3) + chair(w * .3) + chair(w * .7)], [R(tx, Y - 6, tw, 100, '#b8743e', `rx="6" ${ln(2.6)}`) + F`<path d="M${tx + 6} ${Y + 20}H${tx + tw - 6}M${tx + 6} ${Y + 46}H${tx + tw - 6}M${tx + 6} ${Y + 72}H${tx + tw - 6}" stroke="#94582a" stroke-width="1.6"/>`
    + R(tx, Y + 94, tw, 14, '#8a4a22', ln(2.2)) + R(tx + 6, Y + 108, 12, 32, '#6e3a1a', ln(1.8)) + R(tx + tw - 18, Y + 108, 12, 32, '#6e3a1a', ln(1.8))
    + [w * .3, w * .7].map(x => F`<ellipse cx="${x}" cy="${Y + 30}" rx="18" ry="12" fill="#f1ecdf" ${ln(1.8)}/><ellipse cx="${x}" cy="${Y + 30}" rx="10" ry="6" fill="#e2dccb"/>`).join('')
    + F`<circle cx="${w / 2}" cy="${Y + 30}" r="44" fill="url(#${id})" class="hg-flicker"/><rect x="${w / 2 - 9}" y="${Y + 14}" width="18" height="24" rx="3" fill="#ffd98a" ${ln(2)}/><path d="M${w / 2 - 11} ${Y + 13}h22M${w / 2 - 11} ${Y + 39}h22M${w / 2} ${Y + 13}v-6" stroke="${O}" stroke-width="3"/>`, glowDef(id, '#ffb347', .45)], Y + 10, h - 10);
}

/* the card table in the great room: the kitchen table's shape and chairs, a green felt top, a hand of cards at each
   chair, the pile between them and a few stacks of chips. A pair, the same feet as kitchenTable. */
function cardTable({ w = 200, h = 240 } = {}) {
  const Y = h - 150, tx = 10, tw = w - 20;
  const chair = x => R(x - 18, Y - 74, 36, 12, '#b06a35', `rx="4" ${ln(2)}`) + R(x - 16, Y - 62, 6, 34, '#8a4a22', ln(1.6)) + R(x + 10, Y - 62, 6, 34, '#8a4a22', ln(1.6)) + R(x - 10, Y - 54, 20, 6, '#8a4a22', ln(1.4)) + R(x - 10, Y - 42, 20, 6, '#8a4a22', ln(1.4)) + R(x - 20, Y - 30, 40, 40, '#c9803f', `rx="4" ${ln(2)}`);
  const card = (x, y, a, c = '#fbfaf6', mark = '') => F`<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-7" y="-10" width="14" height="20" rx="2" fill="${c}" ${ln(1.4)}/>${mark}</g>`;
  const hand = x => [-22, -8, 6, 20].map((a, i) => card(x + (i - 1.5) * 6, Y + 26, a, '#fbfaf6', F`<path d="M-3 -5l3 -3l3 3l-3 3Z" fill="${i % 2 ? '#d23b33' : O}"/>`)).join('');
  const chips = (x, y, c, n) => Array.from({ length: n }, (_, i) => F`<ellipse cx="${x}" cy="${y - i * 3}" rx="7" ry="3.4" fill="${c}" ${ln(1.2)}/>`).join('');
  return pair(w, h, [shade(w / 2, Y + 120, w / 2, 26, .3) + chair(w * .3) + chair(w * .7)], [R(tx, Y - 6, tw, 100, '#8a4a22', `rx="10" ${ln(2.6)}`) + R(tx + 8, Y + 2, tw - 16, 84, '#2f7a4a', `rx="6" ${ln(1.6)}`)
    + R(tx, Y + 94, tw, 14, '#6e3a1a', ln(2.2)) + R(tx + 6, Y + 108, 12, 32, '#5a2d14', ln(1.8)) + R(tx + tw - 18, Y + 108, 12, 32, '#5a2d14', ln(1.8))
    + hand(w * .3) + hand(w * .7) + card(w / 2 - 4, Y + 56, -6, '#3e6d8c') + card(w / 2 + 3, Y + 55, 8, '#3e6d8c') + card(w / 2 + 16, Y + 62, 14, '#fbfaf6', F`<path d="M-3 -5l3 -3l3 3l-3 3Z" fill="#d23b33"/>`)
    + chips(w * .2, Y + 72, '#d23b33', 4) + chips(w * .27, Y + 76, '#3e6d8c', 3) + chips(w * .78, Y + 74, '#e0b04a', 5), ''], Y + 10, h - 10);
}

/* ---------- the bathroom ---------- */
/* a tub with bubbles and a tiny rubber duck, seen from above like the room: its rim, a sliver of its side under it and
   two little feet. Footprint w × 84, 46 high. Foot: y = h. */
export function tub({ w = 170, h = 130 } = {}) {
  const Y = h - 84, t = Y - 26;
  return wrap(w, h, shade(w / 2, Y + 74, w / 2 - 6, 9, .3) + [26, w - 26].map(x => F`<path d="M${x - 7} ${Y + 62}l2 9h10l2 -9Z" fill="#d9a441" ${ln(1.6)}/>`).join('')
    + R(12, Y + 36, w - 24, 30, '#dcd8cf', `rx="14" ${ln(2.2)}`)
    + R(4, t, w - 8, 84, '#f4f2ec', `rx="34" ${ln(2.6)}`) + R(14, t + 10, w - 28, 64, '#7fcfe4', `rx="26" ${ln(1.8)}`)
    + [[.3, .3], [.45, .5], [.62, .25], [.7, .6], [.36, .7], [.55, .72]].map(([fx, fy], i) => F`<circle cx="${14 + fx * (w - 28)}" cy="${t + 10 + fy * 64}" r="${5 + (i % 3) * 2}" fill="#fff" opacity=".85" ${ln(1)}/>`).join('')
    + F`<g transform="translate(${w * .74} ${t + 44}) scale(-1 1)"><path d="M-8 0C-9 -4 -8 -7 -5 -8C-5 -12 -1 -14 1.5 -12C4 -11 4 -7 2.5 -6C7 -7 9 -4 8 0Z" fill="#ffd23f" ${ln(1.3)}/><path d="M3.5 -11l4 1l-4 1Z" fill="#ff9a1f"/></g>`
    + F`<path d="M14 ${t + 16}v-14h12" stroke="${O}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M14 ${t + 16}v-14h12" stroke="#d9a441" stroke-width="3" fill="none" stroke-linecap="round"/>`, 'hg-tub');
}
/* a washstand with a round mirror on the wall above it. Footprint w × 46, 72 high, the mirror up to 150 and a little light over it. Foot: y = h. */
export function sink({ w = 66, h = 196 } = {}) {
  const Y = h - 46;
  const id = uid();
  return wrap(w, h, F`<circle cx="${w / 2}" cy="${Y - 160}" r="34" fill="url(#${id})" class="lit lit-glow"/><path d="M${w / 2} ${Y - 148}v-8" stroke="${O}" stroke-width="5"/><path d="M${w / 2} ${Y - 148}v-8" stroke="#d9a441" stroke-width="2.4"/><path d="M${w / 2 - 9} ${Y - 156}h18l-4 -10h-10Z" fill="#ffcf73" class="lit" ${ln(1.8)}/>`
    + F`<circle cx="${w / 2}" cy="${Y - 124}" r="24" fill="#c47a3e" ${ln(2.4)}/><circle cx="${w / 2}" cy="${Y - 124}" r="17" fill="#6f8fb0" ${ln(1.6)}/><path d="M${w / 2 - 9} ${Y - 130}l8 -8M${w / 2 - 4} ${Y - 122}l10 -10" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`
    + R(4, Y - 26, w - 8, 72, '#9a5526', ln(2.4)) + R(10, Y - 14, w - 20, 50, '#b06a35', `rx="3" ${ln(1.6)}`) + R(w / 2 - 6, Y + 6, 12, 4, '#d9a441', ln(1))
    + R(0, Y - 72, w, 46, '#e8e2d0', `rx="6" ${ln(2.4)}`) + F`<ellipse cx="${w / 2}" cy="${Y - 46}" rx="${w * .32}" ry="13" fill="#b9c3cb" ${ln(1.8)}/><path d="M${w / 2} ${Y - 66}v10h6" stroke="#c9ced6" stroke-width="4" fill="none" stroke-linecap="round"/>`, 'hg-sink', glowDef(id, '#ffe0b0', .5));
}
/* a toilet against the north wall, facing into the room, drawn like the plain one everybody knows: the tank (a lid band,
   a flush lever) just behind a closed round seat, the bowl's round belly, and a short foot that widens to the floor.
   Footprint w × 70, the tank 120 high. Foot: y = h. */
export function toilet({ w = 80, h = 130 } = {}) {
  const Y = h, c = w / 2;
  return wrap(w, h, shade(c, Y - 3, 24, 6, .3)
    + R(c - 25, Y - 114, 50, 62, '#e9e6de', `rx="6" ${ln(2.4)}`) + R(c - 28, Y - 122, 56, 11, '#f7f5ef', `rx="4" ${ln(2.2)}`) + R(c - 3, Y - 125, 6, 4, '#c9ced6', `rx="1.5" ${ln(1.2)}`)
    + F`<path d="M${c - 25} ${Y - 104}h-7" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/><path d="M${c - 25} ${Y - 104}h-7" stroke="#c9ced6" stroke-width="2.6" stroke-linecap="round"/>`
    + F`<path d="M${c - 30} ${Y - 56}C${c - 30} ${Y - 36} ${c - 21} ${Y - 28} ${c - 12} ${Y - 27}L${c - 15} ${Y - 3}H${c + 15}L${c + 12} ${Y - 27}C${c + 21} ${Y - 28} ${c + 30} ${Y - 36} ${c + 30} ${Y - 56}Z" fill="#ece9e2" ${ln(2.4)}/>`
    + F`<path d="M${c - 12} ${Y - 27}H${c + 12}" stroke="#bdb9ae" stroke-width="1.6"/><path d="M${c + 18} ${Y - 47}Q${c + 22} ${Y - 38} ${c + 14} ${Y - 33}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round"/>`
    + F`<ellipse cx="${c}" cy="${Y - 55}" rx="31" ry="12" fill="#dedad1" ${ln(2.2)}/><ellipse cx="${c}" cy="${Y - 59}" rx="29" ry="11" fill="#f7f5ef" ${ln(2.4)}/><path d="M${c - 14} ${Y - 63}q14 -5 28 0" stroke="#fff" stroke-width="2" fill="none" opacity=".9" stroke-linecap="round"/>`, 'hg-toilet');
}

/* ---------- the bedrooms ---------- */
/* a bed with a low log headboard, two pillows and a patchwork quilt. Footprint w × 210, the headboard 30 over it. Foot: y = h. */
export function bed({ w = 150, h = 290, colors = ['#3e6d8c', '#c4573a', '#e0b04a', '#5f8a4a'] } = {}) {
  const Y = h - 210, q0 = Y + 34, q1 = Y + 168, n = 6, sq = (w - 12) / n;
  let quilt = '';
  for (let r = 0, y = q0; y < q1 + 22; y += sq, r++) for (let c = 0; c < n; c++) quilt += R(6 + c * sq, y, sq + .3, Math.min(sq, q1 + 22 - y) + .3, colors[(r + c * 2) % colors.length]);
  return wrap(w, h, shade(w / 2, Y + 200, w / 2 + 6, 16, .3)
    + R(4, Y - 26, w - 8, 190, '#f1ecdf', `rx="10" ${ln(2.4)}`) + R(10, Y - 18, (w - 26) / 2, 34, '#fbfaf6', `rx="12" ${ln(2)}`) + R(w / 2 + 3, Y - 18, (w - 26) / 2, 34, '#fbfaf6', `rx="12" ${ln(2)}`)
    + quilt + R(6, q0, w - 12, q1 + 22 - q0, 'none', `rx="6" ${ln(2.2)}`) + R(6, q0 - 10, w - 12, 14, '#fbfaf6', `rx="4" ${ln(2)}`)
    + F`<path d="M6 ${q0 + 4}H${w - 6}" stroke="#000" stroke-opacity=".15" stroke-width="4"/>`
    + R(0, Y + 186, w, 24, '#a65a2c', `rx="10" ${ln(2.4)}`) + R(4, Y + 190, w - 8, 5, '#d98d4e', 'rx="2" opacity=".6"')
    + R(0, Y - 46, w, 10, '#c98a52', ln(2.4)) + R(0, Y - 36, w, 14, '#a65a2c', ln(2.4)) + F`<path d="M0 ${Y - 29}H${w}" stroke="#5e2a10" stroke-width="2"/>`
    + [0, w - 16].map(x => R(x, Y - 54, 16, 36, '#b8703a', `rx="8" ${ln(2.4)}`)).join(''), 'hg-bed');
}
/* a nightstand with a glowing table lamp. Footprint w × 40, 44 high, the lamp up to 100. Foot: y = h. */
export function nightstand({ w = 48, h = 140 } = {}) {
  const id = uid(), Y = h - 40, cx = w / 2;
  return wrap(w, h, F`<circle cx="${cx}" cy="${Y - 76}" r="${w * .9}" fill="url(#${id})"/>` + R(2, Y - 4, w - 4, 44, '#9a5526', ln(2.2)) + R(6, Y + 2, w - 12, 16, '#b06a35', `rx="2" ${ln(1.4)}`) + R(cx - 4, Y + 8, 8, 3, '#d9a441') + R(0, Y - 44, w, 40, '#c47a3e', `rx="3" ${ln(2.2)}`)
    + F`<path d="M${cx - 8} ${Y - 30}h16l-3 -14h-10Z" fill="#3e6d8c" ${ln(1.6)}/><path d="M${cx} ${Y - 44}v-14" stroke="${O}" stroke-width="3"/><path d="M${cx - 13} ${Y - 58}h26l-6 -24h-14Z" fill="#ffcf73" ${ln(2)}/><path d="M${cx - 9} ${Y - 60}h6l-2 -18h-2Z" fill="#fff0c2" opacity=".8"/>`, 'hg-nightstand', glowDef(id, '#ffb347', .5));
}

/* ---------- the deck ---------- */
/* the deck: orange planks raised over the slope, an orange railing on its west, south and east sides (the east side open
   at gapE for the stairs), warm string lights on the railing, warm light spilling from the cabin's windows (lights: x
   of each). Footprint w × d at height 0, the posts reaching the ground `drop` below its south edge. Box w × (rail + d +
   drop), the footprint's north edge at y = rail. back: the planks and the side railings, foot y = rail; front: the
   south railing and what is under it, foot y = rail + d. */
export function deck({ w = 2100, d = 400, rail = 50, drop = 190, gapE = [0, 150], lights = [360, 600, 840, 1300, 1700], h } = {}) {
  h = h || rail + d + drop;
  const id = uid(), Y = rail, S = Y + d;
  const boards = F`<pattern id="${id}" width="44" height="400" patternUnits="userSpaceOnUse"><rect width="22" height="400" fill="#c06d30"/><rect x="22" width="22" height="400" fill="#b8672c"/><path d="M21 0V400M43 0V400" stroke="#7a3d14" stroke-width="2"/><path d="M0 130H22M22 290H44" stroke="#7a3d14" stroke-width="2"/><rect x="3" width="5" height="400" fill="#f0a060" opacity=".18"/></pattern>`;
  let back = R(0, Y, w, d, `url(#${id})`, ln(3)) + lights.map(x => F`<ellipse cx="${x}" cy="${Y + 30}" rx="190" ry="120" fill="url(#${id}w)"/>`).join('');
  const sideRail = (x, a, b) => R(x - 5, Y + a - rail, 10, b - a + rail, '#d98a4a', ln(2.2)) + Array.from({ length: Math.max(1, Math.floor((b - a) / 100)) + 1 }, (_, i) => R(x - 8, Y + a - rail - 4 + i * (b - a) / Math.max(1, Math.floor((b - a) / 100)), 16, 12, '#a65a2c', ln(2))).join('');
  back += sideRail(6, 0, d);
  if (gapE && gapE[1] < d) back += sideRail(w - 6, gapE[1], d);
  if (gapE && gapE[0] > 0) back += sideRail(w - 6, 0, gapE[0]);
  /* the front: under the deck (dark lattice between posts), its rim, and the south railing with its lights */
  const lat = F`<pattern id="${id}l" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#140d08"/><path d="M0 0L26 26M26 0L0 26" stroke="#6e3a18" stroke-width="5"/></pattern>`;
  let front = R(8, S + 22, w - 16, drop - 22, `url(#${id}l)`, ln(2.4));
  const np = Math.max(1, Math.round(w / 350));
  for (let i = 0; i <= np; i++) { const x = Math.min(w - 22, Math.max(4, i * w / np - 9)); front += R(x, S + 18, 18, drop - 18, '#9a5526', ln(2.2)) + R(x + 3, S + 20, 4, drop - 24, '#d98a4a', 'opacity=".4"'); }
  front += R(0, S, w, 22, '#a65a2c', ln(2.4)) + R(0, S + 2, w, 5, '#e09a5c', 'opacity=".5"');
  let bal = '';
  for (let x = 14; x < w - 8; x += 20) bal += F`M${x} ${S - rail + 6}V${S - 2}`;
  front += `<path d="${bal}" stroke="${O}" stroke-width="8"/><path d="${bal}" stroke="#d07a35" stroke-width="4.5"/>` + R(0, S - 8, w, 7, '#b8672c', ln(1.8));
  const pr = Math.max(1, Math.round(w / 210));
  for (let i = 0; i <= pr; i++) { const x = Math.min(w - 14, Math.max(0, i * w / pr - 7)); front += R(x, S - rail - 6, 14, rail + 6, '#c06d30', ln(2.2)); }
  front += R(-4, S - rail - 12, w + 8, 8, '#e8a060', ln(2.2)) + R(-4, S - rail - 4, w + 8, 6, '#a65a2c', ln(1.8));
  front += stringLights(0, w, S - rail - 6, 14, w / pr, 28, 5);
  return pair(w, h, [back, boards + glowDef(id + 'w', '#ffb347', .38)], [front, lat], Y, S);
}
/* the deck's stairs: a landing at the deck's height, then steps down south to the ground rise lower, railings on both
   sides. Footprint w × d (landing first), box w × (rail + d + rise); the landing's north edge at y = rail. back: the
   landing, treads and risers, foot y = rail (ducks walk on it); front: the side railings, foot y = rail + d. */
export function deckStairs({ w = 200, d = 700, rise = 240, steps = 12, landing = 150, rail = 50, h } = {}) {
  h = h || rail + d + rise;
  const Y = rail, td = (d - landing) / steps, r = rise / steps;
  let back = R(0, Y, w, landing, '#c06d30', ln(2.4)) + F`<path d="M44 ${Y}V${Y + landing}M88 ${Y}V${Y + landing}M132 ${Y}V${Y + landing}M176 ${Y}V${Y + landing}" stroke="#7a3d14" stroke-width="2"/>`;
  for (let i = 1; i <= steps; i++) {
    const y = Y + landing + (i - 1) * td;
    back += R(10, y + (i - 1) * r, w - 20, r, '#7e3f18', ln(2)) + R(10, y + i * r, w - 20, td, '#c46f31', ln(2)) + R(12, y + i * r + 2, w - 24, 4, '#f0a060', 'opacity=".45"');
  }
  let front = '';
  for (const x of [5, w - 5]) {
    front += R(x - 6, Y - rail, 12, d + rise, '#d98a4a', ln(2.2)) + R(x - 2, Y - rail + 2, 3, d + rise - 4, '#f0b070', 'opacity=".5"');
    for (const y of [Y - rail - 6, Y + landing - rail - 6, Y + d + rise - rail - 6]) front += R(x - 9, y, 18, 14, '#a65a2c', ln(2));
  }
  return pair(w, h, [back], [front], Y, Y + d);
}
/* a rocking chair, side-on (facing 'e' or 'w'), with a plaid cushion. Foot: bottom (y = h − 4). */
export function rockingChair({ w = 70, h = 100, facing = 'e' } = {}) {
  const b = h - 4, wood = '#c06d30', sx = w / 70, sy = h / 100;
  const P = (x, y) => F`${x * sx} ${y * sy}`;
  let s = shade(w / 2, b, w * .42, 5) + `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  const path = `M${P(4, 84)}Q${P(34, 100)} ${P(68, 80)}M${P(20, 56)}L${P(16, 88)}M${P(54, 56)}L${P(56, 88)}M${P(14, 58)}L${P(6, 10)}M${P(10, 34)}L${P(56, 38)}L${P(54, 56)}`;
  s += `<path d="${path}" stroke="${O}" stroke-width="10"/><path d="${path}" stroke="${wood}" stroke-width="5.5"/></g>`;
  s += F`<path d="M${P(8, 14)}L${P(14, 52)}" stroke="#e09a5c" stroke-width="2" opacity=".6"/><path d="M${P(9, 18)}h${10 * sx}M${P(10, 30)}h${10 * sx}" stroke="${O}" stroke-width="3"/>`;
  s += R(10 * sx, 50 * sy, 50 * sx, 9 * sy, '#a65a2c', `rx="3" ${ln(2)}`) + R(12 * sx, 42 * sy, 44 * sx, 10 * sy, '#c4302b', `rx="5" ${ln(2)}`) + F`<path d="M${P(22, 42)}v${10 * sy}M${P(38, 42)}v${10 * sy}" stroke="#ffd23f" stroke-width="2.4"/>`;
  return wrap(w, h, facing === 'w' ? F`<g transform="translate(${w} 0) scale(-1 1)">${s}</g>` : s, 'hg-rocker');
}
/* a little round table with a lantern and two mugs. Footprint w × w, 40 high. Foot: y = h. */
export function smallTable({ w = 60, h = 130 } = {}) {
  const id = uid(), cx = w / 2, Y = h - w, cy = Y + w / 2 - 40;
  return wrap(w, h, shade(cx, Y + w / 2, w * .45, w * .25, .3) + R(cx - 5, cy, 10, 44, '#8a4a22', ln(2)) + F`<ellipse cx="${cx}" cy="${Y + w / 2 + 2}" rx="${w * .28}" ry="6" fill="#6e3a1a" ${ln(1.8)}/><circle cx="${cx}" cy="${cy}" r="${w / 2}" fill="#c47a3e" ${ln(2.4)}/><circle cx="${cx - 6}" cy="${cy - 6}" r="${w / 3}" fill="#e09a5c" opacity=".35"/>`
    + F`<circle cx="${cx}" cy="${cy - 24}" r="40" fill="url(#${id})" class="hg-flicker"/><rect x="${cx - 7}" y="${cy - 30}" width="14" height="20" rx="3" fill="#ffd98a" ${ln(1.8)}/><path d="M${cx - 9} ${cy - 31}h18M${cx} ${cy - 31}v-6" stroke="${O}" stroke-width="2.6"/>`
    + F`<rect x="${cx - 22}" y="${cy - 2}" width="9" height="10" rx="2" fill="#2fa4ff" ${ln(1.4)}/><rect x="${cx + 12}" y="${cy + 2}" width="9" height="10" rx="2" fill="#ef3b3b" ${ln(1.4)}/>`, 'hg-smalltable', glowDef(id, '#ffb347', .5));
}

/* ---------- the pool ---------- */
/* the pool: stone coping c wide, the water depth below the ground, lit by lights under the water, steps at its west end,
   a ladder at its east end. Footprint w × d. back: the coping, the far wall and the water (flat), foot null;
   front: the near coping, foot y = h. The water shows from y = c + depth to y = d − c. */
export function pool({ w = 1800, d = 800, h, depth = 40, c = 30, lights = 5 } = {}) {
  h = h || d;
  const id = uid(), ww = w - 2 * c, wy = c + depth, wb = d - c;
  let s = R(0, 0, w, d, '#8a8e94', `rx="18" ${ln(3)}`) + R(c, c, ww, d - 2 * c, '#0b3f5c', ln(2.4));
  s += R(c, c, ww, depth, `url(#${id}t)`) + R(c, c, ww, depth, `url(#${id}k)`) + R(c, c, ww, depth, '#000', 'opacity=".1"');
  s += R(c, wy, ww, wb - wy, `url(#${id}w)`);
  let lamps = '';
  for (let i = 0; i < lights; i++) {
    const x = c + ww * (i + .5) / lights;
    lamps += F`<ellipse cx="${x}" cy="${wy + 70}" rx="190" ry="150" fill="url(#${id}g)" class="hg-shimmer" style="animation-delay:-${(i * 1.3).toFixed(1)}s"/><ellipse cx="${x + ww / lights / 2}" cy="${wb - 40}" rx="170" ry="110" fill="url(#${id}g)" opacity=".7"/>`;
    s += F`<ellipse cx="${x}" cy="${c + depth * .55}" rx="15" ry="8" fill="#f2ffff" ${ln(2)}/><ellipse cx="${x}" cy="${c + depth * .55}" rx="7" ry="3.5" fill="#fff"/>`;
  }
  s += lamps;
  /* the pool floor's lane lines, seen through the water */
  const lane = x => F`<path d="M${x} ${wy + 70}V${wb - 60}M${x - 30} ${wy + 70}H${x + 30}M${x - 30} ${wb - 60}H${x + 30}" stroke="#0a4f73" stroke-width="16" opacity=".45"/>`;
  s += lane(c + ww * .25) + lane(c + ww * .75);
  s += R(c, wy, ww, wb - wy, `url(#${id}a)`, 'class="hg-shimmer"') + R(c, wy, ww, wb - wy, `url(#${id}b)`, 'class="hg-shimmer" style="animation-delay:-1.8s"');
  /* the steps at the west end */
  for (let k = 0; k < 3; k++) s += R(c + k * 44, wy + 10, 44, Math.min(300, wb - wy - 20), '#6fe0f4', `opacity="${.32 - k * .08}"`) + F`<path d="M${c + (k + 1) * 44} ${wy + 10}V${wy + 10 + Math.min(300, wb - wy - 20)}" stroke="#e8fbff" stroke-width="4" opacity=".75"/>`;
  s += F`<path d="M${c} ${wy + 10 + Math.min(300, wb - wy - 20)}H${c + 132}" stroke="#e8fbff" stroke-width="3" opacity=".5"/>`;
  /* the ladder at the east end */
  for (const x of [w - 300, w - 252]) s += F`<path d="M${x} ${c + 14}C${x} ${c - 34} ${x + 26} ${c - 34} ${x + 26} ${c + 26}V${c + depth + 26}" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x} ${c + 14}C${x} ${c - 34} ${x + 26} ${c - 34} ${x + 26} ${c + 26}V${c + depth + 26}" stroke="#d9e1ea" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  let joints = '';
  for (let x = 60; x < w - 20; x += 60) joints += F`M${x} 2V${c - 2}`;
  for (let y = c + 60; y < d - c; y += 60) joints += F`M2 ${y}H${c - 2}M${w - c + 2} ${y}H${w - 2}`;
  s += `<path d="${joints}" stroke="#5e6268" stroke-width="2"/>` + R(4, 4, w - 8, 5, '#fff', 'rx="2" opacity=".15"') + R(c * 2, 8, 60, 14, '#3e4248', `rx="3" ${ln(1.6)}`);
  const defs = F`<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b9cc4"/><stop offset=".5" stop-color="#127fa8"/><stop offset="1" stop-color="#0b5f88"/></linearGradient>`
    + `<linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ee3ef"/><stop offset="1" stop-color="#3fb8d6"/></linearGradient>`
    + F`<pattern id="${id}k" width="24" height="${depth}" patternUnits="userSpaceOnUse" x="${c}" y="${c}"><path d="M0 .5H24M.5 0V${depth}M0 ${depth / 2}H24" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.4"/></pattern>`
    + glowDef(id + 'g', '#8ff6ff', .6)
    + `<pattern id="${id}a" width="140" height="70" patternUnits="userSpaceOnUse"><path d="M0 20Q35 4 70 20T140 20M0 55Q35 40 70 55T140 55M20 0Q30 35 15 70M95 0Q110 35 90 70" stroke="#c8fbff" stroke-width="2.2" fill="none" opacity=".35"/></pattern>`
    + `<pattern id="${id}b" width="180" height="90" patternUnits="userSpaceOnUse" patternTransform="translate(40 20)"><path d="M0 30Q45 10 90 30T180 30M0 75Q45 55 90 75T180 75M50 0Q65 45 45 90" stroke="#e2fdff" stroke-width="1.8" fill="none" opacity=".3"/></pattern>`;
  let fj = '';
  for (let x = 60; x < w - 20; x += 60) fj += F`M${x} ${d - c + 2}V${d - 2}`;
  const front = F`<path d="M0 ${wb}H${w}V${d - 18}Q${w} ${d} ${w - 18} ${d}H18Q0 ${d} 0 ${d - 18}Z" fill="#8a8e94" ${ln(3)}/><path d="${fj}" stroke="#5e6268" stroke-width="2"/>` + R(c, wb - 2, ww, 6, '#5e6268') + R(4, wb + 4, w - 8, 4, '#fff', 'rx="2" opacity=".15"');
  return pair(w, h, [s, defs], [front], null, h);
}
/* the lane rope across the pool (north to south): floats on a line, red near the ends. Drawn under every duck.
   Anchor: flat (draw it above the water, below every duck and everything they wear). */
export function laneRope({ w = 22, h = 740 } = {}) {
  const n = Math.floor((h - 12) / 14);
  let s = F`<path d="M${w / 2} 4V${h - 4}" stroke="${O}" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) {
    const y = 10 + i * (h - 20) / (n - 1), c = i < 5 || i >= n - 5 ? '#ef3b3b' : i % 2 ? '#f4f4f0' : '#2fa4ff';
    s += F`<ellipse cx="${w / 2}" cy="${y}" rx="${w / 2 - 1}" ry="6.5" fill="${c}" ${ln(1.6)}/><ellipse cx="${w / 2 - 3}" cy="${y - 2}" rx="3" ry="1.6" fill="#fff" opacity=".6"/>`;
  }
  return wrap(w, h, s + F`<circle cx="${w / 2}" cy="4" r="5" fill="#c9ced6" ${ln(1.6)}/><circle cx="${w / 2}" cy="${h - 4}" r="5" fill="#c9ced6" ${ln(1.6)}/>`, 'hg-ground hg-rope');
}
/* a little rubber duck floating (facing 'e' or 'w'), with a ripple. Foot: the waterline (y = h − 5). */
export function rubberDuck({ w = 28, h = 26, color = '#ffd23f', facing = 'e' } = {}) {
  const b = h - 5, k = w / 28, edge = mix(color, 0, .45);
  const g = F`<ellipse cx="${w / 2}" cy="${b}" rx="${13 * k}" ry="${3.4 * k}" fill="none" stroke="#c8fbff" stroke-width="1.6" opacity=".7"/>`
    + F`<path d="M${3 * k} ${b - 9 * k}C${2 * k} ${b - 2 * k} ${7 * k} ${b} ${14 * k} ${b}C${22 * k} ${b} ${25 * k} ${b - 4 * k} ${24 * k} ${b - 9 * k}H${12 * k}C${9 * k} ${b - 9 * k} ${6 * k} ${b - 8 * k} ${3 * k} ${b - 11 * k}Z" fill="${color}" stroke="${edge}" stroke-width="1.4"/>`
    + F`<circle cx="${18 * k}" cy="${b - 14 * k}" r="${5.5 * k}" fill="${color}" stroke="${edge}" stroke-width="1.4"/><path d="M${23 * k} ${b - 14.5 * k}l${4.5 * k} ${1 * k}l${-4.5 * k} ${2.2 * k}Z" fill="#ff9a1f" stroke="#a85a00" stroke-width=".8"/><circle cx="${19.5 * k}" cy="${b - 15.5 * k}" r="${1.1 * k}" fill="${O}"/><ellipse cx="${16 * k}" cy="${b - 17 * k}" rx="${1.8 * k}" ry="${1 * k}" fill="#fff" opacity=".7"/>`;
  return wrap(w, h, facing === 'w' ? F`<g transform="translate(${w} 0) scale(-1 1)">${g}</g>` : g, 'hg-rduck');
}
/* the beach ball (spin: degrees). Foot: the bottom (y = h − 3); shadow: false leaves out its shadow (the world can draw
   it on the ground under a ball in the air). */
export function beachBall({ w = 48, h = 52, spin = 0, shadow = true } = {}) {
  const id = uid(), r = w / 2 - 1.5, cx = w / 2, cy = h - 3 - r, cols = ['#ef3b3b', '#f4f4f0', '#2fa4ff', '#ffd23f', '#f4f4f0', '#37d421'];
  const px = cx - r * .25, py = cy - r * .35;
  let wedges = '';
  for (let i = 0; i < 6; i++) { const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2; wedges += F`<path d="M${px} ${py}L${px + Math.cos(a0) * r * 3} ${py + Math.sin(a0) * r * 3}L${px + Math.cos(a1) * r * 3} ${py + Math.sin(a1) * r * 3}Z" fill="${cols[i]}"/>`; }
  return wrap(w, h, (shadow ? shade(cx, h - 3, r * .9, r * .25) : '') + F`<g clip-path="url(#${id})"><g transform="rotate(${spin} ${cx} ${cy})">${wedges}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}s)"/></g><circle cx="${px}" cy="${py}" r="${r * .16}" fill="#f4f4f0" ${ln(1.2)}/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${ln(2)}/><ellipse cx="${cx - r * .35}" cy="${cy - r * .45}" rx="${r * .28}" ry="${r * .14}" fill="#fff" opacity=".7" transform="rotate(-30 ${cx - r * .35} ${cy - r * .45})"/>`,
  'hg-ball', F`<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><radialGradient id="${id}s" cx=".35" cy=".3" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`);
}

/* ---------- around the yard ---------- */
/* the campfire: a ring of stones, logs, a flickering fire, sparks. Footprint w × w (the ring), the flames rising above;
   box w × (w + 110). Foot: y = h. Give it a big glow() on the ground too. */
export function campfire({ w = 150, h } = {}) {
  h = h || w + 110;
  const id = uid(), Y = h - w, cx = w / 2, cy = Y + w / 2, rr = w * .39;
  const stone = a => { const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; return F`<ellipse cx="${x}" cy="${y}" rx="${w * .1}" ry="${w * .08}" fill="#5c6068" ${ln(2)}/><ellipse cx="${x - 2}" cy="${y - 4}" rx="${w * .07}" ry="${w * .045}" fill="#8a8f98"/>`; };
  const A = Array.from({ length: 12 }, (_, i) => i / 12 * Math.PI * 2 + .2);
  let s = F`<circle cx="${cx}" cy="${cy}" r="${w * .8}" fill="url(#${id})" class="hg-flicker"/>` + A.filter(a => Math.sin(a) < 0).map(stone).join('')
    + F`<circle cx="${cx}" cy="${cy}" r="${rr - 4}" fill="#2b2220" ${ln(2)}/><circle cx="${cx}" cy="${cy + 4}" r="${rr * .6}" fill="#ff7a1f" opacity=".45"/>`;
  const logs = F`M${cx - rr * .8} ${cy + rr * .5}L${cx + 4} ${cy - rr * 1.2}M${cx + rr * .8} ${cy + rr * .5}L${cx - 4} ${cy - rr * 1.2}M${cx - rr * .3} ${cy + rr * .75}L${cx + 2} ${cy - rr * 1.1}M${cx + rr * .35} ${cy + rr * .75}L${cx - 2} ${cy - rr * 1.1}`;
  s += `<path d="${logs}" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="${logs}" stroke="#6b3f22" stroke-width="8.5" stroke-linecap="round"/>`;
  s += fire(cx, cy + 8, w / 150 * 1.05);
  s += A.filter(a => Math.sin(a) >= 0).map(stone).join('');
  for (let i = 0; i < 4; i++) s += F`<circle cx="${cx - 10 + i * 7}" cy="${cy - 70}" r="2.2" fill="#ffd27a" class="hg-spark" style="animation-delay:-${(i * .47).toFixed(2)}s"/>`;
  return wrap(w, h, s, 'hg-campfire', glowDef(id, '#ff9a3a', .45));
}
/* a log to sit on. axis 'x' lies east-west (box w × 79; its ends drawn as cut rings); axis 'y' lies north-south (box
   40 × h; its south end shows the rings). Seat height 40. Foot: y = h. */
export function logSeat({ w, h, axis = 'x' } = {}) {
  const bark = '#6b4226', cut = '#d9a066';
  if (axis === 'y') {
    w = w || 40; h = h || 200;
    const r = w / 2;
    return wrap(w, h, shade(r, h - 4, r + 4, 6) + R(0, 0, w, h - r, bark, `rx="${r}" ${ln(2.4)}`) + F`<path d="M${r * .5} 10V${h - w - 4}M${r * 1.3} 18V${h - w - 10}" stroke="#4a2c18" stroke-width="2.4"/><path d="M${r * .35} 14V${h - w}" stroke="#9a6a44" stroke-width="2" opacity=".6"/>`
      + F`<circle cx="${r}" cy="${h - r}" r="${r - 1}" fill="${cut}" ${ln(2.4)}/><circle cx="${r}" cy="${h - r}" r="${r * .62}" fill="none" stroke="#a0602c" stroke-width="1.6"/><circle cx="${r}" cy="${h - r}" r="${r * .3}" fill="none" stroke="#a0602c" stroke-width="1.6"/>`, 'hg-log');
  }
  w = w || 180; h = h || 79;
  const t = h - 46 - 2;
  return wrap(w, h, shade(w / 2, h - 6, w / 2, 9) + R(8, t - 30, w - 16, 62, bark, `rx="26" ${ln(2.4)}`) + F`<path d="M24 ${t - 14}H${w - 40}M30 ${t + 4}H${w - 26}M20 ${t + 20}H${w - 60}" stroke="#4a2c18" stroke-width="2.4"/><path d="M26 ${t - 24}H${w - 30}" stroke="#9a6a44" stroke-width="3" opacity=".6"/>`
    + [12, w - 12].map(x => F`<ellipse cx="${x}" cy="${t + 1}" rx="10" ry="30" fill="${cut}" ${ln(2.4)}/><ellipse cx="${x}" cy="${t + 1}" rx="5.5" ry="17" fill="none" stroke="#a0602c" stroke-width="1.5"/>`).join(''), 'hg-log');
}
/* the trampoline: round (w × d), a black mat in a blue pad at height z, legs. Box w × (d + z). back: the mat and the
   pad, foot y = z (north edge); front: the pad's front and the legs, foot y = h. */
export function trampoline({ w = 300, d, z = 44, h } = {}) {
  d = d || w; h = h || d + z;
  const Y = h - d, cx = w / 2, rx = w / 2, ry = d / 2, cy = Y + ry - z, p = 22;
  let seams = '';
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; seams += F`M${cx + Math.cos(a) * (rx - p)} ${cy + Math.sin(a) * (ry - p)}L${cx + Math.cos(a) * rx} ${cy + Math.sin(a) * ry}`; }
  const back = F`<ellipse cx="${cx}" cy="${Y + ry}" rx="${rx}" ry="${ry}" fill="#000" opacity=".35"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2f86d6" ${ln(3)}/><path d="${seams}" stroke="#1d5a9a" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - p}" ry="${ry - p}" fill="#1b1b22" ${ln(2.4)}/><ellipse cx="${cx - rx * .2}" cy="${cy - ry * .25}" rx="${rx * .45}" ry="${ry * .3}" fill="#fff" opacity=".05"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - p - 10}" ry="${ry - p - 10}" fill="none" stroke="#33333e" stroke-width="2" stroke-dasharray="4 6"/>`;
  let legs = '';
  for (const a of [.45, 1.2, 1.95, 2.7]) { const x = cx + Math.cos(a) * (rx - 8), y = cy + Math.sin(a) * (ry - 8); legs += F`M${x} ${y + 6}V${y + z}`; }
  const ring = F`M0 ${cy}A${rx} ${ry} 0 0 0 ${w} ${cy}H${w - p}A${rx - p} ${ry - p} 0 0 1 ${p} ${cy}Z`;
  const front = `<path d="${legs}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="${legs}" stroke="#9aa3ad" stroke-width="5.5" stroke-linecap="round"/>`
    + F`<path d="M0 ${cy}A${rx} ${ry} 0 0 0 ${w} ${cy}V${cy + 8}A${rx} ${ry} 0 0 1 0 ${cy + 8}Z" fill="#1d5a9a" ${ln(2.4)}/><path d="${ring}" fill="#2f86d6" ${ln(2.4)}/><path d="M${p + 6} ${cy + 10}A${rx - p} ${ry - p} 0 0 0 ${w - p - 6} ${cy + 10}" stroke="#7ec0ff" stroke-width="3" fill="none" opacity=".35"/>`;
  return pair(w, h, [back], [front], Y, h);
}
/* the soccer field's painted lines on the grass (mowing stripes, the halfway line, the center circle, both boxes).
   Anchor: flat. */
export function soccerField({ w = 1300, h = 1400 } = {}) {
  const m = 30, cy = h / 2, cx = w / 2;
  let s = '';
  for (let x = 0, i = 0; x < w; x += 130, i++) s += R(x, 0, 130, h, i % 2 ? '#ffffff' : '#000000', `opacity="${i % 2 ? .035 : .06}"`);
  const box = (x, bw, bh) => F`M${x} ${cy - bh / 2}H${x + bw}V${cy + bh / 2}H${x}`;
  const L = F`M${m} ${m}H${w - m}V${h - m}H${m}ZM${cx} ${m}V${h - m}` + box(m, 230, 640) + box(m, 90, 300) + F`M${w - m} ${cy - 320}H${w - m - 230}V${cy + 320}H${w - m}M${w - m} ${cy - 150}H${w - m - 90}V${cy + 150}H${w - m}`
    + F`M${m} ${m + 34}A34 34 0 0 0 ${m + 34} ${m}M${w - m - 34} ${m}A34 34 0 0 0 ${w - m} ${m + 34}M${m} ${h - m - 34}A34 34 0 0 1 ${m + 34} ${h - m}M${w - m - 34} ${h - m}A34 34 0 0 1 ${w - m} ${h - m - 34}`
    + F`M${m + 230} ${cy - 80}A110 110 0 0 1 ${m + 230} ${cy + 80}M${w - m - 230} ${cy - 80}A110 110 0 0 0 ${w - m - 230} ${cy + 80}`;
  s += F`<path d="${L}" stroke="#e8f0e6" stroke-width="9" fill="none" opacity=".8" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="#e8f0e6" stroke-width="9" opacity=".8"/>`
    + [[cx, cy], [m + 160, cy], [w - m - 160, cy]].map(([x, y]) => F`<circle cx="${x}" cy="${y}" r="8" fill="#e8f0e6" opacity=".85"/>`).join('');
  return wrap(w, h, s, 'hg-ground hg-field');
}
/* the soccer net at the field's east end, its mouth facing west: posts and crossbar z high, the net sloping back to
   backZ. Footprint w × d (d: the goal's width, north to south); box w × (d + z). back: the north side, the back and the
   north post, foot y = z (north edge); front: the roof net, the crossbar, the south side and post, foot y = h. */
export function soccerNet({ w = 120, d = 500, z = 110, backZ = 70, h } = {}) {
  h = h || d + z;
  const id = uid(), Y = h - d;
  const mesh = k => F`<pattern id="${id}${k}" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 0L16 16M16 0L0 16" stroke="#f4f4f0" stroke-width="1.5" opacity=".55"/></pattern>`;
  const side = (y, k) => F`<path d="M0 ${y}V${y - z}L${w} ${y - backZ}V${y}Z" fill="url(#${id}${k})" stroke="#e8e8e0" stroke-width="2.4"/>`;
  const post = y => R(-4, y - z, 9, z, '#f4f4f0', `rx="3" ${ln(2)}`);
  const back = F`<path d="M0 ${Y}H${w}V${Y + d}H0" stroke="#d8d8d0" stroke-width="4" fill="none" opacity=".7"/>` + side(Y, 'b') + R(w - 3, Y - backZ, 5, d + backZ, '#e8e8e0', ln(1.4)) + post(Y);
  const front = F`<path d="M0 ${Y - z}L${w} ${Y - backZ}V${Y + d - backZ}L0 ${Y + d - z}Z" fill="url(#${id}f)" stroke="#e8e8e0" stroke-width="2.4"/>` + side(Y + d, 'f') + R(-4, Y - z - 4, 9, d + 8, '#f4f4f0', `rx="3" ${ln(2)}`) + post(Y + d);
  return pair(w, h, [back, mesh('b')], [front, mesh('f')], Y, h);
}
/* the soccer ball. Foot: the bottom (y = h − 3). */
export function soccerBall({ w = 30, h = 34, spin = 0, shadow = true } = {}) {
  const id = uid(), r = w / 2 - 1.5, cx = w / 2, cy = h - 3 - r, pent = (x, y, s) => { let p = ''; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; p += (i ? 'L' : 'M') + F`${x + Math.cos(a) * s} ${y + Math.sin(a) * s}`; } return `<path d="${p}Z" fill="${O}"/>`; };
  return wrap(w, h, (shadow ? shade(cx, h - 3, r * .9, r * .28) : '') + F`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4f4f0"/><g transform="rotate(${spin} ${cx} ${cy})">${pent(cx, cy, r * .32)}${[0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; return pent(cx + Math.cos(a) * r * .92, cy + Math.sin(a) * r * .92, r * .26); }).join('')}</g>`
    + F`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})" ${ln(2)}/><ellipse cx="${cx - r * .35}" cy="${cy - r * .45}" rx="${r * .26}" ry="${r * .13}" fill="#fff" opacity=".8" transform="rotate(-30 ${cx - r * .35} ${cy - r * .45})"/>`,
  'hg-ball', `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`);
}

/* ---------- the red jeep ----------
   An early-2000s boxy two-door with a black soft top: round headlights, a seven-slot grille, flat fenders with black
   flares, a spare tire on the back. No badge, no name. Seen a little from its front (facing 'e', the default) so the
   grille shows; 'w' is the same, mirrored. Box w × 214; its footprint (about 230 × 100, the spare included) has its
   south-west corner near (4, 214) and leans right toward its north side. back: its shadow (flat); front: the jeep,
   foot y = h. */
export function jeep({ w = 292, h = 214, facing = 'e', color = '#c42b2b' } = {}) {
  const kx = .62, ox = 22, DD = 100, Y = h - DD;
  const top = mix(color, 255, .14), south = color, east = mix(color, 0, .22), dark = mix(color, 0, .45), blk = '#26262c', blk2 = '#1d1d22';
  const S = dep => F`matrix(1 0 0 -1 ${ox + kx * (DD - dep)} ${Y + dep})`, T = H => F`matrix(1 0 ${-kx} 1 ${ox + kx * DD} ${Y - H})`, E = X => F`matrix(${-kx} 1 0 -1 ${X + ox + kx * DD} ${Y})`;
  const g = (m, inner) => `<g transform="${m}">${inner}</g>`;
  const box = (x0, x1, d0, d1, h0, h1, ct, cs, ce, o = {}) => g(S(d1), R(x0, h0, x1 - x0, h1 - h0, cs, `rx="${o.r || 0}" ${ln(2)}`) + (o.s || '')) + g(E(x1), R(d0, h0, d1 - d0, h1 - h0, ce, `rx="${o.r || 0}" ${ln(2)}`) + (o.e || '')) + g(T(h1), R(x0, d0, x1 - x0, d1 - d0, ct, `rx="${o.r || 0}" ${ln(2)}`) + (o.t || ''));
  const wheel = (x, dep) => g(S(dep - 16), F`<circle cx="${x}" cy="21" r="21" fill="${blk2}" ${ln(2)}/>`) + g(S(dep), F`<circle cx="${x}" cy="21" r="21" fill="${blk}" ${ln(2.2)}/><circle cx="${x}" cy="21" r="12" fill="#8d949e" ${ln(1.6)}/><circle cx="${x}" cy="21" r="4.5" fill="#5d636c"/>${[0, 1, 2, 3, 4].map(i => F`<circle cx="${x + Math.cos(i * 1.2566) * 8}" cy="${21 + Math.sin(i * 1.2566) * 8}" r="1.6" fill="#3a3f46"/>`).join('')}`);
  const flare = (x0, x1) => F`<path d="M${x0} 24C${x0 + 2} 54 ${x1 - 2} 54 ${x1} 24" stroke="${O}" stroke-width="10" fill="none"/><path d="M${x0} 24C${x0 + 2} 54 ${x1 - 2} 54 ${x1} 24" stroke="${blk}" stroke-width="6" fill="none"/>`;
  let s = '';
  /* the wheels and their flares stay inside the body's width (8 … 92), the front fenders only a little past it */
  s += wheel(45, 22) + wheel(160, 22);
  s += box(132, 200, 5, 16, 44, 50, top, blk, blk);
  /* the spare on the back */
  s += box(-20, -2, 26, 74, 36, 90, '#2c2c33', blk2, blk2, { r: 9, s: F`<path d="M-17 44h12M-17 54h12M-17 64h12M-17 74h12M-17 84h12" stroke="#3a3a42" stroke-width="2"/>` });
  s += box(-8, 6, 10, 90, 16, 26, '#3a3a42', blk, blk2);
  /* the tub, the doors, the soft top with its windows, the windshield */
  s += box(4, 150, 8, 92, 20, 62, top, south, east, { s: F`<path d="M92 24V60M144 24V60" stroke="${dark}" stroke-width="2"/><rect x="98" y="52" width="12" height="3.5" rx="1.5" fill="${blk}"/><path d="M8 56H146" stroke="#fff" stroke-width="2.5" opacity=".18"/>` });
  s += box(10, 134, 10, 90, 62, 112, '#2e2e37', '#25252c', '#1f1f25', { r: 4, s: F`<rect x="72" y="70" width="54" height="34" rx="4" fill="#3d5574" ${ln(1.6)}/><path d="M80 76l14 20M92 74l10 14" stroke="#9ab4d4" stroke-width="3" opacity=".5"/><rect x="20" y="72" width="40" height="30" rx="4" fill="#33465f" ${ln(1.6)}/><path d="M66 64V110" stroke="#18181d" stroke-width="2"/>`, t: '<path d="M14 30H130M14 70H130" stroke="#3c3c47" stroke-width="2"/>' });
  s += box(134, 141, 10, 90, 62, 110, top, south, '#3e587a', { e: F`<rect x="14" y="66" width="72" height="40" fill="#3e587a" stroke="${color}" stroke-width="5"/><path d="M24 70l22 32M40 70l16 24" stroke="#a8c4e4" stroke-width="3" opacity=".55"/>` });
  /* the hood and its grille face: seven slots and two round headlights */
  let slots = '';
  for (let k = 0; k < 7; k++) slots += F`<rect x="${31.5 + k * 5.4}" y="38" width="3" height="21" rx="1.4" fill="${blk2}"/>`;
  const lamp = dep => F`<circle cx="${dep}" cy="50" r="10" fill="#c9ced6" ${ln(1.8)}/><circle cx="${dep}" cy="50" r="7" fill="#fff4cf"/><circle cx="${dep - 2}" cy="52" r="2.4" fill="#fff"/><circle cx="${dep}" cy="38.5" r="2.6" fill="#ffb02e" ${ln(1)}/>`;
  s += box(141, 197, 14, 86, 30, 64, top, south, east, { e: slots + lamp(22) + lamp(78) + R(16, 30, 68, 3, dark), t: F`<path d="M146 22v56M190 22v56" stroke="${dark}" stroke-width="1.6" opacity=".7"/><rect x="186" y="44" width="6" height="12" rx="2" fill="${dark}"/>` });
  s += box(128, 136, 92, 100, 66, 78, blk, blk, blk);
  s += box(196, 206, 10, 90, 16, 26, '#3a3a42', blk, blk2);
  s += wheel(45, 94) + wheel(160, 94);
  s += box(132, 200, 84, 95, 44, 50, top, blk, blk);
  s += g(S(94), flare(20, 70) + flare(134, 186));
  s += g(T(50), F`<path d="M134 90H198" stroke="#fff" stroke-width="2" opacity=".25"/>`) + g(T(64), F`<path d="M144 20H196" stroke="#fff" stroke-width="3" opacity=".3"/>`);
  const shadow = g(T(0), R(-26, -4, 248, 108, '#000', 'rx="26" opacity=".38"'));
  const flip = x => facing === 'w' ? F`<g transform="translate(${w} 0) scale(-1 1)">${x}</g>` : x;
  return pair(w, h, [flip(shadow)], [flip(s)], null, h);
}

/* ---------- every prop, for the world and the preview ---------- */
/* name: [the function, default w, default h, the anchor in words] */
export const ART = {
  ground: [ground, 400, 300, 'flat'], dirtPath: [dirtPath, 1000, 160, 'flat'], glow: [glow, 300, 200, 'flat'], rug: [rug, 300, 200, 'flat'],
  tree: [tree, 120, 250, 'pair: shadow flat, tree at y = h − 8'], forest: [forest, 1200, 500, 'foot y = top (300)'],
  lamppost: [lamppost, 140, 230, 'pair: light flat, post at y = h − 14'], floorLamp: [floorLamp, 70, 170, 'foot y = h − 6'],
  cabinOutside: [cabinOutside, 3000, 1890, 'foot y = h (the south wall)'], logWall: [logWall, 400, 64, 'foot y = h'],
  fireplace: [fireplace, 280, 242, 'pair: breast at y = 200, hearth at y = h'], couch: [couch, 500, 174, 'pair: seat at y = 64, back at y = h'],
  pianoBody: [pianoBody, 360, 240, 'pair: case at y = 205, keys at y = h'],
  stage: [stage, 250, 460, 'pair: top at y = 70, skirt at y = h'], stageStairs: [stageStairs, 80, 217, 'pair: treads at y = 70, nothing in front'], micStand: [micStand, 56, 120, 'foot y = h − 6'],
  chalkFloor: [chalkFloor, 600, 550, 'flat'], eraserTile: [eraserTile, 72, 72, 'flat'], wipeTile: [wipeTile, 72, 72, 'flat'], chalkTile: [chalkTile, 72, 72, 'flat'], bookStand: [bookStand, 76, 136, 'foot y = h'],
  counter: [counter, 260, 240, 'foot y = h'], fridge: [fridge, 76, 196, 'foot y = h'], stove: [stove, 76, 150, 'foot y = h'], kitchenTable: [kitchenTable, 200, 240, 'pair: chairs at y = 100, table at y = h − 10'],
  tub: [tub, 170, 130, 'foot y = h'], sink: [sink, 66, 196, 'foot y = h'], toilet: [toilet, 80, 130, 'foot y = h'], bed: [bed, 150, 290, 'foot y = h'], nightstand: [nightstand, 48, 140, 'foot y = h'],
  deck: [deck, 2100, 640, 'pair: planks at y = 50, railing at y = 450'], deckStairs: [deckStairs, 200, 990, 'pair: steps at y = 50, rails at y = 750'],
  doorFace: [doorFace, 150, 150, 'foot y = h'], doorSide: [doorSide, 42, 260, 'foot along x = 0 … 8'], doorway: [doorway, 64, 112, 'foot y = h'], doorAjar: [doorAjar, 75, 280, 'foot y = h'], doorSwing: [o => doorSwing(o).svg, 138, 193, 'the hinge at (ox, oy)'], coffeeTable: [coffeeTable, 150, 138, 'foot y = h'], endTable: [endTable, 76, 170, 'foot y = h'], tvSet: [tvSet, 140, 240, 'foot y = h'], bookshelf: [bookshelf, 190, 140, 'foot y = h'], picture: [picture, 46, 38, 'on a wall'], wallClock: [wallClock, 48, 48, 'on a wall'], coatRack: [coatRack, 50, 170, 'foot y = h'], boots: [boots, 54, 44, 'foot y = h'], doorMat: [doorMat, 130, 64, 'flat'], pottedPlant: [pottedPlant, 60, 100, 'foot y = h'],
  rockingChair: [rockingChair, 70, 100, 'foot y = h − 4'], smallTable: [smallTable, 60, 130, 'foot y = h'],
  pool: [pool, 1800, 800, 'pair: water flat, near coping at y = h'], laneRope: [laneRope, 22, 740, 'flat, under every duck'], rubberDuck: [rubberDuck, 28, 26, 'foot y = h − 5'], beachBall: [beachBall, 48, 52, 'foot y = h − 3'],
  campfire: [campfire, 150, 260, 'foot y = h'], logSeat: [logSeat, 180, 79, 'foot y = h'], trampoline: [trampoline, 300, 344, 'pair: mat at y = 44, legs at y = h'],
  soccerField: [soccerField, 1300, 1400, 'flat'], soccerNet: [soccerNet, 120, 610, 'pair: north side at y = 110, south side at y = h'], soccerBall: [soccerBall, 30, 34, 'foot y = h − 3'],
  jeep: [jeep, 292, 214, 'pair: shadow flat, jeep at y = h'],
};
