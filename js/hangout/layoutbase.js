/* ---------- Duck Cabin: the world's numbers every part of the layout shares (the owner's, Nov 22: layout.js split by
   mechanic, no behavior change): sizes, regions, the doors, the turn of the world (variant) ---------- */
/* W, H: the world's size; Dead Ducks Arcade's second map has its own (useMode switches them) */
export let W = 6000,
  H = 4400;
export const DUCK = 64;
export let variant = "", // "l4": Quacky Zombies' cabin, "l4gs": its second map (useMode below)
  rev = 0; // (rev: counts each turn of useMode, layoutRev)
export const EDGE = 150; // the forest: nobody walks closer to the world's edge than this
export const STEP = 12; // a duck walks up this much without jumping
export const FOOT = 16; // a duck's feet: how close it gets to a wall or a trunk
export const CABIN = {
  x0: 1300,
  y0: 600,
  x1: 4300,
  y1: 2200,
  wall: 180,
  inner: 120,
  rise: 260,
};
export const DECK = { x0: 2200, y0: 2200, x1: 4300, y1: 2600, rail: 40 };
export const STAIRS = {
  x0: 4300,
  x1: 4500,
  y0: 2200,
  land: 2350,
  y1: 2900,
  n: 20,
}; // the deck's stairs, down to the downhill
export const SLOPE = { y0: 1900, y1: 2800, low: -240 };
/* the stage: half an oval, its flat side on the great room's east wall (cx: the wall's face) north of the hall doorway,
   rx out into the room, ry along the wall; its stairs along the same wall on its south side, climbing north onto it */
export const STAGE = {
  cx: 3288,
  cy: 808,
  rx: 250,
  ry: 195,
  h: 70,
  sx0: 3208,
  sx1: 3288,
  sy0: 993,
  sy1: 1140,
  n: 6,
};
export const POOL = {
  x0: 3000,
  y0: 3100,
  x1: 4800,
  y1: 3900,
  h: -280,
  rope: 3900,
  steps: [3110, 3410],
  step: 44,
}; // (steps: 3 of them, 44 wide, along the west end from y 3110 to 3410, as art.js draws them)
export const TRAMP = { cx: 5200, cy: 3000, rx: 150, ry: 100, h: 30 }; // the trampoline: its mat (an oval) stands 30 over the downhill
export const FIELD = { x0: 4500, y0: 400, x1: 5800, y1: 1800 };
export const PATH = { x0: 300, y0: 440, x1: 2080, y1: 590 };
export const DOORS = { front: { x: 2000, y: 600 }, back: { x: 2800, y: 2200 } };
/* the cabin's two doors are one door (art.js' cabinDoor): w wide and h tall in a frame `frame` wide, so the opening in
   the wall is the frame's outside edges (w + 2 · frame) */
export const DOOR = { w: 64, h: 112, frame: 8 };
export const DOOR_HALF = DOOR.w / 2 + DOOR.frame;

export const inR = (x, y, r) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
export const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
/* the props, the platforms and the walls' thickness every part of the layout shares; the setters are how layout.js'
   useMode turns the world (nothing outside assigns a module's let) */
export const PROPS = [];
export const PLATS = [];
export const T = 12;
export const setWorldSize = (w, h) => {
  W = w;
  H = h;
};
export const setVariant = (v) => {
  variant = v;
  rev++;
};
