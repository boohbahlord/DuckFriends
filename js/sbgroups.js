/* ---------- Sandbox: groups (plan Phase 5), the rules ----------
   My words (Nov 19): "In the build mode, there's another option besides zones ... called groups." A group is a named set
   of rules that a player or an NPC joins when one of its conditions is met:
   - spawned from a block of a color and purpose ("when spawn in red, therefore trigger this group setting. When respawn,
     trigger group setting for blue respawn": a red spawn and a blue respawn are different conditions);
   - stepped into a zone ("you become a part of a group just by stepping over a certain zone");
   - picked up a loot ("picking up a certain item ... is the triggering condition"): the loot block, or the thing itself;
   - a block's variable name (any block of that name, as above).
   And from the block's side: every block and tab has a Group setting ("it should be able to have a group setting as
   anything in the zones will have"): what spawns there, steps in it or takes its loot joins those groups.
   What joining does: Max HP ("+30" extends it, "30" sets it), Heal on joining (an amount, or 100%: "set HP to 100%"),
   Regen HP, Regen stamina, Cooldown speed, an outline color, who its NPCs target or ignore, and the windows' rights
   ("group settings includes permissions"). Which wins: game settings, then groups, then loot, then the player's own; a
   blank (neutral) setting steps aside.
   Groups are named in every list as "g:" and their id (sbbrain.js matches, sbzone.js), under the entities.
   s.sb.gr = { id: group }, s.sb.gm = { "p:" a duck's id or "n:" an NPC's: [group ids] } (only this moment's: a save
   leaves it out), s.sb.gj = [[who, group id]]: joins waiting for the heartbeat (it has the clock and the HP rules). A
   duck leaves its groups when it spawns again (sbspawn.js sbPlaceDuck); an NPC when it dies. */
import { epMay } from "./sbep.js";
import {
  isSb,
  sbMay,
  sbOnBoard,
  baseMode,
  sbZoneBox,
  sbInBlock,
  SB_COLORS,
  SB_RIGHTS,
} from "./sandboxrules.js";
import { read, valueOf } from "./numerat.js";
import { W, H, heightAt } from "./hangout/layout.js";

export const GR_MOST = 20; // (groups on a map at most)
const DUCK_HP = 4; // (a duck's own HP on the board and Duck Cabin: rules.js PHP)
const HP_MOST = 1000; // (an NPC's most: SB_BOXES.hp.max)
const FLOOR = 40; // (world px: a zone's floor, as sbzone.js)
const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
/* what box f of block p says (as sbspawn.js boxText, kept here so this file needs nothing of the spawns': it is read by
   the HP and cooldown rules early on) */
const boxText = (p, f) => {
  const k = p && p.f && p.f[f];
  if (k && k.ok != null && k.ok !== "") return String(k.ok);
  return f === "name" && p && p.col
    ? p.col[0].toUpperCase() + p.col.slice(1)
    : "";
};
/* a block's variable name as one word for a list ("Big Bob" is big_bob) */
export const nameWord = (p) =>
  boxText(p, "name").trim().toLowerCase().replace(/\s+/g, "_");
/* ---------- a group's settings ---------- */
const hpBox = { kind: "int", min: 1, max: HP_MOST },
  tenth = (min, max) => ({ kind: "tenth", min, max });
export const GR_BOX = {
  hp: {
    name: "Max HP (+30 adds, 30 sets)",
    check: (t) => {
      const v = String(t).trim();
      if (!v) return "";
      const r = read(v.replace(/^\+/, ""), hpBox);
      return r.ok ? "" : r.why;
    },
  },
  heal: {
    name: "Heal on joining (or 100%)",
    check: (t) => {
      const v = String(t).trim();
      if (!v) return "";
      if (/%$/.test(v))
        return +v.slice(0, -1) > 0 && +v.slice(0, -1) <= 100
          ? ""
          : "1% to 100%";
      const r = read(v, tenth(0.1, HP_MOST));
      return r.ok ? "" : r.why;
    },
  },
  rhp: { name: "Regen HP (each second)", ...tenth(0.1, 100) },
  rst: { name: "Regen stamina (times as fast)", ...tenth(0.1, 5) },
  cd: { name: "Cooldown speed (times as fast)", ...tenth(0.1, 5) },
};
export const GR_LISTS = {
  target: "Its NPCs target",
  ignore: "Its NPCs ignore",
};
/* yes-or-no settings ("" no, "1" yes): a real-build test (Nov 20) of a King of the hill: "You stay King after you
   walk out" and "it can't be a true king" */
