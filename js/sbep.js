/* ---------- Sandbox Phase 7: what other players may do with my made NPCs and groups (P), the rules ----------
   My words (Nov 19): "they can select it to where other players can input them into other spawn points or zones or
   whatnot and other selections. And then that would be a player setting feature ... in player settings for P. And it
   can be selected on if they can change the code for those things within the sandbox. Then another permission setting
   to if they can ... change the entity settings in maker mode when they're giving the permission to. And it's only for
   that sandbox, but you can give another permission that says they can do it to your entities on your files. And that
   is advised against in the game."
   - u: may put my made NPCs and groups in their spawns, zones and lists (everyone, as it always was, until I say no);
   - m: may change my NPCs in M and my groups in G, in this Sandbox only (nobody until I say so);
   - f: may change my NPCs on my device too: what they change in M comes back into my own saved NPCs (nobody; advised
     against). The code (my brain files) is Seriat's own rights on my my-files folder (nbperms.js), set from the same
     window (sbepview.js).
   s.sbep = { at: the Sandbox's start, by: { owner: { u|m|f: { "@o" (everyone) or a player's id: 1 } } } }: like every
   right, kept for this Sandbox only, so a new Sandbox starts with none. A made NPC's owner is who brought it into the
   room first (s.sb.cn[id].by, sbspawn.js); a group's, who made it (s.sb.gr[id].by, sbgroups.js). */
import { isSb } from "./sandboxrules.js";

export const EP_KINDS = ["u", "m", "f"];
const all = (s) =>
  s && s.sbep && s.sbep.at === s.startedAt ? s.sbep.by || {} : {};
/* who owner lets do k: { who: 1 } */
export const epOf = (s, owner, k) =>
  (all(s)[owner] || {})[k] || (k === "u" ? { "@o": 1 } : {});
/* may viewer do k to what owner made? (no owner, or the owner gone from the room: it can still be used) */
export function epMay(s, owner, viewer, k) {
  if (!owner || owner === viewer) return true;
  if (!s || !s.players[owner]) return k === "u";
  const e = epOf(s, owner, k);
  return !!(e["@o"] || e[viewer]);
}
/* { t: "sbep", k, who, on }: a right I give ("@o" everyone, or a player) or take back */
export function epAct(s, a) {
  if (!isSb(s) || !s.players[a.id] || s.players[a.id].bot) return false;
  const k = String(a.k || ""),
    who = String(a.who || "");
  if (!EP_KINDS.includes(k)) return false;
  if (
    !(who === "@o" || (who !== a.id && s.players[who] && !s.players[who].bot))
  )
    return false;
  const by = { ...all(s) },
    mine = { ...(by[a.id] || {}) },
    e = { ...epOf(s, a.id, k) };
  if (a.on) e[who] = 1;
  else delete e[who];
  mine[k] = e;
  by[a.id] = mine;
  s.sbep = { at: s.startedAt, by };
  return true;
}
