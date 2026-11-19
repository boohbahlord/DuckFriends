/* ---------- Numberat: files that do things (part C, bible section 14) ----------
   A file is lines of statements: events (when spawn, when hit, when dead, when near duck 3, when touch, every 2s),
   actions (go, attack, flee, wait, say, print), who they're for (me, nearest duck, all zombies, team), named values
   (let), blocks (def, with inputs), loops (for, while), tests (\if …\ and else), percent picks of actions, seed, use,
   give and take. Every value in them is Numberat (numberat.js), so its line rules and principles work there too.
   compileScript() reads a file once into a plan; brain() runs that plan for the game, which hands it a host: what it
   can see (stats, ducks, NPCs, wave, time …) and do (move an NPC, say, print). The plan never touches the game itself,
   so the same file runs the same in the game and in a test.
   Waits don't stop the game: each event runs as a small task that sleeps through its waits (generators). Every loop
   stops after 1,000 rounds with an error, and a task that runs too long without a wait stops too, so a mistake can't
   freeze anything. */
import {
  build,
  lex,
  Parser,
  NbError,
  no,
  num,
  out,
  tenth,
  lineRules,
  judge,
  newCtx,
  NOTHING,
  MOST_TRIES,
  REPLAY,
  NB_STATS,
} from "./numberat.js";

const LOOPS = 1000; // ("Every loop stops after 1,000 rounds with an error")
const BUSY = 20000; // (statements one task may run between two waits)
export { NB_STATS }; // (an NPC's stats: numberat.js reads "z hp" with them)
export const NB_BUILT = ["wave", "time", "alive", "dead", "spawned"];
const EVENTS = ["spawn", "hit", "dead", "touch", "near"];
const KINDS = {
  duck: "duck",
  ducks: "duck",
  zombie: "zombie",
  zombies: "zombie",
  npc: "npc",
  npcs: "npc",
};
const HEADS = new Set([
  "use",
  "let",
  "def",
  "when",
  "every",
  "for",
  "while",
  "go",
  "attack",
  "flee",
  "wait",
  "say",
  "print",
  "stop",
  "seed",
  "give",
  "take",
  "else",
]);
export const NB_RUN_WORDS = [
  ...HEADS,
  ...EVENTS,
  "in",
  "me",
  "nearest",
  "all",
  "team",
  "duck",
  "ducks",
  "zombie",
  "zombies",
  "not",
  "and",
  "or",
  "nand",
  "xor",
  "mod",
  "round",
  "up",
  "down",
  "min",
  "max",
  ...NB_STATS,
  ...NB_BUILT,
];
const STOP = Symbol("stop");
const HELP = {
  run: "help/files.txt",
  who: "help/brains/who.txt",
  if: "help/brains/tests.txt",
  loop: "help/brains/loops.txt",
  text: "help/brains/print.txt",
  names: "help/brains/names.txt",
};

/* ---------- reading a line of statements ----------
   T: the line's pieces with the breaks inside { } blocks kept (sep), so a block's statements can sit one per line; F:
   the same without them, for the values, which run on through breaks while a bracket is open */
class Stmts {
  constructor(toks, R, line, file) {
    this.T = [];
    for (const t of toks) {
      if (t.t === "sp") {
        if (t.soft) this.T.push({ t: "sep", line: t.line });
      } else if (t.t === "op" && t.v === ";")
        this.T.push({ t: "sep", line: t.line });
      else this.T.push(t);
    }
    this.F = [];
    this.map = [];
    this.back = [];
    this.T.forEach((t, k) => {
      this.map[k] = this.F.length;
      if (t.t !== "sep") {
        this.back[this.F.length] = k;
        this.F.push(t);
      }
    });
    this.map[this.T.length] = this.F.length;
    this.back[this.F.length] = this.T.length;
    this.p = 0;
    this.R = R;
    this.line = line;
    this.file = file;
    this.vp = new Parser(this.F, file.prog);
    this.vp.names = file.names;
  }
  peek(o = 0) {
    return this.T[this.p + o];
  }
  word(w, o = 0) {
    const t = this.peek(o);
    return !!t && t.t === "word" && (w == null || t.v === w);
  }
  op(v, o = 0) {
    const t = this.peek(o);
    return !!t && t.t === "op" && t.v === v;
  }
  sep() {
    const t = this.peek();
    return !t || t.t === "sep" || (t.t === "op" && t.v === "}");
  }
  skipSeps() {
    while (this.peek() && this.peek().t === "sep") this.p++;
  }
  want(v, why) {
    if (!this.op(v))
      no(
        why ||
          `Expected "${v}"${this.peek() ? ` before "${this.peek().v}"` : " at the end"}`,
      );
    this.p++;
  }
  name(what) {
    const t = this.peek();
    if (!t || t.t !== "word") no(`${what} needs a name`, HELP.names);
    if (
      HEADS.has(t.v) ||
      NB_BUILT.includes(t.v) ||
      ["t", "f", "true", "false", "me"].includes(t.v)
    )
      no(`"${t.v}" is taken, pick another name`, HELP.names);
    this.p++;
    return t.v;
  }
  /* a Numberat value from here, up to the end of the statement */
  value(opts = {}) {
    let depth = 0,
      k = this.p;
    for (; k < this.T.length; k++) {
      const t = this.T[k];
      if (t.t === "sep" && depth === 0) break;
      if (opts.head && depth === 0 && t.t === "op" && t.v === "{" && k > this.p)
        break; // (when near duck 3 { …: the block)
      if (opts.head && depth === 0 && t.t === "bs" && /^\s*if\b/.test(t.v))
        break;
      if (t.t === "op" && "([{".includes(t.v)) depth++;
      if (t.t === "op" && ")]}".includes(t.v)) {
        if (depth === 0) break; // (the block's own })
        depth--;
      }
      if (
        opts.stopWords &&
        t.t === "word" &&
        depth === 0 &&
        opts.stopWords.includes(t.v) &&
        k > this.p
      )
        break;
    }
    const vp = this.vp;
    vp.i = this.map[this.p];
    vp.end = this.map[k];
    vp.noArrows = !!opts.cmp;
    if (vp.done()) no(`${opts.what || "A value"} is missing`);
    const fn = opts.sum ? vp.sum() : opts.cmp ? vp.choice() : vp.expr(); // (in a test, = isn't naming: == compares)
    this.p = vp.i >= vp.end ? k : this.back[vp.i]; // (all of it read: on at the break, not past it)
    vp.end = null;
    vp.noArrows = false;
    return fn;
  }

