const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(C.url);
  await p.waitForTimeout(1500);
  const files = require("fs")
    .readdirSync(require("path").join(__dirname, "../../js"), {
      recursive: true,
    })
    .filter((f) => f.endsWith(".js"))
    .map((f) => "js/" + f.replaceAll("\\", "/"));
  const r = await p.evaluate(async (fs) => {
    const out = [];
    for (const f of fs) {
      try {
        await import("./" + f);
      } catch (e) {
        out.push(f + ": " + e.message);
      }
    }
    return out;
  }, files);
  console.log("import errors:", r, "page errors:", errs);
  C.noErrors(r, "import errors");
  C.noErrors(errs);
  await b.close();
})();
