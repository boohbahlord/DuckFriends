/* ---------- one rule by level for a flashlight (the owner's, Nov 28 04:58Z) ----------
   "we should make sure that flashlights don't shine onto the second level for another player who's on that roof while
   the player is below that roof. There should be a principle that determines that at every level in either direction,
   up or down". A cone is drawn at its light's own height (l4dd.js coneSprite). Where a roof (a floor over the ground:
   allDecks, not a car's solid top) higher than the light is drawn now, the cone is cut back out over it, so a light under
   a roof never lights its top, nor what stands under it seen through it (the pumps' squares on the canopy). The other way
   needs nothing: a duck up on a roof is out of sight from under it (layout.js seenFrom), and so is its light */
import { allDecks, deckH } from "./hangout/layout.js";

export function cutRoofsOver(g, Wd, z, q) {
  g.globalCompositeOperation = "destination-out";
  g.globalAlpha = 1;
  g.fillStyle = "#000";
  for (const d of allDecks()) {
    if (d.solid || (d.bldg && Wd.inside)) continue; // (a building's roof isn't drawn while I'm inside)
    const c = [
      [d.x0, d.y0],
      [d.x1, d.y0],
      [d.x1, d.y1],
      [d.x0, d.y1],
    ].map(([x, y]) => [x, y, deckH(d, x, y)]);
    if (c.every((p) => p[2] <= z + 1)) continue; // (no higher than the light: it lights it)
    g.beginPath();
    for (const [x, y, h] of c) {
      const e = Wd.toScreen(x, y, h);
      g.lineTo(e.left * q, e.top * q);
    }
    g.closePath();
    g.fill();
  }
  g.globalCompositeOperation = "source-over";
}