  /* ---------- statements ---------- */
  stmt() {
    const t = this.peek(),
      line = (t && t.line) || this.line;
    const s = this.stmt0();
    s.line = line;
    return s;
  }
  stmt0() {
    const t = this.peek();
    if (t.t === "bs" && /^\s*if\b/.test(t.v)) return this.ifStmt();
    if (t.t === "op" && t.v === "(" && this.op("(", 1)) return this.setStmt();
    if (t.t === "op" && t.v === "[" && this.isPick()) return this.pickStmt();
    if (t.t === "op" && t.v === "{") return { k: "block", body: this.block() };
    if (t.t === "word") {
      const w = t.v;
      switch (w) {
        case "use": {
          this.p++;
          const q = this.peek();
          if (!q || (q.t !== "quote" && q.t !== "str"))
            no(`use 'file name' (in single quotes)`, HELP.run);
          this.p++;
          return { k: "use", name: q.v };
        }
        case "let": {
          this.p++;
          const name = this.name("let");
          this.want("=", `let ${name} = a value`);
          this.file.known.add(name);
          return { k: "let", name, v: this.value() };
        }
        case "def": {
          this.p++;
          const name = this.name("def"),
            params = [];
          if (this.op("(")) {
            this.p++;
            while (!this.op(")")) {
              params.push(this.name("An input"));
              if (this.op(",")) this.p++;
              else if (!this.op(")"))
                no(`def ${name}(a, b): inputs are names with commas between`);
            }
            this.p++;
          }
          params.forEach((x) => this.file.known.add(x));
          this.file.defs.add(name);
          return {
            k: "def",
            name,
            params,
            body: this.block(`def ${name} needs its block: { … }`),
          };
        }
        case "when":
          return this.whenStmt();
        case "every": {
          this.p++;
          const v = this.value({
            what: "every's time",
            stopWords: ["s"],
            head: true,
          });
          if (!this.word("s"))
            no(`every needs its seconds: every 2s`, HELP.run);
          this.p++;
          return { k: "every", v, body: this.body() };
        }
        case "for": {
          this.p++;
          const name = this.name("for");
          if (!this.word("in"))
            no(
              `for ${name} in …: a group (all zombies) or a value (1:5)`,
              HELP.loop,
            );
          this.p++;
          this.file.known.add(name);
          const who = this.who(true);
          const over = who || {
            v: this.value({
              what: "for's values",
              head: true,
              stopWords: [...HEADS],
            }),
          };
          return { k: "for", name, over, body: this.body() };
        }
        case "while": {
          this.p++;
          const c = this.peek();
          if (!c || c.t !== "bs")
            no(
              `while \\hp < 5\\ { … }: the test goes between backslashes`,
              HELP.loop,
            );
          this.p++;
          return { k: "while", c: this.cond(c.v, c.line), body: this.body() };
        }
        case "go":
        case "attack":
        case "flee": {
          this.p++;
          const who = this.who(true);
          if (w === "go" && !who) no("go where? go nearest duck", HELP.who);
          return { k: "act", act: w, who };
        }
        case "wait":
          this.p++;
          return {
            k: "wait",
            v: this.value({ what: "wait's seconds", stopWords: ["else"] }),
          };
        case "say":
        case "print":
          this.p++;
          return { k: w, parts: this.text() };
        case "stop":
          this.p++;
          return { k: "stop" };
        case "seed":
          this.p++;
          return { k: "seed", v: this.value({ what: "seed's number" }) };
        case "give":
        case "take": {
          this.p++;
          const name = this.name(w);
          if (w === "take") this.file.known.add(name);
          return { k: w, name };
        }
        case "else":
          no(`else comes after an \\if …\\ on the same line`, HELP.if);
      }
      if (this.file.defs.has(w) || this.file.calls(w)) {
        this.p++;
        const args = [];
        while (!this.sep() && !this.word("else"))
          args.push(this.value({ what: "An input", sum: true }));
        return { k: "call", name: w, args };
      }
    }
    return { k: "value", v: this.value() };
  }
  /* a block { … }, its statements one per line or with ; between */
  block(why) {
    if (!this.op("{")) no(why || "A block starts with {");
    this.p++;
    const body = [];
    for (;;) {
      this.skipSeps();
      if (!this.peek()) no("A { is never closed");
      if (this.op("}")) {
        this.p++;
        return body;
      }
      body.push(this.stmt());
      if (!this.sep() && !this.op("}"))
        no(
          `"${this.peek().v}" doesn't belong here (one statement per line, or ; between)`,
        );
    }
  }
  /* what an event, a loop or a test does: a block, or one statement */
  body() {
    if (this.op("{")) return this.block();
    if (this.sep()) no("Then what? A statement or a { block } goes here");
    return [this.stmt()];
  }
  whenStmt() {
    this.p++;
    const t = this.peek();
    if (!t || t.t !== "word" || !EVENTS.includes(t.v))
      no(
        `when what? ${EVENTS.map((e) => (e === "near" ? "near duck 3" : e)).join(", ")}`,
        HELP.run,
      );
    this.p++;
    const s = { k: "when", ev: t.v, body: null };
    if (t.v === "near") {
      const k = this.peek();
      if (!k || k.t !== "word" || !KINDS[k.v])
        no("when near duck 3 (or near zombie 3)", HELP.run);
      this.p++;
      s.of = KINDS[k.v];
      s.v = this.value({ what: "How near", head: true, stopWords: [...HEADS] });
    }
    s.body = this.body();
    return s;
  }
  /* \if hp < 5\ flee else go nearest duck */
  ifStmt() {
    const t = this.peek();
    this.p++;
    const c = this.cond(t.v.replace(/^\s*if\b/, ""), t.line);
    const then = this.body();
    let other = null;
    if (this.word("else")) {
      this.p++;
      other = this.body();
    }
    return { k: "if", c, then, other };
  }
  /* (( hp 5 )), ((z speed ~1.2)), ((hp 50%)): set a stat */
  setStmt() {
    this.p += 2;
    let who = null;
    const t = this.peek();
    if (!t || t.t !== "word")
      no(`((hp 5)): a stat, then its value`, HELP.names);
    if (!NB_STATS.includes(t.v)) who = this.who();
    const st = this.peek();
    if (!st || st.t !== "word" || !NB_STATS.includes(st.v))
      no(`Which stat? ${NB_STATS.join(", ")}`, HELP.names);
    this.p++;
    const v = this.value({ what: `${st.v}'s value`, sum: true });
    let pct = false;
    if (this.op("%")) {
      this.p++;
      pct = true; // (a percent of its most: ((hp 50%)) is half)
    }
    this.want(")", `((${st.v} …)) needs its ))`);
    this.want(")", `((${st.v} …)) needs its ))`);
    return { k: "set", who, stat: st.v, v, pct };
  }
  /* [attack 75%, flee 25%]: a pick of statements */
  isPick() {
    const t = this.peek(1);
    return (
      !!t &&
      t.t === "word" &&
      (HEADS.has(t.v) || this.file.defs.has(t.v) || this.file.calls(t.v))
    );
  }
  pickStmt() {
    this.p++;
    const items = [];
    for (;;) {
      const s = this.stmt();
      const w = this.value({ what: "A percent", sum: true });
      this.want(
        "%",
        "Every choice in a pick of actions needs its percent: [attack 75%, flee 25%]",
      );
      items.push({ s, w });
      if (this.op(",")) {
        this.p++;
        continue;
      }
      this.want("]", "A pick of actions ends with ]");
      return { k: "pick", items };
    }
  }
  /* me, nearest duck, all zombies, team, or a for's name. maybe: give null when it isn't one */
  who(maybe) {
    const t = this.peek();
    if (t && t.t === "word") {
      if (t.v === "me" || t.v === "team") {
        this.p++;
        return { k: t.v };
      }
      if (t.v === "nearest" || t.v === "all") {
        const k = this.peek(1);
        if (!k || k.t !== "word" || !KINDS[k.v])
          no(`${t.v} what? ${t.v} duck, ${t.v} zombie`, HELP.who);
        this.p += 2;
        return { k: t.v, of: KINDS[k.v] };
      }
      if ((!maybe || this.file.known.has(t.v)) && !HEADS.has(t.v)) {
        this.p++;
        return { k: "var", name: t.v };
      }
    }
    if (maybe) return null;
    no(`Who? me, nearest duck, all zombies, team`, HELP.who);
  }
  /* say "rage is " rage: the text, and values beside it */
  text() {
    const parts = [];
    while (!this.sep() && !this.word("else")) {
      const t = this.peek();
      if (t.t === "str") {
        this.p++;
        parts.push({ s: t.v, raw: t.q === "'" });
      } else
        parts.push({
          v: this.value({ what: "A value to say", stopWords: ["else"] }),
        });
    }
    if (!parts.length) no(`Say what? say "hi"`, HELP.text);
    return parts;
  }
  /* a test: hp < 5, hp == 5, hp not 5, hp in 1:5, not …, and, or, nand, xor */
  cond(text, line) {
    const toks = lex(text).map((t) => ({ ...t, line }));
    const c = new Stmts(toks, this.R, line, this.file);
    c.skipSeps();
    const fn = c.either();
    if (c.peek()) no(`"${c.peek().v}" doesn't belong in the test`, HELP.if);
    return fn;
  }
  either() {
    let a = this.both();
    while (this.word("or") || this.word("xor") || this.word("nand")) {
      const w = this.peek().v;
      this.p++;
      const l = a,
        r = this.both();
      a =
        w === "or"
          ? (e) => l(e) || r(e)
          : w === "xor"
            ? (e) => l(e) !== r(e)
            : (e) => !(l(e) && r(e));
    }
    return a;
  }
  both() {
    let a = this.notOf();
    while (this.word("and")) {
      this.p++;
      const l = a,
        r = this.notOf();
      a = (e) => l(e) && r(e);
    }
    return a;
  }
  notOf() {
    if (this.word("not")) {
      this.p++;
      const a = this.notOf();
      return (e) => !a(e);
    }
    return this.cmp();
  }
  cmp() {
    const stops = ["and", "or", "xor", "nand", "not", "in"];
    const a = this.value({
      cmp: true,
      stopWords: stops,
      what: "The test's value",
    });
    let op = null;
    if (this.op("<") || this.op(">")) {
      op = this.peek().v;
      this.p++;
      if (this.op("=")) {
        op += "=";
        this.p++;
      }
    } else if (this.op("=")) {
      this.p++;
      if (!this.op("=")) no(`Compare with == (one = names a value)`, HELP.if);
      this.p++;
      op = "==";
    } else if (this.word("not") || this.word("in")) {
      op = this.peek().v;
      this.p++;
    }
    if (!op) return (e) => truthy(e.val(a));
    const b = this.value({ cmp: true, stopWords: stops, what: `After ${op}` });
    if (op === "in") return (e) => e.isIn(e.val(a), b);
    return (e) => {
      const x = e.val(a),
        y = e.val(b);
      if (op === "==") return same(x, y);
      if (op === "not") return !same(x, y);
      const n = num(x, "The test's value"),
        m = num(y, "The test's value");
      return op === "<"
        ? n < m
        : op === ">"
          ? n > m
          : op === "<="
            ? n <= m
            : n >= m;
    };
  }
}
const truthy = (v) =>
  v !== NOTHING && v !== false && v !== 0 && v !== "" && v != null;
