/* I want Sandbox's loot orbs taken only with E checked (js/sbloot.js; the owner's, Nov 21 18:27Z: "You only pick them up
   by clicking E / Same for any loot on the ground now"), on the board and on Duck Cabin: an orb at my feet stays there
   however long I stand on it, the E button says "Take the …", and E takes it.
   Run: node tools/check/run.mjs sborbs */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    errs = [];
  for (const sbMap of ["", "cabin"]) {
    const p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
      at = sbMap || "board";
    p.on("pageerror", (e) =>
      errs.push(at + ": " + String(e.stack || e).slice(0, 400)),
    );
    await p.goto(url);
    await p.waitForTimeout(2000);
    await p.evaluate(async (sbMap) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 0 });
      window._r = r;
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode: "sandbox",
          map: "night",
          sbMap,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.state.zmapAsked = 1;
      r.send({ t: "start" });
      const iv = setInterval(() => {
        if (r.state.sbpk) {
          r.send({ t: "sbPick" });
          clearInterval(iv);
        }
      }, 300);
      setTimeout(() => clearInterval(iv), 20000);
    }, sbMap);
    for (let i = 0; i < 150; i++) {
      if (
        await p.evaluate(
          () =>
            document.body.dataset.screen === "game" &&
            !document.querySelector(".veil[data-on]"),
        )
      )
        break;
      await p.waitForTimeout(300);
    }
    await p.waitForTimeout(2500);
    /* a loot point under my duck, with an orb on it */
    const id = await p.evaluate(async () => {
      const r = window._r,
        q = r.state.pos[r.me],
        was = Object.keys((r.state.sb && r.state.sb.pts) || {}); // (Duck Cabin's has none until the first point)
      r.send({ t: "sb", k: "add", kind: "loot", x: q.x, y: q.y, z: q.z || 0 });
      const id = Object.keys((r.state.sb && r.state.sb.pts) || {}).find(
        (k) => !was.includes(k),
      );
      if (id)
        r.state.sb.pts[id] = {
          ...r.state.sb.pts[id],
          orb: { w: "medkit", at: Date.now(), x: q.x, y: q.y, z: q.z || 0 },
        };
      return id || null;
    });
    if (!id) {
      fail(at + ": no loot point made");
      await p.close();
      continue;
    }
    await p.waitForTimeout(1500);
    const lies = await p.evaluate((id) => !!window._r.state.sb.pts[id].orb, id),
      label = await p.evaluate(() =>
        document.body.innerText.includes("Take the"),
      );
    await p.keyboard.press("KeyE");
    await p.waitForTimeout(100);
    await p.waitForTimeout(700);
    const gone = await p.evaluate((id) => !window._r.state.sb.pts[id].orb, id);
    if (!lies) fail(at + ": the orb at my feet was taken without E");
    if (!label) fail(at + ": no Take the … button over the orb");
    if (!gone) fail(at + ": E didn't take the orb");
    await p.close();
  }
  await b.close();
  noErrors(errs);
})();
