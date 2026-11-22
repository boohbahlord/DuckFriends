/* ---------- Mad God Justin's brain, on the host's heartbeat: what he does each tick ----------
   Moved out of mgjrules.js to keep that file small (a pure move). It imports back from mgjrules.js, which imports it. */
import {
  BURST,
  CHAIR_TELL,
  DASH_FAR,
  DASH_R,
  DASH_TELL,
  DASH_V,
  EAT_MS,
  FAST_SOON,
  FOODS,
  GOOD_ID,
  GOOD_NAME,
  GUN_TELL,
  HAMMER_TELL,
  JUSTIN_SHOT,
  MET,
  MET_AT,
  MET_HEAL,
  MGJ_DOWN,
  MGJ_SCALE,
  MGJ_ZAP,
  PACE,
  PELLETS,
  PELLET_LIFE,
  PELLET_SPEED,
  PUMP,
  RX,
  RY,
  SG_ODDS,
  SPEED,
  SPREAD,
  THROW_TELL,
  WALL,
  WAVE,
  XB,
  XB_AT,
  any,
  atWall,
  ateHp,
  burnTick,
  cakeTick,
  deskSpot,
  dupTick,
  edgeTick,
  goodDown,
  goodTick,
  goodUp,
  later,
  mgjBodies,
  mgjHurt,
  mirror,
  reviveTick,
  rnd,
  teleport,
  throwIt,
  twin,
  waveOn,
  wavesTick,
} from "./mgjrules.js";

import { pickTick } from "./mgjpicks.js";

import { jumpDodges } from "./jump.js";

import { coneOf } from "./weaponuse.js";

import { playing, say, boardPhases } from "./rules.js";

import { strike, shove } from "./boardfire.js";

import { KB_FAR } from "./push.js";

import { justinAt, JUSTIN_ID } from "./boardjustin.js";

import { walkTo, stopAt, hammerFx, fxOf, nearSpot } from "./justinmoves.js";

import { holdDown, invuln, hurtFx } from "./hangout/death.js";

import { E_LINES, GOD_LINES, WIN_LINES } from "./hangout/justin.js";

import { shuffle } from "./random.js";