const same = (x, y) =>
  typeof x === "number" && typeof y === "number"
    ? Math.abs(x - y) < 1e-9
    : x === y;

/* ---------- compile a file ----------
   { n: lines read, errs: [{ line, why }], plan } (run a plan only when errs is empty). opts.file(name): another file's
   text for use (null when there's none) */
export function compileScript(text, opts = {}) {
  const errs = [];
  const plan = { top: [], whens: [], everys: [], defs: new Map(), lines: 0 };
  read(String(text == null ? "" : text), plan, errs, opts, new Set(), "");
  errs.sort((a, b) => a.line - b.line);
  return { n: plan.lines, errs, plan }; // (the plan of the lines that read well, even when others didn't: Check plays them)
}
function read(text, plan, errs, opts, seen, from) {
  let toks;
  try {
    toks = lex(text);
  } catch (e) {
    if (!(e instanceof NbError)) throw e;
    errs.push({ line: text.split("\n").length, why: from + e.why });
    return;
  }
  /* first the names of the blocks, so a call can come before its def */
  const defs = new Set();
  toks.forEach((t, k) => {
    if (t.t === "word" && t.v === "def") {
      const n = toks.slice(k + 1).find((x) => x.t !== "sp");
      if (n && n.t === "word") defs.add(n.v);
    }
  });
  const file = {
    prog: { states: [] },
    names: [],
    known: new Set(),
    defs,
    calls: (w) => plan.defs.has(w),
  };
  const lines = [];
  let cur = [];
  const flush = () => {
    if (cur.some((t) => t.t !== "sp")) lines.push(cur);
    cur = [];
  };
  for (const t of toks) {
    if (t.t === "nl") flush();
    else cur.push(t);
  }
  flush();
  /* line rules for the whole file or for other lines come first, wherever they sit */
  const parsed = [];
  for (const l of lines) {
    const line = l.find((t) => t.t !== "sp").line;
    try {
      const { rules, rest } = lineRules(l, line);
      parsed.push({ line, rules, rest });
    } catch (e) {
      if (!(e instanceof NbError)) throw e;
      errs.push({ line, why: from + e.why });
    }
  }
  const wide = parsed.flatMap((l) => l.rules.filter((r) => r.scope !== "line"));
  let uses = false;
  plan.lines += lines.length;
  for (const l of parsed) {
    if (!l.rest.some((t) => t.t !== "sp")) continue; // (a line of rules only)
    const mine = [
      ...l.rules.filter((r) => r.scope === "line"),
      ...wide.filter((r) => r.scope === "file" || r.lines.has(l.line)),
    ];
    const R = judge(mine);
    try {
      if (valueLine(l.rest, file)) {
        // (a line that is only a value, as in a box: orders, | and repeats keep their place from run to run)
        plan.top.push({
          k: "line",
          prog: build(l.rest, mine),
          line: l.line,
          R,
        });
        continue;
      }
      const sp = new Stmts(l.rest, R, l.line, file);
      while (sp.peek()) {
        sp.skipSeps();
        if (!sp.peek()) break;
        const s = sp.stmt();
        if (sp.peek() && sp.peek().t !== "sep")
          no(`"${sp.peek().v}" doesn't belong here`);
        tag(s, R);
        if (s.k === "use") {
          uses = true;
          useFile(s.name, plan, errs, opts, seen, l.line, from);
        } else if (s.k === "def") plan.defs.set(s.name, s);
        else if (s.k === "when") plan.whens.push(s);
        else if (s.k === "every") plan.everys.push(s);
        else plan.top.push(s);
      }
    } catch (e) {
      if (!(e instanceof NbError)) throw e;
      errs.push({ line: l.line, why: from + e.why });
    }
  }
  /* names nobody gave: a mistake, unless another file (use) can give them */
  if (!uses && !opts.loose)
    for (const n of file.names)
      if (
        !file.known.has(n.v) &&
        !plan.defs.has(n.v) &&
        !NB_BUILT.includes(n.v) &&
        !NB_STATS.includes(n.v) &&
        !(opts.known && opts.known.has(n.v))
      )
        errs.push({
          line: n.line,
          why: `${from}"${n.v}" isn't a name I know (let it first). See ${HELP.names}`,
        });
}
/* a line that doesn't start with a statement's word: a plain value line (part A) */
function valueLine(toks, file) {
  const t = toks.filter((x) => x.t !== "sp");
  const a = t[0],
    b = t[1];
  if (a.t === "word")
    return (
      !HEADS.has(a.v) &&
      !file.defs.has(a.v) &&
      !file.calls(a.v) &&
      !(b && b.t === "op" && b.v === "=")
    );
  if (a.t === "bs") return !/^\s*if\b/.test(a.v);
  if (a.t === "op" && a.v === "(" && b && b.t === "op" && b.v === "(")
    return false;
  if (
    a.t === "op" &&
    a.v === "[" &&
    b &&
    b.t === "word" &&
    (HEADS.has(b.v) || file.defs.has(b.v))
  )
    return false;
  return true;
}
/* every statement keeps its line's rules, for its values */
function tag(s, R) {
  if (!s || typeof s !== "object") return;
  s.R = R;
  for (const k of ["body", "then", "other"])
    if (Array.isArray(s[k])) s[k].forEach((x) => tag(x, R));
  if (s.items) s.items.forEach((x) => tag(x.s, R));
}
function useFile(name, plan, errs, opts, seen, line, from) {
  if (seen.has(name)) return; // (a file used twice, or files that use each other: once is enough)
  seen.add(name);
  const text = opts.file ? opts.file(name) : null;
  if (text == null) {
    if (opts.file)
      errs.push({
        line,
        why: `${from}use '${name}': no file by that name. See ${HELP.run}`,
      });
    return;
  }
  const sub = { top: [], whens: [], everys: [], defs: new Map(), lines: 0 };
  const before = errs.length;
  read(
    text,
    sub,
    errs,
    { ...opts, loose: true },
    seen,
    `${from}in '${name}': `,
  );
  for (let k = before; k < errs.length; k++) errs[k].line = line;
  plan.top.push(...sub.top);
  plan.whens.push(...sub.whens);
  plan.everys.push(...sub.everys);
  for (const [k, v] of sub.defs) if (!plan.defs.has(k)) plan.defs.set(k, v);
}

