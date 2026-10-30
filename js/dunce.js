/* ---------- Duncelation: what the screen shows ----------
   A take's board: Dunce on the left (a big dunce hat) and Not a Dunce on the right (a graduation cap), see-through like
   every board, with Lawyering's dark strip and slowly turning circle between them, where the defender stands. Over the
   board, the defender on the cloud and the take beside it, never its writer. The dunce's moment: the LOSER podium rises
   in the circle under the dunce. A dunce wears the dunce hat in black and white for the rest of the game (drawn here and
   in game.js only, never on anyone's own duck). Also the stats: the awards, each player's box and the takes. */
import { esc } from './ui.js';
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { cloudHTML } from './brackets.js';
import { rainbowHTML } from './art.js';
import { fmtJumps } from './format.js';
import { DN_SIDES, dnStats, wearsDunce } from './duncerules.js';

const GONE = { name: 'Gone', duck: { color: '#b7bccb' }, card: { color: '#8a8fa3' }, nameStyle: {} };
const player = (s, id) => (id && s.players[id]) || GONE;
const nm = p => nameHTML(p.name, p.nameStyle);
/* the sides' colors: the board's red and green (the colorblind palettes swap them like every board) */
export const DN_COLORS = ['var(--c2)', 'var(--c6)'];
/* a dunce's look: the dunce hat over whatever hat it wore (its own duck keeps it) */
export const dunceDuck = d => ({ ...(d || {}), hat: { id: 'dunce' } });

export const DUNCE_MARK = `<svg viewBox="0 0 80 100" aria-hidden="true"><path d="M8 88L40 6L72 88Z" fill="#fbfbf6" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/>
<path d="M40 6L72 88L56 88Z" fill="#000" opacity=".09"/><text x="39" y="76" text-anchor="middle" font-family="Georgia, Gelasio, serif" font-weight="700" font-size="30" fill="#1c1c28">D</text>
<path d="M8 88C26 95 54 95 72 88" stroke="#1c1c28" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
export const CAP_MARK = `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M26 34V54C26 62 74 62 74 54V34Z" fill="#2b2f45" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 10L94 28L50 46L6 28Z" fill="#3b3f5c" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/><path d="M50 13L88 28L50 43Z" fill="#fff" opacity=".07"/>
<path d="M50 28L80 36V58" fill="none" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="28" r="3.6" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.6"/>
<path d="M76 57L80 70L84 57Z" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

/* the two sides and the strip between them; after the verdict the losing side goes grey */
export function dnColsHTML(s) {
  const C = s.dn && s.dn.cur, done = !!C && C.w != null && ['discuss', 'dunced'].includes(s.phase);
  const side = c => `<div class="col law-side dn-side dn-${c ? 'not' : 'dunce'}${done ? (C.w === c ? ' won' : ' lost') : ''}" data-c="${c}" style="--c:${DN_COLORS[c]}">
    <div class="law-mark dn-mark">${c ? CAP_MARK : DUNCE_MARK}</div><span class="law-who"><b>${DN_SIDES[c]}</b></span></div>`;
  return `<div class="cols law-cols dn-cols">${side(0)}<div class="law-mid"></div>${side(1)}</div>`;
}
/* the LOSER podium, in the circle (game.js places it and raises it) */
export const DN_PODIUM = `<div class="dn-podium" aria-hidden="true"><div class="dn-pod-block"><b class="dn-pod-word">${rainbowHTML('LOSER', { seed: 3 })}</b></div></div>`;
/* over the board: the defender on the cloud, and the take beside it (the verdict once it's in) */
export function dnTopHTML(s, bw) {
  const C = s.dn && s.dn.cur, q = s.qs[s.qi]; if (!C || !q) return '';
  const p = player(s, C.def), dunce = wearsDunce(s, C.def) && bw, look = dunce ? { ...p, duck: dunceDuck(p.duck) } : p;
  const cloud = cloudHTML(s.players[C.def] ? look : null, 'Defender').replace('class="lord"', `class="lord${dunce ? ' dn-bw' : ''}"`);
  const [d, n] = C.end || [0, 0];
  const verdict = C.w == null || !['discuss', 'dunced'].includes(s.phase) ? '' : `<span class="law-verdict">${C.w ? `Not a dunce! ${n}–${d}` : `A dunce! ${d}–${n}`}</span>`;
  return `<div class="topover law-top dn-top">${cloud}<div class="question law-what">
    <span class="small dim">Convinced this isn't a dunce take?</span><span class="law-topic">${esc(q.text)}</span>
    <span class="small law-names">${nm(p)} defends it</span>${verdict}</div></div>`;
}

