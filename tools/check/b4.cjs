/* I want heights in sight, shots and swings checked (B4; the owner's, Nov 21 16:17Z: "jumping changes your projectiles
   and melee's attack range ... changes your projectiles, even sight"; 15:56Z: "a melee weapon that's swung can only hit
   things that are within its height of 0 or 0.6 elevation"; 14:52Z: "the elevation of entities change as they go up a
   ladder in the same way it would a slope, and the way in which you shoot them based on their height is then inputted
   into the trigonometry"):
   1. a duck in a jump is at its arc on the room's clock (heights.js zOf with now), at its feet without it or once down;
   2. a swing reaches only within the swinger's height (heights.js overlapH): a zombie up on the gas station's roof is out
      of reach of a duck on the ground, one on a car's top within it;
   3. a zombie up the canopy's ladder rises as up a slope, and a shot from a duck on the canopy reaches it once its head
      is over the canopy's edge (high up the ladder) and not while it is low (the roof's edge between).
   Run: node tools/check/run.mjs b4 */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async () => {
    const L = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      HT = await import("./js/heights.js"),
      J = await import("./js/jump.js"),
      ZR = await import("./js/zombieroofs.js");
    await import("./js/zombies.js");
    L.useMode("l4dd", "downpour");
    const t0 = 1e6,
      duck = { x: 0.5, y: 0.5, z: 10, b: 10, j: t0 },
      half = (J.JUMP.T * 1000) / 2,
      C = ZR.canopyDeck(),
      ci = GS.DECKS.indexOf(C),
      ly = (GS.PUMP_LADDER.y0 + GS.PUMP_LADDER.y1) / 2,
      climber = (x) => ({ st: 6, k: ci, x, y: ly, l: [1, 1] }),
      sh = { hz: C.h },
      [sx, sy] = [C.x0 + 60, ly],
      shot = (x) => {
        const z = climber(x),
          tz = HT.zOf(z, "zombie");
        return [Math.round(tz), HT.hOk(sh, tz, z.x, z.y, sx, sy)];
      };
    return {
      apex: HT.zOf(duck, "body", t0 + half),
      want: 10 + J.JUMP.H * L.DUCK,
      noNow: HT.zOf(duck),
      down: HT.zOf(duck, "body", t0 + 3 * half),
      roof: HT.overlapH(0, L.DUCK, GS.DECKS[0].h),
      car: HT.overlapH(0, L.DUCK, 41),
      low: shot(C.x0 - ZR.CL.out),
      mid: shot(C.x0 - ZR.CL.out / 2),
      high: shot(C.x0 - 2),
    };
  });
  if (Math.abs(got.apex - got.want) > 0.5)
    C.fail(`a jump's apex: ${got.apex}, not ${got.want}`);
  if (got.noNow !== 10 || got.down !== 10)
    C.fail(`a duck's feet out of its jump: ${got.noNow}, ${got.down}`);
  if (got.roof)
    C.fail("a swing from the ground reaches the gas station's roof");
  if (!got.car) C.fail("a swing from the ground misses a car's top");
  if (!(got.low[0] < got.mid[0] && got.mid[0] < got.high[0]))
    C.fail("a ladder climber doesn't rise: " + JSON.stringify(got));
  if (got.low[1] || !got.high[1])
    C.fail(
      "a shot at a ladder climber from the canopy: low " +
        got.low +
        ", high " +
        got.high,
    );
  C.noErrors(errs);
  await b.close();
})();
