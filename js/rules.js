/* ---------- the rules of Agree or Disagree ----------
   The room's whole state and every change to it, as plain data: reduce(state, action, now) returns the next state. The host
   runs it (alone in a TEST room; for everyone online later), so every player sees the same game.

   A round: everyone submits a question (or none) → each question in turn: answer (move your duck onto a column, end your
   turn) → talk it over → the next question → the round's results → the next round. The rounds go on until the players
   vote to end the game.

   A phase ends when enough players have ended their turn (2 of 3 by default). In submit and answer, reaching that starts
   the catch-up timer (15 s by default) for the rest; a timer, when one is set, ends the phase too.

   Would You Rather is the same with two choices. Bicker Brackets (below) runs a tournament a round; Story Chain (below
   that) writes a paragraph a round. Who is the Quack? has its own rules in quackrules.js. Lawyering (at the end) argues
   each topic out: two attorneys in the middle, the jury walks to the one who convinced them. Hangout has no rounds: the
   room walks around Duck Cabin until it goes back to the lobby (its parts are in hangout/rules.js). Duncelation has its
   own rules in duncerules.js: one defender in the circle, everyone else walks to Dunce or Not a Dunce. Valentine's Duck
   Date has its own in vddrules.js: The Date at the dining table, a date with each Suitor, then a Suitor Turned Down. */

import { baseMode, isSb, sbOnBoard, sbItemMods } from "./sandboxrules.js";

import { survSet } from "./survrules.js";

import "./gunmenrules.js"; // (Survival's gunmen: their rules hook into l4ddrules.js)

import { sbGot } from "./sbhot.js";

import { grCool } from "./sbgroups.js";

import { sbEnd } from "./sbsave.js";

import { stamp, took } from "./perf.js";

import { boardSpeed } from "./armspeed.js";

import {
  isDn,
  DN_CEREMONY,
  dealTakes,
  startTake,
  nextTake,
  afterDunce,
  dnCheck,
  isDefender,
} from "./duncerules.js";

import {
  isVd,
  VD_PHASES,
  VD_WRITE,
  VD_DOWN,
  VD_VAL,
  vdAdvance,
  vdAfter,
  vdSkip,
  vdJoin,
  isDate,
} from "./vddrules.js";

import {
  isTv,
  TV_BOARD,
  tvRound,
  tvDeal,
  tvAdvance,
  tvJoin,
  tvSkip,
  tvLimit,
} from "./triviarules.js";

import {
  isQuack,
  QUACK_PHASES,
  startQuackRound,
  quackAdvance,
  quackSkip,
  tileCenter,
} from "./quackrules.js";

import { hangJoin, hangLeft } from "./hangout/rules.js";

import { useMode } from "./hangout/layout.js";
import { carsAt } from "./carpush.js";

import { helperOut } from "./l4ddrules.js";

import { ARMS, GUN_BREEDS, BOARD_GUNS } from "./guns.js";
import { magKey } from "./ammo.js";

import { MAPS, MAP_FORMS, mapForm, mapName } from "./maps.js";

import { modesFor, modeOf } from "./modes.js";

import { umapTitle, isUmap } from "./umaprules.js";

import {
  PODIUM,
  endMatch,
  endSeedTurn,
  endTopics,
  nextMatch,
  pickTopic,
  settleTie,
  startTourney,
} from "./bbrules.js";

import {
  SC_BOARD,
  SC_PHASES,
  SC_WORDS,
  scAdvance,
  scFreeOf,
  scPara,
  scStory,
  scZones,
  startNext,
  startStory,
} from "./scrules.js";

import {
  ATT_PHASES,
  ATT_TIME,
  attCheck,
  counselDone,
  endCounsel,
  lawCheck,
  nextCase,
  startCase,
} from "./lawrules.js";

import { sizeShots } from "./boardfire.js";

/* (what l4ddrules.js asks of the board's weapons comes by here, not from boardfire.js: boardfire.js imports sbcabin.js, which
   needs l4ddrules.js whole before it runs, so l4ddrules.js must not import boardfire.js itself) */
export { shovePx } from "./boardfire.js";

import { STAGE, countTurn, dodOn, isSudo } from "./roomrules.js";

import {
  gameOver,
  rolling,
  rotate,
  sbSpot,
  voteAgain,
  votesDue,
} from "./voterules.js";

import { SB_ACTS } from "./actsb.js";

import { PLAY_ACTS } from "./actplay.js";

import { ROOM_ACTS } from "./actroom.js";

import { shuffle, anyOf } from "./random.js";

export const COLS = [
  "Strongly disagree",
  "Disagree",
  "Slightly disagree",
  "Neutral",
  "Slightly agree",
  "Agree",
  "Strongly agree",
];
export const SHORT = ["−−−", "−−", "−", "0", "+", "++", "+++"];
export const OPTIONS_DEFAULT = {
  order: "random", // random | rotate: the order of the round's questions
  share: 0.67, // how many players must vote to start the countdown: .5, .67, .75, 1 (half by default with the Discussion round on)
  sbMap: "", // Sandbox's world: "" (the board, on the room's map) | "cabin" (Duck Cabin) | "downpour" (sandboxrules.js)
  answerTime: 0, // the default answer time in seconds: 0 (off), 30, 60, 90. I want no answer timer by default; a question's writer can still pick one
  catchUp: 15, // 0 (off), 15, 30, 45: the countdown once enough players have voted (everyone voting ends it at once)
  writeCatch: 30, // 0 (off), 15, 30, 45, 60: the same countdown while writing (questions, topics, contenders, secret words): I want the last writers to get 30 s by default
  endBtn: 0, // 1: End round: in the social games a vote doesn't end the turn; a button does, once the needed share has voted (Trivia always has it)
  unvoteStops: 1, // 1: taking a vote back below the share stops that countdown (I want this by default); 0: once started it runs out anyway
  discuss: 0, // 1: the Discussion round after each vote comes back (Agree or Disagree, Would You Rather, Bicker Brackets, Lawyering)
  submitTime: 132, // 0 (off), 60, 90, 120, 132 (2:12): a time limit on writing questions; Bicker Brackets starts with none (0)
  botWait: 5, // TEST rooms: seconds before computers act
  fun: 1, // the silly commands (lightning, love, kill, hotdog): 1 on, 0 off
  ghosts: 0, // 1: Duck Cabin's ghosts (hangout/ghosts.js): a knocked-down duck's ghost walks about until Space
  sbTint: 0, // Sandbox on the board: 1 puts a slowly changing colored field over the map (off: the map shows plain)
  sbAll: 0, // Sandbox: 1, every player has all of Sandbox's rights (sandboxrules.js sbCan); 0, the host and whoever it lets
  sbOkB: 0, // Sandbox: 1, every player may use Build (B) without the rights; the same for M, N, H and G (sandboxrules.js sbMay)
  sbOkM: 0,
  sbOkN: 0,
  sbOkH: 0,
  sbOkG: 0,
  hangTime: 15, // Hangout's time limit in minutes when Random or the vote picked it: 0 (none), 5, 10, 15, 20, 30 (never when the host picks it)
  ghostBusy: 1, // 1: no ghost from a duck busy with an activity (chalk, piano, guestbook, cards, a seat …): it just gets up
  justin: 0, // 1: Duck Cabin's Justin walks the boards too, as a joke (js/boardjustin.js); he never counts
  freeRoam: 0, // 1: no answer lock and no talk-it-over step; ducks roam until the turn ends
  map: "board", // board | sky | pixel | carnival | stars | rabbit | collage | euclid | ec | vellum | tiles | cabin (Duck Cabin: only for its own games, the Cabin ones)
  mapPick: "vote", // "" (the host's map) | vote (Vote for Map, part of Vote Mode & Map) | random: settled when the game starts
  modesOff: [], // the game modes left out of Random and Vote Mode & Map (Game Settings → Modes in Random & Vote)
  modePick: "vote", // "" (the host's game) | vote (Vote for Game Mode: Vote Mode & Map is on by default, owner 2026-11-04) | random (a new game every round)
  voteBack: 3, // Vote return: the games until both votes come back: 1 … 6, "r" (a random 1 to 6 each time) or 0 (never)
  trueRandom: 0, // with Random: 1 = any game can come next; 0 = every game once before a new shuffle
  mode: "aod", // the game: aod (Agree or Disagree) | wyr (Would You Rather) | ddr (Does Duck Relate?) | bb (Bicker Brackets) | sc (Story Chain) | quack (Who is the Quack?) | law (Lawyering) | dunce (Duncelation) | vdd (Valentine's Duck Date) | trivia (Trivia) | hang (Hangout)
  bbSeeds: "t8", // Bicker Brackets: t8, t12, t16, t32, t64 seeds shared out, or p1 … p4 seeds for each player
  bbTopic: "vote", // vote (everyone writes one, then votes) | random (one of BB_TOPICS)
  bbBlind: 0, // 1: a seed's writer stays hidden until it is knocked out or wins
  bbTimer: 0, // seconds a match vote may take (0: no timer, so players can sway each other)
  bbReview: 0, // 1: the bracket shows (and the room looks at it) after every round of matches; 0: only the champion's one
  stats: 1, // 0: no stats screen after a round (the next round, or the story's next paragraph, starts at once)
  wqPicker: "player", // Who is the Quack?: player (a random player picks the word) | list (the built-in words)
  wqPickTime: 60, // seconds to pick the word (then what they typed, or a word from the list)
  wqQuacks: 1, // 1 or 2 (2 only with 6 or more players)
  wqTimer: 0, // seconds a vote may take (0: none)
  scTime: 0, // Story Chain: seconds to write a line (0: no timer)
  scVote: "auto", // … voting on lines and secret words: 1 | 0 | auto (none with 2 or 3 players, so a vote means something)
  lawDef: "random", // Lawyering: who picks the defense attorney: random | writer (the topic's writer) | vote (the room)
  lawOff: "random", // … and the offense attorney
  lawVote: 0, // 1: Lawyering: each case the room votes the defense, then the offense, in a window over the board (it takes the place of lawDef and lawOff)
  lawClose: 60, // seconds of closing arguments when the jury is split: 30, 60, 120
  dunceTime: 120, // Duncelation: seconds the defender gets after the grace period: 0 (off), 60, 120, 180, 300
  dunceTakes: "random", // … whose take you defend: random (it can be your own) | own (you write your own) | notOwn (never your own)
  noOwn: 0, // Duncelation and Lawyering, "Don't get your own prompt": 1 = you never defend or argue the prompt you wrote
  mapGrey: 0, // the collage map: 1 turns it black and white
  mapZoom: 0, // Euclid's Squares, picked by the host: 1 zooms into its tiny squares forever (s.mapZoomed in the game)
  invuln: 0, // 1: Invulnerability: nothing takes a duck down or takes its HP, hits only flash red
  noChat: 0, // 1: No Chat: text chat is off for everyone, the host too (the game's own messages still show)
  noTerm: 0, // 1: No Terminal: the command line is off for everyone, the host too
  aodColors: "rainbow", // Agree or Disagree's board: rainbow | gr (shades of green and red, Neutral fading black, grey, white)
  hideNames: 0, // 1: name tags stay hidden while answering (Agree or Disagree, Would You Rather, Does Duck Relate?)
  showWriter: 0, // 1: the question's writer is named after the vote (Agree or Disagree, Would You Rather)
  scLines: 1, // Story Chain: lines each player writes before the paragraph ends: 1 … 4
  lateJoin: "play", // play (a player who joins mid-game plays at once) | watch (they wait for the next round)
  walk: "normal", // walking speed: slow | normal | fast
  textMax: 200, // the most characters a question, topic or take can have: 80, 140, 200 (the old limit) or 280
  hideLooks: 0, // Hide customization: 1 = every duck is the plain yellow duck during the game (looks.js)
  noGore: 0, // Gore off: 1 = no blood or gore on the board (fx.js)
  infAmmo: 0, // Unlimited ammo: 1 = guns reload but never run out (ammo.js)
  noFx: 0, // Heavy effects off: 1 = no gun smoke, muzzle flashes or screen shake, the effects that are hard on the game (fx.js)
  rainbowDucks: 0, // … Rainbow Ducks (with hideLooks only): the seven rainbow colors and a brown Justin-costume duck, dealt at random
  voteColor: 0, // Vote colors: 1 = a duck takes the color of the tile it stands on (never with Rainbow Ducks)
  tagColor: 0, // … Change player tag color: 1 = the name tag takes the vote color too
  l4start: 1, // Quacky Zombies' Start on round: 1, 5, 9, 13 or 21 (round 0 goes on to it, everyone with bonus points: l4ddrules.js START_PTS)
  wildJustin: 1, // Quacky Zombies: 1 = Justin is out in Duck Cabin too, unarmed, as on Downpour (the owner's, Nov 17; Downpour always has him). On by default: the owner's, Nov 17 20:02Z, "he spawns in cabin now by default the same, without a weapon and cannot get a weapon"
  vdTime: 60, // Valentine's Duck Date: seconds a date's timer runs once The Date starts it: 0 (off, no timer button), 60, 90, 120
  tvWrite: 210, // Trivia: seconds to write the questions: 120, 210, 300 or 0 (no limit)
  tvMulti: 1, // … Multiple answers: 1 = a question can have several right answers (never all); 0 = exactly one
  tvNoWrong: 0, // … No wrong answers: 1 = a writer can leave every answer unmarked (it then counts for nobody's stats)
  tvMc: 1, // … Multiple choice: 0 = every question is written (never off with tvWr off)
  tvWr: 1, // … Written answers: 0 = no Written Answer button (never off with tvMc off)
  tvHide: 0, // … Hide who wrote it: 1 = the cloud shows a multicolored "?" in place of the writer
  tvStop: 1, // … Stop timer: 1 = anyone can stop the clock on the reveal after each question
  tvGrade: 0, // … Grading timer: 1 = the writer has 1:00 a row, and a row still ungraded then counts as right
  dod: 1, // Democracy of Ducklings: 1 (the ducks vote on the room's rules) | 0; set only when the room is made
  genOff: 0, // 1: the General Rules are off, and every game mode plays the default rules (unless its Mode Rules say otherwise)
  modeRules: {}, // Mode Rules: { mode: { setting: value } }, a game mode's own General Rules, which win in that mode
};
export const MAX_DEFAULT = 8;