export const GR_YN = {
  lv: "Leaves when it steps out",
  one: "Only one member at a time",
};
/* is t good for setting f? "" or why not */
export function grWhy(f, t) {
  const b = GR_BOX[f];
  if (b && b.check) return b.check(String(t == null ? "" : t));
  if (b) {
    if (!String(t == null ? "" : t).trim()) return "";
    const r = read(t, b);
    return r.ok ? "" : r.why;
  }
  if (f === "n")
    return String(t).trim() && String(t).trim().length <= 20
      ? ""
      : "1 to 20 letters";
  if (f === "ol") return !t || SB_COLORS[t] ? "" : "A color";
  if (GR_YN[f]) return !t || t === "1" ? "" : "Yes or no";
  if (f === "c" || f === "who" || GR_LISTS[f])
    return String(t).length <= 400 ? "" : "400 letters at most";
  return "No such setting";
}
const val = (g, f) =>
  String((g && g[f]) || "").trim()
    ? valueOf({ ok: String(g[f]).trim() }, GR_BOX[f])
    : NaN;
export const grOf = (s) => (isSb(s) && s.sb && s.sb.gr) || {};
/* the groups key k is in, as groups */
const mine = (s, k) => {
  const gr = grOf(s);
  return (((s.sb && s.sb.gm) || {})[k] || [])
    .map((id) => gr[id])
    .filter(Boolean);
};
/* the groups key k is in, by id (sbbrain.js matches, sbzone.js) */
export const grIds = (s, k) =>
  (((s && s.sb && s.sb.gm) || {})[k] || []).filter((id) => grOf(s)[id]);
/* does list ws name a group thing k is in */
export const grIn = (s, ws, k) =>
  grIds(s, k).some((g) => ws.includes("g:" + g));

/* ---------- what being in them does ---------- */
/* duck id's most HP: base (its spawn's or the game's), its groups' Max HP over it in order (+ adds, a number sets) */
export function grHp(s, id, base) {
  let hp = base;
  for (const g of mine(s, "p:" + id)) hp = hpFrom(g, hp);
  return hp;
}
function hpFrom(g, hp) {
  const t = String(g.hp || "").trim(),
    n = t ? valueOf({ ok: t.replace(/^\+/, "") }, hpBox) : NaN;
  if (!Number.isFinite(n)) return hp;
  return Math.min(HP_MOST, t.startsWith("+") ? hp + n : n);
}
/* how many times as fast duck id's stamina fills again (stamina.js), and its weapons cool (rules.js coolEnds) */
const most = (s, id, f) =>
  mine(s, "p:" + id).reduce((m, g) => {
    const v = val(g, f);
    return Number.isFinite(v) ? Math.max(m || 0, v) : m;
  }, null) || 1;
export const grStam = (s, id) => (isSb(s) ? most(s, id, "rst") : 1);
export const grCool = (s, id) => (isSb(s) ? most(s, id, "cd") : 1);
/* the outline color of thing k (the last of its groups that has one), or "" */
export function grLine(s, k) {
  const gs = mine(s, k);
  for (let i = gs.length - 1; i >= 0; i--)
    if (SB_COLORS[gs[i].ol]) return SB_COLORS[gs[i].ol];
  return "";
}
/* NPC key k's groups' Target and Ignore lists, to add to its own (sbspawn.js think) */
export function grLists(s, k) {
  const gs = mine(s, k);
  if (!gs.length) return null;
  const T = gs.flatMap((g) => words(g.target)),
    I = gs.flatMap((g) => words(g.ignore));
  return T.length || I.length ? { T, I } : null;
}
/* ---------- joining ----------
   Thing k came from block pid (spawned there, or took its loot: got, the thing it took). Its groups wait for the
   heartbeat in s.sb.gj */
