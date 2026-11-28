/* ---------- the lobby's vote for the mode and the map, the rotation and the game's end (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import { ammoReset } from "./ammo.js";
import {
  COUNTDOWN,
  SOLO_COUNTDOWN,
  VOTE_MAPS,
  backToLobby,
  countMap,
  enter,
  fits,
  inWorld,
  isBb,
  isHang,
  isSc,
  minOf,
  nextMode,
  pickMap,
  randomPool,
  setMap,
  setMode,
  tally,
  winner,
  writeTimerFor,
} from "./rules.js";

import { anyOf } from "./random.js";
import { CABIN_MODES } from "./modes.js";
import { umapIds } from "./umaprules.js";
import { startTourney } from "./bbrules.js";

import { baseMode, isSb, sbOnBoard } from "./sandboxrules.js";

import { sbAsk, sbAskDue, sbBegin, sbPick } from "./sbsave.js";

import { isDn, dnStart } from "./duncerules.js";

import { isVd, vdStart } from "./vddrules.js";

import { isTv, tvStart } from "./triviarules.js";

import { isQuack, startQuackRound } from "./quackrules.js";

import { hangStart } from "./hangout/rules.js";

import { useMode } from "./hangout/layout.js";

import { isWorldMap, ZOOM_MAP, GREY_MAP } from "./maps.js";

import { modesFor, modeOf } from "./modes.js";

import { dealRainbow } from "./looksrules.js";

import { startStory } from "./scrules.js";

import { dodOn } from "./roomrules.js";

/* ---------- Vote Mode & Map (owner 2026-11-04) ----------
   After the start's 5 s countdown, a window over the whole screen: Vote for Game Mode (1:05), then Vote for Map (0:20;
   not for the games that bring their own place: Duck Cabin's and Mad God Justin's). Every player clicks one (the same
   one again takes the vote back); the dice is a random pick. Once the majority has voted (the room's vote share,
   shareOf), the clock drops to 6 s and runs at its normal speed (owner 2026-11-15: "only six seconds and NOT double
   speed"). The full times only run out when the majority never votes. The most votes win, and a tie is a random pick between the tied ones (no votes at all: any of them). Vote
   return brings both votes back after that many games (a round is a game; a whole Hangout or Quacky Zombies is one) */
const PICK_TIME = { mode: 65, map: 20 };
export const ALL_IN = 6000; // a vote's clock once the majority has voted: 6 s, at normal speed
export const DICE = "dice";
const NO_MAP_VOTE = CABIN_MODES;
const voteModes = (s) => {
  const all = modesFor(s)
      .map((m) => m.id)
      .filter((id) => fits(s, id)),
    off = s.options.modesOff || [],
    on = all.filter((id) => !off.includes(id));
  return on.length ? on : all; // (Modes in Random & Vote: the games turned off aren't on the vote either)
};
export const voteIds = (s, k) =>
  k === "mode" ? voteModes(s) : [...VOTE_MAPS, ...umapIds(s)]; // (and the maps the host made and brought in: umaprules.js)
/* the maps the room's map pick can land on, for the lobby's picture to cycle through and no others (the owner's, Nov 21
   18:05Z: the lobby's map preview "follows vote or random"): the vote's list (every form, and the host's made maps), or
   Random's (every map in each of its forms), the very lists they choose from. None when the map isn't a pick, or when
   the host's game brings its own place (Duck Cabin's games, Mad God Justin, Survival) */
export const mapChoices = (s) =>
  !s.options.mapPick ||
  (!s.options.modePick && NO_MAP_VOTE.includes(s.options.mode))
    ? []
    : s.options.mapPick === "vote"
      ? voteIds(s, "map")
      : VOTE_MAPS;
/* the time a vote shows. Its clock can run faster than real time (Next, below): vt.c { at, left, rate } is the time it
   showed at "at" and how fast it has run since; s.ends stays the real moment it reaches 0 */
export const voteLeft = (s, now) => {
  const c = s.vt && s.vt.c;
  return c
    ? Math.max(0, c.left - (now - c.at) * c.rate)
    : Math.max(0, s.ends - now);
};
export function voteClock(s, now, left, rate) {
  s.vt.c = { at: now, left, rate };
  s.ends = now + left / rate;
}
/* Next (the owner's, Nov 17 13:30Z): once a player has voted, a red Next button speeds the clock up by 1/players for
   each player who presses it (three players: 33% faster for one press; everyone: twice as fast) */
export const voteRate = (s) => {
  const vt = s.vt || {},
    voters = s.seat.filter((id) => s.players[id]),
    n = voters.filter((id) => (vt.next || {})[id]).length;
  return 1 + n / Math.max(1, voters.length);
};
export const votesDue = (s) =>
  [
    s.options.modePick === "vote" && "mode",
    s.options.mapPick === "vote" && "map",
  ].filter(Boolean);
