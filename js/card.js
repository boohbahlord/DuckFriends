/* ---------- the player card ----------
   Bigger than Halo's: the duck on the left, the name beside it in its owner's style, small tags (Host, Computer, Ready).
   Its background is a color, a fun pattern over a color (any hat or face item can be a pattern too) laid out the way the
   player picks (tiled, staggered, diagonal, scattered, one big, a band, a border; small to large), or a picture. */
import { duckSVG } from "./duck.js";
import { HATS, hatTile, hatById } from "./hats.js";
import { FACES, faceTile } from "./faces.js";
import { nameHTML } from "./name.js";
import { esc } from "./ui.js";
import { seenDuck, seenName } from "./looks.js";
import { gridPx } from "./pixel.js";
import { applyPalette, PALETTE } from "./pixelpalette.js";
import PXC from "./pxcard.js";

/* sport balls, drawn in their own colors in a 32 × 32 box */
const BALLS = {
  basketball: [
    "Basketball",
    `<circle cx="16" cy="16" r="11" fill="#e8742a" stroke="#1c1c28" stroke-width="1.4"/><path d="M5 16H27M16 5V27M8.5 8.5C12 12 12 20 8.5 23.5M23.5 8.5C20 12 20 20 23.5 23.5" stroke="#1c1c28" stroke-width="1.1" fill="none"/><ellipse cx="12" cy="11" rx="3.5" ry="2" fill="#fff" opacity=".3"/>`,
  ],
  baseball: [
    "Baseball",
    `<circle cx="16" cy="16" r="11" fill="#fbfaf3" stroke="#1c1c28" stroke-width="1.4"/><path d="M9 7.5C12.5 11.5 12.5 20.5 9 24.5M23 7.5C19.5 11.5 19.5 20.5 23 24.5" stroke="#d7263d" stroke-width="1" fill="none"/><path d="M9.6 10.2l2-.8M10.8 13.2l2-.4M11 16.4h2M10.8 19.6l2 .4M9.6 22.4l2 .8M22.4 10.2l-2-.8M21.2 13.2l-2-.4M21 16.4h-2M21.2 19.6l-2 .4M22.4 22.4l-2 .8" stroke="#d7263d" stroke-width=".8"/>`,
  ],
  football: [
    "Football",
    `<g transform="rotate(-30 16 16)"><ellipse cx="16" cy="16" rx="13" ry="8" fill="#8a4a22" stroke="#1c1c28" stroke-width="1.4"/><path d="M6.5 12.5C6 14.5 6 17.5 6.5 19.5M25.5 12.5C26 14.5 26 17.5 25.5 19.5" stroke="#fff" stroke-width="1.4" fill="none"/><path d="M11 16H21M12.5 14.4V17.6M14.5 14.4V17.6M16.5 14.4V17.6M18.5 14.4V17.6" stroke="#fff" stroke-width="1.1"/></g>`,
  ],
  golf: [
    "Golf ball",
    `<circle cx="16" cy="16" r="10" fill="#fdfdfd" stroke="#1c1c28" stroke-width="1.3"/><g fill="#d3d8e2">${[
      [12, 11],
      [16, 10],
      [20, 11],
      [10, 15],
      [14, 14.5],
      [18, 14.5],
      [22, 15],
      [11, 19],
      [15, 18.5],
      [19, 18.5],
      [23, 19],
      [13, 22.5],
      [17, 22.5],
      [21, 22],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`)
      .join(
        "",
      )}</g><ellipse cx="12.5" cy="10.5" rx="3" ry="1.6" fill="#fff" opacity=".9"/>`,
  ],
  soccer: [
    "Soccer ball",
    `<circle cx="16" cy="16" r="11" fill="#fff" stroke="#1c1c28" stroke-width="1.4"/><path d="M16 12l3.8 2.8-1.5 4.5h-4.6l-1.5-4.5z" fill="#1c1c28"/>${[0, 72, 144, 216, 288].map((a) => `<g transform="rotate(${a} 16 16)"><path d="M16 12V8" stroke="#1c1c28" stroke-width=".9"/><path d="M13.6 5.6L16 5L18.4 5.6L17.6 8H14.4Z" fill="#1c1c28"/></g>`).join("")}`,
  ],
};
export const CARD_PATTERNS = [
  ["none", "Plain"],
  ["dots", "Polka dots"],
  ["stripes", "Stripes"],
  ["zigzag", "Zigzag"],
  ["checks", "Checks"],
  ["confetti", "Confetti"],
  ["bubbles", "Bubbles"],
  ["stars", "Stars"],
  ...Object.entries(BALLS).map(([id, [n]]) => [`ball:${id}`, n]),
  ...HATS.map((h) => [`hat:${h.id}`, h.name]),
  ...FACES.map((f) => [`face:${f.id}`, f.name]),
];
/* how the pattern sits on the card: the pattern of the pattern */
export const CARD_LAYOUTS = [
  ["tiled", "Tiled"],
  ["staggered", "Staggered"],
  ["diagonal", "Diagonal"],
  ["scattered", "Scattered"],
  ["big", "One big"],
  ["band", "Band"],
  ["border", "Border"],
];
export const CARD_SIZES = [
  ["s", "Small", 0.7],
  ["m", "Medium", 1],
  ["l", "Large", 1.45],
];

/* one pattern's motif in a 32 × 32 box */
export function motif(kind, col) {
  if (String(kind).startsWith("hat:"))
    return hatTile(kind.slice(4), col === "#ffffff" ? "" : col);
  if (String(kind).startsWith("face:")) return faceTile(kind.slice(5));
  if (String(kind).startsWith("ball:"))
    return (BALLS[kind.slice(5)] || [])[1] || "";
  return (
    {
      dots: `<circle cx="8" cy="8" r="3" fill="${col}"/><circle cx="24" cy="24" r="3" fill="${col}"/>`,
      stripes: `<path d="M-8 40L40 -8M-8 24L24 -8M8 40L40 8" stroke="${col}" stroke-width="5"/>`,
      zigzag: `<path d="M0 20l8-8 8 8 8-8 8 8" stroke="${col}" stroke-width="4" fill="none"/>`,
      checks: `<rect width="16" height="16" fill="${col}"/><rect x="16" y="16" width="16" height="16" fill="${col}"/>`,
      confetti: `<rect x="4" y="5" width="6" height="3" rx="1" fill="#ef3b3b" transform="rotate(30 7 6)"/><rect x="20" y="9" width="6" height="3" rx="1" fill="#2fa4ff" transform="rotate(-20 23 10)"/><rect x="10" y="22" width="6" height="3" rx="1" fill="#37d421" transform="rotate(60 13 23)"/><rect x="24" y="24" width="6" height="3" rx="1" fill="${col}" transform="rotate(10 27 25)"/>`,
      bubbles: `<circle cx="9" cy="10" r="6" fill="none" stroke="${col}" stroke-width="2"/><circle cx="25" cy="24" r="4" fill="none" stroke="${col}" stroke-width="2"/><circle cx="26" cy="7" r="2" fill="${col}"/>`,
      stars: `<path d="M16 6l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="${col}"/>`,
    }[kind] || ""
  );
}
/* a pattern laid out on a card: CSS background layers (without the card's color). Its motifs are pixel files
   (tools/pixel-cards.cjs), laid out on a canvas of the grid's pixels (pixelLayers) */
