/* ---------- Duck Cabin: the world of Hangout ----------
   World px: x across (0 west … 6000 east), y is depth (0 north, far away … 4400 south, toward the viewer). A duck is 64
   tall. Heights in world px: 0 is the highground (the cabin floor and the deck are 0 too); a thing at (x, y) with height h
   draws at (x, y − h), so the downhill (−240) draws lower on the screen. Plain data and geometry, no drawing: the host's
   rules, the computers and every screen work from the same numbers.

   The map (plan-hangout.md): the highground in the north (the dirt path and the red jeep, the soccer field in the east),
   the cabin in the middle (great room, a hall, the kitchen, the bathroom, two bedrooms; the front door in the north wall,
   the back door in the south wall onto the deck), the deck raised over the slope with its stairs down at the east end,
   the downhill in the south (the pool, the campfire, the trampoline), and forest all round. */
export const W = 6000, H = 4400, DUCK = 64;
export const EDGE = 150;          // the forest: nobody walks closer to the world's edge than this
export const STEP = 12;           // a duck walks up this much without jumping
export const FOOT = 16;           // a duck's feet: how close it gets to a wall or a trunk
export const CABIN = { x0: 1300, y0: 600, x1: 4300, y1: 2200, wall: 180, inner: 120, rise: 260 };
export const DECK = { x0: 2200, y0: 2200, x1: 4300, y1: 2600, rail: 40 };
export const STAIRS = { x0: 4300, x1: 4500, y0: 2200, land: 2350, y1: 2900, n: 20 };   // the deck's stairs, down to the downhill
export const SLOPE = { y0: 1900, y1: 2800, low: -240 };
/* the stage: half an oval, its flat side on the great room's east wall (cx: the wall's face) north of the hall doorway,
   rx out into the room, ry along the wall; its stairs along the same wall on its south side, climbing north onto it */
export const STAGE = { cx: 3288, cy: 808, rx: 250, ry: 195, h: 70, sx0: 3208, sx1: 3288, sy0: 993, sy1: 1140, n: 6 };
export const POOL = { x0: 3000, y0: 3100, x1: 4800, y1: 3900, h: -280, rope: 3900, steps: [3110, 3410], step: 44 };   // (steps: 3 of them, 44 wide, along the west end from y 3110 to 3410, as art.js draws them)
export const TRAMP = { cx: 5200, cy: 3000, rx: 150, ry: 100, h: 30 };   // the trampoline: its mat (an oval) stands 30 over the downhill
export const FIELD = { x0: 4500, y0: 400, x1: 5800, y1: 1800 };
export const PATH = { x0: 300, y0: 440, x1: 2080, y1: 590 };
export const DOORS = { front: { x: 2000, y: 600 }, back: { x: 2800, y: 2200 } };

const inR = (x, y, r) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
/* the ground outside: flat on the highground, falling smoothly down the slope, flat again downhill */
export const terrainAt = y => SLOPE.low * smooth((y - SLOPE.y0) / (SLOPE.y1 - SLOPE.y0));
export const onStage = (x, y) => x <= STAGE.cx && ((x - STAGE.cx) / STAGE.rx) ** 2 + ((y - STAGE.cy) / STAGE.ry) ** 2 <= 1;
export const onStageStairs = (x, y) => x >= STAGE.sx0 && x < STAGE.sx1 && y >= STAGE.sy0 && y < STAGE.sy1;
export const inCabin = (x, y) => x > CABIN.x0 && x < CABIN.x1 && y > CABIN.y0 && y < CABIN.y1;   // (the walls' middle lines)
export const inDeck = (x, y) => inR(x, y, [DECK.x0, DECK.y0, DECK.x1, DECK.y1]);
export const inPool = (x, y) => inR(x, y, [POOL.x0, POOL.y0, POOL.x1, POOL.y1]);
export const onTramp = (x, y) => ((x - TRAMP.cx) / TRAMP.rx) ** 2 + ((y - TRAMP.cy) / TRAMP.ry) ** 2 <= 1;

