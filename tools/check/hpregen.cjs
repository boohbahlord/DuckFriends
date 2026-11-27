/* I want HP to come back on its own smoothly (B7, the owner's, Nov 21 16:17Z: "it doesn't wait for an entire health
   point until it comes back ... split into fractions ... of either a 10th or 100th place ... for players"; Nov 22
   06:24Z: "that HP isn't like darkened out while it regens anymore"): in Dead Ducks Arcade a duck at 1.5 HP is back
   about a fifteenth of an HP each second (one HP in L4.REGEN, as ever), in hundredths, and my meter shows no faint
   regen part, only its blocks filling. Run: node tools/check/run.mjs hpregen */
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
    ).createLocalRoom({ name: "T", test: true, computers: 1 });
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
      !document.querySelector(".veil[data-on]") &&
      window._r.state.hang?.l4p?.[window._r.me],
    null,
    { timeout: 120000, polling: 250 },
  );
  await p.waitForTimeout(1500);
  const seen = await p.evaluate(async () => {
    const r = window._r,
      { now } = await import("./js/clock.js"),
      { L4 } = await import("./js/l4ddrules.js"),
      l4p = r.state.hang.l4p,
      t0 = now();
    r.state.hang.l4p = { ...l4p, [r.me]: { ...l4p[r.me], hp: 1.5, at: t0 } };
    const out = [];
    for (let i = 0; i < 16; i++) {
      await new Promise((q) => setTimeout(q, 250));
      const m = document.querySelector(".hpm.mine, .hpm");
      out.push({
        t: now() - t0,
        hp: r.state.hang.l4p[r.me].hp,
        ghost:
          !!m &&
          [...m.querySelectorAll(".hpm-blocks i")].some((e) =>
            e.style.getPropertyValue("--g1"),
          ),
      });
    }
    return { out, ms: L4.REGEN };
  });
  const last = seen.out[seen.out.length - 1],
    want = 1.5 + last.t / seen.ms,
    steps = new Set(seen.out.map((o) => o.hp)).size;
  if (Math.abs(last.hp - want) > 0.05)
    fail(
      `after ${Math.round(last.t)} ms at 1.5 HP: ${last.hp}, not about ${want.toFixed(2)}`,
    );
  if (steps < 8)
    fail(
      `HP came back in ${steps} steps in 4 s, not smoothly: ${JSON.stringify(seen.out)}`,
    );
  if (seen.out.some((o) => Math.round(o.hp * 100) !== o.hp * 100))
    fail(`HP not in hundredths: ${seen.out.map((o) => o.hp)}`);
  if (seen.out.some((o) => o.ghost))
    fail("my meter still shows a faint regen part");
  noErrors(errs);
  console.log(
    `hpregen: 1.5 → ${last.hp} in ${Math.round(last.t)} ms, ${steps} steps`,
  );
  await b.close();
})();
