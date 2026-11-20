/* ---------- Sandbox: board zones (stage 5), the rules ----------
   The owner's Sandbox file, "Board Build" (sandboxrules.js SB_ZONE has the words): a zone is a rectangle of the map, in a
   spawn's colors, that is "not an actual solid". What it does ("Nothing", "Damage", "Heal" or "Kill") happens to whoever
   it hits that stands in it, once every "Seconds between" (a Seriat range there: a new pick each time, so the rate can
   change). "Who it hits" takes what a spawn's behavior lists take: Players, Everything, a kind, a spawn by its color or
   name, and a player's name.
   - On the board and Duck Cabin a duck loses HP as from a spawn's claw (rules.js SB_H.claw), or gets it back (SB_H.heal);
     on the zombie maps as their zombies hurt (l4ddrules.js l4Hurt, l4Heal).
   - NPCs lose or get back their HP the same way, up to what they spawned with; the zombie maps' own zombies, whole HP
     (theirs).
   - On a world a zone is on its own floor: only what stands within 40 px of the height it was placed at.
   Where things spawn in a zone is sbspawn.js (zoneSpot, zonesFor), sandboxrules.js (players) and sbloot.js (loot).
   The zones' clocks are the host's own (s.hidden.sbzt), never sent. */
import {
  baseMode,
  sbOnBoard,
  sbZoneBox,
  sbInBlock,
  sbWorksAt,
  sbInv,
  sbOrd,
  sbGo,
  sbUsed,
  SB_ORDER,
  SB_ZONE,
  SB_FX,
  SB_LAND_MIN,
} from "./sandboxrules.js";
import { valueOf } from "./numerat.js";
import { boxText, spawnsHere } from "./sbspawn.js";
import { W, H, heightAt } from "./hangout/layout.js";
import { l4Hurt, l4Heal, l4Zone } from "./l4ddrules.js";
import { grIn } from "./sbgroups.js";
import { zbThink } from "./sbzonebrain.js";
import { sbFloorsFrom } from "./sbfloors.js";

const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
const num = (p, f) => valueOf({ ok: boxText(p, f) }, SB_ZONE[f]);
/* what zone p does: one of SB_FX ("none" when nothing) */
export const fxOf = (p) => {
  const t = boxText(p, "fx").trim();
  return SB_FX[t] ? t : "none";
};
const FLOOR = 40; // (world px: how far above or below a zone's floor still counts as in it)

/* is (x, y) on floor z (shares of the map; z: world px) where zone id, p, works: in it on one of its squares that act now,
   or outside it for an Inverse one (sandboxrules.js sbWorksAt) */
function inside(s, id, p, box, x, y, z) {
  return sbWorksAt(s, id, p, x, y, z, W, H);
}
/* every block's steps (plan Phase 3): one every "Seconds per step", counted in s.sb.zs (each screen works out the
   squares from it, sandboxrules.js sbActive); the clocks are the host's own (s.hidden.sbst) */
function steps(s, pts, now) {
  const hid = s.hidden || {},
    was = hid.sbst || {},
    at = {},
    zs = { ...((s.sb && s.sb.zs) || {}) };
  let ch = false;
  for (const [id, p] of Object.entries(pts)) {
    if (sbOrd(p) === "all" || sbGo(p) !== "time") continue; // (by use or by a player stepping in: sbUsed)
    if (was[id] && now < was[id]) {
      at[id] = was[id];
      continue;
    }
    const t = p.f && p.f.st && +p.f.st.ok,
      every = Number.isFinite(t) && t >= 0.1 ? t : +SB_ORDER.st.def;
    at[id] = now + every * 1000;
    ch = true; // (a new clock: kept, as the host keeps a changed state only)
    if (was[id]) {
      zs[id] = (zs[id] || 0) + 1;
      ch = true;
    }
  }
  for (const id of Object.keys(zs))
    if (!pts[id] || sbOrd(pts[id]) === "all") {
      delete zs[id];
      ch = true;
    }
  s.hidden = { ...hid, sbst: at };
  if (JSON.stringify(zs) !== JSON.stringify((s.sb && s.sb.zs) || {}))
    s.sb = { ...s.sb, zs };
  return ch;
}

