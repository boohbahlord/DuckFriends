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
  isDn,
  DN_GRACE,
  DN_CEREMONY,
  dnStart,
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
  vdStart,
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
  tvStart,
  tvRound,
  tvDeal,
  tvAdvance,
  tvWrite,
  tvPick,
  tvEnd,
  tvGrade,
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
  invuln,
  hurtFx,
  downStill,
  standUps,
  isGhost,
  DOWN_OK,
  DEAD_STILL,
} from "./hangout/death.js";
import { npcById } from "./npcs.js";
import {
  hangStart,
  hangAction,
  hangTick,
  hangJoin,
  hangLeft,
  hangTargets,
  hangHit,
  hangStill,
} from "./hangout/rules.js";
import {
  inCabin,
  standable,
  heightAt,
  W as HW,
  H as HH,
} from "./hangout/layout.js";
import {
  justinTick,
  justinDown,
  justinHit,
  justinShown,
  justinAt,
  JUSTIN_ID,
} from "./boardjustin.js";
import {
  isMgj,
  mgjStart,
  mgjAdvance,
  mgjStab,
  mgjHurt,
  mgjSoak,
  mgjGone,
  mgjUse,
  mgjShot,
  mgjSafe,
  mgjBurn,
  mgjHitAt,
  MGJ_SCALE,
  MGJ_HAMMER,
  mgjTeamUse,
  mgjCool,
  mgjHolds,
  DMG,
  PUMP,
  PELLETS,
  PELLET_SPEED,
  PELLET_LIFE,
  SPREAD,
  CHAIR_R,
  CAKE_SPEED,
  CAKE_EAT_MS,
} from "./mgjrules.js";
import {
  isL4dd,
  l4Use,
  l4Reload,
  l4Shots,
  l4Holds,
  kitOf,
  helperOut,
} from "./l4ddrules.js";
import { JET } from "./jetpack.js";
import { MAPS, MAP_FORMS, ZOOM_MAP, mapName } from "./maps.js";
import { MODES, modeOf, CABIN_MODES } from "./modes.js";
import { dealRainbow, rainbowJoin } from "./looksrules.js";

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
  answerTime: 30, // the Round Lord's default answer time in seconds: 0 (off), 30, 60, 90
  catchUp: 15, // 0 (off), 15, 30, 45: the countdown once enough players have voted (everyone voting ends it at once)
  writeCatch: 30, // 0 (off), 15, 30, 45, 60: the same countdown while writing (questions, topics, contenders, secret words): I want the last writers to get 30 s by default
  endBtn: 0, // 1: End round: in the social games a vote doesn't end the turn; a button does, once the needed share has voted (Trivia always has it)
  unvoteStops: 1, // 1: taking a vote back below the share stops that countdown (I want this by default); 0: once started it runs out anyway
  discuss: 0, // 1: the Discussion round after each vote comes back (Agree or Disagree, Would You Rather, Bicker Brackets, Lawyering)
  submitTime: 132, // 0 (off), 60, 90, 120, 132 (2:12): a time limit on writing questions; Bicker Brackets starts with none (0)
  botWait: 5, // TEST rooms: seconds before computers act
  lowGravity: 0, // 1: jumps float, slower and higher
  fun: 1, // the silly commands (lightning, love, kill, hotdog): 1 on, 0 off
  ghosts: 0, // 1: Duck Cabin's ghosts (hangout/ghosts.js): a knocked-down duck's ghost walks about until Space
  ghostBusy: 1, // 1: no ghost from a duck busy with an activity (chalk, piano, guestbook, cards, a seat …): it just gets up
  justin: 0, // 1: Duck Cabin's Justin walks the boards too, as a joke (js/boardjustin.js); he never counts
  mgjBoard: 0, // 1: the board's Mad God Justin (only with justin on): 10 HP, and the duck that hurts him is his target for 10 s
  freeRoam: 0, // 1: no answer lock and no talk-it-over step; ducks roam until the turn ends
  map: "board", // board | sky | pixel | carnival | stars | rabbit | collage | euclid | ec | tiles | cabin (Duck Cabin: only for its own games, the Cabin ones)
  mapPick: "vote", // (Vote Maps is the default) "" (the host's map) | vote (Vote Maps: everyone votes) | random: settled when the host starts
  modePick: "", // "" (the host's game) | vote (Vote Game Mode: everyone votes) | random (a new game every round)
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
  lawClose: 60, // seconds of closing arguments when the jury is split: 30, 60, 120
  dunceTime: 120, // Duncelation: seconds the defender gets after the grace period: 0 (off), 60, 120, 180, 300
  dunceTakes: "random", // … whose take you defend: random (it can be your own) | own (you write your own) | notOwn (never your own)
  noOwn: 0, // Duncelation and Lawyering, "Don't get your own prompt": 1 = you never defend or argue the prompt you wrote
  mapGrey: 0, // the collage map: 1 turns it black and white
  mapZoom: 0, // Euclid's Squares, picked by the host: 1 zooms into its tiny squares forever (s.mapZoomed in the game)
  mapAll: 0, // Vote Maps: 1 = the map vote shows every map, 0 = three random ones
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
  rainbowDucks: 0, // … Rainbow Ducks (with hideLooks only): the seven rainbow colors and a brown Justin-costume duck, dealt at random
  voteColor: 0, // Vote colors: 1 = a duck takes the color of the tile it stands on (never with Rainbow Ducks, never in Mad God Justin)
  tagColor: 0, // … Change player tag color: 1 = the name tag takes the vote color too
  mgjHp: 6, // … Player HP: 0 (off), 1, 5, 6, 10, 15
  l4r16: 0, // Quacky Zombies' Round 16 Start: 1 = after round 0's Ready it skips to round 16, everyone with 3,000 points
  vdTime: 60, // Valentine's Duck Date: seconds a date's timer runs once The Date starts it: 0 (off, no timer button), 60, 90, 120
  tvWrite: 210, // Trivia: seconds to write the questions: 120, 210, 300 or 0 (no limit)
  tvMulti: 1, // … Multiple answers: 1 = a question can have several right answers (never all); 0 = exactly one
  tvNoWrong: 0, // … No wrong answers: 1 = a writer can leave every answer unmarked (it then counts for nobody's stats)
  tvMc: 1, // … Multiple choice: 0 = every question is written (never off with tvWr off)
  tvWr: 1, // … Written answers: 0 = no Written Answer button (never off with tvMc off)
  tvHide: 0, // … Hide who wrote it: 1 = the cloud shows a multicolored "?" in place of the writer
  tvGrade: 0, // … Grading timer: 1 = the writer has 1:00 a row, and a row still ungraded then counts as right
  dod: 1, // Democracy of Ducklings: 1 (the ducks vote on the room's rules) | 0; set only when the room is made
};
export const MAX_DEFAULT = 8;

/* Vote Maps and Vote Game Mode, settled when the host starts: the most votes from the players in the room win, and a
   tie is a random pick between the tied ones. No votes at all: any of them. Duck Cabin is never a map to vote for (it
   comes with its own games); a game that needs more players than the room has can't win */
export const tally = (s, votes) => {
  const n = {};
  for (const id of s.seat) {
    const v = (votes || {})[id];
    if (v) n[v] = (n[v] || 0) + 1;
  }
  return n;
};
const winner = (n, pool) => {
  const ok = Object.keys(n).filter((k) => pool.includes(k)),
    top = Math.max(0, ...ok.map((k) => n[k])),
    tied = ok.filter((k) => n[k] === top);
  return anyOf(top ? tied : pool);
};
/* the maps Vote Maps and Random choose from: every board map once (Duck Cabin comes with its own games), each in one
   of its forms, picked at random (Euclid's Squares still or zooming) */
const MAP_IDS = MAPS.map((m) => m[0]);
const formOf = (id) => anyOf(MAP_FORMS[id] || [id]);
export const VOTE_MAPS = MAP_IDS.flatMap((id) => MAP_FORMS[id] || [id]);
/* Vote Maps' own round, as the host starts: three random maps (or all of them with the "All maps" setting), and every
   player votes; the most votes win, a tie is a random pick between the tied maps (none at all: any of them). Not for
   the games that bring their own place (Duck Cabin's, Mad God Justin's) */
export const MAP_VOTE_TIME = 15;
const NO_MAP_VOTE = [...CABIN_MODES, "mgj"];
const mapVotes = (s) =>
  s.options.mapPick === "vote" && !NO_MAP_VOTE.includes(s.options.mode);
const dealMaps = (s) =>
  (s.options.mapAll ? MAP_IDS : shuffle([...MAP_IDS]).slice(0, 3)).map(formOf);
/* the map the vote or Random lands on (the zoom is Euclid's Squares with s.mapZoomed) */
function setMap(s, won) {
  s.options.map = won === ZOOM_MAP[0] ? "euclid" : won;
  s.mapZoomed = won === ZOOM_MAP[0] ? 1 : 0;
  s.mapVotes = {};
  say(s, `The map: ${mapName(won)}!`);
}
const fits = (s, id) => s.seat.length >= (MIN_PLAYERS[id] || 0);
const pickMode = (s) =>
  winner(
    tally(s, s.modeVotes),
    MODES.map((m) => m.id).filter((id) => fits(s, id)),
  );
/* Random: the games it plays (never Hangout or Left 4 Dead Ducks, nor a game the room is too small for); each round is
   the next one in the bag, every game once before a new shuffle, or with True Random any game at all */
export const randomPool = (s) =>
  MODES.map((m) => m.id).filter(
    (id) => !CABIN_MODES.includes(id) && fits(s, id),
  );
function nextMode(s) {
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
function writeTimerFor(s, wasMode) {
  if (isBb(s) && s.options.submitTime === 132) s.options.submitTime = 0;
  else if (!isBb(s) && s.options.submitTime === 0 && wasMode === "bb")
    s.options.submitTime = 132;
}
/* the start: Vote Game Mode, Random and Vote Maps settle, then the countdown. Returns null when the room has too few
   players for the game (the lobby says how many it needs) */
function countdown(s, now) {
  if (dodOn(s, "modes")) s.options.modePick = "vote"; // (Democracy of Ducklings: the ducks always vote)
  if (dodOn(s, "maps")) s.options.mapPick = "vote";
  if (s.options.modePick) {
    const was = s.options.mode;
    s.options.mode =
      s.options.modePick === "vote"
        ? pickMode(s)
        : ((s.modeBag = []), nextMode(s));
    writeTimerFor(s, was);
    s.modeVotes = {};
    say(s, `The game: ${modeOf(s.options.mode).name}!`);
  }
  if (s.seat.length < minOf(s)) return null; // (the lobby says how many it needs)
  if (isHang(s) !== (s.options.map === "cabin"))
    s.options.map = isHang(s) ? "cabin" : "board"; // (Duck Cabin and its games are one)
  /* the zoom on Euclid's Squares: one of its forms for Vote Maps and Random, the map's Zoom setting for the host's pick */
  s.mapZoomed = s.options.map === "euclid" && s.options.mapZoom ? 1 : 0;
  delete s.mv;
  if (s.options.mapPick && !isHang(s)) {
    if (mapVotes(s)) {
      // Vote Maps: its round first, in the lobby (the countdown's first part); then the countdown
      s.mv = { maps: dealMaps(s), votes: {} }; // (online, votes only comes back once someone votes)
      s.phase = "countdown";
      s.at = now;
      s.ends = now + MAP_VOTE_TIME * 1000;
      return s;
    }
    setMap(s, formOf(anyOf(MAP_IDS)));
  }
  return counting(s, now);
}
function counting(s, now) {
  dealRainbow(s); // (Rainbow Ducks: each duck's look for this game)
  s.phase = "countdown";
  s.at = now;
  s.ends = now + COUNTDOWN * 1000;
  return s;
}
/* the map vote is over (time's up, everyone voted, or the host skipped it): the map, then the countdown */
function settleMaps(s, now) {
  const mv = s.mv;
  delete s.mv;
  setMap(s, winner(tally(s, mv.votes), mv.maps));
  return counting(s, now);
}
const rolling = (s) => s.options.modePick === "random";
/* Random, at the end of a round: the room goes straight into the next game (nobody kicked comes back in) */
function rotate(s, now) {
  const mode = nextMode(s),
    was = s.options.mode,
    banned = s.banned;
  backToLobby(s, `Next game: ${modeOf(mode).name}!`);
  s.banned = banned;
  s.options.mode = mode;
  writeTimerFor(s, was);
  return beginGame(s, now);
}
/* the countdown is over: the game begins (Random: again for every new game) */
function beginGame(s, now) {
  const P = s.players;
  s.startedAt = now;
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
  s.dn = null;
  if (isDn(s)) dnStart(s);
  s.mgj = null;
  s.mgjPast = [];
  if (isMgj(s)) return mgjStart(s, now);
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
/* the lobby's Walking speed: how much faster or slower than normal every duck walks. The zombies of Quacky Zombies and
   the computers there go by it too, so the zombies stay as fast next to the ducks as the owner set them */
export const WALKS = { slow: 0.6, normal: 1, fast: 1.5 };
export const walkOf = (s) => WALKS[s && s.options && s.options.walk] || 1;
export const COUNTDOWN = 5;
export const VOTE_GRACE = 5; // seconds at the start of a question before anyone can lock a vote (a stray Enter can't)

const clone = (o) => structuredClone(o);
export const colOf = (x) => Math.max(0, Math.min(6, Math.floor(x * 7)));
export const colX = (c) => (c + 0.5) / 7;
/* the edges of a column, a little inside, for ducks kept in their column */
export const colBounds = (c) => [c / 7 + 0.035, (c + 1) / 7 - 0.035];
/* the board by game mode: Agree or Disagree has its seven columns; Would You Rather two tiles, A on the left and B on the
   right, with an OR strip between them where a duck has no answer (-1) */
export const isWyr = (s) => s.options.mode === "wyr";
/* Does Duck Relate?: Agree or Disagree's written statements on two tiles, Duck Does Relate (A, left) or Duck Doesn't
   Relate (B, right) */
export const isDdr = (s) => s.options.mode === "ddr";
export const isBb = (s) => s.options.mode === "bb";
export const isSc = (s) => s.options.mode === "sc";
export const isLaw = (s) => s.options.mode === "law";
/* Duck Cabin's world: Hangout, and Quacky Zombies on the same map (its own rules: l4ddrules.js) */
export const isHang = (s) =>
  s.options.mode === "hang" || s.options.mode === "l4dd";
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
    : isBb(s)
      ? ["answer", "tie", "discuss", "bracket"]
      : isSc(s)
        ? SC_BOARD
        : isQuack(s)
          ? ["clue", "choice", "accuse", "reveal"]
          : isLaw(s)
            ? ["answer", "discuss"]
            : isDn(s)
              ? ["answer", "discuss", "dunced"]
              : isMgj(s)
                ? ["boss", "mgjend"]
                : isVd(s)
                  ? VD_PHASES
                  : isTv(s)
                    ? TV_BOARD
                    : ["answer", "discuss", "results"];
const humanIds = (s) => s.seat.filter((id) => !s.players[id].bot);
/* who plays now: a player who joined in the middle of a turn they can't take part in walks around until the next one */
export const playing = (s) =>
  s.seat.filter((id) => !(s.players[id] || {}).late);
export const seatLate = (s) => {
  for (const id of s.seat) if (s.players[id]) delete s.players[id].late;
}; // they play from here
/* the fewest players a game needs. I want a game that drops below it to wait for players ("Waiting for players to
   continue", with 2/3 and the like) instead of ending: the timers stop where they were, ducks still walk, and the game
   goes on once enough are back */
export const MIN_PLAYERS = { quack: 3, law: 3, dunce: 3, vdd: 3, trivia: 2 };
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
export const END_BTN_MODES = ["aod", "wyr", "ddr", "sc"];
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
   Nov 3: "slightly faster"); Mad God Justin's own bullets keep their speed (mgjrules.js JUSTIN_SHOT) */
export const FASTER = 1.15;
/* the bow's arrow: it flies straight and fast the way it was aimed, on to the screen's edge */
export const ARROW_SPEED = 0.6 * FASTER;
export const SHOT_SPEED = 0.22 * FASTER; // the handgun special's bullet: board widths a second (slow enough to see, and to jump over)
/* the thrown dagger: across the board at DAGGER_SPEED (board widths a second) while its height (in duck sizes) rises
   from the beak and falls: z = DAGGER_Z + DAGGER_UP·t − DAGGER_G·t²/2; it hits ducks only at their height, then falls
   on down off the screen */
export const DAGGER_SPEED = 0.45 * FASTER,
  DAGGER_Z = 0.45,
  DAGGER_UP = 1.2,
  DAGGER_G = 2.2,
  DAGGER_LIFE = 4500; // (it never flies over a duck's head: everything in its way is hit)
export const daggerZ = (t) => DAGGER_Z + DAGGER_UP * t - (DAGGER_G * t * t) / 2; // (t in seconds)
/* the grenade: thrown GRENADE_FAR duck lengths the way it aims, over an arc (its height in duck sizes), and it goes off
   where it lands, GRENADE_MS later: every duck within GRENADE_R duck lengths (3 ducks across) plays dead and is thrown
   three times as far as the hammer throws one, then looks burnt for a while */
export const GRENADE_MS = 900,
  GRENADE_FAR = 8,
  GRENADE_R = 1.5;
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
  "shotgun",
  "grenade",
  "bow",
  "chair",
  "zebra",
  "jaime",
  "sound",
  "trombone",
  "confetti",
]; // the items, used with their number key
/* how long an item waits before its key works again (ms); the key shows a bar draining meanwhile */
const COOLDOWN = {
  handgun: 200,
  dagger: 2000,
  knife: 250, // (four stabs a second, in every mode: the owner's, Nov 3)
  hammer: 2250,
  shotgun: PUMP,
  grenade: 12000,
  confetti: 15000,
  bow: 400,
  chair: 15000,
  zebra: 30000, // (as Mad God Justin's CAKE_EVERY)
  jaime: 12000, // (as Mad God Justin's JAIME_MS, but each duck's own)
};
export const coolFor = (sp, s) =>
  (s && isMgj(s) && mgjCool(sp)) || COOLDOWN[sp] || 1500; // (Mad God Justin has its own for the knife and the bow)
