/* ---------- the collage map (a working id: the owner names it later) ----------
   A map very much in the likeness of the owner's Sheltering Sky picture, drawn once on a canvas whenever the page
   changes size (a slice at a time, so the game never stutters), with a few things alive on top:
   - top left, a yellow-green sky like a fractal, cracked by glowing red veins, with dark blue rings over it;
   - a band of green swirls across the middle left, and a blue chain-link net over the left side, beaded with cyan;
   - a huge black tree on the right: its trunk from the bottom, its branches spreading, and patches of the swirls and
     speckles showing through the leaves;
   - a rubber duck in yellow halftone at the bottom left, looking up at the tree, on halftone ground that fades to black;
   - red halftone clouds around the leaves;
   - see-through blue, cyan and purple squares on a grid that slowly blink, and small shaded hexagons that twinkle.
   Everyone sees the same picture (a fixed seed). "Black and white" (options.mapGrey) turns it all into greys. */

const SEED = 20261103;
const rng = (k) => () => (k = (k * 16807) % 2147483647) / 2147483647;

/* ---------- the textures, drawn once into small tiles ---------- */
/* swirls: spirals of light green on a dark green, with speckles, like the band and the patches in the leaves */
function swirlTile(R, S) {
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#123b26";
  g.fillRect(0, 0, S, S);
  const spiral = (cx, cy, r, turns, col, w) => {
    g.beginPath();
    for (let i = 0; i <= 90; i++) {
      const t = i / 90,
        a = t * turns * Math.PI * 2,
        rr = r * t;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.strokeStyle = col;
    g.lineWidth = w;
    g.stroke();
  };
  for (let i = 0; i < 9; i++) {
    const x = R() * S,
      y = R() * S,
      r = S * (0.12 + R() * 0.12),
      col = ["#6fae3f", "#9cc94a", "#3f8a3a", "#c9d86a"][i % 4];
    for (const dx of [-S, 0, S])
      for (const dy of [-S, 0, S])
        spiral(x + dx, y + dy, r, 2.2, col, S * 0.028);
  }
  /* speckles: grains of pale yellow, white and dark */
  const n = S * S * 0.06;
  for (let i = 0; i < n; i++) {
    const v = R();
    g.fillStyle =
      v < 0.45
        ? "#e8efb0"
        : v < 0.7
          ? "#ffffff"
          : v < 0.85
            ? "#0a1a10"
            : "#7fd0c0";
    g.globalAlpha = 0.35 + R() * 0.6;
    g.fillRect(R() * S, R() * S, 1 + (R() < 0.2), 1 + (R() < 0.2));
  }
  g.globalAlpha = 1;
  return c;
}
/* grain: a see-through tile of fine dark and light grains (over the sky) */
function grainTile(R, S) {
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  for (let i = 0; i < S * S * 0.22; i++) {
    const v = R();
    g.fillStyle = v < 0.6 ? "#1a2a08" : v < 0.85 ? "#fffbe0" : "#3040ff";
    g.globalAlpha = 0.25 + R() * 0.45;
    g.fillRect(R() * S, R() * S, 1, 1);
  }
  return c;
}

/* ---------- the drawing ---------- */
/* a tapered limb along a curve, from width w0 to w1 */
function limb(g, p0, p1, p2, w0, w1) {
  const N = 24,
    L = [],
    Rr = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N,
      x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
      y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
      dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
      dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
      d = Math.hypot(dx, dy) || 1,
      w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - (dy / d) * w, y + (dx / d) * w]);
    Rr.push([x + (dy / d) * w, y - (dx / d) * w]);
  }
  g.beginPath();
  L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  Rr.reverse().forEach(([x, y]) => g.lineTo(x, y));
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(p2[0], p2[1], w1 / 2, 0, Math.PI * 2);
  g.fill();
}
/* a lumpy blob of circles (leaves, light through them) */
function blob(g, R, x, y, r, n = 7) {
  g.beginPath();
  g.moveTo(x + r * 0.7, y);
  g.arc(x, y, r * 0.7, 0, Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2,
      d = r * (0.3 + R() * 0.55),
      cx = x + Math.cos(a) * d,
      cy = y + Math.sin(a) * d,
      rr = r * (0.28 + R() * 0.32);
    g.moveTo(cx + rr, cy);
    g.arc(cx, cy, rr, 0, Math.PI * 2);
  }
  g.fill();
}

