/* ---------- the game screen ----------
   Write a question → for each question: everyone walks their duck onto a column and ends their turn, then talks it over
   (each duck now stays inside the column it chose) → the round's results (stat boxes; ducks stay in their column) → the
   next round, until the players vote to end the game.

   The board fills the screen. The Round Lord sits on a cloud over the top of the board with the question beside it; both
   turn see-through when a duck walks under them.

   Your duck: WASD or the arrow keys walk (Shift sprints, with speed lines); Space jumps, slow and high, with a shadow left
   on the ground (low gravity makes it slower and higher; a jump counts when the duck lands); Enter ends your turn. With
   "Mouse moves your duck" a click walks it there; with "Show multiple choice" seven buttons put it on a column. Ducks
   squash a little when they push against a wall or another duck. On a touch screen a see-through joystick appears under
   a held finger, or (Settings → Controls) a tap walks the duck there; see touch.js. On a phone held upright the board
   turns: agree at the top. Your duck moves on your screen at once and is sent to the room a few times a second; the
   others glide.

   Hangout walks around Duck Cabin instead of a board: the world (hangout/world.js) draws it, follows my duck with its
   camera and works out how it stands and falls; this file only hands it the keys, the stick and the taps, and puts its
   one context button where the Vote button goes. */
import { register, go, leaveTo } from "./router.js";
import {
  el,
  esc,
  $,
  $$,
  openWindow,
  confirmBox,
  typing,
  windowOpen,
  onMenu,
  contextMenu,
  setHTML,
  toast,
} from "./ui.js";
import { activeRoom } from "./net.js";
import {
  COLS,
  SHORT,
  needed,
  reviewCount,
  playing,
  VOTE_GRACE,
  isWyr,
  isDdr,
  DDR_SIDES,
  ddrStats,
  isBb,
  isLaw,
  twoSided,
  boardPhases,
  bbMatch,
  roundName,
  colAt,
  colXAt,
  colBoundsAt,
  heldCol,
  startX,
  wyrStats,
  bbStats,
  isSudo,
  canOpen,
  isSc,
  SC_BOARD,
  SC_VOTES,
  scZones,
  zoneAt,
  scCanVote,
  scLineOf,
  scWriter,
  scStats,
  wordAt,
  cleanWord,
  LINE_MAX,
  textMax,
  isCounsel,
  jury,
  lawTally,
  canGiveUp,
  lawStats,
  LAW_MID,
  WEAPONS,
  THROWS,
  shotAt,
  coolFor,
  coolEnds,
  phpLost,
  PHP,
  isHang,
  MAG,
  RELOAD,
  magOf,
  KB_MS,
  KB_HOP,
  KB_LAND,
  catchLen,
  minOf,
  goOnVotes,
  goOnNeed,
  counselBounds,
  walkOf,
} from "./rules.js";
import { mountWorld, BOARD_HTML as HANG_HTML } from "./hangout/world.js";
import {
  W as HW,
  H as HH,
  heightAt,
  DUCK as DUCK_PX,
} from "./hangout/layout.js";
import { hangStill } from "./hangout/rules.js";
import { downStill, downFor, GET_UP_MIN } from "./hangout/death.js";
import { FADE as GHOST_FADE } from "./hangout/ghosts.js";
import { grenadeBoom } from "./grenade.js";
import { unlocked } from "./unlocks.js";
import {
  wordsHTML,
  boardHTML as storyHTML,
  typingHTML,
  statsHTML as storyStatsHTML,
} from "./story.js";
import {
  lawColsHTML,
  lawTopHTML,
  LAW_BANNER,
  counselHTML,
  lawStatsHTML,
  lawOverHTML,
  sideColor,
  SWORD,
  SHIELD,
} from "./court.js";
import {
  cloudHTML,
  matchColors,
  matchColsHTML,
  matchTopHTML,
  bracketHTML,
  bracketTopHTML,
  treeSize,
  topicHTML,
  topicLiveHTML,
  tvoteHTML,
  topicsHTML,
  seedsHTML,
  othersHTML,
  sofarHTML,
  podiumHTML,
  bbStatsHTML,
  allOut,
} from "./brackets.js";
import { mountPlayers, trackIdle, lobbyVote, kickItems } from "./players.js";
import { isMuted } from "./chat.js";
import {
  specialById,
  keysOf,
  hasKey,
  colorsOf,
  momentHTML,
  puffHTML,
  confettiRain,
  pressFX,
  BULLET,
  heldHTML,
  daggerHTML,
  DUCKLING,
  looksOf,
  ammoHTML,
  GRENADE,
  GRENADE_PIN,
} from "./specials.js";
import { mountHotbar } from "./hotbar.js";
import {
  isL4dd,
  L4,
  l4Hp,
  l4Down,
  ARMS,
  slotsOf,
  maxHp,
  l4Cool,
  kitOf,
  inHand,
  BURN,
} from "./l4ddrules.js";
import { GUNS, ROUNDS_ART, TRACE } from "./l4ddguns.js";
import { l4TouchAim, l4Held, l4Got } from "./l4dd.js";
import { JET, jetHTML, myFuel, burnFuel } from "./jetpack.js";
import { mountL4Bar, l4Slider } from "./l4ddbar.js";
import { duckSVG, duckRoom } from "./duck.js";
import { nameHTML, fontHTML } from "./name.js";
import {
  justinAt,
  justinShown,
  JUSTIN_ID,
  JUSTIN_PLAYER,
  boardMgj,
  BJ_HP,
} from "./boardjustin.js";
import { rainbowHTML } from "./art.js";
import { statBoxHTML, ddrBoxHTML, openStats } from "./stats.js";
import { profile, save } from "./store.js";
import { openSettings, netLevel } from "./settings.js";
import { musicBarHTML, mountMusicBar } from "./musicbar.js";
import { openCustomize, shareLook } from "./customize.js";
import { pickNote } from "./notes.js";
import { openFriends } from "./friends.js";
import { canAdd, requestFriend } from "./account.js";
import { mountDocks, DOCK_HTML, BAR_HTML } from "./dock.js";
import { countJump } from "./jumps.js";
import { sfx } from "./sound.js";
import { mountMap } from "./maps.js";
import { knockOff, bothOff } from "./duel.js";
import { hooks } from "./hooks.js";
import { mountTouch, stick } from "./touch.js";
import { mountPad } from "./phonepad.js";
import { now as clockNow } from "./clock.js";
import {
  isQuack,
  QUACK_PHASES,
  spotOf,
  isGrey,
  speakerOf,
  frozen,
  cardOf,
  stillIn,
  canAccuse,
  anyWord,
  CLUE_GRACE,
  gridOf,
} from "./quackrules.js";
import {
  quackBoardHTML,
  quackTopHTML,
  refreshTiles,
  quackLines,
  secretCardHTML,
  revealCardsHTML,
  pickHTML,
  quackStatsHTML,
} from "./quack.js";
import {
  isDn,
  DN_GRACE,
  DN_SIDES,
  DN_HAT,
  DN_BW,
  DN_PODIUM,
  TAKE_MAX,
  isDefender,
  voters,
  dnTally,
  wearsDunce,
  dnStill,
  dnStats,
  endVotes,
  endNeed,
} from "./duncerules.js";
import {
  dnColsHTML,
  dnTopHTML,
  DN_PODIUM as PODIUM_HTML,
  DN_COLORS,
  dunceDuck,
  dnStatsHTML,
  dnOverHTML,
} from "./dunce.js";
import {
  isMgj,
  MGJ_ZAP,
  MGJ_POD,
  mgjLeft,
  mgjFrozen,
  mgjGone,
  mgjStats,
  mgjTime,
  GOOD_ID,
  PICK_FADE,
  XB,
  PICK_USES,
  PICK_WEAPONS,
  MGJ_DOWN,
  usesOf,
  mgjPHp,
  mgjOut,
  mgjSafe,
  EDGE_WARN,
  jaimePool,
  JAIME_MS,
  JAIME_MAX,
  CAKE_EVERY,
  cakeAt,
} from "./mgjrules.js";
import {
  FLAME,
  ARROW,
  FIREBALL,
  JAIME,
  POOF,
  MEDKIT,
  ZEBRA,
  FOODS,
  TELEPORT,
  HITMARK,
  HITMARK_FAKE,
  edgeHTML,
} from "./mgjart.js";
import {
  mgjBoardHTML,
  mgjHPHTML,
  dropMeteor,
  mgjStatsHTML,
  mgjOverHTML,
  MAD_JUSTIN,
  SAD_JUSTIN,
  CONTROLLER,
  CHAIR,
  DESK,
  GOOD_JUSTIN,
  pickHTML as mgjPickHTML,
} from "./mgj.js";
import {
  isVd,
  VD_PHASES,
  VD_GRACE,
  VD_TABLE,
  VD_AFTER,
  isDate,
  seated,
  seatOf,
  turnedDown,
  vdTileAt,
  vdTileRects,
  vdStats,
} from "./vddrules.js";
import {
  vdBoardHTML,
  vdTopHTML,
  vdStatsHTML,
  TABLE_W,
  SEAT_OUT,
  SEAT_LIFT,
} from "./vdd.js";
import { touchOnly } from "./pointer.js";

let R = null,
  S = null,
  off = null,
  raf = 0,
  tick = 0,
  docks = null;
let shown = ""; // which phase view is up (phase|round|question)
const keys = new Set();
let me = null; // my duck here: { x, y, j (jump start), lj (a long jump), dj (when a double jump began), face }
let target = null; // where a click or a tap asked my duck to walk: { x, y, sprint, mark }
let touchOff = null,
  touchedAt = 0,
  touchTold = false;
let squash = { q: "", t: 0 },
  moving = false,
  sprinting = false;
let lastFx = -1,
  hotdogs = [],
  follows = []; // the silly commands seen so far; hotdogs and items following their ducks
let bar = null,
  pad = null, // phones: the jump button and the attack button
  lastKey = -1; // the specials' number keys: the row, the key last pressed (V presses it again)
const kept = new Set(); // the jumps kept on here (Shift and the key); kept effects are in the room's state
const BODY = "~body"; // a Duck Cabin ghost's body is drawn as a duck of its own: its player's id and this
const JUSTIN2 = "justin2"; // Mad God Justin's double, drawn as a duck of its own
/* a Jaime (Mad God Justin's, or the Jaime special's, s.jm): his look, with the name of the duck that sent him under him */
const jaimeLook = (s, id) => {
  const by =
    s.players[
      (((s.mgj && s.mgj.jaimes) || {})[id] || (s.jm || {})[id] || {}).by
    ] || {};
  return { ...JAIME, name: by.name || JAIME.name, nameStyle: by.nameStyle };
};
let padHold = false, // a phone's jump button held down (the jetpack flies)
  held = null,
  l4Slot = 0, // Quacky Zombies: the slot in hand (0 melee, 1 and 2 ranged, 3 the special), and the weapon's before the special
  l4Last = 0,
  mgjHold = "knife", // Mad God Justin: what keys 1 to 3 put in hand (the knife, the bow, the medkit)
  keyAim = null, // … and where the arrow keys aim (on the screen), when they moved last: null when the mouse did
  mouse = null,
  shovedAt = 0,
  putAt = 0; // the handgun or dagger kept out (Shift and its key), and where the mouse is on the screen
let shows = {}; // a handgun just fired, shown turned toward its aim for a moment: by player id
let scene = null; // the map: its world fills the page behind the game
let lastSend = 0,
  lastSent = "",
  lastBeep = -1,
  lastT = 0,
  geo = null,
  lastGrace = -1,
  sayJob = 0;
let draftT = 0;
let pm = null,
  idleOff = null,
  mbarOff = null; // the player menu (Tab), and the away watch
let recorded = ""; // the last round counted in my all-time stats
let lastLog = -1,
  bubbles = {}; // chat bubbles over the ducks: { [player]: { text, until, n } }
let lastClose = 0; // Lawyering: the closing arguments last announced
let bbZoom = 0,
  losers = new Set(),
  seedShift = 0,
  knocked = new Set(); // Bicker Brackets: the bracket's zoom (0: automatic); ducks wearing the Loser's X; how far the sides' colors have turned;
// the matches whose loser is already bumped off the cloud
let world = null; // Hangout: the cabin's world (its camera, its props, its activities)
let scY = 0,
  scT = 0,
  scWalk = 0,
  scZone = ""; // Story Chain: how far the story has scrolled, the last frame, when my duck last walked, the zone it stands in
const portrait = () =>
  matchMedia("(orientation: portrait) and (max-width: 760px)").matches;
/* on a phone held upright the board turns (agree at the top); the bracket and the story don't: they keep their own layout */
const turned = () =>
  portrait() &&
  !(
    R &&
    (R.state.phase === "bracket" ||
      isSc(R.state) ||
      isHang(R.state) ||
      isVd(R.state))
  ); // (Valentine's Duck Date keeps its table the right way up)
let cam = null; // the bracket's camera: the diagram's corner on the board (dx, dy), the bracket's offset in it (ox, oy), its zoom and size

/* ---------- movement numbers (board widths or heights per second) ---------- */
const SPEED = { x: 0.45, y: 1.0, px: 0.5, py: 0.85, sprint: 1.75 };
const MGJ_SLOW = 0.8;
const JUMP = { normal: { T: 0.62, H: 1.35 }, low: { T: 1.2, H: 2 } }; // seconds in the air; apex in duck heights (low gravity: floatier, still quick)
/* a duck's jump: a long jump floats longer and a little higher, a short jump is lower and quicker (60% of the height in
   70% of the time: the owner's numbers); a double jump starts a second arc where the duck is, a little lower than the
   first */
const jumpCfg = (pos) => {
  const b = JUMP[R && R.state.options.lowGravity ? "low" : "normal"];
  if (pos && pos.tb > 0) return { T: b.T * Math.sqrt(pos.tb / b.H), H: pos.tb }; // Hangout's trampoline: a bounce tb duck heights high
  return pos && pos.lj
    ? { T: b.T * 1.4, H: b.H * 1.15 }
    : pos && pos.sj
      ? { T: b.T * 0.7, H: b.H * 0.6 }
      : b;
};
const arc = (t0, now, T, H) => {
  const t = (now - t0) / 1000 / T;
  return t <= 0 || t >= 1 ? 0 : 4 * H * t * (1 - t);
};
const jumpZ = (pos, now) => {
  if (pos && pos.jf && pos.fz !== undefined) return pos.fz; // (the jetpack, on the boards: its height)
  if (!pos || !pos.j) return 0;
  const { T, H } = jumpCfg(pos);
  if (!pos.dj || now < pos.dj) return arc(pos.j, now, T, H);
  const z0 = arc(pos.j, pos.dj, T, H),
    t = (now - pos.dj) / 1000 / T; // the second arc: from where it began down to the ground
  return t >= 1 ? 0 : z0 * (1 - t) + 4 * H * 0.8 * t * (1 - t);
};
const landsAt = (pos) => (pos.dj || pos.j) + jumpCfg(pos).T * 1000;
/* the jetpack: is it on a duck's back (Quacky Zombies: switched on from its slot; the other modes: the Jetpack
   special's key; never in Mad God Justin), and how much flight my own has left (ms) */
function jetOn(s, id, now) {
  if (!s || isMgj(s)) return false;
  if (isL4dd(s)) return !!(kitOf(s, id) || {}).jp;
  const u = ((s.aura || {})[id] || {}).jetpack;
  return u !== undefined && (!u || u > now);
}
const fuelLeft = () =>
  isL4dd(R.state)
    ? (((kitOf(R.state, R.me) || {}).am || {}).jetpack || [0])[0]
    : myFuel();
/* my duck flying high enough that a hit misses (near the ground, taking off or coming down, it doesn't) */
function flyHigh() {
  if (!me || !me.jf) return false;
  if (world && isHang(R.state))
    return me.z - heightAt(me.x * HW, me.y * HH) > JET.SAFE * DUCK_PX;
  return (me.fz || 0) > JET.SAFE;
}
/* after a step: the jets' flames show while they're on, and the other modes' fuel goes down in the air, up on the
   ground (Quacky Zombies' is the host's) */
function jetAfter(jt, dt) {
  const on = !!me.jf && jt;
  if (me.jt !== on) {
    me.jt = on;
    sendMove(true);
  }
  if (!isL4dd(R.state) && jetOn(R.state, R.me, clockNow())) burnFuel(dt, on);
}
/* flying: the jets on (Space held, a phone's jump button held) or keeping the height (Shift), while there's fuel */
function jetKeys() {
  const has = me && me.jf && fuelLeft() > 0;
  return {
    up: !!has && (keys.has("Space") || padHold),
    hold: !!has && (keys.has("ShiftLeft") || keys.has("ShiftRight")),
  };
}
function takeOff() {
  me.jf = true;
  me.j = 0;
  if (world && isHang(R.state)) {
    world.started(me);
    me.vz = 0;
  } else {
    me.fz = 0;
    me.fv = 0;
  }
  sendMove(true);
}

/* ---------- the board ---------- */
/* Would You Rather: two tiles, each choice in its writer's font, with an OR strip between them */
function wyrColsHTML(s) {
  const q = ["answer", "discuss"].includes(s.phase) ? s.qs[s.qi] : null;
  const tile = (c, t) =>
    `<div class="col wyr-${c ? "b" : "a"}" data-c="${c}"><span class="wyr-txt">${q ? fontHTML(writerFont(s), esc(t)) : c ? "B" : "A"}</span></div>`;
  return `<div class="cols wyr-cols">${tile(0, q && q.a)}<div class="wyr-or"><span>OR</span></div>${tile(1, q && q.b)}</div>`;
}
/* Does Duck Relate?: the same two tiles, always Duck Does Relate (A) and Duck Doesn't Relate (B); the statement is on the cloud */
const ddrColsHTML = () =>
  `<div class="cols wyr-cols ddr-cols">${DDR_SIDES.map((t, c) => `<div class="col wyr-${c ? "b" : "a"}" data-c="${c}"><span class="wyr-txt">${esc(t)}</span></div>`).join('<div class="wyr-or"><span>OR</span></div>')}</div>`;
/* Bicker Brackets: a match's two seeds (no board drawn), or the bracket that ducks walk over */
const bbBoardHTML = (s) =>
  s.phase === "bracket"
    ? `<div class="board bb-board bb-bracket"><div class="cols bb-cols bb-none"></div><div class="bb-diagram">${bracketHTML(s)}</div>${bracketTopHTML(s)}<div class="ducks"></div><div class="fxl"></div></div>`
    : `<div class="board bb-board">${matchColsHTML(s)}<div class="ducks"></div><div class="fxl"></div>${matchTopHTML(s, knocked.has(matchKey(s)))}</div>`;
/* Lawyering: the offense's and the defense's sides, the attorneys' circle, both attorneys on the cloud */
const lawBoardHTML = (
  s,
) => `<div class="board law-board">${lawColsHTML(s)}<div class="ducks"></div><div class="fxl"></div>${LAW_BANNER}
  ${["answer", "discuss"].includes(s.phase) ? lawTopHTML(s, knocked.has(caseKey(s))) : ""}</div>`;
/* Duncelation: Dunce and Not a Dunce, the defender's circle (and in the dunce's moment the LOSER podium), the defender on the cloud */
const dnBoardHTML = (
  s,
) => `<div class="board law-board dn-board">${dnColsHTML(s)}<div class="law-ring" aria-hidden="true"></div><div class="ducks">${s.phase === "dunced" ? PODIUM_HTML : ""}</div><div class="fxl"></div>
  ${["answer", "discuss", "dunced"].includes(s.phase) ? dnTopHTML(s, s.phase !== "dunced" || clockNow() - s.at >= DN_BW) : ""}</div>`;
/* Who is the Quack?: the ducks' tiles (or the two sides), the cloud, my Secret Card, and at the end the Quack's card */
const myCard = (s) =>
  s.wq && s.wq.ids.includes(R.me)
    ? s.hidden
      ? cardOf(s, R.me)
      : R.secretCard
        ? R.secretCard(s)
        : null
    : undefined;
const quackBoard = (
  s,
) => `<div class="board wq-board${s.phase === "reveal" && s.wq.lastOut ? " late" : ""}">${quackBoardHTML(s, R.me)}<div class="ducks"></div><div class="fxl"></div>
  ${quackTopHTML(s, s.phase === "reveal" && s.wq.result ? revealCardsHTML(s) : myCard(s) !== undefined ? secretCardHTML(myCard(s)) : "")}</div>`;
const boardHTML = (s) =>
  isHang(s)
    ? HANG_HTML
    : isQuack(s)
      ? quackBoard(s)
      : isSc(s)
        ? storyHTML(s, R.me)
        : isBb(s)
          ? bbBoardHTML(s)
          : isLaw(s)
            ? lawBoardHTML(s)
            : isDn(s)
              ? dnBoardHTML(s)
              : isMgj(s)
                ? mgjBoardHTML(s)
                : isVd(s)
                  ? vdBoardHTML(s, R.me)
                  : `<div class="board${!isWyr(s) && !isDdr(s) && s.options.aodColors === "gr" ? " aod-gr" : ""}">
  ${isWyr(s) ? wyrColsHTML(s) : isDdr(s) ? ddrColsHTML() : `<div class="cols">${COLS.map((c, i) => `<div class="col c${i + 1}" data-c="${i}"><span class="col-name">${esc(c)}<span class="cb-mark">${SHORT[i]}</span></span></div>`).join("")}</div>`}
  <div class="ducks"></div><div class="fxl"></div>
  ${s.phase === "answer" || s.phase === "discuss" ? `<div class="topover">${lordHTML(s)}<p class="question">${fontHTML(writerFont(s), esc(isWyr(s) ? "Would you rather" : s.qs[s.qi].text))}</p></div>` : ""}</div>`; // (Would You Rather: the choices are on the tiles)

/* the board's measurements, taken again when the window or the docks change */
function measure() {
  const board = S && $(".board", S);
  if (!board) {
    geo = null;
    return;
  }
  if (isSc(R.state)) return measureStory(board);
  if (isHang(R.state)) {
    geo = world ? world.measure() : null;
    return;
  } // (the world's camera)
  const cols = $(".cols", board),
    r = board.getBoundingClientRect(),
    H = cols.offsetHeight,
    top0 = cols.offsetTop;
  const size = Math.max(
    34,
    Math.min(
      100,
      (turned()
        ? H / 7
        : isVd(R.state) && portrait()
          ? board.offsetWidth / 4.4
          : board.offsetWidth / 7) * 0.62,
    ),
  );
  const label = board.querySelector(".col-name"),
    labelH = turned() ? 0 : label ? label.offsetHeight + 12 : 30;
  geo = { W: r.width, H, top0, size, labelH, left: r.left, top: r.top };
  /* Who is the Quack?'s tiles: the grid sits where the ducks' feet can reach, so a duck is on the tile it looks to be on */
  const tiles = $(".wq-tiles", board),
    sides = $(".wq-sides", board),
    over = $(".wq-top", board);
  const side =
    !turned() &&
    over &&
    matchMedia("(orientation: landscape) and (max-height: 520px)").matches; // (a phone on its side: the cloud stands to the left, and the tiles or the two sides take the rest)
  if (sides)
    sides.style.marginLeft = side
      ? `${over.offsetLeft + over.offsetWidth + 8}px`
      : "";
  if (sides && side) {
    geo.size = Math.max(30, Math.min(size, H / 5));
    geo.qp = {
      t: geo.size * 1.08,
      b: labelH,
      l: over.offsetLeft + over.offsetWidth + 8,
      r: 0,
    };
  }
  if (tiles) {
    const below = over ? over.offsetTop + over.offsetHeight + 6 - top0 : 0; // (on a computer, the tiles start under the cloud)
    if (side) {
      // (a duck small enough to stand under its tile's name: it stands .62 down a tile, and the name takes the top ~26px)
      const rows = gridOf(R.state.wq.ids.length).R;
      geo.size = Math.max(
        30,
        Math.min(size, ((0.62 * H) / rows - 26) / (1 + 0.825 / rows)),
      );
    }
    const qp = turned()
      ? { t: size * 1.05, b: size * 0.15, l: r.width * 0.06, r: r.width * 0.06 }
      : side
        ? {
            t: geo.size * 1.08,
            b: geo.size * 0.25,
            l: over.offsetLeft + over.offsetWidth + 8,
            r: 0,
          }
        : { t: Math.max(size * 1.08, below), b: size * 0.25, l: 0, r: 0 };
    geo.qp = qp;
    tiles.style.inset = `${qp.t.toFixed(1)}px ${qp.r.toFixed(1)}px ${qp.b.toFixed(1)}px ${qp.l.toFixed(1)}px`;
  }
  /* Valentine's Duck Date's pick: the board starts under the cloud, so every tile is in sight */
  const vt = $(".vd-tiles", board),
    vtop = $(".vd-top", board);
  if (vt) {
    const below = vtop ? vtop.offsetTop + vtop.offsetHeight + 6 - top0 : 0;
    geo.qp = {
      t: Math.max(size * 1.08, below + geo.size * 0.9),
      b: geo.size * 0.25,
      l: 0,
      r: 0,
    };
  }
}
/* Story Chain: the rows' places in the story (its zones, in order) and the view over it */
function measureStory(board) {
  const view = $(".sc-view", board),
    list = $(".sc-rows", view);
  if (!view || !list) {
    geo = null;
    return;
  }
  const r = view.getBoundingClientRect(),
    size = Math.max(30, Math.min(56, r.height / 7));
  geo = {
    W: r.width,
    H: r.height,
    top0: 0,
    size,
    labelH: 0,
    left: r.left,
    top: r.top,
    sc: true,
    rows: [...list.children].map((e) => ({
      top: e.offsetTop,
      h: Math.max(1, e.offsetHeight),
    })),
    contentH: list.offsetHeight,
  };
}
/* the story slides to keep my duck in view; while a line is typed and my duck stands still, it shows that line */
function panStory(pos, now) {
  const list = S.querySelector(".sc-rows");
  if (!list || !geo || !geo.rows.length) return;
  const dt = Math.min(0.1, Math.max(0, (now - (scT || now)) / 1000));
  scT = now;
  const n = geo.rows.length,
    max = Math.max(0, geo.contentH - geo.H),
    last = geo.rows[n - 1];
  let want;
  if (R.state.phase === "write" && now - scWalk > 2500)
    want = last.top + last.h - geo.H + geo.size * 0.9; // (room for the names under the ducks)
  else if (pos) {
    const u = Math.max(0, Math.min(0.9999, pos.y)) * n,
      row = geo.rows[Math.floor(u)];
    want = row.top + row.h * (u % 1) - geo.H * 0.55;
  } else want = scY;
  want = Math.max(0, Math.min(max, want));
  scY =
    Math.abs(want - scY) < 0.5
      ? want
      : scY + (want - scY) * Math.min(1, dt * 5);
  const tr = `translateY(${(-scY).toFixed(1)}px)`;
  if (list._tr !== tr) {
    list._tr = tr;
    list.style.transform = tr;
    const v = list.parentNode;
    v.classList.toggle("more-up", scY > 8);
    v.classList.toggle("more-down", scY < max - 8); // more story above or below
  }
}
/* where a duck stands: x along the answers (0 strongly disagree … 1 strongly agree), y across */
function place(p, i, n) {
  if (geo && geo.hang) return world.place(p); // Hangout: through the camera
  if (geo && geo.sc) {
    // Story Chain: y runs down the rows, each row the same share of it
    const k = geo.rows.length;
    if (!k) return { left: geo.W * p.x, top: geo.H / 2 };
    const u = Math.max(0, Math.min(0.9999, p.y)) * k,
      row = geo.rows[Math.floor(u)];
    return { left: geo.W * p.x, top: row.top + row.h * (u % 1) - scY };
  }
  if (cam && R.state.phase === "bracket")
    return {
      left: cam.dx + cam.ox + p.x * cam.W * cam.z,
      top: cam.dy + cam.oy + p.y * cam.H * cam.z,
    }; // on the bracket itself, the same spot on every screen
  const { W, H, top0, size, labelH, qp } = geo;
  if (p.x < 0) p = { ...p, x: startX(R.state) }; // (ducks start on the board; this only covers an old state)
  if (qp) {
    const w = W - qp.l - qp.r,
      h = H - qp.t - qp.b;
    return turned()
      ? { left: qp.l + p.y * w, top: top0 + qp.t + (1 - p.x) * h }
      : { left: qp.l + p.x * w, top: top0 + qp.t + p.y * h };
  } // on Who is the Quack?'s tiles
  if (turned())
    return {
      left: W * (0.1 + p.y * 0.8),
      top: top0 + H * (1 - p.x) + size * 0.45,
    };
  return {
    left: W * p.x,
    top: top0 + size * 1.08 + p.y * (H - size * 1.08 - labelH),
  };
}
function unplace(px, py) {
  // the inverse, for clicks
  if (geo.hang) return world.unplace(px, py);
  const { W, H, size, labelH, qp } = geo,
    cl = (v) => Math.max(0, Math.min(1, v));
  if (geo.sc) {
    const y = py + scY,
      rows = geo.rows;
    if (!rows.length) return { x: cl(px / W), y: 0.5 };
    let k = rows.findIndex((r) => y < r.top + r.h);
    if (k < 0) k = rows.length - 1;
    return {
      x: cl(px / W),
      y: cl((k + cl((y - rows[k].top) / rows[k].h) * 0.999) / rows.length),
    };
  }
  if (cam && R.state.phase === "bracket")
    return {
      x: cl((px - cam.dx - cam.ox) / (cam.W * cam.z)),
      y: cl((py - cam.dy - cam.oy) / (cam.H * cam.z)),
    };
  py -= geo.top0;
  if (qp) {
    const a = cl((px - qp.l) / (W - qp.l - qp.r)),
      b = cl((py - qp.t) / (H - qp.t - qp.b));
    return turned() ? { x: 1 - b, y: a } : { x: a, y: b };
  }
  if (turned())
    return { x: cl(1 - (py - size * 0.45) / H), y: cl((px / W - 0.1) / 0.8) };
  return {
    x: cl(px / W),
    y: cl((py - size * 1.08) / (H - size * 1.08 - labelH)),
  };
}

