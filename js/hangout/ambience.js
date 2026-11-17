/* ---------- the air: the wind round the cabin, the rain over Downpour, the fires ----------
   The owner (Nov 17 12:28Z): "there should be a slight rain sound in downpour that isnt too loud", "a slight wind sound
   in all versions of cabin that comes and goes that is more gentle but sounds muffled from inside the cabin and more
   clear on the balcony or while outside", and "fires should have a sound effect AND the sound of fire can be heard at
   a fire place if your closer to it".

   Each is a long loop (sound.js): the wind on Duck Cabin (Hangout's and Quacky Zombies'), the rain on Downpour. Indoors
   both are muffled (a low-pass glided down) and quieter; out on the deck or the grass, clear. The wind also swells and
   dies away by itself, on top of its own gusts. Every fireplace and campfire crackles where it stands, louder the
   closer my duck is (and on the side it's on); one put out goes quiet. */
import { activity } from "./registry.js";
import { loop } from "../sound.js";
import { PROPS, whereIn, layoutVariant, layoutRev } from "./layout.js";

const OPEN = 5000, // Hz: the low-pass outside (clear)
  SHUT = 600, // … inside (through the walls)
  IN_K = 0.55, // and that much as loud inside
  SWELL = [6000, 14000], // ms: the wind swells or dies away to a new level this often …
  SWELL_K = [0.35, 1], // … between these
  SWELL_S = 4, // s it takes to get there
  FIRE_K = 0.8, // a fireplace's crackle (sound.js "fire"), from the room it's in
  EVERY = 250; // ms between looks (inside or out, how far the fires are)
const rnd = (a, b) => a + Math.random() * (b - a);
let air = null, // { l: the loop, name, k: its level now, swell: when it next changes }
  fires = new Map(), // prop id → its crackle's loop
  rev = -1,
  inside = null,
  next = 0;

function stopAll() {
  if (air) air.l.stop();
  air = null;
  for (const l of fires.values()) l.stop();
  fires.clear();
  inside = null;
  rev = -1;
}
/* the map's weather: rain on Downpour, the wind on Duck Cabin */
function weather() {
  const name = layoutVariant() === "l4gs" ? "rain" : "wind";
  if (air && air.name === name && air.l.on) return;
  if (air) air.l.stop();
  air = { name, l: loop(name, { lp: OPEN, k: 0.1 }), k: 1, swell: 0 }; // (from low, then up: below)
  inside = null;
}
const unlit = (s, p) => !!(s && s.hang && s.hang.unlit && s.hang.unlit[p.id]);

activity({
  id: "ambience",
  mount() {
    stopAll();
    next = 0;
  },
  unmount() {
    stopAll();
  },
  step(dt, now, ctx) {
    if (now < next) return;
    next = now + EVERY;
    const me = ctx.world.at(ctx.me);
    if (!me) return;
    if (layoutRev() !== rev) {
      // the map changed (or first look): its weather, and its fires again
      rev = layoutRev();
      for (const l of fires.values()) l.stop();
      fires.clear();
    }
    weather(); // (again if it never started: its file wasn't loaded yet, or the page was hidden)
    /* indoors or out: muffled and quieter, or clear */
    const here = whereIn(me.x, me.y),
      ins = here > 0;
    if (ins !== inside) {
      inside = ins;
      air.l.tone(ins ? SHUT : OPEN);
      air.l.set(air.k * (ins ? IN_K : 1), 0.6);
    }
    /* the wind comes and goes */
    if (air.name === "wind" && now >= air.swell) {
      air.swell = now + rnd(SWELL[0], SWELL[1]);
      air.k = rnd(SWELL_K[0], SWELL_K[1]);
      air.l.set(air.k * (inside ? IN_K : 1), SWELL_S);
    }
    /* the fires: each fireplace or campfire that's lit crackles where it stands */
    const s = ctx.state();
    for (const p of PROPS) {
      if (p.kind !== "fireplace" && p.kind !== "campfire") continue;
      const at = { x: p.x + p.w / 2, y: p.y + p.d / 2 },
        l = fires.get(p.id),
        apart = whereIn(at.x, at.y) !== here; // (in another room than mine: through its walls)
      if (unlit(s, p)) {
        if (l) {
          l.stop();
          fires.delete(p.id);
        }
      } else if (!l || !l.on) {
        if (l) l.stop();
        const f = loop("fire", { ...at, k: FIRE_K, lp: apart ? SHUT : OPEN });
        f.apart = apart;
        fires.set(p.id, f);
      } else {
        l.move(at.x, at.y); // (as my duck walks: louder near, quieter far, on its side)
        if (l.apart !== apart) {
          l.apart = apart;
          l.tone(apart ? SHUT : OPEN);
        }
      }
    }
  },
});