/* the duck's outline (duck.js' shapes), looking up: a body, a head lifted back, and the beak to the sky */
const DUCK_BODY = new Path2D(
  "M30 62C24 60 18 56 12 49C11 60 13 72 18 81C23 98 40 106 60 106C82 106 98 98 100 82C101 72 96 64 88 60L60 60C48 60 38 62 30 62Z",
);
function duckMask(W, H, at) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.translate(at.x, at.y);
  g.scale(at.k, at.k);
  g.fillStyle = "#000";
  g.fill(DUCK_BODY);
  /* the neck and the head, tipped back */
  g.beginPath();
  g.moveTo(58, 66);
  g.quadraticCurveTo(60, 40, 74, 30);
  g.lineTo(96, 42);
  g.quadraticCurveTo(92, 58, 92, 66);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(80, 30, 23, 0, Math.PI * 2);
  g.fill();
  /* the beak, pointing up and ahead */
  g.beginPath();
  g.moveTo(88, 12);
  g.quadraticCurveTo(102, -6, 116, -4);
  g.quadraticCurveTo(114, 8, 100, 22);
  g.closePath();
  g.fill();
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

/* red (or any) halftone: dots on a grid that swell where w(x, y) is big (0 to 1) */
function halftone(g, x0, y0, x1, y1, step, col, w, off = 0) {
  g.fillStyle = col;
  g.beginPath();
  for (let y = y0; y < y1; y += step) {
    const ox = (Math.round(y / step) % 2) * step * 0.5 + off;
    for (let x = x0; x < x1; x += step) {
      const v = w(x + ox, y);
      if (v <= 0.08) continue;
      const r = step * 0.56 * Math.min(1, v);
      g.moveTo(x + ox + r, y);
      g.arc(x + ox, y, r, 0, Math.PI * 2);
    }
  }
  g.fill();
}

