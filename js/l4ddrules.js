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
          1 tearing the boards, 4 climbing in, 2 in, 3 dead), sent every heartbeat
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
  standable,
  solidsAt,
  onPlatform,
  BJ,
  layoutRev,
} from "./hangout/layout.js";
import { ARM_SPEED, ARM_COOL, ARM_SWING, ARM_RELOAD } from "./armspeed.js";
import { GRENADE_MS, daggerZ, walkOf, FASTER, shareOf, say } from "./rules.js";
import { JUSTIN } from "./hangout/npcart.js";
import { invuln } from "./hangout/death.js";
import { JET } from "./jetpack.js";
import { FLAME, flameReach, inCone } from "./flamer.js";
import { woundCode, pwHit, explodedLook } from "./wounds.js";
import {
  BOMB,
  bombRoll,
  bombIn,
  flyTo,
  snapLine,
  logIn,
  jaimeCount,
} from "./jaimebomb.js";
import {
  powerSetUp,
  powerRound,
  powerTick,
  powerFire,
  powerTake,
  powerBuy,
  powerAct,
  isPw,
  pwName,
} from "./l4ddpower.js";
import { ANGEL, angelOf, angelAmmo, angelAct, angelLeft } from "./l4ddangel.js";

export const isL4dd = (s) => !!s && s.options.mode === "l4dd";
/* I want only the lights' stutter on of Hangout's activities. The couches, the stage, the card table and the piano's
   keys are still drawn, but quiet: nothing to sit on, sing into or play at, and nothing else to write in or switch. */
keepOnly("l4dd", [], ["flicker"], ["seats", "stage", "bj", "piano", "tv"]); // (the TV only shows while the power is on: l4ddpower.js)

/* ---------- the numbers ---------- */
export const L4 = {
  HP: 3,
  REGEN: 15000, // ms: 1 HP back, 15 s after the last hit or heal
  REVIVE: 10000, // ms of holding E by a downed duck
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
export const SAFE = { PRICE: 2500, GLOW: 1200, INV: 6000 };
const hasSafe = (s, id) => slotsOf(s, id).includes("safekeep");
export const invulnOf = (s, id, now) =>
  ((s && s.hang && s.hang.l4inv) || {})[id] > now;
export const WALK = 380 * 0.6 * 1.05; // world px a second: ducks at 63% of Duck Cabin's walk (world.js SPEED, l4dd.js SPEED: 5% faster than 60%, the owner's, Nov 3), at the Normal Walking speed; every zombie's speed is a share of it
const Z_SLOW = 0.8 / 1.05; // (and the zombies 20% slower than they were, whatever the ducks' speed did)
/* the owner's rounds: up to which round, zombies in it and how many more for each player past the first [fewest, most],
   their speed as a share of the ducks' [slowest, fastest], how long one is at a duck before it swipes and how often
   after (ms), and the most on the board at once. The steps come every 4 rounds, not 5 (the owner's, Nov 4: 5, 10,
   15 and 25 became 4, 8, 12 and 20) */
const ROUNDS = [
  [4, 14, [3, 5], [0.5, 0.67], 500, 1000, Infinity],
  [8, 20, [3, 5], [0.5, 0.75], 300, 750, 35],
  [12, 20, [3, 5], [0.75, 0.75], 300, 750, 35],
  [20, 50, [5, 10], [0.95, 0.95], 250, 500, 45],
  [Infinity, 50, [5, 10], [0.95, 0.95], 250, 500, 50],
];
export const roundOf = (r) => ROUNDS.find((x) => r <= x[0]);
/* and more of them (the owner's, Nov 4): 25% more in rounds 1 to 4, 100% more in 5 to 8, 200% more in 9 to 12, 300%
   more from 13 on, the ones for each player past the first too */
export const moreOf = (r) => (r <= 4 ? 1.25 : r <= 8 ? 2 : r <= 12 ? 3 : 4);
/* spawning (the owner's): a zombie a second, 50% more for each player past the first, never more than 5 a second (3
   more for each player past the first); each second a 25% chance that none comes */
const SKIP = 0.25;
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
    mag: 75,
    all: 225 + 3 * 75, // (3 more magazines: the owner's, Nov 16)
    reload: 2800,
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
  "ak",
  "chaingun",
  "revolver",
  "glauncher",
  "lmg",
  "dbarrel",
  "flamer",
  "burst",
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
export const WEAPON_ODDS = 0.85;
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
  ak: "AK-47",
  chaingun: "Chain gun",
  revolver: "Revolver",
  glauncher: "Grenade launcher",
  lmg: "LMG",
  dbarrel: "Double barrel",
  flamer: "Flamethrower",
  burst: "Burst rifle",
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
];
/* and his guns (the owner's, Nov 4): both pistols, the knife, the shotgun and the bow. Bullets cost 5 points for 2,
   arrows 5 for 5; a gun I already have says Refill and costs what fills it to the top. What a gun costs to buy
   when I haven't got it the owner didn't say: I made it its full load of ammo at that price (the knife 100).
   Everything he sells is 20% dearer, the ammo too (the owner's, Nov 4): bullets 6 for 2, arrows 6 for 5, the knife 120 */
