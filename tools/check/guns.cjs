/* I want the guns pinned before they become one module (the owner's rule: pin before you touch). Their play is pinned
   by the NPC golden (tools/check/npcgolden.cjs: the computers and NPCs fire them in Dead Ducks Arcade, Survival and
   Sandbox, and the guns-board-* runs fire every one of the board's as a special). This pins the rest, for
   every weapon any mode has:
   - numbers: Dead Ducks Arcade's (ARMS, names, kinds, lists and bags), the board's (cooldowns, full auto), every
     gun's ammo (ammo.js), the NPCs' (Sandbox's lists and reach), and
     the feel (headshot odds, the kick's vibration, the swing and fire speeds);
   - specials: each one's entry in the specials list (the picker), its icon as the hotbar and Customize show it;
   - drawings: each weapon in the hand, its icon, its bullet and trace, as drawings and as pixels;
   - the Items page (Dead Ducks Arcade's catalog).
   Each part has its own hash in tools/check/guns.json, so a failure says which part changed. After a change I meant:
     PIN=1 node tools/check/run.mjs guns */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const PINNED = path.join(__dirname, "guns.json");
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
  await p.goto(url, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const got = await p
    .evaluate(async () => {
      const L4m = await import("./js/l4ddrules.js"),
        GN = await import("./js/guns.js"),
        AM = await import("./js/ammo.js"),
        Rm = await import("./js/rules.js"),
        SA = await import("./js/sbarms.js"),
        WD = await import("./js/wounds.js"),
        FM = await import("./js/fxmotion.js"),
        AS = await import("./js/armspeed.js"),
        GD = await import("./js/gamedefaults.js"),
        SP = await import("./js/specials.js"),
        GA = await import("./js/gunart.js").catch(
          () => import("./js/l4ddguns.js"),
        ), // (l4ddguns.js before there was one drawing)
        AR = await import("./js/l4ddart.js"),
        CA = await import("./js/l4ddcatalog.js"),
        KS = await import("./js/kitslots.js").catch(() => ({})), // (the kit's slots: kitslots.js since K2c, l4ddrules.js' before)
        { steadyText } = await import("./js/pxdom.js");
      /* the numbers' sheet: guns.js since there is one (ARMS and kindOf were l4ddrules.js') */
      const L4 = {
        ...L4m,
        ARMS: GN.ARMS || L4m.ARMS,
        kindOf: GN.kindOf || L4m.kindOf,
        SLOT_KINDS: KS.SLOT_KINDS || L4m.SLOT_KINDS,
        WEAPONS: GN.WEAPONS || L4m.WEAPONS,
        POOL: GN.POOL || L4m.POOL,
      };
      L4.ITEMS = L4m.ITEMS || L4.POOL.filter((w) => !L4.WEAPONS.includes(w)); // (guns.js keeps its ITEMS to itself: POOL's)
      /* the board's lists: guns.js since part 2 (they were rules.js') */
      const R = {
        ...Rm,
        WEAPONS: GN.BOARD_WEAPONS || Rm.WEAPONS,
        GUNS_NEW: GN.BOARD_GUNS || Rm.GUNS_NEW,
        AUTO: GN.AUTO || Rm.AUTO,
        THROWS: GN.THROWS || Rm.THROWS,
      };
      /* Sandbox's made NPCs' lists: made when first asked since V209 (sbarms.js npcArms) */
      const NA = SA.npcArms
        ? SA.npcArms()
        : { guns: SA.NPC_GUNS, melee: SA.NPC_MELEE };
      const hash = (str) => {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(36);
      };
      /* functions out (a special's icon may be one: called), keys sorted, every text through steadyText (a picture may
         hold a duck, and duckSVG's ids count every duck drawn since load) */
      const plain = (v) =>
        JSON.parse(
          JSON.stringify(v, (k, x) =>
            typeof x === "function"
              ? "fn:" + steadyText(String(x()))
              : typeof x === "string"
                ? steadyText(x)
                : x && typeof x === "object" && !Array.isArray(x)
                  ? Object.fromEntries(
                      Object.keys(x)
                        .sort()
                        .map((a) => [a, x[a]]),
                    )
                  : x,
          ),
        );
      const H = (v) => hash(JSON.stringify(plain(v)));
      const ids = [
        ...new Set([
          ...L4.WEAPONS,
          ...L4.ITEMS,
          ...Object.keys(L4.ARMS),
          ...R.WEAPONS,
          ...R.GUNS_NEW,
          ...NA.guns,
          ...NA.melee,
          ...Object.keys(GA.GUNS),
          "grenade",
          "chair",
          "zebra",
          "medkit",
        ]),
      ].sort();
      const board = { options: { mode: "aod" } };
      /* the NPCs' reach: guns.js' since there is one breed row each (it was sbarms.js') */
      const sbReach = (w) =>
        GN.reachOf ? GN.reachOf(w, "sbnpc") : SA.reachOf(w);
      const per = (f) => Object.fromEntries(ids.map((w) => [w, f(w)]));
      const out = {};
      out.ids = H(ids);
      out.dda = H({
        arms: L4.ARMS,
        names: per(L4.weaponName),
        kinds: per(L4.kindOf),
        lists: [L4.WEAPONS, L4.ITEMS, L4.POOL],
        bags: [L4.SLOT_ODDS, L4.SLOT_BAGS, L4.WEAPON_BAGS],
        slots: L4.SLOT_KINDS,
      });
      out.board = H({
        cool: per((w) => R.coolFor(w, board)),
        lists: [R.WEAPONS, R.GUNS_NEW, R.THROWS],
        auto: per((w) => R.AUTO.includes(w)), // (which fire while held: a set, its order means nothing)
      });
      /* every gun's ammo in every mode: Dead Ducks Arcade's (ammo.js, the owner's, Nov 22 19:29Z) */
      out.ammo = H({
        full: per(AM.fullAmmo),
        cap: per(AM.capOf),
        reload: per((w) => (AM.capOf(w) ? AM.reloadMs(w, [0, 99]) : 0)),
      });
      out.npcs = H({
        sb: [NA.guns, NA.melee, per(sbReach)],
      });
      /* how far Sandbox's made NPCs fire each gun from, in duck lengths */
      out.reach = H({ sb: per(sbReach) });
      out.feel = H({
        crit: GN.critOf ? per(GN.critOf) : WD.PCRIT, // (one rule for every weapon since K1: guns.js critOf)
        vib: FM.VIB,
        speed: [AS.ARM_SPEED, AS.ARM_COOL, AS.ARM_SWING, AS.ARM_RELOAD],
        handgun: GD.HANDGUN,
      });
      const duck = {},
        wrench = { wrench: true };
      out.specials = H(
        SP.SPECIALS.map((sp) => [
          sp,
          SP.looksOf(sp, duck),
          SP.looksOf(sp, wrench),
        ]),
      );
      out.held = H(per((w) => [SP.heldHTML(w, duck), SP.heldHTML(w, wrench)]));
      out.icons = H(
        per((w) => [AR.weaponIcon(w, duck), AR.weaponIcon(w, wrench)]),
      );
      out.guns = H([
        GA.GUNS,
        per((w) => GA.roundOf(w, "#a")), // (each one's bullet: its caliber's, K5)
        GA.roundOf("pellet"),
        GA.TRACE,
      ]);
      const ART = { ...SP, ...GA }; // (the drawings: gunart.js since there is one)
      out.bits = H([
        ART.SHOTGUN,
        ART.GRENADE(["#a", "#b", "#c"]),
        SP.pistolIcon(duck),
        SP.daggerHTML(duck),
        GA.roundOf("handgun"),
        SP.dualPistolHTML(duck),
        SP.ammoHTML(3),
      ]);
      out.boxes = H(per((w) => SP.heldBoxHTML(w, duck, 40)));
      /* as pixels: each in the hand at a duck of 40 css px (pxSVG) */
      out.pics = hash(
        steadyText(
          JSON.stringify(
            per((w) =>
              typeof SP.heldHTML(w, duck) === "string"
                ? SP.heldPicHTML(w, duck, 40)
                : typeof SP.heldHTML(w, duck),
            ),
          ),
        ),
      );
      out.catalog = hash(steadyText(CA.catalogHTML()));
      return { out, n: ids.length };
    })
    .catch((e) => ({ err: String(e).slice(0, 300) }));
  await b.close();
  noErrors(errs, "guns page errors");
  if (got.err) return fail("guns did not run: " + got.err);
  if (process.env.PIN) {
    fs.writeFileSync(PINNED, JSON.stringify(got.out, null, 1) + "\n");
    console.log("pinned", got.n, "weapons:", Object.keys(got.out).join(", "));
    return;
  }
  const pin = JSON.parse(fs.readFileSync(PINNED, "utf8"));
  for (const [k, v] of Object.entries(got.out))
    if (pin[k] !== v) fail(`guns: ${k} changed`);
  for (const k of Object.keys(pin))
    if (!(k in got.out)) fail(`guns: ${k} is pinned but no longer checked`);
})();
