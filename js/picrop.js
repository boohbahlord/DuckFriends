/* ---------- cropping a picture for a duck (Customize: Your picture) ----------
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

/* the crop of img, [x, y, w, h] in its own pixels, as a duck's picture: { d: a PNG data URL, cut: true when any of it
   is see-through } */
export function cropOf(img, [x, y, w, h], px = DUCK_PIC_PX) {
  const k = Math.min(px / w, px / h),
    dw = Math.max(1, Math.round(w * k)),
    dh = Math.max(1, Math.round(h * k)),
    c = document.createElement("canvas");
  c.width = c.height = px;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingQuality = "high";
  g.drawImage(img, x, y, w, h, Math.round((px - dw) / 2), px - dh, dw, dh); // (standing on the bottom, in the middle)
  const data = applyPalette(g.getImageData(0, 0, px, px));
  g.putImageData(data, 0, 0);
  let cut = false;
  for (let i = 3; i < data.data.length; i += 4)
    if (data.data[i] < 255) {
      cut = true;
      break;
    }
  return { d: c.toDataURL("image/png"), cut };
}

/* the window: resolves { d, cut }, or null when it's closed without one */
export function cropPicture(file) {
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
        <div class="pc-foot"><canvas class="pc-prev" width="${DUCK_PIC_PX}" height="${DUCK_PIC_PX}" aria-label="How it looks"></canvas>
        <p class="acts"><button type="button" class="btn ghost small" data-v="all">Whole picture</button><button type="button" class="btn" data-v="ok">Use it</button></p></div>`,
        { cls: "pc-win", onOpen: (w, close) => setUp(w, close, img) },
      ),
    )
    .finally(() => URL.revokeObjectURL(url));
}

function setUp(w, close, img) {
  const stage = w.querySelector(".pc-stage"),
    pic = w.querySelector(".pc-img"),
    box = w.querySelector(".pc-box"),
    prev = w.querySelector(".pc-prev"),
    W = img.naturalWidth,
    H = img.naturalHeight,
    MIN = Math.max(2, Math.round(Math.min(W, H) / 40)); // (the smallest crop, in the picture's pixels)
  let r = [0, 0, W, H]; // (the crop, in the picture's pixels)
  const scale = () => pic.clientWidth / W || 1;
  const draw = () => {
    const k = scale();
    box.style.left = r[0] * k + "px";
    box.style.top = r[1] * k + "px";
    box.style.width = r[2] * k + "px";
    box.style.height = r[3] * k + "px";
    const g = prev.getContext("2d");
    g.clearRect(0, 0, prev.width, prev.height);
    const out = new Image();
    out.onload = () => {
      g.clearRect(0, 0, prev.width, prev.height);
      g.drawImage(out, 0, 0);
    };
    out.src = cropOf(img, r).d;
  };
  /* dragging: the box moves, a corner sizes it (the corner across from it stays put) */
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
      [x, y, bw, bh] = drag.r;
    if (!drag.c)
      r = [
        Math.max(0, Math.min(W - bw, x + dx)),
        Math.max(0, Math.min(H - bh, y + dy)),
        bw,
        bh,
      ];
    else {
      let x0 = x,
        y0 = y,
        x1 = x + bw,
        y1 = y + bh;
      if (drag.c.includes("w")) x0 = Math.max(0, Math.min(x1 - MIN, x0 + dx));
      else x1 = Math.min(W, Math.max(x0 + MIN, x1 + dx));
      if (drag.c.includes("n")) y0 = Math.max(0, Math.min(y1 - MIN, y0 + dy));
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
    r = [0, 0, W, H];
    draw();
  };
  w.querySelector('[data-v="ok"]').onclick = () => close(cropOf(img, r));
  if (pic.complete) requestAnimationFrame(draw);
  else pic.onload = draw;
  new ResizeObserver(draw).observe(pic); // (a phone turned: the box stays on the same part)
}
