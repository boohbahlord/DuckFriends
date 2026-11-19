/* ---------- Sandbox: spawns and respawns (stage 2), the rules ----------
   The owner's Sandbox file, "Build mode": in build mode (b) a spawn is set where I stand, "a white transparent circle
   with a hollow middle and a white circle at it's center", named at the top in its color. E on it opens its settings:
   what spawns (a zombie, for now), its key, and the boxes (numerat.js): the spawn limit (1, at most 100), the time
   between spawns (4 s), HP, damage and speed (tenths), and the true or false boxes (continuous spawn, can respawn,
   sprint, jump, climb walls). "in order for an entity to spawn, it must be set to a hotbar spawn item OR a key on the
   keybaord, and only by clicking it wil it spawn": its key (while the Build window is up: SB_KEY_IN_BUILD) or the Spawn
   button in its settings.
   - Continuous spawn off: each press makes one, while fewer than its limit are alive.
   - Continuous spawn on: a press starts a run that makes one every "time between spawns", only while nothing stands on
     the spawn, until the limit is alive; pressing again meanwhile does nothing ("it has to finish first").
   - Can respawn: one that dies comes back after the time between spawns, at a respawn of its spawn's color or name (a
     respawn's "who" box: "red", or "red, blue", "players" for the ducks), or at its spawn when there is none.
   - Never more NPCs alive on a map than the zombies' cap (l4ddrules.js Z_MOST, the owner's, Nov 19 01:57Z).
   On the board the zombies are Mad God Justin's wave zombies' kind (s.mz.zb: drawn, hit and heard as his are, with
   their HP, speed and damage from the boxes); on the zombie cabin and Downpour they are Dead Ducks Arcade's own
   (l4ddrules.js l4Spawn), already inside. Duck Cabin gets its zombies with stage 2b. */
import { keep, read, valueOf } from "./numerat.js";
import {
  baseMode,
  isSb,
  sbCan,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_WHAT,
  SB_COLORS,
  SB_KEYS_TAKEN,
  SB_POINTS,
} from "./sandboxrules.js";
import { Z_MOST, l4Spawn, l4Live } from "./l4ddrules.js";
import { WAVE, zLook } from "./mgjrules.js";

/* the boxes that aren't numbers: the name over it, its key, what spawns, and a respawn's "who" */
export const SB_TEXT = {
  name: {
    name: "Name",
    check: (t) => (t.trim().length <= 20 ? "" : "20 letters at most"),
  },
  key: {
    name: "Spawn key",
    check: (t) =>
      !t.trim()
        ? ""
        : !/^[a-z]$/i.test(t.trim())
          ? "One letter"
          : SB_KEYS_TAKEN.includes(t.trim().toLowerCase())
            ? "That key is taken"
            : "",
  },
  what: {
    name: "Spawns",
    check: (t) =>
      words(t).every((w) => SB_WHAT[w]) && words(t).length
        ? ""
        : `Pick from: ${Object.keys(SB_WHAT).join(", ")}`,
  },
  who: {
    name: "Who respawns here",
    check: (t) =>
      words(t).length ? "" : "Write a color, a spawn's name or players",
  },
};
const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
/* a box's settings (number, true or false, or text) */
export const boxOf = (f) => SB_BOXES[f] || SB_FLAGS[f] || SB_TEXT[f] || null;
/* is this text good for box f? "" or why not */
export function boxWhy(f, t) {
  const b = boxOf(f);
  if (!b) return "No such box";
  if (b.check) return b.check(String(t == null ? "" : t));
  const r = read(t, b);
  return r.ok ? "" : r.why;
}
/* what a spawn point's box f says now: its last good text, or its own value */
export function boxText(p, f) {
  const k = p && p.f && p.f[f];
  if (k && k.ok != null && k.ok !== "") return k.ok;
  if (f === "name")
    return p ? `${p.col[0].toUpperCase()}${p.col.slice(1)}` : "";
  if (f === "what") return "zombie";
  if (f === "who") return p ? p.col : "";
  if (f === "key") return "";
  const b = boxOf(f);
  return b && b.def != null ? b.def : "";
}
const num = (p, f) => valueOf({ ok: boxText(p, f) }, boxOf(f));
const flag = (p, f) => num(p, f) === true;