function* drawCollage(cv, W, H, grey) {
  const R = rng(SEED),
    g = cv.getContext("2d"),
    u = Math.min(W, H),
    tall = H > W;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  const swirl = g.createPattern(swirlTile(rng(SEED + 1), 160), "repeat"),
    grain = g.createPattern(grainTile(rng(SEED + 2), 128), "repeat");
  yield;

  /* the sky: a lumpy yellow-green field in the top left, grainy, with glowing red veins */
  const sx = W * (tall ? 0.12 : 0.1),
    sy = H * (tall ? 0.1 : 0.12),
    sr = u * (tall ? 0.62 : 0.6);
  const skyPath = new Path2D();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      d = sr * (0.5 + R() * 0.3),
      rr = sr * (0.2 + R() * 0.16),
      cx = sx + Math.cos(a) * d,
      cy = sy + Math.sin(a) * d;
    skyPath.moveTo(cx + rr, cy);
    skyPath.arc(cx, cy, rr, 0, Math.PI * 2);
  }
  skyPath.moveTo(sx + sr * 0.62, sy);
  skyPath.arc(sx, sy, sr * 0.62, 0, Math.PI * 2);
  g.save();
  g.clip(skyPath);
  const sky = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
  sky.addColorStop(0, "#f3ef6a");
  sky.addColorStop(0.5, "#dfe35e");
  sky.addColorStop(0.78, "#9cc94a");
  sky.addColorStop(1, "#2f6e33");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.fillStyle = grain;
  g.fillRect(0, 0, W, H);
  /* where the veins gather, a mottled red */
  const rx = sx + sr * 0.42,
    ry = sy - sr * 0.05;
  halftone(
    g,
    rx - sr * 0.4,
    ry - sr * 0.5,
    rx + sr * 0.4,
    ry + sr * 0.3,
    u * 0.008,
    "#d81c14",
    (x, y) =>
      (1 - Math.hypot((x - rx) / (sr * 0.38), (y - ry) / (sr * 0.42))) *
      1.6 *
      (0.6 + 0.4 * Math.sin(x * 0.07) * Math.sin(y * 0.05)),
  );
  const vein = (x, y, a, len, w, depth) => {
    if (depth > 6 || w < 0.5) return;
    let px = x,
      py = y;
    g.beginPath();
    g.moveTo(px, py);
    for (let i = 0; i < 6; i++) {
      a += (R() - 0.5) * 0.9;
      px += (Math.cos(a) * len) / 6;
      py += (Math.sin(a) * len) / 6;
      g.lineTo(px, py);
    }
    g.lineWidth = w;
    g.stroke();
    const kids = 1 + (R() < 0.6);
    for (let k = 0; k < kids; k++)
      vein(
        px,
        py,
        a + (R() - 0.5) * 1.4,
        len * (0.55 + R() * 0.25),
        w * 0.62,
        depth + 1,
      );
  };
  g.strokeStyle = "#e3261c";
  g.lineCap = "round";
  g.lineJoin = "round";
  g.shadowColor = "#ff3a1a";
  g.shadowBlur = u * 0.01;
  for (let i = 0; i < 3; i++)
    vein(
      rx + (R() - 0.5) * sr * 0.3,
      ry - sr * 0.15,
      Math.PI * (0.4 + R() * 0.3),
      sr * 0.3,
      u * 0.011,
      0,
    );
  g.shadowBlur = 0;
  g.restore();
  /* its edge glows a little, green into the black */
  g.save();
  g.strokeStyle = "#2f6e3380";
  g.lineWidth = u * 0.012;
  g.filter = `blur(${(u * 0.01).toFixed(0)}px)`;
  g.stroke(skyPath);
  g.restore();
  yield;

  /* the band of swirls: an arc around the sky's lower edge */
  const br0 = sr * 0.95,
    br1 = sr * 1.32;
  g.save();
  g.beginPath();
  g.arc(sx, sy, br1, -0.15, Math.PI * 0.62);
  g.arc(sx, sy, br0, Math.PI * 0.62, -0.15, true);
  g.closePath();
  g.clip();
  g.fillStyle = swirl;
  g.fillRect(0, 0, W, H);
  const fade = g.createRadialGradient(sx, sy, br0, sx, sy, br1);
  fade.addColorStop(0, "#000b");
  fade.addColorStop(0.3, "#0000");
  fade.addColorStop(0.75, "#0000");
  fade.addColorStop(1, "#000c");
  g.fillStyle = fade;
  g.fillRect(0, 0, W, H);
  g.restore();
  yield;

  /* dark blue rings, over the sky and the band */
  g.strokeStyle = "#1b2aa8";
  for (let i = 0; i < 8; i++) {
    const cx = sx + (R() - 0.2) * sr * 0.8,
      cy = sy + (R() - 0.1) * sr * 0.9,
      r = sr * (0.2 + R() * 0.45);
    g.lineWidth = 1 + R() * 1.6;
    g.globalAlpha = 0.45 + R() * 0.4;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.globalAlpha = 1;

  /* the night behind the tree: fine pale grains over the right side, so its black shows against them */
  g.save();
  g.fillStyle = grain;
  g.globalAlpha = 0.9;
  g.fillRect(W * 0.35, 0, W * 0.65, H);
  g.translate(37, 61);
  g.globalAlpha = 0.6;
  g.fillRect(W * 0.35 - 37, -61, W * 0.65, H);
  g.restore();
  /* specks of dark sky behind the tree: pale, bluish grains in clumps, and swirl patches the leaves will cut */
  g.save();
  for (let i = 0; i < 34; i++) {
    const x = W * (0.42 + R() * 0.6),
      y = H * (0.02 + R() * 0.7),
      r = u * (0.02 + R() * 0.05);
    g.globalAlpha = 0.55 + R() * 0.4;
    g.fillStyle = R() < 0.55 ? swirl : grain;
    blob(g, R, x, y, r, 6);
  }
  g.restore();
  yield;

  /* red halftone clouds around the tree, and the ground: yellow on red at the bottom left, thinning to red dots */
  const fx = W * (tall ? 0.6 : 0.66),
    fy = H * (tall ? 0.6 : 0.5),
    gy = H * (tall ? 0.78 : 0.76);
  const clouds = [
    [fx - u * 0.18, fy - u * 0.12, u * 0.2],
    [fx + u * 0.05, fy + u * 0.16, u * 0.14],
    [W * 0.96, gy, u * 0.2],
    [W * (tall ? 0.6 : 0.64), H * 0.86, u * 0.2], // (behind the trunk's foot)
  ];
  for (const [cx, cy, cr] of clouds) {
    halftone(
      g,
      cx - cr,
      cy - cr,
      cx + cr,
      cy + cr,
      u * 0.016,
      "#ff1d16",
      (x, y) => {
        const d = Math.hypot(x - cx, y - cy) / cr;
        return (1 - d) * 1.6 * (0.7 + 0.3 * Math.sin(x * 0.05 + y * 0.03));
      },
    );
    yield;
  }
  const gw = W * (tall ? 0.95 : 0.78);
  halftone(g, 0, gy, W, H + u * 0.02, u * 0.015, "#ff2214", (x, y) => {
    const a = x / gw,
      dn = (y - gy) / (H - gy);
    return (
      (1.25 - a) *
      Math.min(1, dn * 6 + 0.3) *
      (0.85 + 0.15 * Math.sin(x * 0.03 + y * 0.05))
    );
  });
  yield;
  halftone(g, 0, gy, W, H + u * 0.02, u * 0.015, "#ffe81a", (x, y) => {
    const a = x / (gw * 0.72),
      dn = (y - gy) / (H - gy);
    return (
      ((1.1 - a - dn * 0.25) * Math.min(1, dn * 4) +
        0.08 * Math.sin(x * 0.04 + y * 0.03)) *
      0.82
    );
  });
  yield;

  /* the chain-link net over the left side (and faintly on), beaded with cyan */
  const step = u * 0.05;
  const net = document.createElement("canvas");
  net.width = W;
  net.height = H;
  const n = net.getContext("2d");
  n.strokeStyle = "#2440ff";
  n.lineWidth = Math.max(1, u * 0.0017);
  for (const s of [1, -1])
    for (let k = -H; k < W + H; k += step) {
      n.beginPath();
      for (let y = 0; y <= H + step; y += step / 2) {
        const zig = (Math.round(y / (step / 2)) % 2) * step * 0.2;
        n.lineTo(k + s * y * 0.9 + zig, y);
      }
      n.stroke();
    }
  n.fillStyle = "#3ad8ff";
  for (let i = 0; i < (W * H) / 700; i++) {
    n.globalAlpha = 0.4 + R() * 0.6;
    n.fillRect(R() * W, R() * H, 1.8, 1.8);
  }
  n.globalAlpha = 1;
  n.globalCompositeOperation = "destination-in";
  const nf = n.createLinearGradient(0, 0, W, 0);
  nf.addColorStop(0, "#000c");
  nf.addColorStop(tall ? 0.6 : 0.45, "#0009");
  nf.addColorStop(1, "#0003");
  n.fillStyle = nf;
  n.fillRect(0, 0, W, H);
  g.drawImage(net, 0, 0);
  yield;

  /* the tree: its trunk from the bottom right, three big limbs, smaller branches, and black leaves over the top right */
  const tx = W * (tall ? 0.74 : 0.8),
    trunkW = u * (tall ? 0.24 : 0.2),
    fork = [fx, fy];
  g.fillStyle = "#000";
  limb(
    g,
    [tx, H * 1.04],
    [tx + trunkW * 0.15, H * 0.74],
    fork,
    trunkW * 1.5,
    trunkW * 0.6,
  );
  const tips = [];
  const branch = (p, a, len, w, depth) => {
    const end = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len],
      mid = [
        p[0] + Math.cos(a + 0.22) * len * 0.5,
        p[1] + Math.sin(a + 0.22) * len * 0.5,
      ];
    limb(g, p, mid, end, w, w * 0.55);
    if (depth >= 3) return tips.push(end);
    const kids = 2 + (R() < 0.35);
    for (let k = 0; k < kids; k++)
      branch(
        end,
        a + (k - (kids - 1) / 2) * 0.7 + (R() - 0.5) * 0.35,
        len * (0.62 + R() * 0.14),
        w * 0.55,
        depth + 1,
      );
  };
  const L0 = u * (tall ? 0.3 : 0.28);
  branch(fork, -Math.PI * 0.78, L0, trunkW * 0.55, 0); // up and to the left
  branch(fork, -Math.PI * 0.42, L0 * 1.1, trunkW * 0.55, 0); // up and to the right
  branch(
    [fork[0] + trunkW * 0.05, fork[1] + trunkW * 0.35],
    -0.06,
    L0 * 1.15,
    trunkW * 0.45,
    1,
  ); // out to the right
  yield;
  for (const [x, y] of tips) blob(g, R, x, y, u * (0.045 + R() * 0.04), 8);
  for (let i = 0; i < 18; i++)
    blob(
      g,
      R,
      W * (0.5 + R() * 0.55),
      H * (R() * 0.42),
      u * (0.05 + R() * 0.07),
      7,
    );
  yield;
  /* a few spots of light right through the leaves */
  g.save();
  for (let i = 0; i < 14; i++) {
    const x = W * (0.52 + R() * 0.5),
      y = H * (0.04 + R() * 0.5),
      r = u * (0.01 + R() * 0.022);
    g.globalAlpha = 0.85;
    g.fillStyle = R() < 0.6 ? swirl : grain;
    blob(g, R, x, y, r, 4);
  }
  g.restore();
  yield;

  /* the duck in yellow halftone, at the bottom left, looking up at the tree */
  const dk = (u * (tall ? 0.46 : 0.5)) / 120,
    at = { x: W * (tall ? 0.04 : 0.06), y: gy - 98 * dk, k: dk };
  const mask = duckMask(W, H, at),
    m = mask.getContext("2d");
  m.globalCompositeOperation = "source-in";
  m.fillStyle = "#ff2a10";
  m.fillRect(0, 0, W, H);
  m.globalCompositeOperation = "source-atop";
  const lx = at.x + 64 * dk,
    ly = at.y + 34 * dk;
  halftone(
    m,
    at.x - 4 * dk,
    at.y - 30 * dk,
    at.x + 125 * dk,
    at.y + 110 * dk,
    u * 0.012,
    "#ffee12",
    (x, y) => 1.15 - (Math.hypot(x - lx, y - ly) / (90 * dk)) * 0.6,
  );
  g.save();
  g.shadowColor = "#ff2a10";
  g.shadowBlur = u * 0.012;
  g.drawImage(mask, 0, 0);
  g.restore();
  /* his eye */
  g.fillStyle = "#4a0c04";
  g.beginPath();
  g.arc(at.x + 86 * dk, at.y + 22 * dk, 4.2 * dk, 0, Math.PI * 2);
  g.fill();
  yield;

  /* black and white: every color turned to its grey */
  if (grey) {
    const img = g.getImageData(0, 0, W, H),
      d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    g.putImageData(img, 0, 0);
  }
}

