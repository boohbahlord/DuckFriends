/* ---------- the rubber duck avatar ----------
   One SVG, drawn from a look: a body color with a pattern over it, or a metal (which replaces the color and the pattern),
   or a square picture the player uploaded. The duck has a full round head on a boat-shaped body with its tail up. It is
   lit from the top left: a soft gradient, a darker belly, the head's shadow on the body, and bright highlights, so it reads
   as a little 3D toy. Metals use banded reflections (a bright sky, a dark horizon, a lighter floor) and a shine that
   sweeps across them now and then. A hat (hats.js) adds headroom above the duck's box. A style (styles.js) dresses the
   same body as a mallard, a call duck, a raptor, an eagle or a pelican, or builds it of blocks or flat shapes. */
import { hatLayers, HAT_TOP } from "./hats.js";
import { faceLayer } from "./faces.js";
import { beakSVG } from "./beaks.js";
import { eyesSVG } from "./eyes.js";
import {
  styleById,
  styleColor,
  styleName,
  styleLayers,
  blocksBody,
  blocksCloth,
  geoBody,
  geoWing,
  GEO_BODY,
  jackSVG,
} from "./styles.js";
import { outfitLayers } from "./outfits.js";

export const DUCK_COLORS = [
  ["Classic yellow", "#ffd23f"],
  ["Tangerine", "#ff8c2b"],
  ["Cherry", "#ef3b3b"],
  ["Bubblegum", "#ff7eb6"],
  ["Grape", "#9b5de5"],
  ["Pool blue", "#2fa4ff"],
  ["Teal", "#14c6b4"],
  ["Lime", "#8ee03c"],
  ["Snow", "#f4f4f0"],
  ["Charcoal", "#3b3f4a"],
];
export const DUCK_PATTERNS = [
  ["none", "Plain"],
  ["dots", "Polka dots"],
  ["stripes", "Stripes"],
  ["stars", "Stars"],
  ["hearts", "Hearts"],
  ["checks", "Checks"],
  ["waves", "Waves"],
];
/* the metals, coolest first (the owner's order) */
export const DUCK_METALS = [
  ["none", "No metal"],
  ["rose", "Rose gold"],
  ["gold", "Gold"],
  ["chrome", "Chrome"],
  ["silver", "Silver"],
  ["bronze", "Bronze"],
];
/* each metal: sky (top reflection), light, mid, horizon (the dark band), floor (the lower reflection), edge */
export const METAL = {
  gold: ["#fffdf0", "#ffe47a", "#e8a91c", "#5e3a00", "#ffd24a", "#4a2c00"],
  silver: ["#fdfcf9", "#ebe8e2", "#bdb9b1", "#77736c", "#dcd8d0", "#3e3b37"], // polished silver: softer and warmer than chrome, a satin horizon, not a black one
  bronze: ["#fff0dc", "#f6b97c", "#b8672a", "#3f1d06", "#eb9d55", "#331604"],
  rose: ["#fff6f4", "#ffd3cb", "#d98b80", "#5a2a24", "#f7b8ae", "#40201b"],
  chrome: ["#ffffff", "#f3f8ff", "#8fa2ba", "#0c121a", "#d3deec", "#070b10"],
};
export const DUCK_DEFAULT = {
  color: "#ffd23f",
  pattern: "none",
  patternColor: "#ffffff",
  metal: "none",
  image: null,
  hat: null,
  face: null,
  eyes: "default",
  beak: "default",
  beakColor: "#ff9a1f",
  beakColor2: "#c45f00",
  build: 0,
  size: 0,
  special: null,
  keys: null,
  spc: null,
  style: "rubber",
  outfit: null,
}; // keys: the specials on 1 … 9, 0; spc: their colors
/* the body: build -1 (skinny) … 1 (fat), size -1 … 1 (a little smaller or bigger, ±10%) */
export const BUILDS = [
  [-1, "Skinny"],
  [-0.5, "Slim"],
  [0, "Normal"],
  [0.5, "Fat"],
  [1, "Chubby"],
]; // Chubby is the fattest
export const SIZES = [
  [-1, "Small"],
  [-0.5, "A bit small"],
  [0, "Normal"],
  [0.5, "A bit big"],
  [1, "Big"],
];
const clamp1 = (v) => Math.max(-1, Math.min(1, +v || 0));
/* how much room a duck takes on the board, width and depth (1 = a normal duck) */
export function duckRoom(look = {}) {
  if (look && look.style === "jack") return { x: 1, y: 1 }; // Jack in a Box takes a normal duck's room (his build and size are only stored)
  const k = 1 + 0.1 * clamp1(look.size),
    f = clamp1(look.build);
  return { x: k * (1 + 0.16 * f), y: k * (1 + 0.08 * f) };
}

