/* I want one more round in the chamber checked (K12; the owner's, Nov 21 18:16Z: "if you have full ammo in a mag and you
   reload it again, you get that extra one bullet on top of it ... only half as long ... only 3/4 as long for the LMG";
   "real revolvers and double barrel can't hold an extra round"): guns.js loadTo
   1. a magazine not full fills to full in its whole reload; a full one gets one more in half of it (the LMG 3/4); one
      already over full, a revolver, the double barrel, the Tommy gun and a gun with no magazine get none;
   2. in Dead Ducks Arcade, R with my full pistol: the reload takes half as long and the pistol then holds 8 of its 7,
      one taken from the rest; its bar stays full and the phone's R shows while a full one can take one more;
   3. on the boards and in Mad God Justin, a full pistol reloaded holds 8, the one more taken from the rest (ammo.js).
   Run: node tools/check/run.mjs plusone */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
  await p.goto(url);
  await p.waitForTimeout(2500);
  const table = await p.evaluate(async () => {
    const { loadTo } = await import("./js/guns.js"),
      { magOf, reloadMag } = await import("./js/ammo.js");
    return {
      part: loadTo("handgun", 5, 7),
      full: loadTo("handgun", 7, 7),
      over: loadTo("handgun", 8, 7),
      lmg: loadTo("lmg", 100, 100),
      none: ["revolver", "dbarrel", "tommy", "laser", "bow"].map((w) =>
        loadTo(w, 7, 7),
      ),
      board: (() => {
        const s = {};
        reloadMag(s, "a", 0, "handgun", false); // (a full pistol: one more)
        return magOf(s, "a", 1e6).c;
      })(),
      plain: magOf({}, "a", 0).c,
    };
  });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(table.part, [7, 1]) || !same(table.full, [8, 0.5]))
    fail("a pistol's reloads: " + JSON.stringify(table));
  if (table.over !== null || !same(table.lmg, [101, 0.75]))
    fail("over full, or the LMG: " + JSON.stringify(table));
  if (table.none.some((t) => t !== null))
    fail("a gun that holds no extra round got one: " + table.none);
  if (!same(table.board, [8, 132]) || !same(table.plain, [7, 133]))
    fail("the board's magazine after one more: " + JSON.stringify(table));
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
  await p.waitForTimeout(1500);
  const before = await p.evaluate(async () => {
    const r = window._r,
      { now } = await import("./js/clock.js"),
      { reloadReady } = await import("./js/hotpick.js"),
      { l4Ammo } = await import("./js/l4dd.js"),
      a = r.state.hang.l4a[r.me];
    r.state.pos[r.me] = { ...r.state.pos[r.me], w: "handgun" };
    const am = a.am.handgun,
      t = now(),
      ready = reloadReady(r.state, "handgun", t),
      f = (l4Ammo(r.state, r.me, "handgun") || {}).f;
    r.send({ t: "reload", w: "handgun" });
    const m = r.state.hang.l4a[r.me];
    return {
      am,
      ready,
      f,
      took: m.rl ? Math.round(m.rl - t) : 0,
      full: m.rt,
    };
  });
  await p.waitForTimeout(1200);
  const after = await p.evaluate(async () => {
    const r = window._r,
      { l4Ammo } = await import("./js/l4dd.js");
    r.send({ t: "use", what: "knife", ax: 0, ay: 0, face: 1 }); // (anything used: a reload that's done is counted in)
    r.send({ t: "reload", w: "handgun" });
    const a = r.state.hang.l4a[r.me];
    return {
      am: a.am.handgun,
      again: !!a.rl,
      f: (l4Ammo(r.state, r.me, "handgun") || {}).f,
    };
  });
  await b.close();
  noErrors(errs);
  if (before.am[0] !== 7) fail("the pistol didn't start full: " + before.am);
  if (!before.ready) fail("the phone's R doesn't show for a full pistol");
  if (!(before.took > 500 && before.took < 700))
    fail("a full pistol's reload took " + before.took + " ms, not 600");
  if (after.am[0] !== 8 || after.am[1] !== before.am[1] - 1)
    fail("after one more: " + after.am + " (was " + before.am + ")");
  if (after.again) fail("8 of 7 reloads again");
  if (after.f !== 1) fail("its bar at 8 of 7: " + after.f);
})();
