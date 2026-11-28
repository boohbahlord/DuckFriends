/* I want a rest's walkers checked (the director plan, Nov 28; l4ddrules.js walkersTick, zombies.js walkerAt): in the
   rest after a round, walkers turn up out of every duck's sight and out of every building, never more than the most,
   and wander outside the church; one my duck walks up to comes for it; the next round they join its horde. With the
   lights on, the next horde is a tenth bigger.
   Run: node tools/check/run.mjs walkers */
const { fail, noErrors, fakedPage } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const Z = await import("./js/zombies.js"),
      R = await import("./js/l4ddrules.js"),
      GS = await import("./js/hangout/stationmap.js"),
      LY = await import("./js/hangout/layout.js"),
      { DIRECTOR } = await import("./js/gamedefaults.js"),
      { l4Room } = await import("./tools/check/l4room.js");
    const tick = (room, ms, each) => {
      for (let t = 0; t < ms; t += 200) {
        window.__now += 200;
        room.send({ t: "tick", id: room.me });
        if (each) each();
      }
    };
    const toRest = async (name) => {
      const room = await l4Room(
        name,
        (r) => r.state.hang && r.state.hang.l4 && r.state.hang.l4.r >= 1,
      );
      tick(room, 3000);
      const s = room.state;
      s.hang.l4 = { ...s.hang.l4, made: s.hang.l4.n };
      Z.store(s, [], false);
      tick(room, 400);
      return room;
    };
    const vote = (room) => {
      for (const id of room.state.seat)
        room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
      for (let k = 0; k < 100 && room.state.hang.l4.wait; k++) tick(room, 200);
      tick(room, 400);
    };
    const room = await toRest("W1"),
      s = room.state,
      me = room.me,
      first = {},
      out = { rest: !!s.hang.l4.wait, most: 0, seen: 0, inB: 0, church: 0 };
    tick(room, 40000, () => {
      const ws = Z.zombies(room.state).filter((z) => z.wk && z.st !== 3); // (the standing ones)
      out.most = Math.max(out.most, ws.length);
      const pts = room.state.seat
        .filter((id) => room.state.pos[id])
        .map((id) => [
          room.state.pos[id].x * LY.W,
          room.state.pos[id].y * LY.H,
        ]);
      for (const z of ws) {
        if (!first[z.i]) {
          first[z.i] = 1;
          if (
            pts.some(
              ([a, b2]) =>
                Math.abs(z.x - a) < R.VIEW.x && Math.abs(z.y - b2) < R.VIEW.y,
            )
          )
            out.seen++;
          if (GS.buildingAt(z.x, z.y)) out.inB++;
        }
        if (z.wk === 1 && GS.buildingAt(z.x, z.y) === 2) out.church++;
      }
    });
    out.made = Object.keys(first).length;
    out.cap = DIRECTOR.WALKERS.MOST[0] + DIRECTOR.WALKERS.MOST[1] * 2;
    /* my duck right by one: it comes for me */
    const w = Z.zombies(room.state).find((z) => z.wk === 1);
    if (w) {
      room.send({
        t: "hang",
        k: "cheat",
        do: "goto",
        id: me,
        x: w.x + 40,
        y: w.y,
      });
      tick(room, 600);
      const w2 = Z.zombies(room.state).find((z) => z.i === w.i);
      out.came = !!w2 && w2.wk === 2 && w2.wt === me;
    }
    /* the lights on, then the next round: they join it, and it's a tenth bigger */
    room.state.hang.power = 1;
    const up = Z.zombies(room.state)
      .filter((z) => z.wk && z.st !== 3)
      .map((z) => z.i);
    vote(room);
    out.left = Z.zombies(room.state).filter((z) => z.wk).length;
    const ids = new Set(Z.zombies(room.state).map((z) => z.i));
    out.joined = up.every((i) => ids.has(i)); // (the same ones, now of the horde)
    out.litN = room.state.hang.l4.n;
    room.leave && room.leave();
    const dark = await toRest("W2");
    vote(dark);
    out.darkN = dark.state.hang.l4.n;
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("walkers: " + m + " " + JSON.stringify(got));
  if (!got.rest) return bad("the round didn't end");
  if (got.made < 3) bad("walkers turn up in a rest");
  if (got.most > got.cap) bad("never more than the most");
  if (got.seen) bad("every one out of every duck's sight");
  if (got.inB) bad("every one out of every building");
  if (got.church) bad("a wandering one never in the church");
  if (!got.came) bad("one my duck walks up to comes for it");
  if (got.left || !got.joined) bad("the next round: they're its horde");
  if (got.litN !== Math.round(got.darkN * 1.1))
    bad("the lights on: a tenth bigger horde");
})();
