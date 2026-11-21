/* ---------- the game's sounds: real recordings, played from small files ----------
   The owner (Nov 16): "we need sounds for almost anything", every one of them a real, already-made recording (free:
   CC0, assets/sfx/CREDITS.md), with the old 32-bit games' compressed sound, and no pops. tools/sfx/build.py cuts them
   and bakes that sound into small mono files (assets/sfx/, listed in js/sfxlist.js); here they're only played.

   How it stays light (Adam's notes, notes/audio-principles.md in the project's files):
   - one sound clock (AudioContext) for every sound, made at the first tap or key (browsers start sound only then);
   - each file fetched and decoded once, when it's first needed: the countdown, the steps and the jump at the first tap,
     the weapons and the items when a game starts (they work in every mode), Dead Ducks Arcade's own when it starts;
   - a voice is one buffer and one gain: no effects while playing, nothing made on the spot;
   - at most VOICES sounds at once, and a few of each kind (CAP): when full, the oldest of that kind fades out quickly
     (or a faint far one, or a zombie's step, is left out instead); loops (the wind, the fires) have their own LOOPS;
   - other ducks' sounds are quieter, and in Duck Cabin and Dead Ducks Arcade they fade with their distance from mine;
   - every sound goes through one soft ceiling, so many at once never go over full scale; nothing plays while the tab is
     hidden.
   No pops (CLAUDE.md): each file starts and ends at silence, every voice also ramps in over 5 ms from a gain of 0, set a
   little ahead of the clock, and a voice cut short fades out before it stops.

     sfx.<name>(o)          a sound by its name (sfx.handgun(), sfx.count(last) …); a name with no file yet is silent
     play(name, o)          o: { k: louder or quieter (1), x, y: where in the world (px; fades with distance), rate }
     loop(name, o)          a sound on a loop (the jetpack): { stop(), move(x, y) }
     setListener(fn)        fn() → where my duck is ({ x, y }), for the distance; null for none
     loadSounds(group)      "game", "l4dd", "cabin": fetch and decode that group's files ahead of time */
import { profile, SETTINGS_DEFAULT } from "./store.js";
import { FILES } from "./sfxlist.js";
import { netLevel } from "./settings.js";
import { activeRoom } from "./later.js"; // (the room code comes after the first screen)

/* how loud each sound is, in dB, the owner's to change: 0 plays the file as it is (each file peaks a little under full
   scale). Tiers: the menus' sounds faint, footsteps quiet (a duck's very quiet, a zombie's far quieter), the weapons
   about as loud as the old music, the biggest blasts the loudest */
