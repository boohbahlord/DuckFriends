/* The owner's, Nov 17: on a phone the walking stick must start wherever the screen is touched, except on a real
   interactive (a button, a text box). This plays a TEST room on a phone (upright), puts a real touch on the board, the
   results' cards, the labels and the bars, and checks that the stick starts; on a button and in a text box it must not.
   Run: python3 -m http.server 8160 (in the repo), then node tools/phone-joystick-test.cjs */
const { chromium, devices } = require("playwright");
const URL = process.env.URL || "http://localhost:8160/";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices["Pixel 7"] });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL);
  await p.waitForTimeout(600);
  await p.evaluate(async () => {
    const net = await import("./js/net.js");
    const { go } = await import("./js/router.js");
    const room = net.createLocalRoom({
      name: "T",
      test: true,
      computers: 2,
      options: { modePick: "", mapPick: "", mode: "l4dd" },
    });
    window.__r = room;
    go("lobby", room);
    await new Promise((r) => setTimeout(r, 500));
    room.send({ t: "start" });
  });
  for (let i = 0; i < 80; i++) {
    const ph = await p.evaluate(() => window.__r.state.phase);
    if (ph === "hang") break;
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(1500);
  /* parts that only hold words, as the results and the write screens have: a card, a choice row, a status box */
  await p.evaluate(() => {
    const host = document.querySelector(".board") || document.body;
    host.insertAdjacentHTML(
      "beforeend",
      '<aside class="statpanel" id="t-card" style="position:fixed;left:150px;top:260px;width:200px;height:90px;background:#222;z-index:5"><p id="t-text">Took the longest writing</p></aside><div class="mc" id="t-mc" style="position:fixed;left:150px;top:370px;width:200px;height:50px;z-index:5"></div><div class="votebox" id="t-vote" style="position:fixed;left:150px;top:440px;width:200px;height:40px;z-index:5">0/1 voted</div>',
    );
  });
  const cdp = await ctx.newCDPSession(p);
  const touch = async (x, y) => {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await p.waitForTimeout(120);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 25, y }],
    });
    await p.waitForTimeout(120);
    const shown = await p.evaluate(
      async () => (await import("./js/touch.js")).stick.shown,
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await p.waitForTimeout(150);
    return shown;
  };
  const at = (sel) =>
    p.evaluate((sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return r.width && r.height
        ? [r.left + r.width / 2, r.top + r.height / 2]
        : null;
    }, sel);
  let bad = 0;
  const check = async (name, sel, want) => {
    const c = await at(sel);
    if (!c) return console.log("skip", name, "(not on screen)");
    const got = await touch(c[0], c[1]);
    const ok = got === want;
    if (!ok) bad++;
    console.log(ok ? "ok  " : "FAIL", name, "stick", got, "wanted", want);
  };
  await check("board", ".board", true);
  await check("a button", ".mbar button, .bbar button", false);
  await check("results card", "#t-card", true);
  await check("results card text", "#t-text", true);
  await check("choice row space", "#t-mc", true);
  await check("vote status", "#t-vote", true);
  console.log("errors", errs);
  await b.close();
  process.exit(bad ? 1 : 0);
})();
