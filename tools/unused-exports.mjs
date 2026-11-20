/* I want to know what code nothing uses, so replaced code gets deleted and not left behind (the owner's rule).
   This lists every export in js/ that no file imports, and every js file nothing imports. It only reads files and
   prints: run `node tools/unused-exports.mjs`, add --json for a list a script can read.
   It is a text search, not a parser, so check a name before deleting it:
   - a name used only inside its own file is still listed ("not imported": it could just stop being exported);
   - `import * as X` and `import("./x.js")` (a dynamic import) count the whole file as used, and such files are listed
     apart, with the exports that nothing names, because the code may still pick them by property;
   - the files a page or a tool loads (index.html, tools/*.html, tools/*.mjs, the service worker) count as importers. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const walk = (dir, ok) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === "node_modules" || f.startsWith(".")) return [];
    return statSync(p).isDirectory() ? walk(p, ok) : ok(p) ? [p] : [];
  });
const rel = (p) => relative(root, p).replaceAll("\\", "/");
const strip = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

const jsFiles = walk(join(root, "js"), (p) => p.endsWith(".js"));
const users = [
  ...jsFiles,
  ...walk(join(root, "tools"), (p) => /\.(mjs|cjs|js|html)$/.test(p)),
  ...["index.html", "offline.json", "sw.js", "service-worker.js"]
    .map((f) => join(root, f))
    .filter((p) => {
      try {
        return statSync(p).isFile();
      } catch {
        return false;
      }
    }),
];

const exportsOf = new Map(); // file -> [names]
for (const f of jsFiles) {
  const s = strip(readFileSync(f, "utf8"));
  const names = new Set();
  for (const m of s.matchAll(
    /^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm,
  ))
    names.add(m[1]);
  for (const m of s.matchAll(/^export\s+(?:const|let|var)\s+\{([^}]*)\}/gm))
    for (const n of m[1].split(",")) {
      const x = n.split(":").pop().split("=")[0].trim();
      if (x) names.add(x);
    }
  for (const m of s.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const n of m[1].split(",")) {
      const x = n
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (x) names.add(x);
    }
  if (/^export\s+default\b/m.test(s)) names.add("default");
  exportsOf.set(f, [...names]);
}

const resolveSpec = (from, spec) => {
  if (!spec.startsWith(".")) return null;
  const p = resolve(dirname(from), spec.split("?")[0]);
  return p;
};
const imported = new Map(); // file -> Set of names imported by name
const whole = new Set(); // files used whole (namespace or dynamic import)
const fileUsed = new Set();
const add = (file, name) => {
  fileUsed.add(file);
  if (!imported.has(file)) imported.set(file, new Set());
  imported.get(file).add(name);
};
for (const f of users) {
  const raw = readFileSync(f, "utf8");
  const s = f.endsWith(".js") || f.endsWith(".mjs") ? strip(raw) : raw;
  // import {a, b as c} from "x", import d from "x", import d, {a} from "x", import * as n from "x", export {a} from "x"
  for (const m of s.matchAll(
    /(?:^|[\s;])(?:import|export)\s+([\w$*{}\s,]+?)\s*from\s*["']([^"']+)["']/g,
  )) {
    const file = resolveSpec(f, m[2]);
    if (!file) continue;
    const clause = m[1].trim();
    if (/\*\s*as\s+[\w$]+/.test(clause) || clause === "*") {
      whole.add(file);
      fileUsed.add(file);
      continue;
    }
    const brace = clause.match(/\{([^}]*)\}/);
    if (brace)
      for (const n of brace[1].split(",")) {
        const x = n.trim().split(/\s+as\s+/)[0];
        if (x) add(file, x);
      }
    const def = clause
      .replace(/\{[^}]*\}/, "")
      .replace(/,/g, "")
      .trim();
    if (def) add(file, "default");
  }
  for (const m of s.matchAll(/(?:^|[\s;])import\s*["']([^"']+)["']/g)) {
    const file = resolveSpec(f, m[1]);
    if (file) fileUsed.add(file);
  }
  // import("./x.js") with the names pulled out right there: const { a, b } = await import("./x.js")
  for (const m of s.matchAll(
    /(?:\{([^}]*)\}\s*=\s*)?(?:await\s+)?import\(\s*["']([^"']+)["']\s*\)/g,
  )) {
    const file = resolveSpec(f, m[2]);
    if (!file) continue;
    fileUsed.add(file);
    if (m[1])
      for (const n of m[1].split(",")) add(file, n.split(":")[0].trim());
    else whole.add(file);
  }
  // a path in a page or a list of files ("./js/x.js?v=…" in index.html, offline.json, a service worker)
  if (!/\.(js|mjs|cjs)$/.test(f))
    for (const m of s.matchAll(
      /["'(]\.?\/?(js\/[\w\-./]+\.js)(?:\?[^"')]*)?["')]/g,
    ))
      fileUsed.add(resolve(root, m[1]));
}

const unusedFiles = [],
  unusedExports = [],
  wholeFiles = [];
for (const f of jsFiles) {
  const names = exportsOf.get(f);
  if (!fileUsed.has(f) && !/main\.js$/.test(f)) {
    unusedFiles.push(rel(f));
    continue;
  }
  const used = imported.get(f) || new Set();
  const left = names.filter((n) => !used.has(n));
  if (!left.length) continue;
  if (whole.has(f)) wholeFiles.push([rel(f), left]);
  else unusedExports.push([rel(f), left]);
}

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify({ unusedFiles, unusedExports, wholeFiles }, null, 1),
  );
} else {
  const count = (a) => a.reduce((n, [, l]) => n + l.length, 0);
  console.log(`js files nothing imports (${unusedFiles.length}):`);
  for (const f of unusedFiles) console.log("  " + f);
  console.log(
    `\nexports nothing imports (${count(unusedExports)} in ${unusedExports.length} files):`,
  );
  for (const [f, l] of unusedExports) console.log(`  ${f}: ${l.join(", ")}`);
  console.log(
    `\nin files that are imported whole (namespace or dynamic import), names nothing picks by name (${count(wholeFiles)} in ${wholeFiles.length} files):`,
  );
  for (const [f, l] of wholeFiles) console.log(`  ${f}: ${l.join(", ")}`);
}
