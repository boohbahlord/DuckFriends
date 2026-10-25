/* ---------- maps: the world behind the board ----------
   A map fills the whole page during a game, behind the see-through columns; the page's own background rests while it is
   covered. Night Show: the carnival at night (bunting, glowing string lights, Twister dots breathing across the floor).
   Sky: clouds everywhere; the sun sinks for a minute, then the moon comes down from the top and sinks for a minute, and
   the columns glow at night; one cloud carries a random player's duck. Pixel: columns built of wool blocks over a blocky
   world: floating islands (stone, two layers of dirt, grass, sometimes a tree) at different distances, a forest seen
   from above toward the bottom, and a pixel sunset on the horizon that breathes. Ether's Crossroads: the jester's
   dungeon from the game of that name; the torch and the candles flicker and glow, with that game's static and scan
   lines over the picture, and the interface takes on its Ether & Kenoma look (Cascadia Code) while the map is played.
   Carnival Night: a Ferris wheel turning on the left, a striped big top on the right, string lights twinkling over
   them; the tiles wear marquee bulbs that chase around their edges, and fireworks go off when the votes are in.
   Rabbit Hole of Ducklings: a psychedelic fractal that keeps falling deeper into itself, morphing and shifting colors.
   Starry Night: the Milky Way and a sky full of stars rolling slowly overhead, twinkling, with shooting stars.
   The host picks the map in the lobby. Duck Cabin is Hangout's own world (hangout/world.js draws it); behind it, only a
   starry night sky, and it is not in the Map window. */
import { duckSVG } from './duck.js';
import { esc } from './ui.js';
import { backdropSVG, backdropHTML, carnivalSVG } from './art.js';

export const MAPS = [
  ['board', 'Night Show', 'The carnival at night: string lights, bunting and breathing Twister dots.'],
  ['sky', 'Sky', 'Clouds, a sun and a moon that take turns (a minute each), and columns that glow at night.'],
  ['pixel', 'Pixel', 'Wool-block columns over floating block islands, a forest below and a pixel sunset.'],
  ['carnival', 'Carnival Night', 'A Ferris wheel and a big top under string lights, marquee bulbs around the tiles, and fireworks when the votes are in.'],
  ['stars', 'Starry Night', 'A sky full of stars and the Milky Way, slowly rolling overhead, with shooting stars now and then.'],
  ['rabbit', 'Rabbit Hole of Ducklings', 'A colorful fractal you keep falling into: it morphs as you go, and its colors never sit still.'],
  ['ec', 'Ether\'s Crossroads', 'The jester\'s dungeon: a flickering torch and candles, static and scan lines, and the Ether & Kenoma look while it\'s played.'],
];
export const mapName = id => id === 'cabin' ? 'Duck Cabin' : (MAPS.find(m => m[0] === id) || MAPS[0])[1];

/* a small picture of each map for the Map window (the world only, no columns) */
export function mapMini(id) {
  if (id === 'sky') return `<div class="mini-map mm-sky"><i class="mm-sun"></i><i class="mm-cloud" style="left:8%;top:18%"></i><i class="mm-cloud" style="left:58%;top:52%"></i></div>`;
  if (id === 'ec') return `<div class="mini-map mm-ec">${EC_FLAMES.map(([x, y, k]) => `<i class="mm-glow" style="left:${(x / 3.2).toFixed(1)}%;top:${(y / 1.8).toFixed(1)}%;--k:${k}"></i>`).join('')}</div>`;
  if (id === 'carnival') return `<div class="mini-map mm-carnival">${carnivalSVG()}</div>`;
  if (id === 'rabbit') return '<div class="mini-map mm-rabbit"></div>';
  if (id === 'stars') return '<div class="mini-map mm-stars"></div>';
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

/* ---------- Duck Cabin: the night sky around Hangout's world (the world itself fills the board) ---------- */
function cabinScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene cabin';
  layer.append(sc);
  return { update() {}, destroy() { sc.remove(); } };
}

/* ---------- Rabbit Hole of Ducklings ----------
   A Julia set drawn by the graphics card (WebGL) at a reduced size and stretched. The view sits on the spot the whole
   set spirals around (the fixed point a = a² + c, whose spin λ = 2a is 1.15 long), and keeps zooming into it: every 8
   steps of z → z² + c grow the picture there by λ⁸, so after one zoom of λ⁸ the picture is itself again and the fall
   never ends, with no seam. Meanwhile c slides along the edge of the Mandelbrot set, so the spirals keep changing how
   many arms they have, and the fall never repeats. Colors: escape bands that turn around the wheel, feathered by the
   angle of each step (stripe average); points that never escape are dark, with drifting glowing threads (orbit trap).
   Still backgrounds hold one frame; Data saving and slow devices draw fewer pixels. No WebGL: a turning color wheel. */