/* the squares and the hexagons that live on top, in the page's own units (%), the same for everyone */
function liveBits(tall) {
  const R = rng(SEED + 9),
    SQ = ["#1a2cff", "#19b8ff", "#6a2a9a", "#2f4f8f", "#1b6a6a"],
    HX = [
      ["#ffe81a", "#fff59a", "#b9a400"],
      ["#e8141a", "#ff6a6a", "#8a0a0e"],
      ["#ff8a00", "#ffc46a", "#a85400"],
    ];
  const g = tall ? 8 : 5.2; // the squares' grid, in % of the width
  const squares = Array.from({ length: tall ? 12 : 16 }, (_, i) => {
    const x = Math.floor(R() * (100 / g)) * g,
      y =
        Math.floor(R() * (100 / (g * (tall ? 0.45 : 1.78)))) *
        g *
        (tall ? 0.45 : 1.78);
    return `<i class="cl-sq" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--c:${SQ[i % SQ.length]};animation-delay:-${(R() * 9).toFixed(1)}s"></i>`;
  }).join("");
  const hex = Array.from({ length: tall ? 18 : 26 }, (_, i) => {
    const [c, l, d] = HX[i % 3],
      x = 4 + R() * 92,
      y = 4 + R() * 70;
    return `<i class="cl-hx" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;animation-delay:-${(R() * 5).toFixed(1)}s"><svg viewBox="0 0 20 22"><path d="M10 1L19 6V16L10 21L1 16V6Z" fill="${c}"/><path d="M10 1L19 6L10 11L1 6Z" fill="${l}"/><path d="M10 11L19 6V16L10 21Z" fill="${d}" opacity=".7"/></svg></i>`;
  }).join("");
  return squares + hex;
}

