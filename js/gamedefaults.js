/* ---------- the game's own numbers, for every mode ----------
   The owner's, Nov 20 18:46Z: "Whenever I say these settings for things like movement and guns, they apply to every
   mode ... unless the game mode specifies otherwise ... there should be, I imagine, a file where all of this applies to
   every game mode by default." So a number he gives for the whole game lives here, and every mode reads it from here;
   a mode that must differ says so where it reads it. No imports, so the rules and the screen can both read it. */

/* sprint (Nov 20 18:46Z: "make it 1.25 times faster ... we can do 5 seconds ... it refills 50% slower, the sprint meter
   does, after you've used it"; 18:27Z: "sprint has to be all the way up before you can use it again") */
export const SPRINT = {
  speed: 1.35, // times walking speed (Nov 21 05:10Z: "Try making it 1.35 times faster instead of 1.25")
  ms: 5000, // ms of sprint from a full bar
  refill: 1.5, // the bar fills this many times as slowly as it drains (5 s of sprint: 7.5 s to fill)
};

/* zombies (Nov 20 21:17Z: "zombies should have a slightly slower attack speed by, let's say, 0.2 seconds") */
export const ZOMBIE_SWIPE_SLOWER = 200; // ms added to the wait between one swipe and the next, every zombie

/* the handgun, one gun everywhere (Nov 20 21:38Z: "one gun named M1911 with a 9-round magazine"): the specials' pistol
   and the zombie modes' handgun both read this */
export const HANDGUN = { name: "M1911", mag: 9 };

/* Justin's pocket change (Nov 21, the owner: "a 1% chance that when a player kills Justin … Justin forgot to deposit his
   pocket change"): the chance a player's kill of Justin drops a gold orb of coins, the points whoever walks over it gets,
   and the line the chat says */
export const POCKET_CHANGE = {
  CHANCE: 0.01,
  POINTS: 5000,
  SAYS: "Justin forgot to deposit his pocket change",
};

/* what a missing number means, in one place (the lint's rule: a `?? 5` in game rules hides a number nobody can find).
   Each name says whose number it is; the code says `?? WHEN_MISSING.CHIPS`. The values are what the code always did. */
export const WHEN_MISSING = {
  EXIT_OK: 0, // (the command line: a command that gave no exit code ...)
  EXIT_FAIL: 1, // (... or an error that gave none)
  EXIT_USAGE: 2, // (... or a usage error that gave none)
  BOT_WAIT: 5, // (seconds the computers wait to act, when the host never set it: bots.js)
  BRAIN_CHANCE: 100, // (a made NPC rule's Chance (%), when it has none: brainbuild.js)
  NO_COLUMN: -1, // (a duck on no column of the answer board, and a card with no color)
  MGJ_HP: 999, // (Mad God Justin's HP before his HP is known: game.js)
  CHIPS: 0, // (a duck with no chips at the blackjack or poker table)
  GHOST_BUSY: 1, // (the ghosts' "busy" setting when never set: hangout/ghosts.js)
  Z: 0, // (the height of something with none: on the ground)
  DIST: 0, // (the distance of a context item that has none)
  CHANNEL: 1, // (the TV's channel before anyone changed it)
  SPEED: 1, // (a speed multiplier nobody set: full speed)
  L4_BOARD: 5, // (a zombie board with no HP number: l4dd.js)
  POINTS: 0, // (a duck with no points)
  RANGED_SLOT: 1, // (the first ranged slot: l4ddrules.js)
  ITEM_SLOT: 3, // (no item slot free or in hand: the item slot's number, the 4 key)
  SPRINT_FULL: 1, // (a full sprint bar)
  COL_MID: 0.5, // (the middle of the board, for a column that isn't on it)
  WRITE_CATCH: 30, // (Lawyering's seconds to write a catch, when never set)
  SFX: 100, // (the sound effects' volume %, when never set)
  GAIN: 1, // (a sound's loudness multiplier nobody set)
  HEAD_LINES: 10, // (head and tail: how many lines)
  FOLD_WIDTH: 80, // (fold: the line width)
  VAR: 0, // (a command line variable never set, in a number)
  TV_ON: 1, // (Trivia's "on" settings when never set: multi, multiple choice, written, stop)
  TV_WRITE: 210, // (Trivia's seconds to write an answer, when never set)
  DAMAGE: 1, // (a damage multiplier nobody set)
};
