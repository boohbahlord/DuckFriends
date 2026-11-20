/* The NPC golden runs (row 48: sharing NPC behaviors across modes must change nothing). Each scenario plays a mode with its NPCs
   from a fixed seed and clock and hashes the room every beat; save the hashes before a change, check them after:
     node tools/npc-golden/run.cjs save base.json     (before)
     node tools/npc-golden/run.cjs check base.json    (after: every beat must match)
   A third argument runs only the scenarios named (scenarios.json, or SC=<file>), e.g. surv-soldiers,sb-cabin.
   Needs Playwright with Chromium (NODE_PATH pointing at it if it's installed globally). It serves the repository itself. */
const http = require("http"),
  fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "../.."),
  [, , how = "save", file = "golden.json", only = ""] = process.argv;
const SCENARIOS = require(process.env.SC || "./scenarios.json").filter(
  (s) => !only || only.split(",").includes(s.name),
);
const TYPES = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
const server = http.createServer((q, a) => {
  const f = path.join(
    ROOT,
    decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"),
  );
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory())
    return a.writeHead(404).end();
  a.writeHead(200, {
    "content-type": TYPES[path.extname(f)] || "application/octet-stream",
  });
  fs.createReadStream(f).pipe(a);
});
/* before the page's own scripts: a seeded Math.random, no Worker (the flow fields made in step), and a clock I move */
const INIT = `(() => {
  let a = 1;
  const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const real = Math.random.bind(Math), dn = Date.now.bind(Date), pn = performance.now.bind(performance);
  window.__seed = (n) => { a = n >>> 0; };
  Math.random = () => (window.__fake ? rnd() : real());
  Date.now = () => (window.__fake ? window.__now : dn());
  performance.now = () => (window.__fake ? window.__now - 1.8e12 : pn());
  try { delete window.Worker; } catch {}
  window.Worker = undefined;
})();`;
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port,
    b = await chromium.launch(),
    res = {};
  for (const sc of SCENARIOS) {
    const p = await b.newPage({ viewport: { width: 800, height: 450 } }),
      errs = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
    await p.addInitScript(INIT);
    await p.goto(`http://127.0.0.1:${port}/`);
    await p.waitForTimeout(1500);
    await p.addScriptTag({ path: path.join(__dirname, "page.js") });
    const t0 = Date.now();
    res[sc.name] = await p
      .evaluate((sc) => window.__golden(sc), sc)
      .catch((e) => ({ err: String(e).slice(0, 400) }));
    const r = res[sc.name];
    console.log(
      sc.name,
      r.err ||
        `${r.all.length} beats in ${((Date.now() - t0) / 1000).toFixed(1)} s, at the end ${JSON.stringify(r.seen)}`,
      errs.length ? "page errors: " + errs.join(" | ") : "",
    );
    await p.close();
  }
  await b.close();
  server.close();
  if (how === "save") {
    fs.writeFileSync(file, JSON.stringify(res));
    console.log("saved", file);
    return;
  }
  const base = JSON.parse(fs.readFileSync(file, "utf8"));
  let bad = 0;
  for (const [name, r] of Object.entries(res)) {
    const o = base[name];
    if (!o || r.err || o.err) {
      console.log(
        name,
        "can't compare",
        r.err || o?.err || "(not in " + file + ")",
      );
      bad++;
      continue;
    }
    const n = Math.min(r.all.length, o.all.length),
      at = r.all.findIndex((h, i) => i < n && h !== o.all[i]);
    if (at < 0 && r.all.length === o.all.length) {
      console.log(name, `MATCH: all ${n} beats`);
      continue;
    }
    bad++;
    const parts = Object.keys({ ...r.parts[at], ...o.parts[at] }).filter(
      (k) => r.parts[at][k] !== o.parts[at][k],
    );
    console.log(
      name,
      `DIFFERS from beat ${at} (of ${n}), in: ${parts.join(", ") || "(outside s.hang)"}`,
    );
  }
  process.exit(bad ? 1 : 0);
})();
