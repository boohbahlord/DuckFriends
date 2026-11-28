/* I want the church's windows checked (the director plan, Nov 28; layout.js setTornDown, l4ddrules.js tornDown): a duck
   walking into a boarded window is stopped while a board is up, and walks through once the zombies have torn every
   board down.
   Run: node tools/check/run.mjs windows */
const { url, fail, noErrors } = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1100, height: 700 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(url);
  await p.evaluate(async () => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "Wn", test: true, computers: 0 });
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
  });
  await p.waitForTimeout(6000);
  const got = await p.evaluate(async () => {
    const G = await import("./js/game.js"),
      L = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      r = window._r,
      o = GS.BOARDED.find((o) => o.id === "ch-w1"),
      y = (o.a + o.b) / 2,
      walk = () => {
        const me = {
          x: (o.at - 70) / L.W,
          y: y / L.H,
          z: 0,
          b: 0,
          j: 0,
          vz: null,
        };
        for (let n = 0; n < 200; n++)
          G.world.step(me, 1, 0, false, 1 / 60, performance.now());
        return Math.round(me.x * L.W - o.at);
      };
    const up = walk();
    r.state.hang.brd = { ...r.state.hang.brd, [o.id]: 0 };
    r.send({ t: "tick", id: r.me });
    return { boards: up, torn: walk() };
  });
  await b.close();
  noErrors(errs);
  if (!(got.boards < 0))
    fail("windows: a boarded window stops a duck " + JSON.stringify(got));
  if (!(got.torn > 40))
    fail("windows: one torn down lets it through " + JSON.stringify(got));
})();
