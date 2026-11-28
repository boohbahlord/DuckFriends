/* ---------- every weapon, item and icon made into real pixels, ahead of time (the owner's, Nov 19 23:10Z and 23:26Z) ----------
   The game is played through, on a computer's screen and a phone's, every mode, with Customize and the settings open,
   and every picture it still makes into pixels on the device is listed (pixel.js make(): window.__pxHear) with the
   sizes it showed at. Each one is then made once here, the way the device made it (pixel.js pxCanvas), and they all go
   into one picture:
     assets/px/art/art-<hash>.webp   the pixels (lossless WebP)
     js/pxa.js                       which picture is where, by its key (pixel.js reads it)
   then split in two: the front screen's, and the rest (tools/pixel-art-front.cjs)
   The ducks and the cats aren't in it (keys starting with c: they'll be made from their parts), nor a player's own
   pictures, nor the rainbow skin's turning steps.
   Serve nothing first: it serves the folder itself. Run it after changing any drawing, then python3 tools/stamp.py:
     node tools/pixel-art.cjs
   Env: ONLY (modes, comma separated) to play fewer modes while trying it out. Needs Playwright's Chromium and Pillow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const { splitFront } = require("./pixel-art-front.cjs");

const ROOT = path.join(__dirname, ".."),
  OUT = path.join(ROOT, "assets", "px", "art");
const MODES = (
  process.env.ONLY ||
  "aod,wyr,ddr,bb,sc,quack,law,dunce,vdd,trivia,hang,l4dd:downpour,sandbox"
).split(",");
const SCREENS = [
  ["computer", { viewport: { width: 1440, height: 900 } }],
  [
    "phone",
    {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  ],
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
    ".mp3": "audio/mpeg",
  };
  const srv = http.createServer((req, res) => {
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
    res.writeHead(200, {
      "content-type": types[path.extname(f)] || "application/octet-stream",
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* a new page of the game that lists every picture made on it */
async function gamePage(b, base, screen) {
  const p = await b.newPage(screen);
  p.on("pageerror", (e) =>
    console.log("  page error:", e.message.slice(0, 120)),
  );
  await p.addInitScript(() => {
    window.__pxNoBaked = true;
    window.__heard = new Map();
    window.__pxHear = (key, src, cw, ch) => {
      if (
        /^[cr]/.test(key) ||
        /^data:image\/(png|jpe?g|webp|gif)/.test(src) ||
        src.length > 400000
      )
        return;
      window.__heard.set(key + "@" + cw + "x" + ch, [key, src, cw, ch]);
    };
  });
  await p.goto(base + "index.html");
  await p.waitForTimeout(3000);
  return p;
}
const heard = (p) => p.evaluate(() => [...window.__heard.values()]);

/* the pages every player sees outside a game: the front, Customize (each of its pages), the settings */
async function pages(p) {
  await p.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const C = await import("./js/customize.js");
    C.openCustomize();
    await wait(1500);
    const ids = [...document.querySelectorAll(".arm-row[data-p]")].map(
      (r) => r.dataset.p,
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await wait(500);
    for (const id of ids) {
      C.openCustomize(id);
      await wait(1200);
      document
        .querySelectorAll(".armory details:not([open])")
        .forEach((d) => (d.open = true));
      await wait(400);
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      await wait(400);
    }
    (await import("./js/settings.js")).openSettings();
    await wait(1200);
  });
}

/* one mode played for a while: walking, attacking, every hotbar key */
async function play(p, mode) {
  const [id, map] = mode.split(":");
  await p.evaluate(
    async ([id, map]) => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const net = await import("./js/net.js"),
        router = await import("./js/router.js");
      const room = net.createLocalRoom({ name: "T", test: true, computers: 2 });
      window.room = room;
      const o = { mode: id, modePick: "host", mapPick: "host" };
      if (id === "l4dd") Object.assign(o, { l4start: 5 });
      room.send({ t: "options", id: room.state.host, options: o });
      router.go("lobby", room);
      await wait(800);
      (await import("./js/gamesettings.js")).openGameSettings?.(room);
      await wait(1000);
      document.querySelector(".win-x, [data-close]")?.click();
      room.send({ t: "start", id: room.state.host });
      await wait(5000);
      for (let i = 0; i < 30 && room.state.vt; i++) await wait(1000);
      if (room.state.hang) room.send({ t: "hang", k: "l4ready", id: room.me });
      await wait(4000);
    },
    [id, map],
  );
  for (const k of ["KeyD", "KeyS", "KeyA", "KeyW"]) {
    await p.keyboard.down(k);
    await p.waitForTimeout(600);
    await p.keyboard.up(k);
  }
  for (const k of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
    await p.keyboard.press(k);
    await p.waitForTimeout(250);
    await p.mouse.click(820, 380);
    await p.waitForTimeout(250);
  }
  /* jumping and sprinting: the touch pad's buttons (a phone) in their other looks while they cool down */
  for (let i = 0; i < 3; i++) {
    await p.keyboard.press("Space");
    await p.waitForTimeout(300);
    await p.keyboard.down("ShiftLeft");
    await p.keyboard.down("KeyD");
    await p.waitForTimeout(500);
    await p.keyboard.up("KeyD");
    await p.keyboard.up("ShiftLeft");
  }
  await p.waitForTimeout(6000);
}

