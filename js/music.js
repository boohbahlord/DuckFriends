/* ---------- the music: our own songs, played from recordings ----------
   I want (Nov 16) our songs to be our old compositions' notes, played on recorded instruments (the GeneralUser GS
   SoundFont) with the 32-bit games' Medium look, made outside the game (the project's files:
   music/new-sound-tests/songs-2026-11-16, its notes and scripts). I listened to every one and said they can go in the
   game. Each song is one file in assets/music/ (64 kbps), and a lighter one in assets/music/lo/ (32 kbps, one channel)
   for Data saving and Poor connection. A file streams as it plays, so nothing big sits in memory.

   Where it plays: on the front page and the rooms page each player hears their own happier songs, one straight after
   another; in a room (the lobby and the game) everyone hears the same song at the same moment, with 20 seconds between
   two songs. No music in Quacky Zombies and Mad God Justin (the game itself, not its lobby). The lobby's countdown to
   the start fades the music out, gone by its last 2 seconds, and Vote for game mode and Vote for map have none (the
   owner, Nov 17 20:37Z). What the duck? only comes up
   in a room whose map is a scary one (Nous Within Kenoma, Shelter Sky & Null), never on a happy map or on the menus.

   No pops (CLAUDE.md): every file starts and ends at silence; each song has its own level (a gain) that only ever glides,
   from 0 as it starts and to 0 before it stops, set a little ahead of the clock; the music bar's slider glides too. */
import { profile } from "./store.js";
import { activeRoom } from "./later.js"; // (the room code comes after the first screen)
import { now as clockNow } from "./clock.js";
import { ceiling, sfxContext, modeDb } from "./sound.js";
import { netLevel } from "./settings.js";
import { baseMode } from "./sandboxrules.js";

/* every song: its name, its file and its length (s, the files' own) */
const SONGS = [
  ["Spring in a Box", "spring-in-a-box", 135.08],
  ["Ducklings in a Row", "ducklings-in-a-row", 148.3],
  ["Infinite Pond", "infinite-pond", 169.38],
  ["Outer Space Swim Commute", "outer-space-swim-commute", 157.0],
  ["Waddle before you paddle", "waddle-before-you-paddle", 169.09],
  ["Bouncy Chicks", "bouncy-chicks", 150.65],
  ["Pond-erful Ruffles", "ponderful-ruffles", 165.88],
  ["What the duck?", "what-the-duck", 170.76],
  ["Feather Bound", "feather-bound", 165.49],
  ["Lantern in the Fog", "lantern-in-the-fog", 74.16],
  ["Bubble Bath in the Sky", "bubble-bath-in-the-sky", 79.44],
];
const names = SONGS.map((s) => s[0]),
  idx = (n) => names.indexOf(n),
  durOf = (i) => SONGS[i][2];
const VERSION = (import.meta.url.match(/[?&]v=(\w+)/) || [])[1] || "dev";
const fileOf = (n) =>
  `assets/music/${netLevel() > 0 ? "lo/" : ""}${SONGS[idx(n)][1]}.mp3?v=${VERSION}`;

/* the happier songs, for the menus */
const HAPPY = [
  "Spring in a Box",
  "Ducklings in a Row",
  "Bouncy Chicks",
  "Waddle before you paddle",
  "Outer Space Swim Commute",
  "Bubble Bath in the Sky",
  "Pond-erful Ruffles",
  "Infinite Pond",
];
const SAD = names.filter((n) => !HAPPY.includes(n));
/* the owner (Nov 16): What the duck? plays on the scarier maps, as a part of the shuffle, and never on a happy one */
const SCARY_SONGS = ["What the duck?"],
  SCARY_MAPS = ["nwk", "collage"];
/* the owner: no music in Quacky Zombies and Mad God Justin, until we figure out what fits them */
const QUIET = ["l4dd", "mgj"];

/* 100% music: under the game. The songs' files are about 7 dB louder than the old songs were made, so this keeps them as
   quiet as the old music was at 100% (the owner: music stays quiet by default). Nov 19, the owner: "the music's too
   loud, maybe … it's something that you play with friends", so 4 dB under that (was 0.45) */
