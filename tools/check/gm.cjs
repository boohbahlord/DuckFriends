const C = require("./lib.cjs");
const W = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await require("playwright").chromium.launch();
  const errs = [];
  for (const [sbMap, vp] of process.env.MAPS
    ? JSON.parse(process.env.MAPS)
    : [
        ["", { width: 1366, height: 768 }],
        ["zcabin", { width: 390, height: 844 }],
      ]) {
    const p = await b.newPage({ viewport: vp });
    const tag = (sbMap || "board") + vp.width;
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
        setTimeout(() => clearInterval(iv), 20000);
      }
    }, sbMap);
    await W(8000);
    const o = await p.evaluate(async () => {
      const R = window._r,
        w8 = (ms) => new Promise((r) => setTimeout(r, ms)),
        o = {},
        me = () => R.state.pos[R.me];
      const SR = await import("./js/sandboxrules.js");
      R.send({ t: "sb", k: "add", kind: "zone", x: me().x, y: me().y });
      await w8(400);
      const zid = Object.keys(R.state.sb.pts).pop();
      o.zone = !!zid;
      R.send({ t: "sbr", k: "lives", v: "3" });
      await w8(200);
      // save game mode
      const SV = await import("./js/sbsaves.js");
      const rows = SV.saveRows(R).map((r) => r.label);
      o.rows = rows.filter((l) => /game mode/.test(l));
      SV.saveRows(R)
        .find((r) => r.label === "Save game mode…")
        .act(R);
      await w8(400);
      const w = document.querySelector(".gm-savewin");
      w.querySelector("[data-name]").value = "Lava Test";
      w.querySelector("[data-desc]").value = "Do not fall.";
      w.querySelector("button[type=submit]").click();
      await w8(800);
      const GM = await import("./js/gmodes.js");
      o.list = (await GM.listModes()).map((m) => m.name + ":" + m.most);
      // same name replaces
      SV.saveRows(R)
        .find((r) => r.label === "Save game mode…")
        .act(R);
      await w8(400);
      const w2 = document.querySelector(".gm-savewin");
      w2.querySelector("[data-name]").value = "lava test";
      w2.querySelector("button[type=submit]").click();
      await w8(800);
      o.list2 = (await GM.listModes()).map((m) => m.name);
      // test
      SV.saveRows(R)
        .find((r) => r.label === "Test game mode")
        .act(R);
      await w8(2500);
      const st = R.state;
      o.test = [
        st.phase,
        st.gmPlay,
        st.gmTest,
        !!(st.sb && st.sb.pts && st.sb.pts[zid]),
        SR.sbMay(st, R.me, "b"),
        SR.sbRule(st, "lives"),
      ];
      const btn = document.querySelector(".cabin-end");
      o.btn = btn && !btn.hidden && btn.textContent;
      btn.click();
      await w8(2500);
      const s2 = R.state;
      o.back = [
        s2.phase,
        !!s2.gmPlay,
        !!s2.gmTest,
        !!(s2.sb && s2.sb.pts && s2.sb.pts[zid]),
        SR.sbMay(s2, R.me, "b"),
        document.querySelector(".cabin-end").textContent.slice(0, 13),
      ];
      // play it from the lobby
      const rr = await import("./js/rules.js");
      R.send({ t: "cabinEnd" });
      await w8(11500);
      o.lobby = R.state.phase;
      const m = (await GM.listModes())[0];
      R.send({
        t: "options",
        options: {
          mode: "sandbox",
          modePick: "",
          gm: m.id,
          gmName: m.name,
          gmMost: 2,
        },
      });
      await w8(300);
      o.cap = rr.capOf ? rr.capOf(R.state) : null;
      o.name = (await import("./js/modes.js")).modeName(R.state);
      R.state.zmapAsked = 1;
      R.send({ t: "start" });
      await w8(9000);
      const s3 = R.state;
      o.play = [
        s3.phase,
        s3.gmPlay,
        !!s3.gmTest,
        Object.keys((s3.sb && s3.sb.pts) || {}).length,
        SR.sbMay(s3, R.me, "g"),
        document.querySelector(".cabin-end")?.textContent.slice(0, 20),
      ];
      o.pick = !!document.querySelector(".sbp-new");
      return o;
    });
    console.log(tag, JSON.stringify(o));
    await p.evaluate(async () => {
      const GM = await import("./js/gmodes.js");
      for (const m of await GM.listModes()) await GM.deleteMode(m.id);
    });
    await p.close();
  }
  console.log("ERR", JSON.stringify(errs.slice(0, 6)));
  C.noErrors(errs);
  await b.close();
})();
