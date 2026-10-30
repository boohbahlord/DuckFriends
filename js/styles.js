/* ---------- duck styles ----------
   Every style keeps the rubber duck's body and head where they are, so hats, faces, eyes and beaks sit the same on all
   of them; only the colors, the feathers and small things around the head and tail change.
   - Mallard: a drake: green head, white ring, chestnut breast, grey flanks, a black curled tail. Its colors are its own.
   - White call duck: small, round and all white (the orange duck beak suits it). Its colors are its own.
   - Raptor: a feathered velociraptor rubber duck: stripes down the back, a crest of feathers behind the head and a fan
     on the tail (the beak with teeth goes with it). Body, stripes and feathers can be recolored.
   - Eagle: a brown body, a white head that spills ragged onto the neck, a white tail and a heavy brow. Body and head can
     be recolored. (The eagle beak matches it.)
   - Pelican: white, with grey wings tipped black, a pale yellow crown and a little crest. Body and wings can be
     recolored. (The pelican beak matches it.)
   - Blocks: the duck built of square blocks, each with a lit and a shaded edge. Not rubber.
   - 2D shapes: flat shapes with an outline, no shading. Not rubber. */
import { mix } from "./duck.js";

export const STYLES = [
  { id: "rubber", name: "Rubber duck" },
  {
    id: "mallard",
    name: "Mallard",
    fixed: true,
    body: "#bdb8ae",
    head: "#1f6b3a",
    tip: "A mallard drake. Its colors are its own.",
  },
  {
    id: "call",
    name: "White call duck",
    fixed: true,
    body: "#f7f4ec",
    head: "#f7f4ec",
    tip: "A little white call duck. Its colors are its own.",
  },
  {
    id: "raptor",
    name: "Raptor",
    match: "teeth",
    eyes: "raptor",
    colors: [
      ["color", "Raptor body", "#6aa84f"],
      ["color2", "Raptor stripes", "#2f5e2a"],
      ["color3", "Raptor feathers", "#e0662f"],
    ],
    tip: "A feathered velociraptor rubber duck. The beak with teeth and the raptor eye go with it.",
  },
  {
    id: "eagle",
    name: "Eagle",
    match: "eagle",
    eyes: "eagle",
    head2: true,
    colors: [
      ["color", "Eagle body", "#5b3a1e"],
      ["color2", "Eagle head", "#f5f2ea"],
    ],
    tip: "A rubber duck shaped like an eagle. The eagle beak and eye match it.",
  },
  {
    id: "pelican",
    name: "Pelican",
    match: "pelican",
    eyes: "pelican",
    colors: [
      ["color", "Pelican body", "#f2efe8"],
      ["color2", "Pelican wings", "#9aa3b0"],
    ],
    tip: "A rubber duck shaped like a pelican. The pelican beak and eye match it.",
  },
  {
    id: "blocks",
    name: "Blocks",
    flat: true,
    match: "blocks",
    eyes: "block",
    tip: "A duck built of blocks. The block beak and eye match it.",
  },
  {
    id: "geo",
    name: "2D shapes",
    flat: true,
    match: "geo",
    eyes: "flat",
    tip: "A duck of simple flat shapes. The flat beak and eye match it.",
  },
  /* not a duck: only the eyes and these colors show on him (pages), and D.jill makes him Jill */
  {
    id: "jack",
    name: "Jack in a Box",
    box: true,
    pages: ["eyes", "colors"],
    colors: [
      ["color2", "Box", "#232d84"],
      ["color", "Suit", "#ffd23f"],
      ["color3", "Suit 2", "#2b55c9"],
    ],
    tip: "Not a duck: a jack in a box. Only his eyes and colors change.",
  },
];
export const styleById = (id) => STYLES.find((s) => s.id === id) || STYLES[0];
/* the style's name as players see it: Jack in a Box is Jill in a Box when D.jill */
export const styleName = (D) =>
  D && D.style === "jack" && D.jill
    ? "Jill in a Box"
    : styleById(D && D.style).name;
/* a style's color: the look's own, or the style's default */
export const styleColor = (L, st, key) =>
  L[key] || ((st.colors || []).find((c) => c[0] === key) || [])[2] || L.color;

