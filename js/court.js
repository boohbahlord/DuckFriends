/* ---------- Lawyering: what the screen shows ----------
   A case's board: the offense's side on the left (a big sword) in the offense attorney's card color and pattern, the
   defense's side on the right (a big shield) in the defense attorney's, both see-through like every board; between them
   a dark strip with the attorneys' circle, which slowly turns through the colors (game.js places it). Over the board,
   both attorneys on the cloud and the case beside it. After the verdict the losing side turns grey (both, on a hung
   jury). Also: picking the attorneys, and the stats (the awards, each player's box and the round's cases). */
import { esc } from "./ui.js";
import { duckSVG } from "./duck.js";
import { nameHTML, fontHTML } from "./name.js";
import { cardBackground, cardHTML } from "./card.js";
import { duelCloudHTML } from "./brackets.js";
import { lawStats } from "./rules.js";
import { fmtJumps } from "./format.js";

const GONE = {
  name: "Gone",
  duck: { color: "#b7bccb" },
  card: { color: "#8a8fa3" },
  nameStyle: {},
};
const player = (s, id) => (id && s.players[id]) || GONE;
const inFont = (p, html) =>
  fontHTML(p && p.nameStyle && p.nameStyle.font, html); // (a player's font, scaled to match)
const nm = (p) => nameHTML(p.name, p.nameStyle);
/* an attorney's side color: their card's color */
export const sideColor = (p) => (p && p.card && p.card.color) || "#8a8fa3";

export const SWORD = `<svg viewBox="0 0 40 100" aria-hidden="true"><path d="M20 3L26 14V68H14V14Z" fill="#eef3fa" stroke="#1c1c28" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M20 9V66" stroke="#b9c4d4" stroke-width="2"/><rect x="4" y="66" width="32" height="7" rx="3.5" fill="#ffd23f" stroke="#1c1c28" stroke-width="2.6"/>
<rect x="15.5" y="72" width="9" height="18" rx="3" fill="#8a4b2a" stroke="#1c1c28" stroke-width="2.4"/><circle cx="20" cy="93" r="5" fill="#ffd23f" stroke="#1c1c28" stroke-width="2.4"/></svg>`;
export const SHIELD = `<svg viewBox="0 0 80 96" aria-hidden="true"><path d="M40 4L74 14V44C74 68 58 83 40 92C22 83 6 68 6 44V14Z" fill="#eef3fa" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/>
<path d="M40 13L65 20.5V44C65 62 53.5 74 40 81.5C26.5 74 15 62 15 44V20.5Z" fill="#2fa4ff" opacity=".9"/><path d="M40 16V79M18 40H62" stroke="#eef3fa" stroke-width="5"/></svg>`;

/* the two sides and the strip between them */
export function lawColsHTML(s) {
  const L = s.law;
  if (!L) return '<div class="cols law-cols"></div>';
  const done = s.phase === "discuss" && L.w != null;
  const side = (c, id) => {
    const p = player(s, id),
      cls = done ? (L.w === c ? " won" : " lost") : "";
    return `<div class="col law-side law-${c ? "def" : "off"}${cls}" data-c="${c}" style="--c:${esc(sideColor(p))}">
      <div class="law-pat" style="${esc(cardBackground(p.card))}"></div><div class="law-mark">${c ? SHIELD : SWORD}</div>
      <span class="law-who"><b>${c ? "Defense" : "Offense"}</b> ${nm(p)}</span></div>`;
  };
  return `<div class="cols law-cols${done && L.w === -1 ? " hung" : ""}">${side(0, L.off)}<div class="law-mid"></div>${side(1, L.def)}</div>`;
}
/* over the board: both attorneys on the cloud, and the case beside it (the verdict once it's in) */
export function lawTopHTML(s, knocked = false) {
  const L = s.law,
    q = s.qs[s.qi];
  if (!L || !q) return "";
  const off = player(s, L.off),
    def = player(s, L.def),
    done = s.phase === "discuss" && L.w != null;
  const cloud = duelCloudHTML(
    s.players[L.off] || GONE,
    s.players[L.def] || GONE,
    done
      ? L.w === -1
        ? { both: true, knocked }
        : { winner: L.w, knocked }
      : {},
  );
  const won = done && L.w !== -1 ? (L.w ? def : off) : null,
    [o, d] = L.end || [0, 0];
  const verdict = !done
    ? ""
    : won
      ? `<span class="law-verdict">${nm(won)} wins${L.gave ? ": the other side gave up" : L.left ? ": the other side left" : ` ${Math.max(o, d)}–${Math.min(o, d)}`}</span>`
      : `<span class="law-verdict">Hung jury ${o}–${d}: nobody wins</span>`;
  return `<div class="topover law-top">${cloud}<div class="question law-what">
    <span class="small dim">The Court Case</span><span class="law-topic">${inFont(s.players[q.by], esc(q.text))}</span>
    <span class="small law-names">${nm(def)} defends it · ${nm(off)} is against it</span>${verdict}</div></div>`;
}
/* closing arguments: a banner over the board (game.js shows it while they run) */
export const LAW_BANNER =
  '<div class="law-banner" aria-live="polite"><b>Closing arguments!</b> <span>Last chance to win the jury over.</span></div>';