/* where a duck has walked (on the board, newest first), for its ducklings */
function trail(d, pos) {
  const path = d._trail || (d._trail = []),
    last = path[0];
  if (pos.x < 0) return;
  if (!last || Math.hypot(pos.x - last.x, (pos.y - last.y) * 0.4) > 0.004) {
    path.unshift({ x: pos.x, y: pos.y });
    if (path.length > 60) path.length = 60;
    if (last) d._walk = clockNow();
  }
}
/* the spot dist pixels back along a duck's path from its feet (at), and which way it faces there */
function along(path, at, dist, face) {
  let px = at.left,
    py = at.top,
    left = dist;
  for (const p of path) {
    const q = place(p, 0, 1),
      dx = q.left - px,
      dy = q.top - py,
      d = Math.hypot(dx, dy);
    if (d < 0.5) continue;
    if (d >= left) {
      const k = left / d;
      return {
        left: px + dx * k,
        top: py + dy * k,
        face: Math.abs(dx) > 1 ? (dx < 0 ? 1 : -1) : face,
      };
    }
    left -= d;
    px = q.left;
    py = q.top;
    if (Math.abs(dx) > 1) face = dx < 0 ? 1 : -1;
  }
  return { left: px - face * left, top: py, face }; // (a short path: on behind, in a line)
}

/* ---------- drawing the ducks (every frame: jumps and glides) ---------- */
const SQ = {
  l: ["0% 100%", 0.8, 1.12],
  r: ["100% 100%", 0.8, 1.12],
  u: ["50% 0%", 1.12, 0.84],
  d: ["50% 100%", 1.14, 0.82],
};
function drawDucks(now = clockNow()) {
  const board = S && $(".board", S);
  if (!board || !R || !geo) return;
  const s = R.state,
    layer = $(".ducks", board),
    size = geo.size,
    hang = !!geo.hang;
  if (hang) world.frame(now); // (the camera first: ducks stand in the world)
  const jp =
    !hang && justinShown(s)
      ? {
          ...justinAt(s.justin, now),
          ...(isMgj(s) && s.phase === "boss" && s.justin.w
            ? { w: s.justin.w, ax: s.justin.ax, ay: s.justin.ay }
            : {}),
        }
      : null; // (the Justin option: he walks the board, never a player; Mad God Justin: with his gun out)
  const jp2 =
    jp && isMgj(s) && s.mgj && s.mgj.dup && s.phase === "boss"
      ? {
          ...jp,
          x: 1 - jp.x,
          y: 1 - jp.y,
          ...(jp.ax !== undefined ? { ax: -jp.ax, ay: -jp.ay } : {}),
        }
      : null; // (Mad God Justin's double: mirrored through the board's middle)
  const jm = (!isMgj(s) && s.jm) || {},
    jaimes =
      isMgj(s) && s.mgj
        ? Object.keys(s.mgj.jaimes || {}).filter((id) => s.pos[id])
        : Object.keys(jm); // (the Jaime special's keep their place in s.jm, not s.pos)
  /* a duck the hammer shoved or a grenade threw (pos.kb): drawn sliding back from where it stood, over a little hop (a
     grenade's: higher, longer, at once) */
  const kbT = (id) => {
    const k = (s.pos[id] || {}).kb,
      l = k && (k.l ?? KB_LAND),
      ms = k && (k.ms || KB_MS);
    return k && now - k.t < l + ms
      ? [k, Math.max(0, (now - k.t - l) / ms)]
      : null;
  };
  const landing = (id) => {
    const k = (s.pos[id] || {}).kb;
    return !!k && now - k.t < (k.l ?? KB_LAND);
  }; // (it falls when the hammer gets there)
  const shoved = (id, pos) => {
    const kt = kbT(id);
    if (!kt || !pos) return pos;
    const [k, t] = kt,
      e = 1 - (1 - t) * (1 - t),
      to = s.pos[id];
    return { ...pos, x: k.x + (to.x - k.x) * e, y: k.y + (to.y - k.y) * e };
  };
  const ghosts = (hang && s.hang && s.hang.ghost) || {},
    bodyOf = (id) => id.endsWith(BODY) && ghosts[id.slice(0, -BODY.length)]; // Duck Cabin's ghosts (hangout/ghosts.js): each one's body lies where it fell
  const posOf = (id) =>
    bodyOf(id)
      ? { ...bodyOf(id), j: 0 }
      : shoved(
          id,
          id === JUSTIN_ID
            ? jp
            : id === JUSTIN2
              ? jp2
              : jm[id]
                ? jm[id]
                : id === R.me && me
                  ? me
                  : hang
                    ? world.shown(id, s.pos[id])
                    : s.pos[id],
        );
  const liftOf = (id, pos) =>
    (hang ? world.lift(id, pos) : jumpZ(pos, now) * size) +
    (kbT(id)
      ? 4 * (kbT(id)[0].h || KB_HOP) * kbT(id)[1] * (1 - kbT(id)[1]) * size
      : 0) +
    podLift(s, id, now) * size +
    (seated(s, id) ? SEAT_LIFT * size : 0); // how high over its ground a duck is drawn (Duncelation: the dunce on its podium; Valentine's Duck Date: on its chair)
  if (s.phase === "bracket") panTree(posOf(R.me));
  else cam = null; // (the camera first: ducks stand on the bracket)
  if (geo.sc) panStory(me, now);
  const ids = [
      ...s.seat.filter((id) => s.pos[id]),
      ...(jp ? [JUSTIN_ID] : []),
      ...(jp2 ? [JUSTIN2] : []),
      ...jaimes,
      ...(isMgj(s) && s.mgj && s.mgj.gj && s.pos[GOOD_ID] ? [GOOD_ID] : []),
      ...Object.keys(ghosts)
        .filter((id) => s.players[id] && !ghosts[id].l4)
        .map((id) => id + BODY), // (Quacky Zombies' ghosts leave no body)
    ],
    lane = ids.filter((id) => posOf(id).x < 0);
  const boxes = [],
    puffs = [],
    wearsX = new Set(),
    brood = [],
    arms = [];
  /* Who is the Quack?'s reveal keeps its news for the drumroll: who was voted out goes grey after it, the last duck plays dead after that */
  const wq = isQuack(s) && s.wq,
    rt = wq && s.phase === "reveal" && wq.lastOut ? now - s.at : 1e9;
  const greyNow = (id) =>
    wq &&
    isGrey(s, id) &&
    !(id === wq.lastOut && rt < 3200) &&
    !((wq.dead || []).includes(id) && rt < 6100) &&
    !(wq.result && wq.result.quacks.includes(id));
  /* Hide names while answering: the other ducks' name tags stay hidden until the turn ends */
  layer.classList.toggle(
    "hide-names",
    !!+s.options.hideNames &&
      ["aod", "wyr", "ddr"].includes(s.options.mode) &&
      s.phase === "answer",
  );
  const deadNow = (id, p) =>
    !!p.dead &&
    !landing(id) &&
    !(wq && (wq.dead || []).includes(id) && rt < 6100);
  for (const id of ids) {
    const g = bodyOf(id),
      p = g
        ? { ...s.players[id.slice(0, -BODY.length)], dead: true }
        : s.players[id] ||
          (id === JUSTIN_ID && {
            ...(isMgj(s)
              ? s.phase === "mgjend" && s.mgj && s.mgj.won
                ? SAD_JUSTIN
                : MAD_JUSTIN
              : JUSTIN_PLAYER),
            dead: !!s.justin.down,
          }) ||
          (id === GOOD_ID && {
            ...GOOD_JUSTIN,
            dead: !!(s.mgj && s.mgj.gj && s.mgj.gj.down),
          }) ||
          (id === JUSTIN2 && MAD_JUSTIN) ||
          (jaimes.includes(id) && jaimeLook(s, id)),
      pos = posOf(id);
    if (!p) continue;
    let d = layer.querySelector(`[data-pid="${id}"]`);
    if (!d) {
      d = el(
        `<div class="gduck${id === R.me ? " mine" : ""}" data-pid="${esc(id)}"><span class="gduck-ring"></span><div class="gduck-shadow"></div><div class="gduck-lift"><span class="gduck-bubble"></span><span class="gduck-zz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span><span class="gduck-fire" aria-hidden="true">${FLAME}</span><span class="gduck-say"></span><div class="gduck-body"></div><svg class="gduck-x" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 7L33 33M33 7L7 33"/></svg><span class="gduck-name"></span><span class="gduck-done" hidden>✓</span></div></div>`,
      );
      if (g) d.classList.add("gbody");
      layer.append(d);
    }
    const ghost = ghosts[id],
      gho = ghost
        ? (
            0.4 *
            (ghost.out ? Math.max(0, 1 - (now - ghost.out) / GHOST_FADE) : 1)
          ).toFixed(2)
        : ""; // a ghost: as see-through as the shadow duck, fading away as it comes back
    if (d._gho !== gho) {
      d._gho = gho;
      d.classList.toggle("ghost", !!ghost);
      d.classList.toggle("grey", !!(ghost && ghost.l4)); // (Quacky Zombies: a ghost is grey too)
      d.style.setProperty("--gho", gho || 1);
    }
    const dead = deadNow(id, p),
      look = dnHat(s, id, now) ? dunceDuck(p.duck) : p.duck,
      role = lawRole(s, id),
      jet = jetOn(s, id, now),
      sig = JSON.stringify([look, p.name, p.nameStyle, dead, role, jet]); // a new look shows at once, mid-game too (Duncelation: a dunce's hat; the jetpack on its back)
    if (dead && d._dead === false && !g && !wq) {
      sfx.hit();
      hurt(d);
    } // a duck knocked down (by a weapon, Justin, a kill): the hit sound and a short red flash, for everyone
    d._dead = dead;
    const hs = (s.hurt || {})[id];
    if (hs !== d._hs) {
      if (d._hs !== undefined && hs) {
        sfx.hit();
        hurt(d);
      } // (Invulnerability: a hit only flashes red)
      d._hs = hs;
    }
    if (d._sig !== sig) {
      d._sig = sig;
      d.querySelector(".gduck-body").innerHTML =
        (jet ? jetHTML(look) : "") +
        duckSVG(look, { size: 64, shadow: false, title: p.name, dead }) +
        '<span class="sp-fx gduck-aura"></span>';
      if (look && look.eyes === "tears") {
        // his tears stay bright over the burnt duck: a copy on top shows only the tears (css: .mgj-cry)
        const cry = d.querySelector(".gduck-body svg").cloneNode(true);
        cry.classList.add("mgj-cry");
        d.querySelector(".gduck-body").append(cry);
      }
      d._aura = null;
      d.style.setProperty("--xc", colorsOf(p.duck, "loserx")[0]);
      d.querySelector(".gduck-name").innerHTML =
        (role
          ? `<i class="law-tag ${role}" aria-label="${role === "off" ? "Offense" : "Defense"}">${role === "off" ? SWORD : SHIELD}</i>`
          : "") +
        nameHTML(p.name, p.nameStyle) +
        '<span class="gduck-down" aria-hidden="true"><i></i></span><span class="gduck-hp" aria-hidden="true"><b></b><i></i></span>'; // (Lawyering: the sword or the shield beside an attorney's name)
      d.classList.toggle("lawyer", !!role);
      d.classList.toggle("pic", !!(look && look.image)); // (an imported picture: its down meter is plain, no streaks)
      if (role) {
        d.style.setProperty("--lc", sideColor(p));
        d.style.setProperty("--ld", -(clockNow() % LAW_GLOW) + "ms");
      } // (the glow breathes on the room's clock, so both attorneys breathe together)
      const cc = seen((p.card && p.card.color) || "#2fa4ff");
      d.style.setProperty("--dc", cc);
      d.style.setProperty("--dk", against(cc));
      d._dn = null;
      d._hp = null;
    }
    /* knocked down: the meter on the name tag empties until the duck stands up (s.up), behind the letters */
    const upAt =
        dead &&
        !g &&
        (id === GOOD_ID
          ? s.mgj && s.mgj.gj && s.mgj.gj.down
          : (s.up || {})[id]),
      l4dn = isL4dd(s) && !g ? l4Down(s, id) : 0,
      dn = l4dn ? l4dn : upAt > now && !mgjOut(s, id) ? upAt : 0; // (Good Justin God keeps his own time down; a duck out of HP has no meter: it's down until the fight ends; Quacky Zombies: the time it has to be revived)
    if (d._dn !== dn) {
      d._dn = dn;
      d.classList.toggle("downed", !!dn);
      const m = dn && d.querySelector(".gduck-down i");
      if (m) {
        const all =
          id === GOOD_ID
            ? MGJ_DOWN
            : l4dn
              ? L4.BLEED
              : Math.max(downFor(s), GET_UP_MIN);
        m.style.animation = "none";
        void m.offsetWidth;
        m.style.animation = "";
        m.style.setProperty("--dt", all + "ms");
        m.style.animationDelay = Math.min(0, dn - now - all) + "ms";
      }
    }
    /* Mad God Justin's Player HP: a green bar behind the letters; the part a hit took turns red at once, then fades.
       Never with the down meter: a duck that's down shows only the down meter, and stands up full */
    /* the normal game's HP (3, back after 6 s without a hit): the same bar, shown only while a hit is still counted;
       Quacky Zombies: its own 3 HP, always shown (down or a ghost, none) */
    const l4 = isL4dd(s) && !g && s.seat.includes(id) && s.phase === "hang",
      bj = id === JUSTIN_ID && !g && boardMgj(s), // (the board's Mad God Justin: his 10 HP, always shown while he's up)
      lost =
        !l4 && !isMgj(s) && !g && s.seat.includes(id) && !dead
          ? phpLost(s, id, now)
          : 0,
      hpMax = bj
        ? s.justin.max || BJ_HP
        : l4
          ? maxHp(s, id)
          : isMgj(s)
            ? !g && s.seat.includes(id) && s.phase === "boss"
              ? mgjPHp(s)
              : 0
            : lost
              ? PHP
              : 0,
      hp = !hpMax
        ? -1
        : bj
          ? dead
            ? -1
            : (s.justin.hp ?? hpMax)
          : l4
            ? !dead && l4Hp(s, id) > 0
              ? l4Hp(s, id)
              : -1
            : isMgj(s)
              ? s.mgj && !dead
                ? Math.max(0, hpMax - ((s.mgj.lost || {})[id] || 0))
                : -1
              : PHP - lost;
    if (d._hp !== hp) {
      const was = d._hp;
      d._hp = hp;
      d.classList.toggle("php", hp >= 0);
      const bar = d.querySelector(".gduck-hp");
      if (bar && hp >= 0) {
        bar.style.setProperty("--hp", (hp / hpMax).toFixed(3));
        const red = bar.querySelector("b");
        if (was > hp) {
          bar.style.setProperty("--was", (was / hpMax).toFixed(3));
          red.style.animation = "none";
          void red.offsetWidth;
          red.style.animation = "";
          sfx.hit();
          hurt(d);
        } else {
          bar.style.setProperty("--was", (hp / hpMax).toFixed(3));
          red.style.animation = "none";
          if (l4 && was >= 0 && hp > was) {
            d.classList.remove("l4-heal");
            void d.offsetWidth;
            d.classList.add("l4-heal");
          } // (Quacky Zombies: 1 HP back, a green glow that fades)
        }
      }
    }
    const at = seatAt(s, id) || place(pos, lane.indexOf(id), lane.length),
      z = liftOf(id, pos);
    const mine = id === R.me;
    const face =
      seatOf(s, id) >= 0
        ? seatOf(s, id)
          ? -1
          : 1
        : mine && me
          ? me.face
          : (hang && world.face(id)) ||
            (d._x !== undefined && Math.abs(pos.x - d._x) > 0.0005
              ? Math.sign(pos.x - d._x)
              : d._face || 1);
    d._face = face || 1;
    d._x = pos.x;
    const q = mine ? (now - squash.t < 170 ? squash.q : "") : pos.q || "";
    const fx = turned() ? 1 : d._face,
      mq = fx < 0 ? { l: "r", r: "l" }[q] || q : q,
      [org, sx, sy] = SQ[mq] || ["50% 100%", 1, 1];
    const tr = `translate(${at.left.toFixed(1)}px, ${at.top.toFixed(1)}px)`,
      lift = `translateY(${(-z).toFixed(1)}px)`;
    const deadPose =
      dead && !(p.duck && (p.duck.image || p.duck.style === "jack")); // (Jack in a Box flops over in his own drawing)
    const body = `scaleX(${fx})${deadPose ? " rotate(-100deg) translateY(-12%)" : ""}`,
      squish = `scale(${sx}, ${sy})`,
      sh = (1 - Math.min(0.6, z / (size * 3.2))).toFixed(3);
    if (d._tr !== tr) {
      d._tr = tr;
      d.style.transform = tr;
      if (!hang) d.style.zIndex = Math.round(at.top);
    }
    if (hang) {
      // Hangout: in front of what it stands in front of; unseen through the cabin's walls
      const zi = world.key(id, pos),
        hid = world.hidden(id, pos);
      if (d._zi !== zi) {
        d._zi = zi;
        d.style.zIndex = zi;
      }
      if (d._hid !== hid) {
        d._hid = hid;
        d.classList.toggle("hang-hid", hid);
      }
    }
    if (d._sz !== size) {
      d._sz = size;
      d.style.setProperty("--sz", size + "px");
    }
    if (d._lift !== lift) {
      d._lift = lift;
      d.querySelector(".gduck-lift").style.transform = lift;
    }
    if (d._sh !== sh) {
      d._sh = sh;
      d.querySelector(".gduck-shadow").style.transform =
        `translateX(-50%) scale(${sh})`;
    }
    if (d._body !== body) {
      d._body = body;
      d.querySelector(".gduck-body").style.transform = body;
    }
    const pic = d.querySelector(".gduck-body svg");
    if (pic && pic._sq !== squish + org) {
      pic._sq = squish + org;
      pic.style.transformOrigin = org;
      pic.style.transform = squish;
    }
    if (d._j !== pos.j) {
      d._j = pos.j;
      if (pos.j && pic && pic.classList.contains("jack")) {
        pic.classList.remove("bob");
        pic.getBoundingClientRect();
        pic.classList.add("bob");
      }
    } // Jack in a Box bobs on his spring as he jumps
    d.classList.toggle("sprint", mine ? sprinting && moving : !!pos.sp);
    d.classList.toggle("air", z > 1 && !seated(s, id)); // (sitting on a chair isn't flying)
    d.classList.toggle("left", d._face < 0);
    d.querySelector(".gduck-done").hidden = !s.done[id];
    d.classList.toggle("idle", !!p.idle); // gone quiet: Zs float up
    d.classList.toggle(
      "jet-on",
      !!(jet && (id === R.me ? me : s.pos[id] || {}).jt),
    ); // (the jetpack's jets: their flames)
    /* effects from the number keys, around the head (5 seconds, or kept on); the Loser's X is the big one; the
       Invisible duck turns the duck and its shadow see-through, as the shadow duck (css: .gduck.see) */
    const auras = [];
    let see = false;
    for (const [k, u] of Object.entries((s.aura || {})[id] || {}))
      if (!u || u > now) {
        if (k === "loserx") wearsX.add(id);
        else if (k === "ducklings") brood.push([id, pos, at, p.duck]);
        else if (k === "invisible") see = true;
        else auras.push(k);
      }
    if (d._see !== see) {
      d._see = see;
      d.classList.toggle("see", see);
    }
    const au = auras.sort().join();
    if (d._aura !== au) {
      d._aura = au;
      const a = d.querySelector(".gduck-aura");
      if (a) a.innerHTML = auras.map((k) => momentHTML(k, p.duck)).join("");
    }
    trail(d, pos); // (where it walked: the ducklings follow it)
    const shown =
      shows[id] &&
      now < shows[id].until &&
      shows[id].what !== "dagger" &&
      shows[id].what !== "grenade" &&
      shows[id].what; // (a dagger or a grenade thrown without keeping it out: only the one in the air)
    const w =
      (id === JUSTIN_ID || id === JUSTIN2) && isMgj(s)
        ? !mgjGone(s, now) &&
          (shows[id] && now < shows[id].until ? shows[id].what : pos.w)
        : (isMgj(s) && s.phase === "boss"
            ? (mine ? held : jaimes.includes(id) ? "knife" : pos.w) || "knife"
            : jm[id]
              ? "knife" // (the Jaime special's, and Quacky Zombies' Jaime: his knife always out)
              : isL4dd(s)
                ? l4Hp(s, id) > 0 && inHand(mine ? heldNow() : pos.w, s, id)
                : mine
                  ? held && hasKey(p.duck, held) && held
                  : pos.w) || shown; // (Quacky Zombies: in hand while it's up) // (Mad God Justin: every duck's knife always out; his hammer swing over his gun)   // (Mad God Justin: every duck's knife always out)   // (a dagger thrown without keeping it out: only the one in the air)
    if (w) arms.push([id, w, pos, p.duck, mine]);
    if (pos.dj && d._dj !== pos.dj) {
      d._dj = pos.dj;
      if (now - pos.dj < 700)
        puffs.push([at.left, at.top - z, colorsOf(p.duck, "double")[0]]);
    } // a double jump: a little cloud where it began
    const lx = losers.has(id) || wearsX.has(id);
    if (d._lx !== lx) {
      d._lx = lx;
      d.classList.toggle("loser", lx);
    } // the Loser's X special
    const gr = !!greyNow(id);
    if (d._gr !== gr) {
      d._gr = gr;
      d.classList.toggle("grey", gr);
    } // Who is the Quack?: out this round
    const bw = dnGrey(s, id, now) || (isVd(s) && turnedDown(s, id));
    if (d._bw !== bw) {
      d._bw = bw;
      d.classList.toggle("dn-bw", bw);
    } // Duncelation: a dunce, in black and white (Valentine's Duck Date: Turned Down)
    const gone = id === JUSTIN_ID && mgjGone(s, now);
    if (d._gone !== gone) {
      d._gone = gone;
      d.classList.toggle("mgj-gone", gone);
    } // Mad God Justin: faded away for the meteor
    if (id === GOOD_ID && !d._gj) {
      d._gj = true;
      d.classList.add("mgj-good");
    } // (Good Justin God fades in)
    const zapT =
        id === JUSTIN_ID &&
        isMgj(s) &&
        s.phase === "mgjend" &&
        !!(s.mgj && s.mgj.won)
          ? now - s.at - MGJ_ZAP
          : -1,
      scorched =
        zapT >= 0 && zapT < 4000 ? 1 : zapT >= 4000 && zapT < 6600 ? 2 : 0;
    if (d._sco !== scorched) {
      d._sco = scorched;
      d.classList.toggle("mgj-burnt", scorched === 1);
      d.classList.toggle("mgj-unburn", scorched === 2);
    } // (burnt by the lightning on the podium, then the burn fades like a fire's: 4 s, then 2.5 s)
    /* Mad God Justin: nothing can hurt it for a second after a hit, and it flickers meanwhile; a fireball's burn: one
       big flame over the duck, then charred, then the burn fades (the rules keep s.mgj.burn and burnt) */
    const blink = isMgj(s) && s.phase === "boss" && mgjSafe(s, id, now);
    if (d._blink !== blink) {
      d._blink = blink;
      d.classList.toggle("mgj-blink", blink);
    }
    const bn =
      isMgj(s) && s.mgj && s.phase === "boss"
        ? (s.mgj.burn || {})[id] > now
          ? 2
          : (s.mgj.burnt || {})[id] > now
            ? 1
            : 0
        : isL4dd(s) && ((s.hang.l4fire || {}).p || {})[id] > now
          ? 3
          : 0; // (Quacky Zombies: on fire, BURN.P)
    if ((d._bn || 0) !== bn) {
      const was = d._bn || 0;
      d._bn = bn;
      d.classList.toggle("onfire", bn >= 2);
      d.classList.toggle("burnt", bn === 1);
      if (bn === 2) sfx.burn(Math.max(0.3, (s.mgj.burn[id] - now) / 1000));
      if (bn === 3) sfx.burn(BURN.P / 1000);
      if (!bn && was && was < 3) {
        d.classList.add("unburn");
        setTimeout(() => d.classList.remove("unburn"), 2600);
      }
    }
    const op = podLift(s, id, now) > 0.2;
    if (d._op !== op) {
      d._op = op;
      d.classList.toggle("on-pod", op);
    } // (on the podium: no shadow on the ground below it)
    const say = bubbles[id],
      saying = !!say && now < say.until; // their newest chat message, for a few seconds
    if (saying) {
      const sb = d.querySelector(".gduck-say");
      if (sb._n !== say.n) {
        sb._n = say.n;
        sb.textContent = say.text;
      }
    }
    if (d._saying !== saying) {
      d._saying = saying;
      d.classList.toggle("saying", saying);
    }
    if (saying && d._sayAt !== tr + lift + say.n + Math.floor(now / 250)) {
      // (the bubble stays inside the board: under the name tag at its top, slid in at its sides)
      d._sayAt = tr + lift + say.n + Math.floor(now / 250);
      const sb = d.querySelector(".gduck-say"),
        bw = sb.offsetWidth,
        bh = sb.offsetHeight,
        lay = layer.getBoundingClientRect(),
        br = ($(".cols", board) || board).getBoundingClientRect();
      const cx = lay.left + at.left,
        feet = lay.top + at.top - z,
        top = feet - size * 1.08 - bh - 4; // (where the duck is going, not where its glide has got to)
      const dx = Math.round(
          Math.max(
            br.left + 4 - (cx - bw / 2),
            Math.min(0, br.right - 4 - (cx + bw / 2)),
          ),
        ),
        l = cx + dx - bw / 2;
      let below = top < br.top; // (over the board's top, or over what sits on it: the question's cloud and its writer)
      for (const e of S.querySelectorAll(".topover > *")) {
        const q = e.getBoundingClientRect();
        if (
          q.width &&
          q.left < l + bw &&
          q.right > l &&
          q.top < top + bh &&
          q.bottom > top
        )
          below = true;
      }
      if (d._below !== below) {
        d._below = below;
        d.classList.toggle("say-below", below);
      }
      if (d._sdx !== dx) {
        d._sdx = dx;
        sb.style.setProperty("--say-dx", dx + "px");
      }
    }
    /* free roam: a see-through bubble in the color of the column the duck stands on (its vote) */
    const bub =
      s.options.freeRoam &&
      s.phase === "answer" &&
      pos.x >= 0 &&
      id !== JUSTIN_ID
        ? colAt(s, pos.x)
        : -1;
    if (d._bub !== bub) {
      d._bub = bub;
      d.classList.toggle("bubbled", bub >= 0);
      if (bub >= 0)
        d.style.setProperty(
          "--bub",
          isBb(s)
            ? `var(--seed-${bub ? "b" : "a"})`
            : isWyr(s) || isDdr(s)
              ? `var(--wyr-${bub ? "b" : "a"})`
              : `var(--c${bub + 1})`,
        );
    }
    /* Lawyering: a ring on the ground in the color of the side a juror stands on, faint until they vote for it */
    const ring = lawRing(s, id, pos);
    if (d._ring !== ring) {
      d._ring = ring;
      if (ring) d.dataset.ring = ring;
      else delete d.dataset.ring;
    }
    boxes.push({
      l: at.left - size / 2,
      r: at.left + size / 2,
      t: at.top - size - z,
      b: at.top - z,
    });
  }
  layer.querySelectorAll(".gduck").forEach((d) => {
    if (
      !s.pos[d.dataset.pid] &&
      !(jp && d.dataset.pid === JUSTIN_ID) &&
      !(jp2 && d.dataset.pid === JUSTIN2) &&
      !jm[d.dataset.pid] &&
      !bodyOf(d.dataset.pid)
    )
      d.remove();
  });
  /* the handgun's bullets and the thrown daggers, flying the way they were aimed */
  const fxl = $(".fxl", board),
    live = new Set();
  for (const [x, y, c] of puffs) {
    const pf = el(puffHTML(x, y, size, c));
    fxl.append(pf);
    setTimeout(() => pf.remove(), 1000);
  }
  for (const sh of s.shots || []) {
    if (!sh.k) continue;
    const at = shotAt(sh, now - sh.t),
      a = hang ? world.place(at, sh.hz) : place({ x: at.x, y: at.y }, 0, 1),
      top = a.top - at.z * size; // (Hangout: at the height it was fired from)
    if (hang && world.hidden("", at)) continue; // (on the other side of the cabin's walls)
    if (
      a.left < -geo.W * 0.4 ||
      a.left > geo.W * 1.4 ||
      top > geo.top0 + geo.H + size * 6 ||
      top < -geo.H
    )
      continue; // (off the screen)
    live.add(String(sh.n));
    let b = fxl.querySelector(`[data-n="${sh.n}"]`);
    if (!b) {
      const duck = (
          s.players[sh.by] || (sh.by === JUSTIN_ID ? JUSTIN_PLAYER : {})
        ).duck,
        [vx, vy] = toScreen(sh.vx, sh.vy);
      b =
        sh.k === "arrow" || sh.k === "fireball"
          ? el(
              `<div class="bullet k-${sh.k}" data-n="${sh.n}" style="--s:${size.toFixed(0)}px;--ang:${Math.atan2(vy, vx).toFixed(3)}rad">${sh.k === "arrow" ? ARROW : FIREBALL}</div>`,
            ) // (the bow's arrow, Mad God Justin's fireball: pointing the way they fly)
          : sh.k === "controller" || sh.k === "chair"
            ? el(
                `<div class="thrown mgj-throw k-${sh.k}" data-n="${sh.n}" style="--s:${size.toFixed(0)}px"><i class="${vx < 0 ? "ccw" : ""}">${sh.k === "chair" ? CHAIR : CONTROLLER}</i></div>`,
              )
            : sh.k === "dagger" || sh.k === "grenade" || sh.k === "lgren"
              ? el(
                  `<div class="thrown${sh.k !== "dagger" ? " grenade" : ""}" data-n="${sh.n}" style="--s:${size.toFixed(0)}px"><i class="${vx < 0 ? "ccw" : ""}">${sh.k !== "dagger" ? GRENADE(colorsOf(duck, "grenade"), false) : daggerHTML(duck)}</i></div>`,
                ) // (the grenade launcher's fly as the thrown ones, straight)
              : ROUNDS_ART[sh.k]
                ? el(
                    `<div class="bullet k-${sh.k}" data-n="${sh.n}" style="--ang:${Math.atan2(vy, vx).toFixed(3)}rad;--w:${ROUNDS_ART[sh.k].w}px">${ROUNDS_ART[sh.k].svg}</div>`,
                  ) // (Quacky Zombies' new guns: each its own bullet)
                : el(
                    `<div class="bullet${sh.k === "pellet" ? " pellet" : ""}" data-n="${sh.n}" style="--ang:${Math.atan2(vy, vx).toFixed(3)}rad">${BULLET(colorsOf(duck, "handgun")[2])}</div>`,
                  );
      fxl.append(b);
      if (sh.k === "grenade" && now - sh.t < 400) {
        const pin = el(
          `<div class="gpin" style="--s:${size.toFixed(0)}px;transform:translate(${a.left.toFixed(1)}px, ${top.toFixed(1)}px)"><i class="${vx < 0 ? "ccw" : ""}">${GRENADE_PIN(colorsOf(duck, "grenade"))}</i></div>`,
        );
        fxl.append(pin);
        setTimeout(() => pin.remove(), 1300);
      } // (its pin stays behind: it drops from the hand and fades)
    }
    b.style.transform = `translate(${a.left.toFixed(1)}px, ${top.toFixed(1)}px)`;
  }
  fxl.querySelectorAll(".bullet, .thrown").forEach((b) => {
    if (!live.has(b.dataset.n)) b.remove();
  });
  /* the handgun or the dagger in hand, turned toward where it aims: my mouse, or the aim the others sent */
  const handed = new Set();
  for (const [id, w, pos, duck, mine] of arms) {
    const c = bodyAt(id, pos, now),
      sh = shows[id] && now < shows[id].until ? shows[id] : null;
    let dir = null;
    if (mine && keyAim) dir = keyAim;
    else if (mine && mouse) {
      const r = board.getBoundingClientRect();
      dir = [mouse.x - r.left - c.left, mouse.y - r.top - c.top];
    } else if (sh && (!pos.w || mine)) dir = toScreen(sh.ax, sh.ay);
    else if (pos.ax !== undefined) dir = toScreen(pos.ax, pos.ay);
    const dk = layer.querySelector(`[data-pid="${CSS.escape(id)}"]`),
      ang =
        dir && Math.hypot(dir[0], dir[1]) > 1
          ? Math.atan2(dir[1], dir[0])
          : dk && dk._face < 0
            ? Math.PI
            : 0;
    handed.add(id);
    let h = fxl.querySelector(`.held[data-pid="${id}"]`);
    const hk = w + (w === "hammer" && duck && duck.wrench ? "-w" : ""); // (the hammer, or the wrench in its place)
    if (!h || h._k !== hk) {
      if (h) h.remove();
      h = el(
        `<div class="held" data-pid="${esc(id)}" data-w="${w}" style="--s:${size.toFixed(0)}px"><i>${heldHTML(w, duck)}</i></div>`,
      );
      h._k = hk;
      fxl.append(h);
    }
    /* the knife jabs out and back; the hammer rests over the shoulder, then swings from behind the head down through the
       aim. Turned toward the aim, its offsets mirror for a duck facing left, so the swing always goes over the top */
    const left = Math.cos(ang) < 0,
      st = sh && sh.t !== undefined ? Math.min(1, (now - sh.t) / 1000) : 1;
    let out = 0.42,
      turn = 0;
    const jab = isL4dd(s) ? 0.125 : 0.25; // (Quacky Zombies: the knife swings twice as fast)
    if (w === "knife")
      out = 0.44 + (st < jab ? 0.26 * Math.sin((Math.PI * st) / jab) : 0);
    if (w === "hammer") {
      out = 0.55;
      turn =
        st < 0.04
          ? -70 - (45 * st) / 0.04
          : st < 0.11
            ? -115 + 165 * ((st - 0.04) / 0.07) ** 1.6
            : st < 0.5
              ? 50
              : 50 - 120 * Math.min(1, (st - 0.5) / 0.3);
    }
    const rot = ang + ((left ? -1 : 1) * turn * Math.PI) / 180;
    const tr = `translate(${c.left.toFixed(1)}px, ${c.top.toFixed(1)}px) rotate(${rot.toFixed(3)}rad) translateX(${(size * out).toFixed(1)}px) scaleY(${left ? -1 : 1})`;
    if (h._tr !== tr) {
      h._tr = tr;
      h.style.transform = tr;
    }
    if (w === "chaingun") {
      // where its barrel ends on the board, so its lines come out of there and nowhere else (the l4line fx)
      const wd = size * GUNS.chaingun.w,
        along = size * out + wd * (TRACE.tip[0] / TRACE.box[0] - 0.5),
        down =
          ((wd * TRACE.box[1]) / TRACE.box[0]) *
          (TRACE.tip[1] / TRACE.box[1] - 0.5) *
          (left ? -1 : 1);
      h._tip = [
        c.left + Math.cos(rot) * along - Math.sin(rot) * down,
        c.top + Math.sin(rot) * along + Math.cos(rot) * down,
        rot,
      ];
    }
    h.classList.toggle(
      "thrown-now",
      (w === "dagger" || w === "grenade") && !!sh && now < sh.until - 500,
    ); // (the dagger or the grenade just thrown: a new one comes to hand)
  }
  fxl.querySelectorAll(".held").forEach((h) => {
    if (!handed.has(h.dataset.pid)) h.remove();
  });
  /* ducklings: three in a row behind their duck, along the way it walked */
  const kids = new Set();
  for (const [id, pos, at, duck] of brood) {
    const d = layer.querySelector(`[data-pid="${id}"]`),
      path = (d && d._trail) || [];
    for (let i = 0; i < 3; i++) {
      const spot = along(path, at, (i + 1) * size * 0.4, d ? d._face : 1),
        key = id + " " + i;
      kids.add(key);
      let k = layer.querySelector(`.duckling[data-k="${CSS.escape(key)}"]`);
      if (!k) {
        k = el(
          `<div class="duckling" data-k="${esc(key)}" style="--s:${size.toFixed(0)}px;--i:${i}"><i>${DUCKLING(colorsOf(duck, "ducklings"))}</i></div>`,
        );
        layer.append(k);
      }
      const tr = `translate(${spot.left.toFixed(1)}px, ${spot.top.toFixed(1)}px) scaleX(${spot.face})`;
      if (k._tr !== tr) {
        k._tr = tr;
        k.style.transform = tr;
        k.style.zIndex = Math.round(spot.top);
      }
      k.classList.toggle("walk", !!(d && d._walk && now - d._walk < 200));
    }
  }
  layer.querySelectorAll(".duckling").forEach((k) => {
    if (!kids.has(k.dataset.k)) k.remove();
  });
  let mark = layer.querySelector(".touch-mark");
  if (target && target.mark) {
    if (!mark) {
      mark = el('<div class="touch-mark"></div>');
      layer.prepend(mark);
    }
    const a = place(target, 0, 1),
      tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px)`;
    if (mark._tr !== tr) {
      mark._tr = tr;
      mark.style.transform = tr;
    }
    mark.classList.remove("gone");
    mark.classList.toggle("sprint", !!target.sprint);
  } else if (mark) mark.classList.add("gone");
  // hotdogs hang around their duck, then fade; an item (mug, gun, spray, trombone) stays with its duck while it walks
  // (Hangout: sorted with their duck, so the stage or a couch covers them too)
  const withDuck = (e, id, pos) => {
    if (e.parentNode !== layer) layer.append(e);
    const zi = world.key(id, pos) + 1;
    if (e._zi !== zi) {
      e._zi = zi;
      e.style.zIndex = zi;
    }
  };
  hotdogs = hotdogs.filter((h) => {
    if (now > h.until || !s.pos[h.id]) {
      h.el.remove();
      return false;
    }
    return true;
  });
  for (const h of hotdogs) {
    const pos = posOf(h.id),
      at = place(pos, lane.indexOf(h.id), lane.length),
      z = liftOf(h.id, pos);
    if (hang) {
      h.el.style.visibility = world.hidden(h.id, pos) ? "hidden" : "";
      withDuck(h.el, h.id, pos);
    }
    const hd = layer.querySelector(`[data-pid="${h.id}"]`),
      side = (turned() ? 1 : hd && hd._face) || 1; // (the hotdog is at the beak of the way the duck faces)
    h.el.style.transform = `translate(${(at.left + side * size * 0.62).toFixed(1)}px, ${(at.top - size * 0.9 - z).toFixed(1)}px)`;
    h.el.classList.toggle("going", now > h.until - 900);
  }
  follows = follows.filter((f) => {
    if (now > f.until || !s.pos[f.id]) {
      f.el.remove();
      return false;
    }
    return true;
  });
  for (const f of follows) {
    const pos = posOf(f.id),
      at = place(pos, lane.indexOf(f.id), lane.length),
      z = liftOf(f.id, pos);
    if (hang) {
      f.el.style.visibility = world.hidden(f.id, pos) ? "hidden" : "";
      withDuck(f.el, f.id, pos);
    }
    /* I want the item to turn with its duck: it was drawn for the way the duck faced when it began, so a duck that now
       faces the other way flips it (and the way it sits at the beak) */
    const dk = layer.querySelector(`[data-pid="${f.id}"]`),
      turn = (turned() ? 1 : dk && dk._face ? dk._face : f.face) * f.face;
    const tr = `translate(${at.left.toFixed(1)}px, ${(at.top - z).toFixed(1)}px) scaleX(${turn})`;
    if (f.el._tr !== tr) {
      f.el._tr = tr;
      f.el.style.transform = tr;
    }
  }
  if (geo.sc) {
    storyMarks(s, board);
    return;
  }
  if (hang) {
    placeCake(board, s, now);
    return;
  } // (no columns, no cloud; the Zebra cake special's cake, though)
  // the column under my duck lights up
  const myCol =
    me && me.x >= 0
      ? isQuack(s)
        ? spotOf(s, me)
        : isVd(s)
          ? vdTileAt(s, me)
          : colAt(s, me.x)
      : -1;
  board
    .querySelectorAll(isVd(s) ? ".vd-tile" : ".col, .wq-tile")
    .forEach((c) => c.classList.toggle("here", +c.dataset.c === myCol));
  const vb = S.querySelector(".vote-btn");
  if (vb && vb.dataset.col !== String(myCol)) {
    vb.dataset.col = myCol;
    if (isLaw(s) || isDn(s) || isVd(s)) setHTML($(".gact", S), actHTML(s));
  } // (Lawyering, Duncelation: Vote, Voted or Change vote; Valentine's Duck Date: whom Turn down turns down)
  placeRing(board);
  placePodium(board, now);
  placeTable(board);
  placeTiles(board);
  placePick(board, s);
  placeDesk(board, s, now);
  placeCake(board, s, now);
  placeSnack(board, s, now);
  placeEdge(board, s, now);
  // the Round Lord and the question turn see-through over ducks
  for (const o of board.querySelectorAll(
    ".topover .lord, .topover .question, .topover .wq-sidecol",
  )) {
    const r = o.getBoundingClientRect(),
      L = r.left - geo.left,
      T = r.top - geo.top;
    const hit = boxes.some(
      (b) => b.r > L && b.l < L + r.width && b.b > T && b.t < T + r.height,
    );
    o.classList.toggle("see-through", hit);
  }
}
/* ---------- Lawyering: the attorneys' circle ---------- */
/* its half width and half height: a circle filling the strip between the sides; on a phone held upright the strip runs
   across the screen, so the circle stretches along it and both attorneys fit side by side */
const ringR = () =>
  turned()
    ? [geo.W * 0.8 * 0.3, geo.H * (LAW_MID[1] - LAW_MID[0]) * 0.46]
    : Array(2).fill(geo.W * (LAW_MID[1] - LAW_MID[0]) * 0.46);
function placeRing(board) {
  const ring = board.querySelector(".law-ring");
  if (!ring || !geo) return;
  const c = place({ x: 0.5, y: 0.5 }, 0, 1),
    [rx, ry] = ringR(),
    st = `${(c.left - rx).toFixed(1)},${(c.top - geo.size * 0.3 - ry).toFixed(1)},${(2 * rx).toFixed(1)},${(2 * ry).toFixed(1)}`;
  if (ring._st === st) return;
  ring._st = st;
  const [l, t, w, h] = st.split(",");
  Object.assign(ring.style, {
    left: l + "px",
    top: t + "px",
    width: w + "px",
    height: h + "px",
  });
}
/* an attorney's feet stay inside the circle */
function inRing(x, y) {
  const c = place({ x: 0.5, y: 0.5 }, 0, 1),
    a = place({ x, y }, 0, 1),
    [rx, ry] = ringR().map((r) =>
      Math.max(4, r - geo.size * (turned() ? 0.42 : 0.2)),
    );
  const dx = a.left - c.left,
    dy = a.top - c.top,
    k = Math.hypot(dx / rx, dy / ry);
  if (k <= 1) return [x, y];
  const u = unplace(c.left + dx / k, c.top + dy / k);
  return [u.x, u.y];
}
const attorney = () =>
  ["answer", "discuss"].includes(R.state.phase) &&
  ((isLaw(R.state) && !!R.state.law && isCounsel(R.state, R.me)) ||
    (isDn(R.state) && isDefender(R.state, R.me))); // (Duncelation: the defender)
/* a juror's ring: 'a' or 'b' (the side), with ' faint' until they've voted for that side */
function lawRing(s, id, pos) {
  if (isDn(s)) {
    // Duncelation: a voter's ring, the same way
    const C = s.dn && s.dn.cur;
    if (
      !C ||
      id === JUSTIN_ID ||
      !["answer", "discuss"].includes(s.phase) ||
      isDefender(s, id) ||
      (s.players[id] || {}).late
    )
      return "";
    const v = C.votes[id],
      c =
        s.phase === "answer" ? (pos.x >= 0 ? colAt(s, pos.x) : -1) : (v ?? -1);
    return c < 0 ? "" : (c ? "b" : "a") + (v === c ? "" : " faint");
  }
  const L = s.law;
  if (
    !isLaw(s) ||
    !L ||
    id === JUSTIN_ID ||
    !["answer", "discuss"].includes(s.phase) ||
    isCounsel(s, id) ||
    (s.players[id] || {}).late
  )
    return "";
  const v = L.votes[id],
    c = s.phase === "answer" ? (pos.x >= 0 ? colAt(s, pos.x) : -1) : (v ?? -1);
  return c < 0 ? "" : (c ? "b" : "a") + (v === c ? "" : " faint");
}
const caseKey = (s) => [s.startedAt, s.round, s.qi].join();

/* ---------- Duncelation: the dunce's look, and the podium ---------- */
/* a dunce wears the dunce hat (in its moment, from the first strike) and goes black and white (from the third) */
const dnHat = (s, id, now) =>
  isDn(s) &&
  wearsDunce(s, id) &&
  !(s.phase === "dunced" && isDefender(s, id) && now - s.at < DN_HAT);
const dnGrey = (s, id, now) =>
  isDn(s) &&
  wearsDunce(s, id) &&
  !(s.phase === "dunced" && isDefender(s, id) && now - s.at < DN_BW);
/* the LOSER podium rises in the circle under the dunce: its height in duck sizes, and how far up it is (0 … 1) */
const POD_H = 0.8;
const podUp = (s, now) =>
  isDn(s) && s.phase === "dunced"
    ? Math.max(0, Math.min(1, (now - s.at - DN_PODIUM) / 450))
    : isMgj(s) && s.phase === "mgjend" && s.mgj && s.mgj.won
      ? Math.max(0, Math.min(1, (now - s.at - 400) / 450))
      : 0; // (Mad God Justin: his, as he loses)
const podLift = (s, id, now) =>
  isDefender(s, id) || (id === JUSTIN_ID && isMgj(s))
    ? podUp(s, now) * POD_H
    : 0;
function placePodium(board, now) {
  const pod = board.querySelector(".dn-podium");
  if (!pod || !geo) return;
  const s = R.state,
    c = place(isMgj(s) ? MGJ_POD : { x: 0.5, y: 0.5 }, 0, 1),
    up = podUp(s, now),
    w = geo.size * 2,
    h = geo.size * (POD_H + 0.14);
  if (board._podUp !== up > 0) {
    board._podUp = up > 0;
    board.classList.toggle("pod-up", up > 0);
  } // (the duck on the podium wears its own name tag, so the cloud's goes)
  const st = `${(c.left - w / 2).toFixed(1)},${(c.top - h + geo.size * 0.14 + (1 - up) * h).toFixed(1)},${w.toFixed(1)},${h.toFixed(1)},${up.toFixed(2)},${Math.round(c.top - 1)}`;
  if (pod._st === st) return;
  pod._st = st;
  const [l, t, ww, hh, u, z] = st.split(",");
  Object.assign(pod.style, {
    left: l + "px",
    top: t + "px",
    width: ww + "px",
    height: hh + "px",
    opacity: Math.min(1, +u * 3),
    zIndex: z,
    clipPath: `inset(0 0 ${((1 - u) * 100).toFixed(1)}% 0)`,
  });
}

/* ---------- Valentine's Duck Date: the table, its chairs and the two seated at it; the pick's tiles ---------- */
/* the table's feet on this screen, and its width */
const tableAt = () => {
  const c = place(VD_TABLE, 0, 1);
  return { ...c, w: geo.size * TABLE_W };
};
/* where a duck at the table is drawn: right beside it on this screen, whatever the board's shape (null: not seated) */
function seatAt(s, id) {
  const k = seatOf(s, id);
  if (k < 0 || !geo) return null;
  const c = tableAt();
  return { left: c.left + (k ? 1 : -1) * SEAT_OUT * geo.size, top: c.top };
}
/* the table stands just behind the two at it (their name tags stay in sight) and keeps its place in depth with everyone
   walking about; each chair stands just behind its duck */
function placeTable(board) {
  const tb = board.querySelector(".vd-table");
  if (!tb || !geo) return;
  const c = tableAt(),
    h = (c.w * 150) / 240,
    cw = geo.size * 0.8,
    ch = (cw * 132) / 80,
    st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${c.w.toFixed(1)}`;
  if (tb._st === st) return;
  tb._st = st;
  Object.assign(tb.style, {
    left: (c.left - c.w / 2).toFixed(1) + "px",
    top: (c.top - (h * 138) / 150).toFixed(1) + "px",
    width: c.w.toFixed(1) + "px",
    height: h.toFixed(1) + "px",
    zIndex: Math.round(c.top) - 1,
  });
  for (const ch0 of board.querySelectorAll(".vd-chair")) {
    const k = +ch0.dataset.k,
      x = c.left + (k ? 1 : -1) * (SEAT_OUT + 0.12) * geo.size;
    Object.assign(ch0.style, {
      left: (x - cw / 2).toFixed(1) + "px",
      top: (c.top - (ch * 128) / 132).toFixed(1) + "px",
      width: cw.toFixed(1) + "px",
      height: ch.toFixed(1) + "px",
      zIndex: Math.round(c.top) - 2,
    });
  }
}
/* the pick's tiles, on the same spots as the host's (so a duck is on the tile it looks to be on) */
function placeTiles(board) {
  const box = board.querySelector(".vd-tiles");
  if (!box || !geo) return;
  const rs = vdTileRects(box.children.length),
    st = `${geo.W},${geo.H},${geo.size},${rs.length}`;
  if (box._st === st) return;
  box._st = st;
  [...box.children].forEach((t, k) => {
    const a = place({ x: rs[k].x0, y: rs[k].y0 }, 0, 1),
      b = place({ x: rs[k].x1, y: rs[k].y1 }, 0, 1);
    Object.assign(t.style, {
      left: a.left.toFixed(1) + "px",
      top: a.top.toFixed(1) + "px",
      width: (b.left - a.left).toFixed(1) + "px",
      height: (b.top - a.top).toFixed(1) + "px",
    });
  });
}

