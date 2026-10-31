/* ---------- Mad God Justin: what the screen shows ----------
   The arena: an empty see-through field over the map. Over it, Justin on the cloud with his eyes glowing blue and
   flickering like lightning (the cloud says "Defeat Justin!"), and his HP bar beside it. The meteor falls from the top
   right onto the middle of the board and knocks everyone down. A win: the LOSER podium (Duncelation's) rises under him.
   Also the stats: the awards (Most Damage, Killing Blow, Hit the Most, Most Jumps), each player's box, and every fight. */
import { esc, el } from "./ui.js";
import { duckSVG } from "./duck.js";
import { nameHTML } from "./name.js";
import { cloudHTML } from "./brackets.js";
import { fmtJumps } from "./format.js";
import { DN_PODIUM } from "./dunce.js";
import { JUSTIN_PLAYER } from "./boardjustin.js";
import { mgjStats } from "./mgjrules.js";

/* his look here: Justin, with the lightning eyes */
export const MAD_JUSTIN = {
  ...JUSTIN_PLAYER,
  duck: { ...JUSTIN_PLAYER.duck, eyes: "lightning" },
};
const nm = (p) => nameHTML(p.name, p.nameStyle);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

export const mgjHPHTML = (s) => {
  const m = s.mgj || { hp: 0, max: 1 },
    hp = Math.max(0, m.hp),
    k = Math.max(0, Math.min(1, hp / Math.max(1, m.max)));
  return `<span class="mgj-hp-name">Justin</span><span class="mgj-bar${k <= 0.25 ? " low" : ""}" role="meter" aria-valuemin="0" aria-valuemax="${m.max}" aria-valuenow="${hp}" aria-label="Justin's HP"><i style="width:${(k * 100).toFixed(1)}%"></i></span><b class="mgj-hp-n">${hp} / ${m.max} HP</b>`;
};
/* the board: the field, the podium (a win), the cloud and the HP bar */
export const mgjBoardHTML = (
  s,
) => `<div class="board mgj-board"><div class="cols mgj-cols"><div class="col mgj-field" data-c="0"></div></div>
  <div class="ducks">${s.phase === "mgjend" && s.mgj && s.mgj.won ? DN_PODIUM : ""}</div><div class="fxl"></div>
  <div class="topover mgj-top">${cloudHTML(MAD_JUSTIN, "Mad God Justin")}<div class="question mgj-hp">${mgjHPHTML(s)}</div></div></div>`;

