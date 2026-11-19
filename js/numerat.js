/* ---------- Numerat: the number reader (part 1, the boxes) ----------
   The owner's Numerat (Sandbox file, Nov 19): the boxes under a spawn take numbers written the owner's way.
     2        always 2
     2:4      a new random whole number from 2 to 4 each time ("a colon between numbers to indicate range")
     2,4      a new random pick of 2 or 4 each time ("comma means it could be one of those given inputs too (true random
              for the commas)"); a range can be one of them: 1,3:5
     t / f    the true or false boxes
   Tenths ("decimal to the tenth place") only where a box allows them (speed and damage): 0.8:1.2 picks a tenth
   between, and 1.25 is read as 1.3. Anything more (orders, brackets, math, asterisks, percents …) is the full
   language, Numberat (numberat.js): read() compiles it once and pick() runs it, so the boxes, the files and Check in the
   Numberat window all use the one compiler.
   Bad writing never breaks the game: read() says why, and the box keeps its last good value (keep()).
   This file imports only numberat.js, so it can be used anywhere, in the game or outside it. */
import { compile, compileFile, NB_WORDS, NOTHING } from "./numberat.js";

/* a box's kind: "int" (whole numbers), "tenth" (tenths) or "bool" (t or f); min and max: what it allows */
const NUM = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
const N = String.raw`\s*-?(?:\d+(?:\.\d*)?|\.\d+)\s*`;
const PLAIN = new RegExp(`^${N}(?::${N})?(?:,${N}(?::${N})?)*$`); // (plain values: read here, nothing to compile)
const tenth = (n) => Math.round(n * 10) / 10;

/* read text for a box: { ok: true, v } or { ok: false, why }. v is a list of [low, high] pairs (one pair a range, a
   number on its own [n, n], a third "tenths" when an end was written with a "."); for a bool box v is true or false;
   for the full language { code }. Empty text gives the box's own value (def) */
export function read(text, box = {}) {
  const kind = box.kind || "int",
    t = String(text == null ? "" : text)
      .trim()
      .toLowerCase();
  if (!t) {
    if (box.def != null && String(box.def).trim() !== "")
      return read(box.def, { ...box, def: null });
    return { ok: false, why: "Write a value" };
  }
  if (kind === "bool") {
    if (t === "t" || t === "true") return { ok: true, v: true };
    if (t === "f" || t === "false") return { ok: true, v: false };
  }
  if (kind === "bool" || !PLAIN.test(t)) return readCode(t, box);
  const parts = t.split(","),
    v = [];
  for (const part of parts) {
    const ends = part.split(":").map((x) => x.trim());
    if (ends.length > 2 || ends.some((x) => !NUM.test(x)))
      return { ok: false, why: `"${part.trim() || ","}" isn't a number` };
    let [a, b = a] = ends.map(Number);
    if (kind === "int" && (!Number.isInteger(a) || !Number.isInteger(b)))
      return { ok: false, why: "Whole numbers only here" };
    if (kind === "tenth") {
      a = tenth(a);
      b = tenth(b);
    }
    if (a > b) [a, b] = [b, a]; // (4:2 is 2 to 4)
    const whole = !ends.some((x) => x.includes(".")); // ("2:4" is whole numbers even where the box takes tenths)
    if (box.min != null && a < box.min)
      return { ok: false, why: `${box.min} at least` };
    if (box.max != null && b > box.max)
      return { ok: false, why: `${box.max} at most` };
    v.push(whole ? [a, b] : [a, b, "tenths"]);
  }
  return { ok: true, v };
}

/* the full language: compiled once per box kind and text (a program keeps its place in its orders between spawns), then
   played a few times on a spare copy, so writing that can never give this box a value is turned down at once */
