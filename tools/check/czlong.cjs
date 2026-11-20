const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: +(process.env.CPU || 4),
  });
  await p.goto(C.url);
  await p.waitForTimeout(6000);
  await p.keyboard.press("x");
  await p.waitForTimeout(3000);
  await p.evaluate(() => {
    window._lt = [];
    new PerformanceObserver((l) =>
      l
        .getEntries()
        .forEach((e) =>
          window._lt.push([Math.round(e.startTime), Math.round(e.duration)]),
        ),
    ).observe({ type: "longtask" });
    window._veil = [];
    setInterval(() => {
      if (document.querySelector(".veil[data-on]"))
        window._veil.push(Math.round(performance.now()));
    }, 50);
  });
  const t0 = await p.evaluate(() => {
    const t = performance.now();
    import("./js/customize.js").then((m) => m.openCustomize());
    return t;
  });
  await p.waitForTimeout(15000);
  const r1 = await p.evaluate(
    (t0) => ({
      long: window._lt
        .filter((x) => x[0] >= t0)
        .map((x) => [x[0] - Math.round(t0), x[1]]),
      veil: window._veil.length
        ? [
            window._veil[0] - Math.round(t0),
            window._veil.at(-1) - Math.round(t0),
          ]
        : null,
    }),
    t0,
  );
  console.log(
    "open customize: long tasks [start,dur] ms",
    JSON.stringify(r1.long.filter((x) => x[1] > 100)),
    "veil",
    JSON.stringify(r1.veil),
  );
  const names = await p.evaluate(() =>
    [...document.querySelectorAll("button")]
      .map((b) => b.textContent.trim())
      .filter((t) => t && t.length < 14)
      .slice(0, 30),
  );
  console.log(names.join("|"));
  const t1 = await p.evaluate(() => {
    window._lt = [];
    window._veil = [];
    return performance.now();
  });
  await p
    .locator("button", { hasText: /^Hat/ })
    .first()
    .click({ timeout: 5000 })
    .catch((e) => console.log("hat click", e.message.slice(0, 80)));
  await p.waitForTimeout(8000);
  const r2 = await p.evaluate(
    (t1) => ({
      long: window._lt.map((x) => [x[0] - Math.round(t1), x[1]]),
      veil: window._veil.length,
    }),
    t1,
  );
  console.log(
    "hat: long tasks",
    JSON.stringify(r2.long.filter((x) => x[1] > 100)),
    "veil samples",
    r2.veil,
  );
  C.noErrors(errs);
  await b.close();
})();