/* the handgun holds MAG shots, about five a second; after the last it reloads for RELOAD ms by itself (R reloads sooner).
   s.mag = { id: { n: shots fired, r: when its reload ends (0: not reloading) } } */
export const MAG = 7,
  RELOAD = 3500; // (I want 3.5 s: 1.5 was too short)
export const magOf = (s, id, now) => {
  const m = (s.mag || {})[id];
  return !m || (m.r && now >= m.r) ? { n: 0, r: 0 } : m;
};
export const coolEnds = (s, id, sp) =>
  Math.max(
    ((s.lastUse || {})[`${id} ${sp}`] || 0) + coolFor(sp, s),
    sp === "handgun" ? ((s.mag || {})[id] || {}).r || 0 : 0,
  ); // (a time on the room's clock)
export const WEAPONS = [
  "handgun",
  "dagger",
  "knife",
  "hammer",
  "shotgun",
  "grenade",
  "bow",
]; // aimed (with the mouse), and kept out with Shift and their key
/* the hammer's knock-back: a duck it hits is shoved KB_FAR duck lengths away from the swing in KB_MS, with a little hop
   (KB_HOP duck sizes high), and lands playing dead; pos.kb = { t, x, y: where it was } lets every screen draw the shove */
export const KB_MS = 380,
  KB_FAR = 2.4,
  KB_HOP = 0.3,
  KB_LAND = 110; // (KB_LAND: ms until the swing gets there; the duck falls then)
/* may this duck fly? (the jetpack on its back, with fuel left in Quacky Zombies; never in Mad God Justin) */
function canFly(s, id, now) {
  if (isMgj(s)) return false;
  if (isL4dd(s)) {
    const m = kitOf(s, id);
    return !!(m && m.jp && ((m.am || {}).jetpack || [0])[0] > 0);
  }
  const u = ((s.aura || {})[id] || {}).jetpack;
  return u !== undefined && (!u || u > now);
}
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
  "jetpack",
]; // the effects, shown around a duck (the Invisible duck and the Jetpack: only on or off, never for 5 seconds)
/* thrown the way the mouse aims, but never kept out: the Chair special (the silly commands' switch covers it, as the
   weapons) and the Zebra cake */
