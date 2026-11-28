/* ---------- room governance: groups and permissions (sudo), and Democracy of Ducklings (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import { advance, humanIds, isHang, say, sayFloat, turnKey } from "./rules.js";
import { DOWN_OK, DEAD_STILL } from "./hangout/death.js";

import { npcById } from "./npcs.js";

import { isWorldMap } from "./maps.js";

/* ---------- groups, permissions and forgame (the command line's sudo commands) ----------
   sudo: may run usermod, groupadd, groupdel and forgame; the host is always in it. dumbasses: no silly commands, and one
   chat message every 15 seconds. A group made with groupadd takes any of: nocmd (no command line), nochat (no text
   chat), nofun (no silly commands), slow (one message every 15 seconds). */
export const GROUP_PERMS = [
  "nocmd",
  "nochat",
  "nosend",
  "nofun",
  "nomute",
  "slow",
  "canskip",
  "canmute",
  "cankick",
  "cansettings",
  "canhomes",
];
export const permOk = (p) =>
  GROUP_PERMS.includes(p) || /^slow([5-9]|[1-9]\d|[1-5]\d\d|600)$/.test(p); // slow30: one message every 30 s (5 to 600)
const SLOW_MS = 15000;
export function groupsOf0(s) {
  // the room's groups, made on first use
  if (!s.groups)
    s.groups = {
      sudo: { perms: [], members: [] },
      dumbasses: { perms: ["nofun", "slow"], members: [] },
    };
  return s.groups;
}
/* ---------- Democracy of Ducklings (owner 2026-11-03): the ducks vote on the room's rules, in the lobby ----------
   A rule passes with 2 of 3 ducks; New host takes every duck but the host, and the host can't vote on it. The host turns
   a rule on, or hands the host over, directly. A rule that is on goes off again by another vote. A vote lasts 60 s, and
   while one is up the host can't start the game. The room has it or not from the moment it's made (options.dod) */
export const DOD_KEYS = ["ready", "vote", "justin", "settings", "sudo", "host"];
export const DOD_NAMES = {
  ready: "Host must ready",
  vote: "Ducks Vote Mode & Game",
  justin: "Invite Justin",
  settings: "Everyone can change settings",
  sudo: "Sudo Perms",
  host: "New host",
};
export const DOD_MS = 60000;
export const dodRoom = (s) => +(s.options || {}).dod === 1;
export const dodOn = (s, k) => dodRoom(s) && !!((s.dod || {}).on || {})[k];
export const dodVoting = (s) =>
  dodRoom(s) && Object.keys((s.dod || {}).votes || {}).length > 0;
/* the votes a rule needs: 2 of 3 of the ducks (computers don't vote), or for New host every duck but the host */
export const dodNeed = (s, k) =>
  k === "host"
    ? humanIds(s).filter((id) => id !== s.hostId).length
    : Math.ceil((humanIds(s).length * 2) / 3 - 1e-9);
/* a vote's count so far; for New host, the most votes any one duck has (and who that is) */
export function dodCount(s, k) {
  const by = (((s.dod || {}).votes || {})[k] || {}).by || {};
  if (k !== "host") return { n: Object.keys(by).length, to: null };
  const n = {};
  for (const c of Object.values(by)) n[c] = (n[c] || 0) + 1;
  const to = Object.keys(n).sort((x, y) => n[y] - n[x])[0] || null;
  return { n: to ? n[to] : 0, to };
}
/* a rule takes effect (or goes off); New host: the duck it names becomes the host */
export function dodSet(s, k, on, to = null) {
  if (k === "host") {
    s.hostId = to;
    say(s, `Democracy of Ducklings: ${s.players[to].name} is the new host.`);
    return;
  }
  const rules = { ...(s.dod.on || {}) };
  if (on) rules[k] = true;
  else delete rules[k];
  s.dod.on = rules;
  if (on && k === "vote") {
    // (Vote Mode & Map on, both votes, and locked: the game and the map come from the votes)
    const o = s.options;
    o.modePick = o.mapPick = "vote";
    if (o.voteBack === undefined) o.voteBack = 3;
    if (isHang(s)) o.mode = "aod";
    if (isWorldMap(o.map)) o.map = "board";
  }
  if (on && k === "justin") s.options.justin = 1; // (Justin in every game he can be in)
  say(s, `Democracy of Ducklings: ${DOD_NAMES[k]} is ${on ? "on" : "off"}.`);
}
/* votes from ducks who left (or for one who left) are dropped, a vote with enough votes passes, and one that has run 60 s
   ends; true when anything changed */
