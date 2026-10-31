/* ---------- the rules of Mad God Justin ----------
   A boss fight: every duck has only the knife (always out, no specials) and together they must bring Justin's HP to 0
   before the timer runs out (1 minute 30 by default; the lobby has 1 and 2 minutes too, but only a win at the default
   counts toward the lightning eyes). His HP is 8 + 6 for each player
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
   - Every 15 seconds something fades in somewhere on the board (PICKS, with the owner's odds): a weapon a duck picks up
     by walking over it and uses once (then it's back to the knife); lightning or fire, or a meteor, that hit him as
     soon as they show; or Good Justin God, a helper with a halo and a knife, who stabs him too and can be knocked down
     like a duck. He has no lines of his own: he shouts Justin's god lines at him, and cheers with Justin's winning
     lines when he dies.
   He's the Justin option's board Justin (boardjustin.js: s.justin, justinAt, his look, lines and bullets); this file is
   his brain here. s.mgj = { hp, max, n (the fight's number), dmg {id: stabs}, hits {id: times he knocked them down},
   kill, won, strikes (what's left in the sky), strikeAt, metAt (ms left on the timer when the meteor comes), met (the
   meteor now: { at, fx, hit, back }), metDone, left (ms left while the timer is frozen), shotgun, over }. */
import {
  enter,
  lostRound,
  playing,
  seatLate,
  needed,
  say,
  boardPhases,
  SHOT_SPEED,
  DAGGER_SPEED,
  MAG,
  RELOAD,
  strike,
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
export const MGJ_TIMES = [60, 90, 120],
  MGJ_DEFAULT = 90; // (I want a minute and a half; only a win at this time counts toward the lightning eyes)
export const mgjTime = (s) =>
  MGJ_TIMES.includes(+s.options.mgjTime) ? +s.options.mgjTime : MGJ_DEFAULT;
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
/* the pickups: every PICK_EVERY ms one fades in, picked by these odds (the owner's, in percent): "sky" is lightning or
   fire (half and half) and hits him as it shows, as the meteor does (1 damage and 30 more seconds); "good" is Good
   Justin God. A weapon waits until a duck walks over it or the next one comes */
export const PICK_EVERY = 15000,
  PICK_FADE = 700,
  PICK_HIT = 1100, // ms after it shows: lightning or fire strikes him, the meteor starts to fall, Good Justin comes
  PICK_LAND = 1500, // the meteor's fall
  PICKS = [
    ["hammer", 29],
    ["dagger", 27.5],
    ["handgun", 25],
    ["shotgun", 10],
    ["sky", 5],
    ["meteor", 2.5],
    ["good", 1],
  ];
export const PICK_WEAPONS = ["hammer", "dagger", "handgun", "shotgun"];
/* how much each hit takes off him (we decided: a picked-up weapon hits harder than the knife; each pellet 1) */
export const DMG = {
  knife: 1,
  hammer: 2,
  dagger: 2,
  handgun: 2,
  pellet: 1,
  lightning: 2,
  fire: 2,
  meteor: 1,
};
export const GOOD_ID = "goodjustin",
  GOOD_NAME = "Good Justin God";
export const SKY_ID = "sky"; // (the pickups' lightning, fire and meteor, in the damage and the killing blow)
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
    pickAt: now + PICK_EVERY,
    pickN: 0,
    pick: null,
    held: {},
    gj: null,
  };
  s.pos = {};
  s.lock = {};
  s.shots = [];
  s.down = {};
  s.up = {};
  delete s.pos[GOOD_ID];
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
export function mgjStab(s, by, now, log, n = 1) {
  const m = s.mgj;
  if (!m || s.phase !== "boss" || m.hp <= 0 || mgjGone(s, now) || m.met)
    return false;
  n = Math.min(n, m.hp);
  m.hp -= n;
  m.dmg = { ...m.dmg, [by]: (m.dmg[by] || 0) + n };
  m.flash = now; // (his red flash)
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
    if (m.gj) m.gj.down = 0; // (Good Justin God gets up to cheer)
    m.rage1 = any(LOSE_LINES);
    line(m.rage1);
    s.mgjWinN = (s.mgjWinN || 0) + 1;
    s.mgjWins = [
      ...(s.mgjWins || []).slice(-9),
      { n: s.mgjWinN, ids: playing(s), def: mgjTime(s) === MGJ_DEFAULT },
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
    lostRound(s, playing(s), "mgj");
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
    if (m.won && m.gj && !m.gjYay && now - s.at >= MGJ_ZAP + 1400) {
      m.gjYay = true; // (Good Justin God cheers with Justin's own winning lines)
      log(s, { npc: GOOD_ID, name: GOOD_NAME, text: any(WIN_LINES) });
      return true;
    }
    if (m.won && !m.rage && now - s.at >= MGJ_ZAP + 2800) {
      m.rage = true; // (his rage goes on while he cries)
      line(any(LOSE_LINES.filter((x) => x !== m.rage1)) || any(LOSE_LINES));
      return true;
    }
    return false;
  }
  let ch = false;
  const at = justinAt(j, now);
  const standing = () => [
    ...playing(s).filter(
      (id) =>
        s.pos[id] && s.pos[id].x >= 0 && s.players[id] && !s.players[id].dead,
    ),
    ...(goodUp(s, now) ? [GOOD_ID] : []),
  ];
  const far = (p, q = at) => Math.hypot((p.x - q.x) / RX, (p.y - q.y) / RY); // in duck lengths
  const knock = (id) => {
    if (id === GOOD_ID) return goodDown(s, now);
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
      if (m.gj) m.gj.down = now + MGJ_DOWN;
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
      m.pickAt = Math.max(m.pickAt || 0, now + 3000);
      ch = true;
    }
    return ch;
  }
  if (pickTick(s, now, at, log, fx)) ch = true;
  if (goodTick(s, now, at, log, fx)) ch = true;

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
    const hit = strike(s, JUSTIN_ID, "hammer", aim, now, at);
    for (const h of hit) mgjHurt(s, h);
    const g = s.pos[GOOD_ID];
    if (goodUp(s, now) && far(g) < 2.4) {
      goodDown(s, now);
      hit.push(GOOD_ID);
    }
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
      (j.swing.id === GOOD_ID
        ? !goodUp(s, now)
        : (s.players[j.swing.id] || {}).dead) ||
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

