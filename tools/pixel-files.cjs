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
/* the map vote's pictures (the owner's, Nov 19 20:04Z: its pictures were made on the device, black for seconds on a
   slow phone). Each is the map's own drawing in the game (art.js artBackdrop), drawn big in the page and made into
   pixels the same way; the size is about the most the vote ever shows one at (a quarter of its 70rem box) */
const VOTE = [160, 90];

/* a map's vote picture made into pixels in the page: a PNG's bytes, as base64. Its drawing's own pictures (a map's
   photo, the collage's drawing) are put inside it first, so it draws as one picture */
async function madeTile(page, map, w, h) {
  return page.evaluate(
    async ([map, w, h]) => {
      const { artBackdrop } = await import("/js/art.js");
      const { applyPalette } = await import("/js/pixelpalette.js");
      let body = artBackdrop(map);
      for (const [, href] of body.matchAll(/href="([^"]+)"/g)) {
        if (href.startsWith("data:")) continue;
        const b = await (await fetch("/" + href.replace(/^\//, ""))).blob();
        const url = await new Promise((ok) => {
          const r = new FileReader();
          r.onload = () => ok(r.result);
          r.readAsDataURL(b);
        });
        body = body.split(`href="${href}"`).join(`href="${url}"`);
      }
      const big = [w * 6, h * 6],
        box = document.createElement("div");
      box.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" width="${big[0]}" height="${big[1]}">${body}</svg>`; // (read as the page reads it, then written out as a file: Night Show's drawing names its width twice)
      const svg = new XMLSerializer().serializeToString(box.firstElementChild),
        img = new Image();
      img.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      await img.decode().catch(() => {
        const bad = new DOMParser()
          .parseFromString(svg, "image/svg+xml")
          .querySelector("parsererror");
        throw new Error(
          `${map}: ${bad ? bad.textContent.slice(0, 200) : "won't draw"}`,
        );
      });
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.imageSmoothingEnabled = true;
      x.imageSmoothingQuality = "high"; // (as pixel.js make: each pixel the average of what it covers)
      x.drawImage(img, 0, 0, w, h);
      x.putImageData(applyPalette(x.getImageData(0, 0, w, h)), 0, 0);
      return c.toDataURL("image/png").split(",")[1];
    },
    [map, w, h],
  );
}
async function voteMaps(page) {
  return page.evaluate(async () => {
    const { VOTE_MAPS } = await import("/js/rules.js");
    const { mapForm } = await import("/js/maps.js");
    const { isNwk } = await import("/js/nwk.js");
    return [
      ...new Set(
        VOTE_MAPS.map((id) => mapForm(id).map).filter((m) => !isNwk(m)),
      ),
    ]; // (Nous Within Kenoma's are the map itself, drawn still: vote.js stills)
  });
}

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
  const items = [
    ...ITEMS,
    ...(await voteMaps(page)).map((m) => [`vote/${m}.webp`, ...VOTE, "tile"]),
  ];
  for (const [src, w, h, how] of items) {
    if (!src.startsWith(only)) continue;
    const png = Buffer.from(
        await (how === "tile"
          ? madeTile(page, src.slice(5, -5), w, h)
          : made(page, src, w, h, how)),
        "base64",
      ),
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
    const a = how === "tile" ? 0 : fs.statSync(path.join(SRC, src)).size, // (a vote picture has no original: the drawing)
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
