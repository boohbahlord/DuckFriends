/* ---------- the music: off for now ----------
   The owner (Nov 15): "The sounds and music will all be temporarily removed for now from the game." and "It stays and
   shows as if nothing is playing AND the music is completely removed from the files for now". Every song is out of the
   files; the old music (all the songs, how they were written out and played, the room's song list) is packed in the
   project's files (music/removed-sound-2026-11-15.zip), to come back later as recorded, licensed songs.
   What's left is silent, with the same names as before, so the Music bar, its slider and mute, the song command and
   Duck Cabin still work: nothing plays, no sound clock (AudioContext) is ever made, and the bar says "No music". */
import { activeRoom } from "./net.js";

const quiet = () => {};
export const music = {
  sync: quiet,
  hush: quiet,
  setMuffle: quiet,
  muffle: () => null,
  muffleTo: quiet,
  get muffled() {
    return false;
  },
  renderSong: async () => null,
  /* what the room hears now, for the Music bar: nothing (on the menus and in a room; elsewhere there's no bar) */
  nowPlaying() {
    const s = document.body.dataset.screen;
    return ["front", "rooms"].includes(s) || activeRoom()
      ? { name: "", next: false, in: 0, off: [], none: true }
      : null;
  },
  length: () => 0,
  get playing() {
    return false;
  },
  get recorded() {
    return false;
  },
  get written() {
    return [];
  },
  get track() {
    return null;
  },
  tracks: [],
};
