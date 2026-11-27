/* ---------- the room's actions (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import {
  GEN_RULES,
  OPTIONS_DEFAULT,
  VOTE_TIME,
  VOTE_MAPS,
  advance,
  applyRules,
  boardPhases,
  cleanModeRules,
  flatOptions,
  genVal,
  goOnDone,
  holdFor,
  holdsBack,
  holdsCase,
  humanIds,
  inWorld,
  isBb,
  isHang,
  logLine,
  reopenMatch,
  resumeGame,
  running,
  say,
  sayFloat,
  seatNewcomer,
  settleVote,
  shareOf,
  shortHanded,
  tooFew,
  turnKey,
  voteKey,
  voteNeeds,
  writeTimerFor,
} from "./rules.js";

import { isSb, sbMay, sbOnBoard } from "./sandboxrules.js";

import { sbRekey } from "./sbsave.js";

import { isQuack, quackLeft } from "./quackrules.js";

import { hangLeft } from "./hangout/rules.js";

import { isWorldMap } from "./maps.js";

import { SOLO_MODES } from "./modes.js";

import { rainbowJoin } from "./looksrules.js";

import {
  DOD_KEYS,
  denied,
  dodOn,
  dodRoom,
  dodSet,
  dodSettle,
  dodVoting,
  forgame,
  groupsOf,
  groupsOf0,
  isSudo,
  may,
  permOk,
  slowMs,
} from "./roomrules.js";

import {
  ALL_IN,
  DICE,
  cabinMap,
  capOf,
  countdown,
  keepRoomMap,
  nextVote,
  sbMapPicked,
  voteClock,
  voteIds,
  voteLeft,
  voteRate,
  votesDue,
} from "./voterules.js";

/* ---------- the actions of the room: joining, leaving, the options, votes, kicks, chat, permissions and music ---------- */
export function act_join({ state, s, a, now, P }) {
  if (P[a.p.id]) {
    P[a.p.id] = { ...P[a.p.id], ...a.p };
    return s;
  }
  if (s.seat.filter((id) => !P[id].helper).length >= capOf(s)) return s; // (the fireplace's Justin takes nobody's seat)
  if (
    (s.banned || {})[a.p.id] ||
    (a.p.acct && (s.banned || {})["acct:" + a.p.acct])
  )
    return state; // voted out until the lobby
  P[a.p.id] = { ...a.p, ready: false, joined: now };
  s.seat.push(a.p.id);
  const back = holdsBack(s) && (s.back || {})[a.p.id];
  if (back) {
    if (back.pos && boardPhases(s).includes(s.phase)) s.pos[a.p.id] = back.pos;
    else seatNewcomer(s, a.p.id);
    if (back.k === turnKey(s)) {
      if (back.lock !== undefined) s.lock[a.p.id] = back.lock;
      if (back.done) s.done[a.p.id] = back.done;
    } // (what they'd done counts only in the same turn)
    delete s.back[a.p.id];
  } // (Lawyering, Duncelation: back to their place)
  else if (!["lobby", "over", "countdown"].includes(s.phase))
    seatNewcomer(s, a.p.id);
  if (s.phase !== "lobby") rainbowJoin(s, a.p.id); // (Rainbow Ducks: a look for someone who joins mid-game)
  if (isSb(s) && s.sbsv) sbRekey(s, a.p.id); // (Sandbox: a player in the save gets their own settings back, by name)
  say(s, `${a.p.name} ${back ? "is back" : "joined"}.`);
  if (s.waiting && s.waiting.for === a.p.id) {
    delete s.waiting.for;
    delete s.waiting.go;
    if (!tooFew(s))
      return resumeGame(s, now, `${a.p.name} is back: the game goes on!`);
  }
  if (s.waiting && !s.waiting.for && !tooFew(s)) return resumeGame(s, now);
  return s;
}

