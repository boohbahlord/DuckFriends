/* I want the generator's E checked (the director plan, Nov 28; l4ddpower.js powerAct): off with no fuel, held does
   nothing; a can poured in turns it on; held, it switches the power off with fuel left and keeps that fuel; a tap pours a jerry can in, which doesn't turn back on what was switched off by
   hand; held again, it's on; with no fuel left, held does nothing.
   Run: node tools/check/run.mjs generator */
const { fail, noErrors, fakedPage } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const { PW } = await import("./js/l4ddpower.js"),
      LY = await import("./js/hangout/layout.js"),
      { l4Room } = await import("./tools/check/l4room.js");
    const room = await l4Room(
        "G9",
        (r) => r.state.hang && r.state.hang.l4 && r.state.hang.l4.r >= 1,
      ),
      me = room.me,
      pw = () => ({ ...room.state.hang.pw, power: room.state.hang.power }),
      E = (sw) => room.send({ t: "hang", k: "l4", do: "power", sw });
    room.state.pos[me] = {
      ...room.state.pos[me],
      x: PW.E[0] / LY.W,
      y: PW.E[1] / LY.H,
    };
    E(true);
    const out = { start: pw() };
    room.state.hang.pw = { ...room.state.hang.pw, gas: PW.FULL };
    E(false);
    out.lit = pw();
    E(true);
    out.off = pw();
    room.state.hang.pw = { ...room.state.hang.pw, gas: PW.FULL };
    E(false);
    out.poured = pw();
    E(true);
    out.on = pw();
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("generator: " + m + " " + JSON.stringify(got));
  const { start, lit, off, poured, on } = got;
  if (start.on || start.left) bad("no fuel: held does nothing");
  if (!lit.on || !(lit.left > 0)) bad("a can poured in turns it on");
  if (off.on || off.power || off.left !== lit.left)
    bad("held: off, its fuel kept");
  if (poured.on || !(poured.left > off.left) || poured.gas !== 0)
    bad("a tap pours a can in, and it stays off");
  if (!on.on || !on.power) bad("held again: on");
})();
