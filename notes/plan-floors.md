# Sandbox Phase 4: floors (Adam, Nov 20 05:20Z)

The owner's plan (Phase 4, in the Sandbox plan doc): a zone can sit on a floor (1 to 6, 1 is the ground) and be ground
you stand on; falling takes the gas station roof's fall time times the floors dropped; slopes; climbing at a zone's
edge like the ladder; who can stand, climb or use slopes; walls facing the camera go see-through; the camera rises a
little; fire and shots follow the floor rule (the sightline, live since V133).

## What other top-down 2D games do, and what we borrow
- **A height per spot, and a z for whoever stands there** (the 16-bit Zelda games, Hyper Light Drifter, Stardew Valley's
  cliffs): the map is flat, every spot has a floor height, and a character has its own z. It walks on a floor only
  when its feet are at that floor; it falls when the floor under it drops away. We already do exactly this (layout.js
  heightAt, the decks, floorH). Borrowed: a Sandbox ground zone is one more deck, nothing new in how ducks move.
- **Layers, not real 3D** (Zelda's two-layer dungeons): a floor is a flat slab at one height; what is under it is hidden
  while you are on top, and what is on top is drawn over everything under it. Borrowed: a ground zone draws its top at
  its height, with a darker front face down to the floor under it, so it reads as a block.
- **Stairs and ramps are their own tiles** whose height goes up step by step along one direction (every isometric and
  top-down RPG). Borrowed for slopes: a slope zone's height runs from its low floor to its high floor along its length,
  in the 2.5% steps already used for the sightline.
- **Climbing is an edge you push into** (Zelda's ledges and ladders, Celeste's walls): you climb only while pushing
  toward the higher side, you let go when you push away. Borrowed: our ladder (world.js climb), on every edge of a
  ground zone.
- **The shadow stays on the floor under you** while you are in the air, so the player reads height at a glance. We
  already draw the shadow on the floor (floorH).
- **Line of sight is checked against the slabs** (roguelikes' and tactics games' cover rules): our sightline, which now
  counts Sandbox floors as slabs too.

## Order of the work
1. Floor (1 to 6) and Ground on a zone; ground zones as decks on the worlds (Downpour, the Cabins); standing, walking off
   and falling (fall time times the floors), the shadow; shots and outlines follow the slabs. Its top drawn at its
   height with a front face. A zone whose working squares stop under you drops you (its squares are the ground).
2. Climbing at its edges, and the "Who can stand and climb" list.
3. Slopes.
4. NPCs and zombies on floors (spawned high with no ground: they fall).
5. Walls facing the camera see-through; the camera rising.
The board (no heights at all) comes after the worlds, if the owner wants it there.
