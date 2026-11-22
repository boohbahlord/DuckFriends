/* I want the Seriat bible players read in the game (docs/seriat.md, js/seriatbible.js) to read like documentation: only
   settled rules as plain facts (the owner's, Nov 22 13:23Z/13:25Z: "not this bullshit owner talk", "Why ... ARE THERE
   PROPOSALS IN THE BIBLE"). Our own notes (who said what, when, proposals, open questions, code files) stay in
   notes/seriat-bible.md. This fails on any of that in the reference, and on code shown wrong (`**` turned bold). */
const { chromium } = require("playwright");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const C = require("./lib.cjs");
const md = readFileSync(
  process.env.DOC || join(__dirname, "../../docs/seriat.md"),
  "utf8",
);
const BANNED = [
  [/\bowner\b/i, "the word owner"],
  [/proposal/i, "a proposal"],
  [/\[open\]|not settled|not built|\bopen question/i, "an open question"],
  [/\b\d{1,2}:\d{2}Z\b/, "a time"],
  [/\b(Nov|Oct|Dec)\s+\d/i, "a date"],
  [/\b(Claude|Adam|Solomon|Noah|Jackal)\b/, "a helper's name"],
  [/\bjs\/|\/mnt\/|notes\/|\.js\b/, "a code file"],
  [
    /\bV\d{2,3}\b|\bbuilt (so far|by|in|from)\b|\bwas \S+ until\b/i,
    "build history",
  ],
];
md.split("\n").forEach((line, i) => {
  for (const [re, what] of BANNED)
    if (re.test(line))
      C.fail(
        `docs/seriat.md line ${i + 1} has ${what}: ${line.trim().slice(0, 90)}`,
      );
});
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(C.url);
  const got = await p.evaluate(async (md) => {
    const { bibleHTML } = await import("./js/seriatbible.js");
    const d = document.createElement("div");
    d.innerHTML = bibleHTML(md);
    return {
      stars: [...d.querySelectorAll("code")].some(
        (c) => c.textContent === "**",
      ),
      boldInCode: d.querySelectorAll("code b").length,
      emptyBold: [...d.querySelectorAll("b")].filter(
        (x) => !x.textContent.trim(),
      ).length,
    };
  }, md);
  if (!got.stars) C.fail("`**` in code isn't shown as two asterisks");
  if (got.boldInCode || got.emptyBold)
    C.fail("bold inside code: " + JSON.stringify(got));
  C.noErrors(errs);
  await b.close();
})();
