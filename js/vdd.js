/* ---------- Valentine's Duck Date: what the screen shows ----------
   The board: a see-through field in a deep wine color over the map. In the middle the fancy dining table (a white
   tablecloth with a red runner, two plates of spaghetti, two glasses of red wine and the bottle), a chair on each side:
   The Date sits on the left one, this date's Suitor on the right. game.js places them and seats the two ducks. Over the
   board, The Date on the cloud and the topic beside it; while The Date writes it, their box is there instead.
   The pick: a tile for each Suitor still in (Who is the Quack?'s tiles, with room around them, where a duck stands on no
   tile). A Turned Down duck is black and white for the rest of the game (Duncelation's dn-bw), and so is its tile.
   Also the stats: Sweet Valentine and Most Jumps, each player's box, and every date with its topic. */
import { esc } from "./ui.js";
import { duckSVG } from "./duck.js";
import { nameHTML } from "./name.js";
import { cloudHTML } from "./brackets.js";
import { rainbowHTML } from "./art.js";
import { cardBackground } from "./card.js";
import { fmtJumps } from "./format.js";
import {
  isDate,
  turnedDown,
  vdTileAt,
  vdStats,
  TOPIC_MAX,
} from "./vddrules.js";
import { seenDuck, seenName } from "./looks.js";

