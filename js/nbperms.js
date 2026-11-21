/* ---------- Seriat: everyone's home folder, and the rights players give each other (the owner's, Nov 19 16:12Z) ----------
   "the home directory is a user's folder, but a new permission let's players view other players directories and go inside
   them inside the home directory in which a user's directory is located ... players can click a permissions button ...
   to change permissions for that file (read, write, execute), or to give other players in a dropdown menu to modify
   permissions player's have within your files and directories (only yours). otherwise, players cannot read your files OR
   write OR execute unless you give them persmission. permission has to be granted for every new sandbox session".
   Every player's files stay on their own device (shell.js). The room only learns, for this Sandbox:
   - the names in each player's folder (n: ["a.num", "d/", "d/b.num"]), so whoever has canhomes can look in it;
   - the rights each player gave (g: { path in their folder ("" = all of it): { who: "rwx" } }), who being a player's id,
     "@o" (everyone) or "@g:<group>" (a group's members).
   Both are kept with the Sandbox's start (s.nbp.at = s.startedAt): a new Sandbox starts with none, and nobody's rights are
   ever kept on a device. Nobody means the host and sudo too: canhomes (sudo has it) only shows the names. */
import { groupsOf, may } from "./roomrules.js";
import { isSb } from "./sandboxrules.js";

const NB_NAMES = 300; // (names one folder shows the room)
const NB_GRANTS = 200; // (rights one player gives, in all)
const PATH_OK = (p) =>
  typeof p === "string" &&
  p.length <= 200 &&
  !/(^|\/)\.\.?(\/|$)/.test(p) &&
  /^[\w.\-/]*$/.test(p) &&
  !p.startsWith("/");
const BITS_OK = /^r?w?x?$/;

/* every player's names and rights, for this Sandbox only */
const all = (s) =>
  s && s.nbp && s.nbp.at === s.startedAt ? s.nbp.by || {} : {};
/* one player's: { n: names, g: rights } */
export const nbBy = (s, id) => all(s)[id] || {};

/* may id look in the other players' folders (home/)? the new group permission canhomes; sudo has it */
export const canHomes = (s, id) => !!s && may(s, id, "canhomes");

/* { t: "nbn", names } (my folder's names) and { t: "nbp", path, who, bits } (a right I give, "" takes it away) */
export function nbPermAct(s, a) {
  const me = a.id;
  if (!isSb(s) || !s.players[me]) return false;
  const by = { ...all(s) },
    mine = { n: [], g: {}, ...(by[me] || {}) };
  if (a.t === "nbn") {
    if (!Array.isArray(a.names)) return false;
    mine.n = a.names
      .filter((n) => PATH_OK(n) && n)
      .slice(0, NB_NAMES)
      .sort();
  } else {
    const path = String(a.path ?? ""),
      who = String(a.who || ""),
      bits = String(a.bits || "");
    if (!PATH_OK(path.replace(/\/$/, "")) || !BITS_OK.test(bits)) return false;
    const ok =
      who === "@o" ||
      (who.startsWith("@g:") && !!(s.groups || {})[who.slice(3)]) ||
      (who !== me && !!s.players[who] && !s.players[who].bot);
    if (!ok) return false;
    const g = { ...mine.g },
      e = { ...(g[path] || {}) };
    if (bits) e[who] = bits;
    else delete e[who];
    if (Object.keys(e).length) g[path] = e;
    else delete g[path];
    const n = Object.values(g).reduce((t, x) => t + Object.keys(x).length, 0);
    if (n > NB_GRANTS) return false;
    mine.g = g;
  }
  by[me] = mine;
  s.nbp = { at: s.startedAt, by };
  return true;
}

/* the rights viewer has on a path in owner's folder ("d/b.num"): what was given on it and on every folder over it, to
   them, to everyone, or to a group they're in; "rwx", "r--" … (the owner has them all) */
