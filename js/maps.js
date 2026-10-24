/* ---------- maps: the world behind the board ----------
   A map fills the whole page during a game, behind the see-through columns; the page's own background rests while it is
   covered. Night Show: the carnival at night (bunting, glowing string lights, Twister dots breathing across the floor).
   Sky: clouds everywhere; the sun sinks for a minute, then the moon comes down from the top and sinks for a minute, and
   the columns glow at night; one cloud carries a random player's duck. Pixel: columns built of wool blocks over a blocky
   world: floating islands (stone, two layers of dirt, grass, sometimes a tree) at different distances, a forest seen
   from above toward the bottom, and a pixel sunset on the horizon that breathes. Ether's Crossroads: the jester's
   dungeon from the game of that name; the torch and the candles flicker and glow, with that game's static and scan
   lines over the picture, and the interface takes on its Ether & Kenoma look (Cascadia Code) while the map is played.
   The host picks the map in the lobby. */
import { duckSVG } from './duck.js';
import { esc } from './ui.js';
import { backdropSVG, backdropHTML } from './art.js';

export const MAPS = [
  ['board', 'Night Show', 'The carnival at night: string lights, bunting and breathing Twister dots.'],
  ['sky', 'Sky', 'Clouds, a sun and a moon that take turns (a minute each), and columns that glow at night.'],
  ['pixel', 'Pixel', 'Wool-block columns over floating block islands, a forest below and a pixel sunset.'],
  ['ec', 'Ether\'s Crossroads', 'The jester\'s dungeon: a flickering torch and candles, static and scan lines, and the Ether & Kenoma look while it\'s played.'],
];
export const mapName = id => (MAPS.find(m => m[0] === id) || MAPS[0])[1];

/* a small picture of each map for the Map window (the world only, no columns) */
export function mapMini(id) {
  if (id === 'sky') return `<div class="mini-map mm-sky"><i class="mm-sun"></i><i class="mm-cloud" style="left:8%;top:18%"></i><i class="mm-cloud" style="left:58%;top:52%"></i></div>`;
  if (id === 'ec') return `<div class="mini-map mm-ec">${EC_FLAMES.map(([x, y, k]) => `<i class="mm-glow" style="left:${(x / 3.2).toFixed(1)}%;top:${(y / 1.8).toFixed(1)}%;--k:${k}"></i>`).join('')}</div>`;
  if (id === 'pixel') return `<div class="mini-map mm-pixel"><i class="mm-psun"></i><i class="mm-isle" style="left:14%;top:22%"></i><i class="mm-isle" style="left:62%;top:38%;transform:scale(.7)"></i><i class="mm-ground"></i></div>`;
  return `<div class="mini-map mm-night">${backdropSVG(192, 106, true)}</div>`;
}