const GONE = {
  name: "Gone",
  duck: { color: "#b7bccb" },
  card: { color: "#8a8fa3" },
  nameStyle: {},
};
const player = (s, id) => (id && s.players[id]) || GONE;
const nm = (p) => `<span class="wq-w">${nameHTML(p.name, seenName(p))}</span>`; // (a name never breaks across lines)
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const mmss = (ms) => {
  const t = Math.round(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/* ---------- the art: flat shapes with a dark outline and a small shadow, like every prop ---------- */
const O = 'stroke="#1c1c28" stroke-linejoin="round" stroke-linecap="round"';
/* a plate of spaghetti with its sauce and a basil leaf, centered on (x, y) */
const plate = (x, y, f = 1) =>
  `<ellipse cx="${x}" cy="${y + 3}" rx="27" ry="9.5" fill="#fff" ${O} stroke-width="2.4"/><ellipse cx="${x}" cy="${y + 3}" rx="18" ry="5.8" fill="none" stroke="#ded7cc" stroke-width="1.6"/>
<path d="M${x - 15} ${y + 2}C${x - 15} ${y - 9} ${x + 15} ${y - 9} ${x + 15} ${y + 2}C${x + 8} ${y + 6} ${x - 8} ${y + 6} ${x - 15} ${y + 2}Z" fill="#f5c451" ${O} stroke-width="2"/>
<path d="M${x - 10} ${y - 1}q4 -4 8 0t8 0M${x - 7} ${y - 5}q3 -2.6 6 0t6 0" fill="none" stroke="#d6962a" stroke-width="1.5" stroke-linecap="round"/>
<path d="M${x - 6} ${y - 4}C${x - 6} ${y - 10} ${x + 6} ${y - 10} ${x + 6} ${y - 4}C${x + 3} ${y - 2} ${x - 3} ${y - 2} ${x - 6} ${y - 4}Z" fill="#e3242b" ${O} stroke-width="1.6"/>
<path d="M${x + 2 * f} ${y - 8}c${3 * f} -3 ${6 * f} -3 ${8 * f} -1c${-2 * f} 2.6 ${-5 * f} 2.8 ${-8 * f} 1z" fill="#37d421" ${O} stroke-width="1.1"/>`;
/* a glass of red wine standing at (x, y) */
const glass = (x, y) =>
  `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="2.4" fill="#ffffff70" ${O} stroke-width="1.8"/><path d="M${x} ${y - 1}V${y - 15}" ${O} stroke-width="2.4"/>
<path d="M${x - 9} ${y - 36}C${x - 10} ${y - 22} ${x - 6} ${y - 15} ${x} ${y - 15}C${x + 6} ${y - 15} ${x + 10} ${y - 22} ${x + 9} ${y - 36}Z" fill="#ffffff38"/>
<path d="M${x - 9.3} ${y - 27}C${x - 8.4} ${y - 19} ${x - 5} ${y - 15.5} ${x} ${y - 15.5}C${x + 5} ${y - 15.5} ${x + 8.4} ${y - 19} ${x + 9.3} ${y - 27}Z" fill="#9c1238"/>
<path d="M${x - 9} ${y - 36}C${x - 10} ${y - 22} ${x - 6} ${y - 15} ${x} ${y - 15}C${x + 6} ${y - 15} ${x + 10} ${y - 22} ${x + 9} ${y - 36}" fill="none" ${O} stroke-width="2.2"/>
<path d="M${x - 5.6} ${y - 32}C${x - 6} ${y - 27} ${x - 5} ${y - 23} ${x - 3} ${y - 21}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
/* the table: 240 across; its feet (the cloth's hem) at y 138 */
export const TABLE_SVG = `<svg viewBox="0 0 240 150" aria-hidden="true">
<ellipse cx="120" cy="140" rx="104" ry="9" fill="#000" opacity=".3"/>
<path d="M14 58L8 134Q21 143 34 136Q47 144 60 136Q73 144 86 136Q99 144 112 136Q120 141 128 136Q141 144 154 136Q167 144 180 136Q193 144 206 136Q219 143 232 134L226 58Z" fill="#fbf6ef" ${O} stroke-width="3"/>
<path d="M120 80L226 58L232 134Q219 143 206 136Q193 144 180 136Q167 144 154 136Q141 144 128 136Q124 139 120 139Z" fill="#000" opacity=".06"/>
<path d="M44 74L40 134M78 80L76 136M162 80L164 136M196 74L200 134" stroke="#000" stroke-width="2" opacity=".06" fill="none"/>
<path d="M99 70H141V113L120 125L99 113Z" fill="#e3245a" ${O} stroke-width="2.6"/><path d="M120 70V124L141 113V70Z" fill="#000" opacity=".1"/>
<path d="M120 97.6C117 94 112.6 95.6 112.6 99.2C112.6 102.6 116.6 105 120 108C123.4 105 127.4 102.6 127.4 99.2C127.4 95.6 123 94 120 97.6Z" fill="#ffd23f" ${O} stroke-width="1.6"/>
<ellipse cx="120" cy="57" rx="106" ry="24" fill="#fffdf8" ${O} stroke-width="3"/>
<path d="M99 79.6V70H141V79.6" fill="none" ${O} stroke-width="2.6"/><path d="M99 70Q120 76 141 70L141 79.3Q120 82 99 79.3Z" fill="#e3245a"/>
${plate(56, 54, 1)}${plate(184, 54, -1)}
<rect x="111" y="22" width="18" height="34" rx="6" fill="#1f5c3a" ${O} stroke-width="2.4"/><path d="M116 22V8H124V22" fill="#1f5c3a" ${O} stroke-width="2.4"/>
<rect x="115" y="3" width="10" height="7" rx="2" fill="#e3245a" ${O} stroke-width="2"/><rect x="112.4" y="33" width="15.2" height="12" rx="2" fill="#fbf6ef" ${O} stroke-width="1.4"/>
<path d="M120 37.2C118.6 35.6 116.4 36.4 116.4 38.2C116.4 39.8 118.4 41 120 42.4C121.6 41 123.6 39.8 123.6 38.2C123.6 36.4 121.4 35.6 120 37.2Z" fill="#e3245a"/>
<path d="M114.6 26V50" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/>
${glass(95, 60)}${glass(145, 60)}</svg>`;
/* a chair seen from the side, its back on the left (the right seat's is turned around): 80 across, its feet at y 128 */
export const CHAIR_SVG = `<svg viewBox="0 0 80 132" aria-hidden="true">
<ellipse cx="40" cy="128" rx="34" ry="4" fill="#000" opacity=".28"/>
<rect x="11" y="92" width="7" height="35" rx="2.5" fill="#6b2d18" ${O} stroke-width="2.2"/><rect x="61" y="92" width="7" height="35" rx="2.5" fill="#6b2d18" ${O} stroke-width="2.2"/>
<path d="M7 94V16C7 8 23 8 23 16V94Z" fill="#8a3d22" ${O} stroke-width="2.6"/><path d="M15 12C19 12 23 13 23 16V94H15Z" fill="#000" opacity=".14"/>
<path d="M15 36.6C12.6 33.6 9 35 9 38C9 40.8 12.2 42.8 15 45.4C17.8 42.8 21 40.8 21 38C21 35 17.4 33.6 15 36.6Z" fill="#ff3d6e" ${O} stroke-width="1.5"/>
<rect x="4" y="84" width="72" height="12" rx="5" fill="#e3245a" ${O} stroke-width="2.6"/><path d="M8 87H72" stroke="#fff" stroke-width="2" opacity=".3" stroke-linecap="round"/></svg>`;
/* the table and its two chairs, in the ducks' layer (game.js places them and keeps them in depth with the ducks) */
export const TABLE_HTML = `<div class="vd-chair" data-k="0" aria-hidden="true">${CHAIR_SVG}</div><div class="vd-chair r" data-k="1" aria-hidden="true">${CHAIR_SVG}</div><div class="vd-table" aria-hidden="true">${TABLE_SVG}</div>`;
/* where the table and the two at it are drawn, in duck sizes from the table's feet: its width, and how far out the seats
   are */
export const TABLE_W = 2.5,
  SEAT_OUT = 1.3,
  SEAT_LIFT = 0.36;

/* ---------- the board ---------- */
const withTable = (s) => ["vdprompt", "vddate", "vdval"].includes(s.phase);
const tileInner = (
  p,
) => `<div class="wq-bg" style="${esc(cardBackground(p.card))}"></div>
  <div class="wq-tduck">${duckSVG(seenDuck(p), { size: 96, shadow: true, title: p.name })}</div><span class="wq-tname">${nameHTML(p.name, seenName(p))}</span>`;
function tilesHTML(s) {
  const V = s.vd;
  if (!V || !V.ids || withTable(s)) return "";
  const out =
    s.phase === "vddown" && V.picks.length
      ? V.picks[V.picks.length - 1].id
      : null;
  return `<div class="vd-tiles">${V.ids
    .map(
      (id, k) =>
        `<div class="wq-tile vd-tile${id === out ? " out picked" : ""}" data-c="${k}" data-pid="${esc(id)}">${tileInner(player(s, id))}</div>`,
    )
    .join("")}</div>`;
}
/* over the board: The Date on the cloud, and the topic (or what's going on) beside it */
export function vdTopHTML(s, me) {
  const V = s.vd;
  if (!V) return "";
  const d = player(s, V.date),
    cur = V.cur && player(s, V.cur),
    of = V.order.length
      ? `Date ${Math.min(V.k + 1, V.order.length)} of ${V.order.length}`
      : "";
  const cloud = cloudHTML(s.players[V.date] ? d : null, "The Date");
  let q;
  if (s.phase === "vdprompt")
    q =
      isDate(s, me) && !s.done[me]
        ? `<form class="vd-write" autocomplete="off"><label class="small dim" for="vd-in">The topic of your date with ${cur ? nm(cur) : "the Suitor"}</label>
    <div class="vd-row"><input id="vd-in" class="vd-in" maxlength="${TOPIC_MAX}" placeholder="Type a topic…" spellcheck="true"/><button type="submit" class="btn green">Send <kbd>Enter</kbd></button></div></form>`
        : `<b>The Date is writing the topic…</b><span class="small dim">${of}${cur ? ` · ${nm(cur)} takes the seat` : ""}</span>`;
  else if (s.phase === "vddate")
    q = `<span class="small dim">The topic</span><span class="vd-topic">${esc(V.topic)}</span><span class="small vd-names">${cur ? nm(cur) : "A Suitor"} is on a date · ${of}</span>`;
  else if (s.phase === "vdpick")
    q = `<b>Who is Turned Down?</b><span class="small dim">${isDate(s, me) ? "Walk onto a Suitor's tile and press Turn down. On no tile: nobody this turn." : "The Date walks onto a Suitor's tile. On no tile: nobody this turn."}</span>`;
  else if (s.phase === "vddown") {
    const last = V.picks[V.picks.length - 1],
      p = last && last.id && player(s, last.id);
    q = p
      ? `<b>${nm(p)} is Turned Down.</b><span class="small dim">${plural(V.ids.length - 1, "Suitor")} still in.</span>`
      : `<b>Nobody is Turned Down this turn.</b><span class="small dim">${plural(V.ids.length, "Suitor")} still in.</span>`;
  } else if (s.phase === "vdval") {
    const p = player(s, V.val);
    q = `<span class="vd-val">${rainbowHTML("Valentine", { seed: 14 })}</span><span class="small">${nm(p)} is The Date's Valentine!</span>`;
  } else return "";
  return `<div class="topover vd-top">${cloud}<div class="question vd-q">${q}</div></div>`;
}
export const vdBoardHTML = (
  s,
  me,
) => `<div class="board vd-board"><div class="cols vd-cols"><div class="col vd-field" data-c="0"></div></div>${tilesHTML(s)}
  <div class="ducks">${withTable(s) ? TABLE_HTML : ""}</div><div class="fxl"></div>${vdTopHTML(s, me)}</div>`;
