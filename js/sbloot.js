/* ---------- Sandbox: loot orbs (stage 4b), the rules ----------
   The owner's Sandbox file, "Loot Spawns" (sandboxrules.js SB_LOOT has the words): an orb lies on its loot point, holding
   one of the things picked for it (more than one picked: one of them at random each time). The first comes at once; a
   duck that walks over it takes it, and with "Auto spawn" on (once "Comes back"), the next comes "Seconds before a new one comes" later.
   - On the board and Duck Cabin, what's taken goes on the duck's hotbar (sbhot.js sbSlots: s.sb.hb.got), for good or
     for "Seconds you keep it".
   - On Dead Ducks Arcade's maps a weapon goes into the duck's slots, as one bought does (l4ddrules.js l4Loot), and a
     zombie drop lies there as the zombies' own do, taken and worn as theirs are (s.hang.l4dr); a flashlight lights the
     duck's way from then on (s.sb.fl, sandboxrules.js SB_GEAR); only those three kinds can be picked there.
   - "Damage to whoever takes it" hurts the duck that takes it (a claw's hurt).
   - A zone whose "Loot spawns here" names the orb's point (its color or its name) has the orb lie there instead, at a
     spot in it at random each time (stage 5, sbzone.js): p.orb.x, y, z.
   The orb is on its point: p.orb = { w, at, dn: a zombie drop's number }, and p.orbs the others (below). An uploaded
   picture for an orb is sent in parts as a made NPC's is (sbmake.js sendParts) and kept in s.sbpic, made into pixels (plan
   Phase 3); s.sbImg = { loot point: its key there } */
import {
  isSb,
  sbMay,
  sbOnBoard,
  boardDuck,
  baseMode,
  SB_DROPS,
  SB_GEAR,
  sbSpread,
  sbCallZone,
  sbInv,
  sbTabLive,
  sbUsed,
  sbRule,
  sbInBlock,
  sbWhoTakes,
} from "./sandboxrules.js";
import { valueOf } from "./numerat.js";
import {
  boxOf,
  boxText,
  spawnsHere,
  zoneSpot,
  zonesFor,
  liveNpcs,
} from "./sbspawn.js";
import { W, H } from "./hangout/layout.js";
import { ARMS, DROP, l4Loot, l4Hurt } from "./l4ddrules.js";
import { grFrom, grIn } from "./sbgroups.js";

const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
const num = (p, f) => valueOf({ ok: boxText(p, f) }, boxOf(f)); // (its own boxes, and the spawn's it borrows: limit, every, cont)
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
  const pts = s.sb.pts;
  if (p.lock || (p.grp && pts[p.grp] && pts[p.grp].lock)) return false; // (locked: sbspawn.js "lock")
  if (v && !(/^[a-z0-9]{1,24}$/.test(v) && (s.sbpic || {})[v])) return false;
  const img = { ...(s.sbImg || {}) };
  if (v) img[a.p] = v;
  else delete img[a.p];
  s.sbImg = img;
  return true;
}

/* ---------- the host's heartbeat: orbs come, are taken, come back; what was kept for a time wears off ----------
   Plan, Loot 1 (Spawning): a block starts (Starts: when the game starts, when a player steps into its zone, when
   something spawns in its zone) with one orb at once; then Auto spawn lays a new one "Seconds before a new one comes"
   after each one taken, and Continuous spawn one every "Seconds between spawns", taken or not, while fewer than its Spawn
   limit lie on the map (0: none). Its Loot limit (and G's for the whole map) counts every orb it lays in the game. Who
   can take it is a list as a wall's (sbWhoTakes, groups too); with "Every player gets their own", each of them takes
   their own copy (orb.got: who has it; it's hidden on their screen), and it goes once all of them have.
   The orbs: p.orb (the first, as before) and p.orbs (the others). Their timers and counts are s.sb.lr = { block: { on,
   c: the next continuous one, rb: [when the auto spawn's come], n: how many it laid } }, this game's only (sbsave.js).
   H0: what the rules lend (rules.js SB_H): ducks(s), claw(s, id, dmg, now). True when anything changed */
