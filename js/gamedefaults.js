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

/* the bow drawn (bowdraw.js): full in FULL ms, +PER_STEP damage each whole STEP ms drawn, crit odds CRIT a second
   (sure at full), the arrow up to FAST faster at full. The owner's, Nov 21 (2.5 s, +0.2 each tenth of a second, so +1
   each half second, 25% a second); the director plan, Nov 28: the right button draws it in half that time, its damage
   building the same way (+0.2 each twentieth, so +1 each quarter second, +5 at full; 50% a second) */
export const DRAW = {
  FULL: 1250,
  STEP: 50,
  PER_STEP: 0.2,
  CRIT: 0.5,
  FAST: 0.4,
};
/* grenades on the maps (weaponuse.js nadeFly; the director plan, Nov 28, cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H):
   held, its pin is out and its fuse runs FUSE ms, my meter white, yellow from YELLOW of it, red from RED; let go, it's
   thrown, and it goes off when its fuse ends: in the hand, in the air or on the ground (so it can be cooked). Thrown,
   it goes its range (guns.js far) in T ms over an arc PEAK duck heights high, from HAND up: over whatever is lower than
   it and through the trees' crowns; what's taller (a wall, a car, a building) turns it back with KEEP of its speed (a
   light thing off a heavy one), and a floor under it stops it. The grenade launcher's: its range (guns.js far, at its
   speed) over an arc LPEAK high, over a crowd, its fuse LFUSE ms from the shot */
export const NADE = {
  FUSE: 5000,
  YELLOW: 0.5,
  RED: 0.8,
  T: 900,
  PEAK: 1.5,
  HAND: 0.45,
  KEEP: 0.5,
  LPEAK: 3,
  LFUSE: 3000,
};

/* fall damage, ducks only (heights.js fallHurt; the owner's, Nov 28 04:05Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H,
   moved up half an elevation 07:39Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtWKA8ofj7AENMi1pBK2yGMN): the drop, in elevations
   (the way across counts only for a duck a hit threw: 07:38Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtLW5YEtHzaRtQz2MurzDnGc).
   None under `from`; hp at `mid`, then times `up` for each elevation more, with no cap; under `mid` it drops off fast,
   `down` times less for each elevation less (0.25 HP at 1.5) */
export const FALL = { from: 1.5, mid: 2, hp: 2, up: 2, down: 64 };

/* my duck speeds up and slows down instead of starting and stopping at once (the owner's, Nov 28 03:28Z, "I APPROVE",
   cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7; playerinput.js easeWalk): up, the seconds from standing to full
   speed (or a turn right round); down, from full speed to standing. Mine, short so it still answers at once */
export const WALK_EASE = { up: 0.15, down: 0.1 };

/* my aim sways as I move, the flashlight, the laser sight, my gun and my shots together (the owner's, Nov 28 03:28Z,
   cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7: "swaying gets worse with sprinting"; game.js myAim, Dead Ducks
   Arcade's): at most `walk` degrees either way walking, `sprint` sprinting, one sway back and forth each `ms`; it grows
   and dies away over `ease` seconds. Mine (the gun's walk sway was 3 degrees) */
export const SWAY = { walk: 2, sprint: 5, ms: 1100, ease: 0.3 };

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
  /* walkers in a rest (l4ddrules.js walkersTick, zombies.js walkerAt; old Survival's): one turns up every EVERY ms, up to
     MOST[0] and MOST[1] more for each duck; that pace RATE[0] to RATE[1] times by how the team does (director.js
     pressure), and with the lights on LIT[0] to LIT[1] times as many as fast (rolled each rest), the horde LIT_HORDE
     times as big. Each walks the slowest zombie's walk times SLOW, wanders up to ROAM world px at a time and stands IDLE
     ms; it comes for a duck NEAR duck lengths away, one whose flashlight's close middle (BEAM: world px, radians) is on it
     SEEN ms, or one that hits it, and forgets one LOSE duck lengths away */
  WALKERS: {
    EVERY: 4000,
    MOST: [4, 3],
    RATE: [0.7, 1.3],
    LIT: [1.5, 2],
    LIT_HORDE: 1.1,
    SLOW: 0.8,
    ROAM: 320,
    IDLE: [1000, 4000],
    NEAR: 3,
    LOSE: 9,
    SEEN: [4000, 6000],
    BEAM: { far: 336, half: (13.5 * Math.PI) / 180 },
  },
};

/* armor (the owner's, Nov 28: cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7 and
   cmsg_01LTpp6fzv8sfYUR5KoHADKtCoUNw94KGwZjNsEiuJRsw8; wounds.js armorHit). A helmet (HATS, FACES) turns every crit into
   "Deflected"; SWAT gear also turns away SWAT of every hit's damage, and takes BOOM of a blast's. Neither stops a
   PIERCE caliber (".50 caliber and desert eagle caliber") or a PIERCE melee ("a heavier melee"). SPAWN: the share of
   zombies in a helmet and in SWAT gear, from round 1, flat ("there's no increase of chance"), fewer only while ducks do
   badly: times 1 - 2 x (ducks doing badly / ducks), director.js */
