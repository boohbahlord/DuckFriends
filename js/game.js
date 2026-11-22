/* ---------- the game screen ----------
   Write a question → for each question: everyone walks their duck onto a column and ends their turn, then talks it over
   (each duck now stays inside the column it chose) → the round's results (stat boxes; ducks stay in their column) → the
   next round, until the players vote to end the game.

   The board fills the screen. The Round Lord sits on a cloud over the top of the board with the question beside it; both
   turn see-through when a duck walks under them.

   Your duck: WASD or the arrow keys walk (Shift sprints, with speed lines); Space jumps, slow and high, with a shadow left
   on the ground (a jump counts when the duck lands); Enter ends your turn. With
   "Mouse moves your duck" a click walks it there; with "Show multiple choice" seven buttons put it on a column. Ducks
   squash a little when they push against a wall or another duck. On a touch screen a see-through joystick appears under
   a held finger, or (Settings → Controls) a tap walks the duck there; see touch.js. On a phone held upright the board
   turns: agree at the top. Your duck moves on your screen at once and is sent to the room a few times a second; the
   others glide.

   Hangout walks around Duck Cabin instead of a board: the world (hangout/world.js) draws it, follows my duck with its
   camera and works out how it stands and falls; this file only hands it the keys, the stick and the taps, and puts its
   one context button where the Vote button goes. */
import {
  mgjRevive,
  panTree,
  placeCake,
  placeDesk,
  placeEdge,
  placePick,
  placeRevive,
  placeSnack,
  placeTable,
  placeTells,
  placeTiles,
  placeZombies,
  seatAt,
  storyMarks,
  zoom,
} from "./gameplace.js";

import {
  ARROWS,
  DYING_MS,
  aimAt,
  ammo,
  arrowsAim,
  canReloadNow,
  cool,
  dots,
  downGunNow,
  fire,
  graceLeft,
  graceLeftMs,
  graceOf,
  handBars,
  heard,
  heardReloads,
  keptNow,
  keyAim,
  keyAimNow,
  keyIndex,
  mgjTip,
  mouse,
  myDuck,
  onWheel,
  padAttack,
  padWeapon,
  playDuck,
  reload,
  setKeyAim,
  setMouse,
  setReloadsSeen,
  sightOn,
  slidPick,
  slidTap,
  tileKnock,
  toggleSight,
  myPick,
  mgjDownGun,
} from "./gamehand.js";

import {
  LAW_GLOW,
  against,
  crimson,
  flames,
  hurt,
  lawRole,
  playFx,
  seen,
  shooterBody,
} from "./gamefx.js";

import { underVeil } from "./loading.js";

import {
  ARROW,
  BULLET,
  CHAIR,
  GOLD_CHAIR,
  GRENADE,
  GRENADE_PIN,
  GUNS,
  ROUNDS_ART,
  TRACE,
  ZEBRA,
} from "./gunart.js";

import { isInvisible } from "./invisible.js";

import { invOn } from "./sbgod.js";

import { syncHidden } from "./sbgodview.js";

import { fsBtnHTML } from "./corners.js";

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
  ducksLayer,
  flag,
} from "./ui.js";

import { activeRoom } from "./net.js";

import { sprintStep } from "./stamina.js";

import { SPRINT, MGJ_HP_UNKNOWN } from "./gamedefaults.js";

import { sprintBlur } from "./sprintblur.js";

import { grStam, grCool } from "./sbgroups.js";

import { grLook } from "./sbgroupview.js";

import {
  COLS,
  SHORT,
  needed,
  canEndRound,
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
  colAt,
  colXAt,
  colBoundsAt,
  heldCol,
  startX,
  wyrStats,
  isSc,
  textMax,
  LAW_MID,
  coolFor,
  coolEnds,
  isHang,
  inWorld,
  MAG,
  magOf,
  magSize,
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

import { votesDue } from "./voterules.js";

import { isSudo, canOpen } from "./roomrules.js";

import { shotAt, phpLost, PHP, REACH } from "./boardfire.js";

import {
  isCounsel,
  jury,
  lawTally,
  canGiveUp,
  lawStats,
  ATT_PHASES,
} from "./lawrules.js";

import {
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
} from "./scrules.js";

import { bbMatch, roundName, bbStats } from "./bbrules.js";

import { mountWorld, BOARD_HTML as HANG_HTML } from "./hangout/world.js";

import { W as HW, H as HH } from "./hangout/layout.js";

import { zOf } from "./heights.js";

import { hangStill } from "./hangout/rules.js";

import {
  downStill,
  downFor,
  GET_UP_MIN,
  SPAWN_MS as PROT_MS,
  normalGame,
} from "./hangout/death.js";

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
  attVoteHTML,
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

import { isMuted, chatNote } from "./chat.js";

import {
  specialById,
  keysOf,
  hasKey,
  colorsOf,
  momentHTML,
  confettiRain,
  pressFX,
  heldHTML,
  heldPicHTML,
  warmHands,
  heldBoxHTML,
  daggerHTML,
  DUCKLING,
  ammoHTML,
  dualPistolHTML,
  DUAL,
} from "./specials.js";

import { mountHotbar } from "./hotbar.js";

import {
  hand,
  handIn,
  handReset,
  pickWith,
  mgjBackIfGone,
  mgjToggles,
  mgjOut2,
  heldNow,
  magFor,
  reloadsNow,
  reloadReady,
  reloadDry,
  selectKey,
  useKey,
  l4Pick,
  hotH,
} from "./hotpick.js";

import { heatUp, heatDraw, heldOn } from "./barrelheat.js";

import {
  laserLook,
  laserArt,
  laserGlow,
  laserFrame,
  laserMeter,
} from "./laserfx.js";

import { olAdd, olDraw, olFloor, olRoofed } from "./outlines.js";

import { ammoBar, stackBars, noReload } from "./meters.js";

import { LASER, BEAM } from "./laserart.js";

import {
  isL4dd,
  dodging,
  L4,
  l4Hp,
  l4Regen,
  downArmed,
  l4Dying,
  l4Down,
  slotsOf,
  maxHp,
  l4Cool,
  kitOf,
  inHand,
  swims as l4Swims,
  BURN,
  weaponName,
  wildCrying,
  isWild,
  zombieLook,
  slotOfPick,
} from "./l4ddrules.js";

import {
  ARMS,
  BOARD_WEAPONS,
  THROWS,
  AUTO,
  MGJ_MELEE,
  MGJ_GUNS,
} from "./guns.js";

import { watching, watchNext, watchHTML } from "./spectate.js";

import {
  l4Held,
  l4To,
  peekAgain as l4PeekAgain,
  l4Got,
  sprintLeft,
  safeKeepLine,
  laserEnd,
  l4ZBoxes,
  shotStop,
} from "./l4dd.js";

import { poolUnder, warmPool } from "./bloodpool.js";

import { clawMark } from "./claw.js";

import { mountMeter, othersHpHTML, popHP } from "./hpmeter.js";

import { mountL4Bar, l4Slider } from "./l4ddbar.js";

import {
  isSb,
  sbOnBoard,
  boardDuck,
  sbBoardK,
  noGoreOf,
  sbMay,
  sbSfx,
  sbLands,
  SB_LAND_MIN,
  sbCellMids,
  sbWalls,
  sbWallGo,
  sbHasOl,
  sbOlColor,
} from "./sandboxrules.js";

import { mountCabinEnd } from "./hangout/cabinend.js";

import { mountSandboxKeys } from "./sandbox.js";

import { sbCheat } from "./sbmenu.js";

import { sbHotOn, sbLook, sbHotSig } from "./sbhotview.js";

import { sbSlots, spawnOf } from "./sbhot.js";

import { sbBoardMarks, sbSettings, sbRoofed } from "./sbspawnview.js";

import { sbHear } from "./sbsfx.js";

import { duckSVG, duckRoom, picFrame, scaleOf } from "./duck.js";

import {
  shownDuck,
  shownNameStyle,
  hidesLooks,
  voteColorOn,
  tagColorOn,
  tinted,
  tileColor,
  inkOn,
  seenDuck,
  seenName,
} from "./looks.js";

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

import { profile, save, statMode } from "./store.js";

import { fmtJumps } from "./format.js";

import {
  openSettings,
  netLevel,
  uiScaleHTML,
  uiScaleWire,
} from "./settings.js";

import { setHideUi, uiHidden } from "./hideui.js";

import { musicBarHTML, mountMusicBar } from "./musicbar.js";

import { openCustomize, shareLook } from "./customize.js";

import { ARM_SWING } from "./armspeed.js";

import { pickNote } from "./notes.js";

import { openFriends } from "./friends.js";

import { pixelOn, pxSVG, snap, setDuckSize, PAGE_DUCK } from "./pixel.js";

import { lsetBtnHTML, lsetWatch, openLobbySettings } from "./lobbysettings.js";

import { canAdd, requestFriend } from "./account.js";

import { mountDocks, DOCK_HTML, BAR_HTML } from "./dock.js";

import { countJump } from "./jumps.js";

import { sfx, loadSounds, weaponsOff, hush, OTHERS } from "./sound.js";

import { mgjSteps } from "./l4ddsfx.js";

import { feet } from "./feet.js";

import { mountMap } from "./maps.js";

import { knockOff, bothOff } from "./duel.js";

import { hooks } from "./hooks.js";

import { mountTouch, stick } from "./touch.js";

import { walkIntent } from "./playerinput.js";

import { jumpCfg, jumpZ, landsAt, jumpDodges, jumpSend } from "./jump.js";

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
  tileAt,
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
  mgjFrozen,
  mgjGone,
  mgjSpawning,
  SPAWN_MS,
  mgjStats,
  GOOD_ID,
  PICK_FADE,
  XB,
  PICK_WEAPONS,
  MGJ_DOWN,
  MGJ_SCALE,
  MGJ_HAMMER,
  ammoOf,
  INF_AMMO,
  downNear,
  REVIVE,
  mgjPHp,
  mgjOut,
  mgjSafe,
  EDGE_WARN,
  GUN_TELL,
  HAMMER_TELL,
  BURST,
  SPREAD,
  DUCK_LEN,
  CAKE_EVERY,
  cakeAt,
  mgjStop,
} from "./mgjrules.js";

import { FLAME, POOF, FOODS, TELEPORT, HITMARK, edgeHTML } from "./mgjart.js";

import { gunLasers } from "./gunmenview.js";

import {
  npcURL,
  npcBox,
  npcName,
  npcSay,
  isZombie,
  npcPics,
  npcReady,
  heldOf,
  handAt,
  npcShot,
} from "./sbnpcart.js";

import { sbHpOf, sbWalkOf } from "./sbspawn.js";

import { angelic, angelGlow } from "./powerart.js";

// (after l4ddart.js: Noah's note on an old import cycle)
import { angelOf } from "./l4ddangel.js";

import { pwCodes, goreFree, BY_WOUND, newWound, woundLook } from "./wounds.js";

import { hatLayers, HAT_TOP } from "./hats.js";

import { faceLayer } from "./faces.js";

import { beakSVG } from "./beaks.js";

import {
  mgjBoardHTML,
  mgjHPHTML,
  dropMeteor,
  mgjStatsHTML,
  mgjOverHTML,
  MAD_JUSTIN,
  SAD_JUSTIN,
  CONTROLLER,
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
  vdStatsHTML,
  TABLE_W,
  SEAT_OUT,
  SEAT_LIFT,
} from "./vdd.js";

import {
  isTv,
  TV_BOARD,
  TV_ROWS_END,
  tvRowAt,
  tvStats,
} from "./triviarules.js";

import {
  tvWriteHTML,
  tvBoardHTML,
  tvRefresh,
  tvTyped,
  tvActHTML,
  tvRound,
  TV_TITLES,
  tvStatsHTML,
  formQ,
  formProblem,
  tvFormClick,
} from "./trivia.js";

import { frame, stamp, took } from "./perf.js";

import { touchOnly } from "./pointer.js";

import {
  fxMount,
  fxLimits,
  fxOrigin,
  fxFrame,
  fxHitAt,
  fxImpact,
  fxSmolder,
  fxSteam,
  fxSparks,
  fxMelee,
  fxBurst,
  fxSpurt,
  fxMuzzle,
  fxLasers,
  fxFlame,
  fxGroundFire,
  fxGround,
  fxBlood,
  heavyOff,
  fxKnock,
  fxEye,
  MUZZLE,
} from "./fx.js";

import { FLAME as FLAMER, flameRate, band } from "./flamer.js";

import { low } from "./gfx.js";

import { isNpc, npcDown } from "./npcshared.js";

import {
  sway,
  kick,
  kickOf,
  jitter,
  shake,
  shakeBoard,
  vibrate,
  VIB,
  hitPx,
  adrenFx,
  HIT,
  again,
} from "./fxmotion.js";

export let R = null,
  S = null,
  off = null,
  raf = 0,
  tick = 0,
  docks = null;
let shown = ""; // which phase view is up (phase|round|question)
export const keys = new Set();
export let me = null; // my duck here: { x, y, j (jump start), face }
let target = null; // where a click or a tap asked my duck to walk: { x, y, sprint, mark }
/* the chain gun's recoil (the owner's, Nov 16): while I fire it, my duck is pushed slowly back, away from the aim, at
   RECOIL.K of my walking speed; the keys add their own way to it, so walking into the aim holds against it (a vector
   sum, as real physics). Each of my shots keeps it on for RECOIL.MS (it fires every 67 ms). recoil = { until, dx, dy:
   the way it pushes, in board or world units } */
export const RECOIL = { K: 0.35, MS: 140 };
let recoil = null;
export const setRecoil = (v) => {
  recoil = v;
}; // (the shots' effects set it from gamefx.js)
let touchOff = null,
  touchedAt = 0,
  touchTold = false;
let squash = { q: "", t: 0 },
  moving = false,
  sprinting = false;
let lastFx = -1,
  hotdogs = [],
  follows = []; // the silly commands seen so far; hotdogs and items following their ducks
export let bar = null,
  meter = null, // my HP meter, under the hotbar (hpmeter.js)
  pad = null; // phones: the jump button and the attack button
export const kept = new Set(); // the jumps kept on here (Shift and the key); kept effects are in the room's state
const DOWN_TURN = (-100 * Math.PI) / 180; // (a duck lying dead is turned this far: css .gduck-body, rotate(-100deg))
const BODY = "~body"; // a Duck Cabin ghost's body is drawn as a duck of its own: its player's id and this
export const JUSTIN2 = "justin2"; // Mad God Justin's double, drawn as a duck of its own
const isJustin = (id) => id === JUSTIN_ID || id === JUSTIN2;
/* how big a duck is drawn against the others: Mad God Justin and his double a little bigger; a player at their own Size
   (Customize, duck.js scaleOf: 50% to 500%, every mode) */
export const bigOf = (s, id) =>
  (isJustin(id) && isMgj(s) ? MGJ_SCALE : 1) *
  (s.players[id] ? scaleOf(shownDuck(s, s.players[id])) : 1);
/* (the camera, the story's zone, the revive key and the bracket's zoom are set from the placing code in gameplace.js) */
export const setMgjRv = (v) => {
  mgjRv = v;
};
export const setScZone = (v) => {
  scZone = v;
};
export const setCam = (v) => {
  cam = v;
};
export const setBbZoom = (v) => {
  bbZoom = v;
};
export let mgjRv = false, // (E held down for a revive, or the phone's Revive button)
  shovedAt = 0,
  putAt = 0; // the handgun or dagger kept out (Shift and its key), and where the mouse is on the screen
export let shows = {}; // a handgun just fired, shown turned toward its aim for a moment: by player id
let scene = null; // the map: its world fills the page behind the game
/* the place the screen was made for: Duck Cabin's games or not, and the map in its form */
const placeKey = (s) =>
  [isHang(s), s.options.map, s.mapZoomed, s.mapGreyed].join();
let placed = "";
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
  cabinEndOff = null, // (Hangout and Quacky Zombies: the End Cabin vote)
  sbk = null, // (Sandbox: the key windows c, b, m, n, h, g, p)
  mbarOff = null; // the player menu (Tab), and the away watch
let recorded = ""; // the last round counted in my all-time stats
let lastLog = -1,
  bubbles = {}, // chat bubbles over the ducks: { [player]: { text, until, n, at (when it came) } }
  npcDownAt = {}; // (an NPC: when I first saw it down, to cut what it was saying)
let lastClose = 0; // Lawyering: the closing arguments last announced
export let bbZoom = 0,
  losers = new Set(),
  seedShift = 0,
  knocked = new Set(); // Bicker Brackets: the bracket's zoom (0: automatic); ducks wearing the Loser's X; how far the sides' colors have turned;
// the matches whose loser is already bumped off the cloud
export let world = null; // Hangout: the cabin's world (its camera, its props, its activities)
let scY = 0,
  scT = 0,
  scWalk = 0,
  scZone = ""; // Story Chain: how far the story has scrolled, the last frame, when my duck last walked, the zone it stands in
/* (one query, kept: a new matchMedia every call cost a little on every frame) */
const PORTRAIT =
  typeof matchMedia === "function"
    ? matchMedia("(orientation: portrait) and (max-width: 760px)")
    : null;
const portrait = () => !!PORTRAIT && PORTRAIT.matches;
/* on a phone held upright the board turns (agree at the top); the bracket and the story don't: they keep their own layout */
export const turned = () =>
  portrait() &&
  !(
    R &&
    (R.state.phase === "bracket" ||
      isSc(R.state) ||
      isHang(R.state) ||
      isVd(R.state) ||
      isTv(R.state))
  ); // (Valentine's Duck Date keeps its table the right way up; Trivia's rows stay rows)
export let cam = null; // the bracket's camera: the diagram's corner on the board (dx, dy), the bracket's offset in it (ox, oy), its zoom and size

