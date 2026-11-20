const C = require("./lib.cjs");
const W = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await require("playwright").chromium.launch();
  const errs = [];
  for (const [sbMap, vp] of process.env.MAPS
    ? JSON.parse(process.env.MAPS)
    : [
        ["cabin", { width: 1366, height: 768 }],
        ["zcabin", { width: 390, height: 844 }],
      ]) {
    const p = await b.newPage({ viewport: vp });
    const tag = sbMap + vp.width;
    p.on("pageerror", (e) => errs.push(tag + ": " + e));
    p.on(
      "console",
      (m) => m.type() === "error" && errs.push(tag + ": " + m.text()),
    );
    await p.goto(C.url);
    await W(1500);
    await p.evaluate(async (sbMap) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
      window._r = r;
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode: "sandbox",
          map: "night",
          sbMap,
          botWait: 1,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.state.zmapAsked = 1;
      r.send({ t: "start" });
      {
        const iv = setInterval(() => {
          if (r.state.sbpk) {
            r.send({ t: "sbPick" });
            clearInterval(iv);
          }
        }, 300);
      }
    }, sbMap);
    await W(9000);
    const o = await p.evaluate(async () => {
      const L = await import("./js/hangout/layout.js"),
        R = window._r,
        me = () => R.state.pos[R.me],
        w8 = (ms) => new Promise((r) => setTimeout(r, ms)),
        o = {},
        P = () => R.state.sb.pts;
      const V = await import("./js/sbspawnview.js"),
        SR = await import("./js/sandboxrules.js");
      const set = (pid, f, v) => R.send({ t: "sb", p: pid, k: "set", f, v });
      const zb = () =>
        (
          (R.state.hang && R.state.hang.sbz && R.state.hang.sbz.zb) ||
          []
        ).filter((q) => !q.d);
      const [rx] = SR.sbUnit(R.state, L.W, L.H),
        m0 = { ...me() };
      // a floor B under my duck (I'm put up on it), a climb C on B's west edge for everything, a spawn S west of C
      const bx = m0.x,
        by = m0.y;
      R.send({ t: "sb", k: "add", kind: "zone", x: bx, y: by });
      await w8(300);
      const B = Object.keys(P()).pop();
      R.send({ t: "sb", k: "size", p: B, zw: 4, zh: 4, x: bx, y: by });
      await w8(200);
      set(B, "fl", "2");
      set(B, "gnd", "t");
      R.send({ t: "sb", k: "add", kind: "zone", x: bx - rx * 2, y: by });
      await w8(300);
      const C = Object.keys(P()).pop();
      R.send({ t: "sb", k: "size", p: C, zw: 1, zh: 4, x: bx - rx * 2, y: by });
      await w8(200);
      set(C, "fl", "2");
      set(C, "clm", "everything");
      R.send({ t: "sb", k: "add", kind: "zone", x: bx - rx * 6, y: by });
      await w8(300);
      const S = Object.keys(P()).pop();
      await w8(500);
      R.state.pos[R.me] = {
        ...me(),
        x: bx + rx,
        y: by,
        z: 108,
        tp: Date.now(),
      };
      R.send({ t: "noop" });
      await w8(800);
      o.meZ = me().z;
      V.sbSettings(() => R, S);
      await w8(400);
      let win = document.querySelector(".sb-setwin");
      const sp = win.querySelector('[data-purpose][value="spawn"]');
      sp.checked = true;
      sp.dispatchEvent(new Event("change", { bubbles: true }));
      await w8(900);
      win = document.querySelector(".sb-setwin");
      win.querySelector("[data-go]").click();
      await w8(300);
      document.querySelector(".sb-setwin .win-x")?.click();
      const tr = [];
      for (let i = 0; i < 30; i++) {
        await w8(300);
        tr.push(
          zb()
            .map((q) =>
              [+((q.x / L.W - bx) / rx).toFixed(1), Math.round(q.z || 0)].join(
                ":",
              ),
            )
            .join(" "),
        );
      }
      o.tr = tr.filter((t, i) => i % 3 === 0);
      o.meZ2 = me().z;
      return o;
    });
    console.log(tag, JSON.stringify(o));
    await p.close();
  }
  console.log("ERR", JSON.stringify(errs.slice(0, 6)));
  C.noErrors(errs);
  await b.close();
})();