/* ---------- Mode Rules (owner 2026-11-16) ----------
   The General Rules (Game Settings → Host Settings) count in every game mode. Each game mode has its Mode Rules too: the
   same settings, and one set there wins over the General Rules in that mode only. With the General Rules off, a game
   mode plays the default rules, unless its Mode Rules say otherwise. s.options holds what the game reads (the rules of
   the mode being played); s.options.gen holds the General Rules as the host set them, s.options.modeRules each mode's
   own, and s.options.genOff the switch */
export const GEN_RULES = [
  "share",
  "unvoteStops",
  "endBtn",
  "freeRoam",
  "justin",
  "invuln",
  "noChat",
  "noTerm",
  "lateJoin",
  "textMax",
];
/* a General Rule as the host set it (a room from before Mode Rules keeps it in the options themselves) */
export const genVal = (s, k) => {
  const g = s.options.gen;
  return g && k in g
    ? g[k]
    : k in s.options
      ? s.options[k]
      : OPTIONS_DEFAULT[k];
};
/* a General Rule in one game mode: its Mode Rule, else the General Rule (or the default, with the General Rules off) */
export function ruleFor(s, mode, k) {
  if (k === "justin" && dodOn(s, "justin")) return 1; // (Democracy's Invite Justin wins over both)
  const mine = (s.options.modeRules || {})[mode] || {};
  if (k in mine) return mine[k];
  return +s.options.genOff ? OPTIONS_DEFAULT[k] : genVal(s, k);
}
/* after every change: the options hold the rules of the mode now picked */
export function applyRules(s) {
  const o = s.options;
  if (!o) return;
  if (!o.gen) {
    const g = {};
    for (const k of GEN_RULES) g[k] = genVal(s, k);
    o.gen = g;
  }
  for (const k of GEN_RULES) {
    const v = ruleFor(s, o.mode, k);
    if (o[k] !== v) o[k] = v;
  }
}
/* Mode Rules as sent (from Game Settings or a save slot): only General Rules, each a plain value */
export function cleanModeRules(x) {
  const out = {};
  if (!x || typeof x !== "object" || Array.isArray(x)) return out;
  for (const [m, r] of Object.entries(x)) {
    if (!r || typeof r !== "object" || Array.isArray(r)) continue;
    const one = {};
    for (const [k, v] of Object.entries(r))
      if (GEN_RULES.includes(k) && ["string", "number"].includes(typeof v))
        one[k] = v;
    if (Object.keys(one).length) out[m] = one;
  }
  return out;
}
/* the settings as the chat words a change: the General Rules as set, each Mode Rule as "mr:<mode>:<setting>" */
export function flatOptions(s) {
  const o = { ...s.options, max: s.max };
  delete o.gen;
  delete o.modeRules;
  for (const k of GEN_RULES) o[k] = genVal(s, k);
  for (const [m, r] of Object.entries(s.options.modeRules || {}))
    for (const [k, v] of Object.entries(r)) o[`mr:${m}:${k}`] = v;
  return o;
}

/* a vote's count: the votes of the players in the game (Vote Mode & Map, below) */
export const tally = (s, votes) => {
  const n = {};
  for (const id of s.seat) {
    const v = (votes || {})[id];
    if (v) n[v] = (n[v] || 0) + 1;
  }
  return n;
};
export const winner = (n, pool) => {
  const ok = Object.keys(n).filter((k) => pool.includes(k)),
    top = Math.max(0, ...ok.map((k) => n[k])),
    tied = ok.filter((k) => n[k] === top);
  return anyOf(top ? tied : pool);
};
/* the maps the map vote and Random choose from: every board map in each of its forms (Euclid's Squares still or
   zooming, Shelter Sky & Null in colors or black and white). Duck Cabin comes with its own games. Each map, then
   right after it its variations, then the next map; the maps without variations first, and the more variations a map
   has the later it comes (the owner's, Nov 17 19:22Z: "MAP FIRST, THEN ... IT'S VARITIONS FOLLOW AFTER ... the last
   maps are the ones with the most variations") */
const MAP_IDS = MAPS.map((m) => m[0]);
const formsOf = (id) => (MAP_FORMS[id] || []).filter((f) => f !== id);
export const VOTE_MAPS = MAP_IDS.map((id, i) => [id, i])
  .sort(([a, i], [b, j]) => formsOf(a).length - formsOf(b).length || i - j)
  .flatMap(([id]) => [id, ...formsOf(id)]);