export const VOL = {
  // the lobby countdown and Dead Ducks Arcade's new round (far off and faint)
  countTick: -13,
  countGo: -15,
  voteTick: -25, // (the votes' seconds: very soft)
  l4round: -14,
  l4over: -12, // (everyone's down: the game's ending, soft, Nov 19)
  svHorde: -14, // (Survival: a horde coming, far off; svCalm: its last zombie down)
  svCalm: -16,
  defib: -12, // (Survival's defibrillator: a dead duck brought back)
  merchantIn: -18, // (the merchant at his spot; merchantOut: running off)
  merchantOut: -20,
  // moving
  step: -19,
  zstep: -27,
  // … by the ground (feet.js stepOf): the same light step on grass, concrete or the road, a metal roof, shallow water;
  // a stroke swimming; a zombie rattling up the chain-link fence (quiet); a body landing from a fall
  stepGrass: -19,
  stepHard: -22,
  stepMetal: -21,
  stepWater: -20,
  swim: -21,
  climb: -26,
  thud: -13,
  hop: -19,
  jetStart: -19,
  jetLoop: -23,
  jetStop: -18,
  // the flamethrower: lit, its roar while held, its last puff
  flameStart: -11,
  flameLoop: -14,
  flameStop: -13,
  // fire: something burning (a crackle on a loop) and catching (a whoosh)
  fire: -16,
  fireLight: -12,
  // the Sad Trombone special
  trombone: -11,
  // guns: each its own shot
  handgun: -6,
  revolver: -7,
  smg: -7,
  tommy: -12, // (the Tommy gun; softer, the owner's, Nov 19: as loud as the LMG)
  ump: -11, // (the UMP-45: heavier; as loud as the LMG, Nov 19)
  ak: -9,
  lmg: -8,
  chaingun: -9,
  sniper: -12,
  shotgun: -7,
  dbarrel: -5, // (the double barrel: louder than the pump shotgun)
  burst: -16, // (the burst rifle: one round of its three; the owner, Nov 19: "really loud and harsh", now as loud as the LMG for all three)
  pump: -15,
  glauncher: -10,
  bow: -12, // (quieter: the owner, Nov 18 15:18Z "with quieter audio")
  empty: -8,
  // … and its own reload
  reloadHandgun: -17,
  reloadRevolver: -14,
  reloadSmg: -10,
  reloadAk: -12,
  reloadLmg: -13,
  reloadChaingun: -11,
  reloadBurst: -12,
  reloadDbarrel: -13,
  reloadFlamer: -13,
  reloadSniper: -12,
  reloadShotgun: -6,
  reloadGlauncher: -13,
  // items
  medkit: -19,
  adrenaline: -12,
  chomp: -6,
  sip: -8,
  // a round in flesh, by its size; a blade, a blunt thing (the hammer, the chair), an arrow, a zombie's claw
  hitSmall: -12,
  hitBig: -11,
  hitHeavy: -10,
  hitShot: -10,
  hitBlade: -14,
  hitBlunt: -10,
  axeHit: -10, // (… and its own hit)
  swordHit: -14,
  panHit: -12,
  break: -10, // (a melee breaking, and any item that breaks once it runs out: one sound for all, the owner, Nov 19)
  // Sandbox: something set down in build mode, and cut or deleted; a loot orb coming; cheat mode on and off
  sbPlace: -16,
  sbCut: -20,
  sbOrb: -20,
  cheatOn: -20,
  cheatOff: -22,
  // Seriat's window: a .se file set running, and stopped (a quiet tick each)
  seRun: -22,
  seStop: -24,
  hitArrow: -8,
  hitClaw: -10,
  // a round that missed, landing on the floor or a wall
  landSmall: -10,
  landBig: -13,
  landHeavy: -13,
  landShot: -15,
  landArrow: -13,
  landDagger: -13,
  // swings and throws
  knife: -11,
  hammer: -9,
  axe: -9, // (the new melees: each its own swing …)
  sword: -11,
  pan: -9,
  chair: -11,
  throw: -11,
  cakeThrow: -11,
  bonk: -13,
  // explosions: one boom for every explosive (SFX.boomBig for a wider one); the meteor and the nuke
  // are their own, longer and the loudest of all ("more catastrophic", the owner, Nov 16)
  boom: -10,
  boomSmall: -13, // (the Angelic pistol's blast: the boom made a little weaker, the owner, Nov 17)
  meteor: -6,
  nuke: -5,
  nukeRing: -22, // (the ears ringing, under the nuke's roar)
  // the laser gun: its beam (one a second), the hiss as it overheats, and a light steam off its hot barrel (SFX.steam)
  laser: -10,
  laserHiss: -16,
  laserSteam: -24,
  // a crit's gush of gore, a miss's wispy blip
  gore: -12,
  miss: -20,
  // the weather (ambience.js): a light rain over Downpour, the wind round the cabin; Downpour's church bell as a round
  // starts, and the chime once every zombie is down (the last note of What the duck?)
  rain: -27,
  wind: -25,
  churchBell: -13,
  cleared: -13,
  // the menus: faint
  uiPress: -13,
  uiOn: -23,
  uiOff: -24,
  uiOpen: -24,
  uiClose: -26,
  nope: -16,
  tick: -15,
  holdFill: -22, // (the Vote button filling as it's held: soft)
  holdClick: -14, // (… and full)
  done: -23,
  bell: -14,
  ping: -17,
  pop: -16,
  boop: -15,
  tileIn: -21, // (stepping onto another tile: faint)
  // Dead Ducks Arcade: boards, groans, the fireplace's spin, a sale, drops, the flashlight
  l4crack: -12,
  l4nail: -14,
  l4groan: -20,
  l4slot: -15,
  l4till: -16,
  dropIn: -16,
  dropGot: -12,
  flashOn: -20,
  flashOff: -21,
  // Duck Cabin: lamps, the power box, flames, the TV, blackjack, the cats and Justin, the shadow duck
  lampOn: -18,
  lampOff: -19,
  lever: -12,
  fireOut: -16,
  candleOut: -18,
  relight: -16,
  tvClick: -18,
  card: -16,
  chips: -16,
  bite: -12,
  gulp: -12,
  whoosh: -16,
  swipe: -12,
  meow: -17,
  purr: -18,
  hiss: -14,
  static: -32, // (the TV with no channel, on a loop: a quiet, even hiss)
  hum: -24, // (the power box's transformer, on a loop)
  // the power coming on and going out (Duck Cabin's box and Dead Ducks Arcade's), its parts, the Angel machine
  powerUp: -4, // (louder: the owner, Nov 17 18:05Z)
  powerDown: -6,
  partGot: -14,
  partIn: -12,
  gasPour: -14,
  angelWork: -13,
  angelOrb: -11,
  quack: -10, // (real ducks: the Sound special, a duel)
};
/* names some callers use for a sound that is another's (Justin's gunshot is the handgun's) */
const ALIAS = { gunshot: "handgun" };
export const OTHERS = 0.6; // another duck's sounds, against mine
const LOOPS = 6, // loops at once, at most, on their own (Duck Cabin's wind, fireplace, campfire, hum, TV and a cat's purr fit)
  VOICES = 12, // one-off sounds at once, at most
  CAP = {
    ...{
      step: 3,
      zstep: 3,
      chaingun: 4,
      smg: 4,
      tommy: 4,
      ump: 3,
      lmg: 4,
      ak: 3,
      burst: 4,
    },
    ...{ flameLoop: 3, fire: 3 },
    ...{ hitSmall: 4, hitShot: 3, hitClaw: 3, landSmall: 3, landShot: 3 },
    ...{ l4crack: 3, l4nail: 3, card: 3 },
  }, // … and of one kind (2 for the rest)
  CAP_ANY = 2;