/* ---------- Sky ---------- */
const CLOUD = '<svg viewBox="0 0 200 90" aria-hidden="true"><g fill="#fff"><circle cx="52" cy="56" r="28"/><circle cx="92" cy="42" r="34"/><circle cx="140" cy="50" r="30"/><circle cx="170" cy="64" r="20"/><circle cx="28" cy="66" r="18"/><rect x="28" y="56" width="146" height="28" rx="14"/></g></svg>';
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function skyScene(layer, s, cur) {
  const sc = document.createElement('div'); sc.className = 'scene sky';
  const rnd = (k => () => (k = (k * 9301 + 49297) % 233280) / 233280)(s.round * 31 + s.qi * 7 + 3);
  const n = 7, ids = s.seat.filter(id => s.players[id]), rider = ids.length ? ids[(s.round * 7 + s.qi * 3) % ids.length] : null;
  const clouds = Array.from({ length: n }, (_, i) => {
    const w = 9 + rnd() * 10, top = 6 + rnd() * 74, dur = 70 + rnd() * 60, dl = -rnd() * dur, op = .55 + rnd() * .35;
    const duck = i === 2 && rider ? `<div class="sky-rider">${duckSVG(s.players[rider].duck, { size: 60, shadow: false, title: s.players[rider].name })}</div>` : '';
    return `<div class="sky-cloud${duck ? ' ridden' : ''}" style="width:${w.toFixed(1)}%;top:${top.toFixed(1)}%;opacity:${op.toFixed(2)};animation-duration:${dur.toFixed(0)}s;animation-delay:${dl.toFixed(1)}s">${duck}${CLOUD}</div>`;
  }).join('');
  sc.innerHTML = `<div class="sky-stars"></div><div class="sky-sun"></div><div class="sky-moon"></div>${clouds}`;
  const stars = sc.querySelector('.sky-stars');
  stars.innerHTML = Array.from({ length: 40 }, () => `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 70).toFixed(1)}%;animation-delay:-${(rnd() * 3).toFixed(1)}s"></i>`).join('');
  layer.append(sc);
  const sun = sc.querySelector('.sky-sun'), moon = sc.querySelector('.sky-moon');
  let last = '';
  return {
    update(now) {
      const t = (now % 120000) / 120000, day = t < .5, p = day ? t / .5 : (t - .5) / .5;   // a minute of sun, a minute of moon
      const y = -12 + p * 118, x = 18 + p * 60;   // down from the top and set below the bottom
      const key = Math.round(now / 200); if (key === last) return; last = key;
      (day ? sun : moon).style.transform = `translate(${x.toFixed(1)}cqw, ${y.toFixed(1)}cqh)`;
      (day ? moon : sun).style.transform = 'translate(0, -40cqh)';
      // the sky: blue by day, warm as the sun sets, deep blue at night (and lighter again as the moon sets)
      const top = day ? (p < .6 ? '#5ab8f5' : mixHex('#5ab8f5', '#f2885a', (p - .6) / .4)) : (p < .85 ? '#0e1433' : mixHex('#0e1433', '#3a5aa8', (p - .85) / .15));
      const bot = day ? (p < .6 ? '#d6f0ff' : mixHex('#d6f0ff', '#ffd08a', (p - .6) / .4)) : (p < .85 ? '#26305e' : mixHex('#26305e', '#8cc6f0', (p - .85) / .15));
      sc.style.background = `linear-gradient(${top}, ${bot})`;
      const night = !day || p > .9;
      if (cur.cols) cur.cols.classList.toggle('night', night);
      stars.style.opacity = day ? 0 : (p < .85 ? 1 : 1 - (p - .85) / .15);
    },
    destroy() { sc.remove(); if (cur.cols) cur.cols.classList.remove('night'); },
  };
}

/* ---------- Pixel ---------- */
function pixelScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene pixel';
  sc.innerHTML = '<canvas class="pix-sky"></canvas><div class="pix-sun"></div><canvas class="pix-world"></canvas>';
  layer.append(sc);
  const skyC = sc.querySelector('.pix-sky'), worldC = sc.querySelector('.pix-world'), sun = sc.querySelector('.pix-sun');
  let drawn = '';
  const draw = () => {
    const W = layer.clientWidth, H = layer.clientHeight; if (!W || !H) return;
    const key = W + 'x' + H; if (key === drawn) return; drawn = key;
    const u = Math.max(3, Math.round(H / 110)), cw = Math.ceil(W / u), ch = Math.ceil(H / u), hy = Math.round(ch * .5);
    let seed = 12345; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const c of [skyC, worldC]) { c.width = cw; c.height = ch; }
    /* the sky: bands of a sunset with a dithered edge between each */
    const g = skyC.getContext('2d'), bands = ['#171a45', '#24245f', '#3a2f7a', '#5b3586', '#8a3f86', '#bb4f78', '#e2685e', '#f58e48', '#ffb44d', '#ffd166'];
    const bh = hy / bands.length;
    for (let y = 0; y < hy + 2; y++) for (let x = 0; x < cw; x++) {
      const f = y / bh, i = Math.min(bands.length - 1, Math.floor(f)), frac = f - i;
      g.fillStyle = bands[frac > .75 && (x + y) % 2 && i < bands.length - 1 ? i + 1 : i]; g.fillRect(x, y, 1, 1);
    }
    /* the world: islands in the sky, the forest below the horizon */
    const w = worldC.getContext('2d'); w.clearRect(0, 0, cw, ch);
    const block = (x, y, b, col, edge) => { w.fillStyle = col; w.fillRect(x, y, b, b); if (edge && b > 2) { w.fillStyle = edge; w.fillRect(x, y, b, 1); } };
    const island = (cx, cy, b, wid, haze) => {
      w.globalAlpha = haze;
      const half = Math.floor(wid / 2), x0 = cx - half * b;
      if (r() < .6) {   // a tree
        const tx = x0 + (1 + Math.floor(r() * (wid - 2))) * b;
        for (let k = 1; k <= 3; k++) block(tx, cy - k * b, b, '#6b4a2a');
        for (let lx = -1; lx <= 1; lx++) for (let ly = 4; ly <= 6; ly++) block(tx + lx * b, cy - ly * b, b, (lx + ly) % 2 ? '#3f8f2f' : '#4aa338', '#5fbf45');
        block(tx, cy - 7 * b, b, '#4aa338', '#5fbf45');
      }
      for (let i = 0; i < wid; i++) block(x0 + i * b, cy, b, '#5fa83a', '#7fd14f');
      for (let row = 1; row <= 2; row++) for (let i = 0; i < wid; i++) block(x0 + i * b, cy + row * b, b, r() < .2 ? '#7a4d2b' : '#8a5a33');
      let lo = 0, hi = wid;
      for (let row = 3; hi - lo > 0; row++) {
        lo += r() < .7 ? 1 : 2; hi -= r() < .7 ? 1 : 2;
        for (let i = lo; i < hi; i++) block(x0 + i * b, cy + row * b, b, r() < .25 ? '#6a6a6a' : '#808080');
      }
      w.globalAlpha = 1;
    };
    const isles = [[.14, .14, 1, 7, .6], [.76, .1, 1, 6, .6], [.44, .2, 2, 8, .8], [.86, .3, 2, 7, .85], [.24, .33, 3, 9, 1], [.6, .36, 3, 8, 1]];
    for (const [fx, fy, sz, wid, hz] of isles) island(Math.round(cw * fx), Math.round(ch * fy), Math.max(1, Math.round(sz * ch / 110)), wid, hz);
    /* the forest from above: tree tops getting bigger toward the bottom, hazy at the horizon */
    for (let y = hy; y < ch;) {
      const depth = (y - hy) / (ch - hy), b = Math.max(1, Math.round(1 + depth * 5));
      for (let x = 0; x < cw; x += b) {
        const c = ['#2a5e22', '#2f6b26', '#3b7f2c', '#4a9433', '#356f29'][Math.floor(r() * 5)];
        w.fillStyle = c; w.fillRect(x, y, b, b);
        if (b > 2 && r() < .3) { w.fillStyle = '#5aa83e'; w.fillRect(x, y, b - 1, 1); }
      }
      if (depth < .25) { w.fillStyle = `rgba(122, 70, 140, ${(.45 * (1 - depth / .25)).toFixed(2)})`; w.fillRect(0, y, cw, b); }
      y += b;
    }
    sun.style.cssText = `left:${(cw * .68 * u).toFixed(0)}px;top:${(hy * u).toFixed(0)}px;width:${(u * 16).toFixed(0)}px;height:${(u * 16).toFixed(0)}px`;
  };
  const ro = new ResizeObserver(draw); ro.observe(layer); draw();
  return { update() {}, destroy() { ro.disconnect(); sc.remove(); } };
}

