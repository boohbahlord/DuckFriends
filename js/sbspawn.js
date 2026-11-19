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
   (l4ddrules.js l4Spawn), already inside; on Duck Cabin they are Sandbox's own (sbcabin.js), walking as those do. */
import { keep, read, valueOf } from "./numerat.js";
import {
  baseMode,
  isSb,
  sbCan,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_WHAT,
  SB_WHAT_ZMAPS,
  SB_ACTS,
  SB_COLORS,
  SB_KEYS_TAKEN,
  SB_POINTS,
} from "./sandboxrules.js";
import { Z_MOST, l4Spawn, l4Live } from "./l4ddrules.js";
import { WAVE, zLook } from "./mgjrules.js";
import { onCabin, cabinLive, cabinSpawn, cabinTick } from "./sbcabin.js";
import { listsOf, decide, MAD } from "./sbbrain.js";
import { botDuck } from "./botduck.js";
import { JUSTIN } from "./hangout/npcart.js";

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
  pick: {
    name: "Pick",
    check: (t) =>
      ["random", "shuffle"].includes(t.trim()) ? "" : "Random or shuffle",
  },
  ...Object.fromEntries(
    Object.entries(SB_ACTS).map(([f, name]) => [
      f,
      { name, check: (t) => (t.length <= 200 ? "" : "200 letters at most") },
    ]),
  ),
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
  if (f === "pick") return "random";
  if (f === "who") return p ? p.col : "";
  if (f === "key") return "";
  const b = boxOf(f);
  return b && b.def != null ? b.def : "";
}
const num = (p, f) => valueOf({ ok: boxText(p, f) }, boxOf(f));
const flag = (p, f) => num(p, f) === true;

/* the maps with spawns: the board, Dead Ducks Arcade's two and Duck Cabin (every map Sandbox is on) */
export const spawnsHere = (s) =>
  isSb(s) && (sbOnBoard(s) || baseMode(s.options) === "l4dd" || onCabin(s));
const pointsOf = (s) => (s.sb && s.sb.pts) || {};

/* the NPCs alive now, each { i, x, y, sp } (x, y: shares of the map) */
export function liveNpcs(s) {
  if (sbOnBoard(s))
    return ((s.mz && s.mz.zb) || [])
      .filter((o) => !o.d)
      .map((o) => ({ i: o.i, x: o.x, y: o.y, sp: o.sp }));
  if (onCabin(s)) return cabinLive(s);
  return baseMode(s.options) === "l4dd" ? l4Live(s) : [];
}

/* ---------- making one ---------- */
/* the kind spawn id makes next: its one kind, or with more than one, any of them (Random) or each once in a random order
   before any again (Shuffle: its bag in s.sb.bag). The zombie maps make only zombies (SB_WHAT_ZMAPS) */
function kindFor(s, id, p) {
  let ks = words(boxText(p, "what")).filter((k) => SB_WHAT[k]);
  if (baseMode(s.options) === "l4dd")
    ks = ks.filter((k) => SB_WHAT_ZMAPS.includes(k));
  if (ks.length < 2) return ks[0] || null;
  if (boxText(p, "pick") !== "shuffle")
    return ks[Math.floor(Math.random() * ks.length)];
  const bags = { ...((s.sb && s.sb.bag) || {}) };
  let bag = (bags[id] || []).filter((k) => ks.includes(k));
  if (!bag.length) bag = [...ks].sort(() => Math.random() - 0.5);
  const k = bag.shift();
  bags[id] = bag;
  s.sb = { ...s.sb, bag: bags };
  return k;
}
/* what a duck-shaped NPC wears, and the name over it: a Blank NPC a random look, Justin his, a Test NPC a computer's
   look and name */
function dressFor(s, k) {
  if (k === "justin") return { dk: { ...JUSTIN }, nm: "Justin" };
  if (k === "blank") return { dk: botDuck() };
  if (k === "test") {
    const taken = new Set(Object.values(s.players).map((P) => P.name)); // (never a computer player's name: net.js botPlayer)
    let n = ((s.sb && s.sb.tn) || 0) + 1;
    while (taken.has("Computer-" + n)) n++;
    s.sb = { ...s.sb, tn: n };
    return { dk: botDuck(), nm: "Computer-" + n };
  }
  return {};
}
/* one NPC from spawn id at (x, y) (its spawn, or a respawn); false at the cap */
function makeOne(s, id, at) {
  const p = pointsOf(s)[id];
  if (!p || liveNpcs(s).length >= Z_MOST) return false;
  const k = kindFor(s, id, p);
  if (!k) return false;
  const hp = Math.max(1, num(p, "hp") || 1),
    sv = num(p, "speed") || 1, // (picked once and kept: "a number is selected and it sticks with it")
    dm = boxText(p, "damage"),
    kind = k === "zombie" ? {} : { k, ...dressFor(s, k) };
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
      ...kind,
    });
  } else if (onCabin(s))
    i = cabinSpawn(s, at.x, at.y, {
      hp,
      sv,
      dm,
      sp: id,
      run: flag(p, "sprint"),
      ...kind,
    });
  else i = l4Spawn(s, at.x, at.y, { hp, speed: sv, sp: id, dm });
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
  if (onCabin(s)) ch = cabinTick(s, now, { ...H, think, strike }) || ch;
  return ch;
}

