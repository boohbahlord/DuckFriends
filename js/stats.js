/* ---------- stats: a player's stat box and the View stats window ----------
   On the −3 (strongly disagree) … +3 (strongly agree) scale: what they chose most, the median, the average, and the
   jumps this game. */
import { statsFor, COLS, signed, nameOfValue, wyrStats } from './rules.js';
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { openWindow, esc } from './ui.js';
import { profile, STAT_MODES } from './store.js';
import { fmtJumps } from './format.js';
import { bbBoxHTML } from './brackets.js';
import { lawBoxHTML } from './court.js';
import { boxHTML as scBoxHTML } from './story.js';
import { quackBoxHTML } from './quack.js';

export function statBoxHTML(s, id, round = null) {
  const p = s.players[id]; if (!p) return '';
  const st = statsFor(s, id, round);
  const val = v => v === null ? '—' : `${signed(v)} <span class="dim">${esc(nameOfValue(v))}</span>`;
  return `<article class="statbox" data-pid="${esc(id)}">
    <header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">${st.n} answer${st.n === 1 ? '' : 's'}</div></div></header>
    <dl>
      <dt>Chose most</dt><dd>${st.most.length ? st.most.map(c => `<span class="chip c${c + 1}">${esc(COLS[c])}</span>`).join(' ') : '—'}</dd>
      <dt>Median</dt><dd>${val(st.median)}</dd>
      <dt>Average</dt><dd>${val(st.avg)}</dd>
      <dt>Jumps this game</dt><dd>${fmtJumps(st.jumps)}</dd>
    </dl></article>`;
}

/* Would You Rather, this game: their answers and the sides they took */
function wyrBoxHTML(s, id) {
  const p = s.players[id], w = wyrStats(s).per[id] || { answers: 0, written: 0, split: 0, maj: 0, min: 0 };
  return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">${w.answers} answer${w.answers === 1 ? '' : 's'}</div></div></header>
    <dl><dt>With the bigger side</dt><dd>${w.maj}</dd><dt>With the smaller side</dt><dd>${w.min}</dd>
      <dt>Their questions split the room</dt><dd>${w.written ? `${Math.round(w.split / w.written * 100)}% evenly` : '—'}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}

