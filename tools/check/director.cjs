/* I want the director's measuring checked (js/director.js; the owner approved it, Nov 28): in Dead Ducks Arcade, a duck
   at full health with full guns reads 1, 1 and rich; a duck down to a quarter of its rounds is doing badly; a duck
   under 40% health is low; no points make it not rich (the cheapest gun the merchants sell).
   Run: node tools/check/run.mjs director */
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
      D = await import("./js/director.js"),
      R = await import("./js/l4ddrules.js");
    let now = 1.8e12;
    window.__fake = true;
    window.__now = now;
    const room = net.createLocalRoom({ name: "D", test: true, computers: 1 });
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
    for (let k = 0; k < 600 && !R.kitOf(room.state, room.me); k++) {
      const w =
        room.state.hang && room.state.hang.l4 && room.state.hang.l4.wait;
      for (const id of room.state.seat)
        if (w && !(w.v || {})[id])
          room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
      window.__now = now += 200;
      room.send({ t: "tick", id: room.me });
    }
    const s = JSON.parse(JSON.stringify(room.state)),
      me = room.me,
      out = {},
      kit = R.kitOf(s, me),
      gun = kit.sl.find((w) => R.fullFor(s, me, w) && w !== "grenade");
    s.hang.l4pt = { ...(s.hang.l4pt || {}), [me]: 99999 };
    out.n = D.ducks(s).length;
    const mine = () => D.ducks(s).find((d) => d.id === me);
    out.full = mine();
    const f = R.fullFor(s, me, gun),
      q = Math.floor((f[0] + f[1]) / 4);
    s.hang.l4a = {
      ...s.hang.l4a,
      [me]: { ...kit, am: { ...kit.am, [gun]: [q, 0] } },
    };
    out.quarter = mine();
    out.badly = D.badly(mine());
    s.hang.l4pt[me] = 0;
    out.poor = mine().rich;
    s.hang.l4p = {
      ...s.hang.l4p,
      [me]: { ...s.hang.l4p[me], hp: R.maxHp(s, me) * 0.3 },
    };
    out.low = D.lowHp(mine());
    out.gun = gun;
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("director: " + m + " " + JSON.stringify(got));
  if (got.n < 2) bad("both ducks measured");
  if (got.full.hp !== 1 || got.full.ammo !== 1 || !got.full.rich)
    bad("a full duck reads 1, 1, rich");
  if (Math.abs(got.quarter.ammo - 0.25) > 0.05 || !got.badly)
    bad("a quarter of its rounds: doing badly");
  if (got.poor) bad("no points: not rich");
  if (!got.low) bad("30% health is low");
})();
