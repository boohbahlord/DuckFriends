/* ---------- Dead Ducks Arcade's second map: the gas station, the road and the chapel ----------
   The owner's map (Nov 16 23:15Z), night and rain in a swamp: the gas station in the north, a sunken two-lane road
   across the middle (flooded: deep at the west end, shallow over the rest), the chapel in the south, and forest all
   round, behind the owner's own forest line. Plain numbers and geometry, like layout.js; layout.js builds the props
   from build() below and switches to them in useMode (variant "l4gs"). Floor plan:
   /mnt/project-files/refs/zombie-map-plans-2026-11-16/plan3.py.

   The numbers below are the floor plan's. The map is built at K of them (the owner's, Nov 17 00:45Z: the plan came out
   far too big next to the ducks, so the whole map is 60% of it): every place, size and height, walls, rooms, props,
   cars, pews, pumps, the road, the forest line, the part spots, all from that one number (scaled() at the end of this
   file). Ducks, zombies and weapons stay as they are, and so do the things that are the cabin's own (the Priest, the
   Angel machine, the power box, the toilet).

   Plan px: x across (0 west … 4600 east), y is depth (0 north … 6200 south). Heights: 0 is the grass and every floor;
   the road lies ROAD.low under it. */
export const K = 0.6;
export let GS_W = 4600,
  GS_H = 6200;
/* the road: y0 … y1, its middle line at mid; its bed `low` under the grass, sloping down over `ramp` at each side */
export const ROAD = { y0: 2750, y1: 3350, mid: 3050, low: -40, ramp: 120 }; // (a ramp of 120: never more than 20 up between two zombie path cells 40 apart)
/* the flood over the road: deep at the west end (ducks and zombies swim it, as in the Hangout pool: water.js), shallow
   over the rest, the whole road to the east edge (ducks walk 30% slower in it, sunk by a fifth: the owner's, Nov 17
   11:07Z "the water should be seen over the entire road"). It fills the road's bed up to SHORE in from each side, a
   little over half way down its banks; their upper parts show, sloping down into it (dpground.js) */
export let SHORE = ROAD.ramp * 0.6;
export const DEEP = [0, ROAD.y0 + SHORE, 1000, ROAD.y1 - SHORE],
  SHALLOW = [1000, ROAD.y0 + SHORE, GS_W, ROAD.y1 - SHORE];
export const WADE = 0.7;
/* the owner's forest line: inside TOP (north of the road) and BOT (south of it) is open ground; outside them, forest */
export const TOP = [
  [0, ROAD.y0],
  [0, 2650],
  [800, 2450],
  [560, 640],
  [800, 175],
  [1460, 135],
  [3330, 135],
  [4000, 240],
  [4060, 640],
  [4000, 1450],
  [3720, 2120],
  [3520, 2520],
  [3600, ROAD.y0],
];
export const BOT = [
  [0, ROAD.y1],
  [266, 3520],
  [1060, 3730],
  [1060, 4930],
  [1000, 6050],
  [1730, 6100],
  [3260, 6050],
  [3330, 4400],
  [3720, 3730],
  [4120, 3590],
  [4250, ROAD.y1],
];
/* the buildings: the gas station (its storeroom and restroom on the west side) and the chapel (the bell tower at its
   north-east corner, solid for now) */
export const STATION = { x0: 1100, y0: 550, x1: 3500, y1: 1750, wall: 180 };
export const CHAPEL = { x0: 1600, y0: 3650, x1: 3000, y1: 5750, wall: 240 };
export const TOWER = { x0: 3000, y0: 3650, x1: 3300, y1: 3950, h: 520 };
const INNER = 120;
/* the fences across the road's two ends: tall and solid. Zombies climb them like a ladder, at their own walking speed,
   and drop down the other side from the top (the owner's, Nov 16 23:32Z). x: the fence's line; y0 … y1: how far it
   runs (into the trees at both ends); climb: where along it a zombie comes over (the open ground); out: the side the
   zombies come from (-1 west, 1 east) */
export let FENCE_H = 200;
export const FENCES = [
  { x: 60, y0: 2560, y1: 3500, climb: [2680, 3360], out: -1 },
  { x: 4540, y0: 2700, y1: 3420, climb: [2780, 3320], out: 1 },
];
/* the fence round the whole map, where a duck's walking stops (the owner's, Nov 17 11:11Z: "There must be a fence around
   the whole map WHERE the invisible wall is"): on the road fences' lines west and east, as far in from the north and
   south edges. The road's two fences are its pieces across the road; zombies only climb those */
export const RIM = { x0: 60, x1: 4540, y0: 60, y1: 6140 };
const OUT_ROAD = 300; // (how far past the map's west and east edges the road's own fences go: past what the camera shows)
/* holes anyone walks through, smashed through the wall like the cabin's, and only where the owner circled them (Nov 17
   05:46Z): the storeroom's north wall at its north-west corner, the north wall over the counter, and the front door,
   which is one big hole (the door gone, and some of the wall and the glass either side with it). Zombies come in by
   them too. axis "x": in an east-west wall at y = at, across a … b */
