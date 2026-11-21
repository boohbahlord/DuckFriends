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
    { W, H } = await import("../../js/hangout/layout.js");
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
  const beat = () => {
    window.__now += 200;
    r.send({ t: "tick", id: r.me });
    for (const a of botActions(r.state, window.__now)) r.send(a);
  };
  r.send({
    t: "options",
    options: { modePick: "", mapPick: "", botWait: 1, ...sc.options },
  });
  r.state.zmapAsked = 1;
  r.send({ t: "start" });
  const pre = [...(sc.pre || [])]; // (moves before the game, as the host's Sandbox pick: each tried every beat till it takes)
  const inGame = () =>
    sc.phase ? r.state.phase === sc.phase : r.state.phase === "hang";
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
  let mzPeak = 0; // (the most Mad God Justin's wave zombies out at once)
  for (b = 0; b < sc.beats; b++) {
    if (patches.length) patch();
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
    mzPeak = Math.max(mzPeak, ((s.mz && s.mz.zb) || []).length);
    out.all.push(hash(JSON.stringify(s)));
    const p = {};
    for (const key of Object.keys(s.hang || {}).sort())
      p[key] = hash(JSON.stringify(s.hang[key]));
    for (const key of Object.keys(s).sort())
      if (key !== "hang") p["s." + key] = hash(JSON.stringify(s[key]));
    out.parts.push(p);
  }
  const g = (r.state.hang && r.state.hang.gm && r.state.hang.gm.gb) || [];
  out.seen = {
    phases: per,
    came: [...ever].sort().join(", "),
    gunmen: g.length,
    mgjWaveZombiesPeak: mzPeak,
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