/* things a duck can jump onto and stand on (beds, tables): { x0, y0, x1, y1, top, key }, filled by add() */
const PLATS = [];
const platAt = (x, y) => PLATS.find(q => x >= q.x0 && x < q.x1 && y >= q.y0 && y < q.y1) || null;
/* on top of a bed or a table (somewhere a duck jumps up to, never walks to) */
export const onPlatform = (x, y) => !!platAt(x, y);
/* the height of whatever a duck stands on at (x, y) */
export function heightAt(x, y) {
  if (onStage(x, y)) return STAGE.h;
  if (onStageStairs(x, y)) return STAGE.h * (1 - Math.min(STAGE.n - 1, Math.floor((y - STAGE.sy0) / (STAGE.sy1 - STAGE.sy0) * STAGE.n)) / STAGE.n);   // (steps of 12 at most; the top one level with the stage)
  const pl = PLATS.length && platAt(x, y); if (pl) return pl.top;
  if ((x >= CABIN.x0 && x < CABIN.x1 && y >= CABIN.y0 && y < CABIN.y1) || inDeck(x, y)) return 0;
  if (x >= STAIRS.x0 && x < STAIRS.x1 && y >= STAIRS.y0 && y < STAIRS.y1)
    return y < STAIRS.land ? 0 : SLOPE.low / STAIRS.n * Math.min(STAIRS.n, Math.floor((y - STAIRS.land) / (STAIRS.y1 - STAIRS.land) * STAIRS.n) + 1);
  if (onTramp(x, y)) return terrainAt(y) + TRAMP.h;   // (a jump gets onto it; trampoline.js bounces it)
  if (inPool(x, y)) return x < POOL.x0 + 3 * POOL.step && y >= POOL.steps[0] && y < POOL.steps[1] ? SLOPE.low - 10 * (Math.floor((x - POOL.x0) / POOL.step) + 1) : POOL.h;   // (the pool's steps, at its west end)
  return terrainAt(y);
}

/* ---------- the props: everything that stands in the world ----------
   { id, kind, x, y, w, d, h, z } is a box: its footprint (x, y the north-west corner, w across, d deep) on ground at
   height z, standing h tall. Drawn in its box on the screen (world px): left x, top y − z − h, w wide, d + h tall
   (box overrides it); depth-sorted by key (default y + d, its front). solid: blocks walking over its footprint (block
   overrides it) up to the height top (none: always). layer 'floor': drawn under every duck. only 'in' | 'out': shown
   only while my duck is inside (or outside) the cabin. fade: turns see-through while it hides a duck. plat: its top can
   be stood on (a jump gets up; walking can't). light: { x, y, r, c, k,
   flick } a pool of light on the ground. Drawings: shapes.js (placeholders) by kind. */
export const PROPS = [];
const count = {};
function add(kind, x, y, w, d, h, o = {}) {
  const p = { kind, x, y, w, d, h, z: heightAt(x + w / 2, y + d - 1), ...o };
  p.id = o.id || kind + (count[kind] = (count[kind] || 0) + 1);
  p.key = o.key ?? y + d;
  p.box = o.box || { l: x, t: y - p.z - h, w, h: d + h };
  if (p.solid && !p.block) p.block = [x, y, x + w, y + d];
  if (p.solid && p.top === undefined) p.top = p.plat ? p.z + h : Infinity;
  if (p.plat) PLATS.push({ x0: x, y0: y, x1: x + w, y1: y + d, top: p.z + h, key: p.key });
  PROPS.push(p); return p;
}
const WARM = '#ffb24a', HOT = '#ff8a2a';

/* walls: a line of wall pieces, 24 thick, centered on the line. East-west: one piece; north-south: pieces of 200 at most,
   each sorted by its own front; a wall turns see-through over a duck behind it */
