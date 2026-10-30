/* ---------- the rules of Mad God Justin ----------
   A boss fight: every duck has only the knife (always out, no specials) and together they must bring Justin's HP to 0
   before the timer runs out (1 minute; the lobby adds 30 s at a time, up to 2 minutes). His HP is 8 + 6 for each player
   when the fight starts, and one stab takes 1. Any hit knocks a duck down for 5 seconds (no HP of their own), and he
   never goes after a duck that's down.
   - His pistol: the usual 7 shots, then the usual 3.5 s reload; the more of the ducks are down, the readier he is to
     reload early. While it reloads he sprints at a duck to hammer it, and a duck that comes up close gets the hammer too.
   - From the sky: each fight he has 1 lightning and 1 fire, plus 1 more of either for each player. The lower his HP, the
     likelier he uses one, and at 1 HP it's certain while any are left. Lightning gets likelier with each player.
   - The meteor, once a fight (unless he dies first), at a random moment when 30 to 5 seconds are left: he shouts one of
     his GOD lines and fades away, the timer freezes under ice, a meteor lands and knocks every duck down for 5 seconds,
     maybe one used strike comes back, then he fades in again with a pump shotgun added (a wide cone of pellets that act
     like bullets, then 1.75 s of pumping) and the timer comes back with 30 more seconds.
   - HP 0: he stands on the LOSER podium and lightning strikes him, and he stays burnt while it shows. Time up: he wins and
     says a winning line. Then the stats (Most Damage, Killing Blow, Hit the Most, the jumps) with Try again or Back to the
     lobby.
   He's the Justin option's board Justin (boardjustin.js: s.justin, justinAt, his look, lines and bullets); this file is
   his brain here. s.mgj = { hp, max, n (the fight's number), dmg {id: stabs}, hits {id: times he knocked them down},
   kill, won, strikes (what's left in the sky), strikeAt, metAt (ms left on the timer when the meteor comes), met (the
   meteor now: { at, fx, hit, back }), metDone, left (ms left while the timer is frozen), shotgun, over }. */
import {
  enter,
  playing,
  seatLate,
  needed,
  say,
  boardPhases,
  SHOT_SPEED,
  MAG,
  RELOAD,
  swing,
} from "./rules.js";
import { justinAt, JUSTIN_ID } from "./boardjustin.js";
import { holdDown } from "./hangout/death.js";
import {
  E_LINES,
  DEATH_LINES,
  GOD_LINES,
  WIN_LINES,
  LOSE_LINES,
} from "./hangout/justin.js";

export const isMgj = (s) => s.options.mode === "mgj";
export const MGJ_TIMES = [60, 90, 120];
export const mgjTime = (s) =>
  MGJ_TIMES.includes(+s.options.mgjTime) ? +s.options.mgjTime : 60;
export const MGJ_END = 9; // seconds of the podium (or his winning line), then the stats
export const MGJ_ZAP = 1600; // ms into a win: lightning strikes him on the podium
export const MGJ_DOWN = 5000; // ms a hit duck stays down
export const MGJ_POD = { x: 0.5, y: 0.72 }; // where his podium stands (low enough for his bubble over him, under the cloud)
export const hpOf = (n) => 8 + 6 * n;
/* the meteor, in ms from its start: he's faded out by FADE; the meteor shows from FALL and lands at LAND; he's back at
   BACK and the timer runs again at RESUME */
export const MET = {
  FADE: 1000,
  FALL: 1400,
  LAND: 2900,
  BACK: 6200,
  RESUME: 8000,
};
export const PUMP = 1750,
  PELLETS = 5,
  PELLET_SPEED = 0.3,
  PELLET_LIFE = 1400,
  SPREAD = 0.34;
const SPEED = 0.2,
  RX = 0.03,
  RY = 0.08,
  STRIKE = 1600;
const rnd = (a, b) => a + Math.random() * (b - a);
const any = (xs) => xs[Math.floor(Math.random() * xs.length)];
const r3 = (v) => Math.round(v * 1000) / 1000;
const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[k]] = [xs[k], xs[i]];
  }
  return xs;
};

/* the timer: ms left (frozen under ice while the meteor falls) */
export const mgjLeft = (s, now) =>
  !s.mgj
    ? 0
    : s.mgj.met || s.mgj.left
      ? s.mgj.left
      : Math.max(0, (s.ends || 0) - now);
export const mgjFrozen = (s) => !!(s.mgj && s.mgj.met);
/* is he faded out (the meteor)? */
export const mgjGone = (s, now) => {
  const m = s.mgj && s.mgj.met;
  return !!m && now - m.at >= MET.FADE * 0.5 && now - m.at < MET.BACK;
};