let uid = 0;
export const mix = (hex, to, t) => {
  // blend a color toward white (to = 255) or black (to = 0)
  const n = parseInt(String(hex).slice(1), 16) || 0,
    c = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
      Math.round(v + (to - v) * t),
    );
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
};
/* a metal's banded reflection (a bright sky, a hard dark horizon, a lighter floor), as a gradient; at: where it runs
   (the body's box by default; a crown gives its own, in its own units) */
export const metalBands = (gid, M, at = 'x1=".15" y1="0" x2=".42" y2="1"') =>
  `<linearGradient id="${gid}" ${at}><stop offset="0" stop-color="${M[0]}"/><stop offset=".2" stop-color="${M[0]}"/><stop offset=".34" stop-color="${M[1]}"/><stop offset=".46" stop-color="${M[2]}"/><stop offset=".5" stop-color="${M[3]}"/><stop offset=".57" stop-color="${M[3]}"/><stop offset=".61" stop-color="${M[2]}"/><stop offset=".72" stop-color="${M[4]}"/><stop offset=".84" stop-color="${M[1]}"/><stop offset="1" stop-color="${M[5]}"/></linearGradient>`;
/* what a metal mirrors over its bands: the shine that sweeps across (id + 's'), the room's streaks (id + 'env') and soft
   spots of light (id + 'spec') */
export const metalGlints = (
  id,
) => `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${id}env" x1="0" y1="0" x2="1" y2="0"><stop offset=".08" stop-color="#fff" stop-opacity="0"/><stop offset=".14" stop-color="#fff" stop-opacity=".55"/><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset=".58" stop-color="#000" stop-opacity="0"/><stop offset=".66" stop-color="#000" stop-opacity=".28"/><stop offset=".74" stop-color="#000" stop-opacity="0"/><stop offset=".86" stop-color="#fff" stop-opacity="0"/><stop offset=".9" stop-color="#fff" stop-opacity=".4"/><stop offset=".95" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}spec" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".35" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

/* the shapes (120 × 120, facing right, standing on y ≈ 106) */
const BODY =
  "M30 62C24 60 18 56 12 49C11 60 13 72 18 81C23 98 40 106 60 106C82 106 98 98 100 82C101 72 96 64 88 60L60 60C48 60 38 62 30 62Z";
const HEAD = { cx: 76, cy: 40, r: 23 };
const WING = "M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z";

/* patterns: big, bold tiles with a thin dark edge so they read on any color */
function patternDef(id, kind, col) {
  const e = 'stroke="#00000033" stroke-width=".8"';
  const P = {
    dots: `<circle cx="9" cy="9" r="4.2" fill="${col}" ${e}/>`,
    stripes: `<rect y="0" width="18" height="6.5" fill="${col}" ${e}/>`,
    stars: `<path d="M9 1.8l2.1 4.5 4.9.6-3.6 3.4 1 4.9L9 12.8l-4.4 2.4 1-4.9L2 6.9l4.9-.6z" fill="${col}" ${e}/>`,
    hearts: `<path d="M9 15.4C3.4 11.6 1.8 8.6 2.8 6c1-2.6 4.6-3 6.2-.4 1.6-2.6 5.2-2.2 6.2.4 1 2.6-.6 5.6-6.2 9.4z" fill="${col}" ${e}/>`,
    checks: `<rect width="9" height="9" fill="${col}"/><rect x="9" y="9" width="9" height="9" fill="${col}"/>`,
    waves: `<path d="M0 11c4.5-6 9 6 18 0" stroke="${col}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
  }[kind];
  return P
    ? `<pattern id="${id}p" width="18" height="18" patternUnits="userSpaceOnUse"${kind === "stripes" ? ' patternTransform="rotate(-28)"' : ""}>${P}</pattern>`
    : "";
}

/* the duck, facing right; o.shadow draws its ground shadow; o.dead draws X eyes; look.hat puts a hat on it */
/* a look from another player is drawn straight into the page: keep only plain words, colors and numbers (no quotes or
   brackets), and the picture (escaped where it is used) */
