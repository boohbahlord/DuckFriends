/* ---------- Sandbox: a spawned NPC's picture, whatever it is ----------
   A zombie is Dead Ducks Arcade's (l4ddart.js zombieURL, with its wounds); a Blank NPC, Justin or a Test NPC is a duck
   in its own look (o.dk), lying down with its eyes shut once it's dead. Its box is as a zombie's: 64 wide, as tall as its
   drawing, its feet 10 units over the bottom. Used on the board (game.js placeZombies) and on Duck Cabin
   (sbspawnview.js) */
import { duckSVG } from "./duck.js";
import { svgDataURL } from "./hangout/art.js";
import { zombieURL, zombieBox } from "./l4ddart.js";
import { esc } from "./ui.js";

export const isZombie = (o) => !o.k || o.k === "zombie";
const PICS = new Map(),
  BOXES = new Map(),
  keyOf = (o) => JSON.stringify(o.dk || {});
export function npcURL(o, hits = "") {
  if (isZombie(o)) return zombieURL(o.l, o.i, hits);
  const k = keyOf(o) + (o.d ? "+dead" : "");
  if (!PICS.has(k)) {
    if (PICS.size > 300) PICS.clear();
    PICS.set(
      k,
      svgDataURL(duckSVG(o.dk || {}, { size: 64, shadow: true, dead: !!o.d })),
    );
  }
  return PICS.get(k);
}
export function npcBox(o) {
  if (isZombie(o)) return zombieBox(o.l);
  const k = keyOf(o);
  if (!BOXES.has(k)) {
    const v = duckSVG(o.dk || {}, { size: 64 })
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
/* the name over one that has one (Justin, a Test NPC) */
export const npcName = (o) =>
  o.nm ? `<span class="sb-npc-name">${esc(o.nm)}</span>` : "";
