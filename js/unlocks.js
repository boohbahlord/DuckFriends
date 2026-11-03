/* ---------- things you unlock ----------
   Some items start locked, every count in twelves (I want them all in factors of 12). The jester hat and outfit open at
   1,728 jumps, Jack in a Box (and Jill) at 20,736; the secret code (secret 1357911 on) opens every unlockable at once, and the counts toward each one go on as before. The Long jump and the Double
   jump open at 144 jumps. The clown wig, costume and paint open when you've killed Justin with a weapon special 12
   times, and until then nobody is told how. The shotgun opens at 144 kills and the grenade at 360: a kill is another
   player knocked down with a weapon (a computer doesn't count), or any Justin. The dunce hat opens once you've been
   voted a dunce in Duncelation 12 times (TEST rooms don't count). The lightning eyes open once you've beaten Mad God
   Justin 12 times at the default time, and the Tears eyes after losing to him 24 times or losing 144 rounds (TEST rooms
   don't count either). Dat Boi opens at 1,728 jumps and his ranks after him: bronze at 5,184, silver and chrome at 15,552,
   gold and rose gold at 31,104, rainbow at 62,208. The Short jump opens at 1,728 jumps; the Chair at 1,123 Justin kills
   in Duck Cabin (Hangout); the Invisible duck once you've hit the cabin's shadow duck with a thrown chair; the Zebra cake
   once you've beaten Justin 72 times (any Justin, any weapon, Mad God Justin's wins too). What counts lives in the
   profile (so it stays on the device and the account): jumps, justinKills, cabinKills, shadowHits, kills, dunced,
   mgjWins, mgjLosses, lostRounds, secrets (the codes turned on) and unlockSeen (the unlocks already announced, so each
   "Unlocked!" shows once). */
import { profile, save } from "./store.js";
import { fmtJumps } from "./format.js";
import { toast } from "./ui.js";

const CODE = "1357911";
export const LOCKS = [
  { kind: "hat", id: "jester", jumps: 1728, code: CODE, name: "Jester hat" },
  {
    kind: "outfit",
    id: "jester",
    jumps: 1728,
    code: CODE,
    name: "Jester outfit",
  },
  {
    kind: "style",
    id: "jack",
    jumps: 20736,
    code: CODE,
    name: "Jack in a Box",
  },
  { kind: "style", id: "datboi", jumps: 1728, name: "Dat Boi" },
  /* Dat Boi's ranks, each 1,728 more as the owner set them (silver and chrome together, gold and rose gold together) */
  { kind: "rank", id: "bronze", jumps: 5184, name: "Dat Boi, bronze" },
  { kind: "rank", id: "silver", jumps: 15552, name: "Dat Boi, silver" },
  { kind: "rank", id: "chrome", jumps: 15552, name: "Dat Boi, chrome" },
  { kind: "rank", id: "gold", jumps: 31104, name: "Dat Boi, gold" },
  { kind: "rank", id: "rose", jumps: 31104, name: "Dat Boi, rose gold" },
  { kind: "rank", id: "rainbow", jumps: 62208, name: "Dat Boi, rainbow" },
  { kind: "special", id: "longjump", jumps: 144, name: "Long jump" },
  { kind: "special", id: "double", jumps: 144, name: "Double jump" },
  { kind: "special", id: "shortjump", jumps: 1728, name: "Short jump" },
  { kind: "special", id: "chair", cabin: 1123, name: "Chair" },
  { kind: "special", id: "invisible", shadow: 1, name: "Invisible duck" },
  { kind: "special", id: "zebra", kills: 72, name: "Zebra cake" },
  { kind: "special", id: "shotgun", frags: 144, name: "Shotgun" },
  { kind: "special", id: "grenade", frags: 360, name: "Grenade" },
  { kind: "hat", id: "clownwig", kills: 12, hidden: true, name: "Clown wig" },
  {
    kind: "outfit",
    id: "clown",
    kills: 12,
    hidden: true,
    name: "Clown costume",
  },
  {
    kind: "face",
    id: "clownpaint",
    kills: 12,
    hidden: true,
    name: "Clown paint",
  },
  { kind: "hat", id: "dunce", dunced: 12, name: "Dunce hat" },
  { kind: "eyes", id: "lightning", mgjWins: 12, name: "Lightning eyes" },
  { kind: "eyes", id: "tears", mgjLosses: 24, lost: 144, name: "Tears" }, // (lose to Mad God Justin 24 times, or lose 144 rounds)
];
const lockOf = (kind, id) => LOCKS.find((l) => l.kind === kind && l.id === id);
const earned = (l) =>
  l.cabin
    ? (profile.cabinKills || 0) >= l.cabin
    : l.shadow
      ? (profile.shadowHits || 0) >= l.shadow
      : earnedElse(l);