export const WALK_HOLES = [
  { id: "gs-back", axis: "x", at: STATION.y0, a: 1300, b: 1460 },
  { id: "gs-north", axis: "x", at: STATION.y0, a: 2950, b: 3150 },
  { id: "gs-front", axis: "x", at: STATION.y1, a: 2400, b: 2800 },
  /* the restroom's west wall, so nobody is trapped in it (the owner's, Nov 19 19:27Z: "there should be a hole in the
     bathroom wall to the left so that players cannot get trapped. That feels pretty unfair when it happens"). A hole is
     the wall smashed, never a doorway (19:58Z: "a hole in a wall means something's gone wrong and it's destroyed. And I
     want to be able to see the destruction of that wall and see where to enter through it or exit from it ... Make it
     large"): most of the wall, from a little south of the restroom's top wall down to the corner, so no piece of it
     stands south of a duck in the hole (that piece turned see-through over the duck: "The wall does not go
     transparent"); rubble spills out both sides, and from inside the outside shows through it (layout.js PEEKS) */
  { id: "gs-rest-w", axis: "y", at: STATION.x0, a: 1250, b: 1750 },
];
/* the stretch of a walk-through hole in a north-south wall a duck really gets through, [from, to] along it: its feet
   (layout.js FOOT, 16 world px) clear of the wall's broken end north of it and of the wall south of it (the gas station's
   south wall, T thick, where the restroom's runs up to its corner). T: the walls' half thickness (the plan's) */
const walkSpan = (o, T) => [
  o.a + 16 / K,
  o.b - 16 / K - (o.b === STATION.y1 ? T : 0),
];
/* the boarded holes: where zombies tear the boards down and climb in (ducks never get through one). out: the side the
   outside is on (n, s, e, w) */
export const BOARDED = [
  // (none in the gas station: the owner circled only the three holes above)
  ...[4000, 4400, 4800, 5200].flatMap((y, k) => [
    {
      id: "ch-w" + (k + 1),
      axis: "y",
      at: CHAPEL.x0,
      a: y,
      b: y + 140,
      out: "w",
    },
    {
      id: "ch-e" + (k + 1),
      axis: "y",
      at: CHAPEL.x1,
      a: y,
      b: y + 140,
      out: "e",
    },
  ]),
];
/* the big front windows' glass (wall all the same: nobody walks through it) */
const GLASS = [
  [1750, 2450],
  [2750, 3400],
];
/* the chapel's wide entrance, open, in its north wall */
export const CHAPEL_DOOR = { a: 2000, b: 2600 };
/* Part B (the owner's, Nov 17 12:28Z), the spots only so far (Noah draws to them): the ladder up the gas station's back
   (north) wall, at its west end, left of the storeroom's hole, climbed from outside (side "n"), x0 … x1 along the wall;
   the roof is walked on at STATION.wall. The two holes in the roof, x0 y0 x1 y1: its bottom right corner, and over the
   restroom. The bottom right one is big (the owner's, Nov 17 18:05Z: it "can be OVER the diameter of a car in length in
   every direction": a car is 420 long, and its dark mouth, drawn in its box, is at least two thirds of the box across);
   the restroom's stays as it was */
export const LADDER = { at: 550, x0: 1160, x1: 1240, side: "n" };
/* the ladder leaning on the canopy over the pumps, on its left (west) side (the owner's, Nov 19 19:27Z: "Add a ladder to
   the gas pump roof to the left of it. It's kind of leaning over onto it ... zombies or players could use that ladder
   as well"): climbed from outside, pushing east (side "w"), y0 … y1 along the canopy's edge at x `at` */
export const PUMP_LADDER = { at: 1400, y0: 2185, y1: 2265, side: "w" };
const PUMP_LEAN = 67; // (its feet this far out from the canopy's edge: layout.js LADDER_LEAN, 40 on the map, before K)
export const ROOF_HOLES = [
  { id: "hole-se", x0: 2900, y0: 1165, x1: 3460, y1: 1720 },
  { id: "hole-rest", x0: 1250, y0: 1350, x1: 1450, y1: 1550 },
  /* the roof's south-west corner broken off over the restroom's smashed west wall, as far along it as the way through
     it (the owner's, Nov 19 22:41Z: "break a little bit of the corner of the roof as well, and make that like entire
     breaking of that part of that roof on that side of that wall like transparent ... Where it's just a big hole in the
     side ... that you can see into the bathroom"; 22:42Z: "the size of the space that you can actually enter and leave
     through"). corner: drawn as a bite out of the corner (stationart.js roofHole), open to the roof's west and south
     edges */
  {
    id: "hole-rest-w",
    x0: STATION.x0 - 30,
    y0: 1277,
    x1: 1240,
    y1: STATION.y1 + 30,
    corner: "sw",
  },
];
/* the gas station's two doorways onto the aisles, in the storeroom's and the restroom's east wall (x = at), from y = a
   to b: open gaps, drawn open (layout.js puts them in OPENINGS, so the wall south of each starts at its foot instead of
   standing up over it: the owner's, Nov 17 12:28Z, they looked closed) */
export const INNER_DOORS = [
  // (the storeroom's, in the middle of its wall: at 950 to 1110 the restroom's wall stood up over it and hid it, the
  // owner's, Nov 17 13:38Z "still a door missing")
  { id: "gs-store", at: 1600, a: 770, b: 930 },
  { id: "gs-rest", at: 1600, a: 1400, b: 1560 },
];
/* where things stand. GEN: the generator and the power box, east of the gas station. HOOD: the car with its hood up
   (it does the fireplace's job, and glows until it's first used); spot: its open hood, where E uses it. PRIEST (he
   does Justin's Butler's job, at the chapel's south end). ANGEL: the Angel machine, against the south wall. START: where everyone starts,
   inside the gas station by the front door */
