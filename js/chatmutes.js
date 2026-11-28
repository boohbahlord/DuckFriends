/* ---------- The chat's suggestions, mutes and commands ----------
   Moved out of chat.js to keep that file small (a pure move; the owner's, Nov 22). */
import { confirmBox } from "./ui.js";

import { profile, save } from "./store.js";

import { activeRoom } from "./net.js";

import { denied, gameMuted } from "./roomrules.js";

import { uiCommand } from "./hideui.js";

import { npcById, npcByTag, npcsHere, npcTag as npcAt, muted } from "./npcs.js";

/* a name as it is typed after @: without its spaces ("Player 1" is @Player1) */
export const tag = (n) => String(n || "").replace(/\s+/g, "");
export const byTag = (s, t) =>
  s.seat.find(
    (i) => tag(s.players[i].name).toLowerCase() === tag(t).toLowerCase(),
  );

/* ---------- the chat's suggestions ---------- */
/* chat commands: nothing shows before typing; typing narrows them (\\ shows every \\ command); names complete
   after @ and after each \\…@ */
const CHAT_CMDS = [
  "\\help",
  "\\@",
  "\\mute",
  "\\permmute",
  "\\show",
  "\\hide",
  "\\togglesuggest",
];
const MUTE_WORDS = ["bubble", "ping", "text", "all", "on", "off", "-f"],
  SHOW_WORDS = ["mute", "permmute", "players", "ui"];
export function chatSuggest(line, s, me) {
  if (profile.settings.chatSuggest === false) return []; // \togglesuggest
  const mw = line.match(
    /^\\(mute|permmute|show|hide)\s+(?:[^@]*\s)?([a-z-]*)$/i,
  ); // \mute bubble ping on …
  if (mw) {
    const opts =
        mw[1].toLowerCase() === "hide"
          ? ["ui"]
          : mw[1].toLowerCase() === "show"
            ? SHOW_WORDS
            : MUTE_WORDS.filter(
                (w) => w !== "-f" || mw[1].toLowerCase() === "permmute",
              ),
      p = mw[2].toLowerCase(),
      pre = line.slice(0, line.length - mw[2].length);
    return opts
      .filter((o) => o.startsWith(p) && o !== p)
      .map((o) => ({ label: o, apply: () => pre + o + " " }));
  }
  const m = line.match(
    /((?:\\(?:mute|permmute)\s[^@]*)?\\?@)([\p{L}\p{N}_-]*)$/u,
  );
  if (m && s) {
    const p = m[2].toLowerCase(),
      pre = line.slice(0, line.length - m[0].length);
    const people = [
      ...s.seat.filter((id) => id !== me).map((id) => tag(s.players[id].name)),
      ...(m[1] !== "@" && m[1] !== "\\@" ? npcsHere(s).map(npcAt) : []),
    ].filter((n) => n.toLowerCase().startsWith(p)); // (\mute and \permmute: the characters too)
    const opts =
      m[1] === "@" && "everyone".startsWith(p)
        ? ["everyone", ...people]
        : people;
    const out = opts.map((n) => ({
      label: m[1] + n,
      apply: () => pre + m[1] + n + " ",
    }));
    return out.filter(
      (o) =>
        o.label.toLowerCase() !== line.slice(pre.length).toLowerCase().trim(),
    );
  }
  if (line === "") return []; // nothing until something is typed
  if (line.startsWith("\\") && !line.includes(" "))
    return CHAT_CMDS.filter((c) => c.startsWith(line) && c !== line).map(
      (c) => ({ label: c, apply: () => c }),
    );
  return [];
}
export const HELP = [
  "The chat's help:",
  '@name: pings a player (a soft sound and a "!"); @everyone pings everyone',
  "\\@name message: a private message",
  "\\mute bubble ping text on @name @name2: mute what you list (all = everything; off undoes it) until you leave the room",
  "\\permmute … the same, kept on this device (it asks first; -f skips the question)",
  "\\show mute · \\show permmute · \\show players",
  "\\hide ui: hides the bars and the words at the bottom on your screen (\\show ui brings them back)",
  "\\togglesuggest: suggestions in the chat on or off",
  "clear (or \\clear): clears the chat on your screen",
  "Tab: complete; ↑ ↓: choose",
];