/* Random's map, and the map vote's dice (owner, Nov 16): a bag of maps, each holding a bag of its variations, so the
   variations never crowd out the other maps. The map played least tonight comes first (never the one just played while
   another is left), then the variation of it played least. s.mapPlays = { m: { map: n }, f: { variation: n } } */
const baseOf = (id) =>
  MAP_IDS.find((b) => (MAP_FORMS[b] || [b]).includes(id)) || id;
export function pickMap(s) {
  const P = (s.mapPlays = s.mapPlays || { m: {}, f: {} }),
    least = (ids, n, last) => {
      const pool = ids.length > 1 ? ids.filter((id) => id !== last) : ids,
        lo = Math.min(...pool.map((id) => n[id] || 0));
      return anyOf(pool.filter((id) => (n[id] || 0) === lo));
    },
    base = least(MAP_IDS, P.m, P.lastM),
    forms = MAP_FORMS[base] || [base];
  return forms.length > 1 ? least(forms, P.f, P.lastF) : base;
}
/* a map played: counted for the bags above */
export function countMap(s, id) {
  const P = (s.mapPlays = s.mapPlays || { m: {}, f: {} }),
    base = baseOf(id);
  P.m[base] = (P.m[base] || 0) + 1;
  P.f[id] = (P.f[id] || 0) + 1;
  P.lastM = base;
  P.lastF = id;
}
/* A shuffle bag for every random pick of a player's role (the Quack, the date, an attorney, the first writer), so nobody
   is picked over and over: each eligible player goes in a bag, one is drawn without putting it back, and the bag is
   filled and shuffled again when nobody eligible is left in it (the one picked last never opens the new bag). One bag
   for each `key` in the room, kept in the state, so it lasts the whole night: s.bags = { key: { left: [ids], last } }.
   Players who joined are in the bag from the next draw; a player who left comes out of it. ids: who may be picked now
   (the caller has left out whoever can't be: the writer, the date). Returns null when ids is empty. */
export function bagPick(s, key, ids) {
  if (!ids.length) return null;
  const bags = (s.bags = s.bags || {}),
    bag = (bags[key] = bags[key] || { left: [], last: null }),
    alive = (id) => !!(s.players || {})[id],
    refill = () => {
      const all = shuffle(
        s.seat.filter(alive).filter((id) => ids.includes(id)),
      );
      const rest = shuffle(ids.filter((id) => !all.includes(id)));
      bag.left = [...all, ...rest];
      if (bag.left.length > 1 && bag.left[0] === bag.last)
        bag.left.push(bag.left.shift()); // (never the one picked last first)
    };
  // (everyone seated who isn't in the bag yet and wasn't drawn this lap joins it)
  const seen = new Set([...(bag.left || []), ...(bag.drawn || [])]);
  bag.left = (bag.left || []).filter(alive);
  bag.drawn = (bag.drawn || []).filter(alive);
  const fresh = !seen.size; // (a new bag: shuffled before the first draw)
  for (const id of s.seat) if (alive(id) && !seen.has(id)) bag.left.push(id);
  if (fresh) shuffle(bag.left);
  let pick = bag.left.find((id) => ids.includes(id));
  if (pick === undefined) {
    bag.drawn = [];
    refill();
    pick = bag.left.find((id) => ids.includes(id));
  }
  bag.left = bag.left.filter((id) => id !== pick);
  bag.drawn = [...bag.drawn, pick];
  bag.last = pick;
  return pick;
}
/* the map the vote or Random lands on, in its form (s.mapZoomed, s.mapGreyed) */
export function setMap(s, won) {
  countMap(s, won);
  const f = mapForm(won);
  s.options.map = f.map;
  s.mapZoomed = f.zoom ? 1 : 0;
  s.mapGreyed = f.grey ? 1 : 0;
  say(s, `The map: ${isUmap(won) ? umapTitle(s, won) : mapName(won)}!`);
}
export const fits = (s, id) => s.seat.length >= (MIN_PLAYERS[id] || 0);
/* Random: the games it plays (never Quacky Zombies, nor a game the room is too small for; Hangout comes up too, with its
   own time limit); each round is the next one in the bag, every game once before a new shuffle, or with True Random
   any game at all */
export const randomPool = (s) => {
  const all = modesFor(s)
      .map((m) => m.id)
      .filter((id) => modeOf(id).inRandom !== false && fits(s, id)),
    off = s.options.modesOff || [],
    on = all.filter((id) => !off.includes(id));
  return on.length ? on : all; // (every one turned off: Random and the vote still have games to pick from)
};
export function nextMode(s) {
  const pool = randomPool(s);
  if (!pool.length) return "aod";
  if (s.options.trueRandom) return anyOf(pool);
  let bag = (s.modeBag || []).filter((id) => pool.includes(id));
  if (!bag.length) bag = shuffle([...pool]);
  const next = bag.shift();
  s.modeBag = bag;
  return next;
}
/* I want a write timer of 2:12 everywhere but Bicker Brackets: changing to or from them moves it along while it's still
   at the other default */
export function writeTimerFor(s, wasMode) {
  const bare = (m) => !!modeOf(m).noWriteTimer;
  if (bare(s.options.mode) && s.options.submitTime === 132)
    s.options.submitTime = 0;
  else if (!bare(s.options.mode) && s.options.submitTime === 0 && bare(wasMode))
    s.options.submitTime = 132;
}
export function setMode(s, mode) {
  const was = s.options.mode;
  s.options.mode = mode;
  writeTimerFor(s, was);
  say(s, `The game: ${modeOf(mode).name}!`);
}

export const COUNTDOWN = 5;
/* Single Player's start counts only 2, 1, 0 (the owner's, Nov 19 23:10Z: "it starts at second number 2, goes to 1, and
   then 0 in single player") */
export const SOLO_COUNTDOWN = 2;
export const VOTE_GRACE = 5; // seconds at the start of a question before anyone can lock a vote (a stray Enter can't)

/* every action works on a copy of the state, so a rule that fails halfway leaves the room as it was. The state is plain
   objects, arrays, strings and numbers (it travels as JSON online), and copying those by hand is 2 to 6 times faster
   than structuredClone (measured Nov 15 in Quacky Zombies, Mad God Justin, Hangout and Agree or Disagree). Anything
   else, a Set or a Date say, still goes through structuredClone. */
export function clone(o) {
  if (o === null || typeof o !== "object") return o;
  if (Array.isArray(o)) {
    const n = o.length,
      a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = clone(o[i]);
    return a;
  }
  const pr = Object.getPrototypeOf(o);
  if (pr !== Object.prototype && pr !== null) return structuredClone(o);
  const r = {};
  for (const k in o) r[k] = clone(o[k]);
  return r;
}
const colOf = (x) => Math.max(0, Math.min(6, Math.floor(x * 7)));
const colX = (c) => (c + 0.5) / 7;
/* the edges of a column, a little inside, for ducks kept in their column */
const colBounds = (c) => [c / 7 + 0.035, (c + 1) / 7 - 0.035];
/* the board by game mode: Agree or Disagree has its seven columns; Would You Rather two tiles, A on the left and B on the
   right, with an OR strip between them where a duck has no answer (-1) */
export const isWyr = (s) => s.options.mode === "wyr";
/* Does Duck Relate?: Agree or Disagree's written statements on two tiles, Duck Does Relate (A, left) or Duck Doesn't
   Relate (B, right) */
export const isDdr = (s) => s.options.mode === "ddr";
export const isBb = (s) => s.options.mode === "bb";
export const isSc = (s) => s.options.mode === "sc";
export const isLaw = (s) => s.options.mode === "law";
/* the walkable world is running: phase "hang" is the one phase every game on a world map plays in (Hangout, Quacky
   Zombies, Survival, Mad God Justin, Sandbox on a world), so everyone asks this, never the phase's name */
export const inWorld = (s) => s.phase === "hang";
/* Duck Cabin's world: Hangout, and Quacky Zombies on the same map (its own rules: l4ddrules.js) */
export const isHang = (s) =>
  baseMode(s.options) === "hang" || baseMode(s.options) === "l4dd"; // (Sandbox on a world map runs as that world's mode: sandboxrules.js)
/* a match in Bicker Brackets: seed A on the left, B on the right; Who is the Quack?: vote (left) or more clues; Lawyering:
   the offense (sword) on the left, the defense (shield) on the right, and between them a wider strip with the attorneys'
   circle; Duncelation: Dunce on the left, Not a Dunce on the right, and the same strip with the defender's circle */
export const twoSided = (s) =>
  isWyr(s) ||
  isDdr(s) ||
  isBb(s) ||
  isLaw(s) ||
  isDn(s) ||
  (isQuack(s) && s.phase === "choice");
export const LAW_MID = [0.42, 0.58];
const ringed = (s) => isLaw(s) || isDn(s);
export const colAt = (s, x) =>
  ringed(s)
    ? x < LAW_MID[0]
      ? 0
      : x > LAW_MID[1]
        ? 1
        : -1
    : twoSided(s)
      ? x < 0.46
        ? 0
        : x > 0.54
          ? 1
          : -1
      : colOf(x);
export const colXAt = (s, c) =>
  twoSided(s) ? ([0.25, 0.75][c] ?? 0.5) : colX(c);
export const colBoundsAt = (s, c) =>
  ringed(s)
    ? [
        [0.03, 0.4],
        [0.6, 0.97],
      ][c] || [0.44, 0.56]
    : twoSided(s)
      ? [
          [0.03, 0.44],
          [0.56, 0.97],
        ][c] || [0.47, 0.53]
      : colBounds(c);
