/* I want a short map of every js file, so Claude finds the right file without searching the whole repo (the owner's
   rule: read and talk for less). This writes notes/repomap.md: one line per file under its folder, with the line count,
   its job from the file's first comment (about 12 words) and its exported names (8 at most, then "+N").
   tools/stamp.py runs it, so the map never goes stale. Run: node tools/repomap.mjs */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(join(dir, e.name))
      : e.name.endsWith(".js")
        ? [join(dir, e.name)]
        : [],
  );
// the map lists every file and should be about 4,000 tokens (14,000 bytes). Where it is bigger, the jobs get shorter,
// never fewer files
const BUDGET = 14000;
const STEPS = [
  { words: 8, names: 0, min: 0 },
  { words: 6, names: 0, min: 0 },
  { words: 5, names: 0, min: 0 },
  { words: 4, names: 0, min: 0 },
  { words: 3, names: 0, min: 0 },
];

// the job: the title between the dashes of the first comment, else its first sentence, cut to WORDS words
function job(src, WORDS) {
  const m = src.match(/^\s*(?:\/\*+|\/\/)\s*([\s\S]*?)(?:\*\/|\n\s*\n|$)/);
  if (!m) return "";
  let t = m[1]
    .replace(/^\s*\/\/ ?/gm, "")
    .replace(/\s*\n\s*\*?\s*/g, " ")
    .trim();
  const dash = t.match(/^-+\s*(.*?)\s*-{3,}/);
  if (dash) t = dash[1];
  else t = t.replace(/^-+\s*/, "").split(/(?<=[.:;])\s/)[0];
  t = t
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const w = t.split(" ");
  return w.length > WORDS ? w.slice(0, WORDS).join(" ") : t;
}

const strip = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
function exportsOf(src) {
  const s = strip(src),
    out = new Set();
  for (const m of s.matchAll(
    /^export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
  ))
    out.add(m[1]);
  for (const m of s.matchAll(/^export\s+(?:const|let|var)\s+\{([^}]*)\}/gm))
    for (const n of m[1].split(",")) {
      const x = n.split(":").pop().split("=")[0].trim();
      if (x) out.add(x);
    }
  for (const m of s.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const n of m[1].split(",")) {
      const x = n
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (x) out.add(x);
    }
  if (/^export\s+default\b/m.test(s)) out.add("default");
  return [...out];
}

const files = walk(join(root, "js")).sort();
const info = files.map((f) => {
  const src = readFileSync(f, "utf8");
  return {
    dir: dirname(relative(root, f)).replaceAll("\\", "/") + "/",
    base: f.slice(f.lastIndexOf("/") + 1),
    src,
    names: exportsOf(src),
    lines: src.split("\n").length - (src.endsWith("\n") ? 1 : 0),
  };
});
function build({ words, names, min }) {
  const byDir = new Map();
  for (const f of info) {
    if (f.lines < min) continue;
    const shown = f.names.slice(0, names).join(" ");
    const more =
      names && f.names.length > names ? ` +${f.names.length - names}` : "";
    if (!byDir.has(f.dir)) byDir.set(f.dir, []);
    byDir
      .get(f.dir)
      .push(
        `${f.base} ${f.lines} ${job(f.src, words)}${shown ? " | " + shown + more : ""}`,
      );
  }
  let md =
    "# Repo map (made by tools/repomap.mjs; do not edit)\nfile lines job" +
    (names ? " | exports" : "");
  md += min
    ? `. Files under ${min} lines are left out (search for them).\n`
    : "\n";
  for (const [dir, rows] of byDir) md += `\n## ${dir}\n${rows.join("\n")}\n`;
  return md;
}
let md;
for (const step of STEPS) {
  md = build(step);
  if (process.env.REPOMAP_SIZES) console.log(JSON.stringify(step), md.length);
  if (md.length <= BUDGET) break;
}
writeFileSync(join(root, "notes/repomap.md"), md);
console.log(
  `repomap: ${md.length} bytes, ~${Math.round(md.length / 3.5)} tokens`,
);