export const THROWS = ["chair", "zebra"];
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
}) {
  return {
    v: 1,
    id,
    name,
    test,
    open,
    passkey,
    max,
    hostId: host.id,
    options: {
      ...OPTIONS_DEFAULT,
      ...(options.mode === "bb" ? { submitTime: 0 } : {}), // (Bicker Brackets starts with no write timer)
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
  if (s.phase === "podium") return PODIUM;
  if (s.phase === "dunced") return DN_CEREMONY;
  if (s.phase === "vdprompt") return VD_WRITE;
  if (s.phase === "vddate") return s.lordTime;
  if (s.phase === "vddown") return VD_DOWN;
  if (s.phase === "vdval") return VD_VAL;
  if (s.phase === "wqpick") return s.options.wqPickTime;
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
const logLine = (s, line) => {
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
const sayFloat = (s, text, by) =>
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
  if (rolling(s)) return rotate(s, now); // (Random: the next round is the next game)
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
function startResults(s, now) {
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
export const WRITE_PHASES = ["submit", "topic", "seeds", "words", "tvwrite"];
export const catchLen = (s) =>
  +(WRITE_PHASES.includes(s.phase)
    ? (s.options.writeCatch ?? 30)
    : s.options.catchUp) || 0; // (seconds; writing has its own)
function catchUp(s, now, enough) {
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
function advance(s, now, force = false) {
  if (s.waiting) return s; // (waiting for players: nothing moves on)
  if (isSc(s) && SC_PHASES.includes(s.phase)) return scAdvance(s, now, force);
  if (isQuack(s) && QUACK_PHASES.includes(s.phase))
    return quackAdvance(s, now, force);
  if (isHang(s)) return s; // (no turns: the cabin stays open until the room goes back to the lobby)
  if (isMgj(s)) {
    const was = s.phase,
      next = mgjAdvance(s, now, force, logLine);
    return was === "results" && next.phase !== "results" && rolling(next)
      ? rotate(next, now)
      : next;
  } // (Mad God Justin: his HP, the timer, the podium, Try again; with Random, the next game instead)
  if (isVd(s) && VD_PHASES.includes(s.phase)) return vdAdvance(s, now, force); // (Valentine's Duck Date: its timers)
  if (isTv(s) && TV_BOARD.includes(s.phase)) return tvAdvance(s, now, force); // (Trivia: a question's votes, answers, grades)
  const on = playing(s),
    n = on.length,
    d = on.filter((id) => s.done[id]).length,
    all = d >= n,
    enough = d >= needed(s);
  if (isLaw(s) && s.phase === "answer") return lawCheck(s, now, force); // a case waits for the jury (and closing arguments)
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
      if (rolling(s)) return rotate(s, now); // (Random: the next round is the next game)
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
    if (ph === "hang") hangJoin(s, id);
    return;
  } // Hangout: at the front door, at once
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
      if (s.seat.filter((id) => !P[id].helper).length >= s.max) return s; // (the fireplace's Justin takes nobody's seat)
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
      if (dodOn(s, "modes")) {
        delete o.mode; // (the ducks always vote on the game mode,
        delete o.modePick;
      }
      if (dodOn(s, "maps")) {
        delete o.map; // and on the map)
        delete o.mapPick;
      }
      if (
        (boss || (dodOn(s, "settings") && me && !me.bot)) &&
        (s.phase === "lobby" || s.phase === "over")
      ) {
        const was = s.options.discuss,
          wasMode = s.options.mode,
          before = { ...s.options, max: s.max };
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
          if (s.options.share === from) s.options.share = to;
        }
        if (o.mode && !("submitTime" in o)) writeTimerFor(s, wasMode);
        /* picking a game ends Vote Game Mode and Random; picking a map ends Vote Maps and Random. A new vote starts from
           nobody */
        if (o.mode && !("modePick" in o)) s.options.modePick = "";
        if (o.map && !("mapPick" in o)) s.options.mapPick = "";
        if ("modePick" in o) s.modeVotes = {};
        if ("mapPick" in o) s.mapVotes = {};
        if (o.map === "cabin" && !o.mode && !isHang(s)) {
          s.options.mode = "hang"; // Duck Cabin and its games are one: picking the map picks Hangout,
          s.options.modePick = "";
        } else if ((o.map || o.mapPick || o.modePick) && !o.mode && isHang(s))
          s.options.mode = "aod"; // and another map (or a vote, or Random) leaves Duck Cabin
        if (isHang(s)) {
          s.options.map = "cabin";
          s.options.mapPick = "";
        } else if (s.options.map === "cabin") {
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
        const after = { ...s.options, max: s.max },
          ch = {};
        for (const k of Object.keys(after))
          if (JSON.stringify(after[k]) !== JSON.stringify(before[k]))
            ch[k] = after[k];
        if (Object.keys(ch).length)
          logLine(s, {
            sys: true,
            float: true,
            by: a.id,
            opts: ch,
            reset: Object.keys(OPTIONS_DEFAULT).every((k) => k in o),
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
    case "mapVote": {
      // the map vote's round: a player votes for one of its maps (again: changes the vote); once every player has, it's over
      const mv = s.mv;
      if (!me || s.phase !== "countdown" || !mv || !mv.maps.includes(a.map))
        return state;
      mv.votes = { ...(mv.votes || {}), [a.id]: a.map }; // (online, an empty list of votes doesn't come back)
      if (s.seat.every((id) => mv.votes[id])) return settleMaps(s, now);
      return s;
    }
    case "modeVote": {
      // Vote Game Mode: any player in the lobby votes; the same pick again takes the vote back
      const v = a.mode;
      if (
        !me ||
        !MODES.some((m) => m.id === v) ||
        s.options.modePick !== "vote" ||
        !(s.phase === "lobby" || s.phase === "over")
      )
        return state;
      const votes = { ...(s.modeVotes || {}) };
      if (votes[a.id] === v) delete votes[a.id];
      else votes[a.id] = v;
      s.modeVotes = votes;
      return s;
    }
    case "dod": {
      // Democracy of Ducklings: a duck votes (again: takes the vote back); the host turns a rule on, or hands the host over, directly
      const k = a.k;
      if (
        !me ||
        me.bot ||
        !dodRoom(s) ||
        !DOD_KEYS.includes(k) ||
        !(s.phase === "lobby" || s.phase === "over")
      )
        return state;
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
        delete s.mv; // (the map vote too)
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
        isL4dd(s) &&
        was.tp &&
        now - was.tp < 1500 &&
        Math.hypot((+a.x || 0) - was.x, (+a.y || 0) - was.y) > 0.03
      )
        return state; // (Quacky Zombies: the host just put it at a start spot; a move sent before that got there is old)
      if (isHang(s) && hangStill(s, a.id, now)) return state; // Hangout: shot by Justin, it can't move for a while
      if (downStill(s, a.id, now)) return state; // the boards: knocked down, it can't move for the host's time (1 s unless set)
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
        !isTv(s)
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
      const dj = j && +a.dj > j ? +a.dj : 0; // a double jump: when the second jump began
      const w = (
          isL4dd(s)
            ? l4Holds(s, a.id, a.w)
            : isMgj(s)
              ? mgjHolds(s, a.id, a.w)
              : WEAPONS.includes(a.w) && onKeys(me.duck, a.w) && s.options.fun
        )
          ? a.w
          : "",
        [ax, ay] = w ? aimOf(a, 1) : [0, 0]; // a weapon kept out, and where it aims
      const hz = (v) => Math.max(-400, Math.min(1200, Math.round(+v || 0))); // Hangout: z, the height of its feet; b, where its jump began (world px)
      s.pos[a.id] = {
        x,
        y,
        j,
        q: /^[lrud]$/.test(a.q) ? a.q : "",
        sp: !!a.sp,
        ...(j && a.lj ? { lj: true } : {}),
        ...(j && a.sj && !a.lj ? { sj: true } : {}),
        ...(dj ? { dj } : {}),
        ...(w ? { w, ax: +ax.toFixed(3), ay: +ay.toFixed(3) } : {}),
        ...(isHang(s)
          ? {
              z: hz(a.z),
              b: hz(a.b),
              ...(j && +a.tb > 0 ? { tb: Math.min(3.5, +a.tb) } : {}),
            }
          : {}),
        ...(a.jf && canFly(s, a.id, now)
          ? {
              jf: 1,
              ...(a.jt ? { jt: 1 } : {}),
              ...(a.fly ? { fly: 1 } : {}),
              ...(isHang(s)
                ? {}
                : { fz: Math.max(0, Math.min(JET.TOP, +a.fz || 0)) }),
            }
          : {}),
        ...(was &&
        was.kb &&
        now - was.kb.t < (was.kb.l ?? KB_LAND) + (was.kb.ms || KB_MS)
          ? { kb: was.kb }
          : {}),
      }; // q: squashed against l/r/u/d; sp: sprinting; lj: a long jump; tb: a trampoline bounce's height; jf: flying with the jetpack (jt: its jets on, fly: high enough that a hit misses, fz: its height on the boards)
      quackMoved(s, a.id); // (Who is the Quack?: first onto the Quack's tile)
      if (me.dead && (x !== was.x || y !== was.y)) delete me.dead;
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
    case "toLobby":
      if (boss && isHang(s) && s.phase === "hang")
        return backToLobby(s, `${me.name} took everyone back to the lobby.`); // (Hangout: the host ends it whenever)
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
      if (
        isMgj(s)
          ? s.phase !== "boss" || me.dead
          : !PRESS.includes(sp) || !onKeys(me.duck, sp)
      )
        return state; // (Mad God Justin: not while down)
      if (isMgj(s) && ["revive", "jaime", "zebra"].includes(sp))
        return mgjTeamUse(s, a, now, logLine) ? s : state; // (Mad God Justin: a revive held or let go, a Jaime, the zebra cake)
      if (isMgj(s) && sp !== "knife" && sp !== "bow")
        return mgjUse(s, a, now, logLine) ? s : state; // (Mad God Justin: the weapon picked up, once)
      if (
        (WEAPONS.includes(sp) || sp === "chair" || sp === "jaime") &&
        !s.options.fun &&
        !isMgj(s)
      )
        return state; // the silly-commands switch covers them
      if (isGhost(s, a.id)) return state; // (Duck Cabin: a ghost can't use anything)
      if (sp === "sound") return state; // (Sound is off for now: specials.js off)
      const k = `${a.id} ${sp}`; // (each item waits on its own)
      if (now < coolEnds(s, a.id, sp)) return state;
      if (sp === "zebra" && s.zcake) return state; // (one zebra cake in the room at a time)
      if (sp === "jaime") {
        if (!jaimeOut(s, a.id, now)) return state; // (nobody to go for: the key keeps its Jaime)
        s.lastUse = { ...(s.lastUse || {}), [k]: now };
        return s;
      }
      if (sp === "handgun") {
        // one shot from the magazine; the last starts the reload
        const m = magOf(s, a.id, now),
          n = m.n + 1;
        s.mag = {
          ...(s.mag || {}),
          [a.id]: { n, r: n >= MAG ? now + RELOAD : 0 },
        };
      }
      s.lastUse = { ...(s.lastUse || {}), [k]: now };
      const face = a.face < 0 ? -1 : 1,
        aim =
          WEAPONS.includes(sp) || THROWS.includes(sp) ? aimOf(a, face) : null;
      const hit =
        sp === "knife" || sp === "hammer"
          ? strike(s, a.id, sp, aim, now)
          : null; // (the knife and the hammer hit at once, up close, and while they swing: attacks)
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
      if (aim && !hit) {
        const v =
            sp === "dagger"
              ? DAGGER_SPEED
              : sp === "bow"
                ? ARROW_SPEED
                : SHOT_SPEED,
          hang = isHang(s)
            ? {
                hz: Math.round(+p.z || 0),
                hin: inCabin(p.x * HW, p.y * HH) ? 1 : 0,
              }
            : {}; // (Hangout: the height it flies at, and which side of the cabin's walls)
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
        const [rx, ry] = isHang(s) ? [0.006, 0.012] : [0.03, 0.08],
          dx = aim[0] / rx,
          dy = aim[1] / ry,
          dl = Math.hypot(dx, dy) || 1; // (the aim in duck lengths: the shotgun's cone and the grenade's throw are measured in them)
        if (sp === "shotgun") {
          // a cone of pellets, as Mad God Justin's shotgun
          const a0 = Math.atan2(dy, dx),
            out = [];
          for (let i = 0; i < PELLETS; i++) {
            const an =
                a0 +
                SPREAD * ((i / (PELLETS - 1)) * 2 - 1) +
                (Math.random() - 0.5) * 0.08,
              bx = Math.cos(an) * rx,
              by = Math.sin(an) * ry,
              bl = Math.hypot(bx, by);
            out.push(
              shot(
                s.fxN * 10 + i,
                "pellet",
                (bx / bl) * PELLET_SPEED,
                (by / bl) * PELLET_SPEED,
                { life: PELLET_LIFE },
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
        } else
          s.shots = [
            ...(s.shots || []),
            shot(s.fxN, sp === "bow" ? "arrow" : sp, aim[0] * v, aim[1] * v),
          ];
      }
      return s;
    }
    case "reload": {
      // R: the handgun reloads before its magazine is empty
      if (me && isL4dd(s)) return l4Reload(s, a, now) ? s : state;
      if (!me || !onKeys(me.duck, "handgun") || !s.options.fun) return state;
      const m = magOf(s, a.id, now);
      if (!m.n || m.r) return state;
      s.mag = { ...(s.mag || {}), [a.id]: { n: m.n, r: now + RELOAD } };
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
      return me && isHang(s) && s.phase === "hang" && hangAction(s, a, now)
        ? s
        : state; // Hangout: an activity (k) did something
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
      // Trivia: a vote on a row (pick), End round (end), the writer's Correct or Wrong (grade)
      if (!me || !isTv(s)) return state;
      const r =
        a.k === "pick"
          ? tvPick(s, a, now)
          : a.k === "end"
            ? tvEnd(s, a, now)
            : a.k === "grade"
              ? tvGrade(s, a, now)
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
      if (!me || me.bot || ["lobby", "countdown", "over"].includes(s.phase))
        return state;
      if (s.vote) return state;
      const used = (s.voteUsed || {})[a.id] || {},
        tk = voteKey(s, now);
      if (a.kind === "kick") {
        if (!P[a.target] || a.target === a.id) return state;
        if (humanIds(s).length <= 2) return state; // two people: no kick vote (it would pass on the starter's vote alone)
        if (used.kick !== undefined && s.round - used.kick < 2) return state; // one kick vote every two rounds
      } else if (a.kind === "lobby" || a.kind === "skip" || a.kind === "turn") {
        if (a.kind === "turn" && isBb(s)) return state; // (not in Bicker Brackets)
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
        s.phase === "hang"
      )
        return state;
      say(s, `${me.name} skipped ahead.`);
      if (s.phase === "countdown") {
        s.ends = now;
        return s;
      } // the next tick starts the game
      return advance(s, now, true);
    }
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
      if (!may(s, a.id, "cansettings")) return state;
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
      if (s.phase === "countdown" && now >= s.ends)
        return s.mv ? settleMaps(s, now) : beginGame(s, now);
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
      if (s.vote && now >= s.vote.ends) {
        say(s, "The vote ran out of time.");
        s.vote = null;
        return s;
      }
      const shots = isL4dd(s) ? l4Shots(s, now) : moveShots(s, now),
        hung = isHang(s) && s.phase === "hang" && hangTick(s, now),
        jus =
          justinTick(s, now, logLine) |
          dnTick(s, now) |
          vdTick(s, now) |
          attacks(s, now) | // (the knife and the hammer, still swinging)
          cakeGone(s, now) |
          jaimeRun(s, now),
        up = standUps(s, now); // (a knocked-down duck stands up by itself when its time is up)
      const sig = () => [s.phase, s.qi, s.catchEnds, s.round, s.at].join(),
        was = sig();
      advance(s, now);
      return sig() === was && !shots && !hung && !jus && !up ? state : s;
    }
  }
  return s;
}

/* the safety net: an action that throws is skipped (the room keeps going) and the room's log says so, once a minute at
   most, so a broken action can't stop a game */
export function safeReduce(state, a, now = Date.now()) {
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
  }
}

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
];
export const permOk = (p) =>
  GROUP_PERMS.includes(p) || /^slow([5-9]|[1-9]\d|[1-5]\d\d|600)$/.test(p); // slow30: one message every 30 s (5 to 600)
const SLOW_MS = 15000;
function groupsOf0(s) {
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
export const DOD_KEYS = ["ready", "maps", "modes", "settings", "sudo", "host"];
export const DOD_NAMES = {
  ready: "Host must ready",
  maps: "Map is always voted",
  modes: "Game mode is always voted",
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
function dodSet(s, k, on, to = null) {
  if (k === "host") {
    s.hostId = to;
    say(s, `Democracy of Ducklings: ${s.players[to].name} is the new host.`);
    return;
  }
  const rules = { ...(s.dod.on || {}) };
  if (on) rules[k] = true;
  else delete rules[k];
  s.dod.on = rules;
  if (on && k === "modes") {
    s.options.modePick = "vote";
    s.modeVotes = {};
  }
  if (on && k === "maps" && !isHang(s)) {
    s.options.mapPick = "vote";
    s.mapVotes = {};
  }
  say(s, `Democracy of Ducklings: ${DOD_NAMES[k]} is ${on ? "on" : "off"}.`);
}
/* votes from ducks who left (or for one who left) are dropped, a vote with enough votes passes, and one that has run 60 s
   ends; true when anything changed */
function dodSettle(s, now) {
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
const dodStarts = (s) =>
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
  boss: "voting",
  mgjend: "discussing",
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
function countTurn(s, was) {
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
function forgame(s, a, now) {
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
          "lowGravity",
          "justin",
          "mgjBoard",
          "ghosts",
          "ghostBusy",
          "discuss",
          "unvoteStops",
        ].includes(k)
      )
        o[k] = v ? 1 : 0;
      if (
        ["justin", "mgjBoard"].includes(k) &&
        ["l4dd", "mgj"].includes(s.options.mode)
      )
        delete o[k]; // (never Justin on the board in Quacky Zombies or Mad God Justin: the owner's, Nov 4)
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
            : k === "lowGravity"
              ? `gravity ${v ? "low" : "normal"}`
              : k === "downMs"
                ? `knocked down for ${v ? v / 1000 + " s" : "no time"}`
                : k === "justin"
                  ? `Justin ${v ? "on" : "off"}`
                  : k === "mgjBoard"
                    ? `Mad God Justin ${v ? "on" : "off"}`
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

/* Justin knocked down by a player's weapon (the clown items unlock at 12): the last few, each numbered, so
   every device counts its own player's once (unlocks.js) */
function justinKilled(s, by, w) {
  if (!s.players[by]) return;
  s.jkN = (s.jkN || 0) + 1;
  s.jk = [...(s.jk || []).slice(-9), { n: s.jkN, by, w }];
}
/* a player knocked down by another player's weapon: the last few, each numbered, so every device counts its own player's
   kills once (unlocks.js: the shotgun opens at 144 kills, the grenade at 360, and Justin counts too) */
/* a jump dodges attacks, but not in its first and its last fifth: I want a dodge timed, not a jump held as a shield.
   The jump's length is game.js' (JUMP, jumpCfg): 0.62 s, low gravity 1.2 s, a long jump 1.4 times, a short jump 0.7
   times; a double jump goes on for a second arc from when it began */
export function dodges(s, p, now) {
  if (!p || !p.j) return false;
  const T =
      p.tb > 0
        ? 620 * Math.sqrt(p.tb / 1.35)
        : (s.options.lowGravity ? 1200 : 620) * (p.lj ? 1.4 : p.sj ? 0.7 : 1),
    end = (p.dj > p.j ? p.dj : p.j) + T;
  return now - p.j > T * 0.2 && end - now > T * 0.2;
}
/* the normal game's HP (every mode but Mad God Justin): a duck has PHP HP before it plays dead, and has them all back
   after PHP_BACK ms without a hit. s.php = { id: { n: HP lost, t: the last hit } }. True when the hit only took HP.
   What a hit takes (owner 2026-11-03 17:15Z, not in Quacky Zombies): the hammer, the chair and a grenade 3, the knife 2,
   the rest 1 */
export const PHP = 3,
  PHP_BACK = 6000;
export const phpLost = (s, id, now) => {
  const h = (s.php || {})[id];
  return h && now - h.t < PHP_BACK ? h.n : 0;
};
export const HIT_DMG = { hammer: 3, chair: 3, grenade: 3, knife: 2 };
export const dmgOf = (s, k) => (isL4dd(s) ? 1 : HIT_DMG[k] || 1);
export function soaks(s, id, now, dmg = 1) {
  if (isMgj(s)) return false;
  if (invuln(s)) return hurtFx(s, id, now); // (Invulnerability: the hit only flashes)
  const n = phpLost(s, id, now) + dmg,
    rest = { ...s.php };
  delete rest[id];
  s.php = n >= PHP ? rest : { ...rest, [id]: { n, t: now } };
  return n < PHP;
}
function playerKilled(s, by, id, w) {
  if (!s.players[by] || by === id) return;
  s.pkN = (s.pkN || 0) + 1;
  s.pk = [...(s.pk || []).slice(-19), { n: s.pkN, by, id, w }];
}
/* a duck knocked flying (the hammer, a grenade): `far` duck lengths along (ux, uy), a direction in duck lengths, as far
   as it goes before a wall, a tree or the edge (Hangout: only on its side of the cabin's walls), or the board's edge.
   pos.kb = { t, x, y: where it was } lets every screen draw it; a grenade's adds ms (how long it flies), h (how high)
   and l: 0 (it falls at once, not when a swing gets there) */
export function shove(s, id, ux, uy, far, now, side, more = {}) {
  const p = s.pos[id],
    hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : [0.03, 0.08],
    vx = ux * far * rx,
    vy = uy * far * ry,
    n = Math.ceil(far * 3);
  let x = p.x,
    y = p.y;
  for (let i = 1; i <= n; i++) {
    const tx = Math.max(0, Math.min(1, p.x + (vx * i) / n)),
      ty = Math.max(0, Math.min(1, p.y + (vy * i) / n));
    if (
      hang &&
      (!standable(tx * HW, ty * HH, +p.z || 0, undefined, [x * HW, y * HH]) ||
        (inCabin(tx * HW, ty * HH) ? 1 : 0) !== side)
    )
      break;
    x = tx;
    y = ty;
  }
  s.pos[id] = {
    ...p,
    x: +x.toFixed(4),
    y: +y.toFixed(4),
    j: 0,
    kb: { t: now, x: p.x, y: p.y, ...more },
  };
}
/* the knife's stab and the hammer's swing, from duck `by` toward its aim: every duck on the ground in reach plays dead
   (the knife: the nearest one right in front; the hammer: all of them in a third of a circle, shoved back). Distances
   are in a duck's room, as for the bullets; in Hangout only on the same side of the cabin's walls and at about the same
   height. Justin can be hit too. Returns who was hit (JUSTIN_ID for Justin); done: who this swing already hit, never hit
   twice (Duck Cabin's own, Justin and the cats, go in it as "h:" and their id). */
const REACH = { knife: [2.3, 0.9], hammer: [3, 0.5] }; // how far (duck lengths), and how wide (the cosine of the half angle)
export function swing(s, by, sp, aim, now, from = s.pos[by], done = []) {
  // (from: where the swing starts; Justin on the boards isn't in s.pos)
  const p0 = from,
    hang = isHang(s),
    rx = hang ? 0.006 : 0.03,
    ry = hang ? 0.012 : 0.08,
    [far0, wide] = REACH[sp],
    far =
      far0 *
      (sp === "hammer" && by === JUSTIN_ID && isMgj(s)
        ? MGJ_SCALE * MGJ_HAMMER
        : 1); // (Mad God Justin's bigger hammer reaches farther)
  const al = Math.hypot(aim[0] / rx, aim[1] / ry) || 1,
    ux = aim[0] / rx / al,
    uy = aim[1] / ry / al;
  const side = hang ? (inCabin(p0.x * HW, p0.y * HH) ? 1 : 0) : 0,
    z0 = hang ? +p0.z || 0 : 0;
  const near = (x, y, z, inSide) => {
    // where (x, y) is from the swinger, in duck lengths, if it's in reach
    if (hang && (inSide !== side || Math.abs(z - z0) > 48)) return null;
    const dx = (x - p0.x) / rx,
      dy = (y - p0.y) / ry,
      d = Math.hypot(dx, dy);
    if (d > far) return null;
    const along = dx * ux + dy * uy;
    return d < 0.7 || along / d >= wide ? { d, dx, dy } : null; // (one standing right on top is hit whatever the aim)
  };
  let hits = [];
  for (const id of s.seat) {
    const p = s.pos[id],
      P = s.players[id];
    if (id === by || !p || p.x < 0 || !P || P.dead || isGhost(s, id)) continue;
    if (done.includes(id)) continue;
    if (isMgj(s) && by !== JUSTIN_ID) continue; // (Mad God Justin: the ducks are on one side)
    if (vdSafe(s, id)) continue; // (Valentine's Duck Date: nothing knocks down the two at the table)
    if (dodges(s, p, now)) continue; // (a duck in the air is missed)
    const n = near(
      p.x,
      p.y,
      +p.z || 0,
      hang ? (inCabin(p.x * HW, p.y * HH) ? 1 : 0) : 0,
    );
    if (n) hits.push({ id, ...n });
  }
  if (sp === "knife") hits = hits.sort((a, b) => a.d - b.d).slice(0, 1);
  for (const h of hits) {
    logHit(s, by, h.id, now);
    if (
      !(isMgj(s) ? mgjSoak(s, h.id, now) : soaks(s, h.id, now, dmgOf(s, sp)))
    ) {
      s.players[h.id].dead = true;
      holdDown(s, h.id, now);
      playerKilled(s, by, h.id, sp);
    } // (the HP: a hit it can take keeps the duck up, still shoved back by a hammer)
    if (sp === "hammer") {
      // shoved straight back from the swinger
      const k = h.d > 0.05 ? 1 / h.d : 0;
      shove(
        s,
        h.id,
        h.d > 0.05 ? h.dx * k : ux,
        h.d > 0.05 ? h.dy * k : uy,
        KB_FAR,
        now,
        side,
      );
    }
  }
  let stab = false;
  if (!hang && by !== JUSTIN_ID && !done.includes(JUSTIN_ID) && isMgj(s))
    stab = mgjHitAt(
      s,
      by,
      now,
      (b) =>
        !!near(
          p0.x + (b.x - p0.x) / MGJ_SCALE,
          p0.y + (b.y - p0.y) / MGJ_SCALE,
          0,
          0,
        ), // (he's bigger: a swing reaches him from MGJ_SCALE times as far)
      logLine,
      DMG[sp] || 1,
    );
  // (Mad God Justin: 1 damage; a hit on his double counts for nothing)
  else if (
    !hang &&
    by !== JUSTIN_ID &&
    !done.includes(JUSTIN_ID) &&
    justinShown(s) &&
    !s.justin.down
  ) {
    // (the Justin option: he can be hit back; the board's Mad God Justin takes HP off first)
    const n = justinAt(s.justin, now),
      got = near(n.x, n.y, 0, 0) ? justinHit(s, by, now, logLine, sp) : 0;
    if (got === 2) justinKilled(s, by, sp);
    stab = got > 0;
  }
  if (hang)
    for (const n of hangTargets(s, now, sp)) {
      if (done.includes("h:" + n.id)) continue;
      if (
        near(n.x / HW, n.y / HH, n.z, inCabin(n.x, n.y) ? 1 : 0) &&
        hangHit(s, n.id, by, now)
      ) {
        done.push("h:" + n.id);
        if (n.id === "justin") justinKilled(s, by, sp);
      }
    }
  return [...hits.map((h) => h.id), ...(stab ? [JUSTIN_ID] : [])];
}
/* the knife and the hammer hit whatever they touch while they swing, not only what's there at the press: I want a duck
   that walks into a jab, or a hammer coming down, hit too. The attack lasts as long as its animation (game.js: the
   knife's jab, the hammer's swing down and its rest), and every move and every heartbeat checks it again. The knife
   hits once; the hammer everything it touches, each once.
   s.atk = [{ by, sp, ax, ay, t, until, hit: [who it hit] }] */
const ATK_MS = { knife: 250, hammer: 500 };
export function strike(s, by, sp, aim, now, from = s.pos[by]) {
  const hit = swing(s, by, sp, aim, now, from);
  s.atk = [
    ...(s.atk || []).filter((a) => a.until > now && a.by !== by),
    {
      by,
      sp,
      ax: aim[0],
      ay: aim[1],
      t: now,
      until: now + ATK_MS[sp],
      hit: [...hit],
    },
  ];
  return hit;
}
function attacks(s, now) {
  if (!s.atk || !s.atk.length) return false;
  const keep = [];
  let ch = false;
  for (const a of s.atk) {
    if (now > a.until || (a.sp === "knife" && a.hit.length)) {
      ch = true;
      continue;
    }
    const J = a.by === JUSTIN_ID,
      from = J
        ? (isMgj(s) ? !mgjGone(s, now) : justinShown(s) && !s.justin.down) &&
          justinAt(s.justin, now)
        : !(s.players[a.by] || {}).dead && s.pos[a.by];
    if (!from || from.x < 0) {
      ch = true;
      continue;
    } // (the swinger is down, or gone)
    const before = a.hit.length,
      hit = swing(s, a.by, a.sp, [a.ax, a.ay], now, from, a.hit);
    if (hit.length) {
      a.hit.push(...hit);
      if (J) for (const id of hit) mgjHurt(s, id);
      s.fxN = (s.fxN || 0) + 1;
      s.fx = [
        ...(s.fx || []).slice(-19),
        { n: s.fxN, kind: "hit", what: a.sp, by: a.by, who: [], t: now, hit },
      ];
    }
    if (hit.length || a.hit.length !== before) ch = true;
    keep.push(a);
  }
  s.atk = keep.length ? keep : null;
  return ch;
}
/* where a bullet or a dagger is, t ms after it was fired: on the board (x, y) and, for the dagger, its height z */
export const shotAt = (sh, t) => ({
  x: sh.x0 + (sh.vx * t) / 1000,
  y: sh.y0 + (sh.vy * t) / 1000,
  z:
    sh.k === "dagger"
      ? daggerZ(t / 1000)
      : sh.k === "grenade"
        ? grenadeZ(t / 1000)
        : 0.41,
});
/* a grenade going off at (x, y): every duck within GRENADE_R plays dead and is thrown away from it, three times as far as
   the hammer throws one; Justin is knocked down (Mad God Justin: 1 damage), Duck Cabin's Justin and cats are hit. In
   Hangout only on its side of the cabin's walls and at about its height. Every screen draws the blast (the boom fx) */
function blast(s, sh, x, y, now) {
  const hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : [0.03, 0.08],
    side = sh.hin || 0,
    hit = [];
  const near = (px, py, pz, inSide) => {
    if (hang && (inSide !== side || Math.abs(pz - (sh.hz || 0)) > 48))
      return null;
    const dx = (px - x) / rx,
      dy = (py - y) / ry,
      d = Math.hypot(dx, dy);
    return d <= GRENADE_R ? { d, dx, dy } : null;
  };
  for (const id of s.seat) {
    const p = s.pos[id],
      P = s.players[id];
    if (!p || p.x < 0 || !P || isGhost(s, id)) continue;
    if (isMgj(s) && sh.by !== JUSTIN_ID) continue; // (Mad God Justin: the ducks are on one side)
    if (vdSafe(s, id)) continue; // (Valentine's Duck Date: the two at the table)
    const n = near(
      p.x,
      p.y,
      +p.z || 0,
      hang ? (inCabin(p.x * HW, p.y * HH) ? 1 : 0) : 0,
    );
    if (!n) continue;
    if (!P.dead) logHit(s, sh.by, id, now);
    if (P.dead || !soaks(s, id, now, dmgOf(s, "grenade"))) {
      if (!P.dead) playerKilled(s, sh.by, id, "grenade");
      P.dead = true;
      holdDown(s, id, now);
    } // (the normal game's HP: one hit's worth, and it still flies)
    const a = n.d > 0.05 ? null : Math.random() * Math.PI * 2;
    shove(
      s,
      id,
      a === null ? n.dx / n.d : Math.cos(a),
      a === null ? n.dy / n.d : Math.sin(a),
      KB_FAR * (isMgj(s) || isL4dd(s) ? 3 : 2), // (twice the hammer's in the normal game, owner 2026-11-03 17:15Z)
      now,
      side,
      { ms: 650, h: 0.9, l: 0 },
    );
    hit.push(id);
  }
  if (!hang && sh.by !== JUSTIN_ID && justinShown(s)) {
    const j = justinAt(s.justin, now);
    if (j && near(j.x, j.y, 0, 0)) {
      const got = isMgj(s)
        ? mgjStab(s, sh.by, now, logLine)
        : justinHit(s, sh.by, now, logLine, "grenade");
      if (got) {
        if (got === 2) justinKilled(s, sh.by, "grenade");
        hit.push(JUSTIN_ID);
      }
    }
  }
  if (hang)
    for (const n of hangTargets(s, now, "grenade"))
      if (
        near(n.x / HW, n.y / HH, n.z, inCabin(n.x, n.y) ? 1 : 0) &&
        hangHit(s, n.id, sh.by, now) &&
        n.id === "justin"
      )
        justinKilled(s, sh.by, "grenade");
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    {
      n: s.fxN,
      kind: "boom",
      by: sh.by,
      who: [],
      t: now,
      x: +x.toFixed(4),
      y: +y.toFixed(4),
      hit,
      ...(hang ? { hz: sh.hz || 0 } : {}),
    },
  ];
}
/* the handgun's bullets and the thrown daggers: a duck on the ground that one passes through plays dead (until it
   moves); a bullet flies on to the screen's edge, a dagger until it has fallen away. In Hangout one flies at the height
   it was fired from and hits only ducks standing about that high, on its side of the cabin's walls, and the walls stop
   it */
function moveShots(s, now) {
  if (!s.shots || !s.shots.length) return false;
  const keep = [];
  for (const sh of s.shots) {
    if (!sh.k) continue; // (one fired before aiming: gone)
    if (sh.k === "grenade") {
      // it hits nothing on its way; it goes off where it lands (Hangout: or where a wall stops it)
      const at = shotAt(sh, Math.min(now - sh.t, GRENADE_MS)),
        walled =
          sh.hin !== undefined &&
          (inCabin(at.x * HW, at.y * HH) ? 1 : 0) !== sh.hin;
      if (walled || now - sh.t >= GRENADE_MS) {
        if (boardPhases(s).includes(s.phase))
          blast(s, sh, walled ? sh.lx : at.x, walled ? sh.ly : at.y, now);
        continue;
      }
      sh.lx = at.x;
      sh.ly = at.y;
      keep.push(sh);
      continue;
    }
    const at = shotAt(sh, now - sh.t),
      x0 = sh.lx,
      y0 = sh.ly,
      dx = at.x - x0,
      dy = at.y - y0;
    const walled =
      sh.hin !== undefined &&
      (inCabin(at.x * HW, at.y * HH) ? 1 : 0) !== sh.hin; // (Hangout: it hit the cabin's wall)
    if (at.z > -0.15 && at.z < 1.05)
      for (const id of s.seat) {
        // (a dagger over a duck's head, or already fallen, hits nobody)
        const p = s.pos[id],
          P = s.players[id];
        if (id === sh.by || !p || p.x < 0 || !P || P.dead || isGhost(s, id))
          continue;
        if (
          sh.hin !== undefined &&
          ((inCabin(p.x * HW, p.y * HH) ? 1 : 0) !== sh.hin ||
            Math.abs((+p.z || 0) - sh.hz) > 48)
        )
          continue; // (the other side of the walls, or above or below it)
        if (dodges(s, p, now)) continue; // jumped over it
        if (isMgj(s) && sh.by !== JUSTIN_ID) continue; // (Mad God Justin: the ducks are on one side)
        if (vdSafe(s, id)) continue; // (Valentine's Duck Date: the two at the table)
        /* the nearest the shot came to the duck this beat, measured in a duck's room (.03 across, .08 deep; Hangout's world is far bigger than a board) */
        const rx = isHang(s) ? 0.006 : 0.03,
          ry = isHang(s) ? 0.012 : 0.08;
        const ux = dx / rx,
          uy = dy / ry,
          px = (p.x - x0) / rx,
          py = (p.y - y0) / ry,
          len = ux * ux + uy * uy;
        const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
        const ox = px - k * ux,
          oy = py - k * uy,
          od = Math.hypot(ox, oy);
        if (od < (sh.r || 1)) {
          if (sh.got && sh.got.includes(id)) continue; // (it already took HP from this duck)
          if (sh.fake) continue; // (Mad God Justin: his double's, or his own while the double is the real one: no harm)
          const safe = isMgj(s) && mgjSafe(s, id, now);
          logHit(s, sh.by, id, now);
          if (
            isMgj(s)
              ? mgjSoak(s, id, now, sh.k === "chair" ? 2 : 1)
              : soaks(s, id, now, dmgOf(s, sh.k))
          )
            sh.got = [...(sh.got || []), id];
          else {
            P.dead = true;
            holdDown(s, id, now);
            playerKilled(s, sh.by, id, sh.k);
          } // (the HP: a hit it can take keeps the duck up)
          if (sh.by === JUSTIN_ID) mgjHurt(s, id);
          if (sh.k === "fireball" && !safe) mgjBurn(s, id, now); // (it sets the duck burning)
          if (sh.k === "chair") {
            const ul = Math.sqrt(len) || 1;
            if (od > 0.2)
              shove(s, id, ox / od, oy / od, KB_FAR, now, sh.hin || 0);
            else shove(s, id, ux / ul, uy / ul, KB_FAR, now, sh.hin || 0);
          } // (Mad God Justin's office chair, or the Chair special's: shoved back, as the hammer does, away from it)
        }
      }
    if (isMgj(s) && mgjShot(s, sh, x0, y0, dx, dy, now, logLine)) continue; // (Mad God Justin: a duck's shot hit him, or his hit Good Justin or a Jaime)
    if (
      sh.hin === undefined &&
      sh.by !== JUSTIN_ID &&
      !isMgj(s) &&
      at.z > -0.15 &&
      at.z < 1.05 &&
      justinShown(s) &&
      !s.justin.down &&
      !(sh.got && sh.got.includes(JUSTIN_ID))
    ) {
      // (the Justin option: he can be shot back, once by each shot)
      const n = justinAt(s.justin, now),
        ux = dx / 0.03,
        uy = dy / 0.08,
        px = (n.x - x0) / 0.03,
        py = (n.y - y0) / 0.08,
        len = ux * ux + uy * uy;
      const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
      const got =
        Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1)
          ? justinHit(s, sh.by, now, logLine, sh.k)
          : 0;
      if (got) sh.got = [...(sh.got || []), JUSTIN_ID];
      if (got === 2) justinKilled(s, sh.by, sh.k);
    }
    if (sh.hin !== undefined && at.z > -0.15 && at.z < 1.05)
      for (const n of hangTargets(s, now, sh.k)) {
        // (Hangout: Justin can be knocked down too, and a chair whooshes the shadow duck away)
        if (
          (inCabin(n.x, n.y) ? 1 : 0) !== sh.hin ||
          Math.abs(n.z - sh.hz) > 48
        )
          continue;
        const ux = dx / 0.006,
          uy = dy / 0.012,
          px = (n.x / HW - x0) / 0.006,
          py = (n.y / HH - y0) / 0.012,
          len = ux * ux + uy * uy;
        const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
        if (
          Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1) &&
          hangHit(s, n.id, sh.by, now) &&
          n.id === "justin"
        )
          justinKilled(s, sh.by, sh.k);
      }
    sh.lx = at.x;
    sh.ly = at.y;
    const on =
      !walled &&
      at.x > -0.3 &&
      at.x < 1.3 &&
      at.y > -0.6 &&
      at.y < 1.6 &&
      now - sh.t < (sh.k === "dagger" ? DAGGER_LIFE : sh.life || 12000); // (a shotgun's pellet: its own short life)
    if (on && boardPhases(s).includes(s.phase)) keep.push(sh); // (on past the board to the screen's edge)
  }
  s.shots = keep;
  return true;
}

/* ---------- the Zebra cake special ----------
   One in the room at a time: s.zcake = { n, by, x0, y0, vx, vy, t, stop, eat, hin }. It flies the way it was thrown, as
   Mad God Justin's does, and lands at the board's edge or after 6 s (Hangout: at the cabin's walls or the world's edge
   too; hin, the side it's on). Justin runs after it wherever he is and eats it, and does nothing else meanwhile
   (boardjustin.js, hangout/justin.js: eat, when he started); with no Justin to eat it, it's gone 12 s after it lands */
const CAKE_LEFT = 12000;
function throwCake(s, by, p, aim, now) {
  const vx = aim[0] * CAKE_SPEED,
    vy = aim[1] * CAKE_SPEED;
  let stop = 6;
  if (isHang(s)) {
    const side = inCabin(p.x * HW, p.y * HH) ? 1 : 0;
    for (let t = 0.05; t <= 6; t += 0.05) {
      const x = p.x + vx * t,
        y = p.y + vy * t;
      if (
        x < 0.005 ||
        x > 0.995 ||
        y < 0.005 ||
        y > 0.995 ||
        (inCabin(x * HW, y * HH) ? 1 : 0) !== side
      ) {
        stop = t - 0.05;
        break;
      }
    }
  } else {
    const tx =
        vx > 0 ? (0.97 - p.x) / vx : vx < 0 ? (0.03 - p.x) / vx : Infinity,
      ty = vy > 0 ? (0.96 - p.y) / vy : vy < 0 ? (0.04 - p.y) / vy : Infinity;
    stop = Math.min(tx, ty, 6);
  }
  s.zcake = {
    n: s.fxN,
    by,
    x0: p.x,
    y0: p.y,
    vx: +vx.toFixed(4),
    vy: +vy.toFixed(4),
    t: now,
    stop: now + Math.max(0, stop) * 1000,
    eat: 0,
    ...(isHang(s) ? { hin: inCabin(p.x * HW, p.y * HH) ? 1 : 0 } : {}),
  };
}
/* a cake nobody ate (no Justin, or he's down), or one out of its stage: gone */
function cakeGone(s, now) {
  const c = s.zcake;
  if (!c) return false;
  if (
    !boardPhases(s).includes(s.phase) ||
    isMgj(s) ||
    (c.eat ? now > c.eat + CAKE_EAT_MS + 3000 : now > c.stop + CAKE_LEFT)
  ) {
    s.zcake = null;
    return true;
  }
  return false;
}

/* ---------- the Jaime special (Mad God Justin's Jaime, for every mode with the specials' hotbar) ----------
   Released, Jaime goes for one player: the one I hit in the last JAIME_FEUD ms, or else the one who hit me in that time,
   or else the nearest (the owner's). He sprints at them as he does at Mad God Justin (JAIME_RUN), stops a little
   apart (so the two don't stand in each other) and stabs once a second
   (a hit as any other: the HP, and a jump dodges it), and once they're down, gone, or after JAIME_LIFE, he's gone in a
   poof. In Hangout he keeps to his side of the cabin's walls and goes up only what a duck walks up.
   s.jm = { [id]: { n, by, t (who he's after), x, y, z, face, at, stabAt, mt } }: his own place, not in s.pos (he isn't
   a player, so he never counts in a vote). s.hitLog = the latest hits between players, [{ by, id, t }] */
const JAIME_FEUD = 15000,
  JAIME_LIFE = 12000,
  JAIME_RUN = 9; // (duck lengths a second, as Mad God Justin's)
function logHit(s, by, id, now) {
  if (isMgj(s) || !s.players[by] || !s.players[id] || by === id) return;
  s.hitLog = [
    ...(s.hitLog || []).filter((h) => now - h.t < JAIME_FEUD).slice(-15),
    { by, id, t: now },
  ];
}
/* who a Jaime sent by `by` goes for (or null) */
function jaimeTarget(s, by, now) {
  const hang = isHang(s),
    p0 = s.pos[by],
    side = (p) => (hang && inCabin(p.x * HW, p.y * HH) ? 1 : 0);
  const ok = (id) => {
    const P = s.players[id],
      p = s.pos[id];
    return (
      id !== by &&
      !!P &&
      !P.dead &&
      !!p &&
      p.x >= 0 &&
      !isGhost(s, id) &&
      !vdSafe(s, id)
    );
  };
  const feud = (s.hitLog || []).filter((h) => now - h.t < JAIME_FEUD).reverse();
  const mine = feud.find((h) => h.by === by && ok(h.id));
  if (mine) return mine.id; // (the one I hit)
  const theirs = feud.find((h) => h.id === by && ok(h.by));
  if (theirs) return theirs.by; // (the one who hit me)
  const [rx, ry] = hang ? [0.006, 0.012] : [0.03, 0.08];
  return (
    s.seat
      .filter((id) => ok(id) && side(s.pos[id]) === side(p0))
      .map((id) => [
        id,
        Math.hypot((s.pos[id].x - p0.x) / rx, (s.pos[id].y - p0.y) / ry),
      ])
      .sort((a, b) => a[1] - b[1])[0]?.[0] || null
  ); // (the nearest, on my side of the walls)
}
/* a Jaime comes in beside the duck that sent him: false when there's nobody for him to go for */
function jaimeOut(s, by, now) {
  const p = s.pos[by],
    t = p && jaimeTarget(s, by, now);
  if (!t) return false;
  s.jmN = (s.jmN || 0) + 1;
  const id = `jaime${s.jmN}`;
  s.jm = {
    ...(s.jm || {}),
    [id]: {
      n: s.jmN,
      by,
      t,
      x: p.x,
      y: p.y,
      ...(isHang(s) ? { z: +p.z || 0 } : {}),
      face: p.face || 1,
      at: now,
      stabAt: now + 600,
      mt: now,
    },
  };
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    { n: s.fxN, kind: "jaime", by, who: [id], t: now },
  ];
  return true;
}
/* every beat: each Jaime runs at his target and stabs; true when anything changed */
function jaimeRun(s, now) {
  if (!s.jm) return false;
  const fx = (o) => {
    s.fxN = (s.fxN || 0) + 1;
    s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, t: now, ...o }];
  };
  if (isL4dd(s)) return false; // (Quacky Zombies' Jaime goes for the zombies: l4ddrules.js runs him)
  if (!boardPhases(s).includes(s.phase) || isMgj(s)) {
    s.jm = null;
    return true;
  }
  const hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : [0.03, 0.08],
    next = {};
  let ch = false;
  for (const [id, J0] of Object.entries(s.jm)) {
    const J = { ...J0 },
      P = s.players[J.t],
      q = s.pos[J.t];
    if (
      !P ||
      P.dead ||
      !q ||
      q.x < 0 ||
      isGhost(s, J.t) ||
      !s.players[J.by] ||
      now - J.at > JAIME_LIFE
    ) {
      fx({ kind: "poof", x: J.x, y: J.y, who: [id] });
      ch = true;
      continue;
    } // (his target is down or gone, or his time is up: gone in a poof)
    const dt = Math.min(0.5, Math.max(0, (now - J.mt) / 1000)),
      dx = (q.x - J.x) / rx,
      dy = (q.y - J.y) / ry,
      d = Math.hypot(dx, dy);
    J.mt = now;
    if (d > 1.8) {
      const step = Math.min(d - 1.7, JAIME_RUN * dt),
        to = (ux, uy) => ({
          x: Math.max(0, Math.min(1, J.x + ux * step * rx)),
          y: Math.max(0, Math.min(1, J.y + uy * step * ry)),
        });
      let at = to(dx / d, dy / d);
      if (hang) {
        const side = inCabin(J.x * HW, J.y * HH) ? 1 : 0,
          fits = (c) =>
            standable(c.x * HW, c.y * HH, J.z || 0, undefined, [
              J.x * HW,
              J.y * HH,
            ]) && (inCabin(c.x * HW, c.y * HH) ? 1 : 0) === side;
        at = [at, to(Math.sign(dx), 0), to(0, Math.sign(dy))].find(fits); // (a wall in the way: along it, or he waits)
        if (at) at.z = heightAt(at.x * HW, at.y * HH);
      }
      if (at) {
        J.x = +at.x.toFixed(4);
        J.y = +at.y.toFixed(4);
        if (at.z !== undefined) J.z = Math.round(at.z);
      }
      J.face = dx < 0 ? -1 : 1;
      ch = true;
    }
    if (d <= 2.2 && now >= J.stabAt) {
      J.stabAt = now + 1000;
      const aim = d > 1e-3 ? [dx / d, dy / d] : [J.face, 0],
        high = hang && Math.abs((+q.z || 0) - (J.z || 0)) > 48,
        hit = !high && !dodges(s, q, now) && !vdSafe(s, J.t);
      if (hit) {
        logHit(s, J.by, J.t, now);
        if (!soaks(s, J.t, now)) {
          P.dead = true;
          holdDown(s, J.t, now);
          playerKilled(s, J.by, J.t, "jaime");
        }
      }
      fx({
        kind: "use",
        what: "knife",
        by: id,
        who: [id],
        face: aim[0] < 0 ? -1 : 1,
        ax: +(aim[0] * rx).toFixed(4),
        ay: +(aim[1] * ry).toFixed(4),
        ...(hit ? { hit: [J.t] } : {}),
      });
      ch = true;
    }
    next[id] = J;
  }
  s.jm = Object.keys(next).length ? next : null;
  return ch;
}

/* a vote passes once enough say yes, and fails once it can't pass any more */
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
  if (rolling(s)) return rotate(s, now); // (Random: a skipped round ends like any other, into the next game)
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
/* the room goes back to the lobby: a fresh game next time, and the voted-out may come back */
export function backToLobby(s, why) {
  helperOut(s); // (the fireplace's Justin stays with his game)
  delete s.waiting;
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
  s.bb = null;
  s.bbPast = [];
  s.sc = null;
  s.law = null;
  s.dn = null;
  s.vd = null;
  s.mgj = null;
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

/* ---------- Bicker Brackets ----------
   A round is one tournament: everyone writes a topic (24 letters at most) and votes for one, or the room gets a random
   topic → the seeds: each player has a few to write and types one a turn, everyone seeing everyone's words as they type
   → the seeds are drawn into a bracket at random (byes fill it up to 4, 8, 16 …) and the bracket shows → match by match,
   each duck walks onto the seed it backs and votes, then the room talks it over (the winner goes on the cloud; a tie is
   a coin flip) → after each bracket round, the bracket again → the final (both seeds silver), the champion (gold), the
   bracket one last time → the podium for ten seconds → the stats, until the room moves on to the next tournament. */
export const PODIUM = 10; // seconds
export const BB_TOPICS = [
  "Best snack",
  "Worst habit",
  "Greatest movie villain",
  "Most overrated thing",
  "Best superpower",
  "Worst chore",
  "Best pizza topping",
  "Most annoying sound",
];
export const TOPIC_MAX = 24,
  SEED_MAX = 32;
const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};
const oneLine = (v, n) =>
  String(v || "")
    .replace(/\s+/g, " ")
    .slice(0, n);
const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];

function startTourney(s, now) {
  seatLate(s);
  s.bb = {
    topic: "",
    topicBy: null,
    topics: [],
    tvotes: {},
    seeds: [],
    per: {},
    turn: 0,
    turns: 0,
    rounds: [],
    r: 0,
    m: -1,
    champ: null,
  };
  s.subs = [];
  s.drafts = {};
  s.qi = 0;
  s.pos = {};
  s.lock = {};
  if (s.options.bbTopic === "random") {
    s.bb.topic = anyOf(BB_TOPICS);
    say(s, `The topic: ${s.bb.topic}.`);
    return startSeeds(s, now);
  }
  return enter(s, "topic", now);
}
/* the topics are in: none → a random one; one → that one; more → a vote */
function endTopics(s, now) {
  for (const id of s.seat) {
    const d = (s.drafts || {})[id];
    if (!s.done[id] && d && d.text.trim())
      s.subs.push({ by: id, text: d.text.trim() });
  }
  const tops = (s.subs || []).filter((t) => s.players[t.by]);
  s.subs = [];
  s.drafts = {};
  if (tops.length > 1) {
    s.bb.topics = shuffle(tops);
    s.bb.tvotes = {};
    return enter(s, "tvote", now);
  }
  if (tops.length) {
    s.bb.topic = tops[0].text;
    s.bb.topicBy = tops[0].by;
    say(s, `The topic: ${s.bb.topic}.`);
  } else {
    s.bb.topic = anyOf(BB_TOPICS);
    say(s, `No topics written, so a random one: ${s.bb.topic}.`);
  }
  return startSeeds(s, now);
}
function pickTopic(s, now) {
  const b = s.bb,
    n = b.topics.map(() => 0);
  for (const [id, i] of Object.entries(b.tvotes || {}))
    if (s.players[id] && n[i] !== undefined) n[i]++;
  const top = Math.max(...n),
    best = n.map((k, i) => (k === top ? i : -1)).filter((i) => i >= 0),
    t = b.topics[anyOf(best)];
  b.topic = t.text;
  b.topicBy = t.by;
  b.topicVotes = n;
  say(
    s,
    best.length > 1
      ? `A tie! A coin flip picked the topic: ${t.text}.`
      : `The topic: ${t.text}.`,
  );
  return startSeeds(s, now);
}
/* how many seeds each player writes: a total shared out (the extra ones to random players), or so many each */
function startSeeds(s, now) {
  const ids = playing(s),
    plan = String(s.options.bbSeeds || "t8"),
    k = Math.max(1, Math.min(64, +plan.slice(1) || 8)),
    per = {};
  if (plan[0] === "p")
    ids.forEach((id) => {
      per[id] = Math.min(k, 8);
    });
  else
    shuffle([...ids]).forEach((id, i) => {
      per[id] = Math.floor(k / ids.length) + (i < k % ids.length ? 1 : 0);
    });
  s.bb.per = per;
  s.bb.turns = Math.max(0, ...Object.values(per));
  s.bb.turn = 0;
  return s.bb.turns ? seedTurn(s, now) : buildBracket(s, now);
}
function seedTurn(s, now) {
  s.qi++;
  s.subs = [];
  s.drafts = {};
  enter(s, "seeds", now);
  for (const id of s.seat)
    if (!((s.bb.per[id] || 0) > s.bb.turn)) s.done[id] = true; // nothing left to write this turn
  return s;
}
/* a typing turn ends: what each player sent (or had typed) becomes a seed */
function endSeedTurn(s, now) {
  const b = s.bb;
  for (const id of s.seat) {
    if ((b.per[id] || 0) <= b.turn) continue;
    const sub = (s.subs || []).find((x) => x.by === id),
      d = (s.drafts || {})[id];
    const text = (sub ? sub.text : !s.done[id] && d ? d.text : "").trim();
    if (text) b.seeds.push({ by: id, text });
  }
  s.subs = [];
  s.drafts = {};
  return ++b.turn < b.turns ? seedTurn(s, now) : buildBracket(s, now);
}
/* the draw: the seeds in a random order, two to a match; byes (a seed with no one to face goes straight through) are
   spread out so the bracket fills to a power of two */
function buildBracket(s, now) {
  const b = s.bb,
    n = b.seeds.length;
  if (n < 2) {
    if (!playing(s).length) return s; // nobody left to play (a new tournament would loop forever)
    say(
      s,
      `${n ? "Only one contender" : "No contenders"}: not enough for a bracket. A new tournament!`,
    );
    s.round++;
    return startTourney(s, now);
  }
  const order = shuffle(b.seeds.map((_, i) => i)),
    M = 2 ** Math.ceil(Math.log2(n)) / 2,
    byes = 2 * M - n;
  b.rounds = [];
  for (let k = M; k >= 1; k /= 2)
    b.rounds.push(Array.from({ length: k }, () => ({ a: null, b: null })));
  let q = 0;
  b.rounds[0].forEach((m, i) => {
    m.a = order[q++];
    if (Math.floor(((i + 1) * byes) / M) > Math.floor((i * byes) / M)) {
      m.b = -1;
      m.w = m.a;
    } else m.b = order[q++];
  });
  b.rounds[0].forEach((m, i) => {
    if (m.w != null) feed(b, 0, i);
  });
  b.r = 0;
  b.m = -1;
  b.champ = null;
  return enterBracket(s, now);
}
const feed = (b, r, i) => {
  const nx = b.rounds[r + 1];
  if (nx) nx[i >> 1][i % 2 ? "b" : "a"] = b.rounds[r][i].w;
}; // the winner moves on
function enterBracket(s, now) {
  // ducks stand on the bracket (x, y across it), lined up by the round that's up next
  seatLate(s);
  const b = s.bb,
    col = b.champ != null ? b.rounds.length : b.r,
    x = Math.min(0.97, (col + 0.45) / (b.rounds.length + 1));
  s.seat.forEach((id, k) => {
    s.pos[id] = { x, y: (k + 1) / (s.seat.length + 1) };
  });
  s.lock = {};
  return enter(s, "bracket", now);
}
/* the next match of this bracket round; with none left, the bracket shows (or the champion is crowned) */
function nextMatch(s, now) {
  const b = s.bb,
    round = b.rounds[b.r],
    i = round.findIndex((m) => m.w == null);
  if (i < 0) {
    b.m = -1;
    if (b.r === b.rounds.length - 1) {
      b.champ = round[0].w;
      say(s, `"${b.seeds[b.champ].text}" is the champion!`);
    } else b.r++;
    return b.champ == null && !+s.options.bbReview
      ? nextMatch(s, now)
      : enterBracket(s, now); // (the bracket between rounds is the Review option; the champion's always shows)
  }
  b.m = i;
  s.qi++;
  s.lordTime = s.options.answerOff ? 0 : +s.options.bbTimer || 0;
  delete b.tie;
  s.pos = {};
  s.lock = {};
  seatLate(s);
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: 0.5, y: (k + 1) / (s.seat.length + 1) };
  }); // everyone starts between the two seeds
  return enter(s, "answer", now);
}
/* the votes are in: the side with more ducks wins and moves on; a tie goes to the room (vote again or a coin toss).
   Returns false on a tie. */
