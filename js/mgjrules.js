import { r3, walkTo, fxOf } from "./justinmoves.js";

import { hpHurt, hundredths, hpBreed } from "./hpmath.js";

import { jumpDodges } from "./jump.js";

/* ---------- the rules of Mad God Justin ----------
   A boss fight: every duck has the knife (1), the pistol (2: it never reloads, in place of the bow, the owner's,
   Nov 16), the weapon it picked
   up (3) and the zebra cake (4, shared too); whatever it switches to stays out in its hand, and a picked-up
   weapon used up goes back to the one out before. Together they must bring Justin's HP to 0 (no time limit: the owner's,
   Nov 3; every win counts toward the lightning eyes). His HP is hpOf (below) when the fight starts, and one
   stab takes 1. Each duck has 6 HP (the lobby's Player HP); after any hit nothing can hurt it for a second (it
   flickers), and a duck out of HP stays down until another holds E by it for 2.5 s (REVIVE) or the fight's end. He never goes after a duck that's down. A jump dodges everything but
   in its first and last fifth (jump.js jumpDodges).
   - His guns (the owner's, Nov 3: no more pistol): the LMG and the SMG fire bursts at a duck (each bullet takes 1 HP),
     and the pump shotgun a cone of pellets at a duck close enough. After each burst he reloads; while he reloads he
     sprints at a duck to hammer it, and a duck that comes up close gets the hammer too. He walks faster than before and
     every attack comes sooner (PACE).
   - His throws, each held up first (the tell): the controllers every way at once and the office chair. (No fireball any
     more: the owner's, Nov 18 10:38Z, "we are removing the fireball from everything in the game".)
   - The edge lightning, every 10 s by itself: the board's edges glow for 0.6 s, then a flash runs along them and hits
     every duck there (not him).
   - When he touches the board's edge he flashes blue and jumps to a spot far from it, once every 15 s at most.
   - Once a minute, at a random moment, his double for 7 s: one of the two does no harm, and hits on that one count for
     nothing.
   - Now and then he stops to eat something (only a look). A thrown zebra cake he chases until it lands at the edge, then
     eats it, and does nothing else meanwhile.
   - The meteor, once a fight, when he's down to MET_AT HP: he shouts one of his GOD lines and fades away, a meteor
     lands and knocks every duck down for 5 seconds, he gets MET_HEAL HP back and his attacks get faster again, then he
     fades in again pumping his shotgun.
   - HP 0: he stays where he is and lightning strikes him, and he stays burnt while it shows. Every duck out of
     HP: he wins and says a winning line. Then the stats (Most Damage, Killing Blow, Hit the Most, the jumps) with Try again or Back to the
     lobby.
   - Every 15 seconds something fades in somewhere on the board (PICKS, with the owner's odds): a gun a duck picks up
     by walking over it and keeps until its shots are gone, or the medkit; lightning or fire, or a meteor, that hit him as
     soon as they show; or Good Justin God, a helper with a halo, 6 HP and a knife, who stabs him too. He has no lines of
     his own: he shouts Justin's god lines at him, and cheers with Justin's winning lines when he dies.
   He's the Justin option's board Justin (boardjustin.js: s.justin, justinAt, his look, lines and bullets); this file is
   his brain here. s.mgj = { hp, max, n (the fight's number), dmg {id: stabs}, hits {id: times he knocked them down},
   kill, won, met (the meteor now: { at, fx, hit, back }), metDone, shotgun, over, and the rework's: burn and burnt {id: until}, edgeAt (the
   next edge flash), edgeLast, dup (his double: { at, until, fake: 0 him, 1 the double }), rv {reviver: { id, at }}, cake, zebraAt }. */
import {
  enter,
  lostRound,
  playing,
  seatLate,
  needed,
  say,
  aimOf,
} from "./rules.js";

import { justinAt, JUSTIN_ID } from "./boardjustin.js";

import { zombieTakes, pierceOf, ALL_HP } from "./l4ddrules.js";

import { ARMS, GUN_BREEDS, MGJ_GUNS, MGJ_MELEE } from "./guns.js";

import { ZOMBIE_BREEDS, boardWalk, zLook } from "./zombies.js";

import { holdDown, onGetUp, invuln, hurtFx } from "./hangout/death.js";

import { sbOnBoard } from "./sandboxrules.js";

import { hitWounds, WOUND_BREEDS } from "./wounds.js";

import { MAD } from "./sbbrain.js";

import { grudge } from "./npcrules.js";

import { npcBody, duOf } from "./sbbody.js";

import { DEATH_LINES, GOD_LINES, WIN_LINES } from "./hangout/justin.js";

import { shuffle } from "./random.js";

export const isMgj = (s) => s.options.mode === "mgj";
/* no time limit (the owner, Nov 3): the fight goes on until he's at 0 HP or every duck is out of HP. What his HP sets off:
   the Xbox once he's down to XB_AT of his HP, the meteor once he's down to MET_AT of it (it gives MET_HEAL back) */
export const XB_AT = 2 / 3, // (the Xbox once he's at or under this fraction of his HP: the owner's, Nov 17)
  MET_AT = 1 / 3, // (the meteor once he's at or under this fraction)
  MET_HEAL = 20;
/* each time his attacks get faster (the Xbox, then the meteor: j.fast counts them), they come FAST_SOON times as soon
   and the controllers and the chair fly FAST_FLY times as fast; his bullets keep their speed */
export const FAST_SOON = 0.7,
  FAST_FLY = 1.25;
const MGJ_END = 9; // seconds of the podium (or his winning line), then the stats
export const MGJ_ZAP = 1600; // ms into a win: lightning strikes him where he stands
export const MGJ_DOWN = 5000; // ms a hit duck stays down
/* (owner 2026-11-03 22:21Z) he's slightly bigger than a duck here, and his hammer bigger, everywhere he swings it */
export const MGJ_SCALE = 1.2; // Justin and his double against a duck, in Mad God Justin
export const MGJ_HAMMER = 1.35; // Justin's hammer against a duck's, on top of his size
/* his HP (the owner's, Nov 16: he must be really hard): four times his old HP for one duck (40), then half that old HP
   again for every duck in the fight. BASE: his old HP for one duck; X: how many times it he starts with; PER: how much
   of it each duck adds */
const MGJ_HP = { BASE: 40, X: 4, PER: 0.5 };
const hpOf = (n) =>
  Math.round(MGJ_HP.BASE * MGJ_HP.X + MGJ_HP.BASE * MGJ_HP.PER * n);
/* Player HP (in the lobby's Additional settings): on by default at 6; off, or 1, 5, 6, 10 or 15. A hit from Justin
   takes 1 HP and the duck stays up; the hit that takes its last HP knocks it down, and it stays down until a revive or
   the fight's end (won or lost); when every duck is out, Justin wins. After any hit nothing can hurt the duck for
   SOAK_MS (it flickers, game.js). s.mgj.lost = { id: HP lost }, s.mgj.out = { id: when its HP ran out }, s.mgj.safe =
   { id: until when nothing hurts it } */
const MGJ_PHP = [1, 5, 6, 10, 15];
const SOAK_MS = 1000;
export const mgjSafe = (s, id, now) =>
  (((s.mgj || {}).safe || {})[id] || 0) > now;
export const mgjPHp = (s) =>
  isMgj(s) && MGJ_PHP.includes(+s.options.mgjHp) ? +s.options.mgjHp : 0;