export const GEN = { x0: 3650, y0: 1000, x1: 3850, y1: 1160 };
export const POWER_SPOT = { x: 3834, y: 1074 };
export const HOOD = {
  x0: 3330,
  y0: 1990,
  x1: 3710,
  y1: 2190,
  spot: { x: 3270, y: 2090 },
};
export const PRIEST = { x: 2550, y: 5360 };
export const ANGEL = { x: 2250, y: 5717 }; // (against the chapel's south wall: its front on the wall's inside face)
export const START = { x: 2600, y: 1600 };
/* the dead (the owner's, Nov 17 12:28Z; stationart.js corpse): Jaime cut up in the chapel's aisle (Justin stops by him:
   l4ddrules.js), the soldier on the gas station's roof with his flare beside him (it burns at each round's start:
   l4dd.js), and which cars have their windows smashed in and the dead yellow duck on a hood */
export const JAIME_BODY = { x: 2300, y: 4800 };
export const SOLDIER = { x: 1580, y: 780 };
/* the trooper's middle (stationart.js CORPSES.trooper): inside the gas station, south of the counter's long arm and west
   of the east wall, where the owner circled it (Nov 18 10:38Z) */
export const TROOPER = { x: 3190, y: 1410 };
export const FLARE = { x: SOLDIER.x + 92, y: SOLDIER.y + 18 };
const CAR_LOOKS = [
  { smash: "front" },
  {},
  { smash: "side" },
  { smash: "both", dead: "yellow" },
  {},
  { smash: "front" },
];
/* the cars stopped on the road (420 by 200 each; one more by the hood-up car is HOOD) */
export const CARS = [
  [250, 2790],
  [1050, 3090],
  [1550, 2800],
  [2350, 3080],
  [2850, 2790],
  [1650, 3110],
].map(([x, y]) => ({ x0: x, y0: y, x1: x + 420, y1: y + 200 }));
export const PUMPS = [
  { x0: 1700, y0: 2180, x1: 2000, y1: 2260 },
  { x0: 2600, y0: 2180, x1: 2900, y1: 2260 },
];
/* the canopy over the pumps: its roof at z, a little under the gas station's roof (Part B, the owner's, Nov 17 12:28Z:
   it "can be jumped onto from there", "slightly lower"; from the ground only by way of the station's roof) */
export const CANOPY = { x0: 1400, y0: 1950, x1: 3200, y1: 2500, z: 150 };
/* the fallen tree across the east end of the road: ducks jump it (TOP_TREE tall), zombies climb over */
export const FALLEN = {
  x0: 3500,
  y0: 2500,
  x1: 4250,
  y1: 3600,
  half: 55,
  h: 40,
};
/* where the power box's parts can turn up (the owner's): T toolbox (an empty shelf, the top, front or back of a car),
   G gas (a jerry can at a pump), F fuse (the storeroom, a pew), S switch (the restroom, a shelf, a car, a pew, a pump).
   x, y: where it lies; z: how high over the ground there (on a shelf, a car's roof, a pew) */
export const PART_SPOTS = [
  { x: 2550, y: 880, z: 150, can: "TS" }, // (the empty top shelf)
  { x: 1350, y: 1030, z: 0, can: "F" }, // (the storeroom)
  { x: 1350, y: 1430, z: 0, can: "S" }, // (the restroom)
  { x: 1850, y: 2300, z: 0, can: "GS" }, // (the west pump)
  { x: 2750, y: 2300, z: 0, can: "GS" }, // (the east pump)
  { x: 1260, y: 3200, z: 110, can: "TS" }, // (a car's roof)
  { x: 2560, y: 3050, z: 0, can: "TS" }, // (a car's front)
  { x: 3060, y: 2770, z: 0, can: "TS" }, // (a car's back)
  { x: 1950, y: 4100, z: 45, can: "FS" }, // (a pew)
  { x: 2650, y: 4980, z: 45, can: "FS" }, // (a pew)
];
/* where E buys gas at a pump: in front of each (l4ddpower.js) */
export const PUMP_E = [
  [1850, 2300],
  [2750, 2300],
];

const inR = (x, y, r) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export function inPoly(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x1, y1] = pts[i],
      [x2, y2] = pts[j];
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1)
      c = !c;
  }
  return c;
}
/* is (x, y) open ground (inside the forest line, or on the road)? */
export const inOpen = (x, y) =>
  (y >= ROAD.y0 && y < ROAD.y1 && x >= 0 && x < GS_W) ||
  inPoly(x, y, TOP) ||
  inPoly(x, y, BOT);
export const inDeep = (x, y) => inR(x, y, DEEP);
export const inShallow = (x, y) => inR(x, y, SHALLOW);
/* the ground's height: 0, but the road's bed, sloping down at its edges */
export function groundAt(x, y) {
  if (y < ROAD.y0 || y >= ROAD.y1) return 0;
  const t = Math.min(y - ROAD.y0, ROAD.y1 - y) / ROAD.ramp;
  return ROAD.low * smooth(t);
}
/* which building (x, y) is in: 1 the gas station, 2 the chapel, 0 outside (the walls' middle lines) */
export function buildingAt(x, y) {
  if (x > STATION.x0 && x < STATION.x1 && y > STATION.y0 && y < STATION.y1)
    return 1;
  if (x > CHAPEL.x0 && x < CHAPEL.x1 && y > CHAPEL.y0 && y < CHAPEL.y1)
    return 2;
  return 0;
}

/* ---------- the props ----------
   b: layout.js' builders, { add, wallX, wallY, T }; every prop here carries map "gs" (layout.js keeps them apart from
   the cabin's). z: the ground's height under each. In the plan's numbers: build() below passes them on at K */
