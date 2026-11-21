/* I want a name that is used and never defined to fail the check before it reaches the owner (a deleted constant that
   another line still read threw a ReferenceError only when that line ran). This runs ESLint's no-undef over js/ (modules,
   no config, so no browser names are known), then asks the browser itself which of the names it has (window, document,
   Image, scheduler …). Any name neither the file nor the browser knows fails, with a place it is used. */
const { spawnSync } = require("child_process");
const path = require("path");
const { chromium } = require("playwright");
const { url, fail } = require("./lib.cjs");
const ROOT = path.resolve(__dirname, "../..");
(async () => {
  const r = spawnSync(
    "npx",
    [
      "--yes",
      "eslint@9.39.5",
      "--no-config-lookup",
      "--rule",
      '{"no-undef":"error"}',
      "-f",
      "json",
      "js",
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 },
  );
  let files;
  try {
    files = JSON.parse(r.stdout);
  } catch {
    return fail("eslint gave no result: " + (r.stderr || "").slice(-200));
  }
  const where = new Map();
  for (const f of files)
    for (const m of f.messages) {
      if (m.fatal) fail(`${path.relative(ROOT, f.filePath)}: ${m.message}`);
      const n = m.ruleId === "no-undef" && /'(.+?)'/.exec(m.message);
      if (n && !where.has(n[1]))
        where.set(n[1], `${path.relative(ROOT, f.filePath)}:${m.line}`);
    }
  const b = await chromium.launch(),
    p = await b.newPage();
  await p.goto(url);
  const known = await p.evaluate(
    (names) => names.filter((n) => n in globalThis),
    [...where.keys()],
  );
  await b.close();
  for (const [n, at] of where)
    if (!known.includes(n)) fail(`${n} is used and never defined (${at})`);
})();
