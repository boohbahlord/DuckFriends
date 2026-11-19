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
   (l4ddrules.js l4Spawn), already inside; on Duck Cabin they are Sandbox's own (sbcabin.js), walking as those do. Every
   other kind (a Blank NPC, Justin, a Test NPC, a made NPC) is Sandbox's own on every world, the zombie maps too, where
   their guns and swings hit them (l4ddrules.js L4_HOOKS). */
import { keep, read, valueOf } from "./numerat.js";
import {
  baseMode,
  isSb,
  sbCan,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_WHAT,
  SB_ACTS,
  SB_IMPORT,
  SB_PLAYER,
  sbPlayerSpot,
  sbOnWorld,
  SB_COLORS,
  SB_KEYS_TAKEN,
  SB_POINTS,
  SB_LOOT,
  SB_ZONE,
  sbZoneSpot,
} from "./sandboxrules.js";
import { W as WW, H as WH, standable } from "./hangout/layout.js";
import { Z_MOST, l4Spawn, l4Live } from "./l4ddrules.js";
import { WAVE, zLook } from "./mgjrules.js";
import { onCabin, sbzOn, cabinLive, cabinSpawn, cabinTick } from "./sbcabin.js";
import { listsOf, decide, MAD } from "./sbbrain.js";
import { botDuck } from "./botduck.js";
import { JUSTIN } from "./hangout/npcart.js";
import { armUp, cleanArms, fight, keepAt } from "./sbarms.js";

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
    return p ? `${p.col[0].toUpperCase()}${p.col.slice(1)}` : "";
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
export const zoneSpot = (s, q) =>
  sbZoneSpot(s, q, WW, WH, (x, y, z) => standable(x * WW, y * WH, z));