function planBuild(b) {
  const { T } = b,
    M = { map: "gs" };
  const put = (kind, x, y, w, d, h, o = {}) =>
    b.add(kind, x, y, w, d, h, {
      z: groundAt(x + w / 2, y + d - 1),
      ...M,
      ...o,
    });
  const solid = (kind, r, h, o = {}) =>
    put(kind, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, h, { solid: true, ...o });
  /* a wall along a line with gaps [a, b] in it (each piece reaches T past its ends, so a gap is clear from a to b) */
  function line(axis, at, from, to, gaps, h, o = {}) {
    let cur = from;
    for (const [a, c] of [...gaps, [to + T, to + T]].sort(
      (p, q) => p[0] - q[0],
    )) {
      const x0 = cur === from ? from : cur + T,
        x1 = a === to + T ? to : a - T;
      if (x1 > x0)
        (axis === "x" ? b.wallX : b.wallY)(at, x0, x1, h, { ...M, ...o });
      cur = c;
    }
  }
  /* a building's south wall: whole from outside; from inside only a low line, so the room shows (as the cabin's) */
  function southWall(B, gaps, o = {}) {
    line("x", B.y1, B.x0, B.x1, gaps, B.wall, {
      side: "s",
      only: "out",
      key: B.y1 + T,
      ...o,
    });
    let cur = B.x0;
    for (const [a, c] of [...gaps, [B.x1 + T, 0]]) {
      const x0 = cur === B.x0 ? B.x0 : cur + T,
        x1 = a > B.x1 ? B.x1 : a - T;
      if (x1 > x0)
        put("stub", x0 - T, B.y1 - T, x1 - x0 + 2 * T, 2 * T, 14, {
          only: "in",
          z: 0,
          /* its west end smashed where a hole in the west wall runs up to the corner (the restroom's) */
          broken:
            cur === B.x0 &&
            WALK_HOLES.some(
              (o) => o.axis === "y" && o.at === B.x0 && o.b === B.y1,
            ),
        });
      cur = c;
    }
  }
  const gapsOn = (axis, at) =>
    [...WALK_HOLES, ...BOARDED]
      .filter((o) => o.axis === axis && o.at === at)
      .map((o) => [o.a, o.b]);
  /* the gas station: its four walls with their holes, and the storeroom and the restroom on its west side */
  const S = STATION;
  line("x", S.y0, S.x0, S.x1, gapsOn("x", S.y0), S.wall, { side: "n" });
  southWall(S, gapsOn("x", S.y1), { glass: GLASS });
  line("y", S.x0, S.y0, S.y1, gapsOn("y", S.x0), S.wall);
  line("y", S.x1, S.y0, S.y1, [], S.wall);
  line(
    "y",
    INNER_DOORS[0].at,
    S.y0,
    S.y1,
    INNER_DOORS.map((d) => [d.a, d.b]),
    S.wall,
  ); // (the storeroom's door and the restroom's, onto the aisles. As tall as the outside walls, so its top meets the north
  // wall's at the corner instead of stopping short down its face: the owner's, Nov 17 05:46Z)
  line("x", 1150, S.x0, 1600, [], S.wall); // (the storeroom | the restroom)
  for (const y of [850, 1130, 1410])
    put("shelf", 1750, y, 1000, 60, 150, {
      solid: true,
      empty: y === 850,
    }); // (the top one is empty)
  put("counter", 2950, 700, 400, 110, 75, { solid: true });
  put("counter", 3250, 810, 100, 340, 75, { solid: true });
  /* the restroom: the cabin's bathroom without its tub (the owner's, Nov 17 05:46Z): the toilet, then the sink with its
     mirror over it, both against its top wall (the storeroom's, y = 1150), at the cabin's sizes, facing the same way and
     as far apart */
  const onWall = (kind, cx, wy, w, d, h, o = {}) =>
    put(kind, cx - w / 2, wy + (T * K + d) / K - d, w, d, h, o); // (own size: its back on the wall's face)
  onWall("toilet", 1250, 1150, 80, 70, 44, { solid: true });
  onWall("sink", 1405, 1150, 80, 60, 75, { solid: true });
  /* boarded holes and walk-through holes: the wall's drawing over the gap with the hole smashed through it (drawn only;
     nothing solid). In a south wall the same two ways as the wall itself: from outside all of it, the hole up to under
     the sign's band; from inside its low line, broken (the cabin's south wall's holes). In the north wall all of it,
     from both sides, see-through over a duck in the hole */
  for (const o of [...WALK_HOLES, ...BOARDED])
    if (o.axis === "x" && o.at === S.y1) {
      put("hole", o.a - T, o.at - T, o.b - o.a + 2 * T, 2 * T, 14, {
        z: 0,
        hole: o,
        low: true,
        only: "in",
      });
      put("hole", o.a - T, o.at - T, o.b - o.a + 2 * T, 2 * T, S.wall, {
        z: 0,
        hole: o,
        only: "out",
        glass: GLASS,
        key: S.y1 + T,
      });
    } else if (o.axis === "x")
      put("hole", o.a - T, o.at - T, o.b - o.a + 2 * T, 2 * T, S.wall, {
        z: 0,
        hole: o,
        fade: true,
      });
    else {
      put("hole", o.at - T, o.a - T, 2 * T, o.b - o.a + 2 * T, INNER, {
        z: 0,
        hole: o,
        boarded: !!o.out,
        key: o.b + T,
      });
      /* a walk-through hole in a north-south wall: the wall's rubble on the floor both sides, so it's found from
         inside and from outside, exactly as long as the way through it (walkSpan: the owner's, Nov 19 22:42Z). From
         outside the roof's corner is broken off over it (ROOF_HOLES), so it's seen through that (no breach drawn over
         the roof's edge any more: the owner's, Nov 19 22:41Z, "remove that") */
      if (!o.out) {
        const [ya, yb] = walkSpan(o, T);
        put("rubble", o.at - 180, ya, 360, yb - ya, 0, {
          z: 0,
          hole: o,
        });
      }
    }
  /* outside the gas station: the canopy over the pumps (a roof only), the pumps, the generator and the power box, the car
   with its hood up */
  put(
    "canopy",
    CANOPY.x0,
    CANOPY.y0,
    CANOPY.x1 - CANOPY.x0,
    CANOPY.y1 - CANOPY.y0,
    0,
    {
      z: CANOPY.z,
      key: CANOPY.y1,
    },
  );
  /* the ladder leaning on the canopy's left side: its feet out on the ground, up to the canopy's edge and its hoops over
     onto the roof (its own picture, stationart.js leanLadderSVG) */
  put(
    "leanladder",
    PUMP_LADDER.at - PUMP_LEAN - 6,
    PUMP_LADDER.y0,
    PUMP_LEAN + 40,
    PUMP_LADDER.y1 - PUMP_LADDER.y0,
    CANOPY.z + 50,
    { zt: CANOPY.z, hoopKey: CANOPY.y1 + 2 },
  );
  for (const p of PUMPS) solid("pump", p, 140);
  solid(
    "generator",
    { x0: GEN.x0, y0: GEN.y0 + 20, x1: GEN.x1 - 60, y1: GEN.y1 - 20 },
    100,
  );
  put("l4power", POWER_SPOT.x - 34, POWER_SPOT.y - 14, 68, 28, 120, {
    solid: true,
  });
  solid("car", HOOD, 110, {
    hood: true,
    smash: "side",
    light: {
      x: HOOD.spot.x + 40,
      y: HOOD.spot.y,
      r: 300,
      c: "#ffb24a",
      k: 0.45,
      flick: 0.6,
    },
  });
  CARS.forEach((c, i) => solid("car", c, 110, CAR_LOOKS[i]));
  /* the fallen tree: a row of low blocks along it (a jump clears them; zombies climb over: zx) */
  {
    const F = FALLEN,
      len = Math.hypot(F.x1 - F.x0, F.y1 - F.y0),
      n = Math.ceil(len / 40);
    put(
      "fallen",
      Math.min(F.x0, F.x1) - F.half,
      Math.min(F.y0, F.y1) - F.half,
      Math.abs(F.x1 - F.x0) + 2 * F.half,
      Math.abs(F.y1 - F.y0) + 2 * F.half,
      F.h,
      {
        fallen: F,
        key: (F.y0 + F.y1) / 2,
      },
    );
    for (let k = 0; k <= n; k++) {
      const x = F.x0 + ((F.x1 - F.x0) * k) / n,
        y = F.y0 + ((F.y1 - F.y0) * k) / n,
        r = F.half * 0.8;
      put("fallenpart", x - r, y - r, 2 * r, 2 * r, F.h, {
        solid: true,
        zx: true,
        layer: "none",
        top: groundAt(x, y) + F.h,
      });
    }
  }
  /* the fences across the road's ends, in pieces of 200 at most, each on the ground under it */
  for (const f of FENCES)
    for (let y = f.y0; y < f.y1; y += 200) {
      const e = Math.min(f.y1, y + 200);
      put("fence", f.x - 6, y, 12, e - y, FENCE_H, {
        solid: true,
        z: Math.min(groundAt(f.x, y), groundAt(f.x, e - 1)),
        key: e,
      });
    }
  /* the rest of the fence round the map: west and east (but where the road's fences are), then the north and south
     sides, seen face on (fencex) */
  for (const [x, f] of [
    [RIM.x0, FENCES[0]],
    [RIM.x1, FENCES[1]],
  ])
    for (const [a, c] of [
      [RIM.y0, f.y0],
      [f.y1, RIM.y1],
    ])
      for (let y = a; y < c; y += 200) {
        const e = Math.min(c, y + 200);
        put("fence", x - 6, y, 12, e - y, FENCE_H, { solid: true, key: e });
      }
  for (const y of [RIM.y0, RIM.y1])
    for (let x = RIM.x0; x < RIM.x1; x += 400) {
      const e = Math.min(RIM.x1, x + 400);
      put("fencex", x, y - 6, e - x, 12, FENCE_H, { solid: true, key: y + 6 });
    }
  /* the road on out past the map's edges, a fence along its top on either side, as far as the camera ever shows (the
     owner's, Nov 17 12:28Z: the fence on either side of the road; nobody gets out there, so they're only drawn) */
  for (const y of [ROAD.y0, ROAD.y1])
    for (const [a, c] of [
      [-OUT_ROAD, RIM.x0],
      [RIM.x1, GS_W + OUT_ROAD],
    ])
      put("fencex", a, y - 6, c - a, 12, FENCE_H, { key: y + 6 });
  /* the chapel: its walls (the wide entrance in the north wall, boarded windows down both sides), the tower, the altar
     with the Angel machine on it, the Priest beside it, and the pews: two rows down each side of the aisle, a few broken
     in half or missing (the owner's plan) */
  const C = CHAPEL;
  line("x", C.y0, C.x0, C.x1, [[CHAPEL_DOOR.a, CHAPEL_DOOR.b]], C.wall, {
    side: "n",
  });
  /* its entrance, the same size, smashed through the wall like the gas station's north holes (the owner's, Nov 19
     19:58Z: "make the hole on the church be like a destroyed hole as well. It's still the same size, but it's destroyed
     to indicate destruction") */
  put(
    "hole",
    CHAPEL_DOOR.a - T,
    C.y0 - T,
    CHAPEL_DOOR.b - CHAPEL_DOOR.a + 2 * T,
    2 * T,
    C.wall,
    {
      z: 0,
      hole: {
        id: "ch-door",
        axis: "x",
        at: C.y0,
        a: CHAPEL_DOOR.a,
        b: CHAPEL_DOOR.b,
      },
      fade: true,
    },
  );
  southWall(C, []);
  /* the ladder up the gas station's back wall, outside it: drawn behind the wall (the roof's edge hides all but its
     hoops, the roof goes see-through over a duck climbing it); up to the roof and its hoops over the edge */
  put(
    "ladder",
    LADDER.x0 - 20,
    LADDER.at - T - 10,
    LADDER.x1 - LADDER.x0 + 40,
    10,
    S.wall + 46,
    { only: "out" },
  );
  /* the roofs, seen from outside (inside, they go, and the outside goes dark: world.js) */
  for (const B of [S, C])
    put("gsroof", B.x0 - 30, B.y0 - 30, B.x1 - B.x0 + 60, B.y1 - B.y0 + 60, 0, {
      z: B.wall,
      only: "out",
      fade: true,
      soldier:
        B === S ? [SOLDIER.x - (B.x0 - 30), SOLDIER.y - (B.y0 - 30)] : null, // (on the roof's own drawing: it goes see-through with it)
      holes:
        B === S
          ? ROOF_HOLES.map((o) => [
              o.x0 - (B.x0 - 30),
              o.y0 - (B.y0 - 30),
              o.x1 - o.x0,
              o.y1 - o.y0,
              ...(o.corner ? [o.corner] : []),
            ])
          : null, // (the same, the holes broken through it)
      key: B.y1 + 2 * T, // (in front of the south wall's top: the roof's edge (the sign's red band) covers it, no grey slab over the red: the owner's, Nov 17 05:46Z)
      box: {
        l: B.x0 - 30,
        t: B.y0 - 30 - B.wall,
        w: B.x1 - B.x0 + 60,
        h: B.y1 - B.y0 + 60 + B.wall,
      },
      bldg: B,
    });
  line("y", C.x0, C.y0, C.y1, gapsOn("y", C.x0), C.wall);
  line("y", C.x1, C.y0, C.y1, gapsOn("y", C.x1), C.wall);
  solid("tower", TOWER, TOWER.h);
  /* no altar (the owner's, Nov 17 05:46Z: the raised white platform read as a coffin); the Angel machine stands on the
     floor against the south wall, and that wall turns see-through while it hides a quarter of it (keep: world.js) */
  put("l4angel", ANGEL.x - 65, ANGEL.y - 40, 130, 53, 140, {
    z: 0,
    keep: true,
    solid: true,
    fade: true,
  }); // (solid, as big as its drawing's base: nobody walks through it or into it, the owner's, Nov 17 11:07Z; see-through
  // like the walls while it hides a duck or a zombie behind it, Nov 17 12:29Z)
  put("priest", PRIEST.x - 30, PRIEST.y - 20, 60, 40, 90, {});
  put("corpse", JAIME_BODY.x - 70, JAIME_BODY.y - 35, 140, 70, 16, {
    z: 0,
    who: "jaime",
  }); // (lying on the floor: nothing stops on him)
  put("corpse", TROOPER.x - 70, TROOPER.y - 35, 140, 70, 16, {
    z: 0,
    who: "trooper",
  }); // (the trooper, inside the gas station by the counter: the same)
  const PEWS = {
    L: {
      a: 1700,
      b: 2200,
      k: ["full", "miss", "half", "full", "full", "half"],
      cut: [200, 310, 15],
    },
    R: {
      a: 2400,
      b: 2900,
      k: ["half", "full", "full", "miss", "half", "full"],
      cut: [190, 300, -10],
    },
  };
  for (let i = 0; i < 6; i++) {
    const y = 4050 + 220 * i;
    for (const P of Object.values(PEWS)) {
      const k = P.k[i];
      if (k === "full") put("pew", P.a, y, P.b - P.a, 80, 45, { solid: true });
      if (k === "half") {
        put("pew", P.a, y, P.cut[0], 80, 45, { solid: true, broken: "e" });
        put("pew", P.a + P.cut[1], y + P.cut[2], P.b - P.a - P.cut[1], 80, 45, {
          solid: true,
          broken: "w",
        });
      }
    }
  }
  /* the electric lights, dark till the power comes on (l4ddpower.js): white tubes in the gas station and under the
     canopy over the pumps, the shop's light spilling out through its glass front, warm lamps down the chapel and one
     over its door. Each is only its pool of light (nothing drawn: layer none) */
  const lamp = (x, y, z, only, r, c, k) =>
    put("gslamp", x, y, 1, 1, 0, {
      layer: "none",
      only,
      light: { x, y, z, r, c, k, el: true },
    });
  const TUBE = "#dfe8ff",
    WARM = "#ffd9a0";
  for (const x of [2000, 2600, 3200])
    for (const y of [850, 1420]) lamp(x, y, 170, "in", 420, TUBE, 0.5);
  lamp(1350, 850, 170, "in", 280, TUBE, 0.45); // (the storeroom)
  lamp(1350, 1450, 170, "in", 260, TUBE, 0.45); // (the restroom)
  for (const x of [2300, 3000]) lamp(x, S.y1 + 90, 0, "out", 380, TUBE, 0.35);
  for (const x of [1750, 2300, 2850])
    lamp(x, (CANOPY.y0 + CANOPY.y1) / 2, CANOPY.z - 10, "out", 480, TUBE, 0.6);
  lamp(2300, 3950, 200, "in", 420, WARM, 0.5);
  for (const y of [4500, 5100])
    for (const x of [1950, 2650]) lamp(x, y, 200, "in", 420, WARM, 0.5);
  lamp(2300, 5500, 200, "in", 400, WARM, 0.5);
  lamp(
    (CHAPEL_DOOR.a + CHAPEL_DOOR.b) / 2,
    C.y0 - 60,
    230,
    "out",
    320,
    WARM,
    0.45,
  );
  /* the forest */
  forest(put);
}

