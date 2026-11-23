/* ---------- every weapon's numbers: one sheet for every mode ----------
   Dead Ducks Arcade's are the base (ARMS: each weapon's kind, damage, speed, ammo and the rest; its name as players see
   it; its kind). A mode that does a weapon its own way gives only the numbers that differ (Type Object: GUN_BREEDS);
   the rules ask through their own functions (rules.js coolFor, mgjrules.js mgjCool; every gun's ammo: ammo.js). Drawings:
   gunart.js */
import { HANDGUN } from "./gamedefaults.js";
import { ARM_SPEED, ARM_COOL, ARM_SWING, ARM_RELOAD } from "./armspeed.js";
import { FLAME } from "./flamer.js";
import { draws, drawCrit } from "./bowdraw.js";
/* the weapons here, each of one kind (its slot): melee, ranged, special or the grenades. Melee swings twice as fast as
   anywhere else and hurts only mid-swing, in a bubble just past it (at: how far, r: how big); the pistol: 72 bullets in
   all, 8 a magazine; the bow: arrows that never run out (the owner's, Nov 18), one every 0.4 s; the dagger is thrown and falls to the floor; the shotgun a
   cone of pellets, 48 shots and no magazine; the medkit puts my HP back to full, once. A crit (critOf, headOf) doubles the
   damage, and blows the head off only when it kills; grenades kill every zombie in their blast. Nothing hurts another duck. The ones I haven't given numbers for
   are guesses (Adam's plan, question 2) */
/* what anything thrown or used up waits before it can be used again (the grenades, the medkit, the zebra cake, the
   adrenaline shot, the chair): 0.75 s (the owner's, Nov 16) */
const ITEM_COOL = 750;
/* a melee weapon breaks (the owner's, Nov 19 22:41Z): its bar is 100% of the damage it can deal, HP actually taken off
   (not overkill), 450 for each, the cast iron pan only 50 ("cast irons is only 50 damage"). At 0% it is gone for good
   and its slot is empty; it is never refilled. An Angelic melee weapon never breaks. One number for each weapon: ARMS'
   dur */
const MELEE_DUR = 150; // (a third of 450: the owner's, Nov 23 00:32Z, "make it only a third as much durability on a melee weapon ... just make every melee just have less durability"; the hotbar's percent was right, it went down slowly)
/* every pistol carries 20 magazines (the owner's, Nov 21 18:16Z) */
const PISTOL_MAGS = 20;
/* a hit's damage from a weapon's `dmg` range: one of its numbers a `step` apart (1 unless the weapon says: a gun's 0.05,
   the dagger's 0.5), every one as likely as the next. A gun with rolls (the Barrett's) first rolls which range it hits
   in, each as often as its weight. Kept to hundredths, so 0.05 steps never come out as 2.2499999 */
const rollDmg = (A) => {
  const [lo, hi] = A.rolls ? pickRoll(A.rolls) : A.dmg,
    st = A.step || 1;
  return (
    Math.round(
      (lo + st * Math.floor(Math.random() * (Math.round((hi - lo) / st) + 1))) *
        100,
    ) / 100
  );
};
/* a hit's damage by weapon, in every mode (the owner's, Nov 22 20:51Z: the guns' caliber mechanics are universal, "Fix
   the code!"): its range rolled (rollDmg), its one number, or 1 when it has none */
export const armDmg = (A) =>
  A && Array.isArray(A.dmg) ? rollDmg(A) : (A && +A.dmg) || 1;
const pickRoll = (rolls) => {
  let r = Math.random() * rolls.reduce((n, [w]) => n + w, 0);
  for (const [w, range] of rolls) if ((r -= w) < 0) return range;
  return rolls[rolls.length - 1][1];
};
/* ---------- calibers (the owner's, Nov 21 17:25Z, 17:48Z and 18:05Z) ----------
   "a guns damage is based off of its caliber", plus its barrel: guns of one caliber hit the same and differ in their fire
   rate and magazine. Each gun in ARMS names its caliber (cal) and barrel; its damage (dmg, in steps of DMG_STEP) is
   made from these two below, so no other place holds a copy. A shotgun's barrel goes on each pellet. The .50 BMG rolls
   1 to 5 first: on a 1 it does 1 to 20, on a 2 3.5 to 10, on 3 to 5 3.5 to 7 (its rolls, each with its weight) */
