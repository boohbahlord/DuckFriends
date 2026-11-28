/* ---------- one rule by level for a flashlight (the owner's, Nov 28 04:58Z) ----------
   "we should make sure that flashlights don't shine onto the second level for another player who's on that roof while
   the player is below that roof. There should be a principle that determines that at every level in either direction,
   up or down". A cone is drawn at its light's own height (l4dd.js coneSprite). Where a roof (a floor over the ground:
   allDecks, not a car's solid top) higher than the light is drawn now, the cone is cut back out over it, so a light under
   a roof never lights its top, nor what stands under it seen through it (the pumps' squares on the canopy). The other way
   needs nothing: a duck up on a roof is out of sight from under it (layout.js seenFrom), and so is its light */
import { allDecks, deckH, onDeck } from "./hangout/layout.js";

/* the roofs a cone is cut over: not a car's solid top, nor a building's roof while I'm inside (it isn't drawn then) */
const cuts = (d, inside) => !d.solid && !(d.bldg && inside);
/* is (x, y) under or on a roof higher than a light at z: its cone is cut there, so it lights nothing there (l4dd.js paint:
   a duck or a zombie in its beam, a duck's name) */
export const roofOver = (x, y, z, inside) =>
  allDecks().some(
    (d) => cuts(d, inside) && onDeck(d, x, y) && deckH(d, x, y) > z + 1,
  );
const CX = [0, 0, 0, 0],
  CY = [0, 0, 0, 0],
  CH = [0, 0, 0, 0]; // (a roof's corners, reused: a moving light redraws its cone often)
export function cutRoofsOver(g, Wd, z, q) {
  g.globalCompositeOperation = "destination-out";
  g.globalAlpha = 1;
  g.fillStyle = "#000";
  for (const d of allDecks()) {
    if (!cuts(d, Wd.inside)) continue;
    CX[0] = CX[3] = d.x0;
    CX[1] = CX[2] = d.x1;
    CY[0] = CY[1] = d.y0;
    CY[2] = CY[3] = d.y1;
    let high = false;
    for (let i = 0; i < 4; i++) {
      CH[i] = deckH(d, CX[i], CY[i]);
      if (CH[i] > z + 1) high = true;
    }
    if (!high) continue; // (no higher than the light: it lights it)
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const e = Wd.toScreen(CX[i], CY[i], CH[i]);
      g.lineTo(e.left * q, e.top * q);
    }
    g.closePath();
    g.fill();
  }
  g.globalCompositeOperation = "source-over";
}
