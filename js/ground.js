/* ---------- what a duck walks on, for its footsteps ----------
   The owner (Nov 17 12:28Z): "the footstep sound should be the same but altered slightly to sound different for
   different grounds (such as water in the road when walking thru it, grass, concrete/hard surface, wood, and maybe
   another…)". So the same light step (Kenney's footsteps, sound.js) comes in a few grounds: wood (the old "step"),
   grass, hard (concrete, tiles), metal (a roof, a car), shallow water; and in deep water a stroke instead.

     groundAt(x, y, z)  → "wood" | "grass" | "hard" | "metal" | "water" | "deep", where a duck stands (world px, z its
                          height); on a board (no world) it's always wood
     stepOf(ground)     → the sound for one step there (feet.js, l4ddsfx.js)

   Downpour's roofs and canopy come from the map's own floors (layout.js floorAt); the rest is my own reading of each
   map. A map that gives all its floors can take over with setFloor. */
import * as L from "./hangout/layout.js";

const GS = L.GS;
/* a map's own floors, when it has them: fn(x, y, z) → one of the grounds above, or null to let me guess */
let floorAt = null;
const setFloor = (fn) => (floorAt = fn || null);

const HIGH = 60; // this far over the ground under it, a duck is up on something (a roof, a car)
export function groundAt(x, y, z = 0) {
  const own = floorAt && floorAt(x, y, z);
  if (own) return own;
  const v = L.layoutVariant();
  if (v === "l4gs") {
    // Downpour: the roofs and the pumps' canopy (the map's own floors: layout.js floorAt), the flood (deep at the
    // road's west end, shallow over the rest), the buildings, cars' tops, and grass everywhere else
    if (L.floorAt(x, y, z).kind !== "ground") return "metal";
    const up = z - GS.groundAt(x, y) > HIGH; // (up on a car)
    if (!up && GS.inDeep(x, y)) return "deep";
    if (!up && GS.inShallow(x, y)) return "water";
    if (up) return "metal";
    const b = GS.buildingAt(x, y);
    if (b === 1) return "hard"; // (the gas station's tiles)
    if (b === 2) return "wood"; // (the chapel's floor)
    if ((L.deckOver(x, y, z) || {}).kind === "canopy") return "hard"; // (the pumps' concrete)
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
