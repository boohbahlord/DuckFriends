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
import { FRIDGE } from "./art.js";
import { DN_PODIUM } from "./dunce.js";
import { JUSTIN_PLAYER } from "./boardjustin.js";
import { mgjStats, GOOD_ID, GOOD_NAME, SKY_ID } from "./mgjrules.js";
import { heldHTML, SHOTGUN } from "./specials.js";
import { seenDuck, seenName } from "./looks.js";
import { CHAIR } from "./mgjart.js";

/* his look here: Justin, with the lightning eyes and devil horns; beaten, he cries (the tears eyes) */
export const MAD_JUSTIN = {
  ...JUSTIN_PLAYER,
  duck: { ...JUSTIN_PLAYER.duck, eyes: "lightning", hat: { id: "horns" } },
};
export const SAD_JUSTIN = {
  ...MAD_JUSTIN,
  duck: { ...MAD_JUSTIN.duck, eyes: "tears" },
};
/* his helper: Justin with a halo and his own eyes */
export const GOOD_JUSTIN = {
  name: GOOD_NAME,
  duck: { ...JUSTIN_PLAYER.duck, hat: { id: "halo" } },
};
const nm = (p) => nameHTML(p.name, seenName(p));

/* ---------- the pickups: a glowing token with what's in it ---------- */
const BOLT = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M23 2L8 23H18L14 38L32 15H21L27 2Z" fill="#fff6b0" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/><path d="M23 5L12 21" stroke="#fff" stroke-width="1.6" opacity=".7" stroke-linecap="round"/></svg>`;
const FLAME = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 38C11 38 6 31 7.6 23.6C9 17 14 14.6 14.6 7.6C19.6 10.6 21 15 20.4 19C23 17.6 24.4 14.6 24.2 11C30.6 15.6 34 21.6 32.4 28.4C31 34.4 26 38 20 38Z" fill="#ff7a1a" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/><path d="M20 36C15.6 36 13 32.6 14 28.6C14.8 25.4 17.6 24 18 20.6C21.6 23 25.6 26.4 25.2 30.6C24.8 33.8 22.6 36 20 36Z" fill="#ffd23f"/></svg>`;
const HALO = `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="#fff3b0" stroke-width="8" opacity=".4"/><ellipse cx="20" cy="20" rx="14" ry="5" fill="none" stroke="#ffd84a" stroke-width="3.6"/><ellipse cx="20" cy="20" rx="14" ry="5" fill="none" stroke="#fffbe0" stroke-width="1.2"/></svg>`;
export const pickArt = (k) =>
  k === "lightning"
    ? BOLT
    : k === "fire"
      ? FLAME
      : k === "meteor"
        ? METEOR
        : k === "good"
          ? HALO
          : k === "shotgun"
            ? SHOTGUN
            : heldHTML(k);
export const pickHTML = (P) =>
  `<div class="mgj-pick k-${esc(P.k)}" data-n="${P.n}"><i class="mgj-pick-glow"></i><span class="mgj-pick-art">${pickArt(P.k)}</span></div>`;
/* a name for a hit that wasn't a player's: the sky (a pickup's lightning, fire or meteor) or Good Justin God */
const whoName = (s, id) =>
  id === GOOD_ID ? GOOD_NAME : id === SKY_ID ? "the sky" : null;
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
/* his throws: an Xbox One controller (black, from above: two sticks, the cross, the four colored buttons and the glowing
   one in the middle), and the office chair (mgjart.js) */
export const CONTROLLER = `<svg viewBox="0 0 64 46" aria-hidden="true">
<path d="M14 6.4C22 3.4 42 3.4 50 6.4C57.4 8.6 61.4 16.6 62.4 26.4C63.2 34.6 61 42 55 43C50 43.8 47 38.4 44.2 33.6C42.4 30.6 38.4 29.6 32 29.6C25.6 29.6 21.6 30.6 19.8 33.6C17 38.4 14 43.8 9 43C3 42 0.8 34.6 1.6 26.4C2.6 16.6 6.6 8.6 14 6.4Z" fill="#2a2b33" stroke="#1c1c28" stroke-width="2" stroke-linejoin="round"/>
<path d="M12.6 8.6C21 5.6 43 5.6 51.4 8.6" fill="none" stroke="#585b68" stroke-width="2.2" stroke-linecap="round"/>
<path d="M5.4 22C6.4 15 9 11 12.6 9.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".18"/>
<circle cx="18" cy="16" r="5.6" fill="#16171c" stroke="#1c1c28" stroke-width="1"/><circle cx="18" cy="16" r="3.6" fill="#3a3c46"/><circle cx="17.2" cy="15.2" r="1.3" fill="#fff" opacity=".22"/>
<path d="M23.4 20.4H26.6V23.4H29.6V26.6H26.6V29.6H23.4V26.6H20.4V23.4H23.4Z" fill="#16171c" stroke="#1c1c28" stroke-width=".8" stroke-linejoin="round"/>
<circle cx="39.4" cy="25" r="5" fill="#16171c" stroke="#1c1c28" stroke-width="1"/><circle cx="39.4" cy="25" r="3.2" fill="#3a3c46"/><circle cx="38.7" cy="24.3" r="1.1" fill="#fff" opacity=".22"/>
<circle cx="47.4" cy="10.4" r="2.5" fill="#ffd23f" stroke="#1c1c28" stroke-width=".8"/><circle cx="52" cy="15" r="2.5" fill="#ff5a5f" stroke="#1c1c28" stroke-width=".8"/>
<circle cx="47.4" cy="19.6" r="2.5" fill="#3ddc84" stroke="#1c1c28" stroke-width=".8"/><circle cx="42.8" cy="15" r="2.5" fill="#38b6ff" stroke="#1c1c28" stroke-width=".8"/>
<circle cx="32" cy="11" r="4.6" fill="#bfe8ff" opacity=".3"/><circle cx="32" cy="11" r="3.2" fill="#f2f6ff" stroke="#1c1c28" stroke-width=".8"/><circle cx="31.2" cy="10.2" r="1" fill="#fff"/>
<ellipse cx="28" cy="17.4" rx="1.4" ry="1" fill="#16171c"/><ellipse cx="36" cy="17.4" rx="1.4" ry="1" fill="#16171c"/></svg>`;
export { CHAIR }; // (the office chair lives in mgjart.js now, so the Chair special can use it too)
/* the game's name on his monitor, over the picture, in the title's many colors (one color a letter) */
const SIEGE = `<text x="62" y="36.5" text-anchor="middle" font-family="'Lilita One', 'Fredoka', system-ui, sans-serif" font-size="19" stroke="#1c1c28" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke">${[
  ..."Siege",
]
  .map((c, i) => `<tspan fill="${FRIDGE[[0, 2, 3, 4, 5][i]]}">${c}</tspan>`)
  .join("")}</text>`;