/* the zones that step each time a player steps in (plan Phase 3: "only on an event (... a player stepped in)"): who
   stood in each last time, in s.hidden.sbin (the host's own); one step for each duck new in it. True when one stepped */
function entered(s, pts, H0) {
  const was = (s.hidden && s.hidden.sbin) || {},
    now = {};
  let ch = false;
  for (const [id, p] of Object.entries(pts)) {
    if (sbGo(p) !== "enter" || p.grp) continue;
    const box = sbZoneBox(s, p, W, H),
      [x0, y0, x1, y1] = box,
      inn = H0.ducks(s).filter((d) => {
        const me = s.pos[d];
        if (me && sbInv(p))
          return sbWorksAt(s, id, p, me.x, me.y, me.z, W, H, true); // (Inverse: stepping out of it)
        if (!me || me.x < x0 || me.x > x1 || me.y < y0 || me.y > y1)
          return false;
        if (!sbInBlock(s, p, me.x, me.y, W, H)) return false;
        return sbOnBoard(s) || Math.abs((+me.z || 0) - (p.z || 0)) < FLOOR;
      });
    now[id] = inn;
    for (const d of inn)
      if (!(was[id] || []).includes(d)) {
        sbUsed(s, id, "enter");
        ch = true;
      }
  }
  if (JSON.stringify(now) !== JSON.stringify(was))
    s.hidden = { ...(s.hidden || {}), sbin: now };
  return ch;
}
/* ---------- the host's heartbeat. H: rules.js SB_H (ducks, claw, heal). True when anything changed ---------- */
export function sbZoneTick(s, now, H0) {
  sbFloorsFrom(s); // (its ground zones are floors: sbfloors.js)
  if (!spawnsHere(s) || !s.sb) return false;
  const pts = (s.sb && s.sb.pts) || {},
    stepped = steps(s, pts, now) | entered(s, pts, H0) | zbThink(s, now),
    zones = Object.entries(pts).filter(
      ([, p]) => p.k === "zone" && fxOf(p) !== "none",
    ),
    hid = s.hidden || {},
    was = hid.sbzt || {};
  if (!zones.length) {
    if (Object.keys(was).length) s.hidden = { ...hid, sbzt: {} };
    return stepped;
  }
  const zt = {};
  let ch = false;
  for (const [id, p] of zones) {
    if (was[id] && now < was[id]) {
      zt[id] = was[id];
      continue;
    }
    const every = num(p, "rate");
    zt[id] = now + 1000 * Math.max(0, Number.isFinite(every) ? every : 1); // (0: every beat)
    ch = hitAll(s, pts, id, p, now, H0) || ch;
  }
  s.hidden = { ...hid, sbzt: zt };
  return ch || stepped;
}

/* { t: "sb", k: "land", h, x, y, z }: my duck landed from a fall h world px high (game.js: its own screen works the fall
   out), at (x, y, z), near where the room has it. Each zone it landed in on a working square hurts as its "Landing on it
   from a fall hurts" says (the owner's floor-is-lava idea: "you hit that ground, boom, you're dead"); the most of them */
