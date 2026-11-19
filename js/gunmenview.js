/* ---------- Survival: the gunmen on the screen (their rules: gunmen.js) ----------
   Drawn as Sandbox's NPCs are (npcview.js): their duck look with its wounds, HP bar, the gun in their hands and their
   shots, their fall, each gliding over one heartbeat, and the zombies' red outline while a wall or a roof hides them. Their flashlights are lit as the ducks' are (l4dd.js paint asks
   gunLights() for them): off while they wait in ambush or run ("flashlights off while ambushing or running") */
import { activity } from "./hangout/registry.js";
import { npcURL } from "./sbnpcart.js";
import { drawNpcs, dropNpcs } from "./npcview.js";
import { now as clockNow } from "./clock.js";
import { olAdd, olFloor, olRoofed } from "./outlines.js";
import { whereIn } from "./hangout/layout.js";

const ZB = new Map(),
  LIT = new Map(), // gunman → [x, y (where it's drawn), its aim in radians]
  SEEN = []; // [x, y] of each one alive on the screen now
const BURNS = 2200; // ms a flame's bite shows it burning (gunmen.js GM.BURN_MS, and a little)
activity({
  id: "gunmen",
  only: "surv",
  unmount() {
    dropNpcs(ZB);
    LIT.clear();
    SEEN.length = 0;
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
      lit: (o) => !o.d && !!o.bt && clockNow() - o.bt < BURNS,
      /* the zombies' red line while something hides them; none inside a building (the owner's: "inside buildings
         their outline is hidden"), and the sniper's never */
      ol: (o, z, f, unseen, h, sc) => {
        if (o.k === "sn" || whereIn(z.x, z.y, h)) return false;
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
          kind: "zombie",
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
    for (const o of gb) {
      const z = ZB.get(o.i);
      if (!z || o.d) continue;
      if (!z.el.hidden) SEEN.push([z.x, z.y]);
      if (o.lo) LIT.set(o.i, [z.x, z.y, ((o.ad || 0) * Math.PI) / 180]);
    }
  },
});
/* the flashlights on now: [x, y (world px), where each points (radians)] */
export const gunLights = () => [...LIT.values()];
/* where each one alive stands on the screen now (a beam lights them up as it does a zombie) */
export const gunBodies = () => SEEN;
