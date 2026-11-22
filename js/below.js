/* ---------- darker below (B5; the owner's, Nov 21 16:17Z) ----------
   "As you increase in elevation, a fraction of black transparency or maybe some kind of dark color becomes apparent for
   things that you're above ... Let's say I jump. That doesn't change the colors. But let's say that I'm actually walking
   on a higher elevation ... including for other ducks ... if you get high up enough from the tippy top of the tree ...
   the tree itself becomes darker as well. It applies to vehicles." One rule for every walking world: whatever's top
   (a prop, the ground) or floor (a duck, a zombie, an NPC) is under my floor shows darker by below(), a fraction of
   BELOW.PER for each elevation, on to all dark (gamedefaults.js). My floor is what I stand on, never my jump: it
   changes once my feet are on something, or, falling, at each elevation I pass on the way down. It's the pixels' own color made darker (css .below-me: brightness), so the
   can't-hit darkening (.l4-unseen) still adds to it; the outlines take the same (outlines.js olAway) */
import { BELOW } from "./gamedefaults.js";
import { levelOf, levelZ } from "./heights.js";
import { floorH, PROPS } from "./hangout/layout.js";
import { activity } from "./hangout/registry.js";

let mine = 0; // (my floor, world px)
/* how much darker something at height h shows from my floor, 0 … 1 (all dark: the owner's, Nov 22 06:24Z, "darkness
   keeps going up beyond 60%"), in steps of 2% */
export const below = (h, me = mine) =>
  h >= me
    ? 0
    : Math.round(Math.min(1, BELOW.PER * (levelOf(me) - levelOf(h))) * 50) / 50;
/* an element's darkness, set only when it changes */
function look(el, b) {
  if (el._below === b) return;
  el._below = b;
  el.classList.toggle("below-me", b > 0);
  if (b > 0) el.style.setProperty("--below", b);
}
/* a body's element (a zombie, an NPC) at (x, y), feet at z (world px): as dark as its floor (what it stands on, or is
   over while it jumps: layout.js floorH) is under mine */
export const belowBody = (el, x, y, z) => look(el, below(floorH(x, y, z)));

/* a prop's top: its foot's height and its own (a tree's tip, a car's roof); the decor lies on the ground */
const TOP = new Map();
const topOf = (id) => {
  if (!TOP.size) for (const p of PROPS) TOP.set(p.id, (p.z || 0) + (p.h || 0));
  return TOP.get(id) ?? 0;
};
let seen = null, // (the floor the props were last made dark for, and how many there were)
  props = null, // (the props, the decor, and the bodies drawn among them)
  ducks = null;
activity({
  id: "below",
  unmount() {
    seen = props = ducks = null;
    TOP.clear(); // (another map's props next time)
  },
  draw(now, ctx) {
    const W = ctx.world,
      a = W.at(ctx.me);
    if (a) {
      const f = floorH(a.x, a.y, a.z),
        d = ctx.duck(),
        falling = !!d && d.vz != null && !d.j;
      if (a.z - f < 1)
        mine = f; // (feet on it: not in a jump)
      else if (falling)
        mine = Math.min(
          mine,
          Math.max(f, levelZ(Math.ceil(levelOf(a.z) - 1e-6))),
        ); // (falling, not jumping: each elevation it passes on the way down, the owner's, Nov 22 06:24Z: "if a duck is at max ground hieght and falls, the floor changes through all of it")
    }
    props ||= W.board.querySelector(".hang-props");
    ducks ||= W.board.querySelector(".ducks");
    if (!props) return;
    /* the ground and the props: only when my floor moves a tenth of an elevation, or more of them were made */
    const n = props.childElementCount;
    if (
      !seen ||
      Math.abs(levelOf(seen.f) - levelOf(mine)) >= 0.1 ||
      seen.n !== n
    ) {
      seen = { f: mine, n };
      for (const g of W.board.querySelectorAll(
        ".hang-ground, .hang-art-ground",
      ))
        look(g, below(0));
      for (const e of props.children)
        if (e.classList.contains("hp") || e.classList.contains("on-ground"))
          look(e, below(topOf(e.dataset.prop))); // (the zombies and NPCs here too: by their floor, belowBody; the merchant on the ground)
    }
    /* the ducks: each by the floor it stands on (game.js keeps them by id on their layer) */
    for (const [id, d] of ducks?._els || []) {
      const p = W.at(id);
      if (p) look(d, below(floorH(p.x, p.y, p.z)));
    }
  },
});
