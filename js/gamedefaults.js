/* ---------- the game's own numbers, for every mode ----------
   The owner's, Nov 20 18:46Z: "Whenever I say these settings for things like movement and guns, they apply to every
   mode ... unless the game mode specifies otherwise ... there should be, I imagine, a file where all of this applies to
   every game mode by default." So a number he gives for the whole game lives here, and every mode reads it from here;
   a mode that must differ says so where it reads it. No imports, so the rules and the screen can both read it. */

/* sprint (Nov 20 18:46Z: "make it 1.25 times faster ... we can do 5 seconds ... it refills 50% slower, the sprint meter
   does, after you've used it"; 18:27Z: "sprint has to be all the way up before you can use it again") */
export const SPRINT = {
  speed: 1.35, // times walking speed (Nov 21 05:10Z: "Try making it 1.35 times faster instead of 1.25")
  ms: 2500, // ms of sprint from a full bar (Nov 21 15:56Z: "sprint should only last half as long ... it lasts way too long")
  refill: 1.5, // the bar fills this many times as slowly as it drains (2.5 s of sprint: 3.75 s to fill)
};

/* fall damage, ducks only (heights.js fallHurt; the owner's, Nov 28 04:05Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H):
   measured along the fall's path, in elevations. None under `from`; hp at `mid`, then times `up` for each elevation
   more, with no cap; under `mid` it drops off fast, `down` times less for each elevation less (0.25 HP at 1) */
export const FALL = { from: 1, mid: 1.5, hp: 2, up: 2, down: 64 };

/* a blast's rings (blast.js; the owner's, Nov 21 19:07Z: "the center of a grenade's explosion is at ... the
   intersection of the plus of 4 squares of the pixel hitbox ... it's 4 boxes in the center of the hitbox, those have crit
   automatically. The outside boxes ... 25% chance of crit ... We can cut off the corners though, to make it more
   circular"; Nov 22 03:25Z: "One tile, as written"): RING tiles a ring; the center 2x2 and the ring round it do CENTER,
   each ring after half the one inside, until it would do under LEAST; CRIT, the chance of a crit outside the center */
export const BLAST = { RING: 1, CENTER: 9, LEAST: 0.5, CRIT: 0.25 };

/* weight (push.js): a duck 10% bigger walks 10% slower (Nov 21 15:56Z), never slower than this share of its walk
   (Size goes from 50% to 152%, duck.js DUCK_SCALE, so it only holds 151% and 152% back; Adam's pick, Nov 22 03:38Z) */
export const WEIGHT = {
  SLOWEST: 0.5,
  DEAD_FROM: "held", // whose dead weight a duck carries (guns.js DEAD_WEIGHT): "held", what it holds out; "all", its whole kit (B6b: the owner hasn't picked)
  CAR: 15, // a car, in duck weights (carpush.js; a small 80s or 90s car, about 1,000 kg: Adam's OK, Nov 22 03:08Z)
};

/* the one push (push.js): melee, how many times its weapon's knock (guns.js ARMS, world px) a melee hit pushes; blast,
   how far a blast pushes at its edge (world px, half that at its middle); lift, how high it throws at its middle (duck
   sizes). The board's and Hangout's (in duck lengths of 64): the hammer's 40 shoves a duck 3.6 duck lengths (2.4, then
   50% farther: the owner's, Nov 4); a grenade 4.8 at its edge (twice the old 2.4: Nov 3 17:15Z), 0.9 high; Dead Ducks
   Arcade's grenade the same (modes.js push) */
export const KNOCK = { melee: 5.76, blast: 307, lift: 0.9 };

/* water (hangout/layout.js wetK): how fast every walker goes in it, of its walk, by how deep it is there (the owner's, Nov
   22 16:06Z: "if it's really, really shallow, then it doesn't slow down your walking. But it still has all the effects
   and visuals ... it slows you down once it's high up enough. And if it's even more then eventually you have to swim").
   Under FREE deep (world px, about 0.05 of an elevation) not slowed; to DEEP (about 0.15) waded, WADE of the walk (Nov 17
   11:07Z: 30% slower); deeper, swum, SWIM (the Hangout pool too) */
