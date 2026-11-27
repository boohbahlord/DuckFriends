/* I want the one ammo rule checked in every mode with guns (js/ammo.js; the owner's, Nov 22 19:29Z: "WHEN THE GUNS ARE
   SELECTED, THEY HAVE AMMO OF DEAD DUCKS ARCADE UNLESS UNLIMITED AMMO IS SELECTED"). In Agree or Disagree's board, Mad
   God Justin's fight and Dead Ducks Arcade, with my pistol's last round in its magazine and nothing left besides:
   1. a game starts my pistol full, Dead Ducks Arcade's 7 and 133 more;
   2. a click fires the last round; another click fires nothing and R reloads nothing (out of ammo);
   3. with G's Unlimited ammo on, R reloads it full and the rest stays as it was.
   And Mad God Justin's gun picked up comes with Dead Ducks Arcade's whole amount, and goes once it's all fired; a
   room's ammo kept the old way ({ n, r }) reads as full.
   Run: node tools/check/run.mjs ammo */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
async function start(p, mode, map, keys) {
  await p.goto(url);
  await p.waitForTimeout(1500);
  await p.evaluate(
    async ([mode, map, keys]) => {
      const st = await import("./js/store.js");
      if (keys) st.profile.duck.keys = keys;
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 0 });
      window._r = r;
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode,
          map,
          botWait: 1,
          wildJustin: 0,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.send({ t: "start" });
      for (
        let i = 0;
        i < 300 && r.state.phase !== "submit" && mode === "aod";
        i++
      )
        await new Promise((ok) => setTimeout(ok, 100));
      if (mode === "aod") r.send({ t: "submit", text: "Ducks can fly" });
    },
    [mode, map, keys],
  );
  for (let i = 0; i < 200; i++) {
    const up = await p.evaluate(
      async () =>
        document.body.dataset.screen === "game" &&
        (await import("./js/game.js")).onBoardPhase(),
    );
    if (up) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1500);
}
/* my pistol's pair [in the magazine, the rest] as the mode keeps it */
const pistol = (p) =>
  p.evaluate(async () => {
    const s = window._r.state,
      me = window._r.me,
      { clockNow } = { clockNow: (await import("./js/clock.js")).now },
      kit = s.hang && s.hang.l4a && s.hang.l4a[me];
    if (kit) return kit.am.handgun;
    const m = (await import("./js/ammo.js")).magOf(s, me, clockNow());
    return m && m.c;
  });
/* my pistol left with its last round and nothing besides */
const lastRound = (p) =>
  p.evaluate(() => {
    const s = window._r.state,
      me = window._r.me,
      kit = s.hang && s.hang.l4a && s.hang.l4a[me];
    if (kit)
      s.hang.l4a = {
        ...s.hang.l4a,
        [me]: { ...kit, am: { ...kit.am, handgun: [1, 0] }, rl: 0, rw: "" },
      };
    else s.mag = { ...(s.mag || {}), [me]: { c: [1, 0], r: 0, d: 0 } };
  });
async function click(p) {
  const box = await p.evaluate(() => {
    const r = document.querySelector(".gmain").getBoundingClientRect();
    return [r.x + r.width * 0.75, r.y + r.height * 0.4];
  });
  await p.mouse.click(box[0], box[1]);
  await p.waitForTimeout(700);
}
const reload = async (p) => {
  await p.keyboard.press("KeyR");
  await p.waitForTimeout(3000); // (the pistol's reload is 1.2 s)
};
(async () => {
  const b = await chromium.launch(),
    errs = [],
    out = [];
  for (const [name, mode, map, keys, key] of [
    [
      "Agree or Disagree",
      "aod",
      "night",
      ["handgun", ...Array(9).fill(null)],
      "Digit1",
    ],
    ["Mad God Justin", "mgj", "board", null, "Digit2"],
    ["Dead Ducks Arcade", "l4dd", "cabin", null, "Digit2"],
  ]) {
    const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
    p.on("pageerror", (e) => errs.push(name + ": " + String(e).slice(0, 200)));
    await start(p, mode, map, keys);
    const r = { name };
    await p.keyboard.press(key);
    await p.waitForTimeout(300);
    r.full = await pistol(p);
    await lastRound(p);
    await click(p);
    r.last = await pistol(p);
    await click(p);
    r.after = await pistol(p);
    await reload(p);
    r.dry = await pistol(p);
    await p.evaluate(() => {
      const s = window._r.state;
      s.options = { ...s.options, infAmmo: 1 }; // (as G sets it)
    });
    await p.waitForTimeout(300);
    await reload(p);
    r.inf = await pistol(p);
    if (mode === "mgj")
      r.pick = await p.evaluate(async () => {
        const s = window._r.state,
          me = window._r.me,
          A = await import("./js/ammo.js"),
          M = await import("./js/mgjrules.js"),
          now = (await import("./js/clock.js")).now();
        s.options.infAmmo = 0;
        s.mgj.held = { ...s.mgj.held, [me]: "smg" };
        const full = A.magOf(s, me, now, "smg").c;
        s.mag = { ...s.mag, [`${me} smg`]: { c: [1, 0], r: 0, d: 0 } };
        A.shootMag(s, me, now, "smg", 1, false);
        M.mgjSpent(s, me, now);
        return { full, gone: !M.heldGun(s, me) };
      });
    out.push(r);
    await p.close();
  }
  /* a room from before this rule kept { n: shots fired, r }: read as full, never a crash */
  const p0 = await b.newPage();
  await p0.goto(url);
  out.old = await p0.evaluate(
    async () =>
      (await import("./js/ammo.js")).magOf(
        { mag: { a: { n: 3, r: 0 } } },
        "a",
        0,
      ).c,
  );
  await p0.close();
  noErrors(errs);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(out.old, [7, 133]))
    fail(`a room's ammo kept the old way isn't read as full (${out.old})`);
  for (const r of out) {
    if (!same(r.full, [7, 133]))
      fail(`${r.name}: the pistol didn't start full (${r.full})`);
    if (!same(r.last, [0, 0]))
      fail(`${r.name}: a click didn't fire the last round (${r.last})`);
    if (!same(r.after, [0, 0]) || !same(r.dry, [0, 0]))
      fail(
        `${r.name}: out of ammo, it still fired or reloaded (${r.after} then ${r.dry})`,
      );
    if (!same(r.inf, [7, 0]))
      fail(`${r.name}: Unlimited ammo didn't reload it (${r.inf})`);
    if (r.pick && (!same(r.pick.full, [25, 315]) || !r.pick.gone))
      fail(`${r.name}: the gun picked up: ${JSON.stringify(r.pick)}`);
  }
  console.log(
    "ammo: " + out.map((r) => `${r.name} ${r.full}->${r.inf}`).join(", "),
  );
  await b.close();
})();