export function nbRights(s, owner, path, viewer) {
  if (owner === viewer) return "rwx";
  const g = nbBy(s, owner).g || {},
    parts = String(path).split("/").filter(Boolean),
    mine = groupsOf(s, viewer);
  let got = "";
  for (let i = 0; i <= parts.length; i++) {
    const e = g[parts.slice(0, i).join("/")];
    if (!e) continue;
    for (const [who, b] of Object.entries(e))
      if (
        who === viewer ||
        who === "@o" ||
        (who.startsWith("@g:") && mine.includes(who.slice(3)))
      )
        got += b;
  }
  return ["r", "w", "x"].map((c) => (got.includes(c) ? c : "-")).join("");
}

/* the rights given on exactly this path: [[who, bits]] (players, @o, @g:group) */
export const nbGiven = (s, owner, path) =>
  Object.entries((nbBy(s, owner).g || {})[path] || {});

/* ---------- shared copies (part B): "players cannot read your files OR write OR execute unless you give them
   persmission". A file stays on its owner's device; once someone else may read or run it, the owner's device puts a
   copy in the room (s.nbs, for this Sandbox only, like s.nbp): { at, by: { owner: { path: { t: text, w: who wrote it
   last, n: how many times someone else wrote it } } } }. A player with w writes the copy, and the owner's device saves
   it into the owner's own file (so writing needs the owner in the room) ---------- */
export const NBS_FILES = 20; // (copies one player has in the room, like Brains)
export const NBS_TEXT = 8000; // (letters in each)
const NAME_OK = /^[\w.-]{1,40}$/;

const copiesOf = (s) =>
  s && s.nbs && s.nbs.at === s.startedAt ? s.nbs.by || {} : {};
/* one copy: { t, w, n }, or null */
export const nbCopy = (s, owner, path) =>
  (copiesOf(s)[owner] || {})[path] || null;
/* every copy one owner has in the room: { path: { t, w, n } } */
export const nbCopies = (s, owner) => copiesOf(s)[owner] || {};

/* does anyone but the owner have r or x on this path (on it or a folder over it)? Then its copy goes to the room */
export function nbOut(s, owner, path) {
  const g = nbBy(s, owner).g || {},
    parts = String(path).split("/").filter(Boolean);
  for (let i = 0; i <= parts.length; i++)
    for (const b of Object.values(g[parts.slice(0, i).join("/")] || {}))
      if (/[rx]/.test(b)) return true;
  return false;
}

/* { t: "nbs", files: { path: text }, seen: { path: n } }: the owner's copies, all of them (what isn't there goes,
   except a write the owner's device hadn't seen yet). { t: "nbw", owner, path, text }: a write by one with w */
export function nbShareAct(s, a) {
  const me = a.id;
  if (!isSb(s) || !s.players[me]) return false;
  const by = { ...copiesOf(s) };
  if (a.t === "nbs") {
    if (!a.files || typeof a.files !== "object") return false;
    const cur = by[me] || {},
      seen = a.seen && typeof a.seen === "object" ? a.seen : {},
      next = {};
    for (const [path, e] of Object.entries(cur))
      if (e.w !== me && e.n > (+seen[path] || 0)) next[path] = e; // (a write still on its way to me)
    for (const [path, text] of Object.entries(a.files)) {
      if (Object.keys(next).length >= NBS_FILES) break;
      if (!PATH_OK(path) || !path || next[path] || !nbOut(s, me, path))
        continue;
      next[path] = {
        t: String(text ?? "").slice(0, NBS_TEXT),
        w: me,
        n: (cur[path] || {}).n || 0,
      };
    }
    if (Object.keys(next).length) by[me] = next;
    else delete by[me];
  } else {
    const owner = String(a.owner || ""),
      path = String(a.path || ""),
      text = a.text;
    if (owner === me || !s.players[owner] || s.players[owner].bot) return false;
    if (!PATH_OK(path) || !path || !NAME_OK.test(path.split("/").pop()))
      return false;
    if (typeof text !== "string" || text.length > NBS_TEXT) return false;
    if (!nbRights(s, owner, path, me).includes("w")) return false;
    const cur = { ...(by[owner] || {}) };
    if (!cur[path] && Object.keys(cur).length >= NBS_FILES) return false;
    if (cur[path] && cur[path].t === text) return false; // (the same words: nothing for the owner to save)
    cur[path] = { t: text, w: me, n: ((cur[path] || {}).n || 0) + 1 };
    by[owner] = cur;
  }
  s.nbs = { at: s.startedAt, by };
  return true;
}
