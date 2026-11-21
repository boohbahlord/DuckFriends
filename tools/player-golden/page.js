/* The player pin, inside the page (tools/check/player.cjs puts it there, with init.js before the page loads).
   __pgSetup(sc): a TEST room on the fake clock, the scenario's options, and the host's heartbeat played beat by beat till
   the game is on. __pgPlay(sc): once the screen is up and loaded, everything fake (init.js), my duck back at its start
   (reset duck), and then the scenario's keys and fingers frame by frame, a beat every 12 frames, with a hash of the whole
   room each frame and one for each part of it (to say where two runs part). */
const hash = (str) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
};
window.__pgSetup = async (sc) => {
  const net = await import("../../js/net.js"),
    { botActions } = await import("../../js/bots.js"),
    router = await import("../../js/router.js");
  const F = window.__pg,
    { profile } = await import("../../js/store.js");
  profile.secrets = { ...profile.secrets, 1357911: true }; // (everything unlocked: unlocks.js' code)
  Object.assign(profile.settings, sc.settings || {}); // (as Tap to move, or walking where I click)
  F.date = F.rnd = true;
  window.__seed(sc.seed || 1);
  const r = net.createLocalRoom({
    name: "P",
    test: true,
    computers: sc.computers ?? 1,
  });
  r.close(); // (no heartbeat of its own: I play it)
  window.__pgR = r;
  /* the room's own chances, whoever sends (init.js) */
  const send = r.send;
  r.send = (a) => {
    if (window.__pgSent && (!a.id || a.id === r.me))
      window.__pgSent[a.t] = (window.__pgSent[a.t] || 0) + 1; // (what my screen sent while I play: seen in pinned.json)
    F.inRoom++;
    try {
      send(a);
    } finally {
      F.inRoom--;
    }
  };
  window.__pgBeat = () => {
    F.inRoom++;
    try {
      r.send({ t: "tick", id: r.me });
      for (const a of botActions(r.state, Date.now())) r.send(a);
    } finally {
      F.inRoom--;
    }
  };
  r.send({
    t: "options",
    options: {
      modePick: "host",
      mapPick: "host",
      botWait: 1,
      ...sc.options,
    },
  });
  r.state.zmapAsked = 1;
  router.go("lobby", r);
  r.send({ t: "start" });
  const inGame = () =>
    sc.phase === "*"
      ? !["lobby", "countdown"].includes(r.state.phase)
      : r.state.phase === (sc.phase || "hang");
  const pre = [...(sc.pre || [])]; // (my moves before the game, as my question in Agree or Disagree: each tried every beat till it changes the room)
  for (let k = 0; k < 600 && !inGame(); k++) {
    F.now += 200;
    window.__pgBeat();
    if (pre.length) {
      const was = JSON.stringify(r.state);
      r.send({ id: r.me, ...pre[0] });
      if (JSON.stringify(r.state) !== was) pre.shift();
    }
  }
  if (sc.keys) {
    const P = r.state.players[r.me];
    r.state.players = {
      ...r.state.players,
      [r.me]: { ...P, duck: { ...P.duck, keys: sc.keys } },
    };
  } // (my duck's specials on its number keys)
  F.rnd = false; // (the screen's loading: real chance, nothing it makes is in the room)
  if (!inGame()) throw new Error("never got to the game: " + r.state.phase);
  return r.state.phase;
};
window.__pgPlay = async (sc) => {
  const r = window.__pgR,
    { hooks } = await import("../../js/hooks.js");
  window.__pgAll(sc.seed || 1);
  const said = hooks.resetDuck ? hooks.resetDuck() : "no reset";
  /* the scenario's input, by frame (x, y in shares of the screen, ms how long it's held):
     ["key", f, code, ms] a key; ["mouse", f, x, y] the mouse moved there; ["click", f, x, y, ms] the left button there;
     ["wheel", f, dy]; ["tap", f, x, y] a finger down and up; ["drag", f, x0, y0, x1, y1, ms, hold] a finger moved
     from there to there over ms, held there, and up; ["press", f, selector, ms] a finger on that button; ["swipe", f, selector, dx, dy, ms, hold] a
     finger down on that (as my duck, ".gduck.mine", or the attack stick, ".tpad-atk"), moved by dx, dy, held, and up;
     ["botOnMe", f] a computer put right on my duck (the room's own spot for it), so my duck eases away */
  const at = new Map(),
    on = (f, fn) => at.set(f, [...(at.get(f) || []), fn]);
  const fr = (ms) => Math.max(1, Math.round(ms / (1000 / 60)));
  const key = (type, code) =>
    (document.activeElement || document.body).dispatchEvent(
      new KeyboardEvent(type, {
        code,
        key: code === "Space" ? " " : code.replace(/^Key|^Digit/, ""),
        shiftKey: code.startsWith("Shift") && type === "keydown",
        bubbles: true,
        cancelable: true,
      }),
    );
  const point = (type, x, y, mouse, to) => {
    const o = {
      pointerId: mouse ? 1 : 7,
      pointerType: mouse ? "mouse" : "touch",
      isPrimary: true,
      button: type.endsWith("move") ? -1 : 0,
      buttons: type.endsWith("up") ? 0 : 1,
      clientX: x * innerWidth,
      clientY: y * innerHeight,
      bubbles: true,
      cancelable: true,
    };
    const t =
      to || document.elementFromPoint(o.clientX, o.clientY) || document.body;
    t.dispatchEvent(new PointerEvent("pointer" + type, o));
    if (mouse) t.dispatchEvent(new MouseEvent("mouse" + type, o));
    if (mouse && type === "up") t.dispatchEvent(new MouseEvent("click", o));
    return t;
  };
  const middle = (sel) => {
    const e = document.querySelector(sel),
      b = e && e.getBoundingClientRect();
    if (!b || !b.width) throw new Error("no " + sel + " to press");
    return [
      (b.left + b.width / 2) / innerWidth,
      (b.top + b.height / 2) / innerHeight,
    ];
  };
  for (const e of sc.input || []) {
    const [kind, f] = e;
    if (kind === "key") {
      on(f, () => key("keydown", e[2]));
      on(f + fr(e[3] || 100), () => key("keyup", e[2]));
    } else if (kind === "mouse") on(f, () => point("move", e[2], e[3], true));
    else if (kind === "click") {
      on(f, () => point("move", e[2], e[3], true));
      on(f, () => point("down", e[2], e[3], true));
      on(f + fr(e[4] || 80), () => point("up", e[2], e[3], true));
    } else if (kind === "wheel")
      on(f, () =>
        (
          document.elementFromPoint(innerWidth / 2, innerHeight / 2) ||
          document.body
        ).dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: e[2],
            bubbles: true,
            cancelable: true,
          }),
        ),
      );
    else if (kind === "tap") {
      on(f, () => point("down", e[2], e[3]));
      on(f + fr(120), () => point("up", e[2], e[3]));
    } else if (kind === "press") {
      let xy;
      on(f, () => point("down", ...(xy = middle(e[2]))));
      on(f + fr(e[3] || 120), () => {
        point("up", ...xy);
        document
          .elementFromPoint(xy[0] * innerWidth, xy[1] * innerHeight)
          .dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
      });
    } else if (kind === "swipe") {
      const n = fr(e[5] || 300);
      let xy, t; // (the moves go where the finger went down, as a captured pointer's do)
      on(f, () => (t = point("down", ...(xy = middle(e[2])))));
      for (let i = 1; i <= n; i++)
        on(f + i, () =>
          point(
            "move",
            xy[0] + (e[3] * i) / n,
            xy[1] + (e[4] * i) / n,
            false,
            t,
          ),
        );
      on(f + n + fr(e[6] || 0), () =>
        point("up", xy[0] + e[3], xy[1] + e[4], false, t),
      );
    } else if (kind === "drag") {
      const n = fr(e[6] || 300);
      on(f, () => point("down", e[2], e[3]));
      for (let i = 1; i <= n; i++)
        on(f + i, () =>
          point(
            "move",
            e[2] + ((e[4] - e[2]) * i) / n,
            e[3] + ((e[5] - e[3]) * i) / n,
          ),
        );
      on(f + n + fr(e[7] || 0), () => point("up", e[4], e[5]));
    } else if (kind === "botOnMe")
      on(f, () => {
        const st = r.state,
          me = st.pos[r.me],
          bot = st.seat.find((id) => id !== r.me && st.players[id].bot);
        if (me && bot)
          st.pos = {
            ...st.pos,
            [bot]: { ...st.pos[bot], x: me.x + 0.01, y: me.y },
          };
      });
    else throw new Error("no such input: " + kind);
  }
  const out = { all: [], parts: [], said };
  window.__pgSent = {};
  for (let f = 0; f < sc.frames; f++) {
    for (const fn of at.get(f) || []) fn();
    window.__pgFrame();
    if (f % 12 === 11) window.__pgBeat();
    await 0;
    const s = r.state;
    out.all.push(hash(JSON.stringify(s)));
    const p = {};
    for (const k of Object.keys(s.hang || {}).sort())
      p[k] = hash(JSON.stringify(s.hang[k]));
    for (const k of Object.keys(s).sort())
      if (k !== "hang") p["s." + k] = hash(JSON.stringify(s[k]));
    out.parts.push(p);
  }
  const me = r.state.pos[r.me];
  out.seen = {
    me: me && { x: +me.x.toFixed(4), y: +me.y.toFixed(4), z: me.z },
    sent: window.__pgSent,
  };
  window.__pgSent = null;
  return out;
};
