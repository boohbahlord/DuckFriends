/* ---------- Mad God Justin's pickups: what drops, what comes next, and what each one does ----------
   Moved out of mgjrules.js to keep that file small (a pure move). It imports back from mgjrules.js, which imports it. */
import { drawDmg, drawFast } from "./bowdraw.js";
import { r3, fxOf } from "./justinmoves.js";

import {
  DMG,
  GOOD_ID,
  MGJ_SCALE,
  PELLETS,
  PICKS,
  PICK_EVERY,
  PICK_FADE,
  PICK_HIT,
  PICK_LAND,
  PICK_USES,
  PICK_WEAPONS,
  PLUS_CHANCE,
  PLUS_EVERY,
  PLUS_LIFE,
  RX,
  RY,
  SKY_ID,
  SPREAD,
  armOf,
  dropHeld,
  goodComes,
  goodDown,
  goodUp,
  mgjBodies,
  mgjHitAt,
  mgjPHp,
  mgjStab,
  mgjZombieHit,
  pickAmmo,
  rnd,
} from "./mgjrules.js";

import { hpHeal, hundredths } from "./hpmath.js";

import { coneOf } from "./weaponuse.js";

import {
  playing,
  say,
  SHOT_SPEED,
  ARROW_SPEED,
  PELLET_V,
  DUCK_PELLET_LIFE,
  DAGGER_SPEED,
} from "./rules.js";

import { strike } from "./boardfire.js";

import { justinAt, JUSTIN_ID } from "./boardjustin.js";

import { SLOT_ODDS, pierceOf } from "./l4ddrules.js";

import { ARMS, MGJ_GUNS } from "./guns.js";

import { sbOnBoard, boardDuck } from "./sandboxrules.js";

import { shuffle, roll } from "./random.js";

/* ---------- the pickups ---------- */
/* what comes next: the sky, the meteor and Good Justin as they did (SKY, their own odds); else a medkit (the Item bag's
   chance, as the fireplace's); else a gun from the bags (the chain gun that came 5% first is gone: the owner's, Nov 22
   19:26Z, "REMOVE CHAIN GUN"): the next of three bags that take turns, heavy (the grenade launcher, the M249), rifles (the Tommy gun, the UMP-45, the MP5, the AK-47, the
   AUG) and shotguns (the shotgun, the double barrel), each giving the next one of its own. Every bag shuffles: each of
   its things once before any comes again (s.hidden.mgjb, the host's only) */
const MGJ_BAGS = {
  heavy: ["glauncher", "lmg"],
  rifle: ["tommy", "ump", "smg", "ak", "burst"],
  shotgun: ["shotgun", "dbarrel"],
};
/* the next one of a bag (left: its things left, in their shuffled order; all of them when it's empty) */
const nextOf = (left, all) => {
  const rest = left && left.length ? left : shuffle([...all]); // (random.js)
  return [rest[0], rest.slice(1)];
};
function bagGun(s) {
  const b = (s.hidden && s.hidden.mgjb) || { b: {} },
    [k, turns] = nextOf(b.w, Object.keys(MGJ_BAGS)),
    [w, rest] = nextOf(b.b[k], MGJ_BAGS[k]);
  s.hidden = {
    ...(s.hidden || {}),
    mgjb: { w: turns, b: { ...b.b, [k]: rest } },
  };
  return w;
}
const pickKind = (s) => {
  const list = PICKS.filter(([k]) => k !== "good" || !s.mgj.gj),
    r = Math.random() * 100;
  let at = 0;
  for (const [k, w] of list) if (r < (at += w)) return k;
  if (Math.random() < SLOT_ODDS.item) return "medkit";
  return bagGun(s);
};
/* a spot on the board for the next plus or weapon, not right on top of Justin (at): twelve tries, the last one if none
   is far enough */
