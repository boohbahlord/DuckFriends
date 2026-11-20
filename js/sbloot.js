/* ---------- Sandbox: loot orbs (stage 4b), the rules ----------
   The owner's Sandbox file, "Loot Spawns" (sandboxrules.js SB_LOOT has the words): an orb lies on its loot point, holding
   one of the things picked for it (more than one picked: one of them at random each time). The first comes at once; a
   duck that walks over it takes it, and if "Comes back" is on, the next comes "Seconds before it comes back" later.
   - On the board and Duck Cabin, what's taken goes on the duck's hotbar (sbhot.js sbSlots: s.sb.hb.got), for good or
     for "Seconds you keep it".
   - On Dead Ducks Arcade's maps a weapon goes into the duck's slots, as one bought does (l4ddrules.js l4Loot), and a
     zombie drop lies there as the zombies' own do, taken and worn as theirs are (s.hang.l4dr); a flashlight lights the
     duck's way from then on (s.sb.fl, sandboxrules.js SB_GEAR); only those three kinds can be picked there.
   - "Damage to whoever takes it" hurts the duck that takes it (a claw's hurt).
   - A zone whose "Loot spawns here" names the orb's point (its color or its name) has the orb lie there instead, at a
     spot in it at random each time (stage 5, sbzone.js): p.orb.x, y, z.
   The orb is on its point: p.orb = { w, at, dn: a zombie drop's number }, p.gone = when it was last taken. An uploaded
   picture for an orb is sent in parts as a made NPC's is (sbmake.js sendParts) and kept in s.sbpic, made into pixels (plan
   Phase 3); s.sbImg = { loot point: its key there } */
import {
  isSb,
  sbMay,
  sbOnBoard,
  baseMode,
  SB_LOOT,
  SB_DROPS,
  SB_GEAR,
  sbSpread,
  sbCallZone,
  sbInv,
  sbTabLive,
  sbUsed,
} from "./sandboxrules.js";
import { valueOf } from "./numerat.js";
import { boxText, spawnsHere, zoneSpot, zonesFor } from "./sbspawn.js";
import { W, H } from "./hangout/layout.js";
import { ARMS, DROP, l4Loot, l4Hurt } from "./l4ddrules.js";

const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
const num = (p, f) => valueOf({ ok: boxText(p, f) }, SB_LOOT[f]);
const zmaps = (s) => baseMode(s.options) === "l4dd";
/* can w be in an orb on this map */
export const lootOk = (s, w) =>
  zmaps(s)
    ? Object.hasOwn(SB_DROPS, w) ||
      Object.hasOwn(ARMS, w) ||
      Object.hasOwn(SB_GEAR, w)
    : !Object.hasOwn(SB_DROPS, w) && /^[a-z0-9]+$/.test(w);
/* what orb p may hold here */
export const lootList = (s, p) =>
  words(boxText(p, "loot")).filter((w) => lootOk(s, w));

/* ---------- the actions: { t: "sbl", k: "img", p, v } (an orb's own picture: its key in s.sbpic, or "" for none) ---------- */
export function sbLootAct(s, a) {
  if (!isSb(s) || !sbMay(s, a.id, "b") || a.k !== "img") return false;
  const p = ((s.sb && s.sb.pts) || {})[a.p],
    v = typeof a.v === "string" ? a.v : "";
  if (!p || p.k !== "loot") return false;
  if (v && !(/^[a-z0-9]{1,24}$/.test(v) && (s.sbpic || {})[v])) return false;
  const img = { ...(s.sbImg || {}) };
  if (v) img[a.p] = v;
  else delete img[a.p];
  s.sbImg = img;
  return true;
}

/* ---------- the host's heartbeat: orbs come, are taken, come back; what was kept for a time wears off ----------
   H0: what the rules lend (rules.js SB_H): ducks(s), claw(s, id, dmg, now). True when anything changed */