/* ---------- the pickups ---------- */
const pickKind = (s) => {
  const list = PICKS.filter(([k]) => k !== "good" || !s.mgj.gj),
    sum = list.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * sum;
  for (const [k, w] of list) if ((r -= w) < 0) return k;
  return list[0][0];
};
function pickTick(s, now, at, log, fx) {
  const m = s.mgj;
  let ch = false;
  const P = m.pick;
  if (P && !PICK_WEAPONS.includes(P.k)) {
    // lightning, fire, the meteor and Good Justin happen by themselves, a moment after they show
    const t = now - P.t;
    if ((P.k === "lightning" || P.k === "fire") && t >= PICK_HIT && !P.hit) {
      P.hit = true;
      fx({ kind: P.k, who: [JUSTIN_ID] });
      mgjStab(s, SKY_ID, now, log, DMG[P.k]);
      ch = true;
    }
    if (P.k === "meteor" && t >= PICK_HIT && !P.fx) {
      P.fx = true;
      P.mx = r3(at.x);
      P.my = r3(at.y);
      fx({
        kind: "meteor",
        land: P.t + PICK_HIT + PICK_LAND,
        x: P.mx,
        y: P.my,
        small: true,
      });
      ch = true;
    }
    if (P.k === "meteor" && t >= PICK_HIT + PICK_LAND && !P.hit) {
      P.hit = true;
      mgjStab(s, SKY_ID, now, log, DMG.meteor);
      if (s.ends) s.ends += 30000;
      say(s, "A meteor hit Justin: 30 more seconds!");
      ch = true;
    }
    if (P.k === "good" && t >= PICK_HIT && !m.gj) {
      goodComes(s, now, P, log);
      ch = true;
    }
    if (t >= PICK_HIT + (P.k === "meteor" ? PICK_LAND + 300 : 500)) {
      m.pick = null;
      ch = true;
    }
  }
  /* a duck walks over a weapon: it's theirs for one use */
  if (
    m.pick &&
    PICK_WEAPONS.includes(m.pick.k) &&
    now - m.pick.t >= PICK_FADE * 0.5
  )
    for (const id of playing(s)) {
      const p = s.pos[id],
        Pl = s.players[id];
      if (!p || p.x < 0 || !Pl || Pl.dead) continue;
      if (Math.hypot((p.x - m.pick.x) / RX, (p.y - m.pick.y) / RY) > 1.1)
        continue;
      m.held = { ...m.held, [id]: m.pick.k };
      fx({ kind: "pickup", what: m.pick.k, who: [id], by: id });
      m.pick = null;
      ch = true;
      break;
    }
  /* the next one fades in (a weapon nobody took goes away) */
  if (now >= m.pickAt) {
    m.pickAt = now + PICK_EVERY;
    let k = pickKind(s);
    if (k === "sky") k = Math.random() < 0.5 ? "lightning" : "fire";
    let x = 0.5,
      y = 0.5;
    for (let i = 0; i < 12; i++) {
      x = rnd(0.1, 0.9);
      y = rnd(0.14, 0.86);
      if (Math.hypot((x - at.x) / RX, (y - at.y) / RY) > 4) break;
    } // (not right on top of him)
    m.pickN = (m.pickN || 0) + 1;
    m.pick = { n: m.pickN, k, x: r3(x), y: r3(y), t: now };
    ch = true;
  }
  return ch;
}
/* a picked-up weapon, used: the hammer swings, the dagger and the handgun fire one, the shotgun a cone of pellets;
   then it's back to the knife. a = the use action (its aim) */
