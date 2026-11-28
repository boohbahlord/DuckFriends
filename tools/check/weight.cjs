/* I want weight checked by its numbers (B6 P2, push.js; the owner's, Nov 21 15:56Z: "a duck that is 110% bigger has 10%
   more weight and also 10% less speed ... more melee damage. In the same ratio ... knockback becomes 10% more"):
   - walk: 50% 1.5, 100% 1, 110% 0.9, 152% WEIGHT.SLOWEST (0.5);
   - the ratio: a push on a 110% duck moves it 1/1.1 as far as on a 100% one;
   - melee: a board hammer hit at 110% takes 1.1 times the HP (its target with 20 HP to spare first: the hammer's 4 to 6
     can take all of a duck's 4, and one roll for both); a zombie map's melee does 1.1 times the damage (zombieTakes), a
     shot the same at any Size;
   - immobile: a body with im is never pushed;
   - dead weight (B6b, guns.js DEAD_WEIGHT): a duck holding the LMG (0.15) is moved 1/1.15 as far, and walks as
     fast; a 110% duck holding a knife (0.02), 1/1.12;
   - the rings (B6 P4, blast.js): rings of one tile, 9 in the center (always a crit, so 18) and in ring 2, then half each
     ring out, none past ring 6; a grenade reaches 1.5 duck lengths.
   Run: node tools/check/run.mjs weight */
const C = require("./lib.cjs");
const { chromium } = require("playwright");
const near = (a, b, e = 0.002) => Math.abs(a - b) <= e;
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1366, height: 768 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async () => {
    const P = await import("./js/push.js"),
      BF = await import("./js/boardfire.js"),
      L4 = await import("./js/l4ddrules.js"),
      r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 1 });
    r.send({ t: "options", options: { modePick: "host", mode: "aod" } });
    r.send({ t: "start" });
    await new Promise((ok) => setTimeout(ok, 1500));
    const base = JSON.parse(JSON.stringify(r.state)),
      [a, c] = base.seat,
      now = Date.now(),
      sized = (sc) => {
        const s = JSON.parse(JSON.stringify(base));
        s.players[a].duck = { ...s.players[a].duck, scale: sc };
        s.pos[a] = { ...s.pos[a], x: 0.3, y: 0.5 };
        return s;
      };
    const out = { walk: {}, moved: {}, lost: {}, dmg: {} };
    for (const sc of [50, 100, 110, 152]) out.walk[sc] = P.walkOf(sized(sc), a);
    for (const sc of [100, 110]) {
      const s = sized(sc);
      BF.shove(s, a, 1, 0, 64, now, 0); // (a push of a duck length, 64 world px)
      out.moved[sc] = s.pos[a].x - 0.3;
      const t = sized(sc);
      t.php = { [c]: { n: -20, t: now } };
      const rnd = Math.random;
      Math.random = () => 0.999; // (no miss, no crit, the same roll of the hammer's damage each time)
      BF.hitSoaks(t, c, now, "hammer", false, a, P.sizeOf(t, a));
      out.lost[sc] = ((t.php[c] || {}).n ?? -20) + 20;
      out.dmg[sc] = [
        L4.zombieTakes(t, a, "knife").dmg,
        L4.zombieTakes(t, a, "handgun").dmg,
      ];
      Math.random = rnd;
    }
    const held = (sc, w) => {
      const s = sized(sc);
      s.pos[a] = { ...s.pos[a], w };
      BF.shove(s, a, 1, 0, 64, now, 0); // (a push of a duck length, 64 world px)
      return [s.pos[a].x - 0.3, P.walkOf(s, a)];
    };
    out.held = [held(100, "lmg"), held(110, "knife")];
    out.imm = [
      P.immobile({ im: true }),
      P.immobile({ sv: 0 }),
      P.pushTaken(5, Infinity),
    ];
    // the rings (B6 P4): a point body by distance in world px, a tile 16 px, no lucky crits
    const B = await import("./js/blast.js"),
      r0 = Math.random;
    Math.random = () => 0.99;
    const at = B.reach({ x: 640, y: 640, rx: 64, ry: 64 });
    out.rings = [0, 24, 40, 56, 72, 88, 104].map((d) => {
      const n = at(640 + d, 640, 0, 0, 0.001);
      return n ? [n.ring, n.dmg, B.hitOf(n).dmg] : null;
    });
    Math.random = r0;
    out.reach = B.REACH;
    return out;
  });
  const w = got.walk,
    m = got.moved;
  if (
    !(
      near(w[50], 1.5) &&
      near(w[100], 1) &&
      near(w[110], 0.9) &&
      near(w[152], 0.5)
    )
  )
    C.fail("walk speed by Size: " + JSON.stringify(w));
  if (!(m[100] > 0 && near(m[110], m[100] / 1.1, 0.0002)))
    C.fail("a push on a 110% duck: " + JSON.stringify(m));
  if (!(got.lost[100] > 0 && near(got.lost[110], got.lost[100] * 1.1, 0.011)))
    C.fail("a board hammer hit at 110%: " + JSON.stringify(got.lost));
  const [k0, g0] = got.dmg[100],
    [k1, g1] = got.dmg[110];
  if (!(near(k1, k0 * 1.1, 0.001) && g1 === g0))
    C.fail("a zombie map's melee at 110%: " + JSON.stringify(got.dmg));
  const [[cg, cw], [kn]] = got.held;
  if (
    !(
      near(cg, m[100] / 1.15, 0.0002) &&
      cw === 1 &&
      near(kn, m[100] / 1.12, 0.0002)
    )
  )
    C.fail("dead weight: " + JSON.stringify(got.held));
  if (got.imm.join() !== "true,false,0") C.fail("immobile: " + got.imm);
  if (
    got.reach !== 1.5 ||
    JSON.stringify(got.rings) !==
      "[[1,9,18],[2,9,9],[3,4.5,4.5],[4,2.25,2.25],[5,1.125,1.125],[6,0.5625,0.5625],null]"
  )
    C.fail("the rings: " + got.reach + " " + JSON.stringify(got.rings));
  C.noErrors(errs);
  await b.close();
})();
