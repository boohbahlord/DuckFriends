/* ---------- Game Settings: the whole screen, like Customize ----------
   On the left, plain rows in three pages: Game mode, Map, then Game Options; the back arrow goes up a page, the X closes.
   On the right, a preview of the row under the pointer: the game on the picked map, the map large with the game's board
   on it (Duck Cabin as the real map, one picture of all of it), or a setting's description. The host (or sudo) picks;
   everyone else looks. With Vote Game Mode or Vote Maps on, every player's click on a game or a map is their vote. */
import { esc, openWindow, setHTML } from "./ui.js";
import { gameArtSVG, artBackdrop } from "./art.js";
import { MODES, modeOf, CABIN_MODES, CATS } from "./modes.js";
import { MAPS, mapName } from "./maps.js";
import { OPTIONS_DEFAULT, isSudo, tally, randomPool, dodOn } from "./rules.js";
import { downFor } from "./hangout/death.js";
import { profile } from "./store.js";
import { collageMini } from "./collage.js";

/* ---------- every setting: its key, its name, its choices, its category and what it does ----------
   off: the games it doesn't apply to (it's hidden there). The four categories, under Host Settings and under each game */
const CAT_NAMES = {
  rules: "General Rules",
  time: "Durations",
  round: "Round Settings",
  more: "Additional Settings",
};
const ON_OFF = [
  [0, "Off"],
  [1, "On"],
];
const NO_TURNS = ["hang", "l4dd", "vdd"];
const HOST = [
  {
    k: "share",
    n: "Turn ends when done",
    c: [
      [0.5, "Half"],
      [0.67, "2 of 3"],
      [0.75, "3 of 4"],
      [1, "Everyone"],
    ],
    cat: "rules",
    off: NO_TURNS,
    d: "The share of players who must finish before the catch-up timer starts. When every player has finished, the turn ends at once.",
  },
  {
    k: "unvoteStops",
    n: "Unvoting stops the countdown",
    c: [
      [0, "No"],
      [1, "Yes"],
    ],
    cat: "rules",
    off: ["mgj", "quack", ...NO_TURNS],
    d: "Whether taking a vote back below the needed share stops the catch-up timer. With No, a timer that has started runs out.",
  },
  {
    k: "freeRoam",
    n: "Answering",
    c: [
      [0, "Lock answers"],
      [1, "Free roam"],
    ],
    cat: "rules",
    off: ["mgj", "sc", "quack", "law", "dunce", ...NO_TURNS],
    d: "Lock answers: a player ends their turn to lock where their duck stands. Free roam: there is no locking and no talk-it-over step, and where each duck stands when the turn ends is its answer.",
  },
  {
    k: "justin",
    n: "Justin",
    c: ON_OFF,
    cat: "rules",
    off: ["mgj", ...NO_TURNS],
    d: "Justin from Duck Cabin walks the board, talks and shoots now and then. He never votes and never counts toward a turn.",
  },
  {
    k: "mgjBoard",
    n: "Mad God Justin",
    c: ON_OFF,
    cat: "rules",
    off: ["mgj", ...NO_TURNS],
    need: "justin",
    when: (s) => "mgjBoard" in s.options,
    d: "Needs Justin on. Justin has 10 HP. A player who damages him becomes his target for 10 s, and he uses his Mad God Justin attacks on them, without the electric walls. Players a game mode keeps safe are never targeted. At 0 HP he is knocked down like any duck and comes back after the same time.",
  },
  {
    k: "invuln",
    n: "Invulnerability",
    c: ON_OFF,
    cat: "rules",
    d: "Players take no damage and are never knocked down. Bullets, blades, grenades, Justin's attacks and zombies only flash a duck red.",
  },
  {
    k: "noChat",
    n: "No Chat",
    c: ON_OFF,
    cat: "rules",
    d: "Turns off text chat for every player, the host included, in the lobby and in the game. The game's own messages still show.",
  },
  {
    k: "noTerm",
    n: "No Terminal",
    c: ON_OFF,
    cat: "rules",
    d: "Turns off the command line for every player, the host included, in the lobby and in the game.",
  },
  {
    k: "lateJoin",
    n: "Players who join mid-game",
    c: [
      ["play", "Play at once"],
      ["watch", "Watch until the next round"],
    ],
    cat: "rules",
    off: NO_TURNS,
    d: "Play at once: a player who joins mid-game plays right away. Watch until the next round: they wait for it.",
  },
  {
    k: "textMax",
    n: "Text length limit",
    c: [
      [80, "80"],
      [140, "140"],
      [200, "200"],
      [280, "280"],
    ],
    cat: "rules",
    only: ["aod", "wyr", "ddr", "law", "dunce"],
    d: "The most characters a question, topic or take can have.",
  },
  {
    k: "answerTime",
    n: "Answer timer",
    c: [
      [0, "Off"],
      [30, "30 s"],
      [60, "60 s"],
      [90, "90 s"],
    ],
    cat: "time",
    off: ["mgj", "bb", "sc", "quack", "law", "dunce", ...NO_TURNS],
    d: "The time to answer each question. A question's writer can choose another time for it.",
  },
  {
    k: "catchUp",
    n: "Catch-up timer",
    c: [
      [0, "Off"],
      [15, "15 s"],
      [30, "30 s"],
      [45, "45 s"],
    ],
    cat: "time",
    off: ["mgj", "quack", ...NO_TURNS],
    d: "The time the remaining players get once enough players have voted. Off: the turn ends as soon as enough players have voted.",
  },
  {
    k: "writeCatch",
    n: "Writing catch-up timer",
    c: [
      [0, "Off"],
      [15, "15 s"],
      [30, "30 s"],
      [45, "45 s"],
      [60, "60 s"],
    ],
    cat: "time",
    off: ["mgj", "quack", ...NO_TURNS],
    d: "The time the last writers get once enough players have sent theirs. Off: writing ends as soon as enough players have sent theirs.",
  },
  {
    k: "submitTime",
    n: "Writing time limit",
    c: [
      [0, "Off"],
      [60, "60 s"],
      [90, "90 s"],
      [120, "120 s"],
      [132, "2:12"],
    ],
    cat: "time",
    off: ["mgj", "sc", "quack", ...NO_TURNS],
    d: "The time limit for writing questions, topics and takes. 2:12 by default in every mode except Bicker Brackets.",
  },
  {
    k: "downMs",
    n: "Knocked down for",
    c: [
      [0, "None"],
      [500, "0.5 s"],
      [1000, "1 s"],
      [2000, "2 s"],
      [3000, "3 s"],
      [5000, "5 s"],
      [6000, "6 s"],
    ],
    cat: "time",
    off: ["mgj"],
    d: "How long a duck that is shot, stabbed or killed stays down before it can move. 1 s on the boards and 6 s in Duck Cabin unless set.",
  },
  {
    k: "order",
    n: "Question order",
    c: [
      ["random", "Random"],
      ["rotate", "Rotating"],
    ],
    cat: "round",
    off: ["mgj", "bb", "sc", "quack", "dunce", ...NO_TURNS],
    d: "The order of each round's questions. Rotating goes through the players in turn.",
  },
  {
    k: "discuss",
    n: "Discussion round",
    c: ON_OFF,
    cat: "round",
    off: ["mgj", "sc", "quack", ...NO_TURNS],
    d: "A step after each vote to look at where everyone stood and talk it over.",
  },
  {
    k: "stats",
    n: "Stats screen",
    c: [
      [1, "On"],
      [0, "Off"],
    ],
    cat: "round",
    off: ["mgj"],
    d: "The stats after each round. Off: the next round starts at once, and in Story Chain the story goes on.",
  },
  {
    k: "trueRandom",
    n: "True Random",
    c: ON_OFF,
    cat: "round",
    when: (s) => s.options.modePick === "random",
    d: "Any game mode can come next, including the one just played. Off: every game mode is played once before the order is reshuffled.",
  },
  {
    k: "lowGravity",
    n: "Jumps",
    c: [
      [0, "Normal"],
      [1, "Low gravity"],
    ],
    cat: "more",
    d: "Low gravity: jumps go higher and fall more slowly.",
  },
  {
    k: "walk",
    n: "Walking speed",
    c: [
      ["slow", "Slow"],
      ["normal", "Normal"],
      ["fast", "Fast"],
    ],
    cat: "more",
    d: "How fast ducks walk.",
  },
  {
    k: "fun",
    n: "Silly commands",
    c: [
      [1, "On"],
      [0, "Off"],
    ],
    cat: "more",
    d: "The lightning, love, kill and hotdog commands in the command line.",
  },
  {
    k: "botWait",
    n: "Computers wait",
    c: [
      [5, "5 s"],
      [15, "15 s"],
      [30, "30 s"],
      [60, "60 s"],
    ],
    cat: "more",
    when: (s) => s.test,
    d: "How long computer players wait before acting in each step. TEST rooms only.",
  },
];
/* each game's own settings */
const NO_OWN = {
  k: "noOwn",
  n: "Don't get your own prompt",
  c: ON_OFF,
  cat: "rules",
};
const HIDE_NAMES = {
    k: "hideNames",
    n: "Hide names while answering",
    c: ON_OFF,
    cat: "rules",
    d: "Name tags stay hidden until the turn ends.",
  },
  SHOW_WRITER = {
    k: "showWriter",
    n: "Show the writer",
    c: ON_OFF,
    cat: "rules",
    d: "The name of the question's writer is shown after the vote.",
  };