/* the tile under my duck (for the glow and the button) */
export const myTile = (s, pos) => vdTileAt(s, pos);

/* ---------- the stats: the awards, each player's box, then every date ---------- */
const faceOf = (s, id, size) => {
  const p = player(s, id),
    bw = turnedDown(s, id);
  return `<span class="${bw ? "dn-bw" : ""}">${duckSVG(seenDuck(p), { size, shadow: false, title: p.name })}</span>`;
};
const roleOf = (s, id) => {
  const V = s.vd || {},
    o = (V.out || []).find(
      (x) => x.id === id || (x.acct && x.acct === player(s, id).acct),
    );
  return isDate(s, id)
    ? "The Date"
    : V.val === id
      ? "Valentine"
      : o
        ? `Turned Down in turn ${o.turn}`
        : "Suitor";
};
function awardsHTML(s) {
  const V = s.vd || {},
    val = V.val && s.players[V.val];
  const jx = s.seat.map((id) => [id, (s.jumps || {})[id] || 0]),
    jv = Math.max(0, ...jx.map((x) => x[1])),
    jw = jv ? jx.filter((x) => x[1] === jv).map((x) => x[0]) : [];
  const award = (title, who, line) =>
    who.length
      ? `<div class="award"><h3>${esc(title)}</h3><p>${who.map((id) => nm(player(s, id))).join(who.length > 2 ? ", " : " and ")}${who.length > 1 ? ' <span class="dim">(tie)</span>' : ""}</p><p class="small dim">${line}</p></div>`
      : "";
  return `<div class="awards">
    ${val ? award("Sweet Valentine", [V.val], `Won The Date's favor${s.players[V.date] ? ` (${esc(s.players[V.date].name)})` : ""} after ${plural(V.turn || 1, "turn")}.`) : ""}
    ${award("Most Jumps", jw, `${plural(jv, "jump")}.`)}</div>`;
}
/* a player's box: what they were, their dates and their jumps */
export function vdBoxHTML(s, id) {
  const p = s.players[id];
  if (!p) return "";
  const w = vdStats(s).per[id] || { dates: 0, ms: 0, early: 0 };
  return `<article class="statbox" data-pid="${esc(id)}"><header>${faceOf(s, id, 46)}<div>${nameHTML(p.name, seenName(p))}<div class="small dim">${roleOf(s, id)}</div></div></header>
    <dl><dt>Dates</dt><dd>${w.dates}</dd><dt>Time on dates</dt><dd>${mmss(w.ms)}</dd><dt>Ended early (Next duck)</dt><dd>${w.early}</dd>
      <dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}
/* every date: its topic, the Suitor and how long it went */
function datesHTML(s) {
  const { dates } = vdStats(s);
  if (!dates.length) return '<p class="dim">No dates yet.</p>';
  return `<div class="law-cases">${dates
    .map(
      (
        d,
      ) => `<article class="law-case panel"><p class="law-case-topic">${esc(d.topic)}</p>
    <p class="law-case-vs">${faceOf(s, d.id, 26)}${nm(player(s, d.id))} <b class="law-score">${mmss(d.ms)}</b><span class="small">Turn ${d.turn}${d.early ? " · Next duck" : ""}</span></p></article>`,
    )
    .join("")}</div>`;
}
export function vdStatsHTML(s) {
  const V = s.vd || {},
    val = V.val && s.players[V.val];
  return `<h2>${val ? `${nm(val)} is The Date's Valentine` : "No Valentine this time"}</h2>${awardsHTML(s)}<div class="statboxes">${s.seat.map((id) => vdBoxHTML(s, id)).join("")}</div>${datesHTML(s)}`;
}
