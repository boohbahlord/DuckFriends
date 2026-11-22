/* ---------- Quacky Zombies on every screen ----------
   Duck Cabin's world draws it (an activity that runs only in this mode, registry.js): the zombies where the host says
   (gliding between its heartbeats), their thin HP bars, a red blink when hit, the claw's swipe, lying down and fading
   when they die; the boards over the openings; the dark over everything (the power is cut) with the
   fires and every duck's flashlight cut out of it (a cone the way it aims, stopped by the walls); "Round N"
   at the top, my points under it (a +N pops up for each one earned); the end. Hold E by a downed duck to revive it, or
   by an opening to board it up; key 0 switches my flashlight. A merchant comes now and then and stands by the card
   table (on Downpour in the chapel): E by him opens his shop (drawMerchant). E at the fireplace spins it for a weapon: it flickers through them over the fire, lands on one, and E takes
   it (a ranged one only with a ranged weapon in hand to swap: else big words and a buzz say so). My duck walks at half
   speed (Speed: 10% faster) and has 7 seconds of sprint (a thin blue bar under my name). The rules are the host's
   (l4ddrules.js); the weapons bar is l4ddbar.js. */
import { holdGame, offView } from "./gameready.js";
import { clawMark, warmClaw, leanBack } from "./claw.js";
import { JPOOL, poolHTML, warmPool } from "./bloodpool.js";
import { isInvisible } from "./invisible.js";
import { invOn } from "./sbgod.js";
import { sprintLeft, sprintReset } from "./stamina.js";
import { isSb, sbNoLight, sbHasOl, sbOlColor } from "./sandboxrules.js";
import { activity } from "./hangout/registry.js";
import { votesDue } from "./voterules.js";
import {
  CABIN,
  DECK,
  STAIRS,
  inCabin,
  seenFrom,
  sortY,
  bodyZ,
  roofHoleOver,
  heightAt,
  wetK,
  slabBetween,
  W,
  H,
  LIGHTS,
  PROPS,
  layoutRev,
  onRoof,
} from "./hangout/layout.js";
import { sway, stutterOf, lightNow } from "./hangout/flicker.js";
import { play, setListener } from "./hangout/sounds.js";
import { svgDataURL } from "./svgurl.js";
import { justinSVG } from "./hangout/npcart.js";
import { merchantById, merchantSVG, merchantLook } from "./merchants.js";
import { FLAME, TELEPORT } from "./mgjart.js";
import { rainbowHTML } from "./art.js";
import { low } from "./gfx.js";
import { mapMount, mapUnmount, mapDraw } from "./l4ddmap.js";
import { rainMount, rainUnmount, rainDraw } from "./l4ddrain.js";
import { nameHTML } from "./name.js";
import { profile, save } from "./store.js";
import { statsOf } from "./cheatflag.js";
import { sfx } from "./sound.js";
import { l4Hear, l4Steps, l4Reset } from "./l4ddsfx.js";
import { now as clockNow } from "./clock.js";
import {
  inShallow,
  inDeep,
  FLARE,
  STATION,
  PUMPS,
} from "./hangout/stationmap.js";
import { floatDuck, SINK, WADE_SINK } from "./hangout/water.js";
import { fenceLean } from "./hangout/stationart.js";
import { bellSwing, bellReset, flareDraw, flareOn } from "./l4ddbell.js";
import {
  L4,
  OPENINGS,
  syncMap,
  dp,
  playable,
  startSpot,
  SHOP,
  priceOf,
  upOf,
  ptsOf,
  slotsOf,
  BOX,
  boxNow,
  HELPER,
  weaponName,
  tintOf,
  priceFor,
  reviveMs,
  saleOn,
  dropName,
  TOILET,
  waitNeed,
  waitVotes,
  startOf,
  kitOf,
  openingById,
  reloadOf,
  l4Cool,
  zombieLook,
  magIn,
  fullFor,
  downArmed,
  wilds,
  isWild,
  pierceOf,
  shotArm,
  shotWalled,
  hasLeft,
  merchantOf,
  upOffer,
  selling,
  stockPrice,
  MERCH,
  ZHATS,
  ZOUTFITS,
} from "./l4ddrules.js";
import { SLOT_KINDS } from "./kitslots.js";
import { lootAt } from "./l4ddloot.js";
import { kindOf, ARMS, POOL, loadTo } from "./guns.js";
import { fenceZ, zombiesOf } from "./zombies.js";
import { zSortY } from "./zombieroofs.js";
import { hOk, hLock, zOf } from "./heights.js";
import { toPx } from "./units.js";
import { ammoBar, stackBars, noReload } from "./meters.js";
import { laserMeter } from "./laserfx.js";
import { goreFree, BY_WOUND, newWound, woundLook } from "./wounds.js";
import { catalogHTML, statLineOf } from "./l4ddcatalog.js";
import { mountItemTip } from "./itemtip.js";
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
} from "./l4ddpowerui.js";
import { powerOn, powerNext, PW, gasFull, pumpZone } from "./l4ddpower.js";
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
import { fxHitAt, fxEye, heavyOff } from "./fx.js";
import { vibrate, hitPx, HIT, again } from "./fxmotion.js";
import { pixelOn, gridPx, raster, rasterReady } from "./pixel.js";
import { olAdd, olAway, olRoofed, olPic, DROP_OL } from "./outlines.js";
import { belowBody } from "./below.js";
import { confirmBox, ducksOn, kept, windowOpen } from "./ui.js";
import { angelOf, ANGEL } from "./l4ddangel.js";
import { angelic, jerrySVG } from "./powerart.js"; // (after l4ddart.js, as game.js imports it)
import { hashText } from "./pxdom.js";
import {
  zombieURL,
  zombieDK,
  zombieBox,
  boardsSVG,
  boardsBox,
  orbHTML,
  UP_ICONS,
  weaponIcon,
} from "./l4ddart.js";
import { isSurv, survTime, clockOf } from "./survrules.js";
import { gunLights, gunBodies } from "./gunmenview.js";
import { heldOf, npcShot } from "./sbnpcart.js";

const RX = 56,
  RY = 25.6; // (a zombie's room on the floor, as the rules')
const SPEED = 0.6 * 1.05; // my duck at 63% of Duck Cabin's walk: I wanted it 20% faster than the half it was, then 5% more (Nov 3; sprint goes from it)
const DARK = 0.84; // how dark the dark is: still dark, but I wanted it a little lighter than 0.93
const DARK_ON = 0.5, // … and with the power on: the lights are on, still night outside
  DARK_ON_IN = 0; // … and inside the cabin as bright as Hangout is with its power on (the owner's, Nov 20: it brightens when the generator is on)
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
/* the merchant here now (the rules' s.hang.l4m) and who he is (merchants.js) */
const merchantNow = (s) => {
  const m = merchantOf(s);
  return m ? { ...m, who: merchantById(m.id) } : null;
};
const shopName = (s) => {
  const m = merchantNow(s);
  return (m && m.who && !m.who.hideName && m.who.name) || "The Merchant"; // (the soldier's name is never shown: "his name is classified info", the owner's, Nov 18 14:10Z)
};
const NEAR = 130; // world px: how near E works at the merchant and the fireplace
const AWAY = 260; // walked this far off: his shop closes
/* the weapon in my hand (game.js tells me how to ask) */
let heldFn = () => "";
export const l4Held = (f) => (heldFn = f);
/* the weapon I'm about to take (the owner's, Nov 19 19:27Z): mine waiting at the fireplace (or the car) while I stand at
   it, or the merchant's I'm pointing at; the hotbar lights the slot it would go to (l4ddbar.js) */
let nearTo = "",
  shopTo = "";
export const l4To = () => shopTo || nearTo;
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
  snapAt = 0,
  gap = 200,
  roundShown = -1, // (none yet)
  overShown = "",
  holding = null,
  drawn = "",
  coneSp = []; // (each flashlight's cone on its own small canvas, drawn again only when it moves: paint)
/* the Butler, the fireplace's weapon, my points, the big words, his shop */
/* my sprint left (0 … 1) and whether I'm too tired to sprint: now in every mode (stamina.js) */
export { sprintLeft };
/* every zombie on my screen: its box in the board's px, from its last drawing (game.js: HP meters see-through over one) */
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
/* where a shot I draw stops (the owner's, Nov 17 20:37Z: "BULLETS THAT DO NOT PASS THROUGH ZOMBIES WILL NO LONGER PASS
   THRU ZOMBIES ... LIKE IF U SHOOT A PISTOL THE BULLET KIND IS SEEN GOING PAST THEM A BIT AND IT LOOKS WRONG"). The
   host finds a hit at its next beat and my screen hears of it later still, while I draw the shot flying on and the
   zombies gliding a beat behind (gap); so on my screen it stops where it meets them as I draw them. From where I last
   drew it (x0, y0) to where I draw it now (x1, y1), in shares of the world, it looks as l4ddrules.js l4Shots does: a
   step every 12 px, the first wall taller than it, a zombie's 26 by 22 px at a height it can reach (heights.js; its
   height set by the first one it meets, r.lh). r: what I know of this shot: skip, the zombies it has gone past (a miss,
   or one the sniper went through), n, how many it has hit; the one that makes it most (its weapon's pierceOf, or 1)
   stops it. { x, y } where it stops, in shares of the world, and i: that zombie's number (-1: a wall), or null */
export function shotStop(s, sh, r, x0, y0, x1, y1) {
  const most = Math.max(1, pierceOf(s, sh.by, shotArm(sh))),
    ax = x0 * W,
    ay = y0 * H,
    bx = x1 * W,
    by = y1 * H,
    steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 12)),
    q = { hz: sh.hz }; // (its height, kept here: the shot itself is the room's state)
  for (let k = 1; k <= steps; k++) {
    const x = ax + ((bx - ax) * k) / steps,
      y = ay + ((by - ay) * k) / steps;
    if (shotWalled(sh, x, y)) return { x: x / W, y: y / H, i: -1 };
    for (const [i, o] of Z) {
      if (
        o.st === 3 ||
        o.z === undefined ||
        r.skip.has(i) ||
        Math.hypot((o.x - x) / 26, (o.y - y) / 22) >= 1
      )
        continue;
      q.lh = r.lh ?? sh.lh;
      if (!hOk(q, o.z, o.x, o.y, sh.x0 * W, sh.y0 * H)) continue;
      hLock(q, o.z);
      r.lh = q.lh;
      r.skip.add(i);
      if (++r.n >= most) return { x: x / W, y: y / H, i };
    }
  }
  return null;
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
  slotSig = "";

/* a picture's short name (its text's hash), made once for each picture: the same text (every zombie that looks the
   same) is hashed once, not once for each of them */
const UK = new Map();
function ukOf(url) {
  let k = UK.get(url);
  if (!k) {
    if (UK.size > 600) UK.clear(); // (as l4ddart.js keeps its pictures: the newest few hundred)
    UK.set(url, (k = hashText(url)));
  }
  return k;
}
/* the pixel look: a still picture (a zombie, the Butler) as pixels at the size it shows, w × h css px; its drawing until
   they're made (a zombie: nothing until they're made, zombieEl). o keeps what it shows: o.url (the drawing), o.uk (its
   short name) and o.pxk. Asked every frame for every zombie on the screen, so it checks by the short name: before, it
   glued the whole drawing (7 to 11 KB of text) into the check each time, a megabyte of throwaway text a frame in a big
   crowd (the owner's, Nov 18 14:20Z: "i want more frames") */