const T = 12;
function wallX(y, x0, x1, h, o = {}) { return add('wall', x0 - T, y - T, x1 - x0 + 2 * T, 2 * T, h, { solid: true, z: 0, fade: true, ...o }); }
function wallY(x, y0, y1, h, o = {}) {
  for (let a = y0; a < y1; a += 200) { const b = Math.min(y1, a + 200); add('wall', x - T, a - T, 2 * T, b - a + 2 * T, h, { solid: true, z: 0, fade: true, ...o }); }
}
const C = CABIN, WIN = [1550, 2080, 3300, 3700, 4080];   // the south wall's windows (their middles)
// the outside walls: the front door (north) and the back door (south) are gaps
wallX(C.y0, C.x0, 1920, C.wall, { side: 'n' }); wallX(C.y0, 2080, C.x1, C.wall, { side: 'n' });
wallY(C.x0, C.y0, C.y1, C.wall); wallY(C.x1, C.y0, C.y1, C.wall);
for (const [x0, x1] of [[C.x0, 2720], [2880, C.x1]]) {
  wallX(C.y1, x0, x1, C.wall, { only: 'out', side: 's', windows: WIN.filter(x => x > x0 && x < x1), key: C.y1 + T });   // outside: the front of the cabin, windows lit
  add('stub', x0 - T, C.y1 - T, x1 - x0 + 2 * T, 2 * T, 14, { only: 'in', z: 0 });                                     // inside: it goes away, a low line left
}
add('doorway', 2720, C.y1 - T, 160, 2 * T, C.wall, { only: 'out', z: 0 });   // the back door, open, warm light inside
// inside: the great room | the hall | the kitchen, the bathroom, a nook, bedroom 1, bedroom 2 (doors are gaps)
const IN = { only: 'in' };
wallY(3300, C.y0, 1275, C.inner, IN); wallY(3300, 1425, C.y1, C.inner, IN);
for (const [a, b] of [[C.y0, 790], [940, 1200], [1350, 1470], [1630, 1860], [2010, C.y1]]) wallY(3500, a, b, C.inner, IN);
wallX(1100, 3500, C.x1, C.inner, IN);                                       // the kitchen's south wall
wallY(3900, 1100, 1470, C.inner, IN); wallY(3900, 1630, 1650, C.inner, IN);  // the bathroom | bedroom 1 (its door from the nook)
wallX(1450, 3500, 3900, C.inner, IN);                                       // the bathroom's south wall
wallX(1650, 3500, C.x1, C.inner, IN);                                       // bedroom 2's north wall
/* the doors, in the gaps of the outside walls (the front door, the back door to the deck): in an east-west wall at y = at,
   across x a … b. hinge: the end it turns on; swing: the side it opens to. They never block walking: doors.js swings each
   open while a duck is near (drawn only, nothing in the room's state) */
export const DOORWAYS = [
  { id: 'door-front', axis: 'x', at: C.y0, a: 1920, b: 2080, hinge: 'a', swing: 's', h: 150 },
  { id: 'door-back', axis: 'x', at: C.y1, a: 2720, b: 2880, hinge: 'a', swing: 's', h: 150 },
];
/* the doorways inside: open gaps, no doors (the owner: only the front door and the deck's) */
export const OPENINGS = [
  { id: 'gap-great', at: 3300, a: 1275, b: 1425 }, { id: 'gap-kitchen', at: 3500, a: 790, b: 940 }, { id: 'gap-bath', at: 3500, a: 1200, b: 1350 },
  { id: 'gap-nook', at: 3500, a: 1470, b: 1630 }, { id: 'gap-bed2', at: 3500, a: 1860, b: 2010 }, { id: 'gap-bed1', at: 3900, a: 1470, b: 1630 },
];
for (const d of DOORWAYS) add('door', d.a, d.at - T, d.b - d.a, 2 * T, d.h, { id: d.id, z: 0, door: d, key: d.at + 6 });

