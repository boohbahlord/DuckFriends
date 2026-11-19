/* ---------- the published copy of the site, without the comments (the owner's, Nov 19: a slow phone's first load) ----------
   The comments in js/ and css/ are a third of what a player downloads, and they're only for us. So the site that GitHub
   Pages serves is this copy: every file of the repo as it is, except that in js/*.js, sw.js and css/*.css every comment
   is blanked. Each line stays on the line it was (a comment's own line becomes empty), so a file and line in a bug
   report or on the "didn't load" screen still point at the same place in the repo. Nothing else changes: the stamps in
   index.html, offline.json, the pictures, get/. The repo itself keeps every comment, and still runs as it is
   (python3 -m http.server); this is only the copy that goes out. Run by .github/workflows/pages.yml:
     node tools/publish.mjs <folder>     (needs acorn: npm i acorn; NODE_PATH may point at it)
   After blanking, each file's code is checked against the original, token by token: any difference stops the
   publishing, so a mistake here can never reach players. */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const acorn = require("acorn");
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.resolve(process.argv[2] || "_site");

/* a comment's characters out, its line breaks kept */
const blank = (src, ranges) => {
  let out = "",
    at = 0;
  for (const [a, b] of ranges) {
    out += src.slice(at, a) + src.slice(a, b).replace(/[^\n]/g, "");
    at = b;
  }
  return (out + src.slice(at)).replace(/[ \t]+$/gm, ""); // (and the spaces left at a line's end)
};

const OPTS = {
  ecmaVersion: "latest",
  sourceType: "module",
  allowHashBang: true,
};
const tokens = (src) =>
  [...acorn.tokenizer(src, OPTS)].map((t) => [t.type.label, t.value]);
const same = (a, b) =>
  a.length === b.length &&
  a.every((t, i) => t[0] === b[i][0] && String(t[1]) === String(b[i][1]));

function js(src, file) {
  const ranges = [];
  acorn.parse(src, {
    ...OPTS,
    sourceType: file.endsWith("sw.js") ? "script" : "module",
    onComment: (block, text, a, b) => ranges.push([a, b]),
  });
  const out = blank(src, ranges);
  if (!same(tokens(src), tokens(out)))
    throw new Error(`${file}: the code changed while blanking its comments`);
  return out;
}

/* css: strings and url() are skipped as they are, so a slash-star inside one stays */
function css(src, file) {
  const ranges = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) throw new Error(`${file}: a comment that never ends`);
      ranges.push([i, end + 2]);
      i = end + 1;
    }
  }
  const out = blank(src, ranges),
    bare = (s) => {
      let t = s;
      for (const [a, b] of [...ranges].reverse())
        t = t.slice(0, a) + t.slice(b);
      return t.replace(/\s+/g, "");
    };
  if (bare(src) !== out.replace(/\s+/g, ""))
    throw new Error(`${file}: the rules changed while blanking the comments`);
  return out;
}

/* every file the repo keeps (what GitHub Pages served before this) */
const files = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT })
  .toString()
  .split("\0")
  .filter(Boolean);
fs.rmSync(OUT, { recursive: true, force: true });
let before = 0,
  after = 0;
for (const f of files) {
  const from = path.join(ROOT, f),
    to = path.join(OUT, f);
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const code =
    (f.startsWith("js/") && f.endsWith(".js")) || f === "sw.js"
      ? js
      : f.startsWith("css/") && f.endsWith(".css")
        ? css
        : null;
  if (!code) {
    fs.copyFileSync(from, to);
    continue;
  }
  const src = fs.readFileSync(from, "utf8"),
    out = code(src, f);
  fs.writeFileSync(to, out);
  before += Buffer.byteLength(src);
  after += Buffer.byteLength(out);
}
console.log(
  `published ${files.length} files to ${OUT}; js and css ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`,
);
