/* I want the playtester's test commands to work: in Dead Ducks Arcade on Downpour, `cheat goto canopy | station | chapel | X Y [Z]` puts my duck there (through the host, so the
   camera goes with it, and at the height of that roof). The first one used turns stats off (cheatflag.js). */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
  await p.goto(url);
  await p.waitForTimeout(2500);
  await p.evaluate(async () => {
    const r = (await import("./js/net.js")).createLocalRoom({
      name: "T",
      test: true,
      computers: 1,
    });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "l4dd",
        map: "cabin",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.send({ t: "start" });
  });
  await p.waitForTimeout(14000);
  const o = await p.evaluate(async () => {
    const R = window._r,
      w8 = (ms) => new Promise((r) => setTimeout(r, ms)),
      { shellRun } = await import("./js/shell.js"),
      { shellCtx } = await import("./js/chat.js"),
      run = async (l) =>
        ((await shellRun(l, shellCtx())).lines || []).join(" | "),
      o = {};
    (await import("./js/net.js")).setActive(R);
    o.before = await run("sudo cheat");
    o.goto = await run("sudo cheat goto canopy");
    await w8(1200);
    const p1 = R.state.pos[R.me];
    o.canopy = [
      Math.round(p1.x * 4600),
      Math.round(p1.y * 6200),
      p1.z,
      !!p1.tp,
    ];
    o.goto2 = await run("sudo cheat goto station");
    await w8(1200);
    o.station = [R.state.pos[R.me].z];
    o.after = await run("sudo cheat");
    o.bad = await run("sudo cheat goto nowhere");
    return o;
  });
  if (process.env.SHOW) console.log(JSON.stringify(o));
  if (!/No test commands/.test(o.before))
    fail("cheatcmds: expected a clean game first " + o.before);
  if (!/Moved/.test(o.goto) || !(o.canopy[2] > 0))
    fail("cheatcmds: goto canopy " + JSON.stringify(o));
  if (!(o.station[0] > 0)) fail("cheatcmds: goto station " + JSON.stringify(o));
  if (!/counts no stats/.test(o.after))
    fail("cheatcmds: stats not off " + o.after);
  if (!/✗/.test(o.bad)) fail("cheatcmds: a bad place was taken " + o.bad);
  noErrors(errs, "cheatcmds");
  await b.close();
})();
