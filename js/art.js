/* ---------- pictures drawn in code ----------
   The game's symbol (three see-through columns: red, yellow, green), the multicolored letters, the game's art (a duck on a
   cloud with the title across it and the symbol at its top left), the front page's duck in a ball pit, and the page's
   Twister-like shapes. Nothing here is a file, so everything is sharp at any size and changes with the theme. */
import { duckSVG, DUCK_DEFAULT } from "./duck.js";
import { HAT_TOP } from "./hats.js";
import { esc } from "./ui.js";
import { modeOf, modeSymbol } from "./modes.js";
import { PX_PIC } from "./pxpic.js";
import { JUSTIN } from "./hangout/npcart.js";

export const FRIDGE = [
  "#ef3b3b",
  "#ff8c2b",
  "#ffd23f",
  "#37d421",
  "#2fa4ff",
  "#9b5de5",
  "#ff7eb6",
];
export const rnd = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; // the same "random" every time

/* the symbol */
export function symbolSVG(size = 32, title = "Agree or Disagree") {
  return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(title)}">
<rect x="1" y="1" width="8" height="22" rx="1.6" fill="#ED1C24" fill-opacity=".78" stroke="#a5121a" stroke-width="1"/>
<rect x="11" y="1" width="8" height="22" rx="1.6" fill="#FFF200" fill-opacity=".78" stroke="#b8ae00" stroke-width="1"/>
<rect x="21" y="1" width="8" height="22" rx="1.6" fill="#37D421" fill-opacity=".78" stroke="#23931a" stroke-width="1"/></svg>`;
}

/* a die for Random, in the Twister colors: a white die a little turned, its side in shade, five colored pips */
export function diceSVG(size = 32, title = "Random") {
  const pips = [
    [9, 9, "#ED1C24"],
    [21, 9, "#2fa4ff"],
    [15, 15, "#FFF200"],
    [9, 21, "#37D421"],
    [21, 21, "#ff8c2b"],
  ];
  return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" role="img" aria-label="${esc(title)}"><g transform="rotate(-8 16 16)">
<rect x="3.5" y="5" width="25" height="25" rx="5" fill="#1c1c28" fill-opacity=".35"/>
<rect x="2.5" y="2.5" width="25" height="25" rx="5" fill="#f4f1ea" stroke="#1c1c28" stroke-width="1.4"/>
<path d="M5 26.2 Q4 26.2 4 25 V7" stroke="#d9d3c4" stroke-width="2" fill="none" stroke-linecap="round"/>
${pips.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.7" fill="${c}" stroke="#1c1c28" stroke-width=".9"/>`).join("")}</g></svg>`;
}

/* a game mode's symbol */
export const gameSymbol = (mode, size = 32) =>
  modeOf(mode).id === "aod" ? symbolSVG(size) : modeSymbol(mode, size);

/* multicolored letters as HTML: each letter its own fridge-magnet color, a little tilt; on any font */
export function rainbowHTML(
  text,
  { font = "", fk = 1, seed = 7, from = 0 } = {},
) {
  // (from: the color to start on; fk: a player font's scale)
  const r = rnd(seed);
  let i = from;
  const parts = [...String(text)].map((ch) => {
    if (ch === " ") return '<span class="sp"> </span>';
    const c = FRIDGE[i++ % FRIDGE.length],
      t = ((r() - 0.5) * 10).toFixed(1);
    return `<span style="color:${c};transform:rotate(${t}deg)">${esc(ch)}</span>`;
  });
  return `<span class="rainbow"${font ? ` style="font-family:${esc(font)};--fk:${+fk || 1}"` : ""} aria-label="${esc(text)}">${parts.join("")}</span>`;
}

/* the same letters inside an SVG */
function rainbowTSpans(text, seed = 3) {
  const r = rnd(seed);
  let i = 0;
  return [...text]
    .map((ch) =>
      ch === " "
        ? "<tspan> </tspan>"
        : `<tspan fill="${FRIDGE[i++ % FRIDGE.length]}" dy="${((r() - 0.5) * 6).toFixed(1)}">${esc(ch)}</tspan>`,
    )
    .join("");
}

export const cloud = (cx, cy, s, fill = "#ffffff", shade = "#d8ecff") => {
  const puffs = [
    [-60, 6, 34],
    [-28, -16, 40],
    [12, -26, 46],
    [52, -10, 38],
    [78, 10, 28],
    [-82, 18, 22],
    [0, 12, 44],
    [40, 16, 36],
    [-40, 18, 34],
  ];
  const c = (dy, f) =>
    puffs
      .map(
        ([x, y, r]) =>
          `<circle cx="${cx + x * s}" cy="${cy + (y + dy) * s}" r="${r * s}" fill="${f}"/>`,
      )
      .join("");
  return `<g>${c(8, shade)}${c(0, fill)}</g>`;
};

/* a cloud on its own (the start screen's): w wide */
export const cloudSVG = (w = 300) =>
  `<svg viewBox="0 -18 220 144" width="${w}" height="${((w * 144) / 220).toFixed(0)}" aria-hidden="true">${cloud(110, 58, 1)}</svg>`;

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
      rim += `<circle cx="${(cx + Math.cos(b) * R).toFixed(1)}" cy="${(cy + Math.sin(b) * R).toFixed(1)}" r="5" fill="${B[(i + k) % B.length]}"/>`;
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

/* the game's art, which is also the lobby's picture of the chosen map (16 : 9): the map behind (The Board's columns, Sky's
   clouds and sun, Pixel's sunset, islands and forest), the duck sitting on a cloud, the title, the map's name, and the
   game's symbol at the top left */
/* the map's world behind the picture (no columns: the picture shows where the game is played): its pixel file, made
   ahead of time from the map's own drawing (tools/pixel-files.cjs, the drawings in tools/pixel-src/backdrops.js), so
   no drawing of it ships or is drawn behind it (the owner's, Nov 19 23:26Z: "we don't have the leftover image behind.
   It's literally pixels"). A map without one of its own (a made map) shows Night Show's, as before */
export const picURL = (map) =>
  `assets/px/pic/${PX_PIC.includes(map) ? map : "board"}.webp`;
export function artBackdrop(map) {
  return `<image href="${picURL(map)}" width="480" height="270" preserveAspectRatio="xMidYMid slice" style="image-rendering:pixelated"/>`;
}
/* the duck on the lobby's cloud: the plain yellow duck, and 1 time in 20 Justin's duck. Everyone in the room sees the
   same one, because the roll comes from the room's id and the moment it came back to the lobby */
export function lobbyDuck(s) {
  let h = 2166136261;
  for (const c of `${s.id}:${s.at}`)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) % 100 < 5 ? { ...DUCK_DEFAULT, ...JUSTIN } : DUCK_DEFAULT;
}

export function gameArtSVG({
  width = 480,
  duck = DUCK_DEFAULT,
  map = "board",
  mapLabel = "",
  mode = "aod",
} = {}) {
  const top =
      duck && duck.hat && !duck.image && duck.style !== "jack" ? HAT_TOP : 0,
    title = modeOf(mode).name; // room for a hat (Jack in a Box wears none); a long title gets smaller letters, so it fits
  return `<svg class="art" viewBox="0 0 480 270" width="${width}" height="${(width * 9) / 16}" role="img" aria-label="${esc(title)}${mapLabel ? ": " + esc(mapLabel) : ""}">
