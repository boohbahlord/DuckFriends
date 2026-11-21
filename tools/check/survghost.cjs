/* I want a Survival duck that bleeds out to be the walking ghost Dead Ducks Arcade has, not a spectator (the owner, Nov 21
   15:39Z: "We can remove spectators mode from survival and just use the mechanic we already do where the duck becomes a
   ghost and they can walk around"). My duck bleeds out: it is a ghost (gh) that stays one (ex: no coming back at the
   next round), it isn't marked dead (no spectating), its body lies where it fell (s.hang.ghost), and the defibrillator
   gets it up at that body. */
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
        mode: "surv",
        map: "night",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
  });
  await p.waitForTimeout(14000);
  const o = await p.evaluate(async () => {
    const R = window._r,
      w8 = (ms) => new Promise((r) => setTimeout(r, ms)),
      S = () => R.state, // (the host swaps its state object as it ticks)
      me = R.me,
      o = {};
    S().hang.l4p = {
      ...S().hang.l4p,
      [me]: { hp: 0, at: Date.now() - 99999, dn: Date.now() - 1 },
    };
    await w8(1500);
    let q = S().hang.l4p[me];
    o.ghost = !!(q && q.gh && q.ex);
    o.dead = !!S().players[me].dead;
    o.body = !!(S().hang.ghost && S().hang.ghost[me]);
    o.spectate = !!document.querySelector(".act-row.spec .spec-go");
    o.round0 = S().hang.l4.r;
    await w8(6000); // (rounds go by: a ghost of Dead Ducks Arcade comes back at each, Survival's stays)
    q = S().hang.l4p[me];
    o.stays = !!(q && q.gh && q.ex);
    return o;
  });
  if (process.env.SHOW) console.log(JSON.stringify(o));
  if (!o.ghost)
    fail(
      "survghost: the bled-out duck is not a staying ghost " +
        JSON.stringify(o),
    );
  if (o.dead) fail("survghost: the ghost is still marked dead (a spectator)");
  if (!o.body) fail("survghost: no body where it fell");
  if (!o.stays)
    fail("survghost: the ghost came back at a rest " + JSON.stringify(o));
  noErrors(errs, "survghost");
  await b.close();
})();
