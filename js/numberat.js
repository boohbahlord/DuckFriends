/* ---------- Numberat: the language (part A: values) ----------
   The rules are in notes/numberat-bible.md (the source of truth). This part is sections 0 to 5 and the percent picks
   (14.4): plain values, ranges, tenths, the asterisks and the $ letters, ~, order arrows and repeats, the four kinds of
   brackets, math, = and the asterisk rules mormax, mormini, negbrahm, posbrahm and caps.
   "this code is like math, components give rise to new logical possibilities", so every piece is a small part that
   fits into every other: a range can be a list item, a list can be a range's end, anything can be named and used again.
   A text is compiled once (compile()) into small steps, plain functions, so a spawn only runs those (bible section 12).
   A program keeps its own place in its orders and repeats between runs (spawn 1, spawn 2 ...); each run starts its
   inputs (the asterisks) and its { } groups over.
   Bad writing never breaks the game: compile() and run() give { why } and the caller keeps its last good value.
   No imports, so the rules, the boxes and the Numberat window all use this one compiler. */

export const NOTHING = Symbol("nothing"); // (a pick that landed on "do nothing", or a repeat that played 0 times)
const MOST = 1000; // a repeat plays at most this many times
const RULE_WORDS = ["mormax", "mormini", "negbrahm", "posbrahm", "caps"];

class NbError extends Error {
  constructor(why) {
    super(why);
    this.why = why;
  }
}
const no = (why) => {
  throw new NbError(why);
};

/* ---------- reading the text into pieces ---------- */
const isDigitish = (c) => /[0-9*]/.test(c);
function lex(text) {
  const out = [],
    src = String(text == null ? "" : text);
  let i = 0,
    line = 1,
    depth = 0;
  const push = (t, v, extra = {}) => out.push({ t, v, line, ...extra });
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") {
      push(depth > 0 ? "sp" : "nl", "\n"); // (a line carries on while a bracket is still open)
      line++;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      push("sp", " ");
      while (i < src.length && /[ \t\r]/.test(src[i])) i++;
      continue;
    }
    if (c === "#") {
      while (i < src.length && src[i] !== "\n") i++; // (a note: the rest of the line)
      continue;
    }
    if (isDigitish(c) || (c === "." && isDigitish(src[i + 1] || ""))) {
      let int = "";
      while (i < src.length && isDigitish(src[i])) int += src[i++];
      let dot = false,
        frac = "";
      if (src[i] === ".") {
        dot = true;
        i++;
        while (i < src.length && isDigitish(src[i])) frac += src[i++];
      }
      push("num", int + (dot ? "." + frac : ""), { int, dot, frac });
      continue;
    }
    if (c === "$") {
      let n = 0;
      while (src[i] === "$") {
        n++;
        i++;
      }
      push("let", "$".repeat(n), { n });
      continue;
    }
    if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) no("A ' is never closed");
      const raw = src.slice(i + 1, end),
        m = /^(\d+)(\*+|\$+)$/.exec(raw);
      if (m)
        push("name", raw, {
          key: "'" + m[1] + m[2][0],
          n: m[2].length,
          kind: m[2][0],
        });
      // ('1*' is asterisk number 1, '2***' number 2 with three digits, '1$' a named letter)
      else push("quote", raw);
      i = end + 1;
      continue;
    }
    if (c === "\\") {
      const end = src.indexOf("\\", i + 1);
      if (end < 0) no("A \\ is never closed");
      push("bs", src.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    if (c === "|" && src[i + 1] === "|") {
      push("op", "||");
      i += 2;
      continue;
    }
    if (/[a-z_]/i.test(c)) {
      let w = "";
      while (i < src.length && /[a-z0-9_]/i.test(src[i])) w += src[i++];
      push("word", w.toLowerCase());
      continue;
    }
    if ("([{".includes(c)) depth++;
    if (")]}".includes(c)) depth = Math.max(0, depth - 1);
    if ('()[]{}+-/^:,<>|=~%"!'.includes(c)) {
      push("op", c);
      i++;
      continue;
    }
    no(`"${c}" isn't part of Numberat`);
  }
  return out;
}

/* ---------- the parts, each compiled to a function of the run (ctx) ----------
   ctx: { r: random numbers, b: the inputs named so far (Map), f: the line's asterisk rules } */