export function sbLandAct(s, a, now, H0) {
  if (!spawnsHere(s) || !s.sb || sbOnBoard(s)) return false;
  const id = a.id,
    me = s.pos[id];
  if (!me || !H0.ducks(s).includes(id) || !(+a.h >= SB_LAND_MIN)) return false;
  const near = (v, w, d) => Number.isFinite(+v) && Math.abs(+v - w) <= d,
    x = near(a.x, me.x, 0.05) ? +a.x : me.x,
    y = near(a.y, me.y, 0.05) ? +a.y : me.y,
    z = near(a.z, +me.z || 0, 60) ? +a.z : +me.z || 0;
  let most = 0;
  for (const [pid, p] of Object.entries(s.sb.pts || {})) {
    if (p.k !== "zone") continue;
    const t = boxText(p, "land").trim().toLowerCase();
    if (!t || !inside(s, pid, p, null, x, y, z)) continue;
    most = Math.max(most, t === "max" ? 1e4 : +t || 0);
  }
  if (!most) return false;
  if (baseMode(s.options) === "l4dd") l4Hurt(s, id, most, now, "zone");
  else H0.claw(s, id, most, now, "zone");
  return true;
}
/* zone p does its thing to everyone it hits standing in it */
function hitAll(s, pts, id, p, now, H0) {
  const fx = fxOf(p),
    raw = num(p, "amt"),
    amt = fx === "kill" ? 1e4 : Number.isFinite(raw) ? raw : 1,
    who = words(boxText(p, "zwho")),
    all = who.includes("everything"),
    zmaps = baseMode(s.options) === "l4dd",
    box = sbZoneBox(s, p, W, H);
  let ch = false;
  /* the ducks */
  for (const id of H0.ducks(s)) {
    const me = s.pos[id],
      name = String((s.players[id] || {}).name || "").toLowerCase();
    if (!me || !inside(s, id, p, box, me.x, me.y, me.z)) continue;
    if (s.sb.bld && s.sb.bld[id]) continue; // (building: B is up, sbspawn.js "bld")
    if (
      !all &&
      !who.includes("players") &&
      !(name && who.includes(name)) &&
      !grIn(s, who, "p:" + id) // (a group it's in: sbgroups.js)
    )
      continue;
    ch = true;
    if (zmaps) {
      if (fx === "heal") l4Heal(s, id, amt);
      else l4Hurt(s, id, amt, now, "zone");
    } else if (fx === "heal") H0.heal(s, id, amt, now);
    else H0.claw(s, id, amt, now, "zone");
  }
  /* the NPCs: everything, their kind, or their spawn by its color or name */
  const hits = (k, sp, key) => {
    if (all || who.includes(k || "zombie")) return true;
    if (key && grIn(s, who, key)) return true;
    const q = pts[sp];
    return (
      !!q &&
      (who.includes(q.col) || who.includes(boxText(q, "name").toLowerCase()))
    );
  };
  if (
    zmaps &&
    l4Zone(
      s,
      (o) => inside(s, id, p, box, o.x, o.y, o.z) && hits("zombie", o.sp),
      fx,
      amt,
      now,
    )
  )
    ch = true;
  const npc = (o) => {
    const max = (o.l && o.l[0]) || o.hp,
      hp = fx === "heal" ? Math.min(max, o.hp + amt) : Math.max(0, o.hp - amt);
    if (hp === o.hp) return o;
    const q = { ...o, hp: Math.round(hp * 10) / 10 };
    if (q.hp <= 0) q.d = now;
    ch = true;
    return q;
  };
  if (sbOnBoard(s) && s.mz && s.mz.sb)
    s.mz.zb = s.mz.zb.map((o) =>
      !o.d && inside(s, id, p, box, o.x, o.y, 0) && hits(o.k, o.sp, "n:" + o.i)
        ? npc(o)
        : o,
    );
  else if (s.hang && s.hang.sbz) {
    const z = s.hang.sbz,
      zb = z.zb.map((o) =>
        !o.d &&
        inside(s, id, p, box, o.x / W, o.y / H, heightAt(o.x, o.y)) &&
        hits(o.k, o.sp, "n:c" + o.i)
          ? npc(o)
          : o,
      );
    if (zb.some((o, i) => o !== z.zb[i]))
      s.hang = { ...s.hang, sbz: { ...z, zb } };
  }
  return ch;
}