export const startX = (s) => (twoSided(s) || isSc(s) ? 0.5 : colX(3)); // where ducks start: Neutral, or the OR strip
/* the phases with ducks on the board (Bicker Brackets: its stats fill the screen; ducks walk over the bracket instead;
   Story Chain: ducks walk up and down the story) */
export const boardPhases = (s) =>
  isHang(s)
    ? ["hang"]
    : sbOnBoard(s)
      ? ["sandbox"]
      : isBb(s)
        ? ["answer", "tie", "discuss", "bracket"]
        : isSc(s)
          ? SC_BOARD
          : isQuack(s)
            ? ["clue", "choice", "accuse", "reveal"]
            : isLaw(s)
              ? ["answer", "discuss", ...ATT_PHASES]
              : isDn(s)
                ? ["answer", "discuss", "dunced"]
                : isVd(s)
                  ? VD_PHASES
                  : isTv(s)
                    ? TV_BOARD
                    : ["answer", "discuss", "results"];
export const humanIds = (s) => s.seat.filter((id) => !s.players[id].bot);
/* who plays now: a player who joined in the middle of a turn they can't take part in walks around until the next one */
export const playing = (s) =>
  s.seat.filter((id) => !(s.players[id] || {}).late);
export const seatLate = (s) => {
  for (const id of s.seat) if (s.players[id]) delete s.players[id].late;
}; // they play from here
/* the fewest players a game needs. I want a game that drops below it to wait for players ("Waiting for players to
   continue", with 2/3 and the like) instead of ending: the timers stop where they were, ducks still walk, and the game
   goes on once enough are back */
const MIN_PLAYERS = { quack: 3, law: 3, dunce: 3, vdd: 3, trivia: 2 };
export const minOf = (s) => MIN_PLAYERS[s.options.mode] || 0;
export const running = (s) => !["lobby", "over", "countdown"].includes(s.phase);
const WAIT_BLOCK = [
  "end",
  "wqWord",
  "giveUp",
  "tieVote",
  "skip",
  "voteReview",
  "dnEnd",
  "vdTimer",
];
export const tooFew = (s) => running(s) && s.seat.length < minOf(s);
/* resume: 'phase' (go on where it stopped), 'quackRound' (a new secret word), 'case' (this case again) or 'take' (this
   take again) */
export function waitFor(
  s,
  now,
  resume = "phase",
  line = `Waiting for players to continue (${s.seat.length}/${minOf(s)}).`,
) {
  if (s.waiting) {
    if (resume !== "phase") s.waiting.resume = resume;
    return s;
  }
  const left = (t) => (t ? Math.max(0, t - now) : 0);
  s.waiting = {
    at: now,
    resume,
    ends: left(s.ends),
    catchEnds: left(s.catchEnds),
  };
  s.ends = 0;
  s.catchEnds = 0;
  say(s, line);
  return s;
}
export function resumeGame(s, now, line = "Enough players: the game goes on!") {
  const w = s.waiting;
  if (!w) return s;
  delete s.waiting;
  const d = now - w.at;
  s.at += d;
  if (w.ends) s.ends = now + w.ends;
  if (w.catchEnds) s.catchEnds = now + w.catchEnds;
  if (s.law && s.law.close) s.law.close += d;
  say(s, line);
  if (w.resume === "quackRound") return startQuackRound(s, now);
  if (w.resume === "case") return startCase(s, now);
  if (w.resume === "take") return startTake(s, now);
  return advance(s, now);
}
/* Lawyering and Duncelation: I want a player who lags out or leaves to come back to their place (where they stood, what
   they'd done in that turn, k). s.back = { id: { pos, lock, done, k } } keeps it for the rest of the game. An attorney (the defender) who
   leaves mid-case holds the case: the game waits for them (s.waiting.for, .name) with a Next round vote on everyone's
   screen (s.waiting.go = { id: true }); it goes on as it was when they're back, or without them once enough press it */
/* where an attorney may stand: all of the duck on their own side, not half in the middle (0.04: half a duck) */
export const counselBounds = (s, id) => {
  const off = id === s.law.off,
    [lo, hi] = colBoundsAt(s, off ? 0 : 1);
  return off ? [lo, hi - 0.04] : [lo + 0.04, hi];
};
export const holdsBack = (s) => (isLaw(s) || isDn(s) || isVd(s)) && running(s);
export const holdsCase = (s, id) =>
  !s.players[id].bot &&
  ((s.phase === "answer" &&
    ((isLaw(s) &&
      !!s.law &&
      s.law.w == null &&
      (s.law.off === id || s.law.def === id)) ||
      (isDn(s) &&
        !!s.dn &&
        !!s.dn.cur &&
        s.dn.cur.w == null &&
        isDefender(s, id)))) ||
    (isVd(s) && VD_PHASES.includes(s.phase) && isDate(s, id))); // (Valentine's Duck Date: The Date)
export function holdFor(s, id, name, now) {
  waitFor(
    s,
    now,
    "phase",
    `Waiting for ${name} to come back, or press Next round to go on without them.`,
  );
  Object.assign(s.waiting, { for: id, name, go: {} });
}
/* enough pressed Next round: the game goes on without the one who left. I want this checked whenever the count can change,
   a press, or someone else leaving (the need drops with them). It returns the new state, or null if not enough yet */
export function goOnDone(s, now) {
  const w = s.waiting;
  if (!w || !w.for || goOnVotes(s).length < goOnNeed(s)) return null;
  const name = w.name;
  delete w.for;
  delete w.go;
  if (tooFew(s)) return s; // (still too few to play: it waits for players)
  return resumeGame(s, now, `The game goes on without ${name}.`);
}
export const goOnVotes = (s) => {
  const g = (s.waiting && s.waiting.go) || {};
  return playing(s).filter((id) => g[id]);
};
export const goOnNeed = (s) =>
  Math.max(
    1,
    Math.ceil(
      playing(s).filter((id) => !s.players[id].bot).length * shareOf(s) - 1e-9,
    ),
  ); // (the usual share of the players; computers don't vote)
/* someone left or was removed: a game below its fewest players waits (a countdown that can't start goes back to the lobby) */
export function shortHanded(s, now, gone, wasQuack) {
  if (s.phase === "countdown" && s.seat.length < minOf(s)) {
    s.phase = "lobby";
    s.ends = 0;
    return true;
  }
  if (!tooFew(s)) return false;
  waitFor(s, now, wasQuack ? "quackRound" : "phase"); // (a Quack gone: a new word once enough are back)
  return true;
}
/* the share of players that ends a turn; the 2-of-3 tile stores .67, which must count as exactly 2/3 (3 players * .67 is 2.01: it wanted all 3) */
export const shareOf = (s) =>
  Math.abs(s.options.share - 0.67) < 0.005 ? 2 / 3 : s.options.share;
/* the all-rounds review votes, counted among the players the share is of (not one who joined mid-turn, not one who left) */
export const reviewCount = (s) =>
  playing(s).filter((id) => s.reviewVotes[id]).length;
export const needed = (s) =>
  Math.max(1, Math.ceil(playing(s).length * shareOf(s) - 1e-9));
/* the End round button (the host's setting, off by default): in the social games where ducks vote, the votes don't end the
   turn, the button does, and anyone playing can press it once the needed share has voted. A vote taken back below the
   share hides it again. The answer timer, when there is one, still ends the turn */
const END_BTN_MODES = ["aod", "wyr", "ddr", "sc"];
export const endBtnOn = (s) =>
  !!s.options.endBtn &&
  END_BTN_MODES.includes(s.options.mode) &&
  (isSc(s) ? ["lvote", "wvote"].includes(s.phase) : s.phase === "answer");
export const endDone = (s) =>
  isSc(s)
    ? playing(s).filter(scFreeOf(s)).length
    : playing(s).filter((id) => s.done[id]).length;
export const canEndRound = (s) => endBtnOn(s) && endDone(s) >= needed(s);
/* one turn: the writing stage, one question (its vote and talk), or the stat screen */
/* the turn a back-to-lobby (or skip) vote belongs to; Hangout has no turns, so a couple of minutes instead */
export const voteKey = (s, now) =>
  isHang(s) ? "hang" + Math.floor(now / 120000) : turnKey(s);
export const turnKey = (s) =>
  s.phase === "submit" || s.phase === "tvwrite"
    ? `w${s.round}`
    : ["answer", "discuss"].includes(s.phase)
      ? `q${s.round}.${s.qi}`
      : s.phase === "write" && s.sc
        ? `write${s.round}.${s.sc.turn}`
        : `${s.phase}${s.round}.${s.qi}`;
export const VOTE_TIME = 30; // seconds a kick or back-to-lobby vote stays open
/* every duck's arrows, bullets and thrown daggers fly this much faster than they first did, in every mode (the owner,
   Nov 3: "slightly faster") */
export const FASTER = 1.15;
/* the bow's arrow: it flies straight and fast the way it was aimed, on to the screen's edge */
export const ARROW_SPEED = boardSpeed("bow") * FASTER;
/* (Quacky Zombies' speeds, armspeed.js, in every mode; Justin's own bullets on the boards keep the old, slow BOSS_SHOT_SPEED) */
export const BOSS_SHOT_SPEED = 0.22 * FASTER;
/* a duck's shotgun pellet: the same speed, and so a shorter life, to fly as far as it did (1400 ms at 0.3 board widths
   a second), in a cone PELLET_SPREAD wide (radians) */
