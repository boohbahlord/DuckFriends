/* I want what's under my floor shown darker, the same way for everything (B5, the owner's, Nov 21 16:17Z: "as you
   increase in elevation ... the layers ... become more dark ... including for other ducks ... that isn't true for
   jumping"; below.js, gamedefaults.js BELOW). On Downpour: on the ground nothing is darker; up on the gas station's roof
   the ground, the ducks and the zombies on it are BELOW.PER darker (an elevation down), the props by their tops (a tree
   taller than the roof not at all), my own duck never; a jump on the roof changes none of it; walking off the roof, the
   fall never darkens anything more and lands on none; on the pumps' canopy (not a whole elevation up) the ground is a
   little less dark than from the roof. No cap (Nov 22 06:24Z: "darkness keeps going up beyond 60%"): 4 elevations
   down is 80%, 5 or more all dark. */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1280, height: 800 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto(url);
  await p.waitForFunction(() => document.body.dataset.screen, null, {
    timeout: 60000,
  });
  /* where my duck is drawn, as below.js sees it: the room's z is only what my duck last sent (a jump sends where it
     took off), so a screen part of the test's own, added before the game makes its list, reads the world */
  await p.evaluate(async () => {
    (await import("./js/hangout/registry.js")).activity({
      id: "belowcheck",
      only: "l4dd",
      draw(now, ctx) {
        const a = ctx.world.at(ctx.me);
        if (a) window._me = { z: a.z };
      },
    });
  });
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
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.send({ t: "start" });
    for (let i = 0; i < 60 && (r.state.vt || r.state.phase === "lobby"); i++) {
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
  /* the zombies come for my duck while the check waits, and under load (six copies at once) they knocked it down on the
     roof, held still: it stays standing here (only how dark things look is checked) */
  await p.evaluate(() => {
    const r = window._r,
      L = r.state.hang.l4p;
    L[r.me] = { ...L[r.me], hp: 1e6 };
  });
  /* every step waits on the state it needs (on the spot, at a height, in the air, landed), never a fixed time: under
     load the frames come slower, and six copies at once all stay green */
  const look = () =>
    p.evaluate(async () => {
      const { PROPS } = await import("./js/hangout/layout.js"),
        top = new Map(PROPS.map((q) => [q.id, (q.z || 0) + (q.h || 0)])),
        r = window._r,
        v = (e) =>
          e && e.classList.contains("below-me")
            ? +e.style.getPropertyValue("--below")
            : 0,
        q = (s) => [...document.querySelectorAll(s)],
        props = q(".hang-props > .hp[data-prop]").map((e) => [
          top.get(e.dataset.prop),
          v(e),
        ]),
        ground = q(".hang-art-ground")[0];
      return {
        ok: !!ground && !!window._me,
        ground: v(ground),
        me: v(document.querySelector(".ducks > .gduck.mine")),
        // (the other ducks standing on the ground: the computers walk about, so only those down there count)
        others: [...(document.querySelector(".ducks")?._els || [])]
          .filter(([id]) => id !== r.me && !(r.state.pos[id]?.z > 1))
          .map(([, e]) => v(e)),
        tall: props.filter(([t]) => t > 120).map(([, d]) => d),
        low: props.filter(([t]) => t < 20).map(([, d]) => d),
        lowT: props.filter(([t]) => t < 20).map(([t]) => t), // (their tops: a car sunk in the deep end is a little lower)
        z: window._me ? window._me.z : -1,
      };
    });
  /* look until ok(l) holds, every frame or so, up to ms; the last look either way (the check after says what was wrong) */
  const until = async (ok, ms = 30000, seen) => {
    const end = Date.now() + ms;
    for (;;) {
      const l = await look();
      if (seen) seen.push(l);
      if ((l.ok && ok(l)) || Date.now() > end) return l;
      await p.waitForTimeout(50);
    }
  };
  /* what can't change while I stay on one floor (the computers' ducks may walk off it) */
  const still = (l) => JSON.stringify([l.ground, l.me, l.low, l.tall]);
  const go = (kind) =>
    p.evaluate(async (kind) => {
      const { DECKS } = await import("./js/hangout/stationmap.js"),
        d = DECKS.find((d) => d.kind === (kind === "air" ? "roof" : kind));
      // ("air": just past the roof's north edge, at the roof's height, nothing under it: it falls)
      window._r.send({
        t: "hang",
        k: "cheat",
        do: "goto",
        x: (d.x0 + d.x1) / 2 + (kind === "canopy" ? 0 : 60),
        y:
          kind === "roof"
            ? d.y0 + 120
            : kind === "air"
              ? d.y0 - 40
              : (d.y0 + d.y1) / 2,
        z: d.h,
      });
      return d.h;
    }, kind);
  const PER = await p.evaluate(
    async () => (await import("./js/gamedefaults.js")).BELOW.PER,
  );
  const g = await until((l) => l.z < 1 && l.others.length > 0);
  if (g.ground || g.me || g.others.some((d) => d > 0.05) || g.low.some(Boolean))
    // (a duck down in the road's bed: a little)
    fail(`on the ground something is darker: ${JSON.stringify(g)}`);
  const RH = await go("roof");
  /* up there, and settled: the ground darker and every low prop drawn darker too */
  const r = await until(
    (l) =>
      Math.abs(l.z - RH) < 1 &&
      l.ground > 0 &&
      l.low.length > 0 &&
      l.low.every((d) => d > 0),
  );
  if (Math.abs(r.ground - PER) > 0.001)
    fail(`from the roof the ground is ${r.ground} darker, not ${PER}`);
  if (r.me) fail(`from the roof my own duck is ${r.me} darker`);
  if (r.others.some((d) => d < PER - 0.001))
    fail(`from the roof the ducks on the ground: ${r.others}`);
  if (
    !r.low.length ||
    r.low.some((d, i) => Math.abs(d - (PER * (RH - r.lowT[i])) / RH) > 0.021)
  )
    fail(`from the roof the props on the ground: ${r.low.slice(0, 9)}`);
  if (r.tall.some(Boolean))
    fail(`a prop taller than the roof is darker: ${r.tall.slice(0, 9)}`);
  /* a jump on the roof: every look from the take-off to the landing back on the roof is the roof's */
  const jump = [];
  let up;
  for (let i = 0; i < 5 && !(up && up.z > RH + 5); i++) {
    // (a press can come while my duck still settles from being put there: Space again)
    await p.keyboard.down("Space");
    up = await until((l) => l.z > RH + 5, 2000, jump);
    await p.keyboard.up("Space");
  }
  const back = await until((l) => Math.abs(l.z - RH) < 1, 10000, jump);
  const odd = jump.find((l) => still(l) !== still(r));
  if (!(up.z > RH + 5)) fail(`no jump on the roof (z ${up.z})`);
  else if (!(Math.abs(back.z - RH) < 1))
    fail(`the jump never came back down on the roof (z ${back.z})`);
  else if (odd)
    fail(`a jump changed how dark things are: ${JSON.stringify(odd)}`);
  /* off the roof's north edge: a fall, never darker than from the roof, nothing darker once down. It is put in the air
     just past the edge, the way walking off leaves it (world.js ground: nothing under it, it falls): a walk there under
     load sometimes never got going, and the fall is what this checks */
  const fall = [];
  await go("air");
  const off = await until((l) => l.z < RH - 10, 30000, fall);
  const down = await until(
    (l) => l.z < 1 && l.ground === 0 && l.low.every((d) => d === 0),
    30000,
    fall,
  );
  const fz = fall.map((l) => [Math.round(l.z), l.ground]);
  if (!(off.z < RH - 10))
    fail(`put past the edge it never fell: ${JSON.stringify(fz.slice(-3))}`);
  else if (fz.some(([, d], i) => d > r.ground || (i && d > fz[i - 1][1])))
    fail(`falling made things darker: ${JSON.stringify(fz)}`);
  else if (down.z > 1 || down.ground || down.others.some((d) => d > 0.05))
    fail(
      `down from the roof something is still darker: ${JSON.stringify(down)}`,
    );
  const cap = await p.evaluate(async () => {
    const { below } = await import("./js/below.js");
    return [4, 5, 10].map((n) => below(0, n * 108));
  });
  if (JSON.stringify(cap) !== "[0.8,1,1]")
    fail(`4, 5, 10 elevations down: ${cap} (not 0.8, 1, 1)`);
  const CH = await go("canopy");
  const c = await until((l) => Math.abs(l.z - CH) < 1 && l.ground > 0);
  if (!(c.ground > 0 && c.ground < r.ground))
    fail(`from the canopy the ground is ${c.ground} (the roof's ${r.ground})`);
  noErrors(errs);
  console.log(
    `below: ground ${g.ground} / roof ${r.ground} / canopy ${c.ground}; others ${r.others}`,
  );
  await b.close();
})();
