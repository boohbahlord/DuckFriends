/* ---------- Who is the Quack?: what the screen shows ----------
   The board: one tile per duck in the round, in its player's card color and pattern (see-through over the map), with
   their duck on it as it looks right now and their name. The speaker's tile lights up while their duck sits on the
   cloud; a voted-out duck's tile turns grey. Between laps the board turns into two sides: Vote Out the Quack on the left,
   Another round of clues on the right.

   The Secret Card sits face down in the board's corner; hold it (or Q) to peek. When the round ends, the Quack's card
   flips over in the middle for everyone: the category and "You are the Quack". Then the stats. Nobody but the picker
   ever sees who picked the word. */
import { esc } from './ui.js';
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { cardBackground } from './card.js';
import { rainbowHTML } from './art.js';
import { cloudHTML } from './brackets.js';
import { gridOf, speakerOf, isGrey, stillIn, quackStats, WORD_MAX, CAT_MAX } from './quackrules.js';

const GONE = { name: 'Gone', duck: { color: '#b7bccb' }, card: { color: '#8a8fa3' }, nameStyle: {} };
const player = (s, id) => s.players[id] || GONE;
const nm = (s, id) => { const p = player(s, id); return `<span class="wq-w">${nameHTML(p.name, p.nameStyle)}</span>`; };   // (a name never breaks across lines)
const list = xs => xs.length > 2 ? xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1] : xs.join(' and ');

/* ---------- the board ---------- */
function tileClass(s, id, me) {
  const w = s.wq, r = w.result, quack = r && r.quacks.includes(id);
  return ['wq-tile', speakerOf(s) === id ? 'speaker' : '', isGrey(s, id) && !quack ? 'out' : '', quack ? 'quack' : '',
    s.phase === 'accuse' && id === me ? 'mine' : '', s.phase === 'accuse' && w.tie && !w.tie.includes(id) ? 'notie' : '',
    s.phase === 'reveal' && w.lastOut === id ? 'picked' : '', (w.dead || []).includes(id) ? 'dead' : ''].filter(Boolean).join(' ');
}
const tileInner = p => `<div class="wq-bg" style="${esc(cardBackground(p.card))}"></div>
  <div class="wq-tduck">${duckSVG(p.duck, { size: 96, shadow: true, title: p.name })}</div><span class="wq-tname">${nameHTML(p.name, p.nameStyle)}</span>`;
