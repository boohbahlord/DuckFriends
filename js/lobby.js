/* ---------- the lobby, laid out like Halo: Reach's custom game lobby ----------
   Left: the game's art, the room's name, who can join, Ready, then Game type (locked), Map (hidden for Hangout, always in
   Duck Cabin), Game options (the host edits them) and Start game, with a line under them saying what the row under the
   pointer does. Right: the party, one player card per row; click your own to rename it; right-click any card for its
   options. Bottom left: the keys (the arrow keys move around the lobby, Enter picks, Shift+Enter right-clicks). The X at
   the top right leaves the room. */
import { register, go, leaveTo } from "./router.js";
import {
  el,
  esc,
  $,
  $$,
  openWindow,
  contextMenu,
  onMenu,
  typing,
  windowOpen,
  toast,
  setHTML,
} from "./ui.js";
import { activeRoom } from "./net.js";
import { now } from "./clock.js";
import { gameArtSVG, gameSymbol } from "./art.js";
import { MODES, CATS, modeOf, onCabin } from "./modes.js";
import { cardHTML } from "./card.js";
import { netHTML, kickItems } from "./players.js";
import { OPTIONS_DEFAULT, isSudo, minOf, mapTally } from "./rules.js";
import { downFor } from "./hangout/death.js";
import { profile, cleanName } from "./store.js";
import { openCustomize, setName } from "./customize.js";
import { openStats } from "./stats.js";
import { sfx } from "./sound.js";
import { darken, brighten, loadingScreen } from "./loading.js";
import { mountDocks, DOCK_HTML, BAR_HTML } from "./dock.js";
import { MAPS, mapMini, mapName } from "./maps.js";
import { acct, onAccount, requestFriend, canAdd } from "./account.js";
import { openFriends } from "./friends.js";
import { NAV_HINTS } from "./keynav.js";
import { musicBarHTML, mountMusicBar } from "./musicbar.js";
import { openSettings } from "./settings.js";

let R = null,
  off = null,
  offAcct = null,
  lastCount = -1,
  counting = false, // the start's countdown is running here (the screen fades to black over it)
  lastSeat = 0,
  docks = null,
  mbarOff = null;

const INFO = {
  type: "Which game, by kind: Social, Social Competitive, Cabin (in Duck Cabin) and Special.",
  map: "What the board looks like: pick one, let everyone vote (Vote Maps), or leave it to chance (Random).",
  options: "Question order, timers, and how many players end a turn.",
  start: "Starts the game for everyone.",
  friends: "Invite your friends to this room, or add a friend by code.",
};

/* ---------- the Game type and Map menus: rows that drop down from the row that opened them ----------
   Game type: first the kind of game (Social, Social Competitive, Cabin, Special), then the games of that kind, each a row
   with its symbol on the left and a circled i at the end (hover it on a computer, tap it on a phone, for what the game
   is). Map: Vote Maps at the top, Random under it (a die for its picture), Duck Cabin, then every other map, each row a
   slice of the map's picture. With Vote Maps on, every player votes in the same menu: Random or a map, never Duck Cabin.
   Only the host (or sudo) picks; everyone else sees the rows greyed, except their vote. */
let drop = null; // the open menu: { m, row, html }
function closeDrop() {
  if (!drop) return;
  const d = drop,
    had = d.m.contains(document.activeElement);
  drop = null;
  d.m.remove();
  removeEventListener("pointerdown", d.off, true);
  removeEventListener("keydown", d.key, true);
  removeEventListener("resize", d.place);
  removeEventListener("scroll", d.scroll, true);
  if (had && d.row.isConnected) d.row.focus({ preventScroll: true });
}
/* below the row when it fits, else above it (whichever side has more room), as wide as the lobby's menu, and never over
   the bottom bar (Notes, Jumps) */
function placeDrop() {
  if (!drop) return;
  const { m, row } = drop,
    r = row.getBoundingClientRect(),
    menu = row.closest(".lmenu").getBoundingClientRect(),
    bar = row.closest(".screen")?.querySelector(".bbar"),
    floor = bar
      ? Math.min(innerHeight, bar.getBoundingClientRect().top)
      : innerHeight, // (never over the bottom bar)
    below = floor - r.bottom - 10,
    above = r.top - 10,
    want = m.scrollHeight,
    down = want <= below || below >= above,
    h = Math.min(want, down ? below : above);
  m.style.left = menu.left + "px";
  m.style.width = menu.width + "px";
  m.style.maxHeight = h + "px";
  m.style.top = (down ? r.bottom + 4 : r.top - 4 - h) + "px";
}
function openDrop(row, html, onClick) {
  closeDrop();
  $$(".ctx").forEach((x) => x.remove());
  const m = el(`<div class="ctx ldrop" role="menu"></div>`);
  document.body.appendChild(m);
  drop = {
    m,
    row,
    html,
    place: placeDrop,
    scroll: (e) => {
      if (!m.contains(e.target)) placeDrop(); // (the lobby scrolled on a phone: the menu follows its row)
    },
    off: (e) => {
      if (!m.contains(e.target) && !row.contains(e.target)) closeDrop();
    },
    key: (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeDrop();
      }
    },
  };
  m.onclick = (e) => {
    const i = e.target.closest("[data-info]");
    if (i) {
      // the circled i: the game's line opens under its row (and closes again)
      const item = i.closest(".ld-item");
      item.classList.toggle("open");
      placeDrop();
      return;
    }
    const b = e.target.closest("button");
    if (b && b.getAttribute("aria-disabled") !== "true") onClick(b);
  };
  refreshDrop(true);
  setTimeout(() => {
    if (drop && drop.m === m) {
      addEventListener("pointerdown", drop.off, true);
      addEventListener("keydown", drop.key, true);
      addEventListener("resize", drop.place);
      addEventListener("scroll", drop.scroll, true);
    }
  });
}
/* the menu's rows again (a pick, a vote, someone else's change); the open i lines and the focus stay where they were */
function refreshDrop(first) {
  if (!drop) return;
  const { m } = drop,
    html = drop.html();
  if (!first && html === m._html) return;
  const open = $$(".ld-item.open", m).map((x) => x.dataset.k),
    sig =
      document.activeElement && m.contains(document.activeElement)
        ? document.activeElement.dataset.k
        : null,
    top = m.scrollTop;
  m._html = html;
  m.innerHTML = html;
  open.forEach((k) => $(`.ld-item[data-k="${k}"]`, m)?.classList.add("open"));
  placeDrop();
  m.scrollTop = top;
  const f =
    (sig && $(`button[data-k="${sig}"]`, m)) ||
    (first && ($("[aria-pressed='true']", m) || $("button", m)));
  if (f) f.focus({ preventScroll: !first });
}