const spotAway = (at) => {
  let x = 0.5,
    y = 0.5;
  for (let i = 0; i < 12; i++) {
    x = rnd(0.1, 0.9);
    y = rnd(0.14, 0.86);
    if (Math.hypot((x - at.x) / RX, (y - at.y) / RY) > 4) break;
  }
  return { x, y };
};
export function pickTick(s, now, at, log, fx) {
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
      say(s, "A meteor hit Justin!");
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
  /* a duck walks over a weapon: a gun is theirs with its shots (pickAmmo), the medkit for one use */
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
      const k = m.pick.k;
      dropHeld(m, id);
      m.held = { ...m.held, [id]: k };
      if (MGJ_GUNS.includes(k)) {
        m.ammo = { ...m.ammo, [id]: pickAmmo(k) };
        const mag = { ...(s.mag || {}) };
        delete mag[`${id} ${k}`];
        s.mag = mag; // (a full magazine)
      } else m.uses = { ...m.uses, [id]: PICK_USES[k] || 1 };
      fx({ kind: "pickup", what: m.pick.k, who: [id], by: id });
      m.pick = null;
      ch = true;
      break;
    }
  /* the owner's, Nov 17: it felt constant because an untaken plus stayed until the next one; now it goes after PLUS_LIFE */
  if (m.plus && now - m.plus.t >= PLUS_LIFE) {
    m.plus = null;
    ch = true;
  }
  /* the plus sign: +1 HP to the first duck that walks over it (a duck at full HP leaves it be) */
  if (m.plus && now - m.plus.t >= PICK_FADE * 0.5)
    for (const id of playing(s)) {
      const p = s.pos[id],
        Pl = s.players[id];
      if (!p || p.x < 0 || !Pl || Pl.dead || !((m.lost || {})[id] > 0))
        continue;
      if (Math.hypot((p.x - m.plus.x) / RX, (p.y - m.plus.y) / RY) > 1.1)
        continue;
      const lost = { ...m.lost },
        most = mgjPHp(s),
        left = hundredths(most - hpHeal(most - lost[id], 1, most)); // (one HP, just that: hpmath.js)
      if (left > 0) lost[id] = left;
      else delete lost[id];
      m.lost = lost;
      fx({ kind: "pickup", what: "plus", who: [id], by: id });
      m.plus = null;
      ch = true;
      break;
    }
  const plusNow = now >= m.plusAt;
  if (plusNow) m.plusAt = now + PLUS_EVERY;
  if (plusNow && Math.random() < PLUS_CHANCE) {
    const { x, y } = spotAway(at);
    m.plusN = (m.plusN || 0) + 1;
    m.plus = { n: m.plusN, k: "plus", x: r3(x), y: r3(y), t: now };
    ch = true;
  }
  /* the next one fades in (a weapon nobody took goes away) */
  if (now >= m.pickAt) {
    m.pickAt = now + PICK_EVERY;
    let k = pickKind(s);
    if (k === "sky") k = Math.random() < 0.5 ? "lightning" : "fire";
    const { x, y } = spotAway(at); // (not right on top of him)
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
  if (k === "medkit") {
    // my HP back to full (nothing to heal: it's kept)
    if (!((m.lost || {})[a.id] > 0)) return false;
    const lost = { ...m.lost };
    delete lost[a.id];
    m.lost = lost;
    dropHeld(m, a.id);
    fxOf(
      s,
      now,
      JUSTIN_ID,
    )({ kind: "use", what: "medkit", by: a.id, who: [a.id] });
    return true;
  }
  const ax0 = Math.max(-3, Math.min(3, +a.ax || 0)),
    ay0 = Math.max(-3, Math.min(3, +a.ay || 0)),
    face = a.face < 0 ? -1 : 1,
    aim = Math.hypot(ax0, ay0) > 0.05 ? [ax0, ay0] : [face, 0];
  const left = ((m.uses || {})[a.id] || 1) - 1;
  if (left > 0) m.uses = { ...m.uses, [a.id]: left };
  else {
    const held = { ...m.held },
      uses = { ...m.uses };
    delete held[a.id];
    delete uses[a.id];
    m.held = held;
    m.uses = uses;
  } // (the handgun and the dagger have three uses; the rest one)
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
    v =
      k === "dagger"
        ? DAGGER_SPEED
        : k === "bow"
          ? ARROW_SPEED * drawFast(a.dr) // (drawn: faster, bowdraw.js)
          : SHOT_SPEED;
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
      ...(a.dr != null ? { dr: a.dr } : {}), // (an arrow: its draw)
    },
  ];
  return true;
}
/* a cone of pellets from (at), toward the angle a0 (in a duck's room) */
function pellets(s, by, at, a0, n0, now) {
  for (const [i, a] of coneOf(a0, PELLETS, SPREAD).entries()) {
    const bx = Math.cos(a) * RX,
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
        vx: +((bx / bl) * PELLET_V).toFixed(4),
        vy: +((by2 / bl) * PELLET_V).toFixed(4),
        t: now,
        lx: at.x,
        ly: at.y,
        life: DUCK_PELLET_LIFE,
      },
    ];
  }
}
/* a shot this beat, from (x0, y0) to (x0 + dx, y0 + dy): a duck's shot that reaches Justin hits him (and is gone: true;
   on his double it counts for nothing); his shots hit Good Justin. Ducks never hit each other here */