const BASE = 0.28;
const LV = () =>
  BASE *
  (profile.settings.sound / 100) *
  (profile.settings.music / 100) *
  10 ** (((modeDb() || {}).music || 0) / 20); // (a mode's own loudness: sound.js MODE_DB)

/* ---------- the next song ----------
   A random pick that leans away from the songs heard most recently (each song's chance grows with the minutes since it
   was last heard); never the same song twice in a row while there is another, and never a song the room turned off
   (song off on the command line) */
const HKEY = "duckfriends-music";
const heard = () => {
  try {
    const h = JSON.parse(localStorage.getItem(HKEY) || "{}");
    return h && typeof h === "object" && !Array.isArray(h) ? h : {};
  } catch (e) {
    return {};
  }
};
function pick(avoid, off) {
  const h = heard(),
    now = Date.now(),
    age = (n) => (h[n] ? Math.max(1, (now - h[n]) / 60000) : 1e7);
  const pool = names.map((n, i) => i).filter((i) => !off.has(names[i]));
  if (!pool.length) return -1;
  let best = -1,
    bk = -1;
  for (const i of pool) {
    if (pool.length > 1 && i === avoid) continue;
    const k = Math.pow(Math.random(), 1 / Math.log(2 + age(names[i])));
    if (k > bk) {
      bk = k;
      best = i;
    }
  }
  h[names[best]] = now;
  try {
    localStorage.setItem(HKEY, JSON.stringify(h));
  } catch (e) {}
  return best;
}

/* ---------- everyone in a room hears the same song at the same moment ----------
   The host keeps the room's songs in the state (s.music): the song now (a) and the one after it (b), each a name and its
   start in the server's time (clock.js). b starts 20 seconds after a ends; once b has begun, it becomes a and the host
   picks a new b. Every device plays whichever song should be sounding, from where it should be by now. A song turned off
   stops at once and the next one comes in 3 seconds. A room whose host has no song list plays this device's own picks */
const GAP = 20;
const end = (e) => e.at + durOf(idx(e.n)) * 1000;
function plan(S, t, menu, skip) {
  const off = new Set(menu ? SAD : (S && S.off) || []),
    ok = (n) => idx(n) >= 0 && !off.has(n),
    gap = menu ? 0 : GAP;
  for (const n of skip || []) off.add(n);
  let a = (S && S.a) || null,
    b = (S && S.b) || null;
  const was = JSON.stringify([a, b]);
  if (a && idx(a.n) < 0) a = null;
  if (a && !ok(a.n) && !(skip || []).includes(a.n) && t < end(a)) {
    a = null;
    if (b) b = { ...b, at: Math.min(b.at, t + 3000) };
  } // (a song turned off stops; one only left out of the shuffle, as What the duck? on a happy map, plays to its end)
  if (b && !ok(b.n)) b = null;
  if (b && (!a || t >= b.at)) {
    a = b;
    b = null;
  }
  if (!a) {
    const i = pick(-1, off);
    if (i >= 0) a = { n: names[i], at: t + 1500, seed: 0 };
  }
  if (a && !b) {
    const i = pick(idx(a.n), off);
    if (i >= 0)
      b = {
        n: names[i],
        at: Math.round(Math.max(end(a), t) + gap * 1000),
        seed: 0,
      };
  }
  return JSON.stringify([a, b]) === was ? null : { a, b };
}
let MENU = null,
  LOC = null,
  noListAt = 0;
const inMenu = () => ["front", "rooms"].includes(document.body.dataset.screen);
const roomState = () => {
  const r = activeRoom();
  return (r && r.state) || null;
};
const noMusic = () => {
  const s = roomState();
  return (
    document.body.dataset.screen === "game" &&
    !!s &&
    !!s.options &&
    QUIET.includes(baseMode(s.options)) // (Sandbox on the zombie maps: none either)
  );
};
/* the owner (Nov 17 20:37Z): "the music fades out when the lobby count starts and the is gone by the last two seconds IF
   it is counting or delayed to couunt", and "in the vote game mode and vote map section there is no music now" */
