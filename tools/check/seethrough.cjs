/* I want every board's tiles see-through over its map, on every map, the maps players make too (the owner's rule: boards
   are see-through over the maps; Nov 22: "all of the tiles in the social and social competitive games that I've seen are
   not transparent like they once were anymore", on his own map Pandat, which a list of map names had missed).
   Agree or Disagree on a phone held sideways, on each built-in map and on a board whose map is one a player made (a
   made map's class, map-u…): every tile's background has to let the map through (its alpha under 0.6). */
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
  for (const map of MAPS) {
    await p.evaluate(async (map) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 0 });
      window._r = r;
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode: "aod",
          map,
          botWait: 1,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.send({ t: "start" });
      for (let i = 0; i < 300 && r.state.phase !== "submit"; i++)
        await new Promise((ok) => setTimeout(ok, 100));
      r.send({ t: "submit", text: "Ducks can fly" });
      const { boardPhases } = await import("./js/rules.js");
      for (
        let i = 0;
        i < 300 && !boardPhases(r.state).includes(r.state.phase);
        i++
      )
        await new Promise((ok) => setTimeout(ok, 100));
    }, map);
    await p
      .waitForFunction(
        () => !!document.querySelector(".board .cols > .col"),
        null,
        { timeout: 30000 },
      )
      .catch(() => {});
    const got = await p.evaluate((map) => {
      const read = () =>
        [...document.querySelectorAll(".board .cols > .col")].map(
          (c) => getComputedStyle(c).backgroundColor,
        );
      const own = read();
      if (map !== "board") return { own };
      /* a made map: the board takes the made map's classes instead of a built-in one's */
      const bd = document.querySelector(".board");
      [...bd.classList]
        .filter((k) => k.startsWith("map-"))
        .forEach((k) => bd.classList.remove(k));
      bd.classList.add("map-u1a2b3c", "map-made");
      return { own, made: read() };
    }, map);
    if (!got.own.length) C.fail(`${map}: no board tiles came up`);
    for (const [what, list] of Object.entries(got))
      for (const bg of list || [])
        if (alphaOf(bg) >= 0.6) {
          C.fail(
            `${map}${what === "made" ? " (a made map)" : ""}: a tile is solid (${bg}), not see-through`,
          );
          break;
        }
  }
  C.noErrors(errs);
  await b.close();
})().catch((e) => {
  C.fail("seethrough stopped: " + String(e).split("\n")[0].slice(0, 200));
  process.exit(1);
});