/* Mad God Justin: his Xbox's desk, where it came in; dark once he turns it off, gone a moment after he's back */
function placeDesk(board, s, now) {
  const x = isMgj(s) && s.mgj && s.mgj.xb,
    layer = $(".ducks", board);
  let n = layer && layer.querySelector(".mgj-desk");
  const on =
    !!x &&
    ["boss", "mgjend"].includes(s.phase) &&
    (!x.done || now - x.done < XB.OUT);
  if (n && (!on || +n.dataset.at !== x.at)) {
    n.remove();
    n = null;
  }
  if (!on || !layer || !geo) return;
  if (!n) {
    n = el(`<div class="mgj-desk" data-at="${x.at}">${DESK}</div>`);
    n.style.setProperty("--in", XB.IN + "ms");
    n.style.setProperty("--out", XB.OUT + "ms");
    layer.append(n);
  }
  n.classList.toggle("off", !!x.off && now >= x.off);
  n.classList.toggle("out", !!x.done);
  const c = place(x, 0, 1),
    w = geo.size * 2.2,
    st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${w.toFixed(1)}`;
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: c.left + "px",
    top: c.top + "px",
    width: w + "px",
    zIndex: Math.round(c.top - 3),
  });
}

/* Mad God Justin: the pickup that faded in, where it lies (it goes once taken, or when the next one comes) */
function placePick(board, s) {
  const P = isMgj(s) && s.phase === "boss" && s.mgj && s.mgj.pick,
    layer = $(".ducks", board);
  let n = layer && layer.querySelector(".mgj-pick");
  if (n && (!P || +n.dataset.n !== P.n)) {
    n.remove();
    n = null;
  }
  if (!P || !layer || !geo) return;
  if (!n) {
    n = el(mgjPickHTML(P));
    n.style.setProperty("--fade", PICK_FADE + "ms");
    layer.append(n);
  }
  const c = place(P, 0, 1),
    w = geo.size * 0.9,
    st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${w.toFixed(1)}`;
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: c.left + "px",
    top: c.top + "px",
    width: w + "px",
    height: w + "px",
    zIndex: Math.round(c.top - 2),
  });
}

/* Mad God Justin's zebra cake, or the Zebra cake special's (s.zcake): spinning on its way, then lying where it landed
   until Justin eats it (Hangout: hidden on the other side of the cabin's walls) */
function placeCake(board, s, now) {
  const c = isMgj(s)
      ? s.phase === "boss" && s.mgj && s.mgj.cake
      : boardPhases(s).includes(s.phase) && s.zcake,
    layer = $(".ducks", board);
  let n = layer && layer.querySelector(".mgj-cake");
  if (n && (!c || c.eat || +n.dataset.n !== c.n)) {
    n.remove();
    n = null;
  }
  if (!c || c.eat || !layer || !geo) return;
  if (!n) {
    n = el(
      `<div class="mgj-cake" data-n="${c.n}"><i class="${c.vx < 0 ? "ccw" : ""}">${ZEBRA}</i></div>`,
    );
    layer.append(n);
  }
  n.classList.toggle("down", now >= c.stop);
  const p = cakeAt(c, now),
    at = place(p, 0, 1),
    w = geo.size * 0.7;
  Object.assign(n.style, {
    left: at.left.toFixed(1) + "px",
    top: (at.top - w * 0.3).toFixed(1) + "px",
    width: w.toFixed(1) + "px",
    zIndex: geo.hang ? world.key("", p) - 1 : Math.round(at.top - 1),
    visibility: geo.hang && world.hidden("", p) ? "hidden" : "",
  });
}
/* Mad God Justin's snack (a look only), or the zebra cake he picked up (the board's Justin too: the Zebra cake
   special): at his beak, the way he faces, a bite at a time (his double eats too) */
function placeSnack(board, s, now) {
  const e =
      (isMgj(s) ? s.phase === "boss" : justinShown(s)) &&
      s.justin &&
      s.justin.eat,
    layer = $(".ducks", board);
  if (!layer) return;
  for (const id of [JUSTIN_ID, JUSTIN2]) {
    let n = layer.querySelector(`.mgj-snack[data-pid="${id}"]`);
    const dk = layer.querySelector(`.gduck[data-pid="${id}"]`);
    if (n && (!e || !dk || n.dataset.k !== `${e.k} ${e.at}`)) {
      n.remove();
      n = null;
    }
    if (!e || !dk || !geo || now >= e.until) continue;
    if (!n) {
      n = el(
        `<div class="mgj-snack" data-pid="${id}" data-k="${e.k} ${e.at}"><i>${FOODS[e.k] || FOODS.zebra}</i></div>`,
      );
      n.style.setProperty("--eat", e.until - e.at + "ms");
      layer.append(n);
    }
    const j = justinAt(s.justin, now),
      p = id === JUSTIN2 ? { x: 1 - j.x, y: 1 - j.y } : j,
      at = place(p, 0, 1),
      side = (turned() ? 1 : dk._face) || 1,
      w = geo.size * 0.42;
    Object.assign(n.style, {
      left: (at.left + side * geo.size * 0.5).toFixed(1) + "px",
      top: (at.top - geo.size * 0.78).toFixed(1) + "px",
      width: w.toFixed(1) + "px",
      zIndex: Math.round(at.top + 1),
    });
    n.classList.toggle("left", side < 0);
  }
}
/* Mad God Justin's edge lightning: the edges glow for EDGE_WARN before it strikes (the strike itself: the "edge" fx) */
function placeEdge(board, s, now) {
  const m = isMgj(s) && s.phase === "boss" && s.mgj,
    warn =
      !!m && !mgjFrozen(s) && m.edgeAt - now <= EDGE_WARN && m.edgeAt > now;
  let n = board.querySelector(".mgj-edge.warn");
  if (n && (!warn || +n.dataset.at !== m.edgeAt)) {
    n.remove();
    n = null;
  }
  if (!warn || n) return;
  n = el(edgeHTML("warn"));
  n.dataset.at = m.edgeAt;
  n.style.animationDelay = -(EDGE_WARN - (m.edgeAt - now)) + "ms";
  board.append(n);
  sfx.warn(Math.max(0.05, (m.edgeAt - now) / 1000));
}

