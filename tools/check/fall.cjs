/* I want fall damage pinned (heights.js fallHurt, gamedefaults.js FALL, game.js step; the owner's, Nov 28 07:38Z,
   07:39Z, 07:42Z and 07:48Z): in elevations dropped, none under 1.5, 0.25 HP at 1.5, 2 at 2, 4 at 3. The way across
   counts only when a hit threw the duck, and then only the hit's own throw: walking or sprinting off any edge of the
   pumps' roof (0.85 of an elevation) hurts the same, nothing, and a duck knocked off it lands with the same throw
   whether it steers along it, against it or not at all.
   Run: node tools/check/run.mjs fall */
const { url, fail, noErrors } = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1100, height: 700 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(url);
  const got = await p.evaluate(async () => {
    const { fallHurt, ELEV } = await import("./js/heights.js"),
      at = (e, side = 0) => +fallHurt(e * ELEV, side * ELEV).toFixed(4);
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "F", test: true, computers: 0 });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "l4dd",
        map: "downpour",
        botWait: 1,
        wildJustin: 0,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.send({ t: "start" });
    return {
      1.49: at(1.49),
      1.5: at(1.5),
      2: at(2),
      3: at(3),
      side: at(0, 5),
    };
  });
  const want = { 1.49: 0, 1.5: 0.25, 2: 2, 3: 4, side: 0 };
  for (const k in want)
    if (got[k] !== want[k])
      fail(`fall: ${k} took ${got[k]}, not ${want[k]} ` + JSON.stringify(got));
  await p.waitForTimeout(6000);
  /* off each edge of the pumps' roof, walking and sprinting (world.js step, as game.js runs it) */
  const edges = await p.evaluate(async () => {
    const G = await import("./js/game.js"),
      L = await import("./js/hangout/layout.js"),
      { fallHurt } = await import("./js/heights.js"),
      d = L.allDecks().find((d) => d.kind === "canopy"),
      cx = (d.x0 + d.x1) / 2,
      cy = (d.y0 + d.y1) / 2,
      out = {};
    for (const [k, x, y, ax, ay] of [
      ["N", cx, d.y0 + 30, 0, -1],
      ["S", cx, d.y1 - 30, 0, 1],
      ["W", d.x0 + 30, d.y1 - 40, -1, 0],
      ["E", d.x1 - 30, d.y1 - 40, 1, 0],
    ])
      for (const sprint of [false, true]) {
        const me = { x: x / L.W, y: y / L.H, z: d.h, b: d.h, j: 0, vz: null };
        let ev = { thud: 0 },
          n = 0;
        while (!ev.thud && n++ < 600)
          ev = G.world.step(me, ax, ay, sprint, 1 / 60, performance.now());
        out[k + (sprint ? " sprint" : "")] = ev.thud
          ? +fallHurt(ev.thud).toFixed(3)
          : "no fall";
      }
    return out;
  });
  for (const [k, v] of Object.entries(edges))
    if (v !== 0)
      fail(`fall: off the pumps' roof ${k} took ${v} ` + JSON.stringify(edges));
  /* knocked off the pumps' roof northward (boardfire.js shovePx), steering along, against, or not at all */
  const throws = [];
  for (const key of ["", "ArrowUp", "ArrowDown"]) {
    await p.evaluate(async () => {
      const r = window._r,
        L = await import("./js/hangout/layout.js"),
        d = L.allDecks().find((d) => d.kind === "canopy");
      window._lands = [];
      if (!r._send0) {
        r._send0 = r.send;
        r.send = (a) => (a.t === "land" && window._lands.push(a), r._send0(a));
      }
      r.send({
        t: "hang",
        k: "cheat",
        do: "goto",
        id: r.me,
        x: (d.x0 + d.x1) / 2,
        y: d.y0 + 40,
        z: d.h,
      });
    });
    await p.waitForTimeout(800);
    if (key) await p.keyboard.down(key);
    await p.evaluate(async () => {
      const r = window._r,
        { shovePx } = await import("./js/boardfire.js");
      shovePx(r.state, r.me, 0, -1, 160, Date.now(), 0);
      r.send({ t: "tick", id: r.me });
    });
    await p.waitForTimeout(1500);
    if (key) await p.keyboard.up(key);
    throws.push(await p.evaluate(() => window._lands.map((a) => a.s)));
  }
  await b.close();
  noErrors(errs);
  const [none, along, against] = throws.map((t) => t[0]);
  if (!(none > 0) || along !== none || against !== none)
    fail(
      "fall: a knock off the pumps' roof, steered or not, lands with its own throw " +
        JSON.stringify(throws),
    );
})();