export function mgjShot(s, sh, x0, y0, dx, dy, now, log, z = 0.41) {
  const m = s.mgj,
    sb = sbOnBoard(s); // (Sandbox's board: only its spawns' zombies, in s.mz as his are: sbspawn.js)
  if (!sb && (!m || s.phase !== "boss")) return false;
  const [rx, ry] = sb ? boardDuck(s) : [RX, RY]; // (Sandbox's bigger board: a duck is less of it)
  const near = (q, r = 1, body = null) => {
    if (body) return body.line(x0, y0, x0 + dx, y0 + dy, z) >= 0; // (Sandbox's NPCs: where the shot, at its height z, meets what shows of it, sbbody.js)
    const ux = dx / rx,
      uy = dy / ry,
      px = (q.x - x0) / rx,
      py = (q.y - y0) / ry,
      len = ux * ux + uy * uy;
    const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    return Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1) * r;
  };
  const nearHim = (q) => {
    const ux = dx / RX,
      uy = dy / RY,
      px = (q.x - x0) / RX,
      py = (q.y - y0) / RY,
      len = ux * ux + uy * uy;
    const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    return Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1) * MGJ_SCALE;
  }; // (he's bigger than a duck: his hitbox too)
  if (sb)
    return (
      !sh.fake &&
      mgjZombieHit(
        s,
        (x, y, r, body) => near({ x, y }, r, body),
        armOf(sh.k),
        now,
        sh.by,
        sh,
      )
    );
  if (sh.by === JUSTIN_ID) {
    if (sh.fake) return false;
    if (goodUp(s, now) && near(s.pos[GOOD_ID])) goodDown(s, now);
    return false;
  }
  if (shotThrown(s, sh, x0, y0, dx, dy, now)) return true;
  if (
    mgjZombieHit(s, (x, y, r) => near({ x, y }, r), armOf(sh.k), now, sh.by, sh)
  )
    return true; // (one of his zombies in the way: it stops there, but the shots that go through them)
  return mgjHitAt(s, sh.by, now, nearHim, log, shotDmg(sh.k) + drawDmg(sh.dr)); // (a drawn arrow: more, bowdraw.js)
}
/* where a duck's shot I draw stops (the owner's, Nov 17 20:37Z: "BULLETS THAT DO NOT PASS THROUGH ZOMBIES WILL NO
   LONGER PASS THRU ZOMBIES ... THE BULLET KIND IS SEEN GOING PAST THEM A BIT"): the host finds its hit at its next beat
   and my screen hears of it later, while I draw it flying on; so on my screen it stops where it meets, as mgjShot sees
   them, his thrown chair or a controller (shotThrown), one of his wave zombies it doesn't go through (mgjZombieHit),
   or him or his double (mgjBodies). From where I last drew it (x0, y0) to where I draw it now (x1, y1), board shares,
   in the order it gets to them. r: what I know of this shot: skip, the wave zombies it has gone past (sh.zp, sh.zh, or
   by my own look), n, how many it has hit; the one that makes it pierceOf (or 1) stops it. { x, y, i } where it stops
   (i: the zombie's number, or -1), or null */