/* Story Chain: the row under my duck lights up while voting, and the Vote button wears its color */
function storyMarks(s, board) {
  const zones = scZones(s),
    z = me ? zoneAt(s, me.y, zones) : null,
    k = zones.indexOf(z),
    vote = SC_VOTES.includes(s.phase);
  const can = vote && scCanVote(s, R.me, z); // (a row you can't vote for lights up grey)
  board.querySelectorAll(".sc-row").forEach((r) => {
    const on = vote && z !== "H" && +r.dataset.z === k;
    r.classList.toggle("here", on);
    r.classList.toggle("nope", on && !can);
  });
  if (z === scZone) return;
  scZone = z;
  const l = scLineOf(s, z),
    who = l ? l.line.by : /^W:/.test(z || "") ? z.slice(2) : null,
    p = who && s.players[who];
  S.style.setProperty(
    "--vb",
    p
      ? (p.card && p.card.color) || "#8a8fa3"
      : {
          "C:cont": "var(--green)",
          "C:new": "var(--blue)",
          "C:lobby": "var(--orange)",
        }[z] || "var(--green)",
  );
  if (vote) setHTML($(".gact", S), actHTML(s)); // (your own line or word can't be voted for)
}
/* the ducks walk on the bracket itself (x, y across the whole bracket), so everyone sees them over the same matches; the
   bracket slides to keep my duck in view */
const bracketZoom = (box, b) => {
  const { W, H } = treeSize(b);
  return { W, H, fit: Math.min(1, box.clientWidth / W, box.clientHeight / H) };
};
function panTree(pos) {
  const box = S.querySelector(".bb-diagram"),
    tree = box && box.firstElementChild;
  if (!tree || !geo) {
    cam = null;
    return;
  }
  const { W, H, fit } = bracketZoom(box, R.state.bb),
    z = bbZoom || Math.max(fit, 0.55),
    bw = box.clientWidth,
    bh = box.clientHeight;
  const p = pos && pos.x >= 0 ? pos : { x: 0.5, y: 0.5 };
  const follow = (size, view, f) =>
    size <= view
      ? (view - size) / 2
      : Math.max(view - size, Math.min(0, view / 2 - f * size)); // centered on my duck, never past the edges
  const ox = follow(W * z, bw, p.x),
    oy = follow(H * z, bh, p.y);
  cam = { dx: box.offsetLeft, dy: box.offsetTop, ox, oy, z, W, H };
  const tr = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${z.toFixed(3)})`;
  if (tree._tr !== tr) {
    tree._tr = tr;
    tree.style.transform = tr;
  }
}
function zoom(how) {
  const box = S && S.querySelector(".bb-diagram");
  if (!box) return;
  const { fit } = bracketZoom(box, R.state.bb),
    z = bbZoom || Math.max(fit, 0.55);
  bbZoom =
    how === "fit"
      ? fit
      : Math.max(0.2, Math.min(2.5, z * (how === "in" ? 1.25 : 0.8)));
}

/* ---------- the silly commands: lightning, love, kill, hotdog ---------- */
const HOTDOG = `<svg viewBox="-34 -24 68 30" width="100%"><path d="M-24-13C-26-18-20-21-12-19L14-19C22-21 27-17 25-12Z" fill="#e2a65a" stroke="#1c1c28" stroke-width="1.6"/><rect x="-31" y="-17" width="62" height="10" rx="5" fill="#c0502b" stroke="#1c1c28" stroke-width="1.6"/><path d="M-24-13l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3" stroke="#f2c230" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-27-9C-28-1-20 2-10 2L10 2C20 2 28-1 27-9C18-6-18-6-27-9Z" fill="#eab36a" stroke="#1c1c28" stroke-width="1.6"/></svg>`;
/* a card's color, lifted when it's too dark to see on the name tag (a black card's meter showed black on black) */
function seen(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex;
  const n = parseInt(m[1], 16),
    [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255);
  if (0.2126 * r + 0.7152 * g + 0.0722 * b >= 0.3) return hex;
  const hi = Math.max(r, g, b),
    lo = Math.min(r, g, b),
    c = hi - lo,
    h =
      c === 0
        ? 0
        : hi === r
          ? ((g - b) / c) % 6
          : hi === g
            ? (b - r) / c + 2
            : (r - g) / c + 4,
    sat = c === 0 ? 0 : Math.round((c / (1 - Math.abs(hi + lo - 1))) * 100);
  return `hsl(${Math.round(h * 60)} ${sat}% 62%)`;
}
/* a color that stands out inside a card's color: the opposite hue, light on a dark color and dark on a light one (the
   down meter's streaks) */
function against(hex) {
  const l = /^hsl\(\d+ \d+% (\d+)%\)$/.exec(hex || "");
  if (l) return "#1c1c28"; // (a lifted dark card: dark streaks on it)
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16),
    [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255),
    hi = Math.max(r, g, b),
    lo = Math.min(r, g, b),
    c = hi - lo;
  const h =
    c === 0
      ? 0
      : hi === r
        ? ((g - b) / c) % 6
        : hi === g
          ? (b - r) / c + 2
          : (r - g) / c + 4;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return `hsl(${Math.round(h * 60 + 180)} 85% ${lum > 0.45 ? 22 : 88}%)`;
}
/* charred, then the burns fade in a few seconds; with flames first for `fire` ms (the fire special, not a grenade) */
function burn(dk, fire = 0) {
  if (!dk) return;
  clearTimeout(dk._fireT);
  clearTimeout(dk._burnT);
  dk.classList.remove("burnt", "unburn", "onfire");
  dk.classList.add(fire ? "onfire" : "burnt");
  if (fire)
    dk._fireT = setTimeout(() => {
      dk.classList.remove("onfire");
      dk.classList.add("burnt");
    }, fire);
  dk._burnT = setTimeout(() => {
    dk.classList.remove("burnt");
    dk.classList.add("unburn");
    dk._burnT = setTimeout(() => dk.classList.remove("unburn"), 2600);
  }, fire + 2400);
}
/* Lawyering: an attorney ('off', the sword, or 'def', the shield) while their case is argued and talked over */
const LAW_GLOW = 2400; // ms: one breath of the attorneys' glow (css/app.css law-glow)
const lawRole = (s, id) =>
  isLaw(s) && s.law && ["answer", "discuss"].includes(s.phase)
    ? id === s.law.off
      ? "off"
      : id === s.law.def
        ? "def"
        : ""
    : "";
/* a short, see-through red flash on a duck: Justin hit, or a duck knocked down */
function hurt(d) {
  if (!d) return;
  d.classList.remove("hurt");
  void d.offsetWidth;
  d.classList.add("hurt");
}
function playFx(f) {
  const s = R.state,
    fxl = S && $(".fxl", S);
  if (!fxl || !geo) return;
  const now = clockNow(),
    size = geo.size,
    posOf = (id) =>
      id === JUSTIN_ID
        ? justinShown(s) && justinAt(s.justin, now)
        : id === R.me && me
          ? me
          : s.pos[id];
  const spot = (id) => {
    const p = posOf(id);
    return p ? place(p.x < 0 ? { ...p, x: 0.5 } : p, 0, 1) : null;
  };
  if (f.kind === "lightning") {
    const at = spot(f.who[0]);
    if (!at) return;
    let d = `M${at.left + (Math.random() - 0.5) * 40} 0`,
      y = 0;
    const x0 = at.left,
      yEnd = at.top - size * (0.6 + podLift(s, f.who[0], now));
    while (y < yEnd - 30) {
      y += 24 + Math.random() * 30;
      d += `L${(x0 + (Math.random() - 0.5) * 46).toFixed(1)} ${Math.min(y, yEnd).toFixed(1)}`;
    }
    d += `L${x0} ${yEnd}`;
    const bolt = el(
      `<svg class="fx-bolt" width="${geo.W}" height="${geo.top0 + geo.H}"><path d="${d}" stroke="#fff6b0" stroke-width="7" fill="none" stroke-linejoin="bevel" opacity=".55"/><path d="${d}" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linejoin="bevel"/></svg>`,
    );
    const flash = el('<div class="fx-flash"></div>');
    fxl.append(bolt, flash);
    setTimeout(() => {
      bolt.remove();
      flash.remove();
    }, 700);
    const dk = S.querySelector(`.gduck[data-pid="${f.who[0]}"]`);
    if (dk) {
      dk.classList.add("zapped");
      setTimeout(() => dk.classList.remove("zapped"), 1400);
    }
    sfx.zap();
  } else if (f.kind === "love") {
    const a = spot(f.who[0]),
      b = spot(f.who[1]);
    if (!a || !b) return;
    const pa = s.players[f.who[0]],
      pb = s.players[f.who[1]];
    const x = (a.left + b.left) / 2,
      y = Math.min(a.top, b.top) - size * 0.4;
    const heart =
      el(`<div class="fx-heart" style="left:${x}px;top:${y}px;--rise:${(-y - 40).toFixed(0)}px"><svg viewBox="0 0 100 90" class="fx-heart-bg"><path d="M50 86C14 60 2 42 4 26 6 10 20 2 32 3c8 1 14 6 18 13 4-7 10-12 18-13 12-1 26 7 28 23 2 16-10 34-46 60z" fill="#ff4f8b" stroke="#fff" stroke-width="3"/></svg>
      <div class="fx-heart-ducks">${pa ? duckSVG(pa.duck, { size: 40, shadow: false, title: pa.name }) : ""}${pb ? duckSVG({ ...pb.duck }, { size: 40, shadow: false, title: pb.name }).replace("<svg ", '<svg style="transform:scaleX(-1)" ') : ""}</div></div>`);
    fxl.append(heart);
    setTimeout(() => heart.remove(), 4200);
    sfx.love();
  } else if (f.kind === "kill") {
    sfx.hit();
  } else if (f.kind === "boom") {
    // a grenade went off: the blast where it landed, and the ducks it caught burnt for a while (their hit sound comes
    // as they go down)
    const board = $(".board", S);
    if (!board) return;
    const at = geo.hang
      ? world.place({ x: f.x, y: f.y }, f.hz || 0)
      : place({ x: f.x, y: f.y }, 0, 1);
    grenadeBoom(fxl, board, at, size);
    sfx.boom();
    for (const id of f.hit) {
      const dk = S.querySelector(`.gduck[data-pid="${CSS.escape(id)}"]`);
      if (id === JUSTIN_ID && isMgj(s)) {
        hurt(dk);
        sfx.hit();
      }
      burn(dk);
    }
  } else if (f.kind === "hit") {
    // the knife or the hammer touched someone after the press, while it swung
    if (f.hit.includes(JUSTIN_ID) && isMgj(s)) {
      hurt(S.querySelector(`.gduck[data-pid="${JUSTIN_ID}"]`));
      sfx.hit();
    }
    if (f.what === "hammer") setTimeout(() => sfx.bonk(), KB_LAND);
  } else if (f.kind === "use") {
    // an item at its duck, moving with it (drawDucks places it each frame)
    if (f.what === "confetti") {
      confettiRain(4500);
      return;
    } // confetti over everyone's screen
    if (!spot(f.by)) return;
    if (f.what === "controller" || f.what === "chair") {
      sfx.swish();
      return;
    } // (Mad God Justin's throws: they fly from the room's state)
    if (isL4dd(s) && ARMS[f.what]) {
      if (inHand(f.what))
        shows[f.by] = {
          what: f.what,
          t: now,
          until: now + (f.what === "knife" ? 350 : 700),
          ax: f.ax || f.face || 1,
          ay: f.ay || 0,
        };
      ({
        handgun: sfx.bang,
        bow: sfx.bow,
        knife: sfx.swish,
        hammer: sfx.swish,
        dagger: sfx.swish,
        shotgun: sfx.shotgun,
        medkit: sfx.done,
        grenade: sfx.swish,
        sniper: sfx.bang,
        revolver: sfx.bang,
        smg: sfx.tat,
        ak: sfx.tat,
        lmg: sfx.tat,
        chaingun: sfx.tat,
        glauncher: sfx.shotgun,
        zebra: sfx.swish,
        fireball: sfx.fireball,
        adrenaline: sfx.sip,
        longjump: sfx.boing,
      })[f.what]?.();
      return;
    } // (Quacky Zombies: the weapon turns toward the aim; the shot flies from the room's state)
    if (f.what === "fireball") {
      sfx.fireball();
      return;
    }
    if (f.what === "zebra") {
      sfx.swish();
      return;
    } // (Mad God Justin's zebra cake: it flies from the room's state)
    if (f.what === "shotgun") {
      // Mad God Justin's shotgun: the blast, then the pump
      shows[f.by] = {
        what: "shotgun",
        t: now,
        until: now + 900,
        ax: f.ax || f.face || 1,
        ay: f.ay || 0,
      };
      sfx.shotgun();
      setTimeout(() => sfx.pump(), 520);
      return;
    }
    if (WEAPONS.includes(f.what)) {
      if ((f.hit || []).includes(JUSTIN_ID) && isMgj(s)) {
        hurt(S.querySelector(`.gduck[data-pid="${JUSTIN_ID}"]`));
        sfx.hit();
      } // (Mad God Justin stabbed: he flashes red, and the hit sound; anyone else flashes as they go down)
      shows[f.by] = {
        what: f.what,
        t: now,
        until:
          now +
          ({ dagger: 900, grenade: 900, knife: 700, hammer: 1000 }[f.what] ||
            1400),
        ax: f.ax || f.face || 1,
        ay: f.ay || 0,
      };
      if (f.by === JUSTIN_ID && isMgj(s) && s.mgj && s.mgj.dup)
        shows[JUSTIN2] = {
          ...shows[f.by],
          ax: -shows[f.by].ax,
          ay: -shows[f.by].ay,
        }; // (his double does the same, mirrored)
      (f.what === "handgun"
        ? sfx.bang
        : f.what === "bow"
          ? sfx.bow
          : sfx.swish)();
      if (f.what === "hammer" && f.hit && f.hit.length)
        setTimeout(() => sfx.bonk(), KB_LAND); // (the hammer's duck landed; a knife's hit is the hit sound as it goes down)
      return;
    } // (it turns toward the aim; the bullet or the dagger flies from the room's state)
    const wrap = el('<div class="spe-follow"></div>');
    wrap.append(
      ...pressFX(f.what, 0, 0, size, f.face || 1, (s.players[f.by] || {}).duck),
    );
    fxl.append(wrap);
    follows.push({ id: f.by, el: wrap, until: now + 2200, face: f.face || 1 });
    ({
      coffee: sfx.sip,
      hotdog: sfx.chomp,
      watergun: sfx.splash,
      confgun: sfx.pop,
      handgun: sfx.bang,
      sound: sfx.quack,
      trombone: sfx.trombone,
    })[f.what]?.();
  } else if (f.kind === "fire") {
    // flames for a moment, then charred; the burns fade in a few seconds
    const dk = S.querySelector(`.gduck[data-pid="${f.who[0]}"]`);
    if (!dk) return;
    burn(dk, 1600);
    sfx.fire();
  } else if (f.kind === "meteor") {
    // Mad God Justin's meteor, onto the middle of the board
    const board = $(".board", S);
    if (!board) return;
    dropMeteor(
      fxl,
      board,
      place(f.x != null ? { x: f.x, y: f.y } : { x: 0.5, y: 0.55 }, 0, 1),
      f.small ? size * 0.6 : size,
      f.land - now,
    );
    sfx.meteor(Math.max(0.15, (f.land - now) / 1000));
  } else if (f.kind === "pump") {
    // he's back, with the shotgun
    sfx.pump();
  } else if (f.kind === "xboff") {
    sfx.tick(); // (Mad God Justin turns his Xbox off: a click, and the light and the screen go dark)
  } else if (f.kind === "mgjtell") {
    // Mad God Justin holds up what he's about to throw: the controllers, or the chair over his head
    const lift = S.querySelector(`.gduck[data-pid="${JUSTIN_ID}"] .gduck-lift`),
      left = (f.until || 0) - now;
    if (!lift || left <= 0) return;
    const up = el(
      `<div class="mgj-tellup k-${f.what}" style="--tell:${left}ms">${f.what === "chair" ? CHAIR : CONTROLLER.repeat(2)}</div>`,
    );
    lift.append(up);
    setTimeout(() => up.remove(), left);
    sfx.boop();
  } else if (f.kind === "pickup") {
    sfx.pop(); // (Mad God Justin: a weapon picked up)
  } else if (f.kind === "teleport") {
    // Mad God Justin's blue flash where he leaves and where he lands (his double: where it shows up)
    for (const [x, y] of f.dup
      ? [[f.x, f.y]]
      : [
          [f.x0, f.y0],
          [f.x, f.y],
        ]) {
      const at = place({ x, y }, 0, 1),
        n = el(
          `<div class="mgj-tp" style="left:${at.left.toFixed(1)}px;top:${at.top.toFixed(1)}px;width:${(size * 1.6).toFixed(0)}px">${TELEPORT}</div>`,
        );
      fxl.append(n);
      setTimeout(() => n.remove(), 600);
    }
    sfx.teleport();
  } else if (f.kind === "hitmark") {
    // a hit on Justin (or a Jaime): the hitmarker; on his double, the grey one (it counts for nothing)
    const at = place({ x: f.x, y: f.y }, 0, 1),
      n = el(
        `<div class="mgj-hit" style="left:${at.left.toFixed(1)}px;top:${(at.top - size * 0.5).toFixed(1)}px;width:${(size * 0.55).toFixed(0)}px">${f.fake ? HITMARK_FAKE : HITMARK}</div>`,
      );
    fxl.append(n);
    setTimeout(() => n.remove(), 500);
    if (f.fake) sfx.boop();
  } else if (f.kind === "poof") {
    // a Jaime (or Good Justin God) gone in a cloud
    const at = place({ x: f.x, y: f.y }, 0, 1),
      n = el(
        `<div class="mgj-poof" style="left:${at.left.toFixed(1)}px;top:${(at.top - size * 0.4).toFixed(1)}px;width:${(size * 1.3).toFixed(0)}px">${POOF}</div>`,
      );
    fxl.append(n);
    setTimeout(() => n.remove(), 800);
    sfx.jaime();
  } else if (f.kind === "medkit") {
    // a duck got up with a medkit: the medkit over it for a moment
    const at = spot(f.who[0]);
    if (!at) return;
    const n = el(
      `<div class="mgj-kit" style="left:${at.left.toFixed(1)}px;top:${(at.top - size * 1.2).toFixed(1)}px;width:${(size * 0.6).toFixed(0)}px">${MEDKIT}</div>`,
    );
    fxl.append(n);
    setTimeout(() => n.remove(), 1200);
    sfx.pop();
  } else if (f.kind === "l4line") {
    /* the chain gun's shot: thin yellow lines popping in and out, all from the end of its barrel: one out to what it
       hit, and one or two shorter ones pointing a little off to the sides */
    if (!geo.hang) return;
    const a = world.place({ x: f.x0 / HW, y: f.y0 / HH }, f.hz || 0),
      b = world.place({ x: f.x1 / HW, y: f.y1 / HH }, f.hz || 0),
      up = size * 0.41,
      gun = fxl.querySelector(
        `.held[data-pid="${CSS.escape(f.by)}"][data-w="chaingun"]`,
      ),
      [x0, y0, aim] = (gun && gun._tip) || [
        a.left,
        a.top - up,
        Math.atan2(b.top - a.top, b.left - a.left),
      ];
    let ang = Math.atan2(b.top - up - y0, b.left - x0),
      far = Math.hypot(b.left - x0, b.top - up - y0);
    if (Math.cos(ang - aim) < 0.5) {
      // (what it hit is beside the barrel or behind its end: the lines still only go forward)
      ang = aim;
      far = size * 0.8;
    }
    const line = (turn, long, wait) => {
      const n = el(
        `<div class="l4-line" style="left:${x0.toFixed(1)}px;top:${y0.toFixed(1)}px;width:${long.toFixed(1)}px;transform:rotate(${(ang + turn).toFixed(3)}rad);--c:${TRACE.color};--g:${TRACE.glow};--ms:${TRACE.ms}ms;animation-delay:${wait.toFixed(0)}ms"></div>`,
      );
      fxl.append(n);
      setTimeout(() => n.remove(), TRACE.ms + wait + 40);
    };
    line(0, far, 0);
    for (let i = Math.random() < 0.5 ? 1 : 2; i > 0; i--)
      line(
        (Math.random() - 0.5) * TRACE.spread,
        far * (0.25 + Math.random() * 0.5),
        Math.random() * 30,
      );
  } else if (f.kind === "l4drop") {
    l4Got(f.k); // (a drop was taken: its name for everyone)
  } else if (f.kind === "l4bite") {
    sfx.chomp(); // (a zombie ate the zebra cake)
  } else if (f.kind === "jaime") {
    sfx.puff(); // (a Jaime comes in)
  } else if (f.kind === "eat") {
    sfx.chomp();
  } else if (f.kind === "edge") {
    // the edge lightning strikes (its glow before it: drawEdge)
    const board = $(".board", S);
    if (!board) return;
    board.querySelector(".mgj-edge.warn")?.remove();
    const n = el(edgeHTML("zap"));
    board.append(n);
    setTimeout(() => n.remove(), 400);
    sfx.zap();
  } else if (f.kind === "hotdog") {
    const node = el(
      `<div class="fx-hotdog" style="width:${(size * 0.8).toFixed(0)}px">${HOTDOG}</div>`,
    );
    fxl.append(node);
    hotdogs.push({ id: f.who[0], el: node, until: now + 7000 });
    sfx.hotdog();
  }
}

/* ---------- my duck ---------- */
const onBoardPhase = () => R && boardPhases(R.state).includes(R.state.phase);
const locked = () =>
  isSc(R.state)
    ? SC_VOTES.includes(R.state.phase) && !!R.state.done[R.me]
    : isQuack(R.state) &&
      ["choice", "accuse"].includes(R.state.phase) &&
      !!R.state.done[R.me]; // a vote here holds its spot (the boards' vote holds the column instead: votedCol())
const votedCol = () => {
  const c = heldCol(R.state, R.me);
  return c != null && c >= 0 ? c : null;
}; // voted: inside that column until I unvote
const late = () => !!(R.state.players[R.me] || {}).late; // joined mid-turn: walks anywhere, plays from the next turn
const roams = () =>
  ["answer", "bracket", "dunced"].includes(R.state.phase) ||
  isMgj(R.state) ||
  isSc(R.state) ||
  late() ||
  isQuack(R.state) ||
  isVd(R.state) ||
  isHang(R.state); // anywhere on the board (else inside my column)
const canWalk = () =>
  onBoardPhase() &&
  !locked() &&
  !(!roams() && R.state.lock[R.me] === undefined) &&
  !frozen(R.state, R.me, clockNow()) &&
  !hangStill(R.state, R.me, clockNow()) &&
  !downStill(R.state, R.me, clockNow()) &&
  !dnStill(R.state, R.me) &&
  !seated(R.state, R.me); // (Hangout: shot by Justin, still a while; Duncelation: the dunce on its podium; Valentine's Duck Date: at the table)
function xBounds() {
  const s = R.state;
  if (isLaw(s) && attorney()) return counselBounds(s, R.me); // (an attorney: their own side)
  if (votedCol() != null) return colBoundsAt(s, votedCol());
  if (roams()) return [0.03, 0.97];
  return colBoundsAt(s, s.lock[R.me]);
}
/* aiming: the board's directions on the screen. place() is straight lines on the board, so two steps from the middle
   give how far a step across (x) and a step down (y) the board moves on the screen */
function axes() {
  const o = place({ x: 0.5, y: 0.5 }, 0, 1),
    a = place({ x: 0.6, y: 0.5 }, 0, 1),
    b = place({ x: 0.5, y: 0.6 }, 0, 1);
  return [
    (a.left - o.left) * 10,
    (a.top - o.top) * 10,
    (b.left - o.left) * 10,
    (b.top - o.top) * 10,
  ];
}
const toScreen = (ax, ay) => {
  const [xx, xy, yx, yy] = axes();
  return [xx * ax + yx * ay, xy * ax + yy * ay];
};
/* a direction on the screen, as a direction on the board one board width long (on this screen) */
function toBoard(dx, dy) {
  const [xx, xy, yx, yy] = axes(),
    det = xx * yy - yx * xy,
    d = Math.hypot(dx, dy);
  if (!det || !d) return null;
  const k = geo.W / d,
    ax = ((yy * dx - yx * dy) / det) * k,
    ay = ((-xy * dx + xx * dy) / det) * k;
  return [+ax.toFixed(3), +ay.toFixed(3)];
}
/* the middle of my duck on the screen (where a weapon turns around), and where it aims: at the mouse on a computer,
   else the way it faces */
function bodyAt(id, pos, now = clockNow()) {
  const lane = R.state.seat.filter(
    (i) => R.state.pos[i] && (i === R.me && me ? me : R.state.pos[i]).x < 0,
  );
  const at = seatAt(R.state, id) || place(pos, lane.indexOf(id), lane.length), // (Valentine's Duck Date: at the table, its weapon goes with it)
    up = seated(R.state, id) ? SEAT_LIFT : 0; // (on its chair)
  const lift =
    geo.hang && world ? world.lift(id, pos) : jumpZ(pos, now) * geo.size; // (Hangout: how high it's drawn, a jump's or the jetpack's)
  return {
    left: at.left,
    top: at.top - lift - (up + 0.45) * geo.size,
  };
}
function myAim() {
  const face = turned() ? 1 : (me && me.face) || 1;
  if (!geo || !me) return [face, 0];
  if (keyAim) return toBoard(keyAim[0], keyAim[1]) || [face, 0]; // (the arrow keys moved last)
  if (R && isL4dd(R.state) && (!mouse || performance.now() - touchedAt < 4000))
    return l4TouchAim(me) || [face, 0]; // (Quacky Zombies on a phone: at the nearest zombie in sight, or the way it walks)
  if (!mouse) return toBoard(face, 0) || [face, 0];
  const board = origin($(".board", S));
  if (!board) return [face, 0];
  const r = board.getBoundingClientRect(),
    c = bodyAt(R.me, me);
  return (
    toBoard(mouse.x - r.left - c.left, mouse.y - r.top - c.top) || [face, 0]
  );
}
function sendMove(force) {
  if (!me) return;
  const now = performance.now(),
    q = clockNow() - squash.t < 170 ? squash.q : "";
  const w = heldNow(),
    aim = w ? myAim() : null; // a weapon kept out: where it aims, roughly
  const hz =
    world && isHang(R.state)
      ? { z: Math.round(me.z || 0), b: Math.round(me.b || 0) }
      : null; // Hangout: how high its feet are, where its jump began
  const msg = [
    me.x.toFixed(4),
    me.y.toFixed(4),
    me.j,
    me.lj,
    me.sj,
    me.dj,
    q,
    sprinting && moving,
    w,
    aim && Math.round(Math.atan2(aim[1], aim[0]) * 20),
    hz && hz.z,
    me.tb,
    me.jf,
    me.jt,
    flyHigh(),
    me.jf && me.fz !== undefined && !hz ? me.fz.toFixed(2) : "",
  ].join();
  if (
    !force &&
    (now - lastSend < (R.online ? [90, 140, 220][netLevel()] : 60) ||
      msg === lastSent)
  )
    return; // online: less often (Data saving, Poor connection: less still)
  lastSend = now;
  lastSent = msg;
  R.send({
    t: "move",
    x: me.x,
    y: me.y,
    j: me.j || 0,
    ...(me.j && me.lj ? { lj: true } : {}),
    ...(me.j && me.sj ? { sj: true } : {}),
    ...(me.j && me.dj ? { dj: me.dj } : {}),
    ...(me.j && me.tb ? { tb: me.tb } : {}),
    ...(me.jf
      ? {
          jf: 1,
          ...(me.jt ? { jt: 1 } : {}),
          ...(flyHigh() ? { fly: 1 } : {}),
          ...(hz ? {} : { fz: +(me.fz || 0).toFixed(2) }),
        }
      : {}),
    q,
    sp: sprinting && moving,
    ...(w ? { w, ax: aim[0], ay: aim[1] } : {}),
    ...hz,
  });
}
/* would my duck at (x, y) push into another duck on the ground? (both in the air or either in the air: no) A bigger or
   fatter duck takes more room, a small or skinny one less. */