export function quackBoardHTML(s, me) {
  const w = s.wq;
  if (s.phase === 'choice') return `<div class="cols wyr-cols wq-sides">
    <div class="col wyr-a" data-c="0"><span class="wyr-txt">Vote Out the Quack</span></div><div class="wyr-or"><span>OR</span></div>
    <div class="col wyr-b" data-c="1"><span class="wyr-txt">Another round of clues</span></div></div>`;
  const { C, R } = gridOf(w.ids.length);
  return `<div class="cols wq-cols"><div class="wq-tiles" style="--C:${C};--R:${R}">${w.ids.map((id, k) => {
    const c = k % C, r = Math.floor(k / C);
    return `<div class="${tileClass(s, id, me)}" data-c="${k}" data-pid="${esc(id)}" style="--gc:${c + 1};--gr:${r + 1};--pc:${C - c}">${tileInner(player(s, id))}</div>`;
  }).join('')}</div></div>`;
}
/* the tiles follow the ducks' looks (Customize mid-game) and the round */
export function refreshTiles(root, s, me) {
  for (const t of root.querySelectorAll('.wq-tile')) {
    const id = t.dataset.pid, p = player(s, id), cls = tileClass(s, id, me), sig = JSON.stringify([p.duck, p.card, p.name, p.nameStyle]);
    if (t.className !== cls) t.className = cls;
    if (t._sig !== sig) { if (t._sig !== undefined) t.innerHTML = tileInner(p); t._sig = sig; }
  }
}
/* over the board: my Secret Card (or at the end, the Quack's), the cloud, and what's going on */
export function quackTopHTML(s, side = '') {
  const w = s.wq, sp = speakerOf(s), cat = `<span class="wq-cat">Category: <b>${esc(w.cat)}</b></span>`;
  const top = (cloud, q) => `<div class="topover wq-top"><div class="wq-sidecol">${side}</div>${cloud}${q}</div>`;
  if (s.phase === 'clue') {
    const order = w.order.filter(id => s.players[id] && !w.out[id]);
    return top(cloudHTML(s.players[sp] || null, 'Giving a clue'), `<div class="question wq-q">${cat}<span class="small dim">Lap ${w.lap} · clue ${order.indexOf(sp) + 1} of ${order.length}</span></div>`);
  }
  if (s.phase === 'choice') return top(cloudHTML(null), `<div class="question wq-q"><b>Vote out the Quack, or another round of clues?</b>${cat}</div>`);
  if (s.phase === 'accuse') return top(cloudHTML(null), `<div class="question wq-q"><b>Who is the Quack?</b>${w.tie ? `<span class="small">A tie! Vote again: ${list(w.tie.map(id => esc(player(s, id).name)))}.</span>` : '<span class="small dim">Walk onto their tile and vote.</span>'}${cat}</div>`);
  /* the reveal: who was voted out (on the cloud), and when the round is over, the word */
  const r = w.result, out = w.lastOut;
  const line = r ? (r.why === 'caught' ? 'The room caught the Quack!' : r.why === 'last' ? 'The Quack wins!' : r.why === 'fled' ? 'The Quack fled!' : r.why === 'skip' ? 'Round skipped.' : 'Not enough ducks left.')
    : out ? `${esc(player(s, out).name)} was not the Quack.` : 'Nobody was voted out.';
  return top(cloudHTML(out ? player(s, out) : null, out ? 'Voted out' : ''), `<div class="question wq-q${out ? ' wq-later' : ''}"><b>${line}</b>${r ? `<span>The word was <span class="wq-w"><b class="wq-word">${esc(r.word)}</b>.</span></span>` : `<span class="small dim">${stillIn(s).length} ducks left. The clues go on.</span>`}</div>`);
}
/* what the cloud says: the speaker's turn, the vote, the drumroll and the news */
export function quackLines(s) {
  const w = s.wq, r = w.result, out = w.lastOut, P = id => player(s, id).name;
  if (s.phase === 'clue') return [`${P(speakerOf(s))}, give a clue!`];
  if (s.phase === 'choice') return ['Vote or more clues?'];
  if (s.phase === 'accuse') return [w.tie ? 'Tie! Vote again' : 'Who is the Quack?'];
  if (s.phase !== 'reveal') return [];
  const lines = [];
  if (out) lines.push(`The room voted out ${P(out)}…`, r && r.quacks.includes(out) ? '…the Quack!' : '…not the Quack.');
  if (r) lines.push(r.why === 'caught' ? 'The room wins!' : r.why === 'last' ? 'The Quack wins!' : r.why === 'fled' ? 'The Quack fled!' : 'Not enough ducks');
  else if (!out) lines.push('Nobody is out');
  return lines;
}

/* ---------- the Secret Card ---------- */
/* (word by word, so a word never breaks across lines on a small card) */
const youAre = ['You', 'are', 'the', 'Quack'].map((w, i) => `<span class="wq-w">${rainbowHTML(w, { seed: 3 + i, from: [0, 3, 6, 9][i] })}</span>`).join(' ');
const cardFace = c => c.quack ? `<span class="wq-c-cat">${esc(c.cat)}</span><b class="wq-c-you">${youAre}</b>`
  : `<span class="wq-c-cat">${esc(c.cat)}</span><b class="wq-c-word">${esc(c.word)}</b>`;
