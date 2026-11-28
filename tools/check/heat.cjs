/* I want a gun's heat checked (K2, heat.js; the owner's, Nov 21 17:25Z and 17:48Z, the plan in plain English in
   /mnt/project-files/adam/calibers.md, Spread):
   1. the pistol's first shot goes exactly where it's aimed; five at its top rate (a second's worth) bring it to full
      heat, each adding 1 over its fire rate;
   2. a shot flies off its aim by up to its widest cone times the heat it found (15 degrees a point of its recoil score,
      the owner's pick Nov 22 13:02Z: the M1911's 0.49 is 7.35 degrees at full);
   3. half a second after it stops (past its wait between shots) it is cool again: that shot goes where it's aimed;
   4. the dagger and the grenade never spread and keep no heat; the bow spreads but doesn't shake;
   5. a hot gun kicks and shakes up to 30% more;
   6. the crosshair has its ticks at 5 heat levels, each its own picture;
   7. every gun's recoil score and word as in the table (K14 + K18, /mnt/project-files/solomon/k14-recoil-scores.md),
      "none" for what has no recoil; the grenade launcher has its score but never spreads.
   Run: node tools/check/run.mjs heat */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async () => {
    const H = await import("./js/heat.js"),
      deg = (v) => +((Math.atan2(v[1], v[0]) * 180) / Math.PI).toFixed(2),
      s = {},
      out = { shots: [] };
    Math.random = () => 1; // (every roll at the cone's edge)
    for (let k = 0; k < 6; k++) {
      out.shots.push(deg(H.spreadAim(s, "a", "handgun", [1, 0], k * 200)));
      out.shots.push(s.heat["a handgun"][0]);
    }
    out.shake = [
      H.heatShake(s, "a", "handgun", 1000),
      H.heatShake({}, "a", "handgun", 1000),
    ];
    out.cool = deg(H.spreadAim(s, "a", "handgun", [1, 0], 1000 + 200 + 500));
    out.coolHeat = s.heat["a handgun"][0];
    const t = {};
    out.dagger = H.spreadAim(t, "a", "dagger", [1, 0], 0);
    H.spreadAim(t, "a", "grenade", [1, 0], 0);
    out.kept = Object.keys(t.heat || {});
    for (const ms of [0, 400])
      out.bow = deg(H.spreadAim(t, "a", "bow", [1, 0], ms));
    out.bowShake = H.heatShake(t, "a", "bow", 400);
    const G = await import("./js/guns.js");
    out.scores = Object.fromEntries(
      Object.keys(G.ARMS)
        .filter((w) => ["ranged", "grenade"].includes(G.ARMS[w].kind))
        .map((w) => [w, [G.recoilOf(w), G.recoilWord(G.recoilOf(w))]]),
    );
    out.gl = H.spreadAim(t, "a", "glauncher", [1, 0], 0);
    out.gl2 = H.spreadAim(t, "a", "glauncher", [1, 0], 100);
    const css = getComputedStyle(document.documentElement);
    out.ticks = [0, 1, 2, 3, 4].map((n) =>
      css.getPropertyValue("--cur-tick" + n),
    );
    return out;
  });
  const want = [0, 0.3, 3.31, 0.6, 6.61, 0.9, 9.92, 1, 11.03, 1, 11.03, 1]; // (each shot: its angle off, then the heat after it)
  if (JSON.stringify(got.shots) !== JSON.stringify(want))
    C.fail("the pistol's heat and spread: " + JSON.stringify(got.shots));
  if (got.shake[0] !== 1.3 || got.shake[1] !== 1)
    C.fail("a hot gun's shake: " + got.shake);
  if (got.cool !== 0 || got.coolHeat !== 0.3)
    C.fail("not cool half a second after: " + got.cool + ", " + got.coolHeat);
  if (JSON.stringify(got.dagger) !== "[1,0]" || got.kept.length)
    C.fail("the dagger or grenade spread: " + JSON.stringify(got));
  if (!(got.bow > 0) || got.bowShake !== 1)
    C.fail("the bow: spread " + got.bow + ", shake " + got.bowShake);
  const table = {
    handgun: [0.49, "heavy"],
    bow: [0, "none"],
    dagger: [0, "none"],
    shotgun: [0.47, "heavy"],
    grenade: [0, "none"],
    sniper: [0.71, "a lot"],
    smg: [0.32, "medium"],
    tommy: [0.35, "medium"],
    ump: [0.34, "medium"],
    ak: [0.32, "medium"],
    revolver: [0.5, "heavy"],
    glauncher: [0.45, "heavy"],
    lmg: [0.15, "small"],
    dbarrel: [0.5, "heavy"],
    flamer: [0, "none"],
    burst: [0.17, "small"],
    laser: [0, "none"],
  };
  for (const [w, v] of Object.entries(table))
    if (JSON.stringify(got.scores[w]) !== JSON.stringify(v))
      C.fail(w + "'s recoil: " + JSON.stringify(got.scores[w]) + ", want " + v);
  if (JSON.stringify([got.gl, got.gl2]) !== "[[1,0],[1,0]]")
    C.fail("the grenade launcher spread: " + JSON.stringify([got.gl, got.gl2]));
  if (got.ticks.some((v) => !v) || new Set(got.ticks).size !== 5)
    C.fail("the crosshair's 5 heat levels");
  C.noErrors(errs);
  await b.close();
})();