const RH_FRAG = `precision highp float;
uniform vec2 uRes; uniform float uT;
vec2 cm(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec3 pal(float t) { return clamp(abs(fract(t + vec3(0., .667, .333)) * 6. - 3.) - 1., 0., 1.); }   // a pure color, any hue
float TH(float t) { return 2.2 + 1.1 * sin(t * .011) + .4 * sin(t * .027 + 1.); }                     // where c sits on the edge
void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / min(uRes.x, uRes.y);
  float t = uT, th = TH(t);
  const float N = 8., SP = .14, D = 1.15;          // 8 steps a zoom, a zoom every 7 s
  vec2 L = D * vec2(cos(th), sin(th)), al = .5 * L, c = al - cm(al, al);
  // how far into this zoom (f), turned back by whole turns so the view spins at most half a turn each zoom
  float f = fract(t * SP), k = floor(N * TH(floor(t * SP) / SP) / 6.2832 + .5);
  float lr = -N * f * log(D), la = (6.2832 * k - N * th) * f;
  // near the fixed point, follow the offset e from it (e → λe + e²): plain floats would run out of digits
  vec2 e = cm(1e-3 * exp(lr) * vec2(cos(la), sin(la)), uv);
  float n = 0.;
  for (int i = 0; i < 120; i++) { if (dot(e, e) > .0025) break; e = cm(L, e) + cm(e, e); n++; }
  vec2 z = al + e, tp = .35 * vec2(sin(t * .07), cos(t * .053));
  float sum = 0., prev = 0., wsum = 0., pw = 0., trap = 1e3; bool esc = false;
  for (int i = 0; i < 160; i++) {
    z = cm(z, z) + c; n++;
    if (dot(z, z) > 1e4) { esc = true; break; }
    float w = smoothstep(.08, .3, length(z - al));   // steps still close to the fixed point don't count
    vec2 u = normalize(z), u2 = cm(u, u), u5 = cm(cm(u2, u2), u);   // u5.y = sin(5 × angle of z)
    prev = sum; pw = wsum;
    sum += w * (.5 + .5 * u5.y); wsum += w;
    trap = min(trap, min(abs(z.x - tp.x), abs(z.y - tp.y)) + (1. - w));
  }
  vec3 col;
  if (esc) {
    float sm = clamp(log2(log(length(z)) / log(100.)), 0., 1.);
    float mu = n + 1. - sm - N * f;                  // the zoom's steps taken off, so the bands match across zooms
    float st = mix(sum / max(wsum, 1e-3), prev / max(pw, 1e-3), sm);
    col = mix(vec3(1.), pal(mu * .045 + t * .03 + st * .3), .85) * (.1 + st);
  } else {
    float st = sum / max(wsum, 1e-3);
    col = pal(t * .03 + .55 + st * .6) * (.08 + .55 * st * st) + pal(t * .03 + trap * 3.) * .45 * exp(-40. * trap);
  }
  gl_FragColor = vec4(col, 1.);
}`;
function rabbitScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene rabbit';
  const cv = document.createElement('canvas'); sc.append(cv); layer.append(sc);
  const html = document.documentElement, gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  const prog = gl && (() => {
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
    const v = sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }'), f = sh(gl.FRAGMENT_SHADER, RH_FRAG);
    if (!v || !f) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
  })();
  if (!prog) { sc.classList.add('rh-plain'); return { update() {}, destroy() { sc.remove(); } }; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes'), uT = gl.getUniformLocation(prog, 'uT');
  let last = -1, drawnStill = false, scale = 1, slow = 0;
  const t0 = performance.now() - Math.random() * 600000;   // everyone starts somewhere else in the fall
  return {
    update() {
      const still = html.classList.contains('still'), lite = html.classList.contains('lite'), now = performance.now();
      if (still && drawnStill) return;
      if (now - last < (lite ? 66 : 33)) return;   // 30 frames a second (15 with Data saving)
      // a device that can't keep up (frames 80 ms apart) gets fewer pixels, down to a quarter
      if (last > 0 && !still) { slow = now - last > 80 ? slow + 1 : 0; if (slow > 10 && scale > .5) { scale *= .8; slow = 0; } }
      last = now;
      const k = (lite ? .3 : .5) * scale * Math.min(1.5, devicePixelRatio || 1), w = Math.max(1, Math.round(layer.clientWidth * k)), h = Math.max(1, Math.round(layer.clientHeight * k));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uRes, w, h); gl.uniform1f(uT, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawnStill = still;
    },
    destroy() { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); sc.remove(); },
  };
}

