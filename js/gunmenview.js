/* ---------- Survival: the gunmen on the screen (their rules: gunmen.js) ----------
   Drawn as Sandbox's NPCs are (npcview.js): their duck look with its wounds, HP bar, the gun in their hands and their
   shots, their fall, each gliding over one heartbeat, and the zombies' red outline while a wall or a roof hides them. Their flashlights are lit as the ducks' are (l4dd.js paint asks
   gunLights() for them): off while they wait in ambush or run ("flashlights off while ambushing or running") */
import { activity } from "./hangout/registry.js";
import { npcURL, handAt } from "./sbnpcart.js";
import { shake } from "./fxmotion.js";
import { drawNpcs, dropNpcs } from "./npcview.js";
import { now as clockNow } from "./clock.js";
import { olAdd, olFloor, olRoofed } from "./outlines.js";
import { whereIn, heightAt } from "./hangout/layout.js";

const ZB = new Map(),
  LIT = new Map(), // gunman → [x, y (where it's drawn), its aim in radians]
  SEEN = [], // [x, y] of each one alive on the screen now
  LASERS = []; // this frame's laser sights: [x0, y0, x1, y1] on the screen (game.js hands them to fx.js)
let supEl = null,
  shookAt = 0;
const BURNS = 2200; // ms a flame's bite shows it burning (gunmen.js GM.BURN_MS, and a little)
activity({
  id: "gunmen",
  only: "surv",
  unmount() {
    dropNpcs(ZB);
    LIT.clear();
    SEEN.length = 0;
    LASERS.length = 0;
    supEl?.remove();
    supEl = null;
  },
  draw(now, ctx) {
    const s = ctx.state(),
      Wd = ctx.world,
      layer = Wd.board.querySelector(".hang-props"),
      fxl = Wd.board.querySelector(".fxl"),
      gb = (s && s.hang && s.hang.gm && s.hang.gm.gb) || [];
    if (!layer) return;
    drawNpcs(ctx, gb, ZB, layer, fxl, {
      pic: (o, hits) => npcURL(o, hits, true),
      hide: (o) => !!o.hid, // (the sniper on his way to a new spot: nobody sees him go)
      lit: (o) => !o.d && !!o.bt && clockNow() - o.bt < BURNS,
      /* the zombies' red line while something hides them; none inside a building (the owner's: "inside buildings
         their outline is hidden"), and the sniper's never */
      ol: (o, z, f, unseen, h, sc) => {
        const fr = o.k === "f"; // (the friendly squad: a light green one always, as a player's, never hidden inside)
        if (o.k === "sn" || (!fr && whereIn(z.x, z.y, h))) return false;
        const me = Wd.at(ctx.me),
          w = z.box.w * sc,
          hh = z.box.h * sc,
          y = f.top - z.box.feet * sc,
          hid =
            unseen ||
            !!olRoofed(z.x, z.y, h, me) ||
            Wd.coverAt(
              f.left - w * 0.4,
              f.left + w * 0.4,
              y + hh * 0.1,
              f.top,
              z.zi || 0,
            );
        olAdd({
          id: "g" + o.i,
          img: z.img,
          x: f.left - w / 2,
          y,
          w,
          h: hh,
          flip: (o.f || 1) < 0,
          kind: fr ? "friend" : "zombie",
          hidden: hid,
          floor: Math.sign(
            olFloor(z.x, z.y, h) - (me ? olFloor(me.x, me.y, me.z) : 0),
          ),
        });
        return hid && !unseen;
      },
    });
    /* where each one is drawn now (a light just off the screen still shines onto it) */
    LIT.clear();
    SEEN.length = 0;
    LASERS.length = 0;
    const sc = Wd.sc;
    for (const o of gb) {
      const z = ZB.get(o.i);
      if (!z || o.d) continue;
      const a = ((o.ad || 0) * Math.PI) / 180;
      if (!z.el.hidden && o.k !== "sn") SEEN.push([z.x, z.y]); // (never the sniper: a beam doesn't give him away)
      if (o.lo) LIT.set(o.i, [z.x, z.y, a]);
      /* a soldier's laser sight, out of its gun to what it aims at ("Soldiers have laser sights") */
      if (o.ld > 0 && !o.hid) {
        /* (the sniper's too, longer: on the duck he's about to shoot, even from under a tree's crown or off my screen) */
        const f = Wd.toScreen(z.x, z.y, o.z || heightAt(z.x, z.y)),
          hand = handAt(z.box),
          ex = z.x + Math.cos(a) * o.ld,
          ey = z.y + Math.sin(a) * o.ld,
          e = Wd.toScreen(ex, ey, heightAt(ex, ey));
        LASERS.push([
          f.left + (hand.x - z.box.w / 2) * sc * (o.f || 1),
          f.top - (z.box.feet - hand.y) * sc,
          e.left,
          e.top - 29 * sc,
        ]);
      }
    }
    /* an LMG's rounds flying by me: my screen shakes and its corners go dark ("suppressive fire (screen shake, dark
       corners)") */
    const sup = ((s.hang.gm && s.hang.gm.sp) || {})[ctx.me] > clockNow();
    if (sup && !supEl) {
      supEl = document.createElement("div");
      supEl.className = "gm-sup";
      supEl.setAttribute("aria-hidden", "true");
      document.body.append(supEl);
    }
    if (supEl && supEl.classList.contains("on") !== sup)
      supEl.classList.toggle("on", sup);
    if (sup && now - shookAt > 120) {
      shookAt = now;
      shake(0.22);
    }
  },
});
/* the flashlights on now: [x, y (world px), where each points (radians)] */
export const gunLights = () => [...LIT.values()];
/* where each one alive stands on the screen now (a beam lights them up as it does a zombie) */
export const gunBodies = () => SEEN;
/* the soldiers' laser sights this frame */
export const gunLasers = () => LASERS;
