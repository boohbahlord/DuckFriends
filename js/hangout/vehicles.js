/* ---------- what a duck stands on on top of a vehicle: Downpour's cars and Duck Cabin's jeep ----------
   The owner's, Nov 21 08:46Z: "make players and zombies able to walk onto the front hood of this red car and then able
   to get onto it's roof", "then we can make every car possible to jump on", "the jeep from cabin can be jumped onto the
   same". One shape per vehicle, the one its drawing is made from (stationart.js carSVG, art.js jeep), and the floor on
   it made from that same shape, so a duck stands exactly on what's drawn (walkable = what looks open). Why its own file:
   both maps' vehicles share it, it is data and two small makers, and layout.js and stationmap.js are at their size
   limit */

/* the shape of a car's top, in a 420 by 200 car's plan numbers, h tall (stationart.js carSVG draws it, carDeck below
   walks it): its body's top at the waist from end to end (side: how far in its sides are), the glass rising from the
   waist (glass, back to front) to the roof (roof, back to front; inset: how far in from the sides; below: how far under
   the car's height) */
export const CAR_TOP = {
  h: 92, // (its roof half an elevation up, the gas station's roof one: the owner's, Nov 21 08:46Z, "half the height of an elevation")
  side: 16,
  waist: 62,
  glass: [80, 345],
  roof: [130, 285],
  inset: 14,
  below: 2,
};
/* every car's top (the owner's, Nov 21 08:46Z: "make players and zombies able to walk onto the front hood of this red
   car and then able to get onto it's roof", "then we can make every car possible to jump on"): a floor over the car's
   box at the height of what's drawn there (CAR_TOP), the hood and the trunk at the waist, up the glass to the roof, so a
   duck jumps onto the hood and walks up the windshield onto the roof (a slope: hAt). solid: it is the car all the way
   down, so nobody walks into its side or its glass from lower down (layout.js standable); zombies climb its sides
   (zombieroofs.js). c: its box (world px), east: which way it faces, z: the ground under it, K: the plan's scale */
const r01 = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a)));
export function carDeck(c, east, z, K, hood = false) {
  const T = CAR_TOP,
    w = (c.x1 - c.x0) / K,
    d = (c.y1 - c.y0) / K,
    up = T.h - T.below - T.waist;
  return {
    kind: "car",
    x0: c.x0,
    y0: c.y0,
    x1: c.x1,
    y1: c.y1,
    h: z + (T.h - T.below) * K, // (its highest: the roof)
    hAt: (x, y) => {
      const u = (x - c.x0) / K,
        lx = east ? u : w - u,
        ly = (y - c.y0) / K,
        f = Math.min(
          r01(T.glass[0], T.roof[0], lx),
          r01(T.glass[1], T.roof[1], lx),
          r01(T.side + 2, T.side + T.inset, ly),
          r01(d - T.side - 2, d - T.side - T.inset, ly),
        );
      return z + (T.waist + up * f) * K;
    },
    key: c.y1,
    holes: [],
    bldg: 0,
    solid: true,
    roof: {
      x0: c.x0 + (east ? T.roof[0] : w - T.roof[1]) * K,
      x1: c.x0 + (east ? T.roof[1] : w - T.roof[0]) * K,
      y0: c.y0 + (T.side + T.inset) * K,
      y1: c.y1 - (T.side + T.inset) * K,
    }, // (its flat top, where a zombie jumps from: zombieroofs.js leapOf)
    hood, // (the red car's: zombies jump from its roof onto the pumps' roof)
  };
}
/* the red jeep's drawing (art.js jeep, shapes.js): its boxes [x0, x1, d0, d1, h0, h1] along x (back to front), back
   (d: north to south) and up (h), drawn s times as big, leaning kx to the right per unit back, its picture's left edge
   `left` from its box. A duck stands on the tops of the soft top (the windshield's frame with it), the hood and the tub
   (the owner's, Nov 21 08:46Z: "the jeep from cabin can be jumped onto the same" as a car) */
export const JEEP = {
  s: 1.1,
  kx: 0.62,
  ox: 22,
  DD: 100,
  left: -4,
  tub: [4, 150, 8, 92, 20, 62],
  soft: [10, 134, 10, 90, 62, 112],
  glass: [134, 141, 10, 90, 62, 110],
  hood: [141, 197, 14, 86, 30, 64],
};
/* where it is stood on, [x0, x1, d0, d1, top], the highest first */
const JEEP_TOPS = [
  [JEEP.soft[0], JEEP.glass[1], JEEP.soft[2], JEEP.soft[3], JEEP.soft[5]],
  [...JEEP.hood.slice(0, 4), JEEP.hood[5]],
  [...JEEP.tub.slice(0, 4), JEEP.tub[5]],
];
/* the jeep j (layout.js' prop)'s tops as one platform (layout.js PLATS): over the box its drawing covers, hAt(x, y) the
   height of the top at (x, y), or null off the jeep; top: its lowest */
export function jeepTops(j) {
  const J = JEEP,
    low = j.z + J.s * Math.min(...JEEP_TOPS.map((t) => t[4]));
  const X = (u, d) => j.x + J.left + J.s * (J.ox + u + J.kx * (J.DD - d)),
    Y = (d) => j.y + j.d + J.s * (d - J.DD),
    t = JEEP.tub; // (the widest: every top is over it)
  return {
    x0: X(t[0], t[3]),
    y0: Y(t[2]),
    x1: X(JEEP.hood[1], JEEP.hood[2]),
    y1: Y(t[3]),
    top: low,
    key: j.key,
    hAt: (x, y) => {
      const d = (y - j.y - j.d) / J.s + J.DD,
        u = (x - j.x - J.left) / J.s - J.ox - J.kx * (J.DD - d),
        t = JEEP_TOPS.find(
          (t) => u >= t[0] && u < t[1] && d >= t[2] && d < t[3],
        );
      return t ? j.z + J.s * t[4] : null;
    },
  };
}
