/* I want Ethan out on Downpour as a second breed of Justin's one brain, both out at once (the owner's, Nov 21 16:40Z:
   "Ethan is a character like Justin, and he spawns in cabin, or he spawns in downpour"; 16:45Z: "We can make it to where
   Ethan can spawn in and Justin ... they both spawn in"): 30 starts, every one with Justin and Ethan, each with its own
   HP and name; Ethan matte, Fluffy hair, a Lakers jersey (gold and purple both seen); Ethan says nothing in 80 seconds
   while Justin talks. (Hits on each are pinned by the NPC golden's Downpour runs.) */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
(async () => {
  const b = await chromium.launch(),
    errs = [],
    p = await b.newPage({ viewport: { width: 800, height: 450 } });
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(
    fs.readFileSync(path.resolve(__dirname, "../npc-golden/init.js"), "utf8"),
  );
  await p.goto(url, { waitUntil: "networkidle" });
  const o = await p.evaluate(async () => {
    const net = await import("./js/net.js"),
      R = await import("./js/l4ddrules.js"),
      { botActions } = await import("./js/bots.js"),
      out = { jerseys: {}, bad: [], jSpoke: 0 };
    window.__fake = true;
    window.__now = 1.8e12;
    window.__seed(1);
    for (let n = 0; n < 30; n++) {
      const r = net.createLocalRoom({ name: "E", test: true, computers: 0 });
      r.close();
      r.send({
        t: "options",
        options: {
          modePick: "",
          mapPick: "",
          botWait: 1,
          mode: "l4dd",
        },
      });
      const beat = () => {
        window.__now += 200;
        r.send({ t: "tick", id: r.me });
        for (const a of botActions(r.state, window.__now)) r.send(a);
      };
      r.send({ t: "start" });
      for (let k = 0; k < 600 && r.state.phase !== "hang"; k++) beat();
      const J = "b-justin",
        E = "b-ethan",
        s = r.state;
      if (R.wilds(s).join() !== J + "," + E) {
        out.bad.push("wilds " + R.wilds(s));
        continue;
      }
      if (s.players[J].name !== "Justin" || s.players[E].name !== "Ethan")
        out.bad.push("names");
      const d = s.players[E].duck;
      out.jerseys[d.outfit.c1] = 1;
      if (
        !d.matte ||
        !d.hat ||
        d.hat.id !== "fluffy" ||
        d.outfit.id !== "lakers"
      )
        out.bad.push("Ethan's look");
      if (s.players[J].duck.matte) out.bad.push("Justin's look");
      if (n < 4) {
        for (let t = 0; t < 400; t++) beat(); // (80 seconds)
        const log = r.state.log || [];
        if (log.some((m) => m.from === E)) out.bad.push("Ethan spoke");
        if (log.some((m) => m.from === J)) out.jSpoke++;
      }
    }
    const r = net.createLocalRoom({ name: "E", test: true, computers: 0 });
    r.close();
    r.send({
      t: "options",
      options: {
        modePick: "",
        mapPick: "",
        botWait: 1,
        mode: "l4dd",
      },
    });
    r.send({ t: "start" });
    for (let k = 0; k < 600 && r.state.phase !== "hang"; k++) {
      window.__now += 200;
      r.send({ t: "tick", id: r.me });
    }
    const s = r.state,
      hpOf = (id) => ((s.hang.l4p || {})[id] || {}).hp;
    const j0 = hpOf("b-justin");
    if (!(j0 > 0) || !(hpOf("b-ethan") > 0))
      out.bad.push("hp " + j0 + " " + hpOf("b-ethan"));
    if (
      !s.hang.l4jhp ||
      !("b-justin" in s.hang.l4jhp) ||
      !("b-ethan" in s.hang.l4jhp)
    )
      out.bad.push("each has its own HP roll");
    return out;
  });
  if (o.bad.length) fail("Ethan: " + o.bad.slice(0, 3).join(", "));
  if (!o.jSpoke)
    fail("Justin said nothing in 80 seconds: the silence test shows nothing");
  if (Object.keys(o.jerseys).length < 2)
    fail("Ethan wore only one jersey: " + Object.keys(o.jerseys));
  noErrors(errs);
  await b.close();
})();
