/* ---------- Seriat: shuffle and escape (bible section 19), and Seriat's errors ----------
   The parts seriat.js (the values) and seriatrun.js (the files) share for section 19; no imports. */
export class NbError extends Error {
  constructor(why) {
    super(why);
    this.why = why;
  }
}
/* ---------- shuffle and escape (bible section 19; the owner's, Nov 21 16:29Z, 16:34Z, confirmed 16:38Z) ----------
   "Shuffle = the bag: each value plays once, in a random order, then they all shuffle again". ";" between values is a
   bag of them ("2;4;6"), next to a range's colon a bag of its numbers ("2;:6"). A mark \;\ makes the true random
   (",") and the ranges after it bags: \<;\ before it, \;>\ after it, both through every | of the line; >\;\ after
   it to the next |; \;!\ the whole file or box (more ! wins); \;3\ three passes through the bag, then plain random.
   \esc\ leaves the bracket it's in at once, \esc2\ two, \esc!\ all; a bracket left gives nothing, a { }= left keeps
   what its name had, and a repeat it reaches ends there and the line goes on */
export class Esc extends NbError {
  constructor(n) {
    super("\\esc\\ has no bracket to leave here");
    this.n = n; // (brackets still to leave: Infinity for \esc!\)
  }
}
export const ESC = /^\s*esc\s*(\d+|!)?\s*$/i;
const SHUF = /^\s*(<)?\s*;\s*(\d+)?\s*(>)?\s*(!*)\s*$/;
export const isMark = (t) =>
  t.t === "bs" && (SHUF.test(t.v) || /^\s*\d*\s*esc\s*(\d+|!)?\s*$/i.test(t.v));
/* the \;\ marks of a line (or, wide, only the \;!\ ones of a whole file): each "," and ":" they reach is marked
   { n: passes, str: its !s } and the marks are taken out */
export function markShuffles(toks, wide = false) {
  if (!toks.some((t) => t.t === "bs" && SHUF.test(t.v))) return toks;
  const kept = [],
    marks = [];
  for (const t of toks) {
    const m = t.t === "bs" && SHUF.exec(t.v);
    if (!m || (wide && !m[4])) {
      kept.push(t);
      continue;
    }
    let k = kept.length - 1;
    while (k >= 0 && kept[k].t === "sp") k--;
    const out =
      !m[1] &&
      !m[3] &&
      k === kept.length - 1 &&
      kept[k] &&
      kept[k].t === "op" &&
      kept[k].v === ">"; // (>\;\: the arrow outside)
    if (out) kept.pop();
    marks.push({
      at: kept.length,
      back: !!m[1] && !m[3],
      all: !!m[4] || (!!m[1] && !!m[3]),
      bar: out,
      n: m[2] ? +m[2] : Infinity,
      str: m[4].length,
    });
  }
  for (const mk of marks) {
    let a = mk.all || mk.back ? 0 : mk.at,
      b = mk.all || !mk.back ? kept.length : mk.at;
    if (mk.bar)
      for (let k = a; k < b; k++)
        if (kept[k].t === "op" && (kept[k].v === "|" || kept[k].v === "||")) {
          b = k;
          break;
        }
    for (let k = a; k < b; k++) {
      const t = kept[k];
      if (t.t === "op" && (t.v === "," || t.v === ":"))
        if (!t.shuf || mk.str >= t.shuf.str) t.shuf = { n: mk.n, str: mk.str };
    }
  }
  return kept;
}
/* a bag's next: k of n, each once in a shuffled order, then again; after n passes (passes) plain random */
export function deal(ctx, st, size, passes) {
  if (st.size !== size)
    Object.assign(st, { size, left: size, sw: {}, pass: 0 });
  if (st.pass >= passes) return rnd(ctx, size);
  if (st.left <= 0) {
    if (++st.pass >= passes) return rnd(ctx, size);
    st.left = size;
    st.sw = {};
  }
  const j = rnd(ctx, st.left),
    at = st.sw[j] ?? j; // (a shuffle that never lists every number: a big range costs no more than a small one)
  st.sw[j] = st.sw[st.left - 1] ?? st.left - 1;
  delete st.sw[st.left - 1];
  st.left--;
  return at;
}
export const bagState = () => ({
  size: -1,
  left: 0,
  sw: {},
  pass: 0,
  reset() {
    Object.assign(this, { size: -1, left: 0, sw: {}, pass: 0 });
  },
});

const rnd = (ctx, n) => Math.min(n - 1, Math.floor(ctx.r() * n)); // (0 … n-1, as seriat.js)
/* a file's line for seriatrun.js' statements: its pieces with the breaks inside { } blocks and the statements' ";" as
   seps (a ";" with a value on both sides is a bag: "2;4", "2;:6") */
export function stmtToks(toks) {
  const T = [];
  toks = markShuffles(toks);
  toks.forEach((t, k) => {
    if (t.t === "sp") {
      if (t.soft) T.push({ t: "sep", line: t.line });
    } else if (t.t === "op" && t.v === ";" && !bagSemi(toks, k))
      T.push({ t: "sep", line: t.line });
    else T.push(t);
  });
  return T;
}
function bagSemi(toks, k) {
  const near = (d) => {
    for (let j = k + d; j >= 0 && j < toks.length; j += d)
      if (toks[j].t !== "sp") return toks[j];
    return null;
  };
  const a = near(-1),
    b = near(1),
    op = (t, set) => !!t && t.t === "op" && set.includes(t.v),
    val = (t) => !!t && ["num", "name", "let"].includes(t.t);
  return (
    (val(a) || op(a, [")", "]", ":"])) &&
    (val(b) || op(b, ["(", "[", "{", ":", "~", '"']))
  );
}
