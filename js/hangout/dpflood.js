/* ---------- Downpour's flood over its bed (the owner's, Nov 22 16:06Z and 16:36Z) ----------
   "water itself doesnt get darker ... the ground underneath it does IF the player is of a higher elevation". The road's
   bed is the ground's (dpground.js); over it, in the props' box under everything standing, its shade and then the water
   (dpground.js dpWater, see-through enough that the bed shows). The shade makes each spot of the bed under the water as
   much darker as below.js' one rule says for how far it lies under my floor, over what the whole ground already shows
   (below(0)), as it looks through the water (the shade is that much stronger than the rule, under it); standing as low as it or lower, none. The water's own color never changes. The shade is made again only
   when my floor moves a tenth of an elevation; the camera only slides it.
   Depth reads more (the owner's, Nov 28 00:10Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtY4sfpJdxMCPtU4PnDZdaNM): of the levels
   between my floor and the bed, the ones under the water's top count BELOW.WATER times (gamedefaults.js), the ones in
   the air above it once, as below.js counts them. */
import { activity } from "./registry.js";
import { heightAt, variant } from "./layout.js";
import { below, myFloor } from "../below.js";
import { levelOf } from "../heights.js";
import { BELOW } from "../gamedefaults.js";
import { FLOOD } from "./stationmap.js";
import { dpWater, DP_WATER_A } from "./dpground.js";
import { svgDataURL } from "../svgurl.js";

const CELL = 12; // (world px a square of the shade covers)
/* how much darker the bed at height h shows from my floor `me` (world px), 0 … 1, in steps of 2% as below.js */
const bedDark = (h, me) => {
  const m = levelOf(me),
    top = levelOf(FLOOD.top),
    bed = levelOf(h);
  if (bed >= m) return 0;
  const air = Math.max(0, m - Math.max(top, bed)),
    water = Math.max(0, Math.min(m, top) - bed);
  return (
    Math.round(Math.min(1, BELOW.PER * (air + BELOW.WATER * water)) * 50) / 50
  );
};
let v = null;
activity({
  id: "dpflood",
  mount(ctx) {
    const box = ctx.world.board.querySelector(".hang-props");
    if (!box) return;
    const w = dpWater(),
      el = document.createElement("div"),
      cv = document.createElement("canvas"),
      img = new Image();
    el.className = "dp-flood";
    el.hidden = true;
    Object.assign(el.style, { width: w.w + "px", height: w.h + "px" });
    cv.width = Math.ceil(w.w / CELL);
    cv.height = Math.ceil(w.h / CELL);
    img.src = svgDataURL(w.svg);
    img.alt = "";
    el.append(cv, img);
    box.prepend(el);
    v = { el, cv, g: cv.getContext("2d"), w, tr: "", at: null };
  },
  unmount() {
    v?.el.remove();
    v = null;
  },
  draw(now, ctx) {
    if (!v) return;
    const on = variant === "l4gs" && !ctx.world.inside;
    if (v.el.hidden === on) v.el.hidden = !on;
    if (!on) return;
    const W = ctx.world,
      a = W.toScreen(v.w.x, v.w.y),
      tr = `${W.boxTr(a.left, a.top)} scale(${W.sc.toFixed(4)})`;
    if (v.tr !== tr) {
      v.tr = tr;
      v.el.style.transform = tr;
    }
    const mine = myFloor(),
      at = Math.round(levelOf(mine) * 10);
    if (v.at === at) return;
    v.at = at;
    const { g, cv, w } = v,
      b0 = Math.min(0.99, below(0, mine));
    g.clearRect(0, 0, cv.width, cv.height);
    for (let j = 0; j < cv.height; j++)
      for (let i = 0; i < cv.width; i++) {
        const x = w.x + (i + 0.5) * CELL,
          y = w.y + (j + 0.5) * CELL,
          k =
            (1 - (1 - bedDark(heightAt(x, y), mine)) / (1 - b0)) /
            (1 - DP_WATER_A); // (darker than the ground round it by this, as seen through the water)
        if (k <= 0.004) continue;
        g.fillStyle = `rgba(0,0,0,${Math.min(1, k).toFixed(3)})`;
        g.fillRect(i, j, 1, 1);
      }
  },
});
