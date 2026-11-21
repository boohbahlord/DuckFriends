/* ---------- the command line's text tools ----------
   Each takes (args, stdin, io) and returns what it prints (or { out, code, raw }: code 1 means it didn't work or found
   nothing, raw means no new line at the end). io.input(files, stdin) is the files' text, or what came through | when
   no file is named; io.read and io.write open and save files. They work the way bash's do, with the flags people use
   most; man <command> lists them. */
import { calc, globRe } from "./bash.js";

const fail = (msg) => {
  throw new Error(msg);
};
export const lines = (t) =>
  t === "" || t == null ? [] : String(t).replace(/\n$/, "").split("\n");

/* -abc, -n 5, -n5 and -- (the rest are words); spec: the letters, a : after one that takes a value */
/* the long flags (--append), as the short one with the same meaning; some commands mean other letters by a word */
const LONG = {
  all: "a",
  append: "a",
  groups: "G",
  remove: "r",
  recursive: "r",
  force: "f",
  parents: "p",
  "ignore-case": "i",
  "invert-match": "v",
  count: "c",
  "line-number": "n",
  "word-regexp": "w",
  "only-matching": "o",
  "fixed-strings": "F",
  "files-with-matches": "l",
  quiet: "q",
  silent: "q",
  "extended-regexp": "E",
  regexp: "e",
  reverse: "r",
  "numeric-sort": "n",
  unique: "u",
  "random-sort": "R",
  key: "k",
  "field-separator": "t",
  lines: "n",
  bytes: "c",
  words: "w",
  chars: "m",
  number: "n",
  delimiter: "d",
  fields: "f",
  characters: "c",
  separator: "s",
  width: "w",
  "in-place": "i",
  expression: "e",
  "head-count": "n",
  echo: "e",
  "input-range": "i",
  "equal-width": "w",
  "new-name": "n",
  perms: "p",
  add: "a",
  delete: "d",
  table: "t",
  spaces: "s",
  mathlib: "l",
  "squeeze-repeats": "s",
  "no-newline": "n",
  "only-delimited": "s",
};
const LONG_FOR = {
  wc: { lines: "l", bytes: "c" },
  uniq: { count: "c", repeated: "d", unique: "u" },
  cut: { bytes: "c" },
  tr: { delete: "d" },
  paste: { serial: "s", delimiters: "d" },
};
export function getopt(args, spec, name) {
  const o = {},
    rest = [];
  let i = 0;
  args = args.flatMap((a) => {
    // --word and --word=value: the short flag
    const m = a.match(/^--([a-z][\w-]*)(?:=(.*))?$/);
    if (!m) return [a];
    if (m[1] === "color" || m[1] === "colour") return []; // (colors are always on here)
    const c = (LONG_FOR[name] || {})[m[1]] || LONG[m[1]];
    if (!c || !spec.includes(c))
      fail(
        `✗ ${name}: unrecognized option '--${m[1]}' (man ${name} lists them)`,
      );
    return m[2] !== undefined ? ["-" + c, m[2]] : ["-" + c];
  });
  for (; i < args.length; i++) {
    const a = args[i];
    if (a === "--") {
      i++;
      break;
    }
    if (!/^-[A-Za-z]/.test(a)) {
      rest.push(a);
      continue;
    }
    for (let k = 1; k < a.length; k++) {
      const c = a[k],
        at = spec.indexOf(c);
      if (at < 0)
        fail(`✗ ${name}: invalid option -- '${c}' (man ${name} lists them)`);
      if (spec[at + 1] === ":") {
        const v = a.slice(k + 1) || args[++i];
        if (v === undefined) fail(`✗ ${name}: -${c} needs a value`);
        o[c] = v;
        break;
      }
      o[c] = true;
    }
  }
  rest.push(...args.slice(i));
  return { o, rest };
}
/* head -5 is head -n 5 (but not the -5 in head -n -5) */
const countArgs = (args) =>
  args.flatMap((x, i) =>
    /^-\d+$/.test(x) && !/^-[nc]$/.test(args[i - 1] || "")
      ? ["-n", x.slice(1)]
      : [x],
  );