const PLAIN = /^[#\w .,()%-]{0,60}$/;
function plainLook(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string") {
      if (k === "image" || PLAIN.test(v)) out[k] = v;
    } else if (typeof v === "number") {
      if (isFinite(v)) out[k] = v;
    } else if (typeof v === "boolean" || v === null) out[k] = v;
    else if (
      typeof v === "object" &&
      (k === "hat" || k === "face" || k === "outfit")
    )
      out[k] = plainLook(v);
  }
  return out;
}
/* a jersey's name and number (outfits.js' class jm) would only be a smudge on a small duck: left out under 48 px */
const marks = (OF, size) => {
  if (OF && size < 48)
    OF.cloth = OF.cloth.replace(/<g class="jm">.*?<\/g>/s, "");
  return OF;
};
export function duckSVG(
  look = DUCK_DEFAULT,
  { size = 64, shadow = true, title = "", dead = false, extra = "" } = {},
) {
  const L = { ...DUCK_DEFAULT, ...plainLook(look || {}) },
    id = "dk" + ++uid;
  if (L.style === "jack") {
    // Jack (or Jill) in a Box: not a duck; only the eyes and the colors draw on him, the rest stays stored
    return `<svg class="duck jack" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(title || styleName(L))}">
${shadow ? `<ellipse cx="64" cy="109" rx="38" ry="6.4" fill="#000" opacity=".22"/>` : ""}${jackSVG(L, styleById("jack"), id, eyesSVG(L, dead), dead)}${extra}</svg>`;
  }
  if (L.image) {
    // an uploaded square picture, standing like a card, with the same little shadow
    return `<svg class="duck" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(title || "Avatar")}">
${shadow ? `<ellipse cx="60" cy="110" rx="40" ry="7" fill="#000" opacity=".22"/>` : ""}
<defs><clipPath id="${id}c"><rect x="14" y="10" width="92" height="92" rx="16"/></clipPath>
<linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<image href="${esc(L.image)}" x="14" y="10" width="92" height="92" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}c)"/>
<rect x="14" y="10" width="92" height="92" rx="16" fill="url(#${id}gl)"/>
<rect x="14" y="10" width="92" height="92" rx="16" fill="none" stroke="#00000055" stroke-width="2.4"/>
${dead ? '<path d="M24 20L96 92M96 20L24 92" stroke="#e01b1b" stroke-width="10" stroke-linecap="round" opacity=".9"/>' : ""}${extra}</svg>`;
  }
  const st = styleById(L.style),
    hat = hatLayers(L.hat, L, dead),
    face = faceLayer(L.face, L, dead),
    top = hat.front || face ? HAT_TOP : 0;
  const fat = clamp1(L.build),
    k = 1 + 0.1 * clamp1(L.size),
    eyes = eyesSVG(L, dead);
  const bt = fat
    ? ` transform="translate(60 106) scale(${(1 + 0.16 * fat).toFixed(3)} ${(1 + 0.08 * fat).toFixed(3)}) translate(-60 -106)"`
    : "";
  if (st.flat) {
    // Blocks and 2D shapes: no rubber, no shading, no pattern or metal; an outfit lies flat on the body
    const OF = marks(
        outfitLayers(L.outfit, { base: L.color, edge: mix(L.color, 0, 0.45) }),
        size,
      ),
      blocks = st.id === "blocks";
    /* on Blocks the clothes take the blocks' own outline (the head's blocks stay out of it, so no mask), with the same
       thin seams; on 2D shapes, the half disc's, under the head */
    const cloth =
      OF && OF.cloth
        ? `<defs><clipPath id="${id}fc"><path d="${blocks ? blocksCloth() : GEO_BODY}"/></clipPath><mask id="${id}nh"><rect width="120" height="120" fill="#fff"/><circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="#000"/></mask></defs>
<g${blocks ? "" : ` mask="url(#${id}nh)"`}><g${bt}><g clip-path="url(#${id}fc)">${OF.cloth}${blocks ? `<path d="${Array.from({ length: 20 }, (_, i) => `M0 ${i * 6}H120M${i * 6} 0V120`).join("")}" stroke="#00000038" stroke-width=".3"/>` : ""}</g></g></g>`
        : "";
    return `<svg class="duck flat${top ? " hatted" : ""}" viewBox="0 ${-top} 120 ${120 + top}" width="${size}" height="${((size * (120 + top)) / 120).toFixed(1)}" role="img" aria-label="${esc(title || "Duck")}">
${k !== 1 ? `<g transform="translate(60 108) scale(${k.toFixed(3)}) translate(-60 -108)">` : ""}
${shadow ? `<ellipse cx="58" cy="109" rx="${(44 * (1 + 0.16 * fat)).toFixed(1)}" ry="7" fill="#000" opacity=".22"/>` : ""}
${hat.back}${OF ? OF.back : ""}<g${bt}>${blocks ? blocksBody(L.color) : geoBody(L.color)}</g>${cloth}
${OF && OF.bare ? `<g${bt}>${blocks ? blocksBody(L.color, "w") : geoWing(L.color)}</g>` : ""}
${OF && OF.sleeve ? `<g${bt}>${OF.sleeve}</g>` : ""}${OF && OF.over ? `<g${bt}>${OF.over}</g>` : ""}
${beakSVG(L)}${eyes}${face}${hat.front}${k !== 1 ? "</g>" : ""}${extra}</svg>`;
  }
  const own = !st.fixed,
    M = own && L.metal !== "none" && METAL[L.metal];
  /* the body's and the head's colors (most styles: one color; a mallard or an eagle: a head of its own) */
  const bodyC = st.fixed ? st.body : styleColor(L, st, "color"),
    headC = st.fixed ? st.head : st.head2 ? styleColor(L, st, "color2") : bodyC;
  const tone = (c) =>
    M
      ? { base: M[2], light: M[1], dark: M[5], edge: M[5] }
      : {
          base: c,
          light: mix(c, 255, 0.5),
          dark: mix(c, 0, 0.32),
          edge: mix(c, 0, 0.45),
        };
  const TB = tone(bodyC),
    TH = tone(headC),
    dark = TB.dark,
    edge = TB.edge;
  const pat =
    own && !M && L.pattern !== "none"
      ? patternDef(id, L.pattern, L.patternColor || "#ffffff")
      : "";
  /* fills: a soft ball of light for colors; banded reflections for metals */
  /* a metal mirrors the room: a bright sky, a hard dark horizon, a lighter floor, and dark edges */
  const fill = (gid, cx, cy, T) =>
    M
      ? metalBands(gid, M)
      : `<radialGradient id="${gid}" cx="${cx}" cy="${cy}" r=".8"><stop offset="0" stop-color="${T.light}"/><stop offset=".5" stop-color="${T.base}"/><stop offset="1" stop-color="${T.dark}"/></radialGradient>`;
  /* the body: wider and a little taller when fat (it grows from the ground up), narrower when skinny; the whole duck a
     little bigger or smaller */
  const SL = styleLayers(L, st, id, BODY, bt),
    OF = marks(outfitLayers(L.outfit, TB), size);
  const bare =
    SL.wing ||
    `<path d="${WING}" fill="${M ? M[2] : dark}" opacity="${M ? ".5" : ".32"}"${bt}/>
  <path d="M42 77C51 71 67 72 74 79" stroke="#fff" stroke-width="1.6" fill="none" opacity=".45"${bt}/>`;
  /* an outfit: its sleeve takes the wing's place (a tank top's trim goes over the bare wing); a bare arm I paint solid in
     the body's own color first, so the see-through shade doesn't turn grey over the shirt */
  const solid = SL.wing ? "" : `<path d="${WING}" fill="url(#${id}b)"${bt}/>`;
  const wing =
    OF && OF.sleeve !== null
      ? (OF.bare ? solid + bare : "") + `<g${bt}>${OF.sleeve}</g>`
      : bare;
  /* cloth gets no white shine spots: the body's highlights stay only where it is bare (no cloth, or jeans alone), and a
     metal mirrors the room only off the cloth (a mask: everything but the cloth, the head and a bare arm) */
  const clothed = !!(OF && OF.cloth),
    spots = !clothed || OF.low;
  const offCloth =
    M && clothed
      ? `<filter id="${id}blk"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter>
<mask id="${id}nc" maskUnits="userSpaceOnUse" x="-20" y="-40" width="160" height="180"><rect x="-20" y="-40" width="160" height="180" fill="#fff"/><g filter="url(#${id}blk)"><g${bt}>${OF.cloth}</g></g><circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="#fff"/>${OF.sleeve === null || OF.bare ? `<path d="${WING}" fill="#fff"${bt}/>` : ""}</mask>`
      : "";
  return `<svg class="duck${M ? " metal" : ""}${top ? " hatted" : ""}" viewBox="0 ${-top} 120 ${120 + top}" width="${size}" height="${((size * (120 + top)) / 120).toFixed(1)}" role="img" aria-label="${esc(title || "Rubber duck")}">
<defs>
${fill(id + "b", ".36", ".28", TB)}${fill(id + "h", ".34", ".28", TH)}
<linearGradient id="${id}ao" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${M ? ".25" : ".28"}"/></linearGradient>
${pat}${offCloth}
<clipPath id="${id}c"><path d="${BODY}"${bt}/><circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}"/></clipPath>
<mask id="${id}nh"><rect width="120" height="120" fill="#fff"/><circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="#000"/></mask>
${M ? metalGlints(id) : ""}
</defs>
${k !== 1 ? `<g transform="translate(60 108) scale(${k.toFixed(3)}) translate(-60 -108)">` : ""}
${shadow ? `<ellipse cx="58" cy="109" rx="${(44 * (1 + 0.16 * fat)).toFixed(1)}" ry="7" fill="#000" opacity=".22"/>` : ""}
${hat.back}${SL.back || ""}${OF ? OF.back : ""}
<path d="${BODY}" fill="url(#${id}b)"${bt}/>
<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="url(#${id}h)"/>
<g clip-path="url(#${id}c)">
  ${pat ? `<rect x="0" y="0" width="120" height="120" fill="url(#${id}p)" opacity=".92"/>` : ""}
  ${SL.under || ""}
  ${OF && OF.cloth ? `<g mask="url(#${id}nh)"><g${bt}>${OF.cloth}</g></g>` : ""}
  <path d="${BODY}" fill="url(#${id}ao)"${bt}/>
  <ellipse cx="74" cy="63" rx="21" ry="5.5" fill="#000" opacity=".2" mask="url(#${id}nh)"/>
  ${wing}
  ${
    M
      ? `<g${offCloth ? ` mask="url(#${id}nc)"` : ""}><rect x="0" y="0" width="120" height="120" fill="url(#${id}env)"/>
  <ellipse cx="64" cy="24" rx="13" ry="7" fill="url(#${id}spec)" transform="rotate(-25 64 24)"/><ellipse cx="34" cy="70" rx="17" ry="7" fill="url(#${id}spec)" transform="rotate(-14 34 70)"/>
  <path d="M22 88C34 101 56 104 78 100" stroke="${M[0]}" stroke-width="2.4" fill="none" opacity=".85" stroke-linecap="round"/>
  <g class="shine"><rect x="-60" y="-10" width="34" height="140" fill="url(#${id}s)" transform="rotate(18 60 60)"/></g></g>`
      : ""
  }
</g>
<path d="${BODY}" fill="none" stroke="${OF && OF.cloth ? "#1c1c28a8" : edge}" stroke-width="2.2" stroke-linejoin="round" mask="url(#${id}nh)"${bt}/>
<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="none" stroke="${TH.edge}" stroke-width="2.2"/>
<ellipse cx="68" cy="28" rx="8" ry="4.6" fill="#fff" opacity="${M ? ".9" : ".6"}" transform="rotate(-25 68 28)"/>
<circle cx="88" cy="47" r="2.2" fill="#fff" opacity="${M ? ".6" : ".3"}"/>
${
  spots
    ? `<g${bt}><ellipse cx="38" cy="73" rx="11" ry="5" fill="#fff" opacity="${M ? ".75" : ".38"}" transform="rotate(-14 38 73)"/>
<ellipse cx="17" cy="56" rx="2.6" ry="5" fill="#fff" opacity="${M ? ".6" : ".3"}" transform="rotate(-30 17 56)"/></g>`
    : ""
}
${SL.over || ""}
${OF && OF.over ? `<g${bt}>${OF.over}</g>` : ""}
${beakSVG(L)}
${eyes}
${face}
${hat.front}
${k !== 1 ? "</g>" : ""}
${extra}
</svg>`;
}

/* a square picture from the player's files, cut to its middle and made small enough to send to others */
export function pictureToSquare(file, px = 128) {
  return new Promise((ok, bad) => {
    if (!file || !/^image\//.test(file.type)) {
      bad(new Error("That file is not a picture."));
      return;
    }
    const img = new Image(),
      url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height),
        c = document.createElement("canvas");
      c.width = c.height = px;
      c.getContext("2d").drawImage(
        img,
        (img.width - s) / 2,
        (img.height - s) / 2,
        s,
        s,
        0,
        0,
        px,
        px,
      );
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      bad(new Error("That picture could not be read."));
    };
    img.src = url;
  });
}