export function dodSettle(s, now) {
  const votes = (s.dod || {}).votes;
  if (!votes) return false;
  let changed = false;
  for (const [k, x] of Object.entries(votes)) {
    for (const [id, c] of Object.entries(x.by)) {
      const gone =
        !s.players[id] ||
        (k === "host" && (id === s.hostId || !s.players[c] || c === s.hostId));
      if (gone) {
        delete x.by[id];
        changed = true;
      }
    }
    const { n, to } = dodCount(s, k),
      need = dodNeed(s, k);
    if (n && need && n >= need) {
      dodSet(s, k, !dodOn(s, k), to);
      delete votes[k];
      changed = true;
    } else if (!n || now >= x.at + DOD_MS) {
      if (n)
        say(
          s,
          `Democracy of Ducklings: the vote on ${DOD_NAMES[k]} ran out of time.`,
        );
      delete votes[k];
      changed = true;
    }
  }
  return changed;
}
/* the game starts by itself once 2 of 3 of the ducks are ready (owner 2026-11-03 08:03Z): with Host must ready on, or
   after the host readied during a vote */
export const dodStarts = (s) =>
  s.phase === "lobby" &&
  !dodVoting(s) &&
  (dodOn(s, "ready") || !!(s.players[s.hostId] || {}).ready) &&
  humanIds(s).filter((id) => s.players[id].ready).length >= dodNeed(s, "ready");
export const groupsOf = (s, id) => {
  const out =
    id === s.hostId || (dodOn(s, "sudo") && s.players[id] && !s.players[id].bot)
      ? ["sudo"]
      : [];
  for (const [name, g] of Object.entries(
    s.groups || { dumbasses: { perms: ["nofun", "slow"], members: [] } },
  ))
    if ((g.members || []).includes(id) && !out.includes(name)) out.push(name);
  return out;
};
export const isSudo = (s, id) => groupsOf(s, id).includes("sudo");
/* the lobby's No Chat and No Terminal settings take chat and the command line away from everyone, the host too */
export const denied = (s, id, perm) =>
  (perm === "nochat" && +s.options.noChat === 1) ||
  (perm === "nocmd" && +s.options.noTerm === 1) ||
  groupsOf(s, id).some((n) =>
    (((s.groups || {})[n] || {}).perms || []).includes(perm),
  );
/* a perm that gives part of the host's job (canskip, canmute, cankick, cansettings): sudo has them all */
export const may = (s, id, perm) =>
  !!s.players[id] && (isSudo(s, id) || denied(s, id, perm));
/* how long this player waits between chat messages (0: no wait) */
export function slowMs(s, id) {
  let ms = 0;
  for (const n of groupsOf(s, id))
    for (const p of ((s.groups || {})[n] || {}).perms || []) {
      const m = p.match(/^slow(\d*)$/);
      if (m) ms = Math.max(ms, m[1] ? +m[1] * 1000 : SLOW_MS);
    }
  return ms;
}
/* may this player open a file someone sent from the command line? its sender, sudo, its group (chmod g+r), or everyone (o+r) */
export const canOpen = (s, id, m) =>
  !m.file ||
  m.from === id ||
  isSudo(s, id) ||
  !!m.pub ||
  (!!m.grp && groupsOf(s, id).includes(m.grp));
/* the stage a phase belongs to, and the running count of turns and of each stage (for forgame's timed mutes) */
export const STAGE = {
  dunced: "discussing",
  vdprompt: "writing",
  vddate: "discussing",
  vdpick: "voting",
  vddown: "discussing",
  vdval: "stats",
  tvwrite: "writing",
  tvq: "voting",
  tvw: "writing",
  tvg: "voting",
  tvr: "discussing",
  lobby: "lobby",
  countdown: "lobby",
  over: "stats",
  submit: "writing",
  topic: "writing",
  seeds: "writing",
  words: "writing",
  write: "writing",
  answer: "voting",
  tvote: "voting",
  tie: "voting",
  lvote: "voting",
  wvote: "voting",
  counsel: "voting",
  lawdef: "voting",
  lawoff: "voting",
  discuss: "discussing",
  bracket: "discussing",
  results: "stats",
  podium: "stats",
  wqpick: "writing",
  clue: "discussing",
  choice: "voting",
  accuse: "voting",
  reveal: "discussing",
  hang: "discussing",
};
export function countTurn(s, was) {
  const k = turnKey(s);
  if (k !== s.lastTurn) {
    s.lastTurn = k;
    s.turnN = (s.turnN || 0) + 1;
  }
  const st = STAGE[s.phase];
  if (st !== was)
    s.stageN = { ...(s.stageN || {}), [st]: ((s.stageN || {})[st] || 0) + 1 };
}
/* forgame: the game's timers and turn share mid-game, or mutes that everyone sees, for good, for a number of turns, or
   in some stages (stage2 voting: the next two voting stages) */
const TIME_OK = [0, 15, 30, 45, 60, 90, 120, 132],
  SHARE_OK = [0.5, 0.67, 0.75, 1],
  MUTE_KINDS = ["bubble", "ping", "text"];