/* ---------- Starry Night ----------
   A deep night sky that turns slowly around a pole above the page, so the stars roll across it in long arcs (a turn
   every five minutes, left to right). The sky is drawn once onto a canvas as big as the circle that ever crosses the
   page: the Milky Way (value noise in a gently bowed band, a warm core split by dark dust lanes, a few pink glows) and
   tens of thousands of stars in the colors of real stars, crowding into the band's bright clouds. The brightest stars
   sit over it as their own elements, crisp and twinkling, and now and then a shooting star crosses (a shower of them
   when the votes are in). Still backgrounds hold the sky in place; Data saving draws a smaller sky with fewer stars. */
const ST_INK = ['#a9bcff', '#c8d6ff', '#f4f6ff', '#fff4e6', '#ffe2bd', '#ffc98a', '#ffa978'], ST_W = [.12, .18, .3, .18, .1, .08, .04];
const stInk = r => { let i = 0; for (let a = ST_W[0]; r > a && i < ST_W.length - 1;) a += ST_W[++i]; return i; };
const stHash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const stNoise = (x, y) => {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = stHash(i, j), b = stHash(i + 1, j), c = stHash(i, j + 1), d = stHash(i + 1, j + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
const stFbm = (x, y, o = 5) => { let s = 0, a = .5, n = 0; for (let k = 0; k < o; k++) { s += a * stNoise(x, y); n += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= .5; } return s / n; };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ST_BA = .5, ST_BD = .48, ST_BOW = .12, ST_UC = .2;   // the band: its angle, its distance from the pole, its bow, where its core is
const stCore = u => Math.exp(-(((u - ST_UC) / .28) ** 2)), stWidth = u => .085 * (1 + 1.1 * stCore(u));
function starsScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene stars';
  sc.innerHTML = '<div class="st-dome"><div class="st-spin"><div class="st-bright"></div></div></div><div class="st-haze"></div>';
  layer.append(sc);
  const dome = sc.querySelector('.st-dome'), spin = sc.querySelector('.st-spin'), bright = sc.querySelector('.st-bright'), html = document.documentElement;
  const ca = Math.cos(ST_BA), sa = Math.sin(ST_BA), cvv = ST_BD + ST_BOW * ST_UC * ST_UC, coreX = ST_UC * ca - cvv * sa, coreY = ST_UC * sa + cvv * ca;
  let drawn = '', timer = 0, rtimer = 0, nextMet = 0, job = null;
  /* the sky is drawn a slice at a time (a few milliseconds each), so the game never stutters; it fades in when done */
  function* build(W, H) {
    const lite = html.classList.contains('lite'), px = W * .5, py = -.35 * H, R = Math.ceil(Math.hypot(px, H - py)) + 4, S = 2 * R, r0 = -py / R;
    const k = Math.min(devicePixelRatio || 1, (lite ? 1536 : Math.min(W, H) < 600 ? 2304 : 3072) / S), C = Math.round(S * k);
    const base = Math.atan2(.45 * H - py, (W < H ? .62 : .38) * W - px) - Math.atan2(coreY, coreX);   // the core starts left of the middle and rolls right
    /* the Milky Way, small, then stretched over the sky (it is soft anyway) */
    const N = lite ? 256 : Math.min(640, Math.round(C / 4.5)), dens = new Float32Array(N * N), neb = document.createElement('canvas'); neb.width = neb.height = N;
    const ng = neb.getContext('2d'), img = ng.createImageData(N, N), d = img.data;
    for (let j = 0; j < N; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 0; i < N; i++) {
        const x = (i + .5) / N * 2 - 1, y = (j + .5) / N * 2 - 1, rr = x * x + y * y;
        if (rr > 1.02 || rr < r0 * r0 * .6) continue;
        const u = x * ca + y * sa, v = -x * sa + y * ca - ST_BD - ST_BOW * u * u, core = stCore(u), w = stWidth(u);
        const band = Math.exp(-((v / w) ** 2)), halo = Math.exp(-((v / (w * 3)) ** 2));
        if (halo < .02) continue;
        const n = stFbm(x * 4 + 3, y * 4 + 1), n2 = stFbm(x * 12 + 5, y * 12 + 3, 4), cl = sstep(.35, .8, n) * (.45 + .9 * n2);   // clouds, clumpy
        const patch = sstep(.42, .8, stFbm(x * 5 + 11, y * 5 + 7, 4)), blot = sstep(.56, .8, stFbm(x * 9 + 4, y * 9 + 6, 4));   // the dust: a rift down the middle, and blots
        const lane = Math.exp(-(((v + .025 * Math.sin(u * 8) + .03 * (n - .5)) / (w * .32)) ** 2)) * (.4 + .6 * core);
        const dark = Math.min(.82, lane * (.35 + .6 * patch) + band * .4 * blot * (.3 + core));
        const pink = sstep(.68, .86, stFbm(x * 15 + 2, y * 15 + 9, 3)) * band * cl * .5, lav = sstep(.5, .72, stFbm(x * 2 + 8, y * 2 + 4, 3)) * .35;
        const a = 1 - Math.exp(-1.4 * ((band * (.18 + 1.35 * cl) + halo * .1 * n) * (1 - dark) * (.6 + .8 * core) + pink * .2));   // bright, never flat
        const t = Math.min(1, Math.max(0, core * band * 1.3 + .2 * (n2 - .5))), o = (j * N + i) * 4;
        let R1 = 170 + 85 * t, G1 = 186 + 40 * t, B1 = 240 - 55 * t;
        R1 += (190 - R1) * lav * (1 - t); G1 += (165 - G1) * lav * (1 - t); B1 += (245 - B1) * lav * (1 - t);
        d[o] = R1 + (255 - R1) * pink; d[o + 1] = G1 + (90 - G1) * pink; d[o + 2] = B1 + (140 - B1) * pink;
        d[o + 3] = a * 225;
        dens[j * N + i] = band * (cl + .15) * (1 - dark);   // where the band's crowds of stars are
      }
    }
    ng.putImageData(img, 0, 0);
    const cv = document.createElement('canvas'); cv.width = cv.height = C;
    const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(neb, 0, 0, C, C);
    yield;
    /* the stars: a few everywhere, many more in the band's clouds (and none in its dust) */
    let seed = 20261025; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2832 * rnd());
    const stars = [], tries = S * S / (lite ? 900 : 330);
    const inSky = (x, y) => { const rr = x * x + y * y; return rr < 1 && rr > r0 * r0 * .8; };
    const inBand = () => {
      const u = rnd() * 2.4 - 1.2, v = ST_BD + ST_BOW * u * u + gauss() * stWidth(u) * .8, x = u * ca - v * sa, y = u * sa + v * ca;
      const ix = Math.floor((x + 1) / 2 * N), iy = Math.floor((y + 1) / 2 * N);
      return ix >= 0 && iy >= 0 && ix < N && iy < N && rnd() < dens[iy * N + ix] * 1.2 ? [x, y] : null;
    };
    for (let i = 0; i < tries; i++) { const x = rnd() * 2 - 1, y = rnd() * 2 - 1; if (inSky(x, y)) stars.push([x, y, rnd() ** 4.5, stInk(rnd())]); }
    for (let i = 0; i < tries * 4; i++) { const p = inBand(); if (p && inSky(...p)) stars.push([...p, rnd() ** 6, stInk(rnd())]); }
    stars.sort((a, b) => a[3] - b[3]);
    const sprites = ST_INK.map(c => {
      const s = document.createElement('canvas'); s.width = s.height = 32; const x = s.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, '#fff'); gr.addColorStop(.12, c); gr.addColorStop(.3, c + '73'); gr.addColorStop(.6, c + '1a'); gr.addColorStop(1, c + '00');
      x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return s;
    });
    for (let i = 0; i < stars.length; i++) {
      if ((i & 4095) === 4095) yield;
      const [x, y, m, ci] = stars[i], X = (x + 1) / 2 * C, Y = (y + 1) / 2 * C;
      if (m < .6) { const s = (.8 + 1.6 * m) * k; g.globalAlpha = .35 + 1.1 * m; g.fillStyle = ST_INK[ci]; g.fillRect(X - s / 2, Y - s / 2, s, s); }
      else { const s = (3 + 8 * m) * k; g.globalAlpha = .55 + .45 * m; g.drawImage(sprites[ci], X - s / 2, Y - s / 2, s, s); }
    }
    g.globalAlpha = 1;
    /* the brightest stars, crisp and twinkling; the biggest with spikes */
    const list = [];
    for (let i = 0, n = lite ? 40 : 130; list.length < n && i < n * 20; i++) {
      const p = rnd() < .35 ? inBand() : [rnd() * 2 - 1, rnd() * 2 - 1];
      if (!p || !inSky(...p)) continue;
      const sz = 5 + 10 * rnd() ** 2.2;
      list.push(`<i class="st-b${sz > 11 ? ' sp' : ''}" style="left:${((p[0] + 1) * R).toFixed(0)}px;top:${((p[1] + 1) * R).toFixed(0)}px;--s:${sz.toFixed(1)}px;--c:${ST_INK[stInk(rnd())]};--d:${(1.8 + rnd() * 2.7).toFixed(2)}s;--dl:-${(rnd() * 4).toFixed(2)}s"></i>`);
    }
    /* swap in the new sky over the old one */
    dome.style.cssText = `left:${px}px;top:${py.toFixed(0)}px;width:${S}px;height:${S}px;margin:${-R}px 0 0 ${-R}px;transform:rotate(${(base * 180 / Math.PI).toFixed(1)}deg)`;
    bright.innerHTML = list.join('');
    const old = spin.querySelector('canvas');
    spin.prepend(cv);
    if (old) old.remove();
    sc.classList.add('ready');
  }
  const pump = () => {
    if (!job) return;
    const t = performance.now();
    while (performance.now() - t < 8) if (job.next().done) { job = null; return; }
    timer = setTimeout(pump, 0);
  };
  const draw = () => {
    const W = layer.clientWidth, H = layer.clientHeight; if (!W || !H) return;
    const key = W + 'x' + H; if (key === drawn) return; drawn = key;
    clearTimeout(timer); job = build(W, H); pump();
  };
  const ro = new ResizeObserver(() => { clearTimeout(rtimer); rtimer = setTimeout(draw, drawn ? 200 : 0); }); ro.observe(layer); draw();
  /* a shooting star, somewhere in the upper sky, heading down to one side */
  const meteor = (delay = 0) => {
    const W = layer.clientWidth, H = layer.clientHeight, right = Math.random() < .5, a = 14 + Math.random() * 26, t = .7 + Math.random() * .6;
    const m = document.createElement('div'); m.className = 'st-met'; m.innerHTML = '<i></i>';
    m.style.cssText = `left:${((right ? .05 : .45) + Math.random() * .5) * W}px;top:${(.04 + Math.random() * .45) * H}px;--a:${(right ? a : 180 - a).toFixed(0)}deg;--go:${(260 + Math.random() * 380).toFixed(0)}px;--len:${(120 + Math.random() * 140).toFixed(0)}px;--t:${t.toFixed(2)}s;--dl:${delay.toFixed(2)}s`;
    sc.append(m); setTimeout(() => m.remove(), (t + delay) * 1000 + 200);
  };
  return {
    update(now) {
      if (!html.classList.contains('moving')) return;
      if (now > nextMet) { if (nextMet) meteor(); nextMet = now + 6000 + Math.random() * 12000; }
    },
    shower() { if (html.classList.contains('moving')) for (let i = 0; i < 6; i++) meteor(i * .28 + Math.random() * .2); },
    destroy() { job = null; clearTimeout(timer); clearTimeout(rtimer); ro.disconnect(); sc.remove(); },
  };
}

