/* I want the maps' grenades checked (the director plan, Nov 28; bowdraw.js, weaponuse.js nadeFly, l4ddrules.js l4Use,
   NADE): held 2 s, one thrown goes off 3 s later; held to its fuse's end, it goes off in the hand; thrown on open
   ground it rises and lands about its range away, and lies there; thrown under the pump roof, it comes back down off it till its fuse ends; thrown at the church's wall,
   taller than its arc, it comes back off it; the launcher's flies over a zombie in its way, lands, and goes off 3 s
   after the shot.
   Run: node tools/check/run.mjs grenades */
const { fail, noErrors, fakedPage } = require("./lib.cjs");
(async () => {
  const { b, p, errs } = await fakedPage();
  const got = await p.evaluate(async () => {
    const R = await import("./js/l4ddrules.js"),
      Z = await import("./js/zombies.js"),
      GS = await import("./js/hangout/stationmap.js"),
      LY = await import("./js/hangout/layout.js"),
      { NADE } = await import("./js/gamedefaults.js"),
      { ARMS } = await import("./js/guns.js"),
      { nadeAt } = await import("./js/weaponuse.js"),
      { l4Room } = await import("./tools/check/l4room.js");
    const room = await l4Room(
        "G1",
        (r) => r.state.hang && r.state.hang.l4 && r.state.hang.l4.r >= 1,
      ),
      me = room.me,
      { W, H } = LY, // (Downpour's size, once the room is on it)
      tick = (ms, each) => {
        for (let t = 0; t < ms; t += 100) {
          window.__now += 100;
          room.send({ t: "tick", id: me });
          if (each) each();
        }
      };
    const ready = (w, x, y) => {
      const s = room.state,
        kit = R.kitOf(s, me);
      Z.store(s, [], false);
      s.hang.l4a = {
        ...s.hang.l4a,
        [me]: {
          ...kit,
          g: 4,
          u: {},
          sl:
            w === "glauncher"
              ? [kit.sl[0], "glauncher", ...kit.sl.slice(2)]
              : kit.sl,
          am: { ...kit.am, glauncher: [6, 12] },
        },
      };
      s.pos[me] = { ...s.pos[me], x: x / W, y: y / H, z: 0, w };
      s.shots = [];
      window.__now += 3000;
    };
    const mine = () =>
      (room.state.shots || []).find((sh) => sh.by === me && sh.tb != null);
    const out = {};
    /* cooked 2 s, then thrown east on open ground */
    const clear = (x, y, far) => {
      for (let d = 0; d <= far; d += 10)
        if (LY.floorH(x + d, y, 300) || LY.solidsAt(x + d, y, 0).length)
          return false;
      return true;
    };
    let ox = 300,
      oy = 300; // (open ground with nothing on it for the launcher's range east)
    while (!clear(ox, oy, ARMS.glauncher.far + 200)) {
      oy += 40;
      if (oy > H - 300) [ox, oy] = [ox + 200, 300];
    }
    ready("grenade", ox, oy);
    room.send({ t: "draw", w: "grenade" });
    tick(2000);
    room.send({ t: "use", what: "grenade", ax: 1, ay: 0, face: 1 });
    const sh = mine();
    out.cooked = sh ? sh.end - sh.t : -1;
    let top = 0,
      lay = null;
    tick(2900, () => {
      const q = mine();
      if (!q) return;
      const at = nadeAt(q, window.__now);
      top = Math.max(top, at.z);
      if (!q.g && !lay) lay = at;
    });
    out.top = Math.round(top);
    out.far = lay ? Math.round(lay.x * W - ox) : -1;
    out.lay = !!mine();
    tick(300);
    out.gone = !mine();
    /* thrown under the pump roof: it comes back down off it */
    ready("grenade", 2600 * 0.6, 2100 * 0.6);
    room.send({ t: "draw", w: "grenade" });
    room.send({ t: "use", what: "grenade", ax: 1, ay: 0, face: 1 });
    let under = 0;
    tick(1500, () => {
      const q = mine();
      if (q) under = Math.max(under, q.hz + nadeAt(q, window.__now).z);
    });
    out.under = [
      Math.round(under),
      LY.floorH(2600 * 0.6 + 100, 2100 * 0.6, 200),
    ];
    /* held to the end of its fuse */
    ready("grenade", ox, oy);
    const g0 = R.kitOf(room.state, me).g;
    room.send({ t: "draw", w: "grenade" });
    tick(NADE.FUSE + 300);
    out.hand = {
      left: R.kitOf(room.state, me).g,
      was: g0,
      drawn: !!(room.state.draw || {})[me],
      boom: (room.state.fx || []).some(
        (f) => f.kind === "boom" && f.t >= window.__now - 400,
      ),
    };
    /* at the church's west wall, 80 px off */
    const C = GS.CHAPEL;
    let wy = C.y0 + 40; // (a stretch of it with no window: by one, a shot goes on through, walled)
    while (wy < C.y1 && ![-40, 0, 40].every((d) => R.walled(C.x0, wy + d, 60)))
      wy += 20;
    ready("grenade", C.x0 - 80, wy);
    room.send({ t: "draw", w: "grenade" });
    room.send({ t: "use", what: "grenade", ax: 1, ay: 0, face: 1 });
    let back = null;
    tick(2000, () => {
      const q = mine();
      if (q && !q.g && !back) back = nadeAt(q, window.__now);
    });
    out.wall = back ? Math.round(back.x * W - C.x0) : null;
    /* the launcher, a zombie 120 px in its way */
    ready("glauncher", ox, oy);
    const zs = Z.zombies(room.state);
    room.state.hang.l4 = {
      ...room.state.hang.l4,
      next: room.state.hang.l4.next || 1,
    };
    const zi = Z.l4Spawn(room.state, (ox + 120) / W, oy / H, { speed: 0 });
    room.send({ t: "use", what: "glauncher", ax: 1, ay: 0, face: 1 });
    const L = mine();
    out.lfuse = L ? L.end - L.t : -1;
    tick(1500);
    const z = Z.zombies(room.state).find((q) => q.i === zi);
    out.over = !!z && z.st !== 3;
    const L2 = mine();
    out.lfar = L2 ? Math.round(nadeAt(L2, window.__now).x * W - ox) : -1;
    tick(1700);
    out.lgone = !mine();
    out.range = ARMS.grenade.far;
    out.lrange = ARMS.glauncher.far;
    window.__fake = false;
    return out;
  });
  await b.close();
  noErrors(errs);
  const bad = (m) => fail("grenades: " + m + " " + JSON.stringify(got));
  if (got.cooked !== 3000) bad("cooked 2 s: off 3 s after the throw");
  if (!(got.top > 64)) bad("it flies over an arc");
  if (!(Math.abs(got.far - got.range) < got.range * 0.15))
    bad("it lands about its range away");
  if (!got.lay || !got.gone)
    bad("it lies there till its fuse ends, then goes off");
  if (!(got.under[0] < got.under[1]))
    bad("under the pump roof, it stays under it");
  if (got.hand.left !== got.hand.was - 1 || got.hand.drawn || !got.hand.boom)
    bad("held to the end: it goes off in the hand");
  if (got.wall === null || !(got.wall < 0)) bad("off the church's wall, back");
  if (got.lfuse !== 3000) bad("the launcher's: 3 s");
  if (!got.over) bad("the launcher's flies over a zombie in its way");
  if (!(got.lfar > got.lrange * 0.5) || !got.lgone)
    bad("the launcher's lands far, then goes off");
})();
