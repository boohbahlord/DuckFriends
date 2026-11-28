/* I want the supply crate checked (the director plan, Nov 28, and the owner's changes that day,
   cmsg_01LTpp6fzv8sfYUR5KoHADKtBUzMwY1XKox5HKv4m8BzaU; l4ddrules.js crateCome, crateTick, crateSolid, crateTake): when
   a round ends with a duck low on ammo that can't afford a refill, a crate is on its way (heard first) with one or two
   things for each of the two ducks here, and DIRECTOR.CRATE.HEAR later it lands on the gas station's roof by the
   soldier's red flare; it's solid up there and nothing under it; from the ground it can't be opened, from beside it on
   the roof it opens and a thing of it is taken; opened, it's gone when the next rest begins. A round that ends with
   every duck full sends none. A round that ends with a duck low on health, and no merchant come, drops two bandages by
   it (bandagesCome; the random held high, so no merchant comes and two bandages fall).
   Run: node tools/check/run.mjs crate */
const { fail, noErrors, fakedPage } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      GS = await import("./js/hangout/stationmap.js"),
      LY = await import("./js/hangout/layout.js"),
      { DIRECTOR } = await import("./js/gamedefaults.js"),
      { l4Room } = await import("./tools/check/l4room.js");
    const tick = (room, ms) => {
      for (let t = 0; t < ms; t += 200) {
        window.__now += 200;
        room.send({ t: "tick", id: room.me });
      }
    };
    /* a round under way, then every zombie of it gone: the rest comes on the next beat */
    const endRound = (room, poor, hurt) => {
      const s = room.state,
        me = room.me;
      if (hurt)
        s.hang.l4p = {
          ...s.hang.l4p,
          [me]: { ...s.hang.l4p[me], hp: R.maxHp(s, me) * 0.3 },
        };
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
      const rnd = Math.random;
      if (hurt) Math.random = () => 0.99;
      tick(room, 400);
      Math.random = rnd;
    };
    const play = async (name, poor, hurt) => {
      const room = await l4Room(
          name,
          (r) => r.state.hang && r.state.hang.l4 && r.state.hang.l4.r >= 1,
        ),
        me = room.me,
        { W, H } = LY;
      tick(room, 4000);
      endRound(room, poor, hurt);
      const me4 = room.state.pos[me],
        bands = (room.state.hang.l4dr || []).filter(
          (d) =>
            d.w === "bandage" &&
            Math.hypot(d.x - me4.x * W, d.y - me4.y * H) < 200,
        ).length;
      const coming = room.state.hang.l4cr,
        heard = (room.state.fx || []).some((f) => f.kind === "l4heli");
      tick(room, DIRECTOR.CRATE.HEAR + 400);
      const c = room.state.hang.l4cr,
        at = c && c.at,
        out = {
          wait: !!room.state.hang.l4.wait,
          coming: coming ? coming.w.length : 0,
          heard,
          bands,
        };
      if (!at) return out;
      const roof = LY.floorH(GS.FLARE.x, GS.FLARE.y, 1e4),
        kind = (z) => LY.solidsAt(at[0], at[1], z).map((q) => q.kind);
      Object.assign(out, {
        roof: at[2] === roof && roof > 0,
        flare: Math.round(Math.hypot(at[0] - GS.FLARE.x, at[1] - GS.FLARE.y)),
        solid: kind(at[2]).includes("crate"),
        under: kind(0).includes("crate"),
      });
      /* from the ground under it: no */
      const to = (x, y, z) =>
        (room.state.pos[me] = {
          ...room.state.pos[me],
          x: x / W,
          y: y / H,
          z,
        });
      to(at[0] + 60, at[1], 0);
      room.send({ t: "hang", k: "l4", do: "crate", open: true });
      out.ground = !!room.state.hang.l4cr.op;
      /* beside it on the roof: it opens, and its first thing is taken */
      to(at[0] + DIRECTOR.CRATE.HALF + 30, at[1], at[2]);
      room.send({ t: "hang", k: "l4", do: "crate", open: true });
      out.op = !!room.state.hang.l4cr.op;
      const has = R.kitOf(room.state, me).sl || [],
        w =
          room.state.hang.l4cr.w.find((x) => !has.includes(x)) ||
          room.state.hang.l4cr.w[0]; // (one it hasn't got: one it has stays in the crate)
      room.send({ t: "hang", k: "l4", do: "crate", what: w });
      out.took = room.state.hang.l4cr.w.length === out.coming - 1;
      /* the next round, ended with everyone able to buy a refill (no new crate): it's gone */
      room.state.hang.l4pt = { ...room.state.hang.l4pt, [me]: 1e6 };
      for (const id of room.state.seat)
        room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
      tick(room, 12000);
      endRound(room, false);
      out.gone = !room.state.hang.l4cr;
      out.free = !LY.solidsAt(at[0], at[1], at[2]).some(
        (q) => q.kind === "crate",
      );
      room.leave && room.leave();
      return out;
    };
    const out = {
      poor: await play("C1", true),
      full: await play("C2", false),
      hurt: await play("C3", false, true),
    };
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
  if (!P.roof || !(P.flare < 600)) bad("it lands on the flare's roof, by it");
  if (!P.solid || P.under) bad("solid on the roof, nothing under it");
  if (P.ground || !P.op || !P.took)
    bad("opened and taken from beside it on the roof only");
  if (!P.gone || !P.free) bad("opened: gone when the next rest begins");
  if (got.full.coming) bad("every duck full: no crate");
  if (got.full.bands) bad("every duck well: no bandages");
  if (got.hurt.bands !== 2)
    bad("low on health, no merchant: two bandages by it");
})();