const rnd = (ctx, n) => Math.min(n - 1, Math.floor(ctx.r() * n)); // (0 … n-1)
const tenth = (n) => Math.round(n * 10) / 10;
const out = (v) => (typeof v === "number" ? tenth(v) : v); // (a result keeps tenths at most)
const num = (v, what = "this") => {
  if (v === NOTHING) no(`${what} came out as nothing`);
  if (typeof v === "string") no(`Letters can't do math ("${v}")`);
  if (typeof v === "boolean") no("t and f can't do math");
  return v;
};

/* an input put into an asterisk: cut to its digits, its sign as the rules say (bible section 5) */
function fit(v, n, f, neg) {
  if (typeof v === "string") no(`"${v}" is letters; an asterisk takes numbers`);
  if (typeof v === "boolean") v = v ? 1 : 0;
  num(v);
  let sign = v < 0 ? -1 : 1,
    a = Math.abs(v);
  if (neg && sign > 0 && a > 0 && !f.posbrahm) {
    if (f.mormini) a = 0;
    else sign = -1; // (a -* takes its input below zero unless posbrahm lets positives in)
  } else if (!neg && sign < 0 && !f.negbrahm) {
    if (f.mormini) a = 0;
    sign = 1; // ("loses its sign by default (3); mormini raises it to the lowest allowed instead (0)")
  }
  let ip = Math.trunc(a),
    fr = tenth(a - ip);
  const top = 10 ** n;
  if (ip >= top) {
    if (f.mormax) {
      ip = top - 1;
      fr = 0;
    } else ip = ip % top; // (150 into ** gives 50; with mormax 99)
  }
  return sign * tenth(ip + fr);
}
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
function letters(ctx, n) {
  let s = "";
  for (let k = 0; k < n; k++) {
    const l = LETTERS[rnd(ctx, 26)];
    s += ctx.f.caps && ctx.r() < 0.5 ? l.toUpperCase() : l;
  }
  return s;
}

/* a number written with asterisks in it (1.*, *.*, **, 1*): each * a digit. which: "" a random one, "lo" its smallest,
   "hi" its biggest (a range's ends) */
function digits(ctx, int, frac, which) {
  const d = (ch) =>
    ch === "*" ? (which === "lo" ? 0 : which === "hi" ? 9 : rnd(ctx, 10)) : +ch;
  let v = 0;
  for (const ch of int) v = v * 10 + d(ch);
  let p = 0.1;
  for (const ch of frac) {
    v += d(ch) * p;
    p /= 10;
  }
  return tenth(v);
}

/* ---------- the parser ---------- */
class Parser {
  constructor(toks, prog) {
    this.toks = toks.filter((t) => t.t !== "sp");
    this.raw = toks; // (spaces kept, for a value and its percent: "3 60%")
    this.i = 0;
    this.prog = prog;
    this.quoted = 0; // (inside "…": side by side multiplies)
    this.braces = []; // (the { } groups being read: their parts start over each run)
  }
  peek(o = 0) {
    return this.toks[this.i + o];
  }
  is(v, o = 0) {
    const t = this.peek(o);
    return !!t && t.t === "op" && t.v === v;
  }
  take(v) {
    if (!this.is(v))
      no(
        `Expected "${v}"${this.peek() ? ` before "${this.peek().v}"` : " at the end"}`,
      );
    return this.toks[this.i++];
  }
  done() {
    return this.i >= this.toks.length;
  }
  /* a part with a place kept between runs (an order, a repeat): made here, so { } can start it over */
  state(s) {
    this.prog.states.push(s);
    for (const b of this.braces) b.push(s);
    return s;
  }

