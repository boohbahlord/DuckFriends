/* ---------- the rules of Quacky Zombies ----------
   A zombie mode on Duck Cabin (the owner's, Nov 3). The power is cut and the outside can't be reached: only the cabin
   and the deck (the owner's balcony) are played on. Slow green ducks with X eyes come in at the front door, up the
   deck's stairs (boarded at the top) and through holes in the walls, round after round without end, each after the
   nearest duck by walking distance. Everyone has 3 HP, the knife, the pistol, the bow and 2 grenades; a duck at 0 HP is
   down until a teammate holds E by it for 10 seconds, or it bleeds out and walks as a ghost until the next round. The
   game ends when nobody is left standing. The host runs it all (this file); every screen draws it (l4dd.js).
   Points (the owner's): 50 to start, 5 for each point of damage to a zombie, 25 for a headshot (it kills at once), 10
   for each board put up (50 a round at most). They buy upgrades from Justin's Butler, who stands by the card table, and
   a weapon at the fireplace (210: it flickers through the weapons, then lands on one only the payer can take). Each duck
   has five slots: one melee, two ranged, one special and the grenades.

   It is Duck Cabin's world (rules.js' isHang is true for it too), with only the activities it keeps (keepOnly below),
   and its own rule 'l4'. s.hang, each key online as its own string (so the zombies walking never send the boards again):
     l4   { r: round, t0: when its zombies start coming (the round's "Round N" shows BREAK before), n: zombies in it,
            made: how many came so far, owe: held back while the board is full, acc, sec: the spawning's clock, next:
            the next zombie's number, over: { at, r } once nobody is standing, bp: { "id opening": points for boards there this round } }
     zp   [i, x, y, k, i, x, y, k, …]: every zombie's spot in world px (whole numbers) and k = hp · 8 + st (st 0 coming,
          1 tearing the boards, 4 climbing in, 2 in, 3 dead; Downpour: 5 over the fence, 6 up a wall onto a roof, 7 on a
          roof), sent every heartbeat
     zs   { i: [a, dir] }: a zombie's last swipe (ms since t0) and its way (1/100 radians), only for one that swiped
     (the host keeps the rest to itself, in s.hidden, which never goes online: l4z { i: [n, d] }, n since when it's at a
     duck (0: not), d its tear clock (st 1) or when it died (st 3); l4tk its last heartbeat)
     zw   { i: "B3c1…" }: the wounds hits left on a zombie, two letters each (wound(), l4ddart.js' hitsOf)
     zl   { i: [max hp, speed (px a second at the Normal Walking speed), opening, size, build, hat, outfit] }: set once, when it comes
     brd  { opening: boards up, 0 … BOARDS }
     l4p  { id: { hp, at (its last hit or heal), dn (down: bleeds out then), rv: { by, at } (being revived), gh (a ghost
          this round) } }
     l4a  { id: { sl: [melee, ranged, ranged, special] (weapon ids, "" for an empty slot), am: { weapon: [in the
          magazine (or all of it, without one), the rest] }, rl: when a reload ends (0: none), rw: the weapon reloading,
          g: grenades, u: { weapon: when last used } } }
     l4pt { id: points }
     l4u  { id: { acc, as, hp, sp, rl } }: the upgrades bought (accuracy, attack speed, max HP, speed, faster reload)
     l4box { id: { by, t, w } }: the fireplace's weapons, one for each duck that paid (at t), landing on w after BOX.spin
     l4fo { id: [weapons in a row, items in a row] }: the fireplace's odds for each duck (fireRoll)
     l4b  { id: { o, at } }: who is boarding up which opening, since when (one more board each BOARD_MS)
     l4f  { id: 1 }: flashlights switched off (key 0; nothing else happens, it's only a choice)
     l4k  [{ by, w, dx, dy, t, hit }]: melee weapons mid-swing (each hurts a zombie once, only for its swing's ms) */
import { rule, keepOnly } from "./hangout/registry.js";
import {
  W,
  H,
  CABIN,
  DECK,
  STAIRS,
  STEP,
  inCabin,
  inDeck,
  heightAt,
  slabBetween,
  whereIn,
  standable,
  solidsAt,
  onPlatform,
  BJ,
  layoutRev,
  layoutVariant,
  deckAt,
} from "./hangout/layout.js";
import * as GS from "./hangout/stationmap.js";
import { ARM_SPEED, ARM_COOL, ARM_SWING, ARM_RELOAD } from "./armspeed.js";
import { GRENADE_MS, daggerZ, walkOf, FASTER, shareOf, say } from "./rules.js";
import { JUSTIN } from "./hangout/npcart.js";
import { invuln } from "./hangout/death.js";
import { JET } from "./jetpack.js";
import {
  hOk,
  hLock,
  shotFeet,
  MID,
  SAME_FLOOR,
  sameFloorAhead,
  floorLock,
} from "./heights.js";
import { SLOW as SWIM } from "./hangout/water.js";
import { FLAME, flameReach, inCone } from "./flamer.js";
import {
  woundCode,
  pwHit,
  pwAdd,
  explodedLook,
  PCRIT,
  DEATH,
} from "./wounds.js";
import {
  BOMB,
  bombRoll,
  bombIn,
  flyTo,
  snapLine,
  logIn,
  jaimeCount,
  JUSTIN_AT_JAIME,
} from "./jaimebomb.js";
import { GOD_LINES, E_LINES, DEATH_LINES } from "./hangout/justin.js";
import {
  powerSetUp,
  powerRound,
  powerTick,
  powerFire,
  powerTake,
  powerBuy,
  powerAct,
  powerPump,
  isPw,
  pwName,
} from "./l4ddpower.js";
import { ANGEL, angelOf, angelAmmo, angelAct, angelLeft } from "./l4ddangel.js";

export const isL4dd = (s) => !!s && s.options.mode === "l4dd";
/* I want only the lights' stutter and the air (the wind, the rain, the fires: ambience.js) on of Hangout's activities.
   The couches, the stage, the card table and the piano's keys are still drawn, but quiet: nothing to sit on, sing into
   or play at, and nothing else to write in or switch. */
keepOnly(
  "l4dd",
  [],
  ["flicker", "ambience"],
  ["seats", "stage", "bj", "piano", "tv"],
); // (the TV only shows while the power is on: l4ddpower.js)

/* ---------- the numbers ---------- */
export const L4 = {
  HP: 3,
  REGEN: 15000, // ms: 1 HP back, 15 s after the last hit or heal
  REVIVE: 5000, // ms of holding E by a downed duck (5 s: the owner's, Nov 17 11:07Z; it was 10)
  QUICK: 3000, // … with Quick Revive bought (the Butler's, 750: the owner's, Nov 17 11:19Z)
  BACK_HP: 2, // a revived duck comes up with 2 HP
  BLEED: 30000, // ms a downed duck waits for a revive, then it's a ghost for the rest of the round
  SPRINT: 7000, // ms of sprint, and as long to fill up again
  BREAK: 7000, // ms between rounds ("Round N" shows meanwhile)
  FIRST: 4000, // ms before the first round's zombies come
  BOARDS: 5,
  BOARD_MS: 900, // ms of holding E for each board
  TEAR_MS: 1500, // ms a zombie takes to tear one board down
  REACH: 110, // world px: how near E works (a downed duck, an opening)
  DEAD_MS: 4000, // ms a dead zombie lies there, fading (3 s longer than its first second: the owner's, Nov 4)
  FELL_MS: 1000, // ms a zombie counts as just killed (a drop due falls where it lies)
};
/* Safe Keeping (the owner's, Nov 16): a halo in the special slot, never used by hand. When its duck goes down it keeps
   everything bought from the Butler, and it gets the duck up again: at once when nobody else is standing (or alone, or
   a computer), else when its player presses the revive key (E) while down. First GLOW ms of a light blue glow, then up
   with INV ms of nothing hurting it; spent. The Butler sells it (PRICE) and the fireplace has it with the items */
export const SAFE = {
  PRICE: 4000, // (the owner's, Nov 17 17:41Z: "the safe keeping now cost 4000 points from the priest")
  GLOW: 1200,
  INV: 6000,
};
const hasSafe = (s, id) => slotsOf(s, id).includes("safekeep");
export const invulnOf = (s, id, now) =>
  ((s && s.hang && s.hang.l4inv) || {})[id] > now;
export const WALK = 380 * 0.6 * 1.05; // world px a second: ducks at 63% of Duck Cabin's walk (world.js SPEED, l4dd.js SPEED: 5% faster than 60%, the owner's, Nov 3), at the Normal Walking speed; every zombie's speed is a share of it
const Z_SLOW = 0.8 / 1.05; // (and the zombies 20% slower than they were, whatever the ducks' speed did)
/* the owner's rounds: up to which round, the zombies' speed as a share of the ducks' [slowest, fastest], how long one
   is at a duck before it swipes and how often after (ms), and the most on the board at once. The steps come every 4
   rounds, not 5 (the owner's, Nov 4: 5, 10, 15 and 25 became 4, 8, 12 and 20). How many come: zombiesFor */
const ROUNDS = [
  [4, [0.5, 0.67], 500, 1000, Infinity],
  [8, [0.5, 0.75], 300, 750, 35],
  [12, [0.75, 0.75], 300, 750, 35],
  [20, [0.95, 0.95], 250, 500, 45],
  [Infinity, [0.95, 0.95], 250, 500, 50],
];
export const roundOf = (r) => ROUNDS.find((x) => r <= x[0]);
/* the zombies in round r with p players (the owner's, Nov 16 22:11Z and 22:16Z; the sheet: charts/zombies-per-round.xlsx).
   Each phase of rounds has its base [first round, last round, base]; every player past the first adds a share of it
   that grows through the phase, the round's place in it over the phase's length (1/4, 2/4 …), rounded down. Never
   more than 100 a player nor 400 in all, and never fewer than the round before (a round that would have fewer keeps
   the round before's). From round 21 on: 144 (as far as the cap lets), and never fewer than round 20 */
const PHASES = [
  [1, 4, 12],
  [5, 8, 24],
  [9, 12, 36],
  [13, 20, 72],
];
const Z_EACH = 100, // the most zombies a round for each player …
  Z_MOST = 400, // … and in all
  Z_LATE = 144; // from round 21 on
export function zombiesFor(r, p) {
  const cap = Math.min(Z_EACH * p, Z_MOST);
  let n = 0;
  for (let k = 1; k <= Math.min(r, 20); k++) {
    const [a, b, base] = PHASES.find((f) => k <= f[1]),
      d = b - a + 1,
      raw = Math.floor((base * (d + (p - 1) * (k - a + 1))) / d);
    n = Math.max(n, Math.min(raw, cap));
  }
  return r > 20 ? Math.max(n, Math.min(Z_LATE, cap)) : n;
}
/* spawning (the owner's): a zombie a second, 50% more for each player past the first, never more than 5 a second (3
   more for each player past the first), all twice that (Nov 16 21:21Z), and twice that again once a round is 10 s old
   (Nov 16 22:21Z); each second a 25% chance that none comes */
const SKIP = 0.25,
  LATER = 10000; // ms into a round before they come twice as fast
/* the weapons here, each of one kind (its slot): melee, ranged, special or the grenades. Melee swings twice as fast as
   anywhere else and hurts only mid-swing, in a bubble just past it (at: how far, r: how big); the pistol: 72 bullets in
   all, 8 a magazine; the bow: 150 arrows, one every 0.4 s; the dagger is thrown and falls to the floor; the shotgun a
   cone of pellets, 48 shots and no magazine; the medkit puts my HP back to full, once. A headshot (a crit: critOf, headOf) kills at
   once; grenades kill every zombie in their blast. Nothing hurts another duck. The ones I haven't given numbers for
   are guesses (Adam's plan, question 2) */
/* what anything thrown or used up waits before it can be used again (the grenades, the medkit, the zebra cake, the
   fireball, the adrenaline shot, the chair): 0.75 s (the owner's, Nov 16). Not the jetpack or the Long jump (switched on
   and off), nor Jaime (his own, longer) */
export const ITEM_COOL = 750;
export const ARMS = {
  knife: {
    kind: "melee",
    cool: ARM_COOL.knife,
    dmg: 1,
    swing: ARM_SWING.knife,
    at: 58,
    r: 34,
  }, // (four a second, as in every mode)
  hammer: {
    kind: "melee",
    cool: ARM_COOL.hammer,
    dmg: 2,
    swing: ARM_SWING.hammer,
    at: 66,
    r: 50,
  },
  /* the owner's new melees (Nov 16): the fire axe 1 to 4, as wide as the hammer and 25% faster; the short sword 50%
     faster than the knife, not as far out; the cast iron pan as far out as the sword and as slow as the axe, missing
     half its swings, and half its hits a headshot (crit) */
  axe: {
    kind: "melee",
    cool: ARM_COOL.axe,
    dmg: [1, 4],
    swing: ARM_SWING.axe,
    at: 66,
    r: 50,
  },
  sword: {
    kind: "melee",
    cool: ARM_COOL.sword,
    dmg: 1,
    swing: ARM_SWING.sword,
    at: 54,
    r: 40,
  },
  pan: {
    kind: "melee",
    cool: ARM_COOL.pan,
    dmg: 1,
    crit: 0.5,
    miss: 0.5,
    swing: ARM_SWING.pan,
    at: 54,
    r: 40,
  },
  handgun: {
    kind: "ranged",
    cool: ARM_COOL.handgun,
    dmg: 1,
    speed: ARM_SPEED.handgun,
    mag: 8,
    all: 72 + 5 * 8, // (5 more magazines: the owner's, Nov 16)
    reload: ARM_RELOAD,
  },
  bow: {
    kind: "ranged",
    cool: ARM_COOL.bow,
    dmg: 1,
    speed: ARM_SPEED.bow,
    all: 225, // (150, and 50% more with no magazine: the owner's, Nov 16)
  },
  dagger: {
    kind: "ranged",
    cool: ARM_COOL.dagger,
    dmg: 2,
    speed: ARM_SPEED.dagger,
    all: 24,
  },
  shotgun: {
    kind: "ranged",
    cool: ARM_COOL.shotgun,
    dmg: 1,
    speed: ARM_SPEED.shotgun,
    all: 72, // (no magazine: the owner's, Nov 4; 48, and 50% more: the owner's, Nov 16)
    pellets: 5,
    spread: 0.3,
    life: 420,
  },
  medkit: { kind: "special", cool: ITEM_COOL, all: 1 },
  grenade: {
    kind: "grenade",
    cool: ITEM_COOL,
    far: 300,
    r: 210,
    start: 2,
    most: 3,
  }, // (r: 50% wider than its first 140, owner 2026-11-04)
  /* the owner's new ones (Stage 3). The sniper's bullet goes through every zombie to the wall, 2 or 3 to each, a bolt
     action between shots; the SMG, the AK-47 and the LMG fire as long as the button is down; the chain gun (15 a second) hits at once
     (a thin yellow line out to what it hit), never reloads and kills what it hits; the revolver has five in its
     cylinder; the grenade launcher's grenades fly straight and go off on the first zombie, a wall or their range, and
     kill every zombie in their blast. Where the owner gave no number (the speeds, the reloads, the sniper's headshot)
     they are guesses: k is how the bullet looks */
  sniper: {
    kind: "ranged",
    cool: 750,
    dmg: [2, 3],
    speed: 1900,
    mag: 5,
    all: 24 + 5 * 5, // (5 more magazines: the owner's, Nov 16)
    reload: 2200,
    pierce: 3, // (zombies a bullet goes through)
    k: "sniper",
  },
  smg: {
    kind: "ranged",
    auto: true,
    cool: 80,
    dmg: 1,
    speed: 1100,
    mag: 20,
    all: 160 + 5 * 20, // (5 more magazines: the owner's, Nov 16)
    reload: 1400,
    k: "smg",
  },
  /* the Tommy gun and the UMP-45 (the owner's, Nov 17; from the weapon spin and Mad God Justin's pickups, not the Butler):
     the Tommy a round every 120 ms from a 50-round drum; the UMP-45 a round every 0.30 s, 2 damage a bullet, 20 rounds,
     a 1.4 s reload. Both crit 5% and miss 2.5% (slow: they hit as the single-shot guns do) */
  tommy: {
    kind: "ranged",
    auto: true,
    slow: true,
    cool: 120,
    dmg: 1,
    speed: 1100,
    mag: 50,
    all: 50 * 6, // (more ammo than the SMG's 260, and the SMG's reload: "the same stats as the SMG but slower fire rate but larger ammo capacity", the owner's, Nov 17 11:07Z)
    reload: 1400,
    k: "tommy",
  },
  ump: {
    kind: "ranged",
    auto: true,
    slow: true,
    cool: 300,
    dmg: 2,
    speed: 1100,
    mag: 20,
    all: 20 * 6,
    reload: 1400, // ("same reload", the owner's, Nov 17 11:21Z: the SMG's and the Tommy gun's)
    k: "ump",
  },
  ak: {
    kind: "ranged",
    auto: true,
    cool: 110,
    dmg: 2,
    speed: 1200,
    mag: 30,
    all: 180 + 5 * 30, // (5 more magazines: the owner's, Nov 16)
    reload: 1900,
    k: "ak",
  },
  chaingun: {
    kind: "ranged",
    auto: true,
    cool: 67, // (15 a second)
    dmg: 99,
    all: 300, // (300 rounds: the owner's, Nov 16, 16:06Z)
    far: 3000,
  },
  revolver: {
    kind: "ranged",
    cool: 380,
    dmg: 2,
    speed: 1150,
    mag: 5,
    all: 75 + 5 * 5, // (5 more magazines: the owner's, Nov 16)
    reload: 1700,
    k: "revolver",
  },
  glauncher: { kind: "ranged", cool: 1200, all: 23, speed: 900, far: 760 }, // (all: 15, and 50% more with no magazine: the owner's, Nov 16)
  lmg: {
    kind: "ranged",
    auto: true,
    cool: 100,
    dmg: 1,
    speed: 1150,
    mag: 100, // (the owner's, Nov 17: 100 bullets and twice the reload time)
    all: 225 + 3 * 75, // (3 more magazines: the owner's, Nov 16)
    reload: 5600,
    k: "lmg",
  },
  /* the owner's three new guns (Nov 16 16:25Z). The double barrel: every shot one slug that takes all the HP of the
     zombie it hits, blows chunks through it and throws its body back a long way (FLING); a crit's slug blows the head
     off and goes on through every zombie in its way, killing each. Two shells, then a reload of a second for each
     shell it loads (shell); 96 shells in all. The flamethrower: its tank (flamer.js), everything in its cone catches
     fire. The burst rifle (an AUG): three rounds a press (burst, gap ms apart), 21 a clip, the AK-47's damage. Where the
     owner gave no number (the crits, the speeds, the burst rifle's ammo and reload) they are guesses */
  dbarrel: {
    kind: "ranged",
    cool: 280,
    dmg: "all",
    speed: 1500,
    mag: 2,
    all: 96,
    shell: 1000, // (ms a shell: one shell loads in 1 s, two in 2 s)
    k: "slug",
  },
  flamer: {
    kind: "ranged",
    auto: true,
    cool: FLAME.COOL,
    all: FLAME.TANK,
  },
  burst: {
    kind: "ranged",
    cool: 420, // (from one burst to the next)
    dmg: 2,
    speed: 1250,
    mag: 21,
    all: 21 * 10,
    reload: 2000,
    burst: 3,
    gap: 70, // ms between a burst's rounds
    k: "burst",
  },
  /* the Laser Rifle (the owner's, Nov 17 11:07Z): a red beam once a second, at once, through every zombie on its line
     to the first wall, 1 damage to each, never a crit or a miss; no ammo to run out of. It heats up a fifth for each
     beam (heat: 5 in a row is its limit) and cools a fifth a second once it stops; a beam past its limit overheats it:
     it hisses, burns its duck's look (no damage) and can't fire for 8 s while it cools back to nothing (over).
     Angelic (ANGEL.LASER): a beam every 0.75 s, cooling a sixth every 0.75 s, a limit of 6, and each zombie it goes
     through has a 1 in 3 chance of taking 2 */
  laser: {
    kind: "ranged",
    auto: true,
    cool: 1000,
    dmg: 1,
    far: 3000,
    heat: 5,
    over: 8000,
  },
  /* the new specials: the zebra cake (thrown; every zombie goes for it and bites it until it's gone), the
     fireball (sets the zombie it hits on fire, BURN), the adrenaline shot (my duck walks at the game's usual speed for
     20 s), the long jump (each use turns it on or off: on, every jump is long), Jaime (3 a round: he goes for the
     nearest zombie and stabs it, 1 a stab, until one gets him) */
  zebra: { kind: "special", cool: ITEM_COOL, all: 1, speed: 650, far: 520 },
  fireball: { kind: "special", cool: ITEM_COOL, all: 1, speed: 700 },
  adrenaline: { kind: "special", cool: ITEM_COOL, all: 1, ms: 20000 },
  longjump: { kind: "special", cool: 300 },
  jaime: { kind: "special", cool: 1500, all: 3, round: true },
  jaimebomb: { kind: "special", cool: 1500, all: 3, round: true }, // (as Jaime: 1 spin in 50 at the fireplace, BOMB.fire)
  /* the jetpack (Stage 4): each use switches it on or off, as the long jump; on, Space flies (jetpack.js), and its
     10 s of flight (all, in ms) burn only while its jets are on in the air; a Max Ammo fills it */
  jetpack: { kind: "special", cool: 300, all: JET.FUEL },
  /* Justin's office chair (the owner's, Nov 3): thrown the way I aim, 3 HP to the zombie it hits; 3 throws, a Max Ammo
     gives them back */
  safekeep: { kind: "special", cool: 300, all: 1 }, // (Safe Keeping: never used by hand, SAFE below)
  chair: { kind: "special", cool: ITEM_COOL, all: 3, dmg: 3, speed: 600 },
};
/* a hit's damage: the weapon's, or a roll between its two (the sniper's 2 to 3) */
const dmgOf = (A) =>
  Array.isArray(A.dmg) ? rint(A.dmg[0], A.dmg[1]) : A.dmg || 1;
/* fire (the owner's): a zombie burns 6 s and takes 1 every 3 s (the first as it's lit); a duck takes 1 as it's lit and
   burns 3 s, and anyone on fire who touches a duck lights it (not again for a second after its fire goes out) */
export const BURN = { Z: 6000, EVERY: 3000, P: 3000, AGAIN: 1000 };
export const kindOf = (w) => (ARMS[w] && ARMS[w].kind) || "";
/* Downpour: is duck id swimming in the deep flood? Its guns, its bow and its melee are put away until it's out (the
   owner's, Nov 17 05:46Z); a jetpack high over the water isn't swimming */
export function swims(s, id) {
  const p = s && s.pos && s.pos[id];
  return !!p && dp() && !p.fly && GS.inDeep(p.x * W, p.y * H);
}
/* what a duck holds out (the long jump and Jaime are nothing in the hand, and a special used up isn't there) */
export const inHand = (w, s, id) => {
  if (
    !w ||
    w === "longjump" ||
    w === "jaime" ||
    w === "jaimebomb" ||
    w === "jetpack"
  )
    return ""; // (the jetpack is on the back: game.js)
  const c = s && kindOf(w) === "special" && ((kitOf(s, id) || {}).am || {})[w];
  return c && c[0] <= 0 ? "" : w;
};
/* the slots, in order (keys 1 to 4; the grenades are G): blue, red, red, purple, and the grenades white */
export const START = ["knife", "handgun", "bow", ""];
export const SLOT_KINDS = ["melee", "ranged", "ranged", "special"];
/* what the fireplace can give, in two groups (the owner's, Nov 15): after Justin (1 in 100) and the Jaime Bomb (1 in
   50), 85 spins in 100 pick from the weapons, anything that deals damage, and the rest from the items; each with an
   equal chance inside its group, never one already in my slots */
export const WEAPONS = [
  "knife",
  "hammer",
  "axe",
  "sword",
  "pan",
  "handgun",
  "bow",
  "dagger",
  "shotgun",
  "sniper",
  "smg",
  "tommy",
  "ump",
  "ak",
  "chaingun",
  "revolver",
  "glauncher",
  "lmg",
  "dbarrel",
  "flamer",
  "burst",
  "laser",
];
export const ITEMS = [
  "medkit",
  "zebra",
  "adrenaline",
  "longjump",
  "jaime",
  "jetpack",
  "fireball",
  "chair",
  "safekeep",
];
export const WEAPON_ODDS = 0.8; // (the item's chance is 20%: the owner's, Nov 17 17:41Z, "the chance of an item is now 20% for it's bag instead of 15%")
/* the melees are one bag among the weapons, and it holds two bags, the blunt ones and the sharp ones (the owner's,
   Nov 16): the fireplace picks the melee bag as likely as any one gun, then one of its two bags, then one inside it */
export const MELEE_BAGS = [
  ["hammer", "pan"],
  ["knife", "axe", "sword"],
];
/* and the flamethrower shares a bag with the chain gun (the owner's, Nov 16 16:25Z): the bag comes up as likely as any
   one gun, then one of the two in it */
export const HEAVY_BAG = ["chaingun", "flamer"];
export const POOL = [...WEAPONS, ...ITEMS];
/* their names, as players see them */
const NAMES = {
  knife: "Knife",
  hammer: "Hammer",
  axe: "Fire axe",
  sword: "Short sword",
  pan: "Cast iron pan",
  handgun: "Pistol",
  bow: "Bow",
  dagger: "Dagger",
  shotgun: "Shotgun",
  medkit: "Medkit",
  safekeep: "Safe Keeping",
  grenade: "Grenade",
  sniper: "Sniper",
  smg: "SMG",
  tommy: "Tommy gun",
  ump: "UMP-45",
  ak: "AK-47",
  chaingun: "Chain gun",
  revolver: "Revolver",
  glauncher: "Grenade launcher",
  lmg: "LMG",
  dbarrel: "Double barrel",
  flamer: "Flamethrower",
  burst: "Burst rifle",
  laser: "Laser Rifle",
  zebra: "Zebra cake",
  fireball: "Fireball",
  adrenaline: "Adrenaline shot",
  longjump: "Long jump",
  jaime: "Jaime",
  jaimebomb: "Jaime Bomb",
  jetpack: "Jetpack",
  chair: "Chair",
};
export const weaponName = (w) => (isPw(w) ? pwName(w) : NAMES[w] || w);
/* points (the owner's) */
/* what flies a little faster, as in every mode (rules.js FASTER): the arrows, the bullets and the daggers */
const BULLETS = new Set([
  "handgun",
  "bow",
  "dagger",
  "sniper",
  "smg",
  "tommy",
  "ump",
  "ak",
  "revolver",
  "lmg",
  "dbarrel",
  "burst",
]);
export const PTS = {
  START: 50,
  HIT: 5,
  HEAD: 25,
  BOARD: 5,
  BOARDS: 50,
  NUKE_CRIT: 250,
}; // (a board: 5, the owner's, Nov 3)
/* Justin's Butler's upgrades (the owner's prices; attack speed's are Adam's plan's guess, question 3): the price of the
   next one when n are bought already, how many at most */
