/* ---------- the maps as pixel files (the owner's, Nov 19 23:26Z: "It should be saved as real pixels ... we don't have
   the leftover image behind. It's literally pixels") ----------
   Each map drawn by its code (SVG and CSS pictures) is drawn here once, in a browser, the game's way, at the size of
   the world (1366 × 768 css px, two to a pixel: the computer grid), made into pixels as the game made them on every
   device (pxbake.js), and kept as pixel files, one for each picture on it (tools/pixel-src/maprec.js): what moves is a
   strip of frames over its cycle. The game shows the world as it is, grown to cover the screen (js/pxmap.js), and
   never draws the map's pictures itself. Change a map's drawing, then run:
     node tools/pixel-maps.cjs            (every map)
     node tools/pixel-maps.cjs board      (only that one)
   then python3 tools/stamp.py as for any other change. Needs Playwright's Chromium and Python's Pillow. Writes
   assets/px/mapw/<map>/ and js/pxm/<map>.js */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, ".."),
  W = 1366,
  H = 768;

/* the maps: [its name, what it is, how it's drawn in the page (returns the scene's root, made into pixels), how many
   frames each moving part gets] */
const MAPS = [
  [
    "board",
    "Night Show (and the menus' background in the dark)",
    "night",
    true,
  ],
  ["board-light", "the menus' background in the light", "night", false],
  ["pixel", "Pixel", "scene", "pixel"],
  ["sky", "Sky's sun, moon, stars and clouds", "sky", null],
  ["carnival", "Carnival Night", "carnival", null],
  ["stars", "Starry Night", "stars", null],
];

