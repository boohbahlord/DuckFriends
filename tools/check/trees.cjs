/* I want trees checked (E4; the owner's, Nov 21: "Trees: elevation follows size; the trunk drawn and hit in the same
   top-down perspective as everything else; you can't land on a trunk's top, you fall off it the way you came, and only
   clear it by jumping over"):
   1. every Downpour tree is as tall as its drawing (its leaves' top over its trunk's foot, stationtrees.js), so a bigger
      tree of a kind is taller, and nothing stops a duck over that top;
   2. its trunk stops ducks over the drawn trunk's foot (flared on the ground), at its size, half as deep as wide;
   3. layout.js landOff: a duck coming down into a trunk is back at the last spot it stood off it; one over its top, or
      walking beside it, stays where it is.
   4. no trunk stands closer to a building's wall than two zombies across, and a crowd of 8 zombies coming at my duck
      from the east by the tree next to the gas station's east wall gets round it to my duck (the owner's, Nov 22 18:07Z:
      "zombie ducks getting stuck on a tree ... not moving around it": its trunk left a gap one zombie wide).
   Run: node tools/check/run.mjs trees */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage(),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
  await p.goto(url);
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async () => {
    const L = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      SA = await import("./js/hangout/stationart.js");
    L.useMode("l4dd", "downpour");
    const trees = L.PROPS.filter((q) => q.kind === "tree"),
      out = { n: trees.length, bad: [], taller: 0, pairs: 0 };
    for (const t of trees) {
      const { kind, v, seed, flip } = GS.swampPick(t.id),
        k = GS.treeK(t.big),
        cr = SA.swampCrownSVG(kind, v, seed, flip),
        top = (cr.ay - (cr.h - GS.SWAMP_CROWN[kind][v].h) / 2) * k, // (the leaves' top over the foot, as drawn)
        sol = L.SOLIDS.find((s) => s.id === t.id),
        w = sol.x1 - sol.x0,
        d = sol.y1 - sol.y0,
        cx = (sol.x0 + sol.x1) / 2,
        cy = (sol.y0 + sol.y1) / 2;
      if (
        Math.abs(t.h - top) > 1 ||
        Math.abs(sol.top - (t.z + t.h)) > 1e-6 ||
        !sol.noLand ||
        Math.abs(w - GS.SWAMP_TRUNK[kind].w * GS.SWAMP_TRUNK[kind].flare * k) >
          1e-6 ||
        Math.abs(d - w / 2) > 1e-6 ||
        L.solidsAt(cx, cy, sol.top + 1).some((s) => s.id === t.id) ||
        !L.solidsAt(cx, cy, sol.top - 1).some((s) => s.id === t.id)
      )
        out.bad.push([t.id, kind, v, t.h, top, w, d, sol.top]);
    }
    /* a bigger tree of a kind and a look is taller */
    for (const a of trees)
      for (const c of trees) {
        const pa = GS.swampPick(a.id),
          pc = GS.swampPick(c.id);
        if (pa.kind !== pc.kind || pa.v !== pc.v || !(a.big > c.big)) continue;
        out.pairs++;
        if (a.h > c.h) out.taller++;
      }
    /* landOff, round the first tree's trunk */
    const t = L.SOLIDS.find((s) => s.noLand),
      cx = (t.x0 + t.x1) / 2,
      cy = (t.y0 + t.y1) / 2,
      by = t.y1 + 60, // (just south of it, off it)
      me = { z: t.top - 200 };
    const at = (x, y, z) => {
      me.z = z;
      return L.landOff(me, x, y).map(
        (u, i) => +(u * (i ? L.H : L.W)).toFixed(1),
      );
    };
    out.off = at(cx, by, 0); // (beside it: stays)
    out.over = at(cx, cy, t.top + 5); // (over its top: stays)
    out.down = at(cx, cy, t.top - 5); // (come down into it: back off it)
    out.spot = [cx, by];
    /* 4. the room between a trunk and a wall (the station, the chapel, its tower, the generator) */
    const walls = L.SOLIDS.filter((s) => /^gs-(wall|generator)/.test(s.id)),
      room = [];
    for (const s of L.SOLIDS.filter((q) => q.noLand))
      for (const w of walls) {
        const dx = Math.max(w.x0 - s.x1, s.x0 - w.x1, 0),
          dy = Math.max(w.y0 - s.y1, s.y0 - w.y1, 0),
          g = Math.hypot(dx, dy);
        if (g < 90) room.push([s.id, w.id, Math.round(g)]);
      }
    out.room = room;
    return out;
  });
  /* the crowd by the station's east wall (fixed seed and fake clock, as zclimb.cjs) */
  const q = await b.newPage({ viewport: { width: 800, height: 450 } });
  q.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
  await q.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  );
  await q.goto(url, { waitUntil: "networkidle" });
  const crowd = await q.evaluate(async () => {
    const net = await import("./js/net.js"),
      { botActions } = await import("./js/bots.js"),
      L = await import("./js/hangout/layout.js"),
      Z = await import("./js/zombies.js");
    window.__fake = true;
    window.__now = 1.8e12;
    window.__seed(1);
    const room = net.createLocalRoom({ name: "Z", test: true, computers: 0 });
    room.close();
    const beat = () => {
      window.__now += 200;
      room.send({ t: "tick", id: room.me });
      for (const a of botActions(room.state, window.__now)) room.send(a);
    };
    room.send({
      t: "options",
      options: {
        modePick: "",
        mapPick: "",
        botWait: 1,
        mode: "l4dd",
      },
    });
    room.send({ t: "start" });
    for (let k = 0; k < 600 && room.state.phase !== "hang"; k++) beat();
    (await import("./js/l4ddrules.js")).helperOut(room.state);
    const spot = [2160, 1050], // (where the owner stood: by the east wall's south end, west of the tree)
      from = [
        [2330, 980],
        [2330, 1060],
        [2330, 1140],
        [2200, 1180],
        [2120, 1200],
        [2260, 900],
        [2300, 1250],
        [2400, 1060],
      ],
      placed = new Map(),
      best = new Map();
    let hp0 = null;
    for (let n = 0; n < 300; n++) {
      const s = room.state,
        me = s.pos[room.me];
      s.pos = {
        ...s.pos,
        [room.me]: {
          ...me,
          x: spot[0] / L.W,
          y: spot[1] / L.H,
          z: L.heightAt(...spot),
        },
      };
      const hp = s.hang.l4p && s.hang.l4p[room.me];
      if (hp) {
        if (hp0 === null) hp0 = hp;
        s.hang = { ...s.hang, l4p: { ...s.hang.l4p, [room.me]: hp0 } };
      }
      if (s.hang.l4 && s.hang.l4.wait && !(s.hang.l4.wait.v || {})[room.me])
        room.send({ t: "hang", k: "l4", do: "endturn", on: true, id: room.me });
      const zs = Z.zombies(room.state);
      let put = false;
      for (const z of zs)
        if (z.st < 3 && !placed.has(z.i) && placed.size < from.length) {
          [z.x, z.y] = from[placed.size];
          placed.set(z.i, 1);
          z.st = 2;
          put = true;
        }
      if (put) Z.store(room.state, zs);
      beat();
      for (const z of Z.zombies(room.state))
        if (placed.has(z.i))
          best.set(
            z.i,
            Math.min(
              best.get(z.i) ?? 1e9,
              Math.hypot(z.x - spot[0], z.y - spot[1]),
            ),
          );
    }
    window.__fake = false;
    return [...best.values()].map(Math.round);
  });
  if (got.n < 50) fail("Downpour's trees: only " + got.n);
  if (got.bad.length)
    fail(
      got.bad.length +
        " trees not as drawn (id, kind, look, h, drawn top, trunk w, d, top): " +
        JSON.stringify(got.bad.slice(0, 4)),
    );
  if (!got.pairs || got.taller !== got.pairs)
    fail(`bigger trees taller: ${got.taller} of ${got.pairs}`);
  const same = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]) < 0.5;
  if (!same(got.off, got.spot) || !same(got.down, got.spot))
    fail("a duck coming down into a trunk: " + JSON.stringify(got));
  if (same(got.over, got.spot))
    fail("a duck over a trunk's top was moved: " + JSON.stringify(got.over));
  if (got.room.length)
    fail(
      "trunks too near a wall (tree, wall, px): " +
        JSON.stringify(got.room.slice(0, 4)),
    );
  const by = crowd.filter((d) => d <= 64).length;
  if (by < 6)
    fail(
      `by the tree at the station's east wall, only ${by} of 8 zombies got to my duck (${crowd})`,
    );
  console.log(
    `trees: ${got.n}, trunks clear of the walls, ${by} of 8 zombies round the station's east tree`,
  );
  await b.close();
  noErrors(errs);
})();