/* the zones whose box f ("ent" or "lt") names point p, by its color or its name */
export function zonesFor(s, f, p) {
  const tags = [p.col, boxText(p, "name").toLowerCase()];
  return Object.values(pointsOf(s)).filter(
    (q) => q.k === "zone" && words(boxText(q, f)).some((w) => tags.includes(w)),
  );
}
/* where spawn id makes one: in a zone that names it (one of them at random), or on the spawn itself */
function entSpot(s, p) {
  const zs = zonesFor(s, "ent", p);
  return zs.length ? zoneSpot(s, zs[Math.floor(Math.random() * zs.length)]) : p;
}
/* one NPC from spawn id at (x, y) (its spawn, a zone, or a respawn); false at the cap */
function makeOne(s, id, at) {
  const p = pointsOf(s)[id];
  if (!p || liveNpcs(s).length >= Z_MOST) return false;
  const k = kindFor(s, id, p);
  if (!k) return false;
  const by = (f) => ((at.im || []).includes(f) ? at : p), // (coming back at a respawn: what it imported, over its spawn's)
    hp = Math.max(1, num(by("hp"), "hp") || 1),
    sv = num(by("speed"), "speed") || 1, // (picked once and kept: "a number is selected and it sticks with it")
    dm = boxText(by("damage"), "damage"),
    kind = {
      ...(k === "zombie" ? {} : { k, ...dressFor(s, k) }),
      ...lookOf(p.ap),
      ...(at.id && (at.im || []).length ? { rp: at.id } : {}), // (its behavior lists too: think)
    };
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
      ...(flag(by("sprint"), "sprint") ? { run: 1 } : {}),
      ...kind,
    });
  } else if (onCabin(s) || k !== "zombie") {
    const c = cabinSpawn(s, at.x, at.y, {
      hp,
      sv,
      dm,
      sp: id,
      run: flag(by("sprint"), "sprint"),
      look: kind,
    });
    i = c ? "c" + c : 0; // (the zombie maps: Sandbox's own, walking as on Duck Cabin, beside the map's zombies)
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
/* a press of spawn id's key or Spawn button (or a hotbar's spawn button: sbPress) */
function press(s, id, now) {
  const p = pointsOf(s)[id];
  if (!p || p.k !== "spawn" || p.pg === "pl" || !spawnsHere(s)) return false;
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
  return makeOne(s, id, entSpot(s, p));
}

/* ---------- the actions: { t: "sb", k, … } ---------- */
export function sbAct(s, a, now) {
  if (!isSb(s) || !sbCan(s, a.id)) return false;
  const pts = pointsOf(s);
  if (a.k === "add") {
    const me = s.pos[a.id];
    if (!me || !["spawn", "respawn", "loot", "zone"].includes(a.kind))
      return false; // (loot: an orb's spot, sbloot.js; zone: sbzone.js)
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
  /* a made NPC comes into the room (or comes again, changed): its look, name, weapons and behavior */
  if (a.k === "npc") {
    const n = a.n || {},
      id = String(n.id || ""),
      cn = (s.sb && s.sb.cn) || {};
    if (!/^[a-z0-9]{1,24}$/.test(id)) return false;
    if (!cn[id] && Object.keys(cn).length >= 50) return false;
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
    if (!b || !canSet(p, f)) return false;
    const was = p.f[f],
      t = String(a.v == null ? "" : a.v).slice(0, SB_ACTS[f] ? 200 : 80),
      k = b.check
        ? { t, ok: b.check(t) ? (was && was.ok) || "" : t }
        : b.blank && !t.trim()
          ? { t, ok: "" }
          : keep(was, t, b);
    const q = { ...p, f: { ...p.f, [f]: k } };
    if (f === "zw" || f === "zh") q[f] = valueOf(k, b, () => 0.5); // (a zone's size, as a number: a range's middle)
    s.sb = { ...s.sb, pts: { ...pts, [a.p]: q } };
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
    s.sb = { ...s.sb, pts: { ...pts, [a.p]: { ...p, im, f } } };
    return true;
  }
  if (a.k === "page") {
    if (p.k !== "spawn" || p.grp || !["ent", "pl"].includes(a.kind))
      return false;
    if (Object.keys(pts).length >= SB_POINTS) return false;
    const n = ((s.sb && s.sb.n) || 0) + 1,
      cols = Object.keys(SB_COLORS),
      used = Object.values(pts).map((q) => q.col),
      col = cols.find((c) => !used.includes(c)) || cols[(n - 1) % cols.length];
    s.sb = {
      ...s.sb,
      n,
      pts: {
        ...pts,
        ["p" + n]: {
          k: "spawn",
          x: p.x,
          y: p.y,
          z: p.z,
          col,
          grp: a.p,
          pg: a.kind,
          f: {},
        },
      },
    };
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
    s.sb = { ...s.sb, pts: { ...pts, [a.p]: q } };
    return true;
  }
  if (a.k === "go") return press(s, a.p, now);
  return false;
}

/* which boxes a point takes: a respawn its "who" and what it imported; a spawn its own, and its Players tab's (a +
   page for players only those) */
function canSet(p, f) {
  if (p.k === "loot") return !!SB_LOOT[f] || f === "name"; // (a loot orb's own boxes: sbloot.js)
  if (p.k === "zone")
    return !!SB_ZONE[f] || ["name", "pon", "pwho"].includes(f); // (a zone's own, and players spawning in it)
  if (SB_LOOT[f] || SB_ZONE[f]) return false;
  if (p.k === "respawn") return f === "who" || (p.im || []).includes(f);
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
  return true;
}
/* a duck's HP in Sandbox (0: the game's own) and its walk (1 as usual); the zombie maps keep their own HP */
export const sbHpOf = (s, id) =>
  (isSb(s) &&
    baseMode(s.options) !== "l4dd" &&
    s.sb &&
    s.sb.pl &&
    s.sb.pl[id] &&
    s.sb.pl[id].hp) ||
  0;
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
        ([, q]) =>
          q.k === "respawn" &&
          words(boxText(q, "who")).some((w) => mine.includes(w)),
      )
      .map(([id, q]) => ({ ...q, id }));
  return rs.length ? rs[Math.floor(Math.random() * rs.length)] : entSpot(s, p); // (none: where it first spawns)
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
    const spot = entSpot(s, p);
    if (spot === p && taken(p, npcs)) continue; // (in a zone: there's room)
    if (makeOne(s, id, spot)) {
      npcs = liveNpcs(s);
      run[id] = now + 1000 * Math.max(1, num(p, "every") || 4);
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
        of = (p, f) => (r && (r.im || []).includes(f) ? r : p); // (came back at a respawn that imported it: the respawn's)
      if (!memo.has(k))
        memo.set(
          k,
          listsOf(
            pts[o.sp] || { f: {} },
            o,
            (p, f) => (of(p, f).col ? boxText(of(p, f), f) : ""),
            (p, f) => set(of(p, f), f),
            (madeOf(s, o.k) || {}).beh, // (a made NPC: its own lists, where the spawn set none)
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
    const x0 = o.x,
      bd = far(me, to),
      sp = WAVE.SPEED * (o.sv || 1) * (o.run && bd > 4 ? 1.5 : 1); // (can sprint: half as fast again while far off)
    if (d.flee) {
      const go = Math.min(1, (sp * dt) / Math.max(bd, 1e-3));
      o.x = Math.min(0.99, Math.max(0.01, o.x - (to.x - o.x) * go));
      o.y = Math.min(0.97, Math.max(0.03, o.y - (to.y - o.y) * go));
      ch = true;
    } else if (bd > (d.foe ? keepAt(o, WAVE.CLAW) : WAVE.CLAW * 0.8)) {
      const stop = d.foe ? keepAt(o, WAVE.CLAW) : WAVE.CLAW * 0.8, // (a gun keeps its distance: sbarms.js)
        go = Math.min(bd - stop, sp * dt) / bd;
      o.x += (to.x - o.x) * go;
      o.y += (to.y - o.y) * go;
      ch = true;
    }
    if (o.wp && Math.abs(o.x - x0) > 1e-4) o.f = o.x > x0 ? 1 : -1; // (a made NPC's weapon points the way it goes, or at what it hits)
    if (
      d.foe &&
      fight(o, to, bd, WAVE.CLAW, now, WAVE.CLAW_MS, (dm, w) =>
        strike(s, now, me, d.foe, H, o, dm, w),
      )
    ) {
      o.f = to.x < o.x ? -1 : 1;
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
/* the same press from elsewhere (a hotbar's spawn button), the rights checked by its caller */
export const sbPress = (s, id, now) => press(s, id, now);