function pxPic(o, img, w, h) {
  if (!pixelOn()) return;
  if (o.dk) return goreCanvas(o, w, h);
  const g = gridPx(),
    uk = o.uk || (o.uk = ukOf(o.url)),
    k = uk + "@" + Math.round(w / g) + "x" + Math.round(h / g);
  if (o.pxk === k) return;
  o.pxk = k;
  img.classList.add("px");
  const key = "z" + uk,
    u = raster(key, o.url, w, h);
  if (u) img.src = u;
  else {
    /* nothing shown yet: the same zombie without its own wounds, made while the game loaded (warmZombies), until its own
       picture is made, rather than nothing (a zombie of the usual size and build) */
    const l = o.l;
    if (l && !l[3] && !l[4] && !img.getAttribute("src")) {
      const bu = zombieURL([0, 0, "", 0, 0, l[5], l[6], 0, 0], 0),
        b = raster("z" + ukOf(bu), bu, w, h);
      if (b) img.src = b;
    }
    rasterReady(key, o.url, w, h).then((v) => {
      if (v && o.pxk === k) img.src = v;
    });
  }
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
function zOutline(Wd, o, f, dip, sc, hidden, z, myFloor, zi = 0, kind = "") {
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
    kind: kind || "zombie", // (or a Sandbox zone's Outlines color)
    hidden: hid,
    ...olAway(o.x, o.y, z, myFloor), // (its floor against mine, its elevation, how much darker)
  });
  return hid;
}
/* every hat and every outfit a zombie can wear, at the sizes it comes in, made into pixels once while the game loads
   (gameready.js holds the loading screen for them): the duck sheets' files they need are fetched then, never as the
   first one walks in (the owner's, Nov 20 20:46Z: "pop-ins, things being unloaded"). Each zombie's own picture (its
   wounds are its own) is still made from them, as soon as it comes, wherever it is (draw) */
let warmAt = 0;
function warmZombies(sc) {
  if (!pixelOn() || !sc || warmAt === sc) return false;
  warmAt = sc;
  warmClaw(sc * 1.25); // (their claw marks too: claw)
  warmPool(120 * sc); // (and the pool of blood under a duck that dies: bloodpool.js)
  const looks = [
    ...ZHATS.map((_, h) => [h, -1]),
    ...ZOUTFITS.map((_, o) => [-1, o]),
    [-1, -1],
  ];
  for (const size of [-1, 0, 1])
    for (const [h, o] of looks) {
      const l = [0, 0, "", size, 0, h, o, 0, 0],
        url = zombieURL(l, 0),
        box = zombieBox(l);
      rasterReady("z" + ukOf(url), url, box.w * sc, box.h * sc);
    }
  return true;
}
function zombieEl(z) {
  const el = document.createElement("div"),
    box = zombieBox(z.l);
  el.className = "l4z";
  const url = zombieURL(z.l, z.i);
  /* the pixel look: no src yet, its pixels come in draw() (pxPic) at once when a zombie that looks the same has them
     already; until then it shows nothing rather than its live drawing (a whole wave of them would be drawn as drawings
     for a moment, each its own) */
  el.innerHTML = `<div class="l4z-body"><img alt="" draggable="false"${pixelOn() ? "" : ` src="${url}"`}></div><span class="l4z-hp"><b></b><i></i></span>`;
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
    f = ctx.world.toScreen(px, py, heightAt(px, py) + 36);
  clawMark(fxl, f.left, f.top, ctx.world.sc * 1.25, Math.atan2(py - y, px - x)); // (a little bigger than the cats', and its swipe the way it swung, up and down too, as drawn)
  play("swipe", { x: px, y: py });
}
/* a zombie that got a new look (Survival's remodel: another hat, outfit and tilt, l4ddrules.js) shows it at once: its box
   and its picture are made again. Before, only a change of its wounds made its picture again, so it kept the old skin
   till its next hit and then popped into the new one, most often as it died (the owner's, Nov 20 19:02Z: "when zombies
   die ... they change skins"). Returns whether the look changed */
function relook(o, l) {
  if (!o.l || [3, 4, 5, 6, 7, 8].every((k) => o.l[k] === l[k])) return false;
  const box = zombieBox(l);
  o.bw = box.w;
  o.bh = box.h;
  o.feet = box.feet;
  o.body.style.height = box.h.toFixed(1) + "px";
  o.body.style.top = (-box.feet).toFixed(1) + "px";
  o.body.style.transformOrigin = `${box.w / 2}px ${box.feet.toFixed(1)}px`;
  o.hits = null; // (wounds() makes the picture again, with the wounds it has)
  return true;
}
/* its picture with the wounds it has now, made only when they changed and it's on a screen */
function wounds(o, l, i) {
  const want = o.ng ? goreFree(o.want) : o.want; // (Gore off: none of them shows. o.ng, the setting as seeZombies last saw it: draw() asks too, and before, it left the setting out, so with Gore off a zombie on the screen got its gore back every frame and lost it again every update, a new picture each time)
  if (o.hits === want) return;
  o.hits = want;
  o.dk = want && pixelOn() ? zombieDK(l, i, want) : null; // (wounded: the gore layer, goreCanvas)
  o.url = o.dk ? "" : zombieURL(l, i, o.hits);
  o.uk = "";
  o.pxk = "";
  if (!o.dk) plainImg(o);
  if (!pixelOn()) o.img.src = o.url; // (the pixel look: draw() shows it, as pixels)
}
/* the gore layer: a wounded zombie is its parts with its wounds (l4ddart.js zombieDK), put together from the part sheets
   (duckparts.js) straight onto its own canvas, w × h css px. Before, every new wound on every zombie made a whole new
   drawing (30 to 75 KB), found all its parts again and made a new picture file from them (about 3 ms each, mid-game).
   The canvas takes the img's place once and stays (its hit shake and red blink run on it); what it showed stays till the
   new one is ready. A zombie the sheets can't make (too big on the screen for them) is made whole, as before */
function goreCanvas(o, w, h) {
  const g = gridPx(),
    cw = Math.max(1, Math.round(w / g)),
    ch = Math.max(1, Math.round(h / g)),
    k = o.hits + "@" + cw + "x" + ch;
  if (o.pxk === k) return;
  o.pxk = k;
  import("./duckparts.js")
    .then((m) => m.duckFromParts(o.dk, cw, ch))
    .then((c) => {
      if (o.pxk !== k) return;
      if (!c) {
        o.dk = null;
        o.url = zombieURL(o.l, o.i, o.hits);
        o.pxk = "";
        plainImg(o);
        return;
      }
      let cv = o.img;
      if (cv.tagName !== "CANVAS") {
        cv = document.createElement("canvas");
        cv.className = "px";
        cv.setAttribute("aria-hidden", "true");
        o.img.replaceWith(cv);
        o.img = cv;
      }
      const g = cv.getContext("2d", { willReadFrequently: true }); // (in memory: on a graphics card each zombie's canvas was a layer of its own, 52 more in a Survival crowd, and every frame took longer to put together)
      cv.width = c.width; // (set even when it's the same: that clears it)
      cv.height = c.height;
      g.drawImage(c, 0, 0);
    })
    .catch(() => {});
}
/* back to its picture as an img (its wounds gone, Gore turned off, or made whole) */
function plainImg(o) {
  if (o.img.tagName !== "CANVAS") return;
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  o.img.replaceWith(img);
  o.img = img;
}
/* the zombies in a new state: where each glides to, its hits, its swipes, its death.
   A new beat is one where a zombie moved. Before, any change counted (a hit's HP between two beats too), and every
   change cut the glide's time for all of them at once: the bigger the crowd and the more shots, the more often they
   jumped ahead, then stood till the next beat (the owner's, Nov 18 10:38Z: "we need to make sure zombies dont jitter or
   feel slow on the computer (like kinda laggy feeling) when mobs get large"). Now the time between beats is evened out
   (a change right after a beat is part of it), and each zombie keeps the glide time it started with (o.g), a little
   over a beat, so it is still on its way when the next one comes instead of stopping and starting */
const GLIDE = { min: 120, max: 400, even: 0.35, over: 1.1, same: 90 };
const FACE_HOLD = 300; // ms a zombie keeps going the other way before it turns (no flipping back and forth on a bump)
function seeZombies(s, ctx, now) {
  const zs = zombiesOf(s);
  let fresh = false;
  for (const z of zs) {
    const o = Z.get(z.i);
    if (!o || z.x !== o.tx || z.y !== o.ty) {
      fresh = true;
      break;
    }
  }
  if (fresh && (!snapAt || now - snapAt >= GLIDE.same)) {
    const beat = Math.max(
      GLIDE.min,
      Math.min(GLIDE.max, snapAt ? now - snapAt : 200),
    );
    gap += (beat - gap) * GLIDE.even;
    snapAt = now;
  }
  const seen = new Set(),
    me = s.pos && s.pos[ctx.me],
    mz = me && zOf(me, "body", clockNow()); // (in a jump: from its arc, heights.js)
  for (const z of zs) {
    seen.add(z.i);
    let o = Z.get(z.i);
    if (!o) {
      o = zombieEl(z);
      Z.set(z.i, o);
    }
    o.sp = z.sp; // (a Sandbox spawn's: its zone Outlines, sandboxrules.js sbOlColor)
    if (fresh && (z.x !== o.tx || z.y !== o.ty)) {
      o.fx = o.x;
      o.fy = o.y;
      o.tx = z.x;
      o.ty = z.y;
      o.t0 = now;
      o.g = gap * GLIDE.over;
      if (Math.hypot(z.x - o.x, z.y - o.y) > 300) {
        o.fx = o.x = z.x;
        o.fy = o.y = z.y;
      } // (far: there at once, both ways; before, only across, and it slid the rest down or up)
      /* which way it faces: turned only once it keeps going the other way a moment (FACE_HOLD). Bumping into another
         zombie or a wall pushed it back and forth a few px, and its picture flipped each time, as if squished (the
         owner's, Nov 19 19:27Z: "I do not want a squish effect on zombies, for example, when they walk into each other
         or walk into a wall") */
      const dir = Math.abs(z.x - o.x) > 2 ? (z.x > o.x ? 1 : -1) : 0;
      if (!dir || dir === o.face) o.turn = 0;
      else if (!o.went)
        o.face = dir; // (its first steps: the way it goes at once)
      else if (o.turn !== dir) {
        o.turn = dir;
        o.turnAt = now;
      } else if (now - o.turnAt >= FACE_HOLD) o.face = dir;
      if (dir) o.went = 1;
    }
    const shown = !o.el.hidden; // (one no camera here sees: only its numbers change, its look waits until it's seen)
    /* one my shots can't reach from where I stand (the sightline, layout.js seeLine) is drawn darker (the owner's, Nov 20
       02:14Z: "we can draw the zombies a little darker. If you can't hit them") */
    const dark =
      shown &&
      z.st !== 3 &&
      !!me &&
      slabBetween(me.x * W, me.y * H, mz, z.x, z.y, zOf(z, "zombie"));
    if (o.dark !== dark) o.el.classList.toggle("l4-unseen", (o.dark = dark));
    belowBody(o.el, z.x, z.y, zOf(z, "zombie")); // (and darker for each elevation it's under me: below.js)
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
    } // (set on fire: one big flame over it, as a duck's)
    o.want = (s.hang.zw || {})[z.i] || "";
    relook(o, z.l); // (a new look, Survival's remodel: its picture and box are made again at once, not at its next wound)
    o.l = z.l;
    o.ng = !!s.options.noGore;
    if (shown) wounds(o, z.l, z.i); // (the wounds its hits left: holes, cuts, bruises, an arrow, a chunk gone, its head blown off; l4ddart.js)
    const sh = (Math.max(0, z.hp) / (z.l[0] || 1)).toFixed(3);
    if (o.sh !== sh) {
      o.sh = sh;
      o.bar.style.setProperty("--hp", sh);
      if (+sh < 1) o.el.classList.add("hurt"); // (its HP bar shows once it has taken damage, then stays: the owner's, Nov 17. A hit: what it lost turns white, then drains fast; dead, it drains to black, then fades: css/app.css, the owner's, Nov 17 17:41Z)
    }
    o.hp = z.hp;
    o.st = z.st;
    o.k = z.k; // (the roof it climbs or walks, and its jump onto the canopy: heights.js zOf)
    o.j = z.j;
    [o.a, o.wu] = [z.a, z.wu]; // (its last swipe, and its swing's wind-up since: it leans back, draw)
  }
  for (const [i, o] of Z)
    if (!seen.has(i)) {
      o.el.remove();
      Z.delete(i);
    }
}
/* every count of boards on every opening (0 to 5) made into pixels once while the game loads, so a board going up or
   torn down shows its picture at once (pxdom.js finds it made), never a moment of nothing (the owner's, Nov 20 20:46Z:
   "pop-ins"): each laid out unseen at the size it shows, then taken away once made */
