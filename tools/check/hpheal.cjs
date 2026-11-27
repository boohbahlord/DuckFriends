/* I want every mode's heal pinned (a Sandbox zone's or group's heal: hpmath.js hpHealOf), so moving HP never changes a
   number: the board's HP (Agree or Disagree), Mad God Justin's (it heals as the board does) and the zombie maps' (Dead
   Ducks Arcade). Each case sets a duck's HP, heals it and compares what's left, and whether the state changed, with
   the numbers the game gave before HP was one module (Nov 21), but the first of each: since Nov 22 a heal adds just
   what it is, a point or a part of one (B7, the owner's 06:24Z), so 1.5 HP left healed by 1 is 2.5, not 2. Then my
   HP meter (game.js drawMeters, hpOf) a moment into Mad God Justin, Dead Ducks Arcade and Sandbox's board. Run: node
   tools/check/run.mjs hpheal */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const EXPECT = {
  aod: [
    [true, 1.5],
    [true, 1.2],
    [true, 1],
    [true, 0],
    [false, 2],
    [false, 0],
  ],
  mgj: [
    [true, 1.5],
    [true, 1.2],
    [true, 1],
    [true, 0],
    [false, 2],
    [false, 0],
  ],
  l4dd: [
    [true, 2.5],
    [true, 1.75],
    [true, 3],
    [true, 3],
    [false, 1],
    [false, 1],
    [false, 3],
  ],
  "meter-mgj": ["boss", true, "6", "6"],
  "meter-l4dd": ["hang", true, "3", "3"],
  "meter-sandbox": ["sandbox", true, "4", "4"],
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const got = {};
  for (const mode of ["aod", "mgj", "l4dd"]) {
    got[mode] = await p.evaluate(async (mode) => {
      const H = await import("./js/hpmath.js"),
        BF = await import("./js/boardfire.js"),
        SR = await import("./js/sandboxrules.js");
      /* the heal as it was before hpHealOf (the board's or the zombie maps', by the mode) */
      const heal =
        H.hpHealOf ||
        ((s, id, amt, now) => {
          const l4 = SR.baseMode(s.options) === "l4dd",
            st = () => (l4 ? s.hang && s.hang.l4p : s.php),
            was = st();
          if (l4) BF.SB_H.l4heal(s, id, amt);
          else BF.SB_H.heal(s, id, amt, now);
          return st() !== was;
        });
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
      r.send({
        t: "options",
        options: { modePick: "host", mapPick: "host", mode, map: "night" },
      });
      r.send({ t: "start" });
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        if (mode !== "l4dd" || (r.state.hang && r.state.hang.l4p)) break;
        await new Promise((ok) => setTimeout(ok, 200));
      }
      const base = JSON.parse(JSON.stringify(r.state)),
        id = base.seat[0],
        now = Date.now(),
        out = [];
      const one = (set, amt) => {
        const s = JSON.parse(JSON.stringify(base));
        set(s);
        const ch = heal(s, id, amt, now);
        out.push([
          ch,
          mode === "l4dd"
            ? ((s.hang.l4p || {})[id] || {}).hp
            : ((s.php || {})[id] || { n: 0 }).n,
        ]);
      };
      if (mode === "l4dd") {
        if (!(base.hang && base.hang.l4p && base.hang.l4p[id]))
          return "no zombie-map HP";
        const hp = (s, v) => (s.hang.l4p[id] = { ...s.hang.l4p[id], ...v });
        one((s) => hp(s, { hp: 1.5 }), 1);
        one((s) => hp(s, { hp: 1.5 }), 0.25);
        one((s) => hp(s, { hp: 2 }), 2);
        one((s) => hp(s, { hp: 1 }), 50);
        one((s) => hp(s, { hp: 1, dn: now + 9000 }), 1);
        one((s) => hp(s, { hp: 1, gh: 1 }), 1);
        one(() => {}, 1);
      } else {
        const lost = (s, n, t = now) => (s.php = { [id]: { n, t } });
        one((s) => lost(s, 2.5), 1);
        one((s) => lost(s, 1.5), 0.3);
        one((s) => lost(s, 3), 2);
        one((s) => lost(s, 1), 9);
        one((s) => lost(s, 2, now - 7000), 1);
        one((s) => (s.php = {}), 1);
      }
      return out;
    }, mode);
  }
  /* my HP meter under the hotbar (game.js drawMeters: hpmath.js hpOf), a few seconds into each mode */
  for (const mode of ["mgj", "l4dd", "sandbox"]) {
    const q = await b.newPage({ viewport: { width: 1366, height: 768 } });
    q.on("pageerror", (e) => errs.push(mode + ": " + e));
    await q.goto(C.url);
    await q.waitForTimeout(1500);
    await q.evaluate(async (mode) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
      r.send({
        t: "options",
        options: { modePick: "host", mapPick: "host", mode, map: "night" },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.send({ t: "start" });
      window._r = r;
      const iv = setInterval(
        () => r.state.sbpk && r.send({ t: "sbPick" }),
        300,
      ); // (Sandbox: its map picked)
      setTimeout(() => clearInterval(iv), 20000);
    }, mode);
    await q
      .waitForFunction(
        () => !/countdown|sbpick/.test(window._r.state.phase),
        null,
        {
          timeout: 30000,
        },
      )
      .catch(() => {});
    await q.waitForTimeout(2000);
    got["meter-" + mode] = await q.evaluate(() => {
      const m = document.querySelector(".hpm-me");
      return [
        window._r.state.phase,
        !!m && !m.classList.contains("gone"),
        m && m.getAttribute("aria-valuenow"),
        m && m.getAttribute("aria-valuemax"),
      ];
    });
    await q.close();
  }
  await b.close();
  C.noErrors(errs);
  for (const k of Object.keys(EXPECT))
    if (JSON.stringify(got[k]) !== JSON.stringify(EXPECT[k]))
      C.fail(
        `hpheal ${k}: ${JSON.stringify(got[k])} (was ${JSON.stringify(EXPECT[k])})`,
      );
})();
