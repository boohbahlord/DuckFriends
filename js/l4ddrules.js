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
     l4b  { id: { o, at } }: who is boarding up which opening, since when (one more board each BOARD_MS)
     l4f  { id: 1 }: flashlights switched off (key 0; nothing else happens, it's only a choice)
     l4c  [[x, y], …]: the extra candles on the floor, picked as the game starts (world px)
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
} from "./hangout/layout.js";
import { ARM_SPEED, ARM_COOL, ARM_SWING, ARM_RELOAD } from "./armspeed.js";
import { GRENADE_MS, daggerZ, walkOf, FASTER, shareOf, say } from "./rules.js";
import { JUSTIN } from "./hangout/npcart.js";
import { invuln } from "./hangout/death.js";
import { JET } from "./jetpack.js";
import { woundCode, pwHit } from "./wounds.js";
import {
  BOMB,
  bombRoll,
  bombIn,
  flyTo,
  snapLine,
  logIn,
  jaimeCount,
} from "./jaimebomb.js";

export const isL4dd = (s) => !!s && s.options.mode === "l4dd";
/* I want only the lights' stutter on of Hangout's activities. The couches, the stage, the card table and the piano's
   keys are still drawn, but quiet: nothing to sit on, sing into or play at, and nothing else to write in or switch. */
