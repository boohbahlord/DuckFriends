/* I want Downpour's cars pushed by a blast checked (B6d, carpush.js; the owner's, Nov 21 19:07Z: "cars can be moved
   around ... So like an explosion might be able to move it"):
   - a car with room round it moves its blast's push (push.js blastPush), over its weight (WEIGHT.CAR), away from it;
   - the walk grid made again round it only (walkgrid.js regrid) is the same as the whole grid made new, so zombies
     path round the car where it is now;
   - a car stops before another car or a wall (layout.js carClear), and put back, the map is as it was;
   - a melee swing shoves a car as it shoves a duck, over its weight, once a swing;
   - every move of the six cars takes well under 50 ms.
   Run: node tools/check/run.mjs cars */
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
      CP = await import("./js/carpush.js"),
      WG = await import("./js/walkgrid.js"),
      ZP = await import("./js/zombiepath.js"),
      { blastPush } = await import("./js/push.js"),
      { WEIGHT } = await import("./js/gamedefaults.js");
    L.useMode("l4dd", "downpour");
    const s = { hang: {}, options: { mode: "l4dd" } },
      all = () => ({ d: 0, o: 1 }), // (a blast that reaches every car, each at its edge)
      grid = (name) =>
        WG.gridOf({ name, x0: 0, y0: 0, gw: ZP.GW, gh: ZP.GH, zombie: true })
          .walk,
      same = (a, b) => a.reduce((n, v, i) => n + (v !== b[i]), 0),
      kept = grid("check-kept"), // (made with every car in its place: patched from here on)
      base = kept.slice(),
      out = { far: blastPush(s, 1).px / WEIGHT.CAR },
      c = GS.CARS[1],
      t0 = performance.now();
    CP.carsBlast(s, all, c.x0 - 10, (c.y0 + c.y1) / 2); // (just west of car 1's middle)
    out.ms = performance.now() - t0;
    out.cars = s.hang.cars;
    out.patchDiff = same(kept, grid("check-new")); // (patched against made new)
    out.cellsMoved = same(kept, base);
    const c5 = GS.CARS[5];
    out.blocked = L.carClear(1, c5.x0 - c.x0, c5.y0 - c.y0); // (car 1 on car 5's spot)
    CP.carsAt({ hang: {} });
    out.backDiff = same(kept, base);
    /* a melee swing: car 1 shoved east 30 px' worth (a duck's), once a swing */
    const m = { hang: {} },
      k = { dx: 1, dy: 0, hit: [] },
      mx = c.x0 - 5,
      my = (c.y0 + c.y1) / 2;
    CP.carsSwing(m, mx, my, 20, k, 30);
    CP.carsSwing(m, mx, my, 20, k, 30);
    out.swing = m.hang.cars;
    CP.carsAt({ hang: {} });
    return out;
  });
  const [dx, dy] = got.cars[1] || [0, 0];
  if (!(dx > 0 && Math.abs(Math.hypot(dx, dy) - got.far) <= 1))
    C.fail("car 1 pushed away " + got.far + " px: " + JSON.stringify(got.cars));
  if (got.patchDiff)
    C.fail("walk cells patched differ from a new grid: " + got.patchDiff);
  if (!got.cellsMoved) C.fail("no walk cell changed with the cars moved");
  if (got.blocked) C.fail("a car can stand on another car");
  if (got.backDiff)
    C.fail("cars put back, the walk grid differs: " + got.backDiff);
  if (JSON.stringify(got.swing) !== '{"1":[2,0]}')
    C.fail(
      "a swing's 30 px on a car (15 duck weights): " +
        JSON.stringify(got.swing),
    );
  if (got.ms > 25) C.fail("six cars moved in " + got.ms + " ms");
  C.noErrors(errs);
  await b.close();
})();