/* the scene: scene(layer, s) → { update(now), destroy() } */
export function collageScene(layer, s) {
  const sc = document.createElement("div"),
    html = document.documentElement;
  sc.className = "scene collage";
  const grey = () => !!(s && s.options && s.options.mapGrey);
  sc.classList.toggle("grey", grey());
  layer.append(sc);
  let drawn = "",
    job = null,
    timer = 0,
    rtimer = 0;
  const pump = () => {
    if (!job) return;
    const t = performance.now();
    while (performance.now() - t < 8)
      if (job.next().done) {
        job = null;
        return;
      }
    timer = setTimeout(pump, 0);
  };
  const draw = () => {
    const W = layer.clientWidth,
      H = layer.clientHeight;
    if (!W || !H) return;
    const key = W + "x" + H + grey();
    if (key === drawn) return;
    drawn = key;
    clearTimeout(timer);
    const lite = html.classList.contains("low"),
      k = Math.min(lite ? 0.75 : 1.25, devicePixelRatio || 1),
      cv = document.createElement("canvas");
    cv.width = Math.round(W * k);
    cv.height = Math.round(H * k);
    const tall = H > W;
    const all = drawCollage(cv, cv.width, cv.height, grey());
    job = (function* () {
      yield* all;
      const old = sc.querySelector("canvas");
      sc.innerHTML = "";
      sc.append(cv);
      sc.insertAdjacentHTML(
        "beforeend",
        `<div class="cl-live">${liveBits(tall)}</div>`,
      );
      if (old) old.remove();
      sc.classList.add("ready");
    })();
    pump();
  };
  const ro = new ResizeObserver(() => {
    clearTimeout(rtimer);
    rtimer = setTimeout(draw, drawn ? 200 : 0);
  });
  ro.observe(layer);
  draw();
  return {
    update() {
      if (sc.classList.contains("grey") !== grey()) {
        sc.classList.toggle("grey", grey());
        draw();
      }
    },
    destroy() {
      job = null;
      clearTimeout(timer);
      clearTimeout(rtimer);
      ro.disconnect();
      sc.remove();
    },
  };
}

/* the small picture for the Map window (a row's slice too): the real drawing, small, made once */
let mini = "";
export function collageMini() {
  if (!mini) {
    const cv = document.createElement("canvas");
    cv.width = 480;
    cv.height = 270;
    for (const _ of drawCollage(cv, 480, 270, false));
    mini = cv.toDataURL("image/jpeg", 0.85);
  }
  return `<img src="${mini}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`;
}