export const SHOP = [
  { id: "acc", name: "Critical Chance", what: "+2.5% crits", most: 2 }, // (600 each, +2.5%, twice: the owner's, Nov 16 21:47Z)
  { id: "as", name: "Attack speed", what: "Cooldowns 10% faster", most: 2 }, // (2, the owner's, Nov 16 21:21Z; was 5)
  { id: "hp", name: "Max HP", what: "+1 HP until you go down", most: 2 },
  { id: "sp", name: "Speed", what: "Walk 10% faster", most: 1 },
  { id: "rl", name: "Faster reload", what: "Reloads 30% faster", most: 1 },
  {
    id: "qr",
    name: "Quick Revive",
    what: "Revive others in 3 s until you go down",
    most: 1,
  }, // (750, kept until I go down: the owner's, Nov 17 11:07Z + 11:19Z)
];
/* and his guns (the owner's, Nov 4): both pistols, the knife, the shotgun and the bow. Bullets cost 5 points for 2,
   arrows 5 for 5; a gun I already have says Refill and costs what fills it to the top. What a gun costs to buy
   when I haven't got it the owner didn't say: I made it its full load of ammo at that price (the knife 100).
   Everything he sells is 20% dearer, the ammo too (the owner's, Nov 4): bullets 6 for 2, arrows 6 for 5, the knife 120 */
const SHOP_MORE = 1.2;
export const GUN_SHOP = ["handgun", "revolver", "knife", "shotgun", "bow"];
/* (points, for how many: arrows; every other gun's bullets. In fives, the smallest unit of money (the owner's, Nov 17
   19:11Z): bullets 15 for 5 cost what 6 for 2 did, arrows 5 for 4 is the nearest to 6 for 5) */
export const AMMO_PRICE = { bow: [5, 4], gun: [15, 5] };
const KNIFE_PRICE = 120;
const ammoLeft = (c) => (c ? c[0] + c[1] : 0);
/* (5 points is the smallest unit of money, for everything: the owner's, Nov 17 19:11Z, "every point earned is supposed
   to be 5 at the lowest". So what ammo costs, 6 for 2, rounds up to the next 5 for the whole buy) */
const ammoCost = (w, n) => {
  const [p, k] = AMMO_PRICE[w] || AMMO_PRICE.gun;
  return fives(Math.ceil(n / k) * p, 1);
};
/* a number of points as a whole number of fives: dir 1 rounds up, -1 down, 0 to the nearest */
export const fives = (n, dir = 0) =>
  5 *
  (dir > 0
    ? Math.ceil(n / 5)
    : dir < 0
      ? Math.floor(n / 5)
      : Math.round(n / 5));
/* what gun w costs to buy when I haven't got it */
export const buyPrice = (w) => {
  const full = fullAmmo(w);
  return full ? ammoCost(w, ammoLeft(full)) : KNIFE_PRICE;
};
/* what the Butler asks for gun w now: to buy it, or to fill it to the top (0: it's full; null: not his, a knife I
   have already, or an Angelic gun of mine) */
export function gunPrice(s, id, w) {
  if (!GUN_SHOP.includes(w)) return null;
  const kit = kitOf(s, id),
    full = fullAmmo(w);
  if (!kit || !kit.sl.includes(w)) return buyPrice(w);
  if (!full || angelOf(s, id, w)) return null; // (an Angelic gun never refills: the owner's, Nov 16 22:21Z)
  return ammoCost(
    w,
    Math.max(0, ammoLeft(fullFor(s, id, w)) - ammoLeft(kit.am[w])),
  );
}
export const priceOf = (id, n) =>
  id === "acc"
    ? ACC_PRICE
    : id === "qr"
      ? QR_PRICE
      : fives(
          UP_TIMES *
            SHOP_MORE *
            {
              acc: 300 + 50 * n,
              as: 250 + 50 * n,
              hp: n ? 125 : 100,
              sp: 250,
              rl: 300,
            }[id],
        );
const ACC_PRICE = 600; // (every Critical Chance the same: the owner's, Nov 16 21:47Z)
const QR_PRICE = 750; // (Quick Revive: "it costs only 750", the owner's, Nov 17 11:19Z)
/* how long duck `by` holds E to get a downed duck up: Quick Revive makes it 3 s */
export const reviveMs = (s, by) => (upOf(s, by).qr ? L4.QUICK : L4.REVIVE);
const UP_TIMES = 2; // (every upgrade twice its old price, for now: the owner's, Nov 3; then 20% more, SHOP_MORE)
/* the price I pay now: a Sale (a drop) halves what I buy for the rest of the round, each of the Butler's upgrades only
   once (the owner's: "increased health or accuracy is only half off for that item once"), the fireplace every time.
   It lasts 45 s (DROP.FOR, the owner's, Nov 16; it was the rest of the round) */
export const safePrice = (s) =>
  saleOn(s) ? fives(SAFE.PRICE / 2, 1) : SAFE.PRICE; // (a Sale halves it, every time; in fives)
export const saleOn = (s) => !!(s && s.hang && s.hang.l4sale); // (for DROP.FOR: dropTick ends it)
export const priceFor = (s, id, what, n) => {
  const full = what === "box" ? BOX.price : priceOf(what, n);
  if (!saleOn(s)) return full;
  const used = (s.hang.l4sale.used || {})[id] || {};
  return what !== "box" && used[what] ? full : fives(full / 2, 1); // (half, in fives)
};
/* where Justin's Butler stands: beside his stool at the card table (anyone walks through him; nothing hurts him), and
   the fireplace's front, where E spins it */
export const BUTLER = { x: BJ.bx + 84, y: BJ.by - 18 };
export const BOX = {
  x: 2300,
  y: 742,
  sx: 2300,
  zx: 2300,
  sy: 706,
  sz: 58,
  price: 650, // (the owner's, Nov 17 17:41Z: "the slot for a weapon roll costs 150 more")
  spin: 4200,
  keep: 10000,
}; // (500 a spin: the owner's, Nov 15. sx, sy, sz: where it shows, CABIN_SPOTS below)
/* … and on Downpour (the second map): the Priest at the chapel's south end does the Butler's job, the car with its hood up the
   fireplace's (syncMap swaps them in) */
/* box: where a duck spins and takes (x, y), and where the weapons spin in sight (sx, sy, up sz): over the cabin's
   fireplace; on Downpour over the hood-up car, on its hood (the owner's, Nov 17 12:28Z; it was on the ground behind it, 11:07Z) */
const CABIN_SPOTS = {
    butler: { ...BUTLER },
    box: { x: BOX.x, y: BOX.y, zx: BOX.x, sx: BOX.x, sy: BOX.y - 36, sz: 58 },
  },
  DP_SPOTS = {
    butler: { x: GS.PRIEST.x, y: GS.PRIEST.y },
    box: {
      x: GS.HOOD.spot.x,
      y: GS.HOOD.spot.y,
      zx: GS.HOOD.spot.x + 90, // (the yellow square's middle: the owner's, Nov 17: over the car, not on the duck at the spot)
      /* the orb's middle exactly where I circled the S on my screenshot (refs/nov17-1228-batch/orb-over-car-S.png, Nov 17
         12:45Z and 17:41Z): the middle of the car's windshield, 58 by 243 into the car's drawing (stationart.js
         carSVG, 380 by 420 there, the front to the west; its top is the car's height and its hood's over its north edge).
         Its depth is the car's south edge, so it shows in front of the car; sz lifts it up to that spot (the orb hangs
         54 over its point, its middle 27 over) */
      sx: GS.HOOD.x0 + 58 * GS.K,
      sy: GS.HOOD.y1,
      sz: GS.HOOD.y1 - (GS.HOOD.y0 - 220 * GS.K + 243 * GS.K) - 27,
    },
  };
const SHOP_REACH = 130;
const SHOT_LIFE = 2000;
/* a zombie's room on the floor, as the ducks' (world.js crowd): an ellipse 56 across and 25.6 deep; every zombie the
   same, whatever its size. Its claw reaches a little past touching */
const RX = 56,
  RY = 25.6,
  CLAW = 1.35;
/* a new zombie's HP (the owner's, Nov 16 21:47Z): 3, then a 50% roll for 4; if that fails, a 50% roll for 5 */
const hp0 = () => {
  if (Math.random() < 0.5) return 4;
  if (Math.random() < 0.5) return 5;
  return 3;
};
const ZHATS = [
  "cap",
  "cowboy",
  "bucket",
  "sombrero",
  "afro",
  "police",
  "fire",
  "doctor",
  "nightcap",
  "helmet",
  "pumpkin",
  "birthday",
  "wizard",
  "jester",
];
const ZOUTFITS = [
  "shirt",
  "hoodie",
  "jeans",
  "pajamas",
  "hawaiian",
  "suit",
  "leather",
  "muscle",
  "doctor",
  "police",
  "firefighter",
  "military",
];
/* 1 zombie in 400 was Justin (the owner's, Nov 4: 0.25%): his glasses and jeans, as a zombie. 0 since Nov 16, with
   HELPER.on: Justin never shows up in this mode */
const Z_JUSTIN = 0;
export const zombieLook = (l) => ({
  color: "#3f7a34",
  pattern: "none",
  metal: "none",
  style: "rubber",
  beak: "default",
  beakColor: "#b06a1e",
  beakColor2: "#6e3a0c",
  size: l[3] || 0,
  build: l[4] || 0,
  ...(l[5] >= 0 ? { hat: { id: ZHATS[l[5]] } } : {}),
  ...(l[6] >= 0 ? { outfit: { id: ZOUTFITS[l[6]] } } : {}),
  ...(l[7] ? { face: { id: "glasses" }, outfit: { id: "jeans" } } : {}),
  ...(l[8]
    ? { color: "#6b5434", beakColor: "#7a5a2e", beakColor2: "#4a3418" }
    : {}), // (a mud zombie: MUD)
});
/* Downpour's mud zombies (the owner's, Nov 16 23:15Z): 4% of them, 1 HP less, the color of the mud; a hit from one
   puts mud over the corners of that duck's screen, which fades after 10 s (l4dd.js mudScreen). l[8] is 1 */
export const MUD = { P: 0.04, FOR: 10000, FADE: 1500 };

/* ---------- the map: only inside and the deck ----------
   The deck's stairs are boarded at the top (their landing is part of the deck). The openings: where zombies come in,
   and where boards go up. Each has its line in the wall (x, y; axis 'x' for an east-west wall, half: half its width),
   the spot just outside where a zombie tears the boards down (out), the spot just inside where it's in (in), and for
   the stairs the foot of the stairs where they appear (from) */
/* about how far a player sees from its duck, either way (a computer's view, the wider one) */
const VIEW = { x: 720, y: 460 };
const LAND = { x0: STAIRS.x0, x1: STAIRS.x1, y0: STAIRS.y0, y1: STAIRS.land };
/* Downpour: the forest, short of the world's edge (the forest line stops nobody: the owner's, Nov 17 03:34Z). Past the
   fences only the road is open, so zombies there still climb them */
const inWoods = (x, y) => x >= 70 && x <= W - 70 && y >= 70 && y <= H - 70;
export const playable = (x, y) =>
  (dp() && (GS.inOpen(x, y) || inWoods(x, y))) ||
  (!dp() && inCabin(x, y)) ||
  inDeck(x, y) ||
  (!dp() && x >= LAND.x0 && x < LAND.x1 && y >= LAND.y0 && y < LAND.y1);
const CABIN_OPENINGS = [
  {
    id: "front",
    kind: "door",
    x: 2000,
    y: CABIN.y0,
    axis: "x",
    half: 40,
    out: [2000, 546],
    in: [2000, 668],
  },
  {
    id: "stairs",
    kind: "stairs",
    x: 4400,
    y: LAND.y1,
    axis: "x",
    half: 92,
    out: [4400, 2410],
    in: [4400, 2296],
    from: [4400, 2860],
  },
  {
    id: "w1",
    kind: "hole",
    x: CABIN.x0,
    y: 1040,
    axis: "y",
    half: 46,
    out: [1244, 1040],
    in: [1362, 1040],
  },
  {
    id: "w2",
    kind: "hole",
    x: CABIN.x0,
    y: 1830,
    axis: "y",
    half: 46,
    out: [1244, 1830],
    in: [1362, 1830],
  },
  {
    id: "s1",
    kind: "hole",
    x: 1790,
    y: CABIN.y1,
    axis: "x",
    half: 46,
    out: [1790, 2262],
    in: [1790, 2138],
  },
  {
    id: "e1",
    kind: "hole",
    x: CABIN.x1,
    y: 930,
    axis: "y",
    half: 46,
    out: [4356, 930],
    in: [4238, 930],
  },
  {
    id: "e2",
    kind: "hole",
    x: CABIN.x1,
    y: 1530,
    axis: "y",
    half: 46,
    out: [4356, 1530],
    in: [4238, 1530],
  },
  {
    id: "e3",
    kind: "hole",
    x: CABIN.x1,
    y: 2110,
    axis: "y",
    half: 46,
    out: [4356, 2110],
    in: [4238, 2110],
  },
];
/* Downpour (the second map, stationmap.js): the boarded holes in the gas station and the chapel, and the fence round the
   whole map, which zombies climb over anywhere along its four sides but its corners (the owner's, Nov 17 12:28Z:
   "zombies spawn outside the fence and climb over it like i said, no longer spawning inside the map"). nb: no boards
   on them. A side's fence: axis "y" the west and east sides (its line at x = at), "x" the north and south (at y = at);
   out: the side the zombies come from (-1 west or north, 1 east or south); climb: from … to along it */
const RIM_CORNER = 60;
/* how far out from a fence's line a zombie comes (from), starts climbing (out), is at the top (out - mid) and lands
   (out - across), and how long the drop takes (s) */
const FENCE = { from: 45, out: 22, mid: 34, across: 68, FALL: 0.35 };
/* how far out from fence f's line (x, y) is (inside: below 0) */
const acrossFence = (f, x, y) => ((f.axis === "y" ? x : y) - f.at) * f.out;
const RIM_SIDES = () => [
  { axis: "y", at: GS.RIM.x0, out: -1, climb: [GS.RIM.y0, GS.RIM.y1] },
  { axis: "y", at: GS.RIM.x1, out: 1, climb: [GS.RIM.y0, GS.RIM.y1] },
  { axis: "x", at: GS.RIM.y0, out: -1, climb: [GS.RIM.x0, GS.RIM.x1] },
  { axis: "x", at: GS.RIM.y1, out: 1, climb: [GS.RIM.x0, GS.RIM.x1] },
];
/* a spot by a fence: u across its line (outward), v along it */
const byFence = (f, u, v) =>
  f.axis === "y" ? [f.at + f.out * u, v] : [v, f.at + f.out * u];
const DP_OPENINGS = [
  ...RIM_SIDES().map((f, k) => {
    const [a, b] = [f.climb[0] + RIM_CORNER, f.climb[1] - RIM_CORNER],
      m = (a + b) / 2;
    f.climb = [a, b];
    return {
      id: "fence" + k,
      kind: "fence",
      nb: true,
      x: f.axis === "y" ? f.at : m,
      y: f.axis === "y" ? m : f.at,
      axis: f.axis,
      half: (b - a) / 2,
      out: byFence(f, FENCE.out, 0), // (along it: the zombie's own)
      in: byFence(f, FENCE.out - FENCE.across, 0),
      from: byFence(f, FENCE.from, 0),
      fence: f,
      ...(f.axis === "x" ? { rim: true } : {}), // (no moonlight pooled at its middle: l4dd.js)
    };
  }),
  ...GS.BOARDED.map((o) => {
    const m = (o.a + o.b) / 2,
      half = (o.b - o.a) / 2,
      sg = o.out === "n" || o.out === "w" ? -1 : 1;
    return o.axis === "x"
      ? {
          id: o.id,
          kind: "hole",
          x: m,
          y: o.at,
          axis: "x",
          half,
          a: o.a,
          b: o.b,
          out: [m, o.at + sg * 60],
          in: [m, o.at - sg * 60],
        }
      : {
          id: o.id,
          kind: "hole",
          x: o.at,
          y: m,
          axis: "y",
          half,
          a: o.a,
          b: o.b,
          out: [o.at + sg * 60, m],
          in: [o.at - sg * 60, m],
        };
  }),
];
export const OPENINGS = [...CABIN_OPENINGS];
/* is the room on Downpour? (layout.js' useMode has turned to it: the rules call it for every action) */
export const dp = () => layoutVariant() === "l4gs";
/* the map's own numbers in: its openings, the Butler's and the fireplace's spots, the start spots, the zombies' grid.
   Called wherever they're read; it does something only when layout.js has turned to the other map */
let mapRev = -1;
export function syncMap() {
  if (mapRev === layoutRev()) return;
  mapRev = layoutRev();
  const on = dp();
  OPENINGS.length = 0;
  OPENINGS.push(...(on ? DP_OPENINGS : CABIN_OPENINGS));
  const sp = on ? DP_SPOTS : CABIN_SPOTS;
  Object.assign(BUTLER, sp.butler);
  Object.assign(BOX, sp.box);
  spots = null;
  [GX, GY, GW, GH] = on
    ? [0, 0, Math.ceil(GS.GS_W / CELL), Math.ceil(GS.GS_H / CELL)]
    : [1280, 580, 82, 52];
}
export const openingById = (id) => {
  syncMap();
  return OPENINGS.find((o) => o.id === id) || null;
};
/* where everyone starts, and comes back at the next round: free spots in the great room, nearest the middle first */
let spots = null;
export function startSpot(k = 0) {
  syncMap();
  if (!spots && dp()) {
    // (Downpour: in the gas station, by the front door)
    spots = [];
    for (let y = 1520 * GS.K; y <= 1680 * GS.K; y += 65)
      for (let x = 2250 * GS.K; x <= 3000 * GS.K; x += 65)
        if (standable(x, y, heightAt(x, y), 0)) spots.push({ x, y });
    spots.sort(
      (a, b) =>
        Math.hypot(a.x - GS.START.x, a.y - GS.START.y) -
        Math.hypot(b.x - GS.START.x, b.y - GS.START.y),
    );
  }
  if (!spots) {
    spots = [];
    for (let y = 1300; y <= 1560; y += 65)
      for (let x = 2560; x <= 3080; x += 65)
        if (standable(x, y, heightAt(x, y), 0) && !onPlatform(x, y))
          spots.push({ x, y });
    spots.sort(
      (a, b) =>
        Math.hypot(a.x - 2800, a.y - 1420) - Math.hypot(b.x - 2800, b.y - 1420),
    );
  }
  return spots[k % spots.length];
}

/* ---------- the zombies' way to the ducks: a flow field ----------
   A grid of 40-px cells over the cabin and the deck (built once). Every heartbeat, the walking distance from every cell
   to the nearest duck standing, all at once (Dijkstra from all of them); each zombie walks downhill on it, so it takes
   the way of least walking, never the duck nearest through a wall. */
const CELL = 40;
let GX = 1280,
  GY = 580,
  GW = 82,
  GH = 52; // (Downpour's grid covers its whole world: syncMap)
const BOARD_COST = 6; // (cells' worth of walking)
let extra = null,
  walk = null,
  walkRev = -1, // (the cabin it was made for: layout.js' layoutRev)
  hts = null;
const cellAt = (x, y) => {
  const i = Math.floor((x - GX) / CELL),
    j = Math.floor((y - GY) / CELL);
  return i < 0 || j < 0 || i >= GW || j >= GH ? -1 : j * GW + i;
};
const mid = (c) => [
  GX + (c % GW) * CELL + CELL / 2,
  GY + Math.floor(c / GW) * CELL + CELL / 2,
];
function cells() {
  syncMap();
  if (walk && walkRev === layoutRev()) return walk;
  walkRev = layoutRev();
  FLOWS.clear(); // (their ways were for the cabin before)
  walk = new Uint8Array(GW * GH);
  hts = new Float32Array(GW * GH);
  for (let c = 0; c < GW * GH; c++) {
    const [x, y] = mid(c),
      z = heightAt(x, y);
    hts[c] = z;
    walk[c] =
      playable(x, y) && standable(x, y, z, 0, null, true) && !onPlatform(x, y)
        ? 1
        : 0;
  }
  /* Downpour: a boarded hole's cells cost a few more (a zombie goes round by an open way if it isn't much further, or
     stops at the boards and tears them down) */
  extra = new Float32Array(GW * GH);
  if (dp())
    for (const o of OPENINGS)
      if (o.kind === "hole")
        for (let c = 0; c < GW * GH; c++) {
          const [x, y] = mid(c),
            [along, across] = o.axis === "x" ? [x, y - o.y] : [y, x - o.x];
          if (along > o.a && along < o.b && Math.abs(across) < 40)
            extra[c] = BOARD_COST;
        }
  return walk;
}
/* can a zombie step from cell a to its neighbor b? (no climbing the stage's edge; no cutting a corner) */
const N8 = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];
function nextTo(c, k) {
  const [di, dj] = N8[k],
    i = (c % GW) + di,
    j = Math.floor(c / GW) + dj;
  if (i < 0 || j < 0 || i >= GW || j >= GH) return -1;
  const b = j * GW + i;
  if (!walk[b] || Math.abs(hts[b] - hts[c]) > 2 * STEP + 2) return -1;
  if (di && dj && (!walk[c + di] || !walk[c + dj * GW])) return -1;
  return b;
}
/* the nearest open cell to (x, y), within 3 cells (a duck by a wall stands where a cell's middle isn't open) */
function openNear(x, y) {
  cells();
  const c = cellAt(x, y);
  if (c >= 0 && walk[c]) return c;
  let best = -1,
    bd = Infinity;
  const i0 = Math.floor((x - GX) / CELL),
    j0 = Math.floor((y - GY) / CELL);
  for (let dj = -3; dj <= 3; dj++)
    for (let di = -3; di <= 3; di++) {
      const i = i0 + di,
        j = j0 + dj;
      if (i < 0 || j < 0 || i >= GW || j >= GH || !walk[j * GW + i]) continue;
      const [mx, my] = mid(j * GW + i),
        d = Math.hypot(mx - x, my - y);
      if (d < bd) {
        bd = d;
        best = j * GW + i;
      }
    }
  return best;
}
/* the walking distance from every cell to the nearest of `starts` (Dijkstra from all of them at once). The grid never
   changes, so a field is the same every time its starts are: I keep the last ones made and hand them out again instead
   of working them out on every heartbeat (the ducks only change cells now and then). A field handed out is only read. */
const FLOWS = new Map(),
  FLOWS_KEPT = 48;
let heapD = null,
  heapC = null;
function flowFrom(starts) {
  const key = [...new Set(starts.filter((c) => c >= 0))]
    .sort((a, b) => a - b)
    .join();
  let dist = FLOWS.get(key);
  if (dist) {
    FLOWS.delete(key);
    FLOWS.set(key, dist); // (the newest used is the last one dropped)
    return dist;
  }
  dist = dijkstra(key ? key.split(",").map(Number) : []);
  FLOWS.set(key, dist);
  if (FLOWS.size > FLOWS_KEPT) FLOWS.delete(FLOWS.keys().next().value);
  return dist;
}
function dijkstra(starts) {
  cells();
  const n = GW * GH,
    dist = new Float64Array(n).fill(Infinity); // (64-bit: a 32-bit copy can be a hair under the heap's number, and its cell was never looked past)
  /* the heap: distances and cells side by side in typed arrays, made once (every cell can be pushed once per neighbor) */
  if (!heapD || heapD.length < n * 8 + 8) {
    heapD = new Float64Array(n * 8 + 8);
    heapC = new Int32Array(n * 8 + 8);
  }
  let size = 0;
  const push = (d, c) => {
    let k = size++;
    while (k) {
      const p = (k - 1) >> 1;
      if (heapD[p] <= d) break;
      heapD[k] = heapD[p];
      heapC[k] = heapC[p];
      k = p;
    }
    heapD[k] = d;
    heapC[k] = c;
  };
  const popTo = () => {
    // takes the smallest off the top; the caller has read heapD[0] and heapC[0] first
    const d = heapD[--size],
      c = heapC[size];
    let k = 0;
    for (;;) {
      const l = 2 * k + 1,
        r = l + 1;
      let m = -1,
        md = d;
      if (l < size && heapD[l] < md) {
        m = l;
        md = heapD[l];
      }
      if (r < size && heapD[r] < md) m = r;
      if (m < 0) break;
      heapD[k] = heapD[m];
      heapC[k] = heapC[m];
      k = m;
    }
    heapD[k] = d;
    heapC[k] = c;
  };
  for (const c of starts) {
    dist[c] = 0;
    push(0, c);
  }
  while (size) {
    const d = heapD[0],
      c = heapC[0];
    popTo();
    if (d > dist[c]) continue;
    for (let k = 0; k < 8; k++) {
      const b = nextTo(c, k);
      if (b < 0) continue;
      const nd = d + N8[k][2] + extra[b];
      if (nd < dist[b]) {
        dist[b] = nd;
        push(nd, b);
      }
    }
  }
  return dist;
}
/* where a zombie inside heads next: a point two cells on along the field (the way smooths out), or null */
function heading(dist, x, y) {
  const c = openNear(x, y);
  if (c < 0 || dist[c] === Infinity) return null;
  const best = (a) => {
    let b = -1;
    for (let k = 0; k < 8; k++) {
      const n = nextTo(a, k);
      if (n >= 0 && dist[n] < (b < 0 ? dist[a] : dist[b])) b = n;
    }
    return b;
  };
  const n1 = best(c);
  if (n1 < 0) return null;
  const n2 = best(n1),
    [ax, ay] = mid(n1);
  if (n2 < 0) return [ax, ay];
  const [bx, by] = mid(n2);
  return [(ax + bx) / 2, (ay + by) / 2];
}

