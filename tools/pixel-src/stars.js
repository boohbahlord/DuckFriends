/* Starry Night's sky as its code drew it, for tools/pixel-maps.cjs only (the game turns the pixel file it makes, js/maps.js
   starsScene): the Milky Way (value noise in a gently bowed band, a warm core split by dark dust lanes, a few pink
   glows) and tens of thousands of stars in the colors of real stars, crowding into the band's bright clouds, drawn on a
   circle as big as the one that ever crosses the page, in the world's pixels; and the brightest stars, crisp and
   twinkling, the biggest with spikes (the game draws them) */
export const ST_INK = [
    "#a9bcff",
    "#c8d6ff",
    "#f4f6ff",
    "#fff4e6",
    "#ffe2bd",
    "#ffc98a",
    "#ffa978",
  ],
  ST_W = [0.12, 0.18, 0.3, 0.18, 0.1, 0.08, 0.04];
const stInk = (r) => {
  let i = 0;
  for (let a = ST_W[0]; r > a && i < ST_W.length - 1; ) a += ST_W[++i];
  return i;
};
const stHash = (i, j) => {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const stNoise = (x, y) => {
  const i = Math.floor(x),
    j = Math.floor(y),
    fx = x - i,
    fy = y - j,
    ux = fx * fx * (3 - 2 * fx),
    uy = fy * fy * (3 - 2 * fy);
  const a = stHash(i, j),
    b = stHash(i + 1, j),
    c = stHash(i, j + 1),
    d = stHash(i + 1, j + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
const stFbm = (x, y, o = 5) => {
  let s = 0,
    a = 0.5,
    n = 0;
  for (let k = 0; k < o; k++) {
    s += a * stNoise(x, y);
    n += a;
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.7;
    a *= 0.5;
  }
  return s / n;
};
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const ST_BA = 0.5,
  ST_BD = 0.48,
  ST_BOW = 0.12,
  ST_UC = 0.2; // the band: its angle, its distance from the pole, its bow, where its core is
const stCore = (u) => Math.exp(-(((u - ST_UC) / 0.28) ** 2)),
  stWidth = (u) => 0.085 * (1 + 1.1 * stCore(u));
/* the sky for a page W × H css px (G css px to a pixel): { canvas, R, pole: [x, y], base (its turn at the start),
   bright: [[x, y (on the canvas), size, color, twinkle's time, its delay (s)]] } (all in the world's pixels) */
export function starSky(W, H, G) {
  const ca = Math.cos(ST_BA),
    sa = Math.sin(ST_BA),
    cvv = ST_BD + ST_BOW * ST_UC * ST_UC,
    coreX = ST_UC * ca - cvv * sa,
    coreY = ST_UC * sa + cvv * ca;
  const px = W * 0.5,
    py = -0.35 * H,
    R = Math.ceil(Math.hypot(px, H - py)) + 4,
    S = 2 * R,
    r0 = -py / R;
  const k = 1 / G, // (the world's pixels: two css px to one)
    C = Math.round(S * k),
    Ncss = Math.round(S / 4.5); // (the Milky Way as fine as on a computer's screen)
  const base =
    Math.atan2(0.45 * H - py, (W < H ? 0.62 : 0.38) * W - px) -
    Math.atan2(coreY, coreX); // the core starts left of the middle and rolls right
  /* the Milky Way, small, then stretched over the sky (it is soft anyway) */
  const N = Math.min(640, Ncss),
    dens = new Float32Array(N * N),
    neb = document.createElement("canvas");
  neb.width = neb.height = N;
  const ng = neb.getContext("2d"),
    img = ng.createImageData(N, N),
    d = img.data;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N) * 2 - 1,
        y = ((j + 0.5) / N) * 2 - 1,
        rr = x * x + y * y;
      if (rr > 1.02 || rr < r0 * r0 * 0.6) continue;
      const u = x * ca + y * sa,
        v = -x * sa + y * ca - ST_BD - ST_BOW * u * u,
        core = stCore(u),
        w = stWidth(u);
      const band = Math.exp(-((v / w) ** 2)),
        halo = Math.exp(-((v / (w * 3)) ** 2));
      if (halo < 0.02) continue;
      const n = stFbm(x * 4 + 3, y * 4 + 1),
        n2 = stFbm(x * 12 + 5, y * 12 + 3, 4),
        cl = sstep(0.35, 0.8, n) * (0.45 + 0.9 * n2); // clouds, clumpy
      const patch = sstep(0.42, 0.8, stFbm(x * 5 + 11, y * 5 + 7, 4)),
        blot = sstep(0.56, 0.8, stFbm(x * 9 + 4, y * 9 + 6, 4)); // the dust: a rift down the middle, and blots
      const lane =
        Math.exp(
          -(
            ((v + 0.025 * Math.sin(u * 8) + 0.03 * (n - 0.5)) / (w * 0.32)) **
            2
          ),
        ) *
        (0.4 + 0.6 * core);
      const dark = Math.min(
        0.82,
        lane * (0.35 + 0.6 * patch) + band * 0.4 * blot * (0.3 + core),
      );
      const pink =
          sstep(0.68, 0.86, stFbm(x * 15 + 2, y * 15 + 9, 3)) * band * cl * 0.5,
        lav = sstep(0.5, 0.72, stFbm(x * 2 + 8, y * 2 + 4, 3)) * 0.35;
      const a =
        1 -
        Math.exp(
          -1.4 *
            ((band * (0.18 + 1.35 * cl) + halo * 0.1 * n) *
              (1 - dark) *
              (0.6 + 0.8 * core) +
              pink * 0.2),
        ); // bright, never flat
      const t = Math.min(1, Math.max(0, core * band * 1.3 + 0.2 * (n2 - 0.5))),
        o = (j * N + i) * 4;
      let R1 = 170 + 85 * t,
        G1 = 186 + 40 * t,
        B1 = 240 - 55 * t;
      R1 += (190 - R1) * lav * (1 - t);
      G1 += (165 - G1) * lav * (1 - t);
      B1 += (245 - B1) * lav * (1 - t);
      d[o] = R1 + (255 - R1) * pink;
      d[o + 1] = G1 + (90 - G1) * pink;
      d[o + 2] = B1 + (140 - B1) * pink;
      d[o + 3] = a * 225;
      dens[j * N + i] = band * (cl + 0.15) * (1 - dark); // where the band's crowds of stars are
    }
  }
  ng.putImageData(img, 0, 0);
  const cv = document.createElement("canvas");
  cv.className = "st-sky";
  cv.width = cv.height = C;
  const g = cv.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(neb, 0, 0, C, C);
  /* the stars: a few everywhere, many more in the band's clouds (and none in its dust) */
  let seed = 20261025;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () =>
    Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2832 * rnd());
  const stars = [],
    tries = (S * S) / 330;
  const inSky = (x, y) => {
    const rr = x * x + y * y;
    return rr < 1 && rr > r0 * r0 * 0.8;
  };
  const inBand = () => {
    const u = rnd() * 2.4 - 1.2,
      v = ST_BD + ST_BOW * u * u + gauss() * stWidth(u) * 0.8,
      x = u * ca - v * sa,
      y = u * sa + v * ca;
    const ix = Math.floor(((x + 1) / 2) * N),
      iy = Math.floor(((y + 1) / 2) * N);
    return ix >= 0 &&
      iy >= 0 &&
      ix < N &&
      iy < N &&
      rnd() < dens[iy * N + ix] * 1.2
      ? [x, y]
      : null;
  };
  for (let i = 0; i < tries; i++) {
    const x = rnd() * 2 - 1,
      y = rnd() * 2 - 1;
    if (inSky(x, y)) stars.push([x, y, rnd() ** 4.5, stInk(rnd())]);
  }
  for (let i = 0; i < tries * 4; i++) {
    const p = inBand();
    if (p && inSky(...p)) stars.push([...p, rnd() ** 6, stInk(rnd())]);
  }
  stars.sort((a, b) => a[3] - b[3]);
  const sprites = ST_INK.map((c) => {
    const s = document.createElement("canvas");
    s.width = s.height = 32;
    const x = s.getContext("2d"),
      gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, "#fff");
    gr.addColorStop(0.12, c);
    gr.addColorStop(0.3, c + "73");
    gr.addColorStop(0.6, c + "1a");
    gr.addColorStop(1, c + "00");
    x.fillStyle = gr;
    x.fillRect(0, 0, 32, 32);
    return s;
  });
  for (let i = 0; i < stars.length; i++) {
    const [x, y, m, ci] = stars[i],
      X = ((x + 1) / 2) * C,
      Y = ((y + 1) / 2) * C;
    if (m < 0.6) {
      const s = (0.8 + 1.6 * m) * k;
      g.globalAlpha = 0.35 + 1.1 * m;
      g.fillStyle = ST_INK[ci];
      g.fillRect(X - s / 2, Y - s / 2, s, s);
    } else {
      const s = (3 + 8 * m) * k;
      g.globalAlpha = 0.55 + 0.45 * m;
      g.drawImage(sprites[ci], X - s / 2, Y - s / 2, s, s);
    }
  }
  g.globalAlpha = 1;
  const list = [];
  for (let i = 0, n = 130; list.length < n && i < n * 20; i++) {
    const p = rnd() < 0.35 ? inBand() : [rnd() * 2 - 1, rnd() * 2 - 1];
    if (!p || !inSky(...p)) continue;
    const sz = 5 + 10 * rnd() ** 2.2;
    list.push([
      +(((p[0] + 1) * R) / G).toFixed(1),
      +(((p[1] + 1) * R) / G).toFixed(1),
      +(sz / G).toFixed(2),
      ST_INK[stInk(rnd())],
      +(1.8 + rnd() * 2.7).toFixed(2),
      -(rnd() * 4).toFixed(2),
    ]);
  }
  return { canvas: cv, R: R / G, pole: [px / G, py / G], base, bright: list };
}
