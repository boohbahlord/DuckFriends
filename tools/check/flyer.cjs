/* I want the Flyer checked (zombies.js flyerStep; the owner's, Nov 28): on round 5, made to come at once
   (SPECIAL_Z.AT), it climbs in, leaps on my duck and holds on; its bites take my HP and every screen hears it hold on;
   a melee crit throws it off, still alive. Run: node tools/check/run.mjs flyer */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1200, height: 800 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  );
  await p.goto(url, { waitUntil: "networkidle" });
  const got = await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      G = await import("./js/gamedefaults.js");
    G.SPECIAL_Z.AT = 1000;
    let now = 1.8e12;
    window.__fake = true;
    window.__now = now;
    const room = net.createLocalRoom({ name: "P", test: true, computers: 0 });
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
    const out = { log: [], set: 0 };
    let last = "";
    for (let k = 0; k < 2400; k++) {
      const L = room.state.hang && room.state.hang.l4,
        w = L && L.wait;
      if (w)
        for (const id of room.state.seat)
          if (!(w.v || {})[id])
            room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
      if (L && !L.wait && L.r === 1 && !out.set) {
        room.state.hang.l4 = {
          ...L,
          r: 5,
          n: 1,
          sz: {
            r: 5,
            m: 2,
            giant: { s: -1, o: 0, d: 1 },
            flyer: { s: 0, o: 1, d: 0 },
          },
        };
        out.set = 1;
      }
      window.__now = now += 100;
      room.send({ t: "tick", id: room.me });
      if (!room.state.hang || !room.state.hang.zp) continue;
      const f = Z.zombies(room.state).find((z) => z.l[8] === R.Z_BREED.flyer);
      const hp = R.l4Hp(room.state, room.me),
        pos = room.state.pos[room.me];
      const line = f ? `st${f.st}` : "none";
      if (line !== last) {
        out.log.push([
          k,
          line,
          +hp.toFixed(2),
          f && Math.round(f.x),
          f && Math.round(f.y),
          +pos.x.toFixed(3),
          +pos.y.toFixed(3),
        ]);
        last = line;
      }
      if (f && f.st === 9 && !out.held) out.held = { k, hp };
      if (out.held && k === out.held.k + 6)
        out.after = {
          hp,
          x: pos.x,
          y: pos.y,
          fx: (room.state.fx || []).filter((q) => q.kind === "l4latch").length,
        };
      if (out.after && !out.hit) {
        const kit = R.kitOf(room.state, room.me),
          real = Math.random,
          seq = [0.99, 0];
        Math.random = () => (seq.length ? seq.shift() : real());
        room.send({
          t: "use",
          id: room.me,
          what: kit.sl[0],
          ax: 1,
          ay: 0,
          dx: 1,
          dy: 0,
        });
        Math.random = real;
        const f2 = Z.zombies(room.state).find(
          (z) => z.l[8] === R.Z_BREED.flyer,
        );
        out.hit = {
          w: kit.sl[0],
          st: f2 && f2.st,
          hp: f2 && f2.hp,
          fc: f2 && f2.fc,
        };
      }
      if (out.hit && k > out.held.k + 12) break;
    }
    out.sz = room.state.hang.l4.sz;
    out.r = room.state.hang.l4.r;
    out.T = window.__now - room.state.hang.l4.t0;
    out.made = room.state.hang.l4.made;
    out.n = room.state.hang.l4.n;
    out.wait = !!room.state.hang.l4.wait;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("flyer: " + m + " " + JSON.stringify(got));
  if (!got.held) bad("it leaps on and holds the duck");
  else {
    if (!(got.after.hp < got.held.hp)) bad("its bites hurt");
    if (!got.after.fx) bad("every screen hears it hold on (l4latch)");
    if (!got.hit || got.hit.st !== 2 || got.hit.hp !== 3)
      bad("a melee crit throws it off, alive, 2 HP down");
  }
})();