export function grFrom(s, k, pid, got = "") {
  const gr = grOf(s),
    p = ((s.sb && s.sb.pts) || {})[pid];
  if (!p || !Object.keys(gr).length) return;
  const tags = [`${p.k}:${p.col}`, `name:${nameWord(p)}`],
    own = words(boxText(p, "jg"));
  if (got) tags.push("got:" + String(got).toLowerCase());
  const ids = Object.keys(gr).filter(
    (g) => own.includes(g) || words(gr[g].c).some((c) => tags.includes(c)),
  );
  if (ids.length)
    s.sb = {
      ...s.sb,
      gj: [...(s.sb.gj || []), ...ids.map((g) => [k, g])].slice(-400),
    };
}
/* duck id spawns again: out of every group */
export function grLeave(s, k) {
  const gm = (s.sb && s.sb.gm) || {};
  if (!gm[k]) return;
  const next = { ...gm };
  delete next[k];
  s.sb = { ...s.sb, gm: next };
}
/* may thing k (a duck's id, or an NPC o) join group g: its "Who can join" (Everything by default) */
function mayJoin(s, g, k, o) {
  const ws = words(g.who || "everything");
  if (ws.includes("everything")) return true;
  if (k.startsWith("p:")) {
    const name = String((s.players[k.slice(2)] || {}).name || "")
      .trim()
      .toLowerCase();
    return ws.includes("players") || (!!name && ws.includes(name));
  }
  if (!o) return false;
  const q = ((s.sb && s.sb.pts) || {})[o.sp];
  return (
    ws.includes(o.k || "zombie") ||
    (!!q && (ws.includes(q.col) || ws.includes(nameWord(q)))) ||
    grIn(s, ws, k)
  );
}
/* the NPCs, by key: the board's, Duck Cabin's and the zombie maps' Sandbox ones, and the zombie maps' own zombies
   (H0.l4up: copies, put back by H0.l4set) */
const L4 = new WeakSet(); // (the zombie maps' own, as copies)
function npcList(s, H0) {
  const out = [];
  if (baseMode(s.options) === "l4dd")
    for (const o of H0.l4up(s)) {
      L4.add(o);
      out.push(["n:" + o.i, o, "l4"]);
    }
  if (sbOnBoard(s) && s.mz && s.mz.sb)
    for (const o of s.mz.zb) if (!o.d) out.push(["n:" + o.i, o, "mz"]);
  if (s.hang && s.hang.sbz)
    for (const o of s.hang.sbz.zb) if (!o.d) out.push(["n:c" + o.i, o, "sbz"]);
  return out;
}
/* put changed NPCs back: ch = Map(old object → new one) */
function npcPut(s, ch, H0) {
  if (!ch.size) return;
  const l4 = new Map();
  for (const [o, q] of ch) if (L4.has(o)) l4.set(o.i, { hp: q.hp, l: q.l });
  if (l4.size) H0.l4set(s, l4);
  if (s.mz && s.mz.sb)
    s.mz = { ...s.mz, zb: s.mz.zb.map((o) => ch.get(o) || o) };
  if (s.hang && s.hang.sbz)
    s.hang = {
      ...s.hang,
      sbz: { ...s.hang.sbz, zb: s.hang.sbz.zb.map((o) => ch.get(o) || o) },
    };
}
const npcMost = (o) => (o.l && o.l[0]) || o.hp;
const tenths = (n) => Math.round(n * 10) / 10;
/* an NPC's HP and most HP set (most kept in l[0], as both engines keep it) */
const npcHp = (o, hp, mx = npcMost(o)) => ({
  ...o,
  hp: tenths(Math.max(0, Math.min(mx, hp))),
  l: o.l ? [mx, ...o.l.slice(1)] : [mx],
});
/* thing k joins group gid now: its Max HP and its heal on joining */
function join(s, k, gid, now, H0, npcs, ch) {
  const g = grOf(s)[gid],
    gm = (s.sb && s.sb.gm) || {};
  if (!g || (gm[k] || []).includes(gid)) return false;
  const duck = k.startsWith("p:"),
    id = k.slice(2),
    hit = duck ? null : npcs.get(k);
  if (duck ? !s.players[id] || !s.pos[id] : !hit) return false;
  const o = hit && (ch.get(hit[1]) || hit[1]);
  if (!mayJoin(s, g, k, o)) return false;
  if (g.one && Object.values(gm).some((gs) => gs.includes(gid))) return false; // (one at a time: the next waits for a way in)
  s.sb = { ...s.sb, gm: { ...gm, [k]: [...(gm[k] || []), gid] } };
  const heal = String(g.heal || "").trim(),
    pct = /%$/.test(heal) ? +heal.slice(0, -1) : 0;
  if (duck) {
    if (!heal) return true;
    const max =
        baseMode(s.options) === "l4dd" ? H0.l4max(s, id) : grHp(s, id, DUCK_HP),
      amt = pct ? (pct >= 100 ? 1e4 : (max * pct) / 100) : val(g, "heal");
    if (!(amt > 0)) return true;
    if (baseMode(s.options) === "l4dd") H0.l4heal(s, id, amt);
    else H0.heal(s, id, amt, now);
    return true;
  }
  if ((o.gh || []).includes(gid)) return true; // (its HP from this group came once already: never twice)
  let q = { ...o, gh: [...(o.gh || []), gid] };
  const was = npcMost(q),
    mx = hpFrom(g, was);
  if (mx !== was) q = npcHp(q, q.hp + (mx - was), mx); // (more most HP: as much more HP now)
  if (heal) {
    const amt = pct ? (npcMost(q) * pct) / 100 : val(g, "heal");
    if (amt > 0) q = npcHp(q, q.hp + amt);
  }
  ch.set(hit[1], q);
  return true;
}
/* is (x, y) on floor z (shares of the map; z: world px) in zone p */
function inZone(s, p, x, y, z) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H);
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  if (!sbInBlock(s, p, x, y, W, H)) return false;
  return sbOnBoard(s) || Math.abs((+z || 0) - (p.z || 0)) < FLOOR;
}
/* the zones some group takes its members from: [zone id, its point, [group ids]] */
function zoneJoins(s) {
  const gr = grOf(s),
    out = [];
  for (const [id, p] of Object.entries((s.sb && s.sb.pts) || {})) {
    if (p.k !== "zone") continue;
    const tags = [`zone:${p.col}`, `name:${nameWord(p)}`],
      own = words(boxText(p, "jg")),
      gs = Object.keys(gr).filter(
        (g) => own.includes(g) || words(gr[g].c).some((c) => tags.includes(c)),
      );
    if (gs.length) out.push([id, p, gs]);
  }
  return out;
}

