/* I want water to slow every walker the same (the owner's, Nov 21 17:48Z: "water slows down entities equally"; B2):
   - layout.js wetK, the one rule: Downpour's shallow flood waded (WET.WADE), its deep end swum (WET.SWIM), dry ground
     and anyone over the water (on a car's top) not slowed;
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
      car = GS.DECKS.find((d) => d.kind === "car" && F.shallow(d.x0, d.y0)),
      walk = (x, yy) => {
        const z = { i: 0, x, y: yy };
        Z.chaseStep(z, null, [x + 400, yy], 20);
        return z.x - x;
      };
    return {
      WET,
      shallow: L.wetK(2400, y),
      deep: L.wetK(300, y),
      dry: L.wetK(2400, GS.ROAD.y0 - 200),
      onCar: L.wetK(car.x0 + 10, car.y0 + 10, car.h),
      inWater: walk(2400, y),
      ashore: walk(2400, GS.ROAD.y0 - 200),
    };
  });
  const { WET } = got;
  const want = { shallow: WET.WADE, deep: WET.SWIM, dry: 1, onCar: 1 };
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
