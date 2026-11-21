/* ---------- every weapon's numbers: one sheet for every mode ----------
   Dead Ducks Arcade's are the base (ARMS: each weapon's kind, damage, speed, ammo and the rest; its name as players see
   it; its kind). A mode that does a weapon its own way gives only the numbers that differ (Type Object: GUN_BREEDS);
   the rules ask through their own functions (rules.js coolFor and magSize, mgjrules.js mgjCool and mgjMag). Drawings:
   gunart.js */
import { HANDGUN } from "./gamedefaults.js";
import { ARM_SPEED, ARM_COOL, ARM_SWING, ARM_RELOAD } from "./armspeed.js";
import { FLAME } from "./flamer.js";
import { JET } from "./jetpack.js";
/* the weapons here, each of one kind (its slot): melee, ranged, special or the grenades. Melee swings twice as fast as
   anywhere else and hurts only mid-swing, in a bubble just past it (at: how far, r: how big); the pistol: 72 bullets in
   all, 8 a magazine; the bow: arrows that never run out (the owner's, Nov 18), one every 0.4 s; the dagger is thrown and falls to the floor; the shotgun a
   cone of pellets, 48 shots and no magazine; the medkit puts my HP back to full, once. A headshot (a crit: critOf, headOf) kills at
   once; grenades kill every zombie in their blast. Nothing hurts another duck. The ones I haven't given numbers for
   are guesses (Adam's plan, question 2) */
/* what anything thrown or used up waits before it can be used again (the grenades, the medkit, the zebra cake, the
   adrenaline shot, the chair): 0.75 s (the owner's, Nov 16). Not the jetpack (switched on
   and off) */
const ITEM_COOL = 750;
/* a melee weapon breaks (the owner's, Nov 19 22:41Z): its bar is 100% of the damage it can deal, HP actually taken off
   (not overkill), 450 for each, the cast iron pan only 50 ("cast irons is only 50 damage"). At 0% it is gone for good
   and its slot is empty; it is never refilled. An Angelic melee weapon never breaks. One number for each weapon: ARMS'
   dur */
