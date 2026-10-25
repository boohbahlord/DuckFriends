/* ---------- Bicker Brackets: what the screen shows ----------
   The seed card: the writer's duck in a circle on the left, on their player card; the seed's words in a box reaching
   right from it (rounded on the right), in the writer's card color and pattern, with the theme behind the letters so
   they read, in the writer's font, and the writer's name under them. Silver in the final, gold for the champion; a
   knocked-out seed fades to grey under a red X. In a blind bracket a "?" stands in for the writer until the seed is out
   or wins it all.

   The views: writing and voting on the topic, typing the seeds together, the two seeds of a match on the board (no
   board drawn, the cards see-through, a slow breathing color behind them while the room votes), the bracket (it moves
   the way your duck walks; − and + zoom it), the podium and the stats. */
import { esc } from './ui.js';
import { duckSVG } from './duck.js';
import { nameHTML, fontHTML } from './name.js';
import { cardBackground } from './card.js';
import { rainbowHTML } from './art.js';
import { roundName, writerShown, bbMatch, podium, bbStats, seedOut, SEED_MAX, TOPIC_MAX } from './rules.js';

const GONE = { name: 'Gone', duck: { color: '#b7bccb' }, card: { color: '#8a8fa3' }, nameStyle: {} };
const inFont = (p, html) => fontHTML(p && p.nameStyle && p.nameStyle.font, html);   // (a player's font, scaled to match)

/* ---------- the cloud (shared with the Round Lord) ---------- */
export const CLOUD_SVG = `<svg class="cloud-svg" viewBox="0 0 200 84" aria-hidden="true">
      <g fill="#dcebf8"><circle cx="50" cy="52" r="28"/><circle cx="92" cy="40" r="34"/><circle cx="140" cy="48" r="30"/><circle cx="170" cy="62" r="20"/><circle cx="26" cy="64" r="18"/><rect x="26" y="52" width="148" height="30" rx="15"/></g>
      <g fill="#fff"><circle cx="50" cy="48" r="26"/><circle cx="92" cy="36" r="32"/><circle cx="140" cy="44" r="28"/><circle cx="170" cy="58" r="18"/><circle cx="26" cy="60" r="16"/><rect x="28" y="50" width="144" height="26" rx="13"/></g>
      <ellipse cx="84" cy="24" rx="16" ry="6" fill="#fff" opacity=".9"/></svg>`;
/* a duck on the cloud (or an empty cloud): p = the player, tip = what hovering the duck calls them */
export function cloudHTML(p, tip = 'Round Lord') {
  return `<div class="lord"><div class="lord-sit">
    <div class="lord-duck">${p ? duckSVG(p.duck, { size: 80, shadow: false, title: '', dead: !!p.dead }) + `<span class="lord-tip">${inFont(p, esc(tip))}</span>` : ''}</div>
    ${CLOUD_SVG}</div>
    <div class="lord-say" aria-live="polite"></div>
    <div class="lord-name">${p ? nameHTML(p.name, p.nameStyle) : ''}</div></div>`;
}
/* two ducks on one cloud (a match's two writers): pa on the left facing right, pb on the right facing left. o.winner = 0 or
   1 once it's decided; o.knocked = the loser is already off the cloud (knockOff in
   duel.js plays the bump); o.both = nobody won, so both jump off (bothOff), and o.knocked then means they're gone */
const MYSTERY = { duck: { color: '#b7bccb' } };
export function duelCloudHTML(pa, pb, o = {}) {
  const duck = (p, side) => `<div class="lord-duck duel-duck${o.winner === side ? ' won' : ''}" data-side="${side}"><div class="duel-in">${duckSVG((p || MYSTERY).duck, { size: 80, shadow: false, title: p ? p.name : 'A secret writer', dead: !!(p && p.dead) })}</div></div>`;
  return `<div class="lord duel${o.winner != null ? ' decided' : ''}${o.both ? ' bothoff' : ''}${o.knocked ? ' knocked' : ''}"><div class="lord-sit">
    ${duck(pa, 0)}${duck(pb, 1)}${CLOUD_SVG}</div>
    <div class="lord-say" aria-live="polite"></div><div class="lord-name"></div></div>`;
}

