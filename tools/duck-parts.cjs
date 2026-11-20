/* ---------- the ducks' part sheets (the owner's, Nov 19 23:26Z: real pixels, made once ahead of time) ----------
   Every part of every duck (duck.js LAYERS) made into pixels at each size of duckparts.js SIZES, in the browser, with
   the game's own drawings (duck-parts-page.js). Writes
     assets/px/ducks/ducks-<size>-<hash>.webp   the parts: black pixels and shade numbers (lossless WebP)
     assets/px/ducks/ducks-<size>-<hash>.json   which part is where
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
      ? JSON.parse(
          /SHEETS = (\{.*\});/.exec(
            fs.readFileSync(path.join(ROOT, "js", "ducksheets.js"), "utf8"),
          )[1],
        )
      : {}, // (a few sizes: the rest stay)
    keep = new Set(),
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
      const png = path.join(OUT, `tmp-${n}.png`),
        tmp = path.join(OUT, `tmp-${n}.webp`);
      fs.writeFileSync(png, Buffer.from(r.png, "base64"));
      execFileSync("python3", [
        "-c",
        "import sys;from PIL import Image;Image.open(sys.argv[1]).save(sys.argv[2],'WEBP',lossless=True,exact=True,method=6)",
        png,
        tmp,
      ]);
      fs.unlinkSync(png);
      const pic = named(`ducks-${n}`, fs.readFileSync(tmp), "webp");
      fs.renameSync(tmp, path.join(OUT, pic));
      const json = JSON.stringify(r.index),
        idx = named(`ducks-${n}`, Buffer.from(json), "json");
      fs.writeFileSync(path.join(OUT, idx), json);
      keep.add(pic).add(idx);
      if (process.env.ONLY && sheets[n])
        for (const f of [sheets[n].url, sheets[n].index])
          if (!keep.has(path.basename(f)))
            fs.rmSync(path.join(ROOT, f), { force: true });
      sheets[n] = {
        url: `assets/px/ducks/${pic}`,
        index: `assets/px/ducks/${idx}`,
      };
      console.log(
        n,
        Object.keys(r.index).length,
        "parts,",
        (fs.statSync(path.join(OUT, pic)).size / 1024).toFixed(0),
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
    for (const f of old) if (!keep.has(f)) fs.unlinkSync(path.join(OUT, f)); // (an older making's)
  fs.writeFileSync(
    path.join(ROOT, "js", "ducksheets.js"),
    `/* made by tools/duck-parts.cjs: don't change it by hand (duckparts.js) */\nexport const SHEETS = ${JSON.stringify(ordered)};\n`,
  );
  await b.close();
  srv.close();
})();
