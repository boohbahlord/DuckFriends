/* I want the zombies' ways up Downpour's roofs checked (the owner's video notes, Nov 21 08:46 ET: "the zombies are stuck
   on one another and not going up a ladder", and "zombies also climb on the brick walls that doesnt connect to the
   cieling on the bathroom, which doesnt work, so they shouldnt be able to climb tha wall").
   1. No zombie starts up the restroom's brick walls by the roof's broken corner: the climb spot nearest each point along
      them is somewhere a roof stands over the wall.
   2. With my duck on the canopy by its ladder, the zombies get up to it (up the ladder, or up the gas station and the
      jump) and don't keep climbing the station, dropping through its broken corner and climbing again.
   With my duck by the ladder, more than one zombie is up it at once (the owner's, Nov 21 14:52Z: "more than one zombie
   climb a ladder at the same time").
   3. With my duck on the canopy by its east edge, just west of the plank, in round 6, the crowd coming from the south
      east gets up to it (the owner's, Nov 22 06:18Z: "Zombies got stuck and werent moving up to the gas pump roof,
      seemingly stuck on notbing"): on a slow phone (350 ms heartbeats) they waited at the red car for good.
   Fixed seed and fake clock (tools/npc-golden/init.js), so it plays the same every time. */
const fs = require("fs"),
  path = require("path");
const { chromium } = require("playwright");
const { url, fail, noErrors } = require("./lib.cjs");
const INIT = path.resolve(__dirname, "../npc-golden/init.js");
/* a game with my duck parked at spot on the canopy for 300 heartbeats of ms each; r6: in round 6, the zombies put
   south east of the canopy as they come */
async function play(b, errs, o) {
  const p = await b.newPage({ viewport: { width: 800, height: 450 } });
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(fs.readFileSync(INIT, "utf8"));
  await p.goto(url, { waitUntil: "networkidle" });
  return p.evaluate(async ({ spot, ms, r6 }) => {
    const net = await import("./js/net.js"),
      { botActions } = await import("./js/bots.js"),
      LY = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js"),
      Z = await import("./js/zombies.js"),
      ZR = await import("./js/zombieroofs.js");
    window.__fake = true;
    window.__now = 1.8e12;
    window.__seed(1);
    const room = net.createLocalRoom({ name: "Z", test: true, computers: 0 });
    room.close();
    const beat = () => {
      window.__now += ms;
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
      },
    });
    room.send({ t: "start" });
    for (let k = 0; k < 600 && room.state.phase !== "hang"; k++) beat();
    /* the ducks out there (Justin, Ethan) run about the ground and the zombies go after them, off the canopy's way (two
       of them took 49 of 72 off it): this checks the way up to a player, so they leave */
    (await import("./js/l4ddrules.js")).helperOut(room.state);
    const S = ZR.stationDeck(),
      C = ZR.canopyDeck(),
      ci = GS.DECKS.indexOf(C);
    // 1. along the restroom's south wall, under the broken corner: every nearest climb spot has roof over its wall
    const bad = [];
    for (let x = S.x0; x <= S.x0 + 360; x += 20) {
      const q = ZR.climbSpot(S, [x, S.y1 + 26]);
      const e = q && ZR.edgeOf(q[0], q[1], S);
      if (q && !LY.onDeckAt(S, q[0] - e.nx * 40, q[1] - e.ny * 40))
        bad.push(q.map(Math.round).join(","));
    }
    // 2. my duck parked on the canopy, kept alive, for 300 beats
    let hp0 = null,
      drops = 0,
      ladder = 0; // (the most up the canopy's ladder at once)
    const was = {};
    for (let n = 0; n < 300; n++) {
      const s = room.state,
        me = s.pos[room.me];
      s.pos = {
        ...s.pos,
        [room.me]: { ...me, x: spot[0] / LY.W, y: spot[1] / LY.H, z: C.h },
      };
      const l4p = s.hang.l4p && s.hang.l4p[room.me];
      if (l4p) {
        if (hp0 === null) hp0 = l4p;
        s.hang = { ...s.hang, l4p: { ...s.hang.l4p, [room.me]: hp0 } };
      }
      if (s.hang.l4 && s.hang.l4.wait && !(s.hang.l4.wait.v || {})[room.me])
        room.send({ t: "hang", k: "l4", do: "endturn", on: true, id: room.me });
      if (r6) {
        const L = s.hang.l4;
        if (L && !L.wait && L.r < 6) s.hang = { ...s.hang, l4: { ...L, r: 6 } };
        const zs = Z.zombies(room.state);
        for (const z of zs)
          if (z.st < 3 && !(was[z.i] >= 0)) {
            z.x = 1960 + (z.i % 5) * 30;
            z.y = 1560 + Math.floor(z.i / 5) * 25;
            z.st = 2;
          }
        Z.store(room.state, zs);
      }
      beat();
      ladder = Math.max(
        ladder,
        Z.zombies(room.state).filter((z) => z.st === 6 && z.k === ci).length,
      );
      for (const z of Z.zombies(room.state)) {
        if (
          was[z.i] === 7 &&
          z.st === 2 &&
          z.k === undefined &&
          LY.heightAt(z.x, z.y) < S.h - 1 &&
          Math.abs(z.y - S.y1) < 40
        )
          drops++; // (off the station's roof, at its south edge, back on the ground)
        was[z.i] = z.st;
      }
    }
    const zs = Z.zombies(room.state).filter((z) => z.st !== 3);
    window.__fake = false;
    return {
      bad,
      drops,
      ladder,
      all: zs.length,
      up: zs.filter((z) => z.k === ci && z.st === 7).length,
    };
  }, o);
}
(async () => {
  const b = await chromium.launch(),
    errs = [],
    r = await play(b, errs, { spot: [880, 1420], ms: 200 }), // (by the ladder)
    e = await play(b, errs, { spot: [1876, 1400], ms: 350, r6: true }); // (by the plank)
  noErrors(errs);
  if (r.bad.length)
    fail(
      "zombies climb the restroom's brick wall under the broken roof at " +
        r.bad.join(" "),
    );
  for (const [q, w] of [
    [r, "by the ladder"],
    [e, "by the plank, round 6"],
  ])
    if (q.up < q.all * 0.8)
      fail(
        `only ${q.up} of ${q.all} zombies got up on the canopy (${w}) in 300 beats`,
      );
  if (r.ladder < 2)
    fail(`only ${r.ladder} zombie up the canopy's ladder at a time`); // (the owner's, Nov 21 14:52Z: "more than one zombie climb a ladder at the same time")
  if (r.drops > 3)
    fail(
      `zombies dropped off the station's roof at its south edge ${r.drops} times`,
    );
  console.log(
    `zclimb: ${r.up} of ${r.all} on the canopy by the ladder, ${e.up} of ${e.all} by the plank (round 6), ${r.ladder} up the ladder at once, ${r.drops} drops, restroom wall spots ok`,
  );
  await b.close();
})();