export const PELLET_V = boardSpeed("shotgun") * FASTER;
export const DUCK_PELLET_LIFE = Math.round((1400 * 0.3 * FASTER) / PELLET_V),
  PELLET_SPREAD = 0.34;
export const SHOT_SPEED = boardSpeed("handgun") * FASTER; // the handgun special's bullet: board widths a second (slow enough to see, and to jump over)
/* the thrown dagger: across the board at DAGGER_SPEED (board widths a second) while its height (in duck sizes) rises
   from the beak and falls: z = DAGGER_Z + DAGGER_UP·t − DAGGER_G·t²/2; it hits ducks only at their height, then falls
   on down off the screen */
export const DAGGER_SPEED = boardSpeed("dagger") * FASTER,
  DAGGER_Z = 0.45,
  DAGGER_UP = 1.2,
  DAGGER_G = 2.2,
  DAGGER_LIFE = 4500; // (it never flies over a duck's head: everything in its way is hit)
export const daggerZ = (t) => DAGGER_Z + DAGGER_UP * t - (DAGGER_G * t * t) / 2; // (t in seconds)
/* the grenade: thrown GRENADE_FAR duck lengths the way it aims, over an arc (its height in duck sizes), and it goes off
   where it lands, GRENADE_MS later, in its rings (boardfire.js blast, blast.js) */
export const GRENADE_MS = 900,
  GRENADE_FAR = 8;
export const grenadeZ = (t) => {
  const u = Math.min(1, t / (GRENADE_MS / 1000));
  return 0.45 * (1 - u) + 4.4 * u * (1 - u);
}; // (t in seconds)
export const PRESS = [
  "coffee",
  "watergun",
  "hotdog",
  "confgun",
  "handgun",
  "dagger",
  "knife",
  "hammer",
  "axe",
  "sword",
  "pan",
  "shotgun",
  "grenade",
  "bow",
  "sniper",
  "smg",
  "tommy",
  "ump",
  "ak",
  "revolver",
  "lmg",
  "glauncher",
  "dbarrel",
  "flamer",
  "burst",
  "chair",
  "zebra",
  "sound",
  "trombone",
  "confetti",
]; // the items, used with their number key
export const coolFor = (sp) =>
  GUN_BREEDS.board.cool[sp] ||
  (BOARD_GUNS.includes(sp) && ARMS[sp].cool) ||
  1500; // (Quacky Zombies' guns keep theirs, l4ddrules.js ARMS)
export const coolEnds = (s, id, sp) =>
  Math.max(
    ((s.lastUse || {})[`${id} ${sp}`] || 0) +
      ((isSb(s) && (sbItemMods(s, sp).cool || (sbGot(s, id, sp) || {}).c)) ||
        coolFor(sp)) /
        grCool(s, id), // (Sandbox: a loot orb's own wait, sbhot.js; a group's Cooldown speed, sbgroups.js)
    ((s.mag || {})[magKey(id, sp)] || {}).r || 0, // (a reload: ammo.js)
  ); // (a time on the room's clock)
/* the hammer's knock-back: a duck it hits is shoved (push.js KB_FAR) away from the swing in KB_MS, with a little hop
   (KB_HOP duck sizes high), and lands playing dead; pos.kb = { t, x, y: where it was } lets every screen draw the shove */
export const KB_MS = 380,
  KB_HOP = 0.3,
  KB_LAND = 110; // (KB_LAND: ms until the swing gets there; the duck falls then)
export const EFFECTS = [
  "zap",
  "flames",
  "hearts",
  "poison",
  "notes",
  "loserx",
  "ducklings",
  "disco",
  "invisible",
]; // the effects, shown around a duck (the Invisible duck: only on or off, never for 5 seconds)
/* the Chair special's chair: Mad God Justin's own, as slow (CHAIR_DUCKS duck lengths a second), for CHAIR_MS; it hits
   whatever its picture is over (chair.js) */
export const CHAIR_DUCKS = 2.8,
  CHAIR_MS = 8000;
/* an aim from the player: a direction on the board (x, y), about one board width long on their screen */
export const aimOf = (a, face) => {
  const ax = Math.max(-3, Math.min(3, +a.ax || 0)),
    ay = Math.max(-3, Math.min(3, +a.ay || 0));
  return Math.hypot(ax, ay) > 0.05 ? [ax, ay] : [face, 0];
};
/* is this special on one of the duck's number keys? (a duck from before the keys had one special) */
export const onKeys = (d, id) =>
  !!d &&
  (Array.isArray(d.keys) ? d.keys.slice(0, 10).includes(id) : d.special === id);
/* who votes, and how many yes votes pass it: a kick needs every other player; back to the lobby needs the usual share */
export function voteNeeds(s, v = s.vote) {
  if (!v) return { voters: [], need: 0 };
  const voters = humanIds(s).filter(
    (id) => v.kind !== "kick" || id !== v.target,
  );
  return {
    voters,
    need:
      v.kind === "kick"
        ? voters.length
        : Math.max(1, Math.ceil(voters.length * shareOf(s) - 1e-9)),
  };
}

export function newRoom({
  id,
  name,
  host,
  test = false,
  open = true,
  passkey = "",
  max = MAX_DEFAULT,
  options = {},
  solo = false,
}) {
  return {
    v: 1,
    id,
    name,
    test,
    ...(solo ? { solo: 1 } : {}), // (Single Player: only its games, and its picks are instant: modesFor, "vote")
    open,
    passkey,
    max,
    hostId: host.id,
    options: {
      ...OPTIONS_DEFAULT,
      ...(modeOf(options.mode).noWriteTimer ? { submitTime: 0 } : {}), // (Bicker Brackets starts with no write timer)
      ...options,
    },
    players: { [host.id]: { ...host, bot: false, ready: false } },
    seat: [host.id],
    phase: "lobby",
    at: 0,
    ends: 0,
    catchEnds: 0,
    round: 0,
    qs: [],
    qi: 0,
    lordTime: 0,
    pos: {},
    lock: {},
    done: {},
    fx: [],
    fxN: 0,
    history: [],
    reviewVotes: {},
    review: false,
    jumps: {},
    log: [],
    logN: 0,
  };
}

/* the time limit of the current phase (0 = none) */
function phaseLimit(s) {
  if (isTv(s) && s.phase.startsWith("tv")) return tvLimit(s);
  if (s.phase === "write") return +s.options.scTime || 0;
  if (["submit", "topic", "seeds"].includes(s.phase))
    return s.options.submitTime;
  if (s.phase === "answer") return s.lordTime;
  if (ATT_PHASES.includes(s.phase)) return ATT_TIME / 1000;
  if (s.phase === "podium") return PODIUM;
  if (s.phase === "dunced") return DN_CEREMONY;
  if (s.phase === "vdprompt") return VD_WRITE;
  if (s.phase === "vddate") return s.lordTime;
  if (s.phase === "vddown") return VD_DOWN;
  if (s.phase === "vdval") return VD_VAL;
  if (s.phase === "wqpick") return s.options.wqPickTime;
  if (inWorld(s)) return hangLimit(s);
  if (s.phase === "choice" || s.phase === "accuse") return s.options.wqTimer;
  return 0;
}
export function enter(s, phase, now) {
  const was = STAGE[s.phase];
  s.phase = phase;
  s.at = now;
  s.done = {};
  s.catchEnds = 0;
  countTurn(s, was);
  if (phase === "submit") s.drafts = {};
  if (phase === "submit" || phase === "results") seatLate(s); // late joiners play from here
  const lim = phaseLimit(s);
  s.ends = lim ? now + lim * 1000 : 0;
  return s;
}
/* the room's log (chat and notices); every line has a running number n, so new lines are easy to spot */
export const logLine = (s, line) => {
  s.logN = (s.logN || 0) + 1;
  s.log.push({ n: s.logN, t: Date.now(), ...line });
  if (s.log.length > 200) s.log.shift();
};
export const say = (s, text) => logLine(s, { sys: true, text });
/* a clear loss for these players (the owner's list: a Mad God Justin loss, a caught Quack or the room the Quack beat,
   the losing lawyer, the dunce, a knocked-out contender's writer): each device counts its own player's (unlocks.js) */
export function lostRound(s, ids, k) {
  const who = (ids || []).filter((id) => id && s.players[id]);
  if (!who.length) return;
  s.lossN = (s.lossN || 0) + 1;
  s.losses = [...(s.losses || []).slice(-19), { n: s.lossN, ids: who, k }];
}
export const sayFloat = (s, text, by) =>
  logLine(s, { sys: true, float: true, by, text }); // (a rule, group or room change: it floats by the chat button for everyone else)

/* the order of a round's questions: rotating (who goes first moves along each round) or random */
function orderQuestions(s, subs) {
  const ids = s.seat.filter((id) => subs[id]);
  if (s.options.order === "random") {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }
  const k = s.round % Math.max(1, s.seat.length);
  const rot = [...s.seat.slice(k), ...s.seat.slice(0, k)];
  return rot.filter((id) => subs[id]);
}

function startQuestion(s, now) {
  seatLate(s);
  const q = s.qs[s.qi];
  s.lordTime = s.options.answerOff ? 0 : q.time; // (forgame can turn the answer timer off for the rest of the game)
  s.pos = {};
  s.lock = {};
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: startX(s), y: (k + 1) / (s.seat.length + 1) };
  }); // everyone starts on Neutral (or the OR strip), lined up
  return enter(s, "answer", now);
}

