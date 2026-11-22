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
import { gridPx, raster } from "./pixel.js";
import {
  onRoof,
  layoutVariant,
  deckOver,
  roofHoleOver,
  floorH,
} from "./hangout/layout.js";
import { ELEV } from "./heights.js";
import { below } from "./below.js";

const GREEN = "#2f9e44", // (the other players: a slightly darker green than the friendly squad's light green, the owner's, Nov 19 19:27Z)
  DARK_BLUE = "#2a5bd7",
  YELLOW = "#ffd23f",
  RED = "#8a1018";
const COLOR = {
  ally: GREEN,
  me: DARK_BLUE,
  justin: YELLOW,
  zombie: RED,
  friend: "#b6f5a6", // (Survival's friendly squad: a light green, the owner's, Nov 19)
};
/* the drops lying on the ground (the owner's, Nov 18 13:58Z: "special drops like instant kill, full ammo, and all of
   those an outline of their own color AND an arrow if a floor above or below WHEN it is on the ground ... so it is not
   missed, and gas gets an orange outline"): each its own color, none of the ducks' green, blue or yellow or the
   zombies' red, and the jerry cans orange. Kind "drop_<its kind>" (l4dd.js, l4ddpowerui.js) */
export const DROP_OL = {
  kill: "#ff3df5", // (Instant Kill: magenta)
  ammo: "#3fdcff", // (Max Ammo: cyan)
  nuke: "#a46bff", // (Nuke: violet)
  speed: "#ffffff", // (Speed Boost: white)
  double: "#c8ff3a", // (Double Points: lime, the dollar's)
  sale: "#ff7aa8", // (Sale: pink)
  coins: "#ffd23f", // (Justin's pocket change: gold)
  can: "#ff8a1a", // (a jerry can, gas: orange)
};
for (const [k, c] of Object.entries(DROP_OL)) COLOR["drop_" + k] = c;
const BLINK = 700; // ms an outline blinks after a hit

/* which floor something is on, from where it stands (world px) and its feet's height: on Downpour, 1 up on a roof or
   the pumps' canopy and 0 on the ground or inside (layout.js onRoof, never a car's top: a duck climbing the ladder is still on the ground
   till it steps off onto the roof); on Duck Cabin, 1 from 90 px up (the balcony) */
let floorOf = (x, y, z) =>
  layoutVariant() === "l4gs" ? (onRoof(x, y, z) ? 1 : 0) : z >= 90 ? 1 : 0;
/* the same for an outline: f, and floor (olAdd's), against mine (my own f), and what its arrow and line add (B5, the
   owner's, Nov 21 16:17Z: "The arrows have numbers to them if the duck is on an elevation level, not a fraction of an
   elevation level ... even the outlines for the ducks become darker the higher you go up"): lv, its elevation as Sandbox
   counts them (the ground 1) while it stands on a whole one; dk, how much darker it shows from my floor (below.js) */
export function olAway(x, y, z, mine = 0) {
  const f = floorOf(x, y, z),
    h = floorH(x, y, z),
    n = Math.round(h / ELEV);
  return {
    floor: Math.sign(f - mine),
    f,
    lv: Math.abs(h - n * ELEV) <= ELEV * 0.02 ? n + 1 : null,
    dk: below(h),
  };
}
/* a line darker by dk (0 … 1): its color times 1 - dk, as a kind of its own ("#rrggbb", kept once for each color and
   step; Justin's thin line stays without a glow) */
function darkKind(kind, dk) {
  const [base, ...rest] = kind.split("-"),
    c = COLOR[base] || base;
  if (!dk || c[0] !== "#") return kind;
  const v = parseInt(c.slice(1), 16),
    d =
      "#" +
      [16, 8, 0]
        .map((s) =>
          Math.round(((v >> s) & 255) * (1 - dk))
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
  return base === "justin" ? d : [d, ...rest].join("-");
}

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
    color = COLOR[kind.split("-")[0]] || kind.split("-")[0], // (a Sandbox zone's own color: its kind is the color, "#rrggbb")
    glow = kind.endsWith("-glow") && !kind.startsWith("justin"); // (Justin's yellow: the line alone, no glow round it, so it's thinner: the owner's, Nov 21 18:59Z, "the little yellow lines on Dead Ducks Arcade around the things be like a little smaller")
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
   the board), flip (turned left), kind ("ally" | "me" | "justin" | "zombie", or a drop's: "drop_" + its kind,
   DROP_OL), hidden (something hides it), floor (its floor against mine: 1 above, -1 below, 0 the same), hp (to blink when it drops), down (lying down, out of HP: [its body's
   bottom, its body's height], css px), mid (lying down: its body's middle, css px, where its arrow goes) }. A kind that's
   a color ("#rrggbb") is a Sandbox zone's Outlines row (sandboxrules.js sbOlColor) */
