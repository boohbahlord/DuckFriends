/* I want the HP bar over each duck pinned before it becomes one pass (A3b: game.js read it a different way in each
   mode). For each HP breed, a duck's bar as the game draws it (shown or not, how full, how many blocks) at a few HPs:
   the board's (Agree or Disagree with Justin on: a duck, then Justin), Mad God Justin's (a duck in the fight, Justin
   himself, Player HP off) and the zombie maps' (Dead Ducks Arcade on Downpour: a duck, a duck at 0, wild Justin
   untouched and hit: he's seated, so his shows full too). Run: node tools/check/run.mjs hpbar */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const EXPECT = {
  aod: [
    ["me", true, "1.000", "4"],
    ["me lost 1.5", true, "0.625", "4"],
    ["me dead", false],
    ["justin", true, "1.000", "1"],
    ["justin down", false],
  ],
  mgj: [
    ["me", true, "1.000", "6"],
    ["me lost 2", true, "0.667", "6"],
    ["justin", false],
    ["hp off", false],
  ],
  l4dd: [
    ["me", true, "1.000", "3"],
    ["me 1.5", true, "0.500", "3"],
    ["me a ghost", false],
    ["wild full", true, "1.000", "most"],
    ["wild hit", true, "0.500", "most"],
  ],
};
const PLAY = {
  aod: { mode: "aod", map: "night", justin: 1 },
  mgj: { mode: "mgj", map: "night" },
  l4dd: { mode: "l4dd" },
};
(async () => {
  const b = await chromium.launch();
  const errs = [],
    got = {};
  for (const mode of Object.keys(PLAY)) {
    const q = await b.newPage({ viewport: { width: 1366, height: 768 } });
    q.on("pageerror", (e) => errs.push(mode + ": " + e));
    await q.goto(C.url);
    await q.waitForTimeout(1500);
    await q.evaluate(async (o) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
      r.send({
        t: "options",
        options: { modePick: "host", mapPick: "host", ...o },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.send({ t: "start" });
      window._r = r;
      for (
        let i = 0;
        i < 300 && o.mode === "aod" && r.state.phase !== "submit";
        i++
      )
        await new Promise((ok) => setTimeout(ok, 50));
      if (o.mode === "aod") r.send({ t: "submit", text: "Ducks can fly" }); // (my question: the board comes next)
    }, PLAY[mode]);
    const want = { aod: "answer", mgj: "boss", l4dd: "hang" }[mode];
    await q
      .waitForFunction((ph) => window._r.state.phase === ph, want, {
        timeout: 40000,
      })
      .catch(() => {});
    await q.waitForTimeout(1500);
    got[mode] = await q.evaluate(async (mode) => {
      const r = window._r,
        s = () => r.state,
        me = s().seat.find((id) => !s().players[id].bot) || s().seat[0],
        frames = () =>
          new Promise((ok) =>
            requestAnimationFrame(() => requestAnimationFrame(ok)),
          ),
        out = [];
      const send = r.send;
      r.send = () => {}; // (the room held still while I look: no ticks, no computers, so no HP back or Justin up)
      let layer = null;
      for (const e of document.querySelectorAll("*"))
        if (e._els instanceof Map) layer = e;
      const look = async (name, id, set, most) => {
        for (let i = 0; i < 4; i++) {
          set();
          await frames();
        }
        const d = layer && layer._els.get(id),
          bar = d && d.querySelector(".gduck-hp");
        out.push(
          d && d.classList.contains("php")
            ? [
                name,
                true,
                (+bar.style.getPropertyValue("--hp")).toFixed(3),
                most && bar.style.getPropertyValue("--n") === String(most)
                  ? "most" // (wild Justin's most HP changes from game to game)
                  : bar.style.getPropertyValue("--n"),
              ]
            : [name, false],
        );
      };
      const now = Date.now();
      if (mode === "aod") {
        await look("me", me, () => (s().php = {}));
        await look(
          "me lost 1.5",
          me,
          () => (s().php = { [me]: { n: 1.5, t: Date.now() } }),
        );
        await look("me dead", me, () => (s().players[me].dead = true));
        s().players[me].dead = false;
        await look("justin", "justin", () => (s().justin.down = false));
        await look("justin down", "justin", () => (s().justin.down = true));
      } else if (mode === "mgj") {
        await look("me", me, () => (s().mgj.lost = {}));
        await look("me lost 2", me, () => (s().mgj.lost = { [me]: 2 }));
        await look("justin", "justin", () => {});
        await look("hp off", me, () => (s().options.mgjHp = 0));
      } else {
        const hp = (id, v, more = {}) =>
          (s().hang.l4p = {
            ...s().hang.l4p,
            [id]: { ...s().hang.l4p[id], hp: v, ...more },
          });
        await look("me", me, () => hp(me, 3));
        await look("me 1.5", me, () => hp(me, 1.5));
        await look("me a ghost", me, () => hp(me, 0, { gh: 1 }));
        hp(me, 3, { gh: 0 });
        const w = "b-justin",
          full = (await import("./js/l4ddrules.js")).maxHp(s(), w);
        await look("wild full", w, () => hp(w, full), full);
        await look("wild hit", w, () => hp(w, full / 2), full);
      }
      void now;
      r.send = send;
      return out;
    }, mode);
    await q.close();
  }
  await b.close();
  C.noErrors(errs);
  for (const k of Object.keys(EXPECT))
    if (JSON.stringify(got[k]) !== JSON.stringify(EXPECT[k]))
      C.fail(
        `hpbar ${k}: ${JSON.stringify(got[k])} (was ${JSON.stringify(EXPECT[k])})`,
      );
})();