  /* the whole line: its segments, cut by | and by a repeat marker \>2>\|| */
  program() {
    const segs = [];
    while (!this.done()) {
      const node = this.expr();
      const seg = { node, count: null, back: false };
      const t = this.peek();
      if (t && t.t === "bs") {
        const rep = this.repeatOf(t.v);
        if (!rep) no(`"\\${t.v}\\" isn't a repeat`);
        this.i += this.is("||", 1) ? 2 : 1; // (\<!<\ after side by side groups needs no ||)
        seg.count = rep.count;
        seg.back = rep.back;
        if (this.is("|")) this.i++;
      } else if (this.is("|")) this.i++;
      else if (!this.done()) no(`"${this.peek().v}" doesn't belong here`);
      segs.push(seg);
    }
    if (!segs.length) no("Write a value");
    return segs;
  }
  /* \>2>\ , \<3<\ , \>>\ , \>*>\ , \<!<\ : a repeat's count (null: once; Infinity: keep going) and its way */
  repeatOf(inner) {
    const m = /^([<>])([\s\S]*)\1$/.exec(inner);
    if (!m) return null;
    const body = m[2].trim();
    let count = null;
    if (body === "!") count = () => Infinity;
    else if (body) {
      const sub = new Parser(lex(body), this.prog);
      sub.braces = this.braces;
      const fn = sub.expr();
      if (!sub.done()) no(`"${body}" isn't a count`);
      count = (ctx) => {
        const v = num(fn(ctx), "A repeat's count");
        if (v < 0) no("A repeat can't play a negative number of times");
        return Math.min(MOST, Math.round(v));
      };
    }
    return { count, back: m[1] === "<" };
  }

  /* = names what's on its left: "[2,3,5]=*+*" picks, calls it *, then works out *+* */
  expr() {
    const left = this.seq();
    if (!this.is("=")) return left;
    this.i++;
    const at = this.i,
      right = this.expr(),
      first = this.toks[at],
      key =
        first && first.t === "op" && first.v === "-"
          ? keyOf(this.toks[at + 1], first)
          : keyOf(first, null);
    if (!key) no("After \"=\" comes the asterisk (or $) to name: =*, ='1*'");
    const fn = (ctx) => {
      const v = left(ctx);
      ctx.b.set(key, v);
      return right(ctx);
    };
    fn.def = right.only === key; // (a line that only names: "{…}='1*'")
    fn.key = key;
    return fn;
  }

  /* > and <: the listed values in order. An arrow first fixes the start; side by side groups take turns */
  seq() {
    let lead = null;
    if (this.is(">") || this.is("<")) lead = this.toks[this.i++].v;
    const items = [this.juxt()];
    let way = lead;
    while (this.is(">") || this.is("<")) {
      const a = this.peek().v;
      const next = this.peek(1);
      if (!next || (next.t === "op" && !'([{"~-'.includes(next.v))) {
        this.i++; // (a last arrow: the way the side by side groups go, "[1,3][2,4]<")
        if (items.length === 1 && items[0].groups) items[0].groups.way = a;
        else if (way && way !== a) no("Arrows both ways in one order");
        else way = a;
        break;
      }
      if (way && way !== a) no("Arrows both ways in one order");
      way = a;
      this.i++;
      items.push(this.juxt());
    }
    if (items.length === 1 && !lead) return items[0];
    return this.order(items, way === "<", !!lead);
  }
  /* an order of parts: each run gives the next. back: the other way; fixed: always starts at the first */
  order(items, back, fixed) {
    const st = this.state({
      i: -1,
      back,
      reset() {
        this.i = -1;
      },
    });
    const n = items.length;
    const fn = (ctx) => {
      if (st.i < 0) st.i = fixed ? 0 : rnd(ctx, n);
      else st.i = (st.i + 1) % n;
      const k = st.back ? n - 1 - st.i : st.i;
      return items[k](ctx);
    };
    fn.len = n;
    fn.st = st;
    return fn;
  }
  /* [ ] and ( ) groups side by side: "picked in random order unless arrows say otherwise" (inside "…": multiplied) */
  juxt() {
    const first = this.choice();
    if (this.quoted) return first;
    const groups = [first];
    while (this.startsGroup()) groups.push(this.choice());
    if (groups.length === 1) return first;
    const st = this.state({
      i: -1,
      way: "",
      deck: [],
      reset() {
        this.i = -1;
      },
    });
    const n = groups.length;
    const fn = (ctx) => {
      st.i = (st.i + 1) % n;
      if (st.i === 0 && !st.way) {
        st.deck = [...Array(n).keys()];
        for (let k = n - 1; k > 0; k--) {
          const j = rnd(ctx, k + 1);
          [st.deck[k], st.deck[j]] = [st.deck[j], st.deck[k]];
        }
      }
      const k =
        st.way === ">" ? st.i : st.way === "<" ? n - 1 - st.i : st.deck[st.i];
      return groups[k](ctx);
    };
    fn.len = n;
    fn.groups = st;
    return fn;
  }
  startsGroup() {
    return this.is("[") || this.is("(");
  }