/* the great room: along the north wall the piano, the coat rack, the front door with its mat and boots, the guestbook,
   the fireplace with an armchair turned to it, a low bookshelf under two pictures, a clock; the stage in the north-east
   corner; the card table in the middle; the chalk floor in the south-west, with the chalk, the eraser and the white X;
   in the south-east corner the couches in an L on a rug, the end table between them, the coffee table, and the TV turned
   to face them; plants in the empty corners */
const FLOOR = { layer: 'floor', z: 0, ...IN };
add('piano', 1340, 612, 540, 80, 150, { solid: true, ...IN, box: { l: 1340, t: 452, w: 540, h: 240 }, light: { x: 1610, y: 760, r: 330, c: WARM, k: .3, flick: .4 } });   // (art.js' pianoBody: 240 tall; its candles light the floor)
add('coatrack', 1884, 698, 34, 30, 160, { solid: true, ...IN });
add('mat', 1935, 614, 130, 64, 0, FLOOR);
add('boots', 2090, 690, 54, 24, 40, { ...IN });
add('book', 2095, 640, 60, 36, 60, { solid: true, ...IN });
add('fireplace', 2180, 612, 240, 90, 220, { solid: true, ...IN, light: { x: 2300, y: 730, r: 460, c: HOT, k: .5, flick: 1 } });
add('rug', 2820, 1700, 470, 470, 0, FLOOR);
add('couch', 2895, 2078, 280, 100, 70, { solid: true, ...IN, seats: 2 });                // (against the south wall, facing north: its back to us)
add('couch', 3182, 1690, 100, 380, 70, { solid: true, ...IN, seats: 3, facing: 'w' });   // (against the east wall, facing west)
add('couch', 2448, 712, 100, 150, 70, { solid: true, ...IN, seats: 1, facing: 'w', color: '#c4803a' });   // (the armchair, turned to the fire)
add('lamp', 3190, 2090, 84, 84, 50, { solid: true, ...IN, end: true, light: { x: 3232, y: 2110, r: 300, c: WARM, k: .45 } });   // (the end table, in the couches' corner)
add('lamp', 3140, 1640, 44, 30, 150, { solid: true, ...IN, light: { x: 3162, y: 1690, r: 300, c: WARM, k: .45 } });
add('coffee', 2965, 1850, 150, 100, 38, { solid: true, plat: true, ...IN });
add('tv', 2745, 1640, 140, 124, 112, { solid: true, ...IN });   // (turned 45°, facing the couches)
add('shelf', 2610, 612, 190, 40, 100, { solid: true, ...IN });
add('picture', 2652, 612, 46, 2, 38, { z: 118, ...IN, art: 'duck' });
add('picture', 2730, 612, 46, 2, 38, { z: 124, ...IN, art: 'hills' });
add('clock', 2977, 612, 46, 2, 46, { z: 112, ...IN });
add('table', 2200, 1250, 200, 100, 55, { solid: true, plat: true, ...IN, cards: true });   // (the card table; its two chairs sit, seats.js)
add('plant', 1320, 2120, 50, 50, 90, { solid: true, ...IN });
add('plant', 2650, 2120, 50, 50, 90, { solid: true, ...IN });
add('stage', STAGE.cx - STAGE.rx, STAGE.cy - STAGE.ry, STAGE.rx, 2 * STAGE.ry, STAGE.h, { z: 0, ...IN, key: STAGE.cy + STAGE.ry, light: { x: STAGE.cx - STAGE.rx * .45, y: STAGE.cy, r: 300, c: '#ffd9a0', k: .3 } });
add('stagestairs', STAGE.sx0, STAGE.sy0, STAGE.sx1 - STAGE.sx0, STAGE.sy1 - STAGE.sy0, STAGE.h, { z: 0, ...IN, key: STAGE.cy + STAGE.ry + 1 });   // (in front of the stage; a duck on it in front of both)
add('mic', STAGE.cx - STAGE.rx + 25, STAGE.cy - 10, 40, 20, 90, { z: STAGE.h, ...IN });   // (at its left end)
add('chalkfloor', 1380, 1600, 600, 550, 0, FLOOR);
add('chalk', 2030, 1650, 70, 40, 0, FLOOR);
add('eraser', 2020, 1730, 90, 80, 0, FLOOR);
add('wipe', 2028, 1850, 74, 74, 0, FLOOR);   // (the white X: the whole floor wiped)
add('lamp', 1326, 1520, 44, 30, 150, { solid: true, ...IN, light: { x: 1348, y: 1580, r: 300, c: WARM, k: .45 } });
/* the kitchen, the bathroom, the bedrooms */
add('counter', 3530, 612, 250, 78, 75, { solid: true, ...IN });
add('stove', 3780, 612, 120, 78, 75, { solid: true, ...IN });
add('counter', 3900, 612, 240, 78, 75, { solid: true, ...IN });
add('fridge', 4150, 612, 120, 90, 160, { solid: true, ...IN });
add('table', 3800, 850, 200, 100, 55, { solid: true, plat: true, ...IN, light: { x: 3900, y: 900, r: 360, c: WARM, k: .32 } });
add('tub', 3515, 1115, 175, 100, 45, { solid: true, ...IN });
add('sink', 3805, 1115, 80, 60, 75, { solid: true, ...IN, light: { x: 3845, y: 1230, r: 250, c: '#ffe0b0', k: .3 } });   // (the light over its mirror)
add('toilet', 3712, 1112, 80, 70, 44, { solid: true, ...IN });   // (against the north wall, between the tub and the sink)
add('bed', 4060, 1130, 210, 270, 45, { solid: true, plat: true, ...IN });
add('rug', 3950, 1420, 300, 190, 0, FLOOR);
add('lamp', 3960, 1112, 40, 30, 110, { solid: true, ...IN, light: { x: 3980, y: 1160, r: 260, c: WARM, k: .45 } });
add('bed', 3960, 1690, 300, 270, 45, { solid: true, plat: true, ...IN });
add('rug', 3600, 1800, 330, 300, 0, FLOOR);
add('lamp', 3900, 1672, 40, 30, 110, { solid: true, ...IN, light: { x: 3920, y: 1720, r: 260, c: WARM, k: .45 } });