const CALIBERS = {
  ".45 ACP": [0.75, 2.25],
  ".357 Magnum": [0.95, 2.45],
  ".44 Magnum": [1.45, 2.95], // (the Smith & Wesson Model 29's, once it's drawn: the owner's, Nov 21 18:16Z)
  ".50 AE": [1.75, 3.25], // (the Desert Eagle's, once it's drawn)
  "9mm": [0.5, 1.75],
  "5.56mm": [1, 2.5],
  "7.62x39mm": [1.1, 2.6], // (Adam's pick, 18:05Z: 0.1 over 5.56mm, 0.15 under 7.62x51mm)
  "7.62x51mm": [1.25, 2.75],
  ".50 BMG": [3.5, 7],
  "12 ga buckshot": [0.5, 2],
  "12 ga slug": [3, 7],
  arrow: [0.25, 1.5],
};
const CAL_ROLLS = {
  ".50 BMG": [
    [1, [1, 20]],
    [1, [3.5, 10]],
    [3, [3.5, 7]],
  ],
};
const BARRELS = { short: 0, medium: 0.15, long: 0.25, none: 0 };
const DMG_STEP = 0.05;
/* a reload with a full magazine (the owner's, Nov 21 18:16Z: "if you have full ammo in a mag and you reload it again,
   you get that extra one bullet on top of it ... the reload ... only half as long ... only 3/4 as long for the LMG";
   "real revolvers and double barrel can't hold an extra round, so they should be left out. Anything that doesn't work
   like that should be left out"): one more round, in the chamber, in CHAMBER.MS of its reload (the LMG's CHAMBER.LMG).
   The Tommy gun fires from an open bolt, so it holds no round in its chamber either. loadTo(w, n, cap): what a reload
   of gun w with n rounds in a magazine of cap fills it to and how much of its time it takes, [rounds, share], or null
   when it can't reload */
const CHAMBER = { MS: 0.5, LMG: 0.75, NONE: ["revolver", "dbarrel", "tommy"] };
export const loadTo = (w, n, cap) =>
  n < cap
    ? [cap, 1]
    : n === cap && ARMS[w] && ARMS[w].mag && !CHAMBER.NONE.includes(w)
      ? [cap + 1, w === "lmg" ? CHAMBER.LMG : CHAMBER.MS]
      : null;
/* ---------- recoil: one score a gun (K14 + K18) ----------
   The owner's, Nov 21 18:24Z: "we got to think about its kinetic force, how big it is ... we need to make it to where
   everything adds to a smaller output"; 18:27Z: "convergent different pools from different math and different stats
   onto its final end ... each one of its sources are going to be a fraction or ratio more or less in effect"; 18:59Z:
   "maybe a gun's dead weight is what is used in reference for recoil". The score, 0 to 1 (the table the owner OKed,
   Nov 22 13:02Z: /mnt/project-files/solomon/k14-recoil-scores.md), is 70% the round's push (PUSH, kg m/s) squared
   against the gun's dead weight, on a log scale from LO to HI; 20% its fire rate out of RATE_TOP shots a second; 10%
   its barrel (short kicks most). heat.js turns it into the widest cone; a weapon with no caliber here (the blade, the
   bow, the grenades, the flamethrower, the laser) has none */
