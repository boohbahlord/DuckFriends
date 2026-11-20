const C = require("./lib.cjs");
const { chromium } = require("playwright");
const URL = C.url;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL);
  await p.waitForTimeout(3000);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 400000,
    uploadThroughput: 100000,
  });
  const fin = [];
  p.on("requestfinished", (r) => fin.push([Date.now(), r.url()]));
  await p.evaluate(async (m) => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 1 });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: m,
        map: "cabin",
        l4map: "downpour",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
  }, process.env.M || "l4dd");
  const t0 = Date.now();
  let tv = 0;
  while (Date.now() - t0 < 180000) {
    const s = await p.evaluate(() => ({
      scr: document.body.dataset.screen,
      veil: !!document.querySelector(".veil[data-on]"),
    }));
    if (s.scr === "game" && !s.veil) {
      tv = Date.now();
      break;
    }
    await p.waitForTimeout(200);
  }
  console.log("veil gone at", tv - t0, "ms");
  await p.waitForTimeout(15000);
  const late = fin
    .filter(([t, u]) => t > tv && !/firebase|\.mp3|music/.test(u))
    .map(([t, u]) => `${t - tv}ms ${u.replace(URL, "")}`);
  console.log("files finished after the drop:", late.length);
  console.log(late.slice(0, 20).join("\n"));
  console.log("ERR", JSON.stringify(errs));
  C.noErrors(errs);
  if (!tv) C.fail("the loading screen never went (180 s)");
  await b.close();
})();
