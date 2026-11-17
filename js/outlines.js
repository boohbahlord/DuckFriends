/* ---------- the outlines in every zombie game (the owner, Nov 17 12:28Z) ----------
   Dead Ducks Arcade (both maps) and Mad God Justin:
     - every player: a soft green glowing outline while a wall, a roof or anything else hides it, and a very faint one
       when nothing does; it blinks when it takes damage;
     - a floor away: the green glow with an arrow inside, the way to it (up: they're above me, fainter; down: below);
     - Justin (Good Justin in Mad God Justin, Downpour's Justin): the same, in blue;
     - zombies: a plain thin dark red line, no glow, only while something hides them; a very faint arrow a floor away.
   One canvas over the board, on the pixel grid (pixel.js), so a line is one pixel of the pixel look. Each outline is made
   once from the picture already on the screen (the duck's or the zombie's pixel image) and kept until that picture
   changes; a frame only draws the kept ones where they stand, so a crowd of zombies costs a few image draws.
   I looked for a small library first: outlines like these come from big engines (PixiJS' pixi-filters OutlineFilter,
   Phaser's postFX), which want their own renderer and don't fit our pages of plain elements, so this is the usual
   canvas trick: the picture drawn a pixel off each way in the color, its own shape cut back out. */
import { gridPx } from "./pixel.js";

const GREEN = "#5be35b",
  BLUE = "#59c8ff",
  RED = "#8a1018";
const COLOR = { ally: GREEN, blue: BLUE, zombie: RED };
const BLINK = 700; // ms an outline blinks after a hit

/* which floor something is on, from where it stands (world px) and its ground's height: a stand-in until the maps say
   (setFloorOf: Solomon's, from Downpour's roofs) */
let floorOf = (x, y, z) => (z >= 90 ? 1 : 0);
export const setFloorOf = (f) => (floorOf = f);
export const olFloor = (x, y, z) => floorOf(x, y, z);

/* ---------- each picture's outline, made once ---------- */
const MADE = new Map(); // picture (its src: the pixel images are short blob: urls, shared by every zombie that looks the same) → { kind → canvas }
const P = 2; // (room round a picture for its line and its glow, in pixels)
function outline(img, kind) {
  const src = img.currentSrc || img.src;
  let m = MADE.get(src);
  if (!m) {
    if (MADE.size > 600) MADE.clear(); // (old looks: made again if they come back)
    MADE.set(src, (m = {}));
  }
  if (m[kind]) return m[kind];
  const w = img.naturalWidth,
    h = img.naturalHeight;
  if (!w || !h) return null;
  const c = document.createElement("canvas");
  c.width = w + P * 2;
  c.height = h + P * 2;
  const g = c.getContext("2d"),
    color = COLOR[kind.split("-")[0]],
    glow = kind.endsWith("-glow");
  /* the shape grown by a pixel (by two for the glow), in the color */
  const grow = (r) => {
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++)
        if ((dx || dy) && Math.abs(dx) + Math.abs(dy) <= r)
          g.drawImage(img, P + dx, P + dy);
  };
  if (glow) {
    grow(2);
    g.globalCompositeOperation = "source-in";
    g.globalAlpha = 0.4;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    const t = document.createElement("canvas");
    t.width = c.width;
    t.height = c.height;
    const tg = t.getContext("2d");
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      tg.drawImage(img, P + dx, P + dy);
    tg.globalCompositeOperation = "source-in";
    tg.fillStyle = color;
    tg.fillRect(0, 0, t.width, t.height);
    g.drawImage(t, 0, 0);
  } else {
    grow(1);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
  }
  g.globalCompositeOperation = "destination-out";
  g.drawImage(img, P, P); // (its own shape cut out: only the line round it is left)
  m[kind] = c;
  return c;
}

/* ---------- each frame ---------- */
let list = new Map(); // id → what to outline (one each: the last one asked for this frame)
const HP = new Map(); // id → [its HP last seen, when it last went down]
/* something to outline this frame: { id, img (its picture on the screen), x, y, w, h (where the picture is, css px on
   the board), flip (turned left), kind ("ally" | "blue" | "zombie"), hidden (something hides it), floor (its floor
   against mine: 1 above, -1 below, 0 the same), hp (to blink when it drops), down (lying down, out of HP: [its body's
   bottom, its body's height], css px) } */
export function olAdd(o) {
  if (o.img && o.img.complete && o.img.naturalWidth) list.set(o.id, o);
}

let cv = null,
  g = null,
  drawn = false;