/* ---------- small helpers ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const players = (s) => s.seat.filter((id) => s.players[id] && s.pos[id]);
const P4 = (s, id) => ((s.hang && s.hang.l4p) || {})[id] || null;
export const isDown = (s, id) => !!(P4(s, id) && P4(s, id).dn);
export const isGhost4 = (s, id) => !!(P4(s, id) && P4(s, id).gh);
const standing = (s, id) => {
  const p = P4(s, id);
  return !!p && !p.dn && !p.gh;
};
/* a duck in the middle of a jump dodges a hit: not in its first fifth or its last (the owner's) */
export function dodging(s, p, now) {
  if (p && p.fly) return true; // (the jetpack, high in the air)
  if (!p || !p.j) return false;
  const T = (s.options.lowGravity ? 1200 : 620) * (p.lj ? 1.4 : 1),
    u = (now - (p.dj || p.j)) / T;
  return u > 0.2 && u < 0.8;
}
const at = (p) => [p.x * W, p.y * H];
/* the ellipse distance between two spots on the floor: 1 is two ducks touching */
const room = (ax, ay, bx, by) => Math.hypot((ax - bx) / RX, (ay - by) / RY);
/* where zombies can stand inside (the walls, the furniture, the beds stop them; the outside too) */
const zOk = (x, y, z) =>
  playable(x, y) && standable(x, y, z, STEP, null, true) && !onPlatform(x, y); // (Downpour: zombies wade the deep flood, climb the fallen tree)
/* the zombies as objects, from the state's three parts, and back */
function zombies(s) {
  const zp = s.hang.zp || [],
    zs = s.hang.zs || {},
    zl = s.hang.zl || {},
    mine = (s.hidden && s.hidden.l4z) || {},
    out = [];
  for (let k = 0; k + 3 < zp.length; k += 4) {
    const i = zp[k],
      l = zl[i],
      sw = zs[i] || [-1e6, 0],
      h = mine[i] || [0, 0];
    if (!l) continue;
    out.push({
      i,
      x: zp[k + 1],
      y: zp[k + 2],
      hp: Math.floor(zp[k + 3] / 8),
      st: zp[k + 3] % 8,
      a: sw[0],
      dir: sw[1],
      n: h[0],
      d: h[1],
      l,
    });
  }
  return out;
}
function store(s, zs, keepStatic) {
  const zp = [],
    sw = {},
    mine = {},
    zl = {};
  for (const z of zs) {
    zp.push(z.i, Math.round(z.x), Math.round(z.y), z.hp * 8 + z.st);
    if (z.a > -1e5) sw[z.i] = [Math.round(z.a), z.dir];
    mine[z.i] = [Math.round(z.n), Math.round(z.d)];
    zl[z.i] = z.l;
  }
  const sig = (o) => JSON.stringify(o);
  if (sig(zp) !== sig(s.hang.zp)) s.hang.zp = zp;
  if (sig(sw) !== sig(s.hang.zs)) s.hang.zs = sw;
  if (!keepStatic && sig(zl) !== sig(s.hang.zl)) s.hang.zl = zl;
  if (s.hang.zw) {
    // (the wounds go with their zombie)
    const zw = {};
    for (const z of zs) if (s.hang.zw[z.i]) zw[z.i] = s.hang.zw[z.i];
    if (sig(zw) !== sig(s.hang.zw)) s.hang.zw = zw;
  }
  s.hidden = { ...(s.hidden || {}), l4z: mine };
}
export const zombiesOf = zombies;

/* ---------- a duck's slots, points and upgrades ---------- */
/* a weapon's ammo, full: [in the magazine, the rest], or [all of it, 0] without a magazine; none for melee */
export const fullAmmo = (w) => {
  const a = ARMS[w];
  if (!a || a.all === undefined) return null;
  return a.mag ? [a.mag, a.all - a.mag] : [a.all, 0];
};
/* … and as full as duck id's own is: an Angelic weapon holds more (l4ddangel.js) */
export const fullFor = (s, id, w) =>
  angelOf(s, id, w) ? angelAmmo(ARMS[w], w) : fullAmmo(w);
/* a magazine's size in kit m: the Angelic pistols' is twice the pistol's (l4ddangel.js) */
export const magIn = (m, w) =>
  ARMS[w] && ARMS[w].mag
    ? ARMS[w].mag *
      (w === "handgun" &&
      m.dg === undefined &&
      m.ang &&
      m.ang[w] &&
      (m.sl || []).includes(w)
        ? ANGEL.PISTOL.MAG
        : 1)
    : 0;
function freshKit() {
  const am = {};
  for (const w of START) if (fullAmmo(w)) am[w] = fullAmmo(w);
  return { sl: [...START], am, rl: 0, rw: "", g: ARMS.grenade.start, u: {} };
}
export const kitOf = (s, id) => ((s && s.hang && s.hang.l4a) || {})[id] || null;
export const slotsOf = (s, id) => (kitOf(s, id) || {}).sl || START;
/* is w one of this duck's weapons? (what it can hold out and use; the grenades are always there) */
export const l4Holds = (s, id, w) =>
  !!w &&
  kindOf(w) !== "grenade" &&
  w !== "safekeep" &&
  slotsOf(s, id).includes(w);
export const ptsOf = (s, id) => ((s && s.hang && s.hang.l4pt) || {})[id] ?? 0;
export const upOf = (s, id) => ((s && s.hang && s.hang.l4u) || {})[id] || {};
export const maxHp = (s, id) =>
  isWild(s, id) ? WILD.hp : L4.HP + (upOf(s, id).hp || 0);
/* a weapon's wait between uses (each Attack speed: 10% shorter), a reload's time (Faster reload: 30% shorter), the
   headshot chance (headOf, below) */
export const l4Cool = (s, id, w) =>
  ARMS[w]
    ? (w === "laser" && angelOf(s, id, w)
        ? ANGEL.LASER.cool // (the Angelic Laser Rifle: its own, a beam every 0.75 s)
        : ARMS[w].cool *
          (angelOf(s, id, w)
            ? w === "handgun"
              ? ANGEL.PISTOL.FIRE
              : ANGEL.FAST
            : 1)) * // (Angelic: 20% faster; the dual pistols twice as fast, l4ddangel.js)
      Math.pow(0.9, upOf(s, id).as || 0)
    : 400;
/* ---------- the Laser Rifle's heat ----------
   Kept in the kit as lz { h: its heat in beams at t, t: the last beam, o: overheated until (0: not) }. After a beam
   it holds its heat for one wait between beams, then loses one beam's worth each wait; overheated, it cools from past
   its limit back to nothing in ARMS.laser.over. laserHeat → { h (0 … max + 1), max, over (ms left overheated, 0: not) },
   which every screen reads for the gun's glow, the meter under my duck and the steam */
export const laserMax = (s, id) =>
  angelOf(s, id, "laser") ? ANGEL.LASER.heat : ARMS.laser.heat;
export function laserHeat(s, id, now) {
  const m = kitOf(s, id),
    z = m ? m.lz : ((s && s.mgj && s.mgj.lz) || {})[id], // (Mad God Justin, picked up: s.mgj.lz, rules.js)
    max = laserMax(s, id);
  if (!z) return { h: 0, max, over: 0 };
  if (z.o > now)
    return {
      h: ((max + 1) * (z.o - now)) / ARMS.laser.over,
      max,
      over: z.o - now,
    };
  const c = l4Cool(s, id, "laser");
  return { h: Math.max(0, z.h - Math.max(0, now - z.t - c) / c), max, over: 0 };
}
/* its heat after one more beam now: { lz (to keep), hot: this beam overheated it (the meter was full) } */
export function laserNext(s, id, now) {
  const { h, max } = laserHeat(s, id, now),
    hot = Math.round(h) >= max;
  return {
    lz: hot
      ? { h: max + 1, t: now, o: now + ARMS.laser.over }
      : { h: Math.min(max, h + 1), t: now, o: 0 },
    hot,
  };
}
export const reloadOf = (s, id, w, c) =>
  (ARMS[w].shell
    ? ARMS[w].shell *
      Math.max(
        1,
        Math.min(ARMS[w].mag - (c ? c[0] : 0), c ? c[1] : ARMS[w].mag),
      )
    : ARMS[w].reload || 1500) *
  (upOf(s, id).rl ? 0.7 : 1) *
  (angelOf(s, id, w)
    ? w === "handgun"
      ? ANGEL.PISTOL.RELOAD
      : ANGEL.RELOAD
    : 1); // (the double barrel: a second for each shell it loads; Angelic: 20% faster, the dual pistols twice as long)
/* crits and misses (the owner's, Nov 16 21:47Z): every gun and melee weapon crits 5% of its hits, the fast ones (those
   that fire as long as the button is down, and the burst rifle) 2.5%; each Critical Chance upgrade adds 2.5% to every
   one of them; an Angelic weapon's own chance is doubled (not the upgrades'). A hit misses ("critical failure") 2.5% of
   the time, a fast weapon's 5%. The cast iron pan keeps its own: half its swings miss, half its hits crit. The chain
   gun crits too (the fast 2.5%). The grenades, the grenade launcher and the flamethrower never crit, and the thrown
   grenade and the flamethrower never miss (the owner's, Nov 16 22:21Z); the grenade launcher's shell can */
export const CRIT = { SLOW: 0.05, FAST: 0.025, UP: 0.025 };
export const MISS = { SLOW: 0.025, FAST: 0.05 };
const NO_CRIT = ["grenade", "glauncher", "flamer"];
const fastArm = (w) =>
  !!(ARMS[w] && !ARMS[w].slow && (ARMS[w].auto || ARMS[w].burst)); // (the Tommy gun and the UMP-45 fire on and hit as the slow ones: 5% crits, 2.5% misses)
const canHit = (w) =>
  !!ARMS[w] && (ARMS[w].kind === "melee" || ARMS[w].kind === "ranged");
/* a weapon's own crit chance, and its miss chance (0: never) */
export const critOf = (w) =>
  w === "pan"
    ? ARMS.pan.crit
    : !canHit(w) || NO_CRIT.includes(w)
      ? 0
      : fastArm(w)
        ? CRIT.FAST
        : CRIT.SLOW;
export const missOf = (w) =>
  !canHit(w) || w === "pan" || w === "flamer"
    ? 0
    : fastArm(w)
      ? MISS.FAST
      : MISS.SLOW;
const headOf = (s, id, w) => {
  const own = critOf(w);
  if (!own) return 0;
  const holy = w !== "pan" && angelOf(s, id, w) ? 2 : 1; // (the pan has its own: not doubled)
  return own * holy + CRIT.UP * (upOf(s, id).acc || 0);
};
function addPts(s, id, n) {
  if (isWild(s, id)) {
    if (n > 0) s.hang.l4jp = (s.hang.l4jp || 0) + n; // (Justin's points go in the pot for everyone: potSplit)
    return;
  }
  n = fives(n); // (never anything but fives, whatever adds them: the owner's, Nov 17 19:11Z)
  if (!n || !id || !s.players[id]) return;
  s.hang.l4pt = { ...(s.hang.l4pt || {}), [id]: ptsOf(s, id) + n };
}

/* Justin's points (the owner's, Nov 17 18:05Z: the points for his kills are everyone's): they go in a pot,
   s.hang.l4jp, and at the end of each round it's split equally among the players in fives; the fives left over go to
   players picked at random, one each, and what's under 5 waits for the next round */
function potSplit(s) {
  const pot = s.hang.l4jp || 0,
    to = players(s).filter((id) => !isWild(s, id) && !isHelper(s, id));
  if (pot < 5 || !to.length) return;
  const fives = Math.floor(pot / 5),
    each = Math.floor(fives / to.length),
    lucky = [...to];
  for (let i = lucky.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lucky[i], lucky[j]] = [lucky[j], lucky[i]];
  }
  lucky.length = fives - each * to.length;
  for (const id of to) addPts(s, id, (each + (lucky.includes(id) ? 1 : 0)) * 5);
  s.hang.l4jp = pot - fives * 5;
}
export const potOf = (s) => (s && s.hang && s.hang.l4jp) || 0;

/* ---------- a game, a round ---------- */
const countFor = (s, r) => zombiesFor(r, Math.max(1, players(s).length));
function newRound(s, r, now, wait) {
  const am = s.hang.l4a || {};
  for (const id of Object.keys(am))
    for (const w of am[id].sl || [])
      if (ARMS[w] && ARMS[w].round)
        s.hang.l4a = {
          ...s.hang.l4a,
          [id]: { ...s.hang.l4a[id], am: { ...am[id].am, [w]: fullAmmo(w) } },
        }; // (Jaime: 3 again each round)
  s.jm = null; // (and every Jaime out is gone)
  s.hang.l4 = {
    ...s.hang.l4,
    r,
    t0: now + wait,
    n: countFor(s, r),
    made: 0,
    owe: 0,
    acc: 0,
    sec: -1,
    bp: {},
    dq: dropPlan(),
    due: [],
    wait: null,
    sv: null,
  };
  s.hang.l4lt =
    dp() && Math.random() < BOLT.P
      ? { next: now + wait + rnd(BOLT.FROM, BOLT.TO) }
      : null; // (Downpour: a strike of lightning this round, now and then: boltTick)
  powerRound(s, r, now, PH);
}
/* everyone up again, full: a new game, or a ghost back at the next round (where it stands now, or at a start spot) */
function bringBack(s, id, now, k, fresh) {
  const p4 = { ...(s.hang.l4p || {}) },
    was = p4[id] || {};
  p4[id] = { hp: isWild(s, id) ? WILD.hp : L4.HP, at: now };
  s.hang.l4p = p4;
  downGun(s, id, false);
  if (fresh) {
    s.hang.l4a = { ...(s.hang.l4a || {}), [id]: freshKit() };
    s.hang.l4pt = {
      ...(s.hang.l4pt || {}),
      [id]: PTS.START + ((s.hang.l4 && s.hang.l4.bonus) || 0),
    }; // (a starting round's bonus points: a duck joining later gets them too)
    s.hang.l4u = { ...(s.hang.l4u || {}), [id]: {} };
  } // (a ghost back at the next round keeps its weapons, its points and what it bought; its max HP went when it went down)
  if (s.players[id]) delete s.players[id].dead;
  const still = { ...(s.hang.still || {}) };
  delete still[id];
  s.hang.still = still;
  if (s.hang.ghost && s.hang.ghost[id]) {
    const g = { ...s.hang.ghost };
    delete g[id];
    s.hang.ghost = g;
  }
  if (fresh || was.gh) {
    const q = startSpot(k);
    s.pos[id] = {
      x: +(q.x / W).toFixed(5),
      y: +(q.y / H).toFixed(5),
      j: 0,
      z: 0,
      b: 0,
      tp: now,
    };
  }
}
/* bare floor: flat, nothing standing on it or right beside it, not by an opening or the fireplace, and far enough from
   the spots in out (the other drops) */
const bare = (x, y, out, far) =>
  playable(x, y) &&
  (!dp() || GS.inOpen(x, y)) && // (Downpour: drops come down inside the forest line, never out under the trees)
  Math.abs(heightAt(x, y)) < 1 &&
  !onPlatform(x, y) &&
  [
    [0, 0],
    [-50, 0],
    [50, 0],
    [0, -40],
    [0, 40],
  ].every(([dx, dy]) => !solidsAt(x + dx, y + dy, 0).length) &&
  OPENINGS.every((o) => Math.hypot(x - o.in[0], y - o.in[1]) > 200) &&
  Math.hypot(x - 2800, y - 1420) > 320 &&
  out.every(([a, b]) => Math.hypot(x - a, y - b) > far);
/* the jetpack's fuel: it burns while a duck flies with its jets on (its move says so: rules.js' jt), from one heartbeat to
   the next; at 0 the jets stop and the duck comes down (game.js) */
function jetBurn(s, now, ids) {
  const was = s.hang.l4jt || {},
    next = {};
  for (const id of ids) {
    const m = kitOf(s, id),
      p = s.pos[id];
    if (!m || !m.jp || !p || !p.jt) continue;
    next[id] = now;
    const c = (m.am || {}).jetpack;
    if (!c || !was[id]) continue;
    const left = Math.max(0, c[0] - Math.min(500, now - was[id]));
    s.hang.l4a = {
      ...s.hang.l4a,
      [id]: { ...m, am: { ...m.am, jetpack: [Math.round(left), 0] } },
    };
  }
  if (Object.keys(was).length || Object.keys(next).length) s.hang.l4jt = next;
}
/* ---------- the drops (Stage 4, the owner's) ----------
   Each round: a 25% chance of one in its first 30 s, and then a 25% chance of a second 30 s after it; and on their
   own, a 5% chance of a Max Ammo in the first minute. When its time comes, the next zombie killed drops it where it
   fell (the owner's, Nov 3); it lies there 30 s (the owner's, Nov 17), into the next round too, and the first duck to walk over it takes
   it for everyone. Instant Kill, Double Points and Sale last 45 s, Speed Boost a minute (the owner's, Nov 16). Which
   drop comes is a shuffle, one bag for the game: each comes once before any comes again, and Max Ammo never leaves
   the bag (the owner's, Nov 16). */
export const DROPS = ["kill", "ammo", "nuke", "speed", "double", "sale"];
export const DROP = {
  CHANCE: 0.25,
  IN: 30000, // ms: the first drop, somewhere in the round's first 30 s
  AGAIN: 0.25, // and a second one
  GAP: 30000, // 30 s after the first
  AMMO: 0.05, // the Max Ammo of its own
  AMMO_IN: 60000, // in the round's first minute
  LIFE: 30000, // ms a drop lies there (it stays through a round's end; 30 s: the owner's, Nov 17 13:43Z)
  FOR: 45000, // ms Instant Kill, Double Points and Sale last, into the next round too (the owner's, Nov 16)
  SPEED_FOR: 60000, // ms Speed Boost lasts (the owner's, Nov 4)
  AMMO_W: 1.2, // once a drop comes, Max Ammo is this likely against 1 for each of the others (the owner's, Nov 4)
  REACH: 70, // world px: how near a duck walks over one
};
const DROP_NAMES = {
  kill: "Instant Kill",
  ammo: "Max Ammo",
  nuke: "Nuke",
  speed: "Speed Boost",
  double: "Double Points",
  sale: "Sale",
};
export const dropName = (k) => DROP_NAMES[k] || k;
/* which drop: one from the game's bag (s.hang.l4bag: the ones not come yet), each as likely as the others, Max Ammo
   AMMO_W times as likely and always in it; the bag fills again once it's empty */
const BAGGED = DROPS.filter((k) => k !== "ammo");
function pickDrop(s) {
  const bag = s.hang.l4bag && s.hang.l4bag.length ? s.hang.l4bag : BAGGED,
    can = [...bag, "ammo"],
    w = (k) => (k === "ammo" ? DROP.AMMO_W : 1);
  let r = Math.random() * can.reduce((a, k) => a + w(k), 0),
    k = can[can.length - 1];
  for (const c of can)
    if ((r -= w(c)) < 0) {
      k = c;
      break;
    }
  const left = bag.filter((c) => c !== k);
  s.hang.l4bag = left.length ? left : [...BAGGED];
  return k;
}
/* when this round's drops come (ms after its start) and which: a random one, or the Max Ammo */
function dropPlan() {
  const q = [];
  if (Math.random() < DROP.CHANCE) {
    const t = rnd(0, DROP.IN);
    q.push([Math.round(t), ""]);
    if (Math.random() < DROP.AGAIN) q.push([Math.round(t + DROP.GAP), ""]);
  }
  if (Math.random() < DROP.AMMO)
    q.push([Math.round(rnd(0, DROP.AMMO_IN)), "ammo"]);
  return q;
}
/* a bare spot for a drop, inside or on the deck, away from the other drops */
function dropSpot(s) {
  const out = (s.hang.l4dr || []).map((d) => [d.x, d.y]);
  for (let k = 0; k < 400; k++) {
    const deck = Math.random() < 0.15,
      R = deck ? DECK : CABIN,
      x = Math.round(rnd(R.x0 + 110, R.x1 - 110)),
      y = Math.round(rnd(R.y0 + 80, R.y1 - 70));
    if (bare(x, y, out, 120)) return [x, y];
  }
  return null;
}
/* the drops due now come down, the old ones go, a duck walking over one takes it; and what was taken wears off */
function dropTick(s, L, zs, now, T, ids) {
  if (L.dq && L.dq.length && T >= L.dq[0][0]) {
    const [, k0] = L.dq[0];
    L.dq = L.dq.slice(1); // (L: the round, as l4Tick keeps it)
    L.due = [...(L.due || []), k0 || pickDrop(s)]; // (it waits for the next kill)
  }
  const was = s.hang.l4dr || [];
  let dr = was.filter((d) => now < d.until);
  for (const d of [...dr]) {
    const by = ids.find((id) => {
      const p = s.pos[id];
      return (
        standing(s, id) &&
        p &&
        Math.hypot(p.x * W - d.x, p.y * H - d.y) < DROP.REACH
      );
    });
    if (!by) continue;
    dr = dr.filter((x) => x !== d);
    takeDrop(s, d.k, by, zs, now, ids);
  }
  if (dr.length !== was.length) s.hang.l4dr = dr; // (only when one came or went: the state stays the same object)
  /* a drop due: the next zombie killed (a Nuke taken just now too) drops it where it fell */
  const fell = zs.filter((z) => z.st === 3 && T - z.d <= L4.FELL_MS); // (killed in the last second)
  if (L.due && L.due.length && fell.length) {
    const z = fell[Math.floor(Math.random() * fell.length)],
      [x, y] = playable(z.x, z.y) ? [z.x, z.y] : dropSpot(s) || [z.x, z.y];
    s.hang.l4dr = [
      ...(s.hang.l4dr || []),
      {
        n: now,
        k: L.due[0],
        x: Math.round(x),
        y: Math.round(y),
        until: now + DROP.LIFE,
      },
    ];
    L.due = L.due.slice(1);
  }
  const on = s.hang.l4on || {};
  if (Object.values(on).some((u) => u <= now)) {
    s.hang.l4on = Object.fromEntries(
      Object.entries(on).filter(([, u]) => u > now),
    ); // (what wore off)
    if (s.hang.l4sale && !s.hang.l4on.sale) s.hang.l4sale = null;
  }
}
/* the Nuke: each zombie it kills has a 5% chance of +250 more (the owner's, Nov 4) */
const NUKE_CRIT = 0.05;
/* what a drop does, for every duck */
function takeDrop(s, k, by, zs, now, ids) {
  addFx(s, { kind: "l4drop", k, by, who: [], t: now });
  if (k === "kill" || k === "double")
    s.hang.l4on = { ...(s.hang.l4on || {}), [k]: now + DROP.FOR };
  else if (k === "speed") {
    s.hang.l4on = { ...(s.hang.l4on || {}), speed: now + DROP.SPEED_FOR };
    const ad = { ...(s.hang.l4ad || {}) };
    for (const id of ids) ad[id] = Math.max(ad[id] || 0, now + DROP.SPEED_FOR);
    s.hang.l4ad = ad; // (the adrenaline shot's speed, for everyone)
  } else if (k === "sale") {
    s.hang.l4on = { ...(s.hang.l4on || {}), sale: now + DROP.FOR };
    s.hang.l4sale = { used: {} }; // (a new Sale: every half price can be spent again)
  } else if (k === "ammo") maxAmmo(s);
  else if (k === "nuke") s.hang.l4nk = { at: now + NUKE.SWEEP }; // (it goes off once the sweep covers the screen: nukeTick)
}
/* the Nuke on every screen (owner 2026-11-16, l4dd.js nukeScreen): grey static sweeps out over the screen in a second,
   then every zombie dies at once, burnt and blown apart, while the static covers them, so only the aftermath is ever
   drawn. Their bodies lie there 15 s (the others' 4 s) */
export const NUKE = { SWEEP: 1000, DEAD: 15000 };
function nukeTick(s, zs, now, ids) {
  const N = s.hang.l4nk;
  if (!N || N.ids || now < N.at) return;
  const T = now - s.hang.l4.t0,
    killed = [];
  let hp = 0,
    crits = 0;
  for (const z of zs)
    if (z.st !== 3) {
      hp += z.hp;
      z.hp = 0;
      die(z, T);
      s.hang.zw = { ...(s.hang.zw || {}), [z.i]: explodedLook(z.i + N.at) }; // (every one burnt and blown apart, in one of the few looks made beforehand: some headless, some with the beak and an eye gone; wounds.js)
      killed.push(z.i);
      if (Math.random() < NUKE_CRIT) crits++;
    }
  s.hang.l4nk = { at: N.at, ids: killed.length ? killed : [-1] };
  const each =
    (hp * PTS.HIT + crits * PTS.NUKE_CRIT) *
    ((s.hang.l4on || {}).double ? 2 : 1);
  for (const id of ids) addPts(s, id, each); // (every duck gets the points for all of it: the owner's, Nov 4)
}
/* Downpour's lightning (the owner's, Nov 16 23:15Z): each round has a 1% chance of a strike, some time in it, on a
   zombie out in the open that a duck has on screen. It dies burnt (no points: nobody killed it), and each strike has a
   1% chance of another one right after. Waits while there's no such zombie. s.hang.l4lt { next: when it strikes (0:
   no more this round), hit: [x, y, when] the last strike, for every screen's bolt and flash (l4ddrain.js) } */
export const BOLT = {
  P: 0.01,
  AGAIN: 0.01,
  FROM: 5000,
  TO: 40000,
  RETRY: 2000,
  NEXT: 450,
};
function boltTick(s, zs, now, ids) {
  const B = s.hang.l4lt;
  if (!B || !B.next || now < B.next) return;
  const pts = ids.filter((id) => standing(s, id)).map((id) => at(s.pos[id])),
    can = zs.filter(
      (z) =>
        z.st !== 3 &&
        !GS.buildingAt(z.x, z.y) &&
        pts.some(
          ([a, b]) =>
            Math.abs(z.x - a) < VIEW.x * 0.7 &&
            Math.abs(z.y - b) < VIEW.y * 0.7, // (well inside the screen, so it's seen)
        ),
    );
  if (!can.length) {
    s.hang.l4lt = { ...B, next: now + BOLT.RETRY };
    return;
  }
  const z = can[Math.floor(Math.random() * can.length)];
  z.hp = 0;
  die(z, now - s.hang.l4.t0);
  s.hang.zw = { ...(s.hang.zw || {}), [z.i]: explodedLook(z.i + now) }; // (burnt, as the Nuke leaves them: wounds.js)
  s.hang.l4lt = {
    next: Math.random() < BOLT.AGAIN ? now + BOLT.NEXT : 0,
    hit: [Math.round(z.x), Math.round(z.y), now],
  };
}
/* a body the Nuke left: it lies there longer */
const nuked = (s, z) => !!s.hang.l4nk && (s.hang.l4nk.ids || []).includes(z.i);
/* Max Ammo: every weapon that refills is full again, the grenades too (3); the medkit and Jaime don't come back this
   way (the medkit never refills, Jaime comes back each round) */
