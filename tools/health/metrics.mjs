/* I want the code to get cleaner, never messier, and I want a number for it (the owner's rule: one module per
   mechanic, modes differ by data). This counts the ways the code drifts, from the baseline in tools/health/baseline.json:
   - modeCompares: `=== "l4dd"` style compares of a mode id (rules in eslint.config.js);
   - nullishNumbers: `?? 5` style hidden defaults (same file);
   - unusedExports and unusedFiles: from tools/unused-exports.mjs;
   - clones: pieces of 50 or more tokens that appear twice (jscpd);
   - bigFiles: each js file over 1,500 lines, with its line count.
   Run: node tools/health/metrics.mjs          prints today's numbers
        node tools/health/metrics.mjs --check  prints only what rose above the baseline and exits 1 (silent when fine)
        node tools/health/metrics.mjs --write  saves today's numbers as the new baseline (do it when a count went down)
   It only reads files. The tools it runs (eslint, jscpd) come through npx at a fixed version. */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baselinePath = join(root, "tools/health/baseline.json");
const ESLINT = "eslint@9.39.5";
const JSCPD = "jscpd@4.3.0";
const run = (cmd, args) =>
  execFileSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 28,
    stdio: ["ignore", "pipe", "ignore"],
  });
// eslint exits 1 when it has errors, and 0 for warnings only; either way its JSON is on stdout
const lint = () => {
  try {
    return run("npx", ["--yes", ESLINT, "-f", "json", "js"]);
  } catch (e) {
    if (e.stdout) return e.stdout;
    throw e;
  }
};

export function measure() {
  const found = JSON.parse(lint());
  let modeCompares = 0,
    nullishNumbers = 0;
  const bigFiles = {};
  for (const f of found)
    for (const m of f.messages) {
      const file = f.filePath.slice(root.length + 1).replaceAll("\\", "/");
      if (m.ruleId === "max-lines")
        bigFiles[file] = Number(m.message.match(/\((\d+)\)/)[1]);
      else if (m.ruleId === "no-restricted-syntax") {
        if (m.message.startsWith("A mode id")) modeCompares++;
        else if (m.message.startsWith("??")) nullishNumbers++;
      }
    }
  const unused = JSON.parse(
    run("node", ["tools/unused-exports.mjs", "--json"]),
  );
  const dir = mkdtempSync(join(tmpdir(), "jscpd-"));
  run("npx", [
    "--yes",
    JSCPD,
    "js",
    "--min-tokens",
    "50",
    "--format",
    "javascript",
    "--reporters",
    "json",
    "--output",
    dir,
    "--silent",
  ]);
  const clones = JSON.parse(
    readFileSync(join(dir, "jscpd-report.json"), "utf8"),
  ).statistics.total.clones;
  return {
    modeCompares,
    nullishNumbers,
    unusedExports: unused.unusedExports.reduce((n, [, l]) => n + l.length, 0),
    unusedFiles: unused.unusedFiles.length,
    clones,
    bigFiles: Object.fromEntries(Object.entries(bigFiles).sort()),
  };
}

// what rose: a count above its baseline, a big file that grew, a new big file
export function rises(now, base) {
  const out = [];
  for (const k of [
    "modeCompares",
    "nullishNumbers",
    "unusedExports",
    "unusedFiles",
    "clones",
  ])
    if (now[k] > base[k]) out.push(`${k}: ${base[k]} -> ${now[k]}`);
  // js/updates.js is the Updates pages' text: it grows by one page every deploy, by design
  const GROWS = new Set(["js/updates.js"]);
  for (const [f, n] of Object.entries(now.bigFiles)) {
    if (GROWS.has(f)) continue;
    const was = base.bigFiles[f];
    if (was === undefined) out.push(`new file over 1500 lines: ${f} (${n})`);
    else if (n > was) out.push(`${f} grew: ${was} -> ${n} lines`);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const now = measure();
  if (process.argv.includes("--write")) {
    writeFileSync(baselinePath, JSON.stringify(now, null, 2) + "\n");
    console.log("baseline written");
  } else if (process.argv.includes("--check")) {
    const out = rises(now, JSON.parse(readFileSync(baselinePath, "utf8")));
    if (out.length) {
      console.log(out.join("\n"));
      process.exit(1);
    }
  } else console.log(JSON.stringify(now, null, 2));
}
