/* How long each map's black loading screen lasts, and what is fetched or made in the first seconds of play after it.
   node tools/perf/loadtime.cjs   env: SCENES (cabin,downpour,surv,mgj,hang,board), SLOW (cpu slowdown, 1), PLAY (s, 10),
   PHONE (1: a phone)
   Each scene runs cold (a new browser profile: nothing cached, no Cache Storage) and then warm (the page loaded again in
   the same profile). The rule (the owner's, Nov 20 20:46Z): entering a map loads everything; nothing is fetched or made
   during play. So after the loading screen, every request, worker, canvas, picture and sound made is listed. */
const { chromium, devices } = require("playwright");
const http = require("http"),
  fs = require("fs"),
  path = require("path");

const ROOT = path.resolve(__dirname, "../.."),
  SLOW = +process.env.SLOW || 1,
  PLAY = +(process.env.PLAY || 10),
  SCENES = (process.env.SCENES || "cabin,downpour,surv,mgj,hang,board").split(
    ",",
  );
const ALL = {
  cabin: { mode: "l4dd", map: "cabin", l4map: "cabin" },
  downpour: { mode: "l4dd", map: "cabin", l4map: "downpour" },
  surv: { mode: "surv", map: "cabin", l4map: "downpour" },
  mgj: { mode: "mgj", map: "board" },
  hang: { mode: "hang", map: "cabin" },
  board: { mode: "aod", map: "board" },
};
const TYPES = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};
function serve() {
  return new Promise((ok) => {
    const s = http
      .createServer((q, r) => {
        const f = path.join(
          ROOT,
          decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"),
        );
        fs.readFile(f, (e, d) => {
          if (e) {
            r.writeHead(404);
            return r.end();
          }
          r.writeHead(200, {
            "content-type":
              TYPES[path.extname(f)] || "application/octet-stream",
            "cache-control": "max-age=3600", // (as a web host would: the warm run takes them from the cache)
          });
          r.end(d);
        });
      })
      .listen(0, () => ok(s));
  });
}
/* counted in the page from the moment the loading screen goes: what's made (canvases, pictures, object urls, sounds
   decoded, bitmaps) and what pxdom turns into pixels (an svg getting data-px) */
const HOOKS = () => {
  const c = (window.__made = {});
  window.__play = false;
  const add = (k) => window.__play && (c[k] = (c[k] || 0) + 1);
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...a) {
    const tag = String(t).toLowerCase();
    if (tag === "canvas" || tag === "img" || tag === "audio") add("new " + tag);
    return ce.call(this, t, ...a);
  };
  const I = window.Image;
  window.Image = function (...a) {
    add("new Image");
    return new I(...a);
  };
  window.Image.prototype = I.prototype;
  const ou = URL.createObjectURL;
  URL.createObjectURL = function (...a) {
    add("createObjectURL");
    return ou.apply(this, a);
  };
  if (window.createImageBitmap) {
    const cb = window.createImageBitmap;
    window.createImageBitmap = function (...a) {
      add("createImageBitmap");
      return cb.apply(this, a);
    };
  }
  for (const A of [window.AudioContext, window.OfflineAudioContext].filter(
    Boolean,
  )) {
    const d = A.prototype.decodeAudioData;
    A.prototype.decodeAudioData = function (...a) {
      add("decodeAudioData");
      return d.apply(this, a);
    };
  }
  const tb = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (...a) {
    add("canvas.toBlob");
    return tb.apply(this, a);
  };
  const du = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...a) {
    add("canvas.toDataURL");
    return du.apply(this, a);
  };
  /* the loading screen: when it comes up and when it goes */
  addEventListener("DOMContentLoaded", () => {
    new MutationObserver(() => {
      const v = document.querySelector(".veil");
      if (!v || !window.__asked || document.body.dataset.screen !== "game")
        return; // (the game's own loading screen: not the page's first one, nor the countdown's)
      const t = performance.now();
      if (v.classList.contains("loading") && v.dataset.on && !window.__lt0)
        window.__lt0 = t;
      if (window.__lt0 && !window.__lt1) {
        /* what the loading screen says is loading, each time it changes (s into the loading screen) */
        const w = (v.querySelector(".veil-what") || {}).textContent || "";
        const L = (window.__what ||= []);
        if (!L.length || L[L.length - 1][1] !== w)
          L.push([((t - window.__lt0) / 1000).toFixed(1), w]);
      }
      if (window.__lt0 && !v.dataset.on && !window.__lt1) {
        window.__lt1 = t;
        window.__play = true;
      }
    }).observe(document.body, {
      attributes: true,
      subtree: true,
      characterData: true,
      childList: true,
      attributeFilter: ["class", "data-on", "data-screen"],
    });
    new MutationObserver((ls) => {
      for (const m of ls)
        if (m.target.hasAttribute && m.target.hasAttribute("data-px"))
          add("pxdom picture made");
    }).observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-px"],
    });
  });
};