/* ---------- movement numbers (board widths or heights per second) ---------- */
const SPEED = { x: 0.45, y: 1.0, px: 0.5, py: 0.85, sprint: SPRINT.speed }; // (sprint: the whole game's, gamedefaults.js)
const MGJ_SLOW = 0.8;

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
  ${["answer", "discuss", ...ATT_PHASES].includes(s.phase) ? lawTopHTML(s, knocked.has(caseKey(s))) : ""}${ATT_PHASES.includes(s.phase) ? '<div class="law-vote-wrap"></div>' : ""}</div>`;
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
                : sbOnBoard(s)
                  ? SB_BOARD(s)
                  : isVd(s)
                    ? vdBoardHTML(s, R.me)
                    : isTv(s)
                      ? tvBoardHTML(s, R.me)
                      : `<div class="board${!isWyr(s) && !isDdr(s) && s.options.aodColors === "gr" ? " aod-gr" : ""}">
  ${isWyr(s) ? wyrColsHTML(s) : isDdr(s) ? ddrColsHTML() : `<div class="cols">${COLS.map((c, i) => `<div class="col c${i + 1}" data-c="${i}"><span class="col-name">${esc(c)}<span class="cb-mark">${SHORT[i]}</span></span></div>`).join("")}</div>`}
  <div class="ducks"></div><div class="fxl"></div>
  ${s.phase === "answer" || s.phase === "discuss" ? `<div class="topover">${lordHTML(s)}<p class="question">${fontHTML(writerFont(s), esc(isWyr(s) ? "Would you rather" : s.qs[s.qi].text))}</p></div>` : ""}</div>`; // (Would You Rather: the choices are on the tiles)

/* Sandbox on the board: the plain field, Mad God Justin's arena with nobody in it (the room's map shows through as on
   every board) */
const SB_BOARD = (s) =>
  `<div class="board sb-board${+s.options.sbTint === 1 ? " sb-tint" : ""}"><div class="cols mgj-cols"><div class="col mgj-field" data-c="0"></div></div><div class="ducks"></div><div class="fxl"></div></div>`;
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
  /* Trivia: the rows start under the cloud and the question and stop over my answer box. Each row is as tall as its
     words and the ducks on it need (at least a duck), so they can reach past the bottom: then the view slides down them
     as my duck walks, like Story Chain's. Under the last row is the strip where a duck stands on no row */
  const tv = $(".tv-view", board);
  if (tv) {
    const ttop = $(".tv-top", board),
      form = $(".tv-ansform", board),
      t = Math.max(
        top0 + size * 0.4,
        ttop ? ttop.offsetTop + ttop.offsetHeight + 4 : 0,
      ),
      b = Math.max(
        size * 0.2,
        form ? board.offsetHeight - form.offsetTop + 6 : 0,
      );
    tv.style.top = `${t.toFixed(1)}px`;
    tv.style.bottom = `${b.toFixed(1)}px`;
    /* the ducks get smaller (down to 70%) when that lets every row and the strip fit, so on a short screen the view
       doesn't start slid down past (A); past that the view slides as before */
    const list = $(".tv-rows", tv);
    let d = size;
    for (let k = 0; k < 4; k++) {
      board.style.setProperty("--tvd", `${d.toFixed(1)}px`);
      const over = list.offsetHeight - tv.clientHeight;
      if (over <= 0 || d <= size * 0.7) break;
      d = Math.max(
        size * 0.7,
        d - over / ((list.children.length - 1) * 0.7 + 0.9) - 1,
      );
    }
    geo.size = d;
    board.style.setProperty(
      "--tvt",
      `${Math.max(0, t - d * 1.1).toFixed(1)}px`,
    ); // (the ducks show down to the view's edges, and a duck's height over its top)
    board.style.setProperty("--tvb", `${b.toFixed(1)}px`);
    geo.tl = {
      t,
      h: Math.max(1, tv.clientHeight),
      rows: [...list.children].map((e) => ({
        top: e.offsetTop,
        h: Math.max(1, e.offsetHeight),
      })),
      contentH: list.offsetHeight,
    };
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
/* Trivia: the row (or the strip) at a duck's y, and how far down it the duck stands. The rows share y up to
   TV_ROWS_END, each the same part of it, whatever their height; the strip takes the rest */
function tvSeg(y) {
  const rows = geo.tl.rows,
    n = rows.length - 1;
  y = Math.max(0, Math.min(0.9999, y));
  if (n < 1) return { row: rows[0] || { top: 0, h: geo.tl.h }, f: y, share: 1 };
  if (y < TV_ROWS_END) {
    const u = (y / TV_ROWS_END) * n;
    return { row: rows[Math.floor(u)], f: u % 1, share: TV_ROWS_END / n };
  }
  return {
    row: rows[n],
    f: (y - TV_ROWS_END) / (1 - TV_ROWS_END),
    share: 1 - TV_ROWS_END,
  };
}
const tvFeet = (y) => {
  const { row, f } = tvSeg(y);
  return row.top + row.h * f;
};
/* Trivia's view slides to keep my duck in sight */
function panRows(pos, now) {
  const list = S.querySelector(".tv-rows");
  if (!list || !geo.tl) return;
  const dt = Math.min(0.1, Math.max(0, (now - (scT || now)) / 1000));
  scT = now;
  const max = Math.max(0, geo.tl.contentH - geo.tl.h),
    want = Math.max(
      0,
      Math.min(max, pos && pos.x >= 0 ? tvFeet(pos.y) - geo.tl.h * 0.55 : scY),
    );
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
    v.classList.toggle("more-down", scY < max - 8); // more rows above or below
  }
}
const TAG_ROOM = 24; // px under a duck's feet: its name tag
/* where a duck stands: x along the answers (0 strongly disagree … 1 strongly agree), y across */
/* Sandbox's Board size (G's Rules, sandboxrules.js sbBoardK): the plain board k times as big as the screen's, and the
   camera following my duck over it, as on Downpour (the owner's, Nov 19 21:59Z: "if the map is bigger, the camera follows
   the duck as they move around"). geo.big is the whole board measured as if it were on the screen; geo.ox, geo.oy how
   far it's slid; the map behind and the field slide and grow with it */
function bigGeo() {
  const g = geo;
  return g.big || (g.big = { ...g, k: 1, W: g.W * g.k, H: g.H * g.k });
}
function boardCam() {
  if (!geo || geo.hang || geo.sc || geo.tl || geo.qp) return;
  const s = R.state,
    k = sbOnBoard(s) && s.phase === "sandbox" ? sbBoardK(s) : 1,
    cols = S && $(".board .cols", S),
    layer = S && $(".map-layer", S);
  if (k !== (geo.k || 1)) {
    geo.k = k;
    geo.big = null;
    geo.ox = geo.oy = 0;
    S.classList.toggle("sb-big", k > 1);
  }
  if (k === 1) {
    if (cols && cols.style.transform) cols.style.transform = "";
    if (layer && layer.style.transform) layer.style.transform = "";
    return;
  }
  const g = geo,
    big = bigGeo();
  geo = big;
  const w = watching(s, R.me),
    who = (w && w !== R.me && s.pos[w]) || me; // (out of lives: the duck I watch, spectate.js)
  const o =
    who && who.x >= 0 ? place(who) : { left: big.W / 2, top: big.H / 2 };
  geo = g;
  const cl = (v, lo) => Math.max(lo, Math.min(0, v));
  g.ox = cl(g.W / 2 - o.left, g.W - big.W);
  g.oy = cl(g.top0 + g.H / 2 - o.top, g.H - big.H);
  const tr = `translate(${g.ox.toFixed(1)}px, ${g.oy.toFixed(1)}px) scale(${k.toFixed(3)})`;
  if (cols && cols._tr !== tr) {
    cols._tr = tr;
    cols.style.transformOrigin = "0 0";
    cols.style.transform = tr;
  }
  if (layer && layer._tr !== tr) {
    layer._tr = tr;
    layer.style.transformOrigin = `${g.left.toFixed(1)}px ${(g.top + g.top0).toFixed(1)}px`;
    layer.style.transform = tr;
  }
}
export function place(p, i, n, free = false) {
  if (geo && geo.k > 1 && !geo.hang) {
    const g = geo;
    geo = bigGeo();
    try {
      const o = place(p, i, n, free);
      return { left: o.left + (g.ox || 0), top: o.top + (g.oy || 0) };
    } finally {
      geo = g;
    }
  } // (Sandbox's bigger board: on it, slid by the camera)
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
  if (geo.tl)
    return {
      left: geo.W * Math.max(0, p.x),
      top: geo.tl.t + tvFeet(p.y) - scY,
    }; // Trivia: down the rows, as tall as each one is
  const { W, H, top0, size, labelH, qp } = geo;
  if (p.x < 0 && !free) p = { ...p, x: startX(R.state) }; // (ducks start on the board; this only covers an old state. free: a shot or a blast, which can be off the board)
  if (qp) {
    const w = W - qp.l - qp.r,
      h = H - qp.t - qp.b;
    return turned()
      ? { left: qp.l + p.y * w, top: top0 + qp.t + (1 - p.x) * h }
      : { left: qp.l + p.x * w, top: top0 + qp.t + p.y * h };
  } // on Who is the Quack?'s tiles
  if (turned() && free)
    return {
      left: W * (0.1 + p.y * 0.8),
      top: top0 + H * (1 - p.x) + size * 0.45,
    }; // (a shot or a blast: where it is, on the board or off it)
  if (turned())
    return {
      left: W * (0.1 + p.y * 0.8),
      top: Math.max(
        top0 + size * 1.08,
        Math.min(top0 + H - TAG_ROOM, top0 + H * (1 - p.x) + size * 0.45),
      ),
    }; // (upright on a phone: the whole duck and its name tag stay on the board, never under a bar: the owner's, Nov 4)
  return {
    left: W * p.x,
    top: top0 + size * 1.08 + p.y * (H - size * 1.08 - labelH),
  };
}
function unplace(px, py) {
  // the inverse, for clicks
  if (geo.k > 1 && !geo.hang) {
    const g = geo;
    geo = bigGeo();
    try {
      return unplace(px - (g.ox || 0), py - (g.oy || 0));
    } finally {
      geo = g;
    }
  } // (Sandbox's bigger board)
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
  if (geo.tl) {
    const y = py - geo.tl.t + scY,
      rows = geo.tl.rows,
      n = rows.length - 1;
    let k = rows.findIndex((r) => y < r.top + r.h);
    if (k < 0) k = rows.length - 1;
    const f = cl((y - rows[k].top) / rows[k].h) * 0.999;
    return {
      x: cl(px / W),
      y:
        n < 1
          ? f
          : k < n
            ? ((k + f) / n) * TV_ROWS_END
            : TV_ROWS_END + f * (1 - TV_ROWS_END),
    };
  } // (Trivia's rows)
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
/* Vote colors (looks.js): the color of the tile a duck stands on, "" off the tiles; the tiles' colors are read once a
   frame, so a fading tile fades the ducks on it too */
let tileFrame = 0,
  tileSeen = {};
function voteTint(s, board, pos) {
  if (!voteColorOn(s) || !pos || pos.x < 0 || !boardPhases(s).includes(s.phase))
    return "";
  const c = colAt(s, pos.x);
  if (c < 0) return "";
  if (tileFrame !== frameNo) {
    tileFrame = frameNo;
    tileSeen = {};
  }
  return (tileSeen[c] ??= tileColor(board, c));
}
export let frameNo = 0;
/* the HP of a duck, Justin or his double right now, as [hp, most], or null where it has none: Quacky Zombies' own,
   Mad God Justin's (the players' and his), the board's Mad God Justin's, and the normal game's 3 (back after a while
   without a hit) on the boards and in Duck Cabin */
function hpFull(s, id, now) {
  const seated = s.seat.includes(id) && s.players[id];
  if (isL4dd(s))
    return seated && inWorld(s)
      ? [Math.max(0, l4Hp(s, id) || 0), maxHp(s, id)]
      : null;
  if (isMgj(s)) {
    if (s.phase !== "boss" || !s.mgj) return null;
    if (id === JUSTIN_ID) return [Math.max(0, s.mgj.hp), s.mgj.max];
    if (!seated) return null;
    const most = mgjPHp(s);
    return [
      s.players[id].dead
        ? 0
        : Math.max(0, most - ((s.mgj.lost || {})[id] || 0)),
      most,
    ];
  }
  if (id === JUSTIN_ID)
    return !justinShown(s)
      ? null
      : boardMgj(s)
        ? [
            s.justin.down ? 0 : Math.max(0, s.justin.hp ?? BJ_HP),
            s.justin.max || BJ_HP,
          ]
        : [s.justin.down ? 0 : 1, 1]; // (Justin on the board without Mad God Justin's HP: one hit takes his 1, as always)
  if (!seated || !onBoardPhase()) return null;
  const max = sbHpOf(s, id) || PHP; // (Sandbox: a spawn's or a respawn's HP for it)
  return [s.players[id].dead ? 0 : Math.max(0, max - phpLost(s, id, now)), max];
}
/* my meter under the hotbar, and the other players' small ones in the board's corner (Quacky Zombies and Mad God
   Justin, on a computer, unless turned off in Settings) */
let othersSig = "",
  othersShape = "", // (their rows, names and numbers' lengths: what sets the box's size)
  othersAt = 0,
  othersBox = null, // the others' meters' box, in the board's px (measured when it changes)
  allBoxes = [], // every duck's box in the last frame, in the board's px (mine too)
  overBoxes = null; // the cloud's and the question's boxes over the board, in the board's px (measured a few times a second)
function drawMeters(s, board, layer, now) {
  if (!meter) return;
  const hv = R.me && hpFull(s, R.me, now);
  if (hv) {
    const [sp, tired] = isMgj(s) ? [null, false] : sprintLeft(); // (every mode's sprint (gamedefaults.js), stamina.js; Mad God Justin has no sprint, so no sprint bar)
    meter.set(
      hv[0],
      hv[1],
      sp,
      tired,
      isL4dd(s) ? l4Regen(s, R.me, clockNow()) : null,
    );
    meter.bars(board && board.querySelector(".gduck.mine .gduck-name")); // (the cooldown and the ammo under it too)
    if (board && meter.edge.parentNode !== board) board.append(meter.edge); // (the red corners: the board's, not the window's)
  } else meter.hide();
  const want = profile.settings.otherHp !== false && !!board; // (every mode now, as in Dead Ducks Arcade: the owner's, Nov 18 16:43Z; only the ducks that have HP there show, hpFull)
  let box =
    board &&
    (board._hpo && board._hpo.parentNode === board
      ? board._hpo
      : (board._hpo = board.querySelector(".hpo"))); // (kept on the board: found once, not every frame)
  if (!want) {
    if (box) box.remove();
    othersSig = "";
    return;
  }
  const list = s.seat
    .filter(
      (id) =>
        id !== R.me &&
        s.players[id] &&
        !(isL4dd(s) && (s.players[id].helper || s.players[id].wild)),
    ) // (Dead Ducks Arcade and Survival: only the players, never Justin's bar, the owner's, Nov 19 19:27Z)
    .map((id) => [id, s.players[id].name, hpFull(s, id, now)])
    .filter(([, , h]) => h)
    .map(([id, n, h]) => [id, n, h[0], h[1]]);
  if (!box) {
    box = document.createElement("div");
    box.className = "hpo";
    box.setAttribute("aria-hidden", "true");
    board.append(box);
    othersSig = othersShape = "";
  }
  const sig = JSON.stringify(list);
  if (sig !== othersSig) {
    othersSig = sig;
    box.innerHTML = othersHpHTML(list);
    const shape = list
      .map(([id, n, h, m]) => [id, n, String(h).length, m].join())
      .join(";");
    if (shape !== othersShape) othersBox = null; // (measured again once, below: its size changed. Only a new row, name or number's length changes it: measured for every HP lost, a crowd of zombies made the page measure itself again and again)
    othersShape = shape;
  }
  /* a duck or a zombie under them, mine or anyone's: see-through on my screen, so I see who's there (the owner's, Nov 17
     17:41Z; checked a few times a second). The box is measured only when its content or the board changes, and the
     ducks' boxes come from the last frame's drawing, so no frame waits on the page's layout */
  if (now - othersAt > 120) {
    othersAt = now;
    if (!othersBox || othersBox.g !== geo) {
      const b = box.getBoundingClientRect();
      othersBox = {
        g: geo,
        l: b.left - geo.left,
        r: b.right - geo.left,
        t: b.top - geo.top,
        b: b.bottom - geo.top,
      };
    }
    const b = othersBox,
      under = (a) =>
        a.r > b.l - 8 && a.l < b.r + 8 && a.b > b.t - 8 && a.t < b.b + 8,
      see =
        !!list.length &&
        (allBoxes.some(under) || (isL4dd(s) && l4ZBoxes().some(under)));
    box.classList.toggle("see", see);
  }
}
function drawDucks(now = clockNow()) {
  frameNo++;
  const board = S && $(".board", S);
  if (!board || !R || !geo) return;
  const s = R.state,
    layer = ducksLayer(board),
    size = geo.size,
    hang = !!geo.hang;
  warmPool(size * 1.875); // (the pool of blood under a duck that dies, as pixels before anyone does: css .gduck-pool)
  if (isSb(s)) {
    const go = (sbGo(s) || {}).id || "";
    if (go !== lastSbGo) {
      lastSbGo = go;
      setHTML($(".gact", S), actHTML(s)); // (I walked to or from a spawn build: its button comes or goes)
    }
  }
  if (board.classList.contains("sb-board"))
    board.classList.toggle("sb-tint", +s.options.sbTint === 1); // (its setting changed while the game runs)
  if (pixelOn()) setDuckSize(hang ? PAGE_DUCK : size); // (the pixel look: one pixel is a 32nd of a duck, on this board; Duck Cabin's and Downpour's world, where ducks show smaller, on the pages' grid: pixel.js)
  /* each duck's element by its id, kept on the layer (a search of the layer for every duck, every frame, added up) */
  const duckEls = layer._els || (layer._els = new Map()),
    duckEl = (id) => {
      const d = duckEls.get(id);
      return d && d.parentNode === layer ? d : null;
    };
  if (hang) world.frame(now); // (the camera first: ducks stand in the world)
  const sbOl = sbHasOl(s), // (Sandbox: a zone with Outlines, sandboxrules.js)
    ol = isL4dd(s) || isMgj(s) || hang || sbOl, // (the outlines, outlines.js: every zombie game, and Hangout's world too, the universal way to see who's hidden: the owner's, Nov 17 17:41Z)
    olAt = ol && hang ? world.at(R.me) : null,
    olMe = olAt ? olFloor(olAt.x, olAt.y, olAt.z) : null; // (my floor)
  trackWalk();
  drawMeters(s, board, layer, now);
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
    hang && !bodyOf(id) ? world.ladderPos(posOf0(id)) : posOf0(id); // (partway up a ladder: drawn on it, world.js)
  const posOf0 = (id) =>
    bodyOf(id)
      ? { ...bodyOf(id), j: 0 }
      : shoved(
          id,
          id === JUSTIN_ID
            ? jp
            : id === JUSTIN2
              ? jp2
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
  if (geo.tl) panRows(me, now);
  const ids = [
      ...s.seat.filter((id) => s.pos[id]),
      ...(jp ? [JUSTIN_ID] : []),
      ...(jp2 ? [JUSTIN2] : []),
      ...(isMgj(s) && s.mgj && s.mgj.gj && s.pos[GOOD_ID] ? [GOOD_ID] : []),
      ...Object.keys(ghosts)
        .filter((id) => s.players[id] && !ghosts[id].l4)
        .map((id) => id + BODY), // (Quacky Zombies' ghosts leave no body)
    ],
    lane = ids.filter((id) => posOf(id).x < 0);
  if (!isL4dd(s) && onBoardPhase())
    feet(
      s.seat
        .filter((id) => s.pos[id] && s.players[id] && !s.players[id].dead)
        .map((id) => {
          const p = posOf(id);
          return [id, p.x, p.y, liftOf(id, p)];
        }),
      hang ? [HW, HH] : [geo.W, geo.H],
      hang ? 44 : geo.size * 0.7,
      R.me,
      hang,
    ); // (quiet footsteps in every mode; Quacky Zombies has its own: feet.js)
  if (!hang && onBoardPhase() && s.pos[R.me])
    tileKnock(s, posOf(R.me), performance.now());
  const boxes = [],
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
      !hidesLooks(s) && // (Hide customization: name tags always show)
      ["aod", "wyr", "ddr"].includes(s.options.mode) &&
      s.phase === "answer",
  );
  const deadNow = (id, p) =>
    !!p.dead &&
    !landing(id) &&
    !(wq && (wq.dead || []).includes(id) && rt < 6100);
  for (const id of ids) {
    const size = geo.size * bigOf(s, id); // (this duck's own size: bigger for Mad God Justin)
    const g = bodyOf(id),
      p = g
        ? { ...s.players[id.slice(0, -BODY.length)], dead: true }
        : s.players[id] ||
          (id === JUSTIN_ID && {
            ...(isMgj(s)
              ? !mgjDead(s) && s.mgj && s.mgj.hp <= MGJ_CRY
                ? SAD_JUSTIN
                : MAD_JUSTIN
              : JUSTIN_PLAYER),
            dead: !!s.justin.down || mgjDead(s),
          }) ||
          (id === GOOD_ID && {
            ...GOOD_JUSTIN,
            dead: !!(s.mgj && s.mgj.gj && s.mgj.gj.down),
          }) ||
          (id === JUSTIN2 && MAD_JUSTIN),
      pos = posOf(id);
    if (!p) continue;
    let d = duckEl(id);
    if (!d) {
      d = el(
        `<div class="gduck${id === R.me ? " mine" : ""}" data-pid="${esc(id)}"><span class="gduck-ring"></span><div class="gduck-shadow"></div><div class="gduck-lift"><span class="gduck-bubble"></span><span class="gduck-zz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span><span class="gduck-fire" aria-hidden="true">${FLAME}</span><span class="gduck-say"></span><div class="gduck-body"></div><svg class="gduck-x" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 7L33 33M33 7L7 33"/></svg><span class="gduck-name"></span><span class="gduck-done" hidden>✓</span></div></div>`,
      );
      if (g) d.classList.add("gbody");
      layer.append(d);
      duckEls.set(id, d);
      d._liftEl = d.querySelector(".gduck-lift");
      d._shadowEl = d.querySelector(".gduck-shadow");
      d._bodyEl = d.querySelector(".gduck-body");
    } // (its parts, found once)
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
      own = s.players[id] && !g ? shownDuck(s, p) : p.duck, // (Hide customization, Rainbow Ducks: looks.js)
      vc = s.players[id] && !g ? voteTint(s, board, pos) : "",
      cried =
        isL4dd(s) && own && wildCrying(s, id, now)
          ? { ...own, eyes: "tears" }
          : own, // (Justin out there, hurt: the tears eyes for 10 s, Mad God Justin's crying, l4ddrules.js CRY)
      worn = dnHat(s, id, now) ? dunceDuck(cried) : cried,
      look = vc ? tinted(worn, vc) : worn, // (Vote colors: the tile's color under the duck)
      role = lawRole(s, id),
      wc =
        id === JUSTIN_ID && isMgj(s)
          ? mgjGore(s)
          : id === JUSTIN_ID
            ? s.justin.w || ""
            : s.players[id] && !g && s.pw
              ? pwCodes(s, id, now)
              : "", // (its wounds: wounds.js; Mad God Justin's by his HP, mgjGore; Justin on the board's by his hits, boardjustin.js justinHit)
      sig = JSON.stringify([
        look,
        p.name,
        p.nameStyle,
        dead,
        role,
        hidesLooks(s),
        wc,
        noGoreOf(s),
      ]); // a new look shows at once, mid-game too (Duncelation: a dunce's hat)
    if (dead && d._dead === false && !g && !wq) {
      sfx.hit();
      hurt(d, 4, true);
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
      const pic = duckSVG(look, {
        size: 64,
        shadow: false,
        title: p.name,
        dead,
        ...woundLook(noGoreOf(s) ? goreFree(wc) : wc), // (Gore off: only a hat knocked off shows)
        grow: true,
      });
      const F = picFrame(look); // (a thin or sparse cut-out picture, drawn bigger: its box is wider than the duck's)
      d._bodyEl.innerHTML =
        (pixelOn() ? pxSVG(pic, F ? (size * F.w) / 120 : size, "duck") : pic) + // (the pixel look: the same drawing, made into pixels once)
        '<span class="sp-fx gduck-aura"></span>';
      d._pic = d._bodyEl.querySelector("svg.duck, img.px");
      if (F && d._pic) {
        d._pic.style.width = `${((F.w / 120) * 100).toFixed(2)}%`;
        d._pic.style.marginLeft = `${((F.x / 120) * 100).toFixed(2)}%`;
      } // (as wide as its box, the duck's square still in the middle)
      if (look && look.eyes === "tears" && !pixelOn()) {
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
        nameHTML(p.name, s.players[id] ? shownNameStyle(s, p) : p.nameStyle) +
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
      d._hpWas = d._hp; // (the new bar starts from what the old one showed, so a hit that redraws the tag still flashes)
      d._hp = null;
    }
    const tag = tagColorOn(s) && vc ? vc : ""; // (Change player tag color: the name tag in the duck's vote color)
    if (d._tag !== tag) {
      d._tag = tag;
      d.classList.toggle("vtag", !!tag);
      if (tag) {
        d.style.setProperty("--vc", tag);
        d.style.setProperty("--vk", inkOn(tag));
      }
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
    const wait = !!l4dn && l4Dying(s, id, now).wait; // (Quacky Zombies: someone reviving it: the bleeding-out waits)
    if (d._dwait !== wait) {
      d._dwait = wait;
      d.classList.toggle("dn-wait", wait);
    }
    /* down and dying: greyer and greyer (the owner's, Nov 17 11:07Z): Quacky Zombies as its bleeding-out runs, Mad God
       Justin over DYING_MS out of HP (there's no bleeding-out there) */
    const out = isMgj(s) && dead && mgjOut(s, id) && s.mgj.out[id],
      dg = l4dn
        ? l4Dying(s, id, now).k
        : out
          ? Math.min(1, (now - out) / DYING_MS)
          : -1,
      dgk = dg < 0 ? -1 : Math.round((0.15 + 0.85 * dg) * 50) / 50;
    if (d._dg !== dgk) {
      d._dg = dgk;
      d.classList.toggle("dying", dgk >= 0);
      if (dgk >= 0) d.style.setProperty("--dg", dgk);
    }
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
    /* Mad God Justin's Player HP: see-through red blocks behind the letters (one for each HP, the real meter is under the
       hotbar); the part a hit took flashes light at once, then fades.
       Never with the down meter: a duck that's down shows only the down meter, and stands up full */
    /* the normal game's HP (rules.js PHP): the same bar, always shown while the duck is up on the board, as Dead Ducks
       Arcade's (it was shown only while a hit was still counted); Quacky Zombies: its own HP, always shown (down or a
       ghost, none) */
    const l4 =
        isL4dd(s) &&
        !g &&
        inWorld(s) &&
        (s.seat.includes(id) ||
          (isWild(s, id) && l4Hp(s, id) >= 0 && l4Hp(s, id) < maxHp(s, id))), // (Justin out there: his HP once he's hit, as anyone's; the owner's, Nov 18 15:35Z: "When Justin gets hit, his health bar shows in the zombie game")
      bj = id === JUSTIN_ID && !g && !isMgj(s) && !hang && justinShown(s), // (Justin on the board: the board's Mad God Justin's 10 HP, or his 1, always shown while he's up; the owner's, Nov 19 01:34Z, HP for "everything")
      lost =
        !l4 && !isMgj(s) && !g && s.seat.includes(id) && !dead
          ? phpLost(s, id, now)
          : 0,
      hpMax = bj
        ? boardMgj(s)
          ? s.justin.max || BJ_HP
          : 1
        : l4
          ? maxHp(s, id)
          : isMgj(s)
            ? !g && s.seat.includes(id) && s.phase === "boss"
              ? mgjPHp(s)
              : 0
            : !g && s.seat.includes(id) && !dead && !isL4dd(s) && onBoardPhase()
              ? sbHpOf(s, id) || PHP
              : 0, // (every other mode: always shown, as in Dead Ducks Arcade; the owner's, Nov 18 16:43Z: "the health meter ... from zombies is in every game mode now")
      hp = !hpMax
        ? -1
        : bj
          ? dead
            ? -1
            : boardMgj(s)
              ? (s.justin.hp ?? hpMax)
              : 1
          : l4
            ? !dead && l4Hp(s, id) > 0
              ? l4Hp(s, id)
              : -1
            : isMgj(s)
              ? s.mgj && !dead
                ? Math.max(0, hpMax - ((s.mgj.lost || {})[id] || 0))
                : -1
              : hpMax - lost;
    if (d._hp !== hp) {
      /* the normal game's bar only shows once a hit is counted, so the first HP lost comes from a full bar (the same
         flash and sound as every later one) */
      const was0 = d._hp === null ? (d._hpWas ?? null) : d._hp,
        was = was0 === -1 && lost && hp >= 0 ? hpMax : was0;
      d._hp = hp;
      d.classList.toggle("php", hp >= 0);
      const bar = d.querySelector(".gduck-hp");
      if (bar && hp >= 0) {
        bar.style.setProperty("--hp", (hp / hpMax).toFixed(3));
        bar.style.setProperty("--n", Math.min(hpMax, 40)); // (its blocks)
        const red = bar.querySelector("b");
        if (was > hp) {
          bar.style.setProperty("--was", (was / hpMax).toFixed(3));
          again(red, "php-lost"); // (started over without the page measuring itself: fxmotion.js)
          sfx.hit();
          if (id === R.me) sfx.ouch(); // (my duck quacks when it's hurt)
          hurt(d, hitPx(was - hp), hp <= 0); // (a duck hit shakes once by the HP it lost, and once more as it goes down: the owner's, Nov 17)
        } else {
          bar.style.setProperty("--was", (hp / hpMax).toFixed(3));
          red.style.animation = "none";
          if (l4 && was >= 0 && hp > was) {
            const b = d.classList.contains("l4-heal");
            d.classList.toggle("l4-heal", !b);
            d.classList.toggle("l4-heal-b", b);
          } // (Quacky Zombies: 1 HP back, a green glow that fades; its twin, -b, starts it over without a layout)
        }
      }
    }
    /* a duck, Justin or his double gaining or losing HP: "+1 HP" or "−1 HP" over it for a moment (not when a fight or a
       round starts the HP over) */
    const hv = !g && hpFull(s, id === JUSTIN2 ? JUSTIN_ID : id, now),
      hk = hv ? hv[1] + "/" + s.phase : "";
    const bled =
        hv && d._hk === hk && d._hv > hv[0] && id !== JUSTIN2
          ? d._hv - hv[0]
          : 0,
      rose = id === JUSTIN_ID && d._hv === 0 && hv && hv[0] > 0; // (Justin back up, whole: no "+N HP" for it)
    if (hv && d._hk === hk && d._hv !== hv[0] && id !== JUSTIN2 && !rose)
      popHP(d.querySelector(".gduck-lift"), hv[0] - d._hv, touchOnly());
    d._hk = hk;
    d._hv = hv ? hv[0] : -1;
    const at = seatAt(s, id) || place(pos, lane.indexOf(id), lane.length),
      z = liftOf(id, pos);
    d._at = [at.left, at.top];
    if (bled)
      fxHitAt(
        at.left,
        at.top,
        z + size * (isJustin(id) ? 0.5 * MGJ_SCALE : 0.42),
        id,
        size,
        "small",
        look && look.color,
      ); // (blood, by what hit it, with bits of the duck in its color: fx.js)
    if (d._wc === undefined)
      d._wc = wc; // (first seen: what it already lost doesn't fly off again)
    else if (wc !== d._wc && !g)
      knockedOff(d, wc, look, at, z, size, turned() ? 1 : d._face || 1); // (its hat, its beak or its eye flying off)
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
    const [tx, ty] = hang
        ? world.local(at.left, at.top) // (Hangout's camera: in the world's box, which the camera slides, world.js)
        : [snap(at.left), snap(at.top)], // (the pixel look: on the grid, so its pixels line up with the map's)
      tr = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`,
      lift = `translateY(${(-z).toFixed(1)}px)`;
    const deadPose =
      dead && !(p.duck && (p.duck.image || p.duck.style === "jack")); // (Jack in a Box flops over in his own drawing)
    const body = `scaleX(${fx})${deadPose ? " rotate(-100deg) translateY(-12%)" : ""}`,
      squish = `scale(${sx}, ${sy})`,
      sh = (1 - Math.min(0.6, z / (size * 3.2))).toFixed(3);
    /* off the camera (a duck's room past the screen's edges, Hangout's world): not drawn at all, so the page doesn't style
       or paint it; it still walks, fights and counts as before, and shows again as it comes near. Where it stands isn't
       written while it's off (each write restyled it, every frame): it's written as it comes back */
    const off =
      hang &&
      (at.left < -size * 2 ||
        at.left > geo.W + size * 2 ||
        at.top - z < -size * 2 ||
        at.top - z > geo.H + size * 3);
    if (!off && (d._tr !== tr || d._dz !== deadPose)) {
      d._tr = tr;
      d._dz = deadPose;
      d.style.transform = tr;
      if (!hang) d.style.zIndex = deadPose ? 1 : Math.round(at.top); // (lying dead: under every duck standing, the owner's, Nov 19 10:22Z)
    }
    if (!hang && isSb(s)) {
      // (Sandbox's plain board: under a roof I'm not under, a duck is hidden by it, head and all: row 161, a house)
      const rf = sbRoofed(s, id, pos);
      if (d._rf !== rf) {
        d._rf = rf;
        d.classList.toggle("hang-hid", rf);
      }
    }
    if (hang) {
      // Hangout: in front of what it stands in front of; unseen through the cabin's walls; lying dead, under every duck
      const zi = deadPose ? world.bodyKey(id, pos) : world.key(id, pos),
        hid = world.hidden(id, pos);
      if (!off && d._zi !== zi) {
        d._zi = zi;
        d.style.zIndex = zi;
      }
      if (d._hid !== hid) {
        d._hid = hid;
        d.classList.toggle("hang-hid", hid);
      }
      if (d._off !== off) {
        d._off = off;
        d.classList.toggle("off-cam", off);
      }
    }
    if (d._sz !== size) {
      d._sz = size;
      d.style.setProperty("--sz", size + "px");
    }
    if (!off && d._lift !== lift) {
      d._lift = lift;
      d._liftEl.style.transform = lift;
    }
    if (!off && d._sh !== sh) {
      d._sh = sh;
      d._shadowEl.style.transform = `translateX(-50%) scale(${sh})`;
    }
    if (d._body !== body) {
      d._body = body;
      d._bodyEl.style.transform = body;
    }
    let pic = d._pic;
    if (!pic || !d._bodyEl.contains(pic))
      pic = d._pic = d._bodyEl.querySelector("svg.duck, img.px"); // (found again only if its body was redrawn elsewhere)
    if (pic && pic._sq !== squish + org) {
      pic._sq = squish + org;
      pic.style.transformOrigin = org;
      pic.style.transform = squish;
    }
    /* the outlines (outlines.js; every zombie game and Hangout's world), seen through a wall, under a roof and a floor
       away: my own duck a darker blue that only I see, every other player green, Justin yellow (Good Justin God in Mad
       God Justin, never Mad God Justin himself; the helper and Downpour's Justin in Dead Ducks Arcade): the owner's,
       Nov 17 20:10Z */
    const olId = g ? id.slice(0, -BODY.length) : id, // (a Duck Cabin ghost's body is its player's, outlined as that player)
      olP = s.players[olId],
      olMine = olId === R.me,
      olZone =
        sbOl && olP && pos
          ? sbOlColor(
              s,
              { duck: olP.name || "" },
              pos.x,
              pos.y,
              zOf(pos),
              hang ? HW : 1,
              hang ? HH : 1,
            )
          : "", // (Sandbox: standing where a zone's Outlines take it, that row's color)
      olKind = olZone
        ? olZone
        : !ol || sbOnBoard(s)
          ? ""
          : isMgj(s)
            ? id === GOOD_ID
              ? "justin"
              : olP && id !== JUSTIN_ID
                ? olMine
                  ? "me"
                  : "ally"
                : ""
            : olP
              ? olP.helper || olP.wild
                ? dead
                  ? "" // (dead, no outline round him: the owner's, Nov 19 19:27Z "when he dies, there's no outline around his character")
                  : "justin" // (Dead Ducks Arcade's Justins: the helper from the fireplace, and Downpour's, out there)
                : olMine
                  ? "me"
                  : "ally"
              : "";
    /* a duck lying dead: where the middle of its body is on the board, as css lays it down (.gduck-body: rotate(-100deg)
       translateY(-12%) round the bottom middle of its body; DOWN_TURN). Its outline's arrow goes in it, what hides it is
       looked for there, and its pool of blood spreads under it (a duck lies a little to the side of where it stood: the
       owner's, Nov 18 10:38Z, "outlines do not show for dead ducks, such as justin", where his arrow sat outside him and
       what hides a standing duck hid him) */
    const ph =
        pic && pic.naturalWidth
          ? (size * pic.naturalHeight) / pic.naturalWidth
          : size,
      b = at.top - z, // (its feet: the body sits on the bottom of its lift)
      lie = ph / 2 - 1.12 * (ph - size * 0.08), // (its picture's middle over its feet, before it's turned)
      mid = deadPose
        ? [
            at.left - fx * Math.sin(DOWN_TURN) * lie,
            b + Math.cos(DOWN_TURN) * lie,
          ]
        : [at.left, b - ph / 2];
    let olOnly = false; // (something hides it from me: its outline only, never its picture; the owner's, Nov 17 17:41Z)
    if (olKind && pic && pic.tagName === "IMG" && !d._off) {
      const x = (pixelOn() ? snap(at.left) : at.left) - size / 2,
        y = b - ph + size * 0.08; // (the picture hangs 8% under the body, css/app.css .gduck-body img.px)
      let hidden = false,
        floor = 0;
      if (hang) {
        const a = olMe !== null ? world.at(id) : null,
          az = a && (pos.j && pos.b !== undefined ? pos.b : a.z);
        hidden =
          !!d._hid ||
          (!mine && !!a && olRoofed(a.x, a.y, az, olAt)) || // (under a roof I'm not under: hidden by it, outlines.js)
          (deadPose
            ? world.coverAt(
                mid[0] - size * 0.45,
                mid[0] + size * 0.45,
                mid[1] - size * 0.35,
                mid[1] + size * 0.35,
                d._zi,
              ) // (lying down: where it lies)
            : world.coverAt(
                at.left - size * 0.4,
                at.left + size * 0.4,
                b - size * 0.9,
                b,
                d._zi, // (its z-index: only what is really drawn over it hides it, world.js)
              ));
        if (a) floor = Math.sign(olFloor(a.x, a.y, az) - olMe);
      }
      olAdd({
        id,
        img: pic,
        x,
        y,
        w: size,
        h: ph,
        flip: fx < 0,
        kind: olKind,
        hidden,
        floor,
        hp: hv ? hv[0] : d._hp >= 0 ? d._hp : undefined,
        down: deadPose ? [b, ph - size * 0.08] : null, // (out of HP, lying down: its outline lies down too)
        mid: deadPose ? mid : null, // (lying down: the arrow inside its body)
      });
      olOnly = hidden && !d._hid && id !== R.me;
    }
    if (d._olOnly !== olOnly) {
      d._olOnly = olOnly;
      d.classList.toggle("ol-only", olOnly);
    }
    /* every duck that dies, in every mode, bleeds a pool under it (bloodpool.js); none with Gore off. Downpour's
       Justin keeps his own (l4dd.js seePool) */
    poolUnder(
      d,
      dead && !noGoreOf(s) && !(isL4dd(s) && isWild(s, olId)),
      now,
      size,
      mid[0] - at.left + size / 2,
      size * 0.06 - z,
    ); // (where its body lies: on the podium, on it)
    if (d._j !== pos.j) {
      d._j = pos.j;
      if (pos.j && pic && pic.classList.contains("jack")) {
        pic.classList.remove("bob");
        pic.getBoundingClientRect();
        pic.classList.add("bob");
      }
    } // Jack in a Box bobs on his spring as he jumps
    flag(d, "sprint", !!(mine ? sprinting && moving : pos.sp));
    flag(d, "adren", !!adren(s, id, now)); // (an adrenaline shot: it jitters, css/app.css)
    flag(
      d,
      "dodge",
      !!(isL4dd(s) ? dodging(s, pos, now) : jumpDodges(pos, now)),
    ); // (see-through while a jump makes it safe: Dead Ducks Arcade's, in every mode now, the owner's, Nov 18 16:50Z)
    flag(d, "air", z > 1 && !seated(s, id)); // (sitting on a chair isn't flying)
    flag(d, "left", d._face < 0);
    const dn0 = !s.done[id];
    if (d._doneH !== dn0) {
      d._doneH = dn0;
      d.querySelector(".gduck-done").hidden = dn0;
    } // (set only when it changes: set again every frame, the page restyled every duck every frame)
    flag(d, "idle", !!p.idle); // gone quiet: Zs float up
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
    if (id === R.me && invOn(s, id)) see = true; // (Sandbox's Invisible switch: I see myself see-through, nobody else sees me: sbgodview.js)
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
      mine && hand.held === "none" && isMgj(s)
        ? null // (Mad God Justin: an empty slot picked, nothing in hand)
        : (id === JUSTIN_ID || id === JUSTIN2) && isMgj(s)
          ? !mgjGone(s, now) &&
            (shows[id] && now < shows[id].until ? shows[id].what : pos.w)
          : (isMgj(s) && s.phase === "boss"
              ? (mgjOut(s, id) && (s.players[id] || {}).dead
                  ? "handgun" // (out of HP: the down pistol, the owner's, Nov 17 11:07Z)
                  : mine
                    ? hand.held
                    : pos.w) || MGJ_MELEE
              : isL4dd(s)
                ? downArmed(s, id)
                  ? "handgun" // (down: the down pistol, the owner's, Nov 17 11:07Z)
                  : l4Hp(s, id) > 0 &&
                    !l4Swims(s, id) && // (Downpour: swimming, it's put away)
                    inHand(mine ? heldNow() : pos.w, s, id)
                : mine
                  ? hand.held && hasKey(p.duck, hand.held) && hand.held
                  : pos.w) || shown; // (Quacky Zombies: in hand while it's up) // (Mad God Justin: every duck's knife always out; his hammer swing over his gun)   // (Mad God Justin: every duck's knife always out)   // (a dagger thrown without keeping it out: only the one in the air)
    if (w) arms.push([id, w, pos, p.duck, mine]);
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
    const spawning = id === JUSTIN_ID && isMgj(s) && mgjSpawning(s, now);
    if (d._spawn !== spawning) {
      d._spawn = spawning;
      d.classList.toggle("mgj-spawn", spawning);
      if (spawning)
        d.style.setProperty("--sp", `-${now - (s.mgj.spawn - SPAWN_MS)}ms`);
    } // Mad God Justin: fading in with a red glow for his first 3 s
    const gone = id === JUSTIN_ID && !spawning && mgjGone(s, now);
    if (d._gone !== gone) {
      d._gone = gone;
      d.classList.toggle("mgj-gone", gone);
    } // Mad God Justin: faded away for the meteor
    if (id === GOOD_ID && !d._gj) {
      d._gj = true;
      d.classList.add("mgj-good");
    } // (Good Justin God fades in)
    const prot = !!(s.prot && s.prot[id] > now && normalGame(s));
    if (d._prot !== prot) {
      d._prot = prot;
      d.classList.toggle("prot", prot);
      if (prot)
        d.style.setProperty("--pd", `-${now - (s.prot[id] - PROT_MS)}ms`);
    } // the normal games: a duck that just came back blinks and fades in for its 2.5 s of spawn protection
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
    /* Mad God Justin: nothing can hurt it for a second after a hit, and it flickers meanwhile; a burn: one big
       flame over the duck, then charred, then the burn fades (the rules keep s.mgj.burn and burnt) */
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
      if (bn === 2)
        sfx.burn(Math.max(0.3, (s.mgj.burn[id] - now) / 1000), heard(id));
      if (bn === 3) sfx.burn(BURN.P / 1000, heard(id));
      if (bn === 3 && id === R.me) crimson(BURN.P); // (my duck on fire: my screen blinks crimson while it shakes)
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
    let say = bubbles[id];
    /* an NPC that goes down or dies stops talking at once: a line it started before is cut (one said as it fell, a death
       line, still shows). npcshared.js */
    if (isNpc(s, id) && npcDown(s, id)) {
      if (!npcDownAt[id]) npcDownAt[id] = now;
      if (say && (say.at || 0) < npcDownAt[id] - 150) {
        delete bubbles[id];
        say = null;
      }
    } else if (npcDownAt[id]) delete npcDownAt[id];
    const saying = !!say && now < say.until; // their newest chat message, for a few seconds
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
  allBoxes = boxes;
  layer.querySelectorAll(".gduck").forEach((d) => {
    if (duckEls.has(d.dataset.pid) && duckEls.get(d.dataset.pid) !== d) {
      d.remove(); // (a second one for the same duck, left behind: only the one it's drawn on stays)
      return;
    }
    if (
      !s.pos[d.dataset.pid] &&
      !(jp && d.dataset.pid === JUSTIN_ID) &&
      !(jp2 && d.dataset.pid === JUSTIN2) &&
      !bodyOf(d.dataset.pid)
    ) {
      d.remove();
      duckEls.delete(d.dataset.pid);
    }
  });
  /* the handgun's bullets and the thrown daggers, flying the way they were aimed */
  const fxl = $(".fxl", board),
    live = new Set();
  /* the pixel effects (fx.js): a shot new this frame flashes and smokes at its barrel (after the weapons are placed,
     below); one gone since last frame hit something there (its blood: fxHitAt) */
  const shotNow = new Set(),
    fired = [];
  for (const sh of s.shots || []) {
    if (!sh.k || now < sh.t) continue; // (a burst's round not out yet)
    shotNow.add(sh.n);
    if (!SHOT_SEEN.has(sh.n)) {
      SHOT_SEEN.set(sh.n, {
        k: sh.k,
        x: NaN,
        y: NaN,
        vx: sh.vx,
        vy: sh.vy,
        skip: new Set(), // (where it stops on my screen: shotStop, mgjStop)
        n: 0,
        p: null,
        stop: null,
      });
      if (now - sh.t < 400) fired.push(sh);
    }
  }
  for (const [n, o] of SHOT_SEEN)
    if (!shotNow.has(n)) {
      SHOT_SEEN.delete(n);
      if (o.x === o.x && !o.fired) fxImpact(o.x, o.y, o.k, o.vx, o.vy);
    }
  for (const sh of s.shots || []) {
    if (!sh.k || now < sh.t) continue;
    const at = shotAt(sh, now - sh.t),
      a = hang
        ? world.place(at, sh.hz)
        : place({ x: at.x, y: at.y }, 0, 1, true), // (free: past the board's left edge it flies on, never back to where ducks start)
      top = a.top - at.z * size; // (Hangout: at the height it was fired from)
    if (stopped(s, sh, at, hang, now)) continue; // (it got to what stops it: gone from my screen there)
    /* on the other side of the walls: looked for at its shooter's feet (at.z is its arc in duck sizes; taken for a
       height, every shot over a roof was hidden from a duck up on that roof) */
    if (hang && world.hidden("", { x: at.x, y: at.y, z: sh.hz })) continue;
    if (
      hang
        ? a.left < -size * 2 ||
          a.left > geo.W + size * 2 ||
          top < -size * 2 ||
          top > geo.H + size * 2
        : a.left < -geo.W * 0.4 ||
          a.left > geo.W * 1.4 ||
          top > geo.top0 + geo.H + size * 6 ||
          top < -geo.H
    ) {
      const o = SHOT_SEEN.get(sh.n);
      if (o) o.x = NaN; // (no puff where it went out of sight: it hits something I can't see)
      continue;
    } // (off the screen: in Hangout and Dead Ducks Arcade, two ducks past my screen's edge, the owner's Nov 18 14:20Z "one or two duck lengths")
    live.add(sh.n);
    const seen = SHOT_SEEN.get(sh.n);
    if (seen) {
      if (seen.x === seen.x && (a.left !== seen.x || a.top !== seen.y)) {
        seen.vx = a.left - seen.x;
        seen.vy = a.top - seen.y;
      } // (the way it flies on the screen)
      seen.x = a.left;
      seen.y = a.top;
    } // (where it was last seen: where it hit, once it's gone)
    let b = SHOT_EL.get(sh.n);
    if (b && b.parentNode !== fxl) b = null; // (the board was built again)
    if (!b) {
      const duck = (
          s.players[sh.by] || (sh.by === JUSTIN_ID ? JUSTIN_PLAYER : {})
        ).duck,
        [vx, vy] = toScreen(sh.vx, sh.vy),
        ang = `--ang:${Math.atan2(vy, vx).toFixed(3)}rad`,
        sz = `--s:${(size * (sh.sc || 1)).toFixed(0)}px`, // (thrown by a bigger or smaller duck: as big as it was in that duck's hand, rules.js sizeShots)
        spin = vx < 0 ? "ccw" : "";
      /* [its class, its look, its style]: elements with the same class and look are handed out again (shotPool) */
      const [cls, inner, style] =
        sh.k === "arrow"
          ? [`bullet k-${sh.k}`, ARROW, `${sz};${ang}`] // (the bow's arrow: pointing the way it flies)
          : sh.k === "controller" || sh.k === "chair"
            ? [
                `thrown mgj-throw k-${sh.k}`,
                `<i class="${spin}">${sh.k === "chair" ? (isL4dd(s) ? GOLD_CHAIR : CHAIR) : CONTROLLER}</i>`, // (Quacky Zombies' chair is golden)
                sz,
              ]
            : sh.k === "dagger" || sh.k === "grenade" || sh.k === "lgren"
              ? [
                  `thrown${sh.k !== "dagger" ? " grenade" : ""}`,
                  `<i class="${spin}">${sh.k !== "dagger" ? GRENADE(colorsOf(duck, "grenade"), false) : daggerHTML(duck)}</i>`,
                  sz,
                ] // (the grenade launcher's fly as the thrown ones, straight)
              : ROUNDS_ART[sh.k]
                ? [
                    `bullet round k-${sh.k}`,
                    ROUNDS_ART[sh.k].svg,
                    `${ang};--w:${ROUNDS_ART[sh.k].w}px`,
                  ] // (Quacky Zombies' new guns: each its own bullet)
                : [
                    `bullet${sh.k === "pellet" ? " pellet" : ""}`,
                    BULLET(colorsOf(duck, "handgun")[2]),
                    ang,
                  ];
      b = shotPool(cls, inner);
      b.setAttribute("style", style);
      b.dataset.n = sh.n;
      b._blk = 0;
      b.classList.remove("blk");
      SHOT_EL.set(sh.n, b);
      fxl.append(b);
      if (sh.k === "grenade" && now - sh.t < 400) {
        const pin = el(
          `<div class="gpin" style="--s:${(size * (sh.sc || 1)).toFixed(0)}px;transform:translate(${a.left.toFixed(1)}px, ${top.toFixed(1)}px)"><i class="${vx < 0 ? "ccw" : ""}">${GRENADE_PIN(colorsOf(duck, "grenade"))}</i></div>`,
        );
        fxl.append(pin);
        setTimeout(() => pin.remove(), 1300);
      } // (its pin stays behind: it drops from the hand and fades)
    }
    b.style.transform = `translate(${a.left.toFixed(1)}px, ${top.toFixed(1)}px)`;
    if (sh.blk && b._blk !== sh.blk) {
      b._blk = sh.blk;
      b.classList.remove("blk");
      void b.offsetWidth;
      b.classList.add("blk");
    } // (a bullet stopped on his chair or controller: it blinks a see-through white, the owner's, Nov 17 13:07Z)
  }
  for (const [n, b] of SHOT_EL)
    if (!live.has(n)) {
      SHOT_EL.delete(n);
      shotDone(b);
    } // (landed, gone, or off the screen: kept for the next shot that looks the same)
  /* the handgun or the dagger in hand, turned toward where it aims: my mouse, or the aim the others sent */
  if (hang) warmHands(s, size);
  const handed = new Set(),
    heldEls = fxl._held || (fxl._held = new Map()),
    lowLayer = hang && ducksLayer(board);
  for (const [id, w, pos, duck, mine] of arms) {
    const c = bodyAt(id, pos, now),
      sh = shows[id] && now < shows[id].until ? shows[id] : null;
    let dir = null;
    if (mine && keyAim) dir = keyAim;
    else if (mine && phoneAim() && walkScr)
      dir = walkScr; // (a phone: the gun points the way I walk, as its laser and flashlight do)
    else if (mine && mouse)
      dir = [mouse.x - geo.left - c.left, mouse.y - geo.top - c.top];
    // (the board's place from its last measuring: no layout read in the frame)
    else if (sh && (!pos.w || mine)) dir = toScreen(sh.ax, sh.ay);
    else if (pos.ax !== undefined) dir = toScreen(pos.ax, pos.ay);
    const dk = duckEl(id),
      ang =
        dir && Math.hypot(dir[0], dir[1]) > 1
          ? Math.atan2(dir[1], dir[0])
          : dk && dk._face < 0
            ? Math.PI
            : 0;
    handed.add(id);
    let h = heldEls.get(id);
    if (h && !heldOn(h, fxl)) h = null;
    const holy = isL4dd(s) && angelOf(s, id, w), // (Dead Ducks Arcade's Angelic weapons: l4ddangel.js)
      lz = w === "laser" && (isL4dd(s) || isMgj(s)) ? laserLook(s, id) : null, // (the Laser Rifle: its barrel as hot as it is now, laserfx.js)
      hk =
        w +
        (w === "hammer" && duck && duck.wrench ? "-w" : "") +
        (holy ? "-a" : "") +
        (lz ? lz.key : ""), // (the hammer, or the wrench in its place)
      ds = size * bigOf(s, id), // (a bigger Justin holds it farther out)
      hs = ds * (w === "hammer" && isJustin(id) ? MGJ_HAMMER : 1); // (Justin's hammer is bigger)
    if (!h || h._k !== hk || h._hs !== hs) {
      if (h) h.remove();
      const dual = holy && w === "handgun", // (the Angelic pistol: two of them)
        art = lz
          ? laserArt(lz)
          : w === "chair" && isL4dd(s)
            ? GOLD_CHAIR // (Quacky Zombies' chair, the fireplace's 1 in 100: golden)
            : holy
              ? heldHTML(w, duck) // (Angelic: its glow is drawn into the drawing, angelic())
              : heldPicHTML(w, duck, hs),
        pic = dual ? angelic(dualPistolHTML(duck)) : holy ? angelic(art) : art;
      /* every gun as long in the hand as its gunart.js w (--gw, css .held i): one number for each, so no new gun is
         left at a knife's size. The Laser Rifle getting hot: the whole gun glows (laserfx.js laserGlow) */
      const [gc, gs] = lz ? laserGlow(lz) : ["", ""];
      h = el(
        heldBoxHTML(w, duck, hs, {
          cls: `${holy ? " angelic" : ""}${dual ? " dual" : ""}${gc}`,
          attrs: ` data-pid="${esc(id)}"`,
          style: gs,
          art: pic,
        }),
      );
      h._k = hk;
      h._hs = hs;
      h._fxl = fxl; // (its board's: where it is drawn, fxl or the ducks' layer, below)
      fxl.append(h);
      heldEls.set(id, h);
      if (holy) angelGlow(h); // (its glow as thin as every other Angelic weapon's: powerart.js)
    }
    /* a gun being reloaded dips and bobs in its duck's hands (Dead Ducks Arcade: its reload runs in its kit; Justin out
       in Downpour too) */
    const rk = isL4dd(s) && kitOf(s, id),
      reloading = !!(rk && rk.rl > now && rk.rw === w);
    if (h._rl !== reloading) {
      h._rl = reloading;
      h.classList.toggle("reload", reloading);
    }
    /* the knife jabs out and back; the hammer rests over the shoulder, then swings from behind the head down through the
       aim. Turned toward the aim, its offsets mirror for a duck facing left, so the swing always goes over the top */
    const left = Math.cos(ang) < 0,
      st = sh && sh.t !== undefined ? Math.min(1, (now - sh.t) / 1000) : 1;
    let out = 0.42,
      turn = 0;
    const jab = ARM_SWING.knife / 1000; // (the knife swings as fast in every mode as in Quacky Zombies)
    if (w === "knife")
      out = 0.44 + (st < jab ? 0.26 * Math.sin((Math.PI * st) / jab) : 0);
    if (SWUNG[w]) {
      const [k, o] = SWUNG[w],
        u = st / k; // (the hammer's swing, sooner for a faster one)
      out = o;
      turn =
        u < 0.04
          ? -70 - (45 * u) / 0.04
          : u < 0.11
            ? -115 + 165 * ((u - 0.04) / 0.07) ** 1.6
            : u < 0.5
              ? 50
              : 50 - 120 * Math.min(1, (u - 0.5) / 0.3);
    }
    /* the owner's motion (fxmotion.js): it sways as its duck walks and jumps, kicks back with each shot, jitters on
       adrenaline */
    const zl = liftOf(id, pos),
      [sw, sx, sy] = sway(
        id,
        c.left,
        c.top + zl,
        zl,
        now,
        mine ? sprinting && moving : !!pos.sp,
        size,
        ang,
        left,
      ),
      [kr, kb] = kickOf(id, now, ds, left),
      [jr, jx, jy] = jitter(adren(s, id, now), ds);
    const rot = ang + ((left ? -1 : 1) * turn * Math.PI) / 180 + sw + kr + jr,
      hx = c.left + sx + jx,
      hy = c.top + sy + jy,
      reach = (w === "hammer" ? hs : ds) * out - kb;
    const turnTr = `rotate(${rot.toFixed(3)}rad) translateX(${reach.toFixed(1)}px) scaleY(${left ? -1 : 1})`;
    /* where its end is on the board: a shot's flash and smoke come out of there (fx.js), and the laser sight */
    const gl = ds * ((GUNS[w] && GUNS[w].w) || 0.5);
    h._end = [
      hx + Math.cos(rot) * (reach + gl * 0.5),
      hy + Math.sin(rot) * (reach + gl * 0.5),
      rot,
    ];
    h._aim = [c.left, c.top, ang]; // (where it aims from, and which way: Mad God Justin's laser sight)
    if (h.classList.contains("dual")) {
      /* the Angelic pistols: each one's muzzle on the board, for its own laser sight and its own flash (specials.js
         DUAL; the picture's middle is the drawing's middle) */
      const k = (ds * DUAL.w) / DUAL.box[0],
        at = ([px, py]) => {
          const a = reach + (px - DUAL.box[0] / 2) * k,
            b = (py - DUAL.box[1] / 2) * k * (left ? -1 : 1);
          return [
            hx + Math.cos(rot) * a - Math.sin(rot) * b,
            hy + Math.sin(rot) * a + Math.cos(rot) * b,
            rot,
          ];
        };
      h._ends = [at(DUAL.near), at(DUAL.far)];
    } else h._ends = null;
    if (TIPS[w]) {
      // where its barrel ends on the board, so its lines come out of there and nowhere else (the l4line fx)
      const [tip, box] = TIPS[w],
        wd = ds * GUNS[w].w,
        along = ds * out + wd * (tip[0] / box[0] - 0.5),
        down =
          ((wd * box[1]) / box[0]) * (tip[1] / box[1] - 0.5) * (left ? -1 : 1);
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
    /* the owner's, Nov 19 19:27Z, Downpour's pump roof: "the gun should be consistent with it". Under a roof, a wall or
       a crown drawn over its duck (even over a corner of where it reaches), the weapon is drawn in the world with its
       duck, at its duck's depth, so what covers the duck covers it alike: seen through the see-through roof with the
       duck, hidden under the roof with it. Its duck's picture not shown (inside where I can't see, or only its outline
       under a roof I'm not under): the weapon isn't either. Out in the open it stays in fxl, over the dark, as before */
    const reachOut = ds * 1.6,
      low =
        lowLayer &&
        dk &&
        dk._zi !== undefined &&
        world.under(
          c.left - reachOut,
          c.left + reachOut,
          c.top - ds,
          c.top + ds * 0.7,
          dk._zi,
        ),
      home = low ? lowLayer : fxl,
      zi = low ? String(dk._zi) : "",
      gone = !!(hang && dk && (dk._hid || dk._olOnly));
    if (h.parentNode !== home) home.append(h);
    if (h.style.zIndex !== zi) h.style.zIndex = zi;
    /* in the world's box with its duck, it's put where the box shows that place (world.js shift) */
    const [bx, by] = low ? world.shift() : [0, 0],
      tr = `translate(${(hx - bx).toFixed(1)}px, ${(hy - by).toFixed(1)}px) ${turnTr}`;
    if (h._tr !== tr) {
      h._tr = tr;
      h.style.transform = tr;
    }
    if (h._gone !== gone) {
      h._gone = gone; // (its barrel's glow and the Laser Rifle's steam go with it: barrelheat.js, laserfx.js)
      h.style.visibility = gone ? "hidden" : "";
    }
  }
  for (const [id, h] of heldEls)
    if (!handed.has(id)) {
      h.remove();
      heldEls.delete(id);
    }
  document.documentElement.classList.toggle(
    "armed",
    arms.some((a) => a[4]),
  ); // (a weapon in my hand: the mouse is a crosshair over the board, owner Nov 16, css/app.css)
  /* the shots fired since last frame: a flash and smoke at the barrel's end, its kick, my screen's shake (fx.js,
     fxmotion.js); a shotgun's pellets are one shot */
  const went = new Set(),
    heldAll = fxl._held || new Map();
  for (const sh of fired) {
    const gun = sh.k === "pellet" ? "shotgun" : sh.k;
    if (!MUZZLE[gun] || went.has(sh.by + "/" + sh.t)) continue;
    went.add(sh.by + "/" + sh.t);
    const hd = heldAll.get(sh.by),
      e =
        hd &&
        heldOn(hd, fxl) &&
        (hd._ends
          ? hd._ends[
              sh.al !== undefined ? +sh.al : (hd._alt = (hd._alt || 0) ^ 1)
            ]
          : hd._end); // (the Angelic pistols take turns: the rules say which one fired, sh.al)
    if (e) fxMuzzle(e[0], e[1], e[2], gun);
    else {
      const a0 = hang
        ? world.place(shotAt(sh, 0), sh.hz)
        : place(shotAt(sh, 0), 0, 1);
      fxMuzzle(a0.left, a0.top - size * 0.45, Math.atan2(sh.vy, sh.vx), gun);
    }
    kick(sh.by, gun, now);
    heatUp(sh.by, gun); // (the LMG's barrel heats up as it keeps firing: barrelheat.js)
    if (sh.by === R.me) shake(MUZZLE[gun].shake);
    vibrate(shooterBody(sh.by), VIB[gun]); // (the firing duck's drawing, in rhythm with the fire rate)
  }
  /* Dead Ducks Arcade: the laser sights, out of each gun to the end of its flashlight (l4dd.js), never the bow's. I only
     see my own laser sight, never another duck's or Justin's (the owner's, Nov 16) */
  const lz = [];
  if (isL4dd(s) && sightOn())
    for (const [id, w] of arms) {
      if (id !== R.me || !MUZZLE[w]) continue;
      const hd = heldAll.get(id),
        e = hd && heldOn(hd, fxl) && hd._end,
        end = e && laserEnd(id);
      if (end)
        for (const m of hd._ends || [e]) lz.push([m[0], m[1], end[0], end[1]]); // (the Angelic pistols: two sights, meeting where it aims, the owner's Nov 17)
    }
  /* Mad God Justin: the same laser sights (the owner's, Nov 16), with no flashlight to end in: on through where it aims
     (my mouse) to the board's edge */
  if (
    ((isMgj(s) && s.phase === "boss") || !(isMgj(s) || isL4dd(s))) &&
    sightOn()
  )
    for (const [id, w] of arms) {
      if (id !== R.me || !MUZZLE[w]) continue;
      const hd = heldAll.get(id),
        e = hd && heldOn(hd, fxl) && hd._end,
        A = hd && hd._aim;
      if (!e || !A) continue;
      const ux = Math.cos(A[2]),
        uy = Math.sin(A[2]),
        t = Math.min(
          ux > 0 ? (geo.W - A[0]) / ux : ux < 0 ? -A[0] / ux : Infinity,
          uy > 0 ? (geo.H - A[1]) / uy : uy < 0 ? -A[1] / uy : Infinity,
        );
      if (t > 0 && t < Infinity)
        lz.push([e[0], e[1], A[0] + ux * t, A[1] + uy * t]);
    }
  if (isL4dd(s)) lz.push(...gunLasers()); // (Survival's soldiers: gunmenview.js)
  fxLasers(lz);
  heatDraw(heldAll, fxl, size);
  if (isL4dd(s) || isMgj(s)) laserFrame(s, heldAll, fxl, size, heard); // (the Laser Rifle's steam and fire: laserfx.js)
  olDraw(ol ? (hang ? board : fxl) : null, geo.W, geo.H); // (the outlines: over the dark and the rain in Dead Ducks Arcade, over the board in Mad God Justin)
  if (isMgj(s)) {
    const tag = S.querySelector(".gduck.mine .gduck-name");
    if (tag) laserMeter(tag, s, R.me, hand.held); // (and its heat under my duck, as in Dead Ducks Arcade)
  }
  if (!isL4dd(s)) handBars(s); // (the white and yellow bars under my duck: meters.js)
  flames(s, now, hang, size, fxl, heldAll);
  /* ducklings: three in a row behind their duck, along the way it walked */
  const kids = new Set();
  for (const [id, pos, at, duck] of brood) {
    const d = duckEl(id),
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
    mark.classList.toggle("sprint", !!target.sprint && !isMgj(s)); // (Mad God Justin: no sprint, so no sprint mark)
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
    const hd = duckEl(h.id),
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
    const dk = duckEl(f.id),
      turn = (turned() ? 1 : dk && dk._face ? dk._face : f.face) * f.face;
    const tr = `translate(${at.left.toFixed(1)}px, ${(at.top - z).toFixed(1)}px) scaleX(${turn})`;
    if (f.el._tr !== tr) {
      f.el._tr = tr;
      f.el.style.transform = tr;
    }
  }
  drawFx(board, fxl, hang, size, s, now);
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
          : isTv(s)
            ? tvRowAt(s, me)
            : colAt(s, me.x)
      : -1;
  board
    .querySelectorAll(
      isVd(s) ? ".vd-tile" : isTv(s) ? ".tv-row" : ".col, .wq-tile",
    )
    .forEach((c) => c.classList.toggle("here", +c.dataset.c === myCol));
  const vb = S.querySelector(".vote-btn");
  if (vb && vb.dataset.col !== String(myCol)) {
    vb.dataset.col = myCol;
    if (isLaw(s) || isDn(s) || isVd(s) || isTv(s))
      setHTML($(".gact", S), actHTML(s));
  } // (Lawyering, Duncelation: Vote, Voted or Change vote; Valentine's Duck Date: whom Turn down turns down; Trivia: the row's Vote, Correct and Wrong)
  placeRing(board);
  placePodium(board, now);
  placeTable(board);
  placeTiles(board);
  placePick(board, s);
  placeZombies(board, s, now);
  if (geo) sbBoardMarks(board, s, (o) => place(o, 0, 1), geo.size); // (Sandbox: its spawns and respawns on the board)
  if (sbOnBoard(s)) sbHear(s, false); // (… and its sounds there: sbsfx.js)
  mgjSteps(s); // (the wave zombies' steps and groans: l4ddsfx.js)
  placeDesk(board, s, now);
  placeCake(board, s, now);
  placeRevive(board, s, now);
  placeSnack(board, s, now);
  placeEdge(board, s, now);
  placeTells(board, s, now);
  /* the Round Lord and the question turn see-through over ducks; their boxes are measured a few times a second, not
     every frame (a measure after this frame's writes made the page lay itself out again, every frame) */
  if (!overBoxes || overBoxes.g !== geo || now - overBoxes.at > 400) {
    overBoxes = { g: geo, at: now, list: [] };
    for (const o of board.querySelectorAll(
      ".topover .lord, .topover .question, .topover .wq-sidecol",
    )) {
      const r = o.getBoundingClientRect();
      overBoxes.list.push([
        o,
        r.left - geo.left,
        r.top - geo.top,
        r.width,
        r.height,
      ]);
    }
  }
  for (const [o, L, T, w, h] of overBoxes.list) {
    const hit = boxes.some(
      (b) => b.r > L && b.l < L + w && b.b > T && b.t < T + h,
    );
    o.classList.toggle("see-through", hit);
  }
}
/* the swung melees: [how long their swing takes against the hammer's, how far out they're held]: the fire axe 25%
   faster than the hammer, the short sword 50% faster than the knife, the pan as slow as the axe; the sword and the pan
   not as far out (the owner's, Nov 16) */
