# Rules for building maps (Hangout's cabin, Dead Ducks Arcade's maps, any new world)

Written after Downpour (Nov 17, 2026), which broke many of these. The owner's words are in agree-or-disagree.md
(05:46Z, Nov 17). Read this before building or changing any walkable map, and check every point before calling
the map done.

## Size
- Measure everything against a duck and against the cabin's rooms and props, never against a whole-map plan.
  Downpour was first built from a plan that looked right zoomed out, but its cars and props were far too big.
- Trees are bigger than ducks. A trunk is about one duck wide, and the leaves are 4 to 5 ducks across.
- Characters keep the cabin's sizes. NPCs like the Priest are normal duck size unless the owner says otherwise.

## Seeing what matters (perspective)
- (Owner 2026-11-17 17:41Z + 18:05Z, replaces the old "covers turn see-through" rule, every mode, forever.) Nothing turns
  see-through because a zombie, duck or Justin is under or behind it. Someone hidden shows as an OUTLINE ONLY, with no
  picture. You see their picture, and the cover turns see-through, only when YOUR duck is under that same roof, inside
  that building, foliage or wall. On top of a roof, roofs never turn see-through. From outside a building you never see
  its inside.
- An important object is never hidden: if even a quarter of it is behind a wall, that wall goes see-through.
  The Angel machine is one; a fireplace, a shop or a power box is another.
- A wall in a given position (south, north, east, west) behaves the same way as every other wall in that position,
  on every map. Don't give one wall its own rules.
- Doors, entrances and holes stay visible. Never hide the way in or out.

## Walls and how they join
- Wall tops join their walls at every corner. A bar that stops short of the wall it meets is never OK.
- A wall's top never lies on the ground as a separate block.
- Don't stack two textures where they overlap (for example a grey wall top drawn over the red shop front). Choose
  one and cut the other.
- Outdoor things (leaves, branches, rain) never show inside a building from where the duck stands.

## Holes and damage
- "Holes" are destruction, like the cabin's: smashed wall, broken boards, broken glass. They are not tidy doorways
  or frames.
- Put holes exactly where the owner marked them (red circles on their pictures in
  /mnt/project-files/refs/zombie-map-plans-2026-11-16/owner/). Don't add holes they didn't mark.
- A destroyed door is one big hole: the door is gone, along with part of the wall and glass, and zombies come
  through it.

## Rooms and props
- A room is named for what's in it. Build it from the cabin's version with the same objects, sizes and
  directions. For example, a restroom is the cabin's bathroom without the tub: a sink with a mirror above it and a
  toilet, all against the top wall.
- Don't invent props the owner didn't ask for. An unexplained raised white platform read as a coffin.
- Everything the owner named must be visible in game. Check each item in the spec on screen; for example, the
  fence was in the data but nobody could see it.
- Pickups, buttons and E-targets work in every room, on phone and PC.

## Light
- A flashlight lights what it points at (walls, cars, fences, props), not just the floor. Light on an object shows
  its detail inside the cone.
- One pixel size across every map and background.

## Water
- Deep water is swimming, as in the Hangout pool, not a wall. Ducks and zombies swim at their own speeds.
- Players can't attack while swimming (guns, bows and melee are put away until they're out), but zombies still
  can.

## Zombies
- Zombies always come to the players. Players should never have to go looking for them.
- After adding any obstacle (trees, cars, props), check that zombies steer around it and still reach a duck from
  every spawn.

## Screen (UI)
- Only one panel at a time: when something opens (shop, Priest, settings), round-0 controls like "Change starting
  round" hide.
- On a phone, controls are small and take as little room as the computer's do, relative to the screen.
- On a phone, the gun and its laser point the way the duck moves.

## Testing before calling a map done
- Play it on a phone as a player: walk every room and every wall corner, use every pickup, stand under every roof
  and tree, shine the light on things, go through every hole and into the water.
- Go through the owner's spec item by item and see each one on screen.
- Take the pictures from where a duck stands, not only from above.

## The old console's limits (every picture, not only maps)
The owner, Nov 19 23:26Z: "imagine we're making a game on a 32-bit only graphics system in whatever era long ago.
That's the limitations we're working with." Decided: limited colors, small files, nothing converted at run time.
`python3 tools/pixel-budget.py` checks the files against these (`--list` names each file, `--strict` exits 1).
- Colors, two kinds (Adam's pick, Nov 20 12:40Z, "B"):
  - Ducks, props, cards, mode and vote pictures, TV stills, items: the 128 colors of `js/pixelpalette.js` (PALETTE),
    one set for the whole game.
  - The maps' worlds and pictures (`assets/px/mapw`, `assets/px/maps`): the era's texture limits, as on a PS1-era
    console: 15-bit color (32 steps a channel) and at most 256 colors in one file, its own palette like a texture's
    color table (`tools/era.py`; `tools/pixel-maps.cjs` runs it on every file it makes). The maps keep their look.
  - See-through has three steps only, for both: none, half, all (0, 128, 255). A half see-through pixel may come
    back a step or two off its color (the browser keeps it times its see-through); the checker allows that.
  - Glows (Adam, Nov 20 12:50Z: they must look like today): a map's soft light is its own file, added to what's under
    it as the era did (the PS1's B+F: css `mix-blend-mode: plus-lighter`, canvas `"lighter"`), holding its light (color
    times see-through) whole. `tools/era.py split`; which files in `tools/pixel-maps.cjs` GLOWS, with the color mostly
    under each (the glow adds only the light above it, so it looks as the see-through drawing did). Only a picture
    with nothing moving between it and the stage gets one (a moving group has nothing under it to add to).
  - Dither, as the era did: a smooth blend (a sky's gradient, a glow) is dithered over its two 15-bit steps (a 4x4
    order; a glow over 256 colors gets its colors picked from its own and spread Floyd-Steinberg) so it doesn't break
    into bands. Flat colors and edges stay exact.
  - Files that hold numbers instead of colors are exempt and only weighed: the ducks' shade sheets
    (`assets/px/ducks`) and the card masks (`assets/px/cards/tint.webp`, `base.webp`); they become palette colors
    when drawn.
- The grid: one world pixel is 2 css px at the usual size (`pixel.js` grid). A map's world is 683 × 384 pixels (a
  1366 × 768 page). Ducks are made at `duckparts.js` SIZES (12 to 64 px). Map pictures 272 × 153, vote pictures
  160 × 90, mode pictures 480 × 270. Card patterns are 4 to 48 px motifs laid out at the grid.
- Size budgets: one file at most 384 KB; `assets/px` in all at most 16 MB; by folder: ducks 10 MB, mapw 3 MB,
  world 1.5 MB, cards 384 KB, each other folder 256 KB. Files are lossless WebP.
- Made at run time, and only these: what code draws pixel by pixel at the grid in limited colors (Starry Night's
  twinkles, the flames special, Tiles, the card pattern layouts, a recolored hat or card mask); and players' uploads,
  each made into pixels the moment it comes in and only the pixels kept (a duck's picture 35 × 35, a card's 64 × 64,
  a Sandbox picture 32 px, through `applyPalette`). Never a drawing (SVG, CSS) or a big picture turned into pixels
  while playing, and never the original kept behind the pixels.