/* ---------- the extra layers of the rubber-like styles ----------
   under: inside the duck's outline, before the shading (nh = the "not the head" mask's id); back: behind the duck;
   over: after the outline, before the beak and the eyes; wing: in place of the wing. */
export function styleLayers(L, st, id, BODY, bt) {
  const nh = ` mask="url(#${id}nh)"`;
  switch (st.id) {
    case "mallard":
      return {
        under: `<path d="M14 50C24 58 34 62 46 62H84C72 67 50 69 30 67C22 64 16 58 14 50Z" fill="#7d7468" opacity=".85"${nh}${bt}/>
        <ellipse cx="93" cy="75" rx="15" ry="17" fill="#6b3a26"${nh}${bt}/><ellipse cx="96" cy="70" rx="6" ry="4" fill="#a0634a" opacity=".6"${nh}${bt}/>
        <path d="M12 49C13 58 18 64 26 67L31 62C24 60 18 56 12 49Z" fill="#1d1d1d"${bt}/>
        <g stroke="#00000022" stroke-width=".8" fill="none"${nh}${bt}><path d="M30 76q3-2 6 0t6 0t6 0M28 84q3-2 6 0t6 0t6 0t6 0M34 92q3-2 6 0t6 0t6 0t6 0"/></g>
        <ellipse cx="70" cy="28" rx="13" ry="7" fill="#6b5bd6" opacity=".25" transform="rotate(-25 70 28)"/>`,
        wing: `<path d="M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z" fill="#8f877c"${bt}/><path d="M43 82L55 79L57 84L45 87Z" fill="#3456c9" stroke="#fff" stroke-width="1"${bt}/>`,
        over: `<path d="M18 54c-7-4-5-12 1-9" stroke="#1d1d1d" stroke-width="2.4" fill="none" stroke-linecap="round"${bt}/>
        <path d="M58 57C66 62.5 84 63.5 93 57" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
      };
    case "call":
      return {
        under: `<ellipse cx="60" cy="98" rx="34" ry="9" fill="#cfc9bb" opacity=".45"${nh}${bt}/>
        <g stroke="#d6d0c2" stroke-width="1.2" fill="none" stroke-linecap="round"${nh}${bt}><path d="M28 72q4 3 8 0M40 84q4 3 8 0M58 92q4 3 8 0M74 74q4 3 8 0M84 86q4 3 8 0M22 84q4 3 8 0"/></g>
        <circle cx="86" cy="48" r="5" fill="#ffd9d0" opacity=".35"/>`,
        wing: `<path d="M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z" fill="#e3ddcf"${bt}/>
        <path d="M44 85q4 3 8 0M53 87q4 3 8 0" stroke="#cfc8b8" stroke-width="1.1" fill="none"${bt}/>`,
      };
    case "raptor": {
      const c2 = styleColor(L, st, "color2"),
        c3 = styleColor(L, st, "color3"),
        e3 = mix(c3, 0, 0.4);
      return {
        back: `<g fill="${c3}" stroke="${e3}" stroke-width="1.4" stroke-linejoin="round"><path d="M58 30C48 22 44 14 46 9C52 13 58 21 61 27Z"/><path d="M57 39C45 35 38 29 37 24C45 26 53 30 59 35Z"/><path d="M65 21C59 13 58 6 61 2C65 7 67 14 67 20Z"/>
          <path d="M15 51C8 45 5 38 6 33C11 36 15 42 17 47Z"/><path d="M14 56C7 55 3 52 2 48C8 48 12 51 15 53Z"/></g>`,
        under: `<g fill="${c2}" opacity=".9"${bt}><path d="M24 59l7 12 4-1-4-12Z"/><path d="M37 61l6 12 4-1-3-11Z"/><path d="M51 60l5 11 4-1-2-10Z"/><path d="M18 64l5 10 3-2-4-9Z"/></g>
          <g fill="${c2}" opacity=".9"><path d="M68 18l4 9 3-1-2-9Z"/><path d="M78 17l2 9 3 0 0-9Z"/><path d="M58 30l7 5 1-3-6-5Z"/></g>
          <ellipse cx="66" cy="99" rx="28" ry="8" fill="${mix(styleColor(L, st, "color"), 255, 0.35)}" opacity=".6"${nh}${bt}/>`,
        over: `<g fill="${c3}" stroke="${e3}" stroke-width="1"${bt}><path d="M45 86C42 89 41 93 42 97C45 94 47 91 47 87Z"/><path d="M53 89C51 92 51 96 52 100C55 96 56 93 56 89Z"/><path d="M62 89C61 92 61 96 63 99C65 95 65 92 64 89Z"/></g>`,
      };
    }
    case "eagle": {
      const c2 = styleColor(L, st, "color2"),
        e2 = mix(c2, 0, 0.3),
        body = styleColor(L, st, "color");
      return {
        under: `<path d="M12 49C11 60 13 72 18 81L29 70C24 64 18 58 12 49Z" fill="${c2}"${bt}/>
          <g stroke="${mix(body, 0, 0.35)}" stroke-width="1.3" fill="none" opacity=".7"${bt}><path d="M44 81q3 4 7 1M52 80q3 4 7 1M60 80q3 4 7 1M48 87q3 4 7 1M57 87q3 4 7 1"/></g>`,
        over: `<path d="M57 57L60 67L64 61L68 69L72 62L77 70L81 62L86 68L90 61L96 64L95 55C85 61 67 61 57 57Z" fill="${c2}" stroke="${e2}" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M76 27C82 23 91 24 97 30C91 30 83 30 77 32Z" fill="${e2}" opacity=".85"/>`,
      };
    }
    case "pelican": {
      const c2 = styleColor(L, st, "color2"),
        body = styleColor(L, st, "color");
      return {
        back: `<path d="M56 35C49 31 47 26 48 22C53 25 56 29 59 32Z" fill="${mix(body, 0, 0.08)}" stroke="${mix(body, 0, 0.4)}" stroke-width="1.2"/>`,
        under: `<ellipse cx="72" cy="24" rx="16" ry="8" fill="#f3dc7a" opacity=".45"/>`,
        wing: `<path d="M40 77C50 70 68 71 76 79C69 90 52 93 41 87C38 84 38 80 40 77Z" fill="${c2}"${bt}/><path d="M41 87C38 84 38 80 40 77L47 79C46 83 45 85 41 87Z" fill="#26262e"${bt}/>
          <path d="M46 80q8-5 20-1" stroke="${mix(c2, 255, 0.35)}" stroke-width="1.4" fill="none"${bt}/>`,
      };
    }
  }
  return {};
}

