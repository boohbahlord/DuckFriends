/* ---------- the game's sounds: real recordings, played from small files ----------
   The owner (Nov 16): "we need sounds for almost anything", every one of them a real, already-made recording (free:
   CC0, assets/sfx/CREDITS.md), with the old 32-bit games' compressed sound, and no pops. tools/sfx/build.py cuts them
   and bakes that sound into small mono files (assets/sfx/, listed in js/sfxlist.js); here they're only played.

   How it stays light (Adam's notes, notes/audio-principles.md in the project's files):
   - one sound clock (AudioContext) for every sound, made at the first tap or key (browsers start sound only then);
   - each file fetched and decoded once, when it's first needed: the countdown, the steps and the jump at the first tap,
     the weapons and the items when a game starts (they work in every mode), Dead Ducks Arcade's own when it starts;
   - a voice is one buffer and one gain: no effects while playing, nothing made on the spot;
   - at most VOICES sounds at once, and a few of each kind (CAP): when full, the oldest of that kind fades out quickly;
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
import { profile } from "./store.js";
import { FILES } from "./sfxlist.js";

/* how loud each sound is, in dB, the owner's to change: 0 plays the file as it is (each file peaks a little under full
   scale). Tiers: the menus' sounds faint, footsteps quiet (a duck's very quiet, a zombie's far quieter), the weapons
   about as loud as the old music, the biggest blasts the loudest */
export const VOL = {
  // the lobby countdown and Dead Ducks Arcade's new round (far off and faint)
  countTick: -13,
  countGo: -12,
  l4round: -14,
  // moving
  step: -19,
  zstep: -27,
  hop: -19,
  jetStart: -19,
  jetLoop: -23,
  jetStop: -18,
  // guns: each its own shot
  handgun: -6,
  revolver: -7,
  smg: -7,
  ak: -9,
  lmg: -8,
  chaingun: -9,
  sniper: -12,
  shotgun: -7,
  pump: -15,
  glauncher: -10,
  bow: -4,
  empty: -8,
  // … and its own reload
  reloadHandgun: -17,
  reloadRevolver: -14,
  reloadSmg: -10,
  reloadAk: -12,
  reloadLmg: -13,
  reloadChaingun: -11,
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
  hitBlade: -11,
  hitBlunt: -10,
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
  chair: -11,
  throw: -11,
  cakeThrow: -11,
  bonk: -13,
  // explosions: one boom for every explosive (the Jaime Bomb plays it louder: SFX.boomBig); the meteor and the nuke
  // are their own, longer and the loudest of all ("more catastrophic", the owner, Nov 16)
  boom: -7,
  meteor: -3,
  nuke: -2,
  nukeRing: -22, // (the ears ringing, under the nuke's roar)
  // the menus: faint
  uiPress: -13,
  uiOn: -23,
  uiOff: -24,
  uiOpen: -24,
  uiClose: -26,
  nope: -16,
  tick: -15,
  done: -23,
  bell: -14,
  ping: -17,
  pop: -16,
  boop: -15,
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
};
/* names some callers use for a sound that is another's (Justin's gunshot is the handgun's) */
const ALIAS = { gunshot: "handgun" };
export const OTHERS = 0.6; // another duck's sounds, against mine
const VOICES = 12, // sounds at once, at most
  CAP = {
    ...{ step: 3, zstep: 3, chaingun: 4, smg: 4, lmg: 4, ak: 3 },
    ...{ hitSmall: 4, hitShot: 3, hitClaw: 3, landSmall: 3, landShot: 3 },
    ...{ l4crack: 3, l4nail: 3, card: 3 },
  }, // … and of one kind (2 for the rest)
  CAP_ANY = 2;
const NEAR = 300, // world px: full up to here …
  FAR = 1500; // … and nothing from here (as Duck Cabin's)