/* ---------- the host's heartbeat: joins, zones, the dead out, regen once a second. H0: rules.js SB_H (ducks, heal, and
   the zombie maps' l4heal and l4max) ---------- */
export function sbGroupTick(s, now, H0) {
  if (!isSb(s) || !s.sb) return false;
  const gr = grOf(s),
    any = Object.keys(gr).length;
  let changed = false,
    list = null;
  const npcs = () =>
      list || (list = new Map(npcList(s, H0).map((x) => [x[0], x]))), // (only when wanted: up to 800 of them)
    ch = new Map();
  /* the joins waiting, and whoever stands in a zone a group takes from */
  const gj = s.sb.gj || [];
  if (gj.length) {
    s.sb = { ...s.sb, gj: [] };
    changed = true;
    for (const [k, g] of gj) join(s, k, g, now, H0, npcs(), ch);
  }
  const zs = any ? zoneJoins(s) : [];
  if (zs.length) {
    const zmaps = baseMode(s.options) === "l4dd",
      things = [
        ...H0.ducks(s).map((id) => ["p:" + id, s.pos[id]]),
        ...[...npcs().values()].map(([k, o, e]) =>
          e === "mz"
            ? [k, { x: o.x, y: o.y, z: 0 }]
            : [k, { x: o.x / W, y: o.y / H, z: o.z || heightAt(o.x, o.y) }],
        ),
      ];
    const inside = []; // ([thing, group]) in the zones, this moment
    for (const [, p, gs] of zs)
      for (const [k, at] of things) {
        if (!at || !inZone(s, p, at.x, at.y, zmaps || !sbOnBoard(s) ? at.z : 0))
          continue;
        for (const g of gs) inside.push([k, g]);
      }
    /* "Leaves when it steps out": out of it once it stands in none of its zones (first, so one who walks out of a
       one-member group lets the next in at once) */
    const lv = new Set(
      zs.flatMap(([, , gs]) => gs).filter((g) => gr[g] && gr[g].lv),
    );
    if (lv.size) {
      const gm = s.sb.gm || {},
        held = new Set(inside.map(([k, g]) => k + " " + g)),
        next = {};
      let out = false;
      for (const [k, gs] of Object.entries(gm)) {
        const ok = gs.filter((g) => !lv.has(g) || held.has(k + " " + g));
        if (ok.length !== gs.length) out = true;
        if (ok.length) next[k] = ok;
      }
      if (out) {
        s.sb = { ...s.sb, gm: next };
        changed = true;
      }
    }
    for (const [k, g] of inside)
      changed = join(s, k, g, now, H0, npcs(), ch) || changed;
  }
  /* once a second: the gone out of their groups, and regen (a group's, and a Seriat file's ((regen n)) on an NPC) */
  const hid = s.hidden || {};
  if (!hid.sbgt || now >= hid.sbgt) {
    s.hidden = { ...hid, sbgt: now + 1000 };
    const gm = (s.sb && s.sb.gm) || {},
      live = new Set(npcs().keys()),
      keep = {};
    let gone = false;
    for (const [k, gs] of Object.entries(gm)) {
      const ok = (k.startsWith("p:") ? !!s.players[k.slice(2)] : live.has(k))
        ? gs.filter((g) => gr[g])
        : [];
      if (ok.length) keep[k] = ok;
      if (ok.length !== gs.length) gone = true;
    }
    if (gone) {
      s.sb = { ...s.sb, gm: keep };
      changed = true;
    }
    const regen = (k) =>
      mine(s, k).reduce((n, g) => {
        const v = val(g, "rhp");
        return Number.isFinite(v) ? n + v : n;
      }, 0);
    for (const k of Object.keys(keep)) {
      if (!k.startsWith("p:")) continue;
      const amt = regen(k),
        id = k.slice(2);
      if (!(amt > 0) || !s.pos[id] || (s.players[id] || {}).dead) continue;
      const was = baseMode(s.options) === "l4dd" ? s.hang && s.hang.l4p : s.php;
      if (baseMode(s.options) === "l4dd") H0.l4heal(s, id, amt);
      else H0.heal(s, id, amt, now);
      if (
        (baseMode(s.options) === "l4dd" ? s.hang && s.hang.l4p : s.php) !== was
      )
        changed = true;
    }
    for (const [k, [, o0]] of npcs()) {
      const o = ch.get(o0) || o0,
        amt = regen(k) + (+o.rg || 0);
      if (amt > 0 && o.hp < npcMost(o)) ch.set(o0, npcHp(o, o.hp + amt));
    }
  }
  if (ch.size) {
    npcPut(s, ch, H0);
    changed = true;
  }
  return changed;
}