function maxAmmo(s) {
  const am = { ...(s.hang.l4a || {}) };
  for (const id of Object.keys(am)) {
    const m = { ...am[id], am: { ...am[id].am }, g: ARMS.grenade.most };
    for (const w of m.sl || [])
      if (
        fullAmmo(w) &&
        w !== "medkit" &&
        !ARMS[w].round &&
        !angelOf(s, id, w) // (an Angelic gun never refills, not even here: the owner's, Nov 16 22:21Z)
      )
        m.am[w] = fullFor(s, id, w);
    m.rl = 0;
    m.rw = "";
    am[id] = m;
  }
  s.hang.l4a = am;
}
function setUp(s, now) {
  helperOut(s); // (a new game: the fireplace's Justin goes)
  s.hang.l4 = { r: 1, next: 1, over: null, g: now }; // (g: when this game began, for the stats)
  s.hang.zp = [];
  s.hang.zs = {};
  s.hang.zl = {};
  s.hang.zw = {};
  syncMap();
  s.hang.brd = Object.fromEntries(
    OPENINGS.filter((o) => !o.nb).map((o) => [o.id, L4.BOARDS]),
  ); // (Downpour's fences have no boards)
  s.hang.l4p = {};
  s.hang.l4a = {};
  s.hang.l4pt = {};
  s.hang.l4jp = 0; // (Justin's pot: potSplit)
  s.hang.l4u = {};
  s.hang.l4box = {};
  s.hang.l4fo = {};
  s.hang.l4inv = {};
  s.hang.l4dr = [];
  s.hang.l4nk = null;
  s.hang.l4on = {};
  s.hang.l4sale = null;
  s.hang.l4bag = [...BAGGED];
  s.hang.l4b = {};
  s.hang.l4f = {};
  s.hang.l4am = null; // (the Angel machine, empty: l4ddangel.js)
  powerSetUp(s); // (the power is cut: the lamps are dark; the fires burn. Its box and its four parts: l4ddpower.js)
  s.hang.l4k = [];
  s.shots = [];
  players(s).forEach((id, k) => bringBack(s, id, now, k, true));
  if (dp() || s.options.wildJustin) helperIn(s, null, now, true); // (Downpour: Justin is out there, unarmed; the Justin in Duck Cabin setting brings him to the cabin too)
  newRound(s, 0, now, 0);
  s.hang.l4 = {
    ...s.hang.l4,
    n: 0,
    dq: [],
    wait: { r: 1, v: {} },
    sr: START_ROUNDS.includes(+s.options.l4start) ? +s.options.l4start : 1,
    bonus: 0,
    sv: null,
    srNo: {},
    srDone: 0,
  }; // (round 0: no zombies until enough ducks are ready)
  giveBonus(s, s.hang.l4.sr);
}
/* the starting round (the owner's, Nov 16): every game begins in round 0 and goes on to round `sr` (the "Start on round"
   setting: 1, 5, 9, 13 or 21) once everyone is ready; a starting round past 1 gives every duck bonus points, in round 0
   at once (L.bonus: what they were given, so changing the starting round gives or takes back only the difference) */
export const START_ROUNDS = [1, 5, 9, 13, 21];
export const START_PTS = { 1: 0, 5: 750, 9: 1750, 13: 2500, 21: 5000 };
export const startOf = (s) => (s && s.hang && s.hang.l4 && s.hang.l4.sr) || 1;
function giveBonus(s, sr) {
  const L = s.hang.l4,
    want = START_PTS[sr] || 0,
    d = want - (L.bonus || 0);
  if (d) {
    const pt = { ...(s.hang.l4pt || {}) };
    for (const id of players(s)) pt[id] = Math.max(0, (pt[id] || 0) + d);
    s.hang.l4pt = pt;
  }
  s.hang.l4 = { ...L, bonus: want };
}
export const GO_MS = 3000; // ms of "Round N" after the vote, before its zombies come
export const SR_VOTE_MS = 30000; // ms a "Start at round N" vote stays up
/* the starting-round vote: who may start one (not after a No, only in round 0, none up), and what it needs */
export const srOpen = (s) => {
  const L = s.hang && s.hang.l4;
  return !!L && L.r === 0 && !L.over && !!L.wait;
};
export const srVote = (s) => {
  const L = s.hang && s.hang.l4;
  return (srOpen(s) && L.sv) || null;
};
export const srCan = (s, id) =>
  srOpen(s) && !srVote(s) && !s.hang.l4.srDone && !(s.hang.l4.srNo || {})[id];
/* who End turn waits on: the fireplace's Justin never counts toward a turn */
const voters = (s) => players(s).filter((id) => !isHelper(s, id));
export const waitNeed = (s) =>
  Math.max(1, Math.ceil(voters(s).length * shareOf(s) - 1e-9));
export const waitVotes = (s) => {
  const w = s.hang && s.hang.l4 && s.hang.l4.wait;
  return w ? voters(s).filter((id) => w.v[id]).length : 0;
};
function waitTick(s, now) {
  const L = s.hang.l4,
    w = L.wait;
  if (!w) return false;
  const v = L.sv;
  if (v && L.r === 0 && now >= v.until) {
    s.hang.l4 = { ...L, sv: null }; // (a vote that ran out: nothing changes)
    return true;
  }
  if (waitVotes(s) < waitNeed(s)) return false;
  newRound(s, L.r === 0 ? L.sr || 1 : w.r, now, GO_MS);
  return true;
}
rule("l4", {
  only: "l4dd",
  ghosts: true,
  init: () => ({ power: 0, ghost: {}, still: {} }),
  start(s, now) {
    setUp(s, now);
  },
  join(s, id) {
    const now = Date.now();
    bringBack(s, id, now, players(s).indexOf(id), true);
  },
  left(s, id) {
    for (const k of ["l4p", "l4a", "l4b", "l4f", "l4pt", "l4u"])
      if (s.hang[k] && s.hang[k][id] !== undefined) {
        const o = { ...s.hang[k] };
        delete o[id];
        s.hang[k] = o;
      }
    dropBox(s, id);
    angelLeft(s, id);
    const p4 = s.hang.l4p || {},
      now = Date.now();
    for (const [t, p] of Object.entries(p4))
      if (p.rv && p.rv.by === id)
        s.hang.l4p = {
          ...p4,
          [t]: { ...p, rv: null, dn: p.dn + (now - p.rv.at) },
        }; // (the bleeding-out waited meanwhile)
  },
  act(s, a, now) {
    return l4Act(s, a, now);
  },
  tick(s, now) {
    return l4Tick(s, now);
  },
});

/* ---------- what a duck does: E (revive, board up), key 0 (the flashlight), Play again ---------- */
/* a starting-round vote passes with the room's share of Yes (like End turn), and falls when that can't happen any more */
function srCheck(s) {
  const L = s.hang.l4,
    sv = L.sv;
  if (!sv) return;
  const ids = voters(s),
    yes = ids.filter((id) => sv.v[id] === 1).length,
    no = ids.filter((id) => sv.v[id] === 0).length,
    need = waitNeed(s);
  if (yes >= need) {
    s.hang.l4 = { ...L, sv: null, sr: sv.n, srDone: 1 }; // (passed: the button goes, the text stays)
    giveBonus(s, sv.n);
    s.options.l4start = sv.n; // (its stats and the setting follow)
  } else if (ids.length - no < need) s.hang.l4 = { ...L, sv: null };
}
function l4Act(s, a, now) {
  const id = a.id,
    L = s.hang.l4,
    me = s.pos[id];
  if (!L || !me) return false;
  if (a.do === "again") {
    if (!L.over || s.hostId !== id) return false;
    setUp(s, now);
    return true;
  }
  if (a.do === "fl") {
    const f = { ...(s.hang.l4f || {}) };
    if (f[id]) delete f[id];
    else f[id] = 1;
    s.hang.l4f = f;
    return true;
  }
  if (a.do === "endturn") {
    if (L.over || !L.wait || isHelper(s, id)) return false; // (Justin can't end a rest phase: the owner's, Nov 17 13:38Z)
    const v = { ...L.wait.v };
    if (a.on === false) delete v[id];
    else v[id] = 1;
    s.hang.l4 = { ...L, wait: { ...L.wait, v } };
    waitTick(s, now);
    return true;
  } // (End turn, or Ready in round 0; ghosts and downed ducks may press it too)
  if (a.do === "sr") {
    // Change starting round: a vote "Start at round N", the asker's Yes in it
    const n = +a.n;
    if (!START_ROUNDS.includes(n) || !srCan(s, id)) return false;
    s.hang.l4 = {
      ...L,
      sv: { n, by: id, v: { [id]: 1 }, until: now + SR_VOTE_MS },
    };
    srCheck(s);
    return true;
  }
  if (a.do === "srv") {
    const sv = srVote(s);
    if (!sv || (sv.v || {})[id] !== undefined || !voters(s).includes(id))
      return false;
    const no = a.on === false;
    s.hang.l4 = {
      ...L,
      sv: { ...sv, v: { ...sv.v, [id]: no ? 0 : 1 } },
      ...(no ? { srNo: { ...(L.srNo || {}), [id]: 1 } } : {}), // (a No: this duck can't start another one)
    };
    srCheck(s);
    return true;
  }
  if (a.do === "sk") {
    const p4 = s.hang.l4p || {},
      p = p4[id];
    if (L.over || !p || !p.dn || !p.sk || p.skAt || !hasSafe(s, id))
      return false;
    s.hang.l4p = { ...p4, [id]: { ...p, skAt: now + SAFE.GLOW, rv: null } };
    return true;
  } // (Safe Keeping: I get myself up, E while down)
  if (L.over || !standing(s, id)) return false;
  const [mx, my] = at(me);
  if (a.do === "rev") {
    const t = String(a.on || ""),
      p4 = s.hang.l4p || {},
      tp = p4[t],
      pos = s.pos[t];
    if (!tp || !tp.dn || !pos || t === id) return false;
    if (!a.hold) {
      if (!tp.rv || tp.rv.by !== id) return false;
      s.hang.l4p = {
        ...p4,
        [t]: { ...tp, rv: null, dn: tp.dn + (now - tp.rv.at) },
      }; // (a revive pauses the bleeding-out: it goes on from where it was, the owner's, Nov 17 11:07Z)
      return true;
    }
    const [tx, ty] = at(pos);
    if (Math.hypot(tx - mx, ty - my) > L4.REACH * 1.6) return false;
    if (tp.ex) return false; // (Justin in Downpour, dead for good)
    if (tp.rv && tp.rv.by !== id && s.pos[tp.rv.by]) return false; // (someone else is at it)
    if (me.w === "medkit" && slotsOf(s, id).includes("medkit")) {
      /* a medkit in my hand: up at once, full, with what they bought; the medkit is used up (the owner's, Nov 16) */
      getUp(s, t, now, true);
      const kit = kitOf(s, id),
        am = { ...kit.am };
      delete am.medkit;
      s.hang.l4a = {
        ...s.hang.l4a,
        [id]: { ...kit, am, sl: kit.sl.map((w) => (w === "medkit" ? "" : w)) },
      };
      addFx(s, { kind: "l4medrev", by: id, who: [t], t: now });
      return true;
    }
    s.hang.l4p = { ...p4, [t]: { ...tp, rv: { by: id, at: now } } };
    return true;
  }
  if (a.do === "board") {
    const o = openingById(a.o),
      b = { ...(s.hang.l4b || {}) };
    if (!a.hold) {
      if (!b[id]) return false;
      delete b[id];
      s.hang.l4b = b;
      return true;
    }
    if (!o || o.nb || Math.hypot(o.in[0] - mx, o.in[1] - my) > L4.REACH * 1.6)
      return false;
    if ((s.hang.brd || {})[o.id] >= L4.BOARDS) return false;
    b[id] = { o: o.id, at: now };
    s.hang.l4b = b;
    return true;
  }
  if (a.do === "jplan" || a.do === "jbody")
    return justinBody(s, a.do, id, now, mx, my);
  if (a.do === "givej")
    return giveJustin(s, id, String(a.what || ""), mx, my, now);
  if (a.do === "buy")
    return buy(s, id, String(a.what || ""), mx, my, a.hand, now);
  if (a.do === "ammo")
    return buyGun(s, id, String(a.what || ""), "", true, now); // (B: anywhere, the gun in hand)
  if (a.do === "box") return fireplace(s, id, a, now, mx, my);
  if (a.do === "power") return powerAct(s, id, now, mx, my, PH);
  if (a.do === "pump") return powerPump(s, id, now, mx, my, PH);
  if (a.do === "angel") return angelAct(s, id, a, now, mx, my, PH);
  return false;
}
/* a duck buys Justin out in Downpour a gun (the owner's, Nov 17): standing by him, in the rest phase any gun of WILD_GUNS,
   outside it the first one; it comes out of my points. He keeps it (endless bullets that still reload), can't be hurt by
   players any more, and the points for his kills go in the pot for everyone (potSplit) */
function justinBody(s, what, id, now, mx, my) {
  const L = s.hang.l4,
    B = jaimeBody();
  if (!isWild(s, id) || id !== WILD.id || !B || !L || !L.wait || L.over)
    return false;
  let v = s.hang.l4jv;
  if (!v || v.r !== L.wait.r) {
    v = { r: L.wait.r, left: Math.random() < 0.5 ? 2 : 0, at: 0 }; // (this rest phase: half the time twice, else not at all)
    s.hang.l4jv = v;
  }
  if (what === "jplan") return true;
  if (v.left <= 0 || now - v.at < JBODY.gap) return false;
  if (Math.hypot(mx - B.x, my - B.y) > JBODY.near) return false;
  s.hang.l4jv = { ...v, left: v.left - 1, at: now };
  justinSays(s, "jaime");
  return true;
}
function giveJustin(s, id, what, mx, my, now) {
  const J = wildFor(s),
    pj = J && s.pos[J],
    rest = !!(s.hang.l4 && s.hang.l4.wait),
    w = rest && WILD_GUNS.includes(what) ? what : WILD_GUNS[0],
    price = wildPrice(s, w);
  if (!J || !pj || !standing(s, id) || price === null) return false;
  if (Math.hypot(pj.x * W - mx, pj.y * H - my) > L4.REACH * 1.2) return false;
  if (ptsOf(s, id) < price) return false;
  addPts(s, id, -price);
  s.players[J] = { ...s.players[J], armed: 1, by: id };
  const kit = freshKit();
  kit.sl = ["", w, "", ""];
  kit.am = { [w]: fullAmmo(w) };
  s.hang.l4a = { ...s.hang.l4a, [J]: kit };
  s.pos[J] = { ...s.pos[J], w };
  addFx(s, { kind: "l4medrev", by: id, who: [J], t: now }); // (the revive's flash: a little thank-you)
  return true;
}
/* Justin's Butler: an upgrade, from beside him, while I have the points (and haven't bought it as often as it goes) */
function buy(s, id, what, mx, my, hand, now) {
  if (what === "part" || what === "partfire") {
    if (Math.hypot(BUTLER.x - mx, BUTLER.y - my) > SHOP_REACH * 2) return false;
    return powerBuy(s, id, now, PH, what === "partfire");
  }
  if (what === "safekeep") {
    if (Math.hypot(BUTLER.x - mx, BUTLER.y - my) > SHOP_REACH * 2) return false;
    const price = safePrice(s);
    if (hasSafe(s, id) || ptsOf(s, id) < price) return false;
    if (!give(s, id, "safekeep", hand)) return false;
    addPts(s, id, -price);
    addFx(s, { kind: "l4buy", by: id, who: [], w: what, t: now });
    return true;
  }
  if (GUN_SHOP.includes(what)) {
    if (Math.hypot(BUTLER.x - mx, BUTLER.y - my) > SHOP_REACH * 2) return false;
    return buyGun(s, id, what, hand, false, now);
  }
  const it = SHOP.find((x) => x.id === what),
    up = upOf(s, id),
    n = up[what] || 0;
  if (!it || n >= it.most) return false;
  if (Math.hypot(BUTLER.x - mx, BUTLER.y - my) > SHOP_REACH * 2) return false;
  const price = priceFor(s, id, what, n);
  if (ptsOf(s, id) < price) return false;
  addPts(s, id, -price);
  if (saleOn(s) && price < priceOf(what, n)) {
    const sale = s.hang.l4sale,
      used = sale.used || {};
    s.hang.l4sale = {
      ...sale,
      used: { ...used, [id]: { ...(used[id] || {}), [what]: 1 } },
    };
  } // (its half price is spent)
  s.hang.l4u = { ...(s.hang.l4u || {}), [id]: { ...up, [what]: n + 1 } };
  if (what === "hp") {
    const p4 = s.hang.l4p || {};
    if (p4[id]) s.hang.l4p = { ...p4, [id]: { ...p4[id], hp: p4[id].hp + 1 } };
  } // (the new HP comes full)
  return true;
}
/* the fireplace: E pays and it spins; once it has landed, E takes the weapon (only whoever paid): a melee weapon or a
   special takes its own slot, a ranged one the ranged weapon in hand (a.hand, else the one the duck holds out, else the
   first ranged slot). Every duck spins its own (the owner's, Nov 3: one duck's weapon kept everyone else waiting) */
const boxesOf = (s) => {
  const b = s && s.hang && s.hang.l4box;
  return b && !b.by ? b : {};
};
function dropBox(s, id) {
  const b = { ...boxesOf(s) };
  if (!b[id]) return;
  delete b[id];
  s.hang.l4box = b;
}
/* the weapon the fireplace shows for duck `id`; with no id, the newest one anyone spun */
export const boxNow = (s, now, id) => {
  const live = (b) => b && now < b.t + BOX.spin + BOX.keep;
  if (id) return live(boxesOf(s)[id]) ? boxesOf(s)[id] : null;
  return (
    Object.values(boxesOf(s))
      .filter(live)
      .sort((a, b) => b.t - a.t)[0] || null
  );
};
function fireplace(s, id, a, now, mx, my) {
  if (Math.hypot(BOX.x - mx, BOX.y - my) > SHOP_REACH * 2) return false;
  const b = boxNow(s, now, id),
    kit = kitOf(s, id);
  if (!kit) return false;
  if (!b) {
    const pool = POOL.filter((w) => !kit.sl.includes(w));
    const price = priceFor(s, id, "box");
    if (!pool.length || ptsOf(s, id) < price) return false;
    addPts(s, id, -price);
    s.hang.l4hood = 1; // (Downpour: the hood-up car stops glowing once it's first used)
    s.hang.l4box = {
      ...boxesOf(s),
      [id]: {
        by: id,
        t: now,
        w: fireRoll(s, id, kit),
      },
    };
    return true;
  }
  if (b.by !== id || now < b.t + BOX.spin || b.w === HELPER.w) return false; // (Justin isn't taken: he climbs out)
  if (isPw(b.w)) {
    powerTake(s, b.w, id, now, PH); // (a part or a jerry can: into everyone's pool)
    dropBox(s, id);
    return true;
  }
  if (!give(s, id, b.w, a.hand)) return false;
  if (b.w === "jaimebomb") jaimeCount(s, { got: id }); // (unlocks.js)
  dropBox(s, id);
  addFx(s, { kind: "l4take", by: id, who: [], w: b.w, t: now });
  return true;
}
/* the fireplace's spin, in this order (the owner's, Nov 15). An item comes 15 spins in 100, and for each duck that moves
   (the owner's, Nov 16): every weapon in a row makes an item 10 points likelier next spin; two items in a row make it 5
   points less likely (and each more item after them 5 more); a weapon puts the items' count back to 0, an item the
   weapons' */
export const ITEM_ODDS = { start: 1 - WEAPON_ODDS, weapon: 0.1, twice: 0.05 };
export function itemOdds([wr, ir] = [0, 0]) {
  const v =
    ITEM_ODDS.start +
    ITEM_ODDS.weapon * wr -
    ITEM_ODDS.twice * Math.max(0, ir - 1);
  return Math.min(0.95, Math.max(0.02, v));
}
function fireRoll(s, id, kit) {
  if (HELPER.on && Math.random() < HELPER.chance && !s.players[HELPER.id])
    return HELPER.w; // 1 in 100: Justin (off: HELPER.on)
  const pw = powerFire(s); // (the power box's part, or a jerry can, before the weapons: l4ddpower.js)
  if (pw) return pw;
  if (Math.random() < BOMB.fire && !kit.sl.includes("jaimebomb"))
    return "jaimebomb"; // 1 in 50: the Jaime Bomb (unlocked for good once taken)
  const fo = (s.hang.l4fo || {})[id] || [0, 0],
    bags = MELEE_BAGS.map((b) => b.filter((w) => !kit.sl.includes(w))).filter(
      (b) => b.length,
    ),
    heavy = HEAVY_BAG.filter((w) => !kit.sl.includes(w)),
    weapons = [
      ...WEAPONS.filter(
        (w) =>
          !kit.sl.includes(w) &&
          !MELEE_BAGS.some((b) => b.includes(w)) &&
          !HEAVY_BAG.includes(w),
      ),
      ...(bags.length ? ["melee"] : []),
      ...(heavy.length ? ["heavy"] : []),
    ],
    items = ITEMS.filter((w) => !kit.sl.includes(w)),
    item = !weapons.length || (!!items.length && Math.random() < itemOdds(fo)),
    group = item ? items : weapons;
  s.hang.l4fo = {
    ...s.hang.l4fo,
    [id]: item ? [0, fo[1] + 1] : [fo[0] + 1, 0],
  };
  const w = anyIn(group);
  return w === "melee" ? anyIn(anyIn(bags)) : w === "heavy" ? anyIn(heavy) : w; // (the melee bag: the blunt bag or the sharp bag, then one in it; the heavy bag: the chain gun or the flamethrower)
}
const anyIn = (xs) => xs[Math.floor(Math.random() * xs.length)];
/* the fireplace's Justin (the owner's, Nov 4): 1 spin in 100 lands on him (never while he's already here), and a
   moment later he climbs out of the fire and joins as another player, to help. He starts with 1,500 points of his own,
   all his HP, the knife, the chain gun and the pistol; every rule is the same for him as for any duck (l4ddbots.js
   plays him). He goes when the game does: Play again, or back to the lobby.
   Off since Nov 16 (the owner's: "Justin will be removed from the zombie game because I do not want to force him into
   it"): the fireplace never lands on him, and the General Settings Justin switch doesn't bring him in */
export const HELPER = {
  on: false,
  id: "b-justin",
  w: "justin",
  chance: 0.01,
  pts: 1500,
  out: 1200,
};
export const isHelper = (s, id) => !!(s.players[id] && s.players[id].helper);
/* Justin in Downpour (the owner's, Nov 17): the map starts with him out there, unarmed and running from the zombies. He
   has WILD.hp HP and gets 1 back every WILD.regen ms; zombies and, while he has no weapon, players can hurt and kill him
   (ex: dead for good: his body stays, nobody can revive him, he never comes back, not at a new round either). He is the
   fireplace's Justin (helperIn, the same player and brain) with no weapon and no points */
export const WILD = { hp: 6, regen: 60000, id: "b-justin", extra: 100 };
/* the guns a duck can buy him in the rest phase (the owner's, Nov 17: for the Butler's price and WILD.extra points more);
   outside the rest phase the click buys the first one. Widen this list to let players buy more */
export const WILD_GUNS = ["handgun"];
/* what Justin says in Downpour (the owner's, Nov 17: only lines already in the game, ones a crazy Justin could shout): at the
   zombies with his gun, some of his GOD lines and his insults; at Jaime's body, his lines against Jaime. Each list is a
   shuffled bag, every line once before any comes again (s.hang.l4jl { key: [line numbers left] }) */
const FIGHT = [
  ...[3, 5, 9, 10, 11, 14, 0, 4].map((i) => GOD_LINES[i]),
  ...E_LINES.filter((l) =>
    [
      "Shut up, you stupid IDIOT!",
      "You're such a stupid flipping IDIOT!",
    ].includes(l),
  ),
];
const LINES = { fight: FIGHT, jaime: JUSTIN_AT_JAIME, death: DEATH_LINES };
/* his own lines (the owner's, Nov 17 18:05Z: "all of his normal lines ... just like his script is supposed to do"): as in
   Duck Cabin (justin.js), on his own a random one of E_LINES every 45 to 90 seconds; a death line when he goes down; a
   line against Jaime when a duck sends a Jaime in (a Jaime Bomb gets his snap: jaimeSnap) */