const SWUNG = {
  hammer: [1, 0.55],
  axe: [ARM_SWING.axe / ARM_SWING.hammer, 0.55],
  sword: [ARM_SWING.sword / ARM_SWING.hammer, 0.46],
  pan: [ARM_SWING.pan / ARM_SWING.hammer, 0.46],
};
/* the guns whose shots are lines out of their barrel's end (the l4line fx): where that end is in their drawing, and the
   drawing's size (viewBox): the chain gun's and the Laser Rifle's */
const TIPS = {
  chaingun: [TRACE.tip, TRACE.box],
  laser: [LASER.tip, [80, 28]],
};
/* the pixel effects: their canvas over the board, where the world is (the camera), this frame (fx.js) */
function drawFx(board, fxl, hang, size, s, now) {
  const pt = performance.now();
  fxLimits(noGoreOf(s) ? 1 : 0, s.options.noFx);
  fxMount(hang ? board : fxl, geo.W, geo.H, size); // (Hangout and Dead Ducks Arcade: under the dark, css/app.css)
  if (hang) {
    const o = world.place({ x: 0, y: 0 }, 0);
    fxOrigin(o.left, o.top);
  } else fxOrigin(0, 0);
  fxFrame(pt);
  /* my screen shakes as I fire (fxmotion.js); sprinting blurs the map a little (css/app.css: fades in and out, never
     stacks); my adrenaline shot taken: a fast wobble, then a small steady shake and the blurred border while it lasts */
  shakeBoard(board, pt);
  const ad = adren(s, R.me, now);
  adrenFx(ad, pt);
  sprintBlur(s, pt, !!(me && ((sprinting && moving) || ad) && onBoardPhase())); // (sprintblur.js)
}
/* Dead Ducks Arcade: duck id on an adrenaline shot (or the Speed Boost drop) now */
const adren = (s, id, now) =>
  isL4dd(s) && !!s.hang && ((s.hang.l4ad || {})[id] || 0) > now;
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
    : 0;
