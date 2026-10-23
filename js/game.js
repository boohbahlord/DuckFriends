/* ---------- the game screen ----------
   Write a question → for each question: the Round Lord's cloud above the board, everyone walks their duck onto a column
   and ends their turn, then talks it over → the round's results (stat boxes; ducks move along their column) → the next
   round, until the players vote to end the game.

   Ducks: WASD or the arrow keys walk your duck; with "Mouse moves your duck" a click walks it there; with "Show multiple
   choice" seven buttons jump it to a column. On a phone held upright the board turns: agree at the top. Your own duck moves
   on your screen at once and is sent to the room a few times a second; everyone else's glides to where they are. */
import { register, go, leaveTo } from './router.js';
import { el, esc, $, $$, openWindow, confirmBox, typing, windowOpen, onMenu, contextMenu, setHTML } from './ui.js';
import { activeRoom } from './net.js';
import { COLS, SHORT, colOf, colX, needed } from './rules.js';
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { rainbowHTML } from './art.js';
import { statBoxHTML, openStats } from './stats.js';
import { profile } from './store.js';
import { openSettings } from './settings.js';
import { openCustomize } from './customize.js';
import { notesWidget, pickNote } from './notes.js';
import { sfx } from './sound.js';

let R = null, S = null, off = null, raf = 0, tick = 0;
let shown = '';            // which phase view is up (phase|round|question)
const keys = new Set();
let me = null;             // my duck here: { x, y, face }
let target = null;         // where a click asked my duck to walk
let lastSend = 0, lastBeep = -1, lastT = 0;
const portrait = () => matchMedia('(orientation: portrait) and (max-width: 760px)').matches;

/* ---------- the board ---------- */
const boardHTML = () => `<div class="board">
  <div class="cols">${COLS.map((c, i) => `<div class="col c${i + 1}" data-c="${i}"><span class="col-name">${esc(c)}<span class="cb-mark">${SHORT[i]}</span></span></div>`).join('')}</div>
  <div class="dock"></div><div class="ducks"></div></div>`;

/* where a duck stands on screen: x along the answers (0 strongly disagree … 1 strongly agree), y across */
function place(p, i, n, rect, dockH, size) {
  const W = rect.width, H = rect.height - dockH;
  if (p.x < 0) return { left: W * (i + 1) / (n + 1), top: H + dockH * .82 };   // the dock: not on the board yet
  if (portrait()) return { left: W * (.12 + p.y * .76), top: H * (1 - p.x) + size * .45 };
  return { left: W * p.x, top: H * (.24 + p.y * .7) };
}
function drawDucks() {
  const board = $('.board', S); if (!board || !R) return;
  const s = R.state, layer = $('.ducks', board), rect = board.getBoundingClientRect(), dockH = $('.dock', board).offsetHeight;
  const ids = s.seat.filter(id => s.pos[id]), docked = ids.filter(id => (id === R.me && me ? me : s.pos[id]).x < 0);
  const size = Math.max(34, Math.min(72, (portrait() ? rect.height / 7 : rect.width / 7) * .62));
  for (const id of ids) {
    const p = s.players[id], pos = id === R.me && me ? me : s.pos[id];
    let d = layer.querySelector(`[data-pid="${id}"]`);
    if (!d) {
      d = el(`<div class="gduck${id === R.me ? ' mine' : ''}" data-pid="${esc(id)}"><div class="gduck-body">${duckSVG(p.duck, { size: 64, title: p.name })}</div><span class="gduck-name">${nameHTML(p.name, p.nameStyle)}</span><span class="gduck-done" hidden>✓</span></div>`);
      layer.append(d);
    }
    d.style.setProperty('--sz', size + 'px');
    const at = place(pos, docked.indexOf(id), docked.length, rect, dockH, size);
    d.style.transform = `translate(${at.left}px, ${at.top}px)`;
    const face = id === R.me && me ? me.face : (d._x !== undefined && pos.x !== d._x ? Math.sign(pos.x - d._x) : d._face || 1);
    d._face = face || 1; d._x = pos.x;
    d.querySelector('.gduck-body').style.transform = `scaleX(${portrait() ? 1 : d._face})`;
    d.querySelector('.gduck-done').hidden = !s.done[id];
  }
  layer.querySelectorAll('.gduck').forEach(d => { if (!s.pos[d.dataset.pid]) d.remove(); });
  // the column under my duck lights up
  const myCol = me && me.x >= 0 ? colOf(me.x) : -1;
  board.querySelectorAll('.col').forEach(c => c.classList.toggle('here', +c.dataset.c === myCol));
}

