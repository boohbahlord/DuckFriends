/* I want Justin's pocket change in Dead Ducks Arcade (the owner, Nov 21: "a 1% chance that when a player kills Justin … Justin
   forgot to deposit his pocket change"): a player's kill of Justin out in Downpour, with the chance made certain, leaves an
   orb of gold coins where he fell, the chat says the line, and the first duck over it gets 5,000 points. */
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
    (await import("./js/gamedefaults.js")).POCKET_CHANGE.CHANCE = 1;
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 1 });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "l4dd",
        map: "cabin",
        l4map: "downpour",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
  });
  for (let i = 0; i < 300; i++) {
    const s = await p.evaluate(() => ({
      scr: document.body.dataset.screen,
      veil: !!document.querySelector(".veil[data-on]"),
    }));
    if (s.scr === "game" && !s.veil) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(2500);
  const r = await p.evaluate(async () => {
    const R = window._r,
      J = "b-justin",
      out = {};
    const S = () => R.state,
      pc = () => (S().hang.l4dr || []).filter((d) => d.k === "coins");
    if (!S().players[J] || !S().players[J].wild) return { none: true };
    const pts0 = S().hang.l4pt[R.me] || 0,
      said = () =>
        JSON.stringify(S().log || []).includes(
          "Justin forgot to deposit his pocket change",
        );
    out.before = pc().length;
    /* stand next to him and swing at him until he is down */
    for (let i = 0; i < 60 && !said(); i++) {
      const s = S(),
        jp = s.pos[J];
      s.pos[R.me] = { ...s.pos[R.me], x: jp.x - 0.015, y: jp.y, z: jp.z || 0 };
      const q = s.hang.l4p[J];
      s.hang.l4p[J] = { ...q, hp: 1 };
      R.send({ t: "use", what: "knife", face: 1, ax: 1, ay: 0 });
      await new Promise((f) => setTimeout(f, 250));
    }
    await new Promise((f) => setTimeout(f, 600));
    out.orbs = pc().length;
    out.gain = (S().hang.l4pt[R.me] || 0) - pts0;
    out.say = JSON.stringify(S().log || []).includes(
      "Justin forgot to deposit his pocket change",
    );
    return out;
  });
  if (r.none) fail("Justin was not out in Downpour");
  /* I stand where he fell, so the orb is taken at once: 5,000 points */
  if (!r.orbs && r.gain < 5000)
    fail("no orb of coins, no 5,000 points: " + JSON.stringify(r));
  if (!r.say) fail("the chat did not say the line");
  await b.close();
  noErrors(errs);
})();