export function patternLayers(kind, col, layout = "tiled", size = "m", base) {
  return pixelLayers(kind, col, layout, size, base);
}
/* ---------- the patterns in pixels ----------
   The two sheets of motifs (js/pxcard.js: what keeps its colors, and what takes the player's), loaded once; a motif at
   a size is the nearest size made, the player's color put on its tint layer; a layout is drawn on a canvas of the
   grid's pixels, each pixel then whole and in the game's colors (inGameColors), and shown as a pixel picture. Before the sheets are in,
   a card is its color only, marked (--cpat) to get its pattern when they come */
const canSheets = typeof Image !== "undefined";
let SHEETS = [],
  sheetsIn = false;
/* (asked for once a screen past the front one comes up, or a pattern is wanted: the front screen shows none, so it
   doesn't load them. Slimming step 6: the owner's, Nov 20 19:11Z) */
function wantSheets() {
  if (SHEETS.length || !canSheets) return;
  SHEETS = [PXC.fixed, PXC.tint, PXC.base].map((src) => {
    const im = new Image();
    im.src = src;
    return im;
  });
  Promise.all(SHEETS.map((im) => im.decode()))
    .then(() => {
      sheetsIn = true;
      document.querySelectorAll('[style*="--cpat"]').forEach((el) => {
        const [kind, col, layout, size, color] = el.style
          .getPropertyValue("--cpat")
          .replace(/^\s*"|"\s*$/g, "")
          .split("|");
        const pat = pixelLayers(kind, col, layout, size, color);
        if (pat) el.style.background = `${pat}, ${color}`;
        el.style.removeProperty("--cpat");
      });
    })
    .catch(() => {});
}
if (canSheets)
  document.addEventListener("screen", () => {
    if (document.body.dataset.screen !== "front") wantSheets();
  });
