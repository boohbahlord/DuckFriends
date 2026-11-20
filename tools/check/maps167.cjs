const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const vp of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ])
    for (const map of [
      "night",
      "sky",
      "pixel",
      "carnival",
      "stars",
      "rabbit",
      "collage",
      "euclid",
      "vellum",
      "tiles",
    ]) {
      const p = await b.newPage({ viewport: vp });
      p.on("pageerror", (e) => errs.push(map + vp.width + ": " + e.message));
      p.on(
        "console",
        (m) =>
          m.type() === "error" && errs.push(map + vp.width + ": " + m.text()),
      );
      await p.goto(C.url);
      await p.waitForTimeout(1000);
      await p.evaluate(async (map) => {
        const r = await (
          await import("./js/net.js")
        ).createLocalRoom({ name: "T", test: true, computers: 2 });
        window._r = r;
        r.send({
          t: "options",
          options: {
            modePick: "host",
            mapPick: "host",
            mode: "aod",
            map,
            botWait: 1,
          },
        });
        (await import("./js/router.js")).go("lobby", r);
        r.send({ t: "start" });
      }, map);
      await p.waitForTimeout(6500);
      const o = await p.evaluate(() => {
        const l = document.querySelector(".map-layer");
        const r = l && l.getBoundingClientRect();
        return [
          window._r.state.phase,
          l && l.className,
          r && [Math.round(r.width), Math.round(r.height)],
          l && l.querySelectorAll("img,canvas").length,
        ];
      });
      console.log(map, vp.width, JSON.stringify(o));
      await p.close();
    }
  console.log("ERR", JSON.stringify(errs.slice(0, 8)));
  C.noErrors(errs);
  await b.close();
})();