/* its HP (hpmath.js): in the fight, his and every seated duck's; a heal is the board's */
hpBreed("mgj", {
  of(s, id, now, seated) {
    if (s.phase !== "boss" || !s.mgj) return null;
    if (id === JUSTIN_ID) return [Math.max(0, s.mgj.hp), s.mgj.max];
    if (!seated) return null;
    const most = mgjPHp(s),
      lost = (s.mgj.lost || {})[id] || 0;
    return [s.players[id].dead ? 0 : Math.max(0, most - lost), most];
  },
  /* the bar over a duck in the fight (hpmath.js hpBarOf): Player HP, if it's on; Justin's is the big one */
  bar(s, id, now, seated) {
    const most = mgjPHp(s);
    if (!seated || !most || s.phase !== "boss" || !s.mgj) return null;
    return { hp: Math.max(0, most - ((s.mgj.lost || {})[id] || 0)), most };
  },
});
/* a hit from Justin on duck id: true when its HP took it (the duck stays up), false when it goes down */
export function mgjSoak(s, id, now, dmg = 1) {
  const max = mgjPHp(s),
    m = s.mgj,
    P = s.players[id];
  if (invuln(s) && m && P && !P.dead && s.phase === "boss")
    return hurtFx(s, id, now); // (Invulnerability: the hit only flashes)
  if (!max || !m || !P || P.dead || s.phase !== "boss") return false;
  if (((m.safe || {})[id] || 0) > now) return true;
  m.safe = { ...m.safe, [id]: now + SOAK_MS };
  const lost = hundredths(((m.lost || {})[id] || 0) + dmg); // (the office chair takes 2, owner 2026-11-03 17:15Z; in hundredths, up while any HP is left: hpmath.js)
  if (lost >= max) {
    const rest = { ...m.lost };
    delete rest[id];
    m.lost = rest;
    m.out = { ...m.out, [id]: now };
    return false;
  }
  m.lost = { ...m.lost, [id]: lost };
  return true;
}
/* my own grenade's blast on me: half my HP, rounded down, and never down by it (the owner's, Nov 16); true when it took
   any */
export function mgjHalf(s, id, now) {
  const max = mgjPHp(s),
    m = s.mgj,
    P = s.players[id];
  if (!max || !m || !P || P.dead || s.phase !== "boss") return false;
  const lost = (m.lost || {})[id] || 0,
    cut = Math.floor((max - lost) / 2);
  if (!cut) return false;
  m.lost = { ...m.lost, [id]: hundredths(lost + cut) };
  hurtFx(s, id, now);
  return true;
}
/* however it went down (his meteor too), a duck stands up with the HP it had; one out of HP stays down (true: it stays) */
export const mgjOut = (s, id) =>
  !!(isMgj(s) && s.mgj && s.mgj.out && s.mgj.out[id]);
onGetUp((s, id) => {
  const m = s.mgj;
  return !!(
    m &&
    ((mgjOut(s, id) && s.phase === "boss") ||
      (m.allOut && ["mgjend", "results"].includes(s.phase)))
  ); // (every duck out: they stay down through the ending and the stats)
});
/* the meteor, in ms from its start: he's faded out by FADE; the meteor shows from FALL and lands at LAND; he's back at
   BACK and the timer runs again at RESUME */
export const MET = {
  FADE: 1000,
  FALL: 1400,
  LAND: 2900,
  BACK: 6200,
  RESUME: 8000,
};
export const PUMP = 1750,
  PELLETS = 5,
  PELLET_SPEED = 0.3,
  PELLET_LIFE = 1400,
  SPREAD = 0.34;
/* his guns' bursts (the owner's, Nov 3, in place of the pistol): n bullets, one every gap ms, each a little off the aim
   (spread, radians); then a reload of reload ms. Each bullet takes 1 HP (rules.js: mgjSoak). PACE: how much sooner every
   attack of his comes than it used to (the owner: way faster), on top of the Xbox's 0.7 */
/* his charge (the owner's, Nov 3): every 10 s or so (sooner with his faster attacks) he crouches for DASH_TELL
   (the tell, a red shake), then sprints at DASH_V board widths a second to where the duck stood when the tell ended;
   a duck in his way flies DASH_FAR times the hammer's distance, with no damage. Walking off his line or jumping dodges it */
export const DASH_TELL = 600,
  DASH_V = 0.55,
  DASH_FAR = 1.6, // (times the hammer's KB_FAR: rules.js isn't loaded yet when this file is, so it's multiplied where it's used)
  DASH_R = 1.1; // (how near his path a duck is hit, in duck lengths, times his size)
export const BURST = {
    lmg: { n: 10, gap: 100, spread: 0.07, reload: 2600 },
    smg: { n: 8, gap: 80, spread: 0.12, reload: 1800 },
  },
  JUSTIN_SHOT = 0.22, // (his bullets' speed, board widths a second: the owner, his bullets never fly faster)
  SG_ODDS = 0.35, // (a duck close enough: how often he takes the shotgun instead of a burst)
  PACE = 0.6,
  HAMMER_TELL = 350, // ms he winds up his hammer up close (the owner's, Nov 17 13:07Z: the hints should not be as long)
  GUN_TELL = 300; // ms he aims before a burst or the shotgun (game.js draws his aim; shorter, the owner's, Nov 17 13:07Z)
/* his throws (the owner's): now and then 8 Xbox One controllers every way at once, bullet hell, to dodge; less often a
   big black office chair at a duck, slow but wide, that knocks down and shoves back like the hammer. Each is held up
   first (the tell), so there's time to move */
export const THROW_TELL = 800, // ms the controllers are held up before they fly
  CTL_N = 8,
  CTL_SPEED = 0.19, // board widths a second (owner 2026-11-03 22:13Z: his attacks way faster; was 0.15)
  CTL_LIFE = 9000,
  CHAIR_TELL = 1100,
  CHAIR_SPEED = 0.11, // (was 0.085)
  CHAIR_LIFE = 16000;
/* a burning duck (the rework, the owner's, Nov 3) burns for BURN_MS and looks burnt for BURNT_MS, and while it burns it
   lights every duck it touches (TOUCH duck lengths). His fireball, that set it burning, is gone (the owner's, Nov 18
   10:38Z: "we are removing the fireball from everything in the game") */
const BURN_MS = 3500,
  BURNT_MS = 7000,
  TOUCH = 1.1;
/* the edge lightning: every EDGE_EVERY ms the edges glow for EDGE_WARN ms, then the flash hits every duck
   within EDGE of the board's edge (in board widths and heights). Less often, with a longer warning (the owner's, Nov 17
   11:07Z: "Make lightning less frequent", "more of a hint"; it was every 10 s, warned 0.6 s before) */
export const EDGE_EVERY = 18000,
  EDGE_WARN = 1200,
  EDGE = { x: 0.05, y: 0.1 };
const onEdge = (p) =>
  p.x < EDGE.x || p.x > 1 - EDGE.x || p.y < EDGE.y || p.y > 1 - EDGE.y;
/* his teleport: when he's at the edge (WALL) he jumps to a spot far from it, once every TP_EVERY ms at most */
export const WALL = { x: 0.065, y: 0.09 },
  TP_EVERY = 15000;
/* his double: after every teleport, for DUP_MS */
const DUP_MS = 7000;
/* now and then he eats: for EAT_MS, once every 30 to 45 s; the zebra cake he eats for CAKE_EAT_MS. Each time he
   finishes eating he gets 1 HP back (owner 2026-11-03 23:17Z), never past his most */