/* ---------- thinking: the behavior lists (sbbrain.js), the same on every map ----------
   npcs: the NPCs up (any shape), at(o) and duckAt(id): an NPC's and a duck's spot as { x, y } in the map's units (the
   board: shares of it; the worlds: world px), far(a, b): duck lengths between two. Gives each its decision; o.fo keeps what it is after (a guard sees
   what comes for its charge) */
export function think(s, now, npcs, at, H, far, duckAt) {
  const pts = pointsOf(s),
    memo = new Map(),
    set = (p, f) => !!(p.f && p.f[f]),
    lists = (o) => {
      const k = o.sp + "|" + (o.k || "zombie");
      if (!memo.has(k))
        memo.set(
          k,
          listsOf(
            pts[o.sp] || { f: {} },
            o,
            (p, f) => (p.col ? boxText(p, f) : ""),
            set,
          ),
        );
      return memo.get(k);
    },
    tags = new Map();
  for (const [id, p] of Object.entries(pts))
    tags.set(id, [p.col, boxText(p, "name").toLowerCase()]);
  const ducks = H.ducks(s).map((id) => ({
      key: "p:" + id,
      duck: true,
      id,
      ...duckAt(id),
    })),
    them = npcs.map((o) => ({
      key: "n:" + o.i,
      k: o.k || "zombie",
      tags: tags.get(o.sp) || [],
      mad: o.mad,
      fo: o.fo,
      o,
      ...at(o),
    })),
    all = [...ducks, ...them];
  return them.map((me) => {
    const d = decide(me, lists(me.o), all, ducks, far, now),
      fo = d.foe ? d.foe.key : undefined;
    if (me.o.fo !== fo) {
      if (fo) me.o.fo = fo;
      else delete me.o.fo;
    }
    return { me, o: me.o, d };
  });
}
/* a claw of NPC o (thing me) on foe: a duck loses HP as from a zombie (H.claw); an NPC loses it too, and goes after
   whoever clawed it (sbbrain.js MAD) */
export function strike(s, now, me, foe, H, o) {
  const dmg = Math.max(0.1, valueOf({ ok: o.dm }, SB_BOXES.damage) || 1);
  if (foe.duck) return H.claw(s, foe.id, dmg, now);
  const q = foe.o;
  if (!q || q.d) return;
  q.hp = Math.max(0, Math.round((q.hp - dmg) * 10) / 10);
  q.mad = [me.key, now + MAD];
  if (q.hp <= 0) q.d = now;
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
    far = (a, b) => Math.hypot((a.x - b.x) / RX, (a.y - b.y) / RY);
  let ch = false;
  const spot = (o) => ({ x: o.x, y: o.y });
  for (const { me, o, d } of think(s, now, live, spot, H, far, (id) =>
    spot(s.pos[id]),
  )) {
    const to = d.goal || d.flee;
    if (!to) continue;
    const bd = far(me, to),
      sp = WAVE.SPEED * (o.sv || 1) * (o.run && bd > 4 ? 1.5 : 1); // (can sprint: half as fast again while far off)
    if (d.flee) {
      const go = Math.min(1, (sp * dt) / Math.max(bd, 1e-3));
      o.x = Math.min(0.99, Math.max(0.01, o.x - (to.x - o.x) * go));
      o.y = Math.min(0.97, Math.max(0.03, o.y - (to.y - o.y) * go));
      ch = true;
    } else if (bd > WAVE.CLAW * 0.8) {
      const go = Math.min(bd - WAVE.CLAW * 0.8, sp * dt) / bd;
      o.x += (to.x - o.x) * go;
      o.y += (to.y - o.y) * go;
      ch = true;
    }
    if (d.foe && bd <= WAVE.CLAW && now - o.a >= WAVE.CLAW_MS) {
      o.a = now;
      o.f = to.x < o.x ? -1 : 1;
      strike(s, now, me, d.foe, H, o);
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