/* his Xbox attack: a desk that comes in on the board, with a monitor (its screen lit) and an Xbox One (black, glossy on
   the left and vented on the right, a full box with its right side, its power light white); turned off, the screen and the light go dark (css: .off) */
export const DESK = `<svg viewBox="0 0 160 124" aria-hidden="true"><defs>
<linearGradient id="xb-scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe0ff"/><stop offset=".55" stop-color="#3f8cff"/><stop offset="1" stop-color="#3ddc84"/></linearGradient></defs>
<rect x="16" y="74" width="9" height="46" rx="2" fill="#6a4429" stroke="#1c1c28" stroke-width="2"/><rect x="135" y="74" width="9" height="46" rx="2" fill="#6a4429" stroke="#1c1c28" stroke-width="2"/>
<rect x="96" y="76" width="42" height="22" rx="2" fill="#7c5133" stroke="#1c1c28" stroke-width="2"/><path d="M110 87H124" stroke="#1c1c28" stroke-width="2.4" stroke-linecap="round"/>
<rect x="6" y="66" width="148" height="11" rx="3" fill="#a8744a" stroke="#1c1c28" stroke-width="2"/><path d="M11 69.4H149" stroke="#fff" stroke-width="1.6" opacity=".22" stroke-linecap="round"/>
<path d="M57 52H66L68 66H55Z" fill="#26272e" stroke="#1c1c28" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="61.6" cy="65.4" rx="15" ry="2.8" fill="#26272e" stroke="#1c1c28" stroke-width="1.6"/>
<rect x="20" y="6" width="84" height="50" rx="5" fill="#1d1e24" stroke="#1c1c28" stroke-width="2"/>
<g class="xb-scr"><rect x="25" y="11" width="74" height="40" rx="2" fill="url(#xb-scr)"/><path d="M25 42Q40 33 54 40T86 37Q93 36 99 39V51H25Z" fill="#2fb36a"/><circle cx="85" cy="20" r="5" fill="#fff6b0"/><path d="M29 15H50" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/>${SIEGE}</g>
<rect class="xb-dark" x="25" y="11" width="74" height="40" rx="2" fill="#0b0c11"/><path class="xb-dark" d="M29 15L42 15" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".14"/>
<path d="M106 50L111 43H151L147 50Z" fill="#33353e" stroke="#1c1c28" stroke-width="1.6" stroke-linejoin="round"/><path d="M137 44.4L134.4 49M141 44.4L138.4 49M145 44.4L142.4 49M149 44.4L146.4 49" stroke="#16171c" stroke-width="1.2"/><path d="M112 45.6H128" stroke="#fff" stroke-width="1.2" opacity=".3" stroke-linecap="round"/>
<rect x="106" y="50" width="41" height="16" rx="1.6" fill="#1f2026" stroke="#1c1c28" stroke-width="1.6"/><path d="M108 52.6H130" stroke="#fff" stroke-width="1" opacity=".18" stroke-linecap="round"/><path d="M132 51V65" stroke="#16171c" stroke-width="1"/>
<path d="M147 50L151 43V59L147 66Z" fill="#141519" stroke="#1c1c28" stroke-width="1.6" stroke-linejoin="round"/>
<g class="xb-led"><circle cx="140" cy="58" r="5" fill="#dff4ff" fill-opacity=".3"/><circle cx="140" cy="58" r="2.4" fill="#fff"/></g><circle class="xb-dark" cx="140" cy="58" r="2.4" fill="#3a3c46"/></svg>`;
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
  return `<article class="statbox" data-pid="${esc(id)}"><header>${duckSVG(seenDuck(p), { size: 46, shadow: false, title: p.name })}<div>${nm(p)}<div class="small dim">${plural(w.fights, "fight")} · ${plural(w.wins, "win")}</div></div></header>
    <dl><dt>Damage</dt><dd>${w.dmg}</dd><dt>Knocked down</dt><dd>${w.hits}</dd><dt>Killing blows</dt><dd>${w.kills}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}
const fightsHTML = (s) =>
  `<div class="law-cases">${(s.mgjPast || [])
    .map(
      (
        f,
      ) => `<article class="law-case panel${f.won ? "" : " dn-was"}"><p class="law-case-topic">Fight ${f.n}: ${f.won ? "Justin defeated" : `Justin won with ${f.hp} of ${f.max} HP left`}</p>
  <p class="law-case-vs small">${f.won && f.kill ? `Killing blow: ${whoName(s, f.kill) ? esc(whoName(s, f.kill)) : nm(player(s, f.kill))}` : "Time ran out"}</p></article>`,
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