/* the maps with spawns now: the board and Dead Ducks Arcade's two (Duck Cabin with stage 2b) */
export const spawnsHere = (s) =>
  isSb(s) && (sbOnBoard(s) || baseMode(s.options) === "l4dd");
const pointsOf = (s) => (s.sb && s.sb.pts) || {};

/* the NPCs alive now, each { i, x, y, sp } (x, y: shares of the map) */
export function liveNpcs(s) {
  if (sbOnBoard(s))
    return ((s.mz && s.mz.zb) || [])
      .filter((o) => !o.d)
      .map((o) => ({ i: o.i, x: o.x, y: o.y, sp: o.sp }));
  return baseMode(s.options) === "l4dd" ? l4Live(s) : [];
}

/* ---------- making one ---------- */
/* one NPC from spawn id at (x, y) (its spawn, or a respawn); false at the cap */
function makeOne(s, id, at) {
  const p = pointsOf(s)[id];
  if (!p || liveNpcs(s).length >= Z_MOST) return false;
  const hp = Math.max(1, num(p, "hp") || 1),
    sv = num(p, "speed") || 1, // (picked once and kept: "a number is selected and it sticks with it")
    dm = boxText(p, "damage");
  let i;
  if (sbOnBoard(s)) {
    const l = zLook();
    l[0] = hp;
    s.mz = s.mz && s.mz.sb ? s.mz : { zb: [], n: 0, sb: 1 };
    i = ++s.mz.n;
    s.mz.zb.push({
      i,
      x: +(at.x + (Math.random() - 0.5) * 0.02).toFixed(3),
      y: +(at.y + (Math.random() - 0.5) * 0.03).toFixed(3),
      hp,
      a: 0,
      l,
      sp: id,
      sv,
      dm,
      ...(flag(p, "sprint") ? { run: 1 } : {}),
    });
  } else i = l4Spawn(s, at.x, at.y, { hp, speed: sv, sp: id, dm });
  if (!i) return false;
  const live = { ...((s.sb && s.sb.live) || {}) };
  live[id] = [...(live[id] || []), i];
  s.sb = { ...s.sb, live };
  return true;
}
/* how many of spawn id's are alive */
const aliveOf = (s, id, alive) =>
  ((s.sb.live || {})[id] || []).filter((i) => alive.has(i)).length;
/* something stands on spawn p (one of its own, or any NPC): the continuous spawn waits for it to move off */
function taken(p, npcs) {
  const rx = 0.03,
    ry = 0.08;
  return npcs.some((o) => Math.hypot((o.x - p.x) / rx, (o.y - p.y) / ry) < 0.8);
}
/* a press of spawn id's key or Spawn button */
function press(s, id, now) {
  const p = pointsOf(s)[id];
  if (!p || p.k !== "spawn" || !spawnsHere(s)) return false;
  const npcs = liveNpcs(s),
    alive = new Set(npcs.map((o) => o.i)),
    limit = Math.max(1, num(p, "limit") || 1),
    have = aliveOf(s, id, alive);
  if (have >= limit) return false;
  if (flag(p, "cont")) {
    const runs = (s.sb && s.sb.run) || {};
    if (runs[id]) return false; // (a run going: "it has to finish first")
    s.sb = { ...s.sb, run: { ...runs, [id]: now } };
    return true; // (the tick makes the first at once)
  }
  return makeOne(s, id, p);
}