export const WET = { WADE: 0.7, SWIM: 0.55, FREE: 5, DEEP: 16 };

/* zombies (Nov 20 21:17Z: "zombies should have a slightly slower attack speed by, let's say, 0.2 seconds") */
export const ZOMBIE_SWIPE_SLOWER = 200; // ms added to the wait between one swipe and the next, every zombie
/* a round's first ms on the zombie maps: half as many zombies come, and none comes twice as fast off the ducks' screens
   (the owner's, Nov 23 00:32Z: "slow down the spawn rate to about half as much for about a 6 to 10 second grace period
   ... Let's just say 8 seconds") */
export const ZOMBIE_GRACE = 8000;

/* the handgun, one gun everywhere (Nov 20 21:38Z: "one gun named M1911"; 7 rounds, Nov 21 18:16Z): the specials' pistol
   and the zombie modes' handgun both read this */
export const HANDGUN = { name: "M1911", mag: 7 };

/* Justin's pocket change (Nov 21, the owner: "a 1% chance that when a player kills Justin … Justin forgot to deposit his
   pocket change"): the chance a player's kill of Justin drops a gold orb of coins, the points whoever walks over it gets,
   and the line the chat says */
export const POCKET_CHANGE = {
  CHANCE: 0.01,
  POINTS: 5000,
  SAYS: "Justin forgot to deposit his pocket change",
};

/* a made NPC rule's Chance (%) when it has none: every time (brainbuild.js) */
export const BRAIN_RULE = { CHANCE: 100 };

/* the TV's channel before anyone changed it (hangout/tv.js) */
export const TV_FIRST_CHANNEL = 1;

/* the sprint's blurred border (sprintblur.js): a blur of what's behind it costs the graphics card about 40% of a
   crowded frame, whatever its size. So it shows only where the game runs fast enough, its own cost counted: under this
   many frames a second (two 2-second stretches in a row) it stays off until the next round or map */
export const SPRINT_BLUR_MIN_FPS = 40;

/* darker below (B5, the owner's, Nov 21 16:17Z: "as you increase in elevation ... the layers by a certain fraction or
   percent become more dark ... including for other ducks ... that isn't true for jumping"): what's under my floor shows
   PER darker for each elevation (heights.js ELEV) I stand over it, on to all dark (below.js; Nov 22 06:24Z: "The first
   recommended options is good ... but darkness keeps going up beyond 60%") */
export const BELOW = { PER: 0.2, WATER: 20 }; // (WATER: each level of water over a bed counts this many: dpflood.js. 20: the road's whole depth reads about a third darker from its bank, the owner's, Nov 28 04:58Z: "noticeable by pretty fast increments")

/* the director (director.js; the owner approved the plan, Nov 28, cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H):
   a duck is low on ammo under AMMO_LOW of its guns' rounds and low on health under HP_LOW of its most HP; the team does
   well over WELL.hp average health and WELL.ammo average ammo */
export const DIRECTOR = {
  AMMO_LOW: 0.3,
  HP_LOW: 0.4,
  WELL: { hp: 0.7, ammo: 0.5 },
  /* the supply crate (l4ddrules.js crateCome): heard HEAR ms before it lands by the flare; SOLO things for one duck,
     else 1 or 2 for each duck, one ONE of the time; a box HALF world px each way from its middle and TALL high, opened
     from up to REACH from its middle */
  CRATE: { HEAR: 6000, SOLO: 2, ONE: 0.6, HALF: 22, TALL: 34, REACH: 90 },
  /* bandages (l4ddrules.js bandagesCome): 1 bandage ONE of the time, else 2, BY world px each side of the duck */
  BANDAGE: { ONE: 0.5, BY: 70 },
};