/* ---------- mutes: what you hide from a player (their text, their pings, their bubbles over the board) ----------
   For this room only (gone when you leave it), or for good on this device (by their Google account if they're signed
   in, else by name). The old \mute@name lists became permanent mutes. */
const KINDS = ["text", "ping", "bubble"];
const session = { room: "", by: {} };
const perm = () => {
  if (!profile.permMutes) {
    profile.permMutes = {};
    for (const n of profile.muted || [])
      profile.permMutes["name:" + n] = {
        ...profile.permMutes["name:" + n],
        text: true,
      };
    for (const n of profile.mutedPings || [])
      profile.permMutes["name:" + n] = {
        ...profile.permMutes["name:" + n],
        ping: true,
      };
    delete profile.muted;
    delete profile.mutedPings;
  }
  return profile.permMutes;
};
const keysOfPlayer = (p) =>
  p
    ? [
        ...(p.acct ? ["acct:" + p.acct] : []),
        "name:" + tag(p.name).toLowerCase(),
      ]
    : [];
const sessionMutes = () => {
  const r = activeRoom(),
    id = r ? r.state.id : "";
  if (session.room !== id) {
    session.room = id;
    session.by = {};
  }
  return session.by;
};
/* is this player's text, ping or bubble muted for me? */
/* what a message says: a file sent from the command line we cut (Nov 27) shows only its name, since it could be locked */
export const said = (m) => (m.file ? `📄 ${m.file}` : m.text);

export function isMuted(s, id, kind) {
  const p = s && s.players[id],
    a = sessionMutes(),
    b = perm();
  if (!p) {
    const k = npcById(id) && "npc:" + id;
    return (
      !!k &&
      (gameMuted(s, id, kind) ||
        !!((a[k] && a[k][kind]) || (b[k] && b[k][kind])))
    );
  } // (Justin, a cat, the Butler, the shadow duck)
  return (
    gameMuted(s, id, kind) ||
    keysOfPlayer(p).some((k) => (a[k] && a[k][kind]) || (b[k] && b[k][kind]))
  ); // (forgame's mutes hide it for everyone)
}
muted.is = isMuted;
/* \mute | \permmute: the kinds, then on or off, then the players */
function setMutes(line, permanent, s, me) {
  const ws = line
    .trim()
    .split(/\s+/)
    .slice(1)
    .filter((w) => w !== "-f");
  const kinds = ws
    .filter((w) => [...KINDS, "all"].includes(w.toLowerCase()))
    .map((w) => w.toLowerCase());
  const onOff = ws.find((w) => /^(on|off)$/i.test(w)),
    at = ws.filter((w) => w.startsWith("@"));
  if (!kinds.length || !onOff || !at.length)
    return `${permanent ? "\\permmute" : "\\mute"}: what (bubble, ping, text or all), on or off, then @names. Like \\mute bubble ping on @${tag(s.players[s.seat.find((i) => i !== me) || me].name)}`;
  const list = kinds.includes("all") ? KINDS : kinds,
    on = /^on$/i.test(onOff),
    store = permanent ? perm() : sessionMutes(),
    done = [];
  for (const a of at) {
    const id = byTag(s, a.slice(1)),
      npc = !id && npcByTag(a.slice(1));
    if ((!id && !npc) || id === me) {
      done.push(`✗ ${a}?`);
      continue;
    }
    const k = npc ? "npc:" + npc.id : keysOfPlayer(s.players[id])[0];
    store[k] = { ...store[k] };
    for (const kind of list) {
      if (on) store[k][kind] = true;
      else delete store[k][kind];
    }
    if (!Object.keys(store[k]).length) delete store[k];
    done.push(npc ? npc.name : s.players[id].name);
  }
  if (permanent) save();
  return `${on ? "Muted" : "Unmuted"} ${list.join(", ")}${permanent ? " for good (this device)" : " (until you leave the room)"}: ${done.join(", ")}.`;
}
function showMutes(s, permanent) {
  const store = permanent ? perm() : sessionMutes(),
    rows = Object.entries(store);
  if (!rows.length)
    return permanent ? "No permanent mutes." : "No mutes in this room.";
  const nameOf = (k) => {
    if (k.startsWith("npc:"))
      return (npcById(k.slice(4)) || { name: k.slice(4) }).name;
    const id = s && s.seat.find((i) => keysOfPlayer(s.players[i]).includes(k));
    return id
      ? s.players[id].name
      : k.replace(/^(name|acct):/, k.startsWith("acct:") ? "account " : "");
  };
  return rows
    .map(([k, v]) => `${nameOf(k)}: ${Object.keys(v).join(", ")}`)
    .join(" · ");
}
function showPlayers(s, online) {
  return s.seat
    .map((id) => {
      const p = s.players[id];
      return [
        `${p.name}${id === s.hostId ? " (host)" : ""}`,
        p.bot
          ? "computer"
          : online
            ? p.ms == null
              ? "… ms"
              : p.ms + " ms"
            : "same device",
        p.idle ? "away" : "",
        p.late ? "plays next turn" : "",
      ]
        .filter(Boolean)
        .join(" · ");
    })
    .join("\n");
}

