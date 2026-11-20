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
module.exports = { url, fail, noErrors };