const motifs = new Map();
function motifPx(kind, col, want) {
  const i = PXC.kinds.indexOf(kind);
  if (i < 0) return null;
  const s = PXC.sizes.reduce((a, b) =>
      Math.abs(b - want) < Math.abs(a - want) ? b : a,
    ),
    key = kind + "|" + col + "|" + s;
  if (motifs.has(key)) return motifs.get(key);
  const pad = Math.round(s / 4),
    n = s + 2 * pad, // (each made with a quarter of its size round it: tools/pixel-cards.cjs)
    c = document.createElement("canvas");
  c.width = c.height = n;
  c.pad = pad;
  const x = c.getContext("2d", { willReadFrequently: true }),
    y = PXC.rows[s];
  if (PXC.hasFixed[i]) x.drawImage(SHEETS[0], i * n, y, n, n, 0, 0, n, n);
  if (PXC.hasTint[i] && PXC.mix.includes(kind)) {
    /* a hat in the player's color: the hat with its color black, and each pixel's grey says how much of the color it
       takes (white: the hat's own color, as on the duck) */
    const def = hatById(kind.slice(4)),
      own = ((def && def.colors) || []).find(([k]) => k === "c1"),
      t = document.createElement("canvas");
    t.width = t.height = n;
    const tx = t.getContext("2d", { willReadFrequently: true });
    tx.fillStyle = col === "#ffffff" && own ? own[2] : col;
    tx.fillRect(0, 0, 1, 1);
    const [cr, cg, cb] = tx.getImageData(0, 0, 1, 1).data;
    tx.clearRect(0, 0, n, n);
    tx.drawImage(SHEETS[1], i * n, y, n, n, 0, 0, n, n);
    x.drawImage(SHEETS[2], i * n, y, n, n, 0, 0, n, n); // (the hat with its color black)
    const v = tx.getImageData(0, 0, n, n).data,
      img = x.getImageData(0, 0, n, n),
      d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      const m = v[p] / 255;
      d[p] += m * cr;
      d[p + 1] += m * cg;
      d[p + 2] += m * cb;
    }
    x.putImageData(img, 0, 0);
  } else if (PXC.hasTint[i]) {
    const t = document.createElement("canvas");
    t.width = t.height = n;
    const tx = t.getContext("2d");
    tx.drawImage(SHEETS[1], i * n, y, n, n, 0, 0, n, n);
    tx.globalCompositeOperation = "source-in";
    tx.fillStyle = col;
    tx.fillRect(0, 0, n, n); // (the player's color, where the white is)
    x.drawImage(t, 0, 0);
  }
  motifs.set(key, c);
  return c;
}
const tiles = new Map();
function pixelLayers(
  kind,
  col,
  layout = "tiled",
  size = "m",
  base = "#2fa4ff",
) {
  if (!motif(kind, col)) return "";
  if (!sheetsIn) {
    wantSheets();
    return "";
  }
  const k = (CARD_SIZES.find((z) => z[0] === size) || CARD_SIZES[1])[2],
    big = /^(hat|face):/.test(kind),
    g = gridPx() || 2,
    key = [kind, col, layout, size, g, base].join("|");
  if (tiles.has(key)) return tiles.get(key);
  /* the tile: its size in css px, its units across, and its motifs [x, y, turn, scale] in its units */
  const [css, units, list] =
    layout === "staggered"
      ? [
          (big ? 76 : 56) * k,
          64,
          [
            [16, 16],
            [48, 48],
          ],
        ]
      : layout === "diagonal"
        ? [
            60 * k,
            64,
            [
              [32, 32],
              [0, 0],
              [64, 0],
              [0, 64],
              [64, 64],
            ].map(([a, b]) => [a, b, -35]),
          ]
        : layout === "scattered"
          ? [
              120 * k,
              128,
              [
                [20, 22, -20, 0.9],
                [78, 14, 25, 0.7],
                [108, 60, -10, 1.1],
                [50, 70, 40, 0.8],
                [16, 100, 15, 1],
                [88, 108, -35, 0.75],
              ],
            ]
          : layout === "big"
            ? [96, 32, [[16, 16]]]
            : layout === "band"
              ? [26 * k, 32, [[16, 16]]]
              : layout === "border"
                ? [18 * k, 32, [[16, 16]]]
                : big
                  ? [
                      56 * k,
                      56,
                      [
                        [13.2, 13.2, 0, 0.95],
                        [41.2, 41.2, 0, 0.95],
                      ],
                    ]
                  : [32 * k, 32, [[16, 16]]];
  const T = Math.max(2, Math.round(css / g)),
    u = T / units,
    c = document.createElement("canvas");
  c.width = c.height = T;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  /* a layout that turns its motifs shows what they draw past their box (as the drawing's did); the others cut it */
  const whole = ["staggered", "diagonal", "scattered"].includes(layout);
  for (const [mx, my, r = 0, sc = 1] of list) {
    const m = motifPx(kind, col, 32 * sc * u);
    if (!m) continue;
    const p = m.pad,
      s = m.width - 2 * p;
    x.setTransform(
      1,
      0,
      0,
      1,
      Math.round(mx * u - s / 2),
      Math.round(my * u - s / 2),
    );
    if (r) {
      x.translate(s / 2, s / 2);
      x.rotate((r * Math.PI) / 180);
      x.translate(-s / 2, -s / 2); // (turned round its middle, smoothly: inGameColors makes each pixel whole again)
    }
    x.imageSmoothingEnabled = !!r;
    if (whole) x.drawImage(m, -p, -p);
    else x.drawImage(m, p, p, s, s, 0, 0, s, s);
    x.setTransform(1, 0, 0, 1, 0, 0);
  }
  inGameColors(x, T, base);
  const url = `url("${c.toDataURL("image/png")}")`,
    w = T * g + "px";
  const out =
    layout === "big"
      ? `${url} 88% 50%/auto ${Math.round(110 * k)}% no-repeat`
      : layout === "band"
        ? `${url} 0 50%/${w} ${w} repeat-x`
        : layout === "border"
          ? `${url} 0 0/${w} ${w} repeat-x, ${url} 0 100%/${w} ${w} repeat-x`
          : `${url} 0 0/${w} ${w}`;
  tiles.set(key, out);
  return out;
}
/* every pixel the motifs touched, whole and in the game's colors: one they barely touch stays see-through (the card's
   own color shows there, as the player picked it), one they cover more than half of is theirs, and one they cover less
   is the mix of theirs and the card's (as the drawing's edges were) */