const COUNT_GONE = 2000; // ms before the countdown's end the music is gone by
const counting = () => {
  const s = roomState();
  return !inMenu() && !!s && s.phase === "countdown" && !s.vt ? s : null;
};
const voting = () => {
  const s = roomState();
  return !inMenu() && !!s && s.phase === "countdown" && !!s.vt;
};
/* in the countdown: the music's level glides down in a straight line, to 0 by COUNT_GONE before its end (again each
   second, on the same line; a countdown cancelled brings it back: sync) */
function countFade() {
  const s = counting();
  if (!s || !ac || !playing) return;
  const secs = Math.max(0.05, (s.ends - COUNT_GONE - clockNow()) / 1000),
    p = master.gain,
    t = ahead();
  if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
  else {
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
  }
  p.linearRampToValueAtTime(0, t + secs);
}
let wasQuiet = "";
const scaryMap = (s) =>
  !!s && !!s.options && SCARY_MAPS.includes(s.options.map);
function list() {
  if (inMenu()) return MENU;
  const s = roomState();
  if (!s) return null;
  return s.music || LOC;
}
/* every second: the host keeps the room's list going (whether or not it plays music itself), and this device follows */
function conduct() {
  const t = clockNow();
  if (inMenu()) {
    const m = plan(MENU, t, true, SCARY_SONGS);
    if (m) MENU = { ...m, off: [] };
    if (MENU && MENU.a && !sounding() && t < end(MENU.a)) {
      const a = { ...MENU.a, at: t + 400 };
      MENU = { a, b: MENU.b && { ...MENU.b, at: Math.round(end(a)) }, off: [] };
    } // (until the browser lets sound start, the menu's song waits at its start)
  } else {
    const r = activeRoom(),
      s = r && r.state;
    if (!s) {
      LOC = null;
      noListAt = 0;
    } else {
      const skip = scaryMap(s) ? [] : SCARY_SONGS;
      if (s.hostId === r.me) {
        const m = plan(s.music, t, false, skip);
        if (m) r.send({ t: "music", a: m.a, b: m.b });
        LOC = null;
      } else if (s.music) {
        LOC = null;
        noListAt = 0;
      } else {
        if (!noListAt) noListAt = t;
        if (t - noListAt > 4000) {
          const m = plan(LOC, t, false, skip);
          if (m) LOC = { ...m, off: [] };
        }
      }
    }
  }
  /* the countdown and the votes come and go: the music stops or comes back with them */
  const q = voting() ? "vote" : counting() ? "count" : "";
  if (q !== wasQuiet) {
    wasQuiet = q;
    sync();
  }
  countFade();
  follow();
}
setInterval(conduct, 1000);

/* ---------- the player ----------
   Two audio elements, so a song can fade out while the next comes in. Each goes through its own level (a gain) into the
   music's level (the Music slider), the muffle (Duck Cabin in the dark) and a soft ceiling, on the game's one sound
   clock (sound.js) */
let ac = null,
  master = null,
  MF = null;
const decks = []; // { el, g, e: the song it plays, fading }
function ctx() {
  if (ac) return ac;
  const a = sfxContext();
  if (!a || !a.createMediaElementSource) return null;
  ac = a;
  master = ac.createGain();
  master.gain.value = 0;
  MF = muffle(ac, ceiling(ac, ac.destination));
  master.connect(MF.inp);
  if (MUF) muffleTo(MF, true, 0.03);
  for (let i = 0; i < 2; i++) {
    const el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    const g = ac.createGain();
    g.gain.value = 0;
    ac.createMediaElementSource(el).connect(g).connect(master);
    decks.push({ el, g, e: null, fading: 0, wait: 0, until: 0, t0: 0 });
  }
  return ac;
}
const ahead = () => ac.currentTime + 0.03;
/* a level that glides from wherever it is now: held there first, then on toward v */
function glide(p, v, tc, t = ahead()) {
  if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
  else {
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
  }
  p.setTargetAtTime(v, t, tc);
}
const same = (x, y) => !!x && !!y && x.n === y.n && x.at === y.at;
const sounding = () => !!ac && ac.state === "running" && playing;
let playing = false;
/* the song that should be sounding now: the first on the list that hasn't ended (it may not have begun) */
function wantOf(S, t) {
  for (const e of [S && S.a, S && S.b])
    if (e && idx(e.n) >= 0 && t < end(e)) return e;
  return null;
}
/* where a song should be by now (s), counting the time the sound takes to reach the speakers */
const posOf = (e, t) =>
  (t - e.at) / 1000 + Math.min(0.3, ac.outputLatency || ac.baseLatency || 0);
