/* The player pin's fakes, put in the page before it loads (tools/check/player.cjs). From the room on, the clock (Date.now)
   is fake and moves only with the beats and frames I play. Once the game screen is up and loaded, "all" makes the rest fake
   too: a seeded Math.random, performance.now, and requestAnimationFrame and the timers queued till I play a frame
   (__pgFrame), so the same keys give the same game frame for frame. */
(() => {
  /* two seeded streams: the room's (its rules and the computers, room.send) and the screen's, so what the screen draws
     never moves the room's chances */
  const seeds = { room: 1, screen: 1 };
  const rnd = (w) => {
    let a = seeds[w] | 0;
    a = (a + 0x6d2b79f5) | 0;
    seeds[w] = a;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const real = Math.random.bind(Math),
    dn = Date.now.bind(Date),
    pn = performance.now.bind(performance),
    raf = window.requestAnimationFrame.bind(window),
    st = window.setTimeout.bind(window),
    si = window.setInterval.bind(window),
    ct = window.clearTimeout.bind(window),
    ci = window.clearInterval.bind(window);
  const F = (window.__pg = {
    rnd: false, // (the seeded Math.random)
    inRoom: 0, // (inside room.send: the room's stream)
    date: false, // (the fake Date.now)
    all: false, // (performance.now, frames and timers too)
    now: 1.8e12,
    frames: [], // (the frames' callbacks, waiting for my next frame)
    timers: [], // (the timers made while "all": { k, at, fn, args, every })
    real: new Map(), // (callbacks given to the browser's own frames before "all")
  });
  window.__seed = (n) => {
    seeds.room = seeds.screen = n >>> 0;
  };
  Math.random = () =>
    F.rnd ? rnd(F.inRoom ? "room" : "screen") : F.inRoom ? rnd("room") : real();
  Date.now = () => (F.date ? Math.floor(F.now) : dn());
  performance.now = () => (F.all ? F.now - 1.8e12 + 1e8 : pn()); // (past any real time the page saw before)
  let id = 1e9; // (never a real timer's number)
  window.requestAnimationFrame = (cb) => {
    const k = id++;
    if (F.all) F.frames.push([k, cb]);
    else {
      F.real.set(k, cb);
      raf((t) => {
        if (F.real.delete(k)) cb(t);
      });
    }
    return k;
  };
  window.cancelAnimationFrame = (k) => {
    F.real.delete(k);
    F.frames = F.frames.filter((f) => f[0] !== k);
  };
  const later = (every) =>
    function (fn, ms, ...args) {
      if (!F.all) return (every ? si : st)(fn, ms, ...args);
      const k = id++,
        gap = Math.max(every ? 1 : 0, +ms || 0);
      F.timers.push({ k, at: F.now + gap, fn, args, every: every ? gap : 0 });
      return k;
    };
  window.setTimeout = later(false);
  window.setInterval = later(true);
  window.clearTimeout = window.clearInterval = (k) => {
    if (k >= 1e9) F.timers = F.timers.filter((t) => t.k !== k);
    else (ct(k), ci(k));
  };
  /* from now on everything is fake: the browser's waiting frames become mine */
  window.__pgAll = (seed) => {
    F.all = F.rnd = F.date = true;
    seeds.screen = seed >>> 0;
    for (const [k, cb] of F.real) F.frames.push([k, cb]);
    F.real.clear();
  };
  /* one frame, 60 a second: the timers that are due, in order, then the frame's callbacks */
  window.__pgFrame = () => {
    F.now += 1000 / 60;
    for (let n = 0; n < 1000; n++) {
      let due = null;
      for (const t of F.timers)
        if (t.at <= F.now && (!due || t.at < due.at)) due = t;
      if (!due) break;
      if (due.every) due.at += due.every;
      else F.timers = F.timers.filter((t) => t !== due);
      due.fn(...due.args);
    }
    const list = F.frames,
      t = performance.now();
    F.frames = [];
    for (const [, cb] of list) cb(t);
  };
  try {
    delete window.Worker;
  } catch {}
  window.Worker = undefined;
})();