/* ---------- the actions: { t: "sbgr", k, g, f, v } ----------
   new (a group, named v), set (setting f of group g to v), right (window f of group g: 1 on, 0 off, null neutral),
   del (group g), hide (v: the made NPCs and groups I don't want in my lists, mine only: s.sbgh by my name) */
export function sbGroupAct(s, a) {
  if (!isSb(s) || !s.players[a.id]) return false;
  if (a.k === "hide") {
    const name = String(s.players[a.id].name || "")
      .trim()
      .toLowerCase();
    const v = Array.isArray(a.v)
      ? a.v.filter(
          (w) => typeof w === "string" && /^[gc]:[a-z0-9]{1,24}$/.test(w),
        )
      : [];
    if (!name) return false;
    s.sbgh = { ...(s.sbgh || {}), [name]: v.slice(0, 100) };
    return true;
  }
  if (!sbMay(s, a.id, "b")) return false;
  const gr = { ...((s.sb && s.sb.gr) || {}) };
  if (a.k === "new") {
    if (Object.keys(gr).length >= GR_MOST) return false;
    const n = ((s.sb && s.sb.gn) || 0) + 1,
      name = String(a.v || "").trim() || `Group ${n}`;
    if (grWhy("n", name)) return false;
    gr["g" + n] = { n: name, who: "everything", by: a.id }; // (its maker: P's rights over it are theirs, sbep.js)
    s.sb = { ...s.sb, gr, gn: n };
    return true;
  }
  const g = gr[a.g];
  if (!g) return false;
  if (!epMay(s, g.by, a.id, "m")) return false; // (another player's group: only if they let me change it)
  if (a.k === "del") {
    delete gr[a.g];
    s.sb = { ...s.sb, gr };
    return true;
  }
  if (a.k === "right") {
    if (!SB_RIGHTS.some(([k]) => k === a.f)) return false;
    const r = { ...(g.r || {}) };
    if (a.v === 1 || a.v === 0) r[a.f] = a.v;
    else delete r[a.f];
    gr[a.g] = { ...g, r };
    s.sb = { ...s.sb, gr };
    return true;
  }
  if (a.k === "set") {
    const f = String(a.f || ""),
      v = typeof a.v === "string" ? a.v.trim() : "";
    if (grWhy(f, v)) return false;
    gr[a.g] = {
      ...g,
      [f]: f === "c" || f === "who" || GR_LISTS[f] ? words(v).join(", ") : v,
    };
    s.sb = { ...s.sb, gr };
    return true;
  }
  return false;
}
/* the made NPCs and groups I keep out of my lists (P: "players can deselect what custom-made entities or custom-made
   groups are available for selection within the build mode and otherwise within that sandbox session for themselves") */
export function grHidden(s, me) {
  const name = String(((s && s.players[me]) || {}).name || "")
    .trim()
    .toLowerCase();
  return ((s && s.sbgh) || {})[name] || [];
}
