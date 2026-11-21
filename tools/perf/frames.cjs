/* how busy a frame is, steadily enough to judge a change by (Adam's ask, Nov 21 04:47Z): one busy scene, played the
   same way each time, and from a Chrome trace the main thread's and the graphics card's (the GPU process's) busy time
   in each frame, frames a second, the processes' processor time a frame and the layers drawn.
   The scene: Dead Ducks Arcade on Downpour (or Duck Cabin, or Survival), round 21 by the test command's action, every
   duck kept up. Headless Chromium has no graphics card: with GPU=1 (the default) it draws with SwiftShader, a stand-in
   that does the card's work on the processor, so the card's share is seen at all.
   A live scene changes from run to run (where the zombies go), so the steady way is a replay: RECORD=file once, then
   REPLAY=file hands the screen the same recorded states every run (within ±7% over 3 runs, Nov 21).
   node tools/perf/frames.cjs [runs]
   env: MAP (downpour|cabin), MODE (l4dd|surv), SECS (the window, 15), GPU (1|0), BOTS (computers, 0),
     RECORD / REPLAY (a gzipped recording), B (another folder: A and B in turns, B/A printed), URL / URL_B (running
     servers), CSS (a style added first, e.g. a layer hidden), PROBE (what's on screen, by size and filters),
     EVENTS (where the time goes, by thread and event), SHOT (a picture), CATS / DUMP (more trace categories; the
     trace to a file), THREADS (busy time by thread) */
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const RUNS = +(process.argv[2] || 3),
  MAP = process.env.MAP || "downpour",
  MODE = process.env.MODE || "l4dd",
  SECS = +(process.env.SECS || 15),
  GPU = process.env.GPU !== "0",
  RECORD = process.env.RECORD, // (a file: this run's room states are written there, gzipped, for replays)
  REPLAY = process.env.REPLAY, // (a recording played to the screen instead of the rules: the same scene every run)
  CSS = process.env.CSS, // (a style added before the window, e.g. one layer hidden, to see what that layer costs)
  BOTS = +(process.env.BOTS || 0), // (computers: none by default, so the zombies crowd my duck the same way every run)
  ROOT = path.resolve(__dirname, "../..");
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
};

