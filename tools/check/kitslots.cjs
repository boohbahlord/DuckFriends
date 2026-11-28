/* I want the walk-around hotbar checked (K2c, js/kitslots.js; the owner's, Nov 21 17:48Z: "the pistol has its own
   dedicated slot after the knife or melee. And its slot is your secondary ... the pistols, the bow ... The secondary
   could be daggers, though ... And then you get two primary slots, which is where all the other ranged weapons go"):
   1. Dead Ducks Arcade starts me with the knife on 1 and the pistol on 2, the primaries (3, 4) and items (5, 6) empty;
      the bar's keys read 1 to 7 (the grenades on 7) and 0 (the flashlight); Sandbox's kit has one item slot;
   2. a gun taken: a secondary (the revolver, the bow, a dagger) takes the secondary's place; a primary an empty
      primary slot, then the primary in hand, then the first; an item the first empty item slot;
   3. key 7 puts the grenades in hand, key 5 an item, key 3 a primary.
   Run: node tools/check/run.mjs kitslots */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
  await p.goto(url);
  await p.waitForTimeout(2500);
  const rules = await p.evaluate(async () => {
    const K = await import("./js/kitslots.js");
    return {
      start: K.kitSlots(["knife", "handgun"]),
      sb: K.kitSlots(["knife", "handgun"], 1),
      sec: ["revolver", "bow", "dagger", "handgun"].map((w) =>
        K.gunSlotFor(["knife", "handgun", "", "", "", ""], w, "handgun"),
      ),
      empty: K.gunSlotFor(["knife", "handgun", "ak", "", "", ""], "smg", "ak"),
      hand: K.gunSlotFor(
        ["knife", "handgun", "ak", "smg", "", ""],
        "lmg",
        "smg",
      ),
      first: K.gunSlotFor(
        ["knife", "handgun", "ak", "smg", "", ""],
        "lmg",
        "knife",
      ),
      grenade: K.GRENADE,
    };
  });
  const same = (a, c) => JSON.stringify(a) === JSON.stringify(c);
  if (!same(rules.start, ["knife", "handgun", "", "", "", ""]))
    fail("the kit's start: " + JSON.stringify(rules.start));
  if (rules.sb.length !== 5) fail("Sandbox's kit: " + JSON.stringify(rules.sb));
  if (!same(rules.sec, [1, 1, 1, 1])) fail("a secondary's slot: " + rules.sec);
  if (rules.empty !== 3 || rules.hand !== 3 || rules.first !== 2)
    fail("a primary's slot: " + JSON.stringify(rules));
  if (rules.grenade !== 6) fail("the grenades' pick: " + rules.grenade);
  /* Dead Ducks Arcade */
  await p.evaluate(async () => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 1 });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "l4dd",
        map: "cabin",
        botWait: 1,
        wildJustin: 0,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.send({ t: "start" });
  });
  for (let i = 0; i < 300; i++) {
    const s = await p.evaluate(() => ({
      scr: document.body.dataset.screen,
      veil: !!document.querySelector(".veil[data-on]"),
    }));
    if (s.scr === "game" && !s.veil) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1500);
  const kit = await p.evaluate(async () => {
    const r = window._r,
      R = await import("./js/l4ddrules.js"),
      sl = [...R.slotsOf(r.state, r.me)];
    R.give(r.state, r.me, "ak", "knife");
    R.give(r.state, r.me, "revolver", "knife");
    R.give(r.state, r.me, "medkit", "knife");
    return { sl, now: [...R.slotsOf(r.state, r.me)] };
  });
  if (!same(kit.sl, ["knife", "handgun", "", "", "", ""]))
    fail("my kit at the start: " + JSON.stringify(kit.sl));
  if (!same(kit.now, ["knife", "revolver", "ak", "", "medkit", ""]))
    fail(
      "my kit after the AK, the revolver and a medkit: " +
        JSON.stringify(kit.now),
    );
  await p.waitForTimeout(600);
  const keysOnBar = await p.evaluate(() =>
    [...document.querySelectorAll(".l4bar .l4s kbd")].map((e) => e.textContent),
  );
  if (!same(keysOnBar.slice(0, 7), ["1", "2", "3", "4", "5", "6", "7"]))
    fail("the bar's keys: " + keysOnBar);
  const held = async (key) => {
    await p.keyboard.press(key);
    await p.waitForTimeout(250);
    return p.evaluate(async () => (await import("./js/hotpick.js")).heldNow());
  };
  const picks = [
    await held("Digit3"),
    await held("Digit7"),
    await held("Digit2"),
    await held("Digit5"),
  ];
  if (!same(picks, ["ak", "grenade", "revolver", "medkit"]))
    fail("keys 3, 7, 2, 5 put in hand: " + picks);
  await b.close();
  noErrors(errs);
})();