/* ---------- the seed card ---------- */
/* p = the writer (null: hidden), body = the words as HTML; o = { tier: 'silver' | 'gold', out, size: 'big' | 'mini', cls, attrs } */
export function cardFor(p, body, o = {}) {
  const bg = esc(cardBackground(p ? p.card : { color: '#8a8fa3' }));
  return `<div class="seed${o.tier ? ' ' + o.tier : ''}${o.out ? ' out' : ''}${o.size ? ' ' + o.size : ''}${o.cls ? ' ' + o.cls : ''}"${o.attrs || ''}>
    <div class="seed-disc" style="${bg}">${p ? duckSVG(p.duck, { size: 60, shadow: false, title: p.name }) : '<span class="seed-q">?</span>'}</div>
    <div class="seed-box" style="${bg}"><span class="seed-txt">${p ? inFont(p, body) : body}</span><span class="seed-by">${p ? nameHTML(p.name, p.nameStyle) : 'A secret writer'}</span></div>
    ${o.out ? '<svg class="seed-x" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 7L33 33M33 7L7 33"/></svg>' : ''}${o.extra || ''}</div>`;
}
export function seedCardHTML(s, b, i, o = {}) {
  const seed = b.seeds[i]; if (!seed) return '';
  return cardFor(writerShown(s, b, i) ? s.players[seed.by] || GONE : null, esc(seed.text), { ...o, attrs: ` data-seed="${i}"` });
}
const player = (s, id) => s.players[id] || GONE;

/* ---------- the topic ---------- */
export function topicHTML(s, me, who) {
  const done = s.done[me], sent = (s.subs || []).find(t => t.by === me);
  return `<div class="submit-wrap bb-wrap">${done ? `<div class="panel submit-card done-card"><h2>${sent ? 'Topic sent ✓' : 'No topic from you'}</h2>
      ${sent ? `<p class="q-echo">${esc(sent.text)}</p>` : ''}<p class="dim">Waiting for the others.</p></div>`
    : `<form class="panel submit-card bb-write" autocomplete="off"><h2>The tournament's topic</h2>
      <p class="small dim">Everyone writes one, then you all vote on them. ${TOPIC_MAX} letters at most.</p>
      <input class="bb-in" maxlength="${TOPIC_MAX}" placeholder="Best snack" aria-label="Your topic" spellcheck="true">
      <p class="acts"><button type="submit" class="btn green">Send <kbd>Enter</kbd></button><button type="button" class="btn ghost" data-a="bbnone">Don't write one</button></p></form>`}
    <section class="bb-live"><h3>Everyone's topics</h3><div class="bb-turn bb-topic-live"></div></section></div>`;
}
/* the others' topics as they come in (typed so far, or sent ✓) */
export const topicLiveHTML = (s, me) => liveCardsHTML(s, s.seat.filter(id => id !== me && s.players[id] && !s.players[id].late), 'No topic');
export const tvoteHTML = (s, me) => `<div class="submit-wrap bb-wrap"><h2 class="bb-h">Pick the topic</h2>
    <div class="bb-topics">${topicsHTML(s, me)}</div>
    <p class="small dim">Click the topic you want; you can change your mind until the vote ends. A tie is a coin flip.</p></div>`;
/* the topics to vote on, each with the ducks that picked it */
export function topicsHTML(s, me) {
  const b = s.bb, mine = (b.tvotes || {})[me];
  return b.topics.map((t, i) => cardFor(player(s, t.by), esc(t.text), {
    cls: 'topic-card', attrs: ` role="button" tabindex="0" data-topic="${i}" aria-pressed="${mine === i}"`,
    extra: `<span class="tc-votes">${Object.entries(b.tvotes || {}).filter(([id, k]) => k === i && s.players[id]).map(([id]) => duckSVG(s.players[id].duck, { size: 22, shadow: false, title: s.players[id].name })).join('')}</span>`,
  })).join('');
}

