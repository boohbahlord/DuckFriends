/* I want one command that says whether the game is fit to deploy (the owner's rule: one check command before every
   deploy, across every mode, map and menu, phone and computer; red means no deploy). It serves this folder on a free
   port, runs every tools/check/*.cjs test one after another in the browser, then the code health ratchet
   (tools/health/metrics.mjs --check). It prints one line for each failure only, and at the end "all green" and the
   time. Exit 1 on any failure. Run: node tools/check/run.mjs   (one test only: node tools/check/run.mjs gm)
   Needs Playwright with Chromium (require('playwright')). A test fails by calling fail() from tools/check/lib.cjs. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const here = join(root, "tools/check");
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webmanifest": "application/manifest+json",
};
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) throw new Error("outside");
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const url = `http://localhost:${server.address().port}/`;

const TIMEOUT = 5 * 60 * 1000;
const run = (cmd, args) =>
  new Promise((done) => {
    const p = spawn(cmd, args, {
      cwd: root,
      env: { ...process.env, CHECK_URL: url },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "",
      err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => p.kill("SIGKILL"), TIMEOUT);
    p.on("close", (code, sig) => {
      clearTimeout(timer);
      done({ code, sig, out, err });
    });
  });

const only = process.argv.slice(2);
const tests = (await readdir(here))
  .filter((f) => f.endsWith(".cjs") && f !== "lib.cjs")
  .map((f) => f.slice(0, -4))
  .filter((n) => !only.length || only.includes(n))
  .sort();
const t0 = Date.now();
let failed = 0;
const say = (name, msg) => {
  failed++;
  console.log(`${name}: ${msg}`);
};
for (const name of tests) {
  const r = await run("node", [join(here, name + ".cjs")]);
  const fails = r.err.split("\n").filter((l) => l.startsWith("FAIL "));
  if (fails.length) for (const l of fails) say(name, l.slice(5));
  else if (r.sig) say(name, `killed (${r.sig}, over ${TIMEOUT / 1000} s)`);
  else if (r.code) {
    const why = (r.err.trim().split("\n").filter(Boolean).at(-1) || "").slice(
      0,
      200,
    );
    say(name, `exit ${r.code} ${why}`);
  }
}
if (!only.length) {
  const h = await run("node", ["tools/health/metrics.mjs", "--check"]);
  if (h.code || h.out.trim())
    for (const l of (
      h.out.trim() || "metrics failed " + h.err.trim().slice(-150)
    ).split("\n"))
      say("health", l);
}
server.close();
console.log(
  (failed ? `${failed} failed` : "all green") +
    `, ${Math.round((Date.now() - t0) / 1000)} s`,
);
process.exit(failed ? 1 : 0);