const PROGS = new Map();
function progFor(t, kind) {
  const key = kind + "|" + t;
  let p = PROGS.get(key);
  if (!p) {
    const c = compile(t);
    if (!c.ok) return c;
    if (PROGS.size > 500) PROGS.clear(); // (old texts nobody uses any more)
    p = c.prog;
    PROGS.set(key, p);
  }
  return { ok: true, prog: p };
}
function readCode(t, box) {
  const c = compile(t);
  if (!c.ok) return { ok: false, why: c.why };
  for (let k = 0; k < 40; k++) {
    const r = c.prog.run();
    const why = r.why || fits(r.v, box).why;
    if (why) return { ok: false, why };
  }
  return { ok: true, v: { code: t } };
}
/* a value from a program: the box's kind (whole numbers rounded, t/f: a number is true unless 0, so 30% is true 3
   times in 10) and its limits. { v } or { why } */
function fits(v, box = {}) {
  const kind = box.kind || "int";
  if (v === NOTHING) return { why: "It came out as nothing" };
  if (kind === "bool") {
    if (typeof v === "boolean") return { v };
    if (typeof v === "number") return { v: v !== 0 };
    return { why: "Write t or f" };
  }
  if (typeof v === "boolean") return { why: "A number goes here, not t or f" };
  if (typeof v !== "number" || !Number.isFinite(v))
    return { why: "A number goes here" };
  const n = kind === "int" ? Math.round(v) : tenth(v);
  if (box.min != null && n < box.min) return { why: `${box.min} at least` };
  if (box.max != null && n > box.max) return { why: `${box.max} at most` };
  return { v: n };
}

/* a value from what read() gave: one of the commas' picks at random, then a number in its range (whole numbers, or
   tenths in a tenth box). r: the random numbers (Math.random), so the tests can fix them */
export function pick(v, box = {}, r = Math.random) {
  if (typeof v === "boolean") return v;
  if (v && v.code != null) {
    const p = progFor(v.code, box.kind || "int");
    if (!p.ok) return NaN;
    const r1 = p.prog.run(r),
      f = r1.why ? r1 : fits(r1.v, box);
    return f.why ? NaN : f.v; // (a spawn this time can't take it: valueOf() gives the box's own value)
  }
  if (!Array.isArray(v) || !v.length) return NaN;
  const [a, b, tenths] = v[Math.min(v.length - 1, Math.floor(r() * v.length))];
  if (a === b) return a;
  if (box.kind === "tenth" && tenths) {
    const lo = Math.round(a * 10),
      hi = Math.round(b * 10);
    return (lo + Math.min(hi - lo, Math.floor(r() * (hi - lo + 1)))) / 10;
  }
  return a + Math.min(b - a, Math.floor(r() * (b - a + 1)));
}

/* a box as it is kept: { t: the text as typed, ok: the last text that read well }. keep() takes the new text, keeps it
   as typed, and moves ok only when it reads well */
export function keep(was, text, box = {}) {
  const t = String(text == null ? "" : text).slice(0, 400);
  const good = read(t, box).ok;
  return { t, ok: good ? t : was && was.ok != null ? was.ok : "" };
}
/* the value a kept box stands for now (its last good text, or the box's own) */
export function valueOf(kept, box = {}, r = Math.random) {
  const k = read(kept && kept.ok != null ? kept.ok : "", box);
  const got = k.ok ? pick(k.v, box, r) : NaN;
  if (got === got) return got;
  const d = read("", box);
  return d.ok ? pick(d.v, box, r) : NaN;
}

/* the words a file can have today, for the Numerat window's autocomplete */
export const WORDS = [...new Set(["true", "false", ...NB_WORDS])];

/* Check (the Numberat window): reads a whole file and plays each line a few times on its own, without running the file
   in the game. Blank lines and # notes are skipped; a line carries on while a bracket is still open. Gives
   { n: lines read, errs: [{ line, why }] }, line counted from 1 */
export function check(text) {
  const f = compileFile(String(text == null ? "" : text));
  const errs = [...f.errs];
  for (const { line, prog } of f.lines) {
    for (let k = 0; k < 20; k++) {
      const r = prog.run();
      if (r.why) {
        errs.push({ line, why: r.why });
        break;
      }
    }
  }
  errs.sort((a, b) => a.line - b.line);
  return { n: f.n, errs };
}