/* Vote return: the games until both votes come back (Random: 1 to 6, picked again each time; 0: never) */
const returnIn = (s) => {
  const v = s.options.voteBack;
  return v === "r" ? 1 + Math.floor(Math.random() * 6) : Math.max(0, +v || 0);
};
function openVote(s, k, now) {
  s.phase = "countdown";
  s.at = now;
  s.vt = { k, votes: {} }; // (online, votes only comes back once someone votes)
  s.ends = now + (s.solo ? SOLO_WAIT : PICK_TIME[k] * 1000);
}
/* Single Player: the vote window is a Select window, with no clock: it waits for the pick, and the pick is instant */
const SOLO_WAIT = 365 * 864e5;
function closeVote(s) {
  const vt = s.vt,
    ids = voteIds(s, vt.k);
  delete s.vt;
  let won = winner(tally(s, vt.votes), [...ids, DICE]);
  if (won === DICE)
    won =
      vt.k === "mode"
        ? anyOf(randomPool(s).length ? randomPool(s) : ids)
        : pickMap(s); // (the map's dice: the bags, as Random)
  if (vt.k === "mode") return setMode(s, won || "aod");
  setMap(s, won);
  s.mapVoted = 1;
}
/* the place for the game: Duck Cabin for its own games; otherwise the map the vote picked, a Random one, or the host's
   (with the host's Zoom and Colors settings) */
export function placeMap(s) {
  const o = s.options,
    voted = s.mapVoted;
  delete s.mapVoted;
  cabinMap(s);
  if (isHang(s) || voted) return;
  if (o.mapPick === "random") return setMap(s, pickMap(s));
  s.mapZoomed = o.map === "euclid" && o.mapZoom ? 1 : 0;
  s.mapGreyed = o.map === "collage" && o.mapGrey ? 1 : 0;
  countMap(s, s.mapZoomed ? ZOOM_MAP[0] : s.mapGreyed ? GREY_MAP[0] : o.map); // (the host's own pick counts as played too)
}
/* Duck Cabin's games bring their own map: going in keeps the room's map (in its form) to come back to, and coming out
   puts it back (the board if there was none). A room still on "zcabin" (Mad God Justin on Quacky Zombies' cabin, Nov 17,
   scrapped by the owner the same day) gets its own map back the same way */
const OLD_ZCABIN = "zcabin";
export function keepRoomMap(s) {
  const o = s.options;
  if (!isWorldMap(o.map) && o.map !== OLD_ZCABIN)
    s.roomMap = [o.map, s.mapZoomed ? 1 : 0, s.mapGreyed ? 1 : 0];
}
export function cabinMap(s) {
  const o = s.options;
  if (isHang(s)) {
    keepRoomMap(s);
    o.map = "cabin";
    s.mapZoomed = s.mapGreyed = 0;
  } else if (isWorldMap(o.map) || o.map === OLD_ZCABIN) {
    [o.map, s.mapZoomed, s.mapGreyed] = s.roomMap || ["board", 0, 0];
    delete s.roomMap;
    if (!o.mapPick) {
      s.mapZoomed = o.map === "euclid" && o.mapZoom ? 1 : 0; // (the host's map: the host's Zoom and Colors)
      s.mapGreyed = o.map === "collage" && o.mapGrey ? 1 : 0;
    }
  }
}
/* in Duck Cabin's games or Sandbox, playing (no rounds: the End Cabin or Leave Sandbox vote ends it) */
export const sbHere = (s) =>
  (isHang(s) && inWorld(s)) || (sbOnBoard(s) && s.phase === "sandbox");
/* Sandbox on the board: where a duck comes in (anywhere; the spawn points are stage 2) */
export const sbSpot = () => ({
  x: +(0.1 + 0.8 * Math.random()).toFixed(4),
  y: +(0.15 + 0.7 * Math.random()).toFixed(4),
});
/* Sandbox: a map picked on the Map page. Duck Cabin's row (or a world row, sbMap) puts it on that world; any other map
   (or a vote, or Random) puts it on the board */
export function sbMapPicked(s, o) {
  if ("sbMap" in o) return;
  if (isWorldMap(o.map)) s.options.sbMap = s.options.sbMap || "cabin";
  else if (o.map || o.mapPick) s.options.sbMap = "";
}
/* the most players the room takes: its own most, or fewer for a made game mode (its settings file's player limit, the
   owner's: "it's 2 players max for the actual game mode when it's made, not for the actual sandbox itself") */
export const capOf = (s) =>
  s.options.mode === "sandbox" && s.options.gm && +s.options.gmMost >= 2
    ? Math.min(s.max, +s.options.gmMost)
    : s.max;
