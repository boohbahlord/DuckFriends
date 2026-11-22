/* ---------- Seriat: the language (part A: values) ----------
   The rules are in notes/seriat-bible.md (the source of truth). This part is sections 0 to 5 and the percent picks
   (14.4): plain values, ranges, tenths, the asterisks and the $ letters, ~, order arrows and repeats, the four kinds of
   brackets, math, = and the asterisk rules mormax, mormini, negbrahm, posbrahm and caps; and section 19, shuffle (the
   bag: ";", the \;\ marks) and \esc\ (leave a bracket).
   "this code is like math, components give rise to new logical possibilities", so every piece is a small part that
   fits into every other: a range can be a list item, a list can be a range's end, anything can be named and used again.
   A text is compiled once (compile()) into small steps, plain functions, so a spawn only runs those (bible section 12).
   A program keeps its own place in its orders and repeats between runs (spawn 1, spawn 2 ...); each run starts its
   inputs (the asterisks) and its { } groups over.
   Bad writing never breaks the game: compile() and run() give { why } and the caller keeps its last good value.
   It imports only seriatbag.js (shuffle and escape), so the rules, the boxes and the Seriat window all use this one
   compiler. */

import {
  NbError,
  Esc,
  ESC,
  isMark,
  markShuffles,
  deal,
  bagState,
} from "./seriatbag.js";

export const NOTHING = Symbol("nothing"); // (a pick that landed on "do nothing", or a repeat that played 0 times)
const MOST = 1000; // a repeat plays at most this many times
const RULE_WORDS = ["mormax", "mormini", "negbrahm", "posbrahm", "caps"];

/* an error says why, and which help page tells more */
const no = (why, page) => {
  throw new NbError(page ? `${why}. See ${page}` : why);
};

/* ---------- reading the text into pieces ---------- */
const isDigitish = (c) => /[0-9*]/.test(c);
function lex(text) {
  const out = [],
    src = String(text == null ? "" : text);
  let i = 0,
    line = 1,
    depth = 0,
    say = false; // (after print or say: quotes are text, as in bash)
  const push = (t, v, extra = {}) => out.push({ t, v, line, ...extra });
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") {
      // (a line carries on while a bracket is still open; inside a { } block the break still ends a statement)
      push(depth > 0 ? "sp" : "nl", "\n", depth > 0 ? { soft: true } : {});
      line++;
      i++;
      say = false;
      continue;
    }
    if (say && (c === '"' || c === "'")) {
      const end = src.indexOf(c, i + 1);
      if (end < 0 || src.slice(i + 1, end).includes("\n"))
        no(`A ${c} is never closed`, "help/brains/print.txt");
      push("str", src.slice(i + 1, end), { q: c });
      i = end + 1;
      continue;
    }
    if (c === ";" || c === "}") say = false;
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
        m = /^(\d+)(\*+|\$+)$/.exec(raw),
        f = /^(\*+|\$+)(\d+)$/.exec(raw); // ('*1' is the same as '1*', the owner's, Nov 19)
      if (m || f)
        push("name", raw, {
          key: "'" + (m ? m[1] + m[2][0] : f[2] + f[1][0]),
          n: (m ? m[2] : f[1]).length,
          kind: (m ? m[2] : f[1])[0],
        });
      // ('1*' is asterisk number 1, '2***' number 2 with three digits, '1$' a named letter)
      else push("quote", raw);
      i = end + 1;
      continue;
    }
    /* \move\{ … }: a movement, its inside read as it is (/\ up and \/ down are its arrows, the owner's, Nov 20 18:46Z);
       \move\ with no { takes the rest of its line */
    const mv = c === "\\" && /^\\[ \t]*move[ \t]*\\[ \t]*/i.exec(src.slice(i));
    if (mv) {
      let j = i + mv[0].length,
        end;
      if (src[j] === "{") {
        end = src.indexOf("}", j + 1);
        if (end < 0)
          no("A \\move\\{ is never closed with }", "help/brains/move.txt");
        push("move", src.slice(j + 1, end));
        end++;
      } else {
        end = src.indexOf("\n", j);
        if (end < 0) end = src.length;
        push("move", src.slice(j, end));
      }
      line += (src.slice(i, end).match(/\n/g) || []).length;
      i = end;
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
      /* the owner's, Nov 19: "It should just be called regen HP": "regen hp" is the stat regen, in two words (regen alone
         still reads, for files written before) */
      const hp = /^regen$/i.test(w) && /^[ \t]+hp\b/i.exec(src.slice(i));
      if (hp) i += hp[0].length;
      push("word", w.toLowerCase());
      if (/^(print|say)$/i.test(w)) say = true;
      continue;
    }
    if ("([{".includes(c)) depth++;
    if (")]}".includes(c)) depth = Math.max(0, depth - 1);
    if ('()[]{}+-/^:,<>|=~%"!;'.includes(c)) {
      push("op", c);
      i++;
      continue;
    }
    no(`"${c}" isn't part of Seriat`);
  }
  return out;
}

