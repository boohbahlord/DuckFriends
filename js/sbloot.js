/* ---------- Sandbox: loot orbs (stage 4b), the rules ----------
   The owner's Sandbox file, "Loot Spawns" (sandboxrules.js SB_LOOT has the words): an orb lies on its loot point, holding
   one of the things picked for it (more than one picked: one of them at random each time). The first comes at once; a
   duck takes it with E, standing on it (the owner's, Nov 21 18:27Z: "You only pick them up by clicking E / Same for any
   loot on the ground now"; an NPC its list names still takes it by walking over it), and with "Auto spawn" on (once
   "Comes back"), the next comes "Seconds before a new one comes" later.
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
  sbPct,
  sbItemMods,
  sbModsOver,
} from "./sandboxrules.js";
import { valueOf } from "./seriatbox.js";
import {
  boxOf,
  boxText,
  spawnsHere,
  zoneSpot,
  zonesFor,
  liveNpcs,
} from "./sbspawn.js";
import { W, H } from "./hangout/layout.js";
import { DROP, l4Loot, l4Hurt, l4Ammo, fullAmmo } from "./l4ddrules.js";
import { ARMS } from "./guns.js";
import { grFrom, grIn } from "./sbgroups.js";

const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
const num = (p, f) => valueOf({ ok: boxText(p, f) }, boxOf(f)); // (its own boxes, and the spawn's it borrows: limit, every, cont)
const zmaps = (s) => baseMode(s.options) === "l4dd";
/* a gun's ammo as loot (plan Loot 2, "Ammo and magazines"): its word is the gun's and "ammo" ("akammo"); the gun, or
   null. Only the guns that keep ammo (never the specials, never Max Ammo, a zombie drop) */
export const ammoOf = (w) => {
  const g = /^[a-z0-9]+ammo$/.test(w) ? w.slice(0, -4) : "";
  return g && Object.hasOwn(ARMS, g) && ARMS[g].kind === "ranged" && fullAmmo(g)
    ? g
    : null;
};
/* can w be in an orb on this map */
export const lootOk = (s, w) =>
  zmaps(s)
    ? Object.hasOwn(SB_DROPS, w) ||
      Object.hasOwn(ARMS, w) ||
      Object.hasOwn(SB_GEAR, w) ||
      !!ammoOf(w)
    : !Object.hasOwn(SB_DROPS, w) && /^[a-z0-9]+$/.test(w);
/* what orb p may hold here */
export const lootList = (s, p) =>
  words(boxText(p, "loot")).filter((w) => lootOk(s, w));

