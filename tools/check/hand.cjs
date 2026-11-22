/* I want the one hand rule checked in every mode with a hotbar (js/hotpick.js; the owner's, Nov 22 19:24Z: "MAKE THE
   FUCKING GAME'S HOTBAR IN EVERY MODE NOT HAVE TOGGLE AND THE ITEM ALWAYS IN YOUR HAND IF IT ISNT AN EMPTY SLOT OR
   SOMETHING LIKE FLASHLIGHT"). In Agree or Disagree's board, Mad God Justin's fight and Dead Ducks Arcade:
   1. the gun's number key puts it in my hand at once, and the same key again keeps it there (no toggle);
   2. a click fires it;
   3. an empty slot's key leaves my hand empty (the board: a game starts with slot 1 picked, its gun in hand).
   Run: node tools/check/run.mjs hand */
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
/* a game of mode on map with my keys (null: the mode's own), on the screen till its board is up */
async function start(p, mode, map, keys) {
  await p.goto(url);
  await p.waitForTimeout(1500);
  await p.evaluate(
    async ([mode, map, keys]) => {
      const st = await import("./js/store.js");
      if (keys) st.profile.duck.keys = keys;
      const r = await (
        await import("./js/net.js")
      ).createLocalRoom({ name: "T", test: true, computers: 0 });
      window._r = r;
      r.send({
        t: "options",
        options: {
          modePick: "host",
          mapPick: "host",
          mode,
          map,
          l4map: map,
          botWait: 1,
          wildJustin: 0,
        },
      });
      (await import("./js/router.js")).go("lobby", r);
      r.state.zmapAsked = 1;
      r.send({ t: "start" });
      for (
        let i = 0;
        i < 300 && r.state.phase !== "submit" && mode === "aod";
        i++
      )
        await new Promise((ok) => setTimeout(ok, 100));
      if (mode === "aod") r.send({ t: "submit", text: "Ducks can fly" });
    },
    [mode, map, keys],
  );
  for (let i = 0; i < 200; i++) {
    const up = await p.evaluate(
      async () =>
        document.body.dataset.screen === "game" &&
        (await import("./js/game.js")).onBoardPhase(),
    ); // (the loading veil can stay up on a slow machine: the board is up under it)
    if (up) break;
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1500);
}
const held = (p) =>
  p.evaluate(async () => (await import("./js/hotpick.js")).heldNow());
/* shots fired so far: what my guns' magazines and Dead Ducks Arcade's ammo say */
const shots = (p) =>
  p.evaluate(() => {
    const s = window._r.state;
    return JSON.stringify([
      s.mag || {},
      (s.hang && s.hang.l4a) || {},
      s.lastUse || {},
    ]);
  });
async function click(p) {
  const box = await p.evaluate(() => {
    const r = document.querySelector(".gmain").getBoundingClientRect();
    return [r.x + r.width * 0.75, r.y + r.height * 0.4];
  });
  await p.mouse.click(box[0], box[1]);
  await p.waitForTimeout(400);
}
(async () => {
  const b = await chromium.launch(),
    errs = [],
    out = [];
  for (const [name, mode, map, keys, key, gun, empty] of [
    [
      "Agree or Disagree",
      "aod",
      "night",
      ["handgun", null, "knife", ...Array(7).fill(null)],
      "Digit1",
      "handgun",
      "Digit2",
    ],
    ["Mad God Justin", "mgj", "board", null, "Digit2", "handgun", "Digit5"],
    ["Dead Ducks Arcade", "l4dd", "cabin", null, "Digit2", "handgun", "Digit3"],
  ]) {
    const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
    p.on("pageerror", (e) => errs.push(name + ": " + String(e).slice(0, 200)));
    await start(p, mode, map, keys);
    const r = { name };
    if (mode === "aod") r.first = await held(p); // (slot 1 picked at the start)
    await p.keyboard.press(key);
    await p.waitForTimeout(200);
    r.once = await held(p);
    await p.keyboard.press(key);
    await p.waitForTimeout(200);
    r.twice = await held(p);
    const s0 = await shots(p);
    await click(p);
    r.fired = (await shots(p)) !== s0;
    await p.keyboard.press(empty);
    await p.waitForTimeout(200);
    r.empty = await held(p);
    out.push([r, gun]);
    await p.close();
  }
  noErrors(errs);
  for (const [r, gun] of out) {
    if (r.first !== undefined && r.first !== gun)
      fail(
        `${r.name}: slot 1's ${gun} isn't in my hand at the start (${r.first || "nothing"})`,
      );
    if (r.once !== gun)
      fail(
        `${r.name}: its key didn't put the ${gun} in my hand (${r.once || "nothing"})`,
      );
    if (r.twice !== gun)
      fail(
        `${r.name}: the key again took the ${gun} away (${r.twice || "nothing"})`,
      );
    if (!r.fired) fail(`${r.name}: a click didn't fire the ${gun}`);
    if (r.empty)
      fail(`${r.name}: an empty slot left the ${r.empty} in my hand`);
  }
  console.log("hand: " + out.map(([r]) => `${r.name} ${r.once}`).join(", "));
  await b.close();
})();
