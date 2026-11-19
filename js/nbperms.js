/* ---------- Numberat: everyone's home folder, and the rights players give each other (the owner's, Nov 19 16:12Z) ----------
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
import { groupsOf, may } from "./rules.js";
import { isSb } from "./sandboxrules.js";

export const NB_NAMES = 300; // (names one folder shows the room)
export const NB_GRANTS = 200; // (rights one player gives, in all)
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
