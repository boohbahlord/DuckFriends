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
    o.phase = s.phase;
    o.map = s.options.map;
    o.m0 = s.hang.l4m && s.hang.l4m.st;
    const me = s.pos[R.me];
    const m00 = s.hang.l4m || { x: 3000, y: 2600 };
    const x = m00.x,
      y = m00.y;
    o.start = [x, y];
    s.hang.l4m = {
      v: 9,
      id: "brah",
      roll: 1,
      st: "shoot",
      x,
      y,
      f: 1,
      hp: 4,
      max: 4,
      w: "",
      sp: 1,
      stock: [],
      ups: [],
      say: null,
      gun: "handgun",
      foe: "g99",
      fu: Date.now() - 1,
      gf: 1,
    };
    const rr = Math.random;
    Math.random = () => 0.1;
    await w8(600);
    Math.random = rr;
    o.after = [
      s.hang.l4m && s.hang.l4m.st,
      R.state.hang.l4m && R.state.hang.l4m.st,
    ];
    const tr = [];
    for (let i = 0; i < 12; i++) {
      await w8(1500);
      const m = R.state.hang.l4m;
      tr.push(m ? m.st + "@" + m.x + "," + m.y : "none");
    }
    o.tr = tr;
    // reload: shoot at a player many times
    const L = await import("./js/hangout/layout.js");
    const pm = R.state.pos[R.me];
    const m = R.state.hang.l4m;
    R.state.hang.l4m = {
      ...m,
      st: "shoot",
      foe: R.me,
      fu: Date.now() + 60000,
      x: Math.round(pm.x * L.W) + 200,
      y: Math.round(pm.y * L.H),
    };
    const sh = [];
    let last = 0;
    for (let i = 0; i < 40; i++) {
      await w8(500);
      const q = R.state.hang.l4m;
      if (q && q.sh && q.sh[0] !== last) {
        last = q.sh[0];
        sh.push(last);
      }
    }
    o.shots = sh.length;
    o.gaps = sh.slice(1).map((t, i) => t - sh[i]);
    o.mh = (({ mg, mrl }) => ({ mg, mrl }))(R.state.hidden.l4mh || {});
    return o;
  });
  console.log(JSON.stringify(o));
  console.log("ERR", JSON.stringify(errs.slice(0, 8)));
  C.noErrors(errs);
  await b.close();
})();