const PUSH = {
  "9mm": 2.9,
  ".45 ACP": 3.9,
  ".357 Magnum": 4.4,
  ".44 Magnum": 7,
  ".50 AE": 8.7,
  "5.56mm": 3.7,
  "7.62x39mm": 5.7,
  "7.62x51mm": 8,
  "12 ga buckshot": 13.6,
  "12 ga slug": 13.4,
  ".50 BMG": 37.8,
  "40mm": 13, // (about a 12 gauge, the way an M79's kick is told)
};
const RECOIL = {
  KICK: 0.7,
  RATE: 0.2,
  BARREL: 0.1,
  LO: 80,
  HI: 10000,
  RATE_TOP: 15,
  BARRELS: { short: 1, medium: 0.5, long: 0 },
};
const unit = (x) => Math.max(0, Math.min(1, x));
export const recoilOf = (w) => {
  const A = ARMS[w] || {},
    { cal, barrel } = A.recoil || A,
    p = PUSH[cal],
    dw = DEAD_WEIGHT[A.dw];
  if (!p || !dw) return 0;
  const kick = unit(
      Math.log((p * p) / dw / RECOIL.LO) / Math.log(RECOIL.HI / RECOIL.LO),
    ),
    score =
      RECOIL.KICK * kick +
      RECOIL.RATE * Math.min(1, fireRate(w) / RECOIL.RATE_TOP) +
      RECOIL.BARREL * (RECOIL.BARRELS[barrel] || 0);
  return Math.round(score * 100) / 100;
};
/* the score as a word on the item sheets: none, small under .3, medium to .45, heavy to .65, a lot above */
export const recoilWord = (r) =>
  !(r > 0)
    ? "none"
    : r < 0.3
      ? "small"
      : r < 0.45
        ? "medium"
        : r <= 0.65
          ? "heavy"
          : "a lot";
