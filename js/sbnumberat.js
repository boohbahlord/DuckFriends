/* ---------- Sandbox: NPCs that run a Seriat file (Seriat part D) ----------
   The owner: "programming the ai". A spawn's Brain box names a file from the Seriat window (n); its text (and the
   files it uses) come to the room with the box (s.nb = { name: text }: its own part of the state, so it goes online only
   when a file changes), so the host can read it. The host keeps one
   brain for each file (numberatrun.js brain()), and every NPC of every spawn that names the file is one of its NPCs:
   - its events come from what the NPCs do, seen beat to beat: one that wasn't there before has spawned, one with less
     HP was hit, one that's gone is dead, a duck as near as a when near says (or touching it, one duck length) is near;
   - its actions are kept on the NPC: o.nbo = { a: go | attack | flee, k: who } is what it goes after (in place of its
     behavior lists, sbbrain.js decide(), until it's gone), o.nbs = [text, until] what it says, and its stats (hp, sv,
     dm, hb) are its own;
   - print and its mistakes go to the room's Seriat log (s.nbo, its own part too), which the Seriat window shows.
   An NPC whose spawn names no file thinks as before. The brains are the host's only: if the host changes, they start
   over. Everything here runs inside sbspawn.js think(), on the board and on the worlds the same. */
import { compileScript, brain } from "./numberatrun.js";
import { valueOf } from "./numerat.js";
import { SB_BOXES } from "./sandboxrules.js";

/* a file's hitbox, in percent: 10% to 300% (was 0.1 to 3; the owner's, Nov 19 15:52Z) */
const HB = { LEAST: 10, MOST: 300 };

export const NB_FILES = 30; // (files a room keeps)
export const NB_TEXT = 8000; // (letters in each)
const TOUCH = 1; // duck lengths: touching
const SAY_MS = 3500;
const LOG = 30; // (lines the room's log keeps)
const CAP = 1000000;
const BRAINS = new Map(); // (room|file -> { text, B, hp, full, spawned, dead, cur, bad })
const SHARED = new Map(); // (room -> give and take's values)

export const nbFiles = (s) => s.nb || {};
const fileOf = (nb, n) =>
  nb[n] != null ? nb[n] : nb[n + ".num"] != null ? nb[n + ".num"] : null;
/* a line in the room's Seriat log */
export function nbLog(s, text, now) {
  const was = s.nbo || [];
  s.nbo = [
    ...was.slice(-(LOG - 1)),
    {
      t: String(text).slice(0, 200),
      at: now,
      n: ((was.at(-1) || {}).n || 0) + 1,
    },
  ];
}

/* the files a player sends with a Brain box (or after changing one): kept, at most NB_FILES of NB_TEXT letters */
export function nbKeep(s, files) {
  const nb = { ...nbFiles(s) };
  for (const [n, t] of Object.entries(files || {})) {
    const name = String(n).slice(0, 80);
    if (!/^[\w./ -]+$/.test(name)) continue;
    delete nb[name];
    nb[name] = String(t == null ? "" : t).slice(0, NB_TEXT);
  }
  const names = Object.keys(nb);
  for (const n of names.slice(0, Math.max(0, names.length - NB_FILES)))
    delete nb[n]; // (the oldest go first)
  s.nb = nb;
  return true;
}

/* think()'s part: them (its things for the NPCs up), all (them and the ducks), ducks, far(a, b) in duck lengths, and
   brainOf(o): the file NPC o's spawn names ("" for none). Fires the events, lets the brains run, and gives true when
   it changed anything */
