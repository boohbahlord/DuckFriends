/* ---------- Sandbox: spawns and respawns (stage 2), the rules ----------
   The owner's Sandbox file, "Build mode": in build mode (b) a spawn is set where I stand, "a white transparent circle
   with a hollow middle and a white circle at it's center", named at the top in its color. E on it opens its settings:
   what spawns (a zombie, for now), its key, and the boxes (numerat.js): the spawn limit (1, at most 100), the time
   between spawns (4 s), HP, damage and speed (tenths), and the true or false boxes (continuous spawn, can respawn,
   sprint, jump, climb walls). "in order for an entity to spawn, it must be set to a hotbar spawn item OR a key on the
   keybaord, and only by clicking it wil it spawn": its key (any time, the Build window up or not: SB_KEY_IN_BUILD) or the Spawn
   button in its settings.
   - Continuous spawn off: each press makes one, while fewer than its limit are alive.
   - Continuous spawn on: a press starts a run that makes one every "time between spawns", only while nothing stands on
     the spawn, until the limit is alive; pressing again meanwhile does nothing ("it has to finish first").
   - Can respawn: one that dies comes back after the time between spawns, at a respawn of its spawn's color or name (a
     respawn's "who" box: "red", or "red, blue", "players" for the ducks), or at its spawn when there is none.
   - Never more NPCs alive on a map than the zombies' cap (l4ddrules.js Z_MOST, the owner's, Nov 19 01:57Z).
   On the board the zombies are Mad God Justin's wave zombies' kind (s.mz.zb: drawn, hit and heard as his are, with
   their HP, speed and damage from the boxes); on the zombie cabin and Downpour they are Dead Ducks Arcade's own
   (l4ddrules.js l4Spawn), already inside; on Duck Cabin they are Sandbox's own (sbcabin.js), walking as those do. Every
   other kind (a Blank NPC, Justin, a Test NPC, a made NPC) is Sandbox's own on every world, the zombie maps too, where
   their guns and swings hit them (l4ddrules.js L4_HOOKS). */
import { epMay } from "./sbep.js";
import { keep, read, valueOf } from "./numerat.js";
import {
  baseMode,
  isSb,
  sbMay,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_WHAT,
  SB_ACTS,
  SB_IMPORT,
  SB_OWN,
  SB_PLAYER,
  sbPlayerSpot,
  sbOnWorld,
  SB_COLORS,
  SB_NOCOL,
  sbColOk,
  SB_KEYS_TAKEN,
  SB_POINTS,
  SB_TABS,
  SB_GEO,
  SB_GEO_F,
  SB_ORDER,
  SB_CALL,
  sbNeedsCall,
  sbCallZone,
  sbSix,
  sbTabLive,
  sbUsed,
  SB_LOOT,
  sbItemBox,
  SB_ZONE,
  SB_SHAPE,
  sbSpread,
  sbZoneSpot,
  sbZoneBox,
  sbNpcWalls,
  sbInv,
  sbFitSide,
  sbWallGo,
  sbWallStops,
  boardDuck,
} from "./sandboxrules.js";
import {
  W as WW,
  H as WH,
  STEP,
  standable,
  heightAt,
  floorStep,
} from "./hangout/layout.js";
import { Z_MOST, l4Spawn, l4Live } from "./l4ddrules.js";
import { WAVE, zLook } from "./mgjrules.js";
import { onCabin, sbzOn, cabinLive, cabinSpawn, cabinTick } from "./sbcabin.js";
import { listsOf, decide, MAD } from "./sbbrain.js";
import { zbSpawned } from "./sbzonebrain.js";
import { botDuck } from "./botduck.js";
import { JUSTIN } from "./hangout/npcart.js";
import { armUp, cleanArms, fight, keepAt, reachTo } from "./sbarms.js";
import { nbThink, nbOrder, nbKeep } from "./sbnumberat.js";
import { grFrom, grLeave, grHp, grIds, grLists } from "./sbgroups.js";

/* the boxes that aren't numbers: the name over it, its key, what spawns, and a respawn's "who" */
export const SB_TEXT = {
  /* a Seriat file from the n window that its NPCs run (sbnumberat.js): blank, they think by their lists */
  brain: {
    name: "Brain (a Seriat file)",
    check: (t) =>
      !t.trim() || /^~?[\w./ -]{1,80}$/.test(t.trim())
        ? ""
        : "A file's name from the Seriat window (n), or ~name/file for another player's",
  },
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
      words(t).every((w) => SB_WHAT[w] || /^c:[a-z0-9]{1,24}$/.test(w)) &&
      words(t).length
        ? ""
        : `Pick from: ${Object.keys(SB_WHAT).join(", ")}`,
  }, // (and made NPCs, "c:" and their id: madeOf)
  who: {
    name: "Who respawns here",
    check: (t) =>
      words(t).length ? "" : "Write a color, a spawn's name or players",
  },
  pwho: {
    name: "Who spawns here",
    check: (t) => (words(t).length ? "" : "Write players or their names"),
  },
  /* "a button under the color, where you basically select ... all my red spawns ... I can click multiple, all of which
     will trigger at the same time": the colors whose spawns go off with this one */
  tg: {
    name: "Trigger together",
    check: (t) => (words(t).every((w) => sbColOk(w)) ? "" : "Colors only"),
  },
  /* the groups whatever spawns here, steps in it or takes its loot joins (sbgroups.js; the owner's, Nov 19 23:50Z: "it
     should be able to have a group setting as anything in the zones will have") */
  jg: {
    name: "Joins groups",
    check: (t) =>
      words(t).every((w) => /^g[0-9]{1,4}$/.test(w)) ? "" : "Groups only",
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
export const boxOf = (f) =>
  SB_BOXES[f] ||
  SB_FLAGS[f] ||
  SB_PLAYER[f] ||
  SB_TEXT[f] ||
  SB_LOOT[f] || // (a loot orb's: stage 4b, sbloot.js)
  SB_ZONE[f] || // (a zone's: stage 5, sbzone.js)
  SB_SHAPE[f] || // (every block's shape: sandboxrules.js)
  SB_ORDER[f] || // (every block's squares and their potential order: sandboxrules.js)
  SB_CALL[f] || // (a tab's Caller, and a block's leading zone)
  sbItemBox(f) || // (a loot item's own numbers: "i_ak_dmg", plan Loot 3)
  null;
/* is this text good for box f? "" or why not */
export function boxWhy(f, t) {
  const b = boxOf(f);
  if (!b) return "No such box";
  if (b.check) return b.check(String(t == null ? "" : t));
  if (b.blank && !String(t == null ? "" : t).trim()) return ""; // (blank: the game's own)
  const r = read(t, b);
  return r.ok ? "" : r.why;
}
/* what a spawn point's box f says now: its last good text, or its own value */
export function boxText(p, f) {
  const k = p && p.f && p.f[f];
  if (k && k.ok != null && k.ok !== "") return k.ok;
  if (f === "name")
    return p
      ? p.col === SB_NOCOL
        ? "No color"
        : `${p.col[0].toUpperCase()}${p.col.slice(1)}`
      : "";
  if (f === "what") return "zombie";
  if (f === "pick") return "random";
  if (f === "pwho") return "players";
  if (f === "who") return p ? p.col : "";
  if (f === "key") return "";
  const b = boxOf(f);
  return b && b.def != null ? b.def : "";
}
const num = (p, f) => valueOf({ ok: boxText(p, f) }, boxOf(f));
const flag = (p, f) => num(p, f) === true;

/* ---------- a kind's own settings, set in M (s.sb.kd = { kind: { f: its boxes } }), and a spawn's "Use these
   settings" ----------
   What a spawn makes reads each of SB_OWN from: a respawn that imported it; else the spawn, when its settings are on and
   it wrote that box; else the kind's defaults from M, when written; else the game's own (SB_BOXES' defaults) */
const NONE = { f: {} };
export const kdOf = (s, k) => ((s.sb && s.sb.kd) || {})[k] || null;
export const ownOn = (p) => !p || !p.f || flag(p, "sets");
function fromFor(s, p, k, at = {}) {
  const kd = kdOf(s, k) || NONE,
    own = ownOn(p);
  return (f) =>
    (at.im || []).includes(f)
      ? at
      : own && p.f[f]
        ? p
        : kd.f[f]
          ? kd
          : own
            ? p
            : NONE;
}
/* a kind's behavior lists from M, for sbbrain.js listsOf (where nothing else set them), or null when M set none */
function kdLists(s, k) {
  const kd = kdOf(s, k);
  if (!kd || !Object.keys(SB_ACTS).some((f) => kd.f[f])) return null;
  return Object.fromEntries(
    Object.keys(SB_ACTS).map((f) => [
      f,
      kd.f[f]
        ? boxText(kd, f)
        : f === "target" && k === "zombie"
          ? "players"
          : "",
    ]),
  );
}

/* the maps with spawns: the board, Dead Ducks Arcade's two and Duck Cabin (every map Sandbox is on) */
export const spawnsHere = (s) =>
  isSb(s) && (sbOnBoard(s) || baseMode(s.options) === "l4dd" || onCabin(s));
const pointsOf = (s) => (s.sb && s.sb.pts) || {};

/* the NPCs alive now, each { i, x, y, sp } (x, y: shares of the map) */
export function liveNpcs(s) {
  if (sbOnBoard(s))
    return ((s.mz && s.mz.zb) || [])
      .filter((o) => !o.d)
      .map((o) => ({ i: o.i, x: o.x, y: o.y, sp: o.sp, k: o.k }));
  if (onCabin(s)) return cabinLive(s);
  return baseMode(s.options) === "l4dd" ? [...l4Live(s), ...cabinLive(s)] : []; // (the zombie maps: theirs, and every other kind)
}

/* ---------- made NPCs (stage 3: the m window, sbnpcs.js) ----------
   A player's made NPC comes into the room when a spawn takes it (the "npc" action): s.sb.cn = { id: { name, duck, w,
   beh } }. Its kind is "c:" and its id. Pictures (a made duck's own picture, a spawn's uploaded one) are kept once each in
   s.sbpic = { key: { d (the picture), a (its height over its width) } }, a part of the state that goes to the players
   once (online.js EACH), and the NPCs only name them: a duck's picture is "#" and its key, an uploaded look o.im */
export const madeOf = (s, k) =>
  (String(k || "").startsWith("c:") &&
    s.sb &&
    s.sb.cn &&
    s.sb.cn[k.slice(2)]) ||
  null;
export const SB_PIC = {
  MOST: 2 * 1024 * 1024, // (the owner's, Nov 19 01:57Z: 2 MB at most)
  PART: 150000, // (letters a part: an online action is less than 200,000: database.rules.json)
  PARTS: 20,
  KEEP: 12, // (the most pictures in a room)
};
/* a key for a picture (FNV-1a over its text, and its length) */
export function picKey(t) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + t.length.toString(36);
}
const isPic = (d) =>
  typeof d === "string" && /^data:image\/(png|jpeg|gif|webp);base64,/.test(d);