/* ---------- Ether's Crossroads ----------
   The picture is pixel art at 320 × 180 (shown four times bigger), kept at 16:9 and covering the page. Each flame gets
   a pixel flame of its own over it that shifts between three shapes, and a warm glow that flickers; the static is
   NWK's: random grey specks redrawn every 80 ms on a small canvas, faint, with scan lines and now and then a flash. */
const EC_FLAMES = [[179, 46.5, 1], [205.5, 95.5, .45], [210.5, 100, .45], [261.5, 97.5, .45]];   // x, y in the art's pixels; size
const TORCH = [   // three shapes, each a list of rows: [y, x from, x to, color]
  [[0, 3, 3, 'o'], [1, 3, 4, 'o'], [2, 2, 4, 'o'], [3, 2, 5, 'm'], [4, 1, 5, 'm'], [5, 1, 6, 'm'], [6, 1, 6, 'c'], [7, 1, 6, 'c'], [8, 1, 6, 'm'], [9, 2, 5, 'm'], [10, 2, 5, 'o']],
  [[1, 2, 2, 'o'], [2, 2, 3, 'o'], [3, 2, 4, 'm'], [4, 1, 5, 'm'], [5, 1, 5, 'm'], [6, 1, 6, 'c'], [7, 1, 6, 'c'], [8, 1, 6, 'm'], [9, 2, 5, 'm'], [10, 2, 5, 'o']],
  [[0, 4, 4, 'o'], [1, 4, 5, 'o'], [2, 3, 5, 'm'], [3, 2, 5, 'm'], [4, 2, 6, 'm'], [5, 1, 6, 'c'], [6, 1, 6, 'c'], [7, 1, 6, 'c'], [8, 1, 6, 'm'], [9, 2, 5, 'm'], [10, 2, 5, 'o']],
];
const CANDLE = [
  [[0, 1, 1, 'o'], [1, 0, 2, 'm'], [2, 1, 1, 'c']],
  [[0, 0, 0, 'o'], [1, 0, 2, 'm'], [2, 1, 1, 'c']],
  [[1, 0, 2, 'm'], [2, 1, 1, 'c']],
];
const FLAME_INK = { o: '#e39a3b', m: '#f2c464', c: '#fff1b8' };
const flameSVG = (frames, w, h) => `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${frames.map((rows, i) => `<g class="ecf ecf${i}">${rows.map(([y, a, b, k]) => `<rect x="${a}" y="${y}" width="${b - a + 1}" height="1" fill="${FLAME_INK[k]}"/>`).join('')}</g>`).join('')}</svg>`;
function ecScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene ec';
  const flame = ([x, y, k], i) => {
    const torch = k === 1, w = torch ? 8 : 3, h = torch ? 11 : 3, left = torch ? x - 4 : x - 1.5, top = torch ? y - 6.5 : y - 1.5;
    return `<i class="ec-glow${torch ? ' big' : ''}" style="left:${(x / 3.2).toFixed(2)}%;top:${(y / 1.8).toFixed(2)}%;animation-delay:-${(i * .37).toFixed(2)}s"></i>
      <span class="ec-flame" style="left:${(left / 3.2).toFixed(2)}%;top:${(top / 1.8).toFixed(2)}%;width:${(w / 3.2).toFixed(2)}%;height:${(h / 1.8).toFixed(2)}%;--d:${(.7 + i * .13).toFixed(2)}s">${flameSVG(torch ? TORCH : CANDLE, w, h)}</span>`;
  };
  sc.innerHTML = `<div class="ec-stage"><img src="assets/maps/ethers-crossroads.png" alt="" draggable="false">${EC_FLAMES.map(flame).join('')}</div>
    <canvas class="ec-static" aria-hidden="true"></canvas><div class="ec-scan"></div><div class="ec-flash"></div>`;
  layer.append(sc);
  const cv = sc.querySelector('.ec-static'), flash = sc.querySelector('.ec-flash'), html = document.documentElement;
  cv.width = 300; cv.height = 170;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(cv.width, cv.height), d32 = new Uint32Array(img.data.buffer);
  let seed = (Math.random() * 4294967295) >>> 0 || 1, last = 0, nextFlick = 0;
  const noise = () => {   // grey specks, about half of them showing faintly
    let s = seed; const A = .065 * 255;
    for (let i = 0; i < d32.length; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; const v = s & 255; d32[i] = ((s >>> 8) & 255) < 140 ? (v | v << 8 | v << 16 | ((((s >>> 16) & 255) / 255 * A) & 255) << 24) >>> 0 : 0; }
    seed = s >>> 0 || 1; ctx.putImageData(img, 0, 0);
  };
  noise();
  return {
    update(now) {
      if (html.classList.contains('lite') || now - last < 80) return;
      last = now; noise();
      if (now > nextFlick) {   // now and then the picture flickers dark or bright for a blink
        if (nextFlick) { const dark = Math.random() < .5; flash.classList.toggle('dark', dark); flash.style.opacity = (dark ? .07 : .04).toFixed(2); setTimeout(() => { flash.style.opacity = 0; }, 60 + Math.random() * 90); }
        nextFlick = now + 5000 + Math.random() * 4000;
      }
    },
    destroy() { sc.remove(); },
  };
}