const num = (v, name, what = "number") => {
  if (!/^[-+]?\d+$/.test(String(v))) fail(`✗ ${name}: ${v}: not a ${what}`);
  return +v;
};
/* 1,3 and 2-4 and 3- (columns or characters) */
function ranges(spec, name) {
  const out = [];
  for (const part of String(spec).split(",")) {
    const m = part.match(/^(\d*)-(\d*)$/);
    if (m) out.push([m[1] ? +m[1] : 1, m[2] ? +m[2] : Infinity]);
    else if (/^\d+$/.test(part) && +part > 0) out.push([+part, +part]);
    else fail(`✗ ${name}: ${spec}: a list like 1,3 or 2-4`);
  }
  return (n) => out.some(([a, b]) => n >= a && n <= b);
}
/* tr's sets: a-z, \n, and [:upper:] [:lower:] [:digit:] [:alpha:] [:space:] [:punct:] */
function trSet(s) {
  const CL = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digit: "0123456789",
    space: " \t\n",
    punct: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
  };
  CL.alpha = CL.upper + CL.lower;
  CL.alnum = CL.alpha + CL.digit;
  s = s
    .replace(
      /\[:(\w+):\]/g,
      (m, k) => CL[k] ?? fail(`✗ tr: [:${k}:]: not a class`),
    )
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i + 1] === "-" && i + 2 < s.length) {
      const a = s.charCodeAt(i),
        b = s.charCodeAt(i + 2);
      if (b < a) fail(`✗ tr: ${s[i]}-${s[i + 2]}: the range goes backwards`);
      for (let c = a; c <= b; c++) out += String.fromCharCode(c);
      i += 2;
    } else out += s[i];
  }
  return [...out];
}
const escapes = (s) =>
  s.replace(
    /\\(n|t|\\|e|a|0|r)/g,
    (m, c) => ({ n: "\n", t: "\t", "\\": "\\", e: "", a: "", 0: "", r: "" })[c],
  );

/* printf's %s %d %i %f %.2f %x %o %c %% with widths (%5s, %-5s, %05d); the pattern repeats while words are left */
function printf(fmt, args) {
  let out = "",
    k = 0;
  const once = () =>
    escapes(fmt).replace(
      /%([-0 +#]*)(\d*)(?:\.(\d+))?([sdifxXoceg%])/g,
      (m, fl, w, pr, c) => {
        if (c === "%") return "%";
        const a = args[k++] ?? "";
        let v;
        if (c === "s") v = pr ? String(a).slice(0, +pr) : String(a);
        else if (c === "c") v = String(a)[0] || "";
        else {
          const n = a === "" ? 0 : Number(a);
          if (isNaN(n)) fail(`✗ printf: ${a}: not a number`);
          v =
            c === "d" || c === "i"
              ? String(Math.trunc(n))
              : c === "x"
                ? Math.trunc(n).toString(16)
                : c === "X"
                  ? Math.trunc(n).toString(16).toUpperCase()
                  : c === "o"
                    ? Math.trunc(n).toString(8)
                    : c === "e"
                      ? n.toExponential(pr ? +pr : 6)
                      : c === "g"
                        ? String(+n.toPrecision(pr ? +pr : 6))
                        : n.toFixed(pr ? +pr : 6);
          if (fl.includes("+") && n >= 0) v = "+" + v;
        }
        const W = +w || 0;
        return v.length >= W
          ? v
          : fl.includes("-")
            ? v.padEnd(W)
            : fl.includes("0") && c !== "s"
              ? v.padStart(W, "0")
              : v.padStart(W);
      },
    );
  do {
    out += once();
  } while (k < args.length && /%[^%]/.test(fmt) && k > 0 && out.length < 20000);
  return out;
}

/* the differences between two lists of lines, in diff's own format (2c2, < old, ---, > new) */
function diffLines(A, B) {
  const n = A.length,
    m = B.length;
  if (n * m > 250000) fail("✗ diff: those files are too long to compare here");
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] =
        A[i] === B[j]
          ? L[i + 1][j + 1] + 1
          : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0,
    j = 0;
  const range = (a, b) => (b - a > 1 ? `${a + 1},${b}` : `${b}`);
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) {
      i++;
      j++;
      continue;
    }
    const i0 = i,
      j0 = j;
    while ((i < n || j < m) && !(i < n && j < m && A[i] === B[j])) {
      if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) i++;
      else j++;
    }
    const del = A.slice(i0, i),
      add = B.slice(j0, j);
    out.push(
      del.length && add.length
        ? `${range(i0, i)}c${range(j0, j)}`
        : del.length
          ? `${range(i0, i)}d${j0}`
          : `${i0}a${range(j0, j)}`,
    );
    out.push(...del.map((l) => "< " + l));
    if (del.length && add.length) out.push("---");
    out.push(...add.map((l) => "> " + l));
  }
  return out;
}

