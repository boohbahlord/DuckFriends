/* ---------- the game's units, in one place (the cornerstone's one module per mechanic, after 8f: 4) ----------
   A spot is a share of the world (x, y: 0 … 1); the maps (Hangout's world, Dead Ducks Arcade, Sandbox's floors) measure
   in world px (W by H, hangout/layout.js); a duck length is DUCK of them; a tile is a quarter of a duck length (the
   owner's, Nov 21 19:13Z: distances in tiles, never duck lengths). On the boards a duck length is sandboxrules.js
   boardDuck(s). */
import { W, H } from "./hangout/layout.js";

export const TILE = 0.25; // (duck lengths)
/* a spot's place in world px, [x, y] */
export const toPx = (p) => [p.x * W, p.y * H];