/* a PNG (base64) written as a lossless WebP named by its bytes */
function webp(b64) {
  const png = path.join(OUT, "art.png"),
    tmp = path.join(OUT, "art.webp");
  fs.writeFileSync(png, Buffer.from(b64, "base64"));
  execFileSync("python3", [
    "-c",
    "import sys;from PIL import Image;Image.open(sys.argv[1]).save(sys.argv[2],'WEBP',lossless=True,method=6)",
    png,
    tmp,
  ]);
  fs.unlinkSync(png);
  const file = `art-${crypto.createHash("sha1").update(fs.readFileSync(tmp)).digest("hex").slice(0, 8)}.webp`;
  fs.renameSync(tmp, path.join(OUT, file));
  return file;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(),
    base = `http://127.0.0.1:${srv.address().port}/`,
    b = await chromium.launch(),
    all = new Map();
  const keep = (list) =>
    list.forEach((e) => all.set(e[0] + "@" + e[2] + "x" + e[3], e));
  for (const [name, screen] of SCREENS) {
    let p = await gamePage(b, base, screen);
    await pages(p);
    keep(await heard(p));
    await p.close();
    for (const mode of MODES) {
      const t = Date.now();
      p = await gamePage(b, base, screen);
      await play(p, mode);
      const got = await heard(p);
      keep(got);
      await p.close();
      console.log(
        name,
        mode,
        got.length,
        "pictures,",
        all.size,
        "in all",
        `${((Date.now() - t) / 1000).toFixed(0)} s`,
      );
    }
  }
  /* each made once, as the device makes it, then all of them on shelves 2048 pixels across */
  const p = await b.newPage();
  await p.goto(base + "index.html");
  await p.waitForTimeout(2000);
  const r = await p.evaluate(
    async (list) => {
      const { pxCanvas } = await import("./js/pixel.js");
      const pics = [];
      for (const [key, src, cw, ch] of list)
        try {
          pics.push({ key, c: await pxCanvas(src, cw, ch) });
        } catch {}
      const W = 2048,
        sorted = [...pics].sort((a, b) => b.c.height - a.c.height);
      let x = 0,
        y = 0,
        row = 0;
      for (const it of sorted) {
        if (x + it.c.width > W) {
          x = 0;
          y += row + 1;
          row = 0;
        }
        it.at = [x, y];
        x += it.c.width + 1;
        row = Math.max(row, it.c.height);
      }
      const c = document.createElement("canvas");
      c.width = W;
      c.height = y + row;
      const g = c.getContext("2d");
      const index = {};
      for (const it of pics) {
        g.drawImage(it.c, ...it.at);
        (index[it.key] ||= []).push([it.c.width, it.c.height, ...it.at]);
      }
      return {
        png: c.toDataURL("image/png").split(",")[1],
        index,
        failed: list.length - pics.length,
      };
    },
    [...all.values()],
  );
  const old = fs.readdirSync(OUT),
    file = webp(r.png);
  for (const f of old) if (f !== file) fs.unlinkSync(path.join(OUT, f)); // (the picture of an older making)
  fs.writeFileSync(
    path.join(ROOT, "js", "pxa.js"),
    `/* made by tools/pixel-art.cjs: don't change it by hand (pixel.js) */\n` +
      `export const ATLAS = ${JSON.stringify("assets/px/art/" + file)};\n` +
      `export const INDEX = ${JSON.stringify(r.index)};\n`,
  );
  console.log(
    Object.keys(r.index).length,
    "drawings,",
    all.size,
    "pictures,",
    r.failed,
    "couldn't be made;",
    (fs.statSync(path.join(OUT, file)).size / 1024).toFixed(0),
    "kB",
  );
  await splitFront(b, base); // (the front screen's pictures in a file of their own: tools/pixel-art-front.cjs)
  await b.close();
  srv.close();
})();