/* ---------- the meteor ---------- */
/* a rock glowing at its edges, with its tail of fire behind it (up and to the right: it falls down to the left) */
export const METEOR = `<svg viewBox="0 0 160 160" aria-hidden="true"><defs>
<linearGradient id="mt-tail" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23f" stop-opacity="0"/><stop offset=".45" stop-color="#ff8c2b" stop-opacity=".75"/><stop offset="1" stop-color="#fff3b0"/></linearGradient>
<radialGradient id="mt-glow" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#ff8c2b" stop-opacity=".7"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
<radialGradient id="mt-rock" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#8a6a58"/><stop offset=".6" stop-color="#4e3a32"/><stop offset="1" stop-color="#2a1d1a"/></radialGradient></defs>
<path d="M156 4C120 22 92 42 70 66L94 90C116 66 138 38 156 4Z" fill="url(#mt-tail)"/>
<path d="M150 18C122 34 104 50 84 70L92 78C112 58 130 40 150 18Z" fill="#fff8d0" opacity=".7"/>
<circle cx="62" cy="98" r="44" fill="url(#mt-glow)"/>
<path d="M38 82C42 66 60 60 74 64C90 68 98 82 94 98C90 116 74 126 58 122C42 118 32 100 38 82Z" fill="url(#mt-rock)" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/>
<path d="M74 64C90 68 98 82 94 98" fill="none" stroke="#ffb347" stroke-width="4" stroke-linecap="round" opacity=".9"/>
<ellipse cx="56" cy="90" rx="7" ry="5.5" fill="#2a1d1a" opacity=".55"/><ellipse cx="74" cy="104" rx="5" ry="4" fill="#2a1d1a" opacity=".5"/><ellipse cx="72" cy="80" rx="3.4" ry="2.8" fill="#2a1d1a" opacity=".45"/>
<path d="M46 76C50 70 58 67 64 68" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/></svg>`;
/* the scorch it leaves for a moment */
export const SCORCH = `<svg viewBox="0 0 200 80" aria-hidden="true"><ellipse cx="100" cy="40" rx="96" ry="36" fill="#1c1210" opacity=".55"/><ellipse cx="100" cy="40" rx="62" ry="22" fill="#0e0807" opacity=".7"/>
${[
  [30, 22],
  [168, 30],
  [52, 64],
  [150, 62],
  [100, 8],
]
  .map(
    ([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="5" fill="#ff8c2b" opacity=".7"/>`,
  )
  .join("")}</svg>`;
/* drop it on the board: at (the spot where it lands, in the board's px), size (a duck's px), ms (until it lands) */
export function dropMeteor(fxl, board, at, size, ms) {
  const w = size * 2.6,
    fall = Math.max(150, ms),
    dy = -(at.top + w * 0.7),
    dx = Math.min(board.offsetWidth * 0.45, -dy * 0.9);
  const rock = el(
    `<div class="mgj-meteor" style="--w:${w.toFixed(0)}px;--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--t:${fall}ms;left:${at.left.toFixed(1)}px;top:${at.top.toFixed(1)}px">${METEOR}</div>`,
  );
  fxl.append(rock);
  setTimeout(() => {
    rock.remove();
    const boom = el(
        `<div class="mgj-boom" style="left:${at.left.toFixed(1)}px;top:${at.top.toFixed(1)}px;--w:${(size * 7).toFixed(0)}px"><i class="mgj-ring"></i><i class="mgj-scorch">${SCORCH}</i></div>`,
      ),
      flash = el('<div class="fx-flash mgj-flash"></div>');
    fxl.append(boom, flash);
    board.classList.add("quake");
    setTimeout(() => {
      flash.remove();
      board.classList.remove("quake");
    }, 700);
    setTimeout(() => boom.remove(), 2600);
  }, fall);
}

/* ---------- the stats ---------- */
const GONE = { name: "Gone", duck: { color: "#b7bccb" }, nameStyle: {} };
const player = (s, id) => (id && s.players[id]) || GONE;
function awardsHTML(s, all) {
  const { per } = mgjStats(s, all),
    ids = Object.keys(per).filter((id) => s.players[id]);
  const name = (id) => nm(player(s, id));
  const award = (title, who, line) =>
    who && who.length
      ? `<div class="award"><h3>${esc(title)}</h3><p>${who.map(name).join(who.length > 2 ? ", " : " and ")}${who.length > 1 ? ' <span class="dim">(tie)</span>' : ""}</p><p class="small dim">${line}</p></div>`
      : "";
  const top = (f) => {
    const xs = ids.map((id) => [id, f(per[id])]),
      v = Math.max(0, ...xs.map((x) => x[1]));
    return v ? { v, who: xs.filter((x) => x[1] === v).map((x) => x[0]) } : null;
  };
  const dmg = top((p) => p.dmg),
    hit = top((p) => p.hits),
    kill = top((p) => p.kills),
    jx = s.seat.map((id) => [id, (s.jumps || {})[id] || 0]),
    jv = Math.max(0, ...jx.map((x) => x[1]));
  return `<div class="awards">
    ${award("Most Damage", dmg && dmg.who, dmg ? `${plural(dmg.v, "stab")} on Justin.` : "")}
    ${award("Killing Blow", kill && kill.who, kill ? (all ? `${plural(kill.v, "killing blow")}.` : "The last stab.") : "")}
    ${award("Hit the Most", hit && hit.who, hit ? `Knocked down by Justin ${plural(hit.v, "time")}.` : "")}
    ${award("Most Jumps", jv ? jx.filter((x) => x[1] === jv).map((x) => x[0]) : [], `${plural(jv, "jump")}.`)}</div>`;
}
/* a player's box: their stabs, the times he got them, killing blows (this fight, or every fight) */
export function mgjBoxHTML(s, id, all = false) {
  const p = s.players[id];
  if (!p) return "";
  const w = mgjStats(s, all).per[id] || {
    dmg: 0,
    hits: 0,
    kills: 0,
    fights: 0,
    wins: 0,
  };
  return `<article class="statbox" data-pid="${esc(id)}"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nm(p)}<div class="small dim">${plural(w.fights, "fight")} · ${plural(w.wins, "win")}</div></div></header>
    <dl><dt>Damage</dt><dd>${w.dmg}</dd><dt>Knocked down</dt><dd>${w.hits}</dd><dt>Killing blows</dt><dd>${w.kills}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}
const fightsHTML = (s) =>
  `<div class="law-cases">${(s.mgjPast || [])
    .map(
      (
        f,
      ) => `<article class="law-case panel${f.won ? "" : " dn-was"}"><p class="law-case-topic">Fight ${f.n}: ${f.won ? "Justin defeated" : `Justin won with ${f.hp} of ${f.max} HP left`}</p>
  <p class="law-case-vs small">${f.won && f.kill ? `Killing blow: ${nm(player(s, f.kill))}` : "Time ran out"}</p></article>`,
    )
    .join("")}</div>`;
const block = (s, all) =>
  `${awardsHTML(s, all)}<div class="statboxes">${s.seat.map((id) => mgjBoxHTML(s, id, all)).join("")}</div>`;
export function mgjStatsHTML(s) {
  const f = (s.mgjPast || []).slice(-1)[0];
  const head = !f ? "The fight" : f.won ? "Justin is defeated!" : "Justin wins";
  return `<h2>${head}</h2>${block(s, false)}${(s.mgjPast || []).length > 1 ? `<h2 class="all-h">Every fight</h2>${block(s, true)}${fightsHTML(s)}` : ""}`;
}
export const mgjOverHTML = (s) => block(s, true) + fightsHTML(s);