/* ---------- my duck: keys, a click, or the seven buttons ---------- */
const canMove = () => R && ['answer', 'discuss', 'results'].includes(R.state.phase) && !(R.state.phase === 'answer' && R.state.done[R.me]);
function sendMove(force) {
  const now = performance.now();
  if (!force && now - lastSend < 60) return;
  lastSend = now; R.send({ t: 'move', x: me.x, y: me.y });
}
function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - (lastT || t)) / 1000); lastT = t;
  if (!S || !R || !me || !canMove()) return;
  const s = R.state, results = s.phase === 'results';
  let ax = 0, ay = 0;
  const k = c => keys.has(c);
  const up = k('KeyW') || k('ArrowUp'), down = k('KeyS') || k('ArrowDown'), left = k('KeyA') || k('ArrowLeft'), right = k('KeyD') || k('ArrowRight');
  if (portrait()) { ax = (up ? 1 : 0) - (down ? 1 : 0); ay = (right ? 1 : 0) - (left ? 1 : 0); }
  else { ax = (right ? 1 : 0) - (left ? 1 : 0); ay = (down ? 1 : 0) - (up ? 1 : 0); }
  if (results) ax = 0;   // results: only along your column (up and down; across on a phone held upright)
  if (ax || ay) target = null;
  if (target) {
    const dx = target.x - (me.x < 0 ? .5 : me.x), dy = target.y - me.y, dist = Math.hypot(dx, dy);
    if (dist < .01) target = null; else { ax = dx / dist; ay = dy / dist * 1.4; }
  }
  if (!ax && !ay) return;
  if (me.x < 0) me.x = .5;   // the first step onto the board starts at Neutral
  const spd = target ? .7 : .55;
  if (!results) me.x = Math.max(0, Math.min(1, me.x + ax * spd * dt));
  me.y = Math.max(0, Math.min(1, me.y + ay * .9 * dt));
  if (ax) me.face = Math.sign(ax);
  drawDucks(); sendMove();
}
function jumpTo(c) {
  if (!canMove() || R.state.phase === 'results') return;
  me.face = colX(c) >= (me.x < 0 ? .5 : me.x) ? 1 : -1;
  me.x = colX(c); if (me.y === undefined) me.y = .5; target = null;
  drawDucks(); sendMove(true);
}
function boardClick(e) {
  if (!profile.settings.mouseMove || !canMove()) return;
  const board = e.target.closest('.board'); if (!board) return;
  const r = board.getBoundingClientRect(), dockH = $('.dock', board).offsetHeight, H = r.height - dockH;
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / H;
  if (portrait()) target = { x: Math.max(0, Math.min(1, 1 - py)), y: Math.max(0, Math.min(1, (px - .12) / .76)) };
  else target = { x: Math.max(0, Math.min(1, px)), y: Math.max(0, Math.min(1, (py - .24) / .7)) };
  if (R.state.phase === 'results') target.x = me.x;
}

/* ---------- the views ---------- */
function lordHTML(s) {
  const q = s.qs[s.qi], p = s.players[q.by];
  return `<div class="lord"><div class="lord-cloud">
    <svg class="cloud-svg" viewBox="0 0 200 110" aria-hidden="true"><g fill="#fff" stroke="#c9dcef" stroke-width="3">
      <circle cx="52" cy="66" r="34"/><circle cx="92" cy="46" r="40"/><circle cx="140" cy="58" r="36"/><circle cx="168" cy="76" r="24"/><circle cx="30" cy="82" r="20"/><rect x="30" y="66" width="140" height="34" rx="17"/></g>
      <g fill="#fff"><circle cx="52" cy="66" r="31"/><circle cx="92" cy="46" r="37"/><circle cx="140" cy="58" r="33"/><circle cx="168" cy="76" r="21"/><circle cx="30" cy="82" r="17"/><rect x="32" y="68" width="136" height="30" rx="15"/></g></svg>
    <div class="lord-duck">${p ? duckSVG(p.duck, { size: 70, title: p.name }) : ''}</div></div>
    <div class="lord-label">${rainbowHTML('Round Lord')}</div>
    <div class="lord-name">${p ? nameHTML(p.name, p.nameStyle) : 'Gone'}</div></div>`;
}