/* a deck let go: it fades out, then stops */
function release(d) {
  if (!d.e) return;
  d.e = null;
  glide(d.g.gain, 0, 0.12);
  d.until = performance.now() + 900;
  clearTimeout(d.fading);
  d.fading = setTimeout(() => {
    if (!d.e) d.el.pause();
  }, 900);
}
const free = () =>
  decks.find((d) => !d.e && performance.now() > (d.until || 0)) ||
  decks.find((d) => !d.e);
/* a deck starts its song from where it should be, faded in. A deck still sounding fades out first (15 ms), and only then
   jumps to its new place: a jump in a sounding file is a pop */
function begin(d, e) {
  clearTimeout(d.fading);
  clearTimeout(d.wait);
  d.e = e;
  d.t0 = performance.now();
  glide(d.g.gain, 0, 0.015);
  const go = () => {
    if (d.e !== e) return;
    const src = fileOf(e.n);
    if (!d.el.src.endsWith(src)) d.el.src = src;
    d.el.currentTime = Math.max(0, posOf(e, clockNow()));
    const p = d.el.play(),
      fadeIn = () => {
        if (d.e === e) glide(d.g.gain, 1, 0.08);
      };
    if (p && p.then) p.then(fadeIn, () => d.e === e && (d.e = null));
    else fadeIn();
  };
  if (d.el.paused) go();
  else d.wait = setTimeout(go, 100);
}
/* every second, and when anything changes: the right song, at the right place, on one deck */
function follow() {
  if (!playing || !ac) return;
  const S = list(),
    t = clockNow(),
    e = S ? wantOf(S, t) : null;
  const on = decks.find((d) => d.e && same(d.e, e));
  for (const d of decks) if (d !== on && d.e) release(d);
  if (!e) return;
  if (on) {
    // playing: still in step with everyone? (a stall while the file streamed can leave it behind; a new start gets 4 s)
    const want = posOf(e, t);
    if (performance.now() - on.t0 < 4000 || want <= 0) return;
    if (
      on.el.paused ||
      (on.el.readyState >= 3 && Math.abs(on.el.currentTime - want) > 0.6)
    )
      begin(on, e);
    return;
  }
  const dt = (e.at - t) / 1000,
    d = free();
  if (dt > 12 || !d) return;
  if (dt > 0.05) {
    // coming up: its file starts loading (on a deck that's quiet by now), and it starts on time
    const src = fileOf(e.n);
    if (performance.now() > (d.until || 0) && !d.el.src.endsWith(src)) {
      d.el.src = src;
      d.el.load();
    }
    if (dt < 1.1) {
      clearTimeout(follow.at);
      follow.at = setTimeout(() => {
        const f = free();
        if (playing && f && !decks.some((x) => same(x.e, e))) begin(f, e);
      }, dt * 1000);
    }
    return;
  }
  begin(d, e);
}

/* ---------- on and off ---------- */
function level(tc, v) {
  if (ac) glide(master.gain, v == null ? LV() : v, tc);
}
function start() {
  if (!ctx()) return;
  if (ac.state === "suspended" && !document.hidden) ac.resume().catch(() => {});
  if (!playing) {
    playing = true;
    level(0.8);
  }
  follow();
}
function stop() {
  if (!playing) return;
  playing = false;
  clearTimeout(follow.at);
  if (!ac) return;
  for (const d of decks) release(d);
  level(0.3, 0);
}
/* the muffle: my own music as if heard from far off (Duck Cabin in the dark). A lowpass and a little less level; on, the
   filter slides down to about 600 Hz over 1.5 s, off it opens again over about 1 s. Only glides, each from wherever the
   last one has got to, so turning it on and off quickly never jumps. Local only: nobody else hears a change */