/* all time, in one game mode: games, rounds, answers, what they chose most, their average, their jumps */
function totalsHTML(p, t, mode = 'aod') {
  if (!t) return '<p class="dim">No all-time stats from this player yet.</p>';
  const top = Math.max(...t.counts), most = top ? t.counts.map((k, c) => k === top ? c : -1).filter(c => c >= 0) : [];
  const avg = t.answers ? t.counts.reduce((a, k, c) => a + k * (c - 3), 0) / t.answers : null;
  if (mode === 'bb') {   // Bicker Brackets: their seeds' wins and losses, and the tournaments they won
    return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">all time · Bicker Brackets</div></div></header>
      <dl><dt>Games</dt><dd>${fmtJumps(t.games)}</dd><dt>Tournaments</dt><dd>${fmtJumps(t.rounds)}</dd><dt>Tournaments won</dt><dd>${fmtJumps(t.titles)}</dd>
        <dt>Contender wins</dt><dd>${fmtJumps(t.wins)}</dd><dt>Contender losses</dt><dd>${fmtJumps(t.losses)}</dd><dt>Votes in matches</dt><dd>${fmtJumps(t.answers)}</dd><dt>Jumps</dt><dd>${fmtJumps(t.jumps)}</dd></dl></article>`;
  }
  if (mode === 'sc') {   // Story Chain: their lines, and the votes for their lines and their secret words
    return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">all time · Story Chain</div></div></header>
      <dl><dt>Games</dt><dd>${fmtJumps(t.games)}</dd><dt>Rounds</dt><dd>${fmtJumps(t.rounds)}</dd><dt>Lines written</dt><dd>${fmtJumps(t.answers)}</dd>
        <dt>Votes for their lines</dt><dd>${fmtJumps(t.wins)}</dd><dt>Votes for their secret words</dt><dd>${fmtJumps(t.titles)}</dd><dt>Jumps</dt><dd>${fmtJumps(t.jumps)}</dd></dl></article>`;
  }
  if (mode === 'quack') {   // Who is the Quack?: rounds won, won as the Quack, and their votes for the real Quack
    return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">all time · Who is the Quack?</div></div></header>
      <dl><dt>Games</dt><dd>${fmtJumps(t.games)}</dd><dt>Rounds</dt><dd>${fmtJumps(t.rounds)}</dd><dt>Rounds won</dt><dd>${fmtJumps(t.wins)}</dd><dt>Won as the Quack</dt><dd>${fmtJumps(t.titles)}</dd>
        <dt>Votes</dt><dd>${fmtJumps(t.answers)}</dd><dt>For the real Quack</dt><dd>${fmtJumps(t.majority)}</dd><dt>Jumps</dt><dd>${fmtJumps(t.jumps)}</dd></dl></article>`;
  }
  if (mode === 'law') {   // Lawyering: their cases and their jury votes
    return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">all time · Lawyering</div></div></header>
      <dl><dt>Games</dt><dd>${fmtJumps(t.games)}</dd><dt>Rounds</dt><dd>${fmtJumps(t.rounds)}</dd><dt>Cases argued</dt><dd>${fmtJumps(t.argued)}</dd><dt>Cases won</dt><dd>${fmtJumps(t.wins)}</dd>
        <dt>Cases lost</dt><dd>${fmtJumps(t.losses)}</dd><dt>Gave up</dt><dd>${fmtJumps(t.gave)}</dd><dt>Jury votes</dt><dd>${fmtJumps(t.answers)}</dd><dt>Jumps</dt><dd>${fmtJumps(t.jumps)}</dd></dl></article>`;
  }
  if (mode === 'wyr') {   // Would You Rather: the sides they took
    const sided = t.majority + t.minority;
    return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">all time · Would You Rather</div></div></header>
      <dl><dt>Games</dt><dd>${fmtJumps(t.games)}</dd><dt>Rounds</dt><dd>${fmtJumps(t.rounds)}</dd><dt>Answers</dt><dd>${fmtJumps(t.answers)}</dd>
        <dt>With the bigger side</dt><dd>${sided ? `${Math.round(t.majority / sided * 100)}%` : '—'}</dd><dt>Jumps</dt><dd>${fmtJumps(t.jumps)}</dd></dl></article>`;
  }
  return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">all time</div></div></header>
    <dl><dt>Games</dt><dd>${fmtJumps(t.games)}</dd><dt>Rounds</dt><dd>${fmtJumps(t.rounds)}</dd><dt>Answers</dt><dd>${fmtJumps(t.answers)}</dd>
      <dt>Chose most</dt><dd>${most.length ? most.map(c => `<span class="chip c${c + 1}">${esc(COLS[c])}</span>`).join(' ') : '—'}</dd>
      <dt>Average</dt><dd>${avg === null ? '—' : `${signed(Math.round(avg * 10) / 10)} <span class="dim">${esc(nameOfValue(avg))}</span>`}</dd>
      <dt>Jumps</dt><dd>${fmtJumps(t.jumps)}</dd></dl></article>`;
}
let lastTab = 'game', lastMode = STAT_MODES[0][0];
export function openStats(s, id, me) {
  const p = s.players[id]; if (!p) return;
  const all = id === me ? profile.stats : p.stats;
  openWindow(`<h2>Stats</h2><div class="row stat-tabs" role="tablist"><button type="button" class="tile" data-st="game">This game</button><button type="button" class="tile" data-st="all">All time</button>
      <select class="stat-mode" aria-label="Game mode">${STAT_MODES.map(([m, n]) => `<option value="${m}">${esc(n)}</option>`).join('')}</select></div><div class="stats-one"></div><p class="small dim stat-note"></p>`, {
    cls: 'win-small',
    onOpen(w) {
      const body = w.querySelector('.stats-one'), note = w.querySelector('.stat-note'), mode = w.querySelector('.stat-mode');
      if (s.options.mode === 'hang') { lastTab = 'all'; w.querySelector('[data-st="game"]').hidden = true; }   // (Hangout keeps no stats of its own: all time only)
      const show = () => {
        w.querySelectorAll('[data-st]').forEach(b => b.setAttribute('aria-pressed', b.dataset.st === lastTab));
        mode.hidden = lastTab !== 'all'; mode.value = lastMode;
        const rounds = s.options.mode === 'quack' ? (s.wqPast || []).length : new Set(s.history.map(h => h.round)).size;
        body.innerHTML = lastTab === 'game' ? ({ wyr: wyrBoxHTML, bb: bbBoxHTML, sc: scBoxHTML, quack: quackBoxHTML, law: lawBoxHTML }[s.options.mode] || statBoxHTML)(s, id) : totalsHTML(p, all && all[lastMode], lastMode);
        note.textContent = lastTab === 'game' ? `This game: ${rounds} round${rounds === 1 ? '' : 's'} so far.` : 'Across every game played (test rooms only add jumps).';
      };
      w.querySelector('.stat-tabs').onclick = e => { const b = e.target.closest('[data-st]'); if (b) { lastTab = b.dataset.st; show(); } };
      mode.onchange = () => { lastMode = mode.value; show(); };
      show();
    },
  });
}