export const podLift = (s, id, now) =>
  isDefender(s, id) ? podUp(s, now) * POD_H : 0;
function placePodium(board, now) {
  const pod = board.querySelector(".dn-podium");
  if (!pod || !geo) return;
  const s = R.state,
    c = place({ x: 0.5, y: 0.5 }, 0, 1),
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

/* ---------- pools (owner 2026-11-15: "I agree with reusing objects") ----------
   The bullets in the air and the blood bursts are made and thrown away many times a second. Done with, they're kept
   (out of the page) and handed out again for the next one that looks the same, instead of building new elements every
   time: fewer small freezes while the browser cleans up. Put back in the page, an element's CSS animation starts over
   by itself. */
const SHOT_EL = new Map(); // a shot's number → its element
/* a shot that stops where it hits ends there on my screen, never drawn past it (the owner's, Nov 17 20:37Z: "BULLETS
   THAT DO NOT PASS THROUGH ZOMBIES WILL NO LONGER PASS THRU ZOMBIES, BECAUSE IN GAME THEY ARE STILL PASSING THROUGH
   ZOMBIES IN A GLITCHY WEIRD WAY. LIKE IF U SHOOT A PISTOL THE BULLET KIND IS SEEN GOING PAST THEM A BIT"). The host
   finds the hit at its next beat and my screen hears of it later, so the shot I draw at where it is now flew on past
   what it hit until then. Now, each frame, from where I last drew it to where it is now, I look for what stops it as I
   draw things (Dead Ducks Arcade: a wall or a zombie, l4dd.js shotStop; Mad God Justin: his chair or a controller, a
   wave zombie, him, mgjrules.js mgjStop), every gun and thrown thing but the grenade (which lands) and the chain gun's
   and Laser Rifle's lines; the sniper's goes through as many as it does there. It ends at that spot, its hit shown
   there at once (fx.js fxImpact). If the host then says it went on (a miss, a crit's slug, the sniper's: sh.ms, sh.hit,
   sh.zp, sh.zh), or still has it once it should long have heard (STOP_WAIT), it flies on from there. True: it's
   stopped, don't draw it */
const STOP_WAIT = 700;
function stopped(s, sh, at, hang, now) {
  const r = SHOT_SEEN.get(sh.n),
    mgj = isMgj(s) || sbOnBoard(s); // (Sandbox's board: its spawns' zombies stop shots as his do)
  if (
    !r ||
    !((hang && isL4dd(s)) || mgj) ||
    sh.k === "grenade" ||
    sh.k === "chain" ||
    sh.k === "laser"
  )
    return false;
  const missed = [...(sh.ms || []), ...(sh.zp || [])],
    past = [...missed, ...(sh.hit || []), ...(sh.zh || [])];
  for (const i of past) r.skip.add(i);
  if (
    r.stop &&
    ((r.stop.i >= 0 && past.includes(r.stop.i)) || now - r.stop.at > STOP_WAIT)
  ) {
    if (r.stop.i >= 0 && missed.includes(r.stop.i)) r.n--; // (a miss isn't a hit)
    r.stop = null;
    r.fired = false;
  } // (it went on: from where it stopped)
  if (r.stop) return true;
  const [x0, y0] = r.p || [sh.x0, sh.y0],
    end = mgj
      ? mgjStop(s, sh, r, x0, y0, at.x, at.y, now)
      : shotStop(s, sh, r, x0, y0, at.x, at.y);
  r.p = [at.x, at.y];
  if (!end) return false;
  r.stop = { i: end.i, at: now };
  r.p = [end.x, end.y];
  const e = { x: end.x, y: end.y, z: at.z },
    a = hang ? world.place(e, sh.hz) : place(e, 0, 1, true);
  r.x = a.left;
  r.y = a.top;
  fxImpact(r.x, r.y, r.k, r.vx, r.vy);
  r.fired = true;
  return true;
}
const SHOT_SEEN = new Map(); // a shot's number → { k, x, y (where last seen on the screen), vx, vy (its way) }: once it's gone, it hit there (fx.js fxImpact)
const SHOTS_KEPT = new Map(); // class + look → elements ready to go again
function shotPool(cls, inner) {
  const k = cls + "|" + inner,
    free = SHOTS_KEPT.get(k);
  if (free && free.length) return free.pop();
  const b = el(`<div class="${cls}">${inner}</div>`);
  b._k = k;
  return b;
}
function shotDone(b) {
  b.remove();
  let free = SHOTS_KEPT.get(b._k);
  if (!free) SHOTS_KEPT.set(b._k, (free = []));
  if (free.length < 24) free.push(b);
  if (SHOTS_KEPT.size > 60) SHOTS_KEPT.clear(); // (many looks: start over)
}
/* blood bursting from (x, y): n drops all around, as pixels (fx.js); `near` is how far over its floor it bursts */
export function bloodBurst(x, y, n, wide, near, far, delay = 0) {
  const size = (geo && geo.size) || 60,
    go = () => fxBurst(x, y + size * 0.5, size * 0.5, n, Math.round(n / 4));
  if (delay) setTimeout(go, delay);
  else go();
}
/* a headless duck's neck spurting blood for a moment after (owner 2026-11-04 06:44Z): small spurts, one after another,
   as pixels (fx.js) */
export function neckSpray(x, y) {
  const size = geo && geo.size;
  if (!size) return;
  fxSpurt(x, y + size * 0.5, size * 0.5, 14, 1500);
}

/* what a hit just knocked off duck d (wounds.js codes it didn't have a moment ago: a hat h, a face item m, the beak p,
   the eye e), flying off its head the way it looks away from, as pixels (fx.js). The owner's, Nov 16 */
function knockedOff(d, wc, look, at, z, size, face) {
  const was = d._wc || "";
  d._wc = wc;
  if (!look || !wc) return;
  const fresh = (k) =>
      wc.includes(k + "0") && !was.includes(k + "0") && !was.includes(k + "1"),
    u = size / 120,
    x = (v) => at.left + (v - 60) * u * face,
    h = (v) => z + (108 - v) * u,
    away = -face,
    svg = (inner) =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-HAT_TOP} 120 ${120 + HAT_TOP}" width="120" height="${120 + HAT_TOP}">${face < 0 ? `<g transform="translate(120 0) scale(-1 1)">${inner}</g>` : inner}</svg>`;
  if (fresh("h") && look.hat) {
    const H = hatLayers(look.hat, look, false);
    fxKnock(svg(H.back + H.front), size, x(72), at.top, h(20), away, 1);
  }
  if (fresh("m") && look.face)
    fxKnock(
      svg(faceLayer(look.face, look, false)),
      size,
      x(84),
      at.top,
      h(36),
      away,
      0.9,
    );
  if (fresh("p"))
    fxKnock(svg(beakSVG(look)), size, x(100), at.top, h(42), face, 1.1, true);
  if (fresh("e")) fxEye(x(83), at.top, h(34), face);
}
/* Mad God Justin, beaten: he dies, lying on the LOSER podium in his blood, crying no more (the owner's, Nov 18 12:19Z:
   "when he has 0 HP in mad god justin, he dies (he starts crying when at 25 hp or lower but cry effect goes away for
   any dead player)", "mad god justin bleeds a puddle of blood when dead") */