/* the chat's own commands (\togglesuggest, \show, \mute, \permmute), from the chat; null: not one */
export async function chatCommand(text, r) {
  if (/^\\togglesuggest\s*$/i.test(text)) {
    profile.settings.chatSuggest = profile.settings.chatSuggest === false;
    save();
    return `Chat suggestions ${profile.settings.chatSuggest ? "on" : "off"}. \\togglesuggest switches them again.`;
  }
  const ui = text.match(/^\\(hide|show)\s+ui\s*$/i);
  if (ui) return uiCommand(ui[1].toLowerCase(), "ui"); // (hide ui, mine alone: hideui.js)
  if (!/^\\(show|mute|permmute|unmute|muteping|unmuteping)/i.test(text))
    return null;
  if (!r) return "That works in a room.";
  const sh = text.match(/^\\show\s+(\S+)\s*$/i);
  if (sh) {
    const k = sh[1].toLowerCase();
    return k === "mute"
      ? showMutes(r.state, false)
      : k === "permmute"
        ? showMutes(r.state, true)
        : k === "players"
          ? showPlayers(r.state, r.online)
          : "\\show mute, \\show permmute or \\show players";
  }
  if (/^\\show\s*$/i.test(text))
    return "\\show mute, \\show permmute or \\show players";
  const old = text.match(/^\\(un)?(mute|muteping)@([\p{L}\p{N}_-]+)\s*$/iu); // the old way still works: permanent, like before
  if (old)
    return setMutes(
      `x ${old[2].toLowerCase() === "mute" ? "text" : "ping"} ${old[1] ? "off" : "on"} @${old[3]}`,
      true,
      r.state,
      r.me,
    );
  const mu = text.match(/^\\(mute|permmute)\b/i);
  if (!mu) return null;
  if (denied(r.state, r.me, "nomute")) return "Your group can't mute others.";
  const permanent = mu[1].toLowerCase() === "permmute";
  if (
    permanent &&
    !/\s-f(\s|$)/i.test(text) &&
    /\s@/.test(text) &&
    !(await confirmBox(
      "Mute for good?",
      "This stays on this device until you undo it (\\permmute … off @name). -f skips this question.",
    ))
  )
    return "Nothing muted.";
  return setMutes(text, permanent, r.state, r.me);
}
