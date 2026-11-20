/* ---------- Nous Within Kenoma: the map in my book site's look (owner, Nov 16) ----------
   "The Ether's crossroads theme should now be renamed Nous Within Kenoma AND it's page background, UI, and look is now
   based on my book's ui in that map and has the background too, AND there are map variations based off of the different
   versions in the sight". The map is the book site's page behind the board: its near black ground and burnt amber
   (css/app.css, html.map-is-nwk), the thin black strings stretched across it, the rare black bars, the faint static
   with its scan lines and now and then a flicker. Its four variations are the looks the site gives some of its parts:
   - Ether's Crossroads: the jester's dungeon from the card game of that name (its torch and candles flickering), kept
     as it was, with the book's strings, bars and static over it (owner, Nov 16: "it is now a variation of Nous within
     Kenoma map AND it will have the effects and ui of Nous within Kenoma WHILE preserving it's background")
   - Architectured: the latest parts' page (The Night Never Ends on): nearly black, and the lone orange street lights
     standing down a road toward a vanishing point, each breathing on its own, one flickering about once a minute
   - Ten: the first four parts (Ten): deep indigo, white letters, a blue haze along the top, no strings
   - Chalice: Chalice of Tears: the page breathes through the seven colors named in the part, 16 s each, and the letters
     and buttons take the light opposite of each
   - the Fool: The Fool and Traveler: black and white
   All of it drawn as pixels: one canvas as big as the pixel look's grid (pixel.js gridPx), shown scaled up and sharp,
   redrawn 15 times a second (the static's own pace); its ground is the page's color under it. */
import { gridPx, pixelOn } from "./pixel.js";

/* each form: [its id, its name, what it is, the map it's a variation of] (maps.js lists them at the bottom) */
export const NWK_VARIANTS = [
  [
    "ec",
    "Nous within Kenoma: Ether's Crossroads",
    "The jester's dungeon of Ether's Crossroads, its torch and candles flickering, under the book's strings and static.",
    "nwk",
  ],
  [
    "nwkarch",
    "Nous within Kenoma: Architectured",
    "The book's latest parts: a nearly black page and lone orange street lights down a road at night.",
    "nwk",
  ],
  [
    "nwkten",
    "Nous within Kenoma: Ten",
    "The book's first four parts: deep indigo with a blue haze and white letters.",
    "nwk",
  ],
  [
    "nwkchalice",
    "Nous within Kenoma: Chalice",
    "Chalice of Tears: the page breathes through seven colors, and the letters take the opposite of each.",
    "nwk",
  ],
  [
    "nwkfool",
    "Nous within Kenoma: the Fool",
    "The Fool and Traveler: the book's page in black and white.",
    "nwk",
  ],
];
export const isNwk = (id) =>
  id === "nwk" || NWK_VARIANTS.some((v) => v[0] === id);

/* how each form looks: its ground, its glow, the strings and bars or not, the static's specks, the street lights */
const LOOK = {
  nwk: {
    ground: "#0e0904",
    glow: "warm",
    strings: true,
    speck: [150, 120, 90],
  },
  ec: {
    ground: "#0b0705",
    dungeon: true,
    strings: true,
    speck: [150, 150, 150],
  },
  nwkarch: {
    ground: "#050302",
    lights: true,
    strings: true,
    speck: [140, 110, 80],
  },
  nwkten: {
    ground: "#0b0a1a",
    glow: "blue",
    strings: false,
    speck: [150, 150, 200],
  },
  nwkchalice: { ground: "", strings: true, speck: [170, 170, 170] },
  nwkfool: { ground: "#000", strings: false, speck: [210, 210, 210] },
};
const lookOf = (id) => LOOK[id] || LOOK.nwk;

/* ---------- Ether's Crossroads' dungeon ----------
   The picture is pixel art at 320 × 180 (shown four times bigger), kept at 16:9 and covering the page. Each flame gets
   a pixel flame of its own over it that shifts between three shapes, and a warm glow that flickers */