/* what a gun is loaded with and how long its barrel is, for the item sheets ("" when it has none) */
export const caliberOf = (w) => {
  const c = (ARMS[w] || {}).cal;
  return c && c in PUSH ? c : "";
};
export const barrelOf = (w) => {
  const b = (ARMS[w] || {}).barrel;
  return b && b !== "none" ? b : "";
};
export const ARMS = {
  knife: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.knife,
    dmg: 1,
    swing: ARM_SWING.knife,
    at: 58,
    r: 34,
    knock: 16, // (how far a hit pushes a living zombie back, world px: weaponuse.js knockOf)
  }, // (four a second, as in every mode)
  hammer: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.hammer,
    dmg: [4, 6], // (3 to 5, then 1 more because it is so slow: the owner's, Nov 18 15:28Z and Nov 20 21:17Z)
    swing: ARM_SWING.hammer,
    at: 66,
    r: 50,
    knock: 40, // (the most)
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
    knock: 20, // (half the hammer's 40: the owner's, Nov 23 00:32Z)
  },
  sword: {
    kind: "melee",
    dur: MELEE_DUR,
    cool: ARM_COOL.sword,
    dmg: [1, 2], // (1 to 2: the owner's, Nov 18 15:25Z)
    swing: ARM_SWING.sword,
    at: 54,
    r: 40,
    knock: 16,
  },
  pan: {
    kind: "melee",
    dur: 17, // (a third of its 50, Nov 23)
    cool: ARM_COOL.pan,
    dmg: 5, // (5: the owner's, Nov 18 15:28Z, "The pan has 5 damage"; 2 to 6 at 15:25Z)
    crit: 0.5,
    miss: 0.5,
    swing: ARM_SWING.pan,
    at: 54,
    r: 40,
    knock: 16,
  },
  handgun: {
    kind: "ranged",
    cool: ARM_COOL.handgun,
    cal: ".45 ACP",
    barrel: "short",
    speed: ARM_SPEED.handgun,
    mag: HANDGUN.mag, // (the one M1911, 7 rounds: gamedefaults.js)
    all: HANDGUN.mag * PISTOL_MAGS,
    reload: ARM_RELOAD,
  },
  bow: {
    kind: "ranged",
    cool: ARM_COOL.bow,
    cal: "arrow",
    barrel: "none",
    speed: ARM_SPEED.bow,
  }, // (no `all`: its arrows never run out, as the Laser Rifle's shots: the owner's, Nov 18 15:18Z "Make the bow have unlimited ammo")
  dagger: {
    kind: "ranged",
    cool: ARM_COOL.dagger,
    dmg: [0.5, 5], // (0.5 to 5, in halves: 0.5, 1, 1.5 ... 5; the owner's, Nov 21: "daggers ammo is 300 AND they do 0.5-5 damage")
    step: 0.5,
    speed: ARM_SPEED.dagger,
    all: 300,
  },
  shotgun: {
    kind: "ranged",
    cool: ARM_COOL.shotgun,
    cal: "12 ga buckshot",
    barrel: "long",
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
    far: 300, // (its blast: blast.js rings)
    start: 4, // (players start with 4: the owner's, Nov 19 19:27Z)
    most: 4,
  }, // (r: 50% wider than its first 140, owner 2026-11-04)
  /* the owner's new ones (Stage 3). The sniper's bullet goes through every zombie to the wall, 2 or 3 to each, a bolt
     action between shots; the SMG, the AK-47 and the LMG fire as long as the button is down; the revolver has five in its
     cylinder; the grenade launcher's grenades fly straight and go off on the first zombie, a wall or their range, and
     kill every zombie in their blast. Where the owner gave no number (the speeds, the reloads, the sniper's headshot)
     they are guesses: k is how the bullet looks */
  sniper: {
    kind: "ranged",
    cool: 750,
    cal: ".50 BMG",
    barrel: "long",
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
    cal: "9mm",
    barrel: "medium",
    speed: 1100,
    mag: 25, // (the owner's, Nov 19 19:27Z: "MP5 should have 25 bullets")
    all: 20 * 17, // (13 magazines, 160 and 5 more: the owner's, Nov 16; then 25% more, rounded up: the owner's, Nov 18 16:43Z)
    reload: 1400,
    k: "smg",
  },
  /* the Tommy gun and the UMP-45 (the owner's, Nov 17; from the weapon spin and Mad God Justin's pickups, not the Butler):
     the Tommy a round every 120 ms from a 50-round drum; the UMP-45 seven rounds a second, 2 damage a bullet, 25 rounds
     (the owner's, Nov 18 16:43Z), a 1.4 s reload. Both miss 2.5% (slow: they hit as the single-shot guns do) */
  tommy: {
    kind: "ranged",
    auto: true,
    slow: true,
    cool: 120,
    cal: ".45 ACP",
    barrel: "medium",
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
    cal: ".45 ACP",
    barrel: "medium",
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
    cal: "7.62x39mm",
    barrel: "long",
    speed: 1200,
    mag: 30,
    all: 180 + 5 * 30, // (5 more magazines: the owner's, Nov 16)
    reload: 1900,
    k: "ak",
  },
  revolver: {
    kind: "ranged",
    cool: 333, // (3 a second: the owner's, Nov 18 16:43Z)
    cal: ".357 Magnum",
    barrel: "short",
    speed: 1150,
    mag: 6, // (the owner's, Nov 21 18:16Z)
    all: (75 + 5 * 5) * 1.5,
    reload: 1700,
    k: "revolver",
  },
  glauncher: {
    kind: "ranged",
    cool: 1200,
    all: 16,
    speed: 900,
    far: 760,
    recoil: { cal: "40mm", barrel: "long" }, // (its shell has no damage by caliber: only its recoil reads these)
  }, // (16: the owner's, Nov 21 17:25Z)
  lmg: {
    kind: "ranged",
    auto: true,
    cool: 100,
    cal: "5.56mm",
    barrel: "long",
    speed: 1150,
    mag: 100, // (the owner's, Nov 17: 100 bullets and twice the reload time)
    all: 225 + 3 * 75, // (3 more magazines: the owner's, Nov 16)
    reload: 5600,
    k: "lmg",
  },
  /* the owner's three new guns (Nov 16 16:25Z). The double barrel: every shot one slug, through the zombies in its way
     (below); one it kills blows to chunks. Two shells, then a reload of a second for each shell it loads (shell); 150
     shells in all. Its crit counts its reload (critReload: the only one, the owner's, Nov 21 18:05Z). The flamethrower: its tank (flamer.js), everything in its cone catches
     fire. The burst rifle (an AUG): three rounds a press (burst, gap ms apart), 21 a clip, the AK-47's damage. Where the
     owner gave no number (the crits, the speeds, the burst rifle's ammo and reload) they are guesses */
  /* the slug double barrel: its caliber's roll to the first one it hits, then through it and on (halve, least,
     through below). The buckshot one is gone (the owner's, Nov 21 17:25Z) */
  dbarrel: {
    kind: "ranged",
    cool: 280,
    cal: "12 ga slug",
    barrel: "long",
    /* through each zombie its slug does half of what it did to the one before, and it stops once that would be under
       least, or after through (the owner's, Nov 23 00:32Z: "every time it passes through an enemy, it only does half as
       much damage"; "stop passing through enemies, let's say after 3") */
    halve: 0.5,
    least: 0.5,
    through: 3,
    speed: 1500,
    mag: 2,
    all: 150, // (the owner's, Nov 18 13:46Z: "there should be 150 rounds in the double barrel shotgun")
    shell: 1000, // (ms a shell: one shell loads in 1 s, two in 2 s)
    critReload: true,
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
    cal: "5.56mm",
    barrel: "long",
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
  /* Justin's office chair (the owner's, Nov 3): thrown the way I aim, 3 to 5 HP to the zombie it hits and it shoves it
     back like the hammer; no ammo unless a Sandbox sets one */
  safekeep: { kind: "special", cool: 300, all: 1 }, // (Safe Keeping: never used by hand, SAFE below)
  chair: { kind: "special", cool: ITEM_COOL, dmg: [3, 5], speed: 600 }, // (no ammo, thrown as often as you like; 3 to 5 whole: the owner's, Nov 20 21:17Z)
};
/* each gun's damage: its caliber's range plus its barrel, in steps of DMG_STEP (CALIBERS) */
const cents = (n) => Math.round(n * 100) / 100;
for (const A of Object.values(ARMS))
  if (A.cal) {
    const b = BARRELS[A.barrel] || 0;
    A.dmg = CALIBERS[A.cal].map((n) => cents(n + b));
    A.step = DMG_STEP;
    if (CAL_ROLLS[A.cal])
      A.rolls = CAL_ROLLS[A.cal].map(([w, r]) => [
        w,
        r.map((n) => cents(n + b)),
      ]);
  }