export const orbsOf = (p) => [p.orb, ...((p && p.orbs) || [])].filter(Boolean);
function withOrbs(q, list) {
  const r = { ...q, orb: list[0] || null };
  if (list.length > 1) r.orbs = list.slice(1);
  else delete r.orbs;
  delete r.gone; // (the old one-orb clock: s.sb.lr now)
  return r;
}
/* the most of block q's orbs lying at once (0: none, still never past 100) */
function spawnMost(q) {
  const n = num(q, "limit");
  return n === 0 ? 100 : Math.max(1, Number.isFinite(n) ? n : 1);
}
const gap = (q) => 1000 * Math.max(0.1, num(q, "every") || 4); // (Seconds between spawns, as a spawn's)
/* has block id (point q) started laying orbs: when the game starts, or the event its Starts names, in its zone (the one
   its tab answers to, or its own shape) */
function startsNow(s, pts, id, q, H0) {
  const when = boxText(q, "lst").trim();
  if (when !== "enter" && when !== "spawn") return true;
  const zid = sbCallZone(pts, id),
    z = zid ? pts[zid] : q;
  if (when === "enter")
    return H0.ducks(s).some((d) => {
      const me = s.pos[d];
      return !!me && sbInBlock(s, z, me.x, me.y, W, H);
    });
  /* something spawned: a Spawn tab that answers to the same zone (or of the same block) made one */
  const live = (s.sb && s.sb.live) || {};
  return Object.entries(pts).some(
    ([sid, P]) =>
      P.k === "spawn" &&
      (live[sid] || []).length > 0 &&
      (zid
        ? sbCallZone(pts, sid) === zid
        : sid === q.grp || (!!q.grp && P.grp === q.grp)),
  );
}
export function sbLootTick(s, now, H0) {
  if (!spawnsHere(s) || !s.sb) return false;
  const pts = { ...(s.sb.pts || {}) },
    drops = (s.hang && s.hang.l4dr) || [],
    lr0 = s.sb.lr || {},
    lr = { ...lr0 },
    most = sbRule(s, "lootmax");
  let ch = false,
    laid = Object.values(lr).reduce((a, r) => a + (r.n || 0), 0);
  for (const [id, p] of Object.entries(pts)) {
    if (p.k !== "loot") continue;
    const q = p;
    if (!sbTabLive(pts, id)) {
      // (a Loot tab whose Caller names no zone: nothing comes, and the orbs lying there go)
      const all = orbsOf(q),
        keep = all.filter((o) => o.dn != null);
      if (keep.length !== all.length || q.gone != null) {
        pts[id] = withOrbs(q, keep);
        ch = true;
      }
      continue;
    }
    let r = lr[id] ? { ...lr[id], rb: [...(lr[id].rb || [])] } : null,
      list = orbsOf(q);
    const was = list.length,
      t = num(q, "again"),
      again = 1000 * (Number.isFinite(t) ? t : 10),
      auto = num(q, "back") === true,
      gone = () => {
        if (r && auto) r.rb.push(now + again);
      };
    /* a zombie drop: taken, or faded away, as theirs do */
    list = list.filter((o) => {
      if (o.dn == null || drops.some((d) => d.n === o.dn)) return true;
      gone();
      return false;
    });
    /* taken: by the first that may take it, or by each player once (their own) */
    const own = num(q, "lown") === true,
      who = words(boxText(q, "ltake"));
    let moved = list.length !== was;
    list = list.flatMap((o) => {
      if (o.dn != null) return [o];
      const by = takersOf(s, q, o, who, H0).filter(
        (b) => !(o.got || []).includes(b),
      );
      if (!by.length) return [o];
      moved = true;
      if (!own) {
        takeBy(s, id, q, o, by[0], now, H0);
        gone();
        return [];
      }
      const got = [...(o.got || [])];
      for (const b of by) {
        takeBy(s, id, q, o, b, now, H0);
        got.push(b);
      }
      const all = H0.ducks(s).filter((d) => mayTake(s, who, d));
      if (all.length && all.every((d) => got.includes(d))) {
        gone();
        return [];
      }
      return [{ ...o, got }];
    });
    /* starting, and laying new ones */
    const lay1 = () => {
      const o = layOne(s, pts, id, q, now);
      if (!o) return false;
      list.push(o);
      r.n++;
      laid++;
      moved = true;
      return true;
    };
    if (!r && startsNow(s, pts, id, q, H0)) {
      r = { on: 1, n: 0, rb: [], c: now + gap(q) };
      if (list.length < spawnMost(q) && lootMay(q, r, most, laid)) lay1();
    }
    if (r) {
      const due = r.rb.filter((x) => x <= now);
      if (due.length) r.rb = r.rb.filter((x) => x > now);
      let want = due.length;
      if (num(q, "cont") === true && now >= r.c) {
        r.c = now + gap(q);
        want++;
      }
      for (
        ;
        want > 0 && list.length < spawnMost(q) && lootMay(q, r, most, laid);
        want--
      )
        if (!lay1()) break;
      if (JSON.stringify(r) !== JSON.stringify(lr0[id])) {
        lr[id] = r;
        ch = true;
      }
    }
    if (moved || q.gone != null) {
      pts[id] = withOrbs(q, list);
      ch = true;
    }
  }
  for (const id of Object.keys(lr))
    if (!pts[id] || pts[id].k !== "loot") {
      delete lr[id];
      ch = true;
    }
  if (ch) s.sb = { ...s.sb, pts, lr };
  return wearOff(s, now) || tidy(s) || ch;
}
/* may block q lay one more: its own Loot limit, and G's for the whole map (0: none) */
function lootMay(q, r, most, laid) {
  const n = num(q, "llim");
  if (n > 0 && r.n >= n) return false;
  return !(most > 0 && laid >= most);
}
/* one new orb from block id, or null (nothing picked) */
function layOne(s, pts, id, q, now) {
  const all = lootList(s, q),
    w = all[Math.floor(Math.random() * all.length)];
  return w ? lay(s, q, w, now, sbCallZone(pts, id)) : null;
}
/* may duck d take what list `who` names (Players, a player's name, a group: sbWhoTakes, sbgroups.js) */
const mayTake = (s, who, d) =>
  sbWhoTakes(s, who, { duck: (s.players[d] || {}).name || "" }) ||
  grIn(s, who, "p:" + d);
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
/* who walks over orb o of block q0 now and may take it: the ducks (on the board within a duck's length, on a world
   within the zombies' drops' reach, on its floor), else the NPCs its list names ("n:" and their number) */
