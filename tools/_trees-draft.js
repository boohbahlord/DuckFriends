/* Downpour's trees, second try (drafts for the owner to pick from; not in the game yet). Each returns
   { svg, w, h, foot }: the tree drawn into w × h, its trunk's foot at (w/2, h − foot). Colours from the pixel palette,
   flat bands only, so the pixel look keeps them. I want them about 3 ducks tall, not 5, with one strong silhouette each. */
const O = "#0f0f17"; // (ink)
const n1 = (v) => Math.round(v * 10) / 10;
const rnd = (seed) => () =>
  (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const wrap = (w, h, s, flip) =>
  `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible" aria-hidden="true">${flip ? `<g transform="translate(${w} 0) scale(-1 1)">${s}</g>` : s}</svg>`;

/* the night swamp's colours */
const C = {
  shade: "#162c1f", // (a crown's underside)
  leaf: "#1b4c24", // (its body)
  lit: "#1d7d30", // (the clumps the moon hits)
  rim: "#559075", // (wet leaves catching light: a few)
  moss: "#788b59",
  mossD: "#4d7e59",
  mossHi: "#9eb3a1",
  bark: "#453219",
  barkD: "#381e10",
  barkHi: "#5e3215",
  bone: "#849097", // (a dead tree's bleached wood)
  boneD: "#414d59",
  boneHi: "#9eb3a1",
};

/* a rough blob round (cx, cy): n points, each its own distance out, joined by a smooth closed curve */
function blob(cx, cy, rx, ry, r, rough = 0.2, n = 18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2,
      k = 1 + (r() - 0.5) * 2 * rough;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n],
      p1 = pts[i],
      p2 = pts[(i + 1) % n],
      p3 = pts[(i + 2) % n];
    d += `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}

/* a crown from a few clumps [cx, cy, rx, ry]: one outlined silhouette for all of them, then each clump's body, then
   the moonlight on its top-left, then a few wet glints. Three flat bands, no circles stacked on circles. */
function crown(clumps, r) {
  let ink = "",
    shade = "",
    body = "",
    lit = "",
    glint = "";
  for (const [cx, cy, rx, ry] of clumps) {
    const d = blob(cx, cy, rx, ry, r);
    ink += `<path d="${d}" fill="${O}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`;
    shade += `<path d="${d}" fill="${C.shade}"/>`;
    body += `<path d="${blob(cx - rx * 0.04, cy - ry * 0.14, rx * 0.86, ry * 0.72, r, 0.24)}" fill="${C.leaf}"/>`;
    lit += `<path d="${blob(cx - rx * 0.24, cy - ry * 0.4, rx * 0.46, ry * 0.3, r, 0.3, 12)}" fill="${C.lit}"/>`;
    for (let i = 0; i < 2; i++)
      glint += `<rect x="${n1(cx - rx * 0.55 + r() * rx * 0.6)}" y="${n1(cy - ry * 0.62 + r() * ry * 0.3)}" width="4" height="3" fill="${C.rim}"/>`;
  }
  return ink + shade + body + lit + glint;
}

/* moss hanging from a line (x0 … x1 at y): a fringe of tapered tongues, each its own length (longest in the middle),
   gaps between them, the light down one side of each */