  /* , : one of these, true random. With percents: "[3 60%, 5 40%]" */
  choice() {
    const items = [this.item()];
    while (this.is(",")) {
      this.i++;
      items.push(this.item());
    }
    if (items.length === 1 && !items[0].w) return items[0].v;
    const weighted = items.filter((x) => x.w).length;
    if (weighted && weighted !== items.length)
      no("Give every choice a percent, or none of them");
    if (!weighted) {
      const vs = items.map((x) => x.v);
      return (ctx) => vs[rnd(ctx, vs.length)](ctx);
    }
    return (ctx) => {
      const ws = items.map((x) => Math.max(0, num(x.w(ctx), "A percent")));
      const all = ws.reduce((a, b) => a + b, 0),
        out = Math.max(all, 100); // (under 100% in all: the rest is "do nothing"; over: shares)
      let p = ctx.r() * out;
      for (let k = 0; k < items.length; k++) {
        if (p < ws[k]) return items[k].v(ctx);
        p -= ws[k];
      }
      return NOTHING;
    };
  }
  /* one choice: a value, a value and its percent ("3 60%"), or a percent alone ("30%": true 3 times in 10) */
  item() {
    const v = this.sum();
    if (this.is("%")) {
      this.i++;
      return { v: percent(v) };
    }
    if (this.startsValue() && !this.quoted) {
      const w = this.sum();
      this.take("%");
      return { v, w };
    }
    return { v };
  }
  startsValue() {
    const t = this.peek();
    if (!t) return false;
    if (t.t === "num" || t.t === "name" || t.t === "let") return true;
    return (
      t.t === "op" &&
      (t.v === "~" || t.v === "{" || (t.v === '"' && !this.quoted))
    );
  }