/* the fight starts (from the countdown, or Try again) */
export function mgjStart(s, now) {
  seatLate(s);
  const ids = playing(s),
    n = Math.max(1, ids.length),
    max = hpOf(n);
  const strikes = shuffle([
    "lightning",
    "fire",
    ...ids.map(() => (Math.random() < 0.5 ? "lightning" : "fire")),
  ]);
  s.mgj = {
    n: ((s.mgj && s.mgj.n) || 0) + 1,
    hp: max,
    max,
    dmg: {},
    hits: {},
    kill: null,
    won: null,
    strikes,
    strikeAt: now + 6000,
    metAt: rnd(5000, 30000),
    met: null,
    metDone: false,
    left: 0,
    shotgun: false,
    over: 0,
  };
  s.pos = {};
  s.lock = {};
  s.shots = [];
  s.down = {};
  s.up = {};
  for (const id of s.seat) if (s.players[id]) delete s.players[id].dead;
  s.seat.forEach((id, k) => {
    s.pos[id] = {
      x: r3(0.14 + 0.08 * (k % 2)),
      y: r3((k + 1) / (s.seat.length + 1)),
    };
  });
  s.justin = {
    x0: 0.84,
    y0: 0.5,
    x1: 0.84,
    y1: 0.5,
    t: now,
    v: SPEED,
    k: null,
    list: (s.justin && s.justin.list) || [],
    gods: (s.justin && s.justin.gods) || [],
    w: "handgun",
    mag: { n: 0, r: 0 },
    fireAt: now + 2500,
    hamAt: now + 5000,
    sgR: 0,
    next: now + 1500,
    say: now + rnd(9000, 16000),
    ouch: 0,
  };
  enter(s, "boss", now);
  s.ends = now + mgjTime(s) * 1000;
  say(s, `Defeat Justin! He has ${max} HP.`);
  return s;
}

/* a duck stabbed him: 1 damage (none while he's faded out, or once the fight is over) */
export function mgjStab(s, by, now, log) {
  const m = s.mgj;
  if (!m || s.phase !== "boss" || m.hp <= 0 || mgjGone(s, now) || m.met)
    return false;
  m.hp--;
  m.dmg = { ...m.dmg, [by]: (m.dmg[by] || 0) + 1 };
  const j = s.justin;
  if (m.hp <= 0) {
    m.kill = by;
    return true;
  }
  if (now > (j.ouch || 0) && Math.random() < 0.3) {
    j.ouch = now + 3500;
    log(s, { npc: JUSTIN_ID, name: "Justin", text: any(DEATH_LINES) });
  }
  return true;
}
/* he knocked a duck down (a bullet, a pellet, the hammer, the sky): counted for Hit the Most */
export function mgjHurt(s, id) {
  const m = s.mgj;
  if (m && s.phase === "boss")
    m.hits = { ...m.hits, [id]: (m.hits[id] || 0) + 1 };
}

