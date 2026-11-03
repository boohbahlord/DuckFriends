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
   Hangout: no rounds, no winners, no stats; everyone hangs out in Duck Cabin (couches, the piano, the chalk floor, the
   guestbook, the stage, the pool, the trampoline, soccer, the campfire) until the room goes back to the lobby.
   Left 4 Dead Ducks: Duck Cabin with the power cut; zombie ducks come in round after round, until nobody is standing. */
import { esc } from "./ui.js";

export const MODES = [
  {
    id: "aod",
    cat: "social",
    name: "Agree or Disagree",
    tip: "Everyone writes a statement; for each one, walk to how much you agree, then talk it over.",
  },
  {
    id: "wyr",
    cat: "social",
    name: "Would You Rather",
    tip: 'Everyone writes a "would you rather" with two choices, in secret; for each one, walk to the side you\'d pick.',
  },
  {
    id: "ddr",
    cat: "social",
    name: "Does Duck Relate?",
    tip: "Everyone writes something relatable; for each one, walk to Duck Does Relate or Duck Doesn't Relate, then talk it over.",
  },
  {
    id: "bb",
    cat: "comp",
    name: "Bicker Brackets",
    tip: "A tournament: pick a topic, write the contenders together, then walk onto the one you back, match by match, until one is the champion.",
  },
  {
    id: "sc",
    cat: "social",
    name: "Story Chain",
    tip: "Write a story together, one line each, each with someone else's secret word sneaked in; then walk onto your favorite line and your favorite word.",
  },
  {
    id: "quack",
    cat: "comp",
    name: "Who is the Quack?",
    tip: "Everyone's Secret Card has the same word except the Quack's. Give clues, then walk onto the duck you think is faking it. 3 players or more.",
  },
  {
    id: "law",
    cat: "comp",
    name: "Lawyering; Juryful of Ducklings",
    tip: "Everyone writes a topic in secret; for each one, two players argue it out and everyone else walks to whoever convinced them. 3 players or more.",
  },
  {
    id: "dunce",
    cat: "comp",
    name: "Duncelation",
    tip: "Everyone writes a controversial take; defend the one you get while everyone else walks to Dunce or Not a Dunce. 3 players or more.",
  },
  {
    id: "mgj",
    cat: "special",
    name: "Mad God Justin",
    tip: "A boss fight: everyone gets a knife, and together you have to stab Justin down to 0 HP before the timer runs out. He shoots back.",
  },
  {
    id: "vdd",
    cat: "comp",
    name: "Valentine's Duck Date",
    tip: "A random duck is The Date. Each Suitor gets a date at the dining table, then The Date turns one down, until one is left: the Valentine. 3 players or more.",
  },
  {
    id: "hang",
    cat: "cabin",
    name: "Hangout",
    tip: "No rounds, no winners, no pressure: hang out in Duck Cabin. Piano, couches, chalk, a pool, soccer, until you all go back to the lobby.",
  },
  {
    id: "l4dd",
    cat: "cabin",
    name: "Left 4 Dead Ducks",
    tip: "The power's out in Duck Cabin and zombie ducks are coming, round after round. Board up the doors and holes, revive each other, and see how long you last.",
  },
];
export const modeOf = (id) => MODES.find((m) => m.id === id) || MODES[0];
export const CABIN_MODES = ["hang", "l4dd"]; // (Duck Cabin's own games: picking one picks the map)
/* the four kinds of game on the Game Settings screen's Game mode page (Cabin: Duck Cabin's own games) */
export const CATS = [
  ["social", "Social"],
  ["comp", "Social Competitive"],
  ["cabin", "Cabin"],
  ["special", "Special"],
];

