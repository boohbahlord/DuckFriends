/* ---------- Sandbox: God mode and invisibility, for yourself or for a player (the owner's, Nov 19 21:59Z and 23:17Z) ----------
   "God mode ... in player settings in the top row for key number 1 ... it's just for yourself ... enemies don't target
   you, they ignore you, and you don't die." Under it: unlimited ammo, unlimited items, no reloading ("it's all under the
   God mode settings", "if you enable God mode ... a bunch of things turned on all at once"). Below it: invisible ("you
   see yourself as a transparent being ... to everyone else, they cannot see you or the weapons you hold or your
   flashlight or your laser sight or anything"). One permission lets other players use both on themselves, and the last
   row of P changes any one player's settings.
   s.sb.gd = { player id: { god: 1, ammo: 1, items: 1, reload: 1, inv: 1 } }, s.sb.gperm = 1: players may switch
   their own God mode and invisibility. The action: { t: "sbg", k: "god" | "ammo" | "items" | "reload" | "inv", on, who }
   (who: a player; left out is myself) or { t: "sbg", perm: true, on } (the rights only). */
import { isSb, sbCan } from "./sandboxrules.js";

/* the switches under God mode, and what each does */
export const GOD_SW = [
  ["ammo", "Unlimited ammo"],
  ["items", "Unlimited items"],
  ["reload", "No reloading"],
];
const KEYS = ["god", "ammo", "items", "reload", "inv"];
const gd = (s, id) => (((s || {}).sb || {}).gd || {})[id] || {};
/* may player id switch their own God mode and invisibility: the rights, or the permission given (Sandbox only) */
export const godMay = (s, id) =>
  isSb(s) && !!id && (sbCan(s, id) || !!(s.sb && s.sb.gperm));
export const godOn = (s, id) => isSb(s) && !!gd(s, id).god;
/* one of God mode's switches, counted only while God mode is on */
export const godHas = (s, id, k) => godOn(s, id) && !!gd(s, id)[k];
export const invOn = (s, id) => isSb(s) && !!gd(s, id).inv;

/* an action: true when something changed */
export function sbGodAct(s, a) {
  if (!isSb(s) || !a || !s.players[a.id]) return false;
  const sb = s.sb || {};
  if (a.perm) {
    if (!sbCan(s, a.id)) return false;
    const on = !!a.on;
    if (!!sb.gperm === on) return false;
    s.sb = { ...sb, gperm: on ? 1 : 0 };
    return true;
  }
  const k = a.k,
    who = a.who || a.id;
  if (!KEYS.includes(k) || !s.players[who]) return false;
  /* myself: the rights or the permission; another player: the rights (the last row of P) */
  if (who === a.id ? !godMay(s, a.id) : !sbCan(s, a.id)) return false;
  if (s.players[who].bot) return false;
  const now = { ...gd(s, who) },
    on = !!a.on;
  if (!!now[k] === on) return false;
  if (on) now[k] = 1;
  else delete now[k];
  if (k === "god" && on) for (const [w] of GOD_SW) now[w] = 1; // (God mode on: the switches under it all on at once)
  if (k === "god" && !on) for (const [w] of GOD_SW) delete now[w];
  s.sb = { ...sb, gd: { ...(sb.gd || {}), [who]: now } };
  return true;
}
