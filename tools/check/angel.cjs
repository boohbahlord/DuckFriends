/* I want Angelic weapons' rules checked (K11, js/l4ddangel.js; the owner's, Nov 21 18:07Z: "angelic weapons only add
   0.5 damage per weapon now. Yeah, and they don't increase ammo ... It only increases damage in proportion to its fire
   rate per second"; 18:16Z: "we can do the roll for how much more guns perform from the angelic machine in both damage
   and crit chance"; the numbers: damage + 2.5 over its shots a second, crit + 12.5% over its shots a second):
   1. each weapon's damage and crit added, by its shots a second (the pistol's 5: +0.5 damage, +2.5% crit);
   2. no weapon holds more ammo, the dual pistols the same in one magazine twice as big;
   3. a hit with an Angelic AK-47 takes exactly that much more, and crits where the plain one doesn't.
   Run: node tools/check/run.mjs angel */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
  await p.goto(url);
  await p.waitForTimeout(2000);
  const got = await p.evaluate(async () => {
    const A = await import("./js/l4ddangel.js"),
      G = await import("./js/guns.js"),
      L = await import("./js/l4ddrules.js"),
      out = { adds: {}, ammo: [] };
    for (const w of [
      "handgun",
      "sniper",
      "chaingun",
      "dbarrel",
      "bow",
      "knife",
    ])
      out.adds[w] = [A.angelDmg(w), +(A.angelCrit(w) * 100).toFixed(3)];
    for (const w of Object.keys(G.ARMS)) {
      const f = L.fullAmmo(w),
        a = A.angelAmmo(f, w);
      if (!f) continue;
      const same = f[0] + f[1] === a[0] + a[1];
      if (!same || (w === "handgun" ? a[0] !== f[0] * 2 : a[0] !== f[0]))
        out.ammo.push([w, f, a]);
    }
    /* one hit, with every roll set: the miss roll, the crit roll, then the damage's */
    const kit = (ang) => ({
      options: { mode: "l4dd" },
      players: { a: { name: "A" } },
      pos: {},
      hang: { l4a: { a: { sl: ["knife", "ak"], ang: ang ? { ak: 1 } : {} } } },
    });
    const hit = (ang, crit) => {
      const rolls = [0.99, crit, 0.5, 0.5, 0.5, 0.5],
        was = Math.random;
      let i = 0;
      Math.random = () => rolls[Math.min(i++, rolls.length - 1)];
      try {
        return L.zombieTakes(kit(ang), "a", "ak");
      } finally {
        Math.random = was;
      }
    };
    const between = G.critOf("ak") + A.angelCrit("ak") / 2;
    out.hit = {
      plain: hit(false, 0.99),
      holy: hit(true, 0.99),
      plainCrit: hit(false, between).crit,
      holyCrit: hit(true, between).crit,
      add: A.angelDmg("ak"),
    };
    return out;
  });
  const want = {
    handgun: [0.5, 2.5],
    sniper: [1.88, 9.375],
    chaingun: [0.08, 0.413],
  };
  for (const [w, v] of Object.entries(want))
    if (JSON.stringify(got.adds[w]) !== JSON.stringify(v))
      fail(w + "'s Angelic damage and crit: " + JSON.stringify(got.adds[w]));
  if (!(got.adds.dbarrel[0] > got.adds.sniper[0]) || !(got.adds.knife[0] > 0))
    fail(
      "the double barrel (by its reload) or a melee weapon: " +
        JSON.stringify(got.adds),
    );
  if (got.ammo.length) fail("Angelic ammo: " + JSON.stringify(got.ammo));
  const h = got.hit;
  if (
    Math.round((h.holy.dmg - h.plain.dmg) * 100) !== Math.round(h.add * 100) ||
    h.plainCrit ||
    !h.holyCrit
  )
    fail("an Angelic AK-47's hit: " + JSON.stringify(h));
  await b.close();
  noErrors(errs);
})();
