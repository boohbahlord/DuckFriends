/* Downpour: every opening a duck sees is one it walks through, every wall it sees stops it, and on the gas station's
   roof it falls through exactly the holes drawn (the owner's, Nov 20 22:10Z: "anything that looks like you can walk
   through it, you can walk through it"). Serve the folder (python3 -m http.server 8780), then
     node tools/downpour-walk.cjs
   It prints, for every door and hole, where along it a duck gets across, and for each roof hole whether the roof holds
   a duck exactly where it's drawn whole (fallOnRoof and standInHole must be 0). SHOTS=1 SPOTS='[["name", x, y, z]]'
   also takes pictures with the walking drawn over the world (green: a duck's feet stand there; red: they don't),
   into OUT (default /tmp/downpour-walk) */
const fs = require("fs");
const { chromium } = require("playwright");
const PORT = process.env.PORT || 8780,
  OUT = process.env.OUT || "/tmp/downpour-walk";
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const net = await import("./js/net.js"),
      router = await import("./js/router.js");
    const room = net.createLocalRoom({ name: "T", test: true, computers: 0 });
    window.room = room;
    room.send({
      t: "options",
      options: {
        mode: "l4dd",
        modePick: "host",
        mapPick: "host",
        l4start: 1,
      },
    });
    router.go("lobby", room);
    await wait(300);
    room.send({ t: "start" });
    for (
      let i = 0;
      i < 40 && (room.state.vt || room.state.phase !== "hang");
      i++
    ) {
      await wait(1000);
    }
    await wait(1500);
  });
  const res = await p.evaluate(async () => {
    const L = await import("./js/hangout/layout.js"),
      GS = await import("./js/hangout/stationmap.js");
    const S = GS.STATION,
      C = GS.CHAPEL;
    /* a duck walking straight across a wall at a place along it: does it get from one side to the other */
    const cross = (axis, at, s) => {
      let prev = null;
      for (let q = at - 40; q <= at + 40; q += 2) {
        const [x, y] = axis === "x" ? [s, q] : [q, s];
        if (!L.standable(x, y, 0, L.STEP, prev)) return false;
        prev = [x, y];
      }
      return true;
    };
    const spans = (axis, at, from, to) => {
      const out = [];
      let open = null;
      for (let s = from; s <= to; s += 2) {
        const ok = cross(axis, at, s);
        if (ok && open === null) open = s;
        if (!ok && open !== null) {
          out.push([open, s - 2]);
          open = null;
        }
      }
      if (open !== null) out.push([open, to]);
      return out;
    };
    const ops = [
      ...GS.WALK_HOLES.map((o) => [o.id, o.axis, o.at, o.a, o.b]),
      ...GS.INNER_DOORS.map((o) => [o.id + " door", "y", o.at, o.a, o.b]),
      ["chapel door", "x", C.y0, GS.CHAPEL_DOOR.a, GS.CHAPEL_DOOR.b],
      ["restroom's smashed corner (south)", "x", S.y1, S.x0 - 40, S.x0 + 100],
    ];
    const walls = ops.map(([id, axis, at, a, b]) => ({
      id,
      axis,
      at: Math.round(at),
      a: Math.round(a),
      b: Math.round(b),
      walk: spans(axis, at, a - 150, b + 150),
    }));
    /* whole walls: every place along each of the gas station's and the chapel's outer walls a duck gets through */
    const whole = [
      ["station north", "x", S.y0, S.x0, S.x1],
      ["station south", "x", S.y1, S.x0, S.x1],
      ["station west", "y", S.x0, S.y0, S.y1],
      ["station east", "y", S.x1, S.y0, S.y1],
      ["chapel north", "x", C.y0, C.x0, C.x1],
      ["chapel west", "y", C.x0, C.y0, C.y1],
      ["chapel east", "y", C.x1, C.y0, C.y1],
    ].map(([id, axis, at, a, b]) => ({
      id,
      walk: spans(axis, at, a + 20, b - 20),
    }));
    /* the roof: where a duck up there stands, against where the roof is drawn cut */
    const d = GS.DECKS[0];
    const roof = GS.ROOF_HOLES.map((o) => {
      let agree = 0,
        fallOnRoof = 0,
        standInHole = 0;
      for (
        let x = Math.min(o.x0, o.bb[0]) - 20;
        x <= Math.max(o.x1, o.bb[2]) + 20;
        x += 3
      )
        for (
          let y = Math.min(o.y0, o.bb[1]) - 20;
          y <= Math.max(o.y1, o.bb[3]) + 20;
          y += 3
        ) {
          if (x < d.x0 || x >= d.x1 || y < d.y0 || y >= d.y1) continue;
          const drawnHole = GS.ROOF_HOLES.some((q) => GS.inPoly(x, y, q.pts)),
            holds = L.onDeckAt(d, x, y);
          if (holds === !drawnHole) agree++;
          else if (!holds) fallOnRoof++;
          else standInHole++;
        }
      return { id: o.id, agree, fallOnRoof, standInHole };
    });
    return { walls, whole, roof, K: GS.K, FOOT: L.FOOT };
  });
  console.log(JSON.stringify(res, null, 1));
  if (process.env.SHOTS) {
    fs.mkdirSync(OUT, { recursive: true });
    await p
      .waitForFunction(
        () =>
          ![...document.querySelectorAll(".loading")].some(
            (e) => e.getBoundingClientRect().width,
          ),
        null,
        { timeout: 120000 },
      )
      .catch(() => console.log("still loading"));
    await p.waitForTimeout(1500);
    /* pictures: the camera on each place, the collision drawn over the world */
    const spots = JSON.parse(process.env.SPOTS || "[]");
    for (const [tag, X, Y, Z] of spots) {
      await p.evaluate(
        async ([X, Y, Z]) => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          const L = await import("./js/hangout/layout.js"),
            GS = await import("./js/hangout/stationmap.js");
          const me = room.state.pos[room.me],
            w = document.querySelector(".hang-world");
          const tr = () => {
            const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(
              w.style.transform,
            );
            return [+m[1], +m[2]];
          };
          const go = async (x, y) => {
            const me = room.state.pos[room.me];
            me.x = x / L.W;
            me.y = y / L.H;
            me.z = Z || 0;
            me.tp = Date.now();
            room.send({ t: "noop" });
            await wait(1200);
          };
          await go(1500, 1300);
          const a = tr();
          await go(1700, 1300);
          const c = tr();
          await go(X, Y);
          const sc = (c[0] - a[0]) / -200;
          document.querySelectorAll(".dbg-col").forEach((e) => e.remove());
          let s = "";
          for (let x = X - 400; x <= X + 400; x += 8)
            for (let y = Y - 300; y <= Y + 300; y += 8) {
              const ok = Z
                ? L.onDeckAt(GS.DECKS[0], x, y)
                : L.standable(x, y, 0, L.STEP);
              s += `<rect x="${(x * sc - 1).toFixed(1)}" y="${((y - (Z || 0)) * sc - 1).toFixed(1)}" width="2" height="2" fill="${ok ? "#0f0" : "#f00"}"/>`;
            }
          if (Z)
            for (const o of GS.ROOF_HOLES)
              s += `<path d="M${o.pts.map(([u, v]) => (u * sc).toFixed(1) + " " + ((v - Z) * sc).toFixed(1)).join("L")}Z" fill="none" stroke="#ff0" stroke-width="1"/>`;
          w.insertAdjacentHTML(
            "beforeend",
            `<svg class="dbg-col" style="position:absolute;left:0;top:0;overflow:visible;z-index:99999;pointer-events:none" width="1" height="1">${s}</svg>`,
          );
          document
            .querySelectorAll(".l4-round,[class*=l4-end]")
            .forEach((e) => (e.style.display = "none"));
          await wait(300);
          window.__sc = sc;
        },
        [X, Y, Z],
      );
      await p.screenshot({ path: `${OUT}/${tag}.png` });
      await p.evaluate(() =>
        document.querySelectorAll(".dbg-col").forEach((e) => e.remove()),
      );
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${OUT}/${tag}-plain.png` });
    }
  }
  console.log("errors", errs.slice(0, 5));
  await b.close();
})();
