/* I want Seriat's decimal ranges to go through every tenth (the owner, Nov 21: "if a decimal value is put in range for
   seriat, it goes through every possible tenth range now ... 1.5:2.4 ... This range means it could be 1.5 1.6 1.7 1.8 1.9
   2 2.1 2.2 2.3 or 2.4"). Each value is read for a box that takes tenths and picked many times, as a plain value
   (js/seriatbox.js) and inside the language (js/seriat.js), and must give exactly every tenth between its ends. */
const path = require("path"),
  { pathToFileURL } = require("url");
const { fail } = require("./lib.cjs");
const tenths = (a, b) => {
  const out = [];
  for (let k = Math.round(a * 10); k <= Math.round(b * 10); k++)
    out.push(k / 10);
  return out.join(" ");
};
const CASES = [
  ["1.5:2.4", tenths(1.5, 2.4)],
  ["2.4:1.5", tenths(1.5, 2.4)],
  ["1.5:2", tenths(1.5, 2)],
  ["0.8:1.2", tenths(0.8, 1.2)],
  ["[1.5:2.4]", tenths(1.5, 2.4)],
  ["{1.5:2.4}", tenths(1.5, 2.4)],
  ["[1.5:2.4]+1", tenths(2.5, 3.4)],
  ["2:4", "2 3 4"], // (whole numbers stay whole, even in a box that takes tenths)
];
(async () => {
  const N = await import(
    pathToFileURL(path.resolve(__dirname, "../../js/seriatbox.js")).href
  );
  const box = { kind: "tenth", min: 0, max: 1000 };
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; // (fixed chances: the same every run)
  for (const [t, want] of CASES) {
    const v = N.read(t, box);
    if (!v.ok) {
      fail(`Seriat: "${t}" isn't read (${v.why})`);
      continue;
    }
    const seen = new Set();
    for (let i = 0; i < 3000; i++) seen.add(N.pick(v.v, box, r));
    const got = [...seen].sort((a, b) => a - b).join(" ");
    if (got !== want) fail(`Seriat: "${t}" gave ${got}, not ${want}`);
  }
})();