function viewSubmit(s) {
  const mineDone = s.done[R.me], sent = (s.subs || []).find(q => q.by === R.me);
  return `<div class="submit-wrap">${mineDone ? `<div class="panel submit-card done-card"><h2>${sent ? 'Question sent ✓' : 'No question this round'}</h2>
      ${sent ? `<p class="q-echo">${esc(sent.text)}</p>` : ''}<p class="dim">Waiting for the others.</p></div>`
    : `<form class="panel submit-card" autocomplete="off"><h2>Your question</h2>
      <textarea maxlength="200" rows="3" placeholder="Pineapple belongs on pizza." aria-label="Your question"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <div class="sect"><h3 data-tip="How long everyone gets to answer your question.">Answer time</h3><div class="row">${[[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s']].map(([v, n]) =>
        `<button type="button" class="tile" data-time="${v}" aria-pressed="${v === s.options.answerTime}">${n}</button>`).join('')}</div></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`}
    <div class="who">${whoHTML(s)}</div></div>`;
}
const whoHTML = s => s.seat.map(id => `<span class="who-chip${s.done[id] ? ' done' : ''}">${duckSVG(s.players[id].duck, { size: 26, shadow: false })}${nameHTML(s.players[id].name, s.players[id].nameStyle)}${s.done[id] ? ' ✓' : ''}</span>`).join('');

function viewBoard(s) {
  const q = s.qs[s.qi];
  return `<div class="stage">${s.phase === 'results' ? '' : `<div class="stage-top"><span></span>${lordHTML(s)}<p class="question">${esc(q.text)}</p></div>`}${boardHTML()}</div>`;
}
/* the stat boxes: this round's, then every round's once the review vote passes (redrawn as clicks and votes come in) */
function statsHTML(s) {
  const boxes = r => s.seat.map(id => statBoxHTML(s, id, r)).join('');
  if (s.phase === 'over') return boxes(null);
  return `<h2>Round ${s.round + 1}</h2><div class="statboxes">${boxes(s.round)}</div>
    ${s.review ? `<h2 class="all-h">All rounds</h2><div class="statboxes">${boxes(null)}</div>` : ''}`;
}
const viewResults = s => `<div class="results">${viewBoard(s)}<aside class="statpanel"></aside></div>`;
const viewOver = s => `<div class="over"><h1 class="over-title">${rainbowHTML('Game over')}</h1>
    <p class="dim">${s.round + 1} round${s.round ? 's' : ''} · ${s.history.length} question${s.history.length === 1 ? '' : 's'}</p>
    <div class="statboxes grid"></div></div>`;

/* the bar at the bottom: what you can do now, and how many are done */
function actHTML(s) {
  const n = s.seat.length, d = s.seat.filter(id => s.done[id]).length, need = needed(s), mine = s.done[R.me];
  const count = `<span class="progress">${d}/${n} done${need < n ? ` · ${need} needed` : ''}</span>`;
  if (s.phase === 'submit') return count;
  if (s.phase === 'answer') {
    const onBoard = (me && me.x >= 0);
    const mc = profile.settings.multipleChoice && !mine ? `<div class="mc">${COLS.map((c, i) => `<button type="button" class="mc-b c${i + 1}" data-col="${i}" data-tip="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : '';
    return `${mc}<div class="act-row"><button type="button" class="btn green" data-a="end"${mine || !onBoard ? ' disabled' : ''}>${mine ? 'Answer locked ✓' : 'End turn'} <kbd>Space</kbd></button>${count}</div>`;
  }
  if (s.phase === 'discuss') return `<div class="act-row"><button type="button" class="btn${mine ? ' yellow' : ' green'}" data-a="end">${mine ? 'Waiting ✓' : 'Next question'} <kbd>Space</kbd></button>${count}</div>`;
  if (s.phase === 'results') {
    const rv = s.seat.filter(id => s.reviewVotes[id]).length, ev = s.seat.filter(id => s.endVotes[id]).length;
    return `<div class="act-row"><button type="button" class="btn${mine ? ' yellow' : ' green'}" data-a="end">${mine ? 'Waiting ✓' : 'Next round'} <kbd>Space</kbd></button>
      ${s.round >= 1 && !s.review ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? ' disabled' : ''} data-tip="Adds every round's stats after this round's. One vote each round.">All-rounds review ${rv}/${need}</button>` : ''}
      <button type="button" class="btn ${s.endVotes[R.me] ? 'red' : 'ghost'}" data-a="endgame">${s.endVotes[R.me] ? 'Voted to end' : 'Vote to end the game'} ${ev}/${need}</button>${count}</div>`;
  }
  if (s.phase === 'over') return `<div class="act-row">${s.hostId === R.me ? '<button type="button" class="btn green" data-a="lobby">Back to the lobby</button>' : '<span class="dim">The host takes everyone back to the lobby.</span>'}<button type="button" class="btn ghost" data-a="leave">Leave</button></div>`;
  return '';
}

const TITLES = { submit: 'Write a question', answer: 'Answer', discuss: 'Talk it over', results: 'Results', over: '' };
function paint(force) {
  if (!S || !R) return;
  const s = R.state, key = [s.phase, s.round, s.qi].join('|');
  if (force || key !== shown) {
    const was = shown; shown = key;
    if (s.phase === 'answer' || (s.phase === 'results' && !was.startsWith('results'))) me = s.pos[R.me] ? { ...s.pos[R.me], face: 1 } : null;
    if (s.phase === 'discuss' && me === null && s.pos[R.me]) me = { ...s.pos[R.me], face: 1 };
    if (s.phase === 'answer' || s.phase === 'results') target = null;
    const main = $('.gmain', S);
    main.dataset.phase = s.phase;
    main.innerHTML = s.phase === 'submit' ? viewSubmit(s) : s.phase === 'results' ? viewResults(s) : s.phase === 'over' ? viewOver(s) : viewBoard(s);
    if (was && s.phase !== was.split('|')[0]) sfx.done();
    $('.round', S).textContent = s.phase === 'over' ? '' : `Round ${s.round + 1}${s.qs.length && ['answer', 'discuss'].includes(s.phase) ? ` · Question ${s.qi + 1} of ${s.qs.length}` : ''}`;
    $('.phase', S).textContent = TITLES[s.phase] || '';
  }
  if (s.phase === 'submit') { setHTML($('.who', S), whoHTML(s)); if (s.done[R.me] && $('form.submit-card', S)) paint(true); }
  if (s.phase === 'answer' && s.done[R.me] && me) { me.x = s.pos[R.me].x; me.y = s.pos[R.me].y; }
  setHTML($('.gact', S), actHTML(s));
  if (s.phase === 'results') {
    const panel = $('.statpanel', S), had = panel._html && panel._html.includes('all-h');
    setHTML(panel, statsHTML(s));
    if (s.review && !had) panel.querySelector('.all-h').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (s.phase === 'over') setHTML($('.over .statboxes', S), statsHTML(s));
  drawDucks(); showTimer();
}

function showTimer() {
  const s = R && R.state, t = S && $('.timer', S); if (!s || !t) return;
  const now = Date.now(), ends = [s.ends, s.catchEnds].filter(Boolean), end = ends.length ? Math.min(...ends) : 0;
  if (!end || !['submit', 'answer'].includes(s.phase)) { t.textContent = ''; t.className = 'timer'; return; }
  const left = Math.max(0, Math.ceil((end - now) / 1000)), catching = s.catchEnds && end === s.catchEnds;
  t.textContent = `${catching ? 'Catch-up ' : ''}${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  t.className = 'timer' + (catching ? ' catch' : '') + (left <= 5 ? ' low' : '');
  if (left <= 5 && left > 0 && left !== lastBeep) { lastBeep = left; sfx.tick(); }
}

/* ---------- the pause menu (top right, or Esc) ---------- */
function openPause() {
  if (windowOpen()) return;
  openWindow(`<h2>Paused</h2><div class="pause-list">
    <button type="button" class="btn green" data-a="resume">Resume</button>
    <button type="button" class="btn ghost" data-a="custom">Customize</button>
    <button type="button" class="btn ghost" data-a="settings">Settings</button>
    <button type="button" class="btn red" data-a="leave">Leave game</button></div>
    <p class="small dim" style="margin-top:.8rem">The game keeps going while this is open.</p>`, {
    cls: 'win-small',
    onOpen: (w, close) => w.querySelector('.pause-list').onclick = e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      close();
      ({ resume() {}, custom: () => openCustomize(), settings: () => openSettings(), leave: () => leaveTo('rooms', 'Leave the game in progress?') })[a.dataset.a]();
    },
  });
}

/* ---------- keys ---------- */
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
function keydown(e) {
  if (!S) return;
  if (e.key === 'Escape' && !windowOpen() && !typing(e)) { e.preventDefault(); openPause(); return; }
  if (typing(e) || windowOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (MOVE_KEYS.includes(e.code) && canMove()) { e.preventDefault(); keys.add(e.code); return; }
  if (e.code === 'Space' && !e.repeat) { e.preventDefault(); act('end'); }
}
const keyup = e => keys.delete(e.code);
const blur = () => keys.clear();

/* ---------- what the buttons do ---------- */
async function act(a, el) {
  const s = R.state;
  switch (a) {
    case 'end':
      if (s.phase === 'answer' && !(me && me.x >= 0)) return;
      if (s.phase === 'answer') sendMove(true);
      if (['answer', 'discuss', 'results'].includes(s.phase)) R.send({ t: 'end' });
      break;
    case 'review': R.send({ t: 'voteReview' }); break;
    case 'endgame': R.send({ t: 'voteEnd' }); break;
    case 'lobby': R.send({ t: 'toLobby' }); break;
    case 'leave': leaveTo('rooms', 'Leave the room?'); break;
    case 'notes': { const t = await pickNote(); const box = $('.submit-card textarea', S); if (t && box) { box.value = t; box.focus(); } break; }
    case 'none': if (await confirmBox('Are you sure?', 'No question from you this round.')) R.send({ t: 'submit', text: '' }); break;
  }
}

register('game', {
  guard: () => !!activeRoom(),
  exit() { const r = activeRoom(); if (r) { r.send({ t: 'leave' }); r.close(); } },
  leave() {
    if (off) off(); off = null; cancelAnimationFrame(raf); clearInterval(tick); S = null; shown = ''; me = null; keys.clear();
    removeEventListener('keydown', keydown); removeEventListener('keyup', keyup); removeEventListener('blur', blur); removeEventListener('resize', drawDucks);
  },
  render(arg) {
    R = arg || activeRoom(); if (!R) return null;
    S = el(`<section class="screen game">
      <header class="gbar"><div class="gbar-l"><span class="round"></span><span class="phase"></span></div>
        <div class="gbar-r"><span class="timer"></span><button type="button" class="btn ghost iconbtn" data-a="pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header>
      <div class="gmain"></div><div class="gact"></div></section>`);
    S.append(notesWidget());
    S.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (b && !b.disabled) { if (b.dataset.a === 'pause') openPause(); else act(b.dataset.a, b); return; }
      const mc = e.target.closest('[data-col]'); if (mc) { jumpTo(+mc.dataset.col); return; }
      const tile = e.target.closest('.submit-card .tile[data-time]');
      if (tile) $$('.submit-card .tile[data-time]', S).forEach(t => t.setAttribute('aria-pressed', t === tile));
      boardClick(e);
    });
    S.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, text = f.querySelector('textarea').value.trim();
      if (!text) { f.querySelector('textarea').focus(); return; }
      const t = f.querySelector('.tile[aria-pressed="true"]');
      R.send({ t: 'submit', text, time: t ? +t.dataset.time : R.state.options.answerTime });
    });
    S.addEventListener('keydown', e => {   // Enter sends the question (Shift+Enter for a new line)
      if (e.target.matches('.submit-card textarea') && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.form.requestSubmit(); }
    });
    onMenu(S, (x, y, e) => {
      const d = e.target.closest && e.target.closest('.gduck, .statbox'); if (!d) return;
      contextMenu(x, y, [['View stats', () => openStats(R.state, d.dataset.pid, R.me)]]);
    });
    off = R.on(s => {
      if (!S) return;
      if (s.phase === 'lobby' || s.phase === 'countdown') { go('lobby', R); return; }
      paint();
    });
    addEventListener('keydown', keydown); addEventListener('keyup', keyup); addEventListener('blur', blur); addEventListener('resize', drawDucks);
    raf = requestAnimationFrame(loop);
    tick = setInterval(showTimer, 250);
    requestAnimationFrame(() => paint(true));
    return S;
  },
});
