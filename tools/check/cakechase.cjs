/* I want Justin's zebra cake chase pinned before both Justins share one (A4: the board's in boardjustin.js and Mad God
   Justin's in mgjrules.js were the same lines twice). A cake is thrown to the right; each Justin runs after it, waits
   for it to land, eats it, and it's gone: every changed step of his (where he heads, his speed, eating, the flash, the
   cake, his HP) at 100 ms steps, with Math.random held at 0.5. Run: node tools/check/run.mjs cakechase */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const EXPECT = {
  board:
    "0 0.5 0.5 0.38 - - fly 3 0|1 0.51 0.5 0.38 - - fly 3 0|2 0.52 0.5 0.38 - - fly 3 0|3 0.53 0.5 0.38 - - fly 3 0|4 0.54 0.5 0.38 - - fly 3 0|5 0.55 0.5 0.38 - - fly 3 0|6 0.56 0.5 0.38 - - fly 3 0|7 0.57 0.5 0.38 - - fly 3 0|8 0.58 0.5 0.38 - - fly 3 0|9 0.59 0.5 0.38 - - fly 3 0|10 0.6 0.5 0.38 - - fly 3 0|11 0.61 0.5 0.38 - - fly 3 0|12 0.62 0.5 0.38 - - fly 3 0|13 0.63 0.5 0.38 - - fly 3 0|14 0.64 0.5 0.38 - - fly 3 0|15 0.64 0.5 0.38 4000 eat/zebra/0 eat 3 0|40 0.64 0.5 0.38 - eat/zebra/0 gone 3 4500",
  mgj: "0 0.5 0.5 0.475 - - fly 198 0|1 0.51 0.5 0.475 - - fly 198 0|2 0.52 0.5 0.475 - - fly 198 0|3 0.53 0.5 0.475 - - fly 198 0|4 0.54 0.5 0.475 - - fly 198 0|5 0.55 0.5 0.475 - - fly 198 0|6 0.56 0.5 0.475 - - fly 198 0|7 0.57 0.5 0.475 - - fly 198 0|8 0.58 0.5 0.475 - - fly 198 0|9 0.59 0.5 0.475 - - fly 198 0|10 0.6 0.5 0.475 - - fly 198 0|11 0.61 0.5 0.475 - - fly 198 0|12 0.62 0.5 0.475 - - fly 198 0|13 0.63 0.5 0.475 - - fly 198 0|14 0.64 0.5 0.475 - - fly 198 0|15 0.64 0.5 0.475 4000 eat/zebra/x eat 198 0|40 0.64 0.5 0.475 - eat/zebra/x gone 199 4000",
};
(async () => {
  const b = await chromium.launch(),
    errs = [],
    got = {};
  for (const mode of ["board", "mgj"]) {
    const q = await b.newPage({ viewport: { width: 1366, height: 768 } });
    q.on("pageerror", (e) => errs.push(mode + ": " + e));
    await q.goto(C.url);
    await q.waitForTimeout(1500);
    got[mode] = await q.evaluate(async (mode) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
      const o =
        mode === "mgj"
          ? { mode: "mgj", map: "night" }
          : { mode: "aod", map: "night", justin: 1 };
      r.send({
        t: "options",
        options: { modePick: "host", mapPick: "host", ...o },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.state.zmapAsked = 1;
      r.send({ t: "start" });
      const w8 = (ms) => new Promise((ok) => setTimeout(ok, ms));
      for (let i = 0; i < 300 && !r.state.justin; i++) await w8(50);
      for (
        let i = 0;
        i < 400 && mode !== "mgj" && r.state.phase !== "submit";
        i++
      )
        await w8(50);
      if (mode !== "mgj") r.send({ t: "submit", text: "Ducks can fly" }); // (my question: the board comes next)
      const want = mode === "mgj" ? "boss" : "answer";
      for (let i = 0; i < 600 && r.state.phase !== want; i++) await w8(50);
      await w8(500);
      r.send = () => {}; // (the room held still: I tick a copy myself)
      const s = structuredClone(r.state),
        BJ = await import("./js/boardjustin.js"),
        MG = await import("./js/mgjrules.js"),
        JM = await import("./js/justinmoves.js"),
        rnd = Math.random;
      Math.random = () => 0.5;
      const T0 = 1e12,
        j = s.justin;
      Object.assign(j, {
        k: null,
        x0: 0.3,
        y0: 0.5,
        x1: 0.3,
        y1: 0.5,
        t: T0,
        v: 0.2,
        next: T0,
        say: T0 + 1e9,
        shoot: T0 + 1e9,
      });
      delete j.swing;
      delete j.eat;
      delete j.down;
      if (mode === "mgj") j.hp = s.mgj.hp = Math.max(1, (s.mgj.max || 10) - 2);
      else j.hp = 3;
      s.fx = [];
      const cake = {
        n: 1,
        by: "x",
        x0: 0.5,
        y0: 0.5,
        vx: 0.1,
        vy: 0,
        t: T0,
        stop: T0 + 1500,
      };
      if (mode === "mgj") s.mgj.cake = cake;
      else s.zcake = cake;
      const out = [];
      for (let k = 0; k <= 60; k++) {
        const now = T0 + k * 100;
        const ch =
          mode === "mgj"
            ? s.mgj.cake &&
              MG.cakeTick(
                s,
                now,
                BJ.justinAt(s.justin, now),
                JM.fxOf(s, now, "justin"),
              )
            : s.zcake && BJ.justinTick(s, now, () => {});
        if (!ch) continue;
        const J = s.justin,
          f = s.fx[s.fx.length - 1],
          c = mode === "mgj" ? s.mgj.cake : s.zcake;
        out.push(
          [
            k,
            J.x1,
            J.y1,
            J.v,
            J.eat ? J.eat.until - T0 : "-",
            f ? `${f.kind}/${f.what}/${f.who ? f.who.length : "x"}` : "-",
            c ? (c.eat ? "eat" : "fly") : "gone",
            mode === "mgj" ? s.mgj.hp : J.hp,
            J.next - T0,
          ].join(" "),
        );
      }
      Math.random = rnd;
      return out.join("|") || s.phase;
    }, mode);
    await q.close();
  }
  await b.close();
  C.noErrors(errs);
  if (process.env.SHOW) console.log(JSON.stringify(got, null, 1));
  for (const k of Object.keys(EXPECT))
    if (got[k] !== EXPECT[k])
      C.fail(`cakechase ${k}: ${got[k]} (was ${EXPECT[k]})`);
})();
