/* I want the Giant checked (zombies.js giantStep, giantHit; the owner's, Nov 28 03:28Z): its swing throws my duck far
   (a flight: pos.kb), it throws a zombie beside it at me from a way off, and next to a car with me past it, it knocks
   the car into me (made sure: car.chance 1). Run: node tools/check/run.mjs giant */
const { fakedPage, fail, noErrors } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      Lay = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      G = await import("./js/gamedefaults.js");
    const GT = G.SPECIAL_Z.giant;
    Lay.useMode("l4dd", "downpour");
    window.__fake = true;
    window.__now = 1.8e12;
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
    const tick = () => {
      window.__now += 100;
      room.send({ t: "tick", id: room.me });
    };
    for (let k = 0; k < 600; k++) {
      const L = room.state.hang && room.state.hang.l4,
        w = L && L.wait;
      if (w)
        for (const id of room.state.seat)
          if (!(w.v || {})[id])
            room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
      if (L && !L.wait && room.state.hang.zp) break;
      tick();
    }
    const s = () => room.state,
      me = room.me,
      at = (x, y) => {
        s().pos[me] = { ...s().pos[me], x: x / Lay.W, y: y / Lay.H, j: 0 };
        delete s().pos[me].kb;
      },
      put = (list) => {
        s().hang.l4 = { ...s().hang.l4, n: 999 };
        Z.store(s(), list, false);
      },
      giant = (x, y) => {
        const z = Z.newZombie(s(), s().hang.l4, 0, [], "giant");
        return Object.assign(z, { x, y, st: 2 });
      },
      plain = (x, y) =>
        Object.assign(Z.newZombie(s(), s().hang.l4, 0, []), { x, y, st: 2 }),
      kb = () => s().pos[me].kb,
      out = {};
    /* a spot by where I came in with 7 duck rooms walkable one way (the map is scaled: stationmap.js) */
    const [sx, sy] = [s().pos[me].x * Lay.W, s().pos[me].y * Lay.H];
    let ux = 1,
      uy = 0;
    for (let a = 0; a < 6.28; a += 0.2)
      if (
        Z.walkable(
          sx,
          sy,
          sx + Math.cos(a) * R.RX * 8,
          sy + Math.sin(a) * R.RX * 8,
        )
      ) {
        [ux, uy] = [Math.cos(a), Math.sin(a)];
        break;
      }
    const X = (n) => sx + ux * R.RX * n,
      Y = (n) => sy + uy * R.RX * n;
    /* its swing: right beside me */
    const C = GS.CARS[2],
      cy = (C.y0 + C.y1) / 2;
    at(C.x1 + 60, cy);
    put([giant(C.x1 + 60 - R.RX * 0.8, cy)]); // (on the road, by car 2, the way on open)
    for (let k = 0; k < 40 && !kb(); k++) tick();
    out.hit = kb() && { d: kb().d, h: kb().h };
    /* a zombie beside it thrown at me, 7 rooms off */
    at(X(7), Y(7));
    const g2 = giant(X(0), Y(0)),
      z2 = plain(X(-1), Y(-1));
    put([g2, z2]);
    for (let k = 0; k < 40; k++) {
      tick();
      const t = Z.zombies(s()).find((z) => z.i === z2.i);
      if (t && t.st === 8 && t.tw) out.flew = 1;
      if (out.flew && t && t.st === 2) {
        out.landed = Math.round(Z.room(t.x, t.y, X(7), Y(7)));
        break;
      }
    }
    /* by car 2, me just past it */
    GT.car.chance = 1;
    at(C.x1 + 60, cy);
    put([giant(C.x0 - 20, cy)]);
    for (let k = 0; k < 20 && !kb(); k++) tick();
    out.car = (s().hang.cars || {})[2] || null;
    out.carHit = kb() && kb().d;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("giant: " + m + " " + JSON.stringify(got));
  if (!got.hit || !(got.hit.d > 100) || !got.hit.h)
    bad("its swing throws my duck far, up in the air");
  if (!got.flew) bad("it throws a zombie at me");
  else if (!(got.landed < 2)) bad("the zombie lands by me");
  if (!got.car || !(got.car[0] > 50)) bad("it knocks the car my way");
  if (!got.carHit) bad("the car hits me");
})();
