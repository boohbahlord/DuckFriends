/* ---------- an NPC on a world (Duck Cabin, the zombie maps), drawn the one way for every mode ----------
   Sandbox's NPCs on Duck Cabin (sbspawnview.js) and Survival's gunmen (gunmenview.js) are drawn alike: their picture
   (sbnpcart.js), HP bar, wounds, claw marks, the weapon in their hands and their shots, their fall, each gliding from
   where it was to where the host says over one heartbeat (the owner's, Nov 19 19:27Z: "doing a better job at
   universalizing certain behaviors across different game modes") */
import { heightAt, sortY, seenFrom, bodyZ } from "./hangout/layout.js";
import {
  npcURL,
  npcBox,
  npcName,
  npcSay,
  isZombie,
  npcReady,
  heldOf,
  handAt,
  npcShot,
} from "./sbnpcart.js";
import { goreFree } from "./wounds.js";
import { clawMark } from "./l4dd.js";
import { FLAME } from "./mgjart.js";
import { now as clockNow } from "./clock.js";

const GLIDE = 220; // ms (a heartbeat is 200)
function zbEl(o, layer) {
  const el = document.createElement("div"),
    k = o.sz || 1, // (its spawn's Size: as big on the page, so the pixel look gives it more pixels, never bigger ones)
    b = npcBox(o),
    box = { w: b.w * k, h: b.h * k, feet: b.feet * k };
  el.className = "l4z";
  el.innerHTML = `<div class="l4z-body"><img alt="" draggable="false"></div><span class="l4z-hp"><b></b><i></i></span>${npcName(o)}`;
  const body = el.firstChild;
  Object.assign(body.style, {
    width: box.w + "px",
    height: box.h.toFixed(1) + "px",
    left: (-box.w / 2).toFixed(1) + "px",
    top: (-box.feet).toFixed(1) + "px",
    transformOrigin: `${box.w / 2}px ${box.feet.toFixed(1)}px`,
  });
  body.style.setProperty("--feet", box.feet.toFixed(1) + "px"); // (a made NPC's weapon, at its middle: css .sb-held)
  body.style.setProperty("--zk", k); // (and as big as it is)
  layer.append(el);
  return {
    el,
    body,
    box,
    rd: npcReady(o),
    shot: o.sh ? o.sh[0] : 0, // (only shots from now on are drawn)
    img: body.firstChild,
    bar: el.querySelector(".l4z-hp"),
    nm: el.querySelector(".sb-npc-name"),
    tall: box.feet,
    x: o.x,
    y: o.y,
    fx: o.x,
    fy: o.y,
    tx: o.x,
    ty: o.y,
    t0: 0,
    a: o.a,
    hits: null,
  };
}
/* every NPC of list (each { i, x, y (world px), hp, l: [its most HP], f, a, w, d, sh, hw … }) on this frame; ZB keeps
   their elements from frame to frame (a Map of the caller's own). opt: pic(o, hits) its picture (npcURL by default),
   hide(o, z, Wd) true when it shouldn't show now, lit(o) true while it burns, ol(o, z, f, unseen, h, sc) its
   outline (true: only its line shows), each(o, z, Wd) after it's placed (a mode's own touches) */