/* the roof (outside: it covers the cabin) and the deck */
add('roof', C.x0 - 40, C.y0 - 40, C.x1 - C.x0 + 80, C.y1 - C.y0 + 80, 0, { z: C.wall, only: 'out', fade: true, key: C.y1 + 15,
  box: { l: C.x0 - 40, t: C.y0 - 40 - C.wall - C.rise, w: C.x1 - C.x0 + 80, h: C.y1 - C.y0 + 80 + C.rise } });
/* the railing: around the deck's open sides and both sides of the stairs; a jump clears it (it is 40 tall) */
const RAIL = 40;
function railX(y, x0, x1) { const z = Math.max(heightAt((x0 + x1) / 2, y - 2), heightAt((x0 + x1) / 2, y + 2)); add('rail', x0 - 4, y - 6, x1 - x0 + 8, 12, RAIL, { z, solid: true, top: z + RAIL }); }
function railY(x, y0, y1) {
  for (let a = y0; a < y1; a += 100) { const b = Math.min(y1, a + 100), m = (a + b) / 2, z = Math.max(heightAt(x - 8, m), heightAt(x + 8, m));
    add('rail', x - 6, a, 12, b - a, RAIL, { z, solid: true, top: z + RAIL, key: b }); }
}
railY(DECK.x0, DECK.y0, DECK.y1); railX(DECK.y1, DECK.x0, DECK.x1); railY(STAIRS.x0, STAIRS.land, STAIRS.y1); railY(STAIRS.x1, STAIRS.y0, STAIRS.y1); railX(STAIRS.y0, STAIRS.x0, STAIRS.x1);
add('rocker', 3330, 2240, 80, 60, 80, { solid: true });
add('rocker', 3560, 2240, 80, 60, 80, { solid: true });
add('deck-table', 3460, 2260, 60, 50, 45, { solid: true, plat: true });
const GLOWS = [];   // lights with no prop of their own: the south windows on the deck, the deck's string lights
for (const x of WIN) GLOWS.push({ x, y: C.y1 + 70, r: 220, c: WARM, k: .35, only: 'out' });
for (let x = 2350; x < 4300; x += 320) GLOWS.push({ x, y: C.y1 + 60, r: 150, c: '#ffcf70', k: .3, flick: .3, only: 'out', porch: true });

