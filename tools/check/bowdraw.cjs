/* I want the bow drawn to shoot checked (K2b, js/bowdraw.js; the owner's, Nov 21 17:48Z: "You don't auto-shoot the bow
   anymore. You only pull it back to shoot ... every 1/2 second that it's pulled back, it does a guarantee of +1 damage
   ... it shows that in your cooldown meter ... light red ... dark red"; 18:05Z: full at 2.5 s, a sure crit; 18:16Z: up
   to 40% faster):
   1. a draw of 0.5 s adds 1 damage (0.2 a whole tenth), 2.5 s adds 5 and is a sure crit, 1 s is 25%; the arrow flies
      up to 40% faster;
   2. in Dead Ducks Arcade, the left button held with the bow out fires nothing while held, the white bar under my duck
      fills red, and letting go shoots one arrow carrying its draw (about 1 s), a little faster;
   3. a computer player's arrow, never drawn, carries no draw (its arrows as before).
   Run: node tools/check/run.mjs bowdraw */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
  await p.goto(url);
  await p.waitForTimeout(2500);
  const t = await p.evaluate(async () => {
    const B = await import("./js/bowdraw.js");
    return {
      dmg: [0, 99, 100, 499, 500, 1000, 2500].map(B.drawDmg),
      crit: [0, 1000, 2000, 2499, 2500].map(B.drawCrit),
      fast: [0, 1250, 2500].map(B.drawFast),
    };
  });
  const same = (a, c) => JSON.stringify(a) === JSON.stringify(c);
  if (!same(t.dmg, [0, 0, 0.2, 0.8, 1, 2, 5]))
    fail("a draw's damage: " + t.dmg);
  if (!same(t.crit, [0, 0.25, 0.5, 0.62475, 1]))
    fail("a draw's crit: " + t.crit);
  if (!same(t.fast, [1, 1.2, 1.4])) fail("a draw's speed: " + t.fast);
  /* Dead Ducks Arcade */
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
        l4map: "cabin",
        botWait: 1,
        wildJustin: 0,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
  });
  for (let i = 0; i < 300; i++) {
    const s = await p.evaluate(
      () =>
        document.body.dataset.screen === "game" &&
        !document.querySelector(".veil[data-on]"),
    );
    if (s) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    const r = window._r,
      R = await import("./js/l4ddrules.js");
    R.give(r.state, r.me, "bow", "knife");
  });
  await p.keyboard.press("Digit2");
  await p.waitForTimeout(300);
  const arrows = () =>
    p.evaluate(() =>
      (window._r.state.shots || [])
        .filter((s) => s.k === "arrow" && s.by === window._r.me)
        .map((s) => ({ n: s.n, dr: s.dr, v: Math.hypot(s.vx, s.vy) })),
    );
  const before = (await arrows()).length;
  await p.mouse.move(900, 300);
  await p.mouse.down();
  await p.waitForTimeout(1000);
  const mid = await p.evaluate(() => {
    const el = document.querySelector(".gduck.mine .l4-cool, .l4-cool.draw");
    return {
      draw: !!(el && el.classList.contains("draw")),
      cl: el ? +el.style.getPropertyValue("--cl") : -1,
      shots: (window._r.state.shots || []).filter(
        (s) => s.k === "arrow" && s.by === window._r.me,
      ).length,
    };
  });
  await p.mouse.up();
  await p.waitForTimeout(150);
  const got = (await arrows()).slice(before);
  const bot = await p.evaluate(async () => {
    const r = window._r,
      R = await import("./js/l4ddrules.js"),
      id = r.state.seat.find((q) => q !== r.me);
    R.give(r.state, id, "bow", "knife");
    r.state.pos[id] = { ...r.state.pos[id], w: "bow" };
    r.send({ t: "use", what: "bow", ax: 1, ay: 0, face: 1, id });
    return (r.state.shots || [])
      .filter((s) => s.k === "arrow" && s.by === id)
      .map((s) => s.dr);
  });
  await b.close();
  noErrors(errs);
  if (mid.shots !== before)
    fail("the bow shot while still drawn: " + JSON.stringify(mid));
  if (!mid.draw || !(mid.cl > 0.3 && mid.cl < 0.55))
    fail("the white bar while drawing: " + JSON.stringify(mid));
  if (got.length !== 1 || !(got[0].dr >= 900 && got[0].dr <= 1300))
    fail("letting go: " + JSON.stringify(got));
  if (!bot.length || bot.some((d) => d != null))
    fail("a computer player's arrow has a draw: " + bot);
})();