/* ---------- the actions: { t: "sbl", k: "img", p, v } (an orb's own picture: its key in s.sbpic, or "" for none) ---------- */
export function sbLootAct(s, a, now) {
  if (isSb(s) && a.do === "take" && sbOrbFor(s, a.id)) {
    s.sb = { ...s.sb, lk: { ...(s.sb.lk || {}), [a.id]: now } }; // (E pressed on an orb: the next heartbeat gives it, sbLootTick)
    return true;
  }
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
   c: the next continuous one, rb: [when the auto spawn's come], n: how many it laid, f: its first still to come } }, this game's only (sbsave.js).
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
const gap = (q) => {
  const v = num(q, "every");
  return 1000 * Math.max(0, Number.isFinite(v) ? v : 4);
}; // (Seconds between spawns, as a spawn's; 0: no wait)
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
      const by = takersOf(s, q, o, who, H0, now).filter(
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
    if (!r && startsNow(s, pts, id, q, H0))
      r = { on: 1, n: 0, rb: [], c: now + gap(q), f: 1 }; // (f: its first is still to come, once something is picked)
    if (r) {
      const due = r.rb.filter((x) => x <= now);
      if (due.length) r.rb = r.rb.filter((x) => x > now);
      let want = due.length;
      if (r.f) {
        if (list.length >= spawnMost(q) || !lootMay(q, r, most, laid))
          delete r.f; // (one lying already, as from a save: that's its first)
        else if (lay1()) delete r.f;
      }
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
  const gone = pressGone(s, now);
  return wearOff(s, now) || tidy(s) || gone || ch;
}
/* the E presses that took nothing in time go (sbLootAct) */
function pressGone(s, now) {
  const lk = s.sb.lk;
  if (!lk || Object.values(lk).every((t) => now - t < PRESS_MS)) return false;
  const left = Object.entries(lk).filter(([, t]) => now - t < PRESS_MS);
  const sb = { ...s.sb, lk: Object.fromEntries(left) };
  if (!left.length) delete sb.lk;
  s.sb = sb;
  return true;
}
/* may block q lay one more: its own Loot limit, and G's for the whole map (0: none) */
function lootMay(q, r, most, laid) {
  const n = num(q, "llim");
  if (n > 0 && r.n >= n) return false;
  return !(most > 0 && laid >= most);
}
/* one new orb from block id, or null (nothing picked): one of what it holds at random, or all of them at once (the
   zombies' drops among them fall beside it, as theirs do) */
function layOne(s, pts, id, q, now) {
  const all = [...new Set(lootList(s, q))];
  if (!all.length) return null;
  if (num(q, "lall") !== true || all.length < 2)
    return lay(
      s,
      q,
      all[Math.floor(Math.random() * all.length)],
      now,
      sbCallZone(pts, id),
    );
  const rest = all.filter((w) => !Object.hasOwn(SB_DROPS, w)),
    drops = all.filter((w) => Object.hasOwn(SB_DROPS, w)),
    o = lay(s, q, rest[0] || drops.shift(), now, sbCallZone(pts, id));
  if (rest.length > 1) o.ws = rest;
  const at = o.x != null ? o : q;
  for (const w of drops) dropAt(s, w, at, now);
  return o;
}
/* zombie drop w lying at p (shares of the map), as the zombies' own: its number */
function dropAt(s, w, p, now) {
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
  return n;
}
/* may duck d take what list `who` names (Players, a player's name, a group: sbWhoTakes, sbgroups.js) */
const mayTake = (s, who, d) => {
  const P = s.players[d] || {};
  /* Justin walks the zombie maps as a duck, but he isn't a player: "Players" leaves him out (a made zombie game's AK went
     to him); Everything or his name still lets him */
  if (P.helper)
    return sbWhoTakes(
      s,
      who.filter((w) => w !== "players"),
      { duck: P.name || "" },
    );
  return sbWhoTakes(s, who, { duck: P.name || "" }) || grIn(s, who, "p:" + d);
};
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
  return { w, at: now, dn: dropAt(s, w, p, now), ...where };
}
/* who walks over orb o of block q0 now and may take it: the ducks (on the board within a duck's length, on a world
   within the zombies' drops' reach, on its floor), else the NPCs its list names ("n:" and their number) */
function takersOf(s, q0, o, who, H0, now) {
  const near = orbNear(s, q0, o),
    out = [],
    lk = (s.sb && s.sb.lk) || {};
  for (const id of H0.ducks(s)) {
    const me = s.pos[id];
    if (
      now - (lk[id] ?? -Infinity) < PRESS_MS &&
      me &&
      near(me.x, me.y, me.z) &&
      mayTake(s, who, id)
    )
      out.push(id);
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
/* is (x, y, z) on orb o of block q0 (on the board within a duck's length, on a world within the zombies' drops' reach,
   on its floor) */
function orbNear(s, q0, o) {
  const board = sbOnBoard(s),
    U = boardDuck(s),
    q = o.x != null ? o : q0; // (an orb lying in a zone)
  return (x, y, z) =>
    (board
      ? Math.hypot((q.x - x) / U[0], (q.y - y) / U[1])
      : z === null || Math.abs((+z || 0) - (q.z || 0)) < 40
        ? Math.hypot((q.x - x) * W, (q.y - y) * H) / DROP.REACH
        : 9) < 1;
}
/* how long E pressed on an orb still takes it (ms: a heartbeat or two) */
const PRESS_MS = 400;
/* the orb duck id stands on and may take with E now, as { w } (its first thing), or null (sblootview.js, gameround.js:
   the E button) */
export function sbOrbFor(s, id) {
  const me = s.pos && s.pos[id],
    pts = (s.sb && s.sb.pts) || {};
  if (!me || !spawnsHere(s)) return null;
  for (const [k, q] of Object.entries(pts)) {
    if (q.k !== "loot" || !sbTabLive(pts, k)) continue;
    const who = words(boxText(q, "ltake"));
    for (const o of orbsOf(q))
      if (
        o.dn == null && // (a zombie drop: Dead Ducks Arcade's own E, l4ddloot.js)
        !(o.got || []).includes(id) &&
        orbNear(s, q, o)(me.x, me.y, me.z) &&
        mayTake(s, who, id)
      )
        return { w: o.w };
  }
  return null;
}
/* t takes orb o of block id: a duck gets what it holds; an NPC only takes it away */
function takeBy(s, id, q, o, t, now, H0) {
  if (String(t).startsWith("n:")) return;
  for (const w of o.ws || [o.w]) {
    take(s, q, w, t, now, H0);
    grFrom(s, "p:" + t, id, w); // (a group whose condition is this loot, or what it held: sbgroups.js)
  }
}
/* item w's own numbers in block q (plan Loot 3: its "i_w_row" boxes; blank: the item's own), as l4ddrules.js l4Loot
   takes them: { dmg | dmgP, ammo | ammoP, n, inf, rl, brk (true, false, or null: its own), cool (ms) } */
export function modsOf(q, w) {
  const f = (k) => `i_${w}_${k}`,
    t = (k) => String(boxText(q, f(k))).trim(),
    tf = (k) => (t(k) ? !/^f/i.test(t(k)) : null),
    nb = (k) => {
      const v = t(k) ? num(q, f(k)) : NaN;
      return Number.isFinite(v) && v > 0 ? v : null;
    },
    d = sbPct(t("dmg")),
    a = sbPct(t("ammo")),
    sps = nb("sps"),
    cd = nb("cd");
  return {
    dmg: d && d.v != null ? d.v : null,
    dmgP: d && d.p != null ? d.p : null,
    ammo: a && a.v != null ? Math.round(a.v) : null,
    ammoP: a && a.p != null ? a.p : null,
    n: nb("n") && Math.round(nb("n")),
    inf: tf("inf") ?? (num(q, "inf") === true ? true : null), // (the block's own Unlimited ammo: every gun in it)
    rl: tf("rl"),
    brk: tf("brk"),
    cool: sps ? 1000 / sps : cd ? cd * 1000 : null,
  };
}
/* item w's numbers as they come from block q: G's rows over the loot's (plan Loot 5: "Order: game settings, then groups
   ... then loot") */
const modsIn = (s, q, w) => sbModsOver(sbItemMods(s, w), modsOf(q, w));
/* duck by takes w from block q */
function take(s, q, w, by, now, H0) {
  const keep = num(q, "keep"),
    hurt = num(q, "hurt");
  if (zmaps(s) && w === "flashlight")
    s.sb = { ...s.sb, fl: { ...(s.sb.fl || {}), [by]: 1 } }; // (a flashlight: kept for good)
  else if (zmaps(s) && ammoOf(w)) {
    const n = modsIn(s, q, w).n || 1; // (How many you get: magazines)
    for (let i = 0; i < n; i++) l4Ammo(s, by, ammoOf(w)); // (a magazine more, for the gun I carry)
  } else if (zmaps(s)) l4Loot(s, by, w, undefined, modsIn(s, q, w));
  else {
    const hb = (s.sb && s.sb.hb) || {},
      mine = ((hb.got || {})[by] || []).filter(([v]) => v !== w);
    const m = modsIn(s, q, w),
      x = {}; // (its own numbers: uses, wait, breaks, sbhot.js sbGot)
    if (m.n) x.u = m.n;
    if (m.cool) x.c = Math.round(m.cool);
    if (m.brk) x.b = 1;
    mine.push(
      Object.keys(x).length
        ? [w, keep > 0 ? now + keep * 1000 : 0, x]
        : [w, keep > 0 ? now + keep * 1000 : 0],
    );
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