/* everyone's answers to the current question go into the history */
function recordAnswers(s) {
  const q = s.qs[s.qi],
    a = {};
  for (const id of playing(s)) {
    const p = s.pos[id],
      c = p && p.x >= 0 ? colAt(s, p.x) : -1;
    if (c >= 0) a[id] = c;
  }
  s.history.push({
    round: s.round,
    by: q.by,
    text: q.text,
    ...(q.b !== undefined ? { qa: q.a, qb: q.b } : {}),
    a,
  });
  s.lock = { ...a }; // after answering, each duck stays in the column it chose
  if (
    +s.options.showWriter &&
    ["aod", "wyr"].includes(s.options.mode) &&
    q.by &&
    s.players[q.by]
  )
    say(s, `${s.players[q.by].name} wrote: ${q.text}`); // (Show the writer: named after the vote)
}

/* the round is over: the stats screen, or (the lobby's Stats screen Off) straight on to what comes after it */
export function toStats(s, now) {
  if (+s.options.stats !== 0) return enter(s, "results", now);
  if (isDn(s) && s.qs && s.qs.length) return afterDunce(s, now); // (Duncelation: on into the takes not yet defended)
  const over = gameOver(s, now); // (Vote return, or Random: the next round is the next game)
  if (over) return over;
  if (isVd(s)) return vdAfter(s, now); // (Valentine's Duck Date: the game is over)
  s.round++;
  s.subs = [];
  s.qs = [];
  return isBb(s)
    ? startTourney(s, now)
    : isQuack(s)
      ? startQuackRound(s, now)
      : isTv(s)
        ? tvRound(s, now)
        : enter(s, "submit", now);
}
export function startResults(s, now) {
  s.reviewVotes = {};
  s.review = false;
  if (isQuack(s)) return toStats(s, now);
  if (isBb(s)) {
    const { topic, topicBy, seeds, rounds, champ } = s.bb;
    s.bbPast = [
      ...(s.bbPast || []),
      { round: s.round, topic, topicBy, seeds, rounds, champ },
    ];
    return toStats(s, now);
  } // the tournament joins the game's
  if (isLaw(s)) {
    s.law = null;
    s.lock = {};
    return toStats(s, now);
  } // (the stats fill the screen)
  if (isDn(s)) {
    if (s.dn) s.dn.cur = null;
    s.lock = {};
    return toStats(s, now);
  }
  if (isTv(s)) {
    s.lock = {};
    return toStats(s, now);
  } // (Trivia: the stats fill the screen)
  // each duck stays where it was, in the column it was locked into on the last question; a duck that never stood on
  // the board (it joined late) starts in Neutral
  s.lock = {};
  const off = [];
  for (const id of s.seat) {
    const p = s.pos[id],
      c = p && p.x >= 0 ? colAt(s, p.x) : -1;
    if (c >= 0) s.lock[id] = c;
    else {
      s.lock[id] = isWyr(s) || isDdr(s) ? -1 : 3;
      off.push(id);
    }
  }
  off.forEach((id, k) => {
    s.pos[id] = { x: startX(s), y: (k + 1) / (off.length + 1) };
  });
  return toStats(s, now);
}

/* the countdown once the needed share has voted; with "Unvoting stops the countdown" on, falling below the share stops it */
const WRITE_PHASES = ["submit", "topic", "seeds", "words", "tvwrite"];
export const catchLen = (s) =>
  +(WRITE_PHASES.includes(s.phase)
    ? (s.options.writeCatch ?? OPTIONS_DEFAULT.writeCatch)
    : s.options.catchUp) || 0; // (seconds; writing has its own)
export function catchUp(s, now, enough) {
  if (enough && catchLen(s) && !s.catchEnds)
    s.catchEnds = now + catchLen(s) * 1000;
  if (!enough && s.catchEnds && s.options.unvoteStops) s.catchEnds = 0;
}
/* is there a discussion round after a vote? I want only the vote round unless the host turns on "Discussion round" in
   Additional settings (free roam never has one) */
export const discussOn = (s) => !!s.options.discuss && !s.options.freeRoam;
/* after voting, my duck walks only inside the column (the box) it voted in; pressing Vote again lets it out */
export const heldCol = (s, id) =>
  s.phase === "answer" &&
  s.done[id] &&
  !s.options.freeRoam &&
  !ringed(s) &&
  s.pos[id] &&
  s.pos[id].x >= 0
    ? colAt(s, s.pos[id].x)
    : null;
/* what ends a phase: everyone voting, the needed share's countdown (catch-up timer) running out, or its timer */
export function advance(s, now, force = false) {
  if (s.waiting) return s; // (waiting for players: nothing moves on)
  if (isSc(s) && SC_PHASES.includes(s.phase)) return scAdvance(s, now, force);
  if (isQuack(s) && QUACK_PHASES.includes(s.phase))
    return quackAdvance(s, now, force);
  if (isHang(s)) return s; // (no turns: the cabin stays open until the room goes back to the lobby)
  if (sbOnBoard(s)) return s; // (Sandbox: no turns either, till Leave Sandbox)
  if (isVd(s) && VD_PHASES.includes(s.phase)) return vdAdvance(s, now, force); // (Valentine's Duck Date: its timers)
  if (isTv(s) && TV_BOARD.includes(s.phase)) return tvAdvance(s, now, force); // (Trivia: a question's votes, answers, grades)
  const on = playing(s),
    n = on.length,
    d = on.filter((id) => s.done[id]).length,
    all = d >= n,
    enough = d >= needed(s);
  if (isLaw(s) && s.phase === "answer") return lawCheck(s, now, force); // a case waits for the jury (and closing arguments)
  if (isLaw(s) && ATT_PHASES.includes(s.phase)) return attCheck(s, now, force); // the attorney vote waits for its clock
  if (isDn(s) && s.phase === "answer") return dnCheck(s, now, force); // a take waits for its timer (or, with none, for the votes)
  const sway = isBb(s) && s.phase === "answer"; // a bracket match waits for every vote (or its own timer, if the host set one)
  const timeUp = s.ends && now >= s.ends;
  if (endBtnOn(s) && !force && !timeUp) return s; // (End round: only the button, or the timer, ends the vote)
  /* I want every phase to end when everyone has voted; the needed share only starts the countdown (the catch-up timer).
     A vote taken back doesn't stop it, unless the host turned on "Unvoting stops the countdown" */
  catchUp(s, now, enough && !all && !sway);
  const go =
    force ||
    all ||
    timeUp ||
    (!sway &&
      (enough || s.catchEnds) &&
      (!catchLen(s) || (s.catchEnds && now >= s.catchEnds)));
  if (!go) return s;
  switch (s.phase) {
    case "countdown":
      return s;
    case "submit": {
      if (isDn(s)) return dealTakes(s, now); // (Duncelation: everyone gets a take, written or not)
      /* whatever someone had typed goes in as their question when time runs out (Send or "Don't submit one" ends it early) */
      for (const id of s.seat) {
        const d = (s.drafts || {})[id];
        if (!s.done[id] && d && d.text)
          (s.subs = s.subs || []).push({ by: id, ...d });
      }
      delete s.drafts;
      const subs = {};
      for (const q of s.subs || []) subs[q.by] = q;
      s.qs = orderQuestions(s, subs).map((id) => subs[id]);
      s.qi = 0;
      delete s.subs;
      if (!s.qs.length) {
        say(s, isLaw(s) ? "No topics this round." : "No questions this round.");
        s.round++;
        s.subs = [];
        return enter(s, "submit", now);
      }
      return isLaw(s) ? startCase(s, now) : startQuestion(s, now);
    }
    case "tvwrite":
      return tvDeal(s, now); // (Trivia: everyone's question, or an auto one)
    case "topic":
      return endTopics(s, now);
    case "tvote":
      return pickTopic(s, now);
    case "seeds":
      return endSeedTurn(s, now);
    case "counsel":
      return endCounsel(s, now);
    case "bracket":
      return s.bb.champ != null ? enter(s, "podium", now) : nextMatch(s, now);
    case "podium":
    case "dunced":
      return startResults(s, now);
    case "tie":
      return settleTie(s, now);
    case "answer":
      if (isBb(s))
        return endMatch(s, now)
          ? discussOn(s)
            ? enter(s, "discuss", now)
            : nextMatch(s, now)
          : enter(s, "tie", now);
      recordAnswers(s);
      if (discussOn(s)) return enter(s, "discuss", now);
      if (++s.qi < s.qs.length) return startQuestion(s, now); // free roam: straight to the next question
      return startResults(s, now);
    case "discuss":
      if (isBb(s)) return nextMatch(s, now);
      if (isLaw(s)) return nextCase(s, now);
      if (isDn(s)) return nextTake(s, now);
      if (++s.qi < s.qs.length) return startQuestion(s, now);
      return startResults(s, now);
    case "results":
      if (isDn(s) && s.qs && s.qs.length) return afterDunce(s, now); // (Duncelation: on into the takes not yet defended)
      const over = gameOver(s, now); // (Vote return, or Random: the next round is the next game)
      if (over) return over;
      if (isVd(s)) return vdAfter(s, now); // (Valentine's Duck Date: one game, one Valentine)
      s.round++;
      s.subs = [];
      s.qs = [];
      return isBb(s)
        ? startTourney(s, now)
        : isQuack(s)
          ? startQuackRound(s, now)
          : isTv(s)
            ? tvRound(s, now)
            : enter(s, "submit", now);
  }
  return s;
}

