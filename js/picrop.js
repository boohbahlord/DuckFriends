/* ---------- cropping a picture: every picture put into the game, before it's made into pixels ----------
   The owner's, Nov 20 21:38Z: "Anything where you can add an image into anything in the game, you should be able to
   crop it ... I should also be able to select where, like on my image that's going in my player card, does it crop
   out at". One window for all of them (pickArea): a duck's picture (cropPicture, below), the player card, a made map's
   picture, a share's picture, Sandbox's NPC, item and zone pictures (cropFile). A place that wants one shape (a card
   is square, a map 16:9) gets a box of that shape; the rest any shape.
   A duck's picture (Customize: Your picture):
   The owner's, Nov 20: "a custom image upload is made for an enemy target, right? In which cropped images can also be
   used for players' custom avatars". The picture opens in a window with a box over it: drag the box to move it, its
   corners to size it (any shape), and only what's in it is kept. It's made as pixels (DUCK_PIC_PX to a side, the way
   a duck's picture always is, through the game's colors: pixelpalette.js), standing at the bottom of its square, what's
   round it see-through. A picture that was erased round its shape before it was uploaded keeps its see-through parts
   too. Either way, a picture with see-through parts is a cut-out (cut): drawn with no card round it and hit only where
   it shows (duck.js, sbbody.js picBody). The original is never kept. */
import { openWindow } from "./ui.js";
import { applyPalette } from "./pixelpalette.js";
import { DUCK_PIC_PX } from "./duck.js";

const MOST = 8 * 1024 * 1024; // (a bigger file is refused before it's read)

/* the part of the crop that shows: [x, y, w, h] shrunk to round what isn't see-through (looked at no bigger than 256
   to a side), or the crop as it is when none of it shows */
function shownOf(img, [x, y, w, h]) {
  const k = Math.min(1, 256 / Math.max(w, h)),
    cw = Math.max(1, Math.round(w * k)),
    ch = Math.max(1, Math.round(h * k)),
    c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, x, y, w, h, 0, 0, cw, ch);
  const a = g.getImageData(0, 0, cw, ch).data;
  let x0 = cw,
    y0 = ch,
    x1 = -1,
    y1 = -1;
  for (let j = 0; j < ch; j++)
    for (let i = 0; i < cw; i++)
      if (a[(j * cw + i) * 4 + 3] > 24) {
        if (i < x0) x0 = i;
        if (i > x1) x1 = i;
        if (j < y0) y0 = j;
        if (j > y1) y1 = j;
      }
  if (x1 < 0) return [x, y, w, h];
  return [x + x0 / k, y + y0 / k, (x1 + 1 - x0) / k, (y1 + 1 - y0) / k];
}
/* the crop of img, [x, y, w, h] in its own pixels, as a duck's picture: { d: a PNG data URL, cut: true when any of it
   is see-through }. Only the part that shows counts: the see-through round it is left out first, so what shows grows
   to fill the duck's square whatever its shape (fitted by its own sides, standing on the bottom), and a tiny picture
   still makes a whole duck (the owner's, Nov 20: "the image expands in size to the size of the ducks in a
   mathematical formula based on it's empty unused space ... based on the aspect ratio of the crop") */
function cropOf(img, rect, px = DUCK_PIC_PX) {
  const [x, y, w, h] = shownOf(img, rect),
    k = Math.min(px / w, px / h),
    dw = Math.max(1, Math.round(w * k)),
    dh = Math.max(1, Math.round(h * k)),
    c = document.createElement("canvas");
  c.width = c.height = px;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingQuality = "high";
  g.drawImage(img, x, y, w, h, Math.round((px - dw) / 2), px - dh, dw, dh); // (standing on the bottom, in the middle)
  const data = applyPalette(g.getImageData(0, 0, px, px));
  g.putImageData(data, 0, 0);
  let cut = false,
    on = 0;
  for (let i = 3; i < data.data.length; i += 4) {
    if (data.data[i] < 255) cut = true;
    if (data.data[i] > 100) on++; // (what's hit: sbbody.js counts a square from there)
  }
  return {
    d: c.toDataURL("image/png"),
    cut,
    z: cut ? growOf(on / (px * px)) : 1,
  };
}
/* how much bigger a cut-out is drawn than a duck's square (z, 1 or more), so it's never a smaller target than a duck
   (the owner's, Nov 20 18:50Z: "it is made to balance the game so they can make their avatar rly small based on the
   aspect ratio of the crop"). shown: the share of its square it fills, fitted by its long side; a duck fills
   PIC_FILL of the same square, so a thin or a sparse picture grows until it fills as much: its sides by the square
   root of the two. Never past PIC_GROW_MOST, so a line a pixel wide doesn't cover the screen */
