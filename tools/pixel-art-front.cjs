/* ---------- the made pictures in two files: the front screen's, and the rest (slimming step 6: the owner's, Nov 20
   19:11Z, "how people did 32 bits right in the olden days": nothing loaded the screen doesn't show) ----------
   The front screen (and the splash over it) shows only a few of tools/pixel-art.cjs' pictures: the game is opened on a
   computer's screen and a phone's, and every picture it asks the files for there (pixel.js bakedPiece:
   window.__pxAsk) goes in a small file of its own, loaded at once; the rest in the other, loaded once a picture in it
   is shown, or a screen past the front one comes up:
     assets/px/art/art-<hash>.webp   the rest, and the front screen's, both lossless WebP
     js/pxa.js                       ATLAS: [the rest, the front screen's]; INDEX: a piece in the front screen's file
                                     has a 1 after its place
   Run by tools/pixel-art.cjs once it has made them; on its own (node tools/pixel-art-front.cjs) it splits the files
   there now again, then python3 tools/stamp.py. Needs Playwright's Chromium and Pillow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, ".."),
  OUT = path.join(ROOT, "assets", "px", "art"),
  PXA = path.join(ROOT, "js", "pxa.js");

/* every piece in one list: [key, w, h, x, y, its file] */
function pieces() {
  const box = { module: {} };
  vm.runInNewContext(
    fs
      .readFileSync(PXA, "utf8")
      .replace(/export const (\w+) =/g, "module.$1 ="),
    box,
  );
  const atlas = [].concat(box.module.ATLAS),
    out = [];
  for (const [key, vs] of Object.entries(box.module.INDEX))
    for (const [w, h, x, y, n] of vs)
      out.push([key, w, h, x, y, path.join(ROOT, atlas[n || 0])]);
  return { atlas, out };
}

/* the keys the front screen asks for, on a computer's screen and a phone's */
async function frontKeys(b, base) {
  const keys = new Set();
  for (const screen of [
    { viewport: { width: 1440, height: 900 } },
    {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  ]) {
    const ctx = await b.newContext({ ...screen, serviceWorkers: "block" }),
      p = await ctx.newPage();
    await p.exposeFunction("__pxAskOut", (k) => keys.add(k));
    await p.addInitScript(() => {
      window.__pxAsk = (k) => window.__pxAskOut(k);
    });
    await p.goto(base);
    await p.waitForTimeout(3000); // (the splash)
    await p.mouse.click(10, 10);
    await p.waitForTimeout(3000); // (the front screen)
    await ctx.close();
  }
  return keys;
}

/* the pieces packed again on shelves (each piece as it is, a pixel apart), into one lossless WebP: [file, its index] */
function sheet(list, n) {
  const spec = path.join(OUT, "split.json");
  fs.writeFileSync(spec, JSON.stringify(list));
  const r = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        `
import sys, json, io, hashlib
from PIL import Image
list = json.load(open(sys.argv[1]))
srcs = {f: Image.open(f).convert("RGBA") for f in {p[5] for p in list}}
area = sum((p[1] + 1) * (p[2] + 1) for p in list)
W = min(2048, max(max(p[1] for p in list) + 1, int(area ** 0.5 * 1.1)))
x = y = row = 0
at = []
for p in sorted(list, key=lambda p: (-p[2], -p[1], p[0], p[3], p[4])):
    if x + p[1] > W:
        x, y, row = 0, y + row + 1, 0
    at.append((p, x, y))
    x += p[1] + 1
    row = max(row, p[2])
sh = Image.new("RGBA", (W, y + row), (0, 0, 0, 0))
for p, x, y in at:
    sh.paste(srcs[p[5]].crop((p[3], p[4], p[3] + p[1], p[4] + p[2])), (x, y))
b = io.BytesIO()
sh.save(b, "WEBP", lossless=True, method=6)
name = "art-" + hashlib.sha1(b.getvalue()).hexdigest()[:8] + ".webp"
open(sys.argv[2] + "/" + name, "wb").write(b.getvalue())
print(json.dumps([name, [[p, x, y] for p, x, y in at]]))
`,
        spec,
        OUT,
      ],
      { maxBuffer: 1 << 26 },
    ).toString(),
  );
  fs.unlinkSync(spec);
  return [
    "assets/px/art/" + r[0],
    r[1].map(([[key, w, h, ox, oy, f], x, y]) => [
      [key, ox, oy, f].join("|"),
      n ? [w, h, x, y, n] : [w, h, x, y],
    ]),
  ];
}

async function splitFront(b, base) {
  const keys = await frontKeys(b, base),
    { atlas, out } = pieces(),
    front = out.filter((p) => keys.has(p[0])),
    rest = out.filter((p) => !keys.has(p[0]));
  const files = [],
    moved = new Map();
  for (const [n, list] of [rest, front].entries()) {
    if (!list.length) continue;
    const [file, at] = sheet(list, n);
    files[n] = file;
    for (const [id, v] of at) moved.set(id, v);
  }
  /* (each key's sizes in the order they were: the nearest of equals is the first) */
  const index = {};
  for (const [key, , , x, y, f] of out)
    (index[key] ||= []).push(moved.get([key, x, y, f].join("|")));
  for (const f of atlas)
    if (!files.includes(f)) fs.rmSync(path.join(ROOT, f), { force: true });
  fs.writeFileSync(
    PXA,
    `/* made by tools/pixel-art.cjs: don't change it by hand (pixel.js) */\n` +
      `export const ATLAS = ${JSON.stringify(files.length > 1 ? files : files[0])};\n` +
      `export const INDEX = ${JSON.stringify(index)};\n`,
  );
  execFileSync("npx", ["-y", "prettier@3.6.2", "--write", PXA]);
  console.log(
    `the front screen's pictures: ${front.length} pieces of ${keys.size} asked for; the rest: ${rest.length}`,
  );
}
module.exports = { splitFront };

if (require.main === module)
  (async () => {
    const srv = http
      .createServer((req, res) => {
        const u = decodeURIComponent(new URL(req.url, "http://x").pathname),
          f = path.join(ROOT, u === "/" ? "index.html" : u);
        if (
          !f.startsWith(ROOT) ||
          !fs.existsSync(f) ||
          fs.statSync(f).isDirectory()
        ) {
          res.writeHead(404);
          return res.end();
        }
        const ext = path.extname(f);
        res.writeHead(200, {
          "content-type":
            {
              ".html": "text/html",
              ".js": "text/javascript",
              ".css": "text/css",
              ".json": "application/json",
              ".svg": "image/svg+xml",
              ".webp": "image/webp",
              ".png": "image/png",
              ".woff2": "font/woff2",
              ".mp3": "audio/mpeg",
            }[ext] || "application/octet-stream",
        });
        fs.createReadStream(f).pipe(res);
      })
      .listen(0, "127.0.0.1");
    await new Promise((k) => srv.on("listening", k));
    const b = await chromium.launch();
    await splitFront(b, `http://127.0.0.1:${srv.address().port}/`);
    await b.close();
    srv.close();
  })();
