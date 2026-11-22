/* I want a pick to skip its vote (the owner's, Nov 22): in Game Settings on a phone, one tap on a game mode or on a map
   picks it at once (a built-in one, and a map made on this device, tapped in My maps), turns that vote off, the lobby
   says the pick and never "Vote", and the game then starts on them with no vote screen. */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(C.url, { waitUntil: "networkidle" });
  await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      router = await import("./js/router.js");
    window.__room = net.createLocalRoom({
      name: "T",
      test: true,
      computers: 3,
    });
    router.go("lobby", window.__room);
  });
  await p.waitForSelector('[data-m="settings"]');
  const o = () => p.evaluate(() => window.__room.state.options);
  const val = () => p.textContent('[data-m="settings"] .val');
  const wait = (ms) => p.waitForTimeout(ms);
  const first = await o();
  if (first.modePick !== "vote" || first.mapPick !== "vote")
    C.fail("a new room should vote for the game and the map first");
  await p.tap('[data-m="settings"]');
  await p.waitForSelector(".win-gs");
  // a map, in Game Settings
  await p.tap('.win-gs .arm-row[data-p="map"]');
  await p.waitForSelector('.win-gs .arm-row[data-map="pixel"]');
  await p.tap('.win-gs .arm-row[data-map="pixel"]');
  await wait(300);
  let s = await o();
  if (s.map !== "pixel" || s.mapPick !== "")
    C.fail(`one tap on a map should pick it: ${s.map} / "${s.mapPick}"`);
  // a map made on this device, tapped in My maps
  const id = await p.evaluate(async () => {
    const u = await import("./js/umaps.js");
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const m = await u.mapFromObj({
      t: "Pandat",
      de: "My own map",
      d: png,
      ui: "",
    });
    return m.id;
  });
  await p.tap(".win-gs .arm-row[data-umaps]");
  await p.waitForSelector(".um-list-win .um-item");
  await p.tap(`.um-list-win .um-item[data-id="${id}"] .um-say b`);
  await wait(500);
  s = await o();
  if (s.map !== id || s.mapPick !== "")
    C.fail(`one tap on my map should pick it: ${s.map} / "${s.mapPick}"`);
  // a game mode
  await p.keyboard.press("Escape"); // (My maps closes; Game Settings stays)
  await wait(300);
  await p.evaluate(() =>
    document.querySelector('.win-gs [data-a="back"]')?.click(),
  );
  await wait(300);
  await p.tap('.win-gs .arm-row[data-p="mode"]');
  await p.waitForSelector('.win-gs .arm-row[data-mode="wyr"]');
  await p.tap('.win-gs .arm-row[data-mode="wyr"]');
  await wait(300);
  s = await o();
  if (s.mode !== "wyr" || s.modePick !== "")
    C.fail(
      `one tap on a game mode should pick it: ${s.mode} / "${s.modePick}"`,
    );
  const rows = await p.evaluate(() =>
    ["mode", "map"].map(
      (k) =>
        document.querySelector(`.win-gs .arm-row[data-p="${k}"]`)
          ?.textContent || "",
    ),
  );
  if (rows.some((x) => /vote/i.test(x)))
    C.fail(`Game Settings still says Vote for a pick: ${rows.join(" | ")}`);
  const art = await p.evaluate(
    () => document.querySelector(".lobby-art")?.textContent || "",
  );
  if (!art.includes("Pandat"))
    C.fail(`the lobby's picture is not the picked map: ${art.slice(0, 80)}`);
  const say = await val();
  if (/vote/i.test(say)) C.fail(`the lobby still says vote: ${say}`);
  // the game starts on them, with no vote screen
  await p.evaluate(() => window.__room.send({ t: "start" }));
  await wait(1500);
  const st = await p.evaluate(() => {
    const s = window.__room.state;
    return { vt: !!s.vt, mode: s.options.mode, map: s.options.map };
  });
  if (st.vt) C.fail("a vote screen came up although both were picked");
  if (st.mode !== "wyr" || st.map !== id)
    C.fail(`the game did not start on the picks: ${st.mode} / ${st.map}`);
  C.noErrors(errs);
  await b.close();
})();
