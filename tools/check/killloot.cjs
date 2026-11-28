/* I want what lies on the ground in Dead Ducks Arcade checked (K16, js/l4ddloot.js; the owner's, Nov 21 18:27Z: "a 0.01%
   chance that a zombie drops a weapon ... a 0.01% additional chance they drop certain items ... based on the slot's
   chances"; "You only pick them up by clicking E / Same for any loot on the ground now"):
   1. killLoot gives a weapon 0.01% of the time and an item 0.01% (a million rolls), each from the merchants' bags;
   2. a special drop at my feet (Max Ammo, for everyone) is taken by standing on it, with no Take button (the owner's,
      Nov 28: no E for special drops);
   3. a weapon a zombie left goes into my slots with E;
   4. a zombie killed with the odds at 1 leaves a weapon where it fell.
   Run: node tools/check/run.mjs killloot */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e.stack || e).slice(0, 400)));
  await p.goto(url);
  await p.waitForTimeout(2500);
  const odds = await p.evaluate(async () => {
    const L = await import("./js/l4ddloot.js"),
      R = await import("./js/l4ddrules.js"),
      bags = { odds: R.SLOT_ODDS, slot: R.SLOT_BAGS, weapon: R.WEAPON_BAGS },
      items = new Set(R.SLOT_BAGS.item),
      arms = new Set([
        ...R.SLOT_BAGS.special,
        ...Object.values(R.WEAPON_BAGS).flat(),
      ]);
    let arm = 0,
      item = 0,
      odd = [];
    for (let i = 0; i < 1e6; i++) {
      const w = L.killLoot(bags);
      if (!w) continue;
      if (items.has(w)) item++;
      else if (arms.has(w)) arm++;
      else odd.push(w);
    }
    return { arm, item, odd };
  });
  if (odds.odd.length) fail("loot from no bag: " + odds.odd);
  if (
    !(odds.arm > 50 && odds.arm < 160) ||
    !(odds.item > 50 && odds.item < 160)
  )
    fail("a million kills' loot (about 100 of each): " + JSON.stringify(odds));
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
    const s = await p.evaluate(
      () =>
        document.body.dataset.screen === "game" &&
        !document.querySelector(".veil[data-on]"),
    );
    if (s) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1500);
  /* 2. a Max Ammo at my feet */
  const at = await p.evaluate(async () => {
    const r = window._r,
      L = await import("./js/l4ddloot.js"),
      { W, H } = await import("./js/hangout/layout.js"),
      bot = r.state.pos[r.state.seat.find((id) => id !== r.me)],
      now = Date.now(),
      q = (r.state.pos[r.me] = {
        ...r.state.pos[r.me],
        x: bot.x + 0.06,
        tp: now,
      }); // (away from the computer, which takes what it stands on)
    L.layDrop(r.state, "ammo", q.x * W, q.y * H, now, now + 30000);
    return now;
  });
  await p.waitForTimeout(1200);
  const stays = await p.evaluate(
    (n) => (window._r.state.hang.l4dr || []).some((d) => d.n === n),
    at,
  );
  const label = await p.evaluate(() =>
    document.body.innerText.includes("Take the Max Ammo"),
  );
  await p.keyboard.press("KeyE");
  await p.waitForTimeout(400);
  const gone = await p.evaluate(
    (n) => !(window._r.state.hang.l4dr || []).some((d) => d.n === n),
    at,
  );
  /* 3. a weapon a zombie left */
  const took = await p.evaluate(async () => {
    const r = window._r,
      L = await import("./js/l4ddloot.js"),
      { W, H } = await import("./js/hangout/layout.js"),
      q = r.state.pos[r.me],
      now = Date.now();
    L.layDrop(r.state, "arm", q.x * W, q.y * H, now + 0.5, now + 30000, "ak");
    r.send({ t: "hang", k: "l4", do: "pick" });
    return {
      sl: r.state.hang.l4a[r.me].sl,
      left: (r.state.hang.l4dr || []).filter((d) => d.k === "arm").length,
    };
  });
  /* 4. a kill with the odds at 1: the zombies come at me, and I shoot the nearest with the AK-47 */
  const kill = await p.evaluate(async () => {
    const r = window._r,
      L = await import("./js/l4ddloot.js"),
      Z = await import("./js/zombies.js"),
      { W, H } = await import("./js/hangout/layout.js");
    L.KILL.ARM = 1;
    r.send({ t: "hang", k: "l4", do: "endturn", on: true }); // (I'm ready too: the zombies come)
    for (let i = 0; i < 480; i++) {
      const d = (r.state.hang.l4dr || []).find((q) => q.k === "arm");
      if (d)
        return {
          w: d.w,
          el: !!document.querySelector(".l4-drop.k-arm .l4orb"),
        };
      const q = r.state.pos[r.me],
        z = Z.zombiesOf(r.state)
          .filter((o) => o.st === 2 || o.st === 4)
          .sort(
            (a, b) =>
              Math.hypot(a.x - q.x * W, a.y - q.y * H) -
              Math.hypot(b.x - q.x * W, b.y - q.y * H),
          )[0];
      if (z) {
        const ax = z.x - q.x * W,
          ay = z.y - q.y * H;
        r.state.pos[r.me] = { ...q, w: "ak", ax: ax / W, ay: ay / H };
        r.send({
          t: "use",
          what: "ak",
          face: ax < 0 ? -1 : 1,
          ax: ax / W,
          ay: ay / H,
        });
      }
      await new Promise((ok) => setTimeout(ok, 250));
    }
    return { kz: r.state.hang.l4kz || null };
  });
  await b.close();
  noErrors(errs);
  if (stays || !gone)
    fail("a special drop at my feet wasn't taken by walking over it");
  if (label) fail("a Take button over a special drop");
  if (!took.sl.includes("ak") || took.left)
    fail("a weapon on the ground with E: " + JSON.stringify(took));
  if (!kill || !kill.w || !kill.el)
    fail("a zombie killed with the odds at 1 left: " + JSON.stringify(kill));
})();
