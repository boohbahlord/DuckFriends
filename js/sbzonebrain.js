/* ---------- Sandbox: zones that run a Seriat file (the owner's yes, Nov 20 03:10Z) ----------
   A zone (a block, or one of its Zone tabs) has a Brain box, as a spawn does. Its file runs for the zone: its events
   are every Ns, when enter (a player steps in) and when spawn (one of the zone's tabs made something there); its words
   move the zone's squares: step [n] (its potential order on that many steps), squares n (how many work at once), size n
   (a square's size in duck lengths), order shuffle, dir right. It reads steps, squares, size and inside (how many
   players stand in it). Any file reaches a zone by its variable name: ((zone 'Pit' size 2)), \if zone 'Pit' steps mod 3
   == 0\. In a file a zone is "zone:" and its block's id, so it never mixes with an NPC.
   The brains are the host's only, as the NPCs' are (sbnumberat.js); the files come with the box the same way. */
import { compileScript, brain } from "./numberatrun.js";
import { nbFiles, nbLog } from "./sbnumberat.js";
import {
  sbNameOf,
  sbStep,
  sbGrid,
  sbZoneBox,
  sbInBlock,
  sbOnBoard,
  SB_ORDER,
} from "./sandboxrules.js";
import { W, H } from "./hangout/layout.js";

export const ZID = "zone:";
const FLOOR = 40; // (world px: as sbzone.js, a zone's own floor)
const BRAINS = new Map(); // (room|file -> { text, B, ids: Set, bad, cur })
const INSIDE = new Map(); // (room|zone -> the ducks in it last beat)

const pid = (zid) => String(zid).slice(ZID.length);
const ptsOf = (s) => (s.sb && s.sb.pts) || {};
const fileOf = (nb, n) =>
  nb[n] != null
    ? nb[n]
    : nb[n + ".se"] != null
      ? nb[n + ".se"]
      : nb[n + ".num"] != null
        ? nb[n + ".num"]
        : null;
const brainOf = (p) => {
  const k = p && p.f && p.f.brain;
  return k && k.ok ? String(k.ok).trim() : "";
};
const isZone = (p) => !!p && p.k === "zone";

/* the zone named name (a zone's variable name, any case), as a file sees it, or null */
export function zoneByName(s, name) {
  const want = String(name).trim().toLowerCase();
  for (const [id, p] of Object.entries(ptsOf(s)))
    if (isZone(p) && sbNameOf(p).toLowerCase() === want) return ZID + id;
  return null;
}
export const isZoneId = (id) => typeof id === "string" && id.startsWith(ZID);

/* the players standing in zone p (on its floor, inside its shape) */
function ducksIn(s, p) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    board = sbOnBoard(s);
  return Object.keys(s.players || {}).filter((d) => {
    const me = s.pos && s.pos[d];
    if (!me || me.x < x0 || me.x > x1 || me.y < y0 || me.y > y1) return false;
    if (!sbInBlock(s, p, me.x, me.y, W, H)) return false;
    return board || Math.abs((+me.z || 0) - (p.z || 0)) < FLOOR;
  });
}
const txt = (p, f) => {
  const k = p.f && p.f[f];
  return k && k.ok != null && k.ok !== "" ? String(k.ok) : SB_ORDER[f].def;
};
/* zone zid's stat n */
export function zoneStat(s, zid, n) {
  const id = pid(zid),
    p = ptsOf(s)[id];
  if (!p) return 0;
  if (n === "steps") return sbStep(s, id);
  if (n === "size") return +txt(p, "sq") || 1;
  if (n === "squares") {
    const v = txt(p, "n").trim();
    return v ? +v : sbGrid(s, p, W, H).cells.length; // (blank: all of them)
  }
  if (n === "inside") return ducksIn(s, p).length;
  return 0; // (an NPC's stat: a zone has none)
}
/* one of zone p's boxes set to text v, as typing in it does */
function setBox(s, id, f, v) {
  const pts = ptsOf(s),
    p = pts[id];
  if (!p) return;
  const t = String(v);
  s.sb = {
    ...s.sb,
    pts: { ...pts, [id]: { ...p, f: { ...p.f, [f]: { t, ok: t } } } },
  };
}
/* set zone zid's stat n to v (each kept inside what its box takes) */
export function zoneSet(s, zid, n, v) {
  const id = pid(zid);
  if (!ptsOf(s)[id] || !Number.isFinite(v)) return false;
  if (n === "steps") {
    const zs = (s.sb && s.sb.zs) || {};
    s.sb = { ...s.sb, zs: { ...zs, [id]: Math.max(0, Math.round(v)) } };
  } else if (n === "size")
    setBox(
      s,
      id,
      "sq",
      Math.round(Math.min(20, Math.max(0.25, v)) * 100) / 100,
    );
  else if (n === "squares")
    setBox(s, id, "n", Math.round(Math.min(4096, Math.max(1, v))));
  else return false; // (inside is only read)
  return true;
}
export const zoneMost = (n) =>
  n === "size" ? 20 : n === "squares" ? 4096 : n === "steps" ? 1e6 : 100;

