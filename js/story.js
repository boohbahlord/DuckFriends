/* ---------- Story Chain: what the screen shows ----------
   The story is a see-through column over the map, one row a line: the sentence in its writer's font, underlined in the
   color of their player card, with a small copy of their duck under it. The line being typed glows a little and fills
   in as its writer types. The writer has a window under the story with their secret word (in the game's own font) and
   the box to type in. Once the lines are voted on, the secret words show below the story, each in its writer's card, and
   each one lights up inside its line. The stats sit beside the three choices: continue, a new story, or the lobby. */
import { esc } from './ui.js';
import { duckSVG } from './duck.js';
import { nameHTML, fontStyle as styleOf } from './name.js';
import { cardFor, cloudHTML } from './brackets.js';
import { scZones, scLineOf, scStory, scPara, scWriter, scStats, wordAt, SC_NEXT, LINE_MAX, WORD_MAX } from './rules.js';

const GONE = { name: 'Gone', duck: { color: '#b7bccb' }, card: { color: '#8a8fa3' }, nameStyle: {} };
const player = (s, id) => s.players[id] || GONE;
/* a player's font, scaled so every player's letters look the same size */
const fontStyle = p => styleOf(p && p.nameStyle && p.nameStyle.font);
const cardColor = p => (p && p.card && p.card.color) || '#8a8fa3';
const n = (v, one, many = one + 's') => `${v} ${v === 1 ? one : many}`;

/* a line's words, with its secret word lit up once the words are out */
function lineText(line, lit) {
  const i = lit ? wordAt(line.text, line.word) : -1;
  if (i < 0) return esc(line.text);
  const k = i + line.word.length;
  return `${esc(line.text.slice(0, i))}<mark class="sc-mark">${esc(line.text.slice(i, k))}</mark>${esc(line.text.slice(k))}`;
}

/* ---------- the secret word ---------- */
export function wordsHTML(s, me, who) {
  const done = s.done[me], mine = s.sc.words[me], cont = (scStory(s) || { paras: [] }).paras.length > 0;
  return `<div class="submit-wrap">${done ? `<div class="panel submit-card done-card"><h2>${mine ? 'Secret word sent ✓' : 'No secret word from you'}</h2>
      ${mine ? `<p class="q-echo">${esc(mine)}</p>` : ''}<p class="dim">Waiting for the others.</p></div>`
    : `<form class="panel submit-card sc-wordform" autocomplete="off"><h2>Your secret word</h2>
      <p class="small dim">Someone else has to sneak it into their line${cont ? ' of the next paragraph' : ''}.</p>
      <input class="sc-win" maxlength="${WORD_MAX}" placeholder="pineapple" aria-label="Your secret word" spellcheck="true">
      <p class="acts"><button type="submit" class="btn green">Send <kbd>Enter</kbd></button></p></form>`}
    <div class="who">${who}</div></div>`;
}

/* ---------- the board: the cloud and what's going on, the story (or the choices), the writer's window ---------- */
function headHTML(s, me) {
  if (s.phase === 'write') {
    const w = scWriter(s), p = player(s, w), para = scPara(s), first = !para.lines.length, story = scStory(s);
    const what = first ? (story.paras.length > 1 ? 'the first line of a new paragraph' : 'the opening line') : 'the next line';
    return `<div class="topover sc-top">${cloudHTML(p, 'Writing')}<p class="question sc-what">${w === me ? `Your turn: ${what}` : `${nameHTML(p.name, p.nameStyle)} is writing ${what}`}</p></div>`;
  }
  const say = { lvote: 'Favorite line?', wvote: 'Favorite secret word?', results: 'What next?' }[s.phase] || '';
  return `<div class="topover sc-top">${cloudHTML(null)}<p class="question sc-what">${say}</p></div>`;
}
/* one row a zone, in the zones' order (rules.js), so a duck's y lands on the same row on every screen */
export function rowsHTML(s, me) {
  const zones = scZones(s), story = scStory(s), last = story.paras.length - 1, lit = ['wvote', 'results'].includes(s.phase), para = scPara(s);
  const voters = i => Object.entries(para.votes || {}).filter(([id, k]) => k === i && s.players[id]).map(([id]) => duckSVG(s.players[id].duck, { size: 20, shadow: false, title: s.players[id].name })).join('');
  return zones.map((z, k) => {
    if (z === 'T') return `<div class="sc-row sc-typing" data-z="${k}">${typingHTML(s)}</div>`;
    if (z === 'H') return `<div class="sc-row sc-head" data-z="${k}"></div>`;
    if (z.startsWith('C:')) { const c = SC_NEXT.find(x => 'C:' + x[0] === z); return `<div class="sc-row sc-choice sc-${c[0]}" data-z="${k}"><span>${esc(c[1])}</span></div>`; }
    if (z.startsWith('W:')) {
      const id = z.slice(2), line = para.lines.find(l => l.wordBy === id), p = player(s, id);
      return `<div class="sc-row sc-wrow" data-z="${k}">${cardFor(p, esc(line ? line.word : ''), { cls: 'sc-wcard' })}</div>`;
    }
    const l = scLineOf(s, z), p = player(s, l.line.by), old = l.p < last;
    return `<div class="sc-row${old ? ' sc-old' : ''}${l.i === 0 && l.p > 0 ? ' sc-para' : ''}" data-z="${k}">
      <p class="sc-line"><span class="sc-txt" style="${fontStyle(p)};--u:${esc(cardColor(p))}">${lineText(l.line, lit && !old)}</span></p>
      <div class="sc-by"><span class="sc-mini">${duckSVG(p.duck, { size: 26, shadow: false, title: p.name })}</span>${lit && !old ? `<span class="sc-votes">${voters(l.i)}</span>` : ''}</div></div>`;
  }).join('');
}
/* the line being typed, as far as it goes */
export function typingHTML(s) {
  const w = scWriter(s), p = player(s, w), d = ((s.drafts || {})[w] || {}).text || '';
  return `<p class="sc-line"><span class="sc-txt" style="${fontStyle(p)};--u:${esc(cardColor(p))}">${d ? esc(d) : '<span class="dim">thinking…</span>'}<i class="caret"></i></span></p>
    <div class="sc-by"><span class="sc-mini">${duckSVG(p.duck, { size: 26, shadow: false, title: p.name })}</span><span class="sc-writing small">✎ writing</span></div>`;
}
/* the writer's window: their secret word and the box */
function writeHTML(s, me) {
  if (s.phase !== 'write' || scWriter(s) !== me || s.done[me]) return '';
  const word = (s.sc.assign[me] || {}).word || '', p = player(s, me), first = !scPara(s).lines.length;
  return `<form class="sc-write panel" autocomplete="off">
    <div class="sc-secret"><span class="small dim">Your secret word</span><b class="sc-secret-w">${esc(word)}</b></div>
    <textarea class="sc-in" maxlength="${LINE_MAX}" rows="2" style="${fontStyle(p)}" placeholder="${first ? 'Once upon a time…' : 'And then…'}" aria-label="Your line" spellcheck="true"></textarea>
    <div class="sc-foot"><span class="sc-left small dim">${LINE_MAX} left</span><span class="sc-need small">Put your secret word in it</span><button type="submit" class="btn green" disabled>Send <kbd>Enter</kbd></button></div></form>`;
}
export const boardHTML = (s, me) => `<div class="board sc-board">${headHTML(s, me)}
  <div class="sc-view"><div class="sc-rows">${rowsHTML(s, me)}</div><div class="ducks"></div><div class="fxl"></div></div>${writeHTML(s, me)}</div>`;