/* ---------- the forest ----------
   The owner's line is only an idea of how thick the trees grow (the owner, Nov 17 03:34Z): past it they stand close, a
   crown over every step, and inside it they thin out but never stop. Nothing stands on the line itself, ducks and
   zombies cross it either way, and only the trunks stop anyone (stationart.js draws each tree as its trunk, its crown
   over the ducks and its shade on the ground; shapes.js puts them, world.js turns a crown see-through over a duck).
   Seeded, so every device grows the same trees. */
const rng = (
  (s) => () =>
    (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
)(20261116);
/* the line's edges: TOP's and BOT's but their sides on the road (open) and TOP's west end (the fence is there), and the
   road's own edges east of them, where the forest comes down to it */
const EDGES = [
  ...[TOP, BOT].flatMap((P) =>
    P.slice(1)
      .map((b, i) => [P[i], b])
      .filter(([a, b]) => a[0] > 0 || b[0] > 0),
  ),
  [
    [3600, ROAD.y0],
    [GS_W, ROAD.y0],
  ],
  [
    [4250, ROAD.y1],
    [GS_W, ROAD.y1],
  ],
];
/* spots just inside the line, every 100 along it, where zombies come out of the trees (l4ddrules.js: the owner's, Nov 16
   23:23Z, half of them while nobody sees a zombie) */
export const LINE_SPOTS = EDGES.flatMap(([[ax, ay], [bx, by]]) => {
  const len = Math.hypot(bx - ax, by - ay),
    out = [];
  let nx = (by - ay) / len,
    ny = -(bx - ax) / len;
  if (!inOpen((ax + bx) / 2 + nx * 10, (ay + by) / 2 + ny * 10)) {
    nx = -nx;
    ny = -ny;
  } // (inward: the open side)
  for (let t = 50; t < len - 50; t += 100) {
    const x = ax + ((bx - ax) * t) / len + nx * 130,
      y = ay + ((by - ay) * t) / len + ny * 130;
    if (inOpen(x, y) && !(y >= ROAD.y0 && y < ROAD.y1)) out.push([x, y]);
  }
  return out;
});
/* the distance from (x, y) to the nearest edge of the line */
function toLine(x, y) {
  let best = Infinity;
  for (const [[ax, ay], [bx, by]] of EDGES) {
    const dx = bx - ax,
      dy = by - ay,
      t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
      );
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}
/* the open ground trees keep off: the buildings and round them, the road and its sides, under the canopy, the pumps'
   lanes, the cars, the generator, in front of the chapel's entrance */
const CLEAR = [
  [STATION.x0 - 110, STATION.y0 - 110, STATION.x1 + 110, STATION.y1 + 150],
  [CHAPEL.x0 - 110, CHAPEL.y0 - 220, TOWER.x1 + 110, CHAPEL.y1 + 110],
  [0, ROAD.y0 - 110, GS_W, ROAD.y1 + 110],
  [CANOPY.x0 - 110, CANOPY.y0 - 80, CANOPY.x1 + 110, CANOPY.y1 + 110],
  [1150, STATION.y1, 3450, ROAD.y0], // (the concrete in front of the gas station: dpground.js)
  [GEN.x0 - 110, GEN.y0 - 110, GEN.x1 + 110, GEN.y1 + 110],
  [HOOD.x0 - 180, HOOD.y0 - 110, HOOD.x1 + 110, HOOD.y1 + 110],
];
/* real sizes (world px, as the ducks: 64 across), so the numbers here are them over K. A trunk's foot is about a duck
   across (the owner's sketch) and stops ducks and zombies as far as it reaches; a crown is 4 to 5 ducks across */
const TRUNK = { x: 30 / K, y: 15 / K },
  /* how far apart two trees stand at least: past the line, just inside it, and further in. Half as many trees as the
     first forest (the owner's, Nov 17 05:46Z: sparser), and a duck or a zombie walks between any two trunks */
  APART = { out: 285 / K, near: 400 / K, far: 520 / K },
  /* how likely a spot grows a tree: past the line, inside it within NEAR of it, and further in */
  GROW = { out: 0.92, near: 0.55, far: 0.3 },
  NEAR = 260 / K;
/* the fallen tree's line: no tree stands on it */
const toFallen = (x, y) => {
  const { x0, y0, x1, y1 } = FALLEN,
    dx = x1 - x0,
    dy = y1 - y0,
    t = Math.max(
      0,
      Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)),
    );
  return Math.hypot(x - x0 - t * dx, y - y0 - t * dy);
};
function forest(put) {
  const tree = (cx, cy, big) =>
    put("tree", cx - 18, cy - 12, 36, 24, 320 * big, {
      z: groundAt(cx, cy),
      solid: true,
      big,
      block: [cx - TRUNK.x, cy - TRUNK.y, cx + TRUNK.x, cy + TRUNK.y],
    });
  /* every spot on a jittered grid, the forest's own way: past the line close together, inside it further apart the
     further in; a spot grows a tree if the dice say so and no tree stands within APART of it (a grid of buckets keeps
     that look quick) */
  const B = APART.far,
    bucket = new Map(),
    keyOf = (x, y) => Math.floor(x / B) * 1000 + Math.floor(y / B),
    near = (x, y, d) => {
      const bx = Math.floor(x / B),
        by = Math.floor(y / B);
      for (let i = bx - 1; i <= bx + 1; i++)
        for (let j = by - 1; j <= by + 1; j++)
          for (const [a, b] of bucket.get(i * 1000 + j) || [])
            if (Math.hypot(a - x, b - y) < d) return true;
      return false;
    };
  const STEP = 90 / K;
  for (let gy = STEP / 2; gy < GS_H; gy += STEP)
    for (let gx = STEP / 2; gx < GS_W; gx += STEP) {
      const x = gx + (rng() - 0.5) * STEP * 0.9,
        y = gy + (rng() - 0.5) * STEP * 0.9,
        roll = rng(),
        big = 0.85 + rng() * 0.3;
      if (x < 0 || x > GS_W || y < 0 || y > GS_H) continue;
      if (y >= ROAD.y0 - 60 && y < ROAD.y1 + 60) continue; // (the road runs on through the trees)
      if (toFallen(x, y) < 160) continue;
      const open = inOpen(x, y);
      if (
        open &&
        (CLEAR.some((r) => inR(x, y, r)) ||
          [...CARS, ...PUMPS].some((r) =>
            inR(x, y, [r.x0 - 120, r.y0 - 120, r.x1 + 120, r.y1 + 120]),
          ))
      )
        continue;
      const zone = !open ? "out" : toLine(x, y) < NEAR ? "near" : "far";
      if (roll > GROW[zone] || near(x, y, APART[zone])) continue;
      const k = keyOf(x, y);
      if (!bucket.has(k)) bucket.set(k, []);
      bucket.get(k).push([x, y]);
      tree(x, y, big);
    }
}