const IN_PALETTE = new Set(PALETTE.map((h) => parseInt(h.slice(1, 7), 16)));
function inGameColors(x, T, base) {
  const u = document.createElement("canvas").getContext("2d");
  u.fillStyle = base;
  u.fillRect(0, 0, 1, 1);
  const [r0, g0, b0] = u.getImageData(0, 0, 1, 1).data,
    all = x.getImageData(0, 0, T, T),
    d = all.data,
    o = u.getImageData(0, 0, 1, 1),
    q = o.data;
  for (let p = 0; p < d.length; p += 4) {
    const a = d[p + 3];
    if (a < 64) {
      d[p + 3] = 0;
      continue;
    }
    const m = a > 128 ? 1 : a / 255;
    if (m === 1 && IN_PALETTE.has((d[p] << 16) | (d[p + 1] << 8) | d[p + 2])) {
      d[p + 3] = 255; // (one of the game's colors already: a ball's, a face's)
      continue;
    }
    q[0] = r0 + (d[p] - r0) * m;
    q[1] = g0 + (d[p + 1] - g0) * m;
    q[2] = b0 + (d[p + 2] - b0) * m;
    q[3] = 255;
    applyPalette(o);
    d.set(q, p);
  }
  x.putImageData(all, 0, 0);
}
export function cardBackground(card = {}) {
  if (card.image)
    return `background:url("${card.image}") center/cover, ${card.color || "#2fa4ff"};image-rendering:pixelated`; // (its real pixels, square: customize.js)
  const pat =
    card.pattern && card.pattern !== "none"
      ? patternLayers(
          card.pattern,
          card.patternColor || "#ffffff",
          card.layout,
          card.size,
          card.color || "#2fa4ff",
        )
      : "";
  const waits =
    !pat && card.pattern && card.pattern !== "none" && !sheetsIn && canSheets; // (its pixels not in yet: it gets them when they come)
  return `background:${pat ? `${pat}, ` : ""}${card.color || "#2fa4ff"};image-rendering:pixelated${waits ? `;--cpat:"${[card.pattern, card.patternColor || "#ffffff", card.layout || "tiled", card.size || "m", card.color || "#2fa4ff"].join("|")}"` : ""}`;
}

/* p = a player; o = { host, me, ready, size, net, extra } (net: the connection, shown small beside the tags) */
export function cardHTML(p, o = {}) {
  const tags = [
    o.host ? '<span class="tag host" title="Host">Host</span>' : "",
    p.bot ? '<span class="tag bot">Computer</span>' : "",
    o.me ? '<span class="tag me">You</span>' : "",
    o.net ? `<span class="pcard-net">${o.net}</span>` : "",
  ].join("");
  return `<div class="pcard${o.me ? " mine" : ""}${o.ready ? " ready" : ""}" data-pid="${esc(p.id)}" style="${esc(cardBackground(p.card))}" tabindex="0">
  <div class="pcard-duck">${duckSVG(seenDuck(p), { size: o.size || 58, title: p.name })}</div>
  <div class="pcard-name"><span class="pcard-label">${nameHTML(p.name, seenName(p))}</span>${tags}</div>
  ${o.extra || ""}${o.ready !== undefined ? `<span class="pcard-ready" aria-label="${o.ready ? "Ready" : "Not ready"}">${o.ready ? "✓" : ""}</span>` : ""}
</div>`;
}