export function mgjStop(s, sh, r, x0, y0, x1, y1, now) {
  const m = s.mgj;
  if (
    (!sbOnBoard(s) && (!m || s.phase !== "boss")) ||
    sh.by === JUSTIN_ID ||
    sh.fake
  )
    return null;
  const [rx, ry] = sbOnBoard(s) ? boardDuck(s) : [RX, RY],
    ux = (x1 - x0) / rx,
    uy = (y1 - y0) / ry,
    len = ux * ux + uy * uy,
    /* how far along (0 … 1) it comes nearest to q, if that's within room of it (in a duck's length); else -1 */
    along = (q, room) => {
      const px = (q.x - x0) / rx,
        py = (q.y - y0) / ry,
        k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
      return Math.hypot(px - k * ux, py - k * uy) < room ? k : -1;
    },
    meets = []; // [k, the zombie's number or -1]
  for (const th of s.shots || []) {
    if (th.by !== JUSTIN_ID || th.dead || th.fake) continue;
    if (th.k !== "chair" && th.k !== "controller") continue;
    const k = along(
      {
        x: th.x0 + (th.vx * (now - th.t)) / 1000,
        y: th.y0 + (th.vy * (now - th.t)) / 1000,
      },
      th.k === "chair" ? 1.6 : 1,
    );
    if (k >= 0) meets.push([k, -1]);
  }
  for (const o of (s.mz && s.mz.zb) || []) {
    if (o.d || r.skip.has(o.i)) continue;
    const k = along(o, sh.r || 1);
    if (k >= 0) meets.push([k, o.i]);
  }
  for (const b of mgjBodies(s, now)) {
    const k = along(b, (sh.r || 1) * MGJ_SCALE);
    if (k >= 0) meets.push([k, -1]);
  }
  const most = Math.max(1, pierceOf(s, sh.by, armOf(sh.k)));
  for (const [k, i] of meets.sort((a, b) => a[0] - b[0])) {
    if (i >= 0) {
      r.skip.add(i);
      if (++r.n < most) continue; // (the sniper's: on through it)
    }
    return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, i };
  }
  return null;
}
/* I want a duck's bullet (any gun) that crosses his thrown chair or one of his controllers to stop on it and be gone:
   they block bullets and never break (owner, Nov 16 16:47Z) */
function shotThrown(s, sh, x0, y0, dx, dy, now) {
  if (sh.k === "grenade" || sh.k === "lgren" || sh.fake) return false;
  const ux = dx / RX,
    uy = dy / RY,
    len = ux * ux + uy * uy;
  for (const th of s.shots || []) {
    if (th.by !== JUSTIN_ID || th.dead || th.fake) continue;
    if (th.k !== "chair" && th.k !== "controller") continue;
    const q = {
        x: th.x0 + (th.vx * (now - th.t)) / 1000,
        y: th.y0 + (th.vy * (now - th.t)) / 1000,
      },
      px = (q.x - x0) / RX,
      py = (q.y - y0) / RY,
      k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    if (Math.hypot(px - k * ux, py - k * uy) >= (th.k === "chair" ? 1.6 : 1))
      continue;
    th.blk = now; // (it blinks a see-through white: the owner's, Nov 17 13:07Z)
    return true;
  }
  return false;
}

/* a bullet's damage on him: a picked-up gun's as it hits a zombie (l4ddrules.js ARMS, by the bullet's look k), so the
   owner's numbers there follow here (Nov 18 16:43Z); anything else DMG's */
const shotDmg = (k) => {
  const w = Object.keys(ARMS).find((g) => ARMS[g].k === k),
    d = roll(w && ARMS[w].dmg); // (random.js)
  return typeof d === "number" ? d : DMG[k] || 1;
};
/* the grenade launcher's grenade, between (x0, y0) and at this beat: true when it got to him (it goes off there) */
export function mgjLgren(s, sh, x0, y0, at, now) {
  if (!s.justin || s.phase !== "boss" || sh.by === JUSTIN_ID) return false;
  const j = justinAt(s.justin, now),
    ux = (at.x - x0) / RX,
    uy = (at.y - y0) / RY,
    len = ux * ux + uy * uy;
  /* how far along this beat's flight (0 … 1) it reaches q, with room r (duck lengths) round it; -1: it doesn't */
  const along = (q, r) => {
    const px = (q.x - x0) / RX,
      py = (q.y - y0) / RY,
      k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    return Math.hypot(px - k * ux, py - k * uy) < r ? k : -1;
  };
  /* him, or one of his zombies: it goes off on the first it reaches, as it does on Dead Ducks Arcade's zombies (the
     owner's, Nov 17 19:11Z: "WHY THE FUCKING IS THE GRENADE LAUNCHER PASSING THRU THE ZOMBIES"); its blast (rules.js
     blast) then takes the zombies round it */
  let k = j ? along(j, MGJ_SCALE) : -1;
  for (const o of (s.mz && s.mz.zb) || []) {
    if (o.d) continue;
    const q = along(o, 1);
    if (q >= 0 && (k < 0 || q < k)) k = q;
  }
  if (k < 0) return false;
  at.x = x0 + k * (at.x - x0);
  at.y = y0 + k * (at.y - y0);
  return true;
}
