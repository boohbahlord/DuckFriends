/* I want Sandbox's heights in tenths and half tenths checked (E2; the owner's, Nov 21 15:39Z: "Heights can move in
   tenths and half tenths for the one rule for every number when describing elevations"; the ground stays 1, his Nov 22
   06:24Z pick):
   1. a box in half tenths (js/seriatbox.js "half") keeps 1.05 and 1.5, snaps 1.07 to 1.05, goes through every half
      tenth of a decimal range, and Seriat code in it gives half tenths too;
   2. a zone's Elevation and "Slope up to" boxes take them, and a slope up to 1.5 rises half a gas station roof.
   Run: node tools/check/run.mjs halftenth */
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
    const N = await import("./js/seriatbox.js"),
      SR = await import("./js/sandboxrules.js"),
      F = await import("./js/sbfloors.js"),
      Hh = await import("./js/heights.js"),
      box = { kind: "half", min: 1, max: 6 },
      out = { reads: {} };
    for (const t of ["1.05", "1.5", "1.07", "1.0:1.2", "[1.05,2]", "2:3"]) {
      const r = N.read(t, box),
        seen = new Set();
      if (r.ok) for (let i = 0; i < 800; i++) seen.add(N.pick(r.v, box));
      out.reads[t] = r.ok ? [...seen].sort((a, b) => a - b).join(" ") : r.why;
    }
    out.kinds = [SR.SB_ZONE.fl.kind, SR.SB_ZONE.slto.kind];
    const sl = F.sbSlope({ k: "zone", z: 0, f: { slto: { ok: "1.5" } } });
    out.slope = sl && [sl.lo, sl.hi, Hh.levelZ(1.5)];
    return out;
  });
  const want = {
    1.05: "1.05",
    1.5: "1.5",
    1.07: "1.05",
    "1.0:1.2": "1 1.05 1.1 1.15 1.2",
    "[1.05,2]": "1.05 2",
    "2:3": "2 3",
  };
  for (const [t, v] of Object.entries(want))
    if (got.reads[t] !== v)
      fail(`a half tenths box: "${t}" gave ${got.reads[t]}, not ${v}`);
  if (got.kinds.join() !== "half,half")
    fail("a zone's Elevation and slope boxes: " + got.kinds);
  if (!got.slope || got.slope[1] !== got.slope[2] || !(got.slope[2] > 0))
    fail("a slope up to 1.5: " + JSON.stringify(got.slope));
  await b.close();
  noErrors(errs);
})();
