/* ---------- Sandbox: saving a Sandbox as it is and picking it up later (the rules' half) ----------
   The owner's, Nov 19 23:46Z: "There should be a setting to save the sandbox as is, with all the settings and everything
   set as is ... This doesn't save into a game mode. It doesn't save to a map. It's just basically saving the progress of
   their sandbox ... whoever the host is when sandbox loads in multiplayer is they are given a UI where they can scroll
   through their previous sandbox sessions ... choosing the game modes or sandbox sessions determines what map it is ...
   then they can select a map as they would normally in a vote that follows ... it will be informed on the other player's
   screen that they are selecting if they want to create a new sandbox or a previous save ... Getting this right is so
   stupidly important".
   - A save is the whole Sandbox: s.sb (spawns, respawns, loot, zones, made NPCs, kinds' settings, hotbars, the rights
     given to players) and every part of the state beside it whose name starts with sb or nb (the pictures s.sbpic and
     s.sbImg, the Seriat files s.nb, their log s.nbo, the Seriat rights s.nbp and shared copies s.nbs), so a part added
     later is saved without anyone remembering to add it here. Also Sandbox's own settings (the options starting with
     sb: its world, who may change it, the field's tint), the room's song list, and the map.
   - Only what lasts a moment is left out: the NPCs walking now (their count is kept, and as many come back at their
     spawns or respawns when the save opens), the spawns running and the respawns on their way, the ducks seen.
   - Players are named by id in the state, and an id changes from one visit to the next, so a save keeps each player's
     name (who: { id: name }); whoever has that name when the save opens, or joins later, gets their own settings back.
   - Saves are kept on the host's device (sbsaves.js, the screen's half). The rules only take a save the host's device
     hands them ({ t: "sbPick" }) and name the session (s.sbsv), so that device knows where to save it again.
   s.sbsv = { id, name, made, who (names not back yet), room (the room's own Sandbox settings, back after a save) };
   s.sbpk: the host is picking (a phase of the start, like a vote); s.sbAsked: picked for this game. */
import { isSb, sbWorld, SB_WORLDS, SB_WORLD_NAMES } from "./sandboxrules.js";

export const SAVE_V = 1; // (a save's version: a newer game still opens an older save)
const MINE = ["sbsv", "sbpk", "sbAsked"]; // (this file's own parts: never in a save)
export const isPart = (k) => /^(sb|nb)/.test(k) && !MINE.includes(k);
const isOpt = (k) => /^sb/.test(k);
const NOW_ONLY = ["live", "rq", "run", "au", "seen", "gm", "gj", "died"]; // (s.sb's parts that only mean something this moment; gm, gj: who is in which group now, sbgroups.js; died: the lives used, l4ddrules.js)
const copy = (v) => JSON.parse(JSON.stringify(v));

/* the Sandbox in s as a save's data (plain JSON) */
export function sbSnapshot(s) {
  const parts = {};
  for (const [k, v] of Object.entries(s))
    if (isPart(k) && v != null) parts[k] = copy(v);
  const sb = parts.sb || {},
    back = {};
  for (const [id, ids] of Object.entries(sb.live || {}))
    back[id] = (back[id] || 0) + ids.length;
  for (const r of sb.rq || []) back[r[0]] = (back[r[0]] || 0) + 1; // (on their way back: they come too)
  for (const k of NOW_ONLY) delete sb[k];
  for (const k of ["nbp", "nbs"])
    if (parts[k])
      parts[k] = { by: parts[k].at === s.startedAt ? parts[k].by || {} : {} }; // (only this Sandbox's: nbperms.js)
  const who = { ...((s.sbsv && s.sbsv.who) || {}) };
  for (const [id, P] of Object.entries(s.players))
    if (!P.bot && !P.helper) who[id] = P.name;
  return {
    parts,
    back,
    options: Object.fromEntries(
      Object.entries(s.options).filter(([k]) => isOpt(k)),
    ),
    who,
    music: { off: [...((s.music && s.music.off) || [])] },
    world: sbWorld(s.options),
    map: s.options.map,
    zoom: s.mapZoomed ? 1 : 0,
    grey: s.mapGreyed ? 1 : 0,
  };
}

/* a new session's id */
export const newSaveId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* the Sandbox's parts out of the room: a new Sandbox starts from nothing */
function clear(s) {
  for (const k of Object.keys(s)) if (isPart(k)) delete s[k];
}

/* player from's settings become player to's: every key and every value that is exactly the old id (ids are long and
   random, so nothing else is ever one) */
function swap(v, from, to) {
  if (Array.isArray(v)) return v.map((x) => swap(x, from, to));
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v))
      o[k === from ? to : k] = swap(x, from, to);
    return o;
  }
  return v === from ? to : v;
}
/* the names a save keeps, matched to the players here now (or to one who just joined: only): each one found gets their
   own settings back, and is crossed off */
export function sbRekey(s, only) {
  const sv = s.sbsv,
    who = (sv && sv.who) || {};
  for (const [old, name] of Object.entries(who)) {
    if (s.players[old]) {
      delete who[old]; // (the same id as before: theirs already)
      continue;
    }
    const to = Object.values(s.players).find(
      (P) =>
        !P.bot &&
        P.name === name &&
        (!only || P.id === only) &&
        !Object.prototype.hasOwnProperty.call(who, P.id),
    );
    if (!to) continue;
    for (const k of Object.keys(s))
      if (isPart(k) && k !== "sbpic") s[k] = swap(s[k], old, to.id); // (the pictures hold no players)
    delete who[old];
  }
}