const earnedElse = (l) =>
  l.jumps
    ? (profile.jumps || 0) >= l.jumps
    : l.mgjLosses
      ? (profile.mgjLosses || 0) >= l.mgjLosses ||
        (profile.lostRounds || 0) >= l.lost
      : l.frags
        ? (profile.kills || 0) >= l.frags
        : l.mgjWins
          ? (profile.mgjWins || 0) >= l.mgjWins
          : l.dunced
            ? (profile.dunced || 0) >= l.dunced
            : (profile.justinKills || 0) >= l.kills;
/* the secret code opens every unlockable at once; what you've earned still counts on toward each one */
const coded = () => !!(profile.secrets || {})[CODE];
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
    return l.cabin
      ? `Unlocked: ${fmtJumps(l.cabin)} Justin kills in Duck Cabin`
      : l.shadow
        ? "Unlocked: you hit the shadow duck with a chair"
        : l.kills && !l.hidden
          ? `Unlocked: you beat Justin ${l.kills} times`
          : l.jumps
            ? `Unlocked: ${fmtJumps(l.jumps)} jumps`
            : l.mgjLosses
              ? (profile.mgjLosses || 0) >= l.mgjLosses
                ? `Unlocked: lost to Mad God Justin ${l.mgjLosses} times`
                : `Unlocked: lost ${l.lost} rounds`
              : l.frags
                ? `Unlocked: ${l.frags} kills`
                : l.mgjWins
                  ? `Unlocked: beat Mad God Justin ${l.mgjWins} times`
                  : l.dunced
                    ? `Unlocked: voted a dunce ${l.dunced} times`
                    : `Unlocked: you killed Justin with a weapon ${l.kills} times`;
  const pre = coded(l) ? "Unlocked: a secret code. " : "";
  if (l.frags)
    return `${pre}Knock down ${l.frags} players with a weapon (any Justin counts) (${Math.min(l.frags, profile.kills || 0)}/${l.frags})`;
  if (l.mgjLosses)
    return `${pre}Lose to Mad God Justin ${l.mgjLosses} times (${Math.min(l.mgjLosses, profile.mgjLosses || 0)}/${l.mgjLosses}), or lose ${l.lost} rounds (${Math.min(l.lost, profile.lostRounds || 0)}/${l.lost})`;
  if (l.mgjWins)
    return `${pre}Beat Mad God Justin ${l.mgjWins} times at the default time (${Math.min(l.mgjWins, profile.mgjWins || 0)}/${l.mgjWins})`;
  if (l.dunced)
    return `${pre}Be voted a dunce in Duncelation ${l.dunced} times (${Math.min(l.dunced, profile.dunced || 0)}/${l.dunced})`;
  if (l.cabin)
    return `${pre}Kill Justin ${fmtJumps(l.cabin)} times in Duck Cabin, in Hangout (${fmtJumps(Math.min(l.cabin, profile.cabinKills || 0))}/${fmtJumps(l.cabin)})`;
  if (l.shadow)
    return `${pre}Hit the shadow duck in Duck Cabin with a thrown chair`;
  if (l.kills && !l.hidden)
    return `${pre}Beat Justin ${l.kills} times, any Justin, any weapon (${Math.min(l.kills, profile.justinKills || 0)}/${l.kills})`;
  return l.hidden
    ? pre.trim() || "You don't know how to unlock this."
    : `${pre}Reach ${fmtJumps(l.jumps)} jumps (you have ${fmtJumps(profile.jumps || 0)})`;
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
/* a Justin kill with a weapon special, seen on your own device; or a Mad God Justin win I was in the fight for. Noah's
   brown Justin-costume duck (Rainbow Ducks) never counts: it's a player, so knocking it down is a player kill */