/* ---------- Carnival Night ---------- */
function carnivalScene(layer) {
  const sc = document.createElement('div'); sc.className = 'scene carnival';
  sc.innerHTML = carnivalSVG(true);
  layer.append(sc);
  // a tall screen (a phone) sees a slice of the picture: the slice around the Ferris wheel
  const svg = sc.firstElementChild, fit = () => {
    const a = layer.clientWidth / (layer.clientHeight || 1), w = 900 * a;
    svg.setAttribute('viewBox', a < 1.2 ? `${Math.max(0, Math.min(1600 - w, 330 - w / 2)).toFixed(0)} 0 ${w.toFixed(0)} 900` : '0 0 1600 900');
  };
  const ro = new ResizeObserver(fit); ro.observe(layer); fit();
  return { update() {}, destroy() { ro.disconnect(); sc.remove(); } };
}
/* marquee bulbs around a tile's edges: three sets that light in turn, so they seem to chase around it */
function marquee(col) {
  const old = col.querySelector(':scope > .marquee'), w = col.clientWidth, h = col.clientHeight;
  if (!w || !h) return;
  if (old && old._k === w + 'x' + h) return;
  const g = 22, inset = 9, nx = Math.max(1, Math.round((w - inset * 2) / g)), ny = Math.max(1, Math.round((h - inset * 2) / g)), sx = (w - inset * 2) / nx, sy = (h - inset * 2) / ny;
  const pts = [];
  for (let i = 0; i < nx; i++) pts.push([inset + i * sx, inset]);
  for (let i = 0; i < ny; i++) pts.push([w - inset, inset + i * sy]);
  for (let i = 0; i < nx; i++) pts.push([w - inset - i * sx, h - inset]);
  for (let i = 0; i < ny; i++) pts.push([inset, h - inset - i * sy]);
  const sets = [0, 1, 2].map(k => pts.filter((_, i) => i % 3 === k).map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="mq-glow"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/>`).join(''));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'marquee'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = sets.map((x, k) => `<g class="mq mq${k}">${x}</g>`).join('');
  svg._k = w + 'x' + h;
  if (old) old.replaceWith(svg); else col.prepend(svg);
}
/* fireworks over the scene (behind the see-through board): a few rockets that burst in the given colors */
function fireworks(sc, colors) {
  const html = document.documentElement;
  if (!sc || html.classList.contains('still') || html.classList.contains('lite')) return;
  const box = document.createElement('div'); box.className = 'cn-fw';
  box.innerHTML = Array.from({ length: 5 }, (_, i) => {
    const x = 12 + Math.random() * 76, y = 12 + Math.random() * 30, c = colors[i % colors.length], d = (i * .35 + Math.random() * .2).toFixed(2);
    return `<div class="fw" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--c:${c};--d:${d}s;--rise:${(70 - y).toFixed(0)}cqh"><i class="fw-rocket"></i>${Array.from({ length: 16 }, (_, k) => `<i class="fw-spark" style="--a:${k * 22.5}deg"></i>`).join('')}</div>`;
  }).join('');
  sc.append(box); setTimeout(() => box.remove(), 4200);
}