/* ---------- Night Show: the carnival at night, drawn to the page ---------- */
function nightScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene night';
  layer.append(sc);
  let drawn = '';
  const draw = () => { const k = layer.clientWidth + 'x' + layer.clientHeight; if (k === drawn || !layer.clientWidth) return; drawn = k; sc.innerHTML = backdropHTML(layer.clientWidth, layer.clientHeight, true); };
  const ro = new ResizeObserver(draw); ro.observe(layer); draw();
  return { update() {}, destroy() { ro.disconnect(); sc.remove(); } };
}

/* puts a map's world over the whole page (the page's own background rests meanwhile); returns { update(now), board(el),
   destroy() }: board() hands it the board, whose columns turn see-through for the map */
export function mountMap(layer, s) {
  const map = s.options.map || 'board', cur = { cols: null };
  layer.className = 'map-layer map-' + map;
  document.documentElement.classList.add('map-on', 'map-is-' + map);   // (map-is-ec: the Ether & Kenoma look)
  const scene = map === 'sky' ? skyScene(layer, s, cur) : map === 'pixel' ? pixelScene(layer) : map === 'ec' ? ecScene(layer) : nightScene(layer);
  return {
    update: now => scene.update(now),
    board(board) { if (!board) { cur.cols = null; return; } board.classList.add('map-' + map); cur.cols = board.querySelector('.cols'); },
    destroy() { scene.destroy(); layer.className = 'map-layer'; document.documentElement.classList.remove('map-on', 'map-is-' + map); },
  };
}
export const mapLabel = id => esc(mapName(id));