export const ateHp = (m) => {
  if (m && m.hp > 0) m.hp = Math.min(m.max, m.hp + 1);
};
export const EAT_MS = 2000,
  CAKE_EAT_MS = 2500,
  FOODS = ["zebra", "pizza", "donut"];
/* the zebra cake: shared by everyone, one throw every CAKE_EVERY ms; it flies at CAKE_SPEED until the board's edge */
export const CAKE_EVERY = 30000,
  CAKE_SPEED = 0.45;
/* what the ducks hold here (rules.js' move: w), and the cooldowns of their own here: the knife and the pistol, as fast
   as in every mode */
const MGJ_HOLD = [MGJ_MELEE, "handgun"];
/* what a duck can have out in its hand here (rules.js' move: w): the knife, the bow, the zebra cake, or the weapon it
   picked up (the owner's, Nov 3: whatever it switches to stays out) */
export const mgjHolds = (s, id, w) =>
  MGJ_HOLD.includes(w) ||
  w === "zebra" ||
  (!!w && !!s.mgj && (s.mgj.held || {})[id] === w);
export const mgjCool = (sp) =>
  GUN_BREEDS.mgj.cool[sp] || (MGJ_GUNS.includes(sp) ? ARMS[sp].cool : 0); // (a gun picked up: Quacky Zombies' own)
/* getting a downed duck up (the owner's, Nov 3, in place of the medkit): stand within REVIVE.REACH duck lengths of it and
   hold E (a phone: the Revive button) for REVIVE.MS (3 s, always: the owner's, Nov 17 11:19Z; it was 2.5 s); with the
   medkit picked up out in my hand it's at once (the owner's, Nov 16) */
export const REVIVE = { MS: 3000, REACH: 2 };
/* the Xbox (the owner's): once a game, once he has lost XB_LOST HP, a desk comes in with his Xbox and a monitor on it;
   he runs to it and turns the Xbox off (the light and the screen go dark), fades away, as for the meteor, and comes back
   with faster attacks and his HP up by 1, and 1 more for every player (never past full). XB: ms the desk takes to come
   in, from the switch-off to fading out, to coming back; the desk's fade out */
export const XB = { IN: 900, FADE: 500, GONE: 3400, OUT: 1200 };
export const SPEED = 0.25, // (owner 2026-11-03 22:13Z: he moves faster; was 0.2)
  RX = 0.03,
  RY = 0.08;
export const DUCK_LEN = { x: RX, y: RY }; // (a duck length, in board widths and heights: game.js' hints)
/* the pickups: every PICK_EVERY ms one fades in, picked by these odds (the owner's, in percent): "sky" is lightning or
   fire (half and half) and hits him as it shows, as the meteor does (1 damage); "good" is Good
   Justin God. A weapon waits until a duck walks over it or the next one comes */
export const PLUS_LIFE = 10000,
  PLUS_EVERY = 30000, // (the owner's, Nov 17: a little plus sign every 30 s, +1 HP to the duck that walks over it)
  PLUS_CHANCE = 1 / 3, // (… but not common, the owner's, Nov 17 13:43Z: every 30 s only a 1 in 3 chance, so about one a minute and a half)
  PICK_EVERY = 15000,
  PICK_FADE = 700,
  PICK_HIT = 1100, // ms after it shows: lightning or fire strikes him, the meteor starts to fall, Good Justin comes
  PICK_LAND = 1500, // the meteor's fall
  PICKS = [
    ["good", 1],
    ["meteor", 2.5],
    ["sky", 5],
  ]; // (the rarest first: the owner's, Nov 18 10:38Z; the guns and the medkit come from their bags: pickKind)
export const PICK_WEAPONS = [...MGJ_GUNS, "medkit"];
/* the shots a gun picked up comes with (the owner's, Nov 17): only its one magazine, the shotgun never runs out, the LMG 30 */
export const INF_AMMO = 9999; // (the shotgun picked up never runs out: the owner's, Nov 17; a number, as the state is JSON)
export const pickAmmo = (k) =>
  k === "shotgun" || k === "laser"
    ? INF_AMMO // (the Laser Rifle never runs out anywhere: it only overheats)
    : k === "lmg" || k === "chaingun"
      ? 30 // (the LMG and the chain gun only 30 rounds here: the owner's, Nov 17)
      : (mgjMag(k) || [ARMS[k].all])[0]; // (every other gun only its one magazine)
/* a gun's magazine here ([shots, reload ms], or null): guns.js GUN_BREEDS.mgj */
export const mgjMag = (k) =>
  !MGJ_GUNS.includes(k)
    ? null
    : ARMS[k].mag
      ? [ARMS[k].mag, ARMS[k].reload]
      : GUN_BREEDS.mgj.mag[k] || null;
/* the shots left in the gun duck id picked up (0: none, or it holds something else) */
export const ammoOf = (s, id) =>
  (s.mgj &&
    MGJ_GUNS.includes((s.mgj.held || {})[id]) &&
    (s.mgj.ammo || {})[id]) ||
  0;
/* one shot from the gun picked up; the last one and it's gone (back to the one out before) */
export function mgjSpend(s, id) {
  const m = s.mgj,
    left = ammoOf(s, id) >= INF_AMMO ? INF_AMMO : ammoOf(s, id) - 1;
  if (left > 0) m.ammo = { ...m.ammo, [id]: left };
  else dropHeld(m, id);
}
export function dropHeld(m, id) {
  for (const k of ["held", "uses", "ammo"]) {
    const rest = { ...(m[k] || {}) };
    delete rest[id];
    m[k] = rest;
  }
}
/* how many uses a picked-up weapon gives (none of the guns: they count shots instead) */
export const PICK_USES = {};
/* how much each hit takes off him (we decided: a picked-up weapon hits harder than the knife; each pellet 1) */
export const DMG = {
  knife: 1,
  sword: 1,
  hammer: 2,
  dagger: 2,
  handgun: 1, // (the pistol everyone has)
  pellet: 1,
  arrow: 1,
  ak: 2, // (a bullet from a picked-up gun hits him as it hits a zombie: shotDmg reads l4ddrules.js ARMS first)
  lmg: 1,
  tommy: 1,
  ump: 2, // (the UMP-45: 2 a bullet)
  chain: 1, // (the chain gun 1 a bullet here, not all his HP)
  laser: 1, // (the Laser Rifle's beam)
  lgren: 3, // (the grenade launcher's blast)
  lightning: 2,
  fire: 2,
  meteor: 1,
};
export const GOOD_ID = "goodjustin",
  GOOD_NAME = "Good Justin God",
  GOOD_HP = 6;
export const SKY_ID = "sky"; // (the pickups' lightning, fire and meteor, in the damage and the killing blow)
export const rnd = (a, b) => a + Math.random() * (b - a);
export const any = (xs) => xs[Math.floor(Math.random() * xs.length)];

/* is the fight paused (the meteor falling, or his Xbox off)? */
export const mgjFrozen = (s) =>
  !!(s.mgj && (s.mgj.met || (s.mgj.xb && s.mgj.xb.off && !s.mgj.xb.done)));
/* is he faded out (the meteor, or his Xbox turned off)? */
/* the fight starts with him not there: for SPAWN_MS his avatar fades in with a red glow, and only then can he attack or
   be hit (owner, Nov 16: three seconds) */
export const SPAWN_MS = 3000;
export const mgjSpawning = (s, now) => now < ((s.mgj || {}).spawn || 0);
export const mgjGone = (s, now) => {
  const m = s.mgj && s.mgj.met,
    x = s.mgj && s.mgj.xb;
  return (
    mgjSpawning(s, now) ||
    (!!m && now - m.at >= MET.FADE * 0.5 && now - m.at < MET.BACK) ||
    (!!x && !!x.off && !x.done && now - x.off >= XB.FADE)
  );
};