/* puts a map's world over the whole page (the page's own background rests meanwhile); returns { update(now), board(el),
   destroy() }: board() hands it the board, whose columns turn see-through for the map */
export function mountMap(layer, s) {
  const map = s.options.map || 'board', cur = { cols: null };
  layer.className = 'map-layer map-' + map;
  document.documentElement.classList.add('map-on', 'map-is-' + map);   // (map-is-ec: the Ether & Kenoma look)
  const scene = map === 'sky' ? skyScene(layer, s, cur) : map === 'pixel' ? pixelScene(layer) : map === 'ec' ? ecScene(layer) : map === 'carnival' ? carnivalScene(layer) : map === 'rabbit' ? rabbitScene(layer) : map === 'stars' ? starsScene(layer) : map === 'cabin' ? cabinScene(layer) : nightScene(layer);
  // Carnival Night: the tiles' marquee bulbs follow the tiles' size
  const ro = map === 'carnival' ? new ResizeObserver(es => es.forEach(e => marquee(e.target))) : null;
  return {
    update: now => scene.update(now),
    board(board) {
      if (!board) { cur.cols = null; return; }
      board.classList.add('map-' + map); cur.cols = board.querySelector('.cols');
      if (ro) { ro.disconnect(); board.querySelectorAll('.cols > .col').forEach(c => { marquee(c); ro.observe(c); }); }
    },
    /* the votes are in: fireworks in these colors on Carnival Night, a shower of shooting stars on Starry Night */
    cheer(colors) { if (map === 'carnival') fireworks(layer.querySelector('.scene'), colors.length ? colors : ['#ff4f6d', '#ffd23f', '#5ce1ff']); if (scene.shower) scene.shower(); },
    destroy() { if (ro) ro.disconnect(); scene.destroy(); layer.className = 'map-layer'; document.documentElement.classList.remove('map-on', 'map-is-' + map); },
  };
}
export const mapLabel = id => esc(mapName(id));