  sum() {
    let a = this.term();
    while (this.is("+") || this.is("-")) {
      const op = this.toks[this.i++].v,
        l = a,
        r = this.term();
      a =
        op === "+"
          ? (ctx) => num(l(ctx)) + num(r(ctx))
          : (ctx) => num(l(ctx)) - num(r(ctx));
    }
    return a;
  }
  term() {
    let a = this.product();
    while (this.is("/")) {
      this.i++;
      const l = a,
        r = this.product();
      a = (ctx) => {
        const d = num(r(ctx));
        if (d === 0) no("Can't divide by 0");
        return num(l(ctx)) / d;
      };
    }
    return a;
  }
  /* inside "…", side by side multiplies: "[1,5]2" = "2[1,5]" = 2 or 10 */
  product() {
    let a = this.power();
    while (this.quoted && (this.startsValue() || this.startsGroup())) {
      const l = a,
        r = this.power();
      a = (ctx) => num(l(ctx)) * num(r(ctx));
    }
    return a;
  }
  power() {
    const a = this.unary();
    if (!this.is("^")) return a;
    this.i++;
    const b = this.power();
    return (ctx) => num(a(ctx)) ** num(b(ctx));
  }
  unary() {
    if (this.is("~")) {
      this.i++;
      return about(this.unary());
    }
    if (this.is("-")) {
      this.i++;
      const t = this.peek();
      if (t && t.t === "num" && /^\*+$/.test(t.int) && !t.dot) {
        this.i++;
        return star(t, true); // (-*: a negative digit, -9 to 0)
      }
      const a = this.unary();
      const fn = (ctx) => -num(a(ctx));
      fn.lo = a.hi && ((ctx) => -a.hi(ctx));
      fn.hi = a.lo && ((ctx) => -a.lo(ctx));
      return fn;
    }
    return this.range();
  }
  /* : a range. Whole numbers, unless an end is written with tenths ("1.0:1.*" is 1.0 to 1.9) */
  range() {
    const a = this.atom();
    if (!this.is(":")) return a;
    this.i++;
    const b = this.atom();
    const tenths = !!(a.tenths || b.tenths);
    return (ctx) => {
      let lo = num(a.lo ? a.lo(ctx) : a(ctx), "A range's start"),
        hi = num(b.hi ? b.hi(ctx) : b(ctx), "A range's end");
      if (lo > hi) [lo, hi] = [hi, lo]; // (4:2 is 2 to 4)
      if (tenths || !Number.isInteger(lo) || !Number.isInteger(hi)) {
        const l = Math.ceil(tenth(lo) * 10 - 1e-9),
          h = Math.floor(tenth(hi) * 10 + 1e-9);
        if (h < l) return tenth(lo);
        return (l + rnd(ctx, h - l + 1)) / 10;
      }
      return lo + rnd(ctx, hi - lo + 1);
    };
  }
  atom() {
    const t = this.peek();
    if (!t) no("A value is missing at the end");
    if (t.t === "num") {
      this.i++;
      if (
        t.dot &&
        t.frac === "" &&
        (this.is("[") || this.is("(") || this.is("{"))
      ) {
        const g = this.atom(); // (1.[0:9]: 1 and a tenth digit from the group)
        const ip = digitsOrNum(t.int);
        const fn = (ctx) => {
          const d = Math.abs(Math.round(num(g(ctx)))) % 10;
          return tenth(ip(ctx) + d / 10);
        };
        fn.tenths = true;
        return fn;
      }
      if (t.dot && t.frac === "") no(`"${t.v}" needs a tenth after its "."`);
      return star(t, false);
    }
    if (t.t === "name") {
      this.i++;
      return named(t);
    }
    if (t.t === "let") {
      this.i++;
      const key = "$" + t.n;
      const fn = (ctx) =>
        ctx.b.has(key) ? fitLetters(ctx.b.get(key), t.n) : letters(ctx, t.n);
      fn.only = key;
      return fn;
    }
    if (t.t === "word") {
      this.i++;
      if (t.v === "t" || t.v === "true") return () => true;
      if (t.v === "f" || t.v === "false") return () => false;
      no(`"${t.v}" isn't a value (words like that come in a later part)`);
    }
    if (t.t === "bs") {
      const rep = this.repeatOf(t.v);
      if (!rep) no(`"\\${t.v}\\" can't go here`);
      this.i++;
      const a = this.atom(); // (\>1,2>\[…]: play what follows 1 or 2 times, the last play counts)
      if (rep.back && a.st) a.st.back = !a.st.back;
      return (ctx) => {
        const n = rep.count ? rep.count(ctx) : 1;
        if (n === Infinity) no("A repeat in a value needs a count");
        let v = NOTHING;
        for (let k = 0; k < n; k++) v = a(ctx);
        return v;
      };
    }
    if (t.t === "op") {
      if (t.v === "(" || t.v === "[") {
        this.i++;
        const close = t.v === "(" ? ")" : "]";
        if (this.is(close)) no(`Empty ${t.v}${close}`);
        const inner = this.seq();
        this.take(close);
        return inner;
      }
      if (t.v === "{") {
        this.i++;
        if (this.is("}")) no("Empty { }");
        const mine = [];
        this.braces.push(mine);
        const inner = this.expr(); // ({ } can hold a naming: {[2,4]='2*'})
        this.braces.pop();
        this.take("}");
        const fn = (ctx) => {
          if (!ctx.fresh.has(mine)) {
            ctx.fresh.add(mine);
            for (const s of mine) s.reset(); // ("Each run starts it over")
          }
          return inner(ctx);
        };
        fn.only = inner.only;
        fn.def = inner.def; // ({[2,4]='2*'} only names '2*')
        return fn;
      }
      if (t.v === '"') {
        this.i++;
        this.quoted++;
        const inner = this.sum();
        this.quoted--;
        this.take('"');
        return inner;
      }
      if (t.v === "%") no('A "%" needs a number before it');
    }
    if (t.t === "quote")
      no(`'${t.v}' isn't a named asterisk ('1*') or a $ letter ('1$')`);
    no(`"${t.v}" can't start a value`);
  }
}

/* the input key a value names after "=": its first part, an asterisk with no other digits, a named one or $ */
function keyOf(t, before) {
  if (!t) return null;
  if (t.t === "name") return t.key;
  if (t.t === "let") return "$" + t.n;
  if (t.t === "num" && /^\*+$/.test(t.int) && !t.dot)
    return (
      (before && before.t === "op" && before.v === "-" ? "-" : "") +
      "*" +
      t.int.length
    );
  return null;
}
const digitsOrNum = (int) =>
  /\*/.test(int) ? (ctx) => digits(ctx, int, "", "") : () => +int || 0;

/* a number, or a number with asterisks. Asterisks only (*, **, -*) wait for input: named by "=", or with none a
   random value of their digits */