export function mgjUse(s, a, now, log) {
  const m = s.mgj,
    k = m && (m.held || {})[a.id],
    p = s.pos[a.id];
  if (!k || k !== a.what || !p) return false;
  const ax0 = Math.max(-3, Math.min(3, +a.ax || 0)),
    ay0 = Math.max(-3, Math.min(3, +a.ay || 0)),
    face = a.face < 0 ? -1 : 1,
    aim = Math.hypot(ax0, ay0) > 0.05 ? [ax0, ay0] : [face, 0];
  const held = { ...m.held };
  delete held[a.id];
  m.held = held;
  s.fxN = (s.fxN || 0) + 1;
  const n0 = s.fxN,
    use = {
      n: n0,
      kind: "use",
      what: k,
      by: a.id,
      who: [a.id],
      face,
      t: now,
      ax: +aim[0].toFixed(3),
      ay: +aim[1].toFixed(3),
    };
  if (k === "hammer") {
    const hit = strike(s, a.id, "hammer", aim, now); // (it hits what it touches while it swings, like the hammer special)
    s.fx = [
      ...(s.fx || []).slice(-19),
      { ...use, ...(hit.length ? { hit } : {}) },
    ];
    return true;
  }
  s.fx = [...(s.fx || []).slice(-19), use];
  if (k === "shotgun") {
    const ux = aim[0] / RX,
      uy = aim[1] / RY,
      a0 = Math.atan2(uy, ux);
    pellets(s, a.id, p, a0, n0, now);
    return true;
  }
  const l = Math.hypot(aim[0], aim[1]) || 1,
    v = k === "dagger" ? DAGGER_SPEED : SHOT_SPEED;
  s.shots = [
    ...(s.shots || []),
    {
      n: n0,
      by: a.id,
      k,
      x0: p.x,
      y0: p.y,
      vx: +((aim[0] / l) * v).toFixed(4),
      vy: +((aim[1] / l) * v).toFixed(4),
      t: now,
      lx: p.x,
      ly: p.y,
    },
  ];
  return true;
}
/* a cone of pellets from (at), toward the angle a0 (in a duck's room) */
function pellets(s, by, at, a0, n0, now) {
  for (let i = 0; i < PELLETS; i++) {
    const a = a0 + SPREAD * ((i / (PELLETS - 1)) * 2 - 1) + rnd(-0.04, 0.04),
      bx = Math.cos(a) * RX,
      by2 = Math.sin(a) * RY,
      bl = Math.hypot(bx, by2);
    s.shots = [
      ...(s.shots || []),
      {
        n: n0 * 10 + i,
        by,
        k: "pellet",
        x0: at.x,
        y0: at.y,
        vx: +((bx / bl) * PELLET_SPEED).toFixed(4),
        vy: +((by2 / bl) * PELLET_SPEED).toFixed(4),
        t: now,
        lx: at.x,
        ly: at.y,
        life: PELLET_LIFE,
      },
    ];
  }
}
/* a shot this beat, from (x0, y0) to (x0 + dx, y0 + dy): a duck's shot that reaches Justin hits him (and is gone: true);
   his shots knock Good Justin down. Ducks never hit each other here */