let MUF = false;
const MUFF = 600,
  MUFDB = -4;
function muffle(a, dest) {
  const lp = a.createBiquadFilter(),
    g = a.createGain(),
    top = Math.min(20000, a.sampleRate * 0.45);
  lp.type = "lowpass";
  lp.Q.value = 0.6;
  lp.frequency.value = top;
  lp.detune.value = 0;
  g.gain.value = 1;
  lp.connect(g);
  g.connect(dest);
  return { a, inp: lp, lp, g, top };
}
function muffleTo(m, on, lead, at) {
  const t = at ?? m.a.currentTime + lead,
    c = on ? -1200 * Math.log2(m.top / MUFF) : 0;
  m.lp.detune.setTargetAtTime(c, t, on ? 0.42 : 0.28);
  m.g.gain.setTargetAtTime(
    on ? Math.pow(10, MUFDB / 20) : 1,
    t,
    on ? 0.42 : 0.28,
  );
}
function setMuffle(on) {
  on = !!on;
  if (on === MUF) return;
  MUF = on;
  if (MF) muffleTo(MF, on, 0.03);
}
// in a room (the lobby or the game) or on the menus, with the music on and the page in view (and no one at the piano)
const wanted = () =>
  LV() > 0 &&
  !profile.settings.musicMute &&
  !document.hidden &&
  !HUSH &&
  !noMusic() &&
  !voting() &&
  ["front", "rooms", "lobby", "game"].includes(document.body.dataset.screen);
/* hushed (Hangout: someone plays the piano): the music fades away and stops, and the music bar says why ("Piano");
   unhushed, it fades back in where the room's song is by now, so everyone stays on the same song */
let HUSH = null;
function hush(why) {
  why = why || null;
  if (why === HUSH) return;
  HUSH = why;
  sync();
}
let started = false; // a tap, a mouse button or a key has happened, so the browser lets sound start
function sync() {
  if (wanted()) {
    if (started) start();
  } else stop();
  if (ac && playing) {
    if (counting()) countFade();
    else level(0.15);
  }
}
/* browsers hold all sound until the page is first used, and which event counts differs (a finger's tap only counts once
   it lifts): any of these, anywhere on the page, starts the music */
const wake = () => {
  started = true;
  if (wanted()) start();
};
for (const k of [
  "pointerdown",
  "pointerup",
  "mousedown",
  "touchend",
  "click",
  "keydown",
  "keyup",
])
  addEventListener(k, wake, true);
document.addEventListener("visibilitychange", sync);
document.addEventListener("settings", sync);
document.addEventListener("screen", sync);

/* what the room hears now, for the music bar: the song (or, in the quiet between two, the next one and when it starts) */
function nowPlaying() {
  const S = list();
  if (HUSH)
    return {
      name: HUSH,
      next: false,
      in: 0,
      off: (S && S.off) || [],
      hush: true,
    };
  if (!S) return null;
  if (noMusic() || voting())
    return { name: "No music", next: false, in: 0, off: S.off || [] };
  const t = clockNow(),
    e = wantOf(S, t);
  if (!e) return { name: "", off: S.off || [] };
  if (inMenu() && !sounding() && wanted())
    return { name: e.n, next: false, in: 0, off: [], wait: true }; // (the browser still holds the sound: the bar asks for a tap)
  if (inMenu() && e === S.a) return { name: e.n, next: false, in: 0, off: [] };
  return {
    name: e.n,
    next: t < e.at,
    in: Math.max(0, Math.ceil((e.at - t) / 1000)),
    off: S.off || [],
  };
}

export const music = {
  sync,
  hush,
  setMuffle,
  muffle,
  muffleTo,
  get muffled() {
    return MUF;
  },
  renderSong: async () => null,
  nowPlaying,
  length: (n) => (idx(n) < 0 ? 0 : durOf(idx(n))),
  get playing() {
    return playing;
  },
  get recorded() {
    return true;
  },
  get written() {
    return [];
  },
  get track() {
    const d = decks.find((x) => x.e);
    return d ? d.e.n : null;
  },
  tracks: names,
};
