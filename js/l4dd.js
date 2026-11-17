/* ---------- Quacky Zombies on every screen ----------
   Duck Cabin's world draws it (an activity that runs only in this mode, registry.js): the zombies where the host says
   (gliding between its heartbeats), their thin HP bars, a red blink when hit, the claw's swipe, lying down and fading
   when they die; the boards over the openings; the dark over everything (the power is cut) with the
   fires and every duck's flashlight cut out of it (a cone the way it aims, stopped by the walls); "Round N"
   at the top, my points under it (a +N pops up for each one earned); the end. Hold E by a downed duck to revive it, or
   by an opening to board it up; key 0 switches my flashlight. Justin's Butler stands by the card table: E by him opens
   his shop. E at the fireplace spins it for a weapon: it flickers through them over the fire, lands on one, and E takes
   it (a ranged one only with a ranged weapon in hand to swap: else big words and a buzz say so). My duck walks at half
   speed (Speed: 10% faster) and has 7 seconds of sprint (a thin blue bar under my name). The rules are the host's
   (l4ddrules.js); the weapons bar is l4ddbar.js. */
import { activity } from "./hangout/registry.js";
import { votesDue } from "./rules.js";
import {
  CABIN,
  DECK,
  STAIRS,
  inCabin,
  seenFrom,
  sortY,
  roofHoleOver,
  heightAt,
  W,
  H,
  LIGHTS,
  PROPS,
  layoutRev,
  deckAt,
} from "./hangout/layout.js";
import { sway, stutterOf, lightNow } from "./hangout/flicker.js";
import { play, setListener } from "./hangout/sounds.js";
import { svgDataURL } from "./hangout/art.js";
import { butlerSVG, justinSVG, priestSVG } from "./hangout/npcart.js";
import { FLAME, TELEPORT } from "./mgjart.js";
import { rainbowHTML } from "./art.js";
import { low } from "./gfx.js";
import { mapMount, mapUnmount, mapDraw } from "./l4ddmap.js";
import { rainMount, rainUnmount, rainDraw } from "./l4ddrain.js";
import { mudMount, mudUnmount, mudDraw } from "./l4ddmud.js";
import { nameHTML } from "./name.js";
import { profile, save, statMode } from "./store.js";
import { sfx } from "./sound.js";
import { l4Hear, l4Steps, l4Reset, bellStrikes } from "./l4ddsfx.js";
import { now as clockNow } from "./clock.js";
import {
  inShallow,
  inDeep,
  WADE,
  FLARE,
  STATION,
  PUMPS,
} from "./hangout/stationmap.js";
import { floatDuck, SINK, WADE_SINK, SLOW as SWIM } from "./hangout/water.js";
import { fenceLean, BELL_ANGLES, BELL_REST } from "./hangout/stationart.js";
import {
  L4,
  OPENINGS,
  syncMap,
  dp,
  fenceZ,
  zombieZ,
  playable,
  zombiesOf,
  startSpot,
  SHOP,
  priceOf,
  upOf,
  ptsOf,
  slotsOf,
  BUTLER,
  SLOT_KINDS,
  BOX,
  POOL,
  boxNow,
  HELPER,
  WILD_GUNS,
  wildFor,
  wildPrice,
  weaponName,
  priceFor,
  reviveMs,
  saleOn,
  dropName,
  TOILET,
  waitNeed,
  waitVotes,
  startOf,
  GUN_SHOP,
  gunPrice,
  AMMO_PRICE,
  kitOf,
  openingById,
  reloadOf,
  l4Cool,
  kindOf,
  ARMS,
  SAFE,
  safePrice,
  zombieLook,
  magIn,
  fullFor,
  downArmed,
  potOf,
  WILD,
  isWild,
} from "./l4ddrules.js";
import { ammoBar, stackBars, noReload } from "./meters.js";
import { laserMeter } from "./laserfx.js";
import { goreFree } from "./wounds.js";
import { touchOnly } from "./pointer.js";
import { catalogHTML } from "./l4ddcatalog.js";
import {
  pwMount,
  pwUnmount,
  pwSee,
  pwDraw,
  pwTarget,
  pwLabel,
  pumpLabel,
  pwTap,
  pwOrbHTML,
  isPw,
  PART_ICONS,
} from "./l4ddpowerui.js";
import {
  powerOn,
  powerNext,
  pwState,
  partName,
  PW,
  fireForSale,
  pumpZone,
} from "./l4ddpower.js";
import {
  angelMount,
  angelUnmount,
  angelSee,
  angelDraw,
  angelTarget,
  angelLabel,
  angelTap,
} from "./l4ddangelui.js";
import { DROP_ICONS } from "./l4dddrops.js";
import { popHP } from "./hpmeter.js";
import { fxHitAt, fxEye, heavyOff, fxSparks, fxSteam } from "./fx.js";
import { vibrate, hitPx } from "./fxmotion.js";
import { pixelOn, gridPx, snap, raster, rasterReady } from "./pixel.js";
import { olAdd, olFloor, olRoofed } from "./outlines.js";
import { confirmBox } from "./ui.js";
import { angelOf, ANGEL } from "./l4ddangel.js";
import { angelic } from "./powerart.js"; // (after l4ddart.js, as game.js imports it)
import { hashText } from "./pxdom.js";
import {
  zombieURL,
  zombieBox,
  boardsSVG,
  boardsBox,
  orbHTML,
  UP_ICONS,
  weaponIcon,
} from "./l4ddart.js";

const RX = 56,
  RY = 25.6; // (a zombie's room on the floor, as the rules')
const SPEED = 0.6 * 1.05; // my duck at 63% of Duck Cabin's walk: I wanted it 20% faster than the half it was, then 5% more (Nov 3; sprint goes from it)
const DARK = 0.84; // how dark the dark is: still dark, but I wanted it a little lighter than 0.93
const DARK_ON = 0.5; // … and with the power on: the lights are on, still night
const CONE = { far: 560, half: (27 * Math.PI) / 180 }; // the flashlight: how far, and half its width
const GLOW = 80; // world px: the faint light round every duck
const LOW_DEAD = 2000; // ms a dead zombie shows on my screen with Low graphics or Data saving (the rules keep it L4.DEAD_MS)
/* where each opening's moonlight falls: just inside its wall (the deck's stairs: on their top) */
let moon = null,
  moonRev = -1;
const MOON = () => {
  if (moonRev !== layoutRev()) {
    syncMap();
    moonRev = layoutRev();
    moon = Object.fromEntries(
      OPENINGS.filter((o) => !o.rim).map((o) => {
        const k =
          o.kind === "stairs"
            ? 0
            : Math.sign(o.axis === "y" ? o.in[0] - o.x : o.in[1] - o.y);
        return [
          o.id,
          o.axis === "y" ? [o.x + k * 36, o.y] : [o.x, o.y + k * 36],
        ];
      }),
    );
  }
  return moon;
};
const P4 = (s, id) => ((s && s.hang && s.hang.l4p) || {})[id] || null;
const BUTLER_NAME = "Justin's Butler";
const shopName = () => (dp() ? "Priest" : BUTLER_NAME); // (Downpour: the Priest in the chapel does his job, the owner's)
const NEAR = 130; // world px: how near E works at the Butler and the fireplace
const AWAY = 260; // walked this far off: his shop closes
/* the weapon in my hand (game.js tells me how to ask) */
let heldFn = () => "";
export const l4Held = (f) => (heldFn = f);
const up = (s, id) => {
  const p = P4(s, id);
  return !!p && !p.dn && !p.gh;
};

/* ---------- the walls, for the flashlights: their boxes on the floor ---------- */
let WALL_PROPS = [],
  WALLS = [], // [x0, y0, x1, y1]
  wallsRev = -1;
const walls = () => {
  if (wallsRev !== layoutRev()) {
    wallsRev = layoutRev(); // (Quacky Zombies' cabin: layout.js' useMode has turned to it by the time it's drawn)
    WALL_PROPS = PROPS.filter((p) => p.kind === "wall" && p.block);
    WALLS = WALL_PROPS.map((p) => p.block);
  }
  return WALLS;
};
/* the props a flashlight lights where it points (the owner, Nov 17: "they should shine onto the objects they are aimed at
   as well"): every one standing up off the floor, the walls, the cars and the fences too; not the trees (their crowns
   hang over the ducks), the roofs, the holes */
const UNLIT = new Set(["tree", "roof", "gsroof", "canopy", "hole", "gslamp"]);
let LIT_PROPS = [],
  litPropsRev = -1;
