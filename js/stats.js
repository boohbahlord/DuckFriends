/* ---------- stats: a player's stat box and the View stats window ----------
   On the −3 (strongly disagree) … +3 (strongly agree) scale: what they chose most, the median, the average, and the
   jumps this game. */
import {
  statsFor,
  COLS,
  signed,
  nameOfValue,
  wyrStats,
  ddrStats,
  DDR_SIDES,
} from "./rules.js";
import { duckSVG } from "./duck.js";
import { nameHTML } from "./name.js";
import { openWindow, esc } from "./ui.js";
import { profile, STAT_MODES } from "./store.js";
import { modeOf, statsOf } from "./modes.js";
import { statRow } from "./statrows.js";
import { fmtJumps } from "./format.js";
import { bbBoxHTML } from "./brackets.js";
import { lawBoxHTML } from "./court.js";
import { boxHTML as scBoxHTML } from "./story.js";
import { quackBoxHTML } from "./quack.js";
import { dnBoxHTML } from "./dunce.js";
import { vdBoxHTML } from "./vdd.js";
import { tvBoxHTML } from "./trivia.js";
import { seenDuck, seenName } from "./looks.js";

export function statBoxHTML(s, id, round = null) {
  const p = s.players[id];
  if (!p) return "";
  const st = statsFor(s, id, round);
  const val = (v) =>
    v === null
      ? "—"
      : `${signed(v)} <span class="dim">${esc(nameOfValue(v))}</span>`;
  return `<article class="statbox" data-pid="${esc(id)}">
    <header>${duckSVG(seenDuck(p), { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, seenName(p))}<div class="small dim">${st.n} answer${st.n === 1 ? "" : "s"}</div></div></header>
    <dl>
      <dt>Chose most</dt><dd>${st.most.length ? st.most.map((c) => `<span class="chip c${c + 1}">${esc(COLS[c])}</span>`).join(" ") : "—"}</dd>
      <dt>Median</dt><dd>${val(st.median)}</dd>
      <dt>Average</dt><dd>${val(st.avg)}</dd>
      <dt>Jumps this game</dt><dd>${fmtJumps(st.jumps)}</dd>
    </dl></article>`;
}

/* Does Duck Relate?: Agree or Disagree's box on its two sides: the side they chose most, how often they related, the
   jumps this game */
const ddrChip = (c) =>
  `<span class="chip ddr-chip ${c ? "no" : "yes"}">${esc(DDR_SIDES[c])}</span>`;
export function ddrBoxHTML(s, id, round = null) {
  const p = s.players[id];
  if (!p) return "";
  const st = ddrStats(s, id, round);
  return `<article class="statbox" data-pid="${esc(id)}">
    <header>${duckSVG(seenDuck(p), { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, seenName(p))}<div class="small dim">${st.n} answer${st.n === 1 ? "" : "s"}</div></div></header>
    <dl>
      <dt>Chose most</dt><dd>${st.most.length ? st.most.map(ddrChip).join(" ") : "—"}</dd>
      <dt>Related</dt><dd>${st.n ? `${st.yes} of ${st.n} <span class="dim">(${Math.round((st.yes / st.n) * 100)}%)</span>` : "—"}</dd>
      <dt>Jumps this game</dt><dd>${fmtJumps(st.jumps)}</dd>
    </dl></article>`;
}

/* Would You Rather, this game: their answers and the sides they took */
function wyrBoxHTML(s, id) {
  const p = s.players[id],
    w = wyrStats(s).per[id] || {
      answers: 0,
      written: 0,
      split: 0,
      maj: 0,
      min: 0,
    };
  return `<article class="statbox"><header>${duckSVG(seenDuck(p), { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, seenName(p))}<div class="small dim">${w.answers} answer${w.answers === 1 ? "" : "s"}</div></div></header>
    <dl><dt>With the bigger side</dt><dd>${w.maj}</dd><dt>With the smaller side</dt><dd>${w.min}</dd>
      <dt>Their questions split the room</dt><dd>${w.written ? `${Math.round((w.split / w.written) * 100)}% evenly` : "—"}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}

/* all time, in one game mode: games, rounds, answers, what they chose most, their average, their jumps */
function totalsHTML(p, t, mode = "aod") {
  if (!t) return '<p class="dim">No all-time stats from this player yet.</p>';
  const tab = statsOf(mode),
    name = tab.title
      ? ` · ${mode === "l4r16" ? "Round 16 Start" : tab.title}`
      : "";
  return `<article class="statbox"><header>${duckSVG(seenDuck(p), { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, seenName(p))}<div class="small dim">all time${name}</div></div></header>
    <dl>${tab.rows
      .map((r) => statRow(r, t))
      .map((r) => `<dt>${esc(r.label)}</dt><dd>${r.html}</dd>`)
      .join("")}</dl></article>`;
}
let lastTab = "game",
  lastMode = STAT_MODES[0][0];
export function openStats(s, id, me) {
  const p = s.players[id];
  if (!p) return;
  const all = id === me ? profile.stats : p.stats;
  openWindow(
    `<h2>Stats</h2><div class="row stat-tabs" role="tablist"><button type="button" class="tile" data-st="game">This game</button><button type="button" class="tile" data-st="all">All time</button>
      <select class="stat-mode" aria-label="Game mode">${STAT_MODES.map(
        ([m, n]) => `<option value="${m}">${esc(n)}</option>`,
      ).join(
        "",
      )}</select></div><div class="stats-one"></div><p class="small dim stat-note"></p>`,
    {
      cls: "win-small",
      onOpen(w) {
        const body = w.querySelector(".stats-one"),
          note = w.querySelector(".stat-note"),
          mode = w.querySelector(".stat-mode");
        if (modeOf(s.options.mode).noRounds) {
          lastTab = "all";
          w.querySelector('[data-st="game"]').hidden = true;
        } // (Hangout keeps no stats of its own: all time only)
        const show = () => {
          w.querySelectorAll("[data-st]").forEach((b) =>
            b.setAttribute("aria-pressed", b.dataset.st === lastTab),
          );
          mode.hidden = lastTab !== "all";
          mode.value = lastMode;
          const rounds =
            s.options.mode === "quack"
              ? (s.wqPast || []).length
              : new Set(s.history.map((h) => h.round)).size;
          body.innerHTML =
            lastTab === "game"
              ? (
                  {
                    wyr: wyrBoxHTML,
                    ddr: ddrBoxHTML,
                    bb: bbBoxHTML,
                    sc: scBoxHTML,
                    quack: quackBoxHTML,
                    law: lawBoxHTML,
                    dunce: dnBoxHTML,
                    vdd: vdBoxHTML,
                    trivia: tvBoxHTML,
                  }[s.options.mode] || statBoxHTML
                )(s, id)
              : totalsHTML(p, all && all[lastMode], lastMode);
          note.textContent =
            lastTab === "game"
              ? `This game: ${rounds} round${rounds === 1 ? "" : "s"} so far.`
              : "Across every game played (test rooms only add jumps).";
        };
        w.querySelector(".stat-tabs").onclick = (e) => {
          const b = e.target.closest("[data-st]");
          if (b) {
            lastTab = b.dataset.st;
            show();
          }
        };
        mode.onchange = () => {
          lastMode = mode.value;
          show();
        };
        show();
      },
    },
  );
}