const lock = (on) => (on ? "" : ' aria-disabled="true"');
const hostNote = (what) =>
  `<p class="ld-note small dim">Only the host (or sudo) picks the ${what}.</p>`;

/* Game type */
let typeCat = null; // the kind open in the menu (null: the kinds)
function typesHTML() {
  const s = R.state,
    host = isSudo(s, R.me),
    cur = s.options.mode || "aod";
  if (!typeCat)
    return (
      (host ? "" : hostNote("game")) +
      CATS.map(
        ([k, name, tip]) =>
          `<button type="button" role="menuitem" class="ld-row ld-cat" data-cat="${k}" data-k="cat-${k}" aria-current="${modeOf(cur).cat === k}" data-tip="${esc(tip)}"><b>${esc(name)}</b><span class="ld-syms">${MODES.filter(
            (m) => m.cat === k,
          )
            .map((m) => gameSymbol(m.id, 20))
            .join(
              "",
            )}</span><span class="ld-go" aria-hidden="true">›</span></button>`,
      ).join("")
    );
  return (
    `<button type="button" role="menuitem" class="ld-row ld-back" data-back="1" data-k="back"><span class="ld-go" aria-hidden="true">‹</span><b>${esc(CATS.find((c) => c[0] === typeCat)[1])}</b></button>` +
    (host ? "" : hostNote("game")) +
    MODES.filter((m) => m.cat === typeCat)
      .map(
        (m) =>
          `<div class="ld-item" data-k="${m.id}"><button type="button" role="menuitem" class="ld-row ld-mode" data-mode="${m.id}" data-k="m-${m.id}" aria-pressed="${m.id === cur}"${lock(host)}><span class="ld-sym">${gameSymbol(m.id, 30)}</span><b>${esc(m.name)}</b></button><button type="button" class="ld-i" data-info="1" data-k="i-${m.id}" aria-label="What is ${esc(m.name)}?" data-tip="${esc(m.tip)}">i</button><p class="ld-tip small">${esc(m.tip)}</p></div>`,
      )
      .join("")
  );
}
function openTypes(row) {
  const s = R.state;
  typeCat = onCabin(s.options.mode) ? "cabin" : null; // (on Duck Cabin it opens on the Cabin games)
  openDrop(row, typesHTML, (b) => {
    if (b.dataset.cat) typeCat = b.dataset.cat;
    else if (b.dataset.back) typeCat = null;
    else if (b.dataset.mode && isSudo(R.state, R.me)) {
      R.send({ t: "options", options: { mode: b.dataset.mode } });
      closeDrop();
      return;
    }
    refreshDrop(true);
  });
}

