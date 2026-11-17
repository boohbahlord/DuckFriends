/* ---------- what a duck walks on, for its footsteps ----------
   The owner (Nov 17 12:28Z): "the footstep sound should be the same but altered slightly to sound different for
   different grounds (such as water in the road when walking thru it, grass, concrete/hard surface, wood, and maybe
   another…)". So the same light step (Kenney's footsteps, sound.js) comes in a few grounds: wood (the old "step"),
   grass, hard (concrete, tiles), metal (a roof, a car), shallow water; and in deep water a stroke instead.

     groundAt(x, y, z)  → "wood" | "grass" | "hard" | "metal" | "water" | "deep", where a duck stands (world px, z its
                          height); on a board (no world) it's always wood
     stepOf(ground)     → the sound for one step there (feet.js, l4ddsfx.js)

   This is my own reading of each map until the map's builder gives its floors (then floorAt here asks it first). */
import * as L from "./hangout/layout.js";

const GS = L.GS;
/* a map's own floors, when it has them: fn(x, y, z) → one of the grounds above, or null to let me guess */
let floorAt = null;
export const setFloor = (fn) => (floorAt = fn || null);

const HIGH = 60; // this far over the ground under it, a duck is up on something (a roof, a car)
export function groundAt(x, y, z = 0) {
  const own = floorAt && floorAt(x, y, z);
  if (own) return own;
  const v = L.layoutVariant();
  if (v === "l4gs") {
    // Downpour: the flood (deep at the road's west end, shallow over the rest), the buildings, roofs and cars' tops,
    // and grass everywhere else
    const up = z - GS.groundAt(x, y) > HIGH;
    if (!up && GS.inDeep(x, y)) return "deep";
    if (!up && GS.inShallow(x, y)) return "water";
    if (up) return "metal";
    const b = GS.buildingAt(x, y);
    if (b === 1) return "hard"; // (the gas station's tiles)
    if (b === 2) return "wood"; // (the chapel's floor)
    return "grass"; // (the road's banks too: the flood covers the rest of it)
  }
  // Duck Cabin (Hangout's and Quacky Zombies'): the pool, the cabin, the deck and the stage, then the ground outside
  if (L.inPool(x, y) && L.heightAt(x, y) === L.POOL.h && z <= L.POOL.h + 4)
    return "deep"; // (swimming: water.js swimming)
  if (L.inCabin(x, y) || L.inDeck(x, y) || L.onStage(x, y)) return "wood";
  if (L.onStageStairs(x, y) || L.onPlatform(x, y)) return "wood";
  return "grass";
}
const STEP = {
  wood: "step",
  grass: "stepGrass",
  hard: "stepHard",
  metal: "stepMetal",
  water: "stepWater",
  deep: "swim",
};
export const stepOf = (g) => STEP[g] || "step";