export function act_leave({ s, a, now, P, me, host }) {
  if (!me) return s;
  say(s, `${me.name} left.`);
  if (holdsBack(s))
    s.back = {
      ...s.back,
      [a.id]: {
        pos: s.pos[a.id],
        lock: s.lock[a.id],
        done: s.done[a.id],
        k: turnKey(s),
      },
    }; // (their place, for when they're back)
  const held = holdsCase(s, a.id);
  reopenMatch(s, a.id);
  if (isHang(s)) hangLeft(s, a.id);
  const wasQuack =
    isQuack(s) && !!(s.hidden && (s.hidden.quacks || []).includes(a.id));
  delete P[a.id];
  s.seat = s.seat.filter((id) => id !== a.id);
  delete s.pos[a.id];
  delete s.done[a.id];
  if (host) s.hostId = humanIds(s)[0] || null;
  if (s.vote) settleVote(s, now);
  if (!held && s.waiting && s.waiting.for) {
    const on = goOnDone(s, now); // (the rest were waiting to go on: one fewer needed)
    if (on) return on;
  }
  if (held) holdFor(s, a.id, me.name, now); // (an attorney, the defender: the case waits for them)
  if (shortHanded(s, now, a.id, wasQuack) || held) return s;
  if (isQuack(s)) quackLeft(s, now);
  return s.phase === "lobby" || s.phase === "over" ? s : advance(s, now);
}

export function act_look({ s, a, me }) {
  if (me) Object.assign(me, a.look);
  if (me && a.look && a.look.name && isSb(s) && s.sbsv) sbRekey(s, a.id); // (Sandbox: a new name may be one the save knows)
  return s;
}

export function act_ready({ s, a, me }) {
  if (me && (s.phase === "lobby" || s.phase === "over"))
    me.ready = a.v ?? !me.ready;
  return s;
}

