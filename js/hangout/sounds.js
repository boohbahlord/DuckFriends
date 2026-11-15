/* ---------- Duck Cabin's sounds: off for now ----------
   The owner (Nov 15): every sound and the music are out of the game for now (see sound.js); the old code is packed in the
   project's files (music/removed-sound-2026-11-15.zip). Silent stand-ins with the same names, so every caller still works:
   play() makes nothing, loop() hands back something that can be stopped and moved. */

const quiet = () => {};
export const NAMES = [],
  LOOPS = [];
export const parts = { env: quiet, tone: quiet, hiss: quiet, ring: quiet };
export const addSounds = quiet;
export const setListener = quiet;
export const play = quiet;
export const loop = () => ({ stop: quiet, move: quiet });
export const render = async () => null;
