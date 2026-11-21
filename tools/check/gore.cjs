/* I want hits and gore pinned before they become one module (the owner's rule: pin before you touch). The modes' games
   are pinned by the NPC golden (tools/check/npcgolden.cjs: Dead Ducks Arcade, Survival, Sandbox, Mad God Justin, with
   their zombies', gunmen's, merchant's, Justin's and ducks' wounds in the room every beat). This pins the rest, from a
   fixed seed and clock:
   - codes: the wound every weapon leaves, with and without a headshot, on what can and can't lose a hat, a face item or
     its beak (every mode's hit: a zombie, a duck, Justin, the merchant, a made NPC);
   - ducks: a duck's wounds over time (s.pw: added, ticked while down and up, in the normal games and the others);
   - the rest of the codes: exploded looks, Gore off, the newest wound, what each look can lose;
   - marks: every wound's drawing (hitsOf), alone and together;
   - pictures: zombies, ducks and a made NPC with their wounds, as drawings, and as pixels (duckparts.js).
   Each part has its own hash in tools/check/gore.json, so a failure says which part changed. After a change I meant:
     PIN=1 node tools/check/run.mjs gore */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const PINNED = path.join(__dirname, "gore.json");
const INIT = fs.readFileSync(
  path.join(__dirname, "../npc-golden/init.js"),
  "utf8",
);
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 800, height: 450 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(INIT);
  await p.goto(url);
  await p.waitForTimeout(1500);
  const got = await p
    .evaluate(async () => {
      const WD = await import("./js/wounds.js"),
        A = await import("./js/l4ddart.js"),
        { duckSVG } = await import("./js/duck.js"),
        { duckFromParts } = await import("./js/duckparts.js"),
        { JUSTIN } = await import("./js/hangout/npcart.js"),
        { npcURL } = await import("./js/sbnpcart.js"),
        { steadyText } = await import("./js/pxdom.js");
      const hitsOf = WD.hitsOf || A.hitsOf;
      /* what a look can lose (wounds.js knockable, a breed's can since the breeds) */
      const knock = WD.knockable || WD.WOUND_BREEDS.duck.can;
      /* hitCode and woundCode as they were, through the breeds since (wounds.js hitWounds) */
      const hitCode =
          WD.hitCode ||
          ((had, w, head, can) =>
            WD.hitWounds(
              had,
              w,
              { head: "hit", can: () => can },
              { head },
            ).slice(had.length)),
        woundCode =
          WD.woundCode ||
          ((had, w, can) =>
            WD.hitWounds(had, w, { can: () => can }).slice(had.length)); // (wounds.js since hits and gore became one module)
      const hash = (str) => {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(36) + "." + str.length.toString(36);
      };
      const J = (v) => hash(JSON.stringify(v));
      window.__fake = true;
      window.__now = 1.8e12;
      window.__seed(4242);
      document.body.dataset.screen = "game";
      const out = {};
      /* codes: every weapon (wounds.js WOUND_OF, and one it doesn't know), on five kinds of things, 30 hits each, a
         headshot every 7th */
      const WEAPONS = [
        ..."handgun smg tommy ump lmg sniper ak burst revolver dbarrel dbuck slug chaingun chain shotgun pellet".split(
          " ",
        ),
        ..."knife dagger hammer pan axe sword chair bow arrow claw laser flamer".split(
          " ",
        ),
      ];
      const DUCKS = [
        {},
        { hat: "cowboy", face: "shades" },
        { hat: "crown", face: "mustache", beak: "orange" },
        { style: "jack" },
        { hat: "afro" },
      ];
      const cans = [
        {},
        { hat: true, face: true, beak: true },
        { beak: false },
        knock(JUSTIN),
        ...DUCKS.map((d) => knock(d)),
      ];
      const built = [];
      for (const w of WEAPONS)
        for (const can of cans) {
          let had = "";
          for (let i = 1; i <= 30; i++)
            had += hitCode(had, w, i % 7 === 0, can);
          built.push(had);
          let wc = "";
          for (let i = 0; i < 12; i++) wc += woundCode(wc, w, can);
          built.push(wc);
        }
      out.codes = J(built);
      /* ducks: wounds on two ducks over 80 beats of 500 ms, in a normal game (kept) and in Dead Ducks Arcade */
      const pwRun = (mode) => {
        const s = {
            options: { mode },
            players: { a: { duck: DUCKS[1] }, b: { duck: DUCKS[2] }, c: {} },
          },
          log = [];
        let now = window.__now;
        for (let i = 0; i < 80; i++) {
          now += 500;
          const id = "abc"[i % 3],
            P = s.players[id];
          if (i % 11 === 5) P.dead = !P.dead;
          if (i % 13 === 0) WD.pwAdd(s, id, WD.DEATH, now, true);
          else if (i % 17 === 0) WD.pwAdd(s, id, ["f0"], now, !!P.dead);
          else WD.pwHit(s, id, WEAPONS[i % WEAPONS.length], now, !!P.dead);
          log.push(WD.pwTick(s, now, mode === "aod"));
          log.push(["a", "b", "c"].map((k) => WD.pwCodes(s, k, now)).join("|"));
        }
        log.push(s.pw);
        return log;
      };
      out.ducks = J([pwRun("aod"), pwRun("l4dd"), pwRun("hang")]);
      /* the rest of the codes */
      out.rest = J([
        [...Array(12)].map((_, i) => WD.explodedLook(i - 3)),
        built.map((c) => WD.goreFree(c)),
        built.map((c) => WD.newWound(c.slice(0, 4), c.slice(0, 6))),
        WD.BY_WOUND,
        WD.PCRIT,
        WD.CRIT_DOWN,
        WD.DEATH,
        cans,
      ]);
      /* marks: every wound alone (each kind at each spot), and every code built above */
      const single = [];
      for (const k of "bBscrakpxgfehm")
        for (let i = 0; i < 9; i++) single.push(k + i);
      out.marks = J([...single, ...built].map((c) => hitsOf(c)));
      /* pictures: zombies of six looks, ducks of five, a made NPC, with 10 of the codes each (and none) */
      const some = [
        "",
        ...single.filter((_, i) => i % 9 < 2),
        ...built.filter((_, i) => i % 37 === 0),
      ];
      const LOOKS = [
        [0, 0, "", 0, 0, -1, -1, 0, 0],
        [0, 0, "", 1, 0, 2, -1, 0, 0],
        [0, 0, "", -1, 0, -1, 3, 0, 0],
        [0, 0, "", 0, 1, 4, 1, 0, 0],
        [0, 0, "", 0, 0, 0, 0, 0, 0],
        [0, 0, "", 1, 0, 5, 2, 0, 0],
      ];
      const zs = [],
        ds = [],
        ns = [];
      LOOKS.forEach((l, n) =>
        some.forEach((c) => zs.push(A.zombieURL(l, n * 5, c))),
      );
      for (const d of DUCKS)
        for (const c of some) {
          const h = hitsOf(c);
          ds.push(
            duckSVG(d, {
              size: 64,
              shadow: false,
              dead: c.length > 10,
              ...(c
                ? { skin: { head: h.inner, out: h.out }, gone: h.gone }
                : {}),
              grow: true,
            }),
          );
        }
      const made = { k: "npc", dk: DUCKS[1] };
      for (const c of some) ns.push(npcURL(made, c, true));
      /* the drawings' ids are counted up by every drawing made since the page loaded (the idle warm-up's too), so they're
         renamed in order first (pxdom.js steadyText, as the part sheets' names are) */
      const steady = (t) =>
        steadyText(
          t.startsWith("data:")
            ? decodeURIComponent(t.slice(t.indexOf(",") + 1))
            : t,
        );
      out.zombies = J(zs.map(steady));
      out.duckPics = J(ds.map(steady));
      out.npcPics = J(ns.map(steady));
      /* … and as pixels: every 4th of them made from the part sheets at a game's size */
      const dkOf = (t) => {
        if (t.startsWith("data:"))
          t = decodeURIComponent(t.slice(t.indexOf(",") + 1));
        const m = /\sdata-dk="([^"]*)"/.exec(t.slice(0, t.indexOf(">") + 1));
        return m
          ? JSON.parse(
              m[1]
                .replace(/&quot;/g, '"')
                .replace(/&#39;|&apos;/g, "'")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&"),
            )
          : null;
      };
      /* the gore layer's parts (l4ddart.js zombieDK, made without the drawing) are the drawing's, for every zombie above */
      let dkDiff = 0;
      if (A.zombieDK)
        LOOKS.forEach((l, n) =>
          some.forEach((c) => {
            if (
              JSON.stringify(A.zombieDK(l, n * 5, c)) !==
              JSON.stringify(dkOf(A.zombieURL(l, n * 5, c)))
            )
              dkDiff++;
          }),
        );
      const px = [];
      let none = 0;
      for (const t of [...zs, ...ds, ...ns].filter((_, i) => i % 4 === 0)) {
        const d = dkOf(t);
        if (!d) {
          none++;
          continue;
        }
        const c = await duckFromParts(d, 26, 34);
        if (!c) {
          px.push("whole");
          continue;
        }
        const g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let h = 0x811c9dc5;
        for (let i = 0; i < g.length; i++) h = Math.imul(h ^ g[i], 0x01000193);
        px.push(c.width + "x" + c.height + ":" + (h >>> 0).toString(36));
      }
      out.pixels = J(px);
      out.pixelsMade =
        px.filter((v) => v !== "whole").length + " of " + (px.length + none);
      window.__fake = false;
      return { out, dkDiff };
    })
    .catch((e) => ({ err: String(e).slice(0, 300) }));
  await b.close();
  noErrors(errs);
  if (got.err) return fail("gore pin did not run: " + got.err);
  if (got.dkDiff)
    fail(
      `gore: ${got.dkDiff} zombies' parts (zombieDK) differ from their drawing's`,
    );
  if (process.env.PIN) {
    fs.writeFileSync(PINNED, JSON.stringify(got.out, null, 1) + "\n");
    console.log("pinned", JSON.stringify(got.out));
    return;
  }
  const pin = JSON.parse(fs.readFileSync(PINNED, "utf8"));
  for (const k of new Set([...Object.keys(pin), ...Object.keys(got.out)]))
    if (pin[k] !== got.out[k])
      fail(`gore: ${k} changed (${pin[k]} -> ${got.out[k]})`);
})();
