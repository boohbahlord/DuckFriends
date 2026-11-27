/* I want my own duck pinned before anyone moves how it walks, sprints, jumps and uses its hotbar (the owner's rule: pin
   before you touch). This plays tools/player-golden/scenarios.json on the real game screen: keys, the mouse, the wheel, and
   on a phone the stick, taps, swipes and the pad's buttons, on the boards (Agree or Disagree, Sandbox's board), in
   Hangout, in Dead Ducks Arcade on Downpour and on Sandbox's Duck Cabin. Once the screen is
   up and loaded, the clock, the frames, the timers and Math.random are all fake (tools/player-golden/init.js), so the same
   input gives the same game frame for frame; a hash of the whole room each frame. A digest of all the frames and one hash
   every 60 frames are kept in tools/player-golden/pinned.json; a run that gives other hashes fails, saying where it changed.
   After a change I meant to make, pin again:
     PIN=1 node tools/check/player.cjs
   ONLY=a,b plays (or pins) just those. */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const DIR = path.resolve(__dirname, "../player-golden"),
  PINNED = path.join(DIR, "pinned.json"),
  EVERY = 60;
const SCENARIOS = require(path.join(DIR, "scenarios.json"));
const ONLY = (process.env.ONLY || "").split(",").filter(Boolean);
const digest = (all) => {
  let h = 0x811c9dc5;
  for (const x of all.join(","))
    h = Math.imul(h ^ x.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(36);
};
const PHONE = {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  },
  PC = { viewport: { width: 1366, height: 768 } };
(async () => {
  const b = await chromium.launch(),
    got = {};
  const play = async (sc) => {
    const p = await b.newPage(sc.phone ? PHONE : PC),
      errs = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.addInitScript(fs.readFileSync(path.join(DIR, "init.js"), "utf8"));
    /* a phone has no mouse: Chromium sometimes sends the page a real mouse move of its own (its cursor at 0, 0 when the
       layout changes), and pointer.js then takes the phone for a computer (html.keyboard) and hides the pad. My own
       fingers are made by page.js (not trusted), so only Chromium's mouse is kept out */
    if (sc.phone)
      await p.addInitScript(() =>
        addEventListener(
          "pointermove",
          (e) => {
            if (e.isTrusted && e.pointerType === "mouse")
              e.stopImmediatePropagation();
          },
          true,
        ),
      );
    await p.goto(url, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.addScriptTag({ path: path.join(DIR, "page.js") });
    let r = await p
      .evaluate((sc) => window.__pgSetup(sc), sc)
      .catch((e) => ({ err: String(e).slice(0, 200) }));
    if (!r.err) {
      /* the screen up, its loading done, then a little more (nothing in the room moves meanwhile: the clock waits) */
      for (let i = 0; i < 100; i++) {
        const up = await p.evaluate(
          () =>
            document.body.dataset.screen === "game" &&
            !document.querySelector(".veil[data-on]"),
        );
        if (up) break;
        await p.waitForTimeout(300);
      }
      if (sc.ready)
        await p
          .waitForFunction(
            (sel) => {
              const e = document.querySelector(sel);
              return !!e && e.getBoundingClientRect().width > 0;
            },
            sc.ready,
            { timeout: 15000 },
          )
          .catch(() => {}); // (a phone's pad: its buttons up first)
      await p.waitForTimeout(2500);
      r = await p
        .evaluate((sc) => window.__pgPlay(sc), sc)
        .catch((e) => ({ err: String(e).slice(0, 200) }));
    }
    await p.close();
    noErrors(errs, sc.name + " page errors");
    return r;
  };
  for (const sc of SCENARIOS) {
    if (ONLY.length && !ONLY.includes(sc.name)) continue;
    const r = await play(sc);
    if (r.err) {
      fail(sc.name + " did not run: " + r.err);
      continue;
    }
    got[sc.name] = {
      frames: r.all.length,
      digest: digest(r.all),
      every: r.all.filter((_, i) => i % EVERY === 0),
      seen: r.seen,
      all: r.all,
      parts: r.parts,
    };
  }
  const keep = (g) => ({
    frames: g.frames,
    digest: g.digest,
    every: g.every,
    seen: g.seen,
  });
  if (process.env.PIN) {
    await b.close();
    const was = ONLY.length ? JSON.parse(fs.readFileSync(PINNED, "utf8")) : {}; // (ONLY: the others stay pinned as they were)
    fs.writeFileSync(
      PINNED,
      JSON.stringify(
        {
          ...was,
          ...Object.fromEntries(
            Object.entries(got).map(([k, g]) => [k, keep(g)]),
          ),
        },
        null,
        1,
      ) + "\n",
    );
    console.log("pinned", Object.keys(got).join(", "));
    return;
  }
  const pin = JSON.parse(fs.readFileSync(PINNED, "utf8"));
  for (const [name, g] of Object.entries(got)) {
    const o = pin[name];
    if (!o) fail(name + " is not pinned (PIN=1 node tools/check/player.cjs)");
    else if (o.frames !== g.frames || o.digest !== g.digest) {
      const at = g.every.findIndex((h, i) => h !== o.every[i]);
      fail(
        `${name}: my duck changed` +
          (at < 0
            ? " (after the last pinned frame)"
            : ` between frames ${Math.max(0, at - 1) * EVERY} and ${at * EVERY}`),
      );
      /* once more: if the second run gives the pinned game, the first one parted from it by itself (a flaky run, still a
         failure), and here is where and in which parts of the room */
      const again = await play(SCENARIOS.find((x) => x.name === name));
      if (!again.err && digest(again.all) === o.digest) {
        const i = g.all.findIndex((h, j) => h !== again.all[j]),
          parts = Object.keys(g.parts[i] || {}).filter(
            (k) => g.parts[i][k] !== again.parts[i][k],
          );
        fail(
          `${name}: a second run gave the pinned game, so this one was flaky: it parted at frame ${i}, in ${parts.join(", ")}`,
        );
      }
    }
  }
  for (const name of Object.keys(pin))
    if (!got[name] && !ONLY.length)
      fail(name + " is pinned but no longer a scenario");
  await b.close();
})();
