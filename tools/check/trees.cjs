/* I want trees checked (E4; the owner's, Nov 21: "Trees: elevation follows size; the trunk drawn and hit in the same
   top-down perspective as everything else; you can't land on a trunk's top, you fall off it the way you came, and only
   clear it by jumping over"):
   1. every Downpour tree is as tall as its drawing (its leaves' top over its trunk's foot, stationtrees.js), so a bigger
      tree of a kind is taller, and nothing stops a duck over that top;
   2. its trunk stops ducks over the drawn trunk's foot (flared on the ground), at its size, half as deep as wide;
   3. layout.js landOff: a duck coming down into a trunk is back at the last spot it stood off it; one over its top, or
      walking beside it, stays where it is.
   Run: node tools/check/run.mjs trees */
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
    const L = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      SA = await import("./js/hangout/stationart.js");
    L.useMode("l4dd", "downpour");
    const trees = L.PROPS.filter((q) => q.kind === "tree"),
      out = { n: trees.length, bad: [], taller: 0, pairs: 0 };
    for (const t of trees) {
      const { kind, v, seed, flip } = GS.swampPick(t.id),
        k = GS.treeK(t.big),
        cr = SA.swampCrownSVG(kind, v, seed, flip),
        top = (cr.ay - (cr.h - GS.SWAMP_CROWN[kind][v].h) / 2) * k, // (the leaves' top over the foot, as drawn)
        sol = L.SOLIDS.find((s) => s.id === t.id),
        w = sol.x1 - sol.x0,
        d = sol.y1 - sol.y0,
        cx = (sol.x0 + sol.x1) / 2,
        cy = (sol.y0 + sol.y1) / 2;
      if (
        Math.abs(t.h - top) > 1 ||
        Math.abs(sol.top - (t.z + t.h)) > 1e-6 ||
        !sol.noLand ||
        Math.abs(w - GS.SWAMP_TRUNK[kind].w * GS.SWAMP_TRUNK[kind].flare * k) >
          1e-6 ||
        Math.abs(d - w / 2) > 1e-6 ||
        L.solidsAt(cx, cy, sol.top + 1).some((s) => s.id === t.id) ||
        !L.solidsAt(cx, cy, sol.top - 1).some((s) => s.id === t.id)
      )
        out.bad.push([t.id, kind, v, t.h, top, w, d, sol.top]);
    }
    /* a bigger tree of a kind and a look is taller */
    for (const a of trees)
      for (const c of trees) {
        const pa = GS.swampPick(a.id),
          pc = GS.swampPick(c.id);
        if (pa.kind !== pc.kind || pa.v !== pc.v || !(a.big > c.big)) continue;
        out.pairs++;
        if (a.h > c.h) out.taller++;
      }
    /* landOff, round the first tree's trunk */
    const t = L.SOLIDS.find((s) => s.noLand),
      cx = (t.x0 + t.x1) / 2,
      cy = (t.y0 + t.y1) / 2,
      by = t.y1 + 60, // (just south of it, off it)
      me = { z: t.top - 200 };
    const at = (x, y, z) => {
      me.z = z;
      return L.landOff(me, x, y).map(
        (u, i) => +(u * (i ? L.H : L.W)).toFixed(1),
      );
    };
    out.off = at(cx, by, 0); // (beside it: stays)
    out.over = at(cx, cy, t.top + 5); // (over its top: stays)
    out.down = at(cx, cy, t.top - 5); // (come down into it: back off it)
    out.spot = [cx, by];
    return out;
  });
  if (got.n < 50) fail("Downpour's trees: only " + got.n);
  if (got.bad.length)
    fail(
      got.bad.length +
        " trees not as drawn (id, kind, look, h, drawn top, trunk w, d, top): " +
        JSON.stringify(got.bad.slice(0, 4)),
    );
  if (!got.pairs || got.taller !== got.pairs)
    fail(`bigger trees taller: ${got.taller} of ${got.pairs}`);
  const same = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]) < 0.5;
  if (!same(got.off, got.spot) || !same(got.down, got.spot))
    fail("a duck coming down into a trunk: " + JSON.stringify(got));
  if (same(got.over, got.spot))
    fail("a duck over a trunk's top was moved: " + JSON.stringify(got.over));
  await b.close();
  noErrors(errs);
})();