function endMatch(s, now) {
  const b = s.bb,
    m = b.rounds[b.r][b.m],
    who = {};
  for (const id of playing(s)) {
    const p = s.pos[id],
      c = p && p.x >= 0 ? colAt(s, p.x) : -1;
    if (c >= 0) who[id] = c;
  }
  const va = Object.values(who).filter((c) => c === 0).length,
    vb = Object.values(who).length - va;
  s.lock = { ...who }; // each duck stays on the side it chose while the room talks it over (or settles the tie)
  if (va === vb) {
    b.tie = { va, vb, who, votes: {} };
    say(s, `Tied ${va}–${vb}! Vote again, or toss a coin?`);
    return false;
  }
  decide(s, va > vb ? 0 : 1, va, vb, who, false);
  return true;
}
function decide(s, side, va, vb, who, coin) {
  const b = s.bb,
    m = b.rounds[b.r][b.m];
  Object.assign(
    m,
    { w: side ? m.b : m.a, va, vb, who },
    coin ? { coin: true } : {},
  );
  feed(b, b.r, b.m);
  const w = b.seeds[m.w],
    out = b.seeds[side ? m.a : m.b];
  if (out) lostRound(s, [out.by], "bb"); // (the knocked-out contender's writer)
  say(
    s,
    coin
      ? `The coin sends "${w.text}" through.`
      : `"${w.text}" wins ${Math.max(va, vb)}–${Math.min(va, vb)}.`,
  );
}
/* the tie is settled: more for "vote again" runs the match again; else (or a tie again) the coin decides */
function settleTie(s, now) {
  const b = s.bb,
    t = b.tie,
    n = { again: 0, coin: 0 };
  for (const [id, v] of Object.entries(t.votes || {}))
    if (s.players[id]) n[v]++;
  if (n.again > n.coin) {
    say(s, "Voting again.");
    delete b.tie;
    s.qi++;
    s.pos = {};
    s.lock = {};
    s.lordTime = s.options.answerOff ? 0 : +s.options.bbTimer || 0;
    seatLate(s);
    s.seat.forEach((id, k) => {
      s.pos[id] = { x: 0.5, y: (k + 1) / (s.seat.length + 1) };
    });
    return enter(s, "answer", now);
  }
  decide(s, Math.random() < 0.5 ? 0 : 1, t.va, t.vb, t.who, true);
  delete b.tie;
  return discussOn(s) ? enter(s, "discuss", now) : nextMatch(s, now);
}
/* a topic or a seed: sent (send) or typed so far (a draft, which everyone sees as it's typed) */
function bbWrite(s, a, now, send) {
  const me = s.players[a.id],
    seeds = s.phase === "seeds";
  if (
    !me ||
    me.late ||
    s.done[a.id] ||
    !(s.phase === "topic" || (seeds && (s.bb.per[a.id] || 0) > s.bb.turn))
  )
    return send ? s : null;
  const text = oneLine(a.text, seeds ? SEED_MAX : TOPIC_MAX);
  if (!send) {
    s.drafts = { ...(s.drafts || {}), [a.id]: { text } };
    return s;
  }
  s.subs = (s.subs || []).filter((x) => x.by !== a.id);
  if (text.trim()) s.subs.push({ by: a.id, text: text.trim() });
  s.done[a.id] = true;
  return advance(s, now);
}
/* the match a bracket is on, its two seeds, and what a seed's writer is called (hidden in a blind bracket until the
   seed is knocked out or wins it all) */
