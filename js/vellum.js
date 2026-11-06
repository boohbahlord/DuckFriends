/* ---------- The King's Festival (id: vellum) ----------
   The page of No. 54 of my book (Nous Within Kenoma): a leaf of an old medieval book under the board. A real
   photograph of blank aged vellum (a spare leaf of the Towneley Lectionary, about 1550, New York Public Library, public
   domain) and scanned Lombardic capitals (Swabia, about 1510, Yale, Beinecke MS 439, public domain), both from the
   book's own site; everything else is drawn here in iron-gall ink: the ruling, the lines of writing (too small and far
   to read), red and blue paragraph marks, a red rubric, penwork around the initials, a bar border down the margin and
   the leaf's number. Two columns of writing on a wide screen, one on a phone. A slow candle light breathes over it.
   While it's played the interface takes the book's look (Grenze Gotisch, ink, vermilion, lapis and gilt: css/app.css,
   html.map-is-vellum). */

const DIR = "assets/maps/vellum/";
const INK = "43, 29, 20"; // iron-gall ink: a brown-black, never pure black
const RED = "#9c3624"; // old faded vermilion
const BLUE = "#2f4f93"; // lapis
const LOMBARD = { t: [183, 320], k: [211, 320] }; // the scans' sizes

/* the pictures, loaded once; the map draws again when they come in */
const pics = {};
const waiting = [];
const load = (name, src) => {
  const im = new Image();
  im.decoding = "async";
  im.src = DIR + src;
  im.onload = () => waiting.splice(0).forEach((f) => f());
  pics[name] = im;
};
if (typeof Image !== "undefined") {
  load("page", "vellum.webp");
  load("t", "lombard-t-blue.webp");
  load("k", "lombard-k-red.webp");
}
const ready = (name) =>
  pics[name] && pics[name].complete && pics[name].naturalWidth > 0;

/* the same page on every screen of the same size: a small seeded random */
function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* one stroke of the writing: a textura minim, a thick slanted stroke with a pointed head and foot */
function minim(g, x, top, bot, w) {
  const d = w * 0.55;
  g.moveTo(x, top + d);
  g.lineTo(x + w, top);
  g.lineTo(x + w, bot - d);
  g.lineTo(x, bot);
  g.closePath();
}

/* a line of writing from x0 to x1 on baseline y: words of strokes, some with ascenders and descenders; to: where the
   last word may end (a paragraph's last line stops short) */
function writing(g, r, x0, x1, y, xh, to = x1) {
  const w = xh * 0.17,
    step = xh * 0.4,
    gap = xh * 0.85;
  let x = x0;
  g.beginPath();
  for (;;) {
    const letters = 2 + Math.floor(r() * 6),
      width = letters * (step * 2 + w * 0.6);
    if (x + width > to) break;
    for (let l = 0; l < letters; l++) {
      const n = r() < 0.2 ? 1 : r() < 0.25 ? 3 : 2,
        up = r() < 0.13,
        down = !up && r() < 0.06;
      for (let m = 0; m < n; m++) {
        const tall = up && m === 0,
          deep = down && m === n - 1;
        minim(g, x, y - xh * (tall ? 1.75 : 1), y + xh * (deep ? 0.7 : 0), w);
        x += step;
      }
      x += w * 0.6;
    }
    x += gap;
  }
  g.fill();
  return x;
}

/* a curl: a small spiral ending a line of penwork */
function curl(g, x, y, r0, turns, dir = 1) {
  g.beginPath();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40,
      a = t * turns * Math.PI * 2 * dir,
      rr = r0 * (1 - t * 0.8);
    const px = x + Math.cos(a) * rr,
      py = y + Math.sin(a) * rr;
    if (i) g.lineTo(px, py);
    else g.moveTo(px, py);
  }
  g.stroke();
}

/* penwork around an initial, in the other color: whiskers along its side, a tendril down the margin with pearls on
   it, curling at both ends */
function penwork(g, x, y, w, h, color, down, hair, xh) {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = hair;
  const p = xh * 0.35;
  g.globalAlpha = 0.85;
  g.beginPath();
  for (let i = 1; i < 7; i++) {
    const wy = y - p + ((h + p * 2) * i) / 7;
    g.moveTo(x + w + p, wy);
    g.lineTo(x + w + p * 2.4, wy - p * 0.4);
  }
  g.stroke();
  const lx = x - p * 2.2;
  g.beginPath();
  g.moveTo(lx, y - p * 2);
  g.lineTo(lx, y + h + down);
  g.stroke();
  for (let py = y + p; py < y + h + down - p * 2; py += xh * 1.1) {
    g.beginPath();
    g.arc(lx - p * 0.55, py, p * 0.42, 0, Math.PI * 2);
    g.stroke();
  }
  curl(g, lx + p * 0.9, y + h + down, p * 0.9, 1.6, -1);
  curl(g, lx + p * 0.9, y - p * 2, p * 0.8, 1.4, 1);
  g.globalAlpha = 1;
}

