/* ---------- Sandbox: which map it plays on, and who may build (stage 1, the shell) ----------
   The owner's Sandbox (Nov 19, /mnt/project-files/sandbox/sandbox-mode-rules.txt and the 01:34Z answers): a mode under
   Special with no rounds that never ends ("Leave Sandbox" at the top left, as in round zero of Dead Ducks Arcade or in
   Hangout), on any map. The simple board maps (Agree or Disagree's kind, whatever the background) are one map: the
   plain board. The maps with a world of their own are walked whole, with everything that map has in its own mode:
   Duck Cabin as in Hangout, Dead Ducks Arcade's cabin and Downpour as in Dead Ducks Arcade, but with no rounds, no
   zombies and no end (s.options.sbMap picks one of those; empty: the board).
   This file has no imports, so every part of the game (the rules, the world's layout, the screen) can ask it. */

/* the worlds Sandbox can be on: the mode whose world it is, and that mode's map */
export const SB_WORLDS = {
  cabin: ["hang", ""],
  zcabin: ["l4dd", ""],
  downpour: ["l4dd", "downpour"],
};
export const SB_WORLD_NAMES = {
  cabin: "Duck Cabin",
  zcabin: "Dead Ducks Arcade's cabin",
  downpour: "Downpour",
};
export const isSb = (s) => !!s && !!s.options && s.options.mode === "sandbox";
/* Sandbox's world (a key of SB_WORLDS), or "" on the board (and in every other mode) */
export const sbWorld = (o) =>
  !!o && o.mode === "sandbox" && SB_WORLDS[o.sbMap] ? o.sbMap : "";
/* the mode whose rules and world run: the room's own, or, in Sandbox on a world, that world's mode ("sandbox" on the
   board) */
export const baseMode = (o) => {
  const w = sbWorld(o);
  return w ? SB_WORLDS[w][0] : (o && o.mode) || "";
};
/* the map that mode is on (Dead Ducks Arcade's Downpour: "downpour") */
export const baseL4map = (o) => {
  if (!o) return "";
  if (o.mode !== "sandbox") return o.l4map;
  const w = sbWorld(o);
  return w ? SB_WORLDS[w][1] : "";
};
/* Sandbox on a world map (it runs as Hangout or Dead Ducks Arcade does there) */
export const sbOnWorld = (s) => isSb(s) && !!sbWorld(s.options);
/* Sandbox on the board: its one phase, "sandbox" */
export const sbOnBoard = (s) => isSb(s) && !sbWorld(s.options);

/* who may build (b), make NPCs (m), write Numerat (n), set the hotbar (h), the game (g) and the players (p): the host;
   everyone when Democracy of Ducklings lets everyone change the settings (the owner's answer 2, Nov 19 01:34Z); and
   whoever the host lets (p, later: s.sb.ok = { id: true }). A new host takes the old one's place at once, since this
   asks who the host is now */
export function sbCan(s, id) {
  if (!isSb(s) || !id || !s.players[id] || s.players[id].bot) return false;
  if (id === s.hostId) return true;
  if (+s.options.dod === 1 && ((s.dod || {}).on || {}).settings) return true; // (rules.js dodOn(s, "settings"))
  return !!(s.sb && s.sb.ok && s.sb.ok[id]);
}
/* a downed duck in Sandbox on Dead Ducks Arcade's maps: back up this long after it bled out (no rounds to wait for) */
export const SB_BACK_MS = 3000;