/* ---------- typing the seeds: everyone's card for this turn, each filling in as its writer types ---------- */
export function seedsHTML(s, me) {
  const b = s.bb, mineNow = (b.per[me] || 0) > b.turn, p = player(s, me);
  const head = `<header class="bb-head panel"><span class="small dim">Topic</span><b>${inFont(s.players[b.topicBy], esc(b.topic))}</b>
    <span class="small dim">Contender ${b.turn + 1} of ${b.turns}${mineNow ? '' : ' · you have no contender to write this turn'}</span></header>`;
  let mine = '';
  if (mineNow && !s.done[me]) mine = `<form class="bb-write seed-form" autocomplete="off">${cardFor(p, `<input class="bb-in seed-in" maxlength="${SEED_MAX}" placeholder="Your contender" aria-label="Your contender">`, { size: 'big', cls: 'mine typing' })}
      <p class="acts"><button type="submit" class="btn green">Send <kbd>Enter</kbd></button><button type="button" class="btn ghost" data-a="bbskip">Skip this one</button></p></form>`;
  else if (mineNow) { const sent = (s.subs || []).find(x => x.by === me); mine = cardFor(p, sent ? esc(sent.text) : '<span class="dim">Skipped</span>', { size: 'big', cls: 'mine sent', extra: '<span class="seed-ok">✓</span>' }); }
  return `<div class="submit-wrap bb-wrap bb-seeds">${head}<div class="bb-turn">${mine}<h3 class="bb-now">Writing now</h3><div class="bb-others"></div></div>
    <section class="bb-sofar"><h3></h3><div class="bb-grid"></div></section></div>`;
}
/* the others' cards this turn, as they type: still writing (lit up, "writing") or sent (✓) */
export const othersHTML = (s, me) => liveCardsHTML(s, s.seat.filter(id => id !== me && (s.bb.per[id] || 0) > s.bb.turn && s.players[id]), 'Skipped');
function liveCardsHTML(s, ids, none) {
  return ids.map(id => {
    const sent = (s.subs || []).find(x => x.by === id), d = ((s.drafts || {})[id] || {}).text || '';
    const body = sent ? esc(sent.text) : s.done[id] ? `<span class="dim">${none}</span>` : d ? `${esc(d)}<i class="caret"></i>` : '<span class="dim">thinking…</span>';
    return cardFor(s.players[id], body, { cls: s.done[id] ? 'sent' : 'typing', extra: s.done[id] ? '<span class="seed-ok">✓</span>' : '<span class="seed-writing">✎ writing</span>' });
  }).join('');
}
export const sofarHTML = s => s.bb.seeds.map((x, i) => seedCardHTML(s, s.bb, i, { size: 'mini' })).join('');