export const bbMatch = (s) =>
  s.bb && s.bb.m >= 0 ? s.bb.rounds[s.bb.r][s.bb.m] : null;
export const roundName = (b, r) => {
  const left = b.rounds.length - r;
  return left === 1
    ? "The final"
    : left === 2
      ? "Semifinals"
      : left === 3
        ? "Quarterfinals"
        : `Round of ${b.rounds[r].length * 2}`;
};
export function seedOut(b, i) {
  // knocked out: lost a match
  for (const round of b.rounds)
    for (const m of round)
      if (m.w != null && m.b !== -1 && (m.a === i || m.b === i) && m.w !== i)
        return true;
  return false;
}
export const writerShown = (s, b, i) =>
  !s.options.bbBlind || b.champ === i || seedOut(b, i) || s.phase === "results";
/* the podium: 1st the champion's writer, 2nd the runner-up's, 3rd both semifinal losers' */
export function podium(b) {
  if (b.champ == null) return null;
  const loser = (m) =>
      m && m.w != null && m.b !== -1 ? (m.w === m.a ? m.b : m.a) : null,
    R = b.rounds.length;
  const fin = b.rounds[R - 1][0],
    semis = R > 1 ? b.rounds[R - 2].map(loser).filter((x) => x != null) : [];
  return { first: b.champ, second: loser(fin), third: semis };
}
/* the numbers behind the stats, over a list of finished tournaments */
export function bbStats(list) {
  const per = {},
    P = (id) =>
      (per[id] = per[id] || {
        wins: 0,
        losses: 0,
        own: 0,
        votes: 0,
        king: 0,
        titles: 0,
      });
  for (const t of list) {
    if (t.champ != null && t.seeds[t.champ]) P(t.seeds[t.champ].by).titles++;
    for (const round of t.rounds || [])
      for (const m of round) {
        if (m.w == null || m.a == null || m.b == null || m.b === -1) continue; // (a bye isn't a win)
        const W = t.seeds[m.w],
          L = t.seeds[m.w === m.a ? m.b : m.a],
          wSide = m.w === m.a ? 0 : 1,
          close = Math.abs((m.va || 0) - (m.vb || 0)) === 1;
        if (W) P(W.by).wins++;
        if (L) P(L.by).losses++;
        for (const [id, c] of Object.entries(m.who || {})) {
          P(id).votes++;
          const backed = t.seeds[c ? m.b : m.a];
          if (backed && backed.by === id) P(id).own++;
          if (close && c === wSide) P(id).king++; // their vote decided a one-vote match
        }
      }
  }
  return per;
}