keepOnly("l4dd", [], ["flicker"], ["seats", "stage", "bj", "piano"]);

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
   cone of pellets, 48 shots and no magazine; the medkit puts my HP back to full, once. A headshot (crit, and +5% for each Accuracy) kills at
   once; grenades kill every zombie in their blast. Nothing hurts another duck. The ones I haven't given numbers for
   are guesses (Adam's plan, question 2) */
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
  handgun: {
    kind: "ranged",
    cool: ARM_COOL.handgun,
    dmg: 1,
    crit: 0.05,
    speed: ARM_SPEED.handgun,
    mag: 8,
    all: 72,
    reload: ARM_RELOAD,
  },
  bow: {
    kind: "ranged",
    cool: ARM_COOL.bow,
    dmg: 1,
    crit: 0.05,
    speed: ARM_SPEED.bow,
    all: 150,
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
    all: 48, // (no magazine: the owner's, Nov 4)
    pellets: 5,
    spread: 0.3,
    life: 420,
  },
  medkit: { kind: "special", cool: 600, all: 1 },
  grenade: { kind: "grenade", cool: 900, far: 300, r: 210, start: 2, most: 3 }, // (r: 50% wider than its first 140, owner 2026-11-04)
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
    crit: 0.05,
    speed: 1900,
    mag: 5,
    all: 24,
    reload: 2200,
    pierce: 3, // (zombies a bullet goes through)
    k: "sniper",
  },
  smg: {
    kind: "ranged",
    auto: true,
    cool: 80,
    dmg: 1,
    crit: 0.0175,
    speed: 1100,
    mag: 20,
    all: 160,
    reload: 1400,
    k: "smg",
  },
  ak: {
    kind: "ranged",
    auto: true,
    cool: 110,
    dmg: 2,
    crit: 0.03,
    speed: 1200,
    mag: 30,
    all: 180,
    reload: 1900,
    k: "ak",
  },
  chaingun: {
    kind: "ranged",
    auto: true,
    cool: 67, // (15 a second)
    dmg: 99,
    all: 60,
    far: 3000,
  },
  revolver: {
    kind: "ranged",
    cool: 380,
    dmg: 2,
    crit: 0.04,
    speed: 1150,
    mag: 5,
    all: 75,
    reload: 1700,
    k: "revolver",
  },
  glauncher: { kind: "ranged", cool: 1200, all: 15, speed: 900, far: 760 },
  lmg: {
    kind: "ranged",
    auto: true,
    cool: 100,
    dmg: 1,
    crit: 0.0125,
    speed: 1150,
    mag: 75,
    all: 225,
    reload: 2800,
    k: "lmg",
  },
  /* the new specials: the zebra cake (thrown; every zombie goes for it and bites it until it's gone), the
     fireball (sets the zombie it hits on fire, BURN), the adrenaline shot (my duck walks at the game's usual speed for
     20 s), the long jump (each use turns it on or off: on, every jump is long), Jaime (3 a round: he goes for the
     nearest zombie and stabs it, 1 a stab, until one gets him) */
  zebra: { kind: "special", cool: 600, all: 1, speed: 650, far: 520 },
  fireball: { kind: "special", cool: 600, all: 1, speed: 700 },
  adrenaline: { kind: "special", cool: 600, all: 1, ms: 20000 },
  longjump: { kind: "special", cool: 300 },
  jaime: { kind: "special", cool: 1500, all: 3, round: true },
  jaimebomb: { kind: "special", cool: 1500, all: 3, round: true }, // (as Jaime: 1 spin in 50 at the fireplace, BOMB.fire)
  /* the jetpack (Stage 4): each use switches it on or off, as the long jump; on, Space flies (jetpack.js), and its
     10 s of flight (all, in ms) burn only while its jets are on in the air; a Max Ammo fills it */
  jetpack: { kind: "special", cool: 300, all: JET.FUEL },
  /* Justin's office chair (the owner's, Nov 3): thrown the way I aim, 3 HP to the zombie it hits; 3 throws, a Max Ammo
     gives them back */
  chair: { kind: "special", cool: 900, all: 3, dmg: 3, speed: 600 },
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
/* what the fireplace can give: every weapon with an equal chance, never one already in my slots */
export const POOL = [
  "knife",
  "hammer",
  "handgun",
  "bow",
  "dagger",
  "shotgun",
  "medkit",
  "sniper",
  "smg",
  "ak",
  "chaingun",
  "revolver",
  "glauncher",
  "lmg",
  "zebra",
  "fireball",
  "adrenaline",
  "longjump",
  "jaime",
  "jetpack",
  "chair",
];
/* their names, as players see them */
const NAMES = {
  knife: "Knife",
  hammer: "Hammer",
  handgun: "Pistol",
  bow: "Bow",
  dagger: "Dagger",
  shotgun: "Shotgun",
  medkit: "Medkit",
  grenade: "Grenade",
  sniper: "Sniper",
  smg: "SMG",
  ak: "AK-47",
  chaingun: "Chain gun",
  revolver: "Revolver",
  glauncher: "Grenade launcher",
  lmg: "LMG",
  zebra: "Zebra cake",
  fireball: "Fireball",
  adrenaline: "Adrenaline shot",
  longjump: "Long jump",
  jaime: "Jaime",
  jaimebomb: "Jaime Bomb",
  jetpack: "Jetpack",
  chair: "Chair",
};
export const weaponName = (w) => NAMES[w] || w;
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
  { id: "acc", name: "Accuracy", what: "+5% headshots", most: 5 },
  { id: "as", name: "Attack speed", what: "Cooldowns 10% faster", most: 5 },
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
  return ammoCost(w, ammoLeft(full) - ammoLeft(kit.am[w]));
}
export const priceOf = (id, n) =>
  Math.round(
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
const UP_TIMES = 2; // (every upgrade twice its old price, for now: the owner's, Nov 3; then 20% more, SHOP_MORE)
/* the price I pay now: a Sale (a drop) halves what I buy for the rest of the round, each of the Butler's upgrades only
   once (the owner's: "increased health or accuracy is only half off for that item once"), the fireplace every time */
export const saleOn = (s) =>
  !!(
    s &&
    s.hang &&
    s.hang.l4sale &&
    s.hang.l4 &&
    s.hang.l4.r === s.hang.l4sale.r
  );
export const priceFor = (s, id, what, n) => {
  const full = what === "box" ? BOX.price : priceOf(what, n);
  if (!saleOn(s)) return full;
  const used = (s.hang.l4sale.used || {})[id] || {};
  return what !== "box" && used[what] ? full : Math.ceil(full / 2);
};
/* where Justin's Butler stands: beside his stool at the card table (anyone walks through him; nothing hurts him), and
   the fireplace's front, where E spins it */
export const BUTLER = { x: BJ.bx + 84, y: BJ.by - 18 };
export const BOX = { x: 2300, y: 742, price: 750, spin: 4200, keep: 10000 }; // (750 a spin: the owner's, Nov 3)
const SHOP_REACH = 130;
const SHOT_LIFE = 2000;
/* a zombie's room on the floor, as the ducks' (world.js crowd): an ellipse 56 across and 25.6 deep; every zombie the
   same, whatever its size. Its claw reaches a little past touching */
const RX = 56,
  RY = 25.6,
  CLAW = 1.35;
const hp0 = () => {
  const r = Math.random();
  return r < 0.05 ? 4 : r < 0.25 ? 3 : 2;
}; // (the owner's: 2 HP, 20% 3, 5% 4)
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
/* 1 zombie in 400 is Justin (the owner's, Nov 4: 0.25%): his glasses and jeans, as a zombie */
const Z_JUSTIN = 0.0025;
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
  if (walk) return walk;
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
function flowFrom(starts) {
  cells();
  const dist = new Float64Array(GW * GH).fill(Infinity), // (64-bit: a 32-bit copy can be a hair under the heap's number, and its cell was never looked past)
    heap = [];
  const push = (d, c) => {
    heap.push([d, c]);
    let k = heap.length - 1;
    while (k) {
      const p = (k - 1) >> 1;
      if (heap[p][0] <= heap[k][0]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0],
      last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1,
          r = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top;
  };
  for (const c of starts)
    if (c >= 0) {
      dist[c] = 0;
      push(0, c);
    }
  while (heap.length) {
    const [d, c] = pop();
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
function freshKit() {
  const am = {};
  for (const w of START) if (fullAmmo(w)) am[w] = fullAmmo(w);
  return { sl: [...START], am, rl: 0, rw: "", g: ARMS.grenade.start, u: {} };
}
export const kitOf = (s, id) => ((s && s.hang && s.hang.l4a) || {})[id] || null;
export const slotsOf = (s, id) => (kitOf(s, id) || {}).sl || START;
/* is w one of this duck's weapons? (what it can hold out and use; the grenades are always there) */
export const l4Holds = (s, id, w) =>
  !!w && kindOf(w) !== "grenade" && slotsOf(s, id).includes(w);
export const ptsOf = (s, id) => ((s && s.hang && s.hang.l4pt) || {})[id] ?? 0;
export const upOf = (s, id) => ((s && s.hang && s.hang.l4u) || {})[id] || {};
export const maxHp = (s, id) => L4.HP + (upOf(s, id).hp || 0);
/* a weapon's wait between uses (each Attack speed: 10% shorter), a reload's time (Faster reload: 30% shorter), the
   headshot chance (each Accuracy: 5% more, on every attack) */
export const l4Cool = (s, id, w) =>
  ARMS[w] ? ARMS[w].cool * Math.pow(0.9, upOf(s, id).as || 0) : 400;
const reloadOf = (s, id, w) =>
  (ARMS[w].reload || 1500) * (upOf(s, id).rl ? 0.7 : 1);
const headOf = (s, id, w) =>
  kindOf(w) === "grenade"
    ? 0
    : ((ARMS[w] && ARMS[w].crit) || 0) + 0.05 * (upOf(s, id).acc || 0);
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
  };
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
      [id]: isR16(s) && s.hang.l4 && s.hang.l4.r >= R16 ? R16_PTS : PTS.START,
    }; // (Round 16 Start: a duck joining later gets its points too)
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
/* a few extra candles on bare spots of the floor (the owner's): 6 inside, 1 on the deck, far from each other, from the
   openings and from where everyone starts */
/* bare floor: flat, nothing standing on it or right beside it, not by an opening or the fireplace, and far enough from
   the spots in out (a candle's, a drop's) */
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
function candleSpots() {
  const out = [];
  const pick = (n, x0, y0, x1, y1) => {
    for (let k = 0, got = 0; k < 400 && got < n; k++) {
      const x = Math.round(rnd(x0, x1)),
        y = Math.round(rnd(y0, y1));
      if (bare(x, y, out, 420)) {
        out.push([x, y]);
        got++;
      }
    }
  };
  pick(6, CABIN.x0 + 90, CABIN.y0 + 90, CABIN.x1 - 90, CABIN.y1 - 70);
  pick(1, DECK.x0 + 120, DECK.y0 + 70, DECK.x1 - 120, DECK.y1 - 70);
  return out;
}
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
   it for everyone. Instant Kill, Double Points and Speed Boost last 30 s (Speed Boost: the owner's;
   the other two: Adam's plan's guess, question 5), Sale the rest of the round. */
export const DROPS = ["kill", "ammo", "nuke", "speed", "double", "sale"];
export const DROP = {
  CHANCE: 0.25,
  IN: 30000, // ms: the first drop, somewhere in the round's first 30 s
  AGAIN: 0.25, // and a second one
  GAP: 30000, // 30 s after the first
  AMMO: 0.05, // the Max Ammo of its own
  AMMO_IN: 60000, // in the round's first minute
  LIFE: 60000, // ms a drop lies there (it stays through a round's end)
  FOR: 60000, // ms Instant Kill, Double Points and Speed Boost last (a minute each, into the next round: the owner's, Nov 4)
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
/* which drop: each as likely as the others, Max Ammo AMMO_W times as likely */
function pickDrop() {
  const w = (k) => (k === "ammo" ? DROP.AMMO_W : 1);
  let r = Math.random() * DROPS.reduce((a, k) => a + w(k), 0);
  for (const k of DROPS) if ((r -= w(k)) < 0) return k;
  return DROPS[DROPS.length - 1];
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
/* a bare spot for a drop, inside or on the deck, away from the candles and the other drops */
function dropSpot(s) {
  const out = [
    ...(s.hang.l4c || []),
    ...(s.hang.l4dr || []).map((d) => [d.x, d.y]),
  ];
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
    L.due = [...(L.due || []), k0 || pickDrop()]; // (it waits for the next kill)
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
  if (Object.values(on).some((u) => u <= now))
    s.hang.l4on = Object.fromEntries(
      Object.entries(on).filter(([, u]) => u > now),
    ); // (what wore off)
}
/* the Nuke: each zombie it kills has a 5% chance of +250 more (the owner's, Nov 4) */
const NUKE_CRIT = 0.05;
/* what a drop does, for every duck */
function takeDrop(s, k, by, zs, now, ids) {
  addFx(s, { kind: "l4drop", k, by, who: [], t: now });
  if (k === "kill" || k === "double")
    s.hang.l4on = { ...(s.hang.l4on || {}), [k]: now + DROP.FOR };
  else if (k === "speed") {
    s.hang.l4on = { ...(s.hang.l4on || {}), speed: now + DROP.FOR };
    const ad = { ...(s.hang.l4ad || {}) };
    for (const id of ids) ad[id] = Math.max(ad[id] || 0, now + DROP.FOR);
    s.hang.l4ad = ad; // (the adrenaline shot's speed, for everyone)
  } else if (k === "sale") s.hang.l4sale = { r: s.hang.l4.r, used: {} };
  else if (k === "ammo") maxAmmo(s);
  else if (k === "nuke") {
    const T = now - s.hang.l4.t0;
    let hp = 0,
      crits = 0;
    for (const z of zs)
      if (z.st !== 3) {
        hp += z.hp;
        z.hp = 0;
        die(z, T);
        if (Math.random() < NUKE_CRIT) crits++;
      }
    const each =
      (hp * PTS.HIT + crits * PTS.NUKE_CRIT) *
      ((s.hang.l4on || {}).double ? 2 : 1);
    for (const id of ids) addPts(s, id, each); // (every duck gets the points for all of it: the owner's, Nov 4)
  }
}
/* Max Ammo: every weapon that refills is full again, the grenades too (3); the medkit and Jaime don't come back this
   way (the medkit never refills, Jaime comes back each round) */
function maxAmmo(s) {
  const am = { ...(s.hang.l4a || {}) };
  for (const id of Object.keys(am)) {
    const m = { ...am[id], am: { ...am[id].am }, g: ARMS.grenade.most };
    for (const w of m.sl || [])
      if (fullAmmo(w) && w !== "medkit" && !ARMS[w].round)
        m.am[w] = fullAmmo(w);
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
  s.hang.l4dr = [];
  s.hang.l4on = {};
  s.hang.l4sale = null;
  s.hang.l4b = {};
  s.hang.l4f = {};
  s.hang.power = 0; // (the power is cut: the lamps are dark; the fires and the candles burn)
  s.hang.l4c = candleSpots();
  s.hang.l4k = [];
  s.shots = [];
  players(s).forEach((id, k) => bringBack(s, id, now, k, true));
  newRound(s, 0, now, 0);
  s.hang.l4 = { ...s.hang.l4, n: 0, dq: [], wait: { r: 1, v: {} } }; // (round 0: no zombies until enough ducks are ready)
}
/* between rounds (and round 0, before the first): the next round waits until enough ducks press End turn (Ready in
   round 0), the room's share (2 of 3 by default); with Round 16 Start on, round 0 goes on to round 16, everyone with
   R16_PTS points (the owner's, Nov 3) */
export const R16 = 16,
  R16_PTS = 3000,
  GO_MS = 3000; // ms of "Round N" after the vote, before its zombies come
export const isR16 = (s) => !!(s && s.options && +s.options.l4r16);
export const waitNeed = (s) =>
  Math.max(1, Math.ceil(players(s).length * shareOf(s) - 1e-9));
export const waitVotes = (s) => {
  const w = s.hang && s.hang.l4 && s.hang.l4.wait;
  return w ? players(s).filter((id) => w.v[id]).length : 0;
};
function waitTick(s, now) {
  const L = s.hang.l4,
    w = L.wait;
  if (!w || waitVotes(s) < waitNeed(s)) return false;
  let r = w.r;
  if (r === 1 && L.r === 0 && isR16(s)) {
    r = R16;
    const pt = {};
    for (const id of players(s)) pt[id] = R16_PTS;
    s.hang.l4pt = { ...(s.hang.l4pt || {}), ...pt };
  }
  newRound(s, r, now, GO_MS);
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
  return false;
}
/* Justin's Butler: an upgrade, from beside him, while I have the points (and haven't bought it as often as it goes) */
function buy(s, id, what, mx, my, hand, now) {
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
        w:
          Math.random() < HELPER.chance && !s.players[HELPER.id]
            ? HELPER.w
            : Math.random() < BOMB.fire && !kit.sl.includes("jaimebomb")
              ? "jaimebomb" // (1 spin in 50: the Jaime Bomb, and it's unlocked for good once taken)
              : pool[Math.floor(Math.random() * pool.length)],
      },
    };
    return true;
  }
  if (b.by !== id || now < b.t + BOX.spin || b.w === HELPER.w) return false; // (Justin isn't taken: he climbs out)
  if (!give(s, id, b.w, a.hand)) return false;
  if (b.w === "jaimebomb") jaimeCount(s, { got: id }); // (unlocks.js)
  dropBox(s, id);
  addFx(s, { kind: "l4take", by: id, who: [], w: b.w, t: now });
  return true;
}
/* the fireplace's Justin (the owner's, Nov 4): 1 spin in 100 lands on him (never while he's already here), and a
   moment later he climbs out of the fire and joins as another player, to help. He starts with 1,500 points of his own,
   all his HP, the knife, the chain gun and the pistol; every rule is the same for him as for any duck (l4ddbots.js
   plays him). He goes when the game does: Play again, or back to the lobby */
export const HELPER = {
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
    for (const k of ["l4p", "l4a", "l4b", "l4f", "l4pt", "l4u", "l4box"])
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
    am = { ...kit.am };
  delete am[old];
  if (fullAmmo(w)) am[w] = fullAmmo(w);
  const sl = [...kit.sl];
  sl[k] = w;
  s.hang.l4a = {
    ...s.hang.l4a,
    [id]: {
      ...kit,
      sl,
      am,
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
        am: { ...kit.am, [w]: fullAmmo(w) },
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
  m.rl = now + reloadOf(s, id, w);
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
  if (kind === "grenade") m.g--;
  else if (c) {
    m.am[what] = [c[0] - 1, c[1]];
    if (c[0] - 1 <= 0) startReload(s, id, m, what, now); // (empty: it reloads by itself)
  }
  if (kind === "melee") {
    s.hang.l4k = [
      ...(s.hang.l4k || []).filter(
        (k) => now - k.t < (ARMS[k.w] || A).swing && k.by !== id,
      ),
      { by: id, w: what, dx, dy, t: now, hit: [] },
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
      s.shots = [
        ...(s.shots || []),
        shot(
          k,
          dx,
          dy,
          v,
          what === "glauncher" ? { life: (A.far / A.speed) * 1000 } : {},
        ),
      ];
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
/* the chain gun: it hits at once, along the aim to the first zombie or wall (it kills that zombie); every screen draws
   the thin yellow line (the l4line fx) */
function trace(s, id, px, py, dx, dy, hz, now) {
  const A = ARMS.chaingun,
    zs = zombies(s),
    T = now - s.hang.l4.t0;
  let x = px,
    y = py,
    hit = null;
  for (let d = 0; d < A.far; d += 12) {
    const nx = x + dx * 12,
      ny = y + dy * 12;
    if (walled(nx, ny, hz)) break;
    x = nx;
    y = ny;
    hit = zs.find(
      (z) => z.st !== 3 && Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1,
    );
    if (hit) break;
  }
  if (hit) {
    strike(s, hit, A.dmg, false, id, "chaingun");
    die(hit, T);
    store(s, zs, true);
  }
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
     teleports in and eats it there for as long as it lasts; the zombies leave that one be) */
  const lx = px + dx * A.speed * t,
    ly = py + dy * A.speed * t,
    bowl =
      inBath(lx, ly) && Math.hypot(lx - TOILET.x, ly - TOILET.y) <= TOILET.near;
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
function light(s, z, by, now) {
  mark(s, z, "f0"); // (burnt for good, even once the fire is out)
  const F = s.hang.l4fire || {};
  s.hang.l4fire = {
    ...F,
    z: { ...(F.z || {}), [z.i]: [now + BURN.Z, now + BURN.EVERY, by] },
  };
}
function fireTick(s, zs, now, T, p4) {
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
      else fz[k] = [f[0], f[1] + BURN.EVERY, f[2]];
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
  const hp = invuln(s) ? p.hp : p.hp - 1; // (Invulnerability: it only flashes)
  if (w && !invuln(s)) pwHit(s, id, w, now, hp <= 0);
  if (hp > 0) {
    p4[id] = { ...p, hp, at: now };
    return false;
  }
  p4[id] = { hp: 0, at: now, dn: now + L4.BLEED };
  const u = upOf(s, id);
  if (u.hp) s.hang.l4u = { ...s.hang.l4u, [id]: { ...u, hp: 0 } }; // (down: the max HP bought is gone)
  if (s.players[id]) s.players[id].dead = true;
  s.hang.still = { ...(s.hang.still || {}), [id]: now + L4.BLEED + 60000 };
  const b = { ...(s.hang.l4b || {}) };
  delete b[id];
  s.hang.l4b = b;
  return true;
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
    if (!p || !standing(s, k.by)) continue;
    const [px, py] = at(p),
      bx = px + k.dx * A.at,
      by = py + k.dy * A.at;
    for (const z of zs) {
      if (z.st === 3 || k.hit.includes(z.i)) continue;
      if (Math.hypot(z.x - bx, (z.y - by) * 1.4) > A.r + 22) continue;
      k.hit.push(z.i);
      if (strike(s, z, A.dmg, headshot(s, k.by, k.w, z, now), k.by, k.w))
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
const inOpening = (x, y) =>
  OPENINGS.some((o) =>
    o.axis === "x"
      ? Math.abs(x - o.x) < o.half && Math.abs(y - o.y) < OPEN_PAD + 40
      : Math.abs(y - o.y) < o.half && Math.abs(x - o.x) < OPEN_PAD + 40,
  );
const walled = (x, y, z) =>
  (!playable(x, y) && !inOpening(x, y)) ||
  (!inOpening(x, y) && solidsAt(x, y, z + 20).some((b) => b.top > z + 20));
export function l4Shots(s, now) {
  const list = s.shots || [];
  if (!list.length || !s.hang || !s.hang.l4) return false;
  const L = s.hang.l4,
    T = now - L.t0,
    zs = zombies(s),
    keep = [];
  let hitAny = false;
  for (const sh0 of list) {
    const sh = { ...sh0 },
      age = now - sh.t;
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
          zs.some(
            (z) => z.st !== 3 && Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1,
          )
        )
          at = [x, y];
      }
      if (!at && age >= sh.life) at = [x1, y1];
      if (at) {
        hitAny = boom(s, sh, at[0], at[1], zs, T, now) || hitAny;
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
      if (A.pierce) {
        /* the sniper's: through the zombies it meets, each once, until the third (the owner's, Nov 3), or the wall */
        for (const z of zs)
          if (near(z) && !(sh.hit || []).includes(z.i)) {
            sh.hit = [...(sh.hit || []), z.i];
            if (strike(s, z, dmgOf(A), headshot(s, sh.by, w, z, now), sh.by, w))
              die(z, T);
            hitAny = true;
            if (sh.hit.length >= A.pierce) break;
          }
        if ((sh.hit || []).length >= A.pierce) gone = true;
        continue;
      }
      const z = zs.find(near);
      if (z) {
        if (w === "fireball") {
          if (strike(s, z, 1, false, sh.by)) die(z, T);
          else light(s, z, sh.by, now); // (the first of its burn as it's lit)
        } else if (
          strike(s, z, dmgOf(A), headshot(s, sh.by, w, z, now), sh.by, w)
        )
          die(z, T);
        hitAny = true;
        gone = true;
      }
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

/* a grenade (thrown or launched) goes off at (bx, by): every zombie in its blast dies; true when it got any */
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
      const rv = p.rv,
        by = rv && s.pos[rv.by];
      if (
        rv &&
        (!by ||
          !standing(s, rv.by) ||
          Math.hypot(...minus(at(by), at(s.pos[id]))) > L4.REACH * 1.8)
      )
        p = { ...p, rv: null };
      else if (rv && now - rv.at >= L4.REVIVE) {
        p = { hp: L4.BACK_HP, at: now };
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
      } else if (!rv && now >= p.dn) {
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
    }
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
  /* nobody standing: the game is over */
  const up = ids.filter((id) => standing(s, id));
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
        L2.acc += Math.pow(1.5, extra);
        const k = Math.min(
          Math.floor(L2.acc),
          5 + 3 * extra,
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
  dropTick(s, L2, zs, now, T, ids);
  const ad = s.hang.l4ad;
  if (ad && Object.values(ad).some((u) => u <= now))
    s.hang.l4ad = Object.fromEntries(
      Object.entries(ad).filter(([, u]) => u > now),
    ); // (the adrenaline shots that wore off)
  /* the dead go */
  const left = zs.filter((z) => !(z.st === 3 && T - z.d > L4.DEAD_MS));
  /* every zombie of the round came and died: the next round, and the ghosts come back */
  if (L2.made >= L2.n && !left.length && T >= 0) {
    s.hang.l4 = { ...L2, wait: { r: L2.r + 1, v: {} } }; // (the next round waits for End turn)
    store(s, [], false);
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
   cell, kept for the heartbeat */
let ways = new Map(),
  waysAt = 0;
export function wayTo(x, y, tx, ty, now) {
  if (now - waysAt > 150) {
    ways = new Map();
    waysAt = now;
  }
  const c = openNear(tx, ty);
  if (c < 0) return null;
  if (!ways.has(c)) ways.set(c, flowFrom([c]));
  return heading(ways.get(c), x, y);
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
