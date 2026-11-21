/* ---------- the game modes ----------
   Agree or Disagree: everyone writes a statement; the room stands on a seven-column scale for each one.
   Would You Rather: everyone writes a "would you rather" with two choices in secret; the room walks to a side.
   Does Duck Relate?: everyone writes something relatable; the room walks to Duck Does Relate or Duck Doesn't Relate.
   Bicker Brackets: a tournament a round; the room picks a topic, writes the seeds and votes match by match.
   Story Chain: a paragraph a round; one line each, each with someone else's secret word hidden in it.
   Who is the Quack?: everyone's Secret Card has the same word except one duck's; clues out loud, then walk onto a duck.
   Lawyering: everyone writes a topic in secret; for each one, two attorneys argue it out and the room walks to a side.
   Duncelation: everyone writes a take; one by one, a duck defends the take it got and the room walks to Dunce or Not a
   Dunce, until someone is voted a dunce.
   Mad God Justin: a boss fight; every duck has only a knife, and together they stab Justin to 0 HP before the time runs out.
   Valentine's Duck Date: a random duck is The Date; the Suitors take turns on a date with them at the dining table, and
   after each turn The Date turns one down, until the last one left is their Valentine.
   Trivia: everyone writes a question; for each one, walk onto the right answer (or type one and its writer grades it).
   Hangout: no rounds, no winners, no stats; everyone hangs out in Duck Cabin (couches, the piano, the chalk floor, the
   guestbook, the stage, the pool, the trampoline, soccer, the campfire) until the room goes back to the lobby.
   Quacky Zombies: Duck Cabin with the power cut; zombie ducks come in round after round, until nobody is standing.
   Sandbox: no rounds, no end; on any map, mess around (sandboxrules.js, sandbox.js). */
import { esc } from "./ui.js";