function bumps(x, y, now) {
  return crowd(x, y, now).b;
}
/* how far into other ducks my duck at (x, y) would be: d is 0 when clear, up to 1 when right on top of one */
function crowd(x, y, now) {
  const out = { d: 0, b: null };
  if (!geo || jumpZ(me, now) > 0) return out; // in the air: over everyone
  const s = R.state,
    a = place({ x, y }, 0, 1),
    rx = geo.size * 0.44,
    ry = geo.size * 0.2,
    ka = duckRoom((s.players[R.me] || {}).duck);
  for (const id of s.seat) {
    if (id === R.me || !s.pos[id] || s.pos[id].x < 0) continue;
    const o = s.pos[id];
    if (jumpZ(o, now) > 0 || (s.players[id] || {}).dead) continue; // (in the air, or lying knocked down: walked over)
    const kb = duckRoom((s.players[id] || {}).duck);
    const b = place(o, 0, 1),
      dx = (a.left - b.left) / (rx * (ka.x + kb.x)),
      dy = (a.top - b.top) / (ry * (ka.y + kb.y)),
      d = 1 - (dx * dx + dy * dy);
    if (d > out.d) {
      out.d = d;
      out.b = b;
    }
  }
  return out;
}
function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - (lastT || t)) / 1000);
  lastT = t;
  if (!S || !R) return;
  const now = clockNow();
  if (!geo) measure();
  if (me && onBoardPhase()) step(dt, now);
  if (scene) scene.update(now);
  shiftSides(R.state, now);
  drawDucks(now);
}
function step(dt, now) {
  if (isHang(R.state)) return hangStep(dt, now);
  const s = R.state;
  // a jump lands: it counts now
  if (me.j && now >= landsAt(me)) {
    const n = me.dj ? 2 : 1;
    me.j = 0;
    me.lj = me.sj = false;
    me.dj = 0;
    for (let i = 0; i < n; i++) countJump();
    sendMove(true);
  } // (a double jump is two)
  if (me.jf) {
    // the jetpack: up while Space is held, the height kept with Shift, else it comes down onto the board again
    const jk = jetKeys(),
      b = jumpCfg(null),
      G = (8 * b.H) / (b.T * b.T);
    if (jk.up) me.fv = Math.min(JET.RISE, me.fv + JET.PUSH * dt);
    else if (jk.hold) me.fv = 0;
    else me.fv -= G * dt;
    me.fz = Math.min(JET.TOP, me.fz + me.fv * dt);
    if (me.fz >= JET.TOP && me.fv > 0) me.fv = 0;
    if (me.fz <= 0 && me.fv <= 0) {
      me.jf = false;
      me.fz = me.fv = 0;
      sendMove(true);
    }
    jetAfter(me.jf && (jk.up || jk.hold), dt);
  } else jetAfter(false, dt); // (on the ground: the fuel fills up again)
  const k = (c) => keys.has(c),
    aims = arrowsAim(); // (Mad God Justin: WASD walks, the arrows aim)
  const up = k("KeyW") || (!aims && k("ArrowUp")),
    down = k("KeyS") || (!aims && k("ArrowDown")),
    left = k("KeyA") || (!aims && k("ArrowLeft")),
    right = k("KeyD") || (!aims && k("ArrowRight"));
  let hx = (right ? 1 : 0) - (left ? 1 : 0),
    vy = (down ? 1 : 0) - (up ? 1 : 0); // on screen: right, down
  if (!hx && !vy && (stick.x || stick.y)) {
    hx = stick.x;
    vy = stick.y;
  } // the joystick: slower near its middle
  if (hx || vy) target = null;
  sprinting =
    k("ShiftLeft") ||
    k("ShiftRight") ||
    stick.sprint ||
    !!(target && target.sprint);
  let ax, ay; // in board terms
  if (turned()) {
    ax = -vy;
    ay = hx;
  } else {
    ax = hx;
    ay = vy;
  }
  if (target && me.x >= 0) {
    const [lo, hi] = xBounds();
    target.x = Math.max(lo, Math.min(hi, target.x));
    const dx = target.x - me.x,
      dy = target.y - me.y,
      dist = Math.hypot(dx, dy);
    if (target.best === undefined || dist < target.best - 0.002) {
      target.best = dist;
      target.since = now;
    }
    if (dist < 0.008 || now - target.since > 700)
      target = null; // there, or held up by another duck
    else {
      ax = dx / dist;
      ay = dy / dist;
    }
  }
  moving = !!(ax || ay) && canWalk();
  /* a jump can end inside another duck (in the air they pass over each other); on the ground they ease apart */
  const other = canWalk() && bumps(me.x, me.y, now);
  if (other && !moving) {
    const a = place(me, 0, 1),
      dx = a.left - other.left || Math.random() - 0.5,
      dy = a.top - other.top || Math.random() - 0.5,
      d = Math.hypot(dx, dy);
    const [lo0, hi0] = xBounds();
    me.x = Math.max(lo0, Math.min(hi0, me.x + (dx / d) * 0.22 * dt));
    me.y = Math.max(0, Math.min(1, me.y + (dy / d) * 0.55 * dt));
    sendMove();
    return;
  }
  if (!moving) {
    sendMove();
    return;
  }
  if (me.x < 0) {
    me.x = 0.5;
    me.y = Math.max(0.75, me.y);
  } // the first step onto the board starts at Neutral, near the front
  let onTree =
    cam && s.phase === "bracket"
      ? [geo.W / (cam.W * cam.z), geo.H / (cam.H * cam.z)]
      : [1, 1]; // (on the bracket: the same speed on the screen)
  if (geo && geo.sc && geo.rows.length) {
    const k = geo.rows.length,
      row =
        geo.rows[
          Math.min(k - 1, Math.floor(Math.max(0, Math.min(0.9999, me.y)) * k))
        ];
    onTree = [1, (geo.H * 0.9) / SPEED.y / (row.h * k)];
    scWalk = now;
  } // (the story: the same speed on the screen in any row)
  const mul =
    (sprinting ? SPEED.sprint : 1) * (isMgj(s) ? MGJ_SLOW : 1) * walkOf(s); // (Mad God Justin: the ducks a fifth slower; the lobby's Walking speed)
  const sx = (turned() ? SPEED.px : SPEED.x) * mul * onTree[0],
    sy = (turned() ? SPEED.py : SPEED.y) * mul * onTree[1];
  const [lo, hi] = xBounds();
  let nx = me.x + ax * sx * dt,
    ny = me.y + ay * sy * dt,
    q = "";
  const scr = (dx, dy) =>
    turned()
      ? dx > 0
        ? "u"
        : dx < 0
          ? "d"
          : dy > 0
            ? "r"
            : "l"
      : dx > 0
        ? "r"
        : dx < 0
          ? "l"
          : dy > 0
            ? "d"
            : "u";
  if (nx < lo || nx > hi) {
    q = scr(Math.sign(ax), 0);
    nx = Math.max(lo, Math.min(hi, nx));
  }
  if (ny < 0 || ny > 1) {
    q = q || scr(0, Math.sign(ay));
    ny = Math.max(0, Math.min(1, ny));
  }
  if (attorney() && isDn(s)) {
    const [rx, ry] = inRing(nx, ny);
    if (rx !== nx || ry !== ny) {
      q = q || scr(Math.sign(ax), Math.sign(ay));
      nx = rx;
      ny = ry;
    }
  } // the defender argues from the circle (Lawyering's attorneys: from their own sides, xBounds)
  // other ducks: try both steps, then each alone; a blocked step squashes against them. A step is blocked only when it
  // goes further into a duck, so a duck that walked onto mine (computers walk through everyone) never pins it. A slow
  // frame takes a long step that can be blocked a step away from a duck, so a blocked step tries again shorter (down
  // to an eighth) before it gives up: my duck walks right up to the other one, as it does at a smooth frame rate
  const here = crowd(me.x, me.y, now).d,
    into = (x, y) => {
      const d = crowd(x, y, now).d;
      return d > 0 && d > here - 1e-6;
    };
  if (into(nx, ny)) {
    const x0 = me.x,
      y0 = me.y,
      dx = nx - x0,
      dy = ny - y0;
    let to = null;
    for (const f of [1, 0.5, 0.25, 0.125]) {
      const tx = x0 + dx * f,
        ty = y0 + dy * f;
      to =
        f < 1 && !into(tx, ty)
          ? [tx, ty, ""]
          : dx && !into(tx, y0)
            ? [tx, y0, scr(0, Math.sign(ay))]
            : dy && !into(x0, ty)
              ? [x0, ty, scr(Math.sign(ax), 0)]
              : null; // (a step along one way only, when it goes that way at all)
      if (to) break;
    }
    if (to) {
      [nx, ny] = to;
      q = q || to[2];
    } else {
      q = q || scr(Math.sign(ax), Math.sign(ay));
      nx = x0;
      ny = y0;
    }
  }
  if (q) squash = { q, t: now };
  if (ax) me.face = Math.sign(ax);
  me.x = nx;
  me.y = ny;
  sendMove();
}
/* Hangout: the keys, the stick or a tap say which way; the world walks my duck (walls, steps, edges, falls) */
function hangStep(dt, now) {
  if (!world || !geo) return;
  const k = (c) => keys.has(c);
  let ax =
      (k("KeyD") || k("ArrowRight") ? 1 : 0) -
      (k("KeyA") || k("ArrowLeft") ? 1 : 0),
    ay =
      (k("KeyS") || k("ArrowDown") ? 1 : 0) -
      (k("KeyW") || k("ArrowUp") ? 1 : 0);
  if (!ax && !ay && (stick.x || stick.y)) {
    ax = stick.x;
    ay = stick.y;
  }
  if (ax || ay) target = null;
  sprinting =
    k("ShiftLeft") ||
    k("ShiftRight") ||
    stick.sprint ||
    !!(target && target.sprint);
  if (target) {
    // a click or a tap: there, or held up by something
    const a = world.aim(me, target);
    if (target.best === undefined || a.d < target.best - 4) {
      target.best = a.d;
      target.since = now;
    }
    if (a.d < 10 || now - target.since > 700) target = null;
    else {
      ax = a.ax;
      ay = a.ay;
    }
  }
  if (!canWalk()) ax = ay = 0;
  const jk = jetKeys(),
    jt = !!me.jf && (jk.up || jk.hold);
  const ev = world.step(me, ax, ay, sprinting, dt, now);
  jetAfter(jt, dt); // (the jets' flames, my fuel)
  moving = ev.moved;
  for (let i = 0; i < ev.land; i++) countJump(); // (a double jump is two)
  if (ev.q) squash = { q: ev.q, t: now };
  if (ax) me.face = Math.sign(ax);
  if (isL4dd(R.state)) me.aim = myAim(); // (Quacky Zombies: my flashlight shines where I aim)
  if (ev.whee) sfx.fall(); // off the deck: a slide whistle
  if (ev.thud > 90) sfx.bonk(); // and the landing
  sendMove(!!(ev.land || ev.thud || ev.force));
}
/* reset duck: somewhere random on the board, or inside your column once you have voted (never inside another duck) */
function resetDuck() {
  if (!me || !onBoardPhase() || !geo) return "✗ That works on the board.";
  if (isSc(R.state) && locked()) return "✗ Your vote holds your duck there.";
  if (isHang(R.state)) {
    // Hangout: back outside the front door
    if (!world) return "✗ That works on the board.";
    const p = world.spawn();
    Object.assign(me, p, {
      j: 0,
      lj: false,
      sj: false,
      dj: 0,
      b: p.z,
      vz: null,
    });
    target = null;
    R.send({
      t: "move",
      x: p.x,
      y: p.y,
      j: 0,
      z: Math.round(p.z),
      b: Math.round(p.z),
      reset: true,
    });
    return "Duck reset: back at the front door.";
  }
  const s = R.state,
    inCol =
      s.phase === "bracket" || isSc(s) || isQuack(s)
        ? null
        : s.phase !== "answer"
          ? s.lock[R.me]
          : s.done[R.me] && !s.options.freeRoam
            ? colAt(s, me.x)
            : null;
  if (inCol === undefined) return "✗ No answer, no column to go back to.";
  const [lo, hi] = attorney()
      ? [0.47, 0.53]
      : inCol === null
        ? [0.04, 0.96]
        : colBoundsAt(s, inCol),
    now = clockNow();
  let x = me.x,
    y = me.y;
  for (let k = 0; k < 30; k++) {
    x = lo + Math.random() * (hi - lo);
    y = attorney() ? 0.4 + Math.random() * 0.2 : Math.random();
    if (!bumps(x, y, now)) break;
  }
  me.x = x;
  me.y = y;
  me.j = 0;
  me.lj = me.sj = false;
  me.dj = 0;
  target = null;
  R.send({ t: "move", x, y, j: 0, reset: true });
  return inCol === null
    ? "Duck reset: somewhere new."
    : "Duck reset: somewhere new in your column.";
}
/* how: 'long' (the Long jump's key), 'double' (the Double jump's key) or nothing (Space, a tap); kept-on jumps count too */
function jump(how) {
  if (!me || !onBoardPhase()) return;
  const now = clockNow();
  if (world && isHang(R.state) && !world.canJump(me)) return; // (an activity took Space, or my duck is falling)
  if (hangStill(R.state, R.me, now) || downStill(R.state, R.me, now)) return;
  if (!me.j && !me.jf && jetOn(R.state, R.me, now) && fuelLeft() > 0)
    return takeOff(); // (the jetpack on: Space flies instead of jumping)
  if (me.jf) return;
  if (me.j) {
    // in the air: the second jump, once a jump, if the Double jump is on a key
    if (
      me.dj ||
      !(
        how === "double" ||
        (kept.has("double") && hasKey(playDuck(), "double"))
      ) ||
      jumpZ(me, now) <= 0
    )
      return;
    me.dj = now;
    sendMove(true);
    sfx.puff();
    return;
  }
  me.j = now;
  me.dj = 0;
  me.lj =
    how === "long" ||
    (how !== "short" &&
      kept.has("longjump") &&
      hasKey(playDuck(), "longjump")) ||
    (isL4dd(R.state) && how !== "short" && !!(kitOf(R.state, R.me) || {}).lj); // (Quacky Zombies: the Long jump from the fireplace, switched on)
  me.sj =
    !me.lj &&
    (how === "short" ||
      (kept.has("shortjump") && hasKey(playDuck(), "shortjump"))); // (the Short jump: lower and quicker)
  if (world && isHang(R.state)) world.started(me); // (the arc starts from the height it stands on)
  sendMove(true);
}
function jumpTo(c) {
  if (!canWalk() || R.state.phase !== "answer") return;
  const x = colXAt(R.state, c);
  me.face = x >= (me.x < 0 ? 0.5 : me.x) ? 1 : -1;
  me.x = x;
  if (me.y === undefined || me.y < 0) me.y = 0.5;
  target = null;
  sendMove(true);
}
/* what ducks stand in: the board, or the story's view */
const origin = (board) =>
  board && (isSc(R.state) ? $(".sc-view", board) : board);
function boardClick(e) {
  if (
    !profile.settings.mouseMove ||
    !canWalk() ||
    !geo ||
    performance.now() - touchedAt < 900 ||
    (world && world.grabbing()) ||
    (pm && pm.held())
  )
    return;
  const board = origin(e.target.closest(".board"));
  if (!board || e.target.closest(".topover, .sc-write, .wq-card")) return;
  const r = board.getBoundingClientRect();
  target = unplace(e.clientX - r.left, e.clientY - r.top);
  if (me.x < 0) {
    me.x = 0.5;
    me.y = 0.9;
  }
}
/* touch: walk to a spot on the screen (a faint white circle marks it), and where my duck is on the screen */
function walkTo(cx, cy, sprint) {
  if (!me || !canWalk()) return;
  if (!geo) measure();
  const board = S && origin($(".board", S));
  if (!board || !geo) return;
  const r = board.getBoundingClientRect();
  target = { ...unplace(cx - r.left, cy - r.top), sprint, mark: true };
}
function duckAt() {
  const board = S && origin($(".board", S));
  if (!board || !geo || !me) return null;
  const r = board.getBoundingClientRect(),
    a = place(me, 0, 1);
  return { x: r.left + a.left, y: r.top + a.top };
}

/* ---------- the cloud's words: letters that fade in (with a sparkle) and out (with a breath) ---------- */
function say(text, small = false) {
  const el = S && $(".topover .lord-say", S);
  if (!el) return;
  let i = 0;
  el.className = "lord-say" + (small ? " small" : "");
  el.innerHTML = text
    .split(" ")
    .map(
      (w) =>
        `<span class="w">${[...w].map((ch) => `<span style="animation-delay:${i++ * 38}ms">${esc(ch)}</span>`).join("")}</span>`,
    )
    .join(" ");
  sfx.letters(text.length);
}
function unsay() {
  const el = S && $(".topover .lord-say", S);
  if (!el || !el.textContent) return;
  el.classList.add("out");
  sfx.fade();
}
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
/* a question starts: "Vote" once voting opens; the votes are in: the news, then the question to talk over */
async function announce(phase) {
  if (isQuack(R.state)) return announceQuack(R.state);
  if (isDn(R.state)) return announceDunce(R.state, phase);
  if (isMgj(R.state)) return announceMgj(R.state, phase);
  if (isVd(R.state)) return announceVd(R.state, phase);
  const job = ++sayJob;
  if (
    phase === "answer" ||
    (isSc(R.state) && ["lvote", "wvote"].includes(phase))
  ) {
    await pause(Math.max(250, graceLeftMs(R.state)));
    if (job === sayJob) say(isLaw(R.state) ? "Who will convince?" : "Vote");
    return;
  }
  if (phase === "closing") {
    sfx.boop();
    say("Reconsider?");
    return;
  }
  if (phase === "tie") {
    sfx.boop();
    say("Tie!");
    return;
  }
  if (phase !== "discuss") return;
  sfx.boop(); // End turn is open
  await pause(350);
  if (job !== sayJob) return;
  if (isLaw(R.state)) {
    // the verdict, then the winner bumps the loser off the cloud
    const L = R.state.law || {},
      w = L.w === 0 ? L.off : L.w === 1 ? L.def : null,
      p = w && R.state.players[w];
    const wn = p ? p.name : "The " + (L.w ? "defense" : "offense");
    say(
      L.w === -1
        ? "Hung jury!"
        : L.left
          ? `${wn} wins: the other side left!`
          : L.gave
            ? `${wn} wins: the other side gave up!`
            : `${wn} convinced the jury!`,
    );
    await pause(3200);
    if (job !== sayJob) return;
    unsay();
    await pause(650);
    if (job !== sayJob) return;
    say("Who argued it best?", true);
    return;
  }
  say("The votes are in!");
  await pause(2400);
  if (job !== sayJob) return;
  unsay();
  await pause(650);
  if (job !== sayJob) return;
  say(
    isBb(R.state) ? "Why that one?" : "Why did you choose what you chose?",
    true,
  );
}

const PICK_NAMES = {
  hammer: "Hammer",
  dagger: "Throwing dagger",
  handgun: "Handgun",
  shotgun: "Shotgun",
};
/* Mad God Justin: "Defeat Justin!" as the fight starts; then he's defeated (and a LOSER), or time's up */
async function announceMgj(s, phase) {
  const job = ++sayJob;
  if (phase === "boss") {
    sfx.drum();
    say("Defeat Justin!");
    return;
  }
  if (phase !== "mgjend") return;
  if (!(s.mgj && s.mgj.won)) {
    sfx.bonk();
    say("Time's up!");
    return;
  }
  sfx.done();
  confettiRain(5000);
  say("Justin is DEFEATED!");
  await pause(3400);
  if (job !== sayJob) return;
  unsay();
  await pause(650);
  if (job !== sayJob) return;
  say("LOSER!");
}
/* Duncelation: the cloud asks "Dunce or Not?" as a take starts; the verdict; the dunce */
async function announceDunce(s, phase) {
  const job = ++sayJob,
    C = s.dn && s.dn.cur,
    p = C && s.players[C.def],
    [d, n] = (C && C.end) || [0, 0];
  if (phase === "answer") {
    sfx.boop();
    say("Dunce or Not?");
    return;
  }
  if (phase === "discuss") {
    sfx.boop();
    await pause(350);
    if (job === sayJob) say(`Not a dunce! ${n}–${d}`);
    return;
  }
  if (phase !== "dunced" || !p) return;
  sfx.drum();
  say(`${p.name} is a DUNCE!`);
  await pause(3400);
  if (job !== sayJob) return;
  unsay();
  await pause(650);
  if (job !== sayJob) return;
  say("LOSER!");
}
/* Valentine's Duck Date: the cloud as a date starts, at the pick, and the news */
async function announceVd(s, phase) {
  const job = ++sayJob,
    V = s.vd;
  if (!V) return;
  if (phase === "vddate") {
    sfx.boop();
    say("Date time!");
    return;
  }
  if (phase === "vdpick") {
    sfx.drum();
    say("Who's out?");
    return;
  }
  if (phase === "vddown") {
    const last = V.picks[V.picks.length - 1];
    sfx.boop();
    say(last && last.id ? "Turned Down!" : "Nobody!");
    return;
  }
  if (phase === "vdval") {
    sfx.drum();
    await pause(400);
    if (job === sayJob) say("Valentine!");
  }
}
/* Who is the Quack?: whose clue it is; the vote; then the drumroll and the news, a line at a time */
async function announceQuack(s) {
  const job = ++sayJob,
    lines = quackLines(s),
    w = s.wq;
  if (!lines.length) return;
  if (s.phase === "clue") {
    sfx.boop();
    say(lines[0]);
    return;
  }
  if (s.phase !== "reveal") {
    await pause(Math.max(250, graceLeftMs(s)));
    if (job === sayJob) say(lines[0]);
    return;
  }
  for (let i = 0; i < lines.length; i++) {
    if (i) {
      await pause(w.lastOut && i === 1 ? 2600 : 2200);
      if (job !== sayJob) return;
      unsay();
      await pause(650);
      if (job !== sayJob) return;
    }
    say(lines[i]);
    if (i === 0 && w.lastOut) sfx.drum();
    if (i === 1 && w.lastOut)
      (w.result && w.result.quacks.includes(w.lastOut) ? sfx.done : sfx.bonk)();
  }
}

/* ---------- the views ---------- */
/* a question shows in its writer's font */
const writerFont = (s) => {
  const q = s.qs[s.qi],
    p = q && s.players[q.by];
  return p && p.nameStyle && p.nameStyle.font;
}; // (its id)
const lordHTML = (s) => cloudHTML(s.players[s.qs[s.qi].by] || null);

function viewSubmit(s) {
  const mineDone = s.done[R.me],
    sent = (s.subs || []).find((q) => q.by === R.me);
  const what = isLaw(s)
    ? "topic"
    : isDn(s)
      ? "take"
      : isDdr(s)
        ? "statement"
        : "question";
  return `<div class="submit-wrap">${
    mineDone
      ? `<div class="panel submit-card done-card"><h2>${sent ? `${what[0].toUpperCase() + what.slice(1)} sent ✓` : `No ${what} this round`}</h2>
      ${sent ? `<p class="q-echo">${esc(sent.text)}</p>` : ""}<p class="dim">Waiting for the others.</p></div>`
      : isLaw(s)
        ? `<form class="panel submit-card" autocomplete="off"><h2>Your topic</h2>
      <p class="small dim">Someone else will have to defend it, so make it worth arguing about. Nobody sees it until its case.</p>
      <textarea maxlength="${textMax(s)}" rows="3" placeholder="Pineapple belongs on pizza." aria-label="Your topic"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
        : isDn(s)
          ? `<form class="panel submit-card" autocomplete="off"><h2>Your take</h2>
      <p class="small dim">Something controversial enough to argue about. ${s.options.dunceTakes === "own" ? "You defend your own take." : s.options.dunceTakes === "notOwn" || +s.options.noOwn ? "Someone else will have to defend it." : "It goes to a random duck, maybe you."} Nobody is told who wrote it.</p>
      <textarea maxlength="${textMax(s)}" rows="3" placeholder="Cereal is a soup." aria-label="Your take"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
          : isDdr(s)
            ? `<form class="panel submit-card" autocomplete="off"><h2>Your statement</h2>
      <p class="small dim">Something people might relate to, or might not.</p>
      <textarea maxlength="${textMax(s)}" rows="3" placeholder="I've laughed at my own joke before anyone else." aria-label="Your statement"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
            : `<form class="panel submit-card" autocomplete="off"><h2>Your question</h2>
      ${
        isWyr(s)
          ? `<p class="wyr-head">Would you rather…</p><div class="wyr-pair">
        <textarea class="wyr-in" data-side="a" maxlength="${Math.min(100, textMax(s))}" rows="3" placeholder="Lose every right ever and become data breached" aria-label="The first choice"></textarea>
        <span class="wyr-or-word">OR</span>
        <textarea class="wyr-in" data-side="b" maxlength="${Math.min(100, textMax(s))}" rows="3" placeholder="Admit Justin is right about data breaching" aria-label="The second choice"></textarea></div>`
          : `<textarea maxlength="${textMax(s)}" rows="3" placeholder="Data breaching is a serious problem, and IDIOTS don't understand what I am saying!" aria-label="Your question"></textarea>`
      }
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <div class="sect"><h3 data-tip="How long everyone gets to answer your question.">Answer time</h3><div class="row">${[
        [0, "Off"],
        [30, "30 s"],
        [60, "60 s"],
        [90, "90 s"],
      ]
        .map(
          ([v, n]) =>
            `<button type="button" class="tile" data-time="${v}" aria-pressed="${v === s.options.answerTime}">${n}</button>`,
        )
        .join("")}</div></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
  }
    <div class="who">${whoHTML(s)}</div></div>`;
}
const whoHTML = (s) =>
  s.seat
    .map(
      (id) =>
        `<span class="who-chip${s.done[id] ? " done" : ""}">${duckSVG(s.players[id].duck, { size: 26, shadow: false })}${nameHTML(s.players[id].name, s.players[id].nameStyle)}${s.done[id] ? " ✓" : ""}</span>`,
    )
    .join("");

