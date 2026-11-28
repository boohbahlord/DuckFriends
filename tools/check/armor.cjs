/* I want armor checked (the owner's, Nov 28; wounds.js armorHit, gamedefaults.js ARMOR): a helmet turns a crit into
   "Deflected" but not a .50's or a heavy melee's; SWAT gear takes half of a hit and half of a blast, and turns every
   crit away; a zombie's armor reads from its look (an army or a motorcycle helmet, SWAT), and Brah's motorcycle helmet
   counts. Run: node tools/check/run.mjs armor */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage(),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(url, { waitUntil: "networkidle" });
  const got = await p.evaluate(async () => {
    const W = await import("./js/wounds.js"),
      R = await import("./js/l4ddrules.js"),
      M = await import("./js/merchants.js"),
      Z = await import("./js/zombies.js"),
      z = (h, o, arm) => Z.zArmor([1, 0, 0, 0, 0, h, o, 0, arm]);
    return {
      helmet: W.armorHit("helmet", "ak", 2, true),
      fifty: W.armorHit("helmet", "sniper", 2, true),
      hammer: W.armorHit("helmet", "hammer", 4, true),
      swat: W.armorHit("swat", "ak", 2, false),
      swatFifty: W.armorHit("swat", "sniper", 4, false),
      boom: W.armorHit("swat", "", 4, true, true),
      none: W.armorHit("", "ak", 2, true),
      plain: z(-1, -1, 0),
      army: z(R.ZHATS.indexOf("helmet"), -1, R.Z_BREED.helmet),
      moto: z(-1, -1, R.Z_BREED.moto),
      fire: z(R.ZHATS.indexOf("fire"), -1, 0),
      swatZ: z(R.ZHATS.indexOf("helmet"), 9, R.Z_BREED.swat),
      brah: W.helmeted(M.merchantLook(M.merchantById("brah"))),
    };
  });
  const is = (k, want) =>
    JSON.stringify(got[k]) === JSON.stringify(want) ||
    fail(
      `armor: ${k} is ${JSON.stringify(got[k])}, not ${JSON.stringify(want)}`,
    );
  is("helmet", { dmg: 2, crit: false, defl: true });
  is("fifty", { dmg: 2, crit: true, defl: false });
  is("hammer", { dmg: 4, crit: true, defl: false });
  is("swat", { dmg: 1, crit: false, defl: false });
  is("swatFifty", { dmg: 4, crit: false, defl: false });
  is("boom", { dmg: 2, crit: false, defl: true });
  is("none", { dmg: 2, crit: true, defl: false });
  is("plain", "");
  is("army", "helmet");
  is("moto", "helmet");
  is("fire", "helmet");
  is("swatZ", "swat");
  is("brah", true);
  noErrors(errs, "armor");
  await b.close();
})();
