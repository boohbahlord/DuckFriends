/* the Game Settings screen's picture of Duck Cabin (assets/maps/duck-cabin.jpg): the real map, all of it, from outside.
   Serve the folder (python3 -m http.server 8777), then: node tools/cabin-map.cjs. It starts a TEST Hangout, zooms the
   camera out to the whole world, hides the ducks and saves the board; Pillow (python3) shrinks it to a 1280 px JPEG.
   Run it again whenever the cabin's map changes. */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const path = require("path");

const URL = process.argv[2] || "http://localhost:8777/index.html",
  OUT = path.join(__dirname, "..", "assets", "maps", "duck-cabin.jpg"),
  PNG = path.join(require("os").tmpdir(), "duck-cabin-full.png");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1800, height: 1500 },
  });
  page.on("pageerror", (e) => console.log("page error:", e.message));
  /* the camera: my scale when set, and never "inside" (so the shade stays down and the cabin shows from outside) */
  await page.route(/hangout\/world\.js/, async (route) => {
    const r = await route.fetch();
    const text = (await r.text())
      .replace(
        "cam.sc = Math.min(vw / across, vh / 380) || 1;",
        "cam.sc = window.__camSc || Math.min(vw / across, vh / 380) || 1;",
      )
      .replace(
        "inside = L.inCabin(me.x * L.W, me.y * L.H);",
        "inside = window.__camSc ? false : L.inCabin(me.x * L.W, me.y * L.H);",
      );
    route.fulfill({ response: r, body: text });
  });
  await page.goto(URL);
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    const net = await import("./js/net.js");
    const router = await import("./js/router.js");
    const room = net.createLocalRoom({
      name: "Map",
      test: true,
      computers: 0,
      options: { mode: "hang" },
    });
    router.go("lobby", room);
    room.send({ t: "start" });
  });
  await page.waitForTimeout(8000);
  await page.evaluate(() => {
    const r = document.querySelector(".hang-board").getBoundingClientRect();
    window.__camSc = Math.min(r.width / 6120, r.height / 4840); // (the world is 6000 by 4400, with its edges)
    dispatchEvent(new Event("resize"));
  });
  await page.addStyleTag({
    content:
      ".hang-board .ducks, .hang-board .fxl, .hang-board .gduck-name, .hang-board .gduck, .hang-board [class*=npc] { display: none !important }",
  });
  await page.waitForTimeout(12000); // (the ground's tiles are painted a few at a time)
  await (await page.$(".hang-board")).screenshot({ path: PNG });
  await browser.close();
  execFileSync("python3", [
    "-c",
    "import sys\nfrom PIL import Image\nim = Image.open(sys.argv[1]).convert('RGB')\nim.resize((1280, round(1280 * im.size[1] / im.size[0])), Image.LANCZOS).save(sys.argv[2], quality=82, optimize=True, progressive=True)",
    PNG,
    OUT,
  ]);
  console.log("saved", OUT);
})();