function takersOf(s, q0, o, who, H0) {
  const board = sbOnBoard(s),
    U = boardDuck(s),
    q = o.x != null ? o : q0, // (an orb lying in a zone)
    near = (x, y, z) =>
      (board
        ? Math.hypot((q.x - x) / U[0], (q.y - y) / U[1])
        : z === null || Math.abs((+z || 0) - (q.z || 0)) < 40
          ? Math.hypot((q.x - x) * W, (q.y - y) * H) / DROP.REACH
          : 9) < 1,
    out = [];
  for (const id of H0.ducks(s)) {
    const me = s.pos[id];
    if (me && near(me.x, me.y, me.z) && mayTake(s, who, id)) out.push(id);
  }
  if (out.length || !who.some((w) => w !== "players")) return out;
  for (const n of liveNpcs(s))
    if (
      near(n.x, n.y, null) &&
      (sbWhoTakes(s, who, { k: n.k, sp: n.sp }) || grIn(s, who, "n:" + n.i))
    )
      out.push("n:" + n.i);
  return out;
}
/* t takes orb o of block id: a duck gets what it holds; an NPC only takes it away */
function takeBy(s, id, q, o, t, now, H0) {
  if (String(t).startsWith("n:")) return;
  take(s, q, o.w, t, now, H0);
  grFrom(s, "p:" + t, id, o.w); // (a group whose condition is this loot, or what it held: sbgroups.js)
}
/* duck by takes w from block q */
function take(s, q, w, by, now, H0) {
  const keep = num(q, "keep"),
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
