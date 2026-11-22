/* I want Safe Keeping to be picked like any other slot in Dead Ducks Arcade (the owner, Nov 21: "when you scroll over it, it
   just skips it. Don't allow that … Clicking it will just give a small little text … the text chat in the bottom left"). With
   it in my hotbar: its number key picks it, the scroll wheel stops on it, and a left click says what it does in the chat, every
   time, one line for a lone duck and another with 2 or more ducks. */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
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
  await p.waitForTimeout(2500);
  /* Safe Keeping in the first item slot (key 5: js/kitslots.js), nothing else there */
  await p.evaluate(() => {
    const r = window._r,
      a = r.state.hang.l4a[r.me];
    r.state.hang.l4a = {
      ...r.state.hang.l4a,
      [r.me]: { ...a, sl: a.sl.map((w, i) => (i === 4 ? "safekeep" : w)) },
    };
  });
  await p.waitForTimeout(600);
  const slot = () =>
    p.evaluate(() => {
      const el = document.querySelector(".l4bar .l4s.sel");
      return el ? el.dataset.l4w : "";
    });
  const hand = () =>
    p.evaluate(
      async () =>
        (await import("./js/l4ddrules.js")).slotsOf(
          window._r.state,
          window._r.me,
        )[4],
    );
  if ((await hand()) !== "safekeep")
    fail("Safe Keeping did not get into the slot");
  const notes = () =>
    p.evaluate(() =>
      [
        ...document.querySelectorAll(".chat-float .cf-sys, .chat-log p.note"),
      ].map((e) => e.textContent),
    );
  /* the number key picks it */
  await p.keyboard.press("Digit5");
  await p.waitForTimeout(300);
  const picked = await slot();
  /* the wheel from the melee weapon stops on it (the pistol, the empty primaries skipped, then the item) */
  await p.keyboard.press("Digit1");
  const seen = new Set();
  for (let i = 0; i < 6; i++) {
    await p.mouse.move(700, 400);
    await p.mouse.wheel(0, 100);
    await p.waitForTimeout(160);
    seen.add(await slot());
  }
  /* a left click on the board with it in hand: the lone duck's line, again each click (from the knife: the wheel may
     have stopped on it, and its key again would put it away) */
  await p.keyboard.press("Digit1");
  await p.waitForTimeout(200);
  await p.keyboard.press("Digit5");
  await p.waitForTimeout(200);
  for (let i = 0; i < 2; i++) {
    await p.mouse.click(700, 400);
    await p.waitForTimeout(300);
  }
  const lone = await notes();
  /* two ducks: another player in the lobby */
  await p.evaluate(() => {
    const s = window._r.state;
    s.seat = [...s.seat, "x-friend"];
    s.players = {
      ...s.players,
      "x-friend": { ...s.players[window._r.me], id: "x-friend", bot: false },
    };
  });
  await p.mouse.click(700, 400);
  await p.waitForTimeout(300);
  const both = await notes();
  await b.close();
  noErrors(errs);
  const said = [...new Set([...lone, ...both])].filter((t) =>
    /Safe Keeping/.test(t),
  );
  if (lone.filter((t) => /Safe Keeping/.test(t)).length < 2)
    fail(
      "a click with Safe Keeping in hand did not post its line each time: " +
        JSON.stringify(lone),
    );
  if (said.length < 2)
    fail(
      "one line for a lone duck and another for 2 or more were not both said: " +
        JSON.stringify(said),
    );
  if (
    !said.some((t) => /by yourself, and/.test(t)) ||
    !said.some((t) => /friend/.test(t))
  )
    fail("the two lines are wrong: " + JSON.stringify(said));
  if (picked !== "4") fail("its number key did not pick it: " + picked);
  if (!seen.has("4")) fail("the scroll wheel skipped it: " + [...seen]);
})();
