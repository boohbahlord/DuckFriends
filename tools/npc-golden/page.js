/* The NPC golden runs, inside the page (run.cjs puts it there). Every run starts from the same seed and the same clock, makes its
   flow fields in step (no Worker), and plays the host's heartbeat (a tick every 200 ms, the computers' actions) with nothing
   drawn in between, so the same code gives the same game beat for beat. Each beat: a hash of the whole room, and one for each
   part of s and of s.hang (to say where two runs part). */
window.__golden = async (sc) => {
  const net = await import("../../js/net.js"),
    { botActions } = await import("../../js/bots.js"),
    SVm = await import("../../js/survrules.js"),
    AL = await import("../../js/allies.js"),
    GMm = await import("../../js/gunmenrules.js"),
    { W, H } = await import("../../js/hangout/layout.js"),
    { ARMS } = await import("../../js/guns.js"); // (here with the others: an await once the run has begun let beat 0 part under load)
  /* the room as text with every object's keys in name order: the order keys were added in (which module loaded first, so
     which activity or NPC came first) is not the game, and under a loaded machine it changes (Nov 22: bj and book,
     the NPC list) */
  const sorted = (v) =>
    JSON.stringify(v, (k, x) =>
      x && typeof x === "object" && !Array.isArray(x)
        ? Object.fromEntries(
            Object.keys(x)
              .sort()
              .map((q) => [q, x[q]]),
          )
        : x,
    );
  const hash = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
  };
  const sv0 = { ...SVm.SV },
    fr0 = { ...AL.FR },
    gm0 = { ...GMm.GM };
  window.__fake = true;
  window.__now = 1.8e12;
  window.__seed(sc.seed || 1);
  Object.assign(SVm.SV, sc.sv || {});
  Object.assign(AL.FR, sc.fr || {});
  Object.assign(GMm.GM, sc.gm || {});
  const r = net.createLocalRoom({
    name: "G",
    test: true,
    computers: sc.computers ?? 3,
  });
  r.close(); // (no real-time heartbeat: I play it below)
  /* "mirror": my duck plays as a computer too (the board modes wait for a person: with me idle, much of what they do never
     comes). It gets its moves from a room where only I am a computer, so the others' plans aren't touched */
  const mine = () => {
    const s = r.state,
      players = {};
    for (const [id, P] of Object.entries(s.players))
      players[id] = { ...P, bot: id === r.me };
    return botActions({ ...s, players }, window.__now).filter(
      (a) => a.id === r.me,
    );
  };
  const beat = () => {
    window.__now += 200;
    r.send({ t: "tick", id: r.me });
    for (const a of botActions(r.state, window.__now)) r.send(a);
    if (sc.mirror) for (const a of mine()) r.send(a);
  };
  r.send({
    t: "options",
    options: { modePick: "", mapPick: "", botWait: 1, ...sc.options },
  });
  r.send({ t: "start" });
  const pre = [...(sc.pre || [])]; // (moves before the game, as the host's Sandbox pick: each tried every beat till it takes)
  const inGame = () =>
    sc.phase === "*" // (any phase of the game: the board modes)
      ? !["lobby", "countdown"].includes(r.state.phase)
      : sc.phase
        ? r.state.phase === sc.phase
        : r.state.phase === "hang";
  let k = 0;
  const phases = [r.state.phase];
  while (!inGame() && k++ < 600) {
    beat();
    if (pre.length) {
      const was = r.state;
      r.send({ id: r.me, ...pre[0] });
      if (r.state !== was) pre.shift();
    }
    if (phases[phases.length - 1] !== r.state.phase) phases.push(r.state.phase);
  }
  if (!inGame())
    throw new Error("never got to the game: " + phases.join(" > "));
  /* in a scenario's values (and keys): "$me" my id, "$duck" my duck's look (as a made NPC's), "$mx", "$my" a spot by me (in shares of the map), "$wx", "$wy" (in world px),
     "$now" or "$now+1000" the clock */
  const fill = (v) => {
    if (Array.isArray(v)) return v.map(fill);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v).map(([a, b]) => [fill(a), fill(b)]),
      );
    if (typeof v !== "string") return v;
    const t = /^\$now([+-]\d+)?$/.exec(v);
    if (t) return window.__now + +(t[1] || 0);
    if (v === "$me") return r.me;
    if (v === "$duck") return r.state.players[r.me].duck;
    if (v === "$mx") return +(r.state.pos[r.me].x + 0.04).toFixed(4);
    if (v === "$my") return +r.state.pos[r.me].y.toFixed(4);
    if (v === "$wx") return Math.round(r.state.pos[r.me].x * W + 150);
    if (v === "$wy") return Math.round(r.state.pos[r.me].y * H);
    return v;
  };
  /* the scenario's changes to s.hang, to bring an NPC that otherwise only comes by chance (Justin from the fireplace, the
     merchant fighting): "key" is set as given, "key+" is merged into what's there; "@40" after it waits for beat 40 */
  let patches = Object.entries(sc.hang || {}),
    b = 0;
  const patch = () =>
    (patches = patches.filter(([k, v]) => {
      const [, key, add, at] = /^(.*?)(\+?)(?:@(\d+))?$/.exec(k),
        s = r.state;
      if (b < +(at || 0) || (add && !(s.hang && s.hang[key]))) return true;
      s.hang = {
        ...s.hang,
        [key]: add ? { ...s.hang[key], ...fill(v) } : fill(v),
      };
      return false;
    }));
  patch();
  /* Mad God Justin: his zombie wave state (s.mz) changed to bring a wave now ("mz": { "next": "$now" }) */
  if (sc.mz) r.state.mz = { ...r.state.mz, ...fill(sc.mz) };
  /* the scenario's own first moves */
  for (const a of sc.setup || []) {
    const was = r.state;
    r.send(fill({ id: r.me, ...a }));
    if (r.state === was && !a.may)
      throw new Error("setup move did nothing: " + JSON.stringify(a));
  }
  /* Survival: the next peak now (peakNow), or a rest now (restNow: where the friendly squad may come) */
  if (sc.peakNow || sc.restNow) {
    const s = r.state;
    s.hang = {
      ...s.hang,
      sv: {
        ...s.hang.sv,
        ph: sc.restNow ? "tail" : "rest",
        until: window.__now,
        k: Math.max(1, s.hang.sv.k || 0),
      },
    };
    delete s.hang.sv.wm; // (not waiting for the merchant: survrules.js)
  }
  const out = { all: [], parts: [] },
    per = {}, // (beats in each phase)
    ever = new Set(); // (which NPCs came)
  const lastSwipe = {}; // (each zombie's last swipe, s.hang.zs: a new one is one more swipe)
  let swipes = 0,
    mzPeak = 0, // (the most Mad God Justin's wave zombies out at once)
    sbPeak = 0; // (the most of Sandbox's NPCs on a map at once, s.hang.sbz)
  /* "bait": from that beat on, my duck stands on the nearest zombie each beat (and keeps its health), so the zombies swipe
     at it: every run then pins swipes, their times and the damage (the computers otherwise keep away from the zombies) */
  let hp0 = null;
  /* my duck stands on the nearest of these spots (shares of the map) and keeps its health */
  const parkOn = (list) => {
    const s = r.state,
      me = s.pos[r.me];
    if (!me || !list.length) return;
    list.sort(
      (a, c) =>
        Math.hypot(a[0] - me.x, (a[1] - me.y) * 0.5) -
        Math.hypot(c[0] - me.x, (c[1] - me.y) * 0.5),
    );
    s.pos = { ...s.pos, [r.me]: { ...me, x: list[0][0], y: list[0][1] } };
    const l4p = s.hang && s.hang.l4p && s.hang.l4p[r.me];
    if (l4p) {
      if (hp0 === null) hp0 = l4p;
      s.hang = { ...s.hang, l4p: { ...s.hang.l4p, [r.me]: hp0 } };
    }
  };
  const bait = () => {
    const s = r.state,
      zp = (s.hang && s.hang.zp) || [],
      list = []; // (the zombies' spots, in the shares of the map as the duck's: Dead Ducks Arcade's are in world px)
    for (let k = 0; k + 3 < zp.length; k += 4)
      if ((zp[k + 3] & 15) !== 3)
        list.push([(zp[k + 1] - 150) / W, zp[k + 2] / H]);
    for (const o of (s.mz && s.mz.zb) || []) if (!o.d) list.push([o.x, o.y]);
    for (const o of (s.hang && s.hang.sbz && s.hang.sbz.zb) || [])
      if (!o.d) list.push([o.x / W, o.y / H]); // (Sandbox's on a map: world px, sbcabin.js)
    parkOn(list);
  };
  /* "baitGm": { at: beat, k: kind ("sn" the sniper, "c" a criminal…) }: the same with Survival's gunmen of that kind
     (world px), so they fight my duck up close */
  const baitGm = () =>
    parkOn(
      ((r.state.hang && r.state.hang.gm && r.state.hang.gm.gb) || [])
        .filter((o) => !o.d && (!sc.baitGm.k || o.k === sc.baitGm.k))
        .map((o) => [o.x / W, o.y / H]),
    );
  /* "fire": my duck has these weapons on its number keys and uses them in turn, each beat one, aimed at the nearest
     duck (the board modes' specials, rules.js "use"; the guns pinned in play there) */
  let shots = 0;
  const fire = () => {
    const s = r.state,
      me = s.pos[r.me];
    if (!me) return;
    const P = s.players[r.me];
    if (!P.duck || P.duck.keys !== sc.fire)
      s.players = {
        ...s.players,
        [r.me]: { ...P, duck: { ...P.duck, keys: sc.fire } },
      };
    const them = s.seat
      .filter((id) => id !== r.me && s.pos[id] && s.pos[id].x >= 0)
      .map((id) => s.pos[id])
      .sort(
        (a, c) =>
          Math.hypot(a.x - me.x, a.y - me.y) -
          Math.hypot(c.x - me.x, c.y - me.y),
      )[0];
    const ax = them ? them.x - me.x : 1,
      ay = them ? them.y - me.y : 0,
      was = r.state;
    r.send({
      t: "use",
      id: r.me,
      what: sc.fire[b % sc.fire.length],
      face: ax < 0 ? -1 : 1,
      ax: +ax.toFixed(4),
      ay: +ay.toFixed(4),
    });
    if (r.state !== was) shots++;
  };
  /* "nade": { at, every, aim }: from beat at, every so many beats my duck throws a grenade at the nearest one of aim
     ("gm": Survival's gunmen, "duck": another duck), with grenades in its kit on the maps and on its keys elsewhere, so
     a blast's reach is pinned where the other runs never throw (Hangout, the gunmen: B6, before the rings) */
  const NADE = ["grenade"];
  const nade = () => {
    const s = r.state,
      N = sc.nade;
    if (!s.pos[r.me] || b < N.at || (b - N.at) % N.every) return;
    const P = s.players[r.me],
      a = s.hang && s.hang.l4a;
    if (a && a[r.me])
      s.hang = { ...s.hang, l4a: { ...a, [r.me]: { ...a[r.me], g: 3 } } };
    else if (P.duck && P.duck.keys !== NADE)
      s.players = {
        ...s.players,
        [r.me]: { ...P, duck: { ...P.duck, keys: NADE } },
      };
    let me = s.pos[r.me];
    const them = (
      N.aim === "gm"
        ? ((s.hang && s.hang.gm && s.hang.gm.gb) || [])
            .filter((o) => !o.d)
            .map((o) => ({ x: o.x / W, y: o.y / H }))
        : s.seat
            .filter((id) => id !== r.me && s.pos[id] && s.pos[id].x >= 0)
            .map((id) => s.pos[id])
    ).sort(
      (p, q) =>
        Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y),
    )[0];
    if (!them) return;
    if (N.aim === "gm") {
      me = { ...me, x: them.x - ARMS.grenade.far / W, y: them.y };
      s.pos = { ...s.pos, [r.me]: me };
      const l4p = s.hang.l4p && s.hang.l4p[r.me];
      if (l4p) {
        if (hp0 === null) hp0 = l4p;
        s.hang = { ...s.hang, l4p: { ...s.hang.l4p, [r.me]: hp0 } };
      } // (and up, with its health kept, as bait keeps it)
    } // (a grenade on the maps flies ARMS.grenade.far: my duck that far off, so it lands on them)
    const ax = them.x - me.x,
      ay = them.y - me.y;
    r.send({
      t: "use",
      id: r.me,
      what: "grenade",
      face: ax < 0 ? -1 : 1,
      ax: +ax.toFixed(4),
      ay: +ay.toFixed(4),
    });
  };
  for (b = 0; b < sc.beats; b++) {
    if (patches.length) patch();
    if (sc.nade) nade();
    if (sc.bait !== undefined && b >= sc.bait) bait();
    if (sc.baitGm && b >= sc.baitGm.at) baitGm();
    if (sc.fire) fire();
    beat();
    const s = r.state;
    per[s.phase] = (per[s.phase] || 0) + 1;
    for (const o of (s.hang && s.hang.gm && s.hang.gm.gb) || [])
      ever.add(
        { c: "criminal", s: "soldier", sn: "sniper", f: "friendly" }[o.k] ||
          o.k,
      );
    if (s.hang && s.hang.l4m) ever.add("merchant");
    if (s.seat.some((id) => s.players[id] && s.players[id].helper))
      ever.add("Justin");
    for (const [i, z] of Object.entries((s.hang && s.hang.zs) || {}))
      if (lastSwipe[i] !== z[0]) {
        lastSwipe[i] = z[0];
        swipes++;
      }
    for (const o of (s.mz && s.mz.zb) || [])
      if (o.a && lastSwipe["m" + o.i] !== o.a) {
        lastSwipe["m" + o.i] = o.a;
        swipes++;
      }
    for (const o of (s.hang && s.hang.sbz && s.hang.sbz.zb) || [])
      if (o.a && lastSwipe["c" + o.i] !== o.a) {
        lastSwipe["c" + o.i] = o.a;
        swipes++;
      }
    mzPeak = Math.max(mzPeak, ((s.mz && s.mz.zb) || []).length);
    sbPeak = Math.max(
      sbPeak,
      ((s.hang && s.hang.sbz && s.hang.sbz.zb) || []).length,
    );
    out.all.push(hash(sorted(s)));
    const p = {};
    for (const key of Object.keys(s.hang || {}).sort())
      p[key] = hash(sorted(s.hang[key]));
    for (const key of Object.keys(s).sort())
      if (key !== "hang") p["s." + key] = hash(sorted(s[key]));
    out.parts.push(p);
  }
  const g = (r.state.hang && r.state.hang.gm && r.state.hang.gm.gb) || [];
  out.seen = {
    phases: per,
    came: [...ever].sort().join(", "),
    gunmen: g.length,
    swipes,
    shots,
    mgjWaveZombiesPeak: mzPeak,
    sandboxMapNpcsPeak: sbPeak,
    zombies: ((r.state.hang && r.state.hang.zp) || []).length / 4,
    sandboxNpcs: [
      ...(((r.state.hang && r.state.hang.sbz) || {}).zb || []),
      ...((r.state.mz && r.state.mz.zb) || []),
    ]
      .map((o) => (o.wp ? "gun" : "plain") + (o.d ? "-dead" : ""))
      .join(" "),
  };
  if (window.__probe) out.seen.probe = window.__probe; // (counters a change can set while I look for what a run covers)
  window.__probe = null;
  Object.assign(SVm.SV, sv0);
  Object.assign(AL.FR, fr0);
  Object.assign(GMm.GM, gm0);
  window.__fake = false;
  return out;
};