export function sbLootTick(s, now, H0) {
  if (!spawnsHere(s) || !s.sb) return false;
  const pts = { ...(s.sb.pts || {}) },
    drops = (s.hang && s.hang.l4dr) || [];
  let ch = false;
  for (const [id, p] of Object.entries(pts)) {
    if (p.k !== "loot") continue;
    let q = p;
    if (!sbTabLive(pts, id)) {
      // (a Loot tab whose Caller names no zone: nothing comes, and an orb lying there goes)
      if (q.orb && q.orb.dn == null) pts[id] = { ...q, orb: null };
      if (pts[id] !== p) ch = true;
      continue;
    }
    if (q.orb && q.orb.dn != null && !drops.some((d) => d.n === q.orb.dn))
      q = { ...q, orb: null, gone: now }; // (a zombie drop: taken, or faded away, as theirs do)
    if (q.orb && q.orb.dn == null) {
      const by = takerOf(s, q, H0);
      if (by) {
        take(s, q, by, now, H0);
        q = { ...q, orb: null, gone: now };
      }
    }
    if (!q.orb && due(q, now)) {
      const all = lootList(s, q),
        w = all[Math.floor(Math.random() * all.length)];
      if (w) q = { ...q, orb: lay(s, q, w, now, sbCallZone(pts, id)) };
    }
    if (q !== p) {
      pts[id] = q;
      ch = true;
    }
  }
  if (ch) s.sb = { ...s.sb, pts };
  return wearOff(s, now) || tidy(s) || ch;
}
/* a new orb: the first at once; after one is taken, only with "Comes back", its time later */
function due(q, now) {
  if (q.gone == null) return true;
  const back = num(q, "back") === true,
    t = num(q, "again");
  return back && now - q.gone >= (Number.isFinite(t) ? t : 10) * 1000;
}
function lay(s, q, w, now, zid = null) {
  const zs = zonesFor(s, "lt", q), // (a zone that names it: the orb lies in it, anywhere: sbzone.js)
    at = zid
      ? zoneSpot(s, s.sb.pts[zid], sbInv(q)) // (a Loot tab: where the zone it answers to says; Inverse: outside it)
      : zs.length
        ? zoneSpot(s, zs[Math.floor(Math.random() * zs.length)])
        : sbSpread(q)
          ? zoneSpot(s, q) // (anywhere in its own shape, when it's bigger than its spot)
          : null,
    p = at || q,
    where = at ? { x: at.x, y: at.y, z: at.z } : {};
  if (zid) sbUsed(s, zid);
  if (!Object.hasOwn(SB_DROPS, w)) return { w, at: now, ...where };
  const n = now + Math.random(); // (its own number among the zombies' drops)
  s.hang.l4dr = [
    ...((s.hang && s.hang.l4dr) || []),
    {
      n,
      k: SB_DROPS[w][0],
      x: Math.round(p.x * W),
      y: Math.round(p.y * H),
      until: now + DROP.LIFE,
    },
  ];
  return { w, at: now, dn: n, ...where };
}
/* the duck that walks over orb q (on the board within a duck's length, on a world within the zombies' drops' reach,
   on its floor), or null */
function takerOf(s, q0, H0) {
  const board = sbOnBoard(s),
    q = q0.orb && q0.orb.x != null ? q0.orb : q0; // (an orb lying in a zone)
  for (const id of H0.ducks(s)) {
    const me = s.pos[id];
    if (!me) continue;
    const d = board
      ? Math.hypot((q.x - me.x) / 0.03, (q.y - me.y) / 0.08)
      : Math.abs((+me.z || 0) - (q.z || 0)) < 40
        ? Math.hypot((q.x - me.x) * W, (q.y - me.y) * H) / DROP.REACH
        : 9;
    if (d < 1) return id;
  }
  return null;
}
/* duck by takes orb q */
function take(s, q, by, now, H0) {
  const w = q.orb.w,
    keep = num(q, "keep"),
    hurt = num(q, "hurt");
  if (zmaps(s) && w === "flashlight")
    s.sb = { ...s.sb, fl: { ...(s.sb.fl || {}), [by]: 1 } }; // (a flashlight: kept for good)
  else if (zmaps(s)) l4Loot(s, by, w, num(q, "inf") === true);
  else {
    const hb = (s.sb && s.sb.hb) || {},
      mine = ((hb.got || {})[by] || []).filter(([v]) => v !== w);
    mine.push([w, keep > 0 ? now + keep * 1000 : 0]);
    s.sb = {
      ...s.sb,
      hb: { ...hb, got: { ...(hb.got || {}), [by]: mine.slice(-10) } },
    };
  }
  if (hurt > 0) {
    if (zmaps(s)) l4Hurt(s, by, hurt, now);
    else H0.claw(s, by, hurt, now);
  }
}
/* what was kept for a time and whose time is up */
function wearOff(s, now) {
  const got = (s.sb && s.sb.hb && s.sb.hb.got) || {};
  if (!Object.values(got).some((l) => l.some(([, u]) => u && u <= now)))
    return false;
  const next = {};
  for (const [id, l] of Object.entries(got))
    next[id] = l.filter(([, u]) => !u || u > now);
  s.sb = { ...s.sb, hb: { ...s.sb.hb, got: next } };
  return true;
}
/* a picture whose orb was taken away goes too */
function tidy(s) {
  const img = s.sbImg || {},
    pts = (s.sb && s.sb.pts) || {},
    gone = Object.keys(img).filter((id) => !pts[id]);
  if (!gone.length) return false;
  const next = { ...img };
  for (const id of gone) delete next[id];
  s.sbImg = next;
  return true;
}