/* someone joins a game in progress and plays at once: they vote on the question, the match or the case, write a line
   in Story Chain, get a tile in Who is the Quack?. While the room talks a turn over (or votes out a Quack) they walk
   around and chat, and play from the next turn */
export function seatNewcomer(s, id) {
  const me = s.players[id],
    ph = s.phase;
  if (isHang(s)) {
    if (inWorld(s)) hangJoin(s, id);
    return;
  } // Hangout: at the front door, at once
  if (sbOnBoard(s)) {
    if (ph === "sandbox") s.pos[id] = sbSpot();
    return;
  } // (Sandbox on the board: in at once, anywhere)
  if (isVd(s)) return vdJoin(s, id); // (Valentine's Duck Date: a Suitor from the next turn)
  if (s.options.lateJoin === "watch") {
    // (Players who join mid-game: Watch until the next round: they walk about and chat, and play from the next turn)
    if (boardPhases(s).includes(ph))
      s.pos[id] = { x: startX(s), y: Math.random() };
    me.late = true;
    return;
  }
  if (isTv(s)) return tvJoin(s, id); // (Trivia: on the strip under the rows, and a row of their own while answers are written)
  if (boardPhases(s).includes(ph))
    s.pos[id] = { x: startX(s), y: Math.random() };
  if (isQuack(s)) {
    // (a tile mid-vote would move everyone's tiles under their feet: they get one at the next lap)
    const w = s.wq;
    if (!w || w.result || !["wqpick", "clue", "choice"].includes(ph)) {
      if (QUACK_PHASES.includes(ph)) me.late = true;
      return;
    }
    w.ids.push(id);
    if (ph === "clue")
      s.pos[id] = { ...tileCenter(s, w.ids.length - 1, 0.62), j: 0 };
    return;
  }
  if (isSc(s)) {
    // a line of their own at the end of this paragraph, with a game word
    const sc = s.sc,
      n = scZones(s, "write").length;
    if (ph === "write" && sc && !sc.order.includes(id)) {
      const used = new Set(
        [
          ...Object.values(sc.words),
          ...Object.values(sc.assign).map((x) => x.word),
        ].map((x) => String(x).toLowerCase()),
      );
      sc.order.push(id);
      sc.assign[id] = {
        word: anyOf(SC_WORDS.filter((x) => !used.has(x))) || anyOf(SC_WORDS),
        by: null,
      };
      s.pos[id] = { x: 0.1 + Math.random() * 0.8, y: (n - 0.98) / n }; // (just over the line being typed, like everyone)
    }
    if (ph === "results")
      s.pos[id] = { x: 0.1 + Math.random() * 0.8, y: 0.125 };
    return;
  }
  if (ph === "discuss") {
    me.late = true;
    return;
  }
  if (ph === "seeds") s.done[id] = true; // (the seeds were shared out: they vote on them)
  if (ph === "counsel") s.done[id] = counselDone(s, id);
  if (ph === "answer" && ringed(s)) {
    const top = Math.random() < 0.5;
    s.pos[id] = { x: 0.45 + 0.1 * Math.random(), y: top ? 0.04 : 0.96 };
  } // with the jury, above or below the circle
  if (ph === "results" && !isBb(s) && !isLaw(s))
    s.lock[id] = isWyr(s) || isDdr(s) ? -1 : 3; // (like a duck that never stood on the board)
}

/* ---------- the actions ---------- */
export function reduce(state, a, now = Date.now()) {
  const s = reduceStep(state, a, now);
  if (s && s !== state) {
    applyRules(s); // (Mode Rules: the options follow the mode now picked)
    sizeShots(s);
  }
  return s;
}
function reduceStep(state, a, now) {
  survSet(state.options); // (Survival: survrules.js)
  useMode(baseMode(state.options)); // (Duck Cabin as the room's mode has it, or Dead Ducks Arcade's Downpour, or Sandbox on one of them: hangout/layout.js)
  carsAt(state); // (Downpour's cars where the state has them: carpush.js)
  const s = clone(state),
    P = s.players,
    me = P[a.id],
    host = a.id === s.hostId,
    boss = !!me && isSudo(s, a.id); // boss: the host, or anyone in sudo
  if (
    s.waiting &&
    (WAIT_BLOCK.includes(a.t) ||
      (a.t === "voteStart" && ["skip", "turn"].includes(a.kind)))
  )
    return state; // waiting for players: no turn ends
  const acts = actsOf();
  const act = acts[a.t];
  return act && Object.hasOwn(acts, a.t)
    ? act({ state, s, a, now, P, me, host, boss })
    : s;
}

/* the safety net: an action that throws is skipped (the room keeps going) and the room's log says so, once a minute at
   most, so a broken action can't stop a game */
export function safeReduce(state, a, now = Date.now()) {
  const t0 = stamp(); // (the frame-rate readout: how long the rules take, perf.js)
  try {
    return reduce(state, a, now);
  } catch (e) {
    console.error("DuckFriends: an action failed and was skipped", a && a.t, e);
    if (state.errAt && now - state.errAt < 60000) return state;
    const s = clone(state);
    s.errAt = now;
    say(
      s,
      `Something went wrong (${String(a && a.t).slice(0, 20)}), so it was skipped. If the game seems stuck, the host can type skip in the command line.`,
    );
    return s;
  } finally {
    took("rules", t0);
  }
}

/* a vote passes once enough say yes, and fails once it can't pass any more */
export function settleVote(s, now) {
  const v = s.vote;
  if (!v) return s;
  const { voters, need } = voteNeeds(s, v),
    yes = voters.filter((id) => v.yes[id]).length,
    no = voters.filter((id) => v.no[id]).length;
  if (v.kind === "kick" && !s.players[v.target]) {
    s.vote = null;
    return s;
  }
  if (v.kind === "kick" && humanIds(s).length <= 2) {
    s.vote = null;
    say(s, "Only two players left, so the kick vote ended.");
    return s;
  }
  if (yes >= need) {
    s.vote = null;
    if (v.kind === "kick") {
      const p = s.players[v.target];
      s.banned = {
        ...(s.banned || {}),
        [v.target]: true,
        ...(p.acct ? { ["acct:" + p.acct]: true } : {}),
      };
      say(s, `${p.name} was voted out until the room goes back to the lobby.`);
      reopenMatch(s, v.target);
      if (isHang(s)) hangLeft(s, v.target);
      delete s.players[v.target];
      s.seat = s.seat.filter((id) => id !== v.target);
      delete s.pos[v.target];
      delete s.done[v.target];
      if (v.target === s.hostId) s.hostId = humanIds(s)[0] || null;
      return advance(s, now);
    }
    if (v.kind === "skip") return skipRound(s, now);
    if (v.kind === "newgame") {
      const due = votesDue(s);
      if (!due.length || s.phase !== "results") return s;
      say(
        s,
        `The room voted for a new ${due.includes("mode") ? "game" : "map"} now.`,
      );
      return voteAgain(s, now, due); // (the votes come back at once, as if Vote return had counted down)
    }
    if (v.kind === "turn") {
      // the whole turn, as if everyone were done: a question's voting and its talk
      say(s, "The room voted to skip this turn.");
      const k = turnKey(s);
      for (
        let i = 0;
        i < 3 && turnKey(s) === k && !["lobby", "over"].includes(s.phase);
        i++
      )
        advance(s, now, true);
      return s;
    }
    return backToLobby(s, "Everyone voted to go back to the lobby.");
  }
  if (no > voters.length - need) {
    s.vote = null;
    say(s, "The vote didn't pass.");
  }
  return s;
}
/* someone leaves (or is kicked) in the middle of a bracket match or its tie vote: the match isn't settled by them going.
   The others' votes open again, so it waits for the players still here to end their turn (or for its own timer). In the
   tie vote the others keep their picks; only the one who left loses theirs */
export function reopenMatch(s, id) {
  if (
    !isBb(s) ||
    !["answer", "tie"].includes(s.phase) ||
    !s.players[id] ||
    s.players[id].late
  )
    return;
  if (s.phase === "tie") {
    const t = s.bb.tie;
    if (t && t.votes) {
      const { [id]: _, ...rest } = t.votes;
      t.votes = rest;
    }
    return;
  }
  if (!Object.keys(s.done).some((x) => x !== id && s.done[x])) return; // nobody else had voted yet: nothing to reopen
  s.done = {};
  say(s, "The vote is open again: end your turn when you're ready.");
}
/* a vote passed to skip the round: the rest of its questions (or the tournament) are dropped. Agree or Disagree and
   Would You Rather go to the round's stats with what was answered; Bicker Brackets starts a new tournament; Story Chain
   ends the paragraph with what was written (or draws new words, if no line was written yet); on the stats
   screen, the next round starts */
