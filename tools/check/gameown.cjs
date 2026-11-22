/* I want the game's own game modes (owner card, Nov 22 16:06Z: "Ship them in the game") checked with a tiny one made
   here: a Sandbox with one zone and 3 lives, served as modes/tiny-test.json. It lists first under Game Settings'
   Custom (marked Built in, on a phone too, in one line), next to a mode of this device's with the same name (that one
   gets "(2)"), can't be deleted, hands out a copy of its data each time, and plays from the lobby the same way
   as the device's own (gmodes.js autoPick, readMode). Run: node tools/check/run.mjs gameown */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const W = (ms) => new Promise((r) => setTimeout(r, ms));
const room = async (p, options) =>
  p.evaluate(async (options) => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 1 });
    window._r = r;
    r.send({ t: "options", options });
    (await import("./js/router.js")).go("lobby", r);
  }, options);
(async () => {
  const b = await chromium.launch(),
    errs = [];
  /* the tiny mode: a Sandbox as it is, one zone and 3 lives */
  let p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  p.on("pageerror", (e) => errs.push("make: " + e));
  await p.goto(C.url);
  await W(1500);
  await room(p, {
    modePick: "host",
    mapPick: "host",
    mode: "sandbox",
    map: "night",
    botWait: 1,
  });
  const file = await p.evaluate(async () => {
    const R = window._r,
      w8 = (ms) => new Promise((r) => setTimeout(r, ms));
    R.state.zmapAsked = 1;
    R.send({ t: "start" });
    for (let i = 0; i < 100 && !R.state.sbpk; i++) await w8(200);
    R.send({ t: "sbPick" });
    for (let i = 0; i < 100 && !(R.state.sb && R.state.pos[R.me]); i++)
      await w8(200);
    await w8(1500);
    const me = R.state.pos[R.me];
    R.send({ t: "sb", k: "add", kind: "zone", x: me.x, y: me.y });
    R.send({ t: "sbr", k: "lives", v: "3" });
    await w8(600);
    const data = (await import("./js/sbsave.js")).sbSnapshot(R.state);
    return {
      name: "Tiny Test",
      desc: "Built for the check.",
      most: 3,
      world: data.world,
      map: data.map,
      data,
    };
  });
  await p.close();
  const zones = Object.keys(file.data.parts.sb.pts || {}).length;
  if (!zones) C.fail("gameown: the tiny mode has no zone");

  for (const vp of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    const tag = "w" + vp.width;
    p = await (
      await b.newContext({ viewport: vp, serviceWorkers: "block" })
    ) // (the offline worker's fetches skip page routes)
      .newPage();
    p.on("pageerror", (e) => errs.push(tag + ": " + e));
    p.on(
      "console",
      (m) => m.type() === "error" && errs.push(tag + ": " + m.text()),
    );
    await p.route("**/modes/index.json", (r) =>
      r.fulfill({ json: ["tiny-test.json"] }),
    );
    await p.route("**/modes/tiny-test.json", (r) => r.fulfill({ json: file }));
    await p.goto(C.url);
    await W(1500);
    const got = await p.evaluate(async (file) => {
      const G = await import("./js/gmodes.js"),
        o = {};
      o.dup = await G.addMode({ ...file, desc: "Mine." });
      await G.deleteMode("game:tiny-test");
      const all = await G.listModes();
      o.list = all.map(
        (m) =>
          `${m.id.startsWith("game:") ? m.id : "mine"}:${m.name}:${!!m.game}`,
      );
      const m = await G.readMode("game:tiny-test");
      m.data.parts.sb.pts = {}; // (a copy: the file as read stays as it is)
      o.again = Object.keys(
        (await G.readMode("game:tiny-test")).data.parts.sb.pts,
      ).length;
      return o;
    }, file);
    const want = {
      dup: "Tiny Test (2)",
      list: ["game:tiny-test:Tiny Test:true", "mine:Tiny Test (2):false"],
      again: zones,
    };
    if (JSON.stringify(got) !== JSON.stringify(want))
      C.fail(
        `gameown ${tag}: ${JSON.stringify(got)} (was ${JSON.stringify(want)})`,
      );

    /* Game Settings: Custom lists it first, marked Built in, in one line */
    await room(p, { modePick: "host", mapPick: "host", botWait: 1 });
    await p.waitForSelector('[data-m="settings"]');
    await p.click('[data-m="settings"]');
    await p.waitForSelector(".win-gs");
    await p.click('.win-gs .arm-row[data-p="mode"]');
    await p.waitForSelector('.win-gs [data-fold="cat:custom"]');
    const gs = await p.evaluate(() => {
      const f = document.querySelector('.win-gs [data-fold="cat:custom"]');
      f.open = true;
      const rows = [...f.querySelectorAll(".arm-row")],
        r = rows[0];
      return {
        first: r.dataset.gm,
        val: r.querySelector(".val").textContent,
        fits: r.scrollWidth <= r.clientWidth + 1 && r.offsetHeight < 60,
        n: rows.length,
      };
    });
    if (
      gs.first !== "game:tiny-test" ||
      gs.val !== "Built in" ||
      !gs.fits ||
      gs.n !== 2
    )
      C.fail(`gameown ${tag} Custom: ${JSON.stringify(gs)}`);
    await p.click('.win-gs [data-gm="game:tiny-test"]');
    await W(400);
    const card = await p.evaluate(() => {
      const o = window._r.state.options,
        t = document.querySelector(".win-gs .gs-text");
      return [o.mode, o.gm, o.gmName, o.gmMost, t ? t.textContent : ""];
    });
    if (
      card[0] !== "sandbox" ||
      card[1] !== "game:tiny-test" ||
      card[2] !== "Tiny Test" ||
      card[3] !== 3
    )
      C.fail(`gameown ${tag} pick: ${JSON.stringify(card)}`);
    if (
      vp.width > 1000 &&
      !/Comes with the game\. Up to 3 players/.test(card[4])
    )
      C.fail(`gameown ${tag} card: ${card[4]}`);
    await p.keyboard.press("Escape");
    await W(300);

    /* it plays from the lobby */
    const play = await p.evaluate(async () => {
      const R = window._r,
        w8 = (ms) => new Promise((r) => setTimeout(r, ms));
      R.state.zmapAsked = 1;
      R.send({ t: "start" });
      for (let i = 0; i < 100 && !R.state.gmPlay; i++) await w8(200);
      await w8(800);
      const s = R.state;
      return [
        !!s.gmPlay,
        Object.keys((s.sb && s.sb.pts) || {}).length,
        (await import("./js/sandboxrules.js")).sbRule(s, "lives"),
        !!document.querySelector(".sbp-new"),
      ];
    });
    if (JSON.stringify(play) !== JSON.stringify([true, zones, 3, false]))
      C.fail(`gameown ${tag} play: ${JSON.stringify(play)}`);
    await p.evaluate(async () => {
      const G = await import("./js/gmodes.js");
      for (const m of await G.listModes()) await G.deleteMode(m.id);
    });
    await p.close();
  }
  await b.close();
  C.noErrors(errs);
})();