/* the fight starts (from the countdown, or Try again) */
export function mgjStart(s, now) {
  seatLate(s);
  const ids = playing(s),
    n = Math.max(1, ids.length),
    max = hpOf(n);
  s.mgj = {
    n: ((s.mgj && s.mgj.n) || 0) + 1,
    hp: max,
    max,
    cnt: n, // (the ducks his HP was counted for: one who joins mid-fight adds its share, mgjAdvance)
    dmg: {},
    hits: {},
    kill: null,
    won: null,
    met: null,
    metDone: false,
    spawn: now + SPAWN_MS,
    left: 0,
    shotgun: true, // (the owner: he has the shotgun from the start now)
    over: 0,
    pickAt: now + PICK_EVERY,
    plusAt: now + PLUS_EVERY,
    plus: null,
    // I want his Xbox turned off only once a game, and only after the first 45 seconds: a new fight ("Try again")
    // keeps it off
    xbUsed: !!(s.mgj && s.mgj.xbUsed),
    xb: null,
    pickN: 0,
    pick: null,
    held: {},
    uses: {},
    gj: null,
    burn: {},
    burnt: {},
    edgeAt: now + EDGE_EVERY,
    edgeLast: 0,
    dup: null,
    rv: {},
    cake: null,
    zebraAt: 0,
  };
  s.mz = { zb: [], n: 0, on: 0, next: now + waveGap(n), left: 0, sp: 0 }; // (his zombie waves: wavesTick)
  s.pos = {};
  s.lock = {};
  s.shots = [];
  s.down = {};
  s.up = {};
  delete s.pos[GOOD_ID];
  for (const id of s.seat) if (s.players[id]) delete s.players[id].dead;
  s.seat.forEach((id, k) => {
    s.pos[id] = {
      x: r3(0.14 + 0.08 * (k % 2)),
      y: r3((k + 1) / (s.seat.length + 1)),
    };
  });
  s.justin = {
    x0: 0.84,
    y0: 0.5,
    x1: 0.84,
    y1: 0.5,
    t: now,
    v: SPEED,
    k: null,
    list: (s.justin && s.justin.list) || [],
    gods: (s.justin && s.justin.gods) || [],
    w: "lmg",
    mag: { n: 0, r: 0 },
    fireAt: now + SPAWN_MS + 2500 * PACE,
    hamAt: now + SPAWN_MS + 5000 * PACE,
    ctlAt: now + SPAWN_MS + rnd(9000, 13000) * PACE,
    chairAt: now + SPAWN_MS + rnd(18000, 26000) * PACE,
    dashAt: now + SPAWN_MS + rnd(6000, 9000) * PACE,
    tpAt: 0,
    eatAt: now + rnd(25000, 40000),
    sgR: 0,
    next: now + SPAWN_MS + 1500,
    say: now + rnd(9000, 16000),
    ouch: 0,
  };
  enter(s, "boss", now);
  s.ends = 0; // (no time limit)
  say(s, `Defeat Justin! He has ${max} HP.`);
  return s;
}

/* a duck stabbed him: 1 damage (none while he's faded out, or once the fight is over) */
export function mgjStab(s, by, now, log, n = 1) {
  const m = s.mgj;
  if (!m || s.phase !== "boss" || m.hp <= 0 || mgjGone(s, now) || m.met)
    return false;
  n = Math.min(n, m.hp);
  m.hp -= n;
  m.dmg = { ...m.dmg, [by]: (m.dmg[by] || 0) + n };
  m.flash = now; // (his red flash)
  const j = s.justin;
  if (m.hp <= 0) {
    m.kill = by;
    return true;
  }
  if (now > (j.ouch || 0) && Math.random() < 0.3) {
    j.ouch = now + 3500;
    log(s, { npc: JUSTIN_ID, name: "Justin", text: any(DEATH_LINES) });
  }
  return true;
}
/* he knocked a duck down (a bullet, a pellet, the hammer, the sky): counted for Hit the Most */
export function mgjHurt(s, id) {
  const m = s.mgj;
  if (m && s.phase === "boss" && (s.players[id] || {}).dead)
    m.hits = { ...m.hits, [id]: (m.hits[id] || 0) + 1 };
}

/* the owner (Nov 17): his HP must grow with the players. A duck who joins mid-fight adds its share (to his full HP and
   to what he has left); one who leaves takes nothing away. Called when a duck joins (rules.js) and as the fight goes */
export function mgjCount(s) {
  const m = s.mgj,
    n = playing(s).length;
  if (!m || s.phase !== "boss" || n <= (m.cnt || 1)) return false;
  const more = hpOf(n) - hpOf(m.cnt || 1);
  m.max += more;
  m.hp += more;
  m.cnt = n;
  return true;
}

/* what ends a stage: HP 0 (a win) or the timer (a loss); the podium's time; Try again on the stats */
export function mgjAdvance(s, now, force, log) {
  const m = s.mgj;
  if (!m) return s;
  if (s.phase === "boss") {
    if (m.hp <= 0) return mgjEnd(s, now, true, log);
    const on = playing(s);
    mgjCount(s);
    if (mgjPHp(s) && on.length && on.every((id) => mgjOut(s, id)))
      return mgjEnd(s, now, false, log, true); // (every duck is out of HP: Justin wins)
    if (force) return mgjEnd(s, now, false, log);
    return s;
  }
  if (s.phase === "mgjend")
    return force || (s.ends && now >= s.ends) ? enter(s, "results", now) : s;
  if (s.phase === "results") {
    const on = playing(s),
      d = on.filter((id) => s.done[id]).length;
    if (force || d >= on.length || d >= needed(s)) {
      s.round++;
      return mgjStart(s, now);
    }
  }
  return s;
}
function mgjEnd(s, now, won, log, allOut = false) {
  const m = s.mgj,
    j = s.justin,
    line = (text) => log(s, { npc: JUSTIN_ID, name: "Justin", text });
  m.won = won;
  m.over = now;
  s.mz = null; // (his zombies go with the fight)
  /* every duck out of HP: they all lie dead until the next fight starts (the dead look, no new art); otherwise the
     ducks out of HP get up: the fight is over */
  m.allOut = !won && allOut;
  if (m.allOut) {
    for (const id of playing(s))
      if (s.players[id] && s.pos[id]) s.players[id].dead = true;
  } else
    for (const id of Object.keys(m.out || {}))
      if (s.players[id]) delete s.players[id].dead;
  m.out = {};
  if (m.xb && !m.xb.done) m.xb.done = now;
  m.met = null;
  m.left = 0;
  s.shots = [];
  delete j.swing;
  delete j.tell;
  delete j.dash;
  delete j.eat;
  m.dup = null;
  m.cake = null;
  m.burn = {};
  if (won) {
    // he stays where he is (no podium: the owner's, Nov 20 18:23Z), and the lightning strikes him there
    const at = justinAt(j, now);
    walkTo(j, at, at, now, SPEED);
    j.w = "";
    if (m.gj) m.gj.down = 0; // (Good Justin God gets up to cheer)
    /* at 0 HP he dies there (game.js: lying, bleeding, no more crying), and the dead say nothing (the owner's, Nov 18
       12:19Z: "justin cannot make dialog when outright dead in zombies or mad god justin"): no losing lines */
    s.mgjWinN = (s.mgjWinN || 0) + 1;
    s.mgjWins = [
      ...(s.mgjWins || []).slice(-9),
      { n: s.mgjWinN, ids: playing(s), def: true }, // (no time limit now: every win counts)
    ]; // (each device counts its own win once: unlocks.js)
  } else {
    const at = justinAt(j, now);
    Object.assign(j, {
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(at.x),
      y1: r3(at.y),
      t: now,
    });
    line(any(WIN_LINES));
    lostRound(s, playing(s), "mgj");
  }
  s.mgjPast = [
    ...(s.mgjPast || []),
    {
      round: s.round,
      n: m.n,
      won,
      max: m.max,
      hp: Math.max(0, m.hp),
      dmg: { ...m.dmg },
      hits: { ...m.hits },
      kill: m.kill,
      ids: playing(s),
    },
  ];
  say(
    s,
    won
      ? `Justin is defeated!${m.kill && s.players[m.kill] ? ` ${s.players[m.kill].name} got the killing blow.` : ""}`
      : `Justin Wins with ${m.hp} HP left.`,
  );
  enter(s, "mgjend", now);
  s.ends = now + MGJ_END * 1000;
  return s;
}
/* ---------- Good Justin God ---------- */
export const goodUp = (s, now) => {
  const g = s.mgj && s.mgj.gj;
  return !!g && !g.down && now >= g.in && !!s.pos[GOOD_ID];
};
/* a hit on him takes 1 of his GOOD_HP, then nothing hurts him for a second; with none left he goes in a poof (and can
   come again from a pickup) */
