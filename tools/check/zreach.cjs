/* I want the zombies checked to reach my duck wherever it can stand (the owner's, Nov 22 18:13Z: "If this keeps
   happening in different particular circumstances, then we're not actually fixing the principle ... The picture is of
   zombies that will not move and will not kill me. They're stuck."). On every walkable map, my duck kept alive at
   every kind of height it can stand on (the ground in the open, by the tree at the gas station's east wall, past a
   trunk, the gas station's and the chapel's roofs, the canopy, a car's roof, the hood), a round's crowd coming from
   its spawns past the fences:
   1. my duck is hit in the last part of the run;
   2. at least 3 of the crowd (or all of it) get to my duck, on its floor: a ring round it;
   3. none stands still for the last 60 heartbeats away from my duck with no crowd round it (nothing holds it there
      but its way), and with my duck up on a roof, no more than a fifth stand still on the ground under it.
   Fixed seed and fake clock (tools/npc-golden/init.js), so it plays the same every time.
   Run: node tools/check/run.mjs zreach */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const INIT = fs.readFileSync(
  path.resolve(__dirname, "../npc-golden/init.js"),
  "utf8",
);
const BEATS = 360,
  MS = 350, // (a slow phone's heartbeat: the crowd got stuck there first, zclimb.cjs)
  ROUND = 8,
  STILL = 60, // (heartbeats)
  REACH = 1.5, // (room, duck lengths: at my duck, clawing; 1 is touching)
  RING = 3; // (the zombies that get to my duck at least: the ring touching it holds 3 to 5)