/* ---------- the map at K of the plan ----------
   The props are made once in the plan's numbers (planBuild, its wall thickness T / K so it comes out as T), then every
   number here is turned to K of itself: the exported places and sizes in place (so whatever holds one of them, a prop's
   hole or building, sees the new one), and each prop's place, size, height and options as build() hands it on. The
   strength of a light (k) and its flicker stay. The cabin's own things keep their size, only their place moves */
const KEEP = new Set(["k", "flick", "out", "big"]),
  OWN_SIZE = new Set(["priest", "l4angel", "l4power", "toilet", "sink"]),
  done = new Set();
function scaled(o) {
  if (!o || typeof o !== "object" || done.has(o)) return o;
  done.add(o);
  for (const a of Object.keys(o)) {
    const v = o[a];
    if (typeof v === "number") {
      if (!KEEP.has(a)) o[a] = v * K;
    } else scaled(v);
  }
  return o;
}
const atK = (v, a) =>
  typeof v === "number"
    ? KEEP.has(a)
      ? v
      : v * K
    : !v || typeof v !== "object" || done.has(v)
      ? v
      : Array.isArray(v)
        ? v.map((x) => atK(x))
        : Object.fromEntries(Object.entries(v).map(([q, x]) => [q, atK(x, q)]));
const CALLS = [];
planBuild({
  add: (...a) => CALLS.push(["add", ...a]),
  wallX: (...a) => CALLS.push(["wallX", ...a]),
  wallY: (...a) => CALLS.push(["wallY", ...a]),
  T: 12 / K,
});
for (const o of [
  ROAD,
  DEEP,
  SHALLOW,
  TOP,
  BOT,
  STATION,
  CHAPEL,
  TOWER,
  FENCES,
  RIM,
])
  scaled(o);