/* the whole page in ink (the vellum under it is the scene's background, or drawn here first for the small picture) */
function paint(cv, W, H, k, withPage) {
  const g = cv.getContext("2d");
  g.setTransform(k, 0, 0, k, 0, 0);
  g.clearRect(0, 0, W, H);
  if (withPage) {
    g.fillStyle = "#ba966c";
    g.fillRect(0, 0, W, H);
    if (ready("page")) {
      const im = pics.page,
        s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
      g.drawImage(
        im,
        (W - im.naturalWidth * s) / 2,
        (H - im.naturalHeight * s) / 2,
        im.naturalWidth * s,
        im.naturalHeight * s,
      );
    }
  }
  const r = rnd(54),
    wide = W > H * 1.1,
    cols = wide ? 2 : 1,
    lines = wide ? 24 : 32,
    top = H * (wide ? 0.1 : 0.08),
    bottom = H * (wide ? 0.88 : 0.9),
    lh = (bottom - top) / lines,
    xh = lh * 0.4,
    left = W * (wide ? 0.11 : 0.12),
    right = W * (wide ? 0.91 : 0.92),
    gutter = W * 0.05,
    cw = (right - left - gutter * (cols - 1)) / cols,
    hair = Math.max(0.6, xh * 0.07);

  // the ruling: a double line each side of each column, a faint line under each line of writing
  g.lineWidth = hair;
  for (let c = 0; c < cols; c++) {
    const x0 = left + c * (cw + gutter);
    g.strokeStyle = "rgba(134, 42, 28, .26)";
    g.beginPath();
    for (const x of [
      x0 - xh * 0.5,
      x0 - xh * 0.25,
      x0 + cw + xh * 0.25,
      x0 + cw + xh * 0.5,
    ]) {
      g.moveTo(x, top - lh * 1.2);
      g.lineTo(x, bottom + lh * 0.6);
    }
    g.stroke();
    g.strokeStyle = `rgba(${INK}, .1)`;
    g.beginPath();
    for (let i = 0; i <= lines; i++) {
      const y = top + i * lh - lh * 0.15;
      g.moveTo(x0 - xh * 0.5, y);
      g.lineTo(x0 + cw + xh * 0.5, y);
    }
    g.stroke();
  }

  // the writing, paragraph after paragraph; the first column opens with a blue T and a red rubric, the second (or, on
  // a phone, the middle of the page) with a red K
  const ink = `rgba(${INK}, .24)`;
  let blue = false;
  for (let c = 0; c < cols; c++) {
    const x0 = left + c * (cw + gutter),
      x1 = x0 + cw;
    let para = 0,
      left0 = 0,
      sunk = 0,
      ini = null;
    // an initial sunk n lines into the writing, its top at line i
    const opening = (letter, n, i) => {
      const [iw, ih] = LOMBARD[letter],
        h = lh * n - lh * 0.35,
        w = (h * iw) / ih;
      ini = {
        letter,
        x: x0,
        y: top + i * lh + lh * 0.12,
        w,
        h,
        down: lh * (n + 1),
      };
      return w;
    };
    for (let i = 0; i < lines; i++) {
      const y = top + (i + 1) * lh - lh * 0.3;
      let x = x0;
      if (i === 0 || (!wide && i === 17)) {
        const letter = c === 0 && i === 0 ? "t" : "k",
          n = letter === "t" ? 4 : 3;
        left0 = opening(letter, n, i) + xh * 1.3;
        sunk = n;
        para = 6 + Math.floor(r() * 4);
        drawInitial(g, ini, xh, hair);
      }
      if (sunk > 0) {
        x += left0;
        sunk--;
      } else if (para <= 0) {
        g.font = `500 ${(xh * 2.3).toFixed(1)}px "Grenze Gotisch", "Old English Text MT", serif`;
        g.fillStyle = blue ? BLUE : RED;
        g.globalAlpha = 0.8;
        g.fillText("¶", x, y);
        g.globalAlpha = 1;
        x += xh * 1.6;
        blue = !blue;
        para = 4 + Math.floor(r() * 7);
      }
      para--;
      const last = para === 0 && i < lines - 1;
      g.fillStyle = c === 0 && i < 2 ? "rgba(156, 54, 36, .62)" : ink;
      writing(g, r, x, x1, y, xh, last ? x0 + cw * (0.35 + r() * 0.45) : x1);
    }
  }

  // a bar border down the outer margin: red and blue, joined by gilt, with sprays of penwork at its ends
  const bx = left * 0.42,
    bw = Math.max(2, xh * 0.42),
    b0 = top - lh * 0.5,
    b1 = bottom;
  const seg = lh * 1.6;
  for (let y = b0, n = 0; y < b1; y += seg, n++) {
    g.fillStyle = n % 2 ? BLUE : RED;
    g.globalAlpha = 0.8;
    g.fillRect(bx, y, bw, Math.min(seg, b1 - y) - bw * 0.35);
  }
  g.globalAlpha = 0.75;
  g.fillStyle = "#b8892f";
  for (let y = b0 + seg; y < b1; y += seg)
    g.fillRect(bx - bw * 0.3, y - bw * 0.35, bw * 1.6, bw * 0.35);
  g.globalAlpha = 1;
  g.lineWidth = hair;
  g.strokeStyle = RED;
  for (const [y, d] of [
    [b0, -1],
    [b1, 1],
  ]) {
    g.beginPath();
    g.moveTo(bx + bw / 2, y);
    g.lineTo(bx + bw / 2, y + d * lh * 1.4);
    g.stroke();
    curl(g, bx + bw / 2 + xh * 0.45, y + d * lh * 1.4, xh * 0.45, 1.5, d);
    curl(g, bx + bw / 2 - xh * 0.45, y + d * lh * 0.8, xh * 0.38, 1.3, -d);
  }

  // the leaf's number, top right: 54 the old way
  g.font = `500 ${(xh * 2).toFixed(1)}px "Grenze Gotisch", "Old English Text MT", serif`;
  g.fillStyle = `rgba(${INK}, .5)`;
  g.textAlign = "right";
  g.fillText("fo. liiij", right + xh * 0.5, top - lh * 1.6);
  g.textAlign = "left";
}

