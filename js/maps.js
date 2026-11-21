/* ---------- maps: the world behind the board ----------
   A map fills the whole page during a game, behind the see-through columns; the page's own background rests while it is
   covered. Night Show: the carnival at night (bunting, glowing string lights, Twister dots breathing across the floor).
   Sky: clouds everywhere; the sun sinks for a minute, then the moon comes down from the top and sinks for a minute, and
   the columns glow at night; one cloud carries a random player's duck. Pixel: columns built of wool blocks over a blocky
   world: floating islands (stone, two layers of dirt, grass, sometimes a tree) at different distances, a forest seen
   from above toward the bottom, and a pixel sunset on the horizon that breathes. Nous Within Kenoma: my book site's
   page, its burnt amber look on the interface (Cascadia Code) while the map is played, and five variations: Ether's
   Crossroads' jester's dungeon, and the looks the site gives some of its parts (nwk.js).
   Carnival Night: a Ferris wheel turning on the left, a striped big top on the right, string lights twinkling over
   them; the tiles wear marquee bulbs that chase around their edges, and fireworks go off when the votes are in.
   Rabbit Hole of Ducklings: a psychedelic fractal that keeps falling deeper into itself, morphing and shifting colors.
   Starry Night: the Milky Way and a sky full of stars rolling slowly overhead, twinkling, with shooting stars.
   Shelter Sky & Null: the owner's collage of a black tree and a halftone duck looking up at it (collage.js).
   Euclid's Squares: a mosaic of bright squares by Euclid's rule, shrinking forever into three points (euclid.js).
   The King's Festival: the page of No. 54 of my book, only the old vellum the letters were written on; the interface
   takes the Ether & Kenoma look (burnt amber) in the chapter's blackletter while it's played (vellum.js).
   The host picks the map in the lobby. Duck Cabin is Hangout's own world (hangout/world.js draws it); behind it, only a
   starry night sky, and it is not in the Map window. */
import { duckSVG } from "./duck.js";
import { pixelOn, gridPx } from "./pixel.js";
import { esc } from "./ui.js";
import { floorCanvas } from "./art.js";
import BOARD from "./pxm/board.js";
import CARNIVAL from "./pxm/carnival.js";
import STARS from "./pxm/stars.js";
import PIXEL from "./pxm/pixel.js";
import SKY from "./pxm/sky.js";
import { mountWorld } from "./pxmap.js";
import { collageScene } from "./collage.js";
import { euclidScene } from "./euclid.js";
import { vellumScene } from "./vellum.js";
import { NWK_VARIANTS, isNwk, nwkScene } from "./nwk.js";
import { seenDuck } from "./looks.js";
import { isUmap, UMAP_UIS } from "./umaprules.js";
import { seriatThemeOn } from "./seriattheme.js";

export const MAPS = [
  [
    "board",
    "Night Show",
    "The carnival at night: string lights, bunting and breathing Twister dots.",
  ],
  [
    "sky",
    "Sky",
    "Clouds, a sun and a moon that take turns (a minute each), and columns that glow at night.",
  ],
  [
    "pixel",
    "Pixel",
    "Wool-block columns over floating block islands, a forest below and a pixel sunset.",
  ],
  [
    "carnival",
    "Carnival Night",
    "A Ferris wheel and a big top under string lights, marquee bulbs around the tiles, and fireworks when the votes are in.",
  ],
  [
    "stars",
    "Starry Night",
    "A sky full of stars and the Milky Way, slowly rolling overhead, with shooting stars now and then.",
  ],
  [
    "rabbit",
    "Rabbit Hole of Ducklings",
    "A colorful fractal you keep falling into: it morphs as you go, and its colors never sit still.",
  ],
  [
    "collage",
    "Shelter Sky & Null",
    "A black tree, a halftone duck looking up at it, swirls and a chain-link net, small squares that fade in and out, and static over it all. It can be black and white.",
  ],
  [
    "nwk",
    "Nous Within Kenoma",
    "The page of the book Nous Within Kenoma: burnt amber on near black, thin black strings and faint static, and the book's look while it's played.",
  ],
  [
    "euclid",
    "Euclid's Squares",
    "Bright squares, each the biggest that fits in what's left, shrinking forever into three points.",
  ],
  [
    "vellum",
    "The King's Festival",
    "The bare vellum page of an old medieval book, and the Ether & Kenoma look in blackletter while it's played.",
  ],
  [
    "tiles",
    "Tiles",
    "A pure black and white checkerboard: 8 tiles across on a computer, 5 on a phone.",
  ],
];
/* Euclid's Squares with its endless zoom: one of the map's two forms in the map vote and Random (picked, it's Euclid's
   Squares with s.mapZoomed on; the host who picks the map turns it on with the map's Zoom setting instead) */
export const ZOOM_MAP = [
  "euclidzoom",
  "Euclid's Squares (Zoom)",
  "Euclid's Squares, zooming into its tiny squares forever.",
];
/* Shelter Sky & Null in black and white: its other form in the map vote and Random (picked, it's the collage with
   s.mapGreyed on; the host who picks the map turns it on with the map's Colors setting instead) */
export const GREY_MAP = [
  "collagebw",
  "Shelter Sky & Null (Black and white)",
  "Shelter Sky & Null in black, white and greys.",
];
/* every variation of a map (owner, Nov 16: "Every variation of any map is at the bottom" of the list): [its id, its
   name, what it is, the map it's a variation of]. Euclid's Squares (Zoom) and Shelter Sky & Null (Black and white) play
   their map in another form (mapForm); Nous Within Kenoma's are maps of their own (nwk.js) */