/* this folder on a free port, files as they are (no cache, so every run loads the same) */
function serve(root = ROOT) {
  root = path.resolve(root);
  const srv = http.createServer((q, r) => {
    const f = path.join(
      root,
      decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"),
    );
    if (!f.startsWith(root)) return r.writeHead(403).end();
    fs.readFile(f, (e, b) => {
      if (e) return r.writeHead(404).end();
      r.writeHead(200, {
        "content-type": TYPES[path.extname(f)] || "application/octet-stream",
        "cache-control": "no-store",
      }).end(b);
    });
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

const quantile = (a, q) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
/* a thread's busy time: its tasks' time, overlaps counted once */
function busyOf(tasks) {
  tasks.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [t0, t1] of tasks) {
    const last = out[out.length - 1];
    if (last && t0 <= last[1]) last[1] = Math.max(last[1], t1);
    else out.push([t0, t1]);
  }
  return out;
}
/* how much of [a, b] the busy spans cover */
function covered(spans, a, b, from) {
  let ms = 0,
    i = from.i;
  while (i < spans.length && spans[i][1] <= a) i++;
  from.i = i;
  for (let j = i; j < spans.length && spans[j][0] < b; j++)
    ms += Math.min(b, spans[j][1]) - Math.max(a, spans[j][0]);
  return ms / 1000;
}

async function once(url) {
  const b = await chromium.launch({
    args: GPU
      ? [
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
          "--ignore-gpu-blocklist",
          "--enable-gpu-rasterization",
          "--enable-accelerated-2d-canvas",
        ]
      : [],
  });
  const cx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await cx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  /* the same dice every run: the zombies' looks, where they come in, the computers' choices (their timing still varies) */
  await p.addInitScript(() => {
    const real = Date.now;
    let off = 0;
    Date.now = () => real() + off; // (a replay sets the clock to the recording's: the states' times are its)
    window.__clock = (to) => (off = to - real());
    let x = 20261121;
    Math.random = () => {
      x = (x + 0x6d2b79f5) | 0;
      let t = Math.imul(x ^ (x >>> 15), 1 | x);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  await p.goto(url);
  await p.waitForTimeout(3000);
  await p.evaluate(
    async ([map, mode, bots]) => {
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: bots });
      window._r = r;
      /* the screen's listeners, kept so a replay can hand them the recorded states (nothing in the game changes) */
      window.__fns = [];
      const on0 = r.on;
      r.on = (f) => (window.__fns.push(f), on0(f));
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode,
          map: "cabin",
          l4map: map,
          botWait: 1,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.state.zmapAsked = 1;
      r.send({ t: "start" });
    },
    [MAP, MODE, BOTS],
  );
  await p.waitForFunction(
    () =>
      document.body.dataset.screen === "game" &&
      !document.querySelector(".veil[data-on]"),
    null,
    { timeout: 180000, polling: 250 },
  );
  await p.waitForTimeout(3000);
  /* every duck kept up: its HP full, never down or a ghost */
  await p.evaluate(async () => {
    const { maxHp } = await import("./js/l4ddrules.js");
    setInterval(() => {
      const s = window._r.state,
        P = s.hang && s.hang.l4p;
      if (P)
        for (const id in P) {
          const q = P[id];
          if (!q) continue;
          delete q.dn;
          delete q.gh;
          q.hp = maxHp(s, id);
        }
    }, 400);
  });
  if (REPLAY) {
    /* the recording played: the rules stop (the heartbeat and my own actions do nothing), and the screen gets each
       recorded state at its time, the clock set to the recording's */
    const rec = JSON.parse(zlib.gunzipSync(fs.readFileSync(REPLAY)));
    await p.evaluate((rec) => {
      const r = window._r;
      r.send = () => {};
      r.me = rec.me;
      let cur = rec.list[0].s;
      Object.defineProperty(r, "state", { get: () => cur, configurable: true });
      window.__clock(rec.list[0].t);
      const t0 = performance.now();
      let i = 0;
      const step = () => {
        const at = rec.list[0].t + (performance.now() - t0);
        while (i < rec.list.length && rec.list[i].t <= at) {
          cur = rec.list[i++].s;
          for (const f of window.__fns) f(cur, { t: "tick" });
        }
        if (i < rec.list.length) setTimeout(step, 4);
        else window.__replayed = true;
      };
      step();
    }, rec);
    await p.waitForTimeout(rec.lead || 3000); // (into the recording before the window starts)
  } else {
    if (MODE === "l4dd")
      await p.evaluate(() =>
        window._r.send({ t: "hang", k: "cheat", do: "round", n: 21 }),
      ); // (cheat round 21: cheats.js)
    await p.waitForTimeout(MODE === "surv" ? 40000 : 12000); // (the zombies in: a horde comes on its own in Survival)
  }
  if (CSS) await p.addStyleTag({ content: CSS });
  if (process.env.SHOT)
    (await p.waitForTimeout(800),
      await p.screenshot({ path: process.env.SHOT })); // (a picture of the scene, the style added)
  if (process.env.PROBE)
    /* what's on screen: the world's parts grouped by tag and first class, how many show and how big they are, so a slow
       scene can be named (the crowd, the camera, the fire, the rain or the lights) before hiding them one at a time */
    console.log(
      await p.evaluate(() => {
        const W = document.body,
          by = {};
        for (const el of W.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (
            !r.width ||
            !r.height ||
            r.right < 0 ||
            r.bottom < 0 ||
            r.left > innerWidth ||
            r.top > innerHeight
          )
            continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none") continue;
          const k =
              el.tagName.toLowerCase() +
              (el.classList[0] ? "." + el.classList[0] : "") +
              (el.width && el.tagName === "CANVAS"
                ? `[${el.width}x${el.height}]`
                : ""),
            o = (by[k] ||= { n: 0, area: 0, fx: {} });
          o.n++;
          o.area += Math.round((r.width * r.height) / 1000);
          for (const [n, v] of [
            ["filter", cs.filter],
            ["backdrop", cs.backdropFilter],
            ["blend", cs.mixBlendMode === "normal" ? "none" : cs.mixBlendMode],
            ["mask", cs.maskImage],
            ["clip", cs.clipPath],
            ["shadow", cs.boxShadow],
          ])
            if (v !== "none") o.fx[n] = (o.fx[n] || 0) + 1;
        }
        /* the page's rules with a filter, a backdrop blur or a mask that reach something shown now, pseudo-elements too
           (the sprint blur is a ::after) */
        const rules = [];
        const walk = (list) => {
          for (const r of list) {
            if (r.cssRules && !r.selectorText) walk(r.cssRules);
            if (!r.selectorText || !r.style) continue;
            const f = [
              "filter",
              "backdrop-filter",
              "mask-image",
              "mix-blend-mode",
            ].filter((n) => {
              const v = r.style.getPropertyValue(n);
              return v && v !== "none" && v !== "normal";
            });
            if (!f.length) continue;
            let sel = r.selectorText.replace(/::?(after|before)\b/g, "");
            try {
              const hit = [...document.querySelectorAll(sel)].filter((e) => {
                const b = e.getBoundingClientRect();
                return (
                  b.width &&
                  b.height &&
                  getComputedStyle(e).visibility !== "hidden"
                );
              }).length;
              if (hit)
                rules.push(
                  `  ${r.selectorText.slice(0, 80)} {${f.join(", ")}} on ${hit}`,
                );
            } catch {}
          }
        };
        for (const sh of document.styleSheets)
          try {
            walk(sh.cssRules);
          } catch {}
        by[
          "(rules with a filter, blur, mask or blend that reach what shows)\n" +
            rules.join("\n")
        ] = { n: 0, area: 0, fx: {} };
        return Object.entries(by)
          .filter(([k]) => !k.startsWith("(rules"))
          .sort((a, b) => b[1].area - a[1].area)
          .slice(0, 40)
          .concat(Object.entries(by).filter(([k]) => k.startsWith("(rules")))
          .map(
            ([k, o]) =>
              `${k} x${o.n} ${o.area}k px${
                Object.keys(o.fx).length
                  ? ", " +
                    Object.entries(o.fx)
                      .map(([n, c]) => `${c} ${n}`)
                      .join(" ")
                  : ""
              }`,
          )
          .join("\n");
      }),
    );
  if (RECORD)
    await p.evaluate(() => {
      window.__rec = [{ t: Date.now(), s: window._r.state }];
      window._r.on((s) => window.__rec.push({ t: Date.now(), s }));
    });
  /* the processes' own processor time over the window too (all their threads, the stand-in's helpers with them): less
     swayed than the clock by whatever else the machine runs */
  const bcdp = await b.newBrowserCDPSession();
  const cpu = async () => {
    const { processInfo } = await bcdp.send("SystemInfo.getProcessInfo");
    const by = {};
    for (const q of processInfo)
      by[q.type.toLowerCase()] = (by[q.type.toLowerCase()] || 0) + q.cpuTime;
    return by;
  };
  const cdp = await cx.newCDPSession(p);
  const cpu0 = await cpu();
  await cdp.send("Tracing.start", {
    categories:
      "toplevel,viz,gpu,devtools.timeline,disabled-by-default-devtools.timeline.frame" +
      (process.env.CATS ? "," + process.env.CATS : ""),
    transferMode: "ReturnAsStream",
  });
  await p.waitForTimeout(SECS * 1000);
  const cpu1 = await cpu();
  const done = new Promise((ok) => cdp.once("Tracing.tracingComplete", ok));
  await cdp.send("Tracing.end");
  const { stream } = await done;
  let raw = "";
  for (;;) {
    const r = await cdp.send("IO.read", { handle: stream });
    raw += r.data;
    if (r.eof) break;
  }
  if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, raw); // (the whole trace, to look into by hand)
  if (RECORD) {
    const json = await p.evaluate(() =>
      JSON.stringify({ me: window._r.me, lead: 3000, list: window.__rec }),
    );
    fs.writeFileSync(RECORD, zlib.gzipSync(json));
    console.log(
      `recorded ${SECS} s to ${RECORD}: ${(json.length / 1e6).toFixed(1)} MB of states`,
    );
  }
  const zombies = await p.evaluate(
    () => document.querySelectorAll(".l4z:not(.dead)").length,
  );
  /* the composited layers at the window's end (each one the graphics card draws on its own) */
  const layerN = await new Promise((ok) => {
    const t = setTimeout(() => ok(-1), 5000);
    cdp.once(
      "LayerTree.layerTreeDidChange",
      ({ layers }) => (
        clearTimeout(t),
        ok(layers ? layers.filter((l) => l.drawsContent).length : -1)
      ),
    );
    cdp.send("LayerTree.enable").catch(() => ok(-1));
  });
  await b.close();
  const parsed = JSON.parse(raw),
    ev = parsed.traceEvents || parsed;
  /* the threads: the page's main thread, the GPU process's own two (its main and the compositor's) */
  const names = new Map();
  for (const e of ev)
    if (e.name === "thread_name") names.set(e.pid + ":" + e.tid, e.args.name);
  const tasksOf = (want) =>
    busyOf(
      ev
        .filter(
          (e) =>
            e.ph === "X" &&
            e.dur &&
            /RunTask$/.test(e.name) &&
            want(names.get(e.pid + ":" + e.tid)),
        )
        .map((e) => [e.ts, e.ts + e.dur]),
    );
  if (process.env.THREADS) {
    const per = new Map();
    for (const e of ev)
      if (e.ph === "X" && e.dur && /RunTask$/.test(e.name)) {
        const k = e.pid + " " + names.get(e.pid + ":" + e.tid);
        per.set(k, (per.get(k) || 0) + e.dur / 1000);
      }
    console.log(
      [...per]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 14)
        .map(([k, v]) => `${(v / SECS).toFixed(0)} ms/s ${k}`)
        .join("\n"),
    );
  }
  if (process.env.EVENTS) {
    /* where the time goes, by thread and event name (nested events counted in their parents too) */
    const per = new Map();
    for (const e of ev)
      if (
        e.ph === "X" &&
        e.dur > 0 &&
        !/RunTask$|ThreadControllerImpl/.test(e.name)
      ) {
        const k = `${names.get(e.pid + ":" + e.tid) || e.tid} ${e.name}`;
        per.set(k, (per.get(k) || 0) + e.dur / 1000);
      }
    console.log(
      [...per]
        .sort((a, b) => b[1] - a[1])
        .slice(0, +process.env.EVENTS || 30)
        .map(([k, v]) => `${(v / SECS).toFixed(1)} ms/s ${k}`)
        .join("\n"),
    );
  }
  const main = tasksOf((n) => n === "CrRendererMain"),
    gpu = tasksOf((n) => n === "CrGpuMain" || n === "VizCompositorThread");
  /* the frames: each one the graphics card put on the screen (viz's draw and swap) */
  const swaps = ev
    .filter((e) => e.name === "Display::DrawAndSwap" && e.ph === "X")
    .map((e) => e.ts)
    .sort((a, b) => a - b);
  const fm = [],
    fg = [],
    im = { i: 0 },
    ig = { i: 0 };
  for (let i = 1; i < swaps.length; i++) {
    fm.push(covered(main, swaps[i - 1], swaps[i], im));
    fg.push(covered(gpu, swaps[i - 1], swaps[i], ig));
  }
  const span =
    swaps.length > 1 ? (swaps[swaps.length - 1] - swaps[0]) / 1e6 : SECS;
  /* frames come in bursts (two swaps a few ms apart, then a long wait), so a single frame's time says little: what a
     change saves shows as the busy time over the window per frame put on the screen */
  const n = Math.max(1, swaps.length - 1),
    all = (spans) =>
      covered(spans, swaps[0], swaps[swaps.length - 1], { i: 0 }),
    gaps = swaps.slice(1).map((t, i) => (t - swaps[i]) / 1000);
  return {
    fps: (swaps.length - 1) / span,
    perMain: all(main) / n,
    perGpu: all(gpu) / n,
    gap95: quantile(gaps, 0.95),
    cpuGpu: (1000 * ((cpu1.gpu || 0) - (cpu0.gpu || 0))) / n,
    cpuPage: (1000 * ((cpu1.renderer || 0) - (cpu0.renderer || 0))) / n,
    main: [quantile(fm, 0.5), quantile(fm, 0.95)],
    gpu: [quantile(fg, 0.5), quantile(fg, 0.95)],
    zombies,
    layerN,
    errs,
  };
}

/* two builds compared (B=folder or URL_B): their runs taken in turns, A then B, and each pair's ratio reported. This
   machine's processors are shared with others, so a run's numbers drift with the time; a pair run back to back drifts
   together, and its ratio holds */
async function pairs() {
  const sa = process.env.URL ? null : await serve(),
    sb = process.env.URL_B ? null : await serve(process.env.B),
    ua = process.env.URL || `http://127.0.0.1:${sa.address().port}/`,
    ub = process.env.URL_B || `http://127.0.0.1:${sb.address().port}/`;
  await once(ua); // (warm-up, not counted)
  const rs = [];
  for (let r = 1; r <= RUNS; r++) {
    const a = await once(ua),
      b = await once(ub),
      q = {
        fps: b.fps / a.fps,
        main: b.cpuPage / a.cpuPage,
        gpu: b.cpuGpu / a.cpuGpu,
      };
    rs.push(q);
    console.log(
      `pair ${r}: A ${a.fps.toFixed(1)} fps, page ${a.cpuPage.toFixed(1)} ms, GPU ${a.cpuGpu.toFixed(1)} ms a frame, ${a.layerN} layers | B ${b.fps.toFixed(1)} fps, page ${b.cpuPage.toFixed(1)} ms, GPU ${b.cpuGpu.toFixed(1)} ms, ${b.layerN} layers | B/A fps ${q.fps.toFixed(2)}, page ${q.main.toFixed(2)}, GPU ${q.gpu.toFixed(2)}`,
    );
  }
  const m = (k) =>
      quantile(
        rs.map((q) => q[k]),
        0.5,
      ),
    sp = (k) =>
      (100 *
        (Math.max(...rs.map((q) => q[k])) - Math.min(...rs.map((q) => q[k])))) /
      m(k);
  console.log(
    `B/A over ${RUNS} pairs, median (spread): fps ${m("fps").toFixed(2)} (${sp("fps").toFixed(0)}%), page time a frame ${m("main").toFixed(2)} (${sp("main").toFixed(0)}%), GPU time a frame ${m("gpu").toFixed(2)} (${sp("gpu").toFixed(0)}%)`,
  );
  for (const s of [sa, sb]) if (s) s.close();
}

(async () => {
  if (process.env.B || process.env.URL_B) return pairs();
  const srv = process.env.URL ? null : await serve();
  const url = process.env.URL || `http://127.0.0.1:${srv.address().port}/`;
  const all = [];
  for (let r = 0; r <= RUNS; r++) {
    const o = await once(url);
    if (!r) {
      console.log(
        `warm-up run (not counted: the stand-in's first run in a while is slower): ${o.fps.toFixed(1)} fps`,
      );
      continue;
    }
    all.push(o);
    console.log(
      `run ${r}: ${o.fps.toFixed(1)} fps; busy per frame shown: main thread ${o.perMain.toFixed(1)} ms, GPU process ${o.perGpu.toFixed(1)} ms; one frame's busy time, median and 95th: main ${o.main[0].toFixed(1)} / ${o.main[1].toFixed(1)} ms, GPU ${o.gpu[0].toFixed(1)} / ${o.gpu[1].toFixed(1)} ms; 95th wait between frames ${o.gap95.toFixed(0)} ms; processor time per frame shown: page ${o.cpuPage.toFixed(1)} ms, GPU process ${o.cpuGpu.toFixed(1)} ms; ${o.zombies} zombies up, ${o.layerN} layers drawn` +
        (o.errs.length ? `; errors ${JSON.stringify(o.errs.slice(0, 2))}` : ""),
    );
  }
  const med = (f) => quantile(all.map(f), 0.5),
    spread = (f) => {
      const v = all.map(f),
        m = med(f);
      return m ? (100 * (Math.max(...v) - Math.min(...v))) / m : 0;
    };
  console.log(
    `${MODE} ${MAP}, ${RUNS} runs: median ${med((o) => o.fps).toFixed(1)} fps (spread ${spread((o) => o.fps).toFixed(0)}%), main ${med((o) => o.perMain).toFixed(1)} ms a frame (spread ${spread((o) => o.perMain).toFixed(0)}%), GPU ${med((o) => o.perGpu).toFixed(1)} ms a frame (spread ${spread((o) => o.perGpu).toFixed(0)}%); processor time a frame: page ${med((o) => o.cpuPage).toFixed(1)} ms (spread ${spread((o) => o.cpuPage).toFixed(0)}%), GPU process ${med((o) => o.cpuGpu).toFixed(1)} ms (spread ${spread((o) => o.cpuGpu).toFixed(0)}%)`,
  );
  if (srv) srv.close();
})();