/* the stat boxes: this round's, then every round's once the review vote passes (redrawn as jumps and votes come in) */
function statsHTML(s) {
  if (isQuack(s)) return quackStatsHTML(s);
  if (isSc(s)) return storyStatsHTML(s);
  if (isWyr(s)) return wyrStatsHTML(s);
  if (isLaw(s)) return s.phase === "over" ? lawOverHTML(s) : lawStatsHTML(s);
  if (isDn(s)) return s.phase === "over" ? dnOverHTML(s) : dnStatsHTML(s);
  if (isMgj(s)) return s.phase === "over" ? mgjOverHTML(s) : mgjStatsHTML(s);
  if (isVd(s)) return vdStatsHTML(s);
  const boxes = (r) =>
    s.seat
      .map((id) => (isDdr(s) ? ddrBoxHTML : statBoxHTML)(s, id, r))
      .join("");
  if (s.phase === "over") return boxes(null);
  return `<h2>Round ${s.round + 1}</h2><div class="statboxes">${boxes(s.round)}</div>
    ${s.review ? `<h2 class="all-h">All rounds</h2><div class="statboxes">${boxes(null)}</div>` : ""}`;
}
/* Would You Rather's stats: the round's awards (ties named together), then each player's sides */
function wyrStatsHTML(s) {
  const nm = (id) =>
    s.players[id]
      ? nameHTML(s.players[id].name, s.players[id].nameStyle)
      : "Gone";
  const block = (round) => {
    const { per, questions } = wyrStats(s, round),
      ids = Object.keys(per).filter((id) => s.players[id]);
    /* the best (or the least) of a number; everyone tied at the top is named */
    const top = (f, low = false, ok = () => true) => {
      const xs = ids.filter(ok).map((id) => [id, f(per[id])]);
      if (!xs.length) return null;
      const v = low
        ? Math.min(...xs.map((x) => x[1]))
        : Math.max(...xs.map((x) => x[1]));
      return { v, who: xs.filter((x) => x[1] === v).map((x) => x[0]) };
    };
    const writers = (id) => per[id].written > 0,
      avg = (p) => p.split / p.written;
    const jx = s.seat.map((id) => [id, (s.jumps || {})[id] || 0]),
      jv = Math.max(0, ...jx.map((x) => x[1])),
      jumps = jv
        ? { v: jv, who: jx.filter((x) => x[1] === jv).map((x) => x[0]) }
        : null;
    const award = (title, r, line) =>
      r && r.who.length
        ? `<div class="award"><h3>${esc(title)}</h3><p>${r.who.map(nm).join(r.who.length > 2 ? ", " : " and ")}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ""}</p><p class="small dim">${line(r.v)}</p></div>`
        : "";
    const most = top(avg, false, writers),
      least = top(avg, true, writers),
      contra = top((p) => p.min),
      band = top((p) => p.maj);
    return `<div class="awards">${award("Started the most disagreement", most && most.v > 0 ? most : null, (v) => (v >= 0.999 ? "Their questions split the room right down the middle." : `Their questions split the room the most evenly (${Math.round(v * 100)}% of an even split).`))}
      ${award("Started the least disagreement", least && most && least.v !== most.v ? least : null, (v) => (v === 0 ? "Everyone picked the same side on their questions." : `Their questions split the room the least (${Math.round(v * 100)}% of an even split).`))}
      ${award("Contrarian", contra && contra.v ? contra : null, (v) => `On the smaller side ${v} time${v === 1 ? "" : "s"}.`)}
      ${award("Bandwagoner", band && band.v ? band : null, (v) => `With the bigger side ${v} time${v === 1 ? "" : "s"}.`)}
      ${award("Most jumps", jumps, (v) => `${v} jump${v === 1 ? "" : "s"}.`)}</div>
      <div class="wyr-qs panel">${questions.map((q) => `<p class="small"><span class="dim">${q.by && s.players[q.by] ? esc(s.players[q.by].name) : "?"}:</span> ${esc(q.text)} <b class="wyr-split"><span class="a">${q.A}</span> · <span class="b">${q.B}</span></b></p>`).join("")}</div>`;
  };
  return `<h2>Round ${s.round + 1}</h2>${block(s.round)}${s.review ? `<h2 class="all-h">All rounds</h2>${block(null)}` : ""}`;
}
const viewResults = (s) =>
  `<div class="results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
const viewOver = (
  s,
) => `<div class="over"><h1 class="over-title">${rainbowHTML("Game over")}</h1>
    <p class="dim">${s.round + 1} round${s.round ? "s" : ""} · ${isMgj(s) ? `${(s.mgjPast || []).length} fight${(s.mgjPast || []).length === 1 ? "" : "s"}` : `${s.history.length} ${isLaw(s) ? "case" : isDn(s) ? "take" : "question"}${s.history.length === 1 ? "" : "s"}`}</p>
    <div class="statboxes grid"></div></div>`;

/* my all-time stats: a round counts once its stats are up (not in test rooms), a game with its first round I played */
function recordRound(s) {
  const key = `${s.id}:${s.startedAt}:${s.round}`;
  if (key === recorded) return;
  recorded = key;
  if (s.test) return;
  const st = profile.stats[(s.options && s.options.mode) || "aod"];
  if (isQuack(s)) {
    // Who is the Quack?: my votes (and the right ones), the round won or lost, and won as the Quack
    const r = (s.wqPast || []).slice(-1)[0];
    if (!st || !r || !r.ids.includes(R.me)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    const mine = r.votes.map((v) => v.who[R.me]).filter(Boolean),
      q = r.quacks.includes(R.me);
    st.rounds++;
    st.answers += mine.length;
    st.majority += mine.filter((t) => r.quacks.includes(t)).length;
    if (r.win) {
      if ((r.win === "quack") === q) {
        st.wins++;
        if (q) st.titles++;
      } else st.losses++;
    }
    save();
    shareLook();
    return;
  }
  if (isLaw(s)) {
    // Lawyering: my cases argued, won, lost and given up, and my jury votes
    const p = lawStats(s, s.round).per[R.me];
    if (!st || !p || !(p.argued || p.votes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.votes;
    st.argued += p.argued;
    st.wins += p.won;
    st.losses += p.lost;
    st.gave += p.gave;
    save();
    shareLook();
    return;
  }
  if (isDn(s)) {
    // Duncelation: my takes defended, not a dunce and a dunce, and my votes
    const p = dnStats(s, Math.max(0, ((s.dn && s.dn.dkN) || 0) - 1)).per[R.me];
    if (!st || !p || !(p.turns || p.votes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.votes;
    st.argued += p.turns;
    st.wins += p.turns - p.dunced;
    st.losses += p.dunced;
    save();
    shareLook();
    return;
  }
  if (isVd(s)) {
    // Valentine's Duck Date: my dates, the game won (the Valentine) or lost (Turned Down), and my games as The Date
    const V = s.vd,
      p = vdStats(s).per[R.me];
    if (!st || !V) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds += V.turn || 0;
    st.argued += p ? p.dates : 0;
    if (V.val === R.me) st.wins++;
    else if (turnedDown(s, R.me)) st.losses++;
    if (isDate(s, R.me)) st.titles++;
    save();
    shareLook();
    return;
  }
  if (isMgj(s)) {
    // Mad God Justin: my fights, won and lost, my stabs, the times he got me, my killing blows
    const f = (s.mgjPast || []).slice(-1)[0],
      p = mgjStats(s).per[R.me];
    if (!st || !f || !p || !(f.ids || []).includes(R.me)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.dmg;
    st.majority += p.hits;
    st.titles += p.kills;
    if (f.won) st.wins++;
    else st.losses++;
    save();
    shareLook();
    return;
  }
  if (isSc(s)) {
    // Story Chain: my lines, and the votes for my lines and my secret word
    const p = scStats(
      s.sc.stories.flatMap((x) => x.paras).filter((x) => x.round === s.round),
    )[R.me];
    if (!st || !p || !(p.lines || p.lvotes || p.wvotes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.lines;
    st.wins += p.lvotes;
    st.titles += p.wvotes;
    save();
    shareLook();
    return;
  }
  if (isBb(s)) {
    // Bicker Brackets: my votes in matches, my seeds' wins and losses, and a tournament won
    const t = (s.bbPast || []).slice(-1),
      p = bbStats(t)[R.me];
    if (!st || !p || !(p.votes || p.wins || p.losses)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.votes;
    st.wins += p.wins;
    st.losses += p.losses;
    st.titles += p.titles;
    save();
    shareLook();
    return;
  }
  const mine = s.history.filter(
    (h) => h.round === s.round && h.a[R.me] !== undefined,
  );
  if (!st || !mine.length) return;
  const game = `${s.id}:${s.startedAt}`;
  if (profile.stats.lastGame !== game) {
    profile.stats.lastGame = game;
    st.games++;
  }
  st.rounds++;
  st.answers += mine.length;
  if (isWyr(s)) {
    const p = wyrStats(s, s.round).per[R.me] || {};
    st.majority += p.maj || 0;
    st.minority += p.min || 0;
  } // which side I was on
  else if (isDdr(s)) {
    const p = ddrStats(s, R.me, s.round);
    st.majority += p.yes;
    st.minority += p.no;
  } // (Does Duck Relate?: related, and didn't)
  else for (const h of mine) st.counts[h.a[R.me]]++;
  save();
  shareLook();
}

/* ---------- the specials on the number keys ---------- */
const myDuck = () => ((R && R.state.players[R.me]) || {}).duck || profile.duck;
/* the duck my keys play with: in Quacky Zombies its slots on 1 to 4 (melee, ranged, ranged, the special); in Mad God
   Justin its own keys: 1 the knife, 2 the bow, 3 the medkit (once a game), 4 Jaime, 5 the weapon picked up, 6 the zebra
   cake (my own keys stay as they are) */
const playDuck = () =>
  R && isL4dd(R.state)
    ? {
        ...myDuck(),
        keys: [
          ...slotsOf(R.state, R.me).map((w) => w || null),
          ...Array(6).fill(null),
        ],
      }
    : R && isMgj(R.state)
      ? {
          ...myDuck(),
          keys: [
            "knife",
            "bow",
            kitUsed() ? null : "medkit",
            "jaime",
            specialById(myPick()) ? myPick() : null,
            "zebra",
            ...Array(4).fill(null),
          ],
        }
      : myDuck();
const kitUsed = () => !!(R && R.state.mgj && (R.state.mgj.kits || {})[R.me]);
/* the weapon in my duck's hand: the one kept out (Shift and its key); Quacky Zombies: always the one in the slot
   picked (the melee weapon at first; back to the one before when the special is used up), none while I'm down or a
   ghost */
function heldNow() {
  if (R && isL4dd(R.state)) {
    const sl = slotsOf(R.state, R.me);
    if (!sl[l4Slot]) l4Slot = sl[l4Last] ? l4Last : 0;
    return l4Hp(R.state, R.me) > 0 ? sl[l4Slot] || "" : "";
  }
  return held && hasKey(playDuck(), held) ? held : "";
}
/* Mad God Justin: the weapon I picked up (one use), or none */
const myPick = () =>
  (R && R.state.mgj && (R.state.mgj.held || {})[R.me]) || null;
/* the effects kept on for my duck (in the room's state), and the jumps and the weapon kept on here */
function keptNow() {
  const out = new Set(
      [...kept, ...(held ? [held] : [])].filter((id) => hasKey(playDuck(), id)),
    ),
    a = ((R && R.state.aura) || {})[R && R.me] || {};
  for (const [id, u] of Object.entries(a)) if (u === 0) out.add(id);
  return out;
}
/* phones: the slider picked key i (in Mad God Justin the knife, the bow or the medkit goes in hand) */
function slidPick(i) {
  const id = keysOf(playDuck())[i];
  if (R && isMgj(R.state) && ["knife", "bow", "medkit"].includes(id))
    useKey(i, false);
}
/* phones: the special in the slider's middle tapped: used (a weapon attacks the way the duck faces; in Mad God Justin
   the medkit gets the downed duck next to mine up) */
function slidTap(i) {
  const id = keysOf(playDuck())[i];
  if (R && isMgj(R.state) && ["knife", "bow", "medkit"].includes(id)) {
    useKey(i, false);
    fire(id);
  } else useKey(i, false);
}
/* phones: the weapon in the slider's middle, which the attack button uses (or null) */
function padWeapon() {
  const id = bar && bar.current && bar.current();
  if (id && R && isL4dd(R.state)) {
    if (id === "grenade") return id;
    return ARMS[id] && ARMS[id].kind !== "special" && id === heldNow()
      ? id
      : null; // (the flashlight and the medkit don't attack: a tap on the slider uses them)
  } // (Quacky Zombies: the weapon in hand, or the grenades)
  if (!id || !R || !hasKey(playDuck(), id)) return null;
  if (isMgj(R.state))
    return R.state.phase === "boss" &&
      (id === "knife" || id === "bow" || PICK_WEAPONS.includes(id))
      ? id
      : null;
  const sp = specialById(id);
  return (WEAPONS.includes(id) || THROWS.includes(id)) &&
    sp &&
    !sp.off &&
    unlocked("special", id)
    ? id
    : null;
}
/* phones: the attack button: the weapon in the slider's middle, where the button aims; says when it can again (ms) */
function padAttack() {
  const id = padWeapon();
  if (!id) return 500;
  if (isL4dd(R.state)) {
    fire(id);
    return l4Cool(R.state, R.me, id);
  }
  if (isMgj(R.state) && (id === "knife" || id === "bow")) mgjHold = held = id;
  fire(id);
  return coolFor(id, R.state);
}
/* key i (0 is key 1 … 9 is key 0): an effect for 5 seconds (keep: on until kept off), a jump, or an item */
function useKey(i, keep) {
  if (!R || !onBoardPhase()) return;
  if (isL4dd(R.state)) {
    l4Pick(i);
    return;
  }
  if (bar) bar.show(i);
  if (isMgj(R.state)) {
    const id = keysOf(playDuck())[i];
    if (["knife", "bow", "medkit"].includes(id)) {
      mgjHold = held = id;
      sendMove(true);
    } // (always kept out once picked: a click, V, or for the medkit E or Enter, uses it)
    else if (id === "jaime" && me && me.x >= 0)
      R.send({ t: "use", what: "jaime", face: me.face || 1 });
    else if (id) fire(id); // (the zebra cake, or the weapon picked up: at once)
    if (bar) setTimeout(() => bar && bar.refresh(), 60);
    return;
  } // (Mad God Justin's own keys)
  const id = keysOf(playDuck())[i],
    sp = specialById(id);
  if (!sp || sp.off || !unlocked("special", id)) return; // (a special that's off for now, or still locked, does nothing)
  lastKey = i;
  if (sp.kind === "effect")
    R.send({
      t: "aura",
      what: id,
      keep: !!keep || id === "invisible" || id === "jetpack",
    });
  // (the Invisible duck and the Jetpack: the key turns it on and off)
  else if (sp.kind === "jump") {
    if (keep) {
      if (kept.has(id)) kept.delete(id);
      else {
        kept.add(id);
        if (id === "shortjump") {
          kept.delete("longjump");
          kept.delete("double");
        } else kept.delete("shortjump");
      } // (kept on, the Short jump turns the Long jump and the Double jump off, and either of them turns it off)
    } else
      jump(
        id === "longjump" ? "long" : id === "shortjump" ? "short" : "double",
      );
  } else if (WEAPONS.includes(id) && keep && !isMgj(R.state)) {
    held = held === id ? null : id;
    sendMove(true);
  } // the handgun or the dagger: kept out (a left click uses it) or put away
  else if (WEAPONS.includes(id) || THROWS.includes(id))
    fire(id); // (the Chair and the Zebra cake: thrown toward the mouse)
  else if (me && me.x >= 0)
    R.send({ t: "use", what: id, face: turned() ? 1 : me.face || 1 }); // (an item: Shift and its key use it the same way)
  if (bar) setTimeout(() => bar && bar.refresh(), 60);
}
/* Quacky Zombies: keys 1 to 4 pick a slot. A melee or ranged weapon stays in hand once picked; the special (4)
   switches on and off: on, it's in hand instead of the weapon, and off (or used up) that weapon is back */
function l4Pick(i) {
  const sl = slotsOf(R.state, R.me);
  if (i > 3 || !sl[i]) return;
  if (i === 3) {
    if (l4Slot === 3) l4Slot = l4Last;
    else {
      l4Last = l4Slot;
      l4Slot = 3;
    }
  } else l4Slot = l4Last = i;
  sendMove(true);
  if (bar) bar.refresh();
}
/* the handgun or the dagger, toward the mouse */
function fire(id) {
  if (!me || me.x < 0 || !R || !onBoardPhase()) return;
  const [ax, ay] = myAim();
  R.send({ t: "use", what: id, face: ax < 0 ? -1 : 1, ax, ay });
  if (bar) setTimeout(() => bar && bar.refresh(), 60); // (the handgun's dots, a cooldown's bar)
}
/* the items on my keys still waiting to work again: [ends (room clock), how long it waits, now] for each key, or null */
function cool() {
  if (!R) return [];
  const now = clockNow();
  const m = isMgj(R.state) && R.state.mgj;
  return keysOf(playDuck()).map((id) => {
    const sp = specialById(id);
    if (!sp || sp.kind !== "item") return null;
    if (m && id === "jaime") {
      const p = jaimePool(m, now);
      return p.n >= JAIME_MAX
        ? null
        : [p.at + JAIME_MS, JAIME_MS, now, p.n ? "more" : ""];
    } // (one pool for everyone: with one stored, the bar charges the next in its second color)
    if (m && id === "zebra") {
      const end = (m.zebraAt || 0) + CAKE_EVERY;
      return end > now || m.cake
        ? [Math.max(end, now + 1), CAKE_EVERY, now]
        : null;
    } // (shared too)
    if (id === "handgun") {
      const r = magOf(R.state, R.me, now).r;
      return r > now ? [r, RELOAD, now] : null;
    } // (between shots no bar: only the reload)
    const end = coolEnds(R.state, R.me, id);
    return end > now ? [end, coolFor(id, R.state), now] : null;
  });
}
/* the handgun's shots left (for the dots under its key) */
function ammo() {
  if (R && isMgj(R.state)) return usesOf(R.state, R.me);
  return R ? MAG - magOf(R.state, R.me, clockNow()).n : MAG;
}
/* the dots under a key: the handgun's shots, or in Mad God Justin the uses left of the weapon picked up */
const dots = (id) =>
  R && isMgj(R.state)
    ? PICK_USES[id] && id === myPick()
      ? ammoHTML(usesOf(R.state, R.me), PICK_USES[id])
      : id === "jaime"
        ? ammoHTML(jaimePool(R.state.mgj, clockNow()).n, JAIME_MAX)
        : ""
    : id === "handgun"
      ? ammoHTML(ammo())
      : "";
/* R: the handgun reloads */
function reload() {
  if (R && isL4dd(R.state) && onBoardPhase()) {
    R.send({ t: "reload", w: heldNow() });
    return true;
  } // (Quacky Zombies: the ranged weapon in hand)
  if (!R || !onBoardPhase() || !hasKey(playDuck(), "handgun")) return false;
  R.send({ t: "reload" });
  return true;
}
const aimAt = (e) => {
  mouse = { x: e.clientX, y: e.clientY };
  keyAim = null;
}; // (the handgun and the dagger aim at the mouse; in Mad God Justin the arrow keys too, whichever moved last)
/* Mad God Justin: the arrow keys aim instead of walking (WASD walks) */
const arrowsAim = () => !!R && isMgj(R.state) && R.state.phase === "boss";
const ARROWS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
function keyAimNow() {
  let x = 0,
    y = 0;
  for (const [k, [dx, dy]] of Object.entries(ARROWS))
    if (keys.has(k)) {
      x += dx;
      y += dy;
    }
  if (x || y) keyAim = [x * 100, y * 100]; // (on the screen; let go, it keeps aiming that way)
}
const KEY_CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const keyIndex = (e) => {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
  return m ? KEY_CODES.indexOf(m[1]) : -1;
};

/* the first seconds of a vote (no voting yet), or of a clue turn in Who is the Quack? (12 s before it can end) */
const graceOf = (s) =>
  isVd(s) && s.phase === "vddate"
    ? VD_GRACE
    : isVd(s) && s.phase === "vdpick"
      ? VOTE_GRACE
      : s.phase === "answer" && isDn(s)
        ? DN_GRACE
        : s.phase === "answer" ||
            (isSc(s) && SC_VOTES.includes(s.phase)) ||
            (isQuack(s) && ["choice", "accuse"].includes(s.phase))
          ? VOTE_GRACE
          : isQuack(s) && s.phase === "clue"
            ? CLUE_GRACE
            : 0;
const graceLeftMs = (s) =>
  graceOf(s) ? Math.max(0, s.at + graceOf(s) * 1000 - clockNow()) : 0;
const graceLeft = (s) => Math.ceil(graceLeftMs(s) / 1000);
/* Mad God Justin: what my keys do now, in a line */
function mgjTip(s) {
  const phone = touchOnly();
  if ((s.players[R.me] || {}).dead)
    return mgjOut(s, R.me)
      ? "Out of HP! A medkit, or the fight's end, gets you up."
      : "Knocked down! Up again in a moment.";
  if (myPick())
    return `${PICK_NAMES[myPick()] || "A weapon"} picked up: ${phone ? "slide to it, then push the crosshair" : "<kbd>5</kbd>"} to use it`;
  if (held === "medkit")
    return `Medkit: stand by a downed duck, then ${phone ? "tap it" : "<kbd>E</kbd>"}`;
  return phone
    ? padWeapon()
      ? "Aim the crosshair at Justin, then push a little further to attack"
      : "Tap the special in the middle to use it"
    : "<kbd>WASD</kbd> walk · <kbd>Arrows</kbd> or the mouse aim · <kbd>Click</kbd> use";
}
/* the middle of the bottom bar: what you can do now, and how many are done */
function actHTML(s) {
  const on = playing(s),
    n = on.length,
    d = on.filter((id) => s.done[id]).length,
    need = needed(s),
    mine = s.done[R.me];
  if (s.waiting && s.waiting.for) {
    const g = goOnVotes(s).length,
      mineG = !!(s.waiting.go || {})[R.me];
    return `<div class="act-row"><span class="progress wait-bar" role="status">Waiting for ${esc(s.waiting.name || "a player")} to come back</span><button type="button" class="btn${mineG ? " yellow" : " green"}" data-a="goon" aria-pressed="${mineG}" data-tip="Go on without them">${mineG ? "Next round ✓" : "Next round"} · ${g}/${goOnNeed(s)}</button></div>`;
  } // (Lawyering, Duncelation: an attorney or the defender left mid-case)
  if (s.waiting)
    return `<span class="progress wait-bar" role="status">Waiting for players to continue <b>${s.seat.length}/${minOf(s)}</b></span>`; // (a game below its fewest players: ducks still walk)
  if (isQuack(s) && QUACK_PHASES.includes(s.phase)) return quackActHTML(s);
  if (isVd(s) && VD_PHASES.includes(s.phase)) return vdActHTML(s);
  if (isHang(s)) return world ? world.buttonHTML() : ""; // Hangout: the nearest activity's button (Light off …)
  if (late())
    return `<span class="progress">You joined mid-turn: walk around and chat. You play from the next ${isBb(s) ? "match" : isLaw(s) ? "case" : isDn(s) ? "take" : "question"}. · ${d}/${n} done</span>`;
  const count = `<span class="progress">${d}/${n} done${need < n ? ` · ${need} needed` : ""}</span>`;
  if (isSc(s)) return storyActHTML(s, d, n, need, count);
  if (["submit", "topic", "tvote", "seeds", "counsel"].includes(s.phase))
    return count;
  if (s.phase === "podium") return "";
  if (s.phase === "tie") {
    // the tied match: vote again or toss a coin (a choice can change until everyone has chosen)
    const v = (s.bb.tie || {}).votes || {},
      n = (k) => Object.values(v).filter((x) => x === k).length,
      mineV = v[R.me];
    return `<div class="act-row"><button type="button" class="btn${mineV === "again" ? " green" : " ghost"}" data-a="tieagain" aria-pressed="${mineV === "again"}">Vote again · ${n("again")}</button><button type="button" class="btn${mineV === "coin" ? " yellow" : " ghost"}" data-a="tiecoin" aria-pressed="${mineV === "coin"}">Coin toss · ${n("coin")}</button>${count}</div>`;
  }
  if (s.phase === "bracket")
    return `<div class="act-row"><button type="button" class="btn theme-btn${mine ? " done" : ""}" data-a="end">${mine ? "Waiting ✓" : s.bb.champ != null ? "On to the podium" : "Next match"} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === "answer" && isLaw(s) && s.law) return lawActHTML(s);
  if (s.phase === "answer" && isDn(s) && s.dn && s.dn.cur) return dnActHTML(s);
  if (s.phase === "boss")
    return `<span class="progress mgj-tip">${mgjTip(s)}</span>`;
  if (s.phase === "mgjend")
    return `<span class="progress">${s.mgj && s.mgj.won ? "Justin is defeated!" : "Justin wins this time."} The stats are next.</span>`;
  if (s.phase === "dunced") {
    const p = s.players[((s.dn && s.dn.cur) || {}).def];
    return `<span class="progress">${p ? `${esc(p.name)} is the dunce` : "A dunce"}</span>`;
  }
  if (s.phase === "answer") {
    /* Vote: the button takes the color of the column you stand on; no voting in the first seconds; once locked it waits
       for everyone (End turn comes after, when the votes are in) */
    const onBoard = me && me.x >= 0,
      wait = graceLeft(s),
      col = onBoard ? colAt(s, me.x) : -1;
    const votes = `<span class="progress">${d}/${n} voted${need < n && !isBb(s) ? ` · ${need} needed` : ""}</span>`; // (a bracket match waits for every vote or its timer)
    const q = s.qs[s.qi],
      m = bbMatch(s);
    const choices = m
      ? [
          [s.bb.seeds[m.a].text, "bb-a"],
          [s.bb.seeds[m.b].text, "bb-b"],
        ]
      : isWyr(s)
        ? [
            [q.a, "wyr-a"],
            [q.b, "wyr-b"],
          ]
        : isDdr(s)
          ? DDR_SIDES.map((t, c) => [t, `wyr-${c ? "b" : "a"}`])
          : COLS.map((c, i) => [c, `c${i + 1}`]);
    const mc =
      profile.settings.multipleChoice && (!mine || s.options.freeRoam)
        ? `<div class="mc">${choices.map(([c, k], i) => `<button type="button" class="mc-b ${k}" data-col="${i}">${esc(c)}</button>`).join("")}</div>`
        : "";
    const label = wait
      ? `Vote in ${wait}`
      : s.options.freeRoam
        ? mine
          ? "Ready ✓"
          : "Ready"
        : mine
          ? "Voted ✓"
          : "Vote";
    const off = wait || !onBoard || col < 0; // (Voted ✓ stays pressable: pressing it again takes the vote back)
    const tip = s.options.freeRoam
      ? "Free roam: keep moving; where you stand when the turn ends is your vote."
      : mine
        ? "Press again to take your vote back."
        : "";
    return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine ? " voted" : ""}" data-a="end" data-col="${col}"${off ? " disabled" : ""}${tip ? ` data-tip="${tip}"` : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${votes}</div>`;
  }
  if (s.phase === "discuss")
    return `<div class="act-row"><button type="button" class="btn theme-btn${mine ? " done" : ""}" data-a="end">${mine ? "Waiting ✓" : "End turn"} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === "results" && isVd(s))
    return `<div class="act-row"><button type="button" class="btn${mine ? " yellow" : " green"}" data-a="end">${mine ? "Waiting ✓" : VD_AFTER === "lobby" ? "Back to the lobby" : "New game"} <kbd>Enter</kbd></button>${count}</div>`; // (Valentine's Duck Date: one game, one Valentine)
  if (s.phase === "results") {
    const rv = reviewCount(s),
      lv = s.vote && s.vote.kind === "lobby";
    return `<div class="act-row"><button type="button" class="btn${mine ? " yellow" : " green"}" data-a="end">${mine ? "Waiting ✓" : isBb(s) ? "Next tournament" : isMgj(s) ? "Try again" : "Next round"} <kbd>Enter</kbd></button>
      ${s.round >= 1 && !s.review && !isMgj(s) ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? " disabled" : ""} data-tip="Adds every round's stats after this round's. One vote each round.">All-rounds review ${rv}/${need}</button>` : ""}
      <button type="button" class="btn ${lv ? "red" : "ghost"}" data-a="lobbyvote"${s.round === 1 ? ' data-tip="You can also vote to go back to the lobby on the all-rounds stats screen."' : ""}>${lv ? "Vote yes: back to the lobby" : "Vote: back to the lobby"}</button>${count}</div>`;
  }
  if (s.phase === "over")
    return `<div class="act-row">${isSudo(s, R.me) ? '<button type="button" class="btn green" data-a="lobby">Back to the lobby</button>' : '<span class="dim">The host takes everyone back to the lobby.</span>'}<button type="button" class="btn ghost" data-a="leave">Leave</button></div>`;
  return "";
}

/* Valentine's Duck Date: The Date's buttons (Next duck in a date, Turn down in the pick), and what everyone else sees */
function vdActHTML(s) {
  const V = s.vd;
  if (!V) return "";
  const name = (id) => esc((s.players[id] || { name: "Gone" }).name),
    wait = graceLeft(s);
  if (late())
    return `<span class="progress">You joined mid-game: walk around and chat. You're a Suitor from the next turn.</span>`;
  if (s.phase === "vdprompt")
    return `<span class="progress">${isDate(s, R.me) ? "Write the topic for this turn's dates (empty: a random one)." : "The Date is writing the topic for this turn…"}</span>`;
  if (s.phase === "vddate") {
    /* the date's timer: it starts when The Date presses Start timer, and pressing it again pauses it */
    const tm = V.tm,
      ms = tm ? (tm.run ? Math.max(0, s.ends - clockNow()) : tm.left) : 0,
      left = Math.ceil(ms / 1000),
      lefts = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (isDate(s, R.me))
      return `<div class="act-row">${tm ? `<button type="button" class="btn ${tm.run ? "yellow" : "purple"}" data-a="vdtimer" aria-pressed="${tm.run}" data-tip="${tm.run ? "Pause the timer" : "Start the timer, or go on where it stopped"}">${tm.run ? "Pause timer" : `${tm.left < (+s.options.vdTime || 0) * 1000 ? "Timer paused" : "Start timer"} · ${lefts}`}</button>` : ""}<button type="button" class="btn green" data-a="end"${wait ? " disabled" : ""} data-tip="End this date and go on to the next Suitor">${wait ? `Next duck in ${wait}` : "Next duck <kbd>Enter</kbd>"}</button></div>`;
    return `<span class="progress">${V.cur === R.me ? "Your date! Win The Date over (on the call or in the chat)." : `${V.cur ? name(V.cur) : "A Suitor"} is on a date with The Date.`}${tm && !tm.run ? ` Timer ${tm.left < (+s.options.vdTime || 0) * 1000 ? "paused" : "not started"}.` : ""}</span>`;
  }
  if (s.phase === "vdpick") {
    if (!isDate(s, R.me))
      return `<span class="progress">The Date is picking who is Turned Down.</span>`;
    const k = me && me.x >= 0 ? vdTileAt(s, me) : -1,
      who = k >= 0 ? V.ids[k] : null;
    return `<div class="act-row"><button type="button" class="btn vote-btn ${who ? "red" : "ghost"}" data-a="end" data-col="${k}"${wait ? " disabled" : ""}>${wait ? `Turn down in ${wait}` : who ? `Turn down ${name(who)} <kbd>Enter</kbd>` : "Turn down nobody <kbd>Enter</kbd>"}</button></div>`;
  }
  if (s.phase === "vddown")
    return `<span class="progress">${suitorsLeft(s)} still in. The next turn is coming.</span>`;
  if (s.phase === "vdval")
    return `<span class="progress">${V.val ? `${name(V.val)} is The Date's Valentine!` : "The game is over."} The stats are next.</span>`;
  return "";
}
const suitorsLeft = (s) => {
  const n = (s.vd.ids || []).filter((id) => !turnedDown(s, id)).length;
  return `${n} Suitor${n === 1 ? "" : "s"}`;
};

/* Lawyering: an attorney argues (and, behind in closing arguments, may give up); a juror votes for the side they stand on,
   and can change it at any time */
