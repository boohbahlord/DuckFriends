/* I want the supply crate checked (the director plan, Nov 28; l4ddrules.js crateCome, crateTick): when a round ends with a
   duck low on ammo that can't afford a refill, a crate is on its way (heard first), and DIRECTOR.CRATE.HEAR later its
   things lie by the soldier's red flare: one or two for each of the two ducks here. A round that ends with every duck
   full sends none.
   Run: node tools/check/run.mjs crate */
const { fail, noErrors, fakedPage } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      GS = await import("./js/hangout/stationmap.js"),
      { DIRECTOR } = await import("./js/gamedefaults.js"),
      { l4Room } = await import("./tools/check/l4room.js");
    const tick = (room, ms) => {
      for (let t = 0; t < ms; t += 200) {
        window.__now += 200;
        room.send({ t: "tick", id: room.me });
      }
    };
    /* round 1 under way, then every zombie of it gone: the rest comes on the next beat */
    const endRound = (room, poor) => {
      const s = room.state,
        me = room.me;
      if (poor) {
        const kit = R.kitOf(s, me);
        s.hang.l4a = {
          ...s.hang.l4a,
          [me]: {
            ...kit,
            am: Object.fromEntries(
              Object.keys(kit.am || {}).map((w) => [w, [0, 0]]),
            ),
          },
        };
        s.hang.l4pt = { ...s.hang.l4pt, [me]: 0 };
      }
      s.hang.l4 = { ...s.hang.l4, made: s.hang.l4.n };
      Z.store(s, [], false);
      tick(room, 400);
    };
    const play = async (name, poor) => {
      const room = await l4Room(
        name,
        (r) => r.state.hang && r.state.hang.l4 && r.state.hang.l4.r >= 1,
      );
      tick(room, 4000);
      const before = (room.state.hang.l4dr || []).length;
      endRound(room, poor);
      const coming = room.state.hang.l4cr,
        heard = (room.state.fx || []).some((f) => f.kind === "l4heli");
      tick(room, DIRECTOR.CRATE.HEAR + 400);
      const near = (room.state.hang.l4dr || []).filter(
        (d) => Math.hypot(d.x - GS.FLARE.x, d.y - GS.FLARE.y) < 1300,
      );
      room.leave && room.leave();
      return {
        wait: !!room.state.hang.l4.wait,
        coming: coming ? coming.n : 0,
        heard,
        laid: (room.state.hang.l4dr || []).length - before,
        near: near.length,
      };
    };
    const out = { poor: await play("C1", true), full: await play("C2", false) };
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("crate: " + m + " " + JSON.stringify(got));
  const P = got.poor;
  if (!P.wait) return bad("the round didn't end");
  if (!(P.coming >= 2 && P.coming <= 4) || !P.heard)
    bad("low on ammo and poor: a crate of 2 to 4 things on its way, heard");
  if (P.near !== P.coming) bad("its things by the flare");
  if (got.full.coming || got.full.near) bad("every duck full: no crate");
})();