/* each mode's little symbol: Agree or Disagree's colored bars; Would You Rather's two tiles with OR between; Does Duck
   Relate?'s green tile with a check and red tile with a cross; Story Chain's three lines of writing, each underlined
   in a different card color; Lawyering's sword over a shield; Duncelation's dunce hat with a question mark; Mad God Justin's
   yellow duck head with its eye glowing blue and devil horns, and a bolt of lightning; Valentine's Duck Date's two
   glasses of red wine clinking under a pink heart; Hangout's little
   A-frame cabin with a lit window, under the moon */
export function modeSymbol(id, size = 32) {
  const m = modeOf(id);
  if (m.id === "wyr")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="2" width="11" height="20" rx="2" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1.2"/><rect x="18" y="2" width="11" height="20" rx="2" fill="#ff8c2b" stroke="#1c1c28" stroke-width="1.2"/>
<text x="15" y="15.5" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="6.5" fill="#fff" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">OR</text></svg>`;
  if (m.id === "ddr")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<rect x="1" y="2" width="12.5" height="20" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/><rect x="16.5" y="2" width="12.5" height="20" rx="2" fill="#ef3b3b" stroke="#1c1c28" stroke-width="1.2"/>
<path d="M4 12.3l2.6 2.8 4.4-5.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 9l5.5 6M25.5 9L20 15" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  if (m.id === "bb")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M11 6H15V12H19M11 18H15V12" fill="none" stroke="#1c1c28" stroke-width="1.4" opacity=".55"/>
<rect x="1" y="2" width="10" height="8" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/><rect x="1" y="14" width="10" height="8" rx="2" fill="#7a1220" stroke="#1c1c28" stroke-width="1.2"/>
<path d="M3.2 15.8l5.6 4.4M8.8 15.8l-5.6 4.4" stroke="#ff3030" stroke-width="1.6" stroke-linecap="round"/>
<rect x="19" y="8" width="10" height="8" rx="2" fill="#37d421" stroke="#1c1c28" stroke-width="1.2"/></svg>`;
  if (m.id === "law")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M17 3L26 5.8V11.6C26 16.6 22 20 17 22C12 20 8 16.6 8 11.6V5.8Z" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1.2"/><path d="M17 5.4V19.8M10.4 11H23.6" stroke="#fff" stroke-width="1.4" opacity=".85"/>
<g transform="rotate(-42 11 12)"><rect x="9.7" y="-.6" width="2.6" height="14.6" rx="1.1" fill="#e8edf5" stroke="#1c1c28" stroke-width="1.1"/><rect x="6.4" y="13.6" width="9.2" height="2.3" rx="1.1" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.1"/><rect x="9.9" y="15.7" width="2.2" height="4.4" rx="1" fill="#8a4b2a" stroke="#1c1c28" stroke-width="1"/></g></svg>`;
  if (m.id === "dunce")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M5 21.5L13 2L21 21.5Z" fill="#fbfbf6" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/><path d="M13 2L21 21.5L17 21.5Z" fill="#000" opacity=".1"/>
<text x="12.8" y="18.6" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="7" fill="#1c1c28">D</text><path d="M5 21.5C10 23 16 23 21 21.5" stroke="#1c1c28" stroke-width="1.2" fill="none"/>
<text x="25.6" y="11" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="10" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">?</text></svg>`;
  if (m.id === "mgj")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M6.4 1.4L2 11.6H5.6L3.4 22.6L10.6 9.4H6.8L9.6 1.4Z" fill="#fff6b0" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/>
<ellipse cx="19.4" cy="14.6" rx="8.4" ry="8" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.2"/><path d="M26.4 15.4l3.2.8-3.2 1.6z" fill="#ff8c2b" stroke="#1c1c28" stroke-width=".8" stroke-linejoin="round"/>
<circle cx="22.2" cy="12" r="3.4" fill="#38b6ff" opacity=".45"/><circle cx="22.2" cy="12" r="1.9" fill="#bff1ff" stroke="#0b4a8a" stroke-width=".7"/>
<path d="M17 8.4l7.4 1.6" stroke="#1c1c28" stroke-width="1.3" stroke-linecap="round"/>
<path d="M15.8 7.4C14.8 5.4 13.6 3.6 12.2 2.2C12.4 4.6 12.9 6.6 13.7 8.6Z" fill="#a3121b" stroke="#3a0408" stroke-width=".9" stroke-linejoin="round"/><path d="M21.4 7C22.6 5 24.4 3.2 26.4 2C25.8 4.4 25 6.4 23.8 8.1Z" fill="#e3242b" stroke="#3a0408" stroke-width=".9" stroke-linejoin="round"/></svg>`;
  if (m.id === "vdd")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<path d="M15 7.2C13.2 4.8 9.8 5.6 9.8 8.4C9.8 10.8 12.6 12.6 15 14.8C17.4 12.6 20.2 10.8 20.2 8.4C20.2 5.6 16.8 4.8 15 7.2Z" fill="#ff3d6e" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/>
${[
  [7.5, -14],
  [22.5, 14],
]
  .map(
    ([x, r]) =>
      `<g transform="rotate(${r} ${x} 21)"><path d="M${x - 4} 10C${x - 4.4} 15 ${x - 2.6} 17.4 ${x} 17.4C${x + 2.6} 17.4 ${x + 4.4} 15 ${x + 4} 10Z" fill="#ffffff55" stroke="#1c1c28" stroke-width="1.1" stroke-linejoin="round"/><path d="M${x - 4.1} 13C${x - 3.6} 16 ${x - 2.2} 17.2 ${x} 17.2C${x + 2.2} 17.2 ${x + 3.6} 16 ${x + 4.1} 13Z" fill="#9c1238"/><path d="M${x} 17.4V21.6M${x - 2.8} 22H${x + 2.8}" stroke="#1c1c28" stroke-width="1.3" stroke-linecap="round"/></g>`,
  )
  .join("")}</svg>`;
  if (m.id === "sc")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
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
  .join("")}</svg>`;
  if (m.id === "quack")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
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
<text x="25.6" y="9" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="8.5" fill="#ff3d6e" stroke="#1c1c28" stroke-width="1.6" paint-order="stroke fill">?</text></svg>`;
  if (m.id === "hang")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<circle cx="25" cy="5" r="3" fill="#ffe9a8" stroke="#1c1c28" stroke-width="1"/><rect x="2" y="20" width="26" height="3" rx="1.5" fill="#37a046" stroke="#1c1c28" stroke-width="1"/>
