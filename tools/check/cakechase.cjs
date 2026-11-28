/* I want Justin's zebra cake chase on the board pinned (boardjustin.js). A cake is thrown to the right; he runs after
   it, waits for it to land, eats it, and it's gone: every changed step of his (where he heads, his speed, eating, the flash, the
   cake, his HP) at 100 ms steps, with Math.random held at 0.5. Run: node tools/check/run.mjs cakechase */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const EXPECT = {
  board:
    "0 0.5 0.5 0.38 - - fly 3 0|1 0.51 0.5 0.38 - - fly 3 0|2 0.52 0.5 0.38 - - fly 3 0|3 0.53 0.5 0.38 - - fly 3 0|4 0.54 0.5 0.38 - - fly 3 0|5 0.55 0.5 0.38 - - fly 3 0|6 0.56 0.5 0.38 - - fly 3 0|7 0.57 0.5 0.38 - - fly 3 0|8 0.58 0.5 0.38 - - fly 3 0|9 0.59 0.5 0.38 - - fly 3 0|10 0.6 0.5 0.38 - - fly 3 0|11 0.61 0.5 0.38 - - fly 3 0|12 0.62 0.5 0.38 - - fly 3 0|13 0.63 0.5 0.38 - - fly 3 0|14 0.64 0.5 0.38 - - fly 3 0|15 0.64 0.5 0.38 4000 eat/zebra/0 eat 3 0|40 0.64 0.5 0.38 - eat/zebra/0 gone 3 4500",
};
(async () => {
  const b = await chromium.launch(),
    errs = [],
    got = {};
  for (const mode of ["board"]) {
    const q = await b.newPage({ viewport: { width: 1366, height: 768 } });
    q.on("pageerror", (e) => errs.push(mode + ": " + e));
    await q.goto(C.url);
    await q.waitForTimeout(1500);
    got[mode] = await q.evaluate(async (mode) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
      const o = { mode: "aod", map: "night", justin: 1 };
      r.send({
        t: "options",
        options: { modePick: "host", mapPick: "host", ...o },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.send({ t: "start" });
      const w8 = (ms) => new Promise((ok) => setTimeout(ok, ms));
      for (let i = 0; i < 300 && !r.state.justin; i++) await w8(50);
      for (let i = 0; i < 400 && r.state.phase !== "submit"; i++) await w8(50);
      r.send({ t: "submit", text: "Ducks can fly" }); // (my question: the board comes next)
      for (let i = 0; i < 600 && r.state.phase !== "answer"; i++) await w8(50);
      await w8(500);
      r.send = () => {}; // (the room held still: I tick a copy myself)
      const s = structuredClone(r.state),
        BJ = await import("./js/boardjustin.js"),
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
      j.hp = 3;
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
      s.zcake = cake;
      const out = [];
      for (let k = 0; k <= 60; k++) {
        const now = T0 + k * 100;
        const ch = s.zcake && BJ.justinTick(s, now, () => {});
        if (!ch) continue;
        const J = s.justin,
          f = s.fx[s.fx.length - 1],
          c = s.zcake;
        out.push(
          [
            k,
            J.x1,
            J.y1,
            J.v,
            J.eat ? J.eat.until - T0 : "-",
            f ? `${f.kind}/${f.what}/${f.who ? f.who.length : "x"}` : "-",
            c ? (c.eat ? "eat" : "fly") : "gone",
            J.hp,
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