const CHAT = [45000, 90000];
function justinChat(s, now) {
  const q = P4(s, WILD.id);
  if (!isWild(s, WILD.id) || !q || q.dn || q.gh) return;
  if (!s.hang.l4jc) s.hang.l4jc = now + rnd(...CHAT) * 0.5;
  if (now < s.hang.l4jc) return;
  s.hang.l4jc = now + rnd(...CHAT);
  logIn(s, {
    from: WILD.id,
    to: null,
    text: E_LINES[Math.floor(Math.random() * E_LINES.length)],
  });
}
/* is the Justin out there (or the fireplace's) here and up, to say something? */
const justinUp = (s) => {
  const q = P4(s, HELPER.id);
  return !!s.players[HELPER.id] && !!q && !q.dn && !q.gh;
};
function justinSays(s, key) {
  const list = LINES[key],
    bags = { ...(s.hang.l4jl || {}) };
  let bag = bags[key] && bags[key].length ? [...bags[key]] : null;
  if (!bag) {
    bag = list.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  const n = bag.pop();
  bags[key] = bag;
  s.hang.l4jl = bags;
  logIn(s, { from: HELPER.id, to: null, text: list[n] });
}
/* Jaime's body (Noah's, on the chapel floor: GS.JAIME_BODY { x, y }); in a rest phase Justin goes to it half the time, and
   at most twice, and says a line each time. s.hang.l4jv = { r (the round), left (visits), at (the last one) } */
export const jaimeBody = () => GS.JAIME_BODY || null;
export const JBODY = { near: 110, gap: 8000 };
/* Justin is out there for a buy: alive, up, with nothing in his hands */
export const wildFor = (s) => {
  const q = P4(s, WILD.id);
  return wildOpen(s, WILD.id) && !!q && !q.dn && !q.gh ? WILD.id : null;
};
/* what buying him gun w costs duck id now: the Butler's price, and in the rest phase WILD.extra more (null: not for sale) */
export function wildPrice(s, w) {
  if (!WILD_GUNS.includes(w) || !GUN_SHOP.includes(w)) return null;
  const rest = !!(s.hang.l4 && s.hang.l4.wait);
  return buyPrice(w) + (rest ? WILD.extra : 0);
}
export function isWild(s, id) {
  return !!(s && s.players && s.players[id] && s.players[id].wild);
}
/* he's out there with nothing in his hands (players can hurt him; a weapon of his own comes later) */
export const wildOpen = (s, id) => isWild(s, id) && !s.players[id].armed;
function helperIn(s, by, now, wild = false) {
  const id = HELPER.id;
  if (s.players[id]) return;
  s.players[id] = {
    id,
    name: "Justin",
    bot: true,
    helper: 1,
    ...(wild ? { wild: 1 } : {}),
    duck: { ...JUSTIN },
    card: {},
    nameStyle: {},
    ready: true,
    joined: now,
  };
  s.seat.push(id);
  bringBack(s, id, now, players(s).length, true);
  const kit = freshKit();
  kit.sl = wild ? ["", "", "", ""] : ["knife", "chaingun", "handgun", ""];
  kit.am = wild
    ? {}
    : { chaingun: fullAmmo("chaingun"), handgun: fullAmmo("handgun") };
  s.hang.l4a = { ...s.hang.l4a, [id]: kit };
  s.hang.l4pt = { ...s.hang.l4pt, [id]: wild ? 0 : HELPER.pts };
  if (wild) {
    s.pos[id] = { ...s.pos[id], w: "" };
    return;
  }
  const out = [BOX.x, BOX.y + 70];
  if (playable(...out) && standable(...out, heightAt(...out), STEP))
    s.pos[id] = {
      ...s.pos[id],
      x: +(out[0] / W).toFixed(5),
      y: +(out[1] / H).toFixed(5),
      w: "chaingun",
    };
  else s.pos[id] = { ...s.pos[id], w: "chaingun" };
  addFx(s, { kind: "l4justin", by, who: [], t: now });
  say(s, "Justin joined.");
}
/* Justin goes (a new game, the lobby) */
export function helperOut(s) {
  const id = HELPER.id;
  if (!s.players[id]) return;
  delete s.players[id];
  s.seat = s.seat.filter((t) => t !== id);
  if (s.pos) delete s.pos[id];
  if (s.rainbow) delete s.rainbow[id];
  if (s.hang)
    for (const k of [
      "l4p",
      "l4a",
      "l4b",
      "l4f",
      "l4pt",
      "l4u",
      "l4box",
      "l4fo",
    ])
      if (s.hang[k] && s.hang[k][id] !== undefined) {
        const o = { ...s.hang[k] };
        delete o[id];
        s.hang[k] = o;
      }
}
/* weapon w into duck id's slots, full: a melee weapon or a special takes its own slot, a ranged one the ranged weapon
   in hand (hand, else the one the duck holds out, else the first ranged slot) */
function give(s, id, w, hand0) {
  const kit = kitOf(s, id),
    kind = kindOf(w),
    hand = kit && kit.sl.includes(hand0) ? hand0 : (s.pos[id] || {}).w;
  if (!kit) return false;
  let k = kind === "melee" ? 0 : kind === "special" ? 3 : -1;
  if (kind === "ranged") {
    k = [1, 2].find((i) => kit.sl[i] === hand) ?? 1; // (no ranged weapon in hand: it takes the first ranged slot's place)
  }
  if (k < 0 || kit.sl.includes(w)) return false;
  const old = kit.sl[k],
    am = { ...kit.am },
    ang = { ...(kit.ang || {}) };
  delete am[old];
  delete ang[old]; // (its Angelic power goes with it: l4ddangel.js)
  if (fullAmmo(w)) am[w] = fullAmmo(w);
  const sl = [...kit.sl];
  sl[k] = w;
  s.hang.l4a = {
    ...s.hang.l4a,
    [id]: {
      ...kit,
      sl,
      am,
      ang,
      ...(kit.rw === old ? { rl: 0, rw: "" } : {}),
    },
  };
  return true;
}
/* a gun from the Butler: bought (into my slots, as the fireplace's), or filled to the top (Refill; B does the same for
   the gun in hand, from anywhere: only one of his, only when it isn't full, only with the points for all of it) */
function buyGun(s, id, w, hand, refillOnly, now) {
  const kit = kitOf(s, id),
    price = gunPrice(s, id, w);
  if (!kit || !price || ptsOf(s, id) < price) return false;
  const have = kit.sl.includes(w);
  if (refillOnly && !have) return false;
  if (have) {
    s.hang.l4a = {
      ...s.hang.l4a,
      [id]: {
        ...kit,
        am: { ...kit.am, [w]: fullFor(s, id, w) },
        ...(kit.rw === w ? { rl: 0, rw: "" } : {}),
      },
    };
  } else if (!give(s, id, w, hand)) return false;
  addPts(s, id, -price);
  addFx(s, { kind: "l4buy", by: id, who: [], w, t: now }); // (Miles Jr.'s cash register can hang on this)
  return true;
}

/* ---------- the weapons (rules.js sends the 'use' and 'reload' actions here) ---------- */
const aimDir = (a) => {
  const ax = (+a.ax || 0) * W,
    ay = (+a.ay || 0) * H,
    l = Math.hypot(ax, ay);
  return l > 1e-6 ? [ax / l, ay / l] : [a.face < 0 ? -1 : 1, 0];
};
/* a reload that's done: the magazine fills from the rest */
function finishReload(m, now) {
  if (!m.rl || now < m.rl) return false;
  const w = m.rw,
    c = m.am && m.am[w];
  if (w === "dg" && m.dg !== undefined)
    m.dg = ARMS.handgun.mag; // (the down pistol: its bullets never run out)
  else if (c && magIn(m, w)) {
    const k = Math.min(magIn(m, w) - c[0], c[1]);
    m.am = { ...m.am, [w]: [c[0] + k, c[1] - k] };
  }
  m.rl = 0;
  m.rw = "";
  return true;
}
/* R: the ranged weapon in hand reloads (one with a magazine, not full, with bullets left) */
function startReload(s, id, m, w, now) {
  if (w === "dg") {
    if (m.rl || m.dg === undefined || m.dg >= ARMS.handgun.mag) return false;
    m.rt = reloadOf(s, id, "handgun", [m.dg, ARMS.handgun.mag]);
    m.rl = now + m.rt;
    m.rw = "dg";
    return true;
  } // (the down pistol)
  const c = m.am[w];
  if (!magIn(m, w) || !c || m.rl) return false;
  if (c[0] >= magIn(m, w) || c[1] <= 0) return false;
  m.rt = reloadOf(s, id, w, c);
  m.rl = now + m.rt;
  m.rw = w;
  return true;
}
export function l4Reload(s, a, now) {
  const m0 = kitOf(s, a.id),
    down = downArmed(s, a.id),
    w = down ? "dg" : l4Holds(s, a.id, a.w) ? a.w : (s.pos[a.id] || {}).w;
  if (!m0 || !(down || (standing(s, a.id) && l4Holds(s, a.id, w))))
    return false;
  const m = { ...m0 };
  finishReload(m, now);
  if (!startReload(s, a.id, m, w, now)) return false;
  s.hang.l4a = { ...s.hang.l4a, [a.id]: m };
  return true;
}
/* what the power box's rules (l4ddpower.js) use of these */
const PH = {
  players: (s) => players(s),
  standing: (s, id) => standing(s, id),
  ptsOf: (s, id) => ptsOf(s, id),
  addPts: (s, id, n) => addPts(s, id, n),
  addFx: (s, f) => addFx(s, f),
  playable: (x, y) => playable(x, y),
  dropSpot: (s) => dropSpot(s),
  kitOf: (s, id) => kitOf(s, id),
  give: (s, id, w, hand) => give(s, id, w, hand),
  full: (w) => fullAmmo(w),
  arm: (w) => ARMS[w],
  weapons: WEAPONS,
  /* the world's size now (layout.js changes it for Downpour): read when used, never kept from when this was made, or
     on Downpour a duck stood on a part and never took it (the owner's, Nov 17 05:46Z: the restroom's pickup) */
  get W() {
    return W;
  },
  get H() {
    return H;
  },
};
const addFx = (s, f) => {
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, ...f }];
  return s.fxN;
};
export function l4Use(s, a, now) {
  const id = a.id,
    what = String(a.what || ""),
    p = s.pos[id],
    L = s.hang && s.hang.l4,
    m0 = kitOf(s, id),
    A = ARMS[what],
    kind = kindOf(what),
    down = what === "handgun" && downArmed(s, id), // (the down pistol: the only thing a downed duck uses)
    rw = down ? "dg" : what;
  if (!L || L.over || !p || !m0 || !(down || standing(s, id)) || !A)
    return false;
  if (!down && kind !== "grenade" && !m0.sl.includes(what)) return false;
  if ((kind === "melee" || kind === "ranged") && swims(s, id)) return false; // (swimming: put away)
  if (what === "safekeep") return false; // (never by hand: it works by itself)
  const m = { ...m0, u: { ...m0.u }, am: { ...m0.am } };
  finishReload(m, now);
  if (now - (m.u[what] || 0) < l4Cool(s, id, what) * (A.auto ? 0.8 : 1))
    return false; // (full auto: the shots can come a little bunched over the network)
  if (what === "jetpack") {
    m.u[what] = now;
    m.jp = !m.jp;
    s.hang.l4a = { ...s.hang.l4a, [id]: m };
    return true;
  } // (switched on or off, empty or not: its fuel burns only in flight, in l4Tick)
  const c = down ? [m.dg, ARMS.handgun.mag] : m.am[what];
  if (kind === "grenade" ? m.g <= 0 : c && (c[0] <= 0 || m.rw === rw))
    return false; // (empty, or reloading)
  if (what === "medkit" && (P4(s, id) || {}).hp >= maxHp(s, id)) return false; // (nothing to heal)
  if (what === "zebra" && s.zcake) return false; // (one zebra cake in the room at a time)
  if (what === "laser" && laserHeat(s, id, now).over) return false; // (overheated: it can't fire until it has cooled)
  m.u[what] = now;
  if (m.rw && m.rw !== rw) {
    m.rl = 0;
    m.rw = ""; // (something else used before the reload was done: it's lost, the owner's, Nov 16)
  }
  const [dx, dy] = aimDir(a),
    face = dx < 0 ? -1 : 1,
    [px, py] = at(p),
    hz = Math.round(+p.z || 0);
  const n = addFx(s, {
    kind: "use",
    what,
    by: id,
    who: [id],
    face,
    t: now,
    ax: +(dx / W).toFixed(5),
    ay: +(dy / H).toFixed(5),
  });
  const dual = what === "handgun" && angelOf(s, id, what), // (the Angelic pistols: they take turns, one bullet each press)
    many = A.burst ? Math.min(A.burst, c[0]) : 1; // (the burst rifle: three rounds a press, or the rest of its clip)
  if (dual) m.alt = (m.alt || 0) ^ 1; // (which pistol fires: the left, then the right …)
  if (kind === "grenade") m.g--;
  else if (down) {
    m.dg = c[0] - 1;
    if (m.dg <= 0) startReload(s, id, m, "dg", now);
  } else if (c) {
    m.am[what] = [c[0] - many, c[1]];
    if (c[0] - many <= 0) startReload(s, id, m, what, now); // (empty: it reloads by itself)
  }
  if (kind === "melee") {
    s.hang.l4k = [
      ...(s.hang.l4k || []).filter(
        (k) => now - k.t < (ARMS[k.w] || A).swing && k.by !== id,
      ),
      {
        by: id,
        w: what,
        dx,
        dy,
        t: now,
        hit: [],
        ...(A.miss && Math.random() < A.miss ? { miss: 1 } : {}), // (the pan: it swings through nothing)
      },
    ];
    meleeHits(s, now);
  } else if (what === "medkit") {
    const p4 = s.hang.l4p || {};
    s.hang.l4p = { ...p4, [id]: { ...p4[id], hp: maxHp(s, id), at: now } };
    delete m.am.medkit;
    m.sl = m.sl.map((w) => (w === "medkit" ? "" : w)); // (used up: the special slot is empty again)
  } else if (what === "adrenaline")
    s.hang.l4ad = { ...(s.hang.l4ad || {}), [id]: now + A.ms };
  else if (what === "longjump") m.lj = !m.lj;
  else if (what === "jaime" || what === "jaimebomb")
    jaimeIn(s, id, p, now, bombRoll(what));
  else if (what === "zebra") cakeOut(s, id, p, dx, dy, now);
  else if (what === "chaingun") trace(s, id, px, py, dx, dy, hz, now);
  else if (what === "laser") laser(s, id, m, px, py, dx, dy, hz, now);
  else if (what === "flamer") flame(s, id, m, px, py, dx, dy, hz, now);
  else {
    const mine =
      what !== "grenade" &&
      myFloor(zombies(s), px, py, hz, dx, dy, (A.far || 1600) * 1.2); // (Doom's: heights.js holds it to my floor)
    const shot = (k, ux, uy, v, more) => ({
      n,
      by: id,
      w: what,
      k,
      x0: p.x,
      y0: p.y,
      vx: +((ux * v) / W).toFixed(5),
      vy: +((uy * v) / H).toFixed(5),
      t: now,
      lx: p.x,
      ly: p.y,
      hz,
      hin: inCabin(px, py) ? 1 : 0,
      ...(mine ? { lh: floorLock(hz) } : {}),
      ...more,
    });
    if (what === "shotgun") {
      const a0 = Math.atan2(dy, dx),
        out = [];
      for (let i = 0; i < A.pellets; i++) {
        const an =
          a0 +
          A.spread * ((i / (A.pellets - 1)) * 2 - 1) +
          (Math.random() - 0.5) * 0.08;
        out.push(
          shot("pellet", Math.cos(an), Math.sin(an), A.speed * FASTER, {
            n: n * 10 + i,
            life: A.life,
          }),
        );
      }
      s.shots = [...(s.shots || []), ...out];
    } else {
      const v =
          what === "grenade"
            ? ARMS.grenade.far / (GRENADE_MS / 1000)
            : A.speed * (BULLETS.has(what) ? FASTER : 1), // (arrows, bullets and daggers: a little faster, as in every mode)
        k =
          what === "bow"
            ? "arrow"
            : what === "glauncher"
              ? "lgren"
              : A.k || what; // (the new guns' bullets each look their own way)
      const out = [];
      for (let i = 0; i < many; i++)
        out.push(
          shot(k, dx, dy, v, {
            ...(what === "glauncher"
              ? { life: (A.far / A.speed) * 1000 }
              : i
                ? { n: n * 10 + i, t: now + i * (A.gap || 60) }
                : {}),
            ...(dual ? { al: m.alt } : {}), // (the Angelic pistols: which one fired it, game.js' muzzle flash)
          }),
        ); // (a burst's rounds leave one after another: each waits until its time, t)
      s.shots = [...(s.shots || []), ...out];
    }
  }
  s.hang.l4a = { ...s.hang.l4a, [id]: m };
  return true;
}
/* the zombies one of duck by's shots from weapon w goes through (0: it stops at the first): the sniper's 3; Angelic,
   the bow through one zombie and the sniper through two more (l4ddangel.js) */
export const pierceOf = (s, by, w) =>
  !angelOf(s, by, w)
    ? (ARMS[w] && ARMS[w].pierce) || 0
    : w === "bow"
      ? ANGEL.BOW
      : w === "sniper"
        ? ARMS.sniper.pierce + ANGEL.SNIPER
        : (ARMS[w] && ARMS[w].pierce) || 0;
/* a hit from duck by's weapon w on a zombie anywhere else (Mad God Justin's waves: the owner's, Nov 17 16:23Z, "guns do
   their normal damage from zombies"), as it lands on one here: null when it misses (missOf), else { dmg, head }. A
   headshot (headOf) takes all its HP, as do the grenades' blasts, the double barrel and the chain gun; Angelic adds its
   1. The Laser Rifle never misses or crits (laser, below) */
export const ALL_HP = 999;
export function zombieTakes(s, by, w) {
  const A = ARMS[w];
  if (!A) return { dmg: 1, head: false };
  const beam = w === "laser";
  if (!beam && Math.random() < missOf(w)) return null;
  const head = !beam && Math.random() < headOf(s, by, w),
    all = head || A.dmg === "all" || w === "grenade" || w === "glauncher";
  return {
    dmg: all ? ALL_HP : dmgOf(A) + (!beam && angelOf(s, by, w) ? ANGEL.DMG : 0),
    head,
  };
}
/* a zombie takes damage from a duck, and the duck gets its points: 5 for each HP it took, or 25 for a headshot (which
   takes all of it); true when it died */
function strike(s, z, dmg, head, by, w = "") {
  if (z.st === 3) return false;
  if (w) wound(s, z, w, head);
  if (w && w !== "laser" && angelOf(s, by, w)) dmg += ANGEL.DMG; // (Angelic: +1, l4ddangel.js; the Laser Rifle has its own, laser)
  const on = s.hang.l4on || {},
    all = head || !!on.kill, // (Instant Kill: every hit takes all its HP, 5 points for each)
    took = all ? z.hp : Math.min(z.hp, dmg);
  z.hp = all ? 0 : Math.max(0, z.hp - dmg);
  addPts(s, by, (head ? PTS.HEAD : PTS.HIT * took) * (on.double ? 2 : 1));
  if (z.hp <= 0) {
    /* the zombies each duck killed this game (the overall stats' Zombies killed: l4dd.js record); Justin's kills are
       the duck's that bought him his gun (his points go in the pot: potSplit) */
    const id = isWild(s, by) ? s.players[by].by : by;
    if (id && s.players[id])
      s.hang.l4kz = {
        ...(s.hang.l4kz || {}),
        [id]: ((s.hang.l4kz || {})[id] || 0) + 1,
      };
  }
  return z.hp <= 0;
}
/* the wounds a hit leaves (owner 2026-11-04 04:01Z), drawn by l4ddart.js' hitsOf: zw { i: "B3c1…" }, two letters for
   each, its kind and its spot (0 … 7, or 0 … 5 for an arrow or a chunk). Small guns leave small bullet holes, the big
   ones big holes, the shotgun its pellets, now and then a bleeding cut instead; knives cut; the hammer and the chair
   bruise; an arrow cuts or stays stuck in it; a bullet now and then tears a chunk out, or the beak off; a headshot
   blows the head off. At most 6 on a zombie, and a headless one keeps its head off */
function wound(s, z, w, head) {
  const zw = s.hang.zw || {},
    had = zw[z.i] || "";
  const add = head ? (had.includes("x") ? "" : "x0") : woundCode(had, w); // (wounds.js)
  if (add) s.hang.zw = { ...zw, [z.i]: had + add };
}
/* a mark that comes once and stays, past the 6 wounds (owner 2026-11-04 06:44Z): g a grenade's gore, f burnt by fire */
function mark(s, z, code) {
  const zw = s.hang.zw || {},
    had = zw[z.i] || "";
  if (!had.includes(code)) s.hang.zw = { ...zw, [z.i]: had + code };
}
/* a headshot, now and then (the weapon's chance and the duck's Accuracy): every screen shows it */
function headshot(s, by, w, z, now) {
  if (Math.random() >= headOf(s, by, w)) return false;
  addFx(s, {
    kind: "l4crit",
    by,
    z: z.i,
    who: [],
    t: now,
    x: Math.round(z.x),
    y: Math.round(z.y),
  });
  return true;
}
/* a miss, now and then (missOf): the hit doesn't land, and every screen shows "missed" over that zombie */
function missed(s, by, w, z, now) {
  if (Math.random() >= missOf(w)) return false;
  addFx(s, {
    kind: "l4miss",
    by,
    z: z.i,
    who: [],
    t: now,
    x: Math.round(z.x),
    y: Math.round(z.y),
  });
  return true;
}
/* the chain gun: it hits at once, along the aim to the first zombie or wall (it kills that zombie); every screen draws
   the thin yellow line (the l4line fx) */
function trace(s, id, px, py, dx, dy, hz, now) {
  const A = ARMS.chaingun,
    zs = zombies(s),
    T = now - s.hang.l4.t0,
    most = angelOf(s, id, "chaingun") ? ANGEL.CHAIN : 1, // (Angelic: through two zombies, l4ddangel.js)
    mine = myFloor(zs, px, py, hz, dx, dy, A.far),
    hits = [],
    past = []; // (the ones it missed: it goes on past them)
  let x = px,
    y = py;
  for (let d = 0; d < A.far; d += 12) {
    const nx = x + dx * 12,
      ny = y + dy * 12;
    if (walled(nx, ny, hz)) break;
    x = nx;
    y = ny;
    const hit = zs.find(
      (z) =>
        z.st !== 3 &&
        !hits.includes(z) &&
        !past.includes(z) &&
        Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
        canShoot(z, mine, px, py, hz),
    );
    if (hit) (missed(s, id, "chaingun", hit, now) ? past : hits).push(hit);
    if (hits.length >= most) break;
  }
  for (const hit of hits) {
    strike(
      s,
      hit,
      A.dmg,
      headshot(s, id, "chaingun", hit, now),
      id,
      "chaingun",
    );
    die(hit, T);
  }
  if (hits.length) store(s, zs, true);
  addFx(s, {
    kind: "l4line",
    by: id,
    who: [],
    t: now,
    x0: Math.round(px + dx * 40),
    y0: Math.round(py + dy * 40),
    x1: Math.round(x),
    y1: Math.round(y),
    hz,
  });
}
/* the Laser Rifle's beam: at once, along the aim to the first wall, through every zombie on its line, 1 to each and
   never a crit or a miss (Angelic: each has a 1 in 3 chance of taking 2); one it kills is left burnt (the charred look,
   not on fire). Then its heat goes up a beam (laserHeat); a beam with the meter already full overheats it: every
   screen hears the hiss and sees its duck burnt and shaking (the l4hot fx). Every screen draws the red beam (the l4line
   fx, w: "laser"), with where it went through each zombie (hit) for their blood */
function laser(s, id, m, px, py, dx, dy, hz, now) {
  const A = ARMS.laser,
    holy = angelOf(s, id, "laser"),
    zs = zombies(s),
    T = now - s.hang.l4.t0,
    mine = myFloor(zs, px, py, hz, dx, dy, A.far),
    hits = [];
  let x = px,
    y = py;
  for (let d = 0; d < A.far; d += 12) {
    const nx = x + dx * 12,
      ny = y + dy * 12;
    if (walled(nx, ny, hz)) break;
    x = nx;
    y = ny;
    for (const z of zs)
      if (
        z.st !== 3 &&
        !hits.includes(z) &&
        Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
        canShoot(z, mine, px, py, hz)
      )
        hits.push(z);
  }
  for (const z of hits) {
    const dmg = holy && Math.random() < ANGEL.LASER.two ? 2 : A.dmg;
    if (strike(s, z, dmg, false, id, "laser")) {
      mark(s, z, "f0");
      die(z, T);
    }
  }
  if (hits.length) store(s, zs, true);
  const next = laserNext(s, id, now);
  m.lz = next.lz;
  if (next.hot) addFx(s, { kind: "l4hot", by: id, who: [], t: now });
  addFx(s, {
    kind: "l4line",
    w: "laser",
    by: id,
    who: [],
    t: now,
    x0: Math.round(px + dx * 40),
    y0: Math.round(py + dy * 40),
    x1: Math.round(x),
    y1: Math.round(y),
    hz,
    hit: hits.map((z) => [Math.round(z.x), Math.round(z.y)]),
  });
}
/* the zebra cake: thrown the way I aim, it lands at its range or where a wall stops it (rules.js' s.zcake, so every
   screen draws it as the Zebra cake special's); every zombie goes for it and bites it until it's gone (moveZombies) */
const CAKE_R = 40, // world px: how near a zombie bites it
  CAKE_BITE = 900; // ms a zombie stands there chewing
function cakeOut(s, id, p, dx, dy, now) {
  const A = ARMS.zebra,
    [px, py] = at(p),
    hz = Math.round(+p.z || 0);
  let t = 0;
  while (t < A.far / A.speed) {
    const n = t + 0.02;
    if (walled(px + dx * A.speed * n, py + dy * A.speed * n, hz)) break;
    t = n;
  }
  /* (a secret, kept out of Updates: a cake landing in the bathroom, near the toilet, goes in the bowl, and Justin
     teleports in and eats it there for as long as it lasts; the zombies leave that one be. Off since Nov 16, with
     HELPER.on: Justin is never dropped into this mode) */
  const lx = px + dx * A.speed * t,
    ly = py + dy * A.speed * t,
    bowl =
      HELPER.on &&
      inBath(lx, ly) &&
      Math.hypot(lx - TOILET.x, ly - TOILET.y) <= TOILET.near;
  if (bowl) {
    const d = Math.hypot(TOILET.x - px, TOILET.y - py) || 1;
    dx = (TOILET.x - px) / d;
    dy = (TOILET.y - py) / d;
    t = d / A.speed;
  }
  s.zcake = {
    n: s.fxN,
    by: id,
    x0: p.x,
    y0: p.y,
    vx: +((dx * A.speed) / W).toFixed(5),
    vy: +((dy * A.speed) / H).toFixed(5),
    t: now,
    stop: now + Math.round(t * 1000),
    eat: 0,
    hin: inCabin(px, py) ? 1 : 0,
    ...(bowl ? { toilet: TOILET.z } : {}),
  };
}
/* the toilet's bowl (world px; z: how high the cake sits in it) and how near a cake must land: 4 duck lengths */
export const TOILET = { x: 3752, y: 1150, z: 26, near: 4 * RX };
const inBath = (x, y) => x > 3500 && x < 3900 && y > 1100 && y < 1450;
/* where the cake lies (world px), once it has landed and while nobody ate it */
function cakeDown(s, now) {
  const c = s.zcake;
  if (!c || c.eat || c.toilet || now < c.stop) return null; // (the one in the toilet: Justin's)
  const t = (c.stop - c.t) / 1000;
  return [(c.x0 + c.vx * t) * W, (c.y0 + c.vy * t) * H];
}
/* Jaime (the owner's: 3 a round, 1 a stab, as in Mad God Justin): he comes in beside me, sprints at the nearest zombie
   that's in, stabs it once a second, then the next. The zombies leave him be; after JAIME_LIFE (as the Jaime special's)
   he's gone in a poof, and the round's end takes him too. s.jm as the Jaime special's (game.js draws him) */