/* draws this frame's outlines into `host` (W × H css px), then starts the next frame's list; no host: none */
export function olDraw(host, W, H, now = performance.now()) {
  const want = list.values();
  list = new Map();
  if (!host) {
    if (cv && drawn) g.clearRect(0, 0, cv.width, cv.height);
    drawn = false;
    return;
  } // (no zombie game now: none left over on the screen)
  if (!cv || cv.parentNode !== host) {
    cv?.remove();
    cv = document.createElement("canvas");
    cv.className = "ol-px";
    cv.setAttribute("aria-hidden", "true");
    host.append(cv);
    g = cv.getContext("2d");
    drawn = true;
  }
  const gp = gridPx(),
    cw = Math.max(1, Math.ceil(W / gp)),
    ch = Math.max(1, Math.ceil(H / gp));
  if (cv.width !== cw || cv.height !== ch) {
    cv.width = cw;
    cv.height = ch;
    cv.style.width = (cw * gp).toFixed(2) + "px";
    cv.style.height = (ch * gp).toFixed(2) + "px";
  }
  g.imageSmoothingEnabled = false; // (sharp pixels: a resize resets it)
  if (drawn) g.clearRect(0, 0, cw, ch);
  drawn = false;
  for (const o of want) {
    /* a hit: it blinks */
    let h = o.hp === undefined ? null : HP.get(o.id); // (zombies don't blink: only players and Justin have HP here)
    if (o.hp !== undefined && !h) HP.set(o.id, (h = [o.hp, -1e9]));
    if (h && o.hp < h[0]) h[1] = now;
    if (h) h[0] = o.hp;
    const hit = !!h && now - h[1] < BLINK,
      blink = hit && Math.floor((now - h[1]) / 90) % 2 === 0;
    const zombie = o.kind === "zombie",
      away = o.floor || 0,
      shown = zombie ? o.hidden || away : true;
    if (!shown && !hit) continue;
    let a = zombie
      ? away && !o.hidden
        ? 0.3
        : 0.85
      : o.hidden || away
        ? away > 0
          ? 0.55 // (above me: fainter)
          : 0.9
        : 0.14; // (nothing hides it: very faint)
    if (hit) a = blink ? 1 : 0.15;
    const kind = o.kind + (!zombie && (o.hidden || away || hit) ? "-glow" : ""),
      c = outline(o.img, kind);
    if (!c) continue;
    const sw = o.w / gp / o.img.naturalWidth, // (the picture's pixels against the grid's: about 1)
      sh = o.h / gp / o.img.naturalHeight,
      x = Math.round(o.x / gp),
      y = Math.round(o.y / gp),
      dw = c.width * sw,
      dh = c.height * sh;
    g.globalAlpha = a;
    if (o.flip || o.down) {
      /* turned left (mirrored round its middle), or lying down as a duck out of HP lies (css: rotate(-100deg)
         translateY(-12%) round the bottom middle of its body, down: [its body's bottom, its height] in css px) */
      const ox = x + dw / 2 - P * sw,
        oy = o.down ? o.down[0] / gp : 0;
      g.save();
      g.translate(ox, oy);
      if (o.flip) g.scale(-1, 1);
      if (o.down)
        (g.rotate((-100 * Math.PI) / 180),
          g.translate(0, (-0.12 * o.down[1]) / gp));
      g.translate(-ox, -oy);
      g.drawImage(c, x - P * sw, y - P * sh, dw, dh);
      g.restore();
    } else g.drawImage(c, x - P * sw, y - P * sh, dw, dh);
    if (away) {
      /* the arrow inside it, the way to it (zombies': very faint) */
      g.globalAlpha = zombie ? 0.3 : Math.min(1, a + 0.25); // (a little clearer than its line)
      g.fillStyle = COLOR[o.kind];
      arrow(
        Math.round(x + (o.img.naturalWidth * sw) / 2),
        Math.round(y + o.img.naturalHeight * sh * 0.55),
        away > 0,
      );
    }
    drawn = true;
  }
  g.globalAlpha = 1;
}
/* a little pixel arrow, its middle at (x, y), pointing up or down: a head 5 pixels wide and a stem 3 long */
function arrow(x, y, up) {
  const d = up ? 1 : -1,
    tip = y - 3 * d;
  for (let i = 0; i < 3; i++) g.fillRect(x - i, tip + i * d, i * 2 + 1, 1);
  g.fillRect(x, up ? y : y - 2, 1, 3);
}
