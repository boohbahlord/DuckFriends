/* ---------- the outlines (the owner, Nov 17 12:28Z; everywhere a cover can hide a duck, 17:41Z: "the new universal
   system", "any game mode") ----------
   Dead Ducks Arcade (both maps), Mad God Justin, and Hangout's world (Duck Cabin):
     - every other player: a soft green glowing outline while a wall, a roof or anything else hides it, and then only
       the outline, never its picture (the owner's, Nov 17 17:41Z: game.js, l4dd.js .ol-only); a very faint one when
       nothing does; it blinks when it takes damage;
     - my own duck: the same, in a darker blue, which only I see (the owner's, Nov 17 20:10Z);
     - Justin (Good Justin in Mad God Justin, Downpour's Justin): the same, in yellow (20:10Z, he was blue);
     - zombies: a plain thin red line, no glow, while something hides them (then the line only) and a floor away;
     - under a roof I'm not under (the gas station's, the pumps' canopy): hidden by it, always (the owner's, 20:02Z:
       "ZOMBIES GET A RED OUTLINE WHEN UNDER THE ROOF! THEY JUST DO!"), unless I see them through a hole in it;
     - a floor away: an arrow inside the outline, drawn as an outline too, of the same line and color (20:10Z: "the down
       arrow in the shape outline with the lines of the arrow made of the same outline and it's color and an up arrow
       equivalent for zombies on the roof, so that way a zombies elevation is know"): up, they're above me; down, below.
   One canvas over the board, on the pixel grid (pixel.js), so a line is one pixel of the pixel look. Each outline is made
   once from the picture already on the screen (the duck's or the zombie's pixel image) and kept until that picture
   changes; a frame only draws the kept ones where they stand, so a crowd of zombies costs a few image draws.
   I looked for a small library first: outlines like these come from big engines (PixiJS' pixi-filters OutlineFilter,
   Phaser's postFX), which want their own renderer and don't fit our pages of plain elements, so this is the usual
   canvas trick: the picture drawn a pixel off each way in the color, its own shape cut back out. */
import { gridPx } from "./pixel.js";
import {
  floorAt,
  layoutVariant,
  deckOver,
  roofHoleOver,
} from "./hangout/layout.js";

const GREEN = "#5be35b",
  DARK_BLUE = "#2a5bd7",
  YELLOW = "#ffd23f",
  RED = "#8a1018";
const COLOR = { ally: GREEN, me: DARK_BLUE, justin: YELLOW, zombie: RED };
const BLINK = 700; // ms an outline blinks after a hit

/* which floor something is on, from where it stands (world px) and its feet's height: on Downpour, 1 up on a roof or
   the pumps' canopy and 0 on the ground or inside (layout.js floorAt: a duck climbing the ladder is still on the ground
   till it steps off onto the roof); on Duck Cabin, 1 from 90 px up (the balcony) */
let floorOf = (x, y, z) =>
  layoutVariant() === "l4gs"
    ? floorAt(x, y, z).deck
      ? 1
      : 0
    : z >= 90
      ? 1
      : 0;
export const setFloorOf = (f) => (floorOf = f);
export const olFloor = (x, y, z) => floorOf(x, y, z);

/* the one rule for roofs (the owner's, Nov 17 20:02Z: "make a simple and basic principle"): someone at (x, y), feet at
   z, with a roof or the canopy over its head (layout.js deckOver) is hidden by it, unless I'm under that same one too
   (me: where I am, { x, y, z }) or I see them through a hole in it (roofHoleOver; a spot right under a hole has no roof
   over it). Downpour only: Duck Cabin has no deck over anyone */
export function olRoofed(x, y, z, me) {
  const d = deckOver(x, y, z);
  if (!d || roofHoleOver(x, y, z)) return false;
  return !me || deckOver(me.x, me.y, me.z) !== d;
}

/* ---------- each picture's outline, made once ---------- */
const MADE = new Map(); // picture (its src: the pixel images are short blob: urls, shared by every zombie that looks the same) → { kind → canvas }
const P = 2; // (room round a picture for its line and its glow, in pixels)
/* img: a picture on the screen, or a shape of my own on a canvas (the arrows), key then naming it */
function outline(img, kind, key = img.currentSrc || img.src) {
  let m = MADE.get(key);
  if (!m) {
    if (MADE.size > 600) MADE.clear(); // (old looks: made again if they come back)
    MADE.set(key, (m = {}));
  }
  if (m[kind]) return m[kind];
  const own = img instanceof HTMLCanvasElement,
    w = own ? img.width : img.naturalWidth,
    h = own ? img.height : img.naturalHeight;
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
   the board), flip (turned left), kind ("ally" | "me" | "justin" | "zombie"), hidden (something hides it), floor (its floor
   against mine: 1 above, -1 below, 0 the same), hp (to blink when it drops), down (lying down, out of HP: [its body's
   bottom, its body's height], css px), mid (lying down: its body's middle, css px, where its arrow goes) } */
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
    /* only what something hides shows its outline as it should (its picture is hidden then: the outline only, the
       owner's, Nov 17 17:41Z); a player in plain sight keeps the very faint one (12:28Z); a zombie in plain sight none,
       but a floor away it has its line and its arrow all the same, so its floor shows (20:10Z) */
    const zombie = o.kind === "zombie",
      away = o.floor || 0,
      shown = zombie ? o.hidden || !!away : true;
    if (!shown && !hit) continue;
    let a = o.hidden
      ? zombie
        ? 0.85
        : away > 0
          ? 0.55 // (above me: fainter)
          : 0.9
      : zombie
        ? 0.85
        : 0.14; // (nothing hides it: very faint)
    if (hit) a = blink ? 1 : 0.15;
    const kind = o.kind + (!zombie && (o.hidden || hit) ? "-glow" : ""),
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
      /* the arrow inside it, the way to it: an outline of the same line and color as its own (with its glow when it
         has one), clear even when its own line is faint, so its floor always shows; it blinks with it */
      const ac = outline(
        ARROW[away > 0 ? 0 : 1],
        kind,
        away > 0 ? "up" : "down",
      );
      g.globalAlpha = hit ? a : Math.max(a, 0.75);
      g.drawImage(
        ac,
        (o.mid
          ? Math.round(o.mid[0] / gp)
          : Math.round(x + (o.img.naturalWidth * sw) / 2)) -
          P -
          (AW >> 1),
        (o.mid
          ? Math.round(o.mid[1] / gp)
          : Math.round(y + o.img.naturalHeight * sh * 0.55)) -
          P -
          (AH >> 1),
      ); // (lying down: in the middle of its body, where it lies, mid)
    }
    drawn = true;
  }
  g.globalAlpha = 1;
}
/* the arrows' shapes (up, down), in pixels: a head 9 wide and 5 tall over a stem 3 wide and 6 long, the outline drawn
   round them (outline()) so each shows as a hollow arrow of lines */
const AW = 9,
  AH = 11;
const ARROW = [true, false].map((up) => {
  const c = document.createElement("canvas");
  c.width = AW;
  c.height = AH;
  const x = c.getContext("2d");
  x.fillStyle = "#000";
  for (let i = 0; i < 5; i++)
    x.fillRect(4 - i, up ? i : AH - 1 - i, i * 2 + 1, 1); // (the head, from its tip)
  x.fillRect(3, up ? 5 : 0, 3, 6); // (the stem)
  return c;
});