export const MAP_VARIANTS = [
  [...ZOOM_MAP, "euclid"],
  [...GREY_MAP, "collage"],
  ...NWK_VARIANTS,
];
/* the map a variation belongs to (a map that isn't one: itself) */
const variantBase = (id) =>
  (MAP_VARIANTS.find((v) => v[0] === id) || [id, "", "", id])[3];
/* a map's forms: the map vote shows each one as a map of its own, next to its map; Random picks one at random */
export const MAP_FORMS = Object.fromEntries(
  MAPS.map(([id]) => [
    id,
    [id, ...MAP_VARIANTS.filter((v) => v[3] === id).map((v) => v[0])],
  ]).filter(([, f]) => f.length > 1),
);
/* a form as the game plays it: the map, and whether it zooms or is grey */
export const mapForm = (id) =>
  id === ZOOM_MAP[0]
    ? { map: "euclid", zoom: 1 }
    : id === GREY_MAP[0]
      ? { map: "collage", grey: 1 }
      : { map: id };
export const mapName = (id) =>
  id === "cabin"
    ? "Duck Cabin"
    : isUmap(id)
      ? (UMAPS[id] || {}).t || "A made map"
      : ([...MAPS, ...MAP_VARIANTS].find((m) => m[0] === id) || MAPS[0])[1];
/* the maps the host made and brought into the room (s.umap: umaprules.js), as the room last said; net.js and online.js
   keep it up to date, so a map's name and picture are there wherever a map is shown */
let UMAPS = {};
export const useUmaps = (u) => {
  UMAPS = u || {};
};
export const umapOf = (id) => UMAPS[id] || null;

/* ---------- Sky: its sun, moon, stars and clouds as pixel files (js/pxm/sky.js), laid out anew each round ---------- */
const CLOUD =
  '<svg viewBox="0 0 200 90" aria-hidden="true"><g fill="#fff"><circle cx="52" cy="56" r="28"/><circle cx="92" cy="42" r="34"/><circle cx="140" cy="50" r="30"/><circle cx="170" cy="64" r="20"/><circle cx="28" cy="66" r="18"/><rect x="28" y="56" width="146" height="28" rx="14"/></g></svg>';
