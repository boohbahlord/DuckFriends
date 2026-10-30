/* ---------- things you unlock ----------
   Some items start locked. The jester hat and outfit open at 1,000 jumps, Jack in a Box (and Jill) at 10,000; a secret
   code opens all three at once. The clown wig, costume and paint open when you've killed Justin with a weapon special 10
   times, and until then nobody is told how. The dunce hat opens once you've been voted a dunce in Duncelation 10 times
   (TEST rooms don't count). The lightning eyes open once you've beaten Mad God Justin 10 times (TEST rooms don't count
   either). What counts lives in the profile (so it stays on the device and the
   account): jumps, justinKills, dunced, mgjWins, secrets (the codes turned on) and unlockSeen (the unlocks already announced, so each
   "Unlocked!" shows once). */
import { profile, save } from "./store.js";
import { fmtJumps } from "./format.js";
import { toast } from "./ui.js";

const CODE = "1357911";
export const LOCKS = [
  { kind: "hat", id: "jester", jumps: 1000, code: CODE, name: "Jester hat" },
  {
    kind: "outfit",
    id: "jester",
    jumps: 1000,
    code: CODE,
    name: "Jester outfit",
  },
  {
    kind: "style",
    id: "jack",
    jumps: 10000,
    code: CODE,
    name: "Jack in a Box",
  },
  { kind: "hat", id: "clownwig", kills: 10, hidden: true, name: "Clown wig" },
  {
    kind: "outfit",
    id: "clown",
    kills: 10,
    hidden: true,
    name: "Clown costume",
  },
  {
    kind: "face",
    id: "clownpaint",
    kills: 10,
    hidden: true,
    name: "Clown paint",
  },
  { kind: "hat", id: "dunce", dunced: 10, name: "Dunce hat" },
  { kind: "eyes", id: "lightning", mgjWins: 10, name: "Lightning eyes" },
];
const lockOf = (kind, id) => LOCKS.find((l) => l.kind === kind && l.id === id);
const earned = (l) =>
  l.jumps
    ? (profile.jumps || 0) >= l.jumps
    : l.mgjWins
      ? (profile.mgjWins || 0) >= l.mgjWins
      : l.dunced
        ? (profile.dunced || 0) >= l.dunced
        : (profile.justinKills || 0) >= l.kills;
const coded = (l) => !!(l.code && (profile.secrets || {})[l.code]);
/* is it yours to wear? (anything not in the list always is) */
export function unlocked(kind, id) {
  const l = lockOf(kind, id);
  return !l || earned(l) || coded(l);
}
export const isLocked = (kind, id) => !!lockOf(kind, id);
/* what a tile says: how to unlock it, or how you did */
export function lockHint(kind, id) {
  const l = lockOf(kind, id);
  if (!l) return "";
  if (earned(l))
    return l.jumps
      ? `Unlocked: ${fmtJumps(l.jumps)} jumps`
      : l.mgjWins
        ? `Unlocked: beat Mad God Justin ${l.mgjWins} times`
        : l.dunced
          ? `Unlocked: voted a dunce ${l.dunced} times`
          : "Unlocked: you killed Justin with a weapon 10 times";
  if (coded(l)) return "Unlocked: a secret code";
  if (l.mgjWins)
    return `Beat Mad God Justin ${l.mgjWins} times (${Math.min(l.mgjWins, profile.mgjWins || 0)}/${l.mgjWins})`;
  if (l.dunced)
    return `Be voted a dunce in Duncelation ${l.dunced} times (${Math.min(l.dunced, profile.dunced || 0)}/${l.dunced})`;
  return l.hidden
    ? "You don't know how to unlock this."
    : `Reach ${fmtJumps(l.jumps)} jumps (you have ${fmtJumps(profile.jumps || 0)})`;
}
const and = (xs) =>
  xs.length < 2
    ? xs.join("")
    : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