const PIC_FILL = 0.57; // (the slimmest duck, Skinny build: a Normal one fills 0.66)
const PIC_GROW_MOST = 2.5;
const growOf = (shown) =>
  Math.round(
    Math.min(
      PIC_GROW_MOST,
      Math.max(1, Math.sqrt(PIC_FILL / Math.max(shown, 0.01))),
    ) * 100,
  ) / 100;

/* the window: the picture with a box over it. Resolves make(img, [x, y, w, h]) for the part picked, or null when it's
   closed without one. aspect: the box's width over its height, kept as it's sized (0: any shape). preview(img, rect):
   how it comes out, a data URL shown under it */
function pickArea(file, { aspect = 0, preview, make }) {
  if (!file || !/^image\//.test(file.type))
    return Promise.reject(new Error("That file is not a picture."));
  if (file.size > MOST)
    return Promise.reject(new Error("That picture is over 8 MB."));
  const url = URL.createObjectURL(file),
    img = new Image();
  img.src = url;
  return img
    .decode()
    .catch(() => {
      throw new Error("That picture could not be read.");
    })
    .then(() =>
      openWindow(
        `<h2>Crop your picture</h2>
        <div class="pc-stage"><img class="pc-img" src="${url}" alt="" draggable="false"><div class="pc-box">${["nw", "ne", "sw", "se"].map((c) => `<span class="pc-h pc-${c}" data-c="${c}"></span>`).join("")}</div></div>
        <div class="pc-foot"><canvas class="pc-prev" aria-label="How it looks"></canvas>
        <p class="acts"><button type="button" class="btn ghost small" data-v="all">${aspect ? "Biggest" : "Whole picture"}</button><button type="button" class="btn" data-v="ok">Use it</button></p></div>`,
        {
          cls: "pc-win",
          onOpen: (w, close) => setUp(w, close, img, { aspect, preview, make }),
        },
      ),
    )
    .finally(() => URL.revokeObjectURL(url));
}

/* a duck's picture: resolves { d, cut, z } (cropOf), or null */
export const cropPicture = (file) =>
  pickArea(file, {
    preview: (img, r) => cropOf(img, r).d,
    make: cropOf,
  });

/* any other picture: the part picked, as a PNG file (its longest side most pixels at the most), for the place's own
   pixel making (it reads a file as it did before); null when closed without one. aspect: as pickArea; px: [w, h] of
   what it's made into, for the preview (the game's colors at that size), or side: its longest side */
export function cropFile(file, { aspect = 0, px, side = 32, most = 512 } = {}) {
  const partOf = (img, [x, y, w, h], W, H) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingQuality = "high";
    g.drawImage(img, x, y, w, h, 0, 0, W, H);
    return c;
  };
  const fit = (w, h, m) => {
    const k = Math.min(1, m / Math.max(w, h));
    return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
  };
  return pickArea(file, {
    aspect,
    preview(img, r) {
      const [W, H] = px || fit(r[2], r[3], side),
        c = partOf(img, r, W, H),
        g = c.getContext("2d", { willReadFrequently: true });
      g.putImageData(applyPalette(g.getImageData(0, 0, W, H)), 0, 0);
      return c.toDataURL("image/png");
    },
    make: (img, r) =>
      new Promise((ok) =>
        partOf(img, r, ...fit(r[2], r[3], most)).toBlob((b) =>
          ok(b ? new File([b], "picture.png", { type: "image/png" }) : null),
        ),
      ),
  });
}