/* what ends a stage: HP 0 (a win) or the timer (a loss); the podium's time; Try again on the stats */
export function mgjAdvance(s, now, force, log) {
  const m = s.mgj;
  if (!m) return s;
  if (s.phase === "boss") {
    if (m.hp <= 0) return mgjEnd(s, now, true, log);
    if (force || (!m.met && s.ends && now >= s.ends))
      return mgjEnd(s, now, false, log);
    return s;
  }
  if (s.phase === "mgjend")
    return force || (s.ends && now >= s.ends) ? enter(s, "results", now) : s;
  if (s.phase === "results") {
    const on = playing(s),
      d = on.filter((id) => s.done[id]).length;
    if (force || d >= on.length || d >= needed(s)) {
      s.round++;
      return mgjStart(s, now);
    }
  }
  return s;
}
function mgjEnd(s, now, won, log) {
  const m = s.mgj,
    j = s.justin,
    line = (text) => log(s, { npc: JUSTIN_ID, name: "Justin", text });
  m.won = won;
  m.over = now;
  m.met = null;
  m.left = 0;
  s.shots = [];
  delete j.swing;
  delete j.god;
  if (won) {
    // onto the podium in the middle
    Object.assign(j, {
      k: null,
      x0: MGJ_POD.x,
      y0: MGJ_POD.y,
      x1: MGJ_POD.x,
      y1: MGJ_POD.y,
      t: now,
      v: SPEED,
      w: "",
    });
    line(any(LOSE_LINES));
    s.mgjWinN = (s.mgjWinN || 0) + 1;
    s.mgjWins = [
      ...(s.mgjWins || []).slice(-9),
      { n: s.mgjWinN, ids: playing(s) },
    ]; // (each device counts its own win once: unlocks.js)
  } else {
    const at = justinAt(j, now);
    Object.assign(j, {
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(at.x),
      y1: r3(at.y),
      t: now,
    });
    line(any(WIN_LINES));
  }
  s.mgjPast = [
    ...(s.mgjPast || []),
    {
      round: s.round,
      n: m.n,
      won,
      max: m.max,
      hp: Math.max(0, m.hp),
      dmg: { ...m.dmg },
      hits: { ...m.hits },
      kill: m.kill,
      ids: playing(s),
    },
  ];
  say(
    s,
    won
      ? `Justin is defeated!${m.kill && s.players[m.kill] ? ` ${s.players[m.kill].name} got the killing blow.` : ""}`
      : `Time's up: Justin wins with ${m.hp} HP left.`,
  );
  enter(s, "mgjend", now);
  s.ends = now + MGJ_END * 1000;
  return s;
}
/* ---------- his brain, on the host's heartbeat: true when anything changed ---------- */
export function mgjTick(s, now, log) {
  const m = s.mgj,
    j = s.justin;
  if (!m || !j || !boardPhases(s).includes(s.phase)) return false;
  const fx = (o) => {
    s.fxN = (s.fxN || 0) + 1;
    s.fx = [
      ...(s.fx || []).slice(-19),
      { n: s.fxN, by: JUSTIN_ID, t: now, ...o },
    ];
  };
  const line = (text) => log(s, { npc: JUSTIN_ID, name: "Justin", text });
  if (s.phase === "mgjend") {
    // a win: lightning on the podium, once
    if (m.won && !m.zapped && now - s.at >= MGJ_ZAP) {
      m.zapped = true;
      fx({ kind: "lightning", who: [JUSTIN_ID] });
      return true;
    }
    return false;
  }
  let ch = false;
  const at = justinAt(j, now);
  const standing = () =>
    playing(s).filter(
      (id) =>
        s.pos[id] && s.pos[id].x >= 0 && s.players[id] && !s.players[id].dead,
    );
  const far = (p, q = at) => Math.hypot((p.x - q.x) / RX, (p.y - q.y) / RY); // in duck lengths
  const knock = (id) => {
    const P = s.players[id];
    if (!P || P.dead) return;
    P.dead = true;
    holdDown(s, id, now);
    mgjHurt(s, id);
  };
  const stop = () =>
    Object.assign(j, {
      k: null,
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(at.x),
      y1: r3(at.y),
      t: now,
    });
  const godLine = () => {
    if (!(j.gods || []).length) j.gods = shuffle(GOD_LINES.map((_, i) => i));
    line(GOD_LINES[j.gods.shift()]);
  };

  /* the meteor */
  if (!m.met && !m.metDone && s.ends && s.ends - now <= m.metAt) {
    m.met = { at: now };
    m.left = Math.max(0, s.ends - now);
    s.ends = 0;
    delete j.swing;
    delete j.god;
    stop();
    godLine();
    if (Math.random() < 0.5)
      m.strikes = [...m.strikes, Math.random() < 0.5 ? "lightning" : "fire"]; // (maybe one strike comes back)
    return true;
  }
  if (m.met) {
    const t = now - m.met.at;
    if (t >= MET.FALL && !m.met.fx) {
      m.met.fx = true;
      fx({ kind: "meteor", land: m.met.at + MET.LAND });
      ch = true;
    }
    if (t >= MET.LAND && !m.met.hit) {
      // every duck on the board goes down
      m.met.hit = true;
      s.shots = [];
      for (const id of playing(s)) {
        const P = s.players[id];
        if (P && s.pos[id]) {
          P.dead = true;
          holdDown(s, id, now);
        }
      }
      ch = true;
    }
    if (t >= MET.BACK && !m.met.back) {
      m.met.back = true;
      m.shotgun = true;
      j.w = "shotgun";
      j.sgR = now + 900;
      j.fireAt = now + 1600;
      j.hamAt = now + 2500;
      fx({ kind: "pump" });
      ch = true;
    }
    if (t >= MET.RESUME) {
      s.ends = now + m.left + 30000;
      m.left = 0;
      m.met = null;
      m.metDone = true;
      m.strikeAt = Math.max(m.strikeAt, now + 2500);
      ch = true;
    }
    return ch;
  }

  /* his everyday lines now and then */
  if (now >= j.say) {
    if (!(j.list || []).length) j.list = shuffle(E_LINES.map((_, i) => i));
    line(E_LINES[j.list.shift()]);
    j.say = now + rnd(15000, 30000);
    ch = true;
  }
  /* from the sky, a moment after his line */
  if (j.god && now >= j.god.at) {
    const them = standing(),
      id = them.includes(j.god.id) ? j.god.id : any(them),
      kind = j.god.kind;
    delete j.god;
    ch = true;
    if (id) {
      knock(id);
      fx({ kind, who: [id] });
    }
  }
  if (!j.god && now >= m.strikeAt && m.strikes.length) {
    m.strikeAt = now + 2500;
    const n = playing(s).length,
      L = m.strikes.includes("lightning"),
      F = m.strikes.includes("fire");
    const kind =
      L && F
        ? Math.random() < n / (n + 1)
          ? "lightning"
          : "fire"
        : L
          ? "lightning"
          : "fire";
    const low =
        m.max > 1 ? Math.max(0, Math.min(1, 1 - (m.hp - 1) / (m.max - 1))) : 1,
      base = Math.min(1, kind === "lightning" ? 0.035 * n : 0.035);
    const them = standing();
    if (them.length && Math.random() < base + (1 - base) * low ** 3) {
      m.strikes = [...m.strikes];
      m.strikes.splice(m.strikes.indexOf(kind), 1);
      godLine();
      j.god = { id: any(them), at: now + STRIKE, kind };
      ch = true;
    }
  }
  const them = standing();
  if (!them.length) {
    if (j.swing) {
      delete j.swing;
      ch = true;
    }
    return ch;
  } // (everyone's down: he waits)
  const nearest = them
    .map((id) => [id, far(s.pos[id])])
    .sort((a, b) => a[1] - b[1])[0];
  const aimAt = (p) => {
    const dx = p.x - at.x,
      dy = p.y - at.y,
      d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d];
  };
  const swingNow = (id) => {
    const p = s.pos[id],
      dx = p.x - at.x,
      dy = p.y - at.y,
      aim = Math.hypot(dx, dy) > 1e-4 ? [dx, dy] : [1, 0];
    const hit = swing(s, JUSTIN_ID, "hammer", aim, now, at);
    for (const h of hit) mgjHurt(s, h);
    fx({
      kind: "use",
      what: "hammer",
      who: [],
      face: aim[0] < 0 ? -1 : 1,
      ax: +aim[0].toFixed(3),
      ay: +aim[1].toFixed(3),
      ...(hit.length ? { hit } : {}),
    });
    j.hamAt = now + rnd(2500, 3500);
    j.next = now + 700;
  };
  /* the hammer: on his way to a duck, then the swing (toward where it stands by then) */
  if (j.swing) {
    const p = s.pos[j.swing.id];
    if (
      !p ||
      p.x < 0 ||
      (s.players[j.swing.id] || {}).dead ||
      now > j.swing.at + 2500
    ) {
      delete j.swing;
      return true;
    }
    if (now < j.swing.at) return ch;
    const id = j.swing.id;
    delete j.swing;
    swingNow(id);
    return true;
  }
  const reloading = j.mag.r > now;
  if (j.mag.r && now >= j.mag.r) {
    j.mag = { n: 0, r: 0 };
    ch = true;
  }
  /* a duck up close gets the hammer (a moment's wind-up, so it can step away) */
  if (now >= j.hamAt && nearest[1] < 1.8) {
    stop();
    j.swing = { id: nearest[0], at: now + 350 };
    j.hamAt = now + 3000;
    return true;
  }
  /* reloading: he sprints at a duck to hammer it */
  if (reloading && now >= j.hamAt) {
    const id = nearest[0],
      p = s.pos[id],
      ux = (at.x - p.x) / RX,
      uy = (at.y - p.y) / RY,
      d = Math.hypot(ux, uy) || 1;
    const to = {
        x: Math.max(0.03, Math.min(0.97, p.x + (ux / d) * 1.4 * RX)),
        y: Math.max(0, Math.min(1, p.y + (uy / d) * 1.4 * RY)),
      },
      v = SPEED * 1.9;
    Object.assign(j, {
      k: null,
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(to.x),
      y1: r3(to.y),
      t: now,
      v,
    });
    j.swing = {
      id,
      at: now + (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000 + 250,
    };
    j.hamAt = now + 4000;
    return true;
  }
  /* the guns */
  if (now >= j.fireAt && !reloading) {
    const id = any(them),
      p = s.pos[id],
      [ax, ay] = aimAt(p);
    const close = them.filter((t) => far(s.pos[t]) < 9);
    if (m.shotgun && now >= j.sgR && close.length) {
      // the shotgun: a cone of pellets at a duck close enough
      const q = s.pos[any(close)],
        ux = (q.x - at.x) / RX,
        uy = (q.y - at.y) / RY,
        a0 = Math.atan2(uy, ux);
      fx({
        kind: "use",
        what: "shotgun",
        who: [],
        face: ux < 0 ? -1 : 1,
        ax: +Math.cos(a0).toFixed(3),
        ay: +Math.sin(a0).toFixed(3),
      });
      const n0 = s.fxN;
      for (let i = 0; i < PELLETS; i++) {
        const a =
            a0 + SPREAD * ((i / (PELLETS - 1)) * 2 - 1) + rnd(-0.04, 0.04),
          bx = Math.cos(a) * RX,
          by = Math.sin(a) * RY,
          bl = Math.hypot(bx, by);
        s.shots = [
          ...(s.shots || []),
          {
            n: n0 * 10 + i,
            by: JUSTIN_ID,
            k: "pellet",
            x0: at.x,
            y0: at.y,
            vx: +((bx / bl) * PELLET_SPEED).toFixed(4),
            vy: +((by / bl) * PELLET_SPEED).toFixed(4),
            t: now,
            lx: at.x,
            ly: at.y,
            life: PELLET_LIFE,
          },
        ];
      }
      Object.assign(j, {
        w: "shotgun",
        ax: +(Math.cos(a0) * RX).toFixed(4),
        ay: +(Math.sin(a0) * RY).toFixed(4),
        sgR: now + PUMP,
        fireAt: now + rnd(700, 1000),
      });
      return true;
    }
    /* the pistol */
    fx({
      kind: "use",
      what: "handgun",
      who: [],
      face: ax < 0 ? -1 : 1,
      ax: +ax.toFixed(3),
      ay: +ay.toFixed(3),
    });
    s.shots = [
      ...(s.shots || []),
      {
        n: s.fxN * 10,
        by: JUSTIN_ID,
        k: "handgun",
        x0: at.x,
        y0: at.y,
        vx: +(ax * SHOT_SPEED).toFixed(4),
        vy: +(ay * SHOT_SPEED).toFixed(4),
        t: now,
        lx: at.x,
        ly: at.y,
      },
    ];
    const n = j.mag.n + 1,
      down = 1 - them.length / Math.max(1, playing(s).length);
    j.mag = {
      n,
      r: n >= MAG || Math.random() < down * 0.45 ? now + RELOAD : 0,
    }; // (the more are down, the readier he is to reload)
    Object.assign(j, {
      w: "handgun",
      ax: +ax.toFixed(3),
      ay: +ay.toFixed(3),
      fireAt: now + rnd(650, 1150),
    });
    return true;
  }
  /* where to stand: a few duck lengths from the nearest duck, looked at again every 1.5 to 2.5 seconds */
  if (now < j.next) return ch;
  j.next = now + rnd(1500, 2500);
  const p = s.pos[nearest[0]],
    want = rnd(5, 8),
    ang = Math.atan2((at.y - p.y) / RY, (at.x - p.x) / RX) + rnd(-0.9, 0.9);
  const x = Math.max(0.05, Math.min(0.95, p.x + Math.cos(ang) * want * RX)),
    y = Math.max(0.06, Math.min(0.94, p.y + Math.sin(ang) * want * RY));
  Object.assign(j, {
    k: null,
    x0: r3(at.x),
    y0: r3(at.y),
    x1: r3(x),
    y1: r3(y),
    t: now,
    v: SPEED,
  });
  return true;
}

/* ---------- the stats ---------- */
/* a fight's numbers for each player (from s.mgjPast: the last fight, or all of them) */
export function mgjStats(s, all = false) {
  const past = s.mgjPast || [],
    list = all ? past : past.slice(-1),
    per = {};
  const P = (id) =>
    (per[id] = per[id] || { dmg: 0, hits: 0, kills: 0, fights: 0, wins: 0 });
  for (const f of list) {
    for (const id of f.ids || []) {
      const p = P(id);
      p.fights++;
      if (f.won) p.wins++;
    }
    for (const [id, v] of Object.entries(f.dmg || {})) P(id).dmg += v;
    for (const [id, v] of Object.entries(f.hits || {})) P(id).hits += v;
    if (f.won && f.kill) P(f.kill).kills++;
  }
  return { per, fights: list };
}