/* ---------- the stats: this paragraph's awards, then the whole game's once the review vote passes ---------- */
function awardsHTML(s, per) {
  const ids = Object.keys(per).filter(id => s.players[id]), nm = id => nameHTML(s.players[id].name, s.players[id].nameStyle);
  const top = f => { const xs = ids.map(id => [id, f(per[id])]); const v = Math.max(0, ...xs.map(x => x[1])); return v ? { v, who: xs.filter(x => x[1] === v).map(x => x[0]) } : null; };
  const award = (title, r, line) => r ? `<div class="award"><h3>${esc(title)}</h3><p>${r.who.map(nm).join(r.who.length > 2 ? ', ' : ' and ')}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ''}</p>${line(r)}</div>` : '';
  const quote = (r, f, cls = '') => r.who.length === 1 && f(per[r.who[0]]) ? `<p class="sc-quote${cls}" style="${fontStyle(s.players[r.who[0]])}">${esc(f(per[r.who[0]]))}</p>` : '';
  const jx = s.seat.map(id => [id, (s.jumps || {})[id] || 0]), jv = Math.max(0, ...jx.map(x => x[1]));
  return `${award('Most votes for their lines', top(p => p.lvotes), r => `${quote(r, p => p.best)}<p class="small dim">${n(r.v, 'vote')}.</p>`)}
    ${award('Most votes for their secret word', top(p => p.wvotes), r => `${quote(r, p => p.word, ' sc-qword')}<p class="small dim">${n(r.v, 'vote')}.</p>`)}
    ${award('Took the longest writing', top(p => Math.round(p.ms / 1000)), r => `<p class="small dim">${n(r.v, 'second')}.</p>`)}
    ${award('Most jumps', jv ? { v: jv, who: jx.filter(x => x[1] === jv).map(x => x[0]) } : null, r => `<p class="small dim">${n(r.v, 'jump')}.</p>`)}`;
}
const allParas = s => s.sc.stories.flatMap(st => st.paras);
export function statsHTML(s) {
  const now = allParas(s).filter(p => p.round === s.round);
  const stories = s.sc.stories.filter(st => st.paras.length).map((st, i) => `<div class="panel sc-done"><h3>Story ${i + 1}</h3>${st.paras.map(p => `<p class="small">${p.lines.map(l => `<span class="sc-fk" style="${fontStyle(player(s, l.by))}">${esc(l.text)}</span>`).join(' ')}</p>`).join('')}</div>`).join('');
  return `<h2>Round ${s.round + 1}</h2><div class="awards">${awardsHTML(s, scStats(now))}</div>
    ${s.review ? `<h2 class="all-h">All rounds</h2><div class="awards">${awardsHTML(s, scStats(allParas(s)))}</div>${stories}` : ''}`;
}
/* a player's "This game" box in the View stats window */
export function boxHTML(s, id) {
  const p = player(s, id), w = scStats(s.sc ? allParas(s) : [])[id] || { lines: 0, lvotes: 0, wvotes: 0, ms: 0 };
  return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">${n(w.lines, 'line')} written</div></div></header>
    <dl><dt>Votes for their lines</dt><dd>${w.lvotes}</dd><dt>Votes for their secret words</dt><dd>${w.wvotes}</dd><dt>Time writing</dt><dd>${Math.round(w.ms / 1000)} s</dd><dt>Jumps this game</dt><dd>${(s.jumps || {})[id] || 0}</dd></dl></article>`;
}