/* the countdown or a vote is over: the next vote, or the game */
export function nextVote(s, now) {
  if (s.vt) closeVote(s);
  if (s.sbpk) {
    delete s.sbpk; // (the host's pick skipped: a new Sandbox)
    sbPick(s, {}, now);
  }
  if (sbAskDue(s)) {
    sbAsk(s, now); // (Sandbox: the host picks a new Sandbox or a save first, sbsave.js)
    return s;
  }
  const q = s.voteQ || [];
  while (q.length) {
    const k = q.shift();
    if (k === "map" && NO_MAP_VOTE.includes(s.options.mode)) continue;
    s.voteQ = [...q];
    openVote(s, k, now);
    return s;
  }
  delete s.voteQ;
  placeMap(s);
  return beginGame(s, now);
}
/* the start: Democracy's locks, Random's first game, then the 5 s countdown (the votes come after it). Returns null
   when the room has too few players for the host's game (the lobby says how many it needs) */
export function countdown(s, now) {
  if (dodOn(s, "vote")) s.options.modePick = s.options.mapPick = "vote"; // (Democracy of Ducklings: the ducks always vote)
  if (dodOn(s, "justin")) s.options.justin = 1; // (and Justin is invited)
  if (s.options.modePick === "random") {
    s.modeBag = [];
    setMode(s, nextMode(s));
  }
  if (s.options.modePick !== "vote" && s.seat.length < minOf(s)) return null;
  s.voteQ = votesDue(s);
  s.gamesLeft = returnIn(s);
  delete s.vt;
  return counting(s, now);
}
function counting(s, now) {
  dealRainbow(s); // (Rainbow Ducks: each duck's look for this game)
  s.phase = "countdown";
  s.at = now;
  s.ends = now + (s.solo ? SOLO_COUNTDOWN : COUNTDOWN) * 1000;
  return s;
}
/* a game is over: Vote return counts it (both votes come back when it's time), then Random's next game; null when the
   room just goes on */
export function gameOver(s, now) {
  const due = votesDue(s);
  if (due.length && +s.gamesLeft > 0 && --s.gamesLeft <= 0)
    return voteAgain(s, now, due);
  if (rolling(s)) return rotate(s, now);
  return null;
}
/* Vote return: back to the lobby (nobody kicked comes back in) and straight into the votes, then the next game */
export function voteAgain(s, now, due) {
  const banned = s.banned;
  backToLobby(s, "Time to vote again!");
  s.banned = banned;
  if (rolling(s)) setMode(s, nextMode(s));
  s.voteQ = due;
  s.gamesLeft = returnIn(s);
  dealRainbow(s);
  return nextVote(s, now);
}
export const rolling = (s) => s.options.modePick === "random";
/* Random, at the end of a round: the room goes straight into the next game (nobody kicked comes back in) */
export function rotate(s, now) {
  const mode = nextMode(s),
    was = s.options.mode,
    banned = s.banned;
  backToLobby(s, `Next game: ${modeOf(mode).name}!`);
  s.banned = banned;
  s.options.mode = mode;
  writeTimerFor(s, was);
  cabinMap(s); // (into Duck Cabin, or out of it)
  return beginGame(s, now);
}
/* the countdown is over: the game begins (Random: again for every new game) */
export function beginGame(s, now) {
  const P = s.players;
  useMode(baseMode(s.options)); // (a vote or Random may have changed the mode in this same action: its map first, so Dead Ducks Arcade starts on Downpour)
  s.startedAt = now;
  ammoReset(s); // (every gun full again)
  if (isSb(s)) sbBegin(s, now); // (a save's NPCs back, its session named: sbsave.js)
  s.round = 0;
  s.history = [];
  s.back = {};
  s.subs = [];
  s.jumps = {};
  s.bbPast = [];
  s.wqPast = [];
  s.wqScore = { quack: 0, room: 0 };
  s.wqPickers = [];
  for (const id of s.seat) P[id].ready = false;
  if (isSc(s)) {
    s.sc = { stories: [] };
    return startStory(s, now, true);
  }
  if (isHang(s)) {
    hangStart(s, now);
    return enter(s, "hang", now);
  }
  if (sbOnBoard(s)) {
    s.pos = {};
    s.lock = {};
    for (const id of s.seat) s.pos[id] = sbSpot();
    return enter(s, "sandbox", now); // (Sandbox on the board: one phase that never ends, till Leave Sandbox)
  }
  s.dn = null;
  if (isDn(s)) dnStart(s);
  s.mz = null;
  s.vd = null;
  if (isVd(s)) return vdStart(s, now);
  s.tv = null;
  if (isTv(s)) return tvStart(s, now);
  return isBb(s)
    ? startTourney(s, now)
    : isQuack(s)
      ? startQuackRound(s, now)
      : enter(s, "submit", now);
}
