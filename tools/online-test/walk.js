/* ---------- the walk online: two players on a map, my duck's moves shared ----------
   I want the player's own walk, sprint, jump and hotbar checked online too, because where my duck stands is shared: a host
   and a guest in Dead Ducks Arcade on Downpour (or the mode and map given), each walking with real keys (the guest also
   sprints, jumps, picks its gun and fires), and then both must see the same spot for each duck, each must see the other one
   moved and jump, and the host must get the guest's shots. Run the emulators first (README.md), then:
     node walk.js [mode] [map]          (l4dd downpour) */
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const FB = path.dirname(require.resolve("firebase/package.json"));
const [mode = "l4dd", map = "downpour"] = process.argv.slice(2);
const PORT = +process.env.PORT || 8124,
  URL = `http://127.0.0.1:${PORT}/index.html?emu=127.0.0.1`;
const errors = [],
  bad = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (
    !f.startsWith(ROOT) ||
    !fs.existsSync(f) ||
    fs.statSync(f).isDirectory()
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(f)] || "application/octet-stream",
  });
  fs.createReadStream(f).pipe(res);
});
/* in each browser: what it sees of every duck now, and (watch) the jumps and the moves it has seen so far */
const WATCH = () => {
  (async () => {
    const net = await import("/js/net.js");
    const R = net.activeRoom();
    window.__seen = { j: {}, got: {} };
    R.on((s, a) => {
      for (const [id, p] of Object.entries(s.pos || {}))
        if (p && p.j) window.__seen.j[id] = true;
      if (a && a.id && a.id !== R.me)
        window.__seen.got[a.t] = (window.__seen.got[a.t] || 0) + 1;
    });
  })();
};
const look = (p) =>
  p.evaluate(async () => {
    const R = (await import("/js/net.js")).activeRoom(),
      s = R && R.state;
    return s
      ? {
          me: R.me,
          phase: s.phase,
          screen: document.body.dataset.screen,
          veil: !!document.querySelector(".veil[data-on]"),
          pos: Object.fromEntries(
            s.seat.map((id) => [
              id,
              s.pos[id] && { x: s.pos[id].x, y: s.pos[id].y },
            ]),
          ),
          seen: window.__seen,
        }
      : null;
  });
const hold = async (p, keys, ms) => {
  for (const k of keys) await p.keyboard.down(k);
  await sleep(ms);
  for (const k of [...keys].reverse()) await p.keyboard.up(k);
};

(async () => {
  await new Promise((ok) => server.listen(PORT, "127.0.0.1", ok));
  const browser = await chromium.launch({ args: ["--no-proxy-server"] });
  const pages = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 1100, height: 750 },
    });
    await ctx.route(
      /www\.gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z]+\.js)$/,
      (route, req) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: fs.readFileSync(
            path.join(FB, req.url().match(/(firebase-[a-z]+\.js)$/)[1]),
          ),
        }),
    );
    const page = await ctx.newPage();
    page.on("pageerror", (e) =>
      errors.push(`[player ${i + 1}] ${e.stack || e}`),
    );
    await page.goto(URL);
    await sleep(800);
    pages.push(page);
  }
  const [host, guest] = pages;
  const info = await host.evaluate(
    async ([mode, map]) => {
      const o = await import("/js/online.js"),
        r = await import("/js/router.js");
      let detail = null;
      addEventListener("duck-room", (e) => {
        if (e.detail) detail = e.detail;
      });
      r.go(
        "lobby",
        await o.createOnlineRoom({
          name: "Walk test",
          open: true,
          max: 4,
          options: {
            mode,
            modePick: "host",
            mapPick: "host",
            l4map: map,
            map: "cabin",
            botWait: 1,
          },
        }),
      );
      return detail;
    },
    [mode, map],
  );
  await guest.evaluate(async (entry) => {
    const o = await import("/js/online.js"),
      r = await import("/js/router.js");
    r.go("lobby", await o.joinOnlineRoom(entry));
  }, info);
  await sleep(2500);
  await host.evaluate(async () => {
    const R = (await import("/js/net.js")).activeRoom();
    R.state.zmapAsked = 1;
    R.send({ t: "start" });
  });
  /* both on the map, loaded */
  let a, b;
  for (let k = 0; k < 120; k++) {
    await sleep(500);
    [a, b] = await Promise.all([look(host), look(guest)]);
    if (
      a &&
      b &&
      a.screen === "game" &&
      b.screen === "game" &&
      !a.veil &&
      !b.veil
    )
      break;
  }
  if (!(a && b && a.screen === "game" && b.screen === "game"))
    bad.push(
      `never both on the map: ${JSON.stringify([a && a.phase, b && b.phase])}`,
    );
  await sleep(2500);
  for (const p of pages) await p.evaluate(WATCH);
  await sleep(300);
  const [a0] = await Promise.all([look(host)]);
  /* the walks: the host goes left and up; the guest right, sprinting, jumping, then its gun out and two shots */
  await guest.mouse.move(800, 300);
  await Promise.all([
    hold(host, ["KeyA"], 1200)
      .then(() => hold(host, ["KeyW"], 600))
      .then(() => host.keyboard.press("Space")),
    (async () => {
      await hold(guest, ["KeyD"], 900);
      await hold(guest, ["ShiftLeft", "KeyD"], 900);
      await guest.keyboard.press("Space");
      await sleep(700);
      await hold(guest, ["KeyS"], 500);
      await guest.keyboard.press("Digit2");
      await sleep(300);
      await guest.mouse.click(800, 300);
      await sleep(500);
      await guest.mouse.click(820, 320);
    })(),
  ]);
  await sleep(2000); // (the last moves sent and back)
  [a, b] = await Promise.all([look(host), look(guest)]);
  const H = a.me,
    G = b.me,
    far = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  for (const id of [H, G]) {
    const d = far(a.pos[id], b.pos[id]);
    if (d > 0.002)
      bad.push(
        `${id === H ? "the host" : "the guest"} stands apart on the two screens (${d.toFixed(4)})`,
      );
    if (far(a.pos[id], a0.pos[id]) < 0.02)
      bad.push(`${id === H ? "the host" : "the guest"} never moved`);
  }
  if (!a.seen.j[G]) bad.push("the host never saw the guest jump");
  if (!b.seen.j[H]) bad.push("the guest never saw the host jump");
  if (!(a.seen.got.use >= 1))
    bad.push(
      `the host got no shots from the guest (${JSON.stringify(a.seen.got)})`,
    );
  console.log(
    `${mode} on ${map}: host moved ${far(a.pos[H], a0.pos[H]).toFixed(3)}, guest ${far(a.pos[G], a0.pos[G]).toFixed(3)}; host got ${JSON.stringify(a.seen.got)}`,
  );
  const uniq = [...new Set(errors)];
  for (const e of uniq.slice(0, 20)) console.log(e);
  for (const x of bad) console.log("FAIL " + x);
  console.log(bad.length || uniq.length ? "Not OK." : "OK.");
  await browser.close();
  server.close();
  process.exit(bad.length || uniq.length ? 1 : 0);
})();