const EC_FLAMES = [
  [179, 46.5, 1],
  [205.5, 95.5, 0.45],
  [210.5, 100, 0.45],
  [261.5, 97.5, 0.45],
]; // x, y in the art's pixels; size
const TORCH = [
  // three shapes, each a list of rows: [y, x from, x to, color]
  [
    [0, 3, 3, "o"],
    [1, 3, 4, "o"],
    [2, 2, 4, "o"],
    [3, 2, 5, "m"],
    [4, 1, 5, "m"],
    [5, 1, 6, "m"],
    [6, 1, 6, "c"],
    [7, 1, 6, "c"],
    [8, 1, 6, "m"],
    [9, 2, 5, "m"],
    [10, 2, 5, "o"],
  ],
  [
    [1, 2, 2, "o"],
    [2, 2, 3, "o"],
    [3, 2, 4, "m"],
    [4, 1, 5, "m"],
    [5, 1, 5, "m"],
    [6, 1, 6, "c"],
    [7, 1, 6, "c"],
    [8, 1, 6, "m"],
    [9, 2, 5, "m"],
    [10, 2, 5, "o"],
  ],
  [
    [0, 4, 4, "o"],
    [1, 4, 5, "o"],
    [2, 3, 5, "m"],
    [3, 2, 5, "m"],
    [4, 2, 6, "m"],
    [5, 1, 6, "c"],
    [6, 1, 6, "c"],
    [7, 1, 6, "c"],
    [8, 1, 6, "m"],
    [9, 2, 5, "m"],
    [10, 2, 5, "o"],
  ],
];
const CANDLE = [
  [
    [0, 1, 1, "o"],
    [1, 0, 2, "m"],
    [2, 1, 1, "c"],
  ],
  [
    [0, 0, 0, "o"],
    [1, 0, 2, "m"],
    [2, 1, 1, "c"],
  ],
  [
    [1, 0, 2, "m"],
    [2, 1, 1, "c"],
  ],
];
const FLAME_INK = { o: "#e39a3b", m: "#f2c464", c: "#fff1b8" };
const flameSVG = (frames, w, h) =>
  `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${frames.map((rows, i) => `<g class="ecf ecf${i}">${rows.map(([y, a, b, k]) => `<rect x="${a}" y="${y}" width="${b - a + 1}" height="1" fill="${FLAME_INK[k]}"/>`).join("")}</g>`).join("")}</svg>`;
/* the dungeon: the picture and its flames (css/app.css .ec-stage) */
function dungeonHTML() {
  const flame = ([x, y, k], i) => {
    const torch = k === 1,
      w = torch ? 8 : 3,
      h = torch ? 11 : 3,
      left = torch ? x - 4 : x - 1.5,
      top = torch ? y - 6.5 : y - 1.5;
    return `<i class="ec-glow${torch ? " big" : ""}" style="left:${(x / 3.2).toFixed(2)}%;top:${(y / 1.8).toFixed(2)}%;animation-delay:-${(i * 0.37).toFixed(2)}s"></i>
      <span class="ec-flame" style="left:${(left / 3.2).toFixed(2)}%;top:${(top / 1.8).toFixed(2)}%;width:${(w / 3.2).toFixed(2)}%;height:${(h / 1.8).toFixed(2)}%;--d:${(0.7 + i * 0.13).toFixed(2)}s">${flameSVG(torch ? TORCH : CANDLE, w, h)}</span>`;
  };
  return `<div class="ec-stage"><img src="assets/px/maps/ethers-crossroads.webp" data-pxready data-pxok alt="" draggable="false">${EC_FLAMES.map(flame).join("")}</div>`;
}

/* Chalice of Tears' colors (the book's own, site.css @keyframes chalice): each color, then the dark between it and
   the next; [ground, letters, accent] */
