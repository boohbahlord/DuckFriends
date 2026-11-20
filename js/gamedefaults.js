/* ---------- the game's own numbers, for every mode ----------
   The owner's, Nov 20 18:46Z: "Whenever I say these settings for things like movement and guns, they apply to every
   mode ... unless the game mode specifies otherwise ... there should be, I imagine, a file where all of this applies to
   every game mode by default." So a number he gives for the whole game lives here, and every mode reads it from here;
   a mode that must differ says so where it reads it. No imports, so the rules and the screen can both read it. */

/* sprint (Nov 20 18:46Z: "make it 1.25 times faster ... we can do 5 seconds ... it refills 50% slower, the sprint meter
   does, after you've used it"; 18:27Z: "sprint has to be all the way up before you can use it again") */
export const SPRINT = {
  speed: 1.25, // times walking speed
  ms: 5000, // ms of sprint from a full bar
  refill: 1.5, // the bar fills this many times as slowly as it drains (5 s of sprint: 7.5 s to fill)
};

/* zombies (Nov 20 21:17Z: "zombies should have a slightly slower attack speed by, let's say, 0.2 seconds") */
export const ZOMBIE_SWIPE_SLOWER = 200; // ms added to the wait between one swipe and the next, every zombie