function setUp(w, close, img, { aspect, preview, make }) {
  const stage = w.querySelector(".pc-stage"),
    pic = w.querySelector(".pc-img"),
    box = w.querySelector(".pc-box"),
    prev = w.querySelector(".pc-prev"),
    W = img.naturalWidth,
    H = img.naturalHeight,
    MIN = Math.max(2, Math.round(Math.min(W, H) / 40)); // (the smallest crop, in the picture's pixels)
  /* the biggest box: the whole picture, or the biggest of its shape in the middle */
  const biggest = () => {
    if (!aspect) return [0, 0, W, H];
    const bw = Math.min(W, H * aspect),
      bh = bw / aspect;
    return [(W - bw) / 2, (H - bh) / 2, bw, bh].map((v) => Math.round(v));
  };
  let r = biggest(); // (the crop, in the picture's pixels)
  const scale = () => pic.clientWidth / W || 1;
  let shown = 0;
  const draw = () => {
    const k = scale();
    box.style.left = r[0] * k + "px";
    box.style.top = r[1] * k + "px";
    box.style.width = r[2] * k + "px";
    box.style.height = r[3] * k + "px";
    const n = ++shown,
      out = new Image();
    out.onload = () => {
      if (n !== shown) return; // (a newer one is on its way)
      prev.width = out.naturalWidth;
      prev.height = out.naturalHeight;
      const r = out.naturalWidth / out.naturalHeight,
        pw = r > 2 ? 11 : 4.4 * r; // (its own shape: as high as ever, or a wide strip like a card's 11rem across)
      prev.style.width = `${pw.toFixed(2)}rem`;
      prev.style.height = `${(pw / r).toFixed(2)}rem`;
      const g = prev.getContext("2d");
      g.clearRect(0, 0, prev.width, prev.height);
      g.drawImage(out, 0, 0);
    };
    out.src = preview(img, r);
  };
  /* dragging: the box moves, a corner sizes it (the corner across from it stays put; a box of one shape keeps it,
     following the pointer's bigger move) */
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    const h = e.target.closest(".pc-h");
    if (!h && !e.target.closest(".pc-box")) return;
    e.preventDefault();
    stage.setPointerCapture(e.pointerId);
    drag = { c: h ? h.dataset.c : "", x: e.clientX, y: e.clientY, r: [...r] };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const k = scale(),
      dx = (e.clientX - drag.x) / k,
      dy = (e.clientY - drag.y) / k,
      [x, y, bw, bh] = drag.r,
      west = drag.c.includes("w"),
      north = drag.c.includes("n");
    if (!drag.c)
      r = [
        Math.max(0, Math.min(W - bw, x + dx)),
        Math.max(0, Math.min(H - bh, y + dy)),
        bw,
        bh,
      ];
    else if (aspect) {
      const ax = west ? x + bw : x, // (the corner that stays)
        ay = north ? y + bh : y,
        room = Math.min(west ? ax : W - ax, (north ? ay : H - ay) * aspect),
        least = Math.min(room, Math.max(MIN, MIN * aspect));
      let nw = Math.max(
        west ? bw - dx : bw + dx,
        (north ? bh - dy : bh + dy) * aspect,
      );
      nw = Math.max(least, Math.min(room, nw));
      const nh = nw / aspect;
      r = [west ? ax - nw : ax, north ? ay - nh : ay, nw, nh];
    } else {
      let x0 = x,
        y0 = y,
        x1 = x + bw,
        y1 = y + bh;
      if (west) x0 = Math.max(0, Math.min(x1 - MIN, x0 + dx));
      else x1 = Math.min(W, Math.max(x0 + MIN, x1 + dx));
      if (north) y0 = Math.max(0, Math.min(y1 - MIN, y0 + dy));
      else y1 = Math.min(H, Math.max(y0 + MIN, y1 + dy));
      r = [x0, y0, x1 - x0, y1 - y0];
    }
    r = r.map((v) => Math.round(v));
    draw();
  });
  const end = () => (drag = null);
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  w.querySelector('[data-v="all"]').onclick = () => {
    r = biggest();
    draw();
  };
  w.querySelector('[data-v="ok"]').onclick = async () =>
    close(await make(img, r));
  if (pic.complete) requestAnimationFrame(draw);
  else pic.onload = draw;
  new ResizeObserver(draw).observe(pic); // (a phone turned: the box stays on the same part)
}
