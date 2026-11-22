/* I want Seriat's shuffle and escape checked (bible section 19; the owner's, Nov 21 16:29Z, 16:34Z, confirmed 16:38Z:
   "Shuffle = the bag: each value plays once, in a random order, then they all shuffle again"):
   1. ";" is a bag (alone, in a bracket, next to a range's colon, tighter than ","); every pass plays each value once;
   2. the \;\ marks turn the true random and the ranges they reach into bags, as far as their arrows say; \;3\ stops
      after three passes; \;!\ reaches the whole file;
   3. \esc\ leaves its bracket (a bracket left gives nothing), \esc2\ two, a { }= left keeps what its name had, and a
      repeat it reaches ends there;
   4. in a file, ";" between statements still ends a statement, and a bag works in its values too.
   Run: node tools/check/run.mjs shuffle */
const path = require("path"),
  { pathToFileURL } = require("url");
const { fail } = require("./lib.cjs");
const s = (t) => t.replace(/@/g, "\\"); // (@ for each backslash, so the cases read as written)
const js = (f) => pathToFileURL(path.resolve(__dirname, "../../js/" + f)).href;
(async () => {
  const S = await import(js("seriat.js")),
    R = await import(js("seriatrun.js")),
    { markShuffles } = await import(js("seriatbag.js"));
  const runs = (t, n) => {
    const c = S.compile(t);
    if (!c.ok) return { why: c.why };
    const o = [];
    for (let i = 0; i < n; i++) {
      const x = c.prog.run(Math.random);
      if (x.why) return { why: x.why };
      o.push(x.v === S.NOTHING ? "_" : x.v);
    }
    return { o };
  };
  /* every pass of `each` values plays each of them once */
  const bags = (t, each, passes = 40) => {
    const g = runs(t, each.length * passes);
    if (g.why) return fail(`"${t}": ${g.why}`);
    const want = [...each].sort().join(" ");
    const orders = new Set();
    for (let k = 0; k < g.o.length; k += each.length) {
      const pass = g.o.slice(k, k + each.length);
      orders.add(pass.join(" "));
      if ([...pass].sort().join(" ") !== want)
        return fail(
          `"${t}" pass ${k / each.length + 1}: ${pass.join(" ")}, not each of ${want} once`,
        );
    }
    if (orders.size < 2) fail(`"${t}" never shuffles: ${[...orders][0]}`);
  };
  bags("2;4;6", [2, 4, 6]);
  bags("[2;4;6]", [2, 4, 6]);
  bags("2;:6", [2, 3, 4, 5, 6]);
  bags("2:;6", [2, 3, 4, 5, 6]);
  bags("1.0;:1.3", [1, 1.1, 1.2, 1.3]);
  bags(s("@;@2,4,6"), [2, 4, 6]);
  bags(s("@;@1:4"), [1, 2, 3, 4]);
  bags(s("@;!@1,2,3"), [1, 2, 3]);
  bags(s("2,4,6@<;@"), [2, 4, 6]);
  /* "2,4;6": 2, or the bag of 4 and 6 */
  const g = runs("2,4;6", 400).o.filter((v) => v !== 2);
  for (let k = 0; k + 1 < g.length; k += 2)
    if (g[k] === g[k + 1]) {
      fail(`"2,4;6": the bag gave ${g[k]} twice in a pass`);
      break;
    }
  /* "2:6;8": one from 2:6, or 8, in turns */
  const h = runs("2:6;8", 200).o;
  for (let k = 0; k < h.length; k += 2)
    if ((h[k] === 8) === (h[k + 1] === 8)) {
      fail(`"2:6;8" pass ${k / 2 + 1}: ${h[k]} ${h[k + 1]}`);
      break;
    }
  /* \;2\: two passes, then plain random (a repeat shows up within 40 more) */
  const p = runs(s("@;2@1:3"), 46).o;
  if (
    [p.slice(0, 3), p.slice(3, 6)].some((x) => [...x].sort().join() !== "1,2,3")
  )
    fail(s('"@;2@1:3": its two passes ') + p.slice(0, 6));
  const rest = p.slice(6),
    sameRun = rest.some((v, k) => k > 0 && v === rest[k - 1]);
  if (!sameRun) fail(s('"@;2@1:3" still shuffles after two passes'));
  /* how far a mark reaches: which "," it marks */
  const reach = (t) =>
    markShuffles(S.lex(t))
      .filter((x) => x.t === "op" && x.v === ",")
      .map((x) => (x.shuf ? 1 : 0))
      .join("");
  for (const [t, want] of [
    [s("1,2|@;>@3,4|5,6"), "011"],
    [s("1,2|>@;@3,4|5,6"), "010"],
    [s("1,2|@<;@3,4"), "10"],
    [s("1,2|@;@3,4|5,6"), "011"],
  ])
    if (reach(t) !== want) fail(`"${t}" marks ${reach(t)}, not ${want}`);
  /* \;!\ on one line of a file reaches the others */
  const f = S.compileFile(s("@;!@") + "\n1,2,3\n4,5,6");
  if (f.errs.length) fail(s("a file with @;!@: ") + f.errs[0].why);
  else {
    const o = [];
    for (let k = 0; k < 30; k++) o.push(f.lines[1].prog.run(Math.random).v);
    for (let k = 0; k < 30; k += 3)
      if ([...o.slice(k, k + 3)].sort().join() !== "4,5,6") {
        fail(s("@;!@ doesn't reach the file's other lines: ") + o);
        break;
      }
  }
  /* escape */
  const esc = [
    [s("[>2>@esc@>4]"), 6, "2 _ 4 2 _ 4"],
    [s("[[>2>@esc2@]+1]"), 4, "3 _ 3 _"],
    [s("[>1>@esc2@]@>3>@||5"), 4, "1 5 5 5"],
    [s("[>1>@esc@]@>3>@||5"), 7, "1 _ 1 _ 1 _ 5"], // (one bracket left: the repeat goes on)
    [s("[[[>7>@esc!@]]]"), 4, "7 7 7 7"], // (every bracket left: the line's part ends and plays again at once)
  ];
  for (const [t, n, want] of esc) {
    const r = runs(t, n),
      got = r.why || r.o.join(" ");
    if (got !== want) fail(`"${t}" gave ${got}, not ${want}`);
  }
  const kept = runs(s("{[2,4]='1*'}|{@esc@}='1*'|'1*'"), 200);
  if (kept.why || kept.o.some((v) => v !== 2 && v !== 4))
    fail(
      "a { }= left with \\esc\\ lost its name: " +
        (kept.why || kept.o.slice(0, 20)),
    );
  for (const [t, why] of [
    [s("@2esc@"), "The number goes after esc"],
    [s("[@esc0@]"), "leaves nothing"],
    ["2;4 50%", "takes no percents"],
  ]) {
    const c = S.compile(t);
    if (c.ok || !c.why.includes(why))
      fail(`"${t}" should say "${why}": ${c.ok ? "it reads" : c.why}`);
  }
  /* in a file */
  const play = (text) => {
    const c = R.compileScript(text);
    if (c.errs.length) return "ERR " + c.errs[0].why;
    const out = [];
    const host = {
      print: (t) => out.push(String(t)),
      say() {},
      get: () => 0,
      stat: () => 0,
      most: () => 1,
      shared: new Map(),
      act() {},
      move() {},
      now: () => 0,
      error: (e) => out.push("error " + e),
    };
    const B = R.brain(c.plan, host);
    B.start();
    return out.join(" ");
  };
  const two = play("let a = 1\nprint a; print 9");
  if (two !== "1 9") fail(`a file's "print a; print 9" gave ${two}`);
  const loop = play("for n in 1:9 { print 2;4;6 }").split(" ");
  for (let k = 0; k < 9; k += 3)
    if ([...loop.slice(k, k + 3)].sort().join() !== "2,4,6") {
      fail(`a file's "print 2;4;6" in a loop gave ${loop.join(" ")}`);
      break;
    }
})();
