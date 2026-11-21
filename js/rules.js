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
import {
  GATE_BREEDS,
  waiting,
  heldBack,
  roundsOf,
  afterShots,
  shotKind,
  coneOf,
  roundAt,
} from "./weaponuse.js";

import { HANDGUN } from "./gamedefaults.js";

import { jumpKept } from "./jump.js";

import { epAct } from "./sbep.js";

import {
  baseMode,
  baseL4map,
  isSb,
  sbCan,
  sbMay,
  SB_RIGHTS,
  sbOnBoard,
  sbRulesAct,
  boardDuck,
  sbBoardK,
  sbItemMods,
  sbRule,
} from "./sandboxrules.js";

import { sbGodAct } from "./sbgod.js";

import { survSet } from "./survrules.js";

import "./gunmenrules.js"; // (Survival's gunmen: their rules hook into l4ddrules.js)
import { sbAct, sbTick } from "./sbspawn.js";

import { sbOut, sbOutTick, sbAgainAct } from "./sbout.js";

import { sbHotAct, sbSlots, sbGot, sbSpend } from "./sbhot.js";

import { sbLootAct, sbLootTick } from "./sbloot.js";

import { nbPermAct, nbShareAct } from "./nbperms.js";

import { sbZoneTick, sbLandAct } from "./sbzone.js";

import { sbGroupTick, sbGroupAct, grCool } from "./sbgroups.js";

import { sbEnd, sbPick, sbRekey, sbRename } from "./sbsave.js";

import { stamp, took } from "./perf.js";

import { boardSpeed, ARM_RELOAD } from "./armspeed.js";

import {
  isDn,
  DN_GRACE,
  DN_CEREMONY,
  dealTakes,
  startTake,
  nextTake,
  afterDunce,
  dnVote,
  dnCheck,
  dnTick,
  isDefender,
  dnEndVote,
} from "./duncerules.js";

import {
  isVd,
  VD_PHASES,
  VD_WRITE,
  VD_DOWN,
  VD_VAL,
  vdAdvance,
  vdAfter,
  vdEnd,
  vdSkip,
  vdTimer,
  vdJoin,
  vdTick,
  vdWrite,
  vdSafe,
  seated,
  isDate,
} from "./vddrules.js";

import {
  isTv,
  TV_BOARD,
  tvRound,
  tvDeal,
  tvAdvance,
  tvWrite,
  tvPick,
  tvEnd,
  tvGrade,
  tvStop,
  tvJoin,
  tvSkip,
  tvLimit,
} from "./triviarules.js";

import {
  isQuack,
  QUACK_PHASES,
  startQuackRound,
  quackEnd,
  quackAdvance,
  quackLeft,
  quackSkip,
  wqWord,
  holdStill,
  quackMoved,
  tileCenter,
} from "./quackrules.js";

import {
  holdDown,
  shielded,
  comeBack,
  normalGame,
  downStill,
  standUps,
  isGhost,
} from "./hangout/death.js";

import {
  hangAction,
  hangTick,
  hangJoin,
  hangLeft,
  hangStill,
} from "./hangout/rules.js";

import { inCabin, useMode, W as HW, H as HH } from "./hangout/layout.js";

import { justinTick, justinDown } from "./boardjustin.js";

import { pwTick } from "./wounds.js";

import {
  isMgj,
  mgjAdvance,
  mgjCount,
  mgjUse,
  mgjTeamUse,
  mgjCool,
  mgjHolds,
  PELLETS,
  PELLET_SPEED,
  PELLET_LIFE,
  SPREAD,
  CHAIR_R,
  mgjMag,
  mgjOut,
  ammoOf,
  mgjSpend,
} from "./mgjrules.js";

import {
  isL4dd,
  l4Use,
  l4Reload,
  l4Shots,
  l4Holds,
  helperOut,
  laserHeat,
  laserNext,
  l4Again,
} from "./l4ddrules.js";

import {
  ARMS,
  GUN_BREEDS,
  BOARD_GUNS,
  BOARD_WEAPONS,
  AUTO,
  THROWS,
  MGJ_GUNS,
  MGJ_MELEE,
  NADE_GROW,
} from "./guns.js";

import { MAPS, MAP_FORMS, mapForm, mapName, isWorldMap } from "./maps.js";

import { modesFor, modeOf, SOLO_MODES } from "./modes.js";

import { umapAct, umapTitle, isUmap } from "./umaprules.js";

import { rainbowJoin } from "./looksrules.js";

import {
  PODIUM,
  bbWrite,
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
  SC_VOTES,
  SC_WORDS,
  scAdvance,
  scFreeOf,
  scPara,
  scStory,
  scVote,
  scWrite,
  scZones,
  startNext,
  startStory,
} from "./scrules.js";

import {
  ATT_FAST,
  ATT_PHASES,
  ATT_TIME,
  attCheck,
  attRole,
  canGiveUp,
  counselDone,
  counselOk,
  endCounsel,
  isCounsel,
  lawCheck,
  lawVote,
  nextCase,
  startCase,
  verdict,
} from "./lawrules.js";

import {
  MELEE,
  SB_H,
  attacks,
  chainShot,
  cutPic,
  duckFlame,
  floorFirst,
  groundFire,
  gunSpeed,
  moveShots,
  sizeShots,
  strike,
} from "./boardfire.js";

/* (what l4ddrules.js asks of the board's weapons comes by here, not from boardfire.js: boardfire.js imports sbcabin.js, which
   needs l4ddrules.js whole before it runs, so l4ddrules.js must not import boardfire.js itself) */
export { shove } from "./boardfire.js";

import {
  DOD_KEYS,
  STAGE,
  countTurn,
  denied,
  dodOn,
  dodRoom,
  dodSet,
  dodSettle,
  dodStarts,
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
  beginGame,
  cabinMap,
  capOf,
  countdown,
  gameOver,
  keepRoomMap,
  nextVote,
  placeMap,
  rolling,
  rotate,
  sbHere,
  sbMapPicked,
  sbSpot,
  voteAgain,
  voteClock,
  voteIds,
  voteLeft,
  voteRate,
  votesDue,
} from "./voterules.js";