/* an initial: its scan (when it's in) and its penwork in the other color */
function drawInitial(g, ini, xh, hair) {
  if (ready(ini.letter)) {
    g.globalAlpha = 0.92;
    g.drawImage(pics[ini.letter], ini.x, ini.y, ini.w, ini.h);
    g.globalAlpha = 1;
  }
  penwork(
    g,
    ini.x,
    ini.y,
    ini.w,
    ini.h,
    ini.letter === "t" ? RED : BLUE,
    ini.down,
    hair,
    xh,
  );
}

/* the map: the vellum (css), the ink on a canvas drawn again when the page changes size or a picture comes in, the
   candle light and the darker edges (css) */
export function vellumScene(layer) {
  const sc = document.createElement("div"),
    html = document.documentElement;
  sc.className = "scene vellum";
  sc.innerHTML =
    '<canvas class="vl-ink" aria-hidden="true"></canvas><i class="vl-glow"></i><i class="vl-edge"></i>';
  layer.append(sc);
  const cv = sc.querySelector("canvas");
  let drawn = "",
    timer = 0,
    gone = false;
  const draw = (force) => {
    if (gone) return;
    const W = layer.clientWidth,
      H = layer.clientHeight;
    if (!W || !H) return;
    const k = Math.min(
        html.classList.contains("low") ? 1 : 2,
        devicePixelRatio || 1,
      ),
      key = W + "x" + H + "@" + k;
    if (key === drawn && !force) return;
    drawn = key;
    cv.width = Math.round(W * k);
    cv.height = Math.round(H * k);
    paint(cv, W, H, k, false);
  };
  const again = () => draw(true);
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(draw, drawn ? 200 : 0);
  });
  ro.observe(layer);
  draw();
  if (!ready("t") || !ready("k")) waiting.push(again);
  if (document.fonts && document.fonts.load)
    document.fonts.load('500 20px "Grenze Gotisch"').then(again, () => {});
  return {
    update() {},
    destroy() {
      gone = true;
      clearTimeout(timer);
      ro.disconnect();
      sc.remove();
    },
  };
}

/* the small picture for the Map window, Game Settings and the lobby's picture: the page, 16 : 9 (kept once its
   pictures are in) */
let mini = "";
export function vellumMiniURL() {
  if (mini) return mini;
  const cv = document.createElement("canvas");
  cv.width = 960;
  cv.height = 540;
  paint(cv, 480, 270, 2, true);
  const g = cv.getContext("2d"),
    edge = g.createRadialGradient(480, 260, 200, 480, 260, 560);
  g.setTransform(1, 0, 0, 1, 0, 0);
  edge.addColorStop(0, "rgba(70, 42, 18, 0)");
  edge.addColorStop(1, "rgba(70, 42, 18, .3)");
  g.fillStyle = edge;
  g.fillRect(0, 0, 960, 540);
  const url = cv.toDataURL("image/jpeg", 0.86);
  if (ready("page") && ready("t") && ready("k")) mini = url;
  return url;
}
export const vellumMini = () =>
  `<img src="${vellumMiniURL()}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`;