/* ---------- the actions: { t: "sb", k, … } ---------- */
export function sbAct(s, a, now) {
  if (!isSb(s) || !sbCan(s, a.id)) return false;
  const pts = pointsOf(s);
  if (a.k === "add") {
    const me = s.pos[a.id];
    if (!me || !["spawn", "respawn"].includes(a.kind)) return false;
    if (Object.keys(pts).length >= SB_POINTS) return false;
    const n = ((s.sb && s.sb.n) || 0) + 1,
      cols = Object.keys(SB_COLORS),
      used = Object.values(pts).map((p) => p.col),
      col = cols.find((c) => !used.includes(c)) || cols[(n - 1) % cols.length];
    s.sb = {
      ...s.sb,
      n,
      pts: {
        ...pts,
        ["p" + n]: {
          k: a.kind,
          x: +(+me.x).toFixed(4),
          y: +(+me.y).toFixed(4),
          z: Math.round(+me.z || 0),
          col,
          f: {},
        },
      },
    };
    return true;
  }
  const p = pts[a.p];
  if (!p) {
    if (a.k !== "key") return false;
    const key = String(a.key || "").toLowerCase();
    let any = false;
    for (const [id, q] of Object.entries(pts))
      if (q.k === "spawn" && boxText(q, "key").toLowerCase() === key)
        any = press(s, id, now) || any;
    return any;
  }
  if (a.k === "set") {
    const f = String(a.f || "");
    if (f === "col") {
      if (!SB_COLORS[a.v]) return false;
      s.sb = { ...s.sb, pts: { ...pts, [a.p]: { ...p, col: a.v } } };
      return true;
    }
    const b = boxOf(f);
    if (!b || (f === "who") !== (p.k === "respawn")) return false;
    const was = p.f[f],
      t = String(a.v == null ? "" : a.v).slice(0, 80),
      k = b.check
        ? { t, ok: b.check(t) ? (was && was.ok) || "" : t }
        : keep(was, t, b);
    s.sb = {
      ...s.sb,
      pts: { ...pts, [a.p]: { ...p, f: { ...p.f, [f]: k } } },
    };
    return true;
  }
  if (a.k === "del") {
    const rest = { ...pts };
    delete rest[a.p];
    const run = { ...((s.sb && s.sb.run) || {}) };
    delete run[a.p];
    s.sb = { ...s.sb, pts: rest, run };
    return true;
  }
  if (a.k === "go") return press(s, a.p, now);
  return false;
}

/* where something of spawn sp comes back: a respawn whose "who" names its color or its name (one of them at random),
   or the spawn itself */
function backAt(s, sp) {
  const pts = pointsOf(s),
    p = pts[sp];
  if (!p) return null;
  const mine = [p.col, boxText(p, "name").toLowerCase()],
    rs = Object.values(pts).filter(
      (q) =>
        q.k === "respawn" &&
        words(boxText(q, "who")).some((w) => mine.includes(w)),
    );
  return rs.length ? rs[Math.floor(Math.random() * rs.length)] : p;
}
/* ---------- the host's heartbeat ----------
   H: what the rules lend it (rules.js): ducks(s) the ducks up on the board, claw(s, id, dmg, now) a zombie's swipe on a
   duck. True when anything changed */
export function sbTick(s, now, H) {
  if (!spawnsHere(s) || !s.sb) return false;
  let ch = false;
  const pts = pointsOf(s);
  let npcs = liveNpcs(s);
  const alive = new Set(npcs.map((o) => o.i));
  /* the dead: off their spawn's list, and back later if it says so */
  const live = { ...(s.sb.live || {}) },
    rq = [...(s.sb.rq || [])];
  for (const [id, ids] of Object.entries(live)) {
    const left = ids.filter((i) => alive.has(i));
    if (left.length === ids.length) continue;
    const p = pts[id];
    if (p && flag(p, "respawn"))
      for (let k = left.length; k < ids.length; k++)
        rq.push([id, now + 1000 * Math.max(1, num(p, "every") || 4)]);
    if (left.length) live[id] = left;
    else delete live[id];
    ch = true;
  }
  if (ch) s.sb = { ...s.sb, live, rq };
  /* the ones coming back */
  if (rq.some((r) => r[1] <= now)) {
    const later = [];
    for (const r of rq) {
      if (r[1] > now) later.push(r);
      else {
        const at = backAt(s, r[0]);
        if (at && !makeOne(s, r[0], at)) later.push([r[0], now + 1000]); // (at the cap: once there's room)
      }
    }
    s.sb = { ...s.sb, rq: later };
    npcs = liveNpcs(s);
    ch = true;
  }
  /* the continuous spawns running: one each "time between spawns", while nothing stands on the spawn */
  const run = { ...(s.sb.run || {}) };
  for (const [id, at] of Object.entries(run)) {
    const p = pts[id];
    if (!p || !flag(p, "cont")) {
      delete run[id];
      ch = true;
      continue;
    }
    if (now < at) continue;
    const ids = new Set(npcs.map((o) => o.i)),
      limit = Math.max(1, num(p, "limit") || 1);
    if (aliveOf(s, id, ids) >= limit) {
      delete run[id]; // (the limit's alive: the run is over)
      ch = true;
      continue;
    }
    if (taken(p, npcs)) continue;
    if (makeOne(s, id, p)) {
      npcs = liveNpcs(s);
      run[id] = now + 1000 * Math.max(1, num(p, "every") || 4);
      if (aliveOf(s, id, new Set(npcs.map((o) => o.i))) >= limit)
        delete run[id];
      ch = true;
    }
  }
  if (ch) s.sb = { ...s.sb, run };
  if (sbOnBoard(s) && s.mz && s.mz.sb) ch = boardTick(s, now, H) || ch;
  return ch;
}