async function once(cx, url, sc, b) {
  const p = await cx.newPage();
  const errs = [],
    reqs = [],
    workers = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(HOOKS);
  const cdp = await cx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: SLOW });
  let playing = false,
    playAt = 0;
  p.on(
    "request",
    (q) =>
      playing &&
      reqs.push([
        q.url().replace(url, "").split("?")[0],
        (Date.now() - playAt) / 1000,
      ]),
  );
  p.on("worker", (w) => playing && workers.push(w.url().replace(url, "")));
  const t0 = Date.now();
  await p.goto(url);
  await p.waitForFunction(() => !!document.querySelector(".screen"), null, {
    timeout: 120000,
  });
  await p.waitForTimeout(1500);
  const opened = Date.now() - t0;
  await p.evaluate(async (o) => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 3 });
    window._r = r;
    r.send({
      t: "options",
      options: { modePick: "host", mapPick: "host", botWait: 1, ...o },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    window.__lt0 = window.__lt1 = 0;
    window.__asked = performance.now();
    r.send({ t: "start" });
  }, sc);
  if (process.env.PROFILE) {
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 1000 });
    await p.waitForFunction(() => window.__lt0, null, {
      timeout: 300000,
      polling: 50,
    });
    await cdp.send("Profiler.start");
    await b.startTracing(p, {
      categories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "v8",
        "blink",
      ],
    });
  }
  await p.waitForFunction(() => window.__lt1, null, {
    timeout: 300000,
    polling: 100,
  });
  if (process.env.PROFILE) {
    const { profile: prof } = await cdp.send("Profiler.stop");
    /* the browser's own steps on the page's main thread (ms in the loading screen) */
    const tr = JSON.parse((await b.stopTracing()).toString()),
      ev = tr.traceEvents || tr,
      th = ev.find(
        (e) => e.name === "thread_name" && e.args.name === "CrRendererMain",
      ),
      steps = new Map();
    for (const e of ev)
      if (
        th &&
        e.pid === th.pid &&
        e.tid === th.tid &&
        e.ph === "X" &&
        e.dur &&
        /^[A-Z]/.test(e.name) &&
        !/RunTask|ThreadController|Scheduler|TaskQueue/.test(e.name)
      )
        steps.set(e.name, (steps.get(e.name) || 0) + e.dur / 1000);
    console.log(
      "  steps: " +
        [...steps]
          .sort((a, c) => c[1] - a[1])
          .slice(0, 16)
          .map(([k, ms]) => `${k} ${ms.toFixed(0)}`)
          .join(", "),
    );
    /* own time by function, and by file */
    const node = new Map(prof.nodes.map((n) => [n.id, n])),
      self = new Map(),
      byFile = new Map();
    prof.samples.forEach((id, i) => {
      const c = node.get(id).callFrame,
        dt = (prof.timeDeltas[i] || 0) / 1000,
        f = c.url
          ? c.url.split("/").pop().split("?")[0]
          : "(" + (c.functionName || "native") + ")",
        k = `${c.functionName || "(anonymous)"} ${f}:${c.lineNumber + 1}`;
      if (c.functionName === "(idle)") return;
      self.set(k, (self.get(k) || 0) + dt);
      byFile.set(f, (byFile.get(f) || 0) + dt);
    });
    const top = (m, n) =>
      [...m]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([k, ms]) => `${ms.toFixed(0)} ms ${k}`);
    console.log("  by file: " + top(byFile, 12).join(", "));
    console.log("  by function:\n    " + top(self, 20).join("\n    "));
  }
  playing = true;
  playAt = Date.now();
  const [lt0, lt1, asked] = await p.evaluate(() => [
    window.__lt0,
    window.__lt1,
    window.__asked,
  ]);
  await p.waitForTimeout(PLAY * 1000);
  playing = false;
  const made = await p.evaluate(() => window.__made),
    what = await p.evaluate(() =>
      (window.__what || []).map(([t, w]) => `${t} ${w}`).join(", "),
    );
  if (process.env.PXLOG)
    console.log(
      await p.evaluate(() =>
        (window.__pxlog || [])
          .map((k) => k.replace(/[0-9a-f]{6,}/g, "#"))
          .join("\n"),
      ),
    );
  await p.close();
  return {
    opened,
    start: lt0 - asked,
    load: lt1 - lt0,
    reqs,
    workers,
    made,
    errs,
    what,
  };
}

(async () => {
  const srv = await serve(),
    url = `http://127.0.0.1:${srv.address().port}/`,
    b = await chromium.launch();
  const ctxOpts =
    process.env.PHONE === "1"
      ? devices["Pixel 7"]
      : { viewport: { width: 1366, height: 768 } };
  const count = (list) => {
    const m = {};
    for (const x of list) m[x] = (m[x] || 0) + 1;
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => (n > 1 ? `${k} x${n}` : k));
  };
  for (const name of SCENES) {
    const cx = await b.newContext(ctxOpts);
    for (const kind of ["cold", "warm"]) {
      const r = await once(cx, url, ALL[name], b);
      const made = Object.entries(r.made || {}).map(([k, n]) => `${k} x${n}`);
      console.log(
        `${name} ${kind}${SLOW > 1 ? ` (cpu ${SLOW}x)` : ""}: loading screen ${(r.load / 1000).toFixed(1)} s (${(r.start / 1000).toFixed(1)} s after the start); in the first ${PLAY} s of play: ${r.reqs.length} fetched, ${r.workers.length} workers, ${made.length ? made.join(", ") : "nothing made"}${r.errs.length ? `; errors: ${r.errs.slice(0, 2).join(" | ")}` : ""}`,
      );
      if (r.reqs.length) {
        /* by folder: how many, and from when to when (s into play) */
        const by = new Map();
        for (const [u, t] of r.reqs) {
          const k = u.startsWith("blob:")
              ? "blob:"
              : u.split("/").slice(0, -1).join("/") + "/",
            q = by.get(k) || [0, t, t];
          by.set(k, [q[0] + 1, Math.min(q[1], t), Math.max(q[2], t)]);
        }
        console.log(
          "  fetched, by folder: " +
            [...by]
              .sort((a, b) => b[1][0] - a[1][0])
              .map(
                ([k, [n, a, z]]) =>
                  `${k} x${n} (${a.toFixed(1)}-${z.toFixed(1)} s)`,
              )
              .join(", "),
        );
      }
      if (process.env.WHAT) console.log("  the loading screen said: " + r.what);
      if (r.workers.length)
        console.log("  workers: " + count(r.workers).join(", "));
    }
    await cx.close();
  }
  await b.close();
  srv.close();
})();