/* ---------- his brain, on the host's heartbeat: true when anything changed ---------- */
export function mgjTick(s, now, log) {
  const m = s.mgj;
  if (!m || !s.justin || !boardPhases(s).includes(s.phase)) return false;
  const n0 = (s.shots || []).length,
    up = s.phase === "boss" && reviveTick(s, now, log),
    zw = s.phase === "boss" && wavesTick(s, now),
    ch = brain(s, now, log);
  return twin(s, now, n0) || ch || up || zw;
}
function brain(s, now, log) {
  const m = s.mgj,
    j = s.justin;
  const fx = fxOf(s, now, JUSTIN_ID);
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
    return false; // (dead, he has no more lines: mgjEnd)
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
  const soon = (ms) =>
    ms * PACE * FAST_SOON ** (+j.fast || 0) * (waveOn(s) ? WAVE.CALM : 1); // (every attack sooner than it used to; after his Xbox and his meteor, sooner still; while his zombies are out, later)
  const stop = () => stopAt(j, at, now);
  const godLine = () => {
    if (!(j.gods || []).length) j.gods = shuffle(GOD_LINES.map((_, i) => i));
    line(GOD_LINES[j.gods.shift()]);
  };

  /* the meteor */
  if (!m.met && !m.metDone && !(m.xb && !m.xb.done) && m.hp <= m.max * MET_AT) {
    m.met = { at: now };
    delete j.swing;
    delete j.tell;
    delete j.dash;
    delete j.eat;
    delete j.sg;
    m.cake = null;
    m.dup = null;
    stop();
    godLine();
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
          if (invuln(s)) hurtFx(s, id, now);
          else {
            P.dead = true;
            holdDown(s, id, now);
          }
        }
      }
      if (m.gj) m.gj.down = now + MGJ_DOWN;
      m.hp = Math.min(m.max, m.hp + MET_HEAL); // (the owner: his meteor gives him 20 HP back, up to his full HP)
      j.fast = (+j.fast || 0) + 1; // (and makes his attacks faster again)
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
      m.met = null;
      m.metDone = true;
      m.pickAt = Math.max(m.pickAt || 0, now + 3000);
      later(s, now, 3000);
      ch = true;
    }
    return ch;
  }
  if (pickTick(s, now, at, log, fx)) ch = true;
  if (goodTick(s, now, mgjBodies(s, now).find((b) => b.real) || at, log, fx))
    ch = true; // (he goes after the real one, when the double is out)

  /* the Xbox: the desk comes in, he runs over, turns it off, fades away, comes back faster */
  if (!m.xb && !m.xbUsed && !m.met && m.hp <= m.max * XB_AT) {
    const spot = deskSpot(s, at);
    const side = at.x < spot.x ? -1 : 1,
      to = {
        x: Math.max(0.03, Math.min(0.97, spot.x + side * 0.075)),
        y: spot.y,
      },
      v = SPEED * 1.9;
    delete j.swing;
    delete j.tell;
    delete j.dash;
    delete j.eat;
    delete j.sg;
    m.cake = null;
    m.dup = null;
    walkTo(j, at, to, now, v);
    m.xbUsed = true;
    m.xb = {
      at: now,
      x: spot.x,
      y: spot.y,
      arrive:
        now +
        Math.max(XB.IN, (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000),
      off: 0,
      done: 0,
    };
    return true;
  }
  if (m.xb && !m.xb.done) {
    const x = m.xb;
    if (now < x.arrive) return ch;
    if (!x.off) {
      x.off = now;
      stop();
      line(E_LINES.find((l) => /TURNING OFF MY XBOX/.test(l))); // (his own line)
      say(s, "NightRobin1123 has left the party"); // (the owner's: in the chat, as Xbox says it)
      fx({ kind: "xboff" });
      return true;
    }
    if (now - x.off < XB.GONE) return ch;
    x.done = now;
    j.fast = (+j.fast || 0) + 1;
    m.hp = Math.min(m.max, m.hp + 1 + playing(s).length);
    j.fireAt = now + 1200;
    j.hamAt = now + 2000;
    j.ctlAt = Math.max(j.ctlAt, now + 3000);
    j.chairAt = Math.max(j.chairAt, now + 6000);
    m.pickAt = Math.max(m.pickAt || 0, now + 2000);
    later(s, now, 2500);
    return true;
  }

  /* his everyday lines now and then */
  if (now >= j.say) {
    if (!(j.list || []).length) j.list = shuffle(E_LINES.map((_, i) => i));
    line(E_LINES[j.list.shift()]);
    j.say = now + rnd(15000, 30000);
    ch = true;
  }
  /* the rework's: burning ducks, the edge lightning, his double; then the zebra cake, his snack, his
     teleport (each of those last three keeps him from attacking while it lasts) */
  if (burnTick(s, now)) ch = true;
  if (edgeTick(s, now, fx)) ch = true;
  if (dupTick(s, now)) ch = true;
  if (m.cake) return cakeTick(s, now, at, fx) || ch;
  if (j.eat) {
    if (now < j.eat.until) return ch;
    delete j.eat;
    ateHp(m);
    j.next = now;
    return true;
  }
  if (now >= j.eatAt && !j.swing && !j.tell) {
    j.eatAt = now + (waveOn(s) ? rnd(...WAVE.EAT) : rnd(30000, 45000)); // (while his zombies are out he'd rather eat)
    stop();
    j.eat = { k: any(FOODS), at: now, until: now + EAT_MS };
    return true;
  } // (now and then he stops for a snack: a look only)
  if (now >= j.tpAt && !j.swing && !j.tell && atWall(at)) {
    teleport(s, now, at, fx);
    return true;
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
  /* the shotgun's cone of pellets at q (a duck's spot) */
  const shotgunAt = (q) => {
    const ux = (q.x - at.x) / RX,
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
    for (const [i, a] of coneOf(a0, PELLETS, SPREAD).entries()) {
      const bx = Math.cos(a) * RX,
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
      fireAt: now + soon(rnd(700, 1000)),
    });
  };
  const swingNow = (id) => {
    const p = s.pos[id],
      dx = p.x - at.x,
      dy = p.y - at.y,
      aim = Math.hypot(dx, dy) > 1e-4 ? [dx, dy] : [1, 0];
    /* with his double out, the swing that hurts is the real one's: his own here, or the double's, mirrored */
    const from = m.dup && m.dup.fake === 0 ? mirror(at) : at,
      aim2 = from === at ? aim : [-aim[0], -aim[1]];
    const hit = strike(s, JUSTIN_ID, "hammer", aim2, now, from);
    for (const h of hit) mgjHurt(s, h);
    const g = s.pos[GOOD_ID];
    if (goodUp(s, now) && far(g, from) < 2.4) {
      goodDown(s, now);
      hit.push(GOOD_ID);
    }
    hammerFx(fx, aim, hit);
    j.hamAt = now + soon(rnd(2500, 3500));
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
  /* his charge: the tell, then the sprint; ducks on his way fly off (no damage) */
  if (j.dash) {
    const D = j.dash;
    if (now < D.at) return ch;
    if (!D.go) {
      const p = s.pos[D.id] && s.pos[D.id].x >= 0 ? s.pos[D.id] : null;
      if (!p) {
        delete j.dash;
        return true;
      }
      /* with his double out and the double the real one, the double charges the duck (he runs the mirror of it) */
      const flip = m.dup && m.dup.fake === 0,
        b0 = flip ? mirror(at) : at,
        ux = (p.x - b0.x) / RX,
        uy = (p.y - b0.y) / RY,
        d = Math.hypot(ux, uy) || 1,
        over = 1.5; // (on past the spot, a duck length and a half)
      const end = {
          x: Math.max(
            WALL.x + 0.01,
            Math.min(0.99 - WALL.x, p.x + (ux / d) * over * RX),
          ),
          y: Math.max(
            WALL.y + 0.01,
            Math.min(0.99 - WALL.y, p.y + (uy / d) * over * RY),
          ),
        },
        to = flip ? mirror(end) : end,
        v = DASH_V;
      walkTo(j, at, to, now, v);
      Object.assign(D, {
        go: 1,
        flip,
        lx: b0.x,
        ly: b0.y,
        until: now + (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000,
        hit: [],
      });
      return true;
    }
    /* who his body passed this beat, from where he was to where he is (the real one's, with his double out) */
    const flip = !!(m.dup && m.dup.fake === 0),
      b = flip ? mirror(at) : at;
    if (flip !== !!D.flip) {
      Object.assign(D, { flip, lx: b.x, ly: b.y }); // (his double just went: the real one is him again from here)
      return ch;
    }
    const sx = (b.x - D.lx) / RX,
      sy = (b.y - D.ly) / RY,
      len = sx * sx + sy * sy;
    for (const id of them) {
      if (id === GOOD_ID || D.hit.includes(id)) continue;
      const p = s.pos[id],
        px = (p.x - D.lx) / RX,
        py = (p.y - D.ly) / RY,
        k = len ? Math.max(0, Math.min(1, (px * sx + py * sy) / len)) : 0,
        ox = px - k * sx,
        oy = py - k * sy,
        od = Math.hypot(ox, oy);
      if (od > DASH_R * MGJ_SCALE || jumpDodges(p, now)) continue;
      D.hit.push(id);
      const sl = Math.sqrt(len) || 1,
        fx0 = sx / sl,
        fy0 = sy / sl,
        side = od > 0.2 ? [ox / od, oy / od] : [-fy0, fx0],
        ux = fx0 * 0.6 + side[0],
        uy = fy0 * 0.6 + side[1],
        ul = Math.hypot(ux, uy) || 1;
      shove(s, id, ux / ul, uy / ul, DASH_FAR * KB_FAR, now, 0); // (sent flying ahead of him and off to the side; no HP lost)
      fx({ kind: "mgjbonk", who: [id] });
      ch = true;
    }
    D.lx = b.x;
    D.ly = b.y;
    if (now >= D.until) {
      delete j.dash;
      stop();
      j.next = now + 500;
      return true;
    }
    return ch;
  }
  /* his throws: held up for a moment (the tell), then the controllers fly every way, or the chair at its duck */
  if (j.tell) {
    if (now < j.tell.at) return ch;
    const k = j.tell.k,
      q = s.pos[j.tell.id];
    delete j.tell;
    throwIt(s, k, at, q && q.x >= 0 ? q : s.pos[nearest[0]], now, fx);
    j.fireAt = Math.max(j.fireAt, now + 900);
    j.next = now + 600;
    return true;
  }
  /* the shotgun aimed (the tell): the pellets go at the duck where it stands now */
  if (j.sg) {
    if (now < j.sg.at) return ch;
    const q = s.pos[j.sg.id];
    delete j.sg;
    if (q && q.x >= 0) shotgunAt(q);
    else j.fireAt = now + 300;
    return true;
  }
  /* a burst going on: the next bullet at its duck, until the burst is done; then the reload */
  if (j.burst) {
    const B = j.burst,
      G = BURST[B.w],
      p = s.pos[B.id];
    const gone =
      !p ||
      p.x < 0 ||
      (B.id === GOOD_ID ? !goodUp(s, now) : (s.players[B.id] || {}).dead);
    if (!gone && now < B.at) return ch;
    if (gone || B.left <= 0) {
      delete j.burst;
      j.mag = { n: 0, r: now + G.reload };
      j.fireAt = now + G.reload + soon(rnd(300, 700));
      return true;
    }
    const [bx, by] = aimAt(p),
      a = Math.atan2(by, bx) + rnd(-G.spread, G.spread),
      ax = Math.cos(a),
      ay = Math.sin(a);
    fx({
      kind: "use",
      what: B.w,
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
        k: B.w,
        x0: at.x,
        y0: at.y,
        vx: +(ax * JUSTIN_SHOT).toFixed(4),
        vy: +(ay * JUSTIN_SHOT).toFixed(4),
        t: now,
        lx: at.x,
        ly: at.y,
      },
    ];
    B.left -= 1;
    B.at = now + G.gap;
    Object.assign(j, { w: B.w, ax: +ax.toFixed(3), ay: +ay.toFixed(3) });
    return true;
  }
  if (now >= j.chairAt || now >= j.ctlAt) {
    const k = now >= j.chairAt ? "chair" : "controller";
    stop();
    j.tell = {
      k,
      id: any(them),
      at: now + (k === "chair" ? CHAIR_TELL : THROW_TELL),
    };
    if (k === "chair") {
      j.chairAt = now + soon(rnd(15000, 22000));
      j.ctlAt = Math.max(j.ctlAt, now + 4500);
    } else j.ctlAt = now + soon(rnd(8000, 12000));
    fx({ kind: "mgjtell", what: k, until: j.tell.at });
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
    j.swing = { id: nearest[0], at: now + HAMMER_TELL };
    j.hamAt = now + soon(3000);
    return true;
  }
  /* now and then he charges a duck a few lengths off: a short red shake first (the tell), so it can step or jump aside */
  if (now >= j.dashAt && nearest[1] > 3 && nearest[1] < 10) {
    stop();
    j.dash = { at: now + DASH_TELL, id: nearest[0] };
    j.dashAt = now + soon(rnd(8000, 12000));
    fx({ kind: "mgjcharge", until: j.dash.at });
    return true;
  }
  /* reloading: he sprints at a duck to hammer it */
  if (reloading && now >= j.hamAt) {
    const id = nearest[0],
      p = s.pos[id],
      to = nearSpot(at, p, RX, RY),
      v = SPEED * 1.9;
    walkTo(j, at, to, now, v);
    j.swing = {
      id,
      at: now + (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000 + 250,
    };
    j.hamAt = now + soon(4000);
    return true;
  }
  /* the guns */
  if (now >= j.fireAt && !reloading) {
    const id = any(them),
      p = s.pos[id],
      [ax, ay] = aimAt(p);
    const close = them.filter((t) => far(s.pos[t]) < 9);
    if (m.shotgun && now >= j.sgR && close.length && Math.random() < SG_ODDS) {
      // the shotgun at a duck close enough: aimed first (the tell), then a cone of pellets (shotgunAt)
      const id = any(close);
      j.sg = { id, at: now + GUN_TELL };
      j.sgR = now + GUN_TELL + PUMP;
      j.fireAt = now + GUN_TELL + soon(rnd(700, 1000));
      const [sx, sy] = aimAt(s.pos[id]);
      Object.assign(j, {
        w: "shotgun",
        ax: +sx.toFixed(3),
        ay: +sy.toFixed(3),
      });
      return true;
    }
    /* the LMG or the SMG: a burst at the duck (the bullets go out one by one, above) */
    const w = Math.random() < 0.5 ? "lmg" : "smg";
    j.burst = { w, id, left: BURST[w].n, at: now + GUN_TELL }; // (aimed first: the tell)
    Object.assign(j, { w, ax: +ax.toFixed(3), ay: +ay.toFixed(3) });
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
  walkTo(j, at, { x, y }, now, SPEED);
  return true;
}
