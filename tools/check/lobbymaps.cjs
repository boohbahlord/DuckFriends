/* I want the three map bugs of Nov 22 19:13Z kept fixed (the owner: "WHY THE FUCK IS IT THAT SCROLLING THROUGH LOBBY
   MAKES A NEW LOADING SCREEN FOR EVERY SCROLL", "WHY THE FUCK AM I BEING ASKED TO VOTE FOR MAP BACKGROUND ON A SANDBOX
   SAVE ALREADY MADE?", "WHY THE FUCK CAN I NOT CHANGE MAP IMAGE FOR BOARD"):
   1. scrolling and arrowing through Game Settings' maps in the lobby, pictures slow to come, brings no loading screen;
   2. a Sandbox save made on a map goes straight in on that map, with the map vote on: no vote;
   3. My maps' Play it changes the map, its picture in Game Settings' preview too, in the lobby and mid-game in Sandbox
      on the board (the board then shows the made map).
   Run: node tools/check/run.mjs lobbymaps */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const PNG2 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
const room = (p, options) =>
  p.evaluate(async (options) => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 1 });
    window._r = r;
    r.send({ t: "options", options });
    (await import("./js/router.js")).go("lobby", r);
    window._veils = 0;
    let on = false;
    new MutationObserver(() => {
      const v = !!document.querySelector(".loading[data-on='1']");
      if (v && !on) window._veils++;
      on = v;
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-on", "class"],
    });
  }, options);
(async () => {
  const b = await chromium.launch(),
    errs = [];
  const page = async () => {
    const p = await (
      await b.newContext({
        viewport: { width: 1366, height: 768 },
        serviceWorkers: "block",
      })
    ).newPage();
    p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto(C.url);
    await p.waitForTimeout(1500);
    return p;
  };

  /* 1. scrolling the maps, pictures slow to come */
  let p = await page();
  await p.route(/\.(png|webp|jpg)(\?.*)?$/, async (r) => {
    await new Promise((ok) => setTimeout(ok, 600));
    r.continue();
  });
  await room(p, { modePick: "host", mapPick: "host" });
  await p.waitForTimeout(2500);
  await p.click('[data-m="settings"]');
  await p.waitForSelector(".win-gs");
  await p.waitForTimeout(2000);
  const v0 = await p.evaluate(() => window._veils);
  await p.click('.win-gs .arm-row[data-p="map"]');
  await p.waitForTimeout(1500);
  const box = await p.locator(".win-gs .arm-list").last().boundingBox();
  await p.mouse.move(box.x + 60, box.y + 20);
  for (let i = 0; i < 8; i++) {
    await p.mouse.wheel(0, 60);
    await p.waitForTimeout(500);
  }
  for (let i = 0; i < 6; i++) {
    await p.keyboard.press("ArrowDown");
    await p.waitForTimeout(500);
  }
  const v1 = await p.evaluate(() => window._veils);
  if (v1 !== v0)
    C.fail(
      `lobbymaps: scrolling Game Settings' maps brought ${v1 - v0} loading screens`,
    );
  await p.close();

  /* 2. a save made on a map: no map vote */
  p = await page();
  await room(p, {
    modePick: "host",
    mapPick: "vote",
    mode: "sandbox",
    botWait: 1,
  });
  const save = await p.evaluate(async () => {
    const r = window._r,
      w8 = (ms) => new Promise((ok) => setTimeout(ok, ms));
    r.send({ t: "start" });
    for (let i = 0; i < 100 && !r.state.sbpk; i++) await w8(200);
    r.send({
      t: "sbPick",
      save: {
        id: "chk1",
        name: "On Pixel",
        made: 1,
        data: {
          v: 3,
          parts: { sb: { pts: {}, n: 0 } },
          back: {},
          options: {},
          who: {},
          music: { off: [] },
          world: "",
          map: "pixel",
        },
      },
    });
    let vote = false;
    for (let i = 0; i < 100 && r.state.phase !== "sandbox"; i++) {
      if (r.state.vt && r.state.vt.k === "map") vote = true;
      await w8(100);
    }
    return [vote, r.state.phase, r.state.options.map];
  });
  if (JSON.stringify(save) !== JSON.stringify([false, "sandbox", "pixel"]))
    C.fail(
      `lobbymaps: a save on Pixel (map vote?, phase, map): ${JSON.stringify(save)}`,
    );
  await p.close();

  /* 3. My maps' Play it: in the lobby (Game Settings' preview follows), then mid-game in Sandbox on the board */
  p = await page();
  await room(p, {
    modePick: "host",
    mapPick: "host",
    mode: "sandbox",
    map: "night",
    botWait: 1,
  });
  const ids = await p.evaluate(
    async ([a, b]) => {
      const u = await import("./js/umaps.js");
      const m1 = await u.mapFromObj({ t: "One", de: "", d: a, ui: "" }),
        m2 = await u.mapFromObj({ t: "Two", de: "", d: b, ui: "" });
      return [m1.id, m2.id];
    },
    [PNG, PNG2],
  );
  await p.click('[data-m="settings"]');
  await p.waitForSelector(".win-gs");
  await p.click('.win-gs .arm-row[data-p="map"]');
  await p.waitForTimeout(500);
  const play = async (id) => {
    await p.click(".win-gs .arm-row[data-umaps]");
    await p.waitForSelector(
      `.um-list-win .um-item[data-id="${id}"] [data-play]`,
    );
    await p.click(`.um-list-win .um-item[data-id="${id}"] [data-play]`);
    await p.waitForTimeout(500);
    await p.click(".um-list-win .win-x");
    await p.waitForTimeout(400);
    return p.evaluate(() => [
      window._r.state.options.map,
      (document.querySelector(".win-gs .gs-stage h3") || {}).textContent,
    ]);
  };
  await p.hover(`.win-gs .arm-row[data-map="${ids[0]}"]`); // (the preview on the first, then the second picked from My maps)
  const l1 = await play(ids[1]);
  if (l1[0] !== ids[1] || l1[1] !== "Two")
    C.fail(
      `lobbymaps: lobby Play it (map, preview is the second's): ${l1[0]} ${l1[1]}`,
    );
  await p.keyboard.press("Escape");
  await p.evaluate(async () => {
    const r = window._r,
      w8 = (ms) => new Promise((ok) => setTimeout(ok, ms));
    r.send({ t: "start" });
    for (let i = 0; i < 100 && !r.state.sbpk; i++) await w8(200);
    r.send({ t: "sbPick" });
    for (let i = 0; i < 100 && r.state.phase !== "sandbox"; i++) await w8(200);
    await w8(1500);
    (await import("./js/gamesettings.js")).openGameSettings(r);
  });
  await p.waitForSelector(".win-gs");
  await p.click('.win-gs .arm-row[data-p="map"]');
  await p.waitForTimeout(500);
  const g1 = await play(ids[0]);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(1500);
  const board = await p.evaluate(
    () => !!document.querySelector(".scene canvas.made-px"),
  );
  if (g1[0] !== ids[0] || g1[1] !== "One" || !board)
    C.fail(
      `lobbymaps: mid-game Play it (map, preview, board): ${g1[0]} ${g1[1]} ${board}`,
    );
  await p.close();
  await b.close();
  C.noErrors(errs);
})();