/* ---------- picking the attorneys: by the topic's writer, or by a vote of the room ---------- */
export function counselHTML(s, me, who) {
  const q = s.qs[s.qi],
    L = s.law,
    writer = player(s, q.by);
  const role = (k, title, what) => {
    const how = (L.how || {})[k];
    let body;
    if (!how) body = '<p class="dim">Picked at random when the case opens.</p>';
    else if (how === "writer" && me !== q.by)
      body = `<p class="dim">${nm(writer)} is picking${(L.picks[k] || {})[q.by] ? " ✓" : "…"}</p>`;
    else {
      const picks = L.picks[k] || {},
        mine = picks[me];
      const can = s.seat.filter(
        (id) =>
          s.players[id] &&
          !s.players[id].late &&
          (k === "def" ? id !== q.by : true),
      );
      body = `<div class="law-cands">${can
        .map((id) => {
          const votes =
            how === "vote"
              ? Object.entries(picks)
                  .filter(([v, w]) => w === id && s.players[v])
                  .map(([v]) =>
                    duckSVG(s.players[v].duck, {
                      size: 22,
                      shadow: false,
                      title: s.players[v].name,
                    }),
                  )
                  .join("")
              : "";
          return `<button type="button" class="law-cand" data-role="${k}" data-who="${esc(id)}" aria-pressed="${mine === id}">${cardHTML(s.players[id], { size: 44 })}${votes ? `<span class="tc-votes">${votes}</span>` : ""}</button>`;
        })
        .join(
          "",
        )}</div><p class="small dim">${how === "vote" ? "Everyone votes; you can change your mind until the picking ends. A tie is a coin flip." : "You wrote this topic, so you pick. You can change your mind until the picking ends."}</p>`;
    }
    return `<section class="law-pick panel"><h3>${title} <span class="small dim">${what}</span></h3>${body}</section>`;
  };
  return `<div class="submit-wrap law-counsel"><header class="bb-head panel"><span class="small dim">The Court Case</span>
      <b>${inFont(s.players[q.by], esc(q.text))}</b><span class="small dim">written by ${nm(writer)}</span></header>
    <div class="law-picks">${role("def", "Defense attorney", "argues for it (never its writer)")}${role("off", "Offense attorney", "argues against it")}</div>
    <div class="who">${who}</div></div>`;
}

