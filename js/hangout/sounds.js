/* ---------- Duck Cabin's sounds ----------
   Every sound now comes from a recording (js/sound.js, the owner's Nov 16 ask): these are the same names as before, so
   every caller still works, passed on to it. A name with no recording yet (the cats, the cards, the lever …) is silent
   until its batch comes. play(name, { x, y, k }) fades with the distance from my duck (setListener). */
import {
  play as playSound,
  loop as loopSound,
  setListener as listen,
} from "../sound.js";

const quiet = () => {};
export const NAMES = [],
  LOOPS = [];
export const parts = { env: quiet, tone: quiet, hiss: quiet, ring: quiet };
export const setListener = listen;
export const play = (name, o) => playSound(name, o);
export const loop = (name, o) => loopSound(name, o);
const render = async () => null;