/* ---------- a match: the two seeds on the board ---------- */
/* a match's two colors: different, picked at random for each match (the same on every screen) */
const SIDE_COLORS = ['#2fa4ff', '#ff8c2b', '#ef3b3b', '#37d421', '#9b5de5', '#ffd23f', '#ff5fa2', '#16c7c7', '#6f7dff', '#ff6b3d', '#8bd13c', '#c45cff'];
/* hex ↔ hue, saturation, lightness (0–360, 0–1, 0–1) */
function toHsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
}
function fromHsl(h, sat, l) {
  h = (h % 360 + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * sat, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [R, G, B].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
/* the match's two side colors. shift turns both around the color wheel together while the match is voted on; they stay
   at least a third of the wheel apart, so the sides never look alike */
export function matchColors(s, shift = 0) {
  let h = ((s.round + 1) * 2654435761 + (s.qi + 1) * 40503 + ((s.bb && s.bb.m) + 2) * 977) >>> 0;
  const next = n => { h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return h % n; };
  const a = next(SIDE_COLORS.length), b = (a + 1 + next(SIDE_COLORS.length - 1)) % SIDE_COLORS.length;
  const A = toHsl(SIDE_COLORS[a]), B = toHsl(SIDE_COLORS[b]), gap = ((B[0] - A[0]) % 360 + 360) % 360;
  if (gap < 120 || gap > 240) B[0] = A[0] + (gap < 180 ? 120 : 240);
  return [fromHsl(A[0] + shift, A[1], A[2]), fromHsl(B[0] + shift, B[1], B[2])];
}
export function matchColsHTML(s) {
  const b = s.bb, m = bbMatch(s), fin = b.r === b.rounds.length - 1, done = s.phase === 'discuss' && m.w != null;
  const side = (c, i) => `<div class="col bb-side bb-${c ? 'b' : 'a'}${done ? (m.w === i ? ' won' : ' lost') : ''}" data-c="${c}">${seedCardHTML(s, b, i, { size: 'big', tier: fin ? (done && m.w === i ? 'gold' : 'silver') : '', out: done && m.w !== i })}</div>`;
  return `<div class="cols bb-cols">${side(0, m.a)}<div class="bb-vs"><span>${s.phase === 'tie' ? 'TIE' : 'VS'}</span></div>${side(1, m.b)}</div>
    ${s.phase === 'answer' ? `<div class="bb-breathe" style="--h0:${(s.qi * 137 + s.round * 59) % 360}deg" aria-hidden="true"></div>` : ''}`;
}
/* over the board: the cloud, and beside it what the match is (voting) or the winner (talking it over) */
/* knocked: the loser is already off the cloud. Only the final's loser gets bumped off; after any other match the winner
   simply has the cloud */
export function matchTopHTML(s, knocked = false) {
  const b = s.bb, m = bbMatch(s), fin = b.r === b.rounds.length - 1, round = b.rounds[b.r];
  const writer = i => b.seeds[i] && writerShown(s, b, i) ? player(s, b.seeds[i].by) : null;
  const duel = (o = {}) => duelCloudHTML(writer(m.a), writer(m.b), o);   // both writers on the cloud
  const real = round.filter(x => x.b !== -1), k = real.indexOf(m) + 1;
  const topic = `<span class="bb-topic">${inFont(s.players[b.topicBy], esc(b.topic))}</span>`;
  if (s.phase === 'discuss' && m.w != null) {
    return `<div class="topover bb-top">${duel({ winner: m.w === m.a ? 0 : 1, knocked: knocked || !fin })}<div class="question bb-winner">${seedCardHTML(s, b, m.w, { tier: fin ? 'gold' : '' })}
      <div class="bb-win-word">${rainbowHTML(fin ? 'Champion!' : 'Winner!')}</div>${m.coin ? '<p class="small dim">A tie: a coin flip decided it.</p>' : ''}</div></div>`;
  }
  if (s.phase === 'tie' && b.tie) return `<div class="topover bb-top">${duel()}<div class="question bb-what">${topic}
    <b class="bb-tie">Tied ${b.tie.va}–${b.tie.vb}!</b><span class="small dim">Vote again, or toss a coin? (Below.)</span></div></div>`;
  return `<div class="topover bb-top">${duel()}<div class="question bb-what">${topic}
    <span class="small dim">${esc(roundName(b, b.r))}${fin ? '' : ` · match ${k} of ${real.length}`}</span>
    ${fin ? `<div class="bb-final">${seedCardHTML(s, b, m.a, { size: 'mini', tier: 'silver' })}<b>vs</b>${seedCardHTML(s, b, m.b, { size: 'mini', tier: 'silver' })}</div>` : ''}</div></div>`;
}

/* ---------- the bracket ---------- */
const CW = 216, CH = 48, GAP = 6, VS = 22, CG = 56, U = CH * 2 + GAP + VS;   // card width and height, pixels
export function treeSize(b) { const R = b.rounds.length, M = b.rounds[0].length; return { W: (R + 1) * (CW + CG) - CG, H: M * U }; }
export function bracketHTML(s) {
  const b = s.bb, R = b.rounds.length, { W, H } = treeSize(b), boxes = [], lines = [];
  const next = b.champ == null ? b.rounds[b.r].findIndex(m => m.w == null) : -1;
  b.rounds.forEach((round, k) => round.forEach((m, j) => {
    const x = k * (CW + CG), cy = (j + .5) * 2 ** k * U, fin = k === R - 1, up = k === b.r && j === next;
    const slot = (i, top) => {
      const pos = `left:${x}px;top:${top ? cy - CH - GAP / 2 : cy + GAP / 2}px;width:${CW}px;height:${CH}px`;
      if (i === -1) return `<div class="bslot bye" style="${pos}">bye</div>`;
      if (i == null) return `<div class="bslot open" style="${pos}">?</div>`;
      return `<div class="bslot${up ? ' next' : ''}" style="${pos}">${seedCardHTML(s, b, i, { size: 'mini', tier: fin ? (b.champ === i ? 'gold' : 'silver') : '', out: m.w != null && m.w !== i && m.b !== -1 })}</div>`;
    };
    boxes.push(slot(m.a, true), slot(m.b, false));
    const ny = k < R - 1 ? ((j >> 1) + .5) * 2 ** (k + 1) * U : cy, mid = x + CW + CG / 2;
    lines.push(`<path class="${m.w != null ? 'won' : ''}" d="M${x + CW} ${cy}H${mid}V${ny}H${x + CW + CG}"/>`);
  }));
  const cx = R * (CW + CG), cpos = `left:${cx}px;top:${H / 2 - CH / 2}px;width:${CW}px;height:${CH}px`;
  boxes.push(b.champ != null ? `<div class="bslot champ" style="${cpos}">${seedCardHTML(s, b, b.champ, { size: 'mini', tier: 'gold' })}<span class="bb-crown" aria-hidden="true">🏆</span></div>`
    : `<div class="bslot open champ" style="${cpos}">🏆 Champion</div>`);
  return `<div class="bb-tree" style="width:${W}px;height:${H}px"><svg class="bb-lines" width="${W}" height="${H}" aria-hidden="true">${lines.join('')}</svg>${boxes.join('')}</div>`;
}
export function bracketTopHTML(s) {
  const b = s.bb, upNext = b.champ != null ? 'The champion!' : `Up next: ${roundName(b, b.r)}`;
  return `<div class="bb-label panel"><span class="bb-topic">${inFont(s.players[b.topicBy], esc(b.topic))}</span><span class="small dim">${esc(upNext)}</span></div>
    <div class="bb-zoom"><button type="button" class="btn ghost iconbtn" data-a="zoomout" aria-label="Zoom out">−</button><button type="button" class="btn ghost iconbtn" data-a="zoomfit" aria-label="Fit the bracket" data-tip="Fit the bracket">⤢</button><button type="button" class="btn ghost iconbtn" data-a="zoomin" aria-label="Zoom in">+</button></div>`;
}

/* ---------- the podium: 1st the champion's writer, 2nd the runner-up's, 3rd both semifinal losers' ---------- */
export function podiumHTML(s) {
  const b = s.bb, pd = podium(b); if (!pd) return '';
  const step = (place, seeds, label) => `<div class="pod pod-${place}">
    <div class="pod-ducks">${seeds.map(i => { const p = player(s, b.seeds[i].by); return `<span class="pod-duck">${duckSVG(p.duck, { size: 96, shadow: false, title: p.name })}</span>`; }).join('')}</div>
    <div class="pod-block"><b class="pod-n">${label}</b>${seeds.map(i => seedCardHTML(s, b, i, { size: 'mini', tier: place === 1 ? 'gold' : place === 2 ? 'silver' : 'bronze' })).join('')}</div></div>`;
  /* on a phone the steps are too narrow for the cards: they show the places, and the cards line up under them */
  const row = (place, i, label) => `<div class="pod-row"><b class="pod-n">${label}</b>${seedCardHTML(s, b, i, { tier: place === 1 ? 'gold' : place === 2 ? 'silver' : 'bronze' })}</div>`;
  return `<div class="podium-wrap"><h1 class="pod-title">${rainbowHTML(b.topic)}</h1>
    <div class="podium">${pd.second != null ? step(2, [pd.second], '2nd') : ''}${step(1, [pd.first], '1st')}${pd.third.length ? step(3, pd.third, '3rd') : ''}</div>
    <div class="pod-list">${row(1, pd.first, '1st')}${pd.second != null ? row(2, pd.second, '2nd') : ''}${pd.third.map(i => row(3, i, '3rd')).join('')}</div>
    <p class="dim pod-left"></p></div>`;
}

/* ---------- the stats: this tournament's awards, then the whole game's once the review vote passes ---------- */
function awardsHTML(s, per, scope) {
  const ids = Object.keys(per).filter(id => s.players[id]), nm = id => nameHTML(s.players[id].name, s.players[id].nameStyle);
  const top = f => { const xs = ids.map(id => [id, f(per[id])]); const v = Math.max(0, ...xs.map(x => x[1])); return v ? { v, who: xs.filter(x => x[1] === v).map(x => x[0]) } : null; };
  const award = (title, r, line) => r ? `<div class="award"><h3>${esc(title)}</h3><p>${r.who.map(nm).join(r.who.length > 2 ? ', ' : ' and ')}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ''}</p><p class="small dim">${line(r.v)}</p></div>` : '';
  const n = (v, one, many = one + 's') => `${v} ${v === 1 ? one : many}`;
  const jx = s.seat.map(id => [id, (s.jumps || {})[id] || 0]), jv = Math.max(0, ...jx.map(x => x[1]));
  return `${award('Most tournaments won', scope === 'game' ? top(p => p.titles) : null, v => n(v, 'tournament') + ' won.')}
    ${award('Most wins with their contenders', top(p => p.wins), v => n(v, 'match', 'matches') + ' won.')}
    ${award('Most losses', top(p => p.losses), v => n(v, 'match', 'matches') + ' lost.')}
    ${award('Fan of themselves', top(p => p.own), v => `Voted for their own contenders ${n(v, 'time')}.`)}
    ${award('Kingmaker', top(p => p.king), v => `Their vote decided ${n(v, 'one-vote match', 'one-vote matches')}.`)}
    ${award('Most jumps', jv ? { v: jv, who: jx.filter(x => x[1] === jv).map(x => x[0]) } : null, v => n(v, 'jump') + '.')}`;
}
export function bbStatsHTML(s) {
  const past = s.bbPast || [], t = past[past.length - 1]; if (!t) return '';
  const champ = t.seeds[t.champ], cp = champ && player(s, champ.by);
  const block = `<div class="bb-champ panel"><h3>Won the tournament</h3>${cp ? `<p class="bb-champ-name">${nameHTML(cp.name, cp.nameStyle)}</p>` : ''}${seedCardHTML({ ...s, phase: 'results' }, t, t.champ, { tier: 'gold', size: 'big' })}</div>
    <div class="awards">${awardsHTML(s, bbStats([t]), 'round')}</div>`;
  const all = s.review ? `<h2 class="all-h">The whole game</h2><div class="awards">${awardsHTML(s, bbStats(past), 'game')}</div>
    <div class="panel bb-champs">${past.map(x => { const c = x.seeds[x.champ], p = c && player(s, c.by); return `<p class="small"><span class="dim">Round ${x.round + 1} · ${esc(x.topic)}:</span> ${c ? esc(c.text) : '—'}${p ? ` <span class="dim">by ${esc(p.name)}</span>` : ''}</p>`; }).join('')}</div>` : '';
  return `<div class="bb-stats"><h2>Round ${t.round + 1}: ${esc(t.topic)}</h2>${block}${all}</div>`;
}
/* a player's "This game" box in the View stats window */
export function bbBoxHTML(s, id) {
  const p = player(s, id), w = bbStats(s.bbPast || [])[id] || { wins: 0, losses: 0, own: 0, votes: 0, king: 0, titles: 0 };
  return `<article class="statbox"><header>${duckSVG(p.duck, { size: 46, shadow: false, title: p.name })}<div>${nameHTML(p.name, p.nameStyle)}<div class="small dim">${w.votes} vote${w.votes === 1 ? '' : 's'} in matches</div></div></header>
    <dl><dt>Tournaments won</dt><dd>${w.titles}</dd><dt>Contender wins</dt><dd>${w.wins}</dd><dt>Contender losses</dt><dd>${w.losses}</dd><dt>Voted for their own</dt><dd>${w.own}</dd><dt>Jumps this game</dt><dd>${(s.jumps || {})[id] || 0}</dd></dl></article>`;
}
/* a player whose seeds are all out (for the Loser's X special) */
export function allOut(s, id) {
  const b = s.bb; if (!b || !b.rounds.length) return false;
  const mine = b.seeds.map((x, i) => x.by === id ? i : -1).filter(i => i >= 0);
  return mine.length > 0 && mine.every(i => seedOut(b, i));
}