const CHALICE = [
  ["#29171a", "#bcd7fb", "#88baff"],
  ["#0e0b0f", "#dad8b9", "#c3c49e"],
  ["#171b29", "#f8d877", "#ffcf3d"],
  ["#0d0b12", "#e8e877", "#e7e73d"],
  ["#231729", "#d8f877", "#cfff3d"],
  ["#0d0a12", "#e8e084", "#e7d23d"],
  ["#191729", "#f9c991", "#ffa53d"],
  ["#0f0b0e", "#c8d4c5", "#9eba9e"],
  ["#291917", "#96e0f9", "#3dcfff"],
  ["#0e0d0e", "#c9d8de", "#9ebbc6"],
  ["#172329", "#fcd1c4", "#ffa78c"],
  ["#0e100e", "#edd6e0", "#deb0c6"],
  ["#292417", "#dedbfd", "#beb9ff"],
  ["#120d0b", "#cdd9fc", "#a3baff"],
];
const CHALICE_S = 112; // (seconds round all of them: 16 for each color)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) =>
  "#" +
  hex(a)
    .map((v, i) =>
      Math.round(v + (hex(b)[i] - v) * f)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
/* the Chalice's colors t seconds in: [ground, letters, accent], easing from one to the next as the book's page does */
function chaliceAt(t) {
  const n = CHALICE.length,
    u = (((t / CHALICE_S) % 1) + 1) % 1,
    i = Math.floor(u * n),
    f = u * n - i,
    e = 0.5 - 0.5 * Math.cos(f * Math.PI),
    a = CHALICE[i],
    b = CHALICE[(i + 1) % n];
  return [0, 1, 2].map((k) => mix(a[k], b[k], e));
}

/* a small random of my own, so the strings come out the same every time for a seed */
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

/* the strings: thin lines across the page from one edge to another, and a few short cracks, as the book draws them
   (site.js drawStrings); [x0, y0, x1, y1] in shares of the page */
function strings(seed) {
  const R = rng(seed),
    edge = () => {
      const e = Math.floor(R() * 4),
        t = R();
      return e === 0 ? [t, 0] : e === 1 ? [1, t] : e === 2 ? [t, 1] : [0, t];
    },
    out = [];
  for (let k = 0; k < 7; k++) {
    let a = edge(),
      b = edge();
    while (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 0.7) b = edge();
    out.push([...a, ...b]);
  }
  for (let k = 0; k < 3; k++) {
    // (a crack: a few short broken steps)
    let x = 0.1 + R() * 0.8,
      y = 0.1 + R() * 0.8;
    for (let j = 0; j < 4; j++) {
      const a = R() * Math.PI * 2,
        l = 0.03 + R() * 0.05,
        x1 = x + Math.cos(a) * l,
        y1 = y + Math.sin(a) * l;
      out.push([x, y, x1, y1]);
      x = x1;
      y = y1;
    }
  }
  return out;
}

/* the street lights (site.js, No. 36 on): two rows down a road from the left of the page toward a vanishing point on
   the horizon near the right, each light about half the size of the one before it, the far ones fading */
const NEAR = 0.9,
  STEP = 1.9,
  SLOTS = 5,
  ROWS = [
    { y: -0.3, at: [0.5, 1.5, 2.5, 3.5] },
    { y: 0.36, at: [1, 2, 3, 4] },
  ];
function lightsAt(W, H) {
  const vx = W * 0.85,
    vy = H * 0.4,
    F = Math.min(W, H) * 0.28,
    zin = NEAR * 1.25,
    out = [];
  ROWS.forEach((row, ri) =>
    row.at.forEach((u, k) => {
      const z = NEAR * STEP ** u,
        q = zin / z;
      out.push({
        x: vx - (vx - W * 0.02) * q,
        y: vy + row.y * H * q,
        r: Math.min(0.42 * Math.min(W, H), (0.6 * F) / z),
        a: 0.5 * (1 - u / SLOTS) ** 1.4,
        ri,
        k,
      });
    }),
  );
  return out;
}
/* one light in pixels: rings of orange, brightest in the middle, each ring a step dimmer (no soft gradient: the
   pixel look's way of a glow) */
const LIGHT_INK = [
  "255,204,118",
  "255,164,44",
  "230,130,30",
  "206,114,22",
  "160,82,10",
];
function light(g, x, y, r, a) {
  if (a <= 0.01 || r < 0.6) return;
  const steps = [1, 0.75, 0.5, 0.3, 0.16];
  for (let i = 0; i < steps.length; i++) {
    g.fillStyle = `rgba(${LIGHT_INK[Math.min(4, 4 - i)]},${(a * [0.14, 0.16, 0.2, 0.26, 0.34][i]).toFixed(3)})`;
    const rr = Math.max(0.5, r * steps[i]);
    g.beginPath();
    g.arc(Math.round(x), Math.round(y), rr, 0, Math.PI * 2);
    g.fill();
  }
}

/* a line a square at a time (Bresenham), so it stays one sharp pixel thick */
function pxLine(g, x0, y0, x1, y1) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0),
    dy = -Math.abs(y1 - y0),
    sx = x0 < x1 ? 1 : -1,
    sy = y0 < y1 ? 1 : -1;
  let e = dx + dy,
    n = 0;
  while (n++ < 5000) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) {
      e += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      e += dx;
      y0 += sy;
    }
  }
}