const UI = ["uiPress", "uiOn", "uiOff", "uiOpen", "uiClose", "nope", "tick"];
const GROUPS = {
  first: [
    ...["countTick", "countGo", "step", "hop", ...UI],
    ...["done", "bell", "ping", "pop", "boop"],
  ],
  game: [
    ...["handgun", "revolver", "smg", "ak", "lmg", "chaingun", "sniper"],
    ...["shotgun", "pump", "glauncher", "bow", "empty", "medkit", "adrenaline"],
    ...["jetStart", "jetLoop", "jetStop", "chomp", "sip"],
    ...["knife", "hammer", "chair", "throw", "cakeThrow", "bonk"],
    ...["boom", "meteor"],
    ...Object.keys(VOL).filter((n) => /^(reload|hit|land)[A-Z]/.test(n)),
  ],
  l4dd: [
    ...[
      "l4round",
      "zstep",
      "nuke",
      "nukeRing",
      "l4crack",
      "l4nail",
      "l4groan",
      "l4slot",
    ],
    ...["l4till", "dropIn", "dropGot", "flashOn", "flashOff"],
  ],
  cabin: [
    ...["lampOn", "lampOff", "lever", "fireOut", "candleOut", "relight"],
    ...["tvClick", "card", "chips", "bite", "gulp", "whoosh", "swipe"],
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

/* Volume times Sound effects (Settings) */
const level = () =>
  (profile.settings.sound / 100) * ((profile.settings.sfx ?? 100) / 100);

/* "now" on the sound clock, plus a lead. Firefox only moves currentTime between tasks, so a sound set during a long frame
   read a clock that had stopped and landed in the past: if the clock hasn't moved since I last looked, I add the time
   that has passed since then (at most a quarter of a second) */
let seenCt = -1,
  seenP = 0;
export function soon(a = ac, lead = LEAD) {
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
export const sfxOut = () => (start() ? out : null);
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

/* a voice cut short: a quick fade, then stopped */
function cut(v, t) {
  const g = v.g.gain;
  if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
  else {
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
  }
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
  const k = (o.k ?? 1) * near(o) * 10 ** ((VOL[name] || 0) / 20);
  if (!list.length || k < 0.002 || !level()) return null;
  const t = soon();
  const same = live.filter((v) => v.name === name && !v.cut);
  if (same.length >= (CAP[name] || CAP_ANY)) cut(same[0], t);
  const all = live.filter((v) => !v.cut);
  if (all.length >= VOICES) cut(all[0], t);
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
  src.connect(g).connect(out);
  src.start(t, loops ? FILES[name].loop[0] : 0);
  const v = { name, src, g, t, k };
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
  return {
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
    move(x, y) {
      if (!v || v.cut || !ac) return;
      const t = soon(),
        g = v.g.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(
        (v.k * near({ x, y })) / Math.max(1e-6, near(o)),
        t + 0.1,
      );
    },
  };
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

/* leaving a game: every jet quiet */
export function jetsOff() {
  for (const id of [...jets.keys()]) jet(id, false);
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
};
function reload(w, o = {}) {
  if (!RELOAD[w]) return null;
  const rate =
    o.secs > 0 && RELOAD_S[w]
      ? Math.min(1.5, Math.max(0.85, RELOAD_S[w] / o.secs))
      : 0;
  return play(RELOAD[w], { ...o, ...(rate ? { rate } : {}) });
}
const RELOAD = {
  handgun: "reloadHandgun",
  revolver: "reloadRevolver",
  smg: "reloadSmg",
  ak: "reloadAk",
  lmg: "reloadLmg",
  chaingun: "reloadChaingun",
  sniper: "reloadSniper",
  shotgun: "reloadShotgun",
  glauncher: "reloadGlauncher",
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
function flesh(kind) {
  fleshAt = performance.now();
  play(FLESH[kind] || "hitSmall");
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
  revolver: "landBig",
};
const NO_LAND = ["grenade", "lgren", "fireball", "controller", "chair"]; // (they land with their own sounds, or none)
const land = (k) => NO_LAND.includes(k) || play(LAND[k] || "landSmall");
/* a duck hurt, when nothing bled to make the sound (a kill by command, Invulnerability's flash): looked at a moment
   later, so a hit that bleeds isn't heard twice */
const hit = () =>
  setTimeout(
    () => performance.now() - fleshAt > 150 && play("hitBig", { k: 0.7 }),
    30,
  );

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
const named = (name) => (o) => play(name, o && typeof o === "object" ? o : {}); // (some callers pass a number)
/* every sound the game asks for by name. The older names stay (bang was every pistol, tat every quick gun); a name
   with no recording yet is silent, to come in the next batches */
const SFX = {
  count: (last) => play(last ? "countGo" : "countTick"),
  bang: named("handgun"),
  tat: named("smg"),
  reload,
  jet,
  flesh,
  land,
  hit,
  swish: named("throw"),
  nuke: (o = {}) => {
    play("nukeRing", o); // (a flashbang's ring in the ears, as the roar starts: the owner, Nov 16)
    return play("nuke", o);
  },
  boomBig: (o = {}) => play("boom", { ...o, k: (o.k ?? 1) * 1.6 }), // (the same boom, about 4 dB louder)
  meteor: (fall = 1.4) =>
    setTimeout(() => play("meteor"), Math.max(0, fall - 0.05) * 1000), // (when it lands)
};
for (const n of Object.keys(VOL)) if (!SFX[n]) SFX[n] = named(n);
export const sfx = new Proxy(SFX, { get: (o, k) => o[k] || quiet });

/* the start screen's dive: not yet (the next batches) */
export const diveVoice = quiet;
export const dive = quiet;
