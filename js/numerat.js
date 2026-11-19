/* ---------- Numerat: the number reader (part 1, the boxes) ----------
   The owner's Numerat (Sandbox file, Nov 19): the boxes under a spawn take numbers written the owner's way.
     2        always 2
     2:4      a new random whole number from 2 to 4 each time ("a colon between numbers to indicate range")
     2,4      a new random pick of 2 or 4 each time ("comma means it could be one of those given inputs too (true random
              for the commas)"); a range can be one of them: 1,3:5
     t / f    the true or false boxes
   Tenths ("decimal to the tenth place") only where a box allows them (speed and damage): 0.8:1.2 picks a tenth
   between, and 1.25 is read as 1.3. The rest of the language (> < | $ and the others) waits for the owner's OK on the
   symbol table, so for now it is turned down with a word on what's missing.
   Bad writing never breaks the game: read() says why, and the box keeps its last good value (keep()).
   This file has no imports, so it can be used anywhere, in the game or outside it. */

/* a box's kind: "int" (whole numbers), "tenth" (tenths) or "bool" (t or f); min and max: what it allows */
const NUM = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
const LATER = /[<>|$()=+]/;
const tenth = (n) => Math.round(n * 10) / 10;

/* read text for a box: { ok: true, v } or { ok: false, why }. v is a list of [low, high] pairs (one pair a range, a
   number on its own [n, n]); for a bool box v is true or false. Empty text gives the box's own value (def) */
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
    return { ok: false, why: "Write t or f" };
  }
  if (LATER.test(t)) return { ok: false, why: "Only numbers, : and , here" };
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
    if (box.min != null && a < box.min)
      return { ok: false, why: `${box.min} at least` };
    if (box.max != null && b > box.max)
      return { ok: false, why: `${box.max} at most` };
    v.push([a, b]);
  }
  return { ok: true, v };
}

/* a value from what read() gave: one of the commas' picks at random, then a number in its range (whole numbers, or
   tenths in a tenth box). r: the random numbers (Math.random), so the tests can fix them */
export function pick(v, box = {}, r = Math.random) {
  if (typeof v === "boolean") return v;
  if (!Array.isArray(v) || !v.length) return NaN;
  const [a, b] = v[Math.min(v.length - 1, Math.floor(r() * v.length))];
  if (a === b) return a;
  if (box.kind === "tenth") {
    const lo = Math.round(a * 10),
      hi = Math.round(b * 10);
    return (lo + Math.min(hi - lo, Math.floor(r() * (hi - lo + 1)))) / 10;
  }
  return a + Math.min(b - a, Math.floor(r() * (b - a + 1)));
}

/* a box as it is kept: { t: the text as typed, ok: the last text that read well }. keep() takes the new text, keeps it
   as typed, and moves ok only when it reads well */
export function keep(was, text, box = {}) {
  const t = String(text == null ? "" : text).slice(0, 80);
  const good = read(t, box).ok;
  return { t, ok: good ? t : was && was.ok != null ? was.ok : "" };
}
/* the value a kept box stands for now (its last good text, or the box's own) */
export function valueOf(kept, box = {}, r = Math.random) {
  const k = read(kept && kept.ok != null ? kept.ok : "", box);
  const d = k.ok ? k : read("", box);
  return d.ok ? pick(d.v, box, r) : NaN;
}
