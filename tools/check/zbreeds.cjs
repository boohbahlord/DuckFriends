/* I want the special zombies' coming checked (zombies.js specialTick, gamedefaults.js SPECIAL_Z; the owner's, Nov 28):
   none before their rounds; on round 8 with every roll a hit the Giant comes and the Flyer waits, as the two are never
   alive together, and comes next round without a roll; once a round; nothing before 30 s or the round's dead mark; a
   duck doing badly makes both wait a round and go back a step.
   Run: node tools/check/run.mjs zbreeds */
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
      Z = await import("./js/zombies.js"),
      R = await import("./js/l4ddrules.js");
    let now = 1.8e12;
    window.__fake = true;
    window.__now = now;
    const room = net.createLocalRoom({ name: "Z", test: true, computers: 1 });
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
    const s0 = JSON.parse(JSON.stringify(room.state)),
      me = room.me,
      B = R.Z_BREED,
      real = Math.random,
      kinds = (zs) => zs.map((z) => z.l[8]),
      run = (s, L, zs, T, roll) => {
        Math.random = () => roll;
        try {
          Z.specialTick(s, L, zs, T);
        } finally {
          Math.random = real;
        }
        return kinds(zs);
      },
      fresh = (r, sz) => {
        const s = JSON.parse(JSON.stringify(s0));
        return { s, L: { ...s.hang.l4, r, n: 40, made: 0, next: 900, sz } };
      },
      out = {};
    /* round 4: neither yet */
    let { s, L } = fresh(4);
    out.r4 = run(s, L, [], 30000, 0);
    /* round 8 at 30 s, every roll a hit: the Giant comes; the Flyer waits (the Giant is alive) */
    ({ s, L } = fresh(8));
    let zs = [];
    out.r8 = run(s, L, zs, 30000, 0);
    out.r8owed = L.sz.flyer.o;
    out.r8again = run(s, L, zs, 31000, 0).length; // (once a round)
    /* the next round with the Giant dead: the Flyer it owed comes, with no roll (a roll of 0.99 would miss) */
    const sz = L.sz;
    ({ s, L } = fresh(9, sz));
    out.r9 = run(s, L, [], 30000, 0.99);
    /* before its moment: nothing; at a third dead (mark 0, the roll 0 picks it) it comes */
    ({ s, L } = fresh(8));
    out.early = run(s, L, [], 1000, 0);
    ({ s, L } = fresh(8));
    L.made = 14;
    out.mark = run(s, L, [], 1000, 0);
    /* a duck doing badly: both wait, owed, and a step back */
    ({ s, L } = fresh(8));
    s.hang.l4p = {
      ...s.hang.l4p,
      [me]: { ...s.hang.l4p[me], hp: R.maxHp(s, me) * 0.3 },
    };
    out.bad = run(s, L, [], 30000, 0);
    out.badSz = L.sz;
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("zbreeds: " + m + " " + JSON.stringify(got));
  const B = { flyer: 4, giant: 5 };
  if (got.r4.length) bad("nothing before round 5");
  if (String(got.r8) !== String([B.giant]) || !got.r8owed)
    bad("round 8: the Giant comes, the Flyer waits");
  if (got.r8again !== 1) bad("once a round");
  if (String(got.r9) !== String([B.flyer]))
    bad("the owed Flyer comes next round");
  if (got.early.length) bad("nothing before its moment");
  if (String(got.mark) !== String([B.giant])) bad("a third dead is its moment");
  if (
    got.bad.length ||
    !got.badSz.giant.o ||
    got.badSz.giant.s !== -1 ||
    got.badSz.flyer.s !== -1
  )
    bad("doing badly: both wait and go back a step");
})();
