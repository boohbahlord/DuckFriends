const C = require("./lib.cjs");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(C.url);
  await p.waitForTimeout(3000);
  await p.keyboard.press("x");
  await p.waitForTimeout(2000);
  await p.evaluate(() => {
    import("./js/customize.js").then((m) => m.openCustomize());
  });
  await p.waitForTimeout(3000);
  const rows = await p.evaluate(() =>
    [...document.querySelectorAll("button, [role=button], li")]
      .map((e) => e.textContent.trim().slice(0, 20))
      .filter((t) => /^style/i.test(t)),
  );
  console.log(rows);
  await p
    .getByText(/^Style/i)
    .first()
    .click()
    .catch((e) => console.log("click", e.message));
  await p.waitForTimeout(4000);
  console.log("ERR", JSON.stringify(errs));
  C.noErrors(errs);
  await b.close();
})();