export function drawNpcs(ctx, list, ZB, layer, fxl, opt = {}) {
  const s = ctx.state(),
    Wd = ctx.world,
    picOf = opt.pic || npcURL,
    t = performance.now(),
    sc = Wd.sc,
    seen = new Set();
  for (const o of list) {
    seen.add(o.i);
    let z = ZB.get(o.i);
    if (z && z.rd !== npcReady(o)) {
      z.el.remove(); // (its picture came in: its box is the picture's now)
      z = null;
    }
    if (!z) ZB.set(o.i, (z = zbEl(o, layer)));
    if (o.x !== z.tx || o.y !== z.ty) {
      z.fx = z.x;
      z.fy = z.y;
      z.tx = o.x;
      z.ty = o.y;
      z.t0 = t;
    }
    const u = Math.min(1, (t - z.t0) / GLIDE);
    z.x = z.fx + (z.tx - z.fx) * u;
    z.y = z.fy + (z.ty - z.fy) * u;
    const zs = sc * (o.sz || 1), // (its spawn's Size, sbspawn.js: z.box is already that big)
      h = o.z || heightAt(z.x, z.y), // (o.z: up on a roof, Survival's sniper)
      f = Wd.toScreen(z.x, z.y, h),
      unseen = !seenFrom(z.x, z.y, Wd.inside, h),
      onCam = Wd.onView(
        f.left - (z.box.w / 2 + 8) * sc,
        f.top - (z.box.feet + 10) * sc,
        (z.box.w + 16) * sc,
        (z.box.h + 10) * sc,
      ),
      hide = unseen || (!!opt.hide && opt.hide(o, z, Wd)) || !onCam;
    if (z.el.hidden !== hide) z.el.hidden = hide;
    /* its outline (outlines.js), where a mode gives them one: true when only the line shows (a roof or a wall over it) */
    const olOnly =
      !!opt.ol && !o.d && onCam && !!opt.ol(o, z, f, unseen, h, sc);
    if (z.olOnly !== olOnly) {
      z.olOnly = olOnly;
      z.el.classList.toggle("ol-only", olOnly);
    }
    if (o.a !== z.a) {
      if (o.a > 0 && !o.d && !hide && fxl)
        clawMark(
          fxl,
          f.left + (o.f || 1) * 44 * zs,
          f.top - 36 * zs,
          zs * 1.25,
        );
      z.a = o.a;
    }
    if (hide) continue;
    /* on fire (any fire: rules.js flameThings keeps it in s.flamed for 3 s): the burning duck's flame over it */
    const lit = opt.lit
      ? opt.lit(o)
      : ((s.flamed || {})["h:sbz" + o.i] || 0) > clockNow() && !o.d;
    if (z.lit !== lit) {
      z.lit = lit;
      if (lit && !z.body.querySelector(".gduck-fire"))
        z.body.insertAdjacentHTML(
          "beforeend",
          `<span class="gduck-fire" aria-hidden="true">${FLAME}</span>`,
        );
      z.el.classList.toggle("onfire", lit);
    }
    const hits = s.options.noGore ? goreFree(o.w || "") : o.w || "",
      pic = hits + (o.d && !isZombie(o) ? "+dead" : "");
    if (z.hits !== pic) {
      z.hits = pic;
      z.img.src = picOf(o, hits);
    }
    /* a made NPC: the weapon in its hand, and its shots (sbarms.js) */
    const hd = heldOf(o);
    if ((hd && hd.w) !== z.hw) {
      z.hw = hd && hd.w;
      z.body.querySelector(".sb-held")?.remove();
      if (hd)
        z.body.insertAdjacentHTML(
          "beforeend",
          `<img class="sb-held" alt="" draggable="false" src="${hd.url}" style="--gw:${hd.gw}">`,
        );
    }
    if (o.sh && o.sh[0] !== z.shot) {
      const fresh = Date.now() - o.sh[0] < 1500;
      z.shot = o.sh[0];
      if (fresh && fxl) {
        const hand = handAt(z.box), // (in its box, already its Size)
          to = Wd.toScreen(o.sh[1], o.sh[2], heightAt(o.sh[1], o.sh[2]));
        npcShot(
          fxl,
          f.left + (hand.x - z.box.w / 2) * sc * (o.f || 1),
          f.top - (z.box.feet - hand.y) * sc,
          to.left,
          to.top - 29 * sc,
          o.hw,
        );
      }
    }
    const hp = (Math.max(0, o.hp) / (o.l[0] || 1)).toFixed(3);
    if (z.hp !== hp) {
      z.hp = hp;
      z.bar.style.setProperty("--hp", hp);
      if (+hp < 1) z.el.classList.add("hurt");
    }
    if (o.d && !z.dead) {
      z.dead = true;
      z.el.classList.add("dead");
    }
    npcSay(z.el, o);
    if (opt.each) opt.each(o, z, Wd);
    const tr = `translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`;
    if (z.tr !== tr) z.el.style.transform = z.tr = tr;
    const body = `scale(${((o.f || 1) < 0 ? -sc : sc).toFixed(4)}, ${sc.toFixed(4)})${o.d ? " rotate(-100deg)" : ""}`;
    if (z.bt !== body) z.body.style.transform = z.bt = body;
    if (z.k !== sc) {
      z.k = sc;
      z.el.style.setProperty("--k", sc.toFixed(3));
      z.el.style.setProperty("--top", (-z.tall * sc - 2).toFixed(1) + "px"); // (its name, and what it says, over its head)
    }
    const zi = o.d ? bodyZ(z.x, z.y, h) : Math.round(sortY(z.x, z.y, h)) + 10; // (dead: under every duck, layout.js)
    if (z.zi !== zi) z.el.style.zIndex = z.zi = zi;
  }
  for (const [i, z] of ZB)
    if (!seen.has(i)) {
      z.el.remove();
      ZB.delete(i);
    }
}
/* every element of ZB gone (the world closes) */
export function dropNpcs(ZB) {
  for (const z of ZB.values()) z.el.remove();
  ZB.clear();
}