export function mgjShot(s, sh, x0, y0, dx, dy, now, log) {
  const m = s.mgj;
  if (!m || s.phase !== "boss") return false;
  const near = (q) => {
    const ux = dx / RX,
      uy = dy / RY,
      px = (q.x - x0) / RX,
      py = (q.y - y0) / RY,
      len = ux * ux + uy * uy;
    const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    return Math.hypot(px - k * ux, py - k * uy) < 1;
  };
  if (sh.by === JUSTIN_ID) {
    if (goodUp(s, now) && near(s.pos[GOOD_ID])) goodDown(s, now);
    return false;
  }
  if (mgjGone(s, now) || m.met) return false;
  const n = justinAt(s.justin, now);
  if (!n || !near(n)) return false;
  mgjStab(s, sh.by, now, log, DMG[sh.k] || 1);
  return true;
}

/* ---------- Good Justin God ---------- */
export const goodUp = (s, now) => {
  const g = s.mgj && s.mgj.gj;
  return !!g && !g.down && now >= g.in && !!s.pos[GOOD_ID];
};
function goodDown(s, now) {
  const g = s.mgj && s.mgj.gj;
  if (!g || g.down) return;
  g.down = now + MGJ_DOWN;
  g.hits = (g.hits || 0) + 1;
}
function goodComes(s, now, P, log) {
  s.mgj.gj = {
    in: now,
    down: 0,
    stabAt: now + 900,
    sayAt: now + rnd(6000, 10000),
    list: shuffle(GOD_LINES.map((_, i) => i)),
  };
  s.pos[GOOD_ID] = { x: P.x, y: P.y, face: P.x < 0.5 ? 1 : -1 };
  log(s, {
    npc: GOOD_ID,
    name: GOOD_NAME,
    text: GOD_LINES[s.mgj.gj.list.shift()],
  });
  say(s, `${GOOD_NAME} came to help!`);
}
/* his brain: up again after his 5 seconds; walks at Justin and stabs him once a second when close; his lines now and then */
function goodTick(s, now, at, log, fx) {
  const g = s.mgj.gj,
    p = s.pos[GOOD_ID];
  if (!g || !p) return false;
  let ch = false;
  if (g.down && now >= g.down) {
    g.down = 0;
    ch = true;
  }
  if (now >= g.sayAt) {
    if (!(g.list || []).length) g.list = shuffle(GOD_LINES.map((_, i) => i));
    log(s, { npc: GOOD_ID, name: GOOD_NAME, text: GOD_LINES[g.list.shift()] });
    g.sayAt = now + rnd(12000, 22000);
    ch = true;
  }
  if (g.down || mgjGone(s, now)) return ch;
  const dx = (at.x - p.x) / RX,
    dy = (at.y - p.y) / RY,
    d = Math.hypot(dx, dy);
  if (d > 1.3) {
    const step = Math.min(d - 1.2, 0.9); // (duck lengths a beat: a brisk walk)
    s.pos[GOOD_ID] = {
      ...p,
      x: r3(Math.max(0, Math.min(1, p.x + (dx / d) * step * RX))),
      y: r3(Math.max(0, Math.min(1, p.y + (dy / d) * step * RY))),
      face: dx < 0 ? -1 : 1,
    };
    ch = true;
  }
  if (d <= 2 && now >= g.stabAt) {
    g.stabAt = now + 1000;
    const aim = d > 1e-3 ? [dx / d, dy / d] : [1, 0];
    fx({
      kind: "use",
      what: "knife",
      by: GOOD_ID,
      who: [GOOD_ID],
      face: aim[0] < 0 ? -1 : 1,
      ax: +aim[0].toFixed(3),
      ay: +aim[1].toFixed(3),
      ...(mgjStab(s, GOOD_ID, now, log, DMG.knife) ? { hit: [JUSTIN_ID] } : {}),
    });
    ch = true;
  }
  return ch;
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
