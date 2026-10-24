/* ---------- stats: a player's stat box and the View stats window ----------
   On the −3 (strongly disagree) … +3 (strongly agree) scale: what they chose most, the median, the average, and the
   jumps this game. */
import { statsFor, COLS, signed, nameOfValue } from './rules.js';
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { openWindow, esc } from './ui.js';
import { profile } from './store.js';
import { fmtJumps } from './format.js';

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

export function openStats(s, id, me) {
  const p = s.players[id]; if (!p) return;
  const rounds = new Set(s.history.map(h => h.round)).size;
  openWindow(`<h2>Stats</h2><div class="stats-one">${statBoxHTML(s, id)}</div>
    <p class="small dim" style="margin-top:.7rem">This game: ${rounds} round${rounds === 1 ? '' : 's'} so far.${id === me ? ` On this device: ${fmtJumps(profile.jumps)} jumps.` : ''}</p>`, { cls: 'win-small' });
}
