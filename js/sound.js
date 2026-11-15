/* ---------- sounds: off for now ----------
   The owner (Nov 15): "The sounds and music will all be temporarily removed for now from the game." Every sound the
   game made on the spot is out of the files; the old code is packed in the project's files
   (music/removed-sound-2026-11-15.zip), to come back later as recorded, licensed sounds.
   What's left is silent: the same names as before, so everything that calls them still works, and no sound clock
   (AudioContext) is ever made. */

const quiet = () => {};
/* every sound the game asks for (sfx.hit(), sfx.bang …): nothing */
export const sfx = new Proxy({}, { get: () => quiet });
export const ceiling = () => null;
export const sfxContext = () => null; // (no sound clock: callers already skip a sound when there's none)
export const sfxOut = () => null;
export const soon = () => 0;
export const diveVoice = quiet;
export const dive = quiet;
