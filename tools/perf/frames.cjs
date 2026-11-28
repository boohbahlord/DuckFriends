/* how busy a frame is, steadily enough to judge a change by (Adam's ask, Nov 21 04:47Z): one busy scene, played the
   same way each time, and from a Chrome trace the main thread's and the graphics card's (the GPU process's) busy time
   in each frame: the median and the 95th percentile, with frames a second.
   The scene: Dead Ducks Arcade on Downpour (or Duck Cabin, or Survival), 3 computers, round 21 by the test command's
   action, every duck kept up (so a run doesn't change with when they go down). Headless Chromium has no graphics card:
   with GPU=1 (the default) it draws with SwiftShader, a stand-in that does the card's work on the processor, so the
   card's share is seen at all.
   node tools/perf/frames.cjs [runs]   env: MAP (downpour|cabin), MODE (l4dd), SECS (the window, 15), GPU (1|0), SLOW (4),
   URL (a running server; without it I serve this folder myself) */
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
  ROUND = +(process.env.ROUND || 21), // (the round the test command jumps to, Dead Ducks Arcade)
  LONG = process.env.LONG, // (the page's long tasks: how many over 16 and 50 ms, and what each is, from a processor profile)
  CSS = process.env.CSS, // (a style added before the window, e.g. one layer hidden, to see what that layer costs)
  BOTS = +(process.env.BOTS || 0), // (computers: none by default, so the zombies crowd my duck the same way every run)
  SLOW = +(process.env.SLOW || 1), // (the processor slowed this many times for the window, as DevTools' CPU throttling: a weaker laptop)
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
          botWait: 1,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
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
      await p.evaluate(
        (ROUND) =>
          window._r.send({ t: "hang", k: "cheat", do: "round", n: ROUND }),
        ROUND,
      ); // (cheat round 21, or ROUND: cheats.js)
    await p.waitForTimeout(12000); // (the zombies in)
  }
  if (cssNow) await p.addStyleTag({ content: cssNow });
  /* WATCH: a css selector; what changes inside those elements during the window (attributes, text, children), counted
     by element and kind, to find what makes a layer paint again */
  if (process.env.WATCH)
    await p.evaluate((sel) => {
      window.__mut = {};
      const name = (n) => {
        const e = n.nodeType === 1 ? n : n.parentElement;
        const one = (x) =>
          x.tagName.toLowerCase() +
          (x.classList[0] ? "." + [...x.classList].slice(0, 2).join(".") : "") +
          (x.dataset && x.dataset.a ? `[data-a=${x.dataset.a}]` : "");
        return e
          ? (e.parentElement ? one(e.parentElement) + " > " : "") + one(e)
          : "?";
      };
      const mo = new MutationObserver((ls) => {
        const add = (k) => (window.__mut[k] = (window.__mut[k] || 0) + 1);
        const props = (t) =>
          new Map(
            (t || "")
              .split(";")
              .map((x) => x.split(":").map((y) => y.trim()))
              .filter((x) => x[0]),
          );
        const first = new Map(); // (each element's value before this batch: several writes in one frame count once)
        for (const m of ls) {
          const k = `${name(m.target)} ${m.type}${m.attributeName ? " " + m.attributeName : ""}`;
          add(k);
          if (m.attributeName !== "style" && m.attributeName !== "class")
            continue;
          const fk = m.attributeName,
            seen = first.get(m.target) || {};
          if (!(fk in seen)) seen[fk] = m.oldValue;
          first.set(m.target, seen);
        }
        /* which style property, which class changed: the value before the batch against the one after it */
        for (const [t, seen] of first) {
          if ("style" in seen) {
            const [a, b] = [props(seen.style), props(t.getAttribute("style"))];
            for (const q of new Set([...a.keys(), ...b.keys()]))
              if (a.get(q) !== b.get(q)) add(`${name(t)} style:${q}`);
          }
          if ("class" in seen) {
            const a = new Set((seen.class || "").split(" "));
            const b = new Set(t.classList);
            for (const c of b) if (c && !a.has(c)) add(`${name(t)} +${c}`);
            for (const c of a) if (c && !b.has(c)) add(`${name(t)} -${c}`);
          }
        }
      });
      for (const el of document.querySelectorAll(sel))
        mo.observe(el, {
          subtree: true,
          attributes: true,
          attributeOldValue: true,
          childList: true,
          characterData: true,
        });
    }, process.env.WATCH);
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
  if (SLOW > 1)
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: SLOW });
  const cpu0 = await cpu();
  if (process.env.RASTER)
    (await cdp.send("DOM.enable"),
      await cdp.send("DOM.getDocument", { depth: 0 }));
  if (LONG) {
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 250 });
    await cdp.send("Profiler.start");
  }
  await cdp.send("Tracing.start", {
    categories:
      "toplevel,viz,gpu,devtools.timeline,disabled-by-default-devtools.timeline.frame" +
      (process.env.CATS ? "," + process.env.CATS : ""),
    transferMode: "ReturnAsStream",
  });
  await p.waitForTimeout(SECS * 1000);
  const cpu1 = await cpu();
  const prof = LONG ? (await cdp.send("Profiler.stop")).profile : null;
  if (prof && process.env.PROFILE)
    fs.writeFileSync(process.env.PROFILE, JSON.stringify(prof)); // (open it in DevTools' Performance panel, or read its lines)
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
  if (process.env.WATCH)
    console.log(
      Object.entries(await p.evaluate(() => window.__mut))
        .sort((a, b) => b[1] - a[1])
        .slice(0, +process.env.TOP || 25)
        .map(([k, n]) => `${(n / SECS).toFixed(1)}/s ${k}`)
        .join("\n"),
    );
  /* the composited layers at the window's end (each one the graphics card draws on its own) */
  let tree = [];
  const layerN = await new Promise((ok) => {
    const t = setTimeout(() => ok(-1), 5000);
    cdp.once(
      "LayerTree.layerTreeDidChange",
      ({ layers }) => (
        clearTimeout(t),
        (tree = layers || []),
        ok(layers ? layers.filter((l) => l.drawsContent).length : -1)
      ),
    );
    cdp.send("LayerTree.enable").catch(() => ok(-1));
  });
  if (process.env.RASTER) {
    /* RASTER (with CATS=cc,disabled-by-default-cc.debug): the layers whose tiles the graphics card rasters again during
       the window, by tiles a second, named by the element that makes them */
    const t = JSON.parse(raw),
      per = new Map();
    for (const e of t.traceEvents || t) {
      const d = e.name === "RasterTask" && e.args && e.args.tileData;
      if (!d) continue;
      const q = per.get(String(d.layerId)) || [0, 0];
      q[0]++;
      q[1] += (e.dur || 0) / 1000; // (its raster time, ms)
      per.set(String(d.layerId), q);
    }
    const allMs = [...per.values()].reduce((a, q) => a + q[1], 0) || 1;
    const byId = new Map(tree.map((l) => [l.layerId, l])),
      rows = [];
    for (const [id, [n, ms]] of [...per]
      .sort((a, b) => b[1][1] - a[1][1])
      .slice(0, 15)) {
      const l = byId.get(id) || {};
      let who = "(gone by the end)";
      if (l.backendNodeId)
        try {
          const { node } = await cdp.send("DOM.describeNode", {
            backendNodeId: l.backendNodeId,
          });
          const at = node.attributes || [],
            ci = at.indexOf("class");
          who =
            node.localName +
            (ci >= 0 ? "." + at[ci + 1].split(" ").slice(0, 3).join(".") : "");
        } catch {}
      else if (l.layerId)
        who =
          "(no element: " +
          (l.parentLayerId ? "a child layer" : "the root") +
          ")";
      rows.push(
        `${(n / SECS).toFixed(1)} tiles/s, ${(ms / SECS).toFixed(1)} ms/s (${((ms / allMs) * 100).toFixed(0)}% of raster): layer ${id} ${l.width | 0}x${l.height | 0} ${who}`,
      );
    }
    console.log(rows.join("\n"));
    console.log(
      `raster in all: ${([...per.values()].reduce((a, q) => a + q[0], 0) / SECS).toFixed(1)} tiles/s, ${(allMs / SECS).toFixed(1)} ms/s`,
    );
  }
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
  if (LONG) longTasks(ev, names, prof);
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
let cssNow = CSS; // (CSS_B: a style for B only, so A and B can be the same folder with one layer hidden in B)
/* LONG: the page's main-thread tasks over 16 ms (a frame at 60) and over 50 ms (a long task), and what's in them: the
   page's own steps (style, layout, paint, garbage collection) from the trace, and the functions that ran, by their own
   time, from the processor profile's samples inside each task */