const BY_MODE = {
  aod: [
    HIDE_NAMES,
    SHOW_WRITER,
    {
      k: "aodColors",
      n: "Board colors",
      c: [
        ["rainbow", "Rainbow"],
        ["gr", "Green and red"],
      ],
      cat: "more",
      d: "Rainbow: seven colors from dark red to blue. Green and red: the agree columns in shades of green, the disagree columns in shades of red, and Neutral slowly fading between black, grey and white.",
    },
  ],
  wyr: [HIDE_NAMES, SHOW_WRITER],
  ddr: [HIDE_NAMES],
  bb: [
    {
      k: "bbSeeds",
      n: "Contenders",
      c: [
        ["t8", "8 in all"],
        ["t12", "12 in all"],
        ["t16", "16 in all"],
        ["t32", "32 in all"],
        ["t64", "64 in all"],
        ["p1", "1 each"],
        ["p2", "2 each"],
        ["p3", "3 each"],
        ["p4", "4 each"],
      ],
      cat: "round",
      d: "How many contenders the bracket has: a number shared among the players, or a number for each player.",
    },
    {
      k: "bbTopic",
      n: "Topic",
      c: [
        ["vote", "Write and vote"],
        ["random", "Random"],
      ],
      cat: "round",
      d: "Write and vote: every player writes a topic and the room votes on them. Random: a topic from the list.",
    },
    {
      k: "bbBlind",
      n: "Writers",
      c: [
        [0, "Shown"],
        [1, "Hidden until out"],
      ],
      cat: "rules",
      d: "Hidden until out: the writer of a contender stays secret until it is knocked out or wins.",
    },
    {
      k: "bbReview",
      n: "Review each round",
      c: ON_OFF,
      cat: "round",
      d: "On: the bracket is shown after every round of matches. Off: only the champion's bracket is shown.",
    },
    {
      k: "bbTimer",
      n: "Match vote timer",
      c: [
        [0, "None"],
        [10, "10 s"],
        [30, "30 s"],
        [60, "60 s"],
      ],
      cat: "time",
      d: "The time a match vote may take. None: a vote waits for every player. A tie goes to a revote or a coin toss.",
    },
  ],
  sc: [
    {
      k: "scTime",
      n: "Writing time",
      c: [
        [0, "Off"],
        [60, "60 s"],
        [90, "90 s"],
        [120, "120 s"],
      ],
      cat: "time",
      d: "The time each writer gets for a line. When it runs out, whatever is typed is sent. Off: no limit.",
    },
    {
      k: "scVote",
      n: "Voting",
      c: [
        ["auto", "Auto"],
        [1, "On"],
        [0, "Off"],
      ],
      cat: "round",
      d: "The vote on the favorite line and secret word after each paragraph. Auto: off with 2 or 3 players, on with 4 or more.",
    },
    {
      k: "scLines",
      n: "Lines per player",
      c: [
        [1, "1"],
        [2, "2"],
        [3, "3"],
        [4, "4"],
      ],
      cat: "round",
      d: "The number of lines each player writes before the paragraph ends.",
    },
  ],
  quack: [
    {
      k: "wqPicker",
      n: "Secret word",
      c: [
        ["player", "A random player picks it"],
        ["list", "From the built-in list"],
      ],
      cat: "rules",
      d: "A random player picks it: each round a random player who isn't the Quack picks the word and its category. From the built-in list: the game picks a word.",
    },
    {
      k: "wqPickTime",
      n: "Time to pick the word",
      c: [
        [30, "30 s"],
        [60, "60 s"],
        [90, "90 s"],
      ],
      cat: "time",
      d: "When it runs out, whatever the picker typed is used, or a word from the list.",
    },
    {
      k: "wqQuacks",
      n: "Quacks",
      c: [
        [1, "1"],
        [2, "2 (6+ players)"],
      ],
      cat: "rules",
      d: "The number of Quacks. Two Quacks need 6 or more players.",
    },
    {
      k: "wqTimer",
      n: "Vote timer",
      c: [
        [0, "None"],
        [30, "30 s"],
        [60, "60 s"],
        [90, "90 s"],
      ],
      cat: "time",
      d: "The time a vote may take. None: a vote waits for every player.",
    },
  ],
  law: [
    {
      k: "lawDef",
      n: "Defense attorney",
      c: [
        ["random", "Random"],
        ["writer", "Writer picks"],
        ["vote", "Room votes"],
      ],
      cat: "rules",
      d: "Who argues for each topic: a random player other than its writer, a player the writer picks, or a player the room votes for.",
    },
    {
      k: "lawOff",
      n: "Offense attorney",
      c: [
        ["random", "Random"],
        ["writer", "Writer picks"],
        ["vote", "Room votes"],
      ],
      cat: "rules",
      d: "Who argues against each topic, the writer included: picked at random, by the writer, or by a vote of the room.",
    },
    {
      k: "lawClose",
      n: "Closing arguments",
      c: [
        [30, "30 s"],
        [60, "1 min"],
        [120, "2 min"],
      ],
      cat: "time",
      d: "When the jury is split, the time the attorneys get to win it over. The larger side then wins.",
    },
    { ...NO_OWN, d: "A player never argues a topic they wrote." },
  ],
  dunce: [
    {
      k: "dunceTime",
      n: "Take timer",
      c: [
        [0, "Off"],
        [60, "1 min"],
        [120, "2 min"],
        [180, "3 min"],
        [300, "5 min"],
      ],
      cat: "time",
      d: "The time the defender gets after the 15 s grace period. Off: the turn ends once enough players have voted and the catch-up timer runs out.",
    },
    {
      k: "dunceTakes",
      n: "Takes",
      c: [
        ["random", "Random"],
        ["own", "Write your own"],
      ],
      cat: "rules",
      d: "Random: takes are handed out at random and can go back to their writer. Write your own: each player defends their own take.",
    },
    {
      ...NO_OWN,
      d: "A player never defends a take they wrote. Write your own overrides this.",
    },
  ],
  mgj: [
    {
      k: "mgjHp",
      n: "Player HP",
      c: [
        [0, "Off"],
        [1, "1"],
        [5, "5"],
        [6, "6"],
        [10, "10"],
        [15, "15"],
      ],
      cat: "rules",
      d: "The HP of each duck. A hit from Justin takes 1 HP, and nothing hurts the duck for a second after. The last one knocks it down until a medkit or the fight's end. Off: one hit knocks a duck down for 5 s.",
    },
    {
      k: "mgjTime",
      n: "Time to beat him",
      c: [
        [105, "1:45"],
        [135, "2:15"],
        [165, "2:45"],
      ],
      cat: "time",
      d: "The time to bring Justin to 0 HP, plus 4 s for every player. His meteor adds 30 s. Only wins at 2:15 count toward the lightning eyes.",
    },
  ],
  vdd: [
    {
      k: "vdTime",
      n: "Date timer",
      c: [
        [0, "Off"],
        [60, "1 min"],
        [90, "1:30"],
        [120, "2 min"],
      ],
      cat: "time",
      d: "The length of each date once The Date presses Start timer. The timer can be paused. Off: a date lasts until The Date presses Next duck, after 6 s of grace.",
    },
  ],
  hang: [
    {
      k: "ghosts",
      n: "Ghosts",
      c: ON_OFF,
      cat: "more",
      d: "Once its knocked-down time is up, a duck's ghost walks about while its body lies there. A ghost can't be hit or use anything. Space brings it back.",
    },
    {
      k: "ghostBusy",
      n: "No ghosts while busy",
      c: [
        [1, "On"],
        [0, "Off"],
      ],
      cat: "more",
      d: "With Ghosts on, a duck busy with the chalk, the piano, the guestbook, a card table or a seat gets up instead of becoming a ghost.",
    },
  ],
};
/* Shelter Sky & Null's own setting, under the Map page's rows: shown when it's the map, or when Vote Maps or Random could
   land on it */