const litProps = () => {
  if (litPropsRev !== layoutRev()) {
    litPropsRev = layoutRev();
    LIT_PROPS = PROPS.filter(
      (p) => p.h >= 12 && !p.layer && !UNLIT.has(p.kind),
    );
  }
  return LIT_PROPS;
};
/* the part of the polygon pts ([[x, y] …]) inside the box x0 … x1, y0 … y1, or null (Sutherland–Hodgman) */
function clipBox(pts, x0, y0, x1, y1) {
  for (const [i, v, k] of [
    [0, x0, 1],
    [0, x1, -1],
    [1, y0, 1],
    [1, y1, -1],
  ]) {
    const out = [];
    for (let n = 0; n < pts.length; n++) {
      const a = pts[n],
        b = pts[(n + 1) % pts.length],
        ina = (a[i] - v) * k >= 0,
        inb = (b[i] - v) * k >= 0;
      if (ina) out.push(a);
      if (ina !== inb) {
        const t = (v - a[i]) / (b[i] - a[i]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return pts;
}
/* how far a ray from (x, y) along (dx, dy) goes before a wall, at most far */
function rayTo(x, y, dx, dy, far) {
  let best = far;
  for (const [x0, y0, x1, y1] of walls()) {
    let t0 = 0,
      t1 = best;
    if (Math.abs(dx) < 1e-9) {
      if (x < x0 || x > x1) continue;
    } else {
      let a = (x0 - x) / dx,
        b = (x1 - x) / dx;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
    }
    if (Math.abs(dy) < 1e-9) {
      if (y < y0 || y > y1) continue;
    } else {
      let a = (y0 - y) / dy,
        b = (y1 - y) / dy;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
    }
    if (t0 <= t1 && t0 > 0 && t0 < best) best = t0;
  }
  return best;
}

/* where an opening's boards sort: just in front of the wall piece they're on. A side wall's pieces sort by their own
   front, and a piece's top shows CABIN.wall higher up the screen than its foot, so a hole's boards go in front of every
   piece of that wall whose top covers them */
const boardKey = (o) => {
  walls();
  const on = (p) => o.x >= p.block[0] - 1 && o.x <= p.block[2] + 1,
    reach = o.axis === "y" ? o.half + 14 : 0,
    up = o.axis === "y" ? CABIN.wall : 0,
    keys = WALL_PROPS.filter(
      (p) =>
        on(p) &&
        p.block[1] - 1 <= o.y + reach + up &&
        p.block[3] + 1 >= o.y - reach,
    ).map((p) => p.key);
  return (
    Math.round(keys.length ? Math.max(...keys) + 1 : sortY(o.x, o.y + 16, 0)) +
    10
  );
};

/* a zombie beating on an opening's boards (or climbing in once they're down), seen from inside: the owner wants to see
   them coming (Nov 15), so it shows over the dark round the cabin (world.js' shade), the boards over it see-through */
const AT_BOARDS = 20001;
const atBoards = (o, inside) =>
  inside &&
  (o.st === 1 || o.st === 4) &&
  !inCabin(o.x, o.y) &&
  (openingById(o.l[2]) || {}).kind !== "stairs";

/* ---------- what this screen keeps ---------- */
const Z = new Map(); // zombie number → how it's drawn here
const B = new Map(); // opening id → its boards' element
const D = new Map(); // a drop's number → its element
const DROP_LIGHT = { r: 120, k: 0.55 }; // the light round a drop on the floor
/* a drop blinks in its last 10 s, faster and faster as it's about to go (the owner's, Nov 17 13:43Z): each step is
   [ms left, the blink's step] (css/app.css, .l4-drop[data-end]) */
const DROP_BLINK = [
  [10000, 1],
  [5000, 2],
  [2000, 3],
];
let layer = null,
  fxl = null,
  cv = null,
  g = null,
  hud = null,
  endEl = null, // the End turn button between rounds (Ready in round 0)
  endSig = "",
  over = null,
  zpSig = "",
  snapAt = 0,
  gap = 200,
  roundShown = -1, // (none yet)
  overShown = "",
  stamina = 1,
  tired = false,
  holding = null,
  walkDir = [1, 0],
  lastXY = null,
  drawn = "";
/* the Butler, the fireplace's weapon, my points, the big words, his shop */
/* my sprint left (0 … 1) and whether I'm too tired to sprint, for the HP meter's blue bar (game.js) */
export const sprintLeft = () => [stamina, tired];
/* every zombie on my screen: its box in the board's px, from its last drawing (game.js: the others' HP meters turn
   see-through over one) */
export function l4ZBoxes() {
  const out = [];
  for (const o of Z.values())
    if (o.el && !o.el.hidden && o.sk)
      out.push({
        l: o.sx - (o.bw * o.sk) / 2,
        r: o.sx + (o.bw * o.sk) / 2,
        t: o.sy - o.bh * o.sk,
        b: o.sy,
      });
  return out;
}
let butler = null,
  onEl = null,
  onSig = "",
  gotEl = null,
  boxEl = null,
  ptsEl = null,
  sayEl = null,
  shop = null,
  ptsShown = -1,
  boxSig = "",
  boxSpun = false,
  upSig = "",
  slotSig = "";

/* the pixel look (pixel.js): a place on the screen on the grid, so things' pixels line up with the map's and the ducks' */
const at = (v) => (pixelOn() ? snap(v).toFixed(2) : v.toFixed(1));
/* the pixel look: a still picture (a zombie, the Butler) as pixels at the size it shows, w × h css px; its drawing until
   they're made. o keeps what it shows: o.url (the drawing) and o.pxk */
function pxPic(o, img, w, h) {
  if (!pixelOn()) return;
  const g = gridPx(),
    k = o.url + "@" + Math.round(w / g) + "x" + Math.round(h / g);
  if (o.pxk === k) return;
  o.pxk = k;
  img.classList.add("px");
  const key = "z" + (o.uk || (o.uk = hashText(o.url))),
    u = raster(key, o.url, w, h);
  if (u) img.src = u;
  else
    rasterReady(key, o.url, w, h).then((v) => {
      if (v && o.pxk === k) img.src = v;
    });
}
/* … and with the power on (l4ddpower.js), the electric ones too: the lamps, the stage, the sink, the balcony's windows
   and the porch's string lights (made again for the map: layout.js' LIGHTS are the room's map's) */
let LIT = null,
  LIT_ON = null,
  litRev = -1;
function lits() {
  if (litRev === layoutRev()) return;
  litRev = layoutRev();
  LIT = {
    in: LIGHTS.filter((l) => l.only === "in" && !l.el),
    out: LIGHTS.filter((l) => l.only !== "in" && !l.el),
  };
  LIT_ON = {
    in: LIGHTS.filter((l) => l.only === "in"),
    out: LIGHTS.filter((l) => l.only !== "in"),
  };
}

/* a zombie's outline (outlines.js), f: where it stands on the screen, dip: how far it's sunk in the flood, hidden: true
   when a wall hides it, or null to ask whether a wall, a roof or a crown drawn over it covers it (zi: the z-index it's
   drawn at, so only what is really drawn over it counts: the owner's, Nov 17 19:11Z). Returns whether something hides
   it: then it shows only as its line, never its picture (the owner's, Nov 17 17:41Z) */
function zOutline(Wd, o, f, dip, sc, hidden, z, myFloor, zi = 0) {
  const w = o.bw * sc,
    h = o.bh * sc,
    y = f.top + (dip - o.feet) * sc,
    hid =
      hidden ??
      Wd.coverAt(f.left - w * 0.4, f.left + w * 0.4, y + h * 0.1, f.top, zi);
  olAdd({
    id: "z" + o.i,
    img: o.img,
    x: f.left - w / 2,
    y,
    w,
    h,
    flip: o.face < 0,
    kind: "zombie",
    hidden: hid,
    floor: Math.sign(olFloor(o.x, o.y, z) - myFloor),
  });
  return hid;
}
function zombieEl(z) {
  const el = document.createElement("div"),
    box = zombieBox(z.l);
  el.className = "l4z";
  const url = zombieURL(z.l, z.i);
  el.innerHTML = `<div class="l4z-body"><img alt="" draggable="false" src="${url}"></div><span class="l4z-hp"><b></b><i></i></span>`;
  const body = el.firstChild;
  body.style.width = box.w + "px";
  body.style.height = box.h.toFixed(1) + "px";
  body.style.left = (-box.w / 2).toFixed(1) + "px";
  body.style.top = (-box.feet).toFixed(1) + "px";
  body.style.transformOrigin = `${box.w / 2}px ${box.feet.toFixed(1)}px`;
  layer.append(el);
  return {
    el,
    body,
    feet: box.feet, // (its feet in its body's own px: a swimmer's waterline is SINK over them)
    bar: el.querySelector(".l4z-hp"), // (--hp on it: the red and the white behind it, css/app.css)
    x: z.x,
    y: z.y,
    fx: z.x,
    fy: z.y,
    tx: z.x,
    ty: z.y,
    t0: 0,
    face: 1,
    hp: z.hp,
    st: z.st,
    k: z.k,
    j: z.j,
    a: z.a,
    sh: "",
    hits: "",
    want: "",
    l: z.l,
    i: z.i,
    img: body.firstChild,
    url,
    bw: box.w,
    bh: box.h,
  };
}
function claw(x, y, dir, ctx) {
  if (!fxl) return;
  const px = x + Math.cos(dir) * 44,
    py = y + Math.sin(dir) * 22,
    f = ctx.world.toScreen(px, py, heightAt(px, py) + 36),
    el = document.createElement("div");
  el.className = "hang-npc-claw l4-claw";
  el.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 6C16 16 18 26 14 36M19 4C25 14 27 24 23 34M28 6C34 16 36 26 32 36" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
  el.style.left = f.left.toFixed(1) + "px";
  el.style.top = f.top.toFixed(1) + "px";
  el.style.setProperty("--k", (ctx.world.sc * 1.25).toFixed(3)); // (a little bigger than the cats')
  fxl.append(el);
  setTimeout(() => el.remove(), 1100);
  play("swipe", { x: px, y: py });
}
/* a hit's red blink (as the l4z-hit keyframes were) */
const HIT = [
  { filter: "none", easing: "ease-out" },
  {
    filter: "brightness(1.3) sepia(1) saturate(9) hue-rotate(-38deg)",
    offset: 0.35,
    easing: "ease-out",
  },
  { filter: "none" },
];
/* the weapon a zombie's newest wound (wounds.js codes) tells of, for its blood when no shot hit it (a knife, a hammer) */
const BY_WOUND = {
  b: "handgun",
  B: "ak",
  s: "pellet",
  c: "knife",
  r: "hammer",
  a: "arrow",
  k: "sniper",
  g: "chaingun",
};
const newWound = (had = "", now = "") =>
  now.length > had.length ? now[had.length] : "";
/* its picture with the wounds it has now, made only when they changed and it's on a screen */
function wounds(o, l, i, noGore) {
  const want = noGore ? goreFree(o.want) : o.want; // (Gore off: none of them shows)
  if (o.hits === want) return;
  o.hits = want;
  o.url = zombieURL(l, i, o.hits);
  o.uk = "";
  if (!pixelOn()) o.img.src = o.url; // (the pixel look: draw() shows it, as pixels)
}
/* the zombies in a new state: where each glides to, its hits, its swipes, its death */
function seeZombies(s, ctx, now) {
  const zs = zombiesOf(s),
    sig = (s.hang.zp || []).join();
  const fresh = sig !== zpSig;
  if (fresh) {
    gap = Math.max(120, Math.min(400, snapAt ? now - snapAt : 200));
    snapAt = now;
    zpSig = sig;
  }
  const seen = new Set();
  for (const z of zs) {
    seen.add(z.i);
    let o = Z.get(z.i);
    if (!o) {
      o = zombieEl(z);
      Z.set(z.i, o);
    }
    if (fresh && (z.x !== o.tx || z.y !== o.ty)) {
      o.fx = o.x;
      o.fy = o.y;
      o.tx = z.x;
      o.ty = z.y;
      o.t0 = now;
      if (Math.hypot(z.x - o.x, z.y - o.y) > 300) o.fx = o.x = z.x; // (far: there at once)
      if (Math.abs(z.x - o.x) > 2) o.face = z.x > o.x ? 1 : -1;
    }
    const shown = !o.el.hidden; // (one no camera here sees: only its numbers change, its look waits until it's seen)
    if (z.hp < o.hp && shown && o.st !== 3)
      vibrate(o.img, hitPx(o.hp - z.hp), z.st === 3); // (a zombie hit shakes once by the HP it lost, and once more as it dies: the owner's, Nov 17, 32)
    if (z.hp < o.hp && z.st !== 3 && shown) o.img.animate(HIT, 320); // (hit: a red blink, started over without the page measuring itself)
    if (o.hp !== undefined && z.hp !== o.hp && o.st !== 3 && shown)
      popHP(o.el, z.hp - o.hp, true); // (the HP it lost or got back, small over its head: hpmeter.js)
    if (z.hp < o.hp && o.st !== 3 && shown && o.sk)
      fxHitAt(
        o.sx,
        o.sy,
        o.bh * o.sk * 0.55,
        null,
        64 * o.sk,
        BY_WOUND[newWound(o.want, (s.hang.zw || {})[z.i])],
        zombieLook(z.l).color,
      ); // (its blood: by the shot that hit it, or the wound it got (a hammer's bruise), with bits of it in its color, fx.js)
    if (
      shown &&
      o.sk &&
      newWound(o.want, (s.hang.zw || {})[z.i]) === "e" &&
      !(o.want || "").includes("e")
    )
      fxEye(o.sx, o.sy, o.bh * o.sk * 0.75, Math.random() < 0.5 ? -1 : 1); // (its eye blown out, flying)
    if (z.st === 3 && o.st !== 3) {
      o.el.classList.add("dead");
      if (((s.hang.l4nk || {}).ids || []).includes(z.i))
        o.el.classList.add("nuked"); // (the Nuke's: it lies there 15 s, css/app.css)
      o.diedAt = now;
    }
    if (z.a !== o.a && z.a > 0 && z.st === 2)
      if (seenFrom(o.x, o.y, ctx.world.inside))
        claw(o.x, o.y, z.dir / 100, ctx);
    const fire = ((s.hang.l4fire || {}).z || {})[z.i],
      lit = !!fire && fire[0] > clockNow() && z.st !== 3;
    if (o.lit !== lit) {
      o.lit = lit;
      if (lit && !o.body.querySelector(".gduck-fire"))
        o.body.insertAdjacentHTML(
          "beforeend",
          `<span class="gduck-fire" aria-hidden="true">${FLAME}</span>`,
        );
      o.el.classList.toggle("onfire", lit);
    } // (set on fire by a fireball: one big flame over it, as a duck's)
    o.want = (s.hang.zw || {})[z.i] || "";
    o.l = z.l;
    if (shown) wounds(o, z.l, z.i, s.options.noGore); // (the wounds its hits left: holes, cuts, bruises, an arrow, a chunk gone, its head blown off; l4ddart.js)
    const sh = (Math.max(0, z.hp) / (z.l[0] || 1)).toFixed(3);
    if (o.sh !== sh) {
      o.sh = sh;
      o.bar.style.setProperty("--hp", sh);
      if (+sh < 1) o.el.classList.add("hurt"); // (its HP bar shows once it has taken damage, then stays: the owner's, Nov 17. A hit: what it lost turns white, then drains fast; dead, it drains to black, then fades: css/app.css, the owner's, Nov 17 17:41Z)
    }
    o.hp = z.hp;
    o.st = z.st;
    o.k = z.k; // (the roof it climbs or walks, and its jump onto the canopy: l4ddrules.js zombieZ)
    o.j = z.j;
    o.a = z.a;
  }
  for (const [i, o] of Z)
    if (!seen.has(i)) {
      o.el.remove();
      Z.delete(i);
    }
}
/* the boards: one element for each opening, its picture redrawn when its count changes */
function seeBoards(s) {
  const brd = s.hang.brd || {};
  for (const o of OPENINGS) {
    const n = brd[o.id] || 0;
    let b = B.get(o.id);
    if (!b) {
      const el = document.createElement("div");
      el.className = "l4-boards k-" + o.kind;
      layer.append(el);
      b = { el, n: -1, box: boardsBox(o) };
      B.set(o.id, b);
    }
    if (b.n !== n) {
      b.el.innerHTML = boardsSVG(o, n);
      b.n = n;
    }
  }
}
/* ---------- the drops: on the floor, what's on now (top right), and the big words when one is taken ---------- */
function seeDrops(s) {
  const list = s.hang.l4dr || [],
    have = new Set(list.map((d) => d.n));
  for (const [n, o] of D)
    if (!have.has(n)) {
      o.el.remove();
      D.delete(n);
    }
  for (const d of list) {
    if (D.has(d.n)) continue;
    const el = document.createElement("div");
    el.className = "l4-drop k-" + d.k;
    el.innerHTML = `<i>${DROP_ICONS[d.k] || ""}</i>`;
    layer.append(el);
    D.set(d.n, { el, x: d.x, y: d.y, until: d.until });
  }
}
/* between rounds (every zombie dead, before the ducks are ready), a thin yellow square on the ground round the fireplace or
   Downpour's car: stand inside it to spin for a weapon (the owner, Nov 17) */
let sqEl = null,
  sqSig = "";
function spinSquare(s, ctx) {
  const L = s.hang.l4,
    Wd = ctx.world,
    rest = !!(sqEl && L && !L.over && L.wait);
  if (!sqEl) return;
  /* the car (or the fireplace), and on Downpour a square round each gas pump too: where something can be bought or
     done (the owner's, Nov 17 18:05Z: "the gas pumps now get a small sqaure around them in the rest phase as well") */
  const spots = [
      [BOX.zx - NEAR, BOX.y - NEAR, BOX.zx + NEAR, BOX.y + NEAR],
      ...(dp() ? PUMPS.map(pumpZone) : []),
    ],
    polys = sqEl.children;
  /* (an <svg> has no .hidden: display does it) */
  if ((sqEl.style.display !== "none") !== rest)
    sqEl.style.display = rest ? "" : "none";
  if (!rest) return;
  let sig = Wd.sc.toFixed(3);
  // (a pump's square is just where its button shows: by its south side, l4ddpower.js pumpZone)
  spots.forEach(([x0, y0, x1, y1], i) => {
    const cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2;
    const poly = polys[i];
    if (!poly) return;
    const on = seenFrom(cx, cy, Wd.inside);
    if ((poly.style.display !== "none") !== on)
      poly.style.display = on ? "" : "none";
    if (!on) return;
    const z = heightAt(cx, cy),
      pts = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]
        .map(([a, b]) => {
          const p = Wd.toScreen(a < 0 ? x0 : x1, b < 0 ? y0 : y1, z);
          return p.left.toFixed(1) + "," + p.top.toFixed(1);
        })
        .join(" ");
    sig += "|" + pts;
    if (poly.getAttribute("points") !== pts) poly.setAttribute("points", pts);
  });
  if (sig === sqSig) return;
  sqSig = sig;
  sqEl.style.setProperty("--k", Wd.sc.toFixed(3));
}
/* Justin out there, once he's dead (bled out, dead for good: nobody can revive him now): a pool of blood spreads out under him over
   JPOOL.ms (the owner's, Nov 17 18:05Z: "on death a blood pool spreads"); none with Gore off. Its own few dark ellipses,
   as flat as the floor */
const JPOOL = { ms: 6000 };
const POOL_SVG = `<svg viewBox="-60 -26 120 52" width="120" height="52">
  <ellipse cx="0" cy="0" rx="40" ry="15" fill="#5e0711"/>
  <ellipse cx="-24" cy="5" rx="22" ry="9" fill="#5e0711"/>
  <ellipse cx="26" cy="-4" rx="20" ry="9" fill="#5e0711"/>
  <ellipse cx="8" cy="10" rx="18" ry="7" fill="#5e0711"/>
  <ellipse cx="-6" cy="-3" rx="24" ry="8" fill="#7a0b17"/>
  <ellipse cx="-12" cy="-6" rx="7" ry="2" fill="#a3242c" opacity="0.6"/>
</svg>`;
let poolEl = null,
  poolAt = 0,
  poolSig = "";
function seePool(s, ctx) {
  if (!poolEl) return;
  const Wd = ctx.world,
    q = P4(s, WILD.id),
    down = !!(q && q.ex && isWild(s, WILD.id)),
    a = down && !+s.options.noGore ? Wd.at(WILD.id) : null,
    show = !!a && seenFrom(a.x, a.y, Wd.inside, a.z);
  if (!down) poolAt = 0;
  else if (!poolAt) poolAt = clockNow();
  if (poolEl.hidden !== !show) poolEl.hidden = !show;
  if (!show) return;
  const k = Math.min(1, (clockNow() - poolAt) / JPOOL.ms),
    grow = 0.15 + 0.85 * (1 - (1 - k) * (1 - k)),
    p = Wd.toScreen(a.x, a.y + 4, a.z),
    sig = `${p.left.toFixed(1)} ${p.top.toFixed(1)} ${(Wd.sc * grow).toFixed(3)}`;
  if (sig === poolSig) return;
  poolSig = sig;
  poolEl.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px) scale(${(Wd.sc * grow).toFixed(3)})`;
  poolEl.style.zIndex = a.z < 1 ? 3 : Math.round(sortY(a.x, a.y - 30, a.z)); // (on the floor under the ducks; on a roof, just under him)
}
/* Justin's pot (the owner's, Nov 17 18:05Z: the points for his kills are everyone's): a smaller line under my points,
   while he's out there with a gun or something is in it (it's split at the end of each round: l4ddrules.js potSplit) */
let potShown = "";
function seePot(s) {
  const n = potOf(s),
    q = P4(s, WILD.id),
    on =
      n > 0 ||
      !!(isWild(s, WILD.id) && s.players[WILD.id].armed && !(q && q.ex)),
    t = on ? `Justin's points for everyone: ${n}` : "";
  if (t === potShown) return;
  potShown = t;
  const el = ptsEl.querySelector(".l4-jp");
  el.textContent = t;
  el.hidden = !on;
  ptsEl.parentElement?.classList.toggle("l4-jp-on", on);
}
/* Instant Kill, Double Points, Speed Boost and Sale: each one on, by name with the seconds it has left, in a row at the
   top middle (the owner's, Nov 16), under the points (and under the Ready button between rounds). While Instant Kill is
   on, a soft blood-crimson glow breathes over the board; while Sale is, the Butler and the fireplace breathe gold */
let killEl = null;
function seeOn(s, ctx) {
  if (!onEl) return;
  const now = clockNow(),
    on = s.hang.l4on || {},
    rows = ["kill", "double", "speed", "sale"]
      .filter((k) => on[k] > now)
      .map((k) => [k, Math.ceil((on[k] - now) / 1000)]);
  const low = !!(endEl && !endEl.hidden);
  if (onEl.classList.contains("low") !== low) onEl.classList.toggle("low", low);
  const kill = on.kill > now;
  if (killEl && killEl.hidden === kill) killEl.hidden = !kill;
  const sale = saleOn(s);
  if (butler && butler.el.classList.contains("l4-sale") !== sale)
    butler.el.classList.toggle("l4-sale", sale);
  const fire = ctx && ctx.world.propEl("fireplace1");
  if (fire && fire.classList.contains("l4-sale") !== sale)
    fire.classList.toggle("l4-sale", sale);
  const sig = JSON.stringify(rows);
  if (sig === onSig) return;
  onSig = sig;
  onEl.innerHTML = rows
    .map(
      ([k, t]) =>
        `<span class="l4-on-k k-${k}"><i>${DROP_ICONS[k]}</i><em>${dropName(k)}</em><b>${t}</b></span>`,
    )
    .join("");
  onEl.hidden = !rows.length;
}
/* a duck walked over a drop: its name in big letters for everyone, and a sound (the Nuke: a white flash too) */
export function l4Got(k) {
  if (!gotEl) return;
  gotEl.innerHTML =
    k === "sale"
      ? '<span class="l4-got-gold">Sale</span>' // (in gold metal letters, the owner's, Nov 16)
      : k === "nuke"
        ? '<span class="l4-got-nuke">Nuke</span>' // (crimson blood letters that hold still, the owner's, Nov 16)
        : `<span class="l4-got-ic">${DROP_ICONS[k] || ""}</span>${rainbowHTML(dropName(k) + "!", { seed: DROPS_SEED[k] || 1 })}`;
  if (k === "ammo")
    for (const b of document.querySelectorAll(".l4s, .sp-slot")) {
      b.classList.remove("l4-flash");
      void b.offsetWidth;
      b.classList.add("l4-flash"); // (Max Ammo: every hotbar box flashes in its own color, quickly fading)
    }
  gotEl.classList.remove("on", "nuke");
  void gotEl.offsetWidth;
  gotEl.classList.add("on");
  if (k === "nuke") {
    gotEl.classList.add("nuke");
    nukeScreen(gotEl);
    sfx.nuke();
  } else sfx.dropGot();
}
/* ---------- the Nuke on the screen (owner 2026-11-16) ----------
   Grey pixel static sweeps out from the middle in a circle and covers the screen in a second (NUKE.SWEEP: the zombies
   die then, under it, so only the aftermath is drawn), flashes, fades fast, then lingers as thin drifting smoke while
   the map stays grey 7 s and slowly gets its colors back. One small canvas (a static pixel is 6 css px), drawn only
   while it lasts. With Heavy effects off: a short grey fade, no static and no grey map */
const NK = {
  PX: 6,
  SWEEP: 1000,
  FLASH: 150,
  FADE: 650,
  SMOKE: 6200,
  GREY: 7000,
  BACK: 3000,
};
function nukeScreen(at) {
  const board = at.closest(".hang-board") || at.parentElement;
  if (!board) return;
  const cv = document.createElement("canvas");
  cv.className = "l4-nuke";
  cv.setAttribute("aria-hidden", "true");
  at.before(cv);
  if (heavyOff()) {
    cv.classList.add("plain");
    setTimeout(() => cv.remove(), 1400);
    return;
  }
  const r = board.getBoundingClientRect(),
    W = Math.max(8, Math.ceil(r.width / NK.PX)),
    H = Math.max(8, Math.ceil(r.height / NK.PX)),
    g = cv.getContext("2d"),
    img = g.createImageData(W, H),
    d = img.data,
    cx = W / 2,
    cy = H / 2,
    far = Math.hypot(cx, cy) + 2,
    t0 = performance.now(),
    end = NK.SWEEP + NK.FLASH + NK.FADE + NK.SMOKE;
  cv.width = W;
  cv.height = H;
  /* the smoke's slow drift: a few big soft blobs that move and thin out */
  const blobs = Array.from({ length: 7 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: (0.18 + Math.random() * 0.22) * W,
    vx: (Math.random() - 0.5) * 0.004 * W,
    vy: -(0.002 + Math.random() * 0.003) * H,
  }));
  setTimeout(() => board.classList.add("l4-greyed"), NK.SWEEP); // (the map goes grey under the flash)
  setTimeout(() => board.classList.add("l4-greying"), NK.SWEEP + NK.GREY); // (then slowly gets its colors back)
  setTimeout(
    () => board.classList.remove("l4-greyed", "l4-greying"),
    NK.SWEEP + NK.GREY + NK.BACK,
  );
  let frame = 0;
  const step = () => {
    if (!cv.isConnected) return;
    const t = performance.now() - t0;
    if (t >= end) return cv.remove();
    frame++;
    const smoke = t > NK.SWEEP + NK.FLASH + NK.FADE;
    if (smoke && frame % 3) return requestAnimationFrame(step); // (the smoke drifts slowly: a third of the frames)
    const rad = Math.min(1, t / NK.SWEEP) * far, // (the sweep's edge)
      flash = t >= NK.SWEEP && t < NK.SWEEP + NK.FLASH,
      fade =
        t < NK.SWEEP + NK.FLASH
          ? 1
          : Math.max(0, 1 - (t - NK.SWEEP - NK.FLASH) / NK.FADE),
      left = smoke ? 1 - (t - NK.SWEEP - NK.FLASH - NK.FADE) / NK.SMOKE : 0;
    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;
    }
    for (let y = 0, i = 0; y < H; y++)
      for (let x = 0; x < W; x++, i += 4) {
        let a = 0;
        const n = Math.random();
        if (t < NK.SWEEP) {
          const dd = Math.hypot(x - cx, y - cy);
          if (dd < rad) a = dd > rad - 3 ? 1 : 0.92; // (a brighter rim at the edge)
        } else if (!smoke) a = flash ? 1 : 0.35 + 0.65 * fade;
        else {
          let m = 0;
          for (const b of blobs) {
            const q = 1 - Math.hypot(x - b.x, y - b.y) / b.r;
            if (q > m) m = q;
          }
          a = m > 0 && n < 0.35 + m ? 0.55 * m * left : 0; // (patchy: only some pixels in each blob)
        }
        const v = flash ? 200 + n * 55 : 70 + n * 120; // (grey static; nearly white for the flash itself)
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = a * 255;
      }
    g.putImageData(img, 0, 0);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const DROPS_SEED = { kill: 3, ammo: 7, nuke: 2, speed: 9, double: 4, sale: 6 };

/* my all-time stats (not in test rooms): a game once its first round starts, a round each time one is cleared, and the
   best round reached; with Round 16 Start on, its own stats (store.js statMode) */
let kzGame = "",
  kzDone = 0; // the zombies I killed this game that the all-time stats already hold
function record(s, L, cleared, me) {
  if (s.test) return;
  const st = profile.stats[statMode(s)];
  if (!st) return;
  const game = `${s.id}:${s.startedAt}:${L.g || 0}`;
  if (profile.stats.lastGame !== game) {
    profile.stats.lastGame = game;
    st.games++;
  } else if (cleared) st.rounds++; // (round 0 to 1, or to 16, isn't one cleared)
  st.titles = Math.max(st.titles || 0, L.r);
  recordKills(s, st, game, me);
  save();
}
/* Zombies killed, all time: what I killed since the last time it was written (the owner's, Nov 17 13:30Z) */
function recordKills(s, st, game, me) {
  if (kzGame !== game) {
    kzGame = game;
    kzDone = 0;
  }
  const k = ((s.hang && s.hang.l4kz) || {})[me] || 0;
  if (k > kzDone) st.kills = (st.kills || 0) + k - kzDone;
  kzDone = Math.max(kzDone, k);
}
/* ---------- the HUD: "Round N", and the end ---------- */
function seeHud(s, ctx) {
  const L = s.hang.l4;
  if (!hud || !L) return;
  if (roundShown !== L.r) {
    if (roundShown >= 0 && L.r > roundShown)
      record(s, L, L.r - roundShown === 1, ctx.me);
    hud.innerHTML = `<span class="l4-round-w">Round</span> <b>${L.r}</b>`;
    hud.classList.remove("new");
    void hud.offsetWidth;
    if (roundShown >= 0) hud.classList.add("new"); // (a new round: it pulses)
    roundShown = L.r;
  }
  /* between rounds: End turn (Ready before round 1), with how many pressed it and how many it takes */
  const w = !L.over && L.wait,
    mine = !!(w && w.v[ctx.me]),
    es = w ? [L.r, mine, waitVotes(s), waitNeed(s), startOf(s)].join() : "";
  if (es !== endSig) {
    endSig = es;
    endEl.hidden = !w;
    ctx.world.board.classList.toggle("l4-waiting", !!w);
    if (w) {
      const word = L.r === 0 ? "Ready" : "End turn",
        next = L.r === 0 ? startOf(s) : w.r;
      endEl.innerHTML = `<button type="button" class="btn ${mine ? "purple" : "yellow"}" aria-pressed="${mine}">${word}${mine ? " ✓" : ""} <span class="l4-end-n">${waitVotes(s)}/${waitNeed(s)}</span></button><span class="l4-end-say">${mine ? `Round ${next} starts when ${waitNeed(s)} ${waitNeed(s) === 1 ? "duck is" : "ducks are"} ${L.r === 0 ? "ready" : "done"}` : L.r === 0 ? `Ready for round ${next}?` : `Round ${L.r} cleared`}</span>`;
    }
  }
  const end = L.over ? JSON.stringify(L.over) + (s.hostId === ctx.me) : "";
  if (end === overShown) return;
  overShown = end;
  if (L.over && !s.test) {
    const st = profile.stats[statMode(s)];
    if (st) {
      recordKills(s, st, `${s.id}:${s.startedAt}:${L.g || 0}`, ctx.me);
      save();
    }
  } // (the game ends: the zombies of its last round count too)
  if (!L.over) {
    over.hidden = true;
    return;
  }
  const host = s.hostId === ctx.me,
    hostName = (s.players[s.hostId] || {}).name || "the host";
  /* from the vote or Random, the room moves on by itself after a moment (rules.js L4_OVER_MS) */
  const moving = votesDue(s).length || s.options.modePick === "random";
  over.innerHTML = `<div class="l4-over-card"><h2>Everyone's down</h2><p>You made it to <b>Round ${L.over.r}</b>.</p>${
    moving
      ? `<p class="small dim">${votesDue(s).length ? "On to the vote in a moment." : "On to the next game in a moment."}</p>`
      : host
        ? '<div class="l4-over-btns"><button type="button" class="btn yellow" data-l4="again">Play again</button><button type="button" class="btn" data-a="lobby">Back to the lobby</button></div>'
        : `<p class="small dim">Waiting for ${nameHTML(hostName)} to play again or go back to the lobby.</p>`
  }</div>`;
  over.hidden = false;
}

/* ---------- the dark ---------- */
/* one soft light, drawn once: every light's hole in the dark is this, sized and faded (instead of a new gradient for
   each light on every frame) */
let STAMP = null;
function stamp() {
  if (STAMP) return STAMP;
  const n = 128,
    c = document.createElement("canvas");
  c.width = c.height = n;
  const x = c.getContext("2d"),
    rg = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  rg.addColorStop(0, "rgba(0,0,0,1)");
  rg.addColorStop(0.45, "rgba(0,0,0,0.8)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = rg;
  x.fillRect(0, 0, n, n);
  return (STAMP = c);
}
/* where duck id points its flashlight, on the floor: [dx, dy] (to the right when it doesn't say) */
function aimOf(s, id, ctx) {
  const pos = s.pos[id],
    aim =
      id === ctx.me ? ctx.duck() && ctx.duck().aim : pos && [pos.ax, pos.ay];
  let dx = aim && aim[0] !== undefined ? aim[0] * W : 0,
    dy = aim && aim[1] !== undefined ? aim[1] * H : 0;
  if (Math.hypot(dx, dy) < 1e-6) [dx, dy] = [1, 0];
  return [dx, dy];
}
let CTX = null, // (the screen's camera and state, as paint() last had them)
  BEAMS = []; // (every flashlight on now: [x, y, its angle] on the floor)
/* is (x, y) on the floor in a flashlight's beam (and no wall between)? */
export function inBeam(x, y) {
  for (const [bx, by, t] of BEAMS) {
    const dx = x - bx,
      dy = y - by,
      d = Math.hypot(dx, dy);
    if (d > CONE.far || d < 1) continue;
    const off = Math.abs(
      ((Math.atan2(dy, dx) - t + 3 * Math.PI) % (2 * Math.PI)) - Math.PI,
    );
    if (off < CONE.half && rayTo(bx, by, dx / d, dy / d, d) >= d - 8)
      return true;
  }
  return false;
}
/* a gun's laser sight (owner, Nov 16): where it ends on the screen, [x, y] css px, at the end of duck id's flashlight
   along its aim (a wall stops it, as it stops the light); null when that duck's light is off, it's down or a ghost */
export function laserEnd(id) {
  const ctx = CTX,
    s = ctx && ctx.state();
  if (!s || !s.hang || !s.pos[id] || !up(s, id) || (s.hang.l4f || {})[id])
    return null;
  const Wd = ctx.world,
    a = Wd.at(id);
  if (!a || !seenFrom(a.x, a.y, Wd.inside, a.z)) return null;
  const [dx, dy] = aimOf(s, id, ctx),
    l = Math.hypot(dx, dy),
    d = rayTo(a.x, a.y, dx / l, dy / l, CONE.far),
    e = Wd.toScreen(a.x + (dx / l) * d, a.y + (dy / l) * d, a.z + 26);
  return [e.left, e.top];
}
/* other ducks' names show only while a flashlight (anyone's but their own) reaches them (the owner's, Nov 16; the CSS
   puts them small over the head, and always shows them on a phone, which has no flashlight). beams: [id, x, y, angle,
   each ray's reach], from paint() */
let litSig = "";
function litNames(s, ctx, beams) {
  const Wd = ctx.world,
    rays = beams.length ? beams[0][4].length - 1 : 0,
    lit = [];
  for (const id of s.seat) {
    if (id === ctx.me) continue;
    const a = Wd.at(id);
    if (!a) continue;
    for (const [by, x, y, t, ds] of beams) {
      if (by === id) continue;
      const dx = a.x - x,
        dy = a.y - y,
        d = Math.hypot(dx, dy);
      let u = Math.atan2(dy, dx) - t;
      u = Math.atan2(Math.sin(u), Math.cos(u)); // (-pi to pi)
      if (d > CONE.far || Math.abs(u) > CONE.half) continue;
      const k = Math.round(((u + CONE.half) / (2 * CONE.half)) * rays);
      if (d <= ds[k] + 20) {
        lit.push(id);
        break;
      }
    }
  }
  const sig = lit.join();
  if (sig === litSig) return;
  litSig = sig;
  for (const el of Wd.board.querySelectorAll(".gduck[data-pid]"))
    el.classList.toggle("l4-lit", lit.includes(el.dataset.pid));
}
/* ---------- Downpour: the church bell and the roof's flare, as each round starts (the owner's, Nov 17 12:28Z) ----------
   The bell swings to its own strikes (l4ddsfx.js bellStrikes: when each sounds): out to one side on a strike, through
   the middle and out to the other on the next, settling after the last. Its drawing is one of BELL_ANGLES, the nearest */
const SWING = 30, // degrees out at a strike
  SWING_IN = 0.6, // strikes' gaps it takes to swing all the way out
  SWING_OUT = 1.2; // how fast it settles after the last (larger: sooner)
let bellEl = null,
  bellLook = 0;
function bellSwing(ctx, now) {
  if (!bellEl || !bellEl.isConnected) {
    if (now - bellLook < 500) return; // (only made while the tower is near the view: world.js)
    bellLook = now;
    bellEl = ctx.world.board.querySelector('.hp-tower[data-part="bell"]');
    if (!bellEl) return;
  }
  const t = bellStrikes();
  let a = 0;
  if (t) {
    const gap = (t[t.length - 1] - t[0]) / (t.length - 1),
      u = (now - t[0]) / gap,
      last = t.length - 1,
      k =
        u < 0
          ? 0
          : u < SWING_IN
            ? u / SWING_IN
            : u <= last
              ? 1
              : Math.exp(-(u - last) * SWING_OUT);
    if (k > 0.03) a = SWING * k * Math.cos(Math.PI * u); // (a strike at every whole u: out at one side or the other)
  }
  let best = BELL_REST;
  BELL_ANGLES.forEach((v, i) => {
    if (Math.abs(v - a) < Math.abs(BELL_ANGLES[best] - a)) best = i;
  });
  ctx.world.frameOf(bellEl, best);
}
/* the dead soldier's flare on the gas station's roof lights as the bell starts and burns red a while: a glow, sparks
   and smoke (the light it throws: paint) */
const FLARE_MS = 14000;
let flareEl = null,
  fxAt = 0;
const flareOn = (now) => {
  const t = bellStrikes();
  return !!t && now >= t[0] && now < t[0] + FLARE_MS;
};
function flareDraw(ctx, now) {
  const Wd = ctx.world,
    on = dp() && !Wd.inside && flareOn(now);
  if (!on) {
    if (flareEl && !flareEl.hidden) flareEl.hidden = true;
    return;
  }
  if (!flareEl || !flareEl.isConnected) {
    flareEl = document.createElement("div");
    flareEl.className = "l4-flare";
    flareEl.setAttribute("aria-hidden", "true");
    layer.append(flareEl);
  }
  if (flareEl.hidden) flareEl.hidden = false;
  const p = Wd.toScreen(FLARE.x, FLARE.y, STATION.wall + 4),
    left = (now - bellStrikes()[0]) / FLARE_MS; // (0 lit … 1 out)
  flareEl.style.transform = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
  flareEl.style.setProperty("--k", Wd.sc.toFixed(3));
  flareEl.style.setProperty(
    "--f",
    (left > 0.85 ? (1 - left) / 0.15 : 1).toFixed(2),
  ); // (dying down at the end)
  flareEl.style.zIndex = Math.round(STATION.y1) + 60; // (over the roof it lies on: world.js gives the roof its south edge, and a little)
  if (now - fxAt > 70 && left < 0.92) {
    fxAt = now;
    fxSparks(p.left, p.top, 2 * Wd.sc, 1);
    if (Math.random() < 0.35) fxSteam(p.left, p.top - 6 * Wd.sc);
  }
}
function paint(now, ctx) {
  CTX = ctx;
  const Wd = ctx.world,
    s = ctx.state(),
    q = pixelOn() ? 1 / (gridPx() * (low() ? 2 : 1)) : low() ? 0.22 : 0.3, // (the dark is all soft light: a small canvas stretched over the board looks the same, and every frame it's redrawn costs far less. The pixel look: one of its pixels is one of the grid's, or two by two on Low graphics)
    w = Math.round(Wd.vw * q),
    h = Math.round(Wd.vh * q),
    sc = Wd.sc * q,
    ln = lightNow(now),
    holes = [],
    cones = [],
    beams = []; // (the same flashlights in the world's px, for the names: litNames)
  const on = (x, y, r) => x + r > 0 && x - r < w && y + r > 0 && y - r < h;
  lits();
  const lights = powerOn(s) ? LIT_ON : LIT;
  for (const l of Wd.inside ? lights.in : lights.out) {
    const fl = sway(l, ln),
      p = Wd.toScreen(l.x, l.y, heightAt(l.x, l.y) + (l.z || 0)),
      x = p.left * q,
      y = p.top * q,
      r = l.r * 0.9 * fl * sc;
    if (on(x, y, r))
      holes.push([x, y, r, Math.min(0.72, l.k * 1.45) * fl * stutterOf(l, ln)]); // (dimmer than Hangout's blackout: the owner wants it very dark)
  }
  /* each opening lets a little moonlight in, more as its boards come down: the way in shows in the dark */
  const brd = s.hang.brd || {},
    mn = MOON(); // (first: it brings OPENINGS up to the map in play, before they're gone through)
  for (const o of OPENINGS) {
    if (!mn[o.id]) continue;
    const [x0, y0] = mn[o.id];
    if (inCabin(x0, y0) !== Wd.inside) continue;
    const p = Wd.toScreen(x0, y0, heightAt(x0, y0)),
      r = 120 * sc;
    if (on(p.left * q, p.top * q, r))
      holes.push([
        p.left * q,
        p.top * q,
        r,
        0.2 + 0.05 * (5 - (brd[o.id] ?? 5)),
      ]);
  }
  /* Justin's Butler stands in a little light, and the fireplace's weapon glows while it's out */
  if (dp() || Wd.inside) {
    const p = Wd.toScreen(BUTLER.x, BUTLER.y, 30);
    if (
      seenFrom(BUTLER.x, BUTLER.y, Wd.inside) &&
      on(p.left * q, p.top * q, 100 * sc)
    )
      holes.push([p.left * q, p.top * q, 100 * sc, 0.5]);
    if (boxNow(s, clockNow()) && seenFrom(BOX.sx, BOX.sy, Wd.inside)) {
      const o = Wd.toScreen(BOX.sx, BOX.sy, BOX.sz);
      holes.push([o.left * q, o.top * q, 130 * sc, 0.6]);
    }
  }
  /* the roof's flare, while it burns */
  const pt = performance.now();
  if (dp() && !Wd.inside && flareOn(pt)) {
    const p = Wd.toScreen(FLARE.x, FLARE.y, STATION.wall + 4),
      r = 260 * sc * (0.92 + 0.08 * Math.sin(pt / 53));
    if (on(p.left * q, p.top * q, r))
      holes.push([p.left * q, p.top * q, r, 0.55]);
  }
  /* the Angel machine and the power box glow (css: crimson and electric yellow, the owner's Nov 17), so a soft light
     breathes round each of them in the dark too */
  {
    const br = 0.5 + 0.5 * Math.sin((performance.now() / 2600) * 2 * Math.PI);
    for (const [x, y, z, r] of [
      [ANGEL.X, ANGEL.Y, ANGEL.Z + 70, 90],
      [PW.X, PW.Y, heightAt(PW.X, PW.Y) + 70, 80],
    ]) {
      if (!seenFrom(x, y, Wd.inside)) continue;
      const p = Wd.toScreen(x, y, z);
      if (on(p.left * q, p.top * q, r * sc))
        holes.push([p.left * q, p.top * q, r * sc, 0.32 + 0.16 * br]);
    }
  }
  /* the drops glow on the floor */
  for (const o of D.values()) {
    if (!seenFrom(o.x, o.y, Wd.inside)) continue;
    const p = Wd.toScreen(o.x, o.y, 30),
      r = DROP_LIGHT.r * sc;
    if (on(p.left * q, p.top * q, r))
      holes.push([p.left * q, p.top * q, r, DROP_LIGHT.k]);
  }
  /* every duck: a faint glow round it, and its flashlight (not a ghost's, not a downed duck's, not one switched off) */
  const off = s.hang.l4f || {},
    rays = low() ? 12 : 22;
  BEAMS = [];
  for (const id of s.seat) {
    const a = Wd.at(id),
      pos = s.pos[id];
    if (!a || !pos || !seenFrom(a.x, a.y, Wd.inside, a.z)) continue;
    const p4 = P4(s, id);
    if (p4 && p4.gh) continue;
    const c = Wd.toScreen(a.x, a.y, a.z + 26);
    holes.push([c.left * q, c.top * q, GLOW * sc, 0.55]);
    if (!up(s, id) || off[id]) continue;
    if (!on(c.left * q, c.top * q, CONE.far * sc)) continue; // (its light can't reach the screen: no rays)
    const [dx, dy] = aimOf(s, id, ctx),
      t = Math.atan2(dy, dx),
      roof = !!deckAt(a.x, a.y, a.z), // (up on a roof: over the walls, nothing stops it)
      pts = [],
      ends = []; // (the same rays on the floor in world px, on into the wall each one stops at: shineProps)
    for (let k = 0; k <= rays; k++) {
      const u = t - CONE.half + (2 * CONE.half * k) / rays,
        ux = Math.cos(u),
        uy = Math.sin(u),
        d = roof ? CONE.far : rayTo(a.x, a.y, ux, uy, CONE.far),
        e = Wd.toScreen(a.x + ux * d, a.y + uy * d, a.z),
        d2 = d < CONE.far - 1 ? d + 26 : d; // (a wall is 24 thick)
      pts.push([e.left * q, e.top * q, d]);
      ends.push([a.x + ux * d2, a.y + uy * d2]);
    }
    const o = Wd.toScreen(a.x, a.y, a.z);
    cones.push([
      o.left * q,
      o.top * q,
      pts,
      CONE.far * sc,
      [a.x, a.y, ends],
      roof,
    ]);
    BEAMS.push([a.x, a.y, t]);
    beams.push([id, a.x, a.y, t, pts.map((e) => e[2])]);
  }
  /* a duck or a zombie in a beam is as bright as the beam's middle, all of it (owner, Nov 16: "zombie ducks and players
     should become a matching brightness of the flashlight when they are in it") */
  if (BEAMS.length) {
    const lit = (x, y, z, k) => {
      if (!inBeam(x, y)) return;
      const p = Wd.toScreen(x, y, z + 30 * k);
      if (on(p.left * q, p.top * q, 50 * sc))
        holes.push([p.left * q, p.top * q, 50 * sc * k, 0.92]);
    };
    for (const id of s.seat) {
      const a = Wd.at(id);
      if (a && s.pos[id] && seenFrom(a.x, a.y, Wd.inside, a.z))
        lit(a.x, a.y, a.z, 1);
    }
    for (const o of Z.values())
      if (!o.el.hidden && o.st !== 3) lit(o.x, o.y, heightAt(o.x, o.y), 1.1);
  }
  litNames(s, ctx, beams);
  const f = (v) => v.toFixed(1),
    key = [
      w,
      h,
      ...holes.map((o) => f(o[0]) + f(o[1]) + f(o[2]) + o[3].toFixed(2)),
      ...cones.map(
        (c) => f(c[0]) + f(c[1]) + c[2].map((p) => f(p[0]) + f(p[1])).join(),
      ),
    ].join();
  if (key === drawn) return;
  drawn = key;
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
    cv.style.imageRendering = pixelOn() ? "pixelated" : "";
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, w, h);
  g.fillStyle = `rgba(3,4,10,${powerOn(s) ? DARK_ON : DARK})`;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-out";
  const st = stamp();
  for (const [x, y, r, k] of holes) {
    g.globalAlpha = Math.min(1, k);
    g.drawImage(st, x - r, y - r, 2 * r, 2 * r);
  }
  g.globalAlpha = 1;
  /* a cone: three passes, each a little narrower, so its middle is as bright as the lights on and its edges soft. On Low
     graphics or Data saving: one pass, one plain shade, about as bright as the soft one on average */
  if (low()) {
    g.fillStyle = "rgba(0,0,0,.55)";
    for (const [ox, oy, pts] of cones) {
      g.beginPath();
      g.moveTo(ox, oy);
      for (const p of pts) g.lineTo(p[0], p[1]);
      g.closePath();
      g.fill();
    }
    shineProps(Wd, cones, q);
    g.globalCompositeOperation = "source-over";
    return;
  }
  for (const [ox, oy, pts, far] of cones) {
    const rg = g.createRadialGradient(ox, oy, 0, ox, oy, far);
    rg.addColorStop(0, "rgba(0,0,0,.62)");
    rg.addColorStop(0.7, "rgba(0,0,0,.55)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    const n = pts.length - 1;
    for (const cut of [0, 0.18, 0.34]) {
      const a = Math.round(n * cut),
        b = n - a;
      g.beginPath();
      g.moveTo(ox, oy);
      for (let k = a; k <= b; k++) g.lineTo(pts[k][0], pts[k][1]);
      g.closePath();
      g.fill();
    }
  }
  shineProps(Wd, cones, q);
  g.globalCompositeOperation = "source-over";
}
/* a flashlight lights what it points at, not just the floor (the owner, Nov 17): the part of each prop's footprint inside
   a cone (on into the wall a ray stops at), raised up the prop's height, so its front and its top show in the light as
   bright as the floor there. paint() has the dark cutting (destination-out) */
function shineProps(Wd, cones, q) {
  const sc = Wd.sc * q,
    plain = low();
  for (const c of cones) {
    if (c[5]) continue; // (from up on a roof: the roof's top is all it lights)
    const [ax, ay, ends] = c[4],
      poly = [[ax, ay], ...ends];
    let x0 = ax,
      y0 = ay,
      x1 = ax,
      y1 = ay;
    for (const [x, y] of ends) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    for (const p of litProps()) {
      let l = p.x,
        r = p.x + p.w;
      if (p.kind === "fence") {
        const t = fenceLean(p, W); // (its top leans out toward the map's edge: all of that lights)
        if (t > 0) r += t;
        else l += t;
      }
      if (l > x1 || r < x0 || p.y > y1 || p.y + p.d < y0) continue;
      const el = Wd.propEl(p.id); // (only what's drawn now: not what's left out of this map, or hidden from in here)
      if (!el || el.hidden) continue;
      const part = clipBox(poly, l, p.y, r, p.y + p.d);
      if (!part) continue;
      /* as bright as the cone's floor that far out (its three passes: about 0.9 near, fading out from 0.7 of the way) */
      let mx = 0,
        my = 0;
      for (const [x, y] of part) {
        mx += x / part.length;
        my += y / part.length;
      }
      const u = Math.hypot(mx - ax, my - ay) / CONE.far,
        k = plain ? 0.55 : u < 0.7 ? 0.9 : (0.9 * (1 - u)) / 0.3;
      if (k < 0.03) continue;
      const lo = part.map(([x, y]) => {
          const e = Wd.toScreen(x, y, p.z);
          return [e.left * q, e.top * q];
        }),
        H = p.h * sc,
        hi = lo.map(([x, y]) => [x, y - H]);
      /* the footprint, its copy at the top, and the band each edge sweeps between them, all wound the same way so they
         add up (nonzero) */
      g.globalAlpha = Math.min(1, k);
      g.beginPath();
      const shape = (s) => {
        let a2 = 0;
        for (let n = 0; n < s.length; n++) {
          const [xa, ya] = s[n],
            [xb, yb] = s[(n + 1) % s.length];
          a2 += xa * yb - xb * ya;
        }
        if (Math.abs(a2) < 1e-3) return;
        if (a2 < 0) s = s.slice().reverse();
        g.moveTo(s[0][0], s[0][1]);
        for (let n = 1; n < s.length; n++) g.lineTo(s[n][0], s[n][1]);
        g.closePath();
      };
      shape(lo);
      shape(hi);
      for (let n = 0; n < lo.length; n++) {
        const m = (n + 1) % lo.length;
        shape([lo[n], lo[m], hi[m], hi[n]]);
      }
      g.fillStyle = "#000";
      g.fill("nonzero");
    }
  }
  g.globalAlpha = 1;
}

/* ---------- Justin's Butler, standing by the card table ---------- */
/* the Butler is small (the pixel look shrank him by mistake and the owner loved it, Nov 16: kept); Justin isn't */
const BUTLER_K = 0.7, // (about the size he showed at on a computer)
  PRIEST_K = 1; // (Downpour's Priest: as big as a player's duck, the owner's, Nov 17 05:46Z)
function butlerEl(svg = butlerSVG({ size: 64 }), name = BUTLER_NAME) {
  const v = svg
      .match(/viewBox="([^"]+)"/)[1]
      .split(" ")
      .map(Number),
    h = (64 * v[3]) / v[2],
    feet = (64 * (v[3] - 10)) / v[2],
    el = document.createElement("div");
  el.className = "hang-npc duck l4-butler";
  const url = svgDataURL(svg);
  el.innerHTML = `<div class="hang-npc-body"><img alt="" draggable="false" src="${url}" style="width:100%;height:100%"></div><span class="gduck-name hang-npc-name">${nameHTML(name)}</span>`;
  const body = el.firstChild;
  body.style.width = "64px";
  body.style.height = h.toFixed(1) + "px";
  body.style.left = "-32px";
  body.style.top = (-feet).toFixed(1) + "px";
  body.style.transformOrigin = `32px ${feet.toFixed(1)}px`;
  layer.append(el);
  return { el, body, url, bh: h };
}

/* a secret (not in Updates): a zebra cake in the toilet's bowl, and Justin teleported in beside it, eating it for as
   long as it lasts (the rules' s.zcake.toilet) */
const EGG = { x: TOILET.x + 62, y: TOILET.y + 78 }; // (where he stands: in front of the sink, facing the bowl)
let egg = null;
function drawEgg(ctx, now) {
  const s = ctx.state(),
    c = s.zcake,
    on = !!(c && c.toilet && !c.eat && now >= c.stop),
    Wd = ctx.world,
    z = heightAt(EGG.x, EGG.y),
    p = Wd.toScreen(EGG.x, EGG.y, z),
    sc = Wd.sc;
  if (on !== !!egg.on) {
    egg.on = on;
    if (Wd.inside) {
      const n = document.createElement("div");
      n.className = "mgj-tp";
      n.style.cssText = `left:${p.left.toFixed(1)}px;top:${p.top.toFixed(1)}px;width:${(90 * sc).toFixed(0)}px;z-index:${Math.round(sortY(EGG.x, EGG.y, z)) + 12}`;
      n.innerHTML = TELEPORT;
      (fxl || layer).append(n);
      setTimeout(() => n.remove(), 600);
      const me = ctx.duck();
      if (me && Math.hypot(me.x * W - EGG.x, me.y * H - EGG.y) < 1200)
        sfx.teleport();
    } // (a blue flash as he comes and goes)
    egg.chomp = now + 400;
  }
  const hide = !on || !Wd.inside || !Wd.seen(p.left - 40, p.top - 90, 80, 110);
  if (egg.el.hidden !== hide) egg.el.hidden = hide;
  if (hide) return;
  const tr = `translate(${at(p.left)}px, ${at(p.top)}px)`;
  if (egg.tr !== tr) {
    egg.tr = tr;
    egg.el.style.transform = tr;
    egg.el.style.zIndex = Math.round(sortY(EGG.x, EGG.y, z)) + 10;
  }
  const gd = Wd.board.querySelector(".gduck .gduck-body"),
    k = gd && gd.offsetWidth ? gd.offsetWidth / 64 : sc; // (as big as the ducks are drawn)
  pxPic(egg, egg.body.firstChild, 64 * k, egg.bh * k);
  if (egg.k !== k) {
    egg.k = k;
    egg.body.style.transform = `scale(${(-k).toFixed(4)}, ${k.toFixed(4)})`; // (facing left, toward the bowl)
    egg.el.style.setProperty("--nt", (2 * k).toFixed(1) + "px");
  }
  if (now >= egg.chomp) {
    egg.chomp = now + 1100;
    const me = ctx.duck();
    if (me && Math.hypot(me.x * W - EGG.x, me.y * H - EGG.y) < 900) sfx.chomp();
  } // (a bite now and then)
}

/* ---------- the fireplace's weapon ---------- */
/* what it shows at `now`: flickering through the weapons, fast and then slower (the same on every screen), until it
   lands on the one the host picked; [weapon, landed] */
const FLICKS = 30;
function boxShows(b, now, s) {
  const u = (now - b.t) / BOX.spin;
  if (u >= 1) return [b.w, true];
  const f = Math.floor(FLICKS * (1 - Math.pow(1 - Math.max(0, u), 2))),
    sl = slotsOf(s, b.by),
    pool = POOL.filter((w) => !sl.includes(w)); // (never a weapon its duck has: the owner's, Nov 4)
  return [pool[(b.t + f) % pool.length] || b.w, false];
}
function drawBox(ctx) {
  const s = ctx.state(),
    now = clockNow(),
    b = boxNow(s, now, ctx.me) || boxNow(s, now), // (mine, else the newest anyone spun)
    Wd = ctx.world;
  if (!b || !(Wd.inside || dp())) {
    // (the cabin's is by the fireplace, inside; Downpour's outside, behind the car: it never showed there till Nov 17)
    if (!boxEl.hidden) boxEl.hidden = true;
    if (!b) {
      boxSig = "";
      boxSpun = false;
    }
    return;
  }
  const [w, landed] = boxShows(b, now, s),
    sig = w + (landed ? "!" : "") + b.t;
  if (sig !== boxSig) {
    const first = !boxSig;
    boxSig = sig;
    boxEl.querySelector(".l4-box-orb").innerHTML = isPw(w)
      ? pwOrbHTML(w)
      : orbHTML(w); // (a part for the power box, or a jerry can: l4ddpowerui.js)
    const me = ctx.duck(),
      close =
        me && Math.hypot(me.x * W - BOX.x, me.y * H - BOX.y) < 900 && !first;
    if (landed && boxSpun && close) sfx.ping();
    else if (!landed && close) sfx.tick();
    boxSpun = !landed;
    const P = s.players[b.by] || {};
    boxEl.querySelector(".l4-box-who").innerHTML = nameHTML(
      P.name || "",
      P.nameStyle || {},
    );
  }
  boxEl.classList.toggle("landed", landed);
  boxEl.classList.toggle(
    "ending",
    landed && b.t + BOX.spin + BOX.keep - now < 3000,
  ); // (its last 3 seconds: it blinks)
  const sc = Wd.sc,
    p = Wd.toScreen(BOX.sx, BOX.sy, BOX.sz),
    hide =
      !seenFrom(BOX.sx, BOX.sy, Wd.inside) ||
      !Wd.seen(p.left - 60, p.top - 80, 120, 140);
  if (boxEl.hidden !== hide) boxEl.hidden = hide;
  if (hide) return;
  const tr = `translate(${at(p.left)}px, ${at(p.top)}px)`;
  if (boxEl._tr !== tr) {
    boxEl._tr = tr;
    boxEl.style.transform = tr;
    boxEl.style.zIndex = Math.round(sortY(BOX.sx, BOX.sy + 6, 0)) + 20;
  }
  if (boxEl._k !== sc) {
    boxEl._k = sc;
    boxEl.style.setProperty("--k", sc.toFixed(3));
  }
}

/* ---------- my points, and big words when something can't be done ---------- */
function seePts(s, ctx) {
  const n = ptsOf(s, ctx.me);
  if (n === ptsShown) return;
  const got = ptsShown >= 0 && n > ptsShown ? n - ptsShown : 0;
  ptsShown = n;
  ptsEl.querySelector("b").textContent = n;
  if (got) {
    const dbl = !!((s.hang.l4on || {}).double > clockNow()); // (Double Points: glowing yellow, a little bigger)
    const pop = document.createElement("span");
    pop.className =
      "l4-pts-pop" + (got >= 25 ? " big" : "") + (dbl ? " dbl" : "");
    pop.textContent = "+" + got;
    ptsEl.append(pop);
    setTimeout(() => pop.remove(), 900);
    /* and a small one over my own duck, only for me (the owner's, Nov 16) */
    const d = ctx.world.board.querySelector(".gduck.mine");
    if (d) {
      const q = document.createElement("span");
      q.className = "l4-duck-pop" + (dbl ? " dbl" : "");
      q.setAttribute("aria-hidden", "true");
      q.textContent = "+" + got;
      const b = d.querySelector(".gduck-body");
      q.style.top =
        (b
          ? Math.round(
              b.getBoundingClientRect().top - d.getBoundingClientRect().top,
            )
          : 0) + "px"; // (over its head)
      d.append(q);
      setTimeout(() => q.remove(), 900);
    }
  }
}

/* ---------- Safe Keeping (the owner's, Nov 16) ----------
   A duck it's getting up glows a heavenly light blue; up, for SAFE.INV ms its picture softly breathes see-through in
   that glow and nothing hurts it, while my own screen counts down from 6, then says "Vitals Stabilized" */
let vitEl = null,
  vitShown = "",
  hintEl = null;
function safeLook(ctx) {
  const s = ctx.state(),
    now = clockNow(),
    p4 = s.hang.l4p || {},
    inv = s.hang.l4inv || {};
  for (const d of ctx.world.board.querySelectorAll(".ducks .gduck[data-pid]")) {
    const id = d.dataset.pid,
      sk = !!(p4[id] && p4[id].skAt),
      on = inv[id] > now;
    if (d.classList.contains("l4-skglow") !== sk)
      d.classList.toggle("l4-skglow", sk);
    const bj = id === wildFor(s) && !!(s.hang.l4 && s.hang.l4.wait); // (Justin out there, in the rest phase: a light blue glow, click to buy him a gun)
    if (d.classList.contains("l4-buyj") !== bj)
      d.classList.toggle("l4-buyj", bj);
    if (d.classList.contains("l4-inv") !== on) d.classList.toggle("l4-inv", on);
  }
  if (!vitEl) {
    vitEl = document.createElement("div");
    vitEl.className = "l4-vitals";
    vitEl.setAttribute("role", "status");
    vitEl.hidden = true;
    ctx.world.board.append(vitEl);
  }
  const until = inv[ctx.me] || 0,
    left = Math.ceil((until - now) / 1000),
    word =
      left > 0
        ? String(Math.min(6, left))
        : until && now - until < 1800
          ? "Vitals Stabilized"
          : "";
  if (word !== vitShown) {
    vitShown = word;
    vitEl.textContent = word;
    vitEl.hidden = !word;
    vitEl.classList.toggle("done", left <= 0);
  }
}
/* a click or a key on Safe Keeping in the hotbar: it can't be used by hand, so a note says how it works, only to me,
   at the bottom left (game.js' l4Pick) */
export function l4SafeHint() {
  const board = document.querySelector(".hang-board.l4-board");
  if (!board) return;
  if (!hintEl || !hintEl.isConnected) {
    hintEl = document.createElement("div");
    hintEl.className = "l4-hint";
    hintEl.setAttribute("role", "status");
    board.append(hintEl);
  }
  hintEl.innerHTML =
    "<b>Safe Keeping</b>: when you go down you keep what you bought, and <kbd>E</kbd> gets you up.";
  hintEl.classList.remove("on");
  void hintEl.offsetWidth;
  hintEl.classList.add("on");
}

/* ---------- under my duck's sprint bar (the owner's, Nov 16) ----------
   A second, white bar: the cooldown running now, shrinking as it runs out (a reload, the melee weapon's swing, a
   shotgun's or a sniper's wait between shots (the owner's, Nov 17), or an item's 0.75 s: the longest one when two run
   at once); hidden when none is. And under it, when I switch slots, a
   tiny grey row of what's in my slots, the one in hand bright, that slides in and quickly fades */
function coolBar(tag, s, me) {
  const m = kitOf(s, me),
    now = clockNow();
  let left = 0,
    all = 1;
  if (m) {
    if (m.rl > now && m.rw && (ARMS[m.rw] || m.rw === "dg")) {
      left = m.rl - now;
      all = m.rt || reloadOf(s, me, m.rw === "dg" ? "handgun" : m.rw); // (the down pistol's: the pistol's)
    }
    for (const [w, t] of Object.entries(m.u || {})) {
      const k = kindOf(w);
      if (
        !ARMS[w] ||
        (k === "ranged" && (ARMS[w].auto || l4Cool(s, me, w) < 300))
      )
        continue; // (a fast gun's wait between shots is too quick to show; a shotgun's or a sniper's shows, the owner's Nov 17)
      const c = l4Cool(s, me, w),
        l = t + c - now;
      if (l > left) {
        left = l;
        all = c;
      }
    }
  }
  let el = tag.querySelector(".l4-cool");
  if (!el) {
    el = document.createElement("span");
    el.className = "l4-cool";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = "<i></i>";
    tag.append(el);
  }
  const v = left > 0 ? Math.min(1, left / all).toFixed(3) : "0";
  if (el._v !== v) {
    el._v = v;
    el.style.setProperty("--cl", v);
    el.classList.toggle("off", v === "0");
  }
}
/* the ammo of what's in my hand, for the yellow bar (meters.js): { f, rl, dry, nr: a reload can't be done } or null (a melee weapon, the Laser
   Rifle: its heat has its own meter, the jetpack) */
export function l4Ammo(s, me, w) {
  const m = kitOf(s, me),
    now = clockNow();
  if (!m) return null;
  if (downArmed(s, me)) w = "dg"; // (down: the down pistol)
  const rl = !!w && m.rw === w && m.rl > now;
  if (w === "dg")
    return m.dg === undefined
      ? null
      : { f: rl ? 0 : m.dg / ARMS.handgun.mag, rl, dry: false }; // (its bullets never run out)
  if (w === "grenade")
    return { f: m.g / ARMS.grenade.most, rl: false, dry: m.g <= 0 };
  if (!w || !ARMS[w] || kindOf(w) !== "ranged" || w === "laser") return null;
  const c = (m.am || {})[w];
  if (!c) return null;
  if (w === "flamer") return { f: c[0] / ARMS.flamer.all, rl, dry: c[0] <= 0 }; // (its tank)
  const mag = magIn(m, w);
  if (mag)
    return {
      f: rl ? 0 : c[0] / mag,
      rl,
      dry: !rl && c[0] <= 0 && c[1] <= 0,
      nr: !rl && c[1] <= 0 && c[0] < mag, // (no ammo left to reload it with)
    };
  const all = (fullFor(s, me, w) || [0])[0];
  return all > 1 ? { f: c[0] / all, rl: false, dry: c[0] <= 0 } : null; // (the bow: its arrows left)
}
let dryW = "";
/* the yellow bar under my duck, and the bars stacked (meters.js); a gun just run dry, its reload can't be done: the
   white bar flashes red */
function ammoBars(tag, s, me) {
  const w = heldFn() || "",
    a = l4Ammo(s, me, w),
    dry = a && a.dry ? w : "";
  if (dry && dry !== dryW && w !== "grenade") noReload();
  dryW = dry;
  ammoBar(tag, a);
  stackBars(tag);
}
/* a slot switch: a small box under my duck, the phone's slider in little (hotbar.js, the same slots in their colors): it
   scrolls from the slot I had to the one now in hand, the one in the middle bigger, then fades out quickly (the
   owner, Nov 17: on a computer and a phone) */
let peekW = null;
function peek(tag, s, me) {
  const m = kitOf(s, me),
    w = heldFn() || "";
  if (!m || w === peekW) return;
  const first = peekW === null,
    was = peekW;
  peekW = w;
  if (first) return; // (not when the game starts: only a switch)
  let el = tag.querySelector(".l4-peek");
  if (!el) {
    el = document.createElement("span");
    el.className = "l4-peek";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<span class="sp-slide"><span class="sp-track"></span></span>';
    tag.append(el);
  }
  const list = [
    ...m.sl.map((x, i) => (x ? [x, `k-${SLOT_KINDS[i]}`] : null)),
    m.g > 0 ? ["grenade", "k-grenade"] : null,
  ].filter(Boolean);
  const to = Math.max(
      0,
      list.findIndex(([x]) => x === w),
    ),
    from = list.findIndex(([x]) => x === was),
    track = el.querySelector(".sp-track");
  track.innerHTML = list
    .map(
      ([x, cls]) =>
        `<span class="sp-slot ${cls}"><i>${angelOf(s, me, x) ? angelic(weaponIcon(x, (s.players[me] || {}).duck)) : weaponIcon(x, (s.players[me] || {}).duck)}</i></span>`,
    )
    .join("");
  const lay = (at) =>
    track.querySelectorAll(".sp-slot").forEach((b, j) => {
      const a = Math.abs(j - at);
      b.style.transform = `translateX(calc(var(--step) * ${j - at})) scale(${(1 + 0.32 * Math.max(0, 1 - a)).toFixed(3)})`;
      b.style.opacity = a > 1.6 ? 0 : 1;
      b.classList.toggle("mid", a < 0.5);
    });
  track.classList.add("sliding"); // (at the old slot at once, then it scrolls)
  lay(from < 0 ? to : from);
  void track.offsetWidth;
  track.classList.remove("sliding");
  lay(to);
  el.classList.remove("go");
  void el.offsetWidth;
  el.classList.add("go");
}
function say(text) {
  if (!sayEl) return;
  sayEl.textContent = text;
  sayEl.classList.remove("on");
  void sayEl.offsetWidth;
  sayEl.classList.add("on");
  sfx.nope();
}

/* ---------- Justin's Butler's shop: a page over the board, as the guestbook's ---------- */
function shopFill(s, ctx) {
  const me = ctx.me,
    up = upOf(s, me),
    pts = ptsOf(s, me),
    kit = kitOf(s, me),
    sig = JSON.stringify([
      up,
      pts,
      s.hang.l4sale,
      saleOn(s),
      kit && kit.sl,
      kit && kit.am,
      (pwState(s) || {}).shop,
      fireForSale(s),
    ]);
  if (sig === shop.sig) return;
  shop.sig = sig;
  shop.pts.textContent = pts;
  shop.list.innerHTML = SHOP.map((it) => {
    const n = up[it.id] || 0,
      max = n >= it.most,
      price = priceFor(s, me, it.id, n),
      was = price < priceOf(it.id, n) ? `<s>${priceOf(it.id, n)}</s> ` : ""; // (a Sale: the old price struck through)
    return `<li class="l4-up"><i class="l4-up-ic">${UP_ICONS[it.id]}</i><span class="l4-up-t"><b>${it.name}</b><small>${it.what}</small></span><span class="l4-up-lv" aria-label="${n} of ${it.most}">${Array.from({ length: it.most }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</span><button type="button" class="btn small ${max ? "" : "yellow"} l4-up-buy" data-buy="${it.id}"${max || pts < price ? " disabled" : ""}>${max ? "Max" : was + price}</button></li>`;
  }).join("");
  /* his guns: Buy (a price), Refill (a price) once I have it, Full when it's full (the knife: Owned) */
  shop.guns.innerHTML = GUN_SHOP.map((w) => {
    const have = !!kit && kit.sl.includes(w),
      holy = have && angelOf(s, me, w), // (an Angelic gun never refills: the owner's, Nov 16 22:21Z)
      price = gunPrice(s, me, w),
      off = !price || pts < price,
      label = have
        ? price
          ? `Refill ${price}`
          : price === 0
            ? "Full"
            : holy
              ? "No refills"
              : "Owned"
        : `Buy ${price}`;
    return `<li class="l4-up l4-buyw"><i class="l4-up-ic">${orbHTML(w)}</i><span class="l4-up-t"><b>${weaponName(w)}</b><small>${holy ? "Angelic: no refills" : gunWhat(w)}</small></span><button type="button" class="btn small ${price ? "yellow" : ""} l4-up-buy" data-buy="${w}"${off ? " disabled" : ""}>${label}</button></li>`;
  }).join("");
  /* Safe Keeping (the owner's, Nov 16): into the special slot, one at a time */
  {
    const have = !!kit && kit.sl.includes("safekeep"),
      price = safePrice(s),
      was = price < SAFE.PRICE ? `<s>${SAFE.PRICE}</s> ` : "";
    const partRow = (part, buy, price) =>
      `<li class="l4-up l4-buyw"><i class="l4-up-ic"><span class="l4orb k-part"><i>${PART_ICONS[part]}</i></span></i><span class="l4-up-t"><b>${partName(part)}</b><small>A part for the power box</small></span><button type="button" class="btn small yellow l4-up-buy" data-buy="${buy}"${pts < price ? " disabled" : ""}>${price}</button></li>`;
    const part = (pwState(s) || {}).shop,
      fire = fireForSale(s);
    if (part) shop.guns.innerHTML += partRow(part, "part", PW.SHOP); // (the power box's part he always has: l4ddpower.js)
    if (fire) shop.guns.innerHTML += partRow(fire, "partfire", PW.SHOP_FIRE); // (and the fireplace's, dearer, until it comes out of a spin)
    shop.guns.innerHTML += `<li class="l4-up l4-buyw"><i class="l4-up-ic">${orbHTML("safekeep")}</i><span class="l4-up-t"><b>Safe Keeping</b><small>Keeps what you bought and gets you up</small></span><button type="button" class="btn small ${have ? "" : "yellow"} l4-up-buy" data-buy="safekeep"${have || pts < price ? " disabled" : ""}>${have ? "Owned" : was + price}</button></li>`;
  }
}
const gunWhat = (w) => {
  if (w === "knife") return "Melee";
  const [p, n] = AMMO_PRICE[w] || AMMO_PRICE.gun;
  return `${p} points for ${n} ${w === "bow" ? "arrows" : "bullets"}`;
};
function openShop(ctx) {
  if (!shop || shop.open) return;
  shop.open = true;
  ctx.world.board.classList.add("l4-shopping");
  shop.sig = "";
  shop.el.hidden = false;
  shopFill(ctx.state(), ctx);
  addEventListener("keydown", shopEsc, true);
}
function closeShop() {
  if (!shop || !shop.open) return;
  shop.open = false;
  shop.el.hidden = true;
  shop.el.parentNode?.classList.remove("l4-shopping");
  if (shop.el.contains(document.activeElement)) document.activeElement.blur();
  removeEventListener("keydown", shopEsc, true);
}
function shopEsc(e) {
  if (!shop || !shop.open || document.querySelector(".win-back, .ctx")) return;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeShop();
  } else if (e.key.startsWith("Arrow")) closeShop(); // (the arrows close it at once too, and still do what they do)
} // (before the game's own Escape: the pause menu)
function shopEl(ctx) {
  const el = document.createElement("div");
  el.className = "hang-book l4-shop";
  el.hidden = true;
  el.innerHTML = `<div class="hang-book-head"><h3 class="hang-book-title">${rainbowHTML(shopName(), { seed: 5 })}</h3><span class="l4-shop-pts"><b>0</b> points</span><button type="button" class="win-x hang-book-x" aria-label="Close">×</button></div>
      <div class="tabs l4-shop-tabs" role="tablist"><button type="button" class="tab" role="tab" aria-selected="true" data-tab="buy">Shop</button><button type="button" class="tab" role="tab" aria-selected="false" data-tab="items">Items</button></div>
      <div class="l4-shop-list" data-pane="buy"><ul class="l4-shop-ups"></ul><h4 class="l4-shop-h">Weapons</h4><ul class="l4-shop-guns"></ul></div>
      <div class="l4-shop-list l4-shop-items" data-pane="items" hidden>${catalogHTML()}</div>
      ${touchOnly() ? "" : '<p class="l4-shop-key"><kbd>B</kbd> buys ammo for the gun in your hand, at his price</p>'}
      <p class="l4-shop-say"><span class="l4-shop-me">${(dp() ? priestSVG : butlerSVG)({ size: 40 })}</span><q>The fireplace is where you see what weapon you get.</q></p>`;
  for (const t of ["pointerdown", "click", "wheel", "touchstart"])
    el.addEventListener(t, (e) => e.stopPropagation(), { passive: true }); // (a tap on the page never walks the duck)
  el.querySelector(".hang-book-x").onclick = closeShop;
  el.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      /* the tabs: his shop, or every item in this mode (l4ddcatalog.js) */
      for (const t of el.querySelectorAll("[data-tab]"))
        t.setAttribute("aria-selected", t === tab);
      for (const p of el.querySelectorAll("[data-pane]"))
        p.hidden = p.dataset.pane !== tab.dataset.tab;
      return;
    }
    const b = e.target.closest("[data-buy]");
    if (!b || b.disabled) return;
    const w = b.dataset.buy,
      hand = heldFn(),
      send = () => ctx.send({ t: "hang", k: "l4", do: "buy", what: w, hand }); // (a gun takes the place of the ranged one in hand, as the fireplace's)
    const kit = kitOf(ctx.state(), ctx.me);
    if (!GUN_SHOP.includes(w) || (kit && kit.sl.includes(w))) return send();
    /* a gun I haven't got: only once I say Yes (the owner's, Nov 16 22:21Z); No, the X and Esc keep my points */
    confirmBox(
      `Are you sure you want to buy the ${weaponName(w)}?`,
      `${gunPrice(ctx.state(), ctx.me, w)} points`,
    ).then((yes) => yes && send());
  });
  ctx.world.board.append(el);
  return {
    el,
    open: false,
    sig: "",
    pts: el.querySelector(".l4-shop-pts b"),
    list: el.querySelector(".l4-shop-ups"),
    guns: el.querySelector(".l4-shop-guns"),
  };
}