/* after anything that can unlock (a jump lands, a kill, a code): one "Unlocked!" for what's new */
export function checkUnlocks() {
  const seen = profile.unlockSeen || (profile.unlockSeen = {}),
    fresh = LOCKS.filter(
      (l) => unlocked(l.kind, l.id) && !seen[l.kind + ":" + l.id],
    );
  if (!fresh.length) return;
  for (const l of fresh) seen[l.kind + ":" + l.id] = 1;
  save();
  toast("Unlocked: " + and(fresh.map((l) => l.name)));
}
/* a Justin kill with a weapon special, seen on your own device */
export function countJustinKill() {
  profile.justinKills = (profile.justinKills || 0) + 1;
  save();
  checkUnlocks();
}
/* a room's Justin kills (the rules' s.jk, numbered by s.jkN): mine with a bullet or a dagger count, each once; what
   happened before I joined doesn't. The same for Duncelation's dunces (s.dn.dk, numbered by s.dn.dkN): me voted a dunce,
   outside TEST rooms; and Mad God Justin's wins (s.mgjWins, numbered by s.mgjWinN) I played in */
export function watchKills(room) {
  let seen = null,
    seenD = null,
    seenW = null;
  room.on(() => {
    const s = room.state,
      top = (s && s.jkN) || 0,
      dn = (s && s.dn) || {},
      topD = dn.dkN || 0,
      topW = (s && s.mgjWinN) || 0;
    if (seenW === null || topW < seenW) seenW = topW;
    else {
      for (const k of (s && s.mgjWins) || [])
        if (k.n > seenW && (k.ids || []).includes(room.me) && !s.test) {
          profile.mgjWins = (profile.mgjWins || 0) + 1;
          save();
          checkUnlocks();
        }
      seenW = topW;
    }
    if (seenD === null || topD < seenD) seenD = topD;
    else {
      for (const k of dn.dk || [])
        if (k.n > seenD && k.id === room.me && !s.test) {
          profile.dunced = (profile.dunced || 0) + 1;
          save();
          checkUnlocks();
        }
      seenD = topD;
    }
    if (seen === null || top < seen) {
      seen = top;
      return;
    }
    for (const k of (s && s.jk) || [])
      if (
        k.n > seen &&
        k.by === room.me &&
        (k.w === "handgun" || k.w === "dagger")
      )
        countJustinKill();
    seen = top;
  });
}
/* take off whatever is worn but locked (after a code is turned off); returns what came off */
export function takeOffLocked() {
  const D = profile.duck,
    off = [];
  if (D.hat && !unlocked("hat", D.hat.id)) {
    off.push(lockOf("hat", D.hat.id).name);
    D.hat = null;
  }
  if (D.outfit && !unlocked("outfit", D.outfit.id)) {
    off.push(lockOf("outfit", D.outfit.id).name);
    D.outfit = null;
  }
  if (D.eyes && !unlocked("eyes", D.eyes)) {
    off.push(lockOf("eyes", D.eyes).name);
    D.eyes = "default";
  }
  if (D.face && !unlocked("face", D.face.id)) {
    off.push(lockOf("face", D.face.id).name);
    D.face = null;
  }
  if (D.style && !unlocked("style", D.style)) {
    off.push(D.jill ? "Jill in a Box" : lockOf("style", D.style).name);
    D.style =
      D.prevStyle && unlocked("style", D.prevStyle) ? D.prevStyle : "rubber";
  }
  return off;
}
/* the Secret command: `Secret <code> on|off`; it answers in a line (the caller saves and shares the look) */
export function secret(code, on) {
  if (String(code) !== CODE || (on !== "on" && on !== "off"))
    return "Nothing happens.";
  const S = { ...(profile.secrets || {}) };
  if (on === "on") {
    S[CODE] = 1;
    profile.secrets = S;
    save();
    checkUnlocks();
    return "Unlocked: the jester hat, the jester outfit and Jack in a Box.";
  }
  delete S[CODE];
  profile.secrets = S;
  const off = takeOffLocked(),
    still = LOCKS.filter((l) => l.code === CODE && earned(l)).map(
      (l) => l.name,
    );
  save();
  return (
    "Locked again: the jester hat, the jester outfit and Jack in a Box" +
    (still.length ? ` (except ${and(still)}, earned with jumps)` : "") +
    "." +
    (off.length ? ` ${and(off)} came off.` : "")
  );
}