const SHOP_MORE = 1.2;
export const GUN_SHOP = ["handgun", "revolver", "knife", "shotgun", "bow"];
export const AMMO_PRICE = { bow: [6, 5], gun: [6, 2] }; // (points, for how many: arrows; every other gun's bullets)
const KNIFE_PRICE = 120;
const ammoLeft = (c) => (c ? c[0] + c[1] : 0);
const ammoCost = (w, n) => {
  const [p, k] = AMMO_PRICE[w] || AMMO_PRICE.gun;
  return Math.ceil(n / k) * p;
};
/* what gun w costs to buy when I haven't got it */
export const buyPrice = (w) => {
  const full = fullAmmo(w);
  return full ? ammoCost(w, ammoLeft(full)) : KNIFE_PRICE;
};
/* what the Butler asks for gun w now: to buy it, or to fill it to the top (0: it's full; null: not his, or a knife I
   have already) */
export function gunPrice(s, id, w) {
  if (!GUN_SHOP.includes(w)) return null;
  const kit = kitOf(s, id),
    full = fullAmmo(w);
  if (!kit || !kit.sl.includes(w)) return buyPrice(w);
  if (!full) return null;
  return ammoCost(
    w,
    Math.max(0, ammoLeft(fullFor(s, id, w)) - ammoLeft(kit.am[w])),
  );
}
export const priceOf = (id, n) =>
  id === "acc"
    ? ACC_PRICE
    : Math.round(
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
const UP_TIMES = 2; // (every upgrade twice its old price, for now: the owner's, Nov 3; then 20% more, SHOP_MORE)
/* the price I pay now: a Sale (a drop) halves what I buy for the rest of the round, each of the Butler's upgrades only
   once (the owner's: "increased health or accuracy is only half off for that item once"), the fireplace every time.
   It lasts 45 s (DROP.FOR, the owner's, Nov 16; it was the rest of the round) */
export const safePrice = (s) =>
  saleOn(s) ? Math.ceil(SAFE.PRICE / 2) : SAFE.PRICE; // (a Sale halves it, every time)
export const saleOn = (s) => !!(s && s.hang && s.hang.l4sale); // (for DROP.FOR: dropTick ends it)
export const priceFor = (s, id, what, n) => {
  const full = what === "box" ? BOX.price : priceOf(what, n);
  if (!saleOn(s)) return full;
  const used = (s.hang.l4sale.used || {})[id] || {};
  return what !== "box" && used[what] ? full : Math.ceil(full / 2);
};
/* where Justin's Butler stands: beside his stool at the card table (anyone walks through him; nothing hurts him), and
   the fireplace's front, where E spins it */
export const BUTLER = { x: BJ.bx + 84, y: BJ.by - 18 };
export const BOX = { x: 2300, y: 742, price: 500, spin: 4200, keep: 10000 }; // (500 a spin: the owner's, Nov 15)
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
});