/* ---------- the board's zombies: as Mad God Justin's wave zombies walk (mgjrules.js wavesTick), at each one's speed and
   damage, and kept apart on a grid so 800 cost little ---------- */
const RX = 0.03,
  RY = 0.08,
  CELL = 1, // (duck lengths: the grid's cells)
  NEAR = 12; // (the most others each one is kept apart from in a beat)
function boardTick(s, now, H) {
  const z = s.mz,
    dt = Math.min(0.4, Math.max(0, (now - (z.t || now)) / 1000));
  z.t = now;
  const live = z.zb.filter((o) => !o.d),
    ducks = H.ducks(s);
  let ch = false;
  for (const o of live) {
    let best = null,
      bd = Infinity;
    for (const id of ducks) {
      const p = s.pos[id],
        d = Math.hypot((p.x - o.x) / RX, (p.y - o.y) / RY);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    if (!best) continue;
    const p = s.pos[best],
      sp = WAVE.SPEED * (o.sv || 1) * (o.run && bd > 4 ? 1.5 : 1); // (can sprint: half as fast again while far off)
    if (bd > WAVE.CLAW * 0.8) {
      const go = Math.min(bd - WAVE.CLAW * 0.8, sp * dt) / bd;
      o.x += (p.x - o.x) * go;
      o.y += (p.y - o.y) * go;
      ch = true;
    }
    if (bd <= WAVE.CLAW && now - o.a >= WAVE.CLAW_MS) {
      o.a = now;
      o.f = p.x < o.x ? -1 : 1;
      H.claw(
        s,
        best,
        Math.max(0.1, valueOf({ ok: o.dm }, SB_BOXES.damage) || 1),
        now,
      );
      ch = true;
    }
  }
  /* never in each other: two too close are pushed apart, each only against a few in its own and the next cells (a
     crowd round a duck can have hundreds in a few cells) */
  const grid = new Map(),
    key = (cx, cy) => cx * 4096 + cy,
    cell = (o) => [Math.floor(o.x / RX / CELL), Math.floor(o.y / RY / CELL)];
  for (const o of live) {
    const k = key(...cell(o));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(o);
  }
  for (const A of live) {
    const [cx, cy] = cell(A);
    let seen = 0;
    for (let gx = cx - 1; gx <= cx + 1 && seen < NEAR; gx++)
      for (let gy = cy - 1; gy <= cy + 1 && seen < NEAR; gy++)
        for (const B of grid.get(key(gx, gy)) || []) {
          if (B.i <= A.i) continue;
          if (++seen > NEAR) break;
          const ex = (A.x - B.x) / RX,
            ey = (A.y - B.y) / RY,
            e = Math.hypot(ex, ey);
          if (e >= 0.9) continue;
          const k = e > 1e-3 ? (0.9 - e) / 2 / e : 0.2,
            ux = e > 1e-3 ? ex * k : Math.random() - 0.5,
            uy = e > 1e-3 ? ey * k : Math.random() - 0.5;
          A.x = Math.min(0.99, Math.max(0.01, A.x + ux * RX));
          A.y = Math.min(0.97, Math.max(0.03, A.y + uy * RY));
          B.x = Math.min(0.99, Math.max(0.01, B.x - ux * RX));
          B.y = Math.min(0.97, Math.max(0.03, B.y - uy * RY));
          ch = true;
        }
  }
  for (const o of live) {
    o.x = Math.round(o.x * 1000) / 1000;
    o.y = Math.round(o.y * 1000) / 1000;
  }
  /* the bodies go after a moment, as his do */
  const n0 = z.zb.length;
  z.zb = z.zb.filter((o) => !o.d || now - o.d < WAVE.DEAD_MS);
  return ch || z.zb.length !== n0;
}