<defs><clipPath id="artclip"><rect width="480" height="270" rx="18"/></clipPath><linearGradient id="artshade" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
<g clip-path="url(#artclip)">${artBackdrop(map)}</g>
${cloud(250, 200, 1.05)}
<g transform="translate(176 ${(66 - (150 * top) / 120).toFixed(1)})"><svg width="150" height="${((150 * (120 + top)) / 120).toFixed(1)}" viewBox="0 ${-top} 120 ${120 + top}">${duckSVG(duck, { size: 120, shadow: false }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></g>
<text x="240" y="252" text-anchor="middle" font-family="'Lilita One', 'Fredoka', sans-serif" font-size="${Math.min(44, Math.floor(860 / title.length))}" stroke="#1c1c28" stroke-width="${title.length > 20 ? 4 : 5}" stroke-linejoin="round" paint-order="stroke fill">${rainbowTSpans(title)}</text>
<g transform="translate(14 12)"><rect x="-4" y="-4" width="46" height="38" rx="8" fill="#ffffffd0" stroke="#1c1c28" stroke-width="2"/>${gameSymbol(mode, 38).replace("<svg ", '<svg x="0" y="0" ')}</g>
${mapLabel ? `<g transform="translate(466 14)"><rect x="${-(mapLabel.length * 9.4 + 18)}" y="0" width="${mapLabel.length * 9.4 + 18}" height="28" rx="14" fill="#1c1c28d0"/><text x="${-(mapLabel.length * 9.4 + 18) / 2}" y="19.5" text-anchor="middle" font-family="'Fredoka', sans-serif" font-weight="600" font-size="16" fill="#fff">${esc(mapLabel)}</text></g>` : ""}
</svg>`;
}

/* the front page's ball pit: rows of glossy balls across the whole bottom of the page; the back rows go behind the duck,
   the front rows in front of it, so the duck sits in the pit */
export function pitSVG(part = "front") {
  const r = rnd(part === "front" ? 42 : 7),
    out = [],
    W = 1600;
  const rows =
    part === "front"
      ? [
          [120, 30],
          [165, 33],
          [212, 36],
          [262, 38],
        ]
      : [
          [70, 26],
          [96, 28],
        ];
  for (const [y, s0] of rows) {
    const s = s0,
      step = s * 1.75,
      n = Math.ceil(W / step) + 2,
      off = (r() - 0.5) * step;
    for (let i = -1; i < n; i++) {
      const x = i * step + off + (r() - 0.5) * s * 0.5,
        yy = y + (r() - 0.5) * s * 0.4,
        rr = s * (0.92 + r() * 0.16);
      const c = FRIDGE[Math.floor(r() * FRIDGE.length)];
      out.push(
        `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${c}" stroke="#1c1c28" stroke-width="2.4"/>` +
          `<ellipse cx="${(x - rr * 0.35).toFixed(1)}" cy="${(yy - rr * 0.38).toFixed(1)}" rx="${(rr * 0.3).toFixed(1)}" ry="${(rr * 0.18).toFixed(1)}" fill="#fff" opacity=".6" transform="rotate(-30 ${(x - rr * 0.35).toFixed(1)} ${(yy - rr * 0.38).toFixed(1)})"/>`,
      );
    }
  }
  return `<svg class="pit-${part}" viewBox="0 0 ${W} 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${part === "front" ? '<rect x="0" y="190" width="1600" height="200" fill="#1c1c28" opacity=".12"/>' : ""}${out.join("")}</svg>`;
}
export const heroDuckSVG = () =>
  duckSVG(DUCK_DEFAULT, {
    size: 300,
    shadow: false,
    title: "A rubber duck in a ball pit",
  });

