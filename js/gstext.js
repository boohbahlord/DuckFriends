/* ---------- Game Settings: what a setting says, what is greyed, which rows the mode has ----------
   Moved out of gamesettings.js to keep that file small (a pure move; the owner's, Nov 22). */
import { modesFor, modeOf, CABIN_MODES } from "./modes.js";

import { mapName } from "./maps.js";

import { randomPool, GEN_RULES, genVal } from "./rules.js";

import { downFor } from "./hangout/death.js";

import { BY_MODE, GEN_SWITCH, HOST } from "./gssettings.js";

/* Shelter Sky & Null's own setting, under the Map page's rows: shown when the host picked it (the vote and Random have
   black and white as a form of its own) */
export const GREY = {
  k: "mapGrey",
  n: "Colors",
  c: [
    [0, "Colors"],
    [1, "Black and white"],
  ],
  d: "Black and white: the map is shown in black, white and greys.",
};
export const showsCollage = (s) =>
  !CABIN_MODES.includes(s.options.mode) &&
  !s.options.mapPick &&
  s.options.map === "collage";
/* Euclid's Squares' own setting, shown when the host picked it (Vote Maps and Random have the zoom as an entry of its
   own) */
export const ZOOM = {
  k: "mapZoom",
  n: "Zoom",
  c: [
    [0, "Still"],
    [1, "Endless zoom"],
  ],
  d: "Endless zoom: the map keeps zooming into its tiny squares, forever.",
};
/* Vote Mode & Map's own settings, on its own page (the first row of Game Settings, owner 2026-11-04): each vote on or
   off, and Vote return */
export const VOTE_SETS = [
  {
    k: "modePick",
    n: "Vote for game mode",
    c: [
      ["vote", "On"],
      ["", "Off"],
    ],
    d: "Off: the host's game is played, and only the map is voted on.",
  },
  {
    k: "mapPick",
    n: "Vote for map",
    c: [
      ["vote", "On"],
      ["", "Off"],
    ],
    d: "Off: the host's map is played, and only the game mode is voted on.",
  },
  {
    k: "voteBack",
    n: "Vote return",
    c: [
      [1, "1"],
      [2, "2"],
      [3, "3"],
      [4, "4"],
      [5, "5"],
      [6, "6"],
      ["r", "Random"],
      [0, "Off"],
    ],
    d: "The games played before both votes come back. A round is a game; a whole Hangout or Dead Ducks Arcade counts as one. Random: 1 to 6, picked again each time.",
  },
];
export const voting = (s) =>
  s.options.modePick === "vote" || s.options.mapPick === "vote";
/* the row of the map the host picked: a variation in another form (Zoom, Black and white) is the map with its setting
   on; every variation sits under the maps (owner, Nov 16) */
export const picked = (o) =>
  o.map === "euclid" && o.mapZoom
    ? "euclidzoom"
    : o.map === "collage" && o.mapGrey
      ? "collagebw"
      : o.map;
export const showsZoom = (s) =>
  !CABIN_MODES.includes(s.options.mode) &&
  !s.options.mapPick &&
  s.options.map === "euclid";

/* the plain words for the rows that aren't a game, a map or a setting */
export const PICK_TEXT = {
  vote: "After the start's countdown, every player votes in a window over the whole screen: first for the game mode (1:05), then for the map (0:20; not for Duck Cabin's games or Mad God Justin). Click once to vote; the dice is a random pick. Once the majority has voted (the room's vote share), the clock drops to 0:06. The most votes win; a tie is a random pick between the tied ones.",
  modeRandom:
    "A new game every round. Every game is played once before the order is reshuffled; True Random, under Game Options, lets any game come next. Dead Ducks Arcade and games that need more players than the room has are left out. Hangout plays on Duck Cabin with its own time limit (Game Options); every other game stays on the map picked.",
  mapRandom:
    "A random map each time the host starts. Duck Cabin comes only with its own games.",
};
export const CABIN_TIP =
  "A log cabin at night with a deck, a pool and a campfire. It comes with its own games: picking it lists them.";

/* a settings change as the chat says it (rules.js logs the keys): [the setting's name, the value's words], or null for
   a key players don't see as a setting */
export function settingText(k, v) {
  if (k === "mode") return ["Game mode", modeOf(v).name];
  if (k === "map") return ["Map", mapName(v)];
  if (k === "modePick")
    return v
      ? ["Game mode", v === "vote" ? "Vote for game mode" : "Random"]
      : null;
  if (k === "mapPick")
    return v ? ["Map", v === "vote" ? "Vote for map" : "Random"] : null;
  if (k === "max") return ["Players up to", String(v)];
  if (k.startsWith("mr:")) {
    // a Mode Rule: "mr:<mode>:<setting>"
    const [, m, key] = k.split(":"),
      x = settingText(key, v);
    return x
      ? [
          `${modeOf(m).name}'s Mode Rules: ${x[0]}`,
          v === "same" ? "Same as General" : x[1],
        ]
      : null;
  }
  if (k === "modesOff")
    return [
      "Modes in Random & Vote",
      (v || []).length
        ? `all but ${v.map((id) => modeOf(id).name).join(", ")}`
        : "All",
    ];
  const o = [
      ...HOST,
      GEN_SWITCH,
      GREY,
      ZOOM,
      ...VOTE_SETS,
      ...Object.values(BY_MODE).flat(),
    ].find((x) => x.k === k),
    c = o && (o.c || []).find(([x]) => String(x) === String(v));
  return o ? [o.n, c ? c[1] : String(v)] : null;
}

/* on a phone the preview keeps only its picture, and the words go under the row they're about, one row at a time
   (Democracy of Ducklings does the same): at is that row (or setting), or null for none */
export function infoUnder(W, at) {
  const menu = W.querySelector(".arm-menu");
  for (const x of menu.querySelectorAll(".gs-info")) x.remove();
  const stage = W.querySelector(".gs-stage"),
    t = stage.querySelector(".gs-text");
  stage.classList.toggle(
    "gs-nopic",
    !stage.querySelector(".gs-pic:not(.empty)"),
  );
  if (!t || !at) return;
  const li = at.closest("li"),
    box = document.createElement(li ? "li" : "div");
  box.className = "gs-info";
  box.setAttribute("aria-hidden", "true"); // (the same words as the preview's, which screen readers already have)
  box.innerHTML = t.innerHTML;
  (li || at).after(box);
}

/* which games a setting is shown for: the picked one, or every game Vote Game Mode or Random can land on */
export const games = (s) =>
  s.options.modePick === "vote"
    ? modesFor(s).map((m) => m.id)
    : s.options.modePick === "random"
      ? randomPool(s)
      : [s.options.mode || "aod"];
export const valueOf = (s, k) =>
  k === "downMs"
    ? downFor(s)
    : GEN_RULES.includes(k)
      ? genVal(s, k) // (the General Rules as set; the options hold the picked mode's)
      : s.options[k];
/* the General Rules that count in one game mode, each as its Mode Rule */
export const genFor = (s, g) =>
  HOST.filter(
    (x) =>
      GEN_RULES.includes(x.k) &&
      (x.when ? x.when(s) : true) &&
      !(x.off || []).includes(g) &&
      (!x.only || x.only.includes(g)),
  );
