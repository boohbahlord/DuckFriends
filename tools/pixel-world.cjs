/* ---------- Duck Cabin's and Downpour's art made into real pixels, ahead of time (the owner's, Nov 19 23:10Z and 23:26Z) ----------
   The ground and every prop of the walkable worlds, one pixel to two world px, in the game's colors (pixel.js pxCanvas:
   the way the game made them on the device before), for every look a prop has (pixel-world-page.js). Writes
     assets/px/world/<world>-ground-<hash>.webp, <world>-props-<hash>.webp   the pixels (lossless WebP)
     js/hangout/pxw-<world>.js                                                which picture is where (pxworld.js reads it)
   Run it after changing any drawing in shapes.js, art.js, stationart.js, dpground.js or their CSS:
     node tools/pixel-world.cjs
   then python3 tools/stamp.py as for any other change. Needs Playwright's Chromium and Python's Pillow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, ".."),
  OUT = path.join(ROOT, "assets", "px", "world");
const WORLDS = [
  ["cabin", "hang", "cabin"],
  ["downpour", "l4dd", "downpour"],
];

function serve() {
  const types = {
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/json",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname),
      f = path.join(ROOT, u);
    if (u === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end("<!doctype html><title>pixel world</title>");
    }
    if (
      !f.startsWith(ROOT) ||
      !fs.existsSync(f) ||
      fs.statSync(f).isDirectory()
    ) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      "content-type": types[path.extname(f)] || "application/octet-stream",
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* a PNG (base64) written as a lossless WebP named by its bytes; returns its path from the site's root */
function webp(name, b64) {
  const png = path.join(OUT, name + ".png");
  fs.writeFileSync(png, Buffer.from(b64, "base64"));
  const tmp = path.join(OUT, name + ".webp");
  execFileSync("python3", [
    "-c",
    "import sys;from PIL import Image;Image.open(sys.argv[1]).save(sys.argv[2],'WEBP',lossless=True,method=6)",
    png,
    tmp,
  ]);
  fs.unlinkSync(png);
  const h = crypto
      .createHash("sha1")
      .update(fs.readFileSync(tmp))
      .digest("hex")
      .slice(0, 8),
    file = `${name}-${h}.webp`;
  fs.renameSync(tmp, path.join(OUT, file));
  return `assets/px/world/${file}`;
}

/* the ground in bands across, as few as keep each file within one file's budget (384 KB: tools/pixel-budget.py); pxworld.js
   puts them back together pixel for pixel. [urls] */
function groundBands(name, b64) {
  const png = path.join(OUT, name + ".png");
  fs.writeFileSync(png, Buffer.from(b64, "base64"));
  const parts = execFileSync("python3", [
    "-c",
    `import sys, os
from PIL import Image
im = Image.open(sys.argv[1])
for n in range(1, 9):
    h = -(-im.height // n)
    outs = [sys.argv[1][:-4] + f"{i}.webp" for i in range(n)]
    for i, o in enumerate(outs):
        im.crop((0, i * h, im.width, min(im.height, (i + 1) * h))).save(o, "WEBP", lossless=True, method=6)
    if all(os.path.getsize(o) <= 384 * 1024 for o in outs):
        break
print(" ".join(outs))`,
    png,
  ])
    .toString()
    .trim()
    .split(" ");
  fs.unlinkSync(png);
  return parts.map((tmp, i) => {
    const h = crypto
        .createHash("sha1")
        .update(fs.readFileSync(tmp))
        .digest("hex")
        .slice(0, 8),
      file = `${name}${parts.length > 1 ? i + 1 : ""}-${h}.webp`;
    fs.renameSync(tmp, path.join(OUT, file));
    return `assets/px/world/${file}`;
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const old = fs.readdirSync(OUT);
  const srv = await serve(),
    b = await chromium.launch(),
    page = await b.newPage();
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
  await page.waitForTimeout(3000); // (the game as it starts: its scripts in their order, its CSS)
  const made = new Set();
  for (const [name, mode, map] of WORLDS) {
    const t = Date.now();
    const r = await page.evaluate(
      ([mode, map]) =>
        import("/tools/pixel-world-page.js").then((m) => m.bake(mode, map)),
      [mode, map],
    );
    const parts = groundBands(map + "-ground", r.ground.png),
      atlas = webp(name + "-props", r.atlas);
    for (const u of [...parts, atlas]) made.add(path.basename(u));
    const js =
      `/* made by tools/pixel-world.cjs: don't change it by hand (pxworld.js) */\n` +
      `export const GROUND = ${JSON.stringify({ parts, x: r.ground.x, y: r.ground.y, w: r.ground.w, h: r.ground.h })};\n` +
      `export const ATLAS = ${JSON.stringify(atlas)};\n` +
      `export const INDEX = ${JSON.stringify(r.index)};\n`;
    fs.writeFileSync(path.join(ROOT, "js", "hangout", `pxw-${name}.js`), js);
    console.log(
      name,
      Object.keys(r.index).length,
      "drawings,",
      r.skipped.length,
      "left to the device",
      r.skipped.length ? `(${[...new Set(r.skipped)].join(", ")})` : "",
      `${((Date.now() - t) / 1000).toFixed(0)} s`,
    );
  }
  for (const f of old) if (!made.has(f)) fs.unlinkSync(path.join(OUT, f)); // (the files of an older making)
  await b.close();
  srv.close();
})();