function longTasks(ev, names, prof) {
  const main = [...names].find(([, n]) => n === "CrRendererMain");
  if (!main) return;
  const [pid, tid] = main[0].split(":").map(Number),
    mine = ev.filter(
      (e) => e.pid === pid && e.tid === tid && e.ph === "X" && e.dur,
    ),
    tasks = mine
      .filter(
        (e) =>
          e.name === "ThreadControllerImpl::RunTask" || e.name === "RunTask",
      )
      .filter((e) => e.dur > 16000);
  /* the samples: when each was taken, and the function it caught (its own time, not its callers') */
  const node = new Map((prof ? prof.nodes : []).map((n) => [n.id, n])),
    at = [];
  const parent = new Map();
  for (const n of prof ? prof.nodes : [])
    for (const c of n.children || []) parent.set(c, n.id);
  if (prof) {
    let t = prof.startTime;
    prof.samples.forEach((id, i) => {
      t += prof.timeDeltas[i];
      const c = node.get(id).callFrame;
      if (c.functionName === "(idle)" || c.functionName === "(program)") return;
      const nm = (f) =>
        `${f.functionName || "(anonymous)"} ${f.url.split("/").pop().split("?")[0]}:${f.lineNumber + 1}`;
      let k = nm(c);
      if (!c.url) {
        /* the browser's own (a size read, a drawImage): named with the game's function that called it */
        let q = parent.get(id);
        while (q && !node.get(q).callFrame.url) q = parent.get(q);
        if (q) k = `${c.functionName} in ${nm(node.get(q).callFrame)}`;
      }
      at.push([t, k]);
    });
  }
  const STEPS = [
      "UpdateLayoutTree",
      "Layout",
      "PrePaint",
      "Paint",
      "Layerize",
      "Commit",
      "MajorGC",
      "MinorGC",
      "ParseHTML",
      "EvaluateScript",
      "Decode Image",
      "HitTest",
    ],
    all = new Map(),
    rows = [];
  for (const k of tasks) {
    const end = k.ts + k.dur,
      steps = {},
      fns = new Map();
    for (const e of mine)
      if (e.ts >= k.ts && e.ts + e.dur <= end && STEPS.includes(e.name))
        steps[e.name] = (steps[e.name] || 0) + e.dur / 1000;
    for (const [t, f] of at)
      if (t >= k.ts && t <= end) {
        fns.set(f, (fns.get(f) || 0) + 0.25);
        all.set(f, (all.get(f) || 0) + 0.25);
      }
    for (const [n, ms] of Object.entries(steps))
      all.set("[" + n + "]", (all.get("[" + n + "]") || 0) + ms);
    rows.push({
      ms: k.dur / 1000,
      steps,
      fns: [...fns].sort((a, b) => b[1] - a[1]).slice(0, 4),
    });
  }
  /* the browser's steps over the whole window, every task, not only the long ones (ms a second) */
  const whole = {};
  for (const e of mine)
    if (STEPS.includes(e.name))
      whole[e.name] = (whole[e.name] || 0) + e.dur / 1000;
  console.log(
    "every task, ms a second: " +
      Object.entries(whole)
        .filter(([, ms]) => ms / SECS >= 0.5)
        .sort((a, b) => b[1] - a[1])
        .map(([n, ms]) => `${n} ${(ms / SECS).toFixed(1)}`)
        .join(", "),
  );
  const n50 = tasks.filter((k) => k.dur > 50000).length;
  console.log(
    `long tasks: ${tasks.length} over 16 ms (${(tasks.length / SECS).toFixed(1)}/s), ${n50} over 50 ms (${(n50 / SECS).toFixed(2)}/s); the longest ${rows.length ? Math.max(...rows.map((r) => r.ms)).toFixed(0) : 0} ms`,
  );
  for (const r of rows.sort((a, b) => b.ms - a.ms).slice(0, 8))
    console.log(
      `  ${r.ms.toFixed(0)} ms: ` +
        Object.entries(r.steps)
          .filter(([, ms]) => ms >= 1)
          .map(([n, ms]) => `${n} ${ms.toFixed(0)}`)
          .join(", ") +
        (r.fns.length
          ? " | " + r.fns.map(([f, ms]) => `${f} ${ms.toFixed(1)}`).join(", ")
          : ""),
    );
  console.log("in all of them, by own time (ms in the window):");
  for (const [f, ms] of [...all].sort((a, b) => b[1] - a[1]).slice(0, 15))
    console.log(`  ${ms.toFixed(1)} ${f}`);
}
async function pairs() {
  const sa = process.env.URL ? null : await serve(),
    sb = process.env.URL_B ? null : await serve(process.env.B),
    ua = process.env.URL || `http://127.0.0.1:${sa.address().port}/`,
    ub = process.env.URL_B || `http://127.0.0.1:${sb.address().port}/`;
  await once(ua); // (warm-up, not counted)
  const rs = [];
  for (let r = 1; r <= RUNS; r++) {
    cssNow = CSS;
    const a = await once(ua);
    cssNow = process.env.CSS_B !== undefined ? CSS + process.env.CSS_B : CSS;
    const b = await once(ub);
    cssNow = CSS;
    const q = {
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
