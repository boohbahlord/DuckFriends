/* I want the bow drawn to shoot checked (K2b, js/bowdraw.js; the owner's, Nov 21 17:48Z: "You don't auto-shoot the bow
   anymore. You only pull it back to shoot ... every 1/2 second that it's pulled back, it does a guarantee of +1 damage
   ... it shows that in your cooldown meter ... light red ... dark red"; 18:05Z: full at 2.5 s, a sure crit; 18:16Z: up
   to 40% faster):
   1. a draw of 0.5 s adds 1 damage (0.2 a whole tenth), 2.5 s adds 5 and is a sure crit, 1 s is 25%; the arrow flies
      up to 40% faster;
   2. in Dead Ducks Arcade, the left button held with the bow out fires nothing while held, the white bar under my duck
      fills red, and letting go shoots one arrow carrying its draw (about 1 s), a little faster;
   3. one bow rule for every arrow hit (Adam, Nov 22 11:20Z: "every arrow hit read bowdraw.js' crit ... no old path
      left"): guns.js critOf of the bow is its draw's, and what a zombie, a Sandbox NPC or a gunman takes from it
      (l4ddrules.js zombieTakes) is always a crit at full draw and never undrawn, with the draw's damage;
   4. a computer player draws again the moment it lets go (bots.js botActions), so its arrows carry a draw too.
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
    const B = await import("./js/bowdraw.js"),
      G = await import("./js/guns.js");
    return {
      dmg: [0, 99, 100, 499, 500, 1000, 2500].map(B.drawDmg),
      crit: [0, 1000, 2000, 2499, 2500].map(B.drawCrit),
      fast: [0, 1250, 2500].map(B.drawFast),
      critOf: [undefined, 0, 1000, 2500].map((d) => G.critOf("bow", d)),
    };
  });
  const same = (a, c) => JSON.stringify(a) === JSON.stringify(c);
  if (!same(t.dmg, [0, 0, 0.2, 0.8, 1, 2, 5]))
    fail("a draw's damage: " + t.dmg);
  if (!same(t.crit, [0, 0.25, 0.5, 0.62475, 1]))
    fail("a draw's crit: " + t.crit);
  if (!same(t.fast, [1, 1.2, 1.4])) fail("a draw's speed: " + t.fast);
  if (!same(t.critOf, [0, 0, 0.25, 1]))
    fail("guns.js critOf of the bow: " + t.critOf);
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
  const takes = await p.evaluate(async () => {
    const r = window._r,
      R = await import("./js/l4ddrules.js"),
      of = (dr) =>
        Array.from({ length: 40 }, () =>
          R.zombieTakes(r.state, r.me, "bow", dr),
        ).filter(Boolean);
    return { full: of(2500), none: of(0) };
  });
  const bot = await p.evaluate(async () => {
    const r = window._r,
      R = await import("./js/l4ddrules.js"),
      id = r.state.seat.find((q) => q !== r.me);
    R.give(r.state, id, "bow", "knife");
    r.state.pos[id] = { ...r.state.pos[id], w: "bow" };
    r.send({ t: "hang", k: "l4", do: "endturn", on: true }); // (I'm ready too: the zombies come)
    const seen = new Map();
    for (let i = 0; i < 160 && seen.size < 3; i++) {
      for (const s of r.state.shots || [])
        if (s.k === "arrow" && s.by === id) seen.set(s.n, s.dr);
      await new Promise((ok) => setTimeout(ok, 250));
    }
    return [...seen.values()];
  });
  await b.close();
  noErrors(errs);
  if (mid.shots !== before)
    fail("the bow shot while still drawn: " + JSON.stringify(mid));
  if (!mid.draw || !(mid.cl > 0.3 && mid.cl < 0.55))
    fail("the white bar while drawing: " + JSON.stringify(mid));
  if (got.length !== 1 || !(got[0].dr >= 900 && got[0].dr <= 1300))
    fail("letting go: " + JSON.stringify(got));
  if (!takes.full.length || takes.full.some((q) => !q.crit))
    fail(
      "a full draw's hit is not always a crit: " +
        JSON.stringify(takes.full.slice(0, 3)),
    );
  if (takes.none.some((q) => q.crit)) fail("an undrawn arrow's hit was a crit");
  if (!(takes.full[0].dmg > takes.none[0].dmg))
    fail(
      "a full draw's hit does no more: " +
        JSON.stringify([takes.full[0], takes.none[0]]),
    );
  if (bot.length < 2 || !bot.slice(1).every((d) => d > 0))
    fail(
      "a computer player's arrows after its first carry no draw: " +
        JSON.stringify(bot),
    );
})();