/* on Data saving or Poor connection (the owner's performance settings): fewer sounds at once, 2 of each kind, and a far
   sound that would be nearly silent isn't played at all */
const LITE = { voices: 8, loops: 3, cap: 2, far: 0.12 };
const lite = () => netLevel() > 0;
const NEAR = 300, // world px: full up to here …
  FAR = 1500; // … and nothing from here (as Duck Cabin's)
const UI = [
  ...["uiPress", "uiOn", "uiOff", "uiOpen", "uiClose", "nope", "tick"],
  ...["holdFill", "holdClick"],
];
/* Duck Cabin's and Downpour's own: the grounds' footsteps, a stroke, a fall's thud, the wind, the fireplace */
const WORLD = [
  ...["stepGrass", "stepHard", "stepMetal", "stepWater", "swim", "thud"],
  ...["wind", "fire"],
];
const GROUPS = {
  first: [
    ...["countTick", "countGo", "voteTick", "step", "hop", ...UI],
    ...["done", "bell", "ping", "pop", "boop"],
  ],
  game: [
    ...["handgun", "revolver", "smg", "ak", "lmg", "chaingun", "sniper"],
    ...["tommy", "ump"],
    ...["shotgun", "pump", "glauncher", "bow", "empty", "medkit", "adrenaline"],
    ...["dbarrel", "burst", "flameStart", "flameLoop", "flameStop"],
    ...["fire", "fireLight", "trombone"],
    ...["jetStart", "jetLoop", "jetStop", "chomp", "sip"],
    ...["knife", "hammer", "chair", "throw", "cakeThrow", "bonk"],
    ...["axe", "sword", "pan", "axeHit", "swordHit", "panHit", "break"],
    ...["sbPlace", "sbCut", "sbOrb", "cheatOn", "cheatOff", "seRun", "seStop"],
    ...["boom", "boomSmall", "meteor", "tileIn", "quack"],
    ...["laser", "laserHiss", "laserSteam", "gore", "miss"],
    ...Object.keys(VOL).filter((n) => /^(reload|hit|land)[A-Z]/.test(n)),
  ],
  l4dd: [
    ...[
      "l4round",
      "l4over",
      "svHorde",
      "svCalm",
      "defib",
      "merchantIn",
      "merchantOut",
      "zstep",
      "nuke",
      "nukeRing",
      "l4crack",
      "l4nail",
      "l4groan",
      "l4slot",
    ],
    ...["l4till", "dropIn", "dropGot", "flashOn", "flashOff"],
    ...["powerUp", "powerDown", "partGot", "partIn", "gasPour"],
    ...["angelWork", "angelOrb"],
    ...["climb", "rain", "churchBell", "cleared", ...WORLD],
  ],
  cabin: [
    ...WORLD,
    ...["lampOn", "lampOff", "lever", "fireOut", "candleOut", "relight"],
    ...["tvClick", "card", "chips", "bite", "gulp", "whoosh", "swipe"],
    ...["meow", "purr", "hiss", "static", "hum", "powerUp", "powerDown"],
  ],
};
const LEAD = 0.03; // s: every sound is set this far ahead of the clock (set for "now", its fade-in is skipped: a pop)
const VERSION = (import.meta.url.match(/[?&]v=(\w+)/) || [])[1] || "dev"; // (a new version fetches the files again)

let ac = null,
  out = null,
  listener = null;
const bufs = new Map(), // name → [AudioBuffer, …] (a few takes: one is picked at random)
  raw = new Map(), // name → Promise of the files' bytes (fetched before the clock exists)
  live = []; // the voices playing: { name, src, g, t }

/* the soft ceiling at the end of the chain: straight through up to .7, then rounding off below 1, so many sounds at once
   never go over full scale, which crackles (its input is quartered, as a curve only reads -1..1: it takes up to 4) */
