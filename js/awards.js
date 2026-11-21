/* ---------- the stats' awards: one card, one "who has the most" ----------
   Every game's stats window ends in the same cards (a title, the duck or ducks who won it, "(tie)" when more than one,
   a small line under it) and finds the winner the same way: the most of one number, none when nobody has any. The games
   hand it their numbers and their lines; the cards' shape lives only here. */
import { esc } from "./ui.js";

/* who has the most of f(per[id]) among ids: { v, who: [ids tied] }, or null when it's 0 for everyone */
export const topOf = (per, ids, f) => {
  const xs = ids.map((id) => [id, f(per[id])]),
    v = Math.max(0, ...xs.map((x) => x[1]));
  return v ? { v, who: xs.filter((x) => x[1] === v).map((x) => x[0]) } : null;
};
/* the winners' names: "A", "A and B", "A, B, C" */
export const joinNames = (names) =>
  names.join(names.length > 2 ? ", " : " and ");
/* the card: names is the winners' names as HTML, tie whether to say "(tie)", body what goes under it (HTML) */
export const awardCard = (title, names, tie, body) =>
  `<div class="award"><h3>${esc(title)}</h3><p>${names}${tie ? ' <span class="dim">(tie)</span>' : ""}</p>${body}</div>`;
/* a small line under a card */
export const smallLine = (line) => `<p class="small dim">${line}</p>`;
