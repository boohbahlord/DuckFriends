/* ---------- the ducks' part sheets (the owner's, Nov 19 23:26Z: real pixels, made once ahead of time) ----------
   Every part of every duck (duck.js LAYERS) made into pixels at each size of duckparts.js SIZES, in the browser, with
   the game's own drawings (duck-parts-page.js). Writes
     assets/px/ducks/<size>/<chunk>-<hash>.webp  the parts: black pixels and shade numbers (lossless WebP), an outfit's
                                                 clothes and a face item each in a file of their own, the rest in main
     assets/px/ducks/<size>/index-<hash>.json   which part is where, in which file
     js/ducksheets.js                           the files of each size (duckparts.js reads it)
   Run it after changing any drawing of a duck (duck.js, styles.js, hats.js, faces.js, outfits.js, eyes.js, beaks.js),
   then python3 tools/stamp.py:  node tools/duck-parts.cjs   (env ONLY: sizes, comma separated, to try a few)
   Needs Playwright's Chromium and Pillow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, ".."),
  OUT = path.join(ROOT, "assets", "px", "ducks");

function serve() {
  const types = {
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (u === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end("<!doctype html><title>duck parts</title>");
    }
    const f = path.join(ROOT, u);
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
const named = (name, buf, ext) =>
  `${name}-${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8)}.${ext}`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const old = fs.readdirSync(OUT),
    srv = await serve(),
    b = await chromium.launch(),
    t0 = Date.now();
  /* a page with every part listed (each size gets its own page: one page making them all slows down as it goes) */
  const fresh = async () => {
    const page = await b.newPage();
    page.on("pageerror", (e) => console.log("page error:", e.message));
    await page.goto(`http://127.0.0.1:${srv.address().port}/`);
    const count = await page.evaluate(() =>
      import("/tools/duck-parts-page.js").then((m) => m.listParts()),
    );
    return [page, count];
  };
  const [first, count] = await fresh();
  console.log(count, "parts", `${((Date.now() - t0) / 1000).toFixed(0)} s`);
  const { SIZES } = await first.evaluate(() =>
    import("/js/duckparts.js").then((m) => ({ SIZES: m.SIZES })),
  );
  await first.close();
  const sizes = process.env.ONLY
      ? process.env.ONLY.split(",").map(Number)
      : SIZES,
    sheets = process.env.ONLY
      ? new Function(
          fs
            .readFileSync(path.join(ROOT, "js", "ducksheets.js"), "utf8")
            .replace("export const SHEETS =", "return"),
        )() // (formatted by prettier: read as the script it is)
      : {}, // (a few sizes: the rest stay)
    todo = [...sizes];
  /* a few sizes at once (env JOBS, 3) */
  const job = async () => {
    for (let n; (n = todo.shift()) !== undefined; ) {
      const t = Date.now(),
        [page] = await fresh(),
        r = await page.evaluate(
          (n) => import("/tools/duck-parts-page.js").then((m) => m.bakeSize(n)),
          n,
        );
      await page.close();
      /* its own folder: emptied, then a file for each chunk and the index */
      const dir = path.join(OUT, String(n));
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const names = [],
        pngs = r.files.map((f, i) => {
          const png = path.join(dir, `tmp-${i}.png`);
          fs.writeFileSync(png, Buffer.from(f.png, "base64"));
          return png;
        });
      execFileSync("python3", [
        "-c",
        "import sys;from PIL import Image\nfor p in sys.argv[1:]: Image.open(p).save(p[:-4]+'.webp','WEBP',lossless=True,exact=True,method=6)",
        ...pngs,
      ]);
      let bytes = 0;
      r.files.forEach((f, i) => {
        const tmp = pngs[i].replace(/\.png$/, ".webp"),
          pic = named(f.name, fs.readFileSync(tmp), "webp");
        fs.unlinkSync(pngs[i]);
        fs.renameSync(tmp, path.join(dir, pic));
        bytes += fs.statSync(path.join(dir, pic)).size;
        names.push(pic);
      });
      const json = JSON.stringify({ f: names, p: r.index }),
        idx = named("index", Buffer.from(json), "json");
      fs.writeFileSync(path.join(dir, idx), json);
      sheets[n] = { index: `assets/px/ducks/${n}/${idx}` };
      console.log(
        n,
        Object.keys(r.index).length,
        "parts,",
        names.length,
        "files,",
        (bytes / 1024).toFixed(0),
        "kB +",
        (json.length / 1024).toFixed(0),
        "kB index",
        `${((Date.now() - t) / 1000).toFixed(0)} s`,
      );
    }
  };
  await Promise.all(Array.from({ length: +(process.env.JOBS || 3) }, job));
  const ordered = Object.fromEntries(
    Object.entries(sheets).sort((x, y) => x[0] - y[0]),
  );
  if (!process.env.ONLY)
    for (const f of old)
      if (!sizes.includes(+f))
        fs.rmSync(path.join(OUT, f), { recursive: true, force: true }); // (an older making's)
  fs.writeFileSync(
    path.join(ROOT, "js", "ducksheets.js"),
    `/* made by tools/duck-parts.cjs: don't change it by hand (duckparts.js) */\nexport const SHEETS = ${JSON.stringify(ordered)};\n`,
  );
  await b.close();
  srv.close();
})();
