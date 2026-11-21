/* I want a Sandbox block to keep its size when its boxes changed unit (B0, the owner's, Nov 21 19:13Z: distances in
   tiles, never duck lengths). A save made before it (version 1) typed Width, Height and Square size in duck lengths;
   opened now, the block is as big as it was and its squares as big. A resize handle's size lands the same too. */
const { chromium } = require("playwright");
const C = require("./lib.cjs");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async () => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 0 });
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "sandbox",
        map: "night",
        sbMap: "",
        botWait: 1,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.send({ t: "start" });
    for (let i = 0; i < 80 && !r.state.sbpk; i++)
      await new Promise((ok) => setTimeout(ok, 100));
    r.send({ t: "sbPick" });
    for (let i = 0; i < 80 && r.state.phase !== "sandbox"; i++)
      await new Promise((ok) => setTimeout(ok, 100));
    const S = await import("./js/sandboxrules.js"),
      V = await import("./js/sbsave.js");
    const pts = () => (r.state.sb && r.state.sb.pts) || {};
    r.send({ t: "sb", k: "add", kind: "zone", id: r.me });
    const id = Object.keys(pts()).find((k) => pts()[k].k === "zone");
    if (!id) return { err: "no zone" };
    /* a save from before: its boxes typed in duck lengths */
    const data = JSON.parse(JSON.stringify(V.sbSnapshot(r.state))), // (with no v: from before tiles)
      z = data.parts.sb.pts[id];
    delete data.v;
    z.f = {
      ...z.f,
      zw: { t: "2.25", ok: "2.25" },
      zh: { t: "3", ok: "3" },
      sq: { t: "0.75", ok: "0.75" },
    };
    z.zw = 2.25;
    z.zh = 3;
    if (
      !V.sbPick(
        r.state,
        { save: { id: "old", name: "Old", made: 1, v: 1, data } },
        Date.now(),
      )
    )
      return { err: "the save didn't open" }; // (the rules' own open, as the host's pick runs it)
    const TILED = ["zw", "zh", "sq"];
    const look = (q) => {
      const g = S.sbGrid(r.state, q);
      return [...S.sbSize(q), g.sq, g.nx, g.ny, ...TILED.map((f) => q.f[f].ok)]; // (and its boxes, in tiles)
    };
    const old = look(pts()[id]);
    /* a resize handle: 2 by 1.25 duck lengths */
    const P = pts()[id];
    r.send({ t: "sb", k: "size", p: id, zw: 2, zh: 1.25, x: P.x, y: P.y });
    const dragged = look(pts()[id]);
    return { old, dragged };
  });
  console.log("sbtiles", JSON.stringify(got));
  const want = {
    old: [2.25, 3, 0.75, 3, 4, "9", "12", "3"],
    dragged: [2, 1.25, 0.75, 3, 2, "8", "5", "3"],
  };
  if (JSON.stringify(got) !== JSON.stringify(want))
    C.fail(
      `a Sandbox block's size moved: ${JSON.stringify(got)}, not ${JSON.stringify(want)}`,
    );
  C.noErrors(errs);
  await b.close();
})();
