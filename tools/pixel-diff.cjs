/* ---------- the pixel look before and after, compared by code (the owner's go, Nov 19 13:17Z) ----------
   The same screens drawn by two copies of the game, pixel by pixel: BASE (before, e.g. a git worktree of main served on
   8766) and NEW (this folder, on 8765). Only the map shows (everything over it hidden), motion off, so both are still.
   For each screen: how many screen pixels differ (any channel by more than TOL), as a share of the screen.
   node tools/pixel-diff.cjs [screen …]   Screens: front (the menus' background), board (Night Show) …; MAP=… for another
   map on the board. Env: BASE, NEW, TOL (8), SHOT (a folder: saves both and the difference) */
const { chromium } = require("playwright");
const fs = require("fs");
const BASE = process.env.BASE || "http://localhost:8766/",
  NEW = process.env.NEW || "http://localhost:8765/",
  TOL = +process.env.TOL || 8,
  SHOT = process.env.SHOT || "";
const DEVICES = {
  computer: { viewport: { width: 1440, height: 900 } },
  phone: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};
const ONLY_MAP = `html * { visibility: hidden !important; }
  .map-layer, .map-layer :not(.px-gone, .px-gone *), #shapes, #shapes :not(.px-gone, .px-gone *) { visibility: visible !important; }
  html, body { background: #000 !important; }`;

async function shot(b, url, dev, screen) {
  const p = await b.newPage(DEVICES[dev]);
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(url);
  await p.evaluate(async () => {
    const { profile, save } = await import("./js/store.js");
    profile.settings.motion = false; // (still: both copies hold the same frame)
    save();
    (await import("./js/settings.js")).applySettings();
  });
  await p.waitForTimeout(1500);
  if (screen !== "front")
    await p.evaluate(
      async (map) => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const net = await import("./js/net.js");
        const router = await import("./js/router.js");
        const room = net.createLocalRoom({
          name: "T",
          test: true,
          computers: 1,
        });
        room.send({
          t: "options",
          id: room.state.host,
          options: { mode: "aod", modePick: "host", mapPick: "host", map },
        });
        router.go("lobby", room);
        await wait(300);
        room.send({ t: "start", id: room.state.host });
        await wait(6000);
        for (let i = 0; i < 40 && room.state.vt; i++) await wait(1000);
      },
      screen === "board" ? process.env.MAP || "board" : screen,
    );
  await p.waitForTimeout(2500);
  await p.addStyleTag({ content: ONLY_MAP });
  await p.waitForTimeout(500);
  const own = await p.evaluate(
    () =>
      [...document.querySelectorAll(".px-own")].map((e) => e.id || e.className)
        .length,
  );
  const png = await p.screenshot();
  await p.close();
  return { png, own, errs };
}
/* the two pictures' pixels compared (decoded in a page: no packages needed) */
async function diff(b, a, c) {
  const p = await b.newPage();
  const r = await p.evaluate(
    async ([a, c, tol]) => {
      const load = async (s) => {
        const im = new Image();
        im.src = "data:image/png;base64," + s;
        await im.decode();
        const cv = new OffscreenCanvas(im.width, im.height),
          x = cv.getContext("2d");
        x.drawImage(im, 0, 0);
        return x.getImageData(0, 0, im.width, im.height);
      };
      const A = await load(a),
        C = await load(c);
      if (A.width !== C.width || A.height !== C.height) return { size: true };
      const out = new ImageData(A.width, A.height);
      let n = 0,
        big = 0;
      for (let i = 0; i < A.data.length; i += 4) {
        const d = Math.max(
          Math.abs(A.data[i] - C.data[i]),
          Math.abs(A.data[i + 1] - C.data[i + 1]),
          Math.abs(A.data[i + 2] - C.data[i + 2]),
        );
        if (d > tol) n++;
        if (d > 48) big++; // (a difference anyone would see: not just a shade at an edge)
        out.data[i] = out.data[i + 1] = out.data[i + 2] = d > tol ? 255 : 0;
        out.data[i + 3] = 255;
      }
      const cv = new OffscreenCanvas(A.width, A.height);
      cv.getContext("2d").putImageData(out, 0, 0);
      const bl = await cv.convertToBlob();
      const buf = new Uint8Array(await bl.arrayBuffer());
      let s = "";
      for (let i = 0; i < buf.length; i += 0x8000)
        s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return {
        pct: (n / (A.width * A.height)) * 100,
        n,
        bigPct: (big / (A.width * A.height)) * 100,
        png: btoa(s),
      };
    },
    [a.toString("base64"), c.toString("base64"), TOL],
  );
  await p.close();
  return r;
}
(async () => {
  const screens = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["front", "board"];
  const b = await chromium.launch();
  for (const dev of (process.env.DEVS || "computer,phone").split(","))
    for (const s of screens) {
      const before = await shot(b, BASE, dev, s),
        after = await shot(b, NEW, dev, s),
        d = await diff(b, before.png, after.png);
      const name = `${dev}-${s}${process.env.MAP ? "-" + process.env.MAP : ""}`;
      if (SHOT) {
        fs.writeFileSync(`${SHOT}/${name}-before.png`, before.png);
        fs.writeFileSync(`${SHOT}/${name}-after.png`, after.png);
        if (d.png)
          fs.writeFileSync(
            `${SHOT}/${name}-diff.png`,
            Buffer.from(d.png, "base64"),
          );
      }
      console.log(
        name,
        d.size
          ? "different sizes"
          : `${d.pct.toFixed(3)}% of pixels differ by more than ${TOL} (${d.n}), ${d.bigPct.toFixed(3)}% by more than 48`,
        `baked roots: ${before.own} -> ${after.own}`,
        [...before.errs, ...after.errs].join("; ") || "ok",
      );
    }
  await b.close();
})();