const JAIME_SPEED = 330, // world px a second (9 duck lengths, as Mad God Justin's)
  JAIME_LIFE = 12000;
function jaimeIn(s, by, p, now, bomb) {
  s.jmN = (s.jmN || 0) + 1;
  const id = `jaime${s.jmN}`,
    J = {
      n: s.jmN,
      by,
      zi: -1,
      x: p.x,
      y: p.y,
      z: Math.round(+p.z || 0),
      face: p.face || 1,
      at: now,
      stabAt: now + 600,
      mt: now,
    };
  if (bomb)
    bombIn(s, id, J, now); // (the Jaime Bomb: jaimebomb.js)
  else if (justinUp(s)) justinSays(s, "jaime"); // (Justin sees a Jaime come in: one of his lines against Jaime)
  s.jm = { ...(s.jm || {}), [id]: J };
  addFx(s, { kind: "jaime", by, who: [id], t: now });
  jaimeCount(s, { by });
}
/* the Jaime Bomb goes off where he stands (ux, uy: the way he was running): every zombie in BOMB.wide times a
   grenade's blast dies, torn apart as a grenade does it, and his body flies off the other way */
function jaimeBlows(s, id, J, o, ux, uy, zs, T, now) {
  if (J.snapAt) jaimeSnap(s); // (Justin still answers his line)
  boom(s, { by: J.by, hz: J.z || 0 }, o.x, o.y, zs, T, now, BOMB.wide);
  const [x1, y1] = flyTo(o.x / W, o.y / H, ux / RX, uy / RY, RX / W, RY / H);
  addFx(s, {
    kind: "jbomb",
    who: [id],
    t: now,
    x: +(o.x / W).toFixed(5),
    y: +(o.y / H).toFixed(5),
    x1,
    y1,
    hz: J.z || 0,
  });
}
/* the fireplace's Justin, if he's here and up, snaps back at a Jaime Bomb's line, as a player would in the chat */
function jaimeSnap(s) {
  const P = s.players[HELPER.id];
  if (!P || P.dead) return;
  logIn(s, { from: HELPER.id, to: null, text: snapLine() });
}
function jaimesRun(s, zs, now, T) {
  if (!s.jm) return;
  const next = {};
  for (const [id, J0] of Object.entries(s.jm)) {
    const J = { ...J0 },
      dt = Math.min(0.35, Math.max(0, (now - J.mt) / 1000));
    J.mt = now;
    const o = { x: J.x * W, y: J.y * H },
      live = zs.filter((z) => z.st === 2);
    const gone = () =>
      addFx(s, { kind: "poof", x: J.x, y: J.y, who: [id], t: now });
    if (!s.players[J.by] || now - J.at > JAIME_LIFE) {
      if (J.bomb) jaimeBlows(s, id, J, o, J.face, 0, zs, T, now);
      else gone();
      continue;
    } // (his time is up: gone in a poof, or the bomb goes off where he is)
    if (J.snapAt && now >= J.snapAt) {
      delete J.snapAt;
      jaimeSnap(s);
    }
    let z = live.find((q) => q.i === J.zi);
    if (!z) {
      z = live
        .map((q) => [q, Math.hypot(q.x - o.x, q.y - o.y)])
        .sort((a, b) => a[1] - b[1])[0]?.[0];
      J.zi = z ? z.i : -1;
    }
    if (z) {
      const d = room(o.x, o.y, z.x, z.y);
      if (d > 1.3) {
        const aim = d < 3 ? [z.x, z.y] : wayTo(o.x, o.y, z.x, z.y, now);
        if (aim) stepZombie(o, aim, JAIME_SPEED * dt, []);
      }
      J.face = z.x < o.x ? -1 : 1;
      if (room(o.x, o.y, z.x, z.y) <= 1.6 && now >= J.stabAt) {
        J.stabAt = now + 1000;
        const ux = z.x - o.x,
          uy = z.y - o.y,
          l = Math.hypot(ux, uy) || 1;
        if (J.bomb) {
          jaimeBlows(s, id, J, o, ux, uy, zs, T, now);
          continue;
        } // (the Jaime Bomb got to a zombie: it goes off)
        if (strike(s, z, 1, false, J.by, "knife")) die(z, T); // (his knife's wounds)
        addFx(s, {
          kind: "use",
          what: "knife",
          by: id,
          who: [id],
          face: J.face,
          t: now,
          ax: +(ux / l / W).toFixed(5),
          ay: +(uy / l / H).toFixed(5),
        });
      }
    }
    J.x = +(o.x / W).toFixed(5);
    J.y = +(o.y / H).toFixed(5);
    J.z = Math.round(heightAt(o.x, o.y));
    next[id] = J;
  }
  s.jm = Object.keys(next).length ? next : null;
}
/* fire, every heartbeat (BURN): burning zombies take 1 every 3 s, the ducks' fires go out, and anyone burning lights
   a duck it touches. s.hang.l4fire = { z: { zombie: [until, next hurt, by] }, p: { id: until } } */
function light(s, z, by, now, fl = 0) {
  mark(s, z, "f0"); // (burnt for good, even once the fire is out)
  const F = s.hang.l4fire || {};
  s.hang.l4fire = {
    ...F,
    z: {
      ...(F.z || {}),
      [z.i]: [now + BURN.Z, now + BURN.EVERY, by, ...(fl ? [1] : [])],
    },
  };
}
/* a zombie in the flamethrower's fire (or touching one it lit, or on a patch of its burning ground): lit as a fireball
   lights one (1 HP as it's lit), or, burning already, its fire goes on BURN.Z ms more from now (its next hurt stays). Its
   fire spreads (the 4th: fl). True when it died */
function catchFire(s, z, by, now, T) {
  const F = s.hang.l4fire || {},
    f = (F.z || {})[z.i];
  if (f && now < f[0]) {
    if (f[0] - now < BURN.Z - 250 || !f[3])
      s.hang.l4fire = {
        ...F,
        z: { ...F.z, [z.i]: [now + BURN.Z, f[1], f[2], 1] },
      }; // (a quarter second at a time: not a new object every puff)
    return false;
  }
  if (strike(s, z, 1, false, by)) {
    die(z, T);
    mark(s, z, "f0");
    return true;
  }
  light(s, z, by, now, 1);
  return false;
}
/* the flamethrower (flamer.js), one puff: it reaches farther the longer it's held, up to a wall; every zombie in its
   cone catches fire, and the ground at its end burns for a while. s.hang.l4fl = { id: [the hold's start, this puff,
   ax, ay, reach] } (every screen draws the stream from it: l4dd.js), s.hang.l4gf = [[x, y, until, by]] the burning
   patches */
function flame(s, id, m, px, py, dx, dy, hz, now) {
  const fl = { ...(s.hang.l4fl || {}) },
    was = fl[id],
    t0 = was && now - was[1] < FLAME.GAP ? was[0] : now,
    D = FLAME.DUCK,
    ang = angelOf(s, id, "flamer"), // (Angelic: farther, sooner, and its ground burns longer: l4ddangel.js)
    far0 =
      flameReach((now - t0) * (ang ? ANGEL.FLAME_SOON : 1)) *
      D *
      (ang ? ANGEL.FLAME_FAR : 1);
  let far = 24;
  while (far < far0 && !walled(px + dx * (far + 12), py + dy * (far + 12), hz))
    far += 12; // (a wall cuts the stream short)
  fl[id] = [t0, now, +dx.toFixed(3), +dy.toFixed(3), Math.round(far)];
  s.hang.l4fl = fl;
  const zs = zombies(s),
    T = now - s.hang.l4.t0;
  let any = false;
  for (const z of zs)
    if (
      z.st !== 3 &&
      inCone((z.x - px) / D, (z.y - py) / D, dx, dy, far / D + 0.4)
    ) {
      catchFire(s, z, id, now, T);
      any = true;
    }
  if (any) store(s, zs, true);
  const jp = s.pos[WILD.id];
  if (jp && wildOpen(s, WILD.id)) {
    const [jx, jy] = at(jp);
    if (inCone((jx - px) / D, (jy - py) / D, dx, dy, far / D + 0.4))
      wildFire(s, id, now); // (Justin with no weapon burns too)
  }
  if (now - (m.gf || 0) >= FLAME.PATCH) {
    m.gf = now;
    s.hang.l4gf = [
      ...(s.hang.l4gf || []).filter((g) => g[2] > now).slice(1 - FLAME.MOST),
      [
        Math.round(px + dx * far),
        Math.round(py + dy * far),
        now + FLAME.GROUND + (ang ? ANGEL.FLAME_GROUND : 0),
        id,
      ],
    ];
  }
}
/* every heartbeat: the flamethrower's fire spreads to the zombies that touch one it lit, and the burning ground lights
   any zombie on it; old streams and patches go */
const TOUCH_Z = 1.6; // (in a zombie's hit room, 26 by 22 world px)
function flameTick(s, zs, now, T) {
  const gf = s.hang.l4gf;
  if (gf && gf.length) {
    const left = gf.filter((g) => g[2] > now),
      r = FLAME.PATCH_R * FLAME.DUCK;
    if (left.length !== gf.length) s.hang.l4gf = left.length ? left : null;
    for (const [x, y, , by] of left)
      for (const z of zs)
        if (z.st !== 3 && Math.hypot(z.x - x, (z.y - y) * 1.3) < r)
          catchFire(s, z, by, now, T);
  }
  const fz = (s.hang.l4fire || {}).z;
  if (fz) {
    const hot = zs.filter(
      (z) => z.st !== 3 && fz[z.i] && fz[z.i][3] && fz[z.i][0] > now,
    );
    for (const a of hot)
      for (const b of zs)
        if (
          b !== a &&
          b.st !== 3 &&
          !(fz[b.i] && fz[b.i][0] > now) &&
          Math.hypot((a.x - b.x) / 26, (a.y - b.y) / 22) < TOUCH_Z
        )
          catchFire(s, b, fz[a.i][2], now, T);
  }
  const fl = s.hang.l4fl;
  if (fl && Object.values(fl).some((f) => now - f[1] > 1000)) {
    const keep = {};
    for (const [id, f] of Object.entries(fl))
      if (now - f[1] <= 1000) keep[id] = f;
    s.hang.l4fl = Object.keys(keep).length ? keep : null;
  }
}
function fireTick(s, zs, now, T, p4) {
  flameTick(s, zs, now, T);
  const F = s.hang.l4fire;
  if (!F) return;
  const fz = { ...(F.z || {}) },
    fp = { ...(F.p || {}) };
  for (const k of Object.keys(fz)) {
    const z = zs.find((q) => q.i === +k),
      f = fz[k];
    if (!z || z.st === 3 || now >= f[0]) {
      delete fz[k];
      continue;
    }
    if (now >= f[1]) {
      if (strike(s, z, 1, false, f[2])) die(z, T);
      else fz[k] = [f[0], f[1] + BURN.EVERY, ...f.slice(2)];
    }
  }
  for (const id of Object.keys(fp))
    if (now >= fp[id] + BURN.AGAIN || !standing(s, id)) delete fp[id];
  const ids = players(s).filter((id) => standing(s, id)),
    hot = [
      ...zs.filter((z) => z.st === 2 && fz[z.i]).map((z) => ["", z.x, z.y]),
      ...ids.filter((id) => fp[id] > now).map((id) => [id, ...at(s.pos[id])]),
    ];
  for (const id of ids) {
    if (fp[id] || dodging(s, s.pos[id], now)) continue; // (burning, just put out, or mid-jump)
    const [x, y] = at(s.pos[id]);
    if (!hot.some(([o, hx, hy]) => o !== id && room(hx, hy, x, y) < CLAW))
      continue;
    fp[id] = now + BURN.P;
    if (hurtDuck(s, p4, id, now)) {
      delete fp[id];
      if (isWild(s, id)) pwAdd(s, id, ["f0"], now, true); // (Justin out there, burnt to death: left burnt)
    }
  }
  const out =
    Object.keys(fz).length || Object.keys(fp).length ? { z: fz, p: fp } : null;
  if (JSON.stringify(out) !== JSON.stringify(F)) s.hang.l4fire = out;
}
/* a duck takes 1 (a claw, fire); true when that put it down. A claw leaves a wound on it now and then, as hits do in
   every other mode, and it goes away by itself 6 to 12 seconds after the duck is up (wounds.js) */
function hurtDuck(s, p4, id, now, w = "") {
  const p = p4[id];
  if (!p || p.dn || p.gh) return false;
  const safe = invuln(s) || invulnOf(s, id, now); // (Invulnerability, or just up from Safe Keeping: it only flashes)
  const hp = safe ? p.hp : p.hp - 1;
  if (w && !safe) pwHit(s, id, w, now, hp <= 0);
  if (hp > 0) {
    p4[id] = { ...p, hp, at: now };
    return false;
  }
  p4[id] = { hp: 0, at: now, dn: now + L4.BLEED };
  downGun(s, id, true);
  const u = upOf(s, id);
  if (hasSafe(s, id)) {
    /* Safe Keeping: nothing bought is lost; up at once when nobody else is standing (or a computer), else on E */
    const alone = !players(s).some((o) => {
      const q = p4[o] || P4(s, o);
      return o !== id && !!q && !q.dn && !q.gh;
    });
    p4[id] =
      s.players[id] && !s.players[id].bot && !alone
        ? { ...p4[id], sk: 1 }
        : { ...p4[id], sk: 1, skAt: now + SAFE.GLOW };
  } else if (u.hp || u.qr) {
    if (u.hp) p4[id] = { ...p4[id], uhp: u.hp }; // (kept for a medkit's revive)
    s.hang.l4u = { ...s.hang.l4u, [id]: { ...u, hp: 0, qr: 0 } }; // (down: the max HP and Quick Revive bought are gone)
  }
  if (s.players[id]) s.players[id].dead = true;
  if (isWild(s, id)) justinSays(s, "death"); // (a death line, as he says one in Duck Cabin)
  s.hang.still = { ...(s.hang.still || {}), [id]: now + L4.BLEED + 60000 };
  const b = { ...(s.hang.l4b || {}) };
  delete b[id];
  s.hang.l4b = b;
  return true;
}
/* the down pistol (the owner's, Nov 17 11:07Z): a downed duck holds a pistol of its own with endless bullets that still
   reloads (8 to a magazine, as the pistol's), kept in its kit as dg (the bullets in the magazine); it goes when the duck
   is up again or bleeds out. Never Angelic, whatever pistol the duck has besides */
function downGun(s, id, on) {
  if (on && isWild(s, id) && !s.players[id].armed) return; // (Justin out there with no gun ever bought him: no down pistol either, the owner's, Nov 17 13:30Z)
  const kit = kitOf(s, id);
  if (!kit || (!on && kit.dg === undefined)) return;
  const m = { ...kit };
  if (m.rw === "dg" || on) {
    m.rl = 0;
    m.rw = "";
  } // (a reload I was in the middle of: lost)
  if (on) m.dg = ARMS.handgun.mag;
  else delete m.dg;
  s.hang.l4a = { ...s.hang.l4a, [id]: m };
}
export const downArmed = (s, id) =>
  isDown(s, id) && !!kitOf(s, id) && kitOf(s, id).dg !== undefined;
/* a downed duck up again at once: by a medkit (full HP, and the max HP it bought back) or by its own Safe Keeping (spent;
   INV ms of nothing hurting it; it lost nothing) */
function getUp(s, id, now, full, safe) {
  const p4 = { ...(s.hang.l4p || {}) },
    p = p4[id];
  if (!p) return;
  if (p.uhp)
    s.hang.l4u = { ...s.hang.l4u, [id]: { ...upOf(s, id), hp: p.uhp } };
  p4[id] = { hp: full ? maxHp(s, id) : L4.BACK_HP, at: now };
  s.hang.l4p = p4;
  downGun(s, id, false);
  if (s.players[id]) delete s.players[id].dead;
  const still = { ...(s.hang.still || {}) };
  delete still[id];
  s.hang.still = still;
  if (safe) {
    const kit = kitOf(s, id);
    if (kit) {
      const am = { ...kit.am };
      delete am.safekeep;
      s.hang.l4a = {
        ...s.hang.l4a,
        [id]: {
          ...kit,
          am,
          sl: kit.sl.map((w) => (w === "safekeep" ? "" : w)),
        },
      };
    }
    s.hang.l4inv = { ...(s.hang.l4inv || {}), [id]: now + SAFE.INV };
    addFx(s, { kind: "l4safe", by: id, who: [id], t: now });
  }
}
/* the melee weapons mid-swing hit every zombie in their bubble, each once */
/* a shot or swing at (x, y) by duck by, on Justin out in Downpour with no weapon: he takes 1 (the owner's: players can kill
   him), unless he's jumping; true when it landed */
function wildHurt(s, by, x, y, now, w, rx = 26, ry = 22) {
  const id = WILD.id,
    p = s.pos[id],
    q = P4(s, id);
  if (by === id || !wildOpen(s, id) || !p || !q || q.dn || q.gh) return false;
  const [px, py] = at(p);
  /* Justin dodges too well: half of his jumps fail to dodge (the owner's, Nov 17 13:07Z); decided once per jump, from its
     start time, so a swing that touches him over several ticks gets one answer */
  const jumpFails = !!p.j && Math.floor((p.dj || p.j) / 7) % 2 === 0;
  if (
    Math.hypot((px - x) / rx, (py - y) / ry) >= 1 ||
    (dodging(s, p, now) && !jumpFails)
  )
    return false;
  /* a crit (wounds.js PCRIT, a weapon's chance as on any duck) takes all his HP and blows his head off */
  const crit = Math.random() < (PCRIT[w] || 0);
  wildDown(s, by, now, w, crit, crit ? ["x0"] : null);
  return true;
}
/* Justin out there takes a hit from duck by with weapon w (all: every HP he has, a crit or a blast); codes: the gore he's
   left with if it puts him down (the owner's, Nov 17 18:05Z: "all gore works on him"). wildHurt, boom, wildFire */
function wildDown(s, by, now, w, all, codes) {
  const id = WILD.id,
    p4 = { ...(s.hang.l4p || {}) };
  if (all && p4[id] && !invuln(s) && !invulnOf(s, id, now))
    p4[id] = { ...p4[id], hp: 1 };
  if (hurtDuck(s, p4, id, now, w)) {
    if (codes) pwAdd(s, id, codes, now, true);
    if (s.players[by] && !s.players[by].bot) {
      /* a player knocked Justin down: a Justin kill for that player (unlocks.js watchKills), the same numbers rules.js
         justinKilled writes; the owner's, Nov 17 13:30Z */
      s.jkN = (s.jkN || 0) + 1;
      s.jk = [...(s.jk || []).slice(-9), { n: s.jkN, by, w }];
    }
  }
  s.hang.l4p = p4;
}
/* the flamethrower's fire on Justin out there with no weapon: lit as a duck is (1 HP as it's lit, burning BURN.P ms, and
   fireTick spreads it from him), left burnt if it puts him down */
function wildFire(s, by, now) {
  const id = WILD.id,
    q = P4(s, id),
    F = s.hang.l4fire || {};
  if (by === id || !wildOpen(s, id) || !q || q.dn || q.gh) return;
  if ((F.p || {})[id] || dodging(s, s.pos[id], now)) return; // (burning, just put out, or mid-jump)
  s.hang.l4fire = { z: F.z || {}, p: { ...(F.p || {}), [id]: now + BURN.P } };
  wildDown(s, by, now, "flamer", false, ["f0"]);
}
function meleeHits(s, now) {
  const ks = (s.hang.l4k || []).filter(
    (k) => now - k.t <= (ARMS[k.w] || ARMS.knife).swing,
  );
  if (!ks.length) {
    if (s.hang.l4k && s.hang.l4k.length) s.hang.l4k = [];
    return false;
  }
  const zs = zombies(s),
    T = now - s.hang.l4.t0;
  let any = false;
  for (const k of ks) {
    const p = s.pos[k.by],
      A = ARMS[k.w] || ARMS.knife;
    if (!p || k.miss || !standing(s, k.by)) continue;
    const [px, py] = at(p),
      bx = px + k.dx * A.at,
      by = py + k.dy * A.at;
    for (const z of zs) {
      if (z.st === 3 || k.hit.includes(z.i)) continue;
      if (Math.hypot(z.x - bx, (z.y - by) * 1.4) > A.r + 22) continue;
      k.hit.push(z.i);
      if (missed(s, k.by, k.w, z, now)) continue; // (this one isn't hit by this swing; the others in it still can be)
      const dmg = Array.isArray(A.dmg)
        ? A.dmg[0] + Math.floor(Math.random() * (A.dmg[1] - A.dmg[0] + 1))
        : A.dmg; // (the fire axe: 1 to 4)
      if (strike(s, z, dmg, headshot(s, k.by, k.w, z, now), k.by, k.w))
        die(z, T);
      any = true;
    }
    if (
      !k.hit.includes("j") &&
      wildHurt(s, k.by, bx, by, now, k.w, A.r + 22, (A.r + 22) / 1.4)
    )
      k.hit.push("j"); // (Justin out in Downpour, once for each swing)
  }
  s.hang.l4k = ks;
  if (any) store(s, zs, true);
  return any;
}
const die = (z, T) => {
  z.st = 3;
  z.d = T;
};
/* the shots in the air (instead of rules.js' moveShots here): walls and furniture stop them, a zombie stops a bullet
   or an arrow (a headshot now and then kills it at once), a grenade goes off where it lands or where a wall stops it */
const OPEN_PAD = 30;
/* by an opening: a shot goes on through its boards and the wall either side of it, out to the zombies beating on them
   (the owner's, Nov 15), never further out than they stand */
const OPEN_IN = OPEN_PAD + 40, // (inside: as far in from the wall as before)
  OPEN_OUT = 130, // (outside: past the spot a zombie tears the boards from, and the ones crowding round it)
  OPEN_SIDE = 70; // (along the wall, either side of the opening)
const inOpening = (x, y) =>
  OPENINGS.some((o) => {
    if (o.kind === "fence") return false; // (Downpour's fence: shots go through it anywhere: walled)
    const [ax, ay, a, c] = o.axis === "x" ? [x, y, o.x, o.y] : [y, x, o.y, o.x],
      out = Math.sign((o.axis === "x" ? o.out[1] : o.out[0]) - c) || 1,
      across = (ay - c) * out;
    return (
      Math.abs(ax - a) < o.half + OPEN_SIDE &&
      across > -OPEN_IN &&
      across < OPEN_OUT
    );
  });
/* Downpour: no invisible walls stop a shot, only what's there, and its fence is chain-link (the owner's, Nov 17 12:28Z:
   "invisible walls do not stop bullets ... and zombies climbing the fence can be shot from below the ground no matter
   how high up they are") */
const SEE_THRU = new Set(["fence", "fencex"]);
const walled = (x, y, z) =>
  dp()
    ? !inOpening(x, y) &&
      solidsAt(x, y, z + 20).some(
        (b) => b.top > z + 20 && !SEE_THRU.has(b.kind),
      )
    : (!playable(x, y) && !inOpening(x, y)) ||
      (!inOpening(x, y) && solidsAt(x, y, z + 20).some((b) => b.top > z + 20));
/* Doom's shots (the owner's, Nov 17 17:41Z: "the natural target priority hits the duck on the same floor ... unless the
   same direction of enemy has no one which CAN be shot IN that direction ON the same floor"): a shot from my duck
   (feet at hz, at (px, py), along (dx, dy)) hits the first zombie in its line on my own floor; only when none is that
   way, before a wall, does it go up or down to one on another floor, if no roof is between (holes let it through:
   layout.js slabBetween). myFloor: is one on my floor in the line? canShoot: may this shot hit zombie z? */
const onMine = (z, hz) => Math.abs(zombieZ(z) - hz) < SAME_FLOOR;
const myFloor = (zs, px, py, hz, dx, dy, far) =>
  dp() &&
  sameFloorAhead(
    zs
      .filter((z) => z.st !== 3)
      .map((z) => ({ x: z.x, y: z.y, z: zombieZ(z) })),
    px,
    py,
    hz,
    dx,
    dy,
    far,
    [26, 22],
    12,
    (x, y) => walled(x, y, hz + MID - 20),
  ); // (heights.js: one rule for every mode)
const canShoot = (z, mine, px, py, hz) =>
  !dp() ||
  (mine ? onMine(z, hz) : !slabBetween(px, py, hz, z.x, z.y, zombieZ(z)));
/* the zombies by 64-px square (a spatial grid), so a shot only looks at the few round it instead of every zombie on the
   map: the same hits, far fewer looks. A zombie's hit room (26 by 22 px) never reaches past the squares next to its own */
const HIT_CELL = 64;
const hitKey = (x, y) =>
  Math.floor(x / HIT_CELL) + 1000 * Math.floor(y / HIT_CELL);