/* ---------- the map: only inside and the deck ----------
   The deck's stairs are boarded at the top (their landing is part of the deck). The openings: where zombies come in,
   and where boards go up. Each has its line in the wall (x, y; axis 'x' for an east-west wall, half: half its width),
   the spot just outside where a zombie tears the boards down (out), the spot just inside where it's in (in), and for
   the stairs the foot of the stairs where they appear (from) */
const LAND = { x0: STAIRS.x0, x1: STAIRS.x1, y0: STAIRS.y0, y1: STAIRS.land };
export const playable = (x, y) =>
  inCabin(x, y) ||
  inDeck(x, y) ||
  (x >= LAND.x0 && x < LAND.x1 && y >= LAND.y0 && y < LAND.y1);
export const OPENINGS = [
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
export const openingById = (id) => OPENINGS.find((o) => o.id === id) || null;
/* where everyone starts, and comes back at the next round: free spots in the great room, nearest the middle first */
let spots = null;
export function startSpot(k = 0) {
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
const CELL = 40,
  GX = 1280,
  GY = 580,
  GW = 82,
  GH = 52;
let walk = null,
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
      playable(x, y) && standable(x, y, z, 0) && !onPlatform(x, y) ? 1 : 0;
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
  if (!heapD) {
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
      const nd = d + N8[k][2];
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
  playable(x, y) && standable(x, y, z, STEP) && !onPlatform(x, y);
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
  angelOf(s, id, w) ? angelAmmo(ARMS[w]) : fullAmmo(w);
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
export const maxHp = (s, id) => L4.HP + (upOf(s, id).hp || 0);
/* a weapon's wait between uses (each Attack speed: 10% shorter), a reload's time (Faster reload: 30% shorter), the
   headshot chance (headOf, below) */
export const l4Cool = (s, id, w) =>
  ARMS[w]
    ? ARMS[w].cool *
      Math.pow(0.9, upOf(s, id).as || 0) *
      (angelOf(s, id, w) ? ANGEL.FAST : 1) // (Angelic: 20% faster, l4ddangel.js)
    : 400;
export const reloadOf = (s, id, w, c) =>
  (ARMS[w].shell
    ? ARMS[w].shell *
      Math.max(
        1,
        Math.min(ARMS[w].mag - (c ? c[0] : 0), c ? c[1] : ARMS[w].mag),
      )
    : ARMS[w].reload || 1500) *
  (upOf(s, id).rl ? 0.7 : 1) *
  (angelOf(s, id, w) ? ANGEL.RELOAD : 1); // (the double barrel: a second for each shell it loads; Angelic: 20% faster)
/* crits and misses (the owner's, Nov 16 21:47Z): every gun and melee weapon crits 5% of its hits, the fast ones (those
   that fire as long as the button is down, and the burst rifle) 2.5%; each Critical Chance upgrade adds 2.5% to every
   one of them; an Angelic weapon's own chance is doubled (not the upgrades'). A hit misses ("critical failure") 2.5% of
   the time, a fast weapon's 5%. The cast iron pan keeps its own: half its swings miss, half its hits crit. Every
   weapon crits ("every weapon has a 2.5% crit chance unless it damages reasonably slower"): the chain gun and the
   flamethrower the fast 2.5% (the flamethrower once, as a zombie catches its fire), the grenade launcher and the
   grenade the slow 5%, each zombie in the blast (it dies anyway: a crit blows its head off). The flamethrower never
   misses (the owner's misses are bullets and melee) */
export const CRIT = { SLOW: 0.05, FAST: 0.025, UP: 0.025 };
export const MISS = { SLOW: 0.025, FAST: 0.05 };
const fastArm = (w) => !!(ARMS[w] && (ARMS[w].auto || ARMS[w].burst));
const canHit = (w) =>
  !!ARMS[w] && (ARMS[w].kind === "melee" || ARMS[w].kind === "ranged");
/* a weapon's own crit chance, and its miss chance (0: never) */
export const critOf = (w) =>
  w === "pan"
    ? ARMS.pan.crit
    : w === "grenade"
      ? CRIT.SLOW
      : !canHit(w)
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
  if (!n || !s.players[id]) return;
  s.hang.l4pt = { ...(s.hang.l4pt || {}), [id]: ptsOf(s, id) + n };
}

/* ---------- a game, a round ---------- */
function countFor(s, r) {
  const R = roundOf(r),
    extra = Math.max(0, players(s).length - 1);
  let n = R[1];
  for (let k = 0; k < extra; k++) n += rint(R[2][0], R[2][1]);
  return Math.round(n * moreOf(r));
}
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
  powerRound(s, r, now, PH);
}
/* everyone up again, full: a new game, or a ghost back at the next round (where it stands now, or at a start spot) */
function bringBack(s, id, now, k, fresh) {
  const p4 = { ...(s.hang.l4p || {}) },
    was = p4[id] || {};
  p4[id] = { hp: L4.HP, at: now };
  s.hang.l4p = p4;
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
   fell (the owner's, Nov 3); it lies there a minute, into the next round too, and the first duck to walk over it takes
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
  LIFE: 60000, // ms a drop lies there (it stays through a round's end)
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
/* a body the Nuke left: it lies there longer */
const nuked = (s, z) => !!s.hang.l4nk && (s.hang.l4nk.ids || []).includes(z.i);
/* Max Ammo: every weapon that refills is full again, the grenades too (3); the medkit and Jaime don't come back this
   way (the medkit never refills, Jaime comes back each round) */
function maxAmmo(s) {
  const am = { ...(s.hang.l4a || {}) };
  for (const id of Object.keys(am)) {
    const m = { ...am[id], am: { ...am[id].am }, g: ARMS.grenade.most };
    for (const w of m.sl || [])
      if (fullAmmo(w) && w !== "medkit" && !ARMS[w].round)
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
  s.hang.brd = Object.fromEntries(OPENINGS.map((o) => [o.id, L4.BOARDS]));
  s.hang.l4p = {};
  s.hang.l4a = {};
  s.hang.l4pt = {};
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
    const p4 = s.hang.l4p || {};
    for (const [t, p] of Object.entries(p4))
      if (p.rv && p.rv.by === id)
        s.hang.l4p = { ...p4, [t]: { ...p, rv: null } };
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
    if (L.over || !L.wait) return false;
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
      s.hang.l4p = { ...p4, [t]: { ...tp, rv: null } };
      return true;
    }
    const [tx, ty] = at(pos);
    if (Math.hypot(tx - mx, ty - my) > L4.REACH * 1.6) return false;
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
    if (!o || Math.hypot(o.in[0] - mx, o.in[1] - my) > L4.REACH * 1.6)
      return false;
    if ((s.hang.brd || {})[o.id] >= L4.BOARDS) return false;
    b[id] = { o: o.id, at: now };
    s.hang.l4b = b;
    return true;
  }
  if (a.do === "buy")
    return buy(s, id, String(a.what || ""), mx, my, a.hand, now);
  if (a.do === "ammo")
    return buyGun(s, id, String(a.what || ""), "", true, now); // (B: anywhere, the gun in hand)
  if (a.do === "box") return fireplace(s, id, a, now, mx, my);
  if (a.do === "power") return powerAct(s, id, now, mx, my, PH);
  if (a.do === "angel") return angelAct(s, id, a, now, mx, my, PH);
  return false;
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
function helperIn(s, by, now) {
  const id = HELPER.id;
  if (s.players[id]) return;
  s.players[id] = {
    id,
    name: "Justin",
    bot: true,
    helper: 1,
    duck: { ...JUSTIN },
    card: {},
    nameStyle: {},
    ready: true,
    joined: now,
  };
  s.seat.push(id);
  bringBack(s, id, now, players(s).length, true);
  const kit = freshKit();
  kit.sl = ["knife", "chaingun", "handgun", ""];
  kit.am = { chaingun: fullAmmo("chaingun"), handgun: fullAmmo("handgun") };
  s.hang.l4a = { ...s.hang.l4a, [id]: kit };
  s.hang.l4pt = { ...s.hang.l4pt, [id]: HELPER.pts };
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
  if (c && ARMS[w] && ARMS[w].mag) {
    const k = Math.min(ARMS[w].mag - c[0], c[1]);
    m.am = { ...m.am, [w]: [c[0] + k, c[1] - k] };
  }
  m.rl = 0;
  m.rw = "";
  return true;
}
/* R: the ranged weapon in hand reloads (one with a magazine, not full, with bullets left) */
function startReload(s, id, m, w, now) {
  const c = m.am[w];
  if (!ARMS[w] || !ARMS[w].mag || !c || m.rl) return false;
  if (c[0] >= ARMS[w].mag || c[1] <= 0) return false;
  m.rt = reloadOf(s, id, w, c);
  m.rl = now + m.rt;
  m.rw = w;
  return true;
}
export function l4Reload(s, a, now) {
  const m0 = kitOf(s, a.id),
    w = l4Holds(s, a.id, a.w) ? a.w : (s.pos[a.id] || {}).w;
  if (!m0 || !standing(s, a.id) || !l4Holds(s, a.id, w)) return false;
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
  W,
  H,
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
    kind = kindOf(what);
  if (!L || L.over || !p || !m0 || !standing(s, id) || !A) return false;
  if (kind !== "grenade" && !m0.sl.includes(what)) return false;
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
  const c = m.am[what];
  if (kind === "grenade" ? m.g <= 0 : c && (c[0] <= 0 || m.rw === what))
    return false; // (empty, or reloading)
  if (what === "medkit" && (P4(s, id) || {}).hp >= maxHp(s, id)) return false; // (nothing to heal)
  if (what === "zebra" && s.zcake) return false; // (one zebra cake in the room at a time)
  m.u[what] = now;
  if (m.rw && m.rw !== what) {
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
  const dual = what === "handgun" && angelOf(s, id, what), // (the Angelic pistol: two of them, both fire)
    many = A.burst ? Math.min(A.burst, c[0]) : dual ? Math.min(2, c[0]) : 1; // (the burst rifle: three rounds a press, or the rest of its clip)
  if (kind === "grenade") m.g--;
  else if (c) {
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
  else if (what === "flamer") flame(s, id, m, px, py, dx, dy, hz, now);
  else {
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
          shot(
            k,
            dx,
            dy,
            v,
            what === "glauncher"
              ? { life: (A.far / A.speed) * 1000 }
              : i
                ? { n: n * 10 + i, t: now + i * (A.gap || 60) }
                : {},
          ),
        ); // (a burst's rounds leave one after another: each waits until its time, t)
      s.shots = [...(s.shots || []), ...out];
    }
  }
  s.hang.l4a = { ...s.hang.l4a, [id]: m };
  return true;
}
/* a zombie takes damage from a duck, and the duck gets its points: 5 for each HP it took, or 25 for a headshot (which
   takes all of it); true when it died */
function strike(s, z, dmg, head, by, w = "") {
  if (z.st === 3) return false;
  if (w) wound(s, z, w, head);
  if (w && angelOf(s, by, w)) dmg += ANGEL.DMG; // (Angelic: +1, l4ddangel.js)
  const on = s.hang.l4on || {},
    all = head || !!on.kill, // (Instant Kill: every hit takes all its HP, 5 points for each)
    took = all ? z.hp : Math.min(z.hp, dmg);
  z.hp = all ? 0 : Math.max(0, z.hp - dmg);
  addPts(s, by, (head ? PTS.HEAD : PTS.HIT * took) * (on.double ? 2 : 1));
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
        Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1,
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
  if (bomb) bombIn(s, id, J, now); // (the Jaime Bomb: jaimebomb.js)
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
function catchFire(s, z, by, now, T, w = "") {
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
  const head = !!w && headshot(s, by, w, z, now); // (the flamethrower's crit: once, as it catches fire)
  if (strike(s, z, 1, head, by, head ? w : "")) {
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
      catchFire(s, z, id, now, T, "flamer");
      any = true;
    }
  if (any) store(s, zs, true);
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
    if (hurtDuck(s, p4, id, now)) delete fp[id];
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
  } else if (u.hp) {
    p4[id] = { ...p4[id], uhp: u.hp }; // (kept for a medkit's revive)
    s.hang.l4u = { ...s.hang.l4u, [id]: { ...u, hp: 0 } }; // (down: the max HP bought is gone)
  }
  if (s.players[id]) s.players[id].dead = true;
  s.hang.still = { ...(s.hang.still || {}), [id]: now + L4.BLEED + 60000 };
  const b = { ...(s.hang.l4b || {}) };
  delete b[id];
  s.hang.l4b = b;
  return true;
}
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
    const [ax, ay, a, c] = o.axis === "x" ? [x, y, o.x, o.y] : [y, x, o.y, o.x],
      out = Math.sign((o.axis === "x" ? o.out[1] : o.out[0]) - c) || 1,
      across = (ay - c) * out;
    return (
      Math.abs(ax - a) < o.half + OPEN_SIDE &&
      across > -OPEN_IN &&
      across < OPEN_OUT
    );
  });
const walled = (x, y, z) =>
  (!playable(x, y) && !inOpening(x, y)) ||
  (!inOpening(x, y) && solidsAt(x, y, z + 20).some((b) => b.top > z + 20));
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
        if (walled(x, y, sh.hz))
          at = [x0 + ((x1 - x0) * (k - 1)) / n, y0 + ((y1 - y0) * (k - 1)) / n];
        else if (
          nearby(grid, zs, x, y).some(
            (z) =>
              z.st !== 3 &&
              Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
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
      if (walled(x, y, sh.hz)) {
        gone = true;
        endX = x;
        endY = y;
        break;
      }
      const w = ARMS[sh.w]
          ? sh.w
          : sh.k === "arrow"
            ? "bow"
            : sh.k === "pellet"
              ? "shotgun"
              : "handgun",
        A = ARMS[w],
        near = (z) =>
          z.st !== 3 && Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1;
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
      const pierce = !angelOf(s, sh.by, w)
        ? A.pierce
        : w === "bow"
          ? ANGEL.BOW
          : w === "sniper"
            ? A.pierce + ANGEL.SNIPER
            : A.pierce; // (Angelic: the bow through one zombie, the sniper through two more; l4ddangel.js)
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
          if (head) boom(s, { by: sh.by, hz: sh.hz }, z.x, z.y, zs, T, now);
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
    if (walled(nx, ny, hz || 0)) break;
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
  const gore = [],
    w = sh.k === "grenade" ? "grenade" : sh.k === "lgren" ? "glauncher" : ""; // (a crit for each zombie in it: the grenade's or the launcher's; not the Jaime Bomb's, nor the Angelic pistol's blast)
  for (const z of zs)
    if (
      z.st !== 3 &&
      Math.hypot(z.x - bx, (z.y - by) * 1.25) < ARMS.grenade.r * wide
    ) {
      const head = !!w && headshot(s, sh.by, w, z, now);
      strike(s, z, z.hp, head, sh.by, head ? w : ""); // (all its HP: 5 points for each, or a headshot's)
      die(z, T);
      mark(s, z, "g0"); // (every chunk, cuts and big holes: l4ddart.js)
      gore.push([Math.round(z.x), Math.round(z.y)]);
      any = true;
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
        p = { ...p, rv: null };
      else if (p.skAt && now >= p.skAt) {
        s.hang.l4p = p4;
        getUp(s, id, now, false, true);
        p = s.hang.l4p[id];
      } else if (rv && now - rv.at >= L4.REVIVE) {
        p = { hp: L4.BACK_HP, at: now };
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
      } else if (!rv && !p.skAt && now >= p.dn) {
        p = { hp: 0, at: now, gh: 1 }; // (bled out: a ghost until the next round)
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
    if (p.hp < maxHp(s, id) && now - p.at >= L4.REGEN)
      p4[id] = { ...p, hp: p.hp + 1, at: now };
  }
  s.hang.l4p = p4;
  const am = s.hang.l4a || {};
  for (const id of Object.keys(am))
    if (am[id].rl && now >= am[id].rl) {
      const m = { ...am[id] };
      finishReload(m, now);
      s.hang.l4a = { ...s.hang.l4a, [id]: m };
    } else if (am[id].rl && s.pos[id] && s.pos[id].w !== am[id].rw)
      s.hang.l4a = { ...s.hang.l4a, [id]: { ...am[id], rl: 0, rw: "" } }; // (switched to another slot: the reload is lost, the owner's, Nov 16)
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
  const up = ids.filter((id) => standing(s, id) || !!(P4(s, id) || {}).skAt);
  if (!up.length && ids.length) {
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
        L2.acc += 2 * Math.pow(1.5, extra); // (twice as fast: the owner's, Nov 16 21:21Z)
        const k = Math.min(
          Math.floor(L2.acc),
          10 + 6 * extra,
          L2.n - L2.made - L2.owe,
        );
        L2.acc -= Math.floor(L2.acc);
        L2.owe += Math.max(0, k);
      }
    }
  }
  if (L2.owe > 0) {
    const room = Math.max(0, R[6] - live),
      k = Math.min(L2.owe, room);
    for (let q = 0; q < k; q++) zs.push(newZombie(s, L2, T));
    L2.owe -= k;
    L2.made += k;
  }
  /* the zombies walk, tear boards down, climb in, swipe */
  moveZombies(s, zs, now, T, up);
  jaimesRun(s, zs, now, T);
  nukeTick(s, zs, now, ids);
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
function newZombie(s, L, T) {
  const R = roundOf(L.r),
    ids = players(s).filter((id) => standing(s, id)),
    pts = ids.map((id) => at(s.pos[id])),
    near = (o) =>
      Math.min(
        ...pts.map(([x, y]) => Math.hypot(x - o.in[0], y - o.in[1])),
        1e9,
      ),
    order = [...OPENINGS].sort((a, b) => near(a) - near(b)),
    pool = [...order, ...order.slice(0, 4)],
    o = pool[Math.floor(Math.random() * pool.length)];
  const i = L.next++;
  const dress = Math.random() < 0.2 ? Math.random() : -1, // (20% wear something: a hat, an outfit or both)
    hat = dress >= 0 && dress < 0.6 ? rint(0, ZHATS.length - 1) : -1,
    outfit = dress >= 0.4 ? rint(0, ZOUTFITS.length - 1) : -1,
    odd = Math.random() < 0.25, // (25% are another size or build; every one has the same room on the floor)
    size = odd && Math.random() < 0.5 ? +rnd(-1, 1).toFixed(2) : 0,
    build = odd && !size ? +rnd(-1, 1).toFixed(2) : 0,
    max = hp0(),
    jus = Math.random() < Z_JUSTIN ? 1 : 0,
    v = Math.round(WALK * Z_SLOW * rnd(R[3][0], R[3][1])),
    [sx, sy] = o.from || o.out;
  return {
    i,
    x: sx + rnd(-12, 12) * (o.axis === "x" ? 1 : 0.3),
    y: sy + rnd(-8, 8) * (o.axis === "y" ? 1 : 0.3),
    hp: max,
    st: 0,
    a: -1e6,
    n: 0,
    d: 0,
    dir: 0,
    l: jus
      ? [max, v, o.id, 0, 0, -1, -1, 1]
      : [max, v, o.id, size, build, hat, outfit],
  };
}
function moveZombies(s, zs, now, T, up) {
  const R = roundOf(s.hang.l4.r),
    tk = (s.hidden && s.hidden.l4tk) || now - 200,
    dt = Math.min(0.35, Math.max(0.05, (now - tk) / 1000)),
    brd = { ...(s.hang.brd || {}) },
    pls = up.map((id) => ({ id, p: s.pos[id], xy: at(s.pos[id]) }));
  s.hidden = { ...(s.hidden || {}), l4tk: now };
  const dist = flowFrom(pls.map((q) => openNear(...q.xy)));
  const p4 = { ...s.hang.l4p },
    eating = { ...((s.hidden && s.hidden.l4ze) || {}) };
  let cake = cakeDown(s, now);
  for (const k of Object.keys(eating))
    if (k !== "fx" && eating[k] <= now) delete eating[k];
  for (const z of zs) {
    if (z.st === 3) continue;
    const o = openingById(z.l[2]),
      v = z.l[1] * walkOf(s); // (as much faster or slower as the ducks, by the lobby's Walking speed)
    if (z.st === 0) {
      // coming: to the spot outside its opening
      const [tx, ty] = o.out;
      if (walkTo(z, tx, ty, v * dt)) {
        z.st = brd[o.id] > 0 ? 1 : 4;
        z.d = T;
      }
      continue;
    }
    if (z.st === 1) {
      // tearing the boards down, one at a time
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
        if (Math.hypot(z.x - o.out[0], z.y - o.out[1]) < 30) {
          z.st = 1;
          z.d = T;
        }
      }
      if (walkTo(z, o.in[0], o.in[1], v * dt)) z.st = 2;
      continue;
    }
    /* every zombie in goes for the zebra cake while it lies there (the owner's, Nov 3: it draws them all away from the
       ducks), and each one there bites it again and again, chewing between bites, until the cake is gone by itself */
    if ((eating[z.i] || 0) > now) continue;
    if (cake) {
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
    /* in: along the flow field, or straight at a duck close by; never into a duck */
    let target = null,
      best = Infinity;
    for (const q of pls) {
      const d = room(z.x, z.y, ...q.xy);
      if (d < best) {
        best = d;
        target = q;
      }
    }
    if (!target) continue;
    const c = openNear(z.x, z.y),
      close = best < 2.6 || (c >= 0 && dist[c] <= 1.5);
    const aim = close ? target.xy : heading(dist, z.x, z.y);
    if (aim) stepZombie(z, aim, v * dt, pls);
    /* the claw: at a duck long enough, then again every so often (it keeps walking meanwhile) */
    const d = room(z.x, z.y, ...target.xy);
    if (d < CLAW) {
      if (!z.n) z.n = T || 1;
      if (T - z.n >= R[4] && T - z.a >= R[5]) {
        z.a = T;
        z.dir = Math.round(
          Math.atan2(target.xy[1] - z.y, target.xy[0] - z.x) * 100,
        );
        if (
          !dodging(s, target.p, now) &&
          hurtDuck(s, p4, target.id, now, "claw")
        )
          pls.splice(pls.indexOf(target), 1);
      }
    } else z.n = 0;
  }
  fireTick(s, zs, now, T, p4);
  s.hang.l4p = p4;
  s.hang.brd = brd;
  s.hidden = { ...s.hidden, l4ze: eating };
  separate(zs);
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
/* inside: a few small steps toward aim, sliding along walls, stopping at ducks */
function stepZombie(z, aim, far, pls) {
  const n = Math.max(1, Math.ceil(far / 8));
  for (let k = 0; k < n; k++) {
    const dx = aim[0] - z.x,
      dy = aim[1] - z.y,
      d = Math.hypot(dx, dy);
    if (d < 1) return;
    const sx = (dx / d) * (far / n),
      sy = (dy / d) * (far / n),
      zz = heightAt(z.x, z.y);
    const ok = (x, y) => {
      if (!zOk(x, y, zz)) return false;
      for (const q of pls) {
        const now = room(z.x, z.y, ...q.xy),
          then = room(x, y, ...q.xy);
        if (then < 1 && then < now) return false;
      }
      return true;
    };
    if (ok(z.x + sx, z.y + sy)) {
      z.x += sx;
      z.y += sy;
    } else if (ok(z.x + sx, z.y)) z.x += sx;
    else if (ok(z.x, z.y + sy)) z.y += sy;
    else return;
  }
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
  if (
    z.st === 2 ? zOk(x, y, heightAt(z.x, z.y)) : !playable(x, y) || z.st === 4
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
export const l4Down = (s, id) => {
  const p = P4(s, id);
  return p && p.dn ? p.dn : 0;
};