for (const o of [
  WALK_HOLES,
  BOARDED,
  GLASS,
  CHAPEL_DOOR,
  INNER_DOORS,
  LADDER,
  PUMP_LADDER,
  ROOF_HOLES,
  GEN,
  POWER_SPOT,
  HOOD,
])
  scaled(o);
for (const o of [PRIEST, ANGEL, START, CARS, PUMPS, CANOPY, FALLEN]) scaled(o);
for (const o of [JAIME_BODY, SOLDIER, FLARE, TROOPER]) scaled(o);
for (const o of [PART_SPOTS, PUMP_E, LINE_SPOTS]) scaled(o);
GS_W *= K;
GS_H *= K;
FENCE_H *= K;
SHORE *= K;
/* Part B: what a duck stands on over the ground (layout.js floorAt), at K already. The two roofs at their walls' height,
   as wide as their drawing (30 past the walls), the gas station's with its two holes (a duck falls through them), and
   the canopy over the pumps. key: the depth its top is drawn at (a duck on it is drawn just in front of it); bldg: the
   building it covers (a duck on it is outside, the building under it out of sight) */
const OVER = 30 * K;
export const DECKS = [
  ...[STATION, CHAPEL].map((B, i) => ({
    kind: "roof",
    x0: B.x0 - OVER,
    y0: B.y0 - OVER,
    x1: B.x1 + OVER,
    y1: B.y1 + OVER,
    h: B.wall,
    key: B.y1 + 24, // (the roof's own: planBuild's B.y1 + 2T)
    holes: B === STATION ? ROOF_HOLES : [],
    bldg: i + 1,
  })),
  {
    kind: "canopy",
    x0: CANOPY.x0,
    y0: CANOPY.y0,
    x1: CANOPY.x1,
    y1: CANOPY.y1,
    h: CANOPY.z,
    key: CANOPY.y1,
    holes: [],
    bldg: 0,
  },
];
export function build(b) {
  for (const [f, ...a] of CALLS) {
    if (f !== "add") {
      const [at, a0, a1, h, o] = a;
      b[f](at * K, a0 * K, a1 * K, h * K, atK(o || {}));
      continue;
    }
    const [kind, x, y, w, d, h, o] = a;
    if (OWN_SIZE.has(kind))
      b.add(kind, (x + w / 2) * K - w / 2, (y + d) * K - d, w, d, h, atK(o));
    else b.add(kind, x * K, y * K, w * K, d * K, h * K, atK(o));
  }
}