function star(t, neg) {
  const pure = /^\*+$/.test(t.int) && !t.dot,
    has = /\*/.test(t.v);
  if (!has) {
    const v = +t.v;
    const fn = () => v;
    fn.tenths = t.dot;
    return fn;
  }
  if (!pure) {
    const fn = (ctx) => digits(ctx, t.int, t.frac, "");
    fn.lo = (ctx) => digits(ctx, t.int, t.frac, "lo");
    fn.hi = (ctx) => digits(ctx, t.int, t.frac, "hi");
    fn.tenths = t.dot;
    return fn;
  }
  const n = t.int.length,
    key = (neg ? "-" : "") + "*" + n,
    top = 10 ** n - 1;
  const fn = (ctx) => {
    if (ctx.b.has(key)) return fit(ctx.b.get(key), n, ctx.f, neg);
    if (ctx.b.has("*" + n) && neg)
      return fit(ctx.b.get("*" + n), n, ctx.f, true);
    const d = rnd(ctx, top + 1);
    if (neg) return ctx.f.posbrahm && ctx.r() < 0.5 ? d : -d;
    return ctx.f.negbrahm && ctx.r() < 0.5 ? -d : d; // (negbrahm: below zero too)
  };
  fn.lo = (ctx) =>
    ctx.b.has(key) ? fn(ctx) : neg || ctx.f.negbrahm ? -top : 0;
  fn.hi = (ctx) =>
    ctx.b.has(key) ? fn(ctx) : neg && !ctx.f.posbrahm ? 0 : top;
  fn.only = key;
  return fn;
}
/* '1*', '2***', '1$': a named asterisk or letter, the number in quotes its name (never part of the value) */
function named(t) {
  const top = 10 ** t.n - 1;
  const fn = (ctx) => {
    if (t.kind === "$")
      return ctx.b.has(t.key)
        ? fitLetters(ctx.b.get(t.key), t.n)
        : letters(ctx, t.n);
    if (ctx.b.has(t.key)) return fit(ctx.b.get(t.key), t.n, ctx.f, false);
    const d = rnd(ctx, top + 1);
    return ctx.f.negbrahm && ctx.r() < 0.5 ? -d : d;
  };
  if (t.kind === "*") {
    fn.lo = (ctx) => (ctx.b.has(t.key) ? fn(ctx) : ctx.f.negbrahm ? -top : 0);
    fn.hi = (ctx) => (ctx.b.has(t.key) ? fn(ctx) : top);
  }
  fn.only = t.key;
  return fn;
}
function fitLetters(v, n) {
  const s = typeof v === "string" ? v : String(v);
  return s.length > n ? s.slice(-n) : s; // (cut from the front, as an asterisk's digits are)
}
/* ~: about, give or take a tenth of it: ~10 is 9 to 11, ~1.5 is 1.4 to 1.6 */
function about(a) {
  const fn = (ctx) => {
    const v = num(a(ctx), "~'s value"),
      lo = Math.min(v * 0.9, v * 1.1),
      hi = Math.max(v * 0.9, v * 1.1);
    if (Number.isInteger(v) && !a.tenths) {
      const l = Math.ceil(lo - 1e-9),
        h = Math.floor(hi + 1e-9);
      return l + rnd(ctx, h - l + 1);
    }
    const l = Math.ceil(lo * 10 - 1e-9),
      h = Math.floor(hi * 10 + 1e-9);
    return (l + rnd(ctx, Math.max(1, h - l + 1))) / 10;
  };
  fn.tenths = a.tenths;
  return fn;
}
/* a percent alone: how many times. 30% is 1 three times in 10 (else 0); 150% is once for sure and a second time half
   the time; 250% twice and half the time a third */
function percent(a) {
  return (ctx) => {
    const p = Math.max(0, num(a(ctx), "A percent")),
      whole = Math.floor(p / 100);
    return whole + (ctx.r() < (p - whole * 100) / 100 ? 1 : 0);
  };
}

/* ---------- the line rules this part reads: \'ainc mormax'\ and the others of section 5 ----------
   The rest of the line rules (inc0, rm0, lin, limits …) are part B */