export function goodDown(s, now) {
  const g = s.mgj && s.mgj.gj;
  if (!g || g.down || (g.safe || 0) > now) return;
  g.hits = (g.hits || 0) + 1;
  g.hp = (g.hp ?? GOOD_HP) - 1;
  g.safe = now + SOAK_MS;
  if (g.hp > 0) return;
  const p = s.pos[GOOD_ID];
  if (p)
    fxOf(s, now, JUSTIN_ID)({ kind: "poof", x: p.x, y: p.y, who: [GOOD_ID] });
  delete s.pos[GOOD_ID];
  s.mgj.gj = null;
  say(s, `${GOOD_NAME} is gone.`);
}
export function goodComes(s, now, P, log) {
  s.mgj.gj = {
    in: now,
    down: 0,
    hp: GOOD_HP,
    stabAt: now + 900,
    sayAt: now + rnd(6000, 10000),
    list: shuffle(GOD_LINES.map((_, i) => i)),
  };
  s.pos[GOOD_ID] = { x: P.x, y: P.y, face: P.x < 0.5 ? 1 : -1 };
  log(s, {
    npc: GOOD_ID,
    name: GOOD_NAME,
    text: GOD_LINES[s.mgj.gj.list.shift()],
  });
  say(s, `${GOOD_NAME} came to help!`);
}
/* his brain: up again after his 5 seconds; walks at Justin and stabs him once a second when close; his lines now and then */
export function goodTick(s, now, at, log, fx) {
  const g = s.mgj.gj,
    p = s.pos[GOOD_ID];
  if (!g || !p) return false;
  let ch = false;
  if (g.down && now >= g.down) {
    g.down = 0;
    ch = true;
  }
  if (now >= g.sayAt) {
    if (!(g.list || []).length) g.list = shuffle(GOD_LINES.map((_, i) => i));
    log(s, { npc: GOOD_ID, name: GOOD_NAME, text: GOD_LINES[g.list.shift()] });
    g.sayAt = now + rnd(12000, 22000);
    ch = true;
  }
  if (g.down || mgjGone(s, now)) return ch;
  const dx = (at.x - p.x) / RX,
    dy = (at.y - p.y) / RY,
    d = Math.hypot(dx, dy);
  if (d > 1.3) {
    const step = Math.min(d - 1.2, 0.9); // (duck lengths a beat: a brisk walk)
    s.pos[GOOD_ID] = {
      ...p,
      x: r3(Math.max(0, Math.min(1, p.x + (dx / d) * step * RX))),
      y: r3(Math.max(0, Math.min(1, p.y + (dy / d) * step * RY))),
      face: dx < 0 ? -1 : 1,
    };
    ch = true;
  }
  if (d <= 2 && now >= g.stabAt) {
    g.stabAt = now + 1000;
    const aim = d > 1e-3 ? [dx / d, dy / d] : [1, 0];
    fx({
      kind: "use",
      what: "knife",
      by: GOOD_ID,
      who: [GOOD_ID],
      face: aim[0] < 0 ? -1 : 1,
      ax: +aim[0].toFixed(3),
      ay: +aim[1].toFixed(3),
      ...(mgjStab(s, GOOD_ID, now, log, DMG.knife) ? { hit: [JUSTIN_ID] } : {}),
    });
    ch = true;
  }
  return ch;
}

/* where the desk comes in: a spot on the board away from him and from the ducks (the best of a few tries) */
export function deskSpot(s, at) {
  let best = null;
  for (let i = 0; i < 12; i++) {
    const p = { x: r3(rnd(0.18, 0.82)), y: r3(rnd(0.28, 0.8)) },
      d = (q) => Math.hypot((p.x - q.x) / RX, (p.y - q.y) / RY),
      score = Math.min(
        d(at) / 2,
        ...playing(s)
          .map((id) => s.pos[id])
          .filter(Boolean)
          .map(d),
        8,
      );
    if (!best || score > best.score) best = { ...p, score };
  }
  return { x: best.x, y: best.y };
}
/* the throw itself: CTL_N controllers spread evenly every way (turned a little at random each time), or the chair at q
   (the board's Mad God Justin throws them too, boardjustin.js) */
export function throwIt(s, k, at, q, now, fx) {
  const dir = (a, v) => {
    const bx = Math.cos(a) * RX,
      by = Math.sin(a) * RY,
      bl = Math.hypot(bx, by);
    return [+((bx / bl) * v).toFixed(4), +((by / bl) * v).toFixed(4)];
  };
  const one = k === "chair",
    a0 =
      one && q
        ? Math.atan2((q.y - at.y) / RY, (q.x - at.x) / RX)
        : Math.random() * Math.PI * 2;
  fx({
    kind: "use",
    what: k,
    who: [],
    face: Math.cos(a0) < 0 ? -1 : 1,
    ax: +Math.cos(a0).toFixed(3),
    ay: +Math.sin(a0).toFixed(3),
  });
  const n0 = s.fxN,
    n = one ? 1 : CTL_N;
  for (let i = 0; i < n; i++) {
    const [vx, vy] = dir(
      a0 + (i * Math.PI * 2) / n,
      (k === "chair" ? CHAIR_SPEED : CTL_SPEED) *
        FAST_FLY ** (+(s.justin || {}).fast || 0), // (faster attacks: the controllers and the chair fly faster)
    );
    s.shots = [
      ...(s.shots || []),
      {
        n: n0 * 10 + i,
        by: JUSTIN_ID,
        k,
        x0: at.x,
        y0: at.y,
        vx,
        vy,
        t: now,
        lx: at.x,
        ly: at.y,
        life: k === "chair" ? CHAIR_LIFE : CTL_LIFE,
      },
    ];
  }
}

/* ---------- the rework (the owner's, Nov 3) ---------- */
/* a hit on a duck from anything of his (a burning duck, the edge lightning): its HP, or down. True when
   it hurt (not while nothing can hurt it, nor in the air) */
