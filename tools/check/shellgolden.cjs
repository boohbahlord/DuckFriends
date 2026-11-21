/* I want the command line pinned before anyone moves its code (the owner's rule: pin before you touch; shell.js is
   split by what the commands do). This runs every command line in tools/shell-golden/commands.txt (each command in
   `man`'s list with typical arguments) through shellRun in one test room, from a fixed seed and a fixed clock (no
   Math.random and no clock but the fake ones), once in the lobby and once after a game starts, and keeps what each one
   printed in tools/shell-golden/pinned.json. A run that prints something else fails, naming the first line that changed.
   After a change I meant to make, pin again:  PIN=1 node tools/check/run.mjs shellgolden */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const DIR = path.resolve(__dirname, "../shell-golden"),
  PINNED = path.join(DIR, "pinned.json");
const LINES = fs
  .readFileSync(path.join(DIR, "commands.txt"), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"));
const INIT = `(() => {
  let a = 1;
  const rnd = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const real = Math.random.bind(Math), D = Date, pn = performance.now.bind(performance);
  window.__fake = false; window.__now = 1.8e12;
  Math.random = () => (window.__fake ? rnd() : real());
  window.Date = class extends D {
    constructor(...x) { super(...(x.length ? x : [window.__fake ? window.__now : D.now()])); }
    static now() { return window.__fake ? window.__now : D.now(); }
  };
  performance.now = () => (window.__fake ? window.__now - 1.8e12 : pn());
  try { delete window.Worker; } catch {}
  window.Worker = undefined;
})();`;
(async () => {
  const b = await chromium.launch(),
    p = await b.newPage({ viewport: { width: 1000, height: 600 } }),
    errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(INIT);
  await p.goto(url, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const got = await p.evaluate(async (lines) => {
    window.__fake = true;
    const { shellRun } = await import("./js/shell.js"),
      { shellCtx } = await import("./js/chat.js"),
      net = await import("./js/net.js");
    const r = net.createLocalRoom({ name: "G", test: true, computers: 3 });
    net.setActive(r);
    const out = [];
    const run = async (line) => {
      window.__now += 1000;
      let res;
      try {
        const ctx = shellCtx();
        res = await Promise.race([
          shellRun(line, ctx),
          new Promise((f) =>
            setTimeout(() => f({ lines: ["(timed out)"] }), 4000),
          ),
        ]);
      } catch (e) {
        res = { lines: ["(threw) " + String(e && e.message)] };
      }
      /* (a version stamp, like uname prints, changes with every commit: not part of what is pinned) */
      out.push(
        (
          line +
          "\n" +
          (res.lines || []).join("\n") +
          (res.cleared ? "\n(cleared)" : "")
        ).replace(/\b20\d{10}\b/g, "<stamp>"),
      );
    };
    let game = false;
    for (const line of lines) {
      if (line === "== game") {
        r.send({
          t: "options",
          options: {
            modePick: "host",
            mapPick: "host",
            mode: "aod",
            botWait: 1,
          },
        });
        r.send({ t: "start" });
        for (let i = 0; i < 40; i++) {
          window.__now += 200;
          r.send({ t: "tick", id: r.me });
        }
        game = true;
        out.push("== game " + r.state.phase);
        continue;
      }
      await run(line);
    }
    return out;
  }, LINES);
  await b.close();
  noErrors(errs, "shell page errors");
  if (process.env.PIN) {
    fs.writeFileSync(PINNED, JSON.stringify(got, null, 1) + "\n");
    console.log("pinned", got.length, "lines");
    return;
  }
  const pin = JSON.parse(fs.readFileSync(PINNED, "utf8"));
  const at = got.findIndex((g, i) => g !== pin[i]);
  if (at >= 0 || got.length !== pin.length)
    fail(
      `shell changed at line ${at}: ${JSON.stringify(pin[at])} became ${JSON.stringify(got[at])}`,
    );
})();