const cardBack = '<span class="wq-c-title"><span>' + rainbowHTML('Secret', { seed: 5 }) + '</span><span>' + rainbowHTML('Card', { seed: 9, from: 6 }) + '</span></span>';
/* mine, face down beside the cloud: hold to peek */
export function secretCardHTML(c) {
  return `<div class="wq-card mine${c ? '' : ' dealing'}" role="button" tabindex="0" aria-label="Your Secret Card: hold to peek, or hold Q" data-tip="Hold to peek (or hold Q)">
    <div class="wq-flip"><div class="wq-side wq-back">${cardBack}<span class="small">${c ? 'Hold to peek' : 'Dealing…'}</span></div><div class="wq-side wq-front">${c ? cardFace(c) : ''}</div></div></div>`;
}
/* the round is over: the Quack's card flips over beside the cloud, for everyone */
export function revealCardsHTML(s) {
  const w = s.wq, r = w.result; if (s.phase !== 'reveal' || !r) return '';
  return r.quacks.map(id => `<div class="wq-rv"><div class="wq-card big"><div class="wq-flip"><div class="wq-side wq-back">${cardBack}</div><div class="wq-side wq-front">${cardFace({ quack: true, cat: w.cat })}</div></div></div>
    <div class="wq-rv-who">${nm(s, id)}</div></div>`).join('');
}

/* ---------- picking the secret word ---------- */
export function pickHTML(s, me) {
  const w = s.wq;   // (I never show who picks: the picker is never the Quack, so their name would clear a duck)
  if (w.picker !== me) return `<div class="submit-wrap"><div class="panel submit-card done-card wq-wait">
    <h2>Someone is picking the secret word…</h2><p class="dim">Everyone but the Quack will see it on their Secret Card.</p></div></div>`;
  return `<div class="submit-wrap"><form class="panel submit-card wq-pick" autocomplete="off"><h2>Pick the secret word</h2>
    <p class="small dim">Only you see this. Everyone gets it on their Secret Card, except the Quack, who only sees the category. You're never the Quack when you pick.</p>
    <label class="wq-field"><span>The word</span><input class="wq-in" name="word" maxlength="${WORD_MAX}" placeholder="Pancake" aria-label="The secret word" spellcheck="true" required></label>
    <label class="wq-field"><span>Its category</span><input class="wq-in" name="cat" maxlength="${CAT_MAX}" placeholder="Breakfast" aria-label="Its category" spellcheck="true" required></label>
    <p class="acts"><button type="submit" class="btn green">Send <kbd>Enter</kbd></button><button type="button" class="btn ghost" data-a="wqidea">Need an idea?</button></p></form></div>`;
}