const MELEE_DUR = 450;
export const ARMS = {
  knife: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.knife,
    dmg: 1,
    swing: ARM_SWING.knife,
    at: 58,
    r: 34,
  }, // (four a second, as in every mode)
  hammer: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.hammer,
    dmg: [4, 6], // (3 to 5, then 1 more because it is so slow: the owner's, Nov 18 15:28Z and Nov 20 21:17Z)
    swing: ARM_SWING.hammer,
    at: 66,
    r: 50,
  },
  /* the owner's new melees (Nov 16): the fire axe 1 to 4, as wide as the hammer and 25% faster; the short sword 50%
     faster than the knife, not as far out; the cast iron pan as far out as the sword and as slow as the axe, missing
     half its swings, and half its hits a headshot (crit) */
  axe: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.axe,
    dmg: [1, 4],
    swing: ARM_SWING.axe,
    at: 66,
    r: 50,
  },
  sword: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.sword,
    dmg: [1, 2], // (1 to 2: the owner's, Nov 18 15:25Z)
    swing: ARM_SWING.sword,
    at: 54,
    r: 40,
  },
  pan: {
    kind: "melee",
    dur: 50,
    cool: ARM_COOL.pan,
    dmg: 5, // (5: the owner's, Nov 18 15:28Z, "The pan has 5 damage"; 2 to 6 at 15:25Z)
    crit: 0.5,
    miss: 0.5,
    swing: ARM_SWING.pan,
    at: 54,
    r: 40,
  },
  handgun: {
    kind: "ranged",
    cool: ARM_COOL.handgun,
    dmg: [1, 3], // (1 to 3: the owner's, Nov 18 15:19Z)
    speed: ARM_SPEED.handgun,
    mag: HANDGUN.mag, // (the one M1911, 9 rounds: gamedefaults.js)
    all: (72 + 5 * 8) * 1.5,
    reload: ARM_RELOAD,
  },
  bow: {
    kind: "ranged",
    cool: ARM_COOL.bow,
    dmg: [1, 3], // (1 to 3: the owner's, Nov 18 15:19Z)
    speed: ARM_SPEED.bow,
  }, // (no `all`: its arrows never run out, as the Laser Rifle's shots: the owner's, Nov 18 15:18Z "Make the bow have unlimited ammo")
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
    dmg: [1, 3], // (each pellet: the owner's, Nov 18 15:23Z "It should be 1-3 damage per pellet")
    speed: ARM_SPEED.shotgun,
    all: 72, // (no magazine: the owner's, Nov 4; 48, and 50% more: the owner's, Nov 16)
    pellets: 5,
    spread: 0.3,
    life: 420,
  },
  medkit: { kind: "special", cool: ITEM_COOL, all: 1 },
  defib: { kind: "special", cool: ITEM_COOL, all: 1 }, // (Survival's defibrillator: DEFIB)
  grenade: {
    kind: "grenade",
    cool: ITEM_COOL,
    far: 300,
    r: 210,
    start: 4, // (players start with 4: the owner's, Nov 19 19:27Z)
    most: 4,
  }, // (r: 50% wider than its first 140, owner 2026-11-04)
  /* the owner's new ones (Stage 3). The sniper's bullet goes through every zombie to the wall, 2 or 3 to each, a bolt
     action between shots; the SMG, the AK-47 and the LMG fire as long as the button is down; the chain gun (15 a second) hits at once
     (a thin yellow line out to what it hit), never reloads and takes 4 to 5 (it killed what it hit until the owner's
     Nov 18 16:43Z numbers); the revolver has five in its
     cylinder; the grenade launcher's grenades fly straight and go off on the first zombie, a wall or their range, and
     kill every zombie in their blast. Where the owner gave no number (the speeds, the reloads, the sniper's headshot)
     they are guesses: k is how the bullet looks */
  sniper: {
    kind: "ranged",
    cool: 750,
    dmg: [4, 5], // (4 to 5, and 1 less to each zombie it goes through after the first: the owner's, Nov 18 16:43Z)
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
    dmg: [1, 2], // (1 to 2: the owner's, Nov 18 16:43Z)
    speed: 1100,
    mag: 25, // (the owner's, Nov 19 19:27Z: "MP5 should have 25 bullets")
    all: 20 * 17, // (13 magazines, 160 and 5 more: the owner's, Nov 16; then 25% more, rounded up: the owner's, Nov 18 16:43Z)
    reload: 1400,
    k: "smg",
  },
  /* the Tommy gun and the UMP-45 (the owner's, Nov 17; from the weapon spin and Mad God Justin's pickups, not the Butler):
     the Tommy a round every 120 ms from a 50-round drum; the UMP-45 seven rounds a second, 2 damage a bullet, 25 rounds
     (the owner's, Nov 18 16:43Z), a 1.4 s reload. Both crit 5% and miss 2.5% (slow: they hit as the single-shot guns do) */
  tommy: {
    kind: "ranged",
    auto: true,
    slow: true,
    cool: 120,
    dmg: [1, 3], // (1 to 3: the owner's, Nov 18 16:43Z)
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
    cool: 143, // (7 a second: the owner's, Nov 18 16:43Z)
    dmg: 2,
    speed: 1100,
    mag: 25, // (the owner's, Nov 18 16:43Z)
    all: 25 * 6,
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
    dmg: [4, 5], // (4 to 5, no longer a kill: the owner's, Nov 18 16:43Z)
    all: 300, // (300 rounds: the owner's, Nov 16, 16:06Z)
    far: 3000,
  },
  revolver: {
    kind: "ranged",
    cool: 333, // (3 a second: the owner's, Nov 18 16:43Z)
    dmg: [2, 4], // (2 to 4: the owner's, Nov 18 16:43Z)
    speed: 1150,
    mag: 8, // (50% more: 7.5 up; the owner's, Nov 19 19:27Z)
    all: (75 + 5 * 5) * 1.5,
    reload: 1700,
    k: "revolver",
  },
  glauncher: { kind: "ranged", cool: 1200, all: 12, speed: 900, far: 760 }, // (all: 15, and 50% more with no magazine: the owner's, Nov 16; half as many: Nov 19 19:27Z)
  lmg: {
    kind: "ranged",
    auto: true,
    cool: 100,
    dmg: 2, // (the owner's, Nov 18 16:43Z)
    speed: 1150,
    mag: 100, // (the owner's, Nov 17: 100 bullets and twice the reload time)
    all: 225 + 3 * 75, // (3 more magazines: the owner's, Nov 16)
    reload: 5600,
    k: "lmg",
  },
  /* the owner's three new guns (Nov 16 16:25Z). The double barrel: every shot one slug that takes all the HP of the
     zombie it hits, blows chunks through it and throws its body back a long way (FLING); a crit's slug blows the head
     off and goes on to the next zombie, past it only on that one's own crit (Nov 18 13:46Z). Two shells, then a reload of a second for each
     shell it loads (shell); 150 shells in all. The flamethrower: its tank (flamer.js), everything in its cone catches
     fire. The burst rifle (an AUG): three rounds a press (burst, gap ms apart), 21 a clip, the AK-47's damage. Where the
     owner gave no number (the crits, the speeds, the burst rifle's ammo and reload) they are guesses */
  /* the double barrel is two now, in a bag of their own inside the shotguns' bag (the owner's, Nov 19 19:27Z: "the double
     barrel shotgun within its bag of shotguns will have its own bag for a variant"). The slug double barrel: 6 to the
     first one it hits, then through it and on, each next one taking 1 or 1.5 less than the one before (a new roll each
     time), until it would do nothing ("it will continuously pass through its targets until it cannot do any possible
     more damage"). The buckshot double barrel: the shotgun's pellets, each 1 or 1.5 harder ("plus 1 to 1.5 damage"),
     with the slug's two shells and reload */
  dbarrel: {
    kind: "ranged",
    cool: 280,
    dmg: 6,
    less: [1, 1.5],
    speed: 1500,
    mag: 2,
    all: 150, // (the owner's, Nov 18 13:46Z: "there should be 150 rounds in the double barrel shotgun")
    shell: 1000, // (ms a shell: one shell loads in 1 s, two in 2 s)
    k: "slug",
  },
  dbuck: {
    kind: "ranged",
    cool: 280,
    dmg: [1, 3], // (the shotgun's, each pellet)
    plus: [1, 1.5],
    speed: ARM_SPEED.shotgun,
    mag: 2,
    all: 150, // (my guess: the slug's)
    shell: 1000,
    pellets: 5,
    spread: 0.3,
    life: 420,
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
     adrenaline shot (my duck walks at the game's usual speed for
     20 s) */
  zebra: { kind: "special", cool: ITEM_COOL, all: 1, speed: 650, far: 520 },
  adrenaline: { kind: "special", cool: ITEM_COOL, all: 1, ms: 20000 },
  /* the jetpack (Stage 4): each use switches it on or off, as the long jump; on, Space flies (jetpack.js), and its
     10 s of flight (all, in ms) burn only while its jets are on in the air; a Max Ammo fills it */
  jetpack: { kind: "special", cool: 300, all: JET.FUEL },
  /* Justin's office chair (the owner's, Nov 3): thrown the way I aim, 3 to 5 HP to the zombie it hits and it shoves it
     back like the hammer; no ammo unless a Sandbox sets one */
  safekeep: { kind: "special", cool: 300, all: 1 }, // (Safe Keeping: never used by hand, SAFE below)
  chair: { kind: "special", cool: ITEM_COOL, dmg: [3, 5], speed: 600 }, // (no ammo, thrown as often as you like; 3 to 5 whole: the owner's, Nov 20 21:17Z)
};