/* ---------- the floor's breathing dots on one canvas, drawn off the page's own thread ----------
   As pictures, the 52 rows of dots (each row and color breathing a little after the last) are 52 fading layers that the
   browser blends again every frame, over three screens' worth of pixels: on a computer without a graphics card doing that
   work, the most costly part of the Night Show map. Here each row is drawn once into a small picture, and a worker
   (its own thread) lays the rows onto one canvas the size of the floor about 30 times a second, each at the opacity
   its CSS breath would have at that moment (the same curve, the same timing). Without a worker or OffscreenCanvas
   (an old browser) the pictures stay as they were. */
const FLOOR_WORKER = `
let ctx = null, rows = [], moving = false, light = false, on = false, last = 0;
const bez = (x) => { // cubic-bezier(.42, 0, .58, 1): CSS's ease-in-out
  let t = x;
  for (let i = 0; i < 6; i++) {
    const xt = 3 * (1 - t) * (1 - t) * t * 0.42 + 3 * (1 - t) * t * t * 0.58 + t * t * t,
      dx = 3 * (1 - t) * (1 - t) * 0.42 + 6 * (1 - t) * t * (0.58 - 0.42) + 3 * t * t * (1 - 0.58);
    if (Math.abs(xt - x) < 1e-5 || !dx) break;
    t -= (xt - x) / dx;
  }
  return 3 * (1 - t) * t * t + t * t * t;
};
function draw(now) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const lo = light ? 0.14 : 0.16, hi = light ? 0.5 : 0.78, still = light ? 0.4 : 0.5;
  for (const r of rows) {
    let a = still;
    if (moving) {
      const p = (now / 1000 + r.dl) / 2.2, n = Math.floor(p), f = p - n;
      a = lo + (hi - lo) * bez(n % 2 ? 1 - f : f); // (2.2 s each way, alternate)
    }
    ctx.globalAlpha = a;
    ctx.drawImage(r.bm, r.x || 0, r.y);
  }
}
const tick = (now) => {
  if (!on) return;
  if (now - last >= 32) { last = now; draw(now); }
  if (moving) next();
};
const next = () => (self.requestAnimationFrame ? requestAnimationFrame(tick) : setTimeout(() => tick(performance.now()), 33));
onmessage = (e) => {
  const m = e.data;
  if (m.canvas) { ctx = m.canvas.getContext("2d"); rows = m.rows; }
  if ("moving" in m) { const was = moving && on; moving = m.moving; light = m.light; on = m.on; draw(performance.now()); if (moving && on && !was) next(); }
};`;
let floorURL = null;
export async function floorCanvas(root, g = 0) {
  const baked = g > 0, // (the rows already made into pixels, pxbake.js: drawn as they are, one pixel to a square)
    imgs = [
      ...root.querySelectorAll(
        baked
          ? ":scope > canvas.bd-dots.px-baked[data-y], :scope > img.bd-dots.px-file[data-y]"
          : ":scope > img.bd-dots[data-y]",
      ),
    ];
  if (
    !imgs.length ||
    typeof Worker !== "function" ||
    typeof OffscreenCanvas !== "function" ||
    !HTMLCanvasElement.prototype.transferControlToOffscreen
  )
    return;
  const W = root.clientWidth,
    H = root.clientHeight,
    dpr = Math.min(2, devicePixelRatio || 1),
    rows = imgs.map((im) => {
      const [y0, y1, dl] = im.dataset.y.split(" ").map(Number);
      return { im, y0, y1, dl };
    }),
    top = Math.min(...rows.map((r) => r.y0)),
    bottom = Math.max(...rows.map((r) => r.y1));
  if (!W || !H) return;
  try {
    if (baked) return await floorPixels(root, imgs, rows, g);
    await Promise.all(imgs.map((im) => im.decode()));
    const out = [];
    for (const r of rows) {
      // each row once, at the screen's sharpness, on whole pixels of the floor canvas
      const c = document.createElement("canvas");
      c.width = Math.round(W * dpr);
      c.height = Math.max(1, Math.round((r.y1 - r.y0) * dpr));
      c.getContext("2d").drawImage(r.im, 0, 0, c.width, c.height);
      out.push({
        bm: await createImageBitmap(c),
        y: Math.round((r.y0 - top) * dpr),
        dl: r.dl,
      });
    }
    if (!imgs[0].isConnected) return; // (redrawn meanwhile: a newer floor is on its way)
    const cv = document.createElement("canvas");
    cv.className = "bd-layer bd-floor";
    cv.style.cssText = `top:${top.toFixed(1)}px;height:${(bottom - top).toFixed(1)}px`;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round((bottom - top) * dpr);
    floorURL =
      floorURL ||
      URL.createObjectURL(
        new Blob([FLOOR_WORKER], { type: "text/javascript" }),
      );
    const wk = new Worker(floorURL),
      off = cv.transferControlToOffscreen(),
      html = document.documentElement,
      state = () => ({
        moving: html.classList.contains("moving"),
        light: root.id === "shapes" && !html.classList.contains("dark"),
        on: !document.hidden && cv.isConnected && !!cv.getClientRects().length,
      });
    imgs[0].before(cv);
    for (const im of imgs) im.remove();
    floorRun(root, cv, wk, off, out);
  } catch {} // (anything that fails leaves the pictures as they were)
}
/* the rows made into pixels (pxbake.js): one canvas with a pixel for each grid square, shown sharp */
async function floorPixels(root, cvs, rows, g) {
  /* (a row's place on the grid and its size: a canvas made here, or a pixel file, js/pxmap.js) */
  const file = (c) => c.tagName === "IMG";
  await Promise.all(cvs.filter(file).map((c) => c.decode()));
  for (const c of cvs)
    if (file(c)) {
      c._at = c.dataset.at.split(" ").map(Number);
      c._w = c.naturalWidth;
      c._h = c.naturalHeight;
    } else {
      c._w = c.width;
      c._h = c.height;
    }
  const top = Math.min(...cvs.map((c) => c._at[1])),
    W = Math.max(...cvs.map((c) => c._at[0] + c._w)),
    H = Math.max(...cvs.map((c) => c._at[1] + c._h)) - top,
    out = [];
  for (let k = 0; k < cvs.length; k++) {
    const c = cvs[k];
    out.push({
      bm: await createImageBitmap(c),
      x: c._at[0],
      y: c._at[1] - top,
      dl: rows[k].dl,
    });
  }
  if (!cvs[0].isConnected) return;
  const cv = document.createElement("canvas");
  cv.className = "bd-layer bd-floor px-baked";
  cv.style.cssText = `top:${(top * g).toFixed(3)}px;width:${(W * g).toFixed(3)}px;height:${(H * g).toFixed(3)}px`;
  cv.width = W;
  cv.height = H;
  floorURL =
    floorURL ||
    URL.createObjectURL(new Blob([FLOOR_WORKER], { type: "text/javascript" }));
  const wk = new Worker(floorURL),
    off = cv.transferControlToOffscreen();
  cvs[0].before(cv);
  for (const c of cvs) c.remove();
  floorRun(root, cv, wk, off, out);
}
/* the worker drawing the floor, told when the page's motion setting or theme changes; stopped while hidden, and for
   good once it's gone */
function floorRun(root, cv, wk, off, out) {
  const html = document.documentElement,
    state = () => ({
      moving: html.classList.contains("moving"),
      light: !!root.closest("#shapes") && !html.classList.contains("dark"),
      on: !document.hidden && cv.isConnected && !!cv.getClientRects().length,
    });
  wk.postMessage({ canvas: off, rows: out, ...state() }, [
    off,
    ...out.map((r) => r.bm),
  ]);
  /* the page's motion setting and theme as they change; stopped while hidden, and for good once it's gone */
  let was = JSON.stringify(state());
  const tell = () => {
    const st = state(),
      k = JSON.stringify(st);
    if (k !== was) {
      was = k;
      wk.postMessage(st);
    }
  };
  const mo = new MutationObserver(tell);
  mo.observe(html, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", tell);
  const watch = setInterval(() => {
    if (cv.isConnected) return tell();
    clearInterval(watch);
    mo.disconnect();
    document.removeEventListener("visibilitychange", tell);
    wk.terminate();
  }, 1000);
}