/* a picture of my own to outline, for what shows as a drawing and not as a pixel image (the drops: their symbols, a
   jerry can's orb): the drawing (an SVG string) made into pixels at w × h css px (pixel.js raster), as an image; null
   while it's made */
const PICS = new Map(); // its pixel version's url → the image
export function olPic(key, svg, w, h) {
  const u = raster(
    key,
    svg.replace(/<svg (?![^>]*\swidth=)/, '<svg width="64" height="64" '),
    w,
    h,
  ); // (a size of its own: Firefox won't draw an SVG with none)
  if (!u) return null;
  let im = PICS.get(u);
  if (!im) {
    if (PICS.size > 80) PICS.clear();
    PICS.set(u, (im = new Image()));
    im.src = u;
  }
  return im;
}
export function olAdd(o) {
  if (o.img && o.img.complete && o.img.naturalWidth) list.set(o.id, o);
}

let cv = null,
  g = null,
  drawn = false,
  last = "", // (what the canvas shows now, as text: the same next frame, nothing is drawn again)
  under = null, // (what draws first each frame, under the outlines: Downpour's rain, l4ddrain.js)
  underOn = false;
/* fn() gives a painter, paint(g), that draws on this canvas (cleared, on the grid's pixels) under the outlines this
   frame, or null; null: none. Downpour's rain is drawn here instead of on a canvas of its own: a whole-screen canvas
   that changes every frame costs the browser a new picture of everything under it, and this one changes most frames
   anyway (about 28 fps against 58 on Downpour's round 21, the computer 4x slower). Drawn straight on it, not on a canvas
   of its own copied over: that copy, a whole screen every frame, was about 2 s a minute on a slow computer */
export function olUnder(fn) {
  under = fn;
}
/* each outline's own number, for that text */
const CID = new WeakMap();
let cids = 0;
const cid = (c) => CID.get(c) || (CID.set(c, ++cids), cids);
/* draws this frame's outlines into `host` (W × H css px), then starts the next frame's list; no host: none.
   Only when what it draws changes (the owner's, Nov 18 13:58Z: "only update a zombie's outline, hp bar, and shadow
   when it changes"): each frame first works out every line it would draw (which outline, where, how faint), and if
   that is what the canvas already shows, it's left alone. A canvas drawn again costs the browser a whole new picture
   to take in; one left alone costs nothing */