export function countJustinKill() {
  profile.justinKills = (profile.justinKills || 0) + 1;
  save();
  checkUnlocks();
  document.dispatchEvent(new Event("jumpsbox"));
}
/* is Justin in this room's game: the Justin option (not in Valentine's Duck Date or Left 4 Dead Ducks), Mad God Justin,
   or Hangout, where he lives */
export const justinIn = (s) =>
  !!s &&
  !!s.options &&
  (["mgj", "hang"].includes(s.options.mode) ||
    (!!s.options.justin && !["vdd", "l4dd"].includes(s.options.mode)));
/* another player (not a computer) or Justin knocked down by me with a weapon: toward the shotgun and the grenade */
function countKill() {
  profile.kills = (profile.kills || 0) + 1;
  save();
  checkUnlocks();
}
/* a room's kills (the rules' s.pk, numbered by s.pkN, and Justin's s.jk, numbered by s.jkN): mine count, each once;
   what happened before I joined doesn't. The same for Duncelation's dunces (s.dn.dk, numbered by s.dn.dkN): me voted a dunce,
   outside TEST rooms; and Mad God Justin's wins (s.mgjWins, numbered by s.mgjWinN) I played in */
export function watchKills(room) {
  let seen = null,
    seenD = null,
    seenW = null,
    seenL = null,
    seenP = null,
    seenS = null,
    jin = null;
  room.on(() => {
    const s = room.state,
      topP = (s && s.pkN) || 0;
    if (justinIn(s) !== jin) {
      jin = justinIn(s);
      document.dispatchEvent(new Event("jumpsbox"));
    } // (the Justin Kills line comes and goes with him)
    if (seenP === null || topP < seenP) seenP = topP;
    else {
      for (const k of (s && s.pk) || [])
        if (
          k.n > seenP &&
          k.by === room.me &&
          !((s.players || {})[k.id] || {}).bot
        )
          countKill();
      seenP = topP;
    }
    const top = (s && s.jkN) || 0,
      dn = (s && s.dn) || {},
      topD = dn.dkN || 0,
      topW = (s && s.mgjWinN) || 0,
      topL = (s && s.lossN) || 0;
    if (seenL === null || topL < seenL) seenL = topL;
    else {
      for (const k of (s && s.losses) || [])
        if (k.n > seenL && (k.ids || []).includes(room.me) && !s.test) {
          profile.lostRounds = (profile.lostRounds || 0) + 1;
          if (k.k === "mgj") profile.mgjLosses = (profile.mgjLosses || 0) + 1;
          save();
          checkUnlocks();
        }
      seenL = topL;
    } // (a clear loss: rules.js lostRound)
    if (seenW === null || topW < seenW) seenW = topW;
    else {
      for (const k of (s && s.mgjWins) || [])
        if (k.n > seenW && (k.ids || []).includes(room.me)) {
          if (k.def && !s.test) {
            profile.mgjWins = (profile.mgjWins || 0) + 1;
            save();
          }
          countJustinKill(); // (a win is a Justin kill for every duck in the fight, at any time)
        }
      seenW = topW;
    }
    const topS = (s && s.shkN) || 0;
    if (seenS === null || topS < seenS) seenS = topS;
    else {
      for (const k of (s && s.shk) || [])
        if (k.n > seenS && k.by === room.me) {
          profile.shadowHits = (profile.shadowHits || 0) + 1;
          save();
          checkUnlocks();
        }
      seenS = topS;
    } // (the shadow duck hit with my thrown chair: hangout/characters.js)
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
      if (k.n > seen && k.by === room.me) {
        if (s.options && s.options.mode === "hang")
          profile.cabinKills = (profile.cabinKills || 0) + 1; // (Duck Cabin's Justin, in Hangout: toward the Chair)
        countKill();
        countJustinKill();
      }
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
  if (
    Array.isArray(D.keys) &&
    D.keys.some((k) => k && !unlocked("special", k))
  ) {
    D.keys = D.keys.map((k) => {
      if (!k || unlocked("special", k)) return k;
      off.push(lockOf("special", k).name);
      return null;
    });
  } // (a special that's locked comes off its key)
  if (D.rank && !unlocked("rank", D.rank)) {
    off.push(lockOf("rank", D.rank).name);
    D.rank = null;
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