const GREY = {
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
  (s.options.map === "collage" || !!s.options.mapPick);

/* the plain words for the rows that aren't a game, a map or a setting */
const PICK_TEXT = {
  modeVote:
    "Every player votes for a game. When the host starts, the most votes win; a tie is a random pick between the tied games. A Cabin game that wins moves the room to Duck Cabin.",
  modeRandom:
    "A new game every round. Every game is played once before the order is reshuffled; True Random, under Game Options, lets any game come next. Hangout, Quacky Zombies and games that need more players than the room has are left out. The map stays the one picked.",
  mapVote:
    "Every player votes for a map. When the host starts, the most votes win; a tie is a random pick between the tied maps. Duck Cabin comes only with its own games.",
  mapRandom:
    "A random map each time the host starts. Duck Cabin comes only with its own games.",
};
const CABIN_TIP =
  "A log cabin at night with a deck, a pool and a campfire. It comes with its own games: picking it picks Hangout.";

/* which games a setting is shown for: the picked one, or every game Vote Game Mode or Random can land on */
const games = (s) =>
  s.options.modePick === "vote"
    ? MODES.map((m) => m.id)
    : s.options.modePick === "random"
      ? randomPool(s)
      : [s.options.mode || "aod"];
const valueOf = (s, k) => (k === "downMs" ? downFor(s) : s.options[k]);

/* ---------- the pictures in the preview box ---------- */
/* a game's board over a map, drawn simply and see-through as in a game: Agree or Disagree's seven columns, the two tiles
   of the two-sided games (with the middle strip, and the circle for Lawyering and Duncelation), Story Chain's page */
function boardSketch(mode) {
  const x0 = 26,
    y0 = 46,
    w = 428,
    h = 200,
    tile = (x, tw, fill) =>
      `<rect x="${x}" y="${y0}" width="${tw}" height="${h}" rx="6" style="fill:${fill}" fill-opacity=".5" stroke="#1c1c28" stroke-opacity=".35"/>`;
  if (mode === "aod")
    return Array.from({ length: 7 }, (_, i) =>
      tile(x0 + (i * w) / 7 + 1, w / 7 - 2, `var(--c${i + 1})`),
    ).join("");
  const two = {
    wyr: ["#2fa4ff", "#ff8c2b", 0.46],
    ddr: ["var(--c6)", "var(--c2)", 0.46],
    bb: ["var(--c7)", "var(--c3)", 0.46],
    law: ["var(--c2)", "var(--c7)", 0.42],
    dunce: ["var(--c2)", "var(--c6)", 0.42],
  }[mode];
  if (two) {
    const [a, b, m] = two,
      side = w * m,
      ring =
        m < 0.45
          ? `<circle cx="${x0 + w / 2}" cy="${y0 + h / 2}" r="26" fill="#ffffff22" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`
          : "";
    return tile(x0, side, a) + tile(x0 + w - side, side, b) + ring;
  }
  if (mode === "sc")
    return `<rect x="120" y="${y0}" width="240" height="${h}" rx="10" fill="#fff" fill-opacity=".72" stroke="#1c1c28" stroke-opacity=".35"/>${[
      0, 1, 2, 3, 4,
    ]
      .map(
        (i) =>
          `<rect x="140" y="${y0 + 22 + i * 34}" width="${[190, 160, 200, 150, 120][i]}" height="7" rx="3.5" fill="#1c1c28" fill-opacity=".45"/>`,
      )
      .join("")}`;
  return "";
}
/* a map's picture: the lobby's (art.js), my collage map's real drawing, and Tiles' checkerboard (8 tiles across) */
const backOf = (id) =>
  id === "collage"
    ? `<image href="${collageMini().match(/src="([^"]+)"/)[1]}" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>`
    : id === "tiles"
      ? '<defs><pattern id="gstiles" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#fff"/><rect width="60" height="60" fill="#000"/><rect x="60" y="60" width="60" height="60" fill="#000"/></pattern></defs><rect width="480" height="270" fill="url(#gstiles)"/>'
      : artBackdrop(id);
/* the map large: Duck Cabin as the real map (one picture of all of it; dark with the power cut in Left 4 Dead Ducks), any
   other map with the picked game's board on it */
function mapPic(s, id, mode) {
  if (id === "cabin")
    return `<img class="gs-cabin${mode === "l4dd" ? " dark" : ""}" src="assets/maps/duck-cabin.jpg" alt="Duck Cabin" draggable="false">`;
  const grey = id === "collage" && s.options.mapGrey ? " grey" : "";
  return `<svg class="gs-map${grey}" viewBox="0 0 480 270" role="img" aria-label="${esc(mapName(id))}"><g class="gs-back">${backOf(id)}</g>${CABIN_MODES.includes(mode) ? "" : boardSketch(mode)}</svg>`;
}
const gamePic = (s, mode) =>
  gameArtSVG({
    width: 640,
    duck: profile.duck,
    map: CABIN_MODES.includes(mode)
      ? "cabin"
      : s.options.mapPick || s.options.map === "cabin"
        ? "board"
        : s.options.map || "board",
    mode,
  });

/* ---------- the screen ---------- */
const openFolds = new Set(["host:rules", "mode:rules"]); // (the categories left open, from one visit to the next)
export function openGameSettings(R, start = null) {
  let page = start, // null (the three pages) | mode | cat:<kind> | map | opts
    peek = null, // what the preview shows: { kind: mode | map | set | text, … }
    W = null,
    off = null;
  const S = () => R.state,
    host = () =>
      isSudo(S(), R.me) || (dodOn(S(), "settings") && !!S().players[R.me]); // (Democracy of Ducklings: everyone can)
  const head = (title) =>
    `<header class="arm-h">${page ? '<button type="button" class="arm-back" data-a="back" aria-label="Back">‹</button>' : '<span class="arm-mark">◆</span>'}<h2>${esc(title)}</h2></header>`;
  const row = (attrs, label, val = "", on = false, dis = false) =>
    `<li><button type="button" class="arm-row" ${attrs} aria-pressed="${on}"${dis ? ' aria-disabled="true"' : ""}><span>${esc(label)}</span><span class="val">${esc(val)}</span></button></li>`;
  const LINE = '<li class="arm-line" aria-hidden="true"></li>';
  const votes = (n) => (n ? `${n} vote${n === 1 ? "" : "s"}` : "");
  const modeVal = (s) =>
    s.options.modePick === "vote"
      ? "Vote Game Mode"
      : s.options.modePick === "random"
        ? s.options.trueRandom
          ? "True Random"
          : "Random"
        : modeOf(s.options.mode).name;
  const mapVal = (s) =>
    s.options.mapPick === "vote"
      ? "Vote Maps"
      : s.options.mapPick === "random"
        ? "Random"
        : mapName(s.options.map);

  /* a setting as the old Game options showed it: its name over its choices */
  const tiles = (s, o) => {
    const faded = o.need && !+s.options[o.need], // (it needs another setting on first: shown faded)
      ro = host() && !faded ? "" : ' aria-disabled="true"',
      cur = valueOf(s, o.k),
      c =
        o.k === "downMs" && s.options.mode !== "hang"
          ? o.c.filter((x) => x[0] !== 6000)
          : o.c;
    return `<div class="sect gs-set${faded ? " faded" : ""}" data-d="${esc(o.k)}"><h3>${esc(o.n)}</h3><div class="row">${c
      .map(
        ([v, n]) =>
          `<button type="button" class="tile" data-k="${o.k}" data-v="${v}" aria-pressed="${cur === v}"${ro}>${esc(n)}</button>`,
      )
      .join("")}</div></div>`;
  };
  const room = (s) => {
    const dis = host() ? "" : " disabled";
    return `<div class="sect gs-set" data-d="max"><h3>Room</h3><div class="row"><label class="numfield">Players up to <select data-k="max"${dis}>${[
      2, 3, 4, 5, 6, 7, 8, 10, 12, 16,
    ]
      .filter((n) => n >= s.seat.length)
      .map((n) => `<option${n === s.max ? " selected" : ""}>${n}</option>`)
      .join("")}</select></label>${
      s.test
        ? `<label class="numfield">Computers <select data-k="computers"${dis}>${Array.from(
            { length: s.max },
            (_, n) => n,
          )
            .map(
              (n) =>
                `<option${n === s.seat.filter((id) => s.players[id].bot).length ? " selected" : ""}>${n}</option>`,
            )
            .join("")}</select></label>`
        : ""
    }</div></div>`;
  };
  /* the four categories under a heading; a category with nothing in it isn't shown */
  const folds = (s, list, pre, extra = {}) =>
    Object.entries(CAT_NAMES)
      .map(([cat, name]) => {
        const body =
          list
            .filter((o) => o.cat === cat)
            .map((o) => tiles(s, o))
            .join("") + (extra[cat] || "");
        const k = `${pre}:${cat}`;
        return body
          ? `<details class="arm-fold gs-fold" data-fold="${esc(k)}"${openFolds.has(k) ? " open" : ""}><summary>${name}</summary>${body}</details>`
          : "";
      })
      .join("");

  function menuHTML() {
    const s = S(),
      me = R.me,
      o = s.options;
    if (!page)
      return (
        head("Game Settings") +
        `<div class="arm-body"><ul class="arm-list">${row('data-p="mode"', "Game mode", modeVal(s))}${row('data-p="map"', "Map", mapVal(s))}${row('data-p="opts"', "Game Options", host() ? "Edit" : "View")}</ul></div>`
      );
    if (page === "mode") {
      const cur = modeOf(o.mode).cat;
      return (
        head("Game mode") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="mode" data-v="vote"', "Vote Game Mode", "", o.modePick === "vote", !host() || dodOn(s, "modes"))}${row('data-pick="mode" data-v="random"', "Random", "", o.modePick === "random", !host() || dodOn(s, "modes"))}${LINE}${CATS.map(
          ([id, name]) =>
            row(
              `data-cat="${id}"`,
              name,
              !o.modePick && cur === id ? modeOf(o.mode).name : "",
            ),
        ).join("")}</ul></div>`
      );
    }
    if (page.startsWith("cat:")) {
      const cat = page.slice(4),
        voting = o.modePick === "vote",
        n = tally(s, s.modeVotes),
        mine = (s.modeVotes || {})[me];
      return (
        head(CATS.find((c) => c[0] === cat)[1]) +
        `<div class="arm-body"><ul class="arm-list">${MODES.filter(
          (m) => m.cat === cat,
        )
          .map((m) =>
            row(
              `data-mode="${m.id}"`,
              m.name,
              voting ? votes(n[m.id]) : "",
              voting ? mine === m.id : !o.modePick && o.mode === m.id,
              !voting && !host(),
            ),
          )
          .join("")}</ul></div>`
      );
    }
    if (page === "map") {
      const voting = o.mapPick === "vote",
        n = tally(s, s.mapVotes),
        mine = (s.mapVotes || {})[me];
      return (
        head("Map") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="map" data-v="vote"', "Vote Maps", "", o.mapPick === "vote", !host() || dodOn(s, "maps"))}${row('data-pick="map" data-v="random"', "Random", "", o.mapPick === "random", !host() || dodOn(s, "maps"))}${row('data-map="cabin"', "Duck Cabin", "", o.map === "cabin", !host() || dodOn(s, "maps"))}${LINE}${MAPS.map(
          ([id, name]) =>
            row(
              `data-map="${id}"`,
              name,
              voting ? votes(n[id]) : "",
              voting ? mine === id : !o.mapPick && o.map === id,
              !voting && !host(),
            ),
        ).join(
          "",
        )}</ul>${showsCollage(s) ? `<h3 class="gs-sub">${esc(mapName("collage"))}</h3>${tiles(s, GREY)}` : ""}</div>`
      );
    }
    /* Game Options: Host Settings for every game, then Game mode Settings for the picked one (or each one a vote or
       Random can land on) */
    const gs = games(s),
      hostList = HOST.filter(
        (x) =>
          (x.when ? x.when(s) : true) &&
          gs.some(
            (g) =>
              !(x.off || []).includes(g) && (!x.only || x.only.includes(g)),
          ),
      );
    const own = gs
      .filter((g) => BY_MODE[g])
      .map(
        (g) =>
          `${gs.length > 1 ? `<h3 class="gs-sub">${esc(modeOf(g).name)}</h3>` : ""}${folds(s, BY_MODE[g], `mode:${g}`)}`,
      )
      .join("");
    return (
      head("Game Options") +
      `<div class="arm-body gs-opts">${host() ? "" : '<p class="small dim gs-ro">Only the host (or sudo) changes these.</p>'}<h3 class="gs-h">Host Settings</h3>${folds(s, hostList, "host", { more: room(s) })}<h3 class="gs-h gs-big">Game mode Settings</h3>${own || `<p class="small dim gs-none">${esc(gs.length > 1 ? "These games have no settings of their own." : `${modeOf(gs[0]).name} has no settings of its own.`)}</p>`}${host() ? '<p class="acts"><button type="button" class="btn ghost" data-a="reset">Defaults</button></p>' : ""}</div>`
    );
  }

  /* the preview: what the row under the pointer (or the picked one) looks like, with its name and what it is */
  function stageHTML() {
    const s = S(),
      o = s.options;
    let p = peek;
    if (!p)
      p =
        page === "map"
          ? { kind: "map", id: o.mapPick ? o.mapPick : o.map }
          : page === "opts"
            ? { kind: "opts" }
            : page && page.startsWith("cat:")
              ? { kind: "cat", id: page.slice(4) }
              : { kind: "mode", id: o.modePick || o.mode };
    const card = (title, text, pic = "") =>
      `<div class="gs-pic${pic ? "" : " empty"}">${pic}</div><div class="gs-text"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
    if (p.kind === "mode") {
      if (p.id === "vote" || p.id === "random")
        return card(
          p.id === "vote" ? "Vote Game Mode" : "Random",
          PICK_TEXT[p.id === "vote" ? "modeVote" : "modeRandom"],
        );
      const m = modeOf(p.id);
      return card(m.name, m.tip, gamePic(s, m.id));
    }
    if (p.kind === "cat")
      return card(
        CATS.find((c) => c[0] === p.id)[1],
        MODES.filter((m) => m.cat === p.id)
          .map((m) => m.name)
          .join(", "),
      );
    if (p.kind === "map") {
      if (p.id === "vote" || p.id === "random")
        return card(
          p.id === "vote" ? "Vote Maps" : "Random",
          PICK_TEXT[p.id === "vote" ? "mapVote" : "mapRandom"],
        );
      const mode = CABIN_MODES.includes(o.mode)
          ? o.mode
          : p.id === "cabin"
            ? "hang"
            : o.modePick
              ? "aod"
              : o.mode,
        tip =
          p.id === "cabin"
            ? CABIN_TIP
            : (MAPS.find((m) => m[0] === p.id) || [])[2] || "";
      return card(mapName(p.id), tip, mapPic(s, p.id, mode));
    }
    if (p.kind === "set") return card(p.title, p.text);
    const gs = games(s);
    return card(
      "Game Options",
      gs.length > 1
        ? "Host Settings apply to every game; under Game mode Settings, each game Vote Game Mode or Random can land on has its own."
        : `Host Settings apply to every game; Game mode Settings are ${modeOf(gs[0]).name}'s own.`,
    );
  }

  function paint(keep = true) {
    if (!W || !W.isConnected) return;
    const menu = W.querySelector(".arm-menu"),
      body = menu.querySelector(".arm-body"),
      top = keep && body ? body.scrollTop : 0;
    setHTML(menu, menuHTML());
    const nb = menu.querySelector(".arm-body");
    if (nb) nb.scrollTop = top;
    setHTML(W.querySelector(".gs-stage"), stageHTML());
  }
  const go = (p) => {
    page = p;
    peek = null;
    paint(false);
    const f = W.querySelector(".arm-menu .arm-back, .arm-menu .arm-row");
    if (f) f.focus();
  };
  /* the description of a setting (its name and what it does) */
  const describe = (k) => {
    const all = [...HOST, GREY, ...Object.values(BY_MODE).flat()],
      mode = S().options.mode,
      o =
        (BY_MODE[mode] || []).find((x) => x.k === k) ||
        all.find((x) => x.k === k);
    if (k === "max")
      return {
        kind: "set",
        title: "Room",
        text: "Players up to: the most players the room holds. Computers (TEST rooms): the number of computer players.",
      };
    return o ? { kind: "set", title: o.n, text: o.d } : null;
  };
  const peekAt = (t) => {
    let p = null;
    const r = t.closest(".arm-row"),
      set = t.closest(".gs-set");
    if (r && r.dataset.mode) p = { kind: "mode", id: r.dataset.mode };
    else if (r && r.dataset.map) p = { kind: "map", id: r.dataset.map };
    else if (r && r.dataset.pick) p = { kind: r.dataset.pick, id: r.dataset.v };
    else if (r && r.dataset.cat) p = { kind: "cat", id: r.dataset.cat };
    else if (r && r.dataset.p === "mode")
      p = { kind: "mode", id: S().options.modePick || S().options.mode };
    else if (r && r.dataset.p === "map")
      p = { kind: "map", id: S().options.mapPick || S().options.map };
    else if (r && r.dataset.p === "opts") p = { kind: "opts" };
    else if (set) p = describe(set.dataset.d);
    if (!p || JSON.stringify(p) === JSON.stringify(peek)) return;
    peek = p;
    setHTML(W.querySelector(".gs-stage"), stageHTML());
  };

  return openWindow(
    `<div class="armory gs"><div class="arm-menu"></div><div class="arm-stage gs-stage" data-nonav></div></div>`,
    {
      cls: "win-armory win-full win-gs",
      onOpen(w) {
        W = w;
        paint(false);
        off = R.on(() => paint());
        const menu = w.querySelector(".arm-menu");
        menu.addEventListener("pointerover", (e) => peekAt(e.target));
        menu.addEventListener("focusin", (e) => peekAt(e.target));
        menu.addEventListener(
          "toggle",
          (e) => {
            const d =
              e.target.closest && e.target.closest("details[data-fold]");
            if (!d) return;
            if (d.open) openFolds.add(d.dataset.fold);
            else openFolds.delete(d.dataset.fold);
          },
          true,
        );
        menu.addEventListener("click", (e) => {
          const s = S(),
            o = s.options,
            boss = host(),
            send = (options) => R.send({ t: "options", options });
          const a = e.target.closest("[data-a]");
          if (a && a.dataset.a === "back")
            return go(page && page.startsWith("cat:") ? "mode" : null);
          if (a && a.dataset.a === "reset" && boss) {
            send({ ...OPTIONS_DEFAULT });
            return;
          }
          const t = e.target.closest(".tile[data-k]");
          if (t && boss && t.getAttribute("aria-disabled") !== "true") {
            const v = t.dataset.v;
            send({ [t.dataset.k]: v !== "" && !isNaN(v) ? +v : v });
            return;
          }
          const r = e.target.closest(".arm-row");
          if (!r) return;
          peekAt(r);
          if (r.dataset.p) return go(r.dataset.p);
          if (r.dataset.cat) return go("cat:" + r.dataset.cat);
          if (r.dataset.pick && boss) {
            const k = r.dataset.pick === "mode" ? "modePick" : "mapPick";
            send({ [k]: o[k] === r.dataset.v ? "" : r.dataset.v });
            return;
          }
          if (r.dataset.mode) {
            if (o.modePick === "vote")
              R.send({ t: "modeVote", mode: r.dataset.mode });
            else if (boss) send({ mode: r.dataset.mode });
            return;
          }
          if (r.dataset.map) {
            if (o.mapPick === "vote" && r.dataset.map !== "cabin")
              R.send({ t: "mapVote", map: r.dataset.map });
            else if (boss) send({ map: r.dataset.map });
          }
        });
        menu.addEventListener("change", (e) => {
          const k = e.target.dataset.k;
          if (!host()) return;
          if (k === "max")
            R.send({ t: "options", options: {}, max: +e.target.value });
          if (k === "computers") R.setComputers(+e.target.value);
        });
      },
    },
  ).then((v) => {
    if (off) off();
    W = null;
    return v;
  });
}