function lawActHTML(s) {
  const L = s.law,
    j = jury(s),
    voted = j.filter((id) => L.votes[id] !== undefined).length,
    [o, d] = lawTally(s);
  const tally = L.close
    ? `<span class="progress">Offense ${o} · Defense ${d}</span>`
    : `<span class="progress">${voted}/${j.length} voted</span>`;
  if (isCounsel(s, R.me)) {
    const give = canGiveUp(s, R.me)
      ? '<button type="button" class="btn red" data-a="giveup" data-tip="In honor of the better argument (or in shame): the other side wins the case.">Give up</button>'
      : "";
    return `<div class="act-row"><span class="law-you">You're the ${L.off === R.me ? "offense" : "defense"} attorney: convince them!</span>${give}${tally}</div>`;
  }
  const onBoard = me && me.x >= 0,
    wait = graceLeft(s),
    col = onBoard ? colAt(s, me.x) : -1,
    mine = L.votes[R.me];
  const label = wait
    ? `Vote in ${wait}`
    : mine !== undefined && (col < 0 || mine === col)
      ? "Voted ✓"
      : mine !== undefined
        ? "Change vote"
        : "Vote";
  const off = !!wait || col < 0 || mine === col;
  const names = [L.off, L.def].map(
    (id) => (s.players[id] || { name: "?" }).name,
  );
  const mc = profile.settings.multipleChoice
    ? `<div class="mc">${names.map((n, i) => `<button type="button" class="mc-b law-${i ? "b" : "a"}" data-col="${i}">${i ? "Defense" : "Offense"}: ${esc(n)}</button>`).join("")}</div>`
    : "";
  return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine !== undefined ? " voted" : ""}" data-a="end" data-col="${col}"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${tally}</div>`;
}
/* Duncelation: the defender defends; everyone else votes for the side they stand on, and can change it at any time */
function dnActHTML(s) {
  const v = voters(s),
    voted = v.filter((id) => s.dn.cur.votes[id] !== undefined).length,
    [d, n] = dnTally(s);
  const tally = `<span class="progress">${voted}/${v.length} voted · Dunce ${d} · Not a Dunce ${n}</span>`;
  /* End round, beside Vote for everyone: it passes once the defender pressed it too and enough players did */
  const ev = endVotes(s),
    endMine = ev.includes(R.me);
  const end = `<button type="button" class="btn dn-end${endMine ? " yellow" : " ghost"}" data-a="dnend" aria-pressed="${endMine}" data-tip="Ends the take now once the defender presses it too and ${endNeed(s)} players in all have.">${endMine ? "End round ✓" : "End round"} · ${ev.length}/${endNeed(s)}</button>`;
  if (isDefender(s, R.me))
    return `<div class="act-row"><span class="law-you">Defend your take: it isn't a dunce take!</span>${end}${tally}</div>`;
  const onBoard = me && me.x >= 0,
    wait = graceLeft(s),
    col = onBoard ? colAt(s, me.x) : -1,
    mine = s.dn.cur.votes[R.me];
  const label = wait
    ? `Vote in ${wait}`
    : mine !== undefined && (col < 0 || mine === col)
      ? "Voted ✓"
      : mine !== undefined
        ? "Change vote"
        : "Vote";
  const off = !!wait || col < 0 || mine === col;
  const mc = profile.settings.multipleChoice
    ? `<div class="mc">${DN_SIDES.map((t, i) => `<button type="button" class="mc-b law-${i ? "b" : "a"}" data-col="${i}">${esc(t)}</button>`).join("")}</div>`
    : "";
  return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine !== undefined ? " voted" : ""}" data-a="end" data-col="${col}"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${end}${tally}</div>`;
}
/* Who is the Quack?: Done (the speaker) or Skip (everyone else) in a clue turn; Vote; End turn after the reveal */
function quackActHTML(s) {
  const w = s.wq,
    row = (x) => `<div class="act-row">${x}</div>`,
    P = (id) => esc((s.players[id] || {}).name || "Gone");
  if (s.phase === "wqpick")
    return `<span class="progress">${w.picker === R.me ? "Only you see the word you pick." : "Someone is picking the secret word."}</span>`;
  if (!w.ids.includes(R.me))
    return `<span class="progress">You joined mid-vote: walk around and chat. You play from the next ${w.result ? "round" : "lap of clues"}.</span>`;
  if (s.phase === "reveal") {
    const on = playing(s),
      d = on.filter((id) => s.done[id]).length,
      need = needed(s),
      mine = s.done[R.me],
      hold = frozen(s, R.me, clockNow());
    return row(
      `<button type="button" class="btn theme-btn${mine ? " done" : ""}" data-a="end"${hold ? " disabled" : ""}>${mine ? "Waiting ✓" : w.result ? "On to the stats" : "More clues"} <kbd>Enter</kbd></button><span class="progress">${d}/${on.length} done${need < on.length ? ` · ${need} needed` : ""}</span>`,
    );
  }
  if (w.out[R.me])
    return `<span class="progress">You're out this round: walk around and talk, but no clues or votes.</span>`;
  const g = graceLeft(s),
    inn = stillIn(s);
  if (s.phase === "clue") {
    const sp = speakerOf(s),
      others = inn.filter((id) => id !== sp),
      d = others.filter((id) => s.done[id]).length;
    if (sp === R.me)
      return row(
        `<button type="button" class="btn green" data-a="end"${g ? " disabled" : ""}>${g ? `Done in ${g}` : "Done <kbd>Enter</kbd>"}</button><span class="progress">Say your clue out loud</span>`,
      );
    const mine = s.done[R.me];
    return row(
      `<button type="button" class="btn ${mine ? "yellow" : "ghost"}" data-a="end"${g || mine ? " disabled" : ""} data-tip="Everyone else has to skip it to move on.">${mine ? "Skipped ✓" : g ? `Skip in ${g}` : `Skip ${P(sp)}'s turn <kbd>Enter</kbd>`}</button><span class="progress">${d}/${others.length} skipped</span>`,
    );
  }
  /* choice and accuse: stand on a side or a tile, then Vote (it holds your spot) */
  const d = inn.filter((id) => s.done[id]).length,
    mine = s.done[R.me],
    k = me && me.x >= 0 ? spotOf(s, me) : -1;
  const ok = k >= 0 && (s.phase === "choice" || canAccuse(s, R.me, w.ids[k])),
    off = g || !ok || mine;
  const tint =
    s.phase === "choice" && k >= 0 ? ` wq-side-${k ? "b" : "a"}` : "";
  const label = g
    ? `Vote in ${g}`
    : mine
      ? "Voted ✓"
      : s.phase === "accuse" && k >= 0 && !ok
        ? w.ids[k] === R.me
          ? "Not yourself!"
          : "Not that one"
        : "Vote";
  return row(
    `<button type="button" class="btn vote-btn${mine ? " voted" : ""}${tint}" data-a="end" data-col="${k}"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button><span class="progress">${d}/${inn.length} voted</span>`,
  );
}

/* Story Chain: whose line it is, or Vote (stand on a line, a word or a choice; not your own) */
function storyActHTML(s, d, n, need, count) {
  if (s.phase === "words") return count;
  if (s.phase === "write") return ""; // (the top bar says which line it is; the writer's window has Send)
  const onBoard = me && me.x >= 0,
    wait = graceLeft(s),
    z = onBoard ? zoneAt(s, me.y) : null,
    mine = s.done[R.me],
    ok = !!z && scCanVote(s, R.me, z);
  const l = scLineOf(s, z),
    own =
      !ok &&
      (s.phase === "lvote"
        ? l && l.now && l.line.by === R.me
        : s.phase === "wvote" && z === "W:" + R.me);
  const label = wait
      ? `Vote in ${wait}`
      : mine
        ? "Voted ✓"
        : own
          ? s.phase === "lvote"
            ? "Your line"
            : "Your word"
          : "Vote",
    off = wait || !ok || mine;
  const review =
    s.phase === "results" && s.round >= 1 && !s.review
      ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? " disabled" : ""} data-tip="Adds every round's stats and the finished stories. One vote each round.">All-rounds review ${reviewCount(s)}/${need}</button>`
      : "";
  return `<div class="act-row"><button type="button" class="btn vote-btn sc-vote${mine ? " voted" : ""}" data-a="end"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button><span class="progress">${d}/${n} voted${need < n ? ` · ${need} needed` : ""}</span>${review}</div>`;
}
const TITLES = {
  hang: "Duck Cabin",
  submit: "Write a question",
  answer: "Vote",
  discuss: "Talk it over",
  results: "Results",
  over: "",
  topic: "Write a topic",
  tvote: "Pick the topic",
  tie: "A tie",
  seeds: "Write the contenders",
  bracket: "The bracket",
  podium: "The podium",
  words: "Write a secret word",
  write: "Write the story",
  lvote: "Favorite line",
  wvote: "Favorite secret word",
  wqpick: "The secret word",
  clue: "Clues",
  choice: "Vote or more clues?",
  accuse: "Vote Out the Quack",
  reveal: "The reveal",
};
const LAW_TITLES = {
  submit: "Write a topic",
  counsel: "Pick the attorneys",
  answer: "Court is in session",
  discuss: "The verdict",
};
const DN_TITLES = {
  submit: "Write a take",
  answer: "Dunce or Not?",
  discuss: "The verdict",
  dunced: "The dunce",
};
const VD_TITLES = {
  vdprompt: "The topic",
  vddate: "On a date",
  vdpick: "Who is Turned Down?",
  vddown: "Turned Down",
  vdval: "Valentine",
  results: "Sweet Valentine",
};
/* Valentine's Duck Date: the turn, and the date in it */
const vdRound = (s) => {
  const V = s.vd;
  if (!V || !V.turn) return "";
  return `Turn ${V.turn}${["vdprompt", "vddate"].includes(s.phase) && V.order.length ? ` · Date ${Math.min(V.k + 1, V.order.length)} of ${V.order.length}` : ""}`;
};
const MGJ_TITLES = {
  boss: "Mad God Justin",
  mgjend: "The end",
  results: "The fight",
};
/* what the middle of the screen shows */
function viewHTML(s) {
  if (isHang(s)) return `<div class="stage hang-stage">${HANG_HTML}</div>`;
  if (isLaw(s) && s.phase === "counsel")
    return '<div class="law-counsel-wrap"></div>';
  if ((isLaw(s) || isDn(s) || isMgj(s) || isVd(s)) && s.phase === "results")
    return '<div class="bb-results"><div class="statpanel law-statpanel"></div></div>';
  if (isQuack(s))
    switch (s.phase) {
      case "wqpick":
        return pickHTML(s, R.me);
      case "results":
        return '<div class="bb-results"><div class="statpanel bb-statpanel"></div></div>';
    }
  if (isSc(s)) {
    if (s.phase === "words") return wordsHTML(s, R.me, whoHTML(s));
    if (s.phase === "results")
      return `<div class="results sc-results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
    if (SC_BOARD.includes(s.phase))
      return `<div class="stage">${boardHTML(s)}</div>`;
  }
  if (isBb(s))
    switch (s.phase) {
      case "topic":
        return topicHTML(s, R.me, whoHTML(s));
      case "tvote":
        return tvoteHTML(s, R.me);
      case "seeds":
        return seedsHTML(s, R.me);
      case "podium":
        return podiumHTML(s);
      case "results":
        return '<div class="bb-results"><div class="statpanel bb-statpanel"></div></div>';
    }
  return s.phase === "submit"
    ? viewSubmit(s)
    : s.phase === "results"
      ? viewResults(s)
      : s.phase === "over"
        ? viewOver(s)
        : `<div class="stage">${boardHTML(s)}</div>`;
}
/* the moment specials that fire on their own: confetti over the screen for the Round Lord, a match's winner and the champion */
function celebrate(s) {
  if (isQuack(s)) {
    // the round's winners (after the drumroll)
    const r = s.phase === "reveal" && s.wq.result;
    if (!r || !r.win) return;
    const won = s.wq.ids.filter(
      (id) => (r.win === "quack") === r.quacks.includes(id) && s.players[id],
    );
    if (won.some((id) => hasKey(s.players[id].duck, "confetti")))
      setTimeout(confettiRain, s.wq.lastOut ? 6100 : 600);
    return;
  }
  let p = null;
  if (s.phase === "answer" && !isBb(s) && !isLaw(s))
    p = s.players[(s.qs[s.qi] || {}).by];
  if (s.phase === "discuss" && isLaw(s) && s.law && s.law.w >= 0)
    p = s.players[s.law.w ? s.law.def : s.law.off];
  const m = isBb(s) && bbMatch(s);
  if (s.phase === "discuss" && m && m.w != null && !s.options.bbBlind)
    p = s.players[s.bb.seeds[m.w].by];
  if (s.phase === "podium" && s.bb && s.bb.champ != null)
    p = s.players[s.bb.seeds[s.bb.champ].by];
  if (p && hasKey(p.duck, "confetti")) confettiRain();
}
/* Bicker Brackets: who wears the Loser's X (their seed just lost, or all of theirs are out), and the colors of the
   match's two sides (the writers' cards) */
function bbMarks(s) {
  losers = new Set();
  if (isQuack(s) && s.wq && s.wq.result && s.wq.result.win === "room") {
    for (const id of s.wq.result.quacks) {
      const p = s.players[id];
      if (p && hasKey(p.duck, "loserx")) losers.add(id);
    }
    return;
  } // a caught Quack
  if (isDn(s)) {
    S.style.setProperty("--law-a", DN_COLORS[0]);
    S.style.setProperty("--law-b", DN_COLORS[1]);
    return;
  } // Duncelation: the sides' red and green
  if (isLaw(s) && s.law) {
    // Lawyering: the losing attorney wears the Loser's X; the sides' colors are the attorneys' cards
    const L = s.law,
      lost =
        s.phase === "discuss" && L.w != null
          ? L.w === -1
            ? [L.off, L.def]
            : [L.w ? L.off : L.def]
          : [];
    for (const id of lost) {
      const p = s.players[id];
      if (p && hasKey(p.duck, "loserx")) losers.add(id);
    }
    S.style.setProperty("--law-a", sideColor(s.players[L.off]));
    S.style.setProperty("--law-b", sideColor(s.players[L.def]));
    return;
  }
  if (!isBb(s) || !s.bb) return;
  const m = bbMatch(s),
    justLost =
      s.phase === "discuss" && m && m.w != null
        ? s.bb.seeds[m.w === m.a ? m.b : m.a]
        : null;
  for (const id of s.seat) {
    const p = s.players[id];
    if (
      p &&
      hasKey(p.duck, "loserx") &&
      ((justLost && justLost.by === id) || allOut(s, id))
    )
      losers.add(id);
  }
  if (m) {
    const [ca, cb] = matchColors(s, seedShift);
    S.style.setProperty("--seed-a", ca);
    S.style.setProperty("--seed-b", cb);
  }
}
/* while a match is voted on, its two sides slowly turn through the colors (together, so they stay apart); when the vote
   ends they keep the colors they stopped on */