/* dead weight (the owner's, Nov 21 16:53Z: "We can give guns different weight stats ... dead weight ... when it adds to
   your weight, it does not add to your knockback"): each weapon's group (ARMS dw) and what it weighs, in duck weights
   (the groups: 18:59Z, /mnt/project-files/adam/calibers.md). push.js weightOf adds it to its carrier's; recoilOf reads
   it too */
export const DEAD_WEIGHT = {
  light: 0.02,
  medium: 0.05,
  rifle: 0.1,
  heavy: 0.15,
  superheavy: 0.25,
};
const DW_GROUPS = {
  light: ["handgun", "revolver", "knife", "dagger", "sword", "pan", "bow"],
  medium: ["smg", "tommy", "ump", "axe"],
  rifle: ["ak", "burst", "shotgun", "dbarrel", "glauncher"],
  heavy: ["lmg", "sniper", "hammer", "flamer"],
}; // (superheavy has no weapon since the chain gun went: the owner's, Nov 22 19:26Z, "REMOVE CHAIN GUN")
for (const [g, ws] of Object.entries(DW_GROUPS))
  for (const w of ws) ARMS[w].dw = g;
/* ---------- crits (the owner's, Nov 21 17:25Z and 18:05Z) ----------
   "base crit chance is 25% with a fire rate of 1 per second", less for faster ones: 25% divided by the shots (a melee
   weapon's swings) a second, with no top. Only the double barrel counts its reload (critReload: 2 shells, then 2 s,
   about 0.78 a second). The cast iron pan keeps its own (crit: half its hits). A crit doubles the damage; it blows the
   head off only when it kills (the rules: l4ddrules.js strike, rules.js wounded, wounds.js WOUND_BREEDS). The
   grenades, the grenade launcher, the flamethrower and the Laser Rifle never crit. The bow's is its draw's (dr: how
   many ms its arrow was drawn, bowdraw.js drawCrit), the one bow rule for every hit. Upgrades and Angelic: l4ddrules.js
   headOf */
const CRIT_AT_ONE = 0.25;
const NO_CRIT = ["grenade", "glauncher", "flamer", "laser"];
/* a gun's shots a second at its top rate (a burst's rounds each count; heat.js reads it too) */
export const fireRate = (w) => {
  const A = ARMS[w];
  return A && A.cool ? ((A.burst || 1) * 1000) / A.cool : 0;
};
const perSecond = (A) =>
  A.critReload
    ? (A.mag * 1000) / (A.mag * A.cool + A.mag * A.shell)
    : ((A.burst || 1) * 1000) / A.cool;