/* ---------- the stats: the round's, then the whole game's once the review vote passes ---------- */
function awardsHTML(s, per, game = false) {   // game: the whole game's (Duckguise, Quick Quack and Wrongly Accused show only there)
  const ids = Object.keys(per).filter(id => s.players[id]);
  const top = f => { const xs = ids.map(id => [id, f(per[id])]); const v = Math.max(0, ...xs.map(x => x[1])); return v ? { v, who: xs.filter(x => x[1] === v).map(x => x[0]) } : null; };
  const award = (title, r, line, none) => r ? `<div class="award"><h3>${esc(title)}</h3><p>${list(r.who.map(id => nm(s, id)))}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ''}</p><p class="small dim">${line(r.v)}</p></div>`
    : none ? `<div class="award"><h3>${esc(title)}</h3><p class="dim">None</p><p class="small dim">${none}</p></div>` : '';
  const n = (v, one, many = one + 's') => `${v} ${v === 1 ? one : many}`;
  const jx = s.seat.map(id => [id, (s.jumps || {})[id] || 0]), jv = Math.max(0, ...jx.map(x => x[1]));
  const quick = ids.filter(id => per[id].clues).map(id => [id, per[id].clueMs / per[id].clues]), qv = Math.min(...quick.map(x => x[1]));
  const disguise = top(p => p.quackWins * 1000 + p.laps), dp = disguise && per[disguise.who[0]];
  return `${award('Sharpest Beak', top(p => p.right), v => `Voted for the real Quack ${n(v, 'time')}.`, 'Nobody voted for the real Quack.')}
    ${award('InvestiDucker', top(p => p.first), v => `First onto the real Quack's tile in a vote ${n(v, 'time')}.`)}
    ${game ? award('Duckguise', disguise, () => dp.quackWins ? `Won ${n(dp.quackWins, 'time')} as the Quack and lasted ${n(dp.laps, 'lap')} of clues.` : `Lasted ${n(dp.laps, 'lap')} of clues as the Quack.`) : ''}
    ${game && quick.length ? award('Quick Quack', { v: qv, who: quick.filter(x => x[1] === qv).map(x => x[0]) }, v => `Ended their clue turn in ${(v / 1000).toFixed(1)} s on average.`) : ''}
    ${game ? award('Wrongly Accused', top(p => p.outs), v => `Voted out while innocent ${n(v, 'time')}.`) : ''}
    ${award('Most jumps', jv ? { v: jv, who: jx.filter(x => x[1] === jv).map(x => x[0]) } : null, v => n(v, 'jump') + '.')}`;
}
export function quackStatsHTML(s) {
  const past = s.wqPast || [], r = past[past.length - 1]; if (!r) return '';
  const sc = s.wqScore || { quack: 0, room: 0 };
  const head = r.why === 'caught' ? 'The room caught the Quack!' : r.why === 'last' ? 'The Quack wins!' : r.why === 'fled' ? 'The Quack fled!' : r.why === 'skip' ? 'Round skipped.' : 'Not enough ducks left.';
  const block = `<div class="wq-sum panel"><h3>${esc(head)}</h3>
      <p>${r.quacks.length > 1 ? 'The Quacks' : 'The Quack'}: ${list(r.quacks.map(id => nm(s, id)))} · The word: <b>${esc(r.word)}</b> <span class="dim">(${esc(r.cat)})</span></p>
      <p class="wq-score"><span class="q">Quacks ${sc.quack}</span> · <span class="r">Room ${sc.room}</span></p></div>
    <div class="awards">${awardsHTML(s, quackStats([r]))}</div>`;
  const all = s.review ? `<h2 class="all-h">The whole game</h2><div class="awards">${awardsHTML(s, quackStats(past), true)}</div>
    <div class="panel wq-rounds">${past.map(x => `<p class="small"><span class="dim">Round ${x.round + 1} · ${esc(x.cat)}:</span> ${esc(x.word)} · ${x.quacks.map(id => esc(player(s, id).name)).join(' and ')} ${x.win === 'quack' ? 'won' : x.win === 'room' ? 'was caught' : x.why === 'fled' ? 'fled' : x.why === 'skip' ? '(skipped)' : '(no winner)'}</p>`).join('')}</div>` : '';
  return `<div class="bb-stats wq-stats"><h2>Round ${r.round + 1}</h2>${block}${all}</div>`;
}
/* a player's "This game" box in the View stats window */
export function quackBoxHTML(s, id) {
  const p = player(s, id), w = quackStats(s.wqPast || [])[id] || { right: 0, votes: 0, quack: 0, quackWins: 0, wins: 0, losses: 0, outs: 0, first: 0, laps: 0, clueMs: 0, clues: 0 };
  return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">${w.votes} vote${w.votes === 1 ? '' : 's'}</div></div></header>
    <dl><dt>Voted for the real Quack</dt><dd>${w.right}</dd><dt>Rounds won</dt><dd>${w.wins}</dd><dt>Rounds as the Quack</dt><dd>${w.quack}</dd><dt>Won as the Quack</dt><dd>${w.quackWins}</dd><dt>Laps lasted as the Quack</dt><dd>${w.laps}</dd><dt>First onto the Quack's tile</dt><dd>${w.first}</dd><dt>Voted out while innocent</dt><dd>${w.outs}</dd><dt>Average clue turn</dt><dd>${w.clues ? `${(w.clueMs / w.clues / 1000).toFixed(1)} s` : '—'}</dd><dt>Jumps this game</dt><dd>${(s.jumps || {})[id] || 0}</dd></dl></article>`;
}