/* ---------- Blocks: the duck's outline in 6-pixel blocks (h head, b body, w wing) ---------- */
const GRID = [
  "....................",
  "....................",
  "....................",
  "..........hhhhh.....",
  ".........hhhhhhh....",
  ".........hhhhhhh....",
  ".........hhhhhhhh...",
  ".........hhhhhhh....",
  "..b......hhhhhhh....",
  "..bb......hhhhh.....",
  "..bbbbbbbbbbbbbb....",
  "..bbbbbbbbbbbbbb....",
  "...bbbbwwwwwbbbbb...",
  "...bbbwwwwwwbbbbb...",
  "...bbbbwwwwbbbbb....",
  "....bbbbbbbbbbbb....",
  ".....bbbbbbbbbb.....",
  "......bbbbbbb.......",
];
export function blocksBody(color, only = "") {
  // only: draw just the blocks of one kind (the wing, 'w', over a shirt)
  const cells = [];
  GRID.forEach((row, r) =>
    [...row].forEach((c, k) => {
      if (c === "." || (only && c !== only)) return;
      const j = ((k * 7 + r * 13) % 5) / 60; // each block a touch lighter or darker, so they read as blocks even where the seams are too thin to see
      cells.push([
        k * 6,
        r * 6,
        6,
        c === "w"
          ? mix(color, 0, 0.22 + j)
          : mix(color, r < 9 ? 255 : 0, r < 9 ? 0.06 + j : j),
      ]);
    }),
  );
  return blockSquares(cells);
}
/* squares drawn the way the Blocks duck is built ([x, y, size, fill] each): the owner wants very thin seams, a hairline
   of light on the top and left, of shade on the bottom and right, each inside its own block. The block beak and the
   block eye use it too, so every block piece has the same lines. */
