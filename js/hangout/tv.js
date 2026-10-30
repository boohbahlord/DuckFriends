/* ---------- the TV: seven channels, the next one with E (or the context button) by anyone standing by it ----------
   The channels: static, the Night Show map, the fractal (Rabbit Hole of Ducklings), the Starry Night map, Ether's
   Crossroads, a duck in a bubble bath, a pixel kitten. Each is one still picture (assets/tv, a few KB each, taken from
   the maps' own scenes and the drawings this file had): I want the TV to cost nothing, so nothing on it moves. The
   channel is the room's (s.hang.tv), so everyone watches the same one; a change clicks the knob and shows static for
   a moment. The picture lives in the TV's screen strip (shapes.js' tvParts, part 'screen'), laid flat on the screen's
   face, so it sorts with the TV. In a blackout (power.js) it's off: a dark screen, and no button. */
import { rule, activity } from "./registry.js";
import { PROPS, TV, W, H } from "./layout.js";
import { tvScreen } from "./art.js";
import { tvScreenStrip } from "./shapes.js";
import { play, loop } from "./sounds.js";
import { powered } from "./power.js";

const CH = ["static", "board", "rabbit", "stars", "ec", "bath", "kitten"];
const REACH = 130; // world px from the stand's middle
const F = 3; // the picture's px for each of the screen's units (it is drawn bigger, then laid on the screen)
const TV_ID = PROPS.find((p) => p.kind === "tv").id;
const chan = (s) => ((s && s.hang && s.hang.tv) ?? 1) % CH.length;

rule("tv", {
  init: () => ({ tv: 1 }), // the channel on (Night Show to start)
  act(s, a) {
    const me = s.pos[a.id];
    if (!me || Math.hypot(me.x * W - TV.cx, me.y * H - TV.cy) > REACH * 2)
      return false; // (only from beside it)
    s.hang.tv = (chan(s) + 1) % CH.length;
    return true;
  },
});

/* ---------- on the screen: one still picture a channel (assets/tv, small and compressed: nothing on it moves) ---------- */
const STILL = (c) => `assets/tv/${CH[c]}.webp`;
let el = null,
  pic = null,
  img = null,
  shown = "",
  last = -1,
  burst = 0,
  hiss = null;
function attach(strip) {
  const sc = tvScreen(),
    [x0] = tvScreenStrip(),
    k = Math.SQRT1_2 / F;
  pic = document.createElement("div");
  pic.className = "tv-pic";
  pic.style.cssText = `width:${sc.w * F}px;height:${sc.h * F}px;transform:matrix(${k.toFixed(4)}, ${(-k).toFixed(4)}, 0, ${(1 / F).toFixed(4)}, ${(sc.x - x0).toFixed(2)}, ${sc.y.toFixed(2)})`;
  pic.innerHTML =
    '<img class="tv-still" alt="" draggable="false" decoding="async"><i class="tv-glass"></i>';
  strip.append(pic);
  img = pic.querySelector("img");
  shown = "";
}
function quiet() {
  if (hiss) hiss.stop();
  hiss = null;
}

activity({
  id: "tv",
  near(pos, ctx) {
    if (!pos.inside || !powered(ctx.state())) return null; // (a blackout: power.js)
    const d = Math.hypot(pos.x - TV.cx, pos.y - TV.cy);
    return d < REACH
      ? {
          label: "Next channel",
          d,
          act: () => ctx.send({ t: "hang", k: "tv" }),
        }
      : null;
  },
  onState(s) {
    const c = chan(s);
    if (last >= 0 && c !== last) {
      burst = performance.now() + 350;
      play("tvClick", { x: TV.cx, y: TV.cy });
    }
    last = c;
  },
  draw(now, ctx) {
    const w = ctx.world;
    if (!el || !el.isConnected) {
      el = w.board.querySelector(
        `.hp[data-prop="${TV_ID}"][data-part="screen"]`,
      );
      pic = img = null;
      if (el) attach(el);
    }
    const pw = powered(ctx.state()),
      vis = !!el && !el.hidden && w.inside && pw; // (a blackout: the TV goes off)
    if (pic && pic._pw !== pw) {
      pic._pw = pw;
      pic.hidden = !pw;
    }
    const c = chan(ctx.state());
    if (vis) {
      const src = performance.now() < burst ? STILL(0) : STILL(c);
      if (src !== shown) {
        shown = src;
        img.src = src;
      }
    } // (a change: static for a moment)
    /* the static channel hisses, softly, while you're in the cabin with it */
    if (vis && CH[c] === "static") {
      if (!hiss) hiss = loop("static", { x: TV.cx, y: TV.cy, k: 0.7 });
    } else quiet();
  },
  unmount() {
    quiet();
    if (pic) pic.remove();
    el = pic = img = null;
    shown = "";
    last = -1;
  },
});