const MGJ_CRY = 25;
const mgjDead = (s) => isMgj(s) && !!s.mgj && !!s.mgj.won && s.mgj.hp <= 0;
/* his gore by his HP (the owner's, Nov 18 12:19Z: "justin gets more gored every 10 health points when he has 100 HP,
   and once he hits 10 HP, every bit of damage does even more gore"): from 100 HP down, one more wound for every 10 HP
   he has lost, and under 10 HP one more for every HP; each step adds the next of MGJ_GORE (wounds.js codes: bruises
   and cuts first, then holes, an eye, chunks, his beak, the last the worst). Gore off: game.js shows only what
   goreFree keeps */
const MGJ_GORE = [
  "r1",
  "c0",
  "b4",
  "c6",
  "B2",
  "r5",
  "s1",
  "c3",
  "b7",
  "e0",
  "B0",
  "k1",
  "c7",
  "b5",
  "p0",
  "k2",
  "B6",
  "s4",
  "g0",
];
function mgjGore(s) {
  const hp = s.mgj ? Math.max(0, s.mgj.hp ?? MGJ_HP_UNKNOWN) : 999,
    n = hp > 100 ? 0 : hp >= 10 ? Math.floor((100 - hp) / 10) : 9 + (10 - hp);
  return MGJ_GORE.slice(0, n).join("");
}
/* ---------- my duck ---------- */
export const onBoardPhase = () =>
  R && boardPhases(R.state).includes(R.state.phase);
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
  isTv(R.state) ||
  isHang(R.state) ||
  isSb(R.state); // anywhere on the board (else inside my column). Sandbox's board has no columns at all
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
  const at = (x, y) =>
      geo && geo.hang && world
        ? world.place({ x, y }, 0) // (Hangout: on flat ground. Through the floor's own heights there, a step or the deck tilted every aim: the owner's, Nov 16)
        : place({ x, y }, 0, 1),
    o = at(0.5, 0.5),
    a = at(0.6, 0.5),
    b = at(0.5, 0.6);
  return [
    (a.left - o.left) * 10,
    (a.top - o.top) * 10,
    (b.left - o.left) * 10,
    (b.top - o.top) * 10,
  ];
}
export const toScreen = (ax, ay) => {
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
/* an explosion shakes my screen too (the owner's, Nov 17 11:07Z: "alongside explosions (small explosions less so)"):
   a grenade's 0.6 close by, a smaller one (the Angelic pistol's) less, a bigger one more; less the
   farther from my duck, none past about 14 ducks */
export function boomShake(at, wide) {
  const p = R && me && R.state.pos[R.me];
  if (!p) return;
  const c = bodyAt(R.me, p),
    far = Math.hypot(at.left - c.left, at.top - c.top) / geo.size,
    near = Math.max(0, Math.min(1, (14 - far) / 10));
  if (near > 0) shake(0.6 * Math.min(1.4, wide) * wide * near);
}
function bodyAt(id, pos, now = clockNow()) {
  const lane = R.state.seat.filter(
    (i) => R.state.pos[i] && (i === R.me && me ? me : R.state.pos[i]).x < 0,
  );
  const at = seatAt(R.state, id) || place(pos, lane.indexOf(id), lane.length), // (Valentine's Duck Date: at the table, its weapon goes with it)
    up = seated(R.state, id) ? SEAT_LIFT : 0; // (on its chair)
  const lift =
    geo.hang && world ? world.lift(id, pos) : jumpZ(pos, now) * geo.size; // (Hangout: how high it's drawn, a jump's)
  return {
    left: at.left,
    top: at.top - lift - (up + 0.45 * bigOf(R.state, id)) * geo.size, // (his hand higher on a bigger Justin)
  };
}
/* a phone (html.phone, pointer.js: not a tablet, not a touchscreen laptop) aims with the way my duck walks, as if it were
   the right stick, until the right stick is held (keyAim) and again once it's let go. walkScr is the way I last moved
   on the screen: it stays when I stop, and a duck that never walked aims the way it faces. The owner, Nov 17: this is
   so in every mode with weapons or items, and "like you would with aiming with a mouse" when the stick is used */
const phoneAim = () => document.documentElement.classList.contains("phone");
let walkScr = null, // [dx, dy] on the screen
  walkLast = null; // my place the last frame: [x, y]
function trackWalk() {
  if (!me || me.x < 0) {
    walkLast = null;
    return;
  }
  if (walkLast) {
    const dx = me.x - walkLast[0],
      dy = me.y - walkLast[1];
    if (dx || dy) {
      const [sx, sy] = toScreen(dx, dy);
      if (Math.hypot(sx, sy) > 0.15) walkScr = [sx, sy]; // (a step or more, not a shiver)
    }
  }
  walkLast = [me.x, me.y];
}
export function myAim() {
  const face = turned() ? 1 : (me && me.face) || 1;
  if (!geo || !me) return [face, 0];
  if (keyAim) return toBoard(keyAim[0], keyAim[1]) || [face, 0]; // (the arrow keys moved last)
  if (phoneAim() && walkScr)
    return toBoard(walkScr[0], walkScr[1]) || [face, 0]; // (a phone: the way I walk)
  if (!mouse) return toBoard(face, 0) || [face, 0];
  const board = origin($(".board", S));
  if (!board) return [face, 0];
  const r = board.getBoundingClientRect(),
    c = bodyAt(R.me, me),
    up = isL4dd(R.state) && world ? world.lift(R.me, me) : 0; // (Quacky Zombies, up in the air (a jump): it aims from where it stands, as its shot flies along the ground from its feet, so it goes where I point; the owner's, Nov 15)
  return (
    toBoard(mouse.x - r.left - c.left, mouse.y - r.top - c.top - up) || [
      face,
      0,
    ]
  );
}
const STILL_MS = 600; // ms between my duck's updates on a Poor connection while it stands still (moving: 220)
export function sendMove(force) {
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
    q,
    sprinting && moving,
    w,
    aim && Math.round(Math.atan2(aim[1], aim[0]) * 20),
    hz && hz.z,
    me.tb,
  ].join();
  const net = R.online ? netLevel() : -1,
    still =
      net > 1 &&
      !me.j &&
      lastSent.startsWith(`${me.x.toFixed(4)},${me.y.toFixed(4)},`); // (Poor connection, my duck standing where it was last sent, on the ground: only its aim or what's in hand changed)
  if (
    !force &&
    (now - lastSend < (still ? STILL_MS : [60, 90, 140, 220][net + 1]) ||
      msg === lastSent)
  )
    return; // online: less often (Data saving, Poor connection: less still; standing still on a poor connection: least)
  lastSend = now;
  lastSent = msg;
  R.send({
    t: "move",
    x: me.x,
    y: me.y,
    j: me.j || 0,
    ...jumpSend(me),
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
  if (isInvisible(R.state, R.me, now)) return out; // (invisible: through everyone, and they through me)
  const s = R.state,
    a = place({ x, y }, 0, 1),
    rx = geo.size * 0.44,
    ry = geo.size * 0.2,
    ka = duckRoom((s.players[R.me] || {}).duck);
  for (const id of s.seat) {
    if (id === R.me || !s.pos[id] || s.pos[id].x < 0) continue;
    const o = s.pos[id];
    if (jumpZ(o, now) > 0 || (s.players[id] || {}).dead) continue; // (in the air, or lying knocked down: walked over)
    if (isInvisible(s, id, now)) continue;
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
/* the frame cap (Settings → Performance, 120 frames a second at first): a frame comes early, so it's skipped. nextAt
   keeps the beat, so a 144 Hz screen capped at 120 draws about 120, not every other frame */
let nextAt = 0;
function capped(t) {
  const st = profile.settings,
    cap = st.fpsCapOn !== false ? +st.fpsCap || 0 : 0;
  if (cap < 1) return false;
  const gap = 1000 / cap;
  if (t < nextAt - 1) return true;
  nextAt = t - nextAt > gap ? t + gap : nextAt + gap; // (fell behind: start the beat again from now)
  return false;
}
function loop(t) {
  raf = requestAnimationFrame(loop);
  if (capped(t) || underVeil()) return; // (under the loading screen, a frame in a few: loading.js)
  const dt = Math.min(0.05, (t - (lastT || t)) / 1000);
  lastT = t;
  if (!S || !R) return;
  frame(t); // (the frame-rate readout, perf.js: each part's time below, only while it's on)
  const now = clockNow();
  let t0 = stamp();
  if (!geo) measure();
  if (me && onBoardPhase()) step(dt, now);
  syncHidden(R.state, R.me); // (invisible players: nobody else sees them)
  took("my duck", t0);
  t0 = stamp();
  if (scene) scene.update(now);
  took("scene", t0);
  t0 = stamp();
  shiftSides(R.state, now);
  boardCam();
  drawDucks(now);
  grLook(S, R.state); // (Sandbox: the groups' outlines, sbgroupview.js)
  took("ducks", t0);
}
export function step(dt, now) {
  if (isHang(R.state)) return hangStep(dt, now);
  const s = R.state;
  // a jump lands: it counts now
  if (me.j && now >= landsAt(me)) {
    me.j = 0;
    countJump();
    sendMove(true);
  }
  const want = walkIntent(keys, arrowsAim()), // (Mad God Justin: WASD walks, the arrows aim)
    hx = want.x,
    vy = want.y; // on screen: right, down
  if (hx || vy) target = null;
  sprinting = want.sprint || !!(target && target.sprint);
  if (isMgj(s)) sprinting = false; // (no sprint in Mad God Justin: Shift, the stick's edge and a double tap all walk. The owner's, Nov 17 19:11Z: "the sprint should be removed from mad god justin")
  sprinting = sprintStep(
    sprinting && !!(hx || vy || target),
    dt,
    grStam(s, R.me),
  ); // (sprint till the bar is empty, then a walk till it's full again: stamina.js, every mode; Sandbox: a group's Regen stamina)
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
  const push =
    recoil && performance.now() < recoil.until && canWalk() && !geo.hang
      ? recoil
      : null; // (the chain gun pushing me back)
  /* a jump can end inside another duck (in the air they pass over each other); on the ground they ease apart */
  const other = canWalk() && bumps(me.x, me.y, now);
  if (other && !moving && !push) {
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
  if (!moving && !push) {
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
      : [1 / sbBoardK(s), 1 / sbBoardK(s)]; // (on the bracket: the same speed on the screen; on Sandbox's bigger board, the same speed in ducks)
  if (geo && geo.sc && geo.rows.length) {
    const k = geo.rows.length,
      row =
        geo.rows[
          Math.min(k - 1, Math.floor(Math.max(0, Math.min(0.9999, me.y)) * k))
        ];
    onTree = [1, (geo.H * 0.9) / SPEED.y / (row.h * k)];
    scWalk = now;
  } // (the story: the same speed on the screen in any row)
  if (geo && geo.tl && me.x >= 0) {
    const { row, share } = tvSeg(me.y);
    onTree = [1, (geo.tl.h * share) / row.h];
  } // (Trivia: the same speed on the screen in any row, however tall)
  const mul =
    (sprinting ? SPEED.sprint : 1) *
    (isMgj(s) ? MGJ_SLOW : 1) *
    walkOf(s) *
    sbWalkOf(s, R.me); // (Mad God Justin: the ducks a fifth slower; the lobby's Walking speed; Sandbox: a spawn's or a respawn's speed for me)
  const sx = (turned() ? SPEED.px : SPEED.x) * mul * onTree[0],
    sy = (turned() ? SPEED.py : SPEED.y) * mul * onTree[1];
  let [lo, hi] = xBounds();
  if (
    turned() &&
    geo &&
    geo.H &&
    !geo.qp &&
    !geo.tl &&
    !geo.sc &&
    !geo.hang &&
    s.phase !== "bracket"
  ) {
    lo = Math.max(lo, Math.min(hi, (geo.size * 0.45 + TAG_ROOM) / geo.H));
    hi = Math.min(hi, Math.max(lo, 1 - (geo.size * 0.63) / geo.H));
  } // (upright on a phone: my duck stops where its feet reach the board's bottom and its head the top, as place() draws it)
  let nx = me.x + ax * sx * dt,
    ny = me.y + ay * sy * dt,
    q = "";
  if (push) {
    // the push as a walk the other way, RECOIL.K as fast, added to mine (sprinting doesn't make it stronger)
    const run = sprinting ? SPEED.sprint : 1,
      ux = push.dx / sx,
      uy = push.dy / sy,
      l = Math.hypot(ux, uy) || 1;
    nx += ((ux / l) * sx * RECOIL.K * dt) / run;
    ny += ((uy / l) * sy * RECOIL.K * dt) / run;
  }
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
  if (sbOnBoard(s)) {
    const [wx, wy] = sbWallGo(
      s,
      sbWalls(s, { duck: (s.players[R.me] || {}).name || "" }),
      me.x,
      me.y,
      nx,
      ny,
      0,
    );
    if (wx !== nx || wy !== ny) {
      q = q || scr(Math.sign(ax), Math.sign(ay));
      nx = wx;
      ny = wy;
    }
  } // (Sandbox: a zone that's a wall to me, plan Phase 3)
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
  const want = walkIntent(keys, arrowsAim()); // (the arrows aim: WASD walks)
  let ax = want.x,
    ay = want.y;
  if (ax || ay) target = null;
  sprinting = want.sprint || !!(target && target.sprint);
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
  sprinting = sprintStep(sprinting && !!(ax || ay), dt, grStam(R.state, R.me)); // (sprint till the bar is empty, then a walk till it's full again: stamina.js, every mode, Dead Ducks Arcade's too; Sandbox: a group's Regen stamina)
  const kx = ax; // (which way I face: my keys, not the push)
  if (canWalk() && recoil && performance.now() < recoil.until) {
    const l = Math.hypot(recoil.dx, recoil.dy) || 1;
    ax += (recoil.dx / l) * RECOIL.K;
    ay += (recoil.dy / l) * RECOIL.K;
  } // (the chain gun pushing me back: the world sums it with my walk, never past my full speed)
  const ev = world.step(me, ax, ay, sprinting, dt, now);
  moving = ev.moved;
  for (let i = 0; i < ev.land; i++) countJump();
  if (ev.q) squash = { q: ev.q, t: now };
  if (kx) me.face = Math.sign(kx);
  if (isL4dd(R.state)) me.aim = myAim(); // (Quacky Zombies: my flashlight shines where I aim)
  if (ev.whee) sfx.fall(); // off the deck: a slide whistle
  if (ev.thud > 90) sfx.bonk(); // and the landing
  if (ev.thud >= SB_LAND_MIN && sbLands(R.state))
    R.send({
      t: "sb",
      k: "land",
      h: Math.round(ev.thud),
      x: +me.x.toFixed(4),
      y: +me.y.toFixed(4),
      z: Math.round(me.z || 0),
    }); // (Sandbox: a zone that hurts whoever lands on it from a fall, sbzone.js)
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
  target = null;
  R.send({ t: "move", x, y, j: 0, reset: true });
  return inCol === null
    ? "Duck reset: somewhere new."
    : "Duck reset: somewhere new in your column.";
}
/* Space or a tap */
function jump() {
  if (!me || !onBoardPhase()) return;
  const now = clockNow();
  if (world && isHang(R.state) && !world.canJump(me)) return; // (an activity took Space, or my duck is falling)
  if (hangStill(R.state, R.me, now) || downStill(R.state, R.me, now)) return;
  if (me.j) return;
  me.j = now;
  if (world && isHang(R.state)) world.started(me); // (the arc starts from the height it stands on)
  sfx.hop();
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
  if (isTv(R.state)) return; // (Trivia: the question says it all)
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

export const PICK_NAMES = Object.fromEntries(
  PICK_WEAPONS.map((k) => [k, weaponName(k)]),
); // (as Quacky Zombies names them)
/* Mad God Justin: "Defeat Justin!" as the fight starts; then he's defeated, or time's up */
async function announceMgj(s, phase) {
  ++sayJob; // (any announcement still waiting stops)
  if (phase === "boss") {
    sfx.drum();
    say("Defeat Justin!");
    return;
  }
  if (phase !== "mgjend") return;
  if (!(s.mgj && s.mgj.won)) {
    sfx.bonk();
    say("Justin Wins");
    return;
  }
  sfx.done();
  confettiRain(5000);
  say("Justin defeated");
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
      <textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="Pineapple belongs on pizza." aria-label="Your topic"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
        : isDn(s)
          ? `<form class="panel submit-card" autocomplete="off"><h2>Your take</h2>
      <p class="small dim">Something controversial enough to argue about. ${s.options.dunceTakes === "own" ? "You defend your own take." : s.options.dunceTakes === "notOwn" || +s.options.noOwn ? "Someone else will have to defend it." : "It goes to a random duck, maybe you."} Nobody is told who wrote it.</p>
      <textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="Cereal is a soup." aria-label="Your take"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
          : isDdr(s)
            ? `<form class="panel submit-card" autocomplete="off"><h2>Your statement</h2>
      <p class="small dim">Something people might relate to, or might not.</p>
      <textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="I've laughed at my own joke before anyone else." aria-label="Your statement"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
            : `<form class="panel submit-card" autocomplete="off"><h2>Your question</h2>
      ${
        isWyr(s)
          ? `<p class="wyr-head">Would you rather…</p><div class="wyr-pair">
        <textarea data-note-box class="wyr-in" data-side="a" maxlength="${Math.min(100, textMax(s))}" rows="3" placeholder="Lose every right ever and become data breached" aria-label="The first choice"></textarea>
        <span class="wyr-or-word">OR</span>
        <textarea data-note-box class="wyr-in" data-side="b" maxlength="${Math.min(100, textMax(s))}" rows="3" placeholder="Admit Justin is right about data breaching" aria-label="The second choice"></textarea></div>`
          : `<textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="Data breaching is a serious problem, and IDIOTS don't understand what I am saying!" aria-label="Your question"></textarea>`
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
        `<span class="who-chip${s.done[id] ? " done" : ""}">${duckSVG(seenDuck(s.players[id]), { size: 26, shadow: false })}${nameHTML(s.players[id].name, seenName(s.players[id]))}${s.done[id] ? " ✓" : ""}</span>`,
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
  if (isTv(s)) return tvStatsHTML(s);
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
      ? nameHTML(s.players[id].name, seenName(s.players[id]))
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
  const st = profile.stats[statMode(s)];
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
  if (isTv(s)) {
    // Trivia: my answers this round, right and wrong, and the questions I wrote
    const w = tvStats(s, s.round).per[R.me];
    if (!st) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    if (w) {
      st.answers += w.right + w.wrong;
      st.wins += w.right;
      st.losses += w.wrong;
      st.titles += w.asked;
    }
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

/* Sandbox on the board: the build (spawn, respawn, loot or zone) my duck stands by, { id, label }, or null: its settings
   open with E or the button, as on Duck Cabin and Downpour (sbspawnview.js near). The owner, Nov 19 16:17Z: "interact
   button shows on the interactable builds". Only for who may build (B) */
let lastSbGo = "";
const SB_LABELS = {
  spawn: "Spawn settings",
  loot: "Loot settings",
  zone: "Zone settings",
};
function sbGo(s) {
  if (!isSb(s) || !sbOnBoard(s) || !me || !onBoardPhase()) return null;
  if (!sbMay(s, R.me, "b") || !sbCheat.on) return null;
  let best = null,
    bd = 1.6;
  for (const [id, p] of Object.entries((s.sb && s.sb.pts) || {})) {
    if (p.grp) continue;
    const d = Math.hypot(
      (p.x - me.x) / boardDuck(s)[0],
      (p.y - me.y) / boardDuck(s)[1],
    );
    if (d < bd) {
      bd = d;
      best = { id, label: SB_LABELS[p.k] || "Respawn settings" };
    }
  }
  return best;
}
const sbGoOpen = () => {
  const g = sbGo(R.state);
  if (g) sbSettings(() => R, g.id);
};
/* the middle of the bottom bar: what you can do now, and how many are done */
export function actHTML(s) {
  const sbg = sbGo(s);
  if (sbg)
    return `<div class="act-row"><button type="button" class="btn hang-btn" data-a="sbgo">${esc(sbg.label)} <kbd>E</kbd></button></div>`;
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
  if (isTv(s) && TV_BOARD.includes(s.phase)) return tvActHTML(s, R.me, me);
  if ((isHang(s) || sbOnBoard(s)) && watching(s, R.me))
    return watchHTML(s, R.me); // (Survival, my duck dead: the card of the one I watch: spectate.js)
  if (isHang(s)) return world ? world.buttonHTML() : ""; // Hangout: the nearest activity's button (Light off …)
  if (late())
    return `<span class="progress">You joined mid-turn: walk around and chat. You play from the next ${isBb(s) ? "match" : isLaw(s) ? "case" : isDn(s) ? "take" : "question"}. · ${d}/${n} done</span>`;
  const count = `<span class="progress">${d}/${n} done${need < n ? ` · ${need} needed` : ""}</span>`;
  if (isSc(s)) return storyActHTML(s, d, n, need, count);
  if (
    ["submit", "topic", "tvote", "seeds", "counsel", "tvwrite"].includes(
      s.phase,
    )
  )
    return count;
  if (isLaw(s) && ATT_PHASES.includes(s.phase) && s.law) {
    const p = s.law.picks[s.phase === "lawdef" ? "def" : "off"] || {},
      v = on.filter((id) => p[id] !== undefined).length;
    return `<span class="progress">${v}/${n} voted</span>`;
  } // (the attorney vote)
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
    return `<span class="progress">${s.mgj && s.mgj.won ? "Justin is defeated!" : "Justin Wins."} The stats are next.</span>`;
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
    return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine ? " voted" : ""}" data-a="end" data-col="${col}"${off ? " disabled" : ""}${tip ? ` data-tip="${tip}"` : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${endRoundHTML(s)}${votes}</div>`;
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
      <button type="button" class="btn ${lv ? "red" : "ghost"}" data-a="lobbyvote"${s.round === 1 ? ' data-tip="You can also vote to go back to the lobby on the all-rounds stats screen."' : ""}>${lv ? "Vote yes: back to the lobby" : "Vote: back to the lobby"}</button>${newGameHTML(s)}${count}${voteBackNote(s)}</div>`;
  }
  if (s.phase === "over")
    return `<div class="act-row">${isSudo(s, R.me) ? '<button type="button" class="btn green" data-a="lobby">Back to the lobby</button>' : '<span class="dim">The host takes everyone back to the lobby.</span>'}<button type="button" class="btn ghost" data-a="leave">Leave</button></div>`;
  return "";
}

/* Vote Mode & Map on: the stats screen's "Vote: new game now" button (the votes come back at once once the room says
   yes), and a line that says when the votes come back on their own (Vote return) */
function newGameHTML(s) {
  const due = votesDue(s);
  if (!due.length) return "";
  const nv = s.vote && s.vote.kind === "newgame",
    what = due.includes("mode") ? "game" : "map";
  return `<button type="button" class="btn ${nv ? "green" : "ghost"}" data-a="newvote">${nv ? `Vote yes: new ${what} now` : `Vote: new ${what} now`}</button>`;
}
function voteBackNote(s) {
  const due = votesDue(s),
    v = s.options.voteBack;
  if (!due.length || !(+v > 0 || v === "r")) return "";
  const what = due.includes("mode") ? "game" : "map",
    every =
      v === "r"
        ? "Every 1 to 6 games (picked at random)"
        : +v === 1
          ? "After every game"
          : `Every ${+v} games`,
    left = Math.max(1, +s.gamesLeft || 1);
  return `<div class="vote-back-note dim small">${every}, everyone votes on the next ${what}. Games until that vote: ${left}.</div>`;
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
/* the End round button (the host's End round setting), next to Vote once enough have voted */
const endRoundHTML = (s) =>
  canEndRound(s) && !late() && playing(s).includes(R.me)
    ? '<button type="button" class="btn yellow" data-a="endround">End round</button>'
    : "";
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
  return `<div class="act-row"><button type="button" class="btn vote-btn sc-vote${mine ? " voted" : ""}" data-a="end"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${endRoundHTML(s)}<span class="progress">${d}/${n} voted${need < n ? ` · ${need} needed` : ""}</span>${review}</div>`;
}
const TITLES = {
  hang: "Duck Cabin",
  sandbox: "Sandbox",
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
  lawdef: "Vote the defense",
  lawoff: "Vote the offense",
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
  if (isTv(s) && s.phase === "tvwrite") return tvWriteHTML(s, R.me, whoHTML(s));
  if (
    (isLaw(s) || isDn(s) || isMgj(s) || isVd(s) || isTv(s)) &&
    s.phase === "results"
  )
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
/* the screen as the state has it (timed for the frame-rate readout, perf.js) */
function paint(force) {
  const t0 = stamp();
  paintNow(force);
  took("paint", t0);
}
function paintNow(force) {
  if (!S || !R) return;
  const s = R.state,
    key = [s.phase, s.round, s.qi].join("|");
  if (scene) scene.look(s); // (a Sandbox game mode's look, maps.js: G can change it while it plays)
  if (force || key !== shown) {
    const was = shown;
    shown = key;
    const fresh = s.pos[R.me] ? { ...s.pos[R.me], face: 1 } : null;
    if (
      s.phase === "answer" ||
      s.phase === "results" ||
      s.phase === "bracket" ||
      s.phase === "dunced" ||
      s.phase === "lawdef" ||
      (isSc(s) && SC_BOARD.includes(s.phase)) ||
      !me ||
      (isQuack(s) && (!was || was.split("|")[0] !== s.phase)) ||
      (isVd(s) && ["vdprompt", "vdpick", "vdval"].includes(s.phase)) ||
      (isTv(s) && ["tvq", "tvw"].includes(s.phase))
    )
      me = fresh && {
        ...fresh,
        j: (me && me.j) || 0,
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
    S.classList.toggle("tv", isTv(s));
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
    if (isHang(s) && inWorld(s)) loadSounds("cabin"); // (Duck Cabin's own: its lamps, lever, cards …)
    if (isHang(s) && inWorld(s))
      world = mountWorld($(".hang-board", main), {
        room: () => R,
        me: () => me,
        eye: () => {
          const id = R && watching(R.state, R.me);
          return id && id !== R.me && world
            ? world.shown(id, R.state.pos[id])
            : null;
        }, // (Survival, my duck dead: the camera on the duck I watch, as it sees it: spectate.js)
        jumpZ,
        landsAt,
        cfg: () => jumpCfg(me),
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
    if ((s.phase === "answer" || inWorld(s)) && !touchTold && touchOnly()) {
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
      (isSb(s) && "Sandbox") || // (on every map)
      (inWorld(s) && s.options.mode === "surv" && "Survival") ||
      (inWorld(s) &&
        s.options.mode === "l4dd" &&
        s.options.l4map === "downpour" &&
        "Downpour") || // (Dead Ducks Arcade's second map)
      (isLaw(s) && LAW_TITLES[s.phase]) ||
      (isDn(s) && DN_TITLES[s.phase]) ||
      (isMgj(s) && MGJ_TITLES[s.phase]) ||
      (isVd(s) && VD_TITLES[s.phase]) ||
      (isTv(s) && TV_TITLES[s.phase]) ||
      TITLES[s.phase] ||
      "";
    lastClose = (s.law && s.law.close) || 0;
    geo = null;
    if (bar) {
      if (onBoardPhase()) bar.show();
      else bar.hide();
    } // the specials' row comes in with each stage on the board, then slides away
  }
  heardReloads(s);
  if (world) world.state(s); // (a lamp switched off …)
  if (isMgj(s)) {
    mgjBackIfGone(s);
    const hp = $(".mgj-hp", S);
    if (hp) setHTML(hp, mgjHPHTML(s));
  } // Mad God Justin: the knife always out; his HP
  else if (hand.held === "knife" && !hasKey(myDuck(), "knife")) hand.in = null;
  const round =
    s.phase === "over" || isHang(s) || isSb(s)
      ? ""
      : isMgj(s)
        ? `Fight ${s.round + 1}`
        : isVd(s)
          ? vdRound(s)
          : isTv(s)
            ? `Round ${s.round + 1}${tvRound(s)}`
            : `Round ${s.round + 1}${isQuack(s) ? (s.wq && s.wq.lap && QUACK_PHASES.includes(s.phase) ? ` · Lap ${s.wq.lap}` : "") : isSc(s) ? (s.phase === "write" ? ` · Line ${s.sc.turn + 1} of ${s.sc.order.length}` : "") : isBb(s) ? (bbMatch(s) ? ` · ${roundName(s.bb, s.bb.r)}` : "") : s.qs.length && ["answer", "discuss", "counsel", "dunced", ...ATT_PHASES].includes(s.phase) ? ` · ${isLaw(s) ? "Case" : isDn(s) ? "Take" : "Question"} ${s.qi + 1} of ${s.qs.length}` : ""}`;
  if ($(".round", S).textContent !== round) $(".round", S).textContent = round; // (every paint: a Story Chain line can be added for someone who joined)
  if (bar) bar.refresh(); // (a key kept on, or kept off)
  if (isTv(s) && TV_BOARD.includes(s.phase) && tvRefresh(S, s, R.me))
    geo = null; // (Trivia: the votes, answers and grades as they come; a row for someone who joined)
  if (
    s.phase === "submit" ||
    s.phase === "topic" ||
    s.phase === "words" ||
    s.phase === "tvwrite"
  ) {
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
  if (isLaw(s) && ATT_PHASES.includes(s.phase))
    setHTML($(".law-vote-wrap", S), attVoteHTML(s, R.me)); // (the attorney vote's window over the board)
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
      me.z = me.b = p.z > 0 ? p.z : undefined; // (Sandbox: up on a floor where it came back; nothing under it, it falls)
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
  if (sbk) sbk.paint(); // (Sandbox: who may use the windows can change with the host)
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
          at: clockNow(),
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
        };
    // (the Justin option: his lines over him)
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
    // Mad God Justin: no time limit (the owner's, Nov 3), so no clock
    if (meter && !meter.hidden) meter.hidden = true;
    if (t.textContent) t.textContent = "";
    if (t.className !== "timer") t.className = "timer";
    return;
  }
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
      "lawdef",
      "lawoff",
      "vdprompt",
      "vddate",
      "hang", // (only a Hangout from Random or the vote has a time limit)
    ].includes(s.phase)
  ) {
    if (t.textContent) t.textContent = "";
    if (t.className !== "timer") t.className = "timer";
    if (meter && !meter.hidden) meter.hidden = true;
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
    if (meter.hidden) meter.hidden = false;
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
  const tx = `${inGrace ? "Grace " : closing ? "Closing " : catching ? "Catch-up " : ""}${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`,
    tc = "timer" + (catching ? " catch" : "") + (left <= 5 ? " low" : "");
  if (t.textContent !== tx) t.textContent = tx;
  if (t.className !== tc) t.className = tc; // (each only when it changes: this runs many times a second)
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
    if (R && isTv(R.state)) {
      const f = S && $("form.tv-form", S),
        w = S && $("form.tv-ansform .tv-win", S);
      if (f && R.state.phase === "tvwrite") R.send({ t: "draft", q: formQ(f) });
      if (w && R.state.phase === "tvw") R.send({ t: "draft", text: w.value });
      return;
    } // (Trivia: what's typed goes in when the time runs out)
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
    <button type="button" class="btn ghost" data-a="hideui" aria-pressed="${uiHidden()}">${uiHidden() ? "Show UI" : "Hide UI"}</button>
    <button type="button" class="btn ghost" data-a="friends">Friends</button>
    ${R && isHang(R.state) && isSudo(R.state, R.me) ? '<button type="button" class="btn yellow" data-a="lobby">Everyone back to the lobby</button>' : ""}
    <button type="button" class="btn red" data-a="leave">Leave game</button></div>${uiScaleHTML()}
    <p class="small dim" style="margin-top:.8rem">The game keeps going while this is open.</p>
    <p class="small pause-counts"><span>Jumps <b>${fmtJumps(profile.jumps)}</b></span><span>Justin kills <b>${fmtJumps(profile.justinKills)}</b></span><span>Kills <b>${fmtJumps(Object.values(profile.stats || {}).reduce((n, x) => n + ((x && x.kills) || 0), 0))}</b></span></p>`,
    {
      cls: "win-small",
      onOpen: (w, close) => {
        uiScaleWire(w);
        w.querySelector(".pause-list").onclick = (e) => {
          const a = e.target.closest("[data-a]");
          if (!a) return;
          close();
          ({
            resume() {},
            custom: () => openCustomize(),
            settings: () => openSettings(),
            hideui: () => toast(setHideUi(!uiHidden())), // (hide ui: hideui.js)
            friends: () => openFriends(),
            lobby: () => R.send({ t: "toLobby" }),
            leave: () =>
              R && R.state.solo
                ? R.send({ t: "toLobby" }) // (Single Player: back to its own lobby, never the online rooms)
                : leaveTo("rooms", "Leave the game in progress?"),
          })[a.dataset.a]();
        };
      },
    },
  );
}

/* ---------- hold to vote (the owner's, Nov 17 13:30Z) ----------
   A Vote button, and on a phone the button that does what E does on the board, acts once it has been held for the
   time set in Settings (Hold to vote, 0.5 s to start): a stripe fills across it meanwhile, and letting go early
   changes nothing. On a computer the Enter key, which votes the same way, is held the same time. Off: it acts at
   once, as before */
const holdMs = () => {
  const v = profile.settings.holdVote;
  return v === undefined ? 500 : +v || 0;
};
/* only what Enter does on a computer is held: the Vote button. Anything Enter can't press (the phone's use button)
   acts at once with a click (the owner's, Nov 17 19:23Z: "if it cannot be selected by enter on PC then you simply do
   not have to hold it down but it still gets a click noise") */
const holdBtn = (b) => !!holdMs() && b.classList.contains("vote-btn");
let held1 = null; // { a, key, t0, ms, raf, timer }: what is held now (its data-a), what holds it (a pointer's id or "Enter")
/* the button's own element is drawn again whenever the screen refreshes, so the stripe is painted on whichever one
   stands there now, every frame */
const holdNow = (a) =>
  S && [...S.querySelectorAll(`[data-a="${a}"]`)].find((b) => !b.disabled);
function holdPaint() {
  if (!held1) return;
  const b = holdNow(held1.a),
    u = Math.min(1, (performance.now() - held1.t0) / held1.ms);
  if (b) {
    b.classList.add("holding");
    b.style.setProperty("--hold", u.toFixed(3)); // (the stripe, and the glow growing with it: css .holding)
  }
  held1.raf = requestAnimationFrame(holdPaint);
}
function holdStart(a, key) {
  holdEnd();
  const ms = holdMs();
  held1 = {
    a,
    key,
    ms,
    t0: performance.now(),
    timer: setTimeout(() => {
      const h = held1;
      holdEnd();
      if (h && holdNow(h.a)) {
        sfx.holdClick(); // (full: a click, the owner's, Nov 17 19:22Z)
        act(h.a);
      }
    }, ms),
  };
  sfx.holdFill(ms); // (a sound rising as the button fills, the owner's, Nov 17 19:22Z: "makes a sound as it fills up")
  holdPaint();
}
function holdEnd(e) {
  if (!held1) return;
  if (e && e.pointerId !== undefined && e.pointerId !== held1.key) return;
  if (e && e.code && held1.key !== "Enter") return;
  clearTimeout(held1.timer);
  cancelAnimationFrame(held1.raf);
  sfx.holdStop(); // (let go early: the filling sound fades out)
  for (const b of S ? S.querySelectorAll(".holding") : [])
    b.classList.remove("holding");
  held1 = null;
}
function holdDown(e) {
  if (e.button > 0 || !R) return;
  const b = e.target.closest && e.target.closest("[data-a]");
  if (!b || b.disabled || !holdBtn(b)) return;
  holdStart(b.dataset.a, e.pointerId);
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
    /* Sandbox's windows: in a box, Tab goes to the next box, as on any form (a number typed and Tabbed away from was
       never kept) */
    if (typing(e) && R && isSb(R.state) && e.target.closest(".win, .sb-win"))
      return;
    e.preventDefault();
    if (!windowOpen() && !typing(e)) pm.keydown(e);
    return;
  } // hold Tab: the players (Tab never moves the browser's focus in a game)
  if (typing(e) || windowOpen()) return;
  if (world && onBoardPhase() && world.keydown(e)) return; // Hangout: an activity's keys first (the piano)
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (
    (e.code === "ArrowLeft" || e.code === "ArrowRight") &&
    R &&
    watching(R.state, R.me) &&
    watching(R.state, R.me) !== R.me // (a Dead Ducks Arcade ghost on its own card: the arrows still walk it)
  ) {
    e.preventDefault();
    spec(e.code === "ArrowLeft" ? -1 : 1);
    return;
  } // (Survival, my duck dead: the arrows go from one duck I watch to the next)
  if (MOVE_KEYS.includes(e.code) && onBoardPhase()) {
    if (!e.code.startsWith("Shift")) e.preventDefault();
    keys.add(e.code);
    if (ARROWS[e.code] && arrowsAim()) keyAimNow();
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    if (!e.repeat) jump();
    return;
  }
  if (e.code === "KeyH" && !e.repeat && hotH()) return e.preventDefault(); // (my hotbar's window, P5)
  if (e.code === "KeyL" && onBoardPhase() && me) {
    e.preventDefault();
    if (!e.repeat) toggleSight();
    return;
  }
  if (keyIndex(e) >= 0 && onBoardPhase()) {
    e.preventDefault();
    if (!e.repeat) useKey(keyIndex(e), e.shiftKey, true);
    return;
  } // the specials' keys (Shift: keep it on)
  if (e.code === "KeyE" && sbGo(R.state)) {
    e.preventDefault();
    if (!e.repeat) sbGoOpen();
    return;
  } // Sandbox on the board: E opens the settings of the build I stand by
  if (e.code === "KeyE" && isHang(R.state) && onBoardPhase()) {
    e.preventDefault();
    if (!e.repeat && world) world.press();
    return;
  } // Duck Cabin: E uses what's near (sit, play, read …)
  if (e.code === "KeyR" && !e.repeat && reload()) {
    e.preventDefault();
    if (bar) setTimeout(() => bar && bar.refresh(), 60);
    return;
  } // the handgun reloads
  if (e.code === "KeyV" && !e.repeat && onBoardPhase()) {
    e.preventDefault();
    if (isMgj(R.state))
      fire(hand.held || MGJ_MELEE); // (out of HP: fire() makes it the down pistol)
    else if (heldNow()) fire(heldNow());
    else if (hand.lastKey >= 0) useKey(hand.lastKey, false);
    else if (bar) bar.show();
    return;
  } // V: the special kept out (toggled), or else the one I used last (Mad God Justin: what's in hand)
  if (
    e.code === "KeyE" &&
    isMgj(R.state) &&
    R.state.phase === "boss" &&
    downNear(R.state, R.me)
  ) {
    e.preventDefault();
    if (!e.repeat) mgjRevive(true);
    return;
  } // Mad God Justin: E held by a downed duck gets it up in 5 s
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
    const vb =
      S && [...S.querySelectorAll(".vote-btn")].find((b) => !b.disabled);
    if (vb && holdMs()) holdStart(vb.dataset.a, "Enter");
    else {
      if (vb) sfx.holdClick(); // (Hold to vote off: Enter votes at once, with the click)
      act("end");
    }
  }
}
const keyup = (e) => {
  if (world) world.keyup(e);
  if (e.code === "Enter" || e.code === "NumpadEnter") holdEnd(e);
  if (e.code === "KeyE" && mgjRv) mgjRevive(false); // (Mad God Justin: let go of E, the revive stops)
  keys.delete(e.code);
  if (e.key === "Tab" && pm) pm.keyup(e);
  if (e.code === "KeyQ") peek(false);
};
const blur = () => {
  keys.clear(); // (also when the tab is hidden: visibilitychange below)
  peek(false);
};
/* my Secret Card turns face up while it's held (or Q is) */
function peek(on) {
  const c = S && $(".wq-card.mine", S);
  if (c) c.classList.toggle("peek", on && !c.classList.contains("dealing"));
}
export const hidden = () => {
  if (document.hidden) blur(); // (no key stays held down while the game can't see it come up)
};
const resized = () => {
  geo = null;
};
const unpeek = () => peek(false);

/* Survival, my duck dead: watch the next duck (d 1) or the one before (-1) */
function spec(d) {
  if (!R || !watchNext(R.state, R.me, d)) return;
  sfx.uiOn(); // (the faint click, as the menus')
  setHTML($(".gact", S), actHTML(R.state));
}
/* ---------- what the buttons do ---------- */
async function act(a) {
  const s = R.state;
  switch (a) {
    case "hang":
      if (world) world.press();
      break; // Hangout: the context button
    case "sbgo":
      sbGoOpen();
      break; // Sandbox on the board: the settings of the build I stand by
    case "end":
      if (isHang(s)) {
        if (world) world.press();
        break;
      } // (Enter)
      if (isTv(s) && TV_BOARD.includes(s.phase)) {
        const row = me && me.x >= 0 ? tvRowAt(s, me) : -1;
        if (s.phase === "tvq" && row >= 0) {
          sendMove(true);
          R.send({ t: "tv", k: "pick", i: row });
        }
        break;
      } // (Trivia: Enter votes for the answer I stand on, or takes the vote back)

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
    case "tvpick": {
      // Trivia: Vote on the answer I stand on, or Take back
      const row = me && me.x >= 0 ? tvRowAt(s, me) : -1;
      if (row >= 0) {
        sendMove(true);
        R.send({ t: "tv", k: "pick", i: row });
      }
      break;
    }
    case "tvend":
      R.send({ t: "tv", k: "end" });
      break;
    case "endround":
      R.send({ t: "endRound" });
      break;
    case "tvstop":
      R.send({ t: "tv", k: "stop" });
      break;
    case "tvok":
    case "tvno": {
      // Trivia: the writer's Correct or Wrong on the row they stand on
      const row = me && me.x >= 0 ? tvRowAt(s, me) : -1;
      if (row >= 0) {
        sendMove(true);
        R.send({ t: "tv", k: "grade", i: row, ok: a === "tvok" });
      }
      break;
    }
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
    case "newvote":
      lobbyVote(R, "newgame");
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
      if (R && R.state.solo)
        R.send({ t: "toLobby" }); // (Single Player: back to its own lobby)
      else leaveTo("rooms", "Leave the room?");
      break;
    case "notes": {
      const t = await pickNote();
      const boxes = $$(".submit-card textarea[data-note-box]", S);
      if (!t || !boxes.length) break;
      if (boxes.length === 1) {
        boxes[0].value = t;
        boxes[0].focus();
        break;
      }
      // I want more than one box to breathe green until I tap the one the note goes into
      const done = () =>
        boxes.forEach((b) => {
          b.classList.remove("note-glow");
          b.removeEventListener("pointerdown", fill);
        });
      const fill = (e) => {
        e.preventDefault();
        done();
        e.currentTarget.value = t;
        e.currentTarget.focus();
      };
      boxes.forEach((b) => {
        b.classList.add("note-glow");
        b.addEventListener("pointerdown", fill);
      });
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

/* on a phone the board takes the whole screen and the bars sit over it (css: html:not(.keyboard) .game): how tall
   the top bar and everything at the bottom (the bottom bar and the chat docked over it) are, so what's on the board
   keeps out from under them (--ui-top, --ui-bot) */
let insetsOff = null;
function watchInsets(S) {
  const top = $(".gbar", S),
    bot = [$(".bbar", S), $(".dock-b", S)];
  let turn = "",
    hi = [0, 0];
  /* during a turn they only grow (a bar that gets taller pushes the board in at once, so nothing is under it), and
     they go back to the bars' own heights when the next stage starts: the board doesn't keep growing and shrinking
     (the owner's, Nov 4) */
  const key = () => {
      const s = R && R.state;
      return s ? [s.phase, s.round, s.qi].join() : "";
    },
    set = () => {
      const k = key(),
        now = [
          top.offsetHeight,
          bot.reduce((a, e) => a + (e ? e.offsetHeight : 0), 0),
        ];
      const was = hi.join();
      hi = k === turn ? now.map((v, i) => Math.max(v, hi[i])) : now;
      turn = k;
      if (hi.join() === was) return;
      S.style.setProperty("--ui-top", hi[0] + "px");
      S.style.setProperty("--ui-bot", hi[1] + "px");
      geo = null; // (the board's new size: where the ducks stand is measured again)
    };
  const ro = new ResizeObserver(set);
  for (const e of [top, ...bot]) if (e) ro.observe(e);
  set();
  const t = setInterval(() => {
    if (key() !== turn) set();
  }, 500); // (a new stage with bars that didn't change size: back to their own heights. Only then: measuring the bars every half second made the page measure itself, and a busy round paid for it; the ResizeObserver sees every other change)
  return () => {
    ro.disconnect();
    clearInterval(t);
  };
}

const HINTS =
  "<kbd>WASD</kbd> Move <kbd>Shift</kbd> Sprint <kbd>Space</kbd> Jump <kbd>Enter</kbd> End turn";
/* a second line: a number key picks a weapon (the same key puts it away) and a click uses it; Shift and a number key keep
   a jump on (not in Mad God Justin or Quacky Zombies: their keys work their own way) */
const KEEP_HINT =
  '<i class="hints-br"></i><kbd>Number</kbd> Pick a weapon <kbd>Click</kbd> Use it <kbd>Shift</kbd>+<kbd>Number</kbd> Keep a jump on';
const L4_HINTS =
  "<kbd>WASD</kbd> Move <kbd>Shift</kbd> Sprint <kbd>Click</kbd> Attack <kbd>R</kbd> Reload" +
  '<i class="hints-br"></i><kbd>E</kbd> Use <kbd>6</kbd> Grenade'; // (E with it, so no key is split from its word; the grenades are the 6 key now, Nov 20, after the second item on 5; no B any more: the merchants never sell ammo, the owner's, Nov 18 13:46Z)
/* where a click attacks: on a computer anywhere on the game's screen but a button, a field, a card, a panel or a window
   (the board is the whole screen now, the owner's, Nov 4 07:43Z); on a touch screen only on the board */
const NOT_AIM =
  "button, a, input, textarea, select, label, summary, [role=button], [role=option], [role=slider], .topover, .sc-write, .wq-card, .dock-panel, .hotbar, .win-back, .pmenu, .votebox, .l4-over";
const aimHere = (e) =>
  !!e.target.closest &&
  (document.documentElement.classList.contains("keyboard") ||
    !!e.target.closest(".board")) &&
  !e.target.closest(NOT_AIM);
/* a left click that uses the weapon kept out */
function heldClick(e) {
  return (
    !!hand.held &&
    !!R &&
    (isMgj(R.state) || hasKey(playDuck(), hand.held)) &&
    e.button === 0 &&
    onBoardPhase() &&
    aimHere(e)
  );
}
/* a held trigger (autoPress, l4Press): it fires again and again until the left button is up. Every way a press can end
   lets go of it: the button coming up anywhere, the press cancelled or its capture lost, the window or the tab losing
   focus, the right-click menu, and any mouse event that says the left button isn't down any more (one missed button-up
   kept it firing the whole magazine and on: the owner's, Nov 17 13:07Z). Leaving the screen lets go too */
let trigger = null;
const TRIGGER_END = [
  "pointerup",
  "pointercancel",
  "lostpointercapture",
  "blur",
  "contextmenu",
];
function letGo() {
  if (!trigger) return;
  clearTimeout(trigger.t);
  for (const t of TRIGGER_END) removeEventListener(t, letGo, true);
  removeEventListener("pointermove", upYet, true);
  document.removeEventListener("visibilitychange", letGo);
  trigger = null;
}
const upYet = (e) => {
  if (e.pointerType === "mouse" && !(e.buttons & 1)) letGo();
};
/* hold the trigger: shoot() now, then again after each wait it gives back, until let go */
function holdTrigger(shoot) {
  letGo();
  trigger = { t: 0 };
  for (const t of TRIGGER_END) addEventListener(t, letGo, true);
  addEventListener("pointermove", upYet, true);
  document.addEventListener("visibilitychange", letGo);
  const go = () => {
    if (!trigger) return;
    const wait = shoot();
    if (trigger && wait) trigger.t = setTimeout(go, wait);
    else letGo();
  };
  go();
}
/* the SMG, the AK-47, the LMG and the chain gun kept out (outside Quacky Zombies; in Mad God Justin, picked up): the left button
   down fires, and again as soon as it can while the button stays down. In Mad God Justin every weapon does, as in Dead
   Ducks Arcade (l4Press): the owner's, Nov 17 19:11Z, "WHY IS IT THAT WHEN I HOLD DOWN TO FIRE THAT THE GUN DOESNT FIRE
   ... MAKE THE WEAPONS BEHAVE AS THEY DO IN THE ZOMBIE GAME MODE eEVEN FOR THE MAD GOD JUSTIN GAME MODE". The Chair and the
   Zebra cake, thrown things, still go once a click */
const repeats = (w) =>
  AUTO.includes(w) ||
  (!!w && !!R && isMgj(R.state) && !["zebra", "chair"].includes(w));
let autoDid = false;
function autoPress(e) {
  if (
    !R ||
    isL4dd(R.state) ||
    e.pointerType !== "mouse" ||
    !repeats(hand.held) ||
    !heldClick(e)
  )
    return;
  autoDid = true;
  holdTrigger(() => {
    if (!R || !repeats(hand.held) || !onBoardPhase()) return 0;
    fire(hand.held);
    return Math.max(60, coolFor(hand.held, R.state) / grCool(R.state, R.me)); // (Sandbox: a group's Cooldown speed)
  });
}
/* Quacky Zombies: the left mouse button down on the board uses the weapon in hand, and again as soon as it can while
   the button stays down */
function l4Press(e) {
  if (!R || !isL4dd(R.state) || e.pointerType !== "mouse" || e.button !== 0)
    return;
  if (!onBoardPhase() || !aimHere(e)) return;
  holdTrigger(() => {
    if (!R || !isL4dd(R.state)) return 0;
    const w = heldNow();
    if (w) fire(w);
    return Math.max(60, l4Cool(R.state, R.me, w));
  });
}
register("game", {
  guard: () => !!activeRoom(),
  /* the browser's Back in Single Player: back to its own lobby, never the online rooms */
  back() {
    const r = activeRoom();
    if (!r || !r.state.solo) return false;
    r.send({ t: "toLobby" });
    return true;
  },
  exit() {
    const r = activeRoom();
    if (r) {
      r.send({ t: "leave" });
      r.close();
    }
  },
  leave() {
    letGo(); // (a held trigger never fires on into the next screen)
    if (off) off();
    off = null;
    weaponsOff();
    setReloadsSeen({});
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
    npcDownAt = {};
    if (bar) bar.destroy();
    bar = null;
    if (meter) meter.remove();
    meter = null;
    if (pad) pad.destroy();
    pad = null;
    if (mbarOff) mbarOff();
    mbarOff = null;
    if (cabinEndOff) cabinEndOff();
    cabinEndOff = null;
    if (sbk) sbk.destroy();
    sbk = null;
    if (insetsOff) insetsOff();
    insetsOff = null;
    handReset();
    kept.clear();
    shows = {};
    setMouse(null);
    removeEventListener("mousemove", aimAt);
    removeEventListener("wheel", onWheel);
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
    document.removeEventListener("visibilitychange", hidden);
    removeEventListener("resize", resized);
    for (const t of ["pointerup", "pointercancel"])
      removeEventListener(t, unpeek);
  },
  render(arg) {
    R = arg || activeRoom();
    if (!R) return null;
    loadSounds("game"); // (the weapons' and the items' sounds: they work in every mode)
    S = el(`<section class="screen game docked">
      <header class="gbar"><div class="gbar-l"><span class="round"></span><span class="phase"></span></div>${musicBarHTML()}
        <div class="gbar-r"><span class="tmeter" hidden><i></i></span><span class="timer"></span>${fsBtnHTML()}<button type="button" class="btn ghost iconbtn" data-a="players" aria-label="Players" data-tip="Players (hold Tab)">👥</button>${lsetBtnHTML()}<button type="button" class="btn ghost iconbtn" data-a="pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header>
      <div class="map-layer"></div><div class="gmain"></div>${DOCK_HTML}${BAR_HTML(`<div class="gact"></div>${isSb(R.state) ? '<span class="ui-cs hints"><kbd>C</kbd> Cheat sheet</span>' : ""}`)}</section>`); // (with hide ui, in Sandbox, the one word left at the bottom: the owner's, Nov 19 12:59Z, "except for cheat sheet")
    docks = mountDocks(
      S,
      isL4dd(R.state)
        ? L4_HINTS
        : isHang(R.state)
          ? HINTS.replace("<kbd>Enter</kbd> End turn", "<kbd>E</kbd> Use") +
            KEEP_HINT
          : isMgj(R.state)
            ? HINTS.replace(
                "<kbd>Enter</kbd> End turn",
                "<kbd>Click</kbd> Stab",
              )
            : HINTS + KEEP_HINT,
    );
    mbarOff = mountMusicBar(S);
    insetsOff = watchInsets(S);
    pm = mountPlayers(S, () => R);
    cabinEndOff =
      isHang(R.state) || isSb(R.state) ? mountCabinEnd(S, () => R) : null; // (Sandbox: Leave Sandbox on every map)
    sbk = isSb(R.state)
      ? mountSandboxKeys(
          S,
          () => R,
          () => pm && pm.isOpen() && pm.close(),
          (cx, cy) => {
            // (Build: where on the map a click or tap lands, the same way walkTo reads it)
            if (!geo) measure();
            const board = S && origin($(".board", S));
            if (!board || !geo) return null;
            const r = board.getBoundingClientRect();
            return unplace(cx - r.left, cy - r.top);
          },
          (o) => {
            // (the other way: where a spot on the map is on the screen, for a block's handles and the selection box)
            if (!geo) measure();
            const board = S && origin($(".board", S));
            if (!board || !geo) return null;
            const r = board.getBoundingClientRect(),
              c = place(o, 0, 1);
            return { x: r.left + c.left, y: r.top + c.top };
          },
        )
      : null;
    placed = placeKey(R.state);
    idleOff = trackIdle(() => R);
    hooks.resetDuck = resetDuck;
    if (isL4dd(R.state)) {
      l4Held(heldNow); // (the fireplace asks which ranged weapon is in hand)
      const l4 = {
          state: () => R.state,
          me: () => R.me,
          held: heldNow,
          slot: handIn,
          pick: l4Pick,
          fire,
          grenade: () => l4Pick(5),
          flash: () => R.send({ t: "hang", k: "l4", do: "fl" }),
          to: l4To, // (the weapon I'm about to take: its slot lights up)
        },
        row = mountL4Bar(S, l4),
        slide = mountHotbar(S, l4Slider(l4));
      slide.slider.classList.add("on-duck"); // (on a phone in the bottom middle, and a swipe on my duck picks too, touch.js swipe; the owner's, Nov 18 15:18Z and Nov 19 10:22Z)
      bar = {
        row: row.row,
        slider: slide.slider,
        show: slide.show,
        hide: slide.hide,
        wheel: () => false,
        current: slide.current,
        nudge: slide.nudge,
        tapMid: slide.tapMid,
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
        keys: () =>
          R && sbHotOn(R.state)
            ? sbSlots(R.state, R.me).map((v) =>
                spawnOf(v) || specialById(v) ? v : null,
              )
            : keysOf(playDuck()), // (Sandbox: its spawn buttons too)
        own: (id) => (R && sbHotOn(R.state) ? sbLook(R.state, id) : null),
        sig: () => (R && sbHotOn(R.state) ? sbHotSig(R.state) : ""),
        full: () => !!R && sbHotOn(R.state), // (Sandbox: every slot shows, the empty ones too: hotbar.js)
        kept: keptNow,
        use: useKey,
        cool,
        duck: playDuck,
        ammo,
        dots,
        select: slidPick,
        tap: slidTap,
        current: () => {
          if (!R || !isMgj(R.state) || R.state.phase !== "boss") return null;
          mgjBackIfGone(R.state);
          return hand.held;
        },
        tag: () => S && S.querySelector(".gduck.mine .gduck-name"), // (the switch's box under my duck, on a phone: hotbar.js peekSwitch)
      });
      bar.slider.classList.add("on-duck"); // (on a phone in the bottom middle, and in every mode a swipe on my duck picks too, touch.js swipe; the owner's, Nov 18 20:58Z, "every", and Nov 19 10:22Z)
    }
    pad = mountPad({
      active: () =>
        onBoardPhase() &&
        !windowOpen() &&
        !!me &&
        (downGunNow() ||
          (!(R.state.players[R.me] || {}).dead &&
            !(isL4dd(R.state) && !(l4Hp(R.state, R.me) > 0)))),
      noJump: downGunNow, // (down: only the attack stick, for the down pistol)
      weapon: padWeapon,
      aim: (dx, dy) => {
        setKeyAim(dx == null ? null : [dx, dy]);
      }, // (let go: the weapon goes back to the way the duck faces; in Quacky Zombies the flashlight to the nearest zombie)
      attack: padAttack,
      jump: () => jump(),
      reloadOn: canReloadNow,
      reload: () => reload(),
    });
    meter = mountMeter();
    const stack = document.createElement("div");
    stack.className = "hb-stack";
    stack.append(...[bar.row, meter.el].filter(Boolean)); // (my HP meter under the hotbar; on a phone under the slider: css)
    docks.corner(pad.el, bar.slider, stack); // (on phones the slider in the bottom middle, and the jump and attack buttons over the board's bottom right; the row of keys on a computer)
    addEventListener("mousemove", aimAt);
    addEventListener("wheel", onWheel, { passive: false });
    touchOff = mountTouch(S, {
      active: () =>
        onBoardPhase() && !windowOpen() && !(world && world.grabbing()),
      walkTo,
      duckAt,
      getTarget: () => target,
      setTarget: (t) => {
        target = t;
      },
      hold: (x, y) => (!!sbk && sbk.hold(x, y)) || (!!bar && bar.wheel(x, y)), // (Sandbox: a placed thing's menu first)
      aim: (dx, dy) => {
        setKeyAim(dx == null ? null : [dx, dy]);
      }, // (a second finger dragging on the board aims, like the aim stick's: the owner's, Nov 18 15:18Z)
      swipe:
        bar && bar.nudge
          ? {
              on: () => getComputedStyle(bar.slider).display !== "none", // (a phone: the slider is there, on my duck; never with the computer's row)
              nudge: (d) => {
                bar.nudge(d);
                if (R && isL4dd(R.state)) l4PeekAgain(); // (Dead Ducks Arcade's own box under my duck shows, even at the end of the row; the other modes' is the hotbar's)
              },
              tap: bar.tapMid,
            }
          : null, // (every mode's hotbar: the owner's, Nov 18 20:58Z)
    });
    S.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType !== "mouse") touchedAt = performance.now();
      },
      true,
    );
    S.addEventListener("pointerdown", holdDown);
    for (const t of ["pointerup", "pointercancel"])
      addEventListener(t, holdEnd);
    S.addEventListener("pointerdown", l4Press);
    S.addEventListener("pointerdown", autoPress);
    S.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".wq-card.mine")) {
        e.preventDefault();
        peek(true);
      }
    });
    for (const t of ["pointerup", "pointercancel"]) addEventListener(t, unpeek);
    S.addEventListener("click", (e) => {
      if (isTv(R.state) && tvFormClick(e, R.state, () => sendDraft())) return; // (Trivia's question window: a mark, +, ×, Written Answer)
      const b = e.target.closest("[data-a]");
      if (b && !b.disabled && holdBtn(b)) return; // (a vote or a use button: it acts when held, holdStart below)
      if (b && !b.disabled) {
        if (b.dataset.a === "pause") openPause();
        else if (b.dataset.a === "lset") openLobbySettings(R);
        else if (b.dataset.a === "spec") spec(+b.dataset.d);
        else {
          if (b.dataset.a === "hang" || b.classList.contains("vote-btn"))
            sfx.holdClick(); // (the use button, and the Vote button when Hold to vote is off: no hold, still the click)
          act(b.dataset.a);
        }
        return;
      }
      if (isL4dd(R.state) && e.target.closest(".board")) {
        if (e.target.closest(".l4-over")) return;
        if (performance.now() - touchedAt < 900) boardClick(e);
        return;
      } // (Quacky Zombies: the mouse button fires as it goes down, l4Down below; a tap walks)
      if (heldClick(e)) {
        if (autoDid && repeats(hand.held)) autoDid = false;
        else fire(hand.held); // (a gun that fires while the mouse button is down already did: autoPress)
        return;
      } // a weapon kept out: a left click uses it
      const mc = e.target.closest("[data-col]");
      if (mc) {
        jumpTo(+mc.dataset.col);
        return;
      }
      const tr = e.target.closest(".tv-row[data-i]");
      if (tr && R.state.phase === "tvq" && performance.now() - touchedAt < 900)
        R.send({ t: "tv", k: "pick", i: +tr.dataset.i }); // (Trivia on a touch screen: a tap on an answer votes, and the duck walks there)
      const tc = e.target.closest("[data-topic]");
      if (tc) {
        R.send({ t: "pick", i: +tc.dataset.topic });
        return;
      }
      const lc = e.target.closest(".law-cand");
      if (lc) {
        R.send(
          ATT_PHASES.includes(R.state.phase)
            ? { t: "attvote", who: lc.dataset.who }
            : { t: "counsel", role: lc.dataset.role, who: lc.dataset.who },
        );
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
      if (e.target.matches(".tv-form")) {
        // Trivia: a question, checked here first (the host checks it again)
        e.preventDefault();
        const f = e.target,
          q = formQ(f),
          bad = formProblem(R.state, q),
          err = f.querySelector(".tv-err");
        if (bad) {
          err.textContent = bad[1];
          err.classList.remove("shake");
          void err.offsetWidth;
          err.classList.add("shake");
          const box = bad[0] && f.querySelector("." + bad[0]);
          if (box) box.focus();
          return;
        }
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "submit", q });
        return;
      }
      if (e.target.matches(".tv-ansform")) {
        // Trivia: my written answer
        e.preventDefault();
        const box = e.target.querySelector(".tv-win");
        if (!box.value.trim()) {
          box.focus();
          return;
        }
        clearTimeout(draftT);
        draftT = 0;
        R.send({ t: "submit", text: box.value });
        return;
      }
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
      if (e.target.matches(".tv-win")) {
        if (tvTyped(S, R.state, R.me, e.target.value)) geo = null; // (my row grew: measured again)
        sendDraft();
        return;
      } // (Trivia: my answer shows in my row as I type it)
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
      if (e.target.matches(".sc-in, .tv-win") && e.key === "Enter") {
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
    const lset = lsetWatch(S); // (the Lobby Settings button's blink and "!", and the Democracy note)
    lset(R.state);
    off = R.on((s) => {
      if (!S) return;
      if (s.phase === "lobby" || s.phase === "countdown") {
        go("lobby", R);
        return;
      }
      if (placeKey(s) !== placed) {
        go("game", R); // (Random going into Duck Cabin or out of it: the screen again, on the new map)
        return;
      }
      paint();
      lset(s);
    });
    addEventListener("keydown", keydown);
    addEventListener("keyup", keyup);
    addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    addEventListener("resize", resized);
    raf = requestAnimationFrame(loop);
    tick = setInterval(showTimer, 250);
    requestAnimationFrame(() => paint(true));
    return S;
  },
});

/* the picked weapon's window reads these through getters (it is called from the hand's files, which load before this one) */
pickWith({
  get R() {
    return R;
  },
  get me() {
    return me;
  },
  get bar() {
    return bar;
  },
  sendMove,
  fire,
  myPick,
  mgjDownGun,
  onBoardPhase,
  playDuck,
  turned,
});
export { follows, geo, hotdogs }; // (what the files moved out of here read)

export { scZone }; // (what the files moved out of here read)
