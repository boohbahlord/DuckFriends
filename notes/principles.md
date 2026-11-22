# The numbers, heights and push (read only when a change touches them)
Each rule lives in one module; the numbers live in js/gamedefaults.js or a breed table, never in a mode's code.

## Units (js/units.js)
- A spot is a share of the world (x, y: 0 to 1). Maps measure in world px (W by H, hangout/layout.js).
- A duck length is DUCK world px. A tile is a quarter of a duck length (TILE). Players see distances in tiles, never duck lengths (owner, Nov 21 19:13Z).

## Heights (js/heights.js)
- One elevation is the gas station roof: ELEV = 108 px (owner, Nov 21 14:06Z).
- A body's height has one reading, zOf(b, kind, now). A jump counts from the moment it starts (the arc on the room's clock).
- Levels: levelOf(z) = z / ELEV + LEVEL.GROUND, with the ground as level 1; levelZ(n) is its inverse. Arrows show a level number only on whole levels.
- Water depth is measured from the map's swim floor (FLOOD.floor), never from a map's name. Walkers wade at WET.WADE and swim at WET.SWIM, and only at the water's height.
- Darker below: everything under my floor is BELOW.PER (20%) darker per level, with no cap. A fall steps through the levels; a jump never changes it.
- Melee reaches only within the swinger's height (swingH: feet to feet + DUCK x Size). Flames keep nearH.

## Push (js/push.js, js/blast.js, js/chair.js)
- Weight is Size: a duck 10% bigger is 10% heavier, hits 10% harder in melee, is pushed 10% less, and walks 10% slower (never under WEIGHT.SLOWEST of its walk).
- Dead weight: the held weapon's ARMS dw adds to the carrier's weight (WEIGHT.DEAD_FROM "held"). It never adds to the push the carrier deals.
- Thrown and fired pushes (grenades, launchers, shots) never depend on the thrower's size or weight.
- Cars weigh WEIGHT.CAR (15 ducks). Every push moves them through one rule, blasts and swings alike.
- Blasts: rings one tile wide (BLAST.RING) around the corner where 4 tiles meet. The center does BLAST.CENTER and always crits; each ring out does half, stopping under BLAST.LEAST. Outside the center a crit is BLAST.CRIT likely. The lift is x (1 - d / r).
- Hitboxes are the duck's body only (duckRoom x Size), never hats or outfits. Uploaded pictures are hit as a duck. The chair's hitbox is its picture.

## Damage and HP (js/hpmath.js HP_BREEDS, js/guns.js)
- A crit doubles. HP counts in hundredths for ducks (smooth fill, exact heals) and whole points for NPCs (chunks): a breed field, never a mode check.