export function forgame(s, a, now) {
  const me = s.players[a.id];
  if (!me || s.phase === "lobby") return null;
  if (a.set) {
    if (!may(s, a.id, "cansettings")) return null;
    const o = {};
    for (const [k, v] of Object.entries(a.set)) {
      if (k === "order" && ["random", "rotate"].includes(v)) o.order = v;
      if (
        [
          "freeRoam",
          "fun",
          "justin",
          "ghosts",
          "ghostBusy",
          "discuss",
          "unvoteStops",
        ].includes(k)
      )
        o[k] = v ? 1 : 0;
      if (k === "justin" && ["l4dd", "surv"].includes(s.options.mode))
        delete o[k]; // (never Justin on the board in Quacky Zombies: the owner's, Nov 4)
      if (k === "share" && SHARE_OK.includes(v)) o.share = v;
      if (
        ["catchUp", "writeCatch", "answerTime", "submitTime"].includes(k) &&
        TIME_OK.includes(v)
      )
        o[k] = v;
      if (k === "answerOff") o.answerOff = v ? 1 : 0;
      if (
        k === "downMs" &&
        DOWN_OK.includes(v) &&
        (v !== DEAD_STILL || isHang(s))
      )
        o.downMs = v;
    }
    if (!Object.keys(o).length) return null;
    Object.assign(s.options, o);
    if (o.catchUp === 0 || o.writeCatch === 0) s.catchEnds = 0;
    if (o.answerOff && s.phase === "answer") {
      s.lordTime = 0;
      s.ends = 0;
    }
    if (o.submitTime === 0 && ["submit", "topic", "seeds"].includes(s.phase))
      s.ends = 0;
    const said = (k, v) =>
      k === "share"
        ? `turn ends with ${v === 1 ? "everyone" : `${Math.round(v * 100)}%`}`
        : k === "answerOff"
          ? `answer timer ${v ? "off" : "on"}`
          : k === "order"
            ? `question order ${v}`
            : k === "downMs"
              ? `knocked down for ${v ? v / 1000 + " s" : "no time"}`
              : k === "justin"
                ? `Justin ${v ? "on" : "off"}`
                : k === "ghosts"
                  ? `ghosts ${v ? "on" : "off"}`
                  : k === "ghostBusy"
                    ? `no ghosts while busy ${v ? "on" : "off"}`
                    : k === "discuss"
                      ? `discussion round ${v ? "on" : "off"}`
                      : k === "unvoteStops"
                        ? `unvoting ${v ? "stops" : "doesn't stop"} the countdown`
                        : k === "freeRoam" || k === "fun"
                          ? `${k === "fun" ? "silly commands" : "free roam"} ${v ? "on" : "off"}`
                          : `${{ catchUp: "catch-up timer", writeCatch: "writing catch-up timer", answerTime: "answer timer", submitTime: "writing timer" }[k]} ${v ? v + " s" : "off"}`;
    sayFloat(
      s,
      `${me.name} changed the game: ${Object.entries(o)
        .map(([k, v]) => said(k, v))
        .join(", ")}.`,
      a.id,
    );
    return advance(s, now);
  }
  const m = a.mute;
  if (!m || !may(s, a.id, "canmute")) return null;
  const who = (m.who || []).filter((id) => s.players[id] || npcById(id)),
    kinds = (m.kinds || []).filter((k) => MUTE_KINDS.includes(k));
  const stages = (m.stages || []).filter((x) =>
      Object.values(STAGE).includes(x),
    ),
    turns = Math.max(0, Math.min(99, m.turns | 0)),
    count = Math.max(0, Math.min(99, m.count | 0));
  if (!who.length || !kinds.length) return null;
  if (!m.on && !turns && !stages.length)
    s.gmutes = (s.gmutes || [])
      .map((x) => ({ ...x, who: x.who.filter((id) => !who.includes(id)) }))
      .filter((x) => x.who.length);
  // off for good: drop them
  else
    s.gmutes = [
      ...(s.gmutes || []),
      {
        who,
        kinds,
        on: !!m.on,
        turns,
        stages,
        count,
        t0: s.turnN || 0,
        s0: { ...(s.stageN || {}) },
        cur: STAGE[s.phase],
      },
    ].slice(-40);
  say(
    s,
    `${me.name} ${m.on ? "muted" : "unmuted"} ${kinds.join(", ")} for ${who.map((id) => (s.players[id] || npcById(id)).name).join(", ")}${turns ? ` for ${turns} turn${turns > 1 ? "s" : ""}` : ""}${stages.length ? ` in ${count ? `the next ${count} ` : "the "}${stages.join(", ")} stage${count === 1 && stages.length === 1 ? "" : "s"}` : ""}.`,
  );
  return s;
}
/* is this player's bubble, ping or text muted for everyone now (by forgame)? the newest mute that applies wins */
export function gameMuted(s, id, kind) {
  let out = false;
  const st = STAGE[s.phase] || "lobby";
  for (const m of s.gmutes || []) {
    if (!m.who.includes(id) || !m.kinds.includes(kind)) continue;
    if (m.turns && (s.turnN || 0) - m.t0 >= m.turns) continue;
    if (m.stages && m.stages.length) {
      if (!m.stages.includes(st)) continue;
      const k =
        ((s.stageN || {})[st] || 0) -
        ((m.s0 || {})[st] || 0) +
        (m.cur === st ? 1 : 0);
      if (m.count && k > m.count) continue;
    }
    out = m.on;
  }
  return out;
}
