/* I want Justin out on Downpour to walk away from the zombies, never shake on the spot (the owner's video notes, Nov 21
   08:46 ET: "justin is also jitterying in the bottom corner, he has been doing that a lot when there are zombies"). Three
   seeds of 600 heartbeats (2 minutes) each, my duck parked on the canopy and kept alive, Justin kept alive too: it counts
   his steps that go straight back the way the last one came (a jitter), and fails over 15 in a run. Fixed seed and fake
   clock (tools/npc-golden/init.js), so it plays the same every time. */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const INIT = path.resolve(__dirname, "../npc-golden/init.js"),
  MOST = 15;
(async () => {
  const b = await chromium.launch(),
    errs = [];
  for (const seed of [1, 2, 3]) {
    const p = await b.newPage({ viewport: { width: 800, height: 450 } });
    p.on("pageerror", (e) => errs.push(e.message));
    await p.addInitScript(fs.readFileSync(INIT, "utf8"));
    await p.goto(url, { waitUntil: "networkidle" });
    const tr = await p.evaluate(async (seed) => {
      const net = await import("./js/net.js"),
        { botActions } = await import("./js/bots.js"),
        LY = await import("./js/hangout/layout.js");
      window.__fake = true;
      window.__now = 1.8e12;
      window.__seed(seed);
      const r = net.createLocalRoom({ name: "J", test: true, computers: 0 });
      r.close();
      const beat = () => {
        window.__now += 200;
        r.send({ t: "tick", id: r.me });
        for (const a of botActions(r.state, window.__now)) r.send(a);
      };
      r.send({
        t: "options",
        options: {
          modePick: "",
          mapPick: "",
          botWait: 1,
          mode: "l4dd",
        },
      });
      r.send({ t: "start" });
      for (let k = 0; k < 600 && r.state.phase !== "hang"; k++) beat();
      const J = "b-justin",
        tr = [],
        keep = {};
      for (let n = 0; n < 600; n++) {
        const s = r.state,
          me = s.pos[r.me],
          l4p = s.hang.l4p || {};
        s.pos = { ...s.pos, [r.me]: { ...me, x: 880 / LY.W, y: 1420 / LY.H } };
        for (const id of [r.me, J])
          if (l4p[id] && !keep[id]) keep[id] = l4p[id];
        s.hang = { ...s.hang, l4p: { ...l4p, ...keep } };
        if (s.hang.l4 && s.hang.l4.wait && !(s.hang.l4.wait.v || {})[r.me])
          r.send({ t: "hang", k: "l4", do: "endturn", on: true, id: r.me });
        beat();
        const q = r.state.pos[J];
        if (q) tr.push([q.x * LY.W, q.y * LY.H]);
      }
      window.__fake = false;
      return tr;
    }, seed);
    let back = 0;
    for (let i = 2; i < tr.length; i++) {
      const ax = tr[i - 1][0] - tr[i - 2][0],
        ay = tr[i - 1][1] - tr[i - 2][1],
        bx = tr[i][0] - tr[i - 1][0],
        by = tr[i][1] - tr[i - 1][1],
        la = Math.hypot(ax, ay),
        lb = Math.hypot(bx, by);
      if (la > 2 && lb > 2 && (ax * bx + ay * by) / (la * lb) < -0.5) back++;
    }
    if (tr.length < 500)
      fail(`seed ${seed}: Justin was out only ${tr.length} of 600 beats`);
    if (back > MOST)
      fail(
        `seed ${seed}: Justin stepped straight back ${back} times in 600 beats (jitter)`,
      );
    console.log(
      `jjitter seed ${seed}: ${back} steps back in ${tr.length} beats`,
    );
    await p.close();
  }
  noErrors(errs);
  await b.close();
})();