export function olDraw(host, W, H, now = performance.now()) {
  const want = list.values();
  list = new Map();
  if (!host) {
    if (cv && drawn) g.clearRect(0, 0, cv.width, cv.height);
    drawn = false;
    last = "";
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
    last = "";
  }
  const gp = gridPx(),
    cw = Math.max(1, Math.ceil(W / gp)),
    ch = Math.max(1, Math.ceil(H / gp));
  if (cv.width !== cw || cv.height !== ch) {
    cv.width = cw;
    cv.height = ch;
    cv.style.width = (cw * gp).toFixed(2) + "px";
    cv.style.height = (ch * gp).toFixed(2) + "px";
    last = ""; // (a resize empties it)
  }
  const ops = [],
    sig = [];
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
      drop = o.kind.startsWith("drop_"), // (a drop on the ground: always its line and its glow, till it's picked up)
      zone = o.kind[0] === "#", // (a Sandbox zone's Outlines: its color, always plain to see)
      away = o.floor || 0,
      shown = zombie ? o.hidden || !!away : true;
    if (!shown && !hit) continue;
    let a = zone
      ? 0.95
      : drop
        ? o.hidden
          ? 0.95
          : 0.6
        : o.hidden
          ? zombie
            ? 0.85
            : away > 0
              ? 0.55 // (above me: fainter)
              : 0.9
          : zombie
            ? 0.85
            : 0.14; // (nothing hides it: very faint)
    if (hit) a = blink ? 1 : 0.15;
    const kind = darkKind(
        o.kind +
          (drop || (!zombie && !zone && (o.hidden || hit)) ? "-glow" : ""),
        o.dk,
      ), // (darker under my floor: olAway)
      c = outline(o.img, kind);
    if (!c) continue;
    const sw = o.w / gp / o.img.naturalWidth, // (the picture's pixels against the grid's: about 1)
      sh = o.h / gp / o.img.naturalHeight,
      x = Math.round(o.x / gp),
      y = Math.round(o.y / gp),
      dw = c.width * sw,
      dh = c.height * sh;
    let ax = 0,
      ay = 0,
      aa = 0,
      ac = null;
    if (away) {
      /* the arrow inside it, the way to it: an outline of the same line and color as its own (with its glow when it
         has one), clear even when its own line is faint, so its floor always shows; it blinks with it */
      ac = outline(ARROW[away > 0 ? 0 : 1], kind, away > 0 ? "up" : "down");
      aa = hit ? a : Math.max(a, 0.75);
      ax =
        (o.mid
          ? Math.round(o.mid[0] / gp)
          : Math.round(x + (o.img.naturalWidth * sw) / 2)) -
        P -
        (AW >> 1);
      ay =
        (o.mid
          ? Math.round(o.mid[1] / gp)
          : Math.round(y + o.img.naturalHeight * sh * 0.55)) -
        P -
        (AH >> 1); // (lying down: in the middle of its body, where it lies, mid)
    }
    const nc = ac && o.lv ? outline(number(o.lv), kind, "n" + o.lv) : null; // (its elevation's number beside the arrow, the same line)
    ops.push({ o, c, a, x, y, sw, sh, dw, dh, ac, aa, ax, ay, nc });
    sig.push(
      `${cid(c)}|${a}|${x},${y}|${dw.toFixed(2)},${dh.toFixed(2)}|${o.flip ? 1 : 0}|${o.down ? o.down.map((v) => v.toFixed(1)) : ""}|${ac ? `${cid(ac)},${ax},${ay},${aa}` : ""}|${nc ? cid(nc) : ""}`,
    );
  }
  const drawing = sig.join(";"),
    pic = under && under();
  if (drawing === last && !pic && !underOn) return; // (just as it is on the screen: nothing to draw)
  last = drawing;
  g.imageSmoothingEnabled = false; // (sharp pixels: a resize resets it)
  if (drawn || underOn) g.clearRect(0, 0, cw, ch);
  drawn = false;
  underOn = !!pic;
  if (pic) {
    g.save();
    g.globalAlpha = 1;
    pic(g);
    g.restore();
  }
  for (const { o, c, a, x, y, sw, sh, dw, dh, ac, aa, ax, ay, nc } of ops) {
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
    if (ac) {
      g.globalAlpha = aa;
      g.drawImage(ac, ax, ay);
      if (nc) g.drawImage(nc, ax + AW + P + 1, ay + ((AH - NH) >> 1));
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
/* the numbers beside an arrow (an elevation: 1 the ground), in pixels: each digit 3 by 5 squares of 2 pixels, a square
   between them, the outline drawn round them as round the arrows */
const DIGITS = [
    "111101101101111",
    "010110010010111",
    "111001111100111",
    "111001111001111",
    "101101111001001",
    "111100111001111",
    "111100111101111",
    "111001001001001",
    "111101111101111",
    "111101111001111",
  ],
  NH = 10,
  NUMS = new Map();
function number(n) {
  let c = NUMS.get(n);
  if (c) return c;
  const ds = String(n);
  c = document.createElement("canvas");
  c.width = ds.length * 8 - 2;
  c.height = NH;
  const x = c.getContext("2d");
  x.fillStyle = "#000";
  [...ds].forEach((d, k) => {
    for (let i = 0; i < 15; i++)
      if (DIGITS[d][i] === "1")
        x.fillRect(k * 8 + (i % 3) * 2, Math.floor(i / 3) * 2, 2, 2);
  });
  NUMS.set(n, c);
  return c;
}