function serve() {
  const types = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".html": "text/html",
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname),
      f = path.join(ROOT, u);
    if (
      !f.startsWith(ROOT) ||
      !fs.existsSync(f) ||
      fs.statSync(f).isDirectory()
    ) {
      res.writeHead(u === "/" ? 200 : 404, { "content-type": "text/html" });
      return res.end(
        u === "/"
          ? '<!doctype html><html class="pixel moving dark"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/app.css"></head><body style="margin:0"></body></html>'
          : "",
      );
    }
    res.writeHead(200, {
      "content-type": types[path.extname(f)] || "application/octet-stream",
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* one map recorded in the page */
async function recordMap(page, how, arg) {
  return page.evaluate(
    async ([how, arg, W, H]) => {
      const { record } = await import("/tools/pixel-src/maprec.js");
      const box = document.createElement("div");
      box.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden`;
      document.body.replaceChildren(box);
      let root, frames;
      if (how === "night") {
        const { backdropHTML } = await import("/tools/pixel-src/nightshow.js");
        const { bakeBackdrop } = await import("/js/pxbake.js");
        root = document.createElement("div");
        root.className = "scene night";
        root.style.cssText = `position:absolute;inset:0`;
        box.append(root);
        root.innerHTML = backdropHTML(W, H, arg);
        if (!(await bakeBackdrop(root))) throw new Error("night: not baked");
        frames = (el) =>
          el.classList.contains("pg-wheel")
            ? 12
            : el.classList.contains("pg-smoke")
              ? 24
              : 48;
      }
      if (how === "sky") {
        /* Sky's pictures one by one, as css draws them (its scene lays them out anew each round, js/maps.js skyScene):
           the sun and the moon (from their middle), a star, and a cloud at each width it can have (9% to 19% of the
           world's width) */
        const { framesOf } = await import("/tools/pixel-src/maprec.js");
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/tools/pixel-src/sky.css";
        document.head.append(css);
        await new Promise((ok) => (css.onload = ok));
        box.style.containerType = "size";
        box.className = "scene sky";
        const files = {},
          out = {};
        const one = async (el, name) => {
          el.classList.add("px-shot");
          el.style.animation = "none";
          box.append(el);
          const f = await framesOf(el, 1);
          el.remove();
          const k = "sky-" + name;
          files[k] = f.url;
          return { src: "FILE:" + k, x: f.x, y: f.y, w: f.w, h: f.h };
        };
        const div = (cls, html = "") => {
          const e = document.createElement("div");
          e.className = cls;
          e.innerHTML = html;
          return e;
        };
        out.sun = await one(div("sky-sun"), "sun");
        out.moon = await one(div("sky-moon"), "moon");
        const stars = div("sky-stars");
        box.append(stars);
        const i = document.createElement("i");
        i.style.left = i.style.top = "0";
        i.classList.add("px-shot");
        i.style.animation = "none";
        stars.append(i);
        const f = await framesOf(i, 1);
        stars.remove();
        files["sky-star"] = f.url;
        out.star = { src: "FILE:sky-star", x: f.x, y: f.y, w: f.w, h: f.h };
        out.clouds = {};
        const { CLOUD } = await import("/tools/pixel-src/skyart.js");
        for (let w = 9; w <= 19; w++) {
          const c = div("sky-cloud", CLOUD);
          c.style.cssText = `width:${w}%;left:0;top:0`;
          out.clouds[w] = await one(c, "cloud" + w);
        }
        return { html: JSON.stringify(out), files };
      }
      if (how === "stars") {
        /* the turning sky, one picture in the world's pixels (the game turns it, its pixels kept whole), and where its
           brightest stars are (the game draws them twinkling) */
        const { starSky } = await import("/tools/pixel-src/stars.js");
        const s = starSky(W, H, 2);
        return {
          html: JSON.stringify({
            sky: "FILE:stars-sky",
            R: s.R,
            pole: s.pole.map((v) => +v.toFixed(2)),
            base: +s.base.toFixed(4),
            bright: s.bright,
          }),
          files: { "stars-sky": s.canvas.toDataURL("image/png") },
        };
      }
      if (how === "carnival") {
        /* one drawing: its wheel turns (12 spokes alike: a twelfth of a turn, 90 s round, as 60 frames), its cars and
           rim lights are carried round hanging straight, its bulbs and stars twinkle, its flag waves */
        const { carnivalSVG } = await import("/tools/pixel-src/carnival.js");
        const { recordSvg } = await import("/tools/pixel-src/maprec.js");
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/tools/pixel-src/carnival.css";
        document.head.append(css);
        await new Promise((ok) => (css.onload = ok));
        root = document.createElement("div");
        root.className = "scene carnival";
        root.style.cssText = "position:absolute;inset:0";
        box.append(root);
        root.innerHTML = carnivalSVG(true);
        const svg = root.firstElementChild;
        svg.setAttribute("viewBox", "0 0 1600 900");
        return recordSvg(
          root,
          svg,
          ".cn-wheel, .cn-car, .cn-bulb, .cn-star, .cn-flag",
          (el) =>
            el.classList.contains("cn-wheel")
              ? { k: "frames", P: 7500, N: 60 }
              : el.classList.contains("cn-car")
                ? { k: "hang", P: 90000, cx: 330, cy: 410 }
                : el.classList.contains("cn-flag")
                  ? { k: "frames", P: 3200, N: 24 }
                  : { k: "fade", cls: "pxt" },
        );
      }
      if (how === "scene") {
        /* a map whose scene lays itself out once and is made into pixels by its own code (pxbake.js bakeStill) */
        await import("/js/rules.js"); // (first, as the game loads them: maps.js and rules.js need each other)
        const { mountPreview } = await import("/js/maps.js");
        mountPreview(box, arg);
        const layer = box.querySelector(".map-layer");
        for (let i = 0; i < 100 && !layer.classList.contains("px-own"); i++)
          await new Promise((ok) => setTimeout(ok, 100));
        if (!layer.classList.contains("px-own"))
          throw new Error(arg + ": not baked");
        root = layer.querySelector(".scene");
        frames = () => 24;
      }
      return record(root, frames);
    },
    [how, arg, W, H],
  );
}

(async () => {
  const only = process.argv[2] || "";
  const srv = await serve(),
    b = await chromium.launch(),
    page = await b.newPage({
      viewport: { width: W, height: H },
      deviceScaleFactor: 1,
    });
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/`);
  await page.waitForTimeout(500);
  for (const [id, what, how, arg] of MAPS) {
    if (only && id !== only) continue;
    const { html, files } = await recordMap(page, how, arg),
      dir = path.join(ROOT, "assets", "px", "mapw", id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    let bytes = 0;
    for (const [k, url] of Object.entries(files)) {
      const tmp = path.join(dir, k + ".png"),
        out = path.join(dir, k + ".webp");
      fs.writeFileSync(tmp, Buffer.from(url.split(",")[1], "base64"));
      execFileSync("python3", [
        "-c",
        "import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).save(sys.argv[2], 'WEBP', lossless=True, method=6)",
        tmp,
        out,
      ]); // (lossless: the pixels stay exactly as made)
      fs.unlinkSync(tmp);
      bytes += fs.statSync(out).size;
    }
    const markup = html.replace(
      /FILE:([\w-]+)/g,
      (_, k) => `assets/px/mapw/${id}/${k}.webp`,
    );
    fs.mkdirSync(path.join(ROOT, "js", "pxm"), { recursive: true });
    fs.writeFileSync(
      path.join(ROOT, "js", "pxm", id + ".js"),
      `/* ${what}, as pixel files: written by tools/pixel-maps.cjs, never by hand */\nexport default ${JSON.stringify(how === "sky" || how === "stars" ? { W, H, G: 2, ...JSON.parse(markup) } : { W, H, G: 2, html: markup })};\n`,
    );
    execFileSync("npx", [
      "-y",
      "prettier@3.6.2",
      "--write",
      path.join(ROOT, "js", "pxm", id + ".js"),
    ]); // (the owner's way, as every file)
    console.log(
      `${id}: ${Object.keys(files).length} files, ${Math.round(bytes / 1024)} KB, markup ${Math.round(markup.length / 1024)} KB`,
    );
  }
  await b.close();
  srv.close();
})();
