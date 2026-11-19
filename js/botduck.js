/* ---------- a computer's duck: a random look, never anything players unlock ----------
   Moved out of net.js so the rules can dress Sandbox's Test NPCs and Blank NPCs the same way (sbspawn.js) without
   loading the room's network code */
import { STYLES } from "./styles.js";
import { OUTFITS } from "./outfits.js";
import { HATS } from "./hats.js";
import { FACES } from "./faces.js";
import { EYES } from "./eyes.js";
import { BEAKS } from "./beaks.js";
import { isLocked } from "./unlocks.js";

export const BOT_DUCKS = [
  "#ffd23f",
  "#ff8c2b",
  "#ef3b3b",
  "#ff7eb6",
  "#9b5de5",
  "#2fa4ff",
  "#14c6b4",
  "#8ee03c",
  "#f4f4f0",
  "#3b3f4a",
];
export const PATS = [
  "none",
  "none",
  "dots",
  "stripes",
  "stars",
  "hearts",
  "checks",
  "waves",
];
const METALS = [
  "none",
  "none",
  "none",
  "none",
  "gold",
  "silver",
  "bronze",
  "rose",
  "chrome",
];
export const any = (a) => a[Math.floor(Math.random() * a.length)];
/* now and then a computer is a mallard, an eagle or the like, in that style's colors */
function botStyle() {
  if (Math.random() > 0.3) return {};
  const st = any(STYLES.slice(1).filter((x) => !isLocked("style", x.id))); // (computers never wear what players unlock)
  return {
    style: st.id,
    ...Object.fromEntries((st.colors || []).map(([k, , c]) => [k, c])),
    ...(st.match ? { beak: st.match } : {}),
  };
}
/* a random duck look, as a computer wears */
export function botDuck() {
  return {
    color: any(BOT_DUCKS),
    pattern: any(PATS),
    patternColor: "#ffffff",
    metal: any(METALS),
    image: null,
    hat:
      Math.random() < 0.5
        ? {
            id: any(HATS.filter((x) => !isLocked("hat", x.id))).id,
            ketchup: Math.random() < 0.5,
          }
        : null,
    face:
      Math.random() < 0.25
        ? { id: any(FACES.filter((x) => !isLocked("face", x.id))).id }
        : null,
    eyes: Math.random() < 0.3 ? any(EYES).id : "default",
    beak: Math.random() < 0.25 ? any(BEAKS).id : "default",
    build: Math.random() < 0.4 ? any([-1, -0.5, 0.5, 1]) : 0,
    size: Math.random() < 0.3 ? any([-1, -0.5, 0.5, 1]) : 0,
    keys: [
      Math.random() < 0.35
        ? any(["zap", "flames", "hearts", "poison", "notes", "trombone"])
        : null,
    ],
    outfit:
      Math.random() < 0.3
        ? { id: any(OUTFITS.filter((x) => !isLocked("outfit", x.id))).id }
        : null,
    ...botStyle(),
  };
}
