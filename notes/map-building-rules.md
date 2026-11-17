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
- Any surface that hides a zombie or another player turns see-through where that zombie or player is, for every
  player. This covers walls, roofs, canopies (like the pumps' roof), tree leaves and anything else that covers.
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