/* sed: s/old/new/flags (g, i, a number, p), y/abc/xyz/, d and p, each with an optional line, $ or /pattern/ in front */
function sedProgram(script) {
  const cmds = [];
  for (const part of script
    .split(/;|\n/)
    .map((x) => x.trim())
    .filter(Boolean)) {
    let s = part,
      addr = null,
      m;
    if ((m = s.match(/^(\d+|\$)(?:,(\d+|\$))?/))) {
      addr = { a: m[1], b: m[2] };
      s = s.slice(m[0].length);
    } else if ((m = s.match(/^\/((?:\\.|[^/])*)\//))) {
      addr = { re: new RegExp(m[1]) };
      s = s.slice(m[0].length);
    }
    s = s.trim();
    if (s[0] === "s" || s[0] === "y") {
      const d = s[1],
        bits = [];
      let cur = "";
      for (let i = 2; i < s.length; i++) {
        if (s[i] === "\\" && s[i + 1] === d) {
          cur += d;
          i++;
        } else if (s[i] === d) {
          bits.push(cur);
          cur = "";
        } else cur += s[i];
      }
      bits.push(cur);
      if (bits.length < 3)
        fail(`✗ sed: ${part}: unterminated \`${s[0]}' command`);
      if (s[0] === "y") {
        if (bits[0].length !== bits[1].length)
          fail("✗ sed: y/…/…/: both sides must be the same length");
        cmds.push({ addr, k: "y", from: bits[0], to: bits[1] });
        continue;
      }
      const fl = bits[2],
        nth = +(fl.match(/\d+/) || [0])[0];
      let re;
      try {
        re = new RegExp(
          bits[0],
          (fl.includes("g") ? "g" : "") + (/[iI]/.test(fl) ? "i" : ""),
        );
      } catch {
        fail(`✗ sed: ${bits[0]}: not a pattern`);
      }
      const rep = bits[1]
        .replace(/\$/g, "$$$$")
        .replace(/\\(\d)/g, "$$$1")
        .replace(/(^|[^\\])&/g, "$1$$&")
        .replace(/\\&/g, "&")
        .replace(/\\n/g, "\n");
      cmds.push({ addr, k: "s", re, rep, nth, p: fl.includes("p") });
    } else if (s === "d" || s === "p" || s === "q") cmds.push({ addr, k: s });
    else fail(`✗ sed: ${part}: unknown command`);
  }
  return cmds;
}
function sed(script, text, quiet) {
  const prog = sedProgram(script),
    L = lines(text),
    out = [];
  const hit = (a, n, line) =>
    !a ||
    (a.re
      ? a.re.test(line)
      : a.b === undefined
        ? a.a === "$"
          ? n === L.length
          : n === +a.a
        : n >= +a.a && (a.b === "$" || n <= +a.b));
  for (let n = 1; n <= L.length; n++) {
    let line = L[n - 1],
      gone = false,
      quit = false;
    for (const c of prog) {
      if (!hit(c.addr, n, line)) continue;
      if (c.k === "d") {
        gone = true;
        break;
      }
      if (c.k === "p") out.push(line);
      if (c.k === "q") {
        quit = true;
        break;
      }
      if (c.k === "y")
        line = [...line]
          .map((ch) => {
            const i = c.from.indexOf(ch);
            return i < 0 ? ch : c.to[i];
          })
          .join("");
      if (c.k === "s") {
        let k = 0;
        const was = line;
        line = c.nth
          ? line.replace(
              new RegExp(
                c.re.source,
                c.re.flags.includes("g") ? c.re.flags : c.re.flags + "g",
              ),
              (...m) =>
                ++k === c.nth
                  ? m[0].replace(
                      new RegExp(c.re.source, c.re.flags.replace("g", "")),
                      c.rep,
                    )
                  : m[0],
            )
          : line.replace(c.re, c.rep);
        if (c.p && line !== was) out.push(line);
      }
    }
    if (!gone && !quiet) out.push(line);
    if (quit) break;
  }
  return out.join("\n");
}

/* awk: pattern { action } pairs, BEGIN and END; actions: print, printf, assignments (= += -= ++ --), next; values:
   $0 $1 … $NF, NR, NF, numbers, "strings", variables (-v name=value), arithmetic, comparisons, ~ /re/, && || !, and
   length(), toupper(), tolower(), substr() */
function awk(src, text, FS, vars) {
  let i = 0;
  const T =
    src.match(
      /"(?:\\.|[^"])*"|\/(?:\\.|[^/])+\/|\d+\.?\d*|[A-Za-z_]\w*|\+\+|--|\+=|-=|\*=|\/=|==|!=|<=|>=|&&|\|\||!~|[-+*/%<>!=~$(){};,]|\n/g,
    ) || [];
  const peek = () => T[i],
    eat = (t) => (T[i] === t ? (i++, true) : false),
    want = (t) => {
      if (!eat(t))
        fail(
          `✗ awk: syntax error near ${T[i] ?? "the end"} (${t} was expected)`,
        );
    };
  const skip = () => {
    while (T[i] === "\n" || T[i] === ";") i++;
  };
  /* expressions become functions of the record */
  const prim = () => {
    const t = T[i++];
    if (t === undefined) fail("✗ awk: something is missing at the end");
    if (t === "(") {
      const e = expr();
      want(")");
      return e;
    }
    if (t === "$") {
      const e = prim();
      return (r) => {
        const k = Math.trunc(+e(r));
        return k === 0 ? r.line : (r.f[k - 1] ?? "");
      };
    }
    if (t === "-") {
      const e = prim();
      return (r) => -e(r);
    }
    if (t === "!") {
      const e = prim();
      return (r) => (truthy(e(r)) ? 0 : 1);
    }
    if (t[0] === '"') {
      const s = escapes(t.slice(1, -1).replace(/\\"/g, '"'));
      return () => s;
    }
    if (t[0] === "/") {
      const re = new RegExp(t.slice(1, -1));
      return (r) => (re.test(r.line) ? 1 : 0);
    }
    if (/^\d/.test(t)) return () => +t;
    if (t === "NR") return (r) => r.nr;
    if (t === "NF") return (r) => r.f.length;
    if (
      ["length", "toupper", "tolower", "substr", "int"].includes(t) &&
      eat("(")
    ) {
      const a = [];
      if (!eat(")")) {
        do a.push(expr());
        while (eat(","));
        want(")");
      }
      return (r) => {
        const v = a.map((f) => f(r)),
          s = String(v[0] ?? r.line);
        return t === "length"
          ? s.length
          : t === "toupper"
            ? s.toUpperCase()
            : t === "tolower"
              ? s.toLowerCase()
              : t === "int"
                ? Math.trunc(+v[0] || 0)
                : s.substr(
                    Math.max(0, (+v[1] || 1) - 1),
                    v[2] === undefined ? undefined : +v[2],
                  );
      };
    }
    if (t === "length") return (r) => r.line.length;
    if (/^[A-Za-z_]/.test(t)) {
      if (T[i] === "++" || T[i] === "--") {
        const d = T[i++] === "++" ? 1 : -1;
        return () => {
          const v = +V[t] || 0;
          V[t] = v + d;
          return v;
        };
      }
      return () => V[t] ?? "";
    }
    fail(`✗ awk: syntax error near ${t}`);
  };
  const truthy = (v) =>
    typeof v === "number" ? v !== 0 : v !== "" && v !== "0";
  const asNum = (v) => +v || 0;
  const mul = () => {
    let e = prim();
    for (;;) {
      const t = peek();
      if (!["*", "/", "%"].includes(t)) return e;
      i++;
      const a = e,
        b = prim();
      e = (r) => {
        const x = asNum(a(r)),
          y = asNum(b(r));
        if (t !== "*" && y === 0) fail("✗ awk: division by zero");
        return t === "*" ? x * y : t === "/" ? x / y : x % y;
      };
    }
  };
  const add = () => {
    let e = mul();
    for (;;) {
      const t = peek();
      if (t !== "+" && t !== "-") return e;
      i++;
      const a = e,
        b = mul();
      e = (r) =>
        t === "+" ? asNum(a(r)) + asNum(b(r)) : asNum(a(r)) - asNum(b(r));
    }
  };
  const cat = () => {
    let e = add();
    while (
      T[i] !== undefined &&
      ![
        "==",
        "!=",
        "<",
        ">",
        "<=",
        ">=",
        "&&",
        "||",
        "~",
        "!~",
        ")",
        ",",
        ";",
        "}",
        "{",
        "\n",
        "=",
        "+=",
        "-=",
        "*=",
        "/=",
      ].includes(T[i])
    ) {
      const a = e,
        b = add();
      e = (r) => String(a(r)) + String(b(r));
    }
    return e;
  };
  const cmp = () => {
    const e = cat(),
      t = peek();
    if (t === "~" || t === "!~") {
      i++;
      const re = T[i++];
      const R = new RegExp(re && re[0] === "/" ? re.slice(1, -1) : re);
      return (r) => (R.test(String(e(r))) === (t === "~") ? 1 : 0);
    }
    if (!["==", "!=", "<", ">", "<=", ">="].includes(t)) return e;
    i++;
    const b = cat();
    return (r) => {
      let x = e(r),
        y = b(r);
      if (!isNaN(+x) && !isNaN(+y) && x !== "" && y !== "") {
        x = +x;
        y = +y;
      }
      return +{
        "==": x == y,
        "!=": x != y,
        "<": x < y,
        ">": x > y,
        "<=": x <= y,
        ">=": x >= y,
      }[t];
    }; // eslint-disable-line eqeqeq
  };
  const and = () => {
    let e = cmp();
    while (eat("&&")) {
      const a = e,
        b = cmp();
      e = (r) => (truthy(a(r)) && truthy(b(r)) ? 1 : 0);
    }
    return e;
  };
  const expr = () => {
    let e = and();
    while (eat("||")) {
      const a = e,
        b = and();
      e = (r) => (truthy(a(r)) || truthy(b(r)) ? 1 : 0);
    }
    return e;
  };
  const V = { ...vars };
  const stmt = () => {
    skip();
    const t = peek();
    if (t === "print" || t === "printf") {
      i++;
      const a = [];
      if (![";", "}", "\n", undefined].includes(peek())) {
        do a.push(expr());
        while (eat(","));
      }
      return (r) => {
        const v = a.map((f) => f(r));
        r.out.push(
          t === "printf"
            ? printf(String(v[0] ?? ""), v.slice(1).map(String)).replace(
                /\n$/,
                "",
              )
            : v.length
              ? v.join(" ")
              : r.line,
        );
      };
    }
    if (t === "next") {
      i++;
      return (r) => {
        r.next = true;
      };
    }
    if (
      /^[A-Za-z_]\w*$/.test(t) &&
      ["=", "+=", "-=", "*=", "/="].includes(T[i + 1])
    ) {
      i++;
      const op = T[i++],
        e = expr();
      return (r) => {
        const v = e(r);
        V[t] =
          op === "="
            ? v
            : op === "+="
              ? asNum(V[t]) + asNum(v)
              : op === "-="
                ? asNum(V[t]) - asNum(v)
                : op === "*="
                  ? asNum(V[t]) * asNum(v)
                  : asNum(V[t]) / asNum(v);
      };
    }
    const e = expr();
    return (r) => {
      e(r);
    };
  };
  const block = () => {
    want("{");
    const ss = [];
    skip();
    while (!eat("}")) {
      if (peek() === undefined) fail("✗ awk: a { isn't closed");
      ss.push(stmt());
      skip();
    }
    return (r) => {
      for (const s of ss) {
        if (r.next) return;
        s(r);
      }
    };
  };
  const rules = [];
  skip();
  while (i < T.length) {
    let pat = null;
    if (eat("BEGIN")) pat = "BEGIN";
    else if (eat("END")) pat = "END";
    else if (peek() !== "{") pat = expr();
    const act = peek() === "{" ? block() : (r) => r.out.push(r.line);
    rules.push({ pat, act });
    skip();
  }
  const out = [],
    L = lines(text),
    split = (line) =>
      FS === " "
        ? line.trim().split(/\s+/).filter(Boolean)
        : line.split(FS.length === 1 ? FS : new RegExp(FS));
  const run = (r, which) => {
    for (const x of rules) if (x.pat === which) x.act(r);
  };
  run({ line: "", f: [], nr: 0, out }, "BEGIN");
  let nr = 0;
  for (const line of L) {
    const r = { line, f: split(line), nr: ++nr, out };
    for (const x of rules) {
      if (x.pat === "BEGIN" || x.pat === "END") continue;
      if (x.pat && !truthy(x.pat(r))) continue;
      x.act(r);
      if (r.next) break;
    }
    if (out.length > 5000) break;
  }
  run({ line: L[L.length - 1] || "", f: [], nr, out }, "END");
  return out.join("\n");
}

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const TEXT = {
  echo: (args) => {
    let n = false,
      e = false,
      k = 0;
    while (k < args.length && /^-[neE]+$/.test(args[k])) {
      for (const c of args[k].slice(1)) {
        if (c === "n") n = true;
        if (c === "e") e = true;
        if (c === "E") e = false;
      }
      k++;
    }
    let t = args.slice(k).join(" ");
    if (e) t = escapes(t);
    return { out: n ? t : t + "\n", raw: true };
  },
  printf: (args) => {
    if (!args.length) fail("✗ printf: usage: printf format [words…]");
    return { out: printf(args[0], args.slice(1)), raw: true };
  },
  cat: (args, stdin, io) => {
    const { o, rest } = getopt(args, "nAs", "cat");
    let L = lines(io.input(rest, stdin));
    if (o.s) L = L.filter((l, i) => l !== "" || L[i - 1] !== "");
    return o.n
      ? L.map((l, i) => `${String(i + 1).padStart(6)}\t${l}`).join("\n")
      : io.input(rest, stdin).replace(/\n$/, "");
  },
  head: (args, stdin, io) => {
    const { o, rest } = getopt(countArgs(args), "n:c:", "head"),
      t = io.input(rest, stdin);
    if (o.c) return { out: t.slice(0, num(o.c, "head")), raw: true };
    return lines(t)
      .slice(0, num(o.n ?? 10, "head"))
      .join("\n"); // -n -5: all but the last 5
  },
  tail: (args, stdin, io) => {
    const { o, rest } = getopt(countArgs(args), "n:c:", "tail"),
      t = io.input(rest, stdin),
      L = lines(t);
    if (o.c) {
      const k = Math.abs(num(o.c, "tail"));
      return { out: k ? t.slice(-k) : "", raw: true };
    }
    const n = String(o.n ?? 10);
    if (n.startsWith("+"))
      return L.slice(Math.max(0, num(n.slice(1), "tail") - 1)).join("\n");
    const k = Math.abs(num(n, "tail"));
    return k === 0 ? "" : L.slice(-k).join("\n"); // -n 5 and -n -5 are the same
  },
  wc: (args, stdin, io) => {
    const { o, rest } = getopt(args, "lwcm", "wc"),
      t = io.input(rest, stdin),
      n = {
        l: (t.match(/\n/g) || []).length + (t && !t.endsWith("\n") ? 1 : 0),
        w: t.split(/\s+/).filter(Boolean).length,
        c: t.length,
      };
    const pick = ["l", "w", "c"].filter((k) => o[k] || (k === "c" && o.m));
    return (
      (pick.length ? pick : ["l", "w", "c"]).map((k) => n[k]).join(" ") +
      (rest.length === 1 ? " " + rest[0] : "")
    );
  },
  sort: (args, stdin, io) => {
    const { o, rest } = getopt(args, "rnufk:t:R", "sort");
    let L = lines(io.input(rest, stdin));
    const key = (l) => {
      if (!o.k) return l;
      const f = num(String(o.k).split(",")[0], "sort", "column"),
        parts = o.t ? l.split(o.t) : l.trim().split(/\s+/);
      return parts.slice(f - 1).join(o.t || " ");
    };
    if (o.R) return shuffle(L).join("\n");
    L.sort((a, b) => {
      const x = key(a),
        y = key(b);
      if (o.n)
        return (
          (parseFloat(x) || 0) - (parseFloat(y) || 0) || a.localeCompare(b)
        );
      return o.f
        ? x.toLowerCase().localeCompare(y.toLowerCase())
        : x < y
          ? -1
          : x > y
            ? 1
            : 0;
    });
    if (o.r) L.reverse();
    if (o.u)
      L = L.filter(
        (l, i) =>
          i === 0 ||
          (o.f ? l.toLowerCase() !== L[i - 1].toLowerCase() : l !== L[i - 1]),
      );
    return L.join("\n");
  },
  uniq: (args, stdin, io) => {
    const { o, rest } = getopt(args, "cdui", "uniq"),
      L = lines(io.input(rest, stdin)),
      runs = [];
    const same = (a, b) =>
      o.i ? a.toLowerCase() === b.toLowerCase() : a === b;
    for (const l of L) {
      const r = runs[runs.length - 1];
      if (r && same(r[0], l)) r[1]++;
      else runs.push([l, 1]);
    }
    return runs
      .filter(([, n]) => (o.d ? n > 1 : o.u ? n === 1 : true))
      .map(([l, n]) => (o.c ? `${String(n).padStart(7)} ${l}` : l))
      .join("\n");
  },
  grep: (args, stdin, io) => {
    const { o, rest: rest0 } = getopt(args, "ivcnwoEFqhlrRe:", "grep");
    const pat = o.e ?? rest0.shift();
    if (pat === undefined)
      fail("✗ grep: usage: grep [-ivcnwor] pattern [file…]");
    const rest =
      o.r || o.R
        ? (rest0.length ? rest0 : ["."]).flatMap((f) => io.files(f))
        : rest0; // -r: every file in the folders
    let src = o.F ? pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : pat;
    if (o.w) src = `\\b(?:${src})\\b`;
    let re;
    try {
      re = new RegExp(src, o.i ? "gi" : "g");
    } catch {
      fail(`✗ grep: ${pat}: not a pattern`);
    }
    const files = rest.length ? rest : o.r || o.R ? [] : [null],
      many = (files.length > 1 || o.r || o.R) && !o.h,
      out = [];
    let count = 0;
    for (const f of files) {
      let k = 0;
      lines(f === null ? stdin : io.read(f)).forEach((l, n) => {
        re.lastIndex = 0;
        const hit = re.test(l) !== !!o.v;
        if (!hit) return;
        k++;
        count++;
        if (o.c || o.q || o.l) return;
        const pre = (many ? f + ":" : "") + (o.n ? n + 1 + ":" : "");
        if (o.o && !o.v) {
          re.lastIndex = 0;
          for (const m of l.matchAll(re)) out.push(pre + m[0]);
        } else out.push(pre + l);
      });
      if (o.c) out.push((many ? f + ":" : "") + k);
      if (o.l && k) out.push(f ?? "(standard input)");
    }
    return { out: o.q ? "" : out.join("\n"), code: count ? 0 : 1 };
  },
  cut: (args, stdin, io) => {
    const { o, rest } = getopt(args, "d:f:c:s", "cut");
    if (!o.f && !o.c)
      fail("✗ cut: you must say -f (columns) or -c (characters)");
    const keep = ranges(o.f || o.c, "cut"),
      d = o.d ?? "\t";
    return lines(io.input(rest, stdin))
      .map((l) => {
        if (o.c) return [...l].filter((c, i) => keep(i + 1)).join("");
        if (!l.includes(d)) return o.s ? null : l;
        return l
          .split(d)
          .filter((x, i) => keep(i + 1))
          .join(d);
      })
      .filter((l) => l !== null)
      .join("\n");
  },
  tr: (args, stdin) => {
    const { o, rest } = getopt(args, "dsc", "tr");
    if (!rest.length || (!o.d && !o.s && rest.length < 2))
      fail("✗ tr: usage: tr [-ds] set1 [set2]");
    const A = trSet(rest[0]),
      B = rest[1] !== undefined ? trSet(rest[1]) : [];
    let t = [...stdin]
      .map((c) => {
        const k = A.indexOf(c);
        if (o.d) return k < 0 ? c : "";
        if (k < 0 || !B.length) return c;
        return B[Math.min(k, B.length - 1)];
      })
      .join("");
    if (o.s) {
      const S = new Set(B.length ? B : A);
      t = [...t].filter((c, i, a) => !(S.has(c) && a[i - 1] === c)).join("");
    }
    return { out: t, raw: true };
  },
  sed: (args, stdin, io) => {
    const { o, rest } = getopt(args, "ne:iE", "sed");
    const script = o.e ?? rest.shift();
    if (script === undefined)
      fail("✗ sed: usage: sed [-n] [-i] 's/old/new/g' [file]");
    if (o.i) {
      if (!rest.length) fail("✗ sed -i: which file?");
      for (const f of rest) {
        const t = sed(script, io.read(f), o.n);
        io.write(f, t ? t + "\n" : "", false);
      }
      return "";
    }
    return sed(script, io.input(rest, stdin), o.n);
  },
  awk: (args, stdin, io) => {
    const { o, rest } = getopt(args, "F:v:", "awk"),
      vars = {};
    for (const k of [].concat(o.v || [])) {
      const m = String(k).match(/^(\w+)=(.*)$/);
      if (m) vars[m[1]] = m[2];
    }
    const prog = rest.shift();
    if (prog === undefined)
      fail("✗ awk: usage: awk [-F sep] '{print $1}' [file]");
    return awk(prog, io.input(rest, stdin), o.F ? escapes(o.F) : " ", vars);
  },
  rev: (args, stdin, io) =>
    lines(io.input(args, stdin))
      .map((l) => [...l].reverse().join(""))
      .join("\n"),
  tac: (args, stdin, io) => lines(io.input(args, stdin)).reverse().join("\n"),
  nl: (args, stdin, io) => {
    const { rest } = getopt(args, "ba", "nl");
    let k = 0;
    return lines(io.input(rest, stdin))
      .map((l) => (l.trim() ? `${String(++k).padStart(6)}\t${l}` : ""))
      .join("\n");
  },
  fold: (args, stdin, io) => {
    const { o, rest } = getopt(args, "w:s", "fold"),
      W = num(o.w ?? 80, "fold");
    if (W < 1) fail("✗ fold: -w 1 or more");
    return lines(io.input(rest, stdin))
      .flatMap((l) => {
        const out = [];
        while (l.length > W) {
          let k = W;
          if (o.s) {
            const sp = l.lastIndexOf(" ", W - 1);
            if (sp > 0) k = sp + 1;
          }
          out.push(l.slice(0, k));
          l = l.slice(k);
        }
        out.push(l);
        return out;
      })
      .join("\n");
  },
  column: (args, stdin, io) => {
    const { o, rest } = getopt(args, "ts:", "column"),
      L = lines(io.input(rest, stdin));
    if (!o.t) return L.join("  ");
    const rows = L.map((l) => (o.s ? l.split(o.s) : l.trim().split(/\s+/))),
      w = [];
    for (const r of rows)
      r.forEach((c, i) => {
        w[i] = Math.max(w[i] || 0, c.length);
      });
    return rows
      .map((r) =>
        r.map((c, i) => (i === r.length - 1 ? c : c.padEnd(w[i]))).join("  "),
      )
      .join("\n");
  },
  seq: (args) => {
    const { o, rest } = getopt(args, "s:w", "seq");
    const n = rest.map((v) => {
      if (isNaN(+v) || v === "") fail(`✗ seq: ${v}: not a number`);
      return +v;
    });
    if (!n.length) fail("✗ seq: usage: seq [first [step]] last");
    const [a, s, b] =
      n.length === 1 ? [1, 1, n[0]] : n.length === 2 ? [n[0], 1, n[1]] : n;
    if (s === 0) fail("✗ seq: the step can't be 0");
    const out = [];
    for (let x = a; s > 0 ? x <= b : x >= b; x += s) {
      out.push(+x.toFixed(10));
      if (out.length > 1000) fail("✗ seq: 1000 numbers at most");
    }
    const w = Math.max(...out.map((x) => String(x).length));
    return out
      .map((x) => (o.w ? String(x).padStart(w, "0") : String(x)))
      .join(o.s !== undefined ? escapes(o.s) : "\n");
  },
  shuf: (args, stdin, io) => {
    const { o, rest } = getopt(args, "n:ei:", "shuf");
    let L;
    if (o.i) {
      const m = String(o.i).match(/^(-?\d+)-(-?\d+)$/);
      if (!m || +m[2] - +m[1] > 1000)
        fail("✗ shuf -i lo-hi (1000 numbers at most)");
      L = [];
      for (let k = +m[1]; k <= +m[2]; k++) L.push(String(k));
    } else L = o.e ? rest : lines(io.input(rest, stdin));
    L = shuffle([...L]);
    return (o.n !== undefined ? L.slice(0, num(o.n, "shuf")) : L).join("\n");
  },
  expr: (args) => {
    if (!args.length) fail("✗ expr: usage: expr 3 + 4 (\\* for times)");
    if (args[0] === "length") return String((args[1] || "").length);
    if (args[0] === "substr")
      return String(args[1] || "").substr(Math.max(0, +args[2] - 1), +args[3]);
    let v;
    if (
      args.length === 3 &&
      ["=", "!=", "<", ">", "<=", ">="].includes(args[1]) &&
      (isNaN(+args[0]) || isNaN(+args[2]))
    ) {
      const [x, op, y] = args;
      v = +{
        "=": x === y,
        "!=": x !== y,
        "<": x < y,
        ">": x > y,
        "<=": x <= y,
        ">=": x >= y,
      }[op];
    } else if (args.length === 3 && args[1] === ":") {
      const m = String(args[0]).match(new RegExp("^(?:" + args[2] + ")"));
      v = m ? (m[1] !== undefined ? m[1] : m[0].length) : 0;
    } else {
      for (const a of args)
        if (
          !/^-?\d+$/.test(a) &&
          ![
            "+",
            "-",
            "*",
            "/",
            "%",
            "(",
            ")",
            "<",
            ">",
            "<=",
            ">=",
            "=",
            "!=",
            "&",
            "|",
          ].includes(a)
        )
          fail(`✗ expr: ${a}: not a number`);
      v = calc(
        args
          .map((a) => ({ "=": "==", "&": "&&", "|": "||" })[a] || a)
          .join(" "),
      );
    }
    return { out: String(v), code: v === 0 || v === "" ? 1 : 0 };
  },
  bc: (args, stdin, io) => {
    const { o, rest } = getopt(args, "lq", "bc");
    let scale = o.l ? 20 : 0;
    const V = {},
      out = [];
    for (const l of lines(
      rest.length ? rest.map((f) => io.read(f)).join("\n") : stdin,
    ).flatMap((x) => x.split(";"))) {
      const s = l.trim();
      if (!s || s === "quit") continue;
      const m = s.match(/^([a-z_]\w*)\s*=\s*(.+)$/i);
      if (m && m[1] === "scale") {
        scale = Math.max(0, Math.min(20, Math.trunc(calc(m[2], (n) => V[n]))));
        continue;
      }
      const v = calc(
        (m ? m[2] : s).replace(/\^/g, "**"),
        (n) => (n === "scale" ? scale : (V[n] ?? 0)),
        { int: false, scale },
      );
      if (m) V[m[1]] = v;
      else out.push(String(scale ? +v.toFixed(scale) : Math.trunc(v)));
    }
    return out.join("\n");
  },
  diff: (args, stdin, io) => {
    const { rest } = getopt(args, "uq", "diff");
    if (rest.length !== 2) fail("✗ diff: usage: diff file1 file2");
    const A = lines(rest[0] === "-" ? stdin : io.read(rest[0])),
      B = lines(rest[1] === "-" ? stdin : io.read(rest[1])),
      d = diffLines(A, B);
    return { out: d.join("\n"), code: d.length ? 1 : 0 };
  },
  basename: (args) => {
    if (!args[0]) fail("✗ basename: usage: basename path [ending]");
    let b = args[0].replace(/\/+$/, "").split("/").pop() || "/";
    if (args[1] && b.endsWith(args[1]) && b !== args[1])
      b = b.slice(0, -args[1].length);
    return b;
  },
  dirname: (args) => {
    if (!args[0]) fail("✗ dirname: usage: dirname path");
    const p = args[0].replace(/\/+$/, ""),
      k = p.lastIndexOf("/");
    return k < 0 ? "." : k === 0 ? "/" : p.slice(0, k);
  },
  yes: (args) => ({
    out: Array(100)
      .fill(args.length ? args.join(" ") : "y")
      .join("\n"),
    err: "(yes stops at 100 lines here)",
    code: 0,
  }),
  paste: (args, stdin, io) => {
    // paste [-s] [-d chars] files: their lines side by side (- is what came in)
    const { o, rest } = getopt(args, "sd:", "paste"),
      d =
        o.d === undefined
          ? "\t"
          : String(o.d).replace(/\\t/g, "\t").replace(/\\n/g, "\n") || "",
      files = rest.length ? rest : ["-"];
    const cols = files.map((f) => lines(f === "-" ? stdin : io.read(f))),
      join = (row) =>
        row.reduce(
          (a, w, k) => (k ? a + (d ? d[(k - 1) % d.length] : "") + w : w),
          "",
        );
    if (o.s) return cols.map(join).join("\n");
    const n = Math.max(0, ...cols.map((c) => c.length));
    return Array.from({ length: n }, (_, r) =>
      join(cols.map((c) => c[r] ?? "")),
    ).join("\n");
  },
  tee: (args, stdin, io) => {
    const { o, rest } = getopt(args, "a", "tee");
    for (const f of rest) io.write(f, stdin, !!o.a);
    return { out: stdin, raw: true };
  },
};
TEXT.less = TEXT.more = TEXT.cat;
export { globRe };
