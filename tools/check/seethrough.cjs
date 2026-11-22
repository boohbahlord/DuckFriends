/* I want every board's tiles see-through over its map, on every map, the maps players make too, and at ONE level, Agree
   or Disagree's (the owner's rule: boards are see-through over the maps; Nov 22: "all of the tiles in the social and
   social competitive games that I've seen are not transparent like they once were anymore", on his own map Pandat, which
   a list of map names had missed; "We don't have to make them have different see-throughs. That's a dangerous thing").
   On a phone held sideways: Agree or Disagree on each built-in map, then every board mode on a map a player made (a made
   map's class, map-u…). Every tile's background alpha has to be the one level, --board-a. */
const { chromium } = require("playwright");
const C = require("./lib.cjs");
const MAPS = [
  "board",
  "sky",
  "pixel",
  "carnival",
  "stars",
  "rabbit",
  "collage",
  "nwk",
  "euclid",
  "vellum",
  "tiles",
];
const MODES = ["law", "mgj", "wyr", "dunce", "vdd", "ddr"];
const alphaOf = (bg) => {
  const m =
    /\/\s*([\d.]+)\)$/.exec(bg) || /rgba\([^)]*,\s*([\d.]+)\)$/.exec(bg);
  return m ? +m[1] : bg === "transparent" ? 0 : 1;
};
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({
    viewport: { width: 800, height: 369 },
    isMobile: true,
    hasTouch: true,
  });
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const level =
    parseFloat(
      await p.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue(
          "--board-a",
        ),
      ),
    ) / 100;
  if (!(level > 0 && level < 0.6))
    C.fail(
      `the one see-through level (--board-a) is ${level}, not see-through`,
    );
  const runs = [
    ...MAPS.map((map) => ({ mode: "aod", map })),
    ...MODES.map((mode) => ({ mode, map: "board", made: true })),
  ];
  for (const { mode, map, made } of runs) {
    await p.evaluate(
      async ([mode, map]) => {
        const r = await (
          await import("./js/net.js")
        ).createLocalRoom({ name: "T", test: true, computers: 2 });
        window._r = r;
        r.send({
          t: "options",
          options: { modePick: "host", mapPick: "host", mode, map, botWait: 1 },
        });
        (await import("./js/router.js")).go("lobby", r);
        r.send({ t: "start" });
        const { boardPhases } = await import("./js/rules.js");
        for (let i = 0; i < 300; i++) {
          if (r.state.phase === "submit")
            r.send({ t: "submit", text: "Ducks can fly" });
          if (
            boardPhases(r.state).includes(r.state.phase) &&
            document.querySelector(".board .cols > .col")
          )
            break;
          await new Promise((ok) => setTimeout(ok, 100));
        }
      },
      [mode, map],
    );
    await p
      .waitForFunction(
        () => !!document.querySelector(".board .cols > .col"),
        null,
        { timeout: 30000 },
      )
      .catch(() => {});
    const bgs = await p.evaluate((made) => {
      const bd = document.querySelector(".board");
      /* a made map: the board takes the made map's classes instead of a built-in one's */
      if (bd && made) {
        [...bd.classList]
          .filter((k) => k.startsWith("map-"))
          .forEach((k) => bd.classList.remove(k));
        bd.classList.add("map-u1a2b3c", "map-made");
      }
      return [...document.querySelectorAll(".board .cols > .col")].map(
        (c) => getComputedStyle(c).backgroundColor,
      );
    }, !!made);
    const what = `${mode} on ${made ? "a made map" : map}`;
    if (!bgs.length) C.fail(`${what}: no board tiles came up`);
    const off = bgs.find((bg) => Math.abs(alphaOf(bg) - level) > 0.005);
    if (off)
      C.fail(
        `${what}: a tile is ${off}, not the one see-through level (${level})`,
      );
  }
  C.noErrors(errs);
  await b.close();
})().catch((e) => {
  C.fail("seethrough stopped: " + String(e).split("\n")[0].slice(0, 200));
  process.exit(1);
});