export function ceiling(a, dest) {
  const q = a.createGain(),
    w = a.createWaveShaper(),
    n = 4097,
    c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = 4 * (i / 2048 - 1),
      m = Math.abs(x);
    c[i] =
      Math.sign(x) * (m <= 0.7 ? m : 0.7 + 0.28 * Math.tanh((m - 0.7) / 0.28));
  }
  q.gain.value = 0.25;
  w.curve = c;
  q.connect(w);
  w.connect(dest);
  return q;
}

/* Volume times Sound effects (Settings), under HEAD: every sound 3 dB quieter than it was (the owner, Nov 19: "the
   audio design is a background that provides feedback and it fills the air", for a game played talking with friends) */
const HEAD = 0.7;
const level = () =>
  HEAD *
  (profile.settings.sound / 100) *
  ((profile.settings.sfx ?? SETTINGS_DEFAULT.sfx) / 100);

/* each mode's own loudness, in dB over everything else (the Settings sliders stay as they are). I want Survival a
   little louder than the rest, about as loud as the whole game was before Nov 19, but its annoying guns as quiet as
   they are now (KEEP). Keyed by the mode's id (s.options.mode); music.js reads .music */
const MODE_DB = { surv: { sfx: 3, music: 4 } };
const KEEP = new Set(["burst", "tommy", "ump"]); // (the guns the owner found loud and harsh, Nov 19)
/* the mode being played: only on the game screen (the lobby and the menus keep the usual loudness) */
export function modeDb() {
  if (document.body.dataset.screen !== "game") return null;
  const r = activeRoom(),
    s = r && r.state;
  return (s && s.options && MODE_DB[s.options.mode]) || null;
}
const modeK = (name) => {
  const m = !KEEP.has(name) && modeDb();
  return m && m.sfx ? 10 ** (m.sfx / 20) : 1;
};

/* "now" on the sound clock, plus a lead. Firefox only moves currentTime between tasks, so a sound set during a long frame
   read a clock that had stopped and landed in the past: if the clock hasn't moved since I last looked, I add the time
   that has passed since then (at most a quarter of a second) */
let seenCt = -1,
  seenP = 0;
function soon(a = ac, lead = LEAD) {
  const p = performance.now(),
    ct = a.currentTime;
  if (ct === seenCt && a.state === "running")
    return ct + Math.min(0.25, (p - seenP) / 1000) + lead;
  seenCt = ct;
  seenP = p;
  return ct + lead;
}

/* the clock, made at the first tap or key; it sleeps while the tab is hidden */
function start() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
    } catch (e) {
      return null;
    }
    out = ac.createGain();
    out.gain.value = level();
    out.connect(ceiling(ac, ac.destination));
    for (const n of raw.keys()) decode(n);
    loadSounds("first");
  }
  if (ac.state === "suspended" && !document.hidden) ac.resume().catch(() => {});
  return ac;
}
export const sfxContext = () => start();
for (const k of ["pointerdown", "keydown", "touchend"])
  addEventListener(k, start, { capture: true });
document.addEventListener("visibilitychange", () => {
  if (!ac) return;
  if (document.hidden) ac.suspend().catch(() => {});
  else ac.resume().catch(() => {});
});
/* the sliders: glide to the new level (held first, so a level that's still moving never jumps) */
document.addEventListener("settings", () => {
  if (!ac) return;
  const t = soon();
  out.gain.cancelScheduledValues(t);
  out.gain.setValueAtTime(out.gain.value, t);
  out.gain.linearRampToValueAtTime(level(), t + 0.15);
});

/* a sound's files: fetched once (any time), decoded once (when the clock is there) */
const url = (name, i, n) =>
  `assets/sfx/${name}${n > 1 ? "-" + (i + 1) : ""}.mp3?v=${VERSION}`;
function fetchOf(name) {
  const f = FILES[name];
  if (!f || raw.has(name)) return;
  raw.set(
    name,
    Promise.all(
      Array.from({ length: f.n }, (_, i) =>
        fetch(url(name, i, f.n)).then((r) => (r.ok ? r.arrayBuffer() : null)),
      ),
    ).catch(() => []),
  );
  if (ac) decode(name);
}
function decode(name) {
  if (bufs.has(name)) return;
  bufs.set(name, null); // (on its way)
  raw
    .get(name)
    .then((list) =>
      Promise.all(
        list
          .filter(Boolean)
          .map((b) =>
            new Promise((ok, no) => ac.decodeAudioData(b, ok, no)).catch(
              () => null,
            ),
          ),
      ).then((d) => bufs.set(name, d.filter(Boolean))),
    );
}
export function loadSounds(group) {
  for (const n of GROUPS[group] || []) fetchOf(n);
}