/* ---------- holding E: reviving a downed duck, boarding up an opening; E at the fireplace and the Butler ---------- */
function holdTarget(pos, ctx) {
  const s = ctx.state(),
    me = ctx.me;
  const mine = P4(s, me);
  if (s.hang && s.hang.l4 && !s.hang.l4.over && mine && mine.sk && !mine.skAt)
    return { kind: "sk", d: 0 }; // (down, with Safe Keeping: E gets me up)
  if (!s.hang || !s.hang.l4 || s.hang.l4.over || !up(s, me)) return null;
  let best = null;
  for (const id of s.seat) {
    const p = P4(s, id);
    if (id === me || !p || !p.dn) continue;
    const a = ctx.world.at(id);
    if (!a) continue;
    const d = Math.hypot(a.x - pos.x, a.y - pos.y);
    if (d < L4.REACH && (!best || d < best.d))
      best = { kind: "rev", on: id, d, name: (s.players[id] || {}).name };
  }
  if (best) return best;
  const wj = wildFor(s), // (Justin out in Downpour with no weapon: E buys him a gun)
    wa = wj && ctx.world.at(wj);
  if (wa && Math.hypot(wa.x - pos.x, wa.y - pos.y) < L4.REACH)
    return { kind: "givej", d: Math.hypot(wa.x - pos.x, wa.y - pos.y) };
  for (const o of OPENINGS) {
    if (o.nb) continue; // (Downpour's fence: nothing to board up)
    const d = Math.hypot(o.in[0] - pos.x, o.in[1] - pos.y),
      n = (s.hang.brd || {})[o.id] || 0;
    if (d < L4.REACH && n < L4.BOARDS && (!best || d < best.d))
      best = { kind: "board", o: o.id, d, n };
  }
  if (best) return best;
  const pt =
    pwTarget(pos, s, NEAR) || // (the power box, on the balcony: l4ddpowerui.js)
    angelTarget(pos, s, NEAR); // (the Angel machine, on the stage: l4ddangelui.js)
  if (pt) return pt;
  const now = clockNow(),
    db = Math.max(Math.abs(BOX.zx - pos.x), Math.abs(BOX.y - pos.y)); // (a square, as its yellow line shows it: spinSquare)
  if (db < NEAR) {
    const b = boxNow(s, now, me); // (my own spin: anyone else's doesn't stop me)
    if (!b) return { kind: "box", d: db };
    if (now >= b.t + BOX.spin && b.w !== HELPER.w)
      return { kind: "take", d: db, w: b.w }; // (Justin climbs out by himself)
  }
  const ds = Math.hypot(BUTLER.x - pos.x, BUTLER.y - pos.y);
  if (ds < NEAR || (shop && shop.open && ds < AWAY))
    return { kind: "shop", d: ds };
  return null;
}
/* B: ammo for the gun in hand, at the Butler's price, from anywhere (only one of his guns, not full, with the points) */
function buyAmmo(ctx) {
  const s = ctx.state(),
    me = ctx.me,
    w = heldFn();
  if (!s.hang || !s.hang.l4 || s.hang.l4.over || !up(s, me)) return;
  const kit = kitOf(s, me),
    price = gunPrice(s, me, w);
  if (!kit || !kit.sl.includes(w) || !GUN_SHOP.includes(w) || w === "knife")
    return say(`The ${dp() ? "Priest" : "Butler"} doesn't sell ammo for that`);
  if (angelOf(s, me, w)) return say("Angelic: no refills");
  if (!price) return say("It's full");
  if (ptsOf(s, me) < price) return say("Not enough points");
  ctx.send({ t: "hang", k: "l4", do: "ammo", what: w });
}
/* E (a tap) at the Butler or the fireplace */
function tap(t, ctx) {
  if (t.kind === "shop") return shop.open ? closeShop() : openShop(ctx);
  const s = ctx.state(),
    me = ctx.me;
  if (t.kind === "box") {
    if (ptsOf(s, me) < priceFor(s, me, "box")) return say("Not enough points");
    ctx.send({ t: "hang", k: "l4", do: "box" });
  } else if (t.kind === "givej") {
    const w = WILD_GUNS[0];
    if (ptsOf(s, me) < wildPrice(s, w)) return say("Not enough points");
    ctx.send({ t: "hang", k: "l4", do: "givej", what: w }); // (more guns in WILD_GUNS: a pick comes here)
  } else if (t.kind === "take") {
    ctx.send({ t: "hang", k: "l4", do: "box", hand: heldFn() }); // (a ranged weapon takes the place of the one in hand, else the first)
  } else if (t.kind === "sk") ctx.send({ t: "hang", k: "l4", do: "sk" });
  else if (t.kind === "power") pwTap(ctx);
  else if (t.kind === "pump") {
    if (!powerOn(s)) return say("The pumps need the power on");
    if (ptsOf(s, me) < PW.PUMP * PW.PUMP_ROUNDS)
      return say("Not enough points");
    ctx.send({ t: "hang", k: "l4", do: "pump" });
  } else if (t.kind === "angel") angelTap(ctx, heldFn(), say);
}
const TAPS = ["box", "take", "shop", "sk", "power", "pump", "angel", "givej"];
function startHold(t, ctx) {
  if (!t) return;
  holding = t;
  ctx.send(
    t.kind === "rev"
      ? { t: "hang", k: "l4", do: "rev", on: t.on, hold: true }
      : { t: "hang", k: "l4", do: "board", o: t.o, hold: true },
  );
}
function stopHold(ctx) {
  if (!holding) return;
  const t = holding;
  holding = null;
  ctx.send(
    t.kind === "rev"
      ? { t: "hang", k: "l4", do: "rev", on: t.on, hold: false }
      : { t: "hang", k: "l4", do: "board", hold: false },
  );
}
/* the button's words: what holding E does, or how far along it is */
function holdLabel(t, s, ctx, now) {
  if (t.kind === "box")
    return `Spin for a weapon · ${priceFor(s, ctx.me, "box")}${saleOn(s) ? " (Sale)" : ""}`;
  if (t.kind === "take") return `Take the ${weaponName(t.w)}`;
  if (t.kind === "givej")
    return `Buy Justin a ${weaponName(WILD_GUNS[0])} · ${wildPrice(s, WILD_GUNS[0])}`;
  if (t.kind === "shop") return shop && shop.open ? "Close" : "Shop";
  if (t.kind === "sk") return "Get up (Safe Keeping)";
  if (t.kind === "power") return pwLabel(s);
  if (t.kind === "pump") return pumpLabel(s);
  if (t.kind === "angel") return angelLabel(s, ctx.me, heldFn());
  if (t.kind === "rev") {
    const rv = (P4(s, t.on) || {}).rv;
    if (rv && rv.by === ctx.me)
      return `Reviving… ${Math.max(0, Math.ceil((reviveMs(s, ctx.me) - (now - rv.at)) / 1000))}`;
    if (heldFn() === "medkit")
      return `Revive ${t.name || ""} with the medkit`.replace("  ", " "); // (at once: the owner's, Nov 16)
    return `Revive ${t.name || ""}`.trim();
  }
  const mine = ((s.hang.l4b || {})[ctx.me] || {}).o === t.o;
  return mine
    ? `Boarding up… ${t.n}/${L4.BOARDS}`
    : `Board up ${t.n}/${L4.BOARDS}`;
}

