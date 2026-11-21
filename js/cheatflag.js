/* ---------- a game with test commands used counts nothing ----------
   The one owner of s.hang.cheat: cheats.js' commands call markCheat, and every stat, unlock, record and jump counter
   asks cheated(s). It is its own small file, not part of cheats.js, because the front page's jump counter and unlocks
   (jumps.js, unlocks.js) load before any game does, and must not pull Dead Ducks Arcade's rules in with them. The mark
   is the game's l4.g (when it began): it holds for the rest of that game, and Play again starts a new one */
import { profile, statMode } from "./store.js";

const game = (s) => s && s.hang && s.hang.l4;
export const cheated = (s) =>
  !!game(s) && s.hang.cheat != null && s.hang.cheat === s.hang.l4.g;
export const markCheat = (s) => {
  s.hang.cheat = s.hang.l4.g;
};
/* my all-time stats for this game, or null: none in test rooms, nor in a game with test commands used */
export const statsOf = (s) =>
  s.test || cheated(s) ? null : profile.stats[statMode(s)];
