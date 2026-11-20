/* ---------- Game Settings: the whole screen, like Customize ----------
   On the left, plain rows in three pages: Game mode, Map, then Game Options; the back arrow goes up a page, the X closes.
   On the right, a preview of the row under the pointer: the game on the picked map, the map large with the game's board
   on it (Duck Cabin as the real map, one picture of all of it), or a setting's description. The host (or sudo) picks;
   everyone else looks. With Vote Mode & Map on, the game and the map are voted on in their own windows as the game
   starts (vote.js). */
import { SB_WORLDS, SB_WORLD_NAMES, SB_RIGHTS } from "./sandboxrules.js";
import { esc, openWindow, setHTML } from "./ui.js";
import { artBackdrop } from "./art.js";
import { modesFor, modeOf, modeName, CABIN_MODES, CATS } from "./modes.js";
import { modesNow, loadModes } from "./gmodes.js";
import { MAPS, MAP_VARIANTS, mapName, mapForm, umapOf } from "./maps.js";
import { isUmap, umapIds } from "./umaprules.js";
import { bringMaps, myMaps } from "./umaps.js";
import {
  OPTIONS_DEFAULT,
  isSudo,
  randomPool,
  dodOn,
  GEN_RULES,
  genVal,
  ruleFor,
} from "./rules.js";
import { downFor, NO_INVULN } from "./hangout/death.js";
import { profile, save } from "./store.js";

/* ---------- every setting: its key, its name, its choices, its category and what it does ----------
   off: the games it doesn't apply to (it's hidden there). The four categories, under Host Settings and under each game */
const CAT_NAMES = {
  rules: "General Rules",
  time: "Durations",
  round: "Round Settings",
  more: "Additional Settings",
  rights: "Rights", // (Sandbox: who may change it)
};
const ON_OFF = [
  [0, "Off"],
  [1, "On"],
];
const NO_TURNS = ["hang", "l4dd", "surv", "vdd"];
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
    k: "endBtn",
    n: "End round button",
    c: ON_OFF,
    cat: "rules",
    only: ["aod", "wyr", "ddr", "sc"],
    d: "Votes don't end the turn: an End round button does. It shows once the needed share has voted, and anyone can press it.",
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
    d: "Justin from Duck Cabin walks the board, talks and shoots now and then. He never votes and never counts toward a turn. He isn't in Dead Ducks Arcade.",
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
    off: NO_INVULN, // (never in Quacky Zombies or Mad God Justin)
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
  /* the duck looks (looks.js): Rainbow Ducks needs Hide customization; Vote colors never with Rainbow Ducks, and the
     tag's color needs Vote colors */
  {
    k: "hideLooks",
    n: "Hide customization",
    c: ON_OFF,
    cat: "more",
    d: "During the game every duck is the plain yellow duck, with a plain name tag that always shows. Specials stay.",
  },
  {
    k: "noGore",
    n: "Gore",
    c: [
      [0, "On"],
      [1, "Off"],
    ],
    cat: "more",
    d: "Off: no blood or gore on the board.",
  },
  {
    k: "noFx",
    n: "Heavy effects",
    c: [
      [0, "On"],
      [1, "Off"],
    ],
    cat: "more",
    d: "Off: no gun smoke, muzzle flashes or screen shake, the effects that are hard on the game.",
  },
  {
    k: "rainbowDucks",
    n: "Rainbow Ducks",
    c: ON_OFF,
    cat: "more",
    need: "hideLooks",
    d: "Needs Hide customization on. Each duck is dealt one of eight looks at random: the seven colors of the rainbow, or a brown duck in Justin's costume. Knocking that one down isn't a Justin kill.",
  },
  {
    k: "voteColor",
    n: "Vote colors",
    c: ON_OFF,
    cat: "more",
    off: ["mgj", ...CABIN_MODES],
    when: (s) => !+s.options.rainbowDucks,
    d: "A duck takes the color of the tile it stands on, and its own color off the tiles. Not with Rainbow Ducks.",
  },
  {
    k: "tagColor",
    n: "Change player tag color",
    c: ON_OFF,
    cat: "more",
    off: ["mgj", ...CABIN_MODES],
    need: "voteColor",
    when: (s) => !+s.options.rainbowDucks,
    d: "Needs Vote colors on. The name tag takes the duck's vote color too.",
  },
];
/* the General Rules' switch, under their note (owner 2026-11-16): off fades them, and every game mode plays the default
   rules in their place (unless its Mode Rules say otherwise) */