function mgjKnock(s, id, now) {
  if (id === GOOD_ID) {
    goodDown(s, now);
    return true;
  }
  const P = s.players[id],
    p = s.pos[id];
  if (!P || P.dead || !p || mgjSafe(s, id, now) || jumpDodges(p, now))
    return false;
  if (!mgjSoak(s, id, now)) {
    P.dead = true;
    holdDown(s, id, now);
  }
  mgjHurt(s, id);
  return true;
}
/* the duck catches fire: it burns for BURN_MS and looks burnt for BURNT_MS */
function mgjBurn(s, id, now) {
  const m = s.mgj;
  if (!m || !s.players[id]) return;
  m.burn = { ...m.burn, [id]: now + BURN_MS };
  m.burnt = { ...m.burnt, [id]: now + BURNT_MS };
}
const alive = (o, now) =>
  Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v > now));
/* the burns run out; a burning duck lights every duck it touches (that takes 1 HP) */
export function burnTick(s, now) {
  const m = s.mgj,
    burn = alive(m.burn, now),
    burnt = alive(m.burnt, now);
  let ch =
    Object.keys(burn).length !== Object.keys(m.burn || {}).length ||
    Object.keys(burnt).length !== Object.keys(m.burnt || {}).length;
  m.burn = burn;
  m.burnt = burnt;
  for (const a of Object.keys(burn)) {
    const p = s.pos[a];
    if (!p || p.x < 0 || jumpDodges(p, now)) continue;
    for (const b of playing(s)) {
      const q = s.pos[b];
      if (b === a || !q || q.x < 0 || m.burn[b] > now) continue;
      if (Math.hypot((p.x - q.x) / RX, (p.y - q.y) / RY) > TOUCH) continue;
      if (mgjKnock(s, b, now)) {
        mgjBurn(s, b, now);
        fxOf(s, now, JUSTIN_ID)({ kind: "burn", who: [b] });
        ch = true;
      }
    }
  }
  return ch;
}
/* the edge lightning: when its time comes, every duck on the edge is hit (the edges glowed for EDGE_WARN
   before: game.js reads edgeAt) */
export function edgeTick(s, now, fx) {
  const m = s.mgj;
  if (waveOn(s)) {
    if (m.edgeAt - now > EDGE_WARN + 1000) return false;
    m.edgeAt = now + EDGE_WARN + 5000;
    return true;
  } // (no lightning from the edges while his zombies are out: the owner's, Nov 17 11:07Z. The hold is a change, so it's kept)
  if (now < m.edgeAt) return false;
  m.edgeAt = now + EDGE_EVERY;
  m.edgeLast = now;
  const hit = [];
  for (const id of playing(s)) {
    const p = s.pos[id];
    if (p && p.x >= 0 && onEdge(p) && mgjKnock(s, id, now)) hit.push(id);
  }
  fx({ kind: "edge", who: hit });
  return true;
}
/* the timed attacks wait a moment after he's back (the meteor, his Xbox) */
export function later(s, now, ms) {
  const m = s.mgj,
    j = s.justin;
  m.edgeAt = Math.max(m.edgeAt || 0, now + ms + EDGE_WARN);
  j.dashAt = Math.max(j.dashAt || 0, now + ms);
}

/* his teleport: at the edge he flashes blue and is somewhere far from every edge */
export const atWall = (p) =>
  p.x < WALL.x || p.x > 1 - WALL.x || p.y < WALL.y || p.y > 1 - WALL.y;
export function teleport(s, now, at, fx) {
  const j = s.justin,
    x = r3(rnd(0.25, 0.75)),
    y = r3(rnd(0.25, 0.75));
  j.tpAt = now + TP_EVERY;
  delete j.dash;
  fx({ kind: "teleport", x0: r3(at.x), y0: r3(at.y), x, y });
  Object.assign(j, { k: null, x0: x, y0: y, x1: x, y1: y, t: now, v: SPEED });
  j.next = now + 700;
  /* his double comes out after every teleport, and only then (the owner's, Nov 3) */
  const m = s.mgj;
  if (m && !m.dup) {
    m.dup = { at: now, until: now + DUP_MS, fake: Math.random() < 0.5 ? 0 : 1 };
    fx({ kind: "teleport", x0: x, y0: y, ...mirror({ x, y }), dup: true });
  }
}

/* his double: the same Justin, mirrored through the board's middle, doing all he does; one of the two (fake: 0 him, 1
   the double) does no harm, and a hit on that one counts for nothing */
export const mirror = (p) => ({ x: r3(1 - p.x), y: r3(1 - p.y) });
export function dupTick(s, now) {
  const m = s.mgj;
  if (m.dup && now >= m.dup.until) {
    m.dup = null;
    return true;
  }
  return false;
}
/* where he can be hit: himself, and his double while it's out (real: hits on it count) */
export function mgjBodies(s, now) {
  const m = s.mgj,
    n = s.justin && justinAt(s.justin, now);
  if (!m || !n || mgjGone(s, now) || m.met) return [];
  const me = { x: n.x, y: n.y, real: !m.dup || m.dup.fake !== 0 };
  return m.dup
    ? [me, { ...mirror(n), real: m.dup.fake === 0, dup: true }]
    : [me];
}
/* a duck's hit that reaches him (near: is that body in reach?): the real one takes n damage; on the fake only a grey
   hitmarker. True when it hit either */
export function mgjHitAt(s, by, now, near, log, n = 1) {
  const bodies = mgjBodies(s, now).filter(near);
  if (!bodies.length) return false;
  const b = bodies.find((x) => x.real) || bodies[0];
  if (b.real) mgjStab(s, by, now, log, n);
  fxOf(s, now, JUSTIN_ID)({ kind: "hitmark", x: b.x, y: b.y }); // (the owner: every hit shows it, on him and on his double alike)
  return true;
}
/* his double's shots: each new shot of his this beat gets a mirrored twin, and the fake one's are marked */
export function twin(s, now, n0) {
  const m = s.mgj,
    d = m && m.dup;
  if (!d || !s.shots || s.shots.length <= n0) return false;
  const made = s.shots
    .slice(n0)
    .filter((sh) => sh.by === JUSTIN_ID && !sh.twin);
  if (!made.length) return false;
  for (const sh of made) {
    sh.twin = 1;
    if (d.fake === 0) sh.fake = 1;
    const o = mirror({ x: sh.x0, y: sh.y0 });
    s.shots.push({
      ...sh,
      n: sh.n + 1e7,
      x0: o.x,
      y0: o.y,
      lx: o.x,
      ly: o.y,
      vx: -sh.vx,
      vy: -sh.vy,
      twin: 2,
      ...(d.fake === 1 ? { fake: 1 } : { fake: 0 }),
    });
  }
  return true;
}

/* ---------- the zebra cake: thrown by a duck, he chases it to where it lands at the edge and eats it ---------- */
export const cakeAt = (c, now) => {
  const t = (Math.min(now, c.stop) - c.t) / 1000;
  return { x: c.x0 + c.vx * t, y: c.y0 + c.vy * t };
};
export function cakeTick(s, now, at, fx) {
  const m = s.mgj,
    j = s.justin,
    c = m.cake;
  delete j.swing;
  delete j.tell;
  delete j.dash;
  if (c.eat) {
    if (now < c.eat + CAKE_EAT_MS) return false;
    m.cake = null;
    delete j.eat;
    ateHp(m);
    j.next = now;
    j.fireAt = Math.max(j.fireAt, now + 800);
    j.hamAt = Math.max(j.hamAt, now + 1200);
    return true;
  }
  const p = cakeAt(c, now),
    d = Math.hypot((p.x - at.x) / RX, (p.y - at.y) / RY);
  if (now >= c.stop && d < 1.3) {
    c.eat = now;
    Object.assign(j, {
      k: null,
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(at.x),
      y1: r3(at.y),
      t: now,
    });
    j.eat = { k: "zebra", at: now, until: now + CAKE_EAT_MS, cake: true };
    fx({ kind: "eat", what: "zebra" });
    return true;
  }
  if (Math.abs(j.x1 - p.x) < 0.004 && Math.abs(j.y1 - p.y) < 0.004)
    return false;
  Object.assign(j, {
    k: null,
    x0: r3(at.x),
    y0: r3(at.y),
    x1: r3(p.x),
    y1: r3(p.y),
    t: now,
    v: SPEED * 1.9,
  }); // (he runs after it)
  return true;
}