export function nbThink(s, now, them, all, ducks, far, brainOf) {
  const room = s.id || "room",
    groups = new Map();
  for (const me of them) {
    const n = brainOf(me.o);
    if (!n) continue;
    if (!groups.has(n)) groups.set(n, []);
    groups.get(n).push(me);
  }
  let ch = false;
  const byKey = groups.size ? new Map(all.map((t) => [t.key, t])) : null;
  for (const [k, g] of BRAINS)
    if (
      k.startsWith(room + "|") &&
      !groups.has(k.slice(room.length + 1)) &&
      g.hp.size
    ) {
      g.cur = { s, now, byKey: byKey || new Map(), all, ducks, far, list: [] };
      ch = deaths(g, new Set()) || ch; // (a file whose NPCs are all gone: their when dead's still play)
      g.B.tick();
    }
  if (!groups.size) return ch;
  const nb = nbFiles(s);
  for (const [name, list] of groups) {
    const text = fileOf(nb, name),
      key = room + "|" + name;
    let g = BRAINS.get(key);
    if (!g || g.text !== text) {
      if (g) g.B.stop();
      g = make(s, name, text, now);
      BRAINS.set(key, g);
      ch = true; // (its first lines may print, or its mistakes go to the log)
    }
    if (g.bad) continue;
    g.cur = { s, now, byKey, all, ducks, far, list };
    const live = new Set(list.map((m) => m.key));
    ch = deaths(g, live) || ch;
    for (const me of list) {
      const o = me.o;
      if (o.nbs && o.nbs[1] <= now) {
        delete o.nbs; // (said: gone from the state, so 800 NPCs' words aren't sent every beat)
        ch = true;
      }
      if (!g.hp.has(me.key)) {
        g.hp.set(me.key, o.hp);
        g.full.set(me.key, o.hp);
        g.spawned++;
        g.B.add(me.key);
        ch = true;
      } else if (o.hp < g.hp.get(me.key)) {
        g.B.fire("hit", me.key);
        ch = true;
      }
      if (g.B.needs.duck || g.B.needs.touch) {
        let d = Infinity;
        for (const t of ducks) d = Math.min(d, far(me, t));
        if (g.B.needs.duck) g.B.near(me.key, "duck", d);
        if (g.B.needs.touch) g.B.touch(me.key, d <= TOUCH);
      }
      if (g.B.needs.zombie) {
        let dz = Infinity,
          dn = Infinity;
        for (const t of them) {
          if (t === me) continue;
          const d = far(me, t);
          dn = Math.min(dn, d);
          if (t.k === "zombie") dz = Math.min(dz, d);
        }
        g.B.near(me.key, "zombie", dz);
        g.B.near(me.key, "npc", dn);
      }
    }
    g.B.tick();
    for (const me of list) g.hp.set(me.key, me.o.hp); // (what its own file did to its HP isn't a hit)
    if (g.ch) {
      g.ch = false;
      ch = true;
    }
  }
  return ch;
}
function deaths(g, live) {
  let ch = false;
  for (const k of [...g.hp.keys()])
    if (!live.has(k)) {
      g.dead++;
      g.B.fire("dead", k);
      g.B.remove(k);
      g.hp.delete(k);
      g.full.delete(k);
      ch = true;
    }
  return ch;
}
/* a file's brain, with what it can see and do in this room */
function make(s, name, text, now) {
  const room = s.id || "room",
    g = {
      text,
      hp: new Map(),
      full: new Map(),
      spawned: 0,
      dead: 0,
      t0: now,
      bad: false,
      ch: false,
      cur: null,
    };
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
  if (!SHARED.has(room)) SHARED.set(room, new Map());
  const thing = (id) => g.cur.byKey.get(id),
    npc = (id) => {
      const t = thing(id);
      return t && !t.duck ? t.o : null;
    };
  const host = {
    now: () => g.cur.now / 1000,
    stat: (id, n) => {
      const o = npc(id);
      if (!o) return 0;
      return n === "hp"
        ? o.hp
        : n === "speed"
          ? o.sv || 1
          : n === "damage"
            ? valueOf({ ok: o.dm }, SB_BOXES.damage) || 1
            : Math.round((o.hb || 1) * 100); // (hitbox: in percent, the owner's, Nov 19 15:52Z)
    },
    set: (id, n, v) => {
      const o = npc(id);
      if (!o) return;
      g.ch = true;
      if (n === "hp") {
        o.hp = Math.min(CAP, Math.max(0, v));
        if (o.hp <= 0 && !o.d) o.d = g.cur.now;
      } else if (n === "speed")
        o.sv = Math.min(SB_BOXES.speed.max, Math.max(SB_BOXES.speed.min, v)); // (as the Speed box: never 0)
      else if (n === "damage")
        o.dm = String(Math.min(SB_BOXES.damage.max, Math.max(0.1, v)));
      else o.hb = Math.min(HB.MOST, Math.max(HB.LEAST, v)) / 100; // (kept as a share: sbbody.js)
    },
    most: (id, n) =>
      n === "hp"
        ? g.full.get(id) || SB_BOXES.hp.max
        : n === "speed"
          ? SB_BOXES.speed.max
          : n === "damage"
            ? SB_BOXES.damage.max
            : 100, // (hitbox: already a percent of its usual size, so ((hitbox 150%)) is ((hitbox 150)), never a share of 300)
    get: (w) => {
      const st = g.cur.s;
      if (w === "wave") return (st.hang && st.hang.l4 && st.hang.l4.r) || 0;
      if (w === "time") return Math.round((g.cur.now - g.t0) / 100) / 10;
      if (w === "alive") return g.cur.list.length;
      if (w === "dead") return g.dead;
      return g.spawned;
    },
    who: (w, me) => {
      const { all, ducks, list, far } = g.cur,
        mine = thing(me);
      if (w.k === "me") return [me];
      if (w.k === "team") return list.map((t) => t.key);
      const pool =
        w.of === "duck"
          ? ducks
          : all.filter((t) => !t.duck && (w.of === "npc" || t.k === "zombie"));
      if (w.k === "all") return pool.map((t) => t.key);
      if (!mine) return [];
      let best = null,
        bd = Infinity;
      for (const t of pool) {
        if (t.key === me) continue;
        const d = far(mine, t);
        if (d < bd) {
          bd = d;
          best = t;
        }
      }
      return best ? [best.key] : [];
    },
    act: (me, a, id) => {
      const o = npc(me);
      if (!o) return;
      o.nbo = { a, k: id };
      g.ch = true;
    },
    say: (me, t) => {
      const o = npc(me);
      if (!o) return;
      o.nbs = [String(t).slice(0, 80), g.cur.now + SAY_MS];
      g.ch = true;
    },
    print: (t) => nbLog(g.cur.s, t, g.cur.now),
    file: (n) => fileOf(nbFiles(g.cur.s), n),
    shared: SHARED.get(room),
    error: (line, why) =>
      nbLog(g.cur.s, `✗ ${name}, line ${line}: ${why}`, g.cur.now),
  };
  g.cur = {
    s,
    now,
    byKey: new Map(),
    all: [],
    ducks: [],
    list: [],
    far: () => Infinity,
  };
  g.B = brain(c.plan, host);
  g.B.start();
  return g;
}
/* what NPC me's file told it to do, as decide() gives it: { goal, foe, flee }; null when it has no order (or what it was
   after is gone) */
export function nbOrder(me, all) {
  const o = me.o,
    n = o.nbo;
  if (!n) return null;
  const t = all.find((x) => x.key === n.k);
  if (!t || t.key === me.key) {
    delete o.nbo;
    return null;
  }
  return n.a === "flee"
    ? { flee: t }
    : n.a === "attack"
      ? { goal: t, foe: t }
      : { goal: t };
}
