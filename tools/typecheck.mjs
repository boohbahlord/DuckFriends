/* The type checker (the owner's ask, Nov 22 21:54Z: tools that catch mistakes in our lines, logic and not typos).
   TypeScript reads our plain JavaScript (tsconfig.json, nothing is compiled) and finds a call to a function a module
   doesn't have, a wrong number of arguments, a comparison that can never be true, a property that was renamed. The
   game had about 900 such notes on Nov 22, most harmless (objects it can't see the shape of), so this is a ratchet like
   tools/health: tools/health/types-baseline.txt keeps today's notes (file, code and words, without line numbers, so
   moving code doesn't count), and a pull request fails only on a note that isn't there. Each one it prints is new in
   that change. Run: node tools/typecheck.mjs   (--write takes the current notes as the new baseline, after fixing some)
   TypeScript comes through npx at a fixed version. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = join(root, "tools/health/types-baseline.txt");
let out = "";
try {
  out = execFileSync(
    "npx",
    ["--yes", "-p", "typescript@5.9.3", "tsc", "-p", root],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1 << 26,
    },
  );
} catch (e) {
  out = e.stdout || "";
}
const notes = out
  .split("\n")
  .map((l) => l.match(/^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/))
  .filter(Boolean)
  .map(([, file, line, code, words]) => ({
    key: `${file} ${code} ${words}`,
    at: `${file}:${line}`,
  }));
const keys = notes.map((n) => n.key).sort();
if (process.argv.includes("--write")) {
  writeFileSync(BASE, keys.join("\n") + "\n");
  console.log(`${keys.length} notes kept as the baseline`);
  process.exit(0);
}
const left = new Map();
for (const k of readFileSync(BASE, "utf8").split("\n").filter(Boolean))
  left.set(k, (left.get(k) || 0) + 1);
const fresh = [];
for (const n of notes) {
  const c = left.get(n.key) || 0;
  if (c) left.set(n.key, c - 1);
  else fresh.push(n);
}
for (const n of fresh)
  console.log(`types: ${n.at} ${n.key.slice(n.key.indexOf(" ") + 1)}`);
if (fresh.length) process.exit(1);
