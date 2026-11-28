/* I want the chair checked as one thing in every mode (B6c, chair.js; the owner's, Nov 21 16:53Z: "Chairs can go
   through as many enemies as which its image is on top of ... the hitbox is based off the actual chair image itself.
   And that's how it works for Mad God Justin as well"):
   1. on Downpour a chair thrown from on top of a line of three zombies hits all three at once, each once, and flies
      on; a zombie off
      to the side, past its picture, is not hit;
   2. on a board a chair's reach is its picture's (sizeShots: 1 + 2 duck widths, 3 at Size 1), bigger for a bigger duck.
   Run: node tools/check/run.mjs chair */
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
    const L = await import("./js/hangout/layout.js"),
      R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      BF = await import("./js/boardfire.js"),
      CH = await import("./js/chair.js");
    L.useMode("l4dd", "downpour");
    Math.random = () => 0.99; // (no miss and no crit: the same every run)
    const { W, H } = L,
      y = 1400,
      x0 = 1530, // (thrown from on the middle one: its picture over all three)
      s = {
        options: { mode: "l4dd" },
        hang: { l4: { t0: 0, r: 6 } },
        players: { a: { name: "a" } },
        seat: ["a"],
        pos: { a: { x: 0.3, y: 0.5 } },
        shots: [],
      };
    Z.store(
      s,
      [1500, 1530, 1560, 1700].map((x, k) => ({
        i: k + 1,
        x,
        y: k === 3 ? y + 200 : y, // (the fourth: off to the side)
        hp: 30,
        st: 2,
        l: [1, 1],
        a: -1e6,
        dir: 0,
      })),
    );
    s.shots = [
      {
        k: "chair",
        w: "chair",
        by: "a",
        t: 0,
        x0: x0 / W,
        y0: y / H,
        lx: x0 / W,
        ly: y / H,
        vx: 600 / W,
        vy: 0,
        life: 1000,
        hz: 0,
      },
    ];
    R.l4Shots(s, 1);
    const hp1 = Z.zombies(s).map((z) => z.hp);
    for (const t of [150, 300, 450]) R.l4Shots(s, t);
    const b = { players: { a: {} }, shots: [{ k: "chair", by: "a" }] };
    BF.sizeShots(b);
    return {
      hp1,
      hp: Z.zombies(s).map((z) => z.hp),
      flying: s.shots.length,
      hit: (s.shots[0] || {}).hit,
      board: b.shots[0].r,
      big: CH.chairReach(1.5),
    };
  });
  const [a, b2, c, d] = got.hp1;
  if (!(a < 30 && b2 < 30 && c < 30))
    C.fail("the chair isn't over all three at once: " + JSON.stringify(got));
  if (d !== 30) C.fail("the chair hit one off to the side: " + got.hp);
  if (
    !got.flying ||
    JSON.stringify(got.hit) !== "[1,2,3]" ||
    String(got.hp) !== String(got.hp1)
  )
    C.fail("the chair stopped or hit twice: " + JSON.stringify(got));
  if (got.board !== 3) C.fail("a board chair's reach at Size 1: " + got.board);
  if (got.big !== 4) C.fail("a board chair's reach at Size 1.5: " + got.big);
  C.noErrors(errs);
  await b.close();
})();
