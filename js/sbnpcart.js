/* ---------- Sandbox: a spawned NPC's picture, whatever it is ----------
   A zombie is Dead Ducks Arcade's (l4ddart.js zombieURL, with its wounds); a Blank NPC, Justin, a Test NPC or a made NPC
   is a duck in its own look (o.dk), lying down with its eyes shut once it's dead. A spawn's Appearance tab can give it
   another look (sbspawn.js lookOf): a duck's (o.dk, on a zombie too), a zombie's (o.zl), or an uploaded picture (o.im,
   one of the room's pictures, s.sbpic, which the screens hand me: npcPics). Its box is as a zombie's: 64 wide, as tall as
   its drawing, its feet 10 units over the bottom; a picture's is as tall as a duck is drawn (32 of the grid's pixels, the
   owner's, Nov 19 15:47Z: "32 bit in size like the ducks are normally"), its feet at its bottom. Its spawn's Size (o.sz)
   makes all of it bigger or smaller: the screens draw it at that size, and sbbody.js hits it there. A made NPC's weapon is in its hand (o.hw:
   heldOf) and its shots are lines to where they went (npcShot). Used on the board (game.js placeZombies) and on Duck Cabin
   (sbspawnview.js) */
import { gwOf, TRACE } from "./gunart.js";
import { duckSVG } from "./duck.js";
import { svgDataURL } from "./svgurl.js";
import { zombieURL, zombieBox } from "./l4ddart.js";
import { woundLook } from "./wounds.js";
import { zombieLook } from "./l4ddrules.js";
import { esc } from "./ui.js";
import { heldHTML } from "./specials.js";
import { sfx } from "./sound.js";

export const isZombie = (o) =>
  !o.im && (!!o.zl || ((!o.k || o.k === "zombie") && !o.dk));
let IMGS = {};
/* the room's pictures (s.sbpic), handed over each frame before any NPC is drawn */
export const npcPics = (m) => {
  IMGS = m || {};
};
const imgOf = (k) => (IMGS[k] && IMGS[k].d) || "";
/* "1" once the picture it needs is here ("" while it isn't, or when it needs none): the screens draw it again then */
export const npcReady = (o) =>
  o.im
    ? imgOf(o.im)
      ? "1"
      : ""
    : o.dk && /^#/.test(o.dk.image || "")
      ? imgOf(o.dk.image.slice(1))
        ? "1"
        : ""
      : "";
/* its look, with its own picture (kept apart: "#" and its key) put back */
const lookOf = (o) =>
  o.dk && /^#/.test(o.dk.image || "")
    ? { ...o.dk, image: imgOf(o.dk.image.slice(1)) || null }
    : o.dk || {};
const PICS = new Map(),
  BOXES = new Map(),
  keyOf = (o) => JSON.stringify(o.dk || {}) + npcReady(o);
/* wounds: a duck-looking one shows its wounds too, as a player's duck does (wounds.js woundLook; Survival's gunmen) */
export function npcURL(o, hits = "", wounds = false) {
  if (o.im && imgOf(o.im)) return imgOf(o.im);
  if (isZombie(o)) return zombieURL(o.l, o.i, hits);
  const w = wounds ? hits : "",
    k = keyOf(o) + (o.d ? "+dead" : "") + (w ? "+" + w : "");
  if (!PICS.has(k)) {
    if (PICS.size > 300) PICS.clear();
    PICS.set(
      k,
      svgDataURL(
        duckSVG(lookOf(o), {
          size: 64,
          shadow: true,
          dead: !!o.d,
          ...woundLook(w),
        }),
      ),
    );
  }
  return PICS.get(k);
}
/* a picture's height in a box's units (64: a duck's box): a duck's drawing fills about 70% of its box, its 32 pixels
   (pixel.js FILL) */