/* the host's beat: every zone with a Brain runs its file. ev: what happened this beat, [[zone id, "spawn"], …]
   (sbspawn.js). True when anything changed */
export function zbThink(s, now) {
  const room = s.id || "room",
    pts = ptsOf(s),
    groups = new Map();
  for (const [id, p] of Object.entries(pts)) {
    if (!isZone(p)) continue;
    const n = brainOf(p);
    if (!n) continue;
    if (!groups.has(n)) groups.set(n, []);
    groups.get(n).push(id);
  }
  const evs = (s.hidden && s.hidden.zbev) || [];
  if (evs.length) s.hidden = { ...s.hidden, zbev: [] };
  let ch = false;
  for (const [k, g] of BRAINS)
    if (k.startsWith(room + "|") && !groups.has(k.slice(room.length + 1))) {
      g.B.stop();
      BRAINS.delete(k);
    }
  if (!groups.size) return ch;
  const nb = nbFiles(s);
  for (const [name, ids] of groups) {
    const text = fileOf(nb, name),
      key = room + "|" + name;
    let g = BRAINS.get(key);
    if (!g || g.text !== text) {
      if (g) g.B.stop();
      g = make(s, name, text, now);
      BRAINS.set(key, g);
      ch = true;
    }
    if (g.bad) continue;
    g.cur = { s, now };
    const live = new Set(ids.map((id) => ZID + id));
    for (const z of [...g.ids])
      if (!live.has(z)) {
        g.B.remove(z);
        g.ids.delete(z);
      }
    for (const z of live)
      if (!g.ids.has(z)) {
        g.ids.add(z);
        g.B.add(z, true);
      }
    if (!g.started) {
      g.started = true;
      g.B.start(); // (its top lines, once its zones are known: order shuffle there is for all of them)
      g.ch = true;
    }
    for (const [id, ev] of evs) if (live.has(ZID + id)) g.B.fire(ev, ZID + id);
    if (g.B.needs.enter)
      for (const id of ids) {
        const k = room + "|" + id,
          was = INSIDE.get(k) || [],
          inn = ducksIn(s, pts[id]);
        for (const d of inn) if (!was.includes(d)) g.B.fire("enter", ZID + id);
        INSIDE.set(k, inn);
      }
    g.B.tick();
    if (g.ch) {
      g.ch = false;
      ch = true;
    }
  }
  return ch;
}
/* a zone's tab made something in it: its file's when spawn plays (sbspawn.js) */
export function zbSpawned(s, id) {
  if (!isZone(ptsOf(s)[id]) || !brainOf(ptsOf(s)[id])) return;
  s.hidden = {
    ...(s.hidden || {}),
    zbev: [...((s.hidden && s.hidden.zbev) || []), [id, "spawn"]],
  };
}
function make(s, name, text, now) {
  const g = { text, ids: new Set(), bad: false, ch: false, cur: { s, now } };
  if (text == null) {
    nbLog(
      s,
      `✗ Brain ${name}: no file by that name came with it (open it in the n window and save it again)`,
      now,
    );
    g.bad = true;
    g.B = { stop() {} };
    return g;
  }
  const nb = nbFiles(s),
    c = compileScript(text, { file: (n) => fileOf(nb, n) });
  if (c.errs.length) {
    for (const e of c.errs.slice(0, 5))
      nbLog(s, `✗ ${name}, line ${e.line}: ${e.why}`, now);
    g.bad = true;
    g.B = { stop() {} };
    return g;
  }
  const t0 = now;
  const host = {
    now: () => g.cur.now / 1000,
    stat: (id, n) => (isZoneId(id) ? zoneStat(g.cur.s, id, n) : 0),
    set: (id, n, v) => {
      if (isZoneId(id) && zoneSet(g.cur.s, id, n, v)) g.ch = true;
    },
    most: (id, n) => zoneMost(n),
    get: (w) => {
      const st = g.cur.s;
      if (w === "wave") return (st.hang && st.hang.l4 && st.hang.l4.r) || 0;
      if (w === "time") return Math.round((g.cur.now - t0) / 100) / 10;
      return 0;
    },
    zone: (n) => zoneByName(g.cur.s, n),
    who: (w, me) => (w.k === "me" && me != null ? [me] : []),
    act: () => {},
    say: (me, t) => {
      nbLog(g.cur.s, t, g.cur.now);
      g.ch = true;
    },
    print: (t) => {
      nbLog(g.cur.s, t, g.cur.now);
      g.ch = true;
    },
    file: (n) => fileOf(nbFiles(g.cur.s), n),
    shared: new Map(),
    error: (line, why) =>
      nbLog(g.cur.s, `✗ ${name}, line ${line}: ${why}`, g.cur.now),
    zones: () => [...g.ids],
    zstep: (me, n) => {
      const st = g.cur.s;
      zoneSet(st, me, "steps", zoneStat(st, me, "steps") + Math.max(0, n));
      g.ch = true;
    },
    zword: (me, what, v) => {
      setBox(g.cur.s, pid(me), what === "order" ? "ord" : "dir", v);
      g.ch = true;
    },
  };
  g.B = brain(c.plan, host);
  return g;
}