/* one run: my duck at the spot named where (a spot, or a deck's middle) on map ("downpour" or "cabin") */
async function play(b, errs, where) {
  const p = await b.newPage({ viewport: { width: 800, height: 450 } });
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
  await p.addInitScript(INIT);
  await p.goto(url, { waitUntil: "networkidle" });
  const r = await p.evaluate(
    async ({ where, BEATS, MS, ROUND, STILL, REACH }) => {
      const net = await import("./js/net.js"),
        { botActions } = await import("./js/bots.js"),
        L = await import("./js/hangout/layout.js"),
        GS = await import("./js/hangout/stationmap.js"),
        Z = await import("./js/zombies.js");
      window.__fake = true;
      window.__now = 1.8e12;
      window.__seed(1);
      const room = net.createLocalRoom({ name: "Z", test: true, computers: 0 });
      room.close();
      const beat = () => {
        window.__now += MS;
        room.send({ t: "tick", id: room.me });
        for (const a of botActions(room.state, window.__now)) room.send(a);
      };
      room.send({
        t: "options",
        options: {
          modePick: "",
          mapPick: "",
          botWait: 1,
          mode: "l4dd",
          l4map: where.map,
        },
      });
      room.state.zmapAsked = 1;
      room.send({ t: "start" });
      for (let k = 0; k < 600 && room.state.phase !== "hang"; k++) beat();
      (await import("./js/l4ddrules.js")).helperOut(room.state);
      /* where my duck stands: a deck's middle (its height), a spot on the ground, or where it started */
      let spot, z;
      const me0 = room.state.pos[room.me];
      if (where.deck != null) {
        const d = GS.DECKS[where.deck];
        spot = where.at || [(d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2];
        z = d.hAt ? d.hAt(...spot) : d.h;
      } else if (where.past) {
        const t = L.SOLIDS.filter((s) => s.noLand).sort(
          (a, c) =>
            Math.hypot(a.x0 - where.past[0], a.y0 - where.past[1]) -
            Math.hypot(c.x0 - where.past[0], c.y0 - where.past[1]),
        )[0];
        spot = [t.x0 - 30, (t.y0 + t.y1) / 2]; // (just west of the trunk: the crowd comes from all round)
        z = L.heightAt(...spot);
      } else if (where.at) {
        spot = where.at;
        z = L.heightAt(...spot);
      } else {
        spot = [me0.x * L.W, me0.y * L.H];
        z = me0.z || 0;
      }
      let hp0 = null,
        hits = 0,
        late = 0;
      const seen = new Map(), // zombie → its spots, the last STILL heartbeats
        reached = new Set(),
        mins = new Map();
      for (let n = 0; n < BEATS; n++) {
        const s = room.state,
          me = s.pos[room.me];
        s.pos = {
          ...s.pos,
          [room.me]: { ...me, x: spot[0] / L.W, y: spot[1] / L.H, z },
        };
        const hp = s.hang.l4p && s.hang.l4p[room.me];
        if (hp) {
          if (hp0 === null) hp0 = JSON.stringify(hp);
          else if (JSON.stringify(hp) !== hp0) {
            hits++;
            if (n >= BEATS - 150) late++;
          }
          s.hang = {
            ...s.hang,
            l4p: { ...s.hang.l4p, [room.me]: JSON.parse(hp0) },
          };
        }
        if (s.hang.l4 && s.hang.l4.wait && !(s.hang.l4.wait.v || {})[room.me])
          room.send({
            t: "hang",
            k: "l4",
            do: "endturn",
            on: true,
            id: room.me,
          });
        const l4 = s.hang.l4;
        if (l4 && !l4.wait && l4.r < ROUND)
          s.hang = { ...s.hang, l4: { ...l4, r: ROUND } };
        beat();
        for (const q of Z.zombies(room.state)) {
          const t = seen.get(q.i) || [];
          t.push([q.x, q.y, q.st]);
          if (t.length > STILL) t.shift();
          seen.set(q.i, t);
          if (where.deck != null ? q.st === 7 : q.st === 2)
            mins.set(
              q.i,
              Math.min(mins.get(q.i) ?? 99, Z.room(q.x, q.y, ...spot)),
            );
          if (
            Z.room(q.x, q.y, ...spot) < REACH &&
            (where.deck != null ? q.st === 7 : q.st === 2)
          )
            reached.add(q.i); // (at me, on my floor)
        }
      }
      const up = where.deck != null,
        live = Z.zombies(room.state).filter((q) => q.st !== 3),
        still = live.filter((q) => {
          const t = seen.get(q.i);
          return (
            q.st === 2 &&
            t &&
            t.length === STILL &&
            t.every(
              (u) => u[2] === 2 && Math.hypot(u[0] - q.x, u[1] - q.y) <= 4,
            ) &&
            (up || Z.room(q.x, q.y, ...spot) >= REACH)
          ); // (on the ground, not at me, and not a step in STILL heartbeats)
        }),
        alone = still.filter(
          (q) => !live.some((o) => o !== q && Z.room(o.x, o.y, q.x, q.y) < 1.5),
        ); // (… with no crowd round it: nothing holds it but the way)
      const all = live.length;
      window.__fake = false;
      return {
        hits,
        late,
        all,
        reached: reached.size,
        mins: [...mins.values()]
          .sort((a, b) => a - b)
          .map((v) => +v.toFixed(1))
          .join(" "),
        still: still.length,
        stillAt: still.map((q) => [
          Math.round(q.x),
          Math.round(q.y),
          q.cm && q.cm.slice(1).map(Math.round).join("/"),
        ]),
        alone: alone.map((q) => [Math.round(q.x), Math.round(q.y)]),
        up,
        spot: spot.map(Math.round),
        z: Math.round(z),
      };
    },
    { where, BEATS, MS, ROUND, STILL, REACH },
  );
  await p.close();
  return r;
}
const SPOTS = [
  { name: "the forecourt", map: "downpour", at: [1600, 1250] },
  { name: "by the station's east tree", map: "downpour", at: [2160, 1050] },
  { name: "past a trunk", map: "downpour", past: [2600, 1700] },
  { name: "the station's roof", map: "downpour", deck: 0 },
  {
    name: "the station's roof by its front",
    map: "downpour",
    deck: 0,
    at: [2000, 1010],
  },
  { name: "the chapel's roof", map: "downpour", deck: 1 },
  { name: "the canopy", map: "downpour", deck: 2 },
  { name: "the hood", map: "downpour", deck: 3 },
  { name: "a car's roof", map: "downpour", deck: 4 },
  { name: "Duck Cabin, where I start", map: "cabin" },
];
(async () => {
  const b = await chromium.launch(),
    errs = [],
    out = [];
  for (const w of SPOTS) out.push([w.name, await play(b, errs, w)]); // (one at a time: the field's worker answers in its own time)
  /* 4. on the screen (the real clock): my duck up on a roof never walks into a zombie on the ground under it, and on
     the ground it does (heights.js overlapH, the owner's, Nov 22 18:20Z: "if I'm on ground level 2, I don't get stuck
     because there's a zombie on ground level 1 or 0") */
  const q = await b.newPage({ viewport: { width: 900, height: 600 } });
  q.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
  await q.goto(url, { waitUntil: "networkidle" });
  await q.evaluate(async () => {
    const r = await (
      await import("./js/net.js")
    ).createLocalRoom({ name: "T", test: true, computers: 0 });
    window._r = r;
    r.send({
      t: "options",
      options: {
        modePick: "host",
        mapPick: "host",
        mode: "l4dd",
        map: "downpour",
        l4map: "downpour",
        botWait: 1,
        wildJustin: 0,
      },
    });
    (await import("./js/router.js")).go("lobby", r);
    r.state.zmapAsked = 1;
    r.send({ t: "start" });
  });
  let over = null;
  for (let k = 0; k < 120 && !over; k++) {
    await q.waitForTimeout(500);
    over = await q.evaluate(async () => {
      const r = window._r,
        s = r.state;
      if (document.body.dataset.screen !== "game" || !s.hang) return null;
      if (s.hang.l4 && s.hang.l4.wait && !(s.hang.l4.wait.v || {})[r.me])
        r.send({ t: "hang", k: "l4", do: "endturn", on: true, id: r.me });
      const { actsOf } = await import("./js/hangout/registry.js"),
        Z = await import("./js/zombies.js"),
        GS = await import("./js/hangout/stationmap.js"),
        a = actsOf(s).find((x) => x.crowd),
        z = Z.zombies(s).find((o) => o.st === 2);
      if (!a || !z) return null;
      await new Promise((ok) => setTimeout(ok, 300)); // (drawn on the screen)
      const ctx = { state: () => r.state, me: r.me },
        o = Z.zombies(r.state).find((x) => x.i === z.i && x.st === 2);
      if (!o) return null;
      return {
        roof: a.crowd(o.x, o.y, { z: GS.DECKS[0].h }, ctx),
        ground: a.crowd(o.x, o.y, { z: 0 }, ctx),
      };
    });
  }
  if (!over) fail("no zombie on the ground came on the screen");
  else if (over.roof > 0 || !(over.ground > 0.5))
    fail(
      `my duck up on a roof walks into a zombie under it (${over.roof}), or on the ground not (${over.ground})`,
    );
  noErrors(errs);
  for (const [name, r] of out) {
    if (!r.late)
      fail(
        `${name} (${r.spot}, z ${r.z}): my duck wasn't hit in the last 150 heartbeats (${r.hits} in all)`,
      );
    const at = `${name} (${r.spot}, z ${r.z})`;
    if (r.reached < Math.min(RING, r.all))
      fail(
        `${at}: only ${r.reached} of ${r.all} zombies got to my duck ${r.mins}`,
      );
    if (r.alone.length)
      fail(
        `${at}: ${r.alone.length} zombies stood still alone where they can't reach me: ${JSON.stringify(r.alone.slice(0, 5))}`,
      );
    if (r.up && r.still > r.all / 5)
      fail(
        `${at}: ${r.still} of ${r.all} zombies stood still on the ground under me ${JSON.stringify(r.stillAt)}`,
      );
  }
  console.log(
    "zreach: " +
      out
        .map(([n, r]) => `${n} ${r.reached}/${r.all} at me, ${r.still} still`)
        .join("; "),
  );
  await b.close();
})();