export function setListener(fn) {
  listener = fn || null;
}
/* how loud at a distance from my duck: full near, nothing far */
function near(o) {
  if (o.x == null || !listener) return 1;
  const me = listener();
  if (!me) return 1;
  const d = Math.hypot(o.x - me.x, o.y - me.y);
  return d <= NEAR ? 1 : d >= FAR ? 0 : ((FAR - d) / (FAR - NEAR)) ** 2;
}

/* which side of my duck a sound is on, and whether a floor is between us (the owner, Nov 17 12:28Z: sounds "should also
   sound they like are above or below you depending on the height"): pan -PAN_MAX (left) … PAN_MAX (right), and a floor
   above or below muffles it (lp: its low-pass, Hz; 0 for none), the one below more. o.z is the sound's height (world
   px), mine is my duck's */
const PAN = 900, // world px to the side: as far left or right as it goes
  PAN_MAX = 0.6, // (never all in one ear)
  FLOOR = 70, // world px of height between us: another floor
  BELOW = 900, // Hz: under me, through the floor
  ABOVE = 1600; // … over me
function sideOf(o) {
  if (o.x == null || !listener) return null;
  const me = listener();
  if (!me) return null;
  const dz = o.z != null && me.z != null ? o.z - me.z : 0;
  return {
    pan: Math.max(-PAN_MAX, Math.min(PAN_MAX, (o.x - me.x) / PAN)),
    lp: dz < -FLOOR ? BELOW : dz > FLOOR ? ABOVE : 0,
  };
}

/* a gain held where it is at time t (what was scheduled after t is dropped), to go on from there */
function freeze(g, t) {
  if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
  else {
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
  }
}
/* a voice cut short: a quick fade, then stopped */
function cut(v, t) {
  const g = v.g.gain;
  freeze(g, t);
  g.setTargetAtTime(0, t, 0.006);
  try {
    v.src.stop(t + 0.05);
  } catch (e) {}
  v.cut = true;
}
function drop(v) {
  const i = live.indexOf(v);
  if (i >= 0) live.splice(i, 1);
  v.src.disconnect();
  v.g.disconnect();
  if (v.f) v.f.disconnect();
  if (v.p) v.p.disconnect();
}

/* one sound: returns its voice, or null when there's nothing to play (no clock yet, muted, too far, not loaded yet: a
   sound not loaded yet starts loading, and the next one plays) */
function voice(name, o = {}, loops = false) {
  name = ALIAS[name] || name;
  if (!FILES[name] || !start() || document.hidden) return null;
  const list = bufs.get(name);
  if (!list) {
    fetchOf(name);
    return null;
  }
  const far = near(o),
    side = sideOf(o),
    lp = o.lp || (side && side.lp) || 0, // (a muffled sound: through a floor, or a loop asked for it: ambience.js)
    k =
      (o.k ?? 1) *
      far *
      (side && side.lp ? 0.8 : 1) *
      modeK(name) *
      10 ** ((VOL[name] || 0) / 20),
    low = lite();
  if (!list.length || k < 0.002 || !level()) return null;
  if (low && far < LITE.far) return null;
  const t = soon();
  if (loops) {
    /* a loop (the wind, the rain, a fire, the hum, a jetpack): its own budget, LOOPS at once. Full: the quietest gives
       way to a louder one; a quieter one waits (its owner tries again: ambience.js every 250 ms) */
    const ls = live.filter((v) => v.loop && !v.cut);
    if (ls.length >= (low ? LITE.loops : LOOPS)) {
      const q = ls.reduce((a, b) => (b.k < a.k ? b : a));
      if (k <= q.k) return null;
      cut(q, t);
    }
  } else {
    /* a one-off: a few of each kind, VOICES in all; the loops never count here, so a busy fight never cuts the wind or
       a fire (the owner OK'd it, Nov 18 14:50Z). A sound that gives way (o.yield: a zombie's step) is left out when
       its kind is full instead of cutting one (my own step under a mob), and when every voice is busy, one quieter
       than all of them (a far step or hit) is left out instead of cutting the oldest */
    const same = live.filter((v) => v.name === name && !v.cut && !v.loop);
    if (same.length >= (low ? LITE.cap : CAP[name] || CAP_ANY)) {
      if (o.yield) return null;
      cut(same[0], t);
    }
    const all = live.filter((v) => !v.cut && !v.loop);
    if (all.length >= (low ? LITE.voices : VOICES)) {
      if (all.every((v) => k < v.k)) return null;
      cut(all[0], t);
    }
  }
  const src = ac.createBufferSource(),
    g = ac.createGain();
  src.buffer = list[(Math.random() * list.length) | 0];
  src.playbackRate.value = o.rate || 1 + (Math.random() - 0.5) * 0.04; // (the same sound twice is never quite the same)
  if (loops) {
    src.loop = true;
    [src.loopStart, src.loopEnd] = FILES[name].loop;
  }
  g.gain.value = 0;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(k, t + 0.005);
  /* src → its gain → (its low-pass) → (its side) → everything's level; set before it sounds, so nothing jumps */
  let tail = src.connect(g),
    f = null,
    p = null;
  if (lp) {
    f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lp;
    f.Q.value = 0.5;
    tail = tail.connect(f);
  }
  if (side && ac.createStereoPanner) {
    p = ac.createStereoPanner();
    p.pan.value = side.pan;
    tail = tail.connect(p);
  }
  tail.connect(out);
  src.start(t, loops ? FILES[name].loop[0] : 0);
  const v = { name, src, g, t, k, f, p, loop: loops };
  src.onended = () => drop(v);
  live.push(v);
  return v;
}
export const play = (name, o) => voice(name, o);
/* a sound stopped before its end, faded (a reload given up when the duck switched weapons) */
export function hush(v) {
  if (v && !v.cut && ac) cut(v, soon());
}