/* ---------- the round's cases (the stats screen) ---------- */
export function lawCasesHTML(s, round = null) {
  const cases = s.history.filter(
    (h) => h.law && (round === null || h.round === round),
  );
  if (!cases.length) return '<p class="dim">No cases this round.</p>';
  return `<div class="law-cases">${cases
    .map((h) => {
      const c = h.law,
        off = player(s, c.off),
        def = player(s, c.def),
        [o, d] = c.end || [0, 0],
        w = c.w === -1 ? null : c.w ? def : off;
      return `<article class="law-case panel"><p class="law-case-topic">${inFont(s.players[h.by], esc(h.text))}</p>
      <p class="law-case-vs"><span class="law-chip off" style="--c:${esc(sideColor(off))}">${duckSVG(off.duck, { size: 26, shadow: false, title: off.name })}${nm(off)}</span>
        <b class="law-score">${c.left ? "–" : `${o} – ${d}`}</b><span class="law-chip def" style="--c:${esc(sideColor(def))}">${nm(def)}${duckSVG(def.duck, { size: 26, shadow: false, title: def.name })}</span></p>
      <p class="small">${w ? `${nm(w)} won${c.gave ? ` (${nm(player(s, c.gave))} gave up)` : c.left ? ` (${nm(player(s, c.left))} left)` : ""}` : "Hung jury: nobody won"}${c.start ? ` · closing arguments from ${c.start[0]}–${c.start[1]}` : ""}</p></article>`;
    })
    .join("")}</div>`;
}
/* ---------- the stats: the awards, each player's box, then the cases ---------- */
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const quote = (t) => `"${t.length > 60 ? t.slice(0, 58).trimEnd() + "…" : t}"`;
function awardsHTML(s, round) {
  const { per, cases } = lawStats(s, round),
    ids = Object.keys(per).filter((id) => s.players[id]);
  const name = (id) => (s.players[id] ? nm(s.players[id]) : "Gone");
  const award = (title, who, line) =>
    who && who.length
      ? `<div class="award"><h3>${esc(title)}</h3><p>${who.map(name).join(who.length > 2 ? ", " : " and ")}${who.length > 1 && title !== "Unconvinced" ? ' <span class="dim">(tie)</span>' : ""}</p><p class="small dim">${line}</p></div>`
      : "";
  /* everyone tied at the top of a number (none when the top is 0) */
  const top = (f, ok = () => true) => {
    const xs = ids.filter((id) => ok(per[id])).map((id) => [id, f(per[id])]),
      v = Math.max(0, ...xs.map((x) => x[1]));
    return v ? { v, who: xs.filter((x) => x[1] === v).map((x) => x[0]) } : null;
  };
  const best = top((p) => p.won),
    flip = top((p) => p.flips),
    jx = s.seat.map((id) => [id, (s.jumps || {})[id] || 0]),
    jv = Math.max(0, ...jx.map((x) => x[1]));
  const firm = ids.filter((id) => per[id].votes && !per[id].flips),
    own = ids.filter((id) => per[id].ownWin);
  /* Landslide: the biggest winning margin (a case given up doesn't count); Hard Topic: the closest vote */
  const won = cases.filter(
      (c) => c.w >= 0 && !c.gave && !c.left && Math.abs(c.o - c.d) > 0,
    ),
    big = Math.max(0, ...won.map((c) => Math.abs(c.o - c.d)));
  const slides = won.filter((c) => Math.abs(c.o - c.d) === big),
    slideWho = [...new Set(slides.map((c) => (c.w ? c.def : c.off)))].filter(
      (id) => s.players[id],
    );
  const voted = cases.filter((c) => c.o + c.d > 0 && !c.left),
    gap = (c) => Math.abs(c.o - c.d) / (c.o + c.d),
    close = Math.min(1, ...voted.map(gap));
  const hard = voted.filter((c) => gap(c) === close),
    hardWho = [...new Set(hard.map((c) => c.by))].filter((id) => s.players[id]);
  return `<div class="awards">
    ${award("Best Lawyer", best && best.who, best ? `Won ${plural(best.v, "case")}.` : "")}
    ${award("Landslide", slideWho, slides[0] ? `Won ${esc(quote(slides[0].text))} ${Math.max(slides[0].o, slides[0].d)}–${Math.min(slides[0].o, slides[0].d)}.` : "")}
    ${award("Flip-Flopper", flip && flip.who, flip ? `Switched sides ${plural(flip.v, "time")}.` : "")}
    ${award("Unconvinced", firm, "Never switched sides once.")}
    ${award("Hard Topic", hardWho, hard[0] ? `${esc(quote(hard[0].text))} split the jury ${hard[0].o}–${hard[0].d}.` : "")}
    ${award("Turned on Their Own Idea", own, "Argued against their own topic, and won.")}
    ${award("Most Jumps", jv ? jx.filter((x) => x[1] === jv).map((x) => x[0]) : [], `${plural(jv, "jump")}.`)}</div>`;
}
/* a player's box: their cases and their jury votes (this round, or the whole game) */
export function lawBoxHTML(s, id, round = null) {
  const p = s.players[id];
  if (!p) return "";
  const w = lawStats(s, round).per[id] || {
    argued: 0,
    won: 0,
    lost: 0,
    wonDef: 0,
    wonOff: 0,
    gave: 0,
    ownWin: 0,
    votes: 0,
    flips: 0,
  };
  return `<article class="statbox" data-pid="${esc(id)}"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nm(p)}<div class="small dim">${plural(w.argued, "case")} argued · ${plural(w.votes, "jury vote")}</div></div></header>
    <dl><dt>Cases won</dt><dd>${w.won}</dd><dt>Cases lost</dt><dd>${w.lost}</dd><dt>Won as defense</dt><dd>${w.wonDef}</dd><dt>Won as offense</dt><dd>${w.wonOff}</dd>
      <dt>Gave up</dt><dd>${w.gave}</dd><dt>Switched sides</dt><dd>${w.flips}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}
const block = (s, round) =>
  `${awardsHTML(s, round)}<div class="statboxes">${s.seat.map((id) => lawBoxHTML(s, id, round)).join("")}</div>${lawCasesHTML(s, round)}`;
export function lawStatsHTML(s) {
  return `<h2>Round ${s.round + 1}</h2>${block(s, s.round)}${s.review ? `<h2 class="all-h">All rounds</h2>${block(s, null)}` : ""}`;
}
export const lawOverHTML = (s) => block(s, null);