/* ---------- the parts, each compiled to a function of the run (ctx) ----------
   ctx: { r: random numbers, b: the inputs named so far (Map), R: the line's rules (judge()), fresh: the { } started } */
const rnd = (ctx, n) => Math.min(n - 1, Math.floor(ctx.r() * n)); // (0 … n-1)
const tenth = (n) => Math.round(n * 10) / 10;
const out = (v) => (typeof v === "number" ? tenth(v) : v); // (a result keeps tenths at most)
const step = (ctx) => (ctx.box && ctx.box.kind === "half" ? 20 : 10); // (a box in half tenths: an elevation)
const outIn = (ctx, v) =>
  typeof v === "number" ? Math.round(v * step(ctx)) / step(ctx) : v;
const num = (v, what = "this") => {
  if (v === NOTHING) no(`${what} came out as nothing`);
  if (typeof v === "string") no(`Letters can't do math ("${v}")`);
  if (typeof v === "boolean") no("t and f can't do math");
  return v;
};

/* an input put into an asterisk: cut to its digits, its sign as the rules say (bible section 5) */
function fit(v, n, F, neg) {
  const f = {
    posbrahm: F("posbrahm"),
    negbrahm: F("negbrahm"),
    mormini: F("mormini"),
    mormax: F("mormax"),
  };
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
function letters(ctx, n, key) {
  let s = "";
  for (let k = 0; k < n; k++) {
    const l = LETTERS[rnd(ctx, 26)];
    s += ctx.R.flag("caps", key) && ctx.r() < 0.5 ? l.toUpperCase() : l;
  }
  return s;
}

/* a number written with asterisks in it (1.*, *.*, **, 1*): each * a digit. which: "" a random one, "lo" its smallest,
   "hi" its biggest (a range's ends) */
function digits(ctx, int, frac, which) {
  const d = (ch) =>
    ch === "*"
      ? which === "lo"
        ? 0
        : which === "hi"
          ? 9
          : draw(ctx, "*1", () => rnd(ctx, 10)) // (each * is a digit the asterisk rules can take out)
      : +ch;
  let v = 0;
  for (const ch of int) v = v * 10 + d(ch);
  let p = 0.1;
  for (const ch of frac) {
    v += d(ch) * p;
    p /= 10;
  }
  return tenth(v);
}

/* words that do a job in values (anything else is a name: a let, a stat, wave …) */
const FN1 = {
  round: (v) => Math.round(v),
  up: (v) => Math.ceil(v - 1e-9),
  down: (v) => Math.floor(v + 1e-9),
};
/* an NPC's stats, read and set by name (seriatrun.js): "z hp" is NPC z's HP */
export const NB_STATS = ["hp", "speed", "damage", "hitbox", "regen"]; // (regen: HP back each second, written "regen hp" as the owner named it (lex), "regen" alone too: sbgroups.js)
/* a zone's, read and set the same way inside a zone's file, or from another file by its name: zone 'Pit' steps (the
   owner's yes, Nov 20 03:10Z). steps: how many steps its squares took; squares: how many work at once; size: a square's
   size in duck lengths; inside: how many players stand in it */
export const NB_ZONE_STATS = ["steps", "squares", "size", "inside"];
export const NB_ALL_STATS = [...NB_STATS, ...NB_ZONE_STATS];
const RESERVED = new Set([
  "else",
  "in",
  "not",
  "and",
  "or",
  "xor",
  "nand",
  "mod",
  "if",
  "s",
]);

/* ---------- the parser ---------- */
class Parser {
  constructor(toks, prog) {
    toks = markShuffles(toks);
    this.toks = toks.filter((t) => t.t !== "sp");
    this.esc = this.toks.some((t) => t.t === "bs" && ESC.test(t.v)); // (only a line with \esc\ wraps its brackets)
    this.raw = toks; // (spaces kept, for a value and its percent: "3 60%")
    this.i = 0;
    this.prog = prog;
    this.quoted = 0; // (inside "…": side by side multiplies)
    this.braces = []; // (the { } groups being read: their parts start over each run)
  }
  peek(o = 0) {
    if (this.end != null && this.i + o >= this.end) return undefined; // (a statement's value stops at its line's end)
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
    return this.i >= (this.end != null ? this.end : this.toks.length);
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
      ctx.left = false;
      const v = left(ctx);
      if (!(ctx.left && v === NOTHING)) ctx.b.set(key, v); // (a { }= left with \esc\ keeps what was picked before)
      ctx.left = false;
      return right(ctx);
    };
    fn.def = right.only === key; // (a line that only names: "{…}='1*'")
    fn.key = key;
    return fn;
  }

  /* > and <: the listed values in order. An arrow first fixes the start; side by side groups take turns */
  seq() {
    if (this.noArrows) return this.juxt(); // (inside \if …\, < and > compare)
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
  /* a bracket \esc\ can leave: it gives nothing, and one bracket fewer is left to leave */
  leave(f) {
    if (!this.esc) return f;
    const g = (ctx) => {
      try {
        return f(ctx);
      } catch (e) {
        if (!(e instanceof Esc) || --e.n > 0) throw e;
        ctx.left = true;
        return NOTHING;
      }
    };
    return Object.assign(g, f); // (its parts' marks: len, st, opts, span …)
  }

  /* , : one of these, true random. With percents: "[3 60%, 5 40%]" */
  choice() {
    const items = [this.bagItem()];
    let shuf = null;
    while (this.is(",")) {
      shuf = shuf || this.peek().shuf;
      this.i++;
      items.push(this.bagItem());
    }
    if (items.length === 1 && !items[0].w) return items[0].v;
    const weighted = items.filter((x) => x.w).length;
    if (weighted && weighted !== items.length)
      no("Give every choice a percent, or none of them");
    if (shuf && !weighted)
      return this.bag(
        items.map((x) => x.v),
        shuf.n,
      ); // (a "," a \;\ mark reaches: a bag)
    if (!weighted) {
      const vs = items.map((x) => x.v);
      const fn = (ctx) => vs[rnd(ctx, vs.length)](ctx);
      fn.opts = vs; // (for "in" and "for": each of them)
      return fn;
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
  /* ; : a bag, tighter than "," ("2,4;6" is 2, or the bag of 4 and 6) */
  bagItem() {
    const first = this.item();
    if (!this.is(";")) return first;
    const items = [first];
    while (this.is(";")) {
      this.i++;
      items.push(this.item());
    }
    if (items.some((x) => x.w)) no('A shuffle (";") takes no percents');
    return {
      v: this.bag(
        items.map((x) => x.v),
        Infinity,
      ),
    };
  }
  /* a bag of these values: each once, shuffled, then again (after passes passes: plain random) */
  bag(vs, passes) {
    const st = this.state(bagState());
    const fn = (ctx) => vs[deal(ctx, st, vs.length, passes)](ctx);
    fn.opts = vs; // (for "in" and "for": each of them)
    return fn;
  }
  /* one choice: a value, a value and its percent ("3 60%"), or a percent alone ("30%": true 3 times in 10) */
  item() {
    const v = this.sum();
    if (this.is("%")) {
      this.i++;
      return { v: percent(v) };
    }
    if (this.startsValue() && !this.quoted) {
      const at = this.i,
        named = this.names && this.names.length;
      let w = null;
      try {
        w = this.sum();
      } catch (e) {
        if (!(e instanceof NbError)) throw e;
      }
      if (w && this.is("%")) {
        this.i++;
        return { v, w };
      }
      if (w && this.peek() && this.peek().t !== "word" && !this.end)
        this.take("%");
      this.i = at; // (a word after a value: the statement's next part, not a percent)
      if (this.names) this.names.length = named;
    }
    return { v };
  }
  startsValue() {
    const t = this.peek();
    if (!t) return false;
    if (t.t === "num" || t.t === "name" || t.t === "let") return true;
    if (t.t === "word") return !RESERVED.has(t.v);
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
    for (;;) {
      const mod =
        this.peek() && this.peek().t === "word" && this.peek().v === "mod";
      if (!this.is("/") && !mod) return a;
      this.i++;
      const l = a,
        r = this.product();
      a = (ctx) => {
        const d = num(r(ctx));
        if (d === 0) no("Can't divide by 0", "help/math/math.txt");
        const n = num(l(ctx));
        return mod ? ((n % d) + d) % d : n / d; // (mod: what's left over, spawned mod 3)
      };
    }
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
    let bag = null; // ("2;:6" and "2:;6": a bag of every number; a ":" a \;\ mark reaches too)
    if (this.is(";") && this.is(":", 1)) {
      this.i += 2;
      bag = Infinity;
    } else if (this.is(":")) {
      const c = this.toks[this.i++];
      if (this.is(";")) {
        this.i++;
        bag = Infinity;
      } else if (c.shuf) bag = c.shuf.n;
    } else return a;
    const b = this.atom(),
      st = bag ? this.state(bagState()) : null;
    const tenths = !!(a.tenths || b.tenths);
    const span = (ctx) => {
      let lo = num(a.lo ? a.lo(ctx) : a(ctx), "A range's start"),
        hi = num(b.hi ? b.hi(ctx) : b(ctx), "A range's end");
      if (lo > hi) [lo, hi] = [hi, lo]; // (4:2 is 2 to 4)
      return [lo, hi, tenths || !Number.isInteger(lo) || !Number.isInteger(hi)];
    };
    const pick = (ctx, n) => (st ? deal(ctx, st, n, bag) : rnd(ctx, n));
    const fn = (ctx) => {
      const [lo, hi, t10] = span(ctx);
      if (t10) {
        const k = step(ctx),
          l = Math.round(lo * k),
          h = Math.round(hi * k);
        if (h < l) return outIn(ctx, lo);
        return (l + pick(ctx, h - l + 1)) / k;
      }
      return lo + pick(ctx, hi - lo + 1);
    };
    fn.span = span; // (for "in" and "for": every number of the range)
    return fn;
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
      if (FN1[t.v]) {
        const a = this.unary(),
          f = FN1[t.v]; // (round 2.5 is 3, up 2.1 is 3, down 2.9 is 2)
        return (ctx) => f(num(a(ctx), `${t.v}'s value`));
      }
      if (t.v === "min" || t.v === "max") {
        const a = this.unary(),
          b = this.unary(),
          f = Math[t.v]; // (min 3 hp: the smaller of 3 and hp)
        return (ctx) => f(num(a(ctx)), num(b(ctx)));
      }
      if (RESERVED.has(t.v)) no(`"${t.v}" can't start a value`);
      const zq = t.v === "zone" ? this.peek() : null;
      if (zq && zq.t === "quote") {
        this.i++;
        const zs = this.peek();
        if (!zs || zs.t !== "word" || !NB_ZONE_STATS.includes(zs.v))
          no(
            `zone '${zq.v}' what? ${NB_ZONE_STATS.join(", ")}`,
            "help/brains/names.txt",
          );
        this.i++; // (zone 'Pit' steps: zone Pit's steps)
        return (ctx) => {
          if (!ctx.zone)
            no(
              `"zone '${zq.v}' ${zs.v}" is a zone's: it works in files`,
              "help/brains/names.txt",
            );
          return ctx.zone(zq.v, zs.v);
        };
      }
      if (this.names) this.names.push({ v: t.v, line: t.line });
      const st = this.peek();
      if (
        st &&
        st.t === "word" &&
        NB_ALL_STATS.includes(st.v) &&
        !NB_STATS.includes(t.v)
      ) {
        this.i++; // (z hp: NPC z's HP)
        return (ctx) => {
          if (!ctx.stat)
            no(
              `"${t.v} ${st.v}" is an NPC's: it works in files`,
              "help/brains/names.txt",
            );
          return ctx.stat(t.v, st.v);
        };
      }
      return (ctx) => {
        if (!ctx.name)
          no(
            `"${t.v}" isn't a value here (names work in files)`,
            "help/brains/names.txt",
          );
        return ctx.name(t.v);
      };
    }
    if (t.t === "bs") {
      const e = ESC.exec(t.v);
      if (e) {
        this.i++;
        const n = !e[1] ? 1 : e[1] === "!" ? Infinity : +e[1];
        if (n < 1)
          no("\\esc0\\ leaves nothing: write \\esc\\, \\esc2\\ or \\esc!\\");
        return () => {
          throw new Esc(n);
        };
      }
      if (/^\s*\d+\s*esc\s*$/i.test(t.v))
        no("The number goes after esc: \\esc2\\");
      const rep = this.repeatOf(t.v);
      if (!rep) no(`"\\${t.v}\\" can't go here`);
      this.i++;
      const a = this.atom(); // (\>1,2>\[…]: play what follows 1 or 2 times, the last play counts)
      if (rep.back && a.st) a.st.back = !a.st.back;
      return (ctx) => {
        const n = rep.count ? rep.count(ctx) : 1;
        if (n === Infinity) no("A repeat in a value needs a count");
        let v = NOTHING;
        try {
          for (let k = 0; k < n; k++) v = a(ctx);
        } catch (x) {
          if (!(x instanceof Esc)) throw x; // (left with \esc\: the repeat ends there)
        }
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
        return this.leave(inner);
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
        return this.leave(fn);
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
  const F = (ctx) => (x) => ctx.R.flag(x, key);
  const fn = (ctx) => {
    if (ctx.b.has(key))
      return kept(ctx, fit(ctx.b.get(key), n, F(ctx), neg), key);
    if (ctx.b.has("*" + n) && neg)
      return kept(ctx, fit(ctx.b.get("*" + n), n, F(ctx), true), key);
    return draw(ctx, key, () => {
      const lim = inBox(
        ctx,
        neg && !ctx.R.flag("posbrahm", key)
          ? -top
          : neg || ctx.R.flag("negbrahm", key)
            ? -top
            : 0,
        neg && !ctx.R.flag("posbrahm", key) ? 0 : top,
      );
      if (lim != null) return lim;
      const d = rnd(ctx, top + 1);
      if (neg) return ctx.R.flag("posbrahm", key) && ctx.r() < 0.5 ? d : -d;
      return ctx.R.flag("negbrahm", key) && ctx.r() < 0.5 ? -d : d; // (negbrahm: below zero too)
    });
  };
  fn.lo = (ctx) =>
    ctx.b.has(key) ? fn(ctx) : neg || ctx.R.flag("negbrahm", key) ? -top : 0;
  fn.hi = (ctx) =>
    ctx.b.has(key) ? fn(ctx) : neg && !ctx.R.flag("posbrahm", key) ? 0 : top;
  fn.only = key;
  return fn;
}
/* an asterisk with no input: a random value, again until the asterisk rules let it (\'arm0'\) */
function draw(ctx, key, roll) {
  for (let k = 0; k < MOST_TRIES; k++) {
    const v = roll();
    if (!ctx.R.astOut(v, key)) return v;
  }
  no(`The asterisk rules take out every value this asterisk can give`, RULES);
}
/* an input an asterisk rule takes out: the line plays again */
function kept(ctx, v, key) {
  if (ctx.R.astOut(v, key)) throw REPLAY;
  return v;
}
/* '1*', '2***', '1$': a named asterisk or letter, the number in quotes its name (never part of the value) */
function named(t) {
  const top = 10 ** t.n - 1;
  const F = (ctx) => (x) => ctx.R.flag(x, t.key);
  const fn = (ctx) => {
    if (t.kind === "$")
      return ctx.b.has(t.key)
        ? fitLetters(ctx.b.get(t.key), t.n)
        : letters(ctx, t.n, t.key);
    if (ctx.b.has(t.key))
      return kept(ctx, fit(ctx.b.get(t.key), t.n, F(ctx), false), t.key);
    return draw(ctx, t.key, () => {
      const lim = inBox(ctx, ctx.R.flag("negbrahm", t.key) ? -top : 0, top);
      if (lim != null) return lim;
      const d = rnd(ctx, top + 1);
      return ctx.R.flag("negbrahm", t.key) && ctx.r() < 0.5 ? -d : d;
    });
  };
  if (t.kind === "*") {
    fn.lo = (ctx) =>
      ctx.b.has(t.key) ? fn(ctx) : ctx.R.flag("negbrahm", t.key) ? -top : 0;
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

/* ---------- line rules (bible section 6): \ ... \ at the start of a line ----------
   A rule: { str: how many !, scope: "line" | "file" | "lines" (with lines: the line numbers it covers), ast: null (the
   line's result) | "all" (asterisks only) | a number (that named asterisk only), act: "inc" | "rm", what }. what is
   { k: "set", has(v) } (numbers), { k: "digits", lo, hi } (results with that many digits), { k: "flag", name } (mormax
   …) or { k: "lim", fn } (the line's limit; fn null: no limit, the hidden cap). The strongest rule wins (more !), then
   the later one. Readings: the quotes are only marks (\'inc0'\ = \inc'0'\); a rule's own value can be any Seriat
   value, and it covers every number that value can give ('n[1,5,[1:4]]' is lines 1 to 5) */
const CAP = 1000000; // (\rm'lim'\: "no limit on this line (hidden cap 1,000,000)")
const RULES = "help/numbers/linerules.txt";
function parseRule(raw, line, order) {
  const r = {
    str: 0,
    scope: "line",
    lines: null,
    ast: null,
    act: null,
    what: null,
    line,
    order,
  };
  let lin = false;
  const bits = raw.split("'").filter((x) => x.trim() !== "");
  const bad = () => no(`"\\${raw}\\" isn't a line rule I know`, RULES);
  for (let k = 0; k < bits.length; k++) {
    let b = bits[k].trim();
    while (b) {
      let m;
      if ((m = /^!+/.exec(b))) r.str += m[0].length;
      else if (b[0] === "[") {
        // (math on !: a strength that is a Seriat value, like \lin["**"=!]'inc1'\; the owner's, Nov 19)
        let d = 0,
          e = 0;
        for (; e < b.length; e++) {
          if (b[e] === "[") d++;
          else if (b[e] === "]" && --d === 0) break;
        }
        if (d) bad();
        r.str = strength(b.slice(1, e).replace(/=\s*!+\s*$/, ""));
        m = [b.slice(0, e + 1)];
      } else if ((m = /^lin\b|^lin(?=!)/.exec(b))) lin = true;
      else if ((m = /^n(?=[\d[({*~-])/.exec(b))) {
        const rest = b.slice(1),
          cut = /\s+(?=a\d|a?inc|a?rm|lin|!)/.exec(rest); // ('n2:3 rm0': the lines, then the rule)
        r.lines = possible(
          cut ? rest.slice(0, cut.index) : rest,
          "Which lines",
        );
        b = cut ? rest.slice(cut.index).trim() : "";
        continue;
      } else if ((m = /^a(\d+)(?!\d)/.exec(b))) r.ast = +m[1];
      else if ((m = /^a(?=inc|rm)/.exec(b))) r.ast = r.ast || "all";
      else if ((m = /^(inc|rm)/.exec(b))) {
        r.act = m[1];
        let rest = b.slice(m[0].length).trim();
        if (!rest && k + 1 < bits.length) rest = bits[++k].trim(); // (\inc'lim=25'\)
        if (!rest) no(`"\\${raw}\\" says ${r.act} but not what`, RULES);
        r.what = subject(rest, r.act);
        b = "";
        continue;
      } else bad();
      b = b.slice(m[0].length).trim();
    }
  }
  if (!r.act) bad();
  if (r.lines) r.scope = "lines";
  else if (r.str > 0 && !lin) r.scope = "file";
  if (r.what.k === "flag" && r.ast == null) r.ast = "all"; // (mormax and the others are about asterisks)
  return r;
}
function subject(text, act) {
  const t = text.replace(/\s+/g, " ").trim();
  if (RULE_WORDS.includes(t)) return { k: "flag", name: t };
  if (/^[a-z]+$/.test(t) && t !== "lim")
    no(`"${t}" isn't a rule word (${RULE_WORDS.join(", ")}, lim)`, RULES);
  if (t === "lim") {
    if (act === "inc") no(`Give the limit: \\inc'lim=25'\\`, "help/limits.txt");
    return { k: "lim", fn: null };
  }
  const m = /^lim\s*=\s*([\s\S]+)$/.exec(t);
  if (m) {
    if (act === "rm")
      no(`\\rm'lim'\\ takes no number (it means no limit)`, "help/limits.txt");
    return { k: "lim", fn: sub(m[1], "A limit") };
  }
  const d = /^(\*+)(?::(\*+))?$/.exec(t);
  if (d) return { k: "digits", lo: d[1].length, hi: (d[2] || d[1]).length };
  return { k: "set", has: possible(t, "A rule's value").has };
}
/* a bit of Seriat inside a rule, compiled as a value */
function strength(text) {
  const fn = sub(text, "A strength");
  let r = 12345;
  const rand = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  try {
    const v = fn(newCtx(rand, NO_RULES));
    if (typeof v !== "number")
      no(`A strength must be a number, not "${text}"`, RULES);
    return Math.max(0, Math.floor(v));
  } catch (e) {
    if (!(e instanceof NbError)) throw e;
    no(`A strength: ${e.why}`, RULES);
  }
}
function sub(text, what) {
  const p = new Parser(lex(text), { states: [] });
  const fn = p.expr();
  if (!p.done()) no(`${what}: "${text}" isn't one value`, RULES);
  return fn;
}
/* every number a value can give: exact for numbers, ranges and lists (brackets left out), else from many tries */
function possible(text, what) {
  const plain = text.replace(/[[\](){}\s]/g, "");
  const N = String.raw`-?\d+(?:\.\d)?`;
  if (new RegExp(`^${N}(?::${N})?(?:,${N}(?::${N})?)*$`).test(plain)) {
    const parts = plain.split(",").map((x) => {
      const [a, b = a] = x.split(":"),
        tenths = /\./.test(x);
      return { lo: Math.min(+a, +b), hi: Math.max(+a, +b), tenths };
    });
    return {
      has: (v) =>
        typeof v === "number" &&
        parts.some(
          (x) =>
            v >= x.lo - 1e-9 &&
            v <= x.hi + 1e-9 &&
            (x.tenths || Number.isInteger(v)),
        ),
    };
  }
  const fn = sub(text, what),
    seen = new Set();
  let r = 12345; // (a fixed seed, so a rule means the same thing every time)
  const rand = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let k = 0; k < 4000; k++) {
    const ctx = newCtx(rand, NO_RULES);
    try {
      const v = fn(ctx);
      if (typeof v === "number") seen.add(tenth(v));
    } catch (e) {
      if (!(e instanceof NbError)) throw e;
      no(`${what}: ${e.why}`, RULES);
    }
  }
  return { has: (v) => typeof v === "number" && seen.has(tenth(v)) };
}
const digitCount = (v) => String(Math.trunc(Math.abs(v))).length;
function covers(w, v) {
  if (w.k === "set") return w.has(v);
  if (w.k === "digits")
    return (
      typeof v === "number" && digitCount(v) >= w.lo && digitCount(v) <= w.hi
    );
  return false;
}
/* the rules a line follows, made into questions: is a flag on, is this number out, what's the limit */
function judge(rules) {
  const best = (test) => {
    let b = null;
    for (const r of rules)
      if (
        test(r) &&
        (!b ||
          r.str > b.str ||
          (r.str === b.str &&
            (r.line > b.line || (r.line === b.line && r.order > b.order))))
      )
        b = r;
    return b;
  };
  const astIs = (r, key) =>
    r.ast === "all" || (r.ast != null && key === "'" + r.ast + "*");
  const out = (v, test) => {
    const b = best((r) => test(r) && covers(r.what, v));
    return !!b && b.act === "rm";
  };
  const lim = best((r) => r.what.k === "lim");
  return {
    flag: (name, key) => {
      const b = best(
        (r) => r.what.k === "flag" && r.what.name === name && astIs(r, key),
      );
      return !!b && b.act === "inc";
    },
    astOut: (v, key) => out(v, (r) => astIs(r, key)),
    resOut: (v) => out(v, (r) => r.ast == null),
    lim: lim && { off: lim.act === "rm", fn: lim.what.fn },
    any: rules.some((r) => r.what.k !== "flag" && r.what.k !== "lim"),
  };
}
const NO_RULES = judge([]);
/* the rules written at the start of a line, and what's left: { rules, rest } */
function lineRules(toks, line) {
  const rules = [],
    kept = [];
  let k = 0;
  while (k < toks.length && (toks[k].t === "sp" || toks[k].t === "bs")) {
    const t = toks[k];
    if (t.t === "bs" && isMark(t))
      kept.push(t); // (\;\ and \esc\: the line's own, not rules)
    else if (t.t === "bs") {
      if (/^[<>]|^if\b/.test(t.v.trim())) break; // (a repeat or an \if …\, not a rule)
      rules.push(parseRule(t.v, t.line || line, rules.length));
    }
    k++;
  }
  return { rules, rest: [...kept, ...toks.slice(k)] };
}

/* ---------- compile: a line of Seriat into a program ----------
   { ok: true, prog } or { ok: false, why }. prog.run(r) gives { v, lim } (v a number, letters, t/f or NOTHING; lim the
   line's own limit when a rule gives one: a number, or CAP for no limit) or { why }. A box is a file of one line, so
   a file rule (\!'rm1'\) works there too */
export function compile(text) {
  const f = compileFile(text);
  if (f.errs.length) return { ok: false, why: f.errs[0].why };
  if (!f.lines.length) return { ok: false, why: "Write a value" };
  if (f.lines.length > 1)
    return { ok: false, why: "One line here (a box takes one value)" };
  return { ok: true, prog: f.lines[0].prog };
}
const REPLAY = Symbol("replay");
const MOST_TRIES = 1000; // ("stop after 1,000 tries; then the NPC doesn't spawn and an error says why")
function newCtx(r, R, box = null) {
  return { r, b: new Map(), R, fresh: new Set(), box };
}
/* an asterisk with no input, inside a box: a random value within its digits and the stat's limit (the bible, section
   5: "With none, it is a random value within its digits and the stat's limit"), lo … hi its digits'; null when the
   box gives no limits or none fits */
function inBox(ctx, lo, hi) {
  const b = ctx.box;
  if (!b || (b.min == null && b.max == null)) return null;
  const a = Math.max(lo, b.min != null ? Math.ceil(b.min) : lo),
    z = Math.min(hi, b.max != null ? Math.floor(b.max) : hi);
  return a <= z ? a + rnd(ctx, z - a + 1) : null;
}
function build(toks, rules) {
  const R = judge(rules),
    prog = { states: [] };
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
  /* one play of the line */
  const once = (ctx) => {
    let last = NOTHING;
    for (const s of segs) {
      if (!s.def) continue;
      const n = s.count ? s.count(ctx) : 1;
      try {
        for (let j = 0; j < Math.min(n, MOST); j++) last = s.node(ctx);
      } catch (e) {
        if (!(e instanceof Esc)) throw e; // (left with \esc\: the repeat ends, the line goes on)
      }
    }
    if (!vals.length) return outIn(ctx, last);
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
      let v;
      try {
        v = s.node(ctx);
      } catch (e) {
        if (!(e instanceof Esc)) throw e;
        next(); // (left with \esc\: this part ends, the next one plays)
        continue;
      }
      if (++st.used >= st.limit) next();
      return outIn(ctx, v);
    }
    return NOTHING;
  };
  /* a line rule took a result out: play again from the same place (orders don't move on), at most 1,000 times */
  const save = () => [
    { ...st },
    prog.states.map((x) => ({
      ...x,
      deck: x.deck && [...x.deck],
      sw: x.sw && { ...x.sw },
    })),
  ];
  const load = ([a, b]) => {
    Object.assign(st, a);
    prog.states.forEach((x, k) => Object.assign(x, b[k]));
  };
  prog.run = (r = Math.random, box = null, more = null) => {
    try {
      const was = R.any ? save() : null;
      let v = NOTHING,
        ctx;
      for (let tries = 0; ; tries++) {
        if (tries >= MOST_TRIES)
          no(
            `The line rules took out every value it gave, ${MOST_TRIES} times in a row (it can't spawn)`,
            RULES,
          );
        ctx = newCtx(r, R, box);
        if (more) Object.assign(ctx, more); // (a brain file's names: let rage = 3, then rage+1 on its own line)
        try {
          v = once(ctx);
        } catch (e) {
          if (e !== REPLAY) throw e;
          load(was);
          continue;
        }
        if (R.any && R.resOut(v)) {
          load(was);
          continue;
        }
        break;
      }
      let lim = null;
      if (R.lim) {
        if (R.lim.off) lim = CAP;
        else {
          const x = num(
            R.lim.fn.hi ? R.lim.fn.hi(ctx) : R.lim.fn(ctx),
            "A limit",
          );
          lim = Math.min(CAP, x);
        }
      }
      return { v, lim };
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
  toks = markShuffles(toks, true); // (\;!\: the whole file's)
  /* first the lines and their rules (a rule for the whole file or for other lines can sit anywhere), then each line */
  const all = [];
  let cur = [];
  const flush = () => {
    const real = cur.filter((t) => t.t !== "sp");
    if (real.length) {
      const line = real[0].line;
      try {
        const { rules, rest } = lineRules(cur, line);
        all.push({ line, rules, rest });
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
  const wide = all.flatMap((l) => l.rules.filter((r) => r.scope !== "line"));
  let ruleOnly = 0;
  for (const l of all) {
    if (!l.rest.some((t) => t.t !== "sp")) {
      ruleOnly++; // (a line of rules only: it gives no value)
      continue;
    }
    const mine = [
      ...l.rules.filter((r) => r.scope === "line"),
      ...wide.filter((r) => r.scope === "file" || r.lines.has(l.line)),
    ];
    try {
      lines.push({ line: l.line, prog: build(l.rest, mine) });
    } catch (e) {
      if (!(e instanceof NbError)) throw e;
      errs.push({ line: l.line, why: e.why });
    }
  }
  errs.sort((a, b) => a.line - b.line);
  return { n: lines.length + errs.length + ruleOnly, errs, lines };
}

/* the pieces the statements (seriatrun.js) build on */
export {
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
  possible,
  NO_RULES,
  MOST_TRIES,
  REPLAY,
};

/* the words Seriat knows so far, for the window's autocomplete */
export const NB_WORDS = [
  "true",
  "false",
  "ainc",
  "arm",
  "inc",
  "rm",
  "lin",
  "lim",
  "esc",
  ...RULE_WORDS,
];