/* ---------- the stats: the awards, each player's box, then the takes ---------- */
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const quote = t => `"${t.length > 60 ? t.slice(0, 58).trimEnd() + '…' : t}"`;
const faceOf = (s, id, size) => { const p = player(s, id), on = wearsDunce(s, id); return `<span class="${on ? 'dn-bw' : ''}">${duckSVG(on ? dunceDuck(p.duck) : p.duck, { size, shadow: false, title: p.name })}</span>`; };
function awardsHTML(s, set) {
  const { per, takes } = dnStats(s, set), ids = Object.keys(per).filter(id => s.players[id]);
  const name = id => s.players[id] ? nm(s.players[id]) : 'Gone';
  const award = (title, who, line, tie = true) => who && who.length ? `<div class="award"><h3>${esc(title)}</h3><p>${who.map(name).join(who.length > 2 ? ', ' : ' and ')}${who.length > 1 && tie ? ' <span class="dim">(tie)</span>' : ''}</p><p class="small dim">${line}</p></div>` : '';
  const top = f => { const xs = ids.map(id => [id, f(per[id])]), v = Math.max(0, ...xs.map(x => x[1])); return v ? { v, who: xs.filter(x => x[1] === v).map(x => x[0]) } : null; };
  const best = top(p => p.not), back = top(p => p.comeback), jx = s.seat.map(id => [id, (s.jumps || {})[id] || 0]), jv = Math.max(0, ...jx.map(x => x[1]));
  const dunced = takes.filter(t => t.dunce && s.players[t.def]), last = dunced[dunced.length - 1];
  return `<div class="awards">
    ${award('Dunce', [...new Set(dunced.map(t => t.def))], last ? `Voted a dunce ${last.d}–${last.n} on ${esc(quote(last.text))}.` : '', false)}
    ${award('Most Convincing', best && best.who, best ? `${plural(best.v, 'Not a Dunce vote')}.` : '')}
    ${award('Comeback', back && back.who, back ? `Turned ${plural(back.v, 'vote')} from Dunce to Not a Dunce.` : '')}
    ${award('Most Jumps', jv ? jx.filter(x => x[1] === jv).map(x => x[0]) : [], `${plural(jv, 'jump')}.`)}</div>`;
}
/* a player's box: their takes and the votes they got (since the last dunce, or the whole game) */
export function dnBoxHTML(s, id, set = null) {
  const p = s.players[id]; if (!p) return '';
  const w = dnStats(s, set).per[id] || { turns: 0, not: 0, dunce: 0, comeback: 0, dunced: 0, votes: 0 };
  return `<article class="statbox" data-pid="${esc(id)}"><header>${faceOf(s, id, 46)}<div>${nm(p)}<div class="small dim">${plural(w.turns, 'take')} defended · ${plural(w.votes, 'vote')}</div></div></header>
    <dl><dt>Not a Dunce votes</dt><dd>${w.not}</dd><dt>Dunce votes</dt><dd>${w.dunce}</dd><dt>Comeback</dt><dd>${w.comeback}</dd>
      <dt>Voted a dunce</dt><dd>${w.dunced}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}
/* the takes, with who defended them and how the room voted (never who wrote them) */
function takesHTML(s, set) {
  const { takes } = dnStats(s, set);
  if (!takes.length) return '<p class="dim">No takes yet.</p>';
  return `<div class="law-cases">${takes.map(t => `<article class="law-case panel${t.dunce ? ' dn-was' : ''}"><p class="law-case-topic">${esc(t.text)}</p>
    <p class="law-case-vs">${faceOf(s, t.def, 26)}${nm(player(s, t.def))} <b class="law-score">${t.d} – ${t.n}</b><span class="small">${t.dunce ? 'A dunce' : 'Not a dunce'}${t.turned ? ` · turned ${plural(t.turned, 'vote')} around` : ''}</span></p></article>`).join('')}</div>`;
}
const block = (s, set) => `${awardsHTML(s, set)}<div class="statboxes">${s.seat.map(id => dnBoxHTML(s, id, set)).join('')}</div>${takesHTML(s, set)}`;
/* after a dunce: the takes since the one before (and every take once the review vote passes) */
export function dnStatsHTML(s) {
  const set = Math.max(0, ((s.dn && s.dn.dkN) || 0) - 1), last = ((s.dn && s.dn.dk) || []).slice(-1)[0];
  const who = last && s.players[last.id] ? `${nm(s.players[last.id])} is the dunce` : 'The dunce';
  return `<h2>${who}</h2>${block(s, set)}${s.review ? `<h2 class="all-h">The whole game</h2>${block(s, null)}` : ''}`;
}
export const dnOverHTML = s => block(s, null);