/* ---------- Story Chain ----------
   A round is one paragraph: everyone writes a secret word → the words are shared out so nobody gets their own, and a
   random order of writers is drawn → one at a time, each writer adds a sentence (160 letters at most) with their secret
   word in it, everyone watching it typed → everyone walks onto their favorite line and votes (not their own) → the secret
   words show below the story, each lit up in its line, and everyone votes for their favorite (not their own) → the stats,
   where everyone walks to what's next: continue the story (a new paragraph), a new story, or back to the lobby.

   The board is a column of zones, one under the other: the story's lines (and the line being typed), the word boxes, or
   the three choices. A duck's y covers the zones evenly (zone k is k/n to (k + 1)/n), so it stands on the same line on
   every screen however the lines wrap. */
export const SC_PHASES = ["words", "write", "lvote", "wvote", "results"];
export const SC_BOARD = ["write", "lvote", "wvote", "results"];
export const SC_VOTES = ["lvote", "wvote", "results"];
export const LINE_MAX = 160,
  WORD_MAX = 20;
export const SC_NEXT = [
  ["cont", "Continue the story"],
  ["new", "A new story"],
  ["lobby", "Back to the lobby"],
];
/* a secret word for a writer nobody else wrote one for */
export const SC_WORDS = [
  "pineapple",
  "kazoo",
  "sunglasses",
  "crumbs",
  "trampoline",
  "mustache",
  "volcano",
  "spaghetti",
  "penguin",
  "glitter",
  "toaster",
  "pickle",
  "unicorn",
  "noodle",
  "bathtub",
  "banana",
];
export const cleanWord = (v) =>
  (
    String(v || "")
      .trim()
      .split(/\s+/)[0] || ""
  )
    .replace(/[^\p{L}\p{N}'-]/gu, "")
    .slice(0, WORD_MAX);
/* where the word sits in a line (any capitals, inside a longer word too), or -1 */
export const wordAt = (text, word) =>
  word ? String(text).toLowerCase().indexOf(String(word).toLowerCase()) : -1;
export const scStory = (s) => s.sc && s.sc.stories[s.sc.stories.length - 1];
export const scPara = (s) => {
  const st = scStory(s);
  return st && st.paras[st.paras.length - 1];
};
export const scWriter = (s) => s.sc && s.sc.order[s.sc.turn];
/* the board's zones in a phase: "p.i" line i of paragraph p, T the line being typed, W:id the word id wrote, H the top of
   the choices, C:cont / C:new / C:lobby the choices */
export function scZones(s, phase = s.phase) {
  const st = scStory(s);
  if (!st) return [];
  if (phase === "results") return ["H", ...SC_NEXT.map((c) => "C:" + c[0])];
  const z = [];
  st.paras.forEach((p, i) => p.lines.forEach((l, j) => z.push(i + "." + j)));
  if (phase === "write") z.push("T");
  if (phase === "wvote")
    for (const l of scPara(s).lines)
      if (l.wordBy && s.players[l.wordBy] && !z.includes("W:" + l.wordBy))
        z.push("W:" + l.wordBy);
  return z;
}
export const zoneAt = (s, y, zones = scZones(s)) =>
  zones.length
    ? zones[
        Math.max(0, Math.min(zones.length - 1, Math.floor(y * zones.length)))
      ]
    : null;
/* the line a zone holds: { p, i, line } (current paragraph or not) */
export function scLineOf(s, z) {
  const m = /^(\d+)\.(\d+)$/.exec(z || ""),
    st = scStory(s);
  if (!m || !st) return null;
  const p = +m[1],
    i = +m[2],
    para = st.paras[p],
    line = para && para.lines[i];
  return line ? { p, i, line, now: p === st.paras.length - 1 } : null;
}
/* can this player vote for what's in this zone? (their own line or word: no) */
export function scCanVote(s, id, z, phase = s.phase) {
  if (phase === "lvote") {
    const l = scLineOf(s, z);
    return !!(l && l.now && l.line.by !== id);
  }
  if (phase === "wvote") return /^W:/.test(z || "") && z.slice(2) !== id;
  if (phase === "results") return /^C:/.test(z || "");
  return false;
}
/* ducks keep their zone when the zones change (a line is added, the word boxes come): from, to = the zones before and
   after; alias names where a zone went (the line being typed became a line) */
function scRezone(s, from, to, alias = {}) {
  if (!to.length) return;
  for (const p of Object.values(s.pos)) {
    const u = Math.max(0, Math.min(0.9999, p.y)) * Math.max(1, from.length),
      k = Math.floor(u),
      f = u - k,
      key = alias[from[k]] ?? from[k];
    let j = to.indexOf(key);
    if (j < 0) j = Math.min(k, to.length - 1);
    p.y = (j + f) / to.length;
  }
}
/* a round: a new paragraph of the story (fresh: a new story) */
function startStory(s, now, fresh) {
  seatLate(s);
  if (fresh || !s.sc.stories.length) s.sc.stories.push({ paras: [] });
  Object.assign(s.sc, { words: {}, order: [], turn: 0, assign: {}, next: {} });
  s.subs = [];
  s.drafts = {};
  s.qi = 0;
  s.pos = {};
  s.lock = {};
  return enter(s, "words", now);
}
/* the words are in: shared out so nobody writes with their own (a game word for anyone left over), the writers drawn in
   a random order, and the first one starts the paragraph */
function endWords(s, now) {
  const sc = s.sc;
  for (const id of s.seat) {
    const d = (s.drafts || {})[id];
    if (!sc.words[id] && d && cleanWord(d.text))
      sc.words[id] = cleanWord(d.text);
  }
  s.drafts = {};
  const order = shuffle(playing(s)),
    authors = Object.keys(sc.words).filter((id) => s.players[id]);
  if (!order.length) return s;
  let best = null;
  for (let k = 0; k < 40 && !(best && best.left === 0); k++) {
    // a few random tries; the one with the fewest game words wins
    const pool = shuffle([...authors]),
      out = {};
    let left = 0;
    for (const w of order) {
      const i = pool.findIndex((a) => a !== w);
      if (i < 0) {
        left++;
        continue;
      }
      out[w] = pool.splice(i, 1)[0];
    }
    if (!best || left < best.left) best = { out, left };
  }
  const spare = shuffle(
    SC_WORDS.filter(
      (w) => !Object.values(sc.words).some((x) => x.toLowerCase() === w),
    ),
  );
  /* Lines per player: the writers go round that many times before the paragraph ends */
  const laps = Math.max(1, Math.min(4, Math.round(+s.options.scLines) || 1));
  sc.order = Array.from({ length: laps }, () => order).flat();
  sc.turn = 0;
  sc.assign = Object.fromEntries(
    order.map((w, i) => {
      const by = best.out[w];
      return [
        w,
        by
          ? { word: sc.words[by], by }
          : { word: spare[i % spare.length] || anyOf(SC_WORDS), by: null },
      ];
    }),
  );
  scStory(s).paras.push({ round: s.round, lines: [], votes: {}, wvotes: {} });
  const n = scZones(s, "write").length;
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: (n - 0.98) / n };
  }); // everyone starts just over the line being typed, so it shows
  return writeTurn(s, now);
}
function writeTurn(s, now) {
  s.qi++;
  s.subs = [];
  s.drafts = {};
  return enter(s, "write", now);
}
/* a writer is done (sent it, ran out of time, or left): their line joins the story, and the next writer goes */
function endTurn(s, now) {
  const sc = s.sc,
    w = scWriter(s),
    para = scPara(s),
    sub = (s.subs || []).find((x) => x.by === w),
    d = (s.drafts || {})[w];
  const text = oneLine(sub ? sub.text : d ? d.text : "", LINE_MAX).trim(),
    from = scZones(s, "write");
  if (text && s.players[w]) {
    const as = sc.assign[w] || {};
    para.lines.push({
      by: w,
      text,
      word: as.word || "",
      wordBy: as.by || null,
      ms: Math.max(0, now - s.at),
    });
    scRezone(s, from, scZones(s, "write"), {
      T: scStory(s).paras.length - 1 + "." + (para.lines.length - 1),
    });
  } else if (s.players[w]) say(s, `${s.players[w].name} skipped their line.`);
  s.subs = [];
  s.drafts = {};
  if (++sc.turn < sc.order.length) return writeTurn(s, now);
  if (!para.lines.length) {
    say(s, "No lines this time.");
    scStory(s).paras.pop();
    return startNext(s, now);
  }
  if (!scVoting(s)) {
    para.noVote = true;
    return startNext(s, now);
  } // no voting: on to the stats and what comes next
  scRezone(s, scZones(s, "write"), scZones(s, "lvote")); // (a duck by the line being typed: onto the last line)
  return enter(s, "lvote", now);
}
/* is there voting on this paragraph's lines and words (the lobby's Voting option)? */
export const scVoting = (s) =>
  s.options.scVote === "auto" || s.options.scVote == null
    ? playing(s).length >= 4
    : !!+s.options.scVote;