const GEN_SWITCH = {
  k: "genOff",
  n: "General Rules",
  c: [
    [0, "On"],
    [1, "Off"],
  ],
  d: "Off: every game mode plays the default rules in place of the General Rules, unless its own Mode Rules say otherwise.",
};
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
      k: "lawVote",
      n: "Vote for attorneys",
      c: ON_OFF,
      cat: "rules",
      d: "Each case, a window over the board: everyone votes the defense attorney, then the offense, 0:20 each (0:05 once the vote share has voted). A tie is settled by chance. On, it replaces Defense attorney and Offense attorney.",
    },
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
      d: "The HP of each duck. A hit from Justin takes 1 HP, and nothing hurts the duck for a second after. The last one knocks it down until another duck holds E by it for 5 seconds, or the fight's end. Off: one hit knocks a duck down for 5 s.",
    },
  ],
  l4dd: [
    {
      k: "l4start",
      n: "Start on round",
      c: [
        [1, "1"],
        [5, "5"],
        [9, "9"],
        [13, "13"],
        [21, "21"],
      ],
      cat: "round",
      d: "Every game starts in round 0. Once everyone is ready it goes on to this round, and every duck gets bonus points in round 0: 750 for round 5, 1,750 for round 9, 2,500 for round 13, 5,000 for round 21. From 13 on it counts toward its own stats, Round 16 Start. In round 0 the ducks can vote to change it.",
    },
    {
      k: "wildJustin",
      n: "Justin in Duck Cabin",
      c: ON_OFF,
      cat: "rules",
      d: "On: Justin is out in Duck Cabin too, as he is on Downpour. He never has a weapon, and zombies go for him. Downpour always has him.",
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
  trivia: [
    {
      k: "tvWrite",
      n: "Writing time",
      c: [
        [120, "2:00"],
        [210, "3:30"],
        [300, "5:00"],
        [0, "No limit"],
      ],
      cat: "time",
      d: "How long everyone has to write their question. When it runs out, what was typed goes in if it's complete; if not, an auto question plays in its place.",
    },
    {
      k: "tvMc",
      n: "Multiple choice",
      c: ON_OFF,
      cat: "rules",
      need: "tvWr",
      d: "Off: every question is written. It can't be off while Written answers is off.",
    },
    {
      k: "tvWr",
      n: "Written answers",
      c: ON_OFF,
      cat: "rules",
      need: "tvMc",
      d: "Off: there's no Written Answer button, so every question is multiple choice. It can't be off while Multiple choice is off.",
    },
    {
      k: "tvMulti",
      n: "Multiple answers",
      c: ON_OFF,
      cat: "rules",
      d: "On: a writer can mark more than one answer right (never all of them), and the round says how many. Off: exactly one is right.",
    },
    {
      k: "tvNoWrong",
      n: "No wrong answers",
      c: ON_OFF,
      cat: "rules",
      d: "On: a writer can leave every answer unmarked. That question counts for nobody's stats.",
    },
    {
      k: "tvHide",
      n: "Hide who wrote it",
      c: ON_OFF,
      cat: "rules",
      d: "The cloud shows a multicolored ? in place of the question's writer.",
    },
    {
      k: "tvGrade",
      n: "Grading timer",
      c: ON_OFF,
      cat: "time",
      d: "The writer has 1:00 for each written answer. A row still ungraded when it runs out counts as right.",
    },
    {
      k: "tvStop",
      n: "Stop timer",
      c: [
        [1, "On"],
        [0, "Off"],
      ],
      cat: "time",
      d: "After each answer is shown there are 10 seconds before the next question. Anyone can press Stop timer to hold the clock; once everyone lets go it starts again at 5 seconds.",
    },
  ],
  /* Sandbox: who may change it (the owner's, Nov 19: "fewer options, such as if all players get all persmisions or if
     all players get only a select few permissions onto different buttons"). Off by default: the host, and whoever
     the host lets in Player settings (P) */
  sandbox: [
    {
      k: "sbTint",
      n: "Color over the map",
      c: ON_OFF,
      cat: "more",
      when: (s) => !SB_WORLDS[s.options.sbMap],
      d: "On: the board in Sandbox gets Mad God Justin's slowly changing color over the map. Off: the map shows plain.",
    },
    {
      k: "sbAll",
      n: "Everyone can change Sandbox",
      c: ON_OFF,
      cat: "rights",
      d: "On: every player can use every window: Build, Make an NPC, Seriat, the hotbar's setup, Game settings and Player settings. Off: only the host and the players the host lets in Player settings (P).",
    },
    ...SB_RIGHTS.map(([k, n]) => ({
      k: "sbOk" + k.toUpperCase(),
      n: `Everyone can use ${n}`,
      c: ON_OFF,
      cat: "rights",
      when: (s) => +s.options.sbAll !== 1,
      d: `On: every player can use ${n} (${k.toUpperCase()}), even without the rights to change Sandbox.`,
    })),
  ],
  hang: [
    {
      k: "hangTime",
      n: "Time limit (Random & Vote)",
      c: [
        [5, "5 min"],
        [10, "10 min"],
        [15, "15 min"],
        [20, "20 min"],
        [30, "30 min"],
        [0, "No limit"],
      ],
      cat: "time",
      when: (s) => !!s.options.modePick, // (a Hangout the host picks never has one)
      d: "When Random or the vote picks Hangout, it lasts this long, and the time left shows at the top. Then the next game begins, or the votes come back when it's their turn. A Hangout the host picks has no time limit.",
    },
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
/* Shelter Sky & Null's own setting, under the Map page's rows: shown when the host picked it (the vote and Random have
   black and white as a form of its own) */
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
  !s.options.mapPick &&
  s.options.map === "collage";
/* Euclid's Squares' own setting, shown when the host picked it (Vote Maps and Random have the zoom as an entry of its
   own) */
const ZOOM = {
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
const VOTE_SETS = [
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
const voting = (s) =>
  s.options.modePick === "vote" || s.options.mapPick === "vote";
/* the row of the map the host picked: a variation in another form (Zoom, Black and white) is the map with its setting
   on; every variation sits under the maps (owner, Nov 16) */
const picked = (o) =>
  o.map === "euclid" && o.mapZoom
    ? "euclidzoom"
    : o.map === "collage" && o.mapGrey
      ? "collagebw"
      : o.map;
const showsZoom = (s) =>
  !CABIN_MODES.includes(s.options.mode) &&
  !s.options.mapPick &&
  s.options.map === "euclid";

/* the plain words for the rows that aren't a game, a map or a setting */
const PICK_TEXT = {
  vote: "After the start's countdown, every player votes in a window over the whole screen: first for the game mode (1:05), then for the map (0:20; not for Duck Cabin's games or Mad God Justin). Click once to vote; the dice is a random pick. Once the majority has voted (the room's vote share), the clock drops to 0:06. The most votes win; a tie is a random pick between the tied ones.",
  modeRandom:
    "A new game every round. Every game is played once before the order is reshuffled; True Random, under Game Options, lets any game come next. Dead Ducks Arcade and games that need more players than the room has are left out. Hangout plays on Duck Cabin with its own time limit (Game Options); every other game stays on the map picked.",
  mapRandom:
    "A random map each time the host starts. Duck Cabin comes only with its own games.",
};
const CABIN_TIP =
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
const games = (s) =>
  s.options.modePick === "vote"
    ? modesFor(s).map((m) => m.id)
    : s.options.modePick === "random"
      ? randomPool(s)
      : [s.options.mode || "aod"];
const valueOf = (s, k) =>
  k === "downMs"
    ? downFor(s)
    : GEN_RULES.includes(k)
      ? genVal(s, k) // (the General Rules as set; the options hold the picked mode's)
      : s.options[k];
/* the General Rules that count in one game mode, each as its Mode Rule */
const genFor = (s, g) =>
  HOST.filter(
    (x) =>
      GEN_RULES.includes(x.k) &&
      (x.when ? x.when(s) : true) &&
      !(x.off || []).includes(g) &&
      (!x.only || x.only.includes(g)),
  );

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
/* the map large: Duck Cabin as the real map (one picture of all of it; dark with the power cut in Left 4 Dead Ducks), any
   other map with the picked game's board on it */
function mapPic(s, id, mode) {
  if (isUmap(id)) {
    const m = umapOf(id); // (a made map: its own picture, umaps.js)
    return m
      ? `<img class="gs-made" src="${m.d}" alt="${esc(m.t)}" draggable="false">`
      : "";
  }
  if (id === "cabin")
    return `<img class="gs-cabin${mode === "l4dd" ? " dark" : ""}" src="assets/px/maps/duck-cabin.webp" data-pxready data-pxok alt="Duck Cabin" draggable="false">`;
  const f = mapForm(id),
    grey = f.grey || (id === "collage" && s.options.mapGrey) ? " grey" : "";
  return `<svg class="gs-map${grey}" viewBox="0 0 480 270" role="img" aria-label="${esc(mapName(id))}"><g class="gs-back">${artBackdrop(f.grey ? f.map : id)}</g>${CABIN_MODES.includes(mode) ? "" : boardSketch(mode)}</svg>`;
}
/* a game mode's picture: one screenshot of the mode (every name tag hidden, rainbow ducks), its board drawn over the
   picked map. The screenshots were taken with the map left out, so any map shows through; Duck Cabin's games are
   screenshots of the cabin itself */
function gamePic(s, mode) {
  const shot =
    mode === "sandbox"
      ? "" // (Sandbox: its map alone, till it has a screenshot of its own)
      : `<image href="assets/px/modes/${mode}.webp" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>`;
  if (CABIN_MODES.includes(mode))
    return `<svg class="gs-map" viewBox="0 0 480 270" role="img" aria-label="${esc(modeOf(mode).name)}">${shot}</svg>`;
  const map =
      s.options.map && s.options.map !== "cabin" ? s.options.map : "board",
    grey = map === "collage" && s.options.mapGrey ? " grey" : "";
  return `<svg class="gs-map${grey}" viewBox="0 0 480 270" role="img" aria-label="${esc(modeOf(mode).name)}: ${esc(mapName(map))}"><g class="gs-back">${artBackdrop(map)}</g>${shot}</svg>`;
}

/* ---------- the screen ---------- */
const openFolds = new Set([
  "host:rules",
  "mode:rules",
  "cat:social",
  "cat:comp",
  "cat:special",
]); // (the categories left open, from one visit to the next)
/* the Modes in Random & Vote row's value: All, or how many are on */
const poolVal = (s) => {
  const all = modesFor(s),
    off = (s.options.modesOff || []).filter((id) =>
      all.some((m) => m.id === id),
    );
  return off.length ? `${all.length - off.length} of ${all.length}` : "All";
};
/* ---------- save slots (owner 2026-11-15): 5 per player, kept on this device with the profile ----------
   Save copies every Game Setting of the room; Load sends them back, and only in the lobby (never mid-game) */
const SLOTS = 5;
const slots = () =>
  Array.from({ length: SLOTS }, (_, n) => {
    const x = (profile.saves || [])[n];
    return x && x.options ? x : null;
  });
const when = (t) =>
  new Date(t).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  /* Vote Mode & Map: under the line, above Game mode (owner 2026-11-16: Game Options, Modes in Random & Vote and Save
     slots on top, then a line, then Vote Mode & Map, Game mode and Map); its page has the On/Off row
     and, while it's on, each vote and Vote return */
  const voteVal = (s) =>
    s.options.modePick === "vote" && s.options.mapPick === "vote"
      ? "On"
      : s.options.modePick === "vote"
        ? "Game mode only"
        : s.options.mapPick === "vote"
          ? "Map only"
          : "Off";
  const modeVal = (s) =>
    s.options.modePick === "vote"
      ? "Vote Mode & Map"
      : s.options.modePick === "random"
        ? s.options.trueRandom
          ? "True Random"
          : "Random"
        : modeName(s);
  const mapVal = (s) =>
    s.options.mapPick === "vote"
      ? "Vote Mode & Map"
      : s.options.mapPick === "random"
        ? "Random"
        : mapName(s.options.map);

  /* Gore and Heavy effects: a "Low" chip by their name while my own Low graphics (Settings → Performance: Graphics Low,
     Data saving or Poor connection) lighten them on my screen, whatever the room picked (fx.js) */
  const lowChip = (k) =>
    (k === "noGore" || k === "noFx") &&
    document.documentElement.classList.contains("low")
      ? ` <span class="gs-low" data-tip="${esc(k === "noGore" ? "Your Low graphics: less blood on your screen, and it goes sooner." : "Your Low graphics: no smoke or screen shake on your screen, only a tiny muzzle flash.")}">Low</span>`
      : "";
  /* a setting as the old Game options showed it: its name over its choices. mr: the game mode whose Mode Rule this is
     (with Same as General first) */
  const tiles = (s, o, mr = "") => {
    const gen = GEN_RULES.includes(o.k),
      need = (k) => (mr ? ruleFor(s, mr, k) : valueOf(s, k)),
      faded =
        (o.need && !+need(o.need)) || // (it needs another setting on first: shown faded)
        (gen && !mr && +s.options.genOff), // (the General Rules are off)
      ro = host() && !faded ? "" : ' aria-disabled="true"',
      mine = mr && ((s.options.modeRules || {})[mr] || {}),
      cur = !mr ? valueOf(s, o.k) : o.k in mine ? mine[o.k] : "same",
      c = [
        ...(mr ? [["same", "Same as General"]] : []),
        ...(o.k === "downMs" && s.options.mode !== "hang"
          ? o.c.filter((x) => x[0] !== 6000)
          : o.c),
      ];
    return `<div class="sect gs-set${faded ? " faded" : ""}" data-d="${esc(o.k)}"${mr ? ` data-mr="${esc(mr)}"` : ""}><h3>${esc(o.n)}${lowChip(o.k)}</h3><div class="row">${c
      .map(
        ([v, n]) =>
          `<button type="button" class="tile" data-k="${o.k}" data-v="${v}"${mr ? ` data-mr="${esc(mr)}"` : ""} aria-pressed="${cur === v}"${ro}>${esc(n)}</button>`,
      )
      .join("")}</div></div>`;
  };
  /* a game mode's Mode Rules: the General Rules again, each Same as General until one is picked, and that one wins in
     this mode only */
  const modeRules = (s, g) => {
    const list = genFor(s, g),
      k = `mode:${g}:moderules`,
      n = Object.keys((s.options.modeRules || {})[g] || {}).length;
    return list.length
      ? `<details class="arm-fold gs-fold" data-fold="${esc(k)}"${openFolds.has(k) ? " open" : ""}><summary>Mode Rules${n ? ` <span class="small dim">(${n} set)</span>` : ""}</summary><p class="small dim gs-note">${esc(`These replace the General Rules in ${modeOf(g).name} only.`)}</p>${list.map((o) => tiles(s, o, g)).join("")}</details>`
      : "";
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
          ? `<details class="arm-fold gs-fold" data-fold="${esc(k)}"${openFolds.has(k) ? " open" : ""}><summary>${name}</summary>${pre === "host" && cat === "rules" ? `<p class="small dim gs-note">These apply to all game modes.</p>${tiles(s, GEN_SWITCH)}` : ""}${body}</details>`
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
        `<div class="arm-body"><ul class="arm-list">${row('data-p="opts"', "Game Options", host() ? "Edit" : "View")}${row('data-p="pool"', "Modes in Random & Vote", poolVal(s))}${row('data-p="saves"', "Save slots", `${slots().filter(Boolean).length} of ${SLOTS}`)}${LINE}${row('data-p="vote"', "Vote Mode & Map", voteVal(s))}${row('data-p="mode"', "Game mode", modeVal(s))}${row('data-p="map"', "Map", mapVal(s))}</ul></div>`
      );
    if (page === "pool") {
      const off = o.modesOff || [],
        mid = !["lobby", "over", "countdown"].includes(s.phase);
      return (
        head("Modes in Random & Vote") +
        `<div class="arm-body"><ul class="arm-list">${modesFor(s)
          .map((m) =>
            row(
              `data-pool="${esc(m.id)}"`,
              m.name,
              off.includes(m.id) ? "Off" : "On",
              !off.includes(m.id),
              !host() || (mid && m.id === o.mode),
            ),
          )
          .join("")}</ul></div>`
      );
    }
    if (page === "saves") {
      const inLobby = s.phase === "lobby",
        list = slots();
      return (
        head("Save slots") +
        `<div class="arm-body"><ul class="arm-list gs-slots">${list
          .map(
            (x, n) =>
              `<li class="gs-slot"><span class="gs-slot-name">Slot ${n + 1}<span class="small dim">${x ? esc(`${modeOf(x.options.mode).name} · ${when(x.at)}`) : "Empty"}</span></span><button type="button" class="btn ghost small" data-a="save" data-n="${n}">Save</button><button type="button" class="btn ghost small" data-a="load" data-n="${n}"${x && inLobby && host() ? "" : " disabled"}>Load</button></li>${n ? "" : `<li class="gs-slot-note small dim">Save keeps these Game Settings on this device. Load works only in the lobby, before a game${host() ? "" : ", and only for the host (or sudo)"}.</li>`}`,
          )
          .join("")}</ul></div>`
      );
    }
    if (page === "vote")
      return (
        head("Vote Mode & Map") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="vote" data-v="vote"', "Vote Mode & Map", voting(s) ? "On" : "Off", voting(s), !host() || dodOn(s, "vote"))}</ul>${voting(s) ? VOTE_SETS.map((x) => tiles(s, x)).join("") : ""}</div>`
      );
    /* Game mode: each category (Social, Social Competitive, Special) is a heading with an arrow that folds its modes
       away; they start open, with their modes listed under them (owner, Nov 16 22:36Z) */
    if (page === "mode") {
      const dis = !host() || dodOn(s, "vote");
      return (
        head("Game mode") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="mode" data-v="random"', "Random", "", o.modePick === "random", dis)}${LINE}</ul>${CATS.filter(
          ([id]) => modesFor(s).some((m) => m.cat === id),
        )
          .map(
            ([id, name]) =>
              `<details class="arm-fold gs-fold gs-cat" data-fold="cat:${id}"${openFolds.has("cat:" + id) ? " open" : ""}><summary>${esc(name)}</summary><ul class="arm-list">${modesFor(
                s,
              )
                .filter((m) => m.cat === id)
                .map((m) =>
                  row(
                    `data-mode="${m.id}"`,
                    m.name,
                    "",
                    !o.modePick && o.mode === m.id && !o.gm,
                    dis,
                  ),
                )
                .join("")}</ul></details>`,
          )
          .join("")}${
          host() && modesNow().length
            ? `<details class="arm-fold gs-fold gs-cat" data-fold="cat:custom"${openFolds.has("cat:custom") ? " open" : ""}><summary>Custom</summary><ul class="arm-list">${modesNow()
                .map((m) =>
                  row(
                    `data-gm="${esc(m.id)}"`,
                    m.name,
                    "",
                    !o.modePick && o.mode === "sandbox" && o.gm === m.id,
                    dis,
                  ),
                )
                .join("")}</ul></details>`
            : ""
        }</div>`
      );
    }
    if (page.startsWith("cat:")) {
      const cat = page.slice(4),
        dis = !host() || dodOn(s, "vote");
      return (
        head(CATS.find((c) => c[0] === cat)[1]) +
        `<div class="arm-body"><ul class="arm-list">${modesFor(s)
          .filter((m) => m.cat === cat)
          .map((m) =>
            row(
              `data-mode="${m.id}"`,
              m.name,
              "",
              !o.modePick && o.mode === m.id,
              dis,
            ),
          )
          .join("")}</ul></div>`
      );
    }
    if (page === "cabin") {
      const dis = !host() || dodOn(s, "vote");
      return (
        head("Duck Cabin") +
        `<div class="arm-body"><ul class="arm-list">${CABIN_MODES.map((id) =>
          row(
            `data-mode="${id}"`,
            modeOf(id).name,
            "",
            !o.modePick && o.mode === id,
            dis,
          ),
        ).join("")}</ul></div>`
      );
    }
    if (page === "map") {
      /* the maps aren't voted on here: Vote Mode & Map has its own window as the game starts; a map picked here is just
         played (Vote for map and Random go off) */
      const dis = !host() || dodOn(s, "vote");
      if (o.mode === "surv")
        return (
          head("Map") +
          `<div class="arm-body"><ul class="arm-list">${row('data-map="surv"', "Downpour", "", true, true)}</ul></div>`
        ); // (Survival plays only Downpour: nothing else is offered, the owner's, Nov 20)
      return (
        head("Map") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="map" data-v="random"', "Random", "", o.mapPick === "random", dis)}${
          o.mode === "sandbox"
            ? Object.keys(SB_WORLDS)
                .map((k) =>
                  row(
                    `data-sb="${k}"`,
                    SB_WORLD_NAMES[k],
                    "",
                    !o.mapPick && o.sbMap === k,
                    dis,
                  ),
                )
                .join("") // (Sandbox: the maps with a world of their own, walked whole: sandboxrules.js)
            : `${row('data-map="cabin"', "Duck Cabin", "", o.map === "cabin" && o.l4map !== "downpour", dis)}${row('data-map="downpour"', "Downpour", "", o.mode === "l4dd" && o.l4map === "downpour", dis)}`
        }${LINE}${MAPS.map(([id, name]) =>
          row(
            `data-map="${id}"`,
            name,
            "",
            !o.mapPick && picked(o) === id,
            dis,
          ),
        ).join("")}${LINE}${MAP_VARIANTS.map(([id, name]) =>
          row(
            `data-map="${id}"`,
            name,
            "",
            !o.mapPick && picked(o) === id,
            dis,
          ),
        ).join("")}${
          o.mode === "sandbox"
            ? ""
            : `${umapIds(s).length ? LINE : ""}${umapIds(s)
                .map((id) =>
                  row(
                    `data-map="${id}"`,
                    mapName(id),
                    "",
                    !o.mapPick && o.map === id,
                    dis,
                  ),
                )
                .join("")}` // (the maps the host made and brought in: umaps.js)
        }${host() ? `${LINE}${row("data-umaps", "My maps…")}` : ""}</ul>${showsCollage(s) ? `<h3 class="gs-sub">${esc(mapName("collage"))}</h3>${tiles(s, GREY)}` : ""}${showsZoom(s) ? `<h3 class="gs-sub">${esc(mapName("euclid"))}</h3>${tiles(s, ZOOM)}` : ""}</div>`
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
      .map((g) => {
        const body =
          modeRules(s, g) +
          folds(
            s,
            (BY_MODE[g] || []).filter((x) => !x.when || x.when(s)),
            `mode:${g}`,
          );
        return body
          ? `${gs.length > 1 ? `<h3 class="gs-sub">${esc(modeOf(g).name)}</h3>` : ""}${body}`
          : "";
      })
      .join("");
    return (
      head("Game Options") +
      `<div class="arm-body gs-opts">${host() ? "" : '<p class="small dim gs-ro">Only the host (or sudo) changes these.</p>'}<h3 class="gs-h">Host Settings</h3>${folds(s, hostList, "host", { more: s.solo ? "" : room(s) })}<h3 class="gs-h gs-big">Game mode Settings</h3>${own || `<p class="small dim gs-none">${esc(gs.length > 1 ? "These games have no settings of their own." : `${modeOf(gs[0]).name} has no settings of its own.`)}</p>`}${host() ? '<p class="acts"><button type="button" class="btn ghost" data-a="reset">Defaults</button></p>' : ""}</div>`
    );
  }

  /* the preview: what the row under the pointer (or the picked one) looks like, with its name and what it is */
  function stageHTML() {
    const s = S(),
      o = s.options,
      html = stageCard(s, o);
    if (page === "opts" || html.includes('<div class="gs-pic">')) return html;
    /* a row with no picture of its own (Vote, Random, a kind of game) keeps the picked game's or map's picture on a
       phone, so the rows under a finger never move */
    const keep =
      page === "map" ? mapPic(s, o.map, o.mode) : gamePic(s, o.mode || "aod");
    return html.replace(
      '<div class="gs-text">',
      `<div class="gs-pic gs-keep">${keep}</div><div class="gs-text">`,
    );
  }
  function stageCard(s, o) {
    let p = peek;
    if (!p)
      p =
        page === "cabin"
          ? CABIN_MODES.includes(o.mode)
            ? { kind: "mode", id: o.mode }
            : { kind: "map", id: "cabin" }
          : page === "map"
            ? { kind: "map", id: o.mapPick ? o.mapPick : o.map }
            : page === "opts"
              ? { kind: "opts" }
              : page && page.startsWith("cat:")
                ? { kind: "cat", id: page.slice(4) }
                : page === "vote"
                  ? { kind: "mode", id: "vote" }
                  : page === "pool"
                    ? {
                        kind: "set",
                        title: "Modes in Random & Vote",
                        text: "Turn a game off and Random and the vote leave it out. During a game, every one but the game being played can change.",
                      }
                    : { kind: "mode", id: o.modePick || o.mode };
    const card = (title, text, pic = "") =>
      `<div class="gs-pic${pic ? "" : " empty"}">${pic}</div><div class="gs-text"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
    if (p.kind === "gm") {
      const m = modesNow().find((x) => x.id === p.id) || {};
      return card(
        m.name || "Custom",
        `${m.desc ? m.desc + " " : ""}Made in Sandbox. Up to ${m.most || 8} players.`,
        gamePic(s, "sandbox"),
      );
    }
    if (p.kind === "mode") {
      if (p.id === "vote" || p.id === "random")
        return card(
          p.id === "vote" ? "Vote Mode & Map" : "Random",
          PICK_TEXT[p.id === "vote" ? "vote" : "modeRandom"],
        );
      const m = modeOf(p.id);
      return card(m.name, m.tip, gamePic(s, m.id));
    }
    if (p.kind === "cat")
      return card(
        CATS.find((c) => c[0] === p.id)[1],
        modesFor(s)
          .filter((m) => m.cat === p.id)
          .map((m) => m.name)
          .join(", "),
      );
    if (p.kind === "map") {
      if (p.id === "vote" || p.id === "random")
        return card(
          p.id === "vote" ? "Vote Mode & Map" : "Random",
          PICK_TEXT[p.id === "vote" ? "vote" : "mapRandom"],
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
            : isUmap(p.id)
              ? (umapOf(p.id) || {}).de || ""
              : ([...MAPS, ...MAP_VARIANTS].find((m) => m[0] === p.id) ||
                  [])[2] || "";
      return card(mapName(p.id), tip, mapPic(s, p.id, mode));
    }
    if (p.kind === "set") return card(p.title, p.text);
    const gs = games(s);
    return card(
      "Game Options",
      gs.length > 1
        ? "Host Settings apply to every game; under Game mode Settings, each game Vote Game Mode or Random can land on has its own, and its Mode Rules win over the General Rules in that game."
        : `Host Settings apply to every game; Game mode Settings are ${modeOf(gs[0]).name}'s own, and its Mode Rules win over the General Rules in it.`,
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
    place();
  }
  /* the row the preview is about: the one under the pointer, or else the picked one */
  let peekSel = null;
  const keyOf = (el) =>
    el.classList.contains("gs-set")
      ? `.gs-set[data-d="${el.dataset.d}"]${el.dataset.mr ? `[data-mr="${el.dataset.mr}"]` : ":not([data-mr])"}`
      : ".arm-row" +
        ["mode", "map", "pick", "v", "cat", "p"]
          .filter((k) => k in el.dataset)
          .map((k) => `[data-${k}="${el.dataset[k]}"]`)
          .join("");
  const place = () => {
    const menu = W.querySelector(".arm-menu"),
      cat = modeOf(S().options.mode).cat;
    infoUnder(
      W,
      (peekSel && menu.querySelector(peekSel)) ||
        menu.querySelector('.arm-row[aria-pressed="true"]') ||
        (page === "mode" &&
          menu.querySelector(`[data-fold="cat:${cat}"] > summary`)) ||
        (!page && menu.querySelector('[data-p="mode"]')),
    );
  };
  const go = (p) => {
    page = p;
    if (p === "mode") loadModes(() => page === "mode" && paint(false)); // (the game modes made in Sandbox, on this device: gmodes.js)
    if (p === "map") bringMaps(R); // (the host's made maps into the room, so they're on the list: umaps.js)
    peek = null;
    peekSel = null;
    paint(false);
    const f = W.querySelector(".arm-menu .arm-back, .arm-menu .arm-row");
    if (f) f.focus();
  };
  if (start === "map") bringMaps(R);
  loadModes(() => page === "mode" && paint(false)); // (Custom: the game modes made in Sandbox, gmodes.js)
  /* the description of a setting (its name and what it does) */
  const describe = (k) => {
    const all = [
        ...HOST,
        GEN_SWITCH,
        GREY,
        ZOOM,
        ...VOTE_SETS,
        ...Object.values(BY_MODE).flat(),
      ],
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
    else if (r && r.dataset.gm) p = { kind: "gm", id: r.dataset.gm };
    else if (r && r.dataset.map) p = { kind: "map", id: r.dataset.map };
    else if (r && r.dataset.pick)
      p = {
        kind:
          r.dataset.pick === "vote"
            ? page === "map"
              ? "map"
              : "mode"
            : r.dataset.pick,
        id: r.dataset.v,
      };
    else if (r && r.dataset.cat) p = { kind: "cat", id: r.dataset.cat };
    else if (r && r.dataset.p === "vote") p = { kind: "mode", id: "vote" };
    else if (r && r.dataset.p === "mode")
      p = { kind: "mode", id: S().options.modePick || S().options.mode };
    else if (r && r.dataset.p === "map")
      p = { kind: "map", id: S().options.mapPick || S().options.map };
    else if (r && r.dataset.p === "opts") p = { kind: "opts" };
    else if (set) p = describe(set.dataset.d);
    if (!p || JSON.stringify(p) === JSON.stringify(peek)) return;
    peek = p;
    peekSel = keyOf(r || set);
    setHTML(W.querySelector(".gs-stage"), stageHTML());
    place();
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
            return go(
              page && page.startsWith("cat:")
                ? "mode"
                : page === "cabin"
                  ? "map"
                  : null,
            );
          if (a && a.dataset.a === "save") {
            const list = slots();
            list[+a.dataset.n] = { at: Date.now(), options: { ...o } };
            profile.saves = list;
            save();
            paint(false);
            return;
          }
          if (a && a.dataset.a === "load") {
            const x = slots()[+a.dataset.n];
            if (x && boss && s.phase === "lobby") send({ ...x.options });
            return;
          }
          if (a && a.dataset.a === "reset" && boss) {
            send({ ...OPTIONS_DEFAULT, modeRules: 0 }); // (0: no Mode Rules; an empty {} doesn't make it through Firebase)
            return;
          }
          const t = e.target.closest(".tile[data-k]");
          if (t && t.dataset.mr) {
            // a Mode Rule: set for that game mode, or Same as General again
            if (!boss || t.getAttribute("aria-disabled") === "true") return;
            const g = t.dataset.mr,
              k = t.dataset.k,
              v = t.dataset.v,
              all = JSON.parse(JSON.stringify(o.modeRules || {})),
              mine = (all[g] = all[g] || {});
            if (v === "same") delete mine[k];
            else mine[k] = v !== "" && !isNaN(v) ? +v : v;
            if (!Object.keys(mine).length) delete all[g];
            send({ modeRules: Object.keys(all).length ? all : 0 });
            return;
          }
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
          if (r.dataset.pool) {
            if (!boss || r.getAttribute("aria-disabled") === "true") return;
            const off = o.modesOff || [],
              id = r.dataset.pool;
            send({
              modesOff: off.includes(id)
                ? off.filter((x) => x !== id)
                : [...off, id],
            });
            return;
          }
          if (r.dataset.pick === "vote" && boss) {
            // Vote Mode & Map: on, both votes; off, the host's game and map
            const v = voting(S()) ? "" : "vote";
            send({ modePick: v, mapPick: v });
            return;
          }
          if (r.dataset.pick && boss) {
            const k = r.dataset.pick === "mode" ? "modePick" : "mapPick";
            send({ [k]: o[k] === r.dataset.v ? "" : r.dataset.v });
            return;
          }
          if (r.dataset.mode) {
            if (boss)
              send({
                mode: r.dataset.mode,
                ...(o.gm ? { gm: "", gmName: "", gmMost: 0 } : {}),
              }); // (a made game mode picked before gives way)
            return;
          }
          if (r.dataset.gm) {
            const m = modesNow().find((x) => x.id === r.dataset.gm);
            if (boss && m)
              send({
                mode: "sandbox",
                modePick: "",
                gm: m.id,
                gmName: m.name,
                gmMost: m.most || 8,
              }); // (a game mode made in Sandbox, on this device: gmodes.js; its own map comes with it)
            return;
          }
          if (r.dataset.sb) {
            if (boss) send({ sbMap: r.dataset.sb }); // (Sandbox on a world: rules.js sbMapPicked)
            return;
          }
          if ("umaps" in r.dataset) {
            myMaps(R); // (the maps on the host's device: make, change, play)
            return;
          }
          if (r.dataset.map === "cabin") return go("cabin"); // (Duck Cabin's own games, on a page of their own)
          if (r.dataset.map === "downpour") {
            if (boss) send({ mode: "l4dd", l4map: "downpour" }); // (Downpour: Dead Ducks Arcade's own map; its map vote still comes first, the owner's, Nov 17)
            return;
          }
          if (r.dataset.map && boss) {
            const f = mapForm(r.dataset.map); // (Vote Maps and Random go off: rules.js)
            send(
              f.map === "euclid"
                ? { map: f.map, mapZoom: f.zoom ? 1 : 0 }
                : f.map === "collage"
                  ? { map: f.map, mapGrey: f.grey ? 1 : 0 }
                  : { map: f.map },
            ); // (a variation in another form: its map, with its setting)
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
