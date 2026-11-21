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

/* zombies (Nov 20 21:17Z: "zombies should have a slightly slower attack speed by, let's say, 0.2 seconds") */
export const ZOMBIE_SWIPE_SLOWER = 200; // ms added to the wait between one swipe and the next, every zombie

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

/* Mad God Justin's HP before his HP is known: more than he ever has, so no gore shows (game.js mgjGore) */
export const MGJ_HP_UNKNOWN = 999;

/* the TV's channel before anyone changed it (hangout/tv.js) */
export const TV_FIRST_CHANNEL = 1;

/* the sprint's blurred border (sprintblur.js): a blur of what's behind it costs the graphics card about 40% of a
   crowded frame, whatever its size. So it shows only where the game runs fast enough, its own cost counted: under this
   many frames a second (two 2-second stretches in a row) it stays off until the next round or map */
export const SPRINT_BLUR_MIN_FPS = 40;
