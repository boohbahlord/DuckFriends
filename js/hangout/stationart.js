/* ---------- Downpour's things: the drawings (Dead Ducks Arcade's second map, stationmap.js) ----------
   The owner's swamp at night in the rain: the gas station, the cars stopped on the road, the chapel, the trees.
   Drawn as Duck Cabin's props are (art.js): ink outlines, lighter tops, darker fronts, seen from above and in front.
   A box-like thing w wide, d deep and h tall is drawn into w × (d + h): its top in the first d, its south face under it.
   Inside one, a point (x, y) of its floor plan at height z is at (x, y − z + h) (`at` below). Preview:
   tools/downpour-art.html. */

export { F, O, SKINS, ln, wrap } from "./stationbase.js";
export {
  SPLINTER,
  canopySVG,
  counterSVG,
  fenceCornerSVG,
  fenceLean,
  fenceSVG,
  fenceXSVG,
  generatorSVG,
  gsWallTop,
  gsWallX,
  gsWallY,
  pumpSVG,
  shelfSVG,
} from "./stationparts.js";
export {
  BELL_ANGLES,
  BELL_BOX,
  FLARE_STICK,
  JUSTIN_POOL,
  altarSVG,
  bellSVG,
  carSVG,
  corpse,
  corpseSVG,
  pewSVG,
  towerSVG,
} from "./stationcars.js";
export {
  SWAMP_KINDS,
  fallenSVG,
  swampCrownSVG,
  swampShadeSVG,
  swampTreeSVG,
  swampTrunkSVG,
} from "./stationtrees.js";
export {
  LADDER_TOP,
  ladderSVG,
  leanLadderSVG,
  roofSVG,
} from "./stationroof.js";
export { BELL_PIVOT, BELL_REST } from "./stationcars.js";
