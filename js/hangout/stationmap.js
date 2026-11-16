/* ---------- Dead Ducks Arcade's second map: the gas station, the road and the chapel ----------
   The owner's map (Nov 16 23:15Z), night and rain in a swamp: the gas station in the north, a sunken two-lane road
   across the middle (flooded: deep at the west end, shallow over the rest), the chapel in the south, and forest all
   round, behind the owner's own forest line. Plain numbers and geometry, like layout.js; layout.js builds the props
   from build() below and switches to them in useMode (variant "l4gs"). Floor plan:
   /mnt/project-files/refs/zombie-map-plans-2026-11-16/plan3.py.

   World px as in layout.js: x across (0 west … 4600 east), y is depth (0 north … 6200 south). Heights: 0 is the grass
   and every floor; the road lies ROAD.low under it. */
export const GS_W = 4600,
  GS_H = 6200;
/* the road: y0 … y1, its middle line at mid; its bed `low` under the grass, sloping down over `ramp` at each side */
export const ROAD = { y0: 2750, y1: 3350, mid: 3050, low: -40, ramp: 90 };
/* the flood over the road: deep at the west end (no duck goes in; zombies wade it), shallow over the middle (ducks walk
   30% slower in it, the owner's) */
export const DEEP = [0, ROAD.y0, 1000, ROAD.y1],
  SHALLOW = [1000, ROAD.y0, 3500, ROAD.y1];
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
/* the fences across the road's two ends, with the holes the zombies come in by */
export const FENCES = [
  {
    x: 60,
    y0: 2560,
    y1: 3500,
    holes: [
      [2620, 2700],
      [2900, 3000],
      [3200, 3290],
    ],
  },
  {
    x: 4540,
    y0: 2700,
    y1: 3420,
    holes: [
      [2800, 2890],
      [3130, 3230],
    ],
  },
];
/* holes anyone walks through (the owner's circles): the storeroom's back door, the north wall by the counter, the front
   door. axis "x": in an east-west wall at y = at, across a … b */
export const WALK_HOLES = [
  { id: "gs-back", axis: "x", at: STATION.y0, a: 1300, b: 1460 },
  { id: "gs-north", axis: "x", at: STATION.y0, a: 2950, b: 3150 },
  { id: "gs-front", axis: "x", at: STATION.y1, a: 2510, b: 2690 },
];
/* the boarded holes: where zombies tear the boards down and climb in (ducks never get through one). out: the side the
   outside is on (n, s, e, w) */
