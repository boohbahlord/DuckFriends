/* ---------- Game Settings: every setting, its key, its name, its choices and its category ----------
   Moved out of gamesettings.js to keep that file small (a pure move; the owner's, Nov 22). */
import { SB_WORLDS, SB_RIGHTS } from "./sandboxrules.js";

import { CABIN_MODES } from "./modes.js";

import { NO_INVULN } from "./hangout/death.js";

/* ---------- every setting: its key, its name, its choices, its category and what it does ----------
   off: the games it doesn't apply to (it's hidden there). The four categories, under Host Settings and under each game */
export const CAT_NAMES = {
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
const NO_TURNS = ["hang", "l4dd", "vdd"];
export const HOST = [
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
    off: ["quack", ...NO_TURNS],
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
    off: ["sc", "quack", "law", "dunce", ...NO_TURNS],
    d: "Lock answers: a player ends their turn to lock where their duck stands. Free roam: there is no locking and no talk-it-over step, and where each duck stands when the turn ends is its answer.",
  },
  {
    k: "justin",
    n: "Justin",
    c: ON_OFF,
    cat: "rules",
    off: [...NO_TURNS],
    d: "Justin from Duck Cabin walks the board, talks and shoots now and then. He never votes and never counts toward a turn. He isn't in Dead Ducks Arcade.",
  },
  {
    k: "invuln",
    n: "Invulnerability",
    c: ON_OFF,
    cat: "rules",
    off: NO_INVULN, // (never in Quacky Zombies)
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
    off: ["bb", "sc", "quack", "law", "dunce", ...NO_TURNS],
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
    off: ["quack", ...NO_TURNS],
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
    off: ["quack", ...NO_TURNS],
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
    off: ["sc", "quack", ...NO_TURNS],
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
    off: ["bb", "sc", "quack", "dunce", ...NO_TURNS],
    d: "The order of each round's questions. Rotating goes through the players in turn.",
  },
  {
    k: "discuss",
    n: "Discussion round",
    c: ON_OFF,
    cat: "round",
    off: ["sc", "quack", ...NO_TURNS],
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
    d: "The weapons and items ducks use on the board.",
  },
  /* the owner's, Nov 22 19:29Z: "WHEN THE GUNS ARE SELECTED, THEY HAVE AMMO OF DEAD DUCKS ARCADE UNLESS UNLIMITED AMMO IS
     SELECTED" (ammo.js) */
  {
    k: "infAmmo",
    n: "Unlimited ammo",
    c: ON_OFF,
    cat: "more",
    d: "Off: every gun has its magazines and runs out, as in Dead Ducks Arcade. On: guns still reload but never run out.",
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
    off: [...CABIN_MODES],
    when: (s) => !+s.options.rainbowDucks,
    d: "A duck takes the color of the tile it stands on, and its own color off the tiles. Not with Rainbow Ducks.",
  },
  {
    k: "tagColor",
    n: "Change player tag color",
    c: ON_OFF,
    cat: "more",
    off: [...CABIN_MODES],
    need: "voteColor",
    when: (s) => !+s.options.rainbowDucks,
    d: "Needs Vote colors on. The name tag takes the duck's vote color too.",
  },
];
/* the General Rules' switch, under their note (owner 2026-11-16): off fades them, and every game mode plays the default
   rules in their place (unless its Mode Rules say otherwise) */
export const GEN_SWITCH = {
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
export const BY_MODE = {
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
      d: "On: the board in Sandbox gets a slowly changing color over the map. Off: the map shows plain.",
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
