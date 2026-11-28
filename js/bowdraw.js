/* ---------- the bow, drawn to shoot (K2b) ----------
   The owner's, Nov 21 17:48Z: "You don't auto-shoot the bow anymore. You only pull it back to shoot ... its crit chance
   is based off of its time to shoot. And you can draw it back further to do more damage ... every 1/2 second that it's
   pulled back, it does a guarantee of +1 damage ... it checks every like 1/10 of a second ... it shows that in your
   cooldown meter where you like have things like reload ... it starts out as like a light red as the meter grows and
   becomes a dark red ... When it reaches max ... it flashes a little white"; 18:05Z: full draw 2.5 s, a sure crit at
   full, before that 25% for each second drawn; 18:16Z: the arrow flies up to 40% faster at full draw. The plan in plain
   English: /mnt/project-files/adam/calibers.md, The bow.
   How: the press sends { t: "draw" } and the host keeps when it began (s.draw { id: ms }); the release is the use, and
   the host counts the draw from its own clock, so every screen agrees and nobody can claim a longer one. The arrow
   carries its draw (dr, ms) to whatever it hits. Why its own file: one rule for every mode's bow (the boards, Mad God
   Justin, Sandbox, Hangout and Dead Ducks Arcade), and for my screen's meter */
import { NADE } from "./gamedefaults.js";

const DRAW = { FULL: 2500, TENTH: 100, PER_TENTH: 0.2, CRIT: 0.25, FAST: 0.4 };
/* does weapon w shoot only when drawn and let go? The bow; and a grenade, cooked while held: the press pulls its pin and
   its fuse runs from then (NADE: the director plan, Nov 28; on the maps, l4ddrules.js l4Use) */
export const cooks = (w) => w === "grenade";
export const draws = (w) => w === "bow" || cooks(w);
/* how long a press of w can count, ms: the bow's full draw, a grenade's fuse */
export const drawMost = (w) => (cooks(w) ? NADE.FUSE : DRAW.FULL);
/* the host: duck id starts drawing (action { t: "draw", w }) */
export function act_draw({ state, s, a, now }) {
  if (!draws(a.w) || !s.pos || !s.pos[a.id]) return state;
  s.draw = { ...(s.draw || {}), [a.id]: now };
  return s;
}
/* the host, at the release (the use): how long duck id drew, 0 … most ms (0 with no draw begun), and the draw ends */
export function drawTaken(s, id, now, most = DRAW.FULL) {
  const t0 = s.draw && s.draw[id];
  if (t0 == null) return 0;
  const d = { ...s.draw };
  delete d[id];
  s.draw = d;
  return Math.max(0, Math.min(most, now - t0));
}
/* what a draw of dr ms adds: damage (+0.2 a whole tenth of a second, +1 a half second, up to +5), its crit chance
   (25% a second, sure at full) and the arrow's speed (up to 40% faster) */
export const drawDmg = (dr) =>
  Math.round(Math.floor((dr || 0) / DRAW.TENTH) * DRAW.PER_TENTH * 100) / 100;
export const drawCrit = (dr) =>
  (dr || 0) >= DRAW.FULL ? 1 : (DRAW.CRIT * (dr || 0)) / 1000;
export const drawFast = (dr) => 1 + (DRAW.FAST * (dr || 0)) / DRAW.FULL;
/* my screen's meter (meters.js drawBar): when my draw began (the room's clock; gamehand.js sets it) and how long it can
   count (drawMost), and how far it is at now, 0 … 1 (-1: not drawing) */
let mine = null,
  most = DRAW.FULL;
export const myDraw = (t0, full = DRAW.FULL) => {
  mine = t0;
  most = full;
};
export const myDrawShare = (now) =>
  mine == null ? -1 : Math.max(0, Math.min(1, (now - mine) / most));
