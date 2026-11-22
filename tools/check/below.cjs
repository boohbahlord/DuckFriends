/* I want what's under my floor shown darker, the same way for everything (B5, the owner's, Nov 21 16:17Z: "as you
   increase in elevation ... the layers ... become more dark ... including for other ducks ... that isn't true for
   jumping"; below.js, gamedefaults.js BELOW). On Downpour: on the ground nothing is darker; up on the gas station's roof
   the ground, the ducks and the zombies on it are BELOW.PER darker (an elevation down), the props by their tops (a tree
   taller than the roof not at all), my own duck never; a jump on the roof changes none of it; on the pumps' canopy (not
   a whole elevation up) the ground is a little less dark than from the roof. */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1280, height: 800 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto(url);
  await p.waitForTimeout(2000);
  await p.evaluate(async () => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 2 });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        botWait: 1,
        mode: "l4dd",
        map: "cabin",
        l4map: "downpour",
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
    for (let i = 0; i < 60 && (r.state.vt || r.state.phase === "lobby"); i++) {
      if (r.state.vt && r.state.vt.k === "zmap")
        r.send({ t: "vote", v: "downpour" });
      await new Promise((q) => setTimeout(q, 500));
    }
  });
  await p.waitForFunction(
    () =>
      document.body.dataset.screen === "game" &&
      !document.querySelector(".veil[data-on]"),
    null,
    { timeout: 120000, polling: 250 },
  );
  await p.waitForTimeout(2500);
  /* how dark each thing is: the ground, my duck, the other ducks, the props by their top */
  const look = () =>
    p.evaluate(async () => {
      const { PROPS } = await import("./js/hangout/layout.js"),
        top = new Map(PROPS.map((q) => [q.id, (q.z || 0) + (q.h || 0)])),
        v = (e) =>
          e.classList.contains("below-me")
            ? +e.style.getPropertyValue("--below")
            : 0,
        q = (s) => [...document.querySelectorAll(s)],
        props = q(".hang-props > .hp[data-prop]").map((e) => [
          top.get(e.dataset.prop),
          v(e),
        ]);
      return {
        ground: q(".hang-art-ground").map(v)[0],
        me: v(document.querySelector(".ducks > .gduck.mine")),
        others: q(".ducks > .gduck:not(.mine)").map(v),
        tall: props.filter(([t]) => t > 120).map(([, d]) => d),
        low: props.filter(([t]) => t < 20).map(([, d]) => d),
        z: window._r.state.pos[window._r.me].z,
      };
    });
  const go = (kind) =>
    p.evaluate(async (kind) => {
      const { DECKS } = await import("./js/hangout/stationmap.js"),
        d = DECKS.find((d) => d.kind === kind);
      window._r.send({
        t: "hang",
        k: "cheat",
        do: "goto",
        x: (d.x0 + d.x1) / 2 + (kind === "roof" ? 60 : 0),
        y: kind === "roof" ? d.y0 + 120 : (d.y0 + d.y1) / 2,
        z: d.h,
      });
    }, kind);
  const PER = await p.evaluate(
    async () => (await import("./js/gamedefaults.js")).BELOW.PER,
  );
  const g = await look();
  if (g.ground || g.me || g.others.some(Boolean) || g.low.some(Boolean))
    fail(`on the ground something is darker: ${JSON.stringify(g)}`);
  await go("roof");
  await p.waitForTimeout(2000);
  const r = await look();
  if (Math.abs(r.ground - PER) > 0.001)
    fail(`from the roof the ground is ${r.ground} darker, not ${PER}`);
  if (r.me) fail(`from the roof my own duck is ${r.me} darker`);
  if (!r.others.length || r.others.some((d) => d < PER - 0.001))
    fail(`from the roof the ducks on the ground: ${r.others}`);
  if (!r.low.length || r.low.some((d) => Math.abs(d - PER) > 0.03))
    fail(`from the roof the props on the ground: ${r.low.slice(0, 9)}`);
  if (r.tall.some(Boolean))
    fail(`a prop taller than the roof is darker: ${r.tall.slice(0, 9)}`);
  await p.keyboard.down("Space");
  await p.waitForTimeout(150);
  const j = await look();
  await p.keyboard.up("Space");
  if (!(j.z > r.z)) fail(`no jump on the roof (z ${j.z})`);
  else if (JSON.stringify({ ...j, z: 0 }) !== JSON.stringify({ ...r, z: 0 }))
    fail(`a jump changed how dark things are: ${JSON.stringify(j)}`);
  await p.waitForTimeout(1500);
  await go("canopy");
  await p.waitForTimeout(2000);
  const c = await look();
  if (!(c.ground > 0 && c.ground < r.ground))
    fail(`from the canopy the ground is ${c.ground} (the roof's ${r.ground})`);
  noErrors(errs);
  console.log(
    `below: ground ${g.ground} / roof ${r.ground} / canopy ${c.ground}; others ${r.others}`,
  );
  await b.close();
})();
