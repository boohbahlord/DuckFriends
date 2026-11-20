/* ---------- Sandbox off the zombie maps: out of lives (G's Rules) ----------
   On Duck Cabin and the plain boards a duck that gets up spends a life (rules.js onGetUp) and, out of them, stays down.
   When one setting gets a rule its sibling gets it too (the owner's rule), so the other two Rules about lives work here
   as on the zombie maps: "Out of lives: watch the others" (spectate.js) and "When everyone is out of lives" (keep
   playing, the game over card, back to the lobby, or start over). The zombie maps keep their own (l4ddrules.js). */
import { baseMode, isSb, sbRule } from "./sandboxrules.js";
import { sbPlaceDuck } from "./sbspawn.js";

const OUT_MS = 5000; // (the card shows this long before the lobby or a new start: as rules.js SB_OUT_MS on the zombie maps)
/* Sandbox here, not on the zombie maps */
export const sbOffZ = (s) => !!s && isSb(s) && baseMode(s.options) !== "l4dd";
/* duck id is down for good: out of its lives */
export function sbOut(s, id) {
  const most = sbRule(s, "lives");
  return (
    !!most &&
    !!(s.players[id] || {}).dead &&
    (((s.sb && s.sb.died) || {})[id] || 0) >= most
  );
}
/* everyone back up, no lives spent, each at a respawn (or where it was) */
export function sbAgain(s, now = Date.now()) {
  s.sb = { ...s.sb, died: {} };
  delete s.sb.over;
  const up = { ...(s.up || {}) };
  for (const id of s.seat) {
    const P = s.players[id];
    if (!P) continue;
    delete P.dead;
    delete up[id];
    sbPlaceDuck(s, id, now);
  }
  s.up = up;
}
/* the host's heartbeat: everyone out sets s.sb.over { at, how }; after a moment the lobby ("lobby": rules.js does it) or a
   new start. True when anything changed */
export function sbOutTick(s, now) {
  if (!sbOffZ(s)) return false;
  const o = s.sb && s.sb.over;
  if (o) {
    if (now - o.at < OUT_MS) return false;
    if (o.how === "lobby") return "lobby";
    if (o.how === "again") {
      sbAgain(s, now);
      return true;
    }
    return false;
  }
  const how = sbRule(s, "out"),
    ids = s.seat.filter((id) => s.players[id] && s.pos[id]);
  if (how === "keep" || !ids.length || !ids.every((id) => sbOut(s, id)))
    return false;
  s.sb = { ...s.sb, over: { at: now, how } };
  return true;
}
/* the host's Play again on the game over card */
export function sbAgainAct(s, a, now) {
  if (!sbOffZ(s) || !(s.sb && s.sb.over) || s.hostId !== a.id) return false;
  sbAgain(s, now);
  return true;
}