function hitGrid(zs) {
  const g = new Map();
  zs.forEach((z, i) => {
    if (z.st === 3) return;
    const k = hitKey(z.x, z.y);
    let c = g.get(k);
    if (!c) g.set(k, (c = []));
    c.push(i);
  });
  return g;
}
/* the zombies that could be at (x, y), in the order of the list (as a look along it would meet them) */
function nearby(g, zs, x, y) {
  const i = Math.floor(x / HIT_CELL),
    j = Math.floor(y / HIT_CELL),
    out = [];
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const c = g.get(i + di + 1000 * (j + dj));
      if (c) out.push(...c);
    }
  return out.length > 1
    ? out.sort((a, b) => a - b).map((k) => zs[k])
    : out.map((k) => zs[k]);
}
export function l4Shots(s, now) {
  const list = s.shots || [];
  if (!list.length || !s.hang || !s.hang.l4) return false;
  const L = s.hang.l4,
    T = now - L.t0,
    zs = zombies(s),
    grid = hitGrid(zs),
    keep = [],
    slugs = []; // (the double barrel's kills this beat: [x, y, crit])
  /* does shot sh fly on past zombie z? It missed it, now or before (sh.ms: the ones it missed, each rolled once); then
     it goes on to the next one, which rolls again */
  const past = (sh, w, z) => {
    if ((sh.ms || []).includes(z.i)) return true;
    if (!missed(s, sh.by, w, z, now)) return false;
    sh.ms = [...(sh.ms || []), z.i];
    return true;
  };
  let hitAny = false;
  for (const sh0 of list) {
    const sh = { ...sh0 },
      age = now - sh.t;
    if (age < 0) {
      keep.push(sh);
      continue;
    } // (a burst's round still waiting for its turn)
    if (sh.k === "grenade") {
      const u = Math.min(age, GRENADE_MS) / 1000,
        x = (sh.x0 + sh.vx * u) * W,
        y = (sh.y0 + sh.vy * u) * H,
        wall = walled(x, y, sh.hz);
      if (wall || age >= GRENADE_MS) {
        hitAny =
          boom(s, sh, wall ? sh.lx * W : x, wall ? sh.ly * H : y, zs, T, now) ||
          hitAny;
        continue;
      }
      sh.lx = x / W;
      sh.ly = y / H;
      keep.push(sh);
      continue;
    }
    if (sh.k === "lgren") {
      /* the grenade launcher's: straight, and off at the first zombie, a wall or its range */
      const u = age / 1000,
        x0 = sh.lx * W,
        y0 = sh.ly * H,
        x1 = (sh.x0 + sh.vx * u) * W,
        y1 = (sh.y0 + sh.vy * u) * H,
        n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12));
      let at = null;
      for (let k = 1; k <= n && !at; k++) {
        const x = x0 + ((x1 - x0) * k) / n,
          y = y0 + ((y1 - y0) * k) / n;
        if (walled(x, y, shotFeet(sh)))
          at = [x0 + ((x1 - x0) * (k - 1)) / n, y0 + ((y1 - y0) * (k - 1)) / n];
        else if (
          nearby(grid, zs, x, y).some(
            (z) =>
              z.st !== 3 &&
              Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
              hOk(sh, zombieZ(z), z.x, z.y, sh.x0 * W, sh.y0 * H) &&
              !past(sh, "glauncher", z),
          )
        )
          at = [x, y];
      }
      if (!at && age >= sh.life) at = [x1, y1];
      if (at) {
        const ang = angelOf(s, sh.by, "glauncher");
        hitAny =
          boom(s, sh, at[0], at[1], zs, T, now, ang ? ANGEL.GL_RADIUS : 1) ||
          hitAny;
        if (ang) burnAt(s, sh.by, at[0], at[1], now); // (Angelic: a smaller blast, and the ground there on fire)
        continue;
      }
      sh.lx = x1 / W;
      sh.ly = y1 / H;
      keep.push(sh);
      continue;
    }
    const x0 = sh.lx * W,
      y0 = sh.ly * H,
      u = age / 1000,
      x1 = (sh.x0 + sh.vx * u) * W,
      y1 = (sh.y0 + sh.vy * u) * H,
      len = Math.hypot(x1 - x0, y1 - y0),
      steps = Math.max(1, Math.ceil(len / 12));
    let gone =
        age > (sh.life || SHOT_LIFE) ||
        (sh.k === "dagger" && daggerZ(age / 1000) <= 0), // (a pellet goes only so far; a dagger falls to the floor)
      endX = x1,
      endY = y1;
    for (let k = 1; k <= steps && !gone; k++) {
      const x = x0 + ((x1 - x0) * k) / steps,
        y = y0 + ((y1 - y0) * k) / steps;
      if (walled(x, y, shotFeet(sh))) {
        gone = true;
        endX = x;
        endY = y;
        break;
      } // (a wall taller than the shot: heights.js)
      const w = ARMS[sh.w]
          ? sh.w
          : sh.k === "arrow"
            ? "bow"
            : sh.k === "pellet"
              ? "shotgun"
              : "handgun",
        A = ARMS[w],
        near = (z) =>
          z.st !== 3 &&
          Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
          hOk(sh, zombieZ(z), z.x, z.y, sh.x0 * W, sh.y0 * H) &&
          !hLock(sh, zombieZ(z)); // (at its height, the first one setting it: heights.js)
      if (w !== "fireball" && wildHurt(s, sh.by, x, y, now, w)) {
        gone = true; // (Justin out in Downpour with no weapon: it hit him)
        endX = x;
        endY = y;
        break;
      }
      if (w === "dbarrel") {
        /* the double barrel's slug: all the HP of the zombie it hits, its body thrown back; a crit's goes on through
           every zombie in its way (each once), killing each, until the wall */
        let stop = false;
        for (const z of nearby(grid, zs, x, y))
          if (near(z) && !(sh.hit || []).includes(z.i) && !past(sh, w, z)) {
            const head = sh.crit || headshot(s, sh.by, w, z, now);
            sh.hit = [...(sh.hit || []), z.i];
            strike(s, z, z.hp, head, sh.by, w);
            die(z, T);
            mark(s, z, "g0"); // (chunks blown through it: l4ddart.js)
            slugs.push([Math.round(z.x), Math.round(z.y), head ? 1 : 0]);
            fling(z, sh, sh.hz);
            hitAny = true;
            if (head) sh.crit = 1;
            else {
              stop = true;
              break;
            }
          }
        if (stop) gone = true;
        continue;
      }
      const pierce = pierceOf(s, sh.by, w);
      if (pierce) {
        /* the sniper's: through the zombies it meets, each once, until the third (the owner's, Nov 3), or the wall */
        for (const z of nearby(grid, zs, x, y))
          if (near(z) && !(sh.hit || []).includes(z.i) && !past(sh, w, z)) {
            sh.hit = [...(sh.hit || []), z.i];
            if (strike(s, z, dmgOf(A), headshot(s, sh.by, w, z, now), sh.by, w))
              die(z, T);
            hitAny = true;
            if (sh.hit.length >= pierce) break;
          }
        if ((sh.hit || []).length >= pierce) gone = true;
        continue;
      }
      const z = nearby(grid, zs, x, y).find((z) => near(z) && !past(sh, w, z));
      if (z) {
        if (w === "fireball") {
          if (strike(s, z, 1, false, sh.by)) die(z, T);
          else light(s, z, sh.by, now); // (the first of its burn as it's lit)
        } else if (w === "handgun" && angelOf(s, sh.by, w)) {
          /* the Angelic pistol: every bullet kills at once, and a crit sets off a grenade's blast there (its shooter
             isn't hurt by it: no sh.k) */
          const head = headshot(s, sh.by, w, z, now);
          strike(s, z, z.hp, head, sh.by, w);
          die(z, T);
          if (head)
            boom(
              s,
              { by: sh.by, hz: sh.hz },
              z.x,
              z.y,
              zs,
              T,
              now,
              ANGEL.PISTOL.BOOM,
            ); // (half a grenade's blast, its boom weaker: the owner's, Nov 17 11:07Z)
        } else if (
          strike(s, z, dmgOf(A), headshot(s, sh.by, w, z, now), sh.by, w)
        )
          die(z, T);
        hitAny = true;
        gone = true;
      }
    }
    if (slugs.length) {
      addFx(s, {
        kind: "slug",
        by: sh.by,
        who: [],
        t: now,
        ax: sh.vx,
        ay: sh.vy,
        gore: slugs.splice(0),
      }); // (every screen: the chunks and the blood blown out of each, more from a crit's head: l4dd.js)
    }
    if (gone) continue;
    sh.lx = endX / W;
    sh.ly = endY / H;
    keep.push(sh);
  }
  s.shots = keep;
  if (hitAny) store(s, zs, true);
  return true;
}
/* a zombie the double barrel killed is thrown back the way the slug flew, FLING world px (less if a wall is nearer) */
const FLING = 170;
function fling(z, sh, hz) {
  const l = Math.hypot(sh.vx * W, sh.vy * H) || 1,
    ux = (sh.vx * W) / l,
    uy = (sh.vy * H) / l;
  for (let d = 0; d < FLING; d += 10) {
    const nx = z.x + ux * 10,
      ny = z.y + uy * 10;
    if (walled(nx, ny, hz || 0) || !playable(nx, ny)) break; // (never thrown out past the fence)
    z.x = nx;
    z.y = ny;
  }
}

/* the Angelic grenade launcher's fire: a few burning patches round where it went off, as the flamethrower's ground */
function burnAt(s, by, x, y, now) {
  const r = ARMS.grenade.r * ANGEL.GL_RADIUS,
    out = [];
  for (let k = 0; k < ANGEL.GL_FIRE; k++) {
    const a = (k / ANGEL.GL_FIRE) * Math.PI * 2,
      d = k ? r * 0.6 : 0;
    const px = x + Math.cos(a) * d,
      py = y + Math.sin(a) * d * 0.8;
    if (playable(px, py))
      out.push([Math.round(px), Math.round(py), now + FLAME.GROUND, by]);
  }
  s.hang.l4gf = [
    ...(s.hang.l4gf || [])
      .filter((g) => g[2] > now)
      .slice(out.length - FLAME.MOST),
    ...out,
  ];
}
/* a grenade (thrown or launched) goes off at (bx, by): every zombie in its blast dies, and the duck that threw it, in
   it, loses half its HP; true when it got any zombie */
function boom(s, sh, bx, by, zs, T, now, wide = 1) {
  let any = false;
  const gore = [];
  for (const z of zs)
    if (
      z.st !== 3 &&
      Math.hypot(z.x - bx, (z.y - by) * 1.25) < ARMS.grenade.r * wide
    ) {
      strike(s, z, z.hp, false, sh.by); // (all its HP: 5 points for each)
      die(z, T);
      mark(s, z, "g0"); // (every chunk, cuts and big holes: l4ddart.js)
      gore.push([Math.round(z.x), Math.round(z.y)]);
      any = true;
    }
  /* Justin out there with no weapon, in its blast: all his HP, torn apart, headless and burnt (wounds.js DEATH), as the
     Jaime Bomb leaves Jaime; a jump dodges it as it dodges a shot */
  const jp = s.pos[WILD.id],
    jq = P4(s, WILD.id);
  if (jp && jq && !jq.dn && !jq.gh && wildOpen(s, WILD.id)) {
    const [jx, jy] = at(jp);
    if (
      Math.hypot(jx - bx, (jy - by) * 1.25) < ARMS.grenade.r * wide &&
      !dodging(s, jp, now)
    )
      wildDown(s, sh.by, now, "grenade", true, DEATH);
  }
  /* the one who threw or launched it, in its blast: half its HP, rounded down, and never down by it (the owner's, Nov
     16; the Jaime Bomb's has no sh.k: Jaime's, not mine) */
  const mine = sh.k && s.pos[sh.by],
    q = mine && (s.hang.l4p || {})[sh.by];
  if (q && !q.dn && !q.gh && !invuln(s) && !invulnOf(s, sh.by, now)) {
    const [mx, my] = at(mine),
      cut = Math.floor(q.hp / 2);
    if (
      cut > 0 &&
      Math.hypot(mx - bx, (my - by) * 1.25) < ARMS.grenade.r * wide
    )
      s.hang.l4p = {
        ...s.hang.l4p,
        [sh.by]: { ...q, hp: q.hp - cut, at: now },
      };
  }
  addFx(s, {
    kind: "boom",
    by: sh.by,
    who: [],
    t: now,
    x: +(bx / W).toFixed(4),
    y: +(by / H).toFixed(4),
    hit: [],
    hz: sh.hz || 0,
    gore: gore.slice(0, 12), // (blood bursting out of each zombie it got: game.js)
    ...(wide !== 1 ? { wide } : {}),
  });
  return any;
}

/* ---------- the host's heartbeat ---------- */
function l4Tick(s, now) {
  const L = s.hang.l4;
  if (!L) return false;
  if (L.over) {
    if (!s.jm) return false;
    s.jm = null;
    return true;
  }
  meleeHits(s, now); // (first: the zombies below are read after it)
  const T = now - L.t0,
    zs = zombies(s);
  /* the ducks: HP coming back, revives, bleeding out, boards going up, reloads */
  const p4 = { ...(s.hang.l4p || {}) },
    ids = players(s);
  for (const id of ids) {
    let p = p4[id];
    if (!p) continue;
    if (p.dn) {
      if (
        p.sk &&
        !p.skAt &&
        !ids.some((o) => o !== id && p4[o] && !p4[o].dn && !p4[o].gh)
      )
        p = { ...p, skAt: now + SAFE.GLOW }; // (Safe Keeping, and nobody else standing now: up by itself)
      const rv = p.rv,
        by = rv && s.pos[rv.by];
      if (
        rv &&
        (!by ||
          !standing(s, rv.by) ||
          Math.hypot(...minus(at(by), at(s.pos[id]))) > L4.REACH * 1.8)
      )
        p = { ...p, rv: null, dn: p.dn + (now - rv.at) }; // (the bleeding-out waited while they were at it)
      else if (p.skAt && now >= p.skAt) {
        s.hang.l4p = p4;
        getUp(s, id, now, false, true);
        p = s.hang.l4p[id];
      } else if (rv && now - rv.at >= reviveMs(s, rv.by)) {
        p = { hp: L4.BACK_HP, at: now };
        downGun(s, id, false);
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
      } else if (!rv && !p.skAt && now >= p.dn && isWild(s, id)) {
        p = { hp: 0, at: now, dn: now + 1e13, ex: 1 }; // (Justin in Downpour bled out: dead for good, his body stays)
        s.hang.still = { ...(s.hang.still || {}), [id]: now + 1e13 };
      } else if (!rv && !p.skAt && now >= p.dn) {
        p = { hp: 0, at: now, gh: 1 }; // (bled out: a ghost until the next round)
        downGun(s, id, false);
        const q = s.pos[id];
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
        s.hang.ghost = {
          ...(s.hang.ghost || {}),
          [id]: { x: q.x, y: q.y, z: Math.round(+q.z || 0), t: now, l4: 1 },
        };
        const b = { ...(s.hang.l4b || {}) };
        delete b[id];
        s.hang.l4b = b;
      }
      p4[id] = p;
      continue;
    }
    if (p.gh) continue;
    if (
      p.hp < maxHp(s, id) &&
      now - p.at >= (isWild(s, id) ? WILD.regen : L4.REGEN)
    )
      p4[id] = { ...p, hp: p.hp + 1, at: now };
  }
  s.hang.l4p = p4;
  const am = s.hang.l4a || {};
  for (const id of Object.keys(am))
    if (am[id].rl && now >= am[id].rl) {
      const m = { ...am[id] };
      finishReload(m, now);
      s.hang.l4a = { ...s.hang.l4a, [id]: m };
    } else if (
      am[id].rl &&
      am[id].rw !== "dg" &&
      s.pos[id] &&
      s.pos[id].w !== am[id].rw
    )
      s.hang.l4a = { ...s.hang.l4a, [id]: { ...am[id], rl: 0, rw: "" } }; // (switched to another slot: the reload is lost, the owner's, Nov 16)
  /* Justin, armed, now and then shouts at the zombies as he fires */
  if (
    isWild(s, WILD.id) &&
    s.players[WILD.id].armed &&
    s.hang.l4 &&
    !s.hang.l4.wait
  ) {
    const jk = kitOf(s, WILD.id),
      last = Math.max(0, ...Object.values((jk && jk.u) || {}));
    if (
      now - last < 300 &&
      now - (s.hang.l4jf || 0) > 7000 &&
      Math.random() < 0.3
    ) {
      s.hang.l4jf = now; // (its own key: l4jt is the jetpacks' clock, jetBurn)
      justinSays(s, "fight");
    }
  }
  /* Justin's gun never runs out: what he has left to load stays full */
  if (isWild(s, WILD.id) && s.players[WILD.id].armed) {
    const jk = kitOf(s, WILD.id),
      jw = jk && jk.sl[1];
    if (jw && jk.am[jw] && jk.am[jw][1] < 50)
      s.hang.l4a = {
        ...s.hang.l4a,
        [WILD.id]: { ...jk, am: { ...jk.am, [jw]: [jk.am[jw][0], 99] } },
      };
  }
  justinChat(s, now);
  jetBurn(s, now, ids);
  for (const b of Object.values(boxesOf(s)))
    if (b.w === HELPER.w && now >= b.t + BOX.spin + HELPER.out) {
      dropBox(s, b.by);
      helperIn(s, b.by, now);
    } else if (now >= b.t + BOX.spin + BOX.keep) dropBox(s, b.by); // (nobody took it: the fire keeps it)
  const brd = { ...(s.hang.brd || {}) },
    bl = { ...(s.hang.l4b || {}) };
  for (const [id, b] of Object.entries(bl)) {
    const o = openingById(b.o),
      p = s.pos[id];
    if (
      !o ||
      !p ||
      !standing(s, id) ||
      Math.hypot(o.in[0] - p.x * W, o.in[1] - p.y * H) > L4.REACH * 1.8 ||
      brd[o.id] >= L4.BOARDS
    ) {
      delete bl[id];
      continue;
    }
    if (now - b.at >= L4.BOARD_MS) {
      brd[o.id] = Math.min(L4.BOARDS, (brd[o.id] || 0) + 1);
      bl[id] = { ...b, at: now };
      const bp = s.hang.l4.bp || {},
        k = `${id} ${o.id}`;
      if ((bp[k] || 0) < PTS.BOARDS) {
        addPts(s, id, PTS.BOARD);
        s.hang.l4 = {
          ...s.hang.l4,
          bp: { ...bp, [k]: (bp[k] || 0) + PTS.BOARD },
        };
      } // (5 a board, 50 a round at most for each opening: one cap for them all left the east wall paying nothing after the others)
    }
  }
  s.hang.brd = brd;
  s.hang.l4b = bl;
  /* nobody standing: the game is over (a duck Safe Keeping is getting up counts as standing) */
  const mine = ids.filter((id) => !isWild(s, id)), // (Justin out there doesn't keep the game going, nor end it)
    up = mine.filter((id) => standing(s, id) || !!(P4(s, id) || {}).skAt);
  if (!up.length && mine.length) {
    s.hang.l4 = { ...s.hang.l4, over: { at: now, r: L.r } };
    s.hang.l4b = {};
    return true;
  }
  /* between rounds: no zombies; the drops still lie there to be taken */
  if (s.hang.l4.wait) {
    if (waitTick(s, now)) return true;
    const Lw = { ...s.hang.l4 };
    dropTick(s, Lw, zs, now, T, ids);
    s.hang.l4 = Lw;
    powerTick(s, zs, now, ids, PH);
    return true;
  }
  /* more zombies come */
  const R = roundOf(L.r),
    live = zs.filter((z) => z.st !== 3).length,
    extra = Math.max(0, ids.length - 1),
    L2 = { ...s.hang.l4 };
  if (T >= 0 && L2.made + L2.owe < L2.n) {
    const sec = Math.floor(T / 1000);
    if (sec > L2.sec) {
      L2.sec = sec;
      if (Math.random() >= SKIP) {
        const fast = dp() ? 4 : T >= LATER ? 2 : 1; // (after a round's first 10 s: twice as fast again. Downpour: twice that, from the start, the map's so big: the owner's, Nov 16 23:23Z)
        L2.acc += 2 * fast * Math.pow(1.5, extra); // (twice as fast: the owner's, Nov 16 21:21Z)
        const k = Math.min(
          Math.floor(L2.acc),
          (10 + 6 * extra) * fast,
          L2.n - L2.made - L2.owe,
        );
        L2.acc -= Math.floor(L2.acc);
        L2.owe += Math.max(0, k);
      }
    }
  }
  if (L2.owe > 0) {
    const room = Math.max(0, R[4] - live),
      k = Math.min(L2.owe, room);
    for (let q = 0; q < k; q++) zs.push(newZombie(s, L2, T, zs));
    L2.owe -= k;
    L2.made += k;
  }
  /* the zombies walk, tear boards down, climb in, swipe */
  moveZombies(s, zs, now, T, up);
  jaimesRun(s, zs, now, T);
  nukeTick(s, zs, now, ids);
  boltTick(s, zs, now, ids);
  dropTick(s, L2, zs, now, T, ids);
  powerTick(s, zs, now, ids, PH);
  const ad = s.hang.l4ad;
  if (ad && Object.values(ad).some((u) => u <= now))
    s.hang.l4ad = Object.fromEntries(
      Object.entries(ad).filter(([, u]) => u > now),
    ); // (the adrenaline shots that wore off)
  /* the dead go */
  const left = zs.filter(
      (z) => !(z.st === 3 && T - z.d > (nuked(s, z) ? NUKE.DEAD : L4.DEAD_MS)),
    ),
    bodies = left.filter((z) => z.st === 3 && nuked(s, z)); // (the Nuke's: they don't hold up the next round)
  if (s.hang.l4nk && s.hang.l4nk.ids && !bodies.length) s.hang.l4nk = null; // (the last of them gone)
  /* every zombie of the round came and died: the next round, and the ghosts come back */
  if (L2.made >= L2.n && left.length === bodies.length && T >= 0) {
    s.hang.l4 = { ...L2, wait: { r: L2.r + 1, v: {} } }; // (the next round waits for End turn)
    potSplit(s);
    store(s, bodies, false);
    ids.forEach((id, k) => {
      if (isGhost4(s, id)) bringBack(s, id, now, k, false);
    });
    return true;
  }
  s.hang.l4 = L2;
  store(s, left, false);
  return true; // (the zombies move every heartbeat)
}
const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];
/* a new zombie, at one of the openings (the ones nearer the ducks twice as likely) */
function newZombie(s, L, T, zs = []) {
  syncMap();
  const R = roundOf(L.r),
    ids = players(s).filter((id) => standing(s, id)),
    pts = ids.map((id) => at(s.pos[id])),
    near = (o) =>
      Math.min(
        ...pts.map(([x, y]) => Math.hypot(x - o.in[0], y - o.in[1])),
        1e9,
      ),
    order = [...OPENINGS]
      .filter((o) => !dp() || o.kind === "fence") // (Downpour: they come over the fences)
      .sort((a, b) => near(a) - near(b)),
    pool = [...order, ...order.slice(0, dp() ? 1 : 4)];
  let o = pool[Math.floor(Math.random() * pool.length)];
  /* Downpour: only from outside the fence, behind it anywhere round the map or out on the road's ends, and never where
     anyone sees it come (the owner's, Nov 17 12:28Z: "zombies can only spawn behind fences or at the ends of the road if
     they arent spawning on a player's screen where they can be seen"); then it climbs over. Of the spots nobody sees,
     one of the nearest to the ducks (so they don't walk round the map for a minute); if all are seen, the furthest */
  let from = o.from;
  if (dp()) {
    const dist = flowFrom(pts.map((q) => openNear(...q))),
      fences = OPENINGS.filter((q) => q.kind === "fence"),
      long = fences.map((q) => q.fence.climb[1] - q.fence.climb[0]),
      all = long.reduce((a, b) => a + b, 0),
      seen = (x, y) =>
        pts.some(
          ([a, b]) =>
            Math.abs(x - a) < VIEW.x + 60 && Math.abs(y - b) < VIEW.y + 60,
        ),
      far = (x, y) =>
        Math.min(...pts.map(([a, b]) => Math.hypot(x - a, y - b)), 1e9),
      hidden = [],
      shown = [];
    for (let t = 0; t < 40; t++) {
      let r = Math.random() * all,
        k = 0;
      while (k < fences.length - 1 && r > long[k]) r -= long[k++];
      const q = fences[k],
        f = q.fence,
        v = f.climb[0] + r,
        [ix, iy] = byFence(f, FENCE.out - FENCE.across, v),
        c = openNear(ix, iy);
      if (c < 0 || !(dist[c] < Infinity) || !zOk(ix, iy, heightAt(ix, iy)))
        continue; // (it would land in a trunk, or where nobody can be reached)
      const at = byFence(f, FENCE.from, v);
      (seen(...at) ? shown : hidden).push({ q, at, d: far(...at) });
    }
    hidden.sort((a, b) => a.d - b.d);
    shown.sort((a, b) => b.d - a.d);
    const pick = hidden.length
      ? hidden[Math.floor(Math.random() * Math.min(4, hidden.length))]
      : shown[0];
    if (pick) {
      o = pick.q;
      from = pick.at;
    } else from = byFence(o.fence, FENCE.from, rnd(...o.fence.climb)); // (nowhere to land that leads to anyone: anywhere along it)
  }
  const i = L.next++;
  const dress = Math.random() < 0.2 ? Math.random() : -1, // (20% wear something: a hat, an outfit or both)
    hat = dress >= 0 && dress < 0.6 ? rint(0, ZHATS.length - 1) : -1,
    outfit = dress >= 0.4 ? rint(0, ZOUTFITS.length - 1) : -1,
    odd = Math.random() < 0.25, // (25% are another size or build; every one has the same room on the floor)
    size = odd && Math.random() < 0.5 ? +rnd(-1, 1).toFixed(2) : 0,
    build = odd && !size ? +rnd(-1, 1).toFixed(2) : 0,
    mud = dp() && Math.random() < MUD.P ? 1 : 0,
    max = Math.max(1, hp0() - mud),
    jus = Math.random() < Z_JUSTIN ? 1 : 0,
    v = Math.round(WALK * Z_SLOW * rnd(R[1][0], R[1][1])),
    [sx, sy] = from || o.out;
  return {
    ...(Math.random() < FLANK.p ? { fl: Math.random() < 0.5 ? 1 : -1 } : {}), // (a flanker: flank)
    i,
    x: sx + (dp() ? 0 : rnd(-12, 12) * (o.axis === "x" ? 1 : 0.3)),
    y: sy + (dp() ? 0 : rnd(-8, 8) * (o.axis === "y" ? 1 : 0.3)),
    hp: max,
    st: 0,
    a: -1e6,
    n: 0,
    d: 0,
    dir: 0,
    l: jus
      ? [max, v, o.id, 0, 0, -1, -1, 1]
      : mud
        ? [max, v, o.id, size, build, hat, outfit, 0, 1]
        : [max, v, o.id, size, build, hat, outfit],
  };
}
function moveZombies(s, zs, now, T, up) {
  const R = roundOf(s.hang.l4.r),
    tk = (s.hidden && s.hidden.l4tk) || now - 200,
    dt = Math.min(0.35, Math.max(0.05, (now - tk) / 1000)),
    brd = { ...(s.hang.brd || {}) },
    pls = up.map((id) => {
      const p = s.pos[id],
        xy = at(p),
        zz = +p.z || 0,
        dk = dp() ? deckAt(xy[0], xy[1], zz) : null, // (Downpour: up on a roof, or the canopy)
        way = dk && dk.kind === "canopy" ? stationDeck() : dk; // (the canopy: by way of the gas station's roof, then a jump)
      return {
        id,
        p,
        xy,
        zz,
        dk,
        way,
        goal: (way && climbSpot(way, xy)) || xy,
      };
    });
  s.hidden = { ...(s.hidden || {}), l4tk: now };
  const dist = flowFrom(pls.map((q) => openNear(...q.goal))); // (to a duck up on a roof: to the foot of its wall)
  const p4 = { ...s.hang.l4p },
    eating = { ...((s.hidden && s.hidden.l4ze) || {}) };
  let cake = cakeDown(s, now);
  for (const k of Object.keys(eating))
    if (k !== "fx" && eating[k] <= now) delete eating[k];
  for (const z of zs) {
    if (z.st === 3) continue;
    const o = openingById(z.l[2]),
      v =
        z.l[1] *
        walkOf(s) * // (as much faster or slower as the ducks, by the lobby's Walking speed)
        (dp() && GS.inDeep(z.x, z.y) ? SWIM : 1), // (Downpour: swimming the deep flood, as slow of its own walk as a duck is of its)
      sp = o && sidesOf(o, z);
    if (z.st === 0) {
      // coming: to the spot outside its opening (Downpour: the foot of the fence)
      const [tx, ty] = sp.out;
      if (walkTo(z, tx, ty, v * dt)) {
        z.st = o.fence ? 5 : brd[o.id] > 0 ? 1 : 4;
        z.d = T;
      }
      continue;
    }
    if (z.st === 5) {
      /* over the fence: up it like a ladder at its walking speed (FENCE.mid across while it climbs FENCE_H), then a
         drop from the top down the inside (fenceZ) */
      const f = o.fence,
        top = FENCE.out - FENCE.mid,
        up = acrossFence(f, z.x, z.y) > top + 1,
        [tx, ty] = up ? byFence(f, top, f.axis === "y" ? z.y : z.x) : sp.in;
      if (
        walkTo(
          z,
          tx,
          ty,
          up
            ? (FENCE.mid * v * dt) / GS.FENCE_H
            : ((FENCE.across - FENCE.mid) * dt) / FENCE.FALL,
        ) &&
        !up
      ) {
        z.st = 2;
        z.n = 0;
      }
      continue;
    }
    if (z.st === 1) {
      // tearing the boards down, one at a time (Downpour: from whichever side it came to them)
      if (dp() && walkTo(z, sp.out[0], sp.out[1], v * dt) === false) continue;
      /* Downpour: it keeps at the window it chose on its way, but for a duck very close to it outside the church: it
         goes for that one (the owner's, Nov 17 18:05Z: "they commit to breaking a window if the player isnt very close
         to them outside the church") */
      if (
        dp() &&
        pls.some(
          (q) =>
            !q.dk &&
            whereIn(q.xy[0], q.xy[1], q.zz) !== CHURCH &&
            room(z.x, z.y, ...q.xy) < TEAR_NEAR,
        )
      ) {
        z.st = 2;
        z.n = 0;
        continue;
      }
      if (!(brd[o.id] > 0)) {
        z.st = 4;
        continue;
      }
      if (T - z.d >= L4.TEAR_MS) {
        brd[o.id] = Math.max(0, brd[o.id] - 1);
        z.d = T;
      }
      continue;
    }
    if (z.st === 4) {
      // climbing in through the opening (the boards are down)
      if (brd[o.id] > 0) {
        if (Math.hypot(z.x - sp.out[0], z.y - sp.out[1]) < 30) {
          z.st = 1;
          z.d = T;
        }
      }
      if (walkTo(z, sp.in[0], sp.in[1], v * dt)) {
        z.st = 2;
        z.n = 0;
      }
      continue;
    }
    if (z.st === 6) {
      // up a wall onto a roof (its own: z.k), straight in from its edge, slowly (its height: climbZ)
      const e = edgeOf(z.x, z.y, deckOf(z)),
        far = v * dt * CL.speed;
      z.x -= e.nx * far;
      z.y -= e.ny * far;
      if (e.o - far <= -CL.in) {
        z.st = 7;
        z.n = 0;
        delete z.cm; // (up: the way it kept to is done)
      }
      continue;
    }
    if (z.st === 8) {
      // jumping from the gas station's roof onto the canopy (or, 1 time in 20, short of it, down to the ground)
      const [, , x1, y1, , h1] = z.j;
      if (walkTo(z, x1, y1, JUMP.speed * dt)) {
        const fell = h1 < canopyDeck().h - 1;
        z.st = fell ? 2 : 7;
        z.n = 0;
        if (fell) delete z.k;
        else z.k = GS.DECKS.indexOf(canopyDeck());
        delete z.j;
      }
      continue;
    }
    let target = null,
      best = Infinity;
    if (z.st === 7) {
      /* on a roof: straight at the nearest duck up there; a hole underfoot and it falls in; nobody left up there (or
         the cake down), it walks off the nearest edge and drops */
      const e = edgeOf(z.x, z.y, deckOf(z));
      if (!deckAt(z.x, z.y, e.d.h)) {
        z.st = 2;
        z.n = 0;
        delete z.k;
        continue;
      }
      for (const q of pls)
        if (q.dk === e.d && room(z.x, z.y, ...q.xy) < best) {
          best = room(z.x, z.y, ...q.xy);
          target = q;
        }
      if (!target && !cake && e.d === stationDeck() && jumpOn(z, pls, v * dt))
        continue; // (nobody up here, a duck on the canopy: to the roof's edge over it, then the jump)
      if (!target || cake) {
        walkTo(z, z.x + e.nx * 200, z.y + e.ny * 200, v * dt);
        if (edgeOf(z.x, z.y, e.d).o >= CL.out) {
          delete z.k;
          z.st = 2;
          z.n = 0;
        }
        continue;
      }
      if (best > 1) {
        const k = 1 - 1 / best; // (up to it, not into it)
        walkTo(
          z,
          z.x + (target.xy[0] - z.x) * k,
          z.y + (target.xy[1] - z.y) * k,
          v * dt,
        );
        const o2 = edgeOf(z.x, z.y, e.d);
        if (o2.o > -6) {
          z.x += o2.nx * (o2.o + 6) * -1;
          z.y += o2.ny * (o2.o + 6) * -1;
        } // (never off its edge while it goes for a duck)
      }
    }
    /* every zombie in goes for the zebra cake while it lies there (the owner's, Nov 3: it draws them all away from the
       ducks), and each one there bites it again and again, chewing between bites, until the cake is gone by itself */
    if ((eating[z.i] || 0) > now) continue;
    if (cake && z.st !== 7) {
      if (Math.hypot(z.x - cake[0], z.y - cake[1]) < CAKE_R) {
        eating[z.i] = now + CAKE_BITE;
        if (now - (eating.fx || 0) >= 450) {
          eating.fx = now;
          addFx(s, { kind: "l4bite", who: [], t: now, x: z.x, y: z.y });
        } // (a chomp now and then, not one for every zombie at it)
        continue;
      }
      const aim =
        Math.hypot(z.x - cake[0], z.y - cake[1]) < 120
          ? cake
          : wayTo(z.x, z.y, cake[0], cake[1], now);
      if (aim) stepZombie(z, aim, v * dt, pls);
      z.n = 0;
      continue;
    }
    if (z.st !== 7) {
      /* in: along the flow field, or straight at a duck close by; never into a duck. A duck up on a roof: to the foot
         of its wall nearest it, then up the wall */
      /* a way up kept to (z.cm: [the duck, the foot of the wall, the deck]): the owner's, Nov 17 18:05Z, "it keeps to it
         until it has climbed the wall and then targets the player as usual OR it resorts to what you described IF they
         leave the floor into a location NEAR ENOUGH to them during the commit" */
      let goal = null;
      const cm = z.cm && pls.find((q) => q.id === z.cm[0]);
      if (
        cm &&
        !(
          cm.way !== GS.DECKS[z.cm[3]] && room(z.x, z.y, ...cm.xy) < COMMIT_NEAR
        )
      ) {
        target = cm;
        goal = [z.cm[1], z.cm[2]];
        best = room(z.x, z.y, ...goal);
      } else {
        delete z.cm;
        for (const q of pls) {
          const d = room(z.x, z.y, ...q.goal);
          if (d < best) {
            best = d;
            target = q;
          }
        }
        if (!target) continue;
        goal = target.goal;
        if (target.way)
          z.cm = [target.id, goal[0], goal[1], GS.DECKS.indexOf(target.way)]; // (its way up, from now on)
      }
      if (z.cm && best < 0.9) {
        z.st = 6;
        z.k = z.cm[3];
        z.n = 0;
        continue;
      }
      const c = openNear(z.x, z.y),
        close =
          (best < 2.6 || (c >= 0 && dist[c] <= 1.5)) &&
          walkable(z.x, z.y, ...goal); // (straight at it only with nothing in between: a trunk, a car or a pew in the way and it goes round by the field)
      let aim = close
        ? goal
        : z.cm
          ? wayTo(z.x, z.y, goal[0], goal[1], now) // (its own way up's foot, wherever the duck goes meanwhile)
          : heading(dist, z.x, z.y);
      if (z.fl && !z.cm && !close) aim = flank(z, target, now) || aim; // (a flanker: round the side first)
      /* Downpour: its way goes through a boarded hole with its boards up: it stops there and tears them down */
      const bh = aim && dp() && boardsAhead(z, aim, brd);
      if (bh) {
        z.l = [...z.l];
        z.l[2] = bh.o.id;
        z.n = bh.side;
        z.st = 1;
        z.d = T;
        continue;
      }
      if (aim) stepZombie(z, aim, v * dt, pls);
    }
    /* the claw: at a duck long enough, then again every so often (it keeps walking meanwhile); never one a floor
       above or below it (a duck up on a roof, or on the ladder) */
    const d = room(z.x, z.y, ...target.xy);
    if (d < CLAW && Math.abs(target.zz - zombieZ(z)) < 50) {
      if (!z.n) z.n = T || 1;
      if (T - z.n >= R[2] && T - z.a >= R[3]) {
        z.a = T;
        z.dir = Math.round(
          Math.atan2(target.xy[1] - z.y, target.xy[0] - z.x) * 100,
        );
        const hit = !dodging(s, target.p, now);
        if (hit && hurtDuck(s, p4, target.id, now, "claw"))
          pls.splice(pls.indexOf(target), 1);
        if (hit && z.l[8] && p4[target.id] && p4[target.id].at === now)
          p4[target.id] = { ...p4[target.id], mud: now }; // (a mud zombie's: mud over that duck's screen, l4dd.js mudScreen)
      }
    } else z.n = 0;
  }
  fireTick(s, zs, now, T, p4);
  s.hang.l4p = p4;
  s.hang.brd = brd;
  s.hidden = { ...s.hidden, l4ze: eating };
  separate(zs);
}
/* how high a zombie climbing a fence (its opening id) is, at (x, y) (0 once down): up at its walking speed, then falling
   from the top */