/* outside: the jeep on the dirt path, lampposts, the campfire and its logs, the trampoline, the soccer goal */
add('jeep', 580, 495, 260, 125, 110, { solid: true });
const POST = { solid: true, fade: true };
for (const [x, y] of [[950, 400], [1680, 400], [2900, 3020], [4880, 3020], [2900, 3960], [4880, 3960]])
  add('post', x - 15, y - 10, 30, 20, 230, { ...POST, light: { x, y, z: 160, r: 330, c: WARM, k: .5, flick: 1 } });   // (z: drawn round the lantern, 160 over the ground)
add('campfire', 1440, 3260, 120, 80, 30, { solid: true, light: { x: 1500, y: 3300, r: 460, c: HOT, k: .6, flick: 1.6 } });
for (const [x, y] of [[1260, 3170], [1620, 3170], [1260, 3400], [1620, 3400]]) add('log', x, y, 120, 40, 35, { solid: true, seats: 2 });
add('trampoline', TRAMP.cx - TRAMP.rx, TRAMP.cy - TRAMP.ry, 2 * TRAMP.rx, 2 * TRAMP.ry, 0, { layer: 'none', z: terrainAt(TRAMP.cy) });   // (trampoline.js draws it: its mat dips under a landing; z: the ground under it)
add('goal', 5640, 940, 130, 520, 120, { block: null, fade: true });
for (const r of [[5636, 936, 5664, 964], [5636, 1436, 5664, 1464], [5740, 950, 5770, 1450], [5650, 944, 5760, 956], [5650, 1444, 5760, 1456]])
  add('goalpart', r[0], r[1], r[2] - r[0], r[3] - r[1], 0, { solid: true, block: r, layer: 'none' });   // (the goal's posts, back and sides: walls, not drawn)

/* the forest: two staggered rows of trees all round the edge, and more dotted about the open ground */
const rng = (s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)(20261025);
function tree(cx, cy, s) {
  const z = heightAt(cx, cy), w = 230 * s, h = 320 * s;
  add('tree', cx - 18, cy - 12, 36, 24, h, { z, solid: true, fade: true, size: s, box: { l: cx - w / 2, t: cy - z - h, w, h: h + 16 } });
}
for (const [len, at] of [[W, (t, k) => [t, k]], [W, (t, k) => [t, H - k]], [H, (t, k) => [k, t]], [H, (t, k) => [W - k, t]]])
  for (let row = 0; row < 2; row++) for (let t = row * 65; t < len; t += 120 + rng() * 40) {
    const [x, y] = at(t + rng() * 30, row ? 140 + rng() * 120 : 30 + rng() * 70);
    if (x < 0 || y < 0 || x > W || y > H) continue;
    const sz = .85 + rng() * .4; if (x > FIELD.x1 - 80 && x < W - 120 && y > 900 && y < 1800) continue;   // (the inner row stops beside the soccer net, so the net shows)
    tree(x, y, sz);
  }
const KEEP_OUT = [[1150, 250, 4450, 2350], [2100, 2150, 4650, 3050], [2800, 2950, 5000, 4100], [4380, 280, 5900, 1920], [250, 360, 2200, 700], [1100, 3050, 1900, 3550], [4900, 2750, 5500, 3200], [350, 300, 900, 700]];
for (let k = 0; k < 400 && PROPS.filter(p => p.kind === 'tree').length < 420; k++) {
  const x = EDGE + 200 + rng() * (W - 2 * EDGE - 400), y = EDGE + 200 + rng() * (H - 2 * EDGE - 400);
  if (KEEP_OUT.some(r => inR(x, y, r))) continue;
  if (PROPS.some(p => p.kind === 'tree' && Math.hypot(p.x + 18 - x, p.y + 12 - y) < 260)) continue;
  tree(x, y, .8 + rng() * .45);
}