/* a sound on a loop, faded in and out (the jetpack's roar) */
export function loop(name, o = {}) {
  const v = voice(name, o, true);
  let at = o; // where it is now (move)
  return {
    /* is it sounding? (false: nothing loaded yet, muted, too far as it started, or cut for another) */
    get on() {
      return !!v && !v.cut;
    },
    stop() {
      if (v && !v.cut && ac) {
        const t = soon(),
          g = v.g.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.linearRampToValueAtTime(0, t + 0.12);
        try {
          v.src.stop(t + 0.15);
        } catch (e) {}
        v.cut = true;
      }
    },
    /* louder or quieter (k, as play's), glided from wherever it is (over secs) */
    set(k, secs = 0.15) {
      if (!v || v.cut || !ac) return;
      const t = soon(),
        g = v.g.gain;
      freeze(g, t);
      v.k = k * near(o) * 10 ** ((VOL[name] || 0) / 20); // (as at its start, where move measures from)
      g.linearRampToValueAtTime(
        (v.k * near(at)) / Math.max(1e-6, near(o)),
        t + secs,
      );
    },
    move(x, y) {
      if (!v || v.cut || !ac) return;
      at = { x, y };
      const t = soon(),
        g = v.g.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(
        (v.k * near({ x, y })) / Math.max(1e-6, near(o)),
        t + 0.1,
      );
      const side = v.p && sideOf({ x, y });
      if (side) glide(v.p.pan, side.pan, t, 0.1, false);
    },
    /* its low-pass glided to hz (a loop started with o.lp: the wind muffled indoors, clear outside) */
    tone(hz) {
      if (!v || v.cut || !ac || !v.f) return;
      glide(v.f.frequency, hz, soon(), 0.6, true);
    },
  };
}

/* a level that may be moving, held where it is, then glided to its new value (never jumped) */
function glide(param, to, t, secs, exp) {
  if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t);
  else {
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
  }
  if (exp) param.exponentialRampToValueAtTime(Math.max(1e-4, to), t + secs);
  else param.linearRampToValueAtTime(to, t + secs);
}

/* the jetpack: its start, its roar while the jets are on, and a hiss as they stop (each duck's own) */
const jets = new Map();
function jet(id, on, o = {}) {
  const j = jets.get(id);
  if (!!j === !!on) return;
  if (on) {
    play("jetStart", o);
    jets.set(id, loop("jetLoop", o));
  } else {
    j.stop();
    jets.delete(id);
    play("jetStop", o);
  }
}

/* the flamethrower: the game tells me each puff (ten a second while it's held, o.id the duck's); the first one lights
   it (its start, then its roar on a loop, following the duck), and once the puffs stop coming it goes out (its last
   puff). Each duck's own */
const flames = new Map(); // id → { l: its roar's loop, o, t: the timer that puts it out }
const FLAME_OUT = 450; // ms without a puff and it's let go (puffs come every 100 ms; online ones can come late)
function flamer(o = {}) {
  const id = o.id ?? "";
  let f = flames.get(id);
  if (!f) {
    play("flameStart", o);
    f = { l: loop("flameLoop", o), o };
    flames.set(id, f);
  } else if (o.x != null) f.l.move(o.x, o.y);
  f.o = o;
  clearTimeout(f.t);
  f.t = setTimeout(() => flameOut(id), FLAME_OUT);
}
function flameOut(id) {
  const f = flames.get(id);
  if (!f) return;
  clearTimeout(f.t);
  f.l.stop();
  flames.delete(id);
  play("flameStop", f.o);
}

/* something on fire for secs (a duck in Mad God Justin or Dead Ducks Arcade): the crackle on a loop, then out. The fire
   special: the whoosh as it catches, then the crackle for its flames' 1.6 s (game.js burn) */
