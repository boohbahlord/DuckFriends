const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(C.url);
  await p.waitForTimeout(2500);
  await p.evaluate(async () => {
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
        map: "night",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.send({ t: "start" });
  });
  await p.waitForTimeout(8000);
  const out = await p.evaluate(() => {
    const t =
      document.querySelector(".screen.game img") ||
      document.querySelector(".screen.game");
    const e = new DragEvent("dragstart", { bubbles: true, cancelable: true });
    t.dispatchEvent(e);
    const s = new Event("selectstart", { bubbles: true, cancelable: true });
    document.querySelector(".gbar").dispatchEvent(s);
    const inp = document.createElement("input");
    document.querySelector(".screen.game").append(inp);
    const e2 = new DragEvent("dragstart", { bubbles: true, cancelable: true });
    inp.dispatchEvent(e2);
    return {
      scr: document.body.dataset.screen,
      img: t.tagName,
      dragBlocked: e.defaultPrevented,
      selBlocked: s.defaultPrevented,
      inputDragAllowed: !e2.defaultPrevented,
      us: getComputedStyle(document.querySelector(".gbar")).userSelect,
    };
  });
  console.log(JSON.stringify(out), "ERR", JSON.stringify(errs));
  C.noErrors(errs);
  if (!out.dragBlocked || !out.selBlocked || !out.inputDragAllowed)
    C.fail("drag/select rules: " + JSON.stringify(out));
  await b.close();
})();