export const BOARDED = [
  { id: "gs-win1", axis: "x", at: STATION.y1, a: 2020, b: 2180, out: "s" }, // (the big front windows: glass round each)
  { id: "gs-win2", axis: "x", at: STATION.y1, a: 2995, b: 3155, out: "s" },
  { id: "gs-rest", axis: "y", at: STATION.x0, a: 1370, b: 1530, out: "w" }, // (the restroom window)
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
/* where things stand. GEN: the generator and the power box, east of the gas station. HOOD: the car with its hood up
   (it does the fireplace's job, and glows until it's first used); spot: its open hood, where E uses it. PRIEST (he
   does Justin's Butler's job, by the altar). ANGEL: the Angel machine, on the altar. START: where everyone starts,
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
export const ALTAR = { x0: 1850, y0: 5480, x1: 2750, y1: 5700 };
export const ANGEL = { x: 2250, y: 5520 };
export const START = { x: 2600, y: 1600 };
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
export const CANOPY = { x0: 1400, y0: 1950, x1: 3200, y1: 2500, z: 260 };
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
   G gas (a jerry can at a pump), F fuse (the storeroom, a pew), S switch (the restroom, a shelf, a car, a pew, a pump) */
export const PART_SPOTS = [
  { x: 2550, y: 830, can: "TS" }, // (the empty top shelf)
  { x: 1350, y: 1030, can: "F" }, // (the storeroom)
  { x: 1350, y: 1430, can: "S" }, // (the restroom)
  { x: 1850, y: 2160, can: "GS" }, // (the west pump)
  { x: 2750, y: 2160, can: "GS" }, // (the east pump)
  { x: 1260, y: 3070, can: "TS" }, // (a car's roof)
  { x: 2560, y: 3060, can: "TS" }, // (a car's front)
  { x: 3060, y: 2780, can: "TS" }, // (a car's back)
  { x: 1950, y: 4030, can: "FS" }, // (a pew)
  { x: 2650, y: 4910, can: "FS" }, // (a pew)
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
   the cabin's). z: the ground's height under each. */
export function build(b) {
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
  const gapsOn = (axis, at) =>
    [...WALK_HOLES, ...BOARDED]
      .filter((o) => o.axis === axis && o.at === at)
      .map((o) => [o.a, o.b]);
  /* the gas station: its four walls with their holes, and the storeroom and the restroom on its west side */
  const S = STATION;
  line("x", S.y0, S.x0, S.x1, gapsOn("x", S.y0), S.wall, { side: "n" });
  line("x", S.y1, S.x0, S.x1, gapsOn("x", S.y1), S.wall, {
    side: "s",
    glass: GLASS,
  });
  line("y", S.x0, S.y0, S.y1, gapsOn("y", S.x0), S.wall);
  line("y", S.x1, S.y0, S.y1, [], S.wall);
  line(
    "y",
    1600,
    S.y0,
    S.y1,
    [
      [950, 1110],
      [1400, 1560],
    ],
    INNER,
  ); // (the storeroom's door and the restroom's, onto the aisles)
  line("x", 1150, S.x0, 1600, [], INNER); // (the storeroom | the restroom)
  for (const y of [850, 1130, 1410])
    put("shelf", 1750, y, 1000, 60, 150, {
      solid: true,
      empty: y === 850,
    }); // (the top one is empty)
  put("counter", 2950, 700, 400, 110, 75, { solid: true });
  put("counter", 3250, 810, 100, 340, 75, { solid: true });
  put("toilet", 1195, 1550, 80, 70, 44, { solid: true }); // (the cabin's toilet)
  /* boarded holes and walk-through holes: their broken edges (drawn only; nothing solid) */
  for (const o of [...WALK_HOLES, ...BOARDED])
    if (o.axis === "x")
      put("hole", o.a - T, o.at - T, o.b - o.a + 2 * T, 2 * T, 14, {
        z: 0,
        hole: o,
        boarded: !!o.out,
      });
    else
      put("hole", o.at - T, o.a - T, 2 * T, o.b - o.a + 2 * T, INNER, {
        z: 0,
        hole: o,
        boarded: !!o.out,
        key: o.b + T,
      });
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
    light: {
      x: HOOD.spot.x + 40,
      y: HOOD.spot.y,
      r: 300,
      c: "#ffb24a",
      k: 0.45,
      flick: 0.6,
    },
  });
  for (const c of CARS) solid("car", c, 110);
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
  /* the fences across the road's ends, holes in them */
  for (const f of FENCES) {
    let cur = f.y0;
    for (const [a, c] of [...f.holes, [f.y1, f.y1]]) {
      for (let y = cur; y < a; y += 200) {
        const e = Math.min(a, y + 200);
        put("fence", f.x - 6, y, 12, e - y, 90, {
          solid: true,
          z: Math.min(groundAt(f.x, y), groundAt(f.x, e - 1)),
          key: e,
        });
      }
      cur = c;
    }
  }
  /* the chapel: its walls (the wide entrance in the north wall, boarded windows down both sides), the tower, the altar
     with the Angel machine on it, the Priest beside it, and the pews: two rows down each side of the aisle, a few broken
     in half or missing (the owner's plan) */
  const C = CHAPEL;
  line("x", C.y0, C.x0, C.x1, [[CHAPEL_DOOR.a, CHAPEL_DOOR.b]], C.wall, {
    side: "n",
  });
  line("x", C.y1, C.x0, C.x1, [], C.wall, { side: "s" });
  line("y", C.x0, C.y0, C.y1, gapsOn("y", C.x0), C.wall);
  line("y", C.x1, C.y0, C.y1, gapsOn("y", C.x1), C.wall);
  solid("tower", TOWER, TOWER.h);
  solid("altar", ALTAR, 90);
  put("l4angel", ANGEL.x - 50, ANGEL.y - 13, 100, 26, 140, { z: 90 });
  put("priest", PRIEST.x - 30, PRIEST.y - 20, 60, 40, 90, {});
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
  /* the forest */
  forest(put);
}

