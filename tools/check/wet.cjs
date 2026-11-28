/* I want water to slow every walker the same (the owner's, Nov 21 17:48Z: "water slows down entities equally"; B2):
   - layout.js wetK, the one rule, by the water's depth over the bed (the owner's, Nov 22 16:06Z: "if it's really,
     really shallow, then it doesn't slow down your walking ... it slows you down once it's high up enough. And if it's
     even more then eventually you have to swim"): the water's edge up the bank not slowed but still water (its looks
     and sounds), the flat road waded (WET.WADE), the same depth all along (the owner's, Nov 28 04:58Z: the deep west
     end went), the lowest the map's 0; dry ground and anyone over the water (on a car's top) not slowed;
   - a walker stepped by zombies.js chaseStep (gunmen, allies, Sandbox brains) goes WET.WADE as far in the shallow
     flood as on the dry road bank.
   Run: node tools/check/run.mjs wet */
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
      Z = await import("./js/zombies.js"),
      { WET } = await import("./js/gamedefaults.js");
    L.useMode("l4dd", "downpour");
    const F = GS.FLOOD,
      y = (GS.ROAD.y0 + GS.ROAD.y1) / 2,
      car = GS.DECKS.find((d) => d.kind === "car" && GS.inShallow(d.x0, d.y0)),
      edge = GS.ROAD.y0 + GS.SHORE + 2, // (just in from the waterline: very shallow)
      walk = (x, yy) => {
        const z = { i: 0, x, y: yy };
        Z.chaseStep(z, null, [x + 400, yy], 20);
        return z.x - x;
      };
    return {
      WET,
      shallow: L.wetK(2400, y),
      dry: L.wetK(2400, GS.ROAD.y0 - 200),
      onCar: L.wetK(car.x0 + 10, car.y0 + 10, car.h),
      edge: L.wetK(2400, edge),
      edgeWet: GS.inShallow(2400, edge),
      bed: [200, 600, 900, 1200, 2400].map((x) => GS.groundAt(x, y)),
      lowest:
        F.floor === Math.min(...[0, 300, 600].map((x) => GS.groundAt(x, y))),
      inWater: walk(2400, y),
      ashore: walk(2400, GS.ROAD.y0 - 200),
    };
  });
  const { WET } = got;
  const want = { shallow: WET.WADE, dry: 1, onCar: 1, edge: 1 };
  if (!got.edgeWet) C.fail("the water's edge isn't water");
  if (!got.lowest) C.fail("the flood's floor isn't its bed's lowest");
  for (let i = 1; i < got.bed.length; i++)
    if (got.bed[i] !== got.bed[0])
      C.fail("the bed isn't the same depth all along: " + got.bed);
  for (const k in want)
    if (Math.abs(got[k] - want[k]) > 1e-9)
      C.fail(`wetK ${k}: ${got[k]}, not ${want[k]}`);
  if (Math.abs(got.inWater - got.ashore * WET.WADE) > 0.5)
    C.fail(
      `a chaseStep walker went ${got.inWater} px in the shallow flood, ${got.ashore} ashore`,
    );
  C.noErrors(errs);
  await b.close();
})();