export function blockSquares(cells) {
  let out = "",
    seams = "";
  for (const [x, y, w, f] of cells) {
    out += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${f}"/>`;
    seams += `<path d="M${+(x + 0.15).toFixed(2)} ${+(y + w).toFixed(2)}V${+(y + 0.15).toFixed(2)}H${+(x + w).toFixed(2)}" stroke="${mix(f, 255, 0.3)}"/><path d="M${+(x + w - 0.15).toFixed(2)} ${y}V${+(y + w - 0.15).toFixed(2)}H${x}" stroke="${mix(f, 0, 0.3)}"/>`;
  }
  return `<g shape-rendering="crispEdges">${out}</g><g stroke-width=".3" fill="none">${seams}</g>`;
}
/* the body's and the wing's blocks as one outline, so clothes cover the blocks exactly */
export const blocksCloth = () =>
  GRID.map((row, r) =>
    [...row]
      .map((c, k) =>
        c === "b" || c === "w" ? `M${k * 6} ${r * 6}h6v6h-6Z` : "",
      )
      .join(""),
  ).join("");

/* ---------- 2D shapes: a circle for the head, a half disc for the body, a triangle for the tail ---------- */
export const GEO_BODY = "M20 62H100A40 44 0 0 1 20 62ZM14 46L36 64L22 74Z";
/* the flat wing on its own, so a bare arm can show it over a shirt */
export const geoWing = (color) =>
  `<path d="M40 76Q58 66 76 77Q58 90 40 76Z" fill="${mix(color, 0, 0.18)}" stroke="${mix(color, 0, 0.5)}" stroke-width="1.6" stroke-linejoin="round"/>`;
export function geoBody(color) {
  const edge = mix(color, 0, 0.5),
    wing = mix(color, 0, 0.18);
  return `<path d="M14 46L36 64L22 74Z" fill="${color}" stroke="${edge}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M20 62H100A40 44 0 0 1 20 62Z" fill="${color}" stroke="${edge}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M40 76Q58 66 76 77Q58 90 40 76Z" fill="${wing}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>
<circle cx="76" cy="40" r="23" fill="${color}" stroke="${edge}" stroke-width="2.2"/>
<circle cx="68" cy="30" r="5" fill="#fff" opacity=".45"/>`;
}

/* ---------- Jack in a Box (and Jill in a Box) ----------
   Not a duck: a tin box seen from the side (its front, a little of its top and its tail side), the lid open behind for
   good, and Jack out on his spring. His head is where a duck's head is (76, 40, r 23), so the eyes picked under Eyes
   draw on his face, and his red nose is where a beak would be. Only the eyes and three colors change: the suit (the
   duck's own color, so everyone's Jack keeps their color on the board), the box and the suit's other half. Everything
   on the spring sits in <g class="jk">, which bobs on each jump (css/app.css). Dead: X eyes, and he flops over. */
const JRED = "#e3262c",
  SKIN = ["#fffaf2", "#fbe8d6", "#e9c7aa", "#b48d70"];
const star5 = (x, y, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * (i / 5 - 0.5),
      q = i % 2 ? r * 0.45 : r;
    return `${i ? "L" : "M"}${(x + q * Math.cos(a)).toFixed(1)} ${(y + q * Math.sin(a)).toFixed(1)}`;
  }).join("") + "Z";
/* a zigzag ring (the ruff, the cuffs): n points between two ellipses */
const zigzag = (cx, cy, rx, ry, k, n) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n,
      q = i % 2 ? k : 1;
    return `${i ? "L" : "M"}${(cx + rx * q * Math.cos(a)).toFixed(1)} ${(cy + ry * q * Math.sin(a)).toFixed(1)}`;
  }).join("") + "Z";