/* a weapon's kind (its slot): melee, ranged, special or grenade; "" for none */
export const kindOf = (w) => (ARMS[w] && ARMS[w].kind) || "";
/* their names, as players see them */
export const GUN_NAMES = {
  knife: "Knife",
  hammer: "Hammer",
  axe: "Fire axe",
  sword: "Short sword",
  pan: "Cast iron pan",
  handgun: HANDGUN.name,
  bow: "Bow",
  dagger: "Dagger",
  shotgun: "Shotgun",
  medkit: "Medkit",
  defib: "Defibrillator",
  safekeep: "Safe Keeping",
  grenade: "Grenade",
  sniper: "Barrett .50 Cal", // (the owner's, Nov 18 12:19Z: named after its look)
  smg: "MP5",
  tommy: "Tommy gun",
  ump: "UMP-45",
  ak: "AK-47",
  chaingun: "Chain gun",
  revolver: "Revolver",
  glauncher: "Grenade launcher",
  lmg: "M249 SAW",
  dbarrel: "Slug double barrel",
  dbuck: "Buckshot double barrel",
  flamer: "Flamethrower",
  burst: "Steyr AUG",
  laser: "Laser Rifle",
  zebra: "Zebra cake",
  adrenaline: "Adrenaline shot",
  jetpack: "Jetpack",
  chair: "Chair",
};
/* ---------- the modes' lists ----------
   Dead Ducks Arcade's are the base; the board's specials and Mad God Justin's pickups are their own lists */
