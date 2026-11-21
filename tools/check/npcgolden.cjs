/* I want the zombies pinned before anyone changes how they are made (the owner's rule: pin before you touch). This plays the
   zombie games from tools/npc-golden/scenarios.json (Dead Ducks Arcade on Downpour and on Cabin, Survival's three squads,
   Mad God Justin's fight and his zombie waves), each from a fixed seed and a fixed clock for a fixed number of beats (no
   Math.random and no clock but the fake ones), and hashes the whole room every beat. A digest of all the beats and one hash
   every 50 beats are kept in tools/npc-golden/pinned.json; a run that gives other hashes fails, saying the first 50 beats
   it changed in. (The computers keep away from the zombies, so each -bait scenario parks my duck on the nearest zombie each beat, keeping its health, to pin at least 50 swipes with their times and damage.) Sandbox's NPCs are in too (the sb-* scenarios: on Duck Cabin, on Downpour and on the board; sb-cabin-bait parks my duck on them as well). The computer players are pinned too: they play in every run above, and the bots-* scenarios play each board mode and Hangout (in the board modes my duck plays as a computer as well, "mirror", since they wait for a person). The NPCs found missing when I changed one number of each brain have their own runs: sb-avoid (Sandbox's Avoid list), bots-justin (Justin walking the board) and hang-shadow (Hangout long enough for the shadow duck to show). After a change I meant to make, pin again:
     PIN=1 node tools/check/npcgolden.cjs
   Beat by beat, with the part of the room that changed: node tools/npc-golden/run.cjs (save before, check after). */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const DIR = path.resolve(__dirname, "../npc-golden"),
  PINNED = path.join(DIR, "pinned.json"),
  EVERY = 50;
const SCENARIOS = require(path.join(DIR, "scenarios.json"));
/* ONLY=a,b plays just those scenarios (a quick look while changing one part; the full check plays them all) */
const ONLY = (process.env.ONLY || "").split(",").filter(Boolean);
const digest = (all) => {
  let h = 0x811c9dc5;
  for (const x of all.join(","))
    h = Math.imul(h ^ x.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(36);
};
(async () => {
  const b = await chromium.launch(),
    got = {};
  const play = async (sc) => {
    const p = await b.newPage({ viewport: { width: 800, height: 450 } }),
      errs = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.addInitScript(fs.readFileSync(path.join(DIR, "init.js"), "utf8"));
    await p.goto(url, { waitUntil: "networkidle" }); // (the page's own loading done first)
    await p.waitForTimeout(1500);
    await p.addScriptTag({ path: path.join(DIR, "page.js") });
    const r = await p
      .evaluate((sc) => window.__golden(sc), sc)
      .catch((e) => ({ err: String(e).slice(0, 200) }));
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
    if (sc.bait !== undefined && r.seen.swipes < 50)
      fail(`${sc.name}: only ${r.seen.swipes} swipes, so too little is pinned`);
    got[sc.name] = {
      beats: r.all.length,
      digest: digest(r.all),
      every: r.all.filter((_, i) => i % EVERY === 0),
      seen: r.seen,
      all: r.all,
      parts: r.parts,
    };
  }
  const keep = (g) => ({
    beats: g.beats,
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
    if (!o)
      fail(name + " is not pinned (PIN=1 node tools/check/npcgolden.cjs)");
    else if (o.beats !== g.beats || o.digest !== g.digest) {
      const at = g.every.findIndex((h, i) => h !== o.every[i]);
      fail(
        `${name}: the game changed` +
          (at < 0
            ? " (after the last pinned beat)"
            : ` between beats ${Math.max(0, at - 1) * EVERY} and ${at * EVERY}`),
      );
      /* once more: if the second run gives the pinned game, the first one parted from it by itself (a flaky run, still a
         failure), and here is where and in which parts of the room, to find why */
      const again = await play(SCENARIOS.find((x) => x.name === name));
      if (!again.err && digest(again.all) === o.digest) {
        const i = g.all.findIndex((h, j) => h !== again.all[j]),
          parts = Object.keys(g.parts[i] || {}).filter(
            (k) => g.parts[i][k] !== again.parts[i][k],
          );
        fail(
          `${name}: a second run gave the pinned game, so this one was flaky: it parted at beat ${i}, in ${parts.join(", ")}`,
        );
      }
    }
  }
  for (const name of Object.keys(pin))
    if (!got[name] && !ONLY.length)
      fail(name + " is pinned but no longer a scenario");
  await b.close();
})();
