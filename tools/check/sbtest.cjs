const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const cases = [
    ["pc", { viewport: { width: 1366, height: 768 } }, ""],
    [
      "port",
      { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      "",
    ],
    ["pc", { viewport: { width: 1366, height: 768 } }, "cabin"],
    ["pc", { viewport: { width: 1366, height: 768 } }, "downpour"],
  ];
  for (const [vn, opt, sbMap] of cases) {
    const p = await b.newPage(opt);
    p.on("pageerror", (e) => errs.push(vn + sbMap + ": " + e));
    p.on(
      "console",
      (m) => m.type() === "error" && errs.push(vn + sbMap + ": " + m.text()),
    );
    await p.goto(C.url);
    await p.waitForTimeout(1500);
    await p.evaluate(async (sbMap) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 2 });
      window._r = r;
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode: "sandbox",
          map: "night",
          sbMap,
          botWait: 1,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.state.zmapAsked = 1;
      r.send({ t: "start" });
      {
        const iv = setInterval(() => {
          if (r.state.sbpk) {
            r.send({ t: "sbPick" });
            clearInterval(iv);
          }
        }, 300);
        setTimeout(() => clearInterval(iv), 20000);
      }
    }, sbMap);
    await p.waitForTimeout(6000);
    const vis = () =>
      p.evaluate(() => {
        const w = document.querySelector(".sb-win");
        return (
          !!w &&
          getComputedStyle(w).display !== "none" &&
          w.getBoundingClientRect().height > 0 &&
          !w.hidden
        );
      });
    const r = {
      phase: await p.evaluate(() => window._r.state.phase),
      mode: await p.evaluate(() => window._r.state.options.mode),
      leave: await p.evaluate(() => {
        const e = document.querySelector(".cabin-end");
        return e ? e.textContent.trim() : null;
      }),
    };
    if (vn === "pc") {
      await p.keyboard.down("c");
      await p.waitForTimeout(500);
      r.held = await vis();
      await p.keyboard.up("c");
      await p.waitForTimeout(200);
      r.afterUp = await vis();
      await p.keyboard.press("c");
      await p.waitForTimeout(80);
      await p.keyboard.press("c");
      await p.waitForTimeout(800);
      r.dbl = await vis();
      r.sheetBox = await p.evaluate(() => {
        const w = document.querySelector(".sb-win");
        const q = w && w.getBoundingClientRect();
        return q && [q.x | 0, q.y | 0, q.width | 0, q.height | 0];
      });
      await p.keyboard.press("c");
      await p.waitForTimeout(300);
      r.tapClose = await vis();
      await p.keyboard.down("b");
      await p.waitForTimeout(400);
      r.b = await p.evaluate(
        () => document.querySelector(".sb-win h2")?.textContent,
      );
      await p.keyboard.up("b");
    }
    await p.waitForTimeout(3000);
    r.phase2 = await p.evaluate(() => window._r.state.phase);
    console.log(vn, sbMap || "board", JSON.stringify(r));
    await p.close();
  }
  console.log("ERR", JSON.stringify(errs.slice(0, 6)));
  C.noErrors(errs);
  await b.close();
})();
