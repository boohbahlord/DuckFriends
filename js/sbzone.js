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
  SB_ZONE,
  SB_FX,
} from "./sandboxrules.js";
import { valueOf } from "./numerat.js";
import { boxText, spawnsHere } from "./sbspawn.js";
import { W, H, heightAt } from "./hangout/layout.js";
import { l4Hurt, l4Heal, l4Zone } from "./l4ddrules.js";

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

/* is (x, y) on floor z (shares of the map; z: world px) in zone p */
function inside(s, p, box, x, y, z) {
  const [x0, y0, x1, y1] = box;
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  return sbOnBoard(s) || Math.abs((+z || 0) - (p.z || 0)) < FLOOR;
}

/* ---------- the host's heartbeat. H: rules.js SB_H (ducks, claw, heal). True when anything changed ---------- */
export function sbZoneTick(s, now, H0) {
  if (!spawnsHere(s) || !s.sb) return false;
  const pts = (s.sb && s.sb.pts) || {},
    zones = Object.entries(pts).filter(
      ([, p]) => p.k === "zone" && fxOf(p) !== "none",
    ),
    hid = s.hidden || {},
    was = hid.sbzt || {};
  if (!zones.length) {
    if (Object.keys(was).length) s.hidden = { ...hid, sbzt: {} };
    return false;
  }
  const zt = {};
  let ch = false;
  for (const [id, p] of zones) {
    if (was[id] && now < was[id]) {
      zt[id] = was[id];
      continue;
    }
    const every = num(p, "rate");
    zt[id] = now + 1000 * Math.max(0.1, Number.isFinite(every) ? every : 1);
    ch = hitAll(s, pts, p, now, H0) || ch;
  }
  s.hidden = { ...hid, sbzt: zt };
  return ch;
}

/* zone p does its thing to everyone it hits standing in it */
function hitAll(s, pts, p, now, H0) {
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
    if (!me || !inside(s, p, box, me.x, me.y, me.z)) continue;
    if (!all && !who.includes("players") && !(name && who.includes(name)))
      continue;
    ch = true;
    if (zmaps) {
      if (fx === "heal") l4Heal(s, id, amt);
      else l4Hurt(s, id, amt, now, "zone");
    } else if (fx === "heal") H0.heal(s, id, amt, now);
    else H0.claw(s, id, amt, now, "zone");
  }
  /* the NPCs: everything, their kind, or their spawn by its color or name */
  const hits = (k, sp) => {
    if (all || who.includes(k || "zombie")) return true;
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
      (o) => inside(s, p, box, o.x, o.y, o.z) && hits("zombie", o.sp),
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
      !o.d && inside(s, p, box, o.x, o.y, 0) && hits(o.k, o.sp) ? npc(o) : o,
    );
  else if (s.hang && s.hang.sbz) {
    const z = s.hang.sbz,
      zb = z.zb.map((o) =>
        !o.d &&
        inside(s, p, box, o.x / W, o.y / H, heightAt(o.x, o.y)) &&
        hits(o.k, o.sp)
          ? npc(o)
          : o,
      );
    if (zb.some((o, i) => o !== z.zb[i]))
      s.hang = { ...s.hang, sbz: { ...z, zb } };
  }
  return ch;
}