export function act_roomName({ s, a, boss }) {
  const n = String(a.name || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
  if (boss && n) s.name = n;
  return s;
}

export function act_options({ s, a, me, host, boss }) {
  const o = { ...a.options };
  delete o.dod; // (Democracy of Ducklings is set when the room is made, and stays)
  if (s.solo && o.mode && !SOLO_MODES.includes(o.mode)) delete o.mode; // (Single Player: only its games)
  if (dodOn(s, "vote"))
    for (const k of ["mode", "modePick", "map", "mapPick", "voteBack"])
      delete o[k]; // (Ducks Vote Mode & Game: the votes stay as they are)
  if (dodOn(s, "justin")) delete o.justin; // (Invite Justin: he stays)
  /* the modes in Random and the vote can change mid-game too, all but the one being played (owner 2026-11-15) */
  if (
    Array.isArray(o.modesOff) &&
    (boss || (dodOn(s, "settings") && me && !me.bot)) &&
    running(s)
  ) {
    const cur = s.options.mode,
      was = s.options.modesOff || [],
      next = o.modesOff.filter((id) => typeof id === "string" && id !== cur);
    if (was.includes(cur)) next.push(cur);
    if (JSON.stringify(next) !== JSON.stringify(was)) {
      s.options.modesOff = next;
      logLine(s, {
        sys: true,
        float: true,
        by: a.id,
        opts: { modesOff: next },
        text: `${me ? me.name : "The host"} changed the game settings.`,
      });
    }
    return s;
  }
  /* Sandbox on the board: its map changes mid-game too, for everyone at once (the owner's, Nov 22 13:15Z: "Why is there
     not an ability to change maps in the gane?"): a board map, or one the host made and brought in. A map with a world of
     its own (Duck Cabin, Downpour) still goes through the lobby */
  if (
    o.map &&
    sbOnBoard(s) &&
    running(s) &&
    (boss || (dodOn(s, "settings") && me && !me.bot))
  ) {
    if (VOTE_MAPS.includes(o.map) || (s.umap || {})[o.map]) {
      const ch = { map: o.map };
      for (const k of ["mapZoom", "mapGrey"]) if (k in o) ch[k] = o[k] ? 1 : 0;
      Object.assign(s.options, ch, { mapPick: "" });
      logLine(s, {
        sys: true,
        float: true,
        by: a.id,
        opts: ch,
        text: `${me ? me.name : "The host"} changed the game settings.`,
      });
    }
    return s;
  }
  if ("modesOff" in o && !Array.isArray(o.modesOff)) delete o.modesOff;
  if (
    (boss || (dodOn(s, "settings") && me && !me.bot)) &&
    (s.phase === "lobby" || s.phase === "over")
  ) {
    const was = s.options.discuss,
      wasMode = s.options.mode,
      before = flatOptions(s),
      reset = Object.keys(OPTIONS_DEFAULT)
        .filter((k) => typeof OPTIONS_DEFAULT[k] !== "object") // (an empty list or {} doesn't make it through Firebase)
        .every((k) => k in o);
    /* the General Rules go to their own layer (a save slot brings its own; its plain values were one mode's) */
    const G = (s.options.gen = Object.fromEntries(
      GEN_RULES.map((k) => [k, genVal(s, k)]),
    ));
    if (o.gen && typeof o.gen === "object") {
      for (const k of GEN_RULES) if (k in o.gen) G[k] = o.gen[k];
    } else for (const k of GEN_RULES) if (k in o) G[k] = o[k];
    for (const k of GEN_RULES) delete o[k];
    delete o.gen;
    if (reset && !("modeRules" in o)) o.modeRules = {}; // (Defaults: no Mode Rules either)
    if ("modeRules" in o) o.modeRules = cleanModeRules(o.modeRules);
    Object.assign(s.options, o);
    if (a.max) s.max = Math.max(s.seat.length, a.max);
    /* I want half the votes to end a turn by default with the Discussion round on, 2 of 3 without it: turning it on or
         off moves the share along while it's still at the other default */
    if ("discuss" in o && !("share" in o) && !!was !== !!s.options.discuss) {
      const [from, to] = s.options.discuss ? [0.67, 0.5] : [0.5, 0.67];
      if (G.share === from) G.share = to;
    }
    if (o.mode && !("submitTime" in o)) writeTimerFor(s, wasMode);
    /* picking a game ends Vote Game Mode and Random; picking a map ends Vote Maps and Random. A new vote starts from
           nobody */
    if (o.mode && !("modePick" in o)) s.options.modePick = "";
    if (o.map && !("mapPick" in o)) s.options.mapPick = "";
    if (isSb(s)) sbMapPicked(s, o);
    else if (isWorldMap(o.map) && !o.mode && !isHang(s)) {
      s.options.mode = "hang"; // Duck Cabin and its games are one: picking the map picks Hangout,
      s.options.modePick = "";
    } else if ((o.map || o.mapPick || o.modePick) && !o.mode && isHang(s))
      s.options.mode = "aod"; // and another map (or a vote, or Random) leaves Duck Cabin
    if (isSb(s) && !sbOnBoard(s)) {
      keepRoomMap(s);
      s.options.map = "cabin"; // (Sandbox on a world: the room's map waits for it, as with Duck Cabin's games)
      s.options.mapPick = "";
    } else if (isHang(s) && !s.options.modePick) {
      s.options.map = "cabin"; // (the host's Hangout; one from Random or the vote keeps the map's settings)
      s.options.mapPick = "";
      delete s.roomMap;
    } else if (!isHang(s) && isWorldMap(s.options.map) && s.roomMap)
      cabinMap(s); // (out of a Hangout that Random or the vote picked: the room's map again)
    else if (!isHang(s) && isWorldMap(s.options.map)) {
      s.options.map = "board"; // leaving Duck Cabin without picking a map goes back to Vote Maps
      if (!o.map && !("mapPick" in o)) s.options.mapPick = "vote";
    }
    /* the looks (looks.js): Rainbow Ducks needs Hide customization, and Vote colors and Rainbow Ducks never go together
         (the one just turned on wins); the tag's color goes with Vote colors */
    const L = s.options;
    if (o.rainbowDucks) L.voteColor = 0;
    if (o.voteColor) L.rainbowDucks = 0;
    if (!L.hideLooks) L.rainbowDucks = 0;
    if (!L.voteColor) L.tagColor = 0;
    /* every change goes in the chat, with who made it (from Game Settings or the command line alike): the chat
           words it from the keys (settingText in gamesettings.js) */
    applyRules(s);
    const after = flatOptions(s),
      ch = {};
    for (const k of new Set([...Object.keys(after), ...Object.keys(before)]))
      if (JSON.stringify(after[k]) !== JSON.stringify(before[k]))
        ch[k] = k in after ? after[k] : "same"; // (a Mode Rule taken away: Same as General)
    if (Object.keys(ch).length)
      logLine(s, {
        sys: true,
        float: true,
        by: a.id,
        opts: ch,
        reset,
        text: `${me ? me.name : "The host"} changed the game settings.`,
      });
  }
  return s;
}

export function act_kick({ state, s, a, now, P, me }) {
  // the host (or sudo) removes a player at once, no vote; a person stays out until the room goes back to the lobby
  const p = P[a.who];
  if (!may(s, a.id, "cankick") || !p || a.who === s.hostId || a.who === a.id)
    return state;
  if (!p.bot) {
    s.banned = {
      ...(s.banned || {}),
      [a.who]: true,
      ...(p.acct ? { ["acct:" + p.acct]: true } : {}),
    };
    sayFloat(s, `${me.name} removed ${p.name} from the room.`, a.id);
  }
  reopenMatch(s, a.who);
  if (isHang(s)) hangLeft(s, a.who);
  const wasQuack =
    isQuack(s) && !!(s.hidden && (s.hidden.quacks || []).includes(a.who));
  delete P[a.who];
  s.seat = s.seat.filter((id) => id !== a.who);
  delete s.pos[a.who];
  delete s.done[a.who];
  if (s.vote) settleVote(s, now);
  if (s.waiting && s.waiting.for) {
    const on = goOnDone(s, now);
    if (on) return on;
  }
  if (shortHanded(s, now, a.who, wasQuack)) return s;
  if (isQuack(s)) quackLeft(s, now);
  return s.phase === "lobby" || s.phase === "over" || s.phase === "countdown"
    ? s
    : advance(s, now);
}

export function act_vote({ state, s, a, now, me }) {
  // Vote Mode & Map: a player clicks a game or a map (the same one again takes the vote back); once every player has
  // voted, the clock runs twice as fast
  const vt = s.vt;
  if (
    !me ||
    s.phase !== "countdown" ||
    !vt ||
    !s.seat.includes(a.id) ||
    !(a.v === DICE || voteIds(s, vt.k).includes(a.v))
  )
    return state;
  const votes = { ...(vt.votes || {}) };
  if (votes[a.id] === a.v) delete votes[a.id];
  else votes[a.id] = a.v;
  vt.votes = votes; // (online, an empty list of votes doesn't come back)
  if (s.solo && votes[a.id]) return nextVote(s, now); // (Single Player: picked, and on at once)
  const voters = s.seat.filter((id) => s.players[id]);
  if (
    !vt.fast &&
    voters.filter((id) => votes[id]).length >=
      Math.max(1, Math.ceil(voters.length * shareOf(s) - 1e-9))
  ) {
    // (the majority is in: 6 s left, at normal speed, or as fast as Next has made it)
    vt.fast = 1;
    voteClock(s, now, Math.min(voteLeft(s, now), ALL_IN), voteRate(s));
  }
  return s;
}

export function act_vnext({ state, s, a, now, me }) {
  // Vote Mode & Map's Next: a player who has voted speeds the clock up (once each)
  const vt = s.vt;
  if (
    !me ||
    s.phase !== "countdown" ||
    !vt ||
    !s.seat.includes(a.id) ||
    !(vt.votes || {})[a.id] ||
    (vt.next || {})[a.id]
  )
    return state;
  const left = voteLeft(s, now);
  vt.next = { ...(vt.next || {}), [a.id]: 1 };
  voteClock(s, now, left, voteRate(s));
  return s;
}

export function act_dod({ state, s, a, now, me, host }) {
  // Democracy of Ducklings: a duck votes (again: takes the vote back); the host turns a rule on, or hands the host over, directly
  const k = a.k;
  if (!me || me.bot || !dodRoom(s) || !DOD_KEYS.includes(k)) return state; // (in any stage: Lobby Settings votes during a game too, owner Nov 15)
  s.dod = { on: {}, votes: {}, ...(s.dod || {}) };
  s.dod.votes = { ...(s.dod.votes || {}) };
  if (k === "host") {
    const to = a.v;
    if (!s.players[to] || s.players[to].bot || to === s.hostId) return state;
    if (host) {
      delete s.dod.votes.host;
      dodSet(s, k, true, to);
      return s;
    }
    const x = s.dod.votes.host || (s.dod.votes.host = { at: now, by: {} });
    if (x.by[a.id] === to) delete x.by[a.id];
    else x.by[a.id] = to;
  } else {
    if (host && !dodOn(s, k)) {
      delete s.dod.votes[k];
      dodSet(s, k, true);
      return s;
    }
    const x = s.dod.votes[k] || (s.dod.votes[k] = { at: now, by: {} });
    if (x.by[a.id]) delete x.by[a.id];
    else x.by[a.id] = true;
  }
  dodSettle(s, now);
  return s;
}

export function act_start({ state, s, now, boss }) {
  if (!boss || !(s.phase === "lobby" || s.phase === "over")) return s;
  if (dodOn(s, "ready") || dodVoting(s)) return state; // (Democracy of Ducklings: the host readies like everyone)
  return countdown(s, now) || state;
}

export function act_cancel({ s, me }) {
  if (me && s.phase === "countdown") {
    // (any player stops the start; the next start counts from 5 again)
    s.phase = "lobby";
    s.ends = 0;
    delete s.vt; // (the votes too)
    delete s.voteQ;
    delete s.sbpk; // (Sandbox's pick too)
    delete s.sbAsked;
    if (dodRoom(s)) me.ready = false; // (with every duck ready, Democracy of Ducklings would start it again at once)
  }
  return s;
}

export function act_pick({ state, s, a, now, me }) {
  // Bicker Brackets: my vote for a topic (it can be changed until the vote ends)
  if (
    !me ||
    me.late ||
    s.phase !== "tvote" ||
    !Number.isInteger(a.i) ||
    !s.bb.topics[a.i]
  )
    return state;
  s.bb.tvotes = { ...s.bb.tvotes, [a.id]: a.i };
  s.done[a.id] = true;
  return advance(s, now);
}

export function act_voteStart({ state, s, a, now, P, me }) {
  // a vote to kick a player, or to go back to the lobby; the one who starts it votes yes
  if (
    !me ||
    me.bot ||
    (["lobby", "countdown", "over"].includes(s.phase) &&
      !(s.phase === "countdown" && s.vt && a.kind === "lobby"))
  )
    return state; // (in the game and map votes, only a vote to go back to the lobby: owner, Nov 16)
  if (s.vote) return state;
  const used = (s.voteUsed || {})[a.id] || {},
    tk = voteKey(s, now);
  if (a.kind === "kick") {
    if (!P[a.target] || a.target === a.id) return state;
    if (humanIds(s).length <= 2) return state; // two people: no kick vote (it would pass on the starter's vote alone)
    if (used.kick !== undefined && s.round - used.kick < 2) return state; // one kick vote every two rounds
  } else if (
    a.kind === "lobby" ||
    a.kind === "skip" ||
    a.kind === "turn" ||
    a.kind === "newgame"
  ) {
    if (a.kind === "turn" && isBb(s)) return state; // (not in Bicker Brackets)
    if (a.kind === "newgame" && (!votesDue(s).length || s.phase !== "results"))
      return state; // (Vote for a new game now: only on the stats screen, while the ducks vote on games or maps)
    if (a.kind !== "lobby" && isHang(s)) return state; // (Hangout has no turns or rounds to skip)
    if (used[a.kind] === tk) return state; // one back-to-lobby (or skip) vote a turn
  } else return state;
  s.voteN = (s.voteN || 0) + 1;
  s.vote = {
    n: s.voteN,
    kind: a.kind,
    target: a.kind === "kick" ? a.target : null,
    by: a.id,
    yes: { [a.id]: true },
    no: {},
    ends: now + VOTE_TIME * 1000,
  };
  s.voteUsed = {
    ...(s.voteUsed || {}),
    [a.id]: { ...used, [a.kind]: a.kind === "kick" ? s.round : tk },
  };
  say(
    s,
    a.kind === "kick"
      ? `${me.name} started a vote to kick ${P[a.target].name}.`
      : a.kind === "skip"
        ? `${me.name} started a vote to skip this round.`
        : a.kind === "turn"
          ? `${me.name} started a vote to skip this turn.`
          : a.kind === "newgame"
            ? `${me.name} started a vote for a new ${votesDue(s).includes("mode") ? "game" : "map"} now.`
            : `${me.name} started a vote to go back to the lobby.`,
  );
  return settleVote(s, now);
}

export function act_voteCast({ state, s, a, now, me }) {
  const v = s.vote;
  if (!me || !v || v.n !== a.n) return state;
  if (!voteNeeds(s).voters.includes(a.id)) return state;
  if (a.v) {
    v.yes[a.id] = true;
    delete v.no[a.id];
  } else {
    v.no[a.id] = true;
    delete v.yes[a.id];
  }
  return settleVote(s, now);
}

export function act_chat({ state, s, a, now, P, me }) {
  // a message; from the command line (send) it carries the command (cmd) and may be a file
  if (!me) return s;
  if (
    denied(s, a.id, "nochat") ||
    (a.cmd && (denied(s, a.id, "nocmd") || denied(s, a.id, "nosend")))
  )
    return state;
  if (now - ((s.lastChat || {})[a.id] || 0) < slowMs(s, a.id)) return state; // slow: one message every 15 s (slow30: 30 s)
  const text = String(a.text || "")
    .trim()
    .slice(0, a.cmd ? 2000 : 500);
  if (!text) return state;
  if (a.to && !P[a.to]) return state;
  s.lastChat = { ...(s.lastChat || {}), [a.id]: now };
  logLine(s, {
    from: a.id,
    to: a.to || null,
    text,
    ...(a.cmd ? { cmd: String(a.cmd).slice(0, 200) } : {}),
    ...(a.file
      ? {
          file: String(a.file).slice(0, 40),
          ...(a.pub ? { pub: true } : {}),
          ...(a.grp && groupsOf0(s)[a.grp] ? { grp: String(a.grp) } : {}),
        }
      : {}),
  });
  return s;
}

export function act_hostMoved({ state, s, a, now, P, me }) {
  // (only the host's own browser applies it) the host went quiet and this player took over: the old host keeps sudo
  if (!me || a.id === s.hostId) return state;
  const old = s.hostId;
  s.hostId = a.id;
  if (old && P[old]) {
    const g = groupsOf0(s).sudo;
    if (!g.members.includes(old)) g.members = [...g.members, old];
    say(
      s,
      `${P[old].name} went quiet, so ${me.name} hosts now. ${P[old].name} keeps sudo.`,
    );
  }
  return s;
}

export function act_usermod({ state, s, a, P, me }) {
  // sudo: put a player in groups (add), take them out (remove), or give them exactly these (set)
  const G = groupsOf0(s),
    list = (a.groups || []).map(String).filter((g) => G[g]);
  if (
    !me ||
    !isSudo(s, a.id) ||
    !P[a.target] ||
    !list.length ||
    !["add", "remove", "set"].includes(a.mode)
  )
    return state;
  for (const [name, g] of Object.entries(G)) {
    const has = g.members.includes(a.target);
    let want =
      a.mode === "set"
        ? list.includes(name)
        : list.includes(name)
          ? a.mode === "add"
          : has;
    if (name === "sudo" && a.target === s.hostId) want = false; // (the host is sudo without being listed, always)
    if (want !== has)
      g.members = want
        ? [...g.members, a.target]
        : g.members.filter((x) => x !== a.target);
  }
  sayFloat(
    s,
    `${me.name} changed ${P[a.target].name}'s groups: ${groupsOf(s, a.target).join(", ") || "none"}.`,
    a.id,
  );
  return s;
}

export function act_groupadd({ state, s, a, me }) {
  // sudo: a new group with any of the restrictions
  const name = String(a.name || "").toLowerCase(),
    G = groupsOf0(s);
  if (
    !me ||
    !isSudo(s, a.id) ||
    !/^[a-z][a-z0-9_-]{0,19}$/.test(name) ||
    G[name] ||
    name.startsWith("superuser-") ||
    Object.keys(G).length >= 20
  )
    return state;
  G[name] = {
    perms: [...new Set((a.perms || []).filter(permOk))],
    members: [],
  };
  sayFloat(
    s,
    `${me.name} made the group ${name}${G[name].perms.length ? ` (${G[name].perms.join(", ")})` : ""}.`,
    a.id,
  );
  return s;
}

export function act_groupdel({ state, s, a, me }) {
  const G = groupsOf0(s);
  if (
    !me ||
    !isSudo(s, a.id) ||
    !G[a.name] ||
    ["sudo", "dumbasses"].includes(a.name)
  )
    return state;
  delete G[a.name];
  sayFloat(s, `${me.name} removed the group ${a.name}.`, a.id);
  return s;
}

export function act_groupmod({ state, s, a, me }) {
  // sudo: rename a group (newName), or set its perms (perms); not sudo, dumbasses or a superuser group
  const G = groupsOf0(s),
    g = G[a.name],
    to = String(a.newName || "").toLowerCase();
  if (!me || !isSudo(s, a.id) || !g || ["sudo", "dumbasses"].includes(a.name))
    return state;
  if (a.newName !== undefined) {
    if (
      !/^[a-z][a-z0-9_-]{0,19}$/.test(to) ||
      G[to] ||
      to.startsWith("superuser-")
    )
      return state;
    delete G[a.name];
    G[to] = g;
    sayFloat(s, `${me.name} renamed the group ${a.name} to ${to}.`, a.id);
    return s;
  }
  if (!Array.isArray(a.perms)) return state;
  g.perms = [...new Set(a.perms.filter(permOk))];
  sayFloat(
    s,
    `${me.name} set the group ${a.name}'s perms: ${g.perms.join(", ") || "none"}.`,
    a.id,
  );
  return s;
}

export function act_forgame({ state, s, a, now }) {
  return forgame(s, a, now) || state;
}

export function act_skip({ state, s, a, now, me }) {
  // the host (or sudo): end the current stage now, as if everyone were done
  if (
    !may(s, a.id, "canskip") ||
    ["lobby", "over"].includes(s.phase) ||
    inWorld(s)
  )
    return state;
  say(s, `${me.name} skipped ahead.`);
  if (s.phase === "countdown") {
    s.ends = now;
    return s;
  } // the next tick starts the game
  return advance(s, now, true);
}

export function act_music({ state, s, a, host }) {
  // (the host's own browser) the room's songs: the one now and the one after it, so everyone hears the same (music.js)
  if (!host) return state;
  const song = (e) =>
    e && typeof e.n === "string" && Number.isFinite(e.at)
      ? { n: e.n.slice(0, 60), at: +e.at, seed: (+e.seed || 0) >>> 0 }
      : null;
  s.music = {
    a: song(a.a),
    b: song(a.b),
    off: (s.music && s.music.off) || [],
  };
  return s;
}

export function act_songs({ state, s, a }) {
  // the host, sudo or cansettings: songs taken off the room's list (off) or put back (on); all: 'on' puts every song back
  if (!may(s, a.id, "cansettings") && !sbMay(s, a.id, "g")) return state; // (Sandbox: G's Music row too)
  const off = new Set((s.music && s.music.off) || []),
    names = (v) =>
      (Array.isArray(v) ? v : [])
        .filter((n) => typeof n === "string")
        .map((n) => n.slice(0, 60));
  if (a.all === "on") off.clear();
  for (const n of names(a.off)) off.add(n);
  for (const n of names(a.on)) off.delete(n);
  s.music = {
    a: null,
    b: null,
    ...(s.music || {}),
    off: [...off].slice(0, 60),
  };
  return s;
}
export const ROOM_ACTS = {
  join: act_join,
  leave: act_leave,
  look: act_look,
  ready: act_ready,
  roomName: act_roomName,
  options: act_options,
  kick: act_kick,
  vote: act_vote,
  vnext: act_vnext,
  dod: act_dod,
  start: act_start,
  cancel: act_cancel,
  pick: act_pick,
  voteStart: act_voteStart,
  voteCast: act_voteCast,
  chat: act_chat,
  hostMoved: act_hostMoved,
  usermod: act_usermod,
  groupadd: act_groupadd,
  groupdel: act_groupdel,
  groupmod: act_groupmod,
  forgame: act_forgame,
  skip: act_skip,
  music: act_music,
  songs: act_songs,
};