function burn(secs = 1.6, o = {}) {
  const l = loop("fire", o);
  setTimeout(() => l.stop(), Math.max(0.3, +secs || 0) * 1000);
}
function fire(o = {}) {
  play("fireLight", o);
  burn(1.6, o);
}

/* leaving a game: every jet and every flamethrower quiet */
export function jetsOff() {
  for (const id of [...jets.keys()]) jet(id, false);
  for (const id of [...flames.keys()]) flameOut(id);
  for (const id of [...steams.keys()]) steam(id, 0);
}

/* the laser gun's steam, each duck's own: the game tells me how hot its barrel is (heat: 0 cold to 1 at its limit, more
   once it has overheated) and whether it's raining (o.rain: the steam is louder, the owner: "steams up in sound and
   visual effect MORE when it is in the rain"); cold, the steam fades away */
const steams = new Map(); // id → its loop
function steam(id, heat, o = {}) {
  const l = steams.get(id),
    k = Math.min(1.5, heat || 0) * (o.rain ? 2 : 1) * (o.k ?? 1);
  if (k < 0.05) {
    if (l) {
      l.stop();
      steams.delete(id);
    }
    return;
  }
  if (!l) steams.set(id, Object.assign(loop("laserSteam", { ...o, k }), { k }));
  else {
    // told every frame: I only glide to a new level once it has really changed, so the gain isn't re-ramped 60 times a second
    if (Math.abs(k - l.k) > 0.08 * l.k) {
      l.set(k);
      l.k = k;
    }
    if (o.x != null && (o.x !== l.x || o.y !== l.y)) {
      l.move(o.x, o.y);
      [l.x, l.y] = [o.x, o.y];
    }
  }
}

/* the weapons in hand, with a magazine: each its own reload, its file as long as the reload in the game (s: tools/sfx/
   build.py makes them so). Told how long this one takes (a Faster reload, or heard late), it plays faster or slower to
   end with it, within reason */
const RELOAD_S = {
  handgun: 1.2,
  revolver: 1.7,
  smg: 1.4,
  ak: 1.9,
  lmg: 2.8,
  chaingun: 4,
  sniper: 2.2,
  glauncher: 4,
  burst: 2,
  dbarrel: 2, // (a second a shell: one shell plays it faster)
  dbuck: 2,
  flamer: 4,
};
function reload(w, o = {}) {
  if (!RELOAD[w]) return null;
  const rate =
    o.secs > 0 && RELOAD_S[w]
      ? Math.min(1.8, Math.max(0.85, RELOAD_S[w] / o.secs)) // (an Angelic gun's is 20% faster, with Faster reload more)
      : 0;
  return play(RELOAD[w], { ...o, ...(rate ? { rate } : {}) });
}
const RELOAD = {
  handgun: "reloadHandgun",
  revolver: "reloadRevolver",
  smg: "reloadSmg",
  tommy: "reloadSmg", // (the Tommy gun and the UMP-45: the SMG's reload, for now)
  ump: "reloadSmg",
  ak: "reloadAk",
  lmg: "reloadLmg",
  chaingun: "reloadChaingun",
  sniper: "reloadSniper",
  shotgun: "reloadShotgun",
  glauncher: "reloadGlauncher",
  burst: "reloadBurst",
  dbarrel: "reloadDbarrel",
  dbuck: "reloadDbarrel",
  flamer: "reloadFlamer",
};

/* a round in flesh, by what fx.js's blood says went in (BLEED_OF: small, big, heavy, shot, blade, blunt, arrow, claw) */
const FLESH = {
  small: "hitSmall",
  big: "hitBig",
  heavy: "hitHeavy",
  shot: "hitShot",
  blade: "hitBlade",
  blunt: "hitBlunt",
  arrow: "hitArrow",
  claw: "hitClaw",
};
let fleshAt = 0;
/* … but a melee with its own hit sounds its own (w: the weapon, when the game says) */
const OWN_HIT = { axe: "axeHit", sword: "swordHit", pan: "panHit" };
function flesh(kind, w) {
  fleshAt = performance.now();
  play(OWN_HIT[w] || FLESH[kind] || "hitSmall");
}
/* a round that missed, by its kind (game.js' shots: a round's own kind, a pellet, an arrow, a dagger) */
const LAND = {
  pellet: "landShot",
  arrow: "landArrow",
  dagger: "landDagger",
  sniper: "landHeavy",
  chaingun: "landHeavy",
  chain: "landHeavy",
  ak: "landBig",
  burst: "landBig",
  slug: "landHeavy",
  revolver: "landBig",
};
const NO_LAND = ["grenade", "lgren", "controller", "chair", "laser"]; // (they land with their own sounds, or none)
const land = (k) =>
  NO_LAND.includes(k) || play(LAND[k] || "landSmall", { k: 0.55 }); // (quieter than a hit: the owner, Nov 17 12:28Z)