export function fenceZ(x, y, id) {
  const o = openingById(id),
    f = o && o.fence;
  if (!f) return 0;
  const u = (FENCE.out - acrossFence(f, x, y)) / FENCE.across;
  if (u <= 0 || u >= 1) return 0;
  const m = FENCE.mid / FENCE.across;
  return u <= m
    ? GS.FENCE_H * (u / m)
    : GS.FENCE_H * (1 - ((u - m) / (1 - m)) ** 2);
}
/* ---------- up onto the roofs (Downpour, Part B: the owner's, Nov 17 12:28Z) ----------
   A duck up on a roof (or on the canopy over the pumps) is reached by climbing: a zombie goes to the foot of the edge
   nearest the duck (CL.out outside it), climbs straight up the wall onto it (st 6, slower than it walks: CL.speed of its
   walk), and walks the roof at it (st 7). Its height comes from where it is, as on a fence */
const CL = { out: 26, in: 14, step: 40, speed: 0.25 };
const COMMIT_NEAR = 4;
const CHURCH = 2, // (layout.js whereIn: the chapel)
  TEAR_NEAR = 2.2; // duck lengths (room): a duck this close outside the church takes a zombie off the window it tears at // duck lengths (room): a duck that left the floor this close to a zombie keeping to its way up
/* the edge of a roof nearest (x, y): d its deck (stationmap.js DECKS), o how far outside its edge (< 0: inside), nx ny
   the way out. only: that deck's (a zombie up a wall or on a roof keeps to its own, z.k) */
function edgeOf(x, y, only = null) {
  let best = null;
  for (const d of only ? [only] : GS.DECKS) {
    let o = d.x0 - x,
      nx = -1,
      ny = 0;
    if (x - d.x1 > o) [o, nx, ny] = [x - d.x1, 1, 0];
    if (d.y0 - y > o) [o, nx, ny] = [d.y0 - y, 0, -1];
    if (y - d.y1 > o) [o, nx, ny] = [y - d.y1, 0, 1];
    if (!best || Math.abs(o) < Math.abs(best.o)) best = { d, o, nx, ny };
  }
  return best;
}
/* the deck a zombie up a wall or on a roof keeps to (z.k, its place in DECKS), or none (the nearest edge's) */
const deckOf = (z) => (z.k === undefined ? null : GS.DECKS[z.k] || null);
const stationDeck = () =>
  GS.DECKS.find((d) => d.kind === "roof" && d.bldg === 1);
const canopyDeck = () => GS.DECKS.find((d) => d.kind === "canopy");
/* how high a zombie climbing a wall (st 6) is at (x, y): up from the foot (CL.out out) to the top at the edge */
export const climbZ = (x, y, only = null) => {
  const e = edgeOf(x, y, only);
  return e.d.h * Math.min(1, Math.max(0, (CL.out - e.o) / CL.out));
};
/* ---------- flankers (the owner's, Nov 17 17:41Z: "5% of zombies who spawn in will have a pattern where they try to
   attack the player from a different path and direction from the other zombies if it is availible, as a way to add
   difficulty to players making a train of zombies to herd or shepard") ----------
   A flanker (z.fl: 1 or -1, its side) going for a duck on the ground first makes for a spot FLANK.far from the duck,
   FLANK.turn round from the way it comes (z.wp [x, y, the duck, done]), then comes at the duck from there as the others
   do. No room on either side (a wall, the trees, the flood's edge) and it comes as the others */
const FLANK = { p: 0.05, far: 420, turn: 1.75, done: 1.5 };
function flank(z, q, now) {
  if (!q || q.dk) return null;
  if (!z.wp || z.wp[2] !== q.id) z.wp = flankSpot(z, q);
  if (z.wp[3]) return null;
  if (
    room(z.x, z.y, z.wp[0], z.wp[1]) < FLANK.done ||
    room(z.x, z.y, ...q.xy) < (FLANK.far / RX) * 0.6
  ) {
    z.wp = [...z.wp.slice(0, 3), 1]; // (round the side: now straight at it)
    return null;
  }
  return wayTo(z.x, z.y, z.wp[0], z.wp[1], now);
}
function flankSpot(z, q) {
  const [tx, ty] = q.xy,
    a0 = Math.atan2((z.y - ty) / RY, (z.x - tx) / RX);
  for (const sgn of [z.fl, -z.fl]) {
    const a = a0 + sgn * FLANK.turn,
      x = tx + Math.cos(a) * FLANK.far,
      y = ty + Math.sin(a) * FLANK.far * (RY / RX);
    if (zOk(x, y, heightAt(x, y)) && openNear(x, y) >= 0)
      return [Math.round(x), Math.round(y), q.id, 0];
  }
  return [0, 0, q.id, 1];
}
/* ---------- onto the canopy (the owner's, Nov 17 18:05Z: "zombies can jump onto the gas pump roof with only a 5%
   chance of failing once they are on the gas station roof, and their path of least resistance is the climbing of the
   most near by gas station wall before getting on the roof and doing a jump animation for this") ----------
   A duck on the canopy: a zombie climbs the gas station's wall nearest it, walks the roof to its south edge over the
   canopy, and jumps across (st 8: z.j [x0, y0, x1, y1, h0, h1], an arc JUMP.arc high), 1 time in 20 short of it, down
   to the ground (JUMP.fail) */
const JUMP = { speed: 300, arc: 40, fail: 0.05, in: 30 };
function jumpOn(z, pls, far) {
  const C = canopyDeck(),
    S = stationDeck();
  let q = null;
  for (const p of pls)
    if (p.dk === C && (!q || room(z.x, z.y, ...p.xy) < room(z.x, z.y, ...q.xy)))
      q = p;
  if (!q) return false;
  const x = Math.min(
      Math.max(q.xy[0], Math.max(C.x0, S.x0) + JUMP.in),
      Math.min(C.x1, S.x1) - JUMP.in,
    ),
    y = S.y1 - 10;
  if (!walkTo(z, x, y, far)) return true;
  const fell = Math.random() < JUMP.fail,
    y1 = fell ? (S.y1 + C.y0) / 2 : C.y0 + JUMP.in;
  z.st = 8;
  z.n = 0;
  z.j = [x, y, x, y1, S.h, fell ? heightAt(x, y1) : C.h];
  return true;
}
const jumpZ = (z) => {
  const [x0, y0, x1, y1, h0, h1] = z.j,
    u = Math.min(
      1,
      Math.hypot(z.x - x0, z.y - y0) / (Math.hypot(x1 - x0, y1 - y0) || 1),
    );
  return h0 + (h1 - h0) * u + JUMP.arc * 4 * u * (1 - u);
};
/* a zombie's height: up a fence, up a wall, on a roof, jumping onto the canopy, or on the ground */
export const zombieZ = (z) =>
  z.st === 5
    ? fenceZ(z.x, z.y, z.l[2])
    : z.st === 6
      ? climbZ(z.x, z.y, deckOf(z))
      : z.st === 7
        ? edgeOf(z.x, z.y, deckOf(z)).d.h
        : z.st === 8 && z.j
          ? jumpZ(z)
          : heightAt(z.x, z.y);
/* the feet of each roof's walls where a zombie can start up (every CL.step along its edges, on open ground), made once */
let footOf = null;
function climbSpot(dk, [x, y]) {
  if (!footOf || footOf.rev !== layoutRev()) {
    footOf = new Map();
    footOf.rev = layoutRev();
  }
  if (!footOf.has(dk)) {
    const spots = [],
      o = CL.out;
    for (let a = dk.x0; a <= dk.x1; a += CL.step)
      spots.push([a, dk.y0 - o], [a, dk.y1 + o]);
    for (let b = dk.y0; b <= dk.y1; b += CL.step)
      spots.push([dk.x0 - o, b], [dk.x1 + o, b]);
    footOf.set(
      dk,
      spots.filter(([sx, sy]) => zOk(sx, sy, heightAt(sx, sy))),
    );
  }
  let best = null,
    bd = Infinity;
  for (const q of footOf.get(dk)) {
    const d = Math.hypot(q[0] - x, q[1] - y);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
}
/* an opening's two spots for zombie z: out (where it waits and tears) and in (where it's through). A fence's at the
   zombie's own place along it; a boarded hole on Downpour from the side it came to it (z.n: 1 outside, -1 inside) */
function sidesOf(o, z) {
  if (o.fence)
    return o.axis === "y"
      ? { out: [o.out[0], z.y], in: [o.in[0], z.y] }
      : { out: [z.x, o.out[1]], in: [z.x, o.in[1]] };
  return z.n === -1 ? { out: o.in, in: o.out } : o;
}
/* Downpour: does a zombie's way (from it to aim) go through a boarded hole with boards up? Its opening and side */
function boardsAhead(z, aim, brd) {
  for (const o of OPENINGS) {
    if (o.kind !== "hole" || !(brd[o.id] > 0)) continue;
    const [al, ac, bc] =
      o.axis === "x"
        ? [z.x, z.y - o.y, aim[1] - o.y]
        : [z.y, z.x - o.x, aim[0] - o.x];
    if (al < o.a - 20 || al > o.b + 20 || Math.abs(ac) > 90) continue;
    if (Math.sign(ac) === Math.sign(bc) && Math.abs(bc) > 24) continue;
    const outward = Math.sign(
      (o.axis === "x" ? o.out[1] - o.y : o.out[0] - o.x) || 1,
    );
    return { o, side: Math.sign(ac) === outward ? 1 : -1 };
  }
  return null;
}
/* straight toward (tx, ty), through anything (outside, or climbing in): true on arrival */
function walkTo(z, tx, ty, far) {
  const dx = tx - z.x,
    dy = ty - z.y,
    d = Math.hypot(dx, dy);
  if (d <= far) {
    z.x = tx;
    z.y = ty;
    return true;
  }
  z.x += (dx / d) * far;
  z.y += (dy / d) * far;
  return false;
}
/* inside: a few small steps toward aim. Something in the way (a trunk, a car, a pew, a wall's end): it slides along it,
   or turns a little more each try (30, 60, then 90 degrees, either way) until a step is free, so it walks round instead
   of standing pressed against it (the owner's, Nov 17 05:46Z: zombies got stuck on trees and didn't know to go round).
   Stopping only at ducks. Stood inside something (pushed or climbed in there), it walks out toward aim */
const TURNS = [0, 0.52, -0.52, 1.05, -1.05, 1.57, -1.57];
function stepZombie(z, aim, far, pls) {
  const n = Math.max(1, Math.ceil(far / 8));
  for (let k = 0; k < n; k++) {
    const dx = aim[0] - z.x,
      dy = aim[1] - z.y,
      d = Math.hypot(dx, dy);
    if (d < 1) return;
    const len = Math.min(d, far / n),
      ux = dx / d,
      uy = dy / d,
      zz = heightAt(z.x, z.y),
      stuckIn = !zOk(z.x, z.y, zz);
    const ok = (x, y) => {
      if (stuckIn ? !playable(x, y) : !zOk(x, y, zz)) return false;
      for (const q of pls) {
        if (Math.abs((q.zz || 0) - zz) > 50) continue; // (a duck up on a roof over it: it walks under it)
        const now = room(z.x, z.y, ...q.xy),
          then = room(x, y, ...q.xy);
        if (then < 1 && then < now) return false;
      }
      return true;
    };
    let moved = false;
    for (const t of TURNS) {
      const c = Math.cos(t),
        s = Math.sin(t),
        sx = (ux * c - uy * s) * len,
        sy = (ux * s + uy * c) * len;
      if (ok(z.x + sx, z.y + sy)) {
        z.x += sx;
        z.y += sy;
        moved = true;
        break;
      }
      if (t) continue;
      // (straight on is blocked: first a slide along the wall, the old way, keeping what part of the step is free)
      if (Math.abs(sx) > 0.5 && ok(z.x + sx, z.y)) {
        z.x += sx;
        moved = true;
        break;
      }
      if (Math.abs(sy) > 0.5 && ok(z.x, z.y + sy)) {
        z.y += sy;
        moved = true;
        break;
      }
    }
    if (!moved) return;
  }
}
/* can a zombie walk straight from (x0, y0) up to a duck at (x1, y1)? (nothing it can't step on in between, every 8 px;
   the last 30 px don't count: a duck up on a car or by a pew is still clawed from the foot of it) */
function walkable(x0, y0, x1, y1) {
  const z = heightAt(x0, y0),
    d = Math.hypot(x1 - x0, y1 - y0);
  for (let t = 8; t < d - 30; t += 8)
    if (!zOk(x0 + ((x1 - x0) * t) / d, y0 + ((y1 - y0) * t) / d, z))
      return false;
  return true;
}
/* zombies never stand in each other: two too close are pushed apart (each half), where it's open */
function separate(zs) {
  const live = zs.filter((z) => z.st !== 3),
    grid = new Map(),
    key = (x, y) => Math.floor(x / 64) * 10000 + Math.floor(y / 64);
  for (const z of live) {
    const k = key(z.x, z.y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(z);
  }
  for (let pass = 0; pass < 2; pass++)
    for (const a of live) {
      const i0 = Math.floor(a.x / 64),
        j0 = Math.floor(a.y / 64);
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++)
          for (const b of grid.get((i0 + di) * 10000 + j0 + dj) || []) {
            if (b.i <= a.i) continue;
            let ex = (a.x - b.x) / RX,
              ey = (a.y - b.y) / RY,
              e = Math.hypot(ex, ey);
            if (e >= 1) continue;
            if (e < 1e-3) {
              ex = Math.random() - 0.5;
              ey = Math.random() - 0.5;
              e = Math.hypot(ex, ey);
            }
            const push = (1 - e) / 2,
              ux = (ex / e) * push * RX,
              uy = (ey / e) * push * RY;
            nudge(a, ux, uy);
            nudge(b, -ux, -uy);
          }
    }
}
function nudge(z, dx, dy) {
  const x = z.x + dx,
    y = z.y + dy;
  if (z.st === 6 || z.st === 8) return; // (up a wall, or jumping: it keeps to it)
  const e = z.st === 7 && edgeOf(x, y, deckOf(z));
  if (
    z.st === 7
      ? e.o < -6 && !!deckAt(x, y, e.d.h)
      : z.st === 2
        ? zOk(x, y, heightAt(z.x, z.y))
        : !playable(x, y) || z.st === 4
  ) {
    z.x = x;
    z.y = y;
  }
}
/* ---------- for the computers (l4ddbots.js) ---------- */
/* the way from (x, y) toward (tx, ty) by walking (the next point along the flow field), or null; one field per target
   cell (flowFrom keeps them) */
export function wayTo(x, y, tx, ty, now) {
  const c = openNear(tx, ty);
  if (c < 0) return null;
  return heading(flowFrom([c]), x, y); // (flowFrom keeps the fields it made)
}
/* can a shot from (x0, y0) reach (x1, y1)? (no wall or furniture in between, at height z) */
export function clearShot(x0, y0, x1, y1, z = 0) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16));
  for (let k = 1; k < n; k++)
    if (walled(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, z))
      return false;
  return true;
}
export { standing as l4Up };

/* what the screens ask: a duck's HP, its bleeding out, the round */
export const l4Hp = (s, id) => {
  const p = P4(s, id);
  return p ? p.hp : -1;
};
/* how far my next HP is to coming back on its own, 0 … 1 (a hit or a heal starts it over: p.at), or null while it can't
   (full, down, a ghost) (the HP meter's faint red fill, hpmeter.js) */
export const l4Regen = (s, id, now) => {
  const p = P4(s, id);
  if (!p || p.gh || p.dn || p.hp <= 0 || p.hp >= maxHp(s, id)) return null;
  return Math.max(
    0,
    Math.min(1, (now - p.at) / (isWild(s, id) ? WILD.regen : L4.REGEN)),
  );
};
/* how far a downed duck is into its bleeding-out (k, 0 to 1), and whether someone is reviving it (wait: it's stopped) */
export const l4Dying = (s, id, now) => {
  const p = P4(s, id);
  if (!p || !p.dn) return { k: -1, wait: false };
  const left = p.dn - (p.rv ? p.rv.at : now);
  return { k: Math.min(1, Math.max(0, 1 - left / L4.BLEED)), wait: !!p.rv };
};
export const l4Down = (s, id) => {
  const p = P4(s, id);
  return p && p.dn && !p.ex ? p.dn : 0; // (Justin dead for good: no down meter, the owner's, Nov 17 13:30Z)
};