/* ---------- the forest ----------
   Outside the owner's line: a close row of thick trunks just past it (they're what stops a duck: no gap a duck fits
   through, never an invisible wall), and forest all the way to the world's edge. Inside it (the owner, 23:23Z): trees
   still grow past the line, thinning out the further in, yet never too sparse. Seeded, so every device grows the same
   trees. */
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
  [GEN.x0 - 110, GEN.y0 - 110, GEN.x1 + 110, GEN.y1 + 110],
  [HOOD.x0 - 180, HOOD.y0 - 110, HOOD.x1 + 110, HOOD.y1 + 110],
];
function forest(put) {
  const tree = (cx, cy, s, block) => {
    const w = 230 * s,
      h = 320 * s,
      z = groundAt(cx, cy);
    put("tree", cx - 18, cy - 12, 36, 24, h, {
      z,
      solid: true,
      fade: true,
      size: s,
      block,
      box: { l: cx - w / 2, t: cy - z - h, w, h: h + 16 },
    });
  };
  /* the row along the line: thick trunks (56 to 70 across) 80 apart, 35 outside it. Two trunks' blocks, grown by a duck's
     feet (16 all round), always overlap, so nothing gets between */
  for (const [[ax, ay], [bx, by]] of EDGES) {
    const len = Math.hypot(bx - ax, by - ay),
      n = Math.ceil(len / 80);
    // (the outward normal: the side that isn't open)
    let nx = (by - ay) / len,
      ny = -(bx - ax) / len;
    const mx = (ax + bx) / 2,
      my = (ay + by) / 2;
    if (inOpen(mx + nx * 10, my + ny * 10)) {
      nx = -nx;
      ny = -ny;
    }
    for (let k = 0; k < n; k++) {
      const t = (k + rng() * 0.15) / n,
        off = 35 + (rng() - 0.5) * 16,
        x = ax + (bx - ax) * t + nx * off,
        y = ay + (by - ay) * t + ny * off;
      if (y >= ROAD.y0 - 20 && y < ROAD.y1 + 20 && x < 3500) continue; // (the road runs on through the trees)
      const r = 28 + rng() * 7;
      tree(x, y, 0.9 + rng() * 0.35, [x - r, y - r, x + r, y + r]);
    }
  }
  /* the forest beyond it, to the world's edge */
  for (let gx = 80; gx < GS_W; gx += 230)
    for (let gy = 80; gy < GS_H; gy += 230) {
      const x = gx + (rng() - 0.5) * 140,
        y = gy + (rng() - 0.5) * 140,
        s = 0.85 + rng() * 0.45;
      if (inOpen(x, y) || toLine(x, y) < 110) continue;
      if (y >= ROAD.y0 - 60 && y < ROAD.y1 + 60) continue;
      tree(x, y, s);
    }
  /* inside the line: thinning out the further in (the chance a spot grows a tree falls from 0.8 by the line to 0.45 far
     inside), every tree at least 210 from the next */
  const inside = [];
  for (let gx = 100; gx < GS_W; gx += 160)
    for (let gy = 100; gy < GS_H; gy += 160) {
      const x = gx + (rng() - 0.5) * 120,
        y = gy + (rng() - 0.5) * 120,
        roll = rng(),
        s = 0.8 + rng() * 0.4;
      if (
        !inOpen(x, y) ||
        CLEAR.some((r) => inR(x, y, r)) ||
        [...CARS, ...PUMPS].some((r) =>
          inR(x, y, [r.x0 - 120, r.y0 - 120, r.x1 + 120, r.y1 + 120]),
        )
      )
        continue;
      const d = toLine(x, y);
      if (d < 100) continue; // (not crowding the row of trunks)
      const want = d < 350 ? 0.8 : d < 700 ? 0.6 : 0.45;
      if (roll > want) continue;
      if (inside.some(([a, c]) => Math.hypot(a - x, c - y) < 210)) continue;
      inside.push([x, y]);
      tree(x, y, s);
    }
}