/* every weapon there is (the Items page lists them all: l4ddcatalog.js) */
export const WEAPONS = [
  "knife",
  "axe",
  "sword",
  "hammer",
  "pan",
  "dagger",
  "bow",
  "handgun",
  "revolver",
  "shotgun",
  "dbarrel",
  "dbuck",
  "smg",
  "tommy",
  "ump",
  "ak",
  "burst",
  "sniper",
  "glauncher",
  "lmg",
  "chaingun",
  "flamer",
  "laser",
];
const ITEMS = ["medkit", "zebra", "adrenaline", "safekeep", "chair"]; // (no Jetpack any more: the owner's, Nov 18 12:19Z, "long jump is removed from zombies bag and slots", "normal jaime is removed from all zombie modes", "remove jet pack from the whole game")
export const POOL = [...WEAPONS, ...ITEMS];
/* the guns that fire while the button is down, in every mode: ARMS' auto (the Laser Rifle only as a Mad God Justin
   pickup) */
export const AUTO = Object.keys(ARMS).filter((w) => ARMS[w].auto);
/* every gun from Quacky Zombies is a special too (the owner's, Nov 4 07:43Z), working as it does there: the sniper's
   bullet, the SMG's, the AK-47's, the revolver's and the LMG's fly as theirs do (every bullet goes through every duck it
   passes, as the handgun's does), the SMG, the AK-47, the LMG and the chain gun fire as long as the button is down, the
   chain gun's shot hits at once and takes all the HP of the first duck on its line, and the grenade launcher's grenade
   flies straight and goes off on the first duck or at its range, as a grenade does */
export const BOARD_GUNS = [
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
];
export const BOARD_WEAPONS = [
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
  ...BOARD_GUNS,
  "laser", // (not a special: only Mad God Justin's pickup, mgjrules.js)
]; // aimed (with the mouse), and kept out with Shift and their key
/* thrown the way the mouse aims, but never kept out: the Chair special (the silly commands' switch covers it, as the
   weapons) and the Zebra cake */
export const THROWS = ["chair", "zebra"];
/* Mad God Justin: what the ducks hold (rules.js' move: w) */
export const MGJ_MELEE = "sword"; // (the owner's, Nov 17: the ducks start with the short sword, not the knife)
/* a gun picked up works as it does in Quacky Zombies (its magazine, R to reload, full auto, the shotgun's spread, the
   sniper's bullet going through) and stays on key 4 until its shots are gone (MGJ_GUNS); the medkit puts my HP back to
   full, or gets a downed duck up at once when I hold it out over it */