export const ARMOR = {
  HATS: ["helmet", "fire"],
  FACES: ["moto", "scifi"],
  SWAT: 0.5,
  BOOM: 0.5,
  PIERCE: [".50 BMG", ".50 AE", "hammer", "axe"],
  SPAWN: { helmet: 0.005, swat: 0.005 },
};
/* the special zombies (the owner's, Nov 28: cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7,
   cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H and cmsg_01LTpp6fzv8sfYUR5KoHADKtCoUNw94KGwZjNsEiuJRsw8; zombies.js
   specialTick). Each from round `from`: its chance a round `chance`, `step` more each round up to `most`, times WELL
   while the team does well; a round when the team does badly at its moment, it waits for the next round and its chance
   goes back a step. It comes once a round at most, at AT ms or when MARKS (one picked each round) of the round's
   zombies are dead, whichever is first; never while the other one is alive (then it waits for the next round). hp, and
   speed: a share of a duck's walk (the Giant's "as fast as the players"), or none for a zombie's own */
export const SPECIAL_Z = {
  flyer: {
    from: 5,
    chance: 0.35,
    step: 0.05,
    most: 0.6,
    hp: 5,
    /* its leap and hold (zombies.js flyerStep): it leaps at a duck on its floor up to `leap` duck rooms away, at `fly`
       px/s, up to `up` px over the line, rising the first `peak` of the way (fast, then slowing) and falling the rest
       (slow, then as a falling body); on a duck it rides `ride` px up, bites `dmg` HP every `bite` ms ("every 0.25
       seconds ... for 0.1-0.2 damage") and tugs it `pull.px` px a random way every `pull.ms` ms, `pull.horde` of the
       way toward the zombies ("a tiny bias towards the horde"); thrown off or missing, it waits `rest` ms */
    leap: 6,
    fly: 360,
    up: 70,
    peak: 0.35,
    ride: 18,
    dmg: [0.1, 0.2],
    bite: 250,
    pull: { ms: 500, px: 12, horde: 0.25 },
    rest: 1500,
    /* its meter (the owner's, Nov 28): while it holds a duck, that duck's click (the attack button on a phone) strikes it
       instead of swinging: a red line sweeps the meter one way in `sweep` ms ("moves fast"), a white line flashes at a
       spot that moves every `move` ms and after each strike; how near they are (a share of the meter, under `near`) is
       the damage, up to `most` ("0-3 damage ... the closer the alignment, the more damage"); a strike at most every
       `gap` ms (zombies.js meterDmg, flymeter.js) */
    meter: { most: 3, near: 0.25, sweep: 450, move: 1200, gap: 400 },
  },
  /* the Giant (zombies.js giantStep, giantHit; the owner's 03:28Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7).
     size: its look's size (the stand-in, the biggest a zombie is, till the owner picks 1.52x or 2x). Its hit throws a
     duck `knock` world px (push.js, over the duck's weight; a grenade's edge is 307: "to a ridiculous extent"), `lift`
     duck sizes high, for `ms`; a swing in `grab` is a pick-up and a throw instead, `throw` px and `tlift` high. The
     zombies its swing reaches take a claw and `zknock` px; the ones in its way are shoved aside (crowd.js: it never
     gives way). It climbs `climb` times as fast and steps up `up` px (half an elevation, heights.js ELEV 108). Every
     `toss.every` ms at most it throws a zombie beside it (within `toss.by` duck rooms) at a duck `toss.near` to
     `toss.far` rooms off, flying `toss.fly` px/s, `toss.up` px over the line; landing on the duck it claws it and shoves
     it `toss.knock` px. Next to a car (`car.near` px) with a duck past it (up to `car.far` px on, `car.wide` px off the
     line), it tries, `car.chance` of the times (once each `car.every` ms), to knock the car at it: the car slides
     `car.far` px at `car.speed` px/s and every duck it hits takes a claw and `car.knock` px. The throws' and the car's
     numbers are Adam's and mine; the owner's are 150 HP, "as fast as the players", twice the climb, half an elevation
     and the quarters */
  giant: {
    from: 8,
    chance: 0.2,
    step: 0.05,
    most: 0.5,
    hp: 150,
    speed: 1,
    size: 1,
    knock: 700,
    lift: 1.5,
    ms: 700,
    grab: 0.25,
    throw: 1000,
    tlift: 2.5,
    zknock: 160,
    climb: 2,
    up: 54,
    toss: {
      every: 6000,
      by: 1.5,
      near: 3,
      far: 10,
      fly: 420,
      up: 90,
      knock: 200,
    },
    car: {
      near: 40,
      far: 420,
      wide: 60,
      chance: 0.25,
      every: 3000,
      speed: 900,
      knock: 500,
    },
  },
  WELL: 1.5,
  AT: 30000,
  MARKS: [1 / 3, 1 / 2, 2 / 3],
};
