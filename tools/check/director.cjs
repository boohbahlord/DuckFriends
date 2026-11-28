/* I want the director's measuring checked (js/director.js; the owner approved it, Nov 28): in Dead Ducks Arcade, a duck
   at full health with full guns reads 1, 1 and rich; a duck down to a quarter of its rounds is doing badly; a duck
   under 40% health is low; no points make it not rich (the cheapest gun the merchants sell).
   Run: node tools/check/run.mjs director */
const { fail, noErrors, fakedPage } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const D = await import("./js/director.js"),
      R = await import("./js/l4ddrules.js");
    const { l4Room } = await import("./tools/check/l4room.js"),
      room = await l4Room("D", (r) => R.kitOf(r.state, r.me));
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
