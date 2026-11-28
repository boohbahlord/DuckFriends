/* I want every push in the game pinned (the knockback rule, push.js; Adam's, Nov 28: pin today's pushes before they
   change): how far each one moves what it hits, and how high it throws it, kept in tools/check/knock.json. A change
   in any of them fails here until it's meant and re-pinned (PIN=1 node tools/check/run.mjs knock).
   - the board (Who's the Lord?): each melee swung at a duck a duck length off; a grenade at 0.3 and 1 duck lengths;
   - Dead Ducks Arcade on Downpour: each melee on a living zombie and on a dead one 40 px off, the hammer on another
     duck and on a car, and a grenade by a zombie, a duck and a car.
   Every roll held at 0.5, the clock faked (tools/npc-golden/init.js). Run: node tools/check/run.mjs knock */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const PIN = path.join(__dirname, "knock.json");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 800, height: 450 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  );
  await p.goto(url, { waitUntil: "networkidle" });
  const got = await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      BF = await import("./js/boardfire.js"),
      R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      LY = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      { ARMS } = await import("./js/guns.js"),
      { NADE } = await import("./js/gamedefaults.js");
    const r4 = (n) => Math.round(n * 1e4) / 1e4,
      r1 = (n) => Math.round(n * 10) / 10,
      out = {};
    let now = 1.8e12;
    window.__fake = true;
    window.__now = now;
    window.__seed(1);
    const rnd = Math.random,
      held = (f) => {
        Math.random = () => 0.5;
        try {
          return f();
        } finally {
          Math.random = rnd;
        }
      };
    /* the board */
    {
      const room = net.createLocalRoom({ name: "B", test: true, computers: 1 });
      room.close();
      room.send({ t: "options", options: { modePick: "host", mode: "aod" } });
      room.send({ t: "start" });
      for (let k = 0; k < 40; k++) {
        window.__now = now += 200;
        room.send({ t: "tick", id: room.me });
      }
      const base = JSON.parse(JSON.stringify(room.state)),
        [a, c] = base.seat,
        fresh = () => {
          const s = JSON.parse(JSON.stringify(base));
          s.pos[a] = { ...s.pos[a], x: 0.4, y: 0.5 };
          s.pos[c] = { ...s.pos[c], x: 0.43, y: 0.5 };
          delete s.prot;
          return s;
        };
      out.board = {};
      for (const w of BF.MELEE) {
        const s = fresh();
        held(() => BF.strike(s, a, w, [0.03, 0], (now += 5000)));
        const q = s.pos[c];
        out.board[w] = [
          r4(q.x - 0.43),
          r4(q.y - 0.5),
          q.kb ? r1(q.kb.h || 0) : 0,
        ];
      }
      for (const d of [0.3, 1]) {
        const s = fresh();
        s.pos[c] = { ...s.pos[c], x: 0.4 + 0.03 * d };
        held(() =>
          BF.blast(s, { by: a, k: "grenade", hz: 0 }, 0.4, 0.5, (now += 5000)),
        );
        const q = s.pos[c];
        out.board["grenade " + d] = [
          r4(q.x - 0.4 - 0.03 * d),
          r4(q.y - 0.5),
          q.kb ? r1(q.kb.h || 0) : 0,
        ];
      }
    }
    /* Dead Ducks Arcade, on Downpour */
    {
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
      const beat = () => {
        window.__now = now += 200;
        const w =
          room.state.hang && room.state.hang.l4 && room.state.hang.l4.wait;
        for (const id of room.state.seat)
          if (w && !(w.v || {})[id])
            room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
        room.send({ t: "tick", id: room.me });
      };
      for (let k = 0; k < 600 && room.state.phase !== "hang"; k++) beat();
      for (
        let k = 0;
        k < 400 &&
        (Z.zombies(room.state).filter((z) => z.st !== 3 && !z.wk).length < 2 ||
          !(room.state.hang.l4.r >= 1)); // (a round's zombies, not a rest's walkers)
        k++
      )
        beat();
      const s = room.state,
        me = room.me,
        bot = s.seat.find((q) => q !== me),
        W = LY.W,
        H = LY.H,
        at = [2600, 2000]; // (open ground by the road, north of the cars)
      if (Z.zombies(s).filter((z) => z.st !== 3).length < 2)
        return {
          err:
            "no zombies " +
            room.state.phase +
            " " +
            JSON.stringify(room.state.hang && room.state.hang.l4) +
            " " +
            Z.zombies(s).length,
        };
      const place = (o) => {
        s.pos[me] = { ...s.pos[me], x: at[0] / W, y: at[1] / H, z: 0, w: o.w };
        if (o.bot)
          s.pos[bot] = {
            ...s.pos[bot],
            x: (at[0] + 40) / W,
            y: at[1] / H,
            z: 0,
          };
        else s.pos[bot] = { ...s.pos[bot], x: 0.05, y: 0.05 };
        const zs = Z.zombies(s);
        zs.forEach((z, i) => {
          Object.assign(z, {
            x: i === 0 && o.z ? at[0] + 40 : 100 + i * 30,
            y: i === 0 && o.z ? at[1] : 100,
            st: i === 0 && o.z ? o.z : 3,
            hp: 50,
          });
          delete z.k;
        });
        Z.store(s, zs, true);
        s.hang.cars = {};
        const kit = R.kitOf(s, me);
        s.hang.l4a = {
          ...s.hang.l4a,
          [me]: { ...kit, sl: [o.w, ...kit.sl.slice(1)], g: 4, u: {} },
        };
        s.hang.l4k = [];
      };
      const zAt = () => {
        const t = room.state, // (the ticks make the room a new state)
          z = Z.zombies(t)[0];
        return [r1(z.x - at[0] - 40), r1(z.y - at[1])];
      };
      const use = (w, ax, ay, dr) =>
        held(() =>
          R.l4Use(
            s,
            { id: me, what: w, ax: ax / W, ay: ay / H, dr },
            (now += 3000),
          ),
        );
      out.dda = {};
      for (const w of ["knife", "hammer", "axe", "sword", "pan"])
        for (const st of [2, 3]) {
          place({ w, z: st });
          use(w, 40, 0);
          out.dda[w + (st === 2 ? " zombie" : " corpse")] = zAt();
        }
      place({ w: "hammer", bot: 1 });
      use("hammer", 40, 0);
      out.dda["hammer duck"] = [
        r1(s.pos[bot].x * W - at[0] - 40),
        r1(s.pos[bot].y * H - at[1]),
        s.pos[bot].kb ? r1(s.pos[bot].kb.h || 0) : 0,
      ];
      /* a car: me just west of the middle of the car on the road's middle, swinging east */
      const C = GS.CARS[3],
        cx = C.x0 - 30,
        cy = (C.y0 + C.y1) / 2;
      place({ w: "hammer" });
      s.pos[me] = { ...s.pos[me], x: cx / W, y: cy / H };
      use("hammer", 40, 0);
      out.dda["hammer car"] = (s.hang.cars || {})[3] || [0, 0];
      /* a grenade thrown its range (ARMS) south of me, cooked till 0.3 s after it lands, from the dry ground north of
         the car; it comes down about 30 px short of the car (a little past its range: the road's bed is lower), with a
         zombie and the other duck 60 px either side of where it was aimed: each one's move over the beat it goes off in */
      const gx = (C.x0 + C.x1) / 2,
        gy = C.y0 - 48;
      place({ w: "hammer", z: 2, bot: 1 });
      s.pos[me] = { ...s.pos[me], x: gx / W, y: (gy - ARMS.grenade.far) / H };
      const zs = Z.zombies(s);
      Object.assign(zs[0], { x: gx - 60, y: gy });
      Z.store(s, zs, true);
      s.pos[bot] = { ...s.pos[bot], x: (gx + 60) / W, y: gy / H };
      use("grenade", 0, 200, NADE.FUSE - NADE.T - 300);
      const look = () => {
        const t = room.state,
          z = Z.zombies(t)[0],
          q = t.pos[bot];
        return {
          z: [z.x, z.y, z.st],
          d: [q.x * W, q.y * H, q.kb ? q.kb.h || 0 : 0],
          car: (t.hang.cars || {})[3] || [0, 0],
          up: (t.shots || []).length,
        };
      };
      let was = look(),
        got = was;
      for (let k = 0; k < 40 && got.up; k++) {
        window.__now = now += 100;
        room.send({ t: "tick", id: me });
        was = got;
        got = look();
      }
      if (got.up) return { err: "the grenade never went off" };
      out.dda["grenade zombie"] = [
        r1(got.z[0] - was.z[0]),
        r1(got.z[1] - was.z[1]),
        got.z[2],
      ];
      out.dda["grenade duck"] = [
        r1(got.d[0] - was.d[0]),
        r1(got.d[1] - was.d[1]),
        r1(got.d[2]),
      ];
      out.dda["grenade car"] = got.car;
    }
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  if (got.err) return fail("knock: " + got.err);
  if (process.env.PIN) {
    fs.writeFileSync(PIN, JSON.stringify(got, null, 1) + "\n");
    return;
  }
  const want = JSON.parse(fs.readFileSync(PIN, "utf8"));
  for (const part of Object.keys(want))
    for (const k of Object.keys(want[part]))
      if (JSON.stringify(got[part][k]) !== JSON.stringify(want[part][k]))
        fail(
          `knock: ${part} ${k} moved ${JSON.stringify(got[part][k])}, pinned ${JSON.stringify(want[part][k])}`,
        );
})();