/* ---------- walking: solids (in a grid of 200 px cells, so a step looks at a few) ---------- */
export const SOLIDS = PROPS.filter(p => p.solid && p.block).map(p => ({ id: p.id, x0: p.block[0], y0: p.block[1], x1: p.block[2], y1: p.block[3], top: p.top }));
const CELL = 200, grid = new Map();
for (const b of SOLIDS) for (let i = Math.floor((b.x0 - FOOT) / CELL); i <= Math.floor((b.x1 + FOOT) / CELL); i++) for (let j = Math.floor((b.y0 - FOOT) / CELL); j <= Math.floor((b.y1 + FOOT) / CELL); j++) {
  const k = i * 1000 + j; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(b);
}
const hits = (b, x, y) => x > b.x0 - FOOT && x < b.x1 + FOOT && y > b.y0 - FOOT && y < b.y1 + FOOT;
/* the solids a duck's feet at (x, y) touch, below height z (all of them without z) */
export function solidsAt(x, y, z = -Infinity) { return (grid.get(Math.floor(x / CELL) * 1000 + Math.floor(y / CELL)) || []).filter(b => hits(b, x, y) && z < b.top); }
/* can a duck's feet at height z go to (x, y)? up: how much higher the ground there may be (a step on the ground; a little
   in the air, so a jump has to clear an edge). from: where it comes from (a solid it is already in doesn't hold it) */
export function standable(x, y, z, up = STEP, from = null) {
  if (x < EDGE || x > W - EDGE || y < EDGE || y > H - EDGE) return false;
  if (heightAt(x, y) > z + up + 1e-6) return false;
  return !solidsAt(x, y, z).some(b => !(from && hits(b, from[0], from[1])));
}
/* where a duck's feet are drawn in depth: its foot y; on the stage (or the stairs' upper steps) in front of the whole
   stage (its strips sort by its front edge, at most cy + ry) and among themselves by depth, squeezed into the 40 steps
   after it (z-indexes are whole numbers); the stairs' lower steps from there on, at their own depth. On a bed or a
   table: in front of it, the same way, in the 8 steps after its front. */
const BAND = 40, BACK = STAGE.cy - STAGE.ry, LOW = STAGE.cy + STAGE.ry + BAND;
export function sortY(x, y, z) {
  const pl = PLATS.length && platAt(x, y); if (pl && z >= pl.top - 1) return pl.key + 1 + (y - pl.y0) / (pl.y1 - pl.y0) * 7;
  if (!(onStage(x, y) || onStageStairs(x, y)) || z < heightAt(x, y) - 1 || y >= LOW) return y;
  return STAGE.cy + STAGE.ry + 1 + (y - BACK) / (LOW - BACK) * (BAND - 1);
}
/* where someone arrives: outside the front door (k: the k-th of n, spread out; a free spot) */
export function spawnAt(k = 0, n = 1) {
  for (let t = 0; t < 40; t++) {
    const i = k + t * 7, x = DOORS.front.x + ((i % 6) - 2.5) * 62 + (t ? (Math.sin(i * 12.9) * 30) : 0), y = DOORS.front.y - 70 - Math.floor(i / 6) % 3 * 60;
    if (standable(x, y, heightAt(x, y), 0)) return { x, y };
  }
  return { x: DOORS.front.x, y: DOORS.front.y - 80 };
}
/* the pools of light on the ground at night: { x, y, r, c (color), k (strength), flick, only, prop (its prop, for a
   lamp that switches) } */
export const LIGHTS = [...PROPS.filter(p => p.light).map(p => ({ only: p.only, ...p.light, prop: p })), ...GLOWS];