let boardsWarm = 0,
  warmIn = null; // (the layer they were made in: a game's world is made again as it starts, and its boards with it)
function warmBoards(sc) {
  if (
    !pixelOn() ||
    !layer ||
    !sc ||
    (boardsWarm === sc && warmIn === layer) ||
    !OPENINGS.length
  )
    return;
  boardsWarm = sc;
  warmIn = layer;
  const els = [];
  for (const o of OPENINGS)
    for (let n = 0; n <= 5; n++) {
      const el = document.createElement("div");
      el.className = "l4-boards k-" + o.kind;
      el.style.opacity = "0"; // (not visibility: pxdom.js copies that into the picture, opacity it leaves out)
      el.style.transform = `translate(-99999px, 0) scale(${sc.toFixed(4)})`;
      el.innerHTML = boardsSVG(o, n);
      layer.append(el);
      els.push(el);
    }
  holdGame(
    new Promise((done) => {
      const t0 = performance.now();
      const look = () => {
        const left = els.filter((el) => {
          const svg = el.firstElementChild;
          return el.isConnected && svg && !svg.hasAttribute("data-px"); // (one whose world went needs nothing)
        });
        if (!left.length || performance.now() - t0 > 15000) {
          els.forEach((el) => el.remove());
          return done();
        }
        setTimeout(look, 100);
      };
      setTimeout(look, 300);
    }),
  );
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
    el.innerHTML = d.w ? orbHTML(d.w) : `<i>${DROP_ICONS[d.k] || ""}</i>`; // (a weapon or an item a zombie left: its orb)
    layer.append(el);
    D.set(d.n, { el, n: d.n, kind: d.k, x: d.x, y: d.y, until: d.until });
  }
}
/* a drop's outline on the ground, in its own color, and its arrow when it's a floor away (outlines.js DROP_OL, the
   owner's, Nov 18 13:58Z), so one under a tree's crown, a roof or out of sight isn't missed: its symbol's shape, where
   the drop's box is (css .l4-drop: 46 × 46, its foot 16 over the spot), still at the middle of its bob. Gone with the
   drop once it's picked up (seeDrops) */
function dropOutline(Wd, o, p, sc, unseen, myFloor) {
  const w = 46 * sc,
    x = p.left - 23 * sc,
    y = p.top - 62 * sc,
    img =
      DROP_ICONS[o.kind] && olPic("drop-" + o.kind, DROP_ICONS[o.kind], w, w);
  if (!img) return;
  olAdd({
    id: "dr" + o.n,
    img,
    x,
    y,
    w,
    h: w,
    kind: "drop_" + (DROP_OL[o.kind] ? o.kind : "ammo"),
    hidden:
      unseen ||
      Wd.coverAt(x, x + w, y, y + w, Math.round(sortY(o.x, o.y, 0)) + 10),
    ...olAway(o.x, o.y, 0, myFloor),
  });
}
/* between rounds (every zombie dead, before the ducks are ready), a thin yellow square on the ground round the fireplace or
   Downpour's car: stand inside it to spin for a weapon (the owner, Nov 17) */
let sqEl = null,
  sqSig = "";