const mixHex = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
    A = p(a),
    B = p(b);
  return (
    "#" +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    ).join("")
  );
};
function skyScene(layer, s, cur) {
  const sc = worldScene(layer, SKY, "sky"),
    st = sc.stage,
    { W, H, G } = SKY;
  const rnd = (
    (k) => () =>
      (k = (k * 9301 + 49297) % 233280) / 233280
  )(s.round * 31 + s.qi * 7 + 3);
  const n = 7,
    ids = s.seat.filter((id) => s.players[id]),
    rider = ids.length ? ids[(s.round * 7 + s.qi * 3) % ids.length] : null;
  const pic = (p, more = "") =>
    `<img class="px-file" alt="" draggable="false" src="${p.src}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px${more}">`;
  /* a cloud: its picture at its width (9% to 19% of the world's), as it was made into pixels */
  const clouds = Array.from({ length: n }, (_, i) => {
    const w = Math.round(9 + rnd() * 10),
      top = 6 + rnd() * 74,
      dur = 70 + rnd() * 60,
      dl = -rnd() * dur,
      op = 0.55 + rnd() * 0.35,
      p = SKY.clouds[w];
    const duck =
      i === 2 && rider
        ? `<div class="sky-rider" data-pxyes>${duckSVG(seenDuck(s.players[rider]), { size: 60, shadow: false, title: s.players[rider].name })}</div>`
        : "";
    return `<div class="sky-cloud${duck ? " ridden" : ""}" style="width:${w}%;height:${(((w / 100) * W * 90) / 200).toFixed(1)}px;top:${top.toFixed(1)}%;opacity:${op.toFixed(2)};animation-duration:${dur.toFixed(0)}s;animation-delay:${dl.toFixed(1)}s">${pic(p)}${duck}</div>`;
  }).join("");
  /* each star on the grid: a pixel of the world for its left and its top */
  const at = (f, size) => Math.round((f * size) / G) * G;
  st.innerHTML = `<canvas class="sky-px" width="1" height="${H / G}" aria-hidden="true"></canvas><div class="sky-stars">${Array.from(
    { length: 40 },
    () =>
      pic(
        {
          ...SKY.star,
          x: at(rnd(), W) + SKY.star.x,
          y: at(rnd() * 0.7, H) + SKY.star.y,
        },
        `;animation-delay:-${(rnd() * 3).toFixed(1)}s`,
      ),
  ).join("")}</div>${[
    ["sky-sun", SKY.sun],
    ["sky-moon", SKY.moon],
  ]
    .map(
      ([c, p]) =>
        `<div class="${c}">${pic(p)}</div>${p.glow ? `<div class="${c}" style="mix-blend-mode:plus-lighter">${pic({ ...p, src: p.glow })}</div>` : ""}`,
    )
    .join("")}${clouds}`; // (a glow on its own, added to the sky under it as the era did: tools/era.py)
  const sky = st.querySelector(".sky-px").getContext("2d"),
    stars = st.querySelector(".sky-stars"),
    sun = st.querySelectorAll(".sky-sun"),
    moon = st.querySelectorAll(".sky-moon");
  /* the sky's colors from top to bottom, a pixel for each row of the world's (as css's linear-gradient mixes them) */
  const paint = (top, bot) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
      A = p(top),
      B = p(bot),
      n = H / G;
    for (let y = 0; y < n; y++) {
      const t = (y + 0.5) / n;
      sky.fillStyle = `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
      sky.fillRect(0, y, 1, 1);
    }
  };
  let last = "",
    lastSky = "";
  return {
    update(now) {
      const t = (now % 120000) / 120000,
        day = t < 0.5,
        p = day ? t / 0.5 : (t - 0.5) / 0.5; // a minute of sun, a minute of moon
      const y = -12 + p * 118,
        x = 18 + p * 60; // down from the top and set below the bottom
      const key = Math.round(now / 200);
      if (key === last) return;
      last = key;
      for (const e of day ? sun : moon)
        e.style.transform = `translate(${at(x / 100, W)}px, ${at(y / 100, H)}px)`;
      for (const e of day ? moon : sun)
        e.style.transform = `translate(0, ${-0.4 * H}px)`;
      // the sky: blue by day, warm as the sun sets, deep blue at night (and lighter again as the moon sets)
      const top = day
        ? p < 0.6
          ? "#5ab8f5"
          : mixHex("#5ab8f5", "#f2885a", (p - 0.6) / 0.4)
        : p < 0.85
          ? "#0e1433"
          : mixHex("#0e1433", "#3a5aa8", (p - 0.85) / 0.15);
      const bot = day
        ? p < 0.6
          ? "#d6f0ff"
          : mixHex("#d6f0ff", "#ffd08a", (p - 0.6) / 0.4)
        : p < 0.85
          ? "#26305e"
          : mixHex("#26305e", "#8cc6f0", (p - 0.85) / 0.15);
      if (top + bot !== lastSky) {
        lastSky = top + bot;
        paint(top, bot);
      }
      const night = !day || p > 0.9;
      if (cur.cols) cur.cols.classList.toggle("night", night);
      stars.style.opacity = day ? 0 : p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
    },
    destroy() {
      sc.destroy();
      if (cur.cols) cur.cols.classList.remove("night");
    },
  };
}

/* ---------- Pixel: a sunset over islands in the sky and a forest, as pixel files (js/pxm/pixel.js) ---------- */
const pixelScene = (layer) =>
  worldScene(layer, PIXEL, "pixel", { fx: 0.64, fy: 0.5 }); // (a phone: the slice with the sun and the big islands)
/* a map made of pixel files (js/pxmap.js) in a scene of its own: kind, the scene's class; focus, where a narrow screen
   looks (mountWorld) */
function worldScene(layer, world, kind, focus) {
  const sc = document.createElement("div");
  sc.className = `scene ${kind}`;
  layer.append(sc);
  const w = mountWorld(sc, world, focus);
  layer.classList.add("px-own"); // (pixels already: the filter leaves it)
  return {
    stage: w.stage,
    update() {},
    destroy() {
      w.destroy();
      layer.classList.remove("px-own");
      sc.remove();
    },
  };
}

/* ---------- Night Show: the carnival at night, as pixel files (js/pxm/board.js, tools/pixel-maps.cjs) ---------- */
function nightScene(layer) {
  const sc = worldScene(layer, BOARD, "night");
  floorCanvas(sc.stage, BOARD.G); // (the floor's breathing rows, on one canvas: art.js)
  return sc;
}

/* ---------- Duck Cabin: the night sky around Hangout's world (the world itself fills the board), drawn by code in the
   world's pixels: blue going down to a green dark, a few stars and the moon in the top right ---------- */
const CABIN_STARS = [
  [0.12, 0.18, 0.6],
  [0.34, 0.08, 0.53],
  [0.58, 0.22, 0.67],
  [0.76, 0.12, 0.53],
  [0.9, 0.3, 0.6],
  [0.22, 0.4, 0.4],
  [0.66, 0.44, 0.4],
]; // (where, as parts of the world, and how bright)
const cabinScene = (layer) =>
  codeScene(layer, "cabin", (x, W, H) => {
    const gr = x.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#0b1030");
    gr.addColorStop(0.7, "#1d2a55");
    gr.addColorStop(1, "#14301f");
    x.fillStyle = gr;
    x.fillRect(0, 0, W, H); // (one color for each row of pixels)
    x.fillStyle = "#fff";
    for (const [sx, sy, a] of CABIN_STARS) {
      x.globalAlpha = a;
      x.fillRect(Math.round(sx * W), Math.round(sy * H), 1, 1);
    }
    /* the moon: a pale disc, its glow fading out (css drew it 60 px round, at 86% 10%) */
    const mx = 0.86 * W,
      my = 0.1 * H,
      r = 30,
      glow = 0x22 / 255;
    x.fillStyle = "#fff4cf";
    for (let j = Math.floor(my - r); j <= my + r; j++)
      for (let i = Math.floor(mx - r); i <= mx + r; i++) {
        const f = Math.hypot(i + 0.5 - mx, j + 0.5 - my) / r,
          a =
            f < 0.4
              ? 1
              : f < 0.55
                ? 1 - ((f - 0.4) / 0.15) * (1 - glow)
                : f < 0.7
                  ? glow * (1 - (f - 0.55) / 0.15)
                  : 0;
        if (!a) continue;
        x.globalAlpha = a;
        x.fillRect(i, j, 1, 1);
      }
    x.globalAlpha = 1;
  });
/* a map drawn only by code, straight in the world's pixels (Duck Cabin's night sky, Tiles' checkerboard): a canvas of
   the world's pixels in a scene of its own, painted again when the screen's size changes; paint(x, W, H, seen) gets
   its context, its size in pixels and what the screen sees of it ([left, top, width, height], in its pixels) */
function codeScene(layer, kind, paint, focus) {
  const world = { W: 1366, H: 768, G: 2 },
    sc = worldScene(layer, world, kind, focus),
    cv = document.createElement("canvas"),
    W = (cv.width = world.W / world.G),
    H = (cv.height = world.H / world.G);
  cv.className = "code-px";
  sc.stage.append(cv);
  const x = cv.getContext("2d");
  let at = "";
  const draw = () => {
    const r = sc.stage.getBoundingClientRect(),
      b = layer.getBoundingClientRect();
    if (!r.width || !b.width) return;
    const k = r.width / W,
      seen = [
        Math.max(0, (b.left - r.left) / k),
        Math.max(0, (b.top - r.top) / k),
        Math.min(W, b.width / k),
        Math.min(H, b.height / k),
      ],
      key = seen.map(Math.round).join() + "/" + layer.clientWidth;
    if (key === at) return;
    at = key;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.clearRect(0, 0, W, H);
    paint(x, W, H, seen);
  };
  const ro = new ResizeObserver(() => requestAnimationFrame(draw));
  ro.observe(layer);
  draw();
  return {
    ...sc,
    destroy() {
      ro.disconnect();
      sc.destroy();
    },
  };
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
  const sc = document.createElement("div");
  sc.className = "scene rabbit";
  const cv = document.createElement("canvas");
  sc.append(cv);
  layer.append(sc);
  const html = document.documentElement,
    gl = cv.getContext("webgl", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    });
  const prog =
    gl &&
    (() => {
      const sh = (type, src) => {
        const x = gl.createShader(type);
        gl.shaderSource(x, src);
        gl.compileShader(x);
        return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null;
      };
      const v = sh(
          gl.VERTEX_SHADER,
          "attribute vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }",
        ),
        f = sh(gl.FRAGMENT_SHADER, RH_FRAG);
      if (!v || !f) return null;
      const pr = gl.createProgram();
      gl.attachShader(pr, v);
      gl.attachShader(pr, f);
      gl.linkProgram(pr);
      return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
    })();
  if (!prog) {
    sc.classList.add("rh-plain");
    return {
      update() {},
      destroy() {
        sc.remove();
      },
    };
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const ap = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(ap);
  gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "uRes"),
    uT = gl.getUniformLocation(prog, "uT");
  let last = -1,
    drawnStill = false,
    scale = 1,
    slow = 0;
  const t0 = performance.now() - Math.random() * 600000; // everyone starts somewhere else in the fall
  return {
    update() {
      const still = html.classList.contains("still"),
        lite = html.classList.contains("low"),
        now = performance.now();
      if (still && drawnStill) return;
      if (now - last < (lite ? 66 : 33)) return; // 30 frames a second (15 on Low graphics)
      // a device that can't keep up (frames 80 ms apart) gets fewer pixels, down to a quarter
      if (last > 0 && !still) {
        slow = now - last > 80 ? slow + 1 : 0;
        if (slow > 10 && scale > 0.5) {
          scale *= 0.8;
          slow = 0;
        }
      }
      last = now;
      const px = pixelOn(); // (the pixel look: one of its pixels is one of the grid's, shown sharp, instead of the filter)
      layer.classList.toggle("px-own", px);
      cv.style.imageRendering = px ? "pixelated" : "";
      const k = px
          ? 1 / gridPx()
          : (lite ? 0.3 : 0.5) * scale * Math.min(1.5, devicePixelRatio || 1),
        w = Math.max(1, Math.round(layer.clientWidth * k)),
        h = Math.max(1, Math.round(layer.clientHeight * k));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawnStill = still;
    },
    destroy() {
      layer.classList.remove("px-own");
      const x = gl.getExtension("WEBGL_lose_context");
      if (x) x.loseContext();
      sc.remove();
    },
  };
}

/* ---------- Starry Night, in the world's pixels (js/pxm/stars.js, tools/pixel-maps.cjs) ----------
   A deep night sky that turns slowly around a pole above the page, so the stars roll across it in long arcs (a turn
   every five minutes, left to right): the sky is one pixel file (the Milky Way and tens of thousands of stars, made
   once by tools/pixel-src/stars.js), drawn turned on a canvas of the world's pixels, each of its pixels whole. Over it
   the brightest stars twinkle, drawn pixel by pixel, and now and then a shooting star crosses (a shower of them when the
   votes are in). Still backgrounds hold the sky in place. */
function starsScene(layer) {
  const sc = worldScene(layer, STARS, "stars", { fx: 0.4, fy: 0.5 }), // (a phone: the slice where the Milky Way's core starts)
    W = STARS.W / STARS.G,
    H = STARS.H / STARS.G,
    html = document.documentElement,
    cv = document.createElement("canvas");
  cv.className = "st-px";
  cv.width = W;
  cv.height = H;
  sc.stage.append(cv);
  const x = cv.getContext("2d"),
    sky = new Image(),
    glow = STARS.skyGlow && new Image();
  sky.src = STARS.sky;
  if (glow) glow.src = STARS.skyGlow;
  /* the night behind, and the air thickening toward the bottom over it: a pixel for each row of the world's */
  const rows = (stops) => {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = H;
    const g = c.getContext("2d"),
      gr = g.createLinearGradient(0, 0, 0, H);
    stops.forEach(([at, col]) => gr.addColorStop(at, col));
    g.fillStyle = gr;
    g.fillRect(0, 0, 1, H);
    return c;
  };
  const back = rows([
      [0, "#020309"],
      [0.42, "#050a1d"],
      [0.78, "#0a1534"],
      [1, "#13224b"],
    ]),
    haze = rows([
      [0.55, "#1b2c5c00"],
      [0.82, "#1b2c5c2e"],
      [1, "#2a3f7550"],
    ]);
  /* a bright star n pixels across, as its pixels: a white heart, its color round it, fading out (the biggest with
     spikes, a pixel thick); made once for each size and color */
  const sprites = new Map(),
    sprite = (n, c, sp) => {
      const k = n + c + sp;
      if (sprites.has(k)) return sprites.get(k);
      const L = sp ? n * 3 : n,
        s = document.createElement("canvas");
      s.width = s.height = L;
      const g = s.getContext("2d"),
        o = (L - n) / 2,
        h = n / 2;
      if (sp) {
        const m = Math.floor(L / 2);
        g.fillStyle = c;
        for (let i = 0; i < L; i++) {
          g.globalAlpha = 0.35 * (1 - Math.abs(i + 0.5 - L / 2) / (L / 2)); // (fading to its ends)
          g.fillRect(i, m, 1, 1);
          if (i !== m) g.fillRect(m, i, 1, 1);
        }
        g.globalAlpha = 1;
      }
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const f = Math.hypot(i + 0.5 - h, j + 0.5 - h) / h;
          if (f > 0.7) continue;
          g.fillStyle = f < 0.17 || n < 2 ? "#fff" : c;
          g.globalAlpha = f < 0.32 ? 1 : f < 0.5 ? 0.45 : 0.15;
          g.fillRect(o + i, o + j, 1, 1);
        }
      sprites.set(k, s);
      return s;
    };
  const [ox, oy] = STARS.pole,
    R = STARS.R;
  /* a twinkle: from all there to half there and a little smaller and back, eased (as css's ease-in-out) */
  const twinkle = (t, d, dl) => {
    let u = ((t - dl) / d) % 2;
    if (u > 1) u = 2 - u;
    return ease(0.42, 0, 0.58, 1, u);
  };
  /* the shooting stars: [left, top, angle, how far, how long (world pixels), time, delay, start] */
  const mets = [],
    t0 = performance.now(); // (the sky starts where it was made to: its turn counts from now)
  let last = -1e9,
    nextMet = 0;
  const draw = (now) => {
    const moving = html.classList.contains("moving"),
      t = moving ? (now - t0) / 1000 : 0,
      a = STARS.base - (moving ? (t / 300) * 2 * Math.PI : 0);
    x.imageSmoothingEnabled = false;
    x.globalAlpha = 1;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(back, 0, 0, W, H);
    x.setTransform(1, 0, 0, 1, ox, oy);
    x.rotate(a);
    x.drawImage(sky, -R, -R);
    if (glow) {
      x.globalCompositeOperation = "lighter"; // (its glow added to the night, as the era did: tools/era.py)
      x.drawImage(glow, -R, -R);
      x.globalCompositeOperation = "source-over";
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    const ca = Math.cos(a),
      sa = Math.sin(a);
    for (const [bx, by, size, c, d, dl] of STARS.bright) {
      const u = bx - R,
        v = by - R,
        X = ox + u * ca - v * sa,
        Y = oy + u * sa + v * ca;
      if (X < -12 || Y < -12 || X > W + 12 || Y > H + 12) continue;
      const tw = moving ? twinkle(t, d, dl) : 0,
        n = Math.max(1, Math.round(size * (1 - 0.2 * tw))),
        im = sprite(n, c, size > 5.5);
      x.globalAlpha = 1 - 0.5 * tw;
      x.drawImage(
        im,
        Math.round(X - im.width / 2),
        Math.round(Y - im.height / 2),
      );
    }
    for (let i = mets.length - 1; i >= 0; i--) {
      const m = mets[i],
        p = (now - m.at) / 1000 - m.dl;
      if (p >= m.t) {
        mets.splice(i, 1);
        continue;
      }
      if (p < 0) continue;
      const f = p / m.t,
        e = ease(0.3, 0.1, 0.7, 1, f),
        len = m.len * (0.3 + 0.7 * e),
        hx = m.x + Math.cos(m.a) * m.go * e,
        hy = m.y + Math.sin(m.a) * m.go * e;
      const o = f < 0.12 ? f / 0.12 : f > 0.75 ? (1 - f) / 0.25 : 1;
      for (let k = 0; k < len; k++) {
        const q = k / len; // (from the head back: white, then pale blue, then gone)
        x.fillStyle = q < 0.4 ? "#fff" : "#bcd0ff";
        x.globalAlpha = o * (q < 0.4 ? 1 - q : 0.6 * (1 - (q - 0.4) / 0.6));
        x.fillRect(
          Math.round(hx - Math.cos(m.a) * k),
          Math.round(hy - Math.sin(m.a) * k),
          1,
          1,
        );
      }
      x.globalAlpha = o;
      x.fillStyle = "#fff";
      x.fillRect(Math.round(hx) - 1, Math.round(hy), 3, 1);
      x.fillRect(Math.round(hx), Math.round(hy) - 1, 1, 3); // (its head)
    }
    x.globalAlpha = 1;
    x.drawImage(haze, 0, 0, W, H);
  };
  /* a shooting star, somewhere in the upper sky the screen sees, heading down to one side */
  const meteor = (delay = 0) => {
    const r = sc.stage.getBoundingClientRect(),
      b = layer.getBoundingClientRect(),
      k = r.width / W || 1,
      vx = Math.max(0, (b.left - r.left) / k),
      vy = Math.max(0, (b.top - r.top) / k),
      vw = Math.min(W - vx, b.width / k),
      vh = Math.min(H - vy, b.height / k),
      right = Math.random() < 0.5,
      a = 14 + Math.random() * 26;
    mets.push({
      x: vx + ((right ? 0.05 : 0.45) + Math.random() * 0.5) * vw,
      y: vy + (0.04 + Math.random() * 0.45) * vh,
      a: ((right ? a : 180 - a) * Math.PI) / 180,
      go: (260 + Math.random() * 380) / k,
      len: (120 + Math.random() * 140) / k,
      t: 0.7 + Math.random() * 0.6,
      dl: delay,
      at: performance.now(),
    });
  };
  const ready = () => {
    sc.stage.classList.add("ready");
    draw(performance.now());
  };
  sky.decode().then(ready, ready);
  return {
    update(now) {
      if (!sky.complete) return;
      if (html.classList.contains("moving")) {
        if (now > nextMet) {
          if (nextMet) meteor();
          nextMet = now + 6000 + Math.random() * 12000;
        }
        if (now - last < (mets.length ? 0 : 64)) return; // (15 a second: a slow turn and slow twinkles; a shooting star at full speed)
      } else if (last >= 0) return; // (still: drawn once)
      last = now;
      draw(performance.now());
    },
    shower() {
      if (html.classList.contains("moving"))
        for (let i = 0; i < 6; i++) meteor(i * 0.28 + Math.random() * 0.2);
    },
    destroy: sc.destroy,
  };
}

/* ---------- Carnival Night, as pixel files (js/pxm/carnival.js, tools/pixel-maps.cjs) ---------- */
const carnivalScene = (layer) =>
  worldScene(layer, CARNIVAL, "carnival", { fx: 330 / 1600, fy: 0.5 }); // (a phone: the slice round the Ferris wheel)
/* marquee bulbs around a tile's edges: three sets that light in turn, so they seem to chase around it */
function marquee(col) {
  const old = col.querySelector(":scope > .marquee"),
    w = col.clientWidth,
    h = col.clientHeight;
  if (!w || !h) return;
  if (old && old._k === w + "x" + h) return;
  const g = 22,
    inset = 9,
    nx = Math.max(1, Math.round((w - inset * 2) / g)),
    ny = Math.max(1, Math.round((h - inset * 2) / g)),
    sx = (w - inset * 2) / nx,
    sy = (h - inset * 2) / ny;
  const pts = []; // [x, y, side]
  for (let i = 0; i < nx; i++) pts.push([inset + i * sx, inset, 0]);
  for (let i = 0; i < ny; i++) pts.push([w - inset, inset + i * sy, 1]);
  for (let i = 0; i < nx; i++) pts.push([w - inset - i * sx, h - inset, 2]);
  for (let i = 0; i < ny; i++) pts.push([inset, h - inset - i * sy, 3]);
  /* each set as four groups, one per side: a lit set is a layer of its own for the browser, as big as what it holds, so
     one per side stays a thin strip instead of the whole tile (the same bulbs, lit at the same moments) */
  const sets = [];
  for (let k = 0; k < 3; k++)
    for (let side = 0; side < 4; side++)
      sets.push([
        k,
        pts
          .filter((p, i) => i % 3 === k && p[2] === side)
          .map(
            ([x, y]) =>
              `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="mq-glow"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/>`,
          )
          .join(""),
      ]);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "marquee");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.innerHTML = sets
    .filter(([, x]) => x)
    .map(([k, x]) => `<g class="mq mq${k}">${x}</g>`)
    .join("");
  svg._k = w + "x" + h;
  if (old) old.replaceWith(svg);
  else col.prepend(svg);
}
/* fireworks over the scene (behind the see-through board): a few rockets that burst in the given colors, drawn in the
   world's own pixels on a canvas of its size (so they are as big as every pixel of the map), where the screen sees it */
function fireworks(sc, colors) {
  const html = document.documentElement,
    st = sc && sc.querySelector(".pxw-stage");
  if (!st || html.classList.contains("still") || html.classList.contains("low"))
    return;
  const c = document.createElement("canvas"),
    W = (c.width = CARNIVAL.W / CARNIVAL.G),
    H = (c.height = CARNIVAL.H / CARNIVAL.G);
  c.className = "cn-fw";
  st.append(c);
  /* what the screen sees of the world, in its pixels */
  const r = st.getBoundingClientRect(),
    b = sc.getBoundingClientRect(),
    k = r.width / W,
    vx = Math.max(0, (b.left - r.left) / k),
    vy = Math.max(0, (b.top - r.top) / k),
    vw = Math.min(W - vx, b.width / k),
    vh = Math.min(H - vy, b.height / k);
  const shots = Array.from({ length: 5 }, (_, i) => {
    const y = 12 + Math.random() * 30;
    return {
      x: vx + ((12 + Math.random() * 76) * vw) / 100,
      y: vy + (y * vh) / 100,
      rise: ((70 - y) * vh) / 100,
      c: colors[i % colors.length],
      d: i * 0.35 + Math.random() * 0.2,
    };
  });
  const x = c.getContext("2d"),
    t0 = performance.now(),
    rp = (v) => Math.round(v),
    fade = (p, at, to) =>
      p < at ? 1 + (to - 1) * (p / at) : to * (1 - (p - at) / (1 - at));
  const frame = (now) => {
    const t = (now - t0) / 1000;
    x.clearRect(0, 0, W, H);
    for (const f of shots) {
      const tr = (t - f.d) / 0.7; // (the rocket going up: 0.7 s, slowing)
      if (tr >= 0 && tr < 1) {
        const e = ease(0, 0, 0.58, 1, tr),
          px = rp(f.x) - 1,
          py = rp(f.y + f.rise * (1 - e));
        x.globalAlpha = fade(tr, 0.9, 1);
        x.fillStyle = f.c;
        x.fillRect(px, py, 2, 7);
        x.fillStyle = "#fff";
        x.fillRect(px, py, 2, 2); // (its white tip)
      }
      const tb = (t - f.d - 0.7) / 1.5; // (the burst: 1.5 s, flying out fast, then hanging and falling a little)
      if (tb < 0 || tb >= 1) continue;
      const e = ease(0.15, 0.7, 0.3, 1, tb),
        o = fade(tb, 0.7, 0.9);
      for (let s = 0; s < 16; s++) {
        const a = (s * Math.PI) / 8,
          dx = 0.14 * vh * e,
          dy = 0.03 * vh * e,
          sx = rp(f.x + dx * Math.cos(a) - dy * Math.sin(a)),
          sy = rp(f.y + dx * Math.sin(a) + dy * Math.cos(a));
        x.fillStyle = f.c;
        x.globalAlpha = o * 0.35;
        x.fillRect(sx - 2, sy - 1, 5, 3);
        x.fillRect(sx - 1, sy - 2, 3, 5); // (its glow)
        x.globalAlpha = o;
        x.fillRect(sx - 1, sy, 3, 1);
        x.fillRect(sx, sy - 1, 1, 3);
        x.fillStyle = "#fff";
        x.fillRect(sx, sy, 1, 1);
      }
    }
    x.globalAlpha = 1;
    if (t < 4.2 && c.isConnected) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}
/* a CSS cubic-bezier(x1, y1, x2, y2) at p (0 to 1): how far along, as the CSS fireworks moved */
function ease(x1, y1, x2, y2, p) {
  const at = (a, b, u) =>
    3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (at(x1, x2, m) < p) lo = m;
    else hi = m;
  }
  return at(y1, y2, (lo + hi) / 2);
}

/* puts a map's world over the whole page (the page's own background rests meanwhile); returns { update(now), board(el),
   destroy() }: board() hands it the board, whose columns turn see-through for the map */
/* the maps' scenes on their own, for a small screen (Duck Cabin's TV): scene(layer) → { update(now), destroy() } */
/* Tiles: nothing but a pure black and white checkerboard, 8 squares across what the screen sees (5 on a phone), each
   a whole number of the world's pixels, white in the top left corner */
const tilesScene = (layer) =>
  codeScene(layer, "tiles", (x, W, H, [l, t, w]) => {
    const n = layer.clientWidth <= 700 ? 5 : 8,
      q = Math.max(1, Math.round(w / n)),
      i0 = Math.round(l),
      j0 = Math.round(t);
    x.fillStyle = "#000";
    x.fillRect(0, 0, W, H);
    x.fillStyle = "#fff";
    for (let j = 0; j0 + j * q < H; j++)
      for (let i = 0; i0 + i * q < W; i++)
        if (!((i + j) & 1)) x.fillRect(i0 + i * q, j0 + j * q, q, q);
  });
export const SCENES = {
  board: nightScene,
  rabbit: rabbitScene,
  stars: starsScene,
  nwk: (layer) => nwkScene(layer, "nwk"),
};

/* a map's scene in its layer (page: the game's own map, not a preview) */
function sceneOf(map, layer, s, cur, page = false) {
  if (isUmap(map)) return madeScene(layer, map);
  return isNwk(map)
    ? nwkScene(layer, map, page)
    : map === "sky"
      ? skyScene(layer, s, cur)
      : map === "pixel"
        ? pixelScene(layer)
        : map === "tiles"
          ? tilesScene(layer)
          : map === "carnival"
            ? carnivalScene(layer)
            : map === "rabbit"
              ? rabbitScene(layer)
              : map === "stars"
                ? starsScene(layer)
                : map === "collage"
                  ? collageScene(layer, s)
                  : map === "euclid"
                    ? euclidScene(layer, s)
                    : map === "vellum"
                      ? vellumScene(layer)
                      : map === "cabin"
                        ? cabinScene(layer)
                        : nightScene(layer);
}
/* ---------- a made map (umaps.js, umaprules.js): its picture, filling the screen ----------
   The picture is already pixels (UMAP.W × UMAP.H, in the pixel look's colors); it's drawn on a canvas one pixel to a
   grid square of the pixel look (pixel.js gridPx), as the book's map is, cut to fill the screen and never smoothed, so its
   pixels are the same size as every other map's (the owner's, Nov 19 22:59Z: "compressed to the same pixel quality as
   all of the other maps") */
function madeScene(layer, id) {
  const sc = document.createElement("div"),
    cv = document.createElement("canvas"),
    img = new Image();
  sc.className = "scene";
  cv.className = "made-px";
  cv.setAttribute("aria-hidden", "true");
  sc.append(cv);
  layer.append(sc);
  layer.classList.add("px-own"); // (drawn as pixels already: the map filter leaves it)
  let src = "",
    w = 0,
    h = 0;
  const draw = () => {
    const m = UMAPS[id],
      g = gridPx() || 2,
      W = Math.max(1, Math.ceil(layer.clientWidth / g)),
      H = Math.max(1, Math.ceil(layer.clientHeight / g));
    if (m && m.d !== src) {
      src = m.d;
      img.src = src;
      img
        .decode()
        .then(() => ((w = 0), draw()))
        .catch(() => {});
      return;
    }
    if (!img.naturalWidth || (W === w && H === h)) return;
    [w, h] = [W, H];
    cv.width = W;
    cv.height = H;
    cv.style.width = (W * g).toFixed(1) + "px";
    cv.style.height = (H * g).toFixed(1) + "px";
    const x = cv.getContext("2d"),
      k = Math.max(W / img.naturalWidth, H / img.naturalHeight); // (cut to fill: the middle of the picture)
    x.imageSmoothingEnabled = false;
    x.drawImage(
      img,
      (W - img.naturalWidth * k) / 2,
      (H - img.naturalHeight * k) / 2,
      img.naturalWidth * k,
      img.naturalHeight * k,
    );
  };
  draw();
  return {
    update: () => draw(),
    destroy() {
      sc.remove();
      layer.classList.remove("px-own");
    },
  };
}
/* the look a made map wears: the book's (map-is-nwk, and its form's own) or the game's own */
const madeLooks = (id) => {
  const ui = (UMAPS[id] || {}).ui || "";
  return [
    "map-is-made",
    ...(ui ? ["map-is-nwk"] : []),
    ...(ui && ui !== "nwk" ? ["map-is-" + ui] : []),
  ];
};

/* a map moving in a small box of its own (the map vote's tiles, under the pointer or a finger, and the one you voted
   for): the same scene as in the game, without the page's own map look; a form plays as itself (zoom, black and white) */
export function mountPreview(box, id) {
  const f = mapForm(id),
    layer = document.createElement("div");
  layer.className = `map-layer map-peek map-${variantBase(f.map)} map-${f.map}`;
  layer.dataset.nopx = ""; // (the pixel look: the grid filter does maps, pxdom.js leaves them)
  box.append(layer);
  const s = {
      options: { map: f.map },
      mapZoomed: f.zoom ? 1 : 0,
      mapGreyed: f.grey ? 1 : 0,
      seat: [],
      players: {},
      round: 0,
      qi: 0,
    },
    scene = sceneOf(f.map, layer, s, { cols: null });
  return {
    update: (now) => scene.update(now),
    destroy() {
      scene.destroy();
      layer.remove();
    },
  };
}

export function mountMap(layer, s) {
  const map = s.options.map || "board",
    cur = { cols: null };
  const base = variantBase(map), // (a variation wears its map's look too, then its own: map-is-nwk map-is-nwkten)
    /* Survival wears Nous Within Kenoma's whole look over its own map (the owner's, Nov 20 02:32Z: "We can give the noose
       within Kenoma the full theme to survival"); Dead Ducks Arcade keeps its own ("I kind of lean towards leaving Dead
       Ducks Arcade UI alone") */
    looks = [
      "map-on",
      ...(isUmap(map) ? madeLooks(map) : ["map-is-" + base, "map-is-" + map]),
      ...(s.options.mode === "surv" ? ["map-is-nwk"] : []),
    ];
  layer.className = `map-layer map-${base} map-${map}`;
  layer.dataset.nopx = ""; // (the pixel look: the grid filter does maps, pxdom.js leaves them)
  document.documentElement.classList.add(...looks); // (map-is-nwk: Nous Within Kenoma's book look; map-is-vellum: The King's Festival's)
  /* a Sandbox game mode's own look over any map (SB_RULES look): changed in G while it plays, so set again on each paint */
  let extra = [];
  const setLook = (s) => {
    if (seriatThemeOn()) return; // (Seriat's window wears its own look, then gives the page's back: the next paint)
    const h = document.documentElement,
      v = s.options.mode === "sandbox" && s.sb && s.sb.rules && s.sb.rules.look,
      want =
        v && v !== "own" && UMAP_UIS.includes(v)
          ? ["map-is-nwk", ...(v !== "nwk" ? ["map-is-" + v] : [])]
          : [];
    if (
      want.join() === extra.join() &&
      want.every((c) => h.classList.contains(c))
    )
      return;
    h.classList.remove(...extra);
    if (want.length) {
      h.classList.remove(...looks.filter((c) => c !== "map-on")); // (the game mode's look wins over the map's)
      h.classList.add(...want);
    } else h.classList.add(...looks);
    extra = want;
  };
  setLook(s);
  const scene = sceneOf(map, layer, s, cur, true);
  // Carnival Night: the tiles' marquee bulbs follow the tiles' size
  const ro =
    map === "carnival"
      ? new ResizeObserver((es) => es.forEach((e) => marquee(e.target)))
      : null;
  return {
    update: (now) => scene.update(now),
    look: setLook,
    board(board) {
      if (!board) {
        cur.cols = null;
        return;
      }
      board.classList.add("map-" + base, "map-" + map);
      cur.cols = board.querySelector(".cols");
      if (ro) {
        ro.disconnect();
        board.querySelectorAll(".cols > .col").forEach((c) => {
          marquee(c);
          ro.observe(c);
        });
      }
    },
    /* the votes are in: fireworks in these colors on Carnival Night, a shower of shooting stars on Starry Night */
    cheer(colors) {
      if (map === "carnival")
        fireworks(
          layer.querySelector(".scene"),
          colors.length ? colors : ["#ff4f6d", "#ffd23f", "#5ce1ff"],
        );
      if (scene.shower) scene.shower();
    },
    destroy() {
      if (ro) ro.disconnect();
      scene.destroy();
      layer.className = "map-layer";
      document.documentElement.classList.remove(...looks, ...extra);
    },
  };
}
const mapLabel = (id) => esc(mapName(id));
