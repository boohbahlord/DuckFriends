const C = require("./lib.cjs");
const W = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await require("playwright").chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  p.on("pageerror", (e) => errs.push(e.stack?.slice(0, 400)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(C.url);
  await W(1500);
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
        mode: "surv",
        map: "night",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
  });
  await W(14000);
  const o = await p.evaluate(async () => {
    const R = window._r,
      w8 = (ms) => new Promise((r) => setTimeout(r, ms)),
      o = {},
      s = R.state;
    const L = await import("./js/hangout/layout.js");
    const pm = s.pos[R.me];
    const x = pm.x * L.W,
      y = pm.y * L.H;
    const g = {
      i: 50,
      k: "s",
      ro: "lmg",
      x: Math.round(x + 400),
      y: Math.round(y),
      hp: 20,
      l: [20],
      f: -1,
      dk: { pattern: "none" },
      wp: { p: ["lmg", "handgun"] },
      mg: [100, 12],
      rl: [0, 0],
      hw: "lmg",
      st: "in",
      u: 0,
      lo: 0,
      ad: 0,
    };
    s.hang.gm = {
      ...(s.hang.gm || {}),
      sq: {},
      sp: {},
      n: 50,
      gb: [g],
      k: "s",
      bk: 0,
      nb: 0,
      wv: 1,
    };
    const tr = [];
    for (let i = 0; i < 16; i++) {
      await w8(500);
      const q = ((R.state.hang.gm && R.state.hang.gm.gb) || [])[0];
      const el = document.querySelector(".gm-sup");
      tr.push(
        [
          q && q.st,
          q && q.sh && q.sh[0] % 100000,
          !!(R.state.hang.gm.sp || {})[R.me],
          el && el.classList.contains("on"),
          el && el.style.getPropertyValue("--sup"),
          el && getComputedStyle(el).opacity,
        ].join(" "),
      );
    }
    o.tr = tr;
    o.hp =
      R.state.hang.l4p && R.state.hang.l4p[R.me] && R.state.hang.l4p[R.me].hp;
    return o;
  });
  console.log(JSON.stringify(o, null, 0));
  console.log("ERR", JSON.stringify(errs.slice(0, 8)));
  C.noErrors(errs);
  await b.close();
})();