function skipRound(s, now) {
  say(s, "The room voted to skip this round.");
  if (s.phase === "results") return advance(s, now, true);
  const over = gameOver(s, now); // (a skipped round ends like any other: Vote return, or Random's next game)
  if (over) return over;
  if (isBb(s)) {
    s.round++;
    return startTourney(s, now);
  }
  if (isQuack(s)) return quackSkip(s, now); // Who is the Quack?: no winner, the word shown
  if (isVd(s)) return vdSkip(s, now); // (Valentine's Duck Date: on to the pick, or the next turn)
  if (isTv(s)) return tvSkip(s, now); // (Trivia: the rest of the round's questions are dropped)
  if (isSc(s)) {
    // Story Chain: the paragraph ends with what was written; with nothing written yet, new words are drawn
    const none =
      s.phase === "words" || (s.phase === "write" && !scPara(s).lines.length);
    if (s.phase === "write" && none) scStory(s).paras.pop(); // (no empty paragraph left in the story)
    if (none) {
      s.round++;
      return startStory(s, now, false);
    }
    return startNext(s, now);
  }
  if (s.phase === "submit") {
    s.round++;
    s.subs = [];
    s.qs = [];
    return enter(s, "submit", now);
  } // nothing asked yet: on to the next round's writing
  if (isDn(s) && s.phase !== "dunced") {
    s.dn.cur = null;
    s.round++;
    s.subs = [];
    s.qs = [];
    s.qi = 0;
    return enter(s, "submit", now);
  } // (Duncelation: a new rotation; after a dunce, its stats)
  return startResults(s, now);
}
/* the people in the cabin who voted to end it, and how many it takes: half of them, rounded up */
const CABIN_END_MS = 10000;
/* Single Player's Exit Cabin counts 5 s (the owner's, Nov 19 23:10Z: "only 5 seconds") */
const SOLO_CABIN_END_MS = 5000;
export const cabinVotes = (s) =>
  humanIds(s).filter((id) => ((s.cabinEnd || {}).by || {})[id]).length;
export const cabinNeeded = (s) =>
  Math.max(1, Math.ceil(humanIds(s).length / 2));
/* starts the timer when enough have voted, and starts it over (from CABIN_END_MS) when the votes drop; true when it
   changed anything */
export function cabinCheck(s, now) {
  const c = s.cabinEnd;
  if (!c) return false;
  const enough = cabinVotes(s) >= cabinNeeded(s),
    at = enough ? c.at || now + (s.solo ? SOLO_CABIN_END_MS : CABIN_END_MS) : 0;
  if (at === c.at) return false;
  c.at = at;
  return true;
}
/* a cabin game ends (the vote won, or a Hangout's time limit ran out): the whole stay is one game. With Vote Mode & Map
   on, Vote return counts it (the votes come back when it's time, or the same game starts over); with Random the next
   game begins; otherwise the room goes back to the lobby, as when the host ends it */
export function cabinOver(s, now, why = "The ducks voted to leave the cabin.") {
  delete s.cabinEnd;
  const due = votesDue(s);
  if (!due.length && !rolling(s)) return backToLobby(s, why); // (the host's own pick: back to the lobby)
  say(s, why);
  /* Duck Cabin's games (Hangout, Quacky Zombies) are one game whatever Vote return says (owner 2026-11-16): one
     playthrough, then the votes come back, or Random's next game */
  return due.length ? voteAgain(s, now, due) : rotate(s, now);
}
/* Quacky Zombies from the vote or Random: once everyone's down, the score shows a moment, then the room moves on */
export const L4_OVER_MS = 8000;
/* Sandbox: everyone's out, the card shows this long before the lobby or the new start */
export const SB_OUT_MS = 5000;
/* Hangout's time limit (Game Settings, hangTime): only when Random or the vote picked it, never when the host did; in
   seconds, 0 for none */
const HANG_TIMES = [0, 5, 10, 15, 20, 30];
function hangLimit(s) {
  const o = s.options;
  if (!modeOf(o.mode).timed || !["random", "vote"].includes(o.modePick))
    return 0;
  const m = HANG_TIMES.includes(+o.hangTime) ? +o.hangTime : 15;
  return m * 60;
}
/* every beat in the cabin: the votes of players who left stop counting; true when the game ended or the timer changed */
export function cabinTick(s, now) {
  if (!s.cabinEnd) return false;
  const was = s.cabinEnd.at,
    changed = cabinCheck(s, now);
  if (s.cabinEnd.at && now >= s.cabinEnd.at) {
    cabinOver(
      s,
      now,
      isSb(s) ? "The ducks voted to leave Sandbox." : undefined,
    );
    return true;
  }
  return changed || was !== s.cabinEnd.at;
}
/* the room goes back to the lobby: a fresh game next time, and the voted-out may come back */
export function backToLobby(s, why) {
  helperOut(s); // (the fireplace's Justin stays with his game)
  delete s.waiting;
  sbEnd(s); // (Sandbox: a save's settings give way to the room's again)
  const was = STAGE[s.phase];
  s.phase = "lobby";
  countTurn(s, was);
  s.at = 0;
  s.ends = 0;
  s.catchEnds = 0;
  s.round = 0;
  s.history = [];
  s.jumps = {};
  s.qs = [];
  s.qi = 0;
  s.subs = [];
  s.done = {};
  s.vote = null;
  s.voteUsed = {};
  s.banned = {};
  s.pos = {};
  s.lock = {};
  s.back = {};
  s.hang = null;
  s.cabinEnd = null;
  s.bb = null;
  s.bbPast = [];
  s.sc = null;
  s.law = null;
  s.dn = null;
  s.vd = null;
  s.mz = null;
  s.wq = null;
  delete s.hidden;
  s.wqPast = [];
  s.wqScore = null;
  s.wqPickers = [];
  for (const id of s.seat) {
    s.players[id].ready = false;
    delete s.players[id].late;
  }
  say(s, why);
  return s;
}

export const oneLine = (v, n) =>
  String(v || "")
    .replace(/\s+/g, " ")
    .slice(0, n);

/* a written question: one line of text, or in Would You Rather the two choices (A or B) */
/* the most characters a question, topic or take can have: the Text length limit (a Would You Rather choice: at most 100) */
export const textMax = (s) =>
  [80, 140, 200, 280].includes(+s.options.textMax) ? +s.options.textMax : 200;
export function question(s, a) {
  if (isWyr(s)) {
    const qa = String(a.a || "")
        .trim()
        .slice(0, Math.min(100, textMax(s))),
      qb = String(a.b || "")
        .trim()
        .slice(0, Math.min(100, textMax(s)));
    return qa && qb
      ? { a: qa, b: qb, text: `Would you rather ${qa} or ${qb}?` }
      : null;
  }
  const text = String(a.text || "")
    .trim()
    .slice(0, textMax(s));
  return text ? { text } : null;
}

/* Does Duck Relate?: how often one related (stood on A), and which side they chose most; round = null for the whole game */
export function ddrStats(s, id, round = null) {
  const vals = s.history
    .filter((h) => round === null || h.round === round)
    .map((h) => h.a[id])
    .filter((c) => c === 0 || c === 1);
  const yes = vals.filter((c) => c === 0).length,
    n = vals.length;
  return {
    n,
    yes,
    no: n - yes,
    most: !n ? [] : yes > n - yes ? [0] : yes < n - yes ? [1] : [0, 1],
    jumps: (s.jumps || {})[id] || 0,
  };
}
export const DDR_SIDES = ["Duck Does Relate", "Duck Doesn't Relate"];

/* Would You Rather: how each question split the room, and each player's sides; round = null for the whole game */
export function wyrStats(s, round = null) {
  const per = {},
    questions = [];
  const P = (id) =>
    (per[id] = per[id] || { answers: 0, written: 0, split: 0, maj: 0, min: 0 });
  for (const h of s.history.filter(
    (h) => round === null || h.round === round,
  )) {
    const votes = Object.values(h.a),
      A = votes.filter((c) => c === 0).length,
      B = votes.filter((c) => c === 1).length,
      n = A + B;
    const split = n ? 1 - Math.abs(A - B) / n : null,
      major = A > B ? 0 : B > A ? 1 : null; // split: 1 = an even split
    questions.push({ by: h.by, text: h.text, A, B, split });
    if (split !== null) {
      P(h.by).written++;
      P(h.by).split += split;
    }
    for (const [id, c] of Object.entries(h.a)) {
      P(id).answers++;
      if (major !== null) {
        if (c === major) P(id).maj++;
        else P(id).min++;
      }
    }
  }
  return { per, questions };
}

/* ---------- stats: on the −3 (strongly disagree) … +3 (strongly agree) scale ---------- */
export function statsFor(s, id, round = null) {
  const vals = s.history
    .filter((h) => round === null || h.round === round)
    .map((h) => h.a[id])
    .filter((c) => c !== undefined);
  const n = vals.length;
  if (!n)
    return {
      n: 0,
      most: [],
      median: null,
      avg: null,
      jumps: (s.jumps || {})[id] || 0,
    };
  const count = Array(7).fill(0);
  vals.forEach((c) => count[c]++);
  const top = Math.max(...count),
    most = count.map((k, c) => (k === top ? c : -1)).filter((c) => c >= 0);
  const sorted = vals.map((c) => c - 3).sort((a, b) => a - b);
  const median =
    n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  return { n, most, median, avg, jumps: (s.jumps || {})[id] || 0 };
}
export const signed = (v) =>
  v === null
    ? "—"
    : (v > 0 ? "+" : v < 0 ? "−" : "") +
      Math.abs(v).toFixed(Number.isInteger(v) ? 0 : 1);
export const nameOfValue = (v) =>
  v === null ? "" : COLS[Math.max(0, Math.min(6, Math.round(v) + 3))];

/* ---------- the actions, one handler each (owner, Nov 21): reduceStep above looks the action up here ----------
   made on the first action, never when this file loads: actplay.js and actroom.js import back from here, so whichever
   loads first must not need the other's table yet */
let ACTS = null;
const actsOf = () =>
  ACTS || (ACTS = { ...ROOM_ACTS, ...PLAY_ACTS, ...SB_ACTS });
