/* ---------- ready-made pixel files (the owner's, Nov 19 17:00Z) ----------
   The pictures that never change between games (the maps' backdrops, the mode pictures, the Duck Cabin TV's stills) are
   made into pixels here, once, and shipped that way: small files the game shows as they are, with nothing made on the
   device and nothing to pop in. Each one is made the way the game makes a picture into pixels (pixel.js make: drawn
   small with smoothing, so each pixel is the average of what it covers, then through the game's colors,
   pixelpalette.js), in a browser, so it comes out the same. Saved as lossless WebP.

   The originals stay in tools/pixel-src/ (never downloaded by players: the game names only the made files). To change
   a picture, put its new original there and run:
     node tools/pixel-files.cjs            (every picture)
     node tools/pixel-files.cjs modes/aod  (only those whose name starts so)
   then python3 tools/stamp.py as for any other change. Needs Playwright's Chromium and Python's Pillow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, ".."),
  SRC = path.join(__dirname, "pixel-src"),
  OUT = path.join(ROOT, "assets", "px");

/* [the original in tools/pixel-src, its size in pixels (width, height), how it's made]. A size is about the most the
   game ever shows it at, one pixel to the grid's square on a computer (about 2 css px: pixel.js grid), so the game
   never has to show it bigger than its own pixels. How: "avg" (each pixel the average of what it covers, the game's
   colors) or "keep" (already pixel art, of its own colors: every 4th pixel of it, as it is) */
const MODES = [
  "aod",
  "bb",
  "ddr",
  "dunce",
  "hang",
  "l4dd",
  "law",
  "mgj",
  "quack",
  "sc",
  "trivia",
  "vdd",
  "wyr",
];
const TV = ["bath", "board", "ec", "kitten", "rabbit", "stars", "static"];
const ITEMS = [
  ["maps/rabbit-hole.jpg", 640, 360, "avg"],
  ["maps/starry-night.jpg", 720, 405, "avg"],
  ["maps/ethers-crossroads.png", 320, 180, "keep"], // (drawn 4 times its size: its own pixels, back at their size)
  ["maps/vellum.webp", 565, 835, "avg"],
  ["maps/duck-cabin.jpg", 640, 534, "avg"],
  ["maps/duck-cabin-zombies.jpg", 640, 360, "avg"],
  ["maps/downpour.jpg", 640, 360, "avg"],
  ...MODES.map((m) => [`modes/${m}.webp`, 480, 270, "avg"]),
  ...TV.map((c) => [`tv/${c}.webp`, 156, 120, "avg"]),
];

/* a little server for the browser: the game's own scripts, and the originals */
function serve() {
  const types = {
    ".js": "text/javascript",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".html": "text/html",
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname),
      f = u.startsWith("/src/")
        ? path.join(SRC, u.slice(5))
        : path.join(ROOT, u);
    if (
      !f.startsWith(ROOT) ||
      !fs.existsSync(f) ||
      fs.statSync(f).isDirectory()
    ) {
      res.writeHead(u === "/" ? 200 : 404, { "content-type": "text/html" });
      return res.end(
        u === "/" ? "<!doctype html><title>pixel files</title>" : "",
      );
    }
    res.writeHead(200, {
      "content-type": types[path.extname(f)] || "application/octet-stream",
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* one picture made into pixels in the page: a PNG's bytes, as base64 */
async function made(page, src, w, h, how) {
  return page.evaluate(
    async ([src, w, h, how]) => {
      const { applyPalette } = await import("/js/pixelpalette.js");
      const img = new Image();
      img.src = "/src/" + src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d", { willReadFrequently: true });
      if (how === "keep") {
        x.imageSmoothingEnabled = false; // (one of its own pixels for each)
        x.drawImage(img, 0, 0, w, h);
      } else {
        x.imageSmoothingEnabled = true;
        x.imageSmoothingQuality = "high"; // (as pixel.js make)
        /* cut to the box's shape first, from the middle, as the game shows it (cover) */
        const k = Math.max(w / img.naturalWidth, h / img.naturalHeight),
          sw = w / k,
          sh = h / k;
        x.drawImage(
          img,
          (img.naturalWidth - sw) / 2,
          (img.naturalHeight - sh) / 2,
          sw,
          sh,
          0,
          0,
          w,
          h,
        );
        x.putImageData(applyPalette(x.getImageData(0, 0, w, h)), 0, 0);
      }
      return c.toDataURL("image/png").split(",")[1];
    },
    [src, w, h, how],
  );
}

(async () => {
  const only = process.argv[2] || "";
  const srv = await serve(),
    b = await chromium.launch(),
    page = await b.newPage();
  await page.goto(`http://127.0.0.1:${srv.address().port}/`);
  let before = 0,
    after = 0;
  for (const [src, w, h, how] of ITEMS) {
    if (!src.startsWith(only)) continue;
    const png = Buffer.from(await made(page, src, w, h, how), "base64"),
      out = path.join(OUT, src.replace(/\.\w+$/, ".webp")),
      tmp = out + ".png";
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(tmp, png);
    execFileSync("python3", [
      "-c",
      "import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).save(sys.argv[2], 'WEBP', lossless=True, method=6)",
      tmp,
      out,
    ]); // (lossless: the pixels stay exactly as made)
    fs.unlinkSync(tmp);
    const a = fs.statSync(path.join(SRC, src)).size,
      z = fs.statSync(out).size;
    before += a;
    after += z;
    console.log(
      `${src}: ${w} x ${h}, ${Math.round(a / 1024)} KB -> ${Math.round(z / 1024)} KB`,
    );
  }
  console.log(
    `all: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`,
  );
  await b.close();
  srv.close();
})();