/* ---------- the start: the host picks a new Sandbox or a save ----------
   After the mode vote (when there is one) and before the map vote, a Sandbox game waits for the host's pick */
export const sbAskDue = (s) =>
  isSb(s) && !s.sbAsked && (s.voteQ || [])[0] !== "mode";
const WAIT = 365 * 864e5; // (no clock: it waits for the host, as Single Player's Select does)
export function sbAsk(s, now) {
  s.sbAsked = 1;
  s.sbpk = { at: now };
  delete s.vt;
  s.phase = "countdown";
  s.at = now;
  s.ends = now + WAIT;
}
/* the host's pick: { t: "sbPick" } a new Sandbox, { t: "sbPick", save } one of the saves its device keeps (save: { id,
   name, made, v, data: sbSnapshot's }). False when the save can't be read */
export function sbPick(s, a, now) {
  const room = Object.fromEntries(
    Object.entries(s.options).filter(([k]) => isOpt(k)),
  );
  const sv = a.save;
  /* a made game mode (gmodes.js): played as players see it, nobody changing it (sandboxrules.js sbPlaying); test: the
     host trying it from G, Stop test brings the build back */
  if (a.play) {
    s.gmPlay = 1;
    if (a.test) s.gmTest = 1;
    else delete s.gmTest;
  } else {
    delete s.gmPlay;
    delete s.gmTest;
  }
  if (!sv) {
    clear(s);
    s.sbsv = { id: newSaveId(), name: "", made: now, who: {} };
    return true;
  }
  const d = sv && sv.data;
  if (
    !d ||
    typeof d !== "object" ||
    typeof sv.id !== "string" ||
    !d.parts ||
    typeof d.parts !== "object"
  )
    return false;
  clear(s);
  for (const [k, v] of Object.entries(d.parts)) if (isPart(k)) s[k] = copy(v);
  for (const [k, v] of Object.entries(d.options || {}))
    if (isOpt(k)) s.options[k] = v;
  s.options.sbMap = SB_WORLDS[d.world] ? d.world : ""; // (a world save brings its world; a board save, the board)
  if (a.play && !SB_WORLDS[d.world] && typeof d.map === "string" && d.map)
    s.options.map = d.map; // (a made game mode on the board: its own map, no map vote)
  if (d.music && Array.isArray(d.music.off))
    s.music = {
      a: null,
      b: null,
      ...(s.music || {}),
      off: d.music.off.filter((n) => typeof n === "string").slice(0, 60),
    };
  s.sbsv = {
    id: sv.id.slice(0, 40),
    name: String(sv.name || "").slice(0, 60),
    made: +sv.made || now,
    who: { ...(d.who || {}) },
    room,
    load: 1,
    back: d.back || {},
  };
  sbRekey(s);
  return true;
}
/* the game begins: a save's Seriat rights and shared copies belong to this Sandbox now (nbperms.js keeps them by its
   start), its NPCs come back, and a new session gets its name, the map's and the day's */
export function sbBegin(s, now) {
  const sv = s.sbsv;
  if (!sv) return;
  if (sv.load) {
    for (const k of ["nbp", "nbs"])
      if (s[k]) s[k] = { by: s[k].by || {}, at: s.startedAt };
    const pts = (s.sb && s.sb.pts) || {},
      rq = [];
    let i = 0;
    for (const [id, n] of Object.entries(sv.back || {}))
      if (pts[id])
        for (let k = 0; k < Math.min(+n || 0, 100); k++)
          rq.push([id, now + 400 + 150 * i++]);
    if (rq.length) s.sb = { ...(s.sb || {}), rq };
  }
  delete sv.load;
  delete sv.back;
  if (!sv.name) sv.name = defaultName(s, now);
}
/* "Downpour, Nov 19 6:47 PM": the map and when it began, in the host's own time */
export function defaultName(s, now) {
  const w = sbWorld(s.options),
    when = new Date(now).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  return `${w ? SB_WORLD_NAMES[w] : "Board"}, ${when}`;
}
/* back to the lobby: a save's own Sandbox settings give way to the room's again (a New Sandbox starts as the room's
   Game Settings say); the session stays named, so its last save is still its own */
export function sbEnd(s) {
  delete s.sbpk;
  delete s.sbAsked;
  delete s.gmPlay; // (a made game mode, or its test, is over)
  delete s.gmTest;
  const sv = s.sbsv;
  if (!sv || !sv.room) return;
  for (const k of Object.keys(s.options))
    if (isOpt(k) && !(k in sv.room)) delete s.options[k];
  Object.assign(s.options, sv.room);
  delete sv.room;
}
/* Save as: the session goes on under a new name (and id), the host's device saves it there from now on */
export function sbRename(s, a, now) {
  if (!isSb(s) || !s.sbsv) return false;
  const name = String(a.name || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (!name) return false;
  s.sbsv = {
    ...s.sbsv,
    name,
    ...(typeof a.sid === "string" && /^[a-z0-9]{6,40}$/.test(a.sid)
      ? { id: a.sid, made: now }
      : {}),
  };
  return true;
}