/* Survival shows in the lists once it's all built (true then) */
export const SURV_READY = true;
export const MODES = [
  {
    id: "aod",
    cat: "social",
    name: "Agree or Disagree",
    stats: {
      title: null,
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Answers", "answers"],
        ["Chose most", "", "aodMost"],
        ["Average", "", "aodAvg"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Everyone writes a statement; for each one, walk to how much you agree, then talk it over.",
  },
  {
    id: "wyr",
    cat: "social",
    name: "Would You Rather",
    stats: {
      title: "Would You Rather",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Answers", "answers"],
        ["With the bigger side", "", "sideShare"],
        ["Jumps", "jumps"],
      ],
    },
    tip: 'Everyone writes a "would you rather" with two choices, in secret; for each one, walk to the side you\'d pick.',
  },
  {
    id: "ddr",
    cat: "social",
    name: "Does Duck Relate?",
    stats: {
      title: "Does Duck Relate?",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Answers", "answers"],
        ["Chose most", "", "ddrMost"],
        ["Related", "", "ddrShare"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Everyone writes something relatable; for each one, walk to Duck Does Relate or Duck Doesn't Relate, then talk it over.",
  },
  {
    id: "bb",
    cat: "comp",
    name: "Bicker Brackets",
    stats: {
      title: "Bicker Brackets",
      rows: [
        ["Games", "games"],
        ["Tournaments", "rounds"],
        ["Tournaments won", "titles"],
        ["Contender wins", "wins"],
        ["Contender losses", "losses"],
        ["Votes in matches", "answers"],
        ["Jumps", "jumps"],
      ],
    },
    noWriteTimer: true, // (starts with no write timer: rules.js writeTimerFor)
    tip: "A tournament: pick a topic, write the contenders together, then walk onto the one you back, match by match, until one is the champion.",
  },
  {
    id: "sc",
    cat: "social",
    name: "Story Chain",
    stats: {
      title: "Story Chain",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Lines written", "answers"],
        ["Votes for their lines", "wins"],
        ["Votes for their secret words", "titles"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Write a story together, one line each, each with someone else's secret word sneaked in; then walk onto your favorite line and your favorite word.",
  },
  {
    id: "quack",
    cat: "comp",
    name: "Who is the Quack?",
    stats: {
      title: "Who is the Quack?",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Rounds won", "wins"],
        ["Won as the Quack", "titles"],
        ["Votes", "answers"],
        ["For the real Quack", "majority"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Everyone's Secret Card has the same word except the Quack's. Give clues, then walk onto the duck you think is faking it. 3 players or more.",
  },
  {
    id: "law",
    cat: "comp",
    name: "Lawyering; Juryful of Ducklings",
    stats: {
      title: "Lawyering",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Cases argued", "argued"],
        ["Cases won", "wins"],
        ["Cases lost", "losses"],
        ["Gave up", "gave"],
        ["Jury votes", "answers"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Everyone writes a topic in secret; for each one, two players argue it out and everyone else walks to whoever convinced them. 3 players or more.",
  },
  {
    id: "dunce",
    cat: "comp",
    name: "Duncelation",
    stats: {
      title: "Duncelation",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Takes defended", "argued"],
        ["Not a dunce", "wins"],
        ["Voted a dunce", "losses"],
        ["Votes", "answers"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Everyone writes a controversial take; defend the one you get while everyone else walks to Dunce or Not a Dunce. 3 players or more.",
  },
  {
    id: "mgj",
    cat: "special",
    name: "Mad God Justin",
    stats: {
      title: "Mad God Justin",
      rows: [
        ["Games", "games"],
        ["Fights", "rounds"],
        ["Won", "wins"],
        ["Lost", "losses"],
        ["Damage", "answers"],
        ["Knocked down", "majority"],
        ["Killing blows", "titles"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "A boss fight: everyone gets a knife, and together you have to stab Justin down to 0 HP. He shoots back.",
  },
  {
    id: "vdd",
    cat: "comp",
    name: "Valentine's Duck Date",
    stats: {
      title: "Valentine's Duck Date",
      rows: [
        ["Games", "games"],
        ["Turns", "rounds"],
        ["Dates", "argued"],
        ["Valentine", "wins"],
        ["Turned Down", "losses"],
        ["The Date", "titles"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "A random duck is The Date. Each Suitor gets a date at the dining table, then The Date turns one down, until one is left: the Valentine. 3 players or more.",
  },
  {
    id: "trivia",
    cat: "comp",
    name: "Trivia",
    stats: {
      title: "Trivia",
      rows: [
        ["Games", "games"],
        ["Rounds", "rounds"],
        ["Answers", "answers"],
        ["Right", "wins"],
        ["Wrong", "losses"],
        ["Questions written", "titles"],
        ["Jumps", "jumps"],
      ],
    },
    tip: "Everyone writes a question, multiple choice or written. Walk onto the answer you think is right and press Enter, or type yours and let its writer grade it. 2 players or more.",
  },
  {
    id: "hang",
    cat: "social",
    name: "Hangout",
    timed: true, // (a time limit when Random or the vote picked it: Game Settings hangTime)
    noRounds: true, // (no rounds, no winners, no stats of its own: the command line and the stats window ask this, never the name)
    cabinHome: true, // (Duck Cabin is its own map, where its ghosts and Duck Cabin's Justin live)
    tip: "No rounds, no winners, no pressure: hang out in Duck Cabin. Piano, couches, chalk, a pool, soccer, until you all go back to the lobby. It can only be played on the Duck Cabin map.",
  },
  {
    id: "l4dd",
    cat: "special",
    name: "Dead Ducks Arcade",
    stats: {
      title: "Dead Ducks Arcade",
      rows: [
        ["Games", "games"],
        ["Rounds cleared", "rounds"],
        ["Best round", "titles", "best"],
        ["Zombies killed", "kills"],
        ["Jumps", "jumps"],
      ],
    },
    asksMap: true, // (its map vote opens before each game: zmapDue)
    inRandom: false, // (never from Random: Sandbox never ends; Survival and Quacky Zombies are vote-only, the owner's, Nov 19 19:53Z)
    tip: "The power's out in Duck Cabin and zombie ducks are coming, round after round. Board up the doors and holes, revive each other, and see how long you last. It can only be played on the Duck Cabin map.",
  },
  /* Survival (the owner's, Nov 19 19:27Z): Dead Ducks Arcade's zombies without rounds, swelling and calming on Downpour.
     It stays out of every list (SURV_READY) until all of it is built: no unfinished mode goes live */
  ...(SURV_READY
    ? [
        {
          id: "surv",
          cat: "special",
          name: "Survival",
          stats: {
            title: "Survival",
            rows: [
              ["Games", "games"],
              ["Best time", "titles", "clock"],
              ["Zombies killed", "kills"],
              ["Jumps", "jumps"],
            ],
          },
          inRandom: false,
          tip: "No rounds: the zombies keep coming on Downpour, calm one moment and a horde the next. Buy from the merchants, stay together and see how long you last.",
        },
      ]
    : []),
  {
    id: "sandbox",
    cat: "special",
    name: "Sandbox",
    inRandom: false,
    tip: "No rounds and no end: mess around on any map. Hold C for the cheat sheet. Leave Sandbox at the top left when you're done.",
  },
];
/* what a mode's all-time stats show, for the Stats window and the shell's totalstats alike (one table, js/statrows.js
   reads it): a title and rows of [label, the key kept in the profile, how to show it] (no how = a plain number) */
export const statsOf = (m) => modeOf(m === "l4r16" ? "l4dd" : m).stats;
export const modeOf = (id) => MODES.find((m) => m.id === id) || MODES[0];
/* the room's game's name: a made game mode's own (Sandbox, gmodes.js), else its mode's */
export const modeName = (s) =>
  s.options.mode === "sandbox" && s.options.gm && s.options.gmName
    ? String(s.options.gmName)
    : modeOf(s.options.mode).name;
/* Single Player (the owner's, Nov 18): the room on the device with no internet plays only these, and everything that
   lists the games (the votes, Random, Game Settings) lists only these there */
export const SOLO_MODES = ["hang", "l4dd", "surv", "mgj", "sandbox"];
export const modesFor = (s) =>
  s && s.solo ? MODES.filter((m) => SOLO_MODES.includes(m.id)) : MODES;
export const CABIN_MODES = ["hang", "l4dd"]; // (Duck Cabin's own games: picking one picks the map)
/* the three kinds of game on the Game Settings screen's Game mode page. Duck Cabin's own games sit with the others
   (Hangout with the social games, Quacky Zombies by Mad God Justin with the special ones); the Map page's Duck Cabin
   row lists them on their own */
export const CATS = [
  ["social", "Social"],
  ["comp", "Social Competitive"],
  ["special", "Special"],
];

/* each mode's little symbol: Agree or Disagree's colored bars; Would You Rather's two tiles with OR between; Does Duck
   Relate?'s green tile with a check and red tile with a cross; Story Chain's three lines of writing, each underlined
   in a different card color; Lawyering's sword over a shield; Duncelation's dunce hat with a question mark; Mad God Justin's
   yellow duck head with its eye glowing blue and devil horns, and a bolt of lightning; Valentine's Duck Date's two
   glasses of red wine clinking under a pink heart; Trivia's three answer rows, the middle one green with a check;
   Hangout's little
   A-frame cabin with a lit window, under the moon */
const SYMBOLS = {
  wyr: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="2" width="11" height="20" rx="2" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1.2"/><rect x="18" y="2" width="11" height="20" rx="2" fill="#ff8c2b" stroke="#1c1c28" stroke-width="1.2"/>
<text x="15" y="15.5" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="6.5" fill="#fff" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">OR</text></svg>`,
  ddr: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="2" width="12.5" height="20" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/><rect x="16.5" y="2" width="12.5" height="20" rx="2" fill="#ef3b3b" stroke="#1c1c28" stroke-width="1.2"/>
<path d="M4 12.3l2.6 2.8 4.4-5.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 9l5.5 6M25.5 9L20 15" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  bb: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M11 6H15V12H19M11 18H15V12" fill="none" stroke="#1c1c28" stroke-width="1.4" opacity=".55"/>
<rect x="1" y="2" width="10" height="8" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/><rect x="1" y="14" width="10" height="8" rx="2" fill="#7a1220" stroke="#1c1c28" stroke-width="1.2"/>
<path d="M3.2 15.8l5.6 4.4M8.8 15.8l-5.6 4.4" stroke="#ff3030" stroke-width="1.6" stroke-linecap="round"/>
<rect x="19" y="8" width="10" height="8" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/></svg>`,
  law: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M17 3L26 5.8V11.6C26 16.6 22 20 17 22C12 20 8 16.6 8 11.6V5.8Z" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1.2"/><path d="M17 5.4V19.8M10.4 11H23.6" stroke="#fff" stroke-width="1.4" opacity=".85"/>
<g transform="rotate(-42 11 12)"><rect x="9.7" y="-.6" width="2.6" height="14.6" rx="1.1" fill="#e8edf5" stroke="#1c1c28" stroke-width="1.1"/><rect x="6.4" y="13.6" width="9.2" height="2.3" rx="1.1" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.1"/><rect x="9.9" y="15.7" width="2.2" height="4.4" rx="1" fill="#8a4b2a" stroke="#1c1c28" stroke-width="1"/></g></svg>`,
  dunce: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M5 21.5L13 2L21 21.5Z" fill="#fbfbf6" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/><path d="M13 2L21 21.5L17 21.5Z" fill="#000" opacity=".1"/>
<text x="12.8" y="18.6" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="7" fill="#1c1c28">D</text><path d="M5 21.5C10 23 16 23 21 21.5" stroke="#1c1c28" stroke-width="1.2" fill="none"/>
<text x="25.6" y="11" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="10" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">?</text></svg>`,
  mgj: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M6.4 1.4L2 11.6H5.6L3.4 22.6L10.6 9.4H6.8L9.6 1.4Z" fill="#fff6b0" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/>
<ellipse cx="19.4" cy="14.6" rx="8.4" ry="8" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.2"/><path d="M26.4 15.4l3.2.8-3.2 1.6z" fill="#ff8c2b" stroke="#1c1c28" stroke-width=".8" stroke-linejoin="round"/>
<circle cx="22.2" cy="12" r="3.4" fill="#38b6ff" opacity=".45"/><circle cx="22.2" cy="12" r="1.9" fill="#bff1ff" stroke="#0b4a8a" stroke-width=".7"/>
<path d="M17 8.4l7.4 1.6" stroke="#1c1c28" stroke-width="1.3" stroke-linecap="round"/>
<path d="M15.8 7.4C14.8 5.4 13.6 3.6 12.2 2.2C12.4 4.6 12.9 6.6 13.7 8.6Z" fill="#a3121b" stroke="#3a0408" stroke-width=".9" stroke-linejoin="round"/><path d="M21.4 7C22.6 5 24.4 3.2 26.4 2C25.8 4.4 25 6.4 23.8 8.1Z" fill="#e3242b" stroke="#3a0408" stroke-width=".9" stroke-linejoin="round"/></svg>`,
  vdd: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M15 7.2C13.2 4.8 9.8 5.6 9.8 8.4C9.8 10.8 12.6 12.6 15 14.8C17.4 12.6 20.2 10.8 20.2 8.4C20.2 5.6 16.8 4.8 15 7.2Z" fill="#ff3d6e" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/>
${[
  [7.5, -14],
  [22.5, 14],
]
  .map(
    ([x, r]) =>
      `<g transform="rotate(${r} ${x} 21)"><path d="M${x - 4} 10C${x - 4.4} 15 ${x - 2.6} 17.4 ${x} 17.4C${x + 2.6} 17.4 ${x + 4.4} 15 ${x + 4} 10Z" fill="#ffffff55" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/><path d="M${x - 4.1} 13C${x - 3.6} 16 ${x - 2.2} 17.2 ${x} 17.2C${x + 2.2} 17.2 ${x + 3.6} 16 ${x + 4.1} 13Z" fill="#9c1238"/><path d="M${x} 17.4V21.6M${x - 2.8} 22H${x + 2.8}" stroke="#1c1c28" stroke-width="1.3" stroke-linecap="round"/></g>`,
  )
  .join("")}</svg>`,
  trivia: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="1" width="28" height="22" rx="3" fill="#ffffff" stroke="#1c1c28" stroke-width="1.2"/>
${[
  ["#2fa4ff", 4.2, 0],
  ["#37d421", 10.2, 1],
  ["#ff8c2b", 16.2, 0],
]
  .map(
    ([c, y, ok]) =>
      `${ok ? `<rect x="2.6" y="${y - 1.2}" width="24.8" height="5.8" rx="1.6" fill="#37d421" opacity=".28"/>` : ""}<circle cx="6" cy="${y + 1.7}" r="2.2" fill="${c}" stroke="#1c1c28" stroke-width=".9"/><rect x="10" y="${y + 0.9}" width="${ok ? 10 : 13}" height="1.8" rx=".9" fill="#1c1c28" opacity=".55"/>${ok ? `<path d="M22 ${y + 1.8}l1.6 1.7 2.8-3.4" fill="none" stroke="#1d8a12" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`,
  )
  .join("")}</svg>`,
  sc: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="1" width="28" height="22" rx="3" fill="#ffffff" stroke="#1c1c28" stroke-width="1.2"/>
${[
  ["#2fa4ff", 22, 4],
  ["#ff8c2b", 17, 10.5],
  ["#37d421", 20, 17],
]
  .map(
    ([c, w, y]) =>
      `<rect x="4" y="${y}" width="${w}" height="2.6" rx="1.3" fill="#1c1c28" opacity=".55"/><rect x="4" y="${y + 3.4}" width="${w}" height="1.5" rx=".75" fill="${c}"/>`,
  )
  .join("")}</svg>`,
  quack: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
${[
  [5, "#ffd23f"],
  [15, "#ffd23f"],
  [25, "#3b3f4a"],
]
  .map(
    ([x, c]) =>
      `<g transform="translate(${x} 16)"><ellipse cx="0" cy="2.6" rx="4.3" ry="3" fill="${c}" stroke="#1c1c28" stroke-width="1"/><circle cx="1" cy="-1.6" r="2.4" fill="${c}" stroke="#1c1c28" stroke-width="1"/><path d="M3 -1.8l2.3 .5-2.2 .9z" fill="#ff8c2b" stroke="#1c1c28" stroke-width=".6"/><circle cx="1.6" cy="-2.2" r=".45" fill="#1c1c28"/></g>`,
  )
  .join("")}
<text x="25.6" y="9" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="8.5" fill="#ff3d6e" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">?</text></svg>`,
  hang: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<circle cx="25" cy="5" r="3" fill="#ffe9a8" stroke="#1c1c28" stroke-width="1"/><rect x="2" y="20" width="26" height="3" rx="1.5" fill="#37a046" stroke="#1c1c28" stroke-width="1"/>
<path d="M4 21L15 3L26 21Z" fill="#a85a26" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/><path d="M8.5 21L15 9.5L21.5 21Z" fill="#6e3a17" stroke="#1c1c28" stroke-width="1"/>
<rect x="12.6" y="14" width="4.8" height="7" rx="1" fill="#ffd23f" stroke="#1c1c28" stroke-width="1"/></svg>`,
  l4dd: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<ellipse cx="14" cy="14.4" rx="10.6" ry="8.6" fill="#3f7a34" stroke="#1c1c28" stroke-width="1.2"/><path d="M23.6 14.6l5 1.2-5 2.4z" fill="#b06a1e" stroke="#1c1c28" stroke-width=".9" stroke-linejoin="round"/>
<path d="M16 9.6l3.6 3.6M19.6 9.6L16 13.2" stroke="#1c1c28" stroke-width="1.5" stroke-linecap="round"/><path d="M8.4 18.4c2.4 1.4 5.6 1.4 8 .2" stroke="#1c1c28" stroke-width="1.1" fill="none" stroke-linecap="round"/>
<path d="M3 3.4l3.4 4.2M6.6 2.4l.4 4.6M1.6 7.4l4 1.4" stroke="#c0182b" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  surv: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M3 4H26.4C27.3 4 28 4.7 28 5.6V10.4H14.6L13.4 11.2H9.4V4Z M3 4V10.4H9.4" fill="#8a93a3" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M9.4 10.4H13.4L12.2 21.2C12.1 22.1 11.4 22.7 10.5 22.7H9.4C8.5 22.7 7.8 22 7.9 21.1Z" fill="#a85a26" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M14.6 10.4C14.6 14 17.4 14 17.4 10.4" fill="none" stroke="#1c1c28" stroke-width="1.2" stroke-linecap="round"/>
<rect x="5" y="6" width="3" height="2" rx=".6" fill="#ffd23f" stroke="#1c1c28" stroke-width=".8"/>
<path d="M28.6 6.2L30 5.4" stroke="#ef3b3b" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  sandbox: (m, size) =>
    `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M2 12H28V21.4C28 22.3 27.3 23 26.4 23H3.6C2.7 23 2 22.3 2 21.4Z" fill="#e8c27a" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/><path d="M2 12C6 9.6 9.4 10.8 13 12C17 13.2 22 9.8 28 12" fill="#f4d998" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/>
<rect x="5" y="3" width="6.4" height="6.4" rx="1.2" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1"/><circle cx="16.4" cy="6.4" r="3.4" fill="#ef3b3b" stroke="#1c1c28" stroke-width="1"/><path d="M23.6 2.4L27.4 9.4H19.8Z" fill="#37d421" stroke="#1c1c28" stroke-width="1" stroke-linejoin="round"/>
<circle cx="8" cy="17.4" r="1" fill="#c89a4a"/><circle cx="15" cy="19.4" r="1" fill="#c89a4a"/><circle cx="22.4" cy="16.8" r="1" fill="#c89a4a"/></svg>`,
};
export const modeSymbol = (id, size = 32) => {
  const m = modeOf(id),
    draw = SYMBOLS[m.id];
  return draw ? draw(m, size) : ""; // (Agree or Disagree's symbol is art.js's symbolSVG)
};
