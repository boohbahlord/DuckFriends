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
   Hangout: no rounds, no winners, no stats; everyone hangs out in Duck Cabin (couches, the piano, the chalk floor, the
   guestbook, the stage, the pool, the trampoline, soccer, the campfire) until the room goes back to the lobby. */
import { esc } from "./ui.js";

export const MODES = [
  {
    id: "aod",
    name: "Agree or Disagree",
    tip: "Everyone writes a statement; for each one, walk to how much you agree, then talk it over.",
  },
  {
    id: "wyr",
    name: "Would You Rather",
    tip: 'Everyone writes a "would you rather" with two choices, in secret; for each one, walk to the side you\'d pick.',
  },
  {
    id: "ddr",
    name: "Does Duck Relate?",
    tip: "Everyone writes something relatable; for each one, walk to Duck Does Relate or Duck Doesn't Relate, then talk it over.",
  },
  {
    id: "bb",
    name: "Bicker Brackets",
    tip: "A tournament: pick a topic, write the contenders together, then walk onto the one you back, match by match, until one is the champion.",
  },
  {
    id: "sc",
    name: "Story Chain",
    tip: "Write a story together, one line each, each with someone else's secret word sneaked in; then walk onto your favorite line and your favorite word.",
  },
  {
    id: "quack",
    name: "Who is the Quack?",
    tip: "Everyone's Secret Card has the same word except the Quack's. Give clues, then walk onto the duck you think is faking it. 3 players or more.",
  },
  {
    id: "law",
    name: "Lawyering; Juryful of Ducklings",
    tip: "Everyone writes a topic in secret; for each one, two players argue it out and everyone else walks to whoever convinced them. 3 players or more.",
  },
  {
    id: "dunce",
    name: "Duncelation",
    tip: "Everyone writes a controversial take; defend the one you get while everyone else walks to Dunce or Not a Dunce. 3 players or more.",
  },
  {
    id: "hang",
    name: "Hangout",
    tip: "No rounds, no winners, no pressure: hang out in Duck Cabin. Piano, couches, chalk, a pool, soccer, until you all go back to the lobby.",
  },
];
export const modeOf = (id) => MODES.find((m) => m.id === id) || MODES[0];

/* each mode's little symbol: Agree or Disagree's colored bars; Would You Rather's two tiles with OR between; Does Duck
   Relate?'s green tile with a check and red tile with a cross; Story Chain's three lines of writing, each underlined
   in a different card color; Lawyering's sword over a shield; Duncelation's dunce hat with a question mark; Hangout's little
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
  return ""; // (Agree or Disagree's symbol is art.js's symbolSVG)
}
