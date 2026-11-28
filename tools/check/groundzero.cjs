/* I want the ground at elevation 0 checked (the owner's, Nov 22 16:06Z: "The ground level is zero everywhere. And the gas
   station's roof height from the grass that it sits upon is the standard height for elevation ... the water in
   Downpour is actually the lowest point of it is the elevation. Where its elevation is zero ... the actual grass you
   walk on normally ... should be above elevation zero to probably a decimal point"; 16:08Z: made maps shifted down by
   one so they look the same):
   1. heights.js levelOf: Duck Cabin's ground is 0 and a gas station roof up is 1; Downpour's flood bottom is 0, its
      grass a little over it (under a half), its gas station roof that and 1;
   2. a zone's Elevation box starts at 0, and an arrow on the ground reads 0;
   3. a save from before (version 2) opens with its zones as high as they were: Elevation 2 is 1 (on Downpour, 2 less
      its grass's height, to the nearest half tenth), a Slope up to 3 is 2, a flat slope stays 0.
   Run: node tools/check/run.mjs groundzero */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage(),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
  await p.goto(url);
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async () => {
    const H = await import("./js/heights.js"),
      L = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      SR = await import("./js/sandboxrules.js"),
      SV = await import("./js/sbsave.js"),
      O = await import("./js/outlines.js"),
      r3 = (v) => Math.round(v * 1000) / 1000,
      out = {};
    L.useMode("hang"); // (Duck Cabin is Hangout's alone since Nov 27)
    out.cabin = [H.levelOf(0), H.levelOf(H.ELEV), H.levelZ(1)].map(r3);
    const g = [L.spawnAt(0)]
      .concat(
        [
          [500, 500],
          [5500, 4000],
        ].map(([x, y]) => ({ x, y })),
      )
      .find((q) => !L.floorH(q.x, q.y, 0)) || { x: 0, y: 0 };
    out.arrow = [O.olAway(g.x, g.y, 0).lv, L.floorH(g.x, g.y, 0)];
    L.useMode("l4dd", "downpour");
    out.dp = [
      H.levelOf(GS.FLOOD.floor),
      H.levelOf(0),
      H.levelOf(H.ELEV) - H.levelOf(0),
    ].map(r3);
    L.useMode("hang", "");
    out.box = [SR.SB_ZONE.fl.min, SR.SB_ZONE.fl.def];
    const old = (world, v = 2) => {
      const box = (v) => ({ t: v, ok: v }),
        s = { players: {}, options: {}, seat: [] };
      SV.sbPick(
        s,
        {
          save: {
            id: "x",
            data: {
              v,
              world,
              parts: {
                sb: {
                  pts: {
                    a: { k: "zone", f: { fl: box("2"), slto: box("3") } },
                    b: { k: "zone", f: { fl: box("1"), slto: box("0") } },
                  },
                },
              },
            },
          },
        },
        0,
      );
      const P = s.sb.pts;
      return [P.a.f.fl.ok, P.a.f.slto.ok, P.b.f.fl.ok, P.b.f.slto.ok];
    };
    out.cabinSave = old("cabin");
    out.dpSave = old("downpour");
    out.dp3Save = old("downpour", 3);
    const r20 = (n) => Math.round(n * 20) / 20,
      up = (GS.FLOOD.floor + 48) / H.ELEV; // (its flood's bottom since version 4 over the one before: sbsave.js DP_FLOOR_V3)
    out.dpWant = [2, 3, 1]
      .map((n) => String(r20(r20(n - 1 + 48 / H.ELEV) - up))) // (its grass over its flood's bottom then, then down to version 4's)
      .concat("0");
    out.dp3Want = [2, 3, 1].map((n) => String(r20(n - up))).concat("0");
    return out;
  });
  const same = (a, c) => JSON.stringify(a) === JSON.stringify(c);
  if (!same(got.cabin, [0, 1, 108]))
    fail("Duck Cabin's levels: " + JSON.stringify(got.cabin));
  if (
    got.dp[0] !== 0 ||
    !(got.dp[1] > 0 && got.dp[1] < 0.5) ||
    Math.abs(got.dp[2] - 1) > 1e-3
  )
    fail("Downpour's levels: " + JSON.stringify(got.dp));
  if (!same(got.box, [0, "0"]))
    fail("a zone's Elevation box: " + JSON.stringify(got.box));
  if (got.arrow[0] !== 0)
    fail("an arrow on the ground: " + JSON.stringify(got.arrow));
  if (!same(got.cabinSave, ["1", "2", "0", "0"]))
    fail("an old save on Duck Cabin: " + JSON.stringify(got.cabinSave));
  if (!same(got.dpSave, got.dpWant))
    fail(
      "an old save on Downpour: " +
        JSON.stringify(got.dpSave) +
        ", not " +
        JSON.stringify(got.dpWant),
    );
  if (!same(got.dp3Save, got.dp3Want))
    fail(
      "a version 3 save on Downpour: " +
        JSON.stringify(got.dp3Save) +
        ", not " +
        JSON.stringify(got.dp3Want),
    );
  await b.close();
  noErrors(errs);
})();