/* a white glove at (x, y), the thumb up; f = -1 points it left */
const glove = (
  x,
  y,
  f,
) => `<g transform="translate(${x} ${y}) scale(${f} 1)"><path d="M-3 -4.6C2 -6 6.6 -4.6 7.2 -.6C7.6 3.4 4 5.6 -1 5.2C-3.6 5 -4.6 3 -4.4 0C-4.4 -2 -4 -3.8 -3 -4.6Z" fill="#fbfaf6" stroke="#a9a397" stroke-width="1"/>
  <path d="M1.6 -4.8C1.4 -8.2 3.6 -9.6 5 -8.4C6 -7.4 5.4 -5.4 4.6 -4.2" fill="#fbfaf6" stroke="#a9a397" stroke-width="1"/><path d="M3 .6H6M2.6 2.8H5.4" stroke="#c9c3b6" stroke-width=".8" stroke-linecap="round"/></g>`;
const cuff = (x, y, a) =>
  `<path d="${zigzag(0, 0, 3.2, 5.6, 0.55, 7)}" fill="${JRED}" stroke="#9c1418" stroke-width=".7" transform="translate(${x} ${y}) rotate(${a})"/>`;
export function jackSVG(L, st, id, eyes, dead) {
  const suit = styleColor(L, st, "color"),
    box = styleColor(L, st, "color2"),
    suit2 = styleColor(L, st, "color3"),
    jill = !!L.jill;
  const shade = (gid, c) =>
    `<radialGradient id="${gid}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${mix(c, 255, 0.35)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, 0, 0.3)}"/></radialGradient>`;
  const stars = [
    [46, 83, 1.7],
    [58, 80.4, 1.4],
    [71, 84, 1.8],
    [84, 80.4, 1.5],
    [91, 88, 1.6],
    [52, 92, 1.5],
    [65, 96, 1.7],
    [79, 93, 1.4],
    [88, 98.4, 1.3],
    [45, 98.6, 1.3],
    [37, 78, 1.2],
    [36, 91, 1.2],
  ];
  /* the lid: hinged on the box's far top edge, open and leaning back; we see its tin inside */
  const lid = `<path d="M34 68L90 68L81 37L25 37Z" fill="url(#${id}bx)" stroke="${mix(box, 0, 0.55)}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M40.4 64L84.4 64L78 41.4L34 41.4Z" fill="url(#${id}tin)" stroke="${mix(box, 0, 0.5)}" stroke-width=".8"/><path d="M41 61L46 44" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>
<path d="M25 37L81 37" stroke="${JRED}" stroke-width="2.2" stroke-linecap="round"/>`;
  /* the box: front, the tail side and the top, red rims, stars; a crank out of its far side */
  const boxArt = `<path d="M96 90H102.4V97" stroke="#9aa2ad" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="102.6" cy="98.6" r="2.8" fill="${JRED}" stroke="#9c1418" stroke-width=".8"/>
<path d="M40 74L34 68V100L40 106Z" fill="${mix(box, 0, 0.38)}"/>
<rect x="40" y="74" width="56" height="32" fill="url(#${id}bx)"/>
<g fill="#fff">${stars.map(([x, y, r]) => `<path d="${star5(x, y, r)}"${x < 40 ? ' opacity=".7"' : ""}/>`).join("")}</g>
<path d="M40 74H96V77.4H40ZM40 102.6H96V106H40ZM40 74L34 68V71.4L40 77.4ZM40 102.6L34 96.6V100L40 106Z" fill="${JRED}"/>
<path d="M40 74L34 68H90L96 74Z" fill="${mix(JRED, 255, 0.12)}" stroke="#9c1418" stroke-width=".8" stroke-linejoin="round"/>
<ellipse cx="64" cy="71" rx="17" ry="2.3" fill="#1b1430"/>
<path d="M40 74H96V106H40ZM40 74L34 68V100L40 106" fill="none" stroke="${mix(box, 0, 0.6)}" stroke-width="1.4" stroke-linejoin="round"/>`;
  const lip = `<path d="M37 71H93L96 74H40Z" fill="${mix(JRED, 255, 0.12)}"/><path d="M40 74H96" stroke="#9c1418" stroke-width=".8"/>`;
  /* Jack: a body split in his two colors, arms out with white gloves, a red ruff, his face and his cap (Jill: her hair
     and a bow) */
  const torso = "M51 73C51 67 56 63 63 61H86C89 65 86 70 79 73Z";
  const body = `<path d="${torso}" fill="url(#${id}s1)"/><g clip-path="url(#${id}tc)"><path d="M75 55L120 55L120 80L67 80Z" fill="url(#${id}s2)"/></g>
<path d="${torso}" fill="none" stroke="${mix(suit, 0, 0.5)}" stroke-width="1.2"/><circle cx="72" cy="69" r="2.4" fill="${JRED}"/>`;
  const arm1 = `<path d="M63 61C55 59.6 46 60.6 38.6 63.6C36.4 66.6 36.8 71.4 38.6 74.2C46 71.4 54 70 62 69.6Z" fill="url(#${id}s1)" stroke="${mix(suit, 0, 0.5)}" stroke-width="1.1" stroke-linejoin="round"/>
<path d="M54 61.6Q51 66 53 70.4" stroke="${mix(suit, 0, 0.3)}" stroke-width="1" fill="none" opacity=".7"/>${cuff(37.4, 68.6, 18)}${glove(31.4, 70.4, -1)}`;
  const arm2 = `<path d="M84 61.4C91 60.4 98 60.6 104.2 61.6C106.6 64.4 106.6 69 104.8 72C97.6 70 91 69.8 85.6 70Z" fill="url(#${id}s2)" stroke="${mix(suit2, 0, 0.5)}" stroke-width="1.1" stroke-linejoin="round"/>
<path d="M95 61Q97.4 65.4 95.4 70.2" stroke="${mix(suit2, 0, 0.3)}" stroke-width="1" fill="none" opacity=".7"/>${cuff(105.6, 66.8, -12)}${glove(111.4, 67.6, 1)}`;
  /* dead, his arms hang */
  const arms = dead
    ? `<g transform="rotate(-62 62 65)">${arm1}</g><g transform="rotate(32 85 65)">${arm2}</g>`
    : arm1 + arm2;
  const ruff = `<path d="${zigzag(74, 62, 18, 6.2, 0.7, 11)}" fill="${JRED}" stroke="#9c1418" stroke-width=".9" stroke-linejoin="round"/>`;
  const head = `<circle cx="76" cy="40" r="23" fill="url(#${id}sk)" stroke="${SKIN[3]}" stroke-width="2"/>`;
  const cheek = `<circle cx="78.6" cy="48" r="4.4" fill="url(#${id}ch)"/>`;
  const nose = `<circle cx="99.4" cy="41" r="${jill ? 4.6 : 5.4}" fill="url(#${id}ns)" stroke="#8e1015" stroke-width=".8"/>`;
  const mouth = jill
    ? `<path d="M83.6 52.6Q90 58.4 95.6 50.8Q90.4 54.4 83.6 52.6Z" fill="#c8153c" stroke="#8a0d29" stroke-width=".9" stroke-linejoin="round"/>`
    : `<path d="M83.6 53Q90 58.4 95.6 51" stroke="#3b1a14" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  const capLeft = `<path d="M55.4 30C49 22 44 14 36 13C44 9.6 56 12 68 18.6Z" fill="url(#${id}s2)" stroke="${mix(suit2, 0, 0.5)}" stroke-width="1.1" stroke-linejoin="round"/>`;
  const capRight = `<path d="M76.6 17.4C82 8 94 3.6 104.6 11.6C98 11.4 94.6 15.6 94 25.6Z" fill="url(#${id}s1)" stroke="${mix(suit, 0, 0.5)}" stroke-width="1.1" stroke-linejoin="round"/>`;
  const dome = "M53.2 37.4Q76 22.6 96 28.6A23.6 23.6 0 0 0 53.2 37.4Z";
  const cap = jill
    ? ""
    : `${capLeft}${capRight}
<path d="${dome}" fill="url(#${id}s1)"/><g clip-path="url(#${id}dc)"><rect x="40" y="0" width="36" height="40" fill="url(#${id}s2)"/></g>
<path d="${dome}" fill="none" stroke="${mix(suit, 0, 0.5)}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M53.6 37.2Q76 22.4 95.8 28.4" stroke="${mix(suit, 0, 0.35)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>
<circle cx="36.4" cy="13.4" r="4.6" fill="url(#${id}pp)" stroke="#9c1418" stroke-width=".8"/><circle cx="105.4" cy="12.4" r="4.6" fill="url(#${id}pp)" stroke="#9c1418" stroke-width=".8"/>`;
  const hairJack = jill
    ? ""
    : `<g clip-path="url(#${id}hc)"><path d="M50 30C56 32 60 40 60 50C58 56 54 58 50 58Z" fill="#ef8a35"/><path d="M53 38q4 5 3 12M56.6 36q3 6 2 13" stroke="#c4621a" stroke-width=".9" fill="none"/></g>`;
  const HAIR = "#e2742c",
    HAIRD = mix(HAIR, 0, 0.35);
  const hairBack = jill
    ? `<path d="M58 22C44 26 40 42 43 56C44.6 63 41 69 46 73C50 74 53 71 54 67C57 62 60 56 62 48Z" fill="${HAIR}" stroke="${HAIRD}" stroke-width="1.1" stroke-linejoin="round"/>`
    : "";
  const hairFront = jill
    ? `<path d="M52.6 46C50 28 62 15.6 78 16.4C90 17 98 24 98.6 32.4C93 26.6 86 24.2 78 25.4C70 26.4 63 31 60 38C58.4 42 57 46 56 50Z" fill="${HAIR}" stroke="${HAIRD}" stroke-width="1.1" stroke-linejoin="round"/>
<path d="M64 21q6-2 12 0M70 19.6q8-1 14 2" stroke="${mix(HAIR, 255, 0.25)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>`
    : "";
  const bow = jill
    ? `<g stroke="#9c1418" stroke-width=".9" stroke-linejoin="round"><path d="M66 15.6C59 7.6 50.4 9.4 52.4 16.6C54.2 22.6 61 20 66 15.6Z" fill="${JRED}"/><path d="M66 15.6C70 6.2 79.6 5.8 79.4 13C79.2 19.6 71.6 19 66 15.6Z" fill="${JRED}"/>
<path d="M64.4 17L60.6 25.6L64 24.4L66 27.2L67.2 17.6Z" fill="${mix(JRED, 0, 0.15)}"/><circle cx="66" cy="15.8" r="2.8" fill="${mix(JRED, 0, 0.1)}"/></g>`
    : "";
  const lashes = jill
    ? `<path d="M85.6 30.2L88.4 26.8M87.2 31.6L90.6 29.6M83.6 29.4L84.6 25.8" stroke="#161616" stroke-width="1.2" stroke-linecap="round"/>`
    : "";
  const defs = `<defs>${shade(id + "s1", suit)}${shade(id + "s2", suit2)}
<linearGradient id="${id}bx" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${mix(box, 255, 0.14)}"/><stop offset="1" stop-color="${mix(box, 0, 0.22)}"/></linearGradient>
<linearGradient id="${id}tin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f5"/><stop offset=".55" stop-color="#b9c0cb"/><stop offset="1" stop-color="#8d95a3"/></linearGradient>
<radialGradient id="${id}sk" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${SKIN[0]}"/><stop offset=".55" stop-color="${SKIN[1]}"/><stop offset="1" stop-color="${SKIN[2]}"/></radialGradient>
<radialGradient id="${id}ch"><stop offset=".45" stop-color="${JRED}" stop-opacity=".85"/><stop offset="1" stop-color="${JRED}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}ns" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ff6d62"/><stop offset=".55" stop-color="${JRED}"/><stop offset="1" stop-color="#a3151a"/></radialGradient>
<radialGradient id="${id}pp" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ff5c55"/><stop offset=".6" stop-color="${JRED}"/><stop offset="1" stop-color="#a3151a"/></radialGradient>
<clipPath id="${id}tc"><path d="${torso}"/></clipPath><clipPath id="${id}dc"><path d="${dome}"/></clipPath><clipPath id="${id}hc"><circle cx="76" cy="40" r="22"/></clipPath></defs>`;
  const jack = `${hairBack}${body}${arms}${ruff}${head}${hairJack}${cheek}${mouth}${nose}${lashes}${eyes}${hairFront}${cap}${bow}`;
  /* dead, he flops over the front of the box (over its near edge, so that edge isn't drawn over him) */
  return `${defs}${lid}${boxArt}<g class="jk">${dead ? `<g transform="translate(-13 5) rotate(38 64 70)">${jack}</g>` : jack}</g>${dead ? "" : lip}`;
}
