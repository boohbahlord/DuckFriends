/* I want the board's H to open my hotbar's window, the same one as Sandbox's h (P5, the owner's, Nov 21 18:59Z: "just
   click H for hotbar and you change only your hotbar ... if ... it's empty, it like flashes with a text over their
   hotbar saying to click H"). On Agree or Disagree's board, my hotbar empty: a number key flashes "Press H"; H opens the
   window; a loot and key 1 put it on my key 1 (my profile's, as Customize does); Esc closes it without the pause menu.
   On a phone held upright (Hangout) the small H sits in the jump button's column and opens it too. */
const { chromium } = require("playwright");
const C = require("./lib.cjs");
async function board(p, mode, map) {
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  await p.evaluate(
    async ([mode, map]) => {
      const st = await import("./js/store.js");
      st.profile.duck.keys = Array(10).fill(null); // (my hotbar empty)
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 0 });
      window._r = r;
      r.send({
        t: "options",
        options: { modePick: "host", mapPick: "host", mode, map, botWait: 1 },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.send({ t: "start" });
      for (
        let i = 0;
        i < 300 && r.state.phase !== "submit" && mode === "aod";
        i++
      )
        await new Promise((ok) => setTimeout(ok, 100));
      if (mode === "aod") r.send({ t: "submit", text: "Ducks can fly" }); // (my question: the board comes next)
      const { boardPhases } = await import("./js/rules.js");
      for (
        let i = 0;
        i < 300 && !boardPhases(r.state).includes(r.state.phase);
        i++
      )
        await new Promise((ok) => setTimeout(ok, 100));
    },
    [mode, map],
  );
  /* the game screen up with its hotbar before any key (on a loaded machine the board can take longer than a fixed wait) */
  await p
    .waitForFunction(
      () =>
        document.body.dataset.screen === "game" &&
        !document.querySelector(".veil[data-on]") &&
        !!document.querySelector(".hotbar"),
      null,
      { timeout: 30000 },
    )
    .catch(() => {});
  await p.waitForTimeout(1500);
}
const win = (p) =>
  p.evaluate(() => {
    const w = document.querySelector(".sb-hotwin");
    return !!w && !w.hidden;
  });
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  p.on("pageerror", (e) => errs.push(String(e)));
  await board(p, "aod", "night");
  const ph = await p.evaluate(() => window._r.state.phase);
  await p.keyboard.press("Digit2");
  await p.waitForTimeout(100);
  const tip = await p.evaluate(() => {
    const t = document.querySelector(".hotbar .hk-tip");
    return t ? t.textContent : "";
  });
  await p.keyboard.press("KeyH");
  await p.waitForTimeout(300);
  const opened = await win(p);
  const first = await p.evaluate(() => {
    const l = document.querySelector(".sb-hotwin .sb-lt");
    return l ? l.dataset.v : "";
  });
  await p.click(".sb-hotwin .sb-lt");
  await p.click('.sb-hotwin .sp-key[data-i="0"]');
  await p.waitForTimeout(400);
  const put = await p.evaluate(async () => {
    const st = await import("./js/store.js"),
      me = window._r.state.players[window._r.me];
    return [st.profile.duck.keys[0], ((me && me.duck) || {}).keys?.[0] || null];
  });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  const after = [
    await win(p),
    await p.evaluate(() => !!document.querySelector(".pause-list")),
  ];
  await p.close();
  /* a phone held upright: the H button */
  const q = await b.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  q.on("pageerror", (e) => errs.push(String(e)));
  await board(q, "hang", "cabin");
  await q
    .waitForFunction(
      () => {
        const h = document.querySelector(".tpad-hot");
        return !!h && !h.hidden && h.getBoundingClientRect().width > 0;
      },
      null,
      { timeout: 30000 },
    )
    .catch(async () =>
      console.log(
        "boardhot: the phone's pad never came up (phase, mode, screen, H there):",
        await q.evaluate(() => [
          window._r.state.phase,
          window._r.state.options.mode,
          document.body.dataset.screen,
          !!document.querySelector(".tpad-hot"),
        ]),
      ),
    ); // (a phone's pad: its buttons up first)
  const btn = await q.evaluate(() => {
    const h = document.querySelector(".tpad-hot"),
      j = document.querySelector(".tpad-jump");
    if (!h || h.hidden) return null;
    const a = h.getBoundingClientRect(),
      c = j.getBoundingClientRect(),
      col = h.parentElement.classList.contains("tpad-col"),
      /* nothing else on the screen under its middle */
      top = document.elementFromPoint(a.x + a.width / 2, a.y + a.height / 2);
    return { col, over: a.bottom <= c.top + 0.5, top: top === h };
  });
  await q.tap(".tpad-hot");
  await q.waitForTimeout(300);
  const phone = await win(q);
  console.log(
    "boardhot",
    JSON.stringify({ ph, tip, opened, first, put, after, btn, phone }),
  );
  if (tip !== "Press H")
    C.fail(`an empty key flashed ${JSON.stringify(tip)}, not "Press H"`);
  if (!opened) C.fail("H didn't open the hotbar window on the board");
  if (!first || put[0] !== first || put[1] !== first)
    C.fail(`the loot ${first} didn't go on key 1: ${JSON.stringify(put)}`);
  if (after[0] || after[1])
    C.fail(`Esc: window ${after[0]}, pause ${after[1]}`);
  if (!btn || !btn.col || !btn.over || !btn.top)
    C.fail(`the phone's H: ${JSON.stringify(btn)}`);
  if (!phone) C.fail("the phone's H didn't open the window");
  C.noErrors(errs);
  await b.close();
})().catch((e) => {
  // (a step that threw, a click that found nothing: said as a failure, never a bare crash)
  C.fail("boardhot stopped: " + String(e).split("\n")[0].slice(0, 200));
  process.exit(1);
});