function shiftSides(s, now) {
  if (
    !isBb(s) ||
    s.phase !== "answer" ||
    !bbMatch(s) ||
    !document.documentElement.classList.contains("moving")
  )
    return;
  const deg = Math.round((Math.max(0, now - s.at) / 1000) * 4) % 360; // 4° a second: once around in a minute and a half
  if (deg === seedShift) return;
  seedShift = deg;
  bbMarks(s);
}
const matchKey = (s) => (s.bb ? [s.startedAt, s.bb.r, s.bb.m].join() : "");
/* Bicker Brackets: the championship's votes are in, so the champion bumps the loser off the cloud (once) */
function duel(s) {
  if (isLaw(s)) {
    // Lawyering: the winning attorney bumps the loser off; a hung jury: both jump
    const L = s.law,
      key = caseKey(s);
    if (s.phase !== "discuss" || !L || L.w == null || knocked.has(key)) return;
    knocked.add(key);
    const lord = S.querySelector(".law-top .lord.duel");
    setTimeout(() => {
      if (lord && lord.isConnected)
        L.w === -1 ? bothOff(lord) : knockOff(lord, L.w ? 0 : 1);
    }, 900);
    return;
  }
  const m =
      isBb(s) &&
      s.phase === "discuss" &&
      s.bb.r === s.bb.rounds.length - 1 &&
      bbMatch(s),
    key = matchKey(s);
  if (!m || m.w == null || knocked.has(key)) return;
  knocked.add(key);
  const lord = S.querySelector(".bb-top .lord.duel");
  setTimeout(() => {
    if (lord.isConnected) knockOff(lord, m.w === m.a ? 1 : 0);
  }, 900);
}
/* the colors of the most-voted tile (or tiles, when they tie), as the board shows them */
function topColors(s) {
  const n = {};
  for (const id of s.seat) {
    const c = s.lock[id];
    if (c >= 0) n[c] = (n[c] || 0) + 1;
  }
  const most = Math.max(0, ...Object.values(n));
  return Object.keys(n)
    .filter((c) => n[c] === most)
    .map((c) => {
      const t = S.querySelector(`.board .cols > .col[data-c="${c}"]`);
      return t ? getComputedStyle(t).getPropertyValue("--c").trim() : "";
    })
    .filter(Boolean);
}
function paint(force) {
  if (!S || !R) return;
  const s = R.state,
    key = [s.phase, s.round, s.qi].join("|");
  if (force || key !== shown) {
    const was = shown;
    shown = key;
    const fresh = s.pos[R.me] ? { ...s.pos[R.me], face: 1 } : null;
    if (
      s.phase === "answer" ||
      s.phase === "results" ||
      s.phase === "bracket" ||
      s.phase === "dunced" ||
      (isSc(s) && SC_BOARD.includes(s.phase)) ||
      !me ||
      (isQuack(s) && (!was || was.split("|")[0] !== s.phase)) ||
      (isVd(s) && ["vdprompt", "vdpick", "vdval"].includes(s.phase))
    )
      me = fresh && {
        ...fresh,
        j: (me && me.j) || 0,
        lj: !!(me && me.lj),
        sj: !!(me && me.sj),
        dj: (me && me.dj) || 0,
      }; // (Who is the Quack?: the host puts ducks on their tiles or the strip as a stage starts)
    scZone = null;
    target = null;
    const main = $(".gmain", S);
    main.dataset.phase = s.phase;
    S.classList.toggle("wyr", isWyr(s) || isDdr(s));
    S.classList.toggle("ddr", isDdr(s));
    S.classList.toggle("bb", isBb(s));
    S.classList.toggle("sc", isSc(s));
    S.classList.toggle("wq", isQuack(s));
    S.classList.toggle("law", isLaw(s) || isDn(s));
    S.classList.toggle("dn", isDn(s));
    S.classList.toggle("mgj", isMgj(s));
    S.classList.toggle("vd", isVd(s));
    S.classList.toggle("hang", isHang(s));
    if (s.phase === "answer") seedShift = 0; // a vote starts on the match's own colors
    bbMarks(s);
    if (world) {
      world.destroy();
      world = null;
    }
    main.innerHTML = viewHTML(s);
    const vin = $(".vd-in", main);
    if (vin && !touchOnly()) vin.focus(); // (The Date writes the topic at once; on a phone the keyboard waits for a tap)
    if (isHang(s) && s.phase === "hang")
      world = mountWorld($(".hang-board", main), {
        room: () => R,
        me: () => me,
        jumpZ,
        landsAt,
        cfg: () => jumpCfg(me),
        jet: jetKeys,
        clickUse: () => !!profile.settings.clickUse,
        button: () => {
          if (S && R) setHTML($(".gact", S), actHTML(R.state));
        },
      });
    if (!scene) scene = mountMap($(".map-layer", S), s);
    announce(s.phase);
    celebrate(s);
    duel(s);
    scene.board($(".board", main));
    if (was && s.phase !== was.split("|")[0] && s.phase !== "discuss")
      sfx.done();
    if (was && was.split("|")[0] === "answer" && s.phase === "discuss")
      scene.cheer(topColors(s)); // the votes are in
    if (
      (s.phase === "answer" || s.phase === "hang") &&
      !touchTold &&
      touchOnly()
    ) {
      // a touch screen: how to move, once
      touchTold = true;
      toast(
        profile.settings.touch === "tap"
          ? "Tap: walk there · Fast swipe: sprint · ⬆ jumps"
          : "Hold and drag: walk · Flick twice: sprint · ⬆ jumps",
        5000,
      );
    }
    $(".phase", S).textContent =
      (isLaw(s) && LAW_TITLES[s.phase]) ||
      (isDn(s) && DN_TITLES[s.phase]) ||
      (isMgj(s) && MGJ_TITLES[s.phase]) ||
      (isVd(s) && VD_TITLES[s.phase]) ||
      TITLES[s.phase] ||
      "";
    lastClose = (s.law && s.law.close) || 0;
    geo = null;
    if (bar) {
      if (onBoardPhase()) bar.show();
      else bar.hide();
    } // the specials' row comes in with each stage on the board, then slides away
  }
  if (world) world.state(s); // (a lamp switched off …)
  if (isMgj(s)) {
    if (mgjHold === "medkit" && kitUsed()) mgjHold = "knife";
    held = s.phase === "boss" ? mgjHold : null;
    const hp = $(".mgj-hp", S);
    if (hp) setHTML(hp, mgjHPHTML(s));
  } // Mad God Justin: the knife always out; his HP
  else if (held === "knife" && !hasKey(myDuck(), "knife")) held = null;
  const round =
    s.phase === "over" || isHang(s)
      ? ""
      : isMgj(s)
        ? `Fight ${s.round + 1}`
        : isVd(s)
          ? vdRound(s)
          : `Round ${s.round + 1}${isQuack(s) ? (s.wq && s.wq.lap && QUACK_PHASES.includes(s.phase) ? ` · Lap ${s.wq.lap}` : "") : isSc(s) ? (s.phase === "write" ? ` · Line ${s.sc.turn + 1} of ${s.sc.order.length}` : "") : isBb(s) ? (bbMatch(s) ? ` · ${roundName(s.bb, s.bb.r)}` : "") : s.qs.length && ["answer", "discuss", "counsel", "dunced"].includes(s.phase) ? ` · ${isLaw(s) ? "Case" : isDn(s) ? "Take" : "Question"} ${s.qi + 1} of ${s.qs.length}` : ""}`;
  if ($(".round", S).textContent !== round) $(".round", S).textContent = round; // (every paint: a Story Chain line can be added for someone who joined)
  if (bar) bar.refresh(); // (a key kept on, or kept off)
  if (s.phase === "submit" || s.phase === "topic" || s.phase === "words") {
    setHTML($(".who", S), whoHTML(s));
    if (s.done[R.me] && $("form.submit-card", S)) paint(true);
  }
  if (isSc(s)) $(".sc-board", S)?.classList.toggle("voted", !!s.done[R.me]); // (the arrow and the glowing hint are for those who haven't voted)
  if (isSc(s) && s.phase === "write") {
    // the line as it's typed (the writer sees their own straight from the box)
    if (scWriter(s) !== R.me) {
      const t = $(".sc-typing", S),
        was = t && t._html;
      setHTML(t, typingHTML(s));
      if (t && t._html !== was) geo = null;
    } else if (s.done[R.me] && $("form.sc-write", S)) paint(true);
  }
  if (s.phase === "topic")
    setHTML($(".bb-topic-live", S), topicLiveHTML(s, R.me)); // everyone's topics as they come
  if (s.phase === "tvote") setHTML($(".bb-topics", S), topicsHTML(s, R.me));
  if (s.phase === "seeds") {
    // everyone's words as they type them, and the seeds so far
    if (s.done[R.me] && $("form.bb-write", S)) paint(true);
    setHTML($(".bb-others", S), othersHTML(s, R.me));
    setHTML($(".bb-sofar .bb-grid", S), sofarHTML(s));
    $(".bb-sofar h3", S).textContent = s.bb.seeds.length
      ? `Already written (${s.bb.seeds.length})`
      : "";
    $(".bb-now", S).hidden = !$(".bb-others", S).children.length;
  }
  if (isBb(s) && s.phase === "discuss") bbMarks(s);
  if (isLaw(s) && s.phase === "counsel")
    setHTML($(".law-counsel-wrap", S), counselHTML(s, R.me, whoHTML(s)));
  if (isLaw(s) && s.phase === "answer" && s.law) {
    // closing arguments: the banner, and the cloud asks the jury to reconsider
    const close = s.law.close || 0,
      bn = $(".law-banner", S);
    if (bn) bn.classList.toggle("on", !!close);
    if (close && close !== lastClose) {
      lastClose = close;
      announce("closing");
    }
  }
  if (isQuack(s) && onBoardPhase()) {
    // the tiles follow the ducks' looks; my Secret Card arrives (online: once it's opened)
    const tiles = $(".wq-tiles", S);
    if (tiles && tiles.children.length !== s.wq.ids.length) {
      tiles.closest(".cols").outerHTML = quackBoardHTML(s, R.me);
      geo = null;
    } // someone joined: a tile for them
    refreshTiles(S, s, R.me);
    const c = myCard(s),
      box = $(".wq-card.mine", S),
      sig = JSON.stringify(c || null);
    if (box && box._sig !== undefined && box._sig !== sig) {
      const peeking = box.classList.contains("peek");
      box.outerHTML = secretCardHTML(c);
      if (peeking) $(".wq-card.mine", S).classList.add("peek");
    }
    const nb = $(".wq-card.mine", S);
    if (nb) nb._sig = sig;
  }
  // the host keeps my duck in bounds (an ended turn, the column after answering); take its word for where I am
  if (me && s.pos[R.me] && onBoardPhase()) {
    const p = s.pos[R.me];
    if (p.kb && p.kb.t !== shovedAt) {
      shovedAt = p.kb.t;
      me.x = p.x;
      me.y = p.y;
      target = null;
    } // the hammer shoved me back
    if (p.tp && p.tp !== putAt) {
      putAt = p.tp;
      me.x = p.x;
      me.y = p.y;
      me.z = undefined;
      me.b = undefined;
      me.vz = null;
      me.j = 0;
      target = null;
    } // put there (Duck Cabin: my ghost's body got up)
    if (locked()) {
      me.x = p.x;
      me.y = p.y;
    } // an ended turn holds its answer
    else if (votedCol() != null && me.x >= 0) {
      const [lo, hi] = colBoundsAt(s, votedCol());
      me.x = Math.max(lo, Math.min(hi, me.x));
    } // voted: inside my column
    else if (!roams() && me.x >= 0 && s.lock[R.me] !== undefined) {
      const [lo, hi] = colBoundsAt(s, s.lock[R.me]);
      me.x = Math.max(lo, Math.min(hi, me.x));
    } // inside my column (not back to where the host last saw me: online that pulled the duck back while it walked)
  }
  const lordSig =
    !isBb(s) &&
    !isLaw(s) &&
    !isDn(s) &&
    (s.phase === "answer" || s.phase === "discuss")
      ? JSON.stringify(s.players[s.qs[s.qi].by] || null)
      : "";
  const lord = $(".topover .lord", S);
  if (lord && lord._sig !== undefined && lord._sig !== lordSig) {
    const words = lord.querySelector(".lord-say");
    lord.outerHTML = lordHTML(s);
    $(".topover .lord .lord-say", S).replaceWith(words);
  }
  if ($(".topover .lord", S)) $(".topover .lord", S)._sig = lordSig;
  setHTML($(".gact", S), actHTML(s));
  pm.paint();
  /* new chat messages float over their sender's duck (whispers only for the two of you; muted bubbles stay hidden) */
  if (lastLog < 0) lastLog = s.logN || 0;
  if ((s.logN || 0) > lastLog) {
    for (const m of s.log)
      if (
        m.n > lastLog &&
        !m.sys &&
        s.players[m.from] &&
        (!m.to || m.to === R.me || m.from === R.me) &&
        !isMuted(s, m.from, "bubble") &&
        !isMuted(s, m.from, "text")
      )
        bubbles[m.from] = {
          text: !canOpen(s, R.me, m)
            ? `📄 ${m.file}`
            : m.text.length > 90
              ? m.text.slice(0, 90).trimEnd() + "…"
              : m.text,
          until: clockNow() + 5500,
          n: m.n,
        }; // (a sent file opens only for sudo, unless chmod let its group or everyone)
    for (const m of s.log)
      if (
        m.n > lastLog &&
        (m.npc === JUSTIN_ID || m.npc === GOOD_ID) &&
        s.options.mode !== "hang" &&
        !isMuted(s, JUSTIN_ID, "bubble") &&
        !isMuted(s, JUSTIN_ID, "text")
      )
        bubbles[m.npc] = {
          text:
            m.text.length > 90 ? m.text.slice(0, 90).trimEnd() + "…" : m.text,
          until: clockNow() + 5500,
          n: m.n,
        }; // (the Justin option: his lines over him)
    lastLog = s.logN || 0;
  }
  if (lastFx < 0) lastFx = s.fxN || 0;
  if ((s.fxN || 0) > lastFx) {
    const fresh = (s.fx || []).filter((f) => f.n > lastFx);
    lastFx = s.fxN;
    if (onBoardPhase()) {
      if (!geo) measure();
      fresh.forEach(playFx);
    }
  }
  if (s.phase === "results") {
    recordRound(s);
    const panel = $(".statpanel", S),
      had = panel._html && panel._html.includes("all-h");
    setHTML(panel, statsHTML(s));
    if (s.review && !had)
      panel
        .querySelector(".all-h")
        .scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (s.phase === "over") setHTML($(".over .statboxes", S), statsHTML(s));
  if (isBb(s) && s.phase === "results") {
    recordRound(s);
    setHTML($(".bb-statpanel", S), bbStatsHTML(s));
  }
  showTimer();
}

function showTimer() {
  const s = R && R.state,
    t = S && $(".timer", S);
  if (!s || !t) return;
  if (graceOf(s)) {
    const g = graceLeft(s);
    if (g !== lastGrace) {
      lastGrace = g;
      setHTML($(".gact", S), actHTML(s));
    }
  } // the Vote (Done, Skip) button counts down
  const now = clockNow(),
    ends = [s.ends, s.catchEnds].filter(Boolean),
    end = ends.length ? Math.min(...ends) : 0;
  const meter = $(".tmeter", S);
  if (s.phase === "podium") {
    const pl = $(".pod-left", S);
    if (pl)
      pl.textContent = `The stats in ${Math.max(0, Math.ceil((s.ends - now) / 1000))} s`;
  }
  if (isMgj(s) && s.phase === "boss" && s.mgj) {
    // Mad God Justin: the fight's clock, frozen under ice while the meteor falls
    const ms = mgjLeft(s, now),
      left = Math.ceil(ms / 1000),
      ice = mgjFrozen(s),
      all = (mgjTime(s) + (s.mgj.metDone ? 30 : 0)) * 1000;
    if (meter) {
      meter.hidden = false;
      const w = (Math.max(0, Math.min(1, 1 - ms / all)) * 100).toFixed(1) + "%";
      if (meter._w !== w) {
        meter._w = w;
        meter.firstChild.style.width = w;
      }
      meter.classList.toggle("low", !ice && left <= 5);
      meter.classList.toggle("frozen", ice);
    }
    t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    t.className = "timer" + (ice ? " frozen" : left <= 5 ? " low" : "");
    if (!ice && left <= 5 && left > 0 && left !== lastBeep) {
      lastBeep = left;
      sfx.tick();
    }
    return;
  }
  if (meter) meter.classList.remove("frozen");
  if (
    !end ||
    ![
      "submit",
      "answer",
      "topic",
      "tvote",
      "seeds",
      "words",
      "write",
      "wqpick",
      "choice",
      "accuse",
      "counsel",
      "vdprompt",
      "vddate",
    ].includes(s.phase)
  ) {
    t.textContent = "";
    t.className = "timer";
    if (meter) meter.hidden = true;
    return;
  }
  const graceEnd =
      isDn(s) && s.phase === "answer" && s.lordTime
        ? s.at + DN_GRACE * 1000
        : 0,
    inGrace = graceEnd > now; // (Duncelation: the grace period's own countdown, then the Take timer)
  const left = Math.max(
      0,
      Math.ceil(((inGrace ? graceEnd : end) - now) / 1000),
    ),
    catching = !inGrace && s.catchEnds && end === s.catchEnds,
    closing = isLaw(s) && s.law && s.law.close && end === s.law.close;
  /* the meter fills as the time runs out; its color drifts slowly (css) */
  const from = inGrace
      ? s.at
      : closing
        ? s.law.close - (+s.options.lawClose || 60) * 1000
        : isVd(s) && s.phase === "vddate" && s.vd.tm
          ? end - (+s.options.vdTime || 60) * 1000 // (the date's timer: pausing and going on keeps the same bar)
          : catching
            ? s.catchEnds - catchLen(s) * 1000
            : graceEnd || s.at,
    frac = Math.max(
      0,
      Math.min(
        1,
        (now - from) / Math.max(1, (inGrace ? graceEnd : end) - from),
      ),
    );
  if (meter) {
    meter.hidden = false;
    const w = (frac * 100).toFixed(1) + "%";
    if (meter._w !== w) {
      meter._w = w;
      meter.firstChild.style.width = w;
    }
    meter.classList.toggle("low", left <= 5);
  }
  if (
    [
      "submit",
      "topic",
      "seeds",
      "words",
      "write",
      "wqpick",
      "vdprompt",
    ].includes(s.phase) &&
    left <= 2 &&
    draftT
  )
    sendDraft(true); // the last words make it in
  t.textContent = `${inGrace ? "Grace " : closing ? "Closing " : catching ? "Catch-up " : ""}${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  t.className =
    "timer" + (catching ? " catch" : "") + (left <= 5 ? " low" : "");
  if (left <= 5 && left > 0 && left !== lastBeep) {
    lastBeep = left;
    sfx.tick();
  }
}

/* what I've typed goes to the host after a short pause, so it's sent in for me if time runs out */
function sendDraft(now = false) {
  clearTimeout(draftT);
  draftT = 0;
  const go = () => {
    draftT = 0;
    if (R && isVd(R.state)) {
      const inp = S && $("form.vd-write .vd-in", S);
      if (inp && R.state.phase === "vdprompt")
        R.send({ t: "draft", text: inp.value });
      return;
    } // (The Date's topic, sent in for them if time runs out)
    if (R && isQuack(R.state)) {
      const f = S && $("form.wq-pick", S);
      if (f && R.state.phase === "wqpick")
        R.send({
          t: "wqWord",
          word: f.word.value,
          cat: f.cat.value,
          draft: true,
        });
      return;
    } // (locked for the host, online)
    if (R && isSc(R.state)) {
      const inp = S && $(R.state.phase === "write" ? ".sc-in" : ".sc-win", S);
      if (inp && ["words", "write"].includes(R.state.phase))
        R.send({ t: "draft", text: inp.value });
      return;
    } // (everyone sees a line as it's typed)
    if (R && isBb(R.state)) {
      const inp = S && $("form.bb-write .bb-in", S);
      if (inp && ["topic", "seeds"].includes(R.state.phase))
        R.send({ t: "draft", text: inp.value });
      return;
    } // (everyone sees a seed as it's typed)
    const f = S && $("form.submit-card", S);
    if (!f || !R || R.state.phase !== "submit") return;
    const t = f.querySelector('.tile[aria-pressed="true"]'),
      time = t ? +t.dataset.time : R.state.options.answerTime,
      side = (k) =>
        (f.querySelector(`.wyr-in[data-side="${k}"]`) || {}).value || "";
    R.send(
      isWyr(R.state)
        ? { t: "draft", a: side("a"), b: side("b"), time }
        : { t: "draft", text: f.querySelector("textarea").value, time },
    );
  };
  if (now) go();
  else
    draftT = setTimeout(
      go,
      R && ["seeds", "topic", "write"].includes(R.state.phase)
        ? R.state.phase === "write"
          ? 180
          : 220
        : R && R.state.phase === "wqpick"
          ? 1200
          : 700,
    ); // (the others see these as they're typed)
}

/* the writer types: the letters left, Send once the secret word is in, and their line in the story at once */
function storyTyped(box) {
  if (/\n/.test(box.value)) box.value = box.value.replace(/\s*\n\s*/g, " ");
  const f = box.form,
    text = box.value,
    word = (R.state.sc.assign[R.me] || {}).word,
    has = wordAt(text, word) >= 0;
  f.querySelector(".sc-left").textContent = `${LINE_MAX - text.length} left`;
  const need = f.querySelector(".sc-need");
  need.textContent = has ? "✓ Secret word in" : "Put your secret word in it";
  need.classList.toggle("ok", has);
  f.querySelector('button[type="submit"]').disabled = !(has && text.trim());
  const t = $(".sc-typing", S);
  if (t) {
    setHTML(t, typingHTML({ ...R.state, drafts: { [R.me]: { text } } }));
    geo = null;
  }
}

/* ---------- the pause menu (top right, or Esc) ---------- */
function openPause() {
  if (windowOpen()) return;
  openWindow(
    `<h2>Paused</h2><div class="pause-list">
    <button type="button" class="btn green" data-a="resume">Resume</button>
    <button type="button" class="btn ghost" data-a="custom">Customize</button>
    <button type="button" class="btn ghost" data-a="settings">Settings</button>
    <button type="button" class="btn ghost" data-a="friends">Friends</button>
    ${R && isHang(R.state) && isSudo(R.state, R.me) ? '<button type="button" class="btn yellow" data-a="lobby">Everyone back to the lobby</button>' : ""}
    <button type="button" class="btn red" data-a="leave">Leave game</button></div>
    <p class="small dim" style="margin-top:.8rem">The game keeps going while this is open.</p>`,
    {
      cls: "win-small",
      onOpen: (w, close) =>
        (w.querySelector(".pause-list").onclick = (e) => {
          const a = e.target.closest("[data-a]");
          if (!a) return;
          close();
          ({
            resume() {},
            custom: () => openCustomize(),
            settings: () => openSettings(),
            friends: () => openFriends(),
            lobby: () => R.send({ t: "toLobby" }),
            leave: () => leaveTo("rooms", "Leave the game in progress?"),
          })[a.dataset.a]();
        }),
    },
  );
}

/* ---------- keys ---------- */
const MOVE_KEYS = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
];
function keydown(e) {
  if (!S) return;
  if (e.key === "Escape" && !windowOpen() && !typing(e)) {
    e.preventDefault();
    if (pm.isOpen()) pm.close();
    else openPause();
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    if (!windowOpen() && !typing(e)) pm.keydown(e);
    return;
  } // hold Tab: the players (Tab never moves the browser's focus in a game)
  if (typing(e) || windowOpen()) return;
  if (world && onBoardPhase() && world.keydown(e)) return; // Hangout: an activity's keys first (the piano)
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (MOVE_KEYS.includes(e.code) && onBoardPhase()) {
    if (!e.code.startsWith("Shift")) e.preventDefault();
    keys.add(e.code);
    if (ARROWS[e.code] && arrowsAim()) keyAimNow();
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    keys.add("Space"); // (held: the jetpack keeps going up)
    if (!e.repeat) jump();
    return;
  }
  if (keyIndex(e) >= 0 && onBoardPhase()) {
    e.preventDefault();
    if (!e.repeat) useKey(keyIndex(e), e.shiftKey);
    return;
  } // the specials' keys (Shift: keep it on)
  if (e.code === "KeyE" && isHang(R.state) && onBoardPhase()) {
    e.preventDefault();
    if (!e.repeat && world) world.press();
    return;
  } // Duck Cabin: E uses what's near (sit, play, read …)
  if (e.code === "KeyG" && isL4dd(R.state) && onBoardPhase()) {
    e.preventDefault();
    if (!e.repeat) fire("grenade");
    return;
  } // (Quacky Zombies: G throws a grenade toward the mouse)
  if (e.code === "KeyR" && !e.repeat && reload()) {
    e.preventDefault();
    if (bar) setTimeout(() => bar && bar.refresh(), 60);
    return;
  } // the handgun reloads
  if (e.code === "KeyV" && !e.repeat && onBoardPhase()) {
    e.preventDefault();
    if (isMgj(R.state)) fire(held || "knife");
    else if (heldNow()) fire(heldNow());
    else if (lastKey >= 0) useKey(lastKey, false);
    else if (bar) bar.show();
    return;
  } // V: the special kept out (toggled), or else the one I used last (Mad God Justin: what's in hand)
  if (
    (e.code === "KeyE" || e.code === "Enter") &&
    !e.repeat &&
    isMgj(R.state) &&
    R.state.phase === "boss" &&
    held === "medkit"
  ) {
    e.preventDefault();
    fire("medkit");
    return;
  } // Mad God Justin: the medkit in hand, E or Enter gets the downed duck next to mine up
  if (e.code === "KeyQ" && isQuack(R.state)) {
    e.preventDefault();
    peek(true);
    return;
  } // hold Q: peek at my Secret Card
  if (
    (e.code === "Equal" || e.code === "Minus") &&
    R.state.phase === "bracket"
  ) {
    e.preventDefault();
    zoom(e.code === "Equal" ? "in" : "out");
    return;
  }
  if ((e.code === "Enter" || e.code === "NumpadEnter") && !e.repeat) {
    e.preventDefault();
    act("end");
  }
}
const keyup = (e) => {
  if (world) world.keyup(e);
  keys.delete(e.code);
  if (e.key === "Tab" && pm) pm.keyup(e);
  if (e.code === "KeyQ") peek(false);
};
const blur = () => {
  keys.clear();
  padHold = false;
  peek(false);
};
/* my Secret Card turns face up while it's held (or Q is) */
function peek(on) {
  const c = S && $(".wq-card.mine", S);
  if (c) c.classList.toggle("peek", on && !c.classList.contains("dealing"));
}
const resized = () => {
  geo = null;
};
const unpeek = () => peek(false);

/* ---------- what the buttons do ---------- */
async function act(a) {
  const s = R.state;
  switch (a) {
    case "hang":
      if (world) world.press();
      break; // Hangout: the context button
    case "end":
      if (isHang(s)) {
        if (world) world.press();
        break;
      } // (Enter)
      if (isSc(s)) {
        if (SC_VOTES.includes(s.phase) && me && me.x >= 0 && !graceLeft(s)) {
          sendMove(true);
          R.send({ t: "end", y: me.y });
        }
        break;
      } // (where I stand is my vote)
      if (
        (s.phase === "answer" ||
          (isQuack(s) && ["choice", "accuse"].includes(s.phase))) &&
        (!(me && me.x >= 0) || graceLeft(s))
      )
        return;
      if (
        s.phase === "answer" ||
        (isQuack(s) && ["choice", "accuse"].includes(s.phase))
      )
        sendMove(true);
      if ([...boardPhases(s), "results"].includes(s.phase))
        R.send({ t: "end" });
      break;
    case "tieagain":
      R.send({ t: "tieVote", v: "again" });
      break;
    case "vdtimer":
      R.send({ t: "vdTimer" });
      break;
    case "dnend":
      R.send({ t: "dnEnd" });
      break;
    case "goon":
      R.send({ t: "goOn" });
      break;
    case "giveup":
      if (await confirmBox("Give up the case?", "The other side wins it."))
        R.send({ t: "giveUp" });
      break;
    case "tiecoin":
      R.send({ t: "tieVote", v: "coin" });
      break;
    case "zoomin":
      zoom("in");
      break;
    case "zoomout":
      zoom("out");
      break;
    case "zoomfit":
      zoom("fit");
      break;
    case "bbnone":
      if (await confirmBox("Are you sure?", "No topic from you this time."))
        R.send({ t: "submit", text: "" });
      break;
    case "bbskip":
      if (
        await confirmBox(
          "Skip this one?",
          "You won't have a contender in this spot.",
        )
      )
        R.send({ t: "submit", text: "" });
      break;
    case "review":
      R.send({ t: "voteReview" });
      break;
    case "lobbyvote":
      lobbyVote(R);
      break;
    case "wqidea": {
      const f = $("form.wq-pick", S);
      if (!f) break;
      const { word, cat } = anyWord();
      f.word.value = word;
      f.cat.value = cat;
      sendDraft();
      break;
    }
    case "players":
      if (pm.isOpen()) pm.close();
      else pm.open(true);
      break;
    case "lobby":
      R.send({ t: "toLobby" });
      break;
    case "leave":
      leaveTo("rooms", "Leave the room?");
      break;
    case "notes": {
      const t = await pickNote();
      const box = $(".submit-card textarea", S);
      if (t && box) {
        box.value = t;
        box.focus();
      }
      break;
    }
    case "none":
      if (
        await confirmBox(
          "Are you sure?",
          isDn(R.state)
            ? "No take from you this round: you still get one to defend."
            : "No question from you this round.",
        )
      )
        R.send({ t: "submit", text: "" });
      break;
  }
}

const HINTS =
  "<kbd>WASD</kbd> Move <kbd>Shift</kbd> Sprint <kbd>Space</kbd> Jump <kbd>Enter</kbd> End turn";
const L4_HINTS =
  "<kbd>WASD</kbd> Move <kbd>Shift</kbd> Sprint <kbd>Click</kbd> Attack <kbd>R</kbd> Reload <kbd>E</kbd> Use";
/* Quacky Zombies: the left mouse button down on the board uses the weapon in hand, and again as soon as it can while
   the button stays down */
let l4Fire = 0;
function l4Press(e) {
  if (!R || !isL4dd(R.state) || e.pointerType !== "mouse" || e.button !== 0)
    return;
  if (
    !onBoardPhase() ||
    !e.target.closest(".board") ||
    e.target.closest("button, a, input, textarea, .l4-over")
  )
    return;
  const go = () => {
    const w = heldNow();
    if (w) fire(w);
    l4Fire = setTimeout(go, Math.max(60, l4Cool(R.state, R.me, w)));
  };
  clearTimeout(l4Fire);
  go();
  const stop = () => {
    clearTimeout(l4Fire);
    removeEventListener("pointerup", stop);
    removeEventListener("blur", stop);
  };
  addEventListener("pointerup", stop);
  addEventListener("blur", stop);
}
register("game", {
  guard: () => !!activeRoom(),
  exit() {
    const r = activeRoom();
    if (r) {
      r.send({ t: "leave" });
      r.close();
    }
  },
  leave() {
    if (off) off();
    off = null;
    if (docks) docks.destroy();
    docks = null;
    if (world) world.destroy();
    world = null;
    cancelAnimationFrame(raf);
    clearInterval(tick);
    S = null;
    shown = "";
    me = null;
    geo = null;
    keys.clear();
    lastFx = -1;
    hotdogs = [];
    follows = [];
    if (pm) pm.destroy();
    pm = null;
    if (idleOff) idleOff();
    idleOff = null;
    lastLog = -1;
    bubbles = {};
    if (bar) bar.destroy();
    bar = null;
    if (pad) pad.destroy();
    pad = null;
    if (mbarOff) mbarOff();
    mbarOff = null;
    lastKey = -1;
    kept.clear();
    held = null;
    l4Slot = l4Last = 0;
    shows = {};
    mouse = null;
    removeEventListener("mousemove", aimAt);
    if (scene) scene.destroy();
    scene = null;
    hooks.resetDuck = null;
    sayJob++;
    lastGrace = -1;
    if (touchOff) touchOff();
    touchOff = null;
    bbZoom = 0;
    losers = new Set();
    knocked = new Set();
    scY = 0;
    scT = 0;
    scZone = "";
    removeEventListener("keydown", keydown);
    removeEventListener("keyup", keyup);
    removeEventListener("blur", blur);
    removeEventListener("resize", resized);
    for (const t of ["pointerup", "pointercancel"])
      removeEventListener(t, unpeek);
  },
  render(arg) {
    R = arg || activeRoom();
    if (!R) return null;
    S = el(`<section class="screen game docked">
      <header class="gbar"><div class="gbar-l"><span class="round"></span><span class="phase"></span></div>${musicBarHTML()}
        <div class="gbar-r"><span class="tmeter" hidden><i></i></span><span class="timer"></span><button type="button" class="btn ghost iconbtn" data-a="players" aria-label="Players" data-tip="Players (hold Tab)">👥</button><button type="button" class="btn ghost iconbtn" data-a="pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header>
      <div class="map-layer"></div><div class="gmain"></div>${DOCK_HTML}${BAR_HTML('<div class="gact"></div>')}</section>`);
    docks = mountDocks(
      S,
      isL4dd(R.state)
        ? L4_HINTS
        : isHang(R.state)
          ? HINTS.replace("<kbd>Enter</kbd> End turn", "<kbd>E</kbd> Use")
          : isMgj(R.state)
            ? HINTS.replace(
                "<kbd>Enter</kbd> End turn",
                "<kbd>Click</kbd> Stab",
              )
            : HINTS,
    );
    mbarOff = mountMusicBar(S);
    pm = mountPlayers(S, () => R);
    idleOff = trackIdle(() => R);
    hooks.resetDuck = resetDuck;
    if (isL4dd(R.state)) {
      l4Held(heldNow); // (the fireplace asks which ranged weapon is in hand)
      const l4 = {
          state: () => R.state,
          me: () => R.me,
          held: heldNow,
          slot: () => l4Slot,
          pick: l4Pick,
          fire,
          grenade: () => fire("grenade"),
          flash: () => R.send({ t: "hang", k: "l4", do: "fl" }),
        },
        row = mountL4Bar(S, l4),
        slide = mountHotbar(S, l4Slider(l4));
      bar = {
        row: row.row,
        slider: slide.slider,
        show: slide.show,
        hide: slide.hide,
        wheel: () => false,
        current: slide.current,
        refresh() {
          row.refresh();
          slide.refresh();
        },
        destroy() {
          row.destroy();
          slide.destroy();
        },
      }; // (Quacky Zombies: its own weapons bar on a computer; on a phone its slots in the slider, as in every mode)
    } else {
      bar = mountHotbar(S, {
        keys: () => keysOf(playDuck()),
        kept: keptNow,
        use: useKey,
        cool,
        duck: playDuck,
        ammo,
        dots,
        select: slidPick,
        tap: slidTap,
        current: () =>
          R && isMgj(R.state) && R.state.phase === "boss" ? held : null,
      });
    }
    pad = mountPad({
      hold: (on) => {
        padHold = on;
      },
      active: () =>
        onBoardPhase() &&
        !windowOpen() &&
        !!me &&
        !(R.state.players[R.me] || {}).dead &&
        !(isL4dd(R.state) && !(l4Hp(R.state, R.me) > 0)),
      weapon: padWeapon,
      aim: (dx, dy) => {
        keyAim = dx == null ? null : [dx, dy];
      }, // (let go: the weapon goes back to the way the duck faces; in Quacky Zombies the flashlight to the nearest zombie)
      attack: padAttack,
      jump: () => jump(),
    });
    docks.corner(pad.el, bar.slider, bar.row); // (on phones the slider in the bottom middle, and the jump and attack buttons over the board's bottom right; the row of keys on a computer)
    addEventListener("mousemove", aimAt);
    touchOff = mountTouch(S, {
      active: () =>
        onBoardPhase() && !windowOpen() && !(world && world.grabbing()),
      walkTo,
      duckAt,
      getTarget: () => target,
      setTarget: (t) => {
        target = t;
      },
      hold: (x, y) => !!bar && bar.wheel(x, y),
    });
    S.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType !== "mouse") touchedAt = performance.now();
      },
      true,
    );
    S.addEventListener("pointerdown", l4Press);
    S.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".wq-card.mine")) {
        e.preventDefault();
        peek(true);
      }
    });
    for (const t of ["pointerup", "pointercancel"]) addEventListener(t, unpeek);
    S.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]");
      if (b && !b.disabled) {
        if (b.dataset.a === "pause") openPause();
        else act(b.dataset.a);
        return;
      }
      if (isL4dd(R.state) && e.target.closest(".board")) {
        if (e.target.closest(".l4-over")) return;
        if (performance.now() - touchedAt < 900) boardClick(e);
        return;
      } // (Quacky Zombies: the mouse button fires as it goes down, l4Down below; a tap walks)
      if (
        held &&
        (isMgj(R.state) || hasKey(playDuck(), held)) &&
        e.button === 0 &&
        onBoardPhase() &&
        e.target.closest(".board") &&
        !e.target.closest(
          "button, a, input, textarea, .topover, .sc-write, .wq-card",
        )
      ) {
        fire(held);
        return;
      } // a weapon kept out: a left click uses it
      const mc = e.target.closest("[data-col]");
      if (mc) {
        jumpTo(+mc.dataset.col);
        return;
      }
      const tc = e.target.closest("[data-topic]");
      if (tc) {
        R.send({ t: "pick", i: +tc.dataset.topic });
        return;
      }
      const lc = e.target.closest(".law-cand");
      if (lc) {
        R.send({ t: "counsel", role: lc.dataset.role, who: lc.dataset.who });
        return;
      }
      const tile = e.target.closest(".submit-card .tile[data-time]");
      if (tile) {
        $$(".submit-card .tile[data-time]", S).forEach((t) =>
          t.setAttribute("aria-pressed", t === tile),
        );
        sendDraft();
      }
      boardClick(e);
    });
    S.addEventListener("submit", (e) => {
      if (e.target.matches(".vd-write")) {
        // The Date's topic (empty: a random one)
        e.preventDefault();
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "submit", text: e.target.querySelector(".vd-in").value });
        return;
      }
      if (e.target.matches(".sc-wordform")) {
        // a secret word
        e.preventDefault();
        const inp = e.target.querySelector(".sc-win"),
          w = cleanWord(inp.value);
        if (!w) {
          inp.focus();
          return;
        }
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "submit", text: w });
        return;
      }
      if (e.target.matches(".sc-write")) {
        // a line, with the secret word in it
        e.preventDefault();
        const box = e.target.querySelector(".sc-in"),
          text = box.value.trim(),
          word = (R.state.sc.assign[R.me] || {}).word;
        if (!text || wordAt(text, word) < 0) {
          box.focus();
          const need = e.target.querySelector(".sc-need");
          need.classList.remove("shake");
          void need.offsetWidth;
          need.classList.add("shake");
          return;
        }
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "submit", text });
        return;
      }
      if (e.target.matches(".bb-write")) {
        // a topic or a seed
        e.preventDefault();
        const inp = e.target.querySelector(".bb-in"),
          text = inp.value.trim();
        if (!text) {
          inp.focus();
          return;
        }
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "submit", text });
        return;
      }
      if (e.target.matches(".wq-pick")) {
        // the secret word and its category
        e.preventDefault();
        const f = e.target,
          word = f.word.value.trim(),
          cat = f.cat.value.trim();
        if (!word) {
          f.word.focus();
          return;
        }
        if (!cat) {
          f.cat.focus();
          return;
        }
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "wqWord", word, cat });
        return;
      }
      if (!e.target.matches(".submit-card")) return;
      e.preventDefault();
      const f = e.target,
        t = f.querySelector('.tile[aria-pressed="true"]'),
        time = t ? +t.dataset.time : R.state.options.answerTime;
      if (isWyr(R.state)) {
        // both choices, or nothing
        const [a, b] = ["a", "b"].map((k) =>
          f.querySelector(`.wyr-in[data-side="${k}"]`),
        );
        const empty = [a, b].find((x) => !x.value.trim());
        if (empty) {
          empty.focus();
          return;
        }
        R.send({ t: "submit", a: a.value.trim(), b: b.value.trim(), time });
        return;
      }
      const text = f.querySelector("textarea").value.trim();
      if (!text) {
        f.querySelector("textarea").focus();
        return;
      }
      R.send({ t: "submit", text, time });
    });
    S.addEventListener("input", (e) => {
      if (e.target.matches(".sc-in")) {
        storyTyped(e.target);
        sendDraft();
        return;
      }
      if (e.target.matches(".sc-win")) {
        const v = e.target.value.replace(/\s+/g, "");
        if (v !== e.target.value) e.target.value = v;
        sendDraft();
        return;
      } // (one word)
      if (e.target.matches(".submit-card textarea, .bb-in, .wq-in, .vd-in"))
        sendDraft(); // (both Would You Rather boxes too)
    });
    S.addEventListener("keydown", (e) => {
      // a topic to vote for, picked with Enter or Space
      if (
        e.target.matches("[data-topic]") &&
        (e.key === "Enter" || e.key === " ")
      ) {
        e.preventDefault();
        e.stopPropagation();
        R.send({ t: "pick", i: +e.target.dataset.topic });
      }
    });
    S.addEventListener("keydown", (e) => {
      // Enter sends the question (Shift+Enter for a new line) or the story's line (one line, so no new lines)
      if (
        e.target.matches(".submit-card textarea") &&
        e.key === "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.target.form.requestSubmit();
      }
      if (e.target.matches(".sc-in") && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        e.target.form.requestSubmit();
      }
    });
    onMenu(S, (x, y, e) => {
      const d = e.target.closest && e.target.closest(".gduck, .statbox");
      if (!d || stick.shown) return;
      const p = R.state.players[d.dataset.pid];
      contextMenu(x, y, [
        ["View stats", () => openStats(R.state, d.dataset.pid, R.me)],
        ...(canAdd(p)
          ? [["Add friend", async () => toast(await requestFriend(p.acct))]]
          : []),
        ...(p ? kickItems(R, d.dataset.pid) : []),
      ]);
    });
    off = R.on((s) => {
      if (!S) return;
      if (s.phase === "lobby" || s.phase === "countdown") {
        go("lobby", R);
        return;
      }
      paint();
    });
    addEventListener("keydown", keydown);
    addEventListener("keyup", keyup);
    addEventListener("blur", blur);
    addEventListener("resize", resized);
    raf = requestAnimationFrame(loop);
    tick = setInterval(showTimer, 250);
    requestAnimationFrame(() => paint(true));
    return S;
  },
});