<path d="M4 21L15 3L26 21Z" fill="#a85a26" stroke="#1c1c28" stroke-width="1.2" stroke-linejoin="round"/><path d="M8.5 21L15 9.5L21.5 21Z" fill="#6e3a17" stroke="#1c1c28" stroke-width="1"/>
<rect x="12.6" y="14" width="4.8" height="7" rx="1" fill="#ffd23f" stroke="#1c1c28" stroke-width="1"/></svg>`;
  if (m.id === "l4dd")
    return `<svg viewBox="0 0 30 24" width="${size}" height="${size * 0.8}" role="img" aria-label="${esc(m.name)}">
<ellipse cx="14" cy="14.4" rx="10.6" ry="8.6" fill="#3f7a34" stroke="#1c1c28" stroke-width="1.2"/><path d="M23.6 14.6l5 1.2-5 2.4z" fill="#b06a1e" stroke="#1c1c28" stroke-width=".9" stroke-linejoin="round"/>
<path d="M16 9.6l3.6 3.6M19.6 9.6L16 13.2" stroke="#1c1c28" stroke-width="1.5" stroke-linecap="round"/><path d="M8.4 18.4c2.4 1.4 5.6 1.4 8 .2" stroke="#1c1c28" stroke-width="1.1" fill="none" stroke-linecap="round"/>
<path d="M3 3.4l3.4 4.2M6.6 2.4l.4 4.6M1.6 7.4l4 1.4" stroke="#c0182b" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  return ""; // (Agree or Disagree's symbol is art.js's symbolSVG)
}