/* ---------- the ducks' own: reviving, the zebra cake (a = the use action) ---------- */
/* the downed duck nearest to duck id, within reach of a revive (or null) */
export function downNear(s, id) {
  const p = s.pos[id];
  if (!p || p.x < 0) return null;
  const d = playing(s)
    .filter((o) => o !== id && (s.players[o] || {}).dead && s.pos[o])
    .map((o) => [
      o,
      Math.hypot((s.pos[o].x - p.x) / RX, (s.pos[o].y - p.y) / RY),
    ])
    .filter(([, far]) => far <= REVIVE.REACH)
    .sort((x, y) => x[1] - y[1])[0];
  return d ? d[0] : null;
}
/* the revives going on: one held for REVIVE.MS gets its duck up at half its HP; it stops when the reviver goes down
   or walks away, or the duck gets up by itself */
export function reviveTick(s, now, log) {
  const m = s.mgj;
  if (!m.rv || !Object.keys(m.rv).length) return false;
  let ch = false;
  const rv = { ...m.rv };
  for (const [by, r] of Object.entries(m.rv)) {
    const P = s.players[by],
      T = s.players[r.id];
    if (!P || P.dead || !T || !T.dead || downNear(s, by) !== r.id) {
      delete rv[by];
      ch = true;
      continue;
    }
    if (now - r.at < REVIVE.MS) continue;
    delete rv[by];
    ch = true;
    getUp(s, by, r.id, now, false);
  }
  m.rv = rv;
  return ch;
}
/* duck id up again, got up by duck by: at half its HP, or at full by a medkit */
function getUp(s, by, id, now, full) {
  const m = s.mgj,
    P = s.players[by],
    T = s.players[id],
    max = mgjPHp(s);
  delete T.dead;
  for (const k of ["down", "up"]) {
    const rest = { ...s[k] };
    delete rest[id];
    s[k] = rest;
  }
  const out = { ...m.out };
  delete out[id];
  m.out = out;
  if (s.mag && s.mag[id]) {
    const mag = { ...s.mag };
    delete mag[id];
    s.mag = mag;
  } // (the down pistol goes: its magazine with it)
  const lost = { ...m.lost };
  if (max && !full)
    lost[id] = max - Math.ceil(max / 2); // (it stands up at half its HP: 3 of 6)
  else delete lost[id];
  m.lost = lost;
  m.safe = { ...m.safe, [id]: now + SOAK_MS };
  fxOf(s, now, JUSTIN_ID)({ kind: "revive", by, who: [id] });
  say(s, `${P.name} got ${T.name} up.`);
}

export function mgjTeamUse(s, a, now, log) {
  const m = s.mgj,
    p = s.pos[a.id],
    fx = fxOf(s, now, JUSTIN_ID);
  if (!m || !p) return false;
  if (a.what === "revive") {
    const rv = { ...(m.rv || {}) };
    if (!a.hold) {
      if (!rv[a.id]) return false;
      delete rv[a.id];
      m.rv = rv;
      return true;
    } // (let go: the revive stops)
    const down = downNear(s, a.id);
    if (!down || (rv[a.id] && rv[a.id].id === down)) return false;
    if (a.w === "medkit" && (m.held || {})[a.id] === "medkit") {
      // the medkit held out over it: up at once, at full HP, and the medkit is used up
      delete rv[a.id];
      m.rv = rv;
      dropHeld(m, a.id);
      getUp(s, a.id, down, now, true);
      return true;
    }
    rv[a.id] = { id: down, at: now };
    m.rv = rv;
    return true;
  }
  if (a.what === "zebra") {
    if (m.cake || now - (m.zebraAt || 0) < CAKE_EVERY || mgjGone(s, now))
      return false;
    const aim = aimOf(a, a.face < 0 ? -1 : 1),
      vx = aim[0] * CAKE_SPEED,
      vy = aim[1] * CAKE_SPEED; // (as the dagger flies: the aim is about a board width long on the thrower's screen)
    const tx =
        vx > 0 ? (0.97 - p.x) / vx : vx < 0 ? (0.03 - p.x) / vx : Infinity,
      ty = vy > 0 ? (0.96 - p.y) / vy : vy < 0 ? (0.04 - p.y) / vy : Infinity;
    m.zebraAt = now;
    m.cake = {
      n: now,
      by: a.id,
      x0: p.x,
      y0: p.y,
      vx: +vx.toFixed(4),
      vy: +vy.toFixed(4),
      t: now,
      stop: now + Math.max(0, Math.min(tx, ty, 6)) * 1000,
      eat: 0,
    };
    fx({
      kind: "use",
      what: "zebra",
      by: a.id,
      who: [a.id],
      face: vx < 0 ? -1 : 1,
    });
    return true;
  }
  return false;
}

/* ---------- the stats ---------- */
/* a fight's numbers for each player (from s.mgjPast: the last fight, or all of them) */
export function mgjStats(s, all = false) {
  const past = s.mgjPast || [],
    list = all ? past : past.slice(-1),
    per = {};
  const P = (id) =>
    (per[id] = per[id] || { dmg: 0, hits: 0, kills: 0, fights: 0, wins: 0 });
  for (const f of list) {
    for (const id of f.ids || []) {
      const p = P(id);
      p.fights++;
      if (f.won) p.wins++;
    }
    for (const [id, v] of Object.entries(f.dmg || {})) P(id).dmg += v;
    for (const [id, v] of Object.entries(f.hits || {})) P(id).hits += v;
    if (f.won && f.kill) P(f.kill).kills++;
  }
  return { per, fights: list };
}

/* ---------- his zombie waves (the owner's, Nov 17 11:07Z, and 11:19Z: "each player after the first") ----------
   Every 30 to 60 s, and 5 to 10 s later for each duck after the first, Justin calls a wave: 6 zombies, and 3 more for
   each duck after the first (half the owner's first numbers: "waves can be half the size", Nov 17 16:23Z), come in from the board's edges, 1 to 3 a second, twice as many a second for every 2
   ducks after the first. They walk at the nearest duck and claw it (1 HP, as his own hits). While any of them are out,
   or still to come, he's calmer (his attacks come WAVE.CALM times as late), he'd rather eat, and no lightning comes
   from the edges. Ducks' guns, melee and grenades hurt them as they hurt Dead Ducks Arcade's zombies (each has its
   breed's HP, zombies.js ZOMBIE_BREEDS.mgjWave; mgjZombieHit).
   s.mz = { zb: [{ i, x, y, hp, a (its last claw), n (since when it's at its duck), f (which way it faces), l (its look:
   l4ddart.js zombieURL), d (when it died), w (its wounds: wounds.js codes) }], n (the next one's number), on (a wave is
   out), next (the next wave), left (still to come), sp (the next ones' second), t and ze (the walk's: boardWalk) } */