/* Map: Random's die, Vote Maps' strip of four maps, then each map's own picture, as a slice the shape of the row */
const DIE = `<svg class="ld-die" viewBox="0 0 480 64" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="480" height="64" fill="#1b1d2b"/>${[
  [40, 14, "#ed1c24"],
  [92, 48, "#2fa4ff"],
  [150, 20, "#37d421"],
  [330, 44, "#ffd23f"],
  [390, 12, "#9b5de5"],
  [446, 46, "#ff8c2b"],
]
  .map(
    ([x, y, c]) =>
      `<circle cx="${x}" cy="${y}" r="9" fill="${c}" opacity=".55"/>`,
  )
  .join(
    "",
  )}<ellipse cx="240" cy="58" rx="27" ry="4" fill="#000" opacity=".35"/><path d="M216 18 l12 -9 h36 l-12 9 z" fill="#e6e8f0" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/><path d="M252 18 l12 -9 v34 l-12 9 z" fill="#c9ccd8" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/><rect x="216" y="18" width="36" height="34" rx="5" fill="#fff" stroke="#1c1c28" stroke-width="2"/>${[
  [224, 26, "#ed1c24"],
  [244, 26, "#2fa4ff"],
  [234, 35, "#37d421"],
  [224, 44, "#ffd23f"],
  [244, 44, "#9b5de5"],
]
  .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}"/>`)
  .join(
    "",
  )}<circle cx="234" cy="13.5" r="2.2" fill="#ff8c2b"/><circle cx="246" cy="13.5" r="2.2" fill="#ff8c2b"/><circle cx="256" cy="22" r="2" fill="#ed1c24"/><circle cx="258" cy="31" r="2" fill="#ed1c24"/><circle cx="260" cy="40" r="2" fill="#ed1c24"/></svg>`;
const MAP_ROWS = () => [
  ...MAPS,
  [
    "cabin",
    "Duck Cabin",
    "A log cabin at night with a deck, a pool and a campfire. Its own games are the Cabin ones: picking it picks Hangout.",
  ],
];
function mapRow(k, name, tip, pic, { on, ok, n, attr }) {
  return `<button type="button" role="menuitem" class="ld-row ld-map" ${attr} data-k="${k}" aria-pressed="${!!on}" data-tip="${esc(tip)}"${lock(ok)}><span class="ld-pic">${pic}</span><b class="ld-name">${esc(name)}</b>${n ? `<span class="ld-n" aria-label="${n} vote${n === 1 ? "" : "s"}">${n}</span>` : ""}</button>`;
}
let allMaps = false; // on Duck Cabin, the other maps show only after All maps
function mapsHTML() {
  const s = R.state,
    host = isSudo(s, R.me),
    pick = s.options.mapPick || "",
    cabin = onCabin(s.options.mode),
    mine = (s.mapVotes || {})[R.me],
    n = mapTally(s);
  const strip = `<span class="mini-map ld-strip">${MAPS.slice(0, 4)
    .map((m) => mapMini(m[0]))
    .join("")}</span>`;
  if (cabin && !allMaps)
    return (
      (host ? "" : hostNote("map")) +
      mapRow("cabin", "Duck Cabin", MAP_ROWS().at(-1)[2], mapMini("cabin"), {
        on: true,
        ok: host,
        attr: 'data-map="cabin"',
      }) +
      `<button type="button" role="menuitem" class="ld-row ld-back" data-all="1" data-k="all"><b>All maps</b><span class="ld-go" aria-hidden="true">›</span></button>`
    );
  const vote = pick === "vote" && !cabin;
  return (
    (vote
      ? '<p class="ld-note small dim">Everyone votes. Only the host (or sudo) turns Vote Maps off.</p>'
      : host
        ? ""
        : hostNote("map")) +
    mapRow(
      "vote",
      "Vote Maps",
      "Everyone votes for a map (or Random); a tie is a random pick between the tied maps.",
      strip,
      { on: vote, ok: host, attr: 'data-pick="vote"' },
    ) +
    (vote
      ? `<p class="ld-head small">Your vote</p>` +
        [["random", "Random", "Any map, picked when the game starts.", DIE]]
          .concat(MAPS.map(([id, name, tip]) => [id, name, tip, mapMini(id)]))
          .map(([id, name, tip, pic]) =>
            mapRow("v-" + id, name, tip, pic, {
              on: mine === id,
              ok: true,
              n: n[id],
              attr: `data-vote="${id}"`,
            }),
          )
          .join("")
      : mapRow(
          "random",
          "Random",
          "Any map, picked when the game starts.",
          DIE,
          {
            on: pick === "random" && !cabin,
            ok: host,
            attr: 'data-pick="random"',
          },
        ) +
        [MAP_ROWS().at(-1), ...MAPS]
          .map(([id, name, tip]) =>
            mapRow(id, name, tip, mapMini(id), {
              on: !(pick && !cabin) && s.options.map === id,
              ok: host,
              attr: `data-map="${id}"`,
            }),
          )
          .join(""))
  );
}
function openMaps(row) {
  allMaps = false;
  openDrop(row, mapsHTML, (b) => {
    const s = R.state,
      host = isSudo(s, R.me);
    if (b.dataset.all) {
      allMaps = true;
      refreshDrop(true);
      return;
    }
    if (b.dataset.vote) {
      R.send({ t: "mapVote", map: b.dataset.vote });
      return; // (the menu stays open: the counts change as the votes come in)
    }
    if (!host) return;
    if (b.dataset.pick) {
      const on =
        s.options.mapPick === b.dataset.pick && !onCabin(s.options.mode);
      R.send({
        t: "options",
        options: {
          mapPick: on && b.dataset.pick === "vote" ? "" : b.dataset.pick,
        },
      }); // (Vote Maps again turns it off; then the host's map is back)
      if (b.dataset.pick === "random") closeDrop();
      return;
    }
    if (b.dataset.map) {
      R.send({ t: "options", options: { map: b.dataset.map } });
      closeDrop();
    }
  });
}

/* ---------- Game options: the host edits them; everyone else sees them ---------- */
/* the options most hosts want; the rest wait under Additional settings so a straightforward host never sees them */
const OPT_TILES = [
  [
    "order",
    "Question order",
    [
      ["random", "Random"],
      ["rotate", "Rotating"],
    ],
  ],
  [
    "share",
    "Turn ends when done",
    [
      [0.5, "Half"],
      [0.67, "2 of 3"],
      [0.75, "3 of 4"],
      [1, "Everyone"],
    ],
  ],
  [
    "catchUp",
    "Catch-up timer",
    [
      [0, "Off"],
      [15, "15 s"],
      [30, "30 s"],
      [45, "45 s"],
    ],
  ],
  [
    "writeCatch",
    "Writing catch-up timer",
    [
      [0, "Off"],
      [15, "15 s"],
      [30, "30 s"],
      [45, "45 s"],
      [60, "60 s"],
    ],
  ],
  [
    "answerTime",
    "Answer timer",
    [
      [0, "Off"],
      [30, "30 s"],
      [60, "60 s"],
      [90, "90 s"],
    ],
  ],
];
/* Bicker Brackets' own options (shown when it's the game) */
const BB_TILES = [
  [
    "bbSeeds",
    "Contenders",
    [
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
  ],
  [
    "bbTopic",
    "Topic",
    [
      ["vote", "Write and vote"],
      ["random", "Random"],
    ],
  ],
  [
    "bbBlind",
    "Writers",
    [
      [0, "Shown"],
      [1, "Hidden until out"],
    ],
  ],
  [
    "bbReview",
    "Review each round",
    [
      [0, "Off"],
      [1, "On"],
    ],
  ],
  [
    "bbTimer",
    "Match vote timer",
    [
      [0, "None"],
      [10, "10 s"],
      [30, "30 s"],
      [60, "60 s"],
    ],
  ],
];
/* Story Chain's own options */
const SC_TILES = [
  [
    "scTime",
    "Writing time",
    [
      [0, "Off"],
      [60, "60 s"],
      [90, "90 s"],
      [120, "120 s"],
    ],
  ],
  [
    "scVote",
    "Voting",
    [
      ["auto", "Auto"],
      [1, "On"],
      [0, "Off"],
    ],
  ],
];
/* Who is the Quack?'s own options */
const QUACK_TILES = [
  [
    "wqPicker",
    "Secret word",
    [
      ["player", "A random player picks it"],
      ["list", "From the built-in list"],
    ],
  ],
  [
    "wqPickTime",
    "Time to pick the word",
    [
      [30, "30 s"],
      [60, "60 s"],
      [90, "90 s"],
    ],
  ],
  [
    "wqQuacks",
    "Quacks",
    [
      [1, "1"],
      [2, "2 (6+ players)"],
    ],
  ],
  [
    "wqTimer",
    "Vote timer",
    [
      [0, "None"],
      [30, "30 s"],
      [60, "60 s"],
      [90, "90 s"],
    ],
  ],
];
/* Lawyering's own options */
const LAW_TILES = [
  [
    "lawDef",
    "Defense attorney",
    [
      ["random", "Random"],
      ["writer", "Writer picks"],
      ["vote", "Room votes"],
    ],
  ],
  [
    "lawOff",
    "Offense attorney",
    [
      ["random", "Random"],
      ["writer", "Writer picks"],
      ["vote", "Room votes"],
    ],
  ],
  [
    "lawClose",
    "Closing arguments",
    [
      [30, "30 s"],
      [60, "1 min"],
      [120, "2 min"],
    ],
  ],
];
/* Duncelation's own options */
const DUNCE_TILES = [
  [
    "dunceTime",
    "Take timer",
    [
      [0, "Off"],
      [60, "1 min"],
      [120, "2 min"],
      [180, "3 min"],
      [300, "5 min"],
    ],
  ],
  [
    "dunceTakes",
    "Takes",
    [
      ["random", "Random"],
      ["own", "Write your own"],
      ["notOwn", "Never your own"],
    ],
  ],
];
/* Mad God Justin's own option */
/* Valentine's Duck Date's own option */
const VDD_TILES = [
  [
    "vdTime",
    "Date timer",
    [
      [0, "Off"],
      [60, "1 min"],
      [90, "1:30"],
      [120, "2 min"],
    ],
  ],
];
const MGJ_TILES = [
  [
    "mgjTime",
    "Time to beat him",
    [
      [60, "1 min"],
      [90, "1:30"],
      [120, "2 min"],
    ],
  ],
];
const MORE_TILES = [
  [
    "mgjHp",
    "Player HP",
    [
      [0, "Off"],
      [1, "1"],
      [5, "5"],
      [10, "10"],
      [15, "15"],
    ],
  ], // (Mad God Justin only)
  [
    "discuss",
    "Discussion round",
    [
      [0, "Off"],
      [1, "On"],
    ],
  ],
  [
    "freeRoam",
    "Answering",
    [
      [0, "Lock answers"],
      [1, "Free roam"],
    ],
  ],
  [
    "submitTime",
    "Question time limit",
    [
      [0, "Off"],
      [60, "60 s"],
      [90, "90 s"],
      [120, "120 s"],
    ],
  ],
  [
    "lowGravity",
    "Jumps",
    [
      [0, "Normal"],
      [1, "Low gravity"],
    ],
  ],
  [
    "fun",
    "Silly commands",
    [
      [1, "On"],
      [0, "Off"],
    ],
  ],
  [
    "justin",
    "Justin",
    [
      [0, "Off"],
      [1, "On"],
    ],
  ],
  [
    "downMs",
    "Knocked down for",
    [
      [0, "None"],
      [500, "0.5 s"],
      [1000, "1 s"],
      [2000, "2 s"],
      [3000, "3 s"],
      [5000, "5 s"],
      [6000, "6 s"],
    ],
  ],
  [
    "ghosts",
    "Ghosts",
    [
      [0, "Off"],
      [1, "On"],
    ],
  ],
  [
    "ghostBusy",
    "No ghosts while busy",
    [
      [1, "On"],
      [0, "Off"],
    ],
  ],
  [
    "stats",
    "Stats screen",
    [
      [1, "On"],
      [0, "Off"],
    ],
  ],
  [
    "unvoteStops",
    "Unvoting stops the countdown",
    [
      [0, "No"],
      [1, "Yes"],
    ],
  ],
];
let moreOpen = false;
const OPT_TIPS = {
  discuss:
    "A round after each vote to look at where everyone stood and talk it over.",
  share:
    "Once this many players have voted, the catch-up timer starts. Everyone voting ends the turn at once.",
  catchUp:
    "How long the rest get once enough players have voted. Off: the turn ends as soon as enough have voted.",
  writeCatch:
    "How long the last writers get once enough players have sent theirs. Off: writing ends as soon as enough have sent.",
  unvoteStops:
    "Yes: if votes are taken back below the needed share, the countdown stops. No: once it starts, it runs out.",
  answerTime: "The Round Lord's answer time unless they choose another.",
  submitTime: "A time limit on writing questions.",
  freeRoam:
    "Free roam: no ending your turn to lock an answer and no talk-it-over step; ducks roam until the turn ends, and where they stand then is their answer.",
  fun: "lightning, love, kill and hotdog in the command line.",
  downMs:
    "How long a duck that plays dead (shot, stabbed, or killed) can't move. None: it can move at once. 0.5 s on the boards, 6 s in Duck Cabin, unless you choose another.",
  ghostBusy:
    "With Ghosts on: a duck holding the chalk or the eraser, at the piano, writing in the guestbook, at a card table or in a seat just gets up instead of becoming a ghost.",
  ghosts:
    "Duck Cabin: once its knocked-down time is up, a duck's ghost gets up and walks about while its body lies there. A ghost can't be hit or use anything. Space brings it back.",
  justin:
    "Justin from Duck Cabin walks the board, always against the room, talks and shoots now and then. He never counts.",
  stats:
    "The stats after each round. Off: the next round starts at once (in Story Chain, the story just goes on).",
  bbReview:
    "On: after every round of matches the room looks at the bracket together (who is out, who is next). Off: only the champion's bracket shows.",
  bbSeeds:
    "How many contenders the bracket has: a number shared out among the players, or so many for each player.",
  bbTopic:
    "Everyone writes a topic and votes on them, or the room gets a random one.",
  bbBlind:
    "Hidden: a contender's writer stays a secret until it is knocked out or wins it all.",
  bbTimer:
    "None: a match vote waits for everyone, so players can try to sway each other. A tie goes to a vote: vote again, or toss a coin.",
  scTime:
    "How long each writer gets for their line. Off: as long as they need. When time runs out, whatever is typed is sent.",
  scVote:
    "Voting on the favorite line and secret word after each paragraph. Off: the story just keeps going. Auto: off with 2 or 3 players, on with 4 or more.",
  wqPicker:
    "Each round a random player (never the Quack) picks the secret word and its category, or the game picks one.",
  wqPickTime:
    "When time runs out, whatever the picker typed is used, or a word from the list.",
  wqQuacks: "Two Quacks only with 6 or more players.",
  wqTimer: "None: a vote waits for everyone, so players can argue it out.",
  lawDef:
    "Who argues for each topic: anyone but its writer, picked at random, by the writer, or by a vote of the room.",
  lawOff:
    "Who argues against each topic (it can be the writer): picked at random, by the writer, or by a vote of the room.",
  lawClose:
    "When the jury is split, the attorneys get this long to win them over; then the bigger side wins.",
  vdTime:
    "How long each date lasts, after 10 s of grace. Off: a date lasts until The Date presses Next duck (The Date can press it any time).",
  dunceTime:
    "How long the defender gets after the 15 s grace period. Off: the turn ends once enough have voted and the catch-up timer runs out.",
  mgjHp:
    "Each duck gets this much HP: a hit from Justin takes 1 and the duck stays up, and the last one knocks it down as usual. It stands up with full HP. Off: one hit knocks a duck down.",
  mgjTime:
    "How long the ducks get to bring Justin's HP to 0. His meteor adds 30 seconds. Only wins at 1:30 count toward the lightning eyes.",
  dunceTakes:
    "Random: the takes are handed out at random, so you might get your own. Write your own: you defend what you wrote. Never your own: always someone else's.",
};
const tileRows = (rows, s, ro) =>
  rows
    .map(
      ([k, label, opts]) =>
        `<div class="sect"><h3${OPT_TIPS[k] ? ` data-tip="${esc(OPT_TIPS[k])}"` : ""}>${esc(label)}</h3><div class="row">${opts
          .map(
            ([v, n]) =>
              `<button type="button" class="tile" data-k="${k}" data-v="${v}" aria-pressed="${(k === "downMs" ? downFor(s) : s.options[k]) === v}"${ro}>${n}</button>`,
          )
          .join("")}</div></div>`,
    )
    .join("");
function openOptions() {
  const s = R.state,
    host = isSudo(s, R.me),
    ro = host ? "" : ' aria-disabled="true"';
  return openWindow(
    `<h2>Game options</h2>${host ? "" : '<p class="small dim" style="margin:-.3rem 0 .6rem">Only the host (or sudo) changes these.</p>'}
    ${s.options.mode === "bb" ? `<h3 class="opt-h">Bicker Brackets</h3>${tileRows(BB_TILES, s, ro)}` : ""}
    ${s.options.mode === "sc" ? `<h3 class="opt-h">Story Chain</h3>${tileRows(SC_TILES, s, ro)}` : ""}
    ${s.options.mode === "quack" ? `<h3 class="opt-h">Who is the Quack?</h3>${tileRows(QUACK_TILES, s, ro)}` : ""}
    ${s.options.mode === "law" ? `<h3 class="opt-h">Lawyering; Juryful of Ducklings</h3>${tileRows(LAW_TILES, s, ro)}` : ""}
    ${s.options.mode === "dunce" ? `<h3 class="opt-h">Duncelation</h3>${tileRows(DUNCE_TILES, s, ro)}` : ""}
    ${s.options.mode === "mgj" ? `<h3 class="opt-h">Mad God Justin</h3>${tileRows(MGJ_TILES, s, ro)}` : ""}
    ${s.options.mode === "vdd" ? `<h3 class="opt-h">Valentine's Duck Date</h3>${tileRows(VDD_TILES, s, ro)}` : ""}
    ${
      ["hang", "vdd"].includes(s.options.mode)
        ? ""
        : tileRows(
            OPT_TILES.filter(
              (r) =>
                !(s.options.mode === "mgj" && r[0] !== "share") &&
                !(
                  ["bb", "sc"].includes(s.options.mode) &&
                  ["order", "answerTime"].includes(r[0])
                ) &&
                !(
                  s.options.mode === "quack" &&
                  ["order", "answerTime", "catchUp", "writeCatch"].includes(
                    r[0],
                  )
                ) &&
                !(s.options.mode === "law" && r[0] === "answerTime") &&
                !(
                  s.options.mode === "dunce" &&
                  ["order", "answerTime"].includes(r[0])
                ),
            ),
            s,
            ro,
          )
    }
    <details class="more"${moreOpen ? " open" : ""}><summary>Additional settings</summary>
    ${tileRows(
      MORE_TILES.map(([k, n, o]) =>
        k === "downMs" && s.options.mode !== "hang"
          ? [k, n, o.filter((x) => x[0] !== 6000)]
          : [k, n, o],
      ).filter(
        (r) =>
          !(
            s.options.mode === "mgj" &&
            [
              "discuss",
              "freeRoam",
              "submitTime",
              "justin",
              "downMs",
              "stats",
              "unvoteStops",
            ].includes(r[0])
          ) &&
          !(
            ["sc", "quack"].includes(s.options.mode) &&
            ["freeRoam", "submitTime"].includes(r[0])
          ) &&
          !(["law", "dunce"].includes(s.options.mode) && r[0] === "freeRoam") &&
          !(
            s.options.mode === "vdd" &&
            [
              "discuss",
              "freeRoam",
              "submitTime",
              "justin",
              "unvoteStops",
            ].includes(r[0])
          ) &&
          !(
            s.options.mode === "hang" &&
            ["freeRoam", "submitTime", "justin", "unvoteStops"].includes(r[0])
          ) &&
          !(
            ["sc", "quack", "hang"].includes(s.options.mode) &&
            r[0] === "discuss"
          ) &&
          !(s.options.mode === "quack" && r[0] === "unvoteStops") &&
          !(
            s.options.mode !== "hang" && ["ghosts", "ghostBusy"].includes(r[0])
          ) &&
          !(s.options.mode !== "mgj" && r[0] === "mgjHp"),
      ),
      s,
      ro,
    )}
    ${
      s.test
        ? `<div class="sect"><h3 data-tip="How long computers wait before they act each phase.">Computers wait</h3><div class="row">${[
            5, 15, 30, 60,
          ]
            .map(
              (v) =>
                `<button type="button" class="tile" data-k="botWait" data-v="${v}" aria-pressed="${s.options.botWait === v}"${ro}>${v} s</button>`,
            )
            .join("")}</div></div>`
        : ""
    }
    </details>
    <div class="sect"><h3>Room</h3><div class="row">
      <label class="numfield">Players up to <select data-k="max"${host ? "" : " disabled"}>${[
        2, 3, 4, 5, 6, 7, 8, 10, 12, 16,
      ]
        .filter((n) => n >= s.seat.length)
        .map((n) => `<option${n === s.max ? " selected" : ""}>${n}</option>`)
        .join("")}</select></label>
      ${
        s.test
          ? `<label class="numfield">Computers <select data-k="computers"${host ? "" : " disabled"}>${Array.from(
              { length: s.max },
              (_, n) => n,
            )
              .filter((n) => n <= s.max - 1)
              .map(
                (n) =>
                  `<option${n === s.seat.filter((id) => s.players[id].bot).length ? " selected" : ""}>${n}</option>`,
              )
              .join("")}</select></label>`
          : ""
      }
    </div></div>
    ${host ? '<p class="acts"><button type="button" class="btn ghost" data-a="reset">Defaults</button></p>' : ""}`,
    {
      cls: "win-settings",
      onOpen(w, close) {
        w.querySelector("details.more").addEventListener("toggle", (e) => {
          moreOpen = e.target.open;
        });
        if (!host) return;
        w.addEventListener("click", (e) => {
          const t = e.target.closest(".tile[data-k]");
          if (t) {
            const v = t.dataset.v;
            R.send({
              t: "options",
              options: { [t.dataset.k]: v !== "" && !isNaN(v) ? +v : v },
            });
            $$(`.tile[data-k="${t.dataset.k}"]`, w).forEach((b) =>
              b.setAttribute("aria-pressed", b === t),
            );
          }
          if (e.target.closest('[data-a="reset"]')) {
            R.send({ t: "options", options: { ...OPTIONS_DEFAULT } });
            close();
            openOptions();
          }
        });
        w.addEventListener("change", (e) => {
          const k = e.target.dataset.k;
          if (k === "max")
            R.send({ t: "options", options: {}, max: +e.target.value });
          if (k === "computers") R.setComputers(+e.target.value);
        });
      },
    },
  );
}

/* ---------- a player card's options (a click, a right-click or a long press) ----------
   Your own card: View stats, Customize, and your name in a box below them, to type a new one right there. */
function cardMenu(pid, x, y) {
  const s = R.state,
    p = s.players[pid];
  if (!p) return;
  const mine = pid === R.me,
    items = [["View stats", () => openStats(s, pid, R.me)]];
  if (mine) items.push(["Customize", () => openCustomize()]);
  if (isSudo(s, R.me) && p.bot && (s.phase === "lobby" || s.phase === "over"))
    items.push(["Remove computer", () => R.send({ t: "kick", who: pid })]);
  else if (!p.bot) items.push(...kickItems(R, pid));
  if (canAdd(p))
    items.push(["Add friend", async () => toast(await requestFriend(p.acct))]);
  contextMenu(
    x,
    y,
    items,
    !mine
      ? {}
      : {
          footer: `<label class="ctx-name"><span class="small dim">Name</span><input maxlength="20" spellcheck="false" value="${esc(profile.name)}" aria-label="Your name"></label>`,
          onMount(m, close) {
            const inp = m.querySelector(".ctx-name input"),
              was = profile.name;
            const done = () => {
              if (inp.value !== was && !setName(inp.value))
                toast("A name needs at least one letter or number.");
              $(".party-list", S)._html = "";
              paint();
            };
            inp.oninput = () => {
              const c = cleanName(inp.value);
              if (c !== inp.value) {
                inp.value = c;
                inp.classList.add("shake");
                setTimeout(() => inp.classList.remove("shake"), 300);
              }
            };
            inp.onkeydown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                done();
                close();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              }
              e.stopPropagation();
            };
            inp.onchange = done;
          },
        },
  );
}

/* ---------- drawing ---------- */
let S = null; // the screen
function paint() {
  if (!R || !S) return;
  const s = R.state,
    host = isSudo(s, R.me),
    mine = s.players[R.me];
  if (!mine) return;
  const title = $(".lobby-title", S);
  if (!title.querySelector("input")) {
    title.textContent = s.name;
    title.classList.toggle("can-rename", host);
    if (host) title.dataset.tip = "Click to rename the room";
    else delete title.dataset.tip;
  }
  const bots = s.seat.filter((id) => s.players[id].bot).length;
  $(".lobby-sub", S).textContent = [
    s.test
      ? "TEST room"
      : s.open
        ? "Open room"
        : R.passkey
          ? `Private room · passkey: ${R.passkey}`
          : "Private room",
    bots
      ? `${bots} computer${bots === 1 ? "" : "s"}, acting after ${s.options.botWait} s`
      : "",
    s.hostId === R.me
      ? "You are the host"
      : host
        ? "You have sudo: you can run the room too"
        : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const st = $(".lobby-status", S);
  if (s.phase === "countdown") {
    const left = Math.max(0, Math.ceil((s.ends - now()) / 1000));
    setHTML(
      st,
      `<span class="count">Starting in <b>${left}</b></span><button type="button" class="btn red" data-a="cancel">Cancel <kbd>X</kbd></button>`,
    );
  } else {
    setHTML(
      st,
      `<button type="button" class="ready-btn${mine.ready ? " on" : ""}" data-a="ready" aria-pressed="${!!mine.ready}">${mine.ready ? "Ready ✓" : "Not ready"}</button>`,
    );
  }
  const startRow = $('[data-m="start"]', S);
  const few = s.seat.length < minOf(s); // Who is the Quack? and Lawyering need 3 ducks
  startRow.setAttribute(
    "aria-disabled",
    String(!host || s.phase === "countdown" || few),
  );
  $(".val", startRow).textContent = few
    ? `Needs ${minOf(s)} players`
    : host
      ? s.phase === "countdown"
        ? ""
        : `${s.seat.filter((id) => s.players[id].ready).length}/${s.seat.length} ready`
      : "The host starts";
  $('[data-m="options"] .val', S).textContent = host ? "Edit" : "View";
  const pick = onCabin(s.options.mode) ? "" : s.options.mapPick || "",
    pickName = { vote: "Vote Maps", random: "Random" }[pick];
  $('[data-m="map"] .val', S).textContent = pickName || mapName(s.options.map);
  const fr = $('[data-m="friends"] .val', S);
  if (fr)
    fr.textContent = acct.uid
      ? `${Object.values(acct.friends).filter((f) => f.on).length} online`
      : "Sign in";
  const mode = s.options.mode || "aod",
    art = $(".lobby-art", S),
    artSig =
      (s.options.map || "board") + pick + mode + JSON.stringify(profile.duck); // the picture shows the game and the map
  if (art._sig !== artSig) {
    art._sig = artSig;
    art.innerHTML = gameArtSVG({
      width: 480,
      duck: profile.duck,
      map: pick ? "board" : s.options.map || "board",
      mapLabel: pickName || mapName(s.options.map),
      mode,
    });
  }
  setHTML(
    $('[data-m="type"] .val', S),
    `${gameSymbol(mode, 20)} ${esc(modeOf(mode).name)}`,
  );
  $(".party-count", S).textContent = `In lobby ${s.seat.length}/${s.max}`;
  const list = $(".party-list", S);
  if (!list.querySelector("input.rename"))
    setHTML(
      list,
      s.seat
        .map((id) =>
          cardHTML(s.players[id], {
            me: id === R.me,
            host: id === s.hostId,
            ready: !!s.players[id].ready,
            net:
              R.online && !s.players[id].bot
                ? netHTML(s.players[id], true)
                : "",
          }),
        )
        .join(""),
    );
  refreshDrop(false);
  if (s.seat.length > lastSeat && lastSeat) sfx.pop();
  lastSeat = s.seat.length;
}

function onState(s) {
  if (!S) return;
  if (!["lobby", "countdown"].includes(s.phase)) {
    if (lastCount > 0) sfx.count(true);
    const started = counting;
    lastCount = -1;
    counting = false;
    const room = R;
    go("game", room);
    if (started)
      loadingScreen({
        duck: profile.duck,
        ping: () => (room.ping ? room.ping() : 0),
        ready: () =>
          new Promise((r) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                (document.fonts
                  ? document.fonts.ready
                  : Promise.resolve()
                ).then(r),
              ),
            ),
          ),
      });
    return;
  } // the countdown's last tone, at zero
  if (s.phase === "countdown") {
    const left = Math.max(0, Math.ceil((s.ends - now()) / 1000));
    if (!counting) {
      counting = true;
      darken(Math.max(0, s.ends - now()));
    }
    if (left !== lastCount) {
      sfx.count(left === 0);
      lastCount = left;
    }
  } else {
    if (counting) brighten(); // (cancelled: the screen comes back)
    counting = false;
    lastCount = -1;
  }
  paint();
}

/* Space: ready */
function key(e) {
  if (!S || typing(e) || windowOpen()) return;
  if (e.code === "Space" && !e.repeat) {
    e.preventDefault();
    toggleReady();
  }
  if (e.key === "Escape" && !e.repeat) {
    e.preventDefault();
    openPause();
  }
  if (
    (e.key === "x" || e.key === "X") &&
    !e.repeat &&
    R &&
    R.state.phase === "countdown"
  ) {
    e.preventDefault();
    R.send({ t: "cancel" });
  }
}
/* the pause menu, as in a game (☰ at the top right, or Esc) */
function openPause() {
  if (windowOpen()) return;
  openWindow(
    `<h2>Paused</h2><div class="pause-list">
    <button type="button" class="btn green" data-a="resume">Resume</button>
    <button type="button" class="btn ghost" data-a="custom">Customize</button>
    <button type="button" class="btn ghost" data-a="settings">Settings</button>
    <button type="button" class="btn ghost" data-a="friends">Friends</button>
    <button type="button" class="btn red" data-a="leave">Leave room</button></div>`,
    {
      cls: "win-small",
      onOpen: (w, close) =>
        (w.querySelector(".pause-list").onclick = (e) => {
          const a = e.target.closest("[data-a]");
          if (!a) return;
          close();
          ({
            resume() {},
            custom: () => openCustomize(),
            settings: () => openSettings(),
            friends: () => openFriends(),
            leave: () => leaveTo("rooms"),
          })[a.dataset.a]();
        }),
    },
  );
}
const toggleReady = () => {
  R.send({ t: "ready" });
  sfx.tick();
};
/* the host renames the room in place (Enter or clicking away keeps it, Esc doesn't) */
function renameRoom() {
  const title = $(".lobby-title", S);
  if (!title || title.querySelector("input")) return;
  const inp = el(
    `<input class="room-rename" maxlength="32" spellcheck="false" aria-label="Room name">`,
  );
  inp.value = R.state.name;
  title.textContent = "";
  title.append(inp);
  inp.focus();
  inp.select();
  let done = false;
  const finish = (keep) => {
    if (done) return;
    done = true;
    const v = inp.value.trim();
    inp.remove();
    if (keep && v && v !== R.state.name) R.send({ t: "roomName", name: v });
    paint();
  };
  inp.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  };
  inp.onblur = () => finish(true);
}

register("lobby", {
  guard: () => !!activeRoom(),
  exit() {
    const r = activeRoom();
    if (r) {
      r.send({ t: "leave" });
      r.close();
    }
  },
  leave() {
    closeDrop();
    if (off) off();
    off = null;
    if (mbarOff) mbarOff();
    mbarOff = null;
    if (offAcct) offAcct();
    offAcct = null;
    if (docks) docks.destroy();
    docks = null;
    if (counting) brighten(); // (left the room in the countdown)
    counting = false;
    clearInterval(S && S._tick);
    S = null;
    removeEventListener("keydown", key);
  },
  render(arg) {
    R = arg || activeRoom();
    if (!R) return null;
    if (!["lobby", "countdown"].includes(R.state.phase)) {
      setTimeout(() => go("game", R));
    }
    S = el(`<section class="screen lobby docked">
      <header class="lbar">${musicBarHTML()}<button type="button" class="btn ghost iconbtn lobby-pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button><button type="button" class="win-x lobby-x" aria-label="Leave the room" data-tip="Leave the room">×</button></header>
      <div class="gmain lmain">
      <div class="lobby-left">
        <div class="lobby-art">${gameArtSVG({ width: 480, duck: profile.duck })}</div>
        <h1 class="lobby-title"></h1>
        <p class="lobby-sub dim"></p>
        <div class="lobby-status" data-nav-start></div>
        <div class="lmenu" role="menu">
          <button type="button" role="menuitem" data-m="type"><span>Game type</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="map"><span>Map</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="options"><span>Game options</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="start" class="start"><span>Start game</span><span class="val"></span></button>
          ${R.online ? '<button type="button" role="menuitem" data-m="friends"><span>Friends</span><span class="val"></span></button>' : ""}
        </div>
        <p class="lmenu-info dim">${INFO.start}</p>
      </div>
      <aside class="party"><header><h2>Party</h2><span class="party-count dim"></span></header><div class="party-list"></div></aside>
      </div>${DOCK_HTML}${BAR_HTML()}
    </section>`);
    docks = mountDocks(
      S,
      `<kbd>Space</kbd> Ready <kbd>T</kbd> Chat <kbd>Right-click</kbd> Card options ${NAV_HINTS}`,
    );
    lastSeat = 0;
    mbarOff = mountMusicBar(S);
    S.querySelector(".lobby-x").onclick = () => leaveTo("rooms");
    S.querySelector(".lobby-pause").onclick = () => openPause();
    const info = S.querySelector(".lmenu-info");
    S.querySelector(".lmenu").addEventListener("pointerover", (e) => {
      const b = e.target.closest("[data-m]");
      if (b) info.textContent = INFO[b.dataset.m];
    });
    S.querySelector(".lmenu").addEventListener("focusin", (e) => {
      const b = e.target.closest("[data-m]");
      if (b) info.textContent = INFO[b.dataset.m];
    });
    S.querySelector(".lmenu").onclick = (e) => {
      const b = e.target.closest("[data-m]");
      if (!b) return;
      const m = b.dataset.m;
      if (m === "type" || m === "map") {
        const again = drop && drop.row === b; // (its row again closes the menu)
        closeDrop();
        if (!again) (m === "type" ? openTypes : openMaps)(b);
      }
      if (m === "options") openOptions();
      if (m === "start" && b.getAttribute("aria-disabled") !== "true")
        R.send({ t: "start" });
      if (m === "friends") openFriends();
    };
    S.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]");
      if (a && a.dataset.a === "ready") toggleReady();
      if (a && a.dataset.a === "cancel") R.send({ t: "cancel" });
      if (
        e.target.closest(".lobby-title.can-rename") &&
        !e.target.closest("input")
      )
        renameRoom();
      const c = e.target.closest(".party .pcard");
      if (c && !e.target.closest("input")) {
        const r = c.getBoundingClientRect();
        cardMenu(
          c.dataset.pid,
          Math.min(e.clientX, r.right - 20),
          r.bottom - 6,
        );
      }
    });
    onMenu(S.querySelector(".party"), (x, y, e) => {
      const c = e.target.closest && e.target.closest(".pcard");
      if (c) cardMenu(c.dataset.pid, x, y);
    });
    off = R.on(onState);
    offAcct = onAccount(() => paint());
    addEventListener("keydown", key);
    S._tick = setInterval(() => {
      if (R && R.state.phase === "countdown") onState(R.state);
    }, 250);
    queueMicrotask(paint);
    return S;
  },
});
