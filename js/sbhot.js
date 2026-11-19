/* ---------- Sandbox: the hotbar (stage 4a), the rules ----------
   The owner's Sandbox file: "Build mode starts out with a full and empty hotbar" (the owner's, Nov 19 01:57Z: every slot
   shows, all empty). From the cheat sheet (c) anyone can "preview all loot and categories of loot to click and place them
   in their hotbar"; whoever may change Sandbox (sandboxrules.js sbCan) can "make the defaults in a hotbar", pick "the
   default loot for hotbar in what place", and "lock the hotbar OR allow player's personal hotbar" (h). A spawn can go on
   a slot as a spawn button ("in order for an entity to spawn, it must be set to a hotbar spawn item OR a key"), drawn as
   a simple 2D shape in a color, or the head of one of the things it spawns.
   s.sb.hb = { d: the default's 10 slots, lock: 1 when locked, own: { player id: their 10 slots }, ic: { spawn id:
   [shape, color, head] } }. A slot holds a special's id, "sp:" and a spawn's id, or null.
   No screen here: the screen half is sbhotview.js */
import { isSb, sbCan, SB_COLORS, SB_WHAT } from "./sandboxrules.js";
import { sbPress } from "./sbspawn.js";

export const SB_SLOTS = 10;
/* the 2D shapes a spawn button can be */
export const SB_SHAPES = ["circle", "square", "triangle", "diamond", "star"];
const EMPTY = () => Array(SB_SLOTS).fill(null);
const hbOf = (s) => (s && s.sb && s.sb.hb) || {};
const ptsOf = (s) => (s && s.sb && s.sb.pts) || {};
/* a spawn button's slot ("sp:p3"): its spawn's id, or "" */
export const spawnOf = (v) =>
  typeof v === "string" && v.startsWith("sp:") ? v.slice(3) : "";
/* what a slot may hold: a special's id (the screen checks it is one), or a spawn of this map */
function okSlot(s, v) {
  if (v == null || v === "") return true;
  if (typeof v !== "string" || v.length > 24) return false;
  const p = spawnOf(v);
  if (p) return !!ptsOf(s)[p] && ptsOf(s)[p].k === "spawn";
  return /^[a-z0-9]+$/.test(v);
}
/* ten slots, each good or null (a spawn taken away leaves its slot empty) */
const clean = (s, a) =>
  Array.from({ length: SB_SLOTS }, (_, i) => {
    const v = Array.isArray(a) ? a[i] : null;
    return v && okSlot(s, v) ? v : null;
  });
/* the slots player id plays with: the default while it's locked or they have none of their own */
export function sbSlots(s, id) {
  const hb = hbOf(s),
    own = !hb.lock && hb.own && hb.own[id];
  return clean(s, own || hb.d || EMPTY());
}
/* a spawn button's look: [shape, color, head]; by default a shape and a color picked from its id, so each stays the same */
export function sbIcon(s, p) {
  const ic = (hbOf(s).ic || {})[p];
  if (ic) return ic;
  const n = [...String(p)].reduce(
      (h, c) => (h * 31 + c.charCodeAt(0)) >>> 0,
      7,
    ),
    cols = Object.keys(SB_COLORS);
  return [
    SB_SHAPES[n % SB_SHAPES.length],
    cols[Math.floor(n / SB_SHAPES.length) % cols.length],
    "",
  ];
}

/* ---------- the actions: { t: "sbh", k, … } ----------
   put: slot i of mine ("me", while it isn't locked) or of the default ("def", sbCan) gets v (null: emptied); a spawn
   button only from someone who may change Sandbox. mine: my slots become v (my Customize hotbar). clear: mine or the
   default emptied. def: my slots become the default. lock: on or off. icon: a spawn button's look. go: a spawn button on
   one of my slots is pressed: it spawns, whoever presses it (the owner's: the host puts it on the hotbar to let them) */
export function sbHotAct(s, a, now) {
  if (!isSb(s) || !s.players[a.id]) return false;
  const hb = hbOf(s),
    can = sbCan(s, a.id),
    own = { ...(hb.own || {}) },
    set = (next) => {
      s.sb = { ...s.sb, hb: { ...hb, ...next } };
      return true;
    };
  if (a.k === "go") {
    const p = spawnOf(a.v);
    return !!p && sbSlots(s, a.id).includes(a.v) && sbPress(s, p, now);
  }
  if (a.k === "put") {
    const i = +a.i,
      v = a.v || null;
    if (!(i >= 0 && i < SB_SLOTS) || i !== Math.floor(i) || !okSlot(s, v))
      return false;
    if (spawnOf(v) && !can) return false;
    if (a.to === "def") {
      if (!can) return false;
      const d = clean(s, hb.d);
      d[i] = v;
      return set({ d });
    }
    if (hb.lock) return false;
    const mine = sbSlots(s, a.id);
    if (v) mine.forEach((w, j) => w === v && (mine[j] = null)); // (one slot each, as in Customize)
    mine[i] = v;
    own[a.id] = mine;
    return set({ own });
  }
  if (a.k === "mine") {
    if (hb.lock) return false;
    own[a.id] = clean(s, a.v).map((v) => (spawnOf(v) && !can ? null : v));
    return set({ own });
  }
  if (a.k === "clear") {
    if (a.to === "def") return can && set({ d: EMPTY() });
    if (hb.lock) return false;
    own[a.id] = EMPTY();
    return set({ own });
  }
  if (!can) return false;
  if (a.k === "def") return set({ d: sbSlots(s, a.id) });
  if (a.k === "lock") return set({ lock: a.on ? 1 : 0 });
  if (a.k === "icon") {
    const p = String(a.p || "");
    if (!ptsOf(s)[p] || ptsOf(s)[p].k !== "spawn") return false;
    const [sh, c, h] = Array.isArray(a.v) ? a.v : [];
    if (!SB_SHAPES.includes(sh) || !SB_COLORS[c] || (h && !SB_WHAT[h]))
      return false;
    return set({ ic: { ...(hb.ic || {}), [p]: [sh, c, h || ""] } });
  }
  return false;
}