export const WAVE = {
  EVERY: [30000, 60000],
  LATER: [5000, 10000], // (each duck after the first)
  N: 6,
  PER: 3, // (each duck after the first)
  RATE: [1, 3], // (a second, doubled for every 2 ducks after the first)
  CALM: 1.8,
  EAT: [9000, 14000],
  MAX: 40, // (on the board at once, at most: the rest wait their turn)
}; // (each zombie's own numbers, its speed, HP, reach and swipes, are its breed's: zombies.js ZOMBIE_BREEDS.mgjWave)
const extra = (s) => Math.max(0, playing(s).length - 1);
const waveGap = (n) =>
  rnd(...WAVE.EVERY) +
  Array.from({ length: Math.max(0, n - 1) }, () => rnd(...WAVE.LATER)).reduce(
    (a, b) => a + b,
    0,
  );
export const waveOn = (s) => !!(s.mz && s.mz.on);
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
/* a spot on the board's edge, out of everyone's way */
function edgeSpot() {
  const t = Math.random();
  return Math.random() < 0.5
    ? { x: r3(0.02 + 0.96 * t), y: Math.random() < 0.5 ? 0.04 : 0.96 }
    : { x: Math.random() < 0.5 ? 0.02 : 0.98, y: r3(0.06 + 0.88 * t) };
}
export function wavesTick(s, now) {
  const z = s.mz;
  if (!z || !s.mgj || s.mgj.met || mgjGone(s, now)) return false;
  let ch = false;
  const live = z.zb.filter((o) => !o.d);
  if (!z.on && now >= z.next) {
    Object.assign(z, {
      on: 1,
      left: WAVE.N + WAVE.PER * extra(s),
      sp: now,
    });
    say(s, "Justin calls his zombies!");
    ch = true;
  }
  /* coming in: 1 to 3 a second (doubled for every 2 ducks after the first) */
  if (z.on && z.left > 0 && now >= z.sp) {
    z.sp = now + 1000;
    let k = Math.min(
      z.left,
      rint(...WAVE.RATE) * 2 ** Math.floor(extra(s) / 2),
      WAVE.MAX - live.length,
    );
    z.left -= Math.max(0, k);
    for (; k > 0; k--) {
      const B = ZOMBIE_BREEDS.mgjWave,
        o = { i: ++z.n, ...edgeSpot(), hp: B.hp, a: 0, l: zLook(B) };
      z.zb.push(o);
      live.push(o);
    }
    ch = true;
  }
  /* each walks at the nearest duck still up and claws it once in reach (never through a jump), as Dead Ducks Arcade's
     zombies walk (zombies.js boardWalk); a zebra cake lying there draws every one of them to it, to bite it until it's
     gone (eaten by him): the owner's, Nov 17 19:11Z, "WTF IS THE ZEBRA CAKE NOT WORKING ON THE ZOMBIES". The bodies go
     after a moment; the wave is over once none is left, or to come */
  const c = s.mgj.cake,
    cake = c && !c.eat && now >= c.stop ? cakeAt(c, now) : null;
  if (
    boardWalk(s, z, now, ZOMBIE_BREEDS.mgjWave, {
      duck: [RX, RY],
      ids: playing(s).filter(
        (id) => s.pos[id] && s.pos[id].x >= 0 && !(s.players[id] || {}).dead,
      ),
      cake: cake && [cake.x, cake.y],
      claw: (id, t) => mgjKnock(s, id, t) && !!(s.players[id] || {}).dead,
    })
  )
    ch = true;
  if (z.on && z.left <= 0 && !z.zb.some((o) => !o.d)) {
    z.on = 0;
    z.next = now + waveGap(playing(s).length);
    ch = true;
  }
  return ch;
}
/* the weapon a shot's kind comes from (rules.js names some shots after what they are) */
const SHOT_ARM = {
  pellet: "shotgun",
  arrow: "bow",
  chain: "chaingun",
  slug: "dbarrel",
  lgren: "glauncher",
};
export const armOf = (k) => SHOT_ARM[k] || k;
/* duck by's hit on the zombies with weapon w: near(x, y) says which are in reach. Each takes what a Dead Ducks Arcade
   zombie takes from w (l4ddrules.js zombieTakes: its damage, its headshots and its misses; the owner's, Nov 17 16:23Z),
   with "CRIT" or "missed" over it as there. sh: a shot, from (sh.x0, sh.y0); it hits the nearest first, each zombie once
   (sh.zh), goes on past the ones it missed (sh.zp) and stops at the first it hits, or after pierceOf (the Laser Rifle's
   beam through every one on it). True when the shot stops here, or a swing or blast hit any */
export function mgjZombieHit(s, near, w, now, by, sh = null, take = null) {
  const z = s.mz;
  if (!z || !((isMgj(s) && s.phase === "boss") || sbOnBoard(s))) return false; // (and Sandbox's board: sbspawn.js)
  const seen = sh ? [...(sh.zh || []), ...(sh.zp || [])] : [];
  const ns = new Map(); // (what near said of each: a blast's ring, take(n))
  let got = z.zb.filter(
    (o) =>
      !o.d &&
      !seen.includes(o.i) &&
      ns
        .set(
          o,
          near(o.x, o.y, o.hb || 1, z.sb ? npcBody(s, o, duOf(s, by)) : null),
        )
        .get(o),
  ); // (o.hb: a Seriat file's hitbox, sbnumberat.js; near takes it as how big it is. Sandbox's: its body, only where its picture shows, sbbody.js)
  if (!got.length) return false;
  if (sh)
    got.sort(
      (a, b) =>
        Math.hypot(a.x - sh.x0, a.y - sh.y0) -
        Math.hypot(b.x - sh.x0, b.y - sh.y0),
    );
  const fx = fxOf(s, now, JUSTIN_ID),
    most = !sh || w === "laser" ? Infinity : Math.max(1, pierceOf(s, by, w));
  let hit = false;
  for (const o of got) {
    if (sh && (sh.zh || []).length >= most) break;
    const t = take ? take(ns.get(o)) : zombieTakes(s, by, w, sh && sh.dr); // (a drawn arrow: its draw, bowdraw.js)
    if (!t) {
      if (sh) sh.zp = [...(sh.zp || []), o.i];
      fx({ kind: "l4miss", b: 1, x: o.x, y: o.y });
      continue;
    }
    if (sh) sh.zh = [...(sh.zh || []), o.i];
    hit = true;
    o.hp = t.dmg >= ALL_HP ? 0 : hpHurt(o.hp, t.dmg); // (in hundredths, as every HP: hpmath.js)
    o.w = hitWounds(o.w, w, WOUND_BREEDS.zombie, { head: t.crit, dead: !o.hp }); // (its wounds, as Dead Ducks Arcade's zombie gets them: wounds.js)
    if (o.hp <= 0) o.d = now;
    if (z.sb && by) o.mad = grudge("p:" + by, now, MAD); // (Sandbox's: it goes after whoever hurt it, sbbrain.js)
    if (o.d && (w === "grenade" || w === "glauncher") && !o.w.includes("g0"))
      o.w += "g0"; // (a blast's gore: every chunk, cuts and big holes, as there)
    const mk = t.crit && o.hp && { m: 1 }; // (a crit: the CRIT, and its head if it killed; m: only the mark)
    fx({ kind: t.crit ? "l4crit" : "hitmark", b: 1, x: o.x, y: o.y, ...mk });
  }
  return sh ? (sh.zh || []).length >= most : hit;
}