function moss(x0, x1, y, len, r) {
  const k = Math.max(2, Math.round((x1 - x0) / 9)),
    step = (x1 - x0) / k;
  let ink = "",
    fill = "",
    lit = "";
  for (let i = 0; i < k; i++) {
    const x = x0 + step * (i + 0.5) + (r() - 0.5) * 2,
      hw = 3 + r() * 1.6,
      mid = 1 - Math.abs((i + 0.5) / k - 0.5) * 1.1,
      l = len * (0.4 + 0.6 * mid) * (0.65 + r() * 0.5),
      sway = (r() - 0.5) * 6,
      d = `M${n1(x - hw)} ${n1(y)}L${n1(x + hw)} ${n1(y)}L${n1(x + hw * 0.6 + sway * 0.5)} ${n1(y + l * 0.6)}L${n1(x + sway)} ${n1(y + l)}L${n1(x - hw * 0.6 + sway * 0.5)} ${n1(y + l * 0.6)}Z`;
    ink += `<path d="${d}" fill="${O}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    fill += `<path d="${d}" fill="${C.mossD}"/>`;
    lit += `<path d="M${n1(x - hw)} ${n1(y)}L${n1(x - hw * 0.1)} ${n1(y)}L${n1(x + sway * 0.6)} ${n1(y + l * 0.75)}L${n1(x - hw * 0.6 + sway * 0.5)} ${n1(y + l * 0.6)}Z" fill="${C.moss}"/>`;
  }
  return ink + fill + lit;
}

/* a limb: an ink line under a bark line */
const limb = (d, w, col = C.bark) =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shadow = (cx, b, rx) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(b)}" rx="${n1(rx)}" ry="${n1(rx * 0.3)}" fill="#05070a" opacity=".55"/>`;

/* a trunk from its foot (cx, b) up to y top: flared at the foot (flare × its width), a dark side and a lit side */
function trunk(cx, b, top, w0, w1, flare, col = [C.bark, C.barkD, C.barkHi]) {
  const [c, cd, ch] = col,
    m = b - (b - top) * 0.3;
  const d = `M${n1(cx - w0 * flare)} ${b}C${n1(cx - w0)} ${b - 3} ${n1(cx - w0 * 0.8)} ${n1(m + 10)} ${n1(cx - w1)} ${n1(m)}L${n1(cx - w1 * 0.8)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const dr = `M${n1(cx + w0 * 0.15)} ${b}C${n1(cx + w0 * 0.4)} ${n1(m + 10)} ${n1(cx + w1 * 0.2)} ${n1(m)} ${n1(cx + w1 * 0.15)} ${top}H${n1(cx + w1 * 0.8)}L${n1(cx + w1)} ${n1(m)}C${n1(cx + w0 * 0.8)} ${n1(m + 10)} ${n1(cx + w0)} ${b - 3} ${n1(cx + w0 * flare)} ${b}Z`;
  const lt = `M${n1(cx - w0 * 0.75)} ${b - 4}C${n1(cx - w0 * 0.6)} ${n1(m + 8)} ${n1(cx - w1 * 0.6)} ${n1(m)} ${n1(cx - w1 * 0.55)} ${top + 4}`;
  return `<path d="${d}" fill="${O}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><path d="${d}" fill="${c}"/><path d="${dr}" fill="${cd}"/><path d="${lt}" fill="none" stroke="${ch}" stroke-width="4" stroke-linecap="round"/>`;
}
const knee = (x, b, k) =>
  `<path d="M${n1(x - 7 * k)} ${b + 1}Q${n1(x - 3 * k)} ${n1(b - 15 * k)} ${n1(x)} ${n1(b - 16 * k)}Q${n1(x + 3 * k)} ${n1(b - 15 * k)} ${n1(x + 7 * k)} ${b + 1}Z" fill="${C.bark}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${n1(x - 3 * k)} ${n1(b - 8 * k)}L${n1(x - 1)} ${n1(b - 13 * k)}" stroke="${C.barkHi}" stroke-width="3"/>`;

/* A: a bald cypress. Tall and thin, its foot flared wide with knees round it; three flat pads of leaves stepping up
   the trunk, gaps between them; moss under each pad. About 3.5 ducks tall, 2.3 ducks wide. */
export function cypress(seed = 1, flip = false) {
  const r = rnd(seed * 13 + 1),
    w = 150,
    h = 230,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = shadow(cx, b, 50);
  s +=
    knee(cx - 44, b, 0.9) +
    knee(cx + 40, b, 1.1) +
    knee(cx - 28, b + 6, 0.6) +
    knee(cx + 22, b + 7, 0.7);
  s += trunk(cx, b, 26, 15, 6, 2.3);
  const pads = [
    [cx + 6, 34, 44, 15],
    [cx - 14, 80, 60, 18],
    [cx + 14, 126, 54, 17],
  ];
  for (const [x, y] of pads)
    s += limb(
      `M${cx} ${y + 10}Q${n1((cx + x) / 2)} ${y + 6} ${n1(x)} ${y + 2}`,
      4,
    );
  for (const [x, y, rx, ry] of pads)
    s += crown(
      [
        [x - rx * 0.45, y + 2, rx * 0.58, ry],
        [x + rx * 0.4, y + 1, rx * 0.6, ry * 0.95],
        [x, y - ry * 0.25, rx * 0.62, ry * 1.05],
      ],
      r,
    );
  s += crown([[cx + 2, 16, 20, 11]], r); // (the top tuft)
  for (const [x, y, rx, ry] of pads) {
    s += moss(x - rx * 0.7, x - rx * 0.25, y + ry * 0.75, 40 + r() * 18, r);
    s += moss(x + rx * 0.15, x + rx * 0.55, y + ry * 0.7, 30 + r() * 16, r);
  }
  return { svg: wrap(w, h, s, flip), w, h, foot };
}

/* B: a live oak. Short and thick, two great limbs reaching out low on each side; one broad lumpy crown over them;
   moss curtains off its rim and limbs. About 2.8 ducks tall, 3.8 ducks wide: the big one, used sparingly. */
export function oak(seed = 1, flip = false) {
  const r = rnd(seed * 17 + 3),
    w = 244,
    h = 184,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = shadow(cx, b, 80);
  s += crown(
    [
      [cx - 82, 78, 38, 24],
      [cx - 44, 54, 50, 34],
      [cx + 4, 40, 58, 36],
      [cx + 50, 52, 50, 32],
      [cx + 86, 76, 36, 24],
      [cx, 74, 76, 26],
    ],
    r,
  );
  s +=
    limb(`M${cx - 6} 118Q${cx - 50} 104 ${cx - 92} 96`, 10) +
    limb(`M${cx + 6} 112Q${cx + 52} 98 ${cx + 90} 94`, 9);
  s += trunk(cx, b, 92, 22, 15, 1.55);
  s +=
    moss(cx - 106, cx - 70, 92, 58, r) +
    moss(cx - 54, cx - 26, 98, 44, r) +
    moss(cx + 30, cx + 62, 94, 56, r);
  s += moss(cx + 72, cx + 104, 90, 42, r) + moss(cx - 18, cx + 8, 92, 22, r);
  return { svg: wrap(w, h, s, flip), w, h, foot };
}

/* C: a dead snag. Bleached grey against the dark, its top snapped off jagged, two crooked arms; a few strands of moss
   all that's left on it. About 3.2 ducks tall: it never hides anything, so it can stand close to paths. */
export function snag(seed = 1, flip = false) {
  const r = rnd(seed * 19 + 5),
    w = 140,
    h = 210,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = shadow(cx, b, 40);
  s +=
    limb(`M${cx - 6} 104L${cx - 26} 82L${cx - 34} 52`, 8, C.bone) +
    limb(`M${cx - 26} 82L${cx - 46} 76`, 5, C.bone);
  s +=
    limb(`M${cx + 6} 86L${cx + 28} 74L${cx + 44} 78`, 7, C.bone) +
    limb(`M${cx + 28} 74L${cx + 34} 56`, 4, C.bone);
  s += trunk(cx, b, 40, 15, 10, 1.9, [C.bone, C.boneD, C.boneHi]);
  s += `<path d="M${cx - 10} 42L${cx - 7} 22L${cx - 2} 34L${cx + 3} 14L${cx + 6} 30L${cx + 10} 42Z" fill="${C.bone}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`; // (the snapped top)
  s += `<path d="M${cx + 1} 112q-6 8 0 18q6 -10 0 -18Z" fill="${O}"/>`; // (a hollow)
  s +=
    moss(cx - 42, cx - 26, 54, 40, r) +
    moss(cx + 30, cx + 42, 60, 30, r) +
    moss(cx - 8, cx + 8, 44, 22, r);
  return { svg: wrap(w, h, s, flip), w, h, foot };
}

/* D: a weeping willow. A round head on a short trunk, its leaves falling in long tapered drapes nearly to the ground,
   open in front so the trunk shows. About 3 ducks tall, 3 wide: reads as "water's near" at a glance. */
export function willow(seed = 1, flip = false) {
  const r = rnd(seed * 23 + 7),
    w = 200,
    h = 200,
    foot = 14,
    cx = w / 2,
    b = h - foot;
  let s = shadow(cx, b, 66);
  /* a drape: a tongue from the head's rim, narrowing fast, leaning out the further it hangs from the middle; some
     split into two tips at the end */
  const drape = (x, y0, l, hw, col, lean, fork) => {
    const tip = fork
      ? `L${n1(x + lean)} ${n1(y0 + l)}L${n1(x + hw * 0.15 + lean * 0.8)} ${n1(y0 + l * 0.7)}L${n1(x + hw * 0.5 + lean * 0.8)} ${n1(y0 + l * 0.82)}`
      : `L${n1(x + lean)} ${n1(y0 + l)}`;
    const d = `M${n1(x - hw)} ${y0}Q${n1(x - hw)} ${n1(y0 + l * 0.3)} ${n1(x - hw * 0.45 + lean * 0.5)} ${n1(y0 + l * 0.55)}${tip}L${n1(x + hw * 0.5 + lean * 0.5)} ${n1(y0 + l * 0.5)}Q${n1(x + hw)} ${n1(y0 + l * 0.3)} ${n1(x + hw)} ${y0}Z`;
    return [
      `<path d="${d}" fill="${O}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`,
      `<path d="${d}" fill="${col}"/>`,
      `<path d="M${n1(x - hw * 0.5)} ${y0 + 4}L${n1(x - hw * 0.3 + lean * 0.4)} ${n1(y0 + l * 0.42)}" stroke="${C.lit}" stroke-width="4" stroke-linecap="round"/>`,
    ];
  };
  const back = [];
  for (let i = 0; i < 8; i++) {
    const x = cx - 72 + i * 20.5 + (r() - 0.5) * 6;
    back.push(
      drape(
        x,
        58,
        82 + r() * 34,
        12 + r() * 4,
        C.shade,
        (x - cx) * 0.07,
        r() < 0.4,
      ),
    );
  }
  s += back.map((p) => p[0]).join("") + back.map((p) => p[1]).join("");
  s += trunk(cx + 4, b, 70, 13, 8, 1.7);
  /* the front drapes: three a side, none over the trunk, each its own length; a short one in the middle */
  const front = [];
  for (const [x0, l0] of [
    [-80, 62],
    [-62, 92],
    [-36, 74],
    [0, 34],
    [34, 80],
    [60, 98],
    [80, 58],
  ]) {
    const x = cx + x0 + (r() - 0.5) * 8;
    front.push(
      drape(
        x,
        62,
        10 + l0 * (0.8 + r() * 0.35),
        11 + r() * 4,
        C.leaf,
        x0 * 0.1,
        r() < 0.45,
      ),
    );
  }
  s +=
    front.map((p) => p[0]).join("") +
    front.map((p) => p[1]).join("") +
    front.map((p) => p[2]).join("");
  /* the head last, so every drape hangs from under it */
  s += crown(
    [
      [cx - 36, 58, 50, 30],
      [cx + 32, 56, 50, 30],
      [cx, 40, 56, 34],
    ],
    r,
  );
  return { svg: wrap(w, h, s, flip), w, h, foot };
}
