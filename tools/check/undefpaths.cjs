/* I want each line that once threw a ReferenceError (a name another change deleted: Justin's shadow duck lines, the rainbow
   looks, trivia's auto questions) reached once, so the check sees it run: tools/check/undef.cjs finds names no one defines,
   this proves the three fixed paths do their work. */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage(),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto(url);
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const out = {};
    /* the rainbow looks: a duck in a game with hidden looks takes the color it was dealt */
    const { shownDuck } = await import("./js/looks.js");
    const { RAINBOW, FAKE_JUSTIN } = await import("./js/looksrules.js");
    const s = {
      phase: "hang",
      options: { hideLooks: 1, rainbowDucks: 1 },
      rainbow: { a: 0, b: FAKE_JUSTIN },
    };
    out.rainbow = [
      shownDuck(s, { id: "a", duck: {} }).color === RAINBOW[0],
      shownDuck(s, { id: "b", duck: {} }).outfit.id === "jeans",
    ];
    /* Justin, got by the shadow duck, then talked up: his four lines */
    await import("./js/hangout/justin.js");
    const { BRAINS } = await import("./js/hangout/npc.js");
    const { justinGot } = await import("./js/hangout/justin.js");
    const J = BRAINS.get("justin"),
      says = [],
      c = {
        now: 1e6,
        rand: () => 0.5,
        stop() {},
        say: (_, t) => says.push(t),
        fx() {},
        kill() {},
        dist: () => 99,
        ducks: [],
        s: {},
      },
      me = J.init(c.now);
    justinGot(me, c);
    J.act(me, { do: "talk" }, c);
    c.now += 10;
    J.tick(me, c);
    out.shadow = says.some((t) => /killed by a black duck/.test(t));
    /* trivia: a question nobody wrote is dealt from the bank */
    const net = await import("./js/net.js"),
      { tvStart, tvDeal } = await import("./js/triviarules.js"),
      room = net.createLocalRoom({ name: "T", test: true, computers: 2 });
    room.close();
    room.send({
      t: "options",
      options: { modePick: "", mapPick: "", mode: "trivia" },
    });
    room.send({ t: "start" });
    const st = tvStart(room.state, Date.now()) || room.state;
    out.phase = st.phase;
    if (st.tv) {
      tvDeal(st, Date.now());
      out.auto = st.tv.qs.length > 0 && st.tv.qs.every((q) => q.auto && q.text);
    }
    return out;
  });
  await b.close();
  noErrors(errs);
  if (!r.rainbow[0] || !r.rainbow[1]) fail("rainbow looks: " + r.rainbow);
  if (!r.shadow) fail("Justin's shadow duck lines did not come");
  if (!r.auto)
    fail("trivia's auto questions did not deal (phase " + r.phase + ")");
})();