function spinSquare(s, ctx) {
  const L = s.hang.l4,
    Wd = ctx.world,
    rest = !!(sqEl && L && !L.over && L.wait && !isSurv(s)); // (none in Survival: nothing there to buy or spin, the owner's, Nov 20 02:32Z)
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
          const p = Wd.toScreen(a < 0 ? x0 : x1, b < 0 ? y0 : y1, z),
            [x, y] = Wd.local(p.left, p.top); // (it's in the world's box: world.js)
          return x.toFixed(1) + "," + y.toFixed(1);
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
   JPOOL.ms (bloodpool.js; the owner's, Nov 17 18:05Z: "on death a blood pool spreads"); none with Gore off. Its own few dark ellipses,
   as flat as the floor. Every other duck that dies has the same one (game.js .gduck-pool) */
let poolEl = null,
  poolAt = 0,
  poolSig = "";
function seePool(s, ctx) {
  if (!poolEl) return;
  const Wd = ctx.world,
    dead = wilds(s).find((id) => (P4(s, id) || {}).ex), // (the first of them lying dead gets the one pool)
    down = !!dead,
    a = down && !+s.options.noGore ? Wd.at(dead) : null,
    show = !!a && seenFrom(a.x, a.y, Wd.inside, a.z);
  if (!down) poolAt = 0;
  else if (!poolAt) poolAt = clockNow();
  if (poolEl.hidden !== !show) poolEl.hidden = !show;
  if (!show) return;
  if (poolEl._sc !== Wd.sc) {
    poolEl._sc = Wd.sc;
    poolEl.innerHTML = poolHTML(120 * Wd.sc); // (css .l4-jpool: 120 px, scaled with the world: its pixels the grid's)
  }
  const k = Math.min(1, (clockNow() - poolAt) / JPOOL.ms),
    grow = 0.15 + 0.85 * (1 - (1 - k) * (1 - k)),
    p = Wd.toScreen(a.x, a.y + 4, a.z),
    sig = `${p.left.toFixed(1)} ${p.top.toFixed(1)} ${(Wd.sc * grow).toFixed(3)}`;
  if (sig === poolSig) return;
  poolSig = sig;
  poolEl.style.transform = `${Wd.boxTr(p.left, p.top)} scale(${(Wd.sc * grow).toFixed(3)})`;
  poolEl.style.zIndex = a.z < 1 ? 3 : Math.round(sortY(a.x, a.y - 30, a.z)); // (on the floor under the ducks; on a roof, just under him)
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
    k === "merchant"
      ? rainbowHTML("The Merchant has Arrived", { seed: 5 }) // (the owner's, Nov 18 13:46Z: "THe text for the merchant arriving is: \"The Merchant has Arrived\"")
      : k === "help"
        ? rainbowHTML("Help has Arrived", { seed: 9 }) // (Survival's friendly squad, as the merchant's: allies.js)
        : k === "sale"
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
  gotEl.classList.remove("on", "nuke", "merchant");
  void gotEl.offsetWidth;
  gotEl.classList.add("on");
  if (k === "merchant" || k === "help") gotEl.classList.add("merchant"); // (3 s, then a 1 s fade: css l4-got-merchant)
  if (k === "nuke") {
    gotEl.classList.add("nuke");
    nukeScreen(gotEl);
    sfx.nuke();
  } else if (k !== "merchant") sfx.dropGot(); // (the merchant's arrival has his own bell: l4ddsfx.js)
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
const DROPS_SEED = {
  kill: 3,
  ammo: 7,
  nuke: 2,
  speed: 9,
  double: 4,
  sale: 6,
  coins: 8,
};

/* my all-time stats (not in test rooms, nor with test commands used: cheatflag.js): a game once its first round starts, a round each time one is cleared, and the
   best round reached; with Round 16 Start on, its own stats (store.js statMode) */
let kzGame = "",
  kzDone = 0; // the zombies I killed this game that the all-time stats already hold
function record(s, L, cleared, me) {
  const st = statsOf(s);
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
/* Survival: a timer where the round would be, in its font (the owner's: "a timer replaces the round number"); the
   stats: a game once it starts, the best time (in seconds, as titles) once everyone's down */
let clockShown = -1;
function seeClock(s) {
  if (!hud || !isSurv(s) || !s.hang.l4) return;
  const t = Math.floor(survTime(s, clockNow()) / 1000);
  if (t === clockShown) return;
  clockShown = t;
  hud.innerHTML = `<b>${clockOf(t)}</b>`;
}
function survRecord(s, L) {
  const st = statsOf(s),
    game = `${s.id}:${s.startedAt}:${L.g || 0}`;
  if (!st || profile.stats.lastGame === game) return;
  profile.stats.lastGame = game;
  st.games++;
  save();
}
/* ---------- the HUD: "Round N", and the end ---------- */
function seeHud(s, ctx) {
  const L = s.hang.l4;
  if (!hud || !L) return;
  if (isSurv(s)) {
    seeClock(s);
    survRecord(s, L);
  } else if (roundShown !== L.r) {
    if (roundShown >= 0 && L.r > roundShown)
      record(s, L, L.r - roundShown === 1, ctx.me);
    /* Sandbox: no rounds to count, and no big "Sandbox" over the map either (the bar at the top already says it: the
       owner's row 199 test saw it over the map) */
    hud.hidden = isSb(s);
    ctx.world.board.classList.toggle("l4-nohud", isSb(s)); // (its points go up in its place)
    hud.innerHTML = isSb(s)
      ? ""
      : `<span class="l4-round-w">Round</span> <b>${L.r}</b>`;
    hud.classList.remove("new");
    void hud.offsetWidth;
    if (roundShown >= 0) hud.classList.add("new"); // (a new round: it pulses)
    roundShown = L.r;
  }
  /* between rounds: End turn (Ready before round 1), with how many pressed it and how many it takes */
  const w = !L.over && !isSb(s) && L.wait, // (Sandbox: round 0 for good, with no Ready to press)
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
  if (L.over && !isSb(s)) {
    const st = statsOf(s);
    if (st) {
      recordKills(s, st, `${s.id}:${s.startedAt}:${L.g || 0}`, ctx.me);
      if (isSurv(s))
        st.titles = Math.max(
          st.titles || 0,
          Math.floor(survTime(s, L.over.at) / 1000),
        ); // (Survival: the best time)
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
  const sbHow = isSb(s) && L.over.sb, // (Sandbox's Rules: everyone out of lives, rules.js SB_OUT_MS)
    moving =
      sbHow === "lobby" ||
      sbHow === "again" ||
      (!sbHow && (votesDue(s).length || s.options.modePick === "random"));
  const kz = ((s.hang && s.hang.l4kz) || {})[ctx.me] || 0,
    said = sbHow
      ? `You killed <b>${kz}</b> ${kz === 1 ? "zombie" : "zombies"}.`
      : isSurv(s)
        ? `You lasted <b>${clockOf(survTime(s, L.over.at) / 1000)}</b> and killed <b>${kz}</b> ${kz === 1 ? "zombie" : "zombies"}.`
        : `You made it to <b>Round ${L.over.r}</b>.`;
  over.innerHTML = `<div class="l4-over-card"><h2>${sbHow ? "Everyone's out" : "Everyone's down"}</h2><p>${said}</p>${
    moving
      ? `<p class="small dim">${sbHow === "lobby" ? "Back to the lobby in a moment." : sbHow === "again" ? "Starting over in a moment." : votesDue(s).length ? "On to the vote in a moment." : "On to the next game in a moment."}</p>`
      : host
        ? '<div class="l4-over-btns"><button type="button" class="btn yellow" data-l4="again">Play again</button><button type="button" class="btn" data-a="lobby">Back to the lobby</button></div>'
        : `<p class="small dim">Waiting for ${nameHTML(hostName)} to play again or go back to the lobby.</p>`
  }</div>`;
  over.hidden = false;
}

/* ---------- the dark ---------- */
/* one soft light, drawn once: every light's hole in the dark is this, sized and faded (no new gradient a frame) */
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
function inBeam(x, y) {
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
  for (const el of ducksOn(Wd.board))
    if (el.dataset.pid)
      el.classList.toggle("l4-lit", lit.includes(el.dataset.pid));
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
  seeClock(s); // (Survival's timer goes on between states too)
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
        0.2 + 0.05 * (5 - (brd[o.id] ?? L4.BOARDS)),
      ]);
  }
  /* the merchant stands in a little light while he sells, and the fireplace's weapon glows while it's out */
  if (dp() || Wd.inside) {
    const mm = merchantOf(s);
    if (mm && mm.st === "here") {
      const p = Wd.toScreen(mm.x, mm.y, 30);
      if (
        seenFrom(mm.x, mm.y, Wd.inside) &&
        on(p.left * q, p.top * q, 100 * sc)
      )
        holes.push([p.left * q, p.top * q, 100 * sc, 0.5]);
    }
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
      ...(isSurv(s) ? [] : [[ANGEL.X, ANGEL.Y, ANGEL.Z + 70, 90]]), // (Survival has no Angel machine, so no light where it stood: the owner's, Nov 20 02:32Z)
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
    if (id !== ctx.me && invOn(s, id)) continue; // (invisible: no glow, no flashlight to anyone else, sbgod.js)
    const c = Wd.toScreen(a.x, a.y, a.z + 26);
    holes.push([c.left * q, c.top * q, GLOW * sc, 0.55]);
    if (!up(s, id) || off[id] || sbNoLight(s, id)) continue; // (Sandbox: a flashlight only once taken from loot)
    const [dx, dy] = aimOf(s, id, ctx);
    beamOf(id, a, Math.atan2(dy, dx));
  }
  /* Survival's criminals' flashlights too (gunmenview.js) */
  for (const [x, y, t] of gunLights()) {
    const a = { x, y, z: heightAt(x, y) };
    if (seenFrom(x, y, Wd.inside, a.z)) beamOf("", a, t);
  }
  /* one flashlight's cone from a (world px), its angle t: its rays stop at the walls */
  function beamOf(id, a, t) {
    const c = Wd.toScreen(a.x, a.y, a.z + 26);
    if (!on(c.left * q, c.top * q, CONE.far * sc)) return; // (its light can't reach the screen: no rays)
    const roof = onRoof(a.x, a.y, a.z), // (up on a roof: over the walls, nothing stops it)
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
    for (const [x, y] of gunBodies()) lit(x, y, heightAt(x, y), 1);
  }
  litNames(s, ctx, beams);
  const f = (v) => v.toFixed(1),
    keys = cones.map(
      (c) =>
        `${w},${h},${low()},${Wd.inside},` +
        f(c[0]) +
        f(c[1]) +
        c[2].map((p) => f(p[0]) + f(p[1])).join() +
        litBy(c, Wd)
          .map((p) => p.id)
          .join("."), // (and what it lights: a prop shown or hidden draws it again)
    ),
    key = [
      w,
      h,
      ...holes.map((o) => f(o[0]) + f(o[1]) + f(o[2]) + o[3].toFixed(2)),
      ...keys,
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
  g.fillStyle = `rgba(3,4,10,${powerOn(s) ? (Wd.inside ? DARK_ON_IN : DARK_ON) : DARK})`;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-out";
  const st = stamp();
  for (const [x, y, r, k] of holes) {
    g.globalAlpha = Math.min(1, k);
    g.drawImage(st, x - r, y - r, 2 * r, 2 * r);
  }
  g.globalAlpha = 1;
  /* the cones, each cut out in one go. Their soft gradients cost the most of the dark, and on Duck Cabin a flickering lamp
     or the Angel machine's glow redraws it many times a second while most cones stand still (the owner, row 3: "Downpour
     seems to perform better than Cabin"), so each cone is drawn on its own small canvas only when it moves. Black drawn
     over black there adds up the same as cutting each pass out in turn: the dark looks just as it did */
  coneSp.length = Math.min(coneSp.length, cones.length);
  for (let i = 0; i < cones.length; i++) {
    const o = coneSprite(i, cones[i], keys[i], Wd, q, w, h);
    if (o) g.drawImage(o.cv, 0, 0, o.w, o.h, o.x, o.y, o.w, o.h);
  }
  g.globalCompositeOperation = "source-over";
}
/* cone i of the dark (paint), black on a clear canvas just big enough for it and what it lights (shineProps: on into the
   walls its rays stop at, raised up the tallest prop's height, so that much more all round): { cv, x, y } where it goes on
   the dark, or null when none of it is on the screen */
function coneSprite(i, c, key, Wd, q, w, h) {
  const o =
    coneSp[i] || (coneSp[i] = { cv: null, key: "", x: 0, y: 0, w: 0, h: 0 });
  if (o.key === key) return o.cv && o;
  o.key = key;
  const [ox, oy, pts, far] = c,
    up = tallest() * Wd.sc * q;
  let x0 = ox,
    y0 = oy,
    x1 = ox,
    y1 = oy;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  x0 = Math.max(0, Math.floor(x0 - up) - 1);
  y0 = Math.max(0, Math.floor(y0 - up) - 1);
  x1 = Math.min(w, Math.ceil(x1 + up) + 1);
  y1 = Math.min(h, Math.ceil(y1 + up) + 1);
  if (x1 <= x0 || y1 <= y0) {
    o.cv = null;
    return null;
  }
  const cv2 = o.cv || document.createElement("canvas");
  o.cv = cv2;
  o.x = x0;
  o.y = y0;
  o.w = x1 - x0;
  o.h = y1 - y0;
  /* only ever grown, a 64 px step at a time: a canvas made a new size is a new canvas (each walking step was one) */
  if (cv2.width < o.w || cv2.height < o.h) {
    cv2.width = Math.max(cv2.width, Math.ceil(o.w / 64) * 64);
    cv2.height = Math.max(cv2.height, Math.ceil(o.h / 64) * 64);
  }
  const c2 = cv2.getContext("2d");
  c2.setTransform(1, 0, 0, 1, 0, 0);
  c2.globalCompositeOperation = "source-over";
  c2.globalAlpha = 1;
  c2.clearRect(0, 0, cv2.width, cv2.height);
  c2.setTransform(1, 0, 0, 1, -x0, -y0);
  /* a cone: three passes, each a little narrower, so its middle is as bright as the lights on and its edges soft. On Low
     graphics or Data saving: one pass, one plain shade, about as bright as the soft one on average */
  if (low()) {
    c2.fillStyle = "rgba(0,0,0,.55)";
    c2.beginPath();
    c2.moveTo(ox, oy);
    for (const p of pts) c2.lineTo(p[0], p[1]);
    c2.closePath();
    c2.fill();
  } else {
    const rg = c2.createRadialGradient(ox, oy, 0, ox, oy, far);
    rg.addColorStop(0, "rgba(0,0,0,.62)");
    rg.addColorStop(0.7, "rgba(0,0,0,.55)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    c2.fillStyle = rg;
    const n = pts.length - 1;
    for (const cut of [0, 0.18, 0.34]) {
      const a = Math.round(n * cut),
        b = n - a;
      c2.beginPath();
      c2.moveTo(ox, oy);
      for (let k = a; k <= b; k++) c2.lineTo(pts[k][0], pts[k][1]);
      c2.closePath();
      c2.fill();
    }
  }
  shineProps(c2, Wd, [c], q);
  return o;
}
/* the tallest prop a flashlight lights (litProps), in world px */
let tallH = 0,
  tallRev = -1;
const tallest = () => {
  if (tallRev !== layoutRev()) {
    tallRev = layoutRev();
    tallH = Math.max(0, ...litProps().map((p) => p.h));
  }
  return tallH;
};
/* the props cone c may light: shown now, under the box its rays reach (up on a roof: only the roof's top) */
function litBy(c, Wd) {
  if (c[5]) return [];
  const [ax, ay, ends] = c[4];
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
  return litProps().filter((p) => {
    let l = p.x,
      r = p.x + p.w;
    if (p.kind === "fence") {
      const t = fenceLean(p, W); // (its top leans out toward the map's edge: all of that lights)
      if (t > 0) r += t;
      else l += t;
    }
    if (l > x1 || r < x0 || p.y > y1 || p.y + p.d < y0) return false;
    const el = Wd.propEl(p.id); // (only what's drawn now: not what's left out of this map, or hidden from in here)
    return !!el && !el.hidden;
  });
}
/* a flashlight lights what it points at, not just the floor (the owner, Nov 17): the part of each prop's footprint inside
   a cone (on into the wall a ray stops at), raised up the prop's height, so its front and its top show in the light as
   bright as the floor there. Drawn black on its cone's own canvas (coneSprite), which paint() cuts out of the dark */
function shineProps(g, Wd, cones, q) {
  const sc = Wd.sc * q,
    plain = low();
  for (const c of cones) {
    const [ax, ay, ends] = c[4],
      poly = [[ax, ay], ...ends];
    for (const p of litBy(c, Wd)) {
      let l = p.x,
        r = p.x + p.w;
      if (p.kind === "fence") {
        const t = fenceLean(p, W); // (its top leans out toward the map's edge: all of that lights)
        if (t > 0) r += t;
        else l += t;
      }
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

/* ---------- a character standing on the board: the merchant, or Justin in the toilet ---------- */
function butlerEl(svg, name) {
  const v = svg
      .match(/viewBox="([^"]+)"/)[1]
      .split(" ")
      .map(Number),
    h = (64 * v[3]) / v[2],
    feet = (64 * (v[3] - 10)) / v[2],
    el = document.createElement("div");
  el.className = "hang-npc duck l4-butler on-ground"; // (on-ground: as dark as the ground under my floor, below.js)
  const url = svgDataURL(svg);
  el.innerHTML = `<div class="hang-npc-body"><img alt="" draggable="false" src="${url}" style="width:100%;height:100%"></div><span class="gduck-name hang-npc-name">${nameHTML(name)}<span class="gduck-hp" aria-hidden="true"><b></b><i></i></span></span>`; // (the HP in his tag, as a player's: shown once he's hurt, the merchant's)
  const body = el.firstChild;
  body.style.width = "64px";
  body.style.height = h.toFixed(1) + "px";
  body.style.left = "-32px";
  body.style.top = (-feet).toFixed(1) + "px";
  body.style.transformOrigin = `32px ${feet.toFixed(1)}px`;
  layer.append(el);
  return { el, body, url, bh: h, feet };
}
/* ---------- the merchant (the rules' s.hang.l4m) ----------
   He's a duck's size now (the owner's, Nov 18 13:46Z: "Justin's butler is no longer small"), in his look for this visit
   (merchants.js, rolled by the rules so everyone sees the same one). He glides to where the rules have him (walking
   in, at his spot, running off), faces the way he goes, fades as he jumps off the balcony or drops over the fence, and
   lies dead where he fell. His lines show in a bubble over him for MERCH.SAY ms.
   Hurt, he is anyone else (the owner's, Nov 18 15:35Z: "The merchants should have a health bar like anyone else. It
   should show their sprint meter when they're moving like anyone else. And if it's the Phil, the murderous, when he
   uses his knife, it has a cooldown meter just like anyone else ... any merchant that gets damage gets gore effects ...
   When a merchant gets hit, their health bar shows ... if the merchant falls over and dies, they have a puddle of blood
   leaving their corpse, and their corpse stays there permanently"):
     - his HP (m.hp of m.max, the rules') in his tag, a player's red blocks, once he's lost one, and it stays up;
     - a hit: the red blink, the shake, "−1 HP" over him, and his blood with bits of him in his color, as a zombie's;
     - his wounds (m.w, wounds.js codes, as a player's) on his picture, his head gone after a crit (the rules' l4crit
       fx bursts it, as a zombie's: game.js); none with Gore off;
     - his sprint (m.sp, 0 to 1) as my thin blue bar under his tag while it isn't full; Phil's knife (the rules'
       l4mstab fx) as my white cooldown bar, MERCH.STAB_MS long;
     - dead: a pool of blood spreads under him (as every duck's: game.js .gduck-pool), and he and it stay for good */
let mSig = "",
  mAt = null,
  mSeen = { v: null, hp: null, alive: false, fx: 0, stab: 0 },
  mPoolAt = 0;
/* his wound codes as I draw them (Gore off: only a hat knocked off); wounds.js woundLook makes their look */
const mWounds = (s, m) => {
  const w = typeof m.w === "string" ? m.w : "";
  return +s.options.noGore ? goreFree(w) : w;
};
const mMax = (m) => Math.max(1, +m.max || 4.5); // (m.max: the HP he rolled, as a zombie's: the rules' hp0)
function drawMerchant(ctx, t) {
  const s = ctx.state(),
    m = merchantNow(s),
    Wd = ctx.world,
    sc = Wd.sc,
    dead = !!m && m.st === "dead",
    wc = m ? mWounds(s, m) : "",
    sig = m && m.who ? [m.v, m.id, m.roll, dead ? 1 : 0].join() : "";
  if (sig !== mSig) {
    mSig = sig;
    butler?.el.remove();
    butler = null;
    if (!sig) return;
    const hid = !!m.who.hideName;
    butler = butlerEl(
      merchantSVG(m.who, m.roll, {
        size: 64,
        dead,
        ...(hid ? { title: "The Merchant" } : {}),
        ...woundLook(wc),
      }),
      m.who.name,
    );
    butler.wc = wc;
    const tag = butler.el.querySelector(".hang-npc-name");
    if (hid) {
      for (const n of [...tag.childNodes])
        if (!n.classList || !n.classList.contains("gduck-hp")) n.remove();
      tag.classList.add("bar-only");
    } // (no name over the soldier: his tag is his HP bar only, as the other ducks' in Dead Ducks Arcade)
    butler.tag = tag;
    butler.hpEl = tag.querySelector(".gduck-hp");
    butler.el.classList.add("l4-merchant");
    butler.el.classList.toggle("dead", dead);
    butler.say = document.createElement("div");
    butler.say.className = "hang-npc-say";
    butler.el.prepend(butler.say);
    butler.sayN = 0;
    if (!mAt || mAt.v !== m.v) mAt = { v: m.v, x: m.x, y: m.y, t };
    if (mSeen.v !== m.v) {
      mSeen = { v: m.v, hp: null, alive: !dead, fx: fxTop(s), stab: 0 };
      mPoolAt = 0;
    }
    if (dead) {
      if (!mPoolAt) mPoolAt = mSeen.alive ? clockNow() : -1; // (seen falling: the pool spreads; dead when I came: there already)
      butler.pool = document.createElement("span");
      butler.pool.className = "l4-jpool l4-mpool";
      butler.pool.setAttribute("aria-hidden", "true");
      butler.pool.innerHTML = poolHTML(120 * Wd.sc); // (css .l4-jpool: 120 px, scaled with the world: its pixels the grid's)
      butler.el.prepend(butler.pool);
    }
  }
  if (!butler) return;
  /* his wounds now (a new picture only when they change) */
  if (butler.wc !== wc) {
    butler.wc = wc;
    butler.url = svgDataURL(
      merchantSVG(m.who, m.roll, {
        size: 64,
        dead,
        ...(m.who.hideName ? { title: "The Merchant" } : {}),
        ...woundLook(wc),
      }),
    );
    butler.uk = "";
    butler.pxk = "";
    if (!pixelOn()) butler.body.firstChild.src = butler.url;
  }
  /* glide (a big jump: there at once) */
  const dt = Math.min(0.1, Math.max(0, (t - mAt.t) / 1000)),
    gap = Math.hypot(m.x - mAt.x, m.y - mAt.y),
    k = gap > 300 ? 1 : Math.min(1, dt * 10);
  mAt.x += (m.x - mAt.x) * k;
  mAt.y += (m.y - mAt.y) * k;
  mAt.t = t;
  const z = heightAt(mAt.x, mAt.y),
    p = Wd.toScreen(mAt.x, mAt.y, z),
    hide =
      !seenFrom(mAt.x, mAt.y, Wd.inside) ||
      !Wd.onView(p.left - 60, p.top - 140, 120, 160);
  if (butler.el.hidden !== hide) butler.el.hidden = hide;
  mHurt(s, m, dead, p, sc, hide);
  if (hide) return;
  const tr = Wd.boxTr(p.left, p.top);
  if (butler.tr !== tr || butler.dz !== dead) {
    butler.tr = tr;
    butler.dz = dead;
    butler.el.style.transform = tr;
    butler.el.style.zIndex = dead
      ? bodyZ(mAt.x, mAt.y, z) // (dead: under every duck, layout.js)
      : Math.round(sortY(mAt.x, mAt.y, z)) + 10;
  }
  pxPic(butler, butler.body.firstChild, 64 * sc, butler.bh * sc);
  if (butler.k !== sc) {
    butler.k = sc;
    butler.body.style.transform = `scale(${sc.toFixed(4)})`;
    butler.el.style.setProperty("--nt", (2 * sc).toFixed(1) + "px");
    butler.el.style.setProperty("--h", (butler.feet * sc).toFixed(1) + "px");
  }
  butler.el.classList.toggle("flip", !dead && m.f < 0);
  butler.el.classList.toggle("gone", m.st === "jump");
  /* his blood, under him for good once he's dead (none with Gore off) */
  if (butler.pool) {
    const off = !!+s.options.noGore;
    if (butler.pool.hidden !== off) butler.pool.hidden = off;
    const kp = mPoolAt < 0 ? 1 : Math.min(1, (clockNow() - mPoolAt) / JPOOL.ms),
      grow = 0.15 + 0.85 * (1 - (1 - kp) * (1 - kp)),
      pk = `translate(${(-butler.feet * 0.42 * sc).toFixed(1)}px, ${(4 * sc).toFixed(1)}px) scale(${(sc * grow).toFixed(3)})`; // (where he lies: on his side, his head the way he fell)
    if (butler.poolK !== pk) {
      butler.poolK = pk;
      butler.pool.style.transform = pk;
    }
  }
  /* his sprint, and Phil's knife: my own two thin bars, under his tag */
  mBars(s, m, dead);
  /* Survival: armed and fighting back, his gun in his hand and his shots (l4ddrules.js merchantShoots) */
  const gun = m.st === "shoot" && !dead ? m.gun || "" : "";
  if (butler.gun !== gun) {
    butler.gun = gun;
    butler.body.querySelector(".sb-held")?.remove();
    const hd = gun && heldOf({ hw: gun });
    if (hd) {
      butler.body.style.setProperty("--feet", butler.feet.toFixed(1) + "px");
      butler.body.insertAdjacentHTML(
        "beforeend",
        `<img class="sb-held" alt="" draggable="false" src="${hd.url}" style="--gw:${hd.gw}">`,
      );
    }
  }
  if (butler.shot === undefined) butler.shot = m.sh ? m.sh[0] : 0; // (only shots from now on)
  if (m.sh && m.sh[0] !== butler.shot) {
    butler.shot = m.sh[0];
    const to = Wd.toScreen(m.sh[1], m.sh[2], heightAt(m.sh[1], m.sh[2]));
    if (Date.now() - m.sh[0] < 1500)
      npcShot(
        Wd.board.querySelector(".fxl"),
        p.left + 0.42 * 64 * sc * (m.f < 0 ? -1 : 1),
        p.top - 28.8 * sc,
        to.left,
        to.top - 29 * sc,
        m.gun,
      );
  }
  /* his words */
  const now = clockNow(),
    say = m.say;
  if (say && say.n !== butler.sayN) {
    butler.sayN = say.n;
    butler.say.textContent = say.text;
  }
  const on = !!say && !dead && now < say.t + MERCH.SAY;
  if (butler.el.classList.contains("saying") !== on)
    butler.el.classList.toggle("saying", on);
}
/* the merchants killed before this one: their bodies stay where they fell for the rest of the game, each in its pool
   of blood (the rules' s.hang.l4mc: { v, id, roll, x, y, f, w, t }; the owner's "their corpse stays there
   permanently"). The one still lying in s.hang.l4m is drawMerchant's */
const CORPSES = new Map(); // visit → { el, body, url, bh, feet, pool, … }
function drawCorpses(ctx) {
  const s = ctx.state(),
    Wd = ctx.world,
    sc = Wd.sc,
    list = Array.isArray(s.hang.l4mc) ? s.hang.l4mc : [],
    cur = merchantOf(s),
    gore = !+s.options.noGore,
    seen = new Set();
  for (const c of list) {
    if (!c || (cur && cur.v === c.v && cur.st === "dead")) continue;
    const who = merchantById(c.id);
    if (!who) continue;
    const wc = gore ? c.w || "" : goreFree(c.w || ""),
      key = c.v + "|" + wc;
    seen.add(c.v);
    let o = CORPSES.get(c.v);
    if (o && o.key !== key) {
      o.el.remove();
      o = null;
    }
    if (!o) {
      o = butlerEl(
        merchantSVG(who, c.roll, {
          size: 64,
          dead: true,
          ...(who.hideName ? { title: "The Merchant" } : {}),
          ...woundLook(wc),
        }),
        who.name,
      );
      o.key = key;
      o.el.classList.add("l4-merchant", "dead");
      o.el.querySelector(".hang-npc-name")?.remove(); // (his name went with him)
      o.pool = document.createElement("span");
      o.pool.className = "l4-jpool";
      o.pool.setAttribute("aria-hidden", "true");
      o.pool.innerHTML = poolHTML(120 * Wd.sc); // (css .l4-jpool: 120 px, scaled with the world: its pixels the grid's)
      o.el.prepend(o.pool);
      CORPSES.set(c.v, o);
    }
    const z = heightAt(c.x, c.y),
      p = Wd.toScreen(c.x, c.y, z),
      hide =
        !seenFrom(c.x, c.y, Wd.inside) ||
        !Wd.onView(p.left - 60, p.top - 140, 120, 160);
    if (o.el.hidden !== hide) o.el.hidden = hide;
    if (hide) continue;
    const tr = Wd.boxTr(p.left, p.top);
    if (o.tr !== tr) {
      o.tr = tr;
      o.el.style.transform = tr;
      o.el.style.zIndex = bodyZ(c.x, c.y, z); // (under every duck: layout.js)
    }
    pxPic(o, o.body.firstChild, 64 * sc, o.bh * sc);
    if (o.k !== sc) {
      o.k = sc;
      o.body.style.transform = `scale(${sc.toFixed(4)})`;
      o.pool.style.transform = `translate(${(-o.feet * 0.42 * sc).toFixed(1)}px, ${(4 * sc).toFixed(1)}px) scale(${sc.toFixed(3)})`;
    }
    if (o.pool.hidden !== !gore) o.pool.hidden = !gore;
  }
  for (const [v, o] of CORPSES)
    if (!seen.has(v)) {
      o.el.remove();
      CORPSES.delete(v);
    }
}
/* the newest fx number (only the ones after it are new to me) */
const fxTop = (s) =>
  (s.fx || []).reduce((n, f) => Math.max(n, f && f.n ? f.n : 0), 0);
/* his HP in his tag, and a hit on him as on anyone: the blink, the shake, the HP lost over him, his blood */
function mHurt(s, m, dead, p, sc, hide) {
  const max = mMax(m),
    hp = dead ? 0 : m.hp == null ? max : Math.max(0, +m.hp || 0),
    was = mSeen.hp;
  mSeen.hp = hp;
  if (!dead) mSeen.alive = true;
  const bar = butler.hpEl,
    show = !dead && hp < max; // (once he's lost one: then it stays up, the owner's "When a merchant gets hit, their health bar shows")
  butler.el.classList.toggle("php", show);
  if (bar && show) {
    bar.style.setProperty("--hp", (hp / max).toFixed(3));
    bar.style.setProperty("--n", max);
  }
  if (was === null || hp >= was) {
    if (bar && was !== hp)
      bar.style.setProperty("--was", (hp / max).toFixed(3));
    return;
  }
  /* he lost some */
  if (bar) {
    bar.style.setProperty("--was", (was / max).toFixed(3));
    again(bar.querySelector("b"), "php-lost"); // (fxmotion.js)
  }
  if (hide) return;
  const img = butler.body.firstChild;
  vibrate(img, hitPx(was - hp), dead);
  if (!dead) img.animate(HIT, 320);
  popHP(butler.el, hp - was, true);
  fxHitAt(
    p.left,
    p.top,
    butler.feet * sc * 0.55,
    null,
    64 * sc,
    BY_WOUND[newWound(butler.hitW || "", butler.wc || "")],
    (merchantLook(m.who, m.roll) || {}).color,
  ); // (his blood, by the wound he got, with bits of him in his color, fx.js)
  butler.hitW = butler.wc;
}
/* his sprint (m.sp, the rules': 0 to 1) and Phil's knife waiting to stab again (the rules' l4mstab fx, MERCH.STAB_MS) */
function mBars(s, m, dead) {
  const tag = butler.tag;
  if (!tag) return;
  let sp = tag.querySelector(".l4-sprint");
  if (!sp) {
    sp = document.createElement("span");
    sp.className = "l4-sprint full";
    sp.setAttribute("aria-hidden", "true");
    sp.innerHTML = "<i></i>";
    tag.append(sp);
  }
  const left = dead || !(m.sp >= 0) ? 1 : Math.min(1, +m.sp),
    v = left.toFixed(3);
  if (sp._v !== v) {
    sp._v = v;
    sp.style.setProperty("--sp", v);
    sp.classList.toggle("full", left >= 1);
    sp.classList.toggle("tired", left <= 0.05);
  }
  const top = fxTop(s);
  if (top > mSeen.fx) {
    for (const f of s.fx || [])
      if (f && f.n > mSeen.fx && f.kind === "l4mstab")
        mSeen.stab = Math.max(mSeen.stab, f.t || 0);
    mSeen.fx = top;
  }
  let cl = tag.querySelector(".l4-cool");
  if (!cl) {
    cl = document.createElement("span");
    cl.className = "l4-cool off";
    cl.setAttribute("aria-hidden", "true");
    cl.innerHTML = "<i></i>";
    tag.append(cl);
  }
  const wait = mSeen.stab ? mSeen.stab + MERCH.STAB_MS - clockNow() : 0,
    cv = !dead && wait > 0 ? Math.min(1, wait / MERCH.STAB_MS).toFixed(3) : "0";
  if (cl._v !== cv) {
    cl._v = cv;
    cl.style.setProperty("--cl", cv);
    cl.classList.toggle("off", cv === "0");
  }
  /* stacked as mine are (meters.js stackBars: white, then blue, each a row while it shows), without my reload's flash */
  const rows = [
    [cl, 0.12, cv !== "0"],
    [sp, 0.2, left < 1],
  ];
  let y = 0.1;
  for (const [e, h, shown] of rows) {
    if (!shown) continue;
    const tp = `calc(100% + ${y.toFixed(2)}rem)`;
    if (e._top !== tp) {
      e._top = tp;
      e.style.top = tp;
    }
    y += h + 0.1;
  }
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
  const hide =
    !on || !Wd.inside || !Wd.onView(p.left - 40, p.top - 90, 80, 110);
  if (egg.el.hidden !== hide) egg.el.hidden = hide;
  if (hide) return;
  const tr = Wd.boxTr(p.left, p.top);
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
      !Wd.onView(p.left - 60, p.top - 80, 120, 140);
  if (boxEl.hidden !== hide) boxEl.hidden = hide;
  if (hide) return;
  const tr = Wd.boxTr(p.left, p.top);
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
  vitShown = "";
function safeLook(ctx) {
  const s = ctx.state(),
    now = clockNow(),
    p4 = s.hang.l4p || {},
    inv = s.hang.l4inv || {};
  for (const d of ducksOn(ctx.world.board)) {
    const id = d.dataset.pid;
    if (!id) continue;
    const sk = !!(p4[id] && p4[id].skAt),
      on = inv[id] > now;
    if (d.classList.contains("l4-skglow") !== sk)
      d.classList.toggle("l4-skglow", sk);
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
/* a left click (or V, or a tap) with Safe Keeping in hand: it can't be used by hand, so the chat says what it does, every
   time (the owner, Nov 21): one line for a duck alone in the lobby, another when there are 2 or more */
export const safeKeepLine = (ducks) =>
  ducks < 2
    ? "Safe Keeping: if you go down you get back up by yourself, and if you die you keep what you bought."
    : "Safe Keeping: if you go down, a friend's E gets you up (by yourself if none is standing), and if you die you keep what you bought.";

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
   Rifle: its heat has its own meter) */
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
      f: rl ? 0 : Math.min(1, c[0] / mag), // (one more in the chamber: still full)
      up: !rl && c[1] > 0 && !!loadTo(w, c[0], mag), // (R loads it: not full, or a full one gets one more, guns.js)
      rl,
      dry: !rl && c[0] <= 0 && c[1] <= 0,
      nr: !rl && c[1] <= 0 && c[0] < mag, // (no ammo left to reload it with)
    };
  const all = (fullFor(s, me, w) || [0])[0];
  return all > 1 ? { f: c[0] / all, rl: false, dry: c[0] <= 0 } : null; // (the bow: its arrows left)
}
let dryW = "";
/* the yellow bar under my duck, and the bars stacked (meters.js); a gun run dry that can't reload: the white bar flashes red */
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
let peekW = null,
  peekNow = false;
/* the box again, even with nothing switched: a swipe on my duck on a phone (touch.js), which always shows the selection
   (the owner's, Nov 18 15:18Z) */
export const peekAgain = () => {
  peekNow = true;
};
function peek(tag, s, me) {
  const m = kitOf(s, me),
    w = heldFn() || "";
  if (!m || (w === peekW && !peekNow)) return;
  const first = peekW === null,
    was = peekW;
  [peekW, peekNow] = [w, false];
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
  const one = (x, i) =>
    x ? [x, `k-${SLOT_KINDS[i]} ${tintOf(x, angelOf(s, me, x))}`.trim()] : null; // (each in its own color: l4ddrules.js tintOf)
  const list = [
    ...m.sl.map(one), // (then the grenades, as on the bar: kitslots.js)
    m.g > 0 ? ["grenade", "k-grenade"] : null,
  ].filter(Boolean);
  const to = Math.max(
      0,
      list.findIndex(([x]) => x === w),
    ),
    from = list.findIndex(([x]) => x === was),
    track = el.querySelector(".sp-track");
  track.replaceChildren(
    ...list.map(([x, cls]) =>
      kept(
        `<span class="sp-slot ${cls}"><i>${angelOf(s, me, x) ? angelic(weaponIcon(x, (s.players[me] || {}).duck)) : weaponIcon(x, (s.players[me] || {}).duck)}</i></span>`,
      ),
    ),
  ); // (each slot made once and kept: ui.js kept)
  const lay = (at) =>
    track.querySelectorAll(".sp-slot").forEach((b, j) => {
      const a = Math.abs(j - at);
      b.style.transform = `translateX(calc(var(--step) * ${j - at})) scale(${(1 + 0.32 * Math.max(0, 1 - a)).toFixed(3)})`;
      b.style.opacity = a > 1.6 ? 0 : 1;
      b.classList.toggle("mid", a < 0.5);
    });
  track.classList.add("sliding"); // (at the old slot at once, then it scrolls)
  lay(from < 0 ? to : from);
  el.classList.remove("go");
  /* the scroll and the fade start on the next frame, once this one has shown the old slot (before, the page was made
     to lay itself out on the spot to start them: up to 30 ms on a slow computer, at every switch) */
  const tok = ++peekTok;
  requestAnimationFrame(() => {
    if (tok !== peekTok) return; // (switched again since)
    track.classList.remove("sliding");
    lay(to);
    el.classList.add("go");
  });
}
let peekTok = 0;
function say(text) {
  if (!sayEl) return;
  sayEl.textContent = text;
  sayEl.classList.remove("on");
  void sayEl.offsetWidth;
  sayEl.classList.add("on");
  sfx.nope();
}

/* ---------- the merchant's shop: a page over the board, as the guestbook's ---------- */
function shopFill(s, ctx) {
  const me = ctx.me,
    up = upOf(s, me),
    pts = ptsOf(s, me),
    kit = kitOf(s, me),
    m = merchantNow(s),
    stock = (m && m.stock) || [],
    sig = JSON.stringify([
      up,
      pts,
      s.hang.l4sale,
      saleOn(s),
      kit && kit.sl,
      kit && kit.am,
      m && [m.v, m.id, m.roll],
      stock,
      upOffer(s, me),
      gasFull(s),
    ]);
  if (sig === shop.sig) return;
  shop.sig = sig;
  shop.pts.textContent = pts;
  /* who's selling: his name over the page, his picture by his words */
  const who = m && m.who ? [m.v, m.id, m.roll].join() : "";
  if (shop.who !== who) {
    shop.who = who;
    shop.title.innerHTML = rainbowHTML(shopName(s), { seed: 5 });
    shop.me.innerHTML =
      m && m.who
        ? merchantSVG(m.who, m.roll, { size: 40, title: shopName(s) })
        : "";
  }
  /* the one upgrade he offers me this visit (the owner's, Nov 18 14:20Z: "they only sell one per visit") */
  const offer = SHOP.filter((it) => it.id === upOffer(s, me));
  shop.list.innerHTML = offer.length
    ? offer
        .map((it) => {
          const n = up[it.id] || 0,
            max = n >= it.most,
            price = priceFor(s, me, it.id, n),
            was =
              price < priceOf(it.id, n) ? `<s>${priceOf(it.id, n)}</s> ` : ""; // (a Sale: the old price struck through)
          return `<li class="l4-up"><i class="l4-up-ic">${UP_ICONS[it.id]}</i><span class="l4-up-t"><b>${it.name}</b><small>${it.what}</small></span><span class="l4-up-lv" aria-label="${isFinite(it.most) ? `${n} of ${it.most}` : `bought ${n}`}">${isFinite(it.most) ? Array.from({ length: it.most }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("") : `x${n}`}</span><button type="button" class="btn small ${max ? "" : "yellow"} l4-up-buy" data-buy="${it.id}"${max || pts < price ? " disabled" : ""}>${max ? "Max" : was + price}</button></li>`;
        })
        .join("")
    : '<li class="l4-up l4-sold">No upgrade for you this visit</li>';
  /* what he has this visit (the rules' merchantStock): Buy (its price), Owned when I have it (an item of mine that's used
     up can be bought full again); a Sale strikes the old price through */
  shop.guns.innerHTML = stock.length
    ? stock
        .map(([w, p, n]) => {
          const have = !!kit && kit.sl.includes(w),
            again =
              have &&
              kindOf(w) === "special" &&
              (w === "defib" || !hasLeft(s, me, w)), // (defibrillators stack: always one more)
            price = stockPrice(s, p),
            was = price < p ? `<s>${p}</s> ` : "",
            off = (have && !again) || pts < price;
          return `<li class="l4-up l4-buyw" data-item="${w}"><i class="l4-up-ic">${orbHTML(w)}</i><span class="l4-up-t"><b>${weaponName(w)}${n > 1 ? ` <span class="l4-up-n">x${n}</span>` : ""}</b><small>${kindWord(w)}</small>${statLineOf(w) ? `<small class="l4-up-s">${statLineOf(w)}</small>` : ""}</span><button type="button" class="btn small ${have && !again ? "" : "yellow"} l4-up-buy" data-buy="${w}"${off ? " disabled" : ""}>${have && !again ? "Owned" : was + price}</button></li>`;
        })
        .join("")
    : '<li class="l4-up l4-sold">Sold out</li>';
  /* Duck Cabin: his gas, always (the pump's 25% at the pump's price) */
  if (!dp()) {
    const full = gasFull(s);
    shop.guns.innerHTML += `<li class="l4-up l4-buyw"><i class="l4-up-ic"><span class="l4orb c-orange"><i>${jerrySVG(25)}</i></span></i><span class="l4-up-t"><b>Gas</b><small>25% of a jerry can</small></span><button type="button" class="btn small ${full ? "" : "yellow"} l4-up-buy" data-buy="gas"${full || pts < PW.PUMP ? " disabled" : ""}>${full ? "Full" : PW.PUMP}</button></li>`;
  }
}
/* what kind of thing it is, under its name */
const kindWord = (w) =>
  ({ melee: "Melee", ranged: "Gun", special: "Item" })[kindOf(w)] || "";
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
  shopTo = "";
  if (!shop || !shop.open) return;
  shop.open = false;
  shop.el.hidden = true;
  shop.el.parentNode?.classList.remove("l4-shopping");
  if (shop.el.contains(document.activeElement)) document.activeElement.blur();
  removeEventListener("keydown", shopEsc, true);
}
function shopEsc(e) {
  if (!shop || !shop.open || windowOpen()) return;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeShop();
  } else if (e.key.startsWith("Arrow")) closeShop(); // (the arrows close it at once too, and still do what they do)
} // (before the game's own Escape: the pause menu)
function shopEl(ctx) {
  mountItemTip(); // (hold I on an item: its card)
  const el = document.createElement("div");
  el.className = "hang-book l4-shop";
  el.hidden = true;
  el.innerHTML = `<div class="hang-book-head"><h3 class="hang-book-title"></h3><span class="l4-shop-pts"><b>0</b> points</span><button type="button" class="win-x hang-book-x" aria-label="Close">×</button></div>
      <div class="tabs l4-shop-tabs" role="tablist"><button type="button" class="tab" role="tab" aria-selected="true" data-tab="buy">Shop</button><button type="button" class="tab" role="tab" aria-selected="false" data-tab="items">Items</button></div>
      <div class="l4-shop-list" data-pane="buy"><ul class="l4-shop-ups"></ul><h4 class="l4-shop-h">Weapons</h4><ul class="l4-shop-guns"></ul></div>
      <div class="l4-shop-list l4-shop-items" data-pane="items" hidden>${catalogHTML()}</div>
      <p class="l4-shop-say"><span class="l4-shop-me"></span><q>The fireplace is where you see what weapon you get.</q></p>`;
  for (const t of ["pointerdown", "click", "wheel", "touchstart"])
    el.addEventListener(t, (e) => e.stopPropagation(), { passive: true }); // (a tap on the page never walks the duck)
  el.querySelector(".hang-book-x").onclick = closeShop;
  /* pointing at (or tabbing to) a weapon he sells: its slot lights up in my hotbar */
  const pointAt = (e) => {
    const li = e.target.closest && e.target.closest(".l4-buyw"),
      b = li && li.querySelector("[data-buy]");
    shopTo = b && ARMS[b.dataset.buy] ? b.dataset.buy : "";
  };
  el.addEventListener("pointerover", pointAt);
  el.addEventListener("focusin", pointAt);
  el.addEventListener("pointerleave", () => (shopTo = ""));
  el.addEventListener("focusout", () => (shopTo = ""));
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
    const st = ctx.state(),
      it = ((merchantOf(st) || {}).stock || []).find(([x]) => x === w);
    if (!it) return send(); // (an upgrade, or gas)
    /* from his stock: only once I say Yes (the owner's, Nov 16 22:21Z); No, the X and Esc keep my points */
    confirmBox(
      `Are you sure you want to buy the ${weaponName(w)}?`,
      `${stockPrice(st, it[1])} points`,
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
    title: el.querySelector(".hang-book-title"),
    me: el.querySelector(".l4-shop-me"),
    who: "",
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
  /* Survival: a dead player comes back with the defibrillator in my hand (l4ddrules.js defibUse) */
  const defib = isSurv(s) && heldFn() === "defib" && hasLeft(s, me, "defib"),
    back = (id) => defib && !isWild(s, id) && !(s.players[id] || {}).helper;
  for (const id of s.seat) {
    const p = P4(s, id);
    const body = !!p && !!p.gh && !!p.ex && !!(s.hang.ghost || {})[id]; // (Survival's ghost: its body lies where it fell, only the defibrillator gets it up)
    if (id === me || !p || (!p.dn && !body) || (p.ex && !back(id))) continue; // (dead for good: no revive, no button; the owner's, Nov 17 20:37Z, "JUSTIN CANNOT BE REVIVED WHEN DEAD NOR CAN ANY PLAYER WHEN DEAD SO THE FUCKING REVIVE BUTTON GOES AWAY")
    const [bx, by] = body ? toPx(s.hang.ghost[id]) : [0, 0],
      a = body ? { x: bx, y: by } : ctx.world.at(id);
    if (!a) continue;
    const d = Math.hypot(a.x - pos.x, a.y - pos.y);
    if (d < L4.REACH && (!best || d < best.d))
      best = { kind: "rev", on: id, d, name: (s.players[id] || {}).name };
  }
  if (best) return best;
  for (const o of OPENINGS) {
    if (o.nb) continue; // (Downpour's fence: nothing to board up)
    const d = Math.hypot(o.in[0] - pos.x, o.in[1] - pos.y),
      n = (s.hang.brd || {})[o.id] || 0;
    if (d < L4.REACH && n < L4.BOARDS && (!best || d < best.d))
      best = { kind: "board", o: o.id, d, n };
  }
  if (best) return best;
  const lt = lootAt(s, pos.x, pos.y, clockNow()); // (something on the ground: only E takes it, l4ddloot.js)
  if (lt) return { kind: "take", do: "pick", d: 0, w: lt.w, k: lt.k };
  const sv = isSurv(s), // (Survival: no power, no pump, no Angel machine and no slot machine)
    pt =
      !sv &&
      (pwTarget(pos, s, NEAR) || // (the power box, on the balcony: l4ddpowerui.js)
        angelTarget(pos, s, NEAR)); // (the Angel machine, on the stage: l4ddangelui.js)
  if (pt) return pt;
  const now = clockNow(),
    db = Math.max(Math.abs(BOX.zx - pos.x), Math.abs(BOX.y - pos.y)); // (a square, as its yellow line shows it: spinSquare)
  if (db < NEAR && !sv) {
    const b = boxNow(s, now, me); // (my own spin; anyone's still there stops every spin, l4ddloot.js)
    if (!b && !boxNow(s, now)) return { kind: "box", d: db };
    if (b && now >= b.t + BOX.spin && b.w !== HELPER.w)
      return { kind: "take", d: db, w: b.w }; // (Justin climbs out by himself)
  }
  const m = merchantOf(s);
  if (!selling(s)) return null;
  const ds = Math.hypot(m.x - pos.x, m.y - pos.y);
  if (ds < NEAR || (shop && shop.open && ds < AWAY))
    return { kind: "shop", d: ds };
  return null;
}
/* E (a tap) at the merchant or the fireplace */
function tap(t, ctx) {
  if (t.kind === "shop") return shop.open ? closeShop() : openShop(ctx);
  const s = ctx.state(),
    me = ctx.me;
  if (t.kind === "box") {
    if (ptsOf(s, me) < priceFor(s, me, "box")) return say("Not enough points");
    ctx.send({ t: "hang", k: "l4", do: "box" });
  } else if (t.kind === "take") {
    ctx.send({ t: "hang", k: "l4", do: t.do || "box", hand: heldFn() }); // (a ranged weapon takes the place of the one in hand, else the first; do: off the ground)
  } else if (t.kind === "sk") ctx.send({ t: "hang", k: "l4", do: "sk" });
  else if (t.kind === "power") pwTap(ctx);
  else if (t.kind === "pump") {
    if (gasFull(s)) return say("The jerry cans are full");
    if (ptsOf(s, me) < PW.PUMP) return say("Not enough points");
    ctx.send({ t: "hang", k: "l4", do: "pump" });
  } else if (t.kind === "angel") angelTap(ctx, heldFn(), say);
}
const TAPS = ["box", "take", "shop", "sk", "power", "pump", "angel"];
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
  if (t.kind === "take")
    return `Take the ${t.w ? weaponName(t.w) : dropName(t.k)}`;
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
    if (heldFn() === "defib")
      return `Revive ${t.name || ""} with the defibrillator`.replace("  ", " ");
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
    ctx.world.board.querySelector(".hang-world")?.after(cv);
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
    ptsEl.innerHTML = "<span><b>0</b> points</span>";
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
    pwMount(ctx, layer);
    if (!isSurv(ctx.state())) angelMount(ctx, layer); // (Survival has no Angel machine: the owner's, Nov 19 19:27Z)
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
    poolEl.hidden = true;
    poolAt = 0;
    poolSig = "";
    layer.append(poolEl);
    shop = shopEl(ctx);
    butler = null; // (the merchant: drawMerchant makes him when he comes)
    mSig = "";
    mAt = null;
    mSeen = { v: null, hp: null, alive: false, fx: 0, stab: 0 };
    mPoolAt = 0;
    CORPSES.clear(); // (the old screen's are gone with its layer)
    egg = butlerEl(justinSVG({ size: 64 }), "Justin");
    egg.el.classList.replace("l4-butler", "l4-egg");
    egg.el.hidden = true;
    ctx.world.board.classList.add("blackout", "l4-board");
    Z.clear();
    B.clear();
    D.clear();
    overShown = endSig = drawn = boxSig = slotSig = onSig = litSig = "";
    roundShown = clockShown = -1;
    ptsShown = -1;
    l4Reset();
    boxSpun = false;
    sprintReset();
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
    vitEl = null;
    bellReset();
    vitShown = "";
    ctx?.world?.board.classList.remove("blackout", "l4-board");
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
    l4Hear(s, ctx); // (its sounds: l4ddsfx.js)
    if (shop.open) shopFill(s, ctx);
    /* a ding: a weapon from the fireplace taken (an upgrade bought rings the Butler's till: l4ddsfx.js) */
    const sl = slotsOf(s, ctx.me),
      had = slotSig.split(",");
    if (
      slotSig &&
      sl.some((w) => w && !had.includes(w)) &&
      !(
        ctx.duck() &&
        merchantOf(s) &&
        Math.hypot(
          ctx.duck().x * W - merchantOf(s).x,
          ctx.duck().y * H - merchantOf(s).y,
        ) < 320
      )
    )
      sfx.done(); // (not for what I bought from the merchant: his till rings)
    slotSig = sl.join();
    if (holding && !up(s, ctx.me)) holding = null;
  },
  step(dt, now, ctx) {
    l4Steps(dt, ctx); // (footsteps and groans: l4ddsfx.js)
    const me = ctx.duck();
    if (me) {
      const x = me.x * W,
        y = me.y * H;
      if (
        shop.open &&
        (!up(ctx.state(), ctx.me) ||
          !ctx.world.inside ||
          !selling(ctx.state()) ||
          Math.hypot(
            merchantOf(ctx.state()).x - x,
            merchantOf(ctx.state()).y - y,
          ) > AWAY)
      )
        closeShop(); // (walked off, down, or he ran: it closes)
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
    warmZombies(ctx.world.sc); // (once: every hat and outfit as pixels, behind the loading screen)
    warmBoards(ctx.world.sc); // (and every count of boards)
    const Wd = ctx.world,
      sc = Wd.sc,
      t = performance.now(),
      meAt = Wd.at(ctx.me),
      myFloor = meAt ? olAway(meAt.x, meAt.y, meAt.z).f : 0, // (for the outlines: a zombie a floor away)
      st0 = ctx.state(),
      sbOl = sbHasOl(st0); // (Sandbox: zones with Outlines)
    /* the zombies, gliding from where they were to where the host says, one heartbeat's time */
    for (const o of Z.values()) {
      const u = Math.min(1, (t - o.t0) / (o.g || gap));
      o.x = o.fx + (o.tx - o.fx) * u;
      o.y = o.fy + (o.ty - o.fy) * u;
      const up =
          o.st === 5
            ? fenceZ(o.x, o.y, o.l[2])
            : o.st === 6 ||
                o.st === 7 ||
                o.st === 8 ||
                (o.st === 3 && o.k !== undefined)
              ? zOf(o, "zombie") - heightAt(o.x, o.y)
              : 0, // (Downpour: up a fence, or dropping off it; up a wall, or on a roof, alive or dead)
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
            : o.st === 3
              ? bodyZ(o.x, o.y, z) // (dead: under every duck, layout.js)
              : Math.round(zSortY(o, z)) + 10, // (up a wall: in front of its roof, zombies.js)
        onCam = Wd.onView(f.left - 40 * sc, f.top - 90 * sc, 80 * sc, 100 * sc),
        hide =
          unseen ||
          !onCam ||
          (o.diedAt !== undefined && t - o.diedAt > LOW_DEAD && low()); // (Low graphics or Data saving: a body is gone from my screen at 2 s, css/app.css html.low; the rules still keep it its 4 s)
      if (o.el.hidden !== hide) o.el.hidden = hide;
      o.z = z; // (its height as I draw it: shotStop)
      const zc =
        sbOl && o.st !== 3
          ? sbOlColor(st0, { k: "zombie", sp: o.sp }, o.x / W, o.y / H, z, W, H)
          : "";
      if (onCam && unseen && o.st !== 3)
        zOutline(Wd, o, f, 0, sc, true, z, myFloor, 0, zc); // (on the other side of a wall: its red line)
      if (o.st !== 3 || !hide) {
        wounds(o, o.l, o.i); // (its wounds, and its picture made into pixels wherever it is: ready before it comes into sight)
        pxPic(o, o.img, o.bw * sc, o.bh * sc);
      }
      if (hide) continue;
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
          zc,
        ); // (really behind a wall, under a roof: its line only)
      if (o.olOnly !== olOnly) {
        o.olOnly = olOnly;
        o.el.classList.toggle("ol-only", olOnly);
      }
      const tr = Wd.boxTr(f.left, f.top + dip * sc);
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
      const body = `scale(${(o.face < 0 ? -sc : sc).toFixed(4)}, ${sc.toFixed(4)})${o.st === 3 ? " rotate(-100deg)" : leanBack(o.wu, st0)}`; // (dead: it lies down; winding up a swing: it leans back, claw.js)
      if (o.bt !== body) {
        o.bt = body;
        o.body.style.transform = body;
      }
      if (o.ks !== sc) {
        o.ks = sc; // (its own name: o.k is the roof it climbs, and the scale kept there turned every climber's roof into the chapel's each frame, so it flickered between the ground and its height: the owner's, Nov 21 03:40Z)
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
      for (const d of ducksOn(Wd.board)) {
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
          !Wd.onView(
            p.left + b.box.l * sc,
            p.top + b.box.t * sc,
            b.box.w * sc,
            b.box.h * sc,
          );
      /* out of view: unseen but laid out where it is, so its pixels are made and kept (pxdom.js), never made the
         moment it comes into view (the owner's, Nov 20 20:46Z: "pop-ins") */
      offView(b.el, hide);
      const tr = `${Wd.boxTr(p.left + b.box.l * sc, p.top + b.box.t * sc)} scale(${sc.toFixed(4)})`;
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
        unseen = !seenFrom(o.x, o.y, Wd.inside),
        onCam = Wd.onView(p.left - 40, p.top - 80, 80, 100),
        hide = unseen || !onCam;
      if (o.el.hidden !== hide) o.el.hidden = hide;
      if (onCam) dropOutline(Wd, o, p, sc, unseen, myFloor); // (out of sight too: then its line only)
      if (hide) continue;
      const tr = Wd.boxTr(p.left, p.top);
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
    drawMerchant(ctx, t);
    drawCorpses(ctx);
    const tg = !!(ctx.state().hang.l4 || {}).tg;
    if (ctx.world.board.classList.contains("trooper-gone") !== tg)
      ctx.world.board.classList.toggle("trooper-gone", tg); // (his body gone, his pool left: l4ddrules.js troopTick)
    drawEgg(ctx, now);
    drawBox(ctx);
    pwDraw(ctx);
    angelDraw(ctx);
    if (dp()) {
      bellSwing(ctx, t); // (the bell's times are the page's clock: performance.now())
      flareDraw(ctx, t, layer);
    }
    paint(now, ctx);
    /* my sprint: a thin blue bar under my name, while it isn't full (and under my HP meter: game.js asks sprintLeft()) */
    const mine = ducksOn(Wd.board).find((d) => d.classList.contains("mine")),
      tag =
        mine &&
        (mine.contains(mine._nameEl)
          ? mine._nameEl
          : (mine._nameEl = mine.querySelector(".gduck-name")));
    if (tag) {
      let sp = tag.querySelector(".l4-sprint");
      if (!sp) {
        sp = document.createElement("span");
        sp.className = "l4-sprint";
        sp.setAttribute("aria-hidden", "true");
        sp.innerHTML = "<i></i>";
        tag.append(sp);
      }
      const [stamina, tired] = sprintLeft(),
        v = stamina.toFixed(3);
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
    nearTo = t && t.kind === "take" ? t.w : "";
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
  /* the dead are walked over (the owner's, Nov 17 20:37Z: "YOU CAN WALK OVER DEAD BODIES ... I CANT WALK OVER JUSTIN'S DEAD
     BODY"): Justin dead for good, a duck that bled out (a ghost) */
  passable(id, ctx) {
    const p = P4(ctx.state(), id);
    return !!p && !!(p.ex || p.gh);
  },
  crowd(x, y, me, ctx) {
    if (isInvisible(ctx.state(), ctx.me, clockNow())) return 0; // (invisible: through the zombies)
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
    wetK(pos.x, pos.y, pos.z), // (Downpour's flood: layout.js)
  spawn(ctx) {
    const s = ctx.state(),
      k = Math.max(0, s.seat.indexOf(ctx.me));
    return startSpot(k);
  },
});