/* the stats, with the three choices: everyone starts at the top of them */
function startNext(s, now) {
  s.sc.next = {};
  s.reviewVotes = {};
  s.review = false;
  if (+s.options.stats === 0) {
    s.round++;
    return startStory(s, now, false);
  } // (no stats screen, so no choices: the story goes on)
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: 0.125 };
  });
  return enter(s, "results", now);
}
/* a vote: stand on a line, a word or a choice and end your turn; it can't be taken back */
function scVote(s, a, now) {
  const me = s.players[a.id];
  if (
    !me ||
    me.late ||
    !SC_VOTES.includes(s.phase) ||
    s.done[a.id] ||
    !s.pos[a.id] ||
    now < s.at + VOTE_GRACE * 1000
  )
    return null;
  if (typeof a.y === "number" && isFinite(a.y))
    s.pos[a.id].y = Math.max(0, Math.min(1, +a.y)); // (where I stood when I voted)
  const z = zoneAt(s, s.pos[a.id].y);
  if (!scCanVote(s, a.id, z)) return null;
  const para = scPara(s);
  if (s.phase === "lvote") para.votes[a.id] = scLineOf(s, z).i;
  if (s.phase === "wvote") para.wvotes[a.id] = z.slice(2);
  if (s.phase === "results") s.sc.next[a.id] = z.slice(2);
  s.done[a.id] = true;
  return advance(s, now);
}
/* a secret word or a line: sent (send) or typed so far (a draft; everyone sees a line as it's typed) */
function scWrite(s, a, now, send) {
  const me = s.players[a.id];
  if (!me || me.late || s.done[a.id]) return null;
  if (s.phase === "words") {
    if (!send) {
      s.drafts = { ...(s.drafts || {}), [a.id]: { text: cleanWord(a.text) } };
      return s;
    }
    const w = cleanWord(a.text);
    if (w) s.sc.words[a.id] = w;
    else delete s.sc.words[a.id];
    s.done[a.id] = true;
    return advance(s, now);
  }
  if (s.phase !== "write" || scWriter(s) !== a.id) return null;
  const text = oneLine(a.text, LINE_MAX);
  if (!send) {
    s.drafts = { [a.id]: { text } };
    return s;
  }
  if (!text.trim() || wordAt(text, (s.sc.assign[a.id] || {}).word) < 0)
    return null; // the secret word has to be in it
  s.subs = [{ by: a.id, text: text.trim() }];
  s.done[a.id] = true;
  return advance(s, now);
}
/* who is through with a Story Chain step: done, or with nothing to vote for (only their own line or word left) */
const scFreeOf = (s) => {
  const zs = SC_VOTES.includes(s.phase) ? scZones(s) : [];
  return (id) =>
    s.done[id] || (zs.length && !zs.some((z) => scCanVote(s, id, z)));
};
/* what ends a Story Chain phase: the words when enough are in (then the catch-up timer for the rest); a line when its
   writer is done, out of time or gone; a vote once enough have voted (no timer: there is time to sway each other) */