/* a look as a player sent it, cleaned and made small: its own picture (if any) kept apart in s.sbpic */
function cleanLook(s, dk) {
  if (!dk || typeof dk !== "object" || Array.isArray(dk)) return null;
  const D = { ...dk, keys: [] };
  if (isPic(D.image) && D.image.length < 400000) {
    const h = picKey(D.image),
      imgs = s.sbpic || {};
    if (!imgs[h] && Object.keys(imgs).length < SB_PIC.KEEP)
      s.sbpic = { ...imgs, [h]: { d: D.image, a: 1 } };
    D.image = (s.sbpic || {})[h] ? "#" + h : null;
  } else D.image = null;
  return JSON.stringify(D).length < 6000 ? D : null;
}

/* ---------- making one ---------- */
/* the kind spawn id makes next: its one kind, or with more than one, any of them (Random) or each once in a random order
   before any again (Shuffle: its bag in s.sb.bag) */
function kindFor(s, id, p) {
  let ks = words(boxText(p, "what")).filter((k) => SB_WHAT[k] || madeOf(s, k));
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
  const c = madeOf(s, k);
  if (c) return { dk: { ...c.duck }, nm: c.name, ...armUp(c.w) }; // (a made NPC: its look, its name and its weapons)
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
/* what a spawn's Appearance tab puts on what it spawns (p.ap): a duck's look (dk: a made NPC's, or the player's own), an
   NPC's (k: a zombie, Justin, or a random duck as a Blank or Test NPC wears), or an uploaded picture (im) */
function lookOf(ap) {
  if (!ap) return {};
  if (ap.im) return { im: ap.im };
  if (ap.dk) return { dk: { ...ap.dk } };
  if (ap.k === "zombie") return { zl: 1 };
  if (ap.k === "justin") return { dk: { ...JUSTIN } };
  if (ap.k === "blank" || ap.k === "test") return { dk: botDuck() };
  return {};
}
/* ---------- the zones (stage 5): where things spawn ----------
   a spot at random in zone q (on a world, one a duck can stand on) */
export const zoneSpot = (s, q, inv = false) =>
  sbZoneSpot(s, q, WW, WH, (x, y, z) => standable(x * WW, y * WH, z), inv); // (inv: an Inverse tab's, outside it)
/* the zones whose box f ("ent" or "lt") names point p, by its color or its name */
export function zonesFor(s, f, p) {
  const tags = [p.col, boxText(p, "name").toLowerCase()];
  return Object.values(pointsOf(s)).filter(
    (q) => q.k === "zone" && words(boxText(q, f)).some((w) => tags.includes(w)),
  );
}
/* where spawn id makes one: in a zone that names it (one of them at random), anywhere in its own shape when it's bigger
   than its spot, or on the spawn itself */
function entSpot(s, p, id) {
  const zid = id && sbCallZone(pointsOf(s), id);
  if (zid) return calledSpot(s, zid, true, sbInv(p));
  const zs = zonesFor(s, "ent", p);
  return zs.length
    ? { ...zoneSpot(s, zs[Math.floor(Math.random() * zs.length)]), inz: 1 }
    : areaSpot(s, p);
}
/* a tab's spot, from the zone it answers to (the owner's, Nov 20 02:45Z: "what location is determined by the zone
   algorithm"): one of its acting squares, and one step on when it steps by use */
export function calledSpot(s, zid, spawned = false, inv = false) {
  const at = { ...zoneSpot(s, pointsOf(s)[zid], inv), inz: 1 };
  sbUsed(s, zid);
  if (spawned) zbSpawned(s, zid); // (its file's when spawn: sbzonebrain.js)
  return at;
}
/* a spot at random in block p's own shape (a spawn, respawn or loot spot bigger than one duck), or p itself */
export const areaSpot = (s, p) =>
  sbSpread(p) ? { ...p, ...zoneSpot(s, p), inz: 1 } : p;
/* one NPC from spawn id at (x, y) (its spawn, a zone, or a respawn); false at the cap */
function makeOne(s, id, at) {
  const p = pointsOf(s)[id];
  if (!p || liveNpcs(s).length >= Z_MOST) return false;
  const k = kindFor(s, id, p);
  if (!k) return false;
  const by = fromFor(s, p, k, at), // (coming back at a respawn: what it imported, over its spawn's; then M's defaults)
    hp = Math.max(1, num(by("hp"), "hp") || 1),
    sv = num(by("speed"), "speed") || 1, // (picked once and kept: "a number is selected and it sticks with it")
    dm = boxText(by("damage"), "damage"),
    sz = (num(by("size"), "size") || 100) / 100, // (its Size: picture and hitbox, sbbody.js)
    /* how high it steps up where the map has heights: Can climb walls (on by default) is the way up a step, Can jump (off by
       default) a step more, as a duck's jump does (the owner's, Nov 19 Sandbox file: "setting IF NPC can jump" and "can climb
       walls"); neither: it stays on its level */
    up =
      (flag(by("climb"), "climb") ? STEP : 0) +
      (flag(by("jump"), "jump") ? STEP : 0),
    kind = {
      ...(k === "zombie" ? {} : { k, ...dressFor(s, k) }),
      ...(at.id && (at.im || []).includes("ap") && at.ap
        ? lookOf(at.ap) // (coming back at a respawn that imported Appearance: its look)
        : ownOn(p)
          ? lookOf(p.ap)
          : {}), // (its settings off: it looks as it is)
      ...(at.id && (at.im || []).length ? { rp: at.id } : {}), // (its behavior lists too: think)
      ...(sz !== 1 ? { sz } : {}),
    };
  let i;
  if (sbOnBoard(s)) {
    const l = zLook();
    l[0] = hp;
    s.mz = s.mz && s.mz.sb ? s.mz : { zb: [], n: 0, sb: 1 };
    i = ++s.mz.n;
    s.mz.zb.push({
      i,
      // (a little scatter round a spawn, but never from a spot picked in a zone: it would end up outside the zone)
      x: +(at.x + (at.inz ? 0 : (Math.random() - 0.5) * 0.02)).toFixed(4),
      y: +(at.y + (at.inz ? 0 : (Math.random() - 0.5) * 0.03)).toFixed(4),
      hp,
      a: 0,
      l,
      sp: id,
      sv,
      dm,
      ...(flag(by("sprint"), "sprint") ? { run: 1 } : {}),
      ...kind,
    });
  } else if (
    onCabin(s) ||
    k !== "zombie" ||
    boxText(p, "brain").trim() ||
    kind.sz ||
    kind.im ||
    kind.dk ||
    up !== STEP ||
    (+at.z || 0) > heightAt(at.x * WW, at.y * WH) + STEP // (up on a Sandbox floor, or high with nothing under it: plan Phase 4)
  ) {
    // (a zombie with a Brain walks as Sandbox's own do, so its file can steer it: sbnumberat.js; one with its own look or
    // Size too, which the map's own zombies don't have)
    const c = cabinSpawn(s, at.x, at.y, {
      hp,
      sv,
      dm,
      sp: id,
      run: flag(by("sprint"), "sprint"),
      up,
      look: kind,
      z: +at.z || 0,
    });
    i = c ? "c" + c : 0; // (the zombie maps: Sandbox's own, walking as on Duck Cabin, beside the map's zombies)
  } else i = l4Spawn(s, at.x, at.y, { hp, speed: sv, sp: id, dm });
  if (!i) return false;
  const live = { ...((s.sb && s.sb.live) || {}) };
  live[id] = [...(live[id] || []), i];
  s.sb = { ...s.sb, live };
  const r = at.id && pointsOf(s)[at.id];
  grFrom(s, "n:" + i, r && r.k === "respawn" ? at.id : id); // (its groups: from its spawn, or the respawn it came back at)
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
/* how many of a spawn's may be alive at once: 0 is no limit (the map's cap still holds) */
function limitOf(p) {
  const n = num(p, "limit");
  return n === 0 ? Infinity : Math.max(1, n || 1);
}
const gap = (p) => 1000 * Math.max(0.1, num(p, "every") || 4); // (decimal seconds between spawns)
/* a press of spawn id's key or Spawn button (or a hotbar's spawn button: sbPress), and the spawns of every color its
   Trigger together names with it; done: the ones pressed already this time */
function press(s, id, now, done = new Set()) {
  const p = pointsOf(s)[id];
  if (!p || done.has(id)) return false;
  done.add(id);
  const tg = words(boxText(p, "tg"));
  let any = pressOne(s, id, now);
  if (tg.length)
    for (const [q, P] of Object.entries(pointsOf(s)))
      if (
        P.k === "spawn" &&
        (!P.grp || P.pg === "t") &&
        P.pg !== "pl" &&
        tg.includes(P.col) &&
        !done.has(q)
      ) {
        done.add(q);
        any = pressOne(s, q, now) || any;
      }
  return any;
}
function pressOne(s, id, now) {
  const p = pointsOf(s)[id];
  if (!p || p.k !== "spawn" || p.pg === "pl" || !spawnsHere(s)) return false;
  if (!sbTabLive(pointsOf(s), id)) return false; // (a tab whose Caller names no zone does nothing)
  const npcs = liveNpcs(s),
    alive = new Set(npcs.map((o) => o.i)),
    limit = limitOf(p),
    have = aliveOf(s, id, alive);
  if (have >= limit) return false;
  if (flag(p, "cont")) {
    const runs = (s.sb && s.sb.run) || {};
    if (runs[id]) return false; // (a run going: "it has to finish first")
    s.sb = { ...s.sb, run: { ...runs, [id]: now } };
    return true; // (the tick makes the first at once)
  }
  return makeOne(s, id, entSpot(s, p, id));
}

/* point p with box f set to the text v (what typing in a box does; a pasted or preset point's boxes go through it too) */
function withField(p, f, v) {
  const b = boxOf(f),
    was = p.f[f],
    t = String(v == null ? "" : v).slice(0, SB_ACTS[f] ? 200 : b.len || 80), // (len: a list's longer text, sandboxrules.js)
    k = b.check
      ? { t, ok: b.check(t) ? (was && was.ok) || "" : t }
      : b.blank && !t.trim()
        ? { t, ok: "" }
        : keep(was, t, b);
  const q = { ...p, f: { ...p.f, [f]: k } };
  if (f === "zw" || f === "zh") q[f] = valueOf(k, b, () => 0.5); // (a block's size, as a number: a range's middle)
  if (f === "sh") q.sh = k.ok || "sq"; // (its shape: sandboxrules.js)
  if (f === "fill") {
    if (valueOf(k, b) === true) q.fill = 1;
    else delete q.fill; // (Fill the map)
  }
  return q;
}
/* the point a preset or a copy (a.pt: { col, f: { box: text }, im, ap }) makes out of a new bare one: only what its kind
   has, each box read as if typed (the owner's, Nov 19 17:15Z: a preset before placing, copy and paste) */
/* block id's tabs and pages take its spot, shape and size again (after a move, a turn, a resize or a new shape) */
function geoTo(all, id) {
  const P = all[id];
  if (!P) return all;
  const out = { ...all };
  for (const [q, T] of Object.entries(all)) {
    if (T.grp !== id) continue;
    const t = { ...T, f: { ...T.f } };
    for (const k of SB_GEO)
      if (P[k] === undefined) delete t[k];
      else t[k] = P[k];
    for (const k of SB_GEO_F)
      if (P.f && P.f[k]) t.f[k] = { ...P.f[k] };
      else delete t.f[k];
    out[q] = t;
  }
  return out;
}
function fromPattern(q, pt) {
  if (!pt || typeof pt !== "object") return q;
  if (SB_COLORS[pt.col] || pt.col === SB_NOCOL) q = { ...q, col: pt.col };
  if (q.k === "respawn" && Array.isArray(pt.im)) {
    const all = SB_IMPORT.flatMap(([, fs]) => fs);
    q = { ...q, im: all.filter((f) => pt.im.includes(f)) };
  }
  if (
    q.k === "spawn" &&
    pt.ap &&
    typeof pt.ap === "object" &&
    JSON.stringify(pt.ap).length < 4000
  )
    q = { ...q, ap: pt.ap };
  if (Number.isFinite(pt.rot) && pt.rot)
    q = { ...q, rot: ((pt.rot % 360) + 360) % 360 }; // (a copy keeps how it's turned)
  for (const [f, v] of Object.entries(pt.f || {}))
    if (typeof v === "string" && boxOf(f) && canSet(q, f))
      q = withField(q, f, v);
  return q;
}

/* ---------- a color's settings (wave 2, the owner's, Nov 19: "let's make it to where each spawn carries the properties
   of all of its given colors"): every spawn of a color has the same settings, and so does every respawn of a color;
   each keeps its own name and spot. And every tab and zone too, in its own category (the owner's: "Same color in the
   same category shares settings (white doesn't); four categories: spawn, respawn, loot, zone"); a tab or a zone keeps
   its own shape, size and height as well, as its block has them. No color and a loot orb stand alone; a spawn's Player
   page shares only with Player pages ---------- */
const OWN_ONLY = ["name"],
  OWN_TAB = [...OWN_ONLY, ...SB_GEO_F, "fl"],
  SHARED_K = ["spawn", "respawn", "loot", "zone"],
  pgOf = (p) => (p.pg === "pl" || p.pg === "ent" ? p.pg : "");
/* the other points that share point id's settings */
function kinOf(pts, id, col = pts[id] && pts[id].col) {
  const p = pts[id];
  if (!p || !SHARED_K.includes(p.k) || col === SB_NOCOL) return [];
  return Object.keys(pts).filter(
    (q) =>
      q !== id &&
      pts[q].k === p.k &&
      pts[q].col === col &&
      pgOf(pts[q]) === pgOf(p),
  );
}
/* point q with p's settings (all but its own name; a tab's or a zone's own shape, size and height too) */
function likeIt(q, p) {
  const f = { ...p.f };
  for (const k of q.grp || p.grp || q.k === "zone" ? OWN_TAB : OWN_ONLY) {
    if (q.f[k]) f[k] = q.f[k];
    else delete f[k];
  }
  const r = { ...q, f };
  delete r.im;
  delete r.ap;
  if (p.im) r.im = [...p.im];
  if (p.ap) r.ap = p.ap;
  return r;
}
/* point id changed: every point of its color takes its settings */
function spread(pts, id) {
  const out = { ...pts };
  for (const q of kinOf(pts, id)) out[q] = likeIt(pts[q], pts[id]);
  return out;
}

/* ---------- the actions: { t: "sb", k, … } ---------- */
export function sbAct(s, a, now) {
  if (!isSb(s)) return false;
  /* anyone's screen: how big a duck is on it, for its hits on the NPCs (sbbody.js; game.js sendDu) */
  if (a.k === "du") {
    if (
      !s.players[a.id] ||
      !Array.isArray(a.du) ||
      a.du.length !== 4 ||
      !a.du.every((v) => Number.isFinite(v) && Math.abs(v) < 2) ||
      Math.abs(a.du[0] * a.du[3] - a.du[1] * a.du[2]) < 1e-6
    )
      return false;
    s.sb = {
      ...s.sb,
      du: { ...((s.sb && s.sb.du) || {}), [a.id]: a.du.map(Number) },
    };
    return true;
  }
  /* an NPC is Make an NPC's (M); a picture's part is Build's or M's; the rest is Build's (B): the rights give them all,
     Game Settings may give everyone one (sandboxrules.js sbMay) */
  const may = (k) => sbMay(s, a.id, k);
  if (
    a.k === "npc" || a.k === "kd"
      ? !may("m")
      : a.k === "pic"
        ? !may("b") && !may("m")
        : !may("b")
  )
    return false;
  const pts = pointsOf(s);
  if (a.k === "add") {
    const me = s.pos[a.id];
    if (!me || !["spawn", "respawn", "loot", "zone"].includes(a.kind))
      return false; // (loot: an orb's spot, sbloot.js; zone: sbzone.js)
    if (Object.keys(pts).length >= SB_POINTS) return false;
    /* where: the spot picked on the map (Build: picked, then put down where the mouse or a tap says, the owner's, Nov 19
       12:59Z), or where I stand */
    const at =
        Number.isFinite(a.x) && Number.isFinite(a.y)
          ? {
              x: Math.min(1, Math.max(0, a.x)),
              y: Math.min(1, Math.max(0, a.y)),
            }
          : null,
      z = at ? (sbOnBoard(s) ? 0 : heightAt(at.x * WW, at.y * WH)) : +me.z || 0;
    const n = ((s.sb && s.sb.n) || 0) + 1,
      pt = a.pt && typeof a.pt === "object" ? a.pt : null,
      /* the color picked before placing, a pasted one's own, or no color (white): every new zone starts with no color
         (the owner's, Nov 20 02:37Z: "Its color is no color by default, which is white") */
      ok = (c) => !!SB_COLORS[c] || c === SB_NOCOL,
      col = ok(a.col) ? a.col : pt && ok(pt.col) ? pt.col : SB_NOCOL,
      id = "p" + n;
    const made = fromPattern(
      {
        k: a.kind,
        x: +(at ? at.x : +me.x).toFixed(4),
        y: +(at ? at.y : +me.y).toFixed(4),
        z: Math.round(z),
        col,
        f: {},
      },
      pt && { ...pt, col },
    );
    if (!made.f.name) {
      const v = sbSix(); // (six numbers until it's typed out: the owner's, Nov 20 04:39Z)
      made.f = { ...made.f, name: { t: v, ok: v } };
    }
    let all = { ...pts, [id]: made };
    const kin = kinOf(all, id),
      set =
        pt &&
        ((pt.f && Object.keys(pt.f).some((f) => !OWN_ONLY.includes(f))) ||
          pt.im ||
          pt.ap);
    if (kin.length)
      all = set
        ? spread(all, id) // (a preset or a paste: its color takes it)
        : { ...all, [id]: likeIt(all[id], all[kin[0]]) }; // (a bare one: its color's settings)
    s.sb = { ...s.sb, n, pts: all };
    return true;
  }
  /* a made NPC comes into the room (or comes again, changed): its look, name, weapons and behavior */
  if (a.k === "npc") {
    const n = a.n || {},
      id = String(n.id || ""),
      cn = (s.sb && s.sb.cn) || {};
    if (!/^[a-z0-9]{1,24}$/.test(id)) return false;
    if (!cn[id] && Object.keys(cn).length >= 50) return false;
    const was = cn[id],
      owner = (was && was.by) || a.id; // (whoever brought it in first: P's rights over it are theirs, sbep.js)
    if (!epMay(s, owner, a.id, "m")) return false;
    const duck = cleanLook(s, n.duck);
    if (!duck) return false;
    const beh = {};
    for (const f of Object.keys(SB_ACTS))
      beh[f] = String((n.beh || {})[f] || "").slice(0, 200);
    s.sb = {
      ...s.sb,
      cn: {
        ...cn,
        [id]: {
          name:
            String(n.name || "NPC")
              .trim()
              .slice(0, 20) || "NPC",
          duck,
          w: cleanArms(n.w),
          beh,
          by: owner,
          ...(owner !== a.id ? { ed: a.id, et: now } : {}), // (changed by someone the owner let: the owner's device may keep it, sbepview.js)
        },
      },
    };
    return true;
  }
  /* a part of an uploaded picture (the parts come one by one, each under an online action's size); the host keeps the
     parts to itself (s.hidden) until the last one is in */
  if (a.k === "pic") {
    const h = String(a.h || ""),
      of = Math.floor(+a.of),
      n = Math.floor(+a.n),
      imgs = s.sbpic || {};
    if (!/^[a-z0-9]{1,24}$/.test(h) || imgs[h]) return false;
    if (!(of >= 1 && of <= SB_PIC.PARTS && n >= 0 && n < of)) return false;
    if (typeof a.d !== "string" || a.d.length > SB_PIC.PART) return false;
    if (Object.keys(imgs).length >= SB_PIC.KEEP) return false;
    const hid = s.hidden || {},
      up = { ...(hid.sbup || {}) },
      parts = [...(up[h] || [])];
    parts[n] = a.d;
    up[h] = parts;
    if (parts.filter((x) => typeof x === "string").length === of) {
      const d = parts.join("");
      delete up[h];
      if (isPic(d) && d.length <= SB_PIC.MOST * 1.4)
        s.sbpic = {
          ...imgs,
          [h]: { d, a: Math.min(4, Math.max(0.25, +a.a || 1)) },
        };
    }
    s.hidden = { ...hid, sbup: up };
    return true;
  }
  /* the Seriat files a Brain box names (and the files they use), sent by the player who set it: sbnumberat.js */
  if (a.k === "nbf")
    return !!a.files && typeof a.files === "object" && nbKeep(s, a.files);
  /* M's defaults for a kind: kind, f (one of SB_OWN), v (its text; "" for the game's own); reset: all of them back */
  if (a.k === "kd") {
    const kind = String(a.kind || ""),
      f = String(a.f || ""),
      all = { ...((s.sb && s.sb.kd) || {}) };
    if (!SB_WHAT[kind]) return false;
    if (a.reset) delete all[kind];
    else {
      const b = boxOf(f);
      if (!b || !SB_OWN.includes(f)) return false;
      const fs = { ...((all[kind] || NONE).f || {}) },
        t = String(a.v == null ? "" : a.v).slice(0, SB_ACTS[f] ? 200 : 80);
      if (t === "" && !SB_ACTS[f]) delete fs[f];
      else
        fs[f] = b.check
          ? { t, ok: b.check(t) ? (fs[f] && fs[f].ok) || "" : t }
          : keep(fs[f], t, b);
      all[kind] = { f: fs };
    }
    s.sb = { ...s.sb, kd: all };
    return true;
  }
  /* ---------- moving, turning, resizing and cutting blocks (plan Phase 2) ----------
     move: ps (one or many) by dx, dy (shares of the map), refused if any would leave the map; turn: ps by deg; cut: ps
     all gone. A spawn's pages go with it */
  if (["move", "turn", "cut"].includes(a.k)) {
    const ids = [...new Set(Array.isArray(a.ps) ? a.ps.map(String) : [])]
      .filter((id) => pts[id] && !pts[id].grp && !pts[id].lock) // (a locked one stays: "lock" below)
      .slice(0, SB_POINTS);
    if (!ids.length) return false;
    let all = { ...pts };
    const run = { ...((s.sb && s.sb.run) || {}) },
      with_ = (id) => [
        id,
        ...Object.keys(pts).filter((q) => pts[q].grp === id),
      ];
    if (a.k === "move") {
      let dx = +a.dx,
        dy = +a.dy;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
      /* "It cannot be placed down if one of the shapes is outside of the map": the step stops where the first edge meets
         the map's edge (any edge, not only its middle); one already hanging off, from before, may still move */
      let lo = -Infinity,
        hi = Infinity,
        loY = -Infinity,
        hiY = Infinity;
      for (const id of ids) {
        const [x0, y0, x1, y1] = sbZoneBox(s, pts[id], WW, WH);
        if (x0 >= -1e-4 && x1 <= 1 + 1e-4) {
          lo = Math.max(lo, -x0);
          hi = Math.min(hi, 1 - x1);
        }
        if (y0 >= -1e-4 && y1 <= 1 + 1e-4) {
          loY = Math.max(loY, -y0);
          hiY = Math.min(hiY, 1 - y1);
        }
      }
      if (lo <= hi) dx = Math.min(hi, Math.max(lo, dx));
      if (loY <= hiY) dy = Math.min(hiY, Math.max(loY, dy));
      if (
        ids.some((id) => {
          const x = pts[id].x + dx,
            y = pts[id].y + dy;
          return x < 0 || x > 1 || y < 0 || y > 1;
        })
      )
        return false; // (and never its middle)
      for (const id of ids)
        for (const q of with_(id)) {
          const P = pts[q],
            x = +(P.x + dx).toFixed(4),
            y = +(P.y + dy).toFixed(4),
            z = sbOnBoard(s) ? 0 : Math.round(heightAt(x * WW, y * WH));
          all[q] = { ...P, x, y, z };
        }
      if (sbOnWorld(s)) all = floorsTo(all); // (one with an elevation keeps it)
    } else if (a.k === "turn") {
      const by = +a.deg;
      if (!Number.isFinite(by)) return false;
      for (const id of ids)
        all = geoTo(
          {
            ...all,
            [id]: {
              ...pts[id],
              rot: ((((pts[id].rot || 0) + by) % 360) + 360) % 360,
            },
          },
          id,
        );
    } else
      for (const id of ids)
        for (const q of with_(id)) {
          delete all[q];
          delete run[q];
        }
    s.sb = { ...s.sb, pts: all, run };
    return true;
  }
  const p = pts[a.p];
  if (!p) {
    if (a.k !== "key") return false;
    const key = String(a.key || "").toLowerCase(),
      done = new Set(); // (each spawn once, however many of its color and Trigger together name it)
    let any = false;
    for (const [id, q] of Object.entries(pts))
      if (q.k === "spawn" && boxText(q, "key").toLowerCase() === key)
        any = press(s, id, now, done) || any;
    return any;
  }
  /* Lock (the owner's, Nov 20 04:51Z: "right click allow a lock option where zone cannot be moved or edited or cut, but
     can be copied"): a block's p.lock; nothing on it or its tabs changes while it's on, but it still goes off and copies */
  if (a.k === "lock") {
    if (p.grp) return false;
    const q = { ...p };
    if (a.on) q.lock = 1;
    else delete q.lock;
    s.sb = { ...s.sb, pts: { ...pts, [a.p]: q } };
    return true;
  }
  if (
    (p.lock || (p.grp && pts[p.grp] && pts[p.grp].lock)) &&
    ["set", "del", "page", "look", "size", "kind"].includes(a.k)
  )
    return false;
  if (a.k === "set") {
    const f = String(a.f || "");
    if (f === "col") {
      if (!sbColOk(a.v)) return false;
      const kin = kinOf(pts, a.p, a.v);
      s.sb = {
        ...s.sb,
        pts: {
          ...pts,
          [a.p]: kin.length
            ? likeIt({ ...p, col: a.v }, pts[kin[0]]) // (it takes on its new color's settings)
            : { ...p, col: a.v },
        },
      };
      return true;
    }
    const b = boxOf(f);
    if (!b || !canSet(p, f)) return false;
    const q = withField(p, f, a.v),
      all = OWN_ONLY.includes(f)
        ? { ...pts, [a.p]: q }
        : spread({ ...pts, [a.p]: q }, a.p);
    let out = all;
    if (f === "fl" && sbOnWorld(s)) out = floorsTo(out); // (a new elevation: it and its tabs sit at its height)
    if (SB_GEO_F.includes(f))
      for (const q of [a.p, ...kinOf(pts, a.p)]) out = geoTo(out, q); // (a new shape or size: their tabs too)
    s.sb = { ...s.sb, pts: out };
    return true;
  }
  if (a.k === "del") {
    const rest = { ...pts },
      run = { ...((s.sb && s.sb.run) || {}) };
    for (const [id, q] of Object.entries(pts))
      if (id === a.p || q.grp === a.p) {
        delete rest[id];
        delete run[id];
      } // (a spawn's own + pages go with it)
    s.sb = { ...s.sb, pts: rest, run };
    return true;
  }
  if (a.k === "imp") {
    if (p.k !== "respawn" || !Array.isArray(a.fs)) return false;
    const all = SB_IMPORT.flatMap(([, fs]) => fs),
      im = all.filter((f) => a.fs.includes(f) || (p.im || []).includes(f)); // (in the spawn menu's order)
    if (!im.length) return false;
    const from = Object.values(pts).find(
        (q) => q.k === "spawn" && q.col === p.col && q.pg !== "pl",
      ), // (its values start as its color's spawn's)
      f = { ...p.f };
    for (const k of im) if (!f[k] && from && from.f[k]) f[k] = { ...from.f[k] };
    const q = { ...p, im, f };
    if (im.includes("ap") && !p.ap && from && from.ap) q.ap = from.ap; // (Appearance: its spawn's look, as it is now)
    s.sb = { ...s.sb, pts: spread({ ...pts, [a.p]: q }, a.p) };
    return true;
  }
  if (a.k === "page") {
    /* a spawn's Entity or Player page, or on any block a tab of a purpose (plan Phase 2c): a point of its own on the
       block's spot, shape and size, its grp the block's */
    const tab = SB_TABS.some(([k]) => k === a.kind);
    if (p.grp || (!tab && (p.k !== "spawn" || !["ent", "pl"].includes(a.kind))))
      return false;
    if (Object.keys(pts).length >= SB_POINTS) return false;
    const n = ((s.sb && s.sb.n) || 0) + 1;
    /* no color, as every new zone (the owner's, Nov 20 02:37Z), and six numbers for its variable name; one made from the
       zone's own Type (tie) takes the zone's name and color, so it's tied to it from the start (the owner's, Nov 20
       04:39Z: "connected by color or variable or both") */
    let base = p,
      v = sbSix(),
      col = SB_NOCOL;
    if (a.tie && tab) {
      const had = base.f && base.f.name && base.f.name.ok;
      if (had) v = String(had);
      else base = { ...base, f: { ...base.f, name: { t: v, ok: v } } };
      col = base.col;
    }
    s.sb = {
      ...s.sb,
      n,
      pts: geoTo(
        {
          ...pts,
          [a.p]: base,
          ["p" + n]: {
            k: tab ? a.kind : "spawn",
            x: p.x,
            y: p.y,
            z: p.z,
            col,
            grp: a.p,
            pg: tab ? "t" : a.kind,
            f: tab
              ? {
                  name: { t: v, ok: v },
                  ...(a.kind === "zone" && base.f && base.f.fl
                    ? { fl: { ...base.f.fl } }
                    : {}), // (a Zone tab stands on its block's floor, as a real-build test needed)
                }
              : {},
          },
        },
        a.p,
      ),
    };
    if (sbOnWorld(s)) s.sb = { ...s.sb, pts: floorsTo(s.sb.pts) }; // (at its block's height)
    const id = "p" + n,
      all = s.sb.pts,
      kin = all[id] ? kinOf(all, id) : [];
    if (kin.length)
      s.sb = {
        ...s.sb,
        pts: geoTo({ ...all, [id]: likeIt(all[id], all[kin[0]]) }, a.p),
      }; // (a tab of a color: that color's settings, from the first)
    return true;
  }
  /* the spawn's Appearance tab: what those it spawns look like (null: their own look) */
  if (a.k === "look") {
    if (p.k !== "spawn" || p.pg === "pl") return false;
    const v = a.ap || {},
      ap = v.im
        ? (s.sbpic || {})[v.im]
          ? { im: String(v.im) }
          : null
        : v.dk
          ? (() => {
              const dk = cleanLook(s, v.dk),
                from = String(v.from || "").slice(0, 30); // (which one it was, for the tab: "me" or a made NPC's kind)
              return dk && { dk, ...(from ? { from } : {}) };
            })()
          : SB_WHAT[v.k]
            ? { k: v.k }
            : null,
      q = { ...p, ...(ap ? { ap } : {}) };
    if (!ap) delete q.ap;
    s.sb = { ...s.sb, pts: spread({ ...pts, [a.p]: q }, a.p) };
    return true;
  }
  /* its size from a resize handle: zw, zh (duck lengths, 1 to 40) and its new middle x, y */
  if (a.k === "size") {
    if (p.grp) return false;
    const zw = sbFitSide(+a.zw),
      zh = sbFitSide(+a.zh),
      x = +a.x,
      y = +a.y;
    if (![zw, zh, x, y].every(Number.isFinite)) return false;
    if (zw !== +a.zw || zh !== +a.zh) return false; // (as dragged: sbFitSide)
    if (x < 0 || x > 1 || y < 0 || y > 1) return false;
    let q = withField(withField(p, "zw", String(zw)), "zh", String(zh));
    q = { ...q, x: +x.toFixed(4), y: +y.toFixed(4) };
    s.sb = { ...s.sb, pts: geoTo({ ...pts, [a.p]: q }, a.p) };
    return true;
  }
  /* its Purpose (plan Phase 2): one block, four purposes. It keeps its spot, shape, color and every box it has; a
     spawn's pages go with the spawn, a loot spot's orb with the loot */
  if (a.k === "kind") {
    const to = String(a.v || "");
    if (p.grp || !["spawn", "respawn", "loot", "zone"].includes(to))
      return false;
    if (to === p.k) return false;
    const q = { ...p, k: to };
    for (const f of ["orb", "gone", "im"]) delete q[f];
    const rest = { ...pts, [a.p]: q },
      run = { ...((s.sb && s.sb.run) || {}) };
    delete run[a.p];
    for (const [id, P] of Object.entries(pts))
      if (P.grp === a.p && P.pg !== "t") {
        delete rest[id];
        delete run[id];
      } // (a spawn's Entity and Player pages; its tabs stay, each its own purpose)
    s.sb = { ...s.sb, pts: rest, run };
    return true;
  }
  if (a.k === "go") return press(s, a.p, now);
  return false;
}

/* which boxes a point takes: a respawn its "who" and what it imported; a spawn its own, and its Players tab's (a +
   page for players only those) */
/* plan Phase 4: a zone with an elevation sits at it, (elevation - 1) gas station roofs over the map's ground (world px);
   on a block's own zone, so do its tabs that have none of their own */
const hasFl = (p) => p.k === "zone" && !!p.f && !!p.f.fl;
function floorsTo(pts) {
  const out = { ...pts };
  for (const [id, p] of Object.entries(pts)) {
    if (!hasFl(p)) continue;
    const n = Math.round(valueOf({ ok: boxText(p, "fl") }, SB_ZONE.fl)),
      z =
        (Math.min(6, Math.max(1, Number.isFinite(n) ? n : 1)) - 1) *
        floorStep();
    for (const [q, t] of Object.entries(out))
      if ((q === id || (!p.grp && t.grp === id && !hasFl(t))) && t.z !== z)
        out[q] = { ...t, z };
  }
  return out;
}
function canSet(p, f) {
  if (f === "jg") return true; // (every block, tab and page: its groups)
  if (f === "call") return sbNeedsCall(p); // (a Spawn, Respawn or Loot tab's Caller)
  if (f === "inv") return p.k === "zone" || sbNeedsCall(p); // (Inverse: a zone's, or a tab that answers to one)
  if (f === "lead") return !p.grp; // (the zone a block leads with)
  if (SB_SHAPE[f] || f === "zw" || f === "zh") return !p.grp; // (every block's shape and size; a page has its spawn's)
  if (SB_ORDER[f]) return p.pg !== "pl"; // (every block's and tab's own potential order)
  if (p.k === "loot")
    return (
      !!SB_LOOT[f] ||
      ["name", "hide", "limit", "every", "cont"].includes(f) || // (its spawning: a spawn's own boxes, plan Loot 1)
      !!sbItemBox(f) // (each item's numbers, plan Loot 3)
    ); // (a loot orb's own boxes: sbloot.js)
  if (p.k === "zone")
    return (
      !!SB_ZONE[f] ||
      ["name", "pon", "pwho", "hide", "brain", "dark"].includes(f)
    ); // (a zone's own, players spawning in it, its Seriat file: sbzonebrain.js, and Dark outside)
  if (SB_LOOT[f] || SB_ZONE[f]) return false;
  if (p.k === "respawn")
    return ["who", "name", "hide"].includes(f) || (p.im || []).includes(f);
  if (f === "who") return false;
  if (p.pg === "pl") return !!SB_PLAYER[f] || f === "pwho" || f === "name";
  return true;
}

/* ---------- the ducks: where they spawn, and the HP and speed a spawn or a respawn gives them ----------
   s.sb.pl = { id: { hp, sp } }, set each time a duck is put at one (blank or not imported: the game's own) */
function statsAt(q) {
  const v = (f) => {
    const n = num(q, f);
    return Number.isFinite(n) ? n : 0;
  };
  if (q.k === "respawn")
    return {
      hp: (q.im || []).includes("hp") ? v("hp") : 0,
      sp: (q.im || []).includes("speed") ? v("speed") : 0,
    };
  return { hp: v("php"), sp: v("pspd") };
}
/* put duck id where it spawns now (a respawn for players, or a spawn whose Players tab is on for it), with what that
   gives it; nothing when there's none */
export function sbPlaceDuck(s, id) {
  const q = sbPlayerSpot(s, id, WW, WH, (x, y, z) =>
    standable(x * WW, y * WH, z),
  );
  grLeave(s, "p:" + id); // (spawning again: out of its groups, then into the ones this block gives)
  if (!q || !s.pos[id]) return false;
  s.pos[id] = {
    ...s.pos[id],
    x: q.x,
    y: q.y,
    ...(sbOnWorld(s) ? { z: q.z || 0 } : {}),
  };
  const st = statsAt(q),
    pl = { ...((s.sb && s.sb.pl) || {}) };
  if (st.hp || st.sp)
    pl[id] = {
      ...(st.hp ? { hp: st.hp } : {}),
      ...(st.sp ? { sp: st.sp } : {}),
    };
  else delete pl[id];
  s.sb = { ...s.sb, pl };
  if (q.id) grFrom(s, "p:" + id, q.id);
  return true;
}
/* a duck's HP in Sandbox (0: the game's own) and its walk (1 as usual); the zombie maps keep their own HP */
export const sbHpOf = (s, id) => {
  if (!isSb(s) || baseMode(s.options) === "l4dd" || !s.sb) return 0;
  const hp = (s.sb.pl && s.sb.pl[id] && s.sb.pl[id].hp) || 0,
    g = s.sb.gm && s.sb.gm["p:" + id] ? grHp(s, id, hp || 4) : 0; // (its groups' Max HP over it, sbgroups.js; 4: the game's, rules.js PHP)
  return g && g !== (hp || 4) ? g : hp;
};
export const sbWalkOf = (s, id) =>
  (isSb(s) &&
    baseMode(s.options) !== "l4dd" &&
    s.sb &&
    s.sb.pl &&
    s.sb.pl[id] &&
    s.sb.pl[id].sp) ||
  1;

/* where something of spawn sp comes back: a respawn whose "who" names its color or its name (one of them at random),
   or the spawn itself */
function backAt(s, sp) {
  const pts = pointsOf(s),
    p = pts[sp];
  if (!p) return null;
  const mine = [p.col, boxText(p, "name").toLowerCase()],
    rs = Object.entries(pts)
      .filter(
        ([id, q]) =>
          q.k === "respawn" &&
          sbTabLive(pts, id) &&
          words(boxText(q, "who")).some((w) => mine.includes(w)),
      )
      .map(([id, q]) => ({ ...q, id }));
  if (!rs.length) return entSpot(s, p, sp); // (none: where it first spawns)
  const r = rs[Math.floor(Math.random() * rs.length)],
    zid = sbCallZone(pts, r.id);
  return zid ? calledSpot(s, zid, false, sbInv(r)) : areaSpot(s, r);
}
/* ---------- the host's heartbeat ----------
   H: what the rules lend it (rules.js): ducks(s) the ducks up on the board, claw(s, id, dmg, now) a zombie's swipe on a
   duck. True when anything changed */
export function sbTick(s, now, H) {
  if (!spawnsHere(s) || !s.sb) return false;
  let ch = false;
  /* a duck that joins: where it spawns (a spawn's Players tab, or a respawn for players), if there's one. The ducks here
     when Sandbox began only get noted */
  const ids = s.seat.filter((id) => s.pos[id]),
    seen = s.sb.seen;
  if (
    !seen ||
    ids.length !== seen.length ||
    ids.some((id) => !seen.includes(id))
  ) {
    if (seen) for (const id of ids) if (!seen.includes(id)) sbPlaceDuck(s, id);
    s.sb = { ...s.sb, seen: ids };
    ch = true;
  }
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
        rq.push([id, now + gap(p)]);
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
  /* Auto spawn: a run starts by itself whenever fewer than its limit are alive (the first at once, later ones a "time
     between spawns" after) */
  for (const [id, p] of Object.entries(pts))
    if (
      p.k === "spawn" &&
      (!p.grp || p.pg === "t") &&
      p.pg !== "pl" &&
      !run[id] &&
      sbTabLive(pts, id) &&
      flag(p, "auto") &&
      aliveOf(s, id, new Set(npcs.map((o) => o.i))) < limitOf(p)
    ) {
      const was = (s.sb.au || {})[id];
      run[id] = was ? Math.max(now, was + gap(p)) : now;
      ch = true;
    }
  for (const [id, at] of Object.entries(run)) {
    const p = pts[id];
    if (!p || (!flag(p, "cont") && !flag(p, "auto"))) {
      delete run[id];
      ch = true;
      continue;
    }
    if (now < at) continue;
    const ids = new Set(npcs.map((o) => o.i)),
      limit = limitOf(p);
    if (aliveOf(s, id, ids) >= limit) {
      delete run[id]; // (the limit's alive: the run is over)
      ch = true;
      continue;
    }
    if (!sbTabLive(pts, id)) continue; // (its Caller names no zone)
    const spot = entSpot(s, p, id);
    if (spot === p && taken(p, npcs)) continue; // (in a zone: there's room)
    if (makeOne(s, id, spot)) {
      npcs = liveNpcs(s);
      if (flag(p, "auto"))
        s.sb = { ...s.sb, au: { ...(s.sb.au || {}), [id]: now } }; // (when it made its last)
      run[id] = now + gap(p);
      if (aliveOf(s, id, new Set(npcs.map((o) => o.i))) >= limit)
        delete run[id];
      ch = true;
    }
  }
  if (ch) s.sb = { ...s.sb, run };
  if (sbOnBoard(s) && s.mz && s.mz.sb) ch = boardTick(s, now, H) || ch;
  if (sbzOn(s)) ch = cabinTick(s, now, { ...H, think, strike }) || ch;
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
      const k = o.sp + "|" + (o.k || "zombie") + "|" + (o.rp || ""),
        r = o.rp && pts[o.rp],
        sp = pts[o.sp] && ownOn(pts[o.sp]) ? pts[o.sp] : NONE, // (its settings off: none of the spawn's lists)
        of = (p, f) => (r && (r.im || []).includes(f) ? r : p); // (came back at a respawn that imported it: the respawn's)
      if (!memo.has(k))
        memo.set(
          k,
          listsOf(
            sp,
            o,
            (p, f) => (of(p, f).col ? boxText(of(p, f), f) : ""),
            (p, f) => set(of(p, f), f),
            (madeOf(s, o.k) || {}).beh || kdLists(s, o.k || "zombie"), // (a made NPC: its own lists, where the spawn set none; a kind: M's)
          ),
        );
      const L = memo.get(k),
        G = grLists(s, "n:" + o.i); // (its groups' Target and Ignore lists too: sbgroups.js)
      return G
        ? { ...L, T: [...L.T, ...G.T], I: [...L.I, ...G.I], np: true }
        : L;
    },
    tags = new Map();
  for (const [id, p] of Object.entries(pts))
    tags.set(id, [p.col, boxText(p, "name").toLowerCase()]);
  const ducks = H.ducks(s).map((id) => ({
      key: "p:" + id,
      duck: true,
      id,
      g: grIds(s, "p:" + id), // (its groups: sbbrain.js matches)
      ...duckAt(id),
    })),
    them = npcs.map((o) => ({
      key: "n:" + o.i,
      k: o.k || "zombie",
      tags: tags.get(o.sp) || [],
      g: grIds(s, "n:" + o.i),
      mad: o.mad,
      fo: o.fo,
      o,
      ...at(o),
    })),
    all = [...ducks, ...them],
    brains = new Map(),
    brainOf = (o) => {
      if (!brains.has(o.sp))
        brains.set(o.sp, pts[o.sp] ? boxText(pts[o.sp], "brain").trim() : "");
      return brains.get(o.sp);
    };
  const nbCh = nbThink(s, now, them, all, ducks, far, brainOf); // (the NPCs that run a Seriat file)
  const out = them.map((me) => {
    const d = nbOrder(me, all) || decide(me, lists(me.o), all, ducks, far, now),
      fo = d.foe ? d.foe.key : undefined;
    if (me.o.fo !== fo) {
      if (fo) me.o.fo = fo;
      else delete me.o.fo;
    }
    return { me, o: me.o, d };
  });
  out.ch = nbCh; // (a file changed something: an NPC's stats, what it says)
  return out;
}
/* a blow of NPC o (thing me) on foe: its claw (the spawn's damage box), or d from one of its weapons (w: sbarms.js). A
   duck loses HP as from a zombie (H.claw); an NPC loses it too, and goes after whoever hit it (sbbrain.js MAD) */
export function strike(s, now, me, foe, H, o, d = null, w = "claw") {
  const dmg = Math.max(
    0.1,
    d != null ? d : valueOf({ ok: o.dm }, SB_BOXES.damage) || 1,
  );
  if (foe.duck) return H.claw(s, foe.id, dmg, now, w);
  const q = foe.o;
  if (!q || q.d) return;
  q.hp = Math.max(0, Math.round((q.hp - dmg) * 10) / 10);
  q.mad = [me.key, now + MAD];
  if (q.hp <= 0) q.d = now;
}

/* ---------- the board's zombies: as Mad God Justin's wave zombies walk (mgjrules.js wavesTick), at each one's speed and
   damage, and kept apart on a grid so 800 cost little ---------- */
const CELL = 1, // (duck lengths: the grid's cells)
  NEAR = 12; // (the most others each one is kept apart from in a beat)
function boardTick(s, now, H) {
  const [RX, RY] = boardDuck(s); // (a duck's length: less of a bigger board, Board size in G)
  const z = s.mz,
    dt = Math.min(0.4, Math.max(0, (now - (z.t || now)) / 1000));
  z.t = now;
  const live = z.zb.filter((o) => !o.d),
    far = (a, b) => Math.hypot((a.x - b.x) / RX, (a.y - b.y) / RY);
  let ch = false;
  const spot = (o) => ({ x: o.x, y: o.y }),
    wallsOf = sbNpcWalls(s); // (the zones that are walls to each: plan Phase 3)
  const plans = think(s, now, live, spot, H, far, (id) => spot(s.pos[id]));
  if (plans.ch) ch = true;
  for (const { me, o, d } of plans) {
    const to = d.goal || d.flee;
    if (!to) continue;
    const x0 = o.x,
      y0 = o.y,
      bd = far(me, to),
      claw = reachTo(WAVE.CLAW, o, to, s), // (its hitbox, and its foe's: sbarms.js)
      sp = WAVE.SPEED * (o.sv || 1) * (o.run && bd > 4 ? 1.5 : 1); // (can sprint: half as fast again while far off)
    if (d.flee) {
      const go = Math.min(1, (sp * dt) / Math.max(bd, 1e-3));
      o.x = Math.min(0.99, Math.max(0.01, o.x - (to.x - o.x) * go));
      o.y = Math.min(0.97, Math.max(0.03, o.y - (to.y - o.y) * go));
      ch = true;
    } else if (bd > (d.foe ? keepAt(o, claw) : claw * 0.8)) {
      const stop = d.foe ? keepAt(o, claw) : claw * 0.8, // (a gun keeps its distance: sbarms.js)
        go = Math.min(bd - stop, sp * dt) / bd;
      o.x += (to.x - o.x) * go;
      o.y += (to.y - o.y) * go;
      ch = true;
    }
    if (wallsOf(o).length)
      [o.x, o.y] = sbWallGo(s, wallsOf(o), x0, y0, o.x, o.y, 0, 1, 1, o); // (round a wall, never through it)
    if (Math.abs(o.x - x0) > 1e-4) o.f = o.x > x0 ? 1 : -1; // (the way it goes: a made NPC's weapon points it, or at what it hits; and its picture faces it, so it's hit where it shows, sbbody.js)
    if (
      d.foe &&
      fight(o, to, bd, claw, now, WAVE.CLAW_MS, (dm, w) =>
        strike(s, now, me, d.foe, H, o, dm, w),
      )
    ) {
      o.f = to.x < o.x ? -1 : 1;
      ch = true;
    }
  }
  /* never in each other: two too close are pushed apart, each only against a few in its own and the next cells (a
     crowd round a duck can have hundreds in a few cells) */
  const was = live.map((o) => [o.x, o.y]),
    grid = new Map(),
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
  live.forEach((o, i) => {
    if (wallsOf(o).length && sbWallStops(s, wallsOf(o), ...was[i], o.x, o.y, 0))
      [o.x, o.y] = was[i]; // (never pushed through a wall)
  });
  for (const o of live) {
    o.x = Math.round(o.x * 1000) / 1000;
    o.y = Math.round(o.y * 1000) / 1000;
  }
  /* the bodies go after a moment, as his do */
  const n0 = z.zb.length;
  z.zb = z.zb.filter((o) => !o.d || now - o.d < WAVE.DEAD_MS);
  return ch || z.zb.length !== n0;
}
/* the same press from elsewhere (a hotbar's spawn button), the rights checked by its caller */
export const sbPress = (s, id, now) => press(s, id, now);
/* why a press of spawn id would make nothing, in a few words for a toast ("" when it would spawn): its tab tied to no
   zone, or as many of its alive as its limit lets (a Spawn key at its limit did nothing and said nothing) */
export function sbWhyNot(s, id) {
  const p = pointsOf(s)[id];
  if (!p || p.k !== "spawn" || p.pg === "pl" || !spawnsHere(s)) return "";
  const n = boxText(p, "name").trim() || p.col + " spawn",
    name = /^\d+$/.test(n) ? "Spawn " + n : n; // (a tab's own six digits, as on its tab)
  if (!sbTabLive(pointsOf(s), id))
    return `${name}: it shares no zone's variable name or color yet.`;
  const have = aliveOf(s, id, new Set(liveNpcs(s).map((o) => o.i))),
    limit = limitOf(p);
  return have >= limit
    ? `${name}: its limit is reached (${have} of ${limit} alive). Raise "Spawn limit" (0: none).`
    : "";
}
