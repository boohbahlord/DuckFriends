/* I want my duck's walk eased and a tired sprint try seen (the owner's, Nov 28 03:28Z): playerinput.js easeWalk
   speeds up over WALK_EASE.up and slows over WALK_EASE.down; stamina.js flashes my sprint bar white on each try while
   it can't sprint. Run: node tools/check/run.mjs walkease */
const { fakedPage, fail, noErrors } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const W = await import("./js/playerinput.js"),
      S = await import("./js/stamina.js"),
      G = await import("./js/gamedefaults.js");
    const up = G.WALK_EASE.up,
      dn = G.WALK_EASE.down,
      out = {
        first: W.easeWalk(1, 0, up / 2).x,
        full: W.easeWalk(1, 0, up).x,
        half: W.easeWalk(0, 0, dn / 2).x,
        still: W.easeWalk(0, 0, dn).x,
      };
    const bar = document.createElement("span");
    bar.className = "hpm-stam";
    document.body.append(bar);
    S.sprintReset();
    for (let k = 0; k < 400; k++) S.sprintStep(true, 0.05); // (empty: tired)
    S.sprintStep(false, 0.05);
    out.before = bar.getAnimations().length;
    S.sprintStep(true, 0.05);
    out.after = bar.getAnimations().length;
    S.sprintStep(true, 0.05);
    out.held = bar.getAnimations().length;
    S.sprintStep(false, 0.05);
    S.sprintStep(false, 0.05, 1, true); // (asked standing still: it flashes too)
    out.still2 = bar.getAnimations().length;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("walkease: " + m + " " + JSON.stringify(got));
  if (Math.abs(got.first - 0.5) > 0.01 || got.full !== 1)
    bad("it speeds up over WALK_EASE.up");
  if (Math.abs(got.half - 0.5) > 0.01 || got.still !== 0)
    bad("it slows over WALK_EASE.down");
  if (got.before !== 0 || got.after !== 1 || got.held !== 1)
    bad("one flash each tired try");
  if (got.still2 !== 2) bad("a try standing still flashes");
})();
