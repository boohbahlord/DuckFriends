/* I want a jerry can on the ground to show its can in its filled orange orb, every time (the owner, Nov 21: "sometimes when
   the gasoline is dropped on the ground, it's just an orange orb that isn't filled on the inside and you can't see the
   can"). The cans were put in the world's layer with plain screen coordinates, while that layer is slid by the camera, so
   a can sat away from its outline (l4ddpowerui.js pwDraw: now the world's boxTr, as the power box). This lays 50 cans in
   Downpour's cabin in front of my duck and checks that every one that is not hidden is on the screen, in a filled orb,
   with its can drawn. */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto(url);
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
  await p.waitForTimeout(3000);
  await p.evaluate(async () => {
    const r = window._r,
      s = r.state,
      me = s.pos[r.me],
      { W, H } = await import("./js/hangout/layout.js");
    s.hang.pk = Array.from({ length: 50 }, (_, i) => ({
      n: 900 + i,
      k: "can",
      r: i % 5,
      x: Math.round(me.x * W + 150 - 300 + (i % 10) * 60),
      y: Math.round(me.y * H - 100 + Math.floor(i / 10) * 60),
      z: 0,
      px: 0,
      py: 0,
    }));
  });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(() =>
    [...document.querySelectorAll(".l4-pk.k-can")]
      .filter((el) => !el.hidden)
      .map((el) => {
        const o = el.querySelector(".l4orb"),
          v = el.querySelector("svg"),
          r = o.getBoundingClientRect();
        return {
          on:
            r.x >= 0 &&
            r.y >= 0 &&
            r.right <= innerWidth &&
            r.bottom <= innerHeight &&
            r.width > 10,
          fill: getComputedStyle(o).backgroundImage.includes("gradient"),
          can: !!v && v.getBoundingClientRect().width > 10,
        };
      }),
  );
  await b.close();
  noErrors(errs);
  if (res.length < 25) fail(`only ${res.length} of 50 cans showed at all`);
  const bad = res.filter((x) => !x.on || !x.fill || !x.can);
  if (bad.length)
    fail(
      `${bad.length} of ${res.length} cans are off the screen or not drawn in their orb`,
    );
})();
