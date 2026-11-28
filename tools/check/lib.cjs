/* I want one check command for the whole game (tools/check/run.mjs). It serves the folder on a free port and hands the
   address to every test through CHECK_URL. A test prints what it likes; it fails the run by calling fail(), and
   run.mjs shows only those lines. */
const url = process.env.CHECK_URL || "http://localhost:8000/";
const fail = (msg) => {
  console.error("FAIL " + String(msg).replace(/\s+/g, " ").slice(0, 300));
  process.exitCode = 1;
};
// page errors a test collected: any at all is a failure
const noErrors = (errs, what = "page errors") => {
  const real = errs.filter(Boolean);
  if (real.length) fail(what + ": " + JSON.stringify(real.slice(0, 3)));
};
/* a page on the game with the clock faked (npc-golden/init.js, as knock.cjs) and its page errors collected; the
   Dead Ducks Arcade checks start their game in it with l4room.js */
const fakedPage = async () => {
  const fs = require("fs"),
    path = require("path"),
    { chromium } = require("playwright");
  const b = await chromium.launch(),
    p = await b.newPage(),
    errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  );
  await p.goto(url, { waitUntil: "networkidle" });
  return { b, p, errs };
};
module.exports = { url, fail, noErrors, fakedPage };
