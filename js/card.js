/* ---------- the player card ----------
   Bigger than Halo's: the duck on the left, the name beside it in its owner's style, small tags (Host, Computer, Ready).
   Its background is a color, a fun pattern over a color (any hat or face item can be a pattern too) laid out the way the
   player picks (tiled, staggered, diagonal, scattered, one big, a band, a border; small to large), or a picture. */
import { duckSVG } from "./duck.js";
import { HATS, hatTile } from "./hats.js";
import { FACES, faceTile } from "./faces.js";
import { nameHTML } from "./name.js";
import { esc } from "./ui.js";

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
      [11],
      [10],
      [11],
      [15],
      [14.5],
      [14.5],
      [15],
      [19],
      [18.5],
      [18.5],
      [19],
      [22.5],
      [22.5],
      [22],
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
function motif(kind, col) {
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
const svgURL = (w, h, inner) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`)}")`;
const at = (m, x, y, r = 0, k = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k}) translate(-16 -16)">${m}</g>`;
/* a pattern laid out on a card: CSS background layers (without the card's color) */
export function patternLayers(kind, col, layout = "tiled", size = "m") {
  const m = motif(kind, col);
  if (!m) return "";
  const k = (CARD_SIZES.find((z) => z[0] === size) || CARD_SIZES[1])[2],
    big = /^(hat|face):/.test(kind);
  const px = (n) => `${Math.round(n * k)}px`;
  switch (layout) {
    case "staggered":
      return `${svgURL(64, 64, at(m, 16, 16) + at(m, 48, 48))} 0 0/${px(big ? 76 : 56)} ${px(big ? 76 : 56)}`;
    case "diagonal":
      return `${svgURL(64, 64, at(m, 32, 32, -35) + at(m, 0, 0, -35) + at(m, 64, 0, -35) + at(m, 0, 64, -35) + at(m, 64, 64, -35))} 0 0/${px(60)} ${px(60)}`;
    case "scattered":
      return `${svgURL(
        128,
        128,
        [
          [0.9],
          [0.7],
          [1.1],
          [0.8],
          [1],
          [0.75],
        ]
          .map(([x, y, r, s]) => at(m, x, y, r, s))
          .join(""),
      )} 0 0/${px(120)} ${px(120)}`;
    case "big":
      return `${svgURL(32, 32, m)} 88% 50%/auto ${Math.round(110 * k)}% no-repeat`;
    case "band":
      return `${svgURL(32, 32, m)} 0 50%/${px(26)} ${px(26)} repeat-x`;
    case "border":
      return `${svgURL(32, 32, m)} 0 0/${px(18)} ${px(18)} repeat-x, ${svgURL(32, 32, m)} 0 100%/${px(18)} ${px(18)} repeat-x`;
    default:
      return big
        ? `${svgURL(56, 56, `<g transform="translate(-2 -2) scale(.95)">${m}</g><g transform="translate(26 26) scale(.95)">${m}</g>`)} 0 0/${px(56)} ${px(56)}`
        : `${svgURL(32, 32, m)} 0 0/${px(32)} ${px(32)}`;
  }
}
export function cardBackground(card = {}) {
  if (card.image)
    return `background:url("${card.image}") center/cover, ${card.color || "#2fa4ff"}`;
  const pat =
    card.pattern && card.pattern !== "none"
      ? patternLayers(
          card.pattern,
          card.patternColor || "#ffffff",
          card.layout,
          card.size,
        )
      : "";
  return `background:${pat ? `${pat}, ` : ""}${card.color || "#2fa4ff"}`;
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
  <div class="pcard-duck">${duckSVG(p.duck, { size: o.size || 58, title: p.name })}</div>
  <div class="pcard-name"><span class="pcard-label">${nameHTML(p.name, p.nameStyle)}</span>${tags}</div>
  ${o.extra || ""}${o.ready !== undefined ? `<span class="pcard-ready" aria-label="${o.ready ? "Ready" : "Not ready"}">${o.ready ? "✓" : ""}</span>` : ""}
</div>`;
}