/* the static's specks: a few tiles of random specks, made once, laid over the page at random offsets each time */
function speckTiles([r, gr, b]) {
  return [0, 1, 2].map(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const x = c.getContext("2d"),
      img = x.createImageData(96, 96),
      d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.random() < 0.45) continue;
      const v = 0.55 + Math.random() * 0.45;
      d[i] = r * v;
      d[i + 1] = gr * v;
      d[i + 2] = b * v;
      d[i + 3] = Math.random() * 0.16 * 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  });
}

/* the map's scene in its layer: id is the form (ec, nwkarch, nwkten, nwkchalice, nwkfool); page: it's the game's own map
   (the Chalice's colors go to the whole page then), not a small preview */
export function nwkScene(layer, id, page = false) {
  const L = lookOf(id),
    sc = document.createElement("div");
  sc.className = `scene nwk nwk-${id}`;
  if (L.ground) sc.style.background = L.ground;
  const cv = document.createElement("canvas");
  cv.className = "nwk-px";
  cv.setAttribute("aria-hidden", "true");
  if (L.dungeon) sc.innerHTML = dungeonHTML();
  sc.append(cv);
  layer.append(sc);
  layer.classList.add("px-own"); // (drawn as pixels already: the map filter leaves it)
  const g = cv.getContext("2d"),
    html = document.documentElement,
    tiles = speckTiles(L.speck),
    lines = strings((Math.random() * 1e9) >>> 0),
    back = document.createElement("canvas"),
    bg = back.getContext("2d"),
    breath = ROWS.map((row) =>
      row.at.map(() => ({
        p: 5.5 + Math.random() * 6.5,
        o: Math.random() * 6.2832,
        d: 0.09 + Math.random() * 0.07,
        p2: 17 + Math.random() * 14,
        o2: Math.random() * 6.2832,
      })),
    );
  let W = 0,
    H = 0,
    last = 0,
    t0 = 0,
    nextFlash = 0,
    flash = null,
    bar = null,
    nextBar = 0,
    flick = null,
    nextFlick = 0,
    chal = "",
    paged = 0;
  /* the still part (the glow and the strings) on a canvas of its own, made again only when the page changes size */
  const still = () => {
    back.width = W;
    back.height = H;
    bg.clearRect(0, 0, W, H);
    if (L.glow === "warm") {
      // (the book's front page: a warm amber haze from the top left)
      const gr = bg.createRadialGradient(
        W * 0.12,
        H * 0.08,
        0,
        W * 0.12,
        H * 0.08,
        Math.max(W, H) * 0.7,
      );
      gr.addColorStop(0, "rgba(120,62,12,.32)");
      gr.addColorStop(0.45, "rgba(80,40,8,.14)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      bg.fillStyle = gr;
      bg.fillRect(0, 0, W, H);
    } else if (L.glow === "blue") {
      // (Ten: a blue haze along the top of the page)
      const gr = bg.createLinearGradient(0, 0, 0, H * 0.32);
      gr.addColorStop(0, "rgba(60,72,170,.42)");
      gr.addColorStop(1, "rgba(60,72,170,0)");
      bg.fillStyle = gr;
      bg.fillRect(0, 0, W, H * 0.32);
    }
    if (L.strings) {
      bg.fillStyle = "rgba(0,0,0,.9)";
      for (const [a, b, c, d] of lines)
        pxLine(bg, a * (W - 1), b * (H - 1), c * (W - 1), d * (H - 1));
    }
    // (the scan lines: a faint dark row every third one)
    bg.fillStyle = "rgba(0,0,0,.12)";
    for (let y = 2; y < H; y += 3) bg.fillRect(0, y, W, 1);
  };
  const size = () => {
    const gp = pixelOn() ? gridPx() : 2,
      w = Math.max(1, Math.ceil(layer.clientWidth / gp)),
      h = Math.max(1, Math.ceil(layer.clientHeight / gp));
    if (w === W && h === H) return false;
    W = cv.width = w;
    H = cv.height = h;
    cv.style.width = (w * gp).toFixed(1) + "px";
    cv.style.height = (h * gp).toFixed(1) + "px";
    still();
    return true;
  };
  const draw = (now) => {
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, W, H);
    g.drawImage(back, 0, 0);
    if (L.lights) {
      if (t > nextFlick) {
        // (about once a minute, one light flickers)
        if (nextFlick)
          flick = {
            ri: Math.random() < 0.5 ? 0 : 1,
            k: Math.floor(Math.random() * 4),
            at: t,
          };
        nextFlick =
          t + (nextFlick ? 48 + Math.random() * 24 : 35 + Math.random() * 40);
      }
      g.globalCompositeOperation = "lighter";
      for (const o of lightsAt(W, H)) {
        const b = breath[o.ri][o.k],
          br =
            1 +
            b.d *
              (0.75 * Math.sin((t / b.p) * 6.2832 + b.o) +
                0.25 * Math.sin((t / b.p2) * 6.2832 + b.o2));
        let f = 1;
        if (flick && flick.ri === o.ri && flick.k === o.k) {
          const p = (t - flick.at) / 0.9;
          if (p >= 0 && p < 1)
            f = [0.2, 1, 0.35, 0.9, 0.15, 1][Math.floor(p * 6)];
        }
        light(g, o.x, o.y, o.r, o.a * br * f);
      }
      g.globalCompositeOperation = "source-over";
    }
    // (the static: the speck tiles laid over the page, each time at another offset)
    if (!html.classList.contains("low")) {
      const tl = tiles[Math.floor(Math.random() * tiles.length)],
        ox = -Math.floor(Math.random() * 96),
        oy = -Math.floor(Math.random() * 96);
      for (let y = oy; y < H; y += 96)
        for (let x = ox; x < W; x += 96) g.drawImage(tl, x, y);
    }
    // (the rare black bar across the page, behind everything, a blink long)
    if (L.strings) {
      if (now > nextBar) {
        if (nextBar)
          bar = {
            y: Math.floor(Math.random() * H),
            h: 1 + Math.floor(Math.random() * 4),
            till: now + 120 + Math.random() * 160,
          };
        nextBar = now + 7000 + Math.random() * 7000;
      }
      if (bar && now < bar.till) {
        g.fillStyle = "#000";
        g.fillRect(0, bar.y, W, bar.h);
      }
    }
    // (now and then the page flickers a little dark or bright for a blink)
    if (now > nextFlash) {
      if (nextFlash)
        flash = {
          dark: Math.random() < 0.5,
          till: now + 60 + Math.random() * 90,
        };
      nextFlash = now + 5000 + Math.random() * 4000;
    }
    if (flash && now < flash.till) {
      g.fillStyle = flash.dark ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.04)";
      g.fillRect(0, 0, W, H);
    }
  };
  /* the Chalice: its colors now, on the page (the game's own map: the letters and buttons too) or on the preview */
  const chalice = (now) => {
    const [gr, tx, ac] = chaliceAt((now - t0) / 1000),
      k = gr + tx + ac;
    if (k === chal) return;
    chal = k;
    sc.style.background = gr;
    if (page && now - paged > 250) {
      paged = now; // (the letters and buttons: 4 times a second is smooth enough, and the page restyles itself less)
      html.style.setProperty("--ch-ground", gr);
      html.style.setProperty("--ch-text", tx);
      html.style.setProperty("--ch-accent", ac);
    }
  };
  return {
    update(now) {
      if (!t0) t0 = now;
      const grew = size();
      if (!grew && now - last < 66) return; // (15 times a second, the static's pace)
      last = now;
      if (id === "nwkchalice") chalice(now);
      draw(now);
    },
    destroy() {
      sc.remove();
      layer.classList.remove("px-own");
      if (page)
        for (const v of ["--ch-ground", "--ch-text", "--ch-accent"])
          html.style.removeProperty(v);
    },
  };
}