activity({
  id: "l4",
  only: "l4dd",
  /* the only ground anyone sees: the cabin, the deck and its stairs (the zombies come up them). The forest, the pool and
     the yard can't be reached, so the world doesn't make them: the deck runs smoother */
  get area() {
    return dp()
      ? null // (Downpour: all of it is played on)
      : [
          [CABIN.x0, CABIN.y0, CABIN.x1, CABIN.y1],
          [DECK.x0, DECK.y0, DECK.x1, DECK.y1],
          [STAIRS.x0, STAIRS.y0, STAIRS.x1, STAIRS.y1],
        ];
  },
  mount(ctx) {
    setListener(() => ctx.world.at(ctx.me));
    layer = ctx.world.board.querySelector(".hang-props");
    fxl = ctx.world.board.querySelector(".fxl");
    cv = document.createElement("canvas");
    cv.className = "hang-dark l4-dark";
    cv.setAttribute("aria-hidden", "true");
    ctx.world.board.querySelector(".hang-shade")?.after(cv);
    g = cv.getContext("2d");
    hud = document.createElement("div");
    hud.className = "l4-hud";
    hud.setAttribute("role", "status");
    over = document.createElement("div");
    over.className = "l4-over";
    over.hidden = true;
    over.addEventListener("click", (e) => {
      if (e.target.closest("[data-l4='again']"))
        ctx.send({ t: "hang", k: "l4", do: "again" });
    });
    endEl = document.createElement("div");
    endEl.className = "l4-end";
    endEl.hidden = true;
    for (const t of ["pointerdown", "touchstart", "wheel"])
      endEl.addEventListener(t, (e) => e.stopPropagation(), { passive: true }); // (a tap on it never walks or attacks)
    endEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.target.closest("button");
      if (b)
        ctx.send({
          t: "hang",
          k: "l4",
          do: "endturn",
          on: b.getAttribute("aria-pressed") !== "true",
        });
    });
    ptsEl = document.createElement("div");
    ptsEl.className = "l4-pts";
    ptsEl.setAttribute("role", "status");
    ptsEl.innerHTML =
      '<span><b>0</b> points</span><i class="l4-jp" hidden></i>';
    potShown = "";
    sayEl = document.createElement("div");
    sayEl.className = "l4-say";
    sayEl.setAttribute("role", "alert");
    onEl = document.createElement("div");
    onEl.className = "l4-on";
    onEl.hidden = true;
    gotEl = document.createElement("div");
    gotEl.className = "l4-got";
    gotEl.setAttribute("role", "status");
    boxEl = document.createElement("div");
    boxEl.className = "l4-box";
    boxEl.hidden = true;
    boxEl.innerHTML =
      '<div class="l4-box-orb"></div><span class="gduck-name l4-box-who"></span>';
    layer.append(boxEl);
    killEl = document.createElement("div");
    killEl.className = "l4-killglow";
    killEl.hidden = true;
    killEl.setAttribute("aria-hidden", "true");
    ctx.world.board.append(hud, over, ptsEl, endEl, sayEl, onEl, gotEl, killEl);
    mapMount(ctx.world.board);
    rainMount(ctx.world.board); // (Downpour's rain: l4ddrain.js)
    mudMount(ctx.world.board); // (and a mud zombie's mud on my screen: l4ddmud.js)
    pwMount(ctx, layer);
    angelMount(ctx, layer);
    sqEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sqEl.classList.add("l4-spinsq");
    sqEl.setAttribute("data-nopx", ""); // (a thin line: no pixel picture of it)
    sqEl.innerHTML = "<polygon/><polygon/><polygon/>"; // (the car, then Downpour's two gas pumps)
    sqEl.style.display = "none";
    sqSig = "";
    layer.append(sqEl);
    poolEl = document.createElement("div");
    poolEl.className = "l4-jpool";
    poolEl.setAttribute("aria-hidden", "true");
    poolEl.innerHTML = POOL_SVG;
    poolEl.hidden = true;
    poolAt = 0;
    poolSig = "";
    layer.append(poolEl);
    shop = shopEl(ctx);
    butler = butlerEl(dp() ? priestSVG({ size: 64 }) : undefined, shopName()); // (Downpour: the Priest does his job, in his own drawing)
    egg = butlerEl(justinSVG({ size: 64 }), "Justin");
    egg.el.classList.replace("l4-butler", "l4-egg");
    egg.el.hidden = true;
    ctx.world.board.classList.add("blackout", "l4-board");
    Z.clear();
    B.clear();
    D.clear();
    zpSig =
      overShown =
      endSig =
      drawn =
      boxSig =
      upSig =
      slotSig =
      onSig =
      litSig =
        "";
    roundShown = -1;
    ptsShown = -1;
    l4Reset();
    boxSpun = false;
    stamina = 1;
    tired = false;
    peekW = null;
    holding = null;
  },
  unmount(ctx) {
    for (const o of Z.values()) o.el.remove();
    for (const b of B.values()) b.el.remove();
    for (const o of D.values()) o.el.remove();
    Z.clear();
    B.clear();
    D.clear();
    cv?.remove();
    mapUnmount();
    rainUnmount();
    mudUnmount();
    pwUnmount();
    angelUnmount();
    hud?.remove();
    over?.remove();
    closeShop();
    ctx.world.board.classList.remove("l4-waiting");
    for (const e of [
      ptsEl,
      endEl,
      sayEl,
      onEl,
      gotEl,
      killEl,
      vitEl,
      hintEl,
      boxEl,
      butler && butler.el,
      egg && egg.el,
      shop && shop.el,
      sqEl,
      poolEl,
    ])
      e?.remove();
    sqEl = poolEl = null;
    cv = g = hud = endEl = over = layer = fxl = null;
    ptsEl = sayEl = onEl = gotEl = killEl = boxEl = butler = shop = null;
    vitEl = hintEl = null;
    bellEl = flareEl = null;
    vitShown = "";
    ctx?.world?.board.classList.remove("blackout", "l4-board", "l4-jp-on");
  },
  onState(s, ctx) {
    if (!layer || !s.hang || !s.hang.l4) return;
    const now = performance.now();
    seeZombies(s, ctx, now);
    seeBoards(s);
    seeDrops(s);
    pwSee(s, ctx);
    angelSee(s);
    ctx.world.board.classList.toggle("blackout", !powerOn(s)); // (the balcony's bulbs and the stage's lights: off till the power's on)
    seeOn(s, ctx);
    spinSquare(s, ctx);
    seeHud(s, ctx);
    seePts(s, ctx);
    seePot(s);
    l4Hear(s, ctx); // (its sounds: l4ddsfx.js)
    if (shop.open) shopFill(s, ctx);
    /* a ding: a weapon from the fireplace taken (an upgrade bought rings the Butler's till: l4ddsfx.js) */
    const u = JSON.stringify(upOf(s, ctx.me)),
      sl = slotsOf(s, ctx.me),
      had = slotSig.split(",");
    if (
      slotSig &&
      sl.some((w) => w && !had.includes(w)) &&
      !(
        ctx.duck() &&
        Math.hypot(ctx.duck().x * W - BUTLER.x, ctx.duck().y * H - BUTLER.y) <
          320
      )
    )
      sfx.done();
    upSig = u;
    slotSig = sl.join();
    if (holding && !up(s, ctx.me)) holding = null;
  },
  step(dt, now, ctx) {
    l4Steps(dt, ctx); // (footsteps and groans: l4ddsfx.js)
    /* the way I last walked (a phone's aim without a zombie in sight) */
    const me = ctx.duck();
    if (me) {
      const x = me.x * W,
        y = me.y * H;
      if (lastXY) {
        const dx = x - lastXY[0],
          dy = y - lastXY[1],
          d = Math.hypot(dx, dy);
        if (d > 0.5 && d < 60) walkDir = [dx / d, dy / d]; // (not a jump back to a start spot)
      }
      lastXY = [x, y];
      if (
        shop.open &&
        (!up(ctx.state(), ctx.me) ||
          !ctx.world.inside ||
          Math.hypot(BUTLER.x - x, BUTLER.y - y) > AWAY)
      )
        closeShop(); // (walked off, or down: it closes)
      if (holding) {
        const t = holdTarget({ x, y }, ctx);
        if (
          !t ||
          t.kind !== holding.kind ||
          (t.kind === "rev" ? t.on !== holding.on : t.o !== holding.o)
        )
          stopHold(ctx); // (walked away from it)
      }
    }
  },
  draw(now, ctx) {
    if (!layer) return;
    syncMap(); // (the openings, the Butler's or the Priest's spot, for the map in play: on a player's screen too, which runs no rules)
    const Wd = ctx.world,
      sc = Wd.sc,
      t = performance.now(),
      meAt = Wd.at(ctx.me),
      myFloor = meAt ? olFloor(meAt.x, meAt.y, meAt.z) : 0; // (for the outlines: a zombie a floor away)
    /* the zombies, gliding from where they were to where the host says, one heartbeat's time */
    for (const o of Z.values()) {
      const u = Math.min(1, (t - o.t0) / gap);
      o.x = o.fx + (o.tx - o.fx) * u;
      o.y = o.fy + (o.ty - o.fy) * u;
      const up =
          o.st === 5
            ? fenceZ(o.x, o.y, o.l[2])
            : o.st === 6 || o.st === 7 || o.st === 8
              ? zombieZ(o) - heightAt(o.x, o.y)
              : 0, // (Downpour: up a fence, or dropping off it; up a wall, or on a roof)
        z = heightAt(o.x, o.y) + up,
        lean =
          o.st === 5 && up && openingById(o.l[2])?.axis === "y"
            ? fenceLean({ x: o.x, h: up }, W)
            : 0, // (on the west or east fence: on its face, which leans out as it goes up, stationart.js)
        f = Wd.toScreen(o.x + lean, o.y, z),
        door = atBoards(o, Wd.inside),
        hole = !Wd.inside && roofHoleOver(o.x, o.y, z), // (Downpour: seen from outside through a hole in the gas station's roof)
        unseen = !(door || hole || seenFrom(o.x, o.y, Wd.inside, z)),
        zi = door
          ? AT_BOARDS
          : hole
            ? Math.round(hole.key) + 11 // (over the roof, in its hole)
            : Math.round(sortY(o.x, o.y, z)) + 10,
        onCam = Wd.seen(f.left - 40 * sc, f.top - 90 * sc, 80 * sc, 100 * sc),
        hide =
          unseen ||
          !onCam ||
          (o.diedAt !== undefined && t - o.diedAt > LOW_DEAD && low()); // (Low graphics or Data saving: a body is gone from my screen at 2 s, css/app.css html.low; the rules still keep it its 4 s)
      if (o.el.hidden !== hide) o.el.hidden = hide;
      if (onCam && unseen && o.st !== 3)
        zOutline(Wd, o, f, 0, sc, true, z, myFloor); // (on the other side of a wall: its red line)
      if (hide) continue;
      wounds(o, o.l, o.i); // (come into sight: the wounds it got out of it)
      pxPic(o, o.img, o.bw * sc, o.bh * sc);
      o.sx = f.left;
      o.sy = f.top;
      o.sk = sc; // (where it stands on the screen: its blood comes out of it there, seeZombies)
      /* Downpour: one swimming the deep flood sits in the water to its waterline, bobbing, as a duck does (water.js);
         one wading the shallow flood, its bottom fifth under it */
      const dip =
        !dp() || o.st === 3
          ? 0
          : inDeep(o.x, o.y)
            ? SINK + Math.sin(t / 520 + o.i) * 2.2
            : inShallow(o.x, o.y) && o.st !== 5
              ? WADE_SINK * o.feet
              : 0;
      const olOnly =
        o.st !== 3 &&
        zOutline(
          Wd,
          o,
          f,
          dip,
          sc,
          (!door && olRoofed(o.x, o.y, z, meAt)) || null, // (under a roof I'm not under: always its line, outlines.js)
          z,
          myFloor,
          zi,
        ); // (really behind a wall, under a roof: its line only)
      if (o.olOnly !== olOnly) {
        o.olOnly = olOnly;
        o.el.classList.toggle("ol-only", olOnly);
      }
      const tr = `translate(${at(f.left)}px, ${at(f.top + dip * sc)}px)`;
      if (o.tr !== tr) {
        o.tr = tr;
        o.el.style.transform = tr;
      }
      const clip = dip
        ? `polygon(-300% -300%, 400% -300%, 400% ${(o.feet - dip).toFixed(1)}px, -300% ${(o.feet - dip).toFixed(1)}px)`
        : "";
      if (o.clip !== clip) {
        o.clip = clip;
        o.body.style.clipPath = clip;
      }
      const body = `scale(${(o.face < 0 ? -sc : sc).toFixed(4)}, ${sc.toFixed(4)})${o.st === 3 ? " rotate(-100deg)" : ""}`;
      if (o.bt !== body) {
        o.bt = body;
        o.body.style.transform = body;
      }
      if (o.k !== sc) {
        o.k = sc;
        o.el.style.setProperty("--k", sc.toFixed(3));
      }
      if (o.zi !== zi) {
        o.zi = zi;
        o.el.style.zIndex = zi;
      }
    }
    /* Downpour: a duck in the deep flood swims, sunk to its waterline and bobbing, as in the Hangout pool; one in the
       shallow flood wades, its bottom fifth under it (water.js) */
    if (dp())
      for (const d of Wd.board.querySelectorAll(".ducks .gduck")) {
        const id = d.dataset.pid,
          a = id && Wd.at(id),
          wet = !!a && a.z <= heightAt(a.x, a.y) + 4;
        floatDuck(
          d,
          wet && inDeep(a.x, a.y),
          id ? (id.charCodeAt(0) + id.length * 7.3) % 6.28 : 0,
          now,
          sc,
          wet && inShallow(a.x, a.y),
        );
      }
    mapDraw(t, ctx, ctx.state(), Z.values(), (id) => up(ctx.state(), id)); // (the minimap: l4ddmap.js)
    if (dp()) {
      const who = [];
      for (const id of ctx.state().seat) {
        const a = Wd.at(id);
        if (a) who.push([id, a.x, a.y]);
      }
      for (const o of Z.values())
        if (o.st !== 3) who.push(["z" + o.i, o.x, o.y]);
      const hit = (ctx.state().hang.l4lt || {}).hit;
      rainDraw(
        t,
        ctx,
        who,
        true,
        hit && clockNow() - hit[2] < 600 ? hit : null,
      ); // (and the lightning: l4ddrules.js boltTick)
    } else rainDraw(t, ctx, [], false);
    mudDraw(((ctx.state().hang.l4p || {})[ctx.me] || {}).mud || 0, clockNow());
    const beat = new Set();
    for (const o of Z.values()) if (atBoards(o, Wd.inside)) beat.add(o.l[2]);
    /* the boards: inside, the door's and the holes'; outside (on the deck), the stairs' */
    for (const o of OPENINGS) {
      const b = B.get(o.id);
      if (!b) continue;
      const out = o.kind === "stairs",
        p = Wd.toScreen(o.x, o.y, 0),
        hide =
          out === Wd.inside ||
          !Wd.seen(
            p.left + b.box.l * sc,
            p.top + b.box.t * sc,
            b.box.w * sc,
            b.box.h * sc,
          );
      if (b.el.hidden !== hide) b.el.hidden = hide;
      if (hide) continue;
      const tr = `translate(${at(p.left + b.box.l * sc)}px, ${at(p.top + b.box.t * sc)}px) scale(${sc.toFixed(4)})`;
      const on = beat.has(o.id);
      if (b.tr !== tr || b.on !== on) {
        b.tr = tr;
        b.on = on;
        b.el.style.transform = tr;
        b.el.style.zIndex = on ? AT_BOARDS + 1 : boardKey(o);
        b.el.classList.toggle("beat", on);
      }
    }
    /* the drops, blinking in their last seconds; and the seconds left on what's on */
    const tn = clockNow();
    for (const o of D.values()) {
      const p = Wd.toScreen(o.x, o.y, 0),
        hide =
          !seenFrom(o.x, o.y, Wd.inside) ||
          !Wd.seen(p.left - 40, p.top - 80, 80, 100);
      if (o.el.hidden !== hide) o.el.hidden = hide;
      if (hide) continue;
      const tr = `translate(${at(p.left)}px, ${at(p.top)}px)`;
      if (o.tr !== tr) {
        o.tr = tr;
        o.el.style.transform = tr;
        o.el.style.zIndex = Math.round(sortY(o.x, o.y, 0)) + 10;
      }
      if (o.k !== sc) {
        o.k = sc;
        o.el.style.setProperty("--k", sc.toFixed(3));
      }
      const left = o.until - tn;
      let end = 0;
      for (const [ms, k] of DROP_BLINK) if (left < ms) end = k;
      if (o.end !== end) {
        o.end = end;
        o.el.classList.toggle("ending", end > 0);
        o.el.dataset.end = end;
      }
    }
    seeOn(ctx.state(), ctx);
    spinSquare(ctx.state(), ctx);
    seePool(ctx.state(), ctx);
    /* Justin's Butler */
    {
      const z = heightAt(BUTLER.x, BUTLER.y),
        p = Wd.toScreen(BUTLER.x, BUTLER.y, z),
        hide =
          !seenFrom(BUTLER.x, BUTLER.y, Wd.inside) ||
          !Wd.seen(p.left - 40, p.top - 90, 80, 110);
      if (butler.el.hidden !== hide) butler.el.hidden = hide;
      if (!hide) {
        const tr = `translate(${at(p.left)}px, ${at(p.top)}px)`;
        if (butler.tr !== tr) {
          butler.tr = tr;
          butler.el.style.transform = tr;
          butler.el.style.zIndex =
            Math.round(sortY(BUTLER.x, BUTLER.y, z)) + 10;
        }
        const bk = sc * (dp() ? PRIEST_K : BUTLER_K);
        pxPic(butler, butler.body.firstChild, 64 * bk, butler.bh * bk);
        if (butler.k !== sc) {
          butler.k = sc;
          butler.body.style.transform = `scale(${bk.toFixed(4)})`;
          butler.el.style.setProperty("--nt", (2 * sc).toFixed(1) + "px");
        }
      }
    }
    drawEgg(ctx, now);
    drawBox(ctx);
    pwDraw(ctx);
    angelDraw(ctx);
    if (dp()) {
      bellSwing(ctx, t); // (the bell's times are the page's clock: performance.now())
      flareDraw(ctx, t);
    }
    paint(now, ctx);
    /* my sprint: a thin blue bar under my name, while it isn't full (and under my HP meter: game.js asks sprintLeft()) */
    const tag = Wd.board.querySelector(".gduck.mine .gduck-name");
    if (tag) {
      let sp = tag.querySelector(".l4-sprint");
      if (!sp) {
        sp = document.createElement("span");
        sp.className = "l4-sprint";
        sp.setAttribute("aria-hidden", "true");
        sp.innerHTML = "<i></i>";
        tag.append(sp);
      }
      const v = stamina.toFixed(3);
      if (sp._v !== v) {
        sp._v = v;
        sp.style.setProperty("--sp", v);
        sp.classList.toggle("full", stamina >= 1);
        sp.classList.toggle("tired", tired);
      }
      const st = ctx.state();
      coolBar(tag, st, ctx.me);
      ammoBars(tag, st, ctx.me); // (and the yellow ammo bar, the three stacked: meters.js)
      laserMeter(tag, st, ctx.me, heldFn()); // (the Laser Rifle's heat: laserfx.js)
      peek(tag, st, ctx.me);
    }
    safeLook(ctx);
  },
  near(pos, ctx) {
    const t = holdTarget(pos, ctx);
    if (!t) return null;
    const s = ctx.state();
    return {
      label: holdLabel(t, s, ctx, Date.now()),
      faded: t.kind === "power" && powerNext(s) === "", // (nothing to fit, turn on or pour in: the button fades, the owner's, Nov 17 18:05Z)
      d: t.d,
      act: () =>
        TAPS.includes(t.kind)
          ? tap(t, ctx)
          : holding
            ? stopHold(ctx)
            : startHold(t, ctx), // (a tap on the button holds until I walk away)
    };
  },
  keydown(e, ctx) {
    if (e.code === "KeyB") {
      if (!e.repeat) buyAmmo(ctx);
      return true;
    }
    if (e.code === "Digit0" || e.code === "Numpad0") {
      if (!e.repeat) ctx.send({ t: "hang", k: "l4", do: "fl" });
      return true;
    }
    if (e.code === "KeyE") {
      e.preventDefault();
      if (e.repeat || holding) return true;
      const me = ctx.duck(),
        t = me && holdTarget({ x: me.x * W, y: me.y * H }, ctx);
      if (t && TAPS.includes(t.kind)) tap(t, ctx);
      else startHold(t, ctx);
      return true;
    }
    return false;
  },
  keyup(e, ctx) {
    if (e.code === "KeyE") {
      stopHold(ctx);
      return true;
    }
    return false;
  },
  propClass(p, s) {
    if (["lamp", "sink", "post", "tv"].includes(p.kind))
      return powerOn(s) ? "" : "off"; // (the power box: l4ddpower.js)
    if (p.id === "door-front")
      return ((s.hang && s.hang.brd) || {}).front > 0 ? "" : "open"; // (boarded shut; open once the zombies tear the last board down)
    if (p.kind === "door") return "open";
    return "";
  },
  light: (p, s, l) =>
    (l && l.el && !powerOn(s)) || (p && p.hood && s.hang && s.hang.l4hood)
      ? false
      : undefined, // (the power is cut: only the fires and the candles shine, till the power box is mended. Downpour's hood-up car glows till it's first used)
  blocked: (x, y) => !playable(x, y), // (only the cabin and the deck; the deck's edge is the map's)
  crowd(x, y) {
    let d = 0;
    for (const o of Z.values()) {
      if (o.st === 3 || o.st === 0 || o.st === 1) continue;
      const dx = (x - o.x) / RX,
        dy = (y - o.y) / RY;
      d = Math.max(d, 1 - (dx * dx + dy * dy));
    }
    return d;
  },
  speed: (pos, ctx) =>
    (((ctx.state().hang.l4ad || {})[ctx.me] || 0) > clockNow()
      ? 1
      : SPEED * (upOf(ctx.state(), ctx.me).sp ? 1.1 : 1)) * // (Speed, from the Butler: 10% faster; an adrenaline shot: Duck Cabin's own walk, for 20 s)
    (dp() && inShallow(pos.x, pos.y) ? WADE : 1) * // (Downpour: the flood over the road, 30% slower: the owner's)
    (dp() && inDeep(pos.x, pos.y) && pos.z <= heightAt(pos.x, pos.y) + 4
      ? SWIM
      : 1), // (… and its deep end swum, as slow as in the Hangout pool)
  sprint(on, dt) {
    if (on && !tired && stamina > 0) {
      stamina = Math.max(0, stamina - (dt * 1000) / L4.SPRINT);
      if (stamina <= 0) tired = true;
      return true;
    }
    if (!on) tired = false; // (it can sprint again as soon as Shift is let go)
    stamina = Math.min(1, stamina + (dt * 1000) / L4.SPRINT);
    return false;
  },
  spawn(ctx) {
    const s = ctx.state(),
      k = Math.max(0, s.seat.indexOf(ctx.me));
    return startSpot(k);
  },
});