/* a weapon's shots (a melee weapon's swings) a second, as its crits count them (Angelic reads it too: l4ddangel.js) */
export const shotsOf = (w) =>
  ARMS[w] && ARMS[w].cool ? perSecond(ARMS[w]) : 0;
export const critOf = (w, dr = 0) => {
  if (draws(w)) return drawCrit(dr);
  const A = ARMS[w];
  if (!A || NO_CRIT.includes(w) || (A.kind !== "melee" && A.kind !== "ranged"))
    return 0;
  return A.crit ?? CRIT_AT_ONE / perSecond(A);
};
/* the weapon a board shot's kind belongs to (rules.js shots: an arrow is the bow's, a pellet the shotgun's) */
const SHOT_ARM = {
  arrow: "bow",
  pellet: "shotgun",
  slug: "dbarrel",
  lgren: "glauncher",
};
export const armOfShot = (k) => SHOT_ARM[k] || k;
/* the melee weapon a duck starts with in Dead Ducks Arcade and Survival starts at a quarter of its wear (the owner's, Nov
   21 18:05Z: "it's of its health because it has limited amount of uses before it breaks") */
export const START_WEAR = 0.25;

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
  shotgun: "Pump action shotgun", // (the owner's, Nov 21 17:25Z)
  medkit: "Medkit",
  defib: "Defibrillator",
  safekeep: "Safe Keeping",
  grenade: "Grenade",
  sniper: "Barrett .50 Cal", // (the owner's, Nov 18 12:19Z: named after its look)
  smg: "MP5",
  tommy: "Tommy gun",
  ump: "UMP-45",
  ak: "AK-47",
  revolver: "Revolver",
  glauncher: "Grenade launcher",
  lmg: "M249 SAW",
  dbarrel: "Slug double barrel",
  flamer: "Flamethrower",
  burst: "Steyr AUG",
  laser: "Laser Rifle",
  zebra: "Zebra cake",
  adrenaline: "Adrenaline shot",
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
  "smg",
  "tommy",
  "ump",
  "ak",
  "burst",
  "sniper",
  "glauncher",
  "lmg",
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
   passes, as the handgun's does), the SMG, the AK-47 and the LMG fire as long as the button is down, and the grenade launcher's grenade
   flies straight and goes off on the first duck or at its range, as a grenade does */
export const BOARD_GUNS = [
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
     draining meanwhile). Their ammo is Dead Ducks Arcade's (ammo.js) */
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
      ak: { n: 4, gap: [1600, 2400] },
      burst: { n: 3, gap: [1400, 2000] },
      lmg: { n: 12, gap: [1200, 1800] }, // (long bursts: suppressive fire)
    },
    mag: { shotgun: 6 },
    magAll: 6,
    reach: {
      shotgun: 3.5,
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
    },
  },
  /* Mad God Justin: the knife, the sword and the pistol as fast as in every mode (the knife four a second, the pistol
     five), a gun picked up Quacky Zombies' own, its ammo too (ammo.js) */
  mgj: {
    cool: {
      sword: ARM_COOL.sword,
      knife: ARM_COOL.knife,
      handgun: ARM_COOL.handgun,
    },
  },
};
/* a weapon's name in a mode (the specials picker and the unlocks say the board's): Dead Ducks Arcade's unless the
   mode names it its own way */
export const nameOf = (w, breed) =>
  ((GUN_BREEDS[breed] || {}).names || {})[w] || GUN_NAMES[w] || w;
/* what's in my hand, in very small text, in every mode: its name and its caliber (K4, the owner's, Nov 21 17:25Z: "It
   should say what the item is when you switch to it by name ... And it should also say what caliber it uses"; Nov 22
   20:51Z: the guns' mechanics are the same in every mode). name: the mode's own word for it (Dead Ducks Arcade's) */
export const heldTag = (w, name = nameOf(w)) =>
  !w
    ? ""
    : w === "fl"
      ? "Flashlight"
      : name + (caliberOf(w) ? ` (${caliberOf(w)})` : "");
/* how far an NPC of that breed fires gun w from, in duck lengths */
const REACH = 7;
export const reachOf = (w, breed) => GUN_BREEDS[breed].reach[w] || REACH;
