/* I want the director's merchants checked (the owner's, Nov 28; l4ddrules.js merchantCome, favStock, merchantDrops):
   1. one comes on round zero's rest (every roll held low), and he is the less likely one next time (MERCH.AGAIN);
   2. his stock is his own: the same again when he comes back, full, plus a bandage for each duck low on health;
   3. killed, he drops a purse of MERCH.PURSE points (every roll held low), and the duck that takes it gets them.
   Run: node tools/check/run.mjs merchants */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage(),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  ); // (the clock faked, as knock.cjs)
  await p.goto(url, { waitUntil: "networkidle" });
  const got = await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      R = await import("./js/l4ddrules.js");
    let now = 1.8e12;
    window.__fake = true;
    window.__now = now;
    const rnd = Math.random;
    Math.random = () => 0.01;
    const room = net.createLocalRoom({ name: "M", test: true, computers: 1 });
    room.close();
    room.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "l4dd",
        map: "downpour",
        botWait: 1,
        wildJustin: 0,
      },
    });
    room.send({ t: "start" });
    for (let k = 0; k < 600 && !R.merchantOf(room.state); k++) {
      const w =
        room.state.hang && room.state.hang.l4 && room.state.hang.l4.wait;
      for (const id of room.state.seat)
        if (w && !(w.v || {})[id])
          room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
      window.__now = now += 200;
      room.send({ t: "tick", id: room.me });
    }
    const s = JSON.parse(JSON.stringify(room.state)),
      m = R.merchantOf(s),
      out = {};
    Math.random = rnd;
    if (!m) return { err: "no merchant" };
    const h = s.hidden.l4mh;
    out.again = h.pw[m.id];
    out.same = JSON.stringify(m.stock) === JSON.stringify(h.fav[m.id]);
    m.stock = [];
    const back = R.favStock(s, m.id);
    out.back = JSON.stringify(back) === JSON.stringify(h.fav[m.id]);
    const me = room.me;
    s.hang.l4p = {
      ...s.hang.l4p,
      [me]: { ...s.hang.l4p[me], hp: R.maxHp(s, me) * 0.2 },
    };
    out.band =
      (R.favStock(s, m.id).find(([w]) => w === "bandage") || [])[2] || 0;
    Math.random = () => 0.01;
    R.merchantHurt(s, me, 99, (now += 100));
    Math.random = rnd;
    const purse = (s.hang.l4dr || []).find((d) => d.k === "coins");
    out.purse = purse ? purse.pts : 0;
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("merchants: " + m + " " + JSON.stringify(got));
  if (got.err) return bad(got.err);
  if (got.again !== 0.25) bad("the one who came weighs MERCH.AGAIN");
  if (!got.same || !got.back) bad("his own stock, the same when he comes back");
  if (got.band < 1) bad("a bandage while a duck is low");
  if (got.purse !== 1000) bad("killed, a purse of 1,000 points");
})();