export const MGJ_GUNS = [
  "chaingun",
  "glauncher",
  "lmg",
  "tommy",
  "ump",
  "smg",
  "ak",
  "burst",
  "shotgun",
  "dbarrel",
]; // (no sniper, Laser Rifle or flamethrower here: the owner's, Nov 18 12:19Z and 12:32Z)
/* the modes' own numbers, where a weapon works its own way there */
export const GUN_BREEDS = {
  /* the board's specials (the normal games): how long one waits before its key works again (ms; the key shows a bar
     draining meanwhile), and the magazines the board gives guns with none in Quacky Zombies, [shots, reload ms] (the
     chain gun 300 rounds: the owner's, Nov 16; the double barrel's two shells and the flamethrower's tank, Nov 16
     16:25Z) */
  board: {
    cool: {
      handgun: ARM_COOL.handgun,
      dagger: ARM_COOL.dagger,
      knife: ARM_COOL.knife, // (four stabs a second, in every mode: the owner's, Nov 3)
      hammer: ARM_COOL.hammer,
      axe: ARM_COOL.axe,
      sword: ARM_COOL.sword,
      pan: ARM_COOL.pan,
      shotgun: ARM_COOL.shotgun,
      grenade: 12000,
      confetti: 15000,
      bow: ARM_COOL.bow,
      chair: 15000,
      zebra: 30000, // (as Mad God Justin's CAKE_EVERY)
    },
    mag: {
      chaingun: [300, 4000],
      glauncher: [3, 4000],
      dbarrel: [2, 2 * ARMS.dbarrel.shell],
      flamer: [FLAME.TANK, FLAME.RELOAD],
    },
    names: { dbarrel: "Double barrel" }, // (the board has only the one: Dead Ducks Arcade's slug double barrel)
  },
  /* the NPCs that fire guns: how far each gun is fired from, in duck lengths (REACH if not named). The two rows don't
     agree yet: the owner decides whether they become one */
  gunman: {
    /* how each gun is fired: rounds a burst, ms from one burst to the next (their hidden cooldowns; a gun not named: one
       round, 1.2 to 1.8 s), and the magazine a gun with none gets (the shotgun 6 shells, any other 6) */
    burst: {
      handgun: { n: 1, gap: [1400, 2200] },
      revolver: { n: 1, gap: [1600, 2400] },
      smg: { n: 3, gap: [2200, 3200] },
      tommy: { n: 3, gap: [2200, 3200] },
      ump: { n: 3, gap: [2200, 3200] },
      shotgun: { n: 1, gap: [2000, 2800] },
      dbuck: { n: 1, gap: [1800, 2600] },
      ak: { n: 4, gap: [1600, 2400] },
      burst: { n: 3, gap: [1400, 2000] },
      lmg: { n: 12, gap: [1200, 1800] }, // (long bursts: suppressive fire)
    },
    mag: { shotgun: 6 },
    magAll: 6,
    reach: {
      shotgun: 3.5,
      dbuck: 3.5,
      revolver: 8,
      ak: 11, // (assault rifles reach as far as the LMG; the sniper's SNIPE reaches farther still. The owner's, Nov 20 18:23Z:
      burst: 11, // "Any assault rifle should be able to have the range of the LMG, and the sniper even more so")
      lmg: 11,
    },
  },
  sbnpc: {
    reach: {
      sniper: 14, // (across the map; the shotguns only close)
      bow: 9,
      revolver: 8,
      shotgun: 3.5,
      dbarrel: 3.5,
      dbuck: 3.5,
    },
  },
  /* Mad God Justin: the knife, the sword and the pistol as fast as in every mode (the knife four a second, the pistol
     five), a gun picked up Quacky Zombies' own; every gun picked up has to reload here (the owner's, Nov 16), so the ones
     with no magazine in Quacky Zombies get one: the shotgun 6 shells, the grenade launcher 3 (as in the other modes) and
     the chain gun a belt of 100 of its 300 (my guesses). The pistol's never runs out */
  mgj: {
    cool: {
      sword: ARM_COOL.sword,
      knife: ARM_COOL.knife,
      handgun: ARM_COOL.handgun,
    },
    mag: {
      shotgun: [6, 2600],
      glauncher: [3, 4000],
      chaingun: [100, 4000],
    },
  },
};
/* a weapon's name in a mode (the specials picker and the unlocks say the board's): Dead Ducks Arcade's unless the
   mode names it its own way */
export const nameOf = (w, breed) =>
  ((GUN_BREEDS[breed] || {}).names || {})[w] || GUN_NAMES[w] || w;
/* how far an NPC of that breed fires gun w from, in duck lengths */
const REACH = 7;
export const reachOf = (w, breed) => GUN_BREEDS[breed].reach[w] || REACH;