import { cakeGone, throwCake } from "./boardfire.js";

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
  sbMap: "", // Sandbox's world: "" (the board, on the room's map) | "cabin" (Duck Cabin) | "zcabin" (Dead Ducks Arcade's cabin) | "downpour" (sandboxrules.js)
  l4map: "cabin", // Quacky Zombies' map: "cabin" | "downpour", picked by everyone in its own map vote before each game (ZMAPS)
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
  sbTint: 0, // Sandbox on the board: 1 puts Mad God Justin's colored field over the map (off: the map shows plain)
  sbAll: 0, // Sandbox: 1, every player has all of Sandbox's rights (sandboxrules.js sbCan); 0, the host and whoever it lets
  sbOkB: 0, // Sandbox: 1, every player may use Build (B) without the rights; the same for M, N, H and G (sandboxrules.js sbMay)
  sbOkM: 0,
  sbOkN: 0,
  sbOkH: 0,
  sbOkG: 0,
  hangTime: 15, // Hangout's time limit in minutes when Random or the vote picked it: 0 (none), 5, 10, 15, 20, 30 (never when the host picks it)
  ghostBusy: 1, // 1: no ghost from a duck busy with an activity (chalk, piano, guestbook, cards, a seat …): it just gets up
  justin: 0, // 1: Duck Cabin's Justin walks the boards too, as a joke (js/boardjustin.js); he never counts
  mgjBoard: 0, // 1: the board's Mad God Justin (only with justin on): 10 HP, and the duck that hurts him is his target for 10 s
  freeRoam: 0, // 1: no answer lock and no talk-it-over step; ducks roam until the turn ends
  map: "board", // board | sky | pixel | carnival | stars | rabbit | collage | euclid | ec | vellum | tiles | cabin (Duck Cabin: only for its own games, the Cabin ones)
  mapPick: "vote", // "" (the host's map) | vote (Vote for Map, part of Vote Mode & Map) | random: settled when the game starts
  modesOff: [], // the game modes left out of Random and Vote Mode & Map (Game Settings → Modes in Random & Vote)
  modePick: "vote", // "" (the host's game) | vote (Vote for Game Mode: Vote Mode & Map is on by default, owner 2026-11-04) | random (a new game every round)
  voteBack: 3, // Vote return: the games until both votes come back: 1 … 6, "r" (a random 1 to 6 each time) or 0 (never)
  trueRandom: 0, // with Random: 1 = any game can come next; 0 = every game once before a new shuffle
  mode: "aod", // the game: aod (Agree or Disagree) | wyr (Would You Rather) | ddr (Does Duck Relate?) | bb (Bicker Brackets) | sc (Story Chain) | quack (Who is the Quack?) | law (Lawyering) | dunce (Duncelation) | mgj (Mad God Justin) | vdd (Valentine's Duck Date) | trivia (Trivia) | hang (Hangout)
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
  noFx: 0, // Heavy effects off: 1 = no gun smoke, muzzle flashes or screen shake, the effects that are hard on the game (fx.js)
  rainbowDucks: 0, // … Rainbow Ducks (with hideLooks only): the seven rainbow colors and a brown Justin-costume duck, dealt at random
  voteColor: 0, // Vote colors: 1 = a duck takes the color of the tile it stands on (never with Rainbow Ducks, never in Mad God Justin)
  tagColor: 0, // … Change player tag color: 1 = the name tag takes the vote color too
  mgjHp: 6, // … Player HP: 0 (off), 1, 5, 6, 10, 15
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
  "mgjBoard",
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
function applyRules(s) {
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
function cleanModeRules(x) {
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
function flatOptions(s) {
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

/* the lobby's Walking speed: how much faster or slower than normal every duck walks. The zombies of Quacky Zombies and
   the computers there go by it too, so the zombies stay as fast next to the ducks as the owner set them */
const WALKS = { slow: 0.6, normal: 1, fast: 1.5 };
export const walkOf = (s) => WALKS[s && s.options && s.options.walk] || 1;
export const COUNTDOWN = 5;
/* Single Player's start counts only 2, 1, 0 (the owner's, Nov 19 23:10Z: "it starts at second number 2, goes to 1, and
   then 0 in single player") */
export const SOLO_COUNTDOWN = 2;
export const VOTE_GRACE = 5; // seconds at the start of a question before anyone can lock a vote (a stray Enter can't)

/* every action works on a copy of the state, so a rule that fails halfway leaves the room as it was. The state is plain
   objects, arrays, strings and numbers (it travels as JSON online), and copying those by hand is 2 to 6 times faster
   than structuredClone (measured Nov 15 in Quacky Zombies, Mad God Justin, Hangout and Agree or Disagree). Anything
   else, a Set or a Date say, still goes through structuredClone. */
function clone(o) {
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
                : isMgj(s)
                  ? ["boss", "mgjend"]
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
const running = (s) => !["lobby", "over", "countdown"].includes(s.phase);
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
const tooFew = (s) => running(s) && s.seat.length < minOf(s);
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
function resumeGame(s, now, line = "Enough players: the game goes on!") {
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
const holdsBack = (s) => (isLaw(s) || isDn(s) || isVd(s)) && running(s);
const holdsCase = (s, id) =>
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
function holdFor(s, id, name, now) {
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
function goOnDone(s, now) {
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
function shortHanded(s, now, gone, wasQuack) {
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
const VOTE_TIME = 30; // seconds a kick or back-to-lobby vote stays open
/* every duck's arrows, bullets and thrown daggers fly this much faster than they first did, in every mode (the owner,
   Nov 3: "slightly faster"); Mad God Justin's own bullets keep their speed (mgjrules.js JUSTIN_SHOT) */
export const FASTER = 1.15;
/* the bow's arrow: it flies straight and fast the way it was aimed, on to the screen's edge */
export const ARROW_SPEED = boardSpeed("bow") * FASTER;
/* (Quacky Zombies' speeds, armspeed.js, in every mode; Justin's own bullets on the boards keep the old, slow BOSS_SHOT_SPEED) */
export const BOSS_SHOT_SPEED = 0.22 * FASTER;
/* a duck's shotgun pellet: the same speed, and so a shorter life, to fly as far as it did */
export const PELLET_V = boardSpeed("shotgun") * FASTER;
export const DUCK_PELLET_LIFE = Math.round(
  (PELLET_LIFE * PELLET_SPEED * FASTER) / PELLET_V,
);
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
   where it lands, GRENADE_MS later: every duck within GRENADE_R duck lengths (4.5 ducks across: I want its blast 50%
   wider, owner 2026-11-04 07:10Z; it was 3) plays dead and is thrown three times as far as the hammer throws one, then
   looks burnt for a while */
export const GRENADE_MS = 900,
  GRENADE_FAR = 8,
  GRENADE_R = 2.25 * NADE_GROW;
export const grenadeZ = (t) => {
  const u = Math.min(1, t / (GRENADE_MS / 1000));
  return 0.45 * (1 - u) + 4.4 * u * (1 - u);
}; // (t in seconds)
const PRESS = [
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
  "chaingun",
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
export const coolFor = (sp, s) =>
  (s && isMgj(s) && mgjCool(sp)) ||
  GUN_BREEDS.board.cool[sp] ||
  (BOARD_GUNS.includes(sp) && ARMS[sp].cool) ||
  1500; // (Mad God Justin has its own for the knife and the bow; Quacky Zombies' guns keep theirs, l4ddrules.js ARMS)
/* the handgun holds MAG shots, about five a second; after the last it reloads for RELOAD ms by itself (R reloads sooner).
   The other guns' magazines are Quacky Zombies' (no ammo to run out of here: only the magazine and its reload); the chain
   gun and the grenade launcher have none there, so here the chain gun reloads after its 300, and the launcher after 3
   (my guesses). s.mag = { id: { n: shots fired, r: when its reload ends (0: not reloading) } } for the handgun, and
   { "id gun": … } for the others */
export const MAG = HANDGUN.mag,
  RELOAD = ARM_RELOAD;
/* how long a reload takes with n shots gone: the double barrel a second for each shell it loads, the rest their own */
const reloadFor = (w, n) =>
  w === "dbarrel"
    ? ARMS.dbarrel.shell * Math.max(1, Math.min(2, n))
    : (magSize(w) || [0, RELOAD])[1];
export const magSize = (w) =>
  w === "handgun"
    ? [MAG, RELOAD]
    : GUN_BREEDS.board.mag[w] ||
      (BOARD_GUNS.includes(w) && ARMS[w].mag
        ? [ARMS[w].mag, ARMS[w].reload]
        : null); // ([shots, reload ms], or null: no magazine)
const magKey = (id, w) => (w === "handgun" ? id : `${id} ${w}`);
export const magOf = (s, id, now, w = "handgun") => {
  const m = (s.mag || {})[magKey(id, w)];
  return !m || (m.r && now >= m.r) ? { n: 0, r: 0 } : m;
};
export const coolEnds = (s, id, sp) =>
  Math.max(
    ((s.lastUse || {})[`${id} ${sp}`] || 0) +
      ((isSb(s) && (sbItemMods(s, sp).cool || (sbGot(s, id, sp) || {}).c)) ||
        coolFor(sp, s)) /
        grCool(s, id), // (Sandbox: a loot orb's own wait, sbhot.js; a group's Cooldown speed, sbgroups.js)
    magSize(sp) ? ((s.mag || {})[magKey(id, sp)] || {}).r || 0 : 0,
  ); // (a time on the room's clock)
/* the hammer's knock-back: a duck it hits is shoved KB_FAR duck lengths away from the swing in KB_MS, with a little hop
   (KB_HOP duck sizes high), and lands playing dead; pos.kb = { t, x, y: where it was } lets every screen draw the shove */
export const KB_MS = 380,
  KB_FAR = 2.4,
  KB_HOP = 0.3,
  KB_LAND = 110; // (KB_LAND: ms until the swing gets there; the duck falls then)
const EFFECTS = [
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
/* the Chair special's chair: Mad God Justin's own, as slow and as wide (CHAIR_DUCKS duck lengths a second, CHAIR_R
   duck lengths near), for CHAIR_MS */
const CHAIR_DUCKS = 2.8,
  CHAIR_MS = 8000;
/* an aim from the player: a direction on the board (x, y), about one board width long on their screen */
export const aimOf = (a, face) => {
  const ax = Math.max(-3, Math.min(3, +a.ax || 0)),
    ay = Math.max(-3, Math.min(3, +a.ay || 0));
  return Math.hypot(ax, ay) > 0.05 ? [ax, ay] : [face, 0];
};
/* is this special on one of the duck's number keys? (a duck from before the keys had one special) */
const onKeys = (d, id) =>
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
  if (isMgj(s)) {
    const was = s.phase,
      next = mgjAdvance(s, now, force, logLine);
    return (
      (was === "results" && next.phase !== "results" && gameOver(next, now)) ||
      next
    );
  } // (Mad God Justin: his HP, the timer, the podium, Try again; each fight is a game: Vote return counts it, and with Random the next game comes instead)
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
function seatNewcomer(s, id) {
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
  useMode(baseMode(state.options), baseL4map(state.options)); // (Duck Cabin as the room's mode has it, or Dead Ducks Arcade's Downpour, or Sandbox on one of them: hangout/layout.js)
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
  switch (a.t) {
    case "join": {
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
        if (back.pos && boardPhases(s).includes(s.phase))
          s.pos[a.p.id] = back.pos;
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
      if (isMgj(s)) mgjCount(s); // (Mad God Justin: a duck joining mid-fight adds its share of his HP)
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
    case "leave": {
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
    case "look":
      if (me) Object.assign(me, a.look);
      if (me && a.look && a.look.name && isSb(s) && s.sbsv) sbRekey(s, a.id); // (Sandbox: a new name may be one the save knows)
      return s;
    case "ready":
      if (me && (s.phase === "lobby" || s.phase === "over"))
        me.ready = a.v ?? !me.ready;
      return s;
    case "roomName": {
      const n = String(a.name || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 32);
      if (boss && n) s.name = n;
      return s;
    }
    case "options": {
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
          next = o.modesOff.filter(
            (id) => typeof id === "string" && id !== cur,
          );
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
        if (
          "discuss" in o &&
          !("share" in o) &&
          !!was !== !!s.options.discuss
        ) {
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
        for (const k of new Set([
          ...Object.keys(after),
          ...Object.keys(before),
        ]))
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
    case "kick": {
      // the host (or sudo) removes a player at once, no vote; a person stays out until the room goes back to the lobby
      const p = P[a.who];
      if (
        !may(s, a.id, "cankick") ||
        !p ||
        a.who === s.hostId ||
        a.who === a.id
      )
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
      return s.phase === "lobby" ||
        s.phase === "over" ||
        s.phase === "countdown"
        ? s
        : advance(s, now);
    }
    case "vote": {
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
    case "vnext": {
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
    case "dod": {
      // Democracy of Ducklings: a duck votes (again: takes the vote back); the host turns a rule on, or hands the host over, directly
      const k = a.k;
      if (!me || me.bot || !dodRoom(s) || !DOD_KEYS.includes(k)) return state; // (in any stage: Lobby Settings votes during a game too, owner Nov 15)
      s.dod = { on: {}, votes: {}, ...(s.dod || {}) };
      s.dod.votes = { ...(s.dod.votes || {}) };
      if (k === "host") {
        const to = a.v;
        if (!s.players[to] || s.players[to].bot || to === s.hostId)
          return state;
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
    case "start":
      if (!boss || !(s.phase === "lobby" || s.phase === "over")) return s;
      if (dodOn(s, "ready") || dodVoting(s)) return state; // (Democracy of Ducklings: the host readies like everyone)
      return countdown(s, now) || state;
    case "cancel":
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
    case "submit": {
      if (isVd(s)) return vdWrite(s, a, now, true) || state; // (Valentine's Duck Date: The Date's topic)
      if (isTv(s)) {
        const r = tvWrite(s, a, now, true);
        return !r ? state : r.phase === "tvwrite" ? advance(r, now) : r;
      } // (Trivia: a question, or a written answer)
      if (isBb(s)) return bbWrite(s, a, now, true);
      if (isSc(s)) return scWrite(s, a, now, true) || state;
      if (!me || s.phase !== "submit" || s.done[a.id]) return s;
      const q = question(s, a);
      s.subs = (s.subs || []).filter((x) => x.by !== a.id);
      if (q)
        s.subs.push({
          by: a.id,
          ...q,
          time: [0, 30, 60, 90].includes(a.time)
            ? a.time
            : s.options.answerTime,
        });
      s.done[a.id] = true;
      return advance(s, now);
    }
    case "draft": {
      // what a player has typed so far (kept by the host, sent in for them at the end)
      if (isVd(s)) return vdWrite(s, a, now, false) || state;
      if (isTv(s)) return tvWrite(s, a, now, false) || state;
      if (isBb(s)) return bbWrite(s, a, now, false) || state;
      if (isSc(s)) return scWrite(s, a, now, false) || state;
      if (!me || s.phase !== "submit" || s.done[a.id]) return state;
      s.drafts = {
        ...(s.drafts || {}),
        [a.id]: {
          ...(question(s, a) || { text: "" }),
          time: [0, 30, 60, 90].includes(a.time)
            ? a.time
            : s.options.answerTime,
        },
      };
      return s;
    }
    case "move": {
      // x, y on the board; j = when the current jump started (0 = on the ground)
      if (!me || !s.pos[a.id]) return state;
      if (!boardPhases(s).includes(s.phase)) return state;
      const was = s.pos[a.id],
        j = +a.j || 0;
      if (holdStill(s, a.id, now)) return state; // Who is the Quack?: the last duck plays dead for a moment
      if (
        (isL4dd(s) || isSb(s)) &&
        was.tp &&
        now - was.tp < 1500 &&
        Math.hypot((+a.x || 0) - was.x, (+a.y || 0) - was.y) > 0.03
      )
        return state; // (Quacky Zombies and Sandbox: the host just put it at a start spot; a move sent before that got there is old)
      if (isHang(s) && hangStill(s, a.id, now)) return state; // Hangout: shot by Justin, it can't move for a while
      if (downStill(s, a.id, now)) return state; // the boards: knocked down, it can't move for the host's time (1 s unless set)
      if (sbOut(s, a.id)) return state; // (Sandbox: out of lives, it stays down: sbout.js)
      if (seated(s, a.id)) return state; // (Valentine's Duck Date: the two at the table stay in their seats)
      let x = Math.max(0, Math.min(1, +a.x || 0)),
        y = Math.max(0, Math.min(1, +a.y || 0));
      // a vote keeps its answer: the duck walks only inside its own column until Vote is pressed again (a juror may walk over and change their vote)
      {
        const c = heldCol(s, a.id);
        if (c != null && c >= 0) {
          const [lo, hi] = colBoundsAt(s, c);
          x = Math.max(lo, Math.min(hi, x));
        }
      }
      if (s.phase === "answer" && isLaw(s) && isCounsel(s, a.id)) {
        const [lo, hi] = counselBounds(s, a.id);
        x = Math.max(lo, Math.min(hi, x));
      } // the attorneys argue from their own side, the offense left, the defense right
      if (s.phase === "answer" && isDn(s) && isDefender(s, a.id)) {
        const [lo, hi] = colBoundsAt(s, -1);
        x = Math.max(lo, Math.min(hi, x));
      } // (Duncelation: the defender from the circle)
      if (isDn(s) && s.phase === "dunced" && isDefender(s, a.id)) return state; // the dunce stays on the podium
      if (
        isQuack(s) &&
        ["choice", "accuse"].includes(s.phase) &&
        s.done[a.id]
      ) {
        x = was.x;
        y = was.y;
      } // a vote holds its spot
      if (isSc(s) && SC_VOTES.includes(s.phase) && s.done[a.id]) {
        x = was.x;
        y = was.y;
      } // a story vote holds its spot
      if (
        s.phase !== "answer" &&
        s.phase !== "bracket" &&
        s.phase !== "dunced" &&
        !isSc(s) &&
        !me.late &&
        !isQuack(s) &&
        !isHang(s) &&
        !isMgj(s) &&
        !isVd(s) &&
        !isTv(s) &&
        !isSb(s)
      ) {
        // after answering: inside your own column; no answer, no board (late joiners roam; over the bracket anyone does)
        const c = s.lock[a.id];
        if (c === undefined) {
          x = was.x;
          y = was.y;
        } else {
          const [lo, hi] = colBoundsAt(s, c);
          x = Math.max(lo, Math.min(hi, x));
        }
      }
      const w = (
          isL4dd(s)
            ? l4Holds(s, a.id, a.w)
            : isMgj(s)
              ? mgjHolds(s, a.id, a.w)
              : BOARD_WEAPONS.includes(a.w) &&
                onKeys(me.duck, a.w) &&
                s.options.fun
        )
          ? a.w
          : "",
        [ax, ay] = w ? aimOf(a, 1) : [0, 0]; // a weapon kept out, and where it aims
      const hz = (v) => Math.max(-400, Math.min(1200, Math.round(+v || 0))); // Hangout: z, the height of its feet; b, where its jump began (world px)
      s.pos[a.id] = {
        x,
        y,
        j,
        ...(cutPic(me)
          ? {
              f: x < was.x - 0.0005 ? -1 : x > was.x + 0.0005 ? 1 : was.f || 1,
            }
          : {}), // (a cut-out picture: the way it faces, as the screens turn it, so it's hit where it shows: playerAt)
        q: /^[lrud]$/.test(a.q) ? a.q : "",
        sp: !!a.sp,
        ...(w ? { w, ax: +ax.toFixed(3), ay: +ay.toFixed(3) } : {}),
        ...(isHang(s)
          ? {
              z: hz(a.z),
              b: hz(a.b),
              ...jumpKept(j, a),
            }
          : {}),
        ...(was &&
        was.kb &&
        now - was.kb.t < (was.kb.l ?? KB_LAND) + (was.kb.ms || KB_MS)
          ? { kb: was.kb }
          : {}),
      }; // q: squashed against l/r/u/d; sp: sprinting; tb: a trampoline bounce's height
      quackMoved(s, a.id); // (Who is the Quack?: first onto the Quack's tile)
      if (me.dead && (x !== was.x || y !== was.y)) {
        delete me.dead;
        comeBack(s, a.id, now);
      }
      attacks(s, now); // (walked into a swing, or swung into a duck)
      return s;
    }
    case "end": {
      // end your turn (answer, discuss) or be ready for the next round (results)
      if (isQuack(s) && QUACK_PHASES.includes(s.phase))
        return quackEnd(s, a, now) || state;
      if (isSc(s)) return scVote(s, a, now) || state;
      if (isHang(s)) return state; // (Hangout's button is its own action, below)
      if (isMgj(s) && s.phase !== "results") return state; // (Mad God Justin: only Try again, on the stats)
      if (isVd(s) && VD_PHASES.includes(s.phase))
        return vdEnd(s, a, now) || state; // (Valentine's Duck Date: only The Date's Next duck and Turn down)
      if (isTv(s) && TV_BOARD.includes(s.phase)) return state; // (Trivia: its own action, below)
      if (
        !me ||
        me.late ||
        ![...boardPhases(s), "results"].includes(s.phase) ||
        s.phase === "tie"
      )
        return s; // (a tie is settled with tieVote)
      if (s.phase === "dunced") return state; // (Duncelation: the dunce's moment runs its time, then the stats)
      if (
        s.phase === "answer" &&
        !(s.pos[a.id] && s.pos[a.id].x >= 0 && colAt(s, s.pos[a.id].x) >= 0)
      )
        return s; // stand on a column (a tile) first
      if (
        s.phase === "answer" &&
        now < s.at + (isDn(s) ? DN_GRACE : VOTE_GRACE) * 1000
      )
        return state; // not in the first seconds (Duncelation: its grace period)
      if (s.phase === "answer" && isLaw(s)) return lawVote(s, a, now) || state;
      if (s.phase === "answer" && isDn(s)) return dnVote(s, a, now) || state;
      s.done[a.id] = a.v ?? !s.done[a.id]; // pressing Vote again takes the vote back (and frees the duck to walk)
      return advance(s, now);
    }
    case "endRound":
      // the End round button: anyone playing, once enough have voted
      if (!me || me.late || !playing(s).includes(a.id) || !canEndRound(s))
        return state;
      return advance(s, now, true);
    case "voteReview":
      if (!me || s.phase !== "results" || s.round < 1 || s.reviewVotes[a.id])
        return s;
      s.reviewVotes[a.id] = true;
      if (reviewCount(s) >= needed(s)) s.review = true;
      return s;
    case "sbOk": {
      // Sandbox: whoever has the rights gives them to a player or takes them back (the owner's answer 2, Nov 19
      // 01:34Z: the host "decide[s] who else gets it"). The host's own rights never go
      /* with a window's letter (win): that window opens to every player or shuts again (Player settings, p; the owner's,
         Nov 19 17:15Z: "determines what settings players get ... if they can access every menu or only certain ones") */
      if (a.win !== undefined) {
        const w = SB_RIGHTS.find(([k]) => k === a.win);
        if (!sbCan(s, a.id) || !w) return state;
        s.options["sbOk" + w[0].toUpperCase()] = a.on ? 1 : 0;
        say(
          s,
          `${me ? me.name : "The host"} ${a.on ? "opened" : "closed"} ${w[1]} to every player.`,
        );
        return s;
      }
      const who = s.players[a.who];
      if (!sbCan(s, a.id) || !who || who.bot || a.who === s.hostId)
        return state;
      const ok = { ...((s.sb || {}).ok || {}) };
      if (a.on) ok[a.who] = true;
      else delete ok[a.who];
      s.sb = { ...(s.sb || {}), ok };
      say(
        s,
        `${me ? me.name : "The host"} ${a.on ? "let" : "stopped"} ${who.name} ${a.on ? "change" : "changing"} Sandbox.`,
      );
      return s;
    }
    case "sb":
      // Sandbox's spawns and respawns: place one, change a box, press one (sbspawn.js)
      if (a.k === "land") return sbLandAct(s, a, now, SB_H) ? s : state; // (a fall onto a zone that hurts: sbzone.js)
      return sbAct(s, a, now) ? s : state;
    case "sbg":
      // Sandbox's God mode and invisibility: mine, or a player's if I have the rights (sbgod.js)
      return sbGodAct(s, a) ? s : state;
    case "sbr":
      // Sandbox's Rules in G: lives, down phase, crits, watching when out (sandboxrules.js)
      if (a.k === "again") return sbAgainAct(s, a, now) ? s : state; // (everyone out, off the zombie maps: the host's Play again, sbout.js)
      return sbRulesAct(s, a) ? s : state;
    case "sbh":
      // Sandbox's hotbar: its slots, the lock, a spawn button's look and press (sbhot.js)
      return sbHotAct(s, a, now) ? s : state;
    case "sbep":
      // Sandbox: what others may do with my made NPCs and groups, for this Sandbox (P, sbep.js)
      return epAct(s, a) ? s : state;
    case "nbn":
    case "nbp":
      // Seriat: my folder's names and the rights I give other players, for this Sandbox (nbperms.js)
      return nbPermAct(s, a) ? s : state;
    case "nbs":
    case "nbw":
      // Seriat: my shared copies, and a write into another player's file they let me write (nbperms.js)
      return nbShareAct(s, a) ? s : state;
    case "sbl":
      // Sandbox's loot orbs: an orb's own picture (sbloot.js)
      return sbLootAct(s, a) ? s : state;
    case "sbgr":
      // Sandbox's groups (sbgroups.js)
      return sbGroupAct(s, a) ? s : state;
    case "cabinEnd": {
      // Hangout's End Cabin and Quacky Zombies' Exit Cabin: a click votes, another takes it back; half the people
      // (never the computers) start a CABIN_END_MS timer, and the cabin game ends when it runs out
      // (and Sandbox's Leave Sandbox, on the board too)
      if (!sbHere(s) || !me || me.bot) return state;
      const c = (s.cabinEnd = s.cabinEnd || { by: {}, at: 0 });
      c.by = c.by || {}; // (online, an empty list of votes doesn't come back)
      if (c.by[a.id]) delete c.by[a.id];
      else c.by[a.id] = true;
      cabinCheck(s, now);
      return s;
    }
    case "toLobby":
      /* Single Player: leaving a game goes back to its own lobby, whatever the game (the owner's, Nov 19 23:10Z: "When
         you quit a game in single player, it should not take you back to the rooms for multiplayer") */
      if (boss && s.solo && s.phase !== "lobby")
        return backToLobby(s, "Back to the lobby.");
      if (boss && sbHere(s))
        return backToLobby(s, `${me.name} took everyone back to the lobby.`); // (Hangout and Sandbox: the host ends it whenever)
      if (boss && s.phase === "over") {
        s.phase = "lobby";
        s.round = 0;
        s.history = [];
        s.jumps = {};
        s.dn = null;
        s.vd = null;
        for (const id of s.seat) P[id].ready = false;
      }
      return s;
    case "fx": {
      // the silly commands, seen by everyone on the board
      const who = (a.who || []).filter((id) => P[id]);
      if (
        a.justin &&
        a.kind === "kill" &&
        me &&
        s.options.fun &&
        !denied(s, a.id, "nofun")
      )
        return justinDown(s, now, logLine) ? s : state; // (the Justin option: kill @Justin on the boards)
      if (
        !me ||
        !s.options.fun ||
        denied(s, a.id, "nofun") ||
        !who.length ||
        !["lightning", "love", "kill", "hotdog", "fire"].includes(a.kind)
      )
        return state;
      if (a.kind === "kill") {
        for (const id of who)
          if (!isGhost(s, id) && !vdSafe(s, id)) {
            P[id].dead = true;
            holdDown(s, id, now);
          }
      } // (it can't move for the knocked-down time: 6 s in Duck Cabin, as from Justin's gun)
      logLine(s, {
        sys: true,
        small: true,
        float: true,
        by: a.id,
        text: `${me.name} used ${a.kind} on ${who.map((id) => P[id].name).join(" and ")}.`,
      }); // who did it, in small print
      s.fxN = (s.fxN || 0) + 1;
      s.fx = [
        ...(s.fx || []).slice(-19),
        { n: s.fxN, kind: a.kind, who, by: a.id, t: now },
      ];
      return s;
    }
    case "jumps":
      if (me) s.jumps[a.id] = Math.max(0, +a.n || 0);
      return s; // completed jumps this game
    case "ping": {
      // a player's connection: milliseconds to the game server and back
      const ms = Math.max(0, Math.min(9999, Math.round(+a.ms || 0)));
      if (!me || me.ms === ms) return state;
      me.ms = ms;
      return s;
    }
    case "idle":
      if (!me || !!me.idle === !!a.v) return state;
      me.idle = !!a.v;
      return s; // no key, click or touch in 2 minutes
    case "use": {
      // an item on the board, seen by everyone; the handgun's bullet or the dagger then flies the way it was aimed
      const sp = a.what || (me && me.duck && me.duck.special),
        p = s.pos[a.id];
      if (!me || !p || p.x < 0 || !boardPhases(s).includes(s.phase))
        return state;
      if (isL4dd(s)) return l4Use(s, a, now) ? s : state; // (Quacky Zombies: its own weapons, l4ddrules.js)
      /* the normal games: a downed duck can't use a weapon, and neither can one just back from dying, in its spawn protection,
         where what it shot or swung hurt nobody anyway (the owner's, Nov 19 16:30Z: "when players are downed in normal modes
         they should not be able to do damage or use their weapons" and "they still get their invulnerability frames where they
         cannot fire or attack with weapons during"). Sandbox keeps its own downs */
      if (normalGame(s) && !isSb(s) && (me.dead || shielded(s, a.id, now)))
        return state;
      if (isSb(s) && me.dead) return state; // (Sandbox: a downed duck can't use a weapon either)
      const downGun =
        isMgj(s) && sp === "handgun" && !!me.dead && mgjOut(s, a.id); // (Mad God Justin: out of HP, the down pistol still fires: the owner's, Nov 17 11:07Z)
      if (
        isMgj(s)
          ? s.phase !== "boss" || (me.dead && !downGun)
          : !PRESS.includes(sp) ||
            !(isSb(s) ? sbSlots(s, a.id).includes(sp) : onKeys(me.duck, sp))
      )
        return state; // (Mad God Justin: not while down, but the down pistol)
      if (isMgj(s) && ["revive", "zebra"].includes(sp))
        return mgjTeamUse(s, a, now, logLine) ? s : state; // (Mad God Justin: a revive held or let go, the zebra cake)
      const mgjGun = isMgj(s) && MGJ_GUNS.includes(sp);
      if (isMgj(s) && sp !== MGJ_MELEE && sp !== "handgun" && !mgjGun)
        return mgjUse(s, a, now, logLine) ? s : state; // (Mad God Justin: the medkit picked up)
      if (mgjGun && (s.mgj.held[a.id] !== sp || !ammoOf(s, a.id))) return state; // (Mad God Justin: a gun picked up, until its shots are gone)
      if (
        (BOARD_WEAPONS.includes(sp) || sp === "chair") &&
        !s.options.fun &&
        !isMgj(s)
      )
        return state; // the silly-commands switch covers them
      if (isGhost(s, a.id)) return state; // (Duck Cabin: a ghost can't use anything)
      const gotM = isSb(s) && sbGot(s, a.id, sp); // (Sandbox: taken from a loot orb with its own numbers, sbhot.js)
      if (gotM && gotM.u === 0) return state; // (used up, still in its slot)
      if (sp === "sound") return state; // (Sound is off for now: specials.js off)
      const k = `${a.id} ${sp}`; // (each item waits on its own)
      if (
        waiting(
          GATE_BREEDS.board,
          {
            auto: AUTO.includes(sp),
            cool: coolFor(sp, s),
            ends: coolEnds(s, a.id, sp),
          },
          now,
        ) ||
        heldBack(s, sp, () => laserHeat(s, a.id, now).over)
      )
        return state; // (weaponuse.js: its wait, the one zebra cake, Mad God Justin's Laser Rifle overheated)
      const mg = downGun ? magSize(sp) : isMgj(s) ? mgjMag(sp) : magSize(sp); // (Mad God Justin's pistol never reloads: the owner's, Nov 16; a gun picked up has Quacky Zombies' magazine; the down pistol does, its bullets never run out)
      const many =
        sp === "burst" && !isMgj(s)
          ? roundsOf(ARMS.burst, mg[0] - magOf(s, a.id, now, sp).n)
          : 1; // (the burst rifle: three rounds a press, or the rest of its clip)
      if (mg) {
        // one shot from the magazine; the last starts the reload
        const m = magOf(s, a.id, now, sp),
          n = m.n + many,
          d = isMgj(s) ? mg[1] : reloadFor(sp, n);
        s.mag = {
          ...(s.mag || {}),
          [magKey(a.id, sp)]: afterShots(mg[0] - m.n, many).empty
            ? { n, r: now + d, d }
            : { n, r: 0 },
        };
      }
      s.lastUse = { ...(s.lastUse || {}), [k]: now };
      if (mgjGun) mgjSpend(s, a.id);
      if (gotM) sbSpend(s, a.id, sp); // (one of its uses: sbhot.js)
      const face = a.face < 0 ? -1 : 1,
        aim =
          BOARD_WEAPONS.includes(sp) || THROWS.includes(sp)
            ? aimOf(a, face)
            : null;
      const hit = MELEE.includes(sp) ? strike(s, a.id, sp, aim, now) : null; // (the melees hit at once, up close, and while they swing: attacks)
      s.fxN = (s.fxN || 0) + 1;
      s.fx = [
        ...(s.fx || []).slice(-19),
        {
          n: s.fxN,
          kind: "use",
          what: sp,
          by: a.id,
          who: [a.id],
          face,
          t: now,
          ...(aim ? { ax: +aim[0].toFixed(3), ay: +aim[1].toFixed(3) } : {}),
          ...(hit ? { hit } : {}),
        },
      ];
      if (aim && !hit && sp === "chaingun") chainShot(s, a.id, p, aim, now);
      else if (aim && !hit && sp === "laser" && isMgj(s)) {
        /* Mad God Justin's Laser Rifle (picked up): the chain gun's line, red, through everything on it, 1 damage; it
           heats up as in Dead Ducks Arcade (l4ddrules.js laserNext), its heat in s.mgj.lz */
        chainShot(s, a.id, p, aim, now, "laser");
        const next = laserNext(s, a.id, now);
        s.mgj.lz = { ...(s.mgj.lz || {}), [a.id]: next.lz };
        if (next.hot) {
          s.fxN = (s.fxN || 0) + 1;
          s.fx = [
            ...(s.fx || []).slice(-19),
            { n: s.fxN, kind: "l4hot", by: a.id, who: [], t: now },
          ];
        }
      } else if (aim && !hit && sp === "flamer")
        duckFlame(s, a.id, p, aim, now);
      else if (aim && !hit) {
        const v =
            (sp === "dagger"
              ? DAGGER_SPEED
              : sp === "bow"
                ? ARROW_SPEED
                : BOARD_GUNS.includes(sp)
                  ? gunSpeed(sp)
                  : SHOT_SPEED) / sbBoardK(s), // (Sandbox's bigger board: the same speed in ducks)
          hang = {
            ...(isHang(s)
              ? {
                  hz: Math.round(+p.z || 0),
                  hin: inCabin(p.x * HW, p.y * HH) ? 1 : 0,
                }
              : {}), // (Hangout: the height it flies at, and which side of the cabin's walls)
            ...(["grenade", "glauncher", "chair", "zebra"].includes(sp)
              ? {}
              : floorFirst(s, a.id, p, aim, now)), // (a duck on my floor in its line: it stays on my floor)
          };
        const shot = (n, k, vx, vy, more) => ({
          n,
          by: a.id,
          k,
          x0: p.x,
          y0: p.y,
          vx: +vx.toFixed(4),
          vy: +vy.toFixed(4),
          t: now,
          lx: p.x,
          ly: p.y,
          ...hang,
          ...more,
        });
        const [rx, ry] = isHang(s) ? [0.006, 0.012] : boardDuck(s),
          dx = aim[0] / rx,
          dy = aim[1] / ry,
          dl = Math.hypot(dx, dy) || 1; // (the aim in duck lengths: the shotgun's cone and the grenade's throw are measured in them)
        if (sp === "shotgun") {
          // a cone of pellets, as Mad God Justin's shotgun
          const out = [];
          for (const [i, an] of coneOf(
            Math.atan2(dy, dx),
            PELLETS,
            SPREAD,
          ).entries()) {
            const bx = Math.cos(an) * rx,
              by = Math.sin(an) * ry,
              bl = Math.hypot(bx, by);
            out.push(
              shot(
                s.fxN * 10 + i,
                shotKind(sp),
                (bx / bl) * (PELLET_V / sbBoardK(s)),
                (by / bl) * (PELLET_V / sbBoardK(s)),
                { life: DUCK_PELLET_LIFE },
              ),
            );
          }
          s.shots = [...(s.shots || []), ...out];
        } else if (sp === "chair") {
          const k = CHAIR_DUCKS / dl;
          s.shots = [
            ...(s.shots || []),
            shot(s.fxN, "chair", dx * k * rx, dy * k * ry, {
              r: CHAIR_R,
              life: CHAIR_MS,
            }),
          ];
        } else if (sp === "zebra") throwCake(s, a.id, p, aim, now);
        else if (sp === "grenade") {
          const k = GRENADE_FAR / (GRENADE_MS / 1000) / dl;
          s.shots = [
            ...(s.shots || []),
            shot(s.fxN, "grenade", dx * k * rx, dy * k * ry),
          ];
        } else if (sp === "glauncher")
          s.shots = [
            ...(s.shots || []),
            shot(s.fxN, "lgren", aim[0] * v, aim[1] * v, {
              life: Math.round(
                (ARMS.glauncher.far / ARMS.glauncher.speed) * 1000,
              ),
            }),
          ];
        // (straight, and it goes off on the first duck or at its range: moveShots)
        else
          for (let i = 0; i < many; i++)
            s.shots = [
              ...(s.shots || []),
              shot(
                s.fxN,
                shotKind(sp),
                aim[0] * v,
                aim[1] * v,
                roundAt(s.fxN, i, now, ARMS[sp] && ARMS[sp].gap),
              ),
            ]; // (a burst's rounds leave one after another: each waits until its time, t)
      }
      return s;
    }
    case "reload": {
      // R: the handgun reloads before its magazine is empty
      if (me && isL4dd(s)) return l4Reload(s, a, now) ? s : state;
      if (me && isMgj(s)) {
        // Mad God Justin: the gun picked up, if it has a magazine (or the down pistol)
        const w = a.w,
          mg =
            w === "handgun" && me.dead && mgjOut(s, a.id)
              ? magSize(w)
              : mgjMag(w),
          m = mg && magOf(s, a.id, now, w);
        if (
          !m ||
          (s.mgj.held[a.id] !== w && !(w === "handgun" && me.dead)) ||
          !m.n ||
          m.r
        )
          return state;
        s.mag = {
          ...(s.mag || {}),
          [magKey(a.id, w)]: { n: m.n, r: now + mg[1] },
        };
        return s;
      }
      const w = magSize(a.w) ? a.w : "handgun"; // (the gun named, or the handgun)
      if (!me || !onKeys(me.duck, w) || !s.options.fun) return state;
      const m = magOf(s, a.id, now, w),
        d = reloadFor(w, m.n);
      if (!m.n || m.r) return state;
      s.mag = {
        ...(s.mag || {}),
        [magKey(a.id, w)]: { n: m.n, r: now + d, d },
      };
      return s;
    }
    case "aura": {
      // an effect around a duck's head, seen by everyone: 5 seconds, or kept on (keep) until kept off
      const what = a.what;
      if (!me || !EFFECTS.includes(what) || !onKeys(me.duck, what) || isMgj(s))
        return state; // (Mad God Justin: no specials)
      const cur = (s.aura || {})[a.id] || {},
        next = {};
      for (const [k, u] of Object.entries(cur)) if (!u || u > now) next[k] = u; // (0: kept on)
      if (a.keep) {
        if (cur[what] === 0) delete next[what];
        else next[what] = 0;
      } else next[what] = now + 5000; // (a kept one goes on for 5 more seconds)
      s.aura = { ...(s.aura || {}), [a.id]: next };
      return s;
    }
    case "tieVote": {
      // Bicker Brackets, a tied match: vote again, or a coin toss (it can be changed until everyone has chosen)
      if (
        !me ||
        me.late ||
        s.phase !== "tie" ||
        !["again", "coin"].includes(a.v)
      )
        return state;
      s.bb.tie = {
        ...s.bb.tie,
        votes: { ...(s.bb.tie || {}).votes, [a.id]: a.v },
      };
      s.done[a.id] = true;
      return advance(s, now);
    }
    case "wqWord":
      return wqWord(s, a, now) || state; // Who is the Quack?: the secret word, from its picker
    case "hang":
      return me && isHang(s) && inWorld(s) && hangAction(s, a, now) ? s : state; // Hangout: an activity (k) did something
    case "counsel": {
      // Lawyering: my pick (as the writer) or my vote (the room) for an attorney; it can change until the picking ends
      const L = s.law,
        how = L && L.how && L.how[a.role];
      if (
        !me ||
        me.late ||
        s.phase !== "counsel" ||
        !how ||
        (how === "writer" && a.id !== s.qs[s.qi].by) ||
        !counselOk(s, a.role, a.who)
      )
        return state;
      L.picks[a.role] = { ...L.picks[a.role], [a.id]: a.who };
      s.done[a.id] = counselDone(s, a.id);
      return advance(s, now);
    }
    case "attvote": {
      // Lawyering's attorney vote: my vote for the defense (then the offense); it can change until the clock runs out
      const L = s.law;
      if (
        !me ||
        me.late ||
        !isLaw(s) ||
        !L ||
        !ATT_PHASES.includes(s.phase) ||
        !counselOk(s, attRole(s), a.who)
      )
        return state;
      const role = attRole(s),
        picks = (L.picks[role] = { ...L.picks[role], [a.id]: a.who }),
        on = playing(s).filter((id) => s.players[id]);
      if (
        !L.fast &&
        on.filter((id) => picks[id] !== undefined).length >=
          Math.max(1, Math.ceil(on.length * shareOf(s) - 1e-9))
      ) {
        L.fast = 1;
        s.ends = now + Math.min(Math.max(0, s.ends - now), ATT_FAST);
      } // (the share of the room is in: 0:05 left)
      return s;
    }
    case "goOn": {
      // Next round: go on without the attorney (the defender) who left, once enough press it (again: take it back)
      const w = s.waiting;
      if (!me || me.late || !w || !w.for) return state;
      w.go = { ...w.go };
      if (w.go[a.id]) delete w.go[a.id];
      else w.go[a.id] = true;
      return goOnDone(s, now) || s;
    }
    case "tv": {
      // Trivia: a vote on a row (pick), End round (end), the writer's Correct or Wrong (grade), the reveal's Stop timer (stop)
      if (!me || !isTv(s)) return state;
      const r =
        a.k === "pick"
          ? tvPick(s, a, now)
          : a.k === "end"
            ? tvEnd(s, a, now)
            : a.k === "grade"
              ? tvGrade(s, a, now)
              : a.k === "stop"
                ? tvStop(s, a, now)
                : null;
      return r || state;
    }
    case "vdTimer":
      return me && isVd(s) ? vdTimer(s, a, now) || state : state; // Valentine's Duck Date: The Date's Start timer (pause, go on)
    case "dnEnd":
      return me && isDn(s) ? dnEndVote(s, a, now) || state : state; // Duncelation: End round (or take it back)
    case "giveUp": {
      // Lawyering: an attorney who isn't ahead in closing arguments gives the case to the other side
      const L = s.law;
      if (
        !me ||
        !isLaw(s) ||
        s.phase !== "answer" ||
        !L ||
        !L.close ||
        !canGiveUp(s, a.id)
      )
        return state;
      L.gave = a.id;
      say(s, `${me.name} gave up the case.`);
      return verdict(s, a.id === L.off ? 1 : 0, now);
    }
    case "pick": {
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
    case "voteStart": {
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
        if (
          a.kind === "newgame" &&
          (!votesDue(s).length || s.phase !== "results")
        )
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
    case "voteCast": {
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
    case "chat": {
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
    case "hostMoved": {
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
    case "usermod": {
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
    case "groupadd": {
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
    case "groupdel": {
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
    case "groupmod": {
      // sudo: rename a group (newName), or set its perms (perms); not sudo, dumbasses or a superuser group
      const G = groupsOf0(s),
        g = G[a.name],
        to = String(a.newName || "").toLowerCase();
      if (
        !me ||
        !isSudo(s, a.id) ||
        !g ||
        ["sudo", "dumbasses"].includes(a.name)
      )
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
    case "forgame":
      return forgame(s, a, now) || state;
    case "skip": {
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
    case "sbPick":
      // Sandbox's start: the host's pick, a new Sandbox or a save from its device (sbsave.js)
      if (!host || s.phase !== "countdown" || !s.sbpk) return state;
      delete s.sbpk;
      if (!sbPick(s, a, now)) return state;
      if (a.save) {
        if (s.options.sbMap || (s.gmPlay && !sbRule(s, "pickmap")))
          s.voteQ = (s.voteQ || []).filter((k) => k !== "map"); // (a world save brings its own map; a made game mode, its own: gmodes.js)
        say(s, `${me.name} is loading a save: ${s.sbsv.name}`);
      } else say(s, `${me.name} started a new Sandbox.`);
      return nextVote(s, now);
    case "umap":
      // a map the host made, brought into the room or taken out (umaprules.js)
      return umapAct(s, a) ? s : state;
    case "sbTest": {
      /* G's Test game mode (gmodes.js): the host's device hands the build, and the Sandbox starts again from it as players
         would see it, no tools (on: 1); Stop test starts it again from the build as it was (on: 0) */
      if (!host || !isSb(s) || !["sandbox", "hang"].includes(s.phase))
        return state;
      if (!a.on && !s.gmTest) return state;
      const banned = s.banned;
      backToLobby(
        s,
        a.on
          ? `${me.name} is testing the game mode.`
          : `${me.name} stopped the test.`,
      );
      s.banned = banned;
      s.sbAsked = 1;
      if (!sbPick(s, { save: a.save, play: a.on ? 1 : 0, test: 1 }, now))
        return state;
      placeMap(s);
      return beginGame(s, now);
    }
    case "sbsv":
      // Sandbox: Save as, the session's new name (and id) on the host's device (sbsave.js)
      return host && sbRename(s, a, now) ? s : state;
    case "music": {
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
    case "songs": {
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
    case "tick": {
      // the host's heartbeat; the same state comes back when nothing changed, so nothing redraws
      if (s.phase === "countdown" && now >= s.ends) return nextVote(s, now);
      if (isQuack(s) && QUACK_PHASES.includes(s.phase) && s.wq && !s.hidden) {
        say(s, "A new host took over, so a new secret word.");
        return startQuackRound(s, now);
      } // (the old host's Secret Cards can't be opened)
      if (s.phase === "lobby" || s.phase === "over") {
        if (!dodRoom(s)) return state;
        const changed = dodSettle(s, now);
        if (dodStarts(s)) {
          const c = countdown(clone(s), now);
          if (c) return c;
        }
        return changed ? s : state;
      }
      if (s.phase === "countdown") return state;
      const dv = dodVoting(s) && dodSettle(s, now); // (Democracy of Ducklings: a vote during a game passes or runs out here)
      if (s.vote && now >= s.vote.ends) {
        say(s, "The vote ran out of time.");
        s.vote = null;
        return s;
      }
      if (sbHere(s) && cabinTick(s, now)) return s;
      if (
        isL4dd(s) &&
        inWorld(s) &&
        s.hang &&
        s.hang.l4 &&
        s.hang.l4.over &&
        (votesDue(s).length || rolling(s)) &&
        now - s.hang.l4.over.at >= L4_OVER_MS
      )
        return cabinOver(s, now, "Everyone's down.");
      const sbOut =
        isL4dd(s) && inWorld(s) && s.hang && s.hang.l4 && s.hang.l4.over;
      if (
        sbOut &&
        isSb(s) &&
        (sbOut.sb === "lobby" || sbOut.sb === "again") &&
        now - sbOut.at >= SB_OUT_MS
      ) {
        if (sbOut.sb === "lobby") return backToLobby(s, "Everyone's out.");
        l4Again(s, now);
        return s;
      } // (Sandbox's Rules: everyone out of lives, then the lobby or a new start)
      const sbEnd = sbOutTick(s, now); // (the same off the zombie maps: sbout.js)
      if (sbEnd === "lobby") return backToLobby(s, "Everyone's out.");
      if (sbEnd) return s;
      if (inWorld(s) && modeOf(s.options.mode).timed && s.ends && now >= s.ends)
        return cabinOver(s, now, "Time's up in the cabin."); // (Hangout from Random or the vote: its time limit)
      const shots = isL4dd(s) ? l4Shots(s, now) : moveShots(s, now),
        hung = isHang(s) && inWorld(s) && hangTick(s, now),
        jus =
          justinTick(s, now, logLine) |
          dnTick(s, now) |
          vdTick(s, now) |
          attacks(s, now) | // (the knife and the hammer, still swinging)
          cakeGone(s, now) |
          (isL4dd(s) ? 0 : groundFire(s, now)) | // (the flamethrower's burning ground)
          pwTick(s, now, normalGame(s)) | // (the ducks' wounds going away: wounds.js)
          (isSb(s)
            ? +sbTick(s, now, SB_H) |
              +sbLootTick(s, now, SB_H) |
              +sbZoneTick(s, now, SB_H) |
              +sbGroupTick(s, now, SB_H)
            : 0), // (Sandbox: its spawns, respawns and the board's zombies; its loot orbs; its zones; its groups)
        up = standUps(s, now); // (a knocked-down duck stands up by itself when its time is up)
      const sig = () => [s.phase, s.qi, s.catchEnds, s.round, s.at].join(),
        was = sig();
      advance(s, now);
      return sig() === was && !shots && !hung && !jus && !up && !dv ? state : s;
    }
  }
  return s;
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

function settleVote(s, now) {
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
function reopenMatch(s, id) {
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
  if (s.phase === "results" || isMgj(s)) return advance(s, now, true); // (Mad God Justin: the fight ends as if time ran out)
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
function cabinCheck(s, now) {
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
function cabinOver(s, now, why = "The ducks voted to leave the cabin.") {
  delete s.cabinEnd;
  const due = votesDue(s);
  if (!due.length && !rolling(s)) return backToLobby(s, why); // (the host's own pick: back to the lobby)
  say(s, why);
  /* Duck Cabin's games (Hangout, Quacky Zombies) are one game whatever Vote return says (owner 2026-11-16): one
     playthrough, then the votes come back, or Random's next game */
  return due.length ? voteAgain(s, now, due) : rotate(s, now);
}
/* Quacky Zombies from the vote or Random: once everyone's down, the score shows a moment, then the room moves on */
const L4_OVER_MS = 8000;
/* Sandbox: everyone's out, the card shows this long before the lobby or the new start */
const SB_OUT_MS = 5000;
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
function cabinTick(s, now) {
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
  delete s.zmapAsked; // (Quacky Zombies' map vote comes again next time)
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
  s.mgj = null;
  s.mz = null;
  s.mgjPast = [];
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
