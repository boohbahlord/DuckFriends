/* I want a zombie killed on a roof to lie on that roof, and one killed up a wall to drop to the ground (the owner's video
   notes, Nov 21 08:46 ET: "corpses go below the cieling of where they were, that should be fixed"). On Downpour it puts
   one zombie on the canopy, one on the gas station's roof and one halfway up the station's wall, kills all three (as a
   Sandbox kill zone does, l4ddrules.js l4Zone) and checks the height each dead one is at (heights.js zOf(z, "zombie"), which the
   screen draws it at). Fake clock and seed (tools/npc-golden/init.js). */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 800, height: 450 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  ); // (the fake clock: tools/npc-golden)
  await p.goto(url, { waitUntil: "networkidle" });
  const r = await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      GS = await import("./js/hangout/stationmap.js"),
      LY = await import("./js/hangout/layout.js"),
      Z = await import("./js/zombies.js"),
      ZR = await import("./js/zombieroofs.js"),
      HT = await import("./js/heights.js"),
      R = await import("./js/l4ddrules.js");
    const room = net.createLocalRoom({ name: "C", test: true, computers: 0 });
    room.close();
    room.send({
      t: "options",
      options: {
        modePick: "",
        mapPick: "",
        botWait: 1,
        mode: "l4dd",
        l4map: "downpour",
      },
    });
    room.state.zmapAsked = 1;
    room.send({ t: "start" });
    let now = 1.8e12;
    window.__fake = true;
    window.__now = now;
    window.__seed(1);
    const beat = () => {
      window.__now = now += 200;
      const w =
        room.state.hang && room.state.hang.l4 && room.state.hang.l4.wait;
      if (w && !(w.v || {})[room.me])
        room.send({ t: "hang", k: "l4", do: "endturn", on: true, id: room.me }); // (on to the round)
      room.send({ t: "tick", id: room.me });
    };
    for (let k = 0; k < 600 && room.state.phase !== "hang"; k++) beat();
    for (
      let k = 0;
      k < 400 && Z.zombies(room.state).filter((z) => z.st !== 3).length < 3;
      k++
    )
      beat();
    const s = room.state,
      zs = Z.zombies(s).filter((z) => z.st !== 3),
      C = ZR.canopyDeck(),
      S = ZR.stationDeck();
    if (zs.length < 3) return { err: "only " + zs.length + " zombies" };
    const put = [
      {
        what: "on the canopy",
        x: (C.x0 + C.x1) / 2,
        y: (C.y0 + C.y1) / 2,
        st: 7,
        k: GS.DECKS.indexOf(C),
        want: C.h,
      },
      {
        what: "on the gas station's roof",
        x: S.x0 + 500,
        y: S.y0 + 100,
        st: 7,
        k: GS.DECKS.indexOf(S),
        want: S.h,
      },
      {
        what: "up the gas station's wall",
        x: S.x0 + 500,
        y: S.y1 + 10,
        st: 6,
        k: GS.DECKS.indexOf(S),
        want: null,
      },
    ];
    put.forEach((o, i) =>
      Object.assign(zs[i], { x: o.x, y: o.y, st: o.st, k: o.k }),
    );
    Z.store(s, zs, true);
    const mine = new Set(
      put.map((o) => Math.round(o.x) + "," + Math.round(o.y)),
    );
    R.l4Zone(
      s,
      (q) => mine.has(Math.round(q.x * LY.W) + "," + Math.round(q.y * LY.H)),
      "kill",
      0,
      now,
    );
    const out = [];
    put.forEach((o, i) => {
      const z = Z.zombies(s).find((q) => q.i === zs[i].i),
        h = HT.zOf(z, "zombie"),
        want = o.want === null ? LY.heightAt(o.x, o.y) : o.want;
      out.push({
        what: o.what,
        st: z.st,
        h: Math.round(h),
        want: Math.round(want),
      });
    });
    window.__fake = false;
    return { out };
  });
  noErrors(errs);
  if (r.err) fail("zcorpse: " + r.err);
  for (const o of r.out || []) {
    if (o.st !== 3) fail(`the zombie ${o.what} wasn't killed (st ${o.st})`);
    else if (o.h !== o.want)
      fail(`a zombie killed ${o.what} lies at height ${o.h}, not ${o.want}`);
  }
  console.log(
    "zcorpse: " +
      (r.out || []).map((o) => `${o.what} ${o.h}/${o.want}`).join(", "),
  );
  await b.close();
})();