/* a duck hurt, when nothing bled to make the sound (a kill by command, Invulnerability's flash): looked at a moment
   later, so a hit that bleeds isn't heard twice */
const hit = () =>
  setTimeout(
    () => performance.now() - fleshAt > 150 && play("hitBig", { k: 0.7 }),
    30,
  );

/* my duck hurt: it quacks, a little higher, at most once in OUCH ms (the owner, Nov 17 18:05Z) */
const OUCH = 400;
let ouchAt = -1e9;
const ouch = () => {
  const t = performance.now();
  if (t - ouchAt < OUCH) return null;
  ouchAt = t;
  return play("quack", { k: 0.6, rate: 1.1 + Math.random() * 0.08 });
};

/* the Vote button held (the owner, Nov 17 19:22Z: "makes a sound as it fills up ... until a click noise when it is
   full"): a soft sweep rising over the hold's ms (its recording is HOLD_S long, sped up or slowed to fit), faded out
   over about 0.1 s when let go early or once full, and a click when full (game.js holdStart, holdEnd) */
const HOLD_S = 0.52;
let holdV = null;
function holdStop() {
  const v = holdV;
  holdV = null;
  if (!v || v.cut || !ac) return;
  const t = soon(),
    g = v.g.gain;
  freeze(g, t);
  g.setTargetAtTime(0, t, 0.02);
  try {
    v.src.stop(t + 0.15); // (past 6 time constants: silent by then)
  } catch (e) {}
  v.cut = true;
}
function holdFill(ms = 500) {
  holdStop();
  const rate = Math.max(0.5, Math.min(2, (HOLD_S * 1000) / Math.max(1, ms)));
  holdV = play("holdFill", { rate });
  return holdV;
}

/* the menus: a faint press for every button, a toggle's own sounds for on and off (its aria-pressed or a checkbox) */
addEventListener(
  "click",
  (e) => {
    const b =
      e.target.closest &&
      e.target.closest(
        'button, [role="button"], a.btn, input[type="checkbox"], select',
      );
    if (!b || b.disabled || b.classList.contains("win-x")) return; // (a window's X: its closing sound)
    if (b.classList.contains("vote-btn") || b.dataset.a === "hang") return; // (the Vote button and the use button click their own way: game.js, sfx.holdClick)
    if (b.hasAttribute("data-run")) return; // (Seriat's Run and Stop: their own ticks, numeratwin.js)
    if (b.type === "checkbox") play(b.checked ? "uiOn" : "uiOff");
    else if (b.getAttribute("aria-pressed") === "false") play("uiOn");
    else if (b.hasAttribute("aria-pressed"))
      setTimeout(() =>
        play(
          b.isConnected && b.getAttribute("aria-pressed") === "true"
            ? "uiPress"
            : "uiOff",
        ),
      );
    // (switched off; or one of a row of choices that stays picked: a press)
    else play("uiPress");
  },
  true,
);

const quiet = () => null;
const VOTE_K = 0.45; // the lobby countdown's tones in the votes: this much as loud
const named = (name) => (o) => play(name, o && typeof o === "object" ? o : {}); // (some callers pass a number)
/* every sound the game asks for by name. The older names stay (bang was every pistol, tat every quick gun); a name
   with no recording yet is silent, to come in the next batches */
const SFX = {
  count: (last) => play(last ? "countGo" : "countTick"),
  /* Vote for game mode and Vote for map, as their clock shows each new second (owner, Nov 17): a soft beep of its own,
     then the last five as the lobby countdown's, and its ding at 0, all quieter */
  voteCount: (n) =>
    n > 5
      ? play("voteTick")
      : play(n > 0 ? "countTick" : "countGo", { k: VOTE_K }),
  bang: named("handgun"),
  tat: named("smg"),
  reload,
  jet,
  flamer,
  burn,
  fire,
  flesh,
  land,
  hit,
  ouch,
  holdFill,
  holdStop,
  holdClick: () => play("holdClick"),
  swish: named("throw"),
  nuke: (o = {}) => {
    play("nukeRing", o); // (a flashbang's ring in the ears, as the roar starts: the owner, Nov 16)
    return play("nuke", o);
  },
  boomBig: (o = {}) => play("boom", { ...o, k: (o.k ?? 1) * 1.6 }), // (the same boom, about 4 dB louder)
  steam,
  meteor: (fall = 1.4) =>
    setTimeout(() => play("meteor"), Math.max(0, fall - 0.05) * 1000), // (when it lands)
};
for (const n of Object.keys(VOL)) if (!SFX[n]) SFX[n] = named(n);
export const sfx = new Proxy(SFX, { get: (o, k) => o[k] || quiet });

export const dive = quiet;