function lineRules(toks, f) {
  let k = 0;
  while (k < toks.length && (toks[k].t === "sp" || toks[k].t === "bs")) {
    const t = toks[k];
    if (t.t === "bs") {
      if (/^[<>]/.test(t.v)) break; // (a repeat, not a rule)
      const m = /^'ainc\s+([a-z]+)'$/.exec(t.v.trim());
      if (!m) no(`The line rule "\\${t.v}\\" isn't built yet`);
      if (!RULE_WORDS.includes(m[1]))
        no(`"${m[1]}" isn't an asterisk rule (${RULE_WORDS.join(", ")})`);
      f[m[1]] = true;
    }
    k++;
  }
  return toks.slice(k);
}

/* ---------- compile: a line of Numberat into a program ----------
   { ok: true, prog } or { ok: false, why }. prog.run(r) gives { v } (a number, letters, t/f or NOTHING) or { why } */
export function compile(text) {
  try {
    const toks = lex(text).filter((t) => t.t !== "nl" || false);
    return { ok: true, prog: build(toks) };
  } catch (e) {
    if (e instanceof NbError) return { ok: false, why: e.why };
    throw e;
  }
}
function build(toks0) {
  const f = {},
    toks = lineRules(toks0, f),
    prog = { states: [], f };
  const p = new Parser(toks, prog);
  const segs = p.program().map((s, k, all) => ({
    ...s,
    def: !!s.node.def && k < all.length - 1, // (a segment that only names a value, before the one that gives it)
    len: s.node.len || 1,
  }));
  for (const s of segs)
    if (s.back && s.node.st) s.node.st.back = !s.node.st.back;
  const vals = segs.map((s, k) => (s.def ? -1 : k)).filter((k) => k >= 0);
  const st = { cur: 0, used: 0, limit: null }; // (cur: which of vals plays now)
  prog.reset = () => {
    st.cur = 0;
    st.used = 0;
    st.limit = null;
    for (const s of prog.states) s.reset();
  };
  prog.run = (r = Math.random) => {
    const ctx = { r, b: new Map(), f, fresh: new Set() };
    try {
      let last = NOTHING;
      for (const s of segs) {
        if (!s.def) continue;
        const n = s.count ? s.count(ctx) : 1;
        for (let j = 0; j < Math.min(n, MOST); j++) last = s.node(ctx);
      }
      if (!vals.length) return { v: out(last) };
      // (a part whose count came out 0 plays nothing: the next one plays. Once round, the line gives nothing)
      for (let tries = 0; tries <= vals.length; tries++) {
        const s = segs[vals[st.cur]];
        if (st.limit == null) {
          const n = s.count
            ? s.count(ctx)
            : st.cur === vals.length - 1
              ? Infinity
              : 1;
          st.limit = n === Infinity ? Infinity : n * s.len;
        }
        if (st.limit === 0) {
          next();
          continue;
        }
        const v = s.node(ctx);
        if (++st.used >= st.limit) next();
        return { v: out(v) };
      }
      return { v: NOTHING };
    } catch (e) {
      if (e instanceof NbError) return { why: e.why };
      throw e;
    }
  };
  function next() {
    st.cur = (st.cur + 1) % vals.length; // (the last one done: the line starts over)
    st.used = 0;
    st.limit = null;
  }
  return prog;
}

/* ---------- a whole file: its lines (a line carries on while a bracket is open), each compiled ----------
   { n: lines read, errs: [{ line, why }], lines: [{ line, prog }] } */
export function compileFile(text) {
  const errs = [],
    lines = [];
  let toks;
  try {
    toks = lex(text);
  } catch (e) {
    if (!(e instanceof NbError)) throw e;
    const at = String(text).split("\n").length;
    return { n: 0, errs: [{ line: at, why: e.why }], lines };
  }
  let cur = [];
  const flush = () => {
    const real = cur.filter((t) => t.t !== "sp");
    if (real.length) {
      const line = real[0].line;
      try {
        lines.push({ line, prog: build(cur) });
      } catch (e) {
        if (!(e instanceof NbError)) throw e;
        errs.push({ line, why: e.why });
      }
    }
    cur = [];
  };
  for (const t of toks) {
    if (t.t === "nl") flush();
    else cur.push(t);
  }
  flush();
  return { n: lines.length + errs.length, errs, lines };
}

/* the words Numberat knows so far, for the window's autocomplete */
export const NB_WORDS = ["true", "false", "ainc", ...RULE_WORDS];