/* ---------- running a plan ----------
   host: {
     now(): seconds, stat(id, name), set(id, name, v), most(id, name): a stat's most (for percents),
     get(name): wave, time, alive, dead, spawned, who(spec, me): [ids] (spec { k: me|nearest|all|team, of }),
     act(me, what, id): go, attack or flee, say(me, text), print(text, me), file(name), shared: a Map for give/take,
     error(line, why)
   }
   brain(plan, host): { start(), add(id), remove(id), fire(ev, id, arg), tick(), stop(), tasks } */
export function brain(plan, host) {
  const globals = new Map();
  let rand = Math.random;
  const tasks = [];
  const timers = new Map(); // (each NPC's every's: id -> [next time])
  let busy = 0;
  const B = { tasks, globals };

  const scope = (parent) => ({ vars: new Map(), parent });
  const lookup = (env, w) => {
    for (let s = env.scope; s; s = s.parent)
      if (s.vars.has(w)) return s.vars.get(w);
    if (globals.has(w)) return globals.get(w);
    if (NB_BUILT.includes(w)) return host.get(w);
    if (NB_STATS.includes(w)) {
      if (env.me == null)
        no(`${w} is an NPC's: use it inside a when`, HELP.names);
      return host.stat(env.me, w);
    }
    no(`"${w}" isn't a name I know (let it first)`, HELP.names);
  };
  const setVar = (env, w, v) => {
    for (let s = env.scope; s; s = s.parent)
      if (s.vars.has(w)) {
        s.vars.set(w, v);
        return;
      }
    if (env.scope && env.scope.parent) env.scope.vars.set(w, v);
    else globals.set(w, v);
  };
  /* a value, with its line's rules: played again (up to 1,000 times) while the rules take its result out */
  const val = (env, fn, R) => {
    for (let k = 0; k < MOST_TRIES; k++) {
      const ctx = newCtx(rand, R);
      ctx.name = (w) => lookup(env, w);
      /* z hp: another NPC's stat (z from for z in team, or a name let to one) */
      ctx.stat = (w, n) => {
        const id = lookup(env, w);
        if (typeof id !== "string")
          no(
            `"${w}" isn't an NPC, so it has no ${n} (for z in team gives NPCs)`,
            HELP.names,
          );
        return host.stat(id, n);
      };
      let v;
      try {
        v = fn(ctx);
      } catch (e) {
        if (e === REPLAY) continue;
        throw e;
      }
      v = out(v);
      if (R && R.any && R.resOut(v)) continue;
      return v;
    }
    no(
      "The line rules took out every value it gave, 1,000 times in a row",
      "help/numbers/linerules.txt",
    );
  };
  const E = (env, R) => ({
    val: (fn) => val(env, fn, R),
    isIn: (x, fn) => isIn(x, fn, env, R),
  });
  const isIn = (x, fn, env, R) => {
    if (fn.span) {
      const ctx = newCtx(rand, R);
      ctx.name = (w) => lookup(env, w);
      /* z hp: another NPC's stat (z from for z in team, or a name let to one) */
      ctx.stat = (w, n) => {
        const id = lookup(env, w);
        if (typeof id !== "string")
          no(
            `"${w}" isn't an NPC, so it has no ${n} (for z in team gives NPCs)`,
            HELP.names,
          );
        return host.stat(id, n);
      };
      const [lo, hi, t10] = fn.span(ctx);
      return (
        typeof x === "number" &&
        x >= lo - 1e-9 &&
        x <= hi + 1e-9 &&
        (t10 || Number.isInteger(x))
      );
    }
    if (fn.opts) return fn.opts.some((o) => isIn(x, o, env, R));
    return same(x, val(env, fn, R));
  };
  const whoIs = (env, w) => {
    if (!w) return host.who({ k: "nearest", of: "duck" }, env.me);
    if (w.k === "var") {
      const v = lookup(env, w.name);
      return Array.isArray(v) ? v : [v];
    }
    if (
      (w.k === "me" || w.k === "team" || w.k === "nearest") &&
      env.me == null &&
      w.k !== "nearest"
    )
      no(`"${w.k}" is an NPC's: use it inside a when`, HELP.who);
    return host.who(w, env.me);
  };
  const text = (env, parts, R) =>
    parts
      .map((p) => {
        if (p.v) return show(val(env, p.v, R));
        if (p.raw) return p.s; // ('…': exactly as typed)
        return fill(p.s, env, R);
      })
      .join("");
  /* "…": asterisks, $ letters and named values worked out, as bash does with its variables */
  const fill = (s, env) =>
    s.replace(/[$*]+|[A-Za-z_][A-Za-z0-9_]*/g, (m) => {
      if (/^[$*]+$/.test(m))
        return [...m]
          .map((c) =>
            c === "*"
              ? String(Math.floor(rand() * 10))
              : "abcdefghijklmnopqrstuvwxyz"[Math.floor(rand() * 26)],
          )
          .join("");
      const w = m.toLowerCase();
      for (let sc = env.scope; sc; sc = sc.parent)
        if (sc.vars.has(w)) return show(sc.vars.get(w));
      return globals.has(w) ? show(globals.get(w)) : m;
    });

  /* one statement, as a generator: it yields the seconds of a wait */
  function* run(s, env) {
    if (++busy > BUSY)
      no(
        "This ran too long without a wait (a loop that never ends?)",
        HELP.loop,
      );
    const R = s.R;
    switch (s.k) {
      case "let":
        setVar(env, s.name, val(env, s.v, R));
        return;
      case "value":
        val(env, s.v, R);
        return;
      case "line": {
        const r = s.prog.run(rand);
        if (r.why) no(r.why);
        return;
      }
      case "block":
        for (const x of s.body) yield* run(x, env);
        return;
      case "act": {
        if (env.me == null)
          no(`${s.act} is for an NPC: use it inside a when`, HELP.run);
        const to = whoIs(env, s.who);
        if (to.length) host.act(env.me, s.act, to[0]);
        return;
      }
      case "wait": {
        const t = num(val(env, s.v, R), "wait's seconds");
        if (t > 0) yield t;
        return;
      }
      case "say":
        if (env.me == null) host.print(text(env, s.parts, R), null);
        else host.say(env.me, text(env, s.parts, R));
        return;
      case "print":
        host.print(text(env, s.parts, R), env.me);
        return;
      case "stop":
        throw STOP;
      case "seed": {
        const n = Math.round(num(val(env, s.v, R), "seed's number"));
        rand = seeded(n);
        return;
      }
      case "give":
        host.shared.set(s.name, lookup(env, s.name));
        return;
      case "take":
        if (!host.shared.has(s.name))
          no(
            `Nothing was given as ${s.name} yet (give ${s.name} in another file)`,
            HELP.run,
          );
        setVar(env, s.name, host.shared.get(s.name));
        return;
      case "set": {
        const v = num(val(env, s.v, R), `${s.stat}'s value`);
        const ids = s.who
          ? whoIs(env, s.who)
          : env.me != null
            ? [env.me]
            : no(
                `Whose ${s.stat}? Use it inside a when, or ((all zombies ${s.stat} …))`,
                HELP.names,
              );
        for (const id of ids)
          host.set(
            id,
            s.stat,
            tenth(s.pct ? (host.most(id, s.stat) * v) / 100 : v),
          );
        return;
      }
      case "if": {
        const ok = s.c(E(env, R));
        const b = ok ? s.then : s.other;
        if (b) for (const x of b) yield* run(x, env);
        return;
      }
      case "while": {
        let n = 0;
        while (s.c(E(env, R))) {
          if (++n > LOOPS)
            no("This loop ran 1,000 rounds, so it stopped", HELP.loop);
          for (const x of s.body) yield* run(x, env);
        }
        return;
      }
      case "for": {
        const list = s.over.k ? whoIs(env, s.over) : forList(env, s.over.v, R);
        if (list.length > LOOPS)
          no(
            "This loop would run more than 1,000 rounds, so it stopped",
            HELP.loop,
          );
        const inner = { ...env, scope: scope(env.scope) };
        for (const x of list) {
          inner.scope.vars.set(s.name, x);
          for (const y of s.body) yield* run(y, inner);
        }
        return;
      }
      case "pick": {
        const ws = s.items.map((x) =>
          Math.max(0, num(val(env, x.w, R), "A percent")),
        );
        const all = ws.reduce((a, b) => a + b, 0),
          top = Math.max(all, 100); // (under 100% in all: the rest is "do nothing"; over: shares)
        let p = rand() * top;
        for (let k = 0; k < ws.length; k++) {
          if (p < ws[k]) {
            yield* run(s.items[k].s, env);
            return;
          }
          p -= ws[k];
        }
        return;
      }
      case "call": {
        const d = plan.defs.get(s.name);
        if (!d) no(`No block named ${s.name}`, HELP.run);
        if (s.args.length !== d.params.length)
          no(
            `${s.name} takes ${d.params.length} input${d.params.length === 1 ? "" : "s"}, not ${s.args.length}`,
            HELP.run,
          );
        const inner = {
          ...env,
          scope: scope(null),
          depth: (env.depth || 0) + 1,
        };
        if (inner.depth > 50) no(`${s.name} calls itself too deep`, HELP.run);
        d.params.forEach((p, k) =>
          inner.scope.vars.set(p, val(env, s.args[k], R)),
        );
        inner.scope.parent = null;
        try {
          for (const x of d.body) yield* run(x, inner);
        } catch (e) {
          if (e !== STOP) throw e; // (stop ends the block early)
        }
        return;
      }
      case "use":
        return;
    }
  }
  /* for n in 1:5 (each number), for n in [1,3,5] (each), for n in 3 (1 to 3) */
  const forList = (env, fn, R) => {
    const ctx = newCtx(rand, R);
    ctx.name = (w) => lookup(env, w);
    const each = (f, top) => {
      if (f.span) {
        const [lo, hi, t10] = f.span(ctx),
          step = t10 ? 0.1 : 1,
          o = [];
        for (let x = lo; x <= hi + 1e-9; x += step) {
          o.push(tenth(x));
          if (o.length > LOOPS) break;
        }
        return o;
      }
      if (f.opts) return f.opts.flatMap((o) => each(o, false));
      const v = num(val(env, f, R), "for's value");
      if (!top) return [v]; // (one of a list: itself)
      const o = [];
      for (let k = 1; k <= v && o.length <= LOOPS; k++) o.push(k);
      return o;
    };
    return each(fn, true);
  };

  /* a task: a statement list running for one NPC (or the file), sleeping through its waits */
  function task(body, me, line) {
    const env = { me, scope: scope(null) };
    const gen = (function* () {
      try {
        for (const x of body) yield* run(x, env);
      } catch (e) {
        if (e !== STOP) throw e;
      }
    })();
    const t = { gen, me, wake: 0, line };
    tasks.push(t);
    step(t);
  }
  function step(t) {
    busy = 0;
    try {
      const r = t.gen.next();
      if (r.done) drop(t);
      else t.wake = host.now() + r.value;
    } catch (e) {
      drop(t);
      if (e instanceof NbError) host.error(t.line, e.why);
      else throw e;
    }
  }
  const drop = (t) => {
    const k = tasks.indexOf(t);
    if (k >= 0) tasks.splice(k, 1);
  };
  const firstLine = (b) => (b && b[0] && b[0].line) || 0;

  B.start = () => {
    task(plan.top, null, firstLine(plan.top));
  };
  /* an NPC this file runs: its every's start (each NPC keeps its own clock) and its when spawn plays */
  B.add = (id) => {
    timers.set(
      id,
      plan.everys.map(() => host.now()),
    );
    B.fire("spawn", id);
  };
  B.remove = (id) => {
    timers.delete(id);
    near.delete(id);
    for (const t of [...tasks]) if (t.me === id) drop(t);
  };
  /* something happened to NPC id: its when's play. near: arg is how near the duck (or zombie) is, and of what */
  B.fire = (ev, id, arg) => {
    for (const w of plan.whens) {
      if (w.ev !== ev) continue;
      if (ev === "near") {
        if (!arg || arg.of !== w.of) continue;
        try {
          const env = { me: id, scope: scope(null) };
          if (!(arg.d <= num(val(env, w.v, w.R), "How near"))) continue;
        } catch (e) {
          if (e instanceof NbError) {
            host.error(w.line, e.why);
            continue;
          }
          throw e;
        }
      }
      task(w.body, id, w.line);
    }
  };
  /* how near NPC id is to the nearest duck (of: "duck") or other NPC (of: "zombie", "npc"): its when near's play as it
     comes that near (not again until it has gone further off); touching (one duck length) plays its when touch */
  const near = new Map(); // (id -> what it was near last time: "k" for when number k, "t" for touching)
  B.near = (id, of, d) => {
    const was = near.get(id) || new Set();
    plan.whens.forEach((w, k) => {
      if (w.ev !== "near" || w.of !== of) return;
      let n;
      try {
        n = num(val({ me: id, scope: scope(null) }, w.v, w.R), "How near");
      } catch (e) {
        if (!(e instanceof NbError)) throw e;
        host.error(w.line, e.why);
        return;
      }
      if (d <= n) {
        if (!was.has(k)) task(w.body, id, w.line);
        was.add(k);
      } else was.delete(k);
    });
    near.set(id, was);
  };
  B.touch = (id, on) => {
    const was = near.get(id) || new Set();
    if (on && !was.has("t")) B.fire("touch", id);
    if (on) was.add("t");
    else was.delete("t");
    near.set(id, was);
  };
  /* what the game has to measure for this file (nothing it doesn't use: 800 NPCs) */
  B.needs = {
    duck: plan.whens.some((w) => w.ev === "near" && w.of === "duck"),
    zombie: plan.whens.some((w) => w.ev === "near" && w.of !== "duck"),
    touch: plan.whens.some((w) => w.ev === "touch"),
    every: plan.everys.length > 0,
  };
  /* time moves on: the waits that are over wake, and the every's that are due play */
  B.tick = () => {
    const now = host.now();
    for (const t of [...tasks]) if (tasks.includes(t) && t.wake <= now) step(t);
    for (const [id, next] of timers)
      plan.everys.forEach((e, k) => {
        if (next[k] > now) return;
        try {
          const s = num(
            val({ me: id, scope: scope(null) }, e.v, e.R),
            "every's seconds",
          );
          next[k] = now + Math.max(0.1, s);
        } catch (err) {
          if (!(err instanceof NbError)) throw err;
          host.error(e.line, err.why);
          next[k] = Infinity;
          return;
        }
        task(e.body, id, e.line);
      });
  };
  B.stop = () => {
    tasks.length = 0;
    timers.clear();
  };
  B.rand = () => rand();
  return B;
}
const show = (v) =>
  v === NOTHING ? "" : typeof v === "boolean" ? (v ? "t" : "f") : String(v);
/* the same random numbers from the same seed (seed 42) */
function seeded(n) {
  let a = n >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