function scAdvance(s, now, force = false) {
  // force: the skip command or a skip vote, as if everyone were done
  const free = scFreeOf(s);
  const on = playing(s),
    d = force ? on.length : on.filter(free).length,
    timeUp = force || (s.ends && now >= s.ends),
    enough = force || d >= needed(s);
  switch (s.phase) {
    case "words":
      catchUp(s, now, enough && d < on.length);
      return d >= on.length ||
        timeUp ||
        ((enough || s.catchEnds) &&
          (!catchLen(s) || (s.catchEnds && now >= s.catchEnds)))
        ? endWords(s, now)
        : s;
    case "write": {
      const w = scWriter(s);
      return !s.players[w] || s.done[w] || timeUp ? endTurn(s, now) : s;
    }
    case "lvote":
      if (endBtnOn(s) && !force) return s; // (End round: only the button ends the vote)
      if (!enough) return s;
      if (!scPara(s).lines.some((l) => l.wordBy && s.players[l.wordBy]))
        return startNext(s, now); // no words to vote on
      {
        const from = scZones(s);
        s.phase = "wvote";
        const to = scZones(s);
        s.phase = "lvote";
        scRezone(s, from, to);
      }
      return enter(s, "wvote", now);
    case "wvote":
      if (endBtnOn(s) && !force) return s;
      return enough ? startNext(s, now) : s;
    case "results": {
      if (!enough) return s;
      const n = { cont: 0, new: 0, lobby: 0 };
      for (const [id, c] of Object.entries(s.sc.next))
        if (s.players[id] && n[c] !== undefined) n[c]++;
      if (force && !n.cont && !n.new && !n.lobby) n.cont = 1; // skipped with no choices made: the story goes on
      const top = Math.max(...Object.values(n)),
        best = Object.keys(n).filter((k) => n[k] === top),
        pick = anyOf(best),
        name = SC_NEXT.find((c) => c[0] === pick)[1];
      say(
        s,
        best.length > 1
          ? `A tie! A coin toss: ${name.toLowerCase()}.`
          : `${name}!`,
      );
      if (pick === "lobby") return backToLobby(s, "Back to the lobby.");
      if (rolling(s)) return rotate(s, now); // (Random: the next paragraph is the next game)
      s.round++;
      return startStory(s, now, pick === "new");
    }
  }
  return s;
}
/* the numbers behind the stats, over a list of paragraphs: votes for each player's lines and words, time spent writing */
export function scStats(paras) {
  const per = {},
    P = (id) =>
      (per[id] = per[id] || {
        lines: 0,
        lvotes: 0,
        wvotes: 0,
        ms: 0,
        best: null,
        bestN: 0,
        word: "",
        wordN: 0,
      });
  for (const para of paras) {
    const ln = para.lines.map(() => 0),
      wn = {};
    for (const i of Object.values(para.votes || {}))
      if (ln[i] !== undefined) ln[i]++;
    for (const by of Object.values(para.wvotes || {}))
      wn[by] = (wn[by] || 0) + 1;
    para.lines.forEach((l, i) => {
      const p = P(l.by);
      p.lines++;
      p.lvotes += ln[i];
      p.ms += l.ms || 0;
      if (ln[i] > p.bestN) {
        p.best = l.text;
        p.bestN = ln[i];
      }
      if (l.wordBy) {
        const q = P(l.wordBy),
          k = wn[l.wordBy] || 0;
        if (k > q.wordN || !q.word) {
          q.word = l.word;
          q.wordN = Math.max(q.wordN, k);
        }
      }
    });
    for (const [by, k] of Object.entries(wn)) P(by).wvotes += k;
  }
  return per;
}

/* a written question: one line of text, or in Would You Rather the two choices (A or B) */
/* the most characters a question, topic or take can have: the Text length limit (a Would You Rather choice: at most 100) */
export const textMax = (s) =>
  [80, 140, 200, 280].includes(+s.options.textMax) ? +s.options.textMax : 200;
function question(s, a) {
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

/* ---------- Lawyering ----------
   Everyone writes a topic in secret; each topic is a court case. Its attorneys: the defense (argues for it; never its
   writer) and the offense (argues against it; may be its writer), picked at random, by the writer or by a vote of the
   room (the host's choice, for each) → the attorneys stand in the circle in the middle and argue over voice while the
   jury (everyone else) walks to a side and votes: left with the offense, right with the defense. A vote can change at
   any time. No timer until every juror has voted: all on one side ends the case at once; a split jury gets closing
   arguments (a minute by default), and when it runs out the bigger side wins (a tie: nobody does). In closing arguments
   an attorney who isn't ahead may give up. → the verdict, talked over → the next case → the round's stats. */
export const LAW_TOPIC_MAX = 200;
export const isCounsel = (s, id) =>
  !!(s.law && (s.law.def === id || s.law.off === id));
/* the jury: everyone playing but the two attorneys */
export const jury = (s) =>
  playing(s).filter((id) => s.players[id] && !isCounsel(s, id));
/* the jury's votes: [offense, defense] */
export function lawTally(s) {
  const n = [0, 0];
  for (const id of jury(s)) {
    const v = (s.law.votes || {})[id];
    if (v === 0 || v === 1) n[v]++;
  }
  return n;
}
/* in closing arguments, an attorney may give up while their side isn't ahead */
export function canGiveUp(s, id) {
  const L = s.law;
  if (!L || !L.close || L.w != null || !isCounsel(s, id)) return false;
  const [o, d] = lawTally(s);
  return id === L.off ? o <= d : d <= o;
}
const pickOne = (xs) => xs[Math.floor(Math.random() * xs.length)];
function startCase(s, now) {
  seatLate(s);
  const q = s.qs[s.qi],
    on = playing(s).filter((id) => s.players[id]);
  s.lordTime = 0;
  s.pos = {};
  s.lock = {};
  s.ends = 0;
  s.law = {
    def: null,
    off: null,
    how: {},
    picks: { def: {}, off: {} },
    votes: {},
    flips: {},
    close: 0,
    start: null,
    w: null,
    gave: null,
  };
  if (s.seat.length < 3) {
    s.law = null;
    return waitFor(s, now, "case");
  } // (two attorneys and a jury: the case waits for players)
  if (on.length < 3) {
    say(s, `Not enough players for a jury, so "${q.text}" is dismissed.`);
    return nextCase(s, now);
  } // (the rest joined mid-round)
  const writer = s.players[q.by] && on.includes(q.by) ? q.by : null,
    how = { def: s.options.lawDef, off: s.options.lawOff };
  for (const k of ["def", "off"])
    if (how[k] === "writer" && !writer) how[k] = "random"; // (the writer left: random)
  s.law.how = Object.fromEntries(
    Object.entries(how).filter(([, v]) => v === "writer" || v === "vote"),
  );
  if (!Object.keys(s.law.how).length) return openCase(s, now);
  enter(s, "counsel", now);
  for (const id of on) s.done[id] = counselDone(s, id);
  return s;
}
function nextCase(s, now) {
  if (++s.qi < s.qs.length) return startCase(s, now);
  return startResults(s, now);
}
/* who can be picked: the defense never the writer; the offense never the defense (once it's known) */
function counselOk(s, role, who) {
  const q = s.qs[s.qi];
  if (!playing(s).includes(who) || !s.players[who]) return false;
  if (+s.options.noOwn && who === q.by) return false; // (Don't get your own prompt: the writer is no attorney)
  return role === "def" ? who !== q.by : who !== s.law.def;
}
/* has this player picked everything they're asked to? */
function counselDone(s, id) {
  const q = s.qs[s.qi];
  return Object.entries(s.law.how).every(
    ([role, how]) =>
      (how === "writer" && id !== q.by) || s.law.picks[role][id] !== undefined,
  );
}
/* the picking is over: the defense first, then the offense (a pick that clashes falls to the next best, then to chance) */
function endCounsel(s, now) {
  const L = s.law,
    q = s.qs[s.qi],
    on = playing(s).filter((id) => s.players[id]);
  for (const role of ["def", "off"]) {
    const ok = (id) => counselOk(s, role, id),
      n = {};
    for (const [voter, who] of Object.entries(L.picks[role] || {}))
      if (s.players[voter] && on.includes(who) && ok(who))
        n[who] = (n[who] || 0) + 1;
    const top = Math.max(0, ...Object.values(n)),
      best = Object.keys(n).filter((id) => n[id] === top && top > 0);
    L[role] = best.length ? pickOne(best) : pickOne(on.filter(ok));
  }
  return openCase(s, now);
}
/* the case opens: random attorneys where nobody picks; each attorney on their own side (I want no circle), the jury lined
   up along the middle strip's top and bottom */
function openCase(s, now) {
  const L = s.law,
    q = s.qs[s.qi],
    on = playing(s).filter((id) => s.players[id]);
  const noOwn = +s.options.noOwn ? q.by : null; // (Don't get your own prompt: the writer is no attorney, either side)
  if (!L.def) L.def = pickOne(on.filter((id) => id !== q.by));
  if (!L.off) L.off = pickOne(on.filter((id) => id !== L.def && id !== noOwn));
  s.pos = {};
  s.lock = {};
  s.pos[L.off] = { x: 0.3, y: 0.5 };
  s.pos[L.def] = { x: 0.7, y: 0.5 };
  const rest = s.seat.filter((id) => !isCounsel(s, id)),
    half = Math.ceil(rest.length / 2);
  rest.forEach((id, k) => {
    const top = k < half,
      i = top ? k : k - half,
      n = top ? half : rest.length - half;
    s.pos[id] = { x: 0.44 + (0.12 * (i + 1)) / (n + 1), y: top ? 0.04 : 0.96 };
  });
  const D = s.players[L.def].name,
    O = s.players[L.off].name,
    t = q.text.trim();
  say(
    s,
    `The Court Case, ${D} is defending this idea: ${t}${/[.!?…]$/.test(t) ? "" : "."} ${O} is against it.`,
  );
  return enter(s, "answer", now);
}
/* a juror votes for the side they stand on (again, to change it) */
function lawVote(s, a, now) {
  const L = s.law,
    p = s.pos[a.id];
  if (!L || L.w != null || isCounsel(s, a.id) || !jury(s).includes(a.id))
    return null;
  const c = colAt(s, p.x);
  if (c < 0) return null;
  const was = L.votes[a.id];
  if (was === c) return null;
  if (was !== undefined)
    L.flips = { ...L.flips, [a.id]: (L.flips[a.id] || 0) + 1 };
  L.votes = { ...L.votes, [a.id]: c };
  s.done[a.id] = true;
  return lawCheck(s, now);
}
/* the case goes on until the jury has voted: all on one side wins at once; a split starts closing arguments, and when
   they run out the bigger side wins. An attorney who leaves loses the case. */
function lawCheck(s, now, force) {
  const L = s.law;
  if (!L || L.w != null) return s;
  const hereO = !!s.players[L.off],
    hereD = !!s.players[L.def];
  if (!hereO || !hereD) {
    if (!hereO && !hereD) {
      say(s, "Both attorneys left, so the case is dismissed.");
      return nextCase(s, now);
    }
    L.left = hereO ? L.def : L.off;
    return verdict(s, hereO ? 0 : 1, now);
  }
  const j = jury(s),
    [o, d] = lawTally(s);
  if (!j.length) {
    say(s, "Nobody is left on the jury, so the case is dismissed.");
    return nextCase(s, now);
  }
  if (force) return verdict(s, o > d ? 0 : d > o ? 1 : -1, now); // skipped: the votes so far decide
  if (!L.close) {
    if (j.some((id) => L.votes[id] === undefined)) return s;
    if (!o || !d) return verdict(s, d ? 1 : 0, now);
    L.close = now + (+s.options.lawClose || 60) * 1000;
    L.start = [o, d];
    s.ends = L.close;
    say(
      s,
      `Closing arguments! The jury is split ${o}–${d}: last chance to win them over.`,
    );
    return s;
  }
  if (now < L.close) return s;
  return verdict(s, o > d ? 0 : d > o ? 1 : -1, now);
}
/* the verdict: side 0 (offense), 1 (defense) or -1 (a tie); the case joins the game's history, then the room talks it over */
function verdict(s, side, now) {
  const L = s.law,
    q = s.qs[s.qi],
    [o, d] = lawTally(s),
    votes = {};
  for (const id of jury(s))
    if (L.votes[id] !== undefined) votes[id] = L.votes[id];
  L.w = side;
  L.end = [o, d];
  s.ends = 0;
  s.history.push({
    round: s.round,
    by: q.by,
    text: q.text,
    law: {
      def: L.def,
      off: L.off,
      votes,
      flips: { ...L.flips },
      w: side,
      start: L.start,
      end: [o, d],
      gave: L.gave,
      left: L.left || null,
    },
  });
  const W = side === 0 ? L.off : side === 1 ? L.def : null;
  if (side === 0 || side === 1) lostRound(s, [side ? L.off : L.def], "law");
  const wn = s.players[W]
    ? s.players[W].name
    : "The " + (side ? "defense" : "offense");
  if (L.left)
    say(
      s,
      `The ${side ? "offense" : "defense"} attorney left the courtroom, so ${wn} wins the case.`,
    );
  else if (!L.gave)
    say(
      s,
      W
        ? `${wn} wins the case ${Math.max(o, d)}–${Math.min(o, d)}.`
        : `A hung jury: ${o}–${d}. Nobody wins the case.`,
    );
  s.lock = { ...votes, [L.off]: -1, [L.def]: -1 };
  for (const id of s.seat)
    if (s.lock[id] === undefined && s.pos[id]) {
      const c = colAt(s, s.pos[id].x);
      s.lock[id] = c;
    }
  return discussOn(s) ? enter(s, "discuss", now) : nextCase(s, now);
}
/* the numbers behind Lawyering's stats: each player's cases (argued, won, lost, by side, given up, won against their own
   topic) and jury votes (and how often they switched sides), and every case's score; round = null for the whole game.
   A hung jury is neither a win nor a loss. */
export function lawStats(s, round = null) {
  const per = {},
    cases = [];
  const P = (id) =>
    (per[id] = per[id] || {
      argued: 0,
      won: 0,
      lost: 0,
      wonDef: 0,
      wonOff: 0,
      gave: 0,
      ownWin: 0,
      votes: 0,
      flips: 0,
    });
  for (const h of s.history.filter(
    (h) => h.law && (round === null || h.round === round),
  )) {
    const c = h.law,
      [o, d] = c.end || [0, 0];
    cases.push({
      by: h.by,
      text: h.text,
      off: c.off,
      def: c.def,
      o,
      d,
      w: c.w,
      gave: c.gave,
      left: c.left,
    });
    P(c.off).argued++;
    P(c.def).argued++;
    if (c.w === 0 || c.w === 1) {
      const W = c.w ? c.def : c.off,
        L = c.w ? c.off : c.def;
      P(W).won++;
      P(W)[c.w ? "wonDef" : "wonOff"]++;
      P(L).lost++;
      if (!c.w && c.off === h.by) P(W).ownWin++; // argued against their own topic, and won
    }
    if (c.gave) P(c.gave).gave++;
    for (const id of Object.keys(c.votes || {})) {
      P(id).votes++;
      P(id).flips += (c.flips || {})[id] || 0;
    }
  }
  return { per, cases };
}