const PIC_H = 64 * 0.7;
export function npcBox(o) {
  if (o.im && imgOf(o.im)) {
    const a = IMGS[o.im].a || 1;
    return { w: PIC_H / a, h: PIC_H, feet: PIC_H };
  }
  if (isZombie(o)) return zombieBox(o.l);
  const k = keyOf(o);
  if (!BOXES.has(k)) {
    const v = duckSVG(lookOf(o), { size: 64 })
      .match(/viewBox="([^"]+)"/)[1]
      .split(" ")
      .map(Number);
    BOXES.set(k, {
      w: 64,
      h: (64 * v[3]) / v[2],
      feet: (64 * (v[1] + v[3] - 10)) / v[2] - (64 * v[1]) / v[2],
    });
  }
  return BOXES.get(k);
}
/* what its hits are tested against (sbbody.js): its picture without its shadow or wounds, the size of npcBox's box, and
   a key for it (one shape for every zombie of a build, every duck of a look, each picture) */
export function npcShape(o) {
  if (o.im && imgOf(o.im)) return { k: "i" + o.im, url: () => imgOf(o.im) };
  if (isZombie(o))
    return {
      k: "z" + [o.l[3], o.l[4], o.l[5], o.l[6], o.l[7]].join(),
      url: () => svgDataURL(duckSVG(zombieLook(o.l), { size: 64, dead: true })),
    };
  return {
    k: "d" + keyOf(o),
    url: () => svgDataURL(duckSVG(lookOf(o), { size: 64 })),
  }; // (url: made only when its shape isn't made yet)
}
/* the name over one that has one (Justin, a Test NPC, a made NPC) */
export const npcName = (o) =>
  o.nm ? `<span class="sb-npc-name">${esc(o.nm)}</span>` : "";
/* what its Seriat file has it say (sbseriat.js o.nbs), in a bubble over it until the host takes it away; el: its
   element, the bubble kept on it as el._say */
export function npcSay(el, o) {
  const t = !o.d && o.nbs ? o.nbs[0] : "";
  if (el._say === t) return;
  el._say = t;
  let b = el.querySelector(".sb-npc-say");
  if (!t) return b && b.remove();
  if (!b) {
    b = document.createElement("span");
    b.className = "sb-npc-say";
    el.append(b);
  }
  b.textContent = t;
}

/* ---------- a made NPC's weapon and shots ---------- */
const HELD = new Map();
/* what it holds: { w, url, gw (its length in duck widths) }, or null */
export function heldOf(o) {
  if (!o.hw || o.d) return null;
  const k = o.hw + (o.dk ? JSON.stringify(o.dk.spc || "") : "");
  if (!HELD.has(k))
    HELD.set(k, {
      w: o.hw,
      url: svgDataURL(heldHTML(o.hw, o.dk || {})),
      gw: gwOf(o.hw), // (its length in the hand: as a player's, gunart.js)
    });
  return HELD.get(k);
}
/* where it holds it, in its box's units (box: npcBox): out in front of it, at its middle */
export const handAt = (box) => ({
  x: box.w / 2 + box.w * 0.42,
  y: box.feet - box.w * 0.45,
});
/* a shot of one of its guns from (x0, y0) to (x1, y1) on the screen (px), in layer fxl: the zombie mode's thin line,
   and the gun's own sound, a few at a time (800 can shoot at once) */
let heard = [];
export function npcShot(fxl, x0, y0, x1, y1, w) {
  const far = Math.hypot(x1 - x0, y1 - y0);
  if (!fxl || far < 2) return;
  const n = document.createElement("div");
  n.className = "l4-line";
  n.style.cssText = `left:${x0.toFixed(1)}px;top:${y0.toFixed(1)}px;width:${far.toFixed(1)}px;transform:rotate(${Math.atan2(y1 - y0, x1 - x0).toFixed(3)}rad);--c:${TRACE.color};--g:${TRACE.glow};--ms:${TRACE.ms}ms`;
  fxl.append(n);
  setTimeout(() => n.remove(), TRACE.ms + 40);
  const t = performance.now();
  heard = heard.filter((h) => t - h < 150);
  if (heard.length < 3) {
    heard.push(t);
    sfx[w]();
  }
}
