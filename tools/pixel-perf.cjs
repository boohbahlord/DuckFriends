/* ---------- how fast the pixel look runs on a slow computer (the owner's go, Nov 19 13:17Z) ----------
   Headless Chromium with its CPU slowed 4x (CDP Emulation.setCPUThrottlingRate), a 1440 × 900 screen at 1x. Serve the
   folder first (python3 -m http.server 8765), then: node tools/pixel-perf.cjs [scene …]
   Scenes: load (the front page to a game on the board), board (Agree or Disagree on Night Show), cabin (Hangout in
   Duck Cabin), downpour (Quacky Zombies on Downpour from round 21, many zombies). For each: frames a second and frame
   times over 6 s, how much main-thread time went to making pixels (pixel.js, pixelpalette.js, pxdom.js), and the same
   again with the live #px-f filter switched off, to see what the filter costs.
   Env: RATE (4), SECS (6), URL (http://localhost:8765/), RUNS (1), OFF (a selector to switch off instead), TOP (the n
   files taking most time), FN (by function, with TOP), SETTLE (ms
   after the game starts before measuring: 2000) */
const { chromium } = require("playwright");
const RATE = +process.env.RATE || 4,
  SECS = +process.env.SECS || 6,
  URL = process.env.URL || "http://localhost:8765/",
  RUNS = +process.env.RUNS || 1;
const PX_FILES = /\/js\/(pixel|pixelpalette|pxdom|pxtext)\.js/;
const NO_FILTER = process.env.OFF
  ? `${process.env.OFF} { filter: none !important; }`
  : `html.pixel .map-layer, html.pixel #shapes, html.pixel .spx-flames, html.pixel .hg-porch,
  html.pixel .pcard::before, html.pixel .pat-pic, html.pixel .l4-flare::before, html.pixel .hurt-edge { filter: none !important; }`;

async function start(p, mode, extra) {
  await p.evaluate(
    async ([mode, extra, settle]) => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const net = await import("./js/net.js");
      const router = await import("./js/router.js");
      const room = net.createLocalRoom({ name: "T", test: true, computers: 3 });
      window.room = room;
      room.send({
        t: "options",
        id: room.state.host,
        options: { mode, modePick: "host", mapPick: "host", ...extra },
      });
      router.go("lobby", room);
      await wait(300);
      room.send({ t: "start", id: room.state.host });
      await wait(6000);
      for (let i = 0; i < 40 && room.state.vt; i++) await wait(1000);
      await wait(settle);
    },
    [mode, extra, +process.env.SETTLE || 2000],
  );
}
/* frames over SECS s, with a CPU profile of the same time */
async function frames(p, cdp) {
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 500 });
  await cdp.send("Profiler.start");
  const ts = await p.evaluate(
    (secs) =>
      new Promise((r) => {
        const t = [];
        const f = (now) => {
          t.push(now);
          if (now - t[0] < secs * 1000) requestAnimationFrame(f);
          else r(t);
        };
        requestAnimationFrame(f);
      }),
    SECS,
  );
  const { profile } = await cdp.send("Profiler.stop");
  const d = ts
    .slice(1)
    .map((v, i) => v - ts[i])
    .sort((a, b) => a - b);
  return {
    fps: +((d.length / (ts[ts.length - 1] - ts[0])) * 1000).toFixed(1),
    ms: +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1),
    p95: +d[Math.floor(d.length * 0.95)].toFixed(1),
    ...prof(profile),
  };
}
/* main-thread ms in the pixel files, and busy ms in all, from a CPU profile */
function prof(profile) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n])),
    dt = new Map();
  profile.samples.forEach((id, i) =>
    dt.set(id, (dt.get(id) || 0) + (profile.timeDeltas[i] || 0)),
  );
  let px = 0,
    busy = 0;
  for (const [id, us] of dt) {
    const n = byId.get(id),
      fn = n.callFrame.functionName;
    if (fn !== "(idle)" && fn !== "(program)") busy += us;
    if (PX_FILES.test(n.callFrame.url)) px += us;
  }
  const top = {};
  for (const [id, us] of dt) {
    const n = byId.get(id),
      f =
        (n.callFrame.url.split("/").pop() || "") +
          (process.env.FN
            ? ":" + n.callFrame.functionName + ":" + n.callFrame.lineNumber
            : "") || n.callFrame.functionName;
    if (f !== "(idle)") top[f] = (top[f] || 0) + us;
  }
  const r = { busyMs: Math.round(busy / 1000), pxMs: Math.round(px / 1000) };
  if (process.env.TOP)
    r.top = Object.entries(top)
      .sort((a, b) => b[1] - a[1])
      .slice(0, +process.env.TOP)
      .map(([f, us]) => `${f} ${Math.round(us / 1000)}`);
  return r;
}
async function page(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  return { p, cdp, errs };
}
const SCENES = {
  async load(b) {
    const { p, cdp, errs } = await page(b);
    const t0 = Date.now();
    await p.goto(URL, { waitUntil: "load" });
    const loadMs = Date.now() - t0;
    await p.waitForSelector(".screen", { timeout: 60000 });
    const frontMs = Date.now() - t0;
    await p.waitForTimeout(3000);
    /* a game starting: from Start until the board's first pictures are made (main-thread time, and the pixel part) */
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 500 });
    await cdp.send("Profiler.start");
    await start(p, "aod", { map: "board" });
    const { profile } = await cdp.send("Profiler.stop");
    await p.close();
    return { loadMs, frontMs, gameStart: prof(profile), errs };
  },
  board: (b) => scene(b, "aod", { map: process.env.MAP || "board" }),
  cabin: (b) => scene(b, "hang", {}),
  downpour: (b) =>
    scene(b, "l4dd", { l4start: 21 }, async (p) => {
      await p.evaluate(() =>
        window.room.send({ t: "hang", k: "l4", do: "endturn" }),
      ); // (ready: round 21 starts)
      await p.waitForTimeout(12000); // (its zombies come in)
    }),
};
async function scene(b, mode, extra, more) {
  const { p, cdp, errs } = await page(b);
  await p.goto(URL);
  await p.waitForTimeout(1500);
  await start(p, mode, extra);
  if (more) await more(p);
  const zs = () =>
    p.evaluate(
      () =>
        document.querySelectorAll(".l4-z, .l4z, [data-zid]").length ||
        ((window.room.state.hang || {}).zp || []).length / 4,
    );
  const on = await frames(p, cdp);
  await p.addStyleTag({ content: NO_FILTER });
  await p.waitForTimeout(500);
  const off = await frames(p, cdp);
  const r = {
    map: await p.evaluate(
      () => document.documentElement.className.match(/map-is-\S+/)?.[0] || "",
    ),
    zombies: mode === "l4dd" ? await zs() : undefined,
    withFilter: on,
    noFilter: off,
  };
  await p.close();
  return { ...r, errs };
}
(async () => {
  const want = process.argv.slice(2).length
    ? process.argv.slice(2)
    : Object.keys(SCENES);
  const b = await chromium.launch();
  for (let k = 0; k < RUNS; k++)
    for (const n of want) console.log(n, JSON.stringify(await SCENES[n](b)));
  await b.close();
})();
